import React, { useState, useEffect, useMemo } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Screen } from '../../components/Screen';
import { PageHeader } from '../../components/PageHeader';
import { SelectModal, SelectOption } from '../../components/SelectModal';
import { useAppAlert } from '../../contexts/AlertContext';
import { useDepartments } from '../../hooks/useDepartments';
import { levelingApi, DepartmentLevelItem } from '../../api/leveling.api';
import { LEVEL_DEFAULT_NAMES } from '../../components/common/LevelNameBadge';

export interface AdminProjectItem {
  id: string;
  projectName: string;
  rewardType: 'CASH' | 'PHYSICAL_ITEM' | 'HYBRID';
  promotionBonusAmount: number;
  physicalItemName: string;
  status: 'IN_PROGRESS' | 'ADMIN_APPROVED';
  subTasks: string[];
}

export function AdminLevelConfigScreen() {
  const router = useRouter();
  const { showAlert, showConfirm } = useAppAlert();

  // Active top tab: 'ranks' (Danh xưng) | 'projects' (Dự án)
  const [activeTab, setActiveTab] = useState<'ranks' | 'projects'>('ranks');

  // Department selector state
  const { data: deptData, isLoading: isDeptsLoading } = useDepartments({ limit: 100 });
  const departments = useMemo(() => {
    const raw = (deptData as any)?.data || (deptData as any)?.items || (Array.isArray(deptData) ? deptData : []);
    return raw.map((d: any) => ({
      id: d.id || d._id,
      name: d.name || 'Phòng ban',
      branchName: d.branch?.name || '',
    }));
  }, [deptData]);

  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const [showDeptModal, setShowDeptModal] = useState(false);

  useEffect(() => {
    if (departments.length > 0 && !selectedDeptId) {
      setSelectedDeptId(departments[0].id);
    }
  }, [departments, selectedDeptId]);

  const activeDept = departments.find((d: any) => d.id === selectedDeptId) || departments[0];
  const activeDeptName = activeDept?.name || 'Kinh Doanh';
  const activeBranchName = activeDept?.branchName || 'MOVIELEGEND-HÀ NỘI';

  const deptSelectOptions: SelectOption[] = useMemo(() => {
    return departments.map((d: any) => ({
      id: d.id,
      label: d.branchName ? `${d.name} (${d.branchName})` : d.name,
    }));
  }, [departments]);

  // ── Tab 1: Danh xưng cấp bậc state ──
  const [levels, setLevels] = useState<DepartmentLevelItem[]>([]);
  const [isLoadingLevels, setIsLoadingLevels] = useState(false);
  const [isSavingLevels, setIsSavingLevels] = useState(false);

  const default12Levels = useMemo<DepartmentLevelItem[]>(() => {
    return Array.from({ length: 8 }, (_, i) => {
      const lvl = i + 1;
      const defName = LEVEL_DEFAULT_NAMES[lvl] || `Level ${lvl}`;
      return {
        levelNumber: lvl,
        levelName: `Level ${lvl}`,
        defaultName: defName,
        customLevelName: defName,
        displayName: defName,
        badgeTitle: defName,
        colorHex: '#2563EB',
        minTenureMonths: lvl * 3,
        targetShiftsCount: lvl * 15,
        rewardType: 'HYBRID',
        promotionBonusAmount: lvl === 1 ? 0 : (lvl - 1) * 500000,
        physicalItemName: '',
      };
    });
  }, []);

  // Fetch Department Level Configs
  useEffect(() => {
    if (!selectedDeptId) return;
    let isMounted = true;
    setIsLoadingLevels(true);

    levelingApi
      .getDepartmentLevelConfigs(selectedDeptId)
      .then((data) => {
        if (!isMounted) return;
        if (Array.isArray(data) && data.length > 0) {
          const sorted = [...data].sort((a, b) => a.levelNumber - b.levelNumber);
          setLevels(sorted);
        } else {
          setLevels(default12Levels);
        }
      })
      .catch(() => {
        if (isMounted) setLevels(default12Levels);
      })
      .finally(() => {
        if (isMounted) setIsLoadingLevels(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedDeptId, default12Levels]);

  const handleLevelNameChange = (lvlNum: number, text: string) => {
    setLevels((prev) =>
      prev.map((l) => (l.levelNumber === lvlNum ? { ...l, customLevelName: text, displayName: text } : l))
    );
  };

  const handleRewardTypeChange = (lvlNum: number, rType: 'CASH' | 'PHYSICAL_ITEM' | 'HYBRID') => {
    setLevels((prev) =>
      prev.map((l) => (l.levelNumber === lvlNum ? { ...l, rewardType: rType } : l))
    );
  };

  const handleBonusAmountChange = (lvlNum: number, val: string) => {
    const numeric = parseInt(val.replace(/\D/g, ''), 10) || 0;
    setLevels((prev) =>
      prev.map((l) => (l.levelNumber === lvlNum ? { ...l, promotionBonusAmount: numeric } : l))
    );
  };

  const handlePhysicalItemChange = (lvlNum: number, val: string) => {
    setLevels((prev) =>
      prev.map((l) => (l.levelNumber === lvlNum ? { ...l, physicalItemName: val } : l))
    );
  };

  const handleRemoveLevel = (lvlNum: number) => {
    if (lvlNum === 1) return;
    showConfirm({
      title: 'Xóa cấp bậc',
      message: `Bạn có chắc muốn xóa Level ${lvlNum} khỏi danh sách cấp bậc của phòng ban này không?`,
      confirmLabel: 'Xóa',
      confirmTone: 'danger',
      onConfirm: () => {
        setLevels((prev) => prev.filter((l) => l.levelNumber !== lvlNum));
      },
    });
  };

  const handleAddLevel = () => {
    const nextNum = levels.length > 0 ? Math.max(...levels.map((l) => l.levelNumber)) + 1 : 1;
    const defName = LEVEL_DEFAULT_NAMES[nextNum] || `Level ${nextNum}`;
    const newLvl: DepartmentLevelItem = {
      levelNumber: nextNum,
      levelName: `Level ${nextNum}`,
      defaultName: defName,
      customLevelName: defName,
      displayName: defName,
      badgeTitle: defName,
      colorHex: '#2563EB',
      minTenureMonths: nextNum * 3,
      targetShiftsCount: nextNum * 15,
      rewardType: 'HYBRID',
      promotionBonusAmount: 1000000,
      physicalItemName: '',
    };
    setLevels((prev) => [...prev, newLvl]);
  };

  const handleSaveLevelsConfig = async () => {
    if (!selectedDeptId) return;
    try {
      setIsSavingLevels(true);
      await levelingApi.saveDepartmentLevelConfigs(
        selectedDeptId,
        levels.map((l) => ({
          levelNumber: l.levelNumber,
          customLevelName: l.customLevelName || l.defaultName,
          badgeTitle: l.customLevelName || l.defaultName,
          rewardType: l.rewardType || 'HYBRID',
          promotionBonusAmount: l.promotionBonusAmount || 0,
          physicalItemName: l.physicalItemName || '',
          allowanceAmount: l.allowanceAmount || 0,
          retentionMultiplier: l.retentionMultiplier || 1.0,
          perks: l.perks || [],
        }))
      );
      showAlert('Thành công', `Đã lưu cấu hình danh xưng & phần thưởng cho phòng ${activeDeptName}!`);
    } catch (err: any) {
      showAlert('Lỗi', err?.message || 'Không thể lưu cấu hình');
    } finally {
      setIsSavingLevels(false);
    }
  };

  // ── Tab 2: Dự án phòng ban state ──
  const [projectSubTab, setProjectSubTab] = useState<'active' | 'completed'>('active');
  const [projects, setProjects] = useState<AdminProjectItem[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);

  // Modal thêm/sửa dự án
  const [isProjectModalVisible, setIsProjectModalVisible] = useState(false);
  const [editingProject, setEditingProject] = useState<AdminProjectItem | null>(null);
  const [projNameInput, setProjNameInput] = useState('');
  const [projRewardType, setProjRewardType] = useState<'CASH' | 'PHYSICAL_ITEM' | 'HYBRID'>('CASH');
  const [projBonusInput, setProjBonusInput] = useState('');
  const [projPhysicalInput, setProjPhysicalInput] = useState('');
  const [subTasksList, setSubTasksList] = useState<string[]>([]);
  const [newSubTaskText, setNewSubTaskText] = useState('');

  // Load Projects from backend
  useEffect(() => {
    if (!selectedDeptId) return;
    let isMounted = true;
    setIsLoadingProjects(true);

    levelingApi
      .getProjects(selectedDeptId, activeDeptName)
      .then((data) => {
        if (!isMounted) return;
        if (Array.isArray(data)) {
          const converted: AdminProjectItem[] = data.map((p) => ({
            id: p.id,
            projectName: p.projectName,
            rewardType: (p.rewardType as any) || 'HYBRID',
            promotionBonusAmount: p.cashAmount || 0,
            physicalItemName: p.physicalItemName || p.rewardItem || '',
            status: p.status === 'ADMIN_APPROVED' ? 'ADMIN_APPROVED' : 'IN_PROGRESS',
            subTasks: (p.subTasks || []).map((st) => st.title),
          }));
          setProjects(converted);
        } else {
          setProjects([]);
        }
      })
      .catch(() => {
        if (isMounted) setProjects([]);
      })
      .finally(() => {
        if (isMounted) setIsLoadingProjects(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedDeptId, activeDeptName]);

  const activeProjects = useMemo(
    () => projects.filter((p) => p.status === 'IN_PROGRESS'),
    [projects]
  );
  const completedProjects = useMemo(
    () => projects.filter((p) => p.status === 'ADMIN_APPROVED'),
    [projects]
  );

  const handleOpenAddProject = () => {
    setEditingProject(null);
    setProjNameInput('');
    setProjRewardType('CASH');
    setProjBonusInput('');
    setProjPhysicalInput('');
    setSubTasksList([]);
    setNewSubTaskText('');
    setIsProjectModalVisible(true);
  };

  const handleAddSubTask = () => {
    const trimmed = newSubTaskText.trim();
    if (!trimmed) return;
    setSubTasksList((prev) => [...prev, trimmed]);
    setNewSubTaskText('');
  };

  const handleRemoveSubTask = (idx: number) => {
    setSubTasksList((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSaveProjectModal = async () => {
    if (!projNameInput.trim()) {
      showAlert('Lỗi', 'Vui lòng nhập tên dự án!');
      return;
    }
    const bonusNum = parseInt(projBonusInput.replace(/\D/g, ''), 10) || 0;

    const newProjectItem: AdminProjectItem = {
      id: editingProject ? editingProject.id : `proj-${Date.now()}`,
      projectName: projNameInput.trim(),
      rewardType: projRewardType,
      promotionBonusAmount: bonusNum,
      physicalItemName: projPhysicalInput.trim(),
      status: editingProject ? editingProject.status : 'IN_PROGRESS',
      subTasks: subTasksList,
    };

    let updatedProjects: AdminProjectItem[];
    if (editingProject) {
      updatedProjects = projects.map((p) => (p.id === editingProject.id ? newProjectItem : p));
    } else {
      updatedProjects = [...projects, newProjectItem];
    }

    setProjects(updatedProjects);
    setIsProjectModalVisible(false);

    // Sync to backend via saveAdminDepartmentConfig
    try {
      await levelingApi.saveAdminDepartmentConfig({
        departmentId: selectedDeptId,
        departmentName: activeDeptName,
        year: 2026,
        levels: updatedProjects.map((p, idx) => ({
          id: p.id,
          levelNumber: idx + 1,
          levelName: p.projectName,
          colorHex: '#2563EB',
          rewardType: p.rewardType,
          promotionBonusAmount: p.promotionBonusAmount,
          physicalItemName: p.physicalItemName,
          project: {
            projectName: p.projectName,
            subTaskBullets: p.subTasks,
          },
        })),
      });
      showAlert('Thành công', 'Đã lưu thông tin dự án!');
    } catch (err: any) {
      showAlert('Lưu dự án', 'Đã lưu dự án trên thiết bị.');
    }
  };

  return (
    <Screen>
      {/* ── Top Header ── */}
      <View style={styles.headerWrap}>
        <PageHeader
          title="Cấp bậc & Dự án"
          subtitle="Quản lý danh xưng, phần thưởng và dự án."
          showBack={true}
          onBack={() => (router.canGoBack() ? router.back() : router.replace('/admin/(tabs)' as any))}
        />
      </View>

      {/* ── Segmented Tabs: Danh xưng & Dự án ── */}
      <View style={styles.tabContainer}>
        <Pressable
          style={[styles.tabBtn, activeTab === 'ranks' && styles.tabBtnActive]}
          onPress={() => setActiveTab('ranks')}
        >
          <MaterialCommunityIcons
            name="tune-variant"
            size={18}
            color={activeTab === 'ranks' ? '#FFFFFF' : '#64748B'}
          />
          <Text style={[styles.tabBtnText, activeTab === 'ranks' && styles.tabBtnTextActive]}>
            Danh xưng
          </Text>
        </Pressable>

        <Pressable
          style={[styles.tabBtn, activeTab === 'projects' && styles.tabBtnActive]}
          onPress={() => setActiveTab('projects')}
        >
          <MaterialCommunityIcons
            name="briefcase-outline"
            size={18}
            color={activeTab === 'projects' ? '#FFFFFF' : '#64748B'}
          />
          <Text style={[styles.tabBtnText, activeTab === 'projects' && styles.tabBtnTextActive]}>
            Dự án
          </Text>
        </Pressable>
      </View>

      {/* ── Dropdown: Phòng ban quản trị ── */}
      <View style={styles.deptSection}>
        <Text style={styles.deptLabel}>Phòng ban quản trị</Text>
        <Pressable style={styles.deptSelectCard} onPress={() => setShowDeptModal(true)}>
          <View style={styles.deptCardLeft}>
            <View style={styles.deptIconBox}>
              <MaterialCommunityIcons name="account-group-outline" size={20} color="#64748B" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.deptNameText}>{activeDeptName}</Text>
              <Text style={styles.deptBranchText}>{activeBranchName}</Text>
            </View>
          </View>
          <Ionicons name="chevron-down" size={20} color="#64748B" />
        </Pressable>
      </View>

      {/* ── Main Body ScrollView ── */}
      <ScrollView
        style={styles.scrollBody}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'ranks' ? (
          /* ======================================================== */
          /* TAB 1: DANH XƯNG CẤP BẬC                                 */
          /* ======================================================== */
          <View>
            {/* Section Header */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Danh xưng cấp bậc</Text>
              <Text style={styles.sectionSubtitle}>
                Tùy chỉnh tên gọi và phần thưởng theo cấp bậc.
              </Text>
            </View>

            {isLoadingLevels ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="small" color="#0055D4" />
                <Text style={styles.loadingText}>Đang tải cấu hình cấp bậc...</Text>
              </View>
            ) : (
              <>
                {levels.map((lvl) => {
                  const isLevelOne = lvl.levelNumber === 1;
                  const padNum = String(lvl.levelNumber).padStart(2, '0');
                  const rType = lvl.rewardType || 'HYBRID';

                  return (
                    <View key={lvl.levelNumber} style={styles.levelCard}>
                      {/* Top Row: Badge + Title + Subtitle + (Trash if lvl > 1) */}
                      <View style={styles.cardHeaderRow}>
                        <View style={styles.cardBadge}>
                          <Text style={styles.cardBadgeText}>{padNum}</Text>
                        </View>
                        <View style={styles.cardTitleCol}>
                          <Text style={styles.cardTitle}>Level {lvl.levelNumber}</Text>
                          <Text style={styles.cardSubtitle}>
                            Mặc định: {lvl.defaultName || LEVEL_DEFAULT_NAMES[lvl.levelNumber] || 'Cấp bậc'}
                          </Text>
                        </View>
                        {!isLevelOne && (
                          <Pressable
                            onPress={() => handleRemoveLevel(lvl.levelNumber)}
                            hitSlop={8}
                            style={styles.trashBtn}
                          >
                            <Ionicons name="trash-outline" size={18} color="#EF4444" />
                          </Pressable>
                        )}
                      </View>

                      {/* Field: Tên danh xưng */}
                      <View style={styles.fieldGroup}>
                        <Text style={styles.fieldLabel}>Tên danh xưng</Text>
                        <TextInput
                          style={styles.textInput}
                          value={lvl.customLevelName}
                          onChangeText={(txt) => handleLevelNameChange(lvl.levelNumber, txt)}
                          placeholder={`Nhập tên gọi cho Level ${lvl.levelNumber}...`}
                          placeholderTextColor="#94A3B8"
                        />
                      </View>

                      {/* Level 1: Green Info Banner */}
                      {isLevelOne ? (
                        <View style={styles.levelOneAlert}>
                          <Ionicons name="information-circle-outline" size={18} color="#059669" />
                          <Text style={styles.levelOneAlertText}>
                            Cấp bậc khởi đầu • Không áp dụng thưởng thăng cấp.
                          </Text>
                        </View>
                      ) : (
                        /* Level 2+: Phần thưởng thăng cấp */
                        <View style={styles.rewardSection}>
                          <View style={styles.rewardTitleRow}>
                            <MaterialCommunityIcons name="gift-outline" size={18} color="#0055D4" />
                            <Text style={styles.rewardTitle}>Phần thưởng thăng cấp</Text>
                          </View>

                          {/* Hình thức thưởng */}
                          <Text style={styles.fieldLabel}>Hình thức thưởng</Text>
                          <View style={styles.rewardPillsRow}>
                            <Pressable
                              style={[
                                styles.rewardPill,
                                rType === 'CASH' && styles.rewardPillActive,
                              ]}
                              onPress={() => handleRewardTypeChange(lvl.levelNumber, 'CASH')}
                            >
                              <MaterialCommunityIcons
                                name="cash"
                                size={16}
                                color={rType === 'CASH' ? '#0055D4' : '#64748B'}
                              />
                              <Text
                                style={[
                                  styles.rewardPillText,
                                  rType === 'CASH' && styles.rewardPillTextActive,
                                ]}
                              >
                                Tiền mặt
                              </Text>
                            </Pressable>

                            <Pressable
                              style={[
                                styles.rewardPill,
                                rType === 'PHYSICAL_ITEM' && styles.rewardPillActive,
                              ]}
                              onPress={() => handleRewardTypeChange(lvl.levelNumber, 'PHYSICAL_ITEM')}
                            >
                              <MaterialCommunityIcons
                                name="package-variant-closed"
                                size={16}
                                color={rType === 'PHYSICAL_ITEM' ? '#0055D4' : '#64748B'}
                              />
                              <Text
                                style={[
                                  styles.rewardPillText,
                                  rType === 'PHYSICAL_ITEM' && styles.rewardPillTextActive,
                                ]}
                              >
                                Hiện vật
                              </Text>
                            </Pressable>

                            <Pressable
                              style={[
                                styles.rewardPill,
                                rType === 'HYBRID' && styles.rewardPillActive,
                              ]}
                              onPress={() => handleRewardTypeChange(lvl.levelNumber, 'HYBRID')}
                            >
                              <MaterialCommunityIcons
                                name="layers-outline"
                                size={16}
                                color={rType === 'HYBRID' ? '#0055D4' : '#64748B'}
                              />
                              <Text
                                style={[
                                  styles.rewardPillText,
                                  rType === 'HYBRID' && styles.rewardPillTextActive,
                                ]}
                              >
                                Kết hợp
                              </Text>
                            </Pressable>
                          </View>

                          {/* Tiền thưởng nóng thăng cấp (VND) */}
                          {(rType === 'CASH' || rType === 'HYBRID') && (
                            <View style={styles.fieldGroup}>
                              <Text style={styles.fieldLabel}>Tiền thưởng nóng thăng cấp (VND)</Text>
                              <View style={styles.suffixInputContainer}>
                                <TextInput
                                  style={styles.suffixTextInput}
                                  keyboardType="number-pad"
                                  placeholder="Nhập số tiền"
                                  placeholderTextColor="#94A3B8"
                                  value={
                                    lvl.promotionBonusAmount
                                      ? lvl.promotionBonusAmount.toLocaleString('vi-VN')
                                      : ''
                                  }
                                  onChangeText={(txt) => handleBonusAmountChange(lvl.levelNumber, txt)}
                                />
                                <View style={styles.suffixBox}>
                                  <Text style={styles.suffixText}>VND</Text>
                                </View>
                              </View>
                            </View>
                          )}

                          {/* Hiện vật thưởng */}
                          {(rType === 'PHYSICAL_ITEM' || rType === 'HYBRID') && (
                            <View style={styles.fieldGroup}>
                              <Text style={styles.fieldLabel}>Tên hiện vật thưởng thăng cấp</Text>
                              <TextInput
                                style={styles.textInput}
                                placeholder="VD: Đồng hồ thông minh, Bằng khen..."
                                placeholderTextColor="#94A3B8"
                                value={lvl.physicalItemName || ''}
                                onChangeText={(txt) => handlePhysicalItemChange(lvl.levelNumber, txt)}
                              />
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                  );
                })}

                {/* Add Level & Save Button Actions */}
                <View style={styles.bottomActions}>
                  <Pressable style={styles.addLevelBtn} onPress={handleAddLevel}>
                    <Ionicons name="add-circle-outline" size={20} color="#0055D4" />
                    <Text style={styles.addLevelBtnText}>Thêm cấp bậc mới</Text>
                  </Pressable>

                  <Pressable
                    style={[styles.saveBtn, isSavingLevels && { opacity: 0.7 }]}
                    onPress={handleSaveLevelsConfig}
                    disabled={isSavingLevels}
                  >
                    {isSavingLevels ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
                        <Text style={styles.saveBtnText}>Lưu cấu hình cấp bậc</Text>
                      </>
                    )}
                  </Pressable>
                </View>
              </>
            )}
          </View>
        ) : (
          /* ======================================================== */
          /* TAB 2: DỰ ÁN PHÒNG BAN                                   */
          /* ======================================================== */
          <View>
            {/* Section Header */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Dự án phòng ban</Text>
            </View>

            {/* Blue Info Banner */}
            <View style={styles.bannerCard}>
              <View style={styles.bannerIconBox}>
                <MaterialCommunityIcons name="briefcase-outline" size={22} color="#0055D4" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.bannerTitle}>Thiết lập dự án và đầu việc.</Text>
                <Text style={styles.bannerSubtitle}>
                  Dữ liệu được chuyển đến Leader để phân công cho nhân sự.
                </Text>
              </View>
            </View>

            {/* Sub-filter tabs: Đang chạy vs Hoàn thành */}
            <View style={styles.subFilterRow}>
              <Pressable
                style={[
                  styles.subFilterBtn,
                  projectSubTab === 'active' && styles.subFilterBtnActive,
                ]}
                onPress={() => setProjectSubTab('active')}
              >
                <Text
                  style={[
                    styles.subFilterBtnText,
                    projectSubTab === 'active' && styles.subFilterBtnTextActive,
                  ]}
                >
                  Đang chạy ({activeProjects.length})
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.subFilterBtn,
                  projectSubTab === 'completed' && styles.subFilterBtnActive,
                ]}
                onPress={() => setProjectSubTab('completed')}
              >
                <Text
                  style={[
                    styles.subFilterBtnText,
                    projectSubTab === 'completed' && styles.subFilterBtnTextActive,
                  ]}
                >
                  Hoàn thành ({completedProjects.length})
                </Text>
              </Pressable>
            </View>

            {/* Content List or Empty State */}
            {isLoadingProjects ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="small" color="#0055D4" />
                <Text style={styles.loadingText}>Đang tải dự án phòng ban...</Text>
              </View>
            ) : projectSubTab === 'active' ? (
              activeProjects.length === 0 ? (
                /* Empty State Card */
                <View style={styles.emptyCard}>
                  <MaterialCommunityIcons name="folder-outline" size={56} color="#94A3B8" />
                  <Text style={styles.emptyTitle}>Chưa có dự án</Text>
                  <Text style={styles.emptySubtitle}>
                    Phòng {activeDeptName} chưa có dự án nào.{'\n'}
                    Tạo dự án và các đầu việc để Leader phân công cho nhân sự.
                  </Text>
                  <Pressable style={styles.primaryAddBtn} onPress={handleOpenAddProject}>
                    <Ionicons name="add" size={20} color="#FFFFFF" />
                    <Text style={styles.primaryAddBtnText}>Thêm dự án mới</Text>
                  </Pressable>
                </View>
              ) : (
                /* Active Projects List */
                <View style={styles.projectsList}>
                  {activeProjects.map((proj) => (
                    <View key={proj.id} style={styles.projectCard}>
                      <View style={styles.projHeader}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.projTitle}>{proj.projectName}</Text>
                          {proj.promotionBonusAmount > 0 && (
                            <Text style={styles.projRewardText}>
                              Thưởng: {proj.promotionBonusAmount.toLocaleString('vi-VN')} VND
                            </Text>
                          )}
                          {proj.physicalItemName ? (
                            <Text style={styles.projRewardText}>Quà: {proj.physicalItemName}</Text>
                          ) : null}
                        </View>
                        <View style={styles.statusPill}>
                          <Text style={styles.statusPillText}>Đang chạy</Text>
                        </View>
                      </View>

                      {/* Subtasks summary */}
                      <View style={styles.subtasksBox}>
                        <Text style={styles.subtasksCountText}>
                          Đầu việc con ({proj.subTasks.length}):
                        </Text>
                        {proj.subTasks.map((st, sIdx) => (
                          <View key={sIdx} style={styles.subtaskItemRow}>
                            <Ionicons name="checkmark-circle-outline" size={15} color="#0055D4" />
                            <Text style={styles.subtaskItemText} numberOfLines={1}>
                              {st}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  ))}

                  <Pressable style={styles.primaryAddBtn} onPress={handleOpenAddProject}>
                    <Ionicons name="add" size={20} color="#FFFFFF" />
                    <Text style={styles.primaryAddBtnText}>Thêm dự án mới</Text>
                  </Pressable>
                </View>
              )
            ) : completedProjects.length === 0 ? (
              /* Completed Empty State */
              <View style={styles.emptyCard}>
                <MaterialCommunityIcons name="trophy-outline" size={56} color="#94A3B8" />
                <Text style={styles.emptyTitle}>Chưa có dự án hoàn thành</Text>
                <Text style={styles.emptySubtitle}>
                  Các dự án sau khi được nghiệm thu sẽ hiển thị tại đây.
                </Text>
              </View>
            ) : (
              /* Completed Projects List */
              <View style={styles.projectsList}>
                {completedProjects.map((proj) => (
                  <View key={proj.id} style={styles.projectCard}>
                    <View style={styles.projHeader}>
                      <Text style={styles.projTitle}>{proj.projectName}</Text>
                      <View style={[styles.statusPill, { backgroundColor: '#ECFDF5' }]}>
                        <Text style={[styles.statusPillText, { color: '#059669' }]}>Đã hoàn thành</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* ── Select Department Modal ── */}
      <SelectModal
        visible={showDeptModal}
        title="Chọn phòng ban quản trị"
        options={deptSelectOptions}
        selectedValue={selectedDeptId}
        onSelect={(opt: any) => {
          const val = typeof opt === 'string' ? opt : opt.value ?? opt.id;
          setSelectedDeptId(val);
          setShowDeptModal(false);
        }}
        onClose={() => setShowDeptModal(false)}
      />

      {/* ── Add / Edit Project Modal ── */}
      <Modal
        visible={isProjectModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsProjectModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalDragHandleContainer}>
              <View style={styles.modalDragHandle} />
            </View>

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingProject ? 'Sửa dự án' : 'Thêm dự án mới'}
              </Text>
              <Pressable
                onPress={() => setIsProjectModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={20} color="#64748B" />
              </Pressable>
            </View>

            <ScrollView style={{ paddingHorizontal: 20 }} showsVerticalScrollIndicator={false}>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>
                  Tên dự án <Text style={{ color: '#EF4444' }}>*</Text>
                </Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="VD: Dự án Phát Triển Doanh Số Q2"
                  placeholderTextColor="#94A3B8"
                  value={projNameInput}
                  onChangeText={setProjNameInput}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Hình thức thưởng</Text>
                <View style={styles.rewardPillsRow}>
                  <Pressable
                    style={[
                      styles.rewardPill,
                      projRewardType === 'CASH' && styles.rewardPillActive,
                    ]}
                    onPress={() => setProjRewardType('CASH')}
                  >
                    <Text
                      style={[
                        styles.rewardPillText,
                        projRewardType === 'CASH' && styles.rewardPillTextActive,
                      ]}
                    >
                      Tiền mặt
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.rewardPill,
                      projRewardType === 'PHYSICAL_ITEM' && styles.rewardPillActive,
                    ]}
                    onPress={() => setProjRewardType('PHYSICAL_ITEM')}
                  >
                    <Text
                      style={[
                        styles.rewardPillText,
                        projRewardType === 'PHYSICAL_ITEM' && styles.rewardPillTextActive,
                      ]}
                    >
                      Hiện vật
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.rewardPill,
                      projRewardType === 'HYBRID' && styles.rewardPillActive,
                    ]}
                    onPress={() => setProjRewardType('HYBRID')}
                  >
                    <Text
                      style={[
                        styles.rewardPillText,
                        projRewardType === 'HYBRID' && styles.rewardPillTextActive,
                      ]}
                    >
                      Kết hợp
                    </Text>
                  </Pressable>
                </View>
              </View>

              {(projRewardType === 'CASH' || projRewardType === 'HYBRID') && (
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Tiền thưởng hoàn thành (VND)</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="number-pad"
                    placeholder="VD: 5000000"
                    placeholderTextColor="#94A3B8"
                    value={projBonusInput}
                    onChangeText={setProjBonusInput}
                  />
                </View>
              )}

              {(projRewardType === 'PHYSICAL_ITEM' || projRewardType === 'HYBRID') && (
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Tên quà tặng / hiện vật</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="VD: Cúp vinh danh, Khóa học..."
                    placeholderTextColor="#94A3B8"
                    value={projPhysicalInput}
                    onChangeText={setProjPhysicalInput}
                  />
                </View>
              )}

              {/* Subtasks Builder */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Đầu việc con (Leader sẽ phân công)</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
                  <TextInput
                    style={[styles.textInput, { flex: 1 }]}
                    placeholder="Nhập đầu việc con..."
                    placeholderTextColor="#94A3B8"
                    value={newSubTaskText}
                    onChangeText={setNewSubTaskText}
                  />
                  <Pressable
                    style={[styles.primaryAddBtn, { paddingHorizontal: 16 }]}
                    onPress={handleAddSubTask}
                  >
                    <Text style={styles.primaryAddBtnText}>Thêm</Text>
                  </Pressable>
                </View>

                {subTasksList.map((st, idx) => (
                  <View key={idx} style={styles.modalSubtaskRow}>
                    <Text style={{ flex: 1, fontSize: 14, color: '#0F172A' }}>• {st}</Text>
                    <Pressable onPress={() => handleRemoveSubTask(idx)} hitSlop={8}>
                      <Ionicons name="trash-outline" size={16} color="#EF4444" />
                    </Pressable>
                  </View>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Pressable
                style={styles.modalCancelBtn}
                onPress={() => setIsProjectModalVisible(false)}
              >
                <Text style={styles.modalCancelBtnText}>Hủy bỏ</Text>
              </Pressable>
              <Pressable style={styles.modalSubmitBtn} onPress={handleSaveProjectModal}>
                <Text style={styles.modalSubmitBtnText}>Lưu dự án</Text>
              </Pressable>
            </View>
            <SafeAreaView edges={['bottom']} />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerWrap: {
    paddingHorizontal: 16,
    paddingTop: 6,
    marginBottom: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    marginHorizontal: 16,
    borderRadius: 14,
    padding: 4,
    gap: 6,
    marginBottom: 14,
  },
  tabBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  tabBtnActive: {
    backgroundColor: '#0055D4',
    shadowColor: '#0055D4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  tabBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  tabBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  deptSection: {
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  deptLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 6,
  },
  deptSelectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  deptCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  deptIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deptNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  deptBranchText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  loadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
  },
  levelCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBadgeText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0055D4',
  },
  cardTitleCol: {
    flex: 1,
    marginLeft: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  trashBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
  },
  fieldGroup: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  levelOneAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 4,
  },
  levelOneAlertText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
    flex: 1,
  },
  rewardSection: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
    marginTop: 6,
  },
  rewardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  rewardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  rewardPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  rewardPill: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  rewardPillActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#0055D4',
    borderWidth: 1.5,
  },
  rewardPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  rewardPillTextActive: {
    color: '#0055D4',
    fontWeight: '700',
  },
  suffixInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    overflow: 'hidden',
  },
  suffixTextInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  suffixBox: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderLeftWidth: 1,
    borderLeftColor: '#E2E8F0',
    backgroundColor: '#F1F5F9',
  },
  suffixText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  bottomActions: {
    gap: 10,
    marginTop: 8,
    marginBottom: 20,
  },
  addLevelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#0055D4',
    borderStyle: 'dashed',
    height: 46,
    borderRadius: 12,
  },
  addLevelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0055D4',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0055D4',
    height: 48,
    borderRadius: 12,
    shadowColor: '#0055D4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    padding: 14,
    marginBottom: 14,
  },
  bannerIconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  bannerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 16,
  },
  subFilterRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 3,
    gap: 4,
    marginBottom: 14,
  },
  subFilterBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  subFilterBtnActive: {
    backgroundColor: '#1E293B',
  },
  subFilterBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  subFilterBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 36,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 6,
    marginBottom: 20,
  },
  primaryAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0055D4',
    paddingHorizontal: 20,
    height: 44,
    borderRadius: 10,
  },
  primaryAddBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  projectsList: {
    gap: 12,
  },
  projectCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  projHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 10,
  },
  projTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  projRewardText: {
    fontSize: 12,
    color: '#0055D4',
    fontWeight: '600',
    marginTop: 2,
  },
  statusPill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0055D4',
  },
  subtasksBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    gap: 6,
  },
  subtasksCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  subtaskItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  subtaskItemText: {
    fontSize: 13,
    color: '#334155',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 16,
  },
  modalDragHandleContainer: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  modalDragHandle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalCloseBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  modalSubtaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 8,
    marginBottom: 6,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  modalCancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  modalSubmitBtn: {
    flex: 2,
    height: 46,
    borderRadius: 10,
    backgroundColor: '#0055D4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubmitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
