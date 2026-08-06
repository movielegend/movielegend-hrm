import React from 'react';
import { Modal, StyleSheet, Text, View, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface AiPrivacyModalProps {
  visible: boolean;
  role?: 'EMPLOYEE' | 'LEADER' | 'HR';
  onAccept: () => void;
  onDecline: () => void;
}

export function AiPrivacyModal({ visible, role = 'EMPLOYEE', onAccept, onDecline }: AiPrivacyModalProps) {
  const roleText = role === 'HR' ? 'bộ phận Nhân sự (HR)' : (role === 'LEADER' ? 'Cấp quản lý (Leader)' : 'Nhân viên');

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDecline}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header Icon + Title */}
          <View style={styles.header}>
            <View style={styles.iconBg}>
              <MaterialCommunityIcons name="shield-check-outline" size={26} color="#3B82F6" />
            </View>
            <Text style={styles.title}>Quyền riêng tư & AI</Text>
          </View>

          {/* Description Body */}
          <Text style={styles.description}>
            MovieLegend HRM sử dụng mô hình trí tuệ nhân tạo Gemini từ Google để hỗ trợ {roleText} tra cứu và giải đáp thông tin công việc.
          </Text>

          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>
              • Nội dung câu hỏi và hội thoại của bạn sẽ được xử lý bảo mật để đưa ra câu trả lời phù hợp nhất.
            </Text>
            <Text style={styles.bulletItem}>
              • Chúng tôi KHÔNG gửi thông tin cá nhân định danh riêng tư trừ khi bạn tự nhập vào.
            </Text>
            <Text style={styles.bulletItem}>
              • Dữ liệu này được sử dụng duy nhất cho mục đích hỗ trợ công việc và giải đáp thắc mắc nội bộ.
            </Text>
          </View>

          <Text style={styles.footerNote}>
            Bằng cách chọn &quot;Đồng ý&quot;, bạn cho phép ứng dụng chia sẻ dữ liệu hội thoại với dịch vụ trí tuệ nhân tạo.
          </Text>

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            <Pressable style={styles.declineBtn} onPress={onDecline}>
              <Text style={styles.declineBtnText}>Hủy</Text>
            </Pressable>

            <Pressable style={styles.acceptBtn} onPress={onAccept}>
              <Text style={styles.acceptBtnText}>Đồng ý</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 36,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  iconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  description: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 14,
  },
  bulletList: {
    gap: 8,
    marginBottom: 16,
  },
  bulletItem: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 18,
  },
  footerNote: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#9CA3AF',
    lineHeight: 16,
    marginBottom: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
  },
  declineBtn: {
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  declineBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4B5563',
  },
  acceptBtn: {
    backgroundColor: '#111827',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  acceptBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
