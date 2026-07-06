import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
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
import { StatusBadge, toneForStatus } from '../../components/StatusBadge';
import { useCrossDepartmentAction, useCreateCrossDepartmentRequest, useCrossDepartmentRequest, useCrossDepartmentRequests } from '../../hooks/useCrossDepartment';
import { useDepartments } from '../../hooks/useDepartments';
import { useAuth } from '../../providers/AuthProvider';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import type { CrossDepartmentRequestDto } from '../../types/cross-department.types';
import { normalizeApiError } from '../../utils/api-error';
import { formatDateTime } from '../../utils/date-time';
import { hasAnyPermission } from '../../utils/permissions';

type CrossArea = 'employee' | 'leader' | 'admin';

export function CrossDepartmentListScreen({ area, mode = 'all' }: { area: CrossArea; mode?: 'all' | 'incoming' }) {
  const router = useRouter();
  const list = useCrossDepartmentRequests({ page: 1, limit: 50 });
  return (
    <Screen>
      <ScreenContainer refreshControl={<RefreshControl refreshing={list.isRefetching} onRefresh={() => void list.refetch()} />}>
        <PageHeader title={mode === 'incoming' ? 'Incoming Cross Department' : 'Cross Department'} subtitle="List dung /cross-department-requests va scope backend." />
        {area === 'employee' ? <PrimaryButton onPress={() => router.push('/employee/cross-department/create')}>Tao request</PrimaryButton> : null}
        {area === 'leader' ? <SecondaryButton onPress={() => router.push('/leader/cross-department/incoming')}>Incoming queue</SecondaryButton> : null}
        {list.isLoading ? <LoadingState /> : null}
        {list.isError ? <ErrorState error={list.error} onRetry={() => void list.refetch()} /> : null}
        {list.data?.items.map((request) => (
          <CrossDepartmentCard key={request.id} request={request} onPress={() => router.push(`/${area}/cross-department/${request.id}`)} />
        ))}
        {!list.data?.items.length ? <EmptyState title="Chua co request lien phong ban" /> : null}
      </ScreenContainer>
    </Screen>
  );
}

export function CreateCrossDepartmentScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const departments = useDepartments({ page: 1, limit: 50 });
  const mutation = useCreateCrossDepartmentRequest();
  const [sourceDepartmentId, setSourceDepartmentId] = useState(user?.department?.id ?? '');
  const [targetDepartmentId, setTargetDepartmentId] = useState('');
  const [taskId, setTaskId] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  async function submit() {
    try {
      await mutation.mutateAsync({
        sourceDepartmentId,
        targetDepartmentId,
        ...(taskId ? { taskId } : {}),
        title,
        content,
      });
      Alert.alert('Thanh cong', 'Da tao cross-department request');
      router.back();
    } catch (error) {
      const normalized = normalizeApiError(error);
      Alert.alert(normalized.code, normalized.message);
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <PageHeader title="Tao lien phong ban" subtitle="Employee tao request, khong assign truc tiep nhan vien phong khac." />
        <SectionCard>
          <FormField label="Source department ID" value={sourceDepartmentId} onChangeText={setSourceDepartmentId} autoCapitalize="none" />
          <FormField label="Target department ID" value={targetDepartmentId} onChangeText={setTargetDepartmentId} autoCapitalize="none" />
          {departments.data?.items.map((department) => (
            <SecondaryButton key={department.id} onPress={() => setTargetDepartmentId(department.id)}>{department.name}</SecondaryButton>
          ))}
          <FormField label="Linked task ID optional" value={taskId} onChangeText={setTaskId} autoCapitalize="none" />
          <FormField label="Title" value={title} onChangeText={setTitle} />
          <FormField label="Content" value={content} onChangeText={setContent} multiline />
          <PrimaryButton
            loading={mutation.isPending}
            disabled={!sourceDepartmentId || !targetDepartmentId || title.trim().length < 3 || content.trim().length < 3}
            onPress={() => void submit()}
          >
            Gui request
          </PrimaryButton>
        </SectionCard>
      </ScrollView>
    </Screen>
  );
}

