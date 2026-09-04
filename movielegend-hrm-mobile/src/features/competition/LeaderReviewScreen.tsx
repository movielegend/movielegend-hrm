import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import * as SecureStore from 'expo-secure-store';
import { useAuth } from '../../providers/AuthProvider';
import { useSocketStatus } from '../../providers/SocketProvider';
import { useLevelProjects } from '../leveling/levelProjectsStore';

export interface LeaderReviewItem {
  userId: string;
  userName: string;
  currentLevelName: string;
  currentLevelNumber: number;
  taskCompletionRate: number;
  actualMetricValue: string;
  recommendation: 'RECOMMEND_PROMOTION' | 'RETAIN_LEVEL' | 'REJECT';
  note: string;
}

const SUBMITTED_KEY = 'LEADER_ROUND1_SUBMITTED_USERS';
const ADMIN_REVIEWS_KEY = 'ADMIN_PENDING_ROUND1_REVIEWS';

export const LeaderReviewScreen: React.FC = () => {
  const { user } = useAuth();
  const { getSocket } = useSocketStatus();
  const leaderDeptId = (user as any)?.departmentId || user?.department?.id;
  const leaderDeptName = user?.department?.name || (user as any)?.departmentName;

  const { projects } = useLevelProjects(leaderDeptId, leaderDeptName);
  const [reviews, setReviews] = useState<LeaderReviewItem[]>([]);
  const [submittedUserIds, setSubmittedUserIds] = useState<string[]>([]);

  // Load previously submitted candidate IDs
  useEffect(() => {
    void (async () => {
      try {
        const stored = await SecureStore.getItemAsync(SUBMITTED_KEY);
        if (stored) {
          const ids = JSON.parse(stored);
          if (Array.isArray(ids)) {
            setSubmittedUserIds(ids);
          }
        }
      } catch {}
    })();
  }, []);

  useEffect(() => {
    if (!Array.isArray(projects) || projects.length === 0) return;

    // Map to group subtasks by assigned employee
    const userTaskMap = new Map<string, {
      userName: string;
      levelNumber: number;
      levelName: string;
      total: number;
      approved: number;
      submitted: number;
      bulletTitles: string[];
    }>();

    projects.forEach((proj) => {
      (proj.subTasks || []).forEach((st) => {
        if (!st.assignedToUserId && !st.assignedToUserName) return;

        const uid = st.assignedToUserId || st.assignedToUserName || 'unknown';
        const uname = st.assignedToUserName || 'Nhân sự';

        // Skip candidates already submitted to Admin
        if (submittedUserIds.includes(uid)) return;

        const existing = userTaskMap.get(uid) || {
          userName: uname,
          levelNumber: proj.levelNumber,
          levelName: proj.levelName,
          total: 0,
          approved: 0,
          submitted: 0,
          bulletTitles: [],
        };

        existing.total += 1;
        if (st.status === 'LEADER_APPROVED') {
          existing.approved += 1;
        } else if (st.status === 'SUBMITTED') {
          existing.submitted += 1;
        }

        if (st.title) existing.bulletTitles.push(st.title);
        userTaskMap.set(uid, existing);
      });
    });

    const dynamicCandidates: LeaderReviewItem[] = Array.from(userTaskMap.entries()).map(([uid, val]) => {
      const rate = val.total > 0 ? Math.round((val.approved / val.total) * 100) : 0;
      return {
        userId: uid,
        userName: val.userName,
        currentLevelName: val.levelName,
        currentLevelNumber: val.levelNumber,
        taskCompletionRate: rate,
        actualMetricValue: `${val.approved}/${val.total} việc con đã duyệt Vòng 1`,
        recommendation: rate >= 80 ? 'RECOMMEND_PROMOTION' : 'RETAIN_LEVEL',
        note: val.approved > 0
          ? `Leader đã duyệt Vòng 1 cho ${val.approved}/${val.total} việc con ở ${val.levelName}.`
          : `Đã giao ${val.total} việc con ở ${val.levelName}.`,
      };
    });

    setReviews(dynamicCandidates);
  }, [projects, submittedUserIds]);

  const handleRecommendationChange = (userId: string, newRec: 'RECOMMEND_PROMOTION' | 'RETAIN_LEVEL' | 'REJECT') => {
    setReviews((prev) =>
      prev.map((item) => (item.userId === userId ? { ...item, recommendation: newRec } : item))
    );
  };

  const handleNoteChange = (userId: string, text: string) => {
    setReviews((prev) =>
      prev.map((item) => (item.userId === userId ? { ...item, note: text } : item))
    );
  };

  const handleSubmitReviews = () => {
    if (reviews.length === 0) {
      Alert.alert('Thông báo', 'Không có nhân sự nào cần duyệt Vòng 1.');
      return;
    }

    Alert.alert(
      'Xác Nhận Gửi Duyệt Vòng 1',
      `Bạn có chắc chắn muốn gửi kết quả đánh giá thi đua Vòng 1 của ${reviews.length} nhân sự lên Admin phê duyệt cuối tháng?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Gửi Duyệt',
          onPress: async () => {
            try {
              const newSubmittedIds = reviews.map((r) => r.userId);
              const updatedSubmitted = Array.from(new Set([...submittedUserIds, ...newSubmittedIds]));
              setSubmittedUserIds(updatedSubmitted);
              await SecureStore.setItemAsync(SUBMITTED_KEY, JSON.stringify(updatedSubmitted));

              // Persist submitted reviews for Admin screen
              const existingAdminReviewsRaw = await SecureStore.getItemAsync(ADMIN_REVIEWS_KEY);
              const existingAdminReviews = existingAdminReviewsRaw ? JSON.parse(existingAdminReviewsRaw) : [];
              const combined = [...(Array.isArray(existingAdminReviews) ? existingAdminReviews : []), ...reviews];
              await SecureStore.setItemAsync(ADMIN_REVIEWS_KEY, JSON.stringify(combined));

              // Broadcast socket event
              const socket = getSocket();
              if (socket) {
                socket.emit('level:round1_submitted', {
                  leaderUserId: user?.id,
                  departmentId: leaderDeptId,
                  submittedReviews: reviews,
                });
              }

              Alert.alert(
                'Thành Công',
                'Đã gửi Đề xuất Thi đua Vòng 1 lên Admin thành công! Danh sách đã được gạch bỏ khỏi trang duyệt Vòng 1 của Leader.'
              );
            } catch {
              Alert.alert('Thành Công', 'Đã gửi Đề xuất Thi đua Vòng 1 lên Admin!');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="clipboard-sharp" size={26} color="#2563EB" />
          <View>
            <Text style={styles.headerTitle}>Leader Duyệt Thi Đua Vòng 1</Text>
            <Text style={styles.headerSub}>Đánh giá nhân sự trong Team gửi Admin duyệt cuối tháng</Text>
          </View>
        </View>

        {reviews.length === 0 ? (
          <View style={{ padding: 24, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="documents-outline" size={48} color="#9CA3AF" />
            <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 8, fontWeight: '500' }}>
              Chưa có đề xuất thi đua nào cần duyệt trong đợt này.
            </Text>
          </View>
        ) : (
          reviews.map((item) => (
            <View key={item.userId} style={styles.reviewCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.userName}>{item.userName}</Text>
              <View style={styles.levelBadge}>
                <Text style={styles.levelText}>{item.currentLevelName}</Text>
              </View>
            </View>

            <View style={styles.statsRow}>
              <Text style={styles.statLabel}>Tỷ lệ hoàn thành Task: <Text style={styles.statGreen}>{item.taskCompletionRate}%</Text></Text>
              <Text style={styles.statLabel}>Doanh số ca Live: <Text style={styles.statBold}>{item.actualMetricValue}</Text></Text>
            </View>

            <Text style={styles.sectionLabel}>Đề xuất Đánh giá Vòng 1 của Leader:</Text>
            <View style={styles.recRow}>
              <TouchableOpacity
                style={[
                  styles.recOption,
                  item.recommendation === 'RECOMMEND_PROMOTION' && styles.recOptionActiveGreen,
                ]}
                onPress={() => handleRecommendationChange(item.userId, 'RECOMMEND_PROMOTION')}
              >
                <Ionicons
                  name="arrow-up-circle"
                  size={16}
                  color={item.recommendation === 'RECOMMEND_PROMOTION' ? '#059669' : '#6B7280'}
                />
                <Text
                  style={[
                    styles.recOptionText,
                    item.recommendation === 'RECOMMEND_PROMOTION' && styles.recTextGreen,
                  ]}
                >
                  Đề xuất Nâng Level
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.recOption,
                  item.recommendation === 'RETAIN_LEVEL' && styles.recOptionActiveGray,
                ]}
                onPress={() => handleRecommendationChange(item.userId, 'RETAIN_LEVEL')}
              >
                <Ionicons
                  name="remove-circle"
                  size={16}
                  color={item.recommendation === 'RETAIN_LEVEL' ? '#4B5563' : '#6B7280'}
                />
                <Text
                  style={[
                    styles.recOptionText,
                    item.recommendation === 'RETAIN_LEVEL' && styles.recTextGray,
                  ]}
                >
                  Giữ Nguyên Level
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionLabel}>Nhận xét của Leader gửi Admin:</Text>
            <TextInput
              style={styles.noteInput}
              multiline
              numberOfLines={2}
              value={item.note}
              onChangeText={(text) => handleNoteChange(item.userId, text)}
              placeholder="Nhập nhận xét về tinh thần làm việc, thái độ..."
            />
          </View>
        )))}

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmitReviews}>
          <Ionicons name="send" size={18} color="#FFFFFF" />
          <Text style={styles.submitBtnText}>GỬI KẾT QUẢ VÒNG 1 CHO ADMIN PHÊ DUYỆT</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  headerSub: {
    fontSize: 12,
    color: '#6B7280',
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#111827',
  },
  levelBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  levelText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1D4ED8',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F3F4F6',
    padding: 8,
    borderRadius: 6,
    marginBottom: 10,
  },
  statLabel: {
    fontSize: 11,
    color: '#4B5563',
  },
  statGreen: {
    fontWeight: 'bold',
    color: '#059669',
  },
  statBold: {
    fontWeight: 'bold',
    color: '#1F2937',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 6,
    marginBottom: 6,
  },
  recRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  recOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
  },
  recOptionActiveGreen: {
    backgroundColor: '#ECFDF5',
    borderColor: '#059669',
  },
  recOptionActiveGray: {
    backgroundColor: '#F3F4F6',
    borderColor: '#4B5563',
  },
  recOptionText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
  },
  recTextGreen: {
    color: '#059669',
    fontWeight: 'bold',
  },
  recTextGray: {
    color: '#1F2937',
    fontWeight: 'bold',
  },
  noteInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    padding: 8,
    fontSize: 12,
    backgroundColor: '#FAFAFA',
    textAlignVertical: 'top',
  },
  submitBtn: {
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 10,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
});
