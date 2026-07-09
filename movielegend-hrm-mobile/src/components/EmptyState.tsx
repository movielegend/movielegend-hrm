import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  small?: boolean;
}

export function EmptyState({ title, message, icon, small }: EmptyStateProps) {
  return (
    <View style={[styles.container, small && styles.containerSmall]}>
      {icon && <MaterialCommunityIcons name={icon} size={small ? 32 : 48} color={colors.muted} />}
      <Text style={[styles.title, small && styles.titleSmall]}>{title ?? 'Chua có d? li?u'}</Text>
      {message ? <Text style={[styles.message, small && styles.messageSmall]}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.xl,
  },
  containerSmall: {
    padding: spacing.md,
  },
  message: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  messageSmall: {
    fontSize: 13,
  },
  title: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
  },
  titleSmall: {
    fontSize: 15,
  },
});
