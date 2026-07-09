import { PrismaService } from '../../database/prisma.service';
export declare class RolesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
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
