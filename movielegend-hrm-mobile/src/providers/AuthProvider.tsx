import { PropsWithChildren, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { setAuthExpiredHandler } from '../api/client';
import { loginApi, logoutApi, meApi, refreshApi } from '../api/auth.api';
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
} from '../storage/secure-token.storage';
import type { AuthContextValue, LoginPayload } from '../types/auth.types';
import type { AuthUser } from '../types/user.types';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) {
      await clearTokens();
      setUser(null);
      return false;
    }

    try {
      const tokens = await refreshApi(refreshToken);
      await Promise.all([setAccessToken(tokens.accessToken), setRefreshToken(tokens.refreshToken)]);
      return true;
    } catch {
      await clearTokens();
      setUser(null);
      return false;
    }
  }, []);

  const reloadProfile = useCallback(async () => {
    try {
      const profile = await meApi();
      setUser(profile);
      return profile;
    } catch {
      const refreshed = await refreshSession();
      if (!refreshed) return null;
      const profile = await meApi();
      setUser(profile);
      return profile;
    }
  }, [refreshSession]);

  const login = useCallback(async (payload: LoginPayload) => {
    const response = await loginApi(payload);
    await Promise.all([setAccessToken(response.accessToken), setRefreshToken(response.refreshToken)]);
    setUser(response.user);
    return response.user;
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = await getRefreshToken();
    try {
      if (refreshToken) {
        await logoutApi({ refreshToken });
      }
    } finally {
      await clearTokens();
      setUser(null);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    setAuthExpiredHandler(() => {
      void clearTokens();
      if (mounted) setUser(null);
    });

    async function restoreSession() {
      try {
        const accessToken = await getAccessToken();
        if (accessToken) {
          await reloadProfile();
          return;
        }
        const refreshed = await refreshSession();
        if (refreshed) await reloadProfile();
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    void restoreSession();
    return () => {
      mounted = false;
      setAuthExpiredHandler(null);
    };
  }, [refreshSession, reloadProfile]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      logout,
      refreshSession,
      reloadProfile,
    }),
    [isLoading, login, logout, refreshSession, reloadProfile, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
