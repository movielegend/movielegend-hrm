import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Modal,
  Pressable,
  TextInput,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from '../../providers/AuthProvider';
import { useSocketStatus } from '../../providers/SocketProvider';
import {
  useLevelProjects,
  BulletSubTask,
  LevelDepartmentProject,
} from './levelProjectsStore';
import { useLevelGmv } from './levelGmvStore';

export interface LevelPerkItem {
  id: string;
  title: string;
  subtitle: string;
}

export interface LevelTierConfig {
  levelNumber: number;
  levelName: string;
  titleName: string;
  nextTierTitle: string;
  isCurrent: boolean;
  isUnlocked: boolean;
  // Progress to next level
  overallProgressPercent: number;
  progressSummaryText: string;
  // Metric 1: GMV / Sales
  currentGmv: number;
  promotionCeilingGmv: number;
  retentionFloorGmv: number;
  gmvUnit: string;
  gmvPercent: number;
  // Metric 2: SLA & Discipline
  shiftCompletedText: string;
  slaPercentText: string;
  isSlaAchieved: boolean;
  disciplineScoreText: string;
  isDisciplineAchieved: boolean;
  // Metric 3: Project & Mentorship
  projectTitle: string;
  projectSub: string;
  projectProgressText: string;
  isProjectCompleted: boolean;
  // Perks & Rewards
  perks: LevelPerkItem[];
  // Review Cycle
  reviewDateText: string;
}

// Helper to style each perk category with luxury theme
export const getPerkTheme = (title: string) => {
  const upper = title.toUpperCase();
  if (
    upper.includes('MACBOOK') ||
    upper.includes('IPAD') ||
    upper.includes('TAI NGHE') ||
    upper.includes('XE Ô TÔ') ||
    upper.includes('VÀNG') ||
    upper.includes('HIỆN VẬT') ||
    upper.includes('KỶ NIỆM') ||
    upper.includes('CHỨNG NHẬN')
  ) {
    return {
      icon: 'gift' as const,
      iconBg: '#FEF3C7',
      iconColor: '#D97706',
      badgeText: 'QUÀ HIỆN VẬT',
      badgeBg: '#FFFBEB',
      badgeColor: '#B45309',
    };
  }
  if (
    upper.includes('THƯỞNG NÓNG') ||
    upper.includes('PHỤ CẤP') ||
    upper.includes('TIỀN') ||
    upper.includes('VOUCHER')
  ) {
    return {
      icon: 'cash' as const,
      iconBg: '#DCFCE7',
      iconColor: '#16A34A',
      badgeText: 'THƯỞNG TIỀN MẶT',
      badgeBg: '#F0FDF4',
      badgeColor: '#15803D',
    };
  }
  if (upper.includes('VÍ TẾT') || upper.includes('HỆ SỐ')) {
    return {
      icon: 'sparkles' as const,
      iconBg: '#F3E8FF',
      iconColor: '#9333EA',
      badgeText: 'THƯỞNG TẾT',
      badgeBg: '#FAF5FF',
      badgeColor: '#7E22CE',
    };
  }
  return {
    icon: 'shield-checkmark' as const,
    iconBg: '#E0F2FE',
    iconColor: '#0284C7',
    badgeText: 'ĐẶC QUYỀN VIP',
    badgeBg: '#F0F9FF',
    badgeColor: '#0369A1',
  };
};

