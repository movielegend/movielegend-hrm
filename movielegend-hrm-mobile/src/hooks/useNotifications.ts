import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

import * as Notifications from 'expo-notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { registerDeviceToken, revokeDeviceToken } from '../api/device-tokens.api';
import { getMyNotifications, getUnreadNotificationCount, markAllNotificationsRead, markNotificationRead } from '../api/notifications.api';
import { queryKeys } from '../constants/queryKeys';
import type { DevicePlatform } from '../types/notification.types';

export function useNotifications() {
  return useQuery({
    queryKey: queryKeys.notifications(),
    queryFn: getMyNotifications,
  });
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: queryKeys.notificationUnreadCount(),
    queryFn: getUnreadNotificationCount,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => invalidateNotifications(queryClient),
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => invalidateNotifications(queryClient),
  });
}

export function useRegisterCurrentDeviceToken() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const token = await getExpoPushTokenIfAvailable();
      if (!token) return null;
      return registerDeviceToken({ token, platform: platformForDevice(), deviceId: Platform.OS });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications() });
    },
  });
}

import { useEffect } from 'react';
import { useAuth } from '../providers/AuthProvider';
import { useRouter } from 'expo-router';
import { setupNotificationChannel } from '../services/NotificationService';

export function usePushNotificationSetup() {
  const { user } = useAuth();
  const registerDevice = useRegisterCurrentDeviceToken();
  const router = useRouter();

  useEffect(() => {
    // Setup Android notification channel
    setupNotificationChannel();

    if (user) {
      registerDevice.mutateAsync().catch(console.error);
    }

    // Lắng nghe sự kiện người dùng bấm vào thông báo
    const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      console.log('--- Người dùng bấm vào thông báo. Data:', data);
      
      // Xử lý logic điều hướng dựa theo payload data từ backend gửi về
      if (data && data.route) {
        // Ví dụ backend gửi: { "route": "/employee/tasks/123" }
        router.push(data.route as any);
      } else if (data && data.type) {
        // Hoặc backend gửi { "type": "TASK", "id": "123" }
        switch (data.type) {
          case 'TASK':
            if (data.id) router.push(`/employee/tasks/${data.id}` as any);
            break;
          case 'SHIFT':
            if (data.id) router.push(`/employee/shifts` as any); // Chuyển tạm tới shifts list
            break;
        }
      }
    });

    return () => {
      responseListener.remove();
    };
  }, [user?.id]); // Only run when user logs in or changes
}

export function useRevokeDeviceToken() {
  return useMutation({
    mutationFn: (id: string) => revokeDeviceToken(id),
  });
}

async function getExpoPushTokenIfAvailable(): Promise<string | null> {
  console.log('--- Đang gọi getExpoPushTokenIfAvailable... ---');
  if (!Notifications) {
    console.log('--- Không tìm thấy module Notifications ---');
    return null;
  }
  const existing = await Notifications.getPermissionsAsync();
  console.log('--- Quyền Push Notification hiện tại: ', existing.status);
  const finalStatus = existing.granted ? existing.status : (await Notifications.requestPermissionsAsync()).status;
  if (finalStatus !== 'granted') {
    console.log('--- Người dùng không cấp quyền Push Notification ---');
    return null;
  }
  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    console.log('--- Project ID đang dùng: ', projectId);
    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    console.log('\n\n==================================');
    console.log('====== YOUR EXPO PUSH TOKEN ======');
    console.log(token.data);
    console.log('==================================\n\n');
    return token.data;
  } catch (error) {
    console.log('--- Lỗi khi lấy Expo Push Token: ', error);
    return null;
  }
}

function platformForDevice(): DevicePlatform {
  if (Platform.OS === 'ios') return 'IOS';
  if (Platform.OS === 'android') return 'ANDROID';
  return 'WEB';
}

function invalidateNotifications(queryClient: ReturnType<typeof useQueryClient>): void {
  void queryClient.invalidateQueries({ queryKey: queryKeys.notifications() });
  void queryClient.invalidateQueries({ queryKey: queryKeys.notificationUnreadCount() });
}
