import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View, Pressable } from 'react-native';
import { ActivityIndicator, Button, Text, TextInput, useTheme, Checkbox, Surface, Divider } from 'react-native-paper';
import { deptOvertimeConfigApi, DeptOvertimeConfig } from '../../api/dept-overtime-config.api';
import { getDepartments } from '../../api/departments.api';
import { useSnackbar } from '../../hooks/useSnackbar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export function OvertimeConfigScreen() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDepts, setSelectedDepts] = useState<string[]>([]);
  const [config, setConfig] = useState<Partial<DeptOvertimeConfig>>({
    weekdayMultiplier: 1.5,
    weekendMultiplier: 2.0,
    holidayMultiplier: 3.0,
    nightStartHour: 21,
    nightAllowanceAmount: 50000,
    lateThresholdMinutes: 5,
    lateDeductionAmount: 50000,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { showSnackbar } = useSnackbar();

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      const response = await getDepartments();
      const depts = response.items;
      setDepartments(depts);
      if (depts.length > 0) setSelectedDepts([depts[0].id]);
    } catch (e) {
      showSnackbar('Lỗi tải danh sách phòng ban', 'error');
    }
  };

  useEffect(() => {
    if (selectedDepts.length === 1) {
      loadConfig(selectedDepts[0]);
    }
  }, [selectedDepts]);

  const loadConfig = async (deptId: string) => {
    setLoading(true);
    try {
      const data = await deptOvertimeConfigApi.findByDepartment(deptId);
      if (data) setConfig(data);
    } catch (e) {
      // It's okay if not found
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (selectedDepts.length === 0) {
      showSnackbar('Vui lòng chọn ít nhất 1 phòng ban', 'warning');
      return;
    }
    setSaving(true);
    try {
      await Promise.all(
        selectedDepts.map(deptId => 
          deptOvertimeConfigApi.upsert({ ...config, departmentId: deptId })
        )
      );
      showSnackbar(`Đã lưu cấu hình cho ${selectedDepts.length} phòng ban`, 'success');
    } catch (e) {
      showSnackbar('Lỗi khi lưu cấu hình', 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggleDept = (deptId: string) => {
    setSelectedDepts(prev => 
      prev.includes(deptId) ? prev.filter(id => id !== deptId) : [...prev, deptId]
    );
  };

  const selectAll = () => {
    setSelectedDepts(departments.map(d => d.id));
  };

  const deselectAll = () => {
    setSelectedDepts([]);
  };

  const inputTheme = { colors: { primary: '#18181b', background: '#fafafa' } };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text variant="headlineSmall" style={styles.title}>Cấu hình Tăng ca & Đi muộn</Text>
          <Text variant="bodyMedium" style={styles.subtitle}>Thiết lập hệ số và quy định đi muộn cho các phòng ban.</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
              <MaterialCommunityIcons name="domain" size={20} color="#18181b" />
              <Text variant="titleMedium" style={styles.sectionTitle}>Chọn phòng ban áp dụng</Text>
            </View>
            <View style={styles.actionsRow}>
              <Pressable onPress={selectAll}><Text style={styles.actionText}>Tất cả</Text></Pressable>
              <Text style={styles.separator}>|</Text>
              <Pressable onPress={deselectAll}><Text style={styles.actionText}>Bỏ chọn</Text></Pressable>
            </View>
          </View>
          <View style={styles.checkboxContainer}>
            {departments.length === 0 ? <ActivityIndicator color="#18181b" style={{margin: 10}}/> : null}
            {departments.map(dept => (
              <Pressable key={dept.id} style={styles.checkboxRow} onPress={() => toggleDept(dept.id)}>
                <Checkbox.Android
                  status={selectedDepts.includes(dept.id) ? 'checked' : 'unchecked'}
                  onPress={() => toggleDept(dept.id)}
                  color="#18181b"
                  uncheckedColor="#a1a1aa"
                />
                <Text style={[styles.deptName, selectedDepts.includes(dept.id) && styles.deptNameActive]}>{dept.name}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
              <MaterialCommunityIcons name="cog-outline" size={20} color="#18181b" />
              <Text variant="titleMedium" style={styles.sectionTitle}>Cấu hình chi tiết</Text>
            </View>
          </View>
          
          {loading ? <ActivityIndicator color="#18181b" style={{marginTop: 30, marginBottom: 30}} /> : (
            <View style={styles.form}>
              <Text variant="labelMedium" style={styles.groupLabel}>TĂNG CA & NGOÀI GIỜ</Text>
              <View style={styles.inputRow}>
                <TextInput theme={inputTheme} outlineColor="#e4e4e7" mode="outlined" label="Ngày thường (Hệ số)" value={String(config.weekdayMultiplier || '')} onChangeText={t => setConfig({...config, weekdayMultiplier: Number(t)})} style={styles.flex1} keyboardType="numeric" />
                <View style={{width: 12}} />
                <TextInput theme={inputTheme} outlineColor="#e4e4e7" mode="outlined" label="Cuối tuần (Hệ số)" value={String(config.weekendMultiplier || '')} onChangeText={t => setConfig({...config, weekendMultiplier: Number(t)})} style={styles.flex1} keyboardType="numeric" />
              </View>
              <TextInput theme={inputTheme} outlineColor="#e4e4e7" mode="outlined" label="Ngày Lễ/Tết (Hệ số)" value={String(config.holidayMultiplier || '')} onChangeText={t => setConfig({...config, holidayMultiplier: Number(t)})} style={styles.input} keyboardType="numeric" />
              
              <Divider style={styles.divider} />
              
              <Text variant="labelMedium" style={styles.groupLabel}>LÀM ĐÊM</Text>
              <View style={styles.inputRow}>
                <TextInput theme={inputTheme} outlineColor="#e4e4e7" mode="outlined" label="Giờ bắt đầu làm đêm" value={String(config.nightStartHour || '')} onChangeText={t => setConfig({...config, nightStartHour: Number(t)})} style={styles.flex1} keyboardType="numeric" right={<TextInput.Affix text="Giờ" />} />
                <View style={{width: 12}} />
                <TextInput theme={inputTheme} outlineColor="#e4e4e7" mode="outlined" label="Phụ cấp làm đêm" value={String(config.nightAllowanceAmount || '')} onChangeText={t => setConfig({...config, nightAllowanceAmount: Number(t)})} style={styles.flex1} keyboardType="numeric" right={<TextInput.Affix text="VNĐ" />} />
              </View>

              <Divider style={styles.divider} />

              <Text variant="labelMedium" style={styles.groupLabel}>ĐI MUỘN</Text>
              <View style={styles.inputRow}>
                <TextInput theme={inputTheme} outlineColor="#e4e4e7" mode="outlined" label="Số phút châm trước" value={String(config.lateThresholdMinutes || '')} onChangeText={t => setConfig({...config, lateThresholdMinutes: Number(t)})} style={styles.flex1} keyboardType="numeric" right={<TextInput.Affix text="Phút" />} />
                <View style={{width: 12}} />
                <TextInput theme={inputTheme} outlineColor="#e4e4e7" mode="outlined" label="Tiền phạt đi muộn" value={String(config.lateDeductionAmount || '')} onChangeText={t => setConfig({...config, lateDeductionAmount: Number(t)})} style={styles.flex1} keyboardType="numeric" right={<TextInput.Affix text="VNĐ" />} />
              </View>

              <Button 
                mode="contained" 
                onPress={handleSave} 
                style={styles.saveBtn} 
                buttonColor="#18181b"
                textColor="#ffffff"
                loading={saving} 
                disabled={saving || selectedDepts.length === 0} 
                contentStyle={styles.saveBtnContent}
                labelStyle={styles.saveBtnLabel}
              >
                Lưu Cấu Hình ({selectedDepts.length} PB)
              </Button>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f4f5' },
  scroll: { padding: 16, paddingBottom: 40 },
  header: { marginBottom: 24, paddingHorizontal: 4 },
  title: { fontWeight: '900', color: '#18181b', marginBottom: 6, letterSpacing: -0.5 },
  subtitle: { color: '#71717a' },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e4e4e7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: '800',
    color: '#18181b',
    letterSpacing: -0.3,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 13,
    color: '#52525b',
    fontWeight: '600',
  },
  separator: {
    marginHorizontal: 8,
    color: '#d4d4d8',
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
    paddingHorizontal: 4,
  },
  deptName: {
    fontSize: 14,
    color: '#71717a',
    flex: 1,
    fontWeight: '500',
  },
  deptNameActive: {
    color: '#18181b',
    fontWeight: '700',
  },
  form: { marginTop: 4 },
  groupLabel: {
    color: '#a1a1aa',
    marginBottom: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  input: { marginBottom: 20, backgroundColor: '#ffffff', fontSize: 14 },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  flex1: {
    flex: 1,
    backgroundColor: '#ffffff',
    fontSize: 14,
  },
  divider: {
    marginVertical: 20,
    backgroundColor: '#f4f4f5',
    height: 1,
  },
  saveBtn: {
    marginTop: 12,
    borderRadius: 12,
  },
  saveBtnContent: {
    paddingVertical: 8,
  },
  saveBtnLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  }
});
