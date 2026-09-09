import React from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import Toast from 'react-native-toast-message';
import { useAppAlert } from '../../contexts/AlertContext';
import type { DepartmentDocument } from '../../api/department-documents.api';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { resolveFileUrl } from '../../utils/url';
import {
  CATEGORY_LABELS,
  formatDocumentDate,
  formatFileSize,
  getCategoryColor,
  getFileIcon,
} from './document.utils';

interface Props {
  visible: boolean;
  document: DepartmentDocument | null;
  onClose: () => void;
  onOpenDocument: (document: DepartmentDocument) => void;
  onDelete?: (document: DepartmentDocument) => void;
  canDelete?: boolean;
}

export function DocumentDetailModal({
  visible,
  document,
  onClose,
  onOpenDocument,
  onDelete,
  canDelete = false,
}: Props) {
  const { showAlert } = useAppAlert();
  if (!visible || !document) return null;

  const icon = getFileIcon(document.fileName, document.mimeType);
  const catColor = getCategoryColor(document.category);
  const catLabel = CATEGORY_LABELS[document.category] || document.category;

  const deptText = document.department
    ? `${document.department.name}${document.department.branch?.name ? ` (${document.department.branch.name})` : ''}`
    : 'Toàn công ty';

  const fileSizeText = formatFileSize(document.fileSize);
  const createdDate = formatDocumentDate(document.createdAt);

  const handleCopyLink = async () => {
    try {
      const fullUrl = resolveFileUrl(document.fileUrl) || '';
      await Clipboard.setStringAsync(fullUrl);
      Toast.show({
        type: 'success',
        text1: 'Đã sao chép liên kết',
        text2: 'Đường dẫn tài liệu đã được lưu vào bộ nhớ tạm',
      });
    } catch {
      showAlert('Thành công', 'Đã sao chép đường dẫn tài liệu!');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.dragHandle} />
            <View style={styles.headerTop}>
              <View style={styles.headerBadgeRow}>
                <View style={[styles.catBadge, { backgroundColor: catColor.bg }]}>
                  <Text style={[styles.catBadgeText, { color: catColor.text }]}>
                    {catLabel}
                  </Text>
                </View>
                <View
                  style={[
                    styles.deptBadge,
                    !document.department && { backgroundColor: '#EFF6FF' },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={document.department ? 'domain' : 'earth'}
                    size={14}
                    color={document.department ? '#4B5563' : '#2563EB'}
                  />
                  <Text
                    style={[
                      styles.deptBadgeText,
                      !document.department && { color: '#2563EB' },
                    ]}
                    numberOfLines={1}
                  >
                    {deptText}
                  </Text>
                </View>
              </View>

              <Pressable onPress={onClose} style={styles.closeBtn}>
                <MaterialCommunityIcons name="close" size={20} color="#6B7280" />
              </Pressable>
            </View>
          </View>

          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {/* Title & File Preview Card */}
            <View style={styles.heroCard}>
              <View style={[styles.fileIconWrap, { backgroundColor: `${icon.color}15` }]}>
                <MaterialCommunityIcons name={icon.name} size={42} color={icon.color} />
              </View>
              <Text style={styles.docTitle}>{document.title}</Text>
              <Text style={styles.fileNameText} numberOfLines={2}>
                {document.fileName}
              </Text>
            </View>

            {/* Description Section */}
            {document.description ? (
              <View style={styles.descCard}>
                <View style={styles.descHeader}>
                  <MaterialCommunityIcons name="text-box-outline" size={16} color="#3B82F6" />
                  <Text style={styles.descLabel}>Mô tả & Hướng dẫn</Text>
                </View>
                <Text style={styles.descContent}>{document.description}</Text>
              </View>
            ) : null}

            {/* Metadata Information Cards */}
            <View style={styles.infoCard}>
              <Text style={styles.infoSectionTitle}>Thông tin chi tiết</Text>

              {/* Uploader */}
              <View style={styles.infoRow}>
                <View style={styles.infoLeft}>
                  <View style={styles.avatarMini}>
                    <MaterialCommunityIcons name="account-outline" size={16} color="#4B5563" />
                  </View>
                  <Text style={styles.infoKey}>Người đăng tải</Text>
                </View>
                <Text style={styles.infoVal}>
                  {document.uploadedBy?.profile?.fullName || document.uploadedBy?.fullName || 'Hệ thống'}
                  {document.uploadedBy?.userCode ? ` (${document.uploadedBy.userCode})` : ''}
                </Text>
              </View>

              {/* Upload Date */}
              <View style={styles.infoRow}>
                <View style={styles.infoLeft}>
                  <MaterialCommunityIcons name="clock-outline" size={18} color="#6B7280" />
                  <Text style={styles.infoKey}>Thời gian tải lên</Text>
                </View>
                <Text style={styles.infoVal}>{createdDate}</Text>
              </View>

              {/* File Size */}
              <View style={styles.infoRow}>
                <View style={styles.infoLeft}>
                  <MaterialCommunityIcons name="database-outline" size={18} color="#6B7280" />
                  <Text style={styles.infoKey}>Dung lượng tệp</Text>
                </View>
                <Text style={styles.infoVal}>{fileSizeText}</Text>
              </View>

              {/* MIME Type */}
              {document.mimeType ? (
                <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                  <View style={styles.infoLeft}>
                    <MaterialCommunityIcons name="file-cog-outline" size={18} color="#6B7280" />
                    <Text style={styles.infoKey}>Định dạng MIME</Text>
                  </View>
                  <Text style={[styles.infoVal, { maxWidth: '55%' }]} numberOfLines={1}>
                    {document.mimeType}
                  </Text>
                </View>
              ) : null}
            </View>
          </ScrollView>

          {/* Action Buttons Footer */}
          <View style={styles.footer}>
            {/* Primary Action: View / Download Document */}
            {(() => {
              const isPdfOrImg =
                /\.(pdf|jpg|jpeg|png|webp|gif|svg)$/i.test(document.fileName || '') ||
                document.mimeType?.includes('pdf') ||
                document.mimeType?.startsWith('image/');
              return (
                <Pressable
                  style={styles.openBtn}
                  onPress={() => {
                    onClose();
                    onOpenDocument(document);
                  }}
                >
                  <MaterialCommunityIcons
                    name={isPdfOrImg ? 'eye-outline' : 'download-outline'}
                    size={20}
                    color="#FFFFFF"
                  />
                  <Text style={styles.openBtnText}>
                    {isPdfOrImg ? 'Xem tài liệu' : 'Tải về máy'}
                  </Text>
                </Pressable>
              );
            })()}

            {/* Secondary Actions */}
            <View style={styles.secondaryRow}>
              <Pressable style={styles.copyBtn} onPress={handleCopyLink}>
                <MaterialCommunityIcons name="content-copy" size={18} color="#2563EB" />
                <Text style={styles.copyBtnText}>Sao chép liên kết</Text>
              </Pressable>

              {canDelete && onDelete && (
                <Pressable
                  style={styles.deleteBtn}
                  onPress={() => {
                    onClose();
                    onDelete(document);
                  }}
                >
                  <MaterialCommunityIcons name="trash-can-outline" size={18} color="#EF4444" />
                  <Text style={styles.deleteBtnText}>Xóa</Text>
                </Pressable>
              )}
            </View>
          </View>
          <SafeAreaView />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 20,
  },
  header: {
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
    alignSelf: 'center',
    marginBottom: 12,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    flex: 1,
  },
  catBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  catBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  deptBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    maxWidth: 180,
  },
  deptBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBody: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  heroCard: {
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  fileIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  docTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 6,
  },
  fileNameText: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
  },
  descCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
    marginBottom: 16,
  },
  descHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  descLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  descContent: {
    fontSize: 14,
    lineHeight: 20,
    color: '#1E3A8A',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  infoSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatarMini: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoKey: {
    fontSize: 13,
    color: '#64748B',
  },
  infoVal: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 10,
  },
  openBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  openBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  copyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  copyBtnText: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  deleteBtnText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
  },
});
