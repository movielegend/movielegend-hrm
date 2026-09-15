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
  replyToId?: string | null;
  replyTo?: {
    id: string;
    content?: string | null;
    fileUrl?: string | null;
    fileType?: string | null;
    fileName?: string | null;
    sender?: {
      id: string;
      userCode?: string;
      profile?: {
        fullName?: string;
        avatarUrl?: string;
      };
    };
  } | null;
  content?: string;
  fileUrl?: string;
  fileType?: string;
  fileName?: string;
  mentions?: string[];
  reactions?: Record<string, string>;
  createdAt: string;
  sender?: {
    id: string;
    userCode?: string;
    profile?: {
      fullName: string;
      avatarUrl?: string;
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
  replyToId?: string;
  replyTo?: any;
}

export async function sendChatMessage(groupId: string, payload: SendMessagePayload) {
  const { replyTo, ...body } = payload;
  const response = await apiClient.post<ApiResponse<ChatMessage>>(`/chat/groups/${groupId}/messages`, body);
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

export async function clearChatHistory(groupId: string) {
  const response = await apiClient.post<ApiResponse<any>>(`/chat/groups/${groupId}/clear-history`);
  return unwrapData(response);
}

export async function deleteChatMessage(groupId: string, messageId: string) {
  const response = await apiClient.delete<ApiResponse<any>>(`/chat/groups/${groupId}/messages/${messageId}`);
  return unwrapData(response);
}

export async function reactChatMessage(groupId: string, messageId: string, emoji: string) {
  const response = await apiClient.post<ApiResponse<any>>(`/chat/groups/${groupId}/messages/${messageId}/react`, { emoji });
  return unwrapData(response);
}

export interface MessageReactionUser {
  user: {
    id: string;
    userCode: string;
    fullName: string;
    avatarUrl?: string;
  };
  emoji: string;
}

export async function fetchMessageReactionDetails(groupId: string, messageId: string) {
  const response = await apiClient.get<ApiResponse<MessageReactionUser[]>>(`/chat/groups/${groupId}/messages/${messageId}/reactions`);
  return unwrapData(response);
}

export interface MessageSeenUser {
  user: {
    id: string;
    userCode: string;
    fullName: string;
    avatarUrl?: string;
  };
  readAt?: string;
}

export async function fetchMessageSeenDetails(groupId: string, messageId: string) {
  const response = await apiClient.get<ApiResponse<MessageSeenUser[]>>(`/chat/groups/${groupId}/messages/${messageId}/seen-by`);
  return unwrapData(response);
}

export interface ChatGroupMemberSummary {
  id: string;
  userId: string;
  userCode: string;
  fullName: string;
  avatarUrl?: string | null;
  user?: any;
}

export async function fetchGroupMembers(groupId: string) {
  const response = await apiClient.get<ApiResponse<ChatGroupMemberSummary[]>>(`/chat/groups/${groupId}/members`);
  return unwrapData(response);
}


