import { apiClient, unwrapData } from './client';
import type { ApiResponse } from '../types/api.types';
import { normalizePagination, type PaginatedResult } from '../types/pagination.types';
import type {
  AttendanceAdjustment,
  AttendanceAdjustmentPayload,
  AttendanceHistoryFilters,
  AttendanceLocation,
  AttendanceLocationPayload,
  AttendanceRecord,
  CurrentAttendanceResponse,
  AttendanceDetail,
  CheckInPayload,
  CheckOutPayload,
  Coordinates,
} from '../types/attendance.types';

export async function checkIn(payload: CheckInPayload): Promise<AttendanceRecord> {
  const response = await apiClient.post<ApiResponse<AttendanceRecord>>('/attendance/check-in', payload, {
    timeout: 30_000,
  });
  return unwrapData(response);
}

export async function checkOut(payload: CheckOutPayload): Promise<AttendanceRecord> {
  const response = await apiClient.post<ApiResponse<AttendanceRecord>>('/attendance/check-out', payload, {
    timeout: 30_000,
  });
  return unwrapData(response);
}

export async function getAttendanceHistory(filters: AttendanceHistoryFilters = {}): Promise<PaginatedResult<AttendanceRecord>> {
  const response = await apiClient.get<ApiResponse<PaginatedResult<AttendanceRecord>>>('/attendance/my', {
    params: cleanOwnAttendanceParams(filters),
  });
  return unwrapData(response);
}

export async function getAttendanceReport(filters: AttendanceHistoryFilters = {}): Promise<PaginatedResult<AttendanceRecord>> {
  const response = await apiClient.get<ApiResponse<PaginatedResult<AttendanceRecord>>>('/attendance', {
    params: cleanReportAttendanceParams(filters),
  });
  return unwrapData(response);
}

export async function getAttendanceDashboardStats(filters: AttendanceHistoryFilters = {}): Promise<{ totalUsers: number; present: number; onTime: number; late: number; absent: number }> {
  const response = await apiClient.get<ApiResponse<{ totalUsers: number; present: number; onTime: number; late: number; absent: number }>>('/attendance/dashboard', {
    params: cleanReportAttendanceParams(filters),
  });
  return unwrapData(response);
}

export async function getCurrentAttendance(): Promise<CurrentAttendanceResponse> {
  const response = await apiClient.get<ApiResponse<CurrentAttendanceResponse>>('/attendance/current');
  return unwrapData(response);
}

export async function getAttendanceDetail(id: string): Promise<AttendanceDetail> {
  const response = await apiClient.get<ApiResponse<AttendanceDetail>>(`/attendance/${id}`);
  return unwrapData(response);
}

export async function getActiveAttendanceLocations(): Promise<AttendanceLocation[]> {
  const response = await apiClient.get<ApiResponse<AttendanceLocation[]>>('/attendance/locations/active');
  return unwrapData(response);
}

export async function createAttendanceAdjustment(payload: AttendanceAdjustmentPayload): Promise<AttendanceAdjustment> {
  const response = await apiClient.post<ApiResponse<AttendanceAdjustment>>('/attendance/adjustments', payload);
  return unwrapData(response);
}

export async function approveAttendanceAdjustment(id: string): Promise<AttendanceAdjustment> {
  const response = await apiClient.post<ApiResponse<AttendanceAdjustment>>(`/attendance/adjustments/${id}/approve`);
  return unwrapData(response);
}

export async function createAttendanceLocation(payload: AttendanceLocationPayload): Promise<AttendanceLocation> {
  const response = await apiClient.post<ApiResponse<AttendanceLocation>>('/attendance/locations', payload);
  return unwrapData(response);
}

export async function updateAttendanceLocation(id: string, payload: Partial<AttendanceLocationPayload> & { isActive?: boolean }): Promise<AttendanceLocation> {
  const response = await apiClient.patch<ApiResponse<AttendanceLocation>>(`/attendance/locations/${id}`, payload);
  return unwrapData(response);
}

export async function deleteAttendanceLocation(id: string): Promise<AttendanceLocation> {
  const response = await apiClient.delete<ApiResponse<AttendanceLocation>>(`/attendance/locations/${id}`);
  return unwrapData(response);
}

export async function trackLocation(payload: Coordinates): Promise<unknown> {
  const response = await apiClient.post<ApiResponse<unknown>>('/attendance/location-tracking', {
    latitude: payload.latitude,
    longitude: payload.longitude,
    ...(typeof payload.accuracy === 'number' ? { accuracyMeters: Math.round(payload.accuracy) } : {}),
  });
  return unwrapData(response);
}

function cleanReportAttendanceParams(filters: AttendanceHistoryFilters): Partial<AttendanceHistoryFilters> {
  return {
    ...(filters.departmentId ? { departmentId: filters.departmentId } : {}),
    ...(filters.fromDate ? { fromDate: filters.fromDate } : {}),
    ...(filters.toDate ? { toDate: filters.toDate } : {}),
    ...(filters.page ? { page: filters.page } : {}),
    ...(filters.limit ? { limit: filters.limit } : {}),
    ...(filters.status ? { status: filters.status } : {}),
  };
}

function cleanOwnAttendanceParams(filters: AttendanceHistoryFilters): Omit<AttendanceHistoryFilters, 'departmentId'> {
  return {
    ...(filters.status ? { status: filters.status } : {}),
    ...(typeof filters.page === 'number' ? { page: filters.page } : {}),
    ...(typeof filters.limit === 'number' ? { limit: filters.limit } : {}),
    ...(filters.fromDate ? { fromDate: filters.fromDate } : {}),
    ...(filters.toDate ? { toDate: filters.toDate } : {}),
  };
}

function cleanPaginationFallback(filters: AttendanceHistoryFilters): { page?: number; limit?: number } {
  return {
    ...(typeof filters.page === 'number' ? { page: filters.page } : {}),
    ...(typeof filters.limit === 'number' ? { limit: filters.limit } : {}),
  };
}
