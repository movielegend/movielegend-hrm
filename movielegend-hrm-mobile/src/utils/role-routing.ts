import type { AuthUser, UserRole } from '../types/user.types';

export type AppRoute = '/admin' | '/leader' | '/employee' | '/warehouse-manager' | '/login';

export const roleRoutePriority: Array<{ role: UserRole; route: AppRoute }> = [
  { role: 'ADMIN', route: '/admin' },
  { role: 'HR', route: '/admin' },
  { role: 'ACCOUNTANT', route: '/admin' },
  { role: 'WAREHOUSE_MANAGER', route: '/warehouse-manager' },
  { role: 'LEADER', route: '/leader' },
  { role: 'EMPLOYEE', route: '/employee' },
];

export function getHomeRouteForUser(user: AuthUser | null): AppRoute {
  if (!user) return '/login';
  const matched = roleRoutePriority.find((item) => user.roles.includes(item.role));
  return matched?.route ?? '/employee';
}

export function canAccessRoleRoute(user: AuthUser | null, route: AppRoute): boolean {
  if (!user) return route === '/login';
  return getHomeRouteForUser(user) === route;
}
