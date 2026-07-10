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
          {/* <SecondaryButton loading={registerDevice.isPending} onPress={() => void registerPush()}>Đăng ký thiết bị</SecondaryButton> */}
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

export function NotificationItem({ target, onPress }: { target: NotificationTargetDto; onPress: () => void }) {
  const item = target.notification;
  const isUnread = !target.readAt;
  const iconName = getNotificationIcon(item.type);
  const iconColor = getNotificationColor(item.type);

  return (
    <Pressable 
      style={[styles.card, isUnread && styles.cardUnread]} 
      onPress={onPress}
      android_ripple={{ color: 'rgba(0,0,0,0.05)' }}
    >
      <View style={[styles.iconContainer, { backgroundColor: `${iconColor}15` }]}>
        <MaterialCommunityIcons name={iconName} size={24} color={iconColor} />
      </View>
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, isUnread && styles.titleUnread]} numberOfLines={2}>
            {item.title}
          </Text>
          {isUnread && <View style={styles.unreadDot} />}
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
    fontWeight: '500',
    flex: 1,
  },
  titleUnread: {
    fontWeight: '700',
    color: '#0f172a',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginTop: 6,
  },
  body: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  time: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
});
