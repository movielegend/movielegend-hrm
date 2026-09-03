import React, { useState } from 'react';
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

export const LeaderReviewScreen: React.FC = () => {
  const [reviews, setReviews] = useState<LeaderReviewItem[]>([
    {
      userId: 'usr-1',
      userName: 'Trần Thị B',
      currentLevelName: 'Level 2 - Chính thức',
      currentLevelNumber: 2,
      taskCompletionRate: 100,
      actualMetricValue: '950.000.000 VNĐ',
      recommendation: 'RECOMMEND_PROMOTION',
      note: 'Nhân sự hoàn thành 100% Task, chốt đơn rất xuất sắc trong ca Live.',
    },
    {
      userId: 'usr-2',
      userName: 'Lê Văn C',
      currentLevelName: 'Level 1 - Thực tập',
      currentLevelNumber: 1,
      taskCompletionRate: 86,
      actualMetricValue: '850.000.000 VNĐ',
      recommendation: 'RETAIN_LEVEL',
      note: 'Hỗ trợ kỹ thuật tốt nhưng còn trễ 3 Task kiểm kê thiết bị.',
    },
  ]);

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
    Alert.alert(
      'Xác Nhận Gửi Duyệt Vòng 1',
      'Bạn có chắc chắn muốn gửi kết quả đánh giá thi đua Vòng 1 lên Admin phê duyệt cuối tháng?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Gửi Duyệt',
          onPress: () => {
            Alert.alert('Thành Công', 'Đã gửi Đề xuất Thi đua Vòng 1 lên Admin!');
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

        {reviews.map((item) => (
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
        ))}

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
