import { Redirect } from 'expo-router';
import { useAuth } from '../../../src/providers/AuthProvider';
import { isAccountingLeader } from '../../../src/utils/role-routing';
import { ApprovalMenuScreen } from '../../../src/features/approvals/ApprovalMenuScreen';

export default function AccountantRequestsRoute() {
  const { user } = useAuth();
  if (isAccountingLeader(user)) {
    return <ApprovalMenuScreen />;
  }
  return <Redirect href="/employee/requests" />;
}
