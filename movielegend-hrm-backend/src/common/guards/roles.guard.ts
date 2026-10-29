import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';
import { forbidden } from '../utils/error.util';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required?.length) return true;
    const request = context.switchToHttp().getRequest<{ user?: AuthenticatedUser }>();
    const userRoles = request.user?.roles ?? [];
    const roles = new Set(userRoles);
    const hasRole = required.some((role) => {
      if (roles.has(role)) return true;
      if (
        role === 'ACCOUNTANT' &&
        userRoles.some(
          (r) =>
            r.startsWith('ACCOUNTANT') ||
            r.includes('ACCOUNTANT') ||
            r.includes('FINANCE') ||
            r.includes('CFO'),
        )
      ) {
        return true;
      }
      if (role === 'ADMIN' && (roles.has('SUPER_ADMIN') || roles.has('SYSTEM_ADMIN'))) {
        return true;
      }
      if (role === 'HR' && userRoles.some((r) => r.startsWith('HR') || r.includes('HR_'))) {
        return true;
      }
      return false;
    });
    if (!hasRole) {
      throw forbidden('FORBIDDEN_ROLE', 'Bạn không có vai trò phù hợp để thực hiện thao tác này');
    }
    return true;
  }
}
