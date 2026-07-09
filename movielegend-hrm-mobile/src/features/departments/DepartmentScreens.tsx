import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { Controller, useForm, type Control, type FieldErrors } from 'react-hook-form';
import { RefreshControl, StyleSheet, Text, View, Pressable, Alert, ScrollView } from 'react-native';
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
import { useCreateDepartment, useDepartment, useDepartments, useUpdateDepartment, useDeleteDepartment } from '../../hooks/useDepartments';
import { useBranches } from '../../api/branches.api';
import { usePositions } from '../../hooks/usePositions';
import { useEmployees } from '../../hooks/useEmployees';
import { useAuth } from '../../providers/AuthProvider';
import { colors } from '../../theme/colors';
import type { CreateDepartmentPayload, UpdateDepartmentPayload } from '../../types/department.types';
import { hasPermission } from '../../utils/permissions';
import { normalizeApiError } from '../../utils/api-error';

const createSchema = z.object({
  companyId: z.string().optional(),
  branchId: z.string().min(1, 'Vui lòng chọn chi nhánh'),
  code: z.string().min(2, 'Mã phòng ban không được để trống'),
  name: z.string().min(2, 'Tên phòng ban không được để trống'),
  description: z.string().optional(),
  parentId: z.string().uuid('parentId phải là định dạng UUID').optional().or(z.literal('')),
});

type DepartmentFormValues = z.infer<typeof createSchema>;

export function DepartmentListScreen() {
  const router = useRouter();
  const { branchId } = useLocalSearchParams<{ branchId?: string }>();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const departments = useDepartments({ search });
  const deleteDept = useDeleteDepartment();

  const filteredItems = departments.data?.items.filter(dept => 
    !branchId || dept.branchId === branchId
  );
  
  const canCreate = hasPermission(user, 'department.create');
  const canUpdate = hasPermission(user, 'department.update');
  const canDelete = hasPermission(user, 'department.delete');

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      'Xóa cứng phòng ban',
      `Bạn có chắc chắn muốn xóa phòng ban "${name}" vĩnh viễn khỏi Database?\n(Sẽ không thể xóa nếu phòng ban đang có nhân viên)`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa vĩnh viễn',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDept.mutateAsync(id);
              Alert.alert('Thành công', 'Đã xóa phòng ban');
            } catch (error) {
              const normalized = normalizeApiError(error);
              Alert.alert('Lỗi', normalized.message);
            }
          },
        },
      ]
    );
  };

  return (
    <Screen>
      <ScreenContainer refreshControl={<RefreshControl refreshing={departments.isRefetching} onRefresh={() => void departments.refetch()} />}>
        <PageHeader
          title="Phòng ban"
          subtitle="Sơ đồ tổ chức công ty"
          right={
            canCreate ? (
              <Pressable style={styles.addBtn} onPress={() => router.push(branchId ? `/admin/branches/${branchId}/departments/create` : '/admin/departments/create')}>
                <MaterialCommunityIcons name="plus" size={20} color="#fff" />
                <Text style={styles.addBtnText}>Thêm mới</Text>
              </Pressable>
            ) : undefined
          }
        />
        <SearchInput value={search} onChangeText={setSearch} placeholder="Tìm phòng ban..." />
        
        {departments.isLoading ? <LoadingState /> : null}
        {departments.isError ? <ErrorState error={departments.error} onRetry={() => void departments.refetch()} /> : null}
        {!departments.isLoading && !departments.data?.items.length ? <EmptyState title="Chưa có phòng ban" /> : null}
        
        <View style={styles.list}>
          {filteredItems?.map((department) => (
            <Pressable key={department.id} style={styles.card} onPress={() => router.push(`/admin/branches/${department.branchId || branchId}/departments/${department.id}/employees`)}>
              <View style={styles.cardHeader}>
                <View style={styles.iconBox}>
                  <MaterialCommunityIcons name="office-building-outline" size={24} color={colors.primary} />
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle}>{department.name}</Text>
                  <Text style={styles.cardSubtitle}>Mã: {department.code}</Text>
                </View>
                <StatusBadge 
                  label={department.isActive ? 'Đang hoạt động' : 'Đã ẩn'} 
                  tone={department.isActive ? 'success' : 'neutral'} 
                />
              </View>

              <View style={styles.cardMeta}>
                <MaterialCommunityIcons name="account-tie-outline" size={16} color={colors.muted} />
                <Text style={styles.metaText}>Quản lý: {department.leaderUserId ?? 'Chưa bổ nhiệm'}</Text>
              </View>

              <View style={styles.actions}>
                <Pressable
                  style={[styles.actionBtn, { backgroundColor: '#F0F9FF' }]}
                  onPress={() => router.push(branchId ? `/admin/branches/${branchId}/departments/${department.id}` : `/admin/departments/${department.id}`)}
                >
                  <MaterialCommunityIcons name="eye-outline" size={18} color="#0369A1" />
                  <Text style={[styles.actionText, { color: '#0369A1' }]}>Chi tiết</Text>
                </Pressable>

                {canUpdate ? (
                  <Pressable
                    style={[styles.actionBtn, { backgroundColor: '#FFF7ED' }]}
                    onPress={() => router.push(branchId ? `/admin/branches/${branchId}/departments/${department.id}/edit` : `/admin/departments/edit/${department.id}`)}
                  >
                    <MaterialCommunityIcons name="pencil" size={18} color="#EA580C" />
                    <Text style={[styles.actionText, { color: '#EA580C' }]}>Sửa</Text>
                  </Pressable>
                ) : null}

                {canDelete ? (
                  <Pressable
                    style={[styles.actionBtn, { backgroundColor: '#FEF2F2' }]}
                    onPress={() => handleDelete(department.id, department.name)}
                  >
                    <MaterialCommunityIcons name="delete-outline" size={18} color="#DC2626" />
                    <Text style={[styles.actionText, { color: '#DC2626' }]}>Xóa</Text>
                  </Pressable>
                ) : null}
              </View>
            </Pressable>
          ))}
        </View>
      </ScreenContainer>
    </Screen>
  );
}

