import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const GUIDE_VERSION = '1.0';

export interface GuideStatus {
  status: 'viewed' | 'skipped';
  guideVersion: string;
  completedAt: string;
}

export async function getUserGuideStatus(userId: string): Promise<GuideStatus | null> {
  const guideKey = `app_guide_completed_${userId}`;
  try {
    let savedGuideStr: string | null = null;
    if (Platform.OS === 'web') {
      savedGuideStr = localStorage.getItem(guideKey);
    } else {
      savedGuideStr = await SecureStore.getItemAsync(guideKey);
    }

    if (!savedGuideStr) return null;
    return JSON.parse(savedGuideStr) as GuideStatus;
  } catch (error) {
    console.error('Lỗi khi lấy trạng thái User Guide:', error);
    return null;
  }
}

export async function saveUserGuideStatus(userId: string, status: 'viewed' | 'skipped'): Promise<void> {
  const guideKey = `app_guide_completed_${userId}`;
  const data: GuideStatus = {
    status,
    guideVersion: GUIDE_VERSION,
    completedAt: new Date().toISOString(),
  };
  const dataStr = JSON.stringify(data);

  try {
    if (Platform.OS === 'web') {
      localStorage.setItem(guideKey, dataStr);
    } else {
      await SecureStore.setItemAsync(guideKey, dataStr);
    }
  } catch (error) {
    console.error('Lỗi khi lưu trạng thái User Guide:', error);
  }
}

export function isGuideUpToDate(status: GuideStatus | null): boolean {
  if (!status) return false;
  return status.guideVersion === GUIDE_VERSION;
}
