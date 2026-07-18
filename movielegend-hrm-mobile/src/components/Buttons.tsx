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
      style={({ pressed }) => [
        styles.button, 
        styles.primary, 
        pressed && styles.primaryPressed,
        (disabled || loading) && styles.disabled, 
        style
      ]}
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
      style={({ pressed }) => [
        styles.button, 
        styles.secondary, 
        pressed && styles.secondaryPressed,
        (disabled || loading) && styles.disabled, 
        style
      ]}
    >
      {loading ? <ActivityIndicator color="#111827" /> : <Text style={styles.secondaryText}>{children}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: 16,
    minHeight: 52,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
  },
  disabled: {
    opacity: 0.55,
  },
  primary: {
    backgroundColor: '#111827',
  },
  primaryPressed: {
    backgroundColor: '#374151',
  },
  primaryText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '800',
  },
  secondary: {
    backgroundColor: colors.surface,
    borderColor: '#E5E7EB',
    borderWidth: 1,
  },
  secondaryPressed: {
    backgroundColor: '#F3F4F6',
  },
  secondaryText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '800',
  },
});
