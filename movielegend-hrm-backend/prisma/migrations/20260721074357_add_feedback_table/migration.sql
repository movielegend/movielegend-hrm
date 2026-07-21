-- CreateEnum
CREATE TYPE "NewsfeedPostStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "FeedbackStatus" AS ENUM ('SEND', 'REVIEWED', 'RESOLVED', 'REJECTED');

-- AlterEnum
ALTER TYPE "ContractStatus" ADD VALUE 'REJECTED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'NEWSFEED_POST_PENDING';
ALTER TYPE "NotificationType" ADD VALUE 'NEWSFEED_POST_APPROVED';
ALTER TYPE "NotificationType" ADD VALUE 'NEWSFEED_POST_REJECTED';
ALTER TYPE "NotificationType" ADD VALUE 'CHAT_MESSAGE';
ALTER TYPE "NotificationType" ADD VALUE 'CHAT_MENTION';

-- AlterTable
ALTER TABLE "attendance_records" ADD COLUMN     "checkOutPhotoFileId" UUID;

-- AlterTable
ALTER TABLE "device_tokens" ADD COLUMN     "token" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "employee_contracts" ADD COLUMN     "employeeSignatureUrl" TEXT,
ADD COLUMN     "rejectReason" TEXT,
ADD COLUMN     "scannedDocumentUrl" TEXT;

-- AlterTable
ALTER TABLE "newsfeed_posts" ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedById" UUID,
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "status" "NewsfeedPostStatus" NOT NULL DEFAULT 'APPROVED';

-- CreateTable
CREATE TABLE "feedbacks" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "senderUserId" UUID NOT NULL,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "status" "FeedbackStatus" NOT NULL DEFAULT 'SEND',
    "reason" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "img" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "feedbacks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "feedbacks_senderUserId_createdAt_idx" ON "feedbacks"("senderUserId", "createdAt");

-- CreateIndex
CREATE INDEX "feedbacks_status_createdAt_idx" ON "feedbacks"("status", "createdAt");

-- CreateIndex
CREATE INDEX "feedbacks_isAnonymous_idx" ON "feedbacks"("isAnonymous");

-- CreateIndex
CREATE INDEX "attendance_records_checkOutPhotoFileId_idx" ON "attendance_records"("checkOutPhotoFileId");

-- CreateIndex
CREATE INDEX "newsfeed_posts_departmentId_status_idx" ON "newsfeed_posts"("departmentId", "status");

-- CreateIndex
CREATE INDEX "newsfeed_posts_authorId_status_idx" ON "newsfeed_posts"("authorId", "status");

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_checkOutPhotoFileId_fkey" FOREIGN KEY ("checkOutPhotoFileId") REFERENCES "uploaded_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "newsfeed_posts" ADD CONSTRAINT "newsfeed_posts_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedbacks" ADD CONSTRAINT "feedbacks_senderUserId_fkey" FOREIGN KEY ("senderUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
