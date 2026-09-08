import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { uploadFile } from '../../api/uploads.api';
import { levelingApi } from '../../api/leveling.api';
import { LEVEL_COLORS } from '../../components/common/LevelNameBadge';

interface EvidenceSubmissionModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentLevelNumber: number;
  currentLevelName: string;
  nextLevelNumber: number;
  nextLevelName: string;
  departmentId?: string;
}

export const EvidenceSubmissionModal: React.FC<EvidenceSubmissionModalProps> = ({
  visible,
  onClose,
  onSuccess,
  currentLevelNumber,
  currentLevelName,
  nextLevelNumber,
  nextLevelName,
  departmentId,
}) => {
  const [note, setNote] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const nextColor = LEVEL_COLORS[nextLevelNumber] || '#4CAF50';

  const handlePickImage = async () => {
    try {
      if (selectedImages.length >= 6) {
        Alert.alert('Giới hạn', 'Bạn chỉ có thể đính kèm tối đa 6 ảnh minh chứng');
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
      Alert.alert('Lỗi tải ảnh', err?.message || 'Không thể tải ảnh lên. Vui lòng thử lại.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleTakePhoto = async () => {
    try {
      if (selectedImages.length >= 6) {
        Alert.alert('Giới hạn', 'Bạn chỉ có thể đính kèm tối đa 6 ảnh minh chứng');
        return;
      }

      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Quyền truy cập', 'Vui lòng cấp quyền truy cập Camera để chụp ảnh');
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
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tóm tắt thành tích và kết quả công việc');
      return;
    }

    try {
      setIsSubmitting(true);
      await levelingApi.submitPromotionRequest({
        fromLevelNumber: currentLevelNumber,
        toLevelNumber: nextLevelNumber,
        submissionNote: note.trim(),
        evidenceImages: selectedImages,
        departmentId,
      });

      Alert.alert('Thành công', 'Đề xuất thăng cấp đã được gửi tới Leader bộ phận để xét duyệt!');
      setNote('');
      setSelectedImages([]);
      onSuccess();
      onClose();
    } catch (err: any) {
      Alert.alert('Lỗi gửi đề xuất', err?.response?.data?.message || err?.message || 'Có lỗi xảy ra');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Đề Xuất Xét Thăng Cấp</Text>
              <Text style={styles.subtitle}>
                Từ {currentLevelName} ➔ <Text style={{ color: nextColor, fontWeight: '700' }}>{nextLevelName}</Text>
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Note Input */}
            <Text style={styles.label}>
              1. Tự đánh giá & Thành tích nổi bật <Text style={{ color: '#EF4444' }}>*</Text>
            </Text>
            <TextInput
              style={styles.textArea}
              placeholder="Tóm tắt các ca làm, dự án, doanh số hoặc thành tích nổi bật của bạn..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={4}
              value={note}
              onChangeText={setNote}
            />

            {/* Evidence Images */}
            <View style={styles.imageSectionHeader}>
              <Text style={styles.label}>2. Ảnh bằng chứng / Minh chứng ({selectedImages.length}/6)</Text>
              <View style={styles.imageActionRow}>
                <TouchableOpacity
                  style={styles.smallActionBtn}
                  onPress={handleTakePhoto}
                  disabled={isUploadingImage}
                >
                  <Ionicons name="camera" size={16} color="#2563EB" />
                  <Text style={styles.smallActionText}>Chụp ảnh</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.smallActionBtn}
                  onPress={handlePickImage}
                  disabled={isUploadingImage}
                >
                  <Ionicons name="images" size={16} color="#2563EB" />
                  <Text style={styles.smallActionText}>Chọn ảnh</Text>
                </TouchableOpacity>
              </View>
            </View>

            {isUploadingImage && (
              <View style={styles.uploadingBox}>
                <ActivityIndicator size="small" color="#2563EB" />
                <Text style={styles.uploadingText}>Đang tải ảnh lên máy chủ...</Text>
              </View>
            )}

            {/* Image Grid */}
            <View style={styles.imageGrid}>
              {selectedImages.map((url, idx) => (
                <View key={idx} style={styles.imageThumbWrapper}>
                  <Image source={{ uri: url }} style={styles.imageThumb} />
                  <TouchableOpacity
                    style={styles.removeImageBtn}
                    onPress={() => handleRemoveImage(idx)}
                  >
                    <Ionicons name="close-circle" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}

              {selectedImages.length === 0 && !isUploadingImage && (
                <TouchableOpacity style={styles.emptyImageBox} onPress={handlePickImage}>
                  <Ionicons name="cloud-upload-outline" size={32} color="#94A3B8" />
                  <Text style={styles.emptyImageText}>Chạm để đính kèm ảnh chụp màn hình minh chứng</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={isSubmitting}>
              <Text style={styles.cancelBtnText}>Hủy bỏ</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: nextColor }]}
              onPress={handleSubmit}
              disabled={isSubmitting || isUploadingImage}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Ionicons name="paper-plane" size={18} color="#FFF" style={{ marginRight: 6 }} />
                  <Text style={styles.submitBtnText}>Gửi Cho Leader</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 30 : 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  imageSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  imageActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  smallActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  smallActionText: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '600',
  },
  uploadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDF4',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    gap: 8,
  },
  uploadingText: {
    fontSize: 13,
    color: '#16A34A',
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  imageThumbWrapper: {
    width: '30%',
    aspectRatio: 1,
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
  removeImageBtn: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#FFF',
    borderRadius: 10,
  },
  emptyImageBox: {
    width: '100%',
    height: 110,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    padding: 12,
  },
  emptyImageText: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 6,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
  },
  submitBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },
});
