import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { apiClient } from '../src/api/client';
import { getDashboardByRole } from '../src/api/dashboard.api';

describe('dashboard api', () => {
  const originalAdapter = apiClient.defaults.adapter;

  afterEach(() => {
    if (originalAdapter) {
      apiClient.defaults.adapter = originalAdapter;
    } else {
      delete apiClient.defaults.adapter;
    }
  });

  it('sends dashboard authenticated request with bearer token', async () => {
    jest.mocked(SecureStore.getItemAsync).mockResolvedValue('access-token');
    const adapter: AxiosAdapter = async (config: InternalAxiosRequestConfig) => {
      expect(config.url).toBe('/dashboard/admin');
      expect(config.headers.get('Authorization')).toBe('Bearer access-token');
      return {
        config,
        data: { success: true, data: { totalEmployees: 12 } },
        headers: {},
        status: 200,
        statusText: 'OK',
      } satisfies AxiosResponse;
    };
    apiClient.defaults.adapter = adapter;

    await expect(getDashboardByRole('ADMIN')).resolves.toEqual({ totalEmployees: 12 });
  });
});
