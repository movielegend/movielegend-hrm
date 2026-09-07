import type { AuthUser, UserRole } from '../types/user.types';

export type AppRoute = '/admin' | '/hr' | '/leader' | '/employee' | '/warehouse-manager' | '/login';

export const roleRoutePriority: Array<{ role: UserRole; route: AppRoute }> = [
  { role: 'ADMIN', route: '/admin' },
  { role: 'HR', route: '/hr' },
  { role: 'ACCOUNTANT', route: '/admin' },
  { role: 'WAREHOUSE_MANAGER', route: '/warehouse-manager' },
  { role: 'LEADER', route: '/leader' },
  { role: 'EMPLOYEE', route: '/employee' },
];

export function getHomeRouteForUser(user: AuthUser | null): AppRoute | '/deactivated-account' {
  if (!user) return '/login';
  if (user.accountStatus === 'DEACTIVATED_30_DAYS' || Boolean(user.deletionScheduledAt)) return '/deactivated-account';
  const matched = roleRoutePriority.find((item) => user.roles.includes(item.role));
  return matched?.route ?? '/employee';
}

export function canAccessRoleRoute(user: AuthUser | null, route: AppRoute): boolean {
  if (!user) return route === '/login';
  // Allow ADMIN to access any route
  if (user.roles.includes('ADMIN')) return true;
  
  // Cho phép Nhân sự (HR) có thẩm quyền quản trị & nghiệp vụ được phép truy cập các màn hình HR, Leader, Employee
  if (user.roles.includes('HR')) {
    if (route === '/hr' || route === '/leader' || route === '/employee' || route === '/warehouse-manager') return true;
  }

  // Cho phép Quản lý (LEADER) được phép truy cập vào các màn hình của Quản lý (LEADER) và Nhân viên (EMPLOYEE)
  if (user.roles.includes('LEADER') && (route === '/employee' || route === '/leader')) return true;
  
  return getHomeRouteForUser(user) === route;
}
