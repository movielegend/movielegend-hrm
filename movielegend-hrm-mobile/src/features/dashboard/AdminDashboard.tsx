import { useRouter } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, RefreshControl, Image } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen } from '../../components/Screen';
import { useAuth } from '../../providers/AuthProvider';

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

  const timeString = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const dateString = currentTime.toLocaleDateString('vi-VN', {
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
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.userInfoWrapper}>
            <View style={styles.avatar}>
               <Text style={styles.avatarText}>B</Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.greetingText}>Xin chào 👋</Text>
              <Text style={styles.userName}>{user?.fullName?.split(' ')[0] || 'Bình'}</Text>
              <Text style={styles.dateText}>{dateString}</Text>
            </View>
          </View>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
            <Pressable style={styles.iconBtn} onPress={() => router.navigate('/admin/notifications')}>
              <MaterialCommunityIcons name="bell-outline" size={24} color={appleTheme.textPrimary} />
              <View style={styles.notificationDot} />
            </Pressable>
            <Pressable style={styles.iconBtn}>
              <MaterialCommunityIcons name="format-list-bulleted" size={24} color={appleTheme.textPrimary} />
            </Pressable>
          </View>
        </View>

        {/* Checked In Card with decorative background */}
        <Pressable 
          style={styles.heroButton}
          onPress={() => router.navigate('/admin/attendance')}
        >
          {/* Decorative background shapes mimicking topological lines */}
          <View style={styles.heroDecoration1} />
          <View style={styles.heroDecoration2} />
          <View style={styles.heroDecoration3} />
          <View style={styles.heroDecoration4} />
          <View style={styles.heroDecoration5} />
          
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
             <View style={{ backgroundColor: appleTheme.blueAccent, borderRadius: 12, width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
               <MaterialCommunityIcons name="check" size={16} color="#FFF" />
             </View>
             <Text style={styles.heroTitle}>Đã chấm công</Text>
          </View>
          
          <View style={{flexDirection: 'row', alignItems: 'baseline', gap: 4, marginBottom: 20}}>
            <Text style={styles.heroSubtitle}>{timeString.split(' ')[0]}</Text>
            <Text style={{fontSize: 16, fontWeight: '700', color: appleTheme.textPrimary}}>{timeString.split(' ')[1]}</Text>
          </View>

          <View style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
             <MaterialCommunityIcons name="map-marker-outline" size={16} color={appleTheme.textSecondary} />
             <Text style={{ color: appleTheme.textSecondary, fontSize: 13 }}>Văn phòng Hà Nội</Text>
          </View>
        </Pressable>

        {/* Thao tác nhanh */}
        <Text style={styles.sectionTitleFolder}>Thao tác nhanh</Text>
        <View style={styles.grid}>
          <GridCard 
            title="Chấm công" 
            icon="clock-outline" 
            onPress={() => router.navigate('/admin/attendance')}
          />
          <GridCard 
            title="Duyệt đơn" 
            icon="calendar-outline" 
            onPress={() => router.navigate('/leader/employee-requests')}
          />
          <GridCard 
            title="Công việc" 
            icon="calendar-check-outline" 
            onPress={() => router.navigate('/admin/tasks')}
          />
          <GridCard 
            title="Quản lý" 
            icon="wallet-outline" 
            onPress={() => router.navigate('/admin/branches')}
          />
        </View>

        {/* Tổng quan hôm nay */}
        <Text style={[styles.sectionTitleFolder, { marginTop: 16 }]}>Tổng quan hôm nay</Text>
        <View style={styles.summaryGrid}>
          <SummaryCard label="Chấm công" value="98%" />
          <SummaryCard label="Công việc" value="4" />
          <SummaryCard label="Cuộc họp" value="2" />
          <SummaryCard label="Thông báo" value="3" />
        </View>

        {/* Hoạt động gần đây */}
        <View style={[styles.sectionHeader, { marginTop: 16 }]}>
          <Text style={styles.sectionTitleFolder}>Hoạt động gần đây</Text>
          <Pressable>
            <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '500' }}>Xem tất cả</Text>
          </Pressable>
        </View>
        
        <View style={styles.timelineContainer}>
          {/* Vertical Line */}
          <View style={styles.timelineLine} />

          {/* Timeline Items */}
          <TimelineItem 
            icon="clock-outline"
            time="09:02 AM"
            title="Chấm công vào"
            subtitle="Văn phòng Hà Nội"
          />
          
          <TimelineItem 
            icon="clipboard-outline"
            time="08:45 AM"
            title="Được giao nhiệm vụ mới"
            subtitle="Thiết kế banner sự kiện"
          />
          
          <TimelineItem 
            icon="office-building-outline"
            time="Hôm qua"
            title="Đơn nghỉ phép được duyệt"
            subtitle="Nghỉ phép 1 ngày - 10/07/2024"
            isLast={true}
          />
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

