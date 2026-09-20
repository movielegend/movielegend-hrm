import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchMyTodayReport,
  saveDailyReport,
  fetchMyReportHistory,
  fetchDepartmentReports,
  fetchDepartmentSummary,
  convertPlanToTasks,
  fetchAdminReports,
  reviewDailyReport,
  type SaveDailyReportPayload,
  type ReviewDailyReportPayload,
  type ConvertPlanToTasksPayload,
} from '../api/daily-reports.api';

export const dailyReportKeys = {
  all: ['daily-reports'] as const,
  myToday: (date?: string) => [...dailyReportKeys.all, 'my-today', date || 'today'] as const,
  myHistory: (page: number, month?: string) => [...dailyReportKeys.all, 'my-history', page, month || 'all'] as const,
  department: (deptId?: string, date?: string) => [...dailyReportKeys.all, 'department', deptId || 'my', date || 'today'] as const,
  departmentSummary: (deptId?: string, date?: string) => [...dailyReportKeys.all, 'department-summary', deptId || 'my', date || 'today'] as const,
  admin: (params?: any) => [...dailyReportKeys.all, 'admin', params] as const,
};

export function useMyTodayReport(date?: string) {
  return useQuery({
    queryKey: dailyReportKeys.myToday(date),
    queryFn: () => fetchMyTodayReport(date),
    staleTime: 1000 * 60 * 2, // 2 mins
  });
}

export function useSaveDailyReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SaveDailyReportPayload) => saveDailyReport(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: dailyReportKeys.all });
    },
  });
}

export function useMyReportHistory(page = 1, limit = 20, month?: string) {
  return useQuery({
    queryKey: dailyReportKeys.myHistory(page, month),
    queryFn: () => fetchMyReportHistory(page, limit, month),
  });
}

export function useDepartmentReports(departmentId?: string, date?: string) {
  return useQuery({
    queryKey: dailyReportKeys.department(departmentId, date),
    queryFn: () => fetchDepartmentReports(departmentId, date),
    staleTime: 1000 * 30,
  });
}

export function useDepartmentSummary(departmentId?: string, date?: string) {
  return useQuery({
    queryKey: dailyReportKeys.departmentSummary(departmentId, date),
    queryFn: () => fetchDepartmentSummary(departmentId, date),
    staleTime: 1000 * 30,
  });
}

export function useConvertPlanToTasks(reportId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ConvertPlanToTasksPayload) => convertPlanToTasks(reportId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: dailyReportKeys.all });
      void queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useAdminReports(params?: {
  date?: string;
  departmentId?: string;
  status?: string;
  page?: number;
  limit?: number;
  search?: string;
}) {
  return useQuery({
    queryKey: dailyReportKeys.admin(params),
    queryFn: () => fetchAdminReports(params),
    staleTime: 1000 * 30,
  });
}

export function useReviewDailyReport(reportId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ReviewDailyReportPayload) => reviewDailyReport(reportId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: dailyReportKeys.all });
    },
  });
}
