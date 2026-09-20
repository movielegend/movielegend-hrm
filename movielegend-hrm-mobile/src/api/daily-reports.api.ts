import { apiClient, unwrapData } from './client';
import type { ApiResponse } from '../types/api.types';

export interface DailyReportMetricItem {
  name: string;
  value?: string | number;
  unit?: string;
  note?: string;
}

export interface DailyReportTaskItem {
  taskId?: string;
  title: string;
  status?: string;
  progress?: number;
  expectedDate?: string;
  note?: string;
  isManual?: boolean;
  isSelected?: boolean;
}

export interface DailyReportAttachmentItem {
  url: string;
  fileName?: string;
  size?: number;
  fileType?: string;
}

export interface DailyReport {
  id: string | null;
  userId: string;
  departmentId: string | null;
  reportDate: string;
  roleType: 'EMPLOYEE' | 'LEADER';
  metrics: DailyReportMetricItem[];
  completedTasks: DailyReportTaskItem[];
  inProgressTasks: DailyReportTaskItem[];
  obstacles: string | null;
  tomorrowPlan: string[];
  attachments: DailyReportAttachmentItem[];
  selfRating: number | null;
  selfReview: string | null;
  adminRating: number | null;
  adminReview: string | null;
  reviewedById: string | null;
  reviewedAt: string | null;
  status: 'DRAFT' | 'SUBMITTED' | 'REVIEWED';
  createdAt?: string;
  updatedAt?: string;
  user?: {
    id: string;
    userCode?: string;
    profile?: {
      fullName?: string;
      avatarUrl?: string | null;
    };
  };
  department?: {
    id: string;
    name: string;
  } | null;
  reviewedBy?: {
    id: string;
    userCode?: string;
    profile?: {
      fullName?: string;
    };
  } | null;
}

export interface DepartmentReportItem {
  user: {
    id: string;
    userCode?: string;
    profile?: {
      fullName?: string;
      avatarUrl?: string | null;
    };
    roles?: any[];
  };
  report: DailyReport | null;
  isSubmitted: boolean;
}

export interface DepartmentReportsResponse {
  reportDate: string;
  departmentId: string;
  totalMembers: number;
  submittedCount: number;
  memberReports: DepartmentReportItem[];
}

export interface DepartmentSummaryResponse {
  reportDate: string;
  departmentId: string;
  submittedCount: number;
  totalRevenue: number;
  totalOrders: number;
  totalNewCustomers: number;
  completedTaskTitles: string[];
  inProgressTaskTitles: string[];
  obstaclesList: { userName: string; text: string }[];
}

export interface SaveDailyReportPayload {
  reportDate?: string;
  roleType?: 'EMPLOYEE' | 'LEADER';
  metrics?: DailyReportMetricItem[];
  completedTasks?: DailyReportTaskItem[];
  inProgressTasks?: DailyReportTaskItem[];
  obstacles?: string;
  tomorrowPlan?: string[];
  attachments?: DailyReportAttachmentItem[];
  selfRating?: number;
  selfReview?: string;
  isDraft?: boolean;
}

export interface ReviewDailyReportPayload {
  adminRating: number;
  adminReview?: string;
}

export interface ConvertPlanToTasksPayload {
  planItems: string[];
  dueDate?: string;
}

export async function fetchMyTodayReport(date?: string): Promise<DailyReport> {
  const response = await apiClient.get<ApiResponse<DailyReport>>('/daily-reports/my-today', {
    params: { date },
  });
  return unwrapData(response);
}

export async function saveDailyReport(payload: SaveDailyReportPayload): Promise<DailyReport> {
  const response = await apiClient.post<ApiResponse<DailyReport>>('/daily-reports', payload);
  return unwrapData(response);
}

export async function fetchMyReportHistory(page = 1, limit = 20, month?: string): Promise<{ items: DailyReport[]; pagination: any }> {
  const response = await apiClient.get<ApiResponse<{ items: DailyReport[]; pagination: any }>>('/daily-reports/my-history', {
    params: { page, limit, month },
  });
  return unwrapData(response);
}

export async function fetchDepartmentReports(departmentId?: string, date?: string): Promise<DepartmentReportsResponse> {
  const response = await apiClient.get<ApiResponse<DepartmentReportsResponse>>('/daily-reports/department', {
    params: { departmentId, date },
  });
  return unwrapData(response);
}

export async function fetchDepartmentSummary(departmentId?: string, date?: string): Promise<DepartmentSummaryResponse> {
  const response = await apiClient.get<ApiResponse<DepartmentSummaryResponse>>('/daily-reports/department/summary', {
    params: { departmentId, date },
  });
  return unwrapData(response);
}

export async function convertPlanToTasks(reportId: string, payload: ConvertPlanToTasksPayload): Promise<any> {
  const response = await apiClient.post<ApiResponse<any>>(`/daily-reports/${reportId}/convert-tasks`, payload);
  return unwrapData(response);
}

export async function fetchAdminReports(params?: {
  date?: string;
  departmentId?: string;
  status?: string;
  page?: number;
  limit?: number;
  search?: string;
}): Promise<{ items: DailyReport[]; pagination: any }> {
  const response = await apiClient.get<ApiResponse<{ items: DailyReport[]; pagination: any }>>('/daily-reports/admin', {
    params,
  });
  return unwrapData(response);
}

export async function reviewDailyReport(reportId: string, payload: ReviewDailyReportPayload): Promise<DailyReport> {
  const response = await apiClient.post<ApiResponse<DailyReport>>(`/daily-reports/${reportId}/review`, payload);
  return unwrapData(response);
}
