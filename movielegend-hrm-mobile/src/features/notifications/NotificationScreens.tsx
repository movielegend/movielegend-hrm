import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Award,
  Bell,
  CalendarCheck,
  CheckCheck,
  ClipboardList,
  FileCheck2,
  FileText,
  Inbox,
  MessageCircle,
  ShieldAlert,
  Wallet,
} from 'lucide-react-native';
import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { PageHeader } from '../../components/PageHeader';
import { Screen } from '../../components/Screen';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadNotificationCount,
} from '../../hooks/useNotifications';
import { useAuth } from '../../providers/AuthProvider';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import type { NotificationTargetDto } from '../../types/notification.types';
import { timeAgo } from '../../utils/date-time';
import { notificationRoute, stringMeta } from '../../utils/notification-routing';

type TabType = 'ALL' | 'UNREAD';

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

function stripEmojis(str?: string): string {
  if (!str) return str || '';
  return str
    .replace(/[\u{1F300}-\u{1FAFF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1F1E0}-\u{1F1FF}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

interface NotificationVisuals {
  IconComponent: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  iconColor: string;
  bgColor: string;
}

function getNotificationVisuals(target: NotificationTargetDto): NotificationVisuals {
  const item = target.notification;
  const type = item.type || '';
  const title = (item.title || '').toLowerCase();
  const body = (item.body || '').toLowerCase();
  const text = `${title} ${body}`;

  // 1. VIOLATION & INCIDENTS (Rose Red)
  if (type.startsWith('VIOLATION_') || type.startsWith('ASSET_INCIDENT_') || title.includes('vi phạm') || title.includes('kỷ luật')) {
    return {
      IconComponent: ShieldAlert,
      iconColor: '#EF4444',
      bgColor: '#FEE2E2',
    };
  }

  // 2. BONUS & SALARY (Warm Amber / Gold)
  if (
    type.startsWith('VAULT_') ||
    type.startsWith('PAYROLL_') ||
    type.startsWith('PAYSLIP_') ||
    text.includes('ví thưởng') ||
    text.includes('điểm thưởng') ||
    text.includes('phiếu lương') ||
    text.includes('bảng lương') ||
    text.includes('thưởng') ||
    text.includes('rút ví') ||
    text.includes('rút tiền')
  ) {
    return {
      IconComponent: Wallet,
      iconColor: '#F59E0B',
      bgColor: '#FEF3C7',
    };
  }

  // 3. ATTENDANCE & SHIFT (Teal / Cyan)
  if (
    text.includes('phân ca') ||
    text.includes('chấm công') ||
    text.includes('bảng công') ||
    text.includes('đổi ca') ||
    text.includes('check in') ||
    text.includes('check out') ||
    text.includes('giờ làm việc') ||
    text.includes('timesheet')
  ) {
    return {
      IconComponent: CalendarCheck,
      iconColor: '#06B6D4',
      bgColor: '#E0F2FE',
    };
  }

  // 4. REQUESTS & APPROVALS (Emerald Green)
  if (
    type.startsWith('CROSS_DEPARTMENT_') ||
    type === 'ACCOUNT_APPROVAL_REQUESTED' ||
    stringMeta(item.metadata, 'requestId') ||
    stringMeta(item.metadata, 'approvalRequestId') ||
    text.includes('đơn nghỉ') ||
    text.includes('đơn xin') ||
    text.includes('yêu cầu duyệt') ||
    text.includes('chờ duyệt') ||
    text.includes('đã duyệt đơn') ||
    text.includes('từ chối đơn')
  ) {
    return {
      IconComponent: FileCheck2,
      iconColor: '#10B981',
      bgColor: '#D1FAE5',
    };
  }

  // 5. LEVEL PROJECTS & KPI (Purple Violet)
  if (
    type.startsWith('LEVEL_') ||
    text.includes('cấp bậc') ||
    text.includes('dự án level') ||
    text.includes('thăng cấp') ||
    type.startsWith('KPI_')
  ) {
    return {
      IconComponent: Award,
      iconColor: '#8B5CF6',
      bgColor: '#EDE9FE',
    };
  }

  // 6. TASKS / ASSIGNMENTS (Royal Blue)
  if (type.startsWith('TASK_') || text.includes('công việc') || text.includes('nhiệm vụ') || stringMeta(item.metadata, 'taskId')) {
    return {
      IconComponent: ClipboardList,
      iconColor: '#3B82F6',
      bgColor: '#DBEAFE',
    };
  }

  // 7. DOCUMENTS & CONTRACTS (Indigo)
  if (type.startsWith('DOCUMENT_') || type.startsWith('CONTRACT_') || text.includes('hợp đồng') || text.includes('tài liệu')) {
    return {
      IconComponent: FileText,
      iconColor: '#6366F1',
      bgColor: '#E0E7FF',
    };
  }

  // 8. CHAT & MESSAGES (Sky Blue Bubble)
  if (type.startsWith('CHAT_') || type.startsWith('NEWSFEED_') || text.includes('tin nhắn') || text.includes('bài viết')) {
    return {
      IconComponent: MessageCircle,
      iconColor: '#0EA5E9',
      bgColor: '#E0F2FE',
    };
  }

  // DEFAULT (Slate Gray)
  return {
    IconComponent: Bell,
    iconColor: '#64748B',
    bgColor: '#F1F5F9',
  };
}

export function NotificationListScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const notifications = useNotifications();
  const unread = useUnreadNotificationCount();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  const [activeTab, setActiveTab] = useState<TabType>('ALL');

  async function openNotification(target: NotificationTargetDto) {
    const route = notificationRoute(target, user);
    try {
      if (!target.readAt) {
        await markRead.mutateAsync(target.notificationId);
      }
    } catch (e) {
      console.warn('Error marking notification as read:', e);
    }
    if (route) {
      router.push(route as never);
    }
  }

  const rawList = notifications.data || [];
  const unreadCount = unread.data || 0;

  const displayList = useMemo(() => {
    if (activeTab === 'UNREAD') {
      return rawList.filter((target) => !target.readAt);
    }
    return rawList;
  }, [rawList, activeTab]);

  return (
    <Screen backgroundColor="#FFFFFF">
      <View style={styles.headerArea}>
        <PageHeader
          title="Thông báo"
          subtitle={unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : 'Tất cả đã cập nhật'}
          showBack={false}
          right={
            unreadCount > 0 ? (
              <Pressable
                style={({ pressed }) => [styles.markAllBtn, pressed && styles.markAllBtnPressed]}
                onPress={() => void markAll.mutateAsync()}
                disabled={markAll.isPending}
              >
                <CheckCheck size={16} strokeWidth={2.2} color={colors.primary} />
                <Text style={styles.markAllText}>Đã đọc hết</Text>
              </Pressable>
            ) : undefined
          }
        />

        {/* 2 Tabs: Tất cả & Chưa đọc */}
        <View style={styles.tabsContainer}>
          <Pressable
            style={[styles.tabButton, activeTab === 'ALL' && styles.tabButtonActive]}
            onPress={() => setActiveTab('ALL')}
          >
            <Text style={[styles.tabText, activeTab === 'ALL' && styles.tabTextActive]}>
              Tất cả
            </Text>
            {rawList.length > 0 && (
              <View style={[styles.tabBadge, activeTab === 'ALL' && styles.tabBadgeActive]}>
                <Text style={[styles.tabBadgeText, activeTab === 'ALL' && styles.tabBadgeTextActive]}>
                  {rawList.length}
                </Text>
              </View>
            )}
          </Pressable>

          <Pressable
            style={[styles.tabButton, activeTab === 'UNREAD' && styles.tabButtonActive]}
            onPress={() => setActiveTab('UNREAD')}
          >
            <Text style={[styles.tabText, activeTab === 'UNREAD' && styles.tabTextActive]}>
              Chưa đọc
            </Text>
            {unreadCount > 0 ? (
              <View style={[styles.unreadCountBadge, activeTab === 'UNREAD' && styles.unreadCountBadgeActive]}>
                <Text style={[styles.unreadCountBadgeText, activeTab === 'UNREAD' && styles.unreadCountBadgeTextActive]}>
                  {unreadCount}
                </Text>
              </View>
            ) : null}
          </Pressable>
        </View>
      </View>

      {notifications.isLoading ? <LoadingState /> : null}
      {notifications.isError ? (
        <ErrorState error={notifications.error} onRetry={() => void notifications.refetch()} />
      ) : null}

      {!notifications.isLoading && !notifications.isError && (
        <FlatList
          data={displayList}
          keyExtractor={(target) => target.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={notifications.isRefetching}
              onRefresh={() => void notifications.refetch()}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                {activeTab === 'UNREAD' ? (
                  <CheckCheck size={36} strokeWidth={1.8} color="#10B981" />
                ) : (
                  <Inbox size={36} strokeWidth={1.8} color="#94A3B8" />
                )}
              </View>
              <Text style={styles.emptyTitle}>
                {activeTab === 'UNREAD' ? 'Không có thông báo chưa đọc' : 'Chưa có thông báo nào'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === 'UNREAD'
                  ? 'Tuyệt vời! Bạn đã xem hết tất cả các thông báo.'
                  : 'Bạn sẽ nhận được thông báo khi có công việc mới, duyệt đơn hoặc tin tức từ công ty.'}
              </Text>
            </View>
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item: target }) => (
            <NotificationItemRow
              target={target}
              onPress={() => void openNotification(target)}
            />
          )}
        />
      )}
    </Screen>
  );
}

