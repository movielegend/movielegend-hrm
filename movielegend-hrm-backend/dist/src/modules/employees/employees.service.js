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
exports.EmployeesService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const error_util_1 = require("../../common/utils/error.util");
const prisma_service_1 = require("../../database/prisma.service");
const department_scope_service_1 = require("../phase2-policy/department-scope.service");
let EmployeesService = class EmployeesService {
    prisma;
    scope;
    constructor(prisma, scope) {
        this.prisma = prisma;
        this.scope = scope;
    }
    async findOne(id) {
        const profile = await this.prisma.employeeProfile.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        userCode: true,
                        phone: true,
                        email: true,
                        accountStatus: true,
                        approvalStatus: true,
                        isActive: true,
                        lastLoginAt: true,
                        createdAt: true,
                        updatedAt: true,
                        deletedAt: true,
                    },
                },
                bankAccounts: true,
                documents: true,
                position: true,
            },
        });
        if (!profile)
            throw (0, error_util_1.notFound)('EMPLOYEE_NOT_FOUND', 'Không tìm thấy hồ sơ nhân viên');
        return profile;
    }
    async scoped(actor, query) {
        const visibleDepartmentIds = this.scope.visibleDepartmentIds(actor);
        if (query.departmentId && visibleDepartmentIds && !visibleDepartmentIds.includes(query.departmentId)) {
            this.scope.assertDepartmentAccess(actor, query.departmentId);
        }
        const where = {
            deletedAt: null,
            accountStatus: client_1.AccountStatus.ACTIVE,
            ...(typeof query.isActive === 'boolean' ? { isActive: query.isActive } : {}),
            ...(query.search
                ? {
                    OR: [
                        { userCode: { contains: query.search, mode: 'insensitive' } },
                        { profile: { fullName: { contains: query.search, mode: 'insensitive' } } },
                    ],
                }
                : {}),
            departmentLinks: {
                some: {
                    leftAt: null,
                    ...(query.departmentId ? { departmentId: query.departmentId } : visibleDepartmentIds ? { departmentId: { in: visibleDepartmentIds } } : {}),
                },
            },
        };
        const [items, total] = await this.prisma.$transaction([
            this.prisma.user.findMany({
                where,
                select: {
                    id: true,
                    userCode: true,
                    isActive: true,
                    profile: { select: { fullName: true, avatarUrl: true, employmentStatus: true } },
                    departmentLinks: {
                        where: { leftAt: null, ...(query.departmentId ? { departmentId: query.departmentId } : {}) },
                        take: 1,
                        include: {
                            department: { select: { id: true, name: true } },
                            position: { select: { id: true, name: true } },
                        },
                    },
                    roles: {
                        include: { role: true }
                    }
                },
                orderBy: { userCode: 'asc' },
                skip: (query.page - 1) * query.limit,
                take: query.limit,
            }),
            this.prisma.user.count({ where }),
        ]);
        return {
            items: items.map((item) => {
                const link = item.departmentLinks[0];
                return {
                    id: item.id,
                    userCode: item.userCode,
                    fullName: item.profile?.fullName ?? null,
                    avatarUrl: item.profile?.avatarUrl ?? null,
                    department: link?.department ?? null,
                    position: link?.position ?? null,
                    employmentStatus: item.profile?.employmentStatus ?? null,
                    isActive: item.isActive,
                    roles: item.roles,
                };
            }),
            pagination: {
                page: query.page,
                limit: query.limit,
                total,
                totalPages: Math.ceil(total / query.limit),
            },
        };
    }
};
exports.EmployeesService = EmployeesService;
exports.EmployeesService = EmployeesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        department_scope_service_1.DepartmentScopeService])
], EmployeesService);
//# sourceMappingURL=employees.service.js.map