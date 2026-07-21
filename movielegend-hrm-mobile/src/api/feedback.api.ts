import { apiClient, unwrapData } from './client';
import type { ApiResponse } from '../types/api.types';
import type {
  Feedback,
  FeedbackListResponse,
  FeedbackQuery,
  CreateFeedbackDto,
  UpdateFeedbackStatusDto,
  FeedbackStats,
} from '../types/feedback.types';

export const feedbackApi = {
  createFeedback: async (data: CreateFeedbackDto): Promise<Feedback> => {
    const response = await apiClient.post<ApiResponse<Feedback>>('/feedbacks', data);
    return unwrapData(response);
  },

  getMyFeedbacks: async (params?: FeedbackQuery): Promise<FeedbackListResponse> => {
    const response = await apiClient.get<ApiResponse<FeedbackListResponse>>('/feedbacks/me', {
      params,
    });
    return unwrapData(response);
  },

  getFeedbacksForManagement: async (params?: FeedbackQuery): Promise<FeedbackListResponse> => {
    const response = await apiClient.get<ApiResponse<FeedbackListResponse>>('/feedbacks', {
      params,
    });
    return unwrapData(response);
  },

  getFeedbackDetail: async (id: string): Promise<Feedback> => {
    const response = await apiClient.get<ApiResponse<Feedback>>(`/feedbacks/${id}`);
    return unwrapData(response);
  },

  updateFeedbackStatus: async (id: string, data: UpdateFeedbackStatusDto): Promise<Feedback> => {
    const response = await apiClient.patch<ApiResponse<Feedback>>(`/feedbacks/${id}/status`, data);
    return unwrapData(response);
  },

  deleteMyFeedback: async (id: string): Promise<void> => {
    const response = await apiClient.delete<ApiResponse<void>>(`/feedbacks/${id}`);
    return unwrapData(response);
  },

  getFeedbackStats: async (): Promise<FeedbackStats> => {
    const response = await apiClient.get<ApiResponse<FeedbackStats>>('/feedbacks/stats');
    return unwrapData(response);
  },
};
