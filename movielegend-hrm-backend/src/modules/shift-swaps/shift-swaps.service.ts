import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateShiftSwapDto } from './dto/create-shift-swap.dto';
import { UpdateShiftSwapStatusDto } from './dto/update-shift-swap-status.dto';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { ShiftSwapStatus, NotificationType } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ShiftSwapsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async getAvailableTargets(user: AuthenticatedUser) {
    // Tìm các phòng ban của user hiện tại
    const currentUser = await this.prisma.user.findUnique({
      where: { id: user.userId },
      include: { departmentLinks: { where: { leftAt: null } } }
    });
    const departmentIds = currentUser?.departmentLinks.map((d: any) => d.departmentId) || [];

    if (departmentIds.length === 0) return { items: [] };

    // Tìm các user khác trong cùng phòng ban
    const colleagues = await this.prisma.user.findMany({
      where: {
        id: { not: user.userId },
        deletedAt: null,
        accountStatus: 'ACTIVE',
        departmentLinks: {
          some: {
            departmentId: { in: departmentIds },
            leftAt: null
          }
        }
      },
      select: {
        id: true,
        profile: { select: { fullName: true, avatarUrl: true } }
      }
    });

    return {
      items: colleagues.map(c => ({
        id: c.id,
        fullName: c.profile?.fullName || 'Không tên',
        avatarUrl: c.profile?.avatarUrl
      }))
    };
  }

  async getTargetShift(targetUserId: string, date: string, user: AuthenticatedUser) {
    const workDate = new Date(date);
    const targetAssignment = await this.prisma.shiftAssignment.findFirst({
      where: {
        userId: targetUserId,
        workDate: workDate,
      },
      include: { shift: true }
    });
    
    if (!targetAssignment) {
      throw new NotFoundException('Nhân viên này không có ca làm việc nào trong ngày này');
    }
    
    return targetAssignment;
  }

  async create(dto: CreateShiftSwapDto, user: AuthenticatedUser) {
    // Validate source assignment
    const sourceAssignment = await this.prisma.shiftAssignment.findUnique({
      where: { id: dto.fromShiftAssignmentId },
      include: { shift: true },
    });
    if (!sourceAssignment || sourceAssignment.userId !== user.userId) {
      throw new BadRequestException('Ca làm việc gốc không hợp lệ');
    }

    // Validate target assignment
    const targetAssignment = await this.prisma.shiftAssignment.findUnique({
      where: { id: dto.toShiftAssignmentId },
      include: { shift: true },
    });
    if (!targetAssignment || targetAssignment.userId !== dto.targetUserId) {
      throw new BadRequestException('Ca làm việc đích không hợp lệ');
    }

    if (sourceAssignment.departmentId !== targetAssignment.departmentId) {
      throw new BadRequestException('Chỉ có thể đổi ca trong cùng một phòng ban');
    }

    const requester = await this.prisma.user.findUnique({
      where: { id: user.userId },
      include: { profile: true },
    });
    const requesterName = requester?.profile?.fullName || requester?.email || 'một nhân viên';

    const swap = await this.prisma.shiftSwap.create({
      data: {
        requesterUserId: user.userId,
        targetUserId: dto.targetUserId,
        departmentId: sourceAssignment.departmentId,
        fromShiftId: sourceAssignment.shiftId,
        fromDate: sourceAssignment.workDate,
        toShiftId: targetAssignment.shiftId,
        toDate: targetAssignment.workDate,
        reason: dto.reason,
        status: ShiftSwapStatus.PENDING_TARGET_APPROVAL,
      },
      include: { requester: true, target: true, fromShift: true, toShift: true },
    });

    const notif = await this.notificationsService.createForUsers(this.prisma, [dto.targetUserId], {
      type: NotificationType.SYSTEM,
      title: 'Yêu cầu đổi ca làm việc',
      body: `Bạn có một yêu cầu đổi ca làm việc từ ${requesterName}.`,
      metadata: { swapId: swap.id },
    });
    this.notificationsService.emitCreated(notif);

    return swap;
  }

  async findOne(id: string, user: AuthenticatedUser) {
    const swap = await this.prisma.shiftSwap.findUnique({
      where: { id },
      include: { 
        requester: { include: { profile: true } }, 
        target: { include: { profile: true } }, 
        fromShift: true, 
        toShift: true 
      },
    });
    if (!swap) throw new NotFoundException('Không tìm thấy đơn đổi ca');
    return swap;
  }

  async findMySwaps(user: AuthenticatedUser) {
    return this.prisma.shiftSwap.findMany({
      where: {
        OR: [
          { requesterUserId: user.userId },
          { targetUserId: user.userId }
        ]
      },
      include: { 
        requester: { include: { profile: true } }, 
        target: { include: { profile: true } }, 
        fromShift: true, 
        toShift: true 
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findLeaderPendingSwaps(user: AuthenticatedUser) {
    const leaderDepartments = await this.prisma.department.findMany({
      where: { leaderUserId: user.userId },
      select: { id: true }
    });
    
    if (leaderDepartments.length === 0) return [];

    const departmentIds = leaderDepartments.map(d => d.id);

    return this.prisma.shiftSwap.findMany({
      where: { 
        departmentId: { in: departmentIds },
        status: ShiftSwapStatus.PENDING_LEADER_APPROVAL
      },
      include: { 
        requester: { include: { profile: true } }, 
        target: { include: { profile: true } }, 
        fromShift: true, 
        toShift: true 
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async updateStatus(id: string, dto: UpdateShiftSwapStatusDto, user: AuthenticatedUser) {
    const swap = await this.prisma.shiftSwap.findUnique({ where: { id } });
    if (!swap) throw new NotFoundException('Không tìm thấy đơn đổi ca');

    const isLeader = await this.prisma.department.findFirst({
      where: { id: swap.departmentId, leaderUserId: user.userId }
    });
    
    const isTargetUser = user.userId === swap.targetUserId;

    if (!isLeader && !isTargetUser) {
       throw new ForbiddenException('Bạn không có quyền thao tác trên đơn này');
    }

    if (isTargetUser && !isLeader) {
      if (swap.status !== ShiftSwapStatus.PENDING_TARGET_APPROVAL) {
        throw new BadRequestException('Trạng thái đơn không hợp lệ để bạn xác nhận');
      }
      if (dto.status !== ShiftSwapStatus.PENDING_LEADER_APPROVAL && dto.status !== ShiftSwapStatus.REJECTED) {
        throw new BadRequestException('Trạng thái cập nhật không hợp lệ');
      }
    }

    if (isLeader) {
      if (swap.status !== ShiftSwapStatus.PENDING_LEADER_APPROVAL) {
        throw new BadRequestException('Đơn chưa sẵn sàng hoặc đã được xử lý');
      }
      if (dto.status !== ShiftSwapStatus.APPROVED && dto.status !== ShiftSwapStatus.REJECTED) {
        throw new BadRequestException('Trạng thái cập nhật không hợp lệ');
      }
    }

    return this.prisma.$transaction(async (tx: any) => {
      const updatedSwap = await tx.shiftSwap.update({
        where: { id },
        data: {
          status: dto.status,
          reason: dto.reason,
          decidedByUserId: isLeader ? user.userId : swap.decidedByUserId,
          decidedAt: isLeader ? new Date() : swap.decidedAt,
        },
        include: { requester: true, target: true, fromShift: true, toShift: true },
      });

      // Target user accepted => notify leader
      if (dto.status === ShiftSwapStatus.PENDING_LEADER_APPROVAL) {
        const department = await tx.department.findUnique({
          where: { id: swap.departmentId },
          select: { leaderUserId: true }
        });
        if (department?.leaderUserId) {
          const notif1 = await this.notificationsService.createForUsers(tx, [department.leaderUserId], {
            type: NotificationType.SYSTEM,
            title: 'Yêu cầu duyệt đổi ca',
            body: `Nhân viên đã xác nhận đổi ca. Vui lòng kiểm tra và duyệt yêu cầu.`,
            metadata: { swapId: updatedSwap.id },
          });
          this.notificationsService.emitCreated(notif1);
        }
      }
      // Leader approved/rejected => notify both users
      if (isLeader && (dto.status === ShiftSwapStatus.APPROVED || dto.status === ShiftSwapStatus.REJECTED)) {
        const statusText = dto.status === ShiftSwapStatus.APPROVED ? 'được duyệt' : 'bị từ chối';
        const notif2 = await this.notificationsService.createForUsers(tx, [swap.requesterUserId, swap.targetUserId], {
          type: NotificationType.SYSTEM,
          title: 'Kết quả đơn đổi ca',
          body: `Đơn đổi ca của bạn đã ${statusText} bởi Quản lý.`,
          metadata: { swapId: updatedSwap.id },
        });
        this.notificationsService.emitCreated(notif2);
      }

      // If approved by leader, swap the assignments!
      if (dto.status === ShiftSwapStatus.APPROVED && isLeader) {
        const sourceAssignment = await tx.shiftAssignment.findFirst({
          where: { userId: swap.requesterUserId, workDate: swap.fromDate, shiftId: swap.fromShiftId }
        });
        const targetAssignment = await tx.shiftAssignment.findFirst({
          where: { userId: swap.targetUserId, workDate: swap.toDate, shiftId: swap.toShiftId }
        });

        if (sourceAssignment && targetAssignment) {
          // Temporarily set a fake date to avoid unique constraint [userId, workDate] if swapping on the same day
          const originalDate = sourceAssignment.workDate;
          await tx.shiftAssignment.update({
            where: { id: sourceAssignment.id },
            data: { workDate: new Date('1970-01-01') }
          });
          await tx.shiftAssignment.update({
            where: { id: targetAssignment.id },
            data: { userId: swap.requesterUserId }
          });
          await tx.shiftAssignment.update({
            where: { id: sourceAssignment.id },
            data: { userId: swap.targetUserId, workDate: originalDate }
          });
        }
      }

      return updatedSwap;
    });
  }
}
