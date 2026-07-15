import { useRouter } from 'expo-router';
import { useState, type ReactNode } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Image,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { assertSocketUrl } from '../../constants/env';
import { uploadFile } from '../../api/uploads.api';
import { EmptyState } from '../../components/EmptyState';
import { PageHeader } from '../../components/PageHeader';
import { PrimaryButton } from '../../components/Buttons';
import { Screen } from '../../components/Screen';
import { StatusBadge } from '../../components/StatusBadge';
import { useAuth } from '../../providers/AuthProvider';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { normalizeApiError } from '../../utils/api-error';
import {
  useNewsfeedPosts,
  usePendingNewsfeedPosts,
  useApprovePost,
  useNewsfeedPost,
  useCreatePost,
  useLikePost,
  useAddComment,
  useDeletePost,
} from '../../hooks/useNewsfeed';
import type { NewsfeedPostDto, PostLikeDto, PostCommentDto } from '../../types/newsfeed.types';

// ── Helpers ──

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

function getInitials(name: string): string {
  return name.split(' ').filter(Boolean).slice(-2).map(w => w[0]).join('').toUpperCase();
}

// ── Newsfeed List Screen ──

export function NewsfeedListScreen({ canModerate = false }: { canModerate?: boolean }) {
  const router = useRouter();
  const { user } = useAuth();
  const posts = useNewsfeedPosts();
  const likePost = useLikePost();
  const removePost = useDeletePost();

  function confirmDelete(postId: string) {
    Alert.alert('Xóa bài đăng', 'Bạn có chắc muốn xóa bài đăng này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: () => {
          removePost.mutate(postId, {
            onError: (error) => {
              const normalized = normalizeApiError(error);
              Alert.alert('Lỗi', normalized.message);
            },
          });
        },
      },
    ]);
  }

  const postItems = Array.isArray(posts.data) ? posts.data : (posts.data as { items?: NewsfeedPostDto[] })?.items ?? [];

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <PageHeader
          title="Bảng tin công ty"
          subtitle="Tin tức và thông báo nội bộ"
          right={
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              {(user?.roles?.includes('ADMIN') || user?.roles?.includes('LEADER')) && (
                <Pressable
                  style={[styles.addBtn, { backgroundColor: colors.warning }]}
                  onPress={() => {
                    const isAdmin = user?.roles?.includes('ADMIN');
                    router.push(isAdmin ? '/admin/newsfeed/pending' : '/leader/newsfeed/pending' as any);
                  }}
                >
                  <MaterialCommunityIcons name="clock-outline" size={20} color="#fff" />
                  <Text style={styles.addBtnText}>Chờ duyệt</Text>
                </Pressable>
              )}
              <Pressable
                style={styles.addBtn}
                onPress={() => {
                  const isAdmin = user?.roles?.includes('ADMIN');
                  const isLeader = user?.roles?.includes('LEADER');
                  const basePath = isAdmin ? '/admin/newsfeed' : isLeader ? '/leader/newsfeed' : '/employee/newsfeed';
                  router.push(`${basePath}/create` as never);
                }}
              >
                <MaterialCommunityIcons name="plus" size={20} color="#fff" />
                <Text style={styles.addBtnText}>Đăng bài</Text>
              </Pressable>
            </View>
          }
        />

        <View style={styles.postList}>
          {postItems.length > 0 ? (
            postItems.map((post: NewsfeedPostDto) => {
              const authorName = post.author?.profile?.fullName ?? post.author?.userCode ?? 'Ẩn danh';
              const initials = getInitials(authorName);
              const likeCount = post._count?.likes ?? post.likes?.length ?? 0;
              const commentCount = post._count?.comments ?? post.comments?.length ?? 0;
              const isLiked = post.likes?.some((l: PostLikeDto) => l.userId === user?.id) ?? false;

              return (
                <Pressable
                  key={post.id}
                  style={styles.postCard}
                  onPress={() => {
                    const isAdmin = user?.roles?.includes('ADMIN');
                    const isLeader = user?.roles?.includes('LEADER');
                    const basePath = isAdmin ? '/admin/newsfeed' : isLeader ? '/leader/newsfeed' : '/employee/newsfeed';
                    router.push(`${basePath}/${post.id}` as never);
                  }}
                >
                  {/* Author row */}
                  <View style={styles.authorRow}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{initials}</Text>
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

                  {/* Images */}
                  {post.images && post.images.length > 0 ? (
                    <Image source={{ uri: resolveImageUrl(post.images[0]) || '' }} style={styles.postImage} resizeMode="cover" />
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
                        color={isLiked ? '#EF4444' : colors.muted}
                      />
                      <Text style={[styles.actionLabel, isLiked && { color: '#EF4444' }]}>
                        {likeCount}
                      </Text>
                    </Pressable>

                    <View style={styles.actionItem}>
                      <MaterialCommunityIcons
                        name="comment-outline"
                        size={20}
                        color={colors.muted}
                      />
                      <Text style={styles.actionLabel}>{commentCount}</Text>
                    </View>

                    {canModerate && (
                      <Pressable
                        style={[styles.actionItem, styles.deleteAction]}
                        onPress={(e) => {
                          e.stopPropagation?.();
                          confirmDelete(post.id);
                        }}
                      >
                        <MaterialCommunityIcons name="trash-can-outline" size={20} color="#EF4444" />
                      </Pressable>
                    )}
                  </View>
                </Pressable>
              );
            })
          ) : !posts.isLoading ? (
            <EmptyState
              title="Chưa có bài đăng"
              message="Nhấn Đăng bài để tạo bảng tin đầu tiên"
            />
          ) : null}
        </View>
      </ScrollView>
    </Screen>
  );
}

