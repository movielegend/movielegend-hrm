import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { badRequest, conflict, notFound } from '../../common/utils/error.util';
import { PrismaService } from '../../database/prisma.service';
import { CreateEmployeeSalaryComponentDto, CreateSalaryComponentDto, CreateSalaryProfileDto } from './dto/salary.dto';

@Injectable()
export class SalaryService {
  constructor(private readonly prisma: PrismaService) {}

  async createProfile(dto: CreateSalaryProfileDto, actor: AuthenticatedUser) {
    const effectiveFrom = new Date(dto.effectiveFrom);
    const effectiveTo = dto.effectiveTo ? new Date(dto.effectiveTo) : undefined;
    await this.assertNoProfileOverlap(dto.userId, effectiveFrom, effectiveTo);
    return this.prisma.$transaction(async (tx) => {
      const profile = await tx.salaryProfile.create({
        data: {
          userId: dto.userId,
          salaryType: dto.salaryType,
          baseSalary: dto.baseSalary,
          standardWorkingDays: dto.standardWorkingDays,
          standardWorkingHours: dto.standardWorkingHours,
          hourlyRate: dto.hourlyRate,
          dailyRate: dto.dailyRate,
          currency: dto.currency ?? 'VND',
          effectiveFrom,
          effectiveTo,
          createdById: actor.userId,
        },
      });
      await tx.auditLog.create({
        data: { actorUserId: actor.userId, action: 'SALARY_PROFILE_CREATED', entityType: 'SalaryProfile', entityId: profile.id },
      });
      return profile;
    });
  }

  findProfiles() {
    return this.prisma.salaryProfile.findMany({
      include: { user: { select: { id: true, userCode: true, email: true, phone: true, profile: true } } },
      orderBy: { effectiveFrom: 'desc' },
    });
  }

  findProfilesByUser(userId: string) {
    return this.prisma.salaryProfile.findMany({ where: { userId }, orderBy: { effectiveFrom: 'desc' } });
  }

  async endProfile(id: string, effectiveTo: string, actor: AuthenticatedUser) {
    const profile = await this.prisma.salaryProfile.findUnique({ where: { id } });
    if (!profile) throw notFound('SALARY_PROFILE_NOT_FOUND', 'Salary profile not found');
    const referenced = await this.prisma.payroll.findFirst({ where: { salaryProfileId: id, period: { status: 'LOCKED' } } });
    if (referenced) throw conflict('SALARY_PROFILE_LOCKED_REFERENCE', 'Cannot alter salary profile referenced by locked payroll');
    const updated = await this.prisma.salaryProfile.update({ where: { id }, data: { effectiveTo: new Date(effectiveTo) } });
    await this.prisma.auditLog.create({
      data: { actorUserId: actor.userId, action: 'SALARY_PROFILE_CHANGED', entityType: 'SalaryProfile', entityId: id },
    });
    return updated;
  }

  createComponent(dto: CreateSalaryComponentDto) {
    return this.prisma.salaryComponent.create({ data: dto });
  }

  findComponents() {
    return this.prisma.salaryComponent.findMany({ orderBy: { code: 'asc' } });
  }

  updateComponent(id: string, dto: Partial<CreateSalaryComponentDto>) {
    return this.prisma.salaryComponent.update({ where: { id }, data: dto });
  }

  async createEmployeeComponent(dto: CreateEmployeeSalaryComponentDto, actor: AuthenticatedUser) {
    const effectiveFrom = new Date(dto.effectiveFrom);
    const effectiveTo = dto.effectiveTo ? new Date(dto.effectiveTo) : undefined;
    await this.assertNoEmployeeComponentOverlap(dto.userId, dto.componentId, effectiveFrom, effectiveTo);
    return this.prisma.employeeSalaryComponent.create({
      data: {
        userId: dto.userId,
        componentId: dto.componentId,
        amount: dto.amount,
        percentage: dto.percentage,
        effectiveFrom,
        effectiveTo,
        createdById: actor.userId,
      },
      include: { component: true },
    });
  }

  private async assertNoProfileOverlap(userId: string, effectiveFrom: Date, effectiveTo?: Date): Promise<void> {
    const overlap = await this.prisma.salaryProfile.findFirst({
      where: {
        userId,
        effectiveFrom: { lte: effectiveTo ?? new Date('9999-12-31') },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: effectiveFrom } }],
      },
    });
    if (overlap) throw badRequest('SALARY_PROFILE_OVERLAP', 'Salary profile effective range overlaps');
  }

  private async assertNoEmployeeComponentOverlap(userId: string, componentId: string, effectiveFrom: Date, effectiveTo?: Date): Promise<void> {
    const overlap = await this.prisma.employeeSalaryComponent.findFirst({
      where: {
        userId,
        componentId,
        effectiveFrom: { lte: effectiveTo ?? new Date('9999-12-31') },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: effectiveFrom } }],
      },
    });
    if (overlap) throw badRequest('EMPLOYEE_COMPONENT_OVERLAP', 'Employee salary component effective range overlaps');
  }
}
