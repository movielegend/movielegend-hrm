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
    try {
      // Setup Android notification channel
      setupNotificationChannel();

      if (user) {
        registerDevice.mutateAsync().catch(console.error);
      }

      // Lắng nghe sự kiện người dùng bấm vào thông báo
      const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
        try {
          const data = response.notification.request.content.data;
          const actionId = response.actionIdentifier;
          console.log('--- Người dùng bấm vào thông báo. Data:', data, 'Action:', actionId);
          
          // Handle voice call notification tap
          if (data && data.type === 'VOICE_CALL_INCOMING') {
            const { DeviceEventEmitter } = require('react-native');
            if (actionId === 'ACCEPT') {
              DeviceEventEmitter.emit('voice_call:action_accept', data.callerId);
            } else if (actionId === 'REJECT') {
              DeviceEventEmitter.emit('voice_call:action_reject', data.callerId);
            } else {
              // Just opened the notification
              DeviceEventEmitter.emit('voice_call:action_open', data);
            }
            return;
          }
          
          if (data && data.type) {
            const mockTarget = {
              notification: {
                id: data.notificationId,
                type: data.type,
                taskId: data.taskId,
                metadata: data.metadata,
              }
            };
            const route = require('../utils/notification-routing').notificationRoute(mockTarget, user);
            if (route) {
              router.push(route as any);
              return;
            }
          }
          
          router.push('/(tabs)/notifications');
        } catch (e) {
          console.warn('Error handling notification click:', e);
        }
      });

      return () => {
        responseListener.remove();
      };
    } catch (e) {
      console.warn('Failed notification setup:', e);
    }
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
