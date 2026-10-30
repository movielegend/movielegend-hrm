import { HRDashboard } from '../../../src/features/dashboard/HRDashboard';
import { AccountantDashboard } from '../../../src/features/dashboard/AccountantDashboard';
import { useAuth } from '../../../src/providers/AuthProvider';
import { hasUserRole } from '../../../src/utils/role-routing';

export default function HRDashboardRoute() {
  const { user } = useAuth();
  const isOnlyAccountant =
    hasUserRole(user, 'ACCOUNTANT') &&
    !hasUserRole(user, 'HR') &&
    !hasUserRole(user, 'ADMIN');

  if (isOnlyAccountant) {
    return <AccountantDashboard />;
  }

  return <HRDashboard />;
}
