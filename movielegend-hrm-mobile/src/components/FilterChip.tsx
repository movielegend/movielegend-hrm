import { Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

interface FilterChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

export function FilterChip({ label, selected, onPress }: FilterChipProps) {
  return (
    <Pressable accessibilityLabel={label} accessibilityRole="button" onPress={onPress} style={[styles.chip, selected && styles.selected]}>
      <Text style={[styles.text, selected && styles.selectedText]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderColor: '#E5E7EB',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  selected: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  selectedText: {
    color: '#FFFFFF',
  },
  text: {
    color: '#4B5563',
    fontSize: 13,
    fontWeight: '500',
  },
});
