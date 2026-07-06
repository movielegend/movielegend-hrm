import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AuditLogQueryDto } from './dto/audit-log-query.dto';

@Injectable()
export class AuditLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: AuditLogQueryDto) {
    const limit = Math.min(query.limit ?? 50, 500);
    const page = query.page ?? 1;
    const where = {
      actorUserId: query.userId,
      action: query.action ? { contains: query.action, mode: 'insensitive' as const } : undefined,
      entityType: query.entityType ?? query.module,
      entityId: query.entityId,
      createdAt: {
        gte: query.fromDate ? new Date(query.fromDate) : undefined,
        lte: query.toDate ? new Date(query.toDate) : undefined,
      },
    };
    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: { actor: { select: { id: true, userCode: true, phone: true } } },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLog.count({ where }),
    ]);
    return { items, pagination: { page, limit, total } };
  }
}
