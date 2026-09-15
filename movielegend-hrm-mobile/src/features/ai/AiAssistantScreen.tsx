import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import * as Clipboard from 'expo-clipboard';
import Toast from 'react-native-toast-message';

import { AiPrivacyModal } from '../../components/AiPrivacyModal';
import { useAuth } from '../../providers/AuthProvider';
import { askAiAssistant, AiChatMessage } from '../../api/ai.api';
import { ChatWatermark } from '../../components/ChatWatermark';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  time: string;
  error?: boolean;
}

interface AiAssistantScreenProps {
  role?: 'EMPLOYEE' | 'LEADER' | 'HR' | 'ADMIN';
}

const QUICK_PROMPTS = [
  { icon: 'lightbulb-outline', label: 'Lập kế hoạch công việc tuần này', prompt: 'Hãy giúp mình lập kế hoạch công việc cho tuần này thật khoa học, phân chia độ ưu tiên theo ma trận Eisenhower.' },
  { icon: 'email-edit-outline', label: 'Soạn email công việc chuyên nghiệp', prompt: 'Hãy giúp mình soạn một email gửi sếp/đối tác xin phản hồi về tiến độ dự án với giọng văn lịch sự, chuyên nghiệp.' },
  { icon: 'code-tags', label: 'Hỏi đáp kỹ thuật & lập trình', prompt: 'Hãy giải thích cho mình sự khác biệt giữa SQL và NoSQL, và khi nào nên sử dụng từng loại kèm ví dụ cụ thể.' },
  { icon: 'compass-outline', label: 'Tư vấn giải quyết vấn đề', prompt: 'Khi gặp bất đồng ý kiến trong nhóm làm việc, có những phương pháp nào để giải quyết hiệu quả và êm đẹp?' },
  { icon: 'translate', label: 'Dịch thuật & hiệu đính văn bản', prompt: 'Hãy dịch đoạn văn sau sang tiếng Anh chuyên nghiệp, tự nhiên: "Chúng tôi rất trân trọng sự hợp tác và cam kết mang lại giải pháp tối ưu nhất cho quý khách hàng."' },
  { icon: 'office-building-cog', label: 'Quy định làm việc & chấm công', prompt: 'Quy định giờ làm việc, nghỉ trưa và cách chấm công tại công ty MovieLegend như thế nào?' },
];

