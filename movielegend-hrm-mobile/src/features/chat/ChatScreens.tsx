import { useRouter } from 'expo-router';
import { useRef, useState, useEffect } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { EmptyState } from '../../components/EmptyState';
import { PageHeader } from '../../components/PageHeader';
import { Screen } from '../../components/Screen';
import { StatusBadge } from '../../components/StatusBadge';
import { useAuth } from '../../providers/AuthProvider';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { normalizeApiError } from '../../utils/api-error';
import { useChatGroups, useAllChatGroups, useChatMessages, useSendMessage, useMarkGroupAsRead } from '../../hooks/useChat';
import { useScopedEmployees } from '../../hooks/useEmployees';
import { uploadFile } from '../../api/uploads.api';
import { assertSocketUrl } from '../../constants/env';
import { useSocketStatus } from '../../providers/SocketProvider';

// ── Helpers ──

function resolveImageUrl(url?: string | null) {
  if (!url) return undefined;
  if (url.startsWith('http')) return url;
  return `${assertSocketUrl()}${url.startsWith('/') ? '' : '/'}${url}`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  return `${days} ngày trước`;
}


function getInitials(name: string): string {
  return name.split(' ').filter(Boolean).slice(-2).map(w => w[0]).join('').toUpperCase();
}

// ── Chat Groups Screen ──

export function ChatGroupsScreen({ scope = 'member' }: { scope?: 'member' | 'all' }) {
  const router = useRouter();
  const { user } = useAuth();
  const myGroups = useChatGroups();
  const allGroups = useAllChatGroups();
  const markAsRead = useMarkGroupAsRead();
  const groups = scope === 'all' ? allGroups : myGroups;
  const groupItems = Array.isArray(groups.data) ? groups.data : [];

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <PageHeader
          title="Nhóm Chat"
          subtitle={scope === 'all' ? 'Tất cả nhóm chat trong công ty' : 'Trao đổi nội bộ công ty'}
        />

        <View style={styles.groupList}>
          {groupItems.length > 0 ? (
            groupItems.map((group: any) => {
              const isCompany = !group.departmentId && !group.taskId && group.type !== 'DIRECT' && group.type !== 'CUSTOM';
              const isDirect = group.type === 'DIRECT';
              const isCustom = group.type === 'CUSTOM';
              const groupName = group.name ?? group.department?.name ?? 'Nhóm chat';
              const typeLabel = isDirect ? 'Cá nhân' : isCustom ? 'Tự do' : isCompany ? 'Công ty' : group.type === 'DEPARTMENT' ? 'Phòng ban' : 'Công việc';
              const lastMsg = group.latestMessage;
              const lastMsgText = lastMsg
                ? `${lastMsg.sender?.profile?.fullName ?? 'Ai đó'}: ${lastMsg.content}`
                : `${group._count?.members ?? group.members?.length ?? 0} thành viên`;
              const unreadCount = group.unreadCount || 0;

              return (
                <Pressable
                  key={group.id}
                  style={styles.groupCard}
                  onPress={() => {
                    const isAdmin = user?.roles?.includes('ADMIN');
                    const isLeader = user?.roles?.includes('LEADER');
                    const basePath = isAdmin ? '/admin/chat' : isLeader ? '/leader/chat' : '/employee/chat';
                    
                    if (unreadCount > 0) {
                      markAsRead.mutateAsync(group.id).catch(console.error);
                    }
                    
                    router.push(`${basePath}/${group.id}?name=${encodeURIComponent(groupName)}` as any);
                  }}
                >
                  <View style={[styles.groupIcon, { backgroundColor: '#F3F4F6' }]}>
                    <MaterialCommunityIcons
                      name={isDirect ? 'account' : isCustom ? 'account-multiple' : isCompany ? 'domain' : group.type === 'DEPARTMENT' ? 'account-group' : 'clipboard-text-outline'}
                      size={24}
                      color="#111827"
                    />
                  </View>

                  <View style={styles.groupInfo}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Text style={[styles.groupName, { flex: 1 }]} numberOfLines={1}>{groupName}</Text>
                      {unreadCount > 0 && (
                        <View style={{ backgroundColor: '#EF4444', borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6, marginLeft: 8 }}>
                          <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>{unreadCount}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.groupMeta, unreadCount > 0 && { color: '#111827', fontWeight: '500' }]} numberOfLines={1}>
                      {lastMsgText}
                    </Text>
                  </View>

                  <StatusBadge
                    label={typeLabel}
                    tone="neutral"
                  />

                  <MaterialCommunityIcons name="chevron-right" size={20} color={colors.muted} />
                </Pressable>
              );
            })
          ) : !groups.isLoading ? (
            <EmptyState
              title="Chưa có nhóm chat"
              message={scope === 'all' ? 'Chưa có nhóm chat nào trong hệ thống' : 'Bạn chưa tham gia nhóm chat nào'}
            />
          ) : null}
        </View>
      </ScrollView>
    </Screen>
  );
}

