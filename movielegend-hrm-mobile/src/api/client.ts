import axios, {
  AxiosError,
  AxiosHeaders,
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import { assertApiUrl } from '../constants/env';
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
} from '../storage/secure-token.storage';
import type { ApiResponse } from '../types/api.types';
import type { RefreshResponse } from '../types/auth.types';

interface RetriableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

let refreshPromise: Promise<string | null> | null = null;
let authExpiredHandler: (() => void) | null = null;

export function setAuthExpiredHandler(handler: (() => void) | null): void {
  authExpiredHandler = handler;
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: assertApiUrl(),
  timeout: 15_000,
});

const refreshClient = axios.create({
  baseURL: assertApiUrl(),
  timeout: 15_000,
});

apiClient.interceptors.request.use(async (config) => {
  const token = await getAccessToken();
  if (token) {
    const headers = AxiosHeaders.from(config.headers);
    headers.set('Authorization', `Bearer ${token}`);
    config.headers = headers;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiResponse<unknown>>) => {
    const originalRequest = error.config as RetriableRequestConfig | undefined;
    if (error.response?.status !== 401 || !originalRequest || originalRequest._retry) {
      throw error;
    }

    originalRequest._retry = true;
    const token = await refreshTokensWithSingleFlight();
    if (!token) {
      authExpiredHandler?.();
      throw error;
    }

    const headers = AxiosHeaders.from(originalRequest.headers);
    headers.set('Authorization', `Bearer ${token}`);
    originalRequest.headers = headers;
    return apiClient.request(originalRequest);
  },
);

export function unwrapData<T>(response: AxiosResponse<ApiResponse<T>>): T {
  if (response.data.success) return response.data.data;
  throw new Error(response.data.error.message);
}

async function refreshTokensWithSingleFlight(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = refreshTokens().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

async function refreshTokens(): Promise<string | null> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) {
    await clearTokens();
    return null;
  }

  try {
    const response = await refreshClient.post<ApiResponse<RefreshResponse>>('/auth/refresh', {
      refreshToken,
    });
    const payload = unwrapData(response);
    await Promise.all([setAccessToken(payload.accessToken), setRefreshToken(payload.refreshToken)]);
    return payload.accessToken;
  } catch {
    await clearTokens();
    return null;
  }
}
