import { apiClient, unwrapData } from './client';
import type { ApiResponse } from '../types/api.types';
import type {
  ContractTemplateDto,
  EmployeeContractDto,
  CreateContractTemplatePayload,
  UpdateContractTemplatePayload,
  CreateEmployeeContractPayload,
  UpdateEmployeeContractPayload,
  RejectContractPayload,
  SignContractPayload,
  TerminateContractPayload,
  UpdateTemplateMappingPayload,
} from '../types/contract.types';

// ── Contract Templates ──

export async function getContractTemplates(): Promise<ContractTemplateDto[]> {
  const response = await apiClient.get<ApiResponse<ContractTemplateDto[]>>('/contract-templates');
  return unwrapData(response);
}

export async function getContractTemplate(id: string): Promise<ContractTemplateDto> {
  const response = await apiClient.get<ApiResponse<ContractTemplateDto>>(`/contract-templates/${id}`);
  return unwrapData(response);
}

export async function createContractTemplate(payload: CreateContractTemplatePayload): Promise<ContractTemplateDto> {
  const response = await apiClient.post<ApiResponse<ContractTemplateDto>>('/contract-templates', payload);
  return unwrapData(response);
}

export async function updateContractTemplate(id: string, payload: UpdateContractTemplatePayload): Promise<ContractTemplateDto> {
  const response = await apiClient.patch<ApiResponse<ContractTemplateDto>>(`/contract-templates/${id}`, payload);
  return unwrapData(response);
}

export async function updateTemplateMapping(id: string, payload: UpdateTemplateMappingPayload): Promise<{ success: boolean }> {
  const response = await apiClient.patch<ApiResponse<{ success: boolean }>>(`/contract-templates/${id}/mapping`, payload);
  return unwrapData(response);
}

// ── Employee Contracts ──

export async function getEmployeeContracts(departmentId?: string): Promise<EmployeeContractDto[]> {
  const response = await apiClient.get<ApiResponse<EmployeeContractDto[]>>('/employee-contracts', {
    params: departmentId ? { departmentId } : undefined,
  });
  return unwrapData(response);
}

export async function getMyContracts(): Promise<EmployeeContractDto[]> {
  const response = await apiClient.get<ApiResponse<EmployeeContractDto[]>>('/employee-contracts/my');
  return unwrapData(response);
}

export async function getEmployeeContract(id: string): Promise<EmployeeContractDto> {
  const response = await apiClient.get<ApiResponse<EmployeeContractDto>>(`/employee-contracts/${id}`);
  return unwrapData(response);
}

export async function createEmployeeContract(payload: CreateEmployeeContractPayload): Promise<EmployeeContractDto> {
  const response = await apiClient.post<ApiResponse<EmployeeContractDto>>('/employee-contracts', payload);
  return unwrapData(response);
}

export async function updateEmployeeContract(id: string, payload: UpdateEmployeeContractPayload): Promise<EmployeeContractDto> {
  const response = await apiClient.patch<ApiResponse<EmployeeContractDto>>(`/employee-contracts/${id}`, payload);
  return unwrapData(response);
}

export async function getExpiringContracts(days = 30): Promise<EmployeeContractDto[]> {
  const response = await apiClient.get<ApiResponse<EmployeeContractDto[]>>('/employee-contracts/expiry', {
    params: { days },
  });
  return unwrapData(response);
}

// ── Contract Actions ──

export async function submitContractApproval(id: string): Promise<EmployeeContractDto> {
  const response = await apiClient.post<ApiResponse<EmployeeContractDto>>(`/employee-contracts/${id}/submit-approval`);
  return unwrapData(response);
}

export async function approveContract(id: string): Promise<EmployeeContractDto> {
  const response = await apiClient.post<ApiResponse<EmployeeContractDto>>(`/employee-contracts/${id}/approve`);
  return unwrapData(response);
}

export async function rejectContract(id: string, payload: RejectContractPayload): Promise<EmployeeContractDto> {
  const response = await apiClient.post<ApiResponse<EmployeeContractDto>>(`/employee-contracts/${id}/reject`, payload);
  return unwrapData(response);
}

export async function requestEmployeeSignature(id: string): Promise<EmployeeContractDto> {
  const response = await apiClient.post<ApiResponse<EmployeeContractDto>>(`/employee-contracts/${id}/request-employee-signature`);
  return unwrapData(response);
}

export async function rejectContractSignature(id: string, payload: RejectContractPayload): Promise<EmployeeContractDto> {
  const response = await apiClient.post<ApiResponse<EmployeeContractDto>>(`/employee-contracts/${id}/reject-signature`, payload);
  return unwrapData(response);
}

export async function scanContract(imageUrl: string): Promise<any> {
  const response = await apiClient.post<ApiResponse<any>>('/employee-contracts/scan', { imageUrl });
  return unwrapData(response);
}

export async function signContractEmployee(id: string, payload: SignContractPayload): Promise<EmployeeContractDto> {
  const response = await apiClient.post<ApiResponse<EmployeeContractDto>>(`/employee-contracts/${id}/sign/employee`, payload);
  return unwrapData(response);
}

export async function signContractCompany(id: string, payload: SignContractPayload): Promise<EmployeeContractDto> {
  const response = await apiClient.post<ApiResponse<EmployeeContractDto>>(`/employee-contracts/${id}/sign/company`, payload);
  return unwrapData(response);
}

export async function activateContract(id: string): Promise<EmployeeContractDto> {
  const response = await apiClient.post<ApiResponse<EmployeeContractDto>>(`/employee-contracts/${id}/activate`);
  return unwrapData(response);
}

export async function terminateContract(id: string, payload: TerminateContractPayload): Promise<EmployeeContractDto> {
  const response = await apiClient.post<ApiResponse<EmployeeContractDto>>(`/employee-contracts/${id}/terminate`, payload);
  return unwrapData(response);
}

export async function deleteContract(id: string): Promise<{ success: boolean }> {
  const response = await apiClient.delete<ApiResponse<{ success: boolean }>>(`/employee-contracts/${id}`);
  return unwrapData(response);
}
