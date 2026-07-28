export const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.28.182:3001/api/v1';
export const socketUrl = process.env.EXPO_PUBLIC_SOCKET_URL || 'http://192.168.28.182:3001';
// export const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://glimmer-icky-status.ngrok-free.dev/api/v1';
// export const socketUrl = process.env.EXPO_PUBLIC_SOCKET_URL || 'https://glimmer-icky-status.ngrok-free.dev';
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
