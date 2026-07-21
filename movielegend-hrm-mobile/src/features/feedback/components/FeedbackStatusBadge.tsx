import React from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { colors } from '../../../theme/colors';
import type { FeedbackStatus } from '../../../types/feedback.types';

interface Props {
  status: FeedbackStatus;
  style?: ViewStyle;
}

const statusConfig: Record<FeedbackStatus, { label: string; color: string; bgColor: string }> = {
  SEND: { label: 'Đã gửi', color: colors.info, bgColor: '#EFF6FF' },
  REVIEWED: { label: 'Đang xem xét', color: colors.warning, bgColor: colors.warningSoft },
  RESOLVED: { label: 'Đã giải quyết', color: colors.success, bgColor: colors.primarySoft },
  REJECTED: { label: 'Từ chối', color: colors.danger, bgColor: colors.dangerSoft },
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
