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
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useEmployees, useEmployeeReport, useDeleteEmployee, useUpdateAnyEmployee } from '../../hooks/useEmployees';
import { useAssignLeader, useRevokeLeader } from '../../hooks/useLeaderAssignment';
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
  const assignLeader = useAssignLeader();
  const revokeLeader = useRevokeLeader();

  const [selectedEmployeeMenu, setSelectedEmployeeMenu] = useState<any | null>(null);

  const [confirmAction, setConfirmAction] = useState<{
    type: 'lock' | 'unlock' | 'delete' | 'appoint' | 'revoke' | 'error_inactive';
    employeeId?: string;
    employeeName?: string;
    departmentId?: string;
    leaderRoleId?: string;
    isHrDept?: boolean;
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
    setSelectedEmployeeMenu(emp);
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

      {/* Action Sheet Modal for Selected Employee */}
      <Modal
        visible={!!selectedEmployeeMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedEmployeeMenu(null)}
      >
        <Pressable 
          style={styles.actionSheetOverlay} 
          onPress={() => setSelectedEmployeeMenu(null)}
        >
          <View style={styles.actionSheetContent}>
            <View style={styles.actionSheetHeader}>
              <Text style={styles.actionSheetTitle}>
                {selectedEmployeeMenu?.profile?.fullName || selectedEmployeeMenu?.userCode}
              </Text>
              <Text style={styles.actionSheetSubtitle}>Tùy chọn thao tác nhân sự</Text>
            </View>

            {/* Chỉnh sửa */}
            <Pressable
              style={styles.actionSheetItem}
              onPress={() => {
                const empId = selectedEmployeeMenu?.id;
                setSelectedEmployeeMenu(null);
                if (empId) {
                  router.push({ pathname: '/admin/employees/[id]', params: { id: empId, edit: '1' } });
                }
              }}
            >
              <Ionicons name="pencil-outline" size={20} color="#0F172A" />
              <Text style={styles.actionSheetItemText}>Chỉnh sửa thông tin</Text>
            </Pressable>

            {/* Bổ nhiệm / Thu hồi Leader */}
            {(() => {
              if (!selectedEmployeeMenu) return null;
              const isLeader = selectedEmployeeMenu.roles?.some((r: any) => r.role?.code === 'LEADER');
              const leaderRole = selectedEmployeeMenu.roles?.find((r: any) => r.role?.code === 'LEADER');
              const dept = selectedEmployeeMenu.departmentLinks?.find((l: any) => l.isPrimary)?.department ||
                selectedEmployeeMenu.departmentLinks?.[0]?.department ||
                (selectedEmployeeMenu as any).department;
              const targetDeptId = dept?.id || (selectedDeptId !== 'ALL' ? selectedDeptId : undefined);
              const isHrDept = dept?.code === 'HCNS' || dept?.code === 'HR' || dept?.name?.toLowerCase().includes('nhân sự');

              if (isLeader) {
                return (
                  <Pressable
                    style={styles.actionSheetItem}
                    onPress={() => {
                      const emp = selectedEmployeeMenu;
                      setSelectedEmployeeMenu(null);
                      setConfirmAction({
                        type: 'revoke',
                        employeeId: emp.id,
                        employeeName: emp.profile?.fullName || emp.userCode,
                        leaderRoleId: leaderRole?.id,
                      });
                    }}
                  >
                    <Ionicons name="ribbon-outline" size={20} color="#DC2626" />
                    <Text style={[styles.actionSheetItemText, { color: '#DC2626' }]}>Thu hồi chức vụ Leader</Text>
                  </Pressable>
                );
              }

              return (
                <Pressable
                  style={styles.actionSheetItem}
                  onPress={() => {
                    const emp = selectedEmployeeMenu;
                    setSelectedEmployeeMenu(null);
                    if (emp.accountStatus !== 'ACTIVE') {
                      setConfirmAction({ type: 'error_inactive' });
                      return;
                    }
                    setConfirmAction({
                      type: 'appoint',
                      employeeId: emp.id,
                      employeeName: emp.profile?.fullName || emp.userCode,
                      departmentId: targetDeptId,
                      isHrDept,
                    });
                  }}
                >
                  <Ionicons name="ribbon-outline" size={20} color="#166534" />
                  <Text style={[styles.actionSheetItemText, { color: '#166534' }]}>
                    {isHrDept ? 'Bổ nhiệm Trưởng phòng HR' : 'Bổ nhiệm Leader'}
                  </Text>
                </Pressable>
              );
            })()}

            {/* Khóa / Mở khóa tài khoản */}
            {selectedEmployeeMenu?.accountStatus === 'ACTIVE' ? (
              <Pressable
                style={styles.actionSheetItem}
                onPress={() => {
                  const emp = selectedEmployeeMenu;
                  setSelectedEmployeeMenu(null);
                  setConfirmAction({
                    type: 'lock',
                    employeeId: emp.id,
                    employeeName: emp.profile?.fullName || emp.userCode,
                  });
                }}
              >
                <Ionicons name="lock-closed-outline" size={20} color="#DC2626" />
                <Text style={[styles.actionSheetItemText, { color: '#DC2626' }]}>Khóa tài khoản</Text>
              </Pressable>
            ) : (
              <Pressable
                style={styles.actionSheetItem}
                onPress={() => {
                  const emp = selectedEmployeeMenu;
                  setSelectedEmployeeMenu(null);
                  setConfirmAction({
                    type: 'unlock',
                    employeeId: emp.id,
                    employeeName: emp.profile?.fullName || emp.userCode,
                  });
                }}
              >
                <Ionicons name="lock-open-outline" size={20} color="#166534" />
                <Text style={[styles.actionSheetItemText, { color: '#166534' }]}>Mở khóa tài khoản</Text>
              </Pressable>
            )}

            {/* Cancel Button */}
            <Pressable
              style={styles.actionSheetCancelBtn}
              onPress={() => setSelectedEmployeeMenu(null)}
            >
              <Text style={styles.actionSheetCancelText}>Hủy bỏ</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* Confirm Modal */}
      <ConfirmModal
        visible={!!confirmAction}
        title={
          confirmAction?.type === 'appoint'
            ? confirmAction?.isHrDept ? 'Bổ nhiệm Trưởng phòng HR' : 'Xác nhận bổ nhiệm'
            : confirmAction?.type === 'revoke'
            ? 'Xác nhận thu hồi chức vụ'
            : confirmAction?.type === 'error_inactive'
            ? 'Không thể bổ nhiệm'
            : confirmAction?.type === 'lock'
            ? 'Khóa tài khoản'
            : 'Mở khóa tài khoản'
        }
        message={
          confirmAction?.type === 'appoint'
            ? confirmAction?.isHrDept
              ? `Bạn có chắc chắn muốn bổ nhiệm ${confirmAction?.employeeName} làm Trưởng phòng Nhân sự? Tài khoản này sẽ tự động được cấp quyền Quản trị HR toàn công ty.`
              : `Bạn có chắc chắn muốn bổ nhiệm nhân viên ${confirmAction?.employeeName} làm Leader?`
            : confirmAction?.type === 'revoke'
            ? `Bạn có chắc chắn muốn thu hồi chức vụ Leader của nhân viên ${confirmAction?.employeeName}?`
            : confirmAction?.type === 'error_inactive'
            ? 'Nhân viên này đang không trong trạng thái hoạt động nên không thể bổ nhiệm làm Leader.'
            : confirmAction?.type === 'lock'
            ? `Bạn có chắc chắn muốn khóa tài khoản của ${confirmAction?.employeeName}?`
            : `Bạn có chắc chắn muốn mở khóa tài khoản của ${confirmAction?.employeeName}?`
        }
        confirmLabel={
          confirmAction?.type === 'appoint'
            ? 'Bổ nhiệm'
            : confirmAction?.type === 'revoke'
            ? 'Thu hồi'
            : confirmAction?.type === 'error_inactive'
            ? 'Đã hiểu'
            : confirmAction?.type === 'lock'
            ? 'Khóa'
            : 'Mở khóa'
        }
        hideCancel={confirmAction?.type === 'error_inactive'}
        loading={updateEmployeeAny.isPending || assignLeader.isPending || revokeLeader.isPending}
        onCancel={() => setConfirmAction(null)}
        onConfirm={async () => {
          if (!confirmAction) return;
          if (confirmAction.type === 'error_inactive') {
            setConfirmAction(null);
            return;
          }
          try {
            if (confirmAction.type === 'appoint' && confirmAction.employeeId) {
              await assignLeader.mutateAsync({
                userId: confirmAction.employeeId,
                departmentId: confirmAction.departmentId || '',
              });
            } else if (confirmAction.type === 'revoke' && confirmAction.leaderRoleId) {
              await revokeLeader.mutateAsync(confirmAction.leaderRoleId);
            } else if ((confirmAction.type === 'lock' || confirmAction.type === 'unlock') && confirmAction.employeeId) {
              await updateEmployeeAny.mutateAsync({
                id: confirmAction.employeeId,
                status: confirmAction.type === 'lock' ? ('SUSPENDED' as any) : ('ACTIVE' as any),
              });
            }
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
  actionSheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  actionSheetContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 34,
  },
  actionSheetHeader: {
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 8,
  },
  actionSheetTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  actionSheetSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  actionSheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  actionSheetItemText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  actionSheetCancelBtn: {
    marginTop: 14,
    paddingVertical: 14,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionSheetCancelText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#64748B',
  },
});
