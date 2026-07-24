import { useState } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View, Platform, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

interface FormFieldProps extends TextInputProps {
  label: string;
  error?: string | undefined;
  rightLabelElement?: React.ReactNode;
  isPassword?: boolean;
}

export function FormField({ label, error, style, rightLabelElement, isPassword, ...inputProps }: FormFieldProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [secureText, setSecureText] = useState(true);
  
  return (
    <View style={styles.field}>
      <View style={[styles.inputWrapper, isFocused && styles.inputFocused, error ? styles.inputError : null, style]}>
        <View style={styles.labelRow}>
          <Text style={styles.inputLabel}>{label}</Text>
          {rightLabelElement}
        </View>
        <View style={styles.passwordRow}>
          <TextInput 
            {...inputProps} 
            secureTextEntry={isPassword ? secureText : inputProps.secureTextEntry}
            accessibilityLabel={label} 
            onFocus={(e) => {
              setIsFocused(true);
              inputProps.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              inputProps.onBlur?.(e);
            }}
            style={[styles.inputText, { flex: 1 }]} 
            placeholderTextColor="#9CA3AF"
          />
          {isPassword ? (
            <Pressable onPress={() => setSecureText(!secureText)} style={styles.eyeBtn}>
              <Ionicons name={secureText ? 'eye-outline' : 'eye-off-outline'} size={20} color="#6B7280" />
            </Pressable>
          ) : null}
        </View>
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
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
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
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    height: 28,
    padding: 0,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eyeBtn: {
    paddingLeft: 12,
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 16,
  },
});
