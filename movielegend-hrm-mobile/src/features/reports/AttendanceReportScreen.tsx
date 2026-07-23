import React, { useState } from 'react';
import { ScrollView, StyleSheet, View, Linking } from 'react-native';
import { ActivityIndicator, Button, Text, TextInput, useTheme } from 'react-native-paper';
import { reportsApi } from '../../api/reports.api';
import { useSnackbar } from '../../hooks/useSnackbar';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';

export function AttendanceReportScreen() {
  const [startDate, setStartDate] = useState('2026-07-01');
  const [endDate, setEndDate] = useState('2026-07-31');
  const [departmentId, setDepartmentId] = useState('');
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const { showSnackbar } = useSnackbar();

  const handleExport = async () => {
    try {
      setLoading(true);
      const url = await reportsApi.getAttendanceDetailExcelUrl({ startDate, endDate, departmentId, userId });
      await WebBrowser.openBrowserAsync(url);
    } catch (e) {
      showSnackbar('Lỗi xuất Excel', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text variant="titleLarge" style={styles.title}>Báo cáo & Xuất Excel</Text>
        
        <View style={styles.form}>
          <TextInput label="Từ ngày (YYYY-MM-DD)" value={startDate} onChangeText={setStartDate} style={styles.input} />
          <TextInput label="Đến ngày (YYYY-MM-DD)" value={endDate} onChangeText={setEndDate} style={styles.input} />
          <TextInput label="Lọc theo Phòng ban ID (tuỳ chọn)" value={departmentId} onChangeText={setDepartmentId} style={styles.input} />
          <TextInput label="Lọc theo User ID (tuỳ chọn)" value={userId} onChangeText={setUserId} style={styles.input} />

          <Button mode="contained" icon="file-excel" onPress={handleExport} loading={loading} disabled={loading} style={styles.btn}>
            Xuất Excel Chấm Công
          </Button>
        </View>
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
  btn: { marginTop: 24, paddingVertical: 8 }
});
