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
    });
  }

  update(id: string, dto: UpdateShiftDto) {
    return this.prisma.shift.update({ where: { id }, data: dto });
  }
}
