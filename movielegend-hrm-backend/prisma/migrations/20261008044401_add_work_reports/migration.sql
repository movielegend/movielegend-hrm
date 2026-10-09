-- CreateEnum
CREATE TYPE "RewardType" AS ENUM ('CASH', 'PHYSICAL_ITEM', 'HYBRID');

-- CreateEnum
CREATE TYPE "VestingSchedule" AS ENUM ('QUARTERLY', 'BI_ANNUALLY');

-- CreateEnum
CREATE TYPE "CompetitionReviewStatus" AS ENUM ('PENDING_LEADER_REVIEW', 'LEADER_RECOMMENDED', 'LEADER_REJECTED', 'ADMIN_APPROVED_PROMOTION', 'ADMIN_RETAINED_LEVEL', 'ADMIN_DEMOTED_LEVEL');

-- CreateEnum
CREATE TYPE "WithdrawalRequestStatus" AS ENUM ('PENDING_ADMIN', 'PENDING_ACCOUNTANT', 'PAID', 'REJECTED');

-- CreateEnum
CREATE TYPE "VaultTransactionType" AS ENUM ('GRANT_ANNUAL', 'GRANT_PROJECT_INSTANT', 'GRANT_PROJECT_VESTING', 'WITHDRAW_REGULAR', 'WITHDRAW_ADVANCE', 'REFUND_WITHDRAWAL');

-- CreateEnum
CREATE TYPE "PromotionRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUPPLEMENT_REQUESTED');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CLOSED');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('SUBMITTED', 'REVIEWING', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AccountStatus" ADD VALUE 'PENDING_DELETION';
ALTER TYPE "AccountStatus" ADD VALUE 'DEACTIVATED_30_DAYS';

-- AlterEnum
ALTER TYPE "AssetStatus" ADD VALUE 'OUT_OF_STOCK';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "CrossDepartmentRequestStatus" ADD VALUE 'TARGET_ASSIGNED';
ALTER TYPE "CrossDepartmentRequestStatus" ADD VALUE 'IN_PROGRESS';
ALTER TYPE "CrossDepartmentRequestStatus" ADD VALUE 'SUBMITTED_FOR_REVIEW';
ALTER TYPE "CrossDepartmentRequestStatus" ADD VALUE 'REVISION_REQUESTED';
ALTER TYPE "CrossDepartmentRequestStatus" ADD VALUE 'COMPLETED';

-- AlterEnum
ALTER TYPE "EmployeeRequestType" ADD VALUE 'ACCOUNT_DELETION';

-- AlterEnum
ALTER TYPE "RoleScopeType" ADD VALUE 'REGION';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ShiftSwapStatus" ADD VALUE 'PENDING_TARGET_APPROVAL';
ALTER TYPE "ShiftSwapStatus" ADD VALUE 'PENDING_LEADER_APPROVAL';

-- AlterEnum
ALTER TYPE "UploadPurpose" ADD VALUE 'CANDIDATE_CV';

-- DropForeignKey
ALTER TABLE "attendance_records" DROP CONSTRAINT "attendance_records_photoFileId_fkey";

-- DropForeignKey
ALTER TABLE "attendance_records" DROP CONSTRAINT "attendance_records_shiftAssignmentId_fkey";

-- DropForeignKey
ALTER TABLE "attendance_records" DROP CONSTRAINT "attendance_records_userId_fkey";

-- DropForeignKey
ALTER TABLE "employee_documents" DROP CONSTRAINT "employee_documents_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "employee_kpi_results" DROP CONSTRAINT "employee_kpi_results_employeeKpiAssignmentId_fkey";

-- DropForeignKey
ALTER TABLE "employee_profiles" DROP CONSTRAINT "employee_profiles_userId_fkey";

-- DropForeignKey
ALTER TABLE "kpi_criteria" DROP CONSTRAINT "kpi_criteria_kpiTemplateId_fkey";

-- DropForeignKey
ALTER TABLE "leave_requests" DROP CONSTRAINT "leave_requests_userId_fkey";

