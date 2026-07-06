import MapView, { Circle, Marker } from 'react-native-maps';
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
  if (loading) return <MapFallback label="Dang tai ban do GPS" />;
  if (error) return <MapFallback label="Khong the hien thi ban do GPS" />;
  if (!currentLocation) return <MapFallback label="Chua co vi tri hien tai" />;

  return (
    <MapView
      style={styles.map}
      initialRegion={{
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }}
    >
      <Marker coordinate={currentLocation} title="Vi tri hien tai" />
      {targetLocation ? <Marker coordinate={targetLocation} pinColor={colors.primary} title="Diem cham cong" /> : null}
      {targetLocation && radius ? (
        <Circle
          center={targetLocation}
          fillColor="rgba(37, 99, 235, 0.12)"
          radius={radius}
          strokeColor={colors.primary}
          strokeWidth={2}
        />
      ) : null}
    </MapView>
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
