import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from 'react-native';

export interface AdminReviewItem {
  id: string;
  userName: string;
  departmentName: string;
  currentLevelName: string;
  targetLevelName: string;
  rewardPhysicalItem?: string;
  leaderRecommendation: string;
  actualMetrics: string;
  taskRate: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export const AdminMonthlyReviewScreen: React.FC = () => {
  const [items, setItems] = useState<AdminReviewItem[]>([
    {
      id: '1',
      userName: 'Trần Thị B',
      departmentName: 'Livestream Hà Nội',
      currentLevelName: 'Level 2 - Chính thức',
      targetLevelName: 'Level 3 - Senior Specialist',
      rewardPhysicalItem: 'Tai nghe Bluetooth Chống ồn cao cấp + 3.000.000đ',
      leaderRecommendation: 'Đề xuất nâng Level (Hoàn thành 100% Task ca Live)',
      actualMetrics: 'Doanh số Live: 950.000.000 VNĐ',
      taskRate: 100,
      status: 'PENDING',
    },
    {
      id: '2',
      userName: 'Nguyễn Văn A',
      departmentName: 'Livestream HCM',
      currentLevelName: 'Level 4 - Key Member',
      targetLevelName: 'Level 5 - Team Leader',
      rewardPhysicalItem: 'Laptop MacBook Air M3 + 8.000.000đ',
      leaderRecommendation: 'Đề xuất nâng Level (Đạt 40% Doanh số cả Team)',
      actualMetrics: 'Doanh số Live: 1.200.000.000 VNĐ',
      taskRate: 96,
      status: 'PENDING',
    },
  ]);

  const handleApproveLevel = (id: string, targetLevel: string, reward: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'APPROVED' } : item))
    );
    Alert.alert(
      'Phê Duyệt Nâng Level Thành Công!',
      `Đã chính thức nâng nhân sự lên ${targetLevel} và trao thưởng: ${reward}`,
      [{ text: 'Đóng' }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        
        {/* Executive Header Card */}
        <View style={styles.executiveHeaderCard}>
          <Text style={styles.executiveBadgeTitle}>ADMIN CONTROL CENTER</Text>
          <Text style={styles.title}>Admin Review & Chốt Level Cuối Tháng</Text>
          <Text style={styles.sub}>Đánh giá tổng thể & Phê duyệt thăng cấp tại buổi họp phòng ban</Text>
        </View>

        <Text style={styles.sectionHeaderTitle}>DANH SÁCH ĐỀ XUẤT THĂNG CẤP TỪ LEADER:</Text>

        {items.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.name}>{item.userName}</Text>
                <Text style={styles.dept}>{item.departmentName}</Text>
              </View>
              <View style={[styles.statusBadge, item.status === 'APPROVED' && styles.statusApproved]}>
                <Text style={[styles.statusText, item.status === 'APPROVED' && styles.statusTextApproved]}>
                  {item.status === 'APPROVED' ? 'Đã duyệt thăng cấp' : 'Chờ Admin chốt'}
                </Text>
              </View>
            </View>

            <View style={styles.levelTransitionRow}>
              <Text style={styles.levelOld}>{item.currentLevelName}</Text>
              <Text style={styles.arrowText}>→</Text>
              <Text style={styles.levelNew}>{item.targetLevelName}</Text>
            </View>

            {item.rewardPhysicalItem && (
              <View style={styles.rewardBox}>
                <Text style={styles.rewardText}>Quà hiện vật & thưởng: {item.rewardPhysicalItem}</Text>
              </View>
            )}

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>• Leader Vòng 1: {item.leaderRecommendation}</Text>
              <Text style={styles.infoText}>• Kết quả thực tế: {item.actualMetrics}</Text>
              <Text style={styles.infoText}>• Tỷ lệ Task đúng hạn: {item.taskRate}%</Text>
            </View>

            {item.status === 'PENDING' && (
              <TouchableOpacity
                style={styles.approveBtn}
                onPress={() => handleApproveLevel(item.id, item.targetLevelName, item.rewardPhysicalItem || '')}
              >
                <Text style={styles.approveBtnText}>XÁC NHẬN CHỐT NÂNG {item.targetLevelName.toUpperCase()}</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scroll: {
    padding: 16,
  },
  executiveHeaderCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  executiveBadgeTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#94A3B8',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  sub: {
    fontSize: 12,
    color: '#CBD5E1',
    lineHeight: 16,
  },
  sectionHeaderTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#64748B',
    letterSpacing: 0.8,
    marginTop: 4,
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  dept: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  statusBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusApproved: {
    backgroundColor: '#D1FAE5',
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#B45309',
  },
  statusTextApproved: {
    color: '#047857',
  },
  levelTransitionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F1F5F9',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  levelOld: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  arrowText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#059669',
  },
  levelNew: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#059669',
  },
  rewardBox: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  rewardText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#92400E',
  },
  infoBox: {
    marginBottom: 12,
  },
  infoText: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
  },
  approveBtn: {
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 10,
  },
  approveBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
    letterSpacing: 0.5,
  },
});
