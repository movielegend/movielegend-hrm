import { apiClient, unwrapData } from './client';
import type { ApiResponse } from '../types/api.types';

export interface ChatGroup {
  id: string;
  name: string;
  departmentId: string | null;
  taskId: string | null;
  type: 'DEPARTMENT' | 'TASK' | 'DIRECT' | 'CUSTOM';
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  groupId: string;
  senderId: string;
  content?: string;
  fileUrl?: string;
  fileType?: string;
  fileName?: string;
  mentions?: string[];
  createdAt: string;
  sender?: {
    id: string;
    profile?: {
      fullName: string;
    };
  };
}

export async function fetchMyChatGroups() {
  const response = await apiClient.get<ApiResponse<ChatGroup[]>>('/chat/my-groups');
  return unwrapData(response);
}

export async function fetchAllChatGroups(search?: string) {
  const response = await apiClient.get<ApiResponse<ChatGroup[]>>('/chat/admin/groups', {
    params: { search }
  });
  return unwrapData(response);
}

export async function fetchChatMessages(groupId: string, params?: { page?: number; limit?: number }) {
  const response = await apiClient.get<ApiResponse<{ items: ChatMessage[]; pagination: any }>>(`/chat/groups/${groupId}/messages`, {
    params,
  });
  return unwrapData(response);
}

export interface SendMessagePayload {
  content?: string;
  fileUrl?: string;
  fileType?: string;
  fileName?: string;
  mentions?: string[];
}

export async function sendChatMessage(groupId: string, payload: SendMessagePayload) {
  const response = await apiClient.post<ApiResponse<ChatMessage>>(`/chat/groups/${groupId}/messages`, payload);
  return unwrapData(response);
}

export async function createDirectChat(targetUserId: string) {
  const response = await apiClient.post<ApiResponse<ChatGroup>>('/chat/direct', { targetUserId });
  return unwrapData(response);
}

export async function createCustomChat(name: string, memberIds: string[]) {
  const response = await apiClient.post<ApiResponse<ChatGroup>>('/chat/custom', { name, memberIds });
  return unwrapData(response);
}

export async function markGroupAsRead(groupId: string) {
  const response = await apiClient.post<ApiResponse<any>>(`/chat/groups/${groupId}/read`);
  return unwrapData(response);
}
