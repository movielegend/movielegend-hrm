import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, Text, View, Pressable, Alert } from 'react-native';
import { z } from 'zod';
import { useRouter } from 'expo-router';
import { ErrorState } from '../../components/ErrorState';
import { FormField } from '../../components/FormField';
import { PageHeader } from '../../components/PageHeader';
import { PrimaryButton } from '../../components/Buttons';
import { Screen } from '../../components/Screen';
import { ScreenContainer } from '../../components/ScreenContainer';
import { SectionCard } from '../../components/SectionCard';
import { useAssignLeader } from '../../hooks/useLeaderAssignment';
import { useDepartments } from '../../hooks/useDepartments';
import { useEmployees } from '../../hooks/useEmployees';
import { useAuth } from '../../providers/AuthProvider';
import { colors } from '../../theme/colors';
import { hasPermission } from '../../utils/permissions';
import { normalizeApiError } from '../../utils/api-error';

const schema = z.object({
  userId: z.string().uuid('userId phải là UUID'),
  departmentId: z.string().uuid('departmentId phải là UUID'),
});

export function LeaderAssignmentScreen() {
  const { user } = useAuth();
  const assign = useAssignLeader();
  const allowed = hasPermission(user, 'role.assign');
  
  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<{ userId: string; departmentId: string }>({
    resolver: zodResolver(schema),
    defaultValues: { userId: '', departmentId: '' },
  });

  const selectedDepartmentId = watch('departmentId');
  const selectedUserId = watch('userId');

  const departments = useDepartments();
  const filters: any = { limit: 100 };
  if (selectedDepartmentId) filters.departmentId = selectedDepartmentId;

  const employees = useEmployees(filters, !!selectedDepartmentId);

  const router = useRouter();

  const submit = handleSubmit(async (payload) => {
    try {
      await assign.mutateAsync({ ...payload, primary: true });
      Alert.alert('Thành công', 'Đã gán chức vụ Quản lý thành công!');
      router.back();
    } catch (error: any) {
      const apiError = normalizeApiError(error);
      Alert.alert('Lỗi', apiError.message);
    }
  });

  return (
    <Screen>
      <ScreenContainer>
        <PageHeader title="Gán Leader" subtitle="Chọn phòng ban và nhân viên để gán chức vụ quản lý." />
        {!allowed ? <ErrorState error={{ message: 'Bạn không có quyền gán Leader' }} /> : null}
        {allowed ? (
          <SectionCard>
            <View style={{ marginBottom: 16 }}>
              <Text style={[styles.sectionTitle, { marginBottom: 8 }]}>1. Chọn phòng ban</Text>
              {departments.isLoading ? <Text style={styles.meta}>Đang tải phòng ban...</Text> : null}
              {departments.data?.items.map((dept) => (
                <Pressable key={dept.id} accessibilityRole="button" onPress={() => { setValue('departmentId', dept.id, { shouldValidate: true }); setValue('userId', '', { shouldValidate: true }); }} style={[styles.option, selectedDepartmentId === dept.id && styles.optionSelected]}>
                  <Text style={styles.titleText}>{dept.name}</Text>
                  <Text style={styles.meta}>{dept.code}</Text>
                </Pressable>
              ))}
              {errors.departmentId ? <Text style={styles.error}>{errors.departmentId.message}</Text> : null}
            </View>

            {selectedDepartmentId && (
              <View style={{ marginBottom: 24 }}>
                <Text style={[styles.sectionTitle, { marginBottom: 8 }]}>2. Chọn nhân viên làm Leader</Text>
                {employees.isLoading ? <Text style={styles.meta}>Đang tải nhân viên...</Text> : null}
                {!employees.isLoading && !employees.data?.items.length ? (
                  <Text style={styles.meta}>Phòng ban này chưa có nhân viên nào.</Text>
                ) : null}
                {employees.data?.items.map((emp) => {
                  const isCurrentLeader = departments.data?.items.find(d => d.id === selectedDepartmentId)?.leaderUserId === emp.id;
                  
                  return (
                  <Pressable key={emp.id} accessibilityRole="button" onPress={() => setValue('userId', emp.id, { shouldValidate: true })} style={[styles.option, selectedUserId === emp.id && styles.optionSelected]}>
                    <Text style={styles.titleText}>
                      {emp.profile?.fullName || emp.phone} {isCurrentLeader ? '(Quản lý hiện tại)' : ''}
                    </Text>
                    <Text style={[styles.meta, isCurrentLeader && { color: colors.primary, fontWeight: '600' }]}>
                      {emp.userCode} - {isCurrentLeader ? 'Quản lý (Leader)' : (emp.profile?.position?.name || 'Chưa có chức vụ')}
                    </Text>
                  </Pressable>
                )})}
                {errors.userId ? <Text style={styles.error}>{errors.userId.message}</Text> : null}
              </View>
            )}

            {assign.error ? <Text style={styles.error}>Không thể gán Leader</Text> : null}
            <PrimaryButton onPress={() => void submit()} loading={assign.isPending} disabled={!selectedDepartmentId || !selectedUserId}>Gán Leader</PrimaryButton>
          </SectionCard>
        ) : null}
      </ScreenContainer>
    </Screen>
  );
}

const styles = StyleSheet.create({
  error: { color: colors.danger, marginTop: 4 },
  sectionTitle: { color: colors.text, fontSize: 15, fontWeight: '700' },
  meta: { color: colors.muted, fontSize: 13, marginTop: 2 },
  option: {
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
  },
  optionSelected: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: '#EEF2FF',
  },
  titleText: { color: colors.text, fontSize: 15, fontWeight: '600' },
});
