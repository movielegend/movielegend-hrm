import { apiClient, unwrapData } from './client';
import type { ApiResponse } from '../types/api.types';
import type {
  CreateOtReportPayload,
  UpdateOtReportPayload,
  ApproveOtReportPayload,
  RejectOtReportPayload,
  OtReport,
  OtReportFilters,
} from '../types/ot-report.types';
import type { PaginatedResult } from '../types/pagination.types';

export async function createOtReport(payload: CreateOtReportPayload): Promise<OtReport> {
  const response = await apiClient.post<ApiResponse<OtReport>>('/ot-reports', payload);
  return unwrapData(response);
}

export async function getMyOtReports(filters: OtReportFilters = {}): Promise<PaginatedResult<OtReport>> {
  const response = await apiClient.get<ApiResponse<PaginatedResult<OtReport>>>('/ot-reports/my', {
    params: filters,
  });
  return unwrapData(response);
}

export async function getPendingOtReports(filters: OtReportFilters = {}): Promise<PaginatedResult<OtReport>> {
  const response = await apiClient.get<ApiResponse<PaginatedResult<OtReport>>>('/ot-reports/pending', {
    params: filters,
  });
  return unwrapData(response);
}

export async function getOtReportDetail(id: string): Promise<OtReport> {
  const response = await apiClient.get<ApiResponse<OtReport>>(`/ot-reports/${id}`);
  return unwrapData(response);
}

export async function updateOtReport(id: string, payload: UpdateOtReportPayload): Promise<OtReport> {
  const response = await apiClient.patch<ApiResponse<OtReport>>(`/ot-reports/${id}`, payload);
  return unwrapData(response);
}

export async function approveOtReport(id: string, payload: ApproveOtReportPayload = {}): Promise<OtReport> {
  const response = await apiClient.post<ApiResponse<OtReport>>(`/ot-reports/${id}/approve`, payload);
  return unwrapData(response);
}

export async function rejectOtReport(id: string, payload: RejectOtReportPayload): Promise<OtReport> {
  const response = await apiClient.post<ApiResponse<OtReport>>(`/ot-reports/${id}/reject`, payload);
  return unwrapData(response);
}
