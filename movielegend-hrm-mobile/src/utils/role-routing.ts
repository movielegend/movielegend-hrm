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

export function hasUserRole(
  user: AuthUser | null,
  targetRole: 'ADMIN' | 'HR' | 'ACCOUNTANT' | 'WAREHOUSE_MANAGER' | 'LEADER' | 'EMPLOYEE'
): boolean {
  if (!user) return false;
  const roles = user.roles || [];
  const roleCodes = roles.map((r: any) =>
    String(typeof r === 'string' ? r : r?.code || r?.name || '').toUpperCase()
  );
  const positionName = (user.position?.name || '').toLowerCase();
  const departmentName = (user.department?.name || '').toLowerCase();

  switch (targetRole) {
    case 'ADMIN':
      return roleCodes.some((c) => c === 'ADMIN' || c === 'SUPER_ADMIN' || c === 'SUPERADMIN' || c === 'SYSTEM_ADMIN');
    case 'HR':
      return (
        roleCodes.some((c) => c === 'HR' || c.includes('HR_') || c.includes('_HR') || c === 'HUMAN_RESOURCE') ||
        departmentName.includes('nhân sự') ||
        positionName.includes('nhân sự')
      );
    case 'ACCOUNTANT':
      return (
        roleCodes.some(
          (c) =>
            c.includes('ACCOUNTANT') ||
            c === 'KT' ||
            c === 'KETOAN' ||
            c === 'CHIEF_ACCOUNTANT'
        ) ||
        departmentName.includes('kế toán') ||
        departmentName.includes('tài chính') ||
        positionName.includes('kế toán') ||
        positionName.includes('tài chính')
      );
    case 'WAREHOUSE_MANAGER':
      return (
        roleCodes.some((c) => c.includes('WAREHOUSE') || c.includes('KHO')) ||
        departmentName.includes('kho') ||
        positionName.includes('thủ kho')
      );
    case 'LEADER':
      return (
        roleCodes.some(
          (c) =>
            c === 'LEADER' ||
            c.includes('LEAD') ||
            c.includes('TRUONG_PHONG') ||
            c === 'MANAGER' ||
            c === 'DEPARTMENT_HEAD'
        ) ||
        positionName.includes('trưởng') ||
        positionName.includes('quản lý')
      );
    case 'EMPLOYEE':
      return true;
    default:
      return false;
  }
}

export function getRoleBaseRoute(user: AuthUser | null): RoleBaseRoute {
  if (!user) return '/employee';
  if (hasUserRole(user, 'ADMIN')) return '/admin';
  if (hasUserRole(user, 'HR')) return '/hr';
  if (hasUserRole(user, 'ACCOUNTANT')) return '/hr';
  if (hasUserRole(user, 'WAREHOUSE_MANAGER')) return '/warehouse-manager';
  if (hasUserRole(user, 'LEADER')) return '/leader';
  return '/employee';
}

export function getHomeRouteForUser(user: AuthUser | null): AppRoute | '/deactivated-account' {
  if (!user) return '/login';
  if (user.accountStatus === 'DEACTIVATED_30_DAYS' || Boolean(user.deletionScheduledAt)) return '/deactivated-account';
  if (hasUserRole(user, 'ADMIN')) return '/admin/(tabs)';
  if (hasUserRole(user, 'HR')) return '/hr/(tabs)';
  if (hasUserRole(user, 'ACCOUNTANT')) return '/hr/(tabs)';
  if (hasUserRole(user, 'WAREHOUSE_MANAGER')) return '/warehouse-manager';
  if (hasUserRole(user, 'LEADER')) return '/leader/(tabs)';
  return '/employee/(tabs)';
}

