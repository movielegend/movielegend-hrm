import React, { useState, useEffect, useMemo } from 'react';
import { ScrollView, StyleSheet, View, Pressable, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ActivityIndicator, Button, Text, TextInput, Checkbox, Surface, Divider, useTheme, Portal, Modal } from 'react-native-paper';
import { reportsApi } from '../../api/reports.api';
import { getDepartments } from '../../api/departments.api';
import { getScopedEmployees } from '../../api/employees.api';
import { useSnackbar } from '../../hooks/useSnackbar';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const getFormattedDate = (date: Date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export function AttendanceReportScreen() {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return getFormattedDate(d);
  });
  const [endDate, setEndDate] = useState(() => getFormattedDate(new Date()));
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  
  const [departments, setDepartments] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  
  const [selectedDepts, setSelectedDepts] = useState<string[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  
  const { showSnackbar } = useSnackbar();
  const theme = useTheme();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [deptRes, userRes] = await Promise.all([
        getDepartments(),
        getScopedEmployees({ limit: 100 })
      ]);
      setDepartments(deptRes.items || []);
      setUsers(userRes.items || []);
    } catch (e) {
      showSnackbar('Lỗi tải dữ liệu phòng ban / nhân sự', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!startDate || !endDate) {
      showSnackbar('Vui lòng chọn ngày hợp lệ', 'warning');
      return;
    }
    try {
      setExporting(true);
      const url = await reportsApi.getAttendanceDetailExcelUrl({ 
        startDate, 
        endDate, 
        departmentId: selectedDepts, 
        userId: selectedUsers 
      });
      
      if (Platform.OS === 'web') {
        window.open(url, '_blank');
      } else {
        const fileUri = `${FileSystem.documentDirectory}bang-cham-cong-${startDate}.xlsx`;
        const { uri, status } = await FileSystem.downloadAsync(url, fileUri, {
          headers: {
            'ngrok-skip-browser-warning': 'true'
          }
        });
        
        if (status === 200) {
          const canShare = await Sharing.isAvailableAsync();
          if (canShare) {
            await Sharing.shareAsync(uri, {
              mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              dialogTitle: 'Mở Bảng Chấm Công'
            });
          } else {
            showSnackbar('Thiết bị không hỗ trợ mở file', 'warning');
          }
        } else {
          showSnackbar(`Tải file thất bại (HTTP ${status})`, 'error');
        }
      }
    } catch (e: any) {
      showSnackbar(`Lỗi xuất Excel: ${e.message}`, 'error');
    } finally {
      setExporting(false);
    }
  };

  const toggleDept = (deptId: string) => {
    setSelectedDepts(prev => {
      const isSelected = prev.includes(deptId);
      const newSelected = isSelected ? prev.filter(id => id !== deptId) : [...prev, deptId];
      
      // Auto-update users
      if (!isSelected) {
        // Automatically check users in this department
        const usersInDept = users.filter(u => u.department?.id === deptId).map(u => u.id);
        setSelectedUsers(curr => Array.from(new Set([...curr, ...usersInDept])));
      } else {
        // Automatically uncheck users in this department
        const usersInDept = users.filter(u => u.department?.id === deptId).map(u => u.id);
        setSelectedUsers(curr => curr.filter(id => !usersInDept.includes(id)));
      }
      
      return newSelected;
    });
  };

  const toggleUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const selectAllDepts = () => {
    const allDeptIds = departments.map(d => d.id);
    setSelectedDepts(allDeptIds);
    setSelectedUsers(users.map(u => u.id));
  };

  const deselectAllDepts = () => {
    setSelectedDepts([]);
    setSelectedUsers([]);
  };

  // Filter users to only show those in selected departments (or all if none selected)
  const displayedUsers = useMemo(() => {
    if (selectedDepts.length > 0) {
      return users.filter(u => u.department?.id && selectedDepts.includes(u.department.id));
    }
    return users;
  }, [users, selectedDepts]);

  const inputTheme = { colors: { primary: '#000000', background: '#ffffff', onSurfaceVariant: '#666666' } };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.title}>Báo cáo Chấm công</Text>
          <Text variant="bodyMedium" style={styles.subtitle}>Xuất bảng công chi tiết với bộ lọc nâng cao.</Text>
        </View>

        <Surface style={styles.card} elevation={0}>
          <View style={styles.sectionHeader}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
              <View style={styles.iconWrapper}><MaterialCommunityIcons name="calendar-month-outline" size={20} color="#000000" /></View>
              <Text variant="titleMedium" style={styles.sectionTitle}>1. Thời gian áp dụng</Text>
            </View>
          </View>
          <View style={styles.dateRow}>
            <Pressable style={styles.flex1} onPress={() => setShowStartPicker(true)}>
              <View pointerEvents="none">
                <TextInput 
                  theme={inputTheme} 
                  mode="outlined" 
                  label="Từ ngày" 
                  value={startDate} 
                  outlineColor="#e5e5e5" 
                  activeOutlineColor="#000000" 
                  right={<TextInput.Icon icon="calendar" color="#666666" />}
                  editable={false}
                />
              </View>
            </Pressable>
            
            <View style={{width: 12}} />
            
            <Pressable style={styles.flex1} onPress={() => setShowEndPicker(true)}>
              <View pointerEvents="none">
                <TextInput 
                  theme={inputTheme} 
                  mode="outlined" 
                  label="Đến ngày" 
                  value={endDate} 
                  outlineColor="#e5e5e5" 
                  activeOutlineColor="#000000" 
                  right={<TextInput.Icon icon="calendar" color="#666666" />}
                  editable={false}
                />
              </View>
            </Pressable>
          </View>
          
          {showStartPicker && Platform.OS !== 'android' ? (
            <Portal>
              <Modal visible={showStartPicker} onDismiss={() => setShowStartPicker(false)} contentContainerStyle={styles.modalContent}>
                <Text variant="titleMedium" style={styles.modalTitle}>Chọn Từ ngày</Text>
                <DateTimePicker
                  value={new Date(startDate)}
                  mode="date"
                  display="inline"
                  onChange={(event: any, date?: Date) => {
                    if (date) setStartDate(getFormattedDate(date));
                  }}
                  style={{ alignSelf: 'center' }}
                />
                <Button mode="contained" onPress={() => setShowStartPicker(false)} buttonColor="#000000" style={{marginTop: 16}}>Xong</Button>
              </Modal>
            </Portal>
          ) : showStartPicker && Platform.OS === 'android' ? (
            <DateTimePicker
              value={new Date(startDate)}
              mode="date"
              display="default"
              onChange={(event: any, date?: Date) => {
                setShowStartPicker(false);
                if (date) setStartDate(getFormattedDate(date));
              }}
            />
          ) : null}
          
          {showEndPicker && Platform.OS !== 'android' ? (
            <Portal>
              <Modal visible={showEndPicker} onDismiss={() => setShowEndPicker(false)} contentContainerStyle={styles.modalContent}>
                <Text variant="titleMedium" style={styles.modalTitle}>Chọn Đến ngày</Text>
                <DateTimePicker
                  value={new Date(endDate)}
                  mode="date"
                  display="inline"
                  onChange={(event: any, date?: Date) => {
                    if (date) setEndDate(getFormattedDate(date));
                  }}
                  style={{ alignSelf: 'center' }}
                />
                <Button mode="contained" onPress={() => setShowEndPicker(false)} buttonColor="#000000" style={{marginTop: 16}}>Xong</Button>
              </Modal>
            </Portal>
          ) : showEndPicker && Platform.OS === 'android' ? (
            <DateTimePicker
              value={new Date(endDate)}
              mode="date"
              display="default"
              onChange={(event: any, date?: Date) => {
                setShowEndPicker(false);
                if (date) setEndDate(getFormattedDate(date));
              }}
            />
          ) : null}
          <Text style={styles.hint}>Định dạng ngày: YYYY-MM-DD</Text>
        </Surface>

        <Surface style={styles.card} elevation={0}>
          <View style={styles.sectionHeader}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
              <View style={styles.iconWrapper}><MaterialCommunityIcons name="domain" size={20} color="#000000" /></View>
              <Text variant="titleMedium" style={styles.sectionTitle}>2. Bộ lọc phòng ban</Text>
            </View>
            <View style={styles.actionsRow}>
              <Pressable onPress={selectAllDepts}><Text style={[styles.actionText, {color: '#000000', fontWeight: 'bold'}]}>Chọn tất cả</Text></Pressable>
              <Text style={styles.separator}>/</Text>
              <Pressable onPress={deselectAllDepts}><Text style={styles.actionText}>Bỏ chọn</Text></Pressable>
            </View>
          </View>
          <View style={styles.checkboxContainer}>
            {loading ? <ActivityIndicator color="#000000" style={{margin: 10}}/> : null}
            {departments.map(dept => (
              <Pressable key={dept.id} style={styles.checkboxRow} onPress={() => toggleDept(dept.id)}>
                <Checkbox.Android
                  status={selectedDepts.includes(dept.id) ? 'checked' : 'unchecked'}
                  onPress={() => toggleDept(dept.id)}
                  color="#000000"
                  uncheckedColor="#a3a3a3"
                />
                <Text style={[styles.itemName, selectedDepts.includes(dept.id) && {fontWeight: 'bold', color: '#000000'}]}>{dept.name}</Text>
              </Pressable>
            ))}
          </View>
        </Surface>

        <Surface style={styles.card} elevation={0}>
          <View style={styles.sectionHeader}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
              <View style={styles.iconWrapper}><MaterialCommunityIcons name="account-group-outline" size={20} color="#000000" /></View>
              <Text variant="titleMedium" style={styles.sectionTitle}>3. Danh sách nhân sự ({selectedUsers.length}/{displayedUsers.length})</Text>
            </View>
          </View>
          <View style={styles.userListContainer}>
            {loading ? <ActivityIndicator color="#000000" style={{margin: 10}}/> : null}
            {!loading && displayedUsers.length === 0 && <Text style={styles.emptyText}>Không có nhân sự nào được tìm thấy</Text>}
            {displayedUsers.map(user => (
              <Pressable key={user.id} style={[styles.userRow, selectedUsers.includes(user.id) && styles.userRowActive]} onPress={() => toggleUser(user.id)}>
                <Checkbox.Android
                  status={selectedUsers.includes(user.id) ? 'checked' : 'unchecked'}
                  onPress={() => toggleUser(user.id)}
                  color="#000000"
                  uncheckedColor="#a3a3a3"
                />
                <View style={styles.userInfo}>
                  <Text style={[styles.userName, selectedUsers.includes(user.id) && {fontWeight: 'bold', color: '#000000'}]}>{user.fullName || user.userCode}</Text>
                  <Text style={styles.userEmail}>{user.department?.name || 'Không thuộc phòng ban'}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        </Surface>

        <Button 
          mode="contained" 
          icon="file-excel-outline" 
          onPress={handleExport} 
          loading={exporting} 
          disabled={exporting} 
          style={styles.exportBtn}
          contentStyle={styles.exportBtnContent}
          buttonColor="#000000"
          textColor="#ffffff"
        >
          Trích xuất dữ liệu Excel
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9' },
  scroll: { padding: 16, paddingBottom: 40 },
  header: { marginBottom: 24, paddingHorizontal: 4 },
  title: { fontWeight: '900', color: '#111111', marginBottom: 4, letterSpacing: -0.5 },
  subtitle: { color: '#666666', fontSize: 14 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#eaeaea',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  iconWrapper: {
    backgroundColor: '#f5f5f5',
    padding: 6,
    borderRadius: 8,
  },
  sectionTitle: {
    fontWeight: '800',
    color: '#000000',
    fontSize: 15,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 13,
    color: '#777777',
    fontWeight: '500',
  },
  separator: {
    marginHorizontal: 8,
    color: '#dddddd',
  },
  dateRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  flex1: {
    flex: 1,
    backgroundColor: '#ffffff',
    fontSize: 14,
  },
  hint: {
    fontSize: 12,
    color: '#999999',
    marginTop: 8,
    marginLeft: 4,
    fontStyle: 'italic',
  },
  checkboxContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    paddingVertical: 4,
  },
  itemName: {
    fontSize: 14,
    color: '#444444',
    flex: 1,
  },
  userListContainer: {
    marginTop: 0,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 4,
  },
  userRowActive: {
    backgroundColor: '#fafafa',
  },
  userInfo: {
    flex: 1,
    marginLeft: 4,
  },
  userName: {
    fontSize: 14,
    color: '#333333',
  },
  userEmail: {
    fontSize: 12,
    color: '#888888',
    marginTop: 2,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999999',
    fontStyle: 'italic',
    padding: 20,
  },
  exportBtn: {
    marginTop: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  exportBtnContent: {
    height: 52,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    padding: 24,
    margin: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#000000',
  }
});
