import { Redirect } from 'expo-router';
import { useAuth } from '../../../src/providers/AuthProvider';
import { isAccountingLeader } from '../../../src/utils/role-routing';
import LeaderRequestsScreen from '../../leader/employee-requests/index';

export default function AccountantRequestsRoute() {
  const { user } = useAuth();
  if (isAccountingLeader(user)) {
    return <LeaderRequestsScreen />;
  }
  return <Redirect href="/employee/requests" />;
}
