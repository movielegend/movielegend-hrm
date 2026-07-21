import { useState } from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Screen } from '../../../src/components/Screen';
import { colors } from '../../../src/theme/colors';
import { spacing } from '../../../src/theme/spacing';
import { getLeaderPendingSwaps, updateShiftSwapStatus } from '../../../src/api/shift-swaps.api';

export default function LeaderShiftSwapsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'PENDING_LEADER_APPROVAL' | 'APPROVED' | 'REJECTED'>('PENDING_LEADER_APPROVAL');

  const { data: allSwaps = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['leader-shift-swaps'],
    queryFn: () => getLeaderPendingSwaps()
  });

  const swaps = allSwaps.filter((r: any) => {
    if (activeTab === 'PENDING_LEADER_APPROVAL') return r.status === 'PENDING_LEADER_APPROVAL';
    return r.status === activeTab;
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => updateShiftSwapStatus(id, { status: 'APPROVED' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leader-shift-swaps'] });
      Alert.alert('Thành công', 'Đã duyệt yêu cầu đổi ca.');
    },
    onError: (err: any) => {
      Alert.alert('Lỗi', err.response?.data?.message || err.message || 'Có lỗi xảy ra.');
    }
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => updateShiftSwapStatus(id, { status: 'REJECTED' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leader-shift-swaps'] });
      Alert.alert('Thành công', 'Đã từ chối yêu cầu đổi ca.');
    },
    onError: (err: any) => {
      Alert.alert('Lỗi', err.response?.data?.message || err.message || 'Có lỗi xảy ra.');
    }
  });

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable onPress={() => router.back()} style={styles.iconBtn}>
            <MaterialCommunityIcons name="chevron-left" size={28} color={colors.text} />
          </Pressable>
          <View>
            <Text style={styles.title}>Duyệt Đổi Ca</Text>
            <View style={styles.dateSelector}>
              <Text style={styles.dateText}>Quản lý yêu cầu đổi ca làm việc</Text>
            </View>
          </View>
        </View>
      </View>

      {/* List */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : swaps.length === 0 ? (
        <ScrollView 
          contentContainerStyle={styles.emptyContainer}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        >
          <View style={styles.emptyIconBg}>
            <MaterialCommunityIcons name="swap-horizontal-circle-outline" size={64} color="#9CA3AF" />
          </View>
          <Text style={styles.emptyText}>Không có yêu cầu đổi ca nào chờ duyệt</Text>
        </ScrollView>
      ) : (
        <ScrollView 
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        >
          {swaps.map((item: any) => {
            const dateStr = item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : '';
            const requesterName = item.requester?.profile?.fullName || item.requester?.email || 'Người xin đổi';
            const targetName = item.target?.profile?.fullName || item.target?.email || 'Người được đổi';
            
            const fromDateStr = item.fromDate ? new Date(item.fromDate).toLocaleDateString('vi-VN') : '';
            const toDateStr = item.toDate ? new Date(item.toDate).toLocaleDateString('vi-VN') : '';

            return (
              <Pressable 
                key={item.id} 
                style={styles.card}
                onPress={() => router.push(`/leader/shift-swaps/${item.id}`)}
                android_ripple={{ color: 'rgba(0,0,0,0.05)' }}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.cardIconBox}>
                    <MaterialCommunityIcons name="swap-horizontal" size={24} color="#111827" />
                  </View>
                  <View style={styles.cardHeaderRight}>
                    <Text style={styles.cardUserName}>{requesterName} &lt;-&gt; {targetName}</Text>
                    <Text style={styles.cardSubtitle}>Yêu cầu đổi ca • {dateStr}</Text>
                  </View>
                </View>
                
                <View style={styles.shiftDetails}>
                  <Text style={styles.shiftText}><Text style={styles.bold}>Ca của {requesterName}:</Text> {item.fromShift?.name} ({fromDateStr})</Text>
                  <Text style={styles.shiftText}><Text style={styles.bold}>Ca của {targetName}:</Text> {item.toShift?.name} ({toDateStr})</Text>
                </View>

                {item.reason && (
                  <Text style={styles.cardContent} numberOfLines={2}>Lý do: {item.reason}</Text>
                )}

                {item.status === 'PENDING_LEADER_APPROVAL' && (
                  <View style={styles.actionButtons}>
                    <Pressable 
                      style={[styles.btnAction, styles.btnReject]} 
                      onPress={() => rejectMutation.mutate(item.id)}
                      disabled={rejectMutation.isPending || approveMutation.isPending}
                    >
                      <MaterialCommunityIcons name="close" size={20} color="#F43F5E" />
                      <Text style={styles.btnRejectText}>Từ chối</Text>
                    </Pressable>
                    <Pressable 
                      style={[styles.btnAction, styles.btnApprove]} 
                      onPress={() => approveMutation.mutate(item.id)}
                      disabled={rejectMutation.isPending || approveMutation.isPending}
                    >
                      <MaterialCommunityIcons name="check" size={20} color="#fff" />
                      <Text style={styles.btnApproveText}>Duyệt đơn</Text>
                    </Pressable>
                  </View>
                )}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    padding: spacing.xs,
    marginRight: spacing.sm,
    marginLeft: -spacing.xs,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  dateText: {
    fontSize: 14,
    color: colors.muted,
  },
  listContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl * 2,
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cardIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  cardHeaderRight: {
    flex: 1,
  },
  cardUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  cardSubtitle: {
    fontSize: 13,
    color: colors.muted,
    marginTop: 2,
  },
  shiftDetails: {
    backgroundColor: '#F9FAFB',
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  shiftText: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 4,
  },
  bold: {
    fontWeight: '600',
  },
  cardContent: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  btnAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  btnReject: {
    backgroundColor: '#FFF1F2',
  },
  btnRejectText: {
    color: '#F43F5E',
    fontWeight: '600',
    fontSize: 14,
  },
  btnApprove: {
    backgroundColor: '#111827',
  },
  btnApproveText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyIconBg: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyText: {
    fontSize: 16,
    color: colors.muted,
    fontWeight: '500',
  },
});
