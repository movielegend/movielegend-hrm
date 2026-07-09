import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { RefreshControl, StyleSheet, Text, View, Image, Modal, TouchableOpacity, SafeAreaView, Pressable } from 'react-native';
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
import { getAbsoluteImageUrl } from '../../utils/image';

const statuses: Array<ApprovalStatus | undefined> = [undefined, 'PENDING', 'APPROVED', 'REJECTED'];
const statusLabels: Record<string, string> = {
  PENDING: 'CHỜ DUYỆT',
  APPROVED: 'ĐÃ DUYỆT',
  REJECTED: 'TỪ CHỐI',
};
const rejectSchema = z.object({ reason: z.string().min(3, 'Vui lòng nhập lý do từ chối') });

export function ApprovalListScreen({ title }: { title: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<ApprovalStatus | undefined>('PENDING');
  const [search, setSearch] = useState('');
  const approvals = useApprovals({ ...(status ? { status } : {}), search, page: 1, limit: 20 });
  return (
    <Screen>
      <ScreenContainer>
        <PageHeader title={title} subtitle="Quản lý và xét duyệt các yêu cầu đăng ký tài khoản mới của nhân viên." />
        <SearchInput value={search} onChangeText={setSearch} placeholder="Tìm theo tên, mã hoặc số điện thoại" />
        <View style={styles.filterRow}>
          {statuses.map((item) => <FilterChip key={item ?? 'ALL'} label={item ? (statusLabels[item] || item) : 'Tất cả'} selected={status === item} onPress={() => setStatus(item)} />)}
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
              <StatusBadge label={statusLabels[approval.status] || approval.status} tone={toneForStatus(approval.status)} />
              <SecondaryButton onPress={() => router.push(`./approvals/${approval.id}`)}>Xem chi tiết</SecondaryButton>
            </SectionCard>
          ))}
        </ScreenContainer>
      </ScreenContainer>
    </Screen>
  );
}

export function ApprovalDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const approval = useApproval(id);
  const approve = useApproveAccount();
  const reject = useRejectAccount();
  
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [confirmApprove, setConfirmApprove] = useState(false);
  const { control, handleSubmit, reset, formState: { errors } } = useForm<{ reason: string }>({ resolver: zodResolver(rejectSchema), defaultValues: { reason: '' } });
  const item = approval.data;
  const canApprove = hasPermission(user, 'approval.approve') && item?.status === 'PENDING';
  const canReject = hasPermission(user, 'approval.reject') && item?.status === 'PENDING';
  if (approval.isLoading) return <LoadingState />;
  if (approval.isError) return <ErrorState error={approval.error} onRetry={() => void approval.refetch()} />;
  if (!item) return <EmptyState title="Không tìm thấy yêu cầu" />;
  
  const createdAt = item.user?.createdAt ? new Date(item.user.createdAt) : null;
  const createdDate = createdAt ? createdAt.toLocaleDateString('vi-VN') : '-';
  const createdTime = createdAt ? createdAt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '-';
  const faceImages = item.user?.faceProfile?.images ?? [];
  const submitReject = handleSubmit(async (payload) => {
    await reject.mutateAsync({ id: item.id, payload });
    reset();
    void approval.refetch();
    if (router.canGoBack()) {
      router.back();
    }
  });
  return (
    <Screen>
      <ScreenContainer>
        <PageHeader title="Chi tiết duyệt tài khoản" subtitle="Xem thông tin chi tiết để quyết định duyệt hoặc từ chối yêu cầu." />
        <SectionCard>
          <View style={styles.identityRow}>
            <Avatar name={item.user?.profile?.fullName} uri={item.user?.profile?.avatarUrl} />
            <View style={styles.flex}>
              <Text style={styles.titleText}>{item.user?.profile?.fullName ?? '-'}</Text>
              <Text style={styles.meta}>{item.user?.userCode ?? '-'}</Text>
            </View>
            <StatusBadge label={statusLabels[item.status] || item.status} tone={toneForStatus(item.status)} />
          </View>
          <Text style={styles.meta}>SĐT: {maskPhone(item.user?.phone)}</Text>
          <Text style={styles.meta}>Email: {item.user?.email ?? '-'}</Text>
          <Text style={styles.meta}>Phòng ban yêu cầu: {item.requestedDepartment?.name ?? '-'}</Text>
          <Text style={styles.meta}>Ngày đăng ký: {createdDate}</Text>
          <Text style={styles.meta}>Giờ đăng ký: {createdTime}</Text>

          {faceImages.length > 0 ? (
            <View style={styles.imagesContainer}>
              <Text style={styles.imagesTitle}>Ảnh khuôn mặt đăng ký:</Text>
              <View style={styles.imagesGrid}>
                {faceImages.map((img) => (
                  <TouchableOpacity key={img.id} style={styles.faceImageWrapper} onPress={() => setViewingImage(getAbsoluteImageUrl(img.imageUrl) ?? null)}>
                    <Image source={{ uri: getAbsoluteImageUrl(img.imageUrl) }} style={styles.faceImage} resizeMode="cover" />
                    <Text style={styles.poseText}>{img.pose}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : (
            <Text style={styles.meta}>Ảnh khuôn mặt: Chưa cập nhật</Text>
          )}
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
            if (router.canGoBack()) {
              router.back();
            }
          }}
        />
        
        <Modal visible={!!viewingImage} transparent={true} animationType="fade" onRequestClose={() => setViewingImage(null)}>
          <View style={styles.imageViewerContainer}>
            <SafeAreaView style={styles.imageViewerSafeArea}>
              <TouchableOpacity style={styles.imageViewerClose} onPress={() => setViewingImage(null)}>
                <Text style={styles.imageViewerCloseText}>Đóng</Text>
              </TouchableOpacity>
              {viewingImage && (
                <View style={styles.imageViewerContent}>
                  <Image source={{ uri: viewingImage }} style={styles.fullScreenImage} resizeMode="contain" />
                  <View style={styles.watermarkContainer}>
                    <Image source={require('../../../assets/logo-watermark.png')} style={styles.watermarkLogo} resizeMode="contain" />
                  </View>
                </View>
              )}
            </SafeAreaView>
          </View>
        </Modal>
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
  imagesContainer: { marginTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md },
  imagesTitle: { color: colors.text, fontSize: 15, fontWeight: '700', marginBottom: spacing.sm },
  imagesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  faceImageWrapper: { alignItems: 'center', width: 80 },
  faceImage: { width: 80, height: 80, borderRadius: 8, backgroundColor: colors.background },
  poseText: { fontSize: 12, color: colors.muted, marginTop: 4, fontWeight: '600' },
  imageViewerContainer: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.9)' },
  imageViewerSafeArea: { flex: 1 },
  imageViewerClose: { alignSelf: 'flex-end', padding: spacing.md, marginTop: spacing.md, marginRight: spacing.md },
  imageViewerCloseText: { color: colors.background, fontSize: 16, fontWeight: 'bold' },
  imageViewerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.md },
  fullScreenImage: { width: '100%', height: '100%' },
  watermarkContainer: { position: 'absolute', top: 20, left: 20 },
  watermarkLogo: { width: 100, height: 40, opacity: 0.8 },
});
