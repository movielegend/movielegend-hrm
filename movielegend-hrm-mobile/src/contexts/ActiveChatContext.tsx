import React, { createContext, useContext, useState, ReactNode, useCallback, useRef } from 'react';

export interface ChatInAppNotification {
  id: string;
  groupId: string;
  title: string;
  body: string;
  senderName?: string;
  senderAvatarUrl?: string | null;
  groupName?: string;
  groupType?: string;
}

interface ActiveChatContextProps {
  activeGroupId: string | null;
  setActiveGroupId: (id: string | null) => void;
  activeNotification: ChatInAppNotification | null;
  showInAppChatNotification: (notification: ChatInAppNotification) => void;
  hideInAppChatNotification: () => void;
}

const ActiveChatContext = createContext<ActiveChatContextProps | undefined>(undefined);

export function ActiveChatProvider({ children }: { children: ReactNode }) {
  const [activeGroupId, setActiveGroupIdState] = useState<string | null>(null);
  const activeGroupIdRef = useRef<string | null>(null);
  const [activeNotification, setActiveNotification] = useState<ChatInAppNotification | null>(null);
  const timerRef = useRef<any>(null);

  const setActiveGroupId = useCallback((id: string | null) => {
    activeGroupIdRef.current = id;
    setActiveGroupIdState(id);
  }, []);

  const hideInAppChatNotification = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setActiveNotification(null);
  }, []);

  const showInAppChatNotification = useCallback((notification: ChatInAppNotification) => {
    // If the user is currently inside this chat group, suppress the banner completely
    if (activeGroupIdRef.current === notification.groupId) {
      return;
    }

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    setActiveNotification(notification);

    // Auto dismiss after 4.5 seconds
    timerRef.current = setTimeout(() => {
      setActiveNotification(null);
      timerRef.current = null;
    }, 4500);
  }, []);

  return (
    <ActiveChatContext.Provider
      value={{
        activeGroupId,
        setActiveGroupId,
        activeNotification,
        showInAppChatNotification,
        hideInAppChatNotification,
      }}
    >
      {children}
    </ActiveChatContext.Provider>
  );
}

export function useActiveChat() {
  const context = useContext(ActiveChatContext);
  if (!context) {
    throw new Error('useActiveChat must be used within an ActiveChatProvider');
  }
  return context;
}
