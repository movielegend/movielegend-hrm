import { Ionicons } from '@expo/vector-icons';
import { useRouter, Link } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View, Image } from 'react-native';
import { useAuth } from '../../providers/AuthProvider';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

export function ModernHome() {
  const router = useRouter();
  const { user } = useAuth();

  const weekDays = [
    { label: 'T2', date: '06' },
    { label: 'T3', date: '07', active: true },
    { label: 'T4', date: '08' },
    { label: 'T5', date: '09' },
    { label: 'T6', date: '10' },
    { label: 'T7', date: '11' },
  ];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerSpacer} />
          <View style={styles.headerRight}>
            <View style={styles.userInfo}>
              <Text style={styles.greetingText}>Xin chào,</Text>
              <Text style={styles.userName}>{user?.fullName || 'Phùng Thanh Bình'}</Text>
            </View>
            <Image source={{ uri: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=150&q=80' }} style={styles.avatar} />
            <Pressable style={styles.notificationButton}>
              <Ionicons name="notifications-outline" size={20} color={colors.primaryDark} />
            </Pressable>
          </View>
        </View>

        {/* Lịch làm việc */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Lịch làm việc</Text>
            <Pressable>
              <Text style={styles.sectionLink}>Tất cả &gt;</Text>
            </Pressable>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.calendarScroll}>
            {weekDays.map((day, index) => (
              <View key={index} style={[styles.dayItem, day.active && styles.dayItemActive]}>
                <Text style={[styles.dayLabel, day.active && styles.dayLabelActive]}>{day.label}</Text>
                <Text style={[styles.dayDate, day.active && styles.dayDateActive]}>{day.date}</Text>
                {day.active && <View style={styles.dayDot} />}
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Nút Vào ca */}
        <Pressable
          style={styles.checkInCard}
          onPress={() => router.push('/employee/attendance')}
        >
          <View>
            <Text style={styles.checkInTitle}>Vào ca</Text>
            <Text style={styles.checkInTime}>09:48</Text>
          </View>
          <View style={styles.checkInIconContainer}>
            <Ionicons name="finger-print" size={36} color="#FFFFFF" />
          </View>
        </Pressable>

        {/* Thư mục */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thư mục</Text>
          <View style={styles.grid}>
            
            <Pressable style={styles.gridItem} onPress={() => router.push(user?.roles?.includes('ADMIN') ? '/admin/requests' : '/employee/requests')}>
              <View style={[styles.iconBox, { backgroundColor: 'transparent' }]}>
                <Ionicons name="paper-plane-outline" size={28} color={colors.text} />
              </View>
              <Text style={styles.gridLabel}>Yêu cầu</Text>
              <View style={styles.badges}>
                <View style={[styles.badge, { backgroundColor: colors.warning }]}><Text style={styles.badgeText}>0</Text></View>
                <View style={[styles.badge, { backgroundColor: colors.success }]}><Text style={styles.badgeText}>0</Text></View>
                <View style={[styles.badge, { backgroundColor: colors.danger }]}><Text style={styles.badgeText}>0</Text></View>
              </View>
            </Pressable>

            <Link href={user?.roles?.includes('ADMIN') ? "/admin/attendance" : "/employee/attendance"} asChild>
              <Pressable style={styles.gridItem}>
                <View style={[styles.iconBox, { backgroundColor: 'rgba(30,136,229,0.15)', borderRadius: 20 }]}>
                  <Ionicons name="clipboard-outline" size={24} color={colors.primary} />
                </View>
                <Text style={styles.gridLabel}>Chấm công</Text>
              </Pressable>
            </Link>

            <Link href={user?.roles?.includes('ADMIN') ? "/admin/shifts" : "/employee/schedule"} asChild>
              <Pressable style={styles.gridItem}>
                <View style={[styles.iconBox, { backgroundColor: 'rgba(239,68,68,0.15)', borderRadius: 20 }]}>
                  <Ionicons name="calendar-outline" size={24} color={colors.danger} />
                </View>
                <Text style={styles.gridLabel}>Xếp ca</Text>
              </Pressable>
            </Link>

            <Pressable style={styles.gridItem}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(22,163,74,0.15)', borderRadius: 20 }]}>
                <Ionicons name="document-text-outline" size={24} color={colors.success} />
              </View>
              <Text style={styles.gridLabel}>Phiếu lương</Text>
            </Pressable>


            
          </View>
        </View>

      </ScrollView>

      {/* Bottom Navigation */}
      <View style={{
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E6EEF3',
        paddingBottom: 24, // Safe area for iOS
        paddingTop: 12,
        justifyContent: 'space-around',
        alignItems: 'center',
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
      }}>
        <Pressable style={{ alignItems: 'center', gap: 4 }}>
          <Ionicons name="home" size={24} color="#1E88E5" />
          <Text style={{ fontSize: 10, fontWeight: '600', color: '#1E88E5' }}>Làm việc</Text>
        </Pressable>
        <Pressable onPress={() => router.push('/admin/tasks')} style={{ alignItems: 'center', gap: 4 }}>
          <Ionicons name="briefcase-outline" size={24} color="#98A0A8" />
          <Text style={{ fontSize: 10, fontWeight: '500', color: '#98A0A8' }}>Giao việc</Text>
        </Pressable>
        <Pressable style={{ alignItems: 'center', gap: 4 }}>
          <Ionicons name="notifications-outline" size={24} color="#98A0A8" />
          <Text style={{ fontSize: 10, fontWeight: '500', color: '#98A0A8' }}>Thông báo</Text>
        </Pressable>
        <Pressable onPress={() => router.push(user?.roles?.includes('ADMIN') ? '/admin/profile' : '/employee/profile')} style={{ alignItems: 'center', gap: 4 }}>
          <Ionicons name="person-outline" size={24} color="#98A0A8" />
          <Text style={{ fontSize: 10, fontWeight: '500', color: '#98A0A8' }}>Tài khoản</Text>
        </Pressable>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.xl,
  },
  headerSpacer: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  userInfo: {
    alignItems: 'flex-end',
    marginRight: 4,
  },
  greetingText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '400',
  },
  userName: {
    color: colors.primaryDark,
    fontSize: 16,
    fontWeight: '700',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
  },
  notificationButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginLeft: 8,
  },
  section: {
    gap: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    color: colors.primaryDark,
    fontSize: 20,
    fontWeight: '700',
  },
  sectionLink: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  calendarScroll: {
    gap: 12,
    paddingVertical: 8,
  },
  dayItem: {
    width: 54,
    height: 72,
    borderRadius: 27,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  dayItemActive: {
    backgroundColor: 'rgba(30,136,229,0.1)',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  dayLabel: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: '500',
    marginBottom: 4,
  },
  dayLabelActive: {
    color: colors.primary,
  },
  dayDate: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '700',
  },
  dayDateActive: {
    color: colors.primary,
  },
  dayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
    marginTop: 4,
  },
  checkInCard: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  checkInTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
  },
  checkInTime: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
  checkInIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  gridItem: {
    width: '47%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconBox: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  gridLabel: {
    color: colors.primaryDark,
    fontSize: 15,
    fontWeight: '600',
  },
  badges: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 12,
  },
  badge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
});
