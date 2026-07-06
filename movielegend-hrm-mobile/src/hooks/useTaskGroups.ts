import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addTaskGroupMember, createTaskGroup, getTaskGroup, getTaskGroups, removeTaskGroupMember } from '../api/task-groups.api';
import { queryKeys } from '../constants/queryKeys';
import type { AddTaskGroupMemberPayload, CreateTaskGroupPayload } from '../types/task-group.types';

export function useTaskGroups(filters: { page?: number; limit?: number; departmentId?: string } = {}) {
  return useQuery({
    queryKey: queryKeys.taskGroups(filters),
    queryFn: () => getTaskGroups(filters),
  });
}

export function useTaskGroup(id?: string) {
  return useQuery({
    queryKey: queryKeys.taskGroup(id ?? 'missing'),
    queryFn: () => getTaskGroup(id ?? ''),
    enabled: Boolean(id),
  });
}

export function useCreateTaskGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTaskGroupPayload) => createTaskGroup(payload),
    onSuccess: (group) => {
      void queryClient.invalidateQueries({ queryKey: ['task-groups'] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.taskGroup(group.id) });
    },
  });
}

export function useAddTaskGroupMember(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AddTaskGroupMemberPayload) => addTaskGroupMember(groupId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['task-groups'] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.taskGroup(groupId) });
    },
  });
}

export function useRemoveTaskGroupMember(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => removeTaskGroupMember(groupId, userId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['task-groups'] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.taskGroup(groupId) });
    },
  });
}
