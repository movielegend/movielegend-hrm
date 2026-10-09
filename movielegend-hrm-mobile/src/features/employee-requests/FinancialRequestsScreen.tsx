import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../providers/AuthProvider';
import { CustomAlert } from '../../components/CustomAlert';
import { CustomDatePickerModal } from '../../components/CustomDatePickerModal';
import { getRoleBaseRoute } from '../../utils/role-routing';
import { Screen } from '../../components/Screen';
import { getEmployeeRequests } from '../../api/employee-requests.api';
import { exportAndShareFinancialExcel } from '../../utils/export-financial-excel';
import type { EmployeeRequestType, EmployeeRequestStatus } from '../../types/request.types';

const FINANCIAL_TYPES: { type: EmployeeRequestType | 'ALL'; label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }[] = [
  { type: 'ALL', label: 'Tất cả tài chính', icon: 'cash-multiple' },
  { type: 'EXPENSE', label: 'Thanh toán (Chi phí)', icon: 'receipt' },
  { type: 'PURCHASE', label: 'Đề xuất mua sắm', icon: 'cart-outline' },
  { type: 'ADVANCE', label: 'Tạm ứng lương', icon: 'cash' },
];

export function FinancialRequestsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const rolePrefix = getRoleBaseRoute(user);

  const [activeTab, setActiveTab] = useState<EmployeeRequestStatus>('PENDING');
  const [selectedType, setSelectedType] = useState<EmployeeRequestType | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  // Modal export date selection
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportDateMode, setExportDateMode] = useState<'ALL' | 'TODAY' | 'YESTERDAY' | 'SINGLE' | 'RANGE'>('ALL');
  const [selectedSingleDate, setSelectedSingleDate] = useState<Date>(() => new Date());
  const [rangeFromDate, setRangeFromDate] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d;
  });
  const [rangeToDate, setRangeToDate] = useState<Date>(() => new Date());
  const [pickerTarget, setPickerTarget] = useState<'SINGLE' | 'RANGE_FROM' | 'RANGE_TO' | null>(null);
  const [exportVatOption, setExportVatOption] = useState<'ALL' | 'VAT_ONLY' | 'NO_VAT_ONLY'>('ALL');

  const { data: allRequests = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['financial-employee-requests'],
    queryFn: () => getEmployeeRequests(),
  });

  // Filter only financial requests
  const financialRequests = allRequests.filter((r: any) => {
    const isFinancialType = r.type === 'EXPENSE' || r.type === 'PURCHASE' || r.type === 'ADVANCE';
    if (!isFinancialType) return false;

    const matchTab = r.status === activeTab;
    const matchType = selectedType === 'ALL' || r.type === selectedType;
    const userName = r.user?.profile?.fullName || r.user?.email || r.creatorName || '';
    const content = r.content || '';
    const title = r.title || '';
    const matchSearch =
      !search.trim() ||
      userName.toLowerCase().includes(search.toLowerCase()) ||
      title.toLowerCase().includes(search.toLowerCase()) ||
      content.toLowerCase().includes(search.toLowerCase());

    return matchTab && matchType && matchSearch;
  });

  // Calculate statistics for financial items
  const stats = React.useMemo(() => {
    let pendingCount = 0;
    let approvedCount = 0;
    let totalPendingAmount = 0;
    let totalApprovedAmount = 0;

    allRequests.forEach((r: any) => {
      if (r.type === 'EXPENSE' || r.type === 'PURCHASE' || r.type === 'ADVANCE') {
        const amt = Number(r.amount || 0);
        if (r.status === 'PENDING') {
          pendingCount++;
          totalPendingAmount += amt;
        } else if (r.status === 'APPROVED') {
          approvedCount++;
          totalApprovedAmount += amt;
        }
      }
    });

    return { pendingCount, approvedCount, totalPendingAmount, totalApprovedAmount };
  }, [allRequests]);

  const formatDateToYMD = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const formatDateDisplay = (d: Date) => {
    const day = String(d.getDate()).padStart(2, '0');
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const y = d.getFullYear();
    return `${day}/${m}/${y}`;
  };


  const handleCustomExport = async () => {
    setIsExporting(true);
    try {
      let targetDate: string | undefined = undefined;
      let targetFromDate: string | undefined = undefined;
      let targetToDate: string | undefined = undefined;

      if (exportDateMode === 'ALL') {
        targetDate = 'ALL';
      } else if (exportDateMode === 'TODAY') {
        targetDate = formatDateToYMD(new Date());
      } else if (exportDateMode === 'YESTERDAY') {
        const d = new Date();
        d.setDate(d.getDate() - 1);
        targetDate = formatDateToYMD(d);
      } else if (exportDateMode === 'SINGLE') {
        targetDate = formatDateToYMD(selectedSingleDate);
      } else if (exportDateMode === 'RANGE') {
        targetFromDate = formatDateToYMD(rangeFromDate);
        targetToDate = formatDateToYMD(rangeToDate);
      }

      await exportAndShareFinancialExcel({
        date: targetDate,
        fromDate: targetFromDate,
        toDate: targetToDate,
        vatOption: exportVatOption,
        type: selectedType !== 'ALL' ? selectedType : undefined,
      });
      setIsExportModalOpen(false);
    } finally {
      setIsExporting(false);
    }
  };

  const getStatusDisplay = (item: any) => {
    const status = item?.status;
    const meta = typeof item?.attachmentMetadata === 'object' && item?.attachmentMetadata !== null ? item.attachmentMetadata : {};
    const stage = meta.stage || item?.currentApprovalStage;

    if (status === 'REJECTED') {
      return { text: 'Từ chối', color: '#EF4444', bg: '#FEE2E2' };
    }
    if (status === 'APPROVED') {
      if (meta.disbursementProofUrl || stage === 'DISBURSED') {
        return { text: 'Đã giải ngân', color: '#166534', bg: '#DCFCE7' };
      }
      return { text: 'Đã duyệt', color: '#166534', bg: '#DCFCE7' };
    }
    if (status === 'PENDING') {
      switch (stage) {
        case 'PENDING_LEADER':
          return { text: 'Chờ Leader duyệt', color: '#B45309', bg: '#FEF3C7' };
        case 'PENDING_HR':
        case 'PENDING_HR_PURCHASE':
          return { text: 'Chờ HR mua hàng', color: '#1D4ED8', bg: '#DBEAFE' };
        case 'PENDING_ADMIN':
          return { text: 'Chờ Ban Giám Đốc', color: '#6D28D9', bg: '#EDE9FE' };
        case 'PENDING_ACCOUNTANT':
        case 'PENDING_DISBURSEMENT':
          return { text: 'Chờ Chị Tâm chi', color: '#047857', bg: '#D1FAE5' };
        default:
          return { text: 'Chờ duyệt', color: '#B45309', bg: '#FEF3C7' };
      }
    }
    return { text: 'Không rõ', color: '#6B7280', bg: '#F3F4F6' };
  };

  const getInitials = (name?: string) => {
    if (!name) return 'NV';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <Screen>
      {/* 1. Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
            <MaterialCommunityIcons name="chevron-left" size={26} color="#0F172A" />
          </Pressable>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.title} numberOfLines={1}>Duyệt Tài chính</Text>
            <Text style={styles.subtitle} numberOfLines={1}>Kế toán & Ban Giám Đốc</Text>
          </View>
          <Pressable
            style={styles.exportHeaderBtn}
            onPress={() => setIsExportModalOpen(true)}
            hitSlop={6}
          >
            <MaterialCommunityIcons name="file-excel-box" size={18} color="#059669" />
            <Text style={styles.exportHeaderBtnText}>Xuất Excel</Text>
          </Pressable>
        </View>
      </View>

      {/* 2. Top Summary Banner */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { borderLeftColor: '#F59E0B' }]}>
          <Text style={styles.statLabel}>Chờ xử lý ({stats.pendingCount})</Text>
          <Text style={[styles.statValue, { color: '#B45309' }]}>
            {stats.totalPendingAmount.toLocaleString('vi-VN')} đ
          </Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: '#10B981' }]}>
          <Text style={styles.statLabel}>Đã duyệt ({stats.approvedCount})</Text>
          <Text style={[styles.statValue, { color: '#047857' }]}>
            {stats.totalApprovedAmount.toLocaleString('vi-VN')} đ
          </Text>
        </View>
      </View>

      {/* 3. Segmented Status Tabs */}
      <View style={styles.segmentedContainer}>
        <Pressable
          style={[styles.segmentBtn, activeTab === 'PENDING' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('PENDING')}
        >
          <Text style={[styles.segmentText, activeTab === 'PENDING' && styles.segmentTextActive]}>
            Chờ xử lý ({stats.pendingCount})
          </Text>
        </Pressable>
        <Pressable
          style={[styles.segmentBtn, activeTab === 'APPROVED' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('APPROVED')}
        >
          <Text style={[styles.segmentText, activeTab === 'APPROVED' && styles.segmentTextActive]}>
            Đã duyệt ({stats.approvedCount})
          </Text>
        </Pressable>
        <Pressable
          style={[styles.segmentBtn, activeTab === 'REJECTED' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('REJECTED')}
        >
          <Text style={[styles.segmentText, activeTab === 'REJECTED' && styles.segmentTextActive]}>
            Từ chối
          </Text>
        </Pressable>
      </View>

      {/* 4. Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <MaterialCommunityIcons name="magnify" size={20} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm người đề xuất, mã đơn, nội dung..."
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')}>
              <MaterialCommunityIcons name="close-circle" size={18} color="#94A3B8" />
            </Pressable>
          )}
        </View>
      </View>

      {/* 5. Filter Categories (Types) */}
      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContainer}>
          {FINANCIAL_TYPES.map((t) => {
            const isSelected = selectedType === t.type;
            return (
              <Pressable
                key={t.type}
                style={[styles.filterPill, isSelected && styles.filterPillActive]}
                onPress={() => setSelectedType(t.type)}
              >
                <MaterialCommunityIcons
                  name={t.icon}
                  size={14}
                  color={isSelected ? '#FFFFFF' : '#64748B'}
                  style={{ marginRight: 4 }}
                />
                <Text style={[styles.filterPillText, isSelected && styles.filterPillTextActive]}>
                  {t.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* 6. List */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#059669" />
          <Text style={styles.loadingText}>Đang tải danh sách tài chính...</Text>
        </View>
      ) : financialRequests.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        >
          <View style={styles.emptyIconBg}>
            <MaterialCommunityIcons name="receipt-text-check-outline" size={54} color="#94A3B8" />
          </View>
          <Text style={styles.emptyText}>Không có đơn tài chính nào</Text>
          <Text style={styles.emptySubtext}>Thử đổi trạng thái hoặc làm mới để tải dữ liệu mới nhất</Text>
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          showsVerticalScrollIndicator={false}
        >
          {financialRequests.map((item: any) => {
            const dateStr = item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : '';
            const userName = item.user?.profile?.fullName || item.user?.email || item.creatorName || 'Nhân viên';
            const statusObj = getStatusDisplay(item);
            const initials = getInitials(userName);
            const meta = typeof item.attachmentMetadata === 'object' && item.attachmentMetadata !== null ? item.attachmentMetadata : {};
            const hasVat = item.hasVat || meta.hasVat;
            const amount = Number(item.amount || 0);

            return (
              <Pressable
                key={item.id}
                style={styles.card}
                onPress={() => router.push(`${rolePrefix}/employee-requests/${item.id}` as any)}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.avatarBox}>
                    <Text style={styles.avatarText}>{initials}</Text>
                  </View>
                  <View style={styles.cardHeaderMiddle}>
                    <Text style={styles.cardUserName}>{userName}</Text>
                    <Text style={styles.cardMeta}>
                      {item.type === 'EXPENSE' ? 'Thanh toán' : item.type === 'PURCHASE' ? 'Mua sắm' : 'Tạm ứng'} • {dateStr}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusObj.bg }]}>
                    <Text style={[styles.statusBadgeText, { color: statusObj.color }]}>
                      {statusObj.text}
                    </Text>
                  </View>
                </View>

                <Text style={styles.cardTitle}>{item.title || (item.type === 'EXPENSE' ? 'Đề xuất thanh toán' : 'Đơn tài chính')}</Text>
                {item.content ? (
                  <Text style={styles.cardContent} numberOfLines={2}>
                    {item.content}
                  </Text>
                ) : null}

                <View style={styles.cardInfoRow}>
                  {amount > 0 && (
                    <Text style={styles.cardAmount}>{amount.toLocaleString('vi-VN')} VNĐ</Text>
                  )}
                  {item.type === 'EXPENSE' && (
                    <View style={[styles.vatTag, hasVat ? styles.vatTagGreen : styles.vatTagAmber]}>
                      <Text style={[styles.vatTagText, hasVat ? styles.vatTagGreenText : styles.vatTagAmberText]}>
                        {hasVat ? '✓ Có VAT' : 'Không VAT'}
                      </Text>
                    </View>
                  )}
                  {meta.disbursementProofUrl && (
                    <View style={styles.proofTag}>
                      <MaterialCommunityIcons name="image-check" size={12} color="#059669" />
                      <Text style={styles.proofTagText}>Đã up bill</Text>
                    </View>
                  )}
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.cardFooterLink}>Xem chi tiết & Xử lý đơn →</Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {/* Export Options Modal */}
      <Modal
        visible={isExportModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsExportModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MaterialCommunityIcons name="file-excel-box" size={24} color="#059669" />
                <Text style={styles.modalTitle}>Tùy chọn Xuất Excel</Text>
              </View>
              <Pressable onPress={() => setIsExportModalOpen(false)} hitSlop={8}>
                <MaterialCommunityIcons name="close" size={22} color="#64748B" />
              </Pressable>
            </View>

            <Text style={styles.modalDesc}>
              Xuất file Excel giao dịch tài chính 13 cột chuẩn kèm link mở ảnh chứng từ bill.
            </Text>

            <View style={styles.modalForm}>
              <Text style={styles.formLabel}>Khoảng thời gian xuất:</Text>
              <View style={styles.vatOptionGroup}>
                {[
                  { key: 'ALL', label: 'Toàn bộ đơn (Tất cả ngày - Khuyên dùng)', icon: 'earth' },
                  { key: 'TODAY', label: `Hôm nay (${formatDateDisplay(new Date())})`, icon: 'calendar-today' },
                  { key: 'YESTERDAY', label: 'Đơn đợt hôm qua', icon: 'history' },
                  { key: 'SINGLE', label: 'Chọn 1 ngày trên Lịch 📅', icon: 'calendar-month' },
                  { key: 'RANGE', label: 'Chọn theo khoảng ngày 📆', icon: 'calendar-range' },
                ].map((opt) => (
                  <Pressable
                    key={opt.key}
                    style={[styles.vatOptionBtn, exportDateMode === opt.key && styles.vatOptionBtnActive]}
                    onPress={() => setExportDateMode(opt.key as any)}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <MaterialCommunityIcons
                        name={opt.icon as any}
                        size={17}
                        color={exportDateMode === opt.key ? '#059669' : '#64748B'}
                      />
                      <Text
                        style={[
                          styles.vatOptionText,
                          exportDateMode === opt.key && styles.vatOptionTextActive,
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>

              {exportDateMode === 'SINGLE' && (
                <View style={styles.datePickerContainer}>
                  <Text style={styles.formLabel}>Ngày cần xuất (Bấm để chọn lịch):</Text>
                  <Pressable
                    style={styles.datePickerBtn}
                    onPress={() => setPickerTarget('SINGLE')}
                  >
                    <MaterialCommunityIcons name="calendar" size={20} color="#059669" />
                    <Text style={styles.datePickerBtnText}>{formatDateDisplay(selectedSingleDate)}</Text>
                    <Text style={styles.datePickerChangeHint}>Đổi ngày 📅</Text>
                  </Pressable>
                </View>
              )}

              {exportDateMode === 'RANGE' && (
                <View style={styles.datePickerContainer}>
                  <Text style={styles.formLabel}>Khoảng ngày (Từ ngày - Đến ngày):</Text>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.subFieldLabel}>Từ ngày:</Text>
                      <Pressable
                        style={styles.datePickerBtnSmall}
                        onPress={() => setPickerTarget('RANGE_FROM')}
                      >
                        <MaterialCommunityIcons name="calendar" size={16} color="#059669" />
                        <Text style={styles.datePickerBtnTextSmall}>{formatDateDisplay(rangeFromDate)}</Text>
                      </Pressable>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.subFieldLabel}>Đến ngày:</Text>
                      <Pressable
                        style={styles.datePickerBtnSmall}
                        onPress={() => setPickerTarget('RANGE_TO')}
                      >
                        <MaterialCommunityIcons name="calendar" size={16} color="#059669" />
                        <Text style={styles.datePickerBtnTextSmall}>{formatDateDisplay(rangeToDate)}</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              )}

              <Text style={[styles.formLabel, { marginTop: 12 }]}>Phân loại VAT:</Text>
              <View style={styles.vatOptionGroup}>
                {[
                  { key: 'ALL', label: 'Tất cả (Có VAT & Không VAT)' },
                  { key: 'VAT_ONLY', label: 'Chỉ đơn có VAT (Chị Tâm)' },
                  { key: 'NO_VAT_ONLY', label: 'Chỉ đơn không VAT' },
                ].map((opt) => (
                  <Pressable
                    key={opt.key}
                    style={[styles.vatOptionBtn, exportVatOption === opt.key && styles.vatOptionBtnActive]}
                    onPress={() => setExportVatOption(opt.key as any)}
                  >
                    <Text
                      style={[
                        styles.vatOptionText,
                        exportVatOption === opt.key && styles.vatOptionTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalCancelBtn}
                onPress={() => setIsExportModalOpen(false)}
                disabled={isExporting}
              >
                <Text style={styles.modalCancelText}>Đóng</Text>
              </Pressable>
              <Pressable
                style={[styles.modalSubmitBtn, isExporting && styles.exportBtnDisabled]}
                onPress={handleCustomExport}
                disabled={isExporting}
              >
                {isExporting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="download" size={16} color="#FFFFFF" />
                    <Text style={styles.modalSubmitText}>Tải & Chia sẻ Excel</Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Interactive CustomDatePickerModal */}
      <CustomDatePickerModal
        visible={pickerTarget !== null}
        initialDate={
          pickerTarget === 'SINGLE'
            ? selectedSingleDate
            : pickerTarget === 'RANGE_FROM'
            ? rangeFromDate
            : rangeToDate
        }
        onClose={() => setPickerTarget(null)}
        onSelect={(selectedDate: Date) => {
          if (pickerTarget === 'SINGLE') {
            setSelectedSingleDate(selectedDate);
          } else if (pickerTarget === 'RANGE_FROM') {
            setRangeFromDate(selectedDate);
          } else if (pickerTarget === 'RANGE_TO') {
            setRangeToDate(selectedDate);
          }
          setPickerTarget(null);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backBtn: {
    padding: 2,
    marginRight: 2,
  },
  headerTitleWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  exportHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 5,
  },
  exportHeaderBtnText: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    borderLeftWidth: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 3,
    marginHorizontal: 16,
    marginTop: 12,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 9,
  },
  segmentBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  segmentTextActive: {
    color: '#0F172A',
    fontWeight: '700',
  },
  searchSection: {
    paddingHorizontal: 16,
    marginTop: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 40,
    gap: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    paddingVertical: 0,
  },
  filterSection: {
    marginTop: 10,
  },
  filterContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterPillActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: '#64748B',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
  },
  listContainer: {
    padding: 16,
    gap: 12,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: '#059669',
    fontWeight: '700',
    fontSize: 13,
  },
  cardHeaderMiddle: {
    flex: 1,
  },
  cardUserName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  cardMeta: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  cardContent: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },
  cardInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  cardAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: '#059669',
  },
  vatTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  vatTagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  vatTagGreen: {
    backgroundColor: '#DCFCE7',
  },
  vatTagGreenText: {
    color: '#166534',
    fontSize: 10,
    fontWeight: '700',
  },
  vatTagAmber: {
    backgroundColor: '#FEF3C7',
  },
  vatTagAmberText: {
    color: '#B45309',
    fontSize: 10,
    fontWeight: '700',
  },
  proofTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  proofTagText: {
    color: '#059669',
    fontSize: 10,
    fontWeight: '600',
  },
  cardFooter: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
    alignItems: 'flex-end',
  },
  cardFooterLink: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
    marginBottom: 16,
  },
  modalForm: {
    gap: 6,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  formInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
  },
  vatOptionGroup: {
    gap: 6,
  },
  vatOptionBtn: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  vatOptionBtnActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#059669',
  },
  vatOptionText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  vatOptionTextActive: {
    color: '#059669',
    fontWeight: '700',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  modalCancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  modalSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#059669',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  modalSubmitText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  datePickerContainer: {
    marginTop: 8,
    padding: 10,
    backgroundColor: '#F0FDF4',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    gap: 6,
  },
  datePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#059669',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  datePickerBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  datePickerChangeHint: {
    fontSize: 12,
    color: '#059669',
    marginLeft: 'auto',
    fontWeight: '600',
  },
  subFieldLabel: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 4,
    fontWeight: '600',
  },
  datePickerBtnSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  datePickerBtnTextSmall: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
});
