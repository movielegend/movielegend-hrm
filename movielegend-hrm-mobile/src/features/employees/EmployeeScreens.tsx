import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, RefreshControl, StyleSheet, Text, View, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
import { SelectField } from '../../components/SelectField';
import { useDepartments } from '../../hooks/useDepartments';
import { useAuth } from '../../providers/AuthProvider';
import { useEmployee, useEmployeeReport, useEmployees, useUpdateEmployee } from '../../hooks/useEmployees';
import { usePositions } from '../../hooks/usePositions';
import { queryKeys } from '../../constants/queryKeys';
import { useQueryClient } from '@tanstack/react-query';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { hasPermission } from '../../utils/permissions';
import { maskIdCard, maskPhone } from '../../utils/privacy';

const editSchema = z.object({
  fullName: z.string().min(2, 'Vui long nhap ho ten'),
  phone: z.string().min(8, 'So dien thoai chua hop le'),
  email: z.string().email('Email chua hop le').optional().or(z.literal('')),
  departmentId: z.string().uuid('departmentId chua hop le').optional().or(z.literal('')),
  positionId: z.string().uuid('positionId chua hop le').optional().or(z.literal('')),
});

type EmployeeEditValues = z.infer<typeof editSchema>;

export function EmployeeListScreen({ scope }: { scope: 'admin' | 'leader' }) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const filters = { search, page: 1, limit: 20 };
  const adminUsers = useEmployees(filters);
  const leaderReport = useEmployeeReport(filters);

  if (scope === 'admin') {
    return (
      <Screen>
        <ScreenContainer refreshControl={<RefreshControl refreshing={adminUsers.isRefetching} onRefresh={() => void adminUsers.refetch()} />}>
          <PageHeader showBack title="Nhan su" subtitle="Danh sach dung pagination backend, khong fetch toan bo database." />
          <SearchInput value={search} onChangeText={setSearch} placeholder="Tim nhan su" />
          {adminUsers.isLoading ? <LoadingState /> : null}
          {adminUsers.isError ? <ErrorState error={adminUsers.error} onRetry={() => void adminUsers.refetch()} /> : null}
          {!adminUsers.isLoading && !adminUsers.data?.items.length ? <EmptyState title="Chua co nhan vien phu hop bo loc" /> : null}
          {adminUsers.data?.items.map((employee) => {
            const departmentName = employee.departmentLinks?.map((link) => link.department?.name).filter(Boolean).join(', ') || '-';
            const positionName = employee.departmentLinks?.map((link) => link.position?.name).filter(Boolean).join(', ') || employee.profile?.position?.name || 'Nhân viên';
            
            return (
              <Pressable 
                key={employee.id} 
                onPress={() => router.push(`./employees/${employee.id}`)}
                style={({ pressed }) => [styles.employeeCard, pressed && { opacity: 0.8 }]}
              >
                <View style={styles.cardHeader}>
                  <Avatar name={employee.profile?.fullName} uri={employee.profile?.avatarUrl} />
                  <View style={styles.cardHeaderInfo}>
                    <Text style={styles.empName} numberOfLines={1}>{employee.profile?.fullName ?? '-'}</Text>
                    <Text style={styles.empCode}>{employee.userCode}</Text>
                    {!employee.profile?.avatarUrl && (
                      <Text style={styles.warningText}>Chưa có ảnh đăng ký...</Text>
                    )}
                  </View>
                  <View style={styles.roleTag}>
                    <Text style={styles.roleTagText}>{positionName}</Text>
                  </View>
                </View>

                {/* Just show 1 info field for compactness */}
                <View style={styles.deptRow}>
                  <Ionicons name="business-outline" size={16} color="#6B7280" />
                  <Text style={styles.deptText}>Phòng ban: {departmentName}</Text>
                </View>
              </Pressable>
            );
          })}
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
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const employee = useEmployee(id);
  const updateEmployee = useUpdateEmployee(id);
  const [editing, setEditing] = useState(false);
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
  const positions = usePositions(selectedDepartmentId || undefined);
  useEffect(() => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.positions(selectedDepartmentId || undefined) });
  }, [queryClient, selectedDepartmentId]);
  const allDepartments = useDepartments();

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

  const deptOptions = allDepartments.data?.items.map(d => ({ label: d.name, value: d.id })) || [];
  const posOptions = positions.data?.items.map(p => ({ label: p.name, value: p.id })) || [];

  return (
    <Screen>
      <ScreenContainer>
        <PageHeader showBack title="Chi tiet nhan su" subtitle="Khong hien thi salary, CCCD day du, bank account hoac document URLs." />
        <SectionCard>
          <View style={styles.profileHeader}>
            <Text style={styles.profileName}>{item.profile?.fullName ?? '-'}</Text>
            <Text style={styles.profileMeta}>{item.userCode} • {item.phone}</Text>
            
            <View style={styles.infoGrid}>
              <Text style={styles.infoLabel}>Email: <Text style={styles.infoValue}>{item.email ?? '—'}</Text></Text>
              <Text style={styles.infoLabel}>CCCD: <Text style={styles.infoValue}>{item.profile?.idCardNumber ?? '—'}</Text></Text>
              <Text style={styles.infoLabel}>Phòng ban: <Text style={styles.infoValue}>{item.departmentLinks?.map((link) => link.department?.name).filter(Boolean).join(', ') || '—'} • {item.departmentLinks?.map((link) => link.position?.name).filter(Boolean).join(', ') || item.profile?.position?.name || '—'}</Text></Text>
            </View>

            <View style={styles.warningSection}>
              <Text style={styles.warningTitle}>Ảnh khuôn mặt đăng ký</Text>
              {!item.profile?.avatarUrl ? (
                <Text style={styles.warningTextDetail}>Chưa có ảnh khuôn mặt</Text>
              ) : (
                <Text style={styles.successTextDetail}>Đã có ảnh khuôn mặt</Text>
              )}
            </View>

            <View style={styles.warningSection}>
              <Text style={styles.warningTitle}>CCCD mặt trước</Text>
              <Text style={styles.warningTextDetail}>Chưa có ảnh CCCD mặt trước</Text>
            </View>
            
            <View style={styles.warningSection}>
              <Text style={styles.warningTitle}>CCCD mặt sau</Text>
              <Text style={styles.warningTextDetail}>Chưa có ảnh CCCD mặt sau</Text>
            </View>

          </View>
          
          <View style={styles.actionButtons}>
            <Pressable 
              style={({ pressed }) => [styles.actionButton, styles.primaryBtn, pressed && styles.pressedBtn]}
              onPress={() => router.push(`./${item.id}/attendance` as any)}
            >
              <Ionicons name="calendar-outline" size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonTextPrimary}>Bảng chấm công</Text>
            </Pressable>

            {canEdit && (
              <Pressable 
                style={({ pressed }) => [styles.actionButton, styles.secondaryBtn, pressed && styles.pressedBtn]}
                onPress={() => setEditing((current) => !current)}
              >
                <Ionicons name="pencil-outline" size={20} color="#4F46E5" />
                <Text style={styles.actionButtonTextSecondary}>{editing ? 'Đóng chỉnh sửa' : 'Chỉnh sửa thông tin'}</Text>
              </Pressable>
            )}
          </View>
        </SectionCard>
        {editing ? (
          <SectionCard title="Chinh sua">
            <Controller control={control} name="fullName" render={({ field }) => <FormField label="Ho ten" value={field.value} onChangeText={field.onChange} error={errors.fullName?.message} />} />
            <Controller control={control} name="phone" render={({ field }) => <FormField label="So dien thoai" value={field.value} onChangeText={field.onChange} error={errors.phone?.message} />} />
            <Controller control={control} name="email" render={({ field }) => <FormField label="Email" value={field.value} onChangeText={field.onChange} error={errors.email?.message} />} />
            
            <Controller 
              control={control} 
              name="departmentId" 
              render={({ field }) => (
                <SelectField 
                  label="Phòng ban" 
                  options={deptOptions} 
                  value={field.value ?? ''} 
                  onSelect={(val) => { field.onChange(val); setValue('positionId', '', { shouldValidate: true }); }} 
                  error={errors.departmentId?.message} 
                />
              )} 
            />
            
            <Controller 
              control={control} 
              name="positionId" 
              render={({ field }) => (
                <SelectField 
                  label="Vị trí làm việc" 
                  options={posOptions} 
                  value={field.value ?? ''} 
                  onSelect={field.onChange} 
                  error={errors.positionId?.message} 
                />
              )} 
            />

            <PrimaryButton onPress={() => void submit()} loading={updateEmployee.isPending}>Luu</PrimaryButton>
          </SectionCard>
        ) : null}
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
  },
  positionOptionSelected: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  titleText: { color: colors.text, fontSize: 17, fontWeight: '800' },
  employeeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
      android: { elevation: 2 },
      web: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardHeaderInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  empName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  empCode: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 2,
  },
  warningText: {
    fontSize: 12,
    color: '#DC2626', // Red
    fontWeight: '500',
    marginTop: 2,
  },
  roleTag: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4F46E5',
  },
  deptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  profileHeader: {
    paddingBottom: 16,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  profileMeta: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  infoGrid: {
    marginBottom: 24,
    gap: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  infoValue: {
    color: '#374151',
  },
  warningSection: {
    marginBottom: 16,
  },
  warningTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  warningTextDetail: {
    fontSize: 14,
    color: '#EF4444',
    fontStyle: 'italic',
  },
  successTextDetail: {
    fontSize: 14,
    color: '#10B981',
  },
  actionButtons: {
    flexDirection: 'column',
    gap: 12,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  primaryBtn: {
    backgroundColor: '#4F46E5',
  },
  secondaryBtn: {
    backgroundColor: '#EEF2FF',
  },
  pressedBtn: {
    opacity: 0.8,
  },
  actionButtonTextPrimary: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  actionButtonTextSecondary: {
    color: '#4F46E5',
    fontSize: 15,
    fontWeight: '600',
  },
});
