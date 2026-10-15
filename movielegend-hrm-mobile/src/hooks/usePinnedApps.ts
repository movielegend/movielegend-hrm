import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../providers/AuthProvider';
import {
  getMyPinnedAppsApi,
  updateMyPinnedAppsApi,
  resetMyPinnedAppsApi,
  PinnedAppsResponse,
} from '../api/pinned-apps.api';
import { CORE_APP_KEYS, APP_REGISTRY, AppRegistryItem, isUserInLiveDepartment, isAppAllowedForRole } from '../constants/app-registry';
import { useMemo } from 'react';

function resolveUserRole(user: any): 'ADMIN' | 'LEADER' | 'EMPLOYEE' | 'HR' {
  if (!user?.roles || !Array.isArray(user.roles)) return 'EMPLOYEE';
  const roleStrings = user.roles.map((r: any) =>
    (typeof r === 'string' ? r : r?.code || r?.name || '').toUpperCase()
  );
  if (roleStrings.some((r: string) => r.includes('ADMIN'))) return 'ADMIN';
  if (roleStrings.some((r: string) => r.includes('HR'))) return 'HR';
  if (roleStrings.some((r: string) => r.includes('LEADER'))) return 'LEADER';
  return 'EMPLOYEE';
}

export function usePinnedApps(roleOverride?: 'ADMIN' | 'LEADER' | 'EMPLOYEE' | 'HR') {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const queryKey = useMemo(() => ['my-pinned-apps', user?.id], [user?.id]);

  const { data, isLoading, refetch } = useQuery<PinnedAppsResponse>({
    queryKey,
    queryFn: getMyPinnedAppsApi,
    enabled: Boolean(user?.id),
    staleTime: 1000 * 60 * 5, // 5 phút
  });

  const updateMutation = useMutation({
    mutationFn: (appKeys: string[]) => updateMyPinnedAppsApi(appKeys),
    onSuccess: (newData) => {
      queryClient.setQueryData(queryKey, newData);
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const resetMutation = useMutation({
    mutationFn: resetMyPinnedAppsApi,
    onSuccess: (newData) => {
      queryClient.setQueryData(queryKey, newData);
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // Toàn bộ các keys đã ghim (tối thiểu 4 app, tự động lọc theo vai trò)
  const pinnedKeys = useMemo(() => {
    const role = roleOverride || resolveUserRole(user);
    let rawKeys = data?.pinnedApps && data.pinnedApps.length >= 4
      ? data.pinnedApps
      : [...CORE_APP_KEYS];

    // Nếu chưa tùy chỉnh, đảm bảo có attendance_history
    if (!data?.isCustomized && !rawKeys.includes('attendance_history')) {
      const attIndex = rawKeys.indexOf('attendance');
      if (attIndex !== -1) {
        rawKeys = [...rawKeys.slice(0, attIndex + 1), 'attendance_history', ...rawKeys.slice(attIndex + 1)];
      } else {
        rawKeys = ['attendance_history', ...rawKeys];
      }
    }

    const valid = rawKeys.filter(k => {
      const item = APP_REGISTRY[k];
      if (!item) return false;
      return isAppAllowedForRole(item, role, user);
    });

    const fallbackCore = CORE_APP_KEYS.filter(k => {
      const item = APP_REGISTRY[k];
      return item && isAppAllowedForRole(item, role, user);
    });

    if (valid.length >= 4) return valid;
    const merged = Array.from(new Set([...valid, ...fallbackCore]));
    return merged.length >= 4 ? merged : fallbackCore;
  }, [data?.pinnedApps, user, roleOverride]);

  // Danh sách các AppRegistryItem đầy đủ
  const allPinnedApps = useMemo(() => {
    return pinnedKeys.map(key => APP_REGISTRY[key]).filter(Boolean) as AppRegistryItem[];
  }, [pinnedKeys]);

  // Hàng 1: 4 app đầu tiên (luôn hiển thị trên 1 dòng)
  const row1Apps = useMemo(() => {
    return allPinnedApps.slice(0, 4);
  }, [allPinnedApps]);

  // Các app từ app thứ 5 trở đi (hiển thị khi dropdown xuống)
  const extraPinnedApps = useMemo(() => {
    return allPinnedApps.slice(4);
  }, [allPinnedApps]);

  return {
    pinnedKeys,
    allPinnedApps,
    row1Apps,
    extraPinnedApps,
    isCustomized: data?.isCustomized ?? false,
    isLoading,
    refetch,
    updatePinnedApps: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    resetPinnedApps: resetMutation.mutateAsync,
    isResetting: resetMutation.isPending,
  };
}
