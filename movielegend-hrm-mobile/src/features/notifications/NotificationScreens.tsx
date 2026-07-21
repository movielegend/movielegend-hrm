import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Alert, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { PageHeader } from '../../components/PageHeader';
import { SecondaryButton } from '../../components/Buttons';
import { Screen } from '../../components/Screen';
import { ScreenContainer } from '../../components/ScreenContainer';
import { useMarkAllNotificationsRead, useMarkNotificationRead, useNotifications, useRegisterCurrentDeviceToken, useUnreadNotificationCount } from '../../hooks/useNotifications';
import { useAuth } from '../../providers/AuthProvider';
import { useSocketStatus } from '../../providers/SocketProvider';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import type { NotificationTargetDto } from '../../types/notification.types';
import { normalizeApiError } from '../../utils/api-error';
import { timeAgo } from '../../utils/date-time';
import { getNotificationColor, getNotificationIcon, notificationRoute } from '../../utils/notification-routing';

export function NotificationListScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { isConnected } = useSocketStatus();
  const notifications = useNotifications();
  const unread = useUnreadNotificationCount();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  const registerDevice = useRegisterCurrentDeviceToken();

  async function openNotification(target: NotificationTargetDto) {
    const route = notificationRoute(target, user);
    try {
      if (!target.readAt) {
        await markRead.mutateAsync(target.notificationId);
      }
      if (route) {
        router.push(route as never);
      }
    } catch (error) {
      const normalized = normalizeApiError(error);
      Alert.alert(normalized.code, normalized.message);
    }
  }

  async function registerPush() {
    try {
      const result = await registerDevice.mutateAsync();
      if (!result) {
        Alert.alert('Chưa cấu hình thông báo', 'Thiết bị chưa cấp quyền nhận thông báo hoặc chưa thiết lập cấu hình.');
        return;
      }
      Alert.alert('Thành công', 'Đã đăng ký thiết bị nhận thông báo');
    } catch (error) {
      const normalized = normalizeApiError(error);
      Alert.alert(normalized.code, normalized.message);
    }
  }

  return (
    <Screen>
      <ScreenContainer refreshControl={<RefreshControl refreshing={notifications.isRefetching} onRefresh={() => void notifications.refetch()} />}>
        <PageHeader title="Thông báo" subtitle={`Chưa đọc: ${unread.data ?? 0} - Socket: ${isConnected ? 'Online' : 'Offline'}`} />
        <View style={styles.actions}>
          <SecondaryButton loading={markAll.isPending} onPress={() => void markAll.mutateAsync()}>Đánh dấu đã đọc tất cả</SecondaryButton>
        </View>
        {notifications.isLoading ? <LoadingState /> : null}
        {notifications.isError ? <ErrorState error={notifications.error} onRetry={() => void notifications.refetch()} /> : null}
        
        <View style={styles.listContainer}>
          {notifications.data?.map((target) => (
            <NotificationItem key={target.id} target={target} onPress={() => void openNotification(target)} />
          ))}
          {!notifications.data?.length ? <EmptyState title="Chưa có thông báo nào" /> : null}
        </View>
      </ScreenContainer>
    </Screen>
  );
}

const EN_TO_VI: Record<string, string> = {
  'New task assigned': 'Công việc mới được giao',
  'Task updated': 'Công việc đã cập nhật',
  'Task cancelled': 'Công việc bị hủy',
  'Task completed': 'Công việc hoàn thành',
  'Violation confirmed': 'Xác nhận vi phạm',
  'Disciplinary action approved': 'Quyết định kỷ luật được duyệt',
  'Material issue updated': 'Cập nhật yêu cầu vật tư',
  'Performance review updated': 'Cập nhật đánh giá hiệu suất',
  'Payroll approved': 'Bảng lương được duyệt',
  'Don nghi phep': 'Đơn nghỉ phép',
  'Overtime request rejected': 'Yêu cầu làm thêm bị từ chối',
  'KPI assigned': 'Giao chỉ tiêu KPI',
  'KPI finalized': 'Chốt chỉ tiêu KPI',
  'KPI updated': 'Cập nhật chỉ tiêu KPI',
  'Contract expiring': 'Hợp đồng sắp hết hạn',
  'Document expiring': 'Giấy tờ sắp hết hạn',
  'Document verification required': 'Yêu cầu xác minh giấy tờ',
  'Contract updated': 'Cập nhật hợp đồng',
  'Contract signed': 'Hợp đồng đã ký',
  'Cross-department request pending': 'Yêu cầu liên phòng chờ duyệt',
  'Bonus approved': 'Thưởng được duyệt',
  'Deduction approved': 'Khấu trừ được duyệt',
  'Asset assigned': 'Tài sản được bàn giao',
};

export function NotificationItem({ target, onPress }: { target: NotificationTargetDto; onPress: () => void }) {
  const item = target.notification;
  const isUnread = !target.readAt;
  const iconName = getNotificationIcon(item.type, item.title);
  const iconColor = getNotificationColor(item.type, item.title);
  const displayTitle = EN_TO_VI[item.title] || item.title;

  return (
    <Pressable 
      style={[styles.card, isUnread && styles.cardUnread]} 
      onPress={onPress}
      android_ripple={{ color: 'rgba(0,0,0,0.05)' }}
    >
      <View style={[styles.iconContainer, { backgroundColor: isUnread ? iconColor : `${iconColor}15` }]}>
        <MaterialCommunityIcons name={iconName} size={24} color={isUnread ? '#fff' : iconColor} />
      </View>
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, isUnread && styles.titleUnread]} numberOfLines={2}>
            {displayTitle}
          </Text>
          {isUnread && <View style={styles.unreadBadge}><Text style={styles.unreadBadgeText}>Mới</Text></View>}
        </View>
        <Text style={styles.body} numberOfLines={2}>{item.body}</Text>
        <Text style={styles.time}>{timeAgo(item.createdAt)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  listContainer: {
    gap: spacing.sm,
    paddingBottom: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    flexDirection: 'row',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardUnread: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
    shadowOpacity: 0.08,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  title: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    lineHeight: 22,
  },
  titleUnread: {
    fontWeight: '700',
    color: colors.primary,
  },
  unreadBadge: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  unreadBadgeText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: 'bold',
  },
  body: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 2,
  },
  time: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 6,
    fontWeight: '500',
  },
});
