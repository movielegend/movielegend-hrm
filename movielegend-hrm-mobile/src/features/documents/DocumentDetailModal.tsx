import React from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import Toast from 'react-native-toast-message';
import { useAppAlert } from '../../contexts/AlertContext';
import type { DepartmentDocument } from '../../api/department-documents.api';
import { resolveFileUrl } from '../../utils/url';
import {
  CATEGORY_LABELS,
  formatDocumentDate,
  formatFileSize,
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
  const catLabel = CATEGORY_LABELS[document.category] || document.category;

  const isRegionWide = Boolean((document as any).isRegionWide);
  const regionName = (document as any).regionName || document.department?.branch?.name || '';
  const deptText = isRegionWide
    ? `Toàn miền${regionName ? ` (${regionName})` : ''}`
    : document.department
    ? `${document.department.name}${document.department.branch?.name ? ` (${document.department.branch.name})` : ''}`
    : 'Toàn công ty';

  const fileSizeText = formatFileSize(document.fileSize);
  const createdDate = formatDocumentDate(document.createdAt);

  const fileExt = (() => {
    const parts = (document.fileName || '').split('.');
    return parts.length > 1 ? parts.pop() || 'FILE' : 'FILE';
  })();
  const isPdf = fileExt.toLowerCase() === 'pdf' || document.mimeType?.includes('pdf');
  const isPdfOrImg =
    /\.(pdf|jpg|jpeg|png|webp|gif|svg)$/i.test(document.fileName || '') ||
    document.mimeType?.includes('pdf') ||
    document.mimeType?.startsWith('image/');

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

  const uploaderName =
    document.uploadedBy?.profile?.fullName ||
    document.uploadedBy?.fullName ||
    'Admin Movie Legend';
  const uploaderCode = document.uploadedBy?.userCode || 'NV000001';

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
          <View style={styles.dragHandleContainer}>
            <View style={styles.dragHandle} />
          </View>

          {/* Modal Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitleGroup}>
              <MaterialCommunityIcons name="file-document-outline" size={24} color="#0055D4" />
              <Text style={styles.headerTitle}>Chi tiết tài liệu</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
              <MaterialCommunityIcons name="close" size={20} color="#64748B" />
            </Pressable>
          </View>

          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {/* Badges Row */}
            <View style={styles.badgesRow}>
              <View style={styles.catBadge}>
                <Text style={styles.catBadgeText}>{catLabel.toUpperCase()}</Text>
              </View>
              <View style={styles.deptBadge}>
                <MaterialCommunityIcons
                  name={document.department ? 'office-building' : 'earth'}
                  size={14}
                  color="#475569"
                />
                <Text style={styles.deptBadgeText} numberOfLines={1}>
                  {deptText.toUpperCase()}
                </Text>
              </View>
            </View>

            {/* File Card Box */}
            <View style={styles.fileCard}>
              <View style={styles.fileIconBox}>
                {isPdf ? (
                  <View style={styles.pdfBadge}>
                    <Text style={styles.pdfBadgeText}>PDF</Text>
                  </View>
                ) : (
                  <MaterialCommunityIcons name={icon.name} size={30} color={icon.color} />
                )}
              </View>
              <View style={styles.fileCardInfo}>
                <Text style={styles.docTitle} numberOfLines={2}>
                  {document.title}
                </Text>
                <Text style={styles.fileNameText} numberOfLines={1}>
                  {document.fileName}
                </Text>
                <View style={styles.filePill}>
                  <MaterialCommunityIcons name="file-document-outline" size={13} color="#64748B" />
                  <Text style={styles.filePillText}>
                    {fileExt.toUpperCase()} • {fileSizeText}
                  </Text>
                </View>
              </View>
            </View>

            {/* Description if any */}
            {document.description ? (
              <View style={styles.descCard}>
                <Text style={styles.descLabel}>Mô tả & Hướng dẫn:</Text>
                <Text style={styles.descContent}>{document.description}</Text>
              </View>
            ) : null}

            {/* Section: Thông tin chi tiết */}
            <Text style={styles.sectionTitle}>Thông tin chi tiết</Text>
            <View style={styles.infoCard}>
              {/* Row 1: Người đăng tải */}
              <View style={styles.infoRow}>
                <View style={styles.infoIconCircle}>
                  <MaterialCommunityIcons name="account-outline" size={20} color="#475569" />
                </View>
                <View style={styles.infoTextCol}>
                  <Text style={styles.infoLabel}>Người đăng tải</Text>
                  <Text style={styles.infoValue}>
                    {uploaderName} ({uploaderCode})
                  </Text>
                </View>
              </View>

              {/* Row 2: Phạm vi */}
              <View style={styles.infoRow}>
                <View style={styles.infoIconCircle}>
                  <MaterialCommunityIcons
                    name={document.department ? 'office-building' : 'earth'}
                    size={20}
                    color="#475569"
                  />
                </View>
                <View style={styles.infoTextCol}>
                  <Text style={styles.infoLabel}>Phạm vi</Text>
                  <Text style={styles.infoValue}>{deptText.toUpperCase()}</Text>
                </View>
              </View>

              {/* Row 3: Thời gian tải lên */}
              <View style={styles.infoRow}>
                <View style={styles.infoIconCircle}>
                  <MaterialCommunityIcons name="clock-outline" size={20} color="#475569" />
                </View>
                <View style={styles.infoTextCol}>
                  <Text style={styles.infoLabel}>Thời gian tải lên</Text>
                  <Text style={styles.infoValue}>{createdDate}</Text>
                </View>
              </View>

              {/* Row 4: Dung lượng tệp */}
              <View style={styles.infoRow}>
                <View style={styles.infoIconCircle}>
                  <MaterialCommunityIcons name="database-outline" size={20} color="#475569" />
                </View>
                <View style={styles.infoTextCol}>
                  <Text style={styles.infoLabel}>Dung lượng tệp</Text>
                  <Text style={styles.infoValue}>{fileSizeText}</Text>
                </View>
              </View>

              {/* Row 5: Định dạng MIME */}
              <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                <View style={styles.infoIconCircle}>
                  <MaterialCommunityIcons name="file-cog-outline" size={20} color="#475569" />
                </View>
                <View style={styles.infoTextCol}>
                  <Text style={styles.infoLabel}>Định dạng MIME</Text>
                  <Text style={styles.infoValue}>
                    {document.mimeType || 'application/pdf'}
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons Footer */}
          <View style={styles.footer}>
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

            <View style={styles.secondaryRow}>
              <Pressable style={styles.copyBtn} onPress={handleCopyLink}>
                <MaterialCommunityIcons name="content-copy" size={18} color="#0055D4" />
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
          <SafeAreaView edges={['bottom']} />
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
  dragHandleContainer: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  dragHandle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBody: {
    paddingHorizontal: 20,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 14,
  },
  catBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  catBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  deptBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    maxWidth: 220,
  },
  deptBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 16,
  },
  fileIconBox: {
    width: 58,
    height: 58,
    borderRadius: 14,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pdfBadge: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pdfBadgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  fileCardInfo: {
    flex: 1,
  },
  docTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 22,
  },
  fileNameText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 3,
  },
  filePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  filePillText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  descCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  descLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 4,
  },
  descContent: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 10,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  infoIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTextCol: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    marginTop: 2,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 10,
  },
  openBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0055D4',
    height: 48,
    borderRadius: 12,
    gap: 8,
  },
  openBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
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
    height: 46,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  copyBtnText: {
    color: '#0055D4',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    height: 46,
    paddingHorizontal: 22,
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
