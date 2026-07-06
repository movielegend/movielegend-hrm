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
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const error_util_1 = require("../../common/utils/error.util");
const prisma_service_1 = require("../../database/prisma.service");
let AdminService = class AdminService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    assignLeader(dto, actor) {
        return this.prisma.$transaction(async (tx) => {
            const [user, department, leaderRole] = await Promise.all([
                tx.user.findUnique({ where: { id: dto.userId } }),
                tx.department.findFirst({ where: { id: dto.departmentId, deletedAt: null, isActive: true } }),
                tx.role.findUnique({ where: { code: 'LEADER' } }),
            ]);
            if (!user || user.accountStatus !== client_1.AccountStatus.ACTIVE || !user.isActive) {
                throw (0, error_util_1.badRequest)('USER_NOT_ACTIVE', 'User chưa active');
            }
            if (!department)
                throw (0, error_util_1.notFound)('DEPARTMENT_NOT_FOUND', 'Không tìm thấy phòng ban');
            if (!leaderRole)
                throw (0, error_util_1.notFound)('ROLE_NOT_FOUND', 'Không tìm thấy role LEADER');
            const assignment = await tx.userRole.upsert({
                where: {
                    userId_roleId_scopeType_scopeId: {
                        userId: dto.userId,
                        roleId: leaderRole.id,
                        scopeType: client_1.RoleScopeType.DEPARTMENT,
                        scopeId: dto.departmentId,
                    },
                },
                create: {
                    userId: dto.userId,
                    roleId: leaderRole.id,
                    scopeType: client_1.RoleScopeType.DEPARTMENT,
                    scopeId: dto.departmentId,
                },
                update: {},
            });
            if (dto.primary ?? true) {
                await tx.department.update({
                    where: { id: dto.departmentId },
                    data: { leaderUserId: dto.userId },
                });
            }
            await tx.auditLog.create({
                data: {
                    actorUserId: actor.userId,
                    action: 'admin.leader.assign',
                    entityType: 'UserRole',
                    entityId: assignment.id,
                    metadata: { departmentId: dto.departmentId },
                },
            });
            return assignment;
        });
    }
    async revokeLeader(id, actor) {
        return this.prisma.$transaction(async (tx) => {
            const assignment = await tx.userRole.delete({ where: { id } });
            if (assignment.scopeId) {
                await tx.department.updateMany({
                    where: { id: assignment.scopeId, leaderUserId: assignment.userId },
                    data: { leaderUserId: null },
                });
            }
            await tx.auditLog.create({
                data: {
                    actorUserId: actor.userId,
                    action: 'admin.leader.revoke',
                    entityType: 'UserRole',
                    entityId: id,
                    metadata: { userId: assignment.userId, departmentId: assignment.scopeId },
                },
            });
            return { revoked: true };
        });
    }
    async findUsers(query) {
        const where = {
            deletedAt: null,
            ...(query.accountStatus ? { accountStatus: query.accountStatus } : {}),
            ...(query.approvalStatus ? { approvalStatus: query.approvalStatus } : {}),
            ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
            ...(query.search
                ? {
                    OR: [
                        { phone: { contains: query.search, mode: 'insensitive' } },
                        { userCode: { contains: query.search, mode: 'insensitive' } },
                        { email: { contains: query.search, mode: 'insensitive' } },
                        { profile: { fullName: { contains: query.search, mode: 'insensitive' } } },
                    ],
                }
                : {}),
            ...(query.role ? { roles: { some: { role: { code: query.role } } } } : {}),
            ...(query.departmentId
                ? { departmentLinks: { some: { departmentId: query.departmentId, leftAt: null } } }
                : {}),
        };
        const [items, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                include: {
                    profile: true,
                    roles: { include: { role: true } },
                    departmentLinks: { include: { department: true, position: true } },
                },
                skip: (query.page - 1) * query.limit,
                take: query.limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.user.count({ where }),
        ]);
        return {
            items: items.map(({ passwordHash: _passwordHash, ...user }) => user),
            pagination: {
                page: query.page,
                limit: query.limit,
                total,
                totalPages: Math.ceil(total / query.limit),
            },
        };
    }
    async findUser(id) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            include: {
                profile: true,
                roles: { include: { role: true } },
                departmentLinks: { include: { department: true, position: true } },
            },
        });
        if (!user)
            throw (0, error_util_1.notFound)('USER_NOT_FOUND', 'Không tìm thấy user');
        const { passwordHash: _passwordHash, ...safeUser } = user;
        return safeUser;
    }
    updateUser(id, dto) {
        return this.prisma.$transaction(async (tx) => {
            const user = await tx.user.update({
                where: { id },
                data: {
                    phone: dto.phone,
                    email: dto.email,
                    accountStatus: dto.accountStatus,
                    isActive: dto.isActive,
                    profile: dto.fullName || dto.positionId
                        ? {
                            update: {
                                fullName: dto.fullName,
                                positionId: dto.positionId,
                            },
                        }
                        : undefined,
                },
                include: { profile: true },
            });
            if (dto.departmentId) {
                await tx.departmentMember.upsert({
                    where: { departmentId_userId: { departmentId: dto.departmentId, userId: id } },
                    create: { departmentId: dto.departmentId, userId: id, positionId: dto.positionId },
                    update: { leftAt: null, positionId: dto.positionId },
                });
            }
            const { passwordHash: _passwordHash, ...safeUser } = user;
            return safeUser;
        });
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminService);
//# sourceMappingURL=admin.service.js.map