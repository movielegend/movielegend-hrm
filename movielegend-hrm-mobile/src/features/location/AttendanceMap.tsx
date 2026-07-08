import { StyleSheet, Text, View } from 'react-native';
import type { Coordinates } from '../../types/attendance.types';
import { colors } from '../../theme/colors';

interface AttendanceMapProps {
  currentLocation: Coordinates | null;
  targetLocation?: Coordinates | null;
  radius?: number | null;
  loading?: boolean;
  error?: string | null;
}

export function AttendanceMap({ currentLocation, targetLocation, radius, loading, error }: AttendanceMapProps) {
  return (
    <View style={styles.fallback}>
      <Text style={styles.fallbackText}>Bản đồ (Đã tạm ẩn để tránh lỗi Native Module)</Text>
    </View>
  );
}

function MapFallback({ label }: { label: string }) {
  return (
    <View style={styles.fallback}>
      <Text style={styles.fallbackText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    height: 220,
    justifyContent: 'center',
  },
  fallbackText: {
    color: colors.primaryDark,
    fontSize: 14,
    fontWeight: '700',
  },
  map: {
    borderRadius: 8,
    height: 220,
    overflow: 'hidden',
  },
});
