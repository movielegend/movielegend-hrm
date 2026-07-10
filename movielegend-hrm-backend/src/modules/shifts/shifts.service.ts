import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateShiftDto, UpdateShiftDto } from './dto/create-shift.dto';

@Injectable()
export class ShiftsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateShiftDto) {
    return this.prisma.shift.create({ data: dto });
  }

  findAll() {
    return this.prisma.shift.findMany({
      where: { deletedAt: null },
      orderBy: { startTime: 'asc' },
      include: {
        assignments: {
          include: {
            user: {
              include: {
                profile: true,
              },
            },
          },
        },
      },
    });
  }

  update(id: string, dto: UpdateShiftDto) {
    return this.prisma.shift.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    const shift = await this.prisma.shift.findUnique({ where: { id } });
    if (!shift) return;
    return this.prisma.shift.update({
      where: { id },
      data: { 
        deletedAt: new Date(),
        code: `${shift.code}_del_${Date.now()}`
      },
    });
  }

  async deleteAllAssignments() {
    try {
      await this.prisma.$executeRawUnsafe('DELETE FROM "attendance_records"');
      await this.prisma.$executeRawUnsafe('DELETE FROM "shift_assignments"');
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }
}
