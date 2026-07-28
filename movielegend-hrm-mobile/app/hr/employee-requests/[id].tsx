import { useLocalSearchParams } from 'expo-router';
import { LeaderApprovalScreen } from '../../../src/features/employee-requests/LeaderApprovalScreen';

export default function HREmployeeRequestDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <LeaderApprovalScreen />;
}
