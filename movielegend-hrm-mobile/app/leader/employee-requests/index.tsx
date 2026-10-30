import { useState } from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView, ActivityIndicator, RefreshControl, TextInput, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../src/providers/AuthProvider';
import { CustomAlert } from '../../../src/components/CustomAlert';
import { getRoleBaseRoute, isAccountingLeader } from '../../../src/utils/role-routing';
import { colors } from '../../../src/theme/colors';
import { spacing } from '../../../src/theme/spacing';
import { getEmployeeRequests, approveEmployeeRequest, rejectEmployeeRequest } from '../../../src/api/employee-requests.api';
import { exportAndShareFinancialExcel } from '../../../src/utils/export-financial-excel';
import type { EmployeeRequestType, EmployeeRequestStatus } from '../../../src/types/request.types';

const REQUEST_TYPES: { type: EmployeeRequestType | 'ALL', label: string, icon: keyof typeof MaterialCommunityIcons.glyphMap, color: string }[] = [
  { type: 'ALL', label: 'Tất cả', icon: 'format-list-bulleted', color: colors.muted },
  { type: 'LEAVE', label: 'Nghỉ phép', icon: 'beach', color: '#10B981' },
  { type: 'COMPENSATORY_WORK', label: 'Làm bù', icon: 'calendar-sync-outline', color: '#0284C7' },
  { type: 'ATTENDANCE_ADJUSTMENT', label: 'Giải trình công', icon: 'clock-edit-outline', color: '#F59E0B' },
  { type: 'OVERTIME', label: 'Làm thêm', icon: 'briefcase-clock-outline', color: '#6366F1' },
  { type: 'LATE_ARRIVAL', label: 'Đi muộn', icon: 'run', color: '#F43F5E' },
  { type: 'EARLY_LEAVE', label: 'Về sớm', icon: 'door-open', color: '#8B5CF6' },
  { type: 'BUSINESS_TRIP', label: 'Công tác', icon: 'airplane', color: '#3B82F6' },
  { type: 'ADVANCE', label: 'Tạm ứng', icon: 'cash', color: '#14B8A6' },
  { type: 'EXPENSE', label: 'Thanh toán', icon: 'receipt', color: '#F97316' },
  { type: 'PURCHASE', label: 'Mua sắm', icon: 'cart-outline', color: '#0EA5E9' },
];

