import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchMyChatGroups, fetchAllChatGroups, fetchChatMessages, sendChatMessage, createDirectChat, createCustomChat, markGroupAsRead, deleteChatMessage, reactChatMessage, type SendMessagePayload } from '../api/chat.api';
import { chatKeys } from '../constants/queryKeys';

export function useChatGroups() {
  return useQuery({
    queryKey: chatKeys.groups(),
    queryFn: () => fetchMyChatGroups(),
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
  });
}

export function useAllChatGroups() {
  return useQuery({
    queryKey: chatKeys.allGroups(),
    queryFn: () => fetchAllChatGroups(),
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
  });
}

export function useChatMessages(groupId: string) {
  return useQuery({
    queryKey: chatKeys.messages(groupId),
    queryFn: () => fetchChatMessages(groupId),
    enabled: Boolean(groupId),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
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
            fullName: (user as any)?.profile?.fullName || user?.userCode || 'Tôi',
            avatarUrl: (user as any)?.profile?.avatarUrl,
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
          const tempIdx = list.findIndex(m => m.id === context?.tempId || m._tempId === context?.tempId);
          if (tempIdx !== -1) {
            const copy = [...list];
            copy[tempIdx] = serverMsg;
            return copy.filter((m, idx) => m.id !== serverMsg.id || idx === tempIdx);
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
    onSuccess: (_res: any, messageId: string) => {
      queryClient.setQueryData(chatKeys.messages(groupId), (old: any) => {
        if (!old) return old;
        const markRecalled = (m: any) => {
          if (m.id === messageId || m._tempId === messageId) {
            return {
              ...m,
              content: 'Tin nhắn đã bị thu hồi',
              fileUrl: null,
              fileType: null,
              fileName: null,
            };
          }
          return m;
        };
        if (Array.isArray(old)) return old.map(markRecalled);
        if (old.items && Array.isArray(old.items)) {
          return { ...old, items: old.items.map(markRecalled) };
        }
        return old;
      });
      void queryClient.invalidateQueries({ queryKey: chatKeys.groups() });
    },
  });
}

export function useReactMessage(groupId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: ({ messageId, emoji }: { messageId: string; emoji: string }) =>
      reactChatMessage(groupId, messageId, emoji),
    onMutate: async ({ messageId, emoji }) => {
      await queryClient.cancelQueries({ queryKey: chatKeys.messages(groupId) });
      const previousMessages = queryClient.getQueryData(chatKeys.messages(groupId));

      if (user?.id) {
        queryClient.setQueryData(chatKeys.messages(groupId), (old: any) => {
          if (!old) return old;
          const toggleReaction = (m: any) => {
            if (m.id === messageId || m._tempId === messageId) {
              const currentReactions = { ...(m.reactions || {}) };
              if (currentReactions[user.id] === emoji) {
                delete currentReactions[user.id];
              } else {
                currentReactions[user.id] = emoji;
              }
              return {
                ...m,
                reactions: currentReactions,
              };
            }
            return m;
          };
          if (Array.isArray(old)) return old.map(toggleReaction);
          if (old.items && Array.isArray(old.items)) {
            return { ...old, items: old.items.map(toggleReaction) };
          }
          return old;
        });
      }

      return { previousMessages };
    },
    onError: (_err, _vars, context: any) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(chatKeys.messages(groupId), context.previousMessages);
      }
    },
    onSuccess: (res: any, { messageId }) => {
      if (res?.reactions) {
        queryClient.setQueryData(chatKeys.messages(groupId), (old: any) => {
          if (!old) return old;
          const update = (m: any) => {
            if (m.id === messageId || m._tempId === messageId) {
              return {
                ...m,
                reactions: res.reactions,
              };
            }
            return m;
          };
          if (Array.isArray(old)) return old.map(update);
          if (old.items && Array.isArray(old.items)) {
            return { ...old, items: old.items.map(update) };
          }
          return old;
        });
      }
    },
  });
}

