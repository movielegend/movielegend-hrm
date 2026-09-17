import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

let Notifications: any = null;
if (Constants.executionEnvironment !== ExecutionEnvironment.StoreClient) {
  Notifications = require('expo-notifications');
}
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { registerDeviceToken, revokeDeviceToken } from '../api/device-tokens.api';
import { getMyNotifications, getUnreadNotificationCount, markAllNotificationsRead, markNotificationRead } from '../api/notifications.api';
import { markGroupAsRead, fetchMyChatGroups } from '../api/chat.api';
import { queryKeys, chatKeys } from '../constants/queryKeys';
import type { DevicePlatform } from '../types/notification.types';

export function useNotifications() {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.notifications(user?.id),
    queryFn: getMyNotifications,
    enabled: Boolean(user),
  });
}

export function useUnreadNotificationCount() {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.notificationUnreadCount(user?.id),
    queryFn: async () => {
      const res = await getUnreadNotificationCount();
      return typeof res === 'number' ? res : (res as any)?.count ?? 0;
    },
    enabled: Boolean(user?.id),
    refetchInterval: 15_000,
  });
}

export function useUnreadChatCount() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['my-chat-groups-unread-total', user?.id],
    queryFn: fetchMyChatGroups,
    enabled: Boolean(user?.id),
    select: (groups) => groups?.reduce((sum: number, g: any) => sum + (g.unreadCount || 0), 0) || 0,
    refetchInterval: 15_000,
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
  const queryClient = useQueryClient();

  useEffect(() => {
    let responseListener: any = null;
    let isMounted = true;

    const handleNotificationResponse = (response: any) => {
      try {
        const data = response?.notification?.request?.content?.data;
        const actionId = response?.actionIdentifier;
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

        // Tự động đánh dấu đã đọc cho thông báo
        const notifId = data?.notificationId || data?.id;
        if (notifId && notifId !== 'mock') {
          markNotificationRead(notifId)
            .then(() => {
              void queryClient.invalidateQueries({ queryKey: ['notifications'] });
            })
            .catch(() => {});
        }

        // Tự động đánh dấu đã đọc cho nhóm chat nếu đây là thông báo tin nhắn
        const groupId = data?.groupId || (data?.metadata as any)?.groupId;
        if ((data?.type?.startsWith('CHAT_') || data?.type === 'CHAT_MESSAGE') && groupId) {
          markGroupAsRead(groupId)
            .then(() => {
              void queryClient.invalidateQueries({ queryKey: chatKeys.groups() });
            })
            .catch(() => {});
        }

        if (data && data.type) {
          const mockTarget = {
            id: data.notificationId || 'mock',
            notificationId: data.notificationId || 'mock',
            notification: {
              id: data.notificationId,
              type: data.type,
              title: data.title || response?.notification?.request?.content?.title,
              body: data.body || response?.notification?.request?.content?.body,
              taskId: data.taskId,
              metadata: data.metadata,
            },
          };
          const route = require('../utils/notification-routing').notificationRoute(mockTarget, user);
          if (route) {
            router.push(route as any);
            return;
          }
        }

        const base = require('../utils/notification-routing').roleBase(user);
        router.push(`${base}/notifications` as any);
      } catch (e) {
        console.warn('Error handling notification click:', e);
      }
    };

    async function initializePush() {
      try {
        // 1. Setup Android notification channels first
        await setupNotificationChannel();

        // 2. Register device token if user is logged in
        if (user && isMounted) {
          await registerDevice.mutateAsync().catch((err) => {
            console.warn('[PushNotificationSetup] Failed to register device token:', err);
          });
        }

        if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
          console.log('--- Bỏ qua listener push notification vì đang chạy trong Expo Go ---');
          return;
        }

        // 3. Handle cold-start notification (app was killed when notification was tapped)
        if (Notifications && typeof Notifications.getLastNotificationResponseAsync === 'function') {
          try {
            const lastResponse = await Notifications.getLastNotificationResponseAsync();
            if (lastResponse && isMounted) {
              handleNotificationResponse(lastResponse);
            }
          } catch (e) {
            console.warn('[PushNotificationSetup] Error checking last notification response:', e);
          }
        }

        // 4. Listen for notification taps when app is running/backgrounded
        if (Notifications && typeof Notifications.addNotificationResponseReceivedListener === 'function') {
          responseListener = Notifications.addNotificationResponseReceivedListener((response: any) => {
            handleNotificationResponse(response);
          });
        }
      } catch (e) {
        console.warn('Failed notification setup:', e);
      }
    }

    void initializePush();

    return () => {
      isMounted = false;
      if (responseListener && typeof responseListener.remove === 'function') {
        responseListener.remove();
      }
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
  if (!Notifications || Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
    console.log('--- Đang chạy trên Expo Go hoặc không tìm thấy module Notifications, bỏ qua lấy push token ---');
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
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId ??
      '1d0c9c5f-1663-4948-a0f5-59220f806aea';
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
  void queryClient.invalidateQueries({ queryKey: ['notifications'] });
}
