import { useRouter } from 'expo-router';
import { useState, useCallback, useEffect, useRef, useMemo, type ReactNode } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Image,
  Platform,
  RefreshControl,
  TouchableOpacity,
  Keyboard,
  KeyboardAvoidingView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { assertSocketUrl } from '../../constants/env';
import { uploadFile } from '../../api/uploads.api';
import { EmptyState } from '../../components/EmptyState';
import { PageHeader } from '../../components/PageHeader';
import { PrimaryButton } from '../../components/Buttons';
import ImageView from '../../components/ImageViewer/ImageViewer';
import { FacebookPhotoGrid, type FacebookGridLayoutType } from './components/FacebookPhotoGrid';
import { Screen } from '../../components/Screen';
import { StatusBadge } from '../../components/StatusBadge';
import { useAuth } from '../../providers/AuthProvider';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { normalizeApiError } from '../../utils/api-error';
import { roleBase } from '../../utils/notification-routing';
import {
  useNewsfeedPosts,
  usePendingNewsfeedPosts,
  useApprovePost,
  useNewsfeedPost,
  useCreatePost,
  useLikePost,
  useAddComment,
  useReactComment,
  useDeletePost,
} from '../../hooks/useNewsfeed';
import type { NewsfeedPostDto, PostLikeDto, PostCommentDto } from '../../types/newsfeed.types';
import { useQueryClient } from '@tanstack/react-query';
import { useAppAlert } from '../../contexts/AlertContext';

// ── Helpers ──

const COMMENT_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

function getCommentReactionSummary(reactions?: Record<string, string> | null) {
  if (!reactions || typeof reactions !== 'object') return { total: 0, emojis: [] as string[] };
  const entries = Object.values(reactions).filter(Boolean);
  if (entries.length === 0) return { total: 0, emojis: [] as string[] };
  const countMap: Record<string, number> = {};
  for (const e of entries) {
    if (typeof e === 'string') {
      countMap[e] = (countMap[e] || 0) + 1;
    }
  }
  const emojis = Object.keys(countMap).sort((a, b) => (countMap[b] ?? 0) - (countMap[a] ?? 0)).slice(0, 3);
  return { total: entries.length, emojis };
}

