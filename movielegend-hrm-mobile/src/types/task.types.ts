import type { Department } from './department.types';
import type { UploadedFileDto } from './upload.types';

export type TaskStatus = 'DRAFT' | 'NEW' | 'ACCEPTED' | 'IN_PROGRESS' | 'WAITING_REVIEW' | 'COMPLETED' | 'REJECTED' | 'CANCELLED';
export type TaskType = 'INDIVIDUAL' | 'DEPARTMENT' | 'GROUP' | 'CROSS_DEPARTMENT';
export type TaskPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
export type TaskTargetType = 'USER' | 'DEPARTMENT' | 'GROUP';
export type TaskAssignmentStatus = 'NEW' | 'ACCEPTED' | 'IN_PROGRESS' | 'WAITING_REVIEW' | 'COMPLETED' | 'REJECTED' | 'CANCELLED';
export type TaskAttachmentType = 'FILE' | 'IMAGE' | 'VIDEO' | 'OTHER';
export type TaskExtensionRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
export type TaskHistoryAction =
  | 'CREATED'
  | 'ASSIGNED'
  | 'ACCEPTED'
  | 'STARTED'
  | 'PROGRESS_UPDATED'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'COMMENTED'
  | 'ATTACHED'
  | 'EXTENSION_REQUESTED'
  | 'EXTENSION_APPROVED'
  | 'EXTENSION_REJECTED';

export interface TaskUserSummary {
  id: string;
  userCode?: string | null;
  fullName?: string | null;
  avatarUrl?: string | null;
  employmentStatus?: string | null;
  position?: {
    id: string;
    name: string;
  } | null;
  phone?: string | null;
  email?: string | null;
  profile?: {
    fullName?: string | null;
    avatarUrl?: string | null;
  } | null;
}

export interface TaskTargetDto {
  id?: string;
  taskId?: string;
  targetType: TaskTargetType;
  targetId: string;
  type?: TaskTargetType;
  displayName?: string | null;
  createdAt?: string;
}

export interface CreateTaskTargetPayload {
  targetType: TaskTargetType;
  targetId: string;
}

export interface TaskAssignmentDto {
  id: string;
  taskId: string;
  userId: string;
  assignedByUserId?: string;
  reviewedByUserId?: string | null;
  status: TaskAssignmentStatus;
  progressPercent: number;
  assignmentDueAt?: string | null;
  acceptedAt?: string | null;
  startedAt?: string | null;
  submittedAt?: string | null;
  completedAt?: string | null;
  reviewedAt?: string | null;
  reviewNote?: string | null;
  completionNote?: string | null;
  createdAt?: string;
  updatedAt?: string;
  task?: TaskDto;
  user?: TaskUserSummary;
}

export interface TaskCommentDto {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  user?: TaskUserSummary;
}

export interface TaskAttachmentDto {
  id: string;
  taskId: string;
  uploadedByUserId: string;
  type: TaskAttachmentType;
  fileName: string;
  fileUrl: string;
  storageKey?: string | null;
  mimeType?: string | null;
  sizeBytes?: number | null;
  createdAt: string;
  uploadedFile?: UploadedFileDto;
}

export interface TaskTimelineItemDto {
  id: string;
  type: string;
  actor?: TaskUserSummary | null;
  createdAt: string;
  data: {
    taskId?: string;
    assignmentId?: string | null;
    oldStatus?: string | null;
    newStatus?: string | null;
    note?: string | null;
    action?: TaskHistoryAction;
    metadata?: Record<string, unknown> | null;
  };
}

export interface TaskReviewQueueItemDto {
  assignmentId: string;
  taskId: string;
  taskCode: string;
  taskTitle: string;
  employee: TaskUserSummary;
  priority: TaskPriority;
  submittedAt?: string | null;
  dueAt?: string | null;
  progressPercent: number;
  completionNote?: string | null;
}

export interface TaskExtensionPendingItemDto {
  id: string;
  taskId: string;
  taskTitle: string;
  assignmentId: string;
  employee: TaskUserSummary;
  oldDueAt?: string | null;
  requestedDueAt: string;
  reason: string;
  createdAt: string;
}

export interface TaskExtensionRequestDto {
  id: string;
  taskId: string;
  assignmentId: string;
  requestedByUserId: string;
  decidedByUserId?: string | null;
  currentDueAt?: string | null;
  requestedDueAt: string;
  reason: string;
  status: TaskExtensionRequestStatus;
  rejectionReason?: string | null;
  decidedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface TaskDto {
  id: string;
  taskCode?: string;
  title: string;
  description?: string | null;
  type: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
  departmentContextId?: string | null;
  createdByUserId?: string;
  parentTaskId?: string | null;
  startAt?: string | null;
  dueAt?: string | null;
  completedAt?: string | null;
  cancelledAt?: string | null;
  createdAt: string;
  updatedAt?: string;
  departmentContext?: Department | null;
  createdBy?: TaskUserSummary;
  targets?: TaskTargetDto[];
  childTasks?: any[];
  groupLeaderId?: string | null;
  assignments?: TaskAssignmentDto[];
  comments?: TaskCommentDto[];
  attachments?: TaskAttachmentDto[];
  histories?: TaskTimelineItemDto[];
  extensionRequests?: TaskExtensionRequestDto[];
  chatGroup?: { id: string } | null;
}

export interface TaskListFilters {
  search?: string;
  status?: TaskStatus | TaskAssignmentStatus;
  priority?: TaskPriority;
  departmentId?: string;
  assignedUserId?: string;
  createdById?: string;
  fromDate?: string;
  toDate?: string;
  overdue?: boolean;
  page?: number;
  limit?: number;
}

export interface TaskReviewQueueFilters {
  departmentId?: string;
  priority?: TaskPriority;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}

export interface TaskExtensionPendingFilters {
  departmentId?: string;
  page?: number;
  limit?: number;
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  type?: TaskType;
  priority?: TaskPriority;
  departmentContextId?: string;
  parentTaskId?: string;
  startAt?: string;
  dueAt?: string;
  targets?: CreateTaskTargetPayload[];
  isAdhocGroup?: boolean;
  memberIds?: string[];
  leaderId?: string;
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  dueAt?: string;
}

export interface UpdateTaskProgressPayload {
  progressPercent: number;
}

export interface ReviewTaskPayload {
  note?: string;
}

export interface SubmitTaskPayload {
  completionNote?: string;
}

export interface CreateTaskCommentPayload {
  content: string;
}

export interface CreateTaskAttachmentPayload {
  fileName: string;
  fileUrl: string;
  storageKey?: string;
  type?: TaskAttachmentType;
  mimeType?: string;
  sizeBytes?: number;
}

export interface CreateTaskExtensionPayload {
  assignmentId: string;
  requestedDueAt: string;
  reason: string;
}
