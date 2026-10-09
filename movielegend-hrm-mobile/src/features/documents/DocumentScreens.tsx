import React, { useState, useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
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
import { EmptyState } from '../../components/EmptyState';
import { PdfViewerModal } from '../../components/PdfViewerModal';
import { SelectModal, SelectOption } from '../../components/SelectModal';
import { UploadDocumentModal } from './UploadDocumentModal';
import { DocumentDetailModal } from './DocumentDetailModal';
import { resolveFileUrl } from '../../utils/url';
import { roleBase } from '../../utils/notification-routing';
import {
  CATEGORIES,
  CATEGORY_LABELS,
  formatFileSize,
  getFileBadgeInfo,
} from './document.utils';

export function DocumentListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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

  const canManageAll = isGlobalAdmin || isHR;
  // Quyền đăng tài liệu: Admin Tổng, HR, Admin Miền, hoặc Leader
  const canUpload = canManageAll || isRegionAdmin || isLeader;

  // Danh sách phòng ban để lọc
  const { data: deptData } = useQuery({
    queryKey: ['departments'],
    queryFn: () => getDepartments({ limit: 100 }),
    enabled: !!(canManageAll || isRegionAdmin),
  });

  const deptOptions: SelectOption[] = useMemo(() => {
    const isRegionOnly = isRegionAdmin && !canManageAll;
    const defaultLabel = isRegionOnly ? 'Toàn miền (Tất cả phòng ban trong miền)' : 'Tất cả phòng ban';
    const opts: SelectOption[] = [{ id: '', value: '', label: defaultLabel }];

    let items = deptData?.items || [];
    if (isRegionOnly) {
      const regionIds =
        user?.scopes
          ?.filter((s: any) => s.role === 'ADMIN' && s.scopeType === 'REGION' && s.scopeId)
          .map((s: any) => s.scopeId) || [];
      items = items.filter((d) => d.branch?.region?.id && regionIds.includes(d.branch.region.id));
    }

    items.forEach((d) => {
      const branchName = d.branch?.name ? ` (${d.branch.name})` : '';
      opts.push({ id: d.id, value: d.id, label: `${d.name}${branchName}` });
    });
    return opts;
  }, [deptData, isRegionAdmin, canManageAll, user]);

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

  const displayDocuments = useMemo(() => {
    const rawItems = data?.items || [];
    if (selectedDeptId) {
      return rawItems;
    }

    const groupedMap = new Map<
      string,
      DepartmentDocument & { relatedDocIds?: string[]; isRegionWide?: boolean; regionName?: string }
    >();

    rawItems.forEach((doc) => {
      const groupKey = `${doc.fileUrl || doc.fileName}_${doc.title}_${doc.category}`;

      if (!groupedMap.has(groupKey)) {
        groupedMap.set(groupKey, {
          ...doc,
          relatedDocIds: [doc.id],
        });
      } else {
        const existing = groupedMap.get(groupKey)!;
        existing.relatedDocIds?.push(doc.id);
        existing.isRegionWide = true;
        if (!existing.regionName) {
          existing.regionName =
            doc.department?.branch?.region?.name || doc.department?.branch?.name;
        }
      }
    });

    return Array.from(groupedMap.values());
  }, [data?.items, selectedDeptId]);

  const handleDelete = (doc: DepartmentDocument) => {
    const relatedIds = (doc as any).relatedDocIds as string[] | undefined;
    const isMultiple = Boolean(relatedIds && relatedIds.length > 1);

    showConfirm({
      title: 'Xác nhận xóa',
      message: isMultiple
        ? `Tài liệu "${doc.title}" được áp dụng cho toàn miền (${relatedIds!.length} phòng ban). Bạn có chắc chắn muốn xóa khỏi toàn bộ các phòng ban không?`
        : `Bạn có chắc chắn muốn xóa tài liệu "${doc.title}" không?`,
      confirmLabel: 'Xóa',
      onConfirm: async () => {
        try {
          if (isMultiple && relatedIds) {
            await Promise.all(relatedIds.map((id) => deleteMutation.mutateAsync(id)));
          } else {
            await deleteMutation.mutateAsync(doc.id);
          }
          showAlert('Thành công', 'Đã xóa tài liệu thành công!');
          setSelectedDocDetail(null);
          void refetch();
        } catch (err: any) {
          showAlert('Lỗi', err.message || 'Không thể xóa tài liệu');
        }
      },
    });
  };

  const selectedDeptLabel = useMemo(() => {
    if (!selectedDeptId) return 'Tất cả phòng ban';
    return deptOptions.find((d) => d.value === selectedDeptId)?.label || 'Phòng ban';
  }, [selectedDeptId, deptOptions]);

  const renderDocumentItem = ({ item }: { item: DepartmentDocument }) => {
    const badgeInfo = getFileBadgeInfo(item.fileName, item.mimeType);
    const catLabel = CATEGORY_LABELS[item.category] || item.category || 'Chung';

    const isRegionWide = Boolean((item as any).isRegionWide);
    const regionName = (item as any).regionName || item.department?.branch?.name || '';
    const deptMainText = isRegionWide
      ? `Toàn miền · ${regionName}`
      : item.department
      ? `${item.department.name} · ${item.department.branch?.name ? `MOVIELEGEND · ${item.department.branch.name.toUpperCase()}` : 'MOVIELEGEND'}`
      : 'Toàn công ty';

    const fileSizeText = formatFileSize(item.fileSize);

    // Format date: DD/MM/YYYY
    const uploadDate = item.createdAt
      ? (() => {
          const d = new Date(item.createdAt);
          const day = String(d.getDate()).padStart(2, '0');
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const year = d.getFullYear();
          return `${day}/${month}/${year}`;
        })()
      : '---';

    return (
      <View style={styles.card}>
        <View style={styles.cardTopRow}>
          {/* File Badge Square */}
          <View style={[styles.fileBadgeSquare, { backgroundColor: badgeInfo.bgColor }]}>
            <Text style={[styles.fileBadgeSquareText, { color: badgeInfo.textColor }]}>
              {badgeInfo.label}
            </Text>
          </View>

          {/* Details */}
          <View style={styles.cardInfoCol}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.docTitle} numberOfLines={2}>
                {item.title}
              </Text>
              <Pressable
                onPress={() => setSelectedDocDetail(item)}
                style={styles.moreOptionsBtn}
                hitSlop={8}
              >
                <Ionicons name="ellipsis-horizontal" size={18} color="#64748B" />
              </Pressable>
            </View>

            {/* Category tag */}
            <View style={styles.categoryPillWrap}>
              <View style={styles.categoryPill}>
                <Text style={styles.categoryPillText}>{catLabel}</Text>
              </View>
            </View>

            {/* Department info */}
            <View style={styles.metaRow}>
              <MaterialCommunityIcons name="office-building" size={13} color="#94A3B8" />
              <Text style={styles.metaText} numberOfLines={1}>
                {deptMainText}
              </Text>
            </View>

            {/* File info */}
            <View style={styles.metaRow}>
              <MaterialCommunityIcons name="file-document-outline" size={13} color="#94A3B8" />
              <Text style={styles.metaText}>
                {badgeInfo.label} · {fileSizeText}
              </Text>
            </View>

            {/* Date */}
            <View style={styles.metaRow}>
              <Ionicons name="calendar-outline" size={13} color="#94A3B8" />
              <Text style={styles.metaText}>{uploadDate}</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons Row */}
        <View style={styles.cardActionsRow}>
          <Pressable style={styles.detailActionBtn} onPress={() => setSelectedDocDetail(item)}>
            <Ionicons name="information-circle-outline" size={16} color="#0F172A" />
            <Text style={styles.detailActionBtnText}>Chi tiết</Text>
          </Pressable>

          <Pressable style={styles.viewActionBtn} onPress={() => handleOpenDocument(item)}>
            <Ionicons name="eye-outline" size={16} color="#FFFFFF" />
            <Text style={styles.viewActionBtnText}>Xem tệp</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1B3B2B" translucent={false} />

      {/* ── Top Header (#1B3B2B) ── */}
      <View style={[styles.headerWrap, { paddingTop: Math.max(insets.top, 16) + 4 }]}>
        <View style={styles.headerMainRow}>
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace(`${roleBase(user)}/(tabs)` as any))}
            style={styles.backBtn}
            hitSlop={10}
            accessibilityLabel="Quay lại"
          >
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </Pressable>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Tài liệu nội bộ</Text>
            <Text style={styles.headerSubtitle}>Quy chế, biểu mẫu, tài liệu ca làm</Text>
          </View>
        </View>
      </View>

      {/* ── Main Curved Sheet ── */}
      <View style={styles.curvedSheet}>
        {/* Search Input */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Tìm tài liệu, biểu mẫu..."
            placeholderTextColor="#94A3B8"
          />
          {search ? (
            <Pressable onPress={() => setSearch('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </Pressable>
          ) : null}
        </View>

        {/* Categories Horizontal Pills Bar */}
        <View style={styles.categoriesBar}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesScrollContent}
          >
            {CATEGORIES.map((c) => {
              const isActive = selectedCategory === c.value;
              return (
                <Pressable
                  key={c.value}
                  style={[styles.categoryBtn, isActive && styles.categoryBtnActive]}
                  onPress={() => setSelectedCategory(c.value)}
                >
                  <Text style={[styles.categoryBtnText, isActive && styles.categoryBtnTextActive]}>
                    {c.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Department Filter Card */}
        {(canManageAll || isRegionAdmin) && (
          <View style={styles.deptFilterSection}>
            <Pressable style={styles.deptFilterCard} onPress={() => setShowDeptModal(true)}>
              <View style={styles.deptFilterLeft}>
                <MaterialCommunityIcons name="filter-variant" size={18} color="#1B3B2B" />
                <Text style={styles.deptFilterText} numberOfLines={1}>
                  {selectedDeptLabel}
                </Text>
              </View>
              <Ionicons name="chevron-down" size={18} color="#64748B" />
            </Pressable>
          </View>
        )}

        {/* Section Header */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Danh sách tài liệu</Text>
          <Text style={styles.sectionCountText}>{displayDocuments.length} tài liệu</Text>
        </View>

        {/* Documents List */}
        {isLoading && !isRefetching ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color="#1B3B2B" />
            <Text style={styles.loadingText}>Đang tải danh sách tài liệu...</Text>
          </View>
        ) : (
          <FlatList
            data={displayDocuments}
            keyExtractor={(item) => item.id}
            renderItem={renderDocumentItem}
            contentContainerStyle={[
              styles.listContent,
              canUpload && { paddingBottom: Math.max(insets.bottom, 16) + 72 },
            ]}
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

        {/* Sticky Bottom Button: Thêm tài liệu */}
        {canUpload && (
          <View style={[styles.stickyFooterBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <Pressable style={styles.addDocBtn} onPress={() => setShowUploadModal(true)}>
              <Ionicons name="add" size={20} color="#FFFFFF" />
              <Text style={styles.addDocBtnText}>Thêm tài liệu</Text>
            </Pressable>
          </View>
        )}
      </View>

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1B3B2B',
  },

  /* ── Header Wrap (#1B3B2B) ── */
  headerWrap: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#1B3B2B',
  },
  headerMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#A7F3D0',
    marginTop: 2,
    fontWeight: '500',
  },

  /* ── Curved Sheet ── */
  curvedSheet: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },

  /* ── Search Bar ── */
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },

  /* ── Category Pills Bar ── */
  categoriesBar: {
    marginBottom: 10,
  },
  categoriesScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 100,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryBtnActive: {
    backgroundColor: '#1B3B2B',
    borderColor: '#1B3B2B',
  },
  categoryBtnText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
  },
  categoryBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  /* ── Dept Filter Section ── */
  deptFilterSection: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  deptFilterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  deptFilterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  deptFilterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
    flex: 1,
  },

  /* ── Section Header ── */
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionCountText: {
    fontSize: 12,
    color: '#64748B',
  },

  /* ── Loading ── */
  loadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
  },

  /* ── Document Cards ── */
  listContent: {
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
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
  cardInfoCol: {
    flex: 1,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  docTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
    lineHeight: 18,
  },
  moreOptionsBtn: {
    padding: 2,
  },
  categoryPillWrap: {
    marginTop: 4,
    marginBottom: 4,
  },
  categoryPill: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  categoryPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1B3B2B',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  metaText: {
    fontSize: 12,
    color: '#64748B',
    flex: 1,
  },

  /* Actions Row */
  cardActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  detailActionBtn: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  detailActionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  viewActionBtn: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#1B3B2B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  viewActionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* ── Sticky Footer ── */
  stickyFooterBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  addDocBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#1B3B2B',
    height: 48,
    borderRadius: 12,
  },
  addDocBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
