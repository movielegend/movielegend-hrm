import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { ShiftAssignmentStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { RealtimeEventsService } from '../realtime/realtime-events.service';
import { CreateShiftDto, UpdateShiftDto } from './dto/create-shift.dto';

@Injectable()
export class ShiftsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeEventsService,
  ) {}

  async create(dto: CreateShiftDto) {
    const existingCode = await this.prisma.shift.findUnique({
      where: { code: dto.code },
    });
    if (existingCode) {
      throw new ConflictException('Mã ca làm việc này đã tồn tại trong hệ thống!');
    }

    const existingTime = await this.prisma.shift.findFirst({
      where: {
        departmentId: dto.departmentId ?? null,
        startTime: dto.startTime,
        endTime: dto.endTime,
        deletedAt: null,
      },
    });
    if (existingTime) {
      throw new ConflictException(
        dto.departmentId
          ? 'Khung giờ này đã có ca làm việc tồn tại trong phòng ban này!'
          : 'Khung giờ này đã có ca làm việc tồn tại trong hệ thống!',
      );
    }

    // Tự động tính breakMinutes nếu có breakStartTime và breakEndTime
    if (dto.breakStartTime && dto.breakEndTime) {
      const [bsh, bsm] = dto.breakStartTime.split(':').map(Number);
      const [beh, bem] = dto.breakEndTime.split(':').map(Number);
      let bDiff = (beh * 60 + bem) - (bsh * 60 + bsm);
      if (bDiff < 0) bDiff += 24 * 60;
      dto.breakMinutes = bDiff;
    } else if (!dto.breakStartTime || !dto.breakEndTime) {
      dto.breakMinutes = 0;
    }

    try {
      const shift = await this.prisma.shift.create({
        data: dto,
        include: {
          department: { select: { id: true, name: true, code: true } },
        },
      });

      // Bắn Realtime sự kiện tạo ca mới
      if (shift.departmentId) {
        this.realtime.emitToDepartment(shift.departmentId, 'shift:created', shift);
      }
      this.realtime.emitToRoom('company', 'shift:created', shift);

      return shift;
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException('Mã ca làm việc này đã tồn tại trong hệ thống!');
      }
      throw error;
    }
  }

  findAll(departmentId?: string) {
    const where: any = { deletedAt: null };
    if (departmentId) {
      where.OR = [
        { departmentId },
        { departmentId: null },
      ];
    }

    return this.prisma.shift.findMany({
      where,
      orderBy: { startTime: 'asc' },
      include: {
        department: { select: { id: true, name: true, code: true } },
        assignments: {
          include: {
            user: {
              include: {
                profile: true,
                roles: {
                  include: { role: true },
                },
              },
            },
          },
        },
      },
    });
  }

  async update(id: string, dto: UpdateShiftDto) {
    const shift = await this.prisma.shift.findUnique({ where: { id } });
    if (!shift) {
      throw new NotFoundException('Không tìm thấy ca làm việc!');
    }

    // Guard: Kiểm tra nếu sửa khung giờ hoặc tắt ca khi đang có nhân sự trong chu kỳ phân ca
    if (
      (dto.startTime && dto.startTime !== shift.startTime) ||
      (dto.endTime && dto.endTime !== shift.endTime) ||
      dto.isActive === false
    ) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const activeAssignmentsCount = await this.prisma.shiftAssignment.count({
        where: {
          shiftId: id,
          status: ShiftAssignmentStatus.ASSIGNED,
          workDate: { gte: today },
        },
      });

      if (activeAssignmentsCount > 0) {
        throw new ConflictException(
          `Không thể sửa khung giờ hoặc tắt ca làm việc này vì đang có ${activeAssignmentsCount} nhân sự đang được xếp lịch trong chu kỳ phân ca hiện tại. Vui lòng hoàn tất chu kỳ phân ca trước khi sửa!`,
        );
      }
    }

    // Tự động tính breakMinutes nếu sửa giờ nghỉ
    const finalBreakStart = dto.breakStartTime !== undefined ? dto.breakStartTime : shift.breakStartTime;
    const finalBreakEnd = dto.breakEndTime !== undefined ? dto.breakEndTime : shift.breakEndTime;
    if (finalBreakStart && finalBreakEnd) {
      const [bsh, bsm] = finalBreakStart.split(':').map(Number);
      const [beh, bem] = finalBreakEnd.split(':').map(Number);
      let bDiff = (beh * 60 + bem) - (bsh * 60 + bsm);
      if (bDiff < 0) bDiff += 24 * 60;
      dto.breakMinutes = bDiff;
    } else if (dto.breakStartTime === null || dto.breakEndTime === null) {
      dto.breakMinutes = 0;
    }

    const updatedShift = await this.prisma.shift.update({
      where: { id },
      data: dto,
      include: {
        department: { select: { id: true, name: true, code: true } },
      },
    });

    // Bắn Realtime sự kiện sửa ca
    if (updatedShift.departmentId) {
      this.realtime.emitToDepartment(updatedShift.departmentId, 'shift:updated', updatedShift);
    }
    if (shift.departmentId && shift.departmentId !== updatedShift.departmentId) {
      this.realtime.emitToDepartment(shift.departmentId, 'shift:updated', updatedShift);
    }
    this.realtime.emitToRoom('company', 'shift:updated', updatedShift);

    return updatedShift;
  }

  async remove(id: string) {
    const shift = await this.prisma.shift.findUnique({ where: { id } });
    if (!shift) {
      throw new NotFoundException('Không tìm thấy ca làm việc!');
    }

    // Guard: Kiểm tra nhân sự trong chu kỳ phân ca (từ hôm nay trở đi)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activeAssignmentsCount = await this.prisma.shiftAssignment.count({
      where: {
        shiftId: id,
        status: ShiftAssignmentStatus.ASSIGNED,
        workDate: { gte: today },
      },
    });

    if (activeAssignmentsCount > 0) {
      throw new ConflictException(
        `Không thể xóa ca làm việc này vì đang có ${activeAssignmentsCount} nhân sự đang được xếp lịch trong chu kỳ phân ca hiện tại (từ ngày ${today.toLocaleDateString('vi-VN')} trở đi). Vui lòng hoàn tất chu kỳ hoặc hủy lịch phân ca trước khi xóa!`,
      );
    }

    const deleted = await this.prisma.shift.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        code: `${shift.code}_del_${Date.now()}`,
      },
    });

    // Bắn Realtime sự kiện xóa ca
    if (shift.departmentId) {
      this.realtime.emitToDepartment(shift.departmentId, 'shift:deleted', { shiftId: id });
    }
    this.realtime.emitToRoom('company', 'shift:deleted', { shiftId: id });

    return deleted;
  }
}
