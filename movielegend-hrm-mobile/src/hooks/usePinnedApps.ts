import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../providers/AuthProvider';
import {
  getMyPinnedAppsApi,
  updateMyPinnedAppsApi,
  resetMyPinnedAppsApi,
  PinnedAppsResponse,
} from '../api/pinned-apps.api';
import { CORE_APP_KEYS, APP_REGISTRY, AppRegistryItem } from '../constants/app-registry';
import { useMemo } from 'react';

export function usePinnedApps() {
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

  // Toàn bộ các keys đã ghim (tối thiểu 4 app, mặc định là 4 core apps)
  const pinnedKeys = useMemo(() => {
    const rawKeys = data?.pinnedApps && data.pinnedApps.length >= 4
      ? data.pinnedApps
      : [...CORE_APP_KEYS];
    const valid = rawKeys.filter(k => Boolean(APP_REGISTRY[k]));
    return valid.length >= 4 ? valid : [...CORE_APP_KEYS];
  }, [data?.pinnedApps]);

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
