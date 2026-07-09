import { useMutation, useQueryClient } from '@tanstack/react-query';
import { assignLeader, revokeLeader, type LeaderAssignmentPayload } from '../api/leader-assignments.api';

export function useAssignLeader() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: LeaderAssignmentPayload) => assignLeader(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['employees'] });
      void queryClient.invalidateQueries({ queryKey: ['employee'] });
      void queryClient.invalidateQueries({ queryKey: ['departments'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useRevokeLeader() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (assignmentId: string) => revokeLeader(assignmentId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['employees'] });
      void queryClient.invalidateQueries({ queryKey: ['employee'] });
      void queryClient.invalidateQueries({ queryKey: ['departments'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
