import { StyleSheet, Text, View } from 'react-native';
import { SectionCard } from '../../components/SectionCard';
import { StatusBadge } from '../../components/StatusBadge';
import type { Coordinates } from '../../types/attendance.types';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { locationReadiness } from './location.logic';

interface LocationStatusCardProps {
  location: Coordinates | null;
  permissionGranted: boolean;
  error?: string | null;
  loading?: boolean;
}

export function LocationStatusCard({ location, permissionGranted, error, loading }: LocationStatusCardProps) {
  const readiness = loading ? 'requesting' : locationReadiness(location, permissionGranted, error);
  return (
    <SectionCard title="GPS">
      <View style={styles.row}>
        <StatusBadge label={labelForReadiness(readiness)} tone={toneForReadiness(readiness)} />
        {location ? <Text style={styles.text}>Accuracy: {Math.round(location.accuracy ?? 0)}m</Text> : null}
      </View>
      {error ? <Text style={styles.error}>{messageForError(error)}</Text> : null}
      {location ? (
        <Text style={styles.text}>
          {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
        </Text>
      ) : null}
    </SectionCard>
  );
}

function labelForReadiness(readiness: string): string {
  if (readiness === 'requesting') return 'Dang lay vi tri';
  if (readiness === 'ready') return 'GPS san sang';
  if (readiness === 'denied') return 'Chua co quyen GPS';
  if (readiness === 'low_accuracy') return 'GPS chua chinh xac';
  if (readiness === 'error') return 'Khong lay duoc GPS';
  return 'Chua lay vi tri';
}

function toneForReadiness(readiness: string): 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
  if (readiness === 'ready') return 'success';
  if (readiness === 'low_accuracy' || readiness === 'requesting') return 'warning';
  if (readiness === 'denied' || readiness === 'error') return 'danger';
  return 'neutral';
}

function messageForError(error: string): string {
  if (error === 'LOCATION_PERMISSION_DENIED') return 'Ung dung can quyen vi tri de cham cong.';
  return 'Khong the lay GPS luc nay. Hay thu lai.';
}

const styles = StyleSheet.create({
  error: {
    color: colors.danger,
    fontSize: 13,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  text: {
    color: colors.text,
    fontSize: 14,
  },
});
