import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  AlertTriangle,
  Award,
  Bell,
  CalendarCheck,
  CheckCheck,
  ChevronRight,
  ClipboardList,
  FileCheck2,
  FileText,
  Inbox,
  MessageSquare,
  ShieldAlert,
  Wallet,
} from 'lucide-react-native';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { PageHeader } from '../../components/PageHeader';
import { Screen } from '../../components/Screen';
import { useMarkAllNotificationsRead, useMarkNotificationRead, useNotifications, useRegisterCurrentDeviceToken, useUnreadNotificationCount } from '../../hooks/useNotifications';
import { useAuth } from '../../providers/AuthProvider';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import type { NotificationTargetDto } from '../../types/notification.types';
import { timeAgo } from '../../utils/date-time';
import { notificationRoute, stringMeta } from '../../utils/notification-routing';

type FilterCategory = 'ALL' | 'WORK' | 'REQUEST' | 'ATTENDANCE' | 'FINANCE' | 'OTHER';

const FILTER_TABS: { key: FilterCategory; label: string }[] = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'WORK', label: 'Công việc' },
  { key: 'REQUEST', label: 'Đơn & Duyệt' },
  { key: 'ATTENDANCE', label: 'Ca & Công' },
  { key: 'FINANCE', label: 'Lương & Thưởng' },
  { key: 'OTHER', label: 'Khác' },
];

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
  category: FilterCategory;
  categoryLabel: string;
  IconComponent: React.ComponentType<{ size?: number; color?: string }>;
  iconColor: string;
  bgColor: string;
  borderColor: string;
}

function getNotificationVisuals(target: NotificationTargetDto): NotificationVisuals {
  const item = target.notification;
  const type = item.type || '';
  const title = (item.title || '').toLowerCase();
  const body = (item.body || '').toLowerCase();
  const text = `${title} ${body}`;

  // 1. VIOLATION & INCIDENTS
  if (type.startsWith('VIOLATION_') || type.startsWith('ASSET_INCIDENT_') || title.includes('vi phạm') || title.includes('kỷ luật')) {
    return {
      category: 'OTHER',
      categoryLabel: 'Kỷ luật & Vi phạm',
      IconComponent: ShieldAlert,
      iconColor: '#DC2626',
      bgColor: '#FEF2F2',
      borderColor: '#FECACA',
    };
  }

  // 2. BONUS & SALARY
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
      category: 'FINANCE',
      categoryLabel: 'Lương & Thưởng',
      IconComponent: Wallet,
      iconColor: '#D97706',
      bgColor: '#FFFBEB',
      borderColor: '#FDE68A',
    };
  }

  // 3. ATTENDANCE & SHIFT
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
      category: 'ATTENDANCE',
      categoryLabel: 'Ca & Chấm công',
      IconComponent: CalendarCheck,
      iconColor: '#0891B2',
      bgColor: '#ECFEFF',
      borderColor: '#CFFAFE',
    };
  }

  // 4. REQUESTS & APPROVALS
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
      category: 'REQUEST',
      categoryLabel: 'Đơn & Phê duyệt',
      IconComponent: FileCheck2,
      iconColor: '#059669',
      bgColor: '#ECFDF5',
      borderColor: '#A7F3D0',
    };
  }

  // 5. LEVEL PROJECTS & TASKS
  if (
    type.startsWith('LEVEL_') ||
    text.includes('cấp bậc') ||
    text.includes('dự án level') ||
    text.includes('thăng cấp') ||
    type.startsWith('KPI_')
  ) {
    return {
      category: 'WORK',
      categoryLabel: 'Cấp bậc & KPI',
      IconComponent: Award,
      iconColor: '#7C3AED',
      bgColor: '#F5F3FF',
      borderColor: '#DDD6FE',
    };
  }

  if (type.startsWith('TASK_') || text.includes('công việc') || text.includes('nhiệm vụ') || stringMeta(item.metadata, 'taskId')) {
    return {
      category: 'WORK',
      categoryLabel: 'Công việc',
      IconComponent: ClipboardList,
      iconColor: '#2563EB',
      bgColor: '#EFF6FF',
      borderColor: '#DBEAFE',
    };
  }

  // 6. DOCUMENTS & CONTRACTS
  if (type.startsWith('DOCUMENT_') || type.startsWith('CONTRACT_') || text.includes('hợp đồng') || text.includes('tài liệu')) {
    return {
      category: 'OTHER',
      categoryLabel: 'Hợp đồng & Hồ sơ',
      IconComponent: FileText,
      iconColor: '#4F46E5',
      bgColor: '#EEF2FF',
      borderColor: '#C7D2FE',
    };
  }

  // 7. CHAT & NEWSFEED
  if (type.startsWith('CHAT_') || type.startsWith('NEWSFEED_') || text.includes('tin nhắn') || text.includes('bài viết')) {
    return {
      category: 'OTHER',
      categoryLabel: 'Tin tức & Chat',
      IconComponent: MessageSquare,
      iconColor: '#0284C7',
      bgColor: '#F0F9FF',
      borderColor: '#BAE6FD',
    };
  }

  // DEFAULT
  return {
    category: 'OTHER',
    categoryLabel: 'Hệ thống',
    IconComponent: Bell,
    iconColor: '#64748B',
    bgColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  };
}

