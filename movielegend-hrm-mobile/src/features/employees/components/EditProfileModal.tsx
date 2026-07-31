import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Pressable, Modal, TextInput, ActivityIndicator, Alert } from 'react-native';
import { apiClient } from '../../../api/client';

export function EditProfileModal({ visible, onClose, initialPhone = '', initialEmail = '' }: any) {
  const [editForm, setEditForm] = useState({ phone: '', email: '' });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setEditForm({ phone: initialPhone, email: initialEmail });
    }
  }, [visible, initialPhone, initialEmail]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await apiClient.patch('/users/me', { phone: editForm.phone, email: editForm.email });
      Alert.alert('Thành công', 'Cập nhật thông tin thành công. Vui lòng đăng nhập lại bằng số điện thoại mới.', [
        { text: 'OK', onPress: () => {
           onClose();
        }}
      ]);
    } catch (error: any) {
      Alert.alert('Lỗi', error?.response?.data?.message || 'Không thể cập nhật thông tin');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Chỉnh sửa thông tin</Text>
          <Text style={styles.modalSubtitle}>Sử dụng số điện thoại mới này để đăng nhập vào lần sau.</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Số điện thoại</Text>
            <TextInput
              style={styles.input}
              value={editForm.phone}
              onChangeText={(t) => setEditForm(prev => ({ ...prev, phone: t }))}
              keyboardType="phone-pad"
              placeholder="Nhập số điện thoại"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              value={editForm.email}
              onChangeText={(t) => setEditForm(prev => ({ ...prev, email: t }))}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="Nhập địa chỉ email"
            />
          </View>

          <View style={styles.modalActions}>
            <Pressable style={styles.btnCancel} onPress={onClose}>
              <Text style={styles.btnCancelText}>Hủy</Text>
            </Pressable>
            <Pressable style={styles.btnSave} onPress={handleSave} disabled={isSaving}>
              {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnSaveText}>Lưu thay đổi</Text>}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#111827',
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 12,
    marginBottom: 32, // for safe area
  },
  btnCancel: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B5563',
  },
  btnSave: {
    flex: 1,
    backgroundColor: '#111827',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnSaveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
