import { Platform } from 'react-native';

const rawApiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.28.184:3001/api/v1';
const rawSocketUrl = process.env.EXPO_PUBLIC_SOCKET_URL || 'http://192.168.28.184:3001';

// Tự động chuyển đổi thông minh:
// 1. Nếu mở giao diện web trên chính máy tính (localhost/127.0.0.1): chuyển sang localhost:3001
// 2. Nếu chạy trên máy ảo Android Emulator: dùng 10.0.2.2
const isWebLocal = Platform.OS === 'web' && typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

export const apiUrl = isWebLocal
  ? rawApiUrl.replace(/http:\/\/[0-9.]+:3001/, 'http://localhost:3001')
  : (Platform.OS === 'android' && rawApiUrl.includes('localhost'))
  ? rawApiUrl.replace('localhost', '10.0.2.2')
  : rawApiUrl;

export const socketUrl = isWebLocal
  ? rawSocketUrl.replace(/http:\/\/[0-9.]+:3001/, 'http://localhost:3001')
  : (Platform.OS === 'android' && rawSocketUrl.includes('localhost'))
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
