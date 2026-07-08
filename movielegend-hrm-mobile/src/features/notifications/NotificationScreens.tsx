import { useRouter } from 'expo-router';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, View, Pressable, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { BottomNavBar } from '../../components/BottomNavBar';
import { useMarkAllNotificationsRead, useMarkNotificationRead, useNotifications, useUnreadNotificationCount } from '../../hooks/useNotifications';
import { useAuth } from '../../providers/AuthProvider';
import { formatDateTime } from '../../utils/date-time';
import { notificationRoute } from '../tasks/task.logic';
import type { NotificationTargetDto } from '../../types/notification.types';
import { normalizeApiError } from '../../utils/api-error';

export function NotificationListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const notifications = useNotifications();
  const unread = useUnreadNotificationCount();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  async function openNotification(target: NotificationTargetDto) {
    const route = notificationRoute(target, user);
    try {
      if (!target.readAt) {
        await markRead.mutateAsync(target.notificationId);
      }
      if (route) router.push(route as never);
    } catch (error) {
      const normalized = normalizeApiError(error);
      Alert.alert(normalized.code, normalized.message);
    }
  }

  async function handleMarkAllRead() {
    try {
      await markAll.mutateAsync();
    } catch (error) {
      const normalized = normalizeApiError(error);
      Alert.alert(normalized.code, normalized.message);
    }
  }

  const unreadCount = unread.data ?? 2; // Default to 2 for mock

  const mockData: NotificationTargetDto[] = [
    {
      id: 'mock1',
      notificationId: 'n1',
      userId: 'u1',
      readAt: null,
      createdAt: new Date('2026-07-06T11:49:54').toISOString(),
      updatedAt: new Date().toISOString(),
      notification: {
        id: 'n1',
        title: 'Ca trực ngày mai',
        body: 'Bạn có ca đêm tại Ngân hàng TPBank (22:00 - 06:00)',
        type: 'ca trực',
        createdAt: new Date('2026-07-06T11:49:54').toISOString(),
        updatedAt: new Date().toISOString()
      }
    },
    {
      id: 'mock2',
      notificationId: 'n2',
      userId: 'u1',
      readAt: new Date().toISOString(),
      createdAt: new Date('2026-07-06T11:49:54').toISOString(),
      updatedAt: new Date().toISOString(),
      notification: {
        id: 'n2',
        title: 'Báo cáo hư hỏng thiết bị',
        body: 'Bộ đàm Motorola CP1660 được báo hỏng bởi NV001',
        type: 'báo cáo',
        createdAt: new Date('2026-07-06T11:49:54').toISOString(),
        updatedAt: new Date().toISOString()
      }
    },
    {
      id: 'mock3',
      notificationId: 'n3',
      userId: 'u1',
      readAt: new Date().toISOString(),
      createdAt: new Date('2026-07-06T11:49:54').toISOString(),
      updatedAt: new Date().toISOString(),
      notification: {
        id: 'n3',
        title: 'Yêu cầu đăng ký tài khoản mới',
        body: 'Có 1 tài khoản mới chờ duyệt: Nguyen Van Dung',
        type: 'đăng ký',
        createdAt: new Date('2026-07-06T11:49:54').toISOString(),
        updatedAt: new Date().toISOString()
      }
    },
    {
      id: 'mock4',
      notificationId: 'n4',
      userId: 'u1',
      readAt: new Date().toISOString(),
      createdAt: new Date('2026-07-06T11:49:54').toISOString(),
      updatedAt: new Date().toISOString(),
      notification: {
        id: 'n4',
        title: 'Yêu cầu đăng ký tài khoản mới',
        body: 'Có 1 tài khoản mới chờ duyệt: Nguyen Van Dung',
        type: 'đăng ký',
        createdAt: new Date('2026-07-06T11:49:54').toISOString(),
        updatedAt: new Date().toISOString()
      }
    },
    {
      id: 'mock5',
      notificationId: 'n5',
      userId: 'u1',
      readAt: null,
      createdAt: new Date('2026-07-06T11:49:54').toISOString(),
      updatedAt: new Date().toISOString(),
      notification: {
        id: 'n5',
        title: 'Ca trực ngày mai',
        body: 'Bạn có ca đêm tại Ngân hàng TPBank (22:00 - 06:00)',
        type: 'ca trực',
        createdAt: new Date('2026-07-06T11:49:54').toISOString(),
        updatedAt: new Date().toISOString()
      }
    }
  ];

  const displayData = notifications.data?.length ? notifications.data : mockData;

  return (
    <View style={styles.container}>
      {/* Custom Purple Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#FFF" />
        </Pressable>
        <View style={styles.headerTitles}>
          <Text style={styles.headerTitle}>Thông báo</Text>
          <Text style={styles.headerSubtitle}>{unreadCount} chưa đọc</Text>
        </View>
        <Pressable style={styles.trashButton} onPress={() => Alert.alert('Xóa', 'Bạn có muốn xóa tất cả thông báo không?')}>
          <Ionicons name="trash-outline" size={24} color="#FFF" />
        </Pressable>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={notifications.isRefetching} onRefresh={() => void notifications.refetch()} />
        }
      >
        {/* Action Bar */}
        <View style={styles.actionBar}>
          <Pressable style={styles.markAllReadBtn} onPress={handleMarkAllRead}>
            {markAll.isPending ? (
              <ActivityIndicator size="small" color="#4F46E5" />
            ) : (
              <>
                <Ionicons name="checkmark-done-circle-outline" size={20} color="#4F46E5" />
                <Text style={styles.markAllReadText}>Đánh dấu tất cả đã đọc</Text>
              </>
            )}
          </Pressable>
        </View>

        {/* Content */}
        {notifications.isLoading ? (
          <ActivityIndicator size="large" color="#4F46E5" style={{ marginTop: 40 }} />
        ) : null}
        
        {notifications.isError ? (
          <ErrorState error={notifications.error} onRetry={() => void notifications.refetch()} />
        ) : null}

        {displayData.map((target) => (
          <NotificationItem key={target.id} target={target} onPress={() => void openNotification(target)} />
        ))}

        {!displayData.length && !notifications.isLoading && !notifications.isError ? (
          <EmptyState title="Chưa có thông báo" />
        ) : null}
        
      </ScrollView>

      <BottomNavBar activeTab="notifications" />
    </View>
  );
}

