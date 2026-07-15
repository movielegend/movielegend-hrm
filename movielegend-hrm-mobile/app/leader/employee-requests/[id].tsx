import { useLocalSearchParams } from 'expo-router';
import { EmployeeRequestDetailScreen } from '../../../src/features/employee-requests/EmployeeRequestScreens';

export default function LeaderEmployeeRequestDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <EmployeeRequestDetailScreen />;
}
