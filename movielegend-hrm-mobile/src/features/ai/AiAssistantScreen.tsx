import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  ActivityIndicator,
  Keyboard,
  Platform,
  Modal,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SecureStore from 'expo-secure-store';
import * as Clipboard from 'expo-clipboard';
import Toast from 'react-native-toast-message';

import { AiPrivacyModal } from '../../components/AiPrivacyModal';
import { useAuth } from '../../providers/AuthProvider';
import { askAiAssistant, AiChatMessage } from '../../api/ai.api';
import { ChatWatermark } from '../../components/ChatWatermark';
import {
  AiChatSession,
  AiMessageItem,
  loadAiSessions,
  createAiSession,
  updateAiSession,
  deleteAiSession,
  clearAllAiSessions,
  formatSessionTimeGroup,
} from '../../services/ai-chat-storage';

interface AiAssistantScreenProps {
  role?: 'EMPLOYEE' | 'LEADER' | 'HR' | 'ADMIN';
}

interface TopicCategory {
  id: string;
  name: string;
  icon: string;
  prompts: Array<{ label: string; prompt: string }>;
}

const TOPIC_CATEGORIES: TopicCategory[] = [
  {
    id: 'life',
    name: 'Đời sống',
    icon: 'coffee-outline',
    prompts: [
      {
        label: 'Gợi ý 5 món ăn tối thanh đạm, dễ nấu',
        prompt: 'Gợi ý cho mình 5 món ăn tối thanh đạm, giàu dinh dưỡng và dễ chế biến dưới 30 phút cho người bận rộn.',
      },
      {
        label: 'Mẹo giảm căng thẳng và cân bằng cuộc sống',
        prompt: 'Hôm nay mình cảm thấy khá áp lực và mệt mỏi. Bạn có thể chia sẻ vài bài tập thở hoặc lời khuyên giúp mình lấy lại tinh thần không?',
      },
      {
        label: 'Lên lịch trình du lịch 3 ngày 2 đêm',
        prompt: 'Hãy giúp mình lên lịch trình du lịch Đà Nẵng - Hội An 3 ngày 2 đêm thật chi tiết, có gợi ý món ngon và điểm check-in đẹp.',
      },
      {
        label: '3 cuốn sách phát triển bản thân đáng đọc',
        prompt: 'Gợi ý cho mình 3 cuốn sách hay nhất về phát triển bản thân và quản lý thời gian, kèm tóm tắt bài học cốt lõi của mỗi cuốn.',
      },
    ],
  },
  {
    id: 'creative',
    name: 'Sáng tạo',
    icon: 'lightbulb-outline',
    prompts: [
      {
        label: 'Brainstorm 5 ý tưởng làm video ngắn triệu view',
        prompt: 'Hãy gợi ý cho mình 5 ý tưởng làm video ngắn TikTok/Reels về chủ đề kỹ năng công sở, có mở đầu (hook) hấp dẫn gây tò mò.',
      },
      {
        label: 'Soạn email xin gia hạn deadline khéo léo',
        prompt: 'Hãy giúp mình soạn một email gửi sếp xin gia hạn deadline dự án thêm 2 ngày với lý do thuyết phục, lịch thiệp và giữ uy tín.',
      },
      {
        label: 'Viết lời chúc sinh nhật ý nghĩa và ấm áp',
        prompt: 'Hãy viết cho mình một lời chúc sinh nhật thật chân thành, ấm áp và ý nghĩa gửi cho một người bạn thân lâu năm.',
      },
      {
        label: 'Lập dàn ý bài thuyết trình truyền cảm hứng',
        prompt: 'Hãy giúp mình lập dàn ý chi tiết cho một bài thuyết trình 10 phút về chủ đề "Vượt qua nỗi sợ thất bại để bứt phá".',
      },
    ],
  },
  {
    id: 'coding',
    name: 'Lập trình',
    icon: 'code-tags',
    prompts: [
      {
        label: 'Sự khác biệt giữa SQL và NoSQL',
        prompt: 'Giải thích sự khác biệt cốt lõi giữa cơ sở dữ liệu SQL và NoSQL. Khi nào nên dùng loại nào kèm ví dụ thực tế?',
      },
      {
        label: 'Viết hàm debounce & throttle trong TypeScript',
        prompt: 'Viết cho mình hàm debounce và throttle chuẩn trong TypeScript có generic type, kèm ví dụ sử dụng thực tế.',
      },
      {
        label: 'Cách tối ưu hiệu năng ứng dụng React Native',
        prompt: 'Chia sẻ các kỹ thuật hàng đầu giúp tối ưu hiệu năng (FPS, bộ nhớ RAM, thời gian khởi động) cho ứng dụng React Native.',
      },
      {
        label: 'Giải thích thuật toán Binary Search dễ hiểu',
        prompt: 'Giải thích thuật toán tìm kiếm nhị phân (Binary Search) bằng hình ảnh ẩn dụ dễ hiểu, độ phức tạp thời gian và code mẫu Python.',
      },
    ],
  },
  {
    id: 'learning',
    name: 'Học tập',
    icon: 'school-outline',
    prompts: [
      {
        label: 'Dịch đoạn văn tiếng Việt sang tiếng Anh tự nhiên',
        prompt: 'Hãy dịch đoạn văn sau sang tiếng Anh chuyên nghiệp, tự nhiên như người bản xứ: "Chúng tôi cam kết luôn lắng nghe và mang lại giá trị bền vững nhất cho bạn."',
      },
      {
        label: 'Giải thích Điện toán lượng tử thật dễ hiểu',
        prompt: 'Hãy giải thích khái niệm Điện toán lượng tử (Quantum Computing) cho một người không rành kỹ thuật bằng cách ẩn dụ thật sinh động.',
      },
      {
        label: 'Phương pháp tự học nhanh theo kỹ thuật Feynman',
        prompt: 'Hướng dẫn 4 bước tự học sâu và ghi nhớ kiến thức lâu theo kỹ thuật Feynman (Feynman Technique) kèm ví dụ áp dụng.',
      },
      {
        label: 'Nguyên tắc quản lý thời gian Eisenhower',
        prompt: 'Phân tích ma trận Eisenhower trong quản lý thời gian và hướng dẫn cách phân loại công việc hàng ngày vào 4 góc phần tư.',
      },
    ],
  },
];

