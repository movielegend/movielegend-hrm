import { useRouter } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, RefreshControl } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen } from '../../components/Screen';
import { useAuth } from '../../providers/AuthProvider';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { hasPermission } from '../../utils/permissions';

export function EmployeeDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries();
    setRefreshing(false);
  }, [queryClient]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Date format for the header
  const headerDate = currentTime.toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  return (
    <Screen>
      <ScrollView 
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user?.fullName?.charAt(0) || 'B'}</Text>
            </View>
            <View style={styles.greetingInfo}>
              <Text style={styles.greetingText}>Xin chào 👋</Text>
              <Text style={styles.userName}>{user?.fullName || 'Bình'}</Text>
              <Text style={styles.dateText}>{headerDate}</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Pressable style={styles.iconBtn} onPress={() => router.push('/employee/notifications' as any)}>
              <MaterialCommunityIcons name="bell-outline" size={24} color="#111827" />
              <View style={styles.badgeDot} />
            </Pressable>
            <Pressable style={styles.iconBtn}>
              <MaterialCommunityIcons name="format-list-bulleted" size={24} color="#111827" />
            </Pressable>
          </View>
        </View>

        {/* Hero Card (Đã chấm công) */}
        <Pressable 
          style={styles.heroCard}
          onPress={() => router.push('/employee/attendance/check-in' as any)}
        >
          {/* SVG/Pattern background mock using absolute views */}
          <View style={styles.heroCardPattern} />
          
          <View style={styles.statusBadge}>
            <MaterialCommunityIcons name="check-circle" size={16} color="#3B82F6" />
            <Text style={styles.statusBadgeText}>Đã chấm công</Text>
          </View>
          <View style={styles.timeContainer}>
            <Text style={styles.timeValue}>{timeString.split(' ')[0]}</Text>
            <Text style={styles.timeAmPm}>{timeString.split(' ')[1] || 'AM'}</Text>
          </View>
          <View style={styles.locationContainer}>
            <MaterialCommunityIcons name="map-marker-outline" size={16} color="#6B7280" />
            <Text style={styles.locationText}>Văn phòng Hà Nội</Text>
          </View>
        </Pressable>

        {/* Thao tác nhanh (Quick Actions) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thao tác nhanh</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickActions}>
            <QuickAction icon="clock-outline" title="Chấm công" onPress={() => router.push('/employee/attendance' as any)} />
            <QuickAction icon="calendar-blank-outline" title="Nghỉ phép" onPress={() => router.push('/employee/requests' as any)} />
            <QuickAction icon="calendar-check-outline" title="Xếp ca" onPress={() => router.push('/employee/schedule' as any)} />
            <QuickAction icon="wallet-outline" title="Phiếu lương" onPress={() => {}} />
          </ScrollView>
        </View>

        {/* Tổng quan hôm nay */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tổng quan hôm nay</Text>
          <View style={styles.statsRow}>
            <StatCard title="Chấm công" value="98%" />
            <StatCard title="Công việc" value="4" />
            <StatCard title="Cuộc họp" value="2" />
            <StatCard title="Thông báo" value="3" />
          </View>
        </View>

        {/* Hoạt động gần đây */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Hoạt động gần đây</Text>
            <Text style={styles.seeAllText}>Xem tất cả</Text>
          </View>
          
          <View style={styles.timeline}>
            <TimelineItem 
              time="09:02 AM" 
              icon="clock-outline"
              title="Chấm công vào" 
              desc="Văn phòng Hà Nội"
              isFirst
            />
            <TimelineItem 
              time="08:45 AM" 
              icon="clipboard-text-outline"
              title="Được giao nhiệm vụ mới" 
              desc="Thiết kế banner sự kiện"
            />
            <TimelineItem 
              time="Hôm qua" 
              icon="file-document-outline"
              title="Đơn nghỉ phép được duyệt" 
              desc="Nghỉ phép 1 ngày - 10/07/2024"
              isLast
            />
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

function QuickAction({ icon, title, onPress }: any) {
  return (
    <Pressable style={styles.quickActionCard} onPress={onPress}>
      <View style={styles.quickActionIconBg}>
        <MaterialCommunityIcons name={icon} size={26} color="#111827" />
      </View>
      <Text style={styles.quickActionTitle}>{title}</Text>
    </Pressable>
  );
}

function StatCard({ title, value }: any) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function TimelineItem({ time, title, desc, icon, isFirst, isLast }: any) {
  return (
    <View style={styles.timelineItem}>
      {/* Time column */}
      <View style={styles.timelineTimeCol}>
        <View style={styles.timelineIconContainer}>
          <MaterialCommunityIcons name={icon} size={20} color="#4B5563" />
        </View>
        {!isLast && <View style={styles.timelineLine} />}
      </View>
      
      {/* Content column */}
      <View style={styles.timelineContentCol}>
        <View style={styles.timelineRow}>
          <Text style={styles.timelineTime}>{time}</Text>
          <View style={styles.timelineDetails}>
            <Text style={styles.timelineTitle}>{title}</Text>
            <Text style={styles.timelineDesc}>{desc}</Text>
          </View>
        </View>
        {!isLast && <View style={styles.timelineDivider} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xl,
    marginTop: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
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
  greetingInfo: {
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
    color: '#111827',
    marginBottom: 2,
  },
  dateText: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  headerRight: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  badgeDot: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1,
    borderColor: '#fff',
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EFF6FF',
  },
  heroCardPattern: {
    position: 'absolute',
    right: -40,
    top: -20,
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 20,
    borderColor: '#EFF6FF',
    opacity: 0.5,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.md,
  },
  statusBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.sm,
  },
  timeValue: {
    fontSize: 48,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -1,
  },
  timeAmPm: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginLeft: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: spacing.md,
  },
  seeAllText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: spacing.md,
  },
  quickActions: {
    gap: spacing.sm,
    paddingRight: spacing.lg,
  },
  quickActionCard: {
    width: 88,
    height: 100,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
  },
  quickActionIconBg: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#FAFAFA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  quickActionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
  },
  statTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  timeline: {
    marginTop: spacing.sm,
  },
  timelineItem: {
    flexDirection: 'row',
  },
  timelineTimeCol: {
    width: 40,
    alignItems: 'center',
  },
  timelineIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#F3F4F6',
    marginTop: -4,
    marginBottom: -4,
    zIndex: 1,
  },
  timelineContentCol: {
    flex: 1,
    paddingLeft: spacing.md,
    paddingBottom: spacing.lg,
  },
  timelineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timelineTime: {
    width: 70,
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 2,
  },
  timelineDetails: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  timelineDesc: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  timelineDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginTop: spacing.md,
    marginBottom: -spacing.md,
  }
});
