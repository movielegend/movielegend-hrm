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
import * as SecureStore from 'expo-secure-store';
import { useDepartments } from '../../hooks/useDepartments';
import { useSocketStatus } from '../../providers/SocketProvider';
import { levelingApi } from '../../api/leveling.api';
import { apiClient } from '../../api/client';

import { useAuth } from '../../providers/AuthProvider';
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
  physicalItems?: string[];
  retentionFloorGmv: number;
  promotionCeilingGmv: number;
  retentionMultiplier: number;
  allowanceAmount?: number;
  perks?: string[];
  motivationQuote?: string;
  project: LevelStageProject;
}

export const AdminLevelConfigScreen: React.FC = () => {
  const { user } = useAuth();
  const { data: realDeptData, isLoading } = useDepartments({ limit: 100 });
  const { getSocket } = useSocketStatus();

  const realDeptList = (realDeptData as any)?.data || (realDeptData as any)?.items || (Array.isArray(realDeptData) ? realDeptData : []);
  const departments: Array<{ id: string; name: string }> = realDeptList.map((d: any) => ({ id: d.id || d._id, name: d.name || 'Phòng ban' }));

  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');

  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [availableYears, setAvailableYears] = useState<number[]>([2025, 2026, 2027]);

  useEffect(() => {
    if (departments.length > 0 && (!selectedDeptId || !departments.some((d: any) => d.id === selectedDeptId))) {
      const firstId = departments[0]?.id;
      if (firstId) setSelectedDeptId(firstId);
    }
  }, [departments, selectedDeptId]);

  // Default 12 Levels Config representing 12 Months of the Year (Clean Template)
  const createDefault12Levels = (deptName: string, year: number): AdminLevelItem[] => {
    const colors = [
      '#64748B', '#2563EB', '#0D9488', '#7C3AED', '#EA580C', '#DC2626',
      '#D97706', '#881337', '#4F46E5', '#059669', '#0284C7', '#9333EA',
    ];

    return Array.from({ length: 12 }, (_, i) => {
      const lvlNum = i + 1;
      return {
        id: `lvl-${year}-${lvlNum}`,
        levelNumber: lvlNum,
        levelName: `Level ${lvlNum}`,
        colorHex: colors[i % colors.length] ?? '#2563EB',
        rewardType: 'HYBRID',
        promotionBonusAmount: 0,
        physicalItemName: '',
        retentionFloorGmv: 0,
        promotionCeilingGmv: 0,
        retentionMultiplier: 1.0,
        project: {
          projectName: '',
          subTaskBullets: [],
        },
      };
    });
  };

  const [deptLevelConfigs, setDeptLevelConfigs] = useState<Record<string, AdminLevelItem[]>>({});
  const [editingItem, setEditingItem] = useState<AdminLevelItem | null>(null);

  const activeDept = departments.find((d) => d.id === selectedDeptId) || departments[0] || { id: 'default', name: 'Phòng Ban' };
  const currentConfigKey = `${selectedDeptId}_${selectedYear}`;
  const activeLevels = deptLevelConfigs[currentConfigKey] || createDefault12Levels(activeDept.name, selectedYear);

  // Load existing department config from Backend
  useEffect(() => {
    if (!selectedDeptId) return;
    let isMounted = true;
    void levelingApi
      .getAdminDepartmentConfig(selectedDeptId, selectedYear, activeDept.name)
      .then((data) => {
        if (isMounted) {
          if (Array.isArray(data) && data.length > 0) {
            setDeptLevelConfigs((prev) => ({
              ...prev,
              [currentConfigKey]: data,
            }));
          } else {
            setDeptLevelConfigs((prev) => ({
              ...prev,
              [currentConfigKey]: createDefault12Levels(activeDept.name, selectedYear),
            }));
          }
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [selectedDeptId, selectedYear, activeDept.name, currentConfigKey]);

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

    const handleDataReset = () => {
      setDeptLevelConfigs({});
    };

    socket.on('level:config:updated', handleLevelConfigUpdated);
    socket.on('level:updated', handleLevelConfigUpdated);
    socket.on('level:data_reset', handleDataReset);

    return () => {
      socket.off('level:config:updated', handleLevelConfigUpdated);
      socket.off('level:updated', handleLevelConfigUpdated);
      socket.off('level:data_reset', handleDataReset);
    };
  }, [selectedDeptId, selectedYear, getSocket]);

  const syncConfigToBackend = (updatedList: AdminLevelItem[]) => {
    void levelingApi
      .saveAdminDepartmentConfig({
        departmentId: selectedDeptId,
        departmentName: activeDept.name,
        year: selectedYear,
        levels: updatedList,
      })
      .catch(() => {});

    const socket = getSocket();
    if (socket) {
      socket.emit('level:config:update', {
        departmentId: selectedDeptId,
        departmentName: activeDept.name,
        year: selectedYear,
        levels: updatedList,
      });
    }
  };

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
      promotionBonusAmount: 0,
      physicalItemName: '',
      retentionFloorGmv: 0,
      promotionCeilingGmv: 0,
      retentionMultiplier: 1.0,
      project: {
        projectName: '',
        subTaskBullets: [],
      },
    };

    setDeptLevelConfigs((prev) => {
      const currentList = prev[currentConfigKey] || createDefault12Levels(activeDept.name, selectedYear);
      const updatedList = [...currentList, newLevelItem];
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
      return { ...prev, [currentConfigKey]: updatedList };
    });
  };

  const handleSaveModalItem = () => {
    if (!editingItem) return;
    setDeptLevelConfigs((prev) => {
      const currentList = prev[currentConfigKey] || createDefault12Levels(activeDept.name, selectedYear);
      const updatedList = currentList.map((item) => (item.id === editingItem.id ? editingItem : item));
      return { ...prev, [currentConfigKey]: updatedList };
    });
    Alert.alert('Thành Công', `Đã lưu quà thưởng cho ${editingItem.levelName} - Phòng ${activeDept.name}!`);
    setEditingItem(null);
  };

  const handleSaveAllAndSync = async () => {
    try {
      await levelingApi.saveAdminDepartmentConfig({
        departmentId: selectedDeptId,
        departmentName: activeDept.name,
        year: selectedYear,
        levels: activeLevels,
      });

      const socket = getSocket();
      if (socket) {
        socket.emit('level:config:update', {
          departmentId: selectedDeptId,
          departmentName: activeDept.name,
          year: selectedYear,
          levels: activeLevels,
        });
      }

      Alert.alert(
        'Đã Lưu & Đồng Bộ Thành Công!',
        `Đã lưu toàn bộ Cấu hình Level, Quà thưởng & Dự án cho phòng ban ${activeDept.name} (Năm ${selectedYear}). Dữ liệu đã đồng bộ Real-time tới Leader và Nhân viên!`,
        [{ text: 'Về Trang Chủ Admin', onPress: () => setActiveStep(1) }]
      );
    } catch {
      Alert.alert(
        'Thành Công',
        `Đã lưu và phát lệnh đồng bộ cho phòng ban ${activeDept.name}.`
      );
    }
  };

  const handleResetAllData = () => {
    Alert.alert(
      'XÁC NHẬN XÓA SẠCH DỮ LIỆU TEST',
      'Bạn có chắc chắn muốn xóa sạch toàn bộ dữ liệu cấu hình Level, Dự án, Việc con & Duyệt thi đua để test lại từ đầu không?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa Sạch Dữ Liệu Test',
          style: 'destructive',
          onPress: async () => {
            try {
              // 1. Reset backend config via existing /admin/config endpoint
              await levelingApi.saveAdminDepartmentConfig({
                departmentId: selectedDeptId || 'dept-1',
                departmentName: activeDept.name || 'Phòng ban',
                year: selectedYear || 2026,
                levels: [],
              }).catch(() => {});

              // 2. Reset backend via reset-data if available
              await apiClient.post('/leveling/admin/reset-data').catch(() => {});

              // 3. Delete all approved user level keys in SecureStore
              const existingIdsRaw = await SecureStore.getItemAsync('ALL_APPROVED_USER_IDS').catch(() => null);
              if (existingIdsRaw) {
                try {
                  const ids = JSON.parse(existingIdsRaw);
                  if (Array.isArray(ids)) {
                    for (const uid of ids) {
                      await SecureStore.deleteItemAsync(`USER_APPROVED_LEVEL_${uid}`).catch(() => {});
                    }
                  }
                } catch {}
              }

              // Also clear current user approved level key
              if (user?.id) {
                await SecureStore.deleteItemAsync(`USER_APPROVED_LEVEL_${user.id}`).catch(() => {});
              }

              await SecureStore.deleteItemAsync('ALL_APPROVED_USER_IDS').catch(() => {});
              await SecureStore.deleteItemAsync('LEADER_ROUND1_SUBMITTED_USERS').catch(() => {});
              await SecureStore.deleteItemAsync('ADMIN_PENDING_ROUND1_REVIEWS').catch(() => {});
              await SecureStore.deleteItemAsync('ML_LEVEL_DEPARTMENT_PROJECTS_V6').catch(() => {});

              // Save global data reset timestamp
              const resetTime = Date.now();
              await SecureStore.setItemAsync('LAST_DATA_RESET_TIMESTAMP', String(resetTime)).catch(() => {});

              // 4. Broadcast socket reset event
              const socket = getSocket();
              if (socket) {
                socket.emit('level:data_reset', { resetAt: resetTime });
              }

              setDeptLevelConfigs({});
              Alert.alert('Thành Công', 'Đã xóa sạch dữ liệu! Bạn có thể bắt đầu test lại từ đầu.');
            } catch {
              setDeptLevelConfigs({});
              Alert.alert('Thành Công', 'Đã xóa sạch dữ liệu local và sẵn sàng test lại!');
            }
          },
        },
      ]
    );
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
      topRewardName: topItem && topItem.physicalItemName ? topItem.physicalItemName : 'Chưa cấu hình',
    };
  });

  return (
    <View style={styles.rootContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#1E293B" />

      {/* Top Header Safe Area (Navy Blue #1E293B) */}
      <SafeAreaView style={styles.headerSafeArea}>
        {/* Executive Header Card */}
        <View style={styles.executiveHeaderCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Quản Lý Cấu Hình Level 3 Bước Khoa Học</Text>
            </View>
            <TouchableOpacity
              style={{ backgroundColor: '#EF4444', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}
              onPress={handleResetAllData}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' }}>🗑 XÓA DATA TEST</Text>
            </TouchableOpacity>
          </View>
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
                onSaveAllAndSync={handleSaveAllAndSync}
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
              <ScrollView style={{ maxHeight: 460 }} showsVerticalScrollIndicator={false}>
                <Text style={styles.inputLabel}>Tên Cấp Bậc:</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editingItem.levelName}
                  onChangeText={(text) => setEditingItem({ ...editingItem, levelName: text })}
                />

                <Text style={styles.inputLabel}>Hình Thức Phần Thưởng:</Text>
                <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12 }}>
                  <TouchableOpacity
                    style={[
                      styles.rewardTypeOption,
                      editingItem.rewardType === 'CASH' && styles.rewardTypeOptionActive,
                    ]}
                    onPress={() => setEditingItem({ ...editingItem, rewardType: 'CASH' })}
                  >
                    <Text
                      style={[
                        styles.rewardTypeOptionText,
                        editingItem.rewardType === 'CASH' && styles.rewardTypeOptionTextActive,
                      ]}
                    >
                      💵 Tiền mặt
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.rewardTypeOption,
                      editingItem.rewardType === 'PHYSICAL_ITEM' && styles.rewardTypeOptionActive,
                    ]}
                    onPress={() => setEditingItem({ ...editingItem, rewardType: 'PHYSICAL_ITEM' })}
                  >
                    <Text
                      style={[
                        styles.rewardTypeOptionText,
                        editingItem.rewardType === 'PHYSICAL_ITEM' && styles.rewardTypeOptionTextActive,
                      ]}
                    >
                      🎁 Hiện vật
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.rewardTypeOption,
                      editingItem.rewardType === 'HYBRID' && styles.rewardTypeOptionActive,
                    ]}
                    onPress={() => setEditingItem({ ...editingItem, rewardType: 'HYBRID' })}
                  >
                    <Text
                      style={[
                        styles.rewardTypeOptionText,
                        editingItem.rewardType === 'HYBRID' && styles.rewardTypeOptionTextActive,
                      ]}
                    >
                      ✨ Cả hai (Kết hợp)
                    </Text>
                  </TouchableOpacity>
                </View>

                {(editingItem.rewardType === 'CASH' || editingItem.rewardType === 'HYBRID') && (
                  <View style={{ marginBottom: 12 }}>
                    <Text style={styles.inputLabel}>Tổng Quỹ Thưởng Tiền Mặt (VNĐ):</Text>
                    <TextInput
                      style={styles.modalInput}
                      keyboardType="number-pad"
                      placeholder="VD: 20000000"
                      placeholderTextColor="#94A3B8"
                      value={editingItem.promotionBonusAmount > 0 ? String(editingItem.promotionBonusAmount) : ''}
                      onChangeText={(text) =>
                        setEditingItem({
                          ...editingItem,
                          promotionBonusAmount: Number(text.replace(/[^0-9]/g, '')) || 0,
                        })
                      }
                    />
                    {editingItem.promotionBonusAmount > 0 && (
                      <Text style={styles.moneyPreviewText}>
                        💰 {editingItem.promotionBonusAmount.toLocaleString('vi-VN')} VNĐ (Tự động chia theo Hệ số Level của nhân viên tham gia)
                      </Text>
                    )}
                  </View>
                )}

                {(editingItem.rewardType === 'PHYSICAL_ITEM' || editingItem.rewardType === 'HYBRID') && (
                  <View style={{ marginBottom: 12 }}>
                    <Text style={styles.inputLabel}>
                      Quà Hiện Vật (Nhập 1 hoặc nhiều món, ngăn cách bằng dấu phẩy):
                    </Text>
                    <TextInput
                      style={[styles.modalInput, { minHeight: 60, textAlignVertical: 'top' }]}
                      placeholder="VD: 1 Chuyến dã ngoại, 3 Tai nghe Sony, 1 Cúp vinh danh"
                      placeholderTextColor="#94A3B8"
                      multiline
                      value={editingItem.physicalItemName}
                      onChangeText={(text) => {
                        const items = text.split(/[,;\n]+/).map((s) => s.trim()).filter(Boolean);
                        setEditingItem({
                          ...editingItem,
                          physicalItemName: text,
                          physicalItems: items,
                        });
                      }}
                    />
                    <Text style={styles.itemNoteText}>
                      📦 Quà hiện vật sẽ được lưu trữ và hiển thị chung cho toàn đội tham gia.
                    </Text>
                  </View>
                )}

                {/* PHỤ LỤC QUYỀN LỢI & ĐẶC QUYỀN THĂNG CẤP */}
                <View style={{ marginBottom: 12 }}>
                  <Text style={styles.inputLabel}>Hệ Số Ví Điểm Thưởng Tết:</Text>
                  <TextInput
                    style={styles.modalInput}
                    keyboardType="numeric"
                    placeholder="VD: 1.5"
                    placeholderTextColor="#94A3B8"
                    value={String(editingItem.retentionMultiplier || 1.0)}
                    onChangeText={(text) =>
                      setEditingItem({
                        ...editingItem,
                        retentionMultiplier: Number(text) || 1.0,
                      })
                    }
                  />
                </View>

                <View style={{ marginBottom: 12 }}>
                  <Text style={styles.inputLabel}>Phụ Cấp Chuyên Môn / Chức Danh (VNĐ/tháng):</Text>
                  <TextInput
                    style={styles.modalInput}
                    keyboardType="number-pad"
                    placeholder="VD: 1000000"
                    placeholderTextColor="#94A3B8"
                    value={editingItem.allowanceAmount ? String(editingItem.allowanceAmount) : ''}
                    onChangeText={(text) =>
                      setEditingItem({
                        ...editingItem,
                        allowanceAmount: Number(text.replace(/[^0-9]/g, '')) || 0,
                      })
                    }
                  />
                </View>

                <View style={{ marginBottom: 12 }}>
                  <Text style={styles.inputLabel}>
                    Danh Sách Quyền Lợi & Đặc Quyền Mở Khóa (Mỗi quyền lợi 1 dòng):
                  </Text>
                  <TextInput
                    style={[styles.modalInput, { minHeight: 70, textAlignVertical: 'top' }]}
                    placeholder="VD:&#10;• Ký HĐLĐ chính thức&#10;• Ưu tiên chọn ca làm&#10;• Mở khóa nhận việc con dự án"
                    placeholderTextColor="#94A3B8"
                    multiline
                    value={
                      Array.isArray(editingItem.perks)
                        ? editingItem.perks.join('\n')
                        : ''
                    }
                    onChangeText={(text) => {
                      const list = text
                        .split('\n')
                        .map((s) => s.replace(/^[•\-\*]\s*/, '').trim())
                        .filter(Boolean);
                      setEditingItem({
                        ...editingItem,
                        perks: list,
                      });
                    }}
                  />
                </View>

                <View style={{ marginBottom: 12 }}>
                  <Text style={styles.inputLabel}>Thông Điệp Động Lực Thăng Cấp (Phụ lục):</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="VD: Nỗ lực hôm nay là nền tảng cho sự nghiệp ngày mai!"
                    placeholderTextColor="#94A3B8"
                    value={editingItem.motivationQuote || ''}
                    onChangeText={(text) =>
                      setEditingItem({
                        ...editingItem,
                        motivationQuote: text,
                      })
                    }
                  />
                </View>

                <View style={styles.rewardGuideBox}>
                  <Text style={styles.rewardGuideText}>
                    💡 <Text style={{ fontWeight: 'bold' }}>Phụ lục quyền lợi:</Text> Toàn bộ phần thưởng, phụ cấp, hệ số và đặc quyền cấu hình tại đây sẽ tự động hiển thị trong Phụ Lục Quyền Lợi Level Tiếp Theo của nhân sự để tạo động lực thăng cấp.
                  </Text>
                </View>
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
  rewardTypeOption: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardTypeOptionActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  rewardTypeOptionText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
  },
  rewardTypeOptionTextActive: {
    color: '#1D4ED8',
    fontWeight: 'bold',
  },
  moneyPreviewText: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
    marginTop: 4,
    lineHeight: 16,
  },
  itemNoteText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 16,
  },
  rewardGuideBox: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 8,
    padding: 10,
    marginTop: 6,
  },
  rewardGuideText: {
    fontSize: 11,
    color: '#166534',
    lineHeight: 16,
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
