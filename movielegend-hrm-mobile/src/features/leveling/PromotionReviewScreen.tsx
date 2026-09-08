import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { levelingApi, LevelPromotionRequestItem } from '../../api/leveling.api';
import { LEVEL_COLORS, LevelNameBadge } from '../../components/common/LevelNameBadge';
import { getAbsoluteImageUrl } from '../../utils/image';

export const PromotionReviewScreen: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{
    requestId?: string;
    fromLevelNumber?: string;
    toLevelNumber?: string;
    departmentName?: string;
  }>();

  const requestId = params.requestId;

  const [request, setRequest] = useState<LevelPromotionRequestItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [leaderNote, setLeaderNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewImageIndex, setPreviewImageIndex] = useState<number | null>(null);

  const loadDetail = useCallback(async () => {
    if (!requestId) {
      setIsLoading(false);
      return;
    }
    try {
      const data = await levelingApi.getPromotionRequestById(requestId);
      setRequest(data);
      if (data.leaderNote) {
        setLeaderNote(data.leaderNote);
      }
    } catch (err: any) {
      Alert.alert('Lỗi tải dữ liệu', err?.response?.data?.message || err?.message || 'Không thể tải chi tiết đề xuất');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [requestId]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  const onRefresh = () => {
    setIsRefreshing(true);
    loadDetail();
  };

  const handleAction = async (status: 'APPROVED' | 'REJECTED' | 'SUPPLEMENT_REQUESTED') => {
    if (!requestId) return;

    if (status === 'REJECTED' && !leaderNote.trim()) {
      Alert.alert('Ghi chú bắt buộc', 'Vui lòng nhập lý do từ chối để nhân viên biết điểm cần cải thiện.');
      return;
    }

    if (status === 'SUPPLEMENT_REQUESTED' && !leaderNote.trim()) {
      Alert.alert('Ghi chú bắt buộc', 'Vui lòng nhập nội dung cần nhân viên bổ sung thêm.');
      return;
    }

    try {
      setIsSubmitting(true);
      await levelingApi.reviewPromotionRequest(requestId, {
        status,
        leaderNote: leaderNote.trim() || undefined,
      });

      const empName = request?.user?.profile?.fullName || request?.user?.userCode || 'Nhân sự';
      const msg =
        status === 'APPROVED'
          ? `Đã phê duyệt thăng cấp Level ${request?.toLevelNumber} cho ${empName}! 🎉`
          : status === 'SUPPLEMENT_REQUESTED'
          ? `Đã gửi yêu cầu bổ sung bằng chứng tới ${empName}.`
          : `Đã từ chối đề xuất thăng cấp của ${empName}.`;

      Alert.alert('Thành công', msg, [
        {
          text: 'Đồng ý',
          onPress: () => router.back(),
        },
      ]);
    } catch (err: any) {
      Alert.alert('Lỗi xử lý', err?.response?.data?.message || err?.message || 'Có lỗi xảy ra');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
        <View style={styles.navBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Thẩm Định Đề Xuất Lên Cấp</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#38BDF8" />
          <Text style={styles.loadingText}>Đang tải chi tiết đề xuất...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!request) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
        <View style={styles.navBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Thẩm Định Đề Xuất Lên Cấp</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#94A3B8" />
          <Text style={styles.emptyTitle}>Không tìm thấy thông tin đề xuất</Text>
          <TouchableOpacity style={styles.btnBackOutline} onPress={() => router.back()}>
            <Text style={styles.btnBackOutlineText}>Quay lại danh sách</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const fromLevel = request.fromLevelNumber || 1;
  const toLevel = request.toLevelNumber || 2;
  const fromColor = LEVEL_COLORS[fromLevel] || '#FF9800';
  const toColor = LEVEL_COLORS[toLevel] || '#10B981';

  const userProfile = request.user?.profile;
  const userName = userProfile?.fullName || request.user?.userCode || 'Nhân sự';
  const userAvatar = getAbsoluteImageUrl(userProfile?.avatarUrl);
  const deptName = request.department?.name || params.departmentName || 'Phòng ban';

  const isAlreadyProcessed = request.status !== 'PENDING';
  const evidenceImages = request.evidenceImages || [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      {/* Top Navbar */}
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.navTitleBox}>
          <Text style={styles.navTitle}>Thẩm Định Đề Xuất Lên Cấp</Text>
          <Text style={styles.navSubtitle}>Mã: #{request.id.slice(0, 8)}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.container}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#38BDF8" />}
        >
          {/* Target Transition Hero Card */}
          <View style={styles.heroCard}>
            <View style={styles.heroDeptBadge}>
              <Ionicons name="business" size={13} color="#38BDF8" />
              <Text style={styles.heroDeptText}>{deptName}</Text>
            </View>

            <View style={styles.transitionRow}>
              {/* From Level */}
              <View style={styles.levelBox}>
                <View style={[styles.levelCircle, { borderColor: fromColor, backgroundColor: `${fromColor}18` }]}>
                  <Text style={[styles.levelCircleNum, { color: fromColor }]}>{fromLevel}</Text>
                </View>
                <Text style={styles.levelRoleLabel}>Cấp hiện tại</Text>
                <Text style={[styles.levelRoleName, { color: fromColor }]} numberOfLines={1}>
                  Level {fromLevel}
                </Text>
              </View>

              {/* Arrow */}
              <View style={styles.transitionArrowBox}>
                <Ionicons name="arrow-forward" size={18} color="#94A3B8" />
              </View>

              {/* To Level */}
              <View style={styles.levelBox}>
                <View style={[styles.levelCircle, { borderColor: toColor, backgroundColor: `${toColor}22` }]}>
                  <Text style={[styles.levelCircleNum, { color: toColor }]}>{toLevel}</Text>
                </View>
                <Text style={styles.levelRoleLabel}>Mục tiêu xét duyệt</Text>
                <Text style={[styles.levelRoleName, { color: toColor }]} numberOfLines={1}>
                  Level {toLevel}
                </Text>
              </View>
            </View>
          </View>

          {/* Employee Info Card */}
          <View style={styles.sectionCard}>
            <View style={styles.empHeaderRow}>
              <View style={styles.avatarWrapper}>
                {userAvatar ? (
                  <Image source={{ uri: userAvatar }} style={[styles.avatarImage, { borderColor: fromColor }]} />
                ) : (
                  <View style={[styles.avatarFallback, { borderColor: fromColor, backgroundColor: `${fromColor}20` }]}>
                    <Text style={[styles.avatarFallbackText, { color: fromColor }]}>
                      {userName.trim().charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={[styles.levelBadgeMini, { backgroundColor: fromColor }]}>
                  <Text style={styles.levelBadgeMiniText}>{fromLevel}</Text>
                </View>
              </View>

              <View style={{ flex: 1, marginLeft: 12 }}>
                <LevelNameBadge
                  name={userName}
                  levelNumber={fromLevel}
                  size="md"
                />
                <Text style={styles.empMetaText}>
                  Mã: <Text style={{ color: '#0F172A', fontWeight: '700' }}>{request.user?.userCode}</Text> • {deptName}
                </Text>
                <Text style={styles.empDateText}>
                  Ngày nộp:{' '}
                  {new Date(request.createdAt).toLocaleDateString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })}
                </Text>
              </View>
            </View>

            {/* Current Status Badge if processed */}
            <View style={styles.statusRow}>
              <Text style={styles.statusRowLabel}>Trạng thái đơn:</Text>
              <View
                style={[
                  styles.statusTag,
                  request.status === 'APPROVED' && { backgroundColor: '#DCFCE7' },
                  request.status === 'REJECTED' && { backgroundColor: '#FEE2E2' },
                  request.status === 'SUPPLEMENT_REQUESTED' && { backgroundColor: '#FEF3C7' },
                  request.status === 'PENDING' && { backgroundColor: '#EFF6FF' },
                ]}
              >
                <Text
                  style={[
                    styles.statusTagText,
                    request.status === 'APPROVED' && { color: '#15803D' },
                    request.status === 'REJECTED' && { color: '#B91C1C' },
                    request.status === 'SUPPLEMENT_REQUESTED' && { color: '#B45309' },
                    request.status === 'PENDING' && { color: '#2563EB' },
                  ]}
                >
                  {request.status === 'PENDING'
                    ? 'Chờ Thẩm Định'
                    : request.status === 'APPROVED'
                    ? 'Đã Phê Duyệt'
                    : request.status === 'SUPPLEMENT_REQUESTED'
                    ? 'Yêu Cầu Bổ Sung'
                    : 'Đã Từ Chối'}
                </Text>
              </View>
            </View>
          </View>

          {/* Section 1: Self Evaluation & Submission Note */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconBg, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="document-text" size={16} color="#2563EB" />
              </View>
              <Text style={styles.sectionTitle}>1. Báo Cáo Thành Tích Của Nhân Sự</Text>
            </View>
            <View style={styles.reportBox}>
              <Text style={styles.reportText}>
                {request.submissionNote || 'Nhân sự không để lại ghi chú tóm tắt.'}
              </Text>
            </View>
          </View>

          {/* Section 2: Evidence Images */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderBetween}>
              <View style={styles.sectionHeaderLeft}>
                <View style={[styles.sectionIconBg, { backgroundColor: '#ECFDF5' }]}>
                  <Ionicons name="images" size={16} color="#059669" />
                </View>
                <Text style={styles.sectionTitle}>2. Ảnh Bằng Chứng / Minh Chứng</Text>
              </View>

              <View style={styles.counterBadge}>
                <Text style={styles.counterBadgeText}>{evidenceImages.length} ảnh</Text>
              </View>
            </View>

            {evidenceImages.length > 0 ? (
              <View>
                <View style={styles.imageGrid}>
                  {evidenceImages.map((url, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={styles.imageThumbWrapper}
                      onPress={() => setPreviewImageIndex(idx)}
                      activeOpacity={0.85}
                    >
                      <Image source={{ uri: url }} style={styles.imageThumb} />
                      <View style={styles.zoomBadge}>
                        <Ionicons name="scan-outline" size={13} color="#FFF" />
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.imageTapHint}>💡 Chạm vào ảnh để soi chi tiết toàn màn hình</Text>
              </View>
            ) : (
              <View style={styles.noImagesBox}>
                <Ionicons name="image-outline" size={28} color="#94A3B8" />
                <Text style={styles.noImagesText}>Nhân sự không đính kèm ảnh minh chứng</Text>
              </View>
            )}
          </View>

          {/* Section 3: Leader Feedback & Decision Note */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconBg, { backgroundColor: '#F3E8FF' }]}>
                <Ionicons name="chatbox-ellipses" size={16} color="#7C3AED" />
              </View>
              <Text style={styles.sectionTitle}>3. Nhận Xét & Chỉ Đạo Của Leader / Quản Trị</Text>
            </View>
            <Text style={styles.sectionDesc}>
              Nhập đánh giá, lý do duyệt hoặc hướng dẫn những điểm cần bổ sung/cải thiện:
            </Text>
            <TextInput
              style={styles.textArea}
              placeholder="VD: Đã hoàn thành xuất sắc KPI tháng, tác phong tốt, đồng ý thăng cấp..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={leaderNote}
              onChangeText={setLeaderNote}
            />
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Fullscreen Image Preview Lightbox Modal */}
      {previewImageIndex !== null && evidenceImages[previewImageIndex] && (
        <Modal
          visible={previewImageIndex !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setPreviewImageIndex(null)}
        >
          <View style={styles.lightboxOverlay}>
            <SafeAreaView style={styles.lightboxSafeArea}>
              {/* Lightbox Top Bar */}
              <View style={styles.lightboxHeader}>
                <TouchableOpacity
                  style={styles.lightboxHeaderBtn}
                  onPress={() => setPreviewImageIndex(null)}
                >
                  <Ionicons name="close" size={24} color="#FFF" />
                </TouchableOpacity>

                <View style={styles.lightboxCounterBadge}>
                  <Text style={styles.lightboxCounterText}>
                    {previewImageIndex + 1} / {evidenceImages.length}
                  </Text>
                </View>

                <View style={{ width: 40 }} />
              </View>

              {/* Lightbox Center Image & Navigation */}
              <View style={styles.lightboxImageContainer}>
                {evidenceImages.length > 1 && previewImageIndex > 0 && (
                  <TouchableOpacity
                    style={[styles.lightboxNavBtn, styles.lightboxNavLeft]}
                    onPress={() => setPreviewImageIndex((prev) => (prev !== null ? prev - 1 : 0))}
                  >
                    <Ionicons name="chevron-back" size={24} color="#FFF" />
                  </TouchableOpacity>
                )}

                <Image
                  source={{ uri: evidenceImages[previewImageIndex] }}
                  style={styles.lightboxImage}
                  resizeMode="contain"
                />

                {evidenceImages.length > 1 && previewImageIndex < evidenceImages.length - 1 && (
                  <TouchableOpacity
                    style={[styles.lightboxNavBtn, styles.lightboxNavRight]}
                    onPress={() => setPreviewImageIndex((prev) => (prev !== null ? prev + 1 : 0))}
                  >
                    <Ionicons name="chevron-forward" size={24} color="#FFF" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Lightbox Bottom Footer */}
              <View style={styles.lightboxFooter}>
                <Text style={styles.lightboxFooterText}>Ảnh minh chứng đề xuất thăng cấp #{request.id.slice(0, 8)}</Text>
              </View>
            </SafeAreaView>
          </View>
        </Modal>
      )}

      {/* Bottom Sticky Action Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.rejectBtn]}
          onPress={() => handleAction('REJECTED')}
          disabled={isSubmitting}
          activeOpacity={0.8}
        >
          <Ionicons name="close-circle-outline" size={18} color="#DC2626" />
          <Text style={styles.rejectBtnText}>Từ Chối</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.supplementBtn]}
          onPress={() => handleAction('SUPPLEMENT_REQUESTED')}
          disabled={isSubmitting}
          activeOpacity={0.8}
        >
          <Ionicons name="chatbox-ellipses-outline" size={18} color="#D97706" />
          <Text style={styles.supplementBtnText}>Bổ Sung</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.approveBtn]}
          onPress={() => handleAction('APPROVED')}
          disabled={isSubmitting}
          activeOpacity={0.85}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={18} color="#FFF" />
              <Text style={styles.approveBtnText}>Phê Duyệt</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  navTitleBox: {
    alignItems: 'center',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitle: {
    fontSize: 16.5,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  navSubtitle: {
    fontSize: 11.5,
    color: '#94A3B8',
    marginTop: 1,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 15,
    color: '#94A3B8',
    fontWeight: '600',
    textAlign: 'center',
  },
  btnBackOutline: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#38BDF8',
    marginTop: 8,
  },
  btnBackOutlineText: {
    fontSize: 13,
    color: '#38BDF8',
    fontWeight: '700',
  },
  heroCard: {
    backgroundColor: '#1E293B',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  heroDeptBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 6,
    marginBottom: 14,
  },
  heroDeptText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#38BDF8',
  },
  transitionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  levelBox: {
    flex: 1,
    alignItems: 'center',
  },
  levelCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  levelCircleNum: {
    fontSize: 20,
    fontWeight: '900',
  },
  levelRoleLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  levelRoleName: {
    fontSize: 13.5,
    fontWeight: '800',
    textAlign: 'center',
  },
  transitionArrowBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  sectionCard: {
    backgroundColor: '#FFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  empHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
  },
  avatarFallback: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    fontSize: 19,
    fontWeight: '800',
  },
  levelBadgeMini: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFF',
  },
  levelBadgeMiniText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#FFF',
  },
  empMetaText: {
    fontSize: 12.5,
    color: '#64748B',
    marginTop: 3,
  },
  empDateText: {
    fontSize: 11.5,
    color: '#94A3B8',
    marginTop: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  statusRowLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  statusTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusTagText: {
    fontSize: 12,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  sectionHeaderBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  sectionIconBg: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionDesc: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 10,
    lineHeight: 16,
  },
  reportBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  reportText: {
    fontSize: 14,
    color: '#1E293B',
    lineHeight: 21,
  },
  counterBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  counterBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#64748B',
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  imageThumbWrapper: {
    width: '30.5%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  imageThumb: {
    width: '100%',
    height: '100%',
  },
  zoomBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageTapHint: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 8,
    fontStyle: 'italic',
  },
  noImagesBox: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    gap: 6,
  },
  noImagesText: {
    fontSize: 12.5,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  textArea: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#0F172A',
    minHeight: 100,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 12,
    gap: 5,
  },
  rejectBtn: {
    flex: 1,
    backgroundColor: '#FEE2E2',
  },
  rejectBtnText: {
    color: '#DC2626',
    fontWeight: '700',
    fontSize: 13,
  },
  supplementBtn: {
    flex: 1.1,
    backgroundColor: '#FEF3C7',
  },
  supplementBtnText: {
    color: '#D97706',
    fontWeight: '700',
    fontSize: 13,
  },
  approveBtn: {
    flex: 1.5,
    backgroundColor: '#16A34A',
    shadowColor: '#16A34A',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  approveBtnText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 14,
  },
  lightboxOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  lightboxSafeArea: {
    flex: 1,
    justifyContent: 'space-between',
  },
  lightboxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  lightboxHeaderBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightboxCounterBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  lightboxCounterText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
  lightboxImageContainer: {
    flex: 1,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightboxImage: {
    width: '100%',
    height: '100%',
  },
  lightboxNavBtn: {
    position: 'absolute',
    top: '50%',
    marginTop: -24,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  lightboxNavLeft: {
    left: 12,
  },
  lightboxNavRight: {
    right: 12,
  },
  lightboxFooter: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  lightboxFooterText: {
    fontSize: 13,
    color: '#94A3B8',
  },
});
