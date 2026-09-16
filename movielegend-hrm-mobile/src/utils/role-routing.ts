import type { AuthUser, UserRole } from '../types/user.types';

export type AppRoute =
  | '/admin/(tabs)'
  | '/hr/(tabs)'
  | '/leader/(tabs)'
  | '/employee/(tabs)'
  | '/warehouse-manager'
  | '/login';

export type RoleBaseRoute = '/admin' | '/hr' | '/leader' | '/employee' | '/warehouse-manager';

export const roleRoutePriority: Array<{ role: UserRole; route: AppRoute }> = [
  { role: 'ADMIN', route: '/admin/(tabs)' },
  { role: 'HR', route: '/hr/(tabs)' },
  { role: 'ACCOUNTANT', route: '/hr/(tabs)' },
  { role: 'WAREHOUSE_MANAGER', route: '/warehouse-manager' },
  { role: 'LEADER', route: '/leader/(tabs)' },
  { role: 'EMPLOYEE', route: '/employee/(tabs)' },
];

export function getRoleBaseRoute(user: AuthUser | null): RoleBaseRoute {
  if (!user) return '/employee';
  const roleBasePriority: Array<{ role: UserRole; route: RoleBaseRoute }> = [
    { role: 'ADMIN', route: '/admin' },
    { role: 'HR', route: '/hr' },
    { role: 'ACCOUNTANT', route: '/hr' },
    { role: 'WAREHOUSE_MANAGER', route: '/warehouse-manager' },
    { role: 'LEADER', route: '/leader' },
    { role: 'EMPLOYEE', route: '/employee' },
  ];
  const matched = roleBasePriority.find((item) => user.roles.includes(item.role));
  return matched?.route ?? '/employee';
}

export function getHomeRouteForUser(user: AuthUser | null): AppRoute | '/deactivated-account' {
  if (!user) return '/login';
  if (user.accountStatus === 'DEACTIVATED_30_DAYS' || Boolean(user.deletionScheduledAt)) return '/deactivated-account';
  const matched = roleRoutePriority.find((item) => user.roles.includes(item.role));
  return matched?.route ?? '/employee/(tabs)';
}

export function canAccessRoleRoute(user: AuthUser | null, route: string): boolean {
  if (!user) return route === '/login';
  // Allow ADMIN to access any route
  if (user.roles.includes('ADMIN')) return true;
  
  // Cho phép Nhân sự (HR) và Kế toán (ACCOUNTANT) có thẩm quyền quản trị & nghiệp vụ được phép truy cập các màn hình HR, Leader, Employee, Admin
  if (user.roles.includes('HR') || user.roles.includes('ACCOUNTANT')) {
    if (
      route.startsWith('/hr') ||
      route.startsWith('/leader') ||
      route.startsWith('/employee') ||
      route.startsWith('/warehouse-manager') ||
      route.startsWith('/admin')
    ) return true;
  }

  // Cho phép Quản lý (LEADER) được phép truy cập vào các màn hình của Quản lý (LEADER) và Nhân viên (EMPLOYEE)
  if (user.roles.includes('LEADER') && (route.startsWith('/employee') || route.startsWith('/leader'))) return true;
  
  const baseRoute = getRoleBaseRoute(user);
  return route.startsWith(baseRoute);
}
