import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
  TextInput,
  Platform,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useRouter, useSegments, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { SelectModal, SelectOption } from '../../components/SelectModal';
import { CustomDatePickerModal } from '../../components/CustomDatePickerModal';
import { CustomAlert } from '../../components/CustomAlert';

import { useAuth } from '../../providers/AuthProvider';
import { useShifts, useAssignShiftBatch, useDepartmentShiftAssignments } from '../../hooks/useShifts';
import { useScopedEmployees } from '../../hooks/useEmployees';
import { useRegions } from '../../api/regions.api';
import { useBranches } from '../../api/branches.api';
import { useDepartments } from '../../hooks/useDepartments';
import { normalizeApiError } from '../../utils/api-error';
import { toIsoDate } from '../../utils/date-time';


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

  // Tab & Mode States (Phân ca tuần vs Vá ca đột xuất)
  const params = useLocalSearchParams<{ mode?: string }>();
  const [activeTab, setActiveTab] = useState<'weekly' | 'patch'>(() => {
    return params.mode === 'patch' ? 'patch' : 'weekly';
  });

  useEffect(() => {
    if (params.mode === 'patch') {
      setActiveTab('patch');
    }
  }, [params.mode]);

  // Patch (Vá ca đột xuất) States
  const [patchDate, setPatchDate] = useState<Date>(() => new Date());
  const [showPatchDatePicker, setShowPatchDatePicker] = useState(false);
  const [selectedPatchShift, setSelectedPatchShift] = useState<SelectOption | null>(null);
  const [patchShiftModalVisible, setPatchShiftModalVisible] = useState(false);
  const [selectedPatchUserIds, setSelectedPatchUserIds] = useState<string[]>([]);
  const [patchReason, setPatchReason] = useState<string>('Bổ sung nhân sự ca thiếu đột xuất');

  // Card 03 States (Schedule)
  const [workDate, setWorkDate] = useState<Date>(() => new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  // Default Monday to Saturday: indices 0 to 5
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([0, 1, 2, 3, 4, 5]);
  const [refreshing, setRefreshing] = useState(false);

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

  // Week Days array computation around workDate (computed early for assignment lookup)
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

  const datesToAssign = useMemo(() => {
    return selectedWeekdays
      .map(index => weekInfo.days[index]?.dateIso)
      .filter(Boolean) as string[];
  }, [selectedWeekdays, weekInfo]);

  const queryStartDate = useMemo(() => {
    const mondayIso = weekInfo.days[0]?.dateIso || toIsoDate(workDate);
    const patchIso = toIsoDate(patchDate);
    return mondayIso < patchIso ? mondayIso : patchIso;
  }, [weekInfo, workDate, patchDate]);

  const queryEndDate = useMemo(() => {
    const sundayIso = weekInfo.days[6]?.dateIso || toIsoDate(workDate);
    const patchIso = toIsoDate(patchDate);
    return sundayIso > patchIso ? sundayIso : patchIso;
  }, [weekInfo, workDate, patchDate]);

  // Query existing department shift assignments
  const currentTargetDeptId = isAdmin ? (selectedDeptId !== 'ALL' ? selectedDeptId : undefined) : leaderDeptId;
  const deptAssignmentsQuery = useDepartmentShiftAssignments(
    currentTargetDeptId && queryStartDate && queryEndDate
      ? {
          departmentId: currentTargetDeptId,
          startDate: queryStartDate,
          endDate: queryEndDate,
        }
      : undefined,
    Boolean(currentTargetDeptId)
  );
  const existingAssignments = deptAssignmentsQuery.data || [];

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      allShiftsQuery.refetch(),
      employeesQuery.refetch(),
      refetchRegions(),
      refetchBranches(),
      refetchDepartments(),
      deptAssignmentsQuery.refetch(),
    ]);
    setRefreshing(false);
  }, [allShiftsQuery, employeesQuery, refetchRegions, refetchBranches, refetchDepartments, deptAssignmentsQuery]);

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

      // Check existing shift assignments in the selected dates
      const assignedInDates = existingAssignments.filter(
        (a: any) => a.userId === emp.id && datesToAssign.includes(toIsoDate(a.workDate))
      );
      if (assignedInDates.length > 0) {
        const shiftNames = Array.from(new Set(assignedInDates.map((a: any) => a.shift?.name).filter(Boolean)));
        parts.push(`Đang xếp: ${shiftNames.join(', ')}`);
      }

      return {
        id: emp.id,
        label: isMe ? `${emp.fullName ?? emp.userCode} (Bạn)` : (emp.fullName ?? emp.userCode),
        subtitle: parts.join(' · '),
        raw: emp,
      };
    });
  }, [employeesQuery.data, isAdmin, effectiveRegionId, selectedBranchId, selectedDeptId, leaderDeptId, user?.id, existingAssignments, datesToAssign]);

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

  // Find employees that already have a different shift on any of the selected dates
  const conflictedEmployees = useMemo(() => {
    if (!selectedShift || selectedEmployees.length === 0 || datesToAssign.length === 0) return [];
    const list: { id: string; name: string; shifts: string[] }[] = [];
    for (const empOpt of selectedEmployees) {
      const empId = empOpt.id;
      if (!empId) continue;
      const conflicts = existingAssignments.filter(
        (a: any) => a.userId === empId && datesToAssign.includes(toIsoDate(a.workDate)) && a.shiftId !== selectedShift.id
      );
      if (conflicts.length > 0) {
        const shiftNames = Array.from(new Set(conflicts.map((c: any) => c.shift?.name).filter(Boolean)));
        list.push({ id: empId, name: empOpt.label, shifts: shiftNames as string[] });
      }
    }
    return list;
  }, [selectedShift, selectedEmployees, datesToAssign, existingAssignments]);

  const executeAssignment = async (allowOverwrite: boolean) => {
    if (datesToAssign.length === 0) {
      CustomAlert.alert('Lỗi', 'Vui lòng chọn ít nhất một ngày trong tuần.');
      return;
    }

    const deptGroups = new Map<string, string[]>();
    for (const empOpt of selectedEmployees) {
      const raw = (empOpt as any).raw;
      const dId = raw?.department?.id || (isAdmin ? (selectedDeptId !== 'ALL' ? selectedDeptId : undefined) : leaderDeptId);
      if (!dId) {
        CustomAlert.alert('Cảnh báo', `Nhân sự "${empOpt.label}" chưa xác định được phòng ban áp dụng.`);
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
        allowOverwrite,
        reason: allowOverwrite ? 'Điều chuyển / Vá ca bởi Leader' : undefined,
      });
    }

    CustomAlert.alert(
      'Thành công',
      allowOverwrite
        ? `Đã phân ca & điều chuyển thành công cho ${selectedEmployees.length} nhân sự.`
        : `Đã phân ca tuần thành công cho ${selectedEmployees.length} ${isAdmin ? 'Leader' : 'nhân viên'}.`,
      [{ text: 'OK', onPress: () => router.back() }]
    );
  };

  const handleSubmit = async () => {
    if (selectedEmployees.length === 0 || !selectedShift) return;

    if (conflictedEmployees.length > 0) {
      const namesList = conflictedEmployees
        .slice(0, 3)
        .map(c => `• ${c.name}: ${c.shifts.join(', ')}`)
        .join('\n');
      const moreText = conflictedEmployees.length > 3 ? `\nvà ${conflictedEmployees.length - 3} nhân sự khác...` : '';

      CustomAlert.alert(
        'Điều chuyển ca làm việc (Vá ca)',
        `Phát hiện ${conflictedEmployees.length} nhân sự đã có lịch làm việc trong ngày đã chọn:\n\n${namesList}${moreText}\n\nBạn có muốn điều chuyển/vá ca các nhân sự này sang "${selectedShift.label}" không?\n(Chỉ áp dụng với nhân sự chưa check-in)`,
        [
          { text: 'Hủy bỏ', style: 'cancel' },
          {
            text: 'Đồng ý điều chuyển',
            onPress: () => {
              void executeAssignment(true).catch(error => {
                const normalized = normalizeApiError(error);
                CustomAlert.alert('Lỗi phân ca', normalized.message);
              });
            },
          },
        ]
      );
      return;
    }

    try {
      await executeAssignment(false);
    } catch (error) {
      const normalized = normalizeApiError(error);
      CustomAlert.alert('Lỗi phân ca', normalized.message);
    }
  };

  // Patch (Vá ca đột xuất) Helpers & Computations
  const formatPatchDateText = (d: Date) => {
    const today = new Date();
    const isToday =
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear();

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const weekdayNames = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
    const weekdayStr = weekdayNames[d.getDay()];

    if (isToday) {
      return `Hôm nay, ${weekdayStr} (${day}/${month}/${year})`;
    }
    return `${weekdayStr}, ${day}/${month}/${year}`;
  };

  const patchCandidates = useMemo(() => {
    if (!employeeOptions || employeeOptions.length === 0) return [];
    const patchDateIso = toIsoDate(patchDate);

    const assignmentsOnDate = existingAssignments.filter(
      (a: any) => toIsoDate(a.workDate) === patchDateIso
    );

    return employeeOptions.map(opt => {
      const empId = opt.id!;
      const assignment = assignmentsOnDate.find((a: any) => a.userId === empId);
      const isAlreadyInTarget = Boolean(
        selectedPatchShift && assignment && assignment.shiftId === selectedPatchShift.id
      );
      const hasCheckedIn = Boolean(
        assignment?.attendanceRecords && assignment.attendanceRecords.length > 0
      );
      const currentShiftName = assignment?.shift?.name || null;
      const currentShiftTime = assignment?.shift
        ? `${assignment.shift.startTime} - ${assignment.shift.endTime}`
        : null;

      const canSelect = !isAlreadyInTarget && !hasCheckedIn;

      return {
        id: empId,
        label: opt.label,
        subtitle: opt.subtitle,
        assignment,
        currentShiftName,
        currentShiftTime,
        isAlreadyInTarget,
        hasCheckedIn,
        canSelect,
      };
    });
  }, [employeeOptions, existingAssignments, patchDate, selectedPatchShift]);

  const currentTargetShiftStaff = useMemo(() => {
    if (!selectedPatchShift) return [];
    return patchCandidates.filter(c => c.isAlreadyInTarget);
  }, [patchCandidates, selectedPatchShift]);

  const eligibleCandidates = useMemo(() => {
    return patchCandidates.filter(c => !c.isAlreadyInTarget);
  }, [patchCandidates]);

  const toggleSelectPatchUser = (userId: string, canSelect: boolean) => {
    if (!canSelect) {
      CustomAlert.alert(
        'Không thể chọn',
        'Nhân sự này đã check-in ca làm việc trong ngày hôm nay nên không thể điều chuyển ca.'
      );
      return;
    }
    setSelectedPatchUserIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const selectAllEligiblePatchUsers = () => {
    const eligible = eligibleCandidates.filter(c => c.canSelect).map(c => c.id);
    if (selectedPatchUserIds.length === eligible.length && eligible.length > 0) {
      setSelectedPatchUserIds([]);
    } else {
      setSelectedPatchUserIds(eligible);
    }
  };

  const handlePatchSubmit = async () => {
    if (!selectedPatchShift) {
      CustomAlert.alert('Chưa chọn ca', 'Vui lòng chọn ca làm việc đang thiếu người cần vá.');
      return;
    }
    if (selectedPatchUserIds.length === 0) {
      CustomAlert.alert('Chưa chọn nhân sự', 'Vui lòng chọn ít nhất một nhân sự để điều chuyển vá ca.');
      return;
    }

    const currentDeptId = isAdmin ? (selectedDeptId !== 'ALL' ? selectedDeptId : undefined) : leaderDeptId;
    if (!currentDeptId) {
      CustomAlert.alert('Lỗi', 'Chưa xác định được phòng ban áp dụng.');
      return;
    }

    const patchDateIso = toIsoDate(patchDate);

    CustomAlert.alert(
      'Xác nhận điều chuyển (Vá ca)',
      `Bạn có chắc chắn muốn điều chuyển ${selectedPatchUserIds.length} nhân sự sang "${selectedPatchShift.label}" vào ngày ${formatPatchDateText(patchDate)}?\n\nLý do: ${patchReason.trim() || 'Điều chuyển / Vá ca đột xuất'}`,
      [
        { text: 'Hủy bỏ', style: 'cancel' },
        {
          text: 'Xác nhận vá ca',
          onPress: async () => {
            try {
              await assignBatchMutation.mutateAsync({
                userIds: selectedPatchUserIds,
                departmentId: currentDeptId,
                shiftId: selectedPatchShift.id!,
                dates: [patchDateIso],
                allowOverwrite: true,
                reason: patchReason.trim() || 'Điều chuyển / Vá ca đột xuất',
              });

              CustomAlert.alert(
                'Thành công',
                `Đã điều chuyển ${selectedPatchUserIds.length} nhân sự sang "${selectedPatchShift.label}" thành công!`,
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      setSelectedPatchUserIds([]);
                      void deptAssignmentsQuery.refetch();
                    },
                  },
                ]
              );
            } catch (error) {
              const normalized = normalizeApiError(error);
              CustomAlert.alert('Lỗi điều chuyển ca', normalized.message);
            }
          },
        },
      ]
    );
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
            <Text style={styles.headerTitle}>
              {activeTab === 'weekly' ? 'Phân ca làm việc' : 'Vá ca đột xuất'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {activeTab === 'weekly'
                ? isAdmin
                  ? 'Sắp xếp lịch làm việc cho Leader.'
                  : 'Sắp xếp lịch làm việc cho nhân viên.'
                : 'Điều chuyển nhân sự ca sau lên vá vào ca thiếu người.'}
            </Text>
          </View>
          <Pressable
            onPress={() => router.push((isAdmin ? '/admin/shifts' : '/leader/shifts') as any)}
            style={styles.headerRightBtn}
            accessibilityLabel="Xem danh sách ca"
          >
            <MaterialCommunityIcons name="format-list-bulleted" size={15} color="#FFFFFF" />
            <Text style={styles.headerRightBtnText}>Danh sách ca</Text>
          </Pressable>
        </View>
      </View>

      {/* ── Main Curved Sheet ── */}
      <View style={styles.curvedSheet}>
        {/* ── Segmented Tab Switcher ── */}
        <View style={styles.tabBarContainer}>
          <Pressable
            onPress={() => setActiveTab('weekly')}
            style={[styles.tabBarItem, activeTab === 'weekly' && styles.tabBarItemActive]}
          >
            <Text style={[styles.tabBarText, activeTab === 'weekly' && styles.tabBarTextActive]}>
              Phân ca tuần
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('patch')}
            style={[styles.tabBarItem, activeTab === 'patch' && styles.tabBarItemPatchActive]}
          >
            <Text style={[styles.tabBarText, activeTab === 'patch' && styles.tabBarTextActive]}>
              Vá ca đột xuất
            </Text>
          </Pressable>
        </View>

        <KeyboardAwareScrollView
            style={{ flex: 1 }}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: Math.max(insets.bottom, 24) + 120 },
            ]}
            showsVerticalScrollIndicator={false}
            enableOnAndroid={true}
            enableAutomaticScroll={true}
            extraScrollHeight={Platform.OS === 'ios' ? 120 : 150}
            extraHeight={150}
            keyboardOpeningTime={0}
            keyboardShouldPersistTaps="handled"
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />}
          >
            {activeTab === 'weekly' ? (
              <>
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
                      <Text style={styles.quickSelectPillText}>Tất cả ({employeeOptions.length})</Text>
                    </Pressable>
                  </View>

                  <Pressable style={styles.selectPill} onPress={() => setEmployeeModalVisible(true)}>
                    <View style={styles.selectLeft}>
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
                      <Text
                        style={[styles.selectText, !selectedShift && styles.placeholderText]}
                        numberOfLines={1}
                      >
                        {selectedShift ? `${selectedShift.label} (${selectedShift.subtitle})` : 'Chọn ca làm...'}
                      </Text>
                    </View>
                    <Ionicons name="chevron-down" size={18} color="#64748B" />
                  </Pressable>

                  {/* Reassign / Vá ca Warning Notice */}
                  {conflictedEmployees.length > 0 && (
                    <View style={styles.reassignNoticeBox}>
                      <View style={styles.reassignNoticeContent}>
                        <Text style={styles.reassignNoticeTitle}>
                          Có {conflictedEmployees.length} nhân sự đã có lịch trong ngày đã chọn
                        </Text>
                        <Text style={styles.reassignNoticeSubtitle}>
                          Hệ thống sẽ tự động điều chuyển / vá sang ca này khi bạn xác nhận (áp dụng với nhân sự chưa check-in).
                        </Text>
                      </View>
                    </View>
                  )}
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
                      <Text style={styles.dateRangeText}>{weekInfo.rangeStr}</Text>
                    </View>
                    <Ionicons name="chevron-down" size={18} color="#64748B" />
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
              </>
            ) : (
              <>
                {/* ── PATCH WORKFLOW ── */}
                {/* CARD 01: Phạm vi / Phòng ban */}
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

                {/* CARD 02: Ca cần vá (Ca thiếu người) & Ngày áp dụng */}
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.stepBadge}>
                      <Text style={styles.stepBadgeText}>02</Text>
                    </View>
                    <Text style={styles.cardTitle}>Ca cần vá (Ca thiếu người)</Text>
                  </View>

                  {/* Ngày áp dụng */}
                  <Text style={styles.fieldLabel}>Ngày vá ca</Text>
                  <Pressable style={styles.selectPill} onPress={() => setShowPatchDatePicker(true)}>
                    <View style={styles.selectLeft}>
                      <Text style={styles.dateRangeText}>{formatPatchDateText(patchDate)}</Text>
                    </View>
                    <Ionicons name="chevron-down" size={18} color="#64748B" />
                  </Pressable>

                  {/* Chọn ca thiếu */}
                  <Text style={styles.fieldLabel}>Ca đang thiếu người (Ca đích)</Text>
                  <Pressable style={styles.selectPill} onPress={() => setPatchShiftModalVisible(true)}>
                    <View style={styles.selectLeft}>
                      <Text
                        style={[styles.selectText, !selectedPatchShift && styles.placeholderText]}
                        numberOfLines={1}
                      >
                        {selectedPatchShift
                          ? `${selectedPatchShift.label} (${selectedPatchShift.subtitle})`
                          : 'Chọn ca cần bổ sung người...'}
                      </Text>
                    </View>
                    <Ionicons name="chevron-down" size={18} color="#64748B" />
                  </Pressable>

                  {/* Tóm tắt quân số ca đích */}
                  {selectedPatchShift && (
                    <View style={styles.targetShiftSummaryBox}>
                      <Text style={styles.targetShiftSummaryTitle}>
                        Quân số hiện tại: {currentTargetShiftStaff.length} nhân sự
                      </Text>
                      {currentTargetShiftStaff.length > 0 ? (
                        <Text style={styles.targetShiftSummaryNames} numberOfLines={2}>
                          Đang có: {currentTargetShiftStaff.map(s => s.label).join(', ')}
                        </Text>
                      ) : (
                        <Text style={styles.targetShiftSummaryEmpty}>
                          Ca này hiện chưa có nhân sự nào. Vui lòng chọn nhân sự bên dưới để vá ca.
                        </Text>
                      )}
                    </View>
                  )}
                </View>

                {/* CARD 03: Chọn nhân sự bốc từ ca khác sang */}
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.stepBadge}>
                      <Text style={styles.stepBadgeText}>03</Text>
                    </View>
                    <Text style={styles.cardTitle}>Nhân sự điều chuyển (Bốc sang vá)</Text>
                  </View>

                  {/* Header Row */}
                  <View style={styles.fieldHeaderRow}>
                    <Text style={styles.fieldLabel}>
                      Ứng viên có thể điều chuyển ({eligibleCandidates.length})
                    </Text>
                    <Pressable onPress={selectAllEligiblePatchUsers} style={styles.quickSelectPill}>
                      <Text style={styles.quickSelectPillText}>Chọn tất cả hợp lệ</Text>
                    </Pressable>
                  </View>

                  {eligibleCandidates.length === 0 ? (
                    <View style={styles.emptyCandidatesBox}>
                      <Text style={styles.emptyCandidatesText}>
                        Không tìm thấy nhân sự khả dụng để điều chuyển trong ngày này.
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.candidateList}>
                      {eligibleCandidates.map(candidate => {
                        const isSelected = selectedPatchUserIds.includes(candidate.id);
                        return (
                          <Pressable
                            key={candidate.id}
                            onPress={() => toggleSelectPatchUser(candidate.id, candidate.canSelect)}
                            style={[
                              styles.candidateItem,
                              isSelected && styles.candidateItemSelected,
                              !candidate.canSelect && styles.candidateItemDisabled,
                            ]}
                          >
                            <View
                              style={[
                                styles.candidateCheckbox,
                                isSelected && styles.candidateCheckboxSelected,
                                !candidate.canSelect && styles.candidateCheckboxDisabled,
                              ]}
                            >
                              {isSelected && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                            </View>

                            <View style={styles.candidateInfo}>
                              <View style={styles.candidateNameRow}>
                                <Text
                                  style={[
                                    styles.candidateName,
                                    !candidate.canSelect && styles.candidateTextDisabled,
                                  ]}
                                >
                                  {candidate.label}
                                </Text>
                              </View>
                              <Text style={styles.candidateSubtitle}>{candidate.subtitle}</Text>

                              {/* Shift & Attendance Status Badges */}
                              <View style={styles.candidateBadgeRow}>
                                {candidate.currentShiftName ? (
                                  <View style={styles.currentShiftBadge}>
                                    <Text style={styles.currentShiftBadgeText}>
                                      Đang ở: {candidate.currentShiftName} ({candidate.currentShiftTime})
                                    </Text>
                                  </View>
                                ) : (
                                  <View style={styles.noShiftBadge}>
                                    <Text style={styles.noShiftBadgeText}>Chưa xếp ca</Text>
                                  </View>
                                )}

                                {candidate.hasCheckedIn ? (
                                  <View style={styles.checkedInBadge}>
                                    <Text style={styles.checkedInBadgeText}>Đã check-in (Khóa)</Text>
                                  </View>
                                ) : (
                                  <View style={styles.eligibleBadge}>
                                    <Text style={styles.eligibleBadgeText}>Hợp lệ vá ca</Text>
                                  </View>
                                )}
                              </View>
                            </View>
                          </Pressable>
                        );
                      })}
                    </View>
                  )}
                </View>

                {/* CARD 04: Lý do điều chuyển */}
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.stepBadge}>
                      <Text style={styles.stepBadgeText}>04</Text>
                    </View>
                    <Text style={styles.cardTitle}>Lý do điều chuyển</Text>
                  </View>

                  <TextInput
                    style={styles.reasonInput}
                    value={patchReason}
                    onChangeText={setPatchReason}
                    placeholder="Nhập lý do điều chuyển / vá ca..."
                    placeholderTextColor="#94A3B8"
                    multiline
                  />
                </View>

                {/* Bottom Patch Action Area */}
                <View style={styles.bottomArea}>
                  <Text style={styles.hintText}>
                    {selectedPatchUserIds.length > 0 && selectedPatchShift
                      ? `Sẵn sàng điều chuyển ${selectedPatchUserIds.length} nhân sự sang "${selectedPatchShift.label}"`
                      : 'Chọn ca thiếu và tích chọn nhân sự để tiến hành vá ca.'}
                  </Text>
                  <Pressable
                    onPress={() => void handlePatchSubmit()}
                    disabled={
                      selectedPatchUserIds.length === 0 ||
                      !selectedPatchShift ||
                      assignBatchMutation.isPending
                    }
                    style={[
                      styles.submitPatchBtn,
                      selectedPatchUserIds.length > 0 && selectedPatchShift
                        ? styles.submitPatchBtnActive
                        : styles.submitBtnDisabled,
                    ]}
                    android_ripple={{ color: 'rgba(255,255,255,0.1)' }}
                  >
                    {assignBatchMutation.isPending ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Text style={styles.submitBtnText}>
                        Xác nhận vá ca ({selectedPatchUserIds.length})
                      </Text>
                    )}
                  </Pressable>
                </View>
              </>
            )}
          </KeyboardAwareScrollView>
      </View>

      {/* Date Picker Modal for Weekly */}
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

      {/* Date Picker Modal for Patch */}
      {showPatchDatePicker && (
        <CustomDatePickerModal
          visible={true}
          initialDate={patchDate}
          onClose={() => setShowPatchDatePicker(false)}
          onSelect={date => {
            setShowPatchDatePicker(false);
            setPatchDate(date);
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

      <SelectModal
        visible={patchShiftModalVisible}
        title="Chọn ca đang thiếu người (Ca đích)"
        options={shiftOptions}
        isLoading={allShiftsQuery.isLoading}
        selectedValue={selectedPatchShift?.id}
        onSelect={setSelectedPatchShift}
        onClose={() => setPatchShiftModalVisible(false)}
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
  headerRightBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  headerRightBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
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

  /* ── Reassign / Vá ca Notice ── */
  reassignNoticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 12,
    marginTop: 12,
    gap: 10,
  },
  reassignNoticeIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  reassignNoticeContent: {
    flex: 1,
  },
  reassignNoticeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 2,
  },
  reassignNoticeSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#B45309',
    lineHeight: 16,
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

  /* ── Tab Switcher ── */
  tabBarContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 4,
    borderRadius: 14,
    padding: 4,
    gap: 6,
  },
  tabBarItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  tabBarItemActive: {
    backgroundColor: '#102739',
    shadowColor: '#102739',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  tabBarItemPatchActive: {
    backgroundColor: '#D97706',
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  tabBarText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#64748B',
  },
  tabBarTextActive: {
    color: '#FFFFFF',
  },

  /* ── Target Shift Summary ── */
  targetShiftSummaryBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginTop: 10,
  },
  targetShiftSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  targetShiftSummaryTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#102739',
  },
  targetShiftSummaryNames: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    lineHeight: 16,
  },
  targetShiftSummaryEmpty: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D97706',
    lineHeight: 16,
  },

  /* ── Candidate List ── */
  emptyCandidatesBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
    gap: 8,
  },
  emptyCandidatesText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
    textAlign: 'center',
  },
  candidateList: {
    gap: 10,
    marginTop: 6,
  },
  candidateItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: 12,
    gap: 12,
  },
  candidateItemSelected: {
    borderColor: '#D97706',
    backgroundColor: '#FFFBEB',
  },
  candidateItemDisabled: {
    opacity: 0.55,
    backgroundColor: '#F1F5F9',
  },
  candidateCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    backgroundColor: '#FFFFFF',
  },
  candidateCheckboxSelected: {
    backgroundColor: '#D97706',
    borderColor: '#D97706',
  },
  candidateCheckboxDisabled: {
    borderColor: '#CBD5E1',
    backgroundColor: '#E2E8F0',
  },
  candidateInfo: {
    flex: 1,
  },
  candidateNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  candidateName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#102739',
  },
  candidateTextDisabled: {
    color: '#64748B',
  },
  candidateSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 2,
  },
  candidateBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  currentShiftBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  currentShiftBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4338CA',
  },
  noShiftBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  noShiftBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  checkedInBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  checkedInBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  eligibleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  eligibleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },

  /* ── Patch Reason Input ── */
  reasonInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: '500',
    color: '#102739',
  },

  /* ── Submit Patch Button ── */
  submitPatchBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitPatchBtnActive: {
    backgroundColor: '#D97706',
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  submitPatchBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
