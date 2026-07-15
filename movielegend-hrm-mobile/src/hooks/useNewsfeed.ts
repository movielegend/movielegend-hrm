import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchNewsfeed, fetchNewsfeedPost, createPost, likePost, commentPost, deletePost, fetchPendingPosts, approvePost } from '../api/newsfeed.api';
import { newsfeedKeys } from '../constants/queryKeys';

export function useNewsfeedPosts(departmentId?: string) {
  return useQuery({
    queryKey: newsfeedKeys.list(departmentId),
    queryFn: () => fetchNewsfeed({ departmentId }),
  });
}

export function usePendingNewsfeedPosts(departmentId?: string) {
  return useQuery({
    queryKey: [...newsfeedKeys.list(departmentId), 'pending'],
    queryFn: () => fetchPendingPosts({ departmentId }),
  });
}

export function useApprovePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, status, rejectionReason }: { postId: string; status: 'APPROVED' | 'REJECTED'; rejectionReason?: string }) => 
      approvePost(postId, status, rejectionReason),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: newsfeedKeys.all });
    },
  });
}

export function useNewsfeedPost(postId: string) {
  return useQuery({
    queryKey: ['newsfeed', postId],
    queryFn: () => fetchNewsfeedPost(postId),
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { title: string; content: string; departmentId?: string; images?: string[] }) =>
      createPost(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: newsfeedKeys.all });
    },
  });
}

export function useLikePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) => likePost(postId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: newsfeedKeys.all });
    },
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) => deletePost(postId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: newsfeedKeys.all });
    },
  });
}

export function useAddComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, content }: { postId: string; content: string }) =>
      commentPost(postId, content),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: newsfeedKeys.all });
    },
  });
}