// ── Newsfeed Detail Screen ──

export function NewsfeedDetailScreen({ postId, canModerate = false }: { postId: string; canModerate?: boolean }) {
  const router = useRouter();
  const postQuery = useNewsfeedPost(postId);
  const likePostMutation = useLikePost();
  const addComment = useAddComment();
  const removePost = useDeletePost();
  const { user } = useAuth();
  const [commentText, setCommentText] = useState('');

  function confirmDelete() {
    Alert.alert('Xóa bài đăng', 'Bạn có chắc muốn xóa bài đăng này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: () => {
          removePost.mutate(postId, {
            onSuccess: () => router.back(),
            onError: (error) => {
              const normalized = normalizeApiError(error);
              Alert.alert('Lỗi', normalized.message);
            },
          });
        },
      },
    ]);
  }

  const post = postQuery.data;

  if (postQuery.isLoading) {
    return (
      <Screen>
        <PageHeader title="Chi tiết bài đăng" />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: colors.muted }}>Đang tải...</Text>
        </View>
      </Screen>
    );
  }

  if (!post) {
    return (
      <Screen>
        <EmptyState title="Không tìm thấy bài đăng" />
      </Screen>
    );
  }

  const authorName = post.author?.profile?.fullName ?? post.author?.userCode ?? 'Ẩn danh';
  const comments = post.comments ?? [];
  const likedNames = post.likes?.map((l: PostLikeDto & { user?: { profile?: { fullName: string } } }) => l.user?.profile?.fullName ?? 'Ẩn danh').filter(Boolean) || [];

  async function handleComment() {
    if (!commentText.trim()) return;
    try {
      await addComment.mutateAsync({ postId: post.id, content: commentText.trim() });
      setCommentText('');
      postQuery.refetch();
    } catch (error) {
      const normalized = normalizeApiError(error);
      Alert.alert('Lỗi', normalized.message);
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <PageHeader
          title="Chi tiết bài đăng"
          right={
            canModerate ? (
              <Pressable style={styles.deleteBtn} onPress={confirmDelete}>
                <MaterialCommunityIcons name="trash-can-outline" size={20} color="#EF4444" />
              </Pressable>
            ) : undefined
          }
        />

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

          {post.images && post.images.length > 0 ? (
            <Image 
              source={{ uri: resolveImageUrl(post.images[0]) || '' }} 
              style={styles.postImage} 
              resizeMode="cover" 
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
              <Text style={styles.actionLabel}>{comments.length}</Text>
            </View>
          </View>

          {likedNames.length > 0 && (
            <View style={{ marginTop: spacing.md, flexDirection: 'row', alignItems: 'flex-start' }}>
              <MaterialCommunityIcons name="heart" size={16} color="#EF4444" style={{ marginRight: 6, marginTop: 2 }} />
              <Text style={{ fontSize: 13, color: colors.text, flex: 1, lineHeight: 20 }}>
                Thích bởi <Text style={{ fontWeight: '600' }}>{likedNames.join(', ')}</Text>
              </Text>
            </View>
          )}
        </View>

        {/* Comments section */}
        <View style={styles.commentsSection}>
          <Text style={styles.commentsTitle}>
            Bình luận ({comments.length})
          </Text>

          {comments.map((c: PostCommentDto) => {
            const cName = c.author?.profile?.fullName ?? 'Ẩn danh';
            return (
              <View key={c.id} style={styles.commentCard}>
                <View style={styles.commentAvatar}>
                  <Text style={styles.commentAvatarText}>{getInitials(cName)}</Text>
                </View>
                <View style={styles.commentBody}>
                  <Text style={styles.commentAuthor}>{cName}</Text>
                  <Text style={styles.commentContent}>{c.content}</Text>
                  <Text style={styles.commentTime}>{timeAgo(c.createdAt)}</Text>
                </View>
              </View>
            );
          })}

          {comments.length === 0 && (
            <Text style={styles.noComments}>Chưa có bình luận nào</Text>
          )}
        </View>

        {/* Comment input */}
        <View style={styles.commentInputRow}>
          <TextInput
            style={styles.commentInput}
            placeholder="Viết bình luận..."
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
      </ScrollView>
    </Screen>
  );
}

// ── Create Post Screen ──

export function CreatePostScreen() {
  const router = useRouter();
  const createPost = useCreatePost();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function pickImage() {
    let fileUri = '';
    let fileName = '';
    let fileMimeType = '';

    if (Platform.OS === 'web') {
      const picked = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true, type: 'image/*' });
      if (picked.canceled || !picked.assets?.[0]) return;
      const file = picked.assets[0];
      fileUri = file.uri;
      fileName = file.name;
      fileMimeType = file.mimeType ?? 'image/jpeg';
    } else {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 1,
      });

      if (result.canceled || !result.assets[0]) return;
      const asset = result.assets[0];
      fileUri = asset.uri;
      fileName = asset.fileName ?? `image_${Date.now()}.jpg`;
      fileMimeType = asset.mimeType ?? 'image/jpeg';
    }

    setUploading(true);
    try {
      const uploaded = await uploadFile({
        uri: fileUri,
        name: fileName,
        mimeType: fileMimeType,
        purpose: 'TASK_ATTACHMENT',
      });
      setImageUri(uploaded.fileUrl);
    } catch (error) {
      const normalized = normalizeApiError(error);
      Alert.alert('Lỗi', normalized.message);
    } finally {
      setUploading(false);
    }
  }

  async function submit() {
    if (!content.trim()) {
      Alert.alert('Lỗi', 'Nội dung bài đăng không được để trống');
      return;
    }
    try {
      await createPost.mutateAsync({
        title: title.trim() || '',
        content: content.trim(),
        ...(imageUri ? { images: [imageUri] } : {}),
      });
      Alert.alert('Thành công', 'Đã đăng bài mới');
      router.back();
    } catch (error) {
      const normalized = normalizeApiError(error);
      Alert.alert('Lỗi', normalized.message);
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <PageHeader title="Đăng bài mới" subtitle="Chia sẻ thông tin với công ty" />

        <View style={styles.formCard}>
          <Field label="Tiêu đề (không bắt buộc)">
            <TextInput
              style={styles.input}
              placeholder="Nhập tiêu đề bài đăng"
              placeholderTextColor={colors.muted}
              value={title}
              onChangeText={setTitle}
            />
          </Field>

          <Field label="Nội dung">
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Nhập nội dung bài đăng..."
              placeholderTextColor={colors.muted}
              value={content}
              onChangeText={setContent}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </Field>
          
          <Field label="Hình ảnh">
            <Pressable style={styles.imagePickerBtn} onPress={() => void pickImage()}>
              <MaterialCommunityIcons name="image-plus" size={24} color={colors.primary} />
              <Text style={styles.imagePickerText}>{uploading ? 'Đang tải lên...' : (imageUri ? 'Đổi hình ảnh' : 'Thêm hình ảnh')}</Text>
            </Pressable>
            {imageUri ? (
              <Image source={{ uri: resolveImageUrl(imageUri) || '' }} style={styles.previewImage} resizeMode="cover" />
            ) : null}
          </Field>

          <PrimaryButton
            onPress={() => void submit()}
            loading={createPost.isPending || uploading}
            disabled={uploading}
          >
            Đăng bài
          </PrimaryButton>
        </View>
      </ScrollView>
    </Screen>
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
  const posts = usePendingNewsfeedPosts();

  const postItems = Array.isArray(posts.data) ? posts.data : (posts.data as { items?: NewsfeedPostDto[] })?.items ?? [];

  const { user } = useAuth();
  const isAdmin = user?.roles?.includes('ADMIN');

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <PageHeader
          title="Bài đăng chờ duyệt"
          subtitle="Các bài đăng từ nhân viên"
        />

        <View style={styles.postList}>
          {postItems.length > 0 ? (
            postItems.map((post: NewsfeedPostDto) => {
              const authorName = post.author?.profile?.fullName ?? post.author?.userCode ?? 'Ẩn danh';
              const initials = getInitials(authorName);

              return (
                <Pressable
                  key={post.id}
                  style={styles.postCard}
                  onPress={() => {
                    const basePath = isAdmin ? '/admin/newsfeed/pending' : '/leader/newsfeed/pending';
                    router.push(`${basePath}/${post.id}` as never);
                  }}
                >
                  <View style={styles.authorRow}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{initials}</Text>
                    </View>
                    <View style={styles.authorInfo}>
                      <Text style={styles.authorName}>{authorName}</Text>
                      <Text style={styles.postTime}>{timeAgo(post.createdAt)}</Text>
                    </View>
                    <StatusBadge label="Chờ duyệt" tone="warning" />
                  </View>

                  {post.title ? (
                    <Text style={styles.postTitle}>{post.title}</Text>
                  ) : null}
                  <Text style={styles.postContent} numberOfLines={4}>
                    {post.content}
                  </Text>
                  
                  {post.images && post.images.length > 0 ? (
                    <Image source={{ uri: resolveImageUrl(post.images[0]) || '' }} style={styles.postImage} resizeMode="cover" />
                  ) : null}
                </Pressable>
              );
            })
          ) : !posts.isLoading ? (
            <EmptyState
              title="Không có bài viết"
              message="Chưa có bài viết nào cần duyệt"
            />
          ) : null}
        </View>
      </ScrollView>
    </Screen>
  );
}

