import { useLocalSearchParams } from 'expo-router';
import { EmployeeRequestDetailScreen } from '../../../src/features/employee-requests/EmployeeRequestScreens';

export default function AdminEmployeeRequestDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  // Pass the id if the screen accepts it in the future
  return <EmployeeRequestDetailScreen />;
}
