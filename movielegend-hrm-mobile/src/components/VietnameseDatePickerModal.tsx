import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';

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

  const parseDate = (d?: string): Date => {
    if (d && /^\d{4}-\d{2}-\d{2}$/.test(d)) {
      const parts = d.split('-').map(Number);
      const y = parts[0];
      const m = parts[1];
      const day = parts[2];
      if (y !== undefined && m !== undefined && day !== undefined && !isNaN(y) && !isNaN(m) && !isNaN(day)) {
        return new Date(y, m - 1, day);
      }
    }
    return new Date(2000, 0, 1);
  };

  const [selectedDate, setSelectedDate] = useState<Date>(() => parseDate(initialDate));

  useEffect(() => {
    if (visible) {
      const parsed = parseDate(initialDate);
      setSelectedDate(parsed);

      // On Android: Open native dialog immediately
      if (Platform.OS === 'android') {
        try {
          DateTimePickerAndroid.open({
            value: parsed,
            mode: 'date',
            display: 'default',
            maximumDate: new Date(),
            minimumDate: new Date(minYear, 0, 1),
            onChange: (event, date) => {
              onClose();
              if (event.type === 'set' && date) {
                const y = date.getFullYear();
                const m = String(date.getMonth() + 1).padStart(2, '0');
                const d = String(date.getDate()).padStart(2, '0');
                onSelect(`${y}-${m}-${d}`);
              }
            },
          });
        } catch (err) {
          console.warn('Native Android DateTimePicker error:', err);
        }
      }
    }
  }, [visible, initialDate]);

  if (Platform.OS === 'android') {
    return null;
  }

  const age = currentYear - selectedDate.getFullYear();
  const dayStr = String(selectedDate.getDate()).padStart(2, '0');
  const monthStr = String(selectedDate.getMonth() + 1).padStart(2, '0');
  const formattedDisplay = `${dayStr}/${monthStr}/${selectedDate.getFullYear()}`;

  const handleConfirm = () => {
    const y = selectedDate.getFullYear();
    const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const d = String(selectedDate.getDate()).padStart(2, '0');
    onSelect(`${y}-${m}-${d}`);
    onClose();
  };

  const handleQuickYear = (yr: number) => {
    const next = new Date(selectedDate);
    next.setFullYear(yr);
    setSelectedDate(next);
  };

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

          {/* Native Cupertino Wheel Picker for iOS */}
          <View style={styles.pickerWrapper}>
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="spinner"
              themeVariant="light"
              textColor="#0F172A"
              locale="vi-VN"
              maximumDate={new Date()}
              minimumDate={new Date(minYear, 0, 1)}
              onChange={(_, date) => {
                if (date) setSelectedDate(date);
              }}
              style={styles.datePicker}
            />
          </View>

          {/* Quick Year Shortcuts */}
          <View style={styles.quickShortcuts}>
            <Text style={styles.shortcutLabel}>Nhanh:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {[2006, 2004, 2002, 2000, 1998, 1995, 1990].map((yr) => (
                <Pressable
                  key={`quick-${yr}`}
                  onPress={() => handleQuickYear(yr)}
                  style={[
                    styles.shortcutPill,
                    selectedDate.getFullYear() === yr && styles.shortcutPillActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.shortcutPillText,
                      selectedDate.getFullYear() === yr && styles.shortcutPillTextActive,
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
  pickerWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    paddingVertical: 6,
  },
  datePicker: {
    height: 190,
    width: '100%',
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