export function canAccessRoleRoute(user: AuthUser | null, route: string): boolean {
  if (!user) return route === '/login';
  // Allow ADMIN to access any route
  if (hasUserRole(user, 'ADMIN')) return true;
  
  // Cho phép Nhân sự (HR) và Kế toán (ACCOUNTANT) có thẩm quyền quản trị & nghiệp vụ được phép truy cập các màn hình HR, Leader, Employee, Admin
  if (hasUserRole(user, 'HR') || hasUserRole(user, 'ACCOUNTANT')) {
    if (
      route.startsWith('/hr') ||
      route.startsWith('/leader') ||
      route.startsWith('/employee') ||
      route.startsWith('/warehouse-manager') ||
      route.startsWith('/admin')
    ) return true;
  }

  // Cho phép Quản lý (LEADER) được phép truy cập vào các màn hình của Quản lý (LEADER) và Nhân viên (EMPLOYEE)
  if (hasUserRole(user, 'LEADER') && (route.startsWith('/employee') || route.startsWith('/leader'))) return true;
  
  const baseRoute = getRoleBaseRoute(user);
  return route.startsWith(baseRoute);
}

/**
 * Kiểm tra xem người dùng có phải là Trưởng phòng Kế toán (Accounting Leader / Chief Accountant) hay không.
 * Chỉ duy nhất Trưởng phòng Kế toán mới có quyền xuất file Excel tài chính.
 */
export function isAccountingLeader(user: AuthUser | null): boolean {
  if (!user) return false;

  const rawRoles = user.roles || [];
  const userRoles = Array.isArray(rawRoles) ? rawRoles : [rawRoles];
  const roleCodes = userRoles.map((r: any) =>
    String(typeof r === 'string' ? r : r?.code || r?.name || '').toUpperCase()
  );

  // 1. Role chuyên biệt cho Trưởng phòng kế toán / Kế toán trưởng
  const hasChiefAccountantRole = roleCodes.some((code) =>
    [
      'ACCOUNTANT_LEAD',
      'CHIEF_ACCOUNTANT',
      'KT_TRUONG',
      'LEAD_ACCOUNTANT',
      'TRUONG_PHONG_KE_TOAN',
      'TP_KETOAN',
      'TP_KE_TOAN',
    ].includes(code)
  );
  if (hasChiefAccountantRole) return true;

  // 2. Chức danh (Position) là Kế toán trưởng hoặc Trưởng phòng kế toán / tài chính
  const positionName = (user.position?.name || '').toLowerCase();
  const positionCode = (user.position?.code || '').toUpperCase();
  const isChiefPosition =
    positionName.includes('kế toán trưởng') ||
    positionName.includes('trưởng phòng kế toán') ||
    positionName.includes('trưởng ban tài chính') ||
    positionName.includes('lead kế toán') ||
    positionName.includes('trưởng nhóm kế toán') ||
    ['KTT', 'KT_TRUONG', 'TP_KT', 'ACCOUNTANT_LEAD', 'CHIEF_ACCOUNTANT'].includes(positionCode);
  if (isChiefPosition) return true;

  // 3. User giữ vai trò LEADER/Trưởng phòng của phòng ban Kế toán/Tài chính
  const hasLeaderRole = roleCodes.some((code) =>
    ['LEADER', 'DEPARTMENT_HEAD', 'MANAGER', 'TRUONG_PHONG'].includes(code)
  );
  const departmentName = (user.department?.name || '').toLowerCase();
  const departmentCode = (user.department?.code || '').toUpperCase();
  const isAccountingDept =
    departmentName.includes('kế toán') ||
    departmentName.includes('tài chính') ||
    ['KT', 'TC', 'ACC', 'ACCOUNTING'].includes(departmentCode);

  if (hasLeaderRole && isAccountingDept) {
    return true;
  }

  return false;
}

if (typeof globalThis !== 'undefined') {
  (globalThis as any).getRoleBaseRoute = getRoleBaseRoute;
  (globalThis as any).getHomeRouteForUser = getHomeRouteForUser;
  (globalThis as any).isAccountingLeader = isAccountingLeader;
}
