import { apiClient, unwrapData } from './client';
import type { ApiResponse } from '../types/api.types';
import { CORE_APP_KEYS } from '../constants/app-registry';

export interface PinnedAppsResponse {
  isCustomized: boolean;
  pinnedApps: string[];
}

export async function getMyPinnedAppsApi(): Promise<PinnedAppsResponse> {
  try {
    const response = await apiClient.get<ApiResponse<PinnedAppsResponse>>('/users/me/pinned-apps');
    return unwrapData(response);
  } catch (error) {
    return {
      isCustomized: false,
      pinnedApps: [...CORE_APP_KEYS],
    };
  }
}

export async function updateMyPinnedAppsApi(appKeys: string[]): Promise<PinnedAppsResponse> {
  const response = await apiClient.put<ApiResponse<PinnedAppsResponse>>('/users/me/pinned-apps', { appKeys });
  return unwrapData(response);
}

export async function resetMyPinnedAppsApi(): Promise<PinnedAppsResponse> {
  const response = await apiClient.post<ApiResponse<PinnedAppsResponse>>('/users/me/pinned-apps/reset');
  return unwrapData(response);
}
