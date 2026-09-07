import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateOrUpdateDeptOvertimeConfigDto } from './dto/dept-overtime-config.dto';

import { DepartmentScopeService } from '../phase2-policy/department-scope.service';

@Injectable()
export class DeptOvertimeConfigService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scopes: DepartmentScopeService,
  ) {}

  async findAll(user: import('../../common/interfaces/authenticated-user.interface').AuthenticatedUser) {
    const visibleDepts = await this.scopes.getVisibleDepartmentIds(user);
    const scopeFilter = visibleDepts !== null ? { in: visibleDepts.length > 0 ? visibleDepts : ['00000000-0000-0000-0000-000000000000'] } : undefined;
    return this.prisma.departmentOvertimeConfig.findMany({
      where: scopeFilter ? { departmentId: scopeFilter } : undefined,
      include: { department: true },
    });
  }

  async findByDepartmentId(departmentId: string, user: import('../../common/interfaces/authenticated-user.interface').AuthenticatedUser) {
    await this.scopes.assertDepartmentAccessAsync(user, departmentId);
    return this.prisma.departmentOvertimeConfig.findUnique({
      where: { departmentId },
    });
  }

  async upsert(dto: CreateOrUpdateDeptOvertimeConfigDto, user: import('../../common/interfaces/authenticated-user.interface').AuthenticatedUser) {
    await this.scopes.assertDepartmentAccessAsync(user, dto.departmentId);
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

  async remove(id: string, user: import('../../common/interfaces/authenticated-user.interface').AuthenticatedUser) {
    const config = await this.prisma.departmentOvertimeConfig.findUnique({ where: { id } });
    if (config) {
      await this.scopes.assertDepartmentAccessAsync(user, config.departmentId);
    }
    return this.prisma.departmentOvertimeConfig.delete({
      where: { id },
    });
  }
}
