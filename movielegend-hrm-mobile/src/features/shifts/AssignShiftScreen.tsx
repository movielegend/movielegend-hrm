import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const segments = useSegments();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const isLeaderRoute = segments[0] === 'leader';
  const isAdmin =
    !isLeaderRoute &&
    (user?.roles?.includes('ADMIN') ||
      user?.roles?.some?.((r: any) => r.name?.toUpperCase().includes('ADMIN') || r.role?.code === 'admin'));

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

  // Leader department scope
  const leaderDeptScope = user?.scopes?.find?.(
    (s: any) =>
      (s.role === 'LEADER' || s.role?.code === 'LEADER') &&
      s.scopeType === 'DEPARTMENT' &&
      s.scopeId
  );
  const leaderDeptId = user?.department?.id || leaderDeptScope?.scopeId;
  const leaderDeptName = user?.department?.name || 'Phòng ban của bạn';
  const leaderBranchName = (user?.department as any)?.branch?.name || '';

  // Formatted display names for Card 01
  const displayDeptTitle = useMemo(() => {
    if (!leaderDeptName) return 'PHÒNG BAN CỦA BẠN';
    const upperDept = leaderDeptName.toUpperCase();
    const upperBranch = leaderBranchName ? leaderBranchName.toUpperCase() : '';
    if (upperBranch && !upperDept.includes(upperBranch)) {
      return `${upperDept} (${upperBranch})`;
    }
    return upperDept;
  }, [leaderDeptName, leaderBranchName]);

  const displayBranchSubtitle = useMemo(() => {
    if (leaderBranchName) return leaderBranchName.toUpperCase();
    return ((user as any)?.company?.name || 'MOVIELEGEND').toUpperCase();
  }, [leaderBranchName, user]);

  // Queries
  const allShiftsQuery = useShifts();
  const employeesQuery = useScopedEmployees({ page: 1, limit: 150 });
  const assignBatchMutation = useAssignShiftBatch();

  const { data: regions = [], refetch: refetchRegions } = useRegions();
  const { data: branches = [], refetch: refetchBranches } = useBranches();
  const { data: departmentsData, refetch: refetchDepartments } = useDepartments({ limit: 1000 });
  const departments = departmentsData?.items || [];

  // Filter States (Card 01 for Admin)
  const [selectedRegionId, setSelectedRegionId] = useState<string>('ALL');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('ALL');
  const [selectedDeptId, setSelectedDeptId] = useState<string>('ALL');

  useEffect(() => {
    if (isGlobalAdmin && userRegionId) {
      setSelectedRegionId(userRegionId);
    }
    if (!isAdmin && leaderDeptId) {
      setSelectedDeptId(leaderDeptId);
    }
  }, [isGlobalAdmin, userRegionId, isAdmin, leaderDeptId]);

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
      if (effectiveRegionId !== 'ALL') {
        items = items.filter((emp: any) => emp.department?.branch?.region?.id === effectiveRegionId);
      }
      if (selectedBranchId !== 'ALL') {
        items = items.filter((emp: any) => emp.department?.branch?.id === selectedBranchId);
      }
      if (selectedDeptId !== 'ALL') {
        items = items.filter((emp: any) => emp.department?.id === selectedDeptId || emp.departmentId === selectedDeptId);
      }
    } else {
      // Leader assigns shift to staff in their own department + Leader themselves
      if (leaderDeptId) {
        items = items.filter((emp: any) => {
          const empDeptId = emp.departmentId || emp.department?.id;
          return empDeptId === leaderDeptId || emp.id === user?.id;
        });
      }
    }

    return items.map((emp: any) => {
      const isMe = emp.id === user?.id;
      const isLeaderRole = emp.roles?.some((r: any) => r.role?.code === 'LEADER' || r.name?.toUpperCase().includes('LEADER'));
      const roleName = isMe ? 'Bạn (Leader)' : isLeaderRole ? 'Leader' : (emp.position?.name ?? 'Nhân viên');
      const parts = [
        roleName,
        emp.department?.name ?? 'Chưa phân phòng',
        emp.department?.branch?.name,
      ].filter(Boolean);
      return {
        id: emp.id,
        label: isMe ? `${emp.fullName ?? emp.userCode} (Bạn)` : (emp.fullName ?? emp.userCode),
        subtitle: parts.join(' · '),
        raw: emp,
      };
    });
  }, [employeesQuery.data, isAdmin, effectiveRegionId, selectedBranchId, selectedDeptId, leaderDeptId, user?.id]);

  // Shifts options
  const shiftOptions: SelectOption[] = useMemo(() => {
    if (!allShiftsQuery.data) return [];
    let list = allShiftsQuery.data.filter((s: any) => s.isActive);
    const currentDeptId = isAdmin ? (selectedDeptId !== 'ALL' ? selectedDeptId : null) : leaderDeptId;
    if (currentDeptId) {
      list = list.filter((s: any) => !s.departmentId || s.departmentId === currentDeptId);
    }
    return list.map((s: any) => ({
      id: s.id,
      label: s.name,
      subtitle: `${s.startTime} - ${s.endTime}${s.department?.name ? ` · ${s.department.name}` : ' · Chung'}`,
    }));
  }, [allShiftsQuery.data, isAdmin, selectedDeptId, leaderDeptId]);

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

  const weekdayShortcutText = useMemo(() => {
    if (selectedWeekdays.length === 5 && !selectedWeekdays.includes(5) && !selectedWeekdays.includes(6)) {
      return 'T2 – T6';
    }
    if (selectedWeekdays.length === 6 && !selectedWeekdays.includes(6)) {
      return 'T2 – T7';
    }
    if (selectedWeekdays.length === 7) {
      return 'Cả tuần';
    }
    if (selectedWeekdays.length === 0) {
      return 'Chưa chọn';
    }
    return `${selectedWeekdays.length} ngày`;
  }, [selectedWeekdays]);

  const toggleSelectAllEmployees = () => {
    if (selectedEmployees.length === employeeOptions.length && employeeOptions.length > 0) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(employeeOptions);
    }
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
        const empId = empOpt.id;
        if (!empId) continue;
        if (!deptGroups.has(dId)) {
          deptGroups.set(dId, []);
        }
        deptGroups.get(dId)!.push(empId);
      }

      for (const [deptId, uIds] of deptGroups.entries()) {
        if (!selectedShift?.id) continue;
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
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#102739" translucent={false} />

      {/* ── Top Header (#102739) ── */}
      <View style={[styles.headerWrap, { paddingTop: Math.max(insets.top, 16) + 4 }]}>
        <View style={styles.headerMainRow}>
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/leader/(tabs)' as any))}
            style={styles.backBtn}
            hitSlop={10}
            accessibilityLabel="Quay lại"
          >
            <Ionicons name="chevron-back" size={26} color="#FFFFFF" />
          </Pressable>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Phân ca làm việc</Text>
            <Text style={styles.headerSubtitle}>
              {isAdmin ? 'Sắp xếp ca làm cho Leader.' : 'Sắp xếp ca làm cho nhân viên.'}
            </Text>
          </View>
        </View>
      </View>

      {/* ── Main Curved Sheet ── */}
      <View style={styles.curvedSheet}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, 24) + 24 },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />}
        >
          {/* CARD 01: Phạm vi áp dụng / Phòng ban phụ trách */}
          {isAdmin ? (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>01</Text>
                </View>
                <Text style={styles.cardTitle}>Phạm vi áp dụng</Text>
              </View>

              {/* Khu vực */}
              <Text style={styles.fieldLabel}>Khu vực</Text>
              <Pressable
                style={styles.selectPill}
                onPress={() => setRegionModalVisible(true)}
                disabled={!isGlobalAdmin}
              >
                <View style={styles.selectLeft}>
                  <Ionicons name="location-outline" size={18} color="#64748B" />
                  <Text style={styles.selectText} numberOfLines={1}>
                    {regionOptions.find(r => r.id === effectiveRegionId)?.label || 'Tất cả các miền'}
                  </Text>
                </View>
                <Ionicons name="chevron-down" size={18} color="#64748B" />
              </Pressable>

              {/* Chi nhánh */}
              <Text style={styles.fieldLabel}>Chi nhánh</Text>
              <Pressable style={styles.selectPill} onPress={() => setBranchModalVisible(true)}>
                <View style={styles.selectLeft}>
                  <Ionicons name="business-outline" size={18} color="#64748B" />
                  <Text style={styles.selectText} numberOfLines={1}>
                    {branchOptions.find(b => b.id === selectedBranchId)?.label || 'Tất cả chi nhánh'}
                  </Text>
                </View>
                <Ionicons name="chevron-down" size={18} color="#64748B" />
              </Pressable>

              {/* Phòng ban */}
              <Text style={styles.fieldLabel}>Phòng ban</Text>
              <Pressable style={styles.selectPill} onPress={() => setDeptModalVisible(true)}>
                <View style={styles.selectLeft}>
                  <Ionicons name="git-network-outline" size={18} color="#64748B" />
                  <Text style={styles.selectText} numberOfLines={1}>
                    {deptOptions.find(d => d.id === selectedDeptId)?.label || 'Tất cả phòng ban'}
                  </Text>
                </View>
                <Ionicons name="chevron-down" size={18} color="#64748B" />
              </Pressable>
            </View>
          ) : (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>01</Text>
                </View>
                <Text style={styles.cardTitle}>Phòng ban phụ trách</Text>
              </View>

              <View style={styles.deptCardBox}>
                <View style={styles.deptIconBox}>
                  <Ionicons name="business-outline" size={22} color="#102739" />
                </View>
                <View style={styles.deptInfoCol}>
                  <Text style={styles.deptNameText}>{displayDeptTitle}</Text>
                  <Text style={styles.deptBranchText}>{displayBranchSubtitle}</Text>
                </View>
                <View style={styles.deptScopeBadge}>
                  <Text style={styles.deptScopeBadgeText}>Phòng của bạn</Text>
                </View>
              </View>
            </View>
          )}

          {/* CARD 02: Nhân sự & ca làm */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>02</Text>
              </View>
              <Text style={styles.cardTitle}>Nhân sự & ca làm</Text>
            </View>

            {/* Label row with Quick select pill */}
            <View style={styles.fieldHeaderRow}>
              <Text style={styles.fieldLabel}>
                {isAdmin ? 'Nhân sự / Quản lý ca' : 'Nhân sự phòng ban'}
              </Text>
              <Pressable
                onPress={toggleSelectAllEmployees}
                hitSlop={6}
                style={styles.quickSelectPill}
              >
                <Ionicons name="checkmark-done" size={14} color="#102739" />
                <Text style={styles.quickSelectPillText}>Tất cả ({employeeOptions.length})</Text>
              </Pressable>
            </View>

            <Pressable style={styles.selectPill} onPress={() => setEmployeeModalVisible(true)}>
              <View style={styles.selectLeft}>
                <Ionicons name="person-outline" size={18} color="#64748B" />
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
                      : `Đã chọn ${selectedEmployees.length} nhân sự`
                    : 'Chọn nhân sự / quản lý...'}
                </Text>
              </View>
              <Ionicons name="chevron-down" size={18} color="#64748B" />
            </Pressable>

            {/* Ca làm việc */}
            <Text style={styles.fieldLabel}>Ca làm việc</Text>
            <Pressable style={styles.selectPill} onPress={() => setShiftModalVisible(true)}>
              <View style={styles.selectLeft}>
                <Ionicons name="time-outline" size={18} color="#64748B" />
                <Text
                  style={[styles.selectText, !selectedShift && styles.placeholderText]}
                  numberOfLines={1}
                >
                  {selectedShift ? `${selectedShift.label} (${selectedShift.subtitle})` : 'Chọn ca làm...'}
                </Text>
              </View>
              <Ionicons name="chevron-down" size={18} color="#64748B" />
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
                <Ionicons name="calendar-outline" size={18} color="#102739" />
                <Text style={styles.dateRangeText}>{weekInfo.rangeStr}</Text>
              </View>
              <Ionicons name="pencil-sharp" size={18} color="#64748B" />
            </Pressable>

            {/* Ngày áp dụng Header */}
            <View style={styles.weekdayHeaderRow}>
              <Text style={styles.fieldLabel}>Ngày áp dụng</Text>
              <Text style={styles.weekdayHintText}>{weekdayShortcutText}</Text>
            </View>

            {/* Weekday Badges Grid */}
            <View style={styles.weekdayGrid}>
              {weekInfo.days.map(day => {
                const isSelected = selectedWeekdays.includes(day.index);
                return (
                  <Pressable
                    key={day.index}
                    onPress={() => toggleWeekday(day.index)}
                    style={[styles.dayCard, isSelected ? styles.dayCardActive : styles.dayCardInactive]}
                  >
                    <Text style={[styles.dayCardLabel, isSelected ? styles.dayCardLabelActive : styles.dayCardLabelInactive]}>
                      {day.label}
                    </Text>
                    <Text style={[styles.dayCardNum, isSelected ? styles.dayCardNumActive : styles.dayCardNumInactive]}>
                      {day.dayNum}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Status tick below */}
            <View style={styles.weekSelectedStatusRow}>
              <Ionicons name="checkmark-circle" size={16} color="#102739" />
              <Text style={styles.weekSelectedStatusText}>
                Đã chọn {selectedWeekdays.length} ngày trong tuần
              </Text>
            </View>
          </View>

          {/* Bottom Action Area */}
          <View style={styles.bottomArea}>
            <Text style={styles.hintText}>
              {isFormValid
                ? `Sẵn sàng phân ca cho ${selectedEmployees.length} nhân sự`
                : isAdmin
                ? 'Chọn Leader và ca làm để tiếp tục.'
                : 'Chọn nhân viên và ca làm để tiếp tục.'}
            </Text>
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
        </ScrollView>
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
          setSelectedRegionId(opt.id || 'ALL');
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
          setSelectedBranchId(opt.id || 'ALL');
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
          setSelectedDeptId(opt.id || 'ALL');
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
        selectedValues={selectedEmployees.map(e => e.id).filter((id): id is string => Boolean(id))}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#102739',
  },
  headerWrap: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    backgroundColor: '#102739',
  },
  headerMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    padding: 4,
    marginLeft: -4,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 13.5,
    color: 'rgba(255, 255, 255, 0.72)',
    fontWeight: '500',
    marginTop: 2,
  },

  /* ── Curved Body Sheet ── */
  curvedSheet: {
    flex: 1,
    backgroundColor: '#F4F6F9',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 18,
    gap: 14,
  },

  /* ── Cards ── */
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EDF2F7',
    shadowColor: '#102739',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  stepBadge: {
    backgroundColor: '#E7F0F7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  stepBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#102739',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#102739',
  },

  /* ── Card 01: Dept Box ── */
  deptCardBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  deptIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F0F4F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deptInfoCol: {
    flex: 1,
  },
  deptNameText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#102739',
    letterSpacing: -0.2,
  },
  deptBranchText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 3,
  },
  deptScopeBadge: {
    backgroundColor: '#E7F0F7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  deptScopeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#102739',
  },

  /* ── Form Fields ── */
  fieldHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    marginTop: 2,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
    marginTop: 10,
  },
  quickSelectPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: '#E7F0F7',
  },
  quickSelectPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#102739',
  },
  selectPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 12,
    paddingHorizontal: 14,
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
    fontWeight: '600',
    color: '#102739',
    flex: 1,
  },
  placeholderText: {
    color: '#64748B',
    fontWeight: '500',
  },
  dateRangeText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#102739',
    flex: 1,
  },

  /* ── Card 03: Weekdays ── */
  weekdayHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 6,
  },
  weekdayHintText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  weekdayGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
    marginVertical: 4,
  },
  dayCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
  },
  dayCardActive: {
    backgroundColor: '#102739',
    borderWidth: 1,
    borderColor: '#102739',
  },
  dayCardInactive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dayCardLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 3,
  },
  dayCardLabelActive: {
    color: '#94B5CB',
  },
  dayCardLabelInactive: {
    color: '#64748B',
  },
  dayCardNum: {
    fontSize: 14.5,
    fontWeight: '800',
  },
  dayCardNumActive: {
    color: '#FFFFFF',
  },
  dayCardNumInactive: {
    color: '#102739',
  },
  weekSelectedStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  weekSelectedStatusText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#102739',
  },

  /* ── Bottom Submit Area ── */
  bottomArea: {
    marginTop: 4,
    paddingTop: 10,
  },
  hintText: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '500',
  },
  submitBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnActive: {
    backgroundColor: '#102739',
    shadowColor: '#102739',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  submitBtnDisabled: {
    backgroundColor: '#CBD5E1',
  },
  submitBtnText: {
    fontSize: 15.5,
    fontWeight: '800',
  },
  submitBtnTextActive: {
    color: '#FFFFFF',
  },
  submitBtnTextDisabled: {
    color: '#8A9BA8',
  },
});
