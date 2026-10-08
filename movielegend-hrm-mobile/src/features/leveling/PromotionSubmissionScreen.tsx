import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { uploadFile } from '../../api/uploads.api';
import { levelingApi } from '../../api/leveling.api';
import { LEVEL_COLORS } from '../../components/common/LevelNameBadge';
import { CustomAlert } from '../../components/CustomAlert';

export const PromotionSubmissionScreen: React.FC = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const safeTopInset = Math.max(insets.top, Platform.OS === 'ios' ? 47 : (StatusBar.currentHeight || 24));
  const params = useLocalSearchParams<{
    fromLevelNumber?: string;
    fromLevelName?: string;
    toLevelNumber?: string;
    toLevelName?: string;
    departmentId?: string;
    departmentName?: string;
  }>();

  const fromLevel = Number(params.fromLevelNumber) || 1;
  const toLevel = Number(params.toLevelNumber) || fromLevel + 1;
  const fromName = params.fromLevelName || `Level ${fromLevel}`;
  const toName = params.toLevelName || `Level ${toLevel}`;
  const deptId = params.departmentId || '';
  const deptName = params.departmentName || 'Phòng ban';

  const fromColor = LEVEL_COLORS[fromLevel] || '#475569';
  const toColor = LEVEL_COLORS[toLevel] || '#2563EB';

  const [note, setNote] = useState('');
  const [extraNote, setExtraNote] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [previewImageIndex, setPreviewImageIndex] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const handlePickImage = async () => {
    try {
      if (selectedImages.length >= 6) {
        CustomAlert.alert('Giới hạn ảnh', 'Bạn chỉ có thể đính kèm tối đa 6 ảnh minh chứng');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]?.uri) {
        setIsUploadingImage(true);
        const asset = result.assets[0];
        const uploaded = await uploadFile({
          uri: asset.uri,
          name: `evidence_${Date.now()}.jpg`,
          mimeType: 'image/jpeg',
          purpose: 'KPI_EVIDENCE' as any,
        });

        if (uploaded?.fileUrl) {
          setSelectedImages((prev) => [...prev, uploaded.fileUrl]);
        }
      }
    } catch (err: any) {
      CustomAlert.alert('Lỗi tải ảnh', err?.message || 'Không thể tải ảnh lên máy chủ. Vui lòng thử lại.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleTakePhoto = async () => {
    try {
      if (selectedImages.length >= 6) {
        CustomAlert.alert('Giới hạn ảnh', 'Bạn chỉ có thể đính kèm tối đa 6 ảnh minh chứng');
        return;
      }

      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        CustomAlert.alert('Quyền truy cập', 'Vui lòng cấp quyền truy cập Camera để chụp ảnh trực tiếp');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]?.uri) {
        setIsUploadingImage(true);
        const asset = result.assets[0];
        const uploaded = await uploadFile({
          uri: asset.uri,
          name: `camera_evidence_${Date.now()}.jpg`,
          mimeType: 'image/jpeg',
          purpose: 'KPI_EVIDENCE' as any,
        });

        if (uploaded?.fileUrl) {
          setSelectedImages((prev) => [...prev, uploaded.fileUrl]);
        }
      }
    } catch (err: any) {
      CustomAlert.alert('Lỗi chụp ảnh', err?.message || 'Không thể chụp ảnh. Vui lòng thử lại.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!note.trim()) {
      CustomAlert.alert('Thiếu thông tin', 'Vui lòng nhập tóm tắt thành tích và kết quả công việc nổi bật của bạn');
      return;
    }

    try {
      setIsSubmitting(true);
      const fullNote = extraNote.trim()
        ? `${note.trim()}\n\n[Ghi chú thêm]: ${extraNote.trim()}`
        : note.trim();

      await levelingApi.submitPromotionRequest({
        fromLevelNumber: fromLevel,
        toLevelNumber: toLevel,
        submissionNote: fullNote,
        evidenceImages: selectedImages,
        departmentId: deptId || undefined,
      });

      CustomAlert.alert('Thành công', 'Đề xuất thăng cấp đã được gửi tới Leader và Ban Quản trị xét duyệt!', [
        {
          text: 'Đồng ý',
          onPress: () => router.back(),
        },
      ]);
    } catch (err: any) {
      CustomAlert.alert('Lỗi gửi đề xuất', err?.response?.data?.message || err?.message || 'Có lỗi xảy ra');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.safeArea, { paddingTop: safeTopInset }]}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      {/* Top Navbar */}
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Đề Xuất Xét Thăng Cấp</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: '#F8FAFC' }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Target Transition Hero Card */}
          <View style={styles.heroCard}>
            <View style={styles.heroDeptBadge}>
              <Ionicons name="business-outline" size={13} color="#2563EB" />
              <Text style={styles.heroDeptText}>{deptName}</Text>
            </View>

            <View style={styles.transitionRow}>
              {/* From Level */}
              <View style={styles.levelBox}>
                <View style={styles.fromLevelCircle}>
                  <Text style={styles.fromLevelCircleNum}>{fromLevel}</Text>
                </View>
                <Text style={styles.levelRoleLabel}>Cấp hiện tại</Text>
                <Text style={styles.fromLevelRoleName} numberOfLines={1}>
                  {fromName}
                </Text>
              </View>

              {/* Arrow */}
              <View style={styles.transitionArrowBox}>
                <Ionicons name="arrow-forward" size={16} color="#64748B" />
              </View>

              {/* To Level */}
              <View style={styles.levelBox}>
                <View style={styles.toLevelCircle}>
                  <Text style={styles.toLevelCircleNum}>{toLevel}</Text>
                </View>
                <Text style={styles.levelRoleLabel}>Mục tiêu xét duyệt</Text>
                <Text style={styles.toLevelRoleName} numberOfLines={1}>
                  {toName}
                </Text>
              </View>
            </View>
          </View>

          {/* Form Section 1: Self Evaluation & Achievements */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconBg}>
                <Ionicons name="document-text-outline" size={16} color="#2563EB" />
              </View>
              <Text style={styles.sectionTitle}>
                Báo Cáo Thành Tích & Tự Đánh Giá <Text style={{ color: '#EF4444' }}>*</Text>
              </Text>
            </View>
            <Text style={styles.sectionDesc}>
              Tóm tắt các ca làm, KPI hoàn thành, các dự án nổi bật hoặc đóng góp tiêu biểu trong kỳ xét duyệt:
            </Text>
            <TextInput
              style={styles.textArea}
              placeholder="Ví dụ: Đã hoàn thành 100% chỉ tiêu KPI 3 tháng liên tiếp, hỗ trợ đào tạo 2 nhân sự mới, duy trì đi làm đúng giờ không vi phạm kỷ luật..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              value={note}
              onChangeText={setNote}
            />
          </View>

          {/* Form Section 2: Evidence Images */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderBetween}>
              <View style={styles.sectionHeaderLeft}>
                <View style={styles.sectionIconBg}>
                  <Ionicons name="images-outline" size={16} color="#2563EB" />
                </View>
                <Text style={styles.sectionTitle}>Hồ Sơ & Ảnh Minh Chứng</Text>
              </View>

              <View style={styles.counterBadge}>
                <Text style={styles.counterBadgeText}>{selectedImages.length}/6 ảnh</Text>
              </View>
            </View>

            <Text style={styles.sectionDesc}>
              Đính kèm ảnh chụp báo cáo doanh số, bảng chấm công hoặc minh chứng kết quả công việc:
            </Text>

            {/* Two Spacious Action Cards */}
            {selectedImages.length < 6 && (
              <View style={styles.uploadActionRow}>
                <TouchableOpacity
                  style={styles.actionPickBtn}
                  onPress={handleTakePhoto}
                  disabled={isUploadingImage}
                  activeOpacity={0.75}
                >
                  <View style={styles.actionPickIconCircle}>
                    <Ionicons name="camera-outline" size={18} color="#2563EB" />
                  </View>
                  <View style={styles.actionPickTextBox}>
                    <Text style={styles.actionPickTitle}>Chụp ảnh mới</Text>
                    <Text style={styles.actionPickSubtitle}>Mở Camera</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionPickBtn}
                  onPress={handlePickImage}
                  disabled={isUploadingImage}
                  activeOpacity={0.75}
                >
                  <View style={styles.actionPickIconCircle}>
                    <Ionicons name="image-outline" size={18} color="#2563EB" />
                  </View>
                  <View style={styles.actionPickTextBox}>
                    <Text style={styles.actionPickTitle}>Thư viện ảnh</Text>
                    <Text style={styles.actionPickSubtitle}>Chọn từ máy</Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}

            {isUploadingImage && (
              <View style={styles.uploadingBox}>
                <ActivityIndicator size="small" color="#2563EB" />
                <Text style={styles.uploadingText}>Đang tải ảnh lên máy chủ...</Text>
              </View>
            )}

            {/* Images Grid */}
            {selectedImages.length > 0 && (
              <View>
                <View style={styles.imageGrid}>
                  {selectedImages.map((url, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={styles.imageWrapper}
                      onPress={() => setPreviewImageIndex(idx)}
                      activeOpacity={0.85}
                    >
                      <Image source={{ uri: url }} style={styles.imageThumb} />
                      <View style={styles.zoomBadge}>
                        <Ionicons name="scan-outline" size={13} color="#FFF" />
                      </View>
                      <TouchableOpacity
                        style={styles.removeImgBtn}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleRemoveImage(idx);
                        }}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="close" size={14} color="#FFF" />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.imageTapHint}>Chạm vào ảnh để xem kích thước lớn</Text>
              </View>
            )}
          </View>

          {/* Form Section 3: Extra Note */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconBg}>
                <Ionicons name="chatbox-ellipses-outline" size={16} color="#2563EB" />
              </View>
              <Text style={styles.sectionTitle}>Ghi Chú Thêm Cho Quản Lý (Tùy chọn)</Text>
            </View>
            <TextInput
              style={[styles.textArea, { minHeight: 70 }]}
              placeholder="Nguyện vọng hoặc đề xuất bổ sung nếu có..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              value={extraNote}
              onChangeText={setExtraNote}
            />
          </View>

          <View style={{ height: 100 + Math.max(insets.bottom, 24) }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Fullscreen Image Preview Lightbox Modal */}
      {previewImageIndex !== null && selectedImages[previewImageIndex] && (
        <Modal
          visible={previewImageIndex !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setPreviewImageIndex(null)}
        >
          <View style={styles.lightboxOverlay}>
            <View style={[styles.lightboxSafeArea, { paddingTop: safeTopInset, paddingBottom: Math.max(insets.bottom, 16) }]}>
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
                    {previewImageIndex + 1} / {selectedImages.length}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.lightboxHeaderBtn, { backgroundColor: 'rgba(239, 68, 68, 0.25)' }]}
                  onPress={() => {
                    const idxToRemove = previewImageIndex;
                    handleRemoveImage(idxToRemove);
                    if (selectedImages.length <= 1) {
                      setPreviewImageIndex(null);
                    } else if (idxToRemove >= selectedImages.length - 1) {
                      setPreviewImageIndex(selectedImages.length - 2);
                    }
                  }}
                >
                  <Ionicons name="trash-outline" size={20} color="#EF4444" />
                </TouchableOpacity>
              </View>

              {/* Lightbox Center Image & Navigation */}
              <View style={styles.lightboxImageContainer}>
                {selectedImages.length > 1 && previewImageIndex > 0 && (
                  <TouchableOpacity
                    style={[styles.lightboxNavBtn, styles.lightboxNavLeft]}
                    onPress={() => setPreviewImageIndex((prev) => (prev !== null ? prev - 1 : 0))}
                  >
                    <Ionicons name="chevron-back" size={24} color="#FFF" />
                  </TouchableOpacity>
                )}

                <Image
                  source={{ uri: selectedImages[previewImageIndex] }}
                  style={styles.lightboxImage}
                  resizeMode="contain"
                />

                {selectedImages.length > 1 && previewImageIndex < selectedImages.length - 1 && (
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
                <Text style={styles.lightboxFooterText}>Ảnh minh chứng xét duyệt thăng cấp</Text>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Bottom Sticky Action Bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 12) + 6 }]}>
        <TouchableOpacity style={styles.btnCancel} onPress={() => router.back()} disabled={isSubmitting}>
          <Text style={styles.btnCancelText}>Quay lại</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.btnSubmit,
            (isSubmitting || isUploadingImage) && { opacity: 0.6 },
          ]}
          onPress={handleSubmit}
          disabled={isSubmitting || isUploadingImage}
          activeOpacity={0.85}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <Ionicons name="paper-plane" size={18} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.btnSubmitText}>Gửi Đề Xuất Cho Leader</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
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
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 16,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  heroDeptBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 5,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  heroDeptText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#1D4ED8',
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
  fromLevelCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    borderColor: '#334155',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  fromLevelCircleNum: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1E293B',
  },
  fromLevelRoleName: {
    fontSize: 13.5,
    fontWeight: '800',
    textAlign: 'center',
    color: '#0F172A',
  },
  toLevelCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  toLevelCircleNum: {
    fontSize: 18,
    fontWeight: '900',
    color: '#2563EB',
  },
  toLevelRoleName: {
    fontSize: 13.5,
    fontWeight: '800',
    textAlign: 'center',
    color: '#1E40AF',
  },
  levelRoleLabel: {
    fontSize: 10.5,
    color: '#94A3B8',
    fontWeight: '600',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  transitionArrowBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  sectionHeaderBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
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
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionDesc: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 10,
    lineHeight: 16,
  },
  textArea: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    padding: 12,
    fontSize: 13.5,
    color: '#0F172A',
    minHeight: 110,
  },
  counterBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  counterBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },
  uploadActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  actionPickBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  actionPickIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionPickTextBox: {
    flex: 1,
  },
  actionPickTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  actionPickSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  uploadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  uploadingText: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '600',
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  imageWrapper: {
    position: 'relative',
    width: '30.5%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  imageThumb: {
    width: '100%',
    height: '100%',
  },
  removeImgBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
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
    marginTop: 6,
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
  dropzoneTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    marginTop: 6,
  },
  dropzoneSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 10,
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -2 },
    elevation: 6,
  },
  btnCancel: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  btnCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  btnSubmit: {
    flex: 2,
    flexDirection: 'row',
    backgroundColor: '#2563EB',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  btnSubmitText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFF',
  },
});
