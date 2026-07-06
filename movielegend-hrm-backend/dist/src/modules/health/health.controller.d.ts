import { HealthService } from './health.service';
export declare class HealthController {
    private readonly healthService;
    constructor(healthService: HealthService);
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
