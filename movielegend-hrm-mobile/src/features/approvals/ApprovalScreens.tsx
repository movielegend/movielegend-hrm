import { zodResolver } from '@hookform/resolvers/zod';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { RefreshControl, StyleSheet, Text, View, Image, Modal, TouchableOpacity, Pressable, Platform, StatusBar, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { formatSeniority } from '../../utils/seniority';

const statuses: Array<ApprovalStatus | undefined> = [undefined, 'PENDING', 'APPROVED', 'REJECTED'];
const statusLabels: Record<string, string> = {
  PENDING: 'CHỜ DUYỆT',
  APPROVED: 'ĐÃ DUYỆT',
  REJECTED: 'TỪ CHỐI',
};
const rejectSchema = z.object({ reason: z.string().min(3, 'Vui lòng nhập lý do từ chối') });

export function ApprovalListScreen({ title, detailRoute }: { title: string, detailRoute?: (id: string) => string }) {
  const router = useRouter();
  const [status, setStatus] = useState<ApprovalStatus | undefined>('PENDING');
  const [search, setSearch] = useState('');
  const approvals = useApprovals({ ...(status ? { status } : {}), search, page: 1, limit: 20 });

  const getInitials = (name?: string) => {
    if (!name) return 'NV';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const getBadgeStyle = (st: string) => {
    switch (st) {
      case 'APPROVED':
        return { bg: '#DCFCE7', color: '#166534', label: 'Đã duyệt' };
      case 'REJECTED':
        return { bg: '#FEE2E2', color: '#EF4444', label: 'Từ chối' };
      case 'PENDING':
      default:
        return { bg: '#FEF3C7', color: '#B45309', label: 'Chờ duyệt' };
    }
  };

  return (
    <Screen>
      {/* 1. Header (Back button + Title on same row) */}
      <View style={localStyles.header}>
        <View style={localStyles.headerRow}>
          <Pressable 
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/admin/(tabs)' as any))} 
            style={localStyles.backBtn} 
            hitSlop={8}
          >
            <MaterialCommunityIcons name="chevron-left" size={26} color="#0F172A" />
          </Pressable>
          <Text style={localStyles.headerTitle}>{title || 'Duyệt tài khoản'}</Text>
        </View>
        <Text style={localStyles.headerSubtitle}>Xét duyệt đăng ký nhân viên mới</Text>
      </View>

      {/* 2. Search Box */}
      <View style={localStyles.searchSection}>
        <View style={localStyles.searchBar}>
          <MaterialCommunityIcons name="magnify" size={20} color="#94A3B8" />
          <TextInput
            style={localStyles.searchInput}
            placeholder="Tìm tên, mã hoặc số điện thoại"
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')}>
              <MaterialCommunityIcons name="close-circle" size={18} color="#94A3B8" />
            </Pressable>
          )}
        </View>
      </View>

      {/* 3. Status Filters */}
      <View style={localStyles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={localStyles.filterContainer}>
          {statuses.map((item) => {
            const isSelected = status === item;
            const label = item === undefined ? 'Tất cả' : item === 'PENDING' ? 'Chờ duyệt' : item === 'APPROVED' ? 'Đã duyệt' : 'Từ chối';
            return (
              <Pressable
                key={item ?? 'ALL'}
                style={[localStyles.filterPill, isSelected && localStyles.filterPillActive]}
                onPress={() => setStatus(item)}
              >
                <Text style={[localStyles.filterPillText, isSelected && localStyles.filterPillTextActive]}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* 4. List / State */}
      {approvals.isLoading ? (
        <View style={localStyles.centerBox}>
          <ActivityIndicator size="large" color="#1B382B" />
        </View>
      ) : approvals.isError ? (
        <View style={localStyles.centerBox}>
          <Text style={{ color: '#EF4444', marginBottom: 12 }}>Có lỗi xảy ra khi tải dữ liệu</Text>
          <Pressable style={localStyles.retryBtn} onPress={() => void approvals.refetch()}>
            <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Thử lại</Text>
          </Pressable>
        </View>
      ) : !approvals.data?.items?.length ? (
        <ScrollView
          contentContainerStyle={localStyles.emptyContainer}
          refreshControl={<RefreshControl refreshing={approvals.isRefetching} onRefresh={() => void approvals.refetch()} />}
        >
          <View style={localStyles.emptyIconBg}>
            <MaterialCommunityIcons name="account-search-outline" size={54} color="#94A3B8" />
          </View>
          <Text style={localStyles.emptyTitle}>Chưa có yêu cầu phù hợp</Text>
          <Text style={localStyles.emptySubtitle}>Không tìm thấy tài khoản nào khớp với bộ lọc</Text>
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={localStyles.listContent}
          refreshControl={<RefreshControl refreshing={approvals.isRefetching} onRefresh={() => void approvals.refetch()} />}
          showsVerticalScrollIndicator={false}
        >
          {approvals.data?.items?.map((approval) => {
            const fullName = approval.user?.profile?.fullName ?? 'Chưa có tên';
            const initials = getInitials(fullName);
            const badge = getBadgeStyle(approval.status);

            return (
              <View key={approval.id} style={localStyles.card}>
                <View style={localStyles.cardHeader}>
                  <View style={localStyles.avatarBox}>
                    <Text style={localStyles.avatarText}>{initials}</Text>
                  </View>
                  <View style={localStyles.cardHeaderInfo}>
                    <Text style={localStyles.cardName}>{fullName}</Text>
                    <Text style={localStyles.cardCode}>Mã: {approval.user?.userCode ?? '-'}</Text>
                  </View>
                  <View style={[localStyles.badgeBox, { backgroundColor: badge.bg }]}>
                    <Text style={[localStyles.badgeText, { color: badge.color }]}>{badge.label}</Text>
                  </View>
                </View>

                <View style={localStyles.cardBody}>
                  <View style={localStyles.infoRow}>
                    <MaterialCommunityIcons name="phone-outline" size={16} color="#64748B" />
                    <Text style={localStyles.infoText}>SĐT: {maskPhone(approval.user?.phone)}</Text>
                  </View>
                  <View style={localStyles.infoRow}>
                    <MaterialCommunityIcons name="office-building-outline" size={16} color="#64748B" />
                    <Text style={localStyles.infoText}>Phòng ban: {approval.requestedDepartment?.name ?? '-'}</Text>
                  </View>
                  {approval.requestedDepartment?.branch?.name ? (
                    <View style={localStyles.infoRow}>
                      <MaterialCommunityIcons name="map-marker-outline" size={16} color="#64748B" />
                      <Text style={localStyles.infoText}>Cơ sở: {approval.requestedDepartment.branch.name}</Text>
                    </View>
                  ) : null}
                </View>

                <Pressable
                  style={localStyles.detailButton}
                  onPress={() => {
                    if (detailRoute) {
                      router.push(detailRoute(approval.id) as any);
                    } else {
                      router.push(`./${approval.id}`);
                    }
                  }}
                >
                  <Text style={localStyles.detailButtonText}>Xem chi tiết →</Text>
                </Pressable>
              </View>
            );
          })}
        </ScrollView>
      )}
    </Screen>
  );
}

export function ApprovalDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const safeTopInset = Math.max(insets.top, Platform.OS === 'ios' ? 47 : (StatusBar.currentHeight || 24));
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
            {item.user?.profile?.joinDate ? (
              <View style={localStyles.infoRow}>
                <MaterialCommunityIcons name="briefcase-outline" size={18} color="#6B7280" />
                <Text style={localStyles.infoTextDetail}>
                  Ngày vào làm (khai báo): {new Date(item.user.profile.joinDate).toLocaleDateString('vi-VN')}
                </Text>
              </View>
            ) : null}
            <View style={localStyles.infoRow}>
              <MaterialCommunityIcons name="calendar-clock" size={18} color="#6B7280" />
              <Text style={[localStyles.infoTextDetail, { color: item.status === 'APPROVED' ? '#059669' : '#D97706', fontWeight: '600' }]}>
                {item.status === 'APPROVED' 
                  ? `Thâm niên: ${formatSeniority(item.user?.profile?.joinDate || item.decidedAt || item.user?.createdAt)}` 
                  : item.user?.profile?.joinDate
                    ? `Thâm niên dự kiến: ${formatSeniority(item.user.profile.joinDate)}`
                    : 'Thâm niên: Bắt đầu tính ngay khi bấm duyệt'}
              </Text>
            </View>
          </View>

          <View style={localStyles.divider} />

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
            <View style={[styles.imageViewerSafeArea, { paddingTop: safeTopInset }]}>
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
            </View>
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
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    marginRight: 6,
    padding: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
    marginLeft: 34,
  },
  searchSection: {
    paddingHorizontal: 16,
    marginTop: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    paddingVertical: 0,
  },
  filterSection: {
    marginTop: 10,
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 2,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  filterPillActive: {
    backgroundColor: '#1B382B',
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  retryBtn: {
    backgroundColor: '#1B382B',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  emptyIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
    gap: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#166534',
  },
  cardHeaderInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  cardCode: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  badgeBox: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardBody: {
    gap: 6,
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 13,
    color: '#475569',
    marginLeft: 8,
  },
  detailButton: {
    backgroundColor: '#1B382B',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
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