function getReactionInfo(emoji?: string | null) {
  switch (emoji) {
    case '👍':
      return { label: 'Thích', color: '#2563EB', emoji: '👍' };
    case '❤️':
      return { label: 'Yêu thích', color: '#EF4444', emoji: '❤️' };
    case '😂':
      return { label: 'Haha', color: '#F59E0B', emoji: '😂' };
    case '😮':
      return { label: 'Wow', color: '#F59E0B', emoji: '😮' };
    case '😢':
      return { label: 'Buồn', color: '#F59E0B', emoji: '😢' };
    case '🔥':
      return { label: 'Tuyệt vời', color: '#EA580C', emoji: '🔥' };
    default:
      return { label: 'Thích', color: '#64748B', emoji: null };
  }
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

function resolveImageUrl(uri?: string | null): string | null {
  if (!uri) return null;
  if (uri.startsWith('http://') || uri.startsWith('https://')) return uri;
  const baseUrl = assertSocketUrl().replace(/\/$/, '');
  return `${baseUrl}${uri.startsWith('/') ? uri : `/${uri}`}`;
}

function getUserDisplayName(user: any): string {
  if (!user) return 'Ẩn danh';
  const isAdmin = user.roles?.some((r: any) => r.role?.code?.toUpperCase().includes('ADMIN'));
  if (isAdmin) return 'Admin';
  return user.profile?.fullName || user.userCode || 'Ẩn danh';
}

function getInitials(name: string): string {
  return name.split(' ').filter(Boolean).slice(-2).map(w => w[0]).join('').toUpperCase();
}

function extractPostLayout(post?: NewsfeedPostDto | null): FacebookGridLayoutType {
  if (post?.attachments && Array.isArray(post.attachments)) {
    const layoutTag = post.attachments.find((a) => typeof a === 'string' && a.startsWith('layout:'));
    if (layoutTag) {
      const type = layoutTag.replace('layout:', '').trim().toUpperCase() as FacebookGridLayoutType;
      if (type === 'CLASSIC' || type === 'COLUMN' || type === 'GRID' || type === 'CAROUSEL') {
        return type;
      }
    }
  }
  return 'CLASSIC';
}

// ── Newsfeed List Screen ──

export function NewsfeedListScreen({ canModerate = false }: { canModerate?: boolean }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { showAlert, showConfirm } = useAppAlert();
  
  const [activeTab, setActiveTab] = useState<'latest' | 'following'>('latest');
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerImages, setViewerImages] = useState<{ uri: string }[]>([]);

  const posts = useNewsfeedPosts();
  const pendingPostsQuery = usePendingNewsfeedPosts();
  const likePost = useLikePost();
  const removePost = useDeletePost();

  const isModerator = canModerate || user?.roles?.some((r: any) => {
    const code = typeof r === 'string' ? r : r.role?.code || r.name || '';
    const upper = String(code).toUpperCase();
    return upper.includes('ADMIN') || upper.includes('LEADER') || upper.includes('HR');
  });

  const pendingItems = Array.isArray(pendingPostsQuery.data)
    ? pendingPostsQuery.data
    : (pendingPostsQuery.data as any)?.items ?? [];
  const pendingCount = pendingItems.length;

  function confirmDelete(postId: string) {
    showConfirm({
      title: 'Xóa bài đăng',
      message: 'Bạn có chắc muốn xóa bài đăng này?',
      confirmLabel: 'Xóa',
      onConfirm: () => {
        removePost.mutate(postId, {
          onError: (error) => {
            const normalized = normalizeApiError(error);
            showAlert('Lỗi', normalized.message);
          },
        });
      },
    });
  }

  const postItems = Array.isArray(posts.data) ? posts.data : (posts.data as any)?.items ?? [];

  const displayedPosts = activeTab === 'following'
    ? postItems.filter((p: NewsfeedPostDto) => (p as any).isFollowing || (p as any).isBookmarked)
    : postItems;

  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries();
    setRefreshing(false);
  }, [queryClient]);

  return (
    <View style={newsStyles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1B3B2B" translucent={false} />

      {/* Header Container */}
      <View style={[newsStyles.headerWrap, { paddingTop: Math.max(insets.top, 16) + 4 }]}>
        <View style={newsStyles.headerTopRow}>
          <Text style={newsStyles.headerBrand}>MOVIE LEGEND</Text>
          {isModerator && (
            <Pressable
              style={newsStyles.pendingPill}
              onPress={() => {
                router.push(`${roleBase(user)}/newsfeed/pending` as any);
              }}
            >
              <MaterialCommunityIcons name="clock-outline" size={14} color="#FFFFFF" />
              <Text style={newsStyles.pendingPillText}>Chờ duyệt [{pendingCount}]</Text>
            </Pressable>
          )}
        </View>

        <Text style={newsStyles.headerTitle}>Bảng tin công ty</Text>
        <Text style={newsStyles.headerSubtitle}>Tin tức & thông báo nội bộ</Text>
      </View>

      {/* Main Curved White Sheet */}
      <View style={newsStyles.curvedSheet}>
        {/* Sub-tabs: Mới nhất & Theo dõi */}
        <View style={newsStyles.tabRow}>
          <Pressable
            style={newsStyles.tabItem}
            onPress={() => setActiveTab('latest')}
          >
            <MaterialCommunityIcons
              name="clock-outline"
              size={16}
              color={activeTab === 'latest' ? '#1B3B2B' : '#94A3B8'}
            />
            <Text style={[newsStyles.tabText, activeTab === 'latest' && newsStyles.tabTextActive]}>
              Mới nhất
            </Text>
            {activeTab === 'latest' && <View style={newsStyles.tabIndicator} />}
          </Pressable>

          <Pressable
            style={newsStyles.tabItem}
            onPress={() => setActiveTab('following')}
          >
            <MaterialCommunityIcons
              name="star-outline"
              size={16}
              color={activeTab === 'following' ? '#1B3B2B' : '#94A3B8'}
            />
            <Text style={[newsStyles.tabText, activeTab === 'following' && newsStyles.tabTextActive]}>
              Theo dõi
            </Text>
            {activeTab === 'following' && <View style={newsStyles.tabIndicator} />}
          </Pressable>
        </View>

        {/* Post List / Feed */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: Math.max(insets.bottom, 16) + 84,
          }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} tintColor="#1B3B2B" />
          }
          showsVerticalScrollIndicator={false}
        >
          {displayedPosts.length > 0 ? (
            <View style={{ gap: 14 }}>
              {displayedPosts.map((post: NewsfeedPostDto) => {
                const authorName = getUserDisplayName(post.author);
                const initials = getInitials(authorName);
                const likeCount = post._count?.likes ?? post.likes?.length ?? 0;
                const commentCount = post._count?.comments ?? post.comments?.length ?? 0;
                const isLiked = post.likes?.some((l: PostLikeDto) => l.userId === user?.id) ?? false;

                return (
                  <Pressable
                    key={post.id}
                    style={styles.postCard}
                    onPress={() => {
                      router.push(`${roleBase(user)}/newsfeed/${post.id}` as never);
                    }}
                  >
                    {/* Author row */}
                    <View style={styles.authorRow}>
                      <View style={newsStyles.avatarCircle}>
                        <Text style={newsStyles.avatarText}>{initials}</Text>
                      </View>
                      <View style={styles.authorInfo}>
                        <Text style={styles.authorName}>{authorName}</Text>
                        <Text style={styles.postTime}>{timeAgo(post.createdAt)}</Text>
                      </View>
                      {post.department && (
                        <StatusBadge label={post.department.name} tone="info" />
                      )}
                    </View>

                    {/* Title */}
                    {post.title ? (
                      <Text style={styles.postTitle}>{post.title}</Text>
                    ) : null}

                    {/* Content */}
                    <Text style={styles.postContent} numberOfLines={4}>
                      {post.content}
                    </Text>

                    {/* Images - Facebook Multi-Photo Grid */}
                    {post.images && post.images.length > 0 ? (
                      <FacebookPhotoGrid
                        images={post.images}
                        resolveUrl={resolveImageUrl}
                        layoutType={extractPostLayout(post)}
                      />
                    ) : null}

                    {/* Divider */}
                    <View style={styles.postDivider} />

                    {/* Actions row */}
                    <View style={styles.actionsRow}>
                      <Pressable
                        style={styles.actionItem}
                        onPress={(e) => {
                          e.stopPropagation?.();
                          likePost.mutate(post.id);
                        }}
                      >
                        <MaterialCommunityIcons
                          name={isLiked ? 'heart' : 'heart-outline'}
                          size={20}
                          color={isLiked ? '#EF4444' : '#64748B'}
                        />
                        <Text style={[styles.actionLabel, isLiked && { color: '#EF4444' }]}>
                          {likeCount}
                        </Text>
                      </Pressable>

                      <View style={styles.actionItem}>
                        <MaterialCommunityIcons
                          name="comment-outline"
                          size={20}
                          color="#64748B"
                        />
                        <Text style={styles.actionLabel}>{commentCount}</Text>
                      </View>

                      {isModerator && (
                        <Pressable
                          style={[styles.actionItem, styles.deleteAction]}
                          onPress={(e) => {
                            e.stopPropagation?.();
                            confirmDelete(post.id);
                          }}
                        >
                          <MaterialCommunityIcons name="trash-can-outline" size={20} color="#94A3B8" />
                        </Pressable>
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ) : !posts.isLoading ? (
            <View style={newsStyles.emptyWrap}>
              <View style={newsStyles.emptyIconCircle}>
                <MaterialCommunityIcons name="newspaper-variant-outline" size={48} color="#1B3B2B" />
              </View>
              <Text style={newsStyles.emptyTitle}>
                {activeTab === 'following' ? 'Chưa có bài viết theo dõi' : 'Chưa có bài đăng'}
              </Text>
              <Text style={newsStyles.emptySubtitle}>
                {activeTab === 'following'
                  ? 'Các bài viết từ đồng nghiệp theo dõi sẽ xuất hiện tại đây.'
                  : 'Chia sẻ thông tin đầu tiên với công ty.'}
              </Text>
              <Pressable
                style={newsStyles.createPostBtn}
                onPress={() => {
                  router.push(`${roleBase(user)}/newsfeed/create` as any);
                }}
              >
                <MaterialCommunityIcons name="plus" size={18} color="#FFFFFF" />
                <Text style={newsStyles.createPostBtnText}>Đăng bài</Text>
              </Pressable>
            </View>
          ) : null}
        </ScrollView>

        {/* Floating Add Post Button when list is populated */}
        {displayedPosts.length > 0 && (
          <Pressable
            style={[newsStyles.fabBtn, { bottom: Math.max(insets.bottom, 16) + 72 }]}
            onPress={() => {
              router.push(`${roleBase(user)}/newsfeed/create` as any);
            }}
          >
            <MaterialCommunityIcons name="pencil-outline" size={18} color="#FFFFFF" />
            <Text style={newsStyles.fabBtnText}>Đăng bài</Text>
          </Pressable>
        )}
      </View>

      <ImageView
        images={viewerImages}
        imageIndex={0}
        visible={viewerVisible}
        onRequestClose={() => setViewerVisible(false)}
      />
    </View>
  );
}

// ── Newsfeed Detail Screen ──

export function NewsfeedDetailScreen({ postId, canModerate = false }: { postId: string; canModerate?: boolean }) {
  const router = useRouter();
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerImages, setViewerImages] = useState<{ uri: string }[]>([]);
  const postQuery = useNewsfeedPost(postId);
  const likePostMutation = useLikePost();
  const addComment = useAddComment();
  const reactCommentMutation = useReactComment();
  const removePost = useDeletePost();
  const { user } = useAuth();
  const { showAlert, showConfirm } = useAppAlert();
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: string; authorName: string } | null>(null);
  const [reactionPickerCommentId, setReactionPickerCommentId] = useState<string | null>(null);
  const commentInputRef = useRef<TextInput>(null);
  const insets = useSafeAreaInsets();
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, () => {
      setIsKeyboardVisible(true);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  function confirmDelete() {
    showConfirm({
      title: 'Xóa bài đăng',
      message: 'Bạn có chắc muốn xóa bài đăng này?',
      confirmLabel: 'Xóa',
      onConfirm: () => {
        removePost.mutate(postId, {
          onSuccess: () => {
            router.back();
          },
          onError: (error) => {
            const normalized = normalizeApiError(error);
            showAlert('Lỗi', normalized.message);
          },
        });
      },
    });
  }

  const post = postQuery.data;

  if (postQuery.isLoading) {
    return (
      <View style={newsStyles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1B3B2B" translucent={false} />
        <View style={[newsStyles.headerWrap, { paddingTop: Math.max(insets.top, 16) + 4 }]}>
          <View style={newsStyles.headerRow}>
            <Pressable style={newsStyles.backBtn} onPress={() => router.back()} hitSlop={10}>
              <MaterialCommunityIcons name="chevron-left" size={28} color="#FFFFFF" />
            </Pressable>
            <View style={newsStyles.headerTextWrap}>
              <Text style={newsStyles.headerTitleInline}>Chi tiết bài đăng</Text>
            </View>
          </View>
        </View>
        <View style={[newsStyles.curvedSheetWhite, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator color="#1B3B2B" size="large" />
        </View>
      </View>
    );
  }

  if (!post) {
    return (
      <View style={newsStyles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1B3B2B" translucent={false} />
        <View style={[newsStyles.headerWrap, { paddingTop: Math.max(insets.top, 16) + 4 }]}>
          <View style={newsStyles.headerRow}>
            <Pressable style={newsStyles.backBtn} onPress={() => router.back()} hitSlop={10}>
              <MaterialCommunityIcons name="chevron-left" size={28} color="#FFFFFF" />
            </Pressable>
            <View style={newsStyles.headerTextWrap}>
              <Text style={newsStyles.headerTitleInline}>Chi tiết bài đăng</Text>
            </View>
          </View>
        </View>
        <View style={newsStyles.curvedSheetWhite}>
          <View style={newsStyles.emptyWrap}>
            <EmptyState title="Không tìm thấy bài đăng" />
          </View>
        </View>
      </View>
    );
  }

  const comments: PostCommentDto[] = (post.comments as any) ?? [];

  const totalCommentsCount = comments.reduce((sum, c) => sum + 1 + (c.replies?.length ?? 0), 0);

  const authorName = getUserDisplayName(post.author);
  const likedNames = post.likes?.map((l: any) => getUserDisplayName(l.user)).filter(Boolean) || [];

  function handleStartReply(targetCommentId: string, targetAuthorName: string) {
    setReplyingTo({ id: targetCommentId, authorName: targetAuthorName });
    setTimeout(() => {
      commentInputRef.current?.focus();
    }, 100);
  }

  function handleCancelReply() {
    setReplyingTo(null);
  }

  function handleToggleOrReact(commentId: string, currentEmoji?: string | null) {
    if (currentEmoji) {
      reactCommentMutation.mutate({ postId, commentId, emoji: currentEmoji });
    } else {
      reactCommentMutation.mutate({ postId, commentId, emoji: '👍' });
    }
  }

  function handleSelectReaction(commentId: string, emoji: string) {
    setReactionPickerCommentId(null);
    reactCommentMutation.mutate({ postId, commentId, emoji });
  }

  async function handleComment() {
    if (!commentText.trim()) return;
    try {
      await addComment.mutateAsync({
        postId,
        content: commentText.trim(),
        parentId: replyingTo?.id,
      });
      setCommentText('');
      setReplyingTo(null);
      postQuery.refetch();
    } catch (error) {
      const normalized = normalizeApiError(error);
      showAlert('Lỗi', normalized.message);
    }
  }

  return (
    <View style={newsStyles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1B3B2B" translucent={false} />

      {/* Header Container */}
      <View style={[newsStyles.headerWrap, { paddingTop: Math.max(insets.top, 16) + 4 }]}>
        <View style={newsStyles.headerRow}>
          <Pressable style={newsStyles.backBtn} onPress={() => router.back()} hitSlop={10}>
            <MaterialCommunityIcons name="chevron-left" size={28} color="#FFFFFF" />
          </Pressable>
          <View style={newsStyles.headerTextWrap}>
            <Text style={newsStyles.headerTitleInline}>Chi tiết bài đăng</Text>
            <Text style={newsStyles.headerSubtitleInline}>Bình luận & tương tác</Text>
          </View>
          {canModerate && (
            <Pressable style={newsStyles.headerIconBtn} onPress={confirmDelete} hitSlop={10}>
              <MaterialCommunityIcons name="trash-can-outline" size={22} color="#FFFFFF" />
            </Pressable>
          )}
        </View>
      </View>

      {/* Main Curved White Sheet */}
      <View style={newsStyles.curvedSheetWhite}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
          enabled={Platform.OS === 'ios' ? true : isKeyboardVisible}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            style={{ flex: 1 }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
          >
          <View style={styles.postCard}>
            <View style={styles.authorRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getInitials(authorName)}</Text>
              </View>
              <View style={styles.authorInfo}>
                <Text style={styles.authorName}>{authorName}</Text>
                <Text style={styles.postTime}>{timeAgo(post.createdAt)}</Text>
              </View>
            </View>

            {post.title ? <Text style={styles.postTitle}>{post.title}</Text> : null}
            <Text style={styles.postContentFull}>{post.content}</Text>

            {/* Images - Facebook Multi-Photo Grid */}
            {(post as any).images && (post as any).images.length > 0 ? (
              <FacebookPhotoGrid
                images={(post as any).images}
                resolveUrl={resolveImageUrl}
                layoutType={extractPostLayout(post as any)}
              />
            ) : null}

            <View style={styles.postDivider} />
            <View style={styles.actionsRow}>
              <Pressable
                style={styles.actionItem}
                onPress={() => likePostMutation.mutate(post.id)}
              >
                <MaterialCommunityIcons name="heart-outline" size={20} color={colors.muted} />
                <Text style={styles.actionLabel}>{post._count?.likes ?? post.likes?.length ?? 0}</Text>
              </Pressable>
              <View style={styles.actionItem}>
                <MaterialCommunityIcons name="comment-outline" size={20} color={colors.muted} />
                <Text style={styles.actionLabel}>{totalCommentsCount}</Text>
              </View>
            </View>

            {likedNames.length > 0 && (
              <View style={{ marginTop: spacing.md, flexDirection: 'row', alignItems: 'flex-start' }}>
                <MaterialCommunityIcons name="heart" size={16} color="#111827" style={{ marginRight: 6, marginTop: 2 }} />
                <Text style={{ fontSize: 13, color: colors.text, flex: 1, lineHeight: 20 }}>
                  Thích bởi <Text style={{ fontWeight: '600' }}>{likedNames.join(', ')}</Text>
                </Text>
              </View>
            )}
          </View>

          {/* Comments section */}
          <View style={styles.commentsSection}>
            <Text style={styles.commentsTitle}>
              Bình luận ({totalCommentsCount})
            </Text>

            {comments.map((c: PostCommentDto) => {
              const cName = getUserDisplayName(c.author);
              const replies = c.replies ?? [];
              const myEmoji = user?.id ? (c.reactions?.[user.id] ?? null) : null;
              const reactionInfo = getReactionInfo(myEmoji);
              const summary = getCommentReactionSummary(c.reactions);

              return (
                <View key={c.id} style={styles.commentThread}>
                  {/* Parent comment */}
                  <View style={styles.commentCard}>
                    <View style={styles.commentAvatar}>
                      <Text style={styles.commentAvatarText}>{getInitials(cName)}</Text>
                    </View>
                    <View style={styles.commentBody}>
                      <View style={[styles.commentBubble, summary.total > 0 && styles.commentBubbleWithReactions]}>
                        <Text style={styles.commentAuthor}>{cName}</Text>
                        <Text style={styles.commentContent}>{c.content}</Text>
                        {summary.total > 0 && (
                          <TouchableOpacity
                            style={styles.commentReactionBadge}
                            activeOpacity={0.8}
                            onPress={() => setReactionPickerCommentId(c.id)}
                          >
                            <Text style={styles.commentReactionEmojis}>{summary.emojis.join('')}</Text>
                            <Text style={styles.commentReactionCount}>{summary.total}</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                      <View style={styles.commentActionRow}>
                        <Text style={styles.commentTime}>{timeAgo(c.createdAt)}</Text>
                        <TouchableOpacity
                          onPress={() => handleToggleOrReact(c.id, myEmoji)}
                          onLongPress={() => setReactionPickerCommentId(c.id)}
                          delayLongPress={250}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          style={styles.commentActionBtn}
                        >
                          <Text style={[styles.commentActionBtnText, { color: reactionInfo.color }]}>
                            {reactionInfo.label}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleStartReply(c.id, cName)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Text style={styles.commentReplyBtn}>Trả lời</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>

                  {/* Sub-replies */}
                  {replies.length > 0 && (
                    <View style={styles.repliesContainer}>
                      {replies.map((reply: PostCommentDto) => {
                        const replyName = getUserDisplayName(reply.author);
                        const replyMyEmoji = user?.id ? (reply.reactions?.[user.id] ?? null) : null;
                        const replyReactionInfo = getReactionInfo(replyMyEmoji);
                        const replySummary = getCommentReactionSummary(reply.reactions);

                        return (
                          <View key={reply.id} style={styles.replyCard}>
                            <View style={styles.replyAvatar}>
                              <Text style={styles.replyAvatarText}>{getInitials(replyName)}</Text>
                            </View>
                            <View style={styles.replyBody}>
                              <View style={[styles.replyBubble, replySummary.total > 0 && styles.commentBubbleWithReactions]}>
                                <Text style={styles.commentAuthor}>{replyName}</Text>
                                <Text style={styles.commentContent}>{reply.content}</Text>
                                {replySummary.total > 0 && (
                                  <TouchableOpacity
                                    style={styles.commentReactionBadge}
                                    activeOpacity={0.8}
                                    onPress={() => setReactionPickerCommentId(reply.id)}
                                  >
                                    <Text style={styles.commentReactionEmojis}>{replySummary.emojis.join('')}</Text>
                                    <Text style={styles.commentReactionCount}>{replySummary.total}</Text>
                                  </TouchableOpacity>
                                )}
                              </View>
                              <View style={styles.commentActionRow}>
                                <Text style={styles.commentTime}>{timeAgo(reply.createdAt)}</Text>
                                <TouchableOpacity
                                  onPress={() => handleToggleOrReact(reply.id, replyMyEmoji)}
                                  onLongPress={() => setReactionPickerCommentId(reply.id)}
                                  delayLongPress={250}
                                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                  style={styles.commentActionBtn}
                                >
                                  <Text style={[styles.commentActionBtnText, { color: replyReactionInfo.color }]}>
                                    {replyReactionInfo.label}
                                  </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                  onPress={() => handleStartReply(c.id, replyName)}
                                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                >
                                  <Text style={styles.commentReplyBtn}>Trả lời</Text>
                                </TouchableOpacity>
                              </View>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>
              );
            })}

            {comments.length === 0 && (
              <Text style={styles.noComments}>Chưa có bình luận nào</Text>
            )}
          </View>
        </ScrollView>

        {/* Comment input area */}
        <View
          style={[
            styles.commentInputContainer,
            {
              marginBottom: isKeyboardVisible
                ? (Platform.OS === 'ios' ? 8 : 10)
                : Math.max(insets.bottom, 12),
            },
          ]}
        >
          {replyingTo && (
            <View style={styles.replyingBanner}>
              <View style={styles.replyingBannerLeft}>
                <MaterialCommunityIcons name="reply" size={16} color="#2563EB" />
                <Text style={styles.replyingBannerText} numberOfLines={1}>
                  Đang trả lời <Text style={{ fontWeight: '700' }}>@{replyingTo.authorName}</Text>
                </Text>
              </View>
              <TouchableOpacity onPress={handleCancelReply} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <MaterialCommunityIcons name="close" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.commentInputRow}>
            <TextInput
              ref={commentInputRef}
              style={styles.commentInput}
              placeholder={replyingTo ? `Trả lời @${replyingTo.authorName}...` : 'Viết bình luận...'}
              placeholderTextColor={colors.muted}
              value={commentText}
              onChangeText={setCommentText}
              multiline
            />
            <Pressable
              style={[styles.sendBtn, !commentText.trim() && styles.sendBtnDisabled]}
              onPress={handleComment}
              disabled={!commentText.trim() || addComment.isPending}
            >
              <MaterialCommunityIcons name="send" size={20} color="#fff" />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Floating Reaction Picker Modal */}
      <Modal
        visible={!!reactionPickerCommentId}
        transparent
        animationType="fade"
        onRequestClose={() => setReactionPickerCommentId(null)}
      >
        <Pressable
          style={styles.reactionModalBackdrop}
          onPress={() => setReactionPickerCommentId(null)}
        >
          <Pressable style={styles.reactionBarCard} onPress={(e) => e.stopPropagation?.()}>
            <Text style={styles.reactionBarTitle}>Bày tỏ cảm xúc</Text>
            <View style={styles.reactionBar}>
              {COMMENT_REACTIONS.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  style={styles.reactionItem}
                  onPress={() => {
                    if (reactionPickerCommentId) {
                      handleSelectReaction(reactionPickerCommentId, emoji);
                    }
                  }}
                >
                  <Text style={styles.reactionEmoji}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <ImageView
        images={viewerImages}
        imageIndex={0}
        visible={viewerVisible}
        onRequestClose={() => setViewerVisible(false)}
      />
      </View>
    </View>
  );
}

// ── Create Post Screen ──

export function CreatePostScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const createPost = useCreatePost();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [selectedLayout, setSelectedLayout] = useState<FacebookGridLayoutType>('CLASSIC');
  const [uploading, setUploading] = useState(false);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const { showAlert } = useAppAlert();

  async function pickImages() {
    let assetsToUpload: Array<{ uri: string; name: string; mimeType: string }> = [];

    if (Platform.OS === 'web') {
      const picked = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true, type: 'image/*', multiple: true });
      if (picked.canceled || !picked.assets?.length) return;
      assetsToUpload = picked.assets.map((file) => ({
        uri: file.uri,
        name: file.name,
        mimeType: file.mimeType ?? 'image/jpeg',
      }));
    } else {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.9,
      });

      if (result.canceled || !result.assets?.length) return;
      assetsToUpload = result.assets.map((asset) => ({
        uri: asset.uri,
        name: asset.fileName ?? `image_${Date.now()}_${Math.random().toString(36).substring(2, 6)}.jpg`,
        mimeType: asset.mimeType ?? 'image/jpeg',
      }));
    }

    setUploading(true);
    try {
      const uploadPromises = assetsToUpload.map((item) =>
        uploadFile({
          uri: item.uri,
          name: item.name,
          mimeType: item.mimeType,
          purpose: 'TASK_ATTACHMENT',
        })
      );
      const results = await Promise.all(uploadPromises);
      const newUrls = results.map((r) => r.fileUrl);
      setImages((prev) => [...prev, ...newUrls]);
    } catch (error) {
      const normalized = normalizeApiError(error);
      showAlert('Lỗi', normalized.message);
    } finally {
      setUploading(false);
    }
  }

  function handleRemoveImage(indexToRemove: number) {
    setImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  }

  function handleSetPrimaryImage(indexToPrimary: number) {
    if (indexToPrimary === 0) return;
    setImages((prev) => {
      const next = [...prev];
      const [selected] = next.splice(indexToPrimary, 1);
      if (selected) next.unshift(selected);
      return next;
    });
  }

  function handlePreviewImage(index: number) {
    setViewerIndex(index);
    setViewerVisible(true);
  }

  async function submit() {
    if (!content.trim()) {
      showAlert('Lỗi', 'Nội dung bài đăng không được để trống');
      return;
    }
    try {
      await createPost.mutateAsync({
        title: title.trim() || '',
        content: content.trim(),
        ...(images.length > 0 ? { images } : {}),
        attachments: [`layout:${selectedLayout}`],
      } as any);
      showAlert('Thành công', 'Đã đăng bài mới');
      router.back();
    } catch (error) {
      const normalized = normalizeApiError(error);
      showAlert('Lỗi', normalized.message);
    }
  }

  return (
    <View style={newsStyles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1B3B2B" translucent={false} />

      {/* Header Container */}
      <View style={[newsStyles.headerWrap, { paddingTop: Math.max(insets.top, 16) + 4 }]}>
        <View style={newsStyles.headerRow}>
          <Pressable style={newsStyles.backBtn} onPress={() => router.back()} hitSlop={10}>
            <MaterialCommunityIcons name="chevron-left" size={28} color="#FFFFFF" />
          </Pressable>
          <View style={newsStyles.headerTextWrap}>
            <Text style={newsStyles.headerTitleInline}>Đăng bài mới</Text>
            <Text style={newsStyles.headerSubtitleInline}>Chia sẻ thông tin với công ty</Text>
          </View>
        </View>
      </View>

      {/* Main Curved White Sheet */}
      <View style={newsStyles.curvedSheetWhite}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 20, paddingBottom: 24 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={newsStyles.sectionTitle}>Nội dung bài đăng</Text>

            <View style={newsStyles.fieldGroup}>
              <Text style={newsStyles.fieldLabel}>Tiêu đề (không bắt buộc)</Text>
              <TextInput
                style={newsStyles.input}
                placeholder="Nhập tiêu đề bài đăng"
                placeholderTextColor="#94A3B8"
                value={title}
                onChangeText={setTitle}
              />
            </View>

            <View style={newsStyles.fieldGroup}>
              <Text style={newsStyles.fieldLabel}>Nội dung</Text>
              <TextInput
                style={[newsStyles.input, newsStyles.textArea]}
                placeholder="Bạn muốn chia sẻ điều gì?"
                placeholderTextColor="#94A3B8"
                value={content}
                onChangeText={setContent}
                multiline
                numberOfLines={6}
              />
            </View>

            <View style={newsStyles.fieldGroup}>
              <Text style={newsStyles.fieldLabel}>
                Hình ảnh {images.length > 0 ? `(${images.length})` : ''}
              </Text>

              <Pressable
                style={newsStyles.dropzone}
                onPress={() => void pickImages()}
                disabled={uploading}
              >
                <View style={newsStyles.dropzoneIconWrap}>
                  <MaterialCommunityIcons name="image-outline" size={24} color="#1B3B2B" />
                </View>
                <Text style={newsStyles.dropzoneText}>
                  {uploading
                    ? 'Đang tải ảnh lên...'
                    : images.length > 0
                    ? '+ Thêm hình ảnh khác'
                    : 'Thêm hình ảnh'}
                </Text>
              </Pressable>

              {images.length >= 2 && (
                <View style={styles.layoutSelectorCard}>
                  <View style={styles.layoutSelectorHeader}>
                    <MaterialCommunityIcons name="view-dashboard-variant-outline" size={18} color="#0F172A" />
                    <Text style={styles.layoutSelectorTitle}>Bố cục hiển thị (Facebook style):</Text>
                  </View>

                  <View style={styles.layoutChipsRow}>
                    <Pressable
                      style={[
                        styles.layoutChip,
                        selectedLayout === 'CLASSIC' && styles.layoutChipActive,
                      ]}
                      onPress={() => setSelectedLayout('CLASSIC')}
                    >
                      <MaterialCommunityIcons
                        name="view-agenda-outline"
                        size={18}
                        color={selectedLayout === 'CLASSIC' ? '#FFFFFF' : '#334155'}
                      />
                      <Text
                        style={[
                          styles.layoutChipText,
                          selectedLayout === 'CLASSIC' && styles.layoutChipTextActive,
                        ]}
                      >
                        Cổ điển
                      </Text>
                    </Pressable>

                    <Pressable
                      style={[
                        styles.layoutChip,
                        selectedLayout === 'COLUMN' && styles.layoutChipActive,
                      ]}
                      onPress={() => setSelectedLayout('COLUMN')}
                    >
                      <MaterialCommunityIcons
                        name="view-split-vertical"
                        size={18}
                        color={selectedLayout === 'COLUMN' ? '#FFFFFF' : '#334155'}
                      />
                      <Text
                        style={[
                          styles.layoutChipText,
                          selectedLayout === 'COLUMN' && styles.layoutChipTextActive,
                        ]}
                      >
                        Cột dọc
                      </Text>
                    </Pressable>

                    <Pressable
                      style={[
                        styles.layoutChip,
                        selectedLayout === 'GRID' && styles.layoutChipActive,
                      ]}
                      onPress={() => setSelectedLayout('GRID')}
                    >
                      <MaterialCommunityIcons
                        name="view-grid-outline"
                        size={18}
                        color={selectedLayout === 'GRID' ? '#FFFFFF' : '#334155'}
                      />
                      <Text
                        style={[
                          styles.layoutChipText,
                          selectedLayout === 'GRID' && styles.layoutChipTextActive,
                        ]}
                      >
                        Lưới đều
                      </Text>
                    </Pressable>

                    <Pressable
                      style={[
                        styles.layoutChip,
                        selectedLayout === 'CAROUSEL' && styles.layoutChipActive,
                      ]}
                      onPress={() => setSelectedLayout('CAROUSEL')}
                    >
                      <MaterialCommunityIcons
                        name="view-carousel-outline"
                        size={18}
                        color={selectedLayout === 'CAROUSEL' ? '#FFFFFF' : '#334155'}
                      />
                      <Text
                        style={[
                          styles.layoutChipText,
                          selectedLayout === 'CAROUSEL' && styles.layoutChipTextActive,
                        ]}
                      >
                        Trình chiếu
                      </Text>
                    </Pressable>
                  </View>
                </View>
              )}

              {images.length > 0 && (
                <View style={{ marginTop: 12 }}>
                  <View style={styles.previewHeaderRow}>
                    <Text style={styles.previewHeaderLabel}>Xem trước bố cục ({images.length} ảnh):</Text>
                    <Text style={styles.previewHintText}>Chạm ảnh để phóng to</Text>
                  </View>
                  <FacebookPhotoGrid
                    images={images}
                    resolveUrl={resolveImageUrl}
                    showDeleteButton={true}
                    onDeleteImage={handleRemoveImage}
                    layoutType={selectedLayout}
                  />

                  {images.length > 1 && (
                    <View style={styles.thumbnailStripSection}>
                      <Text style={styles.thumbnailStripTitle}>
                        Quản lý thứ tự ảnh (Chạm ⭐ để chọn làm ảnh chính/ảnh bìa):
                      </Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbnailStrip}>
                        {images.map((img, idx) => (
                          <View key={`thumb-${idx}`} style={styles.thumbnailItemWrapper}>
                            <Image source={{ uri: resolveImageUrl(img) || img }} style={styles.thumbnailImg} />
                            {idx === 0 ? (
                              <View style={styles.primaryBadge}>
                                <Text style={styles.primaryBadgeText}>Ảnh chính</Text>
                              </View>
                            ) : (
                              <Pressable
                                style={styles.setPrimaryBtn}
                                onPress={() => handleSetPrimaryImage(idx)}
                              >
                                <MaterialCommunityIcons name="star-outline" size={12} color="#FFFFFF" />
                                <Text style={styles.setPrimaryBtnText}>Làm ảnh chính</Text>
                              </Pressable>
                            )}
                            <Pressable
                              style={styles.thumbDeleteBtn}
                              onPress={() => handleRemoveImage(idx)}
                            >
                              <MaterialCommunityIcons name="close" size={12} color="#FFFFFF" />
                            </Pressable>
                          </View>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
              )}
            </View>
          </ScrollView>

          {/* Fixed Submit Button */}
          <View style={[newsStyles.fixedFooter, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
            <Pressable
              style={[
                newsStyles.primarySubmitBtn,
                (uploading || createPost.isPending) && newsStyles.btnDisabled,
              ]}
              onPress={() => void submit()}
              disabled={uploading || createPost.isPending}
            >
              {createPost.isPending || uploading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <MaterialCommunityIcons name="send" size={18} color="#FFFFFF" />
                  <Text style={newsStyles.primarySubmitBtnText}>Đăng bài</Text>
                </>
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

// ── Pending Newsfeed List Screen ──

export function PendingNewsfeedListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const posts = usePendingNewsfeedPosts();
  const approvePost = useApprovePost();
  const { showAlert, showConfirm } = useAppAlert();

  const postItems = Array.isArray(posts.data) ? posts.data : (posts.data as any)?.items ?? [];

  const { user } = useAuth();

  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries();
    setRefreshing(false);
  }, [queryClient]);

  function handleQuickApprove(postId: string) {
    showConfirm({
      title: 'Duyệt bài đăng',
      message: 'Bạn có chắc muốn phê duyệt bài đăng này lên bảng tin?',
      confirmLabel: 'Duyệt bài',
      onConfirm: () => {
        approvePost.mutate(
          { postId, status: 'APPROVED' },
          {
            onSuccess: () => {
              showAlert('Thành công', 'Đã duyệt bài đăng');
            },
            onError: (error) => {
              showAlert('Lỗi', normalizeApiError(error).message);
            },
          }
        );
      },
    });
  }

  function handleQuickReject(postId: string) {
    showConfirm({
      title: 'Từ chối bài đăng',
      message: 'Bạn có chắc muốn từ chối bài đăng này?',
      confirmLabel: 'Từ chối',
      onConfirm: () => {
        approvePost.mutate(
          { postId, status: 'REJECTED' },
          {
            onSuccess: () => {
              showAlert('Thành công', 'Đã từ chối bài đăng');
            },
            onError: (error) => {
              showAlert('Lỗi', normalizeApiError(error).message);
            },
          }
        );
      },
    });
  }

  return (
    <View style={newsStyles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1B3B2B" translucent={false} />

      {/* Header Container */}
      <View style={[newsStyles.headerWrap, { paddingTop: Math.max(insets.top, 16) + 4 }]}>
        <View style={newsStyles.headerRow}>
          <Pressable style={newsStyles.backBtn} onPress={() => router.back()} hitSlop={10}>
            <MaterialCommunityIcons name="chevron-left" size={28} color="#FFFFFF" />
          </Pressable>
          <View style={newsStyles.headerTextWrap}>
            <Text style={newsStyles.headerTitleInline}>Bài đăng chờ duyệt</Text>
            <Text style={newsStyles.headerSubtitleInline}>Các bài đăng từ nhân viên</Text>
          </View>
        </View>
      </View>

      {/* Main Curved White Sheet */}
      <View style={newsStyles.curvedSheet}>
        <View style={newsStyles.pendingListHeader}>
          <Text style={newsStyles.pendingListTitle}>Danh sách chờ duyệt</Text>
          <Text style={newsStyles.pendingListCount}>{postItems.length} bài đăng</Text>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 8,
            paddingBottom: Math.max(insets.bottom, 16) + 24,
          }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} tintColor="#1B3B2B" />
          }
          showsVerticalScrollIndicator={false}
        >
          {postItems.length > 0 ? (
            <View style={{ gap: 14 }}>
              {postItems.map((post: NewsfeedPostDto) => {
                const authorName = getUserDisplayName(post.author);
                const initials = getInitials(authorName);

                return (
                  <Pressable
                    key={post.id}
                    style={newsStyles.pendingCard}
                    onPress={() => {
                      router.push(`${roleBase(user)}/newsfeed/pending/${post.id}` as any);
                    }}
                  >
                    <View style={styles.authorRow}>
                      <View style={newsStyles.avatarCircle}>
                        <Text style={newsStyles.avatarText}>{initials}</Text>
                      </View>
                      <View style={styles.authorInfo}>
                        <Text style={styles.authorName}>{authorName}</Text>
                        <Text style={styles.postTime}>{timeAgo(post.createdAt)}</Text>
                      </View>
                      <View style={newsStyles.pendingStatusBadge}>
                        <Text style={newsStyles.pendingStatusBadgeText}>Chờ duyệt</Text>
                      </View>
                    </View>

                    {post.title ? (
                      <Text style={styles.postTitle}>{post.title}</Text>
                    ) : null}
                    <Text style={styles.postContent} numberOfLines={3}>
                      {post.content}
                    </Text>

                    {post.images && post.images.length > 0 ? (
                      <View style={{ marginTop: 10 }}>
                        <FacebookPhotoGrid
                          images={post.images}
                          resolveUrl={resolveImageUrl}
                          layoutType={extractPostLayout(post)}
                        />
                      </View>
                    ) : null}

                    <View style={newsStyles.cardDivider} />

                    <View style={newsStyles.pendingCardActions}>
                      <Pressable
                        style={newsStyles.rejectBtn}
                        onPress={(e) => {
                          e.stopPropagation?.();
                          handleQuickReject(post.id);
                        }}
                      >
                        <MaterialCommunityIcons name="close" size={16} color="#DC2626" />
                        <Text style={newsStyles.rejectBtnText}>Từ chối</Text>
                      </Pressable>
                      <Pressable
                        style={newsStyles.approveBtn}
                        onPress={(e) => {
                          e.stopPropagation?.();
                          handleQuickApprove(post.id);
                        }}
                      >
                        <MaterialCommunityIcons name="check" size={16} color="#FFFFFF" />
                        <Text style={newsStyles.approveBtnText}>Duyệt bài</Text>
                      </Pressable>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ) : !posts.isLoading ? (
            <View style={newsStyles.emptyWrap}>
              <View style={newsStyles.emptyIconCircle}>
                <MaterialCommunityIcons name="file-document-check-outline" size={48} color="#1B3B2B" />
              </View>
              <Text style={newsStyles.emptyTitle}>Không có bài viết chờ duyệt</Text>
              <Text style={newsStyles.emptySubtitle}>Bài viết cần phê duyệt sẽ hiển thị tại đây.</Text>
              <Pressable
                style={newsStyles.outlineBackBtn}
                onPress={() => router.back()}
              >
                <MaterialCommunityIcons name="arrow-left" size={16} color="#0F172A" />
                <Text style={newsStyles.outlineBackBtnText}>Về bảng tin</Text>
              </Pressable>
            </View>
          ) : null}
        </ScrollView>
      </View>
    </View>
  );
}

// ── Pending Newsfeed Detail Screen ──

export function PendingNewsfeedDetailScreen({ postId }: { postId: string }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const base = roleBase(user);
  
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerImages, setViewerImages] = useState<{ uri: string }[]>([]);

  const postQuery = useNewsfeedPost(postId);
  const approvePost = useApprovePost();
  const { showAlert, showConfirm } = useAppAlert();

  // If already approved, redirect to normal detail view
  useEffect(() => {
    if (postQuery.data && postQuery.data.status === 'APPROVED') {
      router.replace(`${base}/newsfeed/${postId}` as any);
    }
  }, [postQuery.data?.status, postId, router, base]);

  function handleApprove() {
    showConfirm({
      title: 'Duyệt bài',
      message: 'Cho phép hiển thị bài đăng này trên bảng tin?',
      confirmLabel: 'Duyệt',
      onConfirm: () => {
        approvePost.mutate({ postId, status: 'APPROVED' }, {
          onSuccess: () => router.replace(`${base}/newsfeed/${postId}` as any),
          onError: (error) => {
            showAlert('Lỗi', normalizeApiError(error).message);
          }
        });
      }
    });
  }

  function handleReject() {
    showConfirm({
      title: 'Từ chối bài',
      message: 'Bạn có chắc chắn muốn từ chối bài đăng này?',
      confirmLabel: 'Từ chối',
      onConfirm: () => {
        approvePost.mutate({ postId, status: 'REJECTED' }, {
          onSuccess: () => router.back(),
          onError: (error) => {
            showAlert('Lỗi', normalizeApiError(error).message);
          }
        });
      }
    });
  }

  const post = postQuery.data;

  return (
    <View style={newsStyles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1B3B2B" translucent={false} />

      {/* Header Container */}
      <View style={[newsStyles.headerWrap, { paddingTop: Math.max(insets.top, 16) + 4 }]}>
        <View style={newsStyles.headerRow}>
          <Pressable style={newsStyles.backBtn} onPress={() => router.back()} hitSlop={10}>
            <MaterialCommunityIcons name="chevron-left" size={28} color="#FFFFFF" />
          </Pressable>
          <View style={newsStyles.headerTextWrap}>
            <Text style={newsStyles.headerTitleInline}>Chi tiết bài viết</Text>
            <Text style={newsStyles.headerSubtitleInline}>Phê duyệt hoặc từ chối bài đăng</Text>
          </View>
        </View>
      </View>

      {/* Main Curved White Sheet */}
      <View style={newsStyles.curvedSheetWhite}>
        {postQuery.isLoading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator color="#1B3B2B" size="large" />
          </View>
        ) : !post ? (
          <View style={newsStyles.emptyWrap}>
            <EmptyState title="Không tìm thấy bài đăng" />
          </View>
        ) : (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 20, paddingBottom: Math.max(insets.bottom, 16) + 24 }}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.postCard}>
              <View style={styles.authorRow}>
                <View style={newsStyles.avatarCircle}>
                  <Text style={newsStyles.avatarText}>{getInitials(getUserDisplayName(post.author))}</Text>
                </View>
                <View style={styles.authorInfo}>
                  <Text style={styles.authorName}>{getUserDisplayName(post.author)}</Text>
                  <Text style={styles.postTime}>{timeAgo(post.createdAt)}</Text>
                </View>
                <View style={newsStyles.pendingStatusBadge}>
                  <Text style={newsStyles.pendingStatusBadgeText}>{post.status || 'Chờ duyệt'}</Text>
                </View>
              </View>

              {post.title ? <Text style={styles.postTitle}>{post.title}</Text> : null}
              <Text style={styles.postContentFull}>{post.content}</Text>

              {/* Images - Facebook Multi-Photo Grid */}
              {(post as any).images && (post as any).images.length > 0 ? (
                <FacebookPhotoGrid
                  images={(post as any).images}
                  resolveUrl={resolveImageUrl}
                  layoutType={extractPostLayout(post as any)}
                />
              ) : null}

              <View style={styles.postDivider} />
              
              {post.status === 'PENDING' && (
                <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
                  <Pressable
                    style={newsStyles.rejectBtn}
                    onPress={handleReject}
                  >
                    <MaterialCommunityIcons name="close" size={16} color="#DC2626" />
                    <Text style={newsStyles.rejectBtnText}>Từ chối</Text>
                  </Pressable>
                  <Pressable
                    style={newsStyles.approveBtn}
                    onPress={handleApprove}
                  >
                    <MaterialCommunityIcons name="check" size={16} color="#FFFFFF" />
                    <Text style={newsStyles.approveBtnText}>Duyệt bài</Text>
                  </Pressable>
                </View>
              )}
            </View>
          </ScrollView>
        )}
      </View>

      <ImageView
        images={viewerImages}
        imageIndex={0}
        visible={viewerVisible}
        onRequestClose={() => setViewerVisible(false)}
      />
    </View>
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  addBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: spacing.md,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  filterBtnActive: {
    backgroundColor: '#111827',
  },
  filterBtnText: {
    color: '#475569',
    fontWeight: '600',
    fontSize: 14,
  },
  filterBtnTextActive: {
    color: '#fff',
  },
  postList: {
    gap: spacing.md,
  },
  postCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  postTime: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 1,
  },
  postTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 6,
  },
  postContent: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  postContentFull: {
    fontSize: 15,
    color: '#334155',
    lineHeight: 22,
  },
  postDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 24,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionLabel: {
    fontSize: 14,
    color: colors.muted,
    fontWeight: '600',
  },
  deleteAction: {
    marginLeft: 'auto',
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Comments
  commentsSection: {
    gap: spacing.md,
  },
  commentsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  commentThread: {
    gap: 8,
  },
  commentCard: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentAvatarText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  commentBody: {
    flex: 1,
  },
  commentBubble: {
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: 'flex-start',
    maxWidth: '100%',
    minWidth: 70,
    position: 'relative',
  },
  commentBubbleWithReactions: {
    marginBottom: 8,
  },
  commentReactionBadge: {
    position: 'absolute',
    bottom: -8,
    right: -6,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 3,
  },
  commentReactionEmojis: {
    fontSize: 11,
  },
  commentReactionCount: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  commentAuthor: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  commentContent: {
    fontSize: 14,
    color: '#334155',
    marginTop: 2,
    lineHeight: 20,
  },
  commentActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 4,
    paddingLeft: 6,
  },
  commentActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  commentTime: {
    fontSize: 11,
    color: colors.muted,
  },
  commentReplyBtn: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  repliesContainer: {
    marginLeft: 36,
    borderLeftWidth: 2,
    borderLeftColor: '#E2E8F0',
    paddingLeft: 10,
    gap: 12,
    marginTop: 6,
  },
  replyCard: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  replyAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  replyAvatarText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1E293B',
  },
  replyBody: {
    flex: 1,
  },
  replyBubble: {
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    maxWidth: '100%',
    minWidth: 60,
    position: 'relative',
  },
  // Floating Reaction Modal
  reactionModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reactionBarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  reactionBarTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 10,
  },
  reactionBar: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  reactionItem: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reactionEmoji: {
    fontSize: 26,
  },
  noComments: {
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },

  // Comment input
  commentInputContainer: {
    margin: 16,
    marginTop: 0,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  replyingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#DBEAFE',
  },
  replyingBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  replyingBannerText: {
    fontSize: 12,
    color: '#2563EB',
    flex: 1,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    padding: 8,
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
    maxHeight: 100,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },

  // Create form
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: spacing.lg,
    gap: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    minHeight: 140,
    textAlignVertical: 'top',
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  imagePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
  },
  imagePickerText: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginTop: 12,
  },
  selectedImagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  previewImageWrapper: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  previewImageTouchable: {
    width: '100%',
    height: '100%',
  },
  previewGridImage: {
    width: '100%',
    height: '100%',
  },
  previewZoomBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    right: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  previewZoomText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  removeImageBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  previewHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  previewHeaderLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  previewHintText: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginTop: 12,
  },
  // Layout selector bar
  layoutSelectorCard: {
    marginTop: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  layoutSelectorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  layoutSelectorTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  layoutChipsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  layoutChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  layoutChipActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  layoutChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  layoutChipTextActive: {
    color: '#FFFFFF',
  },
  // Thumbnail reorder & cover photo strip
  thumbnailStripSection: {
    marginTop: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  thumbnailStripTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  thumbnailStrip: {
    flexDirection: 'row',
    gap: 8,
  },
  thumbnailItemWrapper: {
    width: 90,
    height: 90,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#E2E8F0',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  thumbnailImg: {
    width: '100%',
    height: '100%',
  },
  primaryBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#059669',
    paddingVertical: 2,
    alignItems: 'center',
  },
  primaryBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  setPrimaryBtn: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  setPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '600',
  },
  thumbDeleteBtn: {
    position: 'absolute',
    top: 3,
    right: 3,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const newsStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1B3B2B',
  },
  headerWrap: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#1B3B2B',
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  headerBrand: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  pendingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  pendingPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -4,
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitleInline: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 1,
  },
  headerSubtitleInline: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  curvedSheet: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  curvedSheetWhite: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingHorizontal: 20,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 14,
    marginRight: 24,
    position: 'relative',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#1B3B2B',
    fontWeight: '700',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2.5,
    backgroundColor: '#1B3B2B',
    borderRadius: 2,
  },
  emptyWrap: {
    paddingVertical: 56,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  createPostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1B3B2B',
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 22,
    shadowColor: '#1B3B2B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  createPostBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  outlineBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  outlineBackBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  fabBtn: {
    position: 'absolute',
    right: 20,
    backgroundColor: '#1B3B2B',
    borderRadius: 28,
    paddingHorizontal: 18,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  fabBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  pendingListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  pendingListTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  pendingListCount: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 16,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#0F172A',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  dropzone: {
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  dropzoneIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropzoneText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1B3B2B',
  },
  fixedFooter: {
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  primarySubmitBtn: {
    backgroundColor: '#1B3B2B',
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#1B3B2B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  primarySubmitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  pendingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1B3B2B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  authorName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  postTime: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  pendingStatusBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pendingStatusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  pendingCardActions: {
    flexDirection: 'row',
    gap: 10,
  },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
  },
  rejectBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
  },
  approveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#1B3B2B',
  },
  approveBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
