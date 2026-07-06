import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm, type Control, type FieldErrors } from 'react-hook-form';
import { RefreshControl, StyleSheet, Text } from 'react-native';
import { z } from 'zod';
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
import { useCreateDepartment, useDepartment, useDepartments, useUpdateDepartment } from '../../hooks/useDepartments';
import { usePositions } from '../../hooks/usePositions';
import { useAuth } from '../../providers/AuthProvider';
import { colors } from '../../theme/colors';
import type { CreateDepartmentPayload, UpdateDepartmentPayload } from '../../types/department.types';
import { hasPermission } from '../../utils/permissions';

const createSchema = z.object({
  companyId: z.string().uuid('companyId is required'),
  code: z.string().min(2, 'Code is required'),
  name: z.string().min(2, 'Name is required'),
  description: z.string().optional(),
  parentId: z.string().uuid('parentId must be UUID').optional().or(z.literal('')),
});

type DepartmentFormValues = z.infer<typeof createSchema>;

export function DepartmentListScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const departments = useDepartments({ search });
  const canCreate = hasPermission(user, 'department.create');
  return (
    <Screen>
      <ScreenContainer refreshControl={<RefreshControl refreshing={departments.isRefetching} onRefresh={() => void departments.refetch()} />}>
        <PageHeader
          title="Phong ban"
          subtitle="Danh sach phong ban lay tu backend."
          right={canCreate ? <SecondaryButton onPress={() => router.push('./departments/create')}>Tao</SecondaryButton> : undefined}
        />
        <SearchInput value={search} onChangeText={setSearch} placeholder="Tim phong ban" />
        {departments.isLoading ? <LoadingState /> : null}
        {departments.isError ? <ErrorState error={departments.error} onRetry={() => void departments.refetch()} /> : null}
        {!departments.isLoading && !departments.data?.items.length ? <EmptyState title="Chua co phong ban" /> : null}
        {departments.data?.items.map((department) => (
          <SectionCard key={department.id}>
            <Text style={styles.title}>{department.name}</Text>
            <Text style={styles.meta}>Ma: {department.code}</Text>
            <Text style={styles.meta}>Leader: {department.leaderUserId ?? '-'}</Text>
            <StatusBadge label={department.isActive ? 'ACTIVE' : 'INACTIVE'} tone={toneForStatus(department.isActive ? 'ACTIVE' : 'SUSPENDED')} />
            <SecondaryButton onPress={() => router.push(`./departments/${department.id}`)}>Chi tiet</SecondaryButton>
          </SectionCard>
        ))}
      </ScreenContainer>
    </Screen>
  );
}

export function CreateDepartmentScreen() {
  const router = useRouter();
  const create = useCreateDepartment();
  const { control, handleSubmit, formState: { errors } } = useForm<DepartmentFormValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { companyId: '', code: '', name: '', description: '', parentId: '' },
  });
  const submit = handleSubmit(async (payload) => {
    await create.mutateAsync(buildCreateDepartmentPayload(payload));
    router.back();
  });
  return (
    <Screen>
      <ScreenContainer>
        <PageHeader title="Tao phong ban" subtitle="companyId bat buoc theo backend DTO, khong hard-code tu frontend." />
        <DepartmentForm control={control} errors={errors} />
        {create.error ? <Text style={styles.error}>Khong the tao phong ban</Text> : null}
        <PrimaryButton onPress={() => void submit()} loading={create.isPending}>Tao phong ban</PrimaryButton>
      </ScreenContainer>
    </Screen>
  );
}

