import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { PrismaService } from '../../database/prisma.service';
export declare class DepartmentScopeService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    canAccessDepartment(actor: AuthenticatedUser, departmentId: string): boolean;
    visibleDepartmentIds(actor: AuthenticatedUser): string[] | null;
    assertDepartmentAccess(actor: AuthenticatedUser, departmentId: string): void;
    getPrimaryDepartmentId(userId: string): Promise<string>;
    assertUserInDepartment(userId: string, departmentId: string): Promise<void>;
}
