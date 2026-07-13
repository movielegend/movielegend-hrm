import { Prisma, StockTransactionType } from '@prisma/client';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { DepartmentScopeService } from '../phase2-policy/department-scope.service';
import { RealtimeEventsService } from '../realtime/realtime-events.service';
import { WarehouseScopeService } from '../warehouse/warehouse-scope.service';
import { CreateMaterialIssueDto, CreateStockReceiptDto, CreateStockTransferDto, RejectDto } from './dto/stock.dto';
export declare class StockService {
    private readonly prisma;
    private readonly warehouses;
    private readonly departments;
    private readonly notifications;
    private readonly realtime;
    constructor(prisma: PrismaService, warehouses: WarehouseScopeService, departments: DepartmentScopeService, notifications: NotificationsService, realtime: RealtimeEventsService);
    createReceipt(dto: CreateStockReceiptDto, actor: AuthenticatedUser): Promise<{
        items: {
            id: string;
            note: string | null;
            materialId: string;
            quantity: Prisma.Decimal;
            unitCost: Prisma.Decimal | null;
            receiptId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdById: string;
        status: import("@prisma/client").$Enums.StockReceiptStatus;
        note: string | null;
        approvedAt: Date | null;
        approvedById: string | null;
        warehouseId: string;
        supplierName: string | null;
        referenceNumber: string | null;
        receiptDate: Date;
        receiptCode: string;
    }>;
    findReceipts(actor: AuthenticatedUser): Prisma.PrismaPromise<({
        warehouse: {
            id: string;
            companyId: string;
            branchId: string | null;
            code: string;
            name: string;
            description: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            departmentId: string | null;
            address: string | null;
            managerUserId: string | null;
        };
        items: {
            id: string;
            note: string | null;
            materialId: string;
            quantity: Prisma.Decimal;
            unitCost: Prisma.Decimal | null;
            receiptId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdById: string;
        status: import("@prisma/client").$Enums.StockReceiptStatus;
        note: string | null;
        approvedAt: Date | null;
        approvedById: string | null;
        warehouseId: string;
        supplierName: string | null;
        referenceNumber: string | null;
        receiptDate: Date;
        receiptCode: string;
    })[]>;
    findReceipt(id: string, actor: AuthenticatedUser): Promise<{
        items: {
            id: string;
            note: string | null;
            materialId: string;
            quantity: Prisma.Decimal;
            unitCost: Prisma.Decimal | null;
            receiptId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdById: string;
        status: import("@prisma/client").$Enums.StockReceiptStatus;
        note: string | null;
        approvedAt: Date | null;
        approvedById: string | null;
        warehouseId: string;
        supplierName: string | null;
        referenceNumber: string | null;
        receiptDate: Date;
        receiptCode: string;
    }>;
    approveReceipt(id: string, actor: AuthenticatedUser): Promise<{
        items: {
            id: string;
            note: string | null;
            materialId: string;
            quantity: Prisma.Decimal;
            unitCost: Prisma.Decimal | null;
            receiptId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdById: string;
        status: import("@prisma/client").$Enums.StockReceiptStatus;
        note: string | null;
        approvedAt: Date | null;
        approvedById: string | null;
        warehouseId: string;
        supplierName: string | null;
        referenceNumber: string | null;
        receiptDate: Date;
        receiptCode: string;
    }>;
    cancelReceipt(id: string, actor: AuthenticatedUser): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdById: string;
        status: import("@prisma/client").$Enums.StockReceiptStatus;
        note: string | null;
        approvedAt: Date | null;
        approvedById: string | null;
        warehouseId: string;
        supplierName: string | null;
        referenceNumber: string | null;
        receiptDate: Date;
        receiptCode: string;
    }>;
    createIssue(dto: CreateMaterialIssueDto, actor: AuthenticatedUser): Promise<{
        items: {
            id: string;
            note: string | null;
            materialId: string;
            quantityRequested: Prisma.Decimal;
            quantityApproved: Prisma.Decimal;
            quantityIssued: Prisma.Decimal;
            materialIssueId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.MaterialIssueStatus;
        note: string | null;
        approvedById: string | null;
        warehouseId: string;
        issueDate: Date | null;
        issueTargetType: import("@prisma/client").$Enums.MaterialIssueTargetType;
        issuedToUserId: string | null;
        issuedToDepartmentId: string | null;
        issueCode: string;
        requestedById: string | null;
        issuedById: string | null;
    }>;
    findIssues(actor: AuthenticatedUser): Prisma.PrismaPromise<({
        items: {
            id: string;
            note: string | null;
            materialId: string;
            quantityRequested: Prisma.Decimal;
            quantityApproved: Prisma.Decimal;
            quantityIssued: Prisma.Decimal;
            materialIssueId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.MaterialIssueStatus;
        note: string | null;
        approvedById: string | null;
        warehouseId: string;
        issueDate: Date | null;
        issueTargetType: import("@prisma/client").$Enums.MaterialIssueTargetType;
        issuedToUserId: string | null;
        issuedToDepartmentId: string | null;
        issueCode: string;
        requestedById: string | null;
        issuedById: string | null;
    })[]>;
    findIssue(id: string, actor: AuthenticatedUser): Promise<{
        items: {
            id: string;
            note: string | null;
            materialId: string;
            quantityRequested: Prisma.Decimal;
            quantityApproved: Prisma.Decimal;
            quantityIssued: Prisma.Decimal;
            materialIssueId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.MaterialIssueStatus;
        note: string | null;
        approvedById: string | null;
        warehouseId: string;
        issueDate: Date | null;
        issueTargetType: import("@prisma/client").$Enums.MaterialIssueTargetType;
        issuedToUserId: string | null;
        issuedToDepartmentId: string | null;
        issueCode: string;
        requestedById: string | null;
        issuedById: string | null;
    }>;
    approveIssue(id: string, actor: AuthenticatedUser): Promise<{
        items: {
            id: string;
            note: string | null;
            materialId: string;
            quantityRequested: Prisma.Decimal;
            quantityApproved: Prisma.Decimal;
            quantityIssued: Prisma.Decimal;
            materialIssueId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.MaterialIssueStatus;
        note: string | null;
        approvedById: string | null;
        warehouseId: string;
        issueDate: Date | null;
        issueTargetType: import("@prisma/client").$Enums.MaterialIssueTargetType;
        issuedToUserId: string | null;
        issuedToDepartmentId: string | null;
        issueCode: string;
        requestedById: string | null;
        issuedById: string | null;
    }>;
    rejectIssue(id: string, dto: RejectDto, actor: AuthenticatedUser): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.MaterialIssueStatus;
        note: string | null;
        approvedById: string | null;
        warehouseId: string;
        issueDate: Date | null;
        issueTargetType: import("@prisma/client").$Enums.MaterialIssueTargetType;
        issuedToUserId: string | null;
        issuedToDepartmentId: string | null;
        issueCode: string;
        requestedById: string | null;
        issuedById: string | null;
    }>;
    issueMaterials(id: string, actor: AuthenticatedUser): Promise<{
        items: {
            id: string;
            note: string | null;
            materialId: string;
            quantityRequested: Prisma.Decimal;
            quantityApproved: Prisma.Decimal;
            quantityIssued: Prisma.Decimal;
            materialIssueId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.MaterialIssueStatus;
        note: string | null;
        approvedById: string | null;
        warehouseId: string;
        issueDate: Date | null;
        issueTargetType: import("@prisma/client").$Enums.MaterialIssueTargetType;
        issuedToUserId: string | null;
        issuedToDepartmentId: string | null;
        issueCode: string;
        requestedById: string | null;
        issuedById: string | null;
    }>;
    cancelIssue(id: string, actor: AuthenticatedUser): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.MaterialIssueStatus;
        note: string | null;
        approvedById: string | null;
        warehouseId: string;
        issueDate: Date | null;
        issueTargetType: import("@prisma/client").$Enums.MaterialIssueTargetType;
        issuedToUserId: string | null;
        issuedToDepartmentId: string | null;
        issueCode: string;
        requestedById: string | null;
        issuedById: string | null;
    }>;
    createTransfer(dto: CreateStockTransferDto, actor: AuthenticatedUser): Promise<{
        items: {
            id: string;
            materialId: string;
            quantity: Prisma.Decimal;
            transferId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.StockTransferStatus;
        note: string | null;
        approvedById: string | null;
        sourceWarehouseId: string;
        targetWarehouseId: string;
        requestedById: string;
        transferCode: string;
        shippedById: string | null;
        receivedById: string | null;
        shippedAt: Date | null;
        receivedAt: Date | null;
    }>;
    findTransfers(actor: AuthenticatedUser): Prisma.PrismaPromise<({
        items: {
            id: string;
            materialId: string;
            quantity: Prisma.Decimal;
            transferId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.StockTransferStatus;
        note: string | null;
        approvedById: string | null;
        sourceWarehouseId: string;
        targetWarehouseId: string;
        requestedById: string;
        transferCode: string;
        shippedById: string | null;
        receivedById: string | null;
        shippedAt: Date | null;
        receivedAt: Date | null;
    })[]>;
    approveTransfer(id: string, actor: AuthenticatedUser): Promise<{
        items: {
            id: string;
            materialId: string;
            quantity: Prisma.Decimal;
            transferId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.StockTransferStatus;
        note: string | null;
        approvedById: string | null;
        sourceWarehouseId: string;
        targetWarehouseId: string;
        requestedById: string;
        transferCode: string;
        shippedById: string | null;
        receivedById: string | null;
        shippedAt: Date | null;
        receivedAt: Date | null;
    }>;
    shipTransfer(id: string, actor: AuthenticatedUser): Promise<{
        items: {
            id: string;
            materialId: string;
            quantity: Prisma.Decimal;
            transferId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.StockTransferStatus;
        note: string | null;
        approvedById: string | null;
        sourceWarehouseId: string;
        targetWarehouseId: string;
        requestedById: string;
        transferCode: string;
        shippedById: string | null;
        receivedById: string | null;
        shippedAt: Date | null;
        receivedAt: Date | null;
    }>;
    receiveTransfer(id: string, actor: AuthenticatedUser): Promise<{
        items: {
            id: string;
            materialId: string;
            quantity: Prisma.Decimal;
            transferId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.StockTransferStatus;
        note: string | null;
        approvedById: string | null;
        sourceWarehouseId: string;
        targetWarehouseId: string;
        requestedById: string;
        transferCode: string;
        shippedById: string | null;
        receivedById: string | null;
        shippedAt: Date | null;
        receivedAt: Date | null;
    }>;
    cancelTransfer(id: string, actor: AuthenticatedUser): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.StockTransferStatus;
        note: string | null;
        approvedById: string | null;
        sourceWarehouseId: string;
        targetWarehouseId: string;
        requestedById: string;
        transferCode: string;
        shippedById: string | null;
        receivedById: string | null;
        shippedAt: Date | null;
        receivedAt: Date | null;
    }>;
    applyStockChange(tx: Prisma.TransactionClient, input: {
        warehouseId: string;
        materialId: string;
        quantity: number;
        type: StockTransactionType;
        actorUserId: string;
        referenceType?: string;
        referenceId?: string;
        unitCost?: number;
        note?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        note: string | null;
        warehouseId: string;
        materialId: string;
        performedById: string;
        referenceId: string | null;
        quantity: Prisma.Decimal;
        unitCost: Prisma.Decimal | null;
        transactionCode: string;
        transactionType: import("@prisma/client").$Enums.StockTransactionType;
        quantityBefore: Prisma.Decimal;
        quantityAfter: Prisma.Decimal;
        referenceType: string | null;
    }>;
    private assertCanReadIssue;
    private notificationForIssue;
}