export function AiAssistantScreen({ role }: AiAssistantScreenProps) {
  const router = useRouter();
  const { user } = useAuth();
  const scrollViewRef = useRef<ScrollView>(null);

  const currentRole = role || (user?.role as any) || 'EMPLOYEE';
  const privacyKey = `ai_privacy_accepted_${currentRole.toLowerCase()}`;

  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [hasAcceptedPrivacy, setHasAcceptedPrivacy] = useState(false);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  const userName =
    user?.fullName ||
    (user as any)?.name ||
    (user as any)?.profile?.fullName ||
    user?.email?.split('@')[0] ||
    'MovieLegend';

  useEffect(() => {
    checkPrivacyConsent();
  }, [currentRole]);

  useEffect(() => {
    // Auto scroll down when messages change
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

  const handleClearHistory = () => {
    if (messages.length === 0) return;
    setMessages([]);
    Toast.show({
      type: 'success',
      text1: 'Đã bắt đầu cuộc trò chuyện mới',
      position: 'bottom',
      visibilityTime: 1800,
    });
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

  const sendMessageWithPrompt = async (promptText: string) => {
    if (!promptText.trim() || loading) return;
    const userText = promptText.trim();
    setInput('');

    const newMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: userText,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedMessages = [...messages, newMsg];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      // Build conversation history for multi-turn context
      const history: AiChatMessage[] = updatedMessages.slice(0, -1).map((m) => ({
        role: m.sender === 'user' ? 'user' : 'model',
        text: m.text,
      }));

      const replyText = await askAiAssistant({
        prompt: userText,
        history,
      });

      const aiReply: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: replyText,
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiReply]);
    } catch (error: any) {
      console.error('Error calling AI assistant:', error);
      const errorReply: Message = {
        id: (Date.now() + 1).toString(),
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

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Lark-style Watermark */}
      <ChatWatermark fullName={userName} opacity={0.06} angle={-22} />

      {/* Header Top Bar */}
      <View style={styles.header}>
        <Pressable style={styles.headerBtn} onPress={() => router.back()} hitSlop={10}>
          <MaterialCommunityIcons name="chevron-left" size={28} color="#FFFFFF" />
        </Pressable>

        <View style={styles.headerCenter}>
          <View style={styles.headerTitleRow}>
            <MaterialCommunityIcons name="creation" size={16} color="#60A5FA" />
            <Text style={styles.headerTitle}>MovieLegend AI</Text>
          </View>
          <Text style={styles.headerSubtitle}>Trợ lý thông minh toàn năng</Text>
        </View>

        <Pressable
          style={[styles.headerBtn, messages.length === 0 && { opacity: 0.4 }]}
          onPress={handleClearHistory}
          disabled={messages.length === 0}
          hitSlop={10}
        >
          <MaterialCommunityIcons name="message-plus-outline" size={22} color="#FFFFFF" />
        </Pressable>
      </View>

      {/* Modern Notice Banner */}
      <View style={styles.noticeBanner}>
        <MaterialCommunityIcons name="information-outline" size={15} color="#2563EB" />
        <Text style={styles.noticeText}>
          MovieLegend AI có thể giải đáp lập trình, viết lách, giải quyết vấn đề và quy chế công ty.
        </Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
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
                <MaterialCommunityIcons name="robot-happy-outline" size={40} color="#2563EB" />
              </View>
              <Text style={styles.emptyTitle}>Chào bạn! Mình có thể giúp gì?</Text>
              <Text style={styles.emptySubtitle}>
                Hãy đặt bất kỳ câu hỏi nào về công việc, lập trình, viết nội dung, tư vấn logic hoặc quy chế công ty.
              </Text>

              {/* Quick Suggestion Pills */}
              <View style={styles.quickPromptsSection}>
                <Text style={styles.quickPromptsHeader}>Gợi ý câu hỏi bắt đầu:</Text>
                <View style={styles.quickPromptsGrid}>
                  {QUICK_PROMPTS.map((item, idx) => (
                    <Pressable
                      key={idx}
                      style={styles.quickPromptCard}
                      onPress={() => sendMessageWithPrompt(item.prompt)}
                    >
                      <View style={styles.quickPromptIconWrap}>
                        <MaterialCommunityIcons name={item.icon as any} size={18} color="#2563EB" />
                      </View>
                      <Text style={styles.quickPromptLabel} numberOfLines={2}>
                        {item.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>
          ) : (
            messages.map((msg) => (
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
                      <Pressable
                        style={styles.copyIconBtn}
                        onPress={() => handleCopyText(msg.text)}
                        hitSlop={8}
                      >
                        <MaterialCommunityIcons name="content-copy" size={13} color="#9CA3AF" />
                      </Pressable>
                    )}
                  </View>
                </View>
              </View>
            ))
          )}

          {loading && (
            <View style={[styles.bubbleWrapper, styles.bubbleAi]}>
              <View style={styles.aiAvatarSmall}>
                <MaterialCommunityIcons name="creation" size={14} color="#2563EB" />
              </View>
              <View style={[styles.bubble, styles.bubbleAiBg, styles.loadingBubble]}>
                <ActivityIndicator size="small" color="#2563EB" style={{ marginRight: 8 }} />
                <Text style={styles.loadingText}>MovieLegend AI đang suy nghĩ...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input Bar */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Hỏi bất kỳ điều gì (lập trình, viết lách, công việc...)"
            placeholderTextColor="#9CA3AF"
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={3000}
            onSubmitEditing={handleSend}
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
      </KeyboardAvoidingView>

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
                  <MaterialCommunityIcons name="content-copy" size={13} color="#9CA3AF" />
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
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#0F172A',
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
    marginTop: 1,
  },
  noticeBanner: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 14,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#DBEAFE',
  },
  noticeText: {
    fontSize: 11.5,
    color: '#1D4ED8',
    fontWeight: '500',
    flex: 1,
    lineHeight: 16,
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
    paddingTop: 24,
    paddingBottom: 20,
  },
  emptyHeroIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  emptyTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13.5,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 20,
    marginBottom: 24,
  },
  quickPromptsSection: {
    width: '100%',
    marginTop: 8,
  },
  quickPromptsHeader: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  quickPromptsGrid: {
    gap: 8,
  },
  quickPromptCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  quickPromptIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickPromptLabel: {
    fontSize: 13,
    color: '#1E293B',
    fontWeight: '600',
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
    maxWidth: '84%',
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
    justifyContent: 'flex-end',
    marginTop: 6,
    gap: 6,
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
  copyIconBtn: {
    padding: 2,
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
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
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
});
