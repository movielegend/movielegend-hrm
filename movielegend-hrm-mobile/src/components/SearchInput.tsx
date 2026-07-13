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
    backgroundColor: '#fff',
    borderColor: '#E5E7EB',
    borderRadius: 24,
    borderWidth: 1,
    color: '#111827',
    fontSize: 15,
    minHeight: 48,
    paddingHorizontal: 20,
  },
});
