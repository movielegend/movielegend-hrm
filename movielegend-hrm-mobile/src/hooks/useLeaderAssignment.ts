import { useMutation, useQueryClient } from '@tanstack/react-query';
import { assignLeader, type LeaderAssignmentPayload } from '../api/leader-assignments.api';

export function useAssignLeader() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: LeaderAssignmentPayload) => assignLeader(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['employees'] });
      void queryClient.invalidateQueries({ queryKey: ['departments'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
