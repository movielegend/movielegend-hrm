import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchMyChatGroups, fetchAllChatGroups, fetchChatMessages, sendChatMessage, createDirectChat, createCustomChat, markGroupAsRead, type SendMessagePayload } from '../api/chat.api';
import { chatKeys } from '../constants/queryKeys';

export function useChatGroups() {
  return useQuery({
    queryKey: chatKeys.groups(),
    queryFn: () => fetchMyChatGroups(),
  });
}

export function useAllChatGroups() {
  return useQuery({
    queryKey: chatKeys.allGroups(),
    queryFn: () => fetchAllChatGroups(),
  });
}

export function useChatMessages(groupId: string) {
  return useQuery({
    queryKey: chatKeys.messages(groupId),
    queryFn: () => fetchChatMessages(groupId),
    enabled: Boolean(groupId),
    refetchInterval: 10_000, // polling mỗi 10s cho chat
  });
}

export function useSendMessage(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SendMessagePayload) => sendChatMessage(groupId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: chatKeys.messages(groupId) });
    },
  });
}

export function useCreateDirectChat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (targetUserId: string) => createDirectChat(targetUserId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: chatKeys.groups() });
    },
  });
}

export function useCreateCustomChat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; memberIds: string[] }) => createCustomChat(data.name, data.memberIds),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: chatKeys.groups() });
    },
  });
}

export function useMarkGroupAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (groupId: string) => markGroupAsRead(groupId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: chatKeys.groups() });
      void queryClient.invalidateQueries({ queryKey: ['notifications'] }); // Notifications unread count might change
    }
  });
}
