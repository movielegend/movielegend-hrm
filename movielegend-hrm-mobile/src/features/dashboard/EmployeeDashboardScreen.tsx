import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Platform, Dimensions, Alert, Image, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ContourHeroPattern } from './components/ContourHeroPattern';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Network from 'expo-network';
import Toast from 'react-native-toast-message';
import { useAuth } from '../../providers/AuthProvider';
import { useCurrentAttendance } from '../../hooks/useAttendance';
import { useMySchedule } from '../../hooks/useShifts';
import { useMyTasks } from '../../hooks/useTasks';
import { getMyVault } from '../../api/employees.api';
import { getNextVaultMilestone } from '../vault/vault-utils';
import { scheduleShiftNotifications, scheduleTaskNotifications } from '../../services/NotificationService';
import { Screen } from '../../components/Screen';
import { spacing } from '../../theme/spacing';
import { useUnreadNotificationCount, useUnreadChatCount } from '../../hooks/useNotifications';
import { LiveClock } from '../../components/LiveClock';
import { levelingApi } from '../../api/leveling.api';
import { LEVEL_COLORS, LEVEL_DEFAULT_NAMES } from '../../components/common/LevelNameBadge';

export function EmployeeDashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: currentAttendance } = useCurrentAttendance();
  const { data: schedule } = useMySchedule();
  const { data: myTasks } = useMyTasks({ limit: 100 });
  const { data: unreadNotifications = 0 } = useUnreadNotificationCount();
  const { data: unreadChat = 0 } = useUnreadChatCount();
  const { data: myVault } = useQuery({
    queryKey: ['my-vault', user?.id],
    queryFn: getMyVault,
    enabled: Boolean(user?.id),
  });

  const { data: levelProgress } = useQuery({
    queryKey: ['my-level-progress', user?.id],
    queryFn: () => levelingApi.getMyLevelProgress().catch(() => null),
    enabled: Boolean(user?.id),
  });

  const currentLevelNumber = levelProgress?.currentLevel?.levelNumber || 1;
  const levelColor = levelProgress?.currentLevel?.colorHex || LEVEL_COLORS[currentLevelNumber] || '#2196F3';
  const levelTitle = levelProgress?.currentLevel?.displayName || levelProgress?.currentLevel?.badgeTitle || LEVEL_DEFAULT_NAMES[currentLevelNumber] || `Cấp ${currentLevelNumber}`;
  const isVaultEnabled = Boolean(myVault?.isVaultEnabled || user?.isRewardVaultEnabled);
  const unlockedVaultPoints = myVault?.stats?.unlockedPoints || 0;
  const totalGrantedPoints = myVault?.stats?.totalGrantedPoints || 0;

  const vaultMilestone = useMemo(() => {
    return getNextVaultMilestone(myVault, new Date());
  }, [myVault]);

  useEffect(() => {
    if (schedule && schedule.length > 0) {
      scheduleShiftNotifications(schedule).catch(console.error);
    }
  }, [schedule]);

  useEffect(() => {
    if (myTasks && myTasks.items && myTasks.items?.length > 0) {
      scheduleTaskNotifications(myTasks.items).catch(console.error);
    }
  }, [myTasks]);

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0]?.charAt(0) || ''}${parts[parts.length - 1]?.charAt(0) || ''}`.toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  const fullName = user?.fullName || user?.userCode || 'Nhân viên';
  const dateString = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const uncompletedTasksCount = myTasks?.items?.filter(t => !['COMPLETED', 'CANCELLED', 'REJECTED'].includes(t.status)).length || 0;

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries();
    setRefreshing(false);
  }, [queryClient]);

  return (
    <Screen backgroundColor="#FAFAFA">
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingBottom: Math.max(insets.bottom, 24) + 80 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Pressable
              style={styles.avatarWrapper}
              onPress={() => router.push('/employee/leveling' as any)}
            >
              <View style={styles.avatar}>
                {user?.avatarUrl ? (
                  <Image source={{ uri: user.avatarUrl }} style={{ width: '100%', height: '100%', borderRadius: 100 }} />
                ) : (
                  <Text style={styles.avatarText}>{getInitials(user?.fullName)}</Text>
                )}
              </View>
              {/* Level Rank Badge on Avatar */}
              <View style={[styles.avatarLevelBadge, { backgroundColor: levelColor }]}>
                <Text style={styles.avatarLevelBadgeText}>{currentLevelNumber}</Text>
              </View>
            </Pressable>

            <View style={styles.greetingInfo}>
              <View style={styles.greetingRow}>
                <Text style={styles.greetingText}>Xin chào 👋</Text>
                <Pressable
                  style={[
                    styles.levelPill,
                    { backgroundColor: `${levelColor}15`, borderColor: `${levelColor}40` },
                  ]}
                  onPress={() => router.push('/employee/leveling' as any)}
                >
                  <MaterialCommunityIcons name="crown" size={12} color={levelColor} />
                  <Text style={[styles.levelPillText, { color: levelColor }]}>
                    Lv.{currentLevelNumber} • {levelTitle}
                  </Text>
                </Pressable>
              </View>
              <Text style={styles.userName} numberOfLines={1}>{fullName}</Text>
              <Text style={styles.dateText}>{dateString}</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Pressable style={styles.iconBtn} onPress={() => router.push('/employee/notifications' as any)}>
              <MaterialCommunityIcons name="bell-outline" size={24} color="#111827" />
              {unreadNotifications > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {unreadNotifications > 99 ? '99+' : unreadNotifications}
                  </Text>
                </View>
              )}
            </Pressable>
            <Pressable style={styles.iconBtn} onPress={() => router.push('/employee/chat' as any)}>
              <MaterialCommunityIcons name="chat-outline" size={24} color="#111827" />
              {unreadChat > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {unreadChat > 99 ? '99+' : unreadChat}
                  </Text>
                </View>
              )}
            </Pressable>
          </View>
        </View>

        {/* Hero Card (Đã chấm công) */}
        <Pressable 
          style={styles.heroCard}
          onPress={async () => {
            try {
              if (currentAttendance?.state === 'CHECKED_IN') {
                router.push('/employee/attendance/check-out' as any);
              } else {
                router.push('/employee/attendance/check-in' as any);
              }
            } catch (error) {
              Toast.show({
                type: 'error',
                text1: 'Lỗi',
                text2: 'Không thể kiểm tra kết nối mạng.',
              });
            }
          }}
        >
          <View style={styles.heroCardInner}>
            {/* Vân địa hình hữu cơ / Topographic contour ripples */}
            <ContourHeroPattern variant="blue" />

            {/* Top Status Header */}
            <View style={styles.heroHeaderRow}>
              <MaterialCommunityIcons 
                name={currentAttendance?.state === 'CHECKED_IN' ? 'check-circle' : 'check-circle'} 
                size={18} 
                color="#2563EB" 
              />
              <Text style={styles.heroStatusText}>
                {currentAttendance?.state === 'CHECKED_IN' ? 'Đang trong ca làm' : 'Vào ca / Chấm công'}
              </Text>
            </View>

            {/* Main Clock */}
            <View style={styles.heroTimeWrapper}>
              <LiveClock style={styles.heroTimeText} />
            </View>

            {/* Bottom Row */}
            <View style={styles.heroFooterRow}>
              <View style={styles.locationWrapper}>
                <MaterialCommunityIcons name="map-marker-outline" size={16} color="#64748B" />
                <Text style={styles.locationText}>Văn phòng Hà Nội</Text>
              </View>
            </View>
          </View>
        </Pressable>

        {/* Hub Cấp Bậc & Ví Thưởng Hợp Nhất (Career & Vault Hub) */}
        <View style={styles.hubContainer}>
          <View style={styles.hubSectionHeader}>
            <Text style={styles.hubSectionTitle}>Hành Trình & Quỹ Thưởng</Text>
          </View>

          <View style={styles.hubCard}>
            {/* Segment 1: Cấp Bậc & Lộ Trình */}
            <Pressable
              style={styles.hubSegment}
              onPress={() => router.push('/employee/leveling' as any)}
            >
              <View style={styles.hubRow}>
                <View style={[styles.hubIconCircle, { backgroundColor: `${levelColor}15` }]}>
                  <MaterialCommunityIcons name="crown" size={20} color={levelColor} />
                </View>
                <View style={styles.hubInfoBlock}>
                  <View style={styles.hubTitleRow}>
                    <Text style={styles.hubTitle} numberOfLines={1}>
                      Level {currentLevelNumber}: {levelTitle}
                    </Text>
                    <View style={[styles.hubTag, { backgroundColor: `${levelColor}15` }]}>
                      <Text style={[styles.hubTagText, { color: levelColor }]}>Lv.{currentLevelNumber}</Text>
                    </View>
                  </View>
                  <Text style={styles.hubSubtitle}>
                    {levelProgress?.nextLevel
                      ? `Tiến độ lên Level ${levelProgress.nextLevel.levelNumber}: ${levelProgress?.overallProgressPercent || 0}%`
                      : 'Cấp bậc danh dự tối cao'}
                  </Text>
                </View>
                <View style={[styles.hubActionBtn, { backgroundColor: `${levelColor}10` }]}>
                  <Text style={[styles.hubActionText, { color: levelColor }]}>Lộ trình</Text>
                  <MaterialCommunityIcons name="chevron-right" size={14} color={levelColor} />
                </View>
              </View>

              {/* Progress Bar */}
              <View style={styles.hubProgressTrack}>
                <View
                  style={[
                    styles.hubProgressFill,
                    {
                      width: `${Math.min(100, Math.max(4, levelProgress?.overallProgressPercent || 0))}%`,
                      backgroundColor: levelColor,
                    },
                  ]}
                />
              </View>
              <View style={styles.hubProgressFooter}>
                <Text style={styles.hubProgressLabel}>
                  {levelProgress?.nextLevel
                    ? `Mục tiêu thăng cấp Level ${levelProgress.nextLevel.levelNumber}`
                    : 'Đã hoàn tất tiến độ cấp'}
                </Text>
                <Text style={[styles.hubProgressPercent, { color: levelColor }]}>
                  {levelProgress?.overallProgressPercent || 0}%
                </Text>
              </View>
            </Pressable>

            {/* Segment 2: Ví Thưởng Tích Lũy (nếu mở) */}
            {isVaultEnabled && (
              <>
                <View style={styles.hubDivider} />
                <Pressable
                  style={styles.hubSegment}
                  onPress={() => router.push('/employee/vault' as any)}
                >
                  <View style={styles.hubRow}>
                    <View style={[styles.hubIconCircle, { backgroundColor: '#F1F5F9' }]}>
                      <MaterialCommunityIcons name="wallet-outline" size={20} color="#1E293B" />
                    </View>
                    <View style={styles.hubInfoBlock}>
                      <View style={styles.hubTitleRow}>
                        <Text style={styles.hubTitle} numberOfLines={1}>Ví Thưởng Tích Lũy</Text>
                        <View style={styles.vaultBadge}>
                          <Text style={styles.vaultBadgeText}>Đặc quyền</Text>
                        </View>
                      </View>
                      <Text style={styles.hubSubtitle}>
                        Khả dụng: <Text style={styles.hubSubtitleGreen}>{unlockedVaultPoints.toLocaleString('vi-VN')} đ</Text>
                        {totalGrantedPoints > 0 ? ` • Quỹ: ${totalGrantedPoints.toLocaleString('vi-VN')} đ` : ''}
                      </Text>
                    </View>
                    <View style={styles.vaultActionBtn}>
                      <Text style={styles.vaultActionText}>Chi tiết</Text>
                      <MaterialCommunityIcons name="chevron-right" size={14} color="#475569" />
                    </View>
                  </View>

                  {vaultMilestone ? (
                    <>
                      <View style={styles.hubProgressTrack}>
                        <View
                          style={[
                            styles.hubProgressFill,
                            {
                              width: `${Math.min(100, Math.max(4, vaultMilestone.progressPercent))}%`,
                              backgroundColor: vaultMilestone.isAllUnlocked ? '#059669' : '#2563EB',
                            },
                          ]}
                        />
                      </View>
                      <View style={styles.hubProgressFooter}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <MaterialCommunityIcons
                            name={vaultMilestone.isAllUnlocked ? 'check-decagram' : 'timer-sand'}
                            size={12}
                            color={vaultMilestone.isAllUnlocked ? '#059669' : '#64748B'}
                          />
                          <Text style={styles.vaultCountdownLabel}>
                            {vaultMilestone.isAllUnlocked
                              ? 'Đã mở khóa tất cả đợt'
                              : `Mở ${vaultMilestone.title} (${vaultMilestone.unlockDateFormatted})`}
                          </Text>
                        </View>
                        <Text style={styles.vaultCountdownTime}>
                          {vaultMilestone.isAllUnlocked
                            ? '100% Hoàn tất'
                            : `Còn ${vaultMilestone.days} ngày ${vaultMilestone.hours}h`}
                        </Text>
                      </View>
                    </>
                  ) : null}
                </Pressable>
              </>
            )}
          </View>
        </View>

        {/* Tiện ích thường dùng (4 cột hiện đại, màu sắc nhóm đồng bộ) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tiện ích thường dùng</Text>
          <View style={styles.grid4Container}>
            {/* Nhóm 1: Ca làm & Công (Xanh dương hoàng gia) */}
            <GridItem4
              icon="calendar-clock"
              title="Ca làm việc"
              color="#2563EB"
              bgColor="#EFF6FF"
              onPress={() => router.push('/employee/schedule')}
            />
            <GridItem4
              icon="calendar-check-outline"
              title="Lịch sử công"
              color="#2563EB"
              bgColor="#EFF6FF"
              onPress={() => router.push('/employee/attendance/history' as any)}
            />
            <GridItem4
              icon="swap-horizontal"
              title="Đổi ca"
              color="#2563EB"
              bgColor="#EFF6FF"
              onPress={() => router.push('/employee/shift-swaps')}
            />

            {/* Nhóm 2: Hành chính & Đơn từ (Teal thanh lịch) */}
            <GridItem4
              icon="file-document-edit-outline"
              title="Đơn từ"
              color="#0D9488"
              bgColor="#F0FDFA"
              onPress={() => router.push('/employee/requests')}
            />
            <GridItem4
              icon="file-document-outline"
              title="Hợp đồng"
              color="#0D9488"
              bgColor="#F0FDFA"
              onPress={() => router.push('/employee/contracts')}
            />
            <GridItem4
              icon="folder-text-outline"
              title="Tài liệu"
              color="#0D9488"
              bgColor="#F0FDFA"
              onPress={() => router.push('/employee/documents' as any)}
            />

            {/* Nhóm 3: Công việc & Dự án (Indigo) */}
            <GridItem4
              icon="format-list-checks"
              title="Công việc"
              color="#4F46E5"
              bgColor="#EEF2FF"
              badge={uncompletedTasksCount > 0 ? String(uncompletedTasksCount) : undefined}
              onPress={() => router.push('/employee/tasks')}
            />
            <GridItem4
              icon="briefcase-outline"
              title="Dự án"
              color="#4F46E5"
              bgColor="#EEF2FF"
              onPress={() => router.push('/employee/level-projects' as any)}
            />
            <GridItem4
              icon="transit-connection-variant"
              title="Liên phòng"
              color="#4F46E5"
              bgColor="#EEF2FF"
              onPress={() => router.push('/employee/cross-department')}
            />

            {/* Nhóm 4: Hỗ trợ & Trí tuệ nhân tạo (Executive Slate & Dark) */}
            <GridItem4
              icon="robot-outline"
              title="Trợ lý AI"
              color="#FFFFFF"
              bgColor="#0F172A"
              badge="AI"
              badgeColor="#2563EB"
              onPress={() => router.push('/employee/ai-chat')}
            />
            <GridItem4
              icon="laptop"
              title="Tài sản"
              color="#64748B"
              bgColor="#F8FAFC"
              onPress={() => router.push('/employee/assets')}
            />
            <GridItem4
              icon="message-draw"
              title="Góp ý"
              color="#64748B"
              bgColor="#F8FAFC"
              onPress={() => router.push('/employee/feedbacks' as any)}
            />
          </View>
        </View>

        {/* Công việc của tôi */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Công việc của tôi</Text>
          <View style={styles.tasksContainer}>
            {myTasks?.items && myTasks.items?.length > 0 ? (
              [...myTasks.items]
                .sort((a, b) => {
                  const isACompleted = a.status === 'COMPLETED' || a.status === 'CANCELLED';
                  const isBCompleted = b.status === 'COMPLETED' || b.status === 'CANCELLED';
                  if (isACompleted && !isBCompleted) return 1;
                  if (!isACompleted && isBCompleted) return -1;
                  return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
                })
                .slice(0, 5)
                .map((task) => {
                  let formattedDueDate = 'Không có hạn';
                  const taskDue = task.dueAt || (task as any).dueDate;
                  if (taskDue) {
                    const parsed = new Date(taskDue);
                    if (!isNaN(parsed.getTime())) {
                      formattedDueDate = parsed.toLocaleDateString('vi-VN');
                    }
                  }
                  return (
                    <TaskCard
                      key={task.id}
                      title={task.title}
                      priority={task.priority === 'HIGH' ? 'Cao' : task.priority === 'NORMAL' ? 'Trung bình' : 'Thấp'}
                      priorityColor={task.priority === 'HIGH' ? '#EF4444' : task.priority === 'NORMAL' ? '#F59E0B' : '#10B981'}
                      dueDate={formattedDueDate}
                      onPress={() => router.push(`/employee/tasks/${task.id}`)}
                      isCompleted={task.status === 'COMPLETED' || task.status === 'CANCELLED'}
                    />
                  );
                })
            ) : (
              <TaskCard
                title="Cập nhật báo cáo tiến độ tuần"
                priority="Trung bình"
                priorityColor="#F59E0B"
                dueDate="Ngày mai"
                onPress={() => router.push('/employee/tasks')}
              />
            )}
          </View>
        </View>

      </ScrollView>
    </Screen>
  );
}

const GridItem4 = React.memo(function GridItem4({
  icon,
  title,
  onPress,
  color,
  bgColor,
  badge,
  badgeColor,
}: any) {
  return (
    <Pressable
      style={({ pressed }) => [styles.grid4Item, pressed && styles.grid4ItemPressed]}
      onPress={onPress}
    >
      <View style={[styles.grid4IconContainer, bgColor ? { backgroundColor: bgColor } : undefined]}>
        <MaterialCommunityIcons name={icon} size={23} color={color || '#1E293B'} />
        {badge && (
          <View style={[styles.badge, badgeColor ? { backgroundColor: badgeColor } : undefined]}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}
      </View>
      <Text style={styles.grid4Title} numberOfLines={1}>{title}</Text>
    </Pressable>
  );
});

const TaskCard = React.memo(function TaskCard({
  title,
  priority,
  priorityColor,
  dueDate,
  onPress,
  isCompleted,
}: any) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.taskCard,
        isCompleted && { opacity: 0.6, backgroundColor: '#F9FAFB' },
        pressed && { opacity: 0.85 },
      ]}
      onPress={onPress}
    >
      <View style={styles.taskIconWrapper}>
        <MaterialCommunityIcons
          name={isCompleted ? 'check-circle' : 'checkbox-blank-circle-outline'}
          size={22}
          color={isCompleted ? '#10B981' : '#CBD5E1'}
        />
      </View>
      <View style={styles.taskContent}>
        <Text style={[styles.taskTitle, isCompleted && { textDecorationLine: 'line-through', color: '#94A3B8' }]} numberOfLines={2}>
          {title}
        </Text>
        <View style={styles.taskFooter}>
          <View style={styles.taskMeta}>
            <MaterialCommunityIcons name="calendar-clock-outline" size={13} color="#94A3B8" />
            <Text style={styles.taskDueDate}>{dueDate}</Text>
          </View>
          <View style={[styles.priorityBadge, { backgroundColor: priorityColor + '15' }]}>
            <View style={[styles.priorityDot, { backgroundColor: priorityColor }]} />
            <Text style={[styles.priorityText, { color: priorityColor }]}>{priority}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xxl,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
    marginTop: spacing.xs,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
    minWidth: 0,
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: spacing.md,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  avatarLevelBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FAFAFA',
    paddingHorizontal: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
  },
  avatarLevelBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 12,
  },
  greetingInfo: {
    flex: 1,
    minWidth: 0,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
    flexWrap: 'wrap',
  },
  levelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 1.5,
    borderRadius: 12,
    borderWidth: 1,
  },
  levelPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  greetingText: {
    fontSize: 14,
    color: '#6B7280',
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  dateText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#ECEEF3',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  badgeDot: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    zIndex: 10,
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  heroCard: {
    borderRadius: 24,
    marginBottom: spacing.xl,
    backgroundColor: '#FFFFFF',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 3,
  },
  heroCardInner: {
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingVertical: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E0F2FE',
    backgroundColor: '#FFFFFF',
    position: 'relative',
    minHeight: 148,
    justifyContent: 'space-between',
  },
  heroHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    zIndex: 2,
  },
  heroStatusText: {
    color: '#1E40AF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  heroTimeWrapper: {
    marginVertical: 4,
    zIndex: 2,
  },
  heroTimeText: {
    fontSize: 48,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -1.5,
  },
  heroFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 2,
  },
  locationWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  locationText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },

  // Hub Cấp Bậc & Ví Thưởng
  hubContainer: {
    marginBottom: spacing.xl,
  },
  hubSectionHeader: {
    marginBottom: spacing.sm,
  },
  hubSectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
  },
  hubCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  hubSegment: {
    paddingVertical: 4,
  },
  hubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hubIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hubInfoBlock: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  hubTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  hubTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    flexShrink: 1,
  },
  hubTag: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  hubTagText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  hubSubtitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  hubSubtitleGreen: {
    fontWeight: '800',
    color: '#059669',
  },
  hubActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  hubActionText: {
    fontSize: 11,
    fontWeight: '700',
  },
  hubProgressTrack: {
    height: 5,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 10,
    marginBottom: 6,
  },
  hubProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  hubProgressFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hubProgressLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  hubProgressPercent: {
    fontSize: 11,
    fontWeight: '700',
  },
  hubDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  vaultBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  vaultBadgeText: {
    color: '#475569',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  vaultActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  vaultActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  vaultCountdownLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  vaultCountdownTime: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
  },

  // 4 Cột Tiện ích
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
    marginBottom: spacing.md,
  },
  grid4Container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  grid4Item: {
    width: '25%',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 2,
  },
  grid4ItemPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.96 }],
  },
  grid4IconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    position: 'relative',
  },
  grid4Title: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Tasks
  tasksContainer: {
    gap: spacing.md,
  },
  taskCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    alignItems: 'flex-start',
  },
  taskIconWrapper: {
    marginRight: spacing.sm,
    marginTop: 2,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: spacing.sm,
    lineHeight: 20,
  },
  taskFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  taskDueDate: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
