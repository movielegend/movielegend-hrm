"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const error_util_1 = require("../../common/utils/error.util");
const prisma_service_1 = require("../../database/prisma.service");
let AdminService = class AdminService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    assignRole(dto, actor) {
        return this.prisma.$transaction(async (tx) => {
            const [user, role] = await Promise.all([
                tx.user.findUnique({ where: { id: dto.userId } }),
                tx.role.findUnique({ where: { id: dto.roleId } }),
            ]);
            if (!user)
                throw (0, error_util_1.notFound)('USER_NOT_FOUND', 'Không tìm thấy user');
            if (!role)
                throw (0, error_util_1.notFound)('ROLE_NOT_FOUND', 'Không tìm thấy role');
            const existing = await tx.userRole.findFirst({
                where: {
                    userId: dto.userId,
                    roleId: dto.roleId,
                    scopeType: dto.scopeType || client_1.RoleScopeType.GLOBAL,
                    scopeId: dto.scopeId || null,
                },
            });
            let assignment;
            if (existing) {
                assignment = existing;
            }
            else {
                assignment = await tx.userRole.create({
                    data: {
                        userId: dto.userId,
                        roleId: dto.roleId,
                        scopeType: dto.scopeType || client_1.RoleScopeType.GLOBAL,
                        scopeId: dto.scopeId || null,
                    },
                });
            }
            await tx.auditLog.create({
                data: {
                    actorUserId: actor.userId,
                    action: 'admin.role.assign',
                    entityType: 'UserRole',
                    entityId: assignment.id,
                    metadata: { roleId: dto.roleId, scopeType: dto.scopeType, scopeId: dto.scopeId },
                },
            });
            return assignment;
        });
    }
    async revokeRole(id, actor) {
        return this.prisma.$transaction(async (tx) => {
            const assignment = await tx.userRole.delete({ where: { id } }).catch(() => null);
            if (!assignment)
                throw (0, error_util_1.notFound)('ASSIGNMENT_NOT_FOUND', 'Không tìm thấy phân quyền này');
            await tx.auditLog.create({
                data: {
                    actorUserId: actor.userId,
                    action: 'admin.role.revoke',
                    entityType: 'UserRole',
                    entityId: id,
                    metadata: { userId: assignment.userId, roleId: assignment.roleId },
                },
            });
            return { revoked: true };
        });
    }
    async createUser(dto, actor) {
        return this.prisma.$transaction(async (tx) => {
            const existingUser = await tx.user.findFirst({
                where: { OR: [{ phone: dto.phone }, ...(dto.email ? [{ email: dto.email }] : [])] },
            });
            if (existingUser) {
                throw (0, error_util_1.badRequest)('USER_EXISTS', 'Số điện thoại hoặc email đã được sử dụng');
            }
            const rows = await tx.$queryRaw `SELECT nextval('user_code_seq')`;
            const userCode = `NV${rows[0].nextval.toString().padStart(6, '0')}`;
            const passwordHash = await bcrypt.hash(dto.password, 12);
            const user = await tx.user.create({
                data: {
                    userCode,
                    phone: dto.phone,
                    email: dto.email,
                    passwordHash,
                    accountStatus: client_1.AccountStatus.ACTIVE,
                    approvalStatus: client_1.ApprovalStatus.APPROVED,
                    isActive: true,
                    profile: {
                        create: {
                            fullName: dto.fullName,
                            idCardNumber: `TMP-${Date.now()}`,
                            employmentStatus: client_1.EmploymentStatus.OFFICIAL,
                            positionId: dto.positionId,
                        },
                    },
                },
            });
            if (dto.departmentId) {
                await tx.departmentMember.create({
                    data: {
                        departmentId: dto.departmentId,
                        userId: user.id,
                        isPrimary: true,
                        positionId: dto.positionId,
                    },
                });
            }
            const employeeRole = await tx.role.findUnique({ where: { code: 'EMPLOYEE' } });
            if (employeeRole) {
                await tx.userRole.create({
                    data: {
                        userId: user.id,
                        roleId: employeeRole.id,
                        scopeType: client_1.RoleScopeType.GLOBAL,
                    },
                });
            }
            await tx.auditLog.create({
                data: {
                    actorUserId: actor.userId,
                    action: 'admin.user.create',
                    entityType: 'User',
                    entityId: user.id,
                },
            });
            const { passwordHash: _hash, ...safeUser } = user;
            return safeUser;
        });
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
                if (department.leaderUserId && department.leaderUserId !== dto.userId) {
                    await tx.userRole.deleteMany({
                        where: {
                            userId: department.leaderUserId,
                            roleId: leaderRole.id,
                            scopeType: client_1.RoleScopeType.DEPARTMENT,
                            scopeId: dto.departmentId,
                        }
                    });
                }
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
                    departmentLinks: {
                        where: { leftAt: null },
                        include: { department: true, position: true }
                    },
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
                departmentLinks: {
                    where: { leftAt: null },
                    include: { department: true, position: true }
                },
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
                const oldMemberships = await tx.departmentMember.findMany({
                    where: { userId: id, leftAt: null, departmentId: { not: dto.departmentId } }
                });
                if (oldMemberships.length > 0) {
                    const oldDepartmentIds = oldMemberships.map(m => m.departmentId);
                    await tx.departmentMember.updateMany({
                        where: { userId: id, leftAt: null, departmentId: { not: dto.departmentId } },
                        data: { leftAt: new Date(), isPrimary: false },
                    });
                    const leaderRole = await tx.role.findUnique({ where: { code: 'LEADER' } });
                    if (leaderRole) {
                        await tx.userRole.deleteMany({
                            where: { userId: id, roleId: leaderRole.id, scopeId: { in: oldDepartmentIds } },
                        });
                    }
                    await tx.department.updateMany({
                        where: { id: { in: oldDepartmentIds }, leaderUserId: id },
                        data: { leaderUserId: null },
                    });
                }
                await tx.departmentMember.upsert({
                    where: { departmentId_userId: { departmentId: dto.departmentId, userId: id } },
                    create: { departmentId: dto.departmentId, userId: id, positionId: dto.positionId, isPrimary: true },
                    update: { leftAt: null, positionId: dto.positionId, isPrimary: true },
                });
            }
            if (dto.accountStatus === 'SUSPENDED' || dto.isActive === false) {
                const leaderRole = await tx.role.findUnique({ where: { code: 'LEADER' } });
                if (leaderRole) {
                    await tx.userRole.deleteMany({
                        where: { userId: id, roleId: leaderRole.id },
                    });
                }
            }
            const { passwordHash: _passwordHash, ...safeUser } = user;
            return safeUser;
        });
    }
    async deleteUser(id, actor) {
        const user = await this.prisma.user.findUnique({ where: { id }, include: { profile: true } });
        if (!user)
            throw (0, error_util_1.notFound)('USER_NOT_FOUND', 'Người dùng không tồn tại');
        return this.prisma.$transaction(async (tx) => {
            const deletedSuffix = `_del_${Date.now()}`;
            const deletedUser = await tx.user.update({
                where: { id },
                data: {
                    deletedAt: new Date(),
                    isActive: false,
                    accountStatus: client_1.AccountStatus.SUSPENDED,
                    phone: `${user.phone}${deletedSuffix}`,
                    userCode: `${user.userCode}${deletedSuffix}`,
                    ...(user.email ? { email: `${user.email}${deletedSuffix}` } : {}),
                },
            });
            if (user.profile) {
                await tx.employeeProfile.update({
                    where: { userId: id },
                    data: {
                        idCardNumber: `${user.profile.idCardNumber}${deletedSuffix}`,
                    },
                });
            }
            await tx.departmentMember.updateMany({
                where: { userId: id, leftAt: null },
                data: { leftAt: new Date() },
            });
            const leaderRole = await tx.role.findUnique({ where: { code: 'LEADER' } });
            if (leaderRole) {
                await tx.userRole.deleteMany({
                    where: { userId: id, roleId: leaderRole.id },
                });
            }
            await tx.auditLog.create({
                data: {
                    actorUserId: actor.userId,
                    action: 'admin.user.delete',
                    entityType: 'User',
                    entityId: id,
                },
            });
            return { deleted: true, id };
        });
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminService);
//# sourceMappingURL=admin.service.js.map