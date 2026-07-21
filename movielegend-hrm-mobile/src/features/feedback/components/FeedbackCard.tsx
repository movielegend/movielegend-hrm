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

const appleTheme = {
  primary: '#111827',
  card: '#FFFFFF',
  text: '#111827',
  textSecondary: '#6B7280',
  border: 'rgba(17, 24, 39, 0.05)',
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: appleTheme.card,
    padding: 20,
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: appleTheme.border,
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: appleTheme.primary,
    flex: 1,
    marginRight: 12,
  },
  content: {
    fontSize: 15,
    color: appleTheme.textSecondary,
    marginBottom: 16,
    lineHeight: 22,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: appleTheme.border,
    paddingTop: 16,
  },
  date: {
    fontSize: 13,
    color: appleTheme.textSecondary,
    fontWeight: '500',
  },
  sender: {
    fontSize: 13,
    color: appleTheme.primary,
    fontWeight: '700',
  },
});
