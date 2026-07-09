import { Injectable } from '@nestjs/common';
import {
  AccountStatus,
  ApprovalAction,
  ApprovalStatus,
  Prisma,
  RoleScopeType,
} from '@prisma/client';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { badRequest, forbidden, notFound } from '../../common/utils/error.util';
import { PrismaService } from '../../database/prisma.service';
import { ApprovalPolicyService } from './approval-policy.service';
import { ApprovalQueryDto } from './dto/approval-query.dto';
import { RejectDto } from './dto/reject.dto';

@Injectable()
export class ApprovalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policy: ApprovalPolicyService,
  ) {}

  async findAll(actor: AuthenticatedUser, query: ApprovalQueryDto) {
    const visibleDepartmentIds = this.policy.visibleDepartmentIds(actor);
    const requestedDepartmentFilter = this.buildDepartmentFilter(query.departmentId, visibleDepartmentIds);
    const where: Prisma.UserApprovalRequestWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(requestedDepartmentFilter ? { requestedDepartmentId: requestedDepartmentFilter } : {}),
      user: {
        deletedAt: null,
        ...(query.search
          ? {
              OR: [
                { phone: { contains: query.search, mode: 'insensitive' } },
                { userCode: { contains: query.search, mode: 'insensitive' } },
                { profile: { fullName: { contains: query.search, mode: 'insensitive' } } },
              ],
            }
          : {}),
      },
    };
    const [items, total] = await Promise.all([
      this.prisma.userApprovalRequest.findMany({
        where,
        include: {
          requestedDepartment: true,
          user: {
            select: {
              id: true,
              userCode: true,
              phone: true,
              email: true,
              accountStatus: true,
              approvalStatus: true,
              isActive: true,
              createdAt: true,
              updatedAt: true,
              profile: true,
              faceProfile: {
                include: { images: true },
              },
            },
          },
          histories: { orderBy: { createdAt: 'asc' } },
        },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.userApprovalRequest.count({ where }),
    ]);
    return {
      items,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  approve(id: string, actor: AuthenticatedUser) {
    return this.prisma.$transaction(async (tx) => {
      const request = await this.findPendingRequest(tx, id);
      if (!this.policy.canApproveDepartment(actor, request.requestedDepartmentId)) {
        throw forbidden('APPROVAL_SCOPE_DENIED', 'Bạn không có quyền duyệt phòng ban này');
      }
      await tx.userApprovalRequest.update({
        where: { id },
        data: {
          status: ApprovalStatus.APPROVED,
          decidedByUserId: actor.userId,
          decidedAt: new Date(),
        },
      });
      await tx.user.update({
        where: { id: request.userId },
        data: {
          approvalStatus: ApprovalStatus.APPROVED,
          accountStatus: AccountStatus.ACTIVE,
          isActive: true,
        },
      });
      await tx.departmentMember.upsert({
        where: {
          departmentId_userId: {
            departmentId: request.requestedDepartmentId,
            userId: request.userId,
          },
        },
        create: {
          departmentId: request.requestedDepartmentId,
          userId: request.userId,
          isPrimary: true,
        },
        update: { leftAt: null, isPrimary: true },
      });

      const employeeRole = await tx.role.findUnique({ where: { code: 'EMPLOYEE' } });
      if (employeeRole) {
        const existingUserRole = await tx.userRole.findFirst({
          where: {
            userId: request.userId,
            roleId: employeeRole.id,
            scopeType: RoleScopeType.GLOBAL,
          },
        });
        
        if (!existingUserRole) {
          await tx.userRole.create({
            data: {
              userId: request.userId,
              roleId: employeeRole.id,
              scopeType: RoleScopeType.GLOBAL,
            },
          });
        }
      }

      await tx.approvalHistory.create({
        data: {
          approvalRequestId: id,
          actorUserId: actor.userId,
          action: ApprovalAction.APPROVED,
          note: 'Tài khoản được duyệt',
        },
      });
      await tx.auditLog.create({
        data: {
          actorUserId: actor.userId,
          action: 'approval.account.approve',
          entityType: 'UserApprovalRequest',
          entityId: id,
          metadata: { userId: request.userId, departmentId: request.requestedDepartmentId },
        },
      });
      return { id, status: ApprovalStatus.APPROVED };
    });
  }

  reject(id: string, dto: RejectDto, actor: AuthenticatedUser) {
    return this.prisma.$transaction(async (tx) => {
      const request = await this.findPendingRequest(tx, id);
      if (!this.policy.canApproveDepartment(actor, request.requestedDepartmentId)) {
        throw forbidden('APPROVAL_SCOPE_DENIED', 'Bạn không có quyền từ chối phòng ban này');
      }
      await tx.userApprovalRequest.update({
        where: { id },
        data: {
          status: ApprovalStatus.REJECTED,
          rejectionReason: dto.reason,
          decidedByUserId: actor.userId,
          decidedAt: new Date(),
        },
      });
      await tx.user.update({
        where: { id: request.userId },
        data: {
          approvalStatus: ApprovalStatus.REJECTED,
          isActive: false,
        },
      });
      await tx.approvalHistory.create({
        data: {
          approvalRequestId: id,
          actorUserId: actor.userId,
          action: ApprovalAction.REJECTED,
          note: dto.reason,
        },
      });
      await tx.auditLog.create({
        data: {
          actorUserId: actor.userId,
          action: 'approval.account.reject',
          entityType: 'UserApprovalRequest',
          entityId: id,
          metadata: { reason: dto.reason },
        },
      });
      return { id, status: ApprovalStatus.REJECTED };
    });
  }

  private async findPendingRequest(tx: Prisma.TransactionClient, id: string) {
    const request = await tx.userApprovalRequest.findUnique({ where: { id } });
    if (!request) throw notFound('APPROVAL_REQUEST_NOT_FOUND', 'Không tìm thấy yêu cầu duyệt');
    if (request.status !== ApprovalStatus.PENDING) {
      throw badRequest('APPROVAL_REQUEST_NOT_PENDING', 'Yêu cầu không còn ở trạng thái chờ duyệt');
    }
    return request;
  }

  private buildDepartmentFilter(
    requestedDepartmentId: string | undefined,
    visibleDepartmentIds: string[] | null,
  ): string | Prisma.StringFilter<'UserApprovalRequest'> | undefined {
    if (visibleDepartmentIds === null) return requestedDepartmentId;
    if (requestedDepartmentId) {
      return visibleDepartmentIds.includes(requestedDepartmentId)
        ? requestedDepartmentId
        : { in: ['00000000-0000-0000-0000-000000000000'] };
    }
    return { in: visibleDepartmentIds.length ? visibleDepartmentIds : ['00000000-0000-0000-0000-000000000000'] };
  }
}
