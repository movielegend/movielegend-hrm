-- CreateEnum
CREATE TYPE "OtReportStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterEnum
ALTER TYPE "UploadPurpose" ADD VALUE IF NOT EXISTS 'OT_REPORT_ATTACHMENT';

-- CreateTable
CREATE TABLE IF NOT EXISTS "ot_reports" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "departmentId" UUID NOT NULL,
    "otDate" DATE NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "proposedPercent" INTEGER NOT NULL DEFAULT 100,
    "approvedPercent" INTEGER,
    "reason" TEXT,
    "status" "OtReportStatus" NOT NULL DEFAULT 'PENDING',
    "validOtMinutes" INTEGER NOT NULL DEFAULT 0,
    "decidedByUserId" UUID,
    "decidedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ot_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ot_report_photos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "otReportId" UUID NOT NULL,
    "fileId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ot_report_photos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ot_reports_userId_otDate_key" ON "ot_reports"("userId", "otDate");
CREATE INDEX IF NOT EXISTS "ot_reports_departmentId_status_idx" ON "ot_reports"("departmentId", "status");
CREATE INDEX IF NOT EXISTS "ot_reports_userId_otDate_idx" ON "ot_reports"("userId", "otDate");
CREATE INDEX IF NOT EXISTS "ot_report_photos_otReportId_idx" ON "ot_report_photos"("otReportId");
CREATE INDEX IF NOT EXISTS "ot_report_photos_fileId_idx" ON "ot_report_photos"("fileId");

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "ot_reports" ADD CONSTRAINT "ot_reports_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "ot_reports" ADD CONSTRAINT "ot_reports_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "ot_report_photos" ADD CONSTRAINT "ot_report_photos_otReportId_fkey" FOREIGN KEY ("otReportId") REFERENCES "ot_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "ot_report_photos" ADD CONSTRAINT "ot_report_photos_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "uploaded_files"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
