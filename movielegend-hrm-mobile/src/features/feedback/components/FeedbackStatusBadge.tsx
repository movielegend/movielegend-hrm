import React from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { colors } from '../../../theme/colors';
import type { FeedbackStatus } from '../../../types/feedback.types';

interface Props {
  status: FeedbackStatus;
  style?: ViewStyle;
}

const statusConfig: Record<FeedbackStatus, { label: string; color: string; bgColor: string }> = {
  SEND: { label: 'Đã gửi', color: '#C2410C', bgColor: '#FFEDD5' },
  REVIEWED: { label: 'Đang xem xét', color: '#B45309', bgColor: '#FEF3C7' },
  RESOLVED: { label: 'Đã giải quyết', color: '#15803D', bgColor: '#DCFCE7' },
  REJECTED: { label: 'Từ chối', color: '#B91C1C', bgColor: '#FEE2E2' },
};

export function FeedbackStatusBadge({ status, style }: Props) {
  const config = statusConfig[status] || statusConfig.SEND;
  return (
    <View style={[styles.badge, { backgroundColor: config.bgColor }, style]}>
      <Text style={[styles.text, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});
