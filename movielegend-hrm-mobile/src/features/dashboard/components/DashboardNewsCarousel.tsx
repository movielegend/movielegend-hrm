import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Newspaper, ChevronRight, Heart, MessageSquare, Clock } from 'lucide-react-native';
import { resolveFileUrl } from '../../../utils/url';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = Math.min(Math.round(SCREEN_WIDTH * 0.8), 310);
const CARD_GAP = 12;

interface DashboardNewsCarouselProps {
  posts?: any;
  role?: 'ADMIN' | 'LEADER' | 'EMPLOYEE' | 'HR';
  newsfeedRoute: string;
}

function formatRelativeTime(dateString?: string): string {
  if (!dateString) return 'Vừa xong';
  try {
    const now = new Date();
    const d = new Date(dateString);
    const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diffSec < 60) return 'Vừa xong';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} phút trước`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour} giờ trước`;
    const diffDay = Math.floor(diffHour / 24);
    if (diffDay < 7) return `${diffDay} ngày trước`;
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
  } catch {
    return '';
  }
}

export const DashboardNewsCarousel = React.memo(function DashboardNewsCarousel({
  posts,
  role = 'EMPLOYEE',
  newsfeedRoute,
}: DashboardNewsCarouselProps) {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);

  const recentPosts = useMemo(() => {
    const list = Array.isArray(posts) ? posts : (posts as any)?.items || [];
    return list.slice(0, 5);
  }, [posts]);

  if (!recentPosts || recentPosts.length === 0) {
    return null;
  }

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / (CARD_WIDTH + CARD_GAP));
    if (index >= 0 && index < recentPosts.length && index !== activeIndex) {
      setActiveIndex(index);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.titleWrap}>
          <Text style={styles.sectionMainTitle}>Bảng tin nội bộ</Text>
          {recentPosts.length > 1 && (
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{recentPosts.length} tin mới</Text>
            </View>
          )}
        </View>
        <Pressable
          hitSlop={8}
          onPress={() => router.push(newsfeedRoute as any)}
          style={styles.viewAllBtn}
        >
          <Text style={styles.viewAllText}>Xem tất cả</Text>
          <ChevronRight size={14} color="#0284C7" strokeWidth={2.5} />
        </Pressable>
      </View>

      {/* Horizontal Carousel */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        snapToInterval={CARD_WIDTH + CARD_GAP}
        decelerationRate="fast"
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {recentPosts.map((post: any, index: number) => {
          const rawImg =
            post?.images?.[0] ||
            post?.coverUrl ||
            (Array.isArray(post?.attachments)
              ? post.attachments.find(
                  (a: any) =>
                    typeof a === 'string' &&
                    !a.startsWith('layout:') &&
                    /\.(jpg|jpeg|png|webp|gif)/i.test(a)
                )
              : null);
          const resolvedImg = resolveFileUrl(rawImg);

          const title = post?.title || post?.content?.substring(0, 60) || 'Tin nội bộ';
          const contentSnippet = post?.content ? post.content.replace(/<[^>]*>?/gm, '').trim() : '';
          const authorName =
            post?.author?.profile?.fullName ||
            post?.author?.userCode ||
            'Ban Quản Trị';
          const timeText = formatRelativeTime(post?.createdAt);
          const likesCount = post?._count?.likes ?? (Array.isArray(post?.likes) ? post.likes.length : 0);
          const commentsCount = post?._count?.comments ?? 0;

          return (
            <Pressable
              key={post?.id || index}
              style={[
                styles.card,
                recentPosts.length === 1 && { width: SCREEN_WIDTH - 32 },
              ]}
              onPress={() => router.push(newsfeedRoute as any)}
            >
              {/* Cover / Image Header */}
              <View style={styles.coverWrapper}>
                {resolvedImg ? (
                  <Image
                    source={{ uri: resolvedImg }}
                    style={styles.coverImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.coverFallback}>
                    <View style={styles.coverFallbackCircle}>
                      <Newspaper size={28} color="#0284C7" strokeWidth={1.8} />
                    </View>
                  </View>
                )}

                {/* Tag Pill overlay */}
                <View style={styles.tagOverlay}>
                  <Text style={styles.tagOverlayText}>NỘI BỘ</Text>
                </View>

                {timeText ? (
                  <View style={styles.timeOverlay}>
                    <Clock size={10} color="#FFFFFF" strokeWidth={2} />
                    <Text style={styles.timeOverlayText}>{timeText}</Text>
                  </View>
                ) : null}
              </View>

              {/* Body */}
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle} numberOfLines={2}>
                  {title}
                </Text>

                {contentSnippet && contentSnippet !== title ? (
                  <Text style={styles.cardSnippet} numberOfLines={1}>
                    {contentSnippet}
                  </Text>
                ) : null}

                {/* Footer */}
                <View style={styles.cardFooter}>
                  <Text style={styles.authorText} numberOfLines={1}>
                    Bởi <Text style={styles.authorBold}>{authorName}</Text>
                  </Text>

                  <View style={styles.statsRow}>
                    {likesCount > 0 && (
                      <View style={styles.statItem}>
                        <Heart size={12} color="#EF4444" fill="#EF4444" />
                        <Text style={styles.statText}>{likesCount}</Text>
                      </View>
                    )}
                    {commentsCount > 0 && (
                      <View style={styles.statItem}>
                        <MessageSquare size={12} color="#64748B" />
                        <Text style={styles.statText}>{commentsCount}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Pagination Dots */}
      {recentPosts.length > 1 && (
        <View style={styles.dotsRow}>
          {recentPosts.map((_: any, i: number) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === activeIndex ? styles.activeDot : styles.inactiveDot,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    marginBottom: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionMainTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  countBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0284C7',
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0284C7',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 2,
    gap: CARD_GAP,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  coverWrapper: {
    width: '100%',
    height: 116,
    backgroundColor: '#F1F5F9',
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F0F9FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverFallbackCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagOverlay: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(16, 39, 57, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagOverlayText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  timeOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  timeOverlayText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cardBody: {
    padding: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 19,
    marginBottom: 4,
  },
  cardSnippet: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  authorText: {
    fontSize: 11,
    color: '#64748B',
    flex: 1,
    marginRight: 8,
  },
  authorBold: {
    fontWeight: '600',
    color: '#334155',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  statText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    gap: 5,
  },
  dot: {
    height: 5,
    borderRadius: 2.5,
  },
  activeDot: {
    width: 16,
    backgroundColor: '#0284C7',
  },
  inactiveDot: {
    width: 5,
    backgroundColor: '#CBD5E1',
  },
});