export function CreateDepartmentScreen() {
  const router = useRouter();
  const { branchId } = useLocalSearchParams<{ branchId?: string }>();
  const create = useCreateDepartment();
  const { control, handleSubmit, formState: { errors } } = useForm<DepartmentFormValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { companyId: '', branchId: branchId ?? '', code: '', name: '', description: '', parentId: '' },
  });
  const submit = handleSubmit(async (payload) => {
    await create.mutateAsync(buildCreateDepartmentPayload(payload));
    router.back();
  });
  return (
    <Screen>
      <ScreenContainer>
        <PageHeader title="Tạo phòng ban" subtitle="Thêm mới một phòng ban vào hệ thống." />
        <DepartmentForm control={control} errors={errors} fixedBranchId={branchId} />
        {create.error ? <Text style={styles.error}>{normalizeApiError(create.error).message}</Text> : null}
        <PrimaryButton onPress={() => void submit()} loading={create.isPending}>Tạo phòng ban</PrimaryButton>
      </ScreenContainer>
    </Screen>
  );
}

export function DepartmentDetailScreen() {
  const { id, departmentId } = useLocalSearchParams<{ id?: string, departmentId?: string }>();
  const actualId = (id || departmentId) as string;
  const { user } = useAuth();
  const department = useDepartment(actualId);
  const positions = usePositions(actualId);
  const employees = useEmployees({ departmentId: actualId, page: 1, limit: 100 });
  const update = useUpdateDepartment(actualId);
  const [editing, setEditing] = useState(false);
  const canEdit = hasPermission(user, 'department.update');
  const { control, handleSubmit, formState: { errors } } = useForm<DepartmentFormValues>({
    resolver: zodResolver(createSchema),
    values: {
      companyId: department.data?.companyId ?? '',
      branchId: department.data?.branchId ?? '',
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
      <ScreenContainer style={{ paddingBottom: 100 }}>
        <PageHeader title={department.data.name} subtitle={department.data.description || 'Không có mô tả'} />
          
          <SectionCard title="Thông tin chung">
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, alignItems: 'center' }}>
              <Text style={{ fontSize: 14, color: '#98A0A8' }}>Trạng thái</Text>
              <StatusBadge label={department.data.isActive ? 'ĐANG HOẠT ĐỘNG' : 'NGỪNG HOẠT ĐỘNG'} tone={department.data.isActive ? 'success' : 'danger'} />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, alignItems: 'center' }}>
              <Text style={{ fontSize: 14, color: '#98A0A8' }}>Mã phòng ban</Text>
              <Text style={{ fontSize: 15, color: '#0B3B61', fontWeight: '600' }}>{department.data.code}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, alignItems: 'center' }}>
              <Text style={{ fontSize: 14, color: '#98A0A8' }}>Trưởng phòng</Text>
              <Text style={{ fontSize: 15, color: '#0B3B61', fontWeight: '600' }}>{department.data.leaderUserId ? 'Đã phân công' : 'Chưa có'}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 14, color: '#98A0A8' }}>ID Công ty</Text>
              <Text style={{ fontSize: 13, color: '#0B3B61', fontWeight: '500', maxWidth: 200, textAlign: 'right' }} numberOfLines={1} ellipsizeMode="middle">{department.data.companyId}</Text>
            </View>
          </SectionCard>



          <SectionCard title="Danh sách nhân viên">
            {employees.isLoading ? <LoadingState label="Đang tải nhân viên..." /> : null}
            {employees.isError ? <ErrorState error={employees.error} onRetry={() => void employees.refetch()} /> : null}
            
            <View style={{ gap: 8 }}>
              {employees.data?.items.map((emp) => (
                <View key={emp.id} style={{ flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#F8FAFC', borderRadius: 8, borderWidth: 1, borderColor: '#E6EEF3' }}>
                  <Avatar name={emp.profile?.fullName} uri={emp.profile?.avatarUrl} size={40} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: '#0B3B61' }}>{emp.profile?.fullName ?? emp.phone}</Text>
                    <Text style={{ fontSize: 13, color: '#98A0A8', marginTop: 2 }}>{emp.userCode} - {emp.roles?.some(r => r.role.code === 'LEADER') ? 'Quản lý' : (emp.profile?.position?.name || 'Nhân viên')}</Text>
                  </View>
                  <StatusBadge label={emp.accountStatus} tone={toneForStatus(emp.accountStatus)} />
                </View>
              ))}
            </View>

            {!employees.isLoading && !employees.data?.items.length ? (
              <Text style={{ color: '#98A0A8', fontStyle: 'italic', textAlign: 'center', marginVertical: 12 }}>Chưa có nhân viên nào thuộc phòng ban này.</Text>
            ) : null}
          </SectionCard>

          {canEdit ? (
            <SecondaryButton onPress={() => setEditing((current) => !current)} style={{ marginBottom: 16 }}>
              {editing ? 'Đóng chỉnh sửa' : 'Chỉnh sửa thông tin'}
            </SecondaryButton>
          ) : null}

          {editing ? (
            <SectionCard title="Cập nhật thông tin">
              <DepartmentForm control={control} errors={errors} fixedBranchId={department.data.branchId} />
              {update.error ? <Text style={styles.error}>{normalizeApiError(update.error).message}</Text> : null}
              <PrimaryButton onPress={() => void submit()} loading={update.isPending} style={{ marginTop: 16 }}>
                Lưu thay đổi
              </PrimaryButton>
            </SectionCard>
          ) : null}
        </ScreenContainer>
    </Screen>
  );
}

