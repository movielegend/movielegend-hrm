import { AuditLogsService } from './audit-logs.service';
import { AuditLogQueryDto } from './dto/audit-log-query.dto';
export declare class AuditLogsController {
    private readonly auditLogs;
    constructor(auditLogs: AuditLogsService);
    findAll(query: AuditLogQueryDto): Promise<{
        items: ({
            actor: {
                phone: string;
                id: string;
                userCode: string;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            action: string;
            entityType: string;
            entityId: string | null;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            ipAddress: string | null;
            userAgent: string | null;
            actorUserId: string | null;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
        };
    }>;
}
