-- CreateEnum
CREATE TYPE "StockTransactionType" AS ENUM ('IMPORT', 'EXPORT', 'ISSUE', 'RETURN', 'TRANSFER_IN', 'TRANSFER_OUT', 'ADJUSTMENT_INCREASE', 'ADJUSTMENT_DECREASE');

-- CreateEnum
CREATE TYPE "StockReceiptStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MaterialIssueTargetType" AS ENUM ('USER', 'DEPARTMENT');

-- CreateEnum
CREATE TYPE "MaterialIssueStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'ISSUING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MaterialReturnStatus" AS ENUM ('PENDING', 'RECEIVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "StockTransferStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'SHIPPED', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('IN_STOCK', 'ASSIGNED', 'IN_USE', 'MAINTENANCE', 'LOST', 'DAMAGED', 'DISPOSED', 'TRANSFER_PENDING');

-- CreateEnum
CREATE TYPE "AssetConditionStatus" AS ENUM ('NEW', 'GOOD', 'FAIR', 'POOR', 'DAMAGED');

-- CreateEnum
CREATE TYPE "AssetAssignmentStatus" AS ENUM ('PENDING_CONFIRMATION', 'ACTIVE', 'RETURN_REQUESTED', 'RETURNED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AssetAssignmentAction" AS ENUM ('CREATED', 'CONFIRMED', 'RETURN_REQUESTED', 'RETURNED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AssetIncidentType" AS ENUM ('DAMAGED', 'LOST', 'STOLEN', 'MALFUNCTION', 'OTHER');

-- CreateEnum
CREATE TYPE "AssetIncidentStatus" AS ENUM ('OPEN', 'INVESTIGATING', 'RESOLVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AssetMaintenanceStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InventoryCheckStatus" AS ENUM ('DRAFT', 'IN_PROGRESS', 'SUBMITTED', 'APPROVED', 'CANCELLED');

CREATE SEQUENCE IF NOT EXISTS warehouse_code_seq START 1;
CREATE SEQUENCE IF NOT EXISTS material_code_seq START 1;
CREATE SEQUENCE IF NOT EXISTS stock_transaction_code_seq START 1;
CREATE SEQUENCE IF NOT EXISTS stock_receipt_code_seq START 1;
CREATE SEQUENCE IF NOT EXISTS material_issue_code_seq START 1;
CREATE SEQUENCE IF NOT EXISTS material_return_code_seq START 1;
CREATE SEQUENCE IF NOT EXISTS stock_transfer_code_seq START 1;
CREATE SEQUENCE IF NOT EXISTS asset_code_seq START 1;
CREATE SEQUENCE IF NOT EXISTS inventory_check_code_seq START 1;

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'MATERIAL_ISSUE_REQUESTED';
ALTER TYPE "NotificationType" ADD VALUE 'MATERIAL_ISSUE_APPROVED';
ALTER TYPE "NotificationType" ADD VALUE 'MATERIAL_ISSUED';
ALTER TYPE "NotificationType" ADD VALUE 'STOCK_TRANSFER_APPROVED';
ALTER TYPE "NotificationType" ADD VALUE 'STOCK_TRANSFER_SHIPPED';
ALTER TYPE "NotificationType" ADD VALUE 'STOCK_TRANSFER_RECEIVED';
ALTER TYPE "NotificationType" ADD VALUE 'ASSET_ASSIGNED';
ALTER TYPE "NotificationType" ADD VALUE 'ASSET_ASSIGNMENT_CONFIRMED';
ALTER TYPE "NotificationType" ADD VALUE 'ASSET_RETURN_REQUESTED';
ALTER TYPE "NotificationType" ADD VALUE 'ASSET_RETURNED';
ALTER TYPE "NotificationType" ADD VALUE 'ASSET_INCIDENT_REPORTED';
ALTER TYPE "NotificationType" ADD VALUE 'ASSET_INCIDENT_RESOLVED';

-- AlterEnum
ALTER TYPE "RoleScopeType" ADD VALUE 'WAREHOUSE';

-- CreateTable
CREATE TABLE "warehouses" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "branchId" UUID,
    "departmentId" UUID,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "address" TEXT,
    "managerUserId" UUID,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "warehouses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "material_categories" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "material_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "materials" (
    "id" UUID NOT NULL,
    "categoryId" UUID NOT NULL,
    "materialCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "unit" TEXT NOT NULL,
    "minimumStock" DECIMAL(14,3) NOT NULL DEFAULT 0,
    "maximumStock" DECIMAL(14,3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warehouse_stocks" (
    "id" UUID NOT NULL,
    "warehouseId" UUID NOT NULL,
    "materialId" UUID NOT NULL,
    "quantityOnHand" DECIMAL(14,3) NOT NULL DEFAULT 0,
    "quantityReserved" DECIMAL(14,3) NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "warehouse_stocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_transactions" (
    "id" UUID NOT NULL,
    "transactionCode" TEXT NOT NULL,
    "warehouseId" UUID NOT NULL,
    "materialId" UUID NOT NULL,
    "transactionType" "StockTransactionType" NOT NULL,
    "quantity" DECIMAL(14,3) NOT NULL,
    "quantityBefore" DECIMAL(14,3) NOT NULL,
    "quantityAfter" DECIMAL(14,3) NOT NULL,
    "unitCost" DECIMAL(14,2),
    "referenceType" TEXT,
    "referenceId" UUID,
    "note" TEXT,
    "performedById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_receipts" (
    "id" UUID NOT NULL,
    "receiptCode" TEXT NOT NULL,
    "warehouseId" UUID NOT NULL,
    "supplierName" TEXT,
    "referenceNumber" TEXT,
    "receiptDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "StockReceiptStatus" NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "createdById" UUID NOT NULL,
    "approvedById" UUID,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_receipt_items" (
    "id" UUID NOT NULL,
    "receiptId" UUID NOT NULL,
    "materialId" UUID NOT NULL,
    "quantity" DECIMAL(14,3) NOT NULL,
    "unitCost" DECIMAL(14,2),
    "note" TEXT,

    CONSTRAINT "stock_receipt_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "material_issues" (
    "id" UUID NOT NULL,
    "issueCode" TEXT NOT NULL,
    "warehouseId" UUID NOT NULL,
    "issueTargetType" "MaterialIssueTargetType" NOT NULL,
    "issuedToUserId" UUID,
    "issuedToDepartmentId" UUID,
    "status" "MaterialIssueStatus" NOT NULL DEFAULT 'PENDING',
    "requestedById" UUID,
    "approvedById" UUID,
    "issuedById" UUID,
    "issueDate" TIMESTAMP(3),
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "material_issues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "material_issue_items" (
    "id" UUID NOT NULL,
    "materialIssueId" UUID NOT NULL,
    "materialId" UUID NOT NULL,
    "quantityRequested" DECIMAL(14,3) NOT NULL,
    "quantityApproved" DECIMAL(14,3) NOT NULL DEFAULT 0,
    "quantityIssued" DECIMAL(14,3) NOT NULL DEFAULT 0,
    "note" TEXT,

    CONSTRAINT "material_issue_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "material_returns" (
    "id" UUID NOT NULL,
    "returnCode" TEXT NOT NULL,
    "warehouseId" UUID NOT NULL,
    "returnedByUserId" UUID,
    "returnedByDepartmentId" UUID,
    "status" "MaterialReturnStatus" NOT NULL DEFAULT 'PENDING',
    "receivedById" UUID,
    "receivedAt" TIMESTAMP(3),
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "material_returns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "material_return_items" (
    "id" UUID NOT NULL,
    "materialReturnId" UUID NOT NULL,
    "materialId" UUID NOT NULL,
    "quantity" DECIMAL(14,3) NOT NULL,
    "conditionNote" TEXT,

    CONSTRAINT "material_return_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_transfers" (
    "id" UUID NOT NULL,
    "transferCode" TEXT NOT NULL,
    "sourceWarehouseId" UUID NOT NULL,
    "targetWarehouseId" UUID NOT NULL,
    "status" "StockTransferStatus" NOT NULL DEFAULT 'PENDING',
    "requestedById" UUID NOT NULL,
    "approvedById" UUID,
    "shippedById" UUID,
    "receivedById" UUID,
    "shippedAt" TIMESTAMP(3),
    "receivedAt" TIMESTAMP(3),
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_transfers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_transfer_items" (
    "id" UUID NOT NULL,
    "transferId" UUID NOT NULL,
    "materialId" UUID NOT NULL,
    "quantity" DECIMAL(14,3) NOT NULL,

    CONSTRAINT "stock_transfer_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_categories" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "asset_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assets" (
    "id" UUID NOT NULL,
    "assetCode" TEXT NOT NULL,
    "categoryId" UUID NOT NULL,
    "warehouseId" UUID,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "model" TEXT,
    "serialNumber" TEXT,
    "purchaseDate" TIMESTAMP(3),
    "purchasePrice" DECIMAL(14,2),
    "warrantyEndDate" TIMESTAMP(3),
    "conditionStatus" "AssetConditionStatus" NOT NULL DEFAULT 'GOOD',
    "assetStatus" "AssetStatus" NOT NULL DEFAULT 'IN_STOCK',
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_assignments" (
    "id" UUID NOT NULL,
    "assetId" UUID NOT NULL,
    "assignedToUserId" UUID,
    "assignedToDepartmentId" UUID,
    "assignedById" UUID NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expectedReturnAt" TIMESTAMP(3),
    "returnedAt" TIMESTAMP(3),
    "conditionWhenAssigned" "AssetConditionStatus" NOT NULL,
    "conditionWhenReturned" "AssetConditionStatus",
    "status" "AssetAssignmentStatus" NOT NULL DEFAULT 'PENDING_CONFIRMATION',
    "receiverConfirmedAt" TIMESTAMP(3),
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asset_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_assignment_histories" (
    "id" UUID NOT NULL,
    "assetAssignmentId" UUID NOT NULL,
    "action" "AssetAssignmentAction" NOT NULL,
    "performedById" UUID NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asset_assignment_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_incident_reports" (
    "id" UUID NOT NULL,
    "assetId" UUID NOT NULL,
    "reportedById" UUID NOT NULL,
    "incidentType" "AssetIncidentType" NOT NULL,
    "description" TEXT NOT NULL,
    "evidenceUrl" TEXT,
    "status" "AssetIncidentStatus" NOT NULL DEFAULT 'OPEN',
    "resolvedById" UUID,
    "resolvedAt" TIMESTAMP(3),
    "resolutionNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asset_incident_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_maintenance_records" (
    "id" UUID NOT NULL,
    "assetId" UUID NOT NULL,
    "maintenanceType" TEXT NOT NULL,
    "vendorName" TEXT,
    "description" TEXT NOT NULL,
    "cost" DECIMAL(14,2),
    "startedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "status" "AssetMaintenanceStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asset_maintenance_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_checks" (
    "id" UUID NOT NULL,
    "warehouseId" UUID NOT NULL,
    "checkCode" TEXT NOT NULL,
    "status" "InventoryCheckStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdById" UUID NOT NULL,
    "approvedById" UUID,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_check_items" (
    "id" UUID NOT NULL,
    "inventoryCheckId" UUID NOT NULL,
    "materialId" UUID,
    "assetId" UUID,
    "systemQuantity" DECIMAL(14,3),
    "actualQuantity" DECIMAL(14,3),
    "differenceQuantity" DECIMAL(14,3),
    "expectedAssetStatus" "AssetStatus",
    "actualAssetStatus" "AssetStatus",
    "note" TEXT,

    CONSTRAINT "inventory_check_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "warehouses_code_key" ON "warehouses"("code");

-- CreateIndex
CREATE INDEX "warehouses_companyId_isActive_idx" ON "warehouses"("companyId", "isActive");

-- CreateIndex
CREATE INDEX "warehouses_departmentId_idx" ON "warehouses"("departmentId");

-- CreateIndex
CREATE UNIQUE INDEX "material_categories_code_key" ON "material_categories"("code");

-- CreateIndex
CREATE UNIQUE INDEX "materials_materialCode_key" ON "materials"("materialCode");

-- CreateIndex
CREATE INDEX "materials_categoryId_isActive_idx" ON "materials"("categoryId", "isActive");

-- CreateIndex
CREATE INDEX "warehouse_stocks_materialId_idx" ON "warehouse_stocks"("materialId");

-- CreateIndex
CREATE UNIQUE INDEX "warehouse_stocks_warehouseId_materialId_key" ON "warehouse_stocks"("warehouseId", "materialId");

-- CreateIndex
CREATE UNIQUE INDEX "stock_transactions_transactionCode_key" ON "stock_transactions"("transactionCode");

-- CreateIndex
CREATE INDEX "stock_transactions_warehouseId_createdAt_idx" ON "stock_transactions"("warehouseId", "createdAt");

-- CreateIndex
CREATE INDEX "stock_transactions_materialId_createdAt_idx" ON "stock_transactions"("materialId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "stock_receipts_receiptCode_key" ON "stock_receipts"("receiptCode");

-- CreateIndex
CREATE INDEX "stock_receipts_warehouseId_status_idx" ON "stock_receipts"("warehouseId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "material_issues_issueCode_key" ON "material_issues"("issueCode");

-- CreateIndex
CREATE INDEX "material_issues_warehouseId_status_idx" ON "material_issues"("warehouseId", "status");

-- CreateIndex
CREATE INDEX "material_issues_issuedToUserId_idx" ON "material_issues"("issuedToUserId");

-- CreateIndex
CREATE INDEX "material_issues_issuedToDepartmentId_status_idx" ON "material_issues"("issuedToDepartmentId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "material_returns_returnCode_key" ON "material_returns"("returnCode");

-- CreateIndex
CREATE INDEX "material_returns_warehouseId_status_idx" ON "material_returns"("warehouseId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "stock_transfers_transferCode_key" ON "stock_transfers"("transferCode");

-- CreateIndex
CREATE INDEX "stock_transfers_sourceWarehouseId_status_idx" ON "stock_transfers"("sourceWarehouseId", "status");

-- CreateIndex
CREATE INDEX "stock_transfers_targetWarehouseId_status_idx" ON "stock_transfers"("targetWarehouseId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "asset_categories_code_key" ON "asset_categories"("code");

-- CreateIndex
CREATE UNIQUE INDEX "assets_assetCode_key" ON "assets"("assetCode");

-- CreateIndex
CREATE UNIQUE INDEX "assets_serialNumber_key" ON "assets"("serialNumber");

-- CreateIndex
CREATE INDEX "assets_warehouseId_assetStatus_idx" ON "assets"("warehouseId", "assetStatus");

-- CreateIndex
CREATE INDEX "assets_assetStatus_idx" ON "assets"("assetStatus");

-- CreateIndex
CREATE INDEX "asset_assignments_assignedToUserId_status_idx" ON "asset_assignments"("assignedToUserId", "status");

-- CreateIndex
CREATE INDEX "asset_assignments_assignedToDepartmentId_status_idx" ON "asset_assignments"("assignedToDepartmentId", "status");

-- CreateIndex
CREATE INDEX "asset_assignments_assetId_status_idx" ON "asset_assignments"("assetId", "status");

-- CreateIndex
CREATE INDEX "asset_incident_reports_status_createdAt_idx" ON "asset_incident_reports"("status", "createdAt");

-- CreateIndex
CREATE INDEX "asset_incident_reports_assetId_status_idx" ON "asset_incident_reports"("assetId", "status");

-- CreateIndex
CREATE INDEX "asset_maintenance_records_assetId_status_idx" ON "asset_maintenance_records"("assetId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_checks_checkCode_key" ON "inventory_checks"("checkCode");

-- CreateIndex
CREATE INDEX "inventory_checks_warehouseId_status_idx" ON "inventory_checks"("warehouseId", "status");

-- CreateIndex
CREATE INDEX "inventory_check_items_inventoryCheckId_idx" ON "inventory_check_items"("inventoryCheckId");

-- AddForeignKey
ALTER TABLE "warehouses" ADD CONSTRAINT "warehouses_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouses" ADD CONSTRAINT "warehouses_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouses" ADD CONSTRAINT "warehouses_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouses" ADD CONSTRAINT "warehouses_managerUserId_fkey" FOREIGN KEY ("managerUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materials" ADD CONSTRAINT "materials_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "material_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouse_stocks" ADD CONSTRAINT "warehouse_stocks_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouse_stocks" ADD CONSTRAINT "warehouse_stocks_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transactions" ADD CONSTRAINT "stock_transactions_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transactions" ADD CONSTRAINT "stock_transactions_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transactions" ADD CONSTRAINT "stock_transactions_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_receipts" ADD CONSTRAINT "stock_receipts_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_receipts" ADD CONSTRAINT "stock_receipts_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_receipts" ADD CONSTRAINT "stock_receipts_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_receipt_items" ADD CONSTRAINT "stock_receipt_items_receiptId_fkey" FOREIGN KEY ("receiptId") REFERENCES "stock_receipts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_receipt_items" ADD CONSTRAINT "stock_receipt_items_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_issues" ADD CONSTRAINT "material_issues_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_issues" ADD CONSTRAINT "material_issues_issuedToUserId_fkey" FOREIGN KEY ("issuedToUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_issues" ADD CONSTRAINT "material_issues_issuedToDepartmentId_fkey" FOREIGN KEY ("issuedToDepartmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_issues" ADD CONSTRAINT "material_issues_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_issues" ADD CONSTRAINT "material_issues_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_issues" ADD CONSTRAINT "material_issues_issuedById_fkey" FOREIGN KEY ("issuedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_issue_items" ADD CONSTRAINT "material_issue_items_materialIssueId_fkey" FOREIGN KEY ("materialIssueId") REFERENCES "material_issues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_issue_items" ADD CONSTRAINT "material_issue_items_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_returns" ADD CONSTRAINT "material_returns_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_returns" ADD CONSTRAINT "material_returns_returnedByUserId_fkey" FOREIGN KEY ("returnedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_returns" ADD CONSTRAINT "material_returns_returnedByDepartmentId_fkey" FOREIGN KEY ("returnedByDepartmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_returns" ADD CONSTRAINT "material_returns_receivedById_fkey" FOREIGN KEY ("receivedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_return_items" ADD CONSTRAINT "material_return_items_materialReturnId_fkey" FOREIGN KEY ("materialReturnId") REFERENCES "material_returns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_return_items" ADD CONSTRAINT "material_return_items_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_sourceWarehouseId_fkey" FOREIGN KEY ("sourceWarehouseId") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_targetWarehouseId_fkey" FOREIGN KEY ("targetWarehouseId") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_shippedById_fkey" FOREIGN KEY ("shippedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_receivedById_fkey" FOREIGN KEY ("receivedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transfer_items" ADD CONSTRAINT "stock_transfer_items_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "stock_transfers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transfer_items" ADD CONSTRAINT "stock_transfer_items_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "asset_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_assignments" ADD CONSTRAINT "asset_assignments_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_assignments" ADD CONSTRAINT "asset_assignments_assignedToUserId_fkey" FOREIGN KEY ("assignedToUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_assignments" ADD CONSTRAINT "asset_assignments_assignedToDepartmentId_fkey" FOREIGN KEY ("assignedToDepartmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_assignments" ADD CONSTRAINT "asset_assignments_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_assignment_histories" ADD CONSTRAINT "asset_assignment_histories_assetAssignmentId_fkey" FOREIGN KEY ("assetAssignmentId") REFERENCES "asset_assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_assignment_histories" ADD CONSTRAINT "asset_assignment_histories_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_incident_reports" ADD CONSTRAINT "asset_incident_reports_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_incident_reports" ADD CONSTRAINT "asset_incident_reports_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_incident_reports" ADD CONSTRAINT "asset_incident_reports_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_maintenance_records" ADD CONSTRAINT "asset_maintenance_records_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_maintenance_records" ADD CONSTRAINT "asset_maintenance_records_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_checks" ADD CONSTRAINT "inventory_checks_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_checks" ADD CONSTRAINT "inventory_checks_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_checks" ADD CONSTRAINT "inventory_checks_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_check_items" ADD CONSTRAINT "inventory_check_items_inventoryCheckId_fkey" FOREIGN KEY ("inventoryCheckId") REFERENCES "inventory_checks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_check_items" ADD CONSTRAINT "inventory_check_items_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_check_items" ADD CONSTRAINT "inventory_check_items_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "warehouse_stocks" ADD CONSTRAINT "warehouse_stocks_non_negative_chk" CHECK ("quantityOnHand" >= 0 AND "quantityReserved" >= 0 AND "quantityOnHand" >= "quantityReserved");
ALTER TABLE "stock_transactions" ADD CONSTRAINT "stock_transactions_positive_quantity_chk" CHECK ("quantity" > 0);
ALTER TABLE "stock_receipt_items" ADD CONSTRAINT "stock_receipt_items_positive_quantity_chk" CHECK ("quantity" > 0);
ALTER TABLE "material_issue_items" ADD CONSTRAINT "material_issue_items_non_negative_quantity_chk" CHECK ("quantityRequested" > 0 AND "quantityApproved" >= 0 AND "quantityIssued" >= 0);
ALTER TABLE "material_return_items" ADD CONSTRAINT "material_return_items_positive_quantity_chk" CHECK ("quantity" > 0);
ALTER TABLE "stock_transfer_items" ADD CONSTRAINT "stock_transfer_items_positive_quantity_chk" CHECK ("quantity" > 0);
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_distinct_warehouses_chk" CHECK ("sourceWarehouseId" <> "targetWarehouseId");
ALTER TABLE "material_issues" ADD CONSTRAINT "material_issues_exactly_one_target_chk" CHECK (
  ("issueTargetType" = 'USER' AND "issuedToUserId" IS NOT NULL AND "issuedToDepartmentId" IS NULL)
  OR ("issueTargetType" = 'DEPARTMENT' AND "issuedToDepartmentId" IS NOT NULL AND "issuedToUserId" IS NULL)
);
ALTER TABLE "asset_assignments" ADD CONSTRAINT "asset_assignments_exactly_one_target_chk" CHECK (
  ("assignedToUserId" IS NOT NULL AND "assignedToDepartmentId" IS NULL)
  OR ("assignedToDepartmentId" IS NOT NULL AND "assignedToUserId" IS NULL)
);
ALTER TABLE "inventory_check_items" ADD CONSTRAINT "inventory_check_items_exactly_one_target_chk" CHECK (
  ("materialId" IS NOT NULL AND "assetId" IS NULL)
  OR ("assetId" IS NOT NULL AND "materialId" IS NULL)
);

CREATE UNIQUE INDEX "asset_assignments_one_active_per_asset_idx"
ON "asset_assignments"("assetId")
WHERE "status" IN ('PENDING_CONFIRMATION', 'ACTIVE', 'RETURN_REQUESTED');

CREATE OR REPLACE FUNCTION prevent_stock_transaction_mutation()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'stock_transactions are immutable after commit';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER stock_transactions_no_update
BEFORE UPDATE ON "stock_transactions"
FOR EACH ROW EXECUTE FUNCTION prevent_stock_transaction_mutation();

CREATE TRIGGER stock_transactions_no_delete
BEFORE DELETE ON "stock_transactions"
FOR EACH ROW EXECUTE FUNCTION prevent_stock_transaction_mutation();

