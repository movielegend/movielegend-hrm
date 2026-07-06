import { StyleSheet, Text } from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface StatusBadgeProps {
  label: string;
  tone?: StatusTone;
}

const toneColors: Record<StatusTone, { backgroundColor: string; color: string }> = {
  danger: { backgroundColor: colors.dangerSoft, color: colors.danger },
  info: { backgroundColor: colors.primarySoft, color: colors.primaryDark },
  neutral: { backgroundColor: '#EEF2F7', color: colors.muted },
  success: { backgroundColor: '#E6FFFA', color: colors.success },
  warning: { backgroundColor: '#FFF7ED', color: colors.warning },
};

export function StatusBadge({ label, tone = 'neutral' }: StatusBadgeProps) {
  return <Text style={[styles.badge, toneColors[tone]]}>{label}</Text>;
}

export function toneForStatus(status?: string): StatusTone {
  if (status === 'APPROVED' || status === 'ACTIVE') return 'success';
  if (status === 'PENDING') return 'warning';
  if (status === 'REJECTED' || status === 'SUSPENDED') return 'danger';
  return 'neutral';
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: '800',
    overflow: 'hidden',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
});
