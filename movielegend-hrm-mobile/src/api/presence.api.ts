import { apiClient } from './client';

export interface PresenceInfo {
  isOnline: boolean;
  lastActiveAt: string | null;
}

export type BatchPresenceResponse = Record<string, PresenceInfo>;

export async function fetchBatchPresenceApi(userIds: string[]): Promise<BatchPresenceResponse> {
  if (!userIds || userIds.length === 0) return {};
  const { data } = await apiClient.post<BatchPresenceResponse>('/realtime/presence/batch', {
    userIds,
  });
  return data || {};
}

export async function fetchOnlineUsersApi(): Promise<string[]> {
  const { data } = await apiClient.get<string[]>('/realtime/presence/online-users');
  return data || [];
}
