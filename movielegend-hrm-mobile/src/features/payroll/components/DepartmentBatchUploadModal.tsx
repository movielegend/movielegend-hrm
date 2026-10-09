import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { CustomAlert } from '../../../components/CustomAlert';
import { uploadFile } from '../../../api/uploads.api';
import { uploadDepartmentPayslipBatch } from '../../../api/payroll.api';
import type { Department } from '../../../types/department.types';

interface Props {
  visible: boolean;
  onClose: () => void;
  month: number;
  year: number;
  departments: Department[];
  onSuccess: () => void;
}

export function DepartmentBatchUploadModal({
  visible,
  onClose,
  month,
  year,
  departments,
  onSuccess,
}: Props) {
  const [selectedDeptId, setSelectedDeptId] = useState<string>(departments[0]?.id || '');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);

  const handlePickImages = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        CustomAlert.alert('Cần quyền', 'Vui lòng cho phép truy cập thư viện ảnh để tải lên');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newUris = result.assets.map((a) => a.uri);
        setSelectedImages((prev) => [...prev, ...newUris]);
      }
    } catch (err: any) {
      CustomAlert.alert('Lỗi', err.message || 'Không thể mở thư viện ảnh');
    }
  };

  const handleRemoveImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearAll = () => {
    setSelectedImages([]);
  };

  const handleSubmit = async () => {
    if (!selectedDeptId) {
      CustomAlert.alert('Chưa chọn phòng ban', 'Vui lòng chọn phòng ban cần tải ảnh phiếu lương');
      return;
    }
    if (selectedImages.length === 0) {
      CustomAlert.alert('Chưa chọn ảnh', 'Vui lòng chọn ít nhất 1 ảnh phiếu lương để tải lên');
      return;
    }

    setIsUploading(true);
    setUploadProgress({ current: 0, total: selectedImages.length });

    try {
      const uploadedUrls: string[] = [];

      for (let i = 0; i < selectedImages.length; i++) {
        setUploadProgress({ current: i + 1, total: selectedImages.length });
        const localUri = selectedImages[i];
        if (!localUri) continue;
        const res = await uploadFile({
          uri: localUri,
          name: `batch_dept_${selectedDeptId}_${month}_${year}_${i + 1}.jpg`,
          mimeType: 'image/jpeg',
          purpose: 'EMPLOYEE_DOCUMENT',
        });
        const finalUrl = res.fileUrl || (res as any).url;
        if (finalUrl) {
          uploadedUrls.push(finalUrl);
        }
      }

      await uploadDepartmentPayslipBatch({
        departmentId: selectedDeptId,
        month,
        year,
        imageUrls: uploadedUrls,
      });

      const selectedDept = departments.find((d) => d.id === selectedDeptId);
      CustomAlert.alert(
        'Thành công 🎉',
        `Đã tải lên ${uploadedUrls.length} ảnh phiếu lương tháng ${month}/${year} cho phòng ${selectedDept?.name || ''}. Leader phòng ban đã nhận được thông báo để gán nhãn.`
      );

      setSelectedImages([]);
      onSuccess();
      onClose();
    } catch (err: any) {
      CustomAlert.alert('Lỗi tải lên', err.message || 'Có lỗi xảy ra khi tải lên lô ảnh phiếu lương');
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons name="folder-upload" size={22} color="#059669" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>Tải lô ảnh phiếu lương</Text>
                <Text style={styles.subtitle}>Tháng {month} / Năm {year}</Text>
              </View>
            </View>
            <Pressable onPress={onClose} hitSlop={8} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={20} color="#64748B" />
            </Pressable>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* 1. Chọn phòng ban */}
            <Text style={styles.sectionLabel}>1. Chọn phòng ban nhận ảnh:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.deptScroll}>
              {departments.map((dept) => {
                const isSelected = selectedDeptId === dept.id;
                return (
                  <Pressable
                    key={dept.id}
                    style={[styles.deptChip, isSelected && styles.deptChipActive]}
                    onPress={() => setSelectedDeptId(dept.id)}
                  >
                    <MaterialCommunityIcons
                      name={isSelected ? 'check-circle' : 'office-building'}
                      size={15}
                      color={isSelected ? '#059669' : '#64748B'}
                    />
                    <Text style={[styles.deptChipText, isSelected && styles.deptChipTextActive]}>
                      {dept.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* 2. Chọn ảnh */}
            <View style={styles.pickSectionHeader}>
              <Text style={styles.sectionLabel}>
                2. Chọn ảnh phiếu lương ({selectedImages.length} ảnh):
              </Text>
              {selectedImages.length > 0 && (
                <Pressable onPress={handleClearAll}>
                  <Text style={styles.clearAllText}>Xóa tất cả</Text>
                </Pressable>
              )}
            </View>

            <Pressable style={styles.uploadArea} onPress={handlePickImages} disabled={isUploading}>
              <MaterialCommunityIcons name="image-multiple" size={32} color="#059669" />
              <Text style={styles.uploadAreaTitle}>+ Chọn nhiều ảnh từ thư viện</Text>
              <Text style={styles.uploadAreaDesc}>
                Bạn có thể chọn cùng lúc 10-30 ảnh hàng lương đã chụp
              </Text>
            </Pressable>

            {/* Preview Grid */}
            {selectedImages.length > 0 && (
              <View style={styles.imageGrid}>
                {selectedImages.map((uri, idx) => (
                  <View key={uri + idx} style={styles.imageThumbCard}>
                    <Image source={{ uri }} style={styles.imageThumb} resizeMode="cover" />
                    <View style={styles.thumbIndexBadge}>
                      <Text style={styles.thumbIndexText}>#{idx + 1}</Text>
                    </View>
                    <Pressable
                      style={styles.removeThumbBtn}
                      onPress={() => handleRemoveImage(idx)}
                      hitSlop={6}
                    >
                      <MaterialCommunityIcons name="close-circle" size={20} color="#EF4444" />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}

            {/* Progress bar khi đang upload */}
            {isUploading && uploadProgress && (
              <View style={styles.progressCard}>
                <ActivityIndicator size="small" color="#059669" />
                <Text style={styles.progressText}>
                  Đang tải lên ảnh {uploadProgress.current}/{uploadProgress.total}...
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footerRow}>
            <Pressable style={styles.cancelBtn} onPress={onClose} disabled={isUploading}>
              <Text style={styles.cancelBtnText}>Đóng</Text>
            </Pressable>
            <Pressable
              style={[
                styles.submitBtn,
                (selectedImages.length === 0 || isUploading) && styles.submitBtnDisabled,
              ]}
              onPress={handleSubmit}
              disabled={selectedImages.length === 0 || isUploading}
            >
              {isUploading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <MaterialCommunityIcons name="send-check" size={16} color="#fff" />
                  <Text style={styles.submitBtnText}>
                    Tải lên & Gửi Leader ({selectedImages.length})
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxHeight: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
  },
  deptScroll: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  deptChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 8,
  },
  deptChipActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#059669',
  },
  deptChipText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  deptChipTextActive: {
    color: '#059669',
    fontWeight: '700',
  },
  pickSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clearAllText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '600',
  },
  uploadArea: {
    borderWidth: 2,
    borderColor: '#A7F3D0',
    borderStyle: 'dashed',
    borderRadius: 14,
    backgroundColor: '#F0FDF4',
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  uploadAreaTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#059669',
    marginTop: 6,
  },
  uploadAreaDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    textAlign: 'center',
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  imageThumbCard: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#F1F5F9',
  },
  imageThumb: {
    width: '100%',
    height: '100%',
  },
  thumbIndexBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  thumbIndexText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  removeThumbBtn: {
    position: 'absolute',
    top: 3,
    right: 3,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
  },
  progressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ECFDF5',
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#FAFAFA',
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#059669',
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
