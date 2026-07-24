import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getContractTemplates,
  getContractTemplate,
  createContractTemplate,
  updateContractTemplate,
  updateTemplateMapping,
  getEmployeeContracts,
  getMyContracts,
  getEmployeeContract,
  createEmployeeContract,
  updateEmployeeContract,
  getExpiringContracts,
  submitContractApproval,
  approveContract,
  rejectContract,
  activateContract,
  terminateContract,
  scanContract,
  rejectContractSignature,
  signContractEmployee,
  signContractCompany,
  deleteContract,
} from '../api/contracts.api';
import { contractTemplateKeys, contractKeys } from '../constants/queryKeys';
import type {
  CreateContractTemplatePayload,
  UpdateContractTemplatePayload,
  UpdateTemplateMappingPayload,
  CreateEmployeeContractPayload,
  UpdateEmployeeContractPayload,
  RejectContractPayload,
  TerminateContractPayload,
} from '../types/contract.types';

// ── Templates ──

export function useContractTemplates() {
  return useQuery({
    queryKey: contractTemplateKeys.list(),
    queryFn: () => getContractTemplates(),
  });
}

export function useContractTemplate(id: string) {
  return useQuery({
    queryKey: contractTemplateKeys.detail(id),
    queryFn: () => getContractTemplate(id),
    enabled: Boolean(id),
  });
}

export function useCreateContractTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateContractTemplatePayload) => createContractTemplate(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: contractTemplateKeys.all });
    },
  });
}

export function useUpdateContractTemplate(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateContractTemplatePayload) => updateContractTemplate(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: contractTemplateKeys.all });
    },
  });
}

export function useUpdateTemplateMapping(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateTemplateMappingPayload) => updateTemplateMapping(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: contractTemplateKeys.all });
    },
  });
}

// ── Employee Contracts ──

export function useContracts(departmentId?: string) {
  return useQuery({
    queryKey: contractKeys.list(departmentId),
    queryFn: () => getEmployeeContracts(departmentId),
  });
}

export function useMyContracts() {
  return useQuery({
    queryKey: ['contracts', 'my'],
    queryFn: () => getMyContracts(),
  });
}

export function useContract(id: string) {
  return useQuery({
    queryKey: contractKeys.detail(id),
    queryFn: () => getEmployeeContract(id),
    enabled: Boolean(id),
  });
}

export function useCreateContract() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateEmployeeContractPayload) => createEmployeeContract(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: contractKeys.all });
    },
  });
}

export function useUpdateContract(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateEmployeeContractPayload) => updateEmployeeContract(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: contractKeys.all });
    },
  });
}

export function useScanContract() {
  return useMutation({
    mutationFn: (imageUrl: string) => scanContract(imageUrl),
  });
}

export function useRejectContractSignature(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: RejectContractPayload) => rejectContractSignature(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: contractKeys.all });
    },
  });
}


export function useExpiringContracts(days?: number) {
  return useQuery({
    queryKey: contractKeys.expiring(days),
    queryFn: () => getExpiringContracts(days),
  });
}

// ── Contract Actions ──

function useContractAction(actionFn: (id: string) => Promise<unknown>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: actionFn,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: contractKeys.all });
    },
  });
}

export function useSubmitContractApproval() {
  return useContractAction(submitContractApproval);
}

export function useApproveContract() {
  return useContractAction(approveContract);
}

export function useRejectContract() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: RejectContractPayload }) =>
      rejectContract(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: contractKeys.all });
    },
  });
}

export function useActivateContract() {
  return useContractAction(activateContract);
}

export function useSignContractEmployee(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { signatureType: 'DRAWN'; signatureImageUrl: string; signatureData?: string }) =>
      signContractEmployee(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: contractKeys.all });
    },
  });
}

export function useSignContractCompany(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { signatureType: 'DRAWN'; signatureImageUrl: string; signatureData?: string }) =>
      signContractCompany(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: contractKeys.all });
    },
  });
}

export function useTerminateContract() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: TerminateContractPayload }) =>
      terminateContract(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: contractKeys.all });
    },
  });
}

export function useDeleteContract() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteContract(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: contractKeys.all });
    },
  });
}
