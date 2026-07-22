import { useLocalSearchParams } from 'expo-router';
import { IncidentDetailScreen } from '../../../../src/features/asset-incidents/IncidentDetailScreen';

export default function LeaderIncidentDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <IncidentDetailScreen id={id} area="leader" />;
}
