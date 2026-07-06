import { useQuery } from '@tanstack/react-query';
import { getDashboardByRole, type DashboardRole } from '../api/dashboard.api';
import { queryKeys } from '../constants/queryKeys';

export function useDashboard(role: DashboardRole) {
  return useQuery({
    queryKey: queryKeys.dashboard(role),
    queryFn: () => getDashboardByRole(role),
  });
}
