import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ANY_PERMISSIONS_KEY } from '../decorators/any-permissions.decorator';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';
import { forbidden } from '../utils/error.util';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const anyRequired = this.reflector.getAllAndOverride<string[]>(ANY_PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required?.length && !anyRequired?.length) return true;
    const request = context.switchToHttp().getRequest<{ user?: AuthenticatedUser }>();
    const user = request.user;
    const permissions = new Set(user?.permissions ?? []);
    // Kế toán viên có quyền đọc danh sách nhân viên phục vụ quản lý lương và đối soát chi
    const isAccountant = user?.roles?.some(
      (r: string) =>
        r.startsWith('ACCOUNTANT') ||
        r.includes('ACCOUNTANT') ||
        r.includes('FINANCE') ||
        r.includes('CFO'),
    );
    if (isAccountant) {
      permissions.add('user.read');
      permissions.add('employee.read');
    }
    const allowed =
      (required?.every((permission) => permissions.has(permission)) ?? true) &&
      (!anyRequired?.length || anyRequired.some((permission) => permissions.has(permission)));
    if (!allowed) {
      throw forbidden('FORBIDDEN', 'Bạn không có quyền thực hiện thao tác này');
    }
    return true;
  }
}
