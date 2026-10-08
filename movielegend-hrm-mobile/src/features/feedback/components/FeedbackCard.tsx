import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import type { Feedback } from '../../../types/feedback.types';
import { FeedbackStatusBadge } from './FeedbackStatusBadge';

interface Props {
  feedback: Feedback;
  onPress: () => void;
  isAdmin?: boolean;
}

export function FeedbackCard({ feedback, onPress, isAdmin }: Props) {
  const dateStr = new Date(feedback.createdAt).toLocaleDateString('vi-VN');
  const senderText = feedback.isAnonymous 
    ? 'Ẩn danh' 
    : (feedback.senderDisplayName || feedback.sender?.fullName || feedback.sender?.userCode || 'Ẩn danh');

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>
          {feedback.title}
        </Text>
        <FeedbackStatusBadge status={feedback.status} />
      </View>
      
      <Text style={styles.content} numberOfLines={2}>
        {feedback.content}
      </Text>

      {feedback.img && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 }}>
          <Ionicons name="image-outline" size={15} color="#3B82F6" />
          <Text style={{ fontSize: 13, color: '#3B82F6', fontWeight: '500' }}>Có ảnh đính kèm</Text>
        </View>
      )}
      
      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <Ionicons name="calendar-outline" size={15} color="#64748B" />
          <Text style={styles.date}>{dateStr}</Text>
        </View>
        <View style={styles.footerRight}>
          <Ionicons name="person-outline" size={15} color="#64748B" />
          <Text style={styles.sender}>{senderText}</Text>
          <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    flex: 1,
    marginRight: 10,
  },
  content: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 14,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  date: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  sender: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },
});
