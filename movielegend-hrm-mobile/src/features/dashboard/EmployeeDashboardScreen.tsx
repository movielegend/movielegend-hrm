import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Platform, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Network from 'expo-network';
import Toast from 'react-native-toast-message';
import { useAuth } from '../../providers/AuthProvider';
import { useCurrentAttendance } from '../../hooks/useAttendance';
import { useMySchedule } from '../../hooks/useShifts';
import { useMyTasks } from '../../hooks/useTasks';
import { scheduleShiftNotifications, scheduleTaskNotifications } from '../../services/NotificationService';
import { Screen } from '../../components/Screen';
import { spacing } from '../../theme/spacing';

const { width } = Dimensions.get('window');
const GRID_ITEM_WIDTH = (width - spacing.lg * 2 - spacing.md * 2) / 3;

export function EmployeeDashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: currentAttendance } = useCurrentAttendance();
  const { data: schedule } = useMySchedule();
  const { data: myTasks } = useMyTasks({ limit: 100 });

  useEffect(() => {
    if (schedule && schedule.length > 0) {
      scheduleShiftNotifications(schedule).catch(console.error);
    }
  }, [schedule]);

  useEffect(() => {
    if (myTasks && myTasks.items && myTasks.items.length > 0) {
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

  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const fullName = user?.fullName || user?.userCode || 'Nhân viên';
  const timeString = currentDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
  const dateString = currentDate.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <Screen>
      <ScrollView 
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(fullName)}</Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.greetingText}>Xin chào,</Text>
            <Text style={styles.userName}>{fullName}</Text>
          </View>
          <View style={styles.headerRight}>
            <Pressable style={styles.iconBtn}>
              <MaterialCommunityIcons name="bell-outline" size={24} color="#111827" />
            </Pressable>
            <Pressable style={styles.iconBtn}>
              <MaterialCommunityIcons name="menu" size={26} color="#111827" />
            </Pressable>
          </View>
        </View>

        {/* Time Card */}
        <View style={styles.timeCard}>
          <View style={styles.timeCardHeader}>
            <MaterialCommunityIcons name="clock-outline" size={18} color="#6B7280" />
            <Text style={styles.timeCardTitle}>Thời gian hiện tại</Text>
          </View>
          <Text style={styles.timeValue}>{timeString}</Text>
          <Text style={styles.dateText}>{dateString}</Text>
          
          <View style={styles.timeCardPattern}>
            <View style={styles.circle1} />
            <View style={styles.circle2} />
            <View style={styles.circle3} />
          </View>
        </View>

        {/* Check-in Button */}
        <Pressable
          style={[styles.checkInBtn, currentAttendance?.state === 'CHECKED_IN' && { backgroundColor: '#F59E0B' }]}
          onPress={async () => {
            try {
              const ip = await Network.getIpAddressAsync();
              // Validate that the IP belongs to the company's local network (192.168.28.x)
              if (!ip || !ip.startsWith('192.168.28.')) {
                Toast.show({
                  type: 'error',
                  text1: 'Lỗi mạng',
                  text2: 'Vui lòng kết nối Wifi công ty để chấm công!',
                });
                return;
              }
              if (currentAttendance?.state === 'CHECKED_IN') {
                router.push('/employee/attendance/check-out');
              } else {
                router.push('/employee/attendance/check-in');
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
          <MaterialCommunityIcons name="line-scan" size={24} color="#FFFFFF" />
          <Text style={styles.checkInBtnText}>
            {currentAttendance?.state === 'CHECKED_IN' ? 'Kết thúc ca làm (Ra ca)' : 'Chấm công ngay (Vào ca)'}
          </Text>
        </Pressable>

        {/* Tiện ích (Grid) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tiện ích</Text>
          <View style={styles.gridContainer}>
            <GridItem 
              icon="calendar-clock" 
              title="Ca làm việc" 
              onPress={() => router.push('/employee/schedule')} 
            />
            <GridItem 
              icon="format-list-checks" 
              title="Công việc" 
              badge={myTasks?.items?.length ? String(myTasks.items.length) : undefined}
              onPress={() => router.push('/employee/tasks')} 
            />
            <GridItem 
              icon="file-document-edit-outline" 
              title="Đơn từ" 
              onPress={() => router.push('/employee/requests')} 
            />
            <GridItem 
              icon="cash-multiple" 
              title="Lương thưởng" 
              onPress={() => router.push('/employee/payroll')} 
            />
            <GridItem 
              icon="text-box-check-outline" 
              title="Hợp đồng" 
              onPress={() => router.push('/employee/contracts')} 
            />
            <GridItem 
              icon="laptop" 
              title="Tài sản" 
              onPress={() => router.push('/employee/assets')} 
            />
          </View>
        </View>

        {/* Công việc của tôi */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Công việc của tôi</Text>
          <View style={styles.tasksContainer}>
            {myTasks?.items && myTasks.items.length > 0 ? (
              myTasks.items.slice(0, 3).map((task) => (
                <TaskCard 
                  key={task.id}
                  title={task.title}
                  priority={task.priority === 'HIGH' ? 'Cao' : task.priority === 'MEDIUM' ? 'Trung bình' : 'Thấp'}
                  priorityColor={task.priority === 'HIGH' ? '#EF4444' : task.priority === 'MEDIUM' ? '#F59E0B' : '#10B981'}
                  dueDate={new Date(task.dueDate).toLocaleDateString('vi-VN')}
                />
              ))
            ) : (
              <TaskCard 
                title="Cập nhật báo cáo tiến độ tuần"
                priority="Trung bình"
                priorityColor="#F59E0B"
                dueDate="Ngày mai"
              />
            )}
          </View>
        </View>

      </ScrollView>
    </Screen>
  );
}

function GridItem({ icon, title, onPress, color, badge }: any) {
  return (
    <Pressable style={styles.gridItem} onPress={onPress}>
      <View style={styles.gridIconContainer}>
        <MaterialCommunityIcons name={icon} size={28} color="#111827" />
        {badge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}
      </View>
      <Text style={styles.gridTitle}>{title}</Text>
    </Pressable>
  );
}

function TaskCard({ title, priority, priorityColor, dueDate }: any) {
  return (
    <View style={styles.taskCard}>
      <View style={styles.taskHeader}>
        <Text style={styles.taskTitle} numberOfLines={1}>{title}</Text>
      </View>
      <View style={styles.taskFooter}>
        <View style={styles.taskMeta}>
          <MaterialCommunityIcons name="calendar-clock" size={16} color="#6B7280" />
          <Text style={styles.taskDueDate}>{dueDate}</Text>
        </View>
        <View style={[styles.priorityBadge, { backgroundColor: priorityColor + '15' }]}>
          <View style={[styles.priorityDot, { backgroundColor: priorityColor }]} />
          <Text style={[styles.priorityText, { color: priorityColor }]}>{priority}</Text>
        </View>
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
    alignItems: 'center',
    marginBottom: spacing.xl,
    marginTop: spacing.md,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  headerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  greetingText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    overflow: 'hidden',
  },
  timeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.md,
  },
  timeCardTitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  timeValue: {
    fontSize: 48,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -1,
    marginBottom: 4,
  },
  dateText: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
  },
  timeCardPattern: {
    position: 'absolute',
    right: -40,
    bottom: -40,
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  circle2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  circle3: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  checkInBtn: {
    backgroundColor: '#000000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    marginBottom: spacing.xl,
    gap: 12,
  },
  checkInBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: spacing.md,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  gridItem: {
    width: GRID_ITEM_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
    aspectRatio: 1,
  },
  gridIconContainer: {
    marginBottom: spacing.sm,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  gridTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  tasksContainer: {
    gap: spacing.md,
  },
  taskCard: {
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
  },
  taskHeader: {
    marginBottom: spacing.sm,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  taskFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
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
  }
});
