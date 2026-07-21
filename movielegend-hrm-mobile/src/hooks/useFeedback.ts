import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { feedbackApi } from '../api/feedback.api';
import type { CreateFeedbackDto, FeedbackQuery, UpdateFeedbackStatusDto } from '../types/feedback.types';

export function useMyFeedbacks(query?: FeedbackQuery) {
  return useQuery({
    queryKey: ['myFeedbacks', query],
    queryFn: () => feedbackApi.getMyFeedbacks(query),
  });
}

export function useFeedbackDetail(id: string) {
  return useQuery({
    queryKey: ['feedbackDetail', id],
    queryFn: () => feedbackApi.getFeedbackDetail(id),
    enabled: !!id,
  });
}

export function useCreateFeedback() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateFeedbackDto) => feedbackApi.createFeedback(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myFeedbacks'] });
      queryClient.invalidateQueries({ queryKey: ['feedbacksForManagement'] });
      queryClient.invalidateQueries({ queryKey: ['feedbackStats'] });
    },
  });
}

export function useFeedbacksForManagement(query?: FeedbackQuery) {
  return useQuery({
    queryKey: ['feedbacksForManagement', query],
    queryFn: () => feedbackApi.getFeedbacksForManagement(query),
  });
}

export function useUpdateFeedbackStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateFeedbackStatusDto }) =>
      feedbackApi.updateFeedbackStatus(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['feedbacksForManagement'] });
      queryClient.invalidateQueries({ queryKey: ['feedbackDetail', id] });
      queryClient.invalidateQueries({ queryKey: ['feedbackStats'] });
    },
  });
}

export function useFeedbackStats() {
  return useQuery({
    queryKey: ['feedbackStats'],
    queryFn: () => feedbackApi.getFeedbackStats(),
  });
}
