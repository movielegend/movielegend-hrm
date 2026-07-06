import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { EmptyState } from '../../components/EmptyState';
import { FormField } from '../../components/FormField';
import { PageHeader } from '../../components/PageHeader';
import { PrimaryButton, SecondaryButton } from '../../components/Buttons';
import { Screen } from '../../components/Screen';
import { SectionCard } from '../../components/SectionCard';
import { StatusBadge, toneForStatus } from '../../components/StatusBadge';
import { useApproveOvertimeRequest, useCreateOvertimeRequest, useMyOvertimeRequests, usePendingOvertimeRequests, useRejectOvertimeRequest } from '../../hooks/useOvertime';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import type { OvertimeRequest } from '../../types/overtime.types';
import { businessDateToday, formatDate, formatDateTime } from '../../utils/date-time';
import { normalizeApiError } from '../../utils/api-error';

export function OvertimeHomeScreen() {
  const router = useRouter();
  const overtime = useMyOvertimeRequests({ page: 1, limit: 20 });
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <PageHeader title="Tang ca" subtitle="Lich su cua toi tu /overtime/requests/my." />
        <PrimaryButton onPress={() => router.push('/employee/overtime/create')}>Tao don tang ca</PrimaryButton>
        <SectionCard title="Lich su tang ca">
          {(overtime.data?.items ?? []).map((request) => <OvertimeCard key={request.id} request={request} />)}
          {!overtime.data?.items.length ? <EmptyState title="Chua co don tang ca" /> : null}
        </SectionCard>
      </ScrollView>
    </Screen>
  );
}

export function CreateOvertimeRequestScreen() {
  const mutation = useCreateOvertimeRequest();
  const [workDate, setWorkDate] = useState(businessDateToday());
  const [startAt, setStartAt] = useState(`${businessDateToday()}T18:00:00.000Z`);
  const [endAt, setEndAt] = useState(`${businessDateToday()}T20:00:00.000Z`);
  const [reason, setReason] = useState('');

  async function submit() {
    try {
      await mutation.mutateAsync({ workDate, startAt, endAt, reason });
      Alert.alert('Thanh cong', 'Da gui don tang ca');
    } catch (error) {
      const normalized = normalizeApiError(error);
      Alert.alert(normalized.code, normalized.message);
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <PageHeader title="Tao tang ca" subtitle="Dung dung DTO workDate/startAt/endAt/reason." />
        <SectionCard>
          <FormField label="Work date YYYY-MM-DD" value={workDate} onChangeText={setWorkDate} />
          <FormField label="Start at ISO" value={startAt} onChangeText={setStartAt} autoCapitalize="none" />
          <FormField label="End at ISO" value={endAt} onChangeText={setEndAt} autoCapitalize="none" />
          <FormField label="Ly do" value={reason} onChangeText={setReason} multiline />
          <PrimaryButton loading={mutation.isPending} disabled={reason.length < 3} onPress={() => void submit()}>Gui tang ca</PrimaryButton>
        </SectionCard>
      </ScrollView>
    </Screen>
  );
}

export function LeaderOvertimeApprovalsScreen() {
  const pending = usePendingOvertimeRequests({ page: 1, limit: 20, status: 'PENDING' });
  const approve = useApproveOvertimeRequest();
  const reject = useRejectOvertimeRequest();
  const [rejectReason, setRejectReason] = useState('');
  async function approveRequest(id: string) {
    try {
      await approve.mutateAsync(id);
      Alert.alert('Thanh cong', 'Da duyet tang ca');
    } catch (error) {
      const normalized = normalizeApiError(error);
      Alert.alert(normalized.code, normalized.message);
    }
  }

  async function rejectRequest(id: string) {
    if (rejectReason.length < 3) {
      Alert.alert('Thieu ly do', 'Can nhap ly do tu choi.');
      return;
    }
    try {
      await reject.mutateAsync({ id, payload: { reason: rejectReason } });
      Alert.alert('Thanh cong', 'Da tu choi tang ca');
    } catch (error) {
      const normalized = normalizeApiError(error);
      Alert.alert(normalized.code, normalized.message);
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <PageHeader title="Duyet tang ca" subtitle="Pending list tu /overtime/requests/pending." />
        <FormField label="Ly do tu choi" value={rejectReason} onChangeText={setRejectReason} />
        {(pending.data?.items ?? []).map((request) => (
          <SectionCard key={request.id}>
            <OvertimeCard request={request} />
            <View style={styles.actions}>
              <PrimaryButton loading={approve.isPending} onPress={() => void approveRequest(request.id)}>Duyet</PrimaryButton>
              <SecondaryButton loading={reject.isPending} onPress={() => void rejectRequest(request.id)}>Tu choi</SecondaryButton>
            </View>
          </SectionCard>
        ))}
        {!pending.data?.items.length ? <EmptyState title="Khong co OT pending" /> : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: spacing.sm,
  },
  content: {
    gap: spacing.lg,
    padding: spacing.lg,
  },
  muted: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
});

function OvertimeCard({ request }: { request: OvertimeRequest }) {
  return (
    <View style={styles.actions}>
      <View>
        <Text style={styles.title}>{formatDate(request.workDate)}</Text>
        <StatusBadge label={request.status} tone={toneForStatus(request.status)} />
      </View>
      <Text style={styles.muted}>{formatDateTime(request.startAt)} - {formatDateTime(request.endAt)}</Text>
      <Text style={styles.muted}>{request.reason}</Text>
    </View>
  );
}
