import React, { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  useDeleteAllNotifications,
  useDeleteNotification,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadNotificationCount,
} from '../../hooks/useNotifications';
import { useAuth } from '../../providers/AuthProvider';
import type { NotificationTargetDto } from '../../types/notification.types';
import { notificationRoute } from '../../utils/notification-routing';
import { CustomAlert } from '../../components/CustomAlert';

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

function getGroupLabel(dateStr: string): string {
  if (!dateStr) return 'Trước đó';
  const itemDate = new Date(dateStr);
  if (isNaN(itemDate.getTime())) return 'Trước đó';

  const now = new Date();
  const d1 = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate());
  const d2 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return 'Hôm nay';
  if (diffDays === 1) return '1 ngày trước';
  if (diffDays === 2) return '2 ngày trước';
  if (diffDays === 3) return '3 ngày trước';
  if (diffDays < 7) return `${diffDays} ngày trước`;
  if (diffDays < 14) return '1 tuần trước';
  return `${Math.floor(diffDays / 7)} tuần trước`;
}

interface VisualConfig {
  category: string;
  iconName: string;
  isMaterialCommunity: boolean;
}

function getNotificationVisual(target: NotificationTargetDto): VisualConfig {
  const item = target.notification;
  const type = (item.type || '').toUpperCase();
  const title = (item.title || '').toLowerCase();
  const body = (item.body || '').toLowerCase();
  const text = `${title} ${body}`;

  // Candidate / Recruitment
  if (
    type.includes('CANDIDATE') ||
    type.includes('RECRUIT') ||
    text.includes('ứng viên') ||
    text.includes('tuyển dụng') ||
    text.includes('nộp hồ sơ')
  ) {
    return {
      category: 'Ứng viên mới nộp hồ sơ',
      iconName: 'briefcase-outline',
      isMaterialCommunity: false,
    };
  }

  // Account creation & request
  if (
    type.includes('ACCOUNT') ||
    text.includes('tạo tài khoản') ||
    text.includes('duyệt tài khoản') ||
    text.includes('đăng ký tài khoản')
  ) {
    return {
      category: 'Yêu cầu tạo tài khoản',
      iconName: 'file-account-outline',
      isMaterialCommunity: true,
    };
  }

  // Leave & Shift & Attendance
  if (
    type.includes('LEAVE') ||
    type.includes('SHIFT') ||
    type.includes('ATTENDANCE') ||
    text.includes('nghỉ phép') ||
    text.includes('chấm công') ||
    text.includes('ca làm việc')
  ) {
    return {
      category: 'Chấm công & Ca làm việc',
      iconName: 'time-outline',
      isMaterialCommunity: false,
    };
  }

  // Task & Report
  if (
    type.includes('TASK') ||
    type.includes('REPORT') ||
    text.includes('báo cáo') ||
    text.includes('công việc')
  ) {
    return {
      category: 'Công việc & Báo cáo',
      iconName: 'clipboard-outline',
      isMaterialCommunity: false,
    };
  }

  // Salary & Wallet
  if (
    type.includes('PAYROLL') ||
    type.includes('VAULT') ||
    text.includes('lương') ||
    text.includes('thưởng') ||
    text.includes('ví')
  ) {
    return {
      category: 'Lương & Thưởng',
      iconName: 'wallet-outline',
      isMaterialCommunity: false,
    };
  }

  // Default system notification
  return {
    category: 'Thông báo hệ thống',
    iconName: 'notifications-outline',
    isMaterialCommunity: false,
  };
}

