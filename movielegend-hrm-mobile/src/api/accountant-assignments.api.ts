import { apiClient, unwrapData } from './client';
import type { ApiResponse } from '../types/api.types';

export type AccountantRoleType = 'ACCOUNTANT_LEAD' | 'ACCOUNTANT_PAYROLL' | 'ACCOUNTANT_TAX' | 'ACCOUNTANT_GENERAL';

export interface AccountantAssignmentPayload {
  userId: string;
  accountantRole: AccountantRoleType;
  departmentId?: string;
}

export async function assignAccountantApi(payload: AccountantAssignmentPayload): Promise<any> {
  const response = await apiClient.post<ApiResponse<any>>('/admin/accountant-assignments', payload);
  return unwrapData(response);
}

export async function revokeAccountantApi(userId: string): Promise<any> {
  const response = await apiClient.delete<ApiResponse<any>>(`/admin/accountant-assignments/${userId}`);
  return unwrapData(response);
}
