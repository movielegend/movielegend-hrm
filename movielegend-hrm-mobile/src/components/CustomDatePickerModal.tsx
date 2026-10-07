import React, { useState, useEffect } from 'react';
import { Modal, View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CustomDatePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (date: Date) => void;
  initialDate?: Date;
}

const DAYS_OF_WEEK = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

export function CustomDatePickerModal({ visible, onClose, onSelect, initialDate }: CustomDatePickerModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate || new Date());
  const [viewDate, setViewDate] = useState<Date>(initialDate || new Date());

  useEffect(() => {
    if (visible) {
      const init = initialDate || new Date();
      setSelectedDate(init);
      setViewDate(init);
    }
  }, [visible, initialDate]);

  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const handleGoToday = () => {
    const today = new Date();
    setSelectedDate(today);
    setViewDate(today);
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    let day = new Date(year, month, 1).getDay();
    // Sunday=0 -> CN=6, Monday=1 -> T2=0
    return day === 0 ? 6 : day - 1;
  };

  const renderCalendar = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const days = [];

    // Empty cells before 1st of month
    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`empty-${i}`} style={styles.dayCell} />);
    }

    // Days in current month
    for (let i = 1; i <= daysInMonth; i++) {
      const isSelected =
        selectedDate.getDate() === i &&
        selectedDate.getMonth() === month &&
        selectedDate.getFullYear() === year;

      days.push(
        <Pressable
          key={`day-${i}`}
          style={[styles.dayCell, isSelected && styles.selectedDayCell]}
          onPress={() => setSelectedDate(new Date(year, month, i))}
        >
          <Text style={[styles.dayText, isSelected && styles.selectedDayText]}>{i}</Text>
        </Pressable>
      );
    }

    return days;
  };

  // Header Subtitle: "Thứ Tư, ngày 7 tháng 10, 2026"
  const formattedSubtitle = (() => {
    const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const dName = dayNames[selectedDate.getDay()];
    const d = selectedDate.getDate();
    const m = selectedDate.getMonth() + 1;
    const y = selectedDate.getFullYear();
    return `${dName}, ngày ${d} tháng ${m}, ${y}`;
  })();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdropPressable} onPress={onClose} />

        <View style={styles.bottomSheetContainer}>
          {/* Top Grabber Handle */}
          <View style={styles.grabberHandle} />

          {/* Header Row: Title & Subtitle on left, Close & Today on right */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.titleText}>Chọn ngày</Text>
              <Text style={styles.subtitleText}>{formattedSubtitle}</Text>
            </View>

            <View style={{ alignItems: 'flex-end', gap: 6 }}>
              <Pressable onPress={onClose} hitSlop={8} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color="#0F172A" />
              </Pressable>
              <Pressable onPress={handleGoToday} style={styles.todayBtn}>
                <Text style={styles.todayBtnText}>Hôm nay</Text>
              </Pressable>
            </View>
          </View>

          {/* Month Navigator: "< Tháng 10, 2026 >" */}
          <View style={styles.monthNav}>
            <Pressable onPress={handlePrevMonth} style={styles.navButton} hitSlop={8}>
              <Ionicons name="chevron-back" size={18} color="#0F172A" />
            </Pressable>
            <Text style={styles.monthText}>
              Tháng {viewDate.getMonth() + 1}, {viewDate.getFullYear()}
            </Text>
            <Pressable onPress={handleNextMonth} style={styles.navButton} hitSlop={8}>
              <Ionicons name="chevron-forward" size={18} color="#0F172A" />
            </Pressable>
          </View>

          {/* Days of Week: T2 T3 T4 T5 T6 T7 CN */}
          <View style={styles.daysOfWeekContainer}>
            {DAYS_OF_WEEK.map((day) => (
              <Text key={day} style={styles.dayOfWeekText}>
                {day}
              </Text>
            ))}
          </View>

          {/* Calendar Grid */}
          <View style={styles.calendarGrid}>{renderCalendar()}</View>

          {/* Footer Actions: [ Hủy ]  [ Áp dụng ] */}
          <View style={styles.footer}>
            <Pressable onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Hủy</Text>
            </Pressable>
            <Pressable
              onPress={() => onSelect(selectedDate)}
              style={styles.applyBtn}
              android_ripple={{ color: 'rgba(255,255,255,0.1)' }}
            >
              <Text style={styles.applyText}>Áp dụng</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  backdropPressable: {
    flex: 1,
  },
  bottomSheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 10,
    paddingBottom: 28,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 10,
  },
  grabberHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  titleText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
    letterSpacing: -0.4,
  },
  subtitleText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  closeBtn: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  todayBtn: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  todayBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#166534',
  },
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 6,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  daysOfWeekContainer: {
    flexDirection: 'row',
    marginBottom: 8,
    marginTop: 4,
  },
  dayOfWeekText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24,
    marginVertical: 2,
  },
  selectedDayCell: {
    backgroundColor: '#1B382B', // Deep forest green matching template
    shadowColor: '#1B382B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  dayText: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '600',
  },
  selectedDayText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 8,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#475569',
  },
  applyBtn: {
    flex: 1.6,
    backgroundColor: '#1B382B', // Deep forest green matching template
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1B382B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  applyText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
