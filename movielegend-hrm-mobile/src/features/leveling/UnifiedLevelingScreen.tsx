import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Image,
  TextInput,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useAuth } from '../../providers/AuthProvider';
import { useDepartments } from '../../hooks/useDepartments';
import { fetchEmployees } from '../../api/employees.api';
import { getAbsoluteImageUrl } from '../../utils/image';
import {
  levelingApi,
  UserLevelProgressData,
  LevelPromotionRequestItem,
  DepartmentLevelItem,
} from '../../api/leveling.api';
import { LevelNameBadge, LEVEL_COLORS, LEVEL_DEFAULT_NAMES } from '../../components/common/LevelNameBadge';
import { EmployeeLevelProgressCard } from './EmployeeLevelProgressCard';
import { LeaderPromotionReviewModal } from './LeaderPromotionReviewModal';
import { DirectLevelChangeModal } from './DirectLevelChangeModal';
import { useLevelProjects, BulletSubTask, LevelDepartmentProject } from './levelProjectsStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface UnifiedLevelingScreenProps {
  initialTab?: 'roadmap' | 'members' | 'config' | 'projects';
  initialLeaderSubTab?: 'members_list' | 'pending_requests';
  mode?: 'config_only' | 'review_only' | 'full';
}

export const UnifiedLevelingScreen: React.FC<UnifiedLevelingScreenProps> = ({
  initialTab: propInitialTab,
  initialLeaderSubTab: propInitialLeaderSubTab,
  mode = 'full',
}) => {
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string; subTab?: string; departmentId?: string; mode?: string }>();
  const { user } = useAuth();

  const isAdmin = user?.roles?.includes('ADMIN') || user?.roles?.includes('SUPER_ADMIN');
  const isLeader = !isAdmin && (user?.roles?.includes('LEADER') || user?.roles?.includes('HR'));
  const isLeaderOrAdmin = isAdmin || isLeader;

  const currentMode: 'config_only' | 'review_only' | 'full' =
    (params.mode as any) || mode || 'full';

  const defaultTab = currentMode === 'config_only' ? 'config' : isAdmin ? 'members' : 'roadmap';
  const resolvedTab =
    propInitialTab ||
    (params.tab === 'config' || params.tab === 'projects' || params.tab === 'members' || (!isAdmin && params.tab === 'roadmap')
      ? (params.tab as any)
      : defaultTab);

  const resolvedSubTab =
    propInitialLeaderSubTab ||
    (params.subTab === 'pending_requests' || params.subTab === 'members_list'
      ? (params.subTab as any)
      : 'members_list');

  const [activeTab, setActiveTab] = useState<'roadmap' | 'members' | 'config' | 'projects'>(resolvedTab);
  const [leaderSubTab, setLeaderSubTab] = useState<'members_list' | 'pending_requests'>(resolvedSubTab);

  const [progressData, setProgressData] = useState<UserLevelProgressData | null>(null);
  const [promotionRequests, setPromotionRequests] = useState<LevelPromotionRequestItem[]>([]);
  const [departmentMembers, setDepartmentMembers] = useState<any[]>([]);

  // Department Level Configs
  const [deptLevelConfigs, setDeptLevelConfigs] = useState<DepartmentLevelItem[]>([]);
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // Projects State for Admin (Department Projects - NOT divided by Level)
  const [adminProjects, setAdminProjects] = useState<
    Array<{
      id: string;
      projectName: string;
      rewardType: 'CASH' | 'PHYSICAL_ITEM' | 'HYBRID';
      promotionBonusAmount: number;
      physicalItemName: string;
      subTasks: string[];
    }>
  >([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [newSubTaskInput, setNewSubTaskInput] = useState<string>('');
  const [editingSubTaskIdx, setEditingSubTaskIdx] = useState<number | null>(null);
  const [editingSubTaskText, setEditingSubTaskText] = useState<string>('');
  const [isSavingProject, setIsSavingProject] = useState<boolean>(false);

  // Department picker for Admin / Leader
  const { data: deptData } = useDepartments({ limit: 50 });
  const deptList: Array<{ id: string; name: string }> =
    (deptData as any)?.items ||
    (deptData as any)?.data ||
    (Array.isArray(deptData) ? deptData : []);
  const [selectedDeptId, setSelectedDeptId] = useState<string>(params.departmentId || '');

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals state
  const [selectedReviewRequest, setSelectedReviewRequest] =
    useState<LevelPromotionRequestItem | null>(null);
  const [directChangeUser, setDirectChangeUser] = useState<{
    id: string;
    fullName: string;
    currentLevelNumber: number;
    departmentName?: string;
  } | null>(null);

  // Leader department resolution
  const leaderDeptId = progressData?.departmentId || user?.departmentLinks?.[0]?.departmentId || '';
  const activeDeptId = isAdmin
    ? (selectedDeptId || deptList[0]?.id || '')
    : (leaderDeptId || selectedDeptId || '');

  const activeDeptName =
    deptList.find((d) => d.id === activeDeptId)?.name ||
    progressData?.departmentName ||
    user?.departmentLinks?.[0]?.department?.name ||
    'Phòng ban';

  // Department locking: Admin can pick any department, Leader is strictly locked to their own department
  useEffect(() => {
    if (isAdmin) {
      if (!selectedDeptId && deptList.length > 0) {
        const defaultId = params.departmentId || deptList[0]?.id;
        if (defaultId) setSelectedDeptId(defaultId);
      }
    } else {
      if (leaderDeptId && selectedDeptId !== leaderDeptId) {
        setSelectedDeptId(leaderDeptId);
      }
    }
  }, [isAdmin, deptList, selectedDeptId, params.departmentId, leaderDeptId]);

  // Real-time reactive assigned tasks for current employee
  const currentUserId = user?.id;
  const currentUserName = user?.fullName || user?.userCode || '';
  const { getAssignedSubTasksForUser } = useLevelProjects(activeDeptId, activeDeptName);
  const myAssignedTasks = getAssignedSubTasksForUser(currentUserId, currentUserName);

  const loadData = useCallback(async () => {
    try {
      // 1. Load my progress
      let currentProgress: UserLevelProgressData | null = await levelingApi.getMyLevelProgress().catch(() => null);
      if (currentProgress) {
        setProgressData(currentProgress);
      } else if (isAdmin) {
        // Fallback for Admin account: Level 8 Executive
        setProgressData({
          userId: user?.id || 'admin',
          fullName: user?.fullName || 'Admin',
          avatarUrl: user?.avatarUrl,
          departmentId: deptList[0]?.id || 'admin-dept',
          departmentName: 'Ban Điều Hành',
          currentLevel: {
            levelNumber: 8,
            levelName: 'Executive',
            displayName: 'Ban Điều Hành',
            badgeTitle: 'Executive (Admin)',
            colorHex: '#D4AF37',
            minTenureMonths: 24,
            targetShiftsCount: 720,
          },
          nextLevel: null,
          overallProgressPercent: 100,
          metrics: {
            tenure: { currentMonths: 36, targetMonths: 24, progressPercent: 100, isPassed: true },
            shifts: { currentShifts: 1000, targetShifts: 720, progressPercent: 100, isPassed: true },
            discipline: { penaltyScore: 0, currentScore: 100, progressPercent: 100, isPassed: true },
            revenue: { currentRevenue: 0, targetRevenue: 0, progressPercent: 100, isPassed: true },
          },
          roadmap: [],
        } as any);
      }

      // 2. Load Department Level Configs
      const queryDeptId = isAdmin
        ? (selectedDeptId || params.departmentId || deptList[0]?.id)
        : (currentProgress?.departmentId || leaderDeptId || selectedDeptId);

      if (queryDeptId) {
        const configs = await levelingApi.getDepartmentLevelConfigs(queryDeptId).catch(() => []);
        if (Array.isArray(configs) && configs.length > 0) {
          setDeptLevelConfigs(configs);
        } else {
          setDeptLevelConfigs(
            Array.from({ length: 8 }, (_, i) => ({
              levelNumber: i + 1,
              levelName: `Level ${i + 1}`,
              defaultName: LEVEL_DEFAULT_NAMES[i + 1] || `Level ${i + 1}`,
              customLevelName: LEVEL_DEFAULT_NAMES[i + 1] || `Level ${i + 1}`,
              displayName: LEVEL_DEFAULT_NAMES[i + 1] || `Level ${i + 1}`,
              badgeTitle: LEVEL_DEFAULT_NAMES[i + 1] || `Level ${i + 1}`,
              colorHex: LEVEL_COLORS[i + 1] || '#2196F3',
              minTenureMonths: i === 0 ? 1 : i === 1 ? 2 : i === 2 ? 6 : (i + 1) * 3,
              targetShiftsCount: (i + 1) * 30,
            })),
          );
        }

        // 3. If Leader/Admin, load pending requests & department members
        if (isLeaderOrAdmin) {
          const [requests, membersRes] = await Promise.all([
            levelingApi.getDepartmentPromotionRequests(queryDeptId).catch(() => []),
            fetchEmployees({ departmentId: queryDeptId, limit: 100 }).catch(() => ({ data: [] })),
          ]);

          setPromotionRequests(Array.isArray(requests) ? requests : []);
          setDepartmentMembers(Array.isArray((membersRes as any)?.data) ? (membersRes as any).data : []);
        }

        // 4. Load projects for Admin (Department Projects - NOT divided by level)
        if (isAdmin && queryDeptId) {
          const rawProjects = await levelingApi.getProjects(queryDeptId, activeDeptName).catch(() => []);
          const adminConfig = await levelingApi.getAdminDepartmentConfig(queryDeptId, 2026, activeDeptName).catch(() => null);
          const adminLevelList = Array.isArray(adminConfig) ? adminConfig : [];

          const loadedProjects: Array<{
            id: string;
            projectName: string;
            rewardType: 'CASH' | 'PHYSICAL_ITEM' | 'HYBRID';
            promotionBonusAmount: number;
            physicalItemName: string;
            subTasks: string[];
          }> = [];

          if (Array.isArray(adminLevelList) && adminLevelList.length > 0 && adminLevelList.some((l: any) => l.project?.projectName)) {
            adminLevelList.forEach((l: any, idx: number) => {
              if (l.project?.projectName || (l.project?.subTaskBullets && l.project.subTaskBullets.length > 0)) {
                loadedProjects.push({
                  id: l.id || `proj-${queryDeptId}-${idx + 1}`,
                  projectName: l.project?.projectName || `Dự Án ${idx + 1}`,
                  rewardType: l.rewardType || 'HYBRID',
                  promotionBonusAmount: l.promotionBonusAmount !== undefined ? l.promotionBonusAmount : 5000000,
                  physicalItemName: l.physicalItemName || '',
                  subTasks: l.project?.subTaskBullets || [],
                });
              }
            });
          } else if (Array.isArray(rawProjects) && rawProjects.length > 0) {
            rawProjects.forEach((p: any, idx: number) => {
              loadedProjects.push({
                id: p.id || `proj-${queryDeptId}-${idx + 1}`,
                projectName: p.projectName || `Dự Án ${idx + 1}`,
                rewardType: p.rewardType || 'HYBRID',
                promotionBonusAmount: p.cashAmount || p.promotionBonusAmount || 5000000,
                physicalItemName: p.physicalItemName || '',
                subTasks: (p.subTasks || []).map((t: any) => (typeof t === 'string' ? t : t.title || t.name || '')).filter(Boolean),
              });
            });
          }

          setAdminProjects(loadedProjects);
          setSelectedProjectId((prev) => (prev && loadedProjects.some((p) => p.id === prev) ? prev : loadedProjects[0]?.id || ''));
        }
      }
    } catch (e) {
      console.error('Failed to load leveling data:', e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [isAdmin, isLeaderOrAdmin, selectedDeptId, deptList, params.departmentId, leaderDeptId, activeDeptName, deptLevelConfigs.length]);

  useEffect(() => {
    loadData();
  }, [loadData, selectedDeptId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  // Project handlers for Admin (Department Projects - NOT divided by Level)
  const handleAddProject = () => {
    const newId = `proj-${Date.now()}`;
    const newIdx = adminProjects.length + 1;
    const newProj = {
      id: newId,
      projectName: `Dự án ${newIdx}`,
      rewardType: 'HYBRID' as const,
      promotionBonusAmount: 0,
      physicalItemName: '',
      subTasks: [],
    };
    setAdminProjects((prev) => [...prev, newProj]);
    setSelectedProjectId(newId);
  };

  const handleDeleteProject = (projectId: string) => {
    Alert.alert(
      'Xác nhận xóa dự án',
      'Bạn có chắc chắn muốn xóa dự án này khỏi phòng ban không?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => {
            setAdminProjects((prev) => {
              const filtered = prev.filter((p) => p.id !== projectId);
              if (selectedProjectId === projectId) {
                setSelectedProjectId(filtered.length > 0 ? filtered[0].id : '');
              }
              return filtered;
            });
          },
        },
      ],
    );
  };

  const handleUpdateProjectName = (projectId: string, newName: string) => {
    setAdminProjects((prev) =>
      prev.map((item) => (item.id === projectId ? { ...item, projectName: newName } : item)),
    );
  };

  const handleUpdateProjectRewardType = (
    projectId: string,
    rewardType: 'CASH' | 'PHYSICAL_ITEM' | 'HYBRID',
  ) => {
    setAdminProjects((prev) =>
      prev.map((item) => (item.id === projectId ? { ...item, rewardType } : item)),
    );
  };

  const handleUpdateProjectBonusAmount = (projectId: string, amount: number) => {
    setAdminProjects((prev) =>
      prev.map((item) => (item.id === projectId ? { ...item, promotionBonusAmount: amount } : item)),
    );
  };

  const handleUpdateProjectPhysicalItem = (projectId: string, physicalItemName: string) => {
    setAdminProjects((prev) =>
      prev.map((item) => (item.id === projectId ? { ...item, physicalItemName } : item)),
    );
  };

  const handleAddSubTask = (projectId: string) => {
    if (!newSubTaskInput.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập nội dung đầu việc con!');
      return;
    }
    const cleanText = newSubTaskInput.replace(/^[•\-\*]\s*/, '').trim();
    setAdminProjects((prev) =>
      prev.map((item) =>
        item.id === projectId
          ? { ...item, subTasks: [...item.subTasks, cleanText] }
          : item,
      ),
    );
    setNewSubTaskInput('');
  };

  const handleEditSubTask = (projectId: string, index: number, newText: string) => {
    if (!newText.trim()) return;
    const cleanText = newText.replace(/^[•\-\*]\s*/, '').trim();
    setAdminProjects((prev) =>
      prev.map((item) => {
        if (item.id === projectId) {
          const updated = [...item.subTasks];
          updated[index] = cleanText;
          return { ...item, subTasks: updated };
        }
        return item;
      }),
    );
    setEditingSubTaskIdx(null);
    setEditingSubTaskText('');
  };

  const handleDeleteSubTask = (projectId: string, index: number) => {
    Alert.alert(
      'Xác nhận xóa việc con',
      'Bạn có chắc chắn muốn xóa việc con này khỏi dự án không?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => {
            setAdminProjects((prev) =>
              prev.map((item) =>
                item.id === projectId
                  ? { ...item, subTasks: item.subTasks.filter((_, i) => i !== index) }
                  : item,
              ),
            );
          },
        },
      ],
    );
  };

  const handleSaveAllProjects = async () => {
    if (!activeDeptId) return;
    try {
      setIsSavingProject(true);
      const convertedLevels = adminProjects.map((p, idx) => ({
        id: p.id,
        levelNumber: idx + 1,
        levelName: p.projectName,
        colorHex: LEVEL_COLORS[((idx) % 8) + 1] || '#2563EB',
        rewardType: p.rewardType,
        promotionBonusAmount: p.promotionBonusAmount,
        physicalItemName: p.physicalItemName,
        physicalItems: p.physicalItemName ? [p.physicalItemName] : [],
        retentionFloorGmv: 0,
        promotionCeilingGmv: 0,
        retentionMultiplier: 1.0,
        allowanceAmount: 0,
        perks: [],
        motivationQuote: '',
        project: {
          projectName: p.projectName,
          subTaskBullets: p.subTasks,
        },
      }));

      await levelingApi.saveAdminDepartmentConfig({
        departmentId: activeDeptId,
        departmentName: activeDeptName,
        year: 2026,
        levels: convertedLevels,
      });

      Alert.alert(
        'Thành Công',
        `Đã lưu toàn bộ Dự án & Việc con phòng ban ${activeDeptName}! Dữ liệu đã chuyển về cho Leader để giao các đầu việc cho nhân sự.`,
      );
      loadData();
    } catch (err: any) {
      Alert.alert('Lỗi lưu dự án', err?.response?.data?.message || err?.message || 'Có lỗi xảy ra');
    } finally {
      setIsSavingProject(false);
    }
  };

  const handleConfigNameChange = (levelNumber: number, text: string) => {
    setDeptLevelConfigs((prev) =>
      prev.map((item) =>
        item.levelNumber === levelNumber
          ? { ...item, customLevelName: text, displayName: text, badgeTitle: text }
          : item,
      ),
    );
  };

  const handleConfigRewardTypeChange = (
    levelNumber: number,
    rewardType: 'CASH' | 'PHYSICAL_ITEM' | 'HYBRID',
  ) => {
    setDeptLevelConfigs((prev) =>
      prev.map((item) => (item.levelNumber === levelNumber ? { ...item, rewardType } : item)),
    );
  };

  const handleConfigBonusAmountChange = (levelNumber: number, amount: number) => {
    setDeptLevelConfigs((prev) =>
      prev.map((item) =>
        item.levelNumber === levelNumber ? { ...item, promotionBonusAmount: amount } : item,
      ),
    );
  };

  const handleConfigPhysicalItemChange = (levelNumber: number, physicalItemName: string) => {
    setDeptLevelConfigs((prev) =>
      prev.map((item) => (item.levelNumber === levelNumber ? { ...item, physicalItemName } : item)),
    );
  };

  const handleConfigAllowanceChange = (levelNumber: number, allowanceAmount: number) => {
    setDeptLevelConfigs((prev) =>
      prev.map((item) => (item.levelNumber === levelNumber ? { ...item, allowanceAmount } : item)),
    );
  };

  const handleConfigMultiplierChange = (levelNumber: number, retentionMultiplier: number) => {
    setDeptLevelConfigs((prev) =>
      prev.map((item) =>
        item.levelNumber === levelNumber ? { ...item, retentionMultiplier } : item,
      ),
    );
  };

  const handleAddLevel = () => {
    setDeptLevelConfigs((prev) => {
      const nextLevelNumber = (prev.length > 0 ? Math.max(...prev.map((c) => c.levelNumber)) : 0) + 1;
      const defaultName = LEVEL_DEFAULT_NAMES[nextLevelNumber] || `Level ${nextLevelNumber}`;
      const colorHex = LEVEL_COLORS[nextLevelNumber] || (nextLevelNumber > 8 ? '#D4AF37' : '#2196F3');

      const newLevel: DepartmentLevelItem = {
        levelNumber: nextLevelNumber,
        levelName: `Level ${nextLevelNumber}`,
        defaultName,
        customLevelName: defaultName,
        displayName: defaultName,
        badgeTitle: defaultName,
        colorHex,
        minTenureMonths: nextLevelNumber * 3,
        targetShiftsCount: nextLevelNumber * 30,
        rewardType: 'HYBRID',
        promotionBonusAmount: (nextLevelNumber - 1) * 500000,
        physicalItemName: '',
        allowanceAmount: (nextLevelNumber - 1) * 300000,
        retentionMultiplier: 1.0 + (nextLevelNumber - 1) * 0.2,
      };

      return [...prev, newLevel];
    });
  };

  const handleRemoveLevel = (levelNumber: number) => {
    if (levelNumber <= 1) {
      Alert.alert('Không thể xóa', 'Hệ thống cần tối thiểu Level 1.');
      return;
    }
    Alert.alert(
      'Xác nhận xóa',
      `Bạn có chắc chắn muốn xóa cấu hình Level ${levelNumber} khỏi phòng ban này?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => {
            setDeptLevelConfigs((prev) => prev.filter((c) => c.levelNumber !== levelNumber));
          },
        },
      ],
    );
  };

  const handleSaveConfigs = async () => {
    if (!activeDeptId) return;
    try {
      setIsSavingConfig(true);
      await levelingApi.saveDepartmentLevelConfigs(
        activeDeptId,
        deptLevelConfigs.map((c) => ({
          levelNumber: c.levelNumber,
          customLevelName: c.customLevelName || c.defaultName,
          badgeTitle: c.badgeTitle || c.defaultName,
          rewardType: c.rewardType || 'HYBRID',
          promotionBonusAmount: c.promotionBonusAmount || 0,
          physicalItemName: c.physicalItemName || '',
          allowanceAmount: c.allowanceAmount || 0,
          retentionMultiplier: c.retentionMultiplier || 1.0,
          perks: c.perks || [],
          motivationQuote: c.motivationQuote || '',
        })),
      );
      Alert.alert(
        'Thành công',
        `Đã lưu cấu hình danh xưng & phần thưởng cấp bậc cho phòng ${activeDeptName}!`,
      );
      loadData();
    } catch (err: any) {
      Alert.alert('Lỗi lưu cấu hình', err?.response?.data?.message || err?.message || 'Có lỗi xảy ra');
    } finally {
      setIsSavingConfig(false);
    }
  };

  const pendingCount = promotionRequests.filter((r) => r.status === 'PENDING').length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isAdmin
            ? currentMode === 'config_only'
              ? 'Cấu Hình Level & Dự Án'
              : currentMode === 'review_only'
              ? 'Duyệt Cấp Bậc & Nhân Sự'
              : 'Quản Trị Cấp Bậc'
            : 'Hệ Thống Phân Cấp Nhân Sự'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Top Banner / Summary */}
      {isAdmin ? (
        <View style={styles.adminSummaryCard}>
          <View style={styles.adminSummaryLeft}>
            <View style={styles.adminIconWrapper}>
              <Ionicons
                name={currentMode === 'config_only' ? 'construct' : 'shield-checkmark'}
                size={24}
                color="#EAB308"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.adminCardTitle}>
                {currentMode === 'config_only'
                  ? 'Cấu Hình Danh Xưng & Dự Án'
                  : currentMode === 'review_only'
                  ? 'Quản Trị Duyệt Thăng Cấp'
                  : 'Quản Trị Phân Cấp Nhân Sự'}
              </Text>
              <Text style={styles.adminCardSubtitle}>
                {currentMode === 'config_only'
                  ? `${activeDeptName} • Cấu hình danh xưng, phần thưởng & dự án thăng cấp`
                  : `${activeDeptName} • ${departmentMembers.length} nhân sự • ${pendingCount} đề xuất chờ duyệt`}
              </Text>
            </View>
          </View>
        </View>
      ) : progressData ? (
        <View style={styles.profileSummaryCard}>
          <View style={styles.avatarWrapper}>
            {getAbsoluteImageUrl(progressData.avatarUrl) ? (
              <Image
                source={{ uri: getAbsoluteImageUrl(progressData.avatarUrl)! }}
                style={[
                  styles.avatarImage,
                  { borderColor: progressData.currentLevel.colorHex || '#2196F3' },
                ]}
              />
            ) : (
              <View
                style={[
                  styles.avatarFallback,
                  {
                    borderColor: progressData.currentLevel.colorHex || '#2196F3',
                    backgroundColor: `${progressData.currentLevel.colorHex || '#2196F3'}25`,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.avatarFallbackText,
                    { color: progressData.currentLevel.colorHex || '#2196F3' },
                  ]}
                >
                  {(progressData.fullName || 'ML').trim().charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View
              style={[
                styles.levelBadgeMini,
                { backgroundColor: progressData.currentLevel.colorHex || '#2196F3' },
              ]}
            >
              <Text style={styles.levelBadgeMiniText}>{progressData.currentLevel.levelNumber}</Text>
            </View>
          </View>

          <View style={styles.profileInfo}>
            <LevelNameBadge
              name={progressData.fullName}
              levelNumber={progressData.currentLevel.levelNumber}
              badgeTitle={progressData.currentLevel.displayName}
              size="lg"
            />
            <Text style={styles.deptText}>
              Phòng: {progressData.departmentName} • Thâm niên: {progressData.metrics.tenure.currentMonths} tháng
            </Text>
          </View>
        </View>
      ) : null}

      {/* Interactive Tabs by Role */}
      {isAdmin && currentMode === 'config_only' && (
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'config' && styles.tabBtnActive]}
            onPress={() => setActiveTab('config')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="settings-outline"
              size={15}
              color={activeTab === 'config' ? '#2563EB' : '#94A3B8'}
            />
            <Text
              style={[styles.tabText, activeTab === 'config' && styles.tabTextActive]}
              numberOfLines={1}
            >
              Cấu Hình Danh Xưng
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'projects' && styles.tabBtnActive]}
            onPress={() => setActiveTab('projects')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="briefcase-outline"
              size={15}
              color={activeTab === 'projects' ? '#2563EB' : '#94A3B8'}
            />
            <Text
              style={[styles.tabText, activeTab === 'projects' && styles.tabTextActive]}
              numberOfLines={1}
            >
              Cấu Hình Dự Án
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {isAdmin && currentMode === 'review_only' && (
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabBtn, leaderSubTab === 'pending_requests' && styles.tabBtnActive]}
            onPress={() => setLeaderSubTab('pending_requests')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="checkmark-done-circle-outline"
              size={15}
              color={leaderSubTab === 'pending_requests' ? '#2563EB' : '#94A3B8'}
            />
            <Text
              style={[styles.tabText, leaderSubTab === 'pending_requests' && styles.tabTextActive]}
              numberOfLines={1}
            >
              Chờ Duyệt ({promotionRequests.length})
            </Text>
            {pendingCount > 0 && (
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingBadgeText}>{pendingCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, leaderSubTab === 'members_list' && styles.tabBtnActive]}
            onPress={() => setLeaderSubTab('members_list')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="people-outline"
              size={15}
              color={leaderSubTab === 'members_list' ? '#2563EB' : '#94A3B8'}
            />
            <Text
              style={[styles.tabText, leaderSubTab === 'members_list' && styles.tabTextActive]}
              numberOfLines={1}
            >
              Nhân Sự ({departmentMembers.length})
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {isAdmin && currentMode === 'full' && (
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'members' && styles.tabBtnActive]}
            onPress={() => setActiveTab('members')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="checkmark-done-circle-outline"
              size={15}
              color={activeTab === 'members' ? '#2563EB' : '#94A3B8'}
            />
            <Text
              style={[styles.tabText, activeTab === 'members' && styles.tabTextActive]}
              numberOfLines={1}
            >
              Duyệt Level
            </Text>
            {pendingCount > 0 && (
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingBadgeText}>{pendingCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'config' && styles.tabBtnActive]}
            onPress={() => setActiveTab('config')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="settings-outline"
              size={15}
              color={activeTab === 'config' ? '#2563EB' : '#94A3B8'}
            />
            <Text
              style={[styles.tabText, activeTab === 'config' && styles.tabTextActive]}
              numberOfLines={1}
            >
              Cấu Hình Danh Xưng
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'projects' && styles.tabBtnActive]}
            onPress={() => setActiveTab('projects')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="briefcase-outline"
              size={15}
              color={activeTab === 'projects' ? '#2563EB' : '#94A3B8'}
            />
            <Text
              style={[styles.tabText, activeTab === 'projects' && styles.tabTextActive]}
              numberOfLines={1}
            >
              Cấu Hình Dự Án
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {isLeader && (
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'roadmap' && styles.tabBtnActive]}
            onPress={() => setActiveTab('roadmap')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="ribbon-outline"
              size={15}
              color={activeTab === 'roadmap' ? '#2563EB' : '#94A3B8'}
            />
            <Text
              style={[styles.tabText, activeTab === 'roadmap' && styles.tabTextActive]}
              numberOfLines={1}
            >
              Lộ Trình
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'members' && styles.tabBtnActive]}
            onPress={() => setActiveTab('members')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="people-outline"
              size={15}
              color={activeTab === 'members' ? '#2563EB' : '#94A3B8'}
            />
            <Text
              style={[styles.tabText, activeTab === 'members' && styles.tabTextActive]}
              numberOfLines={1}
            >
              Nhân Sự
            </Text>
            {pendingCount > 0 && (
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingBadgeText}>{pendingCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Admin Department Selector Carousel (Only Admin can choose/switch departments) */}
      {isAdmin && deptList.length > 0 && (
        <View style={styles.deptSelectorContainer}>
          <Text style={styles.deptSelectorLabel}>Chọn phòng ban quản trị:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.deptPillScroll}>
            {deptList.map((d) => {
              const isSelected = (selectedDeptId || activeDeptId) === d.id;
              return (
                <TouchableOpacity
                  key={d.id}
                  style={[styles.deptPill, isSelected && styles.deptPillActive]}
                  onPress={() => setSelectedDeptId(d.id)}
                >
                  <Text style={[styles.deptPillText, isSelected && styles.deptPillTextActive]}>
                    {d.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Leader Fixed Department Scope Badge (Leader only manages their own department) */}
      {isLeader && activeDeptName && (
        <View style={styles.leaderDeptBadgeContainer}>
          <Ionicons name="business-outline" size={16} color="#38BDF8" />
          <Text style={styles.leaderDeptBadgeText}>
            Phòng ban phụ trách:{' '}
            <Text style={{ fontWeight: '700', color: '#FFF' }}>{activeDeptName}</Text>
          </Text>
        </View>
      )}

      {isLoading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Đang tải dữ liệu cấp bậc...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
        >
          {/* ========================================================= */}
          {/* TAB 1: ROADMAP & MY PROGRESS                              */}
          {/* ========================================================= */}
          {activeTab === 'roadmap' && (
            <>
              {progressData && (
                <EmployeeLevelProgressCard
                  progress={progressData}
                  onOpenSubmitModal={() =>
                    router.push({
                      pathname: '/employee/leveling/submit-promotion',
                      params: {
                        fromLevelNumber: progressData.currentLevel.levelNumber.toString(),
                        fromLevelName: progressData.currentLevel.displayName,
                        toLevelNumber: progressData.nextLevel.levelNumber.toString(),
                        toLevelName: progressData.nextLevel.displayName,
                        departmentId: activeDeptId,
                        departmentName: activeDeptName,
                      },
                    } as any)
                  }
                />
              )}

              {/* Nhiệm Vụ Cấp Bậc / Việc Con Được Leader Giao */}
              <View style={styles.assignedTasksSection}>
                <View style={styles.assignedTasksHeaderRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={styles.assignedTasksIconBox}>
                      <Ionicons name="clipboard-outline" size={18} color="#0F766E" />
                    </View>
                    <View>
                      <Text style={styles.assignedTasksHeaderTitle}>Công Việc Được Leader Giao</Text>
                      <Text style={styles.assignedTasksHeaderSub}>
                        {myAssignedTasks.length > 0
                          ? `${myAssignedTasks.filter((i) => i.subTask.status === 'LEADER_APPROVED').length}/${myAssignedTasks.length} việc đã hoàn thành`
                          : 'Dự án & đầu mục công việc cấp bậc'}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.assignedTasksViewAllBtn}
                    onPress={() =>
                      router.push(
                        (isLeader ? '/leader/level-projects' : '/employee/level-projects') as any
                      )
                    }
                    activeOpacity={0.7}
                  >
                    <Text style={styles.assignedTasksViewAllText}>Chi tiết</Text>
                    <Ionicons name="chevron-forward" size={14} color="#0F766E" />
                  </TouchableOpacity>
                </View>

                {myAssignedTasks.length === 0 ? (
                  <View style={styles.emptyAssignedTasksBox}>
                    <Ionicons name="folder-open-outline" size={36} color="#94A3B8" />
                    <Text style={styles.emptyAssignedTasksTitle}>Chưa có công việc nào được giao</Text>
                    <Text style={styles.emptyAssignedTasksSub}>
                      {isLeader
                        ? 'Khi bạn tự nhận việc trong dự án hoặc được phân công việc con, danh sách nhiệm vụ của bạn sẽ hiển thị tại đây.'
                        : 'Khi Trưởng nhóm (Leader) phân công các đầu mục việc trong dự án cho bạn, danh sách nhiệm vụ và phần thưởng sẽ hiển thị tại đây.'}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.assignedTasksList}>
                    {myAssignedTasks.map((item) => {
                      const { project, subTask } = item;
                      const isApproved = subTask.status === 'LEADER_APPROVED';
                      const isSubmitted = subTask.status === 'SUBMITTED';

                      return (
                        <TouchableOpacity
                          key={subTask.id}
                          style={[styles.assignedTaskRow, isSubmitted && styles.assignedTaskRowSubmitted]}
                          onPress={() =>
                            router.push(
                              (isLeader ? '/leader/level-projects' : '/employee/level-projects') as any
                            )
                          }
                          activeOpacity={0.7}
                        >
                          <View
                            style={[
                              styles.assignedTaskIndexCircle,
                              isApproved && { backgroundColor: '#ECFDF5', borderColor: '#059669' },
                              isSubmitted && { backgroundColor: '#FEF3C7', borderColor: '#D97706' },
                            ]}
                          >
                            <Text
                              style={[
                                styles.assignedTaskIndexText,
                                isApproved && { color: '#059669', fontWeight: 'bold' },
                                isSubmitted && { color: '#B45309', fontWeight: 'bold' },
                              ]}
                            >
                              {isApproved ? '✓' : subTask.orderNumber}
                            </Text>
                          </View>

                          <View style={{ flex: 1, marginRight: 8 }}>
                            <Text
                              style={[styles.assignedTaskTitle, isApproved && styles.assignedTaskTitleDone]}
                              numberOfLines={1}
                            >
                              {subTask.title}
                            </Text>
                            <Text style={styles.assignedTaskSubText} numberOfLines={1}>
                              {project.projectName || project.levelName} • {subTask.targetKpi || 'Nghiệm thu Vòng 1'}
                            </Text>
                          </View>

                          <View>
                            {isApproved ? (
                              <View style={styles.tagApproved}>
                                <Text style={styles.tagApprovedText}>Đã duyệt</Text>
                              </View>
                            ) : isSubmitted ? (
                              <View style={styles.tagPending}>
                                <Text style={styles.tagPendingText}>Chờ duyệt</Text>
                              </View>
                            ) : (
                              <View style={styles.tagSubmitAction}>
                                <Text style={styles.tagSubmitActionText}>Nộp báo cáo</Text>
                              </View>
                            )}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>

              {/* Interactive 8 Levels Roadmap */}
              <View style={styles.roadmapCard}>
                <View style={styles.roadmapHeaderRow}>
                  <Text style={styles.roadmapTitle}>Hệ Thống 8 Cấp Bậc ({activeDeptName})</Text>
                  {isAdmin && (
                    <TouchableOpacity
                      style={styles.quickEditBtn}
                      onPress={() => setActiveTab('config')}
                    >
                      <Ionicons name="create-outline" size={14} color="#2563EB" />
                      <Text style={styles.quickEditText}>Đổi Tên Level</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.roadmapList}>
                  {deptLevelConfigs.map((lvl) => {
                    const color = LEVEL_COLORS[lvl.levelNumber] || '#2196F3';
                    const isPassed = (progressData?.currentLevel?.levelNumber || 1) >= lvl.levelNumber;
                    const isCurrent = (progressData?.currentLevel?.levelNumber || 1) === lvl.levelNumber;

                    return (
                      <TouchableOpacity
                        key={lvl.levelNumber}
                        style={[
                          styles.roadmapStepRow,
                          isCurrent && { backgroundColor: `${color}08`, borderRadius: 12, padding: 6 },
                        ]}
                        onPress={() => {
                          if (isAdmin) {
                            setActiveTab('config');
                          } else {
                            Alert.alert(
                              `Level ${lvl.levelNumber}: ${lvl.displayName}`,
                              `Yêu cầu thâm niên tối thiểu: ${lvl.minTenureMonths} tháng\nĐịnh mức ca làm: ${lvl.targetShiftsCount} ca\nMàu nhận diện: ${color}`,
                            );
                          }
                        }}
                      >
                        <View style={styles.roadmapStepLeft}>
                          <View
                            style={[
                              styles.roadmapCircle,
                              { borderColor: color },
                              isPassed && { backgroundColor: color },
                            ]}
                          >
                            <Text
                              style={[
                                styles.roadmapCircleText,
                                { color: isPassed ? '#FFF' : color },
                              ]}
                            >
                              {lvl.levelNumber}
                            </Text>
                          </View>
                          {lvl.levelNumber < 8 && <View style={styles.roadmapLine} />}
                        </View>

                        <View style={styles.roadmapStepContent}>
                          <View style={styles.roadmapStepHeader}>
                            <Text style={[styles.roadmapStepName, { color }]}>
                              Level {lvl.levelNumber} - {lvl.displayName}
                            </Text>
                            {isCurrent && (
                              <View style={[styles.currentTag, { backgroundColor: `${color}20` }]}>
                                <Text style={[styles.currentTagText, { color }]}>Cấp của bạn</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.roadmapStepDesc}>
                            {lvl.levelNumber === 1 && 'Học việc / Thử việc, làm quen quy trình nội bộ'}
                            {lvl.levelNumber === 2 && 'Chính thức, độc lập tác chiến, đầy đủ phúc lợi'}
                            {lvl.levelNumber === 3 && 'Thâm niên ≥ 6 tháng, thành thạo 100% chuyên môn'}
                            {lvl.levelNumber === 4 && 'Nhân sự nòng cốt, Top hiệu suất / doanh số'}
                            {lvl.levelNumber === 5 && 'Quản lý đội nhóm, duyệt đơn cấp 1'}
                            {lvl.levelNumber === 6 && 'Trưởng phòng, quản lý chi phí & quy trình'}
                            {lvl.levelNumber === 7 && 'Giám đốc khối, quản trị chiến lược'}
                            {lvl.levelNumber === 8 && 'Ban điều hành, tối cao toàn công ty'}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </>
          )}

          {/* ========================================================= */}
          {/* TAB 2: MEMBERS MANAGEMENT & PROMOTION APPROVALS           */}
          {/* ========================================================= */}
          {activeTab === 'members' && isLeaderOrAdmin && (
            <View style={styles.leaderContainer}>
              {/* Leader Sub-tabs (Only show if not in Admin review_only mode where it is already at the top) */}
              {(!isAdmin || currentMode !== 'review_only') && (
                <View style={styles.subTabRow}>
                  <TouchableOpacity
                    style={[styles.subTabBtn, leaderSubTab === 'members_list' && styles.subTabBtnActive]}
                    onPress={() => setLeaderSubTab('members_list')}
                  >
                    <Text
                      style={[
                        styles.subTabText,
                        leaderSubTab === 'members_list' && styles.subTabTextActive,
                      ]}
                    >
                      Thành Viên ({departmentMembers.length})
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.subTabBtn,
                      leaderSubTab === 'pending_requests' && styles.subTabBtnActive,
                    ]}
                    onPress={() => setLeaderSubTab('pending_requests')}
                  >
                    <Text
                      style={[
                        styles.subTabText,
                        leaderSubTab === 'pending_requests' && styles.subTabTextActive,
                      ]}
                    >
                      Chờ Duyệt Minh Chứng ({promotionRequests.length})
                    </Text>
                    {pendingCount > 0 && <View style={styles.miniDot} />}
                  </TouchableOpacity>
                </View>
              )}

              {/* Sub-tab 1: Department Members List */}
              {leaderSubTab === 'members_list' && (
                <View style={styles.membersList}>
                  {departmentMembers.map((m, idx) => {
                    const memberLevel = m.currentLevelNumber || m.profile?.currentLevelNumber || 1;
                    const memberName = m.fullName || m.profile?.fullName || m.userCode || 'Nhân sự';
                    const rawAvatar = m.avatarUrl || m.profile?.avatarUrl;
                    const avatarUri = getAbsoluteImageUrl(rawAvatar);

                    return (
                      <TouchableOpacity
                        key={m.id || idx}
                        style={styles.memberCard}
                        activeOpacity={isAdmin ? 0.7 : 1}
                        onPress={() => {
                          if (isAdmin) {
                            setDirectChangeUser({
                              id: m.id,
                              fullName: memberName,
                              currentLevelNumber: memberLevel,
                              departmentName: activeDeptName,
                            });
                          }
                        }}
                      >
                        <View style={styles.memberInfoRow}>
                          {avatarUri ? (
                            <Image
                              source={{ uri: avatarUri }}
                              style={[
                                styles.memberAvatar,
                                { borderColor: LEVEL_COLORS[memberLevel] || '#2196F3' },
                              ]}
                            />
                          ) : (
                            <View
                              style={[
                                styles.memberAvatarFallback,
                                {
                                  borderColor: LEVEL_COLORS[memberLevel] || '#2196F3',
                                  backgroundColor: `${LEVEL_COLORS[memberLevel] || '#2196F3'}25`,
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.memberAvatarFallbackText,
                                  { color: LEVEL_COLORS[memberLevel] || '#2196F3' },
                                ]}
                              >
                                {memberName.trim().charAt(0).toUpperCase()}
                              </Text>
                            </View>
                          )}
                          <View style={{ flex: 1 }}>
                            <LevelNameBadge
                              name={memberName}
                              levelNumber={memberLevel}
                              size="md"
                            />
                            <Text style={styles.memberMeta}>
                              Mã: {m.userCode} • {m.profile?.position?.name || 'Nhân viên'}
                            </Text>
                          </View>

                          {isAdmin && (
                            <View style={styles.directChangeBtn}>
                              <Ionicons name="flash" size={14} color="#FFF" />
                              <Text style={styles.directChangeBtnText}>Đổi Level</Text>
                            </View>
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}

                  {departmentMembers.length === 0 && (
                    <View style={styles.emptyCard}>
                      <Ionicons name="people-outline" size={36} color="#94A3B8" />
                      <Text style={styles.emptyCardText}>Chưa có thành viên nào trong phòng ban này</Text>
                    </View>
                  )}
                </View>
              )}

              {/* Sub-tab 2: Promotion Requests List */}
              {leaderSubTab === 'pending_requests' && (
                <View style={styles.requestsList}>
                  {promotionRequests.map((req) => {
                    const reqColor = LEVEL_COLORS[req.toLevelNumber] || '#4CAF50';
                    const name = req.user?.profile?.fullName || req.user?.userCode || 'Nhân viên';

                    return (
                      <TouchableOpacity
                        key={req.id}
                        style={styles.requestCard}
                        onPress={() => {
                          const routePath = isAdmin
                            ? '/admin/levels/review-promotion'
                            : '/leader/leveling/review-promotion';
                          router.push({
                            pathname: routePath as any,
                            params: {
                              requestId: req.id,
                              fromLevelNumber: String(req.fromLevelNumber),
                              toLevelNumber: String(req.toLevelNumber),
                              departmentName: req.department?.name || activeDeptName,
                            },
                          });
                        }}
                      >
                        <View style={styles.requestHeader}>
                          <LevelNameBadge
                            name={name}
                            levelNumber={req.fromLevelNumber}
                            size="md"
                          />
                          <View
                            style={[
                              styles.statusTag,
                              req.status === 'APPROVED' && { backgroundColor: '#DCFCE7' },
                              req.status === 'REJECTED' && { backgroundColor: '#FEE2E2' },
                              req.status === 'SUPPLEMENT_REQUESTED' && { backgroundColor: '#FEF3C7' },
                            ]}
                          >
                            <Text
                              style={[
                                styles.statusTagText,
                                req.status === 'APPROVED' && { color: '#15803D' },
                                req.status === 'REJECTED' && { color: '#B91C1C' },
                                req.status === 'SUPPLEMENT_REQUESTED' && { color: '#B45309' },
                              ]}
                            >
                              {req.status === 'PENDING'
                                ? 'Chờ Duyệt'
                                : req.status === 'APPROVED'
                                ? 'Đã Duyệt'
                                : req.status === 'SUPPLEMENT_REQUESTED'
                                ? 'Yêu Cầu Bổ Sung'
                                : 'Từ Chối'}
                            </Text>
                          </View>
                        </View>

                        <Text style={styles.requestTargetText}>
                          Đề xuất thăng cấp: Level {req.fromLevelNumber} ➔{' '}
                          <Text style={{ color: reqColor, fontWeight: '700' }}>
                            Level {req.toLevelNumber}
                          </Text>
                        </Text>

                        {req.submissionNote && (
                          <Text style={styles.requestNote} numberOfLines={2}>
                            "{req.submissionNote}"
                          </Text>
                        )}

                        <View style={styles.requestFooter}>
                          <View style={styles.evidenceBadge}>
                            <Ionicons name="images-outline" size={14} color="#2563EB" />
                            <Text style={styles.evidenceBadgeText}>
                              {req.evidenceImages?.length || 0} ảnh bằng chứng
                            </Text>
                          </View>

                          <View style={styles.reviewActionHint}>
                            <Text style={styles.reviewActionHintText}>Xem & Thẩm định</Text>
                            <Ionicons name="chevron-forward" size={14} color="#2563EB" />
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}

                  {promotionRequests.length === 0 && (
                    <View style={styles.emptyCard}>
                      <Ionicons name="checkmark-done-circle-outline" size={40} color="#16A34A" />
                      <Text style={styles.emptyCardText}>Không có đề xuất nào đang chờ duyệt</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          )}

          {/* ========================================================= */}
          {/* TAB 3: DIRECT LEVEL NAME CONFIGURATION (ADMIN ONLY)     */}
          {/* ========================================================= */}
          {activeTab === 'config' && isAdmin && (
            <View style={styles.configContainer}>
              <View style={styles.configHeaderCard}>
                <Ionicons name="options-outline" size={24} color="#2563EB" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.configHeaderTitle}>Cấu Hình Danh Xưng Cấp Bậc ({activeDeptName})</Text>
                  <Text style={styles.configHeaderSubtitle}>
                    Tùy chỉnh tên danh xưng, thêm cấp bậc mới hoặc xóa cấp bậc cho phòng ban này.
                  </Text>
                </View>
              </View>

              {deptLevelConfigs.map((lvl) => {
                const color = LEVEL_COLORS[lvl.levelNumber] || (lvl.levelNumber > 8 ? '#D4AF37' : '#2196F3');
                const isLevelOne = lvl.levelNumber === 1;

                return (
                  <View key={lvl.levelNumber} style={styles.configRowCard}>
                    <View style={styles.configRowHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                        <View style={[styles.configDot, { backgroundColor: color }]} />
                        <Text style={[styles.configLevelTitle, { color }]}>
                          Level {lvl.levelNumber} (Mặc định: {lvl.defaultName || `Cấp ${lvl.levelNumber}`})
                        </Text>
                      </View>
                      {deptLevelConfigs.length > 1 && lvl.levelNumber > 1 && (
                        <TouchableOpacity
                          onPress={() => handleRemoveLevel(lvl.levelNumber)}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                          style={{ padding: 4 }}
                        >
                          <Ionicons name="trash-outline" size={18} color="#EF4444" />
                        </TouchableOpacity>
                      )}
                    </View>

                    <Text style={styles.configFieldLabel}>Tên Danh Xưng Cấp Bậc:</Text>
                    <TextInput
                      style={styles.configInput}
                      placeholder={`Nhập tên riêng cho Level ${lvl.levelNumber}...`}
                      placeholderTextColor="#94A3B8"
                      value={lvl.customLevelName}
                      onChangeText={(txt) => handleConfigNameChange(lvl.levelNumber, txt)}
                    />

                    {isLevelOne ? (
                      <View style={styles.configLevelOneBox}>
                        <Text style={styles.configLevelOneText}>
                          🌱 Cấp bậc khởi đầu (Thực tập) - Không áp dụng phần thưởng thăng cấp.
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.configRewardBox}>
                        <View style={styles.configRewardHeader}>
                          <Text style={styles.configRewardHeaderTitle}>
                            🎁 CẤU HÌNH PHẦN THƯỞNG ĐẠT LEVEL {lvl.levelNumber}
                          </Text>
                        </View>

                        {/* Reward Type Option Pills */}
                        <Text style={styles.configFieldLabel}>Hình Thức Thưởng:</Text>
                        <View style={styles.configRewardPillRow}>
                          <TouchableOpacity
                            style={[
                              styles.configRewardPill,
                              lvl.rewardType === 'CASH' && styles.configRewardPillActive,
                            ]}
                            onPress={() => handleConfigRewardTypeChange(lvl.levelNumber, 'CASH')}
                          >
                            <Text
                              style={[
                                styles.configRewardPillText,
                                lvl.rewardType === 'CASH' && styles.configRewardPillTextActive,
                              ]}
                            >
                              💵 Tiền mặt
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[
                              styles.configRewardPill,
                              lvl.rewardType === 'PHYSICAL_ITEM' && styles.configRewardPillActive,
                            ]}
                            onPress={() => handleConfigRewardTypeChange(lvl.levelNumber, 'PHYSICAL_ITEM')}
                          >
                            <Text
                              style={[
                                styles.configRewardPillText,
                                lvl.rewardType === 'PHYSICAL_ITEM' && styles.configRewardPillTextActive,
                              ]}
                            >
                              🎁 Hiện vật
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[
                              styles.configRewardPill,
                              (lvl.rewardType === 'HYBRID' || !lvl.rewardType) && styles.configRewardPillActive,
                            ]}
                            onPress={() => handleConfigRewardTypeChange(lvl.levelNumber, 'HYBRID')}
                          >
                            <Text
                              style={[
                                styles.configRewardPillText,
                                (lvl.rewardType === 'HYBRID' || !lvl.rewardType) && styles.configRewardPillTextActive,
                              ]}
                            >
                              ✨ Kết hợp
                            </Text>
                          </TouchableOpacity>
                        </View>

                        {/* Cash Amount */}
                        {(lvl.rewardType === 'CASH' || lvl.rewardType === 'HYBRID' || !lvl.rewardType) && (
                          <View style={{ marginTop: 8 }}>
                            <Text style={styles.configFieldLabel}>Tiền Thưởng Nóng Thăng Cấp (VNĐ):</Text>
                            <TextInput
                              style={styles.configInput}
                              keyboardType="number-pad"
                              placeholder="VD: 1000000"
                              placeholderTextColor="#94A3B8"
                              value={lvl.promotionBonusAmount ? String(lvl.promotionBonusAmount) : ''}
                              onChangeText={(txt) =>
                                handleConfigBonusAmountChange(
                                  lvl.levelNumber,
                                  Number(txt.replace(/[^0-9]/g, '')) || 0,
                                )
                              }
                            />
                            {Boolean(lvl.promotionBonusAmount && lvl.promotionBonusAmount > 0) && (
                              <Text style={styles.configCashPreview}>
                                💰 Thưởng: {lvl.promotionBonusAmount?.toLocaleString('vi-VN')} VNĐ
                              </Text>
                            )}
                          </View>
                        )}

                        {/* Physical Gift */}
                        {(lvl.rewardType === 'PHYSICAL_ITEM' || lvl.rewardType === 'HYBRID' || !lvl.rewardType) && (
                          <View style={{ marginTop: 8 }}>
                            <Text style={styles.configFieldLabel}>Quà Tặng Hiện Vật (Team / Cá nhân):</Text>
                            <TextInput
                              style={styles.configInput}
                              placeholder="VD: Kỷ niệm chương, Balo cao cấp, Áo đồng phục VIP..."
                              placeholderTextColor="#94A3B8"
                              value={lvl.physicalItemName || ''}
                              onChangeText={(txt) =>
                                handleConfigPhysicalItemChange(lvl.levelNumber, txt)
                              }
                            />
                          </View>
                        )}

                        {/* Allowance */}
                        <View style={{ marginTop: 8 }}>
                          <Text style={styles.configFieldLabel}>Phụ Cấp Chức Danh / Chuyên Môn (VNĐ/tháng):</Text>
                          <TextInput
                            style={styles.configInput}
                            keyboardType="number-pad"
                            placeholder="VD: 500000"
                            placeholderTextColor="#94A3B8"
                            value={lvl.allowanceAmount ? String(lvl.allowanceAmount) : ''}
                            onChangeText={(txt) =>
                              handleConfigAllowanceChange(
                                lvl.levelNumber,
                                Number(txt.replace(/[^0-9]/g, '')) || 0,
                              )
                            }
                          />
                          {Boolean(lvl.allowanceAmount && lvl.allowanceAmount > 0) && (
                            <Text style={styles.configAllowancePreview}>
                              💼 +{lvl.allowanceAmount?.toLocaleString('vi-VN')} VNĐ/tháng
                            </Text>
                          )}
                        </View>

                        {/* Tet Wallet Multiplier */}
                        <View style={{ marginTop: 8 }}>
                          <Text style={styles.configFieldLabel}>Hệ Số Ví Thưởng Tết:</Text>
                          <TextInput
                            style={styles.configInput}
                            keyboardType="numeric"
                            placeholder="VD: 1.2"
                            placeholderTextColor="#94A3B8"
                            value={String(lvl.retentionMultiplier || 1.0)}
                            onChangeText={(txt) =>
                              handleConfigMultiplierChange(lvl.levelNumber, Number(txt) || 1.0)
                            }
                          />
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}

              {/* Add Level Button for Admin */}
              <TouchableOpacity
                style={styles.addLevelBtn}
                onPress={handleAddLevel}
                activeOpacity={0.8}
              >
                <Ionicons name="add-circle" size={22} color="#2563EB" />
                <Text style={styles.addLevelBtnText}>
                  + Thêm Cấp Bậc Mới (Level {deptLevelConfigs.length + 1})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveConfigBtn}
                onPress={handleSaveConfigs}
                disabled={isSavingConfig}
              >
                {isSavingConfig ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <Ionicons name="save-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
                    <Text style={styles.saveConfigBtnText}>Lưu Cấu Hình Danh Xưng</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* ========================================================= */}
          {/* TAB 4: PROJECT & SUBTASKS CONFIGURATION (ADMIN ONLY)     */}
          {/* ========================================================= */}
          {activeTab === 'projects' && isAdmin && (
            <View style={styles.configContainer}>
              <View style={styles.configHeaderCard}>
                <Ionicons name="briefcase-outline" size={24} color="#2563EB" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.configHeaderTitle}>Cấu Hình Dự Án Phòng Ban ({activeDeptName})</Text>
                  <Text style={styles.configHeaderSubtitle}>
                    Thiết lập các dự án & đầu việc con cho phòng ban. Dữ liệu sẽ tự động đẩy về cho Leader để phân công các đầu việc cho nhân sự.
                  </Text>
                </View>
              </View>

              {adminProjects.length === 0 ? (
                <View style={styles.emptyProjectContainer}>
                  <Ionicons name="folder-open-outline" size={54} color="#94A3B8" />
                  <Text style={styles.emptyProjectTitle}>Chưa có dự án nào cho phòng {activeDeptName}</Text>
                  <Text style={styles.emptyProjectSubtitle}>
                    Phòng ban này hiện chưa có dự án nào. Bấm nút bên dưới để tạo dự án và các việc con để Leader phân công cho nhân sự.
                  </Text>
                  <TouchableOpacity
                    style={styles.createFirstProjectBtn}
                    onPress={handleAddProject}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="add-circle" size={20} color="#FFF" style={{ marginRight: 6 }} />
                    <Text style={styles.createFirstProjectBtnText}>+ Thêm Dự Án Mới</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  {/* Department Project Selector Pills */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, marginBottom: 8 }}>
                    <Text style={styles.projectLevelSelectLabel}>DANH SÁCH DỰ ÁN PHÒNG BAN ({adminProjects.length}):</Text>
                    <TouchableOpacity style={styles.addProjectHeaderBtn} onPress={handleAddProject} activeOpacity={0.8}>
                      <Ionicons name="add-circle" size={16} color="#FFF" />
                      <Text style={styles.addProjectHeaderBtnText}>+ Thêm Dự Án</Text>
                    </TouchableOpacity>
                  </View>

                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.projectLevelScrollRow}>
                    {adminProjects.map((p, idx) => {
                      const isSelected = (selectedProjectId || adminProjects[0]?.id) === p.id;
                      return (
                        <TouchableOpacity
                          key={p.id}
                          style={[
                            styles.projectLevelPill,
                            isSelected && { backgroundColor: '#2563EB', borderColor: '#2563EB' },
                          ]}
                          onPress={() => {
                            setSelectedProjectId(p.id);
                            setEditingSubTaskIdx(null);
                          }}
                          activeOpacity={0.8}
                        >
                          <Text
                            style={[
                              styles.projectLevelPillText,
                              isSelected && { color: '#FFFFFF', fontWeight: 'bold' },
                            ]}
                          >
                            {idx + 1}. {p.projectName || `Dự án ${idx + 1}`}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>

                  {/* Active Focused Project Card */}
                  {(() => {
                    const currentProj = adminProjects.find((p) => p.id === (selectedProjectId || adminProjects[0]?.id)) || adminProjects[0];
                    if (!currentProj) return null;
                    const currentIdx = adminProjects.findIndex((p) => p.id === currentProj.id);

                    return (
                      <View style={styles.projectCard}>
                        <View style={styles.projectCardHeader}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                            <View style={[styles.projectColorBadge, { backgroundColor: '#2563EB' }]}>
                              <Text style={styles.projectColorBadgeText}>DỰ ÁN #{currentIdx + 1}</Text>
                            </View>
                            <Text style={[styles.projectCardTitle, { flex: 1 }]} numberOfLines={1}>
                              {currentProj.projectName || `Dự án ${currentIdx + 1}`}
                            </Text>
                          </View>
                          <TouchableOpacity
                            style={styles.deleteProjectHeaderBtn}
                            onPress={() => handleDeleteProject(currentProj.id)}
                            activeOpacity={0.7}
                          >
                            <Ionicons name="trash-outline" size={18} color="#EF4444" />
                          </TouchableOpacity>
                        </View>

                        {/* Project Name Input */}
                        <Text style={styles.configFieldLabel}>Tên Dự Án Phòng Ban:</Text>
                        <TextInput
                          style={styles.configInput}
                          placeholder="VD: Chiến dịch Marketing Tết 2026, Nâng cấp hệ thống Backend..."
                          placeholderTextColor="#94A3B8"
                          value={currentProj.projectName}
                          onChangeText={(txt) => handleUpdateProjectName(currentProj.id, txt)}
                        />

                        {/* Reward Config SubBox */}
                        <View style={styles.configRewardBox}>
                          <Text style={styles.configRewardHeaderTitle}>
                            🎁 CẤU HÌNH PHẦN THƯỞNG DỰ ÁN
                          </Text>

                          <Text style={styles.configFieldLabel}>Hình Thức Thưởng Dự Án:</Text>
                          <View style={styles.configRewardPillRow}>
                            <TouchableOpacity
                              style={[
                                styles.configRewardPill,
                                currentProj.rewardType === 'CASH' && styles.configRewardPillActive,
                              ]}
                              onPress={() => handleUpdateProjectRewardType(currentProj.id, 'CASH')}
                            >
                              <Text
                                style={[
                                  styles.configRewardPillText,
                                  currentProj.rewardType === 'CASH' && styles.configRewardPillTextActive,
                                ]}
                              >
                                💵 Tiền mặt
                              </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={[
                                styles.configRewardPill,
                                currentProj.rewardType === 'PHYSICAL_ITEM' && styles.configRewardPillActive,
                              ]}
                              onPress={() => handleUpdateProjectRewardType(currentProj.id, 'PHYSICAL_ITEM')}
                            >
                              <Text
                                style={[
                                  styles.configRewardPillText,
                                  currentProj.rewardType === 'PHYSICAL_ITEM' && styles.configRewardPillTextActive,
                                ]}
                              >
                                🎁 Hiện vật
                              </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={[
                                styles.configRewardPill,
                                (currentProj.rewardType === 'HYBRID' || !currentProj.rewardType) && styles.configRewardPillActive,
                              ]}
                              onPress={() => handleUpdateProjectRewardType(currentProj.id, 'HYBRID')}
                            >
                              <Text
                                style={[
                                  styles.configRewardPillText,
                                  (currentProj.rewardType === 'HYBRID' || !currentProj.rewardType) && styles.configRewardPillTextActive,
                                ]}
                              >
                                ✨ Kết hợp
                              </Text>
                            </TouchableOpacity>
                          </View>

                          {/* Cash Amount */}
                          {(currentProj.rewardType === 'CASH' || currentProj.rewardType === 'HYBRID' || !currentProj.rewardType) && (
                            <View style={{ marginTop: 8 }}>
                              <Text style={styles.configFieldLabel}>Quỹ Thưởng Tiền Mặt Dự Án (VNĐ):</Text>
                              <TextInput
                                style={styles.configInput}
                                keyboardType="number-pad"
                                placeholder="VD: 10000000"
                                placeholderTextColor="#94A3B8"
                                value={currentProj.promotionBonusAmount ? String(currentProj.promotionBonusAmount) : ''}
                                onChangeText={(txt) =>
                                  handleUpdateProjectBonusAmount(
                                    currentProj.id,
                                    Number(txt.replace(/[^0-9]/g, '')) || 0,
                                  )
                                }
                              />
                              {Boolean(currentProj.promotionBonusAmount && currentProj.promotionBonusAmount > 0) && (
                                <Text style={styles.configCashPreview}>
                                  💰 Quỹ thưởng: {currentProj.promotionBonusAmount?.toLocaleString('vi-VN')} VNĐ (Khi Leader phân chia các đầu việc con cho nhân sự, quỹ thưởng tự động chia theo Hệ số Level của nhân sự tham gia)
                                </Text>
                              )}
                            </View>
                          )}

                          {/* Physical Item */}
                          {(currentProj.rewardType === 'PHYSICAL_ITEM' || currentProj.rewardType === 'HYBRID' || !currentProj.rewardType) && (
                            <View style={{ marginTop: 8 }}>
                              <Text style={styles.configFieldLabel}>Quà Tặng Hiện Vật Dự Án (Để chung cho cả team):</Text>
                              <TextInput
                                style={styles.configInput}
                                placeholder="VD: Chuyến dã ngoại toàn đội, Bữa tiệc liên hoan..."
                                placeholderTextColor="#94A3B8"
                                value={currentProj.physicalItemName || ''}
                                onChangeText={(txt) =>
                                  handleUpdateProjectPhysicalItem(currentProj.id, txt)
                                }
                              />
                            </View>
                          )}
                        </View>

                        {/* SubTasks (Danh sách đầu việc con) */}
                        <Text style={[styles.configFieldLabel, { marginTop: 14, fontSize: 12, fontWeight: '700', color: '#1E293B' }]}>
                          DANH SÁCH ĐẦU CÔNG VIỆC CON ({currentProj.subTasks.length} việc):
                        </Text>
                        <Text style={{ fontSize: 11, color: '#64748B', marginBottom: 6 }}>
                          Leader sẽ phân chia từng đầu việc con này cho các nhân sự trong phòng ban.
                        </Text>

                        <View style={styles.subTasksListBox}>
                          {currentProj.subTasks.length > 0 ? (
                            currentProj.subTasks.map((bullet, idx) => (
                              <View key={idx} style={styles.subTaskRow}>
                                {editingSubTaskIdx === idx ? (
                                  <View style={styles.editSubTaskInlineRow}>
                                    <TextInput
                                      style={[styles.configInput, { flex: 1 }]}
                                      value={editingSubTaskText}
                                      onChangeText={setEditingSubTaskText}
                                    />
                                    <TouchableOpacity
                                      style={styles.saveBulletInlineBtn}
                                      onPress={() => handleEditSubTask(currentProj.id, idx, editingSubTaskText)}
                                    >
                                      <Text style={styles.saveBulletInlineBtnText}>Lưu</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                      style={styles.cancelBulletInlineBtn}
                                      onPress={() => setEditingSubTaskIdx(null)}
                                    >
                                      <Text style={styles.cancelBulletInlineBtnText}>Hủy</Text>
                                    </TouchableOpacity>
                                  </View>
                                ) : (
                                  <View style={styles.subTaskDisplayRow}>
                                    <Text style={styles.subTaskBulletText}>• {bullet}</Text>
                                    <View style={styles.subTaskActionsRow}>
                                      <TouchableOpacity
                                        style={styles.editSubTaskPillBtn}
                                        onPress={() => {
                                          setEditingSubTaskIdx(idx);
                                          setEditingSubTaskText(bullet);
                                        }}
                                      >
                                        <Text style={styles.editSubTaskPillBtnText}>Sửa</Text>
                                      </TouchableOpacity>
                                      <TouchableOpacity
                                        style={styles.deleteSubTaskPillBtn}
                                        onPress={() => handleDeleteSubTask(currentProj.id, idx)}
                                      >
                                        <Text style={styles.deleteSubTaskPillBtnText}>Xóa</Text>
                                      </TouchableOpacity>
                                    </View>
                                  </View>
                                )}
                              </View>
                            ))
                          ) : (
                            <Text style={styles.emptySubTasksNotice}>
                              Chưa có việc con nào trong dự án này. Hãy thêm đầu việc bên dưới!
                            </Text>
                          )}
                        </View>

                        {/* Add SubTask Input */}
                        <View style={styles.addSubTaskRow}>
                          <TextInput
                            style={[styles.configInput, { flex: 1 }]}
                            placeholder="+ Nhập đầu việc con mới..."
                            placeholderTextColor="#94A3B8"
                            value={newSubTaskInput}
                            onChangeText={setNewSubTaskInput}
                            onSubmitEditing={() => handleAddSubTask(currentProj.id)}
                            returnKeyType="done"
                          />
                          <TouchableOpacity
                            style={styles.addSubTaskBtn}
                            onPress={() => handleAddSubTask(currentProj.id)}
                          >
                            <Text style={styles.addSubTaskBtnText}>+ Thêm việc</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })()}

                  {/* Save All Projects Button */}
                  <TouchableOpacity
                    style={styles.saveProjectsBtn}
                    onPress={handleSaveAllProjects}
                    disabled={isSavingProject}
                  >
                    {isSavingProject ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <>
                        <Ionicons name="save-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
                        <Text style={styles.saveProjectsBtnText}>
                          LƯU DỰ ÁN PHÒNG {activeDeptName.toUpperCase()}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}

          <View style={{ height: 50 }} />
        </ScrollView>
      )}

      {/* Modals */}
      <LeaderPromotionReviewModal
        visible={!!selectedReviewRequest}
        request={selectedReviewRequest}
        onClose={() => setSelectedReviewRequest(null)}
        onSuccess={loadData}
      />

      <DirectLevelChangeModal
        visible={!!directChangeUser}
        targetUser={directChangeUser}
        isAdmin={isAdmin}
        onClose={() => setDirectChangeUser(null)}
        onSuccess={loadData}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#0F172A',
  },
  backBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFF',
  },
  adminSummaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    padding: 14,
    marginHorizontal: 16,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  adminSummaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  adminIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.3)',
  },
  adminCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  adminCardSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  profileSummaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    padding: 14,
    marginHorizontal: 16,
    borderRadius: 14,
    marginBottom: 10,
    gap: 12,
    overflow: 'hidden',
  },
  avatarWrapper: {
    position: 'relative',
    flexShrink: 0,
  },
  avatarImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2.5,
  },
  avatarFallback: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    fontSize: 20,
    fontWeight: '900',
  },
  levelBadgeMini: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#1E293B',
  },
  levelBadgeMiniText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFF',
  },
  profileInfo: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  deptText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 3,
    marginBottom: 10,
    gap: 4,
    alignItems: 'center',
    height: 44,
  },
  tabBtn: {
    flex: 1,
    height: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
    gap: 4,
    paddingHorizontal: 4,
  },
  tabBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  tabTextActive: {
    color: '#2563EB',
    fontWeight: '700',
  },
  pendingBadge: {
    backgroundColor: '#EF4444',
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  pendingBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 11,
  },
  deptSelectorContainer: {
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  deptSelectorLabel: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 6,
    fontWeight: '600',
  },
  leaderDeptBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    marginHorizontal: 16,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
    gap: 8,
  },
  leaderDeptBadgeText: {
    fontSize: 13,
    color: '#94A3B8',
  },
  deptPillScroll: {
    flexDirection: 'row',
  },
  deptPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: '#1E293B',
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  deptPillActive: {
    backgroundColor: '#2563EB',
    borderColor: '#3B82F6',
  },
  deptPillText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  deptPillTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  content: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
  },
  loadingBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748B',
  },
  roadmapCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  roadmapHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  roadmapTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  quickEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  quickEditText: {
    fontSize: 11,
    color: '#2563EB',
    fontWeight: '700',
  },
  roadmapList: {
    gap: 2,
  },
  roadmapStepRow: {
    flexDirection: 'row',
    minHeight: 56,
  },
  roadmapStepLeft: {
    alignItems: 'center',
    width: 32,
    marginRight: 10,
  },
  roadmapCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    zIndex: 2,
  },
  roadmapCircleText: {
    fontSize: 12,
    fontWeight: '800',
  },
  roadmapLine: {
    flex: 1,
    width: 2,
    backgroundColor: '#E2E8F0',
    marginVertical: 2,
  },
  roadmapStepContent: {
    flex: 1,
    paddingBottom: 12,
  },
  roadmapStepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  roadmapStepName: {
    fontSize: 14,
    fontWeight: '700',
  },
  currentTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  currentTagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  roadmapStepDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
  leaderContainer: {
    paddingHorizontal: 16,
  },
  subTabRow: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 10,
    padding: 4,
    marginBottom: 14,
  },
  subTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  subTabBtnActive: {
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  subTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  subTabTextActive: {
    color: '#0F172A',
    fontWeight: '700',
  },
  miniDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  membersList: {
    gap: 10,
  },
  memberCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  memberInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
  },
  memberAvatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarFallbackText: {
    fontSize: 17,
    fontWeight: '800',
  },
  memberMeta: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  directChangeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  directChangeBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
  },
  requestsList: {
    gap: 12,
  },
  requestCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#FEF3C7',
  },
  statusTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
  requestTargetText: {
    fontSize: 14,
    color: '#334155',
    marginBottom: 6,
  },
  requestNote: {
    fontSize: 13,
    color: '#64748B',
    fontStyle: 'italic',
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 8,
    marginBottom: 10,
  },
  requestFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
  },
  evidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  evidenceBadgeText: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '600',
  },
  reviewActionHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  reviewActionHintText: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '700',
  },
  emptyCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  emptyCardText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
  },
  configContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  configHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: 10,
    marginBottom: 4,
  },
  configHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E40AF',
  },
  configHeaderSubtitle: {
    fontSize: 11,
    color: '#3B82F6',
    marginTop: 2,
  },
  configRowCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  configRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  configDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  configLevelTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  configInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
  },
  configFieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
    marginTop: 6,
    marginBottom: 4,
  },
  configLevelOneBox: {
    marginTop: 8,
    backgroundColor: '#ECFDF5',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  configLevelOneText: {
    fontSize: 12,
    color: '#047857',
    fontStyle: 'italic',
  },
  configRewardBox: {
    marginTop: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 12,
  },
  configRewardHeader: {
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 6,
  },
  configRewardHeaderTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E40AF',
    letterSpacing: 0.5,
  },
  configRewardPillRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  configRewardPill: {
    flex: 1,
    paddingVertical: 7,
    paddingHorizontal: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  configRewardPillActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  configRewardPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  configRewardPillTextActive: {
    color: '#1D4ED8',
    fontWeight: '700',
  },
  configCashPreview: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
    marginTop: 3,
  },
  configAllowancePreview: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0D9488',
    marginTop: 3,
  },
  addLevelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#93C5FD',
    borderStyle: 'dashed',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginTop: 4,
    marginBottom: 8,
  },
  addLevelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2563EB',
  },
  saveConfigBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 20,
    shadowColor: '#2563EB',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  saveConfigBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },
  projectLevelSelectLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#64748B',
    letterSpacing: 0.8,
    marginTop: 4,
    marginBottom: 6,
  },
  addProjectHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#2563EB',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  addProjectHeaderBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  deleteProjectHeaderBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#FEF2F2',
  },
  projectLevelScrollRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  projectLevelPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  projectLevelPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  projectCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  projectCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  projectColorBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  projectColorBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  projectCardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  subTasksListBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
    gap: 8,
    marginTop: 6,
  },
  subTaskRow: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  subTaskDisplayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  subTaskBulletText: {
    fontSize: 12.5,
    color: '#334155',
    flex: 1,
    lineHeight: 18,
  },
  subTaskActionsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  editSubTaskPillBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  editSubTaskPillBtnText: {
    fontSize: 11,
    color: '#2563EB',
    fontWeight: '600',
  },
  deleteSubTaskPillBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  deleteSubTaskPillBtnText: {
    fontSize: 11,
    color: '#DC2626',
    fontWeight: '600',
  },
  editSubTaskInlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  saveBulletInlineBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveBulletInlineBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  cancelBulletInlineBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
  cancelBulletInlineBtnText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
  },
  emptySubTasksNotice: {
    fontSize: 12,
    color: '#94A3B8',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 8,
  },
  addSubTaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  addSubTaskBtn: {
    backgroundColor: '#1E40AF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addSubTaskBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  saveProjectsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 20,
    shadowColor: '#059669',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  saveProjectsBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  emptyProjectContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 14,
    marginBottom: 20,
  },
  emptyProjectTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginTop: 12,
    textAlign: 'center',
  },
  emptyProjectSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
    lineHeight: 18,
  },
  createFirstProjectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
  },
  createFirstProjectBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  // Assigned Tasks Section Styles (Tab 1 Roadmap)
  assignedTasksSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  assignedTasksHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  assignedTasksIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  assignedTasksHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  assignedTasksHeaderSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  assignedTasksViewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 2,
  },
  assignedTasksViewAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F766E',
  },
  emptyAssignedTasksBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 12,
  },
  emptyAssignedTasksTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginTop: 8,
  },
  emptyAssignedTasksSub: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  assignedTasksList: {
    marginTop: 10,
    gap: 8,
  },
  assignedTaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  assignedTaskRowSubmitted: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  assignedTaskIndexCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  assignedTaskIndexText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  assignedTaskTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  assignedTaskTitleDone: {
    color: '#059669',
    textDecorationLine: 'line-through',
  },
  assignedTaskSubText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  tagApproved: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagApprovedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  tagPending: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagPendingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
  tagSubmitAction: {
    backgroundColor: '#0F766E',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagSubmitActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
