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
exports.AssetsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const error_util_1 = require("../../common/utils/error.util");
const prisma_service_1 = require("../../database/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
const department_scope_service_1 = require("../phase2-policy/department-scope.service");
const realtime_events_service_1 = require("../realtime/realtime-events.service");
const warehouse_scope_service_1 = require("../warehouse/warehouse-scope.service");
let AssetsService = class AssetsService {
    prisma;
    departments;
    warehouses;
    notifications;
    realtime;
    constructor(prisma, departments, warehouses, notifications, realtime) {
        this.prisma = prisma;
        this.departments = departments;
        this.warehouses = warehouses;
        this.notifications = notifications;
        this.realtime = realtime;
    }
    create(dto, actor) {
        if (dto.departmentId && !actor.roles.includes('ADMIN'))
            this.departments.assertDepartmentAccess(actor, dto.departmentId);
        return this.prisma.$transaction(async (tx) => {
            const assetCode = dto.assetCode ?? (await this.prisma.nextSequenceCode(tx, 'asset_code_seq', 'AST'));
            const asset = await tx.asset.create({ data: { ...dto, assetCode } });
            await tx.auditLog.create({
                data: { actorUserId: actor.userId, action: 'ASSET_CREATED', entityType: 'Asset', entityId: asset.id },
            });
            return asset;
        });
    }
    findAll(actor) {
        if (actor.roles.includes('ADMIN'))
            return this.prisma.asset.findMany({ where: { deletedAt: null }, include: { assignments: true, department: true } });
        const departments = this.departments.visibleDepartmentIds(actor) ?? [];
        return this.prisma.asset.findMany({
            where: {
                deletedAt: null,
                OR: [
                    { departmentId: { in: departments } },
                    { assignments: { some: { assignedToUserId: actor.userId, status: { in: [client_1.AssetAssignmentStatus.ACTIVE, client_1.AssetAssignmentStatus.PENDING_CONFIRMATION, client_1.AssetAssignmentStatus.RETURN_REQUESTED] } } } },
                    { assignments: { some: { assignedToDepartmentId: { in: departments } } } },
                ],
            },
            include: { assignments: true, department: true },
        });
    }
    myAssets(actor) {
        return this.prisma.assetAssignment.findMany({
            where: { assignedToUserId: actor.userId, status: { in: [client_1.AssetAssignmentStatus.ACTIVE, client_1.AssetAssignmentStatus.PENDING_CONFIRMATION, client_1.AssetAssignmentStatus.RETURN_REQUESTED] } },
            include: {
                asset: {
                    select: {
                        assetCode: true,
                        name: true,
                        conditionStatus: true,
                        assetStatus: true,
                        incidents: { where: { status: { in: [client_1.AssetIncidentStatus.OPEN, client_1.AssetIncidentStatus.INVESTIGATING] } } },
                    },
                },
            },
            orderBy: { assignedAt: 'desc' },
        });
    }
    async findOne(id, actor) {
        const asset = await this.prisma.asset.findUnique({ where: { id }, include: { assignments: true, incidents: true } });
        if (!asset || asset.deletedAt)
            throw (0, error_util_1.notFound)('ASSET_NOT_FOUND', 'Asset not found');
        await this.assertCanReadAsset(id, actor);
        return asset;
    }
    async update(id, dto, actor) {
        const asset = await this.findOne(id, actor);
        if (asset.warehouseId)
            this.warehouses.assertWarehouseAccess(actor, asset.warehouseId);
        if (dto.departmentId && !actor.roles.includes('ADMIN'))
            this.departments.assertDepartmentAccess(actor, dto.departmentId);
        return this.prisma.asset.update({ where: { id }, data: dto });
    }
    async transfer(id, dto, actor) {
        return this.prisma.$transaction(async (tx) => {
            const asset = await tx.asset.findUnique({ where: { id } });
            if (!asset || asset.deletedAt)
                throw (0, error_util_1.notFound)('ASSET_NOT_FOUND', 'Asset not found');
            if (asset.assetStatus !== client_1.AssetStatus.IN_STOCK)
                throw (0, error_util_1.badRequest)('ASSET_NOT_TRANSFERABLE', 'Asset must be in stock to transfer');
            if (asset.departmentId && !actor.roles.includes('ADMIN'))
                this.departments.assertDepartmentAccess(actor, asset.departmentId);
            const updatedAsset = await tx.asset.update({
                where: { id },
                data: { departmentId: dto.targetDepartmentId, conditionNote: dto.note || asset.conditionNote },
            });
            await tx.auditLog.create({
                data: { actorUserId: actor.userId, action: 'ASSET_TRANSFERRED', entityType: 'Asset', entityId: id, metadata: { targetDepartmentId: dto.targetDepartmentId } },
            });
            return updatedAsset;
        });
    }
    async assign(id, dto, actor) {
        if (!dto.assignedToUserId && !dto.assignedToDepartmentId)
            throw (0, error_util_1.badRequest)('ASSET_ASSIGNMENT_TARGET_REQUIRED', 'Assignment target is required');
        if (dto.assignedToUserId && dto.assignedToDepartmentId)
            throw (0, error_util_1.badRequest)('ASSET_ASSIGNMENT_TARGET_INVALID', 'Only one assignment target is allowed');
        const payload = await this.prisma.$transaction(async (tx) => {
            const asset = await tx.asset.findUnique({ where: { id } });
            if (!asset || asset.deletedAt)
                throw (0, error_util_1.notFound)('ASSET_NOT_FOUND', 'Asset not found');
            if (asset.assetStatus !== client_1.AssetStatus.IN_STOCK)
                throw (0, error_util_1.badRequest)('ASSET_NOT_ASSIGNABLE', 'Asset is not in stock');
            if (asset.warehouseId)
                this.warehouses.assertWarehouseAccess(actor, asset.warehouseId);
            const active = await tx.assetAssignment.findFirst({
                where: { assetId: id, status: { in: [client_1.AssetAssignmentStatus.PENDING_CONFIRMATION, client_1.AssetAssignmentStatus.ACTIVE, client_1.AssetAssignmentStatus.RETURN_REQUESTED] } },
            });
            if (active)
                throw (0, error_util_1.conflict)('ASSET_ALREADY_ASSIGNED', 'Asset already has an active assignment');
            const assignment = await tx.assetAssignment.create({
                data: {
                    assetId: id,
                    assignedToUserId: dto.assignedToUserId,
                    assignedToDepartmentId: dto.assignedToDepartmentId,
                    assignedById: actor.userId,
                    expectedReturnAt: dto.expectedReturnAt ? new Date(dto.expectedReturnAt) : undefined,
                    conditionWhenAssigned: dto.conditionWhenAssigned ?? asset.conditionStatus,
                    note: dto.note,
                    histories: { create: { action: client_1.AssetAssignmentAction.CREATED, performedById: actor.userId } },
                },
            });
            await tx.asset.update({ where: { id }, data: { assetStatus: client_1.AssetStatus.ASSIGNED } });
            await tx.auditLog.create({
                data: { actorUserId: actor.userId, action: 'ASSET_ASSIGNED', entityType: 'AssetAssignment', entityId: assignment.id },
            });
            const notifyUsers = dto.assignedToUserId ? [dto.assignedToUserId] : [];
            const notify = await this.notifications.createForUsers(tx, notifyUsers, {
                type: client_1.NotificationType.ASSET_ASSIGNED,
                title: 'Asset assigned',
                body: asset.assetCode,
                metadata: { assetId: id, assignmentId: assignment.id },
            });
            return { assignment, notify };
        }, { isolationLevel: client_1.Prisma.TransactionIsolationLevel.Serializable });
        this.notifications.emitCreated(payload.notify);
        this.realtime.emitToUser(payload.assignment.assignedToUserId ?? actor.userId, 'asset:assigned', payload.assignment);
        return payload.assignment;
    }
    async revoke(id, dto, actor) {
        const asset = await this.prisma.asset.findUnique({
            where: { id, deletedAt: null },
            include: {
                assignments: {
                    where: { status: { in: ['ACTIVE', 'PENDING_CONFIRMATION', 'RETURN_REQUESTED'] } },
                },
            },
        });
        if (!asset)
            throw (0, error_util_1.notFound)('ASSET_NOT_FOUND', 'Asset not found');
        if (asset.departmentId && !actor.roles.includes('ADMIN'))
            this.departments.assertDepartmentAccess(actor, asset.departmentId);
        const activeAssignment = asset.assignments[0];
        if (!activeAssignment)
            throw (0, error_util_1.badRequest)('ASSET_NOT_ASSIGNED', 'Asset is not currently assigned to anyone');
        return this.prisma.$transaction(async (tx) => {
            await tx.assetAssignment.update({
                where: { id: activeAssignment.id },
                data: {
                    status: 'RETURNED',
                    returnedAt: new Date(),
                    note: dto.note || 'Thu hồi bởi quản lý',
                },
            });
            const updatedAsset = await tx.asset.update({
                where: { id },
                data: { assetStatus: 'IN_STOCK' },
                include: { assignments: true, department: true },
            });
            await tx.auditLog.create({
                data: { actorUserId: actor.userId, action: 'ASSET_REVOKED', entityType: 'Asset', entityId: id, metadata: { assignmentId: activeAssignment.id, note: dto.note } },
            });
            return updatedAsset;
        });
    }
    async confirmAssignment(id, actor) {
        const payload = await this.prisma.$transaction(async (tx) => {
            const assignment = await tx.assetAssignment.findUnique({ where: { id } });
            if (!assignment)
                throw (0, error_util_1.notFound)('ASSET_ASSIGNMENT_NOT_FOUND', 'Asset assignment not found');
            if (assignment.assignedToUserId !== actor.userId)
                throw (0, error_util_1.forbidden)('ASSET_ASSIGNMENT_OWNER_ONLY', 'Only receiver can confirm this assignment');
            if (assignment.status !== client_1.AssetAssignmentStatus.PENDING_CONFIRMATION)
                throw (0, error_util_1.conflict)('ASSET_ASSIGNMENT_ALREADY_PROCESSED', 'Assignment already processed');
            const updated = await tx.assetAssignment.update({
                where: { id },
                data: { status: client_1.AssetAssignmentStatus.ACTIVE, receiverConfirmedAt: new Date(), histories: { create: { action: client_1.AssetAssignmentAction.CONFIRMED, performedById: actor.userId } } },
            });
            await tx.asset.update({ where: { id: assignment.assetId }, data: { assetStatus: client_1.AssetStatus.IN_USE } });
            return updated;
        });
        this.realtime.emitToUser(actor.userId, 'asset:assigned', payload);
        return payload;
    }
    async requestReturn(id, actor) {
        const assignment = await this.prisma.assetAssignment.findUnique({ where: { id } });
        if (!assignment)
            throw (0, error_util_1.notFound)('ASSET_ASSIGNMENT_NOT_FOUND', 'Asset assignment not found');
        if (assignment.assignedToUserId !== actor.userId)
            throw (0, error_util_1.forbidden)('ASSET_ASSIGNMENT_OWNER_ONLY', 'Only assignee can request return');
        if (assignment.status !== client_1.AssetAssignmentStatus.ACTIVE)
            throw (0, error_util_1.conflict)('ASSET_ASSIGNMENT_NOT_ACTIVE', 'Assignment is not active');
        return this.prisma.assetAssignment.update({
            where: { id },
            data: { status: client_1.AssetAssignmentStatus.RETURN_REQUESTED, histories: { create: { action: client_1.AssetAssignmentAction.RETURN_REQUESTED, performedById: actor.userId } } },
        });
    }
    async receiveReturn(id, dto, actor) {
        const updated = await this.prisma.$transaction(async (tx) => {
            const assignment = await tx.assetAssignment.findUnique({ where: { id }, include: { asset: true } });
            if (!assignment)
                throw (0, error_util_1.notFound)('ASSET_ASSIGNMENT_NOT_FOUND', 'Asset assignment not found');
            if (assignment.asset.warehouseId)
                this.warehouses.assertWarehouseAccess(actor, assignment.asset.warehouseId);
            if (assignment.status !== client_1.AssetAssignmentStatus.RETURN_REQUESTED && assignment.status !== client_1.AssetAssignmentStatus.ACTIVE) {
                throw (0, error_util_1.conflict)('ASSET_RETURN_NOT_ALLOWED', 'Asset return is not allowed now');
            }
            const assetStatus = dto.conditionWhenReturned === client_1.AssetConditionStatus.DAMAGED ? client_1.AssetStatus.MAINTENANCE : client_1.AssetStatus.IN_STOCK;
            const result = await tx.assetAssignment.update({
                where: { id },
                data: {
                    status: client_1.AssetAssignmentStatus.RETURNED,
                    returnedAt: new Date(),
                    conditionWhenReturned: dto.conditionWhenReturned,
                    note: dto.note,
                    histories: { create: { action: client_1.AssetAssignmentAction.RETURNED, performedById: actor.userId, note: dto.note } },
                },
            });
            await tx.asset.update({ where: { id: assignment.assetId }, data: { assetStatus, conditionStatus: dto.conditionWhenReturned } });
            await tx.auditLog.create({
                data: { actorUserId: actor.userId, action: 'ASSET_RETURNED', entityType: 'AssetAssignment', entityId: id },
            });
            return result;
        });
        this.realtime.emitToRoom('asset:return-updated', 'asset:return-updated', updated);
        return updated;
    }
    async reportIncident(assetId, dto, actor) {
        await this.assertCanReportAsset(assetId, actor);
        const payload = await this.prisma.$transaction(async (tx) => {
            const incident = await tx.assetIncidentReport.create({
                data: { assetId, reportedById: actor.userId, incidentType: dto.incidentType, description: dto.description, evidenceUrl: dto.evidenceUrl },
            });
            const lostIncidentTypes = [client_1.AssetIncidentType.LOST, client_1.AssetIncidentType.STOLEN];
            if (lostIncidentTypes.includes(dto.incidentType)) {
                await tx.asset.update({ where: { id: assetId }, data: { assetStatus: client_1.AssetStatus.LOST } });
            }
            else {
                await tx.asset.update({ where: { id: assetId }, data: { assetStatus: client_1.AssetStatus.DAMAGED, conditionStatus: client_1.AssetConditionStatus.DAMAGED } });
            }
            return incident;
        });
        this.realtime.emitToRoom('asset:incident-updated', 'asset:incident-updated', payload);
        return payload;
    }
    findIncidents() {
        return this.prisma.assetIncidentReport.findMany({ include: { asset: true }, orderBy: { createdAt: 'desc' } });
    }
    async findIncident(id) {
        const incident = await this.prisma.assetIncidentReport.findUnique({ where: { id }, include: { asset: true } });
        if (!incident)
            throw (0, error_util_1.notFound)('ASSET_INCIDENT_NOT_FOUND', 'Incident not found');
        return incident;
    }
    investigateIncident(id) {
        return this.prisma.assetIncidentReport.update({ where: { id }, data: { status: client_1.AssetIncidentStatus.INVESTIGATING } });
    }
    async resolveIncident(id, dto, actor) {
        const updated = await this.prisma.$transaction(async (tx) => {
            const incident = await tx.assetIncidentReport.findUnique({ where: { id } });
            if (!incident)
                throw (0, error_util_1.notFound)('ASSET_INCIDENT_NOT_FOUND', 'Incident not found');
            const assetStatus = dto.assetStatus ?? (incident.incidentType === client_1.AssetIncidentType.DAMAGED ? client_1.AssetStatus.MAINTENANCE : client_1.AssetStatus.LOST);
            await tx.asset.update({ where: { id: incident.assetId }, data: { assetStatus } });
            const result = await tx.assetIncidentReport.update({
                where: { id },
                data: { status: client_1.AssetIncidentStatus.RESOLVED, resolvedById: actor.userId, resolvedAt: new Date(), resolutionNote: dto.resolutionNote },
            });
            await tx.auditLog.create({
                data: { actorUserId: actor.userId, action: 'ASSET_INCIDENT_RESOLVED', entityType: 'AssetIncidentReport', entityId: id },
            });
            return result;
        });
        this.realtime.emitToRoom('asset:incident-updated', 'asset:incident-updated', updated);
        return updated;
    }
    rejectIncident(id, dto, actor) {
        return this.prisma.assetIncidentReport.update({
            where: { id },
            data: { status: client_1.AssetIncidentStatus.REJECTED, resolvedById: actor.userId, resolvedAt: new Date(), resolutionNote: dto.resolutionNote },
        });
    }
    async startMaintenance(assetId, dto, actor) {
        return this.prisma.$transaction(async (tx) => {
            const asset = await tx.asset.findUnique({ where: { id: assetId } });
            if (!asset)
                throw (0, error_util_1.notFound)('ASSET_NOT_FOUND', 'Asset not found');
            const maintainableStatuses = [client_1.AssetStatus.IN_STOCK, client_1.AssetStatus.DAMAGED];
            if (!maintainableStatuses.includes(asset.assetStatus))
                throw (0, error_util_1.badRequest)('ASSET_MAINTENANCE_NOT_ALLOWED', 'Asset cannot enter maintenance');
            await tx.asset.update({ where: { id: assetId }, data: { assetStatus: client_1.AssetStatus.MAINTENANCE } });
            return tx.assetMaintenanceRecord.create({
                data: { assetId, maintenanceType: dto.maintenanceType, vendorName: dto.vendorName, description: dto.description, startedAt: new Date(), createdById: actor.userId },
            });
        });
    }
    async completeMaintenance(id, conditionStatus, actor) {
        return this.prisma.$transaction(async (tx) => {
            const record = await tx.assetMaintenanceRecord.findUnique({ where: { id } });
            if (!record)
                throw (0, error_util_1.notFound)('ASSET_MAINTENANCE_NOT_FOUND', 'Maintenance record not found');
            const assetStatus = conditionStatus === client_1.AssetConditionStatus.DAMAGED ? client_1.AssetStatus.DISPOSED : client_1.AssetStatus.IN_STOCK;
            await tx.asset.update({ where: { id: record.assetId }, data: { assetStatus, conditionStatus } });
            return tx.assetMaintenanceRecord.update({
                where: { id },
                data: { status: client_1.AssetMaintenanceStatus.COMPLETED, completedAt: new Date() },
            });
        });
    }
    async assertCanReadAsset(assetId, actor) {
        if (actor.roles.includes('ADMIN'))
            return;
        const assignment = await this.prisma.assetAssignment.findFirst({
            where: {
                assetId,
                status: { in: [client_1.AssetAssignmentStatus.ACTIVE, client_1.AssetAssignmentStatus.PENDING_CONFIRMATION, client_1.AssetAssignmentStatus.RETURN_REQUESTED] },
            },
        });
        if (!assignment)
            throw (0, error_util_1.forbidden)('ASSET_FORBIDDEN', 'Cannot access this asset');
        if (assignment.assignedToUserId === actor.userId)
            return;
        if (assignment.assignedToDepartmentId)
            this.departments.assertDepartmentAccess(actor, assignment.assignedToDepartmentId);
        else
            throw (0, error_util_1.forbidden)('ASSET_FORBIDDEN', 'Cannot access this asset');
    }
    async assertCanReportAsset(assetId, actor) {
        await this.assertCanReadAsset(assetId, actor);
    }
};
exports.AssetsService = AssetsService;
exports.AssetsService = AssetsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        department_scope_service_1.DepartmentScopeService,
        warehouse_scope_service_1.WarehouseScopeService,
        notifications_service_1.NotificationsService,
        realtime_events_service_1.RealtimeEventsService])
], AssetsService);
//# sourceMappingURL=assets.service.js.map