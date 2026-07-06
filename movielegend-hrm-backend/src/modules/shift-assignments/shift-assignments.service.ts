import { Injectable } from '@nestjs/common';
import { AccountStatus, ShiftAssignmentStatus } from '@prisma/client';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { badRequest, conflict, notFound } from '../../common/utils/error.util';
import { PrismaService } from '../../database/prisma.service';
import { DepartmentScopeService } from '../phase2-policy/department-scope.service';
import { AssignShiftDto } from './dto/shift-assignment.dto';
import { ShiftRegistrationDto, ShiftSwapDto } from './dto/shift-request.dto';

@Injectable()
export class ShiftAssignmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scope: DepartmentScopeService,
  ) {}

  async assign(dto: AssignShiftDto, actor: AuthenticatedUser) {
    this.scope.assertDepartmentAccess(actor, dto.departmentId);
    await this.scope.assertUserInDepartment(dto.userId, dto.departmentId);
    const workDate = new Date(dto.workDate);
    return this.prisma.$transaction(async (tx) => {
      const [user, shift, existing] = await Promise.all([
        tx.user.findUnique({ where: { id: dto.userId } }),
        tx.shift.findUnique({ where: { id: dto.shiftId } }),
        tx.shiftAssignment.findUnique({ where: { userId_workDate: { userId: dto.userId, workDate } } }),
      ]);
      if (!user || !user.isActive || user.accountStatus === AccountStatus.RESIGNED || user.accountStatus === AccountStatus.TERMINATED) {
        throw badRequest('USER_NOT_ACTIVE', 'User không còn active để phân ca');
      }
      if (!shift) throw notFound('SHIFT_NOT_FOUND', 'Không tìm thấy ca làm');
      if (!shift.isActive || shift.deletedAt) throw badRequest('SHIFT_INACTIVE', 'Ca làm đã bị vô hiệu hóa');
      if (existing) throw conflict('SHIFT_ALREADY_ASSIGNED', 'Nhân viên đã được phân ca trong ngày này');

      const assignment = await tx.shiftAssignment.create({
        data: {
          userId: dto.userId,
          departmentId: dto.departmentId,
          shiftId: dto.shiftId,
          workDate,
          assignedByUserId: actor.userId,
        },
        include: {
          shift: true,
          user: {
            select: {
              id: true,
              userCode: true,
              phone: true,
              email: true,
              profile: true,
            },
          },
          department: true,
        },
      });
      await tx.auditLog.create({
        data: {
          actorUserId: actor.userId,
          action: 'shift.assign',
          entityType: 'ShiftAssignment',
          entityId: assignment.id,
          metadata: { userId: dto.userId, departmentId: dto.departmentId, shiftId: dto.shiftId, workDate: dto.workDate },
        },
      });
      return assignment;
    });
  }

  mySchedule(userId: string) {
    return this.prisma.shiftAssignment.findMany({
      where: { userId, status: ShiftAssignmentStatus.ASSIGNED },
      include: { shift: true, department: true },
      orderBy: { workDate: 'asc' },
    });
  }

  async registerShift(dto: ShiftRegistrationDto, actor: AuthenticatedUser) {
    const departmentId = await this.scope.getPrimaryDepartmentId(actor.userId);
    return this.prisma.shiftRegistration.create({
      data: {
        userId: actor.userId,
        departmentId,
        shiftId: dto.shiftId,
        workDate: new Date(dto.workDate),
        reason: dto.reason,
      },
    });
  }

  async requestSwap(dto: ShiftSwapDto, actor: AuthenticatedUser) {
    const departmentId = await this.scope.getPrimaryDepartmentId(actor.userId);
    await this.scope.assertUserInDepartment(dto.targetUserId, departmentId);
    return this.prisma.shiftSwap.create({
      data: {
        requesterUserId: actor.userId,
        targetUserId: dto.targetUserId,
        departmentId,
        fromShiftId: dto.fromShiftId,
        toShiftId: dto.toShiftId,
        fromDate: new Date(dto.fromDate),
        toDate: new Date(dto.toDate),
        reason: dto.reason,
      },
    });
  }
}
