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
exports.TaskGroupsService = void 0;
const common_1 = require("@nestjs/common");
const error_util_1 = require("../../common/utils/error.util");
const prisma_service_1 = require("../../database/prisma.service");
const department_scope_service_1 = require("../phase2-policy/department-scope.service");
let TaskGroupsService = class TaskGroupsService {
    prisma;
    scope;
    constructor(prisma, scope) {
        this.prisma = prisma;
        this.scope = scope;
    }
    create(dto, actor) {
        this.scope.assertDepartmentAccess(actor, dto.departmentId);
        return this.prisma.taskGroup.create({
            data: {
                departmentId: dto.departmentId,
                name: dto.name,
                description: dto.description,
                createdByUserId: actor.userId,
            },
            include: { members: true },
        });
    }
    async findAll(actor, query) {
        const where = this.groupWhere(actor, query);
        const [items, total] = await this.prisma.$transaction([
            this.prisma.taskGroup.findMany({
                where,
                include: this.groupInclude(),
                orderBy: { createdAt: 'desc' },
                skip: (query.page - 1) * query.limit,
                take: query.limit,
            }),
            this.prisma.taskGroup.count({ where }),
        ]);
        return this.paginate(items, total, query.page, query.limit);
    }
    async findOne(id, actor) {
        const group = await this.prisma.taskGroup.findUnique({
            where: { id },
            include: this.groupInclude(),
        });
        if (!group || group.deletedAt)
            throw (0, error_util_1.notFound)('TASK_GROUP_NOT_FOUND', 'Task group not found');
        if (!this.canManageAll(actor))
            this.scope.assertDepartmentAccess(actor, group.departmentId);
        return group;
    }
    groupWhere(actor, query) {
        const visibleDepartmentIds = this.scope.visibleDepartmentIds(actor);
        if (query.departmentId && visibleDepartmentIds && !visibleDepartmentIds.includes(query.departmentId)) {
            throw (0, error_util_1.forbidden)('TASK_GROUP_FORBIDDEN', 'Task group department is out of scope');
        }
        return {
            deletedAt: null,
            ...(query.search ? { name: { contains: query.search, mode: 'insensitive' } } : {}),
            ...(typeof query.isActive === 'boolean' ? { isActive: query.isActive } : {}),
            ...(query.departmentId ? { departmentId: query.departmentId } : visibleDepartmentIds ? { departmentId: { in: visibleDepartmentIds } } : {}),
        };
    }
    async addMember(groupId, dto, actor) {
        const group = await this.prisma.taskGroup.findUnique({ where: { id: groupId } });
        if (!group || group.deletedAt)
            throw (0, error_util_1.notFound)('TASK_GROUP_NOT_FOUND', 'Task group not found');
        this.scope.assertDepartmentAccess(actor, group.departmentId);
        await this.scope.assertUserInDepartment(dto.userId, group.departmentId);
        return this.prisma.taskGroupMember.upsert({
            where: { groupId_userId: { groupId, userId: dto.userId } },
            update: {},
            create: { groupId, userId: dto.userId },
        });
    }
    async removeMember(groupId, userId, actor) {
        const group = await this.prisma.taskGroup.findUnique({ where: { id: groupId } });
        if (!group || group.deletedAt)
            throw (0, error_util_1.notFound)('TASK_GROUP_NOT_FOUND', 'Task group not found');
        this.scope.assertDepartmentAccess(actor, group.departmentId);
        return this.prisma.taskGroupMember.deleteMany({ where: { groupId, userId } });
    }
    groupInclude() {
        return {
            department: { select: { id: true, code: true, name: true } },
            createdBy: { select: { id: true, userCode: true, profile: { select: { fullName: true, avatarUrl: true } } } },
            members: {
                include: {
                    user: {
                        select: {
                            id: true,
                            userCode: true,
                            profile: { select: { fullName: true, avatarUrl: true, position: { select: { id: true, name: true } } } },
                        },
                    },
                },
            },
        };
    }
    paginate(items, total, page, limit) {
        return {
            items,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    canManageAll(actor) {
        return actor.roles.includes('ADMIN') || actor.permissions.includes('task.group.manage_all');
    }
};
exports.TaskGroupsService = TaskGroupsService;
exports.TaskGroupsService = TaskGroupsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        department_scope_service_1.DepartmentScopeService])
], TaskGroupsService);
//# sourceMappingURL=task-groups.service.js.map