export function AiAssistantScreen({ role }: AiAssistantScreenProps) {
  const router = useRouter();
  const { user } = useAuth();
  const scrollViewRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 120);
      }
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const currentRole = role || (user?.roles?.[0] as any) || (user as any)?.role || 'EMPLOYEE';
  const privacyKey = `ai_privacy_accepted_${String(currentRole).toLowerCase()}`;

  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [hasAcceptedPrivacy, setHasAcceptedPrivacy] = useState(false);

  // Chat sessions state
  const [sessions, setSessions] = useState<AiChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<AiMessageItem[]>([]);
  const [selectedTopicTab, setSelectedTopicTab] = useState<string>('life');

  const userName =
    user?.fullName ||
    (user as any)?.name ||
    (user as any)?.profile?.fullName ||
    user?.email?.split('@')[0] ||
    'Bạn';

  // Check privacy consent & load sessions on mount
  useEffect(() => {
    checkPrivacyConsent();
    initSessions();
  }, [currentRole]);

  async function initSessions() {
    try {
      const loaded = await loadAiSessions();
      setSessions(loaded);
      if (loaded.length > 0) {
        // Automatically restore the most recent session
        const latest = loaded[0];
        setCurrentSessionId(latest.id);
        setMessages(latest.messages || []);
      }
    } catch (e) {
      console.warn('Failed to load chat sessions:', e);
    }
  }

  useEffect(() => {
    // Auto scroll down when messages change or loading
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, loading]);

  async function checkPrivacyConsent() {
    try {
      const accepted = await SecureStore.getItemAsync(privacyKey);
      if (accepted === 'true') {
        setHasAcceptedPrivacy(true);
      } else {
        setShowPrivacyModal(true);
      }
    } catch {
      setShowPrivacyModal(true);
    }
  }

  const handleAcceptPrivacy = async () => {
    try {
      await SecureStore.setItemAsync(privacyKey, 'true');
      setHasAcceptedPrivacy(true);
      setShowPrivacyModal(false);
    } catch {
      setShowPrivacyModal(false);
    }
  };

  const handleDeclinePrivacy = () => {
    setShowPrivacyModal(false);
    router.back();
  };

  // Start a new empty session
  const handleNewChat = () => {
    setCurrentSessionId(null);
    setMessages([]);
    setInput('');
    setShowHistoryModal(false);
    Toast.show({
      type: 'success',
      text1: 'Đã bắt đầu cuộc trò chuyện mới',
      position: 'bottom',
      visibilityTime: 1500,
    });
  };

  // Switch to a previous session
  const handleSelectSession = (session: AiChatSession) => {
    setCurrentSessionId(session.id);
    setMessages(session.messages || []);
    setInput('');
    setShowHistoryModal(false);
  };

  // Delete a session
  const handleDeleteSession = async (sessionId: string) => {
    await deleteAiSession(sessionId);
    const updated = sessions.filter((s) => s.id !== sessionId);
    setSessions(updated);

    if (currentSessionId === sessionId) {
      if (updated.length > 0) {
        setCurrentSessionId(updated[0].id);
        setMessages(updated[0].messages || []);
      } else {
        setCurrentSessionId(null);
        setMessages([]);
      }
    }
    Toast.show({
      type: 'info',
      text1: 'Đã xóa cuộc trò chuyện',
      position: 'bottom',
      visibilityTime: 1200,
    });
  };

  // Clear all sessions
  const handleClearAllSessions = () => {
    Alert.alert(
      'Xóa toàn bộ lịch sử',
      'Bạn có chắc chắn muốn xóa tất cả các cuộc trò chuyện trước đây không?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa tất cả',
          style: 'destructive',
          onPress: async () => {
            await clearAllAiSessions();
            setSessions([]);
            setCurrentSessionId(null);
            setMessages([]);
            setShowHistoryModal(false);
            Toast.show({
              type: 'success',
              text1: 'Đã xóa toàn bộ lịch sử trò chuyện',
              position: 'bottom',
              visibilityTime: 1500,
            });
          },
        },
      ]
    );
  };

  const handleCopyText = async (text: string) => {
    try {
      await Clipboard.setStringAsync(text);
      Toast.show({
        type: 'success',
        text1: 'Đã sao chép vào bộ nhớ tạm',
        position: 'bottom',
        visibilityTime: 1500,
      });
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const sendMessageWithPrompt = async (promptText: string, isRegenerate = false) => {
    if (!promptText.trim() || loading) return;
    const userText = promptText.trim();
    setInput('');

    let updatedMessages: AiMessageItem[] = [];

    if (isRegenerate) {
      // Remove last AI message and keep preceding
      updatedMessages = messages.filter((m, i) => i !== messages.length - 1);
    } else {
      const newMsg: AiMessageItem = {
        id: `${Date.now()}_user`,
        sender: 'user',
        text: userText,
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };
      updatedMessages = [...messages, newMsg];
    }

    setMessages(updatedMessages);
    setLoading(true);

    try {
      // Build conversation history for multi-turn context (excluding error messages)
      const history: AiChatMessage[] = updatedMessages
        .filter((m) => !m.error && m.text.trim())
        .slice(0, isRegenerate ? updatedMessages.length : updatedMessages.length - 1)
        .map((m) => ({
          role: m.sender === 'user' ? 'user' : 'model',
          text: m.text,
        }));

      const replyText = await askAiAssistant({
        prompt: userText,
        history,
      });

      const aiReply: AiMessageItem = {
        id: `${Date.now() + 1}_ai`,
        sender: 'ai',
        text: replyText,
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };

      const finalMessages = [...updatedMessages, aiReply];
      setMessages(finalMessages);

      // Persist to session storage
      if (!currentSessionId) {
        const newSession = await createAiSession(userText, replyText);
        setCurrentSessionId(newSession.id);
        const allSessions = await loadAiSessions();
        setSessions(allSessions);
      } else {
        await updateAiSession(currentSessionId, finalMessages);
        const allSessions = await loadAiSessions();
        setSessions(allSessions);
      }
    } catch (error: any) {
      console.error('Error calling AI assistant:', error);
      const errorReply: AiMessageItem = {
        id: `${Date.now() + 1}_ai`,
        sender: 'ai',
        text: 'Rất tiếc, đã có lỗi kết nối tới máy chủ AI. Vui lòng kiểm tra lại mạng hoặc thử lại sau giây lát.',
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        error: true,
      };
      setMessages((prev) => [...prev, errorReply]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = () => {
    sendMessageWithPrompt(input);
  };

  const handleRegenerate = () => {
    if (messages.length < 2 || loading) return;
    const lastUserMessage = [...messages].reverse().find((m) => m.sender === 'user');
    if (lastUserMessage) {
      sendMessageWithPrompt(lastUserMessage.text, true);
    }
  };

  // Group sessions by date for history modal
  const groupedSessions = useMemo(() => {
    const groups: { [key: string]: AiChatSession[] } = {};
    for (const session of sessions) {
      const groupKey = formatSessionTimeGroup(session.updatedAt || session.createdAt);
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(session);
    }
    return groups;
  }, [sessions]);

  const activeCategory = TOPIC_CATEGORIES.find((c) => c.id === selectedTopicTab) || TOPIC_CATEGORIES[0];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="light" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
        keyboardVerticalOffset={0}
        enabled={Platform.OS === 'ios' ? true : isKeyboardVisible}
      >
        {/* Header Top Bar */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Pressable style={styles.headerBtn} onPress={() => router.back()} hitSlop={10}>
              <MaterialCommunityIcons name="chevron-left" size={28} color="#FFFFFF" />
            </Pressable>

            <Pressable
              style={styles.headerBtn}
              onPress={() => setShowHistoryModal(true)}
              hitSlop={10}
            >
              <MaterialCommunityIcons name="history" size={24} color="#94A3B8" />
            </Pressable>
          </View>

          <View style={styles.headerCenter}>
            <View style={styles.headerTitleRow}>
              <MaterialCommunityIcons name="creation" size={17} color="#60A5FA" />
              <Text style={styles.headerTitle}>Trợ lý AI</Text>
            </View>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {currentSessionId
                ? sessions.find((s) => s.id === currentSessionId)?.title || 'Trò chuyện thông minh'
                : 'Đồng hành toàn năng'}
            </Text>
          </View>

          <Pressable
            style={[styles.headerBtn, styles.newChatBtn]}
            onPress={handleNewChat}
            hitSlop={10}
          >
            <MaterialCommunityIcons name="plus" size={22} color="#FFFFFF" />
          </Pressable>
        </View>

        <View style={styles.body}>
          <ChatWatermark customName={userName} opacity={0.05} />

          {/* Main Content Area */}
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={styles.chatContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {messages.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyHeroIcon}>
                  <MaterialCommunityIcons name="creation" size={38} color="#2563EB" />
                </View>
                <Text style={styles.emptyTitle}>Xin chào, mình có thể giúp gì cho bạn?</Text>
                <Text style={styles.emptySubtitle}>
                  Hãy hỏi bất kỳ điều gì về cuộc sống, kiến thức, lập trình, sáng tạo hoặc công việc thường ngày.
                </Text>

                {/* Category Tabs */}
                <View style={styles.categoryTabsRow}>
                  {TOPIC_CATEGORIES.map((cat) => (
                    <Pressable
                      key={cat.id}
                      style={[
                        styles.categoryTabBtn,
                        selectedTopicTab === cat.id && styles.categoryTabBtnActive,
                      ]}
                      onPress={() => setSelectedTopicTab(cat.id)}
                    >
                      <MaterialCommunityIcons
                        name={cat.icon as any}
                        size={15}
                        color={selectedTopicTab === cat.id ? '#FFFFFF' : '#64748B'}
                      />
                      <Text
                        style={[
                          styles.categoryTabText,
                          selectedTopicTab === cat.id && styles.categoryTabTextActive,
                        ]}
                      >
                        {cat.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                {/* Quick Prompts List for Active Category */}
                <View style={styles.promptsList}>
                  {activeCategory.prompts.map((item, idx) => (
                    <Pressable
                      key={idx}
                      style={styles.promptCard}
                      onPress={() => sendMessageWithPrompt(item.prompt)}
                    >
                      <View style={styles.promptIconWrap}>
                        <MaterialCommunityIcons name={activeCategory.icon as any} size={16} color="#2563EB" />
                      </View>
                      <Text style={styles.promptCardLabel} numberOfLines={2}>
                        {item.label}
                      </Text>
                      <MaterialCommunityIcons name="arrow-top-right" size={16} color="#94A3B8" />
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : (
              messages.map((msg, index) => {
                const isLastAiMessage = msg.sender === 'ai' && index === messages.length - 1;

                return (
                  <View
                    key={msg.id}
                    style={[styles.bubbleWrapper, msg.sender === 'user' ? styles.bubbleUser : styles.bubbleAi]}
                  >
                    {msg.sender === 'ai' && (
                      <View style={styles.aiAvatarSmall}>
                        <MaterialCommunityIcons name="creation" size={14} color="#2563EB" />
                      </View>
                    )}

                    <View
                      style={[
                        styles.bubble,
                        msg.sender === 'user' ? styles.bubbleUserBg : styles.bubbleAiBg,
                        msg.error && styles.bubbleErrorBg,
                      ]}
                    >
                      <FormattedMessageText text={msg.text} isUser={msg.sender === 'user'} onCopy={handleCopyText} />

                      <View style={styles.bubbleFooter}>
                        <Text
                          style={[styles.timeText, msg.sender === 'user' ? styles.timeUser : styles.timeAi]}
                        >
                          {msg.time}
                        </Text>

                        {msg.sender === 'ai' && !msg.error && (
                          <View style={styles.aiActionsRow}>
                            {isLastAiMessage && (
                              <Pressable
                                style={styles.actionIconBtn}
                                onPress={handleRegenerate}
                                hitSlop={8}
                              >
                                <MaterialCommunityIcons name="refresh" size={14} color="#64748B" />
                                <Text style={styles.actionIconText}>Tạo lại</Text>
                              </Pressable>
                            )}

                            <Pressable
                              style={styles.actionIconBtn}
                              onPress={() => handleCopyText(msg.text)}
                              hitSlop={8}
                            >
                              <MaterialCommunityIcons name="content-copy" size={13} color="#64748B" />
                              <Text style={styles.actionIconText}>Sao chép</Text>
                            </Pressable>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                );
              })
            )}

            {loading && (
              <View style={[styles.bubbleWrapper, styles.bubbleAi]}>
                <View style={styles.aiAvatarSmall}>
                  <MaterialCommunityIcons name="creation" size={14} color="#2563EB" />
                </View>
                <View style={[styles.bubble, styles.bubbleAiBg, styles.loadingBubble]}>
                  <ActivityIndicator size="small" color="#2563EB" style={{ marginRight: 8 }} />
                  <Text style={styles.loadingText}>Trợ lý AI đang suy nghĩ...</Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Bottom Input & Disclaimer Bar */}
          <View
            style={[
              styles.inputContainer,
              { paddingBottom: isKeyboardVisible ? 10 : Math.max(insets.bottom, 10) },
            ]}
          >
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder="Hỏi bất kỳ điều gì (đời sống, kỹ thuật, ý tưởng...)"
                placeholderTextColor="#94A3B8"
                value={input}
                onChangeText={setInput}
                multiline
                maxLength={4000}
                onSubmitEditing={handleSend}
                onFocus={() => {
                  setTimeout(() => {
                    scrollViewRef.current?.scrollToEnd({ animated: true });
                  }, 120);
                }}
              />
              <Pressable
                style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
                onPress={handleSend}
                disabled={!input.trim() || loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <MaterialCommunityIcons name="arrow-up" size={22} color="#FFFFFF" />
                )}
              </Pressable>
            </View>

            <Text style={styles.disclaimerText}>
              AI có thể mắc lỗi. Hãy kiểm chứng các thông tin quan trọng.
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Chat History Drawer / Modal */}
      <Modal
        visible={showHistoryModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowHistoryModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View style={styles.modalTitleRow}>
              <MaterialCommunityIcons name="history" size={20} color="#0F172A" />
              <Text style={styles.modalTitle}>Lịch sử trò chuyện</Text>
            </View>
            <Pressable
              style={styles.modalCloseBtn}
              onPress={() => setShowHistoryModal(false)}
            >
              <MaterialCommunityIcons name="close" size={22} color="#64748B" />
            </Pressable>
          </View>

          <Pressable style={styles.modalNewChatBtn} onPress={handleNewChat}>
            <MaterialCommunityIcons name="plus-circle" size={20} color="#2563EB" />
            <Text style={styles.modalNewChatText}>Bắt đầu cuộc trò chuyện mới</Text>
          </Pressable>

          <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
            {Object.keys(groupedSessions).length === 0 ? (
              <View style={styles.modalEmpty}>
                <MaterialCommunityIcons name="message-outline" size={44} color="#CBD5E1" />
                <Text style={styles.modalEmptyText}>Chưa có lịch sử trò chuyện nào</Text>
              </View>
            ) : (
              Object.entries(groupedSessions).map(([groupTitle, groupList]) => (
                <View key={groupTitle} style={styles.historyGroup}>
                  <Text style={styles.historyGroupTitle}>{groupTitle}</Text>
                  {groupList.map((session) => {
                    const isActive = session.id === currentSessionId;
                    return (
                      <Pressable
                        key={session.id}
                        style={[styles.sessionItem, isActive && styles.sessionItemActive]}
                        onPress={() => handleSelectSession(session)}
                      >
                        <MaterialCommunityIcons
                          name="chat-processing-outline"
                          size={18}
                          color={isActive ? '#2563EB' : '#64748B'}
                        />
                        <View style={{ flex: 1 }}>
                          <Text
                            style={[styles.sessionTitle, isActive && styles.sessionTitleActive]}
                            numberOfLines={1}
                          >
                            {session.title}
                          </Text>
                          <Text style={styles.sessionMeta}>
                            {session.messages?.length || 0} tin nhắn • {new Date(session.updatedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          </Text>
                        </View>
                        <Pressable
                          style={styles.sessionDeleteBtn}
                          onPress={() => handleDeleteSession(session.id)}
                          hitSlop={8}
                        >
                          <MaterialCommunityIcons name="trash-can-outline" size={17} color="#EF4444" />
                        </Pressable>
                      </Pressable>
                    );
                  })}
                </View>
              ))
            )}
          </ScrollView>

          {sessions.length > 0 && (
            <View style={styles.modalFooter}>
              <Pressable style={styles.clearAllBtn} onPress={handleClearAllSessions}>
                <MaterialCommunityIcons name="delete-sweep-outline" size={18} color="#EF4444" />
                <Text style={styles.clearAllText}>Xóa toàn bộ lịch sử trò chuyện</Text>
              </Pressable>
            </View>
          )}
        </View>
      </Modal>

      {/* Privacy Consent Modal */}
      <AiPrivacyModal
        visible={showPrivacyModal}
        role={currentRole}
        onAccept={handleAcceptPrivacy}
        onDecline={handleDeclinePrivacy}
      />
    </SafeAreaView>
  );
}

/**
 * Renders rich text with support for code blocks, bold markers, bullet points, and headers
 */
function FormattedMessageText({
  text,
  isUser,
  onCopy,
}: {
  text: string;
  isUser: boolean;
  onCopy: (txt: string) => void;
}) {
  if (isUser) {
    return <Text style={[styles.messageText, styles.textUser]}>{text}</Text>;
  }

  // Parse code blocks with ```...```
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  const parts: Array<{ type: 'text' | 'code'; content: string; language?: string }> = [];

  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: text.substring(lastIndex, match.index),
      });
    }
    parts.push({
      type: 'code',
      language: match[1] || 'code',
      content: match[2].trim(),
    });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({
      type: 'text',
      content: text.substring(lastIndex),
    });
  }

  return (
    <View style={{ gap: 8 }}>
      {parts.map((part, index) => {
        if (part.type === 'code') {
          return (
            <View key={index} style={styles.codeBlock}>
              <View style={styles.codeHeader}>
                <Text style={styles.codeLangText}>{part.language}</Text>
                <Pressable
                  style={styles.codeCopyBtn}
                  onPress={() => onCopy(part.content)}
                  hitSlop={6}
                >
                  <MaterialCommunityIcons name="content-copy" size={13} color="#94A3B8" />
                  <Text style={styles.codeCopyText}>Sao chép</Text>
                </Pressable>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <Text style={styles.codeContentText} selectable>
                  {part.content}
                </Text>
              </ScrollView>
            </View>
          );
        }

        // Format regular text lines (handle **bold**, bullets, headers)
        return (
          <Text key={index} style={[styles.messageText, styles.textAi]} selectable>
            {renderInlineMarkdown(part.content)}
          </Text>
        );
      })}
    </View>
  );
}

function renderInlineMarkdown(rawText: string) {
  const lines = rawText.split('\n');

  return lines.map((line, lineIdx) => {
    const isHeader = line.startsWith('### ') || line.startsWith('## ') || line.startsWith('# ');
    const isBullet = line.trim().startsWith('- ') || line.trim().startsWith('* ') || line.trim().startsWith('• ');
    const isNumbered = /^\s*\d+\.\s+/.test(line);

    const cleanLine = line
      .replace(/^###\s+/, '')
      .replace(/^##\s+/, '')
      .replace(/^#\s+/, '')
      .replace(/^[-*•]\s+/, '• ');

    // Parse **bold** parts
    const boldTokens = cleanLine.split(/(\*\*.*?\*\*)/g);

    return (
      <Text
        key={lineIdx}
        style={[
          isHeader && styles.headerLine,
          (isBullet || isNumbered) && styles.bulletLine,
        ]}
      >
        {boldTokens.map((token, tokenIdx) => {
          if (token.startsWith('**') && token.endsWith('**')) {
            const inner = token.substring(2, token.length - 2);
            return (
              <Text key={tokenIdx} style={styles.boldText}>
                {inner}
              </Text>
            );
          }
          return <Text key={tokenIdx}>{token}</Text>;
        })}
        {lineIdx < lines.length - 1 ? '\n' : ''}
      </Text>
    );
  });
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  body: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#0F172A',
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  newChatBtn: {
    backgroundColor: '#2563EB',
  },
  headerCenter: {
    alignItems: 'center',
    maxWidth: '55%',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  headerTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
    marginTop: 1,
  },
  chatContent: {
    padding: 16,
    flexGrow: 1,
    paddingBottom: 24,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 20,
  },
  emptyHeroIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 19,
    marginBottom: 20,
  },
  categoryTabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  categoryTabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryTabBtnActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  categoryTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  categoryTabTextActive: {
    color: '#FFFFFF',
  },
  promptsList: {
    width: '100%',
    gap: 8,
  },
  promptCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  promptIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  promptCardLabel: {
    fontSize: 13,
    color: '#1E293B',
    fontWeight: '500',
    flex: 1,
    lineHeight: 18,
  },
  bubbleWrapper: {
    flexDirection: 'row',
    marginBottom: 14,
    alignItems: 'flex-start',
    gap: 8,
  },
  bubbleUser: {
    justifyContent: 'flex-end',
  },
  bubbleAi: {
    justifyContent: 'flex-start',
  },
  aiAvatarSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  bubble: {
    maxWidth: '85%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  bubbleUserBg: {
    backgroundColor: '#2563EB',
    borderBottomRightRadius: 4,
    alignSelf: 'flex-end',
  },
  bubbleAiBg: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  bubbleErrorBg: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  messageText: {
    fontSize: 14.5,
    lineHeight: 22,
  },
  textUser: {
    color: '#FFFFFF',
  },
  textAi: {
    color: '#0F172A',
  },
  boldText: {
    fontWeight: '700',
    color: '#0F172A',
  },
  headerLine: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#0F172A',
    marginVertical: 4,
  },
  bulletLine: {
    lineHeight: 22,
  },
  bubbleFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 4,
    borderTopWidth: 0.5,
    borderTopColor: '#F1F5F9',
  },
  aiActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionIconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  actionIconText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  timeText: {
    fontSize: 10.5,
  },
  timeUser: {
    color: 'rgba(255, 255, 255, 0.75)',
  },
  timeAi: {
    color: '#94A3B8',
  },
  codeBlock: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    overflow: 'hidden',
    marginVertical: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  codeHeader: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  codeLangText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  codeCopyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  codeCopyText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  codeContentText: {
    color: '#F8FAFC',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12.5,
    padding: 10,
    lineHeight: 18,
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
    fontStyle: 'italic',
  },
  inputContainer: {
    paddingHorizontal: 12,
    paddingTop: 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: '#F1F5F9',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 11,
    paddingBottom: 11,
    fontSize: 14.5,
    color: '#0F172A',
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#CBD5E1',
  },
  disclaimerText: {
    fontSize: 10.5,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 6,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 16.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalNewChatBtn: {
    margin: 14,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  modalNewChatText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2563EB',
  },
  modalScroll: {
    flex: 1,
    paddingHorizontal: 14,
  },
  modalEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 10,
  },
  modalEmptyText: {
    fontSize: 14,
    color: '#94A3B8',
  },
  historyGroup: {
    marginBottom: 16,
  },
  historyGroupTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    paddingLeft: 4,
  },
  sessionItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sessionItemActive: {
    borderColor: '#2563EB',
    backgroundColor: '#F0F7FF',
  },
  sessionTitle: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  sessionTitleActive: {
    color: '#2563EB',
    fontWeight: '700',
  },
  sessionMeta: {
    fontSize: 11,
    color: '#94A3B8',
  },
  sessionDeleteBtn: {
    padding: 6,
  },
  modalFooter: {
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  clearAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  clearAllText: {
    fontSize: 13,
    color: '#EF4444',
    fontWeight: '600',
  },
});
