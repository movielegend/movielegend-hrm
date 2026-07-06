import { Injectable } from '@nestjs/common';
import { DisciplinaryActionStatus, DisciplinaryActionType, EmployeeDeductionStatus, NotificationType, ViolationStatus } from '@prisma/client';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { badRequest, conflict, notFound } from '../../common/utils/error.util';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RealtimeEventsService } from '../realtime/realtime-events.service';
import { CreateDisciplinaryActionDto, CreateViolationDto } from './dto/violation.dto';

@Injectable()
export class ViolationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly realtime: RealtimeEventsService,
  ) {}

  create(dto: CreateViolationDto, actor: AuthenticatedUser) {
    return this.prisma.violation.create({
      data: {
        ...dto,
        violationDate: new Date(dto.violationDate),
        createdById: actor.userId,
      },
    });
  }

  findAll() {
    return this.prisma.violation.findMany({ include: { actions: true }, orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: string) {
    const violation = await this.prisma.violation.findUnique({ where: { id }, include: { actions: true } });
    if (!violation) throw notFound('VIOLATION_NOT_FOUND', 'Violation not found');
    return violation;
  }

  async confirm(id: string, actor: AuthenticatedUser) {
    const payload = await this.prisma.$transaction(async (tx) => {
      const violation = await tx.violation.findUnique({ where: { id } });
      if (!violation) throw notFound('VIOLATION_NOT_FOUND', 'Violation not found');
      if (violation.status !== ViolationStatus.PENDING_REVIEW) throw conflict('VIOLATION_ALREADY_PROCESSED', 'Violation already processed');
      const updated = await tx.violation.update({
        where: { id },
        data: { status: ViolationStatus.CONFIRMED, confirmedById: actor.userId, confirmedAt: new Date() },
      });
      await tx.auditLog.create({ data: { actorUserId: actor.userId, action: 'VIOLATION_CONFIRMED', entityType: 'Violation', entityId: id } });
      const notify = await this.notifications.createForUsers(tx, [violation.userId], {
        type: NotificationType.VIOLATION_CONFIRMED,
        title: 'Violation confirmed',
        body: violation.title,
        metadata: { violationId: id },
      });
      return { updated, notify };
    });
    this.notifications.emitCreated(payload.notify);
    this.realtime.emitToUser(payload.updated.userId, 'violation:updated', { id, status: payload.updated.status });
    return payload.updated;
  }

  reject(id: string) {
    return this.prisma.violation.update({ where: { id }, data: { status: ViolationStatus.REJECTED } });
  }

  async createAction(violationId: string, dto: CreateDisciplinaryActionDto) {
    const violation = await this.findOne(violationId);
    if (violation.status !== ViolationStatus.CONFIRMED) {
      throw badRequest('VIOLATION_NOT_CONFIRMED', 'Violation must be confirmed before disciplinary action');
    }
    if (dto.actionType === DisciplinaryActionType.DEDUCTION && (!dto.amount || dto.amount <= 0)) {
      throw badRequest('DISCIPLINARY_DEDUCTION_AMOUNT_REQUIRED', 'Deduction action requires amount');
    }
    return this.prisma.disciplinaryAction.create({
      data: {
        violationId,
        actionType: dto.actionType,
        amount: dto.amount,
        description: dto.description,
        effectiveDate: new Date(dto.effectiveDate),
      },
    });
  }

  async approveAction(id: string, actor: AuthenticatedUser) {
    const payload = await this.prisma.$transaction(async (tx) => {
      const action = await tx.disciplinaryAction.findUnique({ where: { id }, include: { violation: true } });
      if (!action) throw notFound('DISCIPLINARY_ACTION_NOT_FOUND', 'Disciplinary action not found');
      if (action.status !== DisciplinaryActionStatus.PENDING) throw conflict('DISCIPLINARY_ACTION_ALREADY_PROCESSED', 'Action already processed');
      const updated = await tx.disciplinaryAction.update({
        where: { id },
        data: { status: DisciplinaryActionStatus.APPROVED, approvedById: actor.userId, approvedAt: new Date() },
      });
      if (action.actionType === DisciplinaryActionType.DEDUCTION) {
        await tx.employeeDeduction.create({
          data: {
            userId: action.violation.userId,
            deductionType: 'DISCIPLINARY_DEDUCTION',
            title: action.description,
            amount: action.amount ?? 0,
            effectiveDate: action.effectiveDate,
            status: EmployeeDeductionStatus.APPROVED,
            approvedById: actor.userId,
            approvedAt: new Date(),
            relatedEntityType: 'DisciplinaryAction',
            relatedEntityId: action.id,
            createdById: actor.userId,
          },
        });
      }
      await tx.auditLog.create({ data: { actorUserId: actor.userId, action: 'DISCIPLINARY_ACTION_APPROVED', entityType: 'DisciplinaryAction', entityId: id } });
      const notify = await this.notifications.createForUsers(tx, [action.violation.userId], {
        type: NotificationType.DISCIPLINARY_ACTION_APPROVED,
        title: 'Disciplinary action approved',
        body: action.description,
        metadata: { disciplinaryActionId: id },
      });
      return { updated, notify, userId: action.violation.userId };
    });
    this.notifications.emitCreated(payload.notify);
    this.realtime.emitToUser(payload.userId, 'violation:updated', { actionId: id, status: payload.updated.status });
    return payload.updated;
  }
}
