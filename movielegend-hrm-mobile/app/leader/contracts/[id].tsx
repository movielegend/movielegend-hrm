import { useLocalSearchParams } from 'expo-router';
import { ContractDetailScreen } from '../../../src/features/contracts/ContractScreens';

export default function LeaderContractDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  
  if (!id) return null;
  
  return <ContractDetailScreen contractId={id} />;
}
