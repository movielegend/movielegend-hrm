import { useRouter } from 'expo-router';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { PageHeader } from '../../components/PageHeader';
import { PrimaryButton, SecondaryButton } from '../../components/Buttons';
import { Screen } from '../../components/Screen';
import { ScreenContainer } from '../../components/ScreenContainer';
import { SectionCard } from '../../components/SectionCard';
import { StatusBadge } from '../../components/StatusBadge';
import { useMarkAllNotificationsRead, useMarkNotificationRead, useNotifications, useRegisterCurrentDeviceToken, useUnreadNotificationCount } from '../../hooks/useNotifications';
import { useAuth } from '../../providers/AuthProvider';
import { useSocketStatus } from '../../providers/SocketProvider';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import type { NotificationTargetDto } from '../../types/notification.types';
import { normalizeApiError } from '../../utils/api-error';
import { formatDateTime } from '../../utils/date-time';
import { notificationRoute } from '../tasks/task.logic';

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
      await markRead.mutateAsync(target.notificationId);
      if (route) router.push(route as never);
    } catch (error) {
      const normalized = normalizeApiError(error);
      Alert.alert(normalized.code, normalized.message);
    }
  }

  async function registerPush() {
    try {
      const result = await registerDevice.mutateAsync();
      if (!result) {
        Alert.alert('PUSH_NOT_READY', 'Push permission hoac Expo push config chua san sang, khong tao token gia.');
        return;
      }
      Alert.alert('Thanh cong', 'Da dang ky device token');
    } catch (error) {
      const normalized = normalizeApiError(error);
      Alert.alert(normalized.code, normalized.message);
    }
  }

  return (
    <Screen>
      <ScreenContainer refreshControl={<RefreshControl refreshing={notifications.isRefetching} onRefresh={() => void notifications.refetch()} />}>
        <PageHeader title="Notifications" subtitle={`Unread: ${unread.data ?? 0} - Socket: ${isConnected ? 'connected' : 'offline'}`} />
        <View style={styles.actions}>
          <SecondaryButton loading={markAll.isPending} onPress={() => void markAll.mutateAsync()}>Mark all read</SecondaryButton>
          <SecondaryButton loading={registerDevice.isPending} onPress={() => void registerPush()}>Register device</SecondaryButton>
        </View>
        {notifications.isLoading ? <LoadingState /> : null}
        {notifications.isError ? <ErrorState error={notifications.error} onRetry={() => void notifications.refetch()} /> : null}
        {notifications.data?.map((target) => (
          <NotificationItem key={target.id} target={target} onPress={() => void openNotification(target)} />
        ))}
        {!notifications.data?.length ? <EmptyState title="Chua co thong bao" /> : null}
      </ScreenContainer>
    </Screen>
  );
}

export function NotificationItem({ target, onPress }: { target: NotificationTargetDto; onPress: () => void }) {
  const item = target.notification;
  return (
    <SectionCard>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{item.title}</Text>
        <StatusBadge label={target.readAt ? 'READ' : 'NEW'} tone={target.readAt ? 'neutral' : 'info'} />
      </View>
      <Text style={styles.body}>{item.body}</Text>
      <Text style={styles.meta}>{item.type}</Text>
      <Text style={styles.meta}>{formatDateTime(item.createdAt)}</Text>
      <PrimaryButton onPress={onPress}>Open</PrimaryButton>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: spacing.sm,
  },
  body: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  meta: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  title: {
    color: colors.text,
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
  },
});
