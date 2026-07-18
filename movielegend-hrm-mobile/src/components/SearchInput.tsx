import { useState } from 'react';
import { StyleSheet, TextInput, View, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

interface SearchInputProps {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
}

export function SearchInput({ value, onChangeText, placeholder = 'Tìm kiếm' }: SearchInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, isFocused && styles.containerFocused]}>
      <MaterialCommunityIcons name="magnify" size={20} color={isFocused ? '#111827' : '#9CA3AF'} style={styles.icon} />
      <TextInput 
        accessibilityLabel={placeholder} 
        onChangeText={onChangeText} 
        placeholder={placeholder} 
        placeholderTextColor="#9CA3AF"
        style={styles.input} 
        value={value} 
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
    borderRadius: 26,
    borderWidth: 1,
    minHeight: 52,
    paddingHorizontal: 16,
  },
  containerFocused: {
    borderColor: '#111827',
    backgroundColor: '#FFFFFF',
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: '#111827',
    fontSize: 16,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
  },
});
