import { useLocalSearchParams } from 'expo-router';
import { ContractDetailScreen } from '../../../src/features/contracts/ContractScreens';

export default function EmployeeContractDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ContractDetailScreen contractId={id as string} />;
}
