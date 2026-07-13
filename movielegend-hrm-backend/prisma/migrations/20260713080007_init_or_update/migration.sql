/*
  Warnings:

  - You are about to drop the column `categoryId` on the `assets` table. All the data in the column will be lost.
  - You are about to drop the column `purchaseDate` on the `assets` table. All the data in the column will be lost.
  - You are about to drop the column `purchasePrice` on the `assets` table. All the data in the column will be lost.
  - You are about to drop the column `serialNumber` on the `assets` table. All the data in the column will be lost.
  - You are about to drop the column `warrantyEndDate` on the `assets` table. All the data in the column will be lost.
  - You are about to drop the column `departmentId` on the `attendance_locations` table. All the data in the column will be lost.
  - You are about to drop the column `actualAssetStatus` on the `inventory_check_items` table. All the data in the column will be lost.
  - You are about to drop the column `assetId` on the `inventory_check_items` table. All the data in the column will be lost.
  - You are about to drop the column `expectedAssetStatus` on the `inventory_check_items` table. All the data in the column will be lost.
  - You are about to drop the `asset_categories` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "AcknowledgementStatus" AS ENUM ('PENDING', 'AGREED', 'DISAGREED');

-- CreateEnum
CREATE TYPE "ChatGroupType" AS ENUM ('DEPARTMENT', 'TASK', 'DIRECT', 'CUSTOM');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'ACCOUNT_APPROVAL_REQUESTED';

-- DropForeignKey
ALTER TABLE "assets" DROP CONSTRAINT "assets_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "attendance_locations" DROP CONSTRAINT "attendance_locations_departmentId_fkey";

-- DropForeignKey
ALTER TABLE "inventory_check_items" DROP CONSTRAINT "inventory_check_items_assetId_fkey";

-- DropIndex
DROP INDEX "assets_serialNumber_key";

-- DropIndex
DROP INDEX "assets_warehouseId_assetStatus_idx";

-- AlterTable
ALTER TABLE "assets" DROP COLUMN "categoryId",
DROP COLUMN "purchaseDate",
DROP COLUMN "purchasePrice",
DROP COLUMN "serialNumber",
DROP COLUMN "warrantyEndDate",
ADD COLUMN     "conditionNote" TEXT,
ADD COLUMN     "departmentId" UUID,
ADD COLUMN     "imageUrl" TEXT;

-- AlterTable
ALTER TABLE "attendance_locations" DROP COLUMN "departmentId",
ADD COLUMN     "allowedIps" TEXT[],
ADD COLUMN     "branchId" UUID;

-- AlterTable
ALTER TABLE "branches" ADD COLUMN     "allowedIps" TEXT[],
ADD COLUMN     "allowedRadius" INTEGER DEFAULT 100,
ADD COLUMN     "latitude" DECIMAL(10,7),
ADD COLUMN     "longitude" DECIMAL(10,7);

-- AlterTable
ALTER TABLE "employee_contracts" ADD COLUMN     "employeeAcknowledgedAt" TIMESTAMP(3),
ADD COLUMN     "employeeAcknowledgedByIp" TEXT,
ADD COLUMN     "employeeAcknowledgementNote" TEXT,
ADD COLUMN     "employeeAcknowledgementStatus" "AcknowledgementStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "employee_documents" ADD COLUMN     "acknowledgedAt" TIMESTAMP(3),
ADD COLUMN     "acknowledgedByIp" TEXT,
ADD COLUMN     "acknowledgementNote" TEXT,
ADD COLUMN     "acknowledgementStatus" "AcknowledgementStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "employee_profiles" ADD COLUMN     "idCardBackUrl" TEXT,
ADD COLUMN     "idCardFrontUrl" TEXT;

-- AlterTable
ALTER TABLE "inventory_check_items" DROP COLUMN "actualAssetStatus",
DROP COLUMN "assetId",
DROP COLUMN "expectedAssetStatus";

-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "groupLeaderId" UUID;

-- DropTable
DROP TABLE "asset_categories";

-- CreateTable
CREATE TABLE "newsfeed_posts" (
    "id" UUID NOT NULL,
    "authorId" UUID NOT NULL,
    "departmentId" UUID,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "attachments" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "newsfeed_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_comments" (
    "id" UUID NOT NULL,
    "postId" UUID NOT NULL,
    "authorId" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "post_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_likes" (
    "id" UUID NOT NULL,
    "postId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_groups" (
    "id" UUID NOT NULL,
    "departmentId" UUID,
    "taskId" UUID,
    "name" TEXT,
    "type" "ChatGroupType" NOT NULL DEFAULT 'CUSTOM',
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_group_members" (
    "id" UUID NOT NULL,
    "groupId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_group_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" UUID NOT NULL,
    "groupId" UUID NOT NULL,
    "senderId" UUID NOT NULL,
    "content" TEXT,
    "fileUrl" TEXT,
    "fileType" TEXT,
    "fileName" TEXT,
    "mentions" UUID[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_AttendanceLocationDepartments" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_AttendanceLocationDepartments_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "post_likes_postId_userId_key" ON "post_likes"("postId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "chat_groups_departmentId_key" ON "chat_groups"("departmentId");

-- CreateIndex
CREATE UNIQUE INDEX "chat_groups_taskId_key" ON "chat_groups"("taskId");

-- CreateIndex
CREATE UNIQUE INDEX "chat_group_members_groupId_userId_key" ON "chat_group_members"("groupId", "userId");

-- CreateIndex
CREATE INDEX "_AttendanceLocationDepartments_B_index" ON "_AttendanceLocationDepartments"("B");

-- AddForeignKey
ALTER TABLE "attendance_locations" ADD CONSTRAINT "attendance_locations_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_groupLeaderId_fkey" FOREIGN KEY ("groupLeaderId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "newsfeed_posts" ADD CONSTRAINT "newsfeed_posts_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "newsfeed_posts" ADD CONSTRAINT "newsfeed_posts_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_comments" ADD CONSTRAINT "post_comments_postId_fkey" FOREIGN KEY ("postId") REFERENCES "newsfeed_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_comments" ADD CONSTRAINT "post_comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_likes" ADD CONSTRAINT "post_likes_postId_fkey" FOREIGN KEY ("postId") REFERENCES "newsfeed_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_likes" ADD CONSTRAINT "post_likes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_groups" ADD CONSTRAINT "chat_groups_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_groups" ADD CONSTRAINT "chat_groups_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_group_members" ADD CONSTRAINT "chat_group_members_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "chat_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_group_members" ADD CONSTRAINT "chat_group_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "chat_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AttendanceLocationDepartments" ADD CONSTRAINT "_AttendanceLocationDepartments_A_fkey" FOREIGN KEY ("A") REFERENCES "attendance_locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AttendanceLocationDepartments" ADD CONSTRAINT "_AttendanceLocationDepartments_B_fkey" FOREIGN KEY ("B") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
