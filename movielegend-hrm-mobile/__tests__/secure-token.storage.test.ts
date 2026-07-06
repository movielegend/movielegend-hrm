import * as SecureStore from 'expo-secure-store';
import { clearTokens, setAccessToken, setRefreshToken } from '../src/storage/secure-token.storage';

describe('secure token storage', () => {
  it('stores tokens in expo-secure-store', async () => {
    await setAccessToken('access-token');
    await setRefreshToken('refresh-token');

    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('access_token', 'access-token');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('refresh_token', 'refresh-token');
  });

  it('clears both tokens', async () => {
    await clearTokens();

    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('access_token');
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('refresh_token');
  });
});
