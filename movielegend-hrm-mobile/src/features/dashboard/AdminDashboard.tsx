import { useRouter } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, RefreshControl, Image, Dimensions } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, unwrapData } from '../../api/client';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen } from '../../components/Screen';
import { useAuth } from '../../providers/AuthProvider';
import { useUnreadNotificationCount } from '../../hooks/useNotifications';
import { useFeedbacksForManagement } from '../../hooks/useFeedback';
import { useAttendanceDashboardStats } from '../../hooks/useAttendance';
import { FeedbackCard } from '../feedback/components/FeedbackCard';
import { LiveClock } from '../../components/LiveClock';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const GRID_ITEM_WIDTH = Math.floor((width - 32 - 12 * 2) / 3);

const appleTheme = {
  bg: '#FFFFFF', // pure white background based on mockup
  card: '#FFFFFF',
  primary: '#111827',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  hint: '#9CA3AF',
  divider: '#ECEEF3',
  blueAccent: '#3B82F6',
  iconBg: '#F5F7FA',
  radiusCard: 24,
  radiusBtn: 16,
};

export function AdminDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: unreadData } = useUnreadNotificationCount();
  const unreadCount = unreadData?.count || 0;

  const { data: feedbackData, isLoading: isLoadingFeedbacks } = useFeedbacksForManagement({ limit: 5, status: 'SEND' });

  const { data: dashboardData } = useQuery({
    queryKey: ['admin-dashboard-summary'],
    queryFn: async () => {
      const response = await apiClient.get('/dashboard/admin');
      return unwrapData(response) as any;
    }
  });

  const currentDateStr = new Date().toISOString().split('T')[0];
  const { data: attStats } = useAttendanceDashboardStats({ fromDate: currentDateStr, toDate: currentDateStr });

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries();
    setRefreshing(false);
  }, [queryClient]);

  const dateString = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  const getInitials = (name?: string) => {
    if (!name) return 'AD';
    const words = name.trim().split(' ').filter(Boolean);
    if (words.length >= 2) {
      return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <Screen backgroundColor="#FAFAFA">
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.userInfoWrapper}>
            <View style={styles.avatar}>
              {user?.avatarUrl ? (
                <Image source={{ uri: user.avatarUrl }} style={{ width: '100%', height: '100%', borderRadius: 100 }} />
              ) : (
                <Text style={styles.avatarText}>{getInitials(user?.fullName)}</Text>
              )}
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.greetingText}>Xin chào 👋</Text>
              <Text style={styles.userName}>{user?.fullName || 'Admin'}</Text>
              <Text style={styles.dateText}>{dateString}</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Pressable style={styles.iconBtn} onPress={() => router.navigate('/admin/notifications')}>
              <MaterialCommunityIcons name="bell-outline" size={24} color="#111827" />
              {unreadCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </Pressable>
            <Pressable style={styles.iconBtn} onPress={() => router.push('/admin/chat')}>
              <MaterialCommunityIcons name="chat-processing-outline" size={24} color="#111827" />
            </Pressable>
          </View>
        </View>

        {/* Checked In Card with decorative gradient background */}
        <Pressable
          style={styles.heroButton}
          onPress={() => router.navigate('/admin/attendance')}
        >
          <LinearGradient
            colors={['#EF4444', '#DC2626', '#991B1B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />

          {/* Ambient glowing lighting orbs */}
          <View style={styles.ambientOrbTop} />
          <View style={styles.ambientOrbBottom} />

          {/* Decorative topographic wood grain background asset */}
          <View style={{ ...StyleSheet.absoluteFillObject, borderRadius: 24, overflow: 'hidden' }}>
            <Image
              source={require('../../../assets/topographic-contour-admin-v2.png')}
              style={[styles.heroTopographicBg, { tintColor: '#FFFFFF', opacity: 0.16 }]}
              resizeMode="cover"
            />
          </View>

          {/* Top Status Header */}
          <View style={styles.heroHeaderRow}>
            <View style={styles.heroPill}>
              <View style={styles.glowingDot}>
                <MaterialCommunityIcons name="check" size={12} color="#FFF" />
              </View>
              <Text style={styles.heroTitle}>Đã chấm công</Text>
            </View>
            <View style={styles.heroActionCircle}>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#FFF" />
            </View>
          </View>

          {/* Main Clock */}
          <View style={styles.heroTimeWrapper}>
            <LiveClock style={styles.heroSubtitle} />
          </View>

          {/* Bottom Row */}
          <View style={styles.heroFooterRow}>
            <View style={styles.locationWrapper}>
              <MaterialCommunityIcons name="map-marker" size={15} color="rgba(255, 255, 255, 0.9)" />
              <Text style={styles.locationText}>Văn phòng Hà Nội</Text>
            </View>
            <Text style={styles.heroActionHint}>Chi tiết ›</Text>
          </View>
        </Pressable>

        {/* Tiện ích (Leader-style layout with vibrant colors) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tiện ích</Text>
          <View style={styles.gridContainer}>
            <GridItem
              icon="crown-outline"
              title="Cấu hình Level"
              color="#D97706"
              onPress={() => router.push('/admin/levels' as any)}
            />
            <GridItem
              icon="shield-check-outline"
              title="Duyệt Level"
              color="#4F46E5"
              onPress={() => router.push('/admin/competition/review' as any)}
            />
            <GridItem
              icon="gift-outline"
              title="Ví Điểm Thưởng"
              color="#059669"
              badge="VIP"
              badgeColor="#D97706"
              onPress={() => router.push('/admin/tet-wallet' as any)}
            />
            <GridItem
              icon="clipboard-check-outline"
              title="Duyệt đơn"
              color="#EA580C"
              onPress={() => router.push('/leader/approvals')}
            />
            <GridItem
              icon="swap-horizontal"
              title="Chấm công"
              color="#2563EB"
              onPress={() => router.push('/admin/attendance')}
            />
            <GridItem
              icon="briefcase-outline"
              title="Công việc"
              color="#0284C7"
              onPress={() => router.push('/admin/tasks')}
            />
            <GridItem
              icon="domain"
              title="Cơ cấu PB"
              color="#7C3AED"
              onPress={() => router.push('/admin/branches')}
            />
            <GridItem
              icon="file-document-outline"
              title="Hợp đồng"
              color="#0D9488"
              onPress={() => router.push('/admin/contracts')}
            />
            <GridItem
              icon="message-draw"
              title="Góp ý"
              color="#E11D48"
              onPress={() => router.push('/admin/feedbacks')}
            />
          </View>
        </View>

        {/* Tổng quan hôm nay */}
        <Text style={[styles.sectionTitle, { marginTop: 8 }]}>Tổng quan hôm nay</Text>
        <View style={styles.summaryGrid}>
          <SummaryCard
            label="Chấm công"
            value={attStats?.totalUsers && attStats.totalUsers > 0 ? `${Math.round(((attStats?.present || 0) / attStats.totalUsers) * 100)}%` : '0%'}
          />
          <SummaryCard
            label="Công việc"
            value={dashboardData?.tasks?.totalActive?.toString() || '0'}
          />
        </View>

        {/* Góp ý mới nhất */}
        <View style={[styles.sectionHeader, { marginTop: 16 }]}>
          <Text style={styles.sectionTitle}>Góp ý mới nhất</Text>
          <Pressable onPress={() => router.navigate('/admin/feedbacks')}>
            <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '500' }}>Xem tất cả</Text>
          </Pressable>
        </View>

        <View style={{ gap: 12, marginBottom: 24 }}>
          {isLoadingFeedbacks ? (
            <Text style={{ textAlign: 'center', color: appleTheme.textSecondary, marginTop: 16 }}>Đang tải...</Text>
          ) : feedbackData?.items?.length ? (
            feedbackData.items.map((fb) => (
              <FeedbackCard
                key={fb.id}
                feedback={fb}
                isAdmin
                onPress={() => router.navigate(`/admin/feedbacks/${fb.id}` as any)}
              />
            ))
          ) : (
            <Text style={{ textAlign: 'center', color: appleTheme.textSecondary, marginTop: 16 }}>Chưa có góp ý nào</Text>
          )}
        </View>

      </ScrollView>
    </Screen>
  );
}

