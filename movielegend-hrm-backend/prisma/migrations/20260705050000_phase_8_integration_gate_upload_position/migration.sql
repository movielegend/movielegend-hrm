CREATE TYPE "UploadPurpose" AS ENUM (
  'FACE_REGISTRATION',
  'ATTENDANCE',
  'TASK_ATTACHMENT',
  'EMPLOYEE_DOCUMENT',
  'CONTRACT_TEMPLATE',
  'SIGNATURE',
  'KPI_EVIDENCE',
  'ASSET_INCIDENT'
);

CREATE TYPE "UploadedFileStatus" AS ENUM (
  'TEMPORARY',
  'ATTACHED',
  'DELETED'
);

CREATE TABLE "uploaded_files" (
  "id" UUID NOT NULL,
  "uploadedById" UUID,
  "purpose" "UploadPurpose" NOT NULL,
  "fileName" TEXT NOT NULL,
  "storageKey" TEXT NOT NULL,
  "fileUrl" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "size" INTEGER NOT NULL,
  "checksum" TEXT,
  "status" "UploadedFileStatus" NOT NULL DEFAULT 'TEMPORARY',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),

  CONSTRAINT "uploaded_files_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "uploaded_files_storageKey_key" ON "uploaded_files"("storageKey");
CREATE INDEX "uploaded_files_purpose_status_createdAt_idx" ON "uploaded_files"("purpose", "status", "createdAt");
CREATE INDEX "uploaded_files_uploadedById_idx" ON "uploaded_files"("uploadedById");

ALTER TABLE "uploaded_files"
  ADD CONSTRAINT "uploaded_files_uploadedById_fkey"
  FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
