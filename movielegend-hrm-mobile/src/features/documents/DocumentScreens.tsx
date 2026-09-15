import React, { useState, useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../providers/AuthProvider';
import { useAppAlert } from '../../contexts/AlertContext';
import {
  DepartmentDocument,
  useDepartmentDocuments,
  useDeleteDepartmentDocument,
} from '../../api/department-documents.api';
import { getDepartments } from '../../api/departments.api';
import { useQuery } from '@tanstack/react-query';
import { Screen } from '../../components/Screen';
import { PageHeader } from '../../components/PageHeader';
import { SearchInput } from '../../components/SearchInput';
import { FilterChip } from '../../components/FilterChip';
import { EmptyState } from '../../components/EmptyState';
import { LoadingState } from '../../components/LoadingState';
import { PdfViewerModal } from '../../components/PdfViewerModal';
import { SelectModal, SelectOption } from '../../components/SelectModal';
import { UploadDocumentModal } from './UploadDocumentModal';
import { DocumentDetailModal } from './DocumentDetailModal';
import { resolveFileUrl } from '../../utils/url';
import { CATEGORIES, getCategoryColor, getFileIcon } from './document.utils';

export function DocumentListScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { showAlert, showConfirm } = useAppAlert();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);

  // Modals state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [selectedDocDetail, setSelectedDocDetail] = useState<DepartmentDocument | null>(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [pdfPreviewTitle, setPdfPreviewTitle] = useState<string>('Xem tài liệu');

  // Query documents
  const { data, isLoading, refetch, isRefetching } = useDepartmentDocuments({
    category: selectedCategory === 'ALL' ? undefined : selectedCategory,
    search: search.trim() || undefined,
    departmentId: selectedDeptId || undefined,
  });

  const deleteMutation = useDeleteDepartmentDocument();

  // Kiểm tra quyền
  const isGlobalAdmin = user?.roles?.includes('ADMIN') && user?.scopes?.some(
    (s: any) => s.role === 'ADMIN' && (s.scopeType === 'GLOBAL' || !s.scopeType)
  );
  const isRegionAdmin = user?.roles?.includes('ADMIN') && user?.scopes?.some(
    (s: any) => s.role === 'ADMIN' && s.scopeType === 'REGION'
  );
  const isLeader = user?.roles?.includes('LEADER');

  // Quyền đăng tài liệu: Admin Tổng, Admin Miền, hoặc Leader
  const canUpload = isGlobalAdmin || isRegionAdmin || isLeader;

  // Danh sách phòng ban để lọc (chỉ dành cho Admin / Region Admin)
  const { data: deptData } = useQuery({
    queryKey: ['departments'],
    queryFn: () => getDepartments({ limit: 100 }),
    enabled: !!(isGlobalAdmin || isRegionAdmin),
  });

  const deptOptions: SelectOption[] = useMemo(() => {
    const opts: SelectOption[] = [{ id: '', value: '', label: 'Tất cả phòng ban được phép' }];
    deptData?.items?.forEach((d) => {
      const branchName = d.branch?.name ? ` (${d.branch.name})` : '';
      opts.push({ id: d.id, value: d.id, label: `${d.name}${branchName}` });
    });
    return opts;
  }, [deptData]);

  const getFullFileUrl = (url: string) => {
    if (!url) return '';
    const resolved = resolveFileUrl(url);
    if (resolved) return resolved;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return resolveFileUrl(url) || url;
  };

  const handleOpenDocument = async (doc: DepartmentDocument) => {
    const fullUrl = getFullFileUrl(doc.fileUrl);
    const fileName = doc.fileName || 'document';
    const isPdf = fileName.toLowerCase().endsWith('.pdf') || doc.mimeType?.includes('pdf');
    const isImage =
      /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(fileName) || doc.mimeType?.startsWith('image/');

    if (isPdf || isImage) {
      setPdfPreviewTitle(doc.title);
      setPdfPreviewUrl(fullUrl);
      return;
    }

    // Đối với các tệp văn phòng (Word, Excel, PowerPoint,...):
    // Trình duyệt không thể đọc trực tiếp .docx / .xlsx trong thẻ như PDF
    // Tải tệp về máy qua blob để gán đúng tên file gốc và tránh bị Chrome chặn "Insecure download"
    if (Platform.OS === 'web') {
      try {
        const res = await fetch(fullUrl);
        if (!res.ok) throw new Error('Không thể tải tệp từ máy chủ');
        const blob = await res.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(blobUrl);
      } catch {
        window.open(fullUrl, '_blank');
      }
    } else {
      Linking.openURL(fullUrl).catch(() => {
        showAlert('Không thể mở', 'Không thể mở tệp này trên thiết bị.');
      });
    }
  };

  const handleDelete = (doc: DepartmentDocument) => {
    showConfirm({
      title: 'Xác nhận xóa',
      message: `Bạn có chắc chắn muốn xóa tài liệu "${doc.title}" không?`,
      confirmLabel: 'Xóa',
      onConfirm: async () => {
        try {
          await deleteMutation.mutateAsync(doc.id);
          showAlert('Thành công', 'Đã xóa tài liệu thành công!');
        } catch (err: any) {
          showAlert('Lỗi', err.message || 'Không thể xóa tài liệu');
        }
      },
    });
  };

  const renderDocumentItem = ({ item }: { item: DepartmentDocument }) => {
    const icon = getFileIcon(item.fileName, item.mimeType);
    const catColor = getCategoryColor(item.category);
    const catLabel = CATEGORIES.find((c) => c.value === item.category)?.label || item.category;

    const deptText = item.department
      ? `${item.department.name}${item.department.branch?.name ? ` • ${item.department.branch.name}` : ''}`
      : '🌐 Toàn công ty';

    const fileSizeText = item.fileSize
      ? item.fileSize > 1024 * 1024
        ? `${(item.fileSize / (1024 * 1024)).toFixed(1)} MB`
        : `${(item.fileSize / 1024).toFixed(0)} KB`
      : '';

    const uploadDate = item.createdAt
      ? new Date(item.createdAt).toLocaleDateString('vi-VN')
      : '';

    return (
      <View style={styles.card}>
        <Pressable
          style={styles.cardHeader}
          onPress={() => setSelectedDocDetail(item)}
        >
          {/* File Icon */}
          <View style={[styles.iconWrap, { backgroundColor: `${icon.color}15` }]}>
            <MaterialCommunityIcons name={icon.name} size={28} color={icon.color} />
          </View>

          {/* Title & Info */}
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <View style={[styles.catBadge, { backgroundColor: catColor.bg }]}>
                <Text style={[styles.catBadgeText, { color: catColor.text }]}>{catLabel}</Text>
              </View>
              {item.department ? (
                <View style={styles.deptBadge}>
                  <Text style={styles.deptBadgeText} numberOfLines={1}>{deptText}</Text>
                </View>
              ) : (
                <View style={[styles.deptBadge, { backgroundColor: '#EFF6FF' }]}>
                  <Text style={[styles.deptBadgeText, { color: '#2563EB' }]}>Toàn công ty</Text>
                </View>
              )}
            </View>

            <Text style={styles.docTitle} numberOfLines={2}>
              {item.title}
            </Text>

            {item.description ? (
              <Text style={styles.docDesc} numberOfLines={2}>
                {item.description}
              </Text>
            ) : null}

            <View style={styles.fileMetaRow}>
              <MaterialCommunityIcons name="paperclip" size={13} color="#94A3B8" />
              <Text style={styles.fileNameText} numberOfLines={1}>
                {item.fileName}
              </Text>
              {fileSizeText ? (
                <Text style={styles.fileSizeText}>({fileSizeText})</Text>
              ) : null}
            </View>

            <View style={styles.dateRow}>
              <MaterialCommunityIcons name="clock-outline" size={13} color="#94A3B8" />
              <Text style={styles.dateText}>{uploadDate}</Text>
            </View>
          </View>
        </Pressable>

        {/* Actions Row */}
        <View style={styles.cardActions}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Pressable style={styles.detailBtn} onPress={() => setSelectedDocDetail(item)}>
              <MaterialCommunityIcons name="information-outline" size={16} color="#334155" />
              <Text style={styles.detailBtnText}>Chi tiết</Text>
            </Pressable>

            {(() => {
              const isPdfOrImg =
                /\.(pdf|jpg|jpeg|png|webp|gif|svg)$/i.test(item.fileName || '') ||
                item.mimeType?.includes('pdf') ||
                item.mimeType?.startsWith('image/');
              return (
                <Pressable style={styles.viewBtn} onPress={() => handleOpenDocument(item)}>
                  <MaterialCommunityIcons
                    name={isPdfOrImg ? 'eye-outline' : 'download-outline'}
                    size={16}
                    color="#2563EB"
                  />
                  <Text style={styles.viewBtnText}>{isPdfOrImg ? 'Xem tệp' : 'Tải về'}</Text>
                </Pressable>
              );
            })()}
          </View>

          {canUpload && (
            <Pressable style={styles.deleteBtn} onPress={() => handleDelete(item)}>
              <MaterialCommunityIcons name="trash-can-outline" size={16} color="#EF4444" />
            </Pressable>
          )}
        </View>
      </View>
    );
  };

  return (
    <Screen>
      <View style={styles.headerSection}>
        <PageHeader
          title="Tài liệu nội bộ"
          subtitle="Quy chế, biểu mẫu, tài liệu ca làm"
          showBack={false}
          right={
            canUpload ? (
              <Pressable style={styles.addHeaderBtn} onPress={() => setShowUploadModal(true)}>
                <MaterialCommunityIcons name="plus" size={18} color="#FFFFFF" />
                <Text style={styles.addHeaderBtnText}>Thêm mới</Text>
              </Pressable>
            ) : undefined
          }
        />
      </View>

      <View style={styles.searchSection}>
        <SearchInput value={search} onChangeText={setSearch} placeholder="Tìm kiếm tài liệu, biểu mẫu..." />
      </View>

      {/* Lọc theo danh mục */}
      <View style={{ marginBottom: 12 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          {CATEGORIES.map((c) => (
            <FilterChip
              key={c.value}
              label={c.label}
              isActive={selectedCategory === c.value}
              onPress={() => setSelectedCategory(c.value)}
            />
          ))}
        </ScrollView>
      </View>

      {/* Bộ lọc phòng ban (cho Admin Tổng và Admin Miền) */}
      {(isGlobalAdmin || isRegionAdmin) && (
        <View style={styles.deptFilterRow}>
          <Pressable style={styles.deptFilterBtn} onPress={() => setShowDeptModal(true)}>
            <MaterialCommunityIcons name="filter-variant" size={16} color="#2563EB" />
            <Text style={styles.deptFilterBtnText} numberOfLines={1}>
              {selectedDeptId
                ? deptOptions.find((d) => d.value === selectedDeptId)?.label || 'Phòng ban'
                : 'Tất cả phòng ban'}
            </Text>
            <MaterialCommunityIcons name="chevron-down" size={16} color="#6B7280" />
          </Pressable>
          {selectedDeptId && (
            <Pressable style={styles.clearDeptBtn} onPress={() => setSelectedDeptId(null)}>
              <MaterialCommunityIcons name="close-circle" size={18} color="#9CA3AF" />
            </Pressable>
          )}
        </View>
      )}

      {/* Danh sách tài liệu */}
      {isLoading ? (
        <LoadingState label="Đang tải danh sách tài liệu..." />
      ) : (
        <FlatList
          data={data?.items || []}
          keyExtractor={(item) => item.id}
          renderItem={renderDocumentItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          ListEmptyComponent={
            <EmptyState
              title="Chưa có tài liệu nào"
              message={
                search || selectedCategory !== 'ALL' || selectedDeptId
                  ? 'Không tìm thấy tài liệu phù hợp với bộ lọc'
                  : 'Phòng ban của bạn chưa có tài liệu nào được đăng tải.'
              }
            />
          }
        />
      )}

      {/* Upload Modal */}
      <UploadDocumentModal
        visible={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSuccess={() => void refetch()}
        currentDepartmentId={selectedDeptId}
      />

      {/* Dept Filter Select Modal */}
      <SelectModal
        visible={showDeptModal}
        title="Lọc theo phòng ban"
        options={deptOptions}
        selectedValue={selectedDeptId || ''}
        onSelect={(opt: any) => {
          const val = typeof opt === 'string' ? opt : (opt.value ?? opt.id);
          setSelectedDeptId(val || null);
          setShowDeptModal(false);
        }}
        onClose={() => setShowDeptModal(false)}
      />

      {/* PDF Viewer Preview Modal */}
      <PdfViewerModal
        visible={!!pdfPreviewUrl}
        url={pdfPreviewUrl}
        title={pdfPreviewTitle}
        onClose={() => setPdfPreviewUrl(null)}
      />

      {/* Document Detail Modal */}
      <DocumentDetailModal
        visible={!!selectedDocDetail}
        document={selectedDocDetail}
        onClose={() => setSelectedDocDetail(null)}
        onOpenDocument={handleOpenDocument}
        onDelete={handleDelete}
        canDelete={canUpload}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerSection: {
    paddingHorizontal: 16,
    paddingTop: 6,
    marginBottom: 4,
  },
  searchSection: {
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  categoryScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  deptFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  deptFilterBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  deptFilterBtnText: {
    flex: 1,
    fontSize: 13,
    color: '#1E293B',
    fontWeight: '500',
  },
  clearDeptBtn: {
    padding: 4,
  },
  addHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addHeaderBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  catBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  deptBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
    maxWidth: '70%',
  },
  deptBadgeText: {
    fontSize: 11,
    color: '#4B5563',
    fontWeight: '500',
  },
  docTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 6,
    lineHeight: 20,
  },
  docDesc: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 18,
  },
  fileMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  fileNameText: {
    fontSize: 12,
    color: '#64748B',
    flexShrink: 1,
  },
  fileSizeText: {
    fontSize: 11,
    color: '#94A3B8',
    marginLeft: 2,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  dateText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  detailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  detailBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  viewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  viewBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563EB',
  },
  deleteBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
  },
});
