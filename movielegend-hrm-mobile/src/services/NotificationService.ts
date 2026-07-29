import Constants, { ExecutionEnvironment } from 'expo-constants';
let Notifications: any = null;
if (Constants.executionEnvironment !== ExecutionEnvironment.StoreClient) {
  Notifications = require('expo-notifications');
}
import type { ShiftAssignment } from '../types/shift.types';
import type { TaskDto } from '../types/task.types';

// Cấu hình cách hiển thị thông báo khi app đang mở (Bọc try-catch an toàn cho bản build Sideload)
if (Notifications) {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch (e) {
    console.warn('Notification handler init skipped:', e);
  }
}

import { Platform } from 'react-native';

export async function setupNotificationChannel() {
  if (!Notifications) return;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Thông báo chung',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#3B82F6',
    });
  }
  // Also setup the incoming calls channel
  try {
    const { setupCallNotificationChannel } = require('./call-notification');
    await setupCallNotificationChannel();
  } catch (e) {
    console.warn('Failed to setup call notification channel:', e);
  }
}

export async function requestNotificationPermissions() {
  if (!Notifications) return false;
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  return finalStatus === 'granted';
}

export async function scheduleShiftNotifications(schedule: ShiftAssignment[]) {
  if (!Notifications) return;
  const granted = await requestNotificationPermissions();
  if (!granted) return;

  // Chỉ xóa các lịch báo thuộc về ca làm việc (bắt đầu bằng shift_)
  const allScheduled = await Notifications.getAllScheduledNotificationsAsync();
  const shiftNotifs = allScheduled.filter((n: any) => n.identifier.startsWith('shift_'));
  for (const n of shiftNotifs) {
    await Notifications.cancelScheduledNotificationAsync(n.identifier);
  }

  const now = new Date();

  for (const item of schedule) {
    if (!item.shift) continue;

    const startParts = item.shift.startTime.split(':');
    const startHour = Number(startParts[0] || 0);
    const startMinute = Number(startParts[1] || 0);

    const endParts = item.shift.endTime.split(':');
    const endHour = Number(endParts[0] || 0);
    const endMinute = Number(endParts[1] || 0);

    const shiftDate = new Date(item.workDate);
    
    // Nhắc trước khi Vào ca 15 phút
    const checkInTime = new Date(shiftDate);
    checkInTime.setHours(startHour, startMinute - 15, 0, 0);

    if (checkInTime > now) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Sắp tới giờ vào ca',
          body: `Ca làm việc của bạn sẽ bắt đầu lúc ${item.shift.startTime}. Hãy nhớ check-in nhé!`,
          sound: true,
        },
        identifier: `shift_${item.id}_checkin`,
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: checkInTime },
      });
    }

    // Nhắc trước khi Ra ca 15 phút
    const checkOutTime = new Date(shiftDate);
    checkOutTime.setHours(endHour, endMinute - 15, 0, 0);

    if (checkOutTime > now) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Sắp hết ca làm việc',
          body: `Ca làm việc của bạn sẽ kết thúc lúc ${item.shift.endTime}. Hãy nhớ check-out nhé!`,
          sound: true,
        },
        identifier: `shift_${item.id}_checkout`,
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: checkOutTime },
      });
    }
  }
}

export async function scheduleTaskNotifications(tasks: TaskDto[]) {
  if (!Notifications) return;
  const granted = await requestNotificationPermissions();
  if (!granted) return;

  // Chỉ xóa các lịch báo thuộc về Task (bắt đầu bằng task_)
  const allScheduled = await Notifications.getAllScheduledNotificationsAsync();
  const taskNotifs = allScheduled.filter((n: any) => n.identifier.startsWith('task_'));
  for (const n of taskNotifs) {
    await Notifications.cancelScheduledNotificationAsync(n.identifier);
  }

  const now = new Date();

  for (const task of tasks) {
    if (!task.dueAt) continue;

    const dueTime = new Date(task.dueAt);
    
    // Nhắc trước khi tới hạn 1 tiếng (hoặc 30 phút, ở đây mình set 1 tiếng)
    const remindTime = new Date(dueTime);
    remindTime.setHours(remindTime.getHours() - 1);

    // Nếu thời gian nhắc nhở lớn hơn hiện tại
    const isPending = task.status === 'NEW' || task.status === 'ACCEPTED' || task.status === 'IN_PROGRESS' || task.status === 'WAITING_REVIEW' || task.status === 'REJECTED';
    if (remindTime > now && isPending) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Nhắc nhở công việc sắp tới hạn',
          body: `Công việc "${task.title}" sẽ tới hạn vào ${dueTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}. Vui lòng cập nhật tiến độ!`,
          sound: true,
        },
        identifier: `task_${task.id}_deadline`,
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: remindTime },
      });
    }
  }
}
