import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Modal,
  ScrollView,
  TextInput,
} from 'react-native';
import { useDepartments } from '../../hooks/useDepartments';
import { useSocketStatus } from '../../providers/SocketProvider';

import { AdminDeptOverviewPage, DepartmentSummaryItem } from './pages/AdminDeptOverviewPage';
import { AdminLevelRewardsPage } from './pages/AdminLevelRewardsPage';
import { AdminLevelProjectsPage } from './pages/AdminLevelProjectsPage';

export interface LevelStageProject {
  projectName: string;
  subTaskBullets: string[];
}

export interface AdminLevelItem {
  id: string;
  levelNumber: number;
  levelName: string;
  colorHex: string;
  rewardType: 'CASH' | 'PHYSICAL_ITEM' | 'HYBRID';
  promotionBonusAmount: number;
  physicalItemName: string;
  retentionFloorGmv: number;
  promotionCeilingGmv: number;
  retentionMultiplier: number;
  project: LevelStageProject;
}

export const AdminLevelConfigScreen: React.FC = () => {
  const { data: realDeptData } = useDepartments({ limit: 100 });
  const { getSocket } = useSocketStatus();
  const realDeptList = realDeptData?.data || realDeptData?.items || [];

  const departments = realDeptList.length > 0
    ? realDeptList.map((d: any) => ({ id: d.id, name: d.name }))
    : [
        { id: 'dept-1', name: 'Livestream Hà Nội' },
        { id: 'dept-2', name: 'Livestream HCM' },
        { id: 'dept-3', name: 'HR Nhân sự' },
        { id: 'dept-4', name: 'Kho & Tài sản' },
        { id: 'dept-5', name: 'Chăm sóc Khách hàng CSKH' },
        { id: 'dept-6', name: 'Marketing' },
      ];

  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);
  const [selectedDeptId, setSelectedDeptId] = useState(departments[0]?.id || 'dept-1');

  // Default Level Configs with Integrated Projects & Bullet Sub-tasks for Each Level
  const createDefaultLevels = (deptName: string): AdminLevelItem[] => [
    {
      id: 'lvl-1',
      levelNumber: 1,
      levelName: 'Level 1',
      colorHex: '#64748B',
      rewardType: 'CASH',
      promotionBonusAmount: 0,
      physicalItemName: 'Voucher Sinh nhật 200k',
      retentionFloorGmv: 0,
      promotionCeilingGmv: 50,
      retentionMultiplier: 1.0,
      project: {
        projectName: `Dự Án Level 1: Hòa Nhập & Chuẩn Hóa (${deptName})`,
        subTaskBullets: [
          '• Hoàn thành khóa đào tạo hội nhập ban đầu',
          '• Nắm rõ quy trình vận hành & nội quy công ty',
          '• Thử nghiệm 5 ca làm việc dưới sự giám sát',
        ],
      },
    },
    {
      id: 'lvl-2',
      levelNumber: 2,
      levelName: 'Level 2',
      colorHex: '#2563EB',
      rewardType: 'HYBRID',
      promotionBonusAmount: 1000000,
      physicalItemName: 'Kỷ niệm chương chính thức',
      retentionFloorGmv: 30,
      promotionCeilingGmv: 150,
      retentionMultiplier: 1.1,
      project: {
        projectName: `Dự Án Level 2: Làm Chủ Quy Trình Độc Lập (${deptName})`,
        subTaskBullets: [
          '• Đạt 100% KPI ca làm việc cá nhân đúng hạn',
          '• Đề xuất 1 giải pháp cải tiến quy trình phòng ban',
        ],
      },
    },
    {
      id: 'lvl-3',
      levelNumber: 3,
      levelName: 'Level 3',
      colorHex: '#0D9488',
      rewardType: 'HYBRID',
      promotionBonusAmount: 3000000,
      physicalItemName: 'Tai nghe Bluetooth Chống ồn cao cấp',
      retentionFloorGmv: 80,
      promotionCeilingGmv: 300,
      retentionMultiplier: 1.25,
      project: {
        projectName: `Dự Án Level 3: Tối Ưu Năng Suất Chuyên Sâu (${deptName})`,
        subTaskBullets: [
          '• Đạt tổng Doanh số / KPI cá nhân 300Trđ',
          '• Hướng dẫn & kèm cặp 1 nhân sự mới Level 1',
        ],
      },
    },
    {
      id: 'lvl-4',
      levelNumber: 4,
      levelName: 'Level 4',
      colorHex: '#7C3AED',
      rewardType: 'HYBRID',
      promotionBonusAmount: 5000000,
      physicalItemName: 'Máy tính bảng iPad Air / Màn 4K',
      retentionFloorGmv: 150,
      promotionCeilingGmv: 500,
      retentionMultiplier: 1.4,
      project: {
        projectName: `Dự Án Level 4: Chinh Phục Cột Mốc 500 Triệu (${deptName})`,
        subTaskBullets: [
          '• Đạt tổng Doanh số / KPI cá nhân 500Trđ',
          '• Đảm nhận dẫn dắt các phiên nhiệm vụ ưu tiên',
        ],
      },
    },
    {
      id: 'lvl-5',
      levelNumber: 5,
      levelName: 'Level 5',
      colorHex: '#EA580C',
      rewardType: 'HYBRID',
      promotionBonusAmount: 8000000,
      physicalItemName: 'Laptop MacBook Air M3',
      retentionFloorGmv: 250,
      promotionCeilingGmv: 820,
      retentionMultiplier: 1.6,
      project: {
        projectName: `Dự Án Level 5: Bứt Phá Doanh Số 1 Tỷ (${deptName})`,
        subTaskBullets: [
          '• Đảm nhận và hoàn thành 30 ca đỉnh điểm',
          '• Đạt tổng Doanh số / KPI cá nhân 820Trđ - 1 Tỷđ',
          '• Tỷ lệ hoàn thành Task SLA đúng hạn ≥ 98%',
        ],
      },
    },
    {
      id: 'lvl-6',
      levelNumber: 6,
      levelName: 'Level 6',
      colorHex: '#DC2626',
      rewardType: 'HYBRID',
      promotionBonusAmount: 15000000,
      physicalItemName: 'Laptop MacBook Pro M-Series + iPhone',
      retentionFloorGmv: 500,
      promotionCeilingGmv: 1500,
      retentionMultiplier: 2.0,
      project: {
        projectName: `Dự Án Level 6: Quản Trị & Bứt Phá 1.5 Tỷ (${deptName})`,
        subTaskBullets: [
          '• Xây dựng bộ quy trình chuẩn cho phòng ban',
          '• Đạt tổng Doanh số / KPI 1.5 Tỷđ',
        ],
      },
    },
    {
      id: 'lvl-7',
      levelNumber: 7,
      levelName: 'Level 7',
      colorHex: '#D97706',
      rewardType: 'HYBRID',
      promotionBonusAmount: 30000000,
      physicalItemName: 'MacBook Pro Max + 1 Cây Vàng 9999',
      retentionFloorGmv: 1000,
      promotionCeilingGmv: 3000,
      retentionMultiplier: 2.5,
      project: {
        projectName: `Dự Án Level 7: Chinh Phục 3 Tỷ Doanh Số (${deptName})`,
        subTaskBullets: [
          '• Đạt mốc 3 Tỷđ Doanh số toàn diện',
          '• Đào tạo & phát triển 3 nhân sự lên Level 5',
        ],
      },
    },
    {
      id: 'lvl-8',
      levelNumber: 8,
      levelName: 'Level 8',
      colorHex: '#881337',
      rewardType: 'HYBRID',
      promotionBonusAmount: 50000000,
      physicalItemName: 'Xe công vụ + Cổ phần ESOP Doanh nghiệp',
      retentionFloorGmv: 2000,
      promotionCeilingGmv: 5000,
      retentionMultiplier: 3.0,
      project: {
        projectName: `Dự Án Level 8: Tăng Trưởng Quy Mô 5 Tỷ (${deptName})`,
        subTaskBullets: [
          '• Đạt mốc 5 Tỷđ Doanh số',
          '• Hoàn thành chiến lược mở rộng thị phần công ty',
        ],
      },
    },
  ];

  const [deptLevelConfigs, setDeptLevelConfigs] = useState<Record<string, AdminLevelItem[]>>({});
  const [editingItem, setEditingItem] = useState<AdminLevelItem | null>(null);

  const activeDept = departments.find((d) => d.id === selectedDeptId) || departments[0];
  const activeLevels = deptLevelConfigs[selectedDeptId] || createDefaultLevels(activeDept.name);

  // Real-time Socket.io Sync Listener
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.emit('level:join_config_room', { departmentId: selectedDeptId });

    const handleLevelConfigUpdated = (payload: any) => {
      if (payload && payload.departmentId && payload.levels) {
        setDeptLevelConfigs((prev) => ({
          ...prev,
          [payload.departmentId]: payload.levels,
        }));
      }
    };

    socket.on('level:config:updated', handleLevelConfigUpdated);
    socket.on('level:updated', handleLevelConfigUpdated);

    return () => {
      socket.off('level:config:updated', handleLevelConfigUpdated);
      socket.off('level:updated', handleLevelConfigUpdated);
    };
  }, [selectedDeptId, getSocket]);

  // Dynamic Add New Level
  const handleAddNewLevel = () => {
    const nextLevelNum = activeLevels.length + 1;
    const newLevelItem: AdminLevelItem = {
      id: `lvl-${Date.now()}`,
      levelNumber: nextLevelNum,
      levelName: `Level ${nextLevelNum}`,
      colorHex: '#0F172A',
      rewardType: 'HYBRID',
      promotionBonusAmount: 60000000,
      physicalItemName: `Quà Thưởng Hiện Vật Cao Cấp Level ${nextLevelNum}`,
      retentionFloorGmv: 3000,
      promotionCeilingGmv: 8000,
      retentionMultiplier: 3.5,
      project: {
        projectName: `Dự Án Level ${nextLevelNum}: Thử Thách Mới (${activeDept.name})`,
        subTaskBullets: ['• Hoàn thành 100% KPI Level mới'],
      },
    };

    setDeptLevelConfigs((prev) => {
      const currentList = prev[selectedDeptId] || createDefaultLevels(activeDept.name);
      const updatedList = [...currentList, newLevelItem];
      
      const socket = getSocket();
      if (socket) {
        socket.emit('level:config:update', { departmentId: selectedDeptId, levels: updatedList });
      }

      return { ...prev, [selectedDeptId]: updatedList };
    });

    Alert.alert('Thành Công', `Đã khởi tạo thêm Level ${nextLevelNum} mới cho phòng ban ${activeDept.name}!`);
  };

  const handleUpdateLevelProjectName = (levelNumber: number, newProjectName: string) => {
    setDeptLevelConfigs((prev) => {
      const currentList = prev[selectedDeptId] || createDefaultLevels(activeDept.name);
      const updatedList = currentList.map((item) =>
        item.levelNumber === levelNumber
          ? { ...item, project: { ...item.project, projectName: newProjectName } }
          : item
      );

      const socket = getSocket();
      if (socket) {
        socket.emit('level:config:update', { departmentId: selectedDeptId, levels: updatedList });
      }

      return { ...prev, [selectedDeptId]: updatedList };
    });
  };

  const handleAddSubTaskToLevel = (levelNumber: number, bulletText: string) => {
    const formattedBullet = bulletText.startsWith('•') ? bulletText : `• ${bulletText}`;

    setDeptLevelConfigs((prev) => {
      const currentList = prev[selectedDeptId] || createDefaultLevels(activeDept.name);
      const updatedList = currentList.map((item) =>
        item.levelNumber === levelNumber
          ? {
              ...item,
              project: {
                ...item.project,
                subTaskBullets: [...(item.project.subTaskBullets || []), formattedBullet],
              },
            }
          : item
      );

      const socket = getSocket();
      if (socket) {
        socket.emit('level:config:update', { departmentId: selectedDeptId, levels: updatedList });
      }

      return { ...prev, [selectedDeptId]: updatedList };
    });
  };

  const handleSaveModalItem = () => {
    if (!editingItem) return;
    setDeptLevelConfigs((prev) => {
      const currentList = prev[selectedDeptId] || createDefaultLevels(activeDept.name);
      const updatedList = currentList.map((item) => (item.id === editingItem.id ? editingItem : item));

      const socket = getSocket();
      if (socket) {
        socket.emit('level:config:update', { departmentId: selectedDeptId, levels: updatedList });
      }

      return { ...prev, [selectedDeptId]: updatedList };
    });
    Alert.alert('Thành Công', `Đã lưu quà thưởng cho ${editingItem.levelName} - Phòng ${activeDept.name}!`);
    setEditingItem(null);
  };

  // Build Department Summaries for Page 1
  const deptSummaries: DepartmentSummaryItem[] = departments.map((d) => {
    const list = deptLevelConfigs[d.id] || createDefaultLevels(d.name);
    const topItem = list.find((l) => l.levelNumber === 5) || list[list.length - 1];
    return {
      id: d.id,
      name: d.name,
      totalLevels: list.length,
      topRewardName: topItem ? topItem.physicalItemName : 'Laptop MacBook Air M3',
    };
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Executive Header Card */}
      <View style={styles.executiveHeaderCard}>
        <Text style={styles.executiveBadgeTitle}>ADMIN CONTROL CENTER</Text>
        <Text style={styles.title}>Quản Lý Cấu Hình Level 3 Bước Khoa Học</Text>
      </View>

      {/* 3-Step Progress Stepper Navigation Bar */}
      <View style={styles.stepperContainer}>
        <TouchableOpacity
          style={[styles.stepTab, activeStep === 1 && styles.stepTabActive]}
          onPress={() => setActiveStep(1)}
        >
          <Text style={[styles.stepNumber, activeStep === 1 && styles.stepNumberActive]}>1</Text>
          <Text style={[styles.stepTitle, activeStep === 1 && styles.stepTitleActive]}>Phòng Ban</Text>
        </TouchableOpacity>

        <View style={styles.stepDivider} />

        <TouchableOpacity
          style={[styles.stepTab, activeStep === 2 && styles.stepTabActive]}
          onPress={() => setActiveStep(2)}
        >
          <Text style={[styles.stepNumber, activeStep === 2 && styles.stepNumberActive]}>2</Text>
          <Text style={[styles.stepTitle, activeStep === 2 && styles.stepTitleActive]}>Quà Thưởng</Text>
        </TouchableOpacity>

        <View style={styles.stepDivider} />

        <TouchableOpacity
          style={[styles.stepTab, activeStep === 3 && styles.stepTabActive]}
          onPress={() => setActiveStep(3)}
        >
          <Text style={[styles.stepNumber, activeStep === 3 && styles.stepNumberActive]}>3</Text>
          <Text style={[styles.stepTitle, activeStep === 3 && styles.stepTitleActive]}>Giao Dự Án</Text>
        </TouchableOpacity>
      </View>

      {/* Page Content Switcher */}
      <View style={{ flex: 1 }}>
        {activeStep === 1 && (
          <AdminDeptOverviewPage
            departments={deptSummaries}
            selectedDeptId={selectedDeptId}
            onSelectDepartment={(id) => setSelectedDeptId(id)}
            onNextToRewards={() => setActiveStep(2)}
          />
        )}

        {activeStep === 2 && (
          <AdminLevelRewardsPage
            departmentName={activeDept.name}
            levels={activeLevels}
            onEditLevelReward={(lvl) => setEditingItem({ ...lvl })}
            onAddNewLevel={handleAddNewLevel}
            onNextToProjects={() => setActiveStep(3)}
          />
        )}

        {activeStep === 3 && (
          <AdminLevelProjectsPage
            departmentName={activeDept.name}
            levels={activeLevels}
            onUpdateLevelProjectName={handleUpdateLevelProjectName}
            onAddSubTaskToLevel={handleAddSubTaskToLevel}
            onSaveAllAndSync={() => {
              Alert.alert(
                'Đã Lưu & Đồng Bộ Thành Công!',
                `Đã lưu toàn bộ Cấu hình Level, Quà thưởng & Dự án cho phòng ban ${activeDept.name}. Dữ liệu đã đồng bộ Real-time tới Leader và Nhân viên!`,
                [{ text: 'Về Trang Chủ Admin', onPress: () => setActiveStep(1) }]
              );
            }}
          />
        )}
      </View>

      {/* Edit Level Modal */}
      <Modal visible={editingItem !== null} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chỉnh Sửa {editingItem?.levelName} - Phòng {activeDept.name}</Text>
              <TouchableOpacity onPress={() => setEditingItem(null)}>
                <Text style={{ fontSize: 18, color: '#6B7280', fontWeight: 'bold' }}>✕</Text>
              </TouchableOpacity>
            </View>

            {editingItem && (
              <ScrollView style={{ maxHeight: 400 }}>
                <Text style={styles.inputLabel}>Tên Cấp Bậc:</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editingItem.levelName}
                  onChangeText={(text) => setEditingItem({ ...editingItem, levelName: text })}
                />

                <Text style={styles.inputLabel}>Quà Hiện Vật (MacBook, iPad, Xe máy...):</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editingItem.physicalItemName}
                  onChangeText={(text) => setEditingItem({ ...editingItem, physicalItemName: text })}
                />

                <Text style={styles.inputLabel}>Thưởng Tiền Mặt Thăng Cấp (VNĐ):</Text>
                <TextInput
                  style={styles.modalInput}
                  keyboardType="number-pad"
                  value={String(editingItem.promotionBonusAmount)}
                  onChangeText={(text) => setEditingItem({ ...editingItem, promotionBonusAmount: Number(text) || 0 })}
                />
              </ScrollView>
            )}

            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveModalItem}>
              <Text style={styles.saveBtnText}>LƯU QUÀ THƯỞNG PHÒNG {activeDept.name.toUpperCase()}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  executiveHeaderCard: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  executiveBadgeTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#64748B',
    letterSpacing: 1.2,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  stepTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  stepTabActive: {
    backgroundColor: '#EFF6FF',
  },
  stepNumber: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#CBD5E1',
    color: '#475569',
    textAlign: 'center',
    fontSize: 11,
    fontWeight: 'bold',
    lineHeight: 20,
  },
  stepNumberActive: {
    backgroundColor: '#1E40AF',
    color: '#FFFFFF',
  },
  stepTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  stepTitleActive: {
    color: '#1E40AF',
    fontWeight: 'bold',
  },
  stepDivider: {
    flex: 1,
    height: 1,
    backgroundColor: '#CBD5E1',
    marginHorizontal: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
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
    color: '#0F172A',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginTop: 8,
    marginBottom: 4,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    backgroundColor: '#FFFFFF',
    color: '#0F172A',
  },
  saveBtn: {
    backgroundColor: '#1E40AF',
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 16,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
});
