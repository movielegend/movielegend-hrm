import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, RefreshControl, StyleSheet, Text, View, Alert, ScrollView } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { z } from 'zod';
import { Avatar } from '../../components/Avatar';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { FormField } from '../../components/FormField';
import { LoadingState } from '../../components/LoadingState';
import { PageHeader } from '../../components/PageHeader';
import { PrimaryButton, SecondaryButton } from '../../components/Buttons';
import { Screen } from '../../components/Screen';
import { ScreenContainer } from '../../components/ScreenContainer';
import { SearchInput } from '../../components/SearchInput';
import { SectionCard } from '../../components/SectionCard';
import { StatusBadge, toneForStatus } from '../../components/StatusBadge';
import { useAuth } from '../../providers/AuthProvider';
import { useEmployee, useEmployeeReport, useEmployees, useUpdateEmployee, useDeleteEmployee, useCreateEmployee } from '../../hooks/useEmployees';
import { usePositions } from '../../hooks/usePositions';
import { useDepartments } from '../../hooks/useDepartments';
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
  positionId: z.string().uuid('positionId chua hop le').optional().or(z.literal('')),
});

const createSchema = editSchema.extend({
  password: z.string().min(6, 'Mat khau phai tu 6 ky tu'),
});

type EmployeeEditValues = z.infer<typeof editSchema>;
type EmployeeCreateValues = z.infer<typeof createSchema>;

