import React, { useState } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { uploadFile } from '../../api/uploads.api';
import { levelingApi } from '../../api/leveling.api';
import { LEVEL_COLORS } from '../../components/common/LevelNameBadge';

export const PromotionSubmissionScreen: React.FC = () => {
  const router = useRouter();
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

  const fromColor = LEVEL_COLORS[fromLevel] || '#FF9800';
  const toColor = LEVEL_COLORS[toLevel] || '#E91E63';

  const [note, setNote] = useState('');
  const [extraNote, setExtraNote] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const handlePickImage = async () => {
    try {
      if (selectedImages.length >= 6) {
        Alert.alert('Giới hạn ảnh', 'Bạn chỉ có thể đính kèm tối đa 6 ảnh minh chứng');
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
      Alert.alert('Lỗi tải ảnh', err?.message || 'Không thể tải ảnh lên máy chủ. Vui lòng thử lại.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleTakePhoto = async () => {
    try {
      if (selectedImages.length >= 6) {
        Alert.alert('Giới hạn ảnh', 'Bạn chỉ có thể đính kèm tối đa 6 ảnh minh chứng');
        return;
      }

      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Quyền truy cập', 'Vui lòng cấp quyền truy cập Camera để chụp ảnh trực tiếp');
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
      Alert.alert('Lỗi chụp ảnh', err?.message || 'Không thể chụp ảnh. Vui lòng thử lại.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!note.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tóm tắt thành tích và kết quả công việc nổi bật của bạn');
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

      Alert.alert('Thành công 🎉', 'Đề xuất thăng cấp đã được gửi tới Leader và Ban Quản trị xét duyệt!', [
        {
          text: 'Đồng ý',
          onPress: () => router.back(),
        },
      ]);
    } catch (err: any) {
      Alert.alert('Lỗi gửi đề xuất', err?.response?.data?.message || err?.message || 'Có lỗi xảy ra');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      {/* Top Navbar */}
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Đề Xuất Xét Thăng Cấp</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          {/* Target Transition Hero Card */}
          <View style={styles.heroCard}>
            <View style={styles.heroDeptBadge}>
              <Ionicons name="business" size={13} color="#38BDF8" />
              <Text style={styles.heroDeptText}>{deptName}</Text>
            </View>

            <View style={styles.transitionRow}>
              {/* From Level */}
              <View style={styles.levelBox}>
                <View style={[styles.levelCircle, { borderColor: fromColor, backgroundColor: `${fromColor}15` }]}>
                  <Text style={[styles.levelCircleNum, { color: fromColor }]}>{fromLevel}</Text>
                </View>
                <Text style={styles.levelRoleLabel}>Cấp hiện tại</Text>
                <Text style={[styles.levelRoleName, { color: fromColor }]} numberOfLines={1}>
                  {fromName}
                </Text>
              </View>

              {/* Arrow */}
              <View style={styles.transitionArrowBox}>
                <Ionicons name="arrow-forward" size={18} color="#94A3B8" />
              </View>

              {/* To Level */}
              <View style={styles.levelBox}>
                <View style={[styles.levelCircle, { borderColor: toColor, backgroundColor: `${toColor}20` }]}>
                  <Text style={[styles.levelCircleNum, { color: toColor }]}>{toLevel}</Text>
                </View>
                <Text style={styles.levelRoleLabel}>Mục tiêu xét duyệt</Text>
                <Text style={[styles.levelRoleName, { color: toColor }]} numberOfLines={1}>
                  {toName}
                </Text>
              </View>
            </View>
          </View>

          {/* Form Section 1: Self Evaluation & Achievements */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconBg, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="document-text" size={16} color="#2563EB" />
              </View>
              <Text style={styles.sectionTitle}>
                1. Tự Đánh Giá & Báo Cáo Thành Tích <Text style={{ color: '#EF4444' }}>*</Text>
              </Text>
            </View>
            <Text style={styles.sectionDesc}>
              Tóm tắt các ca làm, KPI hoàn thành, các dự án nổi bật hoặc đóng góp tiêu biểu của bạn trong kỳ vừa qua:
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
                <View style={[styles.sectionIconBg, { backgroundColor: '#ECFDF5' }]}>
                  <Ionicons name="images" size={16} color="#059669" />
                </View>
                <Text style={styles.sectionTitle}>2. Ảnh Bằng Chứng / Minh Chứng</Text>
              </View>

              <View style={styles.counterBadge}>
                <Text style={styles.counterBadgeText}>{selectedImages.length}/6 ảnh</Text>
              </View>
            </View>

            <Text style={styles.sectionDesc}>
              Đính kèm ảnh chụp báo cáo doanh số, bảng chấm công hoặc minh chứng hoàn thành nhiệm vụ:
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
                  <View style={[styles.actionPickIconCircle, { backgroundColor: '#EFF6FF' }]}>
                    <Ionicons name="camera" size={20} color="#2563EB" />
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
                  <View style={[styles.actionPickIconCircle, { backgroundColor: '#ECFDF5' }]}>
                    <Ionicons name="image" size={20} color="#059669" />
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
              <View style={styles.imageGrid}>
                {selectedImages.map((url, idx) => (
                  <View key={idx} style={styles.imageWrapper}>
                    <Image source={{ uri: url }} style={styles.imageThumb} />
                    <TouchableOpacity
                      style={styles.removeImgBtn}
                      onPress={() => handleRemoveImage(idx)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="close" size={14} color="#FFF" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Form Section 3: Extra Note */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconBg, { backgroundColor: '#F3E8FF' }]}>
                <Ionicons name="chatbox-ellipses" size={16} color="#7C3AED" />
              </View>
              <Text style={styles.sectionTitle}>3. Lời Nhắn Gửi Tới Leader (Tùy chọn)</Text>
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

          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom Sticky Action Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.btnCancel} onPress={() => router.back()} disabled={isSubmitting}>
          <Text style={styles.btnCancelText}>Quay lại</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btnSubmit, { backgroundColor: toColor }]}
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
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  container: {
    flex: 1,
    padding: 16,
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
  textArea: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#0F172A',
    minHeight: 110,
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
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  actionPickIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
    backgroundColor: '#1E293B',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    gap: 10,
  },
  btnCancel: {
    flex: 1,
    backgroundColor: '#334155',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  btnSubmit: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  btnSubmitText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFF',
  },
});
