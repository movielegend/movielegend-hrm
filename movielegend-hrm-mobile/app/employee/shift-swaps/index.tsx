import { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../../src/theme/colors';
import { getMyShiftSwaps, updateShiftSwapStatus } from '../../../src/api/shift-swaps.api';
import { useAuth } from '../../../src/providers/AuthProvider';
import { CustomAlert } from '../../../src/components/CustomAlert';

export default function ShiftSwapsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');

  const { data: shiftSwaps, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['shift-swaps-me'],
    queryFn: () => getMyShiftSwaps(),
  });

  const updateStatusMutation = useMutation({
    mutationFn: (data: { id: string; status: any; reason?: string }) =>
      updateShiftSwapStatus(data.id, { status: data.status, reason: data.reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shift-swaps-me'] });
    },
    onError: (err: any) => {
      CustomAlert.alert('Lỗi', err?.message || 'Có lỗi xảy ra');
    },
  });

  const handleTargetApprove = (id: string) => {
    CustomAlert.alert('Xác nhận', 'Bạn có đồng ý đổi ca với nhân viên này?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Đồng ý', onPress: () => updateStatusMutation.mutate({ id, status: 'PENDING_LEADER_APPROVAL' }) },
    ]);
  };

  const handleTargetReject = (id: string) => {
    CustomAlert.alert('Từ chối', 'Bạn muốn từ chối yêu cầu đổi ca này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Từ chối',
        style: 'destructive',
        onPress: () =>
          updateStatusMutation.mutate({ id, status: 'REJECTED', reason: 'Người được đổi ca từ chối' }),
      },
    ]);
  };

  const filteredSwaps = (shiftSwaps || []).filter((s) => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'PENDING') return s.status.includes('PENDING');
    return s.status === activeTab;
  });

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'PENDING_TARGET_APPROVAL':
        return { text: 'Chờ NV xác nhận', bg: '#FEF3C7', color: '#D97706' };
      case 'PENDING_LEADER_APPROVAL':
        return { text: 'Chờ QL duyệt', bg: '#FEF3C7', color: '#D97706' };
      case 'APPROVED':
        return { text: 'Đã duyệt', bg: '#E8F5E9', color: '#16A34A' };
      case 'REJECTED':
        return { text: 'Từ chối', bg: '#FEE2E2', color: '#DC2626' };
      case 'CANCELLED':
        return { text: 'Đã hủy', bg: '#F4F4F5', color: '#71717A' };
      default:
        return { text: status, bg: '#F4F4F5', color: '#71717A' };
    }
  };

  const safeTopInset = Math.max((insets.top > 0 ? insets.top : (StatusBar.currentHeight || 20)) - 6, 8);

  const tabs: { key: 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'; label: string }[] = [
    { key: 'ALL', label: 'Tất cả' },
    { key: 'PENDING', label: 'Chờ duyệt' },
    { key: 'APPROVED', label: 'Đã duyệt' },
    { key: 'REJECTED', label: 'Từ chối' },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#123826" translucent={Platform.OS === 'android'} />

      {/* Top Header */}
      <View style={[styles.headerBanner, { paddingTop: safeTopInset }]}>
        <View style={styles.headerTopRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12} accessibilityLabel="Quay lại">
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </Pressable>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Đơn đổi ca</Text>
            <Text style={styles.headerSubtitle}>Của tôi</Text>
          </View>
          <View style={styles.headerRightPlaceholder} />
        </View>
      </View>

      {/* Body Container */}
      <View style={styles.bodyContainer}>
        {/* Filter Chips */}
        <View style={styles.tabsRow}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <Pressable
                key={tab.key}
                style={[styles.tabChip, isActive && styles.tabChipActive]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Text style={[styles.tabChipText, isActive && styles.tabChipTextActive]}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {isLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#123826" />
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={() => void refetch()}
                colors={['#123826']}
              />
            }
            showsVerticalScrollIndicator={false}
          >
            {filteredSwaps.length === 0 ? (
              <View style={styles.emptyCard}>
                <View style={styles.emptyIconCircle}>
                  <MaterialCommunityIcons name="calendar-sync-outline" size={48} color="#123826" />
                </View>
                <Text style={styles.emptyTitle}>Chưa có đơn đổi ca nào</Text>
                <Text style={styles.emptySubtitle}>
                  Các yêu cầu đổi ca của bạn sẽ xuất hiện tại đây.
                </Text>
              </View>
            ) : (
              filteredSwaps.map((item) => {
                const statusObj = getStatusDisplay(item.status);
                const isTargetUser = item.targetUserId === user?.id;
                const canAction = isTargetUser && item.status === 'PENDING_TARGET_APPROVAL';

                return (
                  <Pressable
                    key={item.id}
                    style={styles.card}
                    onPress={() => router.push(`/employee/shift-swaps/${item.id}`)}
                    android_ripple={{ color: 'rgba(0,0,0,0.05)' }}
                  >
                    <View style={styles.cardHeader}>
                      <View style={styles.cardHeaderLeft}>
                        <View style={styles.cardIconBox}>
                          <MaterialCommunityIcons name="swap-horizontal" size={22} color="#123826" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.cardTitle} numberOfLines={1}>
                            Đổi ca với {(isTargetUser ? (item.requester?.fullName || item.requester?.profile?.fullName) : (item.target?.fullName || item.target?.profile?.fullName)) || 'nhân viên'}
                          </Text>
                          <Text style={styles.cardSubtitle}>
                            {item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : ''}
                          </Text>
                        </View>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: statusObj.bg }]}>
                        <Text style={[styles.statusText, { color: statusObj.color }]}>
                          {statusObj.text}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.swapDetails}>
                      <View style={styles.swapSide}>
                        <Text style={styles.swapLabel}>Ca của bạn</Text>
                        <Text style={styles.swapValue}>
                          {isTargetUser ? item.toShift?.name : item.fromShift?.name}
                        </Text>
                        <Text style={styles.swapDate}>
                          {new Date(isTargetUser ? item.toDate : item.fromDate).toLocaleDateString('vi-VN')}
                        </Text>
                      </View>
                      <MaterialCommunityIcons name="arrow-right-bold" size={20} color="#94A3B8" />
                      <View style={styles.swapSide}>
                        <Text style={styles.swapLabel}>Ca lấy về</Text>
                        <Text style={styles.swapValue}>
                          {isTargetUser ? item.fromShift?.name : item.toShift?.name}
                        </Text>
                        <Text style={styles.swapDate}>
                          {new Date(isTargetUser ? item.fromDate : item.toDate).toLocaleDateString('vi-VN')}
                        </Text>
                      </View>
                    </View>

                    {item.reason ? (
                      <Text style={styles.cardReason} numberOfLines={2}>
                        Lý do: {item.reason}
                      </Text>
                    ) : null}

                    {canAction && (
                      <View style={styles.actionRow}>
                        <Pressable
                          style={[styles.actionBtn, styles.actionRejectBtn]}
                          onPress={() => handleTargetReject(item.id)}
                        >
                          <Text style={styles.actionRejectBtnText}>Từ chối</Text>
                        </Pressable>
                        <Pressable
                          style={[styles.actionBtn, styles.actionApproveBtn]}
                          onPress={() => handleTargetApprove(item.id)}
                        >
                          <Text style={styles.actionApproveBtnText}>Đồng ý đổi</Text>
                        </Pressable>
                      </View>
                    )}
                  </Pressable>
                );
              })
            )}
          </ScrollView>
        )}

        {/* Bottom Button */}
        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <Pressable
            style={styles.createBtn}
            onPress={() => router.push('/employee/shift-swaps/create')}
            android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
          >
            <Ionicons name="add" size={22} color="#FFFFFF" />
            <Text style={styles.createBtnText}>Tạo đơn đổi ca</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#123826',
  },
  headerBanner: {
    backgroundColor: '#123826',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginLeft: -4,
  },
  headerTitleWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#A7D8BE',
    marginTop: 2,
  },
  headerRightPlaceholder: {
    width: 32,
  },
  bodyContainer: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -8,
    overflow: 'hidden',
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 8,
  },
  tabChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F4F4F5',
  },
  tabChipActive: {
    backgroundColor: '#123826',
  },
  tabChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#71717A',
  },
  tabChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    paddingVertical: 56,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  emptyIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#18181B',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13.5,
    color: '#71717A',
    textAlign: 'center',
    lineHeight: 19,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E4E4E7',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  cardIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#18181B',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#71717A',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  swapDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  swapSide: {
    flex: 1,
    alignItems: 'center',
  },
  swapLabel: {
    fontSize: 11.5,
    color: '#71717A',
    marginBottom: 2,
  },
  swapValue: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#18181B',
  },
  swapDate: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },
  cardReason: {
    fontSize: 13,
    color: '#52525B',
    lineHeight: 18,
    marginBottom: 8,
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionRejectBtn: {
    backgroundColor: '#FEE2E2',
  },
  actionRejectBtnText: {
    fontWeight: '700',
    fontSize: 13,
    color: '#DC2626',
  },
  actionApproveBtn: {
    backgroundColor: '#123826',
  },
  actionApproveBtnText: {
    fontWeight: '700',
    fontSize: 13,
    color: '#FFFFFF',
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: '#FAFAFA',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  createBtn: {
    backgroundColor: '#123826',
    height: 50,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createBtnText: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 6,
  },
});
