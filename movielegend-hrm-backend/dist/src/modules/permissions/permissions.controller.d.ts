import { PermissionsService } from './permissions.service';
export declare class PermissionsController {
    private readonly permissionsService;
    constructor(permissionsService: PermissionsService);
    findAll(): import("@prisma/client").Prisma.PrismaPromise<{
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        code: string;
    }[]>;
}
