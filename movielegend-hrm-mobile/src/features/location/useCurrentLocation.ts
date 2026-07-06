import * as Location from 'expo-location';
import { useCallback, useState } from 'react';
import type { Coordinates } from '../../types/attendance.types';

export interface CurrentLocationState {
  location: Coordinates | null;
  loading: boolean;
  permissionGranted: boolean;
  error: string | null;
  requestLocation: () => Promise<Coordinates | null>;
}

export function useCurrentLocation(): CurrentLocationState {
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [loading, setLoading] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestLocation = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      const granted = permission.status === Location.PermissionStatus.GRANTED;
      setPermissionGranted(granted);
      if (!granted) {
        setError('LOCATION_PERMISSION_DENIED');
        return null;
      }
      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const next: Coordinates = {
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
        accuracy: current.coords.accuracy,
        timestamp: current.timestamp,
      };
      setLocation(next);
      return next;
    } catch {
      setError('LOCATION_UNAVAILABLE');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { location, loading, permissionGranted, error, requestLocation };
}
