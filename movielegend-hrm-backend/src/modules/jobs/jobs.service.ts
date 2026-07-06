import { Injectable } from '@nestjs/common';
import { JobExecutionStatus, NotificationType, Prisma } from '@prisma/client';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { badRequest, conflict } from '../../common/utils/error.util';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

const JOBS = [
  'task-due-soon',
  'task-overdue',
  'contract-expiry',
  'document-expiry',
  'payroll-payslip',
  'kpi-deadline',
  'asset-return',
] as const;

type JobName = (typeof JOBS)[number];
type JobRunResult = { processedCount: number; successCount: number; failureCount: number; errorSummary?: string };

@Injectable()
export class JobsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  list() {
    return JOBS.map((jobName) => ({ jobName }));
  }

  logs() {
    return this.prisma.jobExecutionLog.findMany({ orderBy: { startedAt: 'desc' }, take: 100 });
  }

  async run(jobName: string, actor: AuthenticatedUser) {
    if (!JOBS.includes(jobName as JobName)) throw badRequest('JOB_NOT_WHITELISTED', 'Job is not allowed');
    const executionKey = `${jobName}:${new Date().toISOString().slice(0, 10)}`;
    try {
      return await this.prisma.$transaction(async (tx) => {
        const log = await tx.jobExecutionLog.create({ data: { jobName, executionKey, status: JobExecutionStatus.RUNNING } });
        const result = await this.execute(tx, jobName as JobName);
        const updated = await tx.jobExecutionLog.update({
          where: { id: log.id },
          data: {
            status: result.failureCount ? JobExecutionStatus.PARTIAL_SUCCESS : JobExecutionStatus.SUCCESS,
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
    } catch (error) {
      if ((error as { code?: string }).code === 'P2002') throw conflict('JOB_ALREADY_RAN', 'Job already ran for this execution key');
      throw error;
    }
  }

  private async execute(tx: Prisma.TransactionClient, jobName: JobName): Promise<JobRunResult> {
    if (jobName === 'contract-expiry') return this.contractExpiry(tx);
    if (jobName === 'document-expiry') return this.documentExpiry(tx);
    return { processedCount: 0, successCount: 0, failureCount: 0 };
  }

  private async contractExpiry(tx: Prisma.TransactionClient) {
    const today = new Date().toISOString().slice(0, 10);
    const in30 = new Date(Date.now() + 30 * 86_400_000);
    const contracts = await tx.employeeContract.findMany({ where: { status: 'ACTIVE', endDate: { lte: in30 } }, select: { id: true, userId: true, title: true } });
    let successCount = 0;
    for (const contract of contracts) {
      const created = await this.notifications.createForUsers(tx, [contract.userId], {
        type: NotificationType.CONTRACT_EXPIRING,
        title: 'Contract expiring',
        body: contract.title,
        dedupKey: `contract-expiry:${contract.id}:${today}`,
        metadata: { contractId: contract.id },
      }).catch(() => null);
      if (created) successCount += 1;
    }
    return { processedCount: contracts.length, successCount, failureCount: contracts.length - successCount };
  }

  private async documentExpiry(tx: Prisma.TransactionClient) {
    const today = new Date().toISOString().slice(0, 10);
    const in30 = new Date(Date.now() + 30 * 86_400_000);
    const documents = await tx.employeeDocument.findMany({ where: { deletedAt: null, expiryDate: { lte: in30 }, userId: { not: null } }, select: { id: true, userId: true, title: true, fileName: true } });
    let successCount = 0;
    for (const document of documents) {
      if (!document.userId) continue;
      const created = await this.notifications.createForUsers(tx, [document.userId], {
        type: NotificationType.DOCUMENT_EXPIRING,
        title: 'Document expiring',
        body: document.title ?? document.fileName,
        dedupKey: `document-expiry:${document.id}:${today}`,
        metadata: { documentId: document.id },
      }).catch(() => null);
      if (created) successCount += 1;
    }
    return { processedCount: documents.length, successCount, failureCount: documents.length - successCount };
  }
}