export default function LeaderRequestsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const rolePrefix = getRoleBaseRoute(user);
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<EmployeeRequestStatus>('PENDING');
  const [selectedType, setSelectedType] = useState<EmployeeRequestType | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const canExportExcel = isAccountingLeader(user);

  const rawRoles = user?.roles || [];
  const userRoles = Array.isArray(rawRoles) ? rawRoles : [rawRoles];
  const roleCodes = userRoles.map((r: any) => (typeof r === 'string' ? r : r?.code || r?.name || '').toUpperCase());
  const isAdmin =
    roleCodes.includes('ADMIN') ||
    roleCodes.includes('SUPER_ADMIN') ||
    (user as any)?.role?.code === 'ADMIN' ||
    user?.phone === '0900000000';

  const isChiefAccountant = isAccountingLeader(user);
  const isHr =
    roleCodes.includes('HR') ||
    roleCodes.includes('HR_MANAGER') ||
    (user as any)?.role?.code === 'HR';
  const isOnlyChiefAccountant = isChiefAccountant && !isAdmin && !isHr;

  const { data: allRequests = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['leader-employee-requests'],
    queryFn: () => getEmployeeRequests()
  });

  // Client-side filtering
  const requests = allRequests.filter((r: any) => {
    // If Chief Accountant (and not Admin/HR), non-financial requests must be from accounting department
    if (isOnlyChiefAccountant && !['ADVANCE', 'EXPENSE', 'PURCHASE'].includes(r.type)) {
      const userDeptId = (user as any)?.department?.id;
      const deptName = r.user?.department?.name?.toLowerCase() || (user as any)?.department?.name?.toLowerCase() || '';
      const matchDept =
        (userDeptId && (r.departmentId === userDeptId || r.user?.departmentId === userDeptId)) ||
        deptName.includes('kế toán') ||
        deptName.includes('tài chính');
      if (!matchDept) return false;
    }

    const isPendingCancel = r.status === 'APPROVED' && r.attachmentMetadata?.cancellationRequested;
    const matchTab = (activeTab === 'PENDING' && (r.status === 'PENDING' || isPendingCancel)) ||
                     (activeTab === 'APPROVED' && r.status === 'APPROVED' && !isPendingCancel) ||
                     (activeTab === 'REJECTED' && (r.status === 'REJECTED' || r.status === 'CANCELLED'));
    const isItemCompensatory = r.type === 'COMPENSATORY_WORK' || r.title?.includes('[LÀM BÙ]') || r.attachmentMetadata?.requestType === 'COMPENSATORY_WORK';
    const matchType = selectedType === 'ALL' || 
      (selectedType === 'COMPENSATORY_WORK' ? isItemCompensatory : (r.type === selectedType && !isItemCompensatory));
    const userName = r.user?.profile?.fullName || r.user?.email || '';
    const content = r.content || '';
    const title = r.title || '';
    const matchSearch = !search.trim() || 
      userName.toLowerCase().includes(search.toLowerCase()) || 
      title.toLowerCase().includes(search.toLowerCase()) ||
      content.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchType && matchSearch;
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => approveEmployeeRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leader-employee-requests'] });
      CustomAlert.alert('Thành công', 'Đã duyệt yêu cầu.');
    },
    onError: (err: any) => {
      CustomAlert.alert('Lỗi', err.response?.data?.message || err.message || 'Có lỗi xảy ra.');
    }
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => rejectEmployeeRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leader-employee-requests'] });
      CustomAlert.alert('Thành công', 'Đã từ chối yêu cầu.');
    },
    onError: (err: any) => {
      CustomAlert.alert('Lỗi', err.response?.data?.message || err.message || 'Có lỗi xảy ra.');
    }
  });

  const getStatusDisplay = (item: any) => {
    const status = item?.status;
    const meta = (typeof item?.attachmentMetadata === 'object' && item?.attachmentMetadata !== null) ? item.attachmentMetadata : {};
    const stage = meta.stage;

    if (status === 'CANCELLED') {
      return { text: 'Đã hủy ca', color: '#6B7280', bg: '#F3F4F6' };
    }
    if (status === 'REJECTED') {
      return { text: 'Từ chối', color: '#EF4444', bg: '#FEE2E2' };
    }
    if (status === 'APPROVED') {
      if (meta.cancellationRequested) {
        return { text: 'Xin hủy làm bù', color: '#D97706', bg: '#FEF3C7' };
      }
      if (stage === 'PURCHASE_FULFILLED') {
        return { text: 'Đã hoàn tất mua sắm', color: '#166534', bg: '#DCFCE7' };
      }
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
          return { text: 'Chờ HR đối chứng', color: '#1D4ED8', bg: '#DBEAFE' };
        case 'PENDING_ADMIN':
          return { text: 'Chờ Admin duyệt', color: '#6D28D9', bg: '#EDE9FE' };
        case 'PENDING_DISBURSEMENT':
        case 'PENDING_ACCOUNTANT':
          return { text: item?.type === 'PURCHASE' ? 'Chờ Kế toán chi HR' : 'Chờ giải ngân', color: '#C2410C', bg: '#FFEDD5' };
        case 'PENDING_HR_PURCHASE':
          return { text: 'HR đang mua hàng', color: '#0284C7', bg: '#E0F2FE' };
        case 'REJECTED_TO_HR':
          return { text: 'HR đang điều chỉnh', color: '#EA580C', bg: '#FFEDD5' };
        default:
          return { text: 'Chờ xử lý', color: '#B45309', bg: '#FEF3C7' };
      }
    }
    return { text: 'Không rõ', color: '#6B7280', bg: '#F3F4F6' };
  };

  const getTypeConfig = (type: EmployeeRequestType) => {
    return REQUEST_TYPES.find(t => t.type === type) || REQUEST_TYPES[0];
  };

  const getInitials = (name?: string) => {
    if (!name) return 'NV';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#102739" translucent={false} />

      {/* ── Top Header (#102739) ── */}
      <View style={[styles.headerWrap, { paddingTop: Math.max(insets.top, 16) + 4 }]}>
        <View style={styles.headerMainRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
            <Ionicons name="chevron-back" size={26} color="#FFFFFF" />
          </Pressable>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>
              {isOnlyChiefAccountant ? 'Duyệt yêu cầu phòng Kế toán' : 'Duyệt yêu cầu'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {isOnlyChiefAccountant ? 'Quản lý yêu cầu nhân sự phòng Kế toán' : 'Quản lý yêu cầu của nhân sự'}
            </Text>
          </View>
          <View style={styles.headerRightActions}>
            {canExportExcel && (
              <Pressable 
                style={[styles.headerExportBtn, isExporting && { opacity: 0.6 }]} 
                onPress={async () => {
                  setIsExporting(true);
                  try {
                    await exportAndShareFinancialExcel({ date: 'ALL' });
                  } finally {
                    setIsExporting(false);
                  }
                }}
                disabled={isExporting}
              >
                {isExporting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="file-excel-box" size={15} color="#FFFFFF" />
                    <Text style={styles.headerExportText}>Xuất Excel</Text>
                  </>
                )}
              </Pressable>
            )}
            {!isAdmin && (
              <Pressable 
                style={styles.headerCreateBtn} 
                onPress={() => router.push('/employee/requests/create' as any)}
              >
                <MaterialCommunityIcons name="plus" size={16} color="#FFFFFF" />
                <Text style={styles.headerCreateText}>Tạo đơn</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>

      {/* ── Main Curved Sheet ── */}
      <View style={styles.curvedSheet}>
        {/* 2. Segmented Control */}
        <View style={styles.segmentedContainer}>
          <Pressable 
            style={[styles.segmentBtn, activeTab === 'PENDING' && styles.segmentBtnActive]} 
            onPress={() => setActiveTab('PENDING')}
          >
            <Text style={[styles.segmentText, activeTab === 'PENDING' && styles.segmentTextActive]}>Chờ xử lý</Text>
          </Pressable>
          <Pressable 
            style={[styles.segmentBtn, activeTab === 'APPROVED' && styles.segmentBtnActive]} 
            onPress={() => setActiveTab('APPROVED')}
          >
            <Text style={[styles.segmentText, activeTab === 'APPROVED' && styles.segmentTextActive]}>Đã duyệt</Text>
          </Pressable>
          <Pressable 
            style={[styles.segmentBtn, activeTab === 'REJECTED' && styles.segmentBtnActive]} 
            onPress={() => setActiveTab('REJECTED')}
          >
            <Text style={[styles.segmentText, activeTab === 'REJECTED' && styles.segmentTextActive]}>Từ chối</Text>
          </Pressable>
        </View>

        {/* 3. Search Bar */}
        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <MaterialCommunityIcons name="magnify" size={20} color="#94A3B8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm người gửi hoặc nội dung"
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

        {/* 4. Categories Filter */}
        <View style={styles.filterSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContainer}>
            {REQUEST_TYPES.map((t) => {
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

        {/* 5. List */}
        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#102739" />
          </View>
        ) : requests.length === 0 ? (
          <ScrollView 
            contentContainerStyle={styles.emptyContainer}
            refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          >
            <View style={styles.emptyIconBg}>
              <MaterialCommunityIcons name="text-box-search-outline" size={48} color="#0284C7" />
            </View>
            <Text style={styles.emptyText}>Không có yêu cầu phù hợp</Text>
            <Text style={styles.emptySubtext}>Thử chọn danh mục khác hoặc thay đổi bộ lọc</Text>
          </ScrollView>
        ) : (
          <ScrollView 
            contentContainerStyle={styles.listContainer}
            refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
            showsVerticalScrollIndicator={false}
          >
            {requests.map((item: any) => {
              const isItemCompensatory = item.type === 'COMPENSATORY_WORK' || item.title?.includes('[LÀM BÙ]') || item.attachmentMetadata?.requestType === 'COMPENSATORY_WORK';
              const config = isItemCompensatory ? { type: 'COMPENSATORY_WORK', label: 'Làm bù', icon: 'calendar-sync-outline' as any, color: '#0284C7' } : getTypeConfig(item.type);
              const dateStr = item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : '';
              const userName = item.user?.profile?.fullName || item.user?.email || 'Nhân viên';
              const statusObj = getStatusDisplay(item);
              const initials = getInitials(userName);
              
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
                      <Text style={styles.cardMeta}>{config.label} • {dateStr}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusObj.bg }]}>
                      <Text style={[styles.statusBadgeText, { color: statusObj.color }]}>
                        {statusObj.text}
                      </Text>
                    </View>
                  </View>
                  
                  <Text style={styles.cardTitle}>{item.title || config.label}</Text>
                  {item.content ? (
                    <Text style={styles.cardContent} numberOfLines={2}>{item.content}</Text>
                  ) : null}
                  
                  {item.amount != null && (
                    <Text style={styles.cardAmount}>
                      {Number(item.amount).toLocaleString('vi-VN')} VNĐ
                    </Text>
                  )}

                  <View style={styles.cardFooter}>
                    <Text style={styles.cardFooterLink}>
                      Xem chi tiết & xử lý →
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#102739',
  },
  headerWrap: {
    backgroundColor: '#102739',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    padding: 4,
    marginRight: 6,
    marginLeft: -4,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12.5,
    color: 'rgba(255, 255, 255, 0.72)',
    fontWeight: '500',
    marginTop: 2,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerCreateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  headerCreateText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  headerExportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  headerExportText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  curvedSheet: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 4,
    borderRadius: 14,
    gap: 4,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  segmentBtnActive: {
    backgroundColor: '#102739',
    shadowColor: '#102739',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  segmentTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  searchSection: {
    paddingHorizontal: 16,
    marginTop: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
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
    marginTop: 10,
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 2,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  filterPillActive: {
    backgroundColor: '#E0F2FE',
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
  },
  filterPillTextActive: {
    color: '#0284C7',
    fontWeight: '700',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  emptyIconBg: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 32,
    gap: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 15,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#102739',
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
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#102739',
  },
  cardHeaderMiddle: {
    flex: 1,
  },
  cardUserName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  cardMeta: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  cardContent: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 4,
  },
  cardAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0284C7',
    marginTop: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  cardFooterLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#102739',
  },
});
