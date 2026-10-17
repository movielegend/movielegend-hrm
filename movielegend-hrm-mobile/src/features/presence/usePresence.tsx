import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';
import { fetchBatchPresenceApi, PresenceInfo } from '../../api/presence.api';

type PresenceMap = Record<string, PresenceInfo>;

let presenceCache: PresenceMap = {};
const listeners = new Set<() => void>();

export function updatePresenceItem(userId: string, isOnline: boolean, lastActiveAt?: string | null): void {
  if (!userId) return;
  presenceCache = {
    ...presenceCache,
    [userId]: {
      isOnline,
      lastActiveAt: lastActiveAt !== undefined ? lastActiveAt : (presenceCache[userId]?.lastActiveAt ?? null),
    },
  };
  listeners.forEach((listener) => listener());
}

export function updatePresenceBatch(batch: Record<string, PresenceInfo>): void {
  if (!batch || Object.keys(batch).length === 0) return;
  presenceCache = {
    ...presenceCache,
    ...batch,
  };
  listeners.forEach((listener) => listener());
}

export function getCachedPresence(userId?: string | null): PresenceInfo {
  if (!userId) return { isOnline: false, lastActiveAt: null };
  return presenceCache[userId] || { isOnline: false, lastActiveAt: null };
}

export function formatLastActiveText(status?: PresenceInfo | null): string {
  if (!status) return '';
  if (status.isOnline) return 'Đang hoạt động';
  if (!status.lastActiveAt) return '';

  const date = new Date(status.lastActiveAt);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  if (isNaN(diffMs) || diffMs < 0) return '';

  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes < 1) return 'Vừa mới truy cập';
  if (diffMinutes < 60) return `Hoạt động ${diffMinutes} phút trước`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `Hoạt động ${diffHours} giờ trước`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Hoạt động hôm qua';
  if (diffDays < 7) return `Hoạt động ${diffDays} ngày trước`;

  return `Hoạt động ${date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}`;
}

/**
 * Main hook to observe presence for any users across the app.
 */
export function usePresence() {
  const [presence, setPresence] = useState<PresenceMap>(() => ({ ...presenceCache }));

  useEffect(() => {
    const handleUpdate = () => setPresence({ ...presenceCache });
    listeners.add(handleUpdate);
    return () => {
      listeners.delete(handleUpdate);
    };
  }, []);

  const getStatus = useCallback(
    (userId?: string | null): PresenceInfo => {
      if (!userId) return { isOnline: false, lastActiveAt: null };
      return presence[userId] || { isOnline: false, lastActiveAt: null };
    },
    [presence]
  );

  const formatPresence = useCallback(
    (userId?: string | null): string => {
      if (!userId) return '';
      return formatLastActiveText(getStatus(userId));
    },
    [getStatus]
  );

  return {
    presence,
    getStatus,
    formatPresence,
  };
}

/**
 * Hook to request batch presence for a specific list of user IDs (e.g. leaders, chat members, colleagues)
 */
export function useBatchPresence(userIds: (string | undefined | null)[]) {
  const { presence, getStatus, formatPresence } = usePresence();

  const serializedIds = useMemo(() => {
    const unique = Array.from(new Set(userIds.filter((id): id is string => Boolean(id))));
    unique.sort();
    return unique.join(',');
  }, [userIds]);

  useEffect(() => {
    if (!serializedIds) return;
    const ids = serializedIds.split(',');
    let isCancelled = false;

    fetchBatchPresenceApi(ids)
      .then((batch) => {
        if (!isCancelled && batch) {
          updatePresenceBatch(batch);
        }
      })
      .catch((err) => {
        console.warn('Failed to fetch batch presence:', err);
      });

    return () => {
      isCancelled = true;
    };
  }, [serializedIds]);

  return {
    presence,
    getStatus,
    formatPresence,
  };
}

/**
 * Reusable Green Online Dot component
 */
export function PresenceDot({
  isOnline,
  size = 12,
  style,
}: {
  isOnline?: boolean;
  size?: number;
  style?: StyleProp<ViewStyle>;
}) {
  if (!isOnline) return null;
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: '#22C55E',
          borderWidth: 2,
          borderColor: '#FFFFFF',
        },
        style,
      ]}
    />
  );
}
