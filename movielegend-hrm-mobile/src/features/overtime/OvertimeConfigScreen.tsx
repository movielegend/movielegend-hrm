import { useRoute } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Text, TextInput, useTheme } from 'react-native-paper';
import { deptOvertimeConfigApi, DeptOvertimeConfig } from '../../api/dept-overtime-config.api';
import { departmentsApi } from '../../api/departments.api';
import { useSnackbar } from '../../hooks/useSnackbar';
import { SafeAreaView } from 'react-native-safe-area-context';

export function OvertimeConfigScreen() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>('');
  const [config, setConfig] = useState<Partial<DeptOvertimeConfig>>({});
  const [loading, setLoading] = useState(false);
  const { showSnackbar } = useSnackbar();
  const theme = useTheme();

  useEffect(() => {
    loadDepartments();
  }, []);

  useEffect(() => {
    if (selectedDept) loadConfig(selectedDept);
  }, [selectedDept]);

  const loadDepartments = async () => {
    try {
      const depts = await departmentsApi.findAll();
      setDepartments(depts);
      if (depts.length > 0) setSelectedDept(depts[0].id);
    } catch (e) {
      showSnackbar('Lỗi tải danh sách phòng ban', 'error');
    }
  };

  const loadConfig = async (deptId: string) => {
    setLoading(true);
    try {
      const data = await deptOvertimeConfigApi.findByDepartment(deptId);
      if (data) setConfig(data);
      else setConfig({ departmentId: deptId }); // reset to defaults
    } catch (e) {
      // Not found is fine, will create new
      setConfig({ departmentId: deptId });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await deptOvertimeConfigApi.upsert({ ...config, departmentId: selectedDept });
      showSnackbar('Đã lưu cấu hình', 'success');
    } catch (e) {
      showSnackbar('Lỗi lưu cấu hình', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text variant="titleLarge" style={styles.title}>Cấu hình Tăng ca & Đi muộn</Text>

        {/* Dummy Department Selector for simplicity */}
        <Text variant="bodyLarge">Chọn phòng ban (Demo ID):</Text>
        <TextInput 
          value={selectedDept} 
          onChangeText={setSelectedDept} 
          placeholder="Nhập ID phòng ban..."
          style={styles.input}
        />

        {loading ? <ActivityIndicator style={{marginTop: 20}} /> : (
          <View style={styles.form}>
            <TextInput label="Hệ số ngày thường (VD: 1.5)" value={String(config.weekdayMultiplier || 1.5)} onChangeText={t => setConfig({...config, weekdayMultiplier: Number(t)})} style={styles.input} keyboardType="numeric" />
            <TextInput label="Hệ số cuối tuần (VD: 2.0)" value={String(config.weekendMultiplier || 2.0)} onChangeText={t => setConfig({...config, weekendMultiplier: Number(t)})} style={styles.input} keyboardType="numeric" />
            <TextInput label="Hệ số Lễ/Tết (VD: 3.0)" value={String(config.holidayMultiplier || 3.0)} onChangeText={t => setConfig({...config, holidayMultiplier: Number(t)})} style={styles.input} keyboardType="numeric" />
            <TextInput label="Giờ bắt đầu làm đêm (VD: 21)" value={String(config.nightStartHour || 21)} onChangeText={t => setConfig({...config, nightStartHour: Number(t)})} style={styles.input} keyboardType="numeric" />
            <TextInput label="Phụ cấp làm đêm (VNĐ)" value={String(config.nightAllowanceAmount || 50000)} onChangeText={t => setConfig({...config, nightAllowanceAmount: Number(t)})} style={styles.input} keyboardType="numeric" />
            <TextInput label="Số phút cho phép đi muộn" value={String(config.lateThresholdMinutes || 5)} onChangeText={t => setConfig({...config, lateThresholdMinutes: Number(t)})} style={styles.input} keyboardType="numeric" />
            <TextInput label="Tiền phạt đi muộn (VNĐ)" value={String(config.lateDeductionAmount || 50000)} onChangeText={t => setConfig({...config, lateDeductionAmount: Number(t)})} style={styles.input} keyboardType="numeric" />

            <Button mode="contained" onPress={handleSave} style={styles.btn}>Lưu Cấu Hình</Button>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { padding: 16 },
  title: { marginBottom: 16, fontWeight: 'bold' },
  input: { marginBottom: 12 },
  form: { marginTop: 16 },
  btn: { marginTop: 16 }
});
