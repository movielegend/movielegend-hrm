import { Modal, StyleSheet, Text, View } from 'react-native';
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
  const displayMessage = message || description;
  const displayConfirmLabel = confirmText || confirmLabel;
  const displayLoading = loading || isLoading;

  return (
    <Modal animationType="fade" transparent visible={visible}>
      <View style={styles.backdrop}>
        <View style={styles.panel}>
          <Text style={styles.title}>{title}</Text>
          {displayMessage ? <Text style={styles.message}>{displayMessage}</Text> : null}
          {children}
          <View style={styles.actions}>
            {!hideCancel && <SecondaryButton onPress={onCancel} disabled={displayLoading}>Hủy</SecondaryButton>}
            <PrimaryButton onPress={onConfirm} loading={displayLoading}>{displayConfirmLabel}</PrimaryButton>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'flex-end',
  },
  backdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  message: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  panel: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    gap: spacing.lg,
    padding: spacing.xl,
    width: '100%',
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
});
