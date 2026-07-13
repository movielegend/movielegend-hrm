import { StyleSheet, Text } from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface StatusBadgeProps {
  label: string;
  tone?: StatusTone;
}

const toneColors: Record<StatusTone, { backgroundColor: string; color: string }> = {
  danger: { backgroundColor: '#FEE2E2', color: '#EF4444' },
  info: { backgroundColor: '#E0F2FE', color: '#3B82F6' },
  neutral: { backgroundColor: '#F3F4F6', color: '#374151' },
  success: { backgroundColor: '#F3F4F6', color: '#374151' }, // Used for ĐÃ DUYỆT
  warning: { backgroundColor: '#FEF3C7', color: '#F59E0B' },
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