function DepartmentForm({ control, errors, fixedBranchId }: { control: Control<DepartmentFormValues>; errors: FieldErrors<DepartmentFormValues>; fixedBranchId?: string }) {
  const branches = useBranches();
  const displayBranches = fixedBranchId ? branches.data?.filter(b => b.id === fixedBranchId) : branches.data;
  
  return (
    <>
      <Text style={{ fontSize: 13, fontWeight: '600', color: '#0B3B61', marginBottom: 8, marginTop: 16 }}>{fixedBranchId ? 'Chi nhánh trực thuộc' : 'Chọn chi nhánh *'}</Text>
      {branches.isLoading ? <LoadingState /> : null}
      <Controller
        control={control}
        name="branchId"
        render={({ field }) => (
          <View style={{ gap: 8, marginBottom: 16 }}>
            {displayBranches?.map(branch => (
              <Pressable 
                key={branch.id} 
                onPress={() => !fixedBranchId && field.onChange(branch.id)}
                style={{
                  padding: 12,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: field.value === branch.id ? colors.primary : '#E6EEF3',
                  backgroundColor: field.value === branch.id ? 'rgba(30,136,229,0.1)' : '#fff'
                }}
              >
                <Text style={{ 
                  color: field.value === branch.id ? colors.primary : '#0B3B61',
                  fontWeight: field.value === branch.id ? '700' : '500'
                }}>
                  {branch.name}
                </Text>
              </Pressable>
            ))}
            {errors.branchId && <Text style={{ color: colors.danger, fontSize: 12 }}>{errors.branchId.message}</Text>}
          </View>
        )}
      />

      <Controller control={control} name="code" render={({ field }) => <FormField autoCapitalize="characters" label="Mã phòng ban (Ví dụ: IT, HR...)" value={field.value} onChangeText={field.onChange} error={errors.code?.message} />} />
      <Controller control={control} name="name" render={({ field }) => <FormField label="Tên phòng ban" value={field.value} onChangeText={field.onChange} error={errors.name?.message} />} />
      <Controller control={control} name="description" render={({ field }) => <FormField label="Mô tả" value={field.value} onChangeText={field.onChange} error={errors.description?.message} />} />
      <Controller control={control} name="parentId" render={({ field }) => <FormField label="ID Phòng ban quản lý (Tùy chọn)" value={field.value} onChangeText={field.onChange} error={errors.parentId?.message} />} />
    </>
  );
}

