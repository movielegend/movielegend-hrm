export const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://movielegend-hrm.onrender.com/api/v1';
export const socketUrl = process.env.EXPO_PUBLIC_SOCKET_URL || 'https://movielegend-hrm.onrender.com';

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
