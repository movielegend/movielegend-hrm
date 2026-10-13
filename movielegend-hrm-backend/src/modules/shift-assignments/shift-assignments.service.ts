import { Injectable } from '@nestjs/common';
import { AccountStatus, ShiftAssignmentStatus } from '@prisma/client';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { badRequest, conflict, notFound } from '../../common/utils/error.util';
import { PrismaService } from '../../database/prisma.service';
import { DepartmentScopeService } from '../phase2-policy/department-scope.service';
import { AssignShiftDto, BatchAssignShiftDto, DepartmentAssignmentsQueryDto } from './dto/shift-assignment.dto';
import { ShiftRegistrationDto, ShiftSwapDto } from './dto/shift-request.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '@prisma/client';

@Injectable()
export class ShiftAssignmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scope: DepartmentScopeService,
    private readonly notifications: NotificationsService,
  ) {}

  async assign(dto: AssignShiftDto, actor: AuthenticatedUser) {
    await this.scope.assertDepartmentAccessAsync(actor, dto.departmentId);
    await this.scope.assertUserInDepartment(dto.userId, dto.departmentId);
    const workDate = new Date(dto.workDate);
    return this.prisma.$transaction(async (tx) => {
      const [user, shift, existing] = await Promise.all([
        tx.user.findUnique({ where: { id: dto.userId }, include: { roles: { include: { role: true } } } }),
        tx.shift.findUnique({ where: { id: dto.shiftId } }),
        tx.shiftAssignment.findUnique({ where: { userId_workDate: { userId: dto.userId, workDate } } }),
      ]);
      if (!user || !user.isActive || user.accountStatus === AccountStatus.RESIGNED || user.accountStatus === AccountStatus.TERMINATED) {
        throw badRequest('USER_NOT_ACTIVE', 'User không còn active để phân ca');
      }
      

      const isLeaderActor = !actor.roles.includes('ADMIN') && !actor.roles.includes('HR');
      if (isLeaderActor) {
        const isTargetAdmin = user.roles.some(
          (r: any) => r.role?.code === 'ADMIN' || r.role?.code === 'admin'
        );
        if (isTargetAdmin) {
          throw badRequest('FORBIDDEN', 'Leader không thể phân ca cho Quản trị viên (Admin)');
        }
      }

      if (!shift) throw notFound('SHIFT_NOT_FOUND', 'Không tìm thấy ca làm');
      if (!shift.isActive || shift.deletedAt) throw badRequest('SHIFT_INACTIVE', 'Ca làm đã bị vô hiệu hóa');

      if (existing) {
        if (!dto.allowOverwrite) {
          throw conflict('SHIFT_ALREADY_ASSIGNED', 'Nhân viên đã được phân ca trong ngày này');
        }

        // Kiểm tra xem nhân sự đã check-in ca ngày này chưa
        const checkedIn = await tx.attendanceRecord.findFirst({
          where: { userId: dto.userId, workDate },
        });
        if (checkedIn) {
          throw badRequest('ALREADY_CHECKED_IN', 'Nhân viên đã check-in ca ngày hôm nay, không thể điều chuyển ca.');
        }

        const assignment = await tx.shiftAssignment.update({
          where: { id: existing.id },
          data: {
            departmentId: dto.departmentId,
            shiftId: dto.shiftId,
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
            action: 'shift.reassign',
            entityType: 'ShiftAssignment',
            entityId: assignment.id,
            metadata: {
              userId: dto.userId,
              departmentId: dto.departmentId,
              shiftId: dto.shiftId,
              oldShiftId: existing.shiftId,
              workDate: dto.workDate,
              reason: dto.reason || 'Điều chuyển ca',
            },
          },
        });

        const notif = await this.notifications.createForUsers(tx as any, [dto.userId], {
          type: 'SYSTEM' as NotificationType,
          title: 'Điều chuyển ca làm việc',
          body: `Lịch làm việc ngày ${workDate.toLocaleDateString('vi-VN')} của bạn đã được điều chỉnh sang ${shift.name}.`,
          metadata: { shiftId: shift.id, assignmentId: assignment.id, reason: dto.reason },
        });
        if (notif) this.notifications.emitCreated(notif);

        return assignment;
      }

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

      const notif = await this.notifications.createForUsers(tx as any, [dto.userId], {
        type: 'SYSTEM' as NotificationType,
        title: 'Phân ca mới',
        body: `Bạn đã được phân ca ${shift.name} vào ngày ${workDate.toLocaleDateString('vi-VN')}.`,
        metadata: { shiftId: shift.id, assignmentId: assignment.id },
      });
      if (notif) this.notifications.emitCreated(notif);

      return assignment;
    });
  }

  async assignBatch(dto: BatchAssignShiftDto, actor: AuthenticatedUser) {
    await this.scope.assertDepartmentAccessAsync(actor, dto.departmentId);
    if (!dto.userIds || dto.userIds.length === 0 || !dto.dates || dto.dates.length === 0) {
      throw badRequest('INVALID_BATCH', 'Vui lòng chọn nhân viên và ngày phân ca');
    }

    const shift = await this.prisma.shift.findUnique({ where: { id: dto.shiftId } });
    if (!shift || !shift.isActive || shift.deletedAt) {
      throw badRequest('SHIFT_INACTIVE', 'Ca làm không hợp lệ hoặc đã bị vô hiệu hóa');
    }

    const sortedDates = [...dto.dates].sort();
    const minDateStr = new Date(sortedDates[0]).toLocaleDateString('vi-VN');
    const maxDateStr = new Date(sortedDates[sortedDates.length - 1]).toLocaleDateString('vi-VN');

    let bodyText = `Bạn đã được phân ca ${shift.name} vào ngày ${minDateStr}.`;
    if (sortedDates.length > 1) {
      if (minDateStr === maxDateStr) {
        bodyText = `Bạn đã được phân ca ${shift.name} vào ngày ${minDateStr}.`;
      } else {
        bodyText = `Bạn đã được phân ca ${shift.name} từ ngày ${minDateStr} đến ngày ${maxDateStr}.`;
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const createdAssignments = [];
      for (const userId of dto.userIds) {
        await this.scope.assertUserInDepartment(userId, dto.departmentId);
        
        if (!actor.roles.includes('ADMIN') && !actor.roles.includes('HR')) {
          const targetUser = await tx.user.findUnique({
            where: { id: userId },
            include: { roles: { include: { role: true } } },
          });
          const isTargetAdmin = targetUser?.roles.some(
            (r: any) => r.role?.code === 'ADMIN' || r.role?.code === 'admin'
          );
          if (isTargetAdmin) {
            throw badRequest('FORBIDDEN', `Leader không thể phân ca cho Quản trị viên (${targetUser?.userCode || userId})`);
          }
        }
        
        for (const dateStr of dto.dates) {
          const workDate = new Date(dateStr);
          const existing = await tx.shiftAssignment.findUnique({
            where: { userId_workDate: { userId, workDate } }
          });
          if (existing) {
            if (dto.allowOverwrite && existing.shiftId !== dto.shiftId) {
              const checkedIn = await tx.attendanceRecord.findFirst({
                where: { userId, workDate },
              });
              if (!checkedIn) {
                const updated = await tx.shiftAssignment.update({
                  where: { id: existing.id },
                  data: {
                    departmentId: dto.departmentId,
                    shiftId: dto.shiftId,
                    assignedByUserId: actor.userId,
                  },
                });
                createdAssignments.push(updated);

                await tx.auditLog.create({
                  data: {
                    actorUserId: actor.userId,
                    action: 'shift.reassign',
                    entityType: 'ShiftAssignment',
                    entityId: existing.id,
                    metadata: {
                      userId,
                      departmentId: dto.departmentId,
                      shiftId: dto.shiftId,
                      oldShiftId: existing.shiftId,
                      workDate: dateStr,
                      reason: dto.reason || 'Điều chuyển/Vá ca',
                    },
                  },
                });
              }
            }
            continue;
          }

          const assignment = await tx.shiftAssignment.create({
            data: {
              userId,
              departmentId: dto.departmentId,
              shiftId: dto.shiftId,
              workDate,
              assignedByUserId: actor.userId,
            }
          });
          createdAssignments.push(assignment);
        }

        const notif = await this.notifications.createForUsers(tx as any, [userId], {
          type: 'SYSTEM' as NotificationType,
          title: 'Phân ca mới',
          body: bodyText,
          metadata: { shiftId: shift.id, totalDays: dto.dates.length },
        });
        if (notif) this.notifications.emitCreated(notif);
      }

      return { count: createdAssignments.length };
    });
  }

  async getDepartmentAssignments(query: DepartmentAssignmentsQueryDto, actor: AuthenticatedUser) {
    await this.scope.assertDepartmentAccessAsync(actor, query.departmentId);
    const start = new Date(query.startDate);
    const end = new Date(query.endDate);
    return this.prisma.shiftAssignment.findMany({
      where: {
        departmentId: query.departmentId,
        workDate: {
          gte: start,
          lte: end,
        },
        status: ShiftAssignmentStatus.ASSIGNED,
      },
      include: {
        shift: true,
        attendanceRecords: {
          select: {
            id: true,
            checkInAt: true,
            checkOutAt: true,
            status: true,
          },
        },
        user: {
          select: {
            id: true,
            userCode: true,
            phone: true,
            email: true,
            profile: true,
          },
        },
      },
      orderBy: [{ workDate: 'asc' }, { createdAt: 'desc' }],
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

  async revokeAssignment(id: string, actor: AuthenticatedUser) {
    const assignment = await this.prisma.shiftAssignment.findUnique({
      where: { id },
    });
    if (!assignment) {
      throw notFound('ASSIGNMENT_NOT_FOUND', 'Không tìm thấy ca phân công');
    }
    
    await this.scope.assertDepartmentAccessAsync(actor, assignment.departmentId);

    if (assignment.status !== ShiftAssignmentStatus.ASSIGNED) {
      throw badRequest('INVALID_STATUS', 'Chỉ có thể thu hồi ca đang ở trạng thái phân công (ASSIGNED)');
    }

    await this.prisma.shiftAssignment.delete({ where: { id } });
    return { success: true };
  }
}
