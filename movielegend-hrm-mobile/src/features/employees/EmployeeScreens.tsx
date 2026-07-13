import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, RefreshControl, StyleSheet, Text, View, Alert, ScrollView, Platform } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { z } from 'zod';
import { Avatar } from '../../components/Avatar';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { FormField } from '../../components/FormField';
import { LoadingState } from '../../components/LoadingState';
import { ConfirmModal } from '../../components/ConfirmModal';
import { PageHeader } from '../../components/PageHeader';
import { PrimaryButton, SecondaryButton } from '../../components/Buttons';
import { FilterChip } from '../../components/FilterChip';
import { Screen } from '../../components/Screen';
import { ScreenContainer } from '../../components/ScreenContainer';
import { SearchInput } from '../../components/SearchInput';
import { SectionCard } from '../../components/SectionCard';
import { StatusBadge, toneForStatus } from '../../components/StatusBadge';
import { useAuth } from '../../providers/AuthProvider';
import { useEmployees, useEmployeeReport, useEmployee, useUpdateEmployee, useDeleteEmployee, useCreateEmployee } from '../../hooks/useEmployees';
import { usePositions } from '../../hooks/usePositions';
import { useDepartments } from '../../hooks/useDepartments';
import { useAssignLeader, useRevokeLeader } from '../../hooks/useLeaderAssignment';
import { queryKeys } from '../../constants/queryKeys';
import { useQueryClient } from '@tanstack/react-query';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { hasPermission } from '../../utils/permissions';
import { normalizeApiError } from '../../utils/api-error';
import { maskIdCard, maskPhone } from '../../utils/privacy';

const editSchema = z.object({
  fullName: z.string().min(2, 'Vui long nhap ho ten'),
  phone: z.string().min(8, 'So dien thoai chua hop le'),
  email: z.string().email('Email chua hop le').optional().or(z.literal('')),
  departmentId: z.string().uuid('departmentId chua hop le').optional().or(z.literal('')),
  accountStatus: z.enum(['ACTIVE', 'SUSPENDED', 'PENDING']).optional(),
});

const createSchema = editSchema.extend({
  password: z.string().min(6, 'Mat khau phai tu 6 ky tu'),
});

type EmployeeEditValues = z.infer<typeof editSchema>;
type EmployeeCreateValues = z.infer<typeof createSchema>;

interface EmployeeListFilters {
  page: number;
  limit: number;
  search?: string;
  departmentId?: string;
  accountStatus?: import('../../types/employee.types').AccountStatus;
}

