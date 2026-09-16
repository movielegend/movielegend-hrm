import type { AuthUser } from '../types/user.types';

export function hasPermission(user: AuthUser | null, permissionCode: string): boolean {
  if (!user) return false;
  if (user.roles?.includes('ADMIN') || user.roles?.includes('SUPER_ADMIN')) return true;
  return Boolean(user.permissions?.includes?.(permissionCode));
}

export function hasAnyPermission(user: AuthUser | null, codes: string[]): boolean {
  return codes.some((code) => hasPermission(user, code));
}
