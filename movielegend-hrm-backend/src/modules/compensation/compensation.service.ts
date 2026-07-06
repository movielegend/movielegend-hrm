import { Injectable } from '@nestjs/common';
import { EmployeeBonusStatus, EmployeeDeductionStatus, NotificationType } from '@prisma/client';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { conflict, notFound } from '../../common/utils/error.util';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RealtimeEventsService } from '../realtime/realtime-events.service';
import { CreateBonusDto, CreateDeductionDto, RejectCompensationDto } from './dto/compensation.dto';

@Injectable()
export class CompensationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly realtime: RealtimeEventsService,
  ) {}

  createBonus(dto: CreateBonusDto, actor: AuthenticatedUser) {
    return this.prisma.employeeBonus.create({
      data: { ...dto, effectiveDate: new Date(dto.effectiveDate), createdById: actor.userId },
    });
  }

  findBonuses() {
    return this.prisma.employeeBonus.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async approveBonus(id: string, actor: AuthenticatedUser) {
    const payload = await this.prisma.$transaction(async (tx) => {
      const bonus = await tx.employeeBonus.findUnique({ where: { id } });
      if (!bonus) throw notFound('BONUS_NOT_FOUND', 'Bonus not found');
      if (bonus.status !== EmployeeBonusStatus.PENDING) throw conflict('BONUS_ALREADY_PROCESSED', 'Bonus already processed');
      const updated = await tx.employeeBonus.update({
        where: { id },
        data: { status: EmployeeBonusStatus.APPROVED, approvedById: actor.userId, approvedAt: new Date() },
      });
      await tx.auditLog.create({ data: { actorUserId: actor.userId, action: 'BONUS_APPROVED', entityType: 'EmployeeBonus', entityId: id } });
      const notify = await this.notifications.createForUsers(tx, [bonus.userId], {
        type: NotificationType.BONUS_APPROVED,
        title: 'Bonus approved',
        body: bonus.title,
        metadata: { bonusId: id },
      });
      return { updated, notify };
    });
    this.notifications.emitCreated(payload.notify);
    this.realtime.emitToUser(payload.updated.userId, 'bonus:updated', { id: payload.updated.id, status: payload.updated.status });
    return payload.updated;
  }

  rejectBonus(id: string, dto: RejectCompensationDto) {
    return this.prisma.employeeBonus.update({ where: { id }, data: { status: EmployeeBonusStatus.REJECTED, description: dto.reason } });
  }

  cancelBonus(id: string) {
    return this.prisma.employeeBonus.update({ where: { id }, data: { status: EmployeeBonusStatus.CANCELLED } });
  }

  createDeduction(dto: CreateDeductionDto, actor: AuthenticatedUser) {
    return this.prisma.employeeDeduction.create({
      data: { ...dto, effectiveDate: new Date(dto.effectiveDate), createdById: actor.userId },
    });
  }

  findDeductions() {
    return this.prisma.employeeDeduction.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async approveDeduction(id: string, actor: AuthenticatedUser) {
    const payload = await this.prisma.$transaction(async (tx) => {
      const deduction = await tx.employeeDeduction.findUnique({ where: { id } });
      if (!deduction) throw notFound('DEDUCTION_NOT_FOUND', 'Deduction not found');
      if (deduction.status !== EmployeeDeductionStatus.PENDING) throw conflict('DEDUCTION_ALREADY_PROCESSED', 'Deduction already processed');
      const updated = await tx.employeeDeduction.update({
        where: { id },
        data: { status: EmployeeDeductionStatus.APPROVED, approvedById: actor.userId, approvedAt: new Date() },
      });
      await tx.auditLog.create({ data: { actorUserId: actor.userId, action: 'DEDUCTION_APPROVED', entityType: 'EmployeeDeduction', entityId: id } });
      const notify = await this.notifications.createForUsers(tx, [deduction.userId], {
        type: NotificationType.DEDUCTION_APPROVED,
        title: 'Deduction approved',
        body: deduction.title,
        metadata: { deductionId: id },
      });
      return { updated, notify };
    });
    this.notifications.emitCreated(payload.notify);
    this.realtime.emitToUser(payload.updated.userId, 'deduction:updated', { id: payload.updated.id, status: payload.updated.status });
    return payload.updated;
  }

  rejectDeduction(id: string, dto: RejectCompensationDto) {
    return this.prisma.employeeDeduction.update({ where: { id }, data: { status: EmployeeDeductionStatus.REJECTED, description: dto.reason } });
  }

  cancelDeduction(id: string) {
    return this.prisma.employeeDeduction.update({ where: { id }, data: { status: EmployeeDeductionStatus.CANCELLED } });
  }
}