export function EmployeeListScreen({ scope }: { scope: 'admin' | 'leader' }) {
  const router = useRouter();
  const { user } = useAuth();
  const { departmentId, branchId } = useLocalSearchParams<{ departmentId?: string; branchId?: string }>();
  const [filters, setFilters] = useState<EmployeeListFilters>({
    page: 1,
    limit: 10,
    departmentId: departmentId,
    accountStatus: 'ACTIVE',
  });
  
  const adminUsers = useEmployees(filters);
  const leaderReport = useEmployeeReport(filters);

  const deleteEmployee = useDeleteEmployee();
  const assignLeader = useAssignLeader();
  const revokeLeader = useRevokeLeader();
  const [confirmAction, setConfirmAction] = useState<{ type: 'delete' | 'appoint' | 'revoke' | 'error_inactive', employeeId?: string, employeeName?: string, leaderRoleId?: string } | null>(null);

  if (scope === 'admin') {
    return (
      <Screen>
        <ScreenContainer refreshControl={<RefreshControl refreshing={adminUsers.isRefetching} onRefresh={() => void adminUsers.refetch()} />}>
          <View style={{ marginBottom: 16 }}>
            <PageHeader 
              title="Nhân viên" 
              subtitle="Danh sách toàn bộ nhân sự công ty"
              right={
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Pressable style={styles.addBtn} onPress={() => router.push('/admin/employees/create')}>
                    <MaterialCommunityIcons name="plus" size={18} color="#fff" />
                    <Text style={styles.addBtnText}>Thêm mới</Text>
                  </Pressable>
                </View>
              }
            />
          </View>
          <View style={{ marginBottom: 12 }}>
            <SearchInput value={filters.search ?? ''} onChangeText={(text) => setFilters(f => ({ ...f, search: text }))} placeholder="Tìm nhân sự" />
          </View>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
            <Pressable style={[styles.filterChip, filters.accountStatus === 'ACTIVE' && styles.filterChipActive]} onPress={() => setFilters((f) => ({ ...f, accountStatus: 'ACTIVE', page: 1 }))}>
              <Text style={[styles.filterChipText, filters.accountStatus === 'ACTIVE' && styles.filterChipTextActive]}>Đang hoạt động</Text>
            </Pressable>
            <Pressable style={[styles.filterChip, filters.accountStatus === 'SUSPENDED' && styles.filterChipActive]} onPress={() => setFilters((f) => ({ ...f, accountStatus: 'SUSPENDED', page: 1 }))}>
              <Text style={[styles.filterChipText, filters.accountStatus === 'SUSPENDED' && styles.filterChipTextActive]}>Tạm khóa</Text>
            </Pressable>
            <Pressable style={[styles.filterChip, !filters.accountStatus && styles.filterChipActive]} onPress={() => setFilters((f) => ({ ...f, accountStatus: undefined, page: 1 }))}>
              <Text style={[styles.filterChipText, !filters.accountStatus && styles.filterChipTextActive]}>Tất cả</Text>
            </Pressable>
          </View>
          
          <View style={styles.list}>
            {adminUsers.isLoading ? <LoadingState /> : null}
            {adminUsers.isError ? <ErrorState error={adminUsers.error} onRetry={() => void adminUsers.refetch()} /> : null}
            {!adminUsers.isLoading && !adminUsers.data?.items.length ? <EmptyState title="Chưa có nhân viên phù hợp" /> : null}
            {adminUsers.data?.items.map((employee) => (
              <View key={employee.id} style={styles.card}>
                <View style={styles.identityRow}>
                  <View style={styles.avatarBox}>
                    <Text style={styles.avatarText}>{employee.profile?.fullName ? employee.profile.fullName.split(' ').pop()?.[0] || 'NV' : 'NV'}</Text>
                  </View>
                  <View style={styles.flex}>
                    <Text style={styles.titleText}>{employee.profile?.fullName ?? '-'}</Text>
                    <Text style={styles.metaText}>{employee.userCode}</Text>
                    <Text style={styles.metaText}>
                      Vị trí: {employee.roles?.some((r) => r.role.code === 'LEADER') ? 'Quản lý (Leader)' : (employee.profile?.position?.name ?? 'Chưa có')}
                    </Text>
                  </View>
                  <View style={styles.badgeWrapper}>
                    <Text style={styles.badgeText}>{employee.accountStatus}</Text>
                  </View>
                </View>
                
                <View style={styles.cardMeta}>
                  <MaterialCommunityIcons name="office-building" size={18} color="#111827" />
                  <Text style={[styles.metaText, { color: '#111827', fontWeight: '500' }]}>{employee.departmentLinks?.map((link) => link.department?.name).filter(Boolean).join(', ') || 'Chưa xếp phòng'}</Text>
                </View>

                <View style={styles.actions}>
                  <Pressable style={styles.actionBtn} onPress={() => router.push(`/admin/employees/${employee.id}`)}>
                    <MaterialCommunityIcons name="eye-outline" size={18} color="#111827" />
                    <Text style={styles.actionText}>Chi tiết</Text>
                  </Pressable>
                  {scope === 'admin' ? (
                    <>
                      <Pressable style={styles.actionBtn} onPress={() => router.push({ pathname: '/admin/employees/[id]', params: { id: employee.id, edit: '1' } })}>
                        <MaterialCommunityIcons name="pencil" size={18} color="#111827" />
                        <Text style={styles.actionText}>Sửa</Text>
                      </Pressable>
                      {departmentId ? (
                        (() => {
                          const leaderRole = employee.roles?.find((r) => r.role.code === 'LEADER' && r.scopeId === departmentId);
                          if (leaderRole) {
                            return (
                              <Pressable 
                                style={styles.actionBtn}
                                onPress={() => setConfirmAction({ type: 'revoke', employeeId: employee.id, employeeName: employee.profile?.fullName || 'N/A', leaderRoleId: leaderRole.id })}
                              >
                                <MaterialCommunityIcons name="account-remove-outline" size={18} color="#111827" />
                                <Text style={styles.actionText}>Thu hồi</Text>
                              </Pressable>
                            );
                          } else {
                            return (
                              <Pressable 
                                style={styles.actionBtn}
                                onPress={() => {
                                  if (employee.accountStatus !== 'ACTIVE') {
                                    setConfirmAction({ type: 'error_inactive' });
                                    return;
                                  }
                                  setConfirmAction({ type: 'appoint', employeeId: employee.id, employeeName: employee.profile?.fullName || 'N/A' });
                                }}
                              >
                                <MaterialCommunityIcons name="account-star-outline" size={18} color="#111827" />
                                <Text style={styles.actionText}>Bổ nhiệm</Text>
                              </Pressable>
                            );
                          }
                        })()
                      ) : null}
                    </>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
          <ConfirmModal 
            visible={!!confirmAction}
            title={
              confirmAction?.type === 'delete' ? 'Xác nhận xóa nhân viên' :
              confirmAction?.type === 'appoint' ? 'Xác nhận bổ nhiệm' : 
              confirmAction?.type === 'error_inactive' ? 'Không thể bổ nhiệm' : 'Xác nhận thu hồi'
            }
            message={
              confirmAction?.type === 'delete' ? `Bạn có chắc chắn muốn xóa nhân viên ${confirmAction?.employeeName}? Mọi dữ liệu liên quan sẽ bị vô hiệu hóa.` :
              confirmAction?.type === 'appoint' ? `Bạn có chắc chắn muốn bổ nhiệm nhân viên ${confirmAction?.employeeName} làm Leader?` : 
              confirmAction?.type === 'error_inactive' ? 'Nhân viên này đang không trong trạng thái hoạt động nên không thể bổ nhiệm làm Leader.' :
              `Bạn có chắc chắn muốn thu hồi chức vụ Leader của nhân viên ${confirmAction?.employeeName}?`
            }
            confirmLabel={
              confirmAction?.type === 'delete' ? 'Xóa ngay' :
              confirmAction?.type === 'appoint' ? 'Bổ nhiệm' : 
              confirmAction?.type === 'error_inactive' ? 'Đã hiểu' : 'Thu hồi'
            }
            hideCancel={confirmAction?.type === 'error_inactive'}
            loading={deleteEmployee.isPending || assignLeader.isPending || revokeLeader.isPending}
            onCancel={() => setConfirmAction(null)}
            onConfirm={async () => {
              if (!confirmAction) return;
              if (confirmAction.type === 'error_inactive') {
                setConfirmAction(null);
                return;
              }
              try {
                if (confirmAction.type === 'delete' && confirmAction.employeeId) {
                  await deleteEmployee.mutateAsync(confirmAction.employeeId);
                } else if (confirmAction.type === 'appoint' && confirmAction.employeeId) {
                  await assignLeader.mutateAsync({ userId: confirmAction.employeeId, departmentId: departmentId! });
                } else if (confirmAction.type === 'revoke' && confirmAction.leaderRoleId) {
                  await revokeLeader.mutateAsync(confirmAction.leaderRoleId);
                }
                setConfirmAction(null);
              } catch (e) {
                // Ignore API error because react-query handles it
                setConfirmAction(null);
              }
            }}
          />
        </ScreenContainer>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenContainer refreshControl={<RefreshControl refreshing={leaderReport.isRefetching} onRefresh={() => void leaderReport.refetch()} />}>
        <PageHeader title="Nhân sự phòng ban" subtitle="Danh sách nhân viên thuộc sự quản lý của bạn" />
        <SearchInput value={filters.search ?? ''} onChangeText={(text) => setFilters(f => ({ ...f, search: text }))} placeholder="Tìm kiếm nhân sự..." />
        {leaderReport.isLoading ? <LoadingState /> : null}
        {leaderReport.isError ? <ErrorState error={leaderReport.error} onRetry={() => void leaderReport.refetch()} /> : null}
        {!leaderReport.isLoading && !leaderReport.data?.items.length ? <EmptyState title="Chưa có nhân viên phù hợp với bộ lọc" /> : null}
        {leaderReport.data?.items.filter(emp => emp.userCode !== user?.userCode).map((employee) => {
          let viStatus = employee.accountStatus;
          if (viStatus === 'ACTIVE') viStatus = 'Hoạt động';
          else if (viStatus === 'INACTIVE') viStatus = 'Khóa';
          else if (viStatus === 'SUSPENDED') viStatus = 'Đình chỉ';

          return (
            <SectionCard key={`${employee.userCode}-${employee.fullName}`} style={{ padding: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Avatar name={employee.fullName ?? 'NV'} size={56} />
                
                <View style={{ flex: 1, marginLeft: 16 }}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 4 }}>
                    {employee.fullName ?? 'Chưa cập nhật'}
                  </Text>
                  
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' }}>
                    <View style={{ backgroundColor: colors.background, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginRight: 8, borderWidth: 1, borderColor: colors.border }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: colors.muted }}>Mã NV: {employee.userCode ?? '-'}</Text>
                    </View>
                    <StatusBadge label={viStatus ?? '-'} tone={toneForStatus(employee.accountStatus as any)} />
                  </View>
                  
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                    <Ionicons name="briefcase-outline" size={14} color={colors.muted} />
                    <Text style={{ fontSize: 13, color: colors.muted, marginLeft: 6, flex: 1 }}>{employee.position ?? 'Chưa có vị trí'}</Text>
                  </View>
                </View>
              </View>
            </SectionCard>
          );
        })}
      </ScreenContainer>
    </Screen>
  );
}

export function EmployeeDetailScreen() {
  const { id, edit } = useLocalSearchParams<{ id: string; edit?: string }>();
  const { user } = useAuth();
  const employee = useEmployee(id);
  const updateEmployee = useUpdateEmployee(id);
  const [editing, setEditing] = useState(edit === '1');
  const canEdit = hasPermission(user, 'user.update');
  const queryClient = useQueryClient();
  const { control, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<EmployeeEditValues>({
    resolver: zodResolver(editSchema),
    values: {
      fullName: employee.data?.profile?.fullName ?? '',
      phone: employee.data?.phone ?? '',
      email: employee.data?.email ?? '',
      departmentId: employee.data?.departmentLinks?.find((link) => link.isPrimary)?.departmentId ?? '',
      accountStatus: employee.data?.accountStatus ?? 'ACTIVE',
    },
  });
  const selectedDepartmentId = watch('departmentId');
  const departments = useDepartments();

  if (employee.isLoading) return <LoadingState />;
  if (employee.isError) return <ErrorState error={employee.error} onRetry={() => void employee.refetch()} />;
  if (!employee.data) return <EmptyState title="Khong tim thay nhan su" />;
  const item = employee.data;
  const submit = handleSubmit(async (payload) => {
    await updateEmployee.mutateAsync({
      fullName: payload.fullName,
      phone: payload.phone,
      accountStatus: payload.accountStatus,
      ...(payload.email ? { email: payload.email } : {}),
      ...(payload.departmentId ? { departmentId: payload.departmentId } : {}),
    });
    setEditing(false);
    reset(payload);
  });
  return (
    <Screen>
      <ScreenContainer style={{ paddingBottom: 100 }}>
        <PageHeader title="Chi tiết nhân sự" subtitle="Hồ sơ và thông tin cá nhân của nhân viên" />
          
          <SectionCard title="Thông tin cơ bản">
            <View style={[styles.identityRow, { marginBottom: 16 }]}>
              <View style={[styles.avatarBox, { width: 56, height: 56, borderRadius: 28 }]}>
                <Text style={[styles.avatarText, { fontSize: 20 }]}>{item.profile?.fullName ? item.profile.fullName.split(' ').pop()?.[0] || 'NV' : 'NV'}</Text>
              </View>
              <View style={styles.flex}>
                <Text style={[styles.titleText, { fontSize: 18, marginBottom: 4 }]}>{item.profile?.fullName ?? 'Chưa cập nhật'}</Text>
                <Text style={[styles.metaText, { color: '#4B5563', fontWeight: '600' }]}>{item.userCode}</Text>
              </View>
              <View style={styles.badgeWrapper}>
                <Text style={styles.badgeText}>{item.accountStatus === 'ACTIVE' ? 'ĐANG HOẠT ĐỘNG' : item.accountStatus}</Text>
              </View>
            </View>

            <View style={{ gap: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="call-outline" size={18} color="#98A0A8" style={{ width: 24 }} />
                <Text style={{ fontSize: 14, color: '#0B3B61', flex: 1 }}>{maskPhone(item.phone) || 'Chưa cập nhật'}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="mail-outline" size={18} color="#98A0A8" style={{ width: 24 }} />
                <Text style={{ fontSize: 14, color: '#0B3B61', flex: 1 }}>{item.email || 'Chưa cập nhật'}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="card-outline" size={18} color="#98A0A8" style={{ width: 24 }} />
                <Text style={{ fontSize: 14, color: '#0B3B61', flex: 1 }}>CCCD: {maskIdCard(item.profile?.idCardNumber) || 'Chưa cập nhật'}</Text>
              </View>
            </View>
          </SectionCard>

          <SectionCard title="Công việc & Vai trò">
            <View style={{ gap: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingBottom: 12 }}>
                <Text style={{ fontSize: 14, color: '#6B7280' }}>Phòng ban</Text>
                <Text style={{ fontSize: 14, color: '#111827', fontWeight: '600', textAlign: 'right', flex: 1, marginLeft: 16 }}>
                  {item.departmentLinks?.map((link) => link.department?.name).filter(Boolean).join(', ') || 'Chưa xếp phòng'}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingBottom: 12 }}>
                <Text style={{ fontSize: 14, color: '#6B7280' }}>Vị trí</Text>
                <Text style={{ fontSize: 14, color: '#111827', fontWeight: '600', textAlign: 'right', flex: 1, marginLeft: 16 }}>
                  {item.roles?.some((r) => r.role.code === 'LEADER') ? 'Quản lý (Leader)' : (item.departmentLinks?.map((link) => link.position?.name).filter(Boolean).join(', ') || item.profile?.position?.name || 'Chưa có vị trí')}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingBottom: 12 }}>
                <Text style={{ fontSize: 14, color: '#6B7280' }}>Phân quyền</Text>
                <Text style={{ fontSize: 14, color: '#111827', fontWeight: '600', textAlign: 'right', flex: 1, marginLeft: 16 }}>
                  {item.roles?.map((role) => role.role.code).join(', ') || 'USER'}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 14, color: '#6B7280' }}>Trạng thái khuôn mặt</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="information-circle" size={16} color="#111827" />
                  <Text style={{ fontSize: 14, color: '#111827', fontWeight: '500' }}>
                    {item.profile?.avatarUrl ? 'Đã có dữ liệu' : 'Chưa cập nhật'}
                  </Text>
                </View>
              </View>
            </View>
          </SectionCard>

          {canEdit ? (
            <SecondaryButton onPress={() => setEditing((current) => !current)} style={{ marginBottom: 16 }}>
              {editing ? 'Hủy cập nhật' : 'Cập nhật thông tin'}
            </SecondaryButton>
          ) : null}

          {editing ? (
            <SectionCard title="Cập nhật thông tin cơ bản">
              <Controller control={control} name="fullName" render={({ field }) => <FormField label="Họ và tên" value={field.value} onChangeText={field.onChange} error={errors.fullName?.message} />} />
              <Controller control={control} name="phone" render={({ field }) => <FormField label="Số điện thoại" value={field.value} onChangeText={field.onChange} error={errors.phone?.message} keyboardType="phone-pad" />} />
              <Controller control={control} name="email" render={({ field }) => <FormField label="Email" value={field.value} onChangeText={field.onChange} error={errors.email?.message} keyboardType="email-address" />} />
              
              <View style={{ marginTop: 16 }}>
                <Text style={[styles.sectionTitle, { marginBottom: 8 }]}>Phòng ban (Tùy chọn)</Text>
                {departments.isLoading ? <LoadingState label="Đang tải phòng ban" /> : null}
                {departments.data?.items.map((dept) => (
                  <Pressable key={dept.id} accessibilityRole="button" onPress={() => { setValue('departmentId', dept.id, { shouldValidate: true }); }} style={[styles.positionOption, selectedDepartmentId === dept.id && styles.positionOptionSelected]}>
                    <Text style={styles.titleText}>{dept.name}</Text>
                    <Text style={styles.meta}>{dept.code}</Text>
                  </Pressable>
                ))}
                {errors.departmentId ? <Text style={styles.error}>{errors.departmentId.message}</Text> : null}
              </View>
              
              <Controller
                control={control}
                name="accountStatus"
                render={({ field }) => (
                  <View style={{ marginTop: 16 }}>
                    <Text style={[styles.sectionTitle, { marginBottom: 8 }]}>Trạng thái tài khoản</Text>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <Pressable 
                        onPress={() => field.onChange('ACTIVE')}
                        style={[styles.positionOption, field.value === 'ACTIVE' && styles.positionOptionSelected, { flex: 1, alignItems: 'center' }]}
                      >
                        <Text style={{ color: field.value === 'ACTIVE' ? colors.primary : colors.text, fontWeight: '600' }}>HOẠT ĐỘNG</Text>
                      </Pressable>
                      <Pressable 
                        onPress={() => field.onChange('SUSPENDED')}
                        style={[styles.positionOption, field.value === 'SUSPENDED' && { borderColor: colors.danger, borderWidth: 2 }, { flex: 1, alignItems: 'center' }]}
                      >
                        <Text style={{ color: field.value === 'SUSPENDED' ? colors.danger : colors.text, fontWeight: '600' }}>TẠM KHÓA</Text>
                      </Pressable>
                    </View>
                  </View>
                )}
              />
              <PrimaryButton onPress={() => void submit()} loading={updateEmployee.isPending} style={{ marginTop: 24 }}>
                Lưu thay đổi
              </PrimaryButton>
            </SectionCard>
          ) : null}
        </ScreenContainer>
    </Screen>
  );
}

export function CreateEmployeeScreen() {
  const router = useRouter();
  const createEmployee = useCreateEmployee();
  const queryClient = useQueryClient();
  
  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<EmployeeCreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { fullName: '', phone: '', email: '', password: '', departmentId: '' },
  });

  const selectedDepartmentId = watch('departmentId');
  const departments = useDepartments();

  const submit = handleSubmit(async (payload) => {
    try {
      const cleanPayload = {
        fullName: payload.fullName,
        phone: payload.phone,
        password: payload.password,
        ...(payload.email ? { email: payload.email } : {}),
        ...(payload.departmentId ? { departmentId: payload.departmentId } : {}),
      };
      await createEmployee.mutateAsync(cleanPayload);
      Alert.alert('Thành công', 'Đã thêm nhân viên mới');
      router.back();
    } catch (error: any) {
      const apiError = normalizeApiError(error);
      Alert.alert('Lỗi', apiError.message);
    }
  });

  return (
    <Screen>
      <ScreenContainer>
        <PageHeader title="Thêm nhân viên mới" subtitle="Tạo tài khoản và hồ sơ nhân sự" />
        <SectionCard>
          <Controller control={control} name="fullName" render={({ field }) => <FormField label="Họ tên" value={field.value} onChangeText={field.onChange} error={errors.fullName?.message} />} />
          <Controller control={control} name="phone" render={({ field }) => <FormField label="Số điện thoại" value={field.value} onChangeText={field.onChange} error={errors.phone?.message} keyboardType="phone-pad" />} />
          <Controller control={control} name="email" render={({ field }) => <FormField label="Email (Tùy chọn)" value={field.value} onChangeText={field.onChange} error={errors.email?.message} keyboardType="email-address" />} />
          <Controller control={control} name="password" render={({ field }) => <FormField label="Mật khẩu khởi tạo" value={field.value} onChangeText={field.onChange} error={errors.password?.message} secureTextEntry />} />
          
          <View style={{ marginTop: 16 }}>
            <Text style={[styles.sectionTitle, { marginBottom: 8 }]}>Phòng ban (Tùy chọn)</Text>
            {departments.isLoading ? <LoadingState label="Đang tải phòng ban" /> : null}
            {departments.data?.items.map((dept) => (
              <Pressable key={dept.id} accessibilityRole="button" onPress={() => { setValue('departmentId', dept.id, { shouldValidate: true }); }} style={[styles.positionOption, selectedDepartmentId === dept.id && styles.positionOptionSelected]}>
                <Text style={styles.titleText}>{dept.name}</Text>
                <Text style={styles.meta}>{dept.code}</Text>
              </Pressable>
            ))}
            {errors.departmentId ? <Text style={styles.error}>{errors.departmentId.message}</Text> : null}
          </View>

          <View style={{ marginTop: 24 }}>
            <PrimaryButton onPress={() => void submit()} loading={createEmployee.isPending}>Tạo Nhân Viên</PrimaryButton>
          </View>
        </SectionCard>
      </ScreenContainer>
    </Screen>
  );
}

const styles = StyleSheet.create({
  error: { color: colors.danger, fontSize: 14 },
  flex: { flex: 1 },
  identityRow: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  meta: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  positionOption: {
    borderColor: '#F3F4F6',
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
    marginTop: 8,
  },
  positionOptionSelected: {
    borderColor: '#111827',
    borderWidth: 2,
  },
  titleText: { color: '#111827', fontSize: 17, fontWeight: '800' },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  addBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterChipActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  filterChipText: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  list: {
    gap: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
    marginTop: 12,
  },
  metaText: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '500',
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    gap: 6,
  },
  actionText: {
    fontWeight: '600',
    fontSize: 13,
    color: '#111827',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  avatarBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  badgeWrapper: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    color: '#111827',
    fontSize: 11,
    fontWeight: '700',
  },
});
