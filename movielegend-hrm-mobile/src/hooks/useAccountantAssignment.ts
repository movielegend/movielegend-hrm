import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  assignAccountantApi,
  revokeAccountantApi,
  type AccountantAssignmentPayload,
} from '../api/accountant-assignments.api';

export function useAssignAccountant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AccountantAssignmentPayload) => assignAccountantApi(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['employees'] });
      void queryClient.invalidateQueries({ queryKey: ['employee'] });
      void queryClient.invalidateQueries({ queryKey: ['departments'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useRevokeAccountant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => revokeAccountantApi(userId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['employees'] });
      void queryClient.invalidateQueries({ queryKey: ['employee'] });
      void queryClient.invalidateQueries({ queryKey: ['departments'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
