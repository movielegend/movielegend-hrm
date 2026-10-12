import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Modal,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { apiClient } from '../../../api/client';
import { useAuth } from '../../../providers/AuthProvider';
import { CustomAlert } from '../../../components/CustomAlert';

export interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  initialFullName?: string;
  initialName?: string;
  initialPhone?: string;
  initialEmail?: string;
}

export function EditProfileModal({
  visible,
  onClose,
  initialFullName = '',
  initialName = '',
  initialPhone = '',
  initialEmail = '',
}: EditProfileModalProps) {
  const [editForm, setEditForm] = useState({
    fullName: '',
    phone: '',
    email: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const { reloadProfile } = useAuth();

  useEffect(() => {
    if (visible) {
      setEditForm({
        fullName: initialFullName || initialName || '',
        phone: initialPhone || '',
        email: initialEmail || '',
      });
    }
  }, [visible, initialFullName, initialName, initialPhone, initialEmail]);

  const handleSave = async () => {
    const trimmedFullName = editForm.fullName.trim();
    const trimmedPhone = editForm.phone.trim();
    const trimmedEmail = editForm.email.trim();

    if (!trimmedFullName) {
      CustomAlert.alert('Thông báo', 'Vui lòng nhập họ và tên.');
      return;
    }

    if (!trimmedPhone) {
      CustomAlert.alert('Thông báo', 'Vui lòng nhập số điện thoại.');
      return;
    }

    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      CustomAlert.alert('Thông báo', 'Địa chỉ email không đúng định dạng.');
      return;
    }

    try {
      setIsSaving(true);
      await apiClient.patch('/users/me', {
        fullName: trimmedFullName,
        name: trimmedFullName,
        phone: trimmedPhone,
        email: trimmedEmail,
      });
      await reloadProfile();
      CustomAlert.alert('Thành công', 'Cập nhật thông tin thành công.', [
        {
          text: 'OK',
          onPress: () => {
            onClose();
          },
        },
      ]);
    } catch (error: any) {
      CustomAlert.alert('Lỗi', error?.response?.data?.message || 'Không thể cập nhật thông tin');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modalContent}>
          <View style={styles.dragHandle} />
          <Text style={styles.modalTitle}>Chỉnh sửa thông tin</Text>
          <Text style={styles.modalSubtitle}>
            Cập nhật họ và tên, số điện thoại hoặc email liên hệ của bạn.
          </Text>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Họ và tên <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={editForm.fullName}
                onChangeText={(t) => setEditForm((prev) => ({ ...prev, fullName: t }))}
                placeholder="Nhập họ và tên"
                placeholderTextColor="#94A3B8"
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Số điện thoại <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={editForm.phone}
                onChangeText={(t) => setEditForm((prev) => ({ ...prev, phone: t }))}
                keyboardType="phone-pad"
                placeholder="Nhập số điện thoại"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                value={editForm.email}
                onChangeText={(t) => setEditForm((prev) => ({ ...prev, email: t }))}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="Nhập địa chỉ email"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.modalActions}>
              <Pressable style={styles.btnCancel} onPress={onClose} disabled={isSaving}>
                <Text style={styles.btnCancelText}>Hủy</Text>
              </Pressable>
              <Pressable style={styles.btnSave} onPress={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.btnSaveText}>Lưu thay đổi</Text>
                )}
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
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
    paddingTop: 12,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    maxHeight: '85%',
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#102739',
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 20,
  },
  scrollContent: {
    paddingBottom: 8,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  required: {
    color: '#EF4444',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0F172A',
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 12,
  },
  btnCancel: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#475569',
  },
  btnSave: {
    flex: 1,
    backgroundColor: '#102739',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSaveText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});
