import React, { useState, useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

import { Screen } from '../../components/Screen';
import { PageHeader } from '../../components/PageHeader';
import { PrimaryButton } from '../../components/Buttons';
import { SelectModal, SelectOption } from '../../components/SelectModal';

import { useAuth } from '../../providers/AuthProvider';
import { useShifts, useAssignShift } from '../../hooks/useShifts';
import { useScopedEmployees } from '../../hooks/useEmployees';

import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { normalizeApiError } from '../../utils/api-error';

export function AssignShiftScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  // Queries
  const shiftsQuery = useShifts();
  // Fetch employees scoped to current user (Admin gets all, Leader gets their department)
  const employeesQuery = useScopedEmployees({ page: 1, limit: 100 });
  const assignMutation = useAssignShift();

  // State
  const [selectedEmployee, setSelectedEmployee] = useState<SelectOption | null>(null);
  const [selectedShift, setSelectedShift] = useState<SelectOption | null>(null);
  const [workDate, setWorkDate] = useState<Date>(new Date());
  
  // Modal visibility states
  const [employeeModalVisible, setEmployeeModalVisible] = useState(false);
  const [shiftModalVisible, setShiftModalVisible] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Mappers
  const employeeOptions: SelectOption[] = useMemo(() => {
    if (!employeesQuery.data?.items) return [];
    return employeesQuery.data.items.map(emp => ({
      id: emp.id,
      label: emp.fullName ?? emp.userCode,
      subtitle: `${emp.position?.name ?? 'Nhân viên'} - ${emp.department?.name ?? 'Chưa phân phòng'}`,
      // We attach the raw object so we can extract departmentId later
      raw: emp,
    }));
  }, [employeesQuery.data]);

  const shiftOptions: SelectOption[] = useMemo(() => {
    if (!shiftsQuery.data) return [];
    return shiftsQuery.data.filter(s => s.isActive).map(s => ({
      id: s.id,
      label: s.name,
      subtitle: `${s.startTime} - ${s.endTime}`,
    }));
  }, [shiftsQuery.data]);

  const handleSubmit = async () => {
    if (!selectedEmployee || !selectedShift) return;

    // Get the departmentId from the selected employee's raw data
    const empRaw = (selectedEmployee as any).raw;
    const departmentId = empRaw?.department?.id;

    if (!departmentId) {
      Alert.alert('Lỗi', 'Nhân viên này chưa thuộc phòng ban nào, không thể phân ca.');
      return;
    }

    try {
      await assignMutation.mutateAsync({
        userId: selectedEmployee.id,
        departmentId: departmentId as string,
        shiftId: selectedShift.id,
        workDate: workDate.toISOString().split('T')[0] as string, // YYYY-MM-DD
      });
      
      Alert.alert('Thành công', 'Đã phân ca thành công!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      const normalized = normalizeApiError(error);
      Alert.alert('Lỗi phân ca', normalized.message);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setWorkDate(selectedDate);
    }
  };

  const formatDate = (date: Date) => {
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  };

  return (
    <Screen>
      <PageHeader 
        title="Phân Ca Làm Việc" 
        subtitle="Chọn nhân viên và ca làm việc tương ứng" 
      />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Thông tin phân ca</Text>

          {/* Employee Selector */}
          <Text style={styles.label}>Nhân sự</Text>
          <Pressable 
            style={styles.selector} 
            onPress={() => setEmployeeModalVisible(true)}
          >
            <View style={styles.selectorContent}>
              <MaterialCommunityIcons name="account-outline" size={24} color={colors.primary} />
              <View style={styles.selectorTextWrap}>
                <Text style={selectedEmployee ? styles.selectorTextVal : styles.selectorTextPlaceholder}>
                  {selectedEmployee ? selectedEmployee.label : 'Chọn nhân viên...'}
                </Text>
                {selectedEmployee?.subtitle && (
                  <Text style={styles.selectorSubtitle}>{selectedEmployee.subtitle}</Text>
                )}
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-down" size={24} color={colors.muted} />
          </Pressable>

          {/* Shift Selector */}
          <Text style={styles.label}>Ca làm việc</Text>
          <Pressable 
            style={styles.selector} 
            onPress={() => setShiftModalVisible(true)}
          >
            <View style={styles.selectorContent}>
              <MaterialCommunityIcons name="clock-outline" size={24} color={colors.primary} />
              <View style={styles.selectorTextWrap}>
                <Text style={selectedShift ? styles.selectorTextVal : styles.selectorTextPlaceholder}>
                  {selectedShift ? selectedShift.label : 'Chọn ca làm...'}
                </Text>
                {selectedShift?.subtitle && (
                  <Text style={styles.selectorSubtitle}>{selectedShift.subtitle}</Text>
                )}
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-down" size={24} color={colors.muted} />
          </Pressable>

          {/* Date Selector */}
          <Text style={styles.label}>Ngày làm việc</Text>
          <Pressable 
            style={styles.selector} 
            onPress={() => setShowDatePicker(true)}
          >
            <View style={styles.selectorContent}>
              <MaterialCommunityIcons name="calendar-month-outline" size={24} color={colors.primary} />
              <View style={styles.selectorTextWrap}>
                <Text style={styles.selectorTextVal}>{formatDate(workDate)}</Text>
              </View>
            </View>
            <MaterialCommunityIcons name="pencil-outline" size={20} color={colors.muted} />
          </Pressable>
          {showDatePicker && (
            <DateTimePicker
              value={workDate}
              mode="date"
              display="default"
              onChange={handleDateChange}
            />
          )}

        </View>

        <PrimaryButton 
          loading={assignMutation.isPending}
          disabled={!selectedEmployee || !selectedShift}
          onPress={handleSubmit}
        >
          Xác nhận Phân ca
        </PrimaryButton>
      </ScrollView>

      {/* Modals */}
      <SelectModal
        visible={employeeModalVisible}
        title="Chọn nhân viên"
        options={employeeOptions}
        isLoading={employeesQuery.isLoading}
        selectedValue={selectedEmployee?.id}
        onSelect={setSelectedEmployee}
        onClose={() => setEmployeeModalVisible(false)}
      />

      <SelectModal
        visible={shiftModalVisible}
        title="Chọn ca làm việc"
        options={shiftOptions}
        isLoading={shiftsQuery.isLoading}
        selectedValue={selectedShift?.id}
        onSelect={setSelectedShift}
        onClose={() => setShiftModalVisible(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.xl,
    marginBottom: spacing.xxl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.xl,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  selectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectorTextWrap: {
    marginLeft: spacing.md,
    flex: 1,
  },
  selectorTextPlaceholder: {
    fontSize: 15,
    color: colors.muted,
  },
  selectorTextVal: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  selectorSubtitle: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
});
