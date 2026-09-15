import React, { useState, useEffect, useRef } from 'react';
import { Modal, View, Text, Pressable, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface VietnameseDatePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (dateStr: string) => void; // Returns 'YYYY-MM-DD'
  initialDate?: string; // Expects 'YYYY-MM-DD'
  title?: string;
  minYear?: number;
  maxYear?: number;
}

export function VietnameseDatePickerModal({
  visible,
  onClose,
  onSelect,
  initialDate,
  title = 'Chọn ngày sinh',
  minYear = 1950,
  maxYear = new Date().getFullYear(),
}: VietnameseDatePickerModalProps) {
  const currentYear = new Date().getFullYear();

  // Parse initial date or default to 2000-01-01
  const parseDate = (d?: string): { year: number; month: number; day: number } => {
    if (d && /^\d{4}-\d{2}-\d{2}$/.test(d)) {
      const parts = d.split('-').map(Number);
      const y = parts[0];
      const m = parts[1];
      const day = parts[2];
      if (y !== undefined && m !== undefined && day !== undefined && !isNaN(y) && !isNaN(m) && !isNaN(day)) {
        return { year: y, month: m, day };
      }
    }
    return { year: 2000, month: 1, day: 1 };
  };

  const initial = parseDate(initialDate);
  const [selectedYear, setSelectedYear] = useState<number>(initial.year);
  const [selectedMonth, setSelectedMonth] = useState<number>(initial.month);
  const [selectedDay, setSelectedDay] = useState<number>(initial.day);

  const dayScrollRef = useRef<ScrollView>(null);
  const monthScrollRef = useRef<ScrollView>(null);
  const yearScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (visible) {
      const parsed = parseDate(initialDate);
      setSelectedYear(parsed.year);
      setSelectedMonth(parsed.month);
      setSelectedDay(parsed.day);

      // Timeout for smooth auto-scroll to selected index
      setTimeout(() => {
        const itemHeight = 44;
        dayScrollRef.current?.scrollTo({ y: (parsed.day - 1) * itemHeight, animated: false });
        monthScrollRef.current?.scrollTo({ y: (parsed.month - 1) * itemHeight, animated: false });
        const yearIndex = maxYear - parsed.year;
        yearScrollRef.current?.scrollTo({ y: Math.max(0, yearIndex * itemHeight), animated: false });
      }, 100);
    }
  }, [visible, initialDate]);

  // Days in selected month/year
  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();

  // Clamp day if days in month changed (e.g. Feb 31 -> Feb 28/29)
  useEffect(() => {
    if (selectedDay > daysInMonth) {
      setSelectedDay(daysInMonth);
    }
  }, [selectedMonth, selectedYear, daysInMonth, selectedDay]);

  const daysList = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const monthsList = Array.from({ length: 12 }, (_, i) => i + 1);
  const yearsList = Array.from({ length: maxYear - minYear + 1 }, (_, i) => maxYear - i);

  const age = currentYear - selectedYear;

  const handleConfirm = () => {
    const formattedMonth = String(selectedMonth).padStart(2, '0');
    const formattedDay = String(selectedDay).padStart(2, '0');
    onSelect(`${selectedYear}-${formattedMonth}-${formattedDay}`);
    onClose();
  };

  const formattedDisplay = `${String(selectedDay).padStart(2, '0')}/${String(selectedMonth).padStart(2, '0')}/${selectedYear}`;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={onClose} hitSlop={12} style={styles.headerBtn}>
              <Text style={styles.cancelText}>Hủy</Text>
            </Pressable>
            <Text style={styles.headerTitle}>{title}</Text>
            <Pressable onPress={handleConfirm} hitSlop={12} style={[styles.headerBtn, styles.confirmBtn]}>
              <Text style={styles.confirmText}>Xác nhận</Text>
            </Pressable>
          </View>

          {/* Selected Date Preview Bar */}
          <View style={styles.previewBar}>
            <View style={styles.previewDateBadge}>
              <Ionicons name="calendar" size={18} color="#0F172A" />
              <Text style={styles.previewDateText}>{formattedDisplay}</Text>
            </View>
            {age >= 0 ? (
              <View style={styles.previewAgeBadge}>
                <Text style={styles.previewAgeText}>{age} tuổi</Text>
              </View>
            ) : null}
          </View>

          {/* Column Titles */}
          <View style={styles.columnHeaders}>
            <View style={styles.columnHeaderCell}>
              <Text style={styles.columnHeaderText}>NGÀY</Text>
            </View>
            <View style={styles.columnHeaderCell}>
              <Text style={styles.columnHeaderText}>THÁNG</Text>
            </View>
            <View style={styles.columnHeaderCell}>
              <Text style={styles.columnHeaderText}>NĂM</Text>
            </View>
          </View>

          {/* 3 Columns Picker */}
          <View style={styles.pickerBody}>
            {/* Days Column */}
            <View style={styles.columnWrapper}>
              <ScrollView
                ref={dayScrollRef}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
              >
                {daysList.map((day) => {
                  const isSelected = day === selectedDay;
                  return (
                    <Pressable
                      key={`day-${day}`}
                      onPress={() => setSelectedDay(day)}
                      style={[styles.itemRow, isSelected && styles.selectedItemRow]}
                    >
                      <Text style={[styles.itemText, isSelected && styles.selectedItemText]}>
                        Ngày {day}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* Months Column */}
            <View style={styles.columnWrapper}>
              <ScrollView
                ref={monthScrollRef}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
              >
                {monthsList.map((month) => {
                  const isSelected = month === selectedMonth;
                  return (
                    <Pressable
                      key={`month-${month}`}
                      onPress={() => setSelectedMonth(month)}
                      style={[styles.itemRow, isSelected && styles.selectedItemRow]}
                    >
                      <Text style={[styles.itemText, isSelected && styles.selectedItemText]}>
                        Tháng {month}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* Years Column */}
            <View style={styles.columnWrapper}>
              <ScrollView
                ref={yearScrollRef}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
              >
                {yearsList.map((year) => {
                  const isSelected = year === selectedYear;
                  return (
                    <Pressable
                      key={`year-${year}`}
                      onPress={() => setSelectedYear(year)}
                      style={[styles.itemRow, isSelected && styles.selectedItemRow]}
                    >
                      <Text style={[styles.itemText, isSelected && styles.selectedItemText]}>
                        {year}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          </View>

          {/* Quick Year Shortcuts */}
          <View style={styles.quickShortcuts}>
            <Text style={styles.shortcutLabel}>Nhanh:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {[2006, 2004, 2002, 2000, 1998, 1995, 1990].map((yr) => (
                <Pressable
                  key={`quick-${yr}`}
                  onPress={() => {
                    setSelectedYear(yr);
                    const yearIndex = maxYear - yr;
                    yearScrollRef.current?.scrollTo({ y: Math.max(0, yearIndex * 44), animated: true });
                  }}
                  style={[
                    styles.shortcutPill,
                    selectedYear === yr && styles.shortcutPillActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.shortcutPillText,
                      selectedYear === yr && styles.shortcutPillTextActive,
                    ]}
                  >
                    {yr}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 16,
    paddingBottom: 36,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  confirmBtn: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  confirmText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  previewBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 14,
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  previewDateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  previewDateText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  previewAgeBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  previewAgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4338CA',
  },
  columnHeaders: {
    flexDirection: 'row',
    marginTop: 6,
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  columnHeaderCell: {
    flex: 1,
    alignItems: 'center',
  },
  columnHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1,
  },
  pickerBody: {
    flexDirection: 'row',
    height: 220,
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  columnWrapper: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  scrollContent: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  itemRow: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    marginVertical: 2,
  },
  selectedItemRow: {
    backgroundColor: '#0F172A',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  itemText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#475569',
  },
  selectedItemText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  quickShortcuts: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    paddingHorizontal: 4,
    gap: 8,
  },
  shortcutLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  shortcutPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  shortcutPillActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  shortcutPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  shortcutPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
