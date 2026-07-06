-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('DRAFT', 'PENDING_VERIFICATION', 'VERIFIED', 'REJECTED', 'EXPIRED', 'REPLACED');

-- CreateSequence
CREATE SEQUENCE IF NOT EXISTS contract_code_seq;

-- CreateEnum
CREATE TYPE "ContractType" AS ENUM ('PROBATION', 'FIXED_TERM', 'INDEFINITE_TERM', 'SERVICE', 'CONFIDENTIALITY', 'COMMITMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('DRAFT', 'PENDING_INTERNAL_APPROVAL', 'APPROVED', 'WAITING_EMPLOYEE_SIGNATURE', 'EMPLOYEE_SIGNED', 'WAITING_COMPANY_SIGNATURE', 'COMPLETED', 'ACTIVE', 'EXPIRED', 'TERMINATED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ContractSignerRole" AS ENUM ('EMPLOYEE', 'COMPANY');

-- CreateEnum
CREATE TYPE "SignatureType" AS ENUM ('DRAWN', 'UPLOADED', 'OTP_CONFIRMED', 'EXTERNAL_PROVIDER');

-- CreateEnum
CREATE TYPE "KpiPeriodType" AS ENUM ('MONTHLY', 'QUARTERLY', 'HALF_YEAR', 'YEARLY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "KpiScoringMethod" AS ENUM ('MANUAL', 'PERCENTAGE', 'TARGET_RATIO', 'BOOLEAN', 'TASK_BASED', 'CUSTOM');

-- CreateEnum
CREATE TYPE "EmployeeKpiAssignmentStatus" AS ENUM ('DRAFT', 'ACTIVE', 'SELF_REVIEW', 'LEADER_REVIEW', 'FINAL_REVIEW', 'FINALIZED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PerformanceReviewCycleStatus" AS ENUM ('DRAFT', 'OPEN', 'SELF_REVIEW', 'LEADER_REVIEW', 'FINAL_REVIEW', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PerformanceReviewStatus" AS ENUM ('PENDING', 'SELF_REVIEW', 'LEADER_REVIEW', 'FINAL_REVIEW', 'FINALIZED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ReviewerType" AS ENUM ('DIRECT_LEADER', 'SECOND_LEVEL', 'HR', 'ADMIN');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'DOCUMENT_EXPIRING';
ALTER TYPE "NotificationType" ADD VALUE 'DOCUMENT_VERIFICATION_REQUIRED';
ALTER TYPE "NotificationType" ADD VALUE 'DOCUMENT_VERIFIED';
ALTER TYPE "NotificationType" ADD VALUE 'DOCUMENT_REJECTED';
ALTER TYPE "NotificationType" ADD VALUE 'CONTRACT_APPROVAL_REQUIRED';
ALTER TYPE "NotificationType" ADD VALUE 'CONTRACT_APPROVED';
ALTER TYPE "NotificationType" ADD VALUE 'CONTRACT_SIGNATURE_REQUIRED';
ALTER TYPE "NotificationType" ADD VALUE 'CONTRACT_SIGNED';
ALTER TYPE "NotificationType" ADD VALUE 'CONTRACT_EXPIRING';
ALTER TYPE "NotificationType" ADD VALUE 'CONTRACT_TERMINATED';
ALTER TYPE "NotificationType" ADD VALUE 'KPI_ASSIGNED';
ALTER TYPE "NotificationType" ADD VALUE 'KPI_SELF_REVIEW_REQUIRED';
ALTER TYPE "NotificationType" ADD VALUE 'KPI_LEADER_REVIEW_REQUIRED';
ALTER TYPE "NotificationType" ADD VALUE 'KPI_FINALIZED';
ALTER TYPE "NotificationType" ADD VALUE 'PERFORMANCE_REVIEW_OPENED';
ALTER TYPE "NotificationType" ADD VALUE 'PERFORMANCE_REVIEW_STAGE_CHANGED';
ALTER TYPE "NotificationType" ADD VALUE 'PERFORMANCE_REVIEW_FINALIZED';

-- AlterTable
ALTER TABLE "employee_documents" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "description" TEXT,
ADD COLUMN     "documentNumber" TEXT,
ADD COLUMN     "documentTypeId" UUID,
ADD COLUMN     "expiryDate" DATE,
ADD COLUMN     "fileSize" INTEGER,
ADD COLUMN     "issueDate" DATE,
ADD COLUMN     "issuedBy" TEXT,
ADD COLUMN     "mimeType" TEXT,
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "status" "DocumentStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "storageKey" TEXT,
ADD COLUMN     "title" TEXT,
ADD COLUMN     "userId" UUID,
ADD COLUMN     "verifiedAt" TIMESTAMP(3),
ADD COLUMN     "verifiedById" UUID;

UPDATE "employee_documents" d
SET "userId" = ep."userId",
    "title" = COALESCE(d."fileName", d."type")
FROM "employee_profiles" ep
WHERE d."employeeId" = ep."id"
  AND d."userId" IS NULL;

-- CreateTable
CREATE TABLE "document_types" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "requiresExpiryDate" BOOLEAN NOT NULL DEFAULT false,
    "requiresDocumentNumber" BOOLEAN NOT NULL DEFAULT false,
    "allowedMimeTypes" JSONB,
    "maxFileSize" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "document_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract_templates" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contractType" "ContractType" NOT NULL,
    "description" TEXT,
    "templateFileUrl" TEXT NOT NULL,
    "storageKey" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "contract_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract_template_versions" (
    "id" UUID NOT NULL,
    "contractTemplateId" UUID NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "templateFileUrl" TEXT NOT NULL,
    "storageKey" TEXT,
    "contentHash" TEXT,
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contract_template_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_contracts" (
    "id" UUID NOT NULL,
    "contractCode" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "contractTemplateId" UUID NOT NULL,
    "contractTemplateVersionId" UUID NOT NULL,
    "contractType" "ContractType" NOT NULL,
    "title" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE,
    "status" "ContractStatus" NOT NULL DEFAULT 'DRAFT',
    "baseSalarySnapshot" JSONB,
    "positionSnapshot" JSONB,
    "departmentSnapshot" JSONB,
    "draftFileUrl" TEXT,
    "signedFileUrl" TEXT,
    "createdById" UUID NOT NULL,
    "approvedById" UUID,
    "approvedAt" TIMESTAMP(3),
    "employeeSignedAt" TIMESTAMP(3),
    "companySignedAt" TIMESTAMP(3),
    "effectiveAt" TIMESTAMP(3),
    "terminatedAt" TIMESTAMP(3),
    "terminationReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract_signatures" (
    "id" UUID NOT NULL,
    "contractId" UUID NOT NULL,
    "signerUserId" UUID NOT NULL,
    "signerRole" "ContractSignerRole" NOT NULL,
    "signatureType" "SignatureType" NOT NULL,
    "signatureImageUrl" TEXT,
    "signatureDataHash" TEXT,
    "signedDocumentHash" TEXT,
    "ipAddress" TEXT,
    "deviceInfo" TEXT,
    "signedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contract_signatures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kpi_templates" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "departmentId" UUID,
    "positionId" UUID,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "periodType" "KpiPeriodType" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "kpi_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kpi_criteria" (
    "id" UUID NOT NULL,
    "kpiTemplateId" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "weight" DECIMAL(6,2) NOT NULL,
    "targetValue" TEXT,
    "unit" TEXT,
    "scoringMethod" "KpiScoringMethod" NOT NULL DEFAULT 'MANUAL',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kpi_criteria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_kpi_assignments" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "kpiTemplateId" UUID NOT NULL,
    "periodStart" DATE NOT NULL,
    "periodEnd" DATE NOT NULL,
    "status" "EmployeeKpiAssignmentStatus" NOT NULL DEFAULT 'DRAFT',
    "assignedById" UUID NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "finalizedAt" TIMESTAMP(3),
    "finalScore" DECIMAL(6,2),
    "snapshot" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_kpi_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_kpi_results" (
    "id" UUID NOT NULL,
    "employeeKpiAssignmentId" UUID NOT NULL,
    "criteriaId" UUID NOT NULL,
    "targetValue" TEXT,
    "actualValue" TEXT,
    "employeeScore" DECIMAL(6,2),
    "leaderScore" DECIMAL(6,2),
    "finalScore" DECIMAL(6,2),
    "employeeComment" TEXT,
    "leaderComment" TEXT,
    "finalComment" TEXT,
    "evidenceUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_kpi_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "performance_review_cycles" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "periodStart" DATE NOT NULL,
    "periodEnd" DATE NOT NULL,
    "selfReviewStart" DATE NOT NULL,
    "selfReviewEnd" DATE NOT NULL,
    "leaderReviewStart" DATE NOT NULL,
    "leaderReviewEnd" DATE NOT NULL,
    "finalReviewStart" DATE NOT NULL,
    "finalReviewEnd" DATE NOT NULL,
    "status" "PerformanceReviewCycleStatus" NOT NULL DEFAULT 'DRAFT',
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "performance_review_cycles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "performance_reviews" (
    "id" UUID NOT NULL,
    "cycleId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "reviewerUserId" UUID,
    "status" "PerformanceReviewStatus" NOT NULL DEFAULT 'PENDING',
    "selfSummary" TEXT,
    "leaderSummary" TEXT,
    "finalSummary" TEXT,
    "selfScore" DECIMAL(6,2),
    "leaderScore" DECIMAL(6,2),
    "finalScore" DECIMAL(6,2),
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "finalizedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "performance_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviewer_assignments" (
    "id" UUID NOT NULL,
    "reviewCycleId" UUID NOT NULL,
    "employeeUserId" UUID NOT NULL,
    "reviewerUserId" UUID NOT NULL,
    "reviewerType" "ReviewerType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviewer_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "document_types_companyId_isActive_idx" ON "document_types"("companyId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "document_types_companyId_code_key" ON "document_types"("companyId", "code");

-- CreateIndex
CREATE INDEX "contract_templates_companyId_contractType_isActive_idx" ON "contract_templates"("companyId", "contractType", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "contract_templates_companyId_code_key" ON "contract_templates"("companyId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "contract_template_versions_contractTemplateId_versionNumber_key" ON "contract_template_versions"("contractTemplateId", "versionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "employee_contracts_contractCode_key" ON "employee_contracts"("contractCode");

-- CreateIndex
CREATE INDEX "employee_contracts_userId_status_idx" ON "employee_contracts"("userId", "status");

-- CreateIndex
CREATE INDEX "employee_contracts_status_endDate_idx" ON "employee_contracts"("status", "endDate");

-- CreateIndex
CREATE INDEX "employee_contracts_contractTemplateId_idx" ON "employee_contracts"("contractTemplateId");

-- CreateIndex
CREATE INDEX "contract_signatures_contractId_signerRole_idx" ON "contract_signatures"("contractId", "signerRole");

-- CreateIndex
CREATE UNIQUE INDEX "contract_signatures_contractId_signerUserId_signerRole_key" ON "contract_signatures"("contractId", "signerUserId", "signerRole");

-- CreateIndex
CREATE INDEX "kpi_templates_departmentId_positionId_isActive_idx" ON "kpi_templates"("departmentId", "positionId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "kpi_templates_companyId_code_key" ON "kpi_templates"("companyId", "code");

-- CreateIndex
CREATE INDEX "kpi_criteria_kpiTemplateId_sortOrder_idx" ON "kpi_criteria"("kpiTemplateId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "kpi_criteria_kpiTemplateId_code_key" ON "kpi_criteria"("kpiTemplateId", "code");

-- CreateIndex
CREATE INDEX "employee_kpi_assignments_userId_status_periodStart_periodEn_idx" ON "employee_kpi_assignments"("userId", "status", "periodStart", "periodEnd");

-- CreateIndex
CREATE INDEX "employee_kpi_assignments_status_periodEnd_idx" ON "employee_kpi_assignments"("status", "periodEnd");

-- CreateIndex
CREATE UNIQUE INDEX "employee_kpi_assignments_userId_kpiTemplateId_periodStart_p_key" ON "employee_kpi_assignments"("userId", "kpiTemplateId", "periodStart", "periodEnd");

-- CreateIndex
CREATE UNIQUE INDEX "employee_kpi_results_employeeKpiAssignmentId_criteriaId_key" ON "employee_kpi_results"("employeeKpiAssignmentId", "criteriaId");

-- CreateIndex
CREATE INDEX "performance_review_cycles_status_periodStart_periodEnd_idx" ON "performance_review_cycles"("status", "periodStart", "periodEnd");

-- CreateIndex
CREATE UNIQUE INDEX "performance_review_cycles_companyId_code_key" ON "performance_review_cycles"("companyId", "code");

-- CreateIndex
CREATE INDEX "performance_reviews_reviewerUserId_status_idx" ON "performance_reviews"("reviewerUserId", "status");

-- CreateIndex
CREATE INDEX "performance_reviews_userId_status_idx" ON "performance_reviews"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "performance_reviews_cycleId_userId_key" ON "performance_reviews"("cycleId", "userId");

-- CreateIndex
CREATE INDEX "reviewer_assignments_reviewerUserId_reviewerType_idx" ON "reviewer_assignments"("reviewerUserId", "reviewerType");

-- CreateIndex
CREATE UNIQUE INDEX "reviewer_assignments_reviewCycleId_employeeUserId_reviewerU_key" ON "reviewer_assignments"("reviewCycleId", "employeeUserId", "reviewerUserId", "reviewerType");

-- CreateIndex
CREATE INDEX "employee_documents_userId_status_idx" ON "employee_documents"("userId", "status");

-- CreateIndex
CREATE INDEX "employee_documents_documentTypeId_idx" ON "employee_documents"("documentTypeId");

-- CreateIndex
CREATE INDEX "employee_documents_expiryDate_status_idx" ON "employee_documents"("expiryDate", "status");

-- AddForeignKey
ALTER TABLE "document_types" ADD CONSTRAINT "document_types_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_documents" ADD CONSTRAINT "employee_documents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_documents" ADD CONSTRAINT "employee_documents_documentTypeId_fkey" FOREIGN KEY ("documentTypeId") REFERENCES "document_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_documents" ADD CONSTRAINT "employee_documents_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_templates" ADD CONSTRAINT "contract_templates_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_templates" ADD CONSTRAINT "contract_templates_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_template_versions" ADD CONSTRAINT "contract_template_versions_contractTemplateId_fkey" FOREIGN KEY ("contractTemplateId") REFERENCES "contract_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_template_versions" ADD CONSTRAINT "contract_template_versions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_contracts" ADD CONSTRAINT "employee_contracts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_contracts" ADD CONSTRAINT "employee_contracts_contractTemplateId_fkey" FOREIGN KEY ("contractTemplateId") REFERENCES "contract_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_contracts" ADD CONSTRAINT "employee_contracts_contractTemplateVersionId_fkey" FOREIGN KEY ("contractTemplateVersionId") REFERENCES "contract_template_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_contracts" ADD CONSTRAINT "employee_contracts_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_contracts" ADD CONSTRAINT "employee_contracts_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_signatures" ADD CONSTRAINT "contract_signatures_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "employee_contracts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_signatures" ADD CONSTRAINT "contract_signatures_signerUserId_fkey" FOREIGN KEY ("signerUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kpi_templates" ADD CONSTRAINT "kpi_templates_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kpi_templates" ADD CONSTRAINT "kpi_templates_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kpi_templates" ADD CONSTRAINT "kpi_templates_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "positions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kpi_templates" ADD CONSTRAINT "kpi_templates_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kpi_criteria" ADD CONSTRAINT "kpi_criteria_kpiTemplateId_fkey" FOREIGN KEY ("kpiTemplateId") REFERENCES "kpi_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_kpi_assignments" ADD CONSTRAINT "employee_kpi_assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_kpi_assignments" ADD CONSTRAINT "employee_kpi_assignments_kpiTemplateId_fkey" FOREIGN KEY ("kpiTemplateId") REFERENCES "kpi_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_kpi_assignments" ADD CONSTRAINT "employee_kpi_assignments_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_kpi_results" ADD CONSTRAINT "employee_kpi_results_employeeKpiAssignmentId_fkey" FOREIGN KEY ("employeeKpiAssignmentId") REFERENCES "employee_kpi_assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_kpi_results" ADD CONSTRAINT "employee_kpi_results_criteriaId_fkey" FOREIGN KEY ("criteriaId") REFERENCES "kpi_criteria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "performance_review_cycles" ADD CONSTRAINT "performance_review_cycles_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "performance_review_cycles" ADD CONSTRAINT "performance_review_cycles_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "performance_reviews" ADD CONSTRAINT "performance_reviews_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "performance_review_cycles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "performance_reviews" ADD CONSTRAINT "performance_reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "performance_reviews" ADD CONSTRAINT "performance_reviews_reviewerUserId_fkey" FOREIGN KEY ("reviewerUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviewer_assignments" ADD CONSTRAINT "reviewer_assignments_reviewCycleId_fkey" FOREIGN KEY ("reviewCycleId") REFERENCES "performance_review_cycles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviewer_assignments" ADD CONSTRAINT "reviewer_assignments_employeeUserId_fkey" FOREIGN KEY ("employeeUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviewer_assignments" ADD CONSTRAINT "reviewer_assignments_reviewerUserId_fkey" FOREIGN KEY ("reviewerUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Business constraints
ALTER TABLE "employee_contracts"
  ADD CONSTRAINT "employee_contracts_date_range_chk" CHECK ("endDate" IS NULL OR "endDate" >= "startDate");

ALTER TABLE "kpi_criteria"
  ADD CONSTRAINT "kpi_criteria_weight_chk" CHECK ("weight" >= 0 AND "weight" <= 100);

ALTER TABLE "employee_kpi_assignments"
  ADD CONSTRAINT "employee_kpi_assignments_period_chk" CHECK ("periodEnd" >= "periodStart");

ALTER TABLE "employee_kpi_results"
  ADD CONSTRAINT "employee_kpi_results_score_chk" CHECK (
    ("employeeScore" IS NULL OR ("employeeScore" >= 0 AND "employeeScore" <= 100))
    AND ("leaderScore" IS NULL OR ("leaderScore" >= 0 AND "leaderScore" <= 100))
    AND ("finalScore" IS NULL OR ("finalScore" >= 0 AND "finalScore" <= 100))
  );

ALTER TABLE "performance_review_cycles"
  ADD CONSTRAINT "performance_review_cycles_dates_chk" CHECK (
    "periodEnd" >= "periodStart"
    AND "selfReviewEnd" >= "selfReviewStart"
    AND "leaderReviewEnd" >= "leaderReviewStart"
    AND "finalReviewEnd" >= "finalReviewStart"
  );

ALTER TABLE "performance_reviews"
  ADD CONSTRAINT "performance_reviews_score_chk" CHECK (
    ("selfScore" IS NULL OR ("selfScore" >= 0 AND "selfScore" <= 100))
    AND ("leaderScore" IS NULL OR ("leaderScore" >= 0 AND "leaderScore" <= 100))
    AND ("finalScore" IS NULL OR ("finalScore" >= 0 AND "finalScore" <= 100))
  );

CREATE OR REPLACE FUNCTION prevent_finalized_kpi_result_mutation()
RETURNS trigger AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "employee_kpi_assignments" a
    WHERE a."id" = COALESCE(NEW."employeeKpiAssignmentId", OLD."employeeKpiAssignmentId")
      AND a."status" = 'FINALIZED'
  ) THEN
    RAISE EXCEPTION 'Finalized KPI results are immutable';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "employee_kpi_results_prevent_finalized_update"
BEFORE UPDATE OR DELETE ON "employee_kpi_results"
FOR EACH ROW EXECUTE FUNCTION prevent_finalized_kpi_result_mutation();

CREATE OR REPLACE FUNCTION prevent_contract_signature_mutation()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'Contract signatures are immutable';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "contract_signatures_prevent_update"
BEFORE UPDATE OR DELETE ON "contract_signatures"
FOR EACH ROW EXECUTE FUNCTION prevent_contract_signature_mutation();
