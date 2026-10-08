import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  RefreshControl,
  Image,
  LayoutAnimation,
  Platform,
  UIManager,
  Switch,
  Modal,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  PanResponder,
  Dimensions,
  BackHandler,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen } from '../../components/Screen';
import { PageHeader } from '../../components/PageHeader';
import { SearchInput } from '../../components/SearchInput';
import { LoadingState } from '../../components/LoadingState';
import { EmptyState } from '../../components/EmptyState';
import { useDepartments } from '../../hooks/useDepartments';
import { useEmployees } from '../../hooks/useEmployees';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import type { Department } from '../../types/department.types';
import type { EmployeeUser } from '../../types/employee.types';
import { useQueryClient } from '@tanstack/react-query';
import { updateEmployee as apiUpdateEmployee, getVaultWithdrawalRequests } from '../../api/employees.api';
import { useRegions } from '../../api/regions.api';
import { AdminGrantPointsScreen, type GrantTarget } from './AdminGrantPointsScreen';
import { WithdrawalRequestsManager } from './WithdrawalRequestsManager';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../providers/AuthProvider';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const getInitials = (name: string) => {
  if (!name) return 'NV';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'NV';
  const first = parts[0] ?? '';
  if (parts.length === 1) return first.substring(0, 2).toUpperCase();
  const last = parts[parts.length - 1] ?? '';
  return ((first.charAt(0) || '') + (last.charAt(0) || '')).toUpperCase() || 'NV';
};

type MainTab = 'MEMBERS' | 'WITHDRAWALS';
type ViewMode = 'BY_DEPARTMENT' | 'ALL_EMPLOYEES';
type FilterStatus = 'ALL' | 'ENABLED' | 'DISABLED';

