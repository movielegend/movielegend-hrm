-- CreateEnum
CREATE TYPE "SalaryType" AS ENUM ('MONTHLY', 'DAILY', 'HOURLY');

-- CreateEnum
CREATE TYPE "SalaryComponentType" AS ENUM ('EARNING', 'ALLOWANCE', 'BONUS', 'DEDUCTION', 'TAX', 'INSURANCE', 'OTHER');

-- CreateEnum
CREATE TYPE "SalaryCalculationType" AS ENUM ('FIXED', 'PER_DAY', 'PER_HOUR', 'PERCENTAGE', 'FORMULA');

-- CreateEnum
CREATE TYPE "PayrollPeriodStatus" AS ENUM ('DRAFT', 'CALCULATING', 'CALCULATED', 'UNDER_REVIEW', 'APPROVED', 'LOCKED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PayrollStatus" AS ENUM ('DRAFT', 'CALCULATED', 'UNDER_REVIEW', 'APPROVED', 'LOCKED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PayrollItemType" AS ENUM ('EARNING', 'ALLOWANCE', 'BONUS', 'DEDUCTION', 'TAX', 'INSURANCE', 'OTHER');

-- CreateEnum
CREATE TYPE "EmployeeBonusStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'APPLIED_TO_PAYROLL', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EmployeeDeductionStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'APPLIED_TO_PAYROLL', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ViolationStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'CONFIRMED', 'REJECTED', 'CLOSED');

-- CreateEnum
CREATE TYPE "DisciplinaryActionType" AS ENUM ('REMINDER', 'VERBAL_WARNING', 'WRITTEN_WARNING', 'DEDUCTION', 'SUSPENSION', 'OTHER');

-- CreateEnum
CREATE TYPE "DisciplinaryActionStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OvertimeType" AS ENUM ('WEEKDAY', 'WEEKEND', 'HOLIDAY', 'NIGHT');

CREATE SEQUENCE IF NOT EXISTS payroll_period_code_seq START 1;

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'PAYROLL_CALCULATED';
ALTER TYPE "NotificationType" ADD VALUE 'PAYROLL_REVIEW_REQUIRED';
ALTER TYPE "NotificationType" ADD VALUE 'PAYROLL_APPROVED';
ALTER TYPE "NotificationType" ADD VALUE 'PAYSLIP_AVAILABLE';
ALTER TYPE "NotificationType" ADD VALUE 'BONUS_APPROVED';
ALTER TYPE "NotificationType" ADD VALUE 'DEDUCTION_APPROVED';
ALTER TYPE "NotificationType" ADD VALUE 'VIOLATION_CONFIRMED';
ALTER TYPE "NotificationType" ADD VALUE 'DISCIPLINARY_ACTION_APPROVED';

-- CreateTable
CREATE TABLE "salary_profiles" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "salaryType" "SalaryType" NOT NULL,
    "baseSalary" DECIMAL(14,2) NOT NULL,
    "standardWorkingDays" DECIMAL(6,2),
    "standardWorkingHours" DECIMAL(6,2),
    "hourlyRate" DECIMAL(14,2),
    "dailyRate" DECIMAL(14,2),
    "currency" TEXT NOT NULL DEFAULT 'VND',
    "effectiveFrom" DATE NOT NULL,
    "effectiveTo" DATE,
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "salary_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "salary_components" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "componentType" "SalaryComponentType" NOT NULL,
    "calculationType" "SalaryCalculationType" NOT NULL,
    "defaultAmount" DECIMAL(14,2),
    "formulaKey" TEXT,
    "taxable" BOOLEAN NOT NULL DEFAULT false,
    "insuranceApplicable" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "salary_components_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_salary_components" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "componentId" UUID NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "percentage" DECIMAL(8,4),
    "effectiveFrom" DATE NOT NULL,
    "effectiveTo" DATE,
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_salary_components_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_periods" (
    "id" UUID NOT NULL,
    "periodCode" TEXT NOT NULL,
    "companyId" UUID NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "status" "PayrollPeriodStatus" NOT NULL DEFAULT 'DRAFT',
    "calculatedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "lockedAt" TIMESTAMP(3),
    "createdById" UUID NOT NULL,
    "reviewedById" UUID,
    "approvedById" UUID,
    "lockedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payroll_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payrolls" (
    "id" UUID NOT NULL,
    "payrollPeriodId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "salaryProfileId" UUID NOT NULL,
    "baseSalary" DECIMAL(14,2) NOT NULL,
    "standardWorkingDays" DECIMAL(6,2) NOT NULL,
    "actualWorkingDays" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "paidLeaveDays" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "unpaidLeaveDays" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "regularWorkedMinutes" INTEGER NOT NULL DEFAULT 0,
    "overtimeMinutes" INTEGER NOT NULL DEFAULT 0,
    "overtimeAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "allowanceAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "bonusAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "deductionAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "insuranceAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "grossSalary" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "netSalary" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "calculationVersion" INTEGER NOT NULL DEFAULT 1,
    "calculatedAt" TIMESTAMP(3) NOT NULL,
    "status" "PayrollStatus" NOT NULL DEFAULT 'CALCULATED',
    "employeeAcknowledgedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payrolls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_items" (
    "id" UUID NOT NULL,
    "payrollId" UUID NOT NULL,
    "componentId" UUID,
    "itemCode" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "itemType" "PayrollItemType" NOT NULL,
    "sourceType" TEXT,
    "sourceId" UUID,
    "quantity" DECIMAL(14,3),
    "rate" DECIMAL(14,2),
    "amount" DECIMAL(14,2) NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payroll_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_calculation_snapshots" (
    "id" UUID NOT NULL,
    "payrollId" UUID NOT NULL,
    "attendanceSummary" JSONB NOT NULL,
    "leaveSummary" JSONB NOT NULL,
    "overtimeSummary" JSONB NOT NULL,
    "salaryProfileSnapshot" JSONB NOT NULL,
    "componentSnapshot" JSONB NOT NULL,
    "bonusSnapshot" JSONB NOT NULL,
    "deductionSnapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payroll_calculation_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_bonuses" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "bonusType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "amount" DECIMAL(14,2) NOT NULL,
    "effectiveDate" DATE NOT NULL,
    "status" "EmployeeBonusStatus" NOT NULL DEFAULT 'PENDING',
    "approvedById" UUID,
    "approvedAt" TIMESTAMP(3),
    "relatedEntityType" TEXT,
    "relatedEntityId" UUID,
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_bonuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_deductions" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "deductionType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "amount" DECIMAL(14,2) NOT NULL,
    "effectiveDate" DATE NOT NULL,
    "status" "EmployeeDeductionStatus" NOT NULL DEFAULT 'PENDING',
    "approvedById" UUID,
    "approvedAt" TIMESTAMP(3),
    "relatedEntityType" TEXT,
    "relatedEntityId" UUID,
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_deductions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "violations" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "violationType" TEXT NOT NULL,
    "relatedEntityType" TEXT,
    "relatedEntityId" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "violationDate" DATE NOT NULL,
    "status" "ViolationStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "createdById" UUID NOT NULL,
    "confirmedById" UUID,
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "violations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disciplinary_actions" (
    "id" UUID NOT NULL,
    "violationId" UUID NOT NULL,
    "actionType" "DisciplinaryActionType" NOT NULL,
    "amount" DECIMAL(14,2),
    "description" TEXT NOT NULL,
    "effectiveDate" DATE NOT NULL,
    "status" "DisciplinaryActionStatus" NOT NULL DEFAULT 'PENDING',
    "approvedById" UUID,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "disciplinary_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "overtime_rate_rules" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "overtimeType" "OvertimeType" NOT NULL,
    "multiplier" DECIMAL(6,3) NOT NULL,
    "effectiveFrom" DATE NOT NULL,
    "effectiveTo" DATE,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "overtime_rate_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "salary_profiles_userId_effectiveFrom_effectiveTo_idx" ON "salary_profiles"("userId", "effectiveFrom", "effectiveTo");

-- CreateIndex
CREATE UNIQUE INDEX "salary_profiles_userId_effectiveFrom_key" ON "salary_profiles"("userId", "effectiveFrom");

-- CreateIndex
CREATE UNIQUE INDEX "salary_components_code_key" ON "salary_components"("code");

-- CreateIndex
CREATE INDEX "employee_salary_components_userId_effectiveFrom_effectiveTo_idx" ON "employee_salary_components"("userId", "effectiveFrom", "effectiveTo");

-- CreateIndex
CREATE UNIQUE INDEX "employee_salary_components_userId_componentId_effectiveFrom_key" ON "employee_salary_components"("userId", "componentId", "effectiveFrom");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_periods_periodCode_key" ON "payroll_periods"("periodCode");

-- CreateIndex
CREATE INDEX "payroll_periods_status_idx" ON "payroll_periods"("status");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_periods_companyId_month_year_key" ON "payroll_periods"("companyId", "month", "year");

-- CreateIndex
CREATE INDEX "payrolls_userId_status_idx" ON "payrolls"("userId", "status");

-- CreateIndex
CREATE INDEX "payrolls_payrollPeriodId_status_idx" ON "payrolls"("payrollPeriodId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "payrolls_payrollPeriodId_userId_key" ON "payrolls"("payrollPeriodId", "userId");

-- CreateIndex
CREATE INDEX "payroll_items_payrollId_idx" ON "payroll_items"("payrollId");

-- CreateIndex
CREATE INDEX "payroll_items_sourceType_sourceId_idx" ON "payroll_items"("sourceType", "sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_calculation_snapshots_payrollId_key" ON "payroll_calculation_snapshots"("payrollId");

-- CreateIndex
CREATE INDEX "employee_bonuses_userId_status_effectiveDate_idx" ON "employee_bonuses"("userId", "status", "effectiveDate");

-- CreateIndex
CREATE INDEX "employee_deductions_userId_status_effectiveDate_idx" ON "employee_deductions"("userId", "status", "effectiveDate");

-- CreateIndex
CREATE INDEX "violations_userId_status_violationDate_idx" ON "violations"("userId", "status", "violationDate");

-- CreateIndex
CREATE INDEX "disciplinary_actions_violationId_status_idx" ON "disciplinary_actions"("violationId", "status");

-- CreateIndex
CREATE INDEX "overtime_rate_rules_companyId_overtimeType_effectiveFrom_ef_idx" ON "overtime_rate_rules"("companyId", "overtimeType", "effectiveFrom", "effectiveTo");

-- AddForeignKey
ALTER TABLE "salary_profiles" ADD CONSTRAINT "salary_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salary_profiles" ADD CONSTRAINT "salary_profiles_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_salary_components" ADD CONSTRAINT "employee_salary_components_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_salary_components" ADD CONSTRAINT "employee_salary_components_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "salary_components"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_salary_components" ADD CONSTRAINT "employee_salary_components_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_periods" ADD CONSTRAINT "payroll_periods_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_periods" ADD CONSTRAINT "payroll_periods_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_periods" ADD CONSTRAINT "payroll_periods_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_periods" ADD CONSTRAINT "payroll_periods_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_periods" ADD CONSTRAINT "payroll_periods_lockedById_fkey" FOREIGN KEY ("lockedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payrolls" ADD CONSTRAINT "payrolls_payrollPeriodId_fkey" FOREIGN KEY ("payrollPeriodId") REFERENCES "payroll_periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payrolls" ADD CONSTRAINT "payrolls_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payrolls" ADD CONSTRAINT "payrolls_salaryProfileId_fkey" FOREIGN KEY ("salaryProfileId") REFERENCES "salary_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_items" ADD CONSTRAINT "payroll_items_payrollId_fkey" FOREIGN KEY ("payrollId") REFERENCES "payrolls"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_items" ADD CONSTRAINT "payroll_items_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "salary_components"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_calculation_snapshots" ADD CONSTRAINT "payroll_calculation_snapshots_payrollId_fkey" FOREIGN KEY ("payrollId") REFERENCES "payrolls"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_bonuses" ADD CONSTRAINT "employee_bonuses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_bonuses" ADD CONSTRAINT "employee_bonuses_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_bonuses" ADD CONSTRAINT "employee_bonuses_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_deductions" ADD CONSTRAINT "employee_deductions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_deductions" ADD CONSTRAINT "employee_deductions_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_deductions" ADD CONSTRAINT "employee_deductions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "violations" ADD CONSTRAINT "violations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "violations" ADD CONSTRAINT "violations_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "violations" ADD CONSTRAINT "violations_confirmedById_fkey" FOREIGN KEY ("confirmedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disciplinary_actions" ADD CONSTRAINT "disciplinary_actions_violationId_fkey" FOREIGN KEY ("violationId") REFERENCES "violations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disciplinary_actions" ADD CONSTRAINT "disciplinary_actions_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "overtime_rate_rules" ADD CONSTRAINT "overtime_rate_rules_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "salary_profiles" ADD CONSTRAINT "salary_profiles_effective_range_chk" CHECK ("effectiveTo" IS NULL OR "effectiveTo" >= "effectiveFrom");
ALTER TABLE "employee_salary_components" ADD CONSTRAINT "employee_salary_components_effective_range_chk" CHECK ("effectiveTo" IS NULL OR "effectiveTo" >= "effectiveFrom");
ALTER TABLE "payroll_periods" ADD CONSTRAINT "payroll_periods_month_chk" CHECK ("month" >= 1 AND "month" <= 12);
ALTER TABLE "payroll_periods" ADD CONSTRAINT "payroll_periods_date_range_chk" CHECK ("endDate" >= "startDate");
ALTER TABLE "payrolls" ADD CONSTRAINT "payrolls_non_negative_amounts_chk" CHECK (
  "baseSalary" >= 0 AND "grossSalary" >= 0 AND "netSalary" >= 0 AND
  "overtimeAmount" >= 0 AND "allowanceAmount" >= 0 AND "bonusAmount" >= 0 AND
  "deductionAmount" >= 0 AND "insuranceAmount" >= 0 AND "taxAmount" >= 0
);
ALTER TABLE "payroll_items" ADD CONSTRAINT "payroll_items_amount_not_null_chk" CHECK ("amount" IS NOT NULL);

CREATE UNIQUE INDEX "employee_bonuses_apply_once_idx"
ON "employee_bonuses"("relatedEntityType", "relatedEntityId", "userId", "effectiveDate")
WHERE "relatedEntityType" IS NOT NULL AND "relatedEntityId" IS NOT NULL;

CREATE UNIQUE INDEX "employee_deductions_apply_once_idx"
ON "employee_deductions"("relatedEntityType", "relatedEntityId", "userId", "effectiveDate")
WHERE "relatedEntityType" IS NOT NULL AND "relatedEntityId" IS NOT NULL;

CREATE OR REPLACE FUNCTION prevent_locked_payroll_mutation()
RETURNS trigger AS $$
DECLARE
  period_status text;
BEGIN
  SELECT pp."status"::text INTO period_status
  FROM "payrolls" p
  JOIN "payroll_periods" pp ON pp."id" = p."payrollPeriodId"
  WHERE p."id" = COALESCE(NEW."id", OLD."id");

  IF period_status = 'LOCKED' THEN
    RAISE EXCEPTION 'locked payroll cannot be mutated';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION prevent_locked_payroll_item_mutation()
RETURNS trigger AS $$
DECLARE
  period_status text;
BEGIN
  SELECT pp."status"::text INTO period_status
  FROM "payroll_items" pi
  JOIN "payrolls" p ON p."id" = pi."payrollId"
  JOIN "payroll_periods" pp ON pp."id" = p."payrollPeriodId"
  WHERE pi."id" = COALESCE(NEW."id", OLD."id");

  IF period_status = 'LOCKED' THEN
    RAISE EXCEPTION 'locked payroll item cannot be mutated';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payrolls_no_locked_update
BEFORE UPDATE OR DELETE ON "payrolls"
FOR EACH ROW EXECUTE FUNCTION prevent_locked_payroll_mutation();

CREATE TRIGGER payroll_items_no_locked_mutation
BEFORE UPDATE OR DELETE ON "payroll_items"
FOR EACH ROW EXECUTE FUNCTION prevent_locked_payroll_item_mutation();

