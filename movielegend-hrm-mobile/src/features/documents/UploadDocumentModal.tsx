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
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../providers/AuthProvider';
import { useAppAlert } from '../../contexts/AlertContext';
import { getDepartments } from '../../api/departments.api';
import { uploadFile } from '../../api/uploads.api';
import { useCreateDepartmentDocument } from '../../api/department-documents.api';
import { SelectModal, SelectOption } from '../../components/SelectModal';
import {
  CATEGORIES as ALL_CATEGORIES,
  CATEGORY_LABELS,
  formatFileSize,
  getFileBadgeInfo,
} from './document.utils';

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
  const isGlobalAdmin =
    (user?.roles?.includes('ADMIN') &&
      user?.scopes?.some(
        (s: any) => s.role === 'ADMIN' && (s.scopeType === 'GLOBAL' || !s.scopeType)
      )) ||
    Boolean(user?.roles?.includes('SUPER_ADMIN'));
  const isRegionAdmin = Boolean(
    user?.roles?.includes('ADMIN') &&
      user?.scopes?.some((s: any) => s.role === 'ADMIN' && s.scopeType === 'REGION')
  );
  const isLeader = Boolean(user?.roles?.includes('LEADER'));

  const canPostCompanyWide = isGlobalAdmin || isHR;

  const departmentOptions: SelectOption[] = useMemo(() => {
    const opts: SelectOption[] = [];
    if (canPostCompanyWide) {
      opts.push({ id: '__ALL__', value: '__ALL__', label: 'Toàn công ty (Tất cả phòng ban)' });
    } else if (isRegionAdmin) {
      opts.push({
        id: '__REGION_ALL__',
        value: '__REGION_ALL__',
        label: 'Toàn miền (Tất cả phòng ban trong miền)',
      });
    }

    let items = deptData?.items || [];
    if (canPostCompanyWide) {
      // Super Admin & HR: xem và đăng cho toàn bộ các phòng ban
    } else if (isRegionAdmin) {
      const regionIds =
        user?.scopes
          ?.filter((s: any) => s.role === 'ADMIN' && s.scopeType === 'REGION' && s.scopeId)
          .map((s: any) => s.scopeId) || [];
      items = items.filter((d) => d.branch?.region?.id && regionIds.includes(d.branch.region.id));
    } else if (isLeader) {
      const leaderDeptIds =
        user?.scopes
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
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
        setTitle(cleanName);
      }
    } catch (err: any) {
      showAlert('Lỗi', err.message || 'Không thể chọn tệp');
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
      showAlert('Thiếu tệp', 'Vui lòng chọn tệp tài liệu cần đăng tải.');
      return;
    }
    if (!title.trim()) {
      showAlert('Thiếu tên tài liệu', 'Vui lòng nhập tên tài liệu.');
      return;
    }

    try {
      setIsUploading(true);

      // 1. Upload file lên server
      const uploadRes = await uploadFile({
        uri: selectedFile.uri,
        name: selectedFile.name,
        mimeType: selectedFile.mimeType || 'application/octet-stream',
        purpose: 'EMPLOYEE_DOCUMENT',
      });
      const fileUrl = uploadRes.fileUrl;
      if (!fileUrl) {
        throw new Error('Không nhận được đường dẫn tệp sau khi tải lên.');
      }

      // 2. Tạo bản ghi tài liệu
      const isPostCompanyWide = selectedDeptId === '__ALL__';
      const isPostRegionWide = selectedDeptId === '__REGION_ALL__';

      if (isPostCompanyWide) {
        const allDepts = deptData?.items || [];
        if (allDepts.length === 0) {
          throw new Error('Chưa có phòng ban nào trong hệ thống để áp dụng.');
        }
        await Promise.all(
          allDepts.map((d) =>
            createMutation.mutateAsync({
              title: title.trim(),
              description: description.trim() || undefined,
              fileUrl,
              fileName: selectedFile.name,
              fileSize: selectedFile.size || 0,
              mimeType: selectedFile.mimeType || 'application/octet-stream',
              category,
              departmentId: d.id,
            })
          )
        );
      } else if (isPostRegionWide) {
        const regionIds =
          user?.scopes
            ?.filter((s: any) => s.role === 'ADMIN' && s.scopeType === 'REGION' && s.scopeId)
            .map((s: any) => s.scopeId) || [];
        const regionDepts = (deptData?.items || []).filter(
          (d) => d.branch?.region?.id && regionIds.includes(d.branch.region.id)
        );
        if (regionDepts.length === 0) {
          throw new Error('Không tìm thấy phòng ban nào thuộc miền của bạn.');
        }
        await Promise.all(
          regionDepts.map((d) =>
            createMutation.mutateAsync({
              title: title.trim(),
              description: description.trim() || undefined,
              fileUrl,
              fileName: selectedFile.name,
              fileSize: selectedFile.size || 0,
              mimeType: selectedFile.mimeType || 'application/octet-stream',
              category,
              departmentId: d.id,
            })
          )
        );
      } else {
        if (!selectedDeptId) {
          throw new Error('Vui lòng chọn phòng ban áp dụng.');
        }
        await createMutation.mutateAsync({
          title: title.trim(),
          description: description.trim() || undefined,
          fileUrl,
          fileName: selectedFile.name,
          fileSize: selectedFile.size || 0,
          mimeType: selectedFile.mimeType || 'application/octet-stream',
          category,
          departmentId: selectedDeptId,
        });
      }

      showAlert('Thành công', 'Đã tải lên và lưu tài liệu thành công!');
      handleReset();
      onSuccess();
      onClose();
    } catch (err: any) {
      showAlert('Lỗi', err.message || 'Không thể đăng tải tài liệu');
    } finally {
      setIsUploading(false);
    }
  };

  const selectedCategoryLabel =
    CATEGORIES.find((c) => c.value === category)?.label || 'Quy định & Nội quy';
  const selectedDeptLabel =
    departmentOptions.find((d) => d.value === selectedDeptId)?.label ||
    'Toàn công ty (Tất cả phòng ban)';

  const fileBadge = selectedFile ? getFileBadgeInfo(selectedFile.name, selectedFile.mimeType) : null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Drag handle */}
          <View style={styles.dragHandle} />

          {/* Modal Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerLeftGroup}>
              <View style={styles.headerIconBox}>
                <MaterialCommunityIcons name="cloud-upload-outline" size={20} color="#1B3B2B" />
              </View>
              <Text style={styles.headerTitle}>Tải lên tài liệu</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
              <Ionicons name="close" size={22} color="#64748B" />
            </Pressable>
          </View>

          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {/* Upload Zone Card */}
            <Pressable
              style={[
                styles.uploadZoneCard,
                selectedFile && styles.uploadZoneCardFilled,
              ]}
              onPress={handlePickFile}
            >
              {selectedFile && fileBadge ? (
                <View style={styles.selectedFileBox}>
                  <View style={[styles.fileBadgeSquare, { backgroundColor: fileBadge.bgColor }]}>
                    <Text style={[styles.fileBadgeSquareText, { color: fileBadge.textColor }]}>
                      {fileBadge.label}
                    </Text>
                  </View>
                  <View style={styles.selectedFileInfo}>
                    <Text style={styles.selectedFileName} numberOfLines={1}>
                      {selectedFile.name}
                    </Text>
                    <Text style={styles.selectedFileSize}>
                      {formatFileSize(selectedFile.size)} · Chạm để đổi tệp
                    </Text>
                  </View>
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation?.();
                      setSelectedFile(null);
                    }}
                    hitSlop={8}
                    style={styles.removeFileBtn}
                  >
                    <Ionicons name="close-circle" size={20} color="#94A3B8" />
                  </Pressable>
                </View>
              ) : (
                <View style={styles.emptyUploadBox}>
                  <MaterialCommunityIcons name="cloud-upload-outline" size={38} color="#1B3B2B" />
                  <Text style={styles.uploadZoneTitle}>Chạm để chọn tệp</Text>
                  <Text style={styles.uploadZoneSubtitle}>PDF, Word, Excel, hình ảnh</Text>
                  <Text style={styles.uploadZoneSubtitle}>Tối đa 10 MB</Text>
                </View>
              )}
            </Pressable>

            {/* Field: Tên tài liệu * */}
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>
                Tên tài liệu <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <TextInput
                style={styles.textInput}
                value={title}
                onChangeText={setTitle}
                placeholder="VD: Nội quy văn phòng 2026"
                placeholderTextColor="#94A3B8"
              />
            </View>

            {/* Field: Danh mục tài liệu */}
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Danh mục tài liệu</Text>
              <Pressable style={styles.selectCard} onPress={() => setShowCategoryModal(true)}>
                <Text style={styles.selectCardText}>{selectedCategoryLabel}</Text>
                <Ionicons name="chevron-down" size={18} color="#64748B" />
              </Pressable>
            </View>

            {/* Field: Phạm vi áp dụng */}
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Phạm vi áp dụng</Text>
              <Pressable style={styles.selectCard} onPress={() => setShowDeptModal(true)}>
                <Text style={styles.selectCardText} numberOfLines={1}>
                  {selectedDeptLabel}
                </Text>
                <Ionicons name="chevron-down" size={18} color="#64748B" />
              </Pressable>
            </View>

            {/* Field: Mô tả (không bắt buộc) */}
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Mô tả (không bắt buộc)</Text>
              <TextInput
                style={styles.textAreaInput}
                value={description}
                onChangeText={setDescription}
                placeholder="Nhập mô tả ngắn..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* Footer Buttons Row */}
            <View style={styles.footerRow}>
              <Pressable
                style={styles.cancelBtn}
                onPress={() => {
                  handleReset();
                  onClose();
                }}
                disabled={isUploading}
              >
                <Text style={styles.cancelBtnText}>Hủy bỏ</Text>
              </Pressable>

              <Pressable
                style={[styles.submitBtn, isUploading && styles.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={isUploading}
              >
                {isUploading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitBtnText}>Lưu & Đăng tải</Text>
                )}
              </Pressable>
            </View>
          </ScrollView>

          <SafeAreaView edges={['bottom']} />
        </View>
      </View>

      {/* Select Category Modal */}
      <SelectModal
        visible={showCategoryModal}
        title="Chọn danh mục tài liệu"
        options={CATEGORIES}
        selectedValue={category}
        onSelect={(opt: any) => {
          const val = typeof opt === 'string' ? opt : opt.value;
          setCategory(val);
          setShowCategoryModal(false);
        }}
        onClose={() => setShowCategoryModal(false)}
      />

      {/* Select Dept Modal */}
      <SelectModal
        visible={showDeptModal}
        title="Chọn phạm vi áp dụng"
        options={departmentOptions}
        selectedValue={selectedDeptId || ''}
        onSelect={(opt: any) => {
          const val = typeof opt === 'string' ? opt : opt.value;
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: '92%',
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  closeBtn: {
    padding: 4,
  },
  scrollBody: {
    marginBottom: 8,
  },

  /* Upload Dropzone Card */
  uploadZoneCard: {
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
    borderStyle: 'dashed',
    borderRadius: 14,
    backgroundColor: '#F0FDF4',
    paddingVertical: 22,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  uploadZoneCardFilled: {
    paddingVertical: 14,
    borderStyle: 'solid',
    borderColor: '#86EFAC',
  },
  emptyUploadBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadZoneTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 8,
    marginBottom: 2,
  },
  uploadZoneSubtitle: {
    fontSize: 12,
    color: '#64748B',
  },
  selectedFileBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  fileBadgeSquare: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileBadgeSquareText: {
    fontSize: 13,
    fontWeight: '800',
  },
  selectedFileInfo: {
    flex: 1,
  },
  selectedFileName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  selectedFileSize: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  removeFileBtn: {
    padding: 4,
  },

  /* Form Fields */
  formField: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  requiredAsterisk: {
    color: '#EF4444',
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 46,
    fontSize: 14,
    color: '#0F172A',
  },
  textAreaInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingTop: 10,
    minHeight: 70,
    fontSize: 14,
    color: '#0F172A',
  },
  selectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 46,
  },
  selectCardText: {
    fontSize: 14,
    color: '#0F172A',
    flex: 1,
  },

  /* Footer Row */
  footerRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
    marginBottom: 12,
  },
  cancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  submitBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#1B3B2B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
