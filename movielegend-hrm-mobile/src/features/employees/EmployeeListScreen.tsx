import React, { useState, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  TextInput,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useEmployees, useEmployeeReport, useDeleteEmployee, useUpdateAnyEmployee } from '../../hooks/useEmployees';
import { useDepartments } from '../../hooks/useDepartments';
import { useAuth } from '../../providers/AuthProvider';
import { ConfirmModal } from '../../components/ConfirmModal';
import { SelectModal, SelectOption } from '../../components/SelectModal';
import { EmptyState } from '../../components/EmptyState';
import { LoadingState } from '../../components/LoadingState';

function UserInitialAvatar({ name, size = 48 }: { name: string; size?: number }) {
  const initials = useMemo(() => {
    if (!name) return 'NV';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'NV';
    if (parts.length === 1) return (parts[0] || '').slice(0, 2).toUpperCase();
    const first = parts[0]?.[0] || '';
    const last = parts[parts.length - 1]?.[0] || '';
    return (first + last).toUpperCase() || 'NV';
  }, [name]);

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: '#DCFCE7', // soft mint green
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Text style={{ color: '#166534', fontSize: 16, fontWeight: '800' }}>{initials}</Text>
    </View>
  );
}

export function EmployeeListScreen({ scope }: { scope: 'admin' | 'leader' }) {
  const router = useRouter();
  const { user } = useAuth();
  const { departmentId, branchId } = useLocalSearchParams<{ departmentId?: string; branchId?: string }>();

  // Filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED'>('ALL');
  const [selectedDeptId, setSelectedDeptId] = useState<string>(departmentId || 'ALL');
  const [deptModalVisible, setDeptModalVisible] = useState(false);

  const departmentsQuery = useDepartments({ limit: 100 });
  const departments = departmentsQuery.data?.items || [];

  const filters = useMemo(() => {
    return {
      page: 1,
      limit: 100,
      search: search.trim() || undefined,
      departmentId: selectedDeptId !== 'ALL' ? selectedDeptId : undefined,
      accountStatus: statusFilter === 'ALL' ? undefined : (statusFilter as any),
    };
  }, [search, selectedDeptId, statusFilter]);

  const adminUsers = useEmployees(filters);
  const deleteEmployee = useDeleteEmployee();
  const updateEmployeeAny = useUpdateAnyEmployee();

  const [confirmAction, setConfirmAction] = useState<{
    type: 'lock' | 'unlock' | 'delete';
    employeeId?: string;
    employeeName?: string;
  } | null>(null);

  const employees = adminUsers.data?.items || [];

  const deptOptions: SelectOption[] = useMemo(() => {
    return [
      { id: 'ALL', label: 'Tất cả phòng ban' },
      ...departments.map(d => ({ id: d.id, label: d.name })),
    ];
  }, [departments]);

  const selectedDeptLabel = useMemo(() => {
    if (selectedDeptId === 'ALL') return 'Tất cả phòng ban';
    return departments.find(d => d.id === selectedDeptId)?.name || 'Tất cả phòng ban';
  }, [selectedDeptId, departments]);

  const handleActionMenu = (emp: any) => {
    const isLocked = emp.accountStatus !== 'ACTIVE';
    setConfirmAction({
      type: isLocked ? 'unlock' : 'lock',
      employeeId: emp.id,
      employeeName: emp.profile?.fullName || emp.userCode,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Screen Header: Title + Subtitle + "+ Thêm" button */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Nhân viên</Text>
          <Text style={styles.subtitle}>Quản lý hồ sơ đội ngũ</Text>
        </View>

        {scope === 'admin' && (
          <Pressable
            onPress={() => router.push(departmentId ? `/admin/employees/create?departmentId=${departmentId}` : '/admin/employees/create')}
            style={styles.addBtn}
            android_ripple={{ color: 'rgba(255,255,255,0.1)' }}
          >
            <Ionicons name="add" size={18} color="#FFFFFF" />
            <Text style={styles.addBtnText}>Thêm</Text>
          </Pressable>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={adminUsers.isRefetching} onRefresh={() => void adminUsers.refetch()} />}
      >
        {/* Search Input Row with Filter Icon */}
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
            <TextInput
              placeholder="Tìm tên hoặc mã nhân viên"
              placeholderTextColor="#94A3B8"
              value={search}
              onChangeText={setSearch}
              style={styles.searchInput}
              clearButtonMode="while-editing"
            />
          </View>
          <Pressable style={styles.filterBtn} onPress={() => setDeptModalVisible(true)}>
            <Ionicons name="options-outline" size={20} color="#0F172A" />
          </Pressable>
        </View>

        {/* Status Segmented Buttons: [ Tất cả ] [ Hoạt động ] [ Tạm khóa ] */}
        <View style={styles.statusSegmentRow}>
          <Pressable
            onPress={() => setStatusFilter('ALL')}
            style={[styles.statusSegmentBtn, statusFilter === 'ALL' && styles.statusSegmentBtnActive]}
          >
            <Text style={[styles.statusSegmentText, statusFilter === 'ALL' && styles.statusSegmentTextActive]}>
              Tất cả
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setStatusFilter('ACTIVE')}
            style={[styles.statusSegmentBtn, statusFilter === 'ACTIVE' && styles.statusSegmentBtnActive]}
          >
            <Text style={[styles.statusSegmentText, statusFilter === 'ACTIVE' && styles.statusSegmentTextActive]}>
              Hoạt động
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setStatusFilter('SUSPENDED')}
            style={[styles.statusSegmentBtn, statusFilter === 'SUSPENDED' && styles.statusSegmentBtnActive]}
          >
            <Text style={[styles.statusSegmentText, statusFilter === 'SUSPENDED' && styles.statusSegmentTextActive]}>
              Tạm khóa
            </Text>
          </Pressable>
        </View>

        {/* Department Filter Dropdown Pill */}
        <Pressable style={styles.deptFilterPill} onPress={() => setDeptModalVisible(true)}>
          <Text style={styles.deptFilterText}>{selectedDeptLabel}</Text>
          <Ionicons name="chevron-down" size={16} color="#64748B" />
        </Pressable>

        {/* Employee Cards List */}
        {adminUsers.isLoading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator color="#1B382B" size="small" />
            <Text style={{ marginTop: 8, fontSize: 13, color: '#64748B' }}>Đang tải danh sách nhân viên...</Text>
          </View>
        ) : employees.length === 0 ? (
          <EmptyState title="Chưa có nhân viên phù hợp" />
        ) : (
          <View style={styles.employeeList}>
            {employees.map(employee => {
              const name = employee.profile?.fullName || employee.userCode || 'Chưa đặt tên';
              const userCode = employee.userCode || 'NV00000';
              const deptName =
                employee.departmentLinks?.map(link => link.department?.name).filter(Boolean).join(', ') ||
                (employee as any).department?.name ||
                'Chưa xếp phòng';
              const branchName =
                employee.departmentLinks?.[0]?.department?.branch?.name ||
                (employee as any).department?.branch?.name ||
                'Hà Nội';
              const positionName = employee.profile?.position?.name || 'Chưa cập nhật';
              const isLeader = employee.roles?.some(r => r.role?.code === 'LEADER');
              const isActive = employee.accountStatus === 'ACTIVE';

              return (
                <View key={employee.id} style={styles.card}>
                  {/* Card Top: Avatar + Name/Code/Dept + Status Badge */}
                  <View style={styles.cardTopRow}>
                    <UserInitialAvatar name={name} size={48} />

                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.employeeName} numberOfLines={1}>{name}</Text>
                      <Text style={styles.employeeCode}>{userCode}</Text>
                      <Text style={styles.employeeDeptBranch} numberOfLines={1}>
                        {deptName} • {branchName}
                      </Text>
                      <Text style={styles.employeePosition}>
                        Vị trí: {isLeader ? 'Leader' : positionName}
                      </Text>
                    </View>

                    <View style={[styles.statusBadge, isActive ? styles.statusBadgeActive : styles.statusBadgeInactive]}>
                      <Text style={[styles.statusBadgeText, isActive ? styles.statusBadgeTextActive : styles.statusBadgeTextInactive]}>
                        {isActive ? 'Hoạt động' : 'Tạm khóa'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.cardDivider} />

                  {/* Card Bottom: "Xem hồ sơ →" on left + Edit/More icons on right */}
                  <View style={styles.cardBottomRow}>
                    <Pressable
                      onPress={() => router.push(`/admin/employees/${employee.id}`)}
                      style={styles.viewProfileBtn}
                      hitSlop={6}
                    >
                      <Text style={styles.viewProfileText}>Xem hồ sơ  →</Text>
                    </Pressable>

                    <View style={styles.cardActionsRight}>
                      {scope === 'admin' && (
                        <Pressable
                          onPress={() => router.push({ pathname: '/admin/employees/[id]', params: { id: employee.id, edit: '1' } })}
                          style={styles.iconActionBtn}
                          hitSlop={8}
                        >
                          <Ionicons name="pencil-outline" size={18} color="#0F172A" />
                        </Pressable>
                      )}
                      <Pressable
                        onPress={() => handleActionMenu(employee)}
                        style={styles.iconActionBtn}
                        hitSlop={8}
                      >
                        <Ionicons name="ellipsis-vertical" size={18} color="#0F172A" />
                      </Pressable>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Footer info note */}
        <View style={styles.footerNoteRow}>
          <Ionicons name="information-circle-outline" size={16} color="#64748B" />
          <Text style={styles.footerNoteText}>Chạm vào nhân viên để xem hồ sơ</Text>
        </View>
      </ScrollView>

      {/* Select Department Modal */}
      <SelectModal
        visible={deptModalVisible}
        title="Chọn phòng ban"
        options={deptOptions}
        selectedValue={selectedDeptId}
        onSelect={opt => setSelectedDeptId(opt.id || 'ALL')}
        onClose={() => setDeptModalVisible(false)}
      />

      {/* Confirm Lock / Unlock Modal */}
      <ConfirmModal
        visible={!!confirmAction}
        title={confirmAction?.type === 'lock' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
        message={`Bạn có chắc chắn muốn ${confirmAction?.type === 'lock' ? 'khóa' : 'mở khóa'} tài khoản của ${confirmAction?.employeeName}?`}
        confirmLabel={confirmAction?.type === 'lock' ? 'Khóa' : 'Mở khóa'}
        loading={updateEmployeeAny.isPending}
        onCancel={() => setConfirmAction(null)}
        onConfirm={async () => {
          if (!confirmAction?.employeeId) return;
          try {
            await updateEmployeeAny.mutateAsync({
              id: confirmAction.employeeId,
              status: confirmAction.type === 'lock' ? ('SUSPENDED' as any) : ('ACTIVE' as any),
            });
            setConfirmAction(null);
          } catch {
            setConfirmAction(null);
          }
        }}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 2,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1B382B', // Dark forest green matching template
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    shadowColor: '#1B382B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  addBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 60,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    padding: 0,
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusSegmentRow: {
    flexDirection: 'row',
    backgroundColor: '#EAEFEA',
    borderRadius: 14,
    padding: 4,
    marginBottom: 12,
  },
  statusSegmentBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusSegmentBtnActive: {
    backgroundColor: '#1B382B',
  },
  statusSegmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  statusSegmentTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  deptFilterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  deptFilterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  employeeList: {
    gap: 12,
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
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  employeeName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  employeeCode: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  employeeDeptBranch: {
    fontSize: 12,
    color: '#475569',
    marginBottom: 2,
  },
  employeePosition: {
    fontSize: 12,
    color: '#94A3B8',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusBadgeActive: {
    backgroundColor: '#DCFCE7',
  },
  statusBadgeInactive: {
    backgroundColor: '#FEE2E2',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusBadgeTextActive: {
    color: '#166534',
  },
  statusBadgeTextInactive: {
    color: '#DC2626',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewProfileText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  cardActionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconActionBtn: {
    padding: 4,
  },
  footerNoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 20,
    marginBottom: 20,
  },
  footerNoteText: {
    fontSize: 13,
    color: '#64748B',
  },
});
