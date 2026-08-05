import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Pressable, Modal, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { changePasswordApi } from '../../../api/auth.api';
import { useAppAlert } from '../../../contexts/AlertContext';
import { normalizeApiError } from '../../../utils/api-error';

export function ChangePasswordModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { showAlert } = useAppAlert();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowOld(false);
      setShowNew(false);
      setShowConfirm(false);
    }
  }, [visible]);

  const handleSave = async () => {
    if (!oldPassword) {
      showAlert('Vui lòng điền thông tin', 'Vui lòng nhập mật khẩu hiện tại.');
      return;
    }
    if (!newPassword) {
      showAlert('Vui lòng điền thông tin', 'Vui lòng nhập mật khẩu mới.');
      return;
    }
    if (newPassword.length < 6) {
      showAlert('Mật khẩu quá ngắn', 'Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }
    if (newPassword !== confirmPassword) {
      showAlert('Mật khẩu không khớp', 'Mật khẩu xác nhận không trùng khớp với mật khẩu mới.');
      return;
    }
    if (oldPassword === newPassword) {
      showAlert('Lỗi mật khẩu', 'Mật khẩu mới không được trùng với mật khẩu cũ.');
      return;
    }

    try {
      setIsSaving(true);
      await changePasswordApi({ oldPassword, newPassword });
      showAlert('Thành công', 'Đổi mật khẩu thành công!');
      onClose();
    } catch (error) {
      const normalized = normalizeApiError(error);
      showAlert('Lỗi', normalized.message || 'Không thể đổi mật khẩu. Vui lòng kiểm tra lại.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modalContent}>
          {/* Header Bar */}
          <View style={styles.headerRow}>
            <View style={styles.iconPill}>
              <MaterialCommunityIcons name="shield-lock-outline" size={24} color="#111827" />
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} disabled={isSaving}>
              <MaterialCommunityIcons name="close" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          <Text style={styles.modalTitle}>Đổi mật khẩu tài khoản</Text>
          <Text style={styles.modalSubtitle}>Cập nhật mật khẩu mới định kỳ để nâng cao tính bảo mật cho tài khoản của bạn.</Text>

          {/* Mật khẩu hiện tại */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Mật khẩu hiện tại</Text>
            <View style={styles.passwordInputWrapper}>
              <MaterialCommunityIcons name="lock-outline" size={20} color="#94A3B8" style={styles.leftIcon} />
              <TextInput
                style={styles.passwordInput}
                value={oldPassword}
                onChangeText={setOldPassword}
                secureTextEntry={!showOld}
                placeholder="Nhập mật khẩu hiện tại"
                placeholderTextColor="#94A3B8"
              />
              <TouchableOpacity onPress={() => setShowOld(!showOld)} style={styles.eyeBtn}>
                <MaterialCommunityIcons name={showOld ? 'eye-off-outline' : 'eye-outline'} size={20} color="#64748B" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Mật khẩu mới */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Mật khẩu mới</Text>
            <View style={styles.passwordInputWrapper}>
              <MaterialCommunityIcons name="key-outline" size={20} color="#94A3B8" style={styles.leftIcon} />
              <TextInput
                style={styles.passwordInput}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showNew}
                placeholder="Tối thiểu 6 ký tự"
                placeholderTextColor="#94A3B8"
              />
              <TouchableOpacity onPress={() => setShowNew(!showNew)} style={styles.eyeBtn}>
                <MaterialCommunityIcons name={showNew ? 'eye-off-outline' : 'eye-outline'} size={20} color="#64748B" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Xác nhận mật khẩu mới */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Xác nhận mật khẩu mới</Text>
            <View style={styles.passwordInputWrapper}>
              <MaterialCommunityIcons name="check-circle-outline" size={20} color="#94A3B8" style={styles.leftIcon} />
              <TextInput
                style={styles.passwordInput}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirm}
                placeholder="Nhập lại mật khẩu mới"
                placeholderTextColor="#94A3B8"
              />
              <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={styles.eyeBtn}>
                <MaterialCommunityIcons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={20} color="#64748B" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.modalActions}>
            <Pressable style={[styles.modalBtn, styles.modalBtnCancel]} onPress={onClose} disabled={isSaving}>
              <Text style={styles.modalBtnTextCancel}>Hủy bỏ</Text>
            </Pressable>
            <Pressable style={[styles.modalBtn, styles.modalBtnSave, isSaving && { opacity: 0.7 }]} onPress={() => void handleSave()} disabled={isSaving}>
              {isSaving ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Text style={styles.modalBtnTextSave}>Cập nhật mật khẩu</Text>}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  iconPill: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 24,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  passwordInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 14,
    height: 52,
  },
  leftIcon: {
    marginRight: 10,
  },
  passwordInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#0F172A',
    height: '100%',
  },
  eyeBtn: {
    padding: 6,
    marginLeft: 4,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  modalBtn: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnCancel: {
    backgroundColor: '#F1F5F9',
  },
  modalBtnSave: {
    backgroundColor: '#111827',
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  modalBtnTextCancel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#475569',
  },
  modalBtnTextSave: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
