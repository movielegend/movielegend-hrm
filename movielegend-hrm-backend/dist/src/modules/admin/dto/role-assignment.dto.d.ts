import { RoleScopeType } from '@prisma/client';
export declare class AssignRoleDto {
    userId: string;
    roleId: string;
    scopeType?: RoleScopeType;
    scopeId?: string;
}
