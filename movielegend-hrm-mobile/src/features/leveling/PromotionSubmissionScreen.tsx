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
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { uploadFile } from '../../api/uploads.api';
import { levelingApi } from '../../api/leveling.api';
import { CustomAlert } from '../../components/CustomAlert';

export const PromotionSubmissionScreen: React.FC = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const safeTopInset = Math.max((insets.top > 0 ? insets.top : (StatusBar.currentHeight || 20)) - 6, 8);
  const params = useLocalSearchParams<{
    fromLevelNumber?: string;
    fromLevelName?: string;
    toLevelNumber?: string;
    toLevelName?: string;
    departmentId?: string;
    departmentName?: string;
  }>();

  const fromLevel = Number(params.fromLevelNumber) || 2;
  const toLevel = Number(params.toLevelNumber) || fromLevel + 1;
  const fromName = params.fromLevelName || (fromLevel === 2 ? 'Chính thức' : `Level ${fromLevel}`);
  const toName = params.toLevelName || (toLevel === 3 ? 'Senior' : `Level ${toLevel}`);
  const deptId = params.departmentId || '';
  const deptName = params.departmentName || 'DEV (MOVIELEGEND-HÀ NỘI)';

  const formattedFromNum = String(fromLevel).padStart(2, '0');
  const formattedToNum = String(toLevel).padStart(2, '0');

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
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Navbar matching template */}
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color="#18181B" />
        </TouchableOpacity>
        <View style={styles.navTitleContainer}>
          <Text style={styles.navTitleText}>Đề xuất thăng cấp</Text>
        </View>
        <View style={{ width: 32 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: '#FAFAFA' }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Department Row */}
          <View style={styles.deptRow}>
            <Ionicons name="business" size={16} color="#059669" />
            <Text style={styles.deptText}>{deptName}</Text>
          </View>

          {/* Transition Card: [02] Chính thức → (03) Senior */}
          <View style={styles.transitionCard}>
            <View style={styles.levelBadgeFilled}>
              <Text style={styles.levelBadgeFilledText}>{formattedFromNum}</Text>
            </View>
            <Text style={styles.levelNameText}>{fromName}</Text>

            <Ionicons name="arrow-forward" size={18} color="#71717A" style={{ marginHorizontal: 10 }} />

            <View style={styles.levelBadgeOutlined}>
              <Text style={styles.levelBadgeOutlinedText}>{formattedToNum}</Text>
            </View>
            <Text style={styles.levelNameText}>{toName}</Text>
          </View>

          {/* Section 01: Thành tích & tự đánh giá */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.stepNumCircle}>
                <Text style={styles.stepNumText}>01</Text>
              </View>
              <Text style={styles.sectionTitle}>
                Thành tích & tự đánh giá <Text style={styles.requiredStar}>*</Text>
              </Text>
            </View>

            <Text style={styles.sectionDesc}>
              Tóm tắt các ca làm, KPI hoàn thành, các dự án nổi bật hoặc đóng góp tiêu biểu trong kỳ xét duyệt:
            </Text>

            <TextInput
              style={styles.textArea}
              placeholder="Ví dụ: Đã hoàn thành 100% chỉ tiêu KPI 3 tháng liên tiếp, hỗ trợ đào tạo 2 nhân sự mới, duy trì đi làm đúng giờ không vi phạm kỷ luật..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              value={note}
              onChangeText={setNote}
            />
          </View>

          {/* Section 02: Ảnh minh chứng */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderBetween}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.stepNumCircle}>
                  <Text style={styles.stepNumText}>02</Text>
                </View>
                <Text style={styles.sectionTitle}>Ảnh minh chứng</Text>
              </View>
              <View style={styles.counterBadge}>
                <Text style={styles.counterText}>{selectedImages.length}/6 ảnh</Text>
              </View>
            </View>

            <Text style={styles.sectionDesc}>
              Đính kèm ảnh chụp báo cáo doanh số, bảng chấm công hoặc minh chứng kết quả công việc:
            </Text>

            {/* Dropzone Box matching template */}
            <TouchableOpacity
              style={styles.uploadDropZone}
              onPress={handlePickImage}
              disabled={isUploadingImage || selectedImages.length >= 6}
              activeOpacity={0.75}
            >
              <View style={styles.uploadIconContainer}>
                <Ionicons name="images-outline" size={32} color="#059669" />
              </View>
              <Text style={styles.uploadMainText}>
                Chưa có ảnh nào. Hãy thêm ảnh minh chứng để bổ sung cho kết quả công việc của bạn.
              </Text>
            </TouchableOpacity>

            {/* Two Action Buttons: Chụp ảnh & Thư viện ảnh */}
            <View style={styles.uploadButtonsRow}>
              <TouchableOpacity
                style={styles.uploadSmallBtn}
                onPress={handleTakePhoto}
                disabled={isUploadingImage || selectedImages.length >= 6}
                activeOpacity={0.75}
              >
                <Ionicons name="camera-outline" size={18} color="#18181B" />
                <Text style={styles.uploadSmallBtnText}>Chụp ảnh</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.uploadSmallBtn}
                onPress={handlePickImage}
                disabled={isUploadingImage || selectedImages.length >= 6}
                activeOpacity={0.75}
              >
                <Ionicons name="images-outline" size={18} color="#18181B" />
                <Text style={styles.uploadSmallBtnText}>Thư viện ảnh</Text>
              </TouchableOpacity>
            </View>

            {isUploadingImage && (
              <View style={styles.uploadingBox}>
                <ActivityIndicator size="small" color="#102739" />
                <Text style={styles.uploadingText}>Đang tải ảnh lên máy chủ...</Text>
              </View>
            )}

            {/* Image Previews */}
            {selectedImages.length > 0 && (
              <View style={styles.imageGrid}>
                {selectedImages.map((url, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.imageThumbWrapper}
                    onPress={() => setPreviewImageIndex(idx)}
                    activeOpacity={0.85}
                  >
                    <Image source={{ uri: url }} style={styles.imageThumb} />
                    <TouchableOpacity
                      style={styles.removeImgBtn}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleRemoveImage(idx);
                      }}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="close" size={13} color="#FFF" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Section 03: Ghi chú cho quản lý */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.stepNumCircle}>
                <Text style={styles.stepNumText}>03</Text>
              </View>
              <Text style={styles.sectionTitle}>Ghi chú cho quản lý (Tùy chọn)</Text>
            </View>

            <TextInput
              style={[styles.textArea, { minHeight: 70 }]}
              placeholder="Nhập ghi chú, mong muốn hoặc thông tin bổ sung..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              value={extraNote}
              onChangeText={setExtraNote}
            />
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Lightbox Modal */}
      {previewImageIndex !== null && selectedImages[previewImageIndex] && (
        <Modal
          visible={previewImageIndex !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setPreviewImageIndex(null)}
        >
          <View style={styles.lightboxOverlay}>
            <View style={[styles.lightboxSafeArea, { paddingTop: safeTopInset, paddingBottom: Math.max(insets.bottom, 16) }]}>
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

              <View style={styles.lightboxFooter}>
                <Text style={styles.lightboxFooterText}>Ảnh minh chứng xét duyệt thăng cấp</Text>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Bottom Sticky Action Bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 12) + 6 }]}>
        <TouchableOpacity style={styles.btnBack} onPress={() => router.back()} disabled={isSubmitting}>
          <Ionicons name="arrow-back" size={16} color="#18181B" style={{ marginRight: 6 }} />
          <Text style={styles.btnBackText}>Quay lại</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.btnSubmit,
            (isSubmitting || isUploadingImage) && { opacity: 0.6 },
          ]}
          onPress={handleSubmit}
          disabled={isSubmitting || isUploadingImage}
          activeOpacity={0.88}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <Ionicons name="paper-plane" size={16} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.btnSubmitText}>Gửi đề xuất cho Leader</Text>
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
    backgroundColor: '#FFFFFF',
  },
  /* Top Navbar */
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F4F4F5',
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  navTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  navTitleText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#18181B',
  },

  /* Scroll Content */
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },

  /* Department Row */
  deptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  deptText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
  },

  /* Transition Card: [02] Chính thức → (03) Senior */
  transitionCard: {
    backgroundColor: '#EBF7EE',
    borderWidth: 1,
    borderColor: '#C6E7D0',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  levelBadgeFilled: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#102739',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  levelBadgeFilledText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  levelBadgeOutlined: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: '#102739',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  levelBadgeOutlinedText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#102739',
  },
  levelNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#18181B',
  },

  /* Sections */
  sectionContainer: {
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionHeaderBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepNumCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F7EDE2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  stepNumText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#78350F',
  },
  sectionTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#18181B',
  },
  requiredStar: {
    color: '#EF4444',
    fontSize: 15,
    marginLeft: 3,
  },
  sectionDesc: {
    fontSize: 12,
    color: '#71717A',
    marginTop: 4,
    marginBottom: 10,
    lineHeight: 16,
  },
  counterBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  counterText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#6B7280',
  },

  /* Textarea */
  textArea: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E4E7',
    borderRadius: 14,
    padding: 14,
    fontSize: 13,
    color: '#18181B',
    lineHeight: 19,
  },

  /* Drop Zone */
  uploadDropZone: {
    borderStyle: 'dashed',
    borderWidth: 1.5,
    borderColor: '#C3E0CC',
    borderRadius: 16,
    backgroundColor: '#F7FCF8',
    paddingVertical: 22,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  uploadIconContainer: {
    marginBottom: 8,
  },
  uploadMainText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 17,
    paddingHorizontal: 16,
  },

  /* Upload Small Buttons Row */
  uploadButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  uploadSmallBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E4E7',
    borderRadius: 12,
    height: 44,
    gap: 6,
  },
  uploadSmallBtnText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#18181B',
  },

  uploadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  uploadingText: {
    fontSize: 12.5,
    color: '#64748B',
  },

  /* Image Grid */
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 6,
  },
  imageThumbWrapper: {
    width: 72,
    height: 72,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  imageThumb: {
    width: '100%',
    height: '100%',
  },
  removeImgBtn: {
    position: 'absolute',
    top: 3,
    right: 3,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Lightbox */
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
    paddingVertical: 10,
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
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  lightboxCounterText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
  lightboxImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  lightboxImage: {
    width: '100%',
    height: '80%',
  },
  lightboxNavBtn: {
    position: 'absolute',
    top: '45%',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
    paddingVertical: 12,
    alignItems: 'center',
  },
  lightboxFooterText: {
    color: '#94A3B8',
    fontSize: 12,
  },

  /* Bottom Bar */
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E4E4E7',
    gap: 12,
  },
  btnBack: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E4E7',
  },
  btnBackText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#18181B',
  },
  btnSubmit: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 14,
    backgroundColor: '#102739',
  },
  btnSubmitText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
