import type { AuthUser } from '../types/user.types';
import type { NotificationTargetDto } from '../types/notification.types';

export function stringMeta(metadata: Record<string, unknown> | null | undefined, key: string): string | null {
  const value = metadata?.[key];
  return typeof value === 'string' ? value : null;
}

export function roleBase(user: AuthUser | null): '/admin' | '/leader' | '/employee' | '/warehouse-manager' {
  if (user?.roles.includes('ADMIN') || user?.roles.includes('HR') || user?.roles.includes('ACCOUNTANT')) return '/admin';
  if (user?.roles.includes('WAREHOUSE_MANAGER')) return '/warehouse-manager';
  if (user?.roles.includes('LEADER')) return '/leader';
  return '/employee';
}

export function notificationRoute(target: NotificationTargetDto, user: AuthUser | null): string | null {
  const notification = target.notification;
  const taskId = notification.taskId ?? stringMeta(notification.metadata, 'taskId');
  const requestId = stringMeta(notification.metadata, 'requestId');
  const assetId = stringMeta(notification.metadata, 'assetId');
  const issueId = stringMeta(notification.metadata, 'issueId');
  const approvalRequestId = stringMeta(notification.metadata, 'approvalRequestId');
  const contractId = stringMeta(notification.metadata, 'contractId');
  const transferId = stringMeta(notification.metadata, 'transferId');
  const incidentId = stringMeta(notification.metadata, 'incidentId');
  const groupId = stringMeta(notification.metadata, 'groupId');
  const violationId = stringMeta(notification.metadata, 'violationId');
  const postId = stringMeta(notification.metadata, 'postId');
  
  const base = roleBase(user);
  
  if (notification.type === 'ACCOUNT_APPROVAL_REQUESTED' && approvalRequestId) return `${base}/approvals/${approvalRequestId}`;
  if (requestId) {
    if (base === '/admin') return `/admin/requests/${requestId}`;
    if (base === '/leader') return `/leader/employee-requests/${requestId}`;
    if (base === '/employee') return `/employee/requests/${requestId}`;
  }
  if (notification.type.startsWith('TASK_') && taskId) return `${base}/tasks/${taskId}`;
  if (notification.type.startsWith('CROSS_DEPARTMENT_') && requestId) return `${base}/cross-department/${requestId}`;
  if (notification.type.startsWith('ASSET_INCIDENT_') && incidentId) return `${base}/asset-incidents/${incidentId}`;
  if (notification.type.startsWith('ASSET_') && assetId) return `${base}/assets/${assetId}`;
  if (notification.type.startsWith('MATERIAL_ISSUE_') && issueId) return `${base}/material-issues/${issueId}`;
  if (notification.type.startsWith('STOCK_TRANSFER_') && transferId) return `${base}/stock-transfers/${transferId}`;
  if (notification.type.startsWith('CONTRACT_') && contractId) return `${base}/contracts/${contractId}`;
  if (notification.type.startsWith('CHAT_') && groupId) return `${base}/chat/${groupId}`;
  if (notification.type.startsWith('VIOLATION_') && violationId) return `${base}/violations/${violationId}`;
  if (notification.type.startsWith('NEWSFEED_POST_') && postId) {
    if (notification.type === 'NEWSFEED_POST_PENDING') {
      return `${base}/newsfeed/pending/${postId}`;
    }
    return `${base}/newsfeed`; // Could navigate to specific post in newsfeed if supported
  }
  
  return null;
}

export function getNotificationIcon(type: string): any {
  if (type.startsWith('TASK_')) return 'clipboard-check-outline';
  if (type.startsWith('ASSET_INCIDENT_')) return 'alert-circle-outline';
  if (type.startsWith('ASSET_')) return 'desktop-mac';
  if (type.startsWith('MATERIAL_ISSUE_') || type.startsWith('STOCK_')) return 'package-variant-closed';
  if (type.startsWith('PAYROLL_') || type.startsWith('PAYSLIP_')) return 'cash-multiple';
  if (type.startsWith('DOCUMENT_') || type.startsWith('CONTRACT_')) return 'file-document-outline';
  if (type.startsWith('CHAT_')) return 'chat-processing-outline';
  if (type.startsWith('VIOLATION_')) return 'gavel';
  if (type.startsWith('NEWSFEED_')) return 'newspaper-variant-outline';
  if (type === 'ACCOUNT_APPROVAL_REQUESTED') return 'account-check-outline';
  if (type === 'SYSTEM') return 'bell-outline';
  
  return 'bell-ring-outline';
}

export function getNotificationColor(type: string): string {
  if (type.startsWith('TASK_')) return '#3b82f6'; // blue
  if (type.startsWith('ASSET_')) return '#8b5cf6'; // purple
  if (type.startsWith('MATERIAL_ISSUE_')) return '#f59e0b'; // amber
  if (type.startsWith('PAYROLL_')) return '#10b981'; // emerald
  if (type === 'ACCOUNT_APPROVAL_REQUESTED') return '#ec4899'; // pink
  if (type === 'NEWSFEED_POST_PENDING') return '#f59e0b'; // amber
  if (type.includes('REJECTED') || type.includes('FAILED')) return '#ef4444'; // red
  if (type.includes('APPROVED') || type.includes('CONFIRMED')) return '#10b981'; // emerald
  
  return '#64748b'; // slate
}