function parseNotificationContent(target: NotificationTargetDto) {
  const item = target.notification;
  const rawTitle = stripEmojis(EN_TO_VI[item.title] || item.title || '');
  const rawBody = stripEmojis(item.body || '');
  const visual = getNotificationVisual(target);

  let category = visual.category;
  let subject = rawTitle;
  let description = rawBody;

  // Smart formatting to match template line 1 (category) - line 2 (bold name/subject) - line 3 (description)
  if (
    rawTitle.toLowerCase().includes('tạo tài khoản') ||
    rawTitle.toLowerCase().includes('ứng viên') ||
    rawTitle.toLowerCase().includes('duyệt') ||
    rawTitle.toLowerCase().includes('yêu cầu')
  ) {
    category = rawTitle;
    const lines = rawBody.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length > 1) {
      subject = lines[0] || rawTitle;
      description = lines.slice(1).join(' ');
    } else if (lines.length === 1) {
      const metaName = item.metadata?.fullName || item.metadata?.userName || item.metadata?.name;
      if (typeof metaName === 'string' && metaName.trim()) {
        subject = metaName;
        description = lines[0] || 'Đề nghị kiểm tra và xét duyệt.';
      } else {
        subject = lines[0] || rawTitle;
        description = 'Đề nghị kiểm tra và xét duyệt.';
      }
    } else {
      description = 'Đề nghị kiểm tra và xét duyệt.';
    }
  } else {
    // Normal notifications
    if (!description) {
      description = 'Đề nghị kiểm tra và xét duyệt.';
    }
  }

  return {
    category,
    subject,
    description,
    visual,
  };
}

interface NotificationGroup {
  label: string;
  items: NotificationTargetDto[];
}