export function AdminTetWalletScreen() {
  const { user } = useAuth();
  const isRegionAdmin = Boolean(
    user?.roles?.includes('ADMIN') &&
    user?.scopes?.some((s: any) => (s.role === 'ADMIN' || s.role?.code === 'ADMIN') && s.scopeType === 'REGION')
  );
  const isGlobalAdmin = Boolean(
    user?.roles?.includes('SUPER_ADMIN') ||
    (user?.roles?.includes('ADMIN') && !isRegionAdmin)
  );
  const regionIds = useMemo(() => {
    return (
      user?.scopes
        ?.filter((s: any) => (s.role === 'ADMIN' || s.role?.code === 'ADMIN') && s.scopeType === 'REGION' && s.scopeId)
        .map((s: any) => s.scopeId) || []
    );
  }, [user]);

  const { data: regionsData = [] } = useRegions();

  const canManageTetWallet = isGlobalAdmin || isRegionAdmin;

  const params = useLocalSearchParams<{ tab?: string }>();
  const [mainTab, setMainTab] = useState<MainTab>(params.tab === 'WITHDRAWALS' ? 'WITHDRAWALS' : 'MEMBERS');
  const [viewMode, setViewMode] = useState<ViewMode>('BY_DEPARTMENT');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('ALL');
  const [search, setSearch] = useState('');
  const [expandedDeptIds, setExpandedDeptIds] = useState<Record<string, boolean>>({});
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeUser | null>(null);
  const [togglingEmpId, setTogglingEmpId] = useState<string | null>(null);

  // Grant Target State
  const [grantTarget, setGrantTarget] = useState<GrantTarget | null>(null);

  useEffect(() => {
    if (params.tab === 'WITHDRAWALS') {
      setMainTab('WITHDRAWALS');
    }
  }, [params.tab]);

  const router = useRouter();
  const screenWidth = Dimensions.get('window').width;

  // Handle hardware back on Android to return to Home/Dashboard
  useEffect(() => {
    const onBackPress = () => {
      if (grantTarget) {
        setGrantTarget(null);
        return true;
      }
      if (selectedEmployee) {
        setSelectedEmployee(null);
        return true;
      }
      router.back();
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [grantTarget, selectedEmployee, router]);

  // Swipe gesture from left edge to return to Home/Dashboard
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (evt, gestureState) => {
          return (
            evt.nativeEvent.pageX <= 65 &&
            gestureState.dx > 10 &&
            Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.2
          );
        },
        onPanResponderRelease: (evt, gestureState) => {
          if (gestureState.dx > screenWidth * 0.2 || gestureState.vx > 0.25) {
            router.back();
          }
        },
      }),
    [router, screenWidth]
  );

  const queryClient = useQueryClient();
  const departmentsQuery = useDepartments({ limit: 100 });
  const employeesQuery = useEmployees({ limit: 500 });
  const withdrawalsQuery = useQuery({
    queryKey: ['vault-withdrawals-admin-badge'],
    queryFn: () => getVaultWithdrawalRequests({ status: 'PENDING_ADMIN', limit: 1 }),
  });
  const pendingAdminCount = withdrawalsQuery.data?.counts?.PENDING_ADMIN || 0;

  const isRefetching = departmentsQuery.isRefetching || employeesQuery.isRefetching || withdrawalsQuery.isRefetching;
  const isLoading = departmentsQuery.isLoading || employeesQuery.isLoading;

  const onRefresh = useCallback(async () => {
    await Promise.all([departmentsQuery.refetch(), employeesQuery.refetch(), withdrawalsQuery.refetch()]);
  }, [departmentsQuery, employeesQuery, withdrawalsQuery]);

  const rawDepartments: Department[] = departmentsQuery.data?.items || [];
  const departments: Department[] = useMemo(() => {
    if (isRegionAdmin && !isGlobalAdmin && regionIds.length > 0) {
      const filtered = rawDepartments.filter(
        (d) =>
          (d.branch?.region?.id && regionIds.includes(d.branch.region.id)) ||
          ((d.branch as any)?.regionId && regionIds.includes((d.branch as any).regionId))
      );
      return filtered.length > 0 ? filtered : rawDepartments;
    }
    return rawDepartments;
  }, [rawDepartments, isRegionAdmin, isGlobalAdmin, regionIds]);

  const regionDeptIdSet = useMemo(() => new Set(departments.map((d) => d.id)), [departments]);

  const managedRegion = useMemo(() => {
    if (!isRegionAdmin || isGlobalAdmin) return null;
    if (regionIds.length > 0) {
      const found = (regionsData as any[]).find((r: any) => regionIds.includes(r.id));
      if (found) return found;
    }
    const firstWithRegion = departments.find((d) => d.branch?.region);
    return firstWithRegion?.branch?.region || null;
  }, [isRegionAdmin, isGlobalAdmin, regionsData, regionIds, departments]);

  const rawEmployees: EmployeeUser[] = employeesQuery.data?.items || [];
  const employees: EmployeeUser[] = useMemo(() => {
    if (isRegionAdmin && !isGlobalAdmin) {
      return rawEmployees.filter((emp) =>
        emp.departmentLinks?.some((link) => regionDeptIdSet.has(link.departmentId))
      );
    }
    return rawEmployees;
  }, [rawEmployees, isRegionAdmin, isGlobalAdmin, regionDeptIdSet]);

  // Group employees by department ID
  const employeesByDept = useMemo(() => {
    const map: Record<string, EmployeeUser[]> = {};
    employees.forEach((emp) => {
      const links = emp.departmentLinks || [];
      if (links.length === 0) {
        if (!map['UNASSIGNED']) map['UNASSIGNED'] = [];
        map['UNASSIGNED'].push(emp);
      } else {
        links.forEach((link) => {
          const deptId = link.departmentId;
          if (!map[deptId]) map[deptId] = [];
          if (!map[deptId].some((e) => e.id === emp.id)) {
            map[deptId].push(emp);
          }
        });
      }
    });
    return map;
  }, [employees]);

  // Statistics
  const totalEmployees = employees.length;
  const enabledCount = employees.filter((e) => Boolean(e.isRewardVaultEnabled)).length;
  const disabledCount = totalEmployees - enabledCount;

  // Calculate total points granted across all employees
  const totalPointsGranted = useMemo(() => {
    return employees.reduce((sum, emp) => {
      const vault = emp.retentionVaults?.[0];
      const annualPts = vault ? Number(vault.grantedPoints || 0) : 0;
      const instantPts = vault ? Number(vault.instantBonusPoints || 0) : 0;
      return sum + annualPts + instantPts;
    }, 0);
  }, [employees]);

  // Open Grant Screen for Single Employee
  const openGrantForEmployee = (emp: EmployeeUser) => {
    if (!canManageTetWallet) {
      CustomAlert.alert(
        'Không có quyền trao điểm',
        'Tài khoản không có quyền trao điểm thưởng Ví Tết.'
      );
      return;
    }
    if (isRegionAdmin && !isGlobalAdmin) {
      const isInRegion = emp.departmentLinks?.some((link) => regionDeptIdSet.has(link.departmentId));
      if (!isInRegion) {
        CustomAlert.alert(
          'Không thuộc miền quản lý',
          `Bạn chỉ có quyền trao điểm thưởng cho nhân sự thuộc các phòng ban trong ${managedRegion?.name ? `miền "${managedRegion.name}"` : 'miền mình quản lý'}.`
        );
        return;
      }
    }
    setSelectedEmployee(null);
    setGrantTarget({
      type: 'SINGLE',
      employee: emp,
    });
  };

  // Open Grant Screen for Department
  const openGrantForDepartment = (dept: Department) => {
    if (!canManageTetWallet) {
      CustomAlert.alert(
        'Không có quyền trao điểm',
        'Tài khoản không có quyền trao điểm thưởng Ví Tết.'
      );
      return;
    }
    if (isRegionAdmin && !isGlobalAdmin && !regionDeptIdSet.has(dept.id)) {
      CustomAlert.alert(
        'Không thuộc miền quản lý',
        `Bạn chỉ có quyền trao điểm thưởng cho phòng ban thuộc ${managedRegion?.name ? `miền "${managedRegion.name}"` : 'miền mình quản lý'}.`
      );
      return;
    }
    const deptMembers = employeesByDept[dept.id] || [];
    setGrantTarget({
      type: 'DEPARTMENT',
      department: dept,
      memberCount: deptMembers.length,
    });
  };

  // Toggle department collapse/expand
  const toggleDepartment = (deptId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedDeptIds((prev) => ({
      ...prev,
      [deptId]: !prev[deptId],
    }));
  };

  // Expand all or collapse all
  const toggleAllDepartments = (expand: boolean) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const updated: Record<string, boolean> = {};
    departments.forEach((d) => {
      updated[d.id] = expand;
    });
    setExpandedDeptIds(updated);
  };

  // Mutate single employee vault permission
  const handleToggleVault = async (emp: EmployeeUser, nextState: boolean) => {
    if (!canManageTetWallet) {
      CustomAlert.alert('Không có quyền', 'Tài khoản không có quyền cấu hình Ví Thưởng.');
      return;
    }
    if (isRegionAdmin && !isGlobalAdmin) {
      const isInRegion = emp.departmentLinks?.some((link) => regionDeptIdSet.has(link.departmentId));
      if (!isInRegion) {
        CustomAlert.alert(
          'Không thuộc miền quản lý',
          `Bạn chỉ có quyền cấu hình Ví Thưởng cho nhân sự thuộc ${managedRegion?.name ? `miền "${managedRegion.name}"` : 'miền mình quản lý'}.`
        );
        return;
      }
    }
    try {
      setTogglingEmpId(emp.id);
      await apiUpdateEmployee(emp.id, { isRewardVaultEnabled: nextState });
      await queryClient.invalidateQueries({ queryKey: ['employees'] });

      if (selectedEmployee?.id === emp.id) {
        setSelectedEmployee((prev) => (prev ? { ...prev, isRewardVaultEnabled: nextState } : null));
      }
    } catch (err: any) {
      CustomAlert.alert('Lỗi cập nhật', err?.response?.data?.message || 'Không thể cập nhật quyền Ví Điểm Thưởng lúc này.');
    } finally {
      setTogglingEmpId(null);
    }
  };

  // Bulk toggle for department
  const handleBulkDeptToggle = (dept: Department, enable: boolean) => {
    if (!canManageTetWallet) {
      CustomAlert.alert('Không có quyền', 'Tài khoản không có quyền cấu hình Ví Thưởng.');
      return;
    }
    if (isRegionAdmin && !isGlobalAdmin && !regionDeptIdSet.has(dept.id)) {
      CustomAlert.alert(
        'Không thuộc miền quản lý',
        `Bạn chỉ có quyền cấu hình Ví Thưởng cho phòng ban thuộc ${managedRegion?.name ? `miền "${managedRegion.name}"` : 'miền mình quản lý'}.`
      );
      return;
    }
    const deptMembers = employeesByDept[dept.id] || [];
    const targets = deptMembers.filter((e) => Boolean(e.isRewardVaultEnabled) !== enable);

    if (targets.length === 0) {
      CustomAlert.alert('Thông báo', `Tất cả nhân viên trong phòng ${dept.name} đã ${enable ? 'được cấp quyền' : 'ở trạng thái chưa cấp quyền'}.`);
      return;
    }

    CustomAlert.alert(
      enable ? 'Cấp quyền toàn bộ phòng ban' : 'Thu hồi quyền toàn bộ',
      `Bạn có chắc chắn muốn ${enable ? 'CẤP QUYỀN' : 'THU HỒI QUYỀN'} Ví Điểm Thưởng cho ${targets.length} nhân sự thuộc phòng "${dept.name}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: enable ? 'Cấp quyền tất cả' : 'Thu hồi tất cả',
          style: enable ? 'default' : 'destructive',
          onPress: async () => {
            try {
              await Promise.all(
                targets.map((t) => apiUpdateEmployee(t.id, { isRewardVaultEnabled: enable }))
              );
              await queryClient.invalidateQueries({ queryKey: ['employees'] });
              CustomAlert.alert('Thành công', `Đã cập nhật quyền Ví Điểm Thưởng cho toàn bộ phòng ${dept.name}.`);
            } catch (err: any) {
              CustomAlert.alert('Lỗi', err?.message || 'Không thể cập nhật đồng loạt.');
            }
          },
        },
      ]
    );
  };

  // Filter helper for status
  const filterByStatus = (emp: EmployeeUser) => {
    if (filterStatus === 'ENABLED') return Boolean(emp.isRewardVaultEnabled);
    if (filterStatus === 'DISABLED') return !emp.isRewardVaultEnabled;
    return true;
  };

  // Filter departments based on search keyword & status
  const filteredDepartments = useMemo(() => {
    const q = search.trim().toLowerCase();

    return departments.filter((dept) => {
      const matchDeptName = !q || dept.name.toLowerCase().includes(q) || dept.code.toLowerCase().includes(q);
      const deptEmployees = (employeesByDept[dept.id] || []).filter(filterByStatus);
      const matchEmployee = deptEmployees.some(
        (emp) =>
          !q ||
          emp.profile?.fullName?.toLowerCase().includes(q) ||
          emp.userCode?.toLowerCase().includes(q) ||
          emp.phone?.toLowerCase().includes(q)
      );

      if (filterStatus !== 'ALL') {
        return deptEmployees.length > 0 && (matchDeptName || matchEmployee);
      }
      return matchDeptName || matchEmployee;
    });
  }, [departments, employeesByDept, search, filterStatus]);

  // Filter flat employee list
  const filteredEmployees = useMemo(() => {
    const q = search.trim().toLowerCase();

    return employees.filter((emp) => {
      if (!filterByStatus(emp)) return false;
      if (!q) return true;

      const name = emp.profile?.fullName?.toLowerCase() || '';
      const code = emp.userCode?.toLowerCase() || '';
      const phone = emp.phone?.toLowerCase() || '';
      const deptName = emp.departmentLinks?.[0]?.department?.name?.toLowerCase() || '';
      return name.includes(q) || code.includes(q) || phone.includes(q) || deptName.includes(q);
    });
  }, [employees, search, filterStatus]);

  if (grantTarget) {
    return (
      <AdminGrantPointsScreen
        target={grantTarget}
        onBack={() => setGrantTarget(null)}
        onSuccess={() => {
          setGrantTarget(null);
          queryClient.invalidateQueries({ queryKey: ['employees'] });
        }}
      />
    );
  }

  return (
    <Screen backgroundColor="#F8FAFC">
      <View style={{ flex: 1, backgroundColor: '#F8FAFC' }} {...panResponder.panHandlers}>
        <ScrollView
          style={{ flex: 1, backgroundColor: '#F8FAFC' }}
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={onRefresh} />}
        >
          {/* ── Top Bar: Back button + MOVIE LEGEND center logo (matching Screen 1 & 2) ── */}
          <View style={styles.topNavBar}>
            <Pressable
              onPress={() => router.back()}
              style={styles.navBackBtn}
              hitSlop={10}
            >
              <Ionicons name="arrow-back" size={22} color="#0F172A" />
            </Pressable>
            <View style={styles.navLogoCenter}>
              <Text style={styles.navLogoText}>
                MOVIE <MaterialCommunityIcons name="filmstrip" size={13} color="#0563bb" /> LEGEND
              </Text>
            </View>
            <View style={{ width: 38 }} />
          </View>

          {/* ── Title & Subtitle ── */}
          <View style={styles.titleSection}>
            <Text style={styles.screenTitleText}>Ví thưởng</Text>
            <Text style={styles.screenSubtitleText}>Quản lý điểm thưởng & quyền ví</Text>
          </View>

          {/* ── Scope Row: Toàn hệ thống ⌄ | SUPER ADMIN ── */}
          <View style={styles.scopeRow}>
            <View style={styles.scopeDropdownBtn}>
              <MaterialCommunityIcons name="account-group-outline" size={16} color="#475569" />
              <Text style={styles.scopeDropdownText}>
                {isRegionAdmin && !isGlobalAdmin ? (managedRegion?.name || 'Miền quản lý') : 'Toàn hệ thống'}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={16} color="#64748B" />
            </View>

            <View style={styles.superAdminBadge}>
              <Text style={styles.superAdminBadgeText}>
                {isRegionAdmin && !isGlobalAdmin ? 'ADMIN MIỀN' : 'SUPER ADMIN'}
              </Text>
            </View>
          </View>

          {/* ── Solid Primary Banner (Screen 1): shown above tabs when in MEMBERS ── */}
          {mainTab === 'MEMBERS' && (
            <View style={styles.solidHeroBanner}>
              <View style={styles.heroColumn}>
                <Text style={styles.heroColumnNumber}>{totalEmployees}</Text>
                <Text style={styles.heroColumnLabel}>Nhân sự</Text>
              </View>
              <View style={styles.heroVerticalDivider} />
              <View style={styles.heroColumn}>
                <Text style={styles.heroColumnNumber}>{enabledCount}</Text>
                <Text style={styles.heroColumnLabel}>Đã cấp quyền</Text>
              </View>
              <View style={styles.heroVerticalDivider} />
              <View style={styles.heroColumn}>
                <Text style={styles.heroColumnNumber}>
                  {totalPointsGranted >= 1000000
                    ? `${(totalPointsGranted / 1000000).toFixed(1)}M`
                    : totalPointsGranted.toLocaleString('vi-VN')}
                </Text>
                <Text style={styles.heroColumnLabel}>Điểm đã trao</Text>
              </View>
            </View>
          )}

          {/* ── Underline Tabs: Cấp điểm & Quyền ví | Duyệt chi trả ── */}
          <View style={styles.underlineTabBar}>
            <Pressable
              style={[styles.underlineTabBtn, mainTab === 'MEMBERS' && styles.underlineTabBtnActive]}
              onPress={() => setMainTab('MEMBERS')}
            >
              <Text style={[styles.underlineTabText, mainTab === 'MEMBERS' && styles.underlineTabTextActive]}>
                Cấp điểm & Quyền ví
              </Text>
              {mainTab === 'MEMBERS' && <View style={styles.activeUnderline} />}
            </Pressable>

            <Pressable
              style={[styles.underlineTabBtn, mainTab === 'WITHDRAWALS' && styles.underlineTabBtnActive]}
              onPress={() => setMainTab('WITHDRAWALS')}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={[styles.underlineTabText, mainTab === 'WITHDRAWALS' && styles.underlineTabTextActive]}>
                  Duyệt chi trả
                </Text>
                {pendingAdminCount > 0 && (
                  <View style={styles.pendingBadgeCircle}>
                    <Text style={styles.pendingBadgeCircleText}>{pendingAdminCount}</Text>
                  </View>
                )}
              </View>
              {mainTab === 'WITHDRAWALS' && <View style={styles.activeUnderline} />}
            </Pressable>
          </View>

          {mainTab === 'WITHDRAWALS' ? (
            <WithdrawalRequestsManager />
          ) : (
            <>
              {/* ── Search Bar: Tìm nhân sự, phòng ban ── */}
              <View style={styles.templateSearchBox}>
                <Ionicons name="search" size={18} color="#94A3B8" />
                <TextInput
                  style={styles.templateSearchInput}
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Tìm nhân sự, phòng ban"
                  placeholderTextColor="#94A3B8"
                />
                {search.length > 0 && (
                  <Pressable onPress={() => setSearch('')}>
                    <Ionicons name="close-circle" size={16} color="#94A3B8" />
                  </Pressable>
                )}
              </View>

              {/* ── Filter Row: Phòng ban ⌄ | Tất cả (42) ⌄ | 🎛️ ── */}
              <View style={styles.filterPillsRow}>
                <Pressable style={styles.filterDropdownPill}>
                  <Text style={styles.filterDropdownText}>Phòng ban</Text>
                  <MaterialCommunityIcons name="chevron-down" size={16} color="#64748B" />
                </Pressable>

                <Pressable
                  style={styles.filterDropdownPill}
                  onPress={() => {
                    setFilterStatus((prev) => (prev === 'ALL' ? 'ENABLED' : prev === 'ENABLED' ? 'DISABLED' : 'ALL'));
                  }}
                >
                  <Text style={styles.filterDropdownText}>
                    {filterStatus === 'ALL'
                      ? `Tất cả (${totalEmployees})`
                      : filterStatus === 'ENABLED'
                      ? `Đã cấp (${enabledCount})`
                      : `Chưa cấp (${disabledCount})`}
                  </Text>
                  <MaterialCommunityIcons name="chevron-down" size={16} color="#64748B" />
                </Pressable>

                <Pressable
                  style={styles.filterTuneBtn}
                  onPress={() => {
                    const anyCollapsed = departments.some((d) => expandedDeptIds[d.id] === false);
                    toggleAllDepartments(anyCollapsed);
                  }}
                >
                  <MaterialCommunityIcons name="tune-variant" size={18} color="#475569" />
                </Pressable>
              </View>

              {/* ── Section Header: Phòng ban | 13 ⌄ ── */}
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeaderTitle}>Phòng ban</Text>
                <Pressable
                  style={styles.sectionHeaderCountWrap}
                  onPress={() => {
                    const anyCollapsed = departments.some((d) => expandedDeptIds[d.id] === false);
                    toggleAllDepartments(anyCollapsed);
                  }}
                >
                  <Text style={styles.sectionHeaderCountText}>{filteredDepartments.length}</Text>
                  <MaterialCommunityIcons name="chevron-down" size={16} color="#64748B" />
                </Pressable>
              </View>

              {/* ── Department Cards matching Screen 1 ── */}
              {isLoading ? (
                <LoadingState label="Đang tải dữ liệu nhân sự & phòng ban..." />
              ) : filteredDepartments.length === 0 ? (
                <EmptyState title="Không tìm thấy phòng ban nào" message="Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm" />
              ) : (
                <View style={styles.departmentsCardList}>
                  {filteredDepartments.map((dept, index) => {
                    const deptMembers = (employeesByDept[dept.id] || []).filter(filterByStatus);
                    const totalDeptMembers = (employeesByDept[dept.id] || []).length;
                    const deptEnabledCount = (employeesByDept[dept.id] || []).filter((e) => Boolean(e.isRewardVaultEnabled)).length;
                    const isExpanded = expandedDeptIds[dept.id] !== undefined ? expandedDeptIds[dept.id] : index === 0;
                    const branchName = dept.branch?.name ? `MOVIELEGEND · ${dept.branch.name.toUpperCase()}` : 'MOVIELEGEND · HÀ NỘI';

                    return (
                      <View key={dept.id} style={styles.templateDeptCard}>
                        {/* Department Header Inside Card */}
                        <Pressable
                          style={styles.templateDeptHeader}
                          onPress={() => toggleDepartment(dept.id)}
                        >
                          <View style={styles.deptIconCircle}>
                            <MaterialCommunityIcons name="account-group" size={20} color="#0563bb" />
                          </View>

                          <View style={styles.deptInfoCol}>
                            <Text style={styles.deptCardName}>{dept.name}</Text>
                            <Text style={styles.deptCardBranch}>{branchName}</Text>
                            <Text style={styles.deptCardMeta}>
                              {totalDeptMembers} nhân sự · {deptEnabledCount} đã cấp quyền
                            </Text>
                          </View>

                          {isExpanded ? (
                            <View style={styles.deptHeaderRightActions}>
                              {canManageTetWallet && (
                                <Pressable
                                  style={styles.deptGrantBtn}
                                  onPress={(e) => {
                                    e.stopPropagation();
                                    openGrantForDepartment(dept);
                                  }}
                                >
                                  <Text style={styles.deptGrantBtnText}>Trao điểm cả phòng</Text>
                                </Pressable>
                              )}
                              <Pressable
                                style={styles.deptMoreDotsBtn}
                                onPress={(e) => {
                                  e.stopPropagation();
                                  toggleDepartment(dept.id);
                                }}
                              >
                                <MaterialCommunityIcons name="dots-horizontal" size={20} color="#64748B" />
                              </Pressable>
                            </View>
                          ) : (
                            <View style={styles.deptCollapsedRight}>
                              <Text style={styles.deptCollapsedCount}>{totalDeptMembers}</Text>
                              <MaterialCommunityIcons name="chevron-right" size={18} color="#94A3B8" />
                            </View>
                          )}
                        </Pressable>

                        {/* Members inside the same card */}
                        {isExpanded &&
                          deptMembers.map((emp) => {
                            const fullName = emp.profile?.fullName || 'Chưa cập nhật tên';
                            const initials = getInitials(fullName);
                            const isVaultEnabled = Boolean(emp.isRewardVaultEnabled);
                            const isToggling = togglingEmpId === emp.id;

                            return (
                              <View key={emp.id} style={styles.templateMemberRow}>
                                <View style={styles.memberAvatarCircle}>
                                  <Text style={styles.memberAvatarText}>{initials}</Text>
                                </View>
                                <View style={styles.memberInfoCol}>
                                  <Text style={styles.memberFullName} numberOfLines={1}>
                                    {fullName}
                                  </Text>
                                  <Text style={styles.memberUserCode}>{emp.userCode || 'NV00000'}</Text>
                                </View>
                                <View style={styles.memberRightControls}>
                                  {canManageTetWallet && (
                                    <Pressable
                                      style={styles.memberGrantBtn}
                                      onPress={() => openGrantForEmployee(emp)}
                                    >
                                      <Text style={styles.memberGrantBtnText}>Trao điểm</Text>
                                    </Pressable>
                                  )}
                                  <View style={styles.memberSwitchRow}>
                                    <Text style={styles.memberSwitchLabel}>Quyền ví</Text>
                                    {isToggling ? (
                                      <ActivityIndicator size="small" color="#0563bb" style={{ marginHorizontal: 2 }} />
                                    ) : (
                                      <Switch
                                        value={isVaultEnabled}
                                        disabled={!canManageTetWallet || isToggling}
                                        onValueChange={(val) => handleToggleVault(emp, val)}
                                        trackColor={{ false: '#E2E8F0', true: 'rgba(5, 99, 187, 0.4)' }}
                                        thumbColor={isVaultEnabled ? '#0563bb' : '#94A3B8'}
                                        style={Platform.OS === 'ios' ? { transform: [{ scaleX: 0.7 }, { scaleY: 0.7 }] } : undefined}
                                      />
                                    )}
                                  </View>
                                </View>
                              </View>
                            );
                          })}
                      </View>
                    );
                  })}
                </View>
              )}
            </>
          )}
      </ScrollView>

      {/* Employee Detail & Permission Modal */}
      {selectedEmployee && (
        <Modal
          visible={Boolean(selectedEmployee)}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedEmployee(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={styles.modalIconBadge}>
                    <MaterialCommunityIcons name="wallet-giftcard" size={24} color="#D97706" />
                  </View>
                  <View>
                    <Text style={styles.modalTitle}>Chi tiết Ví Thưởng</Text>
                    <Text style={styles.modalSubtitle}>{selectedEmployee.userCode}</Text>
                  </View>
                </View>
                <Pressable onPress={() => setSelectedEmployee(null)} style={styles.closeBtn}>
                  <MaterialCommunityIcons name="close" size={20} color="#6B7280" />
                </Pressable>
              </View>

              {/* Employee Basic Info */}
              <View style={styles.modalEmpCard}>
                <View style={styles.modalAvatarContainer}>
                  {selectedEmployee.profile?.avatarUrl ? (
                    <Image source={{ uri: selectedEmployee.profile.avatarUrl }} style={styles.modalAvatarImg} />
                  ) : (
                    <View style={styles.modalAvatarFallback}>
                      <Text style={styles.modalAvatarFallbackText}>
                        {(selectedEmployee.profile?.fullName || 'NV').slice(0, 2).toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalEmpName}>{selectedEmployee.profile?.fullName || 'Chưa cập nhật tên'}</Text>
                  <Text style={styles.modalEmpMeta}>
                    {selectedEmployee.departmentLinks?.[0]?.position?.name || 'Nhân viên'} • {selectedEmployee.departmentLinks?.[0]?.department?.name || 'Chưa phân phòng'}
                  </Text>
                  <Text style={styles.modalEmpPhone}>SĐT: {selectedEmployee.phone || 'Chưa có'}</Text>
                </View>
              </View>

              {/* Points Vault Info Card */}
              <View style={styles.vaultPointSummaryCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View>
                    <Text style={styles.vaultPointSummaryLabel}>Tổng điểm Ví Thưởng năm {new Date().getFullYear()}:</Text>
                    <Text style={styles.vaultPointSummaryValue}>
                      {(
                        (selectedEmployee.retentionVaults?.[0]?.grantedPoints || 0) +
                        (selectedEmployee.retentionVaults?.[0]?.instantBonusPoints || 0)
                      ).toLocaleString('vi-VN')}{' '}
                      điểm
                    </Text>
                    <Text style={styles.vaultCashSummaryValue}>
                      ~{' '}
                      {(
                        ((selectedEmployee.retentionVaults?.[0]?.grantedPoints || 0) +
                          (selectedEmployee.retentionVaults?.[0]?.instantBonusPoints || 0)) *
                        1000
                      ).toLocaleString('vi-VN')}{' '}
                      VNĐ
                    </Text>
                  </View>
                  {canManageTetWallet && (
                    <Pressable
                      style={styles.modalGrantShortcutBtn}
                      onPress={() => {
                        const emp = selectedEmployee;
                        setSelectedEmployee(null);
                        openGrantForEmployee(emp);
                      }}
                    >
                      <MaterialCommunityIcons name="gift-outline" size={16} color="#D97706" />
                      <Text style={styles.modalGrantShortcutText}>Trao điểm</Text>
                    </Pressable>
                  )}
                </View>
              </View>

              {/* Vault Permission Switch Card */}
              <View style={styles.modalPermissionBox}>
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text style={styles.modalPermTitle}>Đặc quyền Ví Thưởng</Text>
                  <Text style={styles.modalPermDesc}>
                    {selectedEmployee.isRewardVaultEnabled
                      ? 'Nhân viên này đang ĐƯỢC PHÉP tham gia tích lũy Ví Thưởng.'
                      : 'Nhân sự này CHƯA ĐƯỢC CẤP quyền sử dụng Ví Thưởng.'}
                  </Text>
                </View>
                {togglingEmpId === selectedEmployee.id ? (
                  <ActivityIndicator size="small" color="#D97706" />
                ) : (
                  <Switch
                    value={Boolean(selectedEmployee.isRewardVaultEnabled)}
                    onValueChange={(val) => handleToggleVault(selectedEmployee, val)}
                    trackColor={{ false: '#D1D5DB', true: '#FDE68A' }}
                    thumbColor={selectedEmployee.isRewardVaultEnabled ? '#D97706' : '#9CA3AF'}
                  />
                )}
              </View>

              {/* Status Notice */}
              <View style={[
                styles.modalNoticeBox,
                selectedEmployee.isRewardVaultEnabled ? styles.noticeSuccess : styles.noticeMuted
              ]}>
                <MaterialCommunityIcons
                  name={selectedEmployee.isRewardVaultEnabled ? 'shield-check' : 'shield-alert'}
                  size={18}
                  color={selectedEmployee.isRewardVaultEnabled ? '#059669' : '#6B7280'}
                />
                <Text style={[
                  styles.noticeText,
                  { color: selectedEmployee.isRewardVaultEnabled ? '#065F46' : '#4B5563' }
                ]}>
                  {selectedEmployee.isRewardVaultEnabled
                    ? 'Quyền Ví Điểm Thưởng đang HOẠT ĐỘNG trên ứng dụng nhân viên.'
                    : 'Tính năng Ví Điểm Thưởng đang TẮT đối với nhân sự này.'}
                </Text>
              </View>

              {/* Modal Buttons */}
              <View style={styles.modalActions}>
                <Pressable
                  style={styles.modalConfirmBtn}
                  onPress={() => setSelectedEmployee(null)}
                >
                  <Text style={styles.modalConfirmBtnText}>Đóng</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}
      </View>
    </Screen>
  );
}

interface EmployeeRowItemProps {
  employee: EmployeeUser;
  showDeptTag?: boolean;
  isLast?: boolean;
  isToggling?: boolean;
  canManage?: boolean;
  onToggle?: (value: boolean) => void;
  onGrantPoints?: () => void;
  onPress?: () => void;
}

function EmployeeRowItem({
  employee,
  showDeptTag = false,
  isLast = false,
  isToggling = false,
  canManage = false,
  onToggle,
  onGrantPoints,
  onPress,
}: EmployeeRowItemProps) {
  const fullName = employee.profile?.fullName || 'Chưa cập nhật tên';
  const positionName = employee.departmentLinks?.[0]?.position?.name || employee.profile?.position?.name || 'Nhân viên';
  const deptName = employee.departmentLinks?.[0]?.department?.name || 'Chưa phân phòng ban';
  const avatarUrl = employee.profile?.avatarUrl;
  const initials = fullName
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(-2)
    .join('')
    .toUpperCase();

  const isActive = employee.accountStatus === 'ACTIVE';
  const isVaultEnabled = Boolean(employee.isRewardVaultEnabled);
  const vault = employee.retentionVaults?.[0];
  const annualPoints = vault?.grantedPoints || 0;
  const instantPoints = vault?.instantBonusPoints || 0;
  const totalPoints = annualPoints + instantPoints;

  return (
    <Pressable
      style={[styles.employeeRow, isLast && { borderBottomWidth: 0 }]}
      onPress={onPress}
    >
      {/* Avatar matching Screen 1 */}
      <View style={styles.avatarContainer}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatarImg} />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarFallbackText}>{initials || 'NV'}</Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.empInfo}>
        <View style={styles.empNameRow}>
          <Text style={styles.empName} numberOfLines={1}>
            {fullName}
          </Text>
          <View style={[styles.statusDot, { backgroundColor: isActive ? '#10B981' : '#EF4444' }]} />
        </View>

        <View style={styles.empMetaRow}>
          <Text style={styles.empCode}>{employee.userCode || 'NV000000'}</Text>
          <Text style={styles.empMetaDivider}>•</Text>
          <Text style={styles.empPosition} numberOfLines={1}>
            {positionName}
          </Text>
        </View>

        {showDeptTag && (
          <View style={styles.deptTag}>
            <MaterialCommunityIcons name="office-building" size={12} color="#6B7280" />
            <Text style={styles.deptTagText} numberOfLines={1}>
              {deptName}
            </Text>
          </View>
        )}

        {/* Granted Points Badge matching Screen 1 */}
        <View style={styles.pointsBadgeRow}>
          {totalPoints > 0 ? (
            <View style={styles.grantedPointTag}>
              <MaterialCommunityIcons name="star-shooting" size={11} color="#0563bb" />
              <Text style={styles.grantedPointText}>
                ✦ {totalPoints.toLocaleString('vi-VN')} điểm = {(totalPoints * 1000).toLocaleString('vi-VN')} VNĐ
              </Text>
            </View>
          ) : (
            <Text style={styles.noPointsText}>Chưa cấp điểm</Text>
          )}
        </View>
      </View>

      {/* Right Controls: Grant Button & Switch */}
      <View style={styles.walletRightGroup}>
        {/* Trao điểm Action Button */}
        {canManage && (
          <Pressable
            style={styles.rowGrantBtn}
            onPress={(e) => {
              e.stopPropagation();
              onGrantPoints?.();
            }}
          >
            <MaterialCommunityIcons name="gift-outline" size={13} color="#0563bb" />
            <Text style={styles.rowGrantBtnText}>Trao điểm</Text>
          </Pressable>
        )}

        {/* Permission Switch & Status matching Screen 1 */}
        <View style={styles.switchRow}>
          <Text style={styles.switchLabelText}>Quyền ví</Text>
          {isToggling ? (
            <ActivityIndicator size="small" color="#0563bb" style={{ marginHorizontal: 2 }} />
          ) : (
            <Switch
              value={isVaultEnabled}
              disabled={!canManage || isToggling}
              onValueChange={onToggle}
              trackColor={{ false: '#E2E8F0', true: 'rgba(5, 99, 187, 0.35)' }}
              thumbColor={isVaultEnabled ? '#0563bb' : '#94A3B8'}
              style={Platform.OS === 'ios' ? { transform: [{ scaleX: 0.75 }, { scaleY: 0.75 }] } : undefined}
            />
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 4,
    paddingBottom: 140,
    backgroundColor: '#F8FAFC',
  },

  /* Top Navigation Bar: Back button + MOVIE LEGEND center */
  topNavBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  navBackBtn: {
    width: 38,
    height: 38,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  navLogoCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLogoText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: '#0F172A',
  },

  /* Title & Subtitle */
  titleSection: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 10,
  },
  screenTitleText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
  },
  screenSubtitleText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },

  /* Scope Row */
  scopeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  scopeDropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  scopeDropdownText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  superAdminBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  superAdminBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#92400E',
  },

  /* Solid Hero Banner matching Screen 1 */
  solidHeroBanner: {
    backgroundColor: '#0563bb',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    marginHorizontal: 16,
    marginBottom: 14,
    shadowColor: '#0563bb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  heroColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroColumnNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  heroColumnLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.85)',
  },
  heroVerticalDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },

  /* Underline Tabs */
  underlineTabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    marginHorizontal: 16,
    marginBottom: 14,
  },
  underlineTabBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    position: 'relative',
  },
  underlineTabBtnActive: {},
  underlineTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  underlineTabTextActive: {
    color: '#0563bb',
    fontWeight: '700',
  },
  activeUnderline: {
    position: 'absolute',
    bottom: -1,
    left: 16,
    right: 16,
    height: 3,
    backgroundColor: '#0563bb',
    borderRadius: 2,
  },
  pendingBadgeCircle: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    minWidth: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingBadgeCircleText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  /* Search Box matching Screen 1 */
  templateSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  templateSearchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    padding: 0,
  },

  /* Filter Row: Phòng ban ⌄ | Tất cả (42) ⌄ | 🎛️ */
  filterPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 14,
    gap: 8,
  },
  filterDropdownPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 4,
  },
  filterDropdownText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  filterTuneBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
  },

  /* Section Header: Phòng ban | 13 ⌄ */
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 10,
  },
  sectionHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionHeaderCountWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  sectionHeaderCountText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },

  /* Department Cards matching Screen 1 */
  departmentsCardList: {
    paddingHorizontal: 16,
    gap: 12,
    paddingBottom: 40,
  },
  templateDeptCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  templateDeptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  deptIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  deptInfoCol: {
    flex: 1,
    marginRight: 8,
  },
  deptCardName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  deptCardBranch: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 1,
  },
  deptCardMeta: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  deptHeaderRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deptGrantBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#0563bb',
    backgroundColor: '#FFFFFF',
  },
  deptGrantBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0563bb',
  },
  deptMoreDotsBtn: {
    padding: 4,
  },
  deptCollapsedRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  deptCollapsedCount: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },

  /* Member Row inside Card */
  templateMemberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  memberAvatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  memberAvatarText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0563bb',
  },
  memberInfoCol: {
    flex: 1,
    marginRight: 8,
  },
  memberFullName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  memberUserCode: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  memberRightControls: {
    alignItems: 'flex-end',
    gap: 4,
  },
  memberGrantBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#0563bb',
    backgroundColor: '#FFFFFF',
  },
  memberGrantBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0563bb',
  },
  memberSwitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  memberSwitchLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  switchLabelText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
    marginRight: 4,
  },
  deptToolbar: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  deptActionToolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  deptActionToolText: {
    fontSize: 11,
    fontWeight: '700',
  },
  deptActionDivider: {
    width: 1,
    height: 16,
    backgroundColor: '#E2E8F0',
  },
  employeeListContainer: {
    backgroundColor: '#FAFAFA',
    borderTopWidth: 1,
    borderColor: '#F1F5F9',
  },
  emptyMembersBox: {
    padding: 20,
    alignItems: 'center',
  },
  emptyMembersText: {
    fontSize: 13,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  allEmployeesSection: {
    gap: 12,
  },
  flatListCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  employeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatarImg: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  avatarFallback: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0563bb',
  },
  empInfo: {
    flex: 1,
    marginRight: 8,
  },
  empNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  empName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    flexShrink: 1,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  empMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  empCode: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  empMetaDivider: {
    fontSize: 10,
    color: '#CBD5E1',
  },
  empPosition: {
    fontSize: 12,
    color: '#64748B',
    flexShrink: 1,
  },
  deptTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  deptTagText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  pointsBadgeRow: {
    marginTop: 4,
  },
  grantedPointTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(5, 99, 187, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    gap: 4,
  },
  grantedPointText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0563bb',
  },
  noPointsText: {
    fontSize: 10,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  walletRightGroup: {
    alignItems: 'flex-end',
    gap: 6,
  },
  rowGrantBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: 'rgba(5, 99, 187, 0.35)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  rowGrantBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0563bb',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  walletBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  walletBadgeActive: {
    backgroundColor: '#ECFDF5',
  },
  walletBadgeInactive: {
    backgroundColor: '#F1F5F9',
  },
  walletBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  walletBadgeTextActive: {
    color: '#059669',
  },
  walletBadgeTextInactive: {
    color: '#94A3B8',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  grantModalCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 10,
  },
  grantHeaderBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  grantTargetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
    gap: 10,
  },
  modalEmpCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    marginBottom: 14,
    gap: 12,
  },
  modalAvatarContainer: {},
  modalAvatarImg: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  modalAvatarFallback: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalAvatarFallbackText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4338CA',
  },
  modalEmpName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  modalEmpMeta: {
    fontSize: 12,
    color: '#475569',
    marginBottom: 2,
  },
  modalEmpPhone: {
    fontSize: 12,
    color: '#64748B',
  },
  currentPointsLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  grantTypeCardGroup: {
    gap: 8,
    marginBottom: 12,
  },
  grantOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  grantOptionCardActiveAnnual: {
    backgroundColor: '#FFFBEB',
    borderColor: '#D97706',
  },
  grantOptionCardActiveInstant: {
    backgroundColor: '#ECFDF5',
    borderColor: '#059669',
  },
  grantOptionCardActiveVesting: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  grantOptionIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grantOptionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  grantOptionTitleActiveAnnual: {
    color: '#92400E',
  },
  grantOptionTitleActiveInstant: {
    color: '#065F46',
  },
  grantOptionTitleActiveVesting: {
    color: '#1E40AF',
  },
  grantOptionDesc: {
    fontSize: 11,
    color: '#64748B',
  },
  inputSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
    marginTop: 2,
  },
  presetChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  presetChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
  },
  presetChipActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#D97706',
  },
  presetChipPoints: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  presetChipPointsActive: {
    color: '#92400E',
  },
  presetChipDesc: {
    fontSize: 9,
    color: '#64748B',
  },
  presetChipDescActive: {
    color: '#B45309',
    fontWeight: '600',
  },
  customInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  customTextInput: {
    flex: 1,
    height: 42,
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  customInputUnit: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  conversionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#FFFBEB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
    gap: 10,
    marginBottom: 10,
  },
  conversionFormula: {
    fontSize: 11,
    color: '#92400E',
  },
  conversionTotal: {
    fontSize: 13,
    color: '#78350F',
    fontWeight: '600',
    marginTop: 1,
  },
  vestingPreviewCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  vestingTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  vestingTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  vestingMilestoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  milestoneBadge: {
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 6,
  },
  milestoneBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4338CA',
  },
  milestoneDate: {
    fontSize: 11,
    color: '#64748B',
    marginRight: 6,
  },
  milestoneAmount: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
    marginLeft: 'auto',
  },
  grantModalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  cancelGrantBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelGrantBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  confirmGrantBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D97706',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  confirmGrantBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  vaultPointSummaryCard: {
    backgroundColor: '#FFFBEB',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 12,
  },
  vaultPointSummaryLabel: {
    fontSize: 11,
    color: '#92400E',
    fontWeight: '500',
  },
  vaultPointSummaryValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#B45309',
    marginTop: 2,
  },
  vaultCashSummaryValue: {
    fontSize: 11,
    color: '#78350F',
    fontWeight: '600',
  },
  modalGrantShortcutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
    gap: 4,
  },
  modalGrantShortcutText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
  },
  modalPermissionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  modalPermTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  modalPermDesc: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
  },
  modalNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    gap: 8,
    marginBottom: 14,
  },
  noticeSuccess: {
    backgroundColor: '#ECFDF5',
  },
  noticeMuted: {
    backgroundColor: '#F1F5F9',
  },
  noticeText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  modalActions: {
    flexDirection: 'row',
  },
  modalConfirmBtn: {
    flex: 1,
    backgroundColor: '#1E293B',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  regionScopeBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    padding: 12,
    marginBottom: 14,
    gap: 10,
  },
  globalScopeBanner: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  regionScopeIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  globalScopeIconBox: {
    backgroundColor: '#D1FAE5',
  },
  regionScopeContent: {
    flex: 1,
  },
  regionScopeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  regionScopeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E40AF',
  },
  regionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#DBEAFE',
    borderWidth: 1,
    borderColor: '#93C5FD',
  },
  globalBadge: {
    backgroundColor: '#D1FAE5',
    borderColor: '#6EE7B7',
  },
  regionBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1D4ED8',
    letterSpacing: 0.5,
  },
  regionScopeDesc: {
    fontSize: 12,
    color: '#1E3A8A',
    lineHeight: 16,
  },
});
