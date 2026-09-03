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
  StatusBar,
  ActivityIndicator,
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
  const { data: realDeptData, isLoading } = useDepartments({ limit: 100 });
  const { getSocket } = useSocketStatus();

  const realDeptList = realDeptData?.data || realDeptData?.items || (Array.isArray(realDeptData) ? realDeptData : []);
  const departments = realDeptList.map((d: any) => ({ id: d.id || d._id, name: d.name || 'Phòng ban' }));

  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');

  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [availableYears, setAvailableYears] = useState<number[]>([2025, 2026, 2027]);

  useEffect(() => {
    if (departments.length > 0 && (!selectedDeptId || !departments.some((d: any) => d.id === selectedDeptId))) {
      setSelectedDeptId(departments[0].id);
    }
  }, [departments, selectedDeptId]);

  // Default 12 Levels Config representing 12 Months of the Year
  const createDefault12Levels = (deptName: string, year: number): AdminLevelItem[] => {
    const colors = [
      '#64748B', '#2563EB', '#0D9488', '#7C3AED', '#EA580C', '#DC2626',
      '#D97706', '#881337', '#4F46E5', '#059669', '#0284C7', '#9333EA',
    ];

    const physicalRewards = [
      'Voucher Sinh Nhật 200k',
      'Kỷ Niệm Chương Thăng Cấp',
      'Tai Nghe Bluetooth Chống Ồn',
      'Máy Tính Bảng iPad Air',
      'Laptop MacBook Air M3',
      'Laptop MacBook Pro M-Series',
      'MacBook Pro Max + 1 Cây Vàng 9999',
      'Xe Công Vụ + Cổ Phần ESOP',
      'Gói Nghỉ Dưỡng 5 Sao Gia Đình',
      'Đồng Hồ Thông Minh Cao Cấp',
      'Bộ Quà Tặng Tri Ân Đỉnh Cao',
      'Kỳ Nghỉ Châu Âu + Thưởng Năm Lớn',
    ];

    return Array.from({ length: 12 }, (_, i) => {
      const lvlNum = i + 1;
      return {
        id: `lvl-${year}-${lvlNum}`,
        levelNumber: lvlNum,
        levelName: `Level ${lvlNum}`,
        colorHex: colors[i % colors.length],
        rewardType: lvlNum === 1 ? 'CASH' : 'HYBRID',
        promotionBonusAmount: (lvlNum - 1) * 2000000,
        physicalItemName: physicalRewards[i % physicalRewards.length],
        retentionFloorGmv: (lvlNum - 1) * 50,
        promotionCeilingGmv: lvlNum * 100,
        retentionMultiplier: Number((1.0 + (lvlNum - 1) * 0.15).toFixed(2)),
        project: {
          projectName: `Dự Án Chinh Phục Level ${lvlNum} - Năm ${year} (${deptName})`,
          subTaskBullets: [
            `• Hoàn thành 100% chỉ tiêu KPI tháng cho Level ${lvlNum}`,
            `• Thực hiện quy trình chuẩn hóa Level ${lvlNum} phòng ${deptName}`,
          ],
        },
      };
    });
  };

  const [deptLevelConfigs, setDeptLevelConfigs] = useState<Record<string, AdminLevelItem[]>>({});
  const [editingItem, setEditingItem] = useState<AdminLevelItem | null>(null);

  const activeDept = departments.find((d) => d.id === selectedDeptId) || departments[0] || { id: 'default', name: 'Phòng Ban' };
  const currentConfigKey = `${selectedDeptId}_${selectedYear}`;
  const activeLevels = deptLevelConfigs[currentConfigKey] || createDefault12Levels(activeDept.name, selectedYear);

  // Real-time Socket.io Sync Listener
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.emit('level:join_config_room', { departmentId: selectedDeptId, year: selectedYear });

    const handleLevelConfigUpdated = (payload: any) => {
      if (payload && payload.departmentId && payload.levels) {
        const key = payload.year ? `${payload.departmentId}_${payload.year}` : payload.departmentId;
        setDeptLevelConfigs((prev) => ({
          ...prev,
          [key]: payload.levels,
        }));
      }
    };

    socket.on('level:config:updated', handleLevelConfigUpdated);
    socket.on('level:updated', handleLevelConfigUpdated);

    return () => {
      socket.off('level:config:updated', handleLevelConfigUpdated);
      socket.off('level:updated', handleLevelConfigUpdated);
    };
  }, [selectedDeptId, selectedYear, getSocket]);

  // Add New Year
  const handleAddNewYear = () => {
    const nextYear = Math.max(...availableYears) + 1;
    setAvailableYears((prev) => [...prev, nextYear]);
    setSelectedYear(nextYear);
    Alert.alert('Thành Công', `Đã khởi tạo Năm Cấu Hình Level mới: ${nextYear}!`);
  };

  // Delete Level
  const handleDeleteLevel = (levelId: string, levelNumber: number) => {
    Alert.alert(
      'Xác nhận xóa Level',
      `Bạn có chắc chắn muốn xóa Level ${levelNumber} của Năm ${selectedYear} không?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa Level',
          style: 'destructive',
          onPress: () => {
            setDeptLevelConfigs((prev) => {
              const currentList = prev[currentConfigKey] || createDefault12Levels(activeDept.name, selectedYear);
              const updatedList = currentList.filter((l) => l.id !== levelId);

              const socket = getSocket();
              if (socket) {
                socket.emit('level:config:update', { departmentId: selectedDeptId, year: selectedYear, levels: updatedList });
              }

              return { ...prev, [currentConfigKey]: updatedList };
            });
          },
        },
      ]
    );
  };

  // Dynamic Add New Level
  const handleAddNewLevel = () => {
    const nextLevelNum = activeLevels.length + 1;
    const newLevelItem: AdminLevelItem = {
      id: `lvl-${selectedYear}-${Date.now()}`,
      levelNumber: nextLevelNum,
      levelName: `Level ${nextLevelNum}`,
      colorHex: '#0F172A',
      rewardType: 'HYBRID',
      promotionBonusAmount: 25000000,
      physicalItemName: `Quà Thưởng Đặc Biệt Level ${nextLevelNum} - Năm ${selectedYear}`,
      retentionFloorGmv: 3000,
      promotionCeilingGmv: 8000,
      retentionMultiplier: 3.5,
      project: {
        projectName: `Dự Án Thách Thức Level ${nextLevelNum} - Năm ${selectedYear} (${activeDept.name})`,
        subTaskBullets: ['• Hoàn thành 100% KPI chỉ tiêu đặc biệt'],
      },
    };

    setDeptLevelConfigs((prev) => {
      const currentList = prev[currentConfigKey] || createDefault12Levels(activeDept.name, selectedYear);
      const updatedList = [...currentList, newLevelItem];
      
      const socket = getSocket();
      if (socket) {
        socket.emit('level:config:update', { departmentId: selectedDeptId, year: selectedYear, levels: updatedList });
      }

      return { ...prev, [currentConfigKey]: updatedList };
    });

    Alert.alert('Thành Công', `Đã khởi tạo thêm Level ${nextLevelNum} cho Năm ${selectedYear} - Phòng ${activeDept.name}!`);
  };

  const handleUpdateLevelProjectName = (levelNumber: number, newProjectName: string) => {
    setDeptLevelConfigs((prev) => {
      const currentList = prev[currentConfigKey] || createDefault12Levels(activeDept.name, selectedYear);
      const updatedList = currentList.map((item) =>
        item.levelNumber === levelNumber
          ? { ...item, project: { ...item.project, projectName: newProjectName } }
          : item
      );

      const socket = getSocket();
      if (socket) {
        socket.emit('level:config:update', { departmentId: selectedDeptId, year: selectedYear, levels: updatedList });
      }

      return { ...prev, [currentConfigKey]: updatedList };
    });
  };

  const handleAddSubTaskToLevel = (levelNumber: number, bulletText: string) => {
    const formattedBullet = bulletText.startsWith('•') ? bulletText : `• ${bulletText}`;
    setDeptLevelConfigs((prev) => {
      const currentList = prev[currentConfigKey] || createDefault12Levels(activeDept.name, selectedYear);
      const updatedList = currentList.map((item) => {
        if (item.levelNumber === levelNumber) {
          return {
            ...item,
            project: {
              ...item.project,
              subTaskBullets: [...(item.project.subTaskBullets || []), formattedBullet],
            },
          };
        }
        return item;
      });

      const socket = getSocket();
      if (socket) {
        socket.emit('level:config:update', { departmentId: selectedDeptId, year: selectedYear, levels: updatedList });
      }

      return { ...prev, [currentConfigKey]: updatedList };
    });
  };

  const handleEditSubTaskInLevel = (levelNumber: number, bulletIndex: number, newBulletText: string) => {
    const formattedBullet = newBulletText.startsWith('•') ? newBulletText : `• ${newBulletText}`;
    setDeptLevelConfigs((prev) => {
      const currentList = prev[currentConfigKey] || createDefault12Levels(activeDept.name, selectedYear);
      const updatedList = currentList.map((item) => {
        if (item.levelNumber === levelNumber) {
          const updatedBullets = [...(item.project.subTaskBullets || [])];
          updatedBullets[bulletIndex] = formattedBullet;
          return { ...item, project: { ...item.project, subTaskBullets: updatedBullets } };
        }
        return item;
      });

      const socket = getSocket();
      if (socket) {
        socket.emit('level:config:update', { departmentId: selectedDeptId, year: selectedYear, levels: updatedList });
      }

      return { ...prev, [currentConfigKey]: updatedList };
    });
  };

  const handleDeleteSubTaskInLevel = (levelNumber: number, bulletIndex: number) => {
    setDeptLevelConfigs((prev) => {
      const currentList = prev[currentConfigKey] || createDefault12Levels(activeDept.name, selectedYear);
      const updatedList = currentList.map((item) => {
        if (item.levelNumber === levelNumber) {
          const updatedBullets = (item.project.subTaskBullets || []).filter((_, idx) => idx !== bulletIndex);
          return { ...item, project: { ...item.project, subTaskBullets: updatedBullets } };
        }
        return item;
      });

      const socket = getSocket();
      if (socket) {
        socket.emit('level:config:update', { departmentId: selectedDeptId, year: selectedYear, levels: updatedList });
      }

      return { ...prev, [currentConfigKey]: updatedList };
    });
  };

  const handleSaveModalItem = () => {
    if (!editingItem) return;
    setDeptLevelConfigs((prev) => {
      const currentList = prev[currentConfigKey] || createDefault12Levels(activeDept.name, selectedYear);
      const updatedList = currentList.map((item) => (item.id === editingItem.id ? editingItem : item));

      const socket = getSocket();
      if (socket) {
        socket.emit('level:config:update', { departmentId: selectedDeptId, year: selectedYear, levels: updatedList });
      }

      return { ...prev, [currentConfigKey]: updatedList };
    });
    Alert.alert('Thành Công', `Đã lưu quà thưởng cho ${editingItem.levelName} - Phòng ${activeDept.name}!`);
    setEditingItem(null);
  };

  // Build Department Summaries for Page 1
  const deptSummaries: DepartmentSummaryItem[] = departments.map((d) => {
    const key = `${d.id}_${selectedYear}`;
    const list = deptLevelConfigs[key] || createDefault12Levels(d.name, selectedYear);
    const topItem = list.find((l) => l.levelNumber === 12) || list[list.length - 1];
    return {
      id: d.id,
      name: d.name,
      totalLevels: list.length,
      topRewardName: topItem ? topItem.physicalItemName : 'Kỳ Nghỉ Châu Âu + Thưởng Năm Lớn',
    };
  });

  return (
    <View style={styles.rootContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#1E293B" />

      {/* Top Header Safe Area (Navy Blue #1E293B) */}
      <SafeAreaView style={styles.headerSafeArea}>
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
      </SafeAreaView>

      {/* Page Content Switcher & Bottom Container (Clean White #F8FAFC) */}
      <View style={styles.pageBodyContainer}>
        {isLoading && departments.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.loadingText}>Đang tải danh sách phòng ban thật từ Database Postgres...</Text>
          </View>
        ) : (
          <>
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
                selectedYear={selectedYear}
                availableYears={availableYears}
                onSelectYear={setSelectedYear}
                onAddNewYear={handleAddNewYear}
                onEditLevelReward={(lvl) => setEditingItem({ ...lvl })}
                onDeleteLevel={handleDeleteLevel}
                onAddNewLevel={handleAddNewLevel}
                onNextToProjects={() => setActiveStep(3)}
              />
            )}

            {activeStep === 3 && (
              <AdminLevelProjectsPage
                departmentName={activeDept.name}
                levels={activeLevels}
                selectedYear={selectedYear}
                availableYears={availableYears}
                onSelectYear={setSelectedYear}
                onUpdateLevelProjectName={handleUpdateLevelProjectName}
                onAddSubTaskToLevel={handleAddSubTaskToLevel}
                onEditSubTaskInLevel={handleEditSubTaskInLevel}
                onDeleteSubTaskInLevel={handleDeleteSubTaskInLevel}
                onSaveAllAndSync={() => {
                  Alert.alert(
                    'Đã Lưu & Đồng Bộ Thành Công!',
                    `Đã lưu toàn bộ Cấu hình Level, Quà thưởng & Dự án cho phòng ban ${activeDept.name} (Năm ${selectedYear}). Dữ liệu đã đồng bộ Real-time tới Leader và Nhân viên!`,
                    [{ text: 'Về Trang Chủ Admin', onPress: () => setActiveStep(1) }]
                  );
                }}
              />
            )}
          </>
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
    </View>
  );
};

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerSafeArea: {
    backgroundColor: '#1E293B',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 12,
    textAlign: 'center',
  },
  pageBodyContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  executiveHeaderCard: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  executiveBadgeTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#94A3B8',
    letterSpacing: 1.2,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
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
    backgroundColor: '#334155',
  },
  stepNumber: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#475569',
    color: '#CBD5E1',
    textAlign: 'center',
    fontSize: 11,
    fontWeight: 'bold',
    lineHeight: 20,
  },
  stepNumberActive: {
    backgroundColor: '#2563EB',
    color: '#FFFFFF',
  },
  stepTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  stepTitleActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  stepDivider: {
    flex: 1,
    height: 1,
    backgroundColor: '#475569',
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
