import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateShiftDto, UpdateShiftDto } from './dto/create-shift.dto';

@Injectable()
export class ShiftsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateShiftDto) {
    const existingCode = await this.prisma.shift.findUnique({
      where: { code: dto.code },
    });
    if (existingCode) {
      throw new ConflictException('Mã ca làm việc này đã tồn tại trong hệ thống!');
    }

    const existingTime = await this.prisma.shift.findFirst({
      where: {
        startTime: dto.startTime,
        endTime: dto.endTime,
        deletedAt: null,
      },
    });
    if (existingTime) {
      throw new ConflictException('Khung giờ này đã có ca làm việc tồn tại!');
    }

    try {
      return await this.prisma.shift.create({ data: dto });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException('Mã ca làm việc này đã tồn tại trong hệ thống!');
      }
      throw error;
    }
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
                roles: {
                  include: { role: true }
                }
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

}
