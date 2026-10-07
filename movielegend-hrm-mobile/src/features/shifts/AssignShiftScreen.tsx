import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Platform,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { SelectModal, SelectOption } from '../../components/SelectModal';
import { CustomDatePickerModal } from '../../components/CustomDatePickerModal';
import { CustomAlert } from '../../components/CustomAlert';

import { useAuth } from '../../providers/AuthProvider';
import { useShifts, useAssignShiftBatch } from '../../hooks/useShifts';
import { useScopedEmployees } from '../../hooks/useEmployees';
import { useRegions } from '../../api/regions.api';
import { useBranches } from '../../api/branches.api';
import { useDepartments } from '../../hooks/useDepartments';
import { normalizeApiError } from '../../utils/api-error';

export function AssignShiftScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const isAdmin =
    user?.roles?.includes('ADMIN') ||
    user?.roles?.some?.((r: any) => r.name?.toUpperCase().includes('ADMIN') || r.role?.code === 'admin');

  const isGlobalAdmin = Boolean(
    isAdmin &&
      user?.scopes?.some(
        (s: any) =>
          (s.role === 'ADMIN' || s.role?.code === 'ADMIN') &&
          (s.scopeType === 'GLOBAL' || !s.scopeType)
      )
  );

  const adminRegionScope = user?.scopes?.find?.(
    (s: any) => (s.role === 'ADMIN' || s.role?.code === 'ADMIN') && s.scopeType === 'REGION'
  );
  const userRegionId = adminRegionScope?.scopeId;

  // Queries
  const allShiftsQuery = useShifts();
  const employeesQuery = useScopedEmployees({ page: 1, limit: 150 });
  const assignBatchMutation = useAssignShiftBatch();

  const { data: regions = [], refetch: refetchRegions } = useRegions();
  const { data: branches = [], refetch: refetchBranches } = useBranches();
  const { data: departmentsData, refetch: refetchDepartments } = useDepartments({ limit: 1000 });
  const departments = departmentsData?.items || [];

  // Filter States (Card 01)
  const [selectedRegionId, setSelectedRegionId] = useState<string>('ALL');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('ALL');
  const [selectedDeptId, setSelectedDeptId] = useState<string>('ALL');

  useEffect(() => {
    if (!isGlobalAdmin && userRegionId) {
      setSelectedRegionId(userRegionId);
    }
  }, [isGlobalAdmin, userRegionId]);

  const effectiveRegionId = isGlobalAdmin ? selectedRegionId : userRegionId || selectedRegionId;

  // Modals for selection
  const [regionModalVisible, setRegionModalVisible] = useState(false);
  const [branchModalVisible, setBranchModalVisible] = useState(false);
  const [deptModalVisible, setDeptModalVisible] = useState(false);

  // Card 02 States
  const [selectedEmployees, setSelectedEmployees] = useState<SelectOption[]>([]);
  const [selectedShift, setSelectedShift] = useState<SelectOption | null>(null);
  const [employeeModalVisible, setEmployeeModalVisible] = useState(false);
  const [shiftModalVisible, setShiftModalVisible] = useState(false);

  // Card 03 States (Schedule)
  const [workDate, setWorkDate] = useState<Date>(() => new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  // Default Monday to Saturday: indices 0 to 5
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([0, 1, 2, 3, 4, 5]);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
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

  // Options for Region
  const regionOptions: SelectOption[] = useMemo(() => {
    return [
      { id: 'ALL', label: 'Tất cả các miền' },
      ...regions.map(r => ({ id: r.id, label: r.name })),
    ];
  }, [regions]);

  // Options for Branch
  const availableBranches = useMemo(() => {
    if (effectiveRegionId === 'ALL') return branches;
    return branches.filter(b => b.regionId === effectiveRegionId || b.region?.id === effectiveRegionId);
  }, [branches, effectiveRegionId]);

  const branchOptions: SelectOption[] = useMemo(() => {
    return [
      { id: 'ALL', label: 'Tất cả chi nhánh' },
      ...availableBranches.map(b => ({ id: b.id, label: b.name })),
    ];
  }, [availableBranches]);

  // Options for Department
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
      { id: 'ALL', label: 'Tất cả phòng ban' },
      ...availableDepartments.map(d => ({ id: d.id, label: d.name })),
    ];
  }, [availableDepartments]);

  // Employee/Leader Options
  const employeeOptions: SelectOption[] = useMemo(() => {
    if (!employeesQuery.data?.items) return [];
    let items = employeesQuery.data.items;

    if (isAdmin) {
      // Admin assigns shift to Leader
      items = items.filter((emp: any) =>
        emp.roles?.some((r: any) => r.role?.code === 'LEADER')
      );
    } else {
      // Leader assigns shift to staff
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
      ].filter(Boolean);
      return {
        id: emp.id,
        label: emp.fullName ?? emp.userCode,
        subtitle: parts.join(' · '),
        raw: emp,
      };
    });
  }, [employeesQuery.data, isAdmin, effectiveRegionId, selectedBranchId, selectedDeptId]);

  // Shifts options
  const shiftOptions: SelectOption[] = useMemo(() => {
    if (!allShiftsQuery.data) return [];
    return allShiftsQuery.data
      .filter((s: any) => s.isActive)
      .map((s: any) => ({
        id: s.id,
        label: s.name,
        subtitle: `${s.startTime} - ${s.endTime}`,
      }));
  }, [allShiftsQuery.data]);

  // Week Days array computation around workDate
  const weekInfo = useMemo(() => {
    const currentDay = workDate.getDay();
    // Monday is start of week
    const diffToMonday = currentDay === 0 ? 6 : currentDay - 1;
    const monday = new Date(workDate);
    monday.setDate(workDate.getDate() - diffToMonday);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const formatShort = (d: Date) => {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}`;
    };

    const days = [];
    const labels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push({
        index: i,
        label: labels[i],
        dayNum: String(d.getDate()).padStart(2, '0'),
        dateIso: d.toISOString().split('T')[0],
      });
    }

    const rangeStr = `${formatShort(monday)} – ${formatShort(sunday)}/${sunday.getFullYear()}`;

    return { days, rangeStr };
  }, [workDate]);

  const toggleWeekday = (index: number) => {
    setSelectedWeekdays(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index].sort()
    );
  };

  const handleSubmit = async () => {
    if (selectedEmployees.length === 0 || !selectedShift) return;

    try {
      const datesToAssign = selectedWeekdays
        .map(index => weekInfo.days[index]?.dateIso)
        .filter(Boolean) as string[];

      if (datesToAssign.length === 0) {
        CustomAlert.alert('Lỗi', 'Vui lòng chọn ít nhất một ngày trong tuần.');
        return;
      }

      // Group users by departmentId
      const deptGroups = new Map<string, string[]>();
      for (const empOpt of selectedEmployees) {
        const raw = (empOpt as any).raw;
        const dId = raw?.department?.id;
        if (!dId) {
          CustomAlert.alert('Cảnh báo', `Nhân sự "${empOpt.label}" chưa được phân vào phòng ban nào.`);
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

      CustomAlert.alert(
        'Thành công',
        `Đã phân ca tuần thành công cho ${selectedEmployees.length} ${isAdmin ? 'Leader' : 'nhân viên'}.`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      const normalized = normalizeApiError(error);
      CustomAlert.alert('Lỗi phân ca', normalized.message);
    }
  };

  const isFormValid = selectedEmployees.length > 0 && !!selectedShift && selectedWeekdays.length > 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* 1. Header (Back button + Title + Subtitle) */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
            <Ionicons name="chevron-back" size={24} color="#0F172A" />
          </Pressable>
          <Text style={styles.screenTitle}>Phân ca làm việc</Text>
        </View>
        <Text style={styles.screenSubtitle}>
          {isAdmin ? 'Sắp xếp ca làm cho Leader.' : 'Sắp xếp ca làm cho nhân viên.'}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />}
      >
        {/* CARD 01: Phạm vi áp dụng */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>01</Text>
            </View>
            <Text style={styles.cardTitle}>Phạm vi áp dụng</Text>
          </View>

          {/* Field: Khu vực */}
          <Text style={styles.fieldLabel}>Khu vực</Text>
          <Pressable
            style={styles.selectPill}
            onPress={() => setRegionModalVisible(true)}
            disabled={!isGlobalAdmin}
          >
            <View style={styles.selectLeft}>
              <Ionicons name="location-outline" size={18} color="#166534" />
              <Text style={styles.selectText} numberOfLines={1}>
                {regionOptions.find(r => r.id === effectiveRegionId)?.label || 'Tất cả các miền'}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={16} color="#64748B" />
          </Pressable>

          {/* Field: Chi nhánh */}
          <Text style={styles.fieldLabel}>Chi nhánh</Text>
          <Pressable style={styles.selectPill} onPress={() => setBranchModalVisible(true)}>
            <View style={styles.selectLeft}>
              <Ionicons name="business-outline" size={18} color="#166534" />
              <Text style={styles.selectText} numberOfLines={1}>
                {branchOptions.find(b => b.id === selectedBranchId)?.label || 'Tất cả chi nhánh'}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={16} color="#64748B" />
          </Pressable>

          {/* Field: Phòng ban */}
          <Text style={styles.fieldLabel}>Phòng ban</Text>
          <Pressable style={styles.selectPill} onPress={() => setDeptModalVisible(true)}>
            <View style={styles.selectLeft}>
              <Ionicons name="git-network-outline" size={18} color="#166534" />
              <Text style={styles.selectText} numberOfLines={1}>
                {deptOptions.find(d => d.id === selectedDeptId)?.label || 'Tất cả phòng ban'}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={16} color="#64748B" />
          </Pressable>
        </View>

        {/* CARD 02: Leader & ca làm */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>02</Text>
            </View>
            <Text style={styles.cardTitle}>{isAdmin ? 'Leader & ca làm' : 'Nhân sự & ca làm'}</Text>
          </View>

          {/* Field: Leader / Quản lý ca */}
          <Text style={styles.fieldLabel}>
            {isAdmin ? 'Leader / Quản lý ca' : 'Nhân sự'}
          </Text>
          <Pressable style={styles.selectPill} onPress={() => setEmployeeModalVisible(true)}>
            <View style={styles.selectLeft}>
              <Ionicons name="person-outline" size={18} color="#166534" />
              <Text
                style={[
                  styles.selectText,
                  selectedEmployees.length === 0 && styles.placeholderText,
                ]}
                numberOfLines={1}
              >
                {selectedEmployees.length > 0
                  ? selectedEmployees.length === 1
                    ? selectedEmployees[0]?.label
                    : `Đã chọn ${selectedEmployees.length} ${isAdmin ? 'Leader' : 'nhân viên'}`
                  : `Chọn ${isAdmin ? 'Leader' : 'nhân viên'}...`}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={16} color="#64748B" />
          </Pressable>

          {/* Field: Ca làm việc */}
          <Text style={styles.fieldLabel}>Ca làm việc</Text>
          <Pressable style={styles.selectPill} onPress={() => setShiftModalVisible(true)}>
            <View style={styles.selectLeft}>
              <Ionicons name="time-outline" size={18} color="#166534" />
              <Text
                style={[styles.selectText, !selectedShift && styles.placeholderText]}
                numberOfLines={1}
              >
                {selectedShift ? `${selectedShift.label} (${selectedShift.subtitle})` : 'Chọn ca làm...'}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={16} color="#64748B" />
          </Pressable>
        </View>

        {/* CARD 03: Lịch áp dụng */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>03</Text>
            </View>
            <Text style={styles.cardTitle}>Lịch áp dụng</Text>
          </View>

          {/* Tuần làm việc */}
          <Text style={styles.fieldLabel}>Tuần làm việc</Text>
          <Pressable style={styles.selectPill} onPress={() => setShowDatePicker(true)}>
            <View style={styles.selectLeft}>
              <Ionicons name="calendar-outline" size={18} color="#166534" />
              <Text style={styles.selectText}>{weekInfo.rangeStr}</Text>
            </View>
            <Ionicons name="pencil-outline" size={16} color="#64748B" />
          </Pressable>

          {/* Ngày áp dụng (T2 - T6 indicator + Calendar weekday badges) */}
          <View style={styles.weekdayHeaderRow}>
            <Text style={styles.fieldLabel}>Ngày áp dụng</Text>
            <Text style={styles.weekdayHintText}>
              {selectedWeekdays.length === 5 && !selectedWeekdays.includes(5) && !selectedWeekdays.includes(6)
                ? 'T2 – T6'
                : selectedWeekdays.length === 6 && !selectedWeekdays.includes(6)
                ? 'T2 – T7'
                : selectedWeekdays.length === 7
                ? 'Cả tuần'
                : `${selectedWeekdays.length} ngày`}
            </Text>
          </View>

          {/* Weekday Badges Grid */}
          <View style={styles.weekdayGrid}>
            {weekInfo.days.map(day => {
              const isSelected = selectedWeekdays.includes(day.index);
              return (
                <Pressable
                  key={day.index}
                  onPress={() => toggleWeekday(day.index)}
                  style={[styles.dayCard, isSelected && styles.dayCardActive]}
                >
                  <Text style={[styles.dayCardLabel, isSelected && styles.dayCardLabelActive]}>
                    {day.label}
                  </Text>
                  <Text style={[styles.dayCardNum, isSelected && styles.dayCardNumActive]}>
                    {day.dayNum}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Status tick below */}
          <View style={styles.weekSelectedStatusRow}>
            <Ionicons name="checkmark-circle" size={16} color="#166534" />
            <Text style={styles.weekSelectedStatusText}>
              Đã chọn {selectedWeekdays.length} ngày trong tuần
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* BOTTOM STICKY ACTION BAR */}
      <View style={styles.bottomBar}>
        {!isFormValid && (
          <Text style={styles.hintText}>Chọn Leader và ca làm để tiếp tục.</Text>
        )}
        <Pressable
          onPress={() => void handleSubmit()}
          disabled={!isFormValid || assignBatchMutation.isPending}
          style={[
            styles.submitBtn,
            isFormValid ? styles.submitBtnActive : styles.submitBtnDisabled,
          ]}
          android_ripple={{ color: 'rgba(255,255,255,0.1)' }}
        >
          {assignBatchMutation.isPending ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text
              style={[
                styles.submitBtnText,
                isFormValid ? styles.submitBtnTextActive : styles.submitBtnTextDisabled,
              ]}
            >
              Lưu phân ca
            </Text>
          )}
        </Pressable>
      </View>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <CustomDatePickerModal
          visible={true}
          initialDate={workDate}
          onClose={() => setShowDatePicker(false)}
          onSelect={date => {
            setShowDatePicker(false);
            setWorkDate(date);
          }}
        />
      )}

      {/* Select Modals */}
      <SelectModal
        visible={regionModalVisible}
        title="Chọn Miền (Khu vực)"
        options={regionOptions}
        selectedValue={effectiveRegionId}
        onSelect={opt => {
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
        onSelect={opt => {
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
        onSelect={opt => {
          setSelectedDeptId(opt.id);
          setSelectedEmployees([]);
        }}
        onClose={() => setDeptModalVisible(false)}
      />

      <SelectModal
        isMulti
        visible={employeeModalVisible}
        title={isAdmin ? 'Chọn Leader cần phân ca' : 'Chọn nhân viên'}
        options={employeeOptions}
        isLoading={employeesQuery.isLoading}
        selectedValues={selectedEmployees.map(e => e.id)}
        onSelectMulti={option => {
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
        isLoading={allShiftsQuery.isLoading}
        selectedValue={selectedShift?.id}
        onSelect={setSelectedShift}
        onClose={() => setShiftModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAF8',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  backBtn: {
    padding: 4,
    marginLeft: -4,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  screenSubtitle: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
    marginLeft: 36,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 100,
    gap: 14,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  stepBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  stepBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#166534',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 6,
    marginTop: 6,
  },
  selectPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 6,
  },
  selectLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  selectText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  placeholderText: {
    color: '#94A3B8',
    fontWeight: '500',
  },
  weekdayHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  weekdayHintText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  weekdayGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
    marginVertical: 10,
  },
  dayCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dayCardActive: {
    backgroundColor: '#1B382B', // Dark forest green matching template
    borderColor: '#1B382B',
  },
  dayCardLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 2,
  },
  dayCardLabelActive: {
    color: '#A7F3D0',
  },
  dayCardNum: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  dayCardNumActive: {
    color: '#FFFFFF',
  },
  weekSelectedStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  weekSelectedStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#166534',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  hintText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 8,
  },
  submitBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnActive: {
    backgroundColor: '#1B382B', // Deep forest green
    shadowColor: '#1B382B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  submitBtnDisabled: {
    backgroundColor: '#CBD5E1',
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '800',
  },
  submitBtnTextActive: {
    color: '#FFFFFF',
  },
  submitBtnTextDisabled: {
    color: '#94A3B8',
  },
});
