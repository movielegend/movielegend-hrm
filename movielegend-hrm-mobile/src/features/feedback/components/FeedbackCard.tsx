import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../../../theme/colors';
import type { Feedback } from '../../../types/feedback.types';
import { FeedbackStatusBadge } from './FeedbackStatusBadge';
import { formatDate } from '../../../utils/date.utils'; // Assuming this exists, if not we'll use native Date

interface Props {
  feedback: Feedback;
  onPress: () => void;
  isAdmin?: boolean;
}

export function FeedbackCard({ feedback, onPress, isAdmin }: Props) {
  const dateStr = new Date(feedback.createdAt).toLocaleDateString('vi-VN');

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>
          {feedback.title}
        </Text>
        <FeedbackStatusBadge status={feedback.status} />
      </View>
      
      <Text style={styles.content} numberOfLines={2}>
        {feedback.content}
      </Text>
      
      <View style={styles.footer}>
        <Text style={styles.date}>{dateStr}</Text>
        {isAdmin && (
          <Text style={styles.sender}>
            {feedback.isAnonymous ? 'Ẩn danh' : feedback.senderDisplayName || 'Không rõ'}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
    marginRight: 8,
  },
  content: {
    fontSize: 14,
    color: colors.muted,
    marginBottom: 12,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    fontSize: 12,
    color: colors.muted,
  },
  sender: {
    fontSize: 12,
    color: '#000',
    fontWeight: '500',
  },
});
