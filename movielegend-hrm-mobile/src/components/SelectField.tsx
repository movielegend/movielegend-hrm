import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, Platform, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

export interface SelectOption {
  label: string;
  value: string;
}

interface SelectFieldProps {
  label: string;
  options: SelectOption[];
  value: string;
  onSelect: (value: string) => void;
  error?: string;
  placeholder?: string;
}

export function SelectField({ label, options, value, onSelect, error, placeholder = 'Chọn...' }: SelectFieldProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const selectedOption = options.find((o) => o.value === value);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Pressable 
        style={[styles.input, error && styles.inputError]} 
        onPress={() => setModalVisible(true)}
      >
        <Text style={[styles.inputText, !selectedOption && styles.placeholderText]}>
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        <Ionicons name="chevron-down" size={20} color={colors.muted} />
      </Pressable>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Modal visible={modalVisible} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{label}</Text>
                  <Pressable onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                    <Ionicons name="close" size={24} color={colors.text} />
                  </Pressable>
                </View>
                <ScrollView style={styles.scrollView}>
                  {options.length === 0 ? (
                    <Text style={styles.emptyText}>Không có dữ liệu</Text>
                  ) : (
                    options.map((opt) => (
                      <Pressable
                        key={opt.value}
                        style={[styles.optionRow, value === opt.value && styles.optionSelected]}
                        onPress={() => {
                          onSelect(opt.value);
                          setModalVisible(false);
                        }}
                      >
                        <Text style={[styles.optionText, value === opt.value && styles.optionTextSelected]}>
                          {opt.label}
                        </Text>
                        {value === opt.value && (
                          <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                        )}
                      </Pressable>
                    ))
                  )}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputError: {
    borderColor: colors.danger,
  },
  inputText: {
    color: colors.text,
    fontSize: 15,
  },
  placeholderText: {
    color: colors.muted,
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  closeBtn: {
    padding: 4,
  },
  scrollView: {
    padding: 16,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  optionSelected: {
    backgroundColor: '#F8FAFF',
  },
  optionText: {
    fontSize: 16,
    color: colors.text,
  },
  optionTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: colors.muted,
    marginTop: 32,
  }
});
