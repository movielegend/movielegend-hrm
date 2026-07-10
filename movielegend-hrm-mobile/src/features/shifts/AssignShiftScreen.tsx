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
  
  const [employeeModalVisible, setEmployeeModalVisible] = useState(false);
  const [shiftModalVisible, setShiftModalVisible] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([0, 1, 2, 3, 4, 5]); // Default T2 -> T7

  const WEEKDAYS = [
    { label: 'T2', index: 0 },
    { label: 'T3', index: 1 },
    { label: 'T4', index: 2 },
    { label: 'T5', index: 3 },
    { label: 'T6', index: 4 },
    { label: 'T7', index: 5 },
    { label: 'CN', index: 6 },
  ];

  const toggleWeekday = (index: number) => {
    setSelectedWeekdays(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index].sort()
    );
  };

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

  const getWeekDates = (date: Date) => {
    const currentDay = date.getDay();
    const diffToMonday = currentDay === 0 ? 6 : currentDay - 1;
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - diffToMonday);
    
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  };

  const handleSubmit = async () => {
    if (!selectedEmployee || !selectedShift) return;

    // Get the departmentId from the selected employee's raw data
    const empRaw = (selectedEmployee as any).raw;
    const departmentId = empRaw?.department?.id;

    if (!departmentId) {
      Alert.alert('Lỗi', 'Nhân viên/Leader này chưa thuộc phòng ban nào, không thể phân ca.');
      return;
    }

    try {
      const allWeekDates = getWeekDates(workDate);
      const datesToAssign = selectedWeekdays.map(index => allWeekDates[index]);

      if (datesToAssign.length === 0) {
        Alert.alert('Lỗi', 'Vui lòng chọn ít nhất một ngày trong tuần.');
        return;
      }
      
      for (const dateStr of datesToAssign) {
        if (!dateStr) continue;
        await assignMutation.mutateAsync({
          userId: selectedEmployee.id,
          departmentId: departmentId as string,
          shiftId: selectedShift.id,
          workDate: dateStr,
        });
      }
      
      Alert.alert('Thành công', `Đã phân ca tuần thành công cho quản lý/leader:\n${selectedEmployee.label}`, [
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

  const formatWeekRange = (date: Date) => {
    const currentDay = date.getDay();
    const diffToMonday = currentDay === 0 ? 6 : currentDay - 1;
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - diffToMonday);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    return `Từ ${formatDate(startOfWeek)} đến ${formatDate(endOfWeek)}`;
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
          <Text style={styles.label}>Chọn tuần làm việc</Text>
          <Pressable 
            style={styles.selector} 
            onPress={() => setShowDatePicker(true)}
          >
            <View style={styles.selectorContent}>
              <MaterialCommunityIcons name="calendar-month-outline" size={24} color={colors.primary} />
              <View style={styles.selectorTextWrap}>
                <Text style={styles.selectorTextVal}>{formatWeekRange(workDate)}</Text>
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

          {/* Weekday Selector */}
          <Text style={styles.label}>Áp dụng cho các ngày</Text>
          <View style={styles.weekdayRow}>
            {WEEKDAYS.map(day => {
              const isSelected = selectedWeekdays.includes(day.index);
              return (
                <Pressable
                  key={day.index}
                  style={[styles.weekdayBtn, isSelected && styles.weekdayBtnActive]}
                  onPress={() => toggleWeekday(day.index)}
                >
                  <Text style={[styles.weekdayText, isSelected && styles.weekdayTextActive]}>
                    {day.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

        </View>

        <PrimaryButton 
          loading={assignMutation.isPending}
          disabled={!selectedEmployee || !selectedShift || selectedWeekdays.length === 0}
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
  weekdayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  weekdayBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  weekdayBtnActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  weekdayText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.muted,
  },
  weekdayTextActive: {
    color: colors.primaryDark,
  },
});
