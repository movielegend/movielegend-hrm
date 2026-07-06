import { render, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';
import { AuthProvider, useAuth } from '../src/providers/AuthProvider';
import { makeUser } from '../test/test-utils';

jest.mock('../src/api/client', () => ({
  setAuthExpiredHandler: jest.fn(),
}));

jest.mock('../src/api/auth.api', () => ({
  loginApi: jest.fn(),
  logoutApi: jest.fn(),
  meApi: jest.fn(),
  refreshApi: jest.fn(),
}));

jest.mock('../src/storage/secure-token.storage', () => ({
  clearTokens: jest.fn(),
  getAccessToken: jest.fn(),
  getRefreshToken: jest.fn(),
  setAccessToken: jest.fn(),
  setRefreshToken: jest.fn(),
}));

import { meApi, refreshApi } from '../src/api/auth.api';
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
} from '../src/storage/secure-token.storage';

function AuthProbe() {
  const auth = useAuth();
  return <Text>{auth.isLoading ? 'loading' : auth.user?.roles[0] ?? 'guest'}</Text>;
}

describe('AuthProvider session restore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('restores app session from existing access token', async () => {
    jest.mocked(getAccessToken).mockResolvedValue('access-token');
    jest.mocked(meApi).mockResolvedValue(makeUser(['ADMIN']));

    const view = await render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    await waitFor(() => expect(view.getByText('ADMIN')).toBeTruthy());
    expect(meApi).toHaveBeenCalledTimes(1);
  });

  it('uses refresh flow when only refresh token exists', async () => {
    jest.mocked(getAccessToken).mockResolvedValue(null);
    jest.mocked(getRefreshToken).mockResolvedValue('refresh-token');
    jest.mocked(refreshApi).mockResolvedValue({ accessToken: 'new-access', refreshToken: 'new-refresh' });
    jest.mocked(meApi).mockResolvedValue(makeUser(['LEADER']));

    const view = await render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    await waitFor(() => expect(view.getByText('LEADER')).toBeTruthy());
    expect(setAccessToken).toHaveBeenCalledWith('new-access');
    expect(setRefreshToken).toHaveBeenCalledWith('new-refresh');
  });

  it('logs out when refresh failure happens during restore', async () => {
    jest.mocked(getAccessToken).mockResolvedValue(null);
    jest.mocked(getRefreshToken).mockResolvedValue('bad-refresh');
    jest.mocked(refreshApi).mockRejectedValue(new Error('refresh failed'));

    const view = await render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    await waitFor(() => expect(view.getByText('guest')).toBeTruthy());
    expect(clearTokens).toHaveBeenCalled();
  });
});
