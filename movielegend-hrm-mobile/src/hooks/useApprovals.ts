import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { approveAccount, getApprovals, rejectAccount } from '../api/approvals.api';
import { queryKeys } from '../constants/queryKeys';
import type { ApprovalFilters, RejectApprovalPayload } from '../types/approval.types';

export function useApprovals(filters: ApprovalFilters) {
  return useQuery({
    queryKey: queryKeys.approvals(filters),
    queryFn: () => getApprovals(filters),
  });
}

export function useApproval(id: string) {
  return useQuery({
    queryKey: queryKeys.approval(id),
    queryFn: async () => {
      const data = await getApprovals({ page: 1, limit: 100 });
      const item = data.items.find((approval) => approval.id === id);
      if (!item) throw new Error('APPROVAL_NOT_FOUND');
      return item;
    },
    enabled: Boolean(id),
  });
}

export function useApproveAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => approveAccount(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['approvals'] });
      void queryClient.invalidateQueries({ queryKey: ['employees'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useRejectAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: RejectApprovalPayload }) => rejectAccount(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['approvals'] });
    },
  });
}
