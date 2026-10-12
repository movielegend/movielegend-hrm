import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import Toast from 'react-native-toast-message';
import { useAppAlert } from '../../contexts/AlertContext';
import type { DepartmentDocument } from '../../api/department-documents.api';
import { resolveFileUrl } from '../../utils/url';
import {
  CATEGORY_LABELS,
  formatFileSize,
  getFileBadgeInfo,
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

  const catLabel = CATEGORY_LABELS[document.category] || document.category || 'Chung';

  const isRegionWide = Boolean((document as any).isRegionWide);
  const regionName = (document as any).regionName || document.department?.branch?.name || '';
  const deptMainName = isRegionWide
    ? 'Toàn miền'
    : document.department
    ? document.department.name
    : 'Toàn công ty';
  const deptSubName = isRegionWide
    ? regionName || 'MOVIELEGEND'
    : document.department?.branch?.name
    ? `MOVIELEGEND · ${document.department.branch.name.toUpperCase()}`
    : 'Tất cả phòng ban';

  const fileSizeText = formatFileSize(document.fileSize);
  const badgeInfo = getFileBadgeInfo(document.fileName, document.mimeType);

  // Format date: HH:mm · DD/MM/YYYY
  const createdDate = (() => {
    if (!document.createdAt) return '---';
    const d = new Date(document.createdAt);
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${hours}:${mins} · ${day}/${month}/${year}`;
  })();

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
          <View style={styles.dragHandle} />

          {/* Modal Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerLeftGroup}>
              <View style={styles.headerIconBox}>
                <MaterialCommunityIcons name="file-document-outline" size={20} color="#1B3B2B" />
              </View>
              <Text style={styles.headerTitle}>Chi tiết tài liệu</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
              <Ionicons name="close" size={22} color="#64748B" />
            </Pressable>
          </View>

          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {/* File Summary Card */}
            <View style={styles.summaryCard}>
              <View style={[styles.fileBadge, { backgroundColor: badgeInfo.bgColor }]}>
                <Text style={[styles.fileBadgeText, { color: badgeInfo.textColor }]}>
                  {badgeInfo.label}
                </Text>
              </View>
              <View style={styles.summaryInfo}>
                <Text style={styles.summaryTitle} numberOfLines={2}>
                  {document.title}
                </Text>
                <View style={styles.summaryMetaRow}>
                  <View style={styles.categoryPill}>
                    <Text style={styles.categoryPillText}>{catLabel}</Text>
                  </View>
                </View>
                <View style={styles.fileSizeRow}>
                  <MaterialCommunityIcons name="file-document-outline" size={13} color="#64748B" />
                  <Text style={styles.fileSizeText}>
                    {badgeInfo.label} · {fileSizeText}
                  </Text>
                </View>
              </View>
            </View>

            {/* Section: Thông tin tài liệu */}
            <Text style={styles.sectionTitle}>Thông tin tài liệu</Text>

            <View style={styles.metaCard}>
              {/* Row 1: Người đăng tải */}
              <View style={styles.metaRow}>
                <View style={styles.metaIconBox}>
                  <Ionicons name="person-outline" size={18} color="#64748B" />
                </View>
                <View style={styles.metaTextCol}>
                  <Text style={styles.metaLabel}>Người đăng tải</Text>
                  <Text style={styles.metaValue}>{uploaderName}</Text>
                  {uploaderCode ? <Text style={styles.metaSubvalue}>{uploaderCode}</Text> : null}
                </View>
              </View>

              <View style={styles.metaDivider} />

              {/* Row 2: Phạm vi áp dụng */}
              <View style={styles.metaRow}>
                <View style={styles.metaIconBox}>
                  <MaterialCommunityIcons name="office-building" size={18} color="#64748B" />
                </View>
                <View style={styles.metaTextCol}>
                  <Text style={styles.metaLabel}>Phạm vi áp dụng</Text>
                  <Text style={styles.metaValue}>{deptMainName}</Text>
                  <Text style={styles.metaSubvalue}>{deptSubName}</Text>
                </View>
              </View>

              <View style={styles.metaDivider} />

              {/* Row 3: Thời gian tải lên */}
              <View style={styles.metaRow}>
                <View style={styles.metaIconBox}>
                  <Ionicons name="time-outline" size={18} color="#64748B" />
                </View>
                <View style={styles.metaTextCol}>
                  <Text style={styles.metaLabel}>Thời gian tải lên</Text>
                  <Text style={styles.metaValue}>{createdDate}</Text>
                </View>
              </View>
            </View>

            {/* Document Description if any */}
            {document.description ? (
              <View style={styles.descCard}>
                <Text style={styles.descLabel}>Mô tả:</Text>
                <Text style={styles.descText}>{document.description}</Text>
              </View>
            ) : null}

            {/* Action Button: Xem tài liệu */}
            <Pressable
              style={styles.viewDocBtn}
              onPress={() => onOpenDocument(document)}
            >
              <Ionicons name="eye-outline" size={18} color="#FFFFFF" />
              <Text style={styles.viewDocBtnText}>Xem tài liệu</Text>
            </Pressable>

            {/* Secondary Action Row: Sao chép liên kết + Xóa */}
            <View style={styles.bottomActionsRow}>
              <Pressable style={styles.copyLinkBtn} onPress={handleCopyLink}>
                <Ionicons name="copy-outline" size={16} color="#1B3B2B" />
                <Text style={styles.copyLinkBtnText}>Sao chép liên kết</Text>
              </Pressable>

              {canDelete && onDelete && (
                <Pressable style={styles.deleteDocBtn} onPress={() => onDelete(document)}>
                  <Ionicons name="trash-outline" size={16} color="#EF4444" />
                  <Text style={styles.deleteDocBtnText}>Xóa</Text>
                </Pressable>
              )}
            </View>
          </ScrollView>

          <SafeAreaView edges={['bottom']} />
        </View>
      </View>
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
    maxHeight: '90%',
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
    marginBottom: 10,
  },

  /* Summary Card */
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 16,
  },
  fileBadge: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileBadgeText: {
    fontSize: 13,
    fontWeight: '800',
  },
  summaryInfo: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 18,
  },
  summaryMetaRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  categoryPill: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1B3B2B',
  },
  fileSizeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  fileSizeText: {
    fontSize: 12,
    color: '#64748B',
  },

  /* Section Title */
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
  },

  /* Meta Card */
  metaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 14,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metaIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaTextCol: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 1,
  },
  metaSubvalue: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  metaDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },

  /* Description Card */
  descCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 14,
  },
  descLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 4,
  },
  descText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
  },

  /* Action Buttons */
  viewDocBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#1B3B2B',
    height: 46,
    borderRadius: 12,
    marginTop: 4,
    marginBottom: 10,
  },
  viewDocBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bottomActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  copyLinkBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#DCFCE7',
    height: 46,
    borderRadius: 12,
  },
  copyLinkBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1B3B2B',
  },
  deleteDocBtn: {
    width: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    height: 46,
    borderRadius: 12,
  },
  deleteDocBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#EF4444',
  },
});
