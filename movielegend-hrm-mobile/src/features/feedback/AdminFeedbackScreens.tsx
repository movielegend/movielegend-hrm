import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useCallback } from 'react';
import { useAppAlert } from '../../contexts/AlertContext';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
  ActivityIndicator,
  TextInput,
  Modal,
  RefreshControl,
  Image,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import ImageView from '../../components/ImageViewer/ImageViewer';
import Toast from 'react-native-toast-message';
import { apiUrl } from '../../constants/env';

import { EmptyState } from '../../components/EmptyState';
import { useAuth } from '../../providers/AuthProvider';
import {
  useFeedbacksForManagement,
  useFeedbackDetail,
  useUpdateFeedbackStatus,
  useFeedbackStats,
} from '../../hooks/useFeedback';
import { useQueryClient } from '@tanstack/react-query';
import { FeedbackCard } from './components/FeedbackCard';
import { FeedbackStatusBadge } from './components/FeedbackStatusBadge';
import { normalizeApiError } from '../../utils/api-error';
import type { FeedbackStatus } from '../../types/feedback.types';

export function AdminFeedbackListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [statusFilter, setStatusFilter] = useState<FeedbackStatus | undefined>(undefined);
  const feedbacksQuery = useFeedbacksForManagement({ status: statusFilter });
  const statsQuery = useFeedbackStats();

  const filterOptions: { label: string; value: FeedbackStatus | undefined }[] = [
    { label: 'Tất cả', value: undefined },
    { label: 'Chờ duyệt', value: 'SEND' },
    { label: 'Đang xem xét', value: 'REVIEWED' },
    { label: 'Đã giải quyết', value: 'RESOLVED' },
    { label: 'Từ chối', value: 'REJECTED' },
  ];

  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['feedbacks'] });
    await queryClient.invalidateQueries({ queryKey: ['feedbackStats'] });
    setRefreshing(false);
  }, [queryClient]);

  const totalCount = statsQuery.data?.total ?? (feedbacksQuery.data?.items?.length || 0);
  const pendingCount = statsQuery.data?.byStatus?.SEND ?? 0;
  const reviewingCount = statsQuery.data?.byStatus?.REVIEWED ?? 0;

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#1B3B2B" translucent={false} />

      {/* Header Container */}
      <View style={[styles.headerWrap, { paddingTop: Math.max(insets.top, 16) + 4 }]}>
        <Text style={styles.brandText}>MOVIE LEGEND</Text>
        <Text style={styles.headerTitle}>Quản lý góp ý</Text>
        <Text style={styles.headerSubtitle}>Lắng nghe & phản hồi nhân viên</Text>

        {/* Stats Container */}
        <View style={styles.statsCard}>
          <View style={styles.statCol}>
            <Text style={styles.statNumber}>{totalCount}</Text>
            <Text style={styles.statLabel}>Tổng cộng</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <Text style={styles.statNumber}>{pendingCount}</Text>
            <Text style={styles.statLabel}>Chờ duyệt</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <Text style={[styles.statNumber, { color: '#F59E0B' }]}>{reviewingCount}</Text>
            <Text style={styles.statLabel}>Đang xem xét</Text>
          </View>
        </View>
      </View>

      {/* Main White Curved Sheet */}
      <View style={styles.curvedSheet}>
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>Hộp thư góp ý</Text>
        </View>

        {/* Filter Pills */}
        <View style={styles.filterPillWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {filterOptions.map((opt, i) => {
              const isActive = statusFilter === opt.value;
              return (
                <Pressable
                  key={i}
                  onPress={() => setStatusFilter(opt.value)}
                  style={[styles.filterPill, isActive && styles.filterPillActive]}
                >
                  <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Feedback List */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: Math.max(insets.bottom, 24) + 12 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} tintColor="#1B3B2B" />
          }
        >
          {feedbacksQuery.isLoading ? (
            <ActivityIndicator style={{ marginVertical: 32 }} color="#1B3B2B" size="large" />
          ) : !feedbacksQuery.data || !feedbacksQuery.data.items || feedbacksQuery.data.items.length === 0 ? (
            <View style={{ paddingVertical: 48, alignItems: 'center' }}>
              <MaterialCommunityIcons name="email-outline" size={56} color="#CBD5E1" />
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#0F172A', marginTop: 12 }}>
                Chưa có góp ý nào
              </Text>
              <Text style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>
                Các góp ý từ nhân viên sẽ xuất hiện tại đây.
              </Text>
            </View>
          ) : (
            feedbacksQuery.data.items.map((fb) => (
              <FeedbackCard
                key={fb.id}
                feedback={fb}
                isAdmin
                onPress={() => router.push(`/admin/feedbacks/${fb.id}` as any)}
              />
            ))
          )}
        </ScrollView>
      </View>
    </View>
  );
}

export function AdminFeedbackDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { data: feedback, isLoading, isError } = useFeedbackDetail(id);
  const updateMutation = useUpdateFeedbackStatus();

  const isAdmin =
    user?.roles?.includes('ADMIN') ||
    user?.roles?.some?.((r: any) => r.name?.toUpperCase().includes('ADMIN') || r.role?.code === 'admin');
  const isGlobalAdmin = Boolean(
    isAdmin &&
      user?.scopes?.some(
        (s: any) =>
          (s.role === 'ADMIN' || s.role?.code === 'ADMIN') && (s.scopeType === 'GLOBAL' || !s.scopeType)
      )
  );

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<FeedbackStatus>('REVIEWED');
  const [reason, setReason] = useState('');
  const [viewerVisible, setViewerVisible] = useState(false);
  const { showAlert } = useAppAlert();

  if (isLoading) {
    return (
      <View style={[styles.screen, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  if (isError || !feedback) {
    return (
      <View style={styles.screen}>
        <View style={[styles.headerWrap, { paddingTop: Math.max(insets.top, 16) + 4 }]}>
          <Pressable style={styles.backRow} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#FFF" />
            <Text style={styles.brandText}>MOVIE LEGEND</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Chi tiết góp ý</Text>
        </View>
        <View style={[styles.curvedSheet, { padding: 24 }]}>
          <EmptyState title="Lỗi" message="Không thể tải dữ liệu góp ý" />
        </View>
      </View>
    );
  }

  const dateObj = new Date(feedback.createdAt);
  const timeStr = dateObj.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const dateStr = dateObj.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const fullDateTime = `${timeStr} · ${dateStr}`;

  const handleUpdate = async () => {
    try {
      await updateMutation.mutateAsync({ id, data: { status: selectedStatus, reason } });
      Toast.show({ type: 'success', text1: 'Đã cập nhật trạng thái' });
      setModalVisible(false);
    } catch (error) {
      showAlert('Lỗi', normalizeApiError(error).message);
    }
  };

  const openActionModal = (status: FeedbackStatus) => {
    setSelectedStatus(status);
    setReason(feedback.reason || '');
    setModalVisible(true);
  };

  const senderName = feedback.isAnonymous
    ? 'Thư ẩn danh'
    : feedback.senderDisplayName || feedback.sender?.fullName || 'Nhân viên';
  const senderSubtitle = feedback.isAnonymous
    ? 'Không xác định danh tính'
    : feedback.sender?.userCode || feedback.sender?.email || 'Thành viên Movie Legend';

  const canAction = feedback.status === 'SEND' || feedback.status === 'REVIEWED';

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#1B3B2B" translucent={false} />

      {/* Header Container */}
      <View style={[styles.headerWrap, { paddingTop: Math.max(insets.top, 16) + 4 }]}>
        <View style={styles.backRow}>
          <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </Pressable>
          <Text style={styles.brandText}>MOVIE LEGEND</Text>
        </View>
        <Text style={styles.headerTitle}>Chi tiết góp ý</Text>
        <Text style={styles.headerSubtitle}>Xem nội dung & cập nhật trạng thái</Text>
      </View>

      {/* Main Curved White Sheet */}
      <View style={styles.curvedSheet}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24, gap: 14 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Card 1: Title & Time */}
          <View style={styles.detailCard}>
            <FeedbackStatusBadge status={feedback.status} />
            <Text style={styles.detailTitle}>{feedback.title}</Text>
            <Text style={styles.detailTime}>{fullDateTime}</Text>
          </View>

          {/* Card 2: Sender Info */}
          <View style={styles.senderCard}>
            <View style={styles.senderAvatarBox}>
              <Ionicons name="person-outline" size={22} color="#1B3B2B" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.senderLabel}>Người gửi</Text>
              <Text style={styles.senderName}>{senderName}</Text>
              <Text style={styles.senderSub}>{senderSubtitle}</Text>
            </View>
          </View>

          {/* Card 3: Feedback Content */}
          <View style={styles.detailCard}>
            <Text style={styles.contentSectionLabel}>Nội dung góp ý</Text>
            <Text style={styles.contentBody}>{feedback.content}</Text>

            {feedback.img && (
              <View style={{ marginTop: 14 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#475569', marginBottom: 8 }}>
                  Ảnh đính kèm:
                </Text>
                <Pressable onPress={() => setViewerVisible(true)}>
                  <Image
                    source={{
                      uri: feedback.img.startsWith('http')
                        ? feedback.img
                        : `${apiUrl.replace(/\/api\/v1\/?$/, '')}${feedback.img.startsWith('/') ? '' : '/'}${feedback.img}`,
                    }}
                    style={{ width: '100%', height: 200, borderRadius: 12, resizeMode: 'cover' }}
                  />
                </Pressable>
              </View>
            )}

            {feedback.reason && (
              <View style={styles.reasonBox}>
                <Text style={{ fontWeight: '700', color: '#0F172A', fontSize: 13, marginBottom: 4 }}>
                  Phản hồi từ Admin:
                </Text>
                <Text style={{ color: '#334155', fontSize: 14, lineHeight: 20 }}>{feedback.reason}</Text>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Bottom Actions Bar */}
        {canAction && (
          <View style={[styles.bottomActionBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <Text style={styles.bottomActionTitle}>Cập nhật trạng thái</Text>
            <View style={styles.bottomButtonsRow}>
              <Pressable
                style={styles.rejectBtn}
                onPress={() => openActionModal('REJECTED')}
              >
                <Text style={styles.rejectBtnText}>Từ chối</Text>
              </Pressable>

              <Pressable
                style={styles.resolveBtn}
                onPress={() => openActionModal('RESOLVED')}
              >
                <Text style={styles.resolveBtnText}>Xử lý</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>

      {/* Reject / Resolve Modal (Bottom Sheet Matching Screen 3) */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={{ flex: 1 }} onPress={() => setModalVisible(false)} />
          <View style={[styles.modalSheet, { paddingBottom: Math.max(insets.bottom, 18) }]}>
            {/* Top Handle Bar */}
            <View style={styles.modalHandleBar} />

            {/* Close Button */}
            <Pressable
              style={styles.modalCloseBtn}
              onPress={() => setModalVisible(false)}
              hitSlop={12}
            >
              <Ionicons name="close" size={22} color="#64748B" />
            </Pressable>

            {/* Modal Icon */}
            <View
              style={[
                styles.modalIconCircle,
                selectedStatus === 'REJECTED' ? styles.modalIconCircleReject : styles.modalIconCircleResolve,
              ]}
            >
              <Ionicons
                name={selectedStatus === 'REJECTED' ? 'chatbubble-ellipses-outline' : 'checkmark-circle-outline'}
                size={22}
                color={selectedStatus === 'REJECTED' ? '#DC2626' : '#15803D'}
              />
            </View>

            {/* Modal Title & Subtitle */}
            <Text style={styles.modalMainTitle}>
              {selectedStatus === 'REJECTED' ? 'Từ chối góp ý' : 'Xử lý góp ý'}
            </Text>
            <Text style={styles.modalSubTitle}>
              {selectedStatus === 'REJECTED'
                ? 'Nhập lý do để ghi nhận phản hồi.'
                : 'Nhập nội dung phản hồi cho nhân viên (không bắt buộc).'}
            </Text>

            {/* Input field */}
            <View style={{ marginBottom: 18 }}>
              <Text style={styles.modalInputLabel}>
                {selectedStatus === 'REJECTED' ? 'Lý do phản hồi' : 'Nội dung phản hồi'}
              </Text>
              <TextInput
                style={styles.modalTextarea}
                placeholder="Nhập nội dung phản hồi..."
                placeholderTextColor="#94A3B8"
                multiline
                textAlignVertical="top"
                value={reason}
                onChangeText={setReason}
              />
            </View>

            {/* Buttons Row */}
            <View style={styles.modalButtonsRow}>
              <Pressable
                style={styles.modalCancelBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalCancelBtnText}>Hủy</Text>
              </Pressable>

              <Pressable
                style={[
                  styles.modalConfirmBtn,
                  selectedStatus === 'REJECTED' ? styles.modalConfirmBtnReject : styles.modalConfirmBtnResolve,
                  updateMutation.isPending && { opacity: 0.6 },
                ]}
                onPress={handleUpdate}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.modalConfirmBtnText}>
                    {selectedStatus === 'REJECTED' ? 'Xác nhận từ chối' : 'Xác nhận xử lý'}
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Zoomable Image Viewer */}
      <ImageView
        images={
          feedback?.img
            ? [
                {
                  uri: feedback.img.startsWith('http')
                    ? feedback.img
                    : `${apiUrl.replace(/\/api\/v1\/?$/, '')}${feedback.img.startsWith('/') ? '' : '/'}${feedback.img}`,
                },
              ]
            : []
        }
        imageIndex={0}
        visible={viewerVisible}
        onRequestClose={() => setViewerVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#1B3B2B',
  },
  headerWrap: {
    backgroundColor: '#1B3B2B',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  brandText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
    color: 'rgba(255, 255, 255, 0.7)',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 16,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  backBtn: {
    padding: 2,
    marginLeft: -4,
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    paddingVertical: 14,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  curvedSheet: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  sheetHeader: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 12,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  filterPillWrapper: {
    marginBottom: 14,
  },
  filterRow: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterPillActive: {
    backgroundColor: '#1B3B2B',
    borderColor: '#1B3B2B',
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  // Detail screen styles
  detailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 10,
    marginBottom: 6,
  },
  detailTime: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  senderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  senderAvatarBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8F3EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  senderLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 1,
  },
  senderName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  senderSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  contentSectionLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  contentBody: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 22,
  },
  reasonBox: {
    marginTop: 16,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  bottomActionBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  bottomActionTitle: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 10,
  },
  bottomButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  rejectBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#EF4444',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectBtnText: {
    color: '#DC2626',
    fontSize: 16,
    fontWeight: '700',
  },
  resolveBtn: {
    flex: 1.4,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#1B3B2B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resolveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  // Modal / Bottom sheet styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
    position: 'relative',
  },
  modalHandleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 14,
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 16,
    right: 20,
    zIndex: 10,
  },
  modalIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalIconCircleReject: {
    backgroundColor: '#FEE2E2',
  },
  modalIconCircleResolve: {
    backgroundColor: '#DCFCE7',
  },
  modalMainTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  modalSubTitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 16,
  },
  modalInputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  modalTextarea: {
    height: 90,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    fontSize: 14,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCancelBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  modalConfirmBtn: {
    flex: 1.6,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalConfirmBtnReject: {
    backgroundColor: '#C2410C',
  },
  modalConfirmBtnResolve: {
    backgroundColor: '#1B3B2B',
  },
  modalConfirmBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
