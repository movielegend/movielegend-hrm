import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchMyChatGroups, fetchAllChatGroups, fetchChatMessages, sendChatMessage, createDirectChat, createCustomChat, markGroupAsRead, deleteChatMessage, type SendMessagePayload } from '../api/chat.api';
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

import { useAuth } from '../providers/AuthProvider';

export function useSendMessage(groupId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (payload: SendMessagePayload) => sendChatMessage(groupId, payload),
    onMutate: async (payload: SendMessagePayload) => {
      await queryClient.cancelQueries({ queryKey: chatKeys.messages(groupId) });

      const previousMessages = queryClient.getQueryData(chatKeys.messages(groupId));
      const tempId = `temp-${Date.now()}-${Math.random()}`;

      const optimisticMsg = {
        id: tempId,
        _tempId: tempId,
        groupId,
        senderId: user?.id,
        content: payload.content,
        fileUrl: payload.fileUrl,
        fileType: payload.fileType,
        fileName: payload.fileName,
        mentions: payload.mentions ?? [],
        createdAt: new Date().toISOString(),
        sender: {
          id: user?.id,
          userCode: user?.userCode,
          profile: {
            fullName: user?.profile?.fullName || user?.userCode || 'Tôi',
            avatarUrl: user?.profile?.avatarUrl,
          },
        },
      };

      queryClient.setQueryData(chatKeys.messages(groupId), (old: any) => {
        if (!old) return { items: [optimisticMsg], pagination: {} };
        if (old.items && Array.isArray(old.items)) {
          return {
            ...old,
            items: [...old.items, optimisticMsg],
          };
        }
        if (Array.isArray(old)) return [...old, optimisticMsg];
        return { items: [optimisticMsg], pagination: {} };
      });

      return { previousMessages, tempId };
    },
    onError: (_err, _payload, context: any) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(chatKeys.messages(groupId), context.previousMessages);
      }
    },
    onSuccess: (serverMsg: any, _payload, context: any) => {
      queryClient.setQueryData(chatKeys.messages(groupId), (old: any) => {
        if (!old) return { items: [serverMsg], pagination: {} };
        const updateList = (list: any[]) => {
          const idx = list.findIndex(m => m.id === context?.tempId || m._tempId === context?.tempId);
          if (idx !== -1) {
            const copy = [...list];
            copy[idx] = serverMsg;
            return copy;
          }
          if (list.some(m => m.id === serverMsg.id)) return list;
          return [...list, serverMsg];
        };

        if (old.items && Array.isArray(old.items)) {
          return {
            ...old,
            items: updateList(old.items),
          };
        }
        if (Array.isArray(old)) return updateList(old);
        return { items: [serverMsg], pagination: {} };
      });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: chatKeys.groups() });
      void queryClient.invalidateQueries({ queryKey: chatKeys.allGroups() });
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

export function useDeleteMessage(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (messageId: string) => deleteChatMessage(groupId, messageId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: chatKeys.messages(groupId) });
    }
  });
}
