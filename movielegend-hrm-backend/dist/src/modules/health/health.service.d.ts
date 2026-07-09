import { PrismaService } from '../../database/prisma.service';
export declare class HealthService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    check(): Promise<{
        status: string;
        database: string;
        uptime: number;
        timestamp: string;
    }>;
    live(): {
        status: string;
        uptime: number;
        timestamp: string;
    };
    ready(): Promise<{
        status: string;
        database: string;
        uptime: number;
        timestamp: string;
    }>;
}