// ── Chat Room Screen ──

export function ChatRoomScreen({ groupId, groupName }: { groupId: string; groupName?: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const messages = useChatMessages(groupId);
  const sendMessage = useSendMessage(groupId);
  const employees = useScopedEmployees({ limit: 100 });
  const insets = useSafeAreaInsets();

  const [text, setText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentions, setMentions] = useState<string[]>([]);

  const messageItems = Array.isArray(messages.data)
    ? messages.data
    : (messages.data as any)?.items ?? [];

  const { joinChatRoom } = useSocketStatus();

  // Sort newest first for inverted list
  const sortedMessages = [...messageItems].sort(
    (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  useEffect(() => {
    if (groupId) joinChatRoom(groupId);
  }, [groupId, joinChatRoom]);

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Lỗi', 'Cần cấp quyền truy cập thư viện ảnh!');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  }

  function handleTextChange(val: string) {
    setText(val);
    const lastWord = val.split(' ').pop();
    if (lastWord?.startsWith('@')) {
      setShowMentions(true);
      setMentionQuery(lastWord.slice(1).toLowerCase());
    } else {
      setShowMentions(false);
    }
  }

  function handleSelectMention(emp: any) {
    const words = text.split(' ');
    words.pop();
    const mentionText = `@${emp.fullName ?? emp.userCode}`;
    const newText = words.length > 0 ? `${words.join(' ')} ${mentionText} ` : `${mentionText} `;
    setText(newText);
    if (!mentions.includes(emp.id)) {
      setMentions([...mentions, emp.id]);
    }
    setShowMentions(false);
  }

  async function handleSend() {
    if (!text.trim() && !selectedImage) return;
    const content = text.trim();
    setText('');
    const currentImage = selectedImage;
    setSelectedImage(null);
    setIsUploading(true);

    try {
      let fileUrl;
      let fileType;

      if (currentImage) {
        const uploadResult = await uploadFile({
          uri: currentImage,
          name: 'chat-image.jpg',
          mimeType: 'image/jpeg',
          purpose: 'TASK_ATTACHMENT',
        });
        fileUrl = uploadResult.fileUrl;
        fileType = 'IMAGE';
      }

      await sendMessage.mutateAsync({
        content: content || undefined,
        fileUrl,
        fileType,
        mentions: mentions.length > 0 ? mentions : undefined
      });
      setMentions([]);
    } catch (error) {
      const normalized = normalizeApiError(error);
      Alert.alert('Lỗi', normalized.message);
      setText(content); // restore text if failed
      setSelectedImage(currentImage);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
        keyboardVerticalOffset={insets.bottom}
      >
        <View style={styles.chatContainer}>
        {/* Header */}
        <View style={styles.chatHeader}>
          <Pressable onPress={() => router.back()} style={{ padding: 4 }}>
            <MaterialCommunityIcons name="chevron-left" size={28} color="#111827" />
          </Pressable>
          <View style={styles.chatHeaderIcon}>
            <MaterialCommunityIcons name="account-group" size={20} color="#111827" />
          </View>
          <View style={styles.chatHeaderInfo}>
            <Text style={styles.chatHeaderName}>{groupName ?? 'Nhóm chat'}</Text>
            <Text style={styles.chatHeaderMeta}>
              {messageItems.length} tin nhắn
            </Text>
          </View>
        </View>

        {/* Messages */}
        <FlatList
          style={styles.messageList}
          contentContainerStyle={styles.messageListContent}
          data={sortedMessages}
          keyExtractor={(msg: any) => msg.id}
          inverted
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          renderItem={({ item: msg }) => {
            const isMine = msg.sender?.id === user?.id || msg.senderId === user?.id;
            const senderName = msg.sender?.profile?.fullName ?? msg.sender?.userCode ?? 'User';

            return (
              <View style={[styles.messageRow, isMine && styles.messageRowMine]}>
                {!isMine && (
                  <View style={styles.messageBubbleAvatar}>
                    <Text style={styles.messageBubbleAvatarText}>
                      {getInitials(senderName)}
                    </Text>
                  </View>
                )}
                <View style={[
                  styles.messageBubble, 
                  isMine ? styles.messageBubbleMine : styles.messageBubbleOther,
                  msg.fileUrl && msg.fileType === 'IMAGE' && !msg.content ? styles.messageBubbleImageOnly : {}
                ]}>
                  {!isMine && (
                    <Text style={[styles.messageSender, msg.fileUrl && msg.fileType === 'IMAGE' && !msg.content ? { paddingHorizontal: 16, paddingTop: 10 } : {}]}>{senderName}</Text>
                  )}
                  {msg.fileUrl && msg.fileType === 'IMAGE' && (
                    <Pressable onPress={() => setViewingImage(resolveImageUrl(msg.fileUrl) || '')}>
                      <Image 
                        source={{ uri: resolveImageUrl(msg.fileUrl) || '' }} 
                        style={[styles.messageImage, !msg.content ? styles.messageImageOnly : {}]} 
                      />
                    </Pressable>
                  )}
                  {!!msg.content && (
                    <Text style={[
                      styles.messageText, 
                      isMine && styles.messageTextMine,
                      msg.fileUrl && msg.fileType === 'IMAGE' ? { marginTop: 8 } : {}
                    ]}>
                      {msg.content}
                    </Text>
                  )}
                  <Text style={[
                    styles.messageTime, 
                    isMine && styles.messageTimeMine,
                    msg.fileUrl && msg.fileType === 'IMAGE' && !msg.content ? { position: 'absolute', bottom: 8, right: 12, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, color: '#fff' } : {}
                  ]}>
                    {timeAgo(msg.createdAt)}
                  </Text>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={[styles.emptyChat, { transform: [{ scaleY: -1 }] }]}>
              <MaterialCommunityIcons name="chat-outline" size={48} color={colors.muted} />
              <Text style={styles.emptyChatText}>Chưa có tin nhắn nào</Text>
              <Text style={styles.emptyChatSub}>Hãy bắt đầu cuộc trò chuyện!</Text>
            </View>
          }
        />

        {/* Mentions Popup */}
        {showMentions && (
          <View style={styles.mentionListContainer}>
            <FlatList
              data={Array.isArray(employees.data) ? employees.data : (employees.data?.items ?? []).filter((e: any) => 
                (e.fullName ?? e.userCode).toLowerCase().includes(mentionQuery)
              )}
              keyExtractor={(e) => e.id}
              renderItem={({ item }) => (
                <Pressable style={styles.mentionItem} onPress={() => handleSelectMention(item)}>
                  <View style={styles.mentionAvatar}>
                    <Text style={styles.mentionAvatarText}>{getInitials(item.fullName ?? item.userCode)}</Text>
                  </View>
                  <Text style={styles.mentionName}>{item.fullName ?? item.userCode}</Text>
                </Pressable>
              )}
              keyboardShouldPersistTaps="handled"
            />
          </View>
        )}

        {/* Input */}
        <View style={[styles.chatInputRow, { paddingBottom: Math.max(insets.bottom, 10) }]}>
          <Pressable onPress={pickImage} style={styles.attachBtn}>
            <MaterialCommunityIcons name="image-plus" size={24} color={colors.muted} />
          </Pressable>
          <View style={{ flex: 1 }}>
            {selectedImage && (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
                <Pressable style={styles.removeImageBtn} onPress={() => setSelectedImage(null)}>
                  <MaterialCommunityIcons name="close" size={16} color="#fff" />
                </Pressable>
              </View>
            )}
            <TextInput
              style={styles.chatInput}
              placeholder="Nhập tin nhắn..."
              placeholderTextColor={colors.muted}
              value={text}
              onChangeText={handleTextChange}
              multiline
              returnKeyType="send"
              onSubmitEditing={handleSend}
              blurOnSubmit={false}
            />
          </View>
          <Pressable
            style={[styles.chatSendBtn, (!text.trim() && !selectedImage) && styles.chatSendBtnDisabled]}
            onPress={handleSend}
            disabled={(!text.trim() && !selectedImage) || sendMessage.isPending || isUploading}
          >
            <MaterialCommunityIcons name={isUploading ? 'loading' : 'send'} size={20} color="#fff" />
          </Pressable>
        </View>
      </View>

      {/* Image Viewer Modal */}
      <Modal visible={!!viewingImage} transparent={true} animationType="fade" onRequestClose={() => setViewingImage(null)}>
        <View style={styles.imageViewerContainer}>
          <Pressable style={styles.imageViewerCloseBtn} onPress={() => setViewingImage(null)}>
            <MaterialCommunityIcons name="close" size={32} color="#fff" />
          </Pressable>
          {viewingImage && (
            <Image
              source={{ uri: viewingImage }}
              style={styles.imageViewerImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  groupList: {
    gap: spacing.sm,
  },
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: spacing.md,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  groupIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  groupMeta: {
    fontSize: 13,
    color: colors.muted,
    marginTop: 2,
  },

  // Chat room
  chatContainer: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 12,
  },
  chatHeaderIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatHeaderInfo: {
    flex: 1,
  },
  chatHeaderName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  chatHeaderMeta: {
    fontSize: 12,
    color: colors.muted,
  },

  messageList: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  messageListContent: {
    padding: spacing.md,
    flexGrow: 1,
  },

  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
  },
  messageRowMine: {
    flexDirection: 'row-reverse',
  },

  messageBubbleAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageBubbleAvatarText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#111827',
  },

  messageBubble: {
    maxWidth: '75%',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  messageBubbleMine: {
    backgroundColor: '#111827',
    borderBottomRightRadius: 4,
  },
  messageBubbleOther: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },

  messageSender: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  messageText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 20,
  },
  messageTextMine: {
    color: '#fff',
  },
  messageTime: {
    fontSize: 10,
    color: colors.muted,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  messageTimeMine: {
    color: 'rgba(255,255,255,0.8)',
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: 8,
    marginBottom: spacing.xs,
  },
  messageBubbleImageOnly: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    backgroundColor: 'transparent',
    borderBottomRightRadius: 16,
    borderBottomLeftRadius: 16,
    overflow: 'hidden',
  },
  messageImageOnly: {
    width: 220,
    height: 220,
    borderRadius: 16,
    marginBottom: 0,
  },

  imageViewerContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerCloseBtn: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  imageViewerImage: {
    width: '100%',
    height: '80%',
  },

  emptyChat: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyChatText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  emptyChatSub: {
    fontSize: 14,
    color: colors.muted,
  },

  // Input
  chatInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  chatInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 15,
    color: colors.text,
    minHeight: 40,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    textAlignVertical: 'center',
  },
  chatSendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatSendBtnDisabled: {
    opacity: 0.5,
  },
  attachBtn: {
    padding: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePreviewContainer: {
    position: 'absolute',
    bottom: 70,
    left: spacing.md,
    zIndex: 10,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  imagePreview: {
    width: 80,
    height: 80,
    resizeMode: 'cover',
  },
  removeImageBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 10,
    padding: 2,
  },
  mentionListContainer: {
    position: 'absolute',
    bottom: 70,
    left: spacing.md,
    right: spacing.md,
    maxHeight: 150,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    zIndex: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  mentionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  mentionText: {
    fontSize: 14,
    color: colors.text,
  },
  mentionAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  mentionAvatarText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#111827',
  },
  mentionName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
});
