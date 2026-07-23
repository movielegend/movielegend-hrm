import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateOrUpdateDeptOvertimeConfigDto } from './dto/dept-overtime-config.dto';

@Injectable()
export class DeptOvertimeConfigService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.departmentOvertimeConfig.findMany({
      include: { department: true },
    });
  }

  async findByDepartmentId(departmentId: string) {
    return this.prisma.departmentOvertimeConfig.findUnique({
      where: { departmentId },
    });
  }

  async upsert(dto: CreateOrUpdateDeptOvertimeConfigDto) {
    return this.prisma.departmentOvertimeConfig.upsert({
      where: { departmentId: dto.departmentId },
      update: {
        weekdayMultiplier: dto.weekdayMultiplier,
        weekendMultiplier: dto.weekendMultiplier,
        holidayMultiplier: dto.holidayMultiplier,
        nightAllowanceAmount: dto.nightAllowanceAmount,
        nightStartHour: dto.nightStartHour,
        lateDeductionAmount: dto.lateDeductionAmount,
        lateThresholdMinutes: dto.lateThresholdMinutes,
        isActive: dto.isActive,
      },
      create: {
        departmentId: dto.departmentId,
        weekdayMultiplier: dto.weekdayMultiplier ?? 1.5,
        weekendMultiplier: dto.weekendMultiplier ?? 2.0,
        holidayMultiplier: dto.holidayMultiplier ?? 3.0,
        nightAllowanceAmount: dto.nightAllowanceAmount ?? 50000,
        nightStartHour: dto.nightStartHour ?? 21,
        lateDeductionAmount: dto.lateDeductionAmount ?? 50000,
        lateThresholdMinutes: dto.lateThresholdMinutes ?? 5,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async remove(id: string) {
    return this.prisma.departmentOvertimeConfig.delete({
      where: { id },
    });
  }
}
