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
exports.PositionsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const error_util_1 = require("../../common/utils/error.util");
const prisma_service_1 = require("../../database/prisma.service");
const department_scope_service_1 = require("../phase2-policy/department-scope.service");
let PositionsService = class PositionsService {
    prisma;
    scope;
    constructor(prisma, scope) {
        this.prisma = prisma;
        this.scope = scope;
    }
    async findAll(actor, query) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const where = await this.visibleWhere(actor, query);
        const [items, total] = await Promise.all([
            this.prisma.position.findMany({
                where,
                include: { department: true },
                orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.position.count({ where }),
        ]);
        return {
            items,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.max(1, Math.ceil(total / limit)),
            },
        };
    }
    async findOne(actor, id) {
        const position = await this.prisma.position.findFirst({
            where: { id, deletedAt: null },
            include: { department: true },
        });
        if (!position)
            throw (0, error_util_1.notFound)('POSITION_NOT_FOUND', 'Position not found');
        await this.assertCanRead(actor, position.departmentId);
        return position;
    }
    async create(actor, dto) {
        if (!this.canManageGlobally(actor)) {
            throw (0, error_util_1.forbidden)('FORBIDDEN', 'Missing global position management permission');
        }
        await this.assertDepartmentExists(dto.departmentId);
        try {
            return await this.prisma.position.create({ data: dto });
        }
        catch (error) {
            if (isUniqueConflict(error))
                throw (0, error_util_1.conflict)('DUPLICATE_POSITION_CODE', 'Position code already exists');
            throw error;
        }
    }
    async update(actor, id, dto) {
        const current = await this.prisma.position.findFirst({ where: { id, deletedAt: null } });
        if (!current)
            throw (0, error_util_1.notFound)('POSITION_NOT_FOUND', 'Position not found');
        if (!this.canManageGlobally(actor)) {
            throw (0, error_util_1.forbidden)('FORBIDDEN', 'Missing global position management permission');
        }
        await this.assertDepartmentExists(dto.departmentId);
        try {
            return await this.prisma.position.update({ where: { id }, data: dto });
        }
        catch (error) {
            if (isUniqueConflict(error))
                throw (0, error_util_1.conflict)('DUPLICATE_POSITION_CODE', 'Position code already exists');
            throw error;
        }
    }
    async remove(actor, id) {
        const current = await this.prisma.position.findFirst({ where: { id, deletedAt: null } });
        if (!current)
            throw (0, error_util_1.notFound)('POSITION_NOT_FOUND', 'Position not found');
        if (!this.canManageGlobally(actor)) {
            throw (0, error_util_1.forbidden)('FORBIDDEN', 'Missing global position management permission');
        }
        const inUse = await this.prisma.$transaction([
            this.prisma.employeeProfile.count({ where: { positionId: id } }),
            this.prisma.departmentMember.count({ where: { positionId: id, leftAt: null } }),
        ]);
        return this.prisma.position.update({
            where: { id },
            data: {
                isActive: false,
                deletedAt: inUse[0] + inUse[1] > 0 ? null : new Date(),
            },
        });
    }
    async visibleWhere(actor, query) {
        const base = {
            deletedAt: null,
            ...(typeof query.isActive === 'boolean' ? { isActive: query.isActive } : {}),
            ...(query.search
                ? {
                    OR: [
                        { code: { contains: query.search, mode: 'insensitive' } },
                        { name: { contains: query.search, mode: 'insensitive' } },
                    ],
                }
                : {}),
        };
        if (this.canReadGlobally(actor)) {
            return { ...base, ...(query.departmentId ? { departmentId: query.departmentId } : {}) };
        }
        const allowedDepartmentIds = await this.visibleDepartmentIds(actor);
        if (query.departmentId) {
            if (!allowedDepartmentIds.includes(query.departmentId)) {
                throw (0, error_util_1.forbidden)('FORBIDDEN_DEPARTMENT_SCOPE', 'Department is outside your scope');
            }
            return { ...base, departmentId: query.departmentId };
        }
        return {
            ...base,
            OR: [{ departmentId: null }, { departmentId: { in: allowedDepartmentIds } }],
        };
    }
    async assertCanRead(actor, departmentId) {
        if (!departmentId || this.canReadGlobally(actor))
            return;
        const allowedDepartmentIds = await this.visibleDepartmentIds(actor);
        if (!allowedDepartmentIds.includes(departmentId)) {
            throw (0, error_util_1.forbidden)('FORBIDDEN_DEPARTMENT_SCOPE', 'Department is outside your scope');
        }
    }
    canManageGlobally(actor) {
        return actor.roles.includes('ADMIN') || actor.permissions.includes('position.create') || actor.permissions.includes('position.update') || actor.permissions.includes('position.delete');
    }
    canReadGlobally(actor) {
        return actor.roles.includes('ADMIN') || actor.roles.includes('HR');
    }
    async visibleDepartmentIds(actor) {
        const leaderVisible = this.scope.visibleDepartmentIds(actor);
        if (leaderVisible)
            return leaderVisible;
        const memberships = await this.prisma.departmentMember.findMany({
            where: { userId: actor.userId, leftAt: null },
            select: { departmentId: true },
        });
        return memberships.map((membership) => membership.departmentId);
    }
    async assertDepartmentExists(departmentId) {
        if (!departmentId)
            return;
        const department = await this.prisma.department.findFirst({
            where: { id: departmentId, deletedAt: null, isActive: true },
            select: { id: true },
        });
        if (!department)
            throw (0, error_util_1.notFound)('DEPARTMENT_NOT_FOUND', 'Department not found');
    }
};
exports.PositionsService = PositionsService;
exports.PositionsService = PositionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        department_scope_service_1.DepartmentScopeService])
], PositionsService);
function isUniqueConflict(error) {
    return error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}
//# sourceMappingURL=positions.service.js.map