import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const CALL_NOTIFICATION_ID = 'incoming_voice_call';

/**
 * Setup the "incoming_calls" notification channel on Android
 * with maximum importance, custom vibration pattern, and lights.
 */
export async function setupCallNotificationChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('incoming_calls_v3', {
      name: 'Cuộc gọi đến',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 500, 200, 500, 200, 500],
      lightColor: '#22c55e',
      sound: 'ringtone.wav',
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: true,
      enableLights: true,
      enableVibrate: true,
    });
  }

  await Notifications.setNotificationCategoryAsync('VOICE_CALL_INCOMING', [
    {
      identifier: 'ACCEPT',
      buttonTitle: 'Nghe',
      options: {
        opensAppToForeground: true,
      },
    },
    {
      identifier: 'REJECT',
      buttonTitle: 'Từ chối',
      options: {
        isDestructive: true,
        opensAppToForeground: true,
      },
    },
  ]);
}

/**
 * Show a high-priority local notification for an incoming call.
 * Auto-dismissed after 40 seconds if not interacted with.
 */
export async function showIncomingCallNotification(callerName: string, callerId: string, callerAvatar?: string | null) {
  try {
    await Notifications.scheduleNotificationAsync({
      identifier: CALL_NOTIFICATION_ID,
      content: {
        title: '📞 Cuộc gọi đến',
        body: `${callerName} đang gọi cho bạn`,
        sound: 'ringtone.wav',
        priority: Notifications.AndroidNotificationPriority.MAX,
        sticky: true,
        categoryIdentifier: 'VOICE_CALL_INCOMING',
        data: {
          type: 'VOICE_CALL_INCOMING',
          callerId,
          callerName,
          callerAvatar: callerAvatar || null,
        },
        ...(Platform.OS === 'android' ? { channelId: 'incoming_calls_v3' } : {}),
      },
      trigger: null, // Show immediately
    });

    // Auto-dismiss after 40s
    setTimeout(() => {
      dismissCallNotification();
    }, 40000);
  } catch (e) {
    console.warn('[CallNotification] Failed to show notification:', e);
  }
}

/**
 * Dismiss the incoming call notification.
 */
export async function dismissCallNotification() {
  try {
    await Notifications.dismissNotificationAsync(CALL_NOTIFICATION_ID);
  } catch (e) {
    // Notification may already be dismissed
  }
}
