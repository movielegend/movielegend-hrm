import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

export interface AiMessageItem {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  time: string;
  error?: boolean;
}

export interface AiChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: AiMessageItem[];
}

const STORAGE_FILE_NAME = 'ai_chat_sessions_v1.json';
let inMemorySessionsCache: AiChatSession[] | null = null;

function getFilePath(): string | null {
  if (Platform.OS === 'web' || !FileSystem.documentDirectory) {
    return null;
  }
  return `${FileSystem.documentDirectory}${STORAGE_FILE_NAME}`;
}

export async function loadAiSessions(): Promise<AiChatSession[]> {
  if (inMemorySessionsCache) {
    return inMemorySessionsCache;
  }

  const filePath = getFilePath();

  if (!filePath) {
    // Web fallback
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const raw = window.localStorage.getItem(STORAGE_FILE_NAME);
        if (raw) {
          inMemorySessionsCache = JSON.parse(raw);
          return inMemorySessionsCache || [];
        }
      } catch {
        // Fallback to empty
      }
    }
    return [];
  }

  try {
    const fileInfo = await FileSystem.getInfoAsync(filePath);
    if (!fileInfo.exists) {
      inMemorySessionsCache = [];
      return [];
    }

    const content = await FileSystem.readAsStringAsync(filePath, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    if (!content || !content.trim()) {
      inMemorySessionsCache = [];
      return [];
    }

    const parsed: AiChatSession[] = JSON.parse(content);
    if (Array.isArray(parsed)) {
      // Sort by latest updated first
      parsed.sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));
      inMemorySessionsCache = parsed;
      return parsed;
    }

    inMemorySessionsCache = [];
    return [];
  } catch (error) {
    console.warn('[AiChatStorage] Failed to read sessions:', error);
    inMemorySessionsCache = [];
    return [];
  }
}

export async function saveAiSessions(sessions: AiChatSession[]): Promise<void> {
  // Sort descending by updatedAt
  sessions.sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));
  inMemorySessionsCache = [...sessions];

  const filePath = getFilePath();

  if (!filePath) {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(STORAGE_FILE_NAME, JSON.stringify(sessions));
      } catch (e) {
        console.warn('[AiChatStorage] LocalStorage save failed:', e);
      }
    }
    return;
  }

  try {
    const data = JSON.stringify(sessions);
    await FileSystem.writeAsStringAsync(filePath, data, {
      encoding: FileSystem.EncodingType.UTF8,
    });
  } catch (error) {
    console.warn('[AiChatStorage] Failed to save sessions:', error);
  }
}

export function generateSessionTitle(prompt: string): string {
  if (!prompt) return 'Cuộc trò chuyện mới';
  const clean = prompt
    .replace(/[\r\n]+/g, ' ')
    .replace(/[`*#_~]+/g, '')
    .trim();

  if (clean.length <= 38) return clean;
  return clean.slice(0, 35) + '...';
}

export async function createAiSession(
  initialUserText?: string,
  initialAiReply?: string
): Promise<AiChatSession> {
  const sessions = await loadAiSessions();
  const now = Date.now();
  const timeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

  const messages: AiMessageItem[] = [];
  if (initialUserText) {
    messages.push({
      id: `${now}_user`,
      sender: 'user',
      text: initialUserText,
      time: timeStr,
    });
  }
  if (initialAiReply) {
    messages.push({
      id: `${now + 1}_ai`,
      sender: 'ai',
      text: initialAiReply,
      time: timeStr,
    });
  }

  const newSession: AiChatSession = {
    id: `session_${now}_${Math.random().toString(36).slice(2, 7)}`,
    title: initialUserText ? generateSessionTitle(initialUserText) : 'Cuộc trò chuyện mới',
    createdAt: now,
    updatedAt: now,
    messages,
  };

  const updatedSessions = [newSession, ...sessions];
  await saveAiSessions(updatedSessions);
  return newSession;
}

export async function updateAiSession(
  sessionId: string,
  messages: AiMessageItem[],
  customTitle?: string
): Promise<AiChatSession | null> {
  const sessions = await loadAiSessions();
  const idx = sessions.findIndex((s) => s.id === sessionId);

  if (idx === -1) {
    return null;
  }

  const existing = sessions[idx];
  const now = Date.now();

  let title = existing.title;
  if (customTitle) {
    title = customTitle;
  } else if (
    (existing.title === 'Cuộc trò chuyện mới' || !existing.title) &&
    messages.length > 0 &&
    messages[0].sender === 'user'
  ) {
    title = generateSessionTitle(messages[0].text);
  }

  const updated: AiChatSession = {
    ...existing,
    title,
    updatedAt: now,
    messages,
  };

  sessions[idx] = updated;
  await saveAiSessions(sessions);
  return updated;
}

export async function deleteAiSession(sessionId: string): Promise<void> {
  const sessions = await loadAiSessions();
  const filtered = sessions.filter((s) => s.id !== sessionId);
  await saveAiSessions(filtered);
}

export async function clearAllAiSessions(): Promise<void> {
  await saveAiSessions([]);
}

export function formatSessionTimeGroup(timestamp: number): string {
  const now = new Date();
  const date = new Date(timestamp);

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;
  const startOf7Days = startOfToday - 7 * 24 * 60 * 60 * 1000;

  if (timestamp >= startOfToday) {
    return 'Hôm nay';
  }
  if (timestamp >= startOfYesterday) {
    return 'Hôm qua';
  }
  if (timestamp >= startOf7Days) {
    return '7 ngày trước';
  }
  return 'Cũ hơn';
}
