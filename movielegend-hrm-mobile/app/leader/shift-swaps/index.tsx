import { useState } from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView, ActivityIndicator, RefreshControl, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { colors } from '../../../src/theme/colors';
import { spacing } from '../../../src/theme/spacing';
import { getLeaderPendingSwaps, updateShiftSwapStatus } from '../../../src/api/shift-swaps.api';
import { CustomAlert } from '../../../src/components/CustomAlert';

export default function LeaderShiftSwapsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
      CustomAlert.alert('Thành công', 'Đã duyệt yêu cầu đổi ca.');
    },
    onError: (err: any) => {
      CustomAlert.alert('Lỗi', err.response?.data?.message || err.message || 'Có lỗi xảy ra.');
    }
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => updateShiftSwapStatus(id, { status: 'REJECTED' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leader-shift-swaps'] });
      CustomAlert.alert('Thành công', 'Đã từ chối yêu cầu đổi ca.');
    },
    onError: (err: any) => {
      CustomAlert.alert('Lỗi', err.response?.data?.message || err.message || 'Có lỗi xảy ra.');
    }
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#102739" translucent={false} />

      {/* ── Top Header (#102739) ── */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) + 4 }]}>
        <View style={styles.headerMainRow}>
          <Pressable 
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/leader/(tabs)' as any))} 
            style={styles.backBtn}
            hitSlop={8}
          >
            <MaterialCommunityIcons name="chevron-left" size={28} color="#FFFFFF" />
          </Pressable>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Duyệt đổi ca</Text>
            <Text style={styles.headerSubtitle}>Quản lý yêu cầu đổi ca làm việc</Text>
          </View>
        </View>
      </View>

      {/* ── Main Curved Sheet ── */}
      <View style={styles.curvedSheet}>
        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#102739" />
          </View>
        ) : swaps.length === 0 ? (
          <ScrollView 
            contentContainerStyle={styles.emptyScroll}
            refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconBg}>
                <View style={styles.calendarIconWrapper}>
                  <MaterialCommunityIcons name="calendar-month-outline" size={54} color="#7DD3FC" />
                  <View style={styles.swapBadge}>
                    <MaterialCommunityIcons name="swap-horizontal" size={15} color="#0284C7" />
                  </View>
                </View>
              </View>
              <Text style={styles.emptyTitle}>Không có yêu cầu đổi ca{'\n'}nào chờ duyệt</Text>
              <Text style={styles.emptySubtitle}>Các yêu cầu đổi ca cần xét duyệt sẽ hiển thị tại đây.</Text>
            </View>
          </ScrollView>
        ) : (
          <ScrollView 
            contentContainerStyle={styles.listContainer}
            refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
            showsVerticalScrollIndicator={false}
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
                      <MaterialCommunityIcons name="swap-horizontal" size={22} color="#102739" />
                    </View>
                    <View style={styles.cardHeaderRight}>
                      <Text style={styles.cardUserName}>{requesterName} ➔ {targetName}</Text>
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
                        <MaterialCommunityIcons name="close" size={18} color="#EF4444" />
                        <Text style={styles.btnRejectText}>Từ chối</Text>
                      </Pressable>
                      <Pressable 
                        style={[styles.btnAction, styles.btnApprove]} 
                        onPress={() => approveMutation.mutate(item.id)}
                        disabled={rejectMutation.isPending || approveMutation.isPending}
                      >
                        <MaterialCommunityIcons name="check" size={18} color="#FFFFFF" />
                        <Text style={styles.btnApproveText}>Duyệt đơn</Text>
                      </Pressable>
                    </View>
                  )}
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
  header: {
    backgroundColor: '#102739',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    padding: 2,
    marginRight: 8,
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
  curvedSheet: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyScroll: {
    flexGrow: 1,
    paddingTop: 8,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 44,
    paddingHorizontal: 24,
    marginHorizontal: 16,
    marginTop: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  emptyIconBg: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  calendarIconWrapper: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swapBadge: {
    position: 'absolute',
    bottom: -2,
    right: -4,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 3,
    borderWidth: 2,
    borderColor: '#7DD3FC',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 13.5,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  listContainer: {
    padding: 16,
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardHeaderRight: {
    flex: 1,
  },
  cardUserName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  cardSubtitle: {
    fontSize: 12.5,
    color: '#64748B',
    marginTop: 2,
  },
  shiftDetails: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  shiftText: {
    fontSize: 13,
    color: '#334155',
    marginBottom: 4,
  },
  bold: {
    fontWeight: '700',
    color: '#0F172A',
  },
  cardContent: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  btnAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  btnReject: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  btnRejectText: {
    color: '#EF4444',
    fontWeight: '700',
    fontSize: 13.5,
  },
  btnApprove: {
    backgroundColor: '#102739',
  },
  btnApproveText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13.5,
  },
});
