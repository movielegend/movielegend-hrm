export type NotificationType =
  | 'TASK_ASSIGNED'
  | 'TASK_UPDATED'
  | 'TASK_COMMENTED'
  | 'TASK_REVIEW_REQUESTED'
  | 'TASK_EXTENSION_REQUESTED'
  | 'CROSS_DEPARTMENT_REQUESTED'
  | 'CROSS_DEPARTMENT_UPDATED'
  | 'MATERIAL_ISSUE_REQUESTED'
  | 'MATERIAL_ISSUE_APPROVED'
  | 'MATERIAL_ISSUED'
  | 'STOCK_TRANSFER_APPROVED'
  | 'STOCK_TRANSFER_SHIPPED'
  | 'STOCK_TRANSFER_RECEIVED'
  | 'ASSET_ASSIGNED'
  | 'ASSET_ASSIGNMENT_CONFIRMED'
  | 'ASSET_RETURN_REQUESTED'
  | 'ASSET_RETURNED'
  | 'ASSET_INCIDENT_REPORTED'
  | 'ASSET_INCIDENT_RESOLVED'
  | 'PAYROLL_CALCULATED'
  | 'PAYROLL_REVIEW_REQUIRED'
  | 'PAYROLL_APPROVED'
  | 'PAYSLIP_AVAILABLE'
  | 'BONUS_APPROVED'
  | 'DEDUCTION_APPROVED'
  | 'VIOLATION_CONFIRMED'
  | 'DISCIPLINARY_ACTION_APPROVED'
  | 'DOCUMENT_EXPIRING'
  | 'DOCUMENT_VERIFICATION_REQUIRED'
  | 'DOCUMENT_VERIFIED'
  | 'DOCUMENT_REJECTED'
  | 'CONTRACT_APPROVAL_REQUIRED'
  | 'CONTRACT_APPROVED'
  | 'CONTRACT_SIGNATURE_REQUIRED'
  | 'CONTRACT_SIGNED'
  | 'CONTRACT_EXPIRING'
  | 'CONTRACT_TERMINATED'
  | 'KPI_ASSIGNED'
  | 'KPI_SELF_REVIEW_REQUIRED'
  | 'KPI_LEADER_REVIEW_REQUIRED'
  | 'KPI_FINALIZED'
  | 'PERFORMANCE_REVIEW_OPENED'
  | 'PERFORMANCE_REVIEW_STAGE_CHANGED'
  | 'PERFORMANCE_REVIEW_FINALIZED'
  | 'SYSTEM';

export type DevicePlatform = 'IOS' | 'ANDROID' | 'WEB';

export interface NotificationDto {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  taskId?: string | null;
  dedupKey?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export interface NotificationTargetDto {
  id: string;
  notificationId: string;
  userId: string;
  readAt?: string | null;
  createdAt: string;
  notification: NotificationDto;
}

export interface UnreadCountDto {
  count: number;
}

export interface RegisterDeviceTokenPayload {
  token: string;
  platform: DevicePlatform;
  deviceId?: string;
}

export interface DeviceTokenDto {
  id: string;
  userId: string;
  platform: DevicePlatform;
  deviceId?: string | null;
  lastSeenAt?: string;
  revokedAt?: string | null;
}
