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
import { getRoleBaseRoute, isAccountingLeader, hasUserRole } from '../../utils/role-routing';
import { Screen } from '../../components/Screen';
import { getEmployeeRequests } from '../../api/employee-requests.api';
import { exportAndShareFinancialExcel } from '../../utils/export-financial-excel';
import type { EmployeeRequestType, EmployeeRequestStatus } from '../../types/request.types';

const FINANCIAL_TYPES: { type: EmployeeRequestType | 'ALL'; label: string }[] = [
  { type: 'ALL', label: 'Tất cả' },
  { type: 'EXPENSE', label: 'Thanh toán' },
  { type: 'PURCHASE', label: 'Mua sắm' },
  { type: 'ADVANCE', label: 'Tạm ứng' },
];

export function FinancialRequestsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const rolePrefix = getRoleBaseRoute(user);
  const isAccountant = hasUserRole(user, 'ACCOUNTANT');
  const isAdmin = hasUserRole(user, 'ADMIN');
  const isHr =
    hasUserRole(user, 'HR') ||
    (user as any)?.roles?.some((r: any) => String(r?.code || r?.name || r).toUpperCase().includes('HR'));
  const isLeader =
    hasUserRole(user, 'LEADER') ||
    (user as any)?.roles?.some((r: any) => String(r?.code || r?.name || r).toUpperCase().includes('LEADER')) ||
    Boolean((user as any)?.isDepartmentLeader);
  const canAccess = isAccountant || isAdmin || isHr || isLeader;
  const canExportExcel = isAccountingLeader(user);

  const headerSubtitle = isAccountant || isAdmin
    ? 'Kế toán & Ban Giám Đốc'
    : isHr
    ? 'Nhân sự & Mua sắm'
    : 'Trưởng bộ phận phê duyệt';

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
    enabled: Boolean(canAccess),
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
    let rejectedCount = 0;
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
        } else if (r.status === 'REJECTED') {
          rejectedCount++;
        }
      }
    });

    return { pendingCount, approvedCount, rejectedCount, totalPendingAmount, totalApprovedAmount };
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

  const formatDateShort = (dateInput?: string | Date) => {
    if (!dateInput) return '';
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '';
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  };

  const handleCustomExport = async () => {
    if (!canExportExcel) {
      CustomAlert.alert('Từ chối', 'Chỉ có duy nhất Trưởng phòng Kế toán mới có quyền xuất Excel tài chính.');
      setIsExportModalOpen(false);
      return;
    }
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
      return { text: 'Từ chối', color: '#DC2626', bg: '#FEE2E2' };
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
          return { text: 'Chờ Kế toán chi', color: '#0284C7', bg: '#E0F2FE' };
        default:
          return { text: 'Chờ duyệt', color: '#B45309', bg: '#FEF3C7' };
      }
    }
    return { text: 'Không rõ', color: '#6B7280', bg: '#F3F4F6' };
  };

  const getInitials = (name?: string) => {
    if (!name) return 'NV';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'NV';
    const first = parts[0] || '';
    if (parts.length === 1) return first.slice(0, 2).toUpperCase();
    const last = parts[parts.length - 1] || '';
    return ((first[0] || '') + (last[0] || '')).toUpperCase() || 'NV';
  };

  if (!canAccess) {
    return (
      <Screen backgroundColor="#102739" statusBarStyle="light">
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
              <MaterialCommunityIcons name="chevron-left" size={28} color="#FFFFFF" />
            </Pressable>
            <View style={styles.headerTitleWrap}>
              <Text style={styles.title} numberOfLines={1}>Duyệt Tài chính</Text>
              <Text style={styles.subtitle} numberOfLines={1}>{headerSubtitle}</Text>
            </View>
          </View>
        </View>
        <View style={[styles.sheetContainer, { justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
          <MaterialCommunityIcons name="shield-lock-outline" size={64} color="#EF4444" />
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#0F172A', marginTop: 16, textAlign: 'center' }}>
            Không có quyền truy cập
          </Text>
          <Text style={{ fontSize: 14, color: '#64748B', marginTop: 8, textAlign: 'center', lineHeight: 22 }}>
            Chức năng Duyệt tài chính chỉ dành riêng cho Kế toán và Ban Giám Đốc. Trưởng phòng và Nhân sự không có thẩm quyền truy cập tính năng này.
          </Text>
          <Pressable
            onPress={() => router.back()}
            style={{ marginTop: 24, backgroundColor: '#102739', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 }}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 15 }}>Quay lại</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  return (
    <Screen backgroundColor="#102739" statusBarStyle="light">
      {/* 1. Header in Navy #102739 */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
            <MaterialCommunityIcons name="chevron-left" size={28} color="#FFFFFF" />
          </Pressable>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.title} numberOfLines={1}>Duyệt Tài chính</Text>
            <Text style={styles.subtitle} numberOfLines={1}>Kế toán & Ban Giám Đốc</Text>
          </View>
          {canExportExcel && (
            <Pressable
              style={styles.exportHeaderBtn}
              onPress={() => setIsExportModalOpen(true)}
              hitSlop={6}
            >
              <MaterialCommunityIcons name="file-excel-box" size={16} color="#FFFFFF" />
              <Text style={styles.exportHeaderBtnText}>Excel</Text>
            </Pressable>
          )}
        </View>

        {/* 2-Column Summary Metrics */}
        <View style={styles.statsBanner}>
          <View style={styles.statCol}>
            <Text style={styles.statLabel}>Chờ xử lý • {stats.pendingCount} đơn</Text>
            <Text style={styles.statAmount} numberOfLines={1}>
              {stats.totalPendingAmount.toLocaleString('vi-VN')} đ
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <Text style={styles.statLabel}>Đã duyệt • {stats.approvedCount} đơn</Text>
            <Text style={styles.statAmount} numberOfLines={1}>
              {stats.totalApprovedAmount.toLocaleString('vi-VN')} đ
            </Text>
          </View>
        </View>
      </View>

      {/* 2. Curved Main Body Container */}
      <View style={styles.sheetContainer}>
        {/* Status Underline Tabs */}
        <View style={styles.tabsContainer}>
          <Pressable
            style={styles.tabButton}
            onPress={() => setActiveTab('PENDING')}
          >
            <Text style={[styles.tabText, activeTab === 'PENDING' && styles.tabTextActive]}>
              Chờ xử lý ({stats.pendingCount})
            </Text>
            {activeTab === 'PENDING' && <View style={styles.tabIndicator} />}
          </Pressable>
          <Pressable
            style={styles.tabButton}
            onPress={() => setActiveTab('APPROVED')}
          >
            <Text style={[styles.tabText, activeTab === 'APPROVED' && styles.tabTextActive]}>
              Đã duyệt ({stats.approvedCount})
            </Text>
            {activeTab === 'APPROVED' && <View style={styles.tabIndicator} />}
          </Pressable>
          <Pressable
            style={styles.tabButton}
            onPress={() => setActiveTab('REJECTED')}
          >
            <Text style={[styles.tabText, activeTab === 'REJECTED' && styles.tabTextActive]}>
              Từ chối{stats.rejectedCount > 0 ? ` (${stats.rejectedCount})` : ''}
            </Text>
            {activeTab === 'REJECTED' && <View style={styles.tabIndicator} />}
          </Pressable>
        </View>

        {/* Search Bar */}
        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <MaterialCommunityIcons name="magnify" size={20} color="#94A3B8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm người, mã đơn, nội dung..."
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

        {/* Filter Categories (Types) */}
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
                  <Text style={[styles.filterPillText, isSelected && styles.filterPillTextActive]}>
                    {t.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Section Heading */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Danh sách đề xuất</Text>
          <Text style={styles.sectionCount}>{financialRequests.length} đơn</Text>
        </View>

        {/* List Content */}
        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#102739" />
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
              const dateStr = formatDateShort(item.createdAt);
              const userName = item.user?.profile?.fullName || item.user?.email || item.creatorName || 'Nhân viên';
              const statusObj = getStatusDisplay(item);
              const initials = getInitials(userName);
              const meta = typeof item.attachmentMetadata === 'object' && item.attachmentMetadata !== null ? item.attachmentMetadata : {};
              const hasVat = item.hasVat || meta.hasVat;
              const amount = Number(item.amount || 0);

              return (
                <Pressable
                  key={item.id}
                  style={styles.cardItem}
                  onPress={() => router.push(`${rolePrefix}/employee-requests/${item.id}` as any)}
                >
                  {/* Top Row: Avatar + Name/Meta on left, Amount + Status badge on right */}
                  <View style={styles.cardTopRow}>
                    <View style={styles.cardUserLeft}>
                      <View style={styles.avatarCircle}>
                        <Text style={styles.avatarText}>{initials}</Text>
                      </View>
                      <View style={styles.userInfo}>
                        <Text style={styles.userName} numberOfLines={1}>{userName}</Text>
                        <Text style={styles.userMeta}>
                          {item.type === 'EXPENSE' ? 'Thanh toán' : item.type === 'PURCHASE' ? 'Mua sắm' : 'Tạm ứng'}
                          {dateStr ? ` • ${dateStr}` : ''}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.cardAmountRight}>
                      <Text style={styles.amountText}>
                        {amount > 0 ? `${amount.toLocaleString('vi-VN')} VNĐ` : '0 VNĐ'}
                      </Text>
                      <View style={[styles.statusBadge, { backgroundColor: statusObj.bg }]}>
                        <Text style={[styles.statusBadgeText, { color: statusObj.color }]}>
                          {statusObj.text}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Body Content */}
                  <View style={styles.cardBody}>
                    <Text style={styles.cardTitle} numberOfLines={2}>
                      {item.title || (item.type === 'EXPENSE' ? 'Thanh toán chi phí' : 'Đề xuất tài chính')}
                    </Text>
                    {item.content ? (
                      <Text style={styles.cardContent} numberOfLines={2}>
                        {item.content}
                      </Text>
                    ) : null}
                  </View>

                  {/* Bottom Row */}
                  <View style={styles.cardBottomRow}>
                    <View style={styles.cardTagsLeft}>
                      {item.type === 'EXPENSE' && (
                        <View style={[styles.vatTag, hasVat ? styles.vatTagGreen : styles.vatTagAmber]}>
                          <Text style={[styles.vatTagText, hasVat ? styles.vatTagGreenText : styles.vatTagAmberText]}>
                            {hasVat ? 'Có VAT' : 'Không VAT'}
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
                    <View style={styles.actionLinkWrap}>
                      <Text style={styles.actionLinkText}>Xem chi tiết & xử lý</Text>
                      <MaterialCommunityIcons name="arrow-right" size={14} color="#0284C7" />
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        )}
      </View>

      {/* Export Options Modal */}
      <Modal
        visible={isExportModalOpen && canExportExcel}
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
                  { key: 'VAT_ONLY', label: 'Chỉ đơn có VAT (Kế toán)' },
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
                style={[styles.modalSubmitBtn, isExporting && { opacity: 0.6 }]}
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
    backgroundColor: '#102739',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  headerTitleWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  exportHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  exportHeaderBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  statsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 4,
  },
  statCol: {
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 38,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 16,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.75)',
    fontWeight: '500',
    marginBottom: 4,
  },
  statAmount: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  sheetContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 16,
  },
  tabButton: {
    paddingVertical: 14,
    marginRight: 24,
    position: 'relative',
    alignItems: 'center',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#0F172A',
    fontWeight: '800',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#102739',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  searchSection: {
    paddingHorizontal: 16,
    marginTop: 14,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    paddingVertical: 0,
  },
  filterSection: {
    marginTop: 12,
  },
  filterContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  filterPillActive: {
    backgroundColor: '#DBEAFE',
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
  },
  filterPillTextActive: {
    color: '#2563EB',
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionCount: {
    fontSize: 13,
    color: '#94A3B8',
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
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  cardItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  cardUserLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: '#0284C7',
    fontWeight: '700',
    fontSize: 14,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  userMeta: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  cardAmountRight: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
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
  cardBody: {
    marginTop: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  cardContent: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  cardTagsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  vatTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
    borderWidth: 1,
  },
  vatTagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  vatTagGreen: {
    backgroundColor: '#DCFCE7',
    borderColor: '#BBF7D0',
  },
  vatTagGreenText: {
    color: '#166534',
  },
  vatTagAmber: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  vatTagAmberText: {
    color: '#B45309',
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
  actionLinkWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionLinkText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0284C7',
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
  vatOptionGroup: {
    gap: 6,
    marginTop: 4,
  },
  vatOptionBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  vatOptionBtnActive: {
    borderColor: '#059669',
    backgroundColor: '#ECFDF5',
  },
  vatOptionText: {
    fontSize: 13,
    color: '#475569',
  },
  vatOptionTextActive: {
    color: '#059669',
    fontWeight: '700',
  },
  datePickerContainer: {
    marginTop: 8,
    gap: 6,
  },
  datePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  datePickerBtnText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  datePickerChangeHint: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  subFieldLabel: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 3,
  },
  datePickerBtnSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 6,
  },
  datePickerBtnTextSmall: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  modalSubmitBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  modalSubmitText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
