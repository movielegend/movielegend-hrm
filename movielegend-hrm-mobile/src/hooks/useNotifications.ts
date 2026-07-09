import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

let Notifications: any = null;
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
if (!isExpoGo) {
  try {
    Notifications = require('expo-notifications');
  } catch (error) {
    console.warn('expo-notifications requires a dev build', error);
  }
}
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

export function useRevokeDeviceToken() {
  return useMutation({
    mutationFn: (id: string) => revokeDeviceToken(id),
  });
}

async function getExpoPushTokenIfAvailable(): Promise<string | null> {
  if (!Notifications) return null;
  const existing = await Notifications.getPermissionsAsync();
  const finalStatus = existing.granted ? existing.status : (await Notifications.requestPermissionsAsync()).status;
  if (finalStatus !== 'granted') return null;
  try {
    const token = await Notifications.getExpoPushTokenAsync();
    return token.data;
  } catch {
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
