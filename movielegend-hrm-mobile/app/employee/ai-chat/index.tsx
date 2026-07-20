import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { colors } from '../../../src/theme/colors';
import { spacing } from '../../../src/theme/spacing';
import { apiClient } from '../../../src/api/client';
import { shadows } from '../../../src/theme/shadows';

const { width } = Dimensions.get('window');

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

// Hàm hỗ trợ render Markdown cơ bản (In đậm, code block)
const renderFormattedText = (text: string, baseStyle: any, isUser: boolean) => {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
  return (
    <Text style={baseStyle}>
      {parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <Text key={index} style={{ fontWeight: 'bold', color: isUser ? '#fff' : '#111827' }}>{part.slice(2, -2)}</Text>;
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return (
            <Text key={index} style={{ 
              fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', 
              backgroundColor: isUser ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.05)',
              color: isUser ? '#fff' : '#EF4444'
            }}>
              {part.slice(1, -1)}
            </Text>
          );
        }
        return <Text key={index}>{part}</Text>;
      })}
    </Text>
  );
};

export default function AiChatScreen() {
  const router = useRouter();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Chào bạn, mình là Trợ lý AI của MovieLegend. Mình có thể giúp gì cho bạn trong công việc hôm nay?',
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const sendMessage = async () => {
    if (!input.trim()) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await apiClient.post('/chatbot/ask', {
        prompt: userMessage.content
      });
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data?.reply || 'Xin lỗi, không có phản hồi từ máy chủ.',
      };
      setMessages(prev => [...prev, botMessage]);
      setIsLoading(false);
      
    } catch (error) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Đã có lỗi xảy ra khi kết nối máy chủ. Vui lòng thử lại sau.',
      };
      setMessages(prev => [...prev, errorMsg]);
      setIsLoading(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.messageRow, isUser ? styles.messageRowUser : styles.messageRowAssistant]}>
        {!isUser && (
          <View style={[styles.avatarAssistant, shadows.sm]}>
            <MaterialCommunityIcons name="robot-outline" size={18} color="#fff" />
          </View>
        )}
        <View style={[
          styles.messageBubble, 
          isUser ? styles.messageBubbleUser : styles.messageBubbleAssistant,
          !isUser && shadows.sm
        ]}>
          {renderFormattedText(item.content, [styles.messageText, isUser ? styles.messageTextUser : styles.messageTextAssistant], isUser)}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top']}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 25}
      >
        <View style={[styles.header, shadows.sm]}>
          <Pressable onPress={() => router.back()} style={styles.iconBtn}>
            <MaterialCommunityIcons name="chevron-left" size={32} color="#111827" />
          </Pressable>
          <View style={styles.headerTitleContainer}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>Trợ lý AI</Text>
              <MaterialCommunityIcons name="star-four-points" size={12} color="#111827" style={{ marginLeft: 4 }} />
            </View>
            <Text style={styles.subtitle}>Powered by MovieLegend</Text>
          </View>
        </View>

        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.chatList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        {isLoading && (
          <View style={styles.typingIndicatorContainer}>
            <View style={[styles.avatarAssistant, shadows.sm]}>
              <MaterialCommunityIcons name="robot-outline" size={18} color="#fff" />
            </View>
            <View style={[styles.typingBubble, shadows.sm]}>
              <ActivityIndicator size="small" color="#10B981" />
            </View>
          </View>
        )}

        <View style={[styles.inputWrapper, shadows.md]}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Bạn muốn hỏi gì?"
              placeholderTextColor="#9CA3AF"
              value={input}
              onChangeText={setInput}
              multiline
              maxLength={1000}
            />
            <Pressable 
              style={({ pressed }) => [
                styles.sendBtn, 
                !input.trim() && styles.sendBtnDisabled,
                pressed && { opacity: 0.8 }
              ]} 
              onPress={sendMessage}
              disabled={!input.trim() || isLoading}
            >
              <MaterialCommunityIcons name="send" size={20} color={input.trim() ? '#fff' : '#9CA3AF'} />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB', // Sáng và sạch sẽ
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    zIndex: 10,
  },
  iconBtn: {
    padding: 4,
    marginRight: 4,
  },
  headerTitleContainer: {
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 12,
    color: '#111827',
    fontWeight: '500',
    marginTop: 2,
  },
  chatList: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
    maxWidth: '88%',
  },
  messageRowUser: {
    alignSelf: 'flex-end',
  },
  messageRowAssistant: {
    alignSelf: 'flex-start',
  },
  avatarAssistant: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
    alignSelf: 'flex-end',
    marginBottom: 4,
  },
  messageBubble: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 24,
  },
  messageBubbleUser: {
    backgroundColor: '#2563EB', // Xanh dương đậm sang trọng
    borderBottomRightRadius: 6,
  },
  messageBubbleAssistant: {
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 24,
  },
  messageTextUser: {
    color: '#ffffff',
  },
  messageTextAssistant: {
    color: '#374151',
  },
  typingIndicatorContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  typingBubble: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 70,
  },
  inputWrapper: {
    backgroundColor: '#fff',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? 32 : spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F3F4F6',
    borderRadius: 28,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  textInput: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: Platform.OS === 'ios' ? 12 : 8,
    paddingBottom: Platform.OS === 'ios' ? 12 : 8,
    textAlignVertical: 'center', // Fix Android text alignment
    minHeight: 44,
    maxHeight: 120,
    fontSize: 16,
    color: '#111827',
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
    marginRight: 2,
  },
  sendBtnDisabled: {
    backgroundColor: '#E5E7EB',
  },
});
