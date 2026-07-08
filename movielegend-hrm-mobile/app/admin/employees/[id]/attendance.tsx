import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, Text, StyleSheet, Pressable, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../../../src/components/Screen';
import { useEmployee } from '../../../../src/hooks/useEmployees';

const DAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const MOCK_DAYS = Array.from({ length: 31 }, (_, i) => ({
  day: i + 1,
  status: Math.random() > 0.3 ? 'present' : 'absent', // Mock logic
}));

export default function AttendanceBoardScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const employee = useEmployee(id);

  const empName = employee.data?.profile?.fullName ?? 'Nhân viên';

  return (
    <Screen>
      {/* Custom Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </Pressable>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Bảng chấm công</Text>
          <Text style={styles.headerSubtitle}>{empName}</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        
        {/* Month Selector */}
        <View style={styles.monthSelector}>
          <Pressable style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={20} color="#111827" />
          </Pressable>
          <Text style={styles.monthText}>Tháng 7/2026</Text>
          <Pressable style={styles.iconBtn}>
            <Ionicons name="chevron-forward" size={20} color="#111827" />
          </Pressable>
        </View>

        {/* Calendar Grid */}
        <View style={styles.calendarCard}>
          <View style={styles.weekDaysRow}>
            {DAYS.map(day => (
              <Text key={day} style={styles.weekDayText}>{day}</Text>
            ))}
          </View>
          
          <View style={styles.daysGrid}>
            {/* Empty slots for spacing if month doesn't start on Sunday - hardcode 3 empty slots for mock */}
            <View style={styles.dayCell} />
            <View style={styles.dayCell} />
            <View style={styles.dayCell} />
            
            {MOCK_DAYS.map(item => (
              <View key={item.day} style={styles.dayCell}>
                <View style={styles.dayContent}>
                  <Text style={styles.dayText}>{item.day}</Text>
                  {item.status === 'present' ? (
                    <Ionicons name="checkmark-circle" size={16} color="#4F46E5" />
                  ) : (
                    <Ionicons name="close-circle-outline" size={16} color="#9CA3AF" />
                  )}
                </View>
              </View>
            ))}
          </View>

          {/* Legend */}
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <Ionicons name="checkmark-circle" size={18} color="#4F46E5" />
              <Text style={styles.legendText}>Đi làm</Text>
            </View>
            <View style={styles.legendItem}>
              <Ionicons name="close-circle-outline" size={18} color="#9CA3AF" />
              <Text style={styles.legendText}>Vắng</Text>
            </View>
          </View>
        </View>

        {/* Detail section */}
        <Text style={styles.sectionTitle}>CHI TIẾT CHẤM CÔNG</Text>
        <View style={styles.emptyDetail}>
          <Ionicons name="person-outline" size={48} color="#9CA3AF" />
          <Text style={styles.emptyDetailText}>Chưa có dữ liệu cho tháng 7/2026</Text>
        </View>

      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#4F46E5', // Indigo-600
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 4,
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: '#E0E7FF',
    fontSize: 13,
    marginTop: 2,
  },
  container: {
    padding: 16,
    paddingBottom: 40,
    backgroundColor: '#F9FAFB',
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 16,
  },
  monthText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  iconBtn: {
    padding: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  calendarCard: {
    backgroundColor: '#F9FAFB',
    marginBottom: 24,
  },
  weekDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  weekDayText: {
    width: '14%',
    textAlign: 'center',
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    padding: 2,
  },
  dayContent: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
      android: { elevation: 1 },
      web: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
    }),
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendText: {
    fontSize: 13,
    color: '#6B7280',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  emptyDetail: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyDetailText: {
    color: '#6B7280',
    fontSize: 14,
    marginTop: 12,
  },
});
