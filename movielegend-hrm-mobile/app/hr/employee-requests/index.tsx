import { Redirect } from 'expo-router';
import LeaderRequestsScreen from '../../leader/employee-requests/index';
import { useAuth } from '../../../src/providers/AuthProvider';

export default function HREmployeeRequestListRoute() {
  const { user } = useAuth();
  const rawRoles = user?.roles || [];
  const roleList = Array.isArray(rawRoles) ? rawRoles : [rawRoles];
  const roles = roleList.map((r: any) =>
    String(typeof r === 'string' ? r : r?.code || r?.name || '').toUpperCase()
  );
  const isAdmin = roles.includes('ADMIN') || roles.includes('SUPER_ADMIN');
  const isHr = roles.includes('HR') || roles.includes('HUMAN_RESOURCE');
  const isAcct =
    roles.includes('ACCOUNTANT') ||
    roles.some((r: any) => r.startsWith('ACCOUNTANT') || r.includes('ACCOUNTANT') || r.includes('KT') || r.includes('KETOAN')) ||
    Boolean(user?.position?.name?.toLowerCase().includes('kế toán')) ||
    Boolean(user?.department?.name?.toLowerCase().includes('kế toán'));

  if (isAcct && !isAdmin && !isHr) {
    return <Redirect href="/employee/requests" />;
  }

  return <LeaderRequestsScreen />;
}
