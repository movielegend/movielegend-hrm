import type { AuthUser } from '../types/user.types';

export function hasPermission(user: AuthUser | null, permissionCode: string): boolean {
  return Boolean(user?.permissions.includes(permissionCode));
}

export function hasAnyPermission(user: AuthUser | null, codes: string[]): boolean {
  return codes.some((code) => hasPermission(user, code));
}
