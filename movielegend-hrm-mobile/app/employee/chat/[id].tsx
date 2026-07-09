import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState, useRef } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, Pressable, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen } from '../../../src/components/Screen';
import { PageHeader } from '../../../src/components/PageHeader';
import { fetchChatMessages, sendChatMessage, type ChatMessage } from '../../../src/api/chat.api';
import { createHrmSocket } from '../../../src/api/socket';
import { useAuth } from '../../../src/providers/AuthProvider';
import { colors } from '../../../src/theme/colors';
import { spacing } from '../../../src/theme/spacing';
import type { Socket } from 'socket.io-client';

export default function ChatRoomScreen() {
  const router = useRouter();
  const { id: groupId, departmentId } = useLocalSearchParams<{ id: string, departmentId: string }>();
  const { user } = useAuth();
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchChatMessages(groupId);
        // data.items returns newest first because orderBy desc
        setMessages(data.items);
      } catch (e) {
        console.error(e);
      }
    }
    void load();

    // Init socket
    async function initSocket() {
      const s = await createHrmSocket();
      s.connect();
      s.on('connect', () => {
        if (departmentId) {
          s.emit('chat:join', { departmentId });
        }
      });
      s.on('chat:message', (msg: ChatMessage) => {
        // Optimistic UI might have already added it if we are the sender, but we can deduplicate by ID
        setMessages(prev => {
          if (prev.find(m => m.id === msg.id)) return prev;
          return [msg, ...prev];
        });
      });
      setSocket(s);
    }
    void initSocket();

    return () => {
      if (socket) socket.disconnect();
    };
  }, [groupId, departmentId]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const text = input.trim();
    setInput('');
    try {
      const newMsg = await sendChatMessage(groupId, text);
      // It will also arrive via socket, but we can add it safely
      setMessages(prev => {
        if (prev.find(m => m.id === newMsg.id)) return prev;
        return [newMsg, ...prev];
      });
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    } catch (e) {
      console.error(e);
    }
  };

  const renderItem = ({ item }: { item: ChatMessage }) => {
    const isMe = item.senderId === user?.id;
    return (
      <View style={[styles.messageBubble, isMe ? styles.messageMe : styles.messageOther]}>
        {!isMe && <Text style={styles.senderName}>{item.sender?.profile?.fullName || 'Người dùng'}</Text>}
        <Text style={[styles.messageText, isMe ? styles.messageTextMe : styles.messageTextOther]}>
          {item.content}
        </Text>
      </View>
    );
  };

  return (
    <Screen>
      <PageHeader title="Phòng Chat" right={
        <Pressable onPress={() => router.back()} style={{ padding: spacing.sm }}>
          <Text style={{ color: colors.primary, fontWeight: 'bold' }}>Đóng</Text>
        </Pressable>
      } />
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          inverted
          contentContainerStyle={styles.listContent}
        />
        <View style={styles.inputArea}>
          <TextInput
            style={styles.input}
            placeholder="Nhập tin nhắn..."
            value={input}
            onChangeText={setInput}
            multiline
          />
          <Pressable style={styles.sendButton} onPress={() => void handleSend()}>
            <MaterialCommunityIcons name="send" size={24} color="#fff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: spacing.md,
    borderRadius: 20,
    marginBottom: 4,
  },
  messageMe: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  messageOther: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  senderName: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  messageTextMe: {
    color: '#fff',
  },
  messageTextOther: {
    color: colors.text,
  },
  inputArea: {
    flexDirection: 'row',
    padding: spacing.sm,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? spacing.lg : spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 24,
    paddingHorizontal: spacing.lg,
    paddingTop: 12,
    paddingBottom: 12,
    maxHeight: 100,
    fontSize: 15,
  },
  sendButton: {
    backgroundColor: colors.primary,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
});
