import { Injectable } from '@nestjs/common';
import {
  AssetAssignmentAction,
  AssetAssignmentStatus,
  AssetConditionStatus,
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
  TransferAssetDto,
  UpdateAssetDto,
  RevokeAssetDto,
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

  findAll(actor: AuthenticatedUser, incidentTab?: string) {
    const whereCondition: any = { deletedAt: null };
    if (incidentTab === 'PENDING') {
      whereCondition.conditionStatus = 'PENDING';
    } else if (incidentTab === 'APPROVE') {
      whereCondition.conditionStatus = { in: ['BROKEN', 'OK'] };
      whereCondition.lastIncidentResolvedAt = { not: null };
    }

    if (actor.roles.includes('ADMIN')) return this.prisma.asset.findMany({ where: whereCondition, include: { assignments: true, department: true } });
    const departments = this.departments.visibleDepartmentIds(actor) ?? [];
    whereCondition.OR = [
      { departmentId: { in: departments } },
      { assignments: { some: { assignedToUserId: actor.userId, status: { in: [AssetAssignmentStatus.ACTIVE, AssetAssignmentStatus.PENDING_CONFIRMATION, AssetAssignmentStatus.RETURN_REQUESTED] } } } },
      { assignments: { some: { assignedToDepartmentId: { in: departments } } } },
    ];
    return this.prisma.asset.findMany({
      where: whereCondition,
      include: { assignments: true, department: true },
    });
  }

  myAssets(actor: AuthenticatedUser) {
    return this.prisma.assetAssignment.findMany({
      where: { assignedToUserId: actor.userId, status: { in: [AssetAssignmentStatus.ACTIVE, AssetAssignmentStatus.PENDING_CONFIRMATION, AssetAssignmentStatus.RETURN_REQUESTED] }, asset: { conditionStatus: { not: 'BROKEN' } } },
      include: {
        asset: {
          select: {
            assetCode: true,
            name: true,
            conditionStatus: true,
            assetStatus: true,
          },
        },
      },
      orderBy: { assignedAt: 'desc' },
    });
  }

  async findOne(id: string, actor: AuthenticatedUser) {
    const asset = await this.prisma.asset.findUnique({ where: { id }, include: { assignments: true } });
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
      const active = await tx.assetAssignment.findFirst({
        where: { assetId: id, status: { in: [AssetAssignmentStatus.PENDING_CONFIRMATION, AssetAssignmentStatus.ACTIVE, AssetAssignmentStatus.RETURN_REQUESTED] } },
      });
      if (active) throw conflict('ASSET_ALREADY_ASSIGNED', 'Asset already has an active assignment');
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
      await tx.asset.update({ where: { id }, data: { assetStatus: AssetStatus.OUT_OF_STOCK } });
      await tx.auditLog.create({
        data: { actorUserId: actor.userId, action: 'ASSET_ASSIGNED', entityType: 'AssetAssignment', entityId: assignment.id },
      });
      const notifyUsers = dto.assignedToUserId ? [dto.assignedToUserId] : [];
      const notify = await this.notifications.createForUsers(tx, notifyUsers, {
        type: NotificationType.ASSET_ASSIGNED,
        title: 'Asset assigned',
        body: asset.assetCode,
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
      // Mark assignment as returned
      await tx.assetAssignment.update({
        where: { id: activeAssignment.id },
        data: {
          status: 'RETURNED',
          returnedAt: new Date(),
          note: dto.note || 'Thu hồi bởi quản lý',
        },
      });

      // Reset asset to IN_STOCK
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

  async confirmAssignment(id: string, actor: AuthenticatedUser) {
    const payload = await this.prisma.$transaction(async (tx) => {
      const assignment = await tx.assetAssignment.findUnique({ where: { id } });
      if (!assignment) throw notFound('ASSET_ASSIGNMENT_NOT_FOUND', 'Asset assignment not found');
      if (assignment.assignedToUserId !== actor.userId) throw forbidden('ASSET_ASSIGNMENT_OWNER_ONLY', 'Only receiver can confirm this assignment');
      if (assignment.status !== AssetAssignmentStatus.PENDING_CONFIRMATION) throw conflict('ASSET_ASSIGNMENT_ALREADY_PROCESSED', 'Assignment already processed');
      const updated = await tx.assetAssignment.update({
        where: { id },
        data: { status: AssetAssignmentStatus.ACTIVE, receiverConfirmedAt: new Date(), histories: { create: { action: AssetAssignmentAction.CONFIRMED, performedById: actor.userId } } },
      });
      await tx.asset.update({ where: { id: assignment.assetId }, data: { assetStatus: AssetStatus.OUT_OF_STOCK } });
      return updated;
    });
    this.realtime.emitToUser(actor.userId, 'asset:assigned', payload);
    return payload;
  }

  async requestReturn(id: string, actor: AuthenticatedUser) {
    const assignment = await this.prisma.assetAssignment.findUnique({ where: { id } });
    if (!assignment) throw notFound('ASSET_ASSIGNMENT_NOT_FOUND', 'Asset assignment not found');
    if (assignment.assignedToUserId !== actor.userId) throw forbidden('ASSET_ASSIGNMENT_OWNER_ONLY', 'Only assignee can request return');
    if (assignment.status !== AssetAssignmentStatus.ACTIVE) throw conflict('ASSET_ASSIGNMENT_NOT_ACTIVE', 'Assignment is not active');
    return this.prisma.assetAssignment.update({
      where: { id },
      data: { status: AssetAssignmentStatus.RETURN_REQUESTED, histories: { create: { action: AssetAssignmentAction.RETURN_REQUESTED, performedById: actor.userId } } },
    });
  }

  async receiveReturn(id: string, dto: ReceiveReturnDto, actor: AuthenticatedUser) {
    const updated = await this.prisma.$transaction(async (tx) => {
      const assignment = await tx.assetAssignment.findUnique({ where: { id }, include: { asset: true } });
      if (!assignment) throw notFound('ASSET_ASSIGNMENT_NOT_FOUND', 'Asset assignment not found');
      if (assignment.asset.warehouseId) this.warehouses.assertWarehouseAccess(actor, assignment.asset.warehouseId);
      if (assignment.status !== AssetAssignmentStatus.RETURN_REQUESTED && assignment.status !== AssetAssignmentStatus.ACTIVE) {
        throw conflict('ASSET_RETURN_NOT_ALLOWED', 'Asset return is not allowed now');
      }
      const assetStatus = AssetStatus.IN_STOCK;
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
      return result;
    });
    this.realtime.emitToRoom('asset:return-updated', 'asset:return-updated', updated);
    return updated;
  }

  async updateIncidentStatus(id: string, status: 'BROKEN' | 'OK', actor: AuthenticatedUser, note?: string) {
    const asset = await this.prisma.asset.findUnique({ where: { id } });
    if (!asset) throw notFound('ASSET_NOT_FOUND', 'Asset not found');
    if (asset.conditionStatus !== 'PENDING' && (asset.conditionStatus as string) !== 'DAMAGED') throw badRequest('NOT_PENDING', 'Asset is not pending');

    const data: any = { conditionStatus: status, lastIncidentResolvedAt: new Date() };
    if (note) data.conditionNote = note;

    const updated = await this.prisma.asset.update({
      where: { id },
      data
    });

    await this.prisma.auditLog.create({
      data: { actorUserId: actor.userId, action: 'ASSET_INCIDENT_RESOLVED', entityType: 'Asset', entityId: id },
    });

    return updated;
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
    await this.assertCanReadAsset(assetId, actor);
  }
}
