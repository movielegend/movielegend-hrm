import React from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface LogoutModalProps {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
  user?: {
    fullName?: string;
    avatarUrl?: string | null;
    userCode?: string;
  } | null;
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

export function LogoutModal({
  visible,
  onCancel,
  onConfirm,
  loading = false,
  user,
}: LogoutModalProps) {
  if (!visible) return null;

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable style={styles.panel} onPress={(e) => e.stopPropagation()}>
          {/* Top Sage Green Circle with Logout Icon */}
          <View style={styles.iconCircle}>
            <Ionicons
              name="log-out-outline"
              size={32}
              color="#1B3B2B"
              style={{ marginLeft: 3 }}
            />
          </View>

          {/* Title & Subtitle */}
          <Text style={styles.title}>Đăng xuất tài khoản?</Text>
          <Text style={styles.subtitle}>Bạn có muốn đăng xuất khỏi ứng dụng?</Text>

          {/* User Badge Pill */}
          <View style={styles.userPill}>
            <View style={styles.avatarCircle}>
              {user?.avatarUrl ? (
                <Image source={{ uri: user.avatarUrl }} style={styles.avatarImg} />
              ) : (
                <Text style={styles.avatarInitials}>
                  {getInitials(user?.fullName)}
                </Text>
              )}
            </View>
            <Text style={styles.userName} numberOfLines={1}>
              {user?.fullName || 'Admin Movie Legend'}
            </Text>
          </View>

          {/* Action Buttons Row */}
          <View style={styles.btnRow}>
            {/* Stay Button */}
            <Pressable
              style={({ pressed }) => [
                styles.stayBtn,
                pressed && { opacity: 0.8 },
              ]}
              onPress={onCancel}
              disabled={loading}
            >
              <Text style={styles.stayBtnText}>Ở lại</Text>
            </Pressable>

            {/* Logout Button */}
            <Pressable
              style={({ pressed }) => [
                styles.logoutBtn,
                pressed && { opacity: 0.9 },
              ]}
              onPress={onConfirm}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Ionicons name="log-out-outline" size={19} color="#FFFFFF" />
                  <Text style={styles.logoutBtnText}>Đăng xuất</Text>
                </>
              )}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  panel: {
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
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#E8F2EC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 16,
  },
  userPill: {
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
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#D1E5D8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    overflow: 'hidden',
  },
  avatarImg: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarInitials: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1B3B2B',
  },
  userName: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#334155',
  },
  btnRow: {
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
  logoutBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#1B3B2B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  logoutBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
