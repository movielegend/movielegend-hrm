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
exports.SalaryService = void 0;
const common_1 = require("@nestjs/common");
const error_util_1 = require("../../common/utils/error.util");
const prisma_service_1 = require("../../database/prisma.service");
let SalaryService = class SalaryService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createProfile(dto, actor) {
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
    findProfilesByUser(userId) {
        return this.prisma.salaryProfile.findMany({ where: { userId }, orderBy: { effectiveFrom: 'desc' } });
    }
    async endProfile(id, effectiveTo, actor) {
        const profile = await this.prisma.salaryProfile.findUnique({ where: { id } });
        if (!profile)
            throw (0, error_util_1.notFound)('SALARY_PROFILE_NOT_FOUND', 'Salary profile not found');
        const referenced = await this.prisma.payroll.findFirst({ where: { salaryProfileId: id, period: { status: 'LOCKED' } } });
        if (referenced)
            throw (0, error_util_1.conflict)('SALARY_PROFILE_LOCKED_REFERENCE', 'Cannot alter salary profile referenced by locked payroll');
        const updated = await this.prisma.salaryProfile.update({ where: { id }, data: { effectiveTo: new Date(effectiveTo) } });
        await this.prisma.auditLog.create({
            data: { actorUserId: actor.userId, action: 'SALARY_PROFILE_CHANGED', entityType: 'SalaryProfile', entityId: id },
        });
        return updated;
    }
    createComponent(dto) {
        return this.prisma.salaryComponent.create({ data: dto });
    }
    findComponents() {
        return this.prisma.salaryComponent.findMany({ orderBy: { code: 'asc' } });
    }
    updateComponent(id, dto) {
        return this.prisma.salaryComponent.update({ where: { id }, data: dto });
    }
    async createEmployeeComponent(dto, actor) {
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
    async assertNoProfileOverlap(userId, effectiveFrom, effectiveTo) {
        const overlap = await this.prisma.salaryProfile.findFirst({
            where: {
                userId,
                effectiveFrom: { lte: effectiveTo ?? new Date('9999-12-31') },
                OR: [{ effectiveTo: null }, { effectiveTo: { gte: effectiveFrom } }],
            },
        });
        if (overlap)
            throw (0, error_util_1.badRequest)('SALARY_PROFILE_OVERLAP', 'Salary profile effective range overlaps');
    }
    async assertNoEmployeeComponentOverlap(userId, componentId, effectiveFrom, effectiveTo) {
        const overlap = await this.prisma.employeeSalaryComponent.findFirst({
            where: {
                userId,
                componentId,
                effectiveFrom: { lte: effectiveTo ?? new Date('9999-12-31') },
                OR: [{ effectiveTo: null }, { effectiveTo: { gte: effectiveFrom } }],
            },
        });
        if (overlap)
            throw (0, error_util_1.badRequest)('EMPLOYEE_COMPONENT_OVERLAP', 'Employee salary component effective range overlaps');
    }
};
exports.SalaryService = SalaryService;
exports.SalaryService = SalaryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SalaryService);
//# sourceMappingURL=salary.service.js.map