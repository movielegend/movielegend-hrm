import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator, StatusBar } from 'react-native';
import { useAppAlert } from '../../contexts/AlertContext';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { getShiftSwapById, updateShiftSwapStatus } from '../../api/shift-swaps.api';
import { useAuth } from '../../providers/AuthProvider';

export function ShiftSwapDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { showAlert } = useAppAlert();

  const { data: swap, isLoading } = useQuery({
    queryKey: ['shift-swap', id],
    queryFn: () => getShiftSwapById(id as string),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: ({ status }: { status: 'APPROVED' | 'REJECTED' | 'PENDING_LEADER_APPROVAL' }) => updateShiftSwapStatus(id as string, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shift-swap', id] });
      queryClient.invalidateQueries({ queryKey: ['leader-shift-swaps'] });
      queryClient.invalidateQueries({ queryKey: ['my-shift-swaps'] });
      showAlert('Thành công', 'Đã cập nhật đơn đổi ca.');
    },
    onError: (err: any) => {
      showAlert('Lỗi', err.response?.data?.message || err.message || 'Có lỗi xảy ra.');
    }
  });

  if (isLoading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#102739" translucent={false} />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      </View>
    );
  }

  if (!swap) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#102739" translucent={false} />
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) + 4 }]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
            <MaterialCommunityIcons name="chevron-left" size={28} color="#FFFFFF" />
          </Pressable>
          <Text style={styles.headerTitle}>Chi tiết đơn đổi ca</Text>
        </View>
        <View style={styles.curvedSheet}>
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>Không tìm thấy yêu cầu đổi ca.</Text>
          </View>
        </View>
      </View>
    );
  }

  const requesterName = swap.requester?.profile?.fullName || swap.requester?.email || 'Người xin đổi';
  const targetName = swap.target?.profile?.fullName || swap.target?.email || 'Người được đổi';
  const fromDateStr = swap.fromDate ? new Date(swap.fromDate).toLocaleDateString('vi-VN') : '';
  const toDateStr = swap.toDate ? new Date(swap.toDate).toLocaleDateString('vi-VN') : '';
  const dateStr = swap.createdAt ? new Date(swap.createdAt).toLocaleDateString('vi-VN') : '';
  
  const isTargetUser = user?.id === swap.targetUserId;
  const isLeader = user?.roles?.includes('LEADER') || user?.roles?.includes('ADMIN') || user?.roles?.includes('HR');

  let statusText: string = swap.status;
  let statusColor = '#B45309';
  let statusBg = '#FEF3C7';
  if (swap.status === 'PENDING_TARGET_APPROVAL') { 
    statusText = 'Chờ nhân viên xác nhận'; 
    statusColor = '#B45309'; 
    statusBg = '#FEF3C7'; 
  } else if (swap.status === 'PENDING_LEADER_APPROVAL') { 
    statusText = 'Chờ quản lý duyệt'; 
    statusColor = '#B45309'; 
    statusBg = '#FEF3C7'; 
  } else if (swap.status === 'APPROVED') { 
    statusText = 'Đã duyệt'; 
    statusColor = '#15803D'; 
    statusBg = '#DCFCE7'; 
  } else if (swap.status === 'REJECTED') { 
    statusText = 'Đã từ chối'; 
    statusColor = '#DC2626'; 
    statusBg = '#FEE2E2'; 
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#102739" translucent={false} />

      {/* ── Top Header (#102739) ── */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) + 4 }]}>
        <View style={styles.headerMainRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
            <MaterialCommunityIcons name="chevron-left" size={28} color="#FFFFFF" />
          </Pressable>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Chi tiết đơn đổi ca</Text>
            <Text style={styles.headerSubtitle}>Yêu cầu hoán đổi ca làm việc</Text>
          </View>
        </View>
      </View>

      {/* ── Main Curved Sheet ── */}
      <View style={styles.curvedSheet}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Status Banner */}
          <View style={styles.statusBadgeContainer}>
            <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
              <MaterialCommunityIcons 
                name={swap.status === 'APPROVED' ? 'check-circle' : swap.status === 'REJECTED' ? 'close-circle' : 'clock-outline'} 
                size={16} 
                color={statusColor} 
              />
              <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
            </View>
          </View>

          {/* Card: Thông tin chung */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="information-outline" size={18} color="#102739" />
              <Text style={styles.sectionTitle}>Thông tin chung</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Ngày tạo</Text>
              <Text style={styles.value}>{dateStr}</Text>
            </View>
            <View style={[styles.row, { borderBottomWidth: 0 }]}>
              <Text style={styles.label}>Lý do</Text>
              <Text style={styles.value}>{swap.reason || 'Không có lý do cụ thể'}</Text>
            </View>
          </View>

          {/* Card: Nhân viên yêu cầu đổi */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="account-arrow-right-outline" size={18} color="#102739" />
              <Text style={styles.sectionTitle}>Nhân viên yêu cầu đổi</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Họ tên</Text>
              <Text style={styles.value}>{requesterName}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Ca gốc</Text>
              <Text style={styles.value}>{swap.fromShift?.name} ({swap.fromShift?.startTime} - {swap.fromShift?.endTime})</Text>
            </View>
            <View style={[styles.row, { borderBottomWidth: 0 }]}>
              <Text style={styles.label}>Ngày làm</Text>
              <Text style={styles.value}>{fromDateStr}</Text>
            </View>
          </View>

          {/* Card: Nhân viên được đổi */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="account-arrow-left-outline" size={18} color="#102739" />
              <Text style={styles.sectionTitle}>Nhân viên được đổi (Đổi lấy ca này)</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Họ tên</Text>
              <Text style={styles.value}>{targetName}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Ca đích</Text>
              <Text style={styles.value}>{swap.toShift?.name} ({swap.toShift?.startTime} - {swap.toShift?.endTime})</Text>
            </View>
            <View style={[styles.row, { borderBottomWidth: 0 }]}>
              <Text style={styles.label}>Ngày làm</Text>
              <Text style={styles.value}>{toDateStr}</Text>
            </View>
          </View>

          {/* Buttons for Target User */}
          {swap.status === 'PENDING_TARGET_APPROVAL' && isTargetUser && (
            <View style={styles.actionButtons}>
              <Pressable 
                style={[styles.btn, styles.btnReject]} 
                onPress={() => updateMutation.mutate({ status: 'REJECTED' })}
                disabled={updateMutation.isPending}
              >
                <Text style={styles.btnRejectText}>Từ chối</Text>
              </Pressable>
              <Pressable 
                style={[styles.btn, styles.btnApprove]} 
                onPress={() => updateMutation.mutate({ status: 'PENDING_LEADER_APPROVAL' })}
                disabled={updateMutation.isPending}
              >
                <Text style={styles.btnApproveText}>Xác nhận đổi ca</Text>
              </Pressable>
            </View>
          )}

          {/* Buttons for Leader */}
          {swap.status === 'PENDING_LEADER_APPROVAL' && isLeader && (
            <View style={styles.actionButtons}>
              <Pressable 
                style={[styles.btn, styles.btnReject]} 
                onPress={() => updateMutation.mutate({ status: 'REJECTED' })}
                disabled={updateMutation.isPending}
              >
                <MaterialCommunityIcons name="close" size={18} color="#EF4444" />
                <Text style={styles.btnRejectText}>Từ chối</Text>
              </Pressable>
              <Pressable 
                style={[styles.btn, styles.btnApprove]} 
                onPress={() => updateMutation.mutate({ status: 'APPROVED' })}
                disabled={updateMutation.isPending}
              >
                <MaterialCommunityIcons name="check" size={18} color="#FFFFFF" />
                <Text style={styles.btnApproveText}>Duyệt yêu cầu</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
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
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 12,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  statusBadgeContainer: {
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusText: {
    fontWeight: '700',
    fontSize: 13,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  label: {
    width: 90,
    fontSize: 13,
    color: '#64748B',
  },
  value: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  btnReject: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#FECDD3',
  },
  btnRejectText: {
    color: '#EF4444',
    fontWeight: '700',
    fontSize: 14,
  },
  btnApprove: {
    backgroundColor: '#102739',
  },
  btnApproveText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
  },
});
