import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../providers/AuthProvider';
import { useAppAlert } from '../../contexts/AlertContext';
import { apiClient } from '../../api/client';
import { getHomeRouteForUser } from '../../utils/role-routing';

export function DeactivatedAccountScreen() {
  const router = useRouter();
  const { user, logout, reloadProfile } = useAuth();
  const { showAlert } = useAppAlert();
  const [isRestoring, setIsRestoring] = useState(false);

  const scheduledDate = user?.deletionScheduledAt
    ? new Date(user.deletionScheduledAt).toLocaleDateString('vi-VN')
    : '30 ngày tới';

  const daysLeft = user?.deletionScheduledAt
    ? Math.max(0, Math.ceil((new Date(user.deletionScheduledAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 30;

  const handleCancelDeletion = async () => {
    setIsRestoring(true);
    try {
      await apiClient.post('/auth/cancel-deletion');
      const updatedUser = await reloadProfile();
      showAlert(
        'Khôi phục thành công',
        'Tài khoản của bạn đã được hủy lịch xóa và khôi phục hoạt động trở lại!',
        () => {
          if (updatedUser) {
            router.replace(getHomeRouteForUser(updatedUser) as any);
          } else {
            void logout();
          }
        }
      );
    } catch (error: any) {
      showAlert('Lỗi', error?.response?.data?.message || 'Không thể hủy lịch xóa tài khoản. Vui lòng thử lại sau.');
    } finally {
      setIsRestoring(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/login' as any);
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconBg}>
          <MaterialCommunityIcons name="clock-alert-outline" size={40} color="#DC2626" />
        </View>

        <Text style={styles.title}>Tài khoản đang chờ xóa vĩnh viễn</Text>
        <Text style={styles.subtitle}>
          Yêu cầu hủy tài khoản của bạn đã được Admin / HR phê duyệt.
        </Text>

        <View style={styles.countdownBox}>
          <Text style={styles.countdownLabel}>Thời gian tự động xóa vĩnh viễn:</Text>
          <Text style={styles.countdownValue}>{daysLeft} ngày nữa ({scheduledDate})</Text>
        </View>

        <Text style={styles.infoText}>
          Trong thời gian 30 ngày này, bạn có thể bấm hủy yêu cầu xóa bên dưới để khôi phục lại tài khoản và toàn bộ dữ liệu cá nhân của mình.
        </Text>

        <View style={styles.buttonRow}>
          <Pressable style={styles.restoreBtn} onPress={handleCancelDeletion} disabled={isRestoring}>
            {isRestoring ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <MaterialCommunityIcons name="backup-restore" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.restoreBtnText}>Hủy yêu cầu xóa & Khôi phục</Text>
              </>
            )}
          </Pressable>

          <Pressable style={styles.logoutBtn} onPress={handleLogout} disabled={isRestoring}>
            <Text style={styles.logoutBtnText}>Đăng xuất</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  iconBg: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  countdownBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: 14,
    padding: 14,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  countdownLabel: {
    fontSize: 12,
    color: '#991B1B',
    marginBottom: 4,
  },
  countdownValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#DC2626',
  },
  infoText: {
    fontSize: 13,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
  },
  buttonRow: {
    width: '100%',
    gap: 10,
  },
  restoreBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  restoreBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  logoutBtn: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  logoutBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4B5563',
  },
});
