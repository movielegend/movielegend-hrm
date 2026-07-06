import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';
import { z } from 'zod';
import { Avatar } from '../../components/Avatar';
import { ConfirmModal } from '../../components/ConfirmModal';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { FilterChip } from '../../components/FilterChip';
import { FormField } from '../../components/FormField';
import { LoadingState } from '../../components/LoadingState';
import { PageHeader } from '../../components/PageHeader';
import { PrimaryButton, SecondaryButton } from '../../components/Buttons';
import { Screen } from '../../components/Screen';
import { ScreenContainer } from '../../components/ScreenContainer';
import { SearchInput } from '../../components/SearchInput';
import { SectionCard } from '../../components/SectionCard';
import { StatusBadge, toneForStatus } from '../../components/StatusBadge';
import { useApproval, useApprovals, useApproveAccount, useRejectAccount } from '../../hooks/useApprovals';
import { useAuth } from '../../providers/AuthProvider';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import type { ApprovalStatus } from '../../types/employee.types';
import { normalizeApiError } from '../../utils/api-error';
import { hasPermission } from '../../utils/permissions';
import { maskPhone } from '../../utils/privacy';

const statuses: Array<ApprovalStatus | undefined> = [undefined, 'PENDING', 'APPROVED', 'REJECTED'];
const rejectSchema = z.object({ reason: z.string().min(3, 'Vui lòng nhập lý do từ chối') });

export function ApprovalListScreen({ title }: { title: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<ApprovalStatus | undefined>('PENDING');
  const [search, setSearch] = useState('');
  const approvals = useApprovals({ ...(status ? { status } : {}), search, page: 1, limit: 20 });
  return (
    <Screen>
      <ScreenContainer>
        <PageHeader title={title} subtitle="Danh sách yêu cầu đăng ký lấy từ backend theo scope hiện tại." />
        <SearchInput value={search} onChangeText={setSearch} placeholder="Tìm theo tên, mã hoặc số điện thoại" />
        <View style={styles.filterRow}>
          {statuses.map((item) => <FilterChip key={item ?? 'ALL'} label={item ?? 'Tất cả'} selected={status === item} onPress={() => setStatus(item)} />)}
        </View>
        {approvals.isLoading ? <LoadingState /> : null}
        {approvals.isError ? <ErrorState error={approvals.error} onRetry={() => void approvals.refetch()} /> : null}
        {!approvals.isLoading && !approvals.data?.items.length ? <EmptyState title="Chưa có yêu cầu phù hợp" /> : null}
        <ScreenContainer
          style={styles.noPadding}
          refreshControl={<RefreshControl refreshing={approvals.isRefetching} onRefresh={() => void approvals.refetch()} />}
        >
          {approvals.data?.items.map((approval) => (
            <SectionCard key={approval.id}>
              <Text style={styles.titleText}>{approval.user?.profile?.fullName ?? 'Chưa có tên'}</Text>
              <Text style={styles.meta}>Mã: {approval.user?.userCode ?? '-'}</Text>
              <Text style={styles.meta}>SĐT: {maskPhone(approval.user?.phone)}</Text>
              <Text style={styles.meta}>Phòng ban: {approval.requestedDepartment?.name ?? '-'}</Text>
              <StatusBadge label={approval.status} tone={toneForStatus(approval.status)} />
              <SecondaryButton onPress={() => router.push(`./approvals/${approval.id}`)}>Xem chi tiết</SecondaryButton>
            </SectionCard>
          ))}
        </ScreenContainer>
      </ScreenContainer>
    </Screen>
  );
}

export function ApprovalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const approval = useApproval(id);
  const approve = useApproveAccount();
  const reject = useRejectAccount();
  const [confirmApprove, setConfirmApprove] = useState(false);
  const { control, handleSubmit, reset, formState: { errors } } = useForm<{ reason: string }>({ resolver: zodResolver(rejectSchema), defaultValues: { reason: '' } });
  const item = approval.data;
  const canApprove = hasPermission(user, 'approval.approve') && item?.status === 'PENDING';
  const canReject = hasPermission(user, 'approval.reject') && item?.status === 'PENDING';
  if (approval.isLoading) return <LoadingState />;
  if (approval.isError) return <ErrorState error={approval.error} onRetry={() => void approval.refetch()} />;
  if (!item) return <EmptyState title="Không tìm thấy yêu cầu" />;
  const submitReject = handleSubmit(async (payload) => {
    await reject.mutateAsync({ id: item.id, payload });
    reset();
    void approval.refetch();
  });
  return (
    <Screen>
      <ScreenContainer>
        <PageHeader title="Chi tiết duyệt tài khoản" subtitle="Thông tin nhạy cảm được rút gọn theo privacy contract." />
        <SectionCard>
          <View style={styles.identityRow}>
            <Avatar name={item.user?.profile?.fullName} uri={item.user?.profile?.avatarUrl} />
            <View style={styles.flex}>
              <Text style={styles.titleText}>{item.user?.profile?.fullName ?? '-'}</Text>
              <Text style={styles.meta}>{item.user?.userCode ?? '-'}</Text>
            </View>
            <StatusBadge label={item.status} tone={toneForStatus(item.status)} />
          </View>
          <Text style={styles.meta}>SĐT: {maskPhone(item.user?.phone)}</Text>
          <Text style={styles.meta}>Email: {item.user?.email ?? '-'}</Text>
          <Text style={styles.meta}>Phòng ban yêu cầu: {item.requestedDepartment?.name ?? '-'}</Text>
          <Text style={styles.meta}>Face profile: {item.user?.profile ? 'Đã có hồ sơ' : 'Chưa xác định'}</Text>
        </SectionCard>
        {approve.error || reject.error ? <Text style={styles.error}>{normalizeApiError(approve.error ?? reject.error).message}</Text> : null}
        {canApprove ? <PrimaryButton onPress={() => setConfirmApprove(true)} loading={approve.isPending}>Duyệt tài khoản</PrimaryButton> : null}
        {canReject ? (
          <SectionCard title="Từ chối">
            <Controller control={control} name="reason" render={({ field }) => <FormField label="Lý do" value={field.value} onChangeText={field.onChange} error={errors.reason?.message} />} />
            <SecondaryButton onPress={() => void submitReject()} loading={reject.isPending}>Từ chối</SecondaryButton>
          </SectionCard>
        ) : null}
        <ConfirmModal
          visible={confirmApprove}
          title="Duyệt tài khoản"
          message="Bạn có chắc muốn duyệt nhân sự này?"
          loading={approve.isPending}
          onCancel={() => setConfirmApprove(false)}
          onConfirm={async () => {
            await approve.mutateAsync(item.id);
            setConfirmApprove(false);
            void approval.refetch();
          }}
        />
      </ScreenContainer>
    </Screen>
  );
}

const styles = StyleSheet.create({
  error: { color: colors.danger },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  flex: { flex: 1 },
  identityRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  meta: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  noPadding: { padding: 0 },
  titleText: { color: colors.text, fontSize: 17, fontWeight: '800' },
});