export function NotificationListScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const notifications = useNotifications();
  const unread = useUnreadNotificationCount();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('ALL');

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

  // Filter list by selected tab
  const filteredList = useMemo(() => {
    if (selectedCategory === 'ALL') return rawList;
    return rawList.filter((target) => {
      const visuals = getNotificationVisuals(target);
      return visuals.category === selectedCategory;
    });
  }, [rawList, selectedCategory]);

  const unreadCount = unread.data || 0;

  return (
    <Screen>
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
                <CheckCheck size={16} color={colors.primary} />
                <Text style={styles.markAllText}>Đã đọc hết</Text>
              </Pressable>
            ) : undefined
          }
        />

        {/* Filter Tabs Horizontal Scroll */}
        <View style={styles.tabsWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsScrollContent}
          >
            {FILTER_TABS.map((tab) => {
              const isActive = selectedCategory === tab.key;
              return (
                <Pressable
                  key={tab.key}
                  style={[styles.tabChip, isActive && styles.tabChipActive]}
                  onPress={() => setSelectedCategory(tab.key)}
                >
                  <Text style={[styles.tabChipText, isActive && styles.tabChipTextActive]}>
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>

      {notifications.isLoading ? <LoadingState /> : null}
      {notifications.isError ? (
        <ErrorState error={notifications.error} onRetry={() => void notifications.refetch()} />
      ) : null}

      {!notifications.isLoading && !notifications.isError && (
        <FlatList
          data={filteredList}
          keyExtractor={(target) => target.id}
          contentContainerStyle={styles.listContent}
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
                <Inbox size={36} color="#94A3B8" />
              </View>
              <Text style={styles.emptyTitle}>Không có thông báo nào</Text>
              <Text style={styles.emptySubtitle}>
                {selectedCategory === 'ALL'
                  ? 'Bạn sẽ nhận được thông báo khi có phân công, đơn từ hoặc cập nhật mới.'
                  : 'Không có thông báo nào thuộc danh mục này.'}
              </Text>
            </View>
          }
          renderItem={({ item: target }) => (
            <NotificationCard
              target={target}
              onPress={() => void openNotification(target)}
            />
          )}
        />
      )}
    </Screen>
  );
}

export function NotificationCard({
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
        styles.card,
        isUnread && styles.cardUnread,
        pressed && styles.cardPressed,
      ]}
      onPress={onPress}
      android_ripple={{ color: 'rgba(0,0,0,0.04)' }}
    >
      {/* Visual Accent for unread */}
      {isUnread && <View style={styles.unreadAccentBar} />}

      <View style={styles.cardInner}>
        {/* Left Icon Badge */}
        <View
          style={[
            styles.iconBadge,
            { backgroundColor: visuals.bgColor, borderColor: visuals.borderColor },
          ]}
        >
          <Icon size={20} color={visuals.iconColor} />
        </View>

        {/* Center Content */}
        <View style={styles.content}>
          <View style={styles.metaRow}>
            <View
              style={[
                styles.categoryTag,
                { backgroundColor: visuals.bgColor },
              ]}
            >
              <Text style={[styles.categoryTagText, { color: visuals.iconColor }]}>
                {visuals.categoryLabel}
              </Text>
            </View>
            <Text style={styles.time}>{timeAgo(item.createdAt)}</Text>
          </View>

          <Text
            style={[styles.title, isUnread && styles.titleUnread]}
            numberOfLines={2}
          >
            {displayTitle}
          </Text>

          {displayBody ? (
            <Text style={styles.body} numberOfLines={2}>
              {displayBody}
            </Text>
          ) : null}
        </View>

        {/* Right Unread Dot or Chevron */}
        <View style={styles.rightAction}>
          {isUnread ? (
            <View style={styles.unreadDot} />
          ) : (
            <ChevronRight size={16} color="#CBD5E1" />
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  headerArea: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: spacing.sm,
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
  tabsWrapper: {
    marginTop: spacing.xs,
  },
  tabsScrollContent: {
    paddingHorizontal: spacing.md,
    gap: 8,
  },
  tabChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  tabChipActive: {
    backgroundColor: colors.primary,
  },
  tabChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
  },
  tabChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listContent: {
    padding: spacing.md,
    gap: 10,
    paddingBottom: spacing.xxl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardUnread: {
    backgroundColor: '#FAFCFF',
    borderColor: '#DBEAFE',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.88,
  },
  unreadAccentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3.5,
    backgroundColor: colors.primary,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },
  cardInner: {
    flexDirection: 'row',
    padding: spacing.md,
    alignItems: 'flex-start',
    gap: 12,
  },
  iconBadge: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  categoryTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  categoryTagText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  time: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  title: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  titleUnread: {
    color: '#0F172A',
    fontWeight: '700',
  },
  body: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  rightAction: {
    paddingTop: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
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
