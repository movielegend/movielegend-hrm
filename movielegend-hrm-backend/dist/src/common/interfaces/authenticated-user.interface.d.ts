import { RoleScopeType } from '@prisma/client';
export interface AuthenticatedUser {
    sub: string;
    userId: string;
    roles: string[];
    permissions: string[];
    scopes: Array<{
        role: string;
        scopeType: RoleScopeType;
        scopeId: string | null;
    }>;
}
