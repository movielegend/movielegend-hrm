import React from 'react';
import { Modal, StyleSheet, Text, View, Pressable, FlatList, SafeAreaView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

export interface SelectOption {
  id: string;
  label: string;
  subtitle?: string;
}

interface SelectModalProps {
  visible: boolean;
  title: string;
  options: SelectOption[];
  selectedValue?: string | null | undefined;
  onSelect?: (option: SelectOption) => void;
  onClose: () => void;
  isLoading?: boolean;
  isMulti?: boolean;
  selectedValues?: string[];
  onSelectMulti?: (option: SelectOption) => void;
}

export function SelectModal({
  visible,
  title,
  options,
  selectedValue,
  onSelect,
  onClose,
  isLoading = false,
  isMulti = false,
  selectedValues = [],
  onSelectMulti,
}: SelectModalProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>

          {isLoading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Đang tải dữ liệu...</Text>
            </View>
          ) : options.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Không có dữ liệu</Text>
            </View>
          ) : (
            <FlatList
              data={options}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContainer}
              renderItem={({ item }) => {
                const isSelected = isMulti 
                  ? selectedValues.includes(item.id)
                  : item.id === selectedValue;
                
                return (
                  <Pressable
                    style={[styles.optionRow, isSelected && styles.optionRowSelected]}
                    onPress={() => {
                      if (isMulti && onSelectMulti) {
                        onSelectMulti(item);
                      } else if (onSelect) {
                        onSelect(item);
                        onClose();
                      }
                    }}
                  >
                    <View style={styles.optionContent}>
                      <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                        {item.label}
                      </Text>
                      {item.subtitle ? (
                        <Text style={styles.optionSubtitle}>{item.subtitle}</Text>
                      ) : null}
                    </View>
                    {isSelected ? (
                      <MaterialCommunityIcons 
                        name={isMulti ? "checkbox-marked" : "radiobox-marked"} 
                        size={24} 
                        color="#111827" 
                      />
                    ) : (
                      <MaterialCommunityIcons 
                        name={isMulti ? "checkbox-blank-outline" : "radiobox-blank"} 
                        size={24} 
                        color="#E5E7EB" 
                      />
                    )}
                  </Pressable>
                );
              }}
            />
          )}

          {isMulti && !isLoading && options.length > 0 && (
            <View style={styles.footer}>
              <Pressable style={styles.confirmBtn} onPress={onClose}>
                <Text style={styles.confirmBtnText}>Xác nhận</Text>
              </Pressable>
            </View>
          )}
          <SafeAreaView />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    minHeight: '40%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  closeBtn: {
    padding: spacing.xs,
  },
  listContainer: {
    padding: spacing.md,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  optionRowSelected: {
    borderColor: '#111827',
    backgroundColor: '#F3F4F6',
  },
  optionContent: {
    flex: 1,
    marginRight: spacing.md,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  optionLabelSelected: {
    color: '#111827',
  },
  optionSubtitle: {
    fontSize: 13,
    color: colors.muted,
    marginTop: 4,
  },
  emptyState: {
    padding: spacing.xxl,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.muted,
    fontSize: 15,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  confirmBtn: {
    backgroundColor: '#111827',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  confirmBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
