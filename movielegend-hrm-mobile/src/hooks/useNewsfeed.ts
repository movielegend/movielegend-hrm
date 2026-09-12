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

import { useAuth } from '../providers/AuthProvider';

export function useLikePost() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (postId: string) => likePost(postId),
    onMutate: async (postId: string) => {
      await queryClient.cancelQueries({ queryKey: newsfeedKeys.all });

      const togglePostLike = (post: any) => {
        if (!post || post.id !== postId) return post;
        const currentLikes = post.likes || [];
        const hasLiked = currentLikes.some((l: any) => l.userId === user?.id);
        const newLikes = hasLiked
          ? currentLikes.filter((l: any) => l.userId !== user?.id)
          : [...currentLikes, { userId: user?.id, postId }];
        const currentCount = post._count?.likes ?? currentLikes.length;
        const newCount = hasLiked ? Math.max(0, currentCount - 1) : currentCount + 1;

        return {
          ...post,
          likes: newLikes,
          _count: {
            ...post._count,
            likes: newCount,
          },
        };
      };

      queryClient.setQueriesData({ queryKey: newsfeedKeys.all }, (old: any) => {
        if (!old) return old;
        if (Array.isArray(old)) return old.map(togglePostLike);
        if (old.items && Array.isArray(old.items)) {
          return { ...old, items: old.items.map(togglePostLike) };
        }
        return old;
      });

      queryClient.setQueryData(['newsfeed', postId], (old: any) => togglePostLike(old));
    },
    onError: () => {
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
    mutationFn: ({ postId, content, parentId }: { postId: string; content: string; parentId?: string }) =>
      commentPost(postId, content, parentId),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: newsfeedKeys.all });
      void queryClient.invalidateQueries({ queryKey: ['newsfeed', variables.postId] });
    },
  });
}
