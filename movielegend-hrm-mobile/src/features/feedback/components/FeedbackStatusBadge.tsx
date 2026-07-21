import React from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { colors } from '../../../theme/colors';
import type { FeedbackStatus } from '../../../types/feedback.types';

interface Props {
  status: FeedbackStatus;
  style?: ViewStyle;
}

const statusConfig: Record<FeedbackStatus, { label: string; color: string; bgColor: string }> = {
  SEND: { label: 'Đã gửi', color: '#111827', bgColor: '#F3F4F6' },
  REVIEWED: { label: 'Đang xem xét', color: '#4B5563', bgColor: '#E5E7EB' },
  RESOLVED: { label: 'Đã giải quyết', color: '#FFFFFF', bgColor: '#000000' },
  REJECTED: { label: 'Từ chối', color: '#000000', bgColor: '#E5E7EB' },
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
