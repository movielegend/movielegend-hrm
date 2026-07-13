import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView, TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen } from '../../../src/components/Screen';
import { colors } from '../../../src/theme/colors';
import { spacing } from '../../../src/theme/spacing';
import { createEmployeeRequest } from '../../../src/api/employee-requests.api';
import type { EmployeeRequestType } from '../../../src/types/request.types';

const REQUEST_TYPES: { type: EmployeeRequestType, label: string, icon: keyof typeof MaterialCommunityIcons.glyphMap, color: string }[] = [
  { type: 'LEAVE', label: 'Nghỉ phép', icon: 'beach', color: '#10B981' },
  { type: 'ATTENDANCE_ADJUSTMENT', label: 'Giải trình công', icon: 'clock-edit-outline', color: '#F59E0B' },
  { type: 'OVERTIME', label: 'Làm thêm', icon: 'briefcase-clock-outline', color: '#6366F1' },
  { type: 'LATE_ARRIVAL', label: 'Đi muộn', icon: 'run', color: '#F43F5E' },
  { type: 'EARLY_LEAVE', label: 'Về sớm', icon: 'door-open', color: '#8B5CF6' },
  { type: 'BUSINESS_TRIP', label: 'Công tác', icon: 'airplane', color: '#3B82F6' },
  { type: 'ADVANCE', label: 'Tạm ứng', icon: 'cash', color: '#14B8A6' },
  { type: 'EXPENSE', label: 'Thanh toán', icon: 'receipt', color: '#F97316' },
  { type: 'OTHER', label: 'Khác', icon: 'file-document', color: colors.muted },
];

export default function CreateRequestScreen() {
  const router = useRouter();
  
  const [selectedType, setSelectedType] = useState<EmployeeRequestType>('LEAVE');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isFinancial = selectedType === 'ADVANCE' || selectedType === 'EXPENSE' || selectedType === 'PURCHASE';

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ Tiêu đề và Nội dung.');
      return;
    }
    if (isFinancial && !amount.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập Số tiền cho loại đơn này.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createEmployeeRequest({
        type: selectedType,
        title: title.trim(),
        content: content.trim(),
        ...(isFinancial && amount ? { amount: Number(amount) } : {})
      });
      
      Alert.alert('Thành công', 'Đã gửi đơn thành công!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (e: any) {
      Alert.alert('Lỗi', e.response?.data?.message || e.message || 'Có lỗi xảy ra khi gửi đơn.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable onPress={() => router.back()} style={styles.iconBtn}>
            <MaterialCommunityIcons name="chevron-left" size={28} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Tạo Đơn Mới</Text>
        </View>
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.sectionLabel}>Chọn loại đơn</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeSelector}>
            {REQUEST_TYPES.map(t => (
              <Pressable 
                key={t.type} 
                style={[styles.typeBox, selectedType === t.type && { borderColor: t.color, backgroundColor: `${t.color}10` }]}
                onPress={() => setSelectedType(t.type)}
              >
                <View style={[styles.typeIconWrap, { backgroundColor: t.color }]}>
                  <MaterialCommunityIcons name={t.icon} size={24} color="#fff" />
                </View>
                <Text style={[styles.typeLabel, selectedType === t.type && { color: t.color }]}>
                  {t.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Tiêu đề đơn <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.input}
              placeholder="VD: Đơn xin nghỉ phép năm"
              value={title}
              onChangeText={setTitle}
            />
          </View>

          {isFinancial && (
            <View style={styles.formGroup}>
              <Text style={styles.label}>Số tiền đề xuất (VNĐ) <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.input}
                placeholder="VD: 5000000"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
              />
            </View>
          )}

          <View style={styles.formGroup}>
            <Text style={styles.label}>Nội dung / Lý do <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Nhập lý do chi tiết..."
              multiline
              numberOfLines={4}
              value={content}
              onChangeText={setContent}
              textAlignVertical="top"
            />
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <Pressable 
          style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]} 
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>Gửi Đơn</Text>
          )}
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    padding: spacing.xs,
    marginRight: spacing.sm,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  content: {
    padding: spacing.md,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  typeSelector: {
    marginBottom: spacing.lg,
  },
  typeBox: {
    width: 100,
    height: 100,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  typeIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  required: {
    color: colors.danger,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: colors.text,
  },
  textArea: {
    minHeight: 120,
  },
  footer: {
    padding: spacing.lg,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  submitBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  }
});
