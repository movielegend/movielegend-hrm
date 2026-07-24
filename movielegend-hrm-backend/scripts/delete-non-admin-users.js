const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- Đang kiểm tra các tài khoản Admin ---');
  
  const adminRoles = await prisma.role.findMany({
    where: {
      OR: [
        { code: { contains: 'ADMIN', mode: 'insensitive' } },
        { name: { contains: 'Admin', mode: 'insensitive' } }
      ]
    }
  });
  
  const adminRoleIds = adminRoles.map(r => r.id);
  
  const adminUserRoles = await prisma.userRole.findMany({
    where: { roleId: { in: adminRoleIds } },
    select: { userId: true }
  });
  
  const adminUserIds = Array.from(new Set(adminUserRoles.map(ur => ur.userId)));
  console.log(`--> Tìm thấy ${adminUserIds.length} tài khoản Admin. Các tài khoản này sẽ được GIỮ LẠI.`);
  
  if (adminUserIds.length === 0) {
    console.error('Lỗi: Không tìm thấy tài khoản Admin nào! Dừng thao tác để đảm bảo an toàn.');
    return;
  }

  const primaryAdminId = adminUserIds[0];

  const nonAdminUsers = await prisma.user.findMany({
    where: { id: { notIn: adminUserIds } },
    select: { id: true, userCode: true }
  });

  const nonAdminIds = nonAdminUsers.map(u => u.id);
  console.log(`--> Tìm thấy ${nonAdminIds.length} tài khoản (Leader/Nhân viên) chuẩn bị XÓA.`);

  if (nonAdminIds.length === 0) {
    console.log('Không có tài khoản nhân sự/leader nào cần xóa.');
    return;
  }

  console.log('--- 1. Đang gỡ tham chiếu phòng ban & kho hàng & hệ thống ---');
  await prisma.department.updateMany({
    where: { leaderUserId: { in: nonAdminIds } },
    data: { leaderUserId: null }
  });

  await prisma.warehouse.updateMany({
    where: { managerUserId: { in: nonAdminIds } },
    data: { managerUserId: null }
  });

  // Chuyển quyền người tạo Mẫu hợp đồng / KPI sang cho Admin chính
  await prisma.contractTemplate.updateMany({
    where: { createdById: { in: nonAdminIds } },
    data: { createdById: primaryAdminId }
  });

  await prisma.contractTemplateVersion.updateMany({
    where: { createdById: { in: nonAdminIds } },
    data: { createdById: primaryAdminId }
  });

  await prisma.kpiTemplate.updateMany({
    where: { createdById: { in: nonAdminIds } },
    data: { createdById: primaryAdminId }
  }).catch(() => {});

  await prisma.uploadedFile.updateMany({
    where: { uploadedById: { in: nonAdminIds } },
    data: { uploadedById: null }
  }).catch(() => {});

  console.log('--- 2. Đang xóa toàn bộ Hợp đồng lao động của nhân viên ---');
  const contractsToDelete = await prisma.employeeContract.findMany({
    where: { OR: [{ userId: { in: nonAdminIds } }, { createdById: { in: nonAdminIds } }] },
    select: { id: true }
  });
  const contractIds = contractsToDelete.map(c => c.id);

  if (contractIds.length > 0) {
    await prisma.contractSignature.deleteMany({ where: { contractId: { in: contractIds } } });
    await prisma.employeeContract.deleteMany({ where: { id: { in: contractIds } } });
  }
  await prisma.contractSignature.deleteMany({ where: { signerUserId: { in: nonAdminIds } } });

  console.log('--- 3. Đang xóa toàn bộ dữ liệu Công việc (Tasks) ---');
  const tasksToDelete = await prisma.task.findMany({
    where: {
      OR: [
        { createdByUserId: { in: nonAdminIds } },
        { groupLeaderId: { in: nonAdminIds } },
        { assignments: { some: { userId: { in: nonAdminIds } } } },
        { assignments: { some: { assignedByUserId: { in: nonAdminIds } } } }
      ]
    },
    select: { id: true }
  });
  const taskIds = tasksToDelete.map(t => t.id);

  if (taskIds.length > 0) {
    await prisma.notification.updateMany({ where: { taskId: { in: taskIds } }, data: { taskId: null } });
    await prisma.crossDepartmentRequest.deleteMany({ where: { taskId: { in: taskIds } } });
    await prisma.taskExtensionRequest.deleteMany({ where: { taskId: { in: taskIds } } });
    await prisma.taskStatusHistory.deleteMany({ where: { taskId: { in: taskIds } } });
    await prisma.taskAttachment.deleteMany({ where: { taskId: { in: taskIds } } });
    await prisma.taskComment.deleteMany({ where: { taskId: { in: taskIds } } });
    await prisma.taskAssignment.deleteMany({ where: { taskId: { in: taskIds } } });
    await prisma.taskTarget.deleteMany({ where: { taskId: { in: taskIds } } });
    await prisma.task.deleteMany({ where: { id: { in: taskIds } } });
  }

  await prisma.taskExtensionRequest.deleteMany({ where: { OR: [{ requestedByUserId: { in: nonAdminIds } }, { decidedByUserId: { in: nonAdminIds } }] } });
  await prisma.taskAssignment.deleteMany({ where: { OR: [{ userId: { in: nonAdminIds } }, { assignedByUserId: { in: nonAdminIds } }, { reviewedByUserId: { in: nonAdminIds } }] } });
  await prisma.taskComment.deleteMany({ where: { userId: { in: nonAdminIds } } });
  await prisma.taskAttachment.deleteMany({ where: { uploadedByUserId: { in: nonAdminIds } } });
  await prisma.taskStatusHistory.deleteMany({ where: { actorUserId: { in: nonAdminIds } } });
  await prisma.taskGroupMember.deleteMany({ where: { userId: { in: nonAdminIds } } });
  await prisma.taskGroup.deleteMany({ where: { createdByUserId: { in: nonAdminIds } } });
  await prisma.crossDepartmentRequest.deleteMany({ where: { OR: [{ createdByUserId: { in: nonAdminIds } }, { decidedByUserId: { in: nonAdminIds } }] } });

  console.log('--- 4. Đang xóa dữ liệu Kho & Vật tư & Tài sản ---');
  const returns = await prisma.materialReturn.findMany({ where: { OR: [{ returnedByUserId: { in: nonAdminIds } }, { receivedById: { in: nonAdminIds } }] }, select: { id: true } });
  if (returns.length > 0) {
    await prisma.materialReturnItem.deleteMany({ where: { materialReturnId: { in: returns.map(r => r.id) } } });
    await prisma.materialReturn.deleteMany({ where: { id: { in: returns.map(r => r.id) } } });
  }

  const issues = await prisma.materialIssue.findMany({ where: { OR: [{ issuedToUserId: { in: nonAdminIds } }, { requestedById: { in: nonAdminIds } }, { approvedById: { in: nonAdminIds } }, { issuedById: { in: nonAdminIds } }] }, select: { id: true } });
  if (issues.length > 0) {
    await prisma.materialIssueItem.deleteMany({ where: { materialIssueId: { in: issues.map(i => i.id) } } });
    await prisma.materialIssue.deleteMany({ where: { id: { in: issues.map(i => i.id) } } });
  }

  const transfers = await prisma.stockTransfer.findMany({ where: { OR: [{ requestedById: { in: nonAdminIds } }, { approvedById: { in: nonAdminIds } }, { shippedById: { in: nonAdminIds } }, { receivedById: { in: nonAdminIds } }] }, select: { id: true } });
  if (transfers.length > 0) {
    await prisma.stockTransferItem.deleteMany({ where: { transferId: { in: transfers.map(t => t.id) } } });
    await prisma.stockTransfer.deleteMany({ where: { id: { in: transfers.map(t => t.id) } } });
  }

  const receipts = await prisma.stockReceipt.findMany({ where: { OR: [{ createdById: { in: nonAdminIds } }, { approvedById: { in: nonAdminIds } }] }, select: { id: true } });
  if (receipts.length > 0) {
    await prisma.stockReceiptItem.deleteMany({ where: { receiptId: { in: receipts.map(r => r.id) } } });
    await prisma.stockReceipt.deleteMany({ where: { id: { in: receipts.map(r => r.id) } } });
  }

  await prisma.stockTransaction.deleteMany({ where: { performedById: { in: nonAdminIds } } });
  
  const checks = await prisma.inventoryCheck.findMany({ where: { OR: [{ createdById: { in: nonAdminIds } }, { approvedById: { in: nonAdminIds } }] }, select: { id: true } });
  if (checks.length > 0) {
    await prisma.inventoryCheckItem.deleteMany({ where: { inventoryCheckId: { in: checks.map(c => c.id) } } });
    await prisma.inventoryCheck.deleteMany({ where: { id: { in: checks.map(c => c.id) } } });
  }

  const assetAssignments = await prisma.assetAssignment.findMany({ where: { OR: [{ assignedToUserId: { in: nonAdminIds } }, { assignedById: { in: nonAdminIds } }] }, select: { id: true } });
  if (assetAssignments.length > 0) {
    await prisma.assetAssignmentHistory.deleteMany({ where: { assetAssignmentId: { in: assetAssignments.map(a => a.id) } } });
    await prisma.assetAssignment.deleteMany({ where: { id: { in: assetAssignments.map(a => a.id) } } });
  }
  await prisma.assetAssignmentHistory.deleteMany({ where: { performedById: { in: nonAdminIds } } });
  await prisma.assetIncidentReport.deleteMany({ where: { OR: [{ reportedById: { in: nonAdminIds } }, { resolvedById: { in: nonAdminIds } }] } });
  await prisma.assetMaintenanceRecord.deleteMany({ where: { createdById: { in: nonAdminIds } } });

  console.log('--- 5. Đang xóa Chấm công & Ca làm & Nghỉ phép ---');
  const attendances = await prisma.attendanceRecord.findMany({ where: { userId: { in: nonAdminIds } }, select: { id: true } });
  if (attendances.length > 0) {
    await prisma.attendanceVerification.deleteMany({ where: { attendanceRecordId: { in: attendances.map(a => a.id) } } });
    await prisma.attendanceAdjustment.deleteMany({ where: { attendanceRecordId: { in: attendances.map(a => a.id) } } });
    await prisma.attendanceRecord.deleteMany({ where: { id: { in: attendances.map(a => a.id) } } });
  }
  await prisma.attendanceAdjustment.deleteMany({ where: { OR: [{ userId: { in: nonAdminIds } }, { decidedByUserId: { in: nonAdminIds } }] } });
  await prisma.shiftAssignment.deleteMany({ where: { OR: [{ userId: { in: nonAdminIds } }, { assignedByUserId: { in: nonAdminIds } }] } });
  await prisma.shiftRegistration.deleteMany({ where: { OR: [{ userId: { in: nonAdminIds } }, { decidedByUserId: { in: nonAdminIds } }] } });
  await prisma.shiftSwap.deleteMany({ where: { OR: [{ requesterUserId: { in: nonAdminIds } }, { targetUserId: { in: nonAdminIds } }, { decidedByUserId: { in: nonAdminIds } }] } });
  await prisma.locationTracking.deleteMany({ where: { userId: { in: nonAdminIds } } });

  await prisma.leaveBalance.deleteMany({ where: { userId: { in: nonAdminIds } } });
  await prisma.leaveRequest.deleteMany({ where: { OR: [{ userId: { in: nonAdminIds } }, { decidedByUserId: { in: nonAdminIds } }] } });
  await prisma.overtimeRequest.deleteMany({ where: { OR: [{ userId: { in: nonAdminIds } }, { decidedByUserId: { in: nonAdminIds } }] } });
  await prisma.employeeRequest.deleteMany({ where: { OR: [{ userId: { in: nonAdminIds } }, { currentApproverUserId: { in: nonAdminIds } }, { decidedByUserId: { in: nonAdminIds } }] } });

  console.log('--- 6. Đang xóa Lương & Hồ sơ nhân sự ---');
  const payrolls = await prisma.payroll.findMany({ where: { userId: { in: nonAdminIds } }, select: { id: true } });
  if (payrolls.length > 0) {
    await prisma.payrollItem.deleteMany({ where: { payrollId: { in: payrolls.map(p => p.id) } } });
    await prisma.payrollCalculationSnapshot.deleteMany({ where: { payrollId: { in: payrolls.map(p => p.id) } } });
    await prisma.payroll.deleteMany({ where: { id: { in: payrolls.map(p => p.id) } } });
  }
  await prisma.payrollPeriod.deleteMany({ where: { OR: [{ createdById: { in: nonAdminIds } }, { reviewedById: { in: nonAdminIds } }, { approvedById: { in: nonAdminIds } }, { lockedById: { in: nonAdminIds } }] } });

  await prisma.employeeSalaryComponent.deleteMany({ where: { OR: [{ userId: { in: nonAdminIds } }, { createdById: { in: nonAdminIds } }] } });
  await prisma.salaryProfile.deleteMany({ where: { OR: [{ userId: { in: nonAdminIds } }, { createdById: { in: nonAdminIds } }] } });
  await prisma.employeeBonus.deleteMany({ where: { OR: [{ userId: { in: nonAdminIds } }, { approvedById: { in: nonAdminIds } }, { createdById: { in: nonAdminIds } }] } });
  await prisma.employeeDeduction.deleteMany({ where: { OR: [{ userId: { in: nonAdminIds } }, { approvedById: { in: nonAdminIds } }, { createdById: { in: nonAdminIds } }] } });

  const profiles = await prisma.employeeProfile.findMany({ where: { userId: { in: nonAdminIds } }, select: { id: true } });
  if (profiles.length > 0) {
    await prisma.employeeDocument.deleteMany({ where: { employeeId: { in: profiles.map(p => p.id) } } });
    await prisma.employeeBankAccount.deleteMany({ where: { employeeId: { in: profiles.map(p => p.id) } } });
    await prisma.employeeProfile.deleteMany({ where: { id: { in: profiles.map(p => p.id) } } });
  }
  await prisma.employeeDocument.deleteMany({ where: { OR: [{ userId: { in: nonAdminIds } }, { verifiedById: { in: nonAdminIds } }] } });

  if (prisma.newsfeedComment) await prisma.newsfeedComment.deleteMany({ where: { authorId: { in: nonAdminIds } } }).catch(() => {});
  if (prisma.newsfeedLike) await prisma.newsfeedLike.deleteMany({ where: { userId: { in: nonAdminIds } } }).catch(() => {});
  if (prisma.newsfeedPost) await prisma.newsfeedPost.deleteMany({ where: { authorId: { in: nonAdminIds } } }).catch(() => {});

  await prisma.auditLog.deleteMany({ where: { actorUserId: { in: nonAdminIds } } });
  await prisma.chatGroupMember.deleteMany({ where: { userId: { in: nonAdminIds } } });
  await prisma.chatMessage.deleteMany({ where: { senderId: { in: nonAdminIds } } });
  await prisma.notificationTarget.deleteMany({ where: { userId: { in: nonAdminIds } } });
  await prisma.notificationDelivery.deleteMany({ where: { userId: { in: nonAdminIds } } });
  await prisma.deviceToken.deleteMany({ where: { userId: { in: nonAdminIds } } });
  await prisma.refreshSession.deleteMany({ where: { userId: { in: nonAdminIds } } });
  
  const faceProfiles = await prisma.faceProfile.findMany({ where: { userId: { in: nonAdminIds } }, select: { id: true } });
  if (faceProfiles.length > 0) {
    await prisma.faceRegistrationImage.deleteMany({ where: { faceProfileId: { in: faceProfiles.map(f => f.id) } } });
    await prisma.faceProfile.deleteMany({ where: { id: { in: faceProfiles.map(f => f.id) } } });
  }

  const approvals = await prisma.userApprovalRequest.findMany({ where: { OR: [{ userId: { in: nonAdminIds } }, { decidedByUserId: { in: nonAdminIds } }] }, select: { id: true } });
  if (approvals.length > 0) {
    await prisma.approvalHistory.deleteMany({ where: { approvalRequestId: { in: approvals.map(a => a.id) } } });
    await prisma.userApprovalRequest.deleteMany({ where: { id: { in: approvals.map(a => a.id) } } });
  }
  await prisma.approvalHistory.deleteMany({ where: { actorUserId: { in: nonAdminIds } } });
  await prisma.departmentMember.deleteMany({ where: { userId: { in: nonAdminIds } } });
  await prisma.userRole.deleteMany({ where: { userId: { in: nonAdminIds } } });

  // Cuối cùng: Xóa User
  const deletedUsers = await prisma.user.deleteMany({
    where: { id: { in: nonAdminIds } }
  });

  console.log(`✅ ĐÃ XÓA THÀNH CÔNG ${deletedUsers.count} TÀI KHOẢN VÀ TOÀN BỘ DỮ LIỆU ĐI KÈM!`);
  console.log('Hệ thống hiện tại chỉ giữ lại các tài khoản Admin.');
}

main()
  .catch(e => {
    console.error('Lỗi khi thực thi xóa:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
