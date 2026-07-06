import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createCrossDepartmentRequest,
  getCrossDepartmentRequest,
  getCrossDepartmentRequests,
  sourceApproveCrossDepartmentRequest,
  sourceRejectCrossDepartmentRequest,
  targetAcceptCrossDepartmentRequest,
  targetRejectCrossDepartmentRequest,
} from '../api/cross-department.api';
import { queryKeys } from '../constants/queryKeys';
import type { CreateCrossDepartmentRequestPayload, RejectCrossDepartmentRequestPayload } from '../types/cross-department.types';

export function useCrossDepartmentRequests(filters: { page?: number; limit?: number; status?: string } = {}) {
  return useQuery({
    queryKey: queryKeys.crossDepartmentRequests(filters),
    queryFn: () => getCrossDepartmentRequests(filters),
  });
}

export function useCrossDepartmentRequest(id?: string) {
  return useQuery({
    queryKey: queryKeys.crossDepartmentRequest(id ?? 'missing'),
    queryFn: () => getCrossDepartmentRequest(id ?? ''),
    enabled: Boolean(id),
  });
}

export function useCreateCrossDepartmentRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCrossDepartmentRequestPayload) => createCrossDepartmentRequest(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['cross-department-requests'] });
    },
  });
}

export function useCrossDepartmentAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      action,
      payload,
    }: {
      id: string;
      action: 'source-approve' | 'source-reject' | 'target-accept' | 'target-reject';
      payload?: RejectCrossDepartmentRequestPayload;
    }) => {
      if (action === 'source-approve') return sourceApproveCrossDepartmentRequest(id);
      if (action === 'source-reject') return sourceRejectCrossDepartmentRequest(id, payload ?? { reason: '' });
      if (action === 'target-accept') return targetAcceptCrossDepartmentRequest(id);
      return targetRejectCrossDepartmentRequest(id, payload ?? { reason: '' });
    },
    onSuccess: (request) => {
      void queryClient.invalidateQueries({ queryKey: ['cross-department-requests'] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.crossDepartmentRequest(request.id) });
    },
  });
}
