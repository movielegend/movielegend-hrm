import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useAuth } from '../providers/AuthProvider';

interface ChatWatermarkProps {
  customName?: string;
  opacity?: number;
}

export function ChatWatermark({ customName, opacity = 0.12 }: ChatWatermarkProps) {
  const { user } = useAuth();
  const { width, height } = Dimensions.get('window');

  // Chỉ hiển thị Họ và Tên của người dùng đang đăng nhập
  const fullName = useMemo(() => {
    if (customName && customName.trim()) return customName.trim();
    const rawName = (user as any)?.profile?.fullName || (user as any)?.fullName || (user as any)?.name;
    if (rawName && rawName.trim()) return rawName.trim();
    if (user?.roles?.includes('ADMIN') || (user as any)?.role === 'ADMIN') return 'Admin';
    return user?.userCode || 'MovieLegend';
  }, [user, customName]);

  // Tính số lượng hàng và cột phủ kín màn hình thiết bị
  const rows = Math.ceil(height / 120) + 2;
  const cols = Math.ceil(width / 150) + 2;

  return (
    <View style={styles.overlay} pointerEvents="none">
      <View style={styles.grid}>
        {Array.from({ length: rows }).map((_, rIdx) => (
          <View key={`wm-r-${rIdx}`} style={styles.row}>
            {Array.from({ length: cols }).map((_, cIdx) => (
              <View key={`wm-c-${cIdx}`} style={styles.cell}>
                <Text
                  numberOfLines={1}
                  style={[styles.text, { opacity }]}
                >
                  {fullName}
                </Text>
              </View>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    elevation: 10,
  },
  grid: {
    flex: 1,
    overflow: 'hidden',
    justifyContent: 'space-around',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 20,
  },
  cell: {
    transform: [{ rotate: '-25deg' }],
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  text: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    letterSpacing: 0.5,
  },
});
