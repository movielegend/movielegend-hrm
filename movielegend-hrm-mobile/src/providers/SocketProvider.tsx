import { PropsWithChildren, createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import type { Socket } from 'socket.io-client';
import { createHrmSocket } from '../api/socket';
import { queryKeys } from '../constants/queryKeys';
import { useAuth } from './AuthProvider';
import type { CrossDepartmentSocketPayload, TaskSocketPayload } from '../types/socket.types';
import Toast from 'react-native-toast-message';
import {
  invalidateForAssetAssigned,
  invalidateForAssetReturnUpdated,
  invalidateForIncidentUpdated,
  invalidateForInventoryUpdated,
  invalidateForIssueUpdated,
  invalidateForStockUpdated,
  type AssetSocketPayload,
  type IncidentSocketPayload,
  type MaterialIssueSocketPayload,
  type WarehouseSocketPayload,
} from '../features/warehouses/warehouse-events';

interface SocketContextValue {
  isConnected: boolean;
  joinWarehouseRoom: (warehouseId: string) => void;
}

const SocketContext = createContext<SocketContextValue>({ isConnected: false, joinWarehouseRoom: () => undefined });

export function SocketProvider({ children }: PropsWithChildren) {
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);
  const joinedWarehouseIds = useRef<Set<string>>(new Set());
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let disposed = false;
    let socket: Socket | null = null;

    async function connect() {
      if (!isAuthenticated || !user) return;
      socket = await createHrmSocket();
      if (disposed) {
        socket.disconnect();
        return;
      }
      socketRef.current = socket;
      socket.on('connect', () => setIsConnected(true));
      socket.on('disconnect', () => setIsConnected(false));
      socket.on('connect_error', () => setIsConnected(false));
      socket.on('task:assigned', (payload: TaskSocketPayload) => invalidateTaskEvent(queryClient, payload));
      socket.on('task:updated', (payload: TaskSocketPayload) => invalidateTaskEvent(queryClient, payload));
      socket.on('task:commented', (payload: TaskSocketPayload) => invalidateTaskEvent(queryClient, payload));
      socket.on('task:submitted', (payload: TaskSocketPayload) => invalidateTaskEvent(queryClient, payload));
      socket.on('task:reviewed', (payload: TaskSocketPayload) => invalidateTaskEvent(queryClient, payload));
      socket.on('notification.created', (payload?: any) => {
        void queryClient.invalidateQueries({ queryKey: queryKeys.notifications() });
        void queryClient.invalidateQueries({ queryKey: queryKeys.notificationUnreadCount() });
        
        Toast.show({
          type: 'info',
          text1: payload?.title || 'Thông báo mới',
          text2: payload?.content || 'Bạn có một thông báo mới từ hệ thống.',
          position: 'top',
          visibilityTime: 4000,
        });
      });
      socket.on('cross-department:updated', (payload: CrossDepartmentSocketPayload) => {
        void queryClient.invalidateQueries({ queryKey: ['cross-department-requests'] });
        if (payload.requestId) void queryClient.invalidateQueries({ queryKey: queryKeys.crossDepartmentRequest(payload.requestId) });
      });
      socket.on('warehouse:stock-updated', (payload: WarehouseSocketPayload) => invalidateForStockUpdated(queryClient, payload));
      socket.on('material:issue-updated', (payload: MaterialIssueSocketPayload) => invalidateForIssueUpdated(queryClient, payload));
      socket.on('inventory:updated', (payload: WarehouseSocketPayload) => invalidateForInventoryUpdated(queryClient, payload));
      socket.on('asset:assigned', (payload: AssetSocketPayload) => invalidateForAssetAssigned(queryClient, payload));
      socket.on('asset:return-updated', (payload: AssetSocketPayload) => invalidateForAssetReturnUpdated(queryClient, payload));
      socket.on('asset:incident-updated', (payload: IncidentSocketPayload) => invalidateForIncidentUpdated(queryClient, payload));
      socket.connect();
    }

    void connect();
    return () => {
      disposed = true;
      setIsConnected(false);
      socket?.removeAllListeners();
      socket?.disconnect();
      if (socketRef.current === socket) socketRef.current = null;
      joinedWarehouseIds.current.clear();
    };
  }, [isAuthenticated, queryClient, user]);

  useEffect(() => {
    function refreshOnForeground(nextState: AppStateStatus) {
      if (nextState !== 'active' || !isAuthenticated) return;
      void queryClient.invalidateQueries({ queryKey: ['tasks', 'me'] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.notificationUnreadCount() });
    }
    const subscription = AppState.addEventListener('change', refreshOnForeground);
    return () => subscription.remove();
  }, [isAuthenticated, queryClient]);

  const value = useMemo(
    () => ({
      isConnected,
      joinWarehouseRoom: (warehouseId: string) => {
        if (!warehouseId || joinedWarehouseIds.current.has(warehouseId)) return;
        joinedWarehouseIds.current.add(warehouseId);
        socketRef.current?.emit('warehouse:join', { warehouseId });
      },
    }),
    [isConnected],
  );
  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocketStatus(): SocketContextValue {
  return useContext(SocketContext);
}

function invalidateTaskEvent(queryClient: ReturnType<typeof useQueryClient>, payload: TaskSocketPayload): void {
  void queryClient.invalidateQueries({ queryKey: ['tasks'] });
  if (payload.taskId) void queryClient.invalidateQueries({ queryKey: queryKeys.task(payload.taskId) });
}
