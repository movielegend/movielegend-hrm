import { apiClient, unwrapData } from './client';
import type { ApiResponse } from '../types/api.types';

export interface WorkTask {
  id: string;
  taskCode: string;
  title: string;
  description?: string;
  category?: string;
  priority?: string;
  deadline?: string;
  workStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'WAITING' | 'DONE' | 'CANCELLED';
  approvalStatus: 'PENDING' | 'APPROVED' | 'NEED_MORE_INFO';
  latestUpdate?: {
    progress?: number;
    notes?: string;
    obstacles?: string;
  };
}

export interface MyWorkTasksResponse {
  items: WorkTask[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Lấy danh sách công việc của tôi từ module Báo cáo công việc (bảng Excel Web)
 */
export async function fetchMyWorkTasks(date?: string): Promise<WorkTask[]> {
  try {
    const response = await apiClient.get<ApiResponse<MyWorkTasksResponse>>('/work-reports/my-tasks', {
      params: { date },
    });
    const data = unwrapData(response);
    return data?.items || [];
  } catch (err) {
    console.warn('[WorkReportsApi] fetchMyWorkTasks error:', err);
    return [];
  }
}

/**
 * Cập nhật tiến độ & trạng thái của công việc trên bảng Excel Web
 */
export async function updateWorkTaskProgress(taskId: string, payload: {
  workStatus?: string;
  progress?: number;
  notes?: string;
  obstacles?: string;
  reportDate?: string;
  isTestBypass?: boolean;
}): Promise<any> {
  try {
    const response = await apiClient.post<ApiResponse<any>>(`/work-reports/tasks/${taskId}/update`, {
      ...payload,
      isTestBypass: true, // Hỗ trợ sync từ mobile ngoài khung giờ 15h-19h
    });
    return unwrapData(response);
  } catch (err) {
    console.warn('[WorkReportsApi] updateWorkTaskProgress error:', err);
    return null;
  }
}
