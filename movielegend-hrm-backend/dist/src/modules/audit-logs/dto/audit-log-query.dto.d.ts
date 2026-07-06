export declare class AuditLogQueryDto {
    userId?: string;
    action?: string;
    module?: string;
    entityType?: string;
    entityId?: string;
    fromDate?: string;
    toDate?: string;
    page?: number;
    limit?: number;
}