export function DepartmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const department = useDepartment(id);
  const positions = usePositions(id);
  const update = useUpdateDepartment(id);
  const [editing, setEditing] = useState(false);
  const canEdit = hasPermission(user, 'department.update');
  const { control, handleSubmit, formState: { errors } } = useForm<DepartmentFormValues>({
    resolver: zodResolver(createSchema),
    values: {
      companyId: department.data?.companyId ?? '',
      code: department.data?.code ?? '',
      name: department.data?.name ?? '',
      description: department.data?.description ?? '',
      parentId: department.data?.parentId ?? '',
    },
  });
  if (department.isLoading) return <LoadingState />;
  if (department.isError) return <ErrorState error={department.error} onRetry={() => void department.refetch()} />;
  if (!department.data) return <EmptyState title="Khong tim thay phong ban" />;
  const submit = handleSubmit(async (payload) => {
    await update.mutateAsync(buildUpdateDepartmentPayload(payload));
    setEditing(false);
  });
  return (
    <Screen>
      <ScreenContainer>
        <PageHeader title={department.data.name} subtitle={department.data.description ?? department.data.code} />
        <SectionCard>
          <Text style={styles.meta}>Ma: {department.data.code}</Text>
          <Text style={styles.meta}>Company: {department.data.companyId}</Text>
          <Text style={styles.meta}>Leader: {department.data.leaderUserId ?? '-'}</Text>
          <StatusBadge label={department.data.isActive ? 'ACTIVE' : 'INACTIVE'} tone={toneForStatus(department.data.isActive ? 'ACTIVE' : 'SUSPENDED')} />
        </SectionCard>
        <SectionCard title="Positions">
          {positions.isLoading ? <LoadingState label="Dang tai chuc vu" /> : null}
          {positions.isError ? <ErrorState error={positions.error} onRetry={() => void positions.refetch()} /> : null}
          {positions.data?.items.map((position) => (
            <Text key={position.id} style={styles.meta}>{position.code} - {position.name}</Text>
          ))}
          {!positions.isLoading && !positions.data?.items.length ? <Text style={styles.meta}>Chua co chuc vu</Text> : null}
        </SectionCard>
        {canEdit ? <SecondaryButton onPress={() => setEditing((current) => !current)}>{editing ? 'Dong chinh sua' : 'Chinh sua'}</SecondaryButton> : null}
        {editing ? (
          <SectionCard title="Cap nhat">
            <DepartmentForm control={control} errors={errors} />
            <PrimaryButton onPress={() => void submit()} loading={update.isPending}>Luu</PrimaryButton>
          </SectionCard>
        ) : null}
      </ScreenContainer>
    </Screen>
  );
}

function DepartmentForm({ control, errors }: { control: Control<DepartmentFormValues>; errors: FieldErrors<DepartmentFormValues> }) {
  return (
    <>
      <Controller control={control} name="companyId" render={({ field }) => <FormField label="companyId" value={field.value} onChangeText={field.onChange} error={errors.companyId?.message} />} />
      <Controller control={control} name="code" render={({ field }) => <FormField autoCapitalize="characters" label="Ma phong ban" value={field.value} onChangeText={field.onChange} error={errors.code?.message} />} />
      <Controller control={control} name="name" render={({ field }) => <FormField label="Ten phong ban" value={field.value} onChangeText={field.onChange} error={errors.name?.message} />} />
      <Controller control={control} name="description" render={({ field }) => <FormField label="Mo ta" value={field.value} onChangeText={field.onChange} error={errors.description?.message} />} />
      <Controller control={control} name="parentId" render={({ field }) => <FormField label="parentId" value={field.value} onChangeText={field.onChange} error={errors.parentId?.message} />} />
    </>
  );
}

function buildCreateDepartmentPayload(payload: DepartmentFormValues): CreateDepartmentPayload {
  return {
    companyId: payload.companyId,
    code: payload.code,
    name: payload.name,
    ...(payload.description ? { description: payload.description } : {}),
    ...(payload.parentId ? { parentId: payload.parentId } : {}),
  };
}

function buildUpdateDepartmentPayload(payload: DepartmentFormValues): UpdateDepartmentPayload {
  return {
    companyId: payload.companyId,
    code: payload.code,
    name: payload.name,
    ...(payload.description ? { description: payload.description } : {}),
    ...(payload.parentId ? { parentId: payload.parentId } : {}),
  };
}

const styles = StyleSheet.create({
  error: { color: colors.danger },
  meta: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  title: { color: colors.text, fontSize: 17, fontWeight: '800' },
});
