import React, { useState, useEffect } from 'react';
import { Modal, View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

interface CustomTimePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (hours: number, minutes: number) => void;
  initialHours?: number;
  initialMinutes?: number;
  title?: string;
}

export function CustomTimePickerModal({
  visible,
  onClose,
  onSelect,
  initialHours = 20,
  initialMinutes = 0,
  title = 'Chọn giờ',
}: CustomTimePickerModalProps) {
  const [selectedHour, setSelectedHour] = useState(initialHours);
  const [selectedMinute, setSelectedMinute] = useState(initialMinutes);

  useEffect(() => {
    if (visible) {
      setSelectedHour(initialHours);
      setSelectedMinute(initialMinutes);
    }
  }, [visible, initialHours, initialMinutes]);

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5); // Bước nhảy 5 phút

  const handleOk = () => {
    onSelect(selectedHour, selectedMinute);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.titleText}>{title}</Text>
            <Text style={styles.timeDisplay}>
              {String(selectedHour).padStart(2, '0')} : {String(selectedMinute).padStart(2, '0')}
            </Text>
          </View>

          {/* Time pickers row */}
          <View style={styles.pickerRow}>
            {/* Hour column */}
            <View style={styles.column}>
              <Text style={styles.columnLabel}>Giờ (0 - 23h)</Text>
              <ScrollView style={styles.scrollList} showsVerticalScrollIndicator={false}>
                {hours.map((h) => {
                  const isSelected = h === selectedHour;
                  return (
                    <Pressable
                      key={`hour-${h}`}
                      style={[styles.itemButton, isSelected && styles.selectedItemButton]}
                      onPress={() => setSelectedHour(h)}
                    >
                      <Text style={[styles.itemText, isSelected && styles.selectedItemText]}>
                        {String(h).padStart(2, '0')}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            <View style={styles.separator}>
              <Text style={styles.separatorText}>:</Text>
            </View>

            {/* Minute column */}
            <View style={styles.column}>
              <Text style={styles.columnLabel}>Phút</Text>
              <ScrollView style={styles.scrollList} showsVerticalScrollIndicator={false}>
                {minutes.map((m) => {
                  const isSelected = m === selectedMinute;
                  return (
                    <Pressable
                      key={`minute-${m}`}
                      style={[styles.itemButton, isSelected && styles.selectedItemButton]}
                      onPress={() => setSelectedMinute(m)}
                    >
                      <Text style={[styles.itemText, isSelected && styles.selectedItemText]}>
                        {String(m).padStart(2, '0')}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          </View>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <Pressable onPress={onClose} style={styles.footerButton}>
              <Text style={styles.cancelText}>HỦY</Text>
            </Pressable>
            <Pressable onPress={handleOk} style={[styles.footerButton, styles.okButton]}>
              <Text style={styles.okText}>XÁC NHẬN</Text>
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
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
  },
  header: {
    backgroundColor: '#111827',
    padding: 20,
    alignItems: 'center',
  },
  titleText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  timeDisplay: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    height: 220,
  },
  column: {
    flex: 1,
    alignItems: 'center',
  },
  columnLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  scrollList: {
    width: '100%',
    maxHeight: 180,
  },
  separator: {
    paddingHorizontal: 10,
    paddingTop: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  separatorText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
  },
  itemButton: {
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    marginVertical: 2,
  },
  selectedItemButton: {
    backgroundColor: '#2563EB',
  },
  itemText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  selectedItemText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 12,
  },
  footerButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  okButton: {
    backgroundColor: '#111827',
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
