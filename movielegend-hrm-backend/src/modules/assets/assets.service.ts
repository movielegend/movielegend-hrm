import { Injectable } from '@nestjs/common';
import {
  AssetAssignmentAction,
  AssetAssignmentStatus,
  AssetConditionStatus,
  AssetIncidentStatus,
  AssetIncidentType,
  AssetMaintenanceStatus,
  AssetStatus,
  NotificationType,
  Prisma,
} from '@prisma/client';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { badRequest, conflict, forbidden, notFound } from '../../common/utils/error.util';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { DepartmentScopeService } from '../phase2-policy/department-scope.service';
import { RealtimeEventsService } from '../realtime/realtime-events.service';
import { WarehouseScopeService } from '../warehouse/warehouse-scope.service';
import {
  AssignAssetDto,
  CreateAssetDto,
  MaintenanceDto,
  ReceiveReturnDto,
  ReportIncidentDto,
  ResolveIncidentDto,
  TransferAssetDto,
  UpdateAssetDto,
  RevokeAssetDto,
  RequestReturnDto,
} from './dto/asset.dto';

@Injectable()
export class AssetsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly departments: DepartmentScopeService,
    private readonly warehouses: WarehouseScopeService,
    private readonly notifications: NotificationsService,
    private readonly realtime: RealtimeEventsService,
  ) {}

  create(dto: CreateAssetDto, actor: AuthenticatedUser) {
    if (dto.departmentId && !actor.roles.includes('ADMIN')) this.departments.assertDepartmentAccess(actor, dto.departmentId);
    return this.prisma.$transaction(async (tx) => {
      const assetCode = dto.assetCode ?? (await this.prisma.nextSequenceCode(tx, 'asset_code_seq', 'AST'));
      const asset = await tx.asset.create({ data: { ...dto, assetCode } });
      await tx.auditLog.create({
        data: { actorUserId: actor.userId, action: 'ASSET_CREATED', entityType: 'Asset', entityId: asset.id },
      });
      return asset;
    });
  }

  findAll(actor: AuthenticatedUser) {
    if (actor.roles.includes('ADMIN')) return this.prisma.asset.findMany({ where: { deletedAt: null }, include: { assignments: true, department: true } });
    const departments = this.departments.visibleDepartmentIds(actor) ?? [];
    return this.prisma.asset.findMany({
      where: {
        deletedAt: null,
        OR: [
          { departmentId: { in: departments } },
          { assignments: { some: { assignedToUserId: actor.userId, status: { in: [AssetAssignmentStatus.ACTIVE, AssetAssignmentStatus.PENDING_CONFIRMATION, AssetAssignmentStatus.RETURN_REQUESTED] } } } },
          { assignments: { some: { assignedToDepartmentId: { in: departments } } } },
        ],
      },
      include: { assignments: true, department: true },
    });
  }

  myAssets(actor: AuthenticatedUser) {
    return this.prisma.assetAssignment.findMany({
      where: { assignedToUserId: actor.userId, status: { in: [AssetAssignmentStatus.ACTIVE, AssetAssignmentStatus.PENDING_CONFIRMATION, AssetAssignmentStatus.RETURN_REQUESTED] } },
      include: {
        asset: {
          select: {
            assetCode: true,
            name: true,
            conditionStatus: true,
            assetStatus: true,
            incidents: { where: { status: { in: [AssetIncidentStatus.OPEN, AssetIncidentStatus.INVESTIGATING] } } },
          },
        },
      },
      orderBy: { assignedAt: 'desc' },
    });
  }

  async findOne(id: string, actor: AuthenticatedUser) {
    const asset = await this.prisma.asset.findUnique({ where: { id }, include: { assignments: true, incidents: true } });
    if (!asset || asset.deletedAt) throw notFound('ASSET_NOT_FOUND', 'Asset not found');
    await this.assertCanReadAsset(id, actor);
    return asset;
  }

  async update(id: string, dto: UpdateAssetDto, actor: AuthenticatedUser) {
    const asset = await this.findOne(id, actor);
    if (asset.warehouseId) this.warehouses.assertWarehouseAccess(actor, asset.warehouseId);
    if (dto.departmentId && !actor.roles.includes('ADMIN')) this.departments.assertDepartmentAccess(actor, dto.departmentId);
    return this.prisma.asset.update({ where: { id }, data: dto });
  }

  async transfer(id: string, dto: TransferAssetDto, actor: AuthenticatedUser) {
    return this.prisma.$transaction(async (tx) => {
      const asset = await tx.asset.findUnique({ where: { id } });
      if (!asset || asset.deletedAt) throw notFound('ASSET_NOT_FOUND', 'Asset not found');
      if (asset.assetStatus !== AssetStatus.IN_STOCK) throw badRequest('ASSET_NOT_TRANSFERABLE', 'Asset must be in stock to transfer');
      if (asset.departmentId && !actor.roles.includes('ADMIN')) this.departments.assertDepartmentAccess(actor, asset.departmentId);
      
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

  async assign(id: string, dto: AssignAssetDto, actor: AuthenticatedUser) {
    if (!dto.assignedToUserId && !dto.assignedToDepartmentId) throw badRequest('ASSET_ASSIGNMENT_TARGET_REQUIRED', 'Assignment target is required');
    if (dto.assignedToUserId && dto.assignedToDepartmentId) throw badRequest('ASSET_ASSIGNMENT_TARGET_INVALID', 'Only one assignment target is allowed');
    const payload = await this.prisma.$transaction(async (tx) => {
      const asset = await tx.asset.findUnique({ where: { id } });
      if (!asset || asset.deletedAt) throw notFound('ASSET_NOT_FOUND', 'Asset not found');
      if (asset.assetStatus !== AssetStatus.IN_STOCK) throw badRequest('ASSET_NOT_ASSIGNABLE', 'Asset is not in stock');
      if (asset.warehouseId) this.warehouses.assertWarehouseAccess(actor, asset.warehouseId);
      // If asset is IN_STOCK, clean up any old stale active/pending assignments
      await tx.assetAssignment.updateMany({
        where: {
          assetId: id,
          status: { in: [AssetAssignmentStatus.PENDING_CONFIRMATION, AssetAssignmentStatus.ACTIVE, AssetAssignmentStatus.RETURN_REQUESTED] },
        },
        data: {
          status: AssetAssignmentStatus.RETURNED,
          returnedAt: new Date(),
        },
      });
      const assignment = await tx.assetAssignment.create({
        data: {
          assetId: id,
          assignedToUserId: dto.assignedToUserId,
          assignedToDepartmentId: dto.assignedToDepartmentId,
          assignedById: actor.userId,
          expectedReturnAt: dto.expectedReturnAt ? new Date(dto.expectedReturnAt) : undefined,
          conditionWhenAssigned: dto.conditionWhenAssigned ?? asset.conditionStatus,
          note: dto.note,
          histories: { create: { action: AssetAssignmentAction.CREATED, performedById: actor.userId } },
        },
      });
      await tx.asset.update({ where: { id }, data: { assetStatus: AssetStatus.ASSIGNED } });
      await tx.auditLog.create({
        data: { actorUserId: actor.userId, action: 'ASSET_ASSIGNED', entityType: 'AssetAssignment', entityId: assignment.id },
      });
      const notifyUsers = dto.assignedToUserId ? [dto.assignedToUserId] : [];
      const notify = await this.notifications.createForUsers(tx, notifyUsers, {
        type: NotificationType.ASSET_ASSIGNED,
        title: 'Asset assigned',
        body: asset.name,
        metadata: { assetId: id, assignmentId: assignment.id },
      });
      return { assignment, notify };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    this.notifications.emitCreated(payload.notify);
    this.realtime.emitToUser(payload.assignment.assignedToUserId ?? actor.userId, 'asset:assigned', payload.assignment);
    return payload.assignment;
  }

  async revoke(id: string, dto: RevokeAssetDto, actor: AuthenticatedUser) {
    const asset = await this.prisma.asset.findUnique({
      where: { id, deletedAt: null },
      include: {
        assignments: {
          where: { status: { in: ['ACTIVE', 'PENDING_CONFIRMATION', 'RETURN_REQUESTED'] } },
        },
      },
    });
    if (!asset) throw notFound('ASSET_NOT_FOUND', 'Asset not found');
    if (asset.departmentId && !actor.roles.includes('ADMIN')) this.departments.assertDepartmentAccess(actor, asset.departmentId);

    const activeAssignment = asset.assignments[0];
    if (!activeAssignment) throw badRequest('ASSET_NOT_ASSIGNED', 'Asset is not currently assigned to anyone');

    return this.prisma.$transaction(async (tx) => {
      // Mark all active/pending assignments as returned
      await tx.assetAssignment.updateMany({
        where: {
          assetId: id,
          status: { in: ['ACTIVE', 'PENDING_CONFIRMATION', 'RETURN_REQUESTED'] },
        },
        data: {
          status: 'RETURNED',
          returnedAt: new Date(),
          note: dto.note || 'Thu hồi bởi quản lý',
        },
      });

      // Reset asset to target status or IN_STOCK
      const assetStatus = dto.targetAssetStatus || 'IN_STOCK';
      const updatedAsset = await tx.asset.update({
        where: { id },
        data: { assetStatus },
        include: { assignments: true, department: true },
      });

      if (assetStatus === 'MAINTENANCE') {
        await tx.assetMaintenanceRecord.create({
          data: {
            assetId: id,
            maintenanceType: dto.maintenanceType || 'Sửa chữa đột xuất',
            vendorName: dto.vendorName,
            description: dto.note || 'Sửa chữa tài sản hỏng',
            startedAt: dto.startedAt ? new Date(dto.startedAt) : new Date(),
            createdById: actor.userId,
          },
        });
      } else if (assetStatus === 'DISPOSED') {
        await tx.auditLog.create({
          data: { 
            actorUserId: actor.userId, 
            action: 'ASSET_DISPOSED', 
            entityType: 'Asset', 
            entityId: id, 
            metadata: { reason: dto.note } 
          },
        });
      }

      await tx.auditLog.create({
        data: { actorUserId: actor.userId, action: 'ASSET_REVOKED', entityType: 'Asset', entityId: id, metadata: { assignmentId: activeAssignment.id, note: dto.note } },
      });

      if (activeAssignment.assignedToUserId && activeAssignment.assignedToUserId !== actor.userId) {
        const notify = await this.notifications.createForUsers(tx, [activeAssignment.assignedToUserId], {
          type: NotificationType.ASSET_RETURNED,
          title: 'Thu hồi thiết bị',
          body: `Thiết bị ${asset.name} (${asset.assetCode}) của bạn đã được quản lý thu hồi.`,
          metadata: { assetId: id, assignmentId: activeAssignment.id },
        });
        this.notifications.emitCreated(notify);
      }

      return updatedAsset;
    });
  }

  private async notifyManagers(
    tx: Prisma.TransactionClient,
    actor: AuthenticatedUser,
    type: NotificationType,
    title: string,
    body: string,
    metadata: Record<string, unknown>,
  ) {
    const managers = await tx.userRole.findMany({
      where: { role: { code: { in: ['ADMIN', 'WAREHOUSE_MANAGER'] } } },
      select: { userId: true },
    });
    const notifyUserIds = Array.from(new Set(managers.map((m) => m.userId))).filter((id) => id !== actor.userId);
    if (notifyUserIds.length > 0) {
      const notify = await this.notifications.createForUsers(tx, notifyUserIds, {
        type,
        title,
        body,
        metadata: metadata as any,
      });
      this.notifications.emitCreated(notify);
    }
  }

  async confirmAssignment(id: string, actor: AuthenticatedUser) {
    const payload = await this.prisma.$transaction(async (tx) => {
      const assignment = await tx.assetAssignment.findUnique({ where: { id }, include: { asset: true } });
      if (!assignment) throw notFound('ASSET_ASSIGNMENT_NOT_FOUND', 'Asset assignment not found');
      if (assignment.assignedToUserId !== actor.userId) throw forbidden('ASSET_ASSIGNMENT_OWNER_ONLY', 'Only receiver can confirm this assignment');
      if (assignment.status !== AssetAssignmentStatus.PENDING_CONFIRMATION) throw conflict('ASSET_ASSIGNMENT_ALREADY_PROCESSED', 'Assignment already processed');
      const updated = await tx.assetAssignment.update({
        where: { id },
        data: { status: AssetAssignmentStatus.ACTIVE, receiverConfirmedAt: new Date(), histories: { create: { action: AssetAssignmentAction.CONFIRMED, performedById: actor.userId } } },
      });
      await tx.asset.update({ where: { id: assignment.assetId }, data: { assetStatus: AssetStatus.IN_USE } });

      const actorProfile = await tx.user.findUnique({ where: { id: actor.userId }, include: { profile: true } }).then(u => u?.profile);
      const actorName = actorProfile?.fullName || 'Nhân sự';

      await this.notifyManagers(
        tx,
        actor,
        NotificationType.ASSET_ASSIGNMENT_CONFIRMED,
        'Xác nhận nhận thiết bị',
        `${actorName} đã xác nhận nhận thiết bị ${assignment.asset.name} (${assignment.asset.assetCode}).`,
        { assetId: assignment.assetId, assignmentId: id },
      );

      return updated;
    });
    this.realtime.emitToUser(actor.userId, 'asset:assigned', payload);
    return payload;
  }

  async requestReturn(id: string, dto: RequestReturnDto, actor: AuthenticatedUser) {
    const payload = await this.prisma.$transaction(async (tx) => {
      const assignment = await tx.assetAssignment.findUnique({ where: { id }, include: { asset: true } });
      if (!assignment) throw notFound('ASSET_ASSIGNMENT_NOT_FOUND', 'Asset assignment not found');
      if (assignment.assignedToUserId !== actor.userId) throw forbidden('ASSET_ASSIGNMENT_OWNER_ONLY', 'Only assignee can request return');
      if (assignment.status !== AssetAssignmentStatus.ACTIVE) throw conflict('ASSET_ASSIGNMENT_NOT_ACTIVE', 'Assignment is not active');
      const updated = await tx.assetAssignment.update({
        where: { id },
        data: { status: AssetAssignmentStatus.RETURN_REQUESTED, histories: { create: { action: AssetAssignmentAction.RETURN_REQUESTED, performedById: actor.userId, note: dto.reason } } },
      });

      const actorProfile = await tx.user.findUnique({ where: { id: actor.userId }, include: { profile: true } }).then(u => u?.profile);
      const actorName = actorProfile?.fullName || 'Nhân sự';

      await this.notifyManagers(
        tx,
        actor,
        NotificationType.ASSET_RETURN_REQUESTED,
        'Yêu cầu trả lại thiết bị',
        `${actorName} vừa gửi yêu cầu trả lại thiết bị ${assignment.asset.name} (${assignment.asset.assetCode}).`,
        { assetId: assignment.assetId, assignmentId: id },
      );

      return updated;
    });
    return payload;
  }

  async receiveReturn(id: string, dto: ReceiveReturnDto, actor: AuthenticatedUser) {
    const updated = await this.prisma.$transaction(async (tx) => {
      const assignment = await tx.assetAssignment.findUnique({ where: { id }, include: { asset: true } });
      if (!assignment) throw notFound('ASSET_ASSIGNMENT_NOT_FOUND', 'Asset assignment not found');
      if (assignment.asset.warehouseId) this.warehouses.assertWarehouseAccess(actor, assignment.asset.warehouseId);
      if (assignment.status !== AssetAssignmentStatus.RETURN_REQUESTED && assignment.status !== AssetAssignmentStatus.ACTIVE) {
        throw conflict('ASSET_RETURN_NOT_ALLOWED', 'Asset return is not allowed now');
      }
      const assetStatus = dto.conditionWhenReturned === AssetConditionStatus.DAMAGED ? AssetStatus.MAINTENANCE : AssetStatus.IN_STOCK;
      const result = await tx.assetAssignment.update({
        where: { id },
        data: {
          status: AssetAssignmentStatus.RETURNED,
          returnedAt: new Date(),
          conditionWhenReturned: dto.conditionWhenReturned,
          note: dto.note,
          histories: { create: { action: AssetAssignmentAction.RETURNED, performedById: actor.userId, note: dto.note } },
        },
      });
      await tx.asset.update({ where: { id: assignment.assetId }, data: { assetStatus, conditionStatus: dto.conditionWhenReturned } });
      await tx.auditLog.create({
        data: { actorUserId: actor.userId, action: 'ASSET_RETURNED', entityType: 'AssetAssignment', entityId: id },
      });

      if (assignment.assignedToUserId && assignment.assignedToUserId !== actor.userId) {
        const notify = await this.notifications.createForUsers(tx, [assignment.assignedToUserId], {
          type: NotificationType.ASSET_RETURNED,
          title: 'Hoàn tất thu hồi thiết bị',
          body: `Yêu cầu trả thiết bị ${assignment.asset.name} (${assignment.asset.assetCode}) của bạn đã được tiếp nhận & thu hồi xong.`,
          metadata: { assetId: assignment.assetId, assignmentId: id },
        });
        this.notifications.emitCreated(notify);
      }

      return result;
    });
    this.realtime.emitToRoom('asset:return-updated', 'asset:return-updated', updated);
    return updated;
  }

  async reportIncident(assetId: string, dto: ReportIncidentDto, actor: AuthenticatedUser) {
    await this.assertCanReportAsset(assetId, actor);
    const payload = await this.prisma.$transaction(async (tx) => {
      const asset = await tx.asset.findUnique({ where: { id: assetId } });
      if (!asset) throw notFound('ASSET_NOT_FOUND', 'Asset not found');

      const incident = await tx.assetIncidentReport.create({
        data: { assetId, reportedById: actor.userId, incidentType: dto.incidentType, description: dto.description, evidenceUrl: dto.evidenceUrl },
      });
      const actorProfile = await tx.user.findUnique({ where: { id: actor.userId }, include: { profile: true } }).then(u => u?.profile);
      const actorName = actorProfile?.fullName || 'Nhân sự';

      await this.notifyManagers(
        tx,
        actor,
        NotificationType.ASSET_INCIDENT_REPORTED,
        'Báo cáo sự cố thiết bị',
        `${actorName} vừa báo sự cố cho thiết bị ${asset.name} (${asset.assetCode}): ${dto.description}`,
        { assetId, incidentId: incident.id },
      );

      return incident;
    });
    this.realtime.emitToRoom('asset:incident-updated', 'asset:incident-updated', payload);
    return payload;
  }

  findIncidents() {
    return this.prisma.assetIncidentReport.findMany({ include: { asset: true }, orderBy: { createdAt: 'desc' } });
  }

  async findIncident(id: string) {
    const incident = await this.prisma.assetIncidentReport.findUnique({ where: { id }, include: { asset: true } });
    if (!incident) throw notFound('ASSET_INCIDENT_NOT_FOUND', 'Incident not found');
    return incident;
  }

  async investigateIncident(id: string, actor: AuthenticatedUser) {
    const updated = await this.prisma.$transaction(async (tx) => {
      const incident = await tx.assetIncidentReport.findUnique({ where: { id }, include: { asset: true } });
      if (!incident) throw notFound('ASSET_INCIDENT_NOT_FOUND', 'Incident not found');
      const result = await tx.assetIncidentReport.update({ where: { id }, data: { status: AssetIncidentStatus.INVESTIGATING } });

      if (incident.reportedById && incident.reportedById !== actor.userId) {
        const notify = await this.notifications.createForUsers(tx, [incident.reportedById], {
          type: NotificationType.ASSET_INCIDENT_REPORTED,
          title: 'Sự cố thiết bị đang xử lý',
          body: `Báo cáo sự cố thiết bị ${incident.asset.name} (${incident.asset.assetCode}) của bạn đang được kiểm tra & xử lý.`,
          metadata: { assetId: incident.assetId, incidentId: id },
        });
        this.notifications.emitCreated(notify);
      }
      return result;
    });
    this.realtime.emitToRoom('asset:incident-updated', 'asset:incident-updated', updated);
    return updated;
  }

  async resolveIncident(id: string, dto: ResolveIncidentDto, actor: AuthenticatedUser) {
    const updated = await this.prisma.$transaction(async (tx) => {
      const incident = await tx.assetIncidentReport.findUnique({ where: { id }, include: { asset: true } });
      if (!incident) throw notFound('ASSET_INCIDENT_NOT_FOUND', 'Incident not found');
      const assetStatus = dto.assetStatus ?? (incident.incidentType === AssetIncidentType.DAMAGED ? AssetStatus.MAINTENANCE : AssetStatus.LOST);
      await tx.asset.update({ where: { id: incident.assetId }, data: { assetStatus } });

      if (assetStatus === AssetStatus.DAMAGED) {
        const assignment = await tx.assetAssignment.findFirst({
          where: {
            assetId: incident.assetId,
            status: { in: [AssetAssignmentStatus.ACTIVE, AssetAssignmentStatus.RETURN_REQUESTED] },
          },
        });
        if (assignment) {
          await tx.assetAssignment.update({
            where: { id: assignment.id },
            data: { status: AssetAssignmentStatus.RETURNED },
          });
          await tx.assetAssignmentHistory.create({
            data: {
              assetAssignmentId: assignment.id,
              action: 'RETURNED',
              performedById: actor.userId,
              note: `Thu hồi do xử lý sự cố: Hỏng`,
            },
          });
        }
      }
      const result = await tx.assetIncidentReport.update({
        where: { id },
        data: { status: AssetIncidentStatus.RESOLVED, resolvedById: actor.userId, resolvedAt: new Date(), resolutionNote: dto.resolutionNote },
      });
      await tx.auditLog.create({
        data: { actorUserId: actor.userId, action: 'ASSET_INCIDENT_RESOLVED', entityType: 'AssetIncidentReport', entityId: id },
      });

      if (incident.reportedById && incident.reportedById !== actor.userId) {
        const notify = await this.notifications.createForUsers(tx, [incident.reportedById], {
          type: NotificationType.ASSET_INCIDENT_RESOLVED,
          title: 'Sự cố thiết bị đã xử lý',
          body: `Báo cáo sự cố thiết bị ${incident.asset.name} (${incident.asset.assetCode}) đã được xử lý xong: ${dto.resolutionNote || 'Thành công'}.`,
          metadata: { assetId: incident.assetId, incidentId: id },
        });
        this.notifications.emitCreated(notify);
      }

      return result;
    });
    this.realtime.emitToRoom('asset:incident-updated', 'asset:incident-updated', updated);
    return updated;
  }

  async rejectIncident(id: string, dto: ResolveIncidentDto, actor: AuthenticatedUser) {
    const updated = await this.prisma.$transaction(async (tx) => {
      const incident = await tx.assetIncidentReport.findUnique({ where: { id }, include: { asset: true } });
      if (!incident) throw notFound('ASSET_INCIDENT_NOT_FOUND', 'Incident not found');
      const result = await tx.assetIncidentReport.update({
        where: { id },
        data: { status: AssetIncidentStatus.REJECTED, resolvedById: actor.userId, resolvedAt: new Date(), resolutionNote: dto.resolutionNote },
      });

      if (incident.reportedById && incident.reportedById !== actor.userId) {
        const notify = await this.notifications.createForUsers(tx, [incident.reportedById], {
          type: NotificationType.ASSET_INCIDENT_RESOLVED,
          title: 'Báo cáo sự cố bị từ chối',
          body: `Báo cáo sự cố thiết bị ${incident.asset.name} (${incident.asset.assetCode}) bị từ chối: ${dto.resolutionNote || 'Không hợp lệ'}.`,
          metadata: { assetId: incident.assetId, incidentId: id },
        });
        this.notifications.emitCreated(notify);
      }

      return result;
    });
    this.realtime.emitToRoom('asset:incident-updated', 'asset:incident-updated', updated);
    return updated;
  }

  async startMaintenance(assetId: string, dto: MaintenanceDto, actor: AuthenticatedUser) {
    return this.prisma.$transaction(async (tx) => {
      const asset = await tx.asset.findUnique({ where: { id: assetId } });
      if (!asset) throw notFound('ASSET_NOT_FOUND', 'Asset not found');
      const maintainableStatuses: AssetStatus[] = [AssetStatus.IN_STOCK, AssetStatus.DAMAGED];
      if (!maintainableStatuses.includes(asset.assetStatus)) throw badRequest('ASSET_MAINTENANCE_NOT_ALLOWED', 'Asset cannot enter maintenance');
      await tx.asset.update({ where: { id: assetId }, data: { assetStatus: AssetStatus.MAINTENANCE } });
      return tx.assetMaintenanceRecord.create({
        data: { assetId, maintenanceType: dto.maintenanceType, vendorName: dto.vendorName, description: dto.description, startedAt: new Date(), createdById: actor.userId },
      });
    });
  }

  async completeMaintenance(id: string, conditionStatus: AssetConditionStatus, actor: AuthenticatedUser) {
    return this.prisma.$transaction(async (tx) => {
      const record = await tx.assetMaintenanceRecord.findUnique({ where: { id } });
      if (!record) throw notFound('ASSET_MAINTENANCE_NOT_FOUND', 'Maintenance record not found');
      const assetStatus = conditionStatus === AssetConditionStatus.DAMAGED ? AssetStatus.DAMAGED : AssetStatus.IN_STOCK;
      await tx.asset.update({ where: { id: record.assetId }, data: { assetStatus, conditionStatus } });
      return tx.assetMaintenanceRecord.update({
        where: { id },
        data: { status: AssetMaintenanceStatus.COMPLETED, completedAt: new Date() },
      });
    });
  }

  private async assertCanReadAsset(assetId: string, actor: AuthenticatedUser): Promise<void> {
    if (actor.roles.includes('ADMIN')) return;
    const assignment = await this.prisma.assetAssignment.findFirst({
      where: {
        assetId,
        status: { in: [AssetAssignmentStatus.ACTIVE, AssetAssignmentStatus.PENDING_CONFIRMATION, AssetAssignmentStatus.RETURN_REQUESTED] },
      },
    });
    if (!assignment) throw forbidden('ASSET_FORBIDDEN', 'Cannot access this asset');
    if (assignment.assignedToUserId === actor.userId) return;
    if (assignment.assignedToDepartmentId) this.departments.assertDepartmentAccess(actor, assignment.assignedToDepartmentId);
    else throw forbidden('ASSET_FORBIDDEN', 'Cannot access this asset');
  }

  private async assertCanReportAsset(assetId: string, actor: AuthenticatedUser): Promise<void> {
    const asset = await this.prisma.asset.findUnique({ where: { id: assetId } });
    if (!asset) throw notFound('ASSET_NOT_FOUND', 'Asset not found');
    if (asset.assetStatus !== AssetStatus.IN_USE) throw forbidden('ASSET_NOT_IN_USE', 'Tài sản không ở trạng thái Đang sử dụng');

    const assignment = await this.prisma.assetAssignment.findFirst({
      where: {
        assetId,
        status: { in: [AssetAssignmentStatus.ACTIVE, AssetAssignmentStatus.RETURN_REQUESTED] },
      },
    });
    if (!assignment || assignment.assignedToUserId !== actor.userId) {
      throw forbidden('ASSET_FORBIDDEN', 'Bạn không phải là người đang giữ tài sản này');
    }

    const openIncident = await this.prisma.assetIncidentReport.findFirst({
      where: {
        assetId,
        status: { notIn: [AssetIncidentStatus.RESOLVED, AssetIncidentStatus.REJECTED] }
      }
    });
    if (openIncident) {
      throw forbidden('ASSET_INCIDENT_EXISTS', 'Tài sản này đã có báo cáo sự cố đang được xử lý.');
    }
  }
}
