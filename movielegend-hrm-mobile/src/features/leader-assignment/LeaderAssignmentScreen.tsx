import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, Text } from 'react-native';
import { z } from 'zod';
import { ErrorState } from '../../components/ErrorState';
import { FormField } from '../../components/FormField';
import { PageHeader } from '../../components/PageHeader';
import { PrimaryButton } from '../../components/Buttons';
import { Screen } from '../../components/Screen';
import { ScreenContainer } from '../../components/ScreenContainer';
import { SectionCard } from '../../components/SectionCard';
import { useAssignLeader } from '../../hooks/useLeaderAssignment';
import { useAuth } from '../../providers/AuthProvider';
import { colors } from '../../theme/colors';
import { hasPermission } from '../../utils/permissions';

const schema = z.object({
  userId: z.string().uuid('userId phải là UUID'),
  departmentId: z.string().uuid('departmentId phải là UUID'),
});

export function LeaderAssignmentScreen() {
  const { user } = useAuth();
  const assign = useAssignLeader();
  const allowed = hasPermission(user, 'role.assign');
  const { control, handleSubmit, formState: { errors } } = useForm<{ userId: string; departmentId: string }>({
    resolver: zodResolver(schema),
    defaultValues: { userId: '', departmentId: '' },
  });
  const submit = handleSubmit((payload) => assign.mutate({ ...payload, primary: true }));
  return (
    <Screen>
      <ScreenContainer>
        <PageHeader title="Gán Leader" subtitle="Nhập userId và departmentId từ backend. Không hard-code nhân sự hoặc phòng ban." />
        {!allowed ? <ErrorState error={{ message: 'Bạn không có quyền gán Leader' }} /> : null}
        {allowed ? (
          <SectionCard>
            <Controller control={control} name="userId" render={({ field }) => <FormField label="userId" value={field.value} onChangeText={field.onChange} error={errors.userId?.message} />} />
            <Controller control={control} name="departmentId" render={({ field }) => <FormField label="departmentId" value={field.value} onChangeText={field.onChange} error={errors.departmentId?.message} />} />
            {assign.error ? <Text style={styles.error}>Không thể gán Leader</Text> : null}
            <PrimaryButton onPress={() => void submit()} loading={assign.isPending}>Gán Leader</PrimaryButton>
          </SectionCard>
        ) : null}
      </ScreenContainer>
    </Screen>
  );
}

const styles = StyleSheet.create({
  error: { color: colors.danger },
});
