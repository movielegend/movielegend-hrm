import { useLocalSearchParams } from 'expo-router';
import { ContractDetailScreen } from '../../../src/features/contracts/ContractScreens';

export default function HRContractDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ContractDetailScreen contractId={id} />;
}
