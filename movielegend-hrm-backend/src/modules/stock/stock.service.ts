import { Injectable } from '@nestjs/common';
import {
  MaterialIssueStatus,
  NotificationType,
  Prisma,
  StockReceiptStatus,
  StockTransactionType,
  StockTransferStatus,
} from '@prisma/client';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { badRequest, conflict, forbidden, notFound } from '../../common/utils/error.util';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { DepartmentScopeService } from '../phase2-policy/department-scope.service';
import { RealtimeEventsService } from '../realtime/realtime-events.service';
import { WarehouseScopeService } from '../warehouse/warehouse-scope.service';
import { CreateMaterialIssueDto, CreateStockReceiptDto, CreateStockTransferDto, RejectDto } from './dto/stock.dto';

@Injectable()
export class StockService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly warehouses: WarehouseScopeService,
    private readonly departments: DepartmentScopeService,
    private readonly notifications: NotificationsService,
    private readonly realtime: RealtimeEventsService,
  ) {}

  createReceipt(dto: CreateStockReceiptDto, actor: AuthenticatedUser) {
    this.warehouses.assertWarehouseAccess(actor, dto.warehouseId);
    return this.prisma.$transaction(async (tx) => {
      const receiptCode = await this.prisma.nextSequenceCode(tx, 'stock_receipt_code_seq', 'RCV');
      return tx.stockReceipt.create({
        data: {
          receiptCode,
          warehouseId: dto.warehouseId,
          supplierName: dto.supplierName,
          referenceNumber: dto.referenceNumber,
          receiptDate: dto.receiptDate ? new Date(dto.receiptDate) : new Date(),
          note: dto.note,
          createdById: actor.userId,
          items: {
            create: dto.items.map((item) => ({
              materialId: item.materialId,
              quantity: item.quantity,
              unitCost: item.unitCost,
              note: item.note,
            })),
          },
        },
        include: { items: true },
      });
    });
  }

  findReceipts(actor: AuthenticatedUser) {
    const ids = this.warehouses.visibleWarehouseIds(actor);
    return this.prisma.stockReceipt.findMany({
      where: ids ? { warehouseId: { in: ids } } : {},
      include: { items: true, warehouse: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findReceipt(id: string, actor: AuthenticatedUser) {
    const receipt = await this.prisma.stockReceipt.findUnique({ where: { id }, include: { items: true } });
    if (!receipt) throw notFound('STOCK_RECEIPT_NOT_FOUND', 'Stock receipt not found');
    this.warehouses.assertWarehouseAccess(actor, receipt.warehouseId);
    return receipt;
  }

  async approveReceipt(id: string, actor: AuthenticatedUser) {
    const result = await this.prisma.$transaction(async (tx) => {
      const receipt = await tx.stockReceipt.findUnique({ where: { id }, include: { items: true } });
      if (!receipt) throw notFound('STOCK_RECEIPT_NOT_FOUND', 'Stock receipt not found');
      this.warehouses.assertWarehouseAccess(actor, receipt.warehouseId);
      if (receipt.status !== StockReceiptStatus.PENDING) throw conflict('STOCK_RECEIPT_ALREADY_PROCESSED', 'Receipt already processed');
      for (const item of receipt.items) {
        await this.applyStockChange(tx, {
          warehouseId: receipt.warehouseId,
          materialId: item.materialId,
          quantity: Number(item.quantity),
          type: StockTransactionType.IMPORT,
          actorUserId: actor.userId,
          referenceType: 'StockReceipt',
          referenceId: receipt.id,
          unitCost: item.unitCost ? Number(item.unitCost) : undefined,
        });
      }
      const updated = await tx.stockReceipt.update({
        where: { id },
        data: { status: StockReceiptStatus.APPROVED, approvedById: actor.userId, approvedAt: new Date() },
        include: { items: true },
      });
      await tx.auditLog.create({
        data: { actorUserId: actor.userId, action: 'STOCK_RECEIPT_APPROVED', entityType: 'StockReceipt', entityId: id },
      });
      return updated;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    this.realtime.emitToRoom(`warehouse:${result.warehouseId}`, 'warehouse:stock-updated', result);
    return result;
  }

  async cancelReceipt(id: string, actor: AuthenticatedUser) {
    const receipt = await this.findReceipt(id, actor);
    if (receipt.status !== StockReceiptStatus.PENDING) throw conflict('STOCK_RECEIPT_ALREADY_PROCESSED', 'Receipt already processed');
    return this.prisma.stockReceipt.update({ where: { id }, data: { status: StockReceiptStatus.CANCELLED } });
  }

  createIssue(dto: CreateMaterialIssueDto, actor: AuthenticatedUser) {
    this.warehouses.assertWarehouseAccess(actor, dto.warehouseId);
    if (dto.issueTargetType === 'USER' && !dto.issuedToUserId) throw badRequest('ISSUE_TARGET_REQUIRED', 'issuedToUserId is required');
    if (dto.issueTargetType === 'DEPARTMENT' && !dto.issuedToDepartmentId) throw badRequest('ISSUE_TARGET_REQUIRED', 'issuedToDepartmentId is required');
    return this.prisma.$transaction(async (tx) => {
      const issueCode = await this.prisma.nextSequenceCode(tx, 'material_issue_code_seq', 'ISS');
      const issue = await tx.materialIssue.create({
        data: {
          issueCode,
          warehouseId: dto.warehouseId,
          issueTargetType: dto.issueTargetType,
          issuedToUserId: dto.issuedToUserId,
          issuedToDepartmentId: dto.issuedToDepartmentId,
          requestedById: actor.userId,
          note: dto.note,
          items: {
            create: dto.items.map((item) => ({
              materialId: item.materialId,
              quantityRequested: item.quantity,
              quantityApproved: item.quantity,
            })),
          },
        },
        include: { items: true },
      });
      const notify = await this.notificationForIssue(tx, issue.id, NotificationType.MATERIAL_ISSUE_REQUESTED);
      return { issue, notify };
    }).then((payload) => {
      this.notifications.emitCreated(payload.notify);
      return payload.issue;
    });
  }

  findIssues(actor: AuthenticatedUser) {
    const ids = this.warehouses.visibleWarehouseIds(actor);
    return this.prisma.materialIssue.findMany({
      where: ids ? { warehouseId: { in: ids } } : {},
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findIssue(id: string, actor: AuthenticatedUser) {
    const issue = await this.prisma.materialIssue.findUnique({ where: { id }, include: { items: true } });
    if (!issue) throw notFound('MATERIAL_ISSUE_NOT_FOUND', 'Material issue not found');
    this.assertCanReadIssue(issue, actor);
    return issue;
  }

  async approveIssue(id: string, actor: AuthenticatedUser) {
    const payload = await this.prisma.$transaction(async (tx) => {
      const issue = await tx.materialIssue.findUnique({ where: { id }, include: { items: true } });
      if (!issue) throw notFound('MATERIAL_ISSUE_NOT_FOUND', 'Material issue not found');
      this.warehouses.assertWarehouseAccess(actor, issue.warehouseId);
      if (issue.status !== MaterialIssueStatus.PENDING) throw conflict('MATERIAL_ISSUE_ALREADY_PROCESSED', 'Issue already processed');
      const updated = await tx.materialIssue.update({
        where: { id },
        data: { status: MaterialIssueStatus.APPROVED, approvedById: actor.userId },
        include: { items: true },
      });
      const notify = await this.notificationForIssue(tx, id, NotificationType.MATERIAL_ISSUE_APPROVED);
      return { updated, notify };
    });
    this.notifications.emitCreated(payload.notify);
    return payload.updated;
  }

  async rejectIssue(id: string, dto: RejectDto, actor: AuthenticatedUser) {
    const issue = await this.findIssue(id, actor);
    this.warehouses.assertWarehouseAccess(actor, issue.warehouseId);
    if (issue.status !== MaterialIssueStatus.PENDING) throw conflict('MATERIAL_ISSUE_ALREADY_PROCESSED', 'Issue already processed');
    return this.prisma.materialIssue.update({ where: { id }, data: { status: MaterialIssueStatus.REJECTED, note: dto.reason ?? issue.note } });
  }

  async issueMaterials(id: string, actor: AuthenticatedUser) {
    const payload = await this.prisma.$transaction(async (tx) => {
      const issue = await tx.materialIssue.findUnique({ where: { id }, include: { items: true } });
      if (!issue) throw notFound('MATERIAL_ISSUE_NOT_FOUND', 'Material issue not found');
      this.warehouses.assertWarehouseAccess(actor, issue.warehouseId);
      if (issue.status !== MaterialIssueStatus.APPROVED) throw conflict('MATERIAL_ISSUE_NOT_APPROVED', 'Issue must be approved before issuing');
      await tx.materialIssue.update({ where: { id }, data: { status: MaterialIssueStatus.ISSUING } });
      for (const item of issue.items) {
        await this.applyStockChange(tx, {
          warehouseId: issue.warehouseId,
          materialId: item.materialId,
          quantity: Number(item.quantityApproved),
          type: StockTransactionType.ISSUE,
          actorUserId: actor.userId,
          referenceType: 'MaterialIssue',
          referenceId: id,
        });
        await tx.materialIssueItem.update({ where: { id: item.id }, data: { quantityIssued: item.quantityApproved } });
      }
      const updated = await tx.materialIssue.update({
        where: { id },
        data: { status: MaterialIssueStatus.COMPLETED, issuedById: actor.userId, issueDate: new Date() },
        include: { items: true },
      });
      await tx.auditLog.create({
        data: { actorUserId: actor.userId, action: 'STOCK_ADJUSTED', entityType: 'MaterialIssue', entityId: id },
      });
      const notify = await this.notificationForIssue(tx, id, NotificationType.MATERIAL_ISSUED);
      return { updated, notify };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    this.notifications.emitCreated(payload.notify);
    this.realtime.emitToRoom(`warehouse:${payload.updated.warehouseId}`, 'material:issue-updated', payload.updated);
    return payload.updated;
  }

  async cancelIssue(id: string, actor: AuthenticatedUser) {
    const issue = await this.findIssue(id, actor);
    const cancellableStatuses: MaterialIssueStatus[] = [MaterialIssueStatus.PENDING, MaterialIssueStatus.APPROVED];
    if (!cancellableStatuses.includes(issue.status)) {
      throw conflict('MATERIAL_ISSUE_ALREADY_PROCESSED', 'Issue already processed');
    }
    return this.prisma.materialIssue.update({ where: { id }, data: { status: MaterialIssueStatus.CANCELLED } });
  }

  createTransfer(dto: CreateStockTransferDto, actor: AuthenticatedUser) {
    if (dto.sourceWarehouseId === dto.targetWarehouseId) throw badRequest('TRANSFER_SAME_WAREHOUSE', 'Source and target warehouse must be different');
    this.warehouses.assertWarehouseAccess(actor, dto.sourceWarehouseId);
    return this.prisma.$transaction(async (tx) => {
      const transferCode = await this.prisma.nextSequenceCode(tx, 'stock_transfer_code_seq', 'TRF');
      return tx.stockTransfer.create({
        data: {
          transferCode,
          sourceWarehouseId: dto.sourceWarehouseId,
          targetWarehouseId: dto.targetWarehouseId,
          requestedById: actor.userId,
          note: dto.note,
          items: { create: dto.items.map((item) => ({ materialId: item.materialId, quantity: item.quantity })) },
        },
        include: { items: true },
      });
    });
  }

  findTransfers(actor: AuthenticatedUser) {
    const ids = this.warehouses.visibleWarehouseIds(actor);
    return this.prisma.stockTransfer.findMany({
      where: ids ? { OR: [{ sourceWarehouseId: { in: ids } }, { targetWarehouseId: { in: ids } }] } : {},
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approveTransfer(id: string, actor: AuthenticatedUser) {
    const transfer = await this.prisma.stockTransfer.findUnique({ where: { id } });
    if (!transfer) throw notFound('STOCK_TRANSFER_NOT_FOUND', 'Stock transfer not found');
    this.warehouses.assertWarehouseAccess(actor, transfer.sourceWarehouseId);
    if (transfer.status !== StockTransferStatus.PENDING) throw conflict('STOCK_TRANSFER_ALREADY_PROCESSED', 'Transfer already processed');
    const updated = await this.prisma.stockTransfer.update({
      where: { id },
      data: { status: StockTransferStatus.APPROVED, approvedById: actor.userId },
      include: { items: true },
    });
    this.realtime.emitToRoom(`warehouse:${updated.sourceWarehouseId}`, 'warehouse:stock-updated', updated);
    return updated;
  }

  async shipTransfer(id: string, actor: AuthenticatedUser) {
    const updated = await this.prisma.$transaction(async (tx) => {
      const transfer = await tx.stockTransfer.findUnique({ where: { id }, include: { items: true } });
      if (!transfer) throw notFound('STOCK_TRANSFER_NOT_FOUND', 'Stock transfer not found');
      this.warehouses.assertWarehouseAccess(actor, transfer.sourceWarehouseId);
      if (transfer.status !== StockTransferStatus.APPROVED) throw conflict('STOCK_TRANSFER_NOT_APPROVED', 'Transfer must be approved before shipping');
      for (const item of transfer.items) {
        await this.applyStockChange(tx, {
          warehouseId: transfer.sourceWarehouseId,
          materialId: item.materialId,
          quantity: Number(item.quantity),
          type: StockTransactionType.TRANSFER_OUT,
          actorUserId: actor.userId,
          referenceType: 'StockTransfer',
          referenceId: id,
        });
      }
      const result = await tx.stockTransfer.update({
        where: { id },
        data: { status: StockTransferStatus.IN_TRANSIT, shippedById: actor.userId, shippedAt: new Date() },
        include: { items: true },
      });
      await tx.auditLog.create({
        data: { actorUserId: actor.userId, action: 'STOCK_TRANSFER_SHIPPED', entityType: 'StockTransfer', entityId: id },
      });
      return result;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    this.realtime.emitToRoom(`warehouse:${updated.sourceWarehouseId}`, 'warehouse:stock-updated', updated);
    return updated;
  }

  async receiveTransfer(id: string, actor: AuthenticatedUser) {
    const updated = await this.prisma.$transaction(async (tx) => {
      const transfer = await tx.stockTransfer.findUnique({ where: { id }, include: { items: true } });
      if (!transfer) throw notFound('STOCK_TRANSFER_NOT_FOUND', 'Stock transfer not found');
      this.warehouses.assertWarehouseAccess(actor, transfer.targetWarehouseId);
      if (transfer.status !== StockTransferStatus.IN_TRANSIT) throw conflict('STOCK_TRANSFER_NOT_IN_TRANSIT', 'Transfer is not in transit');
      for (const item of transfer.items) {
        await this.applyStockChange(tx, {
          warehouseId: transfer.targetWarehouseId,
          materialId: item.materialId,
          quantity: Number(item.quantity),
          type: StockTransactionType.TRANSFER_IN,
          actorUserId: actor.userId,
          referenceType: 'StockTransfer',
          referenceId: id,
        });
      }
      const result = await tx.stockTransfer.update({
        where: { id },
        data: { status: StockTransferStatus.COMPLETED, receivedById: actor.userId, receivedAt: new Date() },
        include: { items: true },
      });
      await tx.auditLog.create({
        data: { actorUserId: actor.userId, action: 'STOCK_TRANSFER_RECEIVED', entityType: 'StockTransfer', entityId: id },
      });
      return result;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    this.realtime.emitToRoom(`warehouse:${updated.targetWarehouseId}`, 'warehouse:stock-updated', updated);
    return updated;
  }

  async cancelTransfer(id: string, actor: AuthenticatedUser) {
    const transfer = await this.prisma.stockTransfer.findUnique({ where: { id } });
    if (!transfer) throw notFound('STOCK_TRANSFER_NOT_FOUND', 'Stock transfer not found');
    this.warehouses.assertWarehouseAccess(actor, transfer.sourceWarehouseId);
    const cancellableTransferStatuses: StockTransferStatus[] = [StockTransferStatus.PENDING, StockTransferStatus.APPROVED];
    if (!cancellableTransferStatuses.includes(transfer.status)) {
      throw conflict('STOCK_TRANSFER_ALREADY_PROCESSED', 'Transfer already processed');
    }
    return this.prisma.stockTransfer.update({ where: { id }, data: { status: StockTransferStatus.CANCELLED } });
  }

  async applyStockChange(
    tx: Prisma.TransactionClient,
    input: {
      warehouseId: string;
      materialId: string;
      quantity: number;
      type: StockTransactionType;
      actorUserId: string;
      referenceType?: string;
      referenceId?: string;
      unitCost?: number;
      note?: string;
    },
  ) {
    if (input.quantity <= 0) throw badRequest('INVALID_STOCK_QUANTITY', 'Quantity must be positive');
    const decreaseTypes: StockTransactionType[] = [
      StockTransactionType.EXPORT,
      StockTransactionType.ISSUE,
      StockTransactionType.TRANSFER_OUT,
      StockTransactionType.ADJUSTMENT_DECREASE,
    ];
    const isDecrease = decreaseTypes.includes(input.type);
    const stock = await tx.warehouseStock.upsert({
      where: { warehouseId_materialId: { warehouseId: input.warehouseId, materialId: input.materialId } },
      update: {},
      create: { warehouseId: input.warehouseId, materialId: input.materialId, quantityOnHand: 0, quantityReserved: 0 },
    });
    const before = Number(stock.quantityOnHand);
    const after = isDecrease ? before - input.quantity : before + input.quantity;
    if (isDecrease && after < 0) throw badRequest('INSUFFICIENT_STOCK', 'Insufficient stock');
    const updated = await tx.warehouseStock.updateMany({
      where: {
        id: stock.id,
        version: stock.version,
        ...(isDecrease ? { quantityOnHand: { gte: input.quantity } } : {}),
      },
      data: {
        quantityOnHand: isDecrease ? { decrement: input.quantity } : { increment: input.quantity },
        version: { increment: 1 },
      },
    });
    if (updated.count !== 1) throw badRequest('INSUFFICIENT_STOCK', 'Insufficient stock');
    const transactionCode = await this.prisma.nextSequenceCode(tx, 'stock_transaction_code_seq', 'STX');
    return tx.stockTransaction.create({
      data: {
        transactionCode,
        warehouseId: input.warehouseId,
        materialId: input.materialId,
        transactionType: input.type,
        quantity: input.quantity,
        quantityBefore: before,
        quantityAfter: after,
        unitCost: input.unitCost,
        referenceType: input.referenceType,
        referenceId: input.referenceId,
        note: input.note,
        performedById: input.actorUserId,
      },
    });
  }

  private assertCanReadIssue(issue: { warehouseId: string; issuedToUserId: string | null; issuedToDepartmentId: string | null }, actor: AuthenticatedUser) {
    if (this.warehouses.canAccessWarehouse(actor, issue.warehouseId)) return;
    if (issue.issuedToUserId === actor.userId) return;
    if (issue.issuedToDepartmentId) this.departments.assertDepartmentAccess(actor, issue.issuedToDepartmentId);
    else throw forbidden('MATERIAL_ISSUE_FORBIDDEN', 'Cannot access this material issue');
  }

  private async notificationForIssue(tx: Prisma.TransactionClient, issueId: string, type: NotificationType) {
    const issue = await tx.materialIssue.findUnique({ where: { id: issueId } });
    if (!issue) return null;
    const userIds = [issue.requestedById, issue.issuedToUserId].filter(Boolean) as string[];
    if (issue.issuedToDepartmentId) {
      const department = await tx.department.findUnique({ where: { id: issue.issuedToDepartmentId }, select: { leaderUserId: true } });
      if (department?.leaderUserId) userIds.push(department.leaderUserId);
    }
    return this.notifications.createForUsers(tx, userIds, {
      type,
      title: 'Material issue updated',
      body: issue.issueCode,
      metadata: { issueId },
    });
  }
}
