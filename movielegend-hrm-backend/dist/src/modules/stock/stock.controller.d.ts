import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { CreateMaterialIssueDto, CreateStockReceiptDto, CreateStockTransferDto, RejectDto } from './dto/stock.dto';
import { StockService } from './stock.service';
export declare class StockReceiptsController {
    private readonly stock;
    constructor(stock: StockService);
    create(dto: CreateStockReceiptDto, actor: AuthenticatedUser): Promise<{
        items: {
            id: string;
            note: string | null;
            materialId: string;
            quantity: import("@prisma/client/runtime/library").Decimal;
            unitCost: import("@prisma/client/runtime/library").Decimal | null;
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
    findAll(actor: AuthenticatedUser): import("@prisma/client").Prisma.PrismaPromise<({
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
            quantity: import("@prisma/client/runtime/library").Decimal;
            unitCost: import("@prisma/client/runtime/library").Decimal | null;
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
    findOne(id: string, actor: AuthenticatedUser): Promise<{
        items: {
            id: string;
            note: string | null;
            materialId: string;
            quantity: import("@prisma/client/runtime/library").Decimal;
            unitCost: import("@prisma/client/runtime/library").Decimal | null;
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
    approve(id: string, actor: AuthenticatedUser): Promise<{
        items: {
            id: string;
            note: string | null;
            materialId: string;
            quantity: import("@prisma/client/runtime/library").Decimal;
            unitCost: import("@prisma/client/runtime/library").Decimal | null;
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
    cancel(id: string, actor: AuthenticatedUser): Promise<{
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
}
export declare class MaterialIssuesController {
    private readonly stock;
    constructor(stock: StockService);
    create(dto: CreateMaterialIssueDto, actor: AuthenticatedUser): Promise<{
        items: {
            id: string;
            note: string | null;
            materialId: string;
            quantityRequested: import("@prisma/client/runtime/library").Decimal;
            quantityApproved: import("@prisma/client/runtime/library").Decimal;
            quantityIssued: import("@prisma/client/runtime/library").Decimal;
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
    findAll(actor: AuthenticatedUser): import("@prisma/client").Prisma.PrismaPromise<({
        items: {
            id: string;
            note: string | null;
            materialId: string;
            quantityRequested: import("@prisma/client/runtime/library").Decimal;
            quantityApproved: import("@prisma/client/runtime/library").Decimal;
            quantityIssued: import("@prisma/client/runtime/library").Decimal;
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
    findOne(id: string, actor: AuthenticatedUser): Promise<{
        items: {
            id: string;
            note: string | null;
            materialId: string;
            quantityRequested: import("@prisma/client/runtime/library").Decimal;
            quantityApproved: import("@prisma/client/runtime/library").Decimal;
            quantityIssued: import("@prisma/client/runtime/library").Decimal;
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
    approve(id: string, actor: AuthenticatedUser): Promise<{
        items: {
            id: string;
            note: string | null;
            materialId: string;
            quantityRequested: import("@prisma/client/runtime/library").Decimal;
            quantityApproved: import("@prisma/client/runtime/library").Decimal;
            quantityIssued: import("@prisma/client/runtime/library").Decimal;
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
    reject(id: string, dto: RejectDto, actor: AuthenticatedUser): Promise<{
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
    issue(id: string, actor: AuthenticatedUser): Promise<{
        items: {
            id: string;
            note: string | null;
            materialId: string;
            quantityRequested: import("@prisma/client/runtime/library").Decimal;
            quantityApproved: import("@prisma/client/runtime/library").Decimal;
            quantityIssued: import("@prisma/client/runtime/library").Decimal;
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
    cancel(id: string, actor: AuthenticatedUser): Promise<{
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
}
export declare class StockTransfersController {
    private readonly stock;
    constructor(stock: StockService);
    create(dto: CreateStockTransferDto, actor: AuthenticatedUser): Promise<{
        items: {
            id: string;
            materialId: string;
            quantity: import("@prisma/client/runtime/library").Decimal;
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
    findAll(actor: AuthenticatedUser): import("@prisma/client").Prisma.PrismaPromise<({
        items: {
            id: string;
            materialId: string;
            quantity: import("@prisma/client/runtime/library").Decimal;
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
    approve(id: string, actor: AuthenticatedUser): Promise<{
        items: {
            id: string;
            materialId: string;
            quantity: import("@prisma/client/runtime/library").Decimal;
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
    ship(id: string, actor: AuthenticatedUser): Promise<{
        items: {
            id: string;
            materialId: string;
            quantity: import("@prisma/client/runtime/library").Decimal;
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
    receive(id: string, actor: AuthenticatedUser): Promise<{
        items: {
            id: string;
            materialId: string;
            quantity: import("@prisma/client/runtime/library").Decimal;
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
    cancel(id: string, actor: AuthenticatedUser): Promise<{
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
}
