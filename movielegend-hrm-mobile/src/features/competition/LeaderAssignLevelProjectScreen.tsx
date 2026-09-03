import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface BulletSubTask {
  id: string;
  title: string;
  assignedToUser?: string;
  status: 'UNASSIGNED' | 'ASSIGNED' | 'SUBMITTED' | 'LEADER_APPROVED';
}

export interface DepartmentLevelProject {
  id: string;
  departmentName: string;
  projectName: string;
  targetLevelName: string;
  rewardItem: string;
  subTasks: BulletSubTask[];
}

export const LeaderAssignLevelProjectScreen: React.FC = () => {
  const [project, setProject] = useState<DepartmentLevelProject>({
    id: 'proj-1',
    departmentName: 'Livestream Hà Nội',
    projectName: 'Chiến Dịch Thăng Cấp Q3 - Bứt Phá GMV 1 Tỷ',
    targetLevelName: 'Level 3 - Senior Specialist',
    rewardItem: '💻 Laptop MacBook Air M3 + 3.000.000đ',
    subTasks: [
      { id: 'st-1', title: '• Đảm nhận và dẫn chính 15 ca Livestream đỉnh điểm', assignedToUser: 'Trần Thị B', status: 'SUBMITTED' },
      { id: 'st-2', title: '• Tối ưu Setup ánh sáng & kỹ thuật cho 20 phiên Live', assignedToUser: 'Lê Văn C', status: 'ASSIGNED' },
      { id: 'st-3', title: '• Xây dựng Kịch bản chốt đơn cho sản phẩm mới', status: 'UNASSIGNED' },
    ],
  });

  const teamMembers = ['Trần Thị B', 'Lê Văn C', 'Nguyễn Thị D', 'Phạm Văn E'];
  const [selectedSubTask, setSelectedSubTask] = useState<BulletSubTask | null>(null);

  const handleAssignSubTask = (memberName: string) => {
    if (!selectedSubTask) return;
    setProject((prev) => ({
      ...prev,
      subTasks: prev.subTasks.map((st) =>
        st.id === selectedSubTask.id
          ? { ...st, assignedToUser: memberName, status: 'ASSIGNED' }
          : st
      ),
    }));
    Alert.alert('Gán Việc Thành Công', `Đã giao việc con "${selectedSubTask.title}" cho ${memberName}`);
    setSelectedSubTask(null);
  };

  const handleApproveSubTask = (subTaskId: string, userName?: string) => {
    setProject((prev) => ({
      ...prev,
      subTasks: prev.subTasks.map((st) =>
        st.id === subTaskId ? { ...st, status: 'LEADER_APPROVED' } : st
      ),
    }));
    Alert.alert(
      'Duyệt Vòng 1 Thành Công!',
      `Đã phê duyệt hoàn thành đầu mục cho nhân sự ${userName || ''}. Kết quả sẽ được trình Admin trong cuộc họp phòng ban cuối tháng!`
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Ionicons name="clipboard-sharp" size={26} color="#2563EB" />
          <View>
            <Text style={styles.title}>Leader Phân Việc & Duyệt Vòng 1</Text>
            <Text style={styles.sub}>Gán việc con gạch đầu dòng từ Admin & Duyệt hoàn thành</Text>
          </View>
        </View>

        {/* Project Card */}
        <View style={styles.projectCard}>
          <View style={styles.badgeRow}>
            <View style={styles.deptBadge}>
              <Text style={styles.deptBadgeText}>{project.departmentName}</Text>
            </View>
            <View style={styles.targetBadge}>
              <Text style={styles.targetBadgeText}>Mục tiêu: {project.targetLevelName}</Text>
            </View>
          </View>

          <Text style={styles.projectName}>{project.projectName}</Text>

          <View style={styles.rewardBox}>
            <Ionicons name="gift" size={16} color="#D97706" />
            <Text style={styles.rewardText}>Phần thưởng khi Admin chốt: {project.rewardItem}</Text>
          </View>

          <Text style={styles.sectionHeaderTitle}>Danh Sách Việc Con Gạch Đầu Dòng (Admin Giao):</Text>

          {project.subTasks.map((st) => (
            <View key={st.id} style={styles.subTaskCard}>
              <Text style={styles.subTaskTitle}>{st.title}</Text>

              <View style={styles.subTaskFooterRow}>
                {st.assignedToUser ? (
                  <View style={styles.assignedUserBox}>
                    <Ionicons name="person-circle" size={16} color="#2563EB" />
                    <Text style={styles.assignedUserText}>Đã gán: <Text style={{ fontWeight: 'bold' }}>{st.assignedToUser}</Text></Text>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.assignActionBtn} onPress={() => setSelectedSubTask(st)}>
                    <Ionicons name="person-add-outline" size={14} color="#FFFFFF" />
                    <Text style={styles.assignActionText}>Chọn nhân sự thực hiện</Text>
                  </TouchableOpacity>
                )}

                {/* Status Badges & Approve Action */}
                {st.status === 'SUBMITTED' && (
                  <TouchableOpacity
                    style={styles.approveStage1Btn}
                    onPress={() => handleApproveSubTask(st.id, st.assignedToUser)}
                  >
                    <Ionicons name="checkmark-circle" size={14} color="#FFFFFF" />
                    <Text style={styles.approveStage1Text}>DUYỆT VÒNG 1</Text>
                  </TouchableOpacity>
                )}

                {st.status === 'LEADER_APPROVED' && (
                  <View style={styles.approvedBadge}>
                    <Ionicons name="checkmark-circle" size={14} color="#059669" />
                    <Text style={styles.approvedBadgeText}>Đã Duyệt Vòng 1</Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Assign Member Modal */}
      <Modal visible={selectedSubTask !== null} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Gán Nhân Sự Thực Hiện</Text>
              <TouchableOpacity onPress={() => setSelectedSubTask(null)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {selectedSubTask && (
              <View>
                <Text style={styles.selectedTaskTitle}>{selectedSubTask.title}</Text>
                <Text style={styles.selectMemberLabel}>Chọn thành viên trong Team:</Text>

                {teamMembers.map((m) => (
                  <TouchableOpacity key={m} style={styles.memberItemBtn} onPress={() => handleAssignSubTask(m)}>
                    <Ionicons name="person-outline" size={18} color="#2563EB" />
                    <Text style={styles.memberItemName}>{m}</Text>
                    <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>
      </Modal>
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
    color: '#2563EB',
    fontWeight: '600',
  },
  projectCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  deptBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  deptBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#2563EB',
  },
  targetBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  targetBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#B45309',
  },
  projectName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  rewardBox: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 8,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },
  rewardText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#92400E',
  },
  sectionHeaderTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 10,
  },
  subTaskCard: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  subTaskTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  subTaskFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  assignedUserBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  assignedUserText: {
    fontSize: 12,
    color: '#374151',
  },
  assignActionBtn: {
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  assignActionText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  approveStage1Btn: {
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  approveStage1Text: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  approvedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  approvedBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#059669',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  selectedTaskTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#2563EB',
    marginBottom: 12,
  },
  selectMemberLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  memberItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  memberItemName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
    marginLeft: 8,
  },
});