-- DropForeignKey
ALTER TABLE "newsfeed_posts" DROP CONSTRAINT "newsfeed_posts_departmentId_fkey";

-- DropForeignKey
ALTER TABLE "overtime_requests" DROP CONSTRAINT "overtime_requests_userId_fkey";

-- DropIndex
DROP INDEX "attendance_records_userId_shiftAssignmentId_key";

-- DropIndex
DROP INDEX "attendance_records_userId_workDate_key";

-- AlterTable
ALTER TABLE "attendance_records" ADD COLUMN     "checkInIp" TEXT,
ADD COLUMN     "checkOutIp" TEXT,
ADD COLUMN     "isUnplannedOt" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lateMinutes" INTEGER DEFAULT 0,
ADD COLUMN     "latePenaltyAmount" DECIMAL(10,2),
ADD COLUMN     "latePenaltyLevel" INTEGER,
ADD COLUMN     "latePenaltyWorkDays" DECIMAL(5,2),
ADD COLUMN     "notes" TEXT,
ALTER COLUMN "shiftAssignmentId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "branches" ADD COLUMN     "isHeadquarters" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "regionId" UUID;

-- AlterTable
ALTER TABLE "chat_group_members" ADD COLUMN     "clearedAt" TIMESTAMP(3),
ADD COLUMN     "lastReadAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "chat_messages" ADD COLUMN     "reactions" JSONB DEFAULT '{}',
ADD COLUMN     "replyToId" UUID;

-- AlterTable
ALTER TABLE "contract_template_versions" ADD COLUMN     "mappingConfig" JSONB;

-- AlterTable
ALTER TABLE "cross_department_requests" ADD COLUMN     "assignedToUserId" UUID,
ADD COLUMN     "dueAt" TIMESTAMP(3),
ADD COLUMN     "priority" "TaskPriority" NOT NULL DEFAULT 'NORMAL',
ADD COLUMN     "progress" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "rating" INTEGER,
ADD COLUMN     "resultSummary" TEXT;

-- AlterTable
ALTER TABLE "employee_contracts" ADD COLUMN     "filledFields" JSONB;

-- AlterTable
ALTER TABLE "employee_profiles" ADD COLUMN     "currentLevelNumber" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "ot_report_photos" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "ot_reports" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "overtime_rate_rules" ADD COLUMN     "departmentId" UUID;

-- AlterTable
ALTER TABLE "post_comments" ADD COLUMN     "parentId" UUID,
ADD COLUMN     "reactions" JSONB DEFAULT '{}';

