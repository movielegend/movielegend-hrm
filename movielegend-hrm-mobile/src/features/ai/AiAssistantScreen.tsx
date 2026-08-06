import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { AiPrivacyModal } from '../../components/AiPrivacyModal';

import { useAuth } from '../../providers/AuthProvider';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  time: string;
}

interface AiAssistantScreenProps {
  role?: 'EMPLOYEE' | 'LEADER' | 'HR';
}

export function AiAssistantScreen({ role }: AiAssistantScreenProps) {
  const router = useRouter();
  const { user } = useAuth();
  
  // Dynamic role determination
  const currentRole = role || (user?.role as any) || 'EMPLOYEE';
  const privacyKey = `ai_privacy_accepted_${currentRole.toLowerCase()}`;

  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [hasAcceptedPrivacy, setHasAcceptedPrivacy] = useState(false);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    checkPrivacyConsent();
  }, [currentRole]);

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

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userText = input.trim();
    setInput('');

    const newMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: userText,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, newMsg]);
    setLoading(true);

    // Simulated AI response
    setTimeout(() => {
      const aiReply: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: `Chào bạn! Tôi là Trợ Lý Ảo HRM của MovieLegend. Tôi đã ghi nhận câu hỏi: "${userText}". Bạn cần tra cứu quy định công ty hay thông tin cá nhân gì không?`,
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiReply]);
      setLoading(false);
    }, 1200);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header Top Bar */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <MaterialCommunityIcons name="chevron-left" size={28} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle}>TRỢ LÝ ẢO HRM</Text>
        <View style={styles.avatarIcon}>
          <MaterialCommunityIcons name="robot-happy-outline" size={22} color="#FFFFFF" />
        </View>
      </View>

      {/* Warning Banner */}
      <View style={styles.warningBanner}>
        <MaterialCommunityIcons name="alert-circle-outline" size={16} color="#DC2626" />
        <Text style={styles.warningText}>AI có thể sai sót. Ưu tiên tra cứu tài liệu quy định nội bộ chính thức.</Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Main Content Area */}
        <ScrollView contentContainerStyle={styles.chatContent} showsVerticalScrollIndicator={false}>
          {messages.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="sparkles" size={56} color="#D1D5DB" style={{ marginBottom: 12 }} />
              <Text style={styles.emptyTitle}>Tôi có thể giúp gì cho bạn?</Text>
              <Text style={styles.emptySubtitle}>Đặt câu hỏi về quy định, ngày phép, bảng lương hoặc thủ tục làm việc.</Text>
            </View>
          ) : (
            messages.map((msg) => (
              <View key={msg.id} style={[styles.bubbleWrapper, msg.sender === 'user' ? styles.bubbleUser : styles.bubbleAi]}>
                {msg.sender === 'ai' && (
                  <View style={styles.aiAvatarSmall}>
                    <MaterialCommunityIcons name="robot" size={14} color="#2563EB" />
                  </View>
                )}
                <View style={[styles.bubble, msg.sender === 'user' ? styles.bubbleUserBg : styles.bubbleAiBg]}>
                  <Text style={[styles.messageText, msg.sender === 'user' ? styles.textUser : styles.textAi]}>{msg.text}</Text>
                  <Text style={[styles.timeText, msg.sender === 'user' ? styles.timeUser : styles.timeAi]}>{msg.time}</Text>
                </View>
              </View>
            ))
          )}

          {loading && (
            <View style={[styles.bubbleWrapper, styles.bubbleAi]}>
              <View style={styles.aiAvatarSmall}>
                <MaterialCommunityIcons name="robot" size={14} color="#0D7C85" />
              </View>
              <View style={[styles.bubble, styles.bubbleAiBg]}>
                <Text style={{ fontSize: 13, color: '#6B7280', fontStyle: 'italic' }}>AI đang suy nghĩ...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input Bar */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Hỏi trợ lý ảo HRM..."
            placeholderTextColor="#9CA3AF"
            value={input}
            onChangeText={setInput}
            onSubmitEditing={handleSend}
          />
          <Pressable style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]} onPress={handleSend} disabled={!input.trim() || loading}>
            <MaterialCommunityIcons name="send" size={18} color="#FFFFFF" />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#111827',
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  avatarIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1F2937',
    justifyContent: 'center',
    alignItems: 'center',
  },
  warningBanner: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#FEE2E2',
  },
  warningText: {
    fontSize: 11,
    color: '#EF4444',
    fontWeight: '600',
    flex: 1,
  },
  chatContent: {
    padding: 16,
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 18,
  },
  bubbleWrapper: {
    flexDirection: 'row',
    marginBottom: 14,
    alignItems: 'flex-end',
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
  },
  bubble: {
    maxWidth: '80%',
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
    borderColor: '#ECEEF3',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  textUser: {
    color: '#FFFFFF',
  },
  textAi: {
    color: '#111827',
  },
  timeText: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  timeUser: {
    color: 'rgba(255, 255, 255, 0.75)',
  },
  timeAi: {
    color: '#9CA3AF',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#ECEEF3',
    gap: 10,
  },
  input: {
    flex: 1,
    height: 44,
    backgroundColor: '#F3F4F6',
    borderRadius: 22,
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#111827',
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#9CA3AF',
  },
});
