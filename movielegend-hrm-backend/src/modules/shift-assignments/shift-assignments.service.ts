import { Injectable } from '@nestjs/common';
import { AccountStatus, ShiftAssignmentStatus } from '@prisma/client';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { badRequest, conflict, notFound } from '../../common/utils/error.util';
import { PrismaService } from '../../database/prisma.service';
import { DepartmentScopeService } from '../phase2-policy/department-scope.service';
import { AssignShiftDto, BatchAssignShiftDto, DepartmentAssignmentsQueryDto, BatchDeleteShiftCellsDto, BatchUpsertShiftCellsDto } from './dto/shift-assignment.dto';
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

  async batchDeleteCells(dto: BatchDeleteShiftCellsDto, actor: AuthenticatedUser) {
    if (!dto.items || dto.items.length === 0) {
      return { count: 0 };
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const orConditions: any[] = [];
    for (const item of dto.items) {
      if (item.id && uuidRegex.test(item.id)) {
        orConditions.push({ id: item.id });
      } else if (item.userId && item.workDate) {
        orConditions.push({
          userId: item.userId,
          workDate: new Date(item.workDate),
        });
      }
    }

    if (orConditions.length === 0) {
      return { count: 0 };
    }

    const assignments = await this.prisma.shiftAssignment.findMany({
      where: {
        OR: orConditions,
        status: ShiftAssignmentStatus.ASSIGNED,
      },
    });

    if (assignments.length === 0) {
      return { count: 0 };
    }

    const deptIds = Array.from(new Set(assignments.map((a) => a.departmentId)));
    for (const dId of deptIds) {
      await this.scope.assertDepartmentAccessAsync(actor, dId);
    }

    const assignmentIds = assignments.map((a) => a.id);
    const checkedInRecords = await this.prisma.attendanceRecord.findMany({
      where: {
        shiftAssignmentId: { in: assignmentIds },
      },
      select: { shiftAssignmentId: true },
    });
    const checkedInSet = new Set(checkedInRecords.map((r) => r.shiftAssignmentId));
    const deletableIds = assignmentIds.filter((id) => !checkedInSet.has(id));

    if (deletableIds.length === 0) {
      return { count: 0 };
    }

    const deleteResult = await this.prisma.shiftAssignment.deleteMany({
      where: {
        id: { in: deletableIds },
      },
    });

    return { count: deleteResult.count };
  }

  async batchUpsertCells(dto: BatchUpsertShiftCellsDto, actor: AuthenticatedUser) {
    if (!dto.items || dto.items.length === 0) {
      return { count: 0 };
    }

    const deptIds = Array.from(new Set(dto.items.map((i) => i.departmentId)));
    for (const dId of deptIds) {
      await this.scope.assertDepartmentAccessAsync(actor, dId);
    }

    return this.prisma.$transaction(async (tx) => {
      let count = 0;
      for (const item of dto.items) {
        await this.scope.assertUserInDepartment(item.userId, item.departmentId);
        const workDate = new Date(item.workDate);

        const existing = await tx.shiftAssignment.findUnique({
          where: { userId_workDate: { userId: item.userId, workDate } },
        });

        if (existing) {
          const checkedIn = await tx.attendanceRecord.findFirst({
            where: { userId: item.userId, workDate },
          });
          if (!checkedIn) {
            await tx.shiftAssignment.update({
              where: { id: existing.id },
              data: {
                departmentId: item.departmentId,
                shiftId: item.shiftId,
                assignedByUserId: actor.userId,
              },
            });
            count++;
          }
        } else {
          await tx.shiftAssignment.create({
            data: {
              userId: item.userId,
              departmentId: item.departmentId,
              shiftId: item.shiftId,
              workDate,
              assignedByUserId: actor.userId,
            },
          });
          count++;
        }
      }
      return { count };
    });
  }
}

