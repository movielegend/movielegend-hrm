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
exports.StockService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const error_util_1 = require("../../common/utils/error.util");
const prisma_service_1 = require("../../database/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
const department_scope_service_1 = require("../phase2-policy/department-scope.service");
const realtime_events_service_1 = require("../realtime/realtime-events.service");
const warehouse_scope_service_1 = require("../warehouse/warehouse-scope.service");
let StockService = class StockService {
    prisma;
    warehouses;
    departments;
    notifications;
    realtime;
    constructor(prisma, warehouses, departments, notifications, realtime) {
        this.prisma = prisma;
        this.warehouses = warehouses;
        this.departments = departments;
        this.notifications = notifications;
        this.realtime = realtime;
    }
    createReceipt(dto, actor) {
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
    findReceipts(actor) {
        const ids = this.warehouses.visibleWarehouseIds(actor);
        return this.prisma.stockReceipt.findMany({
            where: ids ? { warehouseId: { in: ids } } : {},
            include: { items: true, warehouse: true },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findReceipt(id, actor) {
        const receipt = await this.prisma.stockReceipt.findUnique({ where: { id }, include: { items: true } });
        if (!receipt)
            throw (0, error_util_1.notFound)('STOCK_RECEIPT_NOT_FOUND', 'Stock receipt not found');
        this.warehouses.assertWarehouseAccess(actor, receipt.warehouseId);
        return receipt;
    }
    async approveReceipt(id, actor) {
        const result = await this.prisma.$transaction(async (tx) => {
            const receipt = await tx.stockReceipt.findUnique({ where: { id }, include: { items: true } });
            if (!receipt)
                throw (0, error_util_1.notFound)('STOCK_RECEIPT_NOT_FOUND', 'Stock receipt not found');
            this.warehouses.assertWarehouseAccess(actor, receipt.warehouseId);
            if (receipt.status !== client_1.StockReceiptStatus.PENDING)
                throw (0, error_util_1.conflict)('STOCK_RECEIPT_ALREADY_PROCESSED', 'Receipt already processed');
            for (const item of receipt.items) {
                await this.applyStockChange(tx, {
                    warehouseId: receipt.warehouseId,
                    materialId: item.materialId,
                    quantity: Number(item.quantity),
                    type: client_1.StockTransactionType.IMPORT,
                    actorUserId: actor.userId,
                    referenceType: 'StockReceipt',
                    referenceId: receipt.id,
                    unitCost: item.unitCost ? Number(item.unitCost) : undefined,
                });
            }
            const updated = await tx.stockReceipt.update({
                where: { id },
                data: { status: client_1.StockReceiptStatus.APPROVED, approvedById: actor.userId, approvedAt: new Date() },
                include: { items: true },
            });
            await tx.auditLog.create({
                data: { actorUserId: actor.userId, action: 'STOCK_RECEIPT_APPROVED', entityType: 'StockReceipt', entityId: id },
            });
            return updated;
        }, { isolationLevel: client_1.Prisma.TransactionIsolationLevel.Serializable });
        this.realtime.emitToRoom(`warehouse:${result.warehouseId}`, 'warehouse:stock-updated', result);
        return result;
    }
    async cancelReceipt(id, actor) {
        const receipt = await this.findReceipt(id, actor);
        if (receipt.status !== client_1.StockReceiptStatus.PENDING)
            throw (0, error_util_1.conflict)('STOCK_RECEIPT_ALREADY_PROCESSED', 'Receipt already processed');
        return this.prisma.stockReceipt.update({ where: { id }, data: { status: client_1.StockReceiptStatus.CANCELLED } });
    }
    createIssue(dto, actor) {
        this.warehouses.assertWarehouseAccess(actor, dto.warehouseId);
        if (dto.issueTargetType === 'USER' && !dto.issuedToUserId)
            throw (0, error_util_1.badRequest)('ISSUE_TARGET_REQUIRED', 'issuedToUserId is required');
        if (dto.issueTargetType === 'DEPARTMENT' && !dto.issuedToDepartmentId)
            throw (0, error_util_1.badRequest)('ISSUE_TARGET_REQUIRED', 'issuedToDepartmentId is required');
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
            const notify = await this.notificationForIssue(tx, issue.id, client_1.NotificationType.MATERIAL_ISSUE_REQUESTED);
            return { issue, notify };
        }).then((payload) => {
            this.notifications.emitCreated(payload.notify);
            return payload.issue;
        });
    }
    findIssues(actor) {
        const ids = this.warehouses.visibleWarehouseIds(actor);
        return this.prisma.materialIssue.findMany({
            where: ids ? { warehouseId: { in: ids } } : {},
            include: { items: true },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findIssue(id, actor) {
        const issue = await this.prisma.materialIssue.findUnique({ where: { id }, include: { items: true } });
        if (!issue)
            throw (0, error_util_1.notFound)('MATERIAL_ISSUE_NOT_FOUND', 'Material issue not found');
        this.assertCanReadIssue(issue, actor);
        return issue;
    }
    async approveIssue(id, actor) {
        const payload = await this.prisma.$transaction(async (tx) => {
            const issue = await tx.materialIssue.findUnique({ where: { id }, include: { items: true } });
            if (!issue)
                throw (0, error_util_1.notFound)('MATERIAL_ISSUE_NOT_FOUND', 'Material issue not found');
            this.warehouses.assertWarehouseAccess(actor, issue.warehouseId);
            if (issue.status !== client_1.MaterialIssueStatus.PENDING)
                throw (0, error_util_1.conflict)('MATERIAL_ISSUE_ALREADY_PROCESSED', 'Issue already processed');
            const updated = await tx.materialIssue.update({
                where: { id },
                data: { status: client_1.MaterialIssueStatus.APPROVED, approvedById: actor.userId },
                include: { items: true },
            });
            const notify = await this.notificationForIssue(tx, id, client_1.NotificationType.MATERIAL_ISSUE_APPROVED);
            return { updated, notify };
        });
        this.notifications.emitCreated(payload.notify);
        return payload.updated;
    }
    async rejectIssue(id, dto, actor) {
        const issue = await this.findIssue(id, actor);
        this.warehouses.assertWarehouseAccess(actor, issue.warehouseId);
        if (issue.status !== client_1.MaterialIssueStatus.PENDING)
            throw (0, error_util_1.conflict)('MATERIAL_ISSUE_ALREADY_PROCESSED', 'Issue already processed');
        return this.prisma.materialIssue.update({ where: { id }, data: { status: client_1.MaterialIssueStatus.REJECTED, note: dto.reason ?? issue.note } });
    }
    async issueMaterials(id, actor) {
        const payload = await this.prisma.$transaction(async (tx) => {
            const issue = await tx.materialIssue.findUnique({ where: { id }, include: { items: true } });
            if (!issue)
                throw (0, error_util_1.notFound)('MATERIAL_ISSUE_NOT_FOUND', 'Material issue not found');
            this.warehouses.assertWarehouseAccess(actor, issue.warehouseId);
            if (issue.status !== client_1.MaterialIssueStatus.APPROVED)
                throw (0, error_util_1.conflict)('MATERIAL_ISSUE_NOT_APPROVED', 'Issue must be approved before issuing');
            await tx.materialIssue.update({ where: { id }, data: { status: client_1.MaterialIssueStatus.ISSUING } });
            for (const item of issue.items) {
                await this.applyStockChange(tx, {
                    warehouseId: issue.warehouseId,
                    materialId: item.materialId,
                    quantity: Number(item.quantityApproved),
                    type: client_1.StockTransactionType.ISSUE,
                    actorUserId: actor.userId,
                    referenceType: 'MaterialIssue',
                    referenceId: id,
                });
                await tx.materialIssueItem.update({ where: { id: item.id }, data: { quantityIssued: item.quantityApproved } });
            }
            const updated = await tx.materialIssue.update({
                where: { id },
                data: { status: client_1.MaterialIssueStatus.COMPLETED, issuedById: actor.userId, issueDate: new Date() },
                include: { items: true },
            });
            await tx.auditLog.create({
                data: { actorUserId: actor.userId, action: 'STOCK_ADJUSTED', entityType: 'MaterialIssue', entityId: id },
            });
            const notify = await this.notificationForIssue(tx, id, client_1.NotificationType.MATERIAL_ISSUED);
            return { updated, notify };
        }, { isolationLevel: client_1.Prisma.TransactionIsolationLevel.Serializable });
        this.notifications.emitCreated(payload.notify);
        this.realtime.emitToRoom(`warehouse:${payload.updated.warehouseId}`, 'material:issue-updated', payload.updated);
        return payload.updated;
    }
    async cancelIssue(id, actor) {
        const issue = await this.findIssue(id, actor);
        const cancellableStatuses = [client_1.MaterialIssueStatus.PENDING, client_1.MaterialIssueStatus.APPROVED];
        if (!cancellableStatuses.includes(issue.status)) {
            throw (0, error_util_1.conflict)('MATERIAL_ISSUE_ALREADY_PROCESSED', 'Issue already processed');
        }
        return this.prisma.materialIssue.update({ where: { id }, data: { status: client_1.MaterialIssueStatus.CANCELLED } });
    }
    createTransfer(dto, actor) {
        if (dto.sourceWarehouseId === dto.targetWarehouseId)
            throw (0, error_util_1.badRequest)('TRANSFER_SAME_WAREHOUSE', 'Source and target warehouse must be different');
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
    findTransfers(actor) {
        const ids = this.warehouses.visibleWarehouseIds(actor);
        return this.prisma.stockTransfer.findMany({
            where: ids ? { OR: [{ sourceWarehouseId: { in: ids } }, { targetWarehouseId: { in: ids } }] } : {},
            include: { items: true },
            orderBy: { createdAt: 'desc' },
        });
    }
    async approveTransfer(id, actor) {
        const transfer = await this.prisma.stockTransfer.findUnique({ where: { id } });
        if (!transfer)
            throw (0, error_util_1.notFound)('STOCK_TRANSFER_NOT_FOUND', 'Stock transfer not found');
        this.warehouses.assertWarehouseAccess(actor, transfer.sourceWarehouseId);
        if (transfer.status !== client_1.StockTransferStatus.PENDING)
            throw (0, error_util_1.conflict)('STOCK_TRANSFER_ALREADY_PROCESSED', 'Transfer already processed');
        const updated = await this.prisma.stockTransfer.update({
            where: { id },
            data: { status: client_1.StockTransferStatus.APPROVED, approvedById: actor.userId },
            include: { items: true },
        });
        this.realtime.emitToRoom(`warehouse:${updated.sourceWarehouseId}`, 'warehouse:stock-updated', updated);
        return updated;
    }
    async shipTransfer(id, actor) {
        const updated = await this.prisma.$transaction(async (tx) => {
            const transfer = await tx.stockTransfer.findUnique({ where: { id }, include: { items: true } });
            if (!transfer)
                throw (0, error_util_1.notFound)('STOCK_TRANSFER_NOT_FOUND', 'Stock transfer not found');
            this.warehouses.assertWarehouseAccess(actor, transfer.sourceWarehouseId);
            if (transfer.status !== client_1.StockTransferStatus.APPROVED)
                throw (0, error_util_1.conflict)('STOCK_TRANSFER_NOT_APPROVED', 'Transfer must be approved before shipping');
            for (const item of transfer.items) {
                await this.applyStockChange(tx, {
                    warehouseId: transfer.sourceWarehouseId,
                    materialId: item.materialId,
                    quantity: Number(item.quantity),
                    type: client_1.StockTransactionType.TRANSFER_OUT,
                    actorUserId: actor.userId,
                    referenceType: 'StockTransfer',
                    referenceId: id,
                });
            }
            const result = await tx.stockTransfer.update({
                where: { id },
                data: { status: client_1.StockTransferStatus.IN_TRANSIT, shippedById: actor.userId, shippedAt: new Date() },
                include: { items: true },
            });
            await tx.auditLog.create({
                data: { actorUserId: actor.userId, action: 'STOCK_TRANSFER_SHIPPED', entityType: 'StockTransfer', entityId: id },
            });
            return result;
        }, { isolationLevel: client_1.Prisma.TransactionIsolationLevel.Serializable });
        this.realtime.emitToRoom(`warehouse:${updated.sourceWarehouseId}`, 'warehouse:stock-updated', updated);
        return updated;
    }
    async receiveTransfer(id, actor) {
        const updated = await this.prisma.$transaction(async (tx) => {
            const transfer = await tx.stockTransfer.findUnique({ where: { id }, include: { items: true } });
            if (!transfer)
                throw (0, error_util_1.notFound)('STOCK_TRANSFER_NOT_FOUND', 'Stock transfer not found');
            this.warehouses.assertWarehouseAccess(actor, transfer.targetWarehouseId);
            if (transfer.status !== client_1.StockTransferStatus.IN_TRANSIT)
                throw (0, error_util_1.conflict)('STOCK_TRANSFER_NOT_IN_TRANSIT', 'Transfer is not in transit');
            for (const item of transfer.items) {
                await this.applyStockChange(tx, {
                    warehouseId: transfer.targetWarehouseId,
                    materialId: item.materialId,
                    quantity: Number(item.quantity),
                    type: client_1.StockTransactionType.TRANSFER_IN,
                    actorUserId: actor.userId,
                    referenceType: 'StockTransfer',
                    referenceId: id,
                });
            }
            const result = await tx.stockTransfer.update({
                where: { id },
                data: { status: client_1.StockTransferStatus.COMPLETED, receivedById: actor.userId, receivedAt: new Date() },
                include: { items: true },
            });
            await tx.auditLog.create({
                data: { actorUserId: actor.userId, action: 'STOCK_TRANSFER_RECEIVED', entityType: 'StockTransfer', entityId: id },
            });
            return result;
        }, { isolationLevel: client_1.Prisma.TransactionIsolationLevel.Serializable });
        this.realtime.emitToRoom(`warehouse:${updated.targetWarehouseId}`, 'warehouse:stock-updated', updated);
        return updated;
    }
    async cancelTransfer(id, actor) {
        const transfer = await this.prisma.stockTransfer.findUnique({ where: { id } });
        if (!transfer)
            throw (0, error_util_1.notFound)('STOCK_TRANSFER_NOT_FOUND', 'Stock transfer not found');
        this.warehouses.assertWarehouseAccess(actor, transfer.sourceWarehouseId);
        const cancellableTransferStatuses = [client_1.StockTransferStatus.PENDING, client_1.StockTransferStatus.APPROVED];
        if (!cancellableTransferStatuses.includes(transfer.status)) {
            throw (0, error_util_1.conflict)('STOCK_TRANSFER_ALREADY_PROCESSED', 'Transfer already processed');
        }
        return this.prisma.stockTransfer.update({ where: { id }, data: { status: client_1.StockTransferStatus.CANCELLED } });
    }
    async applyStockChange(tx, input) {
        if (input.quantity <= 0)
            throw (0, error_util_1.badRequest)('INVALID_STOCK_QUANTITY', 'Quantity must be positive');
        const decreaseTypes = [
            client_1.StockTransactionType.EXPORT,
            client_1.StockTransactionType.ISSUE,
            client_1.StockTransactionType.TRANSFER_OUT,
            client_1.StockTransactionType.ADJUSTMENT_DECREASE,
        ];
        const isDecrease = decreaseTypes.includes(input.type);
        const stock = await tx.warehouseStock.upsert({
            where: { warehouseId_materialId: { warehouseId: input.warehouseId, materialId: input.materialId } },
            update: {},
            create: { warehouseId: input.warehouseId, materialId: input.materialId, quantityOnHand: 0, quantityReserved: 0 },
        });
        const before = Number(stock.quantityOnHand);
        const after = isDecrease ? before - input.quantity : before + input.quantity;
        if (isDecrease && after < 0)
            throw (0, error_util_1.badRequest)('INSUFFICIENT_STOCK', 'Insufficient stock');
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
        if (updated.count !== 1)
            throw (0, error_util_1.badRequest)('INSUFFICIENT_STOCK', 'Insufficient stock');
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
    assertCanReadIssue(issue, actor) {
        if (this.warehouses.canAccessWarehouse(actor, issue.warehouseId))
            return;
        if (issue.issuedToUserId === actor.userId)
            return;
        if (issue.issuedToDepartmentId)
            this.departments.assertDepartmentAccess(actor, issue.issuedToDepartmentId);
        else
            throw (0, error_util_1.forbidden)('MATERIAL_ISSUE_FORBIDDEN', 'Cannot access this material issue');
    }
    async notificationForIssue(tx, issueId, type) {
        const issue = await tx.materialIssue.findUnique({ where: { id: issueId } });
        if (!issue)
            return null;
        const userIds = [issue.requestedById, issue.issuedToUserId].filter(Boolean);
        if (issue.issuedToDepartmentId) {
            const department = await tx.department.findUnique({ where: { id: issue.issuedToDepartmentId }, select: { leaderUserId: true } });
            if (department?.leaderUserId)
                userIds.push(department.leaderUserId);
        }
        return this.notifications.createForUsers(tx, userIds, {
            type,
            title: 'Material issue updated',
            body: issue.issueCode,
            metadata: { issueId },
        });
    }
};
exports.StockService = StockService;
exports.StockService = StockService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        warehouse_scope_service_1.WarehouseScopeService,
        department_scope_service_1.DepartmentScopeService,
        notifications_service_1.NotificationsService,
        realtime_events_service_1.RealtimeEventsService])
], StockService);
//# sourceMappingURL=stock.service.js.map