function buildCreateDepartmentPayload(payload: DepartmentFormValues): CreateDepartmentPayload {
  return {
    branchId: payload.branchId,
    code: payload.code,
    name: payload.name,
    ...(payload.description ? { description: payload.description } : {}),
    ...(payload.parentId ? { parentId: payload.parentId } : {}),
  };
}

function buildUpdateDepartmentPayload(payload: DepartmentFormValues): UpdateDepartmentPayload {
  return {
    branchId: payload.branchId,
    code: payload.code,
    name: payload.name,
    ...(payload.description ? { description: payload.description } : {}),
    ...(payload.parentId ? { parentId: payload.parentId } : {}),
  };
}

export function EditDepartmentScreen() {
  const router = useRouter();
  const { id, departmentId } = useLocalSearchParams<{ id?: string, departmentId?: string }>();
  const actualId = (id || departmentId) as string;
  const department = useDepartment(actualId);
  const update = useUpdateDepartment(actualId);
  
  const { control, handleSubmit, formState: { errors }, reset } = useForm<DepartmentFormValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { companyId: '', branchId: '', code: '', name: '', description: '', parentId: '' },
  });

  useEffect(() => {
    if (department.data) {
      reset({
        companyId: department.data.companyId,
        branchId: department.data.branchId,
        code: department.data.code,
        name: department.data.name,
        description: department.data.description ?? '',
        parentId: department.data.parentId ?? '',
      });
    }
  }, [department.data, reset]);

  const submit = handleSubmit(async (payload) => {
    try {
      await update.mutateAsync(buildUpdateDepartmentPayload(payload));
      Alert.alert('Thành công', 'Đã cập nhật phòng ban');
      router.back();
    } catch (error) {
      const normalized = normalizeApiError(error);
      Alert.alert('Lỗi', normalized.message);
    }
  });

  if (department.isLoading) return <LoadingState />;
  if (department.isError) return <ErrorState error={department.error} onRetry={() => void department.refetch()} />;
  if (!department.data) return <EmptyState title="Không tìm thấy phòng ban" />;

  return (
    <Screen>
      <ScreenContainer>
        <PageHeader title="Cập nhật Phòng ban" subtitle={`Đang sửa: ${department.data.name}`} />
        <SectionCard>
          <DepartmentForm control={control} errors={errors} fixedBranchId={department.data.branchId} />
          <View style={{ marginTop: 16 }}>
            <PrimaryButton onPress={() => void submit()} loading={update.isPending}>
              Lưu Thay Đổi
            </PrimaryButton>
          </View>
        </SectionCard>
      </ScreenContainer>
    </Screen>
  );
}

const styles = StyleSheet.create({
  error: { color: colors.danger },
  meta: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  title: { color: colors.text, fontSize: 17, fontWeight: '800' },
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  cardSubtitle: {
    fontSize: 13,
    color: colors.muted,
    marginTop: 2,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
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
});