export function NotificationListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const notifications = useNotifications();
  const unread = useUnreadNotificationCount();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  const deleteNotif = useDeleteNotification();
  const deleteAll = useDeleteAllNotifications();

  const [activeTab, setActiveTab] = useState<TabType>('ALL');
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [selectedTargetForMenu, setSelectedTargetForMenu] = useState<NotificationTargetDto | null>(null);

  const rawList = notifications.data || [];
  const unreadCount = unread.data || 0;

  const displayList = useMemo(() => {
    if (activeTab === 'UNREAD') {
      return rawList.filter((target) => !target.readAt);
    }
    return rawList;
  }, [rawList, activeTab]);

  // Group items by time label (e.g. "1 ngày trước", "2 ngày trước")
  const groupedNotifications = useMemo<NotificationGroup[]>(() => {
    const map = new Map<string, NotificationTargetDto[]>();
    for (const item of displayList) {
      const label = getGroupLabel(item.notification.createdAt);
      if (!map.has(label)) {
        map.set(label, []);
      }
      map.get(label)!.push(item);
    }

    return Array.from(map.entries()).map(([label, items]) => ({
      label,
      items,
    }));
  }, [displayList]);

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

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* ── Top Header (#1B3B2B) ── */}
      <View style={[styles.headerContainer, { paddingTop: Math.max(insets.top, 16) + 4 }]}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerTextCol}>
            <Text style={styles.headerTagline}>MOVIE LEGEND</Text>
            <Text style={styles.headerTitle}>Thông báo</Text>
            <Text style={styles.headerSubtitle}>
              {unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : 'Tất cả đã cập nhật'}
            </Text>
          </View>

          {/* Right 3 dots action button */}
          <Pressable
            style={({ pressed }) => [
              styles.headerMenuBtn,
              pressed && { opacity: 0.75 },
            ]}
            onPress={() => setShowHeaderMenu(true)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="ellipsis-horizontal" size={20} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>

      {/* ── Tab Filter Pills (Tất cả & Chưa đọc) ── */}
      <View style={styles.filterTabsRow}>
        {/* Tab Tất cả */}
        <Pressable
          style={[
            styles.tabPill,
            activeTab === 'ALL' ? styles.tabPillActive : styles.tabPillInactive,
          ]}
          onPress={() => setActiveTab('ALL')}
        >
          <Text
            style={[
              styles.tabPillText,
              activeTab === 'ALL' ? styles.tabPillTextActive : styles.tabPillTextInactive,
            ]}
          >
            Tất cả
          </Text>
          {rawList.length > 0 && (
            <View
              style={[
                styles.tabCountPill,
                activeTab === 'ALL'
                  ? styles.tabCountPillActive
                  : styles.tabCountPillInactive,
              ]}
            >
              <Text
                style={[
                  styles.tabCountPillText,
                  activeTab === 'ALL'
                    ? styles.tabCountPillTextActive
                    : styles.tabCountPillTextInactive,
                ]}
              >
                {rawList.length}
              </Text>
            </View>
          )}
        </Pressable>

        {/* Tab Chưa đọc */}
        <Pressable
          style={[
            styles.tabPill,
            activeTab === 'UNREAD' ? styles.tabPillActive : styles.tabPillInactive,
          ]}
          onPress={() => setActiveTab('UNREAD')}
        >
          <Text
            style={[
              styles.tabPillText,
              activeTab === 'UNREAD' ? styles.tabPillTextActive : styles.tabPillTextInactive,
            ]}
          >
            Chưa đọc
          </Text>
          {unreadCount > 0 && (
            <View
              style={[
                styles.tabCountPill,
                activeTab === 'UNREAD'
                  ? styles.tabCountPillActive
                  : styles.tabCountPillInactive,
              ]}
            >
              <Text
                style={[
                  styles.tabCountPillText,
                  activeTab === 'UNREAD'
                    ? styles.tabCountPillTextActive
                    : styles.tabCountPillTextInactive,
                ]}
              >
                {unreadCount}
              </Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* ── Grouped Notifications List ── */}
      <FlatList
        data={groupedNotifications}
        keyExtractor={(item) => item.label}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={notifications.isRefetching}
            onRefresh={() => void notifications.refetch()}
            colors={['#1B3B2B']}
            tintColor="#1B3B2B"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons
                name={activeTab === 'UNREAD' ? 'checkmark-done-circle-outline' : 'notifications-off-outline'}
                size={38}
                color="#64748B"
              />
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
        renderItem={({ item: group }) => (
          <View style={styles.groupSection}>
            {/* Group Label */}
            <Text style={styles.groupLabel}>{group.label}</Text>

            {/* White Group Card Container */}
            <View style={styles.groupCard}>
              {group.items.map((target, index) => {
                const { category, subject, description, visual } = parseNotificationContent(target);
                const isUnread = !target.readAt;

                return (
                  <React.Fragment key={target.id}>
                    {index > 0 && <View style={styles.itemDivider} />}
                    <Pressable
                      style={({ pressed }) => [
                        styles.itemRow,
                        pressed && styles.itemRowPressed,
                      ]}
                      onPress={() => void openNotification(target)}
                    >
                      {/* Left Icon Avatar */}
                      <View style={styles.itemIconBox}>
                        {visual.isMaterialCommunity ? (
                          <MaterialCommunityIcons
                            name={visual.iconName as any}
                            size={22}
                            color="#1B3B2B"
                          />
                        ) : (
                          <Ionicons
                            name={visual.iconName as any}
                            size={22}
                            color="#1B3B2B"
                          />
                        )}
                      </View>

                      {/* Content Column */}
                      <View style={styles.itemContentCol}>
                        <Text style={styles.itemCategory} numberOfLines={1}>
                          {category}
                        </Text>
                        <Text style={styles.itemSubject} numberOfLines={1}>
                          {subject}
                        </Text>
                        <Text style={styles.itemDescription} numberOfLines={2}>
                          {description}
                        </Text>
                      </View>

                      {/* Right 3 dots action button */}
                      <Pressable
                        style={styles.itemDotsBtn}
                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                        onPress={(e) => {
                          e.stopPropagation();
                          setSelectedTargetForMenu(target);
                        }}
                      >
                        <Ionicons name="ellipsis-horizontal" size={18} color="#94A3B8" />
                      </Pressable>

                      {/* Unread indicator */}
                      {isUnread && <View style={styles.unreadDot} />}
                    </Pressable>
                  </React.Fragment>
                );
              })}
            </View>
          </View>
        )}
      />

      {/* ── Modal: Header 3 Dots Menu ── */}
      <Modal
        visible={showHeaderMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowHeaderMenu(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setShowHeaderMenu(false)}>
          <View style={styles.modalMenuCard}>
            <Text style={styles.modalMenuTitle}>Tùy chọn thông báo</Text>

            {unreadCount > 0 && (
              <Pressable
                style={styles.modalMenuItem}
                onPress={() => {
                  setShowHeaderMenu(false);
                  void markAll.mutateAsync();
                }}
              >
                <Ionicons name="checkmark-done-outline" size={20} color="#1B3B2B" />
                <Text style={styles.modalMenuItemText}>Đánh dấu tất cả đã đọc</Text>
              </Pressable>
            )}

            <Pressable
              style={styles.modalMenuItem}
              onPress={() => {
                setShowHeaderMenu(false);
                void notifications.refetch();
              }}
            >
              <Ionicons name="refresh-outline" size={20} color="#1B3B2B" />
              <Text style={styles.modalMenuItemText}>Làm mới danh sách</Text>
            </Pressable>

            {rawList.length > 0 && (
              <Pressable
                style={styles.modalMenuItem}
                onPress={() => {
                  setShowHeaderMenu(false);
                  CustomAlert.alert(
                    'Xóa tất cả thông báo',
                    'Bạn có chắc chắn muốn xóa toàn bộ thông báo không?',
                    [
                      { text: 'Hủy', style: 'cancel' },
                      {
                        text: 'Xóa tất cả',
                        style: 'destructive',
                        onPress: () => void deleteAll.mutateAsync(),
                      },
                    ]
                  );
                }}
              >
                <Ionicons name="trash-outline" size={20} color="#DC2626" />
                <Text style={[styles.modalMenuItemText, { color: '#DC2626' }]}>
                  Xóa tất cả thông báo
                </Text>
              </Pressable>
            )}

            <Pressable
              style={styles.modalMenuCloseBtn}
              onPress={() => setShowHeaderMenu(false)}
            >
              <Text style={styles.modalMenuCloseText}>Đóng</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* ── Modal: Item 3 Dots Menu ── */}
      <Modal
        visible={Boolean(selectedTargetForMenu)}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedTargetForMenu(null)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setSelectedTargetForMenu(null)}
        >
          <View style={styles.modalMenuCard}>
            <Text style={styles.modalMenuTitle}>Thao tác</Text>

            {selectedTargetForMenu && !selectedTargetForMenu.readAt && (
              <Pressable
                style={styles.modalMenuItem}
                onPress={() => {
                  const id = selectedTargetForMenu.notificationId;
                  setSelectedTargetForMenu(null);
                  void markRead.mutateAsync(id);
                }}
              >
                <Ionicons name="checkmark-outline" size={20} color="#1B3B2B" />
                <Text style={styles.modalMenuItemText}>Đánh dấu đã đọc</Text>
              </Pressable>
            )}

            <Pressable
              style={styles.modalMenuItem}
              onPress={() => {
                const target = selectedTargetForMenu;
                setSelectedTargetForMenu(null);
                if (target) void openNotification(target);
              }}
            >
              <Ionicons name="open-outline" size={20} color="#1B3B2B" />
              <Text style={styles.modalMenuItemText}>Xem chi tiết</Text>
            </Pressable>

            <Pressable
              style={styles.modalMenuItem}
              onPress={() => {
                const id = selectedTargetForMenu?.id;
                setSelectedTargetForMenu(null);
                if (id) {
                  deleteNotif.mutate(id);
                }
              }}
            >
              <Ionicons name="trash-outline" size={20} color="#DC2626" />
              <Text style={[styles.modalMenuItemText, { color: '#DC2626' }]}>
                Xóa thông báo này
              </Text>
            </Pressable>

            <Pressable
              style={styles.modalMenuCloseBtn}
              onPress={() => setSelectedTargetForMenu(null)}
            >
              <Text style={styles.modalMenuCloseText}>Đóng</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

// Keep export for backwards compatibility
export function NotificationItemRow({
  target,
  onPress,
}: {
  target: NotificationTargetDto;
  onPress: () => void;
  onDelete?: () => void;
}) {
  const { category, subject, description, visual } = parseNotificationContent(target);

  return (
    <Pressable style={styles.itemRow} onPress={onPress}>
      <View style={styles.itemIconBox}>
        {visual.isMaterialCommunity ? (
          <MaterialCommunityIcons name={visual.iconName as any} size={22} color="#1B3B2B" />
        ) : (
          <Ionicons name={visual.iconName as any} size={22} color="#1B3B2B" />
        )}
      </View>
      <View style={styles.itemContentCol}>
        <Text style={styles.itemCategory}>{category}</Text>
        <Text style={styles.itemSubject}>{subject}</Text>
        <Text style={styles.itemDescription}>{description}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6F4',
  },

  /* ── Header (#1B3B2B) ── */
  headerContainer: {
    backgroundColor: '#1B3B2B',
    paddingHorizontal: 20,
    paddingBottom: 22,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerTextCol: {
    flex: 1,
  },
  headerTagline: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.72)',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontSize: 27,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginTop: 4,
  },
  headerSubtitle: {
    fontSize: 13.5,
    color: 'rgba(255, 255, 255, 0.82)',
    marginTop: 2,
  },
  headerMenuBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },

  /* ── Filter Tabs ── */
  filterTabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 6,
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 6,
  },
  tabPillActive: {
    backgroundColor: '#1B3B2B',
  },
  tabPillInactive: {
    backgroundColor: '#E8F2EC',
  },
  tabPillText: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  tabPillTextActive: {
    color: '#FFFFFF',
  },
  tabPillTextInactive: {
    color: '#1B3B2B',
  },
  tabCountPill: {
    paddingHorizontal: 7,
    paddingVertical: 1.5,
    borderRadius: 10,
  },
  tabCountPillActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  tabCountPillInactive: {
    backgroundColor: '#D6E7DC',
  },
  tabCountPillText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  tabCountPillTextActive: {
    color: '#FFFFFF',
  },
  tabCountPillTextInactive: {
    color: '#1B3B2B',
  },

  /* ── List & Group Sections ── */
  listContent: {
    paddingTop: 8,
    paddingBottom: 110, // Bottom Tab clearance
  },
  groupSection: {
    marginBottom: 16,
  },
  groupLabel: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#111827',
    marginHorizontal: 18,
    marginBottom: 8,
  },
  groupCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    position: 'relative',
  },
  itemRowPressed: {
    opacity: 0.7,
  },
  itemIconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#E8F2EC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemContentCol: {
    flex: 1,
    justifyContent: 'center',
  },
  itemCategory: {
    fontSize: 12.5,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 2,
  },
  itemSubject: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '700',
    marginBottom: 2,
  },
  itemDescription: {
    fontSize: 12.5,
    color: '#64748B',
    lineHeight: 17,
  },
  itemDotsBtn: {
    padding: 6,
    marginLeft: 6,
  },
  itemDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    position: 'absolute',
    top: 14,
    right: 2,
  },

  /* ── Empty State ── */
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#E8F2EC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
  },

  /* ── Modal Menu ── */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalMenuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    width: '100%',
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 10,
  },
  modalMenuTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 14,
    textAlign: 'center',
  },
  modalMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalMenuItemText: {
    fontSize: 14.5,
    fontWeight: '600',
    color: '#1E293B',
  },
  modalMenuCloseBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 6,
  },
  modalMenuCloseText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#64748B',
  },
});
