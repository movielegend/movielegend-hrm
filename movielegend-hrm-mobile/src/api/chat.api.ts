import { apiClient, unwrapData } from './client';
import type { ApiResponse } from '../types/api.types';

export interface ChatGroup {
  id: string;
  name: string;
  departmentId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  groupId: string;
  senderId: string;
  content: string;
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

export async function fetchChatMessages(groupId: string, params?: { page?: number; limit?: number }) {
  const response = await apiClient.get<ApiResponse<{ items: ChatMessage[]; pagination: any }>>(`/chat/groups/${groupId}/messages`, {
    params,
  });
  return unwrapData(response);
}

export async function sendChatMessage(groupId: string, content: string) {
  const response = await apiClient.post<ApiResponse<ChatMessage>>(`/chat/groups/${groupId}/messages`, { content });
  return unwrapData(response);
}
