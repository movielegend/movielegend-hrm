import { zodResolver } from '@hookform/resolvers/zod';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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
            <View key={approval.id} style={localStyles.card}>
              <View style={localStyles.cardHeader}>
                <Avatar name={approval.user?.profile?.fullName} uri={approval.user?.profile?.avatarUrl} size={56} />
                <View style={localStyles.cardHeaderText}>
                  <Text style={localStyles.cardTitle}>{approval.user?.profile?.fullName ?? 'Chưa có tên'}</Text>
                  <Text style={localStyles.cardSubtitle}>Mã: {approval.user?.userCode ?? '-'}</Text>
                  
                  <View style={localStyles.infoRow}>
                    <MaterialCommunityIcons name="phone-outline" size={16} color="#6B7280" />
                    <Text style={localStyles.infoText}>SĐT: {maskPhone(approval.user?.phone)}</Text>
                  </View>
                  
                  <View style={localStyles.infoRow}>
                    <MaterialCommunityIcons name="office-building-outline" size={16} color="#6B7280" />
                    <Text style={localStyles.infoText}>Phòng ban: {approval.requestedDepartment?.name ?? '-'}</Text>
                  </View>
                  
                  <View style={{ alignSelf: 'flex-start', marginTop: 8 }}>
                    <StatusBadge label={statusLabels[approval.status] || approval.status} tone={toneForStatus(approval.status)} />
                  </View>
                </View>
              </View>
              
              <Pressable style={localStyles.actionBtn} onPress={() => router.push(`./approvals/${approval.id}`)}>
                <Text style={localStyles.actionBtnText}>Xem chi tiết</Text>
                <MaterialCommunityIcons name="chevron-right" size={20} color="#111827" />
              </Pressable>
            </View>
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
          <View style={localStyles.detailHeader}>
            <Avatar name={item.user?.profile?.fullName} uri={item.user?.profile?.avatarUrl} size={64} />
            <View style={{ flex: 1, marginLeft: 16 }}>
              <Text style={localStyles.cardTitle}>{item.user?.profile?.fullName ?? '-'}</Text>
              <Text style={localStyles.cardSubtitle}>{item.user?.userCode ?? '-'}</Text>
            </View>
            <View style={{ alignSelf: 'flex-start' }}>
              <StatusBadge label={statusLabels[item.status] || item.status} tone={toneForStatus(item.status)} />
            </View>
          </View>
          
          <View style={localStyles.detailList}>
            <View style={localStyles.infoRow}>
              <MaterialCommunityIcons name="phone-outline" size={18} color="#6B7280" />
              <Text style={localStyles.infoTextDetail}>SĐT: {maskPhone(item.user?.phone)}</Text>
            </View>
            <View style={localStyles.infoRow}>
              <MaterialCommunityIcons name="email-outline" size={18} color="#6B7280" />
              <Text style={localStyles.infoTextDetail}>Email: {item.user?.email ?? '-'}</Text>
            </View>
            <View style={localStyles.infoRow}>
              <MaterialCommunityIcons name="office-building-outline" size={18} color="#6B7280" />
              <Text style={localStyles.infoTextDetail}>Phòng ban yêu cầu: {item.requestedDepartment?.name ?? '-'}</Text>
            </View>
            <View style={localStyles.infoRow}>
              <MaterialCommunityIcons name="calendar-outline" size={18} color="#6B7280" />
              <Text style={localStyles.infoTextDetail}>Ngày đăng ký: {createdDate}</Text>
            </View>
            <View style={localStyles.infoRow}>
              <MaterialCommunityIcons name="clock-outline" size={18} color="#6B7280" />
              <Text style={localStyles.infoTextDetail}>Giờ đăng ký: {createdTime}</Text>
            </View>
          </View>

          <View style={localStyles.divider} />

          <View style={localStyles.imagesSection}>
            <Text style={localStyles.imagesTitle}>Ảnh khuôn mặt đăng ký</Text>
            <View style={localStyles.imagesGrid}>
              {['FRONT', 'LEFT', 'RIGHT'].map((pose) => {
                const img = faceImages.find((i) => i.pose === pose);
                return (
                  <View key={pose} style={localStyles.faceImageWrapper}>
                    {img ? (
                      <TouchableOpacity style={{ width: '100%' }} onPress={() => setViewingImage(getAbsoluteImageUrl(img.imageUrl) ?? null)}>
                        <Image source={{ uri: getAbsoluteImageUrl(img.imageUrl) }} style={localStyles.faceImage} resizeMode="cover" />
                      </TouchableOpacity>
                    ) : (
                      <View style={localStyles.faceImagePlaceholder}>
                        <MaterialCommunityIcons name="account" size={40} color="#D1D5DB" />
                      </View>
                    )}
                    <Text style={localStyles.poseText}>{pose}</Text>
                  </View>
                );
              })}
            </View>
          </View>
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

const localStyles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  cardHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  cardHeaderText: {
    flex: 1,
    marginLeft: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: '#4B5563',
    marginLeft: 6,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginRight: 4,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  detailList: {
    gap: 12,
  },
  infoTextDetail: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 24,
  },
  imagesSection: {
    marginTop: 4,
  },
  imagesTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  imagesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  faceImageWrapper: {
    flex: 1,
  },
  faceImage: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  faceImagePlaceholder: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  poseText: {
    fontSize: 12,
    color: '#4B5563',
    marginTop: 8,
    fontWeight: '600',
    textAlign: 'center',
  },
});
