import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Screen } from '../../components/Screen';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { getShiftSwapById, updateShiftSwapStatus } from '../../api/shift-swaps.api';
import { useAuth } from '../../providers/AuthProvider';

export function ShiftSwapDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();

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
      Alert.alert('Thành công', 'Đã cập nhật đơn đổi ca.');
    },
    onError: (err: any) => {
      Alert.alert('Lỗi', err.response?.data?.message || err.message || 'Có lỗi xảy ra.');
    }
  });

  if (isLoading) {
    return (
      <Screen>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </Screen>
    );
  }

  if (!swap) {
    return (
      <Screen>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Không tìm thấy yêu cầu đổi ca.</Text>
        </View>
      </Screen>
    );
  }

  const requesterName = swap.requester?.profile?.fullName || swap.requester?.email || 'Người xin đổi';
  const targetName = swap.target?.profile?.fullName || swap.target?.email || 'Người được đổi';
  const fromDateStr = swap.fromDate ? new Date(swap.fromDate).toLocaleDateString('vi-VN') : '';
  const toDateStr = swap.toDate ? new Date(swap.toDate).toLocaleDateString('vi-VN') : '';
  const dateStr = swap.createdAt ? new Date(swap.createdAt).toLocaleDateString('vi-VN') : '';
  
  const isTargetUser = user?.id === swap.targetUserId;
  // Note: For simplicity, assume if we see the action buttons in the API it allows it, or we rely on role. 
  // We can just check status and role for rendering buttons.
  const isLeader = user?.roles?.includes('LEADER') || user?.roles?.includes('ADMIN');

  let statusText = swap.status;
  let statusColor = colors.warning;
  if (swap.status === 'PENDING_TARGET_APPROVAL') { statusText = 'Chờ nhân viên xác nhận'; }
  else if (swap.status === 'PENDING_LEADER_APPROVAL') { statusText = 'Chờ quản lý duyệt'; }
  else if (swap.status === 'APPROVED') { statusText = 'Đã duyệt'; statusColor = colors.success; }
  else if (swap.status === 'REJECTED') { statusText = 'Đã từ chối'; statusColor = colors.danger; }

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>Chi tiết đơn đổi ca</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.statusBadgeContainer}>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Thông tin chung</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Ngày tạo:</Text>
            <Text style={styles.value}>{dateStr}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Lý do:</Text>
            <Text style={styles.value}>{swap.reason || 'Không có'}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Nhân viên yêu cầu đổi</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Họ tên:</Text>
            <Text style={styles.value}>{requesterName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Ca gốc:</Text>
            <Text style={styles.value}>{swap.fromShift?.name} ({swap.fromShift?.startTime} - {swap.fromShift?.endTime})</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Ngày làm:</Text>
            <Text style={styles.value}>{fromDateStr}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Nhân viên được đổi (Đổi lấy ca này)</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Họ tên:</Text>
            <Text style={styles.value}>{targetName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Ca đích:</Text>
            <Text style={styles.value}>{swap.toShift?.name} ({swap.toShift?.startTime} - {swap.toShift?.endTime})</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Ngày làm:</Text>
            <Text style={styles.value}>{toDateStr}</Text>
          </View>
        </View>

        {/* Buttons for Target User */}
        {swap.status === 'PENDING_TARGET_APPROVAL' && isTargetUser && (
          <View style={styles.actionButtons}>
            <Pressable 
              style={[styles.btn, { backgroundColor: colors.success }]} 
              onPress={() => updateMutation.mutate({ status: 'PENDING_LEADER_APPROVAL' })}
              disabled={updateMutation.isPending}
            >
              <Text style={styles.btnText}>Xác nhận đổi ca</Text>
            </Pressable>
            <Pressable 
              style={[styles.btn, { backgroundColor: colors.danger }]} 
              onPress={() => updateMutation.mutate({ status: 'REJECTED' })}
              disabled={updateMutation.isPending}
            >
              <Text style={styles.btnText}>Từ chối</Text>
            </Pressable>
          </View>
        )}

        {/* Buttons for Leader */}
        {swap.status === 'PENDING_LEADER_APPROVAL' && isLeader && (
          <View style={styles.actionButtons}>
            <Pressable 
              style={[styles.btn, { backgroundColor: colors.success }]} 
              onPress={() => updateMutation.mutate({ status: 'APPROVED' })}
              disabled={updateMutation.isPending}
            >
              <Text style={styles.btnText}>Duyệt yêu cầu</Text>
            </Pressable>
            <Pressable 
              style={[styles.btn, { backgroundColor: colors.danger }]} 
              onPress={() => updateMutation.mutate({ status: 'REJECTED' })}
              disabled={updateMutation.isPending}
            >
              <Text style={styles.btnText}>Từ chối</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  iconBtn: {
    padding: spacing.xs,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  container: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  statusBadgeContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
  },
  statusText: {
    fontWeight: '700',
    fontSize: 14,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  label: {
    width: 80,
    fontSize: 14,
    color: colors.textLight,
  },
  value: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  btn: {
    flex: 1,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  errorText: {
    color: colors.danger,
    fontSize: 16,
  },
});
