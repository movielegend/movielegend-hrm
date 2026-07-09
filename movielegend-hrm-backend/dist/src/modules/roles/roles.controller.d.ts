import { RolesService } from './roles.service';
export declare class RolesController {
    private readonly rolesService;
    constructor(rolesService: RolesService);
    findAll(): import("@prisma/client").Prisma.PrismaPromise<({
        permissions: ({
            permission: {
                description: string | null;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                code: string;
            };
        } & {
            roleId: string;
            id: string;
            createdAt: Date;
            permissionId: string;
        })[];
    } & {
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        code: string;
        isSystem: boolean;
    })[]>;
}
