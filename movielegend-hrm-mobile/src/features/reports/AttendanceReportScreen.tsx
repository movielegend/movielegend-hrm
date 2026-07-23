import React, { useState, useEffect, useMemo } from 'react';
import { ScrollView, StyleSheet, View, Pressable } from 'react-native';
import { ActivityIndicator, Button, Text, TextInput, Checkbox, Surface, Divider, useTheme } from 'react-native-paper';
import { reportsApi } from '../../api/reports.api';
import { getDepartments } from '../../api/departments.api';
import { getScopedEmployees } from '../../api/employees.api';
import { useSnackbar } from '../../hooks/useSnackbar';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
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
      await WebBrowser.openBrowserAsync(url);
    } catch (e) {
      showSnackbar('Lỗi xuất Excel', 'error');
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

  const inputTheme = { colors: { primary: '#6d28d9', background: '#fafafa' } };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text variant="headlineSmall" style={styles.title}>Báo cáo & Xuất Excel</Text>
          <Text variant="bodyMedium" style={styles.subtitle}>Xuất bảng chấm công chi tiết theo phòng ban và nhân sự.</Text>
        </View>

        <Surface style={styles.card} elevation={2}>
          <View style={styles.sectionHeader}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
              <MaterialCommunityIcons name="calendar-range" size={22} color="#6d28d9" />
              <Text variant="titleMedium" style={styles.sectionTitle}>1. Thời gian</Text>
            </View>
          </View>
          <View style={styles.dateRow}>
            <TextInput theme={inputTheme} mode="outlined" label="Từ ngày" value={startDate} onChangeText={setStartDate} style={styles.flex1} />
            <View style={{width: 12}} />
            <TextInput theme={inputTheme} mode="outlined" label="Đến ngày" value={endDate} onChangeText={setEndDate} style={styles.flex1} />
          </View>
          <Text style={styles.hint}>Định dạng ngày: YYYY-MM-DD</Text>
        </Surface>

        <Surface style={styles.card} elevation={2}>
          <View style={styles.sectionHeader}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
              <MaterialCommunityIcons name="domain" size={22} color="#6d28d9" />
              <Text variant="titleMedium" style={styles.sectionTitle}>2. Chọn phòng ban</Text>
            </View>
            <View style={styles.actionsRow}>
              <Pressable onPress={selectAllDepts}><Text style={[styles.actionText, {color: '#6d28d9'}]}>Tất cả</Text></Pressable>
              <Text style={styles.separator}>|</Text>
              <Pressable onPress={deselectAllDepts}><Text style={styles.actionText}>Bỏ chọn</Text></Pressable>
            </View>
          </View>
          <View style={styles.checkboxContainer}>
            {loading ? <ActivityIndicator color="#6d28d9" style={{margin: 10}}/> : null}
            {departments.map(dept => (
              <Pressable key={dept.id} style={styles.checkboxRow} onPress={() => toggleDept(dept.id)}>
                <Checkbox.Android
                  status={selectedDepts.includes(dept.id) ? 'checked' : 'unchecked'}
                  onPress={() => toggleDept(dept.id)}
                  color="#6d28d9"
                />
                <Text style={styles.itemName}>{dept.name}</Text>
              </Pressable>
            ))}
          </View>
        </Surface>

        <Surface style={styles.card} elevation={2}>
          <View style={styles.sectionHeader}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
              <MaterialCommunityIcons name="account-group" size={22} color="#6d28d9" />
              <Text variant="titleMedium" style={styles.sectionTitle}>3. Nhân sự áp dụng ({selectedUsers.length}/{displayedUsers.length})</Text>
            </View>
          </View>
          <View style={styles.userListContainer}>
            {loading ? <ActivityIndicator color="#6d28d9" style={{margin: 10}}/> : null}
            {!loading && displayedUsers.length === 0 && <Text style={styles.emptyText}>Không có nhân sự nào</Text>}
            {displayedUsers.map(user => (
              <Pressable key={user.id} style={styles.userRow} onPress={() => toggleUser(user.id)}>
                <Checkbox.Android
                  status={selectedUsers.includes(user.id) ? 'checked' : 'unchecked'}
                  onPress={() => toggleUser(user.id)}
                  color="#6d28d9"
                />
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{user.fullName || user.userCode}</Text>
                  <Text style={styles.userEmail}>{user.department?.name || 'Không thuộc phòng ban'}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        </Surface>

        <Button 
          mode="contained" 
          icon="file-excel" 
          onPress={handleExport} 
          loading={exporting} 
          disabled={exporting} 
          style={styles.exportBtn}
          contentStyle={styles.exportBtnContent}
          buttonColor="#6d28d9"
        >
          Xuất Excel Chấm Công
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scroll: { padding: 16, paddingBottom: 40 },
  header: { marginBottom: 20 },
  title: { fontWeight: '900', color: '#0f172a', marginBottom: 4 },
  subtitle: { color: '#64748b' },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#6d28d9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: '#0f172a',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  separator: {
    marginHorizontal: 8,
    color: '#cbd5e1',
  },
  dateRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  flex1: {
    flex: 1,
    backgroundColor: '#ffffff'
  },
  hint: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
    marginLeft: 4,
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
    paddingVertical: 6,
  },
  itemName: {
    fontSize: 14,
    color: '#334155',
    flex: 1,
    fontWeight: '500',
  },
  userListContainer: {
    marginTop: 4,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  userInfo: {
    marginLeft: 8,
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
  },
  userEmail: {
    fontSize: 13,
    color: '#64748b',
  },
  emptyText: {
    color: '#94a3b8',
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 12,
  },
  exportBtn: {
    marginTop: 8,
    borderRadius: 12,
    shadowColor: '#6d28d9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  exportBtnContent: {
    paddingVertical: 8,
  }
});
