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
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../providers/AuthProvider';

export interface EmployeeAssignedSubTask {
  id: string;
  projectName: string;
  departmentName: string;
  subTaskTitle: string;
  status: 'ASSIGNED' | 'SUBMITTED' | 'LEADER_APPROVED';
}

export const EmployeeLevelProjectScreen: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<EmployeeAssignedSubTask[]>([
    {
      id: 'st-1',
      projectName: 'Chiến Dịch Thăng Cấp Q3 - Bứt Phá GMV 1 Tỷ',
      departmentName: 'Livestream Hà Nội',
      subTaskTitle: '• Đảm nhận và dẫn chính 15 ca Livestream đỉnh điểm',
      status: 'ASSIGNED',
    },
  ]);

  const handleSubmitTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: 'SUBMITTED' } : t))
    );
    Alert.alert(
      'Nộp Báo Cáo Thành Công!',
      'Đã gửi báo cáo hoàn thành cho Leader duyệt Vòng 1. Kết quả sẽ được Admin xét nâng Level tại cuộc họp phòng ban cuối tháng!'
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Ionicons name="rocket-sharp" size={26} color="#059669" />
          <View>
            <Text style={styles.title}>Nhiệm Vụ Dự Án Nâng Level</Text>
            <Text style={styles.sub}>Các đầu mục việc con do Leader giao để nâng Cấp Bậc</Text>
          </View>
        </View>

        {tasks.map((task) => (
          <View key={task.id} style={styles.card}>
            <View style={styles.badgeRow}>
              <View style={styles.deptBadge}>
                <Text style={styles.deptBadgeText}>{task.departmentName}</Text>
              </View>
              <Text style={styles.projName}>{task.projectName}</Text>
            </View>

            <Text style={styles.subTaskTitle}>{task.subTaskTitle}</Text>

            <View style={styles.statusBoxRow}>
              {task.status === 'ASSIGNED' && (
                <TouchableOpacity
                  style={styles.submitBtn}
                  onPress={() => handleSubmitTask(task.id)}
                >
                  <Ionicons name="send" size={16} color="#FFFFFF" />
                  <Text style={styles.submitBtnText}>BÁO CÁO HOÀN THÀNH (GỬI LEADER DUYỆT)</Text>
                </TouchableOpacity>
              )}

              {task.status === 'SUBMITTED' && (
                <View style={styles.submittedBadge}>
                  <Ionicons name="time" size={16} color="#B45309" />
                  <Text style={styles.submittedBadgeText}>Đã nộp bài (Chờ Leader duyệt Vòng 1)</Text>
                </View>
              )}

              {task.status === 'LEADER_APPROVED' && (
                <View style={styles.approvedBadge}>
                  <Ionicons name="checkmark-circle" size={16} color="#059669" />
                  <Text style={styles.approvedBadgeText}>Leader Đã Duyệt Vòng 1 (Chờ Admin họp cuối tháng)</Text>
                </View>
              )}
            </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  sub: {
    fontSize: 12,
    color: '#059669',
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
  badgeRow: {
    marginBottom: 8,
  },
  deptBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  deptBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#059669',
  },
  projName: {
    fontSize: 12,
    color: '#6B7280',
  },
  subTaskTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#111827',
    marginVertical: 10,
  },
  statusBoxRow: {
    marginTop: 6,
  },
  submitBtn: {
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 8,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  submittedBadge: {
    backgroundColor: '#FEF3C7',
    padding: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  submittedBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#B45309',
  },
  approvedBadge: {
    backgroundColor: '#D1FAE5',
    padding: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  approvedBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#059669',
  },
});
