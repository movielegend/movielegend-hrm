import { PrismaService } from '../../database/prisma.service';
export declare class PermissionsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(): import("@prisma/client").Prisma.PrismaPromise<{
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        code: string;
    }[]>;
}
