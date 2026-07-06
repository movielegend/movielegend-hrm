import { StyleSheet, TextInput } from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

interface SearchInputProps {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
}

export function SearchInput({ value, onChangeText, placeholder = 'Tìm kiếm' }: SearchInputProps) {
  return <TextInput accessibilityLabel={placeholder} onChangeText={onChangeText} placeholder={placeholder} style={styles.input} value={value} />;
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.text,
    fontSize: 15,
    minHeight: 44,
    paddingHorizontal: spacing.md,
  },
});
