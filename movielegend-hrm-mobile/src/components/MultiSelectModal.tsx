import React from 'react';
import { Modal, StyleSheet, Text, View, Pressable, FlatList, SafeAreaView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

export interface MultiSelectOption {
  id: string;
  label: string;
  subtitle?: string;
}

interface MultiSelectModalProps {
  visible: boolean;
  title: string;
  options: MultiSelectOption[];
  selectedValues?: string[];
  onSelect: (selectedIds: string[]) => void;
  onClose: () => void;
  isLoading?: boolean;
}

export function MultiSelectModal({
  visible,
  title,
  options,
  selectedValues = [],
  onSelect,
  onClose,
  isLoading = false,
}: MultiSelectModalProps) {
  const [localSelected, setLocalSelected] = React.useState<Set<string>>(new Set(selectedValues));

  React.useEffect(() => {
    if (visible) {
      setLocalSelected(new Set(selectedValues));
    }
  }, [visible, selectedValues]);

  const toggleSelect = (id: string) => {
    const next = new Set(localSelected);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setLocalSelected(next);
  };

  const handleDone = () => {
    onSelect(Array.from(localSelected));
    onClose();
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
                const isSelected = localSelected.has(item.id);
                return (
                  <Pressable
                    style={[styles.optionRow, isSelected && styles.optionRowSelected]}
                    onPress={() => toggleSelect(item.id)}
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
                      <MaterialCommunityIcons name="checkbox-marked" size={24} color={colors.primary} />
                    ) : (
                      <MaterialCommunityIcons name="checkbox-blank-outline" size={24} color={colors.border} />
                    )}
                  </Pressable>
                );
              }}
            />
          )}
          <View style={styles.footer}>
            <Pressable style={styles.doneBtn} onPress={handleDone}>
              <Text style={styles.doneBtnText}>Xong</Text>
            </Pressable>
          </View>
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
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
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
    color: colors.primaryDark,
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
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  doneBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
