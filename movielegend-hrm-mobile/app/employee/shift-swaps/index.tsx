import { useState } from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../../src/theme/colors';
import { spacing } from '../../../src/theme/spacing';
import { shadows } from '../../../src/theme/shadows';
import { getMyShiftSwaps, updateShiftSwapStatus } from '../../../src/api/shift-swaps.api';
import { useAuth } from '../../../src/providers/AuthProvider';

export default function ShiftSwapsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');

  const { data: shiftSwaps, isLoading } = useQuery({
    queryKey: ['shift-swaps-me'],
    queryFn: () => getMyShiftSwaps(),
  });

  const updateStatusMutation = useMutation({
    mutationFn: (data: { id: string, status: any, reason?: string }) => updateShiftSwapStatus(data.id, { status: data.status, reason: data.reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shift-swaps-me'] });
    },
    onError: (err: any) => {
      Alert.alert('Lỗi', err?.message || 'Có lỗi xảy ra');
    }
  });

  const handleTargetApprove = (id: string) => {
    Alert.alert('Xác nhận', 'Bạn có đồng ý đổi ca với nhân viên này?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Đồng ý', onPress: () => updateStatusMutation.mutate({ id, status: 'PENDING_LEADER_APPROVAL' }) },
    ]);
  };

  const handleTargetReject = (id: string) => {
    Alert.alert('Từ chối', 'Bạn muốn từ chối yêu cầu đổi ca này?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Từ chối', style: 'destructive', onPress: () => updateStatusMutation.mutate({ id, status: 'REJECTED', reason: 'Người được đổi ca từ chối' }) },
    ]);
  };

  const filteredSwaps = (shiftSwaps || []).filter(s => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'PENDING') return s.status.includes('PENDING');
    return s.status === activeTab;
  });

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'PENDING_TARGET_APPROVAL': return { text: 'Chờ NV xác nhận', color: colors.warning };
      case 'PENDING_LEADER_APPROVAL': return { text: 'Chờ QL duyệt', color: colors.warning };
      case 'APPROVED': return { text: 'Đã duyệt', color: colors.success };
      case 'REJECTED': return { text: 'Từ chối', color: colors.danger };
      case 'CANCELLED': return { text: 'Đã hủy', color: colors.muted };
      default: return { text: status, color: colors.muted };
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#FAFAFA' }}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#fff' }}>
        <View style={[styles.header, shadows.sm]}>
          <View style={styles.headerLeft}>
            <Pressable onPress={() => router.back()} style={styles.iconBtn}>
              <MaterialCommunityIcons name="chevron-left" size={32} color="#111827" />
            </Pressable>
            <View>
              <Text style={styles.title}>Đơn đổi ca</Text>
              <Text style={styles.dateText}>Của tôi</Text>
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <Pressable style={[styles.tab, activeTab === 'ALL' && styles.tabActive]} onPress={() => setActiveTab('ALL')}>
            <Text style={[styles.tabText, activeTab === 'ALL' && styles.tabTextActive]}>Tất cả</Text>
          </Pressable>
          <Pressable style={[styles.tab, activeTab === 'PENDING' && styles.tabActive]} onPress={() => setActiveTab('PENDING')}>
            <Text style={[styles.tabText, activeTab === 'PENDING' && styles.tabTextActive]}>Chờ duyệt</Text>
          </Pressable>
          <Pressable style={[styles.tab, activeTab === 'APPROVED' && styles.tabActive]} onPress={() => setActiveTab('APPROVED')}>
            <Text style={[styles.tabText, activeTab === 'APPROVED' && styles.tabTextActive]}>Đã duyệt</Text>
          </Pressable>
          <Pressable style={[styles.tab, activeTab === 'REJECTED' && styles.tabActive]} onPress={() => setActiveTab('REJECTED')}>
            <Text style={[styles.tabText, activeTab === 'REJECTED' && styles.tabTextActive]}>Từ chối</Text>
          </Pressable>
        </View>
      </SafeAreaView>

      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#111827" />
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.lg }}>
          {filteredSwaps.length === 0 ? (
            <Text style={{ textAlign: 'center', color: colors.muted, marginTop: spacing.xl }}>
              Chưa có đơn đổi ca nào
            </Text>
          ) : (
            filteredSwaps.map(item => {
              const statusObj = getStatusDisplay(item.status);
              const isTargetUser = item.targetUserId === user?.id;
              const canAction = isTargetUser && item.status === 'PENDING_TARGET_APPROVAL';

              return (
                <Pressable 
                  key={item.id} 
                  style={[styles.card, shadows.sm]}
                  onPress={() => router.push(`/employee/shift-swaps/${item.id}`)}
                  android_ripple={{ color: 'rgba(0,0,0,0.05)' }}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderLeft}>
                      <View style={styles.cardIconBox}>
                        <MaterialCommunityIcons name="swap-horizontal" size={24} color="#3B82F6" />
                      </View>
                      <View>
                        <Text style={styles.cardTitle}>Xin đổi ca với {isTargetUser ? item.requester.fullName : item.target.fullName}</Text>
                        <Text style={styles.cardSubtitle}>{new Date(item.createdAt).toLocaleDateString('vi-VN')}</Text>
                      </View>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusObj.color + '15' }]}>
                      <Text style={[styles.statusText, { color: statusObj.color }]}>{statusObj.text}</Text>
                    </View>
                  </View>

                  <View style={styles.swapDetails}>
                    <View style={styles.swapSide}>
                      <Text style={styles.swapLabel}>Ca của bạn</Text>
                      <Text style={styles.swapValue}>{isTargetUser ? item.toShift.name : item.fromShift.name}</Text>
                      <Text style={styles.swapDate}>{new Date(isTargetUser ? item.toDate : item.fromDate).toLocaleDateString('vi-VN')}</Text>
                    </View>
                    <MaterialCommunityIcons name="arrow-right-bold" size={24} color={colors.muted} />
                    <View style={styles.swapSide}>
                      <Text style={styles.swapLabel}>Ca lấy về</Text>
                      <Text style={styles.swapValue}>{isTargetUser ? item.fromShift.name : item.toShift.name}</Text>
                      <Text style={styles.swapDate}>{new Date(isTargetUser ? item.fromDate : item.toDate).toLocaleDateString('vi-VN')}</Text>
                    </View>
                  </View>

                  {item.reason && (
                    <Text style={styles.cardContent} numberOfLines={2}>Lý do: {item.reason}</Text>
                  )}

                  {canAction && (
                    <View style={styles.actionRow}>
                      <Pressable 
                        style={[styles.actionBtn, { backgroundColor: '#FEE2E2', marginRight: 8 }]} 
                        onPress={() => handleTargetReject(item.id)}
                      >
                        <Text style={[styles.actionBtnText, { color: colors.danger }]}>Từ chối</Text>
                      </Pressable>
                      <Pressable 
                        style={[styles.actionBtn, { backgroundColor: colors.primary }]} 
                        onPress={() => handleTargetApprove(item.id)}
                      >
                        <Text style={[styles.actionBtnText, { color: '#fff' }]}>Đồng ý đổi</Text>
                      </Pressable>
                    </View>
                  )}
                </Pressable>
              );
            })
          )}
        </ScrollView>
      )}

      {/* FAB */}
      <Pressable style={styles.fab} onPress={() => router.push('/employee/shift-swaps/create')}>
        <MaterialCommunityIcons name="plus" size={32} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: '#fff',
    zIndex: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    padding: 4,
    marginRight: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  dateText: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  tab: {
    marginRight: spacing.xl,
    paddingVertical: spacing.sm,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#111827',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  tabTextActive: {
    color: '#111827',
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    flex: 1,
  },
  cardIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  swapDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.md,
  },
  swapSide: {
    flex: 1,
    alignItems: 'center',
  },
  swapLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  swapValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  swapDate: {
    fontSize: 12,
    color: '#4B5563',
    marginTop: 2,
  },
  cardContent: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    fontWeight: '700',
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
