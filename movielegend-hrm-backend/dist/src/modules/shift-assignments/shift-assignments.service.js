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
exports.ShiftAssignmentsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const error_util_1 = require("../../common/utils/error.util");
const prisma_service_1 = require("../../database/prisma.service");
const department_scope_service_1 = require("../phase2-policy/department-scope.service");
let ShiftAssignmentsService = class ShiftAssignmentsService {
    prisma;
    scope;
    constructor(prisma, scope) {
        this.prisma = prisma;
        this.scope = scope;
    }
    async assign(dto, actor) {
        this.scope.assertDepartmentAccess(actor, dto.departmentId);
        await this.scope.assertUserInDepartment(dto.userId, dto.departmentId);
        const workDate = new Date(dto.workDate);
        return this.prisma.$transaction(async (tx) => {
            const [user, shift, existing] = await Promise.all([
                tx.user.findUnique({ where: { id: dto.userId } }),
                tx.shift.findUnique({ where: { id: dto.shiftId } }),
                tx.shiftAssignment.findUnique({ where: { userId_workDate: { userId: dto.userId, workDate } } }),
            ]);
            if (!user || !user.isActive || user.accountStatus === client_1.AccountStatus.RESIGNED || user.accountStatus === client_1.AccountStatus.TERMINATED) {
                throw (0, error_util_1.badRequest)('USER_NOT_ACTIVE', 'User không còn active để phân ca');
            }
            if (!shift)
                throw (0, error_util_1.notFound)('SHIFT_NOT_FOUND', 'Không tìm thấy ca làm');
            if (!shift.isActive || shift.deletedAt)
                throw (0, error_util_1.badRequest)('SHIFT_INACTIVE', 'Ca làm đã bị vô hiệu hóa');
            if (existing)
                throw (0, error_util_1.conflict)('SHIFT_ALREADY_ASSIGNED', 'Nhân viên đã được phân ca trong ngày này');
            const assignment = await tx.shiftAssignment.create({
                data: {
                    userId: dto.userId,
                    departmentId: dto.departmentId,
                    shiftId: dto.shiftId,
                    workDate,
                    assignedByUserId: actor.userId,
                },
                include: {
                    shift: true,
                    user: {
                        select: {
                            id: true,
                            userCode: true,
                            phone: true,
                            email: true,
                            profile: true,
                        },
                    },
                    department: true,
                },
            });
            await tx.auditLog.create({
                data: {
                    actorUserId: actor.userId,
                    action: 'shift.assign',
                    entityType: 'ShiftAssignment',
                    entityId: assignment.id,
                    metadata: { userId: dto.userId, departmentId: dto.departmentId, shiftId: dto.shiftId, workDate: dto.workDate },
                },
            });
            return assignment;
        });
    }
    mySchedule(userId) {
        return this.prisma.shiftAssignment.findMany({
            where: { userId, status: client_1.ShiftAssignmentStatus.ASSIGNED },
            include: { shift: true, department: true },
            orderBy: { workDate: 'asc' },
        });
    }
    async registerShift(dto, actor) {
        const departmentId = await this.scope.getPrimaryDepartmentId(actor.userId);
        return this.prisma.shiftRegistration.create({
            data: {
                userId: actor.userId,
                departmentId,
                shiftId: dto.shiftId,
                workDate: new Date(dto.workDate),
                reason: dto.reason,
            },
        });
    }
    async requestSwap(dto, actor) {
        const departmentId = await this.scope.getPrimaryDepartmentId(actor.userId);
        await this.scope.assertUserInDepartment(dto.targetUserId, departmentId);
        return this.prisma.shiftSwap.create({
            data: {
                requesterUserId: actor.userId,
                targetUserId: dto.targetUserId,
                departmentId,
                fromShiftId: dto.fromShiftId,
                toShiftId: dto.toShiftId,
                fromDate: new Date(dto.fromDate),
                toDate: new Date(dto.toDate),
                reason: dto.reason,
            },
        });
    }
};
exports.ShiftAssignmentsService = ShiftAssignmentsService;
exports.ShiftAssignmentsService = ShiftAssignmentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        department_scope_service_1.DepartmentScopeService])
], ShiftAssignmentsService);
//# sourceMappingURL=shift-assignments.service.js.map