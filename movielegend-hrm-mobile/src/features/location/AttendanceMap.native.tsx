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
  if (loading) return <MapFallback label="Đang tải bản đồ GPS..." />;
  if (error) return <MapFallback label="Không thể hiển thị bản đồ GPS" />;
  if (!currentLocation) return <MapFallback label="Chưa có vị trí hiện tại" />;

  return (
    <View style={styles.mockMapContainer}>
      <Text style={styles.mockMapText}>🗺 Bản đồ thu nhỏ</Text>
      <Text style={styles.mockMapSubtext}>
        (Chức năng react-native-maps cần build Dev Client, hiện tại đang ẩn trên Expo Go)
      </Text>
      <Text style={[styles.mockMapSubtext, { marginTop: 8 }]}>
        Lat: {currentLocation.latitude.toFixed(4)} | Lng: {currentLocation.longitude.toFixed(4)}
      </Text>
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
  mockMapContainer: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  mockMapText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 8,
  },
  mockMapSubtext: {
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
  },
});
