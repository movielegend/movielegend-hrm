-- CreateEnum
CREATE TYPE "SystemSettingCategory" AS ENUM ('GENERAL', 'ATTENDANCE', 'TASK', 'PAYROLL', 'NOTIFICATION', 'SECURITY', 'CONTRACT', 'KPI');

-- CreateEnum
CREATE TYPE "ReportSnapshotType" AS ENUM ('PAYROLL_MONTHLY', 'HR_MONTHLY', 'KPI_FINALIZED', 'EXECUTIVE_SUMMARY');

-- CreateEnum
CREATE TYPE "JobExecutionStatus" AS ENUM ('RUNNING', 'SUCCESS', 'PARTIAL_SUCCESS', 'FAILED');

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "dedupKey" TEXT;

-- CreateTable
CREATE TABLE "system_settings" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "valueJson" JSONB NOT NULL,
    "category" "SystemSettingCategory" NOT NULL,
    "description" TEXT,
    "isSensitive" BOOLEAN NOT NULL DEFAULT false,
    "updatedById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_notification_preferences" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "notificationType" "NotificationType" NOT NULL,
    "inAppEnabled" BOOLEAN NOT NULL DEFAULT true,
    "pushEnabled" BOOLEAN NOT NULL DEFAULT true,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_snapshots" (
    "id" UUID NOT NULL,
    "reportType" "ReportSnapshotType" NOT NULL,
    "scopeType" "RoleScopeType" NOT NULL,
    "scopeId" UUID,
    "periodStart" DATE NOT NULL,
    "periodEnd" DATE NOT NULL,
    "parametersJson" JSONB NOT NULL,
    "resultSummaryJson" JSONB NOT NULL,
    "generatedById" UUID NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "report_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_execution_logs" (
    "id" UUID NOT NULL,
    "jobName" TEXT NOT NULL,
    "executionKey" TEXT NOT NULL,
    "status" "JobExecutionStatus" NOT NULL DEFAULT 'RUNNING',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "processedCount" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "errorSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_execution_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "system_settings_companyId_category_idx" ON "system_settings"("companyId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_companyId_key_key" ON "system_settings"("companyId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "user_notification_preferences_userId_notificationType_key" ON "user_notification_preferences"("userId", "notificationType");

-- CreateIndex
CREATE INDEX "report_snapshots_reportType_periodStart_periodEnd_idx" ON "report_snapshots"("reportType", "periodStart", "periodEnd");

-- CreateIndex
CREATE INDEX "report_snapshots_scopeType_scopeId_idx" ON "report_snapshots"("scopeType", "scopeId");

-- CreateIndex
CREATE UNIQUE INDEX "job_execution_logs_executionKey_key" ON "job_execution_logs"("executionKey");

-- CreateIndex
CREATE INDEX "job_execution_logs_jobName_startedAt_idx" ON "job_execution_logs"("jobName", "startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "notifications_dedupKey_key" ON "notifications"("dedupKey");

-- AddForeignKey
ALTER TABLE "system_settings" ADD CONSTRAINT "system_settings_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_settings" ADD CONSTRAINT "system_settings_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_notification_preferences" ADD CONSTRAINT "user_notification_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_snapshots" ADD CONSTRAINT "report_snapshots_generatedById_fkey" FOREIGN KEY ("generatedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Business constraints
ALTER TABLE "report_snapshots"
  ADD CONSTRAINT "report_snapshots_period_chk" CHECK ("periodEnd" >= "periodStart");

ALTER TABLE "job_execution_logs"
  ADD CONSTRAINT "job_execution_logs_counts_chk" CHECK (
    "processedCount" >= 0
    AND "successCount" >= 0
    AND "failureCount" >= 0
  );
