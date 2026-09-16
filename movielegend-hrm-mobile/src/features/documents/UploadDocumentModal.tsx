import React, { useState, useMemo } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../providers/AuthProvider';
import { useAppAlert } from '../../contexts/AlertContext';
import { getDepartments } from '../../api/departments.api';
import { uploadFile } from '../../api/uploads.api';
import { useCreateDepartmentDocument } from '../../api/department-documents.api';
import { SelectModal, SelectOption } from '../../components/SelectModal';

import { CATEGORIES as ALL_CATEGORIES } from './document.utils';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentDepartmentId?: string | null;
}

const CATEGORIES: SelectOption[] = ALL_CATEGORIES.filter((c) => c.value !== 'ALL').map((c) => ({
  id: c.value,
  value: c.value,
  label: c.label,
}));

export function UploadDocumentModal({ visible, onClose, onSuccess, currentDepartmentId }: Props) {
  const { user } = useAuth();
  const { showAlert } = useAppAlert();
  const createMutation = useCreateDepartmentDocument();

  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('QUY_DINH');
  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(currentDepartmentId || null);

  const [isUploading, setIsUploading] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showDeptModal, setShowDeptModal] = useState(false);

  // Lấy danh sách phòng ban mà user có quyền truy cập
  const { data: deptData } = useQuery({
    queryKey: ['departments'],
    queryFn: () => getDepartments({ limit: 100 }),
  });

  const isHR = Boolean(user?.roles?.includes('HR'));
  const isGlobalAdmin = (user?.roles?.includes('ADMIN') && user?.scopes?.some(
    (s: any) => s.role === 'ADMIN' && (s.scopeType === 'GLOBAL' || !s.scopeType)
  )) || Boolean(user?.roles?.includes('SUPER_ADMIN'));
  const isRegionAdmin = Boolean(user?.roles?.includes('ADMIN') && user?.scopes?.some(
    (s: any) => s.role === 'ADMIN' && s.scopeType === 'REGION'
  ));
  const isLeader = Boolean(user?.roles?.includes('LEADER'));

  const canPostCompanyWide = isGlobalAdmin || isHR;

  const departmentOptions: SelectOption[] = useMemo(() => {
    const opts: SelectOption[] = [];
    if (canPostCompanyWide) {
      opts.push({ id: '__ALL__', value: '__ALL__', label: 'Toàn công ty (Tất cả phòng ban)' });
    } else if (isRegionAdmin) {
      opts.push({ id: '__REGION_ALL__', value: '__REGION_ALL__', label: 'Toàn miền (Tất cả phòng ban trong miền)' });
    }

    let items = deptData?.items || [];
    if (canPostCompanyWide) {
      // Super Admin & HR: xem và đăng cho toàn bộ các phòng ban
    } else if (isRegionAdmin) {
      const regionIds = user?.scopes
        ?.filter((s: any) => s.role === 'ADMIN' && s.scopeType === 'REGION' && s.scopeId)
        .map((s: any) => s.scopeId) || [];
      items = items.filter((d) => d.branch?.region?.id && regionIds.includes(d.branch.region.id));
    } else if (isLeader) {
      const leaderDeptIds = user?.scopes
        ?.filter((s: any) => s.role === 'LEADER' && s.scopeType === 'DEPARTMENT' && s.scopeId)
        .map((s: any) => s.scopeId) || [];
      items = items.filter((d) => leaderDeptIds.includes(d.id) || d.leaderUserId === user?.id);
    }

    items.forEach((d) => {
      const branchName = d.branch?.name ? ` (${d.branch.name})` : '';
      opts.push({ id: d.id, value: d.id, label: `${d.name}${branchName}` });
    });
    return opts;
  }, [deptData, canPostCompanyWide, isRegionAdmin, isLeader, user]);

  React.useEffect(() => {
    if (!selectedDeptId) {
      if (canPostCompanyWide) {
        setSelectedDeptId(currentDepartmentId || '__ALL__');
      } else if (isRegionAdmin) {
        setSelectedDeptId(currentDepartmentId || '__REGION_ALL__');
      } else if (departmentOptions.length === 1 && departmentOptions[0]) {
        setSelectedDeptId(departmentOptions[0].value || null);
      }
    }
  }, [departmentOptions, canPostCompanyWide, isRegionAdmin, selectedDeptId, currentDepartmentId]);

  const handlePickFile = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/msword',
          'application/vnd.ms-excel',
          'image/jpeg',
          'image/png',
          'image/webp',
        ],
        copyToCacheDirectory: true,
      });

      if (res.canceled || !res.assets || res.assets.length === 0 || !res.assets[0]) return;
      const file = res.assets[0];
      setSelectedFile(file);
      if (!title.trim()) {
        // Tự động gợi ý tên tài liệu từ tên file
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
        setTitle(cleanName);
      }
    } catch (err: any) {
      CustomAlert.alert('Lỗi', err.message || 'Không thể chọn file');
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setTitle('');
    setDescription('');
    setCategory('QUY_DINH');
    setSelectedDeptId(currentDepartmentId || null);
    setIsUploading(false);
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      CustomAlert.alert('Thiếu tệp', 'Vui lòng chọn file tài liệu cần tải lên');
      return;
    }
    if (!title.trim()) {
      CustomAlert.alert('Thiếu tiêu đề', 'Vui lòng nhập tên tài liệu');
      return;
    }
    if (!canPostCompanyWide && !isRegionAdmin && (!selectedDeptId || selectedDeptId === '__ALL__' || selectedDeptId === '__REGION_ALL__')) {
      CustomAlert.alert(
        'Chưa chọn phòng ban',
        'Vui lòng chọn phòng ban cụ thể trong danh sách áp dụng. Chỉ Admin tổng hoặc Nhân sự (HR) mới có quyền đăng tài liệu cho toàn công ty.'
      );
      return;
    }

    try {
      setIsUploading(true);

      // 1. Upload file vật lý lên server
      const uploaded = await uploadFile({
        uri: selectedFile.uri,
        name: selectedFile.name,
        mimeType: selectedFile.mimeType || 'application/octet-stream',
        purpose: 'EMPLOYEE_DOCUMENT',
      });

      // 2. Tạo bản ghi DepartmentDocument và gắn fileId
      if (selectedDeptId === '__REGION_ALL__') {
        const regionDeptIds = departmentOptions
          .filter((opt) => opt.value !== '__REGION_ALL__' && opt.value !== '__ALL__' && opt.value)
          .map((opt) => opt.value);

        if (regionDeptIds.length === 0) {
          throw new Error('Không tìm thấy phòng ban nào thuộc miền quản lý của bạn.');
        }

        const [firstDeptId, ...otherDeptIds] = regionDeptIds;

        // Đính kèm fileId ở phòng ban đầu tiên để đánh dấu file là ATTACHED
        await createMutation.mutateAsync({
          departmentId: firstDeptId,
          title: title.trim(),
          description: description.trim() || undefined,
          category,
          fileName: selectedFile.name,
          fileUrl: uploaded.fileUrl,
          storageKey: (uploaded as any).storageKey,
          fileId: uploaded.fileId,
          mimeType: selectedFile.mimeType,
          fileSize: selectedFile.size,
        });

        // Các phòng ban còn lại dùng chung fileUrl (không truyền lại fileId để tránh lỗi UPLOAD_ALREADY_ATTACHED)
        if (otherDeptIds.length > 0) {
          await Promise.all(
            otherDeptIds.map((dId) =>
              createMutation.mutateAsync({
                departmentId: dId,
                title: title.trim(),
                description: description.trim() || undefined,
                category,
                fileName: selectedFile.name,
                fileUrl: uploaded.fileUrl,
                storageKey: (uploaded as any).storageKey,
                fileId: undefined,
                mimeType: selectedFile.mimeType,
                fileSize: selectedFile.size,
              })
            )
          );
        }
      } else {
        await createMutation.mutateAsync({
          departmentId: selectedDeptId === '__ALL__' ? undefined : (selectedDeptId || undefined),
          title: title.trim(),
          description: description.trim() || undefined,
          category,
          fileName: selectedFile.name,
          fileUrl: uploaded.fileUrl,
          storageKey: (uploaded as any).storageKey,
          fileId: uploaded.fileId,
          mimeType: selectedFile.mimeType,
          fileSize: selectedFile.size,
        });
      }

      handleReset();
      onSuccess();
      onClose();

      // Đóng modal trước rồi mới hiển thị popup thành công để không bị che khuất trên mobile (iOS/Android)
      setTimeout(() => {
        showAlert('Thành công', 'Đã tải lên và lưu tài liệu thành công!');
      }, Platform.OS === 'web' ? 50 : 350);
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.error?.message ||
        err.message ||
        'Không thể lưu tài liệu. Vui lòng thử lại.';
      CustomAlert.alert('Lỗi tải lên', errorMsg);
    } finally {
      setIsUploading(false);
    }
  };

  const categoryLabel = CATEGORIES.find((c) => (c.value || c.id) === category)?.label || category;
  const deptLabel = (selectedDeptId === '__ALL__' || (!selectedDeptId && canPostCompanyWide))
    ? 'Toàn công ty (Tất cả phòng ban)'
    : (selectedDeptId === '__REGION_ALL__' || (!selectedDeptId && isRegionAdmin))
    ? 'Toàn miền (Tất cả phòng ban trong miền)'
    : departmentOptions.find((d) => (d.id || d.value) === selectedDeptId)?.label || 'Chọn phòng ban áp dụng...';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <MaterialCommunityIcons name="file-upload-outline" size={24} color="#2563EB" />
              <Text style={styles.headerTitle}>Tải lên Tài liệu</Text>
            </View>
            <Pressable onPress={onClose} disabled={isUploading} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={20} color="#6B7280" />
            </Pressable>
          </View>

          <ScrollView style={styles.scrollBody} keyboardShouldPersistTaps="handled">
            {/* File Picker Card */}
            <Pressable style={styles.filePickerCard} onPress={handlePickFile} disabled={isUploading}>
              {selectedFile ? (
                <View style={styles.pickedFileRow}>
                  <MaterialCommunityIcons
                    name={selectedFile.name.endsWith('.pdf') ? 'file-pdf-box' : 'file-document-outline'}
                    size={36}
                    color={selectedFile.name.endsWith('.pdf') ? '#EF4444' : '#2563EB'}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.pickedFileName} numberOfLines={1}>
                      {selectedFile.name}
                    </Text>
                    <Text style={styles.pickedFileSize}>
                      {selectedFile.size ? `${(selectedFile.size / 1024).toFixed(1)} KB` : 'Đã chọn'}
                    </Text>
                  </View>
                  <Text style={styles.changeFileText}>Đổi tệp</Text>
                </View>
              ) : (
                <View style={styles.emptyPickerWrap}>
                  <MaterialCommunityIcons name="cloud-upload-outline" size={40} color="#9CA3AF" />
                  <Text style={styles.emptyPickerTitle}>Nhấn để chọn file tài liệu</Text>
                  <Text style={styles.emptyPickerSub}>Hỗ trợ PDF, Word, Excel, Hình ảnh (Tối đa 10MB)</Text>
                </View>
              )}
            </Pressable>

            {/* Input Tiêu đề */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Tên văn bản / Tài liệu <Text style={{ color: '#EF4444' }}>*</Text>
              </Text>
              <TextInput
                style={styles.textInput}
                value={title}
                onChangeText={setTitle}
                placeholder="VD: Nội quy văn phòng năm 2026..."
                placeholderTextColor="#9CA3AF"
                editable={!isUploading}
              />
            </View>

            {/* Chọn Loại tài liệu */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Danh mục tài liệu</Text>
              <Pressable
                style={styles.selectBtn}
                onPress={() => setShowCategoryModal(true)}
                disabled={isUploading}
              >
                <Text style={styles.selectBtnText}>{categoryLabel}</Text>
                <MaterialCommunityIcons name="chevron-down" size={20} color="#6B7280" />
              </Pressable>
            </View>

            {/* Chọn Phòng ban áp dụng */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Phạm vi áp dụng {!canPostCompanyWide && <Text style={{ color: '#EF4444' }}>*</Text>}
              </Text>
              <Pressable
                style={styles.selectBtn}
                onPress={() => setShowDeptModal(true)}
                disabled={isUploading || departmentOptions.length <= 1}
              >
                <Text style={styles.selectBtnText}>{deptLabel}</Text>
                {departmentOptions.length > 1 && (
                  <MaterialCommunityIcons name="chevron-down" size={20} color="#6B7280" />
                )}
              </Pressable>
              {!canPostCompanyWide && (
                <Text style={styles.hintText}>
                  * Vui lòng chọn phòng ban trực thuộc miền/chi nhánh bạn quản lý
                </Text>
              )}
            </View>

            {/* Input Mô tả */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Ghi chú / Mô tả ngắn</Text>
              <TextInput
                style={[styles.textInput, { height: 80, textAlignVertical: 'top' }]}
                value={description}
                onChangeText={setDescription}
                placeholder="Nhập tóm tắt nội dung tài liệu nếu có..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
                editable={!isUploading}
              />
            </View>
          </ScrollView>

          {/* Footer Submit Button */}
          <View style={styles.footerRow}>
            <Pressable
              style={[styles.cancelBtn, isUploading && { opacity: 0.5 }]}
              onPress={onClose}
              disabled={isUploading}
            >
              <Text style={styles.cancelBtnText}>Hủy bỏ</Text>
            </Pressable>

            <Pressable
              style={[styles.submitBtn, isUploading && { opacity: 0.6 }]}
              onPress={handleSubmit}
              disabled={isUploading}
            >
              {isUploading ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.submitBtnText}>Đang tải lên...</Text>
                </View>
              ) : (
                <Text style={styles.submitBtnText}>Lưu & Đăng tải</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>

      {/* Select Modals */}
      <SelectModal
        visible={showCategoryModal}
        title="Chọn danh mục tài liệu"
        options={CATEGORIES}
        selectedValue={category}
        onSelect={(opt: any) => {
          const val = typeof opt === 'string' ? opt : (opt.value ?? opt.id);
          setCategory(val);
          setShowCategoryModal(false);
        }}
        onClose={() => setShowCategoryModal(false)}
      />

      <SelectModal
        visible={showDeptModal}
        title="Chọn phòng ban áp dụng"
        options={departmentOptions}
        selectedValue={selectedDeptId || ''}
        onSelect={(opt: any) => {
          const val = typeof opt === 'string' ? opt : (opt.value ?? opt.id);
          setSelectedDeptId(val || null);
          setShowDeptModal(false);
        }}
        onClose={() => setShowDeptModal(false)}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  scrollBody: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  filePickerCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyPickerWrap: {
    alignItems: 'center',
    gap: 6,
  },
  emptyPickerTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
  },
  emptyPickerSub: {
    fontSize: 12,
    color: '#94A3B8',
  },
  pickedFileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  pickedFileName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  pickedFileSize: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  changeFileText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563EB',
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
  },
  selectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  selectBtnText: {
    fontSize: 14,
    color: '#1F2937',
  },
  hintText: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
  },
  footerRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4B5563',
  },
  submitBtn: {
    flex: 2,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
