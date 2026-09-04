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

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type ViewMode = 'BY_DEPARTMENT' | 'ALL_EMPLOYEES';

export function AdminTetWalletScreen() {
  const [viewMode, setViewMode] = useState<ViewMode>('BY_DEPARTMENT');
  const [search, setSearch] = useState('');
  const [expandedDeptIds, setExpandedDeptIds] = useState<Record<string, boolean>>({});

  const departmentsQuery = useDepartments({ limit: 100 });
  const employeesQuery = useEmployees({ limit: 1000 });

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
      const deptId = emp.departmentLinks?.[0]?.departmentId || 'UNASSIGNED';
      if (!map[deptId]) map[deptId] = [];
      map[deptId].push(emp);
    });
    return map;
  }, [employees]);

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

  // Filter departments based on search keyword
  const filteredDepartments = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return departments;

    return departments.filter((dept) => {
      const matchDeptName = dept.name.toLowerCase().includes(q) || dept.code.toLowerCase().includes(q);
      const deptEmployees = employeesByDept[dept.id] || [];
      const matchEmployee = deptEmployees.some(
        (emp) =>
          emp.profile?.fullName?.toLowerCase().includes(q) ||
          emp.userCode?.toLowerCase().includes(q) ||
          emp.phone?.toLowerCase().includes(q)
      );
      return matchDeptName || matchEmployee;
    });
  }, [departments, employeesByDept, search]);

  // Filter flat employee list
  const filteredEmployees = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return employees;

    return employees.filter((emp) => {
      const name = emp.profile?.fullName?.toLowerCase() || '';
      const code = emp.userCode?.toLowerCase() || '';
      const phone = emp.phone?.toLowerCase() || '';
      const deptName = emp.departmentLinks?.[0]?.department?.name?.toLowerCase() || '';
      return name.includes(q) || code.includes(q) || phone.includes(q) || deptName.includes(q);
    });
  }, [employees, search]);

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
          subtitle="Quản lý hạn mức & phân quyền ví Tết nhân sự"
          showBack={false}
          right={
            <View style={styles.headerIconBox}>
              <MaterialCommunityIcons name="wallet-giftcard" size={24} color="#D97706" />
            </View>
          }
        />

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
          <LoadingState label="Đang tải dữ liệu nhân sự & phòng ban..." />
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
              <EmptyState title="Không tìm thấy phòng ban nào" message="Thử tìm kiếm với từ khóa khác" />
            ) : (
              filteredDepartments.map((dept) => {
                const deptMembers = employeesByDept[dept.id] || [];
                const isExpanded = !!expandedDeptIds[dept.id] || !!search.trim();

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
                        <Text style={styles.deptCode}>Mã: {dept.code}</Text>
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

                    {/* Expandable Employee List */}
                    {isExpanded && (
                      <View style={styles.employeeListContainer}>
                        {deptMembers.length === 0 ? (
                          <View style={styles.emptyMembersBox}>
                            <Text style={styles.emptyMembersText}>
                              Chưa có nhân viên nào trong phòng ban này
                            </Text>
                          </View>
                        ) : (
                          deptMembers.map((emp, index) => (
                            <EmployeeRowItem
                              key={emp.id}
                              employee={emp}
                              isLast={index === deptMembers.length - 1}
                            />
                          ))
                        )}
                      </View>
                    )}
                  </View>
                );
              })
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
              <EmptyState title="Không tìm thấy nhân viên" message="Vui lòng thử lại với từ khóa khác" />
            ) : (
              <View style={styles.flatListCard}>
                {filteredEmployees.map((emp, index) => (
                  <EmployeeRowItem
                    key={emp.id}
                    employee={emp}
                    showDeptTag={true}
                    isLast={index === filteredEmployees.length - 1}
                  />
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

interface EmployeeRowItemProps {
  employee: EmployeeUser;
  showDeptTag?: boolean;
  isLast?: boolean;
}

function EmployeeRowItem({ employee, showDeptTag = false, isLast = false }: EmployeeRowItemProps) {
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

  return (
    <View style={[styles.employeeRow, isLast && { borderBottomWidth: 0 }]}>
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
      </View>

      {/* Tet Wallet Badge */}
      <View style={styles.walletBadge}>
        <MaterialCommunityIcons name="wallet-giftcard" size={16} color="#D97706" />
        <Text style={styles.walletBadgeText}>Ví Tết</Text>
      </View>
    </View>
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
  segmentedWrapper: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
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
    color: '#64748B',
  },
  segmentTextActive: {
    color: '#0F172A',
    fontWeight: '700',
  },
  deptSection: {
    gap: 12,
  },
  deptHeaderSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
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
    fontSize: 13,
    fontWeight: '600',
    color: '#2563EB',
  },
  quickActionDivider: {
    color: '#94A3B8',
  },
  deptCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  deptCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#FFFFFF',
  },
  deptIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
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
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  memberBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  employeeListContainer: {
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  emptyMembersBox: {
    paddingVertical: 16,
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
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  employeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    marginRight: 12,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
    backgroundColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3730A3',
  },
  empInfo: {
    flex: 1,
  },
  empNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  empName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  empMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  empCode: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  empMetaDivider: {
    fontSize: 10,
    color: '#94A3B8',
  },
  empPosition: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
    flex: 1,
  },
  deptTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  deptTagText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  walletBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    marginLeft: 8,
  },
  walletBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
});
