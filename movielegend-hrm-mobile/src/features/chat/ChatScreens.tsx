import { useRouter } from 'expo-router';
import { useRef, useState, useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAppAlert } from '../../contexts/AlertContext';
import { useActiveChat } from '../../contexts/ActiveChatContext';
import {
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
  Animated,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { requestMediaLibraryPermissionWithFallback } from '../../utils/mediaPermissions';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import ImageViewing from '../../components/ImageViewer/ImageViewer';
import { EmptyState } from '../../components/EmptyState';
import { PageHeader } from '../../components/PageHeader';
import { Screen } from '../../components/Screen';
import { StatusBadge } from '../../components/StatusBadge';
import { useAuth } from '../../providers/AuthProvider';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { normalizeApiError } from '../../utils/api-error';
import { useChatGroups, useAllChatGroups, useChatMessages, useSendMessage, useMarkGroupAsRead, useDeleteMessage, useReactMessage, useMessageReactionDetails, useMessageSeenDetails, useGroupMembers, useCreateCustomChat } from '../../hooks/useChat';
import { useScopedEmployees } from '../../hooks/useEmployees';
import { usePublicDepartments } from '../../hooks/useDepartments';
import { uploadFile } from '../../api/uploads.api';
import { createDirectChat } from '../../api/chat.api';
import { assertSocketUrl } from '../../constants/env';
import { useSocketStatus } from '../../providers/SocketProvider';
import { useVoiceCall } from '../voice-call/VoiceCallProvider';
import * as Clipboard from 'expo-clipboard';
import { downloadAndSaveImage } from '../../utils/file-download';
import { ChatWatermark } from '../../components/ChatWatermark';
import { SafeAudio, isAudioAvailable } from '../../utils/safe-audio';
import { VoiceMessageBubble } from './VoiceMessageBubble';

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

// ── Mock Stickers ──

import axios from 'axios';

const GIPHY_API_KEY = process.env.EXPO_PUBLIC_GIPHY_API_KEY || 'Gc7131jiJuvI7IdN0HZ1D7nh0ow5BU6g';

const StickerPickerModal = ({ visible, onClose, onSelectSticker }: { visible: boolean, onClose: () => void, onSelectSticker: (url: string, type: string) => void }) => {
  const [giphyStickers, setGiphyStickers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  const fetchGiphyStickers = async (query = '') => {
    setLoading(true);
    try {
      const endpoint = query
        ? `https://api.giphy.com/v1/stickers/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=30`
        : `https://api.giphy.com/v1/stickers/trending?api_key=${GIPHY_API_KEY}&limit=30`;
      const response = await axios.get(endpoint);
      if (response.data?.data) {
        setGiphyStickers(response.data.data);
      }
    } catch (e) {
      console.error('Giphy Fetch Error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible && giphyStickers.length === 0) {
      fetchGiphyStickers();
    }
  }, [visible]);

  useEffect(() => {
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, []);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      fetchGiphyStickers(text);
    }, 500);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.3)' }}>
        <View style={{ backgroundColor: '#fff', height: '70%', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 20 }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
            <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text }}>Kho Nhãn dán GIPHY</Text>
            <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
              <MaterialCommunityIcons name="close" size={24} color={colors.muted} />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={{ paddingHorizontal: 16, paddingBottom: 10 }}>
            <TextInput
              style={{ backgroundColor: '#F3F4F6', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, fontSize: 14, color: colors.text }}
              placeholder="Tìm nhãn dán Giphy (VD: Hello, Like, Happy...)"
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={handleSearch}
            />
          </View>

          {/* GIPHY Grid */}
          {loading && giphyStickers.length === 0 ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={{ fontSize: 13, color: colors.muted, marginTop: 8 }}>Đang tải nhãn dán GIPHY...</Text>
            </View>
          ) : (
            <FlatList
              data={giphyStickers}
              numColumns={3}
              keyExtractor={(item, index) => item.id || `giphy_${index}`}
              contentContainerStyle={{ paddingHorizontal: 8, paddingVertical: 8 }}
              ListEmptyComponent={
                <View style={{ flex: 1, padding: 30, alignItems: 'center' }}>
                  <Text style={{ color: colors.muted, fontSize: 14 }}>Không tìm thấy nhãn dán GIPHY phù hợp</Text>
                </View>
              }
              renderItem={({ item }) => {
                let stickerUrl = item.images?.fixed_width_small?.url || item.images?.fixed_width?.url || item.images?.original?.url;
                if (!stickerUrl) return null;
                if (stickerUrl.startsWith('http:')) {
                  stickerUrl = stickerUrl.replace('http:', 'https:');
                }
                return (
                  <TouchableOpacity
                    style={{ flex: 1, alignItems: 'center', margin: 4, borderRadius: 8, backgroundColor: colors.surface, padding: 4 }}
                    onPress={() => onSelectSticker(stickerUrl, 'giphy')}
                  >
                    <Image source={{ uri: stickerUrl }} style={{ width: 90, height: 90 }} resizeMode="contain" />
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

// ── Chat Groups Screen ──

export function ChatGroupsScreen({ scope = 'member' }: { scope?: 'member' | 'all' | 'department' }) {
  const router = useRouter();
  const { user } = useAuth();
  const { showAlert } = useAppAlert();
  const queryClient = useQueryClient();
  const myGroups = useChatGroups();
  const allGroups = useAllChatGroups();
  const markAsRead = useMarkGroupAsRead();
  const createCustomChatMutation = useCreateCustomChat();
  const groups = scope === 'all' ? allGroups : myGroups;
  const groupItems = useMemo(() => {
    const raw = Array.isArray(groups.data) ? groups.data : [];
    const uniqueMap = new Map<string, any>();
    for (const item of raw) {
      if (item?.id && !uniqueMap.has(item.id)) {
        uniqueMap.set(item.id, item);
      }
    }
    return Array.from(uniqueMap.values()).sort((a: any, b: any) => {
      const timeA = a.latestMessage?.createdAt
        ? new Date(a.latestMessage.createdAt).getTime()
        : (a.updatedAt ? new Date(a.updatedAt).getTime() : 0);
      const timeB = b.latestMessage?.createdAt
        ? new Date(b.latestMessage.createdAt).getTime()
        : (b.updatedAt ? new Date(b.updatedAt).getTime() : 0);
      return timeB - timeA;
    });
  }, [groups.data]);

  const departmentsQuery = usePublicDepartments({ limit: 100 });
  const employeesQuery = useScopedEmployees({ limit: 100 });

  // Admin Role Detection (Global Admin, Region Admin 1, Region Admin 2)
  const isGlobalAdmin = Boolean(
    user?.roles?.includes('ADMIN') &&
    (!user?.scopes || user?.scopes.length === 0 || user?.scopes?.some((s: any) => s.role === 'ADMIN' && (s.scopeType === 'GLOBAL' || !s.scopeType)))
  );
  const isRegionAdmin = Boolean(
    user?.roles?.includes('ADMIN') &&
    user?.scopes?.some((s: any) => s.role === 'ADMIN' && s.scopeType === 'REGION')
  );
  const isAdmin = isGlobalAdmin || isRegionAdmin || user?.roles?.includes('ADMIN') || user?.roles?.includes('SUPER_ADMIN');

  // Leader Directory Modal State
  const [isLeaderModalVisible, setLeaderModalVisible] = useState(false);
  const [leaderSearch, setLeaderSearch] = useState('');
  const [connectingLeaderId, setConnectingLeaderId] = useState<string | null>(null);

  // Create Group Modal State (Admin)
  const [isCreateGroupModalVisible, setCreateGroupModalVisible] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [filterDeptId, setFilterDeptId] = useState<string>('all');
  const [isDeptPickerOpen, setDeptPickerOpen] = useState(false);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const insets = useSafeAreaInsets();

  // Extract all department leaders
  const departmentLeaders = useMemo(() => {
    const map = new Map<string, {
      userId: string;
      fullName: string;
      userCode?: string;
      avatarUrl?: string | null;
      departmentName: string;
      branchName?: string;
    }>();

    // 1. From departments
    const deptItems = Array.isArray(departmentsQuery.data)
      ? departmentsQuery.data
      : (departmentsQuery.data?.items ?? []);

    for (const d of deptItems) {
      if (d.leader && d.leader.id) {
        const uId = d.leader.id;
        if (uId === user?.id) continue;
        map.set(uId, {
          userId: uId,
          fullName: d.leader.profile?.fullName || d.leader.userCode || 'Trưởng phòng',
          userCode: d.leader.userCode,
          avatarUrl: resolveImageUrl(d.leader.profile?.avatarUrl),
          departmentName: d.name,
          branchName: d.branch?.name,
        });
      }
    }

    // 2. Also check scoped employees for any with role LEADER or leadership positions
    const empItems = Array.isArray(employeesQuery.data)
      ? employeesQuery.data
      : (employeesQuery.data?.items ?? []);

    for (const e of empItems) {
      const isLeaderRole = (e.roles as any)?.some((r: any) => r.role?.code === 'LEADER' || r.code === 'LEADER') ||
        e.position?.name?.toLowerCase().includes('trưởng') ||
        e.position?.name?.toLowerCase().includes('leader') ||
        e.position?.name?.toLowerCase().includes('quản lý');

      if (isLeaderRole && e.id && e.id !== user?.id) {
        if (!map.has(e.id)) {
          map.set(e.id, {
            userId: e.id,
            fullName: e.fullName || e.profile?.fullName || e.userCode || 'Trưởng phòng',
            userCode: e.userCode,
            avatarUrl: resolveImageUrl(e.avatarUrl || e.profile?.avatarUrl),
            departmentName: e.department?.name || 'Phòng ban',
            branchName: undefined,
          });
        }
      }
    }

    return Array.from(map.values());
  }, [departmentsQuery.data, employeesQuery.data, user?.id]);

  const filteredLeaders = useMemo(() => {
    if (!leaderSearch.trim()) return departmentLeaders;
    const q = leaderSearch.toLowerCase().trim();
    return departmentLeaders.filter(
      (l) =>
        l.fullName.toLowerCase().includes(q) ||
        l.departmentName.toLowerCase().includes(q) ||
        (l.userCode && l.userCode.toLowerCase().includes(q)) ||
        (l.branchName && l.branchName.toLowerCase().includes(q))
    );
  }, [departmentLeaders, leaderSearch]);

  // Candidates for Custom Group Creation
  const candidateEmployees = useMemo(() => {
    const raw = Array.isArray(employeesQuery.data)
      ? employeesQuery.data
      : (employeesQuery.data?.items ?? (employeesQuery.data as any)?.data ?? []);

    return raw.filter((e: any) => e.id && e.id !== user?.id);
  }, [employeesQuery.data, user?.id]);

  const filteredCandidateEmployees = useMemo(() => {
    let list = candidateEmployees;
    if (filterDeptId !== 'all') {
      list = list.filter((e: any) => e.department?.id === filterDeptId || e.departmentId === filterDeptId);
    }
    if (memberSearchQuery.trim()) {
      const q = memberSearchQuery.toLowerCase().trim();
      list = list.filter((e: any) => {
        const name = (e.fullName || e.profile?.fullName || '').toLowerCase();
        const code = (e.userCode || '').toLowerCase();
        const dept = (e.department?.name || '').toLowerCase();
        return name.includes(q) || code.includes(q) || dept.includes(q);
      });
    }
    return list;
  }, [candidateEmployees, filterDeptId, memberSearchQuery]);

  const availableDepartments = useMemo(() => {
    const list = Array.isArray(departmentsQuery.data)
      ? departmentsQuery.data
      : (departmentsQuery.data?.items ?? []);
    return list;
  }, [departmentsQuery.data]);

  const selectedMembers = useMemo(() => {
    return candidateEmployees.filter((e: any) => selectedMemberIds.includes(e.id));
  }, [candidateEmployees, selectedMemberIds]);

  const toggleMemberSelection = (userId: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleOpenDirectChat = async (leader: { userId: string; fullName: string }) => {
    try {
      setConnectingLeaderId(leader.userId);
      const basePath = user?.roles?.includes('ADMIN') ? '/admin/chat' :
        user?.roles?.includes('HR') ? '/hr/chat' :
          user?.roles?.includes('LEADER') ? '/leader/chat' : '/employee/chat';

      // Check if direct chat already exists in user's chat groups
      const existingGroup = groupItems.find((g: any) => {
        if (g.type !== 'DIRECT') return false;
        return g.members?.some((m: any) => m.userId === leader.userId);
      });

      if (existingGroup) {
        setLeaderModalVisible(false);
        router.push(`${basePath}/${existingGroup.id}?name=${encodeURIComponent(leader.fullName)}` as any);
        return;
      }

      // Create new direct chat
      const created = await createDirectChat(leader.userId);
      await queryClient.invalidateQueries({ queryKey: ['chat', 'my-groups'] });
      setLeaderModalVisible(false);
      const groupId = created?.id || (created as any)?.data?.id;
      if (groupId) {
        router.push(`${basePath}/${groupId}?name=${encodeURIComponent(leader.fullName)}` as any);
      }
    } catch (err) {
      console.error('Failed to open direct chat with leader:', err);
    } finally {
      setConnectingLeaderId(null);
    }
  };

  const handleCreateGroup = async () => {
    const trimmedName = newGroupName.trim();
    if (!trimmedName) {
      showAlert('Thông báo', 'Vui lòng nhập tên nhóm chat');
      return;
    }
    if (selectedMemberIds.length === 0) {
      showAlert('Thông báo', 'Vui lòng chọn ít nhất 1 thành viên tham gia nhóm');
      return;
    }

    try {
      setIsCreatingGroup(true);
      const res: any = await createCustomChatMutation.mutateAsync({
        name: trimmedName,
        memberIds: selectedMemberIds,
      });
      const newGroupId = res?.id || res?.data?.id;
      setCreateGroupModalVisible(false);
      setNewGroupName('');
      setSelectedMemberIds([]);
      setMemberSearchQuery('');
      setFilterDeptId('all');

      if (newGroupId) {
        const basePath = user?.roles?.includes('ADMIN') ? '/admin/chat' :
          user?.roles?.includes('HR') ? '/hr/chat' :
            user?.roles?.includes('LEADER') ? '/leader/chat' : '/employee/chat';
        router.push(`${basePath}/${newGroupId}?name=${encodeURIComponent(trimmedName)}` as any);
      }
    } catch (err: any) {
      console.error('Failed to create custom group:', err);
      showAlert('Lỗi', normalizeApiError(err)?.message || 'Không thể tạo nhóm chat, vui lòng thử lại');
    } finally {
      setIsCreatingGroup(false);
    }
  };

  return (
    <View style={adminChatStyles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#1B3B2B" translucent={false} />

      {/* Header Container */}
      <View style={[adminChatStyles.headerWrap, { paddingTop: Math.max(insets.top, 16) + 4 }]}>
        <View style={adminChatStyles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={adminChatStyles.headerTitle}>Nhóm chat</Text>
            <Text style={adminChatStyles.headerSubtitle}>Kết nối mọi người trong công ty</Text>
          </View>
          <TouchableOpacity
            style={adminChatStyles.createGroupPillBtn}
            activeOpacity={0.8}
            onPress={() => setCreateGroupModalVisible(true)}
          >
            <MaterialCommunityIcons name="plus" size={16} color="#FFFFFF" />
            <Text style={adminChatStyles.createGroupPillText}>Tạo nhóm</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Curved White Sheet */}
      <View style={adminChatStyles.curvedSheet}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[
            adminChatStyles.sheetScrollContent,
            { paddingBottom: Math.max(insets.bottom, 16) + 84 },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={groups.isRefetching} onRefresh={() => void groups.refetch()} />}
        >
          {/* Section 1: Trưởng phòng */}
          {departmentLeaders.length > 0 && (
            <View style={adminChatStyles.leadersSection}>
              <View style={adminChatStyles.sectionHeaderRow}>
                <Text style={adminChatStyles.sectionTitle}>Trưởng phòng</Text>
                <TouchableOpacity
                  onPress={() => setLeaderModalVisible(true)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}
                >
                  <Text style={adminChatStyles.seeAllLeadersText}>
                    Tất cả ({departmentLeaders.length})
                  </Text>
                  <MaterialCommunityIcons name="chevron-right" size={16} color="#2563EB" />
                </TouchableOpacity>
              </View>

              {/* Vertical list of top 3 leaders */}
              <View style={adminChatStyles.leaderListContainer}>
                {departmentLeaders.slice(0, 3).map((leader) => (
                  <TouchableOpacity
                    key={leader.userId}
                    style={adminChatStyles.leaderItemRow}
                    activeOpacity={0.7}
                    disabled={connectingLeaderId === leader.userId}
                    onPress={() => handleOpenDirectChat(leader)}
                  >
                    <View style={adminChatStyles.leaderAvatarCircle}>
                      <Text style={adminChatStyles.leaderAvatarInitials}>
                        {getInitials(leader.fullName)}
                      </Text>
                    </View>

                    <View style={adminChatStyles.leaderInfoWrap}>
                      <Text style={adminChatStyles.leaderName} numberOfLines={1}>
                        {leader.fullName}
                      </Text>
                      <Text style={adminChatStyles.leaderDept} numberOfLines={2}>
                        {leader.departmentName.startsWith('Trưởng phòng')
                          ? leader.departmentName
                          : `Trưởng phòng ${leader.departmentName}`}
                      </Text>
                    </View>

                    <View style={adminChatStyles.leaderChatBtn}>
                      {connectingLeaderId === leader.userId ? (
                        <ActivityIndicator size="small" color="#1B3B2B" />
                      ) : (
                        <MaterialCommunityIcons name="chat-outline" size={20} color="#334155" />
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Section 2: Trò chuyện gần đây */}
          <View style={adminChatStyles.recentSection}>
            <Text style={adminChatStyles.sectionTitle}>Trò chuyện gần đây</Text>

            <View style={adminChatStyles.recentGroupList}>
              {groupItems.length > 0 ? (
                groupItems.map((group: any) => {
                  const isCompany = !group.departmentId && !group.taskId && group.type !== 'DIRECT' && group.type !== 'CUSTOM';
                  const isDirect = group.type === 'DIRECT';
                  let groupName = group.name ?? group.department?.name ?? 'Nhóm chat';
                  if (isDirect && group.name) {
                    const parts = group.name.split(' - ');
                    if (parts.length === 2) {
                      const myName = user?.fullName || (user?.userCode === 'NV000001' ? 'Admin' : user?.userCode);
                      if (parts[0] === myName || parts[0] === 'User') {
                        groupName = parts[1];
                      } else if (parts[1] === myName || parts[1] === 'User') {
                        groupName = parts[0];
                      }
                    }
                  }
                  const lastMsg = group.latestMessage;
                  let contentPreview = lastMsg?.content ?? '';
                  if (contentPreview.startsWith('GIPHY_STICKER:') || contentPreview.startsWith('LOTTIE_STICKER:') || contentPreview.startsWith('STATIC_STICKER:')) {
                    contentPreview = '[Nhãn dán]';
                  } else if (lastMsg?.fileType === 'AUDIO' || contentPreview === '[Tin nhắn thoại]') {
                    contentPreview = '🎤 [Tin nhắn thoại]';
                  } else if (lastMsg?.fileType === 'IMAGE' || lastMsg?.fileType === 'IMAGE_ALBUM') {
                    contentPreview = '📷 [Hình ảnh]';
                  }
                  const isMine = lastMsg?.sender?.id === user?.id || lastMsg?.senderId === user?.id;
                  const senderName = isMine ? 'Bạn' : (lastMsg?.sender?.profile?.fullName ?? (lastMsg?.sender?.userCode === 'NV000001' ? 'Admin' : lastMsg?.sender?.userCode) ?? 'Ai đó');
                  const lastMsgText = lastMsg
                    ? `${senderName}: ${contentPreview}`
                    : `${group._count?.members ?? group.members?.length ?? 0} thành viên`;
                  const unreadCount = group.unreadCount || 0;

                  return (
                    <TouchableOpacity
                      key={group.id}
                      style={adminChatStyles.recentGroupItem}
                      activeOpacity={0.7}
                      onPress={() => {
                        const basePath = user?.roles?.includes('ADMIN') ? '/admin/chat' :
                          user?.roles?.includes('HR') ? '/hr/chat' :
                            user?.roles?.includes('LEADER') ? '/leader/chat' : '/employee/chat';

                        if (unreadCount > 0) {
                          markAsRead.mutateAsync(group.id).catch(console.error);
                        }

                        router.push(`${basePath}/${group.id}?name=${encodeURIComponent(groupName)}` as any);
                      }}
                    >
                      <View style={adminChatStyles.recentGroupAvatar}>
                        <MaterialCommunityIcons
                          name={isDirect ? 'account' : 'account-group'}
                          size={22}
                          color="#1B3B2B"
                        />
                      </View>

                      <View style={adminChatStyles.recentGroupInfo}>
                        <Text style={adminChatStyles.recentGroupName} numberOfLines={1}>
                          {groupName}
                        </Text>
                        <Text style={adminChatStyles.recentGroupSub} numberOfLines={1}>
                          {lastMsgText}
                        </Text>
                      </View>

                      {unreadCount > 0 && (
                        <View style={adminChatStyles.unreadBadge}>
                          <Text style={adminChatStyles.unreadBadgeText}>
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </Text>
                        </View>
                      )}

                      <MaterialCommunityIcons name="chevron-right" size={20} color="#94A3B8" />
                    </TouchableOpacity>
                  );
                })
              ) : !groups.isLoading ? (
                <EmptyState
                  title="Chưa có nhóm chat"
                  message={scope === 'all' ? 'Chưa có nhóm chat nào trong hệ thống' : 'Bạn chưa tham gia nhóm chat nào'}
                />
              ) : null}
            </View>
          </View>
        </ScrollView>
      </View>

      {/* ── Modal: Tạo nhóm Chat Mới (Admin - Movie Legend) ── */}
      <Modal
        visible={isCreateGroupModalVisible}
        animationType="slide"
        onRequestClose={() => {
          if (!isCreatingGroup) setCreateGroupModalVisible(false);
        }}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#1B3B2B' }} edges={['top']}>
          <StatusBar barStyle="light-content" backgroundColor="#1B3B2B" translucent={false} />

          {/* Modal Header */}
          <View style={adminChatStyles.modalHeaderWrap}>
            <View style={adminChatStyles.modalHeaderRow}>
              <TouchableOpacity
                onPress={() => setCreateGroupModalVisible(false)}
                style={adminChatStyles.modalBackBtn}
                hitSlop={10}
                disabled={isCreatingGroup}
              >
                <MaterialCommunityIcons name="chevron-left" size={28} color="#FFFFFF" />
              </TouchableOpacity>
              <View style={adminChatStyles.modalHeaderTextWrap}>
                <Text style={adminChatStyles.modalTitle}>Tạo nhóm chat</Text>
                <Text style={adminChatStyles.modalSubtitle}>Mời thành viên trong công ty</Text>
              </View>
            </View>
          </View>

          {/* Curved White Sheet */}
          <View style={adminChatStyles.modalCurvedSheet}>
            <View style={adminChatStyles.modalFormContent}>
              {/* Tên nhóm * */}
              <View style={adminChatStyles.formGroup}>
                <Text style={adminChatStyles.formLabel}>
                  Tên nhóm <Text style={{ color: '#EF4444' }}>*</Text>
                </Text>
                <TextInput
                  style={adminChatStyles.formInput}
                  placeholder="Nhập tên nhóm"
                  placeholderTextColor="#94A3B8"
                  value={newGroupName}
                  onChangeText={setNewGroupName}
                />
              </View>

              {/* Thành viên / Đã chọn: X */}
              <View style={adminChatStyles.memberSectionHeader}>
                <Text style={adminChatStyles.formLabel}>Thành viên</Text>
                <Text style={adminChatStyles.selectedCountText}>
                  Đã chọn: {selectedMemberIds.length}
                </Text>
              </View>

              {/* Tìm kiếm */}
              <View style={adminChatStyles.searchBox}>
                <MaterialCommunityIcons name="magnify" size={20} color="#94A3B8" />
                <TextInput
                  style={adminChatStyles.searchInput}
                  placeholder="Tìm tên hoặc mã nhân viên"
                  placeholderTextColor="#94A3B8"
                  value={memberSearchQuery}
                  onChangeText={setMemberSearchQuery}
                />
                {memberSearchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setMemberSearchQuery('')}>
                    <MaterialCommunityIcons name="close-circle" size={18} color="#94A3B8" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Department Dropdown Button */}
              <TouchableOpacity
                style={adminChatStyles.deptDropdownBtn}
                onPress={() => setDeptPickerOpen(true)}
                activeOpacity={0.7}
              >
                <Text style={adminChatStyles.deptDropdownText} numberOfLines={1}>
                  {filterDeptId === 'all'
                    ? `Tất cả phòng ban · ${candidateEmployees.length}`
                    : `${availableDepartments.find((d: any) => d.id === filterDeptId)?.name || 'Phòng ban'} · ${filteredCandidateEmployees.length}`}
                </Text>
                <MaterialCommunityIcons name="chevron-down" size={20} color="#64748B" />
              </TouchableOpacity>

              {/* Member List */}
              <FlatList
                data={filteredCandidateEmployees}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingBottom: 16 }}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => {
                  const isSelected = selectedMemberIds.includes(item.id);
                  const name = item.fullName || item.profile?.fullName || item.userCode || 'Thành viên';
                  const code = item.userCode || '';
                  const dept = item.department?.name || item.departmentName || '';
                  const subText = dept ? `${code}${code ? ' · ' : ''}${dept}` : code;

                  return (
                    <TouchableOpacity
                      style={adminChatStyles.memberItemRow}
                      activeOpacity={0.7}
                      onPress={() => toggleMemberSelection(item.id)}
                    >
                      <View style={[adminChatStyles.checkboxBox, isSelected && adminChatStyles.checkboxBoxSelected]}>
                        {isSelected && <MaterialCommunityIcons name="check" size={14} color="#FFFFFF" />}
                      </View>

                      <View style={adminChatStyles.memberAvatarCircle}>
                        <Text style={adminChatStyles.memberAvatarInitials}>{getInitials(name)}</Text>
                      </View>

                      <View style={adminChatStyles.memberInfoWrap}>
                        <Text style={adminChatStyles.memberName}>{name}</Text>
                        {!!subText && <Text style={adminChatStyles.memberCodeDept}>{subText}</Text>}
                      </View>
                    </TouchableOpacity>
                  );
                }}
                ListEmptyComponent={
                  <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                    <MaterialCommunityIcons name="account-search-outline" size={44} color="#CBD5E1" />
                    <Text style={{ marginTop: 8, fontSize: 14, color: '#94A3B8' }}>Không tìm thấy nhân sự phù hợp</Text>
                  </View>
                }
              />
            </View>

            {/* Fixed Bottom Action Bar */}
            <View style={[adminChatStyles.modalFixedFooter, { paddingBottom: Math.max(insets.bottom, 14) }]}>
              <TouchableOpacity
                style={[
                  adminChatStyles.createGroupSubmitBtn,
                  (!newGroupName.trim() || selectedMemberIds.length === 0 || isCreatingGroup) &&
                    adminChatStyles.createGroupSubmitBtnDisabled,
                ]}
                disabled={!newGroupName.trim() || selectedMemberIds.length === 0 || isCreatingGroup}
                onPress={handleCreateGroup}
                activeOpacity={0.8}
              >
                {isCreatingGroup ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={adminChatStyles.createGroupSubmitBtnText}>Tạo nhóm</Text>
                )}
              </TouchableOpacity>
              <Text style={adminChatStyles.createGroupHelperText}>
                Nhập tên nhóm và chọn thành viên
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* ── Modal: Chọn phòng ban ── */}
      <Modal
        visible={isDeptPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setDeptPickerOpen(false)}
      >
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
          activeOpacity={1}
          onPress={() => setDeptPickerOpen(false)}
        >
          <View style={{ backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '70%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 17, fontWeight: '800', color: '#0F172A' }}>Chọn phòng ban</Text>
              <TouchableOpacity onPress={() => setDeptPickerOpen(false)} hitSlop={10}>
                <MaterialCommunityIcons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <TouchableOpacity
                style={{
                  paddingVertical: 14,
                  borderBottomWidth: 1,
                  borderBottomColor: '#F1F5F9',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
                onPress={() => {
                  setFilterDeptId('all');
                  setDeptPickerOpen(false);
                }}
              >
                <Text style={{ fontSize: 15, fontWeight: filterDeptId === 'all' ? '700' : '500', color: filterDeptId === 'all' ? '#1B3B2B' : '#0F172A' }}>
                  Tất cả phòng ban · {candidateEmployees.length}
                </Text>
                {filterDeptId === 'all' && (
                  <MaterialCommunityIcons name="check" size={20} color="#1B3B2B" />
                )}
              </TouchableOpacity>

              {availableDepartments.map((dept: any) => {
                const count = candidateEmployees.filter((e: any) => e.department?.id === dept.id || e.departmentId === dept.id).length;
                const isSelected = filterDeptId === dept.id;

                return (
                  <TouchableOpacity
                    key={dept.id}
                    style={{
                      paddingVertical: 14,
                      borderBottomWidth: 1,
                      borderBottomColor: '#F1F5F9',
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                    onPress={() => {
                      setFilterDeptId(dept.id);
                      setDeptPickerOpen(false);
                    }}
                  >
                    <Text style={{ fontSize: 15, fontWeight: isSelected ? '700' : '500', color: isSelected ? '#1B3B2B' : '#0F172A' }}>
                      {dept.name} · {count}
                    </Text>
                    {isSelected && (
                      <MaterialCommunityIcons name="check" size={20} color="#1B3B2B" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Modal: Danh sách Tất cả Trưởng phòng ── */}
      <Modal
        visible={isLeaderModalVisible}
        animationType="slide"
        onRequestClose={() => setLeaderModalVisible(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#1B3B2B' }} edges={['top']}>
          <StatusBar barStyle="light-content" backgroundColor="#1B3B2B" translucent={false} />

          {/* Modal Header */}
          <View style={adminChatStyles.modalHeaderWrap}>
            <View style={adminChatStyles.modalHeaderRow}>
              <TouchableOpacity
                onPress={() => setLeaderModalVisible(false)}
                style={adminChatStyles.modalBackBtn}
                hitSlop={10}
              >
                <MaterialCommunityIcons name="chevron-left" size={28} color="#FFFFFF" />
              </TouchableOpacity>
              <View style={adminChatStyles.modalHeaderTextWrap}>
                <Text style={adminChatStyles.modalTitle}>Trưởng phòng</Text>
                <Text style={adminChatStyles.modalSubtitle}>Chọn Trưởng phòng để nhắn tin trao đổi công việc</Text>
              </View>
            </View>
          </View>

          {/* Curved Sheet */}
          <View style={adminChatStyles.modalCurvedSheet}>
            <View style={{ paddingHorizontal: 20, paddingTop: 16, flex: 1 }}>
              {/* Search */}
              <View style={adminChatStyles.searchBox}>
                <MaterialCommunityIcons name="magnify" size={20} color="#94A3B8" />
                <TextInput
                  style={adminChatStyles.searchInput}
                  placeholder="Tìm theo tên hoặc phòng ban..."
                  placeholderTextColor="#94A3B8"
                  value={leaderSearch}
                  onChangeText={setLeaderSearch}
                />
                {leaderSearch.length > 0 && (
                  <TouchableOpacity onPress={() => setLeaderSearch('')}>
                    <MaterialCommunityIcons name="close-circle" size={18} color="#94A3B8" />
                  </TouchableOpacity>
                )}
              </View>

              {/* List */}
              <FlatList
                data={filteredLeaders}
                keyExtractor={(item) => item.userId}
                contentContainerStyle={{ paddingBottom: 24, paddingTop: 8 }}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={adminChatStyles.leaderItemRow}
                    activeOpacity={0.7}
                    disabled={connectingLeaderId === item.userId}
                    onPress={() => handleOpenDirectChat(item)}
                  >
                    <View style={adminChatStyles.leaderAvatarCircle}>
                      <Text style={adminChatStyles.leaderAvatarInitials}>
                        {getInitials(item.fullName)}
                      </Text>
                    </View>

                    <View style={adminChatStyles.leaderInfoWrap}>
                      <Text style={adminChatStyles.leaderName}>{item.fullName}</Text>
                      <Text style={adminChatStyles.leaderDept}>
                        {item.departmentName.startsWith('Trưởng phòng')
                          ? item.departmentName
                          : `Trưởng phòng ${item.departmentName}`}
                      </Text>
                    </View>

                    <View style={adminChatStyles.leaderChatBtn}>
                      {connectingLeaderId === item.userId ? (
                        <ActivityIndicator size="small" color="#1B3B2B" />
                      ) : (
                        <MaterialCommunityIcons name="chat-outline" size={20} color="#334155" />
                      )}
                    </View>
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
              />
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

// ── Chat Room Screen ──

export function ChatRoomScreen({ groupId, groupName }: { groupId: string; groupName?: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const { showAlert, showConfirm } = useAppAlert();
  const { setActiveGroupId } = useActiveChat();

  useEffect(() => {
    setActiveGroupId(groupId);
    return () => {
      setActiveGroupId(null);
    };
  }, [groupId, setActiveGroupId]);

  const queryClient = useQueryClient();
  const messages = useChatMessages(groupId);
  const sendMessage = useSendMessage(groupId);
  const deleteMessage = useDeleteMessage(groupId);
  const markAsRead = useMarkGroupAsRead();
  const myGroups = useChatGroups();
  const allGroups = useAllChatGroups();

  const myList = Array.isArray(myGroups.data) ? myGroups.data : [];
  const allList = Array.isArray(allGroups.data) ? allGroups.data : [];
  const currentGroup = myList.find((g: any) => g.id === groupId) || allList.find((g: any) => g.id === groupId);

  const employees = useScopedEmployees({
    limit: 100,
    departmentId: currentGroup?.departmentId || undefined
  });
  const groupMembersQuery = useGroupMembers(groupId);

  const availableMembers = useMemo(() => {
    // 1. From group members API
    const fromApi = groupMembersQuery.data;
    if (Array.isArray(fromApi) && fromApi.length > 0) {
      return fromApi.map((m: any) => ({
        id: m.userId || m.id || m.user?.id,
        userCode: m.userCode || m.user?.userCode || '',
        fullName: m.fullName || m.user?.profile?.fullName || m.user?.userCode || m.userCode || 'Thành viên',
        avatarUrl: m.avatarUrl || m.user?.profile?.avatarUrl || null,
      })).filter((item: any) => item.id);
    }

    // 2. From currentGroup.members (populated by getMyGroups / getAllGroups)
    if (currentGroup?.members && Array.isArray(currentGroup.members) && currentGroup.members.length > 0) {
      return currentGroup.members
        .map((m: any) => {
          const u = m.user;
          const uId = m.userId || u?.id || m.id;
          if (!uId) return null;
          return {
            id: uId,
            userCode: u?.userCode || m.userCode || '',
            fullName: u?.profile?.fullName || m.fullName || u?.userCode || m.userCode || 'Thành viên',
            avatarUrl: u?.profile?.avatarUrl || m.avatarUrl || null,
          };
        })
        .filter(Boolean) as any[];
    }

    // 3. Fallback to employees if available (for admin/HR users)
    const rawEmployees = Array.isArray(employees.data) ? employees.data : (employees.data?.items ?? []);
    if (Array.isArray(rawEmployees) && rawEmployees.length > 0) {
      return rawEmployees.map((item: any) => ({
        id: item.id,
        userCode: item.userCode || '',
        fullName: item.profile?.fullName || item.fullName || item.userCode || 'Thành viên',
        avatarUrl: item.profile?.avatarUrl || item.avatarUrl || null,
      }));
    }

    return [];
  }, [groupMembersQuery.data, currentGroup?.members, employees.data]);

  const mentionCandidates = useMemo(() => {
    return availableMembers;
  }, [availableMembers]);

  const callCandidates = useMemo(() => {
    return availableMembers.filter((m: any) => m.id !== user?.id);
  }, [availableMembers, user?.id]);
  const insets = useSafeAreaInsets();
  const inputBottomPadding = useRef(new Animated.Value(Math.max(insets.bottom, 8))).current;

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      Animated.timing(inputBottomPadding, {
        toValue: 8,
        duration: e?.duration || 250,
        useNativeDriver: false,
      }).start();
    });

    const hideSub = Keyboard.addListener(hideEvent, (e) => {
      Animated.timing(inputBottomPadding, {
        toValue: Math.max(insets.bottom, 8),
        duration: e?.duration || 250,
        useNativeDriver: false,
      }).start();
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [insets.bottom]);

  const [text, setText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentions, setMentions] = useState<string[]>([]);
  const [isStickerOpen, setIsStickerOpen] = useState(false);
  const [isCallModalVisible, setIsCallModalVisible] = useState(false);
  const [isRoomMenuVisible, setRoomMenuVisible] = useState(false);
  const [activeActionMessage, setActiveActionMessage] = useState<any | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const [replyingMessage, setReplyingMessage] = useState<any | null>(null);
  const [detailMessage, setDetailMessage] = useState<any | null>(null);
  const [detailTab, setDetailTab] = useState<'reactions' | 'seen'>('reactions');
  const [selectedReactionFilter, setSelectedReactionFilter] = useState<string>('ALL');
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  // Voice recording state
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isUploadingVoice, setIsUploadingVoice] = useState(false);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, []);

  async function startRecording() {
    if (!SafeAudio || !isAudioAvailable) {
      showAlert(
        'Cần cập nhật bản Native',
        'Ứng dụng đang chạy trên bản cài đặt chưa nạp module Microphone (ExponentAV). Vui lòng cập nhật/build lại bản native mới (iOS/Android) để sử dụng tính năng ghi âm.'
      );
      return;
    }
    try {
      const permission = await SafeAudio.requestPermissionsAsync();
      if (!permission.granted) {
        showAlert('Quyền Micro', 'Vui lòng cấp quyền Microphone trong Cài đặt để gửi tin nhắn thoại.');
        return;
      }

      await SafeAudio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const newRecording = new SafeAudio.Recording();
      await newRecording.prepareToRecordAsync(SafeAudio.RecordingOptionsPresets.HIGH_QUALITY);
      await newRecording.startAsync();

      setRecording(newRecording);
      setIsRecording(true);
      setRecordingDuration(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Failed to start recording', err);
      showAlert('Lỗi', 'Không thể bắt đầu ghi âm. Vui lòng kiểm tra quyền micro.');
    }
  }

  async function stopAndDiscardRecording() {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    setIsRecording(false);
    setRecordingDuration(0);
    if (recording) {
      try {
        await recording.stopAndUnloadAsync();
      } catch (e) {}
      setRecording(null);
    }
  }

  async function stopAndSendRecording() {
    if (!recording) return;
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    setIsRecording(false);
    setIsUploadingVoice(true);

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      if (!uri) throw new Error('Không tìm thấy file ghi âm');

      const uploadRes = await uploadFile({
        uri,
        name: `voice-${Date.now()}.m4a`,
        mimeType: 'audio/m4a',
        purpose: 'TASK_ATTACHMENT',
      });

      await sendMessage.mutateAsync({
        content: '[Tin nhắn thoại]',
        fileUrl: uploadRes.fileUrl,
        fileType: 'AUDIO',
        fileName: `voice-${Date.now()}.m4a`,
      });
    } catch (error) {
      console.error('Failed to upload/send voice note:', error);
      showAlert('Lỗi', 'Không thể gửi tin nhắn thoại');
    } finally {
      setIsUploadingVoice(false);
      setRecordingDuration(0);
    }
  }

  const deleteMessageMutation = useDeleteMessage(groupId);
  const reactMessageMutation = useReactMessage(groupId);
  const reactionDetailsQuery = useMessageReactionDetails(groupId, detailMessage?.id || '', !!detailMessage);
  const seenDetailsQuery = useMessageSeenDetails(groupId, detailMessage?.id || '', !!detailMessage);
  const { initiateCall } = useVoiceCall();

  async function handleCopyText(content?: string) {
    if (!content) return;
    await Clipboard.setStringAsync(content);
    setActiveActionMessage(null);
    showAlert('Thành công', 'Đã sao chép tin nhắn');
  }

  async function handleDownloadImage(imageUrl?: string) {
    if (!imageUrl) return;
    setIsDownloading(true);
    try {
      const fullUrl = resolveImageUrl(imageUrl) || imageUrl;
      await downloadAndSaveImage(fullUrl);
      showAlert('Thành công', 'Đã lưu ảnh vào thiết bị');
    } catch (e) {
      showAlert('Lỗi', 'Không thể lưu ảnh vào thiết bị');
    } finally {
      setIsDownloading(false);
      setActiveActionMessage(null);
    }
  }

  function handleRecallMessage(msg: any) {
    if (!msg?.id) return;
    setActiveActionMessage(null);
    showConfirm({
      title: 'Thu hồi tin nhắn',
      message: 'Bạn có chắc chắn muốn thu hồi tin nhắn này với tất cả mọi người?',
      confirmLabel: 'Thu hồi',
      onConfirm: () => {
        deleteMessageMutation.mutate(msg.id, {
          onError: (err) => {
            showAlert('Lỗi', normalizeApiError(err).message);
          },
        });
      },
    });
  }

  // Sort newest first for inverted list with defensive filtering
  const sortedMessages = useMemo(() => {
    const raw = Array.isArray(messages.data)
      ? messages.data
      : (messages.data as any)?.items ?? [];
    if (!Array.isArray(raw)) return [];

    const seen = new Set<string>();
    const unique = raw.filter((m: any) => {
      if (!m || typeof m !== 'object') return false;
      const key = m.id || m._tempId;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return unique.sort((a: any, b: any) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeB - timeA;
    });
  }, [messages.data]);

  const { joinChatRoom } = useSocketStatus();

  useEffect(() => {
    if (groupId) {
      joinChatRoom(groupId);
      markAsRead.mutateAsync(groupId).catch(console.error);
    }
  }, [groupId, joinChatRoom]);

  // Mark as read when receiving a new message from other users while in room
  const latestMessageId = sortedMessages[0]?.id;
  const isLatestFromOther = sortedMessages[0] && sortedMessages[0].senderId !== user?.id && sortedMessages[0].sender?.id !== user?.id;
  useEffect(() => {
    if (groupId && latestMessageId && isLatestFromOther) {
      markAsRead.mutateAsync(groupId).catch(console.error);
    }
  }, [groupId, latestMessageId, isLatestFromOther]);

  async function handleSendSticker(stickerUrl: string, type: string) {
    setIsStickerOpen(false);
    try {
      let prefix = type === 'lottie' ? 'LOTTIE_STICKER:' : 'STATIC_STICKER:';
      if (type === 'giphy') prefix = 'GIPHY_STICKER:';

      await sendMessage.mutateAsync({
        content: `${prefix}${stickerUrl}`,
      });
    } catch (error) {
      console.error(error);
      showAlert('Lỗi', 'Không thể gửi nhãn dán');
    }
  }

  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [viewingAlbum, setViewingAlbum] = useState<string[] | null>(null);

  async function pickImage() {
    const hasPermission = await requestMediaLibraryPermissionWithFallback();
    if (!hasPermission) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsMultipleSelection: true,
      selectionLimit: 5,
    });
    if (!result.canceled && result.assets.length > 0) {
      const newUris = result.assets.map(a => a.uri);
      setSelectedImages(prev => [...prev, ...newUris].slice(0, 5));
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
    if (isUploading || sendMessage.isPending) return;
    if (!text.trim() && selectedImages.length === 0) return;
    const content = text.trim();
    const currentMentions = [...mentions];
    setText('');
    setMentions([]);
    const currentImages = [...selectedImages];
    setSelectedImages([]);
    const currentReplyTo = replyingMessage;
    setReplyingMessage(null);

    if (currentImages.length > 0) {
      setIsUploading(true);
      try {
        const uploadResults = await Promise.all(
          currentImages.map((uri, idx) =>
            uploadFile({
              uri,
              name: `chat-image-${idx}.jpg`,
              mimeType: 'image/jpeg',
              purpose: 'TASK_ATTACHMENT',
            })
          )
        );

        let fileUrl: string | undefined;
        let fileType: string | undefined;
        if (uploadResults.length === 1) {
          fileUrl = uploadResults[0].fileUrl;
          fileType = 'IMAGE';
        } else {
          fileUrl = JSON.stringify(uploadResults.map(r => r.fileUrl));
          fileType = 'IMAGE_ALBUM';
        }

        await sendMessage.mutateAsync({
          content: content || undefined,
          fileUrl,
          fileType,
          mentions: currentMentions.length > 0 ? currentMentions : undefined,
          replyToId: currentReplyTo?.id,
          replyTo: currentReplyTo,
        });
      } catch (error) {
        const normalized = normalizeApiError(error);
        showAlert('Lỗi', normalized.message);
        setText(content);
        setSelectedImages(currentImages);
        setReplyingMessage(currentReplyTo);
      } finally {
        setIsUploading(false);
      }
    } else {
      sendMessage.mutate(
        {
          content: content || undefined,
          mentions: currentMentions.length > 0 ? currentMentions : undefined,
          replyToId: currentReplyTo?.id,
          replyTo: currentReplyTo,
        },
        {
          onError: error => {
            const normalized = normalizeApiError(error);
            showAlert('Lỗi', normalized.message);
            setText(content);
            setReplyingMessage(currentReplyTo);
          },
        }
      );
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#1B3B2B' }}>
      <StatusBar barStyle="light-content" backgroundColor="#1B3B2B" translucent={false} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <View style={styles.chatContainer}>
          {/* Watermark in chìm họ tên người dùng đặt ở lớp nền dưới cùng */}
          <ChatWatermark />

          {/* Header */}
          <View style={[adminChatStyles.roomHeaderWrap, { paddingTop: Math.max(insets.top, 16) + 4 }]}>
            <TouchableOpacity onPress={() => router.back()} style={adminChatStyles.roomBackBtn} hitSlop={10}>
              <MaterialCommunityIcons name="chevron-left" size={28} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={adminChatStyles.roomAvatarCircle}>
              <MaterialCommunityIcons
                name={currentGroup?.type === 'DIRECT' ? 'account' : 'account-group'}
                size={20}
                color="#1B3B2B"
              />
            </View>

            <View style={adminChatStyles.roomHeaderInfo}>
              <Text style={adminChatStyles.roomHeaderTitle} numberOfLines={1}>
                {(decodeURIComponent(groupName || '') || currentGroup?.name || 'Nhóm chat').replace('NV000001', 'Admin')}
              </Text>
              <Text style={adminChatStyles.roomHeaderSubtitle} numberOfLines={1}>
                {sortedMessages.length} tin nhắn
              </Text>
            </View>

            <View style={adminChatStyles.roomHeaderRightActions}>
              <TouchableOpacity
                onPress={() => {
                  const targetUserId = currentGroup?.otherUserId || (currentGroup?.type === 'DIRECT' ? currentGroup?.members?.find((m: any) => m.userId !== user?.id)?.userId : undefined);
                  if (currentGroup?.type === 'DIRECT' && targetUserId) {
                    initiateCall(targetUserId, currentGroup.name || 'Người dùng', currentGroup.otherUserAvatar);
                  } else {
                    setIsCallModalVisible(true);
                  }
                }}
                style={adminChatStyles.roomActionIconBtn}
                hitSlop={8}
              >
                <MaterialCommunityIcons name="phone-outline" size={22} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setRoomMenuVisible(true)}
                style={adminChatStyles.roomActionIconBtn}
                hitSlop={8}
              >
                <MaterialCommunityIcons name="dots-horizontal" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Messages */}
          <FlatList
            ref={flatListRef}
            style={styles.messageList}
            contentContainerStyle={styles.messageListContent}
            data={sortedMessages}
            keyExtractor={(msg: any, index: number) => String(msg?.id || msg?._tempId || `msg-${index}`)}
            inverted
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
            keyboardShouldPersistTaps="handled"
            refreshing={messages.isRefetching}
            onRefresh={() => void messages.refetch()}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            renderItem={({ item: msg, index }) => {
              if (!msg) return null;
              const isMine = Boolean(user?.id && (msg.sender?.id === user.id || msg.senderId === user.id));
              const senderName = msg.sender?.profile?.fullName ?? (msg.sender?.userCode === 'NV000001' ? 'Admin' : msg.sender?.userCode) ?? 'User';
              const isRecalled = msg.content === 'Tin nhắn đã bị thu hồi';

              // Date separator pill logic (Template match)
              const isNewDay = (() => {
                if (index === sortedMessages.length - 1) return true;
                const olderMsg = sortedMessages[index + 1];
                if (!olderMsg?.createdAt || !msg?.createdAt) return false;
                const d1 = new Date(msg.createdAt).toDateString();
                const d2 = new Date(olderMsg.createdAt).toDateString();
                return d1 !== d2;
              })();

              if (isRecalled) {
                return (
                  <View style={{ width: '100%' }}>
                    {isNewDay && (
                      <View style={adminChatStyles.dateSeparatorWrap}>
                        <View style={adminChatStyles.dateSeparatorPill}>
                          <Text style={adminChatStyles.dateSeparatorText}>{timeAgo(msg.createdAt)}</Text>
                        </View>
                      </View>
                    )}
                    <View style={[styles.messageRow, isMine && styles.messageRowMine, Platform.OS === 'web' && { transform: [{ scaleY: -1 }] }]}>
                      {!isMine && (
                        <View style={[styles.messageBubbleAvatar, { backgroundColor: '#D8E9DC' }]}>
                          {msg.sender?.profile?.avatarUrl ? (
                            <Image source={{ uri: msg.sender.profile.avatarUrl }} style={{ width: '100%', height: '100%', borderRadius: 100 }} />
                          ) : (
                            <Text style={[styles.messageBubbleAvatarText, { color: '#1B3B2B' }]}>
                              {getInitials(senderName || 'U')}
                            </Text>
                          )}
                        </View>
                      )}
                      <View style={[styles.messageBubble, styles.recalledBubble, isMine ? styles.recalledBubbleMine : styles.recalledBubbleOther]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <MaterialCommunityIcons name="undo-variant" size={15} color="#94A3B8" />
                          <Text style={styles.recalledText}>Tin nhắn đã bị thu hồi</Text>
                        </View>
                        <Text style={[styles.messageTime, { color: '#94A3B8', marginTop: 2 }]}>
                          {timeAgo(msg.createdAt)}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              }

              const hasReactions = !!msg.reactions && typeof msg.reactions === 'object' && Object.keys(msg.reactions).length > 0;

              return (
                <View style={{ width: '100%' }}>
                  {isNewDay && (
                    <View style={adminChatStyles.dateSeparatorWrap}>
                      <View style={adminChatStyles.dateSeparatorPill}>
                        <Text style={adminChatStyles.dateSeparatorText}>{timeAgo(msg.createdAt)}</Text>
                      </View>
                    </View>
                  )}
                  <Pressable
                    onLongPress={() => {
                      if (!msg.id?.startsWith('temp-')) {
                        setActiveActionMessage(msg);
                      }
                    }}
                    delayLongPress={300}
                  >
                    <View style={[
                      styles.messageRow,
                      isMine && styles.messageRowMine,
                      hasReactions && { marginBottom: 12 },
                      Platform.OS === 'web' && { transform: [{ scaleY: -1 }] }
                    ]}>
                      {!isMine && (
                        <View style={[styles.messageBubbleAvatar, { backgroundColor: '#D8E9DC' }]}>
                          {msg.sender?.profile?.avatarUrl ? (
                            <Image source={{ uri: msg.sender.profile.avatarUrl }} style={{ width: '100%', height: '100%', borderRadius: 100 }} />
                          ) : (
                            <Text style={[styles.messageBubbleAvatarText, { color: '#1B3B2B' }]}>
                              {getInitials(senderName || 'U')}
                            </Text>
                          )}
                        </View>
                      )}
                  <View style={[
                    styles.messageBubble,
                    isMine ? styles.messageBubbleMine : styles.messageBubbleOther,
                    !!msg.replyTo && styles.messageBubbleWithReply,
                    msg.id === highlightedMessageId && (isMine ? styles.messageBubbleHighlightedMine : styles.messageBubbleHighlightedOther),
                    msg.fileUrl && msg.fileType === 'IMAGE' && !msg.content ? styles.messageBubbleImageOnly : {},
                    msg.fileType === 'IMAGE_ALBUM' || msg.content?.startsWith('LOTTIE_STICKER:') || msg.content?.startsWith('STATIC_STICKER:') || msg.content?.startsWith('GIPHY_STICKER:') ? { backgroundColor: 'transparent', padding: 0, elevation: 0, shadowOpacity: 0 } : {}
                  ]}>
                    {!isMine && !msg.content?.startsWith('LOTTIE_STICKER:') && !msg.content?.startsWith('STATIC_STICKER:') && !msg.content?.startsWith('GIPHY_STICKER:') && (
                      <Text style={[styles.messageSender, msg.fileUrl && msg.fileType === 'IMAGE' && !msg.content ? { paddingHorizontal: 16, paddingTop: 10 } : {}]}>{senderName}</Text>
                    )}

                    {/* Quoted Message (Reply Block - Zalo Style) */}
                    {!!msg.replyTo && (
                      <TouchableOpacity
                        activeOpacity={0.75}
                        onPress={() => {
                          if (msg.replyTo?.id && flatListRef.current) {
                            const targetIndex = sortedMessages.findIndex((m: any) => m.id === msg.replyTo.id);
                            if (targetIndex !== -1) {
                              try {
                                flatListRef.current.scrollToIndex({ index: targetIndex, animated: true, viewPosition: 0.5 });
                              } catch (e) {
                                try {
                                  flatListRef.current.scrollToOffset({ offset: targetIndex * 70, animated: true });
                                } catch (e2) {}
                              }
                              setHighlightedMessageId(msg.replyTo.id);
                              setTimeout(() => {
                                setHighlightedMessageId((prev) => (prev === msg.replyTo.id ? null : prev));
                              }, 2000);
                            }
                          }
                        }}
                        style={[
                          styles.quoteBlock,
                          isMine ? styles.quoteBlockMine : styles.quoteBlockOther
                        ]}
                      >
                        <View style={[styles.quoteIndicator, isMine ? styles.quoteIndicatorMine : styles.quoteIndicatorOther]} />
                        <View style={{ flex: 1, paddingLeft: 8, paddingRight: 4 }}>
                          <Text style={[styles.quoteSender, isMine ? styles.quoteSenderMine : styles.quoteSenderOther]} numberOfLines={1}>
                            {msg.replyTo.sender?.profile?.fullName || (msg.replyTo.sender?.userCode === 'NV000001' ? 'Admin' : msg.replyTo.sender?.userCode) || 'Người dùng'}
                          </Text>
                          <Text style={[styles.quoteText, isMine ? styles.quoteTextMine : styles.quoteTextOther]} numberOfLines={3}>
                            {msg.replyTo.content || (msg.replyTo.fileType === 'IMAGE' ? '[Hình ảnh]' : msg.replyTo.fileType === 'IMAGE_ALBUM' ? '[Bộ sưu tập ảnh]' : '[Tệp tin]')}
                          </Text>
                        </View>
                        {msg.replyTo.fileUrl && (msg.replyTo.fileType === 'IMAGE' || msg.replyTo.fileType === 'IMAGE_ALBUM') && (
                          <Image
                            source={{ uri: resolveImageUrl(msg.replyTo.fileType === 'IMAGE_ALBUM' ? (() => { try { return JSON.parse(msg.replyTo.fileUrl)[0]; } catch(e) { return msg.replyTo.fileUrl; } })() : msg.replyTo.fileUrl) || '' }}
                            style={styles.quoteThumb}
                          />
                        )}
                      </TouchableOpacity>
                    )}

                    {msg.fileUrl && (msg.fileType === 'IMAGE' || msg.fileType === 'IMAGE_ALBUM') && (
                      <View>
                        {msg.fileType === 'IMAGE_ALBUM' ? (() => {
                          let albumUrls: string[] = [];
                          try { albumUrls = JSON.parse(msg.fileUrl); } catch (e) {}
                          const topImage = albumUrls[0];
                          const totalCount = albumUrls.length;

                          return (
                            <View style={{ marginVertical: 6, alignItems: isMine ? 'flex-end' : 'flex-start' }}>
                              {/* Header Badge: X ảnh */}
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4, paddingHorizontal: 4 }}>
                                <MaterialCommunityIcons name="view-grid" size={14} color="#6B7280" />
                                <Text style={{ fontSize: 12, fontWeight: '700', color: '#6B7280' }}>
                                  {totalCount} ảnh
                                </Text>
                              </View>

                              {/* Stacked Album Deck Effect (Messenger Style) */}
                              <Pressable
                                onPress={() => setViewingAlbum(albumUrls)}
                                onLongPress={() => {
                                  if (!msg.id?.startsWith('temp-')) {
                                    setActiveActionMessage(msg);
                                  }
                                }}
                                delayLongPress={300}
                                style={{ width: 170, height: 180, position: 'relative', marginTop: 6 }}
                              >
                                {/* Layer 3 (Bottom Stacked Card) */}
                                {totalCount >= 3 && (
                                  <View
                                    style={{
                                      position: 'absolute',
                                      top: -8,
                                      left: 14,
                                      width: 142,
                                      height: 155,
                                      borderRadius: 20,
                                      backgroundColor: '#D1D5DB',
                                      transform: [{ rotate: '-8deg' }],
                                      borderWidth: 2,
                                      borderColor: '#FFFFFF',
                                      opacity: 0.6,
                                    }}
                                  />
                                )}

                                {/* Layer 2 (Middle Stacked Card) */}
                                {totalCount >= 2 && (
                                  <View
                                    style={{
                                      position: 'absolute',
                                      top: -4,
                                      left: 8,
                                      width: 154,
                                      height: 165,
                                      borderRadius: 20,
                                      backgroundColor: '#E5E7EB',
                                      transform: [{ rotate: '6deg' }],
                                      borderWidth: 2,
                                      borderColor: '#FFFFFF',
                                      opacity: 0.85,
                                    }}
                                  />
                                )}

                                {/* Layer 1 (Main Front Top Card) */}
                                <View
                                  style={{
                                    width: 170,
                                    height: 180,
                                    borderRadius: 22,
                                    overflow: 'hidden',
                                    borderWidth: 3,
                                    borderColor: '#FFFFFF',
                                    backgroundColor: '#F3F4F6',
                                    shadowColor: '#000',
                                    shadowOffset: { width: 0, height: 4 },
                                    shadowOpacity: 0.2,
                                    shadowRadius: 6,
                                    elevation: 5,
                                  }}
                                >
                                  <Image
                                    source={{ uri: resolveImageUrl(topImage) || '' }}
                                    style={{ width: '100%', height: '100%' }}
                                    resizeMode="cover"
                                  />
                                </View>
                              </Pressable>
                            </View>
                          );
                        })() : (
                          <Pressable 
                            onPress={() => setViewingImage(resolveImageUrl(msg.fileUrl) || '')}
                            onLongPress={() => {
                              if (!msg.id?.startsWith('temp-')) {
                                setActiveActionMessage(msg);
                              }
                            }}
                            delayLongPress={300}
                          >
                            <Image
                              source={{ uri: resolveImageUrl(msg.fileUrl) || '' }}
                              style={[styles.messageImage, !msg.content ? styles.messageImageOnly : {}]}
                            />
                          </Pressable>
                        )}
                      </View>
                    )}
                    {msg.fileUrl && msg.fileType === 'AUDIO' && (
                      <VoiceMessageBubble
                        uri={resolveImageUrl(msg.fileUrl) || msg.fileUrl}
                        isMine={isMine}
                      />
                    )}
                    {!!msg.content && !msg.content.startsWith('LOTTIE_STICKER:') && !msg.content.startsWith('STATIC_STICKER:') && !msg.content.startsWith('GIPHY_STICKER:') && msg.fileType !== 'AUDIO' && (
                      <Text style={[
                        styles.messageText,
                        isMine && styles.messageTextMine,
                        msg.fileUrl && msg.fileType === 'IMAGE' ? { marginTop: 8 } : {}
                      ]}>
                        {msg.content}
                      </Text>
                    )}
                    {!!msg.content && msg.content.startsWith('LOTTIE_STICKER:') && (
                      <LottieView
                        autoPlay
                        loop
                        style={{ width: 120, height: 120 }}
                        source={{ uri: msg.content.replace('LOTTIE_STICKER:', '') }}
                      />
                    )}
                    {!!msg.content && (msg.content.startsWith('STATIC_STICKER:') || msg.content.startsWith('GIPHY_STICKER:')) && (
                      <Image
                        source={{ uri: msg.content.replace('STATIC_STICKER:', '').replace('GIPHY_STICKER:', '').replace(/^http:/, 'https:') }}
                        style={{ width: 120, height: 120 }}
                        resizeMode="contain"
                      />
                    )}
                    <Text style={[
                      styles.messageTime,
                      isMine && styles.messageTimeMine,
                      msg.fileUrl && msg.fileType === 'IMAGE' && !msg.content ? { position: 'absolute', bottom: 8, left: 10, backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 7, paddingVertical: 2.5, borderRadius: 10, color: '#fff' } : {},
                      (msg.fileType === 'IMAGE_ALBUM' || msg.content?.startsWith('LOTTIE_STICKER:') || msg.content?.startsWith('STATIC_STICKER:') || msg.content?.startsWith('GIPHY_STICKER:')) ? { color: colors.muted } : {}
                    ]}>
                      {timeAgo(msg.createdAt)}
                    </Text>

                    {/* Floating Reaction Badge attached to bubble */}
                    {!!msg.reactions && typeof msg.reactions === 'object' && Object.keys(msg.reactions).length > 0 && (() => {
                      const reactionMap: Record<string, number> = {};
                      let total = 0;
                      Object.values(msg.reactions).forEach((emoji: any) => {
                        if (typeof emoji === 'string') {
                          reactionMap[emoji] = (reactionMap[emoji] || 0) + 1;
                          total += 1;
                        }
                      });
                      const uniqueEmojis = Object.keys(reactionMap);
                      if (uniqueEmojis.length === 0) return null;

                      return (
                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={() => {
                            if (!msg.id?.startsWith('temp-')) {
                              setDetailMessage(msg);
                              setDetailTab('reactions');
                              setSelectedReactionFilter('ALL');
                            }
                          }}
                          style={[
                            styles.messageReactionBadge,
                            isMine ? styles.messageReactionBadgeMine : styles.messageReactionBadgeOther,
                          ]}
                        >
                          <Text style={styles.messageReactionBadgeText}>
                            {uniqueEmojis.slice(0, 3).join('')}{total > 1 ? ` ${total}` : ''}
                          </Text>
                        </TouchableOpacity>
                      );
                    })()}
                  </View>
                </View>
              </Pressable>
            </View>
          );
        }}
          ListEmptyComponent={
              <View style={styles.emptyChat}>
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
                data={mentionCandidates.filter((e: any) =>
                  (e.fullName ?? e.userCode ?? '').toLowerCase().includes(mentionQuery)
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

          {/* Reply Preview Bar Above Input */}
          {!!replyingMessage && (
            <View style={styles.replyPreviewBar}>
              <View style={styles.replyPreviewIndicator} />
              <View style={{ flex: 1, paddingLeft: 10, paddingRight: 6 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <MaterialCommunityIcons name="reply" size={14} color="#2563EB" />
                  <Text style={styles.replyPreviewSender} numberOfLines={1}>
                    Đang trả lời {replyingMessage.sender?.profile?.fullName || (replyingMessage.sender?.userCode === 'NV000001' ? 'Admin' : replyingMessage.sender?.userCode) || 'Người dùng'}
                  </Text>
                </View>
                <Text style={styles.replyPreviewText} numberOfLines={1}>
                  {replyingMessage.content || (replyingMessage.fileType === 'IMAGE' ? '[Hình ảnh]' : replyingMessage.fileType === 'IMAGE_ALBUM' ? '[Bộ sưu tập ảnh]' : '[Tệp tin]')}
                </Text>
              </View>
              {replyingMessage.fileUrl && (replyingMessage.fileType === 'IMAGE' || replyingMessage.fileType === 'IMAGE_ALBUM') && (
                <Image
                  source={{ uri: resolveImageUrl(replyingMessage.fileType === 'IMAGE_ALBUM' ? (() => { try { return JSON.parse(replyingMessage.fileUrl)[0]; } catch(e) { return replyingMessage.fileUrl; } })() : replyingMessage.fileUrl) || '' }}
                  style={styles.replyPreviewThumb}
                />
              )}
              <TouchableOpacity onPress={() => setReplyingMessage(null)} style={styles.replyPreviewCloseBtn}>
                <MaterialCommunityIcons name="close-circle" size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>
          )}

          {/* Selected Images Preview Bar Above Input */}
          {selectedImages.length > 0 && (
            <View style={{ backgroundColor: '#F9FAFB', paddingHorizontal: 16, paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#E5E7EB' }}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, alignItems: 'center' }}>
                {selectedImages.map((uri, idx) => (
                  <View key={idx} style={{ width: 64, height: 64, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#D1D5DB', position: 'relative' }}>
                    <Image source={{ uri }} style={{ width: '100%', height: '100%' }} />
                    <Pressable
                      style={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        backgroundColor: 'rgba(0,0,0,0.6)',
                        borderRadius: 10,
                        width: 18,
                        height: 18,
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                      onPress={() => setSelectedImages(prev => prev.filter((_, i) => i !== idx))}
                    >
                      <MaterialCommunityIcons name="close" size={12} color="#fff" />
                    </Pressable>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Input */}
          <Animated.View style={[styles.chatInputRow, { paddingBottom: inputBottomPadding }]}>
            {isRecording ? (
              <View style={styles.recordingRow}>
                {/* Trash Button to Discard */}
                <TouchableOpacity
                  onPress={stopAndDiscardRecording}
                  style={styles.recordingTrashBtn}
                >
                  <MaterialCommunityIcons name="trash-can-outline" size={22} color="#EF4444" />
                </TouchableOpacity>

                {/* Pulsing indicator + Duration timer */}
                <View style={styles.recordingStatusWrap}>
                  <View style={styles.recordingDot} />
                  <Text style={styles.recordingDurationText}>
                    {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60) < 10 ? '0' : ''}{recordingDuration % 60}
                  </Text>
                  <Text style={styles.recordingLabel}>Đang ghi âm...</Text>
                </View>

                {/* Send Voice Button */}
                <TouchableOpacity
                  onPress={stopAndSendRecording}
                  disabled={isUploadingVoice}
                  style={styles.recordingSendBtn}
                >
                  {isUploadingVoice ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <MaterialCommunityIcons name="send" size={20} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <Pressable onPress={() => setIsStickerOpen(true)} style={styles.attachBtn}>
                  <MaterialCommunityIcons name="emoticon-happy-outline" size={24} color="#64748B" />
                </Pressable>
                <Pressable onPress={pickImage} style={styles.attachBtn}>
                  <MaterialCommunityIcons name="image-outline" size={24} color="#64748B" />
                </Pressable>
                <View style={{ flex: 1 }}>
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

                {/* If user entered text or selected image -> Show Send Button; Otherwise show Mic Button */}
                {text.trim().length > 0 || selectedImages.length > 0 ? (
                  <Pressable
                    style={[
                      styles.chatSendBtn,
                      (isUploading || sendMessage.isPending) && styles.chatSendBtnDisabled,
                    ]}
                    onPress={handleSend}
                    disabled={isUploading || sendMessage.isPending}
                  >
                    <MaterialCommunityIcons
                      name={isUploading || sendMessage.isPending ? 'loading' : 'send'}
                      size={20}
                      color="#fff"
                    />
                  </Pressable>
                ) : (
                  <TouchableOpacity
                    style={styles.chatMicBtn}
                    onPress={startRecording}
                  >
                    <MaterialCommunityIcons name="microphone" size={22} color="#FFFFFF" />
                  </TouchableOpacity>
                )}
              </>
            )}
          </Animated.View>
        </View>

        {/* Image Viewer Modal with Close & Download Buttons */}
        <ImageViewing
          images={viewingAlbum ? viewingAlbum.map(u => ({ uri: resolveImageUrl(u) || u })) : (viewingImage ? [{ uri: resolveImageUrl(viewingImage) || viewingImage }] : [])}
          imageIndex={0}
          visible={!!viewingImage || !!viewingAlbum}
          onRequestClose={() => { setViewingImage(null); setViewingAlbum(null); }}
          HeaderComponent={({ imageIndex }) => {
            const currentImg = viewingAlbum ? viewingAlbum[imageIndex] : viewingImage;
            const totalCount = viewingAlbum ? viewingAlbum.length : 1;
            return (
              <SafeAreaView edges={['top']} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 10 }}>
                <TouchableOpacity
                  style={styles.imageViewerDownloadBtn}
                  onPress={() => { setViewingImage(null); setViewingAlbum(null); }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <MaterialCommunityIcons name="close" size={24} color="#FFFFFF" />
                </TouchableOpacity>

                {totalCount > 1 ? (
                  <View style={{ backgroundColor: 'rgba(0, 0, 0, 0.65)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 }}>
                    <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>
                      {imageIndex + 1} / {totalCount}
                    </Text>
                  </View>
                ) : (
                  <View />
                )}

                <TouchableOpacity
                  style={styles.imageViewerDownloadBtn}
                  onPress={() => handleDownloadImage(currentImg || '')}
                  disabled={isDownloading}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <MaterialCommunityIcons name={isDownloading ? 'loading' : 'download'} size={22} color="#FFFFFF" />
                </TouchableOpacity>
              </SafeAreaView>
            );
          }}
        />

        {/* Long Press Message Action Sheet (Zalo Style) */}
        <Modal
          visible={!!activeActionMessage}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setActiveActionMessage(null)}
        >
          <Pressable
            style={styles.actionModalBackdrop}
            onPress={() => setActiveActionMessage(null)}
          >
            <Pressable style={styles.actionModalCard} onPress={(e) => e.stopPropagation?.()}>
              {/* Floating Quick Reactions Bar (Zalo Style) */}
              <View style={styles.reactionBar}>
                {['👍', '❤️', '😂', '😮', '😢', '🔥'].map((emoji) => {
                  const isCurrentEmoji = activeActionMessage?.reactions && user?.id && activeActionMessage.reactions[user.id] === emoji;
                  return (
                    <TouchableOpacity
                      key={emoji}
                      style={[styles.reactionItem, isCurrentEmoji && styles.reactionItemActive]}
                      onPress={() => {
                        const msg = activeActionMessage;
                        setActiveActionMessage(null);
                        if (msg?.id) {
                          reactMessageMutation.mutate({
                            messageId: msg.id,
                            emoji,
                          });
                        }
                      }}
                    >
                      <Text style={[styles.reactionEmoji, isCurrentEmoji && { transform: [{ scale: 1.25 }] }]}>{emoji}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Action Menu Grid (Zalo Style) */}
              <View style={styles.zaloActionGrid}>
                {/* 1. Trả lời */}
                <TouchableOpacity
                  style={styles.zaloActionBtn}
                  onPress={() => {
                    const msg = activeActionMessage;
                    setActiveActionMessage(null);
                    setReplyingMessage(msg);
                  }}
                >
                  <View style={[styles.zaloActionIconWrap, { backgroundColor: '#EFF6FF' }]}>
                    <MaterialCommunityIcons name="reply" size={22} color="#2563EB" />
                  </View>
                  <Text style={styles.zaloActionLabel}>Trả lời</Text>
                </TouchableOpacity>

                {/* 2. Sao chép (nếu có nội dung chữ) */}
                {!!activeActionMessage?.content &&
                  activeActionMessage.content !== 'Tin nhắn đã bị thu hồi' &&
                  !activeActionMessage.content.startsWith('LOTTIE_STICKER:') &&
                  !activeActionMessage.content.startsWith('STATIC_STICKER:') &&
                  !activeActionMessage.content.startsWith('GIPHY_STICKER:') && (
                    <TouchableOpacity
                      style={styles.zaloActionBtn}
                      onPress={() => handleCopyText(activeActionMessage.content)}
                    >
                      <View style={[styles.zaloActionIconWrap, { backgroundColor: '#ECFDF5' }]}>
                        <MaterialCommunityIcons name="content-copy" size={22} color="#059669" />
                      </View>
                      <Text style={styles.zaloActionLabel}>Sao chép</Text>
                    </TouchableOpacity>
                  )}

                {/* 3. Lưu ảnh (nếu là ảnh) */}
                {!!activeActionMessage?.fileUrl &&
                  (activeActionMessage.fileType === 'IMAGE' || activeActionMessage.fileType === 'IMAGE_ALBUM') && (
                    <TouchableOpacity
                      style={styles.zaloActionBtn}
                      onPress={() => {
                        let urlToDownload = activeActionMessage.fileUrl;
                        if (activeActionMessage.fileType === 'IMAGE_ALBUM') {
                          try {
                            const urls = JSON.parse(activeActionMessage.fileUrl);
                            urlToDownload = urls[0];
                          } catch (e) {}
                        }
                        handleDownloadImage(urlToDownload);
                      }}
                    >
                      <View style={[styles.zaloActionIconWrap, { backgroundColor: '#FEF3C7' }]}>
                        <MaterialCommunityIcons name="download" size={22} color="#D97706" />
                      </View>
                      <Text style={styles.zaloActionLabel}>Lưu ảnh</Text>
                    </TouchableOpacity>
                  )}

                {/* 4. Xem chi tiết người thả cảm xúc / người xem */}
                <TouchableOpacity
                  style={styles.zaloActionBtn}
                  onPress={() => {
                    const msg = activeActionMessage;
                    setActiveActionMessage(null);
                    setDetailMessage(msg);
                    setDetailTab('reactions');
                    setSelectedReactionFilter('ALL');
                  }}
                >
                  <View style={[styles.zaloActionIconWrap, { backgroundColor: '#EEF2FF' }]}>
                    <MaterialCommunityIcons name="account-eye-outline" size={22} color="#4F46E5" />
                  </View>
                  <Text style={styles.zaloActionLabel}>Chi tiết</Text>
                </TouchableOpacity>

                {/* 5. Thu hồi tin nhắn */}
                {(Boolean(user?.id && (activeActionMessage?.sender?.id === user.id || activeActionMessage?.senderId === user.id)) ||
                  user?.roles?.includes('ADMIN')) &&
                  activeActionMessage?.content !== 'Tin nhắn đã bị thu hồi' && (
                    <TouchableOpacity
                      style={styles.zaloActionBtn}
                      onPress={() => handleRecallMessage(activeActionMessage)}
                    >
                      <View style={[styles.zaloActionIconWrap, { backgroundColor: '#FEF2F2' }]}>
                        <MaterialCommunityIcons name="delete-restore" size={22} color="#EF4444" />
                      </View>
                      <Text style={[styles.zaloActionLabel, { color: '#EF4444' }]}>Thu hồi</Text>
                    </TouchableOpacity>
                  )}
              </View>
            </Pressable>
          </Pressable>
        </Modal>

        {/* Message Reaction & Seen Details Modal (Zalo Style) */}
        <Modal
          visible={!!detailMessage}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setDetailMessage(null)}
        >
          <View style={styles.detailModalBackdrop}>
            <View style={styles.detailModalCard}>
              {/* Header */}
              <View style={styles.detailModalHeader}>
                <Text style={styles.detailModalTitle}>Chi tiết tin nhắn</Text>
                <TouchableOpacity onPress={() => setDetailMessage(null)} style={{ padding: 4 }}>
                  <MaterialCommunityIcons name="close" size={22} color="#64748B" />
                </TouchableOpacity>
              </View>

              {/* Segmented Tab: Cảm xúc vs Đã xem */}
              <View style={styles.detailSegmentedBar}>
                <TouchableOpacity
                  style={[styles.detailSegmentTab, detailTab === 'reactions' && styles.detailSegmentTabActive]}
                  onPress={() => setDetailTab('reactions')}
                >
                  <Text style={[styles.detailSegmentTabText, detailTab === 'reactions' && styles.detailSegmentTabTextActive]}>
                    Cảm xúc ({detailMessage?.reactions ? Object.keys(detailMessage.reactions).length : 0})
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.detailSegmentTab, detailTab === 'seen' && styles.detailSegmentTabActive]}
                  onPress={() => setDetailTab('seen')}
                >
                  <Text style={[styles.detailSegmentTabText, detailTab === 'seen' && styles.detailSegmentTabTextActive]}>
                    Đã xem ({seenDetailsQuery.data?.length || 0})
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Tab 1: Reactions */}
              {detailTab === 'reactions' && (
                <View style={{ flex: 1 }}>
                  {/* Reaction filter tabs */}
                  {(() => {
                    const reactionCounts: Record<string, number> = {};
                    let total = 0;
                    if (detailMessage?.reactions) {
                      Object.values(detailMessage.reactions).forEach((emoji: any) => {
                        if (typeof emoji === 'string') {
                          reactionCounts[emoji] = (reactionCounts[emoji] || 0) + 1;
                          total += 1;
                        }
                      });
                    }
                    const availableEmojis = Object.keys(reactionCounts);

                    return (
                      <View style={styles.detailFilterBar}>
                        <TouchableOpacity
                          style={[styles.detailFilterPill, selectedReactionFilter === 'ALL' && styles.detailFilterPillActive]}
                          onPress={() => setSelectedReactionFilter('ALL')}
                        >
                          <Text style={[styles.detailFilterPillText, selectedReactionFilter === 'ALL' && styles.detailFilterPillTextActive]}>
                            Tất cả {total}
                          </Text>
                        </TouchableOpacity>
                        {availableEmojis.map((emoji) => (
                          <TouchableOpacity
                            key={emoji}
                            style={[styles.detailFilterPill, selectedReactionFilter === emoji && styles.detailFilterPillActive]}
                            onPress={() => setSelectedReactionFilter(emoji)}
                          >
                            <Text style={[styles.detailFilterPillText, selectedReactionFilter === emoji && styles.detailFilterPillTextActive]}>
                              {emoji} {reactionCounts[emoji]}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    );
                  })()}

                  {/* List of reacted users */}
                  {reactionDetailsQuery.isLoading ? (
                    <View style={{ padding: 40, alignItems: 'center' }}>
                      <ActivityIndicator size="small" color="#2563EB" />
                    </View>
                  ) : (() => {
                    const list = (reactionDetailsQuery.data || []).filter((item: any) =>
                      selectedReactionFilter === 'ALL' || item.emoji === selectedReactionFilter
                    );

                    if (list.length === 0) {
                      return (
                        <View style={{ padding: 40, alignItems: 'center' }}>
                          <Text style={{ fontSize: 14, color: '#94A3B8' }}>Chưa có cảm xúc nào</Text>
                        </View>
                      );
                    }

                    return (
                      <FlatList
                        data={list}
                        keyExtractor={(item: any) => item.user.id}
                        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
                        ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: '#F1F5F9', marginVertical: 6 }} />}
                        renderItem={({ item }: { item: any }) => (
                          <View style={styles.detailUserRow}>
                            <View style={styles.detailUserAvatar}>
                              {item.user.avatarUrl ? (
                                <Image source={{ uri: item.user.avatarUrl }} style={{ width: '100%', height: '100%', borderRadius: 20 }} />
                              ) : (
                                <Text style={styles.detailUserAvatarText}>{getInitials(item.user.fullName)}</Text>
                              )}
                            </View>
                            <View style={{ flex: 1, marginLeft: 12 }}>
                              <Text style={styles.detailUserName}>{item.user.fullName}</Text>
                              <Text style={styles.detailUserCode}>{item.user.userCode}</Text>
                            </View>
                            <Text style={{ fontSize: 24 }}>{item.emoji}</Text>
                          </View>
                        )}
                      />
                    );
                  })()}
                </View>
              )}

              {/* Tab 2: Seen by */}
              {detailTab === 'seen' && (
                <View style={{ flex: 1 }}>
                  {seenDetailsQuery.isLoading ? (
                    <View style={{ padding: 40, alignItems: 'center' }}>
                      <ActivityIndicator size="small" color="#2563EB" />
                    </View>
                  ) : (seenDetailsQuery.data || []).length === 0 ? (
                    <View style={{ padding: 40, alignItems: 'center' }}>
                      <Text style={{ fontSize: 14, color: '#94A3B8' }}>Chưa có ai xem tin nhắn này</Text>
                    </View>
                  ) : (
                    <FlatList
                      data={seenDetailsQuery.data || []}
                      keyExtractor={(item: any) => item.user.id}
                      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
                      ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: '#F1F5F9', marginVertical: 6 }} />}
                      renderItem={({ item }: { item: any }) => (
                        <View style={styles.detailUserRow}>
                          <View style={styles.detailUserAvatar}>
                            {item.user.avatarUrl ? (
                              <Image source={{ uri: item.user.avatarUrl }} style={{ width: '100%', height: '100%', borderRadius: 20 }} />
                            ) : (
                              <Text style={styles.detailUserAvatarText}>{getInitials(item.user.fullName)}</Text>
                            )}
                          </View>
                          <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={styles.detailUserName}>{item.user.fullName}</Text>
                            <Text style={styles.detailUserCode}>{item.user.userCode}</Text>
                          </View>
                          {!!item.readAt && (
                            <Text style={{ fontSize: 12, color: '#94A3B8' }}>{timeAgo(item.readAt)}</Text>
                          )}
                        </View>
                      )}
                    />
                  )}
                </View>
              )}
            </View>
          </View>
        </Modal>

        {/* Sticker Modal */}
        <StickerPickerModal
          visible={isStickerOpen}
          onClose={() => setIsStickerOpen(false)}
          onSelectSticker={handleSendSticker}
        />

        {/* Call User Selection Modal */}
        <Modal visible={isCallModalVisible} transparent={true} animationType="slide" onRequestClose={() => setIsCallModalVisible(false)}>
          <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <View style={{ backgroundColor: '#fff', height: '60%', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827' }}>Chọn người để gọi</Text>
                <TouchableOpacity onPress={() => setIsCallModalVisible(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <MaterialCommunityIcons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              <FlatList
                data={callCandidates}
                keyExtractor={(item: any) => item.id}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <View style={{ paddingVertical: 40, alignItems: 'center', justifyContent: 'center' }}>
                    <MaterialCommunityIcons name="account-off-outline" size={48} color="#D1D5DB" />
                    <Text style={{ marginTop: 12, color: '#6B7280', fontSize: 14, textAlign: 'center' }}>
                      {groupMembersQuery.isLoading ? 'Đang tải danh sách thành viên...' : 'Không tìm thấy thành viên nào khác trong nhóm để gọi'}
                    </Text>
                  </View>
                }
                renderItem={({ item }) => {
                  const displayName = item.fullName ?? item.userCode ?? 'Người dùng';
                  const avatar = item.avatarUrl;
                  return (
                    <TouchableOpacity
                      style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}
                      onPress={() => {
                        setIsCallModalVisible(false);
                        initiateCall(item.id, displayName, avatar);
                      }}
                    >
                      {avatar ? (
                        <Image source={{ uri: resolveImageUrl(avatar) || avatar }} style={{ width: 44, height: 44, borderRadius: 22, marginRight: 12 }} />
                      ) : (
                        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#3B82F6', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{getInitials(displayName)}</Text>
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827' }}>{displayName}</Text>
                        {item.userCode ? (
                          <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{item.userCode}</Text>
                        ) : null}
                      </View>
                      <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center' }}>
                        <MaterialCommunityIcons name="phone" size={20} color="#10B981" />
                      </View>
                    </TouchableOpacity>
                  );
                }}
              />
            </View>
          </View>
        </Modal>

        {/* ── Room Options Menu Modal (Movie Legend) ── */}
        <Modal
          visible={isRoomMenuVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setRoomMenuVisible(false)}
        >
          <TouchableOpacity
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
            activeOpacity={1}
            onPress={() => setRoomMenuVisible(false)}
          >
            <View style={{ backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 }}>
              <View style={{ width: 40, height: 4, backgroundColor: '#CBD5E1', borderRadius: 2, alignSelf: 'center', marginBottom: 16 }} />
              <Text style={{ fontSize: 17, fontWeight: '800', color: '#0F172A', marginBottom: 12 }}>Tùy chọn nhóm chat</Text>

              {/* Gọi điện */}
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}
                onPress={() => {
                  setRoomMenuVisible(false);
                  const targetUserId = currentGroup?.otherUserId || (currentGroup?.type === 'DIRECT' ? currentGroup?.members?.find((m: any) => m.userId !== user?.id)?.userId : undefined);
                  if (currentGroup?.type === 'DIRECT' && targetUserId) {
                    initiateCall(targetUserId, currentGroup.name || 'Người dùng', currentGroup.otherUserAvatar);
                  } else {
                    setIsCallModalVisible(true);
                  }
                }}
              >
                <MaterialCommunityIcons name="phone" size={22} color="#15803D" />
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#0F172A' }}>Gọi điện</Text>
              </TouchableOpacity>

              {/* Xóa nhóm chat (Admin / Direct) */}
              {(currentGroup?.type === 'DIRECT' || user?.roles?.includes('ADMIN')) && (
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}
                  onPress={() => {
                    setRoomMenuVisible(false);
                    showConfirm({
                      title: 'Xác nhận xóa',
                      message: 'Bạn có chắc chắn muốn xóa nhóm chat này không? Mọi tin nhắn sẽ bị xóa vĩnh viễn.',
                      confirmLabel: 'Xóa',
                      confirmTone: 'danger',
                      onConfirm: async () => {
                        try {
                          await require('../../utils/api').api.delete(`/chat/groups/${groupId}`);
                          queryClient.invalidateQueries({ queryKey: ['chat', 'groups'] });
                          queryClient.invalidateQueries({ queryKey: ['chat', 'allGroups'] });
                          router.back();
                        } catch (error) {
                          showAlert('Lỗi', 'Không thể xóa nhóm chat');
                        }
                      }
                    });
                  }}
                >
                  <MaterialCommunityIcons name="trash-can-outline" size={22} color="#DC2626" />
                  <Text style={{ fontSize: 15, fontWeight: '600', color: '#DC2626' }}>Xóa nhóm chat</Text>
                </TouchableOpacity>
              )}

              {/* Đóng */}
              <TouchableOpacity
                style={{ marginTop: 12, paddingVertical: 14, borderRadius: 12, backgroundColor: '#F1F5F9', alignItems: 'center' }}
                onPress={() => setRoomMenuVisible(false)}
              >
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#475569' }}>Đóng</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

      </KeyboardAvoidingView>
    </View>
  );
}

const adminChatStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#1B3B2B',
  },
  headerWrap: {
    backgroundColor: '#1B3B2B',
    paddingHorizontal: 20,
    paddingBottom: 18,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  createGroupPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    gap: 4,
  },
  createGroupPillText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  curvedSheet: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  sheetScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 110,
  },

  /* Section 1: Trưởng phòng */
  leadersSection: {
    marginBottom: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  seeAllLeadersText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563EB',
  },
  leaderListContainer: {
    gap: 12,
  },
  leaderItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  leaderAvatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#D8E9DC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leaderAvatarInitials: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1B3B2B',
  },
  leaderInfoWrap: {
    flex: 1,
  },
  leaderName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  leaderDept: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  leaderChatBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Section 2: Trò chuyện gần đây */
  recentSection: {
    marginTop: 16,
  },
  recentGroupList: {
    marginTop: 8,
  },
  recentGroupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
    gap: 12,
  },
  recentGroupAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#D8E9DC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentGroupInfo: {
    flex: 1,
  },
  recentGroupName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  recentGroupSub: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  unreadBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },

  /* Modal: Tạo nhóm chat */
  modalHeaderWrap: {
    backgroundColor: '#1B3B2B',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalBackBtn: {
    padding: 4,
    marginLeft: -4,
  },
  modalHeaderTextWrap: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modalSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  modalCurvedSheet: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  modalFormContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  formInput: {
    height: 48,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
  },
  memberSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  selectedCountText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    gap: 8,
    backgroundColor: '#FFFFFF',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    padding: 0,
  },
  deptDropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    marginVertical: 10,
    backgroundColor: '#FFFFFF',
  },
  deptDropdownText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  memberItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
    gap: 12,
  },
  checkboxBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxBoxSelected: {
    backgroundColor: '#1B3B2B',
    borderColor: '#1B3B2B',
  },
  memberAvatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#D8E9DC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarInitials: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1B3B2B',
  },
  memberInfoWrap: {
    flex: 1,
  },
  memberName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  memberCodeDept: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  modalFixedFooter: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  createGroupSubmitBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#1B3B2B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createGroupSubmitBtnDisabled: {
    backgroundColor: '#C5DEC9',
  },
  createGroupSubmitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  createGroupHelperText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
  },

  /* Chat Room Top Header */
  roomHeaderWrap: {
    backgroundColor: '#1B3B2B',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 10,
    zIndex: 10,
  },
  roomBackBtn: {
    padding: 4,
    marginLeft: -4,
  },
  roomAvatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#D8E9DC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roomHeaderInfo: {
    flex: 1,
  },
  roomHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  roomHeaderSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 1,
  },
  roomHeaderRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  roomActionIconBtn: {
    padding: 6,
  },

  /* Date Separator Pill */
  dateSeparatorWrap: {
    alignItems: 'center',
    marginVertical: 10,
  },
  dateSeparatorPill: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dateSeparatorText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
  },
});

// ── Styles ──

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
    padding: spacing.lg,
    paddingBottom: 100,
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
    backgroundColor: '#F8FAFC',
    position: 'relative',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 12,
    zIndex: 5,
    elevation: 3,
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
    backgroundColor: 'transparent',
    zIndex: 1,
  },
  messageListContent: {
    padding: spacing.md,
    flexGrow: 1,
  },

  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    zIndex: 2,
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
    zIndex: 2,
  },
  messageBubbleMine: {
    backgroundColor: '#1B3B2B',
    borderBottomRightRadius: 4,
  },
  messageBubbleOther: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
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
    overflow: 'visible',
  },
  messageImageOnly: {
    width: 220,
    height: 220,
    borderRadius: 16,
    marginBottom: 0,
    overflow: 'hidden',
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
    paddingTop: 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    zIndex: 5,
    elevation: 3,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1B3B2B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatSendBtnDisabled: {
    opacity: 0.5,
  },
  chatMicBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1B3B2B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF2F2',
    borderRadius: 24,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  recordingTrashBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingStatusWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF4444',
  },
  recordingDurationText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#DC2626',
  },
  recordingLabel: {
    fontSize: 13,
    color: '#991B1B',
    fontWeight: '500',
  },
  recordingSendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
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
  // Recalled Message Styling
  recalledBubble: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  recalledBubbleMine: {
    backgroundColor: '#F8FAFC',
  },
  recalledBubbleOther: {
    backgroundColor: '#F1F5F9',
  },
  recalledText: {
    fontSize: 13,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  // Image Viewer Download Button
  imageViewerDownloadBtn: {
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Long-press Action Sheet Modal
  actionModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  actionModalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 20,
  },
  reactionBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  reactionItem: {
    padding: 6,
    borderRadius: 20,
  },
  reactionEmoji: {
    fontSize: 26,
  },
  actionModalDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 6,
  },
  actionModalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 14,
  },
  actionModalIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionModalRowText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  actionModalRowSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  reactionItemActive: {
    backgroundColor: '#E0F2FE',
    transform: [{ scale: 1.15 }],
  },
  messageReactionBadge: {
    position: 'absolute',
    bottom: -8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 4,
    zIndex: 10,
  },
  messageReactionBadgeMine: {
    right: 8,
  },
  messageReactionBadgeOther: {
    right: 8,
  },
  messageReactionBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },

  messageBubbleWithReply: {
    minWidth: 190,
    maxWidth: '82%',
  },
  messageBubbleHighlightedMine: {
    borderColor: '#60A5FA',
    borderWidth: 2,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 10,
    elevation: 8,
  },
  messageBubbleHighlightedOther: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
    borderWidth: 2,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 10,
    elevation: 8,
  },

  /* Quote Block inside message bubble */
  quoteBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginBottom: 6,
    alignSelf: 'stretch',
    minWidth: 160,
    overflow: 'hidden',
  },
  quoteBlockMine: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  quoteBlockOther: {
    backgroundColor: '#F1F5F9',
  },
  quoteIndicator: {
    width: 3.5,
    borderRadius: 2,
    alignSelf: 'stretch',
  },
  quoteIndicatorMine: {
    backgroundColor: '#FFFFFF',
  },
  quoteIndicatorOther: {
    backgroundColor: '#1B3B2B',
  },
  quoteSender: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  quoteSenderMine: {
    color: '#FFFFFF',
  },
  quoteSenderOther: {
    color: '#1B3B2B',
  },
  quoteText: {
    fontSize: 13,
    lineHeight: 18,
  },
  quoteTextMine: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  quoteTextOther: {
    color: '#334155',
  },
  quoteThumb: {
    width: 38,
    height: 38,
    borderRadius: 6,
    marginLeft: 6,
  },

  /* Reply Preview Bar above input */
  replyPreviewBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 8,
    position: 'relative',
  },
  replyPreviewIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#1B3B2B',
  },
  replyPreviewSender: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1B3B2B',
  },
  replyPreviewText: {
    fontSize: 13,
    color: '#475569',
    marginTop: 2,
  },
  replyPreviewThumb: {
    width: 36,
    height: 36,
    borderRadius: 6,
    marginRight: 8,
  },
  replyPreviewCloseBtn: {
    padding: 4,
  },

  /* Zalo Action Grid */
  zaloActionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    paddingVertical: 12,
    gap: 8,
  },
  zaloActionBtn: {
    alignItems: 'center',
    width: '22%',
    paddingVertical: 6,
  },
  zaloActionIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  zaloActionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'center',
  },

  /* Detail Modal */
  detailModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  detailModalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '65%',
    paddingTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 20,
  },
  detailModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  detailModalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  detailSegmentedBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 10,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 3,
  },
  detailSegmentTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  detailSegmentTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  detailSegmentTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  detailSegmentTabTextActive: {
    color: '#2563EB',
    fontWeight: '700',
  },
  detailFilterBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  detailFilterPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
  },
  detailFilterPillActive: {
    backgroundColor: '#DBEAFE',
  },
  detailFilterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  detailFilterPillTextActive: {
    color: '#1D4ED8',
    fontWeight: '700',
  },
  detailUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  detailUserAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  detailUserAvatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  detailUserName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  detailUserCode: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },

  // Leader Directory Carousel & Modal Styles
  leadersSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingTop: 14,
    paddingBottom: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  leadersHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  leadersSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  leadersSeeAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563EB',
  },
  leadersCarousel: {
    paddingHorizontal: 12,
    gap: 10,
  },
  leaderCard: {
    width: 125,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  leaderAvatarContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  leaderAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  leaderAvatarFallback: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
  },
  leaderAvatarInitials: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4338CA',
  },
  leaderCrownBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#F59E0B',
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  leaderCardName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 4,
  },
  leaderDeptBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 8,
    maxWidth: '100%',
  },
  leaderDeptText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#2563EB',
    textAlign: 'center',
  },
  leaderMsgButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    width: '100%',
    justifyContent: 'center',
  },
  leaderMsgButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1D4ED8',
  },
  chatSectionTitleRow: {
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  chatSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  leaderModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  leaderModalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingTop: 16,
  },
  leaderModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  leaderModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  leaderModalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  leaderModalCloseBtn: {
    padding: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
  },
  leaderSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  leaderSearchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    padding: 0,
  },
  leaderListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  leaderListAvatarContainer: {
    position: 'relative',
  },
  leaderListAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  leaderListAvatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  leaderListAvatarInitials: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4338CA',
  },
  leaderCrownBadgeSmall: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#F59E0B',
    borderRadius: 8,
    width: 15,
    height: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  leaderListName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  leaderListDept: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '500',
  },
  leaderListBranch: {
    fontSize: 12,
    color: '#64748B',
  },
  leaderListActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Create Custom Group Styles (Admin)
  headerCreateGroupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  headerCreateGroupBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  createGroupNameContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  createGroupInputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  createGroupNameInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  createGroupNameInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    padding: 0,
  },
  deptFilterScroll: {
    paddingHorizontal: 16,
    gap: 8,
    paddingVertical: 6,
  },
  deptFilterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  deptFilterChipActive: {
    backgroundColor: '#DBEAFE',
    borderColor: '#93C5FD',
  },
  deptFilterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  deptFilterChipTextActive: {
    color: '#1D4ED8',
    fontWeight: '700',
  },
  selectedMembersSection: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
    backgroundColor: '#FAFAFA',
  },
  selectedMembersCount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 4,
  },
  selectedMemberChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 16,
    paddingLeft: 4,
    paddingRight: 8,
    paddingVertical: 3,
    gap: 5,
  },
  selectedMemberChipAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  selectedMemberChipFallback: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedMemberChipFallbackText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#4338CA',
  },
  selectedMemberChipName: {
    fontSize: 12,
    color: '#1E293B',
    maxWidth: 90,
  },
  selectedMemberChipRemove: {
    padding: 2,
  },
  memberSelectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  memberSelectRowActive: {
    backgroundColor: '#EFF6FF',
  },
  memberSelectCheckbox: {
    marginRight: 10,
  },
  memberSelectAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  memberSelectAvatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  memberSelectAvatarInitials: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4338CA',
  },
  memberSelectName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  memberSelectCode: {
    fontSize: 12,
    color: '#64748B',
  },
  memberSelectDept: {
    fontSize: 12,
    color: '#2563EB',
    marginTop: 2,
  },
  createGroupFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  createGroupSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  createGroupSubmitBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
  createGroupSubmitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
