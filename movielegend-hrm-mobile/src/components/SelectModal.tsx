import React from 'react';
import { Modal, StyleSheet, Text, View, Pressable, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

export interface SelectOption {
  id?: string;
  value?: string;
  label: string;
  subtitle?: string;
}

interface SelectModalProps {
  visible: boolean;
  title: string;
  options?: SelectOption[];
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
  options = [],
  selectedValue,
  onSelect,
  onClose,
  isLoading = false,
  isMulti = false,
  selectedValues = [],
  onSelectMulti,
}: SelectModalProps) {
  if (!visible) return null;

  const safeOptions = Array.isArray(options) ? options : [];

  const getOptionId = (item: SelectOption, index: number): string => {
    return String(item.id ?? item.value ?? index);
  };

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
          ) : safeOptions.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Không có dữ liệu</Text>
            </View>
          ) : (
            <FlatList
              data={safeOptions}
              keyExtractor={(item, index) => getOptionId(item, index)}
              contentContainerStyle={styles.listContainer}
              renderItem={({ item, index }) => {
                const itemId = getOptionId(item, index);
                const hasSelectedValue = selectedValue !== undefined && selectedValue !== null && selectedValue !== '';
                const isSelected = isMulti 
                  ? selectedValues.includes(itemId)
                  : (hasSelectedValue && (
                      (item.id !== undefined && item.id === selectedValue) ||
                      (item.value !== undefined && item.value === selectedValue) ||
                      itemId === selectedValue
                    ));
                
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
                        color="#102739" 
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
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '80%',
    minHeight: '40%',
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  closeBtn: {
    padding: 4,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  optionRowSelected: {
    borderColor: '#102739',
    backgroundColor: '#F5F7FA',
  },
  optionContent: {
    flex: 1,
    marginRight: 12,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  optionLabelSelected: {
    color: '#102739',
  },
  optionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 3,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  confirmBtn: {
    backgroundColor: '#102739', // Deep forest green matching template
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#102739',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