export function EmployeeListScreen({ scope }: { scope: 'admin' | 'leader' }) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const filters = { search, page: 1, limit: 20 };
  const adminUsers = useEmployees(filters);
  const leaderReport = useEmployeeReport(filters);

  const deleteEmployee = useDeleteEmployee();

  const confirmDelete = (id: string, name: string) => {
    Alert.alert(
      'Xác nhận xóa nhân viên',
      `Bạn có chắc chắn muốn xóa nhân viên ${name}? Mọi dữ liệu liên quan sẽ bị vô hiệu hóa.`,
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Xóa ngay', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await deleteEmployee.mutateAsync(id);
              Alert.alert('Thành công', 'Đã xóa nhân viên');
            } catch (error) {
              Alert.alert('Lỗi', 'Không thể xóa nhân viên này');
            }
          }
        }
      ]
    );
  };

  if (scope === 'admin') {
    return (
      <Screen>
        <ScreenContainer refreshControl={<RefreshControl refreshing={adminUsers.isRefetching} onRefresh={() => void adminUsers.refetch()} />}>
          <View style={{ marginBottom: 16 }}>
            <PageHeader 
              title="Nhân sự" 
              subtitle="Danh sách toàn bộ nhân sự công ty"
              right={
                <Pressable style={styles.addBtn} onPress={() => router.push('/admin/employees/create')}>
                  <MaterialCommunityIcons name="plus" size={20} color="#fff" />
                  <Text style={styles.addBtnText}>Thêm mới</Text>
                </Pressable>
              }
            />
          </View>
          <SearchInput value={search} onChangeText={setSearch} placeholder="Tìm nhân sự" />
          
          <View style={styles.list}>
            {adminUsers.isLoading ? <LoadingState /> : null}
            {adminUsers.isError ? <ErrorState error={adminUsers.error} onRetry={() => void adminUsers.refetch()} /> : null}
            {!adminUsers.isLoading && !adminUsers.data?.items.length ? <EmptyState title="Chưa có nhân viên phù hợp" /> : null}
            {adminUsers.data?.items.map((employee) => (
              <View key={employee.id} style={styles.card}>
                <View style={styles.identityRow}>
                  <Avatar name={employee.profile?.fullName} uri={employee.profile?.avatarUrl} />
                  <View style={styles.flex}>
                    <Text style={styles.titleText}>{employee.profile?.fullName ?? '-'}</Text>
                    <Text style={styles.metaText}>{employee.userCode}</Text>
                    <Text style={styles.metaText}>
                      Vị trí: {employee.roles?.some((r) => r.role.code === 'LEADER') ? 'Quản lý (Leader)' : (employee.profile?.position?.name ?? 'Chưa có')}
                    </Text>
                  </View>
                  <StatusBadge label={employee.accountStatus} tone={toneForStatus(employee.accountStatus)} />
                </View>
                
                <View style={styles.cardMeta}>
                  <MaterialCommunityIcons name="office-building" size={16} color={colors.primary} />
                  <Text style={styles.metaText}>{employee.departmentLinks?.map((link) => link.department?.name).filter(Boolean).join(', ') || 'Chưa xếp phòng'}</Text>
                </View>

                <View style={styles.actions}>
                  <Pressable style={[styles.actionBtn, { backgroundColor: '#F1F5F9' }]} onPress={() => router.push(`./employees/${employee.id}`)}>
                    <MaterialCommunityIcons name="eye" size={18} color={colors.text} />
                    <Text style={[styles.actionText, { color: colors.text }]}>Chi tiết</Text>
                  </Pressable>
                  {scope === 'admin' ? (
                    <>
                      <Pressable style={[styles.actionBtn, { backgroundColor: '#FFF7ED' }]} onPress={() => router.push({ pathname: '/admin/employees/[id]', params: { id: employee.id, edit: '1' } })}>
                        <MaterialCommunityIcons name="pencil" size={18} color="#EA580C" />
                        <Text style={[styles.actionText, { color: '#EA580C' }]}>Sửa</Text>
                      </Pressable>
                      <Pressable style={[styles.actionBtn, { backgroundColor: '#FEF2F2' }]} onPress={() => confirmDelete(employee.id, employee.profile?.fullName || 'N/A')}>
                        <MaterialCommunityIcons name="delete" size={18} color="#DC2626" />
                        <Text style={[styles.actionText, { color: '#DC2626' }]}>Xóa</Text>
                      </Pressable>
                    </>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        </ScreenContainer>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenContainer refreshControl={<RefreshControl refreshing={leaderReport.isRefetching} onRefresh={() => void leaderReport.refetch()} />}>
        <PageHeader title="Nhan su phong" subtitle="Leader dung bao cao da scope theo phong ban tu backend." />
        <SearchInput value={search} onChangeText={setSearch} placeholder="Tim nhan su" />
        {leaderReport.isLoading ? <LoadingState /> : null}
        {leaderReport.isError ? <ErrorState error={leaderReport.error} onRetry={() => void leaderReport.refetch()} /> : null}
        {!leaderReport.isLoading && !leaderReport.data?.items.length ? <EmptyState title="Chua co nhan vien phu hop bo loc" /> : null}
        {leaderReport.data?.items.map((employee) => (
          <SectionCard key={`${employee.userCode}-${employee.fullName}`}>
            <Text style={styles.titleText}>{employee.fullName ?? '-'}</Text>
            <Text style={styles.meta}>Ma: {employee.userCode ?? '-'}</Text>
            <Text style={styles.meta}>Phong ban: {employee.department ?? '-'}</Text>
            <Text style={styles.meta}>Vi tri: {employee.position ?? '-'}</Text>
            <StatusBadge label={employee.accountStatus ?? '-'} tone={toneForStatus(employee.accountStatus)} />
          </SectionCard>
        ))}
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
      positionId: employee.data?.departmentLinks?.find((link) => link.isPrimary)?.positionId ?? employee.data?.profile?.position?.id ?? '',
    },
  });
  const selectedDepartmentId = watch('departmentId');
  const selectedPositionId = watch('positionId');
  const departments = useDepartments();
  const positions = usePositions(selectedDepartmentId || undefined);
  useEffect(() => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.positions(selectedDepartmentId || undefined) });
  }, [queryClient, selectedDepartmentId]);
  if (employee.isLoading) return <LoadingState />;
  if (employee.isError) return <ErrorState error={employee.error} onRetry={() => void employee.refetch()} />;
  if (!employee.data) return <EmptyState title="Khong tim thay nhan su" />;
  const item = employee.data;
  const submit = handleSubmit(async (payload) => {
    await updateEmployee.mutateAsync({
      fullName: payload.fullName,
      phone: payload.phone,
      ...(payload.email ? { email: payload.email } : {}),
      ...(payload.departmentId ? { departmentId: payload.departmentId } : {}),
      ...(payload.positionId ? { positionId: payload.positionId } : {}),
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
              <Avatar name={item.profile?.fullName} uri={item.profile?.avatarUrl} />
              <View style={styles.flex}>
                <Text style={[styles.titleText, { fontSize: 18 }]}>{item.profile?.fullName ?? 'Chưa cập nhật'}</Text>
                <Text style={[styles.meta, { color: '#1E88E5', fontWeight: '600' }]}>{item.userCode}</Text>
              </View>
              <StatusBadge label={item.accountStatus === 'ACTIVE' ? 'ĐANG HOẠT ĐỘNG' : item.accountStatus} tone={toneForStatus(item.accountStatus)} />
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
            <View style={{ gap: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingBottom: 8 }}>
                <Text style={{ fontSize: 14, color: '#98A0A8' }}>Phòng ban</Text>
                <Text style={{ fontSize: 14, color: '#0B3B61', fontWeight: '600', textAlign: 'right', flex: 1, marginLeft: 16 }}>
                  {item.departmentLinks?.map((link) => link.department?.name).filter(Boolean).join(', ') || 'Chưa xếp phòng'}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingBottom: 8 }}>
                <Text style={{ fontSize: 14, color: '#98A0A8' }}>Vị trí</Text>
                <Text style={{ fontSize: 14, color: '#0B3B61', fontWeight: '600', textAlign: 'right', flex: 1, marginLeft: 16 }}>
                  {item.roles?.some((r) => r.role.code === 'LEADER') ? 'Quản lý (Leader)' : (item.departmentLinks?.map((link) => link.position?.name).filter(Boolean).join(', ') || item.profile?.position?.name || 'Chưa có vị trí')}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingBottom: 8 }}>
                <Text style={{ fontSize: 14, color: '#98A0A8' }}>Phân quyền</Text>
                <Text style={{ fontSize: 14, color: '#0B3B61', fontWeight: '600', textAlign: 'right', flex: 1, marginLeft: 16 }}>
                  {item.roles?.map((role) => role.role.code).join(', ') || 'USER'}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 14, color: '#98A0A8' }}>Trạng thái khuôn mặt</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name={item.profile?.avatarUrl ? "checkmark-circle" : "close-circle"} size={16} color={item.profile?.avatarUrl ? "#10B981" : "#F59E0B"} />
                  <Text style={{ fontSize: 14, color: item.profile?.avatarUrl ? '#10B981' : '#F59E0B', fontWeight: '500' }}>
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
                  <Pressable key={dept.id} accessibilityRole="button" onPress={() => { setValue('departmentId', dept.id, { shouldValidate: true }); setValue('positionId', '', { shouldValidate: true }); }} style={[styles.positionOption, selectedDepartmentId === dept.id && styles.positionOptionSelected]}>
                    <Text style={styles.titleText}>{dept.name}</Text>
                    <Text style={styles.meta}>{dept.code}</Text>
                  </Pressable>
                ))}
                {errors.departmentId ? <Text style={styles.error}>{errors.departmentId.message}</Text> : null}
              </View>
              
              <Text style={[styles.sectionTitle, { marginTop: 16, marginBottom: 8 }]}>Chọn chức vụ/vị trí</Text>
              {positions.isLoading ? <LoadingState label="Đang tải danh sách chức vụ..." /> : null}
              {positions.isError ? <ErrorState error={positions.error} onRetry={() => void positions.refetch()} /> : null}
              
              <View style={{ gap: 8 }}>
                {positions.data?.items.map((position) => (
                  <Pressable key={position.id} accessibilityRole="button" onPress={() => setValue('positionId', position.id, { shouldValidate: true })} style={[styles.positionOption, selectedPositionId === position.id && styles.positionOptionSelected]}>
                    <Text style={[styles.titleText, { color: selectedPositionId === position.id ? colors.primary : '#0B3B61' }]}>{position.name}</Text>
                    <Text style={[styles.meta, { color: selectedPositionId === position.id ? colors.primary : '#98A0A8' }]}>{position.code}</Text>
                  </Pressable>
                ))}
              </View>
              {errors.positionId ? <Text style={styles.error}>{errors.positionId.message}</Text> : null}
              
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
    defaultValues: { fullName: '', phone: '', email: '', password: '', departmentId: '', positionId: '' },
  });

  const selectedDepartmentId = watch('departmentId');
  const selectedPositionId = watch('positionId');
  const departments = useDepartments();
  const positions = usePositions(selectedDepartmentId || undefined);

  useEffect(() => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.positions(selectedDepartmentId || undefined) });
  }, [queryClient, selectedDepartmentId]);

  const submit = handleSubmit(async (payload) => {
    try {
      const cleanPayload = {
        fullName: payload.fullName,
        phone: payload.phone,
        password: payload.password,
        ...(payload.email ? { email: payload.email } : {}),
        ...(payload.departmentId ? { departmentId: payload.departmentId } : {}),
        ...(payload.positionId ? { positionId: payload.positionId } : {}),
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
              <Pressable key={dept.id} accessibilityRole="button" onPress={() => { setValue('departmentId', dept.id, { shouldValidate: true }); setValue('positionId', '', { shouldValidate: true }); }} style={[styles.positionOption, selectedDepartmentId === dept.id && styles.positionOptionSelected]}>
                <Text style={styles.titleText}>{dept.name}</Text>
                <Text style={styles.meta}>{dept.code}</Text>
              </Pressable>
            ))}
            {errors.departmentId ? <Text style={styles.error}>{errors.departmentId.message}</Text> : null}
          </View>
          
          {selectedDepartmentId && (
            <View style={{ marginTop: 16 }}>
              <Text style={[styles.sectionTitle, { marginBottom: 8 }]}>Chức vụ</Text>
          {positions.isLoading ? <LoadingState label="Đang tải chức vụ" /> : null}
          {positions.data?.items.map((position) => (
            <Pressable key={position.id} accessibilityRole="button" onPress={() => setValue('positionId', position.id, { shouldValidate: true })} style={[styles.positionOption, selectedPositionId === position.id && styles.positionOptionSelected]}>
              <Text style={styles.titleText}>{position.name}</Text>
              <Text style={styles.meta}>{position.code}</Text>
            </Pressable>
          ))}
          {errors.positionId ? <Text style={styles.error}>{errors.positionId.message}</Text> : null}
            </View>
          )}

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
  identityRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  meta: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  positionOption: {
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    padding: spacing.md,
    marginTop: 8,
  },
  positionOptionSelected: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  titleText: { color: colors.text, fontSize: 17, fontWeight: '800' },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 4,
  },
  addBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  list: {
    gap: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
    marginTop: 12,
  },
  metaText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
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
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  actionText: {
    fontWeight: '600',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
});
