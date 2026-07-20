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
      <View style={[styles.inputWrapper, isFocused && styles.inputFocused, error ? styles.inputError : null, style]}>
        <View style={styles.labelRow}>
          <Text style={styles.inputLabel}>{label}</Text>
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
          style={styles.inputText} 
          placeholderTextColor="#9CA3AF"
        />
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    marginBottom: 0,
  },
  inputWrapper: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECEEF3',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputFocused: {
    borderColor: '#111827',
  },
  inputError: {
    borderColor: colors.danger,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  inputText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
    height: 24,
    padding: 0,
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 16,
  },
});
