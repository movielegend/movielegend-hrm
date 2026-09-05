import { apiClient, unwrapData } from './client';
import type { ApiResponse } from '../types/api.types';
import type {
  EmployeeListFilters,
  EmployeeProfile,
  EmployeeUser,
  ScopedEmployee,
  ScopedEmployeeFilters,
  UpdateEmployeePayload,
  GrantVaultType,
  MyVaultResponse,
} from '../types/employee.types';
import { normalizePagination, type PaginatedResult } from '../types/pagination.types';

export async function getEmployees(filters: EmployeeListFilters): Promise<PaginatedResult<EmployeeUser>> {
  const response = await apiClient.get<ApiResponse<PaginatedResult<EmployeeUser>>>('/admin/users', {
    params: filters,
  });
  return unwrapData(response);
}

export async function getAdminUser(id: string): Promise<EmployeeUser> {
  const response = await apiClient.get<ApiResponse<EmployeeUser>>(`/admin/users/${id}`);
  return unwrapData(response);
}

export async function getEmployeeProfile(profileId: string): Promise<EmployeeProfile> {
  const response = await apiClient.get<ApiResponse<EmployeeProfile>>(`/employees/${profileId}`);
  return unwrapData(response);
}

export async function updateEmployee(id: string, payload: UpdateEmployeePayload): Promise<EmployeeUser> {
  const response = await apiClient.patch<ApiResponse<EmployeeUser>>(`/admin/users/${id}`, payload);
  return unwrapData(response);
}

export async function createEmployee(payload: Record<string, any>): Promise<EmployeeUser> {
  const response = await apiClient.post<ApiResponse<EmployeeUser>>(`/admin/users`, payload);
  return unwrapData(response);
}

export async function deleteAdminUser(id: string): Promise<unknown> {
  const response = await apiClient.delete<ApiResponse<unknown>>(`/employees/${id}`);
  return unwrapData(response);
}

export interface EmployeeReportRow {
  id?: string;
  userCode?: string;
  fullName?: string;
  department?: string;
  position?: string;
  joinDate?: string;
  employmentStatus?: string;
  accountStatus?: string;
}

export async function getEmployeeReport(filters: EmployeeListFilters): Promise<PaginatedResult<EmployeeReportRow>> {
  const response = await apiClient.get<ApiResponse<EmployeeReportRow[]>>('/reports/employees', { params: filters });
  return normalizePagination(unwrapData(response), cleanPaginationFallback(filters));
}

export async function getScopedEmployees(filters: ScopedEmployeeFilters): Promise<PaginatedResult<ScopedEmployee>> {
  const response = await apiClient.get<ApiResponse<PaginatedResult<ScopedEmployee>>>('/employees/scoped', { params: filters });
  return unwrapData(response);
}

function cleanPaginationFallback(filters: EmployeeListFilters): { page?: number; limit?: number } {
  return {
    ...(typeof filters.page === 'number' ? { page: filters.page } : {}),
    ...(typeof filters.limit === 'number' ? { limit: filters.limit } : {}),
  };
}

export async function updateEmployeeAccountStatus(id: string, status: string): Promise<any> {
  const response = await apiClient.patch<ApiResponse<any>>(`/employees/${id}/account-status`, { status });
  return unwrapData(response);
}

export async function grantVaultPoints(payload: {
  userId: string;
  points: number;
  year?: number;
  cashValuePerPoint?: number;
  grantType?: GrantVaultType;
  note?: string;
}): Promise<any> {
  const response = await apiClient.post<ApiResponse<any>>('/admin/talent-vault/grant', payload);
  return unwrapData(response);
}

export async function bulkGrantVaultPoints(payload: {
  departmentId?: string;
  userIds?: string[];
  points: number;
  year?: number;
  cashValuePerPoint?: number;
  grantType?: GrantVaultType;
  note?: string;
}): Promise<any> {
  const response = await apiClient.post<ApiResponse<any>>('/admin/talent-vault/bulk-grant', payload);
  return unwrapData(response);
}

export async function getMyVault(): Promise<MyVaultResponse> {
  const response = await apiClient.get<ApiResponse<MyVaultResponse>>('/employees/vault/my-vault');
  return unwrapData(response);
}

export async function withdrawVaultPoints(payload: {
  points: number;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
  note?: string;
}): Promise<any> {
  const response = await apiClient.post<ApiResponse<any>>('/employees/vault/withdraw', payload);
  return unwrapData(response);
}

export async function getVaultWithdrawalRequests(params?: {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<any> {
  const response = await apiClient.get<ApiResponse<any>>('/admin/vault/withdrawals', { params });
  return unwrapData(response);
}

export async function adminApproveWithdrawal(id: string, payload?: { note?: string }): Promise<any> {
  const response = await apiClient.post<ApiResponse<any>>(`/admin/vault/withdrawals/${id}/admin-approve`, payload || {});
  return unwrapData(response);
}

export async function accountantConfirmWithdrawal(id: string, payload?: {
  transactionReference?: string;
  note?: string;
}): Promise<any> {
  const response = await apiClient.post<ApiResponse<any>>(`/admin/vault/withdrawals/${id}/accountant-confirm`, payload || {});
  return unwrapData(response);
}

export async function rejectWithdrawal(id: string, payload: { reason: string }): Promise<any> {
  const response = await apiClient.post<ApiResponse<any>>(`/admin/vault/withdrawals/${id}/reject`, payload);
  return unwrapData(response);
}

