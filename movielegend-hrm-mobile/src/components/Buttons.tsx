import { PropsWithChildren } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

interface ButtonProps extends PropsWithChildren {
  onPress: () => void;
  disabled?: boolean | undefined;
  loading?: boolean | undefined;
  accessibilityLabel?: string | undefined;
  style?: ViewStyle | undefined;
}

export function PrimaryButton({ children, onPress, disabled, loading, accessibilityLabel, style }: ButtonProps) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      style={[styles.button, styles.primary, (disabled || loading) && styles.disabled, style]}
    >
      {loading ? <ActivityIndicator color={colors.surface} /> : <Text style={styles.primaryText}>{children}</Text>}
    </Pressable>
  );
}

export function SecondaryButton({ children, onPress, disabled, loading, accessibilityLabel, style }: ButtonProps) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      style={[styles.button, styles.secondary, (disabled || loading) && styles.disabled, style]}
    >
      {loading ? <ActivityIndicator color={colors.primary} /> : <Text style={styles.secondaryText}>{children}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: 12,
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  disabled: {
    opacity: 0.55,
  },
  primary: {
    backgroundColor: '#111827',
  },
  primaryText: {
    color: colors.surface,
    fontSize: 15,
    fontWeight: '800',
  },
  secondary: {
    backgroundColor: colors.surface,
    borderColor: '#E5E7EB',
    borderWidth: 1,
  },
  secondaryText: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '800',
  },
});
