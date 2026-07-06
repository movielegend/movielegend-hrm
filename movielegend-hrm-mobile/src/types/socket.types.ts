export type HrmSocketEvent =
  | 'task:assigned'
  | 'task:updated'
  | 'task:commented'
  | 'task:submitted'
  | 'task:reviewed'
  | 'notification.created'
  | 'cross-department:updated';

export interface TaskSocketPayload {
  taskId: string;
  assignmentId?: string;
  commentId?: string;
  status?: string;
}

export interface CrossDepartmentSocketPayload {
  requestId: string;
  status?: string;
}
