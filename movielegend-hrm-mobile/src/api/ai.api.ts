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
  reply: string;
  message?: string;
}

export async function askAiAssistant(payload: AskAiPayload): Promise<string> {
  const response = await apiClient.post<any>('/chatbot/ask', payload);
  const resData = response.data;

  // Direct reply in root body
  if (typeof resData === 'string' && resData.trim()) {
    return resData;
  }
  if (resData?.data?.reply && typeof resData.data.reply === 'string') {
    return resData.data.reply;
  }
  if (resData?.reply && typeof resData.reply === 'string') {
    return resData.reply;
  }
  if (resData?.data && typeof resData.data === 'string') {
    return resData.data;
  }

  // UnwrapData fallback
  try {
    const unwrapped = unwrapData(response) as any;
    if (typeof unwrapped === 'string') return unwrapped;
    if (unwrapped?.reply) return unwrapped.reply;
    if (unwrapped?.message) return unwrapped.message;
  } catch (err) {
    // If error object in response
    if (resData?.message) return resData.message;
  }

  return 'Không nhận được phản hồi từ AI.';
}
