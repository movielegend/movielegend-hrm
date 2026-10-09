import { useState, useEffect, useCallback, useRef } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { pingAttendanceServer } from '../api/attendance.api';

export type NetworkQualityLevel = 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'OFFLINE';

export interface NetworkQualityInfo {
  level: NetworkQualityLevel;
  pingMs: number | null;
  label: string;
  color: string;
  bgColor: string;
  connectionType: string;
  isWeak: boolean;
}

export function useNetworkQuality() {
  const [pingMs, setPingMs] = useState<number | null>(null);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [connectionType, setConnectionType] = useState<string>('Đang kiểm tra...');
  const isMountedRef = useRef(true);

  const measurePing = useCallback(async (): Promise<{ pingMs: number; success: boolean }> => {
    setIsChecking(true);
    try {
      const result = await pingAttendanceServer();
      if (isMountedRef.current) {
        setPingMs(result.success ? result.pingMs : 999);
      }
      return result;
    } catch {
      if (isMountedRef.current) {
        setPingMs(999);
      }
      return { pingMs: 999, success: false };
    } finally {
      if (isMountedRef.current) {
        setIsChecking(false);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      if (!state.isConnected || !state.isInternetReachable) {
        setConnectionType('Không có kết nối mạng');
        setPingMs(null);
      } else if (state.type === 'wifi') {
        const ssid = (state.details as any)?.ssid;
        setConnectionType(ssid && ssid !== '<unknown ssid>' && ssid !== 'unknown' ? `Wi-Fi (${ssid})` : 'Wi-Fi');
      } else if (state.type === 'cellular') {
        const gen = (state.details as any)?.cellularGeneration;
        setConnectionType(`Di động (${gen ? gen.toUpperCase() : '4G/5G'})`);
      } else {
        setConnectionType('Đã kết nối');
      }
    });

    // Initial ping measure
    measurePing();

    return () => {
      isMountedRef.current = false;
      unsubscribe();
    };
  }, [measurePing]);

  const getQualityInfo = (): NetworkQualityInfo => {
    if (pingMs === null) {
      return {
        level: 'OFFLINE',
        pingMs: null,
        label: 'Đang đo...',
        color: '#6B7280',
        bgColor: '#F3F4F6',
        connectionType,
        isWeak: false,
      };
    }

    if (pingMs >= 999 || pingMs < 0) {
      return {
        level: 'OFFLINE',
        pingMs,
        label: 'Mất kết nối',
        color: '#EF4444',
        bgColor: '#FEE2E2',
        connectionType,
        isWeak: true,
      };
    }

    if (pingMs < 120) {
      return {
        level: 'EXCELLENT',
        pingMs,
        label: 'Mạng cực tốt',
        color: '#10B981',
        bgColor: '#D1FAE5',
        connectionType,
        isWeak: false,
      };
    }

    if (pingMs < 250) {
      return {
        level: 'GOOD',
        pingMs,
        label: 'Mạng ổn định',
        color: '#059669',
        bgColor: '#ECFDF5',
        connectionType,
        isWeak: false,
      };
    }

    if (pingMs <= 450) {
      return {
        level: 'FAIR',
        pingMs,
        label: 'Mạng trung bình',
        color: '#F59E0B',
        bgColor: '#FEF3C7',
        connectionType,
        isWeak: false,
      };
    }

    // Ping > 450ms -> Mạng yếu
    return {
      level: 'POOR',
      pingMs,
      label: 'Mạng rất yếu / Lag',
      color: '#DC2626',
      bgColor: '#FEE2E2',
      connectionType,
      isWeak: true,
    };
  };

  const testConnectionBeforeAction = async (): Promise<{ isWeak: boolean; pingMs: number; message?: string }> => {
    const res = await measurePing();
    const isWeak = !res.success || res.pingMs > 450;
    let message = undefined;

    if (!res.success) {
      message = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối Wi-Fi hoặc 4G/5G.';
    } else if (res.pingMs > 450) {
      message = `Độ trễ mạng hiện tại quá cao (${res.pingMs}ms). Dữ liệu chấm công có thể bị chậm trễ hoặc lỗi đường truyền.`;
    }

    return { isWeak, pingMs: res.pingMs, message };
  };

  return {
    pingMs,
    isChecking,
    connectionType,
    measurePing,
    qualityInfo: getQualityInfo(),
    testConnectionBeforeAction,
  };
}
