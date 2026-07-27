import React, { useState, useEffect } from 'react';
import { Modal, View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

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
      setSelectedDate(initialDate || new Date());
      setViewDate(initialDate || new Date());
    }
  }, [visible, initialDate]);

  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    let day = new Date(year, month, 1).getDay();
    // Convert Sunday=0 to CN=6, Monday=1 to T2=0, etc.
    return day === 0 ? 6 : day - 1;
  };

  const renderCalendar = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const days = [];
    
    // Empty cells before the 1st of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`empty-${i}`} style={styles.dayCell} />);
    }

    // Days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      const isSelected = selectedDate.getDate() === i && selectedDate.getMonth() === month && selectedDate.getFullYear() === year;

      days.push(
        <Pressable
          key={`day-${i}`}
          style={[styles.dayCell, isSelected && styles.selectedDayCell]}
          onPress={() => setSelectedDate(date)}
        >
          <Text style={[styles.dayText, isSelected && styles.selectedDayText]}>{i}</Text>
        </Pressable>
      );
    }

    return days;
  };

  const formatHeaderDate = (date: Date) => {
    const dayOfWeek = date.getDay();
    const dayNames = ['CN', 'Th 2', 'Th 3', 'Th 4', 'Th 5', 'Th 6', 'Th 7'];
    return `${dayNames[dayOfWeek]}, ${date.getDate()} thg ${date.getMonth() + 1}`;
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.yearText}>{selectedDate.getFullYear()}</Text>
            <Text style={styles.dateText}>{formatHeaderDate(selectedDate)}</Text>
          </View>

          {/* Month Navigation */}
          <View style={styles.monthNav}>
            <Pressable onPress={handlePrevMonth} style={styles.navButton}>
              <Ionicons name="chevron-back" size={20} color="#111827" />
            </Pressable>
            <Text style={styles.monthText}>
              Tháng {viewDate.getMonth() + 1} năm {viewDate.getFullYear()}
            </Text>
            <Pressable onPress={handleNextMonth} style={styles.navButton}>
              <Ionicons name="chevron-forward" size={20} color="#111827" />
            </Pressable>
          </View>

          {/* Days of Week */}
          <View style={styles.daysOfWeekContainer}>
            {DAYS_OF_WEEK.map((day) => (
              <Text key={day} style={styles.dayOfWeekText}>
                {day}
              </Text>
            ))}
          </View>

          {/* Calendar Grid */}
          <View style={styles.calendarGrid}>
            {renderCalendar()}
          </View>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <Pressable onPress={onClose} style={styles.footerButton}>
              <Text style={styles.cancelText}>HỦY</Text>
            </Pressable>
            <Pressable onPress={() => onSelect(selectedDate)} style={[styles.footerButton, { backgroundColor: '#111827' }]}>
              <Text style={styles.okText}>OK</Text>
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
    backgroundColor: 'rgba(17, 24, 39, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  header: {
    backgroundColor: '#111827',
    padding: 24,
  },
  yearText: {
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: 4,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  dateText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  daysOfWeekContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
    marginTop: 4,
  },
  dayOfWeekText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    marginVertical: 2,
  },
  selectedDayCell: {
    backgroundColor: '#111827',
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  dayText: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '600',
  },
  selectedDayText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 12,
  },
  footerButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
  },
  cancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4B5563',
  },
  okText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