// ── Pending Newsfeed Detail Screen ──

export function PendingNewsfeedDetailScreen({ postId }: { postId: string }) {
  const router = useRouter();
  const postQuery = useNewsfeedPost(postId);
  const approvePost = useApprovePost();

  function handleApprove() {
    Alert.alert('Duyệt bài', 'Cho phép hiển thị bài đăng này trên bảng tin?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Duyệt',
        style: 'default',
        onPress: () => {
          approvePost.mutate({ postId, status: 'APPROVED' }, {
            onSuccess: () => router.back(),
            onError: (error) => {
              Alert.alert('Lỗi', normalizeApiError(error).message);
            }
          });
        }
      }
    ]);
  }

  function handleReject() {
    Alert.prompt('Từ chối bài', 'Vui lòng nhập lý do từ chối (không bắt buộc)', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Từ chối',
        style: 'destructive',
        onPress: (reason) => {
          approvePost.mutate({ postId, status: 'REJECTED', rejectionReason: reason }, {
            onSuccess: () => router.back(),
            onError: (error) => {
              Alert.alert('Lỗi', normalizeApiError(error).message);
            }
          });
        }
      }
    ]);
  }

  const post = postQuery.data;

  if (postQuery.isLoading) {
    return (
      <Screen>
        <PageHeader title="Chi tiết bài đăng" />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: colors.muted }}>Đang tải...</Text>
        </View>
      </Screen>
    );
  }

  if (!post) {
    return (
      <Screen>
        <EmptyState title="Không tìm thấy bài đăng" />
      </Screen>
    );
  }

  const authorName = post.author?.profile?.fullName ?? post.author?.userCode ?? 'Ẩn danh';

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <PageHeader title="Chi tiết bài viết" />

        <View style={styles.postCard}>
          <View style={styles.authorRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials(authorName)}</Text>
            </View>
            <View style={styles.authorInfo}>
              <Text style={styles.authorName}>{authorName}</Text>
              <Text style={styles.postTime}>{timeAgo(post.createdAt)}</Text>
            </View>
            <StatusBadge label={post.status === 'PENDING' ? 'Chờ duyệt' : post.status} tone="warning" />
          </View>

          {post.title ? <Text style={styles.postTitle}>{post.title}</Text> : null}
          <Text style={styles.postContentFull}>{post.content}</Text>

          {post.images && post.images.length > 0 ? (
            <Image 
              source={{ uri: resolveImageUrl(post.images[0]) || '' }} 
              style={styles.postImage} 
              resizeMode="cover" 
            />
          ) : null}

          <View style={styles.postDivider} />
          
          <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.md }}>
             <PrimaryButton onPress={handleReject} style={{ flex: 1, backgroundColor: colors.danger }}>Từ chối</PrimaryButton>
             <PrimaryButton onPress={handleApprove} style={{ flex: 1, backgroundColor: colors.success }}>Duyệt bài</PrimaryButton>
          </View>
        </View>
      </ScrollView>
    </Screen>
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
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 4,
  },
  addBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
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
    backgroundColor: colors.primary,
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
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Comments
  commentsSection: {
    gap: spacing.sm,
  },
  commentsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  commentCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentAvatarText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4338CA',
  },
  commentBody: {
    flex: 1,
  },
  commentAuthor: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  commentContent: {
    fontSize: 14,
    color: '#475569',
    marginTop: 2,
  },
  commentTime: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 4,
  },
  noComments: {
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },

  // Comment input
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
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
    backgroundColor: colors.primary,
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
    color: colors.primary,
    fontWeight: '600',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginTop: 12,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginTop: 12,
  },
});
