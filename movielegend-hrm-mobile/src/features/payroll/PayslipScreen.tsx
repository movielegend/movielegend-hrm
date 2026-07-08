import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export function PayslipScreen() {
  const router = useRouter();

  // State for current month/year
  const [currentDate, setCurrentDate] = useState(() => {
    // We can default to Feb 2026 as in the mockup, or actual current date.
    // Let's use the actual current date for a realistic feel, but initial as mockup
    return new Date(2026, 1, 1); // 1 = February
  });

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-11
  
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month); // 0 (Sun) to 6 (Sat)

  // Generate blank cells for days before the 1st of the month
  const blanks = Array.from({ length: firstDay }, (_, i) => i);
  // Generate actual days
  const actualDays = Array.from({ length: daysInMonth }, (_, i) => ({
    date: i + 1,
    // Just pseudo-random mock status based on the date
    status: (i % 7 === 0 || i % 6 === 0) ? 'absent' : 'present', 
  }));

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Tạm tính lương */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="wallet-outline" size={20} color="#4F46E5" />
            <Text style={styles.cardTitle}>Tạm tính lương</Text>
          </View>
          <View style={styles.salaryAmountContainer}>
            <Text style={styles.salaryAmount}>0</Text>
            <Text style={styles.salaryCurrency}>VNĐ</Text>
          </View>
        </View>

        {/* Thông tin công */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Thông tin công</Text>
          
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Công chuẩn</Text>
            <Text style={styles.rowValueBlack}>26 công</Text>
          </View>
          <View style={styles.divider} />
          
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Ngày đi làm thực tế</Text>
            <Text style={styles.rowValueBlack}>0 công</Text>
          </View>
          <View style={styles.divider} />
          
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Ngày nghỉ ngoài quy định</Text>
            <Text style={styles.rowValueRed}>0 ngày</Text>
          </View>
          <View style={styles.divider} />
          
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Số phút đi trễ</Text>
            <Text style={styles.rowValueRed}>0 phút</Text>
          </View>
          <View style={styles.divider} />
          
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Số giờ tăng ca</Text>
            <Text style={styles.rowValueGreen}>0 giờ</Text>
          </View>
        </View>

        {/* Thành tiền */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Thành tiền</Text>
          
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Lương cứng</Text>
            <Text style={styles.rowValueBlack}>0đ</Text>
          </View>
          <View style={styles.divider} />
          
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Phụ cấp</Text>
            <Text style={styles.rowValueGreen}>0đ</Text>
          </View>
          <View style={styles.divider} />
          
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Tăng ca</Text>
            <Text style={styles.rowValueGreen}>0đ</Text>
          </View>
          
          {/* Faint divider for penalty section */}
          <View style={[styles.divider, { marginVertical: 16 }]} />
          
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Phạt đi trễ</Text>
            <Text style={styles.rowValueRed}>-0đ</Text>
          </View>
        </View>

        {/* Phân ca làm */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Phân ca làm</Text>
          <View style={styles.emptyStateBox}>
            <Text style={styles.emptyStateText}>Chưa có phân ca cho tháng này</Text>
          </View>
        </View>

        {/* Bảng chấm công (Month Selector) */}
        <View style={styles.monthSelectorCard}>
          <Pressable style={styles.monthNavBtn} onPress={handlePrevMonth}>
            <Ionicons name="chevron-back" size={20} color="#1E293B" />
          </Pressable>
          <Text style={styles.monthSelectorText}>Tháng {month + 1}/{year}</Text>
          <Pressable style={[styles.monthNavBtn, { backgroundColor: '#F1F5F9' }]} onPress={handleNextMonth}>
            <Ionicons name="chevron-forward" size={20} color="#1E293B" />
          </Pressable>
        </View>

        {/* Bảng chấm công Grid */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Bảng chấm công</Text>
          
          {/* Weekday headers */}
          <View style={styles.calendarHeader}>
            {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((day) => (
              <Text key={day} style={styles.weekdayText}>{day}</Text>
            ))}
          </View>

          {/* Grid */}
          <View style={styles.calendarGrid}>
            {/* Render blank spaces to align with correct day of week */}
            {blanks.map(blank => (
              <View key={`blank-${blank}`} style={[styles.dayCell, { borderWidth: 0, backgroundColor: 'transparent' }]} />
            ))}
            {/* Render actual days */}
            {actualDays.map((day) => (
              <View key={day.date} style={styles.dayCell}>
                <Text style={styles.dayText}>{day.date}</Text>
                {day.status === 'absent' ? (
                  <View style={styles.statusCircle}>
                    <Ionicons name="close" size={10} color="#94A3B8" />
                  </View>
                ) : (
                  <View style={styles.legendIconBlue}>
                    <Ionicons name="checkmark" size={10} color="#3B82F6" />
                  </View>
                )}
              </View>
            ))}
          </View>

          {/* Legend */}
          <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
              <View style={styles.legendIconBlue}>
                <Ionicons name="checkmark" size={10} color="#3B82F6" />
              </View>
              <Text style={styles.legendText}>Đi làm</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={styles.statusCircle}>
                <Ionicons name="close" size={10} color="#94A3B8" />
              </View>
              <Text style={styles.legendText}>Vắng</Text>
            </View>
          </View>

          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Chi tiết chấm công</Text>
          
          <View style={styles.emptyDataBox}>
            <Text style={styles.emptyDataText}>Chưa có dữ liệu cho tháng</Text>
            <Text style={styles.emptyDataText}>2/2026</Text>
          </View>
        </View>

        {/* Footer info */}
        <Text style={styles.footerNote}>
          Số liệu trên là tạm tính. Lương thực tế sẽ được chốt vào cuối tháng.
        </Text>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6', // Same background color as Profile screen for consistency
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9', // light border from image
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
      web: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4F46E5', // Matches the wallet icon color in the first card
    marginLeft: 8,
  },
  salaryAmountContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  salaryAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: '#4338CA', // Darker blue/purple
  },
  salaryCurrency: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4B5563', // Slate-600
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827', // Black
    marginBottom: 16,
  },
  
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  rowLabel: {
    fontSize: 14,
    color: '#6B7280', // Gray
  },
  rowValueBlack: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  rowValueRed: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EF4444',
  },
  rowValueGreen: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10B981',
  },
  divider: {
    height: 1,
    backgroundColor: '#F8FAFC', // Very faint separator line
    marginVertical: 10,
  },

  emptyStateBox: {
    backgroundColor: '#F1F5F9', // light gray background
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    color: '#64748B',
    fontSize: 14,
  },

  monthSelectorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  monthNavBtn: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthSelectorText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },

  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  weekdayText: {
    width: 40,
    textAlign: 'center',
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  dayCell: {
    width: 40,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0', // soft border around the day cell
    backgroundColor: '#FFFFFF',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  statusCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    gap: 24,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendIconBlue: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendText: {
    fontSize: 13,
    color: '#64748B',
  },

  emptyDataBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  emptyDataText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
  
  footerNote: {
    textAlign: 'center',
    fontSize: 13,
    color: '#64748B',
    marginTop: 8,
    paddingHorizontal: 24,
    lineHeight: 20,
  }
});