function SummaryCard({ label, value }: { label: string, value: string }) {
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

function GridItem({ icon, title, onPress, color, badge, badgeColor }: any) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.gridItem,
        pressed && { opacity: 0.75, transform: [{ scale: 0.96 }] },
      ]}
      onPress={onPress}
    >
      <View style={styles.gridIconContainer}>
        <MaterialCommunityIcons name={icon} size={30} color={color || '#111827'} />
        {badge && (
          <View style={[styles.badge, badgeColor ? { backgroundColor: badgeColor } : undefined]}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}
      </View>
      <Text style={styles.gridTitle} numberOfLines={2}>{title}</Text>
    </Pressable>
  );
}

function TimelineItem({ icon, time, title, subtitle, isLast = false, color = '#111827' }: any) {
  return (
    <View style={[styles.timelineItem, isLast && styles.timelineItemLast]}>
      <View style={[styles.timelineIconWrapper, { backgroundColor: color + '1A' }]}>
        <MaterialCommunityIcons name={icon} size={18} color={color} />
      </View>
      <View style={styles.timelineContent}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2, gap: 16 }}>
          <Text style={{ fontSize: 12, color: appleTheme.textSecondary, width: 60 }}>{time}</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: appleTheme.textPrimary }}>{title}</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <View style={{ width: 60 }} />
          <Text style={{ flex: 1, fontSize: 13, color: appleTheme.textSecondary }}>{subtitle}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 120,
    backgroundColor: '#FAFAFA',
    minHeight: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    marginTop: 4,
  },
  userInfoWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4B5563',
  },
  userInfo: {
    justifyContent: 'center',
  },
  greetingText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    color: appleTheme.textPrimary,
  },
  dateText: {
    fontSize: 12,
    color: appleTheme.hint,
    fontWeight: '500',
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
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  notificationDot: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  heroButton: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  ambientOrbTop: {
    position: 'absolute',
    top: -50,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  ambientOrbBottom: {
    position: 'absolute',
    bottom: -40,
    left: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  heroTopographicBg: {
    position: 'absolute',
    right: 0,
    left: 0,
    bottom: 0,
    top: 0,
    width: '100%',
    height: '100%',
  },
  heroHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    zIndex: 1,
  },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
  },
  glowingDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  heroActionCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTimeWrapper: {
    marginBottom: 14,
    zIndex: 1,
  },
  heroSubtitle: {
    color: '#FFFFFF',
    fontSize: 40,
    fontWeight: '900',
    letterSpacing: -1,
  },
  heroFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 1,
  },
  locationWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  locationText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 13,
    fontWeight: '600',
  },
  heroActionHint: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 12,
    fontWeight: '700',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 14,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridItem: {
    width: GRID_ITEM_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
    aspectRatio: 1,
  },
  gridIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    position: 'relative',
  },
  gridTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1E293B',
    textAlign: 'center',
    lineHeight: 14,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    paddingHorizontal: 3,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  summaryCard: {
    width: '48%',
    backgroundColor: appleTheme.card,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#8a99af',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  summaryLabel: {
    fontSize: 10,
    color: appleTheme.textSecondary,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center'
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: '800',
    color: appleTheme.textPrimary,
  },
  timelineContainer: {
    position: 'relative',
    marginTop: 8,
    paddingLeft: 8,
  },
  timelineLine: {
    position: 'absolute',
    left: 23,
    top: 20,
    bottom: 40,
    width: 2,
    backgroundColor: '#F3F4F6',
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 24,
    alignItems: 'flex-start',
  },
  timelineItemLast: {
    marginBottom: 0,
  },
  timelineIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    zIndex: 1,
  },
  timelineContent: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 16,
  }
});
