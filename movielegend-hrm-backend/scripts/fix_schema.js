const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'prisma/schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

// Fix Cascade Deletes to Restrict
const restrictModels = [
  'AttendanceRecord', 'EmployeeProfile', 'EmployeeDocument', 
  'LeaveRequest', 'OvertimeRequest', 'EmployeeContract', 'Payroll'
];

for (const model of restrictModels) {
  const modelRegex = new RegExp(`(model ${model} {[\\s\\S]*?)(onDelete: Cascade)([\\s\\S]*?})`, 'g');
  schema = schema.replace(modelRegex, '$1onDelete: Restrict$3');
}

// Fix Cascade Deletes to SetNull
const setNullModels = [
  'ChatMessage', 'NewsfeedPost', 'PostComment', 'AuditLog'
];

for (const model of setNullModels) {
  const modelRegex = new RegExp(`(model ${model} {[\\s\\S]*?)(onDelete: SetNull)([\\s\\S]*?})`, 'g');
  schema = schema.replace(modelRegex, '$1onDelete: Restrict$3');
}

// Add indexes
const indexesToAdd = {
  'ChatMessage': '  @@index([groupId, createdAt])\n  @@index([senderId])',
  'AuditLog': '  @@index([actorUserId])\n  @@index([entityType, entityId])\n  @@index([createdAt])',
  'PostComment': '  @@index([postId])',
  'Department': '  @@index([branchId])\n  @@index([parentId])\n  @@index([leaderUserId])',
  'DepartmentMember': '  @@index([userId])\n  @@index([positionId])',
  'EmployeeDocument': '  @@index([employeeId])\n  @@index([verifiedById])',
  'UserApprovalRequest': '  @@index([userId])\n  @@index([requestedDepartmentId, status])',
  'ShiftRegistration': '  @@index([userId])\n  @@index([workDate])',
  'ShiftSwap': '  @@index([requesterUserId])\n  @@index([targetUserId])',
  'AttendanceAdjustment': '  @@index([userId])\n  @@index([attendanceRecordId])',
  'LeaveRequest': '  @@index([userId])',
  'OvertimeRequest': '  @@index([userId])',
  'StockReceiptItem': '  @@index([receiptId])\n  @@index([materialId])',
  'MaterialIssueItem': '  @@index([materialIssueId])\n  @@index([materialId])',
  'MaterialReturnItem': '  @@index([materialReturnId])\n  @@index([materialId])',
  'StockTransferItem': '  @@index([transferId])\n  @@index([materialId])',
  'OtpToken': '  @@index([userId])',
  'CompanyHoliday': '  @@index([companyId, date])',
  'ChatGroupMember': '  @@index([userId])',
  'AssetAssignmentHistory': '  @@index([assetAssignmentId])',
  'ContractSignature': '  @@index([signerUserId])',
  'EmployeeKpiResult': '  @@index([criteriaId])'
};

for (const [model, indexes] of Object.entries(indexesToAdd)) {
  const modelRegex = new RegExp(`(model ${model} {[\\s\\S]*?)(\\n})`);
  schema = schema.replace(modelRegex, `$1\n${indexes}$2`);
}

fs.writeFileSync(schemaPath, schema);
console.log('Schema updated successfully!');
