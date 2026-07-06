import type { AuthUser } from '../../types/user.types';
import type { NotificationTargetDto } from '../../types/notification.types';
import type { TaskAssignmentDto, TaskAssignmentStatus, TaskDto, TaskPriority, TaskStatus } from '../../types/task.types';
import { toDate } from '../../utils/date-time';

export function myAssignment(task: TaskDto, userId?: string): TaskAssignmentDto | undefined {
  return task.assignments?.find((assignment) => assignment.userId === userId);
}

export function canAcceptAssignment(status?: TaskAssignmentStatus): boolean {
  return status === 'NEW';
}

export function canStartAssignment(status?: TaskAssignmentStatus): boolean {
  return status === 'ACCEPTED';
}

export function canUpdateProgress(status?: TaskAssignmentStatus): boolean {
  return status === 'ACCEPTED' || status === 'IN_PROGRESS' || status === 'REJECTED';
}

export function canSubmitAssignment(status?: TaskAssignmentStatus): boolean {
  return status === 'IN_PROGRESS' || status === 'REJECTED';
}

export function isReadOnlyStatus(status?: TaskStatus | TaskAssignmentStatus): boolean {
  return status === 'WAITING_REVIEW' || status === 'COMPLETED' || status === 'CANCELLED';
}

export function isOverdue(dueAt?: string | null, status?: TaskStatus | TaskAssignmentStatus, now = new Date()): boolean {
  const dueDate = toDate(dueAt);
  if (!dueDate) return false;
  if (status === 'COMPLETED' || status === 'CANCELLED') return false;
  return dueDate.getTime() < now.getTime();
}

export function taskDeadlineLabel(dueAt?: string | null, now = new Date()): string {
  const dueDate = toDate(dueAt);
  if (!dueDate) return 'No deadline';
  const diffMs = dueDate.getTime() - now.getTime();
  const absMinutes = Math.max(1, Math.round(Math.abs(diffMs) / 60_000));
  const days = Math.floor(absMinutes / 1440);
  const hours = Math.floor((absMinutes % 1440) / 60);
  const minutes = absMinutes % 60;
  const text = days > 0 ? `${days}d ${hours}h` : hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  return diffMs >= 0 ? `Due in ${text}` : `Overdue ${text}`;
}

export function priorityTone(priority?: TaskPriority): 'neutral' | 'success' | 'warning' | 'danger' | 'info' {
  if (priority === 'URGENT') return 'danger';
  if (priority === 'HIGH') return 'warning';
  if (priority === 'LOW') return 'info';
  return 'neutral';
}

export function mapTaskError(code: string, fallback: string): string {
  const map: Record<string, string> = {
    TASK_NOT_FOUND: 'Khong tim thay cong viec.',
    TASK_ASSIGNMENT_NOT_FOUND: 'Khong tim thay phan viec.',
    TASK_TARGET_EMPTY: 'Cong viec can it nhat mot target.',
    TASK_ASSIGNMENT_MISMATCH: 'Phan viec khong thuoc task nay.',
    TASK_FORBIDDEN: 'Ban khong co quyen thao tac cong viec nay.',
    TASK_ASSIGNMENT_OWNER_ONLY: 'Chi nguoi duoc giao moi thao tac phan viec nay.',
    TASK_ASSIGNMENT_NOT_EDITABLE: 'Trang thai hien tai khong cho cap nhat tien do.',
    TASK_EXTENSION_NOT_FOUND: 'Khong tim thay yeu cau gia han.',
    INVALID_EXTENSION_DUE_AT: 'Ngay gia han phai o tuong lai.',
    TASK_EXTENSION_ALREADY_PROCESSED: 'Yeu cau gia han da duoc xu ly.',
    FORBIDDEN_DEPARTMENT_SCOPE: 'Du lieu nam ngoai pham vi phong ban.',
    CROSS_DEPARTMENT_REQUEST_NOT_FOUND: 'Khong tim thay yeu cau lien phong ban.',
    INVALID_CROSS_DEPARTMENT_STATUS: 'Trang thai yeu cau khong hop le.',
    NOTIFICATION_NOT_FOUND: 'Khong tim thay thong bao.',
  };
  return map[code] ?? fallback;
}

export function notificationRoute(target: NotificationTargetDto, user: AuthUser | null): string | null {
  const notification = target.notification;
  const taskId = notification.taskId ?? stringMeta(notification.metadata, 'taskId');
  const requestId = stringMeta(notification.metadata, 'requestId');
  const base = roleBase(user);
  if (notification.type.startsWith('TASK_') && taskId) return `${base}/tasks/${taskId}`;
  if (notification.type.startsWith('CROSS_DEPARTMENT_') && requestId) return `${base}/cross-department/${requestId}`;
  return null;
}

function stringMeta(metadata: Record<string, unknown> | null | undefined, key: string): string | null {
  const value = metadata?.[key];
  return typeof value === 'string' ? value : null;
}

function roleBase(user: AuthUser | null): '/admin' | '/leader' | '/employee' {
  if (user?.roles.includes('ADMIN') || user?.roles.includes('HR') || user?.roles.includes('ACCOUNTANT') || user?.roles.includes('WAREHOUSE_MANAGER')) return '/admin';
  if (user?.roles.includes('LEADER')) return '/leader';
  return '/employee';
}