function GridCard({ title, icon, onPress }: any) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.cardIconBg}>
        <MaterialCommunityIcons name={icon} size={28} color="#111827" />
      </View>
      <Text style={styles.cardTitle}>{title}</Text>
    </Pressable>
  );
}

function TimelineItem({ icon, time, title, subtitle, isLast = false }: any) {
  return (
    <View style={[styles.timelineItem, isLast && styles.timelineItemLast]}>
      <View style={styles.timelineIconWrapper}>
        <MaterialCommunityIcons name={icon} size={18} color="#111827" />
      </View>
      <View style={styles.timelineContent}>
        <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 2, gap: 16}}>
          <Text style={{fontSize: 12, color: appleTheme.textSecondary, width: 60}}>{time}</Text>
          <View style={{flex: 1}}>
             <Text style={{fontSize: 14, fontWeight: '700', color: appleTheme.textPrimary}}>{title}</Text>
          </View>
        </View>
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 16}}>
           <View style={{width: 60}} />
           <Text style={{flex: 1, fontSize: 13, color: appleTheme.textSecondary}}>{subtitle}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 120,
    backgroundColor: appleTheme.bg,
    minHeight: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  userInfoWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '700',
  },
  userInfo: {
    flexDirection: 'column',
    gap: 2,
  },
  greetingText: {
    fontSize: 13,
    color: appleTheme.textSecondary,
    fontWeight: '500',
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: appleTheme.iconBg,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: appleTheme.iconBg,
  },
  heroButton: {
    backgroundColor: appleTheme.card,
    borderRadius: appleTheme.radiusCard,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#8a99af',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 3,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.05)',
  },
  heroDecoration1: {
    position: 'absolute', right: -60, bottom: -60, width: 240, height: 240, borderRadius: 120, borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.15)',
  },
  heroDecoration2: {
    position: 'absolute', right: -30, bottom: -30, width: 180, height: 180, borderRadius: 90, borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.15)',
  },
  heroDecoration3: {
    position: 'absolute', right: -10, bottom: -10, width: 140, height: 140, borderRadius: 70, borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.15)',
  },
  heroDecoration4: {
    position: 'absolute', right: 10, bottom: 10, width: 100, height: 100, borderRadius: 50, borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.15)',
  },
  heroDecoration5: {
    position: 'absolute', right: 20, bottom: 20, width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(59, 130, 246, 0.03)',
  },
  heroTitle: {
    color: '#0A2540',
    fontSize: 15,
    fontWeight: '800',
  },
  heroSubtitle: {
    color: appleTheme.textPrimary,
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleFolder: {
    fontSize: 16,
    fontWeight: '800',
    color: appleTheme.textPrimary,
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  card: {
    width: '23%',
    backgroundColor: appleTheme.card,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: 'center',
    shadowColor: '#8a99af',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  cardIconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: '500',
    color: appleTheme.textSecondary,
    textAlign: 'center',
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  summaryCard: {
    width: '23%',
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
