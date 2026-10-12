import React, { ReactNode } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { PrimaryButton, SecondaryButton } from './Buttons';
import { useOptionalAuth } from '../providers/AuthProvider';

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

function getInitials(name?: string): string {
  if (!name) return 'AL';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'AL';
  const first = parts[0] || '';
  const last = parts[parts.length - 1] || '';
  if (parts.length === 1) return first.substring(0, 2).toUpperCase() || 'AL';
  return ((first[0] || '') + (last[0] || '')).toUpperCase() || 'AL';
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
  const auth = useOptionalAuth();
  const user = auth?.user;
  if (!visible) return null;

  const displayMessage = message || description;
  const displayConfirmLabel = confirmText || confirmLabel;
  const displayLoading = loading || isLoading;

  const isLogout = title.toLowerCase().includes('đăng xuất');
  const isSuccess = title.toLowerCase().includes('thành công');
  const isDanger = confirmTone === 'danger' || title.toLowerCase().includes('xóa') || title.toLowerCase().includes('lỗi');

  // If this is a Logout confirmation modal, render the exact template from media_1791521137409.png
  if (isLogout) {
    return (
      <Modal animationType="fade" transparent visible={visible} onRequestClose={onCancel}>
        <Pressable style={styles.backdrop} onPress={onCancel}>
          <Pressable style={styles.logoutPanel} onPress={(e) => e.stopPropagation()}>
            {/* Top Sage Green Circle with Logout Icon */}
            <View style={styles.logoutIconCircle}>
              <Ionicons
                name="log-out-outline"
                size={32}
                color="#1B3B2B"
                style={{ marginLeft: 3 }}
              />
            </View>

            {/* Title & Subtitle */}
            <Text style={styles.logoutTitle}>Đăng xuất tài khoản?</Text>
            <Text style={styles.logoutSubtitle}>
              {displayMessage || 'Bạn có muốn đăng xuất khỏi ứng dụng?'}
            </Text>

            {/* User Badge Pill */}
            <View style={styles.logoutUserPill}>
              <View style={styles.logoutAvatarCircle}>
                {user?.avatarUrl ? (
                  <Image source={{ uri: user.avatarUrl }} style={styles.logoutAvatarImg} />
                ) : (
                  <Text style={styles.logoutAvatarInitials}>
                    {getInitials(user?.fullName)}
                  </Text>
                )}
              </View>
              <Text style={styles.logoutUserName} numberOfLines={1}>
                {user?.fullName || 'Admin Movie Legend'}
              </Text>
            </View>

            {/* Action Buttons Row */}
            <View style={styles.logoutBtnRow}>
              {/* Stay Button */}
              <Pressable
                style={({ pressed }) => [
                  styles.stayBtn,
                  pressed && { opacity: 0.8 },
                ]}
                onPress={onCancel}
                disabled={displayLoading}
              >
                <Text style={styles.stayBtnText}>Ở lại</Text>
              </Pressable>

              {/* Logout Button */}
              <Pressable
                style={({ pressed }) => [
                  styles.logoutConfirmBtn,
                  pressed && { opacity: 0.9 },
                ]}
                onPress={onConfirm}
                disabled={displayLoading}
              >
                {displayLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="log-out-outline" size={19} color="#FFFFFF" />
                    <Text style={styles.logoutConfirmBtnText}>Đăng xuất</Text>
                  </>
                )}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    );
  }

  // Generic Confirm Modal
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

          <View style={[styles.actions, !hideCancel && displayConfirmLabel.length > 12 && styles.actionsStacked]}>
            <PrimaryButton 
              style={[
                styles.btnFlex, 
                isDanger && styles.dangerButton,
                !hideCancel && displayConfirmLabel.length > 12 && styles.btnFull
              ]}
              textStyle={styles.confirmBtnText}
              onPress={onConfirm} 
              loading={displayLoading}
            >
              {displayConfirmLabel}
            </PrimaryButton>
            {!hideCancel && (
              <SecondaryButton 
                style={[
                  styles.btnFlex,
                  displayConfirmLabel.length > 12 && styles.btnFullSecondary
                ]}
                textStyle={styles.cancelBtnText}
                onPress={onCancel} 
                disabled={displayLoading}
              >
                Hủy
              </SecondaryButton>
            )}
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
    padding: spacing.lg,
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
    width: 60,
    height: 60,
    borderRadius: 30,
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
    flexDirection: 'row-reverse',
    gap: 10,
    width: '100%',
    marginTop: 8,
  },
  actionsStacked: {
    flexDirection: 'column',
    gap: 8,
  },
  btnFlex: {
    flex: 1,
    minHeight: 46,
    borderRadius: 14,
    paddingHorizontal: 8,
  },
  btnFull: {
    width: '100%',
    minHeight: 48,
    flex: undefined,
  },
  btnFullSecondary: {
    width: '100%',
    minHeight: 44,
    flex: undefined,
    borderWidth: 0,
    backgroundColor: '#F8FAFC',
  },
  confirmBtnText: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
  },
  dangerButton: {
    backgroundColor: '#EF4444',
  },

  /* ── Dedicated Logout Template Styles (media_1791521137409.png) ── */
  logoutPanel: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingTop: 28,
    paddingBottom: 24,
    paddingHorizontal: 22,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 12,
  },
  logoutIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#E8F2EC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoutTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  logoutSubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 16,
  },
  logoutUserPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F6F4',
    borderRadius: 24,
    paddingVertical: 4,
    paddingHorizontal: 8,
    paddingRight: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 24,
  },
  logoutAvatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#D1E5D8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    overflow: 'hidden',
  },
  logoutAvatarImg: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  logoutAvatarInitials: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1B3B2B',
  },
  logoutUserName: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#334155',
  },
  logoutBtnRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  stayBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#EAEFEB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stayBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1B3B2B',
  },
  logoutConfirmBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#1B3B2B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  logoutConfirmBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