-- AlterTable
ALTER TABLE "shifts" ALTER COLUMN "checkInLateMinutes" SET DEFAULT 60;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "deletionScheduledAt" TIMESTAMP(3),
ADD COLUMN     "isRewardVaultEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isTestAccount" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "OtpToken" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "otpHash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "resetToken" TEXT,
    "resetExpireAt" TIMESTAMP(3),
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OtpToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regions" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "regions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "department_documents" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "departmentId" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'GENERAL',
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "storageKey" TEXT,
    "mimeType" TEXT,
    "fileSize" INTEGER,
    "uploadedById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "department_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "department_overtime_configs" (
    "id" UUID NOT NULL,
    "departmentId" UUID NOT NULL,
    "weekdayMultiplier" DECIMAL(6,3) NOT NULL DEFAULT 1.5,
    "weekendMultiplier" DECIMAL(6,3) NOT NULL DEFAULT 2.0,
    "holidayMultiplier" DECIMAL(6,3) NOT NULL DEFAULT 3.0,
    "nightAllowanceAmount" DECIMAL(14,2) NOT NULL DEFAULT 50000,
    "nightStartHour" INTEGER NOT NULL DEFAULT 21,
    "lateDeductionAmount" DECIMAL(14,2) NOT NULL DEFAULT 50000,
    "lateThresholdMinutes" INTEGER NOT NULL DEFAULT 5,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "department_overtime_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_holidays" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "date" DATE NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_holidays_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract_field_presets" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "contractTemplateId" UUID NOT NULL,
    "departmentId" UUID,
    "positionId" UUID,
    "name" TEXT NOT NULL,
    "fieldDefaults" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contract_field_presets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_levels" (
    "id" UUID NOT NULL,
    "levelNumber" INTEGER NOT NULL,
    "levelName" TEXT NOT NULL,
    "colorHex" TEXT NOT NULL DEFAULT '#2563EB',
    "rewardType" "RewardType" NOT NULL DEFAULT 'CASH',
    "promotionBonusAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "physicalItemName" TEXT,
    "physicalItemImageUrl" TEXT,
    "retentionMultiplier" DECIMAL(3,2) NOT NULL DEFAULT 1.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "talent_retention_vaults" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "year" INTEGER NOT NULL DEFAULT 2026,
    "grantedPoints" INTEGER NOT NULL DEFAULT 0,
    "instantBonusPoints" INTEGER NOT NULL DEFAULT 0,
    "cashValuePerPoint" DECIMAL(10,2) NOT NULL DEFAULT 1000,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "talent_retention_vaults_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_grant_packages" (
    "id" UUID NOT NULL,
    "vaultId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "cashValuePerPoint" DECIMAL(10,2) NOT NULL DEFAULT 1000,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "durationMonths" INTEGER NOT NULL DEFAULT 12,
    "intervalMonths" INTEGER NOT NULL DEFAULT 3,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_grant_packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grant_milestones" (
    "id" UUID NOT NULL,
    "packageId" UUID NOT NULL,
    "milestoneIndex" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "unlockDate" TIMESTAMP(3) NOT NULL,
    "pointsToUnlock" INTEGER NOT NULL,
    "cashAmount" DECIMAL(15,2) NOT NULL,
    "withdrawnPoints" INTEGER NOT NULL DEFAULT 0,
    "isUnlocked" BOOLEAN NOT NULL DEFAULT false,
    "isWithdrawn" BOOLEAN NOT NULL DEFAULT false,
    "withdrawnAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grant_milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vesting_milestones" (
    "id" UUID NOT NULL,
    "vaultId" UUID NOT NULL,
    "quarter" INTEGER NOT NULL,
    "unlockDate" TIMESTAMP(3) NOT NULL,
    "pointsToUnlock" INTEGER NOT NULL,
    "cashAmount" DECIMAL(15,2) NOT NULL,
    "isUnlocked" BOOLEAN NOT NULL DEFAULT false,
    "isWithdrawn" BOOLEAN NOT NULL DEFAULT false,
    "withdrawnAt" TIMESTAMP(3),

    CONSTRAINT "vesting_milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vault_transactions" (
    "id" UUID NOT NULL,
    "vaultId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" "VaultTransactionType" NOT NULL,
    "points" INTEGER NOT NULL,
    "cashAmount" DECIMAL(15,2) NOT NULL,
    "quarterTarget" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vault_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reward_withdrawal_requests" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "pointsWithdrawn" INTEGER NOT NULL,
    "cashAmount" DECIMAL(15,2) NOT NULL,
    "bankAccountName" TEXT NOT NULL,
    "bankAccountNumber" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "note" TEXT,
    "status" "WithdrawalRequestStatus" NOT NULL DEFAULT 'PENDING_ADMIN',
    "adminApprovedBy" UUID,
    "adminApprovedAt" TIMESTAMP(3),
    "adminNote" TEXT,
    "accountantConfirmedBy" UUID,
    "accountantConfirmedAt" TIMESTAMP(3),
    "accountantNote" TEXT,
    "transactionReference" TEXT,
    "rejectedBy" UUID,
    "rejectedAt" TIMESTAMP(3),
    "rejectReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reward_withdrawal_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "department_competition_configs" (
    "id" UUID NOT NULL,
    "departmentId" UUID NOT NULL,
    "metricName" TEXT NOT NULL,
    "targetValue" DECIMAL(15,2) NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'VND',
    "period" TEXT NOT NULL DEFAULT 'MONTHLY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "department_competition_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monthly_competition_reviews" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "departmentId" UUID NOT NULL,
    "period" TEXT NOT NULL,
    "actualMetricValue" DECIMAL(15,2),
    "completedTaskRate" DECIMAL(5,2),
    "leaderStatus" "CompetitionReviewStatus" NOT NULL DEFAULT 'PENDING_LEADER_REVIEW',
    "leaderNote" TEXT,
    "leaderReviewedAt" TIMESTAMP(3),
    "adminStatus" "CompetitionReviewStatus" NOT NULL DEFAULT 'PENDING_LEADER_REVIEW',
    "fromLevelNumber" INTEGER,
    "toLevelNumber" INTEGER,
    "adminNote" TEXT,
    "adminApprovedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "monthly_competition_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tiktok_live_sessions" (
    "id" UUID NOT NULL,
    "sessionTitle" TEXT NOT NULL,
    "streamerId" UUID NOT NULL,
    "departmentId" UUID NOT NULL,
    "totalGmv" DECIMAL(15,2) NOT NULL,
    "totalOrders" INTEGER NOT NULL DEFAULT 0,
    "peakViewers" INTEGER NOT NULL DEFAULT 0,
    "totalViews" INTEGER NOT NULL DEFAULT 0,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tiktok_live_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "department_level_configs" (
    "id" UUID NOT NULL,
    "departmentId" UUID NOT NULL,
    "levelNumber" INTEGER NOT NULL,
    "customLevelName" TEXT NOT NULL,
    "badgeTitle" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "department_level_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "level_promotion_requests" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "departmentId" UUID NOT NULL,
    "fromLevelNumber" INTEGER NOT NULL DEFAULT 1,
    "toLevelNumber" INTEGER NOT NULL DEFAULT 2,
    "submissionNote" TEXT,
    "evidenceImages" JSONB,
    "status" "PromotionRequestStatus" NOT NULL DEFAULT 'PENDING',
    "leaderNote" TEXT,
    "decidedByUserId" UUID,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "level_promotion_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_reports" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "departmentId" UUID NOT NULL,
    "reportDate" TEXT NOT NULL,
    "roleType" TEXT NOT NULL DEFAULT 'EMPLOYEE',
    "metrics" JSONB DEFAULT '[]',
    "completedTasks" JSONB DEFAULT '[]',
    "inProgressTasks" JSONB DEFAULT '[]',
    "obstacles" TEXT,
    "tomorrowPlan" JSONB DEFAULT '[]',
    "attachments" JSONB DEFAULT '[]',
    "selfRating" INTEGER DEFAULT 5,
    "selfReview" TEXT,
    "adminRating" INTEGER,
    "adminReview" TEXT,
    "reviewedById" UUID,
    "reviewedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_tasks" (
    "id" UUID NOT NULL,
    "taskCode" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "createdByUserId" UUID NOT NULL,
    "departmentId" UUID NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "taskType" TEXT NOT NULL DEFAULT 'REGULAR',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "deadline" TEXT,
    "workStatus" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "approvalStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "isCarriedOver" BOOLEAN NOT NULL DEFAULT false,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "deletedById" UUID,
    "deleteReason" TEXT,
    "isMakeup" BOOLEAN NOT NULL DEFAULT false,
    "makeupForDate" TEXT,
    "makeupReason" TEXT,
    "reportDate" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_task_updates" (
    "id" UUID NOT NULL,
    "taskId" UUID NOT NULL,
    "reportDate" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "workStatus" TEXT NOT NULL,
    "approvalStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "obstacles" TEXT,
    "supportRequest" TEXT,
    "reportedByUserId" UUID NOT NULL,
    "isProxied" BOOLEAN NOT NULL DEFAULT false,
    "proxyReason" TEXT,
    "approvedByUserId" UUID,
    "approvedAt" TIMESTAMP(3),
    "approvalNote" TEXT,
    "isDraft" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_task_updates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_report_history" (
    "id" UUID NOT NULL,
    "taskId" UUID,
    "updateId" UUID,
    "actorUserId" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "fieldChanged" TEXT,
    "beforeValue" JSONB,
    "afterValue" JSONB,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "work_report_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_postings" (
    "id" UUID NOT NULL,
    "newCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "departmentName" TEXT NOT NULL,
    "rankName" TEXT,
    "province" TEXT NOT NULL,
    "regionCode" TEXT,
    "regionName" TEXT,
    "experienceRequired" TEXT,
    "toDate" TIMESTAMP(3) NOT NULL,
    "salary" TEXT,
    "missionContent" TEXT,
    "welfare" TEXT,
    "jobDescriptionVn" TEXT,
    "jobDescriptionEn" TEXT,
    "skillTags" TEXT[],
    "level" TEXT[],
    "status" "JobStatus" NOT NULL DEFAULT 'PUBLISHED',
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "applyCount" INTEGER NOT NULL DEFAULT 0,
    "createdByHrId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "job_postings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_applications" (
    "id" UUID NOT NULL,
    "applicationCode" TEXT NOT NULL,
    "jobId" UUID NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "dob" TEXT,
    "gender" TEXT,
    "city" TEXT,
    "educationLevel" TEXT,
    "university" TEXT,
    "major" TEXT,
    "experienceYears" TEXT,
    "currentCompany" TEXT,
    "skills" TEXT,
    "note" TEXT,
    "cvFileUrl" TEXT,
    "cvFileName" TEXT,
    "cvFileSize" INTEGER,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'SUBMITTED',
    "hrNotes" TEXT,
    "aiCvScore" INTEGER,
    "aiSummary" TEXT,
    "interviewDate" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "reviewedByHrId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_applications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OtpToken_resetToken_key" ON "OtpToken"("resetToken");

-- CreateIndex
CREATE INDEX "OtpToken_phone_idx" ON "OtpToken"("phone");

-- CreateIndex
CREATE INDEX "OtpToken_email_idx" ON "OtpToken"("email");

-- CreateIndex
CREATE INDEX "OtpToken_userId_idx" ON "OtpToken"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "regions_companyId_code_key" ON "regions"("companyId", "code");

-- CreateIndex
CREATE INDEX "department_documents_companyId_departmentId_idx" ON "department_documents"("companyId", "departmentId");

-- CreateIndex
CREATE INDEX "department_documents_departmentId_idx" ON "department_documents"("departmentId");

-- CreateIndex
CREATE UNIQUE INDEX "department_overtime_configs_departmentId_key" ON "department_overtime_configs"("departmentId");

-- CreateIndex
CREATE INDEX "company_holidays_companyId_date_idx" ON "company_holidays"("companyId", "date");

-- CreateIndex
CREATE INDEX "contract_field_presets_companyId_contractTemplateId_idx" ON "contract_field_presets"("companyId", "contractTemplateId");

-- CreateIndex
CREATE INDEX "contract_field_presets_departmentId_idx" ON "contract_field_presets"("departmentId");

-- CreateIndex
CREATE UNIQUE INDEX "contract_field_presets_contractTemplateId_departmentId_posi_key" ON "contract_field_presets"("contractTemplateId", "departmentId", "positionId");

-- CreateIndex
CREATE UNIQUE INDEX "employee_levels_levelNumber_key" ON "employee_levels"("levelNumber");

-- CreateIndex
CREATE UNIQUE INDEX "talent_retention_vaults_userId_year_key" ON "talent_retention_vaults"("userId", "year");

-- CreateIndex
CREATE UNIQUE INDEX "department_competition_configs_departmentId_key" ON "department_competition_configs"("departmentId");

-- CreateIndex
CREATE UNIQUE INDEX "monthly_competition_reviews_userId_period_key" ON "monthly_competition_reviews"("userId", "period");

-- CreateIndex
CREATE UNIQUE INDEX "department_level_configs_departmentId_levelNumber_key" ON "department_level_configs"("departmentId", "levelNumber");

-- CreateIndex
CREATE INDEX "level_promotion_requests_departmentId_status_idx" ON "level_promotion_requests"("departmentId", "status");

-- CreateIndex
CREATE INDEX "level_promotion_requests_userId_idx" ON "level_promotion_requests"("userId");

-- CreateIndex
CREATE INDEX "daily_reports_departmentId_reportDate_idx" ON "daily_reports"("departmentId", "reportDate");

-- CreateIndex
CREATE INDEX "daily_reports_status_reportDate_idx" ON "daily_reports"("status", "reportDate");

-- CreateIndex
CREATE UNIQUE INDEX "daily_reports_userId_reportDate_key" ON "daily_reports"("userId", "reportDate");

-- CreateIndex
CREATE UNIQUE INDEX "work_tasks_taskCode_key" ON "work_tasks"("taskCode");

-- CreateIndex
CREATE INDEX "work_tasks_userId_reportDate_idx" ON "work_tasks"("userId", "reportDate");

-- CreateIndex
CREATE INDEX "work_tasks_departmentId_reportDate_idx" ON "work_tasks"("departmentId", "reportDate");

-- CreateIndex
CREATE INDEX "work_tasks_workStatus_idx" ON "work_tasks"("workStatus");

-- CreateIndex
CREATE INDEX "work_tasks_isDeleted_reportDate_idx" ON "work_tasks"("isDeleted", "reportDate");

-- CreateIndex
CREATE INDEX "work_task_updates_reportDate_idx" ON "work_task_updates"("reportDate");

-- CreateIndex
CREATE INDEX "work_task_updates_approvalStatus_idx" ON "work_task_updates"("approvalStatus");

-- CreateIndex
CREATE UNIQUE INDEX "work_task_updates_taskId_reportDate_key" ON "work_task_updates"("taskId", "reportDate");

-- CreateIndex
CREATE INDEX "work_report_history_taskId_idx" ON "work_report_history"("taskId");

-- CreateIndex
CREATE INDEX "work_report_history_actorUserId_idx" ON "work_report_history"("actorUserId");

-- CreateIndex
CREATE INDEX "work_report_history_createdAt_idx" ON "work_report_history"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "job_postings_newCode_key" ON "job_postings"("newCode");

-- CreateIndex
CREATE INDEX "job_postings_departmentName_idx" ON "job_postings"("departmentName");

-- CreateIndex
CREATE INDEX "job_postings_province_idx" ON "job_postings"("province");

-- CreateIndex
CREATE INDEX "job_postings_status_idx" ON "job_postings"("status");

-- CreateIndex
CREATE UNIQUE INDEX "job_applications_applicationCode_key" ON "job_applications"("applicationCode");

-- CreateIndex
CREATE INDEX "job_applications_jobId_idx" ON "job_applications"("jobId");

-- CreateIndex
CREATE INDEX "job_applications_status_idx" ON "job_applications"("status");

-- CreateIndex
CREATE INDEX "job_applications_email_idx" ON "job_applications"("email");

-- CreateIndex
CREATE INDEX "job_applications_phone_idx" ON "job_applications"("phone");

-- CreateIndex
CREATE INDEX "asset_assignment_histories_assetAssignmentId_idx" ON "asset_assignment_histories"("assetAssignmentId");

-- CreateIndex
CREATE INDEX "attendance_adjustments_userId_idx" ON "attendance_adjustments"("userId");

-- CreateIndex
CREATE INDEX "attendance_adjustments_attendanceRecordId_idx" ON "attendance_adjustments"("attendanceRecordId");

-- CreateIndex
CREATE INDEX "attendance_records_userId_workDate_idx" ON "attendance_records"("userId", "workDate");

-- CreateIndex
CREATE INDEX "attendance_records_userId_shiftAssignmentId_idx" ON "attendance_records"("userId", "shiftAssignmentId");

-- CreateIndex
CREATE INDEX "audit_logs_actorUserId_idx" ON "audit_logs"("actorUserId");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "branches_regionId_idx" ON "branches"("regionId");

-- CreateIndex
CREATE INDEX "chat_group_members_userId_idx" ON "chat_group_members"("userId");

-- CreateIndex
CREATE INDEX "chat_messages_groupId_createdAt_idx" ON "chat_messages"("groupId", "createdAt");

-- CreateIndex
CREATE INDEX "chat_messages_senderId_idx" ON "chat_messages"("senderId");

-- CreateIndex
CREATE INDEX "chat_messages_replyToId_idx" ON "chat_messages"("replyToId");

-- CreateIndex
CREATE INDEX "contract_signatures_signerUserId_idx" ON "contract_signatures"("signerUserId");

-- CreateIndex
CREATE INDEX "cross_department_requests_assignedToUserId_status_idx" ON "cross_department_requests"("assignedToUserId", "status");

-- CreateIndex
CREATE INDEX "department_members_userId_idx" ON "department_members"("userId");

-- CreateIndex
CREATE INDEX "department_members_positionId_idx" ON "department_members"("positionId");

-- CreateIndex
CREATE INDEX "departments_branchId_idx" ON "departments"("branchId");

-- CreateIndex
CREATE INDEX "departments_parentId_idx" ON "departments"("parentId");

-- CreateIndex
CREATE INDEX "departments_leaderUserId_idx" ON "departments"("leaderUserId");

-- CreateIndex
CREATE INDEX "employee_documents_employeeId_idx" ON "employee_documents"("employeeId");

-- CreateIndex
CREATE INDEX "employee_documents_verifiedById_idx" ON "employee_documents"("verifiedById");

-- CreateIndex
CREATE INDEX "employee_kpi_results_criteriaId_idx" ON "employee_kpi_results"("criteriaId");

-- CreateIndex
CREATE INDEX "leave_requests_userId_idx" ON "leave_requests"("userId");

-- CreateIndex
CREATE INDEX "material_issue_items_materialIssueId_idx" ON "material_issue_items"("materialIssueId");

-- CreateIndex
CREATE INDEX "material_issue_items_materialId_idx" ON "material_issue_items"("materialId");

-- CreateIndex
CREATE INDEX "material_return_items_materialReturnId_idx" ON "material_return_items"("materialReturnId");

-- CreateIndex
CREATE INDEX "material_return_items_materialId_idx" ON "material_return_items"("materialId");

-- CreateIndex
CREATE INDEX "overtime_requests_userId_idx" ON "overtime_requests"("userId");

-- CreateIndex
CREATE INDEX "post_comments_postId_idx" ON "post_comments"("postId");

-- CreateIndex
CREATE INDEX "post_comments_parentId_idx" ON "post_comments"("parentId");

-- CreateIndex
CREATE INDEX "shift_registrations_userId_idx" ON "shift_registrations"("userId");

-- CreateIndex
CREATE INDEX "shift_registrations_workDate_idx" ON "shift_registrations"("workDate");

-- CreateIndex
CREATE INDEX "shift_swaps_requesterUserId_idx" ON "shift_swaps"("requesterUserId");

-- CreateIndex
CREATE INDEX "shift_swaps_targetUserId_idx" ON "shift_swaps"("targetUserId");

-- CreateIndex
CREATE INDEX "stock_receipt_items_receiptId_idx" ON "stock_receipt_items"("receiptId");

-- CreateIndex
CREATE INDEX "stock_receipt_items_materialId_idx" ON "stock_receipt_items"("materialId");

-- CreateIndex
CREATE INDEX "stock_transfer_items_transferId_idx" ON "stock_transfer_items"("transferId");

-- CreateIndex
CREATE INDEX "stock_transfer_items_materialId_idx" ON "stock_transfer_items"("materialId");

-- CreateIndex
CREATE INDEX "user_approval_requests_userId_idx" ON "user_approval_requests"("userId");

-- CreateIndex
CREATE INDEX "user_approval_requests_requestedDepartmentId_status_idx" ON "user_approval_requests"("requestedDepartmentId", "status");

-- AddForeignKey
ALTER TABLE "OtpToken" ADD CONSTRAINT "OtpToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regions" ADD CONSTRAINT "regions_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branches" ADD CONSTRAINT "branches_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "regions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_profiles" ADD CONSTRAINT "employee_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_documents" ADD CONSTRAINT "employee_documents_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employee_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "department_documents" ADD CONSTRAINT "department_documents_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "department_documents" ADD CONSTRAINT "department_documents_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "department_documents" ADD CONSTRAINT "department_documents_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_shiftAssignmentId_fkey" FOREIGN KEY ("shiftAssignmentId") REFERENCES "shift_assignments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_photoFileId_fkey" FOREIGN KEY ("photoFileId") REFERENCES "uploaded_files"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "overtime_requests" ADD CONSTRAINT "overtime_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cross_department_requests" ADD CONSTRAINT "cross_department_requests_assignedToUserId_fkey" FOREIGN KEY ("assignedToUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "overtime_rate_rules" ADD CONSTRAINT "overtime_rate_rules_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "department_overtime_configs" ADD CONSTRAINT "department_overtime_configs_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_field_presets" ADD CONSTRAINT "contract_field_presets_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_field_presets" ADD CONSTRAINT "contract_field_presets_contractTemplateId_fkey" FOREIGN KEY ("contractTemplateId") REFERENCES "contract_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_field_presets" ADD CONSTRAINT "contract_field_presets_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_field_presets" ADD CONSTRAINT "contract_field_presets_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "positions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kpi_criteria" ADD CONSTRAINT "kpi_criteria_kpiTemplateId_fkey" FOREIGN KEY ("kpiTemplateId") REFERENCES "kpi_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_kpi_results" ADD CONSTRAINT "employee_kpi_results_employeeKpiAssignmentId_fkey" FOREIGN KEY ("employeeKpiAssignmentId") REFERENCES "employee_kpi_assignments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "newsfeed_posts" ADD CONSTRAINT "newsfeed_posts_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_comments" ADD CONSTRAINT "post_comments_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "post_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "chat_messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "talent_retention_vaults" ADD CONSTRAINT "talent_retention_vaults_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_grant_packages" ADD CONSTRAINT "project_grant_packages_vaultId_fkey" FOREIGN KEY ("vaultId") REFERENCES "talent_retention_vaults"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_grant_packages" ADD CONSTRAINT "project_grant_packages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grant_milestones" ADD CONSTRAINT "grant_milestones_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "project_grant_packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vesting_milestones" ADD CONSTRAINT "vesting_milestones_vaultId_fkey" FOREIGN KEY ("vaultId") REFERENCES "talent_retention_vaults"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vault_transactions" ADD CONSTRAINT "vault_transactions_vaultId_fkey" FOREIGN KEY ("vaultId") REFERENCES "talent_retention_vaults"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vault_transactions" ADD CONSTRAINT "vault_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reward_withdrawal_requests" ADD CONSTRAINT "reward_withdrawal_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "department_level_configs" ADD CONSTRAINT "department_level_configs_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "level_promotion_requests" ADD CONSTRAINT "level_promotion_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "level_promotion_requests" ADD CONSTRAINT "level_promotion_requests_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_reports" ADD CONSTRAINT "daily_reports_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_reports" ADD CONSTRAINT "daily_reports_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_reports" ADD CONSTRAINT "daily_reports_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_tasks" ADD CONSTRAINT "work_tasks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_tasks" ADD CONSTRAINT "work_tasks_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_tasks" ADD CONSTRAINT "work_tasks_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_tasks" ADD CONSTRAINT "work_tasks_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_task_updates" ADD CONSTRAINT "work_task_updates_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "work_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_task_updates" ADD CONSTRAINT "work_task_updates_reportedByUserId_fkey" FOREIGN KEY ("reportedByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_task_updates" ADD CONSTRAINT "work_task_updates_approvedByUserId_fkey" FOREIGN KEY ("approvedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_report_history" ADD CONSTRAINT "work_report_history_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "work_tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_report_history" ADD CONSTRAINT "work_report_history_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "job_postings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
