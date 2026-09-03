import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Vibration,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface PendingTaskItem {
  id: string;
  title: string;
  dueDate: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
}

export interface CheckinTaskReminderModalProps {
  visible: boolean;
  userLevelNumber?: number; // Only automatically shown for L5 (Team Leader) and above
  pendingTasks?: PendingTaskItem[];
  onConfirm: () => void;
  onSnooze30m: () => void;
}

export const CheckinTaskReminderModal: React.FC<CheckinTaskReminderModalProps> = ({
  visible,
  userLevelNumber = 5,
  pendingTasks = [
    { id: '1', title: 'Review Báo cáo Doanh số Ca Live Sáng', dueDate: 'Hôm nay - 17:00', priority: 'HIGH' },
    { id: '2', title: 'Phê duyệt Yêu cầu Đổi ca của Team', dueDate: 'Hôm nay - 18:00', priority: 'NORMAL' },
    { id: '3', title: 'Nộp Báo cáo Đánh giá NV Thử việc', dueDate: 'Hôm nay - 20:00', priority: 'URGENT' },
  ],
  onConfirm,
  onSnooze30m,
}) => {
  if (userLevelNumber < 5) {
    return null; // Only Leader (L5+) gets this reminder
  }

  const handleSnoozePress = () => {
    // Trigger 30-pulse vibration pattern (mô phỏng cuộc gọi nhắc nhở)
    const vibrationPattern = Array(30).fill(400); // 30 pulses of 400ms
    Vibration.vibrate(vibrationPattern);
    onSnooze30m();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <Ionicons name="notifications-circle-sharp" size={32} color="#EA580C" />
            <View style={styles.headerTextGroup}>
              <Text style={styles.title}>Trợ Lý Nhắc Việc Sau Check-in</Text>
              <Text style={styles.subTitle}>Dành cho Team Leader (Level 5+)</Text>
            </View>
          </View>

          {/* Alert Box */}
          <View style={styles.alertBox}>
            <Ionicons name="information-circle" size={20} color="#D97706" />
            <Text style={styles.alertText}>
              Bạn vừa Check-in thành công. Dưới đây là danh sách Task tồn đọng cần xử lý trong ngày:
            </Text>
          </View>

          {/* Task List */}
          <ScrollView style={styles.taskList} showsVerticalScrollIndicator={false}>
            {pendingTasks.map((task) => (
              <View key={task.id} style={styles.taskCard}>
                <View style={styles.taskHeaderRow}>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  <View
                    style={[
                      styles.priorityBadge,
                      task.priority === 'URGENT' ? styles.badgeUrgent : styles.badgeNormal,
                    ]}
                  >
                    <Text style={styles.priorityText}>{task.priority}</Text>
                  </View>
                </View>
                <View style={styles.taskFooterRow}>
                  <Ionicons name="time-outline" size={14} color="#6B7280" />
                  <Text style={styles.taskDueDate}>Hạn chót: {task.dueDate}</Text>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.snoozeBtn} onPress={handleSnoozePress} activeOpacity={0.8}>
              <Ionicons name="alarm-outline" size={18} color="#D97706" />
              <Text style={styles.snoozeBtnText}>Nhắc lại sau 30 phút</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.confirmBtn} onPress={onConfirm} activeOpacity={0.8}>
              <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
              <Text style={styles.confirmBtnText}>Xác nhận đã xem</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  headerTextGroup: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  subTitle: {
    fontSize: 12,
    color: '#EA580C',
    fontWeight: '600',
  },
  alertBox: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 10,
    borderRadius: 8,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  alertText: {
    fontSize: 12,
    color: '#B45309',
    flex: 1,
    lineHeight: 16,
  },
  taskList: {
    maxHeight: 220,
    marginBottom: 16,
  },
  taskCard: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  taskHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeUrgent: {
    backgroundColor: '#FEE2E2',
  },
  badgeNormal: {
    backgroundColor: '#E0E7FF',
  },
  priorityText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#DC2626',
  },
  taskFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  taskDueDate: {
    fontSize: 11,
    color: '#6B7280',
  },
  buttonRow: {
    gap: 10,
  },
  snoozeBtn: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 8,
  },
  snoozeBtnText: {
    color: '#B45309',
    fontWeight: 'bold',
    fontSize: 13,
  },
  confirmBtn: {
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 8,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
});
