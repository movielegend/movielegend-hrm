import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
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
          <PageHeader title="Nhan su" subtitle="Danh sach dung pagination backend, khong fetch toan bo database." />
          <SearchInput value={search} onChangeText={setSearch} placeholder="Tim nhan su" />
          {adminUsers.isLoading ? <LoadingState /> : null}
          {adminUsers.isError ? <ErrorState error={adminUsers.error} onRetry={() => void adminUsers.refetch()} /> : null}
          {!adminUsers.isLoading && !adminUsers.data?.items.length ? <EmptyState title="Chua co nhan vien phu hop bo loc" /> : null}
          {adminUsers.data?.items.map((employee) => (
            <SectionCard key={employee.id}>
              <View style={styles.identityRow}>
                <Avatar name={employee.profile?.fullName} uri={employee.profile?.avatarUrl} />
                <View style={styles.flex}>
                  <Text style={styles.titleText}>{employee.profile?.fullName ?? '-'}</Text>
                  <Text style={styles.meta}>{employee.userCode}</Text>
                </View>
                <StatusBadge label={employee.accountStatus} tone={toneForStatus(employee.accountStatus)} />
              </View>
              <Text style={styles.meta}>Phong ban: {employee.departmentLinks?.map((link) => link.department?.name).filter(Boolean).join(', ') || '-'}</Text>
              <Text style={styles.meta}>Vai tro: {employee.roles?.map((role) => role.role.code).join(', ') || '-'}</Text>
              <SecondaryButton onPress={() => router.push(`./employees/${employee.id}`)}>Chi tiet</SecondaryButton>
            </SectionCard>
          ))}
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
      <ScreenContainer>
        <PageHeader title="Chi tiet nhan su" subtitle="Khong hien thi salary, CCCD day du, bank account hoac document URLs." />
        <SectionCard>
          <View style={styles.identityRow}>
            <Avatar name={item.profile?.fullName} uri={item.profile?.avatarUrl} />
            <View style={styles.flex}>
              <Text style={styles.titleText}>{item.profile?.fullName ?? '-'}</Text>
              <Text style={styles.meta}>{item.userCode}</Text>
            </View>
            <StatusBadge label={item.accountStatus} tone={toneForStatus(item.accountStatus)} />
          </View>
          <Text style={styles.meta}>SDT: {maskPhone(item.phone)}</Text>
          <Text style={styles.meta}>Email: {item.email ?? '-'}</Text>
          <Text style={styles.meta}>CCCD: {maskIdCard(item.profile?.idCardNumber)}</Text>
          <Text style={styles.meta}>Phong ban: {item.departmentLinks?.map((link) => link.department?.name).filter(Boolean).join(', ') || '-'}</Text>
          <Text style={styles.meta}>Vi tri: {item.departmentLinks?.map((link) => link.position?.name).filter(Boolean).join(', ') || item.profile?.position?.name || '-'}</Text>
          <Text style={styles.meta}>Vai tro: {item.roles?.map((role) => role.role.code).join(', ') || '-'}</Text>
          <Text style={styles.meta}>Face status: {item.profile?.avatarUrl ? 'Co avatar' : 'Chua xac dinh'}</Text>
        </SectionCard>
        {canEdit ? <SecondaryButton onPress={() => setEditing((current) => !current)}>{editing ? 'Dong chinh sua' : 'Chinh sua co ban'}</SecondaryButton> : null}
        {editing ? (
          <SectionCard title="Chinh sua">
            <Controller control={control} name="fullName" render={({ field }) => <FormField label="Ho ten" value={field.value} onChangeText={field.onChange} error={errors.fullName?.message} />} />
            <Controller control={control} name="phone" render={({ field }) => <FormField label="So dien thoai" value={field.value} onChangeText={field.onChange} error={errors.phone?.message} />} />
            <Controller control={control} name="email" render={({ field }) => <FormField label="Email" value={field.value} onChangeText={field.onChange} error={errors.email?.message} />} />
            <Controller control={control} name="departmentId" render={({ field }) => <FormField label="departmentId" value={field.value} onChangeText={(value) => { field.onChange(value); setValue('positionId', '', { shouldValidate: true }); }} error={errors.departmentId?.message} />} />
            {positions.isLoading ? <LoadingState label="Dang tai chuc vu" /> : null}
            {positions.isError ? <ErrorState error={positions.error} onRetry={() => void positions.refetch()} /> : null}
            {positions.data?.items.map((position) => (
              <Pressable key={position.id} accessibilityRole="button" onPress={() => setValue('positionId', position.id, { shouldValidate: true })} style={[styles.positionOption, selectedPositionId === position.id && styles.positionOptionSelected]}>
                <Text style={styles.titleText}>{position.name}</Text>
                <Text style={styles.meta}>{position.code}</Text>
              </Pressable>
            ))}
            {errors.positionId ? <Text style={styles.error}>{errors.positionId.message}</Text> : null}
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
});
