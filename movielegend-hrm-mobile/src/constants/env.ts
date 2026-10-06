import { Platform } from 'react-native';

const rawApiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://180.93.165.243:3000/api/v1';
const rawSocketUrl = process.env.EXPO_PUBLIC_SOCKET_URL || 'http://180.93.165.243:3000';

// Tự động chuyển localhost sang 10.0.2.2 nếu đang chạy trên máy ảo Android Emulator
export const apiUrl = (Platform.OS === 'android' && rawApiUrl.includes('localhost'))
  ? rawApiUrl.replace('localhost', '10.0.2.2')
  : rawApiUrl;

export const socketUrl = (Platform.OS === 'android' && rawSocketUrl.includes('localhost'))
  ? rawSocketUrl.replace('localhost', '10.0.2.2')
  : rawSocketUrl;

export function assertApiUrl(): string {
  if (!apiUrl) {
    throw new Error('EXPO_PUBLIC_API_URL is required');
  }
  return apiUrl;
}

export function assertSocketUrl(): string {
  if (!socketUrl) {
    throw new Error('EXPO_PUBLIC_SOCKET_URL is required');
  }
  return socketUrl;
}
