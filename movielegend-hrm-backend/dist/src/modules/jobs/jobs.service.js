"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const error_util_1 = require("../../common/utils/error.util");
const prisma_service_1 = require("../../database/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
const JOBS = [
    'task-due-soon',
    'task-overdue',
    'contract-expiry',
    'document-expiry',
    'payroll-payslip',
    'kpi-deadline',
    'asset-return',
];
let JobsService = class JobsService {
    prisma;
    notifications;
    constructor(prisma, notifications) {
        this.prisma = prisma;
        this.notifications = notifications;
    }
    list() {
        return JOBS.map((jobName) => ({ jobName }));
    }
    logs() {
        return this.prisma.jobExecutionLog.findMany({ orderBy: { startedAt: 'desc' }, take: 100 });
    }
    async run(jobName, actor) {
        if (!JOBS.includes(jobName))
            throw (0, error_util_1.badRequest)('JOB_NOT_WHITELISTED', 'Job is not allowed');
        const executionKey = `${jobName}:${new Date().toISOString().slice(0, 10)}`;
        try {
            return await this.prisma.$transaction(async (tx) => {
                const log = await tx.jobExecutionLog.create({ data: { jobName, executionKey, status: client_1.JobExecutionStatus.RUNNING } });
                const result = await this.execute(tx, jobName);
                const updated = await tx.jobExecutionLog.update({
                    where: { id: log.id },
                    data: {
                        status: result.failureCount ? client_1.JobExecutionStatus.PARTIAL_SUCCESS : client_1.JobExecutionStatus.SUCCESS,
                        finishedAt: new Date(),
                        processedCount: result.processedCount,
                        successCount: result.successCount,
                        failureCount: result.failureCount,
                        errorSummary: result.errorSummary,
                    },
                });
                await tx.auditLog.create({ data: { actorUserId: actor.userId, action: 'JOB_RUN_MANUAL', entityType: 'JobExecutionLog', entityId: updated.id, metadata: { jobName } } });
                return updated;
            });
        }
        catch (error) {
            if (error.code === 'P2002')
                throw (0, error_util_1.conflict)('JOB_ALREADY_RAN', 'Job already ran for this execution key');
            throw error;
        }
    }
    async execute(tx, jobName) {
        if (jobName === 'contract-expiry')
            return this.contractExpiry(tx);
        if (jobName === 'document-expiry')
            return this.documentExpiry(tx);
        return { processedCount: 0, successCount: 0, failureCount: 0 };
    }
    async contractExpiry(tx) {
        const today = new Date().toISOString().slice(0, 10);
        const in30 = new Date(Date.now() + 30 * 86_400_000);
        const contracts = await tx.employeeContract.findMany({ where: { status: 'ACTIVE', endDate: { lte: in30 } }, select: { id: true, userId: true, title: true } });
        let successCount = 0;
        for (const contract of contracts) {
            const created = await this.notifications.createForUsers(tx, [contract.userId], {
                type: client_1.NotificationType.CONTRACT_EXPIRING,
                title: 'Contract expiring',
                body: contract.title,
                dedupKey: `contract-expiry:${contract.id}:${today}`,
                metadata: { contractId: contract.id },
            }).catch(() => null);
            if (created)
                successCount += 1;
        }
        return { processedCount: contracts.length, successCount, failureCount: contracts.length - successCount };
    }
    async documentExpiry(tx) {
        const today = new Date().toISOString().slice(0, 10);
        const in30 = new Date(Date.now() + 30 * 86_400_000);
        const documents = await tx.employeeDocument.findMany({ where: { deletedAt: null, expiryDate: { lte: in30 }, userId: { not: null } }, select: { id: true, userId: true, title: true, fileName: true } });
        let successCount = 0;
        for (const document of documents) {
            if (!document.userId)
                continue;
            const created = await this.notifications.createForUsers(tx, [document.userId], {
                type: client_1.NotificationType.DOCUMENT_EXPIRING,
                title: 'Document expiring',
                body: document.title ?? document.fileName,
                dedupKey: `document-expiry:${document.id}:${today}`,
                metadata: { documentId: document.id },
            }).catch(() => null);
            if (created)
                successCount += 1;
        }
        return { processedCount: documents.length, successCount, failureCount: documents.length - successCount };
    }
};
exports.JobsService = JobsService;
exports.JobsService = JobsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService])
], JobsService);
//# sourceMappingURL=jobs.service.js.map