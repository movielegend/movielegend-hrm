import { Modal, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { PrimaryButton, SecondaryButton } from './Buttons';

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  loading?: boolean;
  hideCancel?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmModal({ visible, title, message, confirmLabel = 'Xác nhận', loading, hideCancel, onCancel, onConfirm }: ConfirmModalProps) {
  return (
    <Modal animationType="fade" transparent visible={visible}>
      <View style={styles.backdrop}>
        <View style={styles.panel}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            {!hideCancel && <SecondaryButton onPress={onCancel} disabled={loading}>Hủy</SecondaryButton>}
            <PrimaryButton onPress={onConfirm} loading={loading}>{confirmLabel}</PrimaryButton>
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