function getIconForType(type: string, isUnread: boolean) {
  // Determine icon based on mock types
  const lowerType = type?.toLowerCase() || '';
  let iconName: keyof typeof Ionicons.glyphMap = 'notifications-outline';
  let color = isUnread ? '#4F46E5' : '#6B7280';
  let bgColor = isUnread ? 'rgba(79, 70, 229, 0.1)' : '#F3F4F6';

  if (lowerType.includes('báo cáo') || lowerType.includes('hư hỏng')) {
    iconName = 'warning-outline';
    color = '#D97706'; // orange
    bgColor = 'rgba(217, 119, 6, 0.1)';
  } else if (lowerType.includes('tài khoản') || lowerType.includes('đăng ký')) {
    iconName = 'person-outline';
    color = '#4F46E5';
    bgColor = 'rgba(79, 70, 229, 0.1)';
  } else if (lowerType.includes('ca trực') || lowerType.includes('lịch')) {
    iconName = 'notifications-outline'; // bell
  }

  return { iconName, color, bgColor };
}

export function NotificationItem({ target, onPress }: { target: NotificationTargetDto; onPress: () => void }) {
  const item = target.notification;
  const isUnread = !target.readAt;
  const { iconName, color, bgColor } = getIconForType(item.type || item.title, isUnread);

  return (
    <Pressable 
      style={({ pressed }) => [
        styles.card, 
        isUnread && styles.cardUnread,
        pressed && { opacity: 0.8 }
      ]}
      onPress={onPress}
    >
      <View style={styles.cardLayout}>
        {/* Icon */}
        <View style={[styles.iconContainer, { backgroundColor: bgColor }]}>
          <Ionicons name={iconName} size={24} color={color} />
        </View>
        
        {/* Texts */}
        <View style={styles.cardContent}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, isUnread && styles.titleUnread]} numberOfLines={2}>
              {item.title}
            </Text>
            {isUnread && <View style={styles.unreadDot} />}
          </View>
          <Text style={styles.body} numberOfLines={3}>{item.body}</Text>
          <Text style={styles.meta}>{formatDateTime(item.createdAt)}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#5A4EE3', // base purple
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 24,
    paddingHorizontal: 16,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitles: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  trashButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 100, // accommodate bottom nav bar
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    marginTop: 12,
    marginBottom: 16,
  },
  markAllReadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E7FF',
    gap: 6,
  },
  markAllReadText: {
    color: '#4F46E5',
    fontWeight: '600',
    fontSize: 13,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
      web: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
    }),
  },
  cardUnread: {
    backgroundColor: '#F8FAFF', // very light blue tint
    borderColor: '#6366F1', // purple-blue border
  },
  cardLayout: {
    flexDirection: 'row',
    gap: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    paddingRight: 8,
  },
  titleUnread: {
    fontWeight: '800',
    color: '#111827',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6366F1', // Blue dot
    marginTop: 4,
  },
  body: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  meta: {
    fontSize: 12,
    color: '#9CA3AF',
  }
});
