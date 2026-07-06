import type { Coordinates } from '../../types/attendance.types';

export type LocationReadiness = 'idle' | 'requesting' | 'ready' | 'denied' | 'low_accuracy' | 'error';

export function isValidCoordinates(value: Partial<Coordinates> | null | undefined): value is Coordinates {
  return typeof value?.latitude === 'number' &&
    typeof value.longitude === 'number' &&
    Number.isFinite(value.latitude) &&
    Number.isFinite(value.longitude) &&
    value.latitude >= -90 &&
    value.latitude <= 90 &&
    value.longitude >= -180 &&
    value.longitude <= 180;
}

export function locationReadiness(location: Coordinates | null, permissionGranted: boolean, error?: string | null): LocationReadiness {
  if (error) return 'error';
  if (!permissionGranted) return 'denied';
  if (!location) return 'idle';
  if (typeof location.accuracy === 'number' && location.accuracy > 80) return 'low_accuracy';
  return 'ready';
}

export function distanceMeters(a: Coordinates, b: Coordinates): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadius = 6_371_000;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return earthRadius * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}
