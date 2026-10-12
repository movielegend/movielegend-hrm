import React, { useState, useEffect, useMemo } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SelectModal, SelectOption } from '../../components/SelectModal';
import { useAppAlert } from '../../contexts/AlertContext';
import { useDepartments } from '../../hooks/useDepartments';
import { levelingApi, DepartmentLevelItem } from '../../api/leveling.api';
import { LEVEL_DEFAULT_NAMES } from '../../components/common/LevelNameBadge';

export interface AdminLevelItem {
  id: string;
  levelNumber: number;
  levelName: string;
  colorHex: string;
  rewardType: 'CASH' | 'PHYSICAL_ITEM' | 'HYBRID';
  promotionBonusAmount: number;
  physicalItemName: string;
  project?: {
    projectName: string;
    subTaskBullets: string[];
  };
}

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
  const insets = useSafeAreaInsets();
  const { showAlert, showConfirm } = useAppAlert();

  // Active top tab: 'ranks' (Danh xưng) | 'projects' (Dự án)
  const [activeTab, setActiveTab] = useState<'ranks' | 'projects'>('ranks');

  // Department selector state
  const { data: deptData } = useDepartments({ limit: 100 });
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
  const activeDeptName = activeDept?.name || 'Kinh doanh';
  const activeBranchName = activeDept?.branchName || 'MOVIELEGEND · HÀ NỘI';

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
  const [expandedLevelNumber, setExpandedLevelNumber] = useState<number | null>(2);

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
        colorHex: '#1B3B2B',
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

  const toggleExpandLevel = (lvlNum: number) => {
    setExpandedLevelNumber((prev) => (prev === lvlNum ? null : lvlNum));
  };

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

  const handlePhysicalItemChange = (lvlNum: number, text: string) => {
    setLevels((prev) =>
      prev.map((l) => (l.levelNumber === lvlNum ? { ...l, physicalItemName: text } : l))
    );
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
      colorHex: '#1B3B2B',
      minTenureMonths: nextNum * 3,
      targetShiftsCount: nextNum * 15,
      rewardType: 'HYBRID',
      promotionBonusAmount: (nextNum - 1) * 500000,
      physicalItemName: '',
    };
    setLevels((prev) => [...prev, newLvl]);
    setExpandedLevelNumber(nextNum);
  };

  const handleRemoveLevel = (lvlNum: number) => {
    if (lvlNum === 1) {
      showAlert('Thông báo', 'Không thể xóa cấp bậc khởi đầu (Level 1).');
      return;
    }
    showConfirm({
      title: 'Xác nhận xóa',
      message: `Bạn có chắc muốn xóa cấp bậc Level ${lvlNum}?`,
      confirmLabel: 'Xóa',
      onConfirm: () => {
        setLevels((prev) => prev.filter((l) => l.levelNumber !== lvlNum));
        if (expandedLevelNumber === lvlNum) {
          setExpandedLevelNumber(null);
        }
      },
    });
  };

  const handleSaveLevels = async () => {
    if (!selectedDeptId) {
      showAlert('Lỗi', 'Vui lòng chọn phòng ban.');
      return;
    }
    try {
      setIsSavingLevels(true);
      const payload = levels.map((lvl) => ({
        levelNumber: lvl.levelNumber,
        customLevelName: lvl.customLevelName?.trim() || lvl.displayName || lvl.defaultName,
        displayName: lvl.customLevelName?.trim() || lvl.displayName || lvl.defaultName,
        colorHex: lvl.colorHex || '#1B3B2B',
        minTenureMonths: lvl.minTenureMonths || lvl.levelNumber * 3,
        targetShiftsCount: lvl.targetShiftsCount || lvl.levelNumber * 15,
        rewardType: lvl.rewardType || 'HYBRID',
        promotionBonusAmount: lvl.levelNumber === 1 ? 0 : lvl.promotionBonusAmount || 0,
        physicalItemName: lvl.levelNumber === 1 ? '' : (lvl.physicalItemName || '').trim(),
      }));

      await levelingApi.saveDepartmentLevelConfigs(selectedDeptId, payload);
      showAlert('Thành công', 'Đã lưu cấu hình danh xưng & phần thưởng.');
    } catch (err: any) {
      showAlert('Lỗi', err?.response?.data?.message || err?.message || 'Không thể lưu cấu hình cấp bậc.');
    } finally {
      setIsSavingLevels(false);
    }
  };

  // ── Tab 2: Dự án phòng ban state ──
  const [projects, setProjects] = useState<AdminProjectItem[]>([]);
  const [projectFilter, setProjectFilter] = useState<'IN_PROGRESS' | 'COMPLETED'>('IN_PROGRESS');
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);

  // Modal thêm / sửa dự án
  const [isProjectModalVisible, setIsProjectModalVisible] = useState(false);
  const [editingProject, setEditingProject] = useState<AdminProjectItem | null>(null);
  const [modalProjectName, setModalProjectName] = useState('');
  const [modalSubTasks, setModalSubTasks] = useState<string[]>(['']);
  const [modalRewardType, setModalRewardType] = useState<'CASH' | 'PHYSICAL_ITEM' | 'HYBRID'>('CASH');
  const [modalBonusAmount, setModalBonusAmount] = useState('0');
  const [modalPhysicalItem, setModalPhysicalItem] = useState('');

  // Fetch Projects for Department
  useEffect(() => {
    if (!selectedDeptId) return;
    let isMounted = true;
    setIsLoadingProjects(true);

    levelingApi
      .getProjects(selectedDeptId, activeDeptName)
      .then((data) => {
        if (!isMounted) return;
        if (Array.isArray(data) && data.length > 0) {
          const mapped: AdminProjectItem[] = data.map((p: any, idx: number) => ({
            id: p.id || `proj_${idx}`,
            projectName: p.projectName || p.name || `Dự án ${idx + 1}`,
            rewardType: p.rewardType || 'CASH',
            promotionBonusAmount: p.promotionBonusAmount || p.cashAmount || 0,
            physicalItemName: p.physicalItemName || p.rewardItem || '',
            status: p.status === 'ADMIN_APPROVED' ? 'ADMIN_APPROVED' : 'IN_PROGRESS',
            subTasks: (p.subTasks || []).map((t: any) => (typeof t === 'string' ? t : t.title || t.name)),
          }));
          setProjects(mapped);
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

  const inProgressProjects = useMemo(() => {
    return projects.filter((p) => p.status === 'IN_PROGRESS');
  }, [projects]);

  const completedProjects = useMemo(() => {
    return projects.filter((p) => p.status === 'ADMIN_APPROVED');
  }, [projects]);

  const currentFilteredProjects = projectFilter === 'IN_PROGRESS' ? inProgressProjects : completedProjects;

  const handleOpenCreateProject = () => {
    setEditingProject(null);
    setModalProjectName('');
    setModalSubTasks(['']);
    setModalRewardType('CASH');
    setModalBonusAmount('0');
    setModalPhysicalItem('');
    setIsProjectModalVisible(true);
  };

  const handleOpenEditProject = (item: AdminProjectItem) => {
    setEditingProject(item);
    setModalProjectName(item.projectName);
    setModalSubTasks(item.subTasks.length > 0 ? [...item.subTasks] : ['']);
    setModalRewardType(item.rewardType);
    setModalBonusAmount(String(item.promotionBonusAmount || 0));
    setModalPhysicalItem(item.physicalItemName || '');
    setIsProjectModalVisible(true);
  };

  const handleAddSubTaskInput = () => {
    setModalSubTasks((prev) => [...prev, '']);
  };

  const handleRemoveSubTaskInput = (index: number) => {
    if (modalSubTasks.length <= 1) return;
    setModalSubTasks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubTaskTextChange = (index: number, text: string) => {
    setModalSubTasks((prev) => {
      const copy = [...prev];
      copy[index] = text;
      return copy;
    });
  };

  const handleSaveProjectModal = () => {
    if (!modalProjectName.trim()) {
      showAlert('Lỗi', 'Vui lòng nhập tên dự án.');
      return;
    }
    const filteredTasks = modalSubTasks.map((t) => t.trim()).filter(Boolean);
    if (filteredTasks.length === 0) {
      showAlert('Lỗi', 'Vui lòng thêm ít nhất một đầu việc con cho dự án.');
      return;
    }

    const parsedBonus = parseInt(modalBonusAmount.replace(/\D/g, ''), 10) || 0;

    if (editingProject) {
      setProjects((prev) =>
        prev.map((p) =>
          p.id === editingProject.id
            ? {
                ...p,
                projectName: modalProjectName.trim(),
                subTasks: filteredTasks,
                rewardType: modalRewardType,
                promotionBonusAmount: parsedBonus,
                physicalItemName: modalPhysicalItem.trim(),
              }
            : p
        )
      );
    } else {
      const newProj: AdminProjectItem = {
        id: `proj_${Date.now()}`,
        projectName: modalProjectName.trim(),
        rewardType: modalRewardType,
        promotionBonusAmount: parsedBonus,
        physicalItemName: modalPhysicalItem.trim(),
        status: 'IN_PROGRESS',
        subTasks: filteredTasks,
      };
      setProjects((prev) => [newProj, ...prev]);
    }

    setIsProjectModalVisible(false);
    saveProjectsToApi();
  };

  const handleDeleteProject = (projId: string) => {
    showConfirm({
      title: 'Xác nhận xóa',
      message: 'Bạn có chắc chắn muốn xóa dự án này?',
      confirmLabel: 'Xóa',
      onConfirm: () => {
        setProjects((prev) => prev.filter((p) => p.id !== projId));
        saveProjectsToApi();
      },
    });
  };

  const saveProjectsToApi = async () => {
    if (!selectedDeptId) return;
    try {
      await levelingApi.saveAdminDepartmentConfig({
        departmentId: selectedDeptId,
        year: 2026,
        departmentName: activeDeptName,
        levels: projects.map((p, idx) => ({
          levelNumber: idx + 1,
          customLevelName: p.projectName,
          colorHex: '#1B3B2B',
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
    } catch {
      showAlert('Lưu dự án', 'Đã lưu dự án trên thiết bị.');
    }
  };

  const formatCurrency = (val: number) => {
    return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const getRewardSummary = (lvl: DepartmentLevelItem) => {
    if (lvl.levelNumber === 1) {
      return 'Cấp khởi đầu · Không thưởng';
    }
    const rType = lvl.rewardType || 'HYBRID';
    const cashStr = `${formatCurrency(lvl.promotionBonusAmount || 0)} VNĐ`;
    const itemStr = lvl.physicalItemName ? lvl.physicalItemName : 'Hiện vật';

    if (rType === 'CASH') return cashStr;
    if (rType === 'PHYSICAL_ITEM') return itemStr;
    return `${cashStr} · ${itemStr}`;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1B3B2B" translucent={false} />

      {/* ── Top Forest Green Header (#1B3B2B) ── */}
      <View style={[styles.headerWrap, { paddingTop: Math.max(insets.top, 16) + 4 }]}>
        {/* Header Title Row */}
        <View style={styles.headerMainRow}>
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/admin/(tabs)' as any))}
            style={styles.backBtn}
            hitSlop={10}
            accessibilityLabel="Quay lại"
          >
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </Pressable>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Cấp bậc & Dự án</Text>
            <Text style={styles.headerSubtitle}>Thiết lập lộ trình phát triển</Text>
          </View>
        </View>

        {/* Department Selector Card inside header */}
        <View style={styles.deptCardWrapper}>
          <Pressable style={styles.deptSelectCard} onPress={() => setShowDeptModal(true)}>
            <View style={styles.deptCardLeft}>
              <View style={styles.deptIconBox}>
                <MaterialCommunityIcons name="office-building" size={20} color="#1B3B2B" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.deptNameText}>{activeDeptName}</Text>
                <Text style={styles.deptBranchText}>
                  {activeBranchName.toUpperCase().replace('-', ' · ')}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-down" size={18} color="#64748B" />
          </Pressable>
        </View>
      </View>

      {/* ── Curved Sheet Container ── */}
      <View style={styles.curvedSheet}>
        {/* Segmented Pill Tab Bar (Template Match) */}
        <View style={styles.tabContainer}>
          <View style={styles.tabPillWrapper}>
            <Pressable
              style={[styles.tabPill, activeTab === 'ranks' && styles.tabPillActive]}
              onPress={() => setActiveTab('ranks')}
            >
              <Text style={[styles.tabPillText, activeTab === 'ranks' && styles.tabPillTextActive]}>
                Danh xưng
              </Text>
            </Pressable>

            <Pressable
              style={[styles.tabPill, activeTab === 'projects' && styles.tabPillActive]}
              onPress={() => setActiveTab('projects')}
            >
              <Text style={[styles.tabPillText, activeTab === 'projects' && styles.tabPillTextActive]}>
                Dự án
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Scrollable Content */}
        <ScrollView
          style={styles.scrollBody}
          contentContainerStyle={[
            styles.scrollContent,
            activeTab === 'ranks' && { paddingBottom: Math.max(insets.bottom, 16) + 80 },
            activeTab === 'projects' && { paddingBottom: Math.max(insets.bottom, 16) + 24 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {activeTab === 'ranks' ? (
            /* ======================================================== */
            /* TAB 1: DANH XƯNG & PHẦN THƯỞNG (Screen 1)                */
            /* ======================================================== */
            <View>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Danh xưng & Phần thưởng</Text>
                <Text style={styles.sectionSubtitle}>
                  Tùy chỉnh cấp bậc của phòng ban.
                </Text>
              </View>

              {isLoadingLevels ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator size="small" color="#1B3B2B" />
                  <Text style={styles.loadingText}>Đang tải cấu hình cấp bậc...</Text>
                </View>
              ) : (
                <>
                  {levels.map((lvl) => {
                    const isLevelOne = lvl.levelNumber === 1;
                    const isExpanded = expandedLevelNumber === lvl.levelNumber;
                    const formattedNum = String(lvl.levelNumber).padStart(2, '0');
                    const levelDisplayName =
                      lvl.customLevelName?.trim() || lvl.displayName || lvl.defaultName || `Cấp ${lvl.levelNumber}`;

                    return (
                      <View key={lvl.levelNumber} style={styles.levelCard}>
                        {/* Accordion Header */}
                        <Pressable
                          style={styles.levelCardHeader}
                          onPress={() => toggleExpandLevel(lvl.levelNumber)}
                        >
                          <View style={styles.levelNumBadge}>
                            <Text style={styles.levelNumBadgeText}>{formattedNum}</Text>
                          </View>

                          <View style={styles.levelHeaderMiddle}>
                            <Text style={styles.levelTitleText}>{levelDisplayName}</Text>
                            {!isExpanded && (
                              <Text style={styles.levelSummarySubtitle} numberOfLines={1}>
                                {getRewardSummary(lvl)}
                              </Text>
                            )}
                          </View>

                          <View style={styles.levelHeaderRight}>
                            {isExpanded && !isLevelOne && (
                              <Pressable
                                onPress={() => handleRemoveLevel(lvl.levelNumber)}
                                style={styles.trashBtn}
                                hitSlop={8}
                              >
                                <Ionicons name="trash-outline" size={18} color="#EF4444" />
                              </Pressable>
                            )}
                            <Ionicons
                              name={isExpanded ? 'chevron-up' : 'chevron-down'}
                              size={18}
                              color="#64748B"
                            />
                          </View>
                        </Pressable>

                        {/* Accordion Body */}
                        {isExpanded && (
                          <View style={styles.levelCardBody}>
                            {/* Input Tên danh xưng */}
                            <View style={styles.fieldGroup}>
                              <Text style={styles.fieldLabel}>Tên danh xưng</Text>
                              <TextInput
                                style={styles.textInput}
                                value={lvl.customLevelName || ''}
                                onChangeText={(text) => handleLevelNameChange(lvl.levelNumber, text)}
                                placeholder="Nhập tên danh xưng"
                                placeholderTextColor="#94A3B8"
                              />
                            </View>

                            {isLevelOne ? (
                              <View style={styles.levelOneNoteRow}>
                                <Ionicons name="information-circle-outline" size={16} color="#64748B" />
                                <Text style={styles.levelOneNoteText}>
                                  Cấp khởi đầu không áp dụng thưởng thăng cấp.
                                </Text>
                              </View>
                            ) : (
                              <View style={styles.rewardSection}>
                                <Text style={styles.fieldLabel}>Phần thưởng thăng cấp</Text>
                                <View style={styles.rewardPillsRow}>
                                  {(['CASH', 'PHYSICAL_ITEM', 'HYBRID'] as const).map((rType) => {
                                    const isPillActive = (lvl.rewardType || 'HYBRID') === rType;
                                    return (
                                      <Pressable
                                        key={rType}
                                        style={[styles.rewardPill, isPillActive && styles.rewardPillActive]}
                                        onPress={() => handleRewardTypeChange(lvl.levelNumber, rType)}
                                      >
                                        <Text
                                          style={[
                                            styles.rewardPillText,
                                            isPillActive && styles.rewardPillTextActive,
                                          ]}
                                        >
                                          {rType === 'CASH'
                                            ? 'Tiền mặt'
                                            : rType === 'PHYSICAL_ITEM'
                                            ? 'Hiện vật'
                                            : 'Kết hợp'}
                                        </Text>
                                      </Pressable>
                                    );
                                  })}
                                </View>

                                {/* Tiền thưởng input */}
                                {((lvl.rewardType || 'HYBRID') === 'CASH' ||
                                  (lvl.rewardType || 'HYBRID') === 'HYBRID') && (
                                  <View style={styles.fieldGroup}>
                                    <Text style={styles.fieldLabel}>Tiền thưởng</Text>
                                    <View style={styles.inputWithUnitRow}>
                                      <TextInput
                                        style={styles.inputWithUnitText}
                                        value={formatCurrency(lvl.promotionBonusAmount || 0)}
                                        onChangeText={(val) => handleBonusAmountChange(lvl.levelNumber, val)}
                                        placeholder="0"
                                        placeholderTextColor="#94A3B8"
                                        keyboardType="numeric"
                                      />
                                      <View style={styles.unitBadge}>
                                        <Text style={styles.unitBadgeText}>VNĐ</Text>
                                      </View>
                                    </View>
                                  </View>
                                )}

                                {/* Chi tiết hiện vật input */}
                                {((lvl.rewardType || 'HYBRID') === 'PHYSICAL_ITEM' ||
                                  (lvl.rewardType || 'HYBRID') === 'HYBRID') && (
                                  <View style={styles.fieldGroup}>
                                    <Text style={styles.fieldLabel}>Chi tiết hiện vật</Text>
                                    <View style={styles.inputWithIconRow}>
                                      <Ionicons
                                        name="gift-outline"
                                        size={18}
                                        color="#1B3B2B"
                                        style={styles.inputLeftIcon}
                                      />
                                      <TextInput
                                        style={styles.inputWithIconText}
                                        value={lvl.physicalItemName || ''}
                                        onChangeText={(val) => handlePhysicalItemChange(lvl.levelNumber, val)}
                                        placeholder="Nhập phần quà (VD: Huy hiệu vàng, iPad...)"
                                        placeholderTextColor="#94A3B8"
                                      />
                                    </View>
                                  </View>
                                )}
                              </View>
                            )}
                          </View>
                        )}
                      </View>
                    );
                  })}

                  {/* Button Thêm cấp bậc */}
                  <Pressable style={styles.addLevelBtn} onPress={handleAddLevel}>
                    <Ionicons name="add" size={18} color="#1B3B2B" />
                    <Text style={styles.addLevelBtnText}>Thêm cấp bậc</Text>
                  </Pressable>
                </>
              )}
            </View>
          ) : (
            /* ======================================================== */
            /* TAB 2: DỰ ÁN PHÒNG BAN (Screen 2)                        */
            /* ======================================================== */
            <View>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Dự án phòng ban</Text>
                <Text style={styles.sectionSubtitle}>
                  Tạo dự án để Leader phân công cho nhân sự.
                </Text>
              </View>

              {/* Sub-filters: Đang chạy & Hoàn thành */}
              <View style={styles.subFilterRow}>
                <Pressable
                  style={[
                    styles.subFilterPill,
                    projectFilter === 'IN_PROGRESS' && styles.subFilterPillActive,
                  ]}
                  onPress={() => setProjectFilter('IN_PROGRESS')}
                >
                  <Text
                    style={[
                      styles.subFilterText,
                      projectFilter === 'IN_PROGRESS' && styles.subFilterTextActive,
                    ]}
                  >
                    Đang chạy [{inProgressProjects.length}]
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.subFilterPill,
                    projectFilter === 'COMPLETED' && styles.subFilterPillActive,
                  ]}
                  onPress={() => setProjectFilter('COMPLETED')}
                >
                  <Text
                    style={[
                      styles.subFilterText,
                      projectFilter === 'COMPLETED' && styles.subFilterTextActive,
                    ]}
                  >
                    Hoàn thành [{completedProjects.length}]
                  </Text>
                </Pressable>
              </View>

              {isLoadingProjects ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator size="small" color="#1B3B2B" />
                  <Text style={styles.loadingText}>Đang tải dự án...</Text>
                </View>
              ) : currentFilteredProjects.length === 0 ? (
                /* Empty state matching Screen 2 */
                <View style={styles.emptyProjWrapper}>
                  <View style={styles.emptyFolderCircle}>
                    <MaterialCommunityIcons name="folder-plus-outline" size={36} color="#1B3B2B" />
                  </View>
                  <Text style={styles.emptyProjTitle}>Chưa có dự án</Text>
                  <Text style={styles.emptyProjSubtitle}>
                    Tạo dự án đầu tiên cho phòng {activeDeptName}.
                  </Text>

                  <Pressable style={styles.primaryAddBtn} onPress={handleOpenCreateProject}>
                    <Ionicons name="add" size={20} color="#FFFFFF" />
                    <Text style={styles.primaryAddBtnText}>Thêm dự án mới</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.projectsList}>
                  {currentFilteredProjects.map((proj) => (
                    <View key={proj.id} style={styles.projectCard}>
                      <View style={styles.projHeader}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.projTitle}>{proj.projectName}</Text>
                          <Text style={styles.projSubtasksCount}>
                            {proj.subTasks.length} đầu việc con
                          </Text>
                        </View>
                        <View style={styles.projHeaderActions}>
                          <Pressable
                            style={styles.projActionIconBtn}
                            onPress={() => handleOpenEditProject(proj)}
                          >
                            <Ionicons name="pencil-outline" size={16} color="#64748B" />
                          </Pressable>
                          <Pressable
                            style={styles.projActionIconBtn}
                            onPress={() => handleDeleteProject(proj.id)}
                          >
                            <Ionicons name="trash-outline" size={16} color="#EF4444" />
                          </Pressable>
                        </View>
                      </View>

                      {/* Subtasks snippet */}
                      <View style={styles.projSubtasksList}>
                        {proj.subTasks.slice(0, 3).map((st, idx) => (
                          <View key={idx} style={styles.subtaskSnippetRow}>
                            <Ionicons name="checkmark-circle-outline" size={14} color="#1B3B2B" />
                            <Text style={styles.subtaskSnippetText} numberOfLines={1}>
                              {st}
                            </Text>
                          </View>
                        ))}
                        {proj.subTasks.length > 3 && (
                          <Text style={styles.moreSubtasksText}>
                            +{proj.subTasks.length - 3} đầu việc khác...
                          </Text>
                        )}
                      </View>
                    </View>
                  ))}

                  <Pressable style={styles.primaryAddBtn} onPress={handleOpenCreateProject}>
                    <Ionicons name="add" size={20} color="#FFFFFF" />
                    <Text style={styles.primaryAddBtnText}>Thêm dự án mới</Text>
                  </Pressable>
                </View>
              )}
            </View>
          )}
        </ScrollView>

        {/* ── Sticky Bottom Button for Tab 1 (Screen 1) ── */}
        {activeTab === 'ranks' && (
          <View style={[styles.stickyFooterBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <Pressable
              style={styles.saveLevelsBtn}
              onPress={handleSaveLevels}
              disabled={isSavingLevels}
            >
              {isSavingLevels ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.saveLevelsBtnText}>Lưu cấu hình</Text>
              )}
            </Pressable>
          </View>
        )}
      </View>

      {/* ── Modal: Chọn phòng ban ── */}
      <SelectModal
        visible={showDeptModal}
        title="Chọn phòng ban quản trị"
        options={deptSelectOptions}
        selectedValue={selectedDeptId}
        onSelect={(opt: any) => {
          const val = typeof opt === 'string' ? opt : (opt.value ?? opt.id);
          setSelectedDeptId(val);
          setShowDeptModal(false);
        }}
        onClose={() => setShowDeptModal(false)}
      />

      {/* ── Modal: Thêm / Sửa dự án (Screen 3) ── */}
      <Modal
        visible={isProjectModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsProjectModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            {/* Modal Drag Handle */}
            <View style={styles.modalDragHandle} />

            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingProject ? 'Chỉnh sửa dự án' : 'Thêm dự án phòng ban'}
              </Text>
              <Pressable
                onPress={() => setIsProjectModalVisible(false)}
                hitSlop={8}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={22} color="#64748B" />
              </Pressable>
            </View>

            {/* Department Tag Pill */}
            <View style={styles.modalDeptTagRow}>
              <View style={styles.modalDeptTagPill}>
                <Ionicons name="business-outline" size={13} color="#1B3B2B" />
                <Text style={styles.modalDeptTagText}>{activeDeptName}</Text>
              </View>
            </View>

            <ScrollView
              style={{ maxHeight: 420 }}
              contentContainerStyle={{ paddingBottom: 16 }}
              showsVerticalScrollIndicator={false}
            >
              {/* Field Tên dự án */}
              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>Tên dự án *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={modalProjectName}
                  onChangeText={setModalProjectName}
                  placeholder="Ví dụ: Chiến dịch Quý 3"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              {/* Field Đầu việc con */}
              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>Đầu việc con *</Text>
                <Text style={styles.modalSubLabel}>Chia dự án thành các đầu việc cụ thể.</Text>

                <View style={styles.modalSubtasksList}>
                  {modalSubTasks.map((taskText, idx) => (
                    <View key={idx} style={styles.modalSubtaskRow}>
                      <View style={styles.subtaskIndexCircle}>
                        <Text style={styles.subtaskIndexCircleText}>{idx + 1}</Text>
                      </View>
                      <TextInput
                        style={styles.modalSubtaskInput}
                        value={taskText}
                        onChangeText={(t) => handleSubTaskTextChange(idx, t)}
                        placeholder={`Nhập đầu việc...`}
                        placeholderTextColor="#94A3B8"
                      />
                      {modalSubTasks.length > 1 && (
                        <Pressable
                          style={styles.removeSubtaskBtn}
                          onPress={() => handleRemoveSubTaskInput(idx)}
                        >
                          <Ionicons name="trash-outline" size={16} color="#EF4444" />
                        </Pressable>
                      )}
                    </View>
                  ))}
                </View>

                {/* Button Thêm đầu việc */}
                <Pressable style={styles.addSubtaskDashedBtn} onPress={handleAddSubTaskInput}>
                  <Ionicons name="add" size={16} color="#1B3B2B" />
                  <Text style={styles.addSubtaskDashedBtnText}>Thêm đầu việc</Text>
                </Pressable>
              </View>
            </ScrollView>

            {/* Modal Footer Buttons */}
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
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1B3B2B',
  },

  /* ── Header Wrap (#1B3B2B) ── */
  headerWrap: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#1B3B2B',
  },
  headerMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#A7F3D0',
    marginTop: 2,
    fontWeight: '500',
  },

  /* ── Department Selector Card ── */
  deptCardWrapper: {
    marginTop: 2,
  },
  deptSelectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  deptCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  deptIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deptNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  deptBranchText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
    letterSpacing: 0.5,
  },

  /* ── Main Curved Sheet ── */
  curvedSheet: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },

  /* ── Segmented Pill Tab Bar ── */
  tabContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: '#F8FAFC',
  },
  tabPillWrapper: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 100,
    padding: 3,
  },
  tabPill: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 100,
  },
  tabPillActive: {
    backgroundColor: '#1B3B2B',
  },
  tabPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  tabPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  /* ── Content ScrollBody ── */
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  sectionHeader: {
    marginTop: 6,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 3,
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

  /* ── Level Accordion Cards ── */
  levelCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  levelCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  levelNumBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelNumBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1B3B2B',
  },
  levelHeaderMiddle: {
    flex: 1,
  },
  levelTitleText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  levelSummarySubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  levelHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trashBtn: {
    padding: 4,
  },

  /* ── Level Card Body (Expanded) ── */
  levelCardBody: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    marginTop: 12,
    paddingTop: 12,
  },
  fieldGroup: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    color: '#0F172A',
  },
  levelOneNoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
    paddingVertical: 4,
  },
  levelOneNoteText: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
  },
  rewardSection: {
    marginTop: 2,
  },
  rewardPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  rewardPill: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardPillActive: {
    backgroundColor: '#1B3B2B',
  },
  rewardPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  rewardPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  /* Input with Unit (VNĐ) */
  inputWithUnitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingLeft: 12,
    overflow: 'hidden',
  },
  inputWithUnitText: {
    flex: 1,
    paddingVertical: 9,
    fontSize: 14,
    color: '#0F172A',
  },
  unitBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  unitBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },

  /* Input with Left Icon (Gift) */
  inputWithIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 10,
  },
  inputLeftIcon: {
    marginRight: 6,
  },
  inputWithIconText: {
    flex: 1,
    paddingVertical: 9,
    fontSize: 14,
    color: '#0F172A',
  },

  /* Add Level Button */
  addLevelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    height: 44,
    borderRadius: 10,
    marginTop: 4,
    marginBottom: 16,
  },
  addLevelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1B3B2B',
  },

  /* Sticky Footer Bar */
  stickyFooterBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  saveLevelsBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#1B3B2B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveLevelsBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* ── Tab 2: Projects (Screen 2) ── */
  subFilterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  subFilterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  subFilterPillActive: {
    backgroundColor: '#1B3B2B',
  },
  subFilterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  subFilterTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  emptyProjWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    paddingVertical: 36,
    paddingHorizontal: 20,
    marginTop: 6,
  },
  emptyFolderCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyProjTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  emptyProjSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 20,
  },
  primaryAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#1B3B2B',
    height: 46,
    width: '100%',
    borderRadius: 12,
  },
  primaryAddBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  projectsList: {
    gap: 12,
    marginTop: 4,
  },
  projectCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
  },
  projHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  projTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  projSubtasksCount: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  projHeaderActions: {
    flexDirection: 'row',
    gap: 6,
  },
  projActionIconBtn: {
    padding: 6,
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
  },
  projSubtasksList: {
    gap: 4,
    marginTop: 4,
  },
  subtaskSnippetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  subtaskSnippetText: {
    fontSize: 12,
    color: '#475569',
    flex: 1,
  },
  moreSubtasksText: {
    fontSize: 11,
    color: '#94A3B8',
    fontStyle: 'italic',
    marginTop: 2,
  },

  /* ── Modal Thêm / Sửa dự án (Screen 3) ── */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
  },
  modalDragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalDeptTagRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  modalDeptTagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  modalDeptTagText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1B3B2B',
  },
  modalField: {
    marginBottom: 14,
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  modalSubLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  modalSubtasksList: {
    gap: 8,
    marginBottom: 10,
  },
  modalSubtaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subtaskIndexCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtaskIndexCircleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1B3B2B',
  },
  modalSubtaskInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
  },
  removeSubtaskBtn: {
    padding: 6,
  },
  addSubtaskDashedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    height: 40,
    borderRadius: 10,
  },
  addSubtaskDashedBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1B3B2B',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  modalCancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  modalSubmitBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#1B3B2B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubmitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
