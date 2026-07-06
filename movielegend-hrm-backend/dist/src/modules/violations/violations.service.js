"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ViolationsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const error_util_1 = require("../../common/utils/error.util");
const prisma_service_1 = require("../../database/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
const realtime_events_service_1 = require("../realtime/realtime-events.service");
let ViolationsService = class ViolationsService {
    prisma;
    notifications;
    realtime;
    constructor(prisma, notifications, realtime) {
        this.prisma = prisma;
        this.notifications = notifications;
        this.realtime = realtime;
    }
    create(dto, actor) {
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
    async findOne(id) {
        const violation = await this.prisma.violation.findUnique({ where: { id }, include: { actions: true } });
        if (!violation)
            throw (0, error_util_1.notFound)('VIOLATION_NOT_FOUND', 'Violation not found');
        return violation;
    }
    async confirm(id, actor) {
        const payload = await this.prisma.$transaction(async (tx) => {
            const violation = await tx.violation.findUnique({ where: { id } });
            if (!violation)
                throw (0, error_util_1.notFound)('VIOLATION_NOT_FOUND', 'Violation not found');
            if (violation.status !== client_1.ViolationStatus.PENDING_REVIEW)
                throw (0, error_util_1.conflict)('VIOLATION_ALREADY_PROCESSED', 'Violation already processed');
            const updated = await tx.violation.update({
                where: { id },
                data: { status: client_1.ViolationStatus.CONFIRMED, confirmedById: actor.userId, confirmedAt: new Date() },
            });
            await tx.auditLog.create({ data: { actorUserId: actor.userId, action: 'VIOLATION_CONFIRMED', entityType: 'Violation', entityId: id } });
            const notify = await this.notifications.createForUsers(tx, [violation.userId], {
                type: client_1.NotificationType.VIOLATION_CONFIRMED,
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
    reject(id) {
        return this.prisma.violation.update({ where: { id }, data: { status: client_1.ViolationStatus.REJECTED } });
    }
    async createAction(violationId, dto) {
        const violation = await this.findOne(violationId);
        if (violation.status !== client_1.ViolationStatus.CONFIRMED) {
            throw (0, error_util_1.badRequest)('VIOLATION_NOT_CONFIRMED', 'Violation must be confirmed before disciplinary action');
        }
        if (dto.actionType === client_1.DisciplinaryActionType.DEDUCTION && (!dto.amount || dto.amount <= 0)) {
            throw (0, error_util_1.badRequest)('DISCIPLINARY_DEDUCTION_AMOUNT_REQUIRED', 'Deduction action requires amount');
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
    async approveAction(id, actor) {
        const payload = await this.prisma.$transaction(async (tx) => {
            const action = await tx.disciplinaryAction.findUnique({ where: { id }, include: { violation: true } });
            if (!action)
                throw (0, error_util_1.notFound)('DISCIPLINARY_ACTION_NOT_FOUND', 'Disciplinary action not found');
            if (action.status !== client_1.DisciplinaryActionStatus.PENDING)
                throw (0, error_util_1.conflict)('DISCIPLINARY_ACTION_ALREADY_PROCESSED', 'Action already processed');
            const updated = await tx.disciplinaryAction.update({
                where: { id },
                data: { status: client_1.DisciplinaryActionStatus.APPROVED, approvedById: actor.userId, approvedAt: new Date() },
            });
            if (action.actionType === client_1.DisciplinaryActionType.DEDUCTION) {
                await tx.employeeDeduction.create({
                    data: {
                        userId: action.violation.userId,
                        deductionType: 'DISCIPLINARY_DEDUCTION',
                        title: action.description,
                        amount: action.amount ?? 0,
                        effectiveDate: action.effectiveDate,
                        status: client_1.EmployeeDeductionStatus.APPROVED,
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
                type: client_1.NotificationType.DISCIPLINARY_ACTION_APPROVED,
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
};
exports.ViolationsService = ViolationsService;
exports.ViolationsService = ViolationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService,
        realtime_events_service_1.RealtimeEventsService])
], ViolationsService);
//# sourceMappingURL=violations.service.js.map