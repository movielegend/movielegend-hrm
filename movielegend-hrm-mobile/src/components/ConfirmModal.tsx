import { Modal, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { PrimaryButton, SecondaryButton } from './Buttons';
import { ReactNode } from 'react';

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message?: string;
  description?: string;
  confirmLabel?: string;
  confirmText?: string;
  confirmTone?: 'primary' | 'danger';
  loading?: boolean;
  isLoading?: boolean;
  hideCancel?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  children?: ReactNode;
}

export function ConfirmModal({ 
  visible, 
  title, 
  message, 
  description, 
  confirmLabel = 'Xác nhận', 
  confirmText,
  confirmTone = 'primary',
  loading, 
  isLoading,
  hideCancel, 
  onCancel, 
  onConfirm,
  children
}: ConfirmModalProps) {
  if (!visible) return null;

  const displayMessage = message || description;
  const displayConfirmLabel = confirmText || confirmLabel;
  const displayLoading = loading || isLoading;

  const isSuccess = title.toLowerCase().includes('thành công');
  const isDanger = confirmTone === 'danger' || title.toLowerCase().includes('xóa') || title.toLowerCase().includes('lỗi');

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.panel}>
          {/* Status Icon Header */}
          {isSuccess && (
            <View style={[styles.iconWrap, { backgroundColor: '#ECFDF5' }]}>
              <MaterialCommunityIcons name="check-circle" size={36} color="#059669" />
            </View>
          )}
          {isDanger && !isSuccess && (
            <View style={[styles.iconWrap, { backgroundColor: '#FEF2F2' }]}>
              <MaterialCommunityIcons name="alert-circle-outline" size={36} color="#EF4444" />
            </View>
          )}

          <Text style={styles.title}>{title}</Text>
          {displayMessage ? <Text style={styles.message}>{displayMessage}</Text> : null}
          {children}

          <View style={styles.actions}>
            {!hideCancel && (
              <SecondaryButton 
                style={styles.btnFlex}
                onPress={onCancel} 
                disabled={displayLoading}
              >
                Hủy
              </SecondaryButton>
            )}
            <PrimaryButton 
              style={[styles.btnFlex, isDanger && styles.dangerButton]}
              onPress={onConfirm} 
              loading={displayLoading}
            >
              {displayConfirmLabel}
            </PrimaryButton>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  panel: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    gap: spacing.md,
    padding: 24,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 15,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  message: {
    color: '#64748B',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginTop: 8,
  },
  btnFlex: {
    flex: 1,
    minHeight: 46,
    borderRadius: 14,
  },
  dangerButton: {
    backgroundColor: '#EF4444',
  },
});
