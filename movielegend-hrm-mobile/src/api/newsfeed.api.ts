import { apiClient, unwrapData } from './client';
import type { ApiResponse } from '../types/api.types';

export interface NewsfeedPost {
  id: string;
  departmentId: string | null;
  authorId: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string | null;
  _count?: {
    comments: number;
    likes: number;
  };
  author?: {
    id: string;
    userCode: string;
    profile?: {
      fullName: string;
    };
  };
  likes?: { 
    userId: string;
    user?: {
      id: string;
      profile?: {
        fullName: string;
        avatarUrl: string | null;
      };
    };
  }[];
}

export interface NewsfeedComment {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  createdAt: string;
  author?: {
    id: string;
    profile?: {
      fullName: string;
    };
  };
}

export async function fetchNewsfeed(params?: { departmentId?: string; page?: number; limit?: number }) {
  const response = await apiClient.get<ApiResponse<{ items: NewsfeedPost[]; pagination: any }>>('/newsfeed', {
    params,
  });
  return unwrapData(response);
}

export async function fetchPendingPosts(params?: { departmentId?: string; page?: number; limit?: number }) {
  const response = await apiClient.get<ApiResponse<{ items: NewsfeedPost[]; pagination: any }>>('/newsfeed/pending', {
    params,
  });
  return unwrapData(response);
}

export async function approvePost(postId: string, status: 'APPROVED' | 'REJECTED', rejectionReason?: string) {
  const response = await apiClient.patch<ApiResponse<NewsfeedPost>>(`/newsfeed/${postId}/approve`, {
    status,
    rejectionReason,
  });
  return unwrapData(response);
}

export async function fetchNewsfeedPost(postId: string) {
  const response = await apiClient.get<ApiResponse<NewsfeedPost & { comments: NewsfeedComment[] }>>(`/newsfeed/${postId}`);
  return unwrapData(response);
}

export async function createPost(data: { title: string; content: string; departmentId?: string; images?: string[] }) {
  const response = await apiClient.post<ApiResponse<NewsfeedPost>>('/newsfeed', data);
  return unwrapData(response);
}

export async function likePost(postId: string) {
  const response = await apiClient.post<ApiResponse<any>>(`/newsfeed/${postId}/like`);
  return unwrapData(response);
}

export async function commentPost(postId: string, content: string) {
  const response = await apiClient.post<ApiResponse<NewsfeedComment>>(`/newsfeed/${postId}/comments`, { content });
  return unwrapData(response);
}

export async function deletePost(postId: string) {
  const response = await apiClient.delete<ApiResponse<any>>(`/newsfeed/${postId}`);
  return unwrapData(response);
}
