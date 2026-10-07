import { useState } from 'react';
import {StyleSheet, Text, View, Pressable, ScrollView, ActivityIndicator, RefreshControl, TextInput} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../src/providers/AuthProvider';
import { CustomAlert } from '../../../src/components/CustomAlert';
import { getRoleBaseRoute } from '../../../src/utils/role-routing';
import { Screen } from '../../../src/components/Screen';
import { colors } from '../../../src/theme/colors';
import { spacing } from '../../../src/theme/spacing';
import { getEmployeeRequests, approveEmployeeRequest, rejectEmployeeRequest } from '../../../src/api/employee-requests.api';
import type { EmployeeRequestType, EmployeeRequestStatus } from '../../../src/types/request.types';

const REQUEST_TYPES: { type: EmployeeRequestType | 'ALL', label: string, icon: keyof typeof MaterialCommunityIcons.glyphMap, color: string }[] = [
  { type: 'ALL', label: 'Tất cả', icon: 'format-list-bulleted', color: colors.muted },
  { type: 'LEAVE', label: 'Nghỉ phép', icon: 'beach', color: '#10B981' },
  { type: 'ATTENDANCE_ADJUSTMENT', label: 'Giải trình công', icon: 'clock-edit-outline', color: '#F59E0B' },
  { type: 'OVERTIME', label: 'Làm thêm', icon: 'briefcase-clock-outline', color: '#6366F1' },
  { type: 'LATE_ARRIVAL', label: 'Đi muộn', icon: 'run', color: '#F43F5E' },
  { type: 'EARLY_LEAVE', label: 'Về sớm', icon: 'door-open', color: '#8B5CF6' },
  { type: 'BUSINESS_TRIP', label: 'Công tác', icon: 'airplane', color: '#3B82F6' },
  { type: 'ADVANCE', label: 'Tạm ứng', icon: 'cash', color: '#14B8A6' },
  { type: 'EXPENSE', label: 'Thanh toán', icon: 'receipt', color: '#F97316' },
];

export default function LeaderRequestsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const rolePrefix = getRoleBaseRoute(user);
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<EmployeeRequestStatus>('PENDING');
  const [selectedType, setSelectedType] = useState<EmployeeRequestType | 'ALL'>('ALL');
  const [search, setSearch] = useState('');

  const { data: allRequests = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['leader-employee-requests'],
    queryFn: () => getEmployeeRequests()
  });

  // Client-side filtering
  const requests = allRequests.filter((r: any) => {
    const matchTab = r.status === activeTab;
    const matchType = selectedType === 'ALL' || r.type === selectedType;
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
    mutationFn: approveEmployeeRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leader-employee-requests'] });
      CustomAlert.alert('Thành công', 'Đã duyệt yêu cầu.');
    },
    onError: (err: any) => {
      CustomAlert.alert('Lỗi', err.response?.data?.message || err.message || 'Có lỗi xảy ra.');
    }
  });

  const rejectMutation = useMutation({
    mutationFn: rejectEmployeeRequest,
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
          return { text: 'Chờ HR đối chứng', color: '#1D4ED8', bg: '#DBEAFE' };
        case 'PENDING_ADMIN':
          return { text: 'Chờ Admin duyệt', color: '#6D28D9', bg: '#EDE9FE' };
        case 'PENDING_DISBURSEMENT':
          return { text: 'Chờ giải ngân', color: '#C2410C', bg: '#FFEDD5' };
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
    <Screen>
      {/* 1. Header (Back button + Title on same row + Right Action Button) */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerRow}>
            <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
              <MaterialCommunityIcons name="chevron-left" size={26} color="#0F172A" />
            </Pressable>
            <Text style={styles.title}>Duyệt yêu cầu</Text>
          </View>
          <Pressable 
            style={styles.headerCreateBtn} 
            onPress={() => router.push('/employee/requests/create' as any)}
          >
            <MaterialCommunityIcons name="plus" size={16} color="#FFFFFF" />
            <Text style={styles.headerCreateText}>Tạo đơn</Text>
          </Pressable>
        </View>
        <Text style={styles.subtitle}>Quản lý yêu cầu của nhân sự</Text>
      </View>

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
          <ActivityIndicator size="large" color="#1B382B" />
        </View>
      ) : requests.length === 0 ? (
        <ScrollView 
          contentContainerStyle={styles.emptyContainer}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        >
          <View style={styles.emptyIconBg}>
            <MaterialCommunityIcons name="text-box-search-outline" size={54} color="#94A3B8" />
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
            const config = getTypeConfig(item.type);
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
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    marginRight: 6,
    padding: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
    marginLeft: 34,
  },
  headerCreateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E3E2F',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  headerCreateText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 4,
    borderRadius: 10,
    gap: 4,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  segmentBtnActive: {
    backgroundColor: '#1E3E2F',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
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
    marginTop: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    paddingVertical: 0,
  },
  filterSection: {
    marginTop: 8,
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  filterPillActive: {
    backgroundColor: '#DCFCE7',
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
  },
  filterPillTextActive: {
    color: '#166534',
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
    paddingTop: 60,
  },
  emptyIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4,
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
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    backgroundColor: '#D9E4DD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1B382B',
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
    fontSize: 14,
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
    color: '#166534',
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
    color: '#1E3E2F',
  },
});
