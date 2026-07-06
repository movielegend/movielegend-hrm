import * as SecureStore from 'expo-secure-store';
import { clearTokens, setAccessToken, setRefreshToken } from '../src/storage/secure-token.storage';

describe('secure token storage', () => {
  it('stores tokens in expo-secure-store', async () => {
    await setAccessToken('access-token');
    await setRefreshToken('refresh-token');

    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('movielegend.accessToken', 'access-token');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('movielegend.refreshToken', 'refresh-token');
  });

  it('clears both tokens', async () => {
    await clearTokens();

    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('movielegend.accessToken');
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('movielegend.refreshToken');
  });
});