export function CrossDepartmentDetailScreen({ area }: { area: CrossArea }) {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const request = useCrossDepartmentRequest(id);
  const action = useCrossDepartmentAction();
  const [reason, setReason] = useState('');
  const canSource = hasAnyPermission(user, ['cross_department.source_approve', 'cross_department.read_all']);
  const canTarget = hasAnyPermission(user, ['cross_department.target_receive', 'cross_department.read_all']);

  async function run(next: 'source-approve' | 'source-reject' | 'target-accept' | 'target-reject') {
    if ((next === 'source-reject' || next === 'target-reject') && reason.trim().length < 3) {
      Alert.alert('Thieu ly do', 'Can nhap ly do tu choi.');
      return;
    }
    try {
      await action.mutateAsync({ id: id ?? '', action: next, payload: { reason } });
      Alert.alert('Thanh cong', 'Da cap nhat request');
    } catch (error) {
      const normalized = normalizeApiError(error);
      Alert.alert(normalized.code, normalized.message);
    }
  }

  if (request.isLoading) return <LoadingState />;
  if (request.isError) return <ErrorState error={request.error} onRetry={() => void request.refetch()} />;
  if (!request.data) return <EmptyState title="Khong tim thay request" />;
  const item = request.data;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <PageHeader title={item.title} subtitle={item.requestCode ?? item.id} />
        <SectionCard>
          <StatusBadge label={item.status} tone={toneForStatus(item.status)} />
          <Text style={styles.body}>{item.content}</Text>
          <Text style={styles.meta}>Source: {item.sourceDepartmentId}</Text>
          <Text style={styles.meta}>Target: {item.targetDepartmentId}</Text>
          <Text style={styles.meta}>Created: {formatDateTime(item.createdAt)}</Text>
          {item.rejectionReason ? <Text style={styles.warning}>Rejected: {item.rejectionReason}</Text> : null}
        </SectionCard>
        <CrossDepartmentTimeline request={item} />
        {area !== 'employee' ? (
          <SectionCard title="Actions">
            <FormField label="Reject reason" value={reason} onChangeText={setReason} multiline />
            {canSource && item.status === 'PENDING_SOURCE_APPROVAL' ? (
              <View style={styles.actions}>
                <PrimaryButton loading={action.isPending} onPress={() => void run('source-approve')}>Source approve</PrimaryButton>
                <SecondaryButton loading={action.isPending} onPress={() => void run('source-reject')}>Source reject</SecondaryButton>
              </View>
            ) : null}
            {canTarget && item.status === 'SOURCE_APPROVED' ? (
              <View style={styles.actions}>
                <PrimaryButton loading={action.isPending} onPress={() => void run('target-accept')}>Target accept</PrimaryButton>
                <SecondaryButton loading={action.isPending} onPress={() => void run('target-reject')}>Target reject</SecondaryButton>
              </View>
            ) : null}
          </SectionCard>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

export function CrossDepartmentTimeline({ request }: { request: CrossDepartmentRequestDto }) {
  const steps = ['PENDING_SOURCE_APPROVAL', 'SOURCE_APPROVED', 'TARGET_ACCEPTED'];
  return (
    <SectionCard title="Timeline">
      {steps.map((step) => (
        <View key={step} style={styles.timelineItem}>
          <Text style={styles.body}>{step}</Text>
          <Text style={styles.meta}>{request.status === step ? 'Current' : 'State marker'}</Text>
        </View>
      ))}
    </SectionCard>
  );
}

function CrossDepartmentCard({ request, onPress }: { request: CrossDepartmentRequestDto; onPress: () => void }) {
  return (
    <SectionCard>
      <Text style={styles.title}>{request.title}</Text>
      <StatusBadge label={request.status} tone={toneForStatus(request.status)} />
      <Text style={styles.meta}>{request.requestCode ?? request.id}</Text>
      <SecondaryButton onPress={onPress}>Chi tiet</SecondaryButton>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: spacing.sm,
  },
  body: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  content: {
    gap: spacing.lg,
    padding: spacing.lg,
  },
  meta: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  timelineItem: {
    borderLeftColor: colors.primary,
    borderLeftWidth: 3,
    gap: spacing.xs,
    paddingLeft: spacing.md,
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