export function NotificationItemRow({
  target,
  onPress,
}: {
  target: NotificationTargetDto;
  onPress: () => void;
}) {
  const item = target.notification;
  const isUnread = !target.readAt;
  const rawTitle = EN_TO_VI[item.title] || item.title;
  const displayTitle = stripEmojis(rawTitle);

  const rawBody =
    item.body?.startsWith('GIPHY_STICKER:') ||
    item.body?.startsWith('LOTTIE_STICKER:') ||
    item.body?.startsWith('STATIC_STICKER:')
      ? '[Nhãn dán]'
      : item.body;
  const displayBody = stripEmojis(rawBody);

  const visuals = getNotificationVisuals(target);
  const Icon = visuals.IconComponent;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.rowItem,
        isUnread && styles.rowItemUnread,
        pressed && styles.rowItemPressed,
      ]}
      onPress={onPress}
      android_ripple={{ color: 'rgba(0,0,0,0.05)' }}
    >
      {/* Left Icon Avatar */}
      <View style={[styles.avatarCircle, { backgroundColor: visuals.bgColor }]}>
        <Icon size={20} strokeWidth={2.2} color={visuals.iconColor} />
      </View>

      {/* Main Text Content */}
      <View style={styles.contentWrap}>
        <View style={styles.topMeta}>
          <Text
            style={[styles.titleText, isUnread && styles.titleTextUnread]}
            numberOfLines={2}
          >
            {displayTitle}
          </Text>
          {isUnread && <View style={styles.blueDot} />}
        </View>

        {displayBody ? (
          <Text
            style={[styles.bodyText, isUnread && styles.bodyTextUnread]}
            numberOfLines={2}
          >
            {displayBody}
          </Text>
        ) : null}

        <Text style={styles.timeText}>{timeAgo(item.createdAt)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  headerArea: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  markAllBtnPressed: {
    opacity: 0.75,
  },
  markAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  tabsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
    marginBottom: 6,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  tabButtonActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  tabBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
  },
  tabBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  tabBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  tabBadgeTextActive: {
    color: '#FFFFFF',
  },
  unreadCountBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
    backgroundColor: '#EF4444',
  },
  unreadCountBadgeActive: {
    backgroundColor: '#FFFFFF',
  },
  unreadCountBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  unreadCountBadgeTextActive: {
    color: colors.primary,
  },
  listContent: {
    paddingBottom: 130, // Bottom tab bar clearance
  },
  separator: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginLeft: 68,
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    gap: 12,
  },
  rowItemUnread: {
    backgroundColor: '#F8FAFF',
  },
  rowItemPressed: {
    backgroundColor: '#F1F5F9',
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  contentWrap: {
    flex: 1,
    gap: 3,
  },
  topMeta: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  titleText: {
    flex: 1,
    color: '#334155',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  titleTextUnread: {
    color: '#0F172A',
    fontWeight: '700',
  },
  blueDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563EB',
    marginTop: 6,
  },
  bodyText: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 18,
  },
  bodyTextUnread: {
    color: '#475569',
  },
  timeText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: spacing.lg,
    gap: 12,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
  },
});
