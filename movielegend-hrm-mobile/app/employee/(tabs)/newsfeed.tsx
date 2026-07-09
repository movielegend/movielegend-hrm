import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View, Pressable, RefreshControl } from 'react-native';
import { Screen } from '../../../src/components/Screen';
import { PageHeader } from '../../../src/components/PageHeader';
import { fetchNewsfeed, likePost, type NewsfeedPost } from '../../../src/api/newsfeed.api';
import { colors } from '../../../src/theme/colors';
import { spacing } from '../../../src/theme/spacing';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../../src/providers/AuthProvider';

export default function NewsfeedScreen() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<NewsfeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadPosts = async () => {
    try {
      const data = await fetchNewsfeed({ limit: 20 });
      setPosts(data.items);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadPosts();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    void loadPosts();
  };

  const handleLike = async (postId: string) => {
    try {
      await likePost(postId);
      // Optimistic update
      setPosts(prev => prev.map(p => {
        if (p.id === postId) {
          const isLiked = p.likes?.some(l => l.userId === user?.id);
          return {
            ...p,
            _count: { ...p._count, likes: isLiked ? (p._count?.likes || 1) - 1 : (p._count?.likes || 0) + 1, comments: p._count?.comments || 0 },
            likes: isLiked ? p.likes?.filter(l => l.userId !== user?.id) : [...(p.likes || []), { userId: user?.id! }]
          } as NewsfeedPost;
        }
        return p;
      }));
    } catch (e) {
      console.error(e);
    }
  };

  const renderItem = ({ item }: { item: NewsfeedPost }) => {
    const isLiked = item.likes?.some(l => l.userId === user?.id);
    
    return (
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>{item.author?.profile?.fullName?.charAt(0) || 'U'}</Text>
          </View>
          <View>
            <Text style={styles.authorName}>{item.author?.profile?.fullName || 'Người dùng'}</Text>
            <Text style={styles.dateText}>{new Date(item.createdAt).toLocaleString('vi-VN')}</Text>
          </View>
        </View>
        
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.content}>{item.content}</Text>
        
        <View style={styles.footer}>
          <Pressable style={styles.actionBtn} onPress={() => void handleLike(item.id)}>
            <MaterialCommunityIcons 
              name={isLiked ? "heart" : "heart-outline"} 
              size={20} 
              color={isLiked ? colors.danger : colors.muted} 
            />
            <Text style={[styles.actionText, isLiked && { color: colors.danger }]}>
              {item._count?.likes || 0} Thích
            </Text>
          </Pressable>
          <Pressable style={styles.actionBtn}>
            <MaterialCommunityIcons name="comment-outline" size={20} color={colors.muted} />
            <Text style={styles.actionText}>{item._count?.comments || 0} Bình luận</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <Screen>
      <PageHeader title="Bảng tin Công ty" />
      <FlatList
        data={posts}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          !loading ? <Text style={styles.emptyText}>Chưa có bài đăng nào.</Text> : null
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  listContainer: {
    padding: spacing.md,
    gap: spacing.md,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: 16,
  },
  authorName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  dateText: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  content: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  footer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    gap: spacing.xl,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    color: colors.muted,
    fontWeight: '500',
    fontSize: 14,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.muted,
    marginTop: spacing.xl,
  }
});
