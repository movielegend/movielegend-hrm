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
exports.CompensationService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const error_util_1 = require("../../common/utils/error.util");
const prisma_service_1 = require("../../database/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
const realtime_events_service_1 = require("../realtime/realtime-events.service");
let CompensationService = class CompensationService {
    prisma;
    notifications;
    realtime;
    constructor(prisma, notifications, realtime) {
        this.prisma = prisma;
        this.notifications = notifications;
        this.realtime = realtime;
    }
    createBonus(dto, actor) {
        return this.prisma.employeeBonus.create({
            data: { ...dto, effectiveDate: new Date(dto.effectiveDate), createdById: actor.userId },
        });
    }
    findBonuses() {
        return this.prisma.employeeBonus.findMany({ orderBy: { createdAt: 'desc' } });
    }
    async approveBonus(id, actor) {
        const payload = await this.prisma.$transaction(async (tx) => {
            const bonus = await tx.employeeBonus.findUnique({ where: { id } });
            if (!bonus)
                throw (0, error_util_1.notFound)('BONUS_NOT_FOUND', 'Bonus not found');
            if (bonus.status !== client_1.EmployeeBonusStatus.PENDING)
                throw (0, error_util_1.conflict)('BONUS_ALREADY_PROCESSED', 'Bonus already processed');
            const updated = await tx.employeeBonus.update({
                where: { id },
                data: { status: client_1.EmployeeBonusStatus.APPROVED, approvedById: actor.userId, approvedAt: new Date() },
            });
            await tx.auditLog.create({ data: { actorUserId: actor.userId, action: 'BONUS_APPROVED', entityType: 'EmployeeBonus', entityId: id } });
            const notify = await this.notifications.createForUsers(tx, [bonus.userId], {
                type: client_1.NotificationType.BONUS_APPROVED,
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
    rejectBonus(id, dto) {
        return this.prisma.employeeBonus.update({ where: { id }, data: { status: client_1.EmployeeBonusStatus.REJECTED, description: dto.reason } });
    }
    cancelBonus(id) {
        return this.prisma.employeeBonus.update({ where: { id }, data: { status: client_1.EmployeeBonusStatus.CANCELLED } });
    }
    createDeduction(dto, actor) {
        return this.prisma.employeeDeduction.create({
            data: { ...dto, effectiveDate: new Date(dto.effectiveDate), createdById: actor.userId },
        });
    }
    findDeductions() {
        return this.prisma.employeeDeduction.findMany({ orderBy: { createdAt: 'desc' } });
    }
    async approveDeduction(id, actor) {
        const payload = await this.prisma.$transaction(async (tx) => {
            const deduction = await tx.employeeDeduction.findUnique({ where: { id } });
            if (!deduction)
                throw (0, error_util_1.notFound)('DEDUCTION_NOT_FOUND', 'Deduction not found');
            if (deduction.status !== client_1.EmployeeDeductionStatus.PENDING)
                throw (0, error_util_1.conflict)('DEDUCTION_ALREADY_PROCESSED', 'Deduction already processed');
            const updated = await tx.employeeDeduction.update({
                where: { id },
                data: { status: client_1.EmployeeDeductionStatus.APPROVED, approvedById: actor.userId, approvedAt: new Date() },
            });
            await tx.auditLog.create({ data: { actorUserId: actor.userId, action: 'DEDUCTION_APPROVED', entityType: 'EmployeeDeduction', entityId: id } });
            const notify = await this.notifications.createForUsers(tx, [deduction.userId], {
                type: client_1.NotificationType.DEDUCTION_APPROVED,
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
    rejectDeduction(id, dto) {
        return this.prisma.employeeDeduction.update({ where: { id }, data: { status: client_1.EmployeeDeductionStatus.REJECTED, description: dto.reason } });
    }
    cancelDeduction(id) {
        return this.prisma.employeeDeduction.update({ where: { id }, data: { status: client_1.EmployeeDeductionStatus.CANCELLED } });
    }
};
exports.CompensationService = CompensationService;
exports.CompensationService = CompensationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService,
        realtime_events_service_1.RealtimeEventsService])
], CompensationService);
//# sourceMappingURL=compensation.service.js.map