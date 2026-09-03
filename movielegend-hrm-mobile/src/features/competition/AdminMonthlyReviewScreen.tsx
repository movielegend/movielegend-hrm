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
      targetLevelName: 'Level 3 - Senior',
      rewardPhysicalItem: 'Tai nghe Bluetooth Chống ồn cao cấp + 3.000.000đ',
      leaderRecommendation: 'Đề xuất nâng Level (Hoàn thành 100% Task ca Live)',
      actualMetrics: ' Doanh số Live: 950.000.000 VNĐ',
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
      actualMetrics: ' Doanh số Live: 1.200.000.000 VNĐ',
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
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Admin Xét Nâng Level Cuối Tháng</Text>
            <Text style={styles.sub}>Duyệt thăng cấp & Trao thưởng hiện vật tại cuộc họp phòng ban</Text>
          </View>
        </View>

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
                <Text style={styles.rewardText}>Quà thưởng: {item.rewardPhysicalItem}</Text>
              </View>
            )}

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>• Leader Vòng 1: {item.leaderRecommendation}</Text>
              <Text style={styles.infoText}>• {item.actualMetrics}</Text>
              <Text style={styles.infoText}>• Tỷ lệ Task đúng hạn: {item.taskRate}%</Text>
            </View>

            {item.status === 'PENDING' && (
              <TouchableOpacity
                style={styles.approveBtn}
                onPress={() => handleApproveLevel(item.id, item.targetLevelName, item.rewardPhysicalItem || '')}
              >
                <Text style={styles.approveBtnText}>CHỐT NÂNG {item.targetLevelName.toUpperCase()}</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scroll: {
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  sub: {
    fontSize: 12,
    color: '#D97706',
    fontWeight: '600',
  },
  card: {
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
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  name: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#111827',
  },
  dept: {
    fontSize: 12,
    color: '#6B7280',
  },
  statusBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
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
    color: '#059669',
  },
  levelTransitionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F3F4F6',
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  levelOld: {
    fontSize: 12,
    color: '#4B5563',
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
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  rewardText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#92400E',
  },
  infoBox: {
    marginBottom: 10,
  },
  infoText: {
    fontSize: 11,
    color: '#4B5563',
    lineHeight: 16,
  },
  approveBtn: {
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  approveBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
});
