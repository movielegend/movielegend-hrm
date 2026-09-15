import { apiClient, unwrapData } from './client';
import type { ApiResponse } from '../types/api.types';

export interface AiChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface AskAiPayload {
  prompt: string;
  history?: AiChatMessage[];
}

export interface AskAiResponse {
  success: boolean;
  reply: string;
  message?: string;
}

export async function askAiAssistant(payload: AskAiPayload): Promise<string> {
  const response = await apiClient.post<ApiResponse<AskAiResponse>>('/chatbot/ask', payload);
  const data = unwrapData(response);
  if (typeof data === 'string') {
    return data;
  }
  if (data?.reply) {
    return data.reply;
  }
  if (data?.message) {
    return data.message;
  }
  return 'Không nhận được phản hồi từ AI.';
}
