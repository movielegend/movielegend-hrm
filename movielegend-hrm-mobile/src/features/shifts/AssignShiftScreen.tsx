import React, { useState, useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, Alert, Platform, Modal, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

import { Screen } from '../../components/Screen';
import { PageHeader } from '../../components/PageHeader';
import { PrimaryButton } from '../../components/Buttons';
import { SelectModal, SelectOption } from '../../components/SelectModal';

import { useAuth } from '../../providers/AuthProvider';
import { useShifts, useAssignShift, useAssignShiftBatch, useMySchedule } from '../../hooks/useShifts';
import { useScopedEmployees } from '../../hooks/useEmployees';
import { useRegions } from '../../api/regions.api';
import { useBranches } from '../../api/branches.api';
import { useDepartments } from '../../hooks/useDepartments';

import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { normalizeApiError } from '../../utils/api-error';

export function AssignShiftScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = user?.roles?.includes('ADMIN') || user?.roles?.some?.((r: any) => r.name?.toUpperCase().includes('ADMIN') || r.role?.code === 'admin');

  const isGlobalAdmin = Boolean(
    isAdmin &&
    user?.scopes?.some((s: any) => (s.role === 'ADMIN' || s.role?.code === 'ADMIN') && (s.scopeType === 'GLOBAL' || !s.scopeType))
  );

  const adminRegionScope = user?.scopes?.find?.((s: any) => (s.role === 'ADMIN' || s.role?.code === 'ADMIN') && s.scopeType === 'REGION');
  const userRegionId = adminRegionScope?.scopeId;

  // Queries
  const allShiftsQuery = useShifts();
  const myScheduleQuery = useMySchedule();
  
  // Fetch employees scoped to current user
  const employeesQuery = useScopedEmployees({ page: 1, limit: 100 });
  const assignMutation = useAssignShift();
  const assignBatchMutation = useAssignShiftBatch();

  // Region / Branch / Department cascade queries
  const { data: regions = [], refetch: refetchRegions } = useRegions();
  const { data: branches = [], refetch: refetchBranches } = useBranches();
  const { data: departmentsData, refetch: refetchDepartments } = useDepartments({ limit: 1000 });
  const departments = departmentsData?.items || [];

  // State
  const [selectedRegionId, setSelectedRegionId] = useState<string>('ALL');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('ALL');
  const [selectedDeptId, setSelectedDeptId] = useState<string>('ALL');

  React.useEffect(() => {
    if (!isGlobalAdmin && userRegionId) {
      setSelectedRegionId(userRegionId);
    }
  }, [isGlobalAdmin, userRegionId]);

  const effectiveRegionId = isGlobalAdmin ? selectedRegionId : (userRegionId || selectedRegionId);

  const [regionModalVisible, setRegionModalVisible] = useState(false);
  const [branchModalVisible, setBranchModalVisible] = useState(false);
  const [deptModalVisible, setDeptModalVisible] = useState(false);

  const [selectedEmployees, setSelectedEmployees] = useState<SelectOption[]>([]);
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

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      allShiftsQuery.refetch(),
      employeesQuery.refetch(),
      refetchRegions(),
      refetchBranches(),
      refetchDepartments(),
    ]);
    setRefreshing(false);
  }, [allShiftsQuery, employeesQuery, refetchRegions, refetchBranches, refetchDepartments]);

  // Cascading options
  const regionOptions: SelectOption[] = useMemo(() => {
    return [
      { id: 'ALL', label: 'Tất cả các Miền' },
      ...regions.map(r => ({ id: r.id, label: r.name })),
    ];
  }, [regions]);

  const availableBranches = useMemo(() => {
    if (effectiveRegionId === 'ALL') return branches;
    return branches.filter(b => b.regionId === effectiveRegionId || b.region?.id === effectiveRegionId);
  }, [branches, effectiveRegionId]);

  const branchOptions: SelectOption[] = useMemo(() => {
    return [
      { id: 'ALL', label: 'Tất cả Chi nhánh' },
      ...availableBranches.map(b => ({ id: b.id, label: b.name })),
    ];
  }, [availableBranches]);

  const availableDepartments = useMemo(() => {
    let list = departments;
    if (effectiveRegionId !== 'ALL') {
      list = list.filter(d => d.branch?.region?.id === effectiveRegionId);
    }
    if (selectedBranchId !== 'ALL') {
      list = list.filter(d => d.branchId === selectedBranchId || d.branch?.id === selectedBranchId);
    }
    return list;
  }, [departments, effectiveRegionId, selectedBranchId]);

  const deptOptions: SelectOption[] = useMemo(() => {
    return [
      { id: 'ALL', label: 'Tất cả Phòng ban' },
      ...availableDepartments.map(d => ({ id: d.id, label: d.name })),
    ];
  }, [availableDepartments]);

  // Mappers: Admin chỉ phân ca cho Leader; Leader phân ca cho Nhân viên. Có lọc theo Miền / Chi nhánh / Phòng ban nếu chọn
  const employeeOptions: SelectOption[] = useMemo(() => {
    if (!employeesQuery.data?.items) return [];
    let items = employeesQuery.data.items;

    if (isAdmin) {
      // Admin chỉ phân ca cho Leader
      items = items.filter((emp: any) =>
        emp.roles?.some((r: any) => r.role?.code === 'LEADER')
      );
    } else {
      // Leader phân ca cho nhân viên
      items = items.filter((emp: any) =>
        emp.roles?.some((r: any) => r.role?.code === 'EMPLOYEE') ||
        !emp.roles?.some((r: any) => r.role?.code === 'LEADER')
      );
    }

    if (effectiveRegionId !== 'ALL') {
      items = items.filter((emp: any) => emp.department?.branch?.region?.id === effectiveRegionId);
    }
    if (selectedBranchId !== 'ALL') {
      items = items.filter((emp: any) => emp.department?.branch?.id === selectedBranchId);
    }
    if (selectedDeptId !== 'ALL') {
      items = items.filter((emp: any) => emp.department?.id === selectedDeptId);
    }

    return items.map((emp: any) => {
      const parts = [
        emp.position?.name ?? (emp.roles?.some((r: any) => r.role?.code === 'LEADER') ? 'Leader' : 'Nhân viên'),
        emp.department?.name ?? 'Chưa phân phòng',
        emp.department?.branch?.name,
        emp.department?.branch?.region?.name,
      ].filter(Boolean);
      return {
        id: emp.id,
        label: emp.fullName ?? emp.userCode,
        subtitle: parts.join(' · '),
        // We attach the raw object so we can extract departmentId later
        raw: emp,
      };
    });
  }, [employeesQuery.data, isAdmin, effectiveRegionId, selectedBranchId, selectedDeptId]);

  const shiftOptions: SelectOption[] = useMemo(() => {
    if (!allShiftsQuery.data) return [];
    return allShiftsQuery.data.filter((s: any) => s.isActive).map((s: any) => ({
      id: s.id,
      label: s.name,
      subtitle: `${s.startTime} - ${s.endTime}`,
    }));
  }, [allShiftsQuery.data]);

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
    if (selectedEmployees.length === 0 || !selectedShift) return;

    try {
      const allWeekDates = getWeekDates(workDate);
      const datesToAssign = selectedWeekdays.map(index => allWeekDates[index]).filter(Boolean) as string[];

      if (datesToAssign.length === 0) {
        Alert.alert('Lỗi', 'Vui lòng chọn ít nhất một ngày trong tuần.');
        return;
      }
      
      // Group users by departmentId
      const deptGroups = new Map<string, string[]>();
      for (const empOpt of selectedEmployees) {
        const raw = (empOpt as any).raw;
        const dId = raw?.department?.id;
        if (!dId) {
          Alert.alert('Cảnh báo', `Nhân viên "${empOpt.label}" chưa được phân vào phòng ban nào.`);
          return;
        }
        if (!deptGroups.has(dId)) {
          deptGroups.set(dId, []);
        }
        deptGroups.get(dId)!.push(empOpt.id);
      }

      for (const [deptId, uIds] of deptGroups.entries()) {
        await assignBatchMutation.mutateAsync({
          userIds: uIds,
          departmentId: deptId,
          shiftId: selectedShift.id,
          dates: datesToAssign,
        });
      }
      
      Alert.alert('Thành công', `Đã phân ca tuần thành công cho ${selectedEmployees.length} ${isAdmin ? 'Leader' : 'nhân viên'}.`, [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      const normalized = normalizeApiError(error);
      Alert.alert('Lỗi phân ca', normalized.message);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
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

  const roleTargetText = isAdmin ? 'Leader / Quản lý ca' : 'Nhân sự';

  return (
    <Screen>
      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />}
        showsVerticalScrollIndicator={false}
      >
        <PageHeader 
          title="Phân Ca Làm Việc" 
          subtitle={isAdmin ? "Chọn Leader và ca làm việc tương ứng (Admin phân ca cho Leader)" : "Chọn nhân viên và ca làm việc tương ứng"} 
        />

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Thông tin phân ca</Text>

          {/* Region / Branch / Department Selectors (Chỉ hiển thị cho Admin để lọc tìm Leader trên các miền/chi nhánh) */}
          {isAdmin && (
            <>
              {/* Region Selector (Chỉ hiển thị cho Super Admin, Admin Miền không cần chọn miền) */}
              {isGlobalAdmin && (
                <>
                  <Text style={styles.label}>Khu vực (Miền)</Text>
                  <Pressable 
                    style={styles.selector} 
                    onPress={() => setRegionModalVisible(true)}
                  >
                    <View style={styles.selectorContent}>
                      <MaterialCommunityIcons name="map-marker-radius-outline" size={24} color="#111827" />
                      <View style={styles.selectorTextWrap}>
                        <Text style={styles.selectorTextVal}>
                          {regionOptions.find(r => r.id === selectedRegionId)?.label || 'Tất cả các Miền'}
                        </Text>
                      </View>
                    </View>
                    <MaterialCommunityIcons name="chevron-down" size={24} color={colors.muted} />
                  </Pressable>
                </>
              )}

              {/* Branch Selector */}
              <Text style={styles.label}>Chi nhánh</Text>
              <Pressable 
                style={styles.selector} 
                onPress={() => setBranchModalVisible(true)}
              >
                <View style={styles.selectorContent}>
                  <MaterialCommunityIcons name="office-building-outline" size={24} color="#111827" />
                  <View style={styles.selectorTextWrap}>
                    <Text style={styles.selectorTextVal}>
                      {branchOptions.find(b => b.id === selectedBranchId)?.label || 'Tất cả Chi nhánh'}
                    </Text>
                  </View>
                </View>
                <MaterialCommunityIcons name="chevron-down" size={24} color={colors.muted} />
              </Pressable>

              {/* Department Selector */}
              <Text style={styles.label}>Phòng ban</Text>
              <Pressable 
                style={styles.selector} 
                onPress={() => setDeptModalVisible(true)}
              >
                <View style={styles.selectorContent}>
                  <MaterialCommunityIcons name="domain" size={24} color="#111827" />
                  <View style={styles.selectorTextWrap}>
                    <Text style={styles.selectorTextVal}>
                      {deptOptions.find(d => d.id === selectedDeptId)?.label || 'Tất cả Phòng ban'}
                    </Text>
                  </View>
                </View>
                <MaterialCommunityIcons name="chevron-down" size={24} color={colors.muted} />
              </Pressable>
            </>
          )}

          {/* Employee / Leader Selector */}
          <Text style={styles.label}>{roleTargetText}</Text>
          <Pressable 
            style={styles.selector} 
            onPress={() => setEmployeeModalVisible(true)}
          >
            <View style={styles.selectorContent}>
              <MaterialCommunityIcons name={isAdmin ? "account-tie-outline" : "account-outline"} size={24} color="#111827" />
              <View style={styles.selectorTextWrap}>
                <Text style={selectedEmployees.length > 0 ? styles.selectorTextVal : styles.selectorTextPlaceholder}>
                  {selectedEmployees.length > 0 ? (selectedEmployees.length === 1 ? selectedEmployees[0]?.label : `Đã chọn ${selectedEmployees.length} ${isAdmin ? 'Leader' : 'nhân viên'}`) : `Chọn ${isAdmin ? 'Leader' : 'nhân viên'}...`}
                </Text>
                {selectedEmployees.length === 1 && selectedEmployees[0]?.subtitle && (
                  <Text style={styles.selectorSubtitle}>{selectedEmployees[0]?.subtitle}</Text>
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
              <MaterialCommunityIcons name="clock-outline" size={24} color="#111827" />
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
              <MaterialCommunityIcons name="calendar-month-outline" size={24} color="#111827" />
              <View style={styles.selectorTextWrap}>
                <Text style={styles.selectorTextVal}>{formatWeekRange(workDate)}</Text>
              </View>
            </View>
            <MaterialCommunityIcons name="pencil-outline" size={20} color={colors.muted} />
          </Pressable>
          {showDatePicker && Platform.OS === 'android' && (
            <DateTimePicker
              value={workDate}
              mode="date"
              display="default"
              onChange={handleDateChange}
            />
          )}

          {Platform.OS === 'ios' && (
            <Modal visible={showDatePicker} transparent animationType="slide">
              <View style={styles.datePickerModalContainer}>
                <View style={styles.datePickerModalContent}>
                  <View style={styles.datePickerHeader}>
                    <Pressable onPress={() => setShowDatePicker(false)}>
                      <Text style={styles.datePickerCancelText}>Hủy</Text>
                    </Pressable>
                    <Pressable onPress={() => setShowDatePicker(false)}>
                      <Text style={styles.datePickerDoneText}>Xong</Text>
                    </Pressable>
                  </View>
                  <DateTimePicker
                    value={workDate}
                    mode="date"
                    display="spinner"
                    onChange={handleDateChange}
                    style={styles.iosDatePicker}
                  />
                </View>
              </View>
            </Modal>
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

        <Pressable 
          style={[styles.submitBtn, (selectedEmployees.length === 0 || !selectedShift || selectedWeekdays.length === 0) && styles.submitBtnDisabled]}
          disabled={selectedEmployees.length === 0 || !selectedShift || selectedWeekdays.length === 0 || assignBatchMutation.isPending}
          onPress={handleSubmit}
        >
          <Text style={styles.submitBtnText}>
            {assignBatchMutation.isPending ? 'Đang xử lý...' : 'Xác nhận Phân ca'}
          </Text>
        </Pressable>
      </ScrollView>

      {/* Modals */}
      <SelectModal
        visible={regionModalVisible}
        title="Chọn Miền (Khu vực)"
        options={regionOptions}
        selectedValue={selectedRegionId}
        onSelect={(opt) => {
          setSelectedRegionId(opt.id);
          setSelectedBranchId('ALL');
          setSelectedDeptId('ALL');
          setSelectedEmployees([]);
        }}
        onClose={() => setRegionModalVisible(false)}
      />

      <SelectModal
        visible={branchModalVisible}
        title="Chọn Chi nhánh"
        options={branchOptions}
        selectedValue={selectedBranchId}
        onSelect={(opt) => {
          setSelectedBranchId(opt.id);
          setSelectedDeptId('ALL');
          setSelectedEmployees([]);
        }}
        onClose={() => setBranchModalVisible(false)}
      />

      <SelectModal
        visible={deptModalVisible}
        title="Chọn Phòng ban"
        options={deptOptions}
        selectedValue={selectedDeptId}
        onSelect={(opt) => {
          setSelectedDeptId(opt.id);
          setSelectedEmployees([]);
        }}
        onClose={() => setDeptModalVisible(false)}
      />

      <SelectModal
        isMulti
        visible={employeeModalVisible}
        title={isAdmin ? "Chọn Leader cần phân ca" : "Chọn nhân viên"}
        options={employeeOptions}
        isLoading={employeesQuery.isLoading}
        selectedValues={selectedEmployees.map(e => e.id)}
        onSelectMulti={(option) => {
          setSelectedEmployees(prev => {
            const exists = prev.find(p => p.id === option.id);
            if (exists) return prev.filter(p => p.id !== option.id);
            return [...prev, option];
          });
        }}
        onClose={() => setEmployeeModalVisible(false)}
      />

      <SelectModal
        visible={shiftModalVisible}
        title="Chọn ca làm việc"
        options={shiftOptions}
        isLoading={isAdmin ? allShiftsQuery.isLoading : myScheduleQuery.isLoading}
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
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  weekdayBtnActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  weekdayText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  weekdayTextActive: {
    color: '#fff',
  },
  submitBtn: {
    backgroundColor: '#111827',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  datePickerModalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  datePickerModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  datePickerCancelText: {
    fontSize: 16,
    color: '#6B7280',
  },
  datePickerDoneText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563EB',
  },
  iosDatePicker: {
    backgroundColor: 'white',
  },
});
