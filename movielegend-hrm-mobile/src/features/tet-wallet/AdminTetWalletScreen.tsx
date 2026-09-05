import React, { useState, useMemo, useCallback } from 'react';
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
  Alert,
  Modal,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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
import { updateEmployee as apiUpdateEmployee } from '../../api/employees.api';
import { AdminGrantPointsScreen, type GrantTarget } from './AdminGrantPointsScreen';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type ViewMode = 'BY_DEPARTMENT' | 'ALL_EMPLOYEES';
type FilterStatus = 'ALL' | 'ENABLED' | 'DISABLED';

export function AdminTetWalletScreen() {
  const [viewMode, setViewMode] = useState<ViewMode>('BY_DEPARTMENT');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('ALL');
  const [search, setSearch] = useState('');
  const [expandedDeptIds, setExpandedDeptIds] = useState<Record<string, boolean>>({});
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeUser | null>(null);
  const [togglingEmpId, setTogglingEmpId] = useState<string | null>(null);

  // Grant Target State
  const [grantTarget, setGrantTarget] = useState<GrantTarget | null>(null);

  const queryClient = useQueryClient();
  const departmentsQuery = useDepartments({ limit: 100 });
  const employeesQuery = useEmployees({ limit: 500 });

  const isRefetching = departmentsQuery.isRefetching || employeesQuery.isRefetching;
  const isLoading = departmentsQuery.isLoading || employeesQuery.isLoading;

  const onRefresh = useCallback(async () => {
    await Promise.all([departmentsQuery.refetch(), employeesQuery.refetch()]);
  }, [departmentsQuery, employeesQuery]);

  const departments: Department[] = departmentsQuery.data?.items || [];
  const employees: EmployeeUser[] = employeesQuery.data?.items || [];

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
    setSelectedEmployee(null);
    setGrantTarget({
      type: 'SINGLE',
      employee: emp,
    });
  };

  // Open Grant Screen for Department
  const openGrantForDepartment = (dept: Department) => {
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
    try {
      setTogglingEmpId(emp.id);
      await apiUpdateEmployee(emp.id, { isRewardVaultEnabled: nextState });
      await queryClient.invalidateQueries({ queryKey: ['employees'] });

      if (selectedEmployee?.id === emp.id) {
        setSelectedEmployee((prev) => (prev ? { ...prev, isRewardVaultEnabled: nextState } : null));
      }
    } catch (err: any) {
      Alert.alert('Lỗi cập nhật', err?.response?.data?.message || 'Không thể cập nhật quyền Ví Tết lúc này.');
    } finally {
      setTogglingEmpId(null);
    }
  };

  // Bulk toggle for department
  const handleBulkDeptToggle = (dept: Department, enable: boolean) => {
    const deptMembers = employeesByDept[dept.id] || [];
    const targets = deptMembers.filter((e) => Boolean(e.isRewardVaultEnabled) !== enable);

    if (targets.length === 0) {
      Alert.alert('Thông báo', `Tất cả nhân viên trong phòng ${dept.name} đã ${enable ? 'được cấp quyền' : 'ở trạng thái chưa cấp quyền'}.`);
      return;
    }

    Alert.alert(
      enable ? 'Cấp quyền toàn bộ phòng ban' : 'Thu hồi quyền toàn bộ',
      `Bạn có chắc chắn muốn ${enable ? 'CẤP QUYỀN' : 'THU HỒI QUYỀN'} Ví Tết cho ${targets.length} nhân sự thuộc phòng "${dept.name}"?`,
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
              Alert.alert('Thành công', `Đã cập nhật quyền Ví Tết cho toàn bộ phòng ${dept.name}.`);
            } catch (err: any) {
              Alert.alert('Lỗi', err?.message || 'Không thể cập nhật đồng loạt.');
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
    <Screen>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <PageHeader
          title="Quyền Ví Tết"
          subtitle="Quản lý hạn mức, thưởng dự án & trao điểm nhân sự"
          showBack={false}
          right={
            <View style={styles.headerIconBox}>
              <MaterialCommunityIcons name="wallet-giftcard" size={24} color="#D97706" />
            </View>
          }
        />

        {/* Live Statistics Cards */}
        <View style={styles.statsCardWrapper}>
          <View style={styles.statBox}>
            <View style={[styles.statIconBadge, { backgroundColor: '#EEF2FF' }]}>
              <MaterialCommunityIcons name="account-group" size={18} color="#4F46E5" />
            </View>
            <Text style={styles.statValue}>{totalEmployees}</Text>
            <Text style={styles.statLabel}>Tổng nhân sự</Text>
          </View>

          <View style={styles.statBox}>
            <View style={[styles.statIconBadge, { backgroundColor: '#ECFDF5' }]}>
              <MaterialCommunityIcons name="shield-check" size={18} color="#059669" />
            </View>
            <Text style={[styles.statValue, { color: '#059669' }]}>{enabledCount}</Text>
            <Text style={styles.statLabel}>Đã cấp quyền</Text>
          </View>

          <View style={styles.statBox}>
            <View style={[styles.statIconBadge, { backgroundColor: '#FEF3C7' }]}>
              <MaterialCommunityIcons name="star-shooting" size={18} color="#D97706" />
            </View>
            <Text style={[styles.statValue, { color: '#D97706' }]} numberOfLines={1}>
              {totalPointsGranted >= 1000000
                ? `${(totalPointsGranted / 1000000).toFixed(1)}M`
                : totalPointsGranted.toLocaleString('vi-VN')}
            </Text>
            <Text style={styles.statLabel}>Tổng điểm trao</Text>
          </View>
        </View>

        {/* View Mode Selector Tabs */}
        <View style={styles.segmentedWrapper}>
          <Pressable
            style={[styles.segmentBtn, viewMode === 'BY_DEPARTMENT' && styles.segmentBtnActive]}
            onPress={() => setViewMode('BY_DEPARTMENT')}
          >
            <MaterialCommunityIcons
              name="office-building"
              size={18}
              color={viewMode === 'BY_DEPARTMENT' ? '#111827' : colors.muted}
            />
            <Text style={[styles.segmentText, viewMode === 'BY_DEPARTMENT' && styles.segmentTextActive]}>
              Theo phòng ban
            </Text>
          </Pressable>

          <Pressable
            style={[styles.segmentBtn, viewMode === 'ALL_EMPLOYEES' && styles.segmentBtnActive]}
            onPress={() => setViewMode('ALL_EMPLOYEES')}
          >
            <MaterialCommunityIcons
              name="account-group"
              size={18}
              color={viewMode === 'ALL_EMPLOYEES' ? '#111827' : colors.muted}
            />
            <Text style={[styles.segmentText, viewMode === 'ALL_EMPLOYEES' && styles.segmentTextActive]}>
              Tất cả nhân sự ({employees.length})
            </Text>
          </Pressable>
        </View>

        {/* Status Filter Chips */}
        <View style={styles.filterChipRow}>
          <Pressable
            style={[styles.filterChip, filterStatus === 'ALL' && styles.filterChipActive]}
            onPress={() => setFilterStatus('ALL')}
          >
            <Text style={[styles.filterChipText, filterStatus === 'ALL' && styles.filterChipTextActive]}>
              Tất cả ({totalEmployees})
            </Text>
          </Pressable>

          <Pressable
            style={[styles.filterChip, filterStatus === 'ENABLED' && styles.filterChipActiveSuccess]}
            onPress={() => setFilterStatus('ENABLED')}
          >
            <Text style={[styles.filterChipText, filterStatus === 'ENABLED' && styles.filterChipTextActiveSuccess]}>
              ✓ Đã cấp quyền ({enabledCount})
            </Text>
          </Pressable>

          <Pressable
            style={[styles.filterChip, filterStatus === 'DISABLED' && styles.filterChipActiveMuted]}
            onPress={() => setFilterStatus('DISABLED')}
          >
            <Text style={[styles.filterChipText, filterStatus === 'DISABLED' && styles.filterChipTextActiveMuted]}>
              Chưa cấp ({disabledCount})
            </Text>
          </Pressable>
        </View>

        {/* Search Bar */}
        <View style={{ marginBottom: 16 }}>
          <SearchInput
            value={search}
            onChangeText={setSearch}
            placeholder={
              viewMode === 'BY_DEPARTMENT'
                ? 'Tìm phòng ban hoặc nhân viên...'
                : 'Tìm theo tên, mã NV hoặc số điện thoại...'
            }
          />
        </View>

        {isLoading ? (
          <LoadingState label="Đang tải dữ liệu nhân sự & phòng ban thực tế..." />
        ) : viewMode === 'BY_DEPARTMENT' ? (
          /* ==================================================== */
          /* 1. CHẾ ĐỘ XEM THEO PHÒNG BAN                         */
          /* ==================================================== */
          <View style={styles.deptSection}>
            <View style={styles.deptHeaderSummary}>
              <Text style={styles.sectionTitle}>
                Danh sách phòng ban ({filteredDepartments.length})
              </Text>
              <View style={styles.quickExpandRow}>
                <Pressable onPress={() => toggleAllDepartments(true)} style={styles.quickActionBtn}>
                  <Text style={styles.quickActionText}>Mở tất cả</Text>
                </Pressable>
                <Text style={styles.quickActionDivider}>•</Text>
                <Pressable onPress={() => toggleAllDepartments(false)} style={styles.quickActionBtn}>
                  <Text style={styles.quickActionText}>Thu gọn</Text>
                </Pressable>
              </View>
            </View>

            {filteredDepartments.length === 0 ? (
              <EmptyState title="Không tìm thấy phòng ban nào" message="Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm" />
            ) : (
              <>
                {filteredDepartments.map((dept) => {
                  const deptMembers = (employeesByDept[dept.id] || []).filter(filterByStatus);
                  const totalDeptMembers = (employeesByDept[dept.id] || []).length;
                  const deptEnabledCount = (employeesByDept[dept.id] || []).filter((e) => Boolean(e.isRewardVaultEnabled)).length;
                  const isExpanded = expandedDeptIds[dept.id] !== undefined ? expandedDeptIds[dept.id] : true;

                  // Total points granted in department
                  const deptTotalPoints = (employeesByDept[dept.id] || []).reduce((sum, emp) => {
                    const v = emp.retentionVaults?.[0];
                    const ann = v ? Number(v.grantedPoints || 0) : 0;
                    const inst = v ? Number(v.instantBonusPoints || 0) : 0;
                    return sum + ann + inst;
                  }, 0);

                  return (
                    <View key={dept.id} style={styles.deptCard}>
                      {/* Department Header Row - Click to Toggle */}
                      <Pressable
                        style={styles.deptCardHeader}
                        onPress={() => toggleDepartment(dept.id)}
                      >
                        <View style={styles.deptIconBox}>
                          <MaterialCommunityIcons name="domain" size={22} color="#2563EB" />
                        </View>

                        <View style={styles.deptInfo}>
                          <Text style={styles.deptName}>{dept.name}</Text>
                          <Text style={styles.deptCode}>
                            Mã: {dept.code} • Đã cấp: <Text style={{ fontWeight: '700', color: deptEnabledCount > 0 ? '#059669' : '#64748B' }}>{deptEnabledCount}/{totalDeptMembers}</Text>
                            {deptTotalPoints > 0 && (
                              <Text style={{ color: '#D97706', fontWeight: '700' }}> • {deptTotalPoints.toLocaleString('vi-VN')} đ</Text>
                            )}
                          </Text>
                        </View>

                        <View style={styles.memberBadge}>
                          <MaterialCommunityIcons name="account-outline" size={14} color="#4B5563" />
                          <Text style={styles.memberBadgeText}>{deptMembers.length} NV</Text>
                        </View>

                        <MaterialCommunityIcons
                          name={isExpanded ? 'chevron-up' : 'chevron-down'}
                          size={22}
                          color="#64748B"
                          style={{ marginLeft: 8 }}
                        />
                      </Pressable>

                      {/* Department Actions Toolbar */}
                      {isExpanded && deptMembers.length > 0 && (
                        <View style={styles.deptToolbar}>
                          <Pressable
                            style={styles.deptActionToolBtn}
                            onPress={() => openGrantForDepartment(dept)}
                          >
                            <MaterialCommunityIcons name="gift-outline" size={16} color="#D97706" />
                            <Text style={[styles.deptActionToolText, { color: '#D97706' }]}>Trao điểm cả phòng</Text>
                          </Pressable>

                          <View style={styles.deptActionDivider} />

                          <Pressable
                            style={styles.deptActionToolBtn}
                            onPress={() => handleBulkDeptToggle(dept, true)}
                          >
                            <MaterialCommunityIcons name="check-all" size={16} color="#059669" />
                            <Text style={[styles.deptActionToolText, { color: '#059669' }]}>Cấp quyền tất cả</Text>
                          </Pressable>

                          <View style={styles.deptActionDivider} />

                          <Pressable
                            style={styles.deptActionToolBtn}
                            onPress={() => handleBulkDeptToggle(dept, false)}
                          >
                            <MaterialCommunityIcons name="close-circle-outline" size={16} color="#DC2626" />
                            <Text style={[styles.deptActionToolText, { color: '#DC2626' }]}>Thu hồi quyền</Text>
                          </Pressable>
                        </View>
                      )}

                      {/* Expandable Employee List */}
                      {isExpanded && (
                        <View style={styles.employeeListContainer}>
                          {deptMembers.length === 0 ? (
                            <View style={styles.emptyMembersBox}>
                              <Text style={styles.emptyMembersText}>
                                {totalDeptMembers === 0 ? 'Phòng ban này hiện chưa có nhân sự' : 'Không có nhân sự nào phù hợp bộ lọc'}
                              </Text>
                            </View>
                          ) : (
                            deptMembers.map((emp, index) => (
                              <EmployeeRowItem
                                key={emp.id}
                                employee={emp}
                                isToggling={togglingEmpId === emp.id}
                                onToggle={(val) => handleToggleVault(emp, val)}
                                onGrantPoints={() => openGrantForEmployee(emp)}
                                onPress={() => setSelectedEmployee(emp)}
                                isLast={index === deptMembers.length - 1}
                              />
                            ))
                          )}
                        </View>
                      )}
                    </View>
                  );
                })}

                {/* Unassigned Employees Section if any */}
                {((employeesByDept['UNASSIGNED'] || []).filter(filterByStatus)).length > 0 && (
                  <View style={[styles.deptCard, { borderColor: '#CBD5E1' }]}>
                    <Pressable
                      style={styles.deptCardHeader}
                      onPress={() => toggleDepartment('UNASSIGNED')}
                    >
                      <View style={[styles.deptIconBox, { backgroundColor: '#F1F5F9' }]}>
                        <MaterialCommunityIcons name="account-question-outline" size={22} color="#64748B" />
                      </View>
                      <View style={styles.deptInfo}>
                        <Text style={styles.deptName}>Chưa xếp phòng ban</Text>
                        <Text style={styles.deptCode}>Nhân sự tự do / tài khoản hệ thống</Text>
                      </View>
                      <View style={styles.memberBadge}>
                        <MaterialCommunityIcons name="account-outline" size={14} color="#4B5563" />
                        <Text style={styles.memberBadgeText}>
                          {(employeesByDept['UNASSIGNED'] || []).filter(filterByStatus).length} NV
                        </Text>
                      </View>
                      <MaterialCommunityIcons
                        name={expandedDeptIds['UNASSIGNED'] !== false ? 'chevron-up' : 'chevron-down'}
                        size={22}
                        color="#64748B"
                        style={{ marginLeft: 8 }}
                      />
                    </Pressable>

                    {expandedDeptIds['UNASSIGNED'] !== false && (
                      <View style={styles.employeeListContainer}>
                        {(employeesByDept['UNASSIGNED'] || []).filter(filterByStatus).map((emp, index, arr) => (
                          <EmployeeRowItem
                            key={emp.id}
                            employee={emp}
                            isToggling={togglingEmpId === emp.id}
                            onToggle={(val) => handleToggleVault(emp, val)}
                            onGrantPoints={() => openGrantForEmployee(emp)}
                            onPress={() => setSelectedEmployee(emp)}
                            isLast={index === arr.length - 1}
                          />
                        ))}
                      </View>
                    )}
                  </View>
                )}
              </>
            )}
          </View>
        ) : (
          /* ==================================================== */
          /* 2. CHẾ ĐỘ XEM TẤT CẢ NHÂN SỰ                         */
          /* ==================================================== */
          <View style={styles.allEmployeesSection}>
            <Text style={styles.sectionTitle}>
              Toàn bộ nhân sự ({filteredEmployees.length})
            </Text>

            {filteredEmployees.length === 0 ? (
              <EmptyState title="Không tìm thấy nhân viên" message="Vui lòng thử lại với từ khóa hoặc bộ lọc khác" />
            ) : (
              <View style={styles.flatListCard}>
                {filteredEmployees.map((emp, index) => (
                  <EmployeeRowItem
                    key={emp.id}
                    employee={emp}
                    showDeptTag={true}
                    isToggling={togglingEmpId === emp.id}
                    onToggle={(val) => handleToggleVault(emp, val)}
                    onGrantPoints={() => openGrantForEmployee(emp)}
                    onPress={() => setSelectedEmployee(emp)}
                    isLast={index === filteredEmployees.length - 1}
                  />
                ))}
              </View>
            )}
          </View>
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
                    <Text style={styles.modalTitle}>Chi tiết Quyền Ví Tết</Text>
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
                    <Text style={styles.vaultPointSummaryLabel}>Tổng điểm Ví thưởng năm {new Date().getFullYear()}:</Text>
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
                </View>
              </View>

              {/* Vault Permission Switch Card */}
              <View style={styles.modalPermissionBox}>
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text style={styles.modalPermTitle}>Đặc quyền Ví Thưởng Tết</Text>
                  <Text style={styles.modalPermDesc}>
                    {selectedEmployee.isRewardVaultEnabled
                      ? 'Nhân viên này đang ĐƯỢC PHÉP truy cập và nhận điểm thưởng Ví Tết.'
                      : 'Nhân sự này CHƯA ĐƯỢC CẤP quyền sử dụng Ví Thưởng Tết.'}
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
                    ? 'Quyền Ví Tết đang HOẠT ĐỘNG trên ứng dụng nhân viên.'
                    : 'Tính năng Ví Tết đang TẮT đối với nhân sự này.'}
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
    </Screen>
  );
}

interface EmployeeRowItemProps {
  employee: EmployeeUser;
  showDeptTag?: boolean;
  isLast?: boolean;
  isToggling?: boolean;
  onToggle?: (value: boolean) => void;
  onGrantPoints?: () => void;
  onPress?: () => void;
}

function EmployeeRowItem({
  employee,
  showDeptTag = false,
  isLast = false,
  isToggling = false,
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
      {/* Avatar */}
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

        {/* Granted Points Badge */}
        <View style={styles.pointsBadgeRow}>
          {totalPoints > 0 ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
              <View style={styles.grantedPointTag}>
                <MaterialCommunityIcons name="star" size={12} color="#D97706" />
                <Text style={styles.grantedPointText}>
                  {totalPoints.toLocaleString('vi-VN')} đ ({(totalPoints * 1000).toLocaleString('vi-VN')} VNĐ)
                </Text>
              </View>
              {instantPoints > 0 && (
                <View style={[styles.grantedPointTag, { backgroundColor: '#ECFDF5' }]}>
                  <MaterialCommunityIcons name="lightning-bolt" size={12} color="#059669" />
                  <Text style={[styles.grantedPointText, { color: '#065F46' }]}>
                    +{instantPoints.toLocaleString('vi-VN')} nóng
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <Text style={styles.noPointsText}>Chưa cấp điểm</Text>
          )}
        </View>
      </View>

      {/* Right Controls: Grant Button & Switch */}
      <View style={styles.walletRightGroup}>
        {/* Trao điểm Action Button */}
        <Pressable
          style={styles.rowGrantBtn}
          onPress={(e) => {
            e.stopPropagation();
            onGrantPoints?.();
          }}
        >
          <MaterialCommunityIcons name="gift-outline" size={14} color="#B45309" />
          <Text style={styles.rowGrantBtnText}>Trao điểm</Text>
        </Pressable>

        {/* Permission Switch & Status */}
        <View style={styles.switchRow}>
          {isToggling ? (
            <ActivityIndicator size="small" color="#D97706" style={{ marginHorizontal: 4 }} />
          ) : (
            <Switch
              value={isVaultEnabled}
              onValueChange={onToggle}
              trackColor={{ false: '#E5E7EB', true: '#FDE68A' }}
              thumbColor={isVaultEnabled ? '#D97706' : '#9CA3AF'}
              style={Platform.OS === 'ios' ? { transform: [{ scaleX: 0.75 }, { scaleY: 0.75 }] } : undefined}
            />
          )}
          <View
            style={[
              styles.walletBadge,
              isVaultEnabled ? styles.walletBadgeActive : styles.walletBadgeInactive,
            ]}
          >
            <Text
              style={[
                styles.walletBadgeText,
                isVaultEnabled ? styles.walletBadgeTextActive : styles.walletBadgeTextInactive,
              ]}
            >
              {isVaultEnabled ? 'Đã cấp' : 'Tắt'}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: 100,
    backgroundColor: '#F8FAFC',
    minHeight: '100%',
  },
  headerIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsCardWrapper: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statIconBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '500',
    textAlign: 'center',
  },
  segmentedWrapper: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    padding: 4,
    marginBottom: 12,
    gap: 4,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  segmentBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.muted,
  },
  segmentTextActive: {
    color: '#0F172A',
    fontWeight: '700',
  },
  filterChipRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  filterChipActive: {
    backgroundColor: '#1E293B',
    borderColor: '#1E293B',
  },
  filterChipActiveSuccess: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  filterChipActiveMuted: {
    backgroundColor: '#64748B',
    borderColor: '#64748B',
  },
  filterChipText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  filterChipTextActiveSuccess: {
    color: '#FFFFFF',
  },
  filterChipTextActiveMuted: {
    color: '#FFFFFF',
  },
  deptSection: {
    gap: 12,
  },
  deptHeaderSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  quickExpandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  quickActionBtn: {
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  quickActionDivider: {
    fontSize: 12,
    color: colors.border,
  },
  deptCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  deptCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#FFFFFF',
  },
  deptIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  deptInfo: {
    flex: 1,
  },
  deptName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  deptCode: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  memberBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
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
    backgroundColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4338CA',
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
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    gap: 3,
  },
  grantedPointText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#92400E',
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
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  rowGrantBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
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
});
