import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  cancelTask,
  createTask,
  createTaskAttachment,
  createTaskComment,
  createTaskExtensionRequest,
  getMyTasks,
  getPendingTaskExtensions,
  getTask,
  getTaskReviewQueue,
  getTaskTimeline,
  getTasks,
  updateTask,
} from '../api/tasks.api';
import {
  acceptTaskAssignment,
  approveTaskAssignment,
  rejectTaskAssignment,
  startTaskAssignment,
  submitTaskAssignment,
  updateTaskAssignmentProgress,
} from '../api/task-assignments.api';
import { approveTaskExtension, rejectTaskExtension } from '../api/task-extensions.api';
import { queryKeys } from '../constants/queryKeys';
import type {
  CreateTaskAttachmentPayload,
  CreateTaskCommentPayload,
  CreateTaskExtensionPayload,
  CreateTaskPayload,
  ReviewTaskPayload,
  SubmitTaskPayload,
  TaskListFilters,
  TaskExtensionPendingFilters,
  TaskReviewQueueFilters,
  UpdateTaskPayload,
  UpdateTaskProgressPayload,
} from '../types/task.types';

export function useTasks(filters: TaskListFilters = {}) {
  return useQuery({
    queryKey: queryKeys.tasks(filters),
    queryFn: () => getTasks(filters),
  });
}

export function useMyTasks(filters: TaskListFilters = {}) {
  return useQuery({
    queryKey: queryKeys.myTasks(filters),
    queryFn: () => getMyTasks(filters),
  });
}

export function useTask(id?: string) {
  return useQuery({
    queryKey: queryKeys.task(id ?? 'missing'),
    queryFn: () => getTask(id ?? ''),
    enabled: Boolean(id),
  });
}

export function useTaskTimeline(id?: string) {
  return useQuery({
    queryKey: queryKeys.taskTimeline(id ?? 'missing'),
    queryFn: () => getTaskTimeline(id ?? '', { page: 1, limit: 50 }),
    enabled: Boolean(id),
  });
}

export function useTaskReviewQueue(filters: TaskReviewQueueFilters = {}) {
  return useQuery({
    queryKey: queryKeys.taskReviewQueue(filters),
    queryFn: () => getTaskReviewQueue(filters),
  });
}

export function usePendingTaskExtensions(filters: TaskExtensionPendingFilters = {}) {
  return useQuery({
    queryKey: queryKeys.taskExtensionPending(filters),
    queryFn: () => getPendingTaskExtensions(filters),
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTaskPayload) => createTask(payload),
    onSuccess: (task) => {
      invalidateTaskCollections(queryClient);
      void queryClient.invalidateQueries({ queryKey: queryKeys.task(task.id) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.notificationUnreadCount() });
    },
  });
}

export function useUpdateTask(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateTaskPayload) => updateTask(id, payload),
    onSuccess: () => invalidateTask(queryClient, id),
  });
}

export function useCancelTask(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => cancelTask(id),
    onSuccess: () => invalidateTask(queryClient, id),
  });
}

export function useAcceptTaskAssignment(taskId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (assignmentId: string) => acceptTaskAssignment(assignmentId),
    onSuccess: () => invalidateTask(queryClient, taskId),
  });
}

export function useStartTaskAssignment(taskId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (assignmentId: string) => startTaskAssignment(assignmentId),
    onSuccess: () => invalidateTask(queryClient, taskId),
  });
}

export function useUpdateTaskProgress(taskId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ assignmentId, payload }: { assignmentId: string; payload: UpdateTaskProgressPayload }) =>
      updateTaskAssignmentProgress(assignmentId, payload),
    onSuccess: () => invalidateTask(queryClient, taskId),
  });
}

export function useSubmitTaskAssignment(taskId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ assignmentId, payload }: { assignmentId: string; payload: SubmitTaskPayload }) => submitTaskAssignment(assignmentId, payload),
    onSuccess: () => {
      invalidateTask(queryClient, taskId);
      void queryClient.invalidateQueries({ queryKey: queryKeys.notificationUnreadCount() });
    },
  });
}

export function useReviewTaskAssignment(taskId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ assignmentId, action, payload }: { assignmentId: string; action: 'approve' | 'reject'; payload?: ReviewTaskPayload }) =>
      action === 'approve' ? approveTaskAssignment(assignmentId, payload ?? {}) : rejectTaskAssignment(assignmentId, payload ?? {}),
    onSuccess: () => {
      if (taskId) void queryClient.invalidateQueries({ queryKey: queryKeys.task(taskId) });
      invalidateTaskCollections(queryClient);
    },
  });
}

export function useCreateTaskComment(taskId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTaskCommentPayload) => createTaskComment(taskId, payload),
    onSuccess: () => invalidateTask(queryClient, taskId),
  });
}

export function useCreateTaskAttachment(taskId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTaskAttachmentPayload) => createTaskAttachment(taskId, payload),
    onSuccess: () => invalidateTask(queryClient, taskId),
  });
}

export function useCreateTaskExtension(taskId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTaskExtensionPayload) => createTaskExtensionRequest(taskId, payload),
    onSuccess: () => invalidateTask(queryClient, taskId),
  });
}

export function useReviewTaskExtension(taskId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action, payload }: { id: string; action: 'approve' | 'reject'; payload?: ReviewTaskPayload }) =>
      action === 'approve' ? approveTaskExtension(id) : rejectTaskExtension(id, payload ?? {}),
    onSuccess: () => {
      if (taskId) void queryClient.invalidateQueries({ queryKey: queryKeys.task(taskId) });
      invalidateTaskCollections(queryClient);
    },
  });
}

function invalidateTask(queryClient: ReturnType<typeof useQueryClient>, taskId: string): void {
  void queryClient.invalidateQueries({ queryKey: queryKeys.task(taskId) });
  void queryClient.invalidateQueries({ queryKey: queryKeys.taskTimeline(taskId) });
  invalidateTaskCollections(queryClient);
}

function invalidateTaskCollections(queryClient: ReturnType<typeof useQueryClient>): void {
  void queryClient.invalidateQueries({ queryKey: ['tasks'] });
  void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
}
