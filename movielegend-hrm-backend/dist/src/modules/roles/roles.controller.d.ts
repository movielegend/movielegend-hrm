import { RolesService } from './roles.service';
export declare class RolesController {
    private readonly rolesService;
    constructor(rolesService: RolesService);
    findAll(): import("@prisma/client").Prisma.PrismaPromise<({
        permissions: ({
            permission: {
                id: string;
                code: string;
                name: string;
                description: string | null;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            id: string;
            createdAt: Date;
            roleId: string;
            permissionId: string;
        })[];
    } & {
        id: string;
        code: string;
        name: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        isSystem: boolean;
    })[]>;
}
