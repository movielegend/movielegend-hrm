import { useState } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View, Platform } from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

interface FormFieldProps extends TextInputProps {
  label: string;
  error?: string | undefined;
  rightLabelElement?: React.ReactNode;
}

export function FormField({ label, error, style, rightLabelElement, ...inputProps }: FormFieldProps) {
  const [isFocused, setIsFocused] = useState(false);
  return (
    <View style={styles.field}>
      <View style={styles.labelContainer}>
        <Text style={styles.label}>{label}</Text>
        {rightLabelElement}
      </View>
      <TextInput 
        {...inputProps} 
        accessibilityLabel={label} 
        onFocus={(e) => {
          setIsFocused(true);
          inputProps.onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          inputProps.onBlur?.(e);
        }}
        style={[
          styles.input, 
          isFocused && styles.inputFocused,
          error ? styles.inputError : null,
          style
        ]} 
        placeholderTextColor="#9CA3AF"
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  error: {
    color: colors.danger,
    fontSize: 13,
  },
  field: {
    gap: spacing.sm,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
    borderRadius: 16,
    borderWidth: 1,
    color: '#111827',
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: spacing.lg,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
  },
  inputFocused: {
    borderColor: '#111827',
    backgroundColor: '#FFFFFF',
  },
  inputError: {
    borderColor: colors.danger,
  },
  label: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 4,
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  }
});