// Helper to calculate dynamic month-end review date
const getNextReviewDateString = (monthOffset = 0) => {
  const now = new Date();
  const targetDate = new Date(now.getFullYear(), now.getMonth() + 1 + monthOffset, 0);
  const diffDays = Math.max(0, Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  const formattedDate = `${String(targetDate.getDate()).padStart(2, '0')}.${String(targetDate.getMonth() + 1).padStart(2, '0')}.${targetDate.getFullYear()}`;
  if (monthOffset === 0) {
    return `Kỳ xét duyệt: ${formattedDate} (Còn ${diffDays} ngày)`;
  }
  return `Kỳ kế tiếp: ${formattedDate}`;
};

export const TikTokStyleLevelingScreen: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();

  // Load level stored or approved from SecureStore
  const [approvedLevelNumber, setApprovedLevelNumber] = useState<number | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    void (async () => {
      try {
        const val = await SecureStore.getItemAsync(`USER_APPROVED_LEVEL_${user.id}`);
        if (val) {
          const num = parseInt(val, 10);
          if (!isNaN(num)) {
            setApprovedLevelNumber(num);
          }
        }
      } catch {}
    })();
  }, [user?.id]);

  // Dynamic Level Calculation
  const isLeader = Boolean(user?.roles?.includes('LEADER'));
  const userDisplayName = user?.fullName || user?.name || (isLeader ? 'Trưởng Nhóm' : 'Nhân Viên');
  const currentUserLevelNumber = approvedLevelNumber || (user as any)?.levelNumber || (user as any)?.currentLevel || 1;

  // Hook into Level Projects & GMV store with logged-in user department
  const userDeptId = user?.department?.id;
  const userDeptName = user?.department?.name;

  const {
    getProjectByLevel,
    getAssignedSubTasksForUser,
    submitSubTask,
    setProjects,
    fetchProjects,
  } = useLevelProjects(userDeptId, userDeptName);
  const { getGmvByLevel, updateGmv } = useLevelGmv();

  const { getSocket } = useSocketStatus();

  // Real-time synchronization when Admin approves promotion or updates config
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    if (userDeptId) {
      socket.emit('level:join_config_room', { departmentId: userDeptId });
    }

    const handleConfigUpdated = (payload: any) => {
      if (
        payload &&
        (!payload.departmentId ||
          payload.departmentId === userDeptId ||
          payload.departmentName === userDeptName)
      ) {
        if (payload.projects && Array.isArray(payload.projects)) {
          setProjects(payload.projects);
        } else {
          void fetchProjects();
        }
      }
    };

    const handleUserPromoted = (payload: any) => {
      if (payload && (payload.userId === user?.id || !payload.userId)) {
        if (payload.targetLevelNumber) {
          setApprovedLevelNumber(payload.targetLevelNumber);
          setSelectedLevel(payload.targetLevelNumber);
          Alert.alert(
            'CHÚC MỪNG BẠN ĐÃ ĐƯỢC THĂNG CẤP!',
            `Admin đã chốt phê duyệt thăng cấp cho bạn lên ${payload.targetLevelName || `Level ${payload.targetLevelNumber}`}!`
          );
        }
      }
    };

    const handleDataReset = () => {
      setApprovedLevelNumber(null);
      setSelectedLevel(1);
    };

    socket.on('level:config:updated', handleConfigUpdated);
    socket.on('level:user_promoted', handleUserPromoted);
    socket.on('level:data_reset', handleDataReset);
    return () => {
      socket.off('level:config:updated', handleConfigUpdated);
      socket.off('level:user_promoted', handleUserPromoted);
      socket.off('level:data_reset', handleDataReset);
    };
  }, [getSocket, userDeptId, userDeptName, setProjects, fetchProjects, user?.id]);

  const [selectedLevel, setSelectedLevel] = useState<number>(currentUserLevelNumber);
  // Base definition templates for Staff (1 -> 12)
  const staffLevelDefs = Array.from({ length: 12 }, (_, i) => {
    const lvl = i + 1;
    return {
      levelNumber: lvl,
      levelName: `Level ${lvl}`,
      titleName: `Cấp Bậc Level ${lvl}`,
      nextTierTitle: lvl < 12 ? `Level ${lvl + 1}` : 'Cấp Tối Đa',
      shiftCompletedText: 'Chỉ tiêu: Theo phân công phòng ban',
      slaPercentText: 'Yêu cầu SLA ca trực ≥ 90%',
      disciplineScoreText: 'Chuyên cần yêu cầu ≥ 85đ',
      projectTitle: `Dự Án Level ${lvl}`,
      projectSub: 'Chưa giao việc con nào',
      perks: [] as LevelPerkItem[],
    };
  });

  // Base definition templates for Leader (1 -> 12)
  const leaderLevelDefs = Array.from({ length: 12 }, (_, i) => {
    const lvl = i + 1;
    return {
      levelNumber: lvl,
      levelName: `Level ${lvl}`,
      titleName: `Quản Trị Level ${lvl}`,
      nextTierTitle: lvl < 12 ? `Level ${lvl + 1}` : 'Cấp Tối Đa',
      shiftCompletedText: 'Chỉ tiêu: Điều phối ca trực',
      slaPercentText: 'Yêu cầu SLA ca trực ≥ 90%',
      disciplineScoreText: 'Chuyên cần yêu cầu ≥ 85đ',
      projectTitle: `Dự Án Level ${lvl}`,
      projectSub: 'Chưa giao việc con nào',
      perks: [] as LevelPerkItem[],
    };
  });

  // Dynamic mapper to inject real GMV & dynamic review dates
  const buildLevelTierList = (defs: Array<{
    levelNumber: number;
    levelName: string;
    titleName: string;
    nextTierTitle: string;
    shiftCompletedText: string;
    slaPercentText: string;
    disciplineScoreText: string;
    projectTitle: string;
    projectSub: string;
    perks: LevelPerkItem[];
  }>): LevelTierConfig[] => {
    return defs.map((def) => {
      const gmvItem = getGmvByLevel(def.levelNumber);
      const curGmv = gmvItem?.currentGmv || 0;
      const ceilGmv = gmvItem?.promotionCeilingGmv || 50;
      const flrGmv = gmvItem?.retentionFloorGmv || 0;
      const unit = gmvItem?.gmvUnit || 'Tr VNĐ';
      const gPercent = ceilGmv > 0 ? Math.min(100, Math.round((curGmv / ceilGmv) * 100)) : 0;
      const isCur = def.levelNumber === currentUserLevelNumber;
      const isUnl = def.levelNumber <= currentUserLevelNumber;
      const isPast = def.levelNumber < currentUserLevelNumber;

      const project = getProjectByLevel(def.levelNumber);
      const totalTasks = project?.subTasks?.length || 0;
      const doneTasks = project?.subTasks?.filter((t) => t.status === 'LEADER_APPROVED').length || 0;
      const isProjCompleted = isPast || (totalTasks > 0 && doneTasks === totalTasks);

      let overallProgressPercent = 0;
      let progressSummaryText = '';
      let reviewDateText = '';

      if (isPast) {
        overallProgressPercent = 100;
        progressSummaryText = `Đã hoàn thành xuất sắc cấp độ ${def.levelName}.`;
        reviewDateText = 'Đã xét duyệt';
      } else if (isCur) {
        overallProgressPercent = totalTasks > 0 ? Math.round(gPercent * 0.7 + (doneTasks / totalTasks) * 30) : gPercent;
        progressSummaryText =
          curGmv >= ceilGmv
            ? 'Đã hoàn thành mục tiêu GMV.'
            : `Đã đạt ${curGmv}/${ceilGmv} ${unit}. Còn thiếu ${Math.max(0, ceilGmv - curGmv)} ${unit} để đủ điều kiện xét duyệt.`;
        reviewDateText = getNextReviewDateString(0);
      } else {
        overallProgressPercent = 0;
        progressSummaryText = `Mục tiêu thăng cấp: Đạt ${ceilGmv} ${unit}`;
        reviewDateText = getNextReviewDateString(def.levelNumber - currentUserLevelNumber);
      }


      return {
        ...def,
        projectTitle: project?.projectName || def.projectTitle,
        projectSub:
          project?.subTasks && project.subTasks.length > 0
            ? `Dự án gồm ${project.subTasks.length} việc con (${project.departmentName || userDeptName || 'Phòng ban'})`
            : def.projectSub,
        isCurrent: isCur,
        isUnlocked: isUnl,
        overallProgressPercent,
        progressSummaryText,
        currentGmv: curGmv,
        promotionCeilingGmv: ceilGmv,
        retentionFloorGmv: flrGmv,
        gmvUnit: unit,
        gmvPercent: gPercent,
        isSlaAchieved: isUnl,
        isDisciplineAchieved: isUnl,
        projectProgressText: isPast
          ? 'Đã hoàn thành 100%'
          : isCur
          ? `Tiến độ: ${doneTasks}/${totalTasks} việc con`
          : 'Chưa mở khóa',
        isProjectCompleted: isProjCompleted,
        reviewDateText,
      };
    });
  };

  const staffLevels = buildLevelTierList(staffLevelDefs);
  const leaderLevels = buildLevelTierList(leaderLevelDefs);

  // Lộ trình chỉ thuộc về người dùng đang đăng nhập
  const myLevelList = isLeader ? leaderLevels : staffLevels;

  // Tasks assigned to current user (Leader/Employee) across projects
  const assignedItems = getAssignedSubTasksForUser(user?.id, user?.fullName);

  // GMV editing state for Leader
  const [editGmvModalVisible, setEditGmvModalVisible] = useState(false);
  const [inputCurrentGmv, setInputCurrentGmv] = useState('');
  const [inputCeilingGmv, setInputCeilingGmv] = useState('');
  const [inputFloorGmv, setInputFloorGmv] = useState('');

  // Selected subtask modal for reporting
  const [activeReportTask, setActiveReportTask] = useState<{
    project: LevelDepartmentProject;
    subTask: BulletSubTask;
  } | null>(null);

  const [reportNote, setReportNote] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [evidenceImages, setEvidenceImages] = useState<string[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const handleOpenReportModal = (item: { project: LevelDepartmentProject; subTask: BulletSubTask }) => {
    setActiveReportTask(item);
    setReportNote(item.subTask.submissionNote || '');
    setEvidenceUrl(item.subTask.evidenceUrl || '');
    setEvidenceImages(item.subTask.evidenceImages || []);
  };

  const handlePickImages = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets) {
        const newUris = result.assets.map((a) => a.uri);
        setEvidenceImages((prev) => [...prev, ...newUris]);
      }
    } catch {
      Alert.alert('Thông báo', 'Không thể mở thư viện ảnh');
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setEvidenceImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmitReport = () => {
    if (!activeReportTask) return;
    if (!reportNote.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tóm tắt báo cáo kết quả thực hiện.');
      return;
    }

    submitSubTask(
      activeReportTask.project.levelNumber,
      activeReportTask.subTask.id,
      reportNote.trim(),
      evidenceUrl.trim() || undefined,
      evidenceImages
    );

    setActiveReportTask(null);
    Alert.alert('Thành Công', 'Đã nộp báo cáo kết quả và minh chứng.');
  };

  // Modals
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [allLevelsModalVisible, setAllLevelsModalVisible] = useState(false);

  const selectedTier: LevelTierConfig = myLevelList.find((l) => l.levelNumber === selectedLevel) ?? myLevelList[0]!;
  const currentActiveTier: LevelTierConfig = myLevelList.find((l) => l.isCurrent) ?? myLevelList[0]!;

  const currentProjectForTier = getProjectByLevel(selectedTier.levelNumber);
  const myTasksForThisLevel = assignedItems.filter((item) => item.project.levelNumber === selectedTier.levelNumber);

  // Dynamic GMV values from real-time store
  const tierGmv = getGmvByLevel(selectedTier.levelNumber);
  const currentGmv = tierGmv.currentGmv;
  const ceilingGmv = tierGmv.promotionCeilingGmv;
  const floorGmv = tierGmv.retentionFloorGmv;
  const gmvUnit = tierGmv.gmvUnit || 'Tr VNĐ';
  const gmvPercent = ceilingGmv > 0 ? Math.min(100, Math.round((currentGmv / ceilingGmv) * 100)) : 0;

  const handleOpenEditGmvModal = () => {
    setInputCurrentGmv(String(currentGmv));
    setInputCeilingGmv(String(ceilingGmv));
    setInputFloorGmv(String(floorGmv));
    setEditGmvModalVisible(true);
  };

  const handleSaveGmv = () => {
    const cur = parseFloat(inputCurrentGmv) || 0;
    const ceil = parseFloat(inputCeilingGmv) || 0;
    const flr = parseFloat(inputFloorGmv) || 0;

    if (ceil <= 0) {
      Alert.alert('Lỗi', 'Mục tiêu nâng cấp (GMV) phải lớn hơn 0.');
      return;
    }

    updateGmv(selectedTier.levelNumber, cur, ceil, flr, userDisplayName);
    setEditGmvModalVisible(false);
    Alert.alert('Thành Công', `Đã cập nhật doanh số ${selectedTier.levelName} thành công và đồng bộ realtime!`);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
        {/* ===================================================================== */}
        {/* 1. VIP MEMBERSHIP CARD                                                */}
        {/* ===================================================================== */}
        <View style={styles.cardSection}>
          <View style={styles.vipCardContainer}>
            {/* Top row: Back button, Level Name, User Name, and Perks Link */}
            <View style={styles.vipCardTop}>
              <View style={styles.vipCardHeaderLeft}>
                <View style={styles.rankTitleRow}>
                  <TouchableOpacity
                    style={styles.cardBackBtn}
                    onPress={() => router.back()}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                  <Text style={styles.vipRankTitle}>{currentActiveTier.levelName}</Text>
                </View>
                <Text style={styles.vipUserName}>{userDisplayName}</Text>
              </View>

              <TouchableOpacity
                style={styles.tierBenefitsBtn}
                onPress={() => setAllLevelsModalVisible(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.tierBenefitsBtnText}>Ưu đãi mỗi Level</Text>
                <Ionicons name="chevron-forward" size={13} color="#E2E8F0" />
              </TouchableOpacity>
            </View>

            {/* Inner Floating White Card */}
            <View style={styles.whiteFloatingCard}>
              <Text style={styles.upgradeHeaderNotice}>
                Mục tiêu thăng cấp lên {currentActiveTier.nextTierTitle}
              </Text>

              {/* Tên Dự Án Ở Giữa Card */}
              <View style={styles.cardProjectBanner}>
                <Text style={styles.cardProjectTagText}>DỰ ÁN {currentActiveTier.levelName.toUpperCase()}</Text>
                <Text style={styles.cardProjectMainTitle}>
                  {currentActiveTier.projectTitle}
                </Text>
                <Text style={styles.cardProjectSubText}>
                  • {currentActiveTier.projectSub}
                </Text>
              </View>

              {/* Card Footer: Date & Details link */}
              <View style={styles.cardFooterRow}>
                <Text style={styles.cardFooterDate}>
                  Kỳ xét duyệt: 30.09.2026 (Còn 28 ngày)
                </Text>
                <TouchableOpacity
                  style={styles.cardFooterDetailLink}
                  onPress={() => setInfoModalVisible(true)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cardFooterDetailText}>Chi Tiết</Text>
                  <Ionicons name="chevron-forward" size={13} color="#64748B" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* ===================================================================== */}
        {/* 2. LEVEL MILESTONES (Thanh nấc thang chọn xem các cấp trong lộ trình)  */}
        {/* ===================================================================== */}
        <View style={styles.stepperSection}>
          <Text style={styles.sectionHeaderTitle}>Lộ Trình Cấp Bậc</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.stepperScroll}>
            {myLevelList.map((tier) => {
              const isSelected = selectedLevel === tier.levelNumber;
              const isCurrent = tier.isCurrent;

              return (
                <TouchableOpacity
                  key={tier.levelNumber}
                  style={[
                    styles.stepChip,
                    isSelected && styles.stepChipSelected,
                    isCurrent && !isSelected && styles.stepChipCurrent,
                  ]}
                  onPress={() => setSelectedLevel(tier.levelNumber)}
                  activeOpacity={0.7}
                >
                  <View style={styles.stepChipTop}>
                    <Text
                      style={[
                        styles.stepChipLevelText,
                        isSelected && styles.stepChipTextSelected,
                        isCurrent && !isSelected && styles.stepChipTextCurrent,
                      ]}
                    >
                      {tier.levelName}
                    </Text>
                    {isCurrent && (
                      <View style={styles.currentDot} />
                    )}
                  </View>

                  <Text
                    style={[
                      styles.stepChipSubText,
                      isSelected && styles.stepChipSubSelected,
                    ]}
                    numberOfLines={1}
                  >
                    {isCurrent ? 'Hiện tại' : 'Mục tiêu'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ===================================================================== */}
        {/* 3. ĐẶC QUYỀN & QUÀ THƯỞNG Ở CẤP ĐỘ NÀY                                 */}
        {/* ===================================================================== */}
        <View style={styles.perksSection}>
          <View style={styles.perksHeaderRow}>
            <View style={{ flex: 1 }}>
              <View style={styles.perksHeaderTitleRow}>
                <Ionicons name="gift-outline" size={17} color="#D97706" />
                <Text style={styles.sectionHeaderTitle}>
                  Đặc Quyền & Quà Thưởng • {selectedTier.levelName}
                </Text>
              </View>
              <Text style={styles.sectionSubHeaderTitle}>
                Đãi ngộ danh dự & quà tặng thăng cấp
              </Text>
            </View>

            <View style={styles.perkCountBadge}>
              <Text style={styles.perkCountBadgeText}>{selectedTier.perks.length} Đãi ngộ</Text>
            </View>
          </View>

          {/* Luxury Modern Perks Grid (2 Columns) */}
          <View style={styles.perksGridTwoCol}>
            {selectedTier.perks.map((perk, index) => {
              const theme = getPerkTheme(perk.title);
              return (
                <View key={perk.id} style={styles.perkModernCard}>
                  {/* Card Top: Category Tag + Icon */}
                  <View style={styles.perkModernCardTop}>
                    <View style={[styles.perkIconRoundBox, { backgroundColor: theme.iconBg }]}>
                      <Ionicons name={theme.icon} size={16} color={theme.iconColor} />
                    </View>
                    <View style={[styles.perkCategoryBadge, { backgroundColor: theme.badgeBg }]}>
                      <Text style={[styles.perkCategoryBadgeText, { color: theme.badgeColor }]}>
                        {theme.badgeText}
                      </Text>
                    </View>
                  </View>

                  {/* Card Main: Bold Title & Subtitle */}
                  <Text style={styles.perkModernTitle} numberOfLines={2}>
                    {perk.title}
                  </Text>
                  <Text style={styles.perkModernSubtitle} numberOfLines={2}>
                    {perk.subtitle}
                  </Text>

                  {/* Card Bottom: Order Index & Unlocked Icon */}
                  <View style={styles.perkModernFooter}>
                    <View style={styles.perkNumberPill}>
                      <Text style={styles.perkNumberPillText}>Đặc quyền #{index + 1}</Text>
                    </View>
                    {selectedTier.isUnlocked ? (
                      <View style={styles.perkUnlockedBadge}>
                        <Ionicons name="checkmark-circle" size={14} color="#16A34A" />
                      </View>
                    ) : (
                      <View style={styles.perkLockedBadge}>
                        <Ionicons name="lock-closed" size={12} color="#94A3B8" />
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* ===================================================================== */}
        {/* 4. TIÊU CHUẨN XÉT DUYỆT (ĐIỀU KIỆN CẦN & ĐỦ CỦA CẤP ĐANG CHỌN)        */}
        {/* ===================================================================== */}
        <View style={styles.criteriaSection}>
          <View style={styles.criteriaHeaderRow}>
            <Text style={styles.sectionHeaderTitle}>
              Điều Kiện Xét Duyệt • {selectedTier.levelName}
            </Text>
            {selectedTier.isCurrent ? (
              <View style={styles.statusBadgeActive}>
                <Text style={styles.statusBadgeActiveText}>Cấp hiện tại</Text>
              </View>
            ) : selectedTier.isUnlocked ? (
              <View style={styles.statusBadgePassed}>
                <Text style={styles.statusBadgePassedText}>Đã đạt</Text>
              </View>
            ) : (
              <View style={styles.statusBadgeLocked}>
                <Text style={styles.statusBadgeLockedText}>Mục tiêu tiếp theo</Text>
              </View>
            )}
          </View>

          {/* 1. Doanh số (GMV) */}
          <View style={styles.criteriaCard}>
            <View style={styles.criteriaCardTop}>
              <View style={styles.criteriaInfoCol}>
                <View style={styles.gmvCardTitleRow}>
                  <Text style={styles.criteriaMainTitle}>
                    {isLeader ? '1. Doanh số toàn team (GMV)' : '1. Doanh số cá nhân (GMV)'}
                  </Text>
                  {isLeader && (
                    <TouchableOpacity
                      style={styles.editGmvButtonBadge}
                      onPress={handleOpenEditGmvModal}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="create-outline" size={13} color="#0F766E" />
                      <Text style={styles.editGmvButtonText}>Chỉnh sửa số liệu</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <Text style={styles.criteriaTargetText}>
                  Mục tiêu nâng cấp: {ceilingGmv} {gmvUnit}
                </Text>
              </View>
              <View style={styles.criteriaPercentBox}>
                <Text style={styles.criteriaPercentText}>{gmvPercent}%</Text>
              </View>
            </View>

            {/* Thanh tiến độ GMV */}
            <View style={styles.criteriaBarTrack}>
              <View style={[styles.criteriaBarFill, { width: `${gmvPercent}%` }]} />
            </View>

            {/* Số liệu thực tế vs Chỉ tiêu */}
            <View style={styles.criteriaScoreRow}>
              <Text style={styles.criteriaCurrentScore}>
                Đã đạt: <Text style={{ fontWeight: '700', color: '#0F172A' }}>{currentGmv} {gmvUnit}</Text>
              </Text>
              <Text style={styles.criteriaTargetScore}>
                Chỉ tiêu: <Text style={{ fontWeight: '700', color: '#2563EB' }}>{ceilingGmv} {gmvUnit}</Text>
              </Text>
            </View>

            {/* Ngưỡng duy trì giữ cấp (Floor) */}
            {floorGmv > 0 && (
              <View style={styles.retentionFloorBox}>
                <Text style={styles.retentionFloorText}>
                  • Ngưỡng duy trì giữ cấp (Floor): {floorGmv} {gmvUnit} (Đạt để không bị rớt cấp)
                </Text>
              </View>
            )}
          </View>

          {/* 2. Dự án Cấp Bậc & Việc Con Được Giao */}
          <View style={styles.criteriaCard}>
            <View style={styles.criteriaCardTop}>
              <View style={styles.criteriaInfoCol}>
                <Text style={styles.criteriaMainTitle}>2. Dự Án & Việc Con Cấp Bậc</Text>
                <Text style={styles.criteriaTargetText}>
                  {currentProjectForTier?.projectName || selectedTier.projectTitle}
                </Text>
              </View>
              {currentProjectForTier && (
                <View style={styles.projectLevelTagBadge}>
                  <Text style={styles.projectLevelTagBadgeText}>{currentProjectForTier.levelName}</Text>
                </View>
              )}
            </View>

            <Text style={styles.projectDescText}>
              • {currentProjectForTier?.rewardItem ? `Phần thưởng thăng cấp: ${currentProjectForTier.rewardItem}` : selectedTier.projectSub}
            </Text>

            {/* DANH SÁCH VIỆC CON GIAO CHO CÁ NHÂN TẠI LEVEL NÀY */}
            <View style={styles.assignedTasksBlock}>
              <View style={styles.assignedTasksHeaderRow}>
                <Text style={styles.assignedTasksHeaderTitle}>
                  Việc con được giao cho bạn ({myTasksForThisLevel.length}):
                </Text>
                {isLeader && (
                  <TouchableOpacity
                    style={styles.openProjectManageLink}
                    onPress={() => router.push('/leader/level-projects' as any)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.openProjectManageLinkText}>Quản lý & Giao việc</Text>
                    <Ionicons name="chevron-forward" size={12} color="#0F766E" />
                  </TouchableOpacity>
                )}
              </View>

              {myTasksForThisLevel.length > 0 ? (
                <View style={styles.assignedTasksList}>
                  {myTasksForThisLevel.map(({ project, subTask }) => {
                    const isApproved = subTask.status === 'LEADER_APPROVED';
                    const isSubmitted = subTask.status === 'SUBMITTED';

                    return (
                      <View key={subTask.id} style={styles.assignedTaskCard}>
                        <View style={styles.assignedTaskCardTop}>
                          <View style={styles.assignedTaskOrderBox}>
                            <Text style={styles.assignedTaskOrderText}>#{subTask.orderNumber}</Text>
                          </View>
                          <View style={{ flex: 1, paddingRight: 8 }}>
                            <Text style={styles.assignedTaskTitle}>{subTask.title}</Text>
                            {subTask.targetKpi ? (
                              <Text style={styles.assignedTaskKpi}>Chỉ tiêu: {subTask.targetKpi}</Text>
                            ) : null}
                          </View>
                          <View>
                            {isApproved ? (
                              <View style={styles.statusBadgeApproved}>
                                <Text style={styles.statusBadgeApprovedText}>Đã duyệt V1</Text>
                              </View>
                            ) : isSubmitted ? (
                              <View style={styles.statusBadgeSubmitted}>
                                <Text style={styles.statusBadgeSubmittedText}>Chờ duyệt</Text>
                              </View>
                            ) : (
                              <View style={styles.statusBadgePending}>
                                <Text style={styles.statusBadgePendingText}>Đang làm</Text>
                              </View>
                            )}
                          </View>
                        </View>

                        {/* Hiển thị tóm tắt báo cáo & minh chứng nếu đã nộp */}
                        {(isSubmitted || isApproved) && subTask.submissionNote ? (
                          <View style={styles.submittedPreviewBox}>
                            <Text style={styles.submittedPreviewLabel}>Báo cáo đã nộp:</Text>
                            <Text style={styles.submittedPreviewNote} numberOfLines={2}>
                              {subTask.submissionNote}
                            </Text>
                            {Boolean(subTask.evidenceUrl) && (
                              <Text style={styles.submittedPreviewLink} numberOfLines={1}>
                                Link: {subTask.evidenceUrl}
                              </Text>
                            )}
                            {(subTask.evidenceImages?.length ?? 0) > 0 && (
                              <Text style={styles.submittedPreviewImagesCount}>
                                [Đã đính kèm {subTask.evidenceImages?.length} ảnh minh chứng]
                              </Text>
                            )}
                          </View>
                        ) : null}

                        {/* Nút Báo Cáo / Cập Nhật Minh Chứng */}
                        {!isApproved && (
                          <TouchableOpacity
                            style={[
                              styles.reportActionBtn,
                              isSubmitted && styles.reportActionBtnSecondary,
                            ]}
                            onPress={() => handleOpenReportModal({ project, subTask })}
                            activeOpacity={0.8}
                          >
                            <Text
                              style={[
                                styles.reportActionBtnText,
                                isSubmitted && styles.reportActionBtnTextSecondary,
                              ]}
                            >
                              {isSubmitted ? 'SỬA BÁO CÁO & MINH CHỨNG' : 'VIẾT BÁO CÁO & NỘP MINH CHỨNG'}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  })}
                </View>
              ) : (
                <View style={styles.emptyAssignedBox}>
                  <Text style={styles.emptyAssignedTitle}>
                    Chưa có việc con nào ở {selectedTier.levelName} được giao cho bạn
                  </Text>
                  <Text style={styles.emptyAssignedDesc}>
                    {isLeader
                      ? 'Bạn có thể tự nhận việc con trong màn hình quản lý dự án để trực tiếp thực hiện và nộp kết quả nghiệm thu.'
                      : 'Khi Leader phân công việc con cho bạn ở cấp độ này, bạn sẽ nhận được thông báo và có thể nộp báo cáo tại đây.'}
                  </Text>
                  {isLeader && (
                    <TouchableOpacity
                      style={styles.goToAssignBtn}
                      onPress={() => router.push('/leader/level-projects' as any)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.goToAssignBtnText}>VÀO TỰ NHẬN / PHÂN CÔNG VIỆC CON</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ===================================================================== */}
      {/* MODAL 1: Bảng So Sánh Quyền Lợi & Tiêu Chuẩn Toàn Bộ Các Level         */}
      {/* ===================================================================== */}
      <Modal visible={allLevelsModalVisible} transparent animationType="slide" onRequestClose={() => setAllLevelsModalVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setAllLevelsModalVisible(false)}>
          <Pressable style={styles.fullModalCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalHeaderTitle}>Lộ Trình Toàn Bộ Các Level</Text>
                <Text style={styles.modalHeaderSubtitle}>
                  So sánh tiêu chuẩn, dự án & quyền lợi từng cấp độ
                </Text>
              </View>
              <TouchableOpacity onPress={() => setAllLevelsModalVisible(false)} style={{ padding: 4 }}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              {myLevelList.map((tier) => {
                const tierGmvConf = getGmvByLevel(tier.levelNumber);
                return (
                  <View key={tier.levelNumber} style={styles.roadmapItemCard}>
                    <View style={styles.roadmapItemHeader}>
                      <View style={styles.roadmapBadge}>
                        <Text style={styles.roadmapBadgeText}>{tier.levelName}</Text>
                      </View>
                      <Text style={styles.roadmapTitleText}>{tier.projectTitle}</Text>
                    </View>

                    <View style={styles.roadmapConditionRow}>
                      <Text style={styles.roadmapConditionLabel}>Chỉ tiêu GMV:</Text>
                      <Text style={styles.roadmapConditionValue}>
                        {tierGmvConf.promotionCeilingGmv} {tierGmvConf.gmvUnit}
                      </Text>
                    </View>

                    <View style={styles.roadmapPerkSummary}>
                      {tier.perks.map((p) => (
                        <View key={p.id} style={styles.roadmapPerkItem}>
                          <Text style={styles.roadmapPerkBullet}>•</Text>
                          <Text style={styles.roadmapPerkText}>{p.title}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                );
              })}
            </ScrollView>

            <TouchableOpacity style={styles.modalConfirmBtn} onPress={() => setAllLevelsModalVisible(false)}>
              <Text style={styles.modalConfirmBtnText}>Đóng Bảng Tra Cứu</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ===================================================================== */}
      {/* MODAL 2: Quy Trình Xét Duyệt Cấp Bậc Cuối Tháng                      */}
      {/* ===================================================================== */}
      <Modal visible={infoModalVisible} transparent animationType="fade" onRequestClose={() => setInfoModalVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setInfoModalVisible(false)}>
          <Pressable style={styles.infoModalCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalHeaderTitle}>Quy Trình Xét Nâng Cấp</Text>
                <Text style={styles.modalHeaderSubtitle}>Hệ thống xét duyệt minh bạch & định kỳ</Text>
              </View>
              <TouchableOpacity onPress={() => setInfoModalVisible(false)} style={{ padding: 4 }}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.infoDescriptionText}>
              Tại MovieLegend, <Text style={styles.boldText}>Cấp bậc (Level)</Text> là hệ thống đãi ngộ và công nhận năng lực cống hiến thực tế (không phải chức vụ quản lý).
            </Text>

            <View style={styles.infoStepBox}>
              <Text style={styles.infoStepTitle}>Vòng 1 • Đánh giá cuối tháng (Leader rà soát)</Text>
              <Text style={styles.infoStepDesc}>
                Kiểm tra đối soát số liệu Doanh số thực tế, tỷ lệ SLA ca trực và kết quả hoàn thành dự án/việc con trong kỳ.
              </Text>
            </View>

            <View style={styles.infoStepBox}>
              <Text style={styles.infoStepTitle}>Vòng 2 • Phê duyệt chốt thăng cấp (Admin duyệt)</Text>
              <Text style={styles.infoStepDesc}>
                Ban Điều Hành kích hoạt thăng cấp chính thức, trao thưởng quà tặng hiện vật và áp dụng Hệ số thưởng Tết mới.
              </Text>
            </View>

            <TouchableOpacity style={styles.modalConfirmBtn} onPress={() => setInfoModalVisible(false)}>
              <Text style={styles.modalConfirmBtnText}>Tôi Đã Hiểu</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ===================================================================== */}
      {/* MODAL 3: BÁO CÁO & ĐÍNH KÈM MINH CHỨNG VIỆC CON DỰ ÁN CẤP BẬC        */}
      {/* ===================================================================== */}
      <Modal visible={activeReportTask !== null} animationType="slide" transparent={false} onRequestClose={() => setActiveReportTask(null)}>
        <View style={styles.reportModalContainer}>
          <SafeAreaView style={styles.reportTopSafeArea}>
            <StatusBar barStyle="light-content" backgroundColor="#0F766E" />
            <View style={styles.reportModalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.reportModalLevelTag}>
                  Việc con #{activeReportTask?.subTask.orderNumber} • {activeReportTask?.project.levelName}
                </Text>
                <Text style={styles.reportModalTitle}>{activeReportTask?.subTask.title}</Text>
              </View>
              <TouchableOpacity onPress={() => setActiveReportTask(null)} style={styles.reportModalCloseBtn}>
                <Text style={styles.reportModalCloseBtnText}>Đóng</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>

          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <ScrollView
              style={styles.reportModalBody}
              contentContainerStyle={{ paddingBottom: 150 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              automaticallyAdjustKeyboardInsets={true}
              keyboardDismissMode="interactive"
            >
              {/* KPI Requirements Banner */}
              {activeReportTask?.subTask.targetKpi ? (
                <View style={styles.reportKpiCard}>
                  <Text style={styles.reportKpiLabel}>Chỉ tiêu KPI yêu cầu:</Text>
                  <Text style={styles.reportKpiValue}>{activeReportTask.subTask.targetKpi}</Text>
                  {activeReportTask.subTask.description ? (
                    <Text style={styles.reportKpiDesc}>{activeReportTask.subTask.description}</Text>
                  ) : null}
                </View>
              ) : null}

              {/* PHẦN 1: BÁO CÁO KẾT QUẢ THỰC HIỆN */}
              <View style={styles.reportSectionBlock}>
                <Text style={styles.reportSectionTitle}>1. Báo Cáo Kết Quả Thực Hiện</Text>
                <Text style={styles.reportSectionSub}>
                  Nhập tóm tắt công việc đã làm, số liệu cụ thể và ghi chú kết quả
                </Text>
                <TextInput
                  style={styles.reportTextArea}
                  placeholder="Nhập nội dung báo cáo kết quả thực hiện..."
                  placeholderTextColor="#94A3B8"
                  value={reportNote}
                  onChangeText={setReportNote}
                  multiline
                />
              </View>

              {/* PHẦN 2: LINK TÀI LIỆU / GOOGLE DRIVE */}
              <View style={styles.reportSectionBlock}>
                <Text style={styles.reportSectionTitle}>2. Link Báo Cáo & File Số Liệu (Drive / Báo cáo)</Text>
                <Text style={styles.reportSectionSub}>
                  Dán đường link Google Drive, Dashboard, Video hoặc tài liệu tổng hợp
                </Text>
                <TextInput
                  style={styles.reportInput}
                  placeholder="https://drive.google.com/..."
                  placeholderTextColor="#94A3B8"
                  value={evidenceUrl}
                  onChangeText={setEvidenceUrl}
                  autoCapitalize="none"
                />
              </View>

              {/* PHẦN 3: HÌNH ẢNH MINH CHỨNG */}
              <View style={styles.reportSectionBlock}>
                <View style={styles.imagePickHeaderRow}>
                  <Text style={styles.reportSectionTitle}>3. Hình Ảnh Minh Chứng Đính Kèm</Text>
                  <TouchableOpacity
                    style={styles.pickImageBtn}
                    onPress={handlePickImages}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.pickImageBtnText}>+ Thêm ảnh</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.reportSectionSub}>
                  Chụp hoặc tải ảnh màn hình kết quả, biên bản nghiệm thu (tối đa nhiều ảnh)
                </Text>

                {evidenceImages.length > 0 ? (
                  <View style={styles.imageGrid}>
                    {evidenceImages.map((imgUri, idx) => (
                      <View key={idx} style={styles.imageThumbWrapper}>
                        <TouchableOpacity onPress={() => setPreviewImage(imgUri)} activeOpacity={0.8}>
                          <Image source={{ uri: imgUri }} style={styles.imageThumbnail} resizeMode="cover" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.removeImageBtn}
                          onPress={() => handleRemoveImage(idx)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.removeImageBtnText}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.emptyImageBox}
                    onPress={handlePickImages}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.emptyImageText}>+ Bấm vào đây để chọn ảnh từ thư viện</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Action Button */}
              <View style={styles.reportActionFooter}>
                <TouchableOpacity
                  style={styles.submitReportMainBtn}
                  onPress={handleSubmitReport}
                  activeOpacity={0.85}
                >
                  <Text style={styles.submitReportMainBtnText}>XÁC NHẬN NỘP BÁO CÁO & MINH CHỨNG</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* FULL IMAGE PREVIEW MODAL */}
      <Modal visible={previewImage !== null} animationType="fade" transparent onRequestClose={() => setPreviewImage(null)}>
        <View style={styles.previewOverlay}>
          <TouchableOpacity onPress={() => setPreviewImage(null)} style={styles.previewCloseBtn}>
            <Text style={styles.previewCloseBtnText}>Đóng xem ảnh</Text>
          </TouchableOpacity>
          {previewImage ? (
            <Image source={{ uri: previewImage }} style={styles.fullPreviewImage} resizeMode="contain" />
          ) : null}
        </View>
      </Modal>

      {/* ===================================================================== */}
      {/* MODAL 4: CHỈNH SỬA DOANH SỐ (GMV) CHO LEVEL - DÀNH CHO LEADER       */}
      {/* ===================================================================== */}
      <Modal
        visible={editGmvModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditGmvModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setEditGmvModalVisible(false)}>
          <Pressable style={styles.fullModalCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalHeaderTitle}>Cấu Hình Doanh Số • {selectedTier.levelName}</Text>
                <Text style={styles.modalHeaderSubtitle}>
                  Điều chỉnh số liệu GMV realtime cho toàn phòng ban
                </Text>
              </View>
              <TouchableOpacity onPress={() => setEditGmvModalVisible(false)} style={{ padding: 4 }}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              {/* Trường 1: Doanh số thực tế hiện tại */}
              <View style={styles.gmvInputFieldBlock}>
                <Text style={styles.gmvInputLabel}>1. Doanh số thực tế hiện tại ({gmvUnit})</Text>
                <Text style={styles.gmvInputSubText}>Số liệu thực tế nhân sự/team đã đạt được</Text>
                <TextInput
                  style={styles.gmvTextInput}
                  value={inputCurrentGmv}
                  onChangeText={setInputCurrentGmv}
                  keyboardType="numeric"
                  placeholder="Ví dụ: 120"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              {/* Trường 2: Chỉ tiêu nâng cấp (Ceiling GMV) */}
              <View style={styles.gmvInputFieldBlock}>
                <Text style={styles.gmvInputLabel}>2. Mục tiêu nâng cấp ({gmvUnit})</Text>
                <Text style={styles.gmvInputSubText}>Mốc doanh số cần đạt để đủ điều kiện xét thăng cấp</Text>
                <TextInput
                  style={styles.gmvTextInput}
                  value={inputCeilingGmv}
                  onChangeText={setInputCeilingGmv}
                  keyboardType="numeric"
                  placeholder="Ví dụ: 150"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              {/* Trường 3: Ngưỡng duy trì giữ cấp (Floor GMV) */}
              <View style={styles.gmvInputFieldBlock}>
                <Text style={styles.gmvInputLabel}>3. Ngưỡng duy trì giữ cấp ({gmvUnit})</Text>
                <Text style={styles.gmvInputSubText}>Mốc tối thiểu trong tháng để không bị hạ cấp</Text>
                <TextInput
                  style={styles.gmvTextInput}
                  value={inputFloorGmv}
                  onChangeText={setInputFloorGmv}
                  keyboardType="numeric"
                  placeholder="Ví dụ: 30"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.realtimeNoticeBox}>
                <Ionicons name="information-circle-outline" size={16} color="#0284C7" />
                <Text style={styles.realtimeNoticeText}>
                  Sau khi Lưu, toàn bộ nhân sự khi xem mục Cấp Bậc sẽ thấy ngay số liệu mới này theo thời gian thực (Real-time).
                </Text>
              </View>
            </ScrollView>

            <TouchableOpacity style={styles.saveGmvBtn} onPress={handleSaveGmv}>
              <Text style={styles.saveGmvBtnText}>LƯU & CẬP NHẬT REALTIME</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  cardBackBtn: {
    padding: 2,
    marginRight: 6,
    borderRadius: 8,
  },
  rankTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  scrollBody: {
    flex: 1,
  },

  /* ============================================================ */
  /* 1. VIP MEMBERSHIP CARD                                       */
  /* ============================================================ */
  cardSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  vipCardContainer: {
    backgroundColor: '#262A32',
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#374151',
  },
  vipCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  vipCardHeaderLeft: {
    flex: 1,
  },
  vipRankTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1.2,
  },
  vipUserName: {
    fontSize: 13,
    color: '#CBD5E1',
    marginTop: 2,
    fontWeight: '500',
  },
  tierBenefitsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  tierBenefitsBtnText: {
    fontSize: 11,
    color: '#F1F5F9',
    fontWeight: '600',
  },

  /* Inner White Floating Card */
  whiteFloatingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  upgradeHeaderNotice: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EA580C',
    marginBottom: 8,
  },

  /* Tên Dự Án Ở Giữa Card */
  cardProjectBanner: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#2563EB',
  },
  cardProjectTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2563EB',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  cardProjectMainTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 18,
  },
  cardProjectSubText: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 16,
    marginTop: 4,
  },
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  cardFooterDate: {
    fontSize: 10.5,
    color: '#6B7280',
  },
  cardFooterDetailLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  cardFooterDetailText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#6B7280',
  },

  /* ============================================================ */
  /* 2. LEVEL STEPPER SECTION                                     */
  /* ============================================================ */
  stepperSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  stepperScroll: {
    flexDirection: 'row',
  },
  stepChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minWidth: 90,
  },
  stepChipSelected: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  stepChipCurrent: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  stepChipTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepChipLevelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  stepChipTextSelected: {
    color: '#FFFFFF',
  },
  stepChipTextCurrent: {
    color: '#2563EB',
  },
  currentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2563EB',
  },
  stepChipSubText: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
    fontWeight: '500',
  },
  stepChipSubSelected: {
    color: '#94A3B8',
  },

  /* ============================================================ */
  /* 3. CRITERIA SECTION (3 TIÊU CHUẨN XÉT DUYỆT)                 */
  /* ============================================================ */
  criteriaSection: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  criteriaHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusBadgeActive: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeActiveText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  statusBadgePassed: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgePassedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
  statusBadgeLocked: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeLockedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  criteriaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  criteriaCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  criteriaInfoCol: {
    flex: 1,
    paddingRight: 10,
  },
  criteriaMainTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  criteriaTargetText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  criteriaPercentBox: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  criteriaPercentText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2563EB',
  },
  criteriaStatusPill: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  criteriaStatusPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  criteriaBarTrack: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  criteriaBarFill: {
    height: '100%',
    backgroundColor: '#2563EB',
    borderRadius: 3,
  },
  criteriaScoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  criteriaCurrentScore: {
    fontSize: 11,
    color: '#475569',
  },
  criteriaTargetScore: {
    fontSize: 11,
    color: '#64748B',
  },
  retentionFloorBox: {
    backgroundColor: '#F0FDF4',
    padding: 8,
    borderRadius: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  retentionFloorText: {
    fontSize: 11,
    color: '#15803D',
  },
  criteriaSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 3,
  },
  criteriaSubBullet: {
    fontSize: 14,
    color: '#059669',
    fontWeight: 'bold',
  },
  criteriaSubText: {
    fontSize: 11,
    color: '#334155',
  },
  projectDescText: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 16,
    marginBottom: 10,
  },
  projectBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  projectStatusPill: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  projectStatusPillText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#475569',
  },
  projectDetailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  projectDetailBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },

  /* ============================================================ */
  /* 3. PERKS & PRIVILEGES SECTION (LUXURY MODERN 2-COL GRID)    */
  /* ============================================================ */
  perksSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  perksHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  perksHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionSubHeaderTitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  perkCountBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  perkCountBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B45309',
  },
  perksGridTwoCol: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  perkModernCard: {
    width: '48.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    justifyContent: 'space-between',
    minHeight: 140,
  },
  perkModernCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  perkIconRoundBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  perkCategoryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  perkCategoryBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  perkModernTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 17,
    marginBottom: 4,
  },
  perkModernSubtitle: {
    fontSize: 10.5,
    color: '#64748B',
    lineHeight: 15,
    flex: 1,
    marginBottom: 8,
  },
  perkModernFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  perkNumberPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  perkNumberPillText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#475569',
  },
  perkUnlockedBadge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  perkLockedBadge: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ============================================================ */
  /* MODALS                                                       */
  /* ============================================================ */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  fullModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    width: '100%',
    maxWidth: 420,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  infoModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    width: '100%',
    maxWidth: 380,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalHeaderSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  roadmapItemCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  roadmapItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  roadmapBadge: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  roadmapBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  roadmapTitleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  roadmapConditionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  roadmapConditionLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  roadmapConditionValue: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },
  roadmapPerkSummary: {
    gap: 3,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  roadmapPerkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  roadmapPerkBullet: {
    fontSize: 12,
    color: '#059669',
    fontWeight: 'bold',
  },
  roadmapPerkText: {
    fontSize: 10,
    color: '#334155',
  },
  modalConfirmBtn: {
    backgroundColor: '#0F172A',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  modalConfirmBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  infoDescriptionText: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 12,
  },
  boldText: {
    fontWeight: '700',
    color: '#1E40AF',
  },
  infoStepBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#2563EB',
  },
  infoStepTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  infoStepDesc: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
  },
  projectLevelTagBadge: {
    backgroundColor: '#CCFBF1',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  projectLevelTagBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F766E',
  },
  assignedTasksBlock: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  assignedTasksHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  assignedTasksHeaderTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  openProjectManageLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F0FDFA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  openProjectManageLinkText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F766E',
  },
  assignedTasksList: {
    gap: 8,
  },
  assignedTaskCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
  },
  assignedTaskCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  assignedTaskOrderBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  assignedTaskOrderText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  assignedTaskTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 18,
  },
  assignedTaskKpi: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  statusBadgeApproved: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusBadgeApprovedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  statusBadgeSubmitted: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusBadgeSubmittedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
  },
  statusBadgePending: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusBadgePendingText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2563EB',
  },
  submittedPreviewBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    padding: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  submittedPreviewLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 2,
  },
  submittedPreviewNote: {
    fontSize: 12,
    color: '#1E293B',
    lineHeight: 16,
  },
  submittedPreviewLink: {
    fontSize: 11,
    color: '#2563EB',
    marginTop: 3,
  },
  submittedPreviewImagesCount: {
    fontSize: 10,
    color: '#059669',
    fontWeight: '600',
    marginTop: 3,
  },
  reportActionBtn: {
    backgroundColor: '#0F766E',
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  reportActionBtnSecondary: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#0F766E',
  },
  reportActionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  reportActionBtnTextSecondary: {
    color: '#0F766E',
  },
  emptyAssignedBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  emptyAssignedTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    textAlign: 'center',
    marginBottom: 4,
  },
  emptyAssignedDesc: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 16,
  },
  goToAssignBtn: {
    backgroundColor: '#0F766E',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 10,
  },
  goToAssignBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  reportModalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  reportTopSafeArea: {
    backgroundColor: '#0F766E',
  },
  reportModalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: '#0F766E',
  },
  reportModalLevelTag: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#99F6E4',
    marginBottom: 2,
  },
  reportModalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    lineHeight: 22,
  },
  reportModalCloseBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginLeft: 10,
  },
  reportModalCloseBtnText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  reportModalBody: {
    padding: 18,
  },
  reportKpiCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  reportKpiLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  reportKpiValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A',
    marginTop: 2,
  },
  reportKpiDesc: {
    fontSize: 12,
    color: '#475569',
    marginTop: 4,
    lineHeight: 17,
  },
  reportSectionBlock: {
    marginBottom: 20,
  },
  reportSectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  reportSectionSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 8,
    lineHeight: 17,
  },
  reportTextArea: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#0F172A',
    minHeight: 110,
    textAlignVertical: 'top',
  },
  reportInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#0F172A',
  },
  imagePickHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickImageBtn: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pickImageBtnText: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: 'bold',
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 6,
  },
  imageThumbWrapper: {
    position: 'relative',
  },
  imageThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
  },
  removeImageBtn: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#DC2626',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeImageBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  emptyImageBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyImageText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  reportActionFooter: {
    marginTop: 10,
    marginBottom: 40,
  },
  submitReportMainBtn: {
    backgroundColor: '#0F766E',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitReportMainBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 0.3,
  },
  previewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  previewCloseBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    zIndex: 10,
  },
  previewCloseBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  fullPreviewImage: {
    width: '100%',
    height: '75%',
  },

  /* GMV Specific Styles */
  gmvCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  editGmvButtonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#99F6E4',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  editGmvButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F766E',
  },
  gmvInputFieldBlock: {
    marginBottom: 14,
  },
  gmvInputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  gmvInputSubText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 6,
  },
  gmvTextInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  realtimeNoticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: '#F0F9FF',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    marginTop: 4,
    marginBottom: 10,
  },
  realtimeNoticeText: {
    flex: 1,
    fontSize: 11.5,
    color: '#0369A1',
    lineHeight: 16,
  },
  saveGmvBtn: {
    backgroundColor: '#0F766E',
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  saveGmvBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});
