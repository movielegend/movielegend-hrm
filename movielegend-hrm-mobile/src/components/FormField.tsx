import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

interface FormFieldProps extends TextInputProps {
  label: string;
  error?: string | undefined;
}

export function FormField({ label, error, style, ...inputProps }: FormFieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput {...inputProps} accessibilityLabel={label} style={[styles.input, style]} />
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
    backgroundColor: '#fff',
    borderColor: '#E5E7EB',
    borderRadius: 12,
    borderWidth: 1,
    color: '#111827',
    fontSize: 15,
    minHeight: 48,
    paddingHorizontal: spacing.md,
  },
  label: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '700',
  },
});
