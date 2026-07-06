import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { FormField } from '../../components/FormField';
import { LoadingState } from '../../components/LoadingState';
import { PageHeader } from '../../components/PageHeader';
import { PrimaryButton, SecondaryButton } from '../../components/Buttons';
import { Screen } from '../../components/Screen';
import { ScreenContainer } from '../../components/ScreenContainer';
import { SectionCard } from '../../components/SectionCard';
import { useDepartments } from '../../hooks/useDepartments';
import { useEmployees } from '../../hooks/useEmployees';
import { useAddTaskGroupMember, useCreateTaskGroup, useRemoveTaskGroupMember, useTaskGroup, useTaskGroups } from '../../hooks/useTaskGroups';
import { useAuth } from '../../providers/AuthProvider';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { normalizeApiError } from '../../utils/api-error';
import { hasPermission } from '../../utils/permissions';

type GroupArea = 'leader' | 'admin';

export function TaskGroupListScreen({ area }: { area: GroupArea }) {
  const router = useRouter();
  const groups = useTaskGroups({ page: 1, limit: 50 });
  return (
    <Screen>
      <ScreenContainer refreshControl={<RefreshControl refreshing={groups.isRefetching} onRefresh={() => void groups.refetch()} />}>
        <PageHeader title="Task Groups" subtitle="Group list dung /task-groups va scope backend." />
        <PrimaryButton onPress={() => router.push(`/${area}/task-groups/create`)}>Tao group</PrimaryButton>
        {groups.isLoading ? <LoadingState /> : null}
        {groups.isError ? <ErrorState error={groups.error} onRetry={() => void groups.refetch()} /> : null}
        {groups.data?.items.map((group) => (
          <SectionCard key={group.id}>
            <Text style={styles.title}>{group.name}</Text>
            <Text style={styles.meta}>{group.department?.name ?? group.departmentId}</Text>
            <Text style={styles.meta}>{group.members?.length ?? 0} members</Text>
            <SecondaryButton onPress={() => router.push(`/${area}/task-groups/${group.id}`)}>Chi tiet</SecondaryButton>
          </SectionCard>
        ))}
        {!groups.data?.items.length ? <EmptyState title="Chua co task group" /> : null}
      </ScreenContainer>
    </Screen>
  );
}

export function CreateTaskGroupScreen() {
  const [departmentId, setDepartmentId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const router = useRouter();
  const departments = useDepartments({ page: 1, limit: 50 });
  const mutation = useCreateTaskGroup();

  async function submit() {
    try {
      await mutation.mutateAsync({ departmentId, name, description });
      Alert.alert('Thanh cong', 'Da tao task group');
      router.back();
    } catch (error) {
      const normalized = normalizeApiError(error);
      Alert.alert(normalized.code, normalized.message);
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <PageHeader title="Tao Task Group" subtitle="Leader/Admin tao group theo department scope backend." />
        <SectionCard>
          <FormField label="Department ID" value={departmentId} onChangeText={setDepartmentId} autoCapitalize="none" />
          {departments.data?.items.map((department) => (
            <SecondaryButton key={department.id} onPress={() => setDepartmentId(department.id)}>{department.name}</SecondaryButton>
          ))}
          <FormField label="Name" value={name} onChangeText={setName} />
          <FormField label="Description" value={description} onChangeText={setDescription} multiline />
          <PrimaryButton disabled={!departmentId || name.trim().length < 2} loading={mutation.isPending} onPress={() => void submit()}>Tao group</PrimaryButton>
        </SectionCard>
      </ScrollView>
    </Screen>
  );
}

export function TaskGroupDetailScreen({ area }: { area: GroupArea }) {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const group = useTaskGroup(id);
  const addMember = useAddTaskGroupMember(id ?? '');
  const removeMember = useRemoveTaskGroupMember(id ?? '');
  const canReadUsers = hasPermission(user, 'user.read');
  const users = useEmployees({ page: 1, limit: 30 }, canReadUsers);

  async function add(userId: string) {
    try {
      await addMember.mutateAsync({ userId });
      Alert.alert('Thanh cong', 'Da them member');
    } catch (error) {
      const normalized = normalizeApiError(error);
      Alert.alert(normalized.code, normalized.message);
    }
  }

  async function remove(userId: string) {
    try {
      await removeMember.mutateAsync(userId);
      Alert.alert('Thanh cong', 'Da xoa member');
    } catch (error) {
      const normalized = normalizeApiError(error);
      Alert.alert(normalized.code, normalized.message);
    }
  }

  if (group.isLoading) return <LoadingState />;
  if (group.isError) return <ErrorState error={group.error} onRetry={() => void group.refetch()} />;
  if (!group.data) return <EmptyState title="Khong tim thay group" />;
  const item = group.data;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <PageHeader title={item.name} subtitle="Detail dung GET /task-groups/:id." />
        <SectionCard>
          <Text style={styles.meta}>Department: {item.department?.name ?? item.departmentId}</Text>
          <Text style={styles.meta}>{item.description ?? 'Khong co mo ta'}</Text>
        </SectionCard>
        <SectionCard title="Members">
          {item.members?.map((member) => (
            <View key={member.id} style={styles.row}>
              <Text style={styles.meta}>{member.user?.profile?.fullName ?? member.userId}</Text>
              <SecondaryButton loading={removeMember.isPending} onPress={() => void remove(member.userId)}>Remove</SecondaryButton>
            </View>
          ))}
          {!item.members?.length ? <Text style={styles.meta}>Chua co member</Text> : null}
        </SectionCard>
        <SectionCard title="Add Member">
          {area === 'leader' && !canReadUsers ? <Text style={styles.warning}>Backend chua expose scoped employee ID list cho Leader add member.</Text> : null}
          {canReadUsers
            ? users.data?.items.map((employee) => (
                <SecondaryButton key={employee.id} loading={addMember.isPending} onPress={() => void add(employee.id)}>
                  {employee.profile?.fullName ?? employee.userCode}
                </SecondaryButton>
              ))
            : null}
        </SectionCard>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    padding: spacing.lg,
  },
  meta: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  title: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
  },
  warning: {
    color: colors.warning,
    fontSize: 13,
    fontWeight: '700',
  },
});
