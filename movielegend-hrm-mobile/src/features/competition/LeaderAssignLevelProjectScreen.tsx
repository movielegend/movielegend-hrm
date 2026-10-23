import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  StatusBar,
  Image,
  KeyboardAvoidingView,
  Platform} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../providers/AuthProvider';
import { useScopedEmployees } from '../../hooks/useEmployees';
import {
  useLevelProjects,
  BulletSubTask,
  LevelDepartmentProject,
  LevelProjectPermissionRequest,
} from '../leveling/levelProjectsStore';
import { LEVEL_COLORS, LEVEL_DEFAULT_NAMES } from '../../components/common/LevelNameBadge';
import { CustomAlert } from '../../components/CustomAlert';

export const LeaderAssignLevelProjectScreen: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const safeTopInset = Math.max((insets.top > 0 ? insets.top : (StatusBar.currentHeight || 20)) - 6, 8);
  const currentLeaderId = user?.id || 'leader-me';
  const currentLeaderName = user?.fullName || 'Trưởng nhóm (Tôi)';
  const leaderDeptId = (user as any)?.departmentId || user?.department?.id;
  const leaderDeptName = user?.department?.name || (user as any)?.departmentName;

  const {
    projects,
    getProjectByLevel,
    acceptProject,
    assignSubTask,
    submitSubTask,
    approveSubTask,
    rejectSubTask,
    submitProjectToAdmin,
    reviewProjectAccess,
    getPendingAccessRequests,
  } = useLevelProjects(leaderDeptId, leaderDeptName);

  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [projectSectionTab, setProjectSectionTab] = useState<'active' | 'history'>('active');

  const activeProjects = useMemo(() => {
    return projects.filter((p) => p.status !== 'ADMIN_APPROVED');
  }, [projects]);

  const completedProjects = useMemo(() => {
    return projects.filter((p) => p.status === 'ADMIN_APPROVED');
  }, [projects]);

  const displayedProjects = useMemo(() => {
    if (projectSectionTab === 'history') {
      return completedProjects;
    }
    return activeProjects.length > 0 ? activeProjects : projects;
  }, [projectSectionTab, activeProjects, completedProjects, projects]);

  // Auto-select first project when displayed projects load or change
  useEffect(() => {
    if (displayedProjects.length > 0 && displayedProjects[0]) {
      if (!selectedProjectId || !displayedProjects.some((p) => p.id === selectedProjectId)) {
        setSelectedProjectId(displayedProjects[0].id);
      }
    }
  }, [displayedProjects, selectedProjectId]);

  const currentProject = useMemo(() => {
    return displayedProjects.find((p) => p.id === selectedProjectId) || displayedProjects[0];
  }, [displayedProjects, selectedProjectId]);

  const selectedLevelNumber = currentProject?.levelNumber || 1;

  // Quick Filter State
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SUBMITTED' | 'ASSIGNED' | 'LEADER_APPROVED' | 'UNASSIGNED'>('ALL');

  // Detail Page / Modal State
  const [activeSubTask, setActiveSubTask] = useState<BulletSubTask | null>(null);
  const [leaderFeedbackText, setLeaderFeedbackText] = useState('');
  const [leaderSelfReportText, setLeaderSelfReportText] = useState('');
  const [leaderSelfEvidenceUrl, setLeaderSelfEvidenceUrl] = useState('');
  const [leaderSelfImages, setLeaderSelfImages] = useState<string[]>([]);
  const [searchMemberQuery, setSearchMemberQuery] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Submit Project to Admin Modal
  const [submitAdminModalVisible, setSubmitAdminModalVisible] = useState(false);
  const [adminReportText, setAdminReportText] = useState('');
  const [adminReportUrl, setAdminReportUrl] = useState('');

  // Scoped employees query
  const { data: scopedEmployeesData } = useScopedEmployees({ page: 1, limit: 50 });
  const realEmployees = scopedEmployeesData?.items || [];

  const teamList = useMemo(() => {
    const leaderItem = {
      id: currentLeaderId,
      name: `${currentLeaderName} (Chính tôi / Leader)`,
      rawName: currentLeaderName,
      role: 'Trưởng nhóm / Trực tiếp nhận việc',
      isMe: true,
    };

    if (realEmployees.length > 0) {
      const mapped = realEmployees
        .filter((e) => e.id !== currentLeaderId)
        .map((e) => ({
          id: e.id,
          name: e.fullName || e.userCode,
          rawName: e.fullName || e.userCode,
          role: e.position?.name || 'Nhân viên',
          isMe: false,
        }));
      return [leaderItem, ...mapped];
    }

    return [leaderItem];
  }, [realEmployees, currentLeaderId, currentLeaderName]);

  const filteredTeamList = useMemo(() => {
    if (!searchMemberQuery.trim()) return teamList;
    const q = searchMemberQuery.toLowerCase();
    return teamList.filter((m) => m.name.toLowerCase().includes(q) || m.role.toLowerCase().includes(q));
  }, [teamList, searchMemberQuery]);

  const [showRewardBreakdown, setShowRewardBreakdown] = useState(true);
  const [isProjectDropdownVisible, setIsProjectDropdownVisible] = useState(false);

  // Parse total cash pool from current project
  const totalCashPool = useMemo(() => {
    if (currentProject?.rewardType === 'PHYSICAL_ITEM') {
      return 0;
    }
    if (currentProject?.cashAmount && currentProject.cashAmount > 0) {
      return currentProject.cashAmount;
    }
    if ((currentProject as any)?.promotionBonusAmount && (currentProject as any).promotionBonusAmount > 0) {
      return (currentProject as any).promotionBonusAmount;
    }
    // Fallback parse numeric amount from rewardItem string
    if (currentProject?.rewardItem) {
      const match = currentProject.rewardItem.replace(/\./g, '').match(/(\d+)\s*(?:VNĐ|VND|đ)?/i);
      if (match && match[1]) {
        return Number(match[1]) || 0;
      }
    }
    return 0;
  }, [currentProject?.rewardType, currentProject?.cashAmount, (currentProject as any)?.promotionBonusAmount, currentProject?.rewardItem]);

  // Parse physical items from current project
  const physicalItemList = useMemo(() => {
    if (currentProject?.rewardType === 'CASH') {
      return [];
    }
    const rawList: string[] = [];
    if (Array.isArray(currentProject?.physicalItems) && currentProject.physicalItems.length > 0) {
      rawList.push(...currentProject.physicalItems);
    } else if (currentProject?.physicalItemName?.trim()) {
      rawList.push(...currentProject.physicalItemName.split(/[,;\n]+/).map((s) => s.trim()));
    } else if (currentProject?.rewardItem?.includes('🎁')) {
      const giftPart = currentProject.rewardItem.split('🎁')[1]?.split('+')[0]?.trim();
      if (giftPart) rawList.push(giftPart.replace(/\(Hiện vật chung\)/g, '').trim());
    }

    return rawList
      .map((s) => String(s || '').trim())
      .filter((s) => {
        if (!s) return false;
        // Filter out strings that look like money/numeric amounts (e.g. 5.000.000 VNĐ)
        const isMoney = /^[\d\.,\s]+(VNĐ|VND|đ)?$/i.test(s) || /^\d+$/.test(s.replace(/[\.,\s]/g, ''));
        return !isMoney;
      });
  }, [currentProject?.rewardType, currentProject?.physicalItems, currentProject?.physicalItemName, currentProject?.rewardItem]);

  // Compute participating members in this level project and their Level multiplier weight
  const participatingMembers = useMemo(() => {
    if (!currentProject) return [];
    const userMap = new Map<
      string,
      {
        userId: string;
        userName: string;
        levelNumber: number;
        levelWeight: number;
        taskCount: number;
        isLeader: boolean;
      }
    >();

    (currentProject.subTasks || []).forEach((st) => {
      if (st.assignedToUserId) {
        const uId = st.assignedToUserId;
        const isLeaderUser = uId === currentLeaderId || uId === 'leader-me';
        const uName = isLeaderUser ? `${currentLeaderName} (Leader)` : (st.assignedToUserName || 'Nhân sự');

        if (!userMap.has(uId)) {
          const emp = realEmployees.find((e) => e.id === uId);
          const lvl = emp?.profile?.currentLevelNumber || (isLeaderUser ? Math.max(selectedLevelNumber, 3) : 1);

          // Level multiplier: Lv.1 = 1.0, Lv.2 = 1.5, Lv.3 = 2.0, Lv.4 = 2.5, Lv.5 = 3.0, Lv.6 = 3.5, Lv.7 = 4.0, Lv.8 = 5.0
          const weight =
            lvl <= 1 ? 1.0 : lvl === 2 ? 1.5 : lvl === 3 ? 2.0 : lvl === 4 ? 2.5 : lvl === 5 ? 3.0 : lvl === 6 ? 3.5 : lvl === 7 ? 4.0 : 5.0;

          userMap.set(uId, {
            userId: uId,
            userName: uName,
            levelNumber: lvl,
            levelWeight: weight,
            taskCount: 1,
            isLeader: isLeaderUser,
          });
        } else {
          const existing = userMap.get(uId)!;
          existing.taskCount += 1;
        }
      }
    });

    return Array.from(userMap.values());
  }, [currentProject, realEmployees, currentLeaderId, currentLeaderName, selectedLevelNumber]);

  const totalTeamWeight = useMemo(() => {
    return participatingMembers.reduce((sum, m) => sum + m.levelWeight, 0);
  }, [participatingMembers]);

  // Handle Leader accepts project from Admin
  const handleAcceptProject = () => {
    acceptProject(selectedLevelNumber);
    CustomAlert.alert('Thành Công', `Đã tiếp nhận dự án ${currentProject?.levelName}.`);
  };

  // Open modal for a task
  const handleOpenTaskModal = (task: BulletSubTask) => {
    setActiveSubTask(task);
    setLeaderFeedbackText(task.leaderFeedback || '');
    setLeaderSelfReportText(task.submissionNote || '');
    setLeaderSelfEvidenceUrl(task.evidenceUrl || '');
    setLeaderSelfImages(task.evidenceImages || []);
  };

  // Image Picker action for Leader
  const handlePickLeaderImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets) {
        const newUris = result.assets.map((a) => a.uri);
        setLeaderSelfImages((prev) => [...prev, ...newUris]);
      }
    } catch {
      CustomAlert.alert('Thông báo', 'Không thể mở thư viện ảnh');
    }
  };

  const handleRemoveLeaderImage = (indexToRemove: number) => {
    setLeaderSelfImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Handle Leader submitting report for their own assigned subtask
  const handleLeaderSubmitReport = () => {
    if (!activeSubTask || !currentProject) return;
    if (!leaderSelfReportText.trim()) {
      CustomAlert.alert('Lỗi', 'Vui lòng nhập nội dung báo cáo kết quả thực hiện');
      return;
    }

    submitSubTask(
      selectedLevelNumber,
      activeSubTask.id,
      leaderSelfReportText.trim(),
      leaderSelfEvidenceUrl.trim() || undefined,
      leaderSelfImages
    );

    setActiveSubTask((prev) =>
      prev
        ? {
            ...prev,
            status: 'SUBMITTED',
            submissionNote: leaderSelfReportText.trim(),
            evidenceUrl: leaderSelfEvidenceUrl.trim() || undefined,
            evidenceImages: leaderSelfImages,
            submittedAt: new Date().toISOString(),
          }
        : null
    );

    CustomAlert.alert('Thành Công', 'Đã nộp báo cáo kết quả thực hiện cho đầu mục công việc này.');
  };

  // Handle assigning member to a specific subtask
  const handleConfirmAssign = (member: { id: string; name: string; rawName?: string }) => {
    if (!activeSubTask || !currentProject) return;

    const assignName = member.rawName || member.name;
    assignSubTask(selectedLevelNumber, activeSubTask.id, member.id, assignName);

    setActiveSubTask((prev) =>
      prev ? { ...prev, assignedToUserId: member.id, assignedToUserName: assignName, status: 'ASSIGNED' } : null
    );
    setSearchMemberQuery('');
    CustomAlert.alert('Thành Công', `Đã giao việc cho ${assignName}.`);
  };

  // Handle approving subtask (Vòng 1 - Chưa nâng cấp bậc trực tiếp)
  const handleApproveSubTask = (subTaskId: string) => {
    approveSubTask(selectedLevelNumber, subTaskId, leaderFeedbackText.trim() || undefined);
    setActiveSubTask((prev) =>
      prev ? { ...prev, status: 'LEADER_APPROVED', leaderApprovedAt: new Date().toISOString(), leaderFeedback: leaderFeedbackText.trim() || undefined } : null
    );
    CustomAlert.alert(
      'Duyệt Vòng 1 Thành Công',
      'Đã duyệt Vòng 1 đầu mục công việc. Kết quả được lưu vào hồ sơ để Ban Giám Đốc / Admin xét duyệt nâng cấp bậc tại cuộc họp cuối tháng.'
    );
  };

  // Handle rejecting / requesting rework
  const handleRejectSubTask = (subTaskId: string) => {
    if (!leaderFeedbackText.trim()) {
      CustomAlert.alert('Yêu cầu lý do', 'Vui lòng nhập ghi chú / lý do cần sửa lại để nhân sự biết điểm cần hoàn thiện.');
      return;
    }

    rejectSubTask(selectedLevelNumber, subTaskId, leaderFeedbackText.trim());
    setActiveSubTask((prev) =>
      prev ? { ...prev, status: 'ASSIGNED', leaderFeedback: leaderFeedbackText.trim() } : null
    );
    CustomAlert.alert('Đã gửi phản hồi', 'Đã chuyển trạng thái việc con về Đang làm để nhân sự cập nhật lại báo cáo.');
  };

  // Handle approving access request for next level project
  const handleApproveAccessRequest = async (reqId: string, empName: string, lvlName: string) => {
    await reviewProjectAccess(reqId, 'APPROVED', undefined, currentLeaderName);
    CustomAlert.alert(
      'Đã Phê Duyệt',
      `Đã cho phép nhân sự ${empName} thực hiện dự án ${lvlName}. Nhân sự hiện đã có thể nhận việc con và nộp báo cáo!`
    );
  };

  // Handle rejecting access request
  const handleRejectAccessRequest = async (reqId: string, empName: string, lvlName: string) => {
    CustomAlert.alert(
      'Từ Chối Yêu Cầu',
      `Bạn có chắc chắn muốn từ chối yêu cầu xin làm dự án ${lvlName} của ${empName}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Từ Chối',
          style: 'destructive',
          onPress: async () => {
            await reviewProjectAccess(
              reqId,
              'REJECTED',
              'Trưởng nhóm chưa phê duyệt làm dự án vượt cấp tại thời điểm này.',
              currentLeaderName
            );
            CustomAlert.alert('Đã Từ Chối', `Đã từ chối yêu cầu của ${empName}.`);
          },
        },
      ]
    );
  };

  const subTasks = currentProject?.subTasks || [];
  const totalSubTasks = subTasks.length;
  const approvedSubTasks = subTasks.filter((t) => t.status === 'LEADER_APPROVED').length;
  const progressPercent = totalSubTasks > 0 ? Math.round((approvedSubTasks / totalSubTasks) * 100) : 0;
  const isAllSubTasksApproved = totalSubTasks > 0 && approvedSubTasks === totalSubTasks;

  const handleOpenSubmitAdminModal = () => {
    if (totalSubTasks === 0) {
      CustomAlert.alert('Chưa có công việc', 'Dự án hiện chưa có đầu việc con nào được giao.');
      return;
    }
    setSubmitAdminModalVisible(true);
  };

  // Handle submitting project to Admin
  const handleSubmitProjectToAdmin = async () => {
    if (!isAllSubTasksApproved) {
      CustomAlert.alert(
        'Chưa thể gửi Ban Giám Đốc',
        `Dự án có ${totalSubTasks} việc con nhưng hiện mới chỉ duyệt đạt ${approvedSubTasks}/${totalSubTasks} việc (còn ${totalSubTasks - approvedSubTasks} việc chưa duyệt Vòng 1).\n\nLeader cần kiểm tra và duyệt đạt 100% các đầu việc con trước khi gửi báo cáo nghiệm thu lên Ban Giám Đốc.`
      );
      return;
    }
    if (!adminReportText.trim()) {
      CustomAlert.alert('Chưa nhập báo cáo', 'Vui lòng nhập nội dung nhận xét, đánh giá kết quả nghiệm thu gửi Ban Giám Đốc.');
      return;
    }

    await submitProjectToAdmin(selectedLevelNumber, adminReportText.trim(), adminReportUrl.trim() || undefined);
    setSubmitAdminModalVisible(false);
    CustomAlert.alert('Thành Công', `Đã gửi báo cáo nghiệm thu ${currentProject?.projectName || currentProject?.levelName} lên Ban Giám Đốc.`);
  };

  const countPending = subTasks.filter((t) => t.status === 'SUBMITTED').length;
  const countAssigned = subTasks.filter((t) => t.status === 'ASSIGNED').length;
  const countApproved = approvedSubTasks;
  const countUnassigned = subTasks.filter((t) => t.status === 'UNASSIGNED').length;

  const filteredSubTasks = useMemo(() => {
    if (statusFilter === 'ALL') return subTasks;
    return subTasks.filter((t) => t.status === statusFilter);
  }, [subTasks, statusFilter]);

  if (!currentProject || projects.length === 0) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#102739" />
        <View style={[styles.topSafeArea, { paddingTop: safeTopInset }]}>
          <View style={styles.topHeader}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => router.back()}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.headerTitleWrap}>
              <Text style={styles.headerTitle}>Dự án phòng ban</Text>
              <Text style={styles.headerSubtitle}>
                {leaderDeptName || 'DEV (MOVIELEGEND-HÀ NỘI)'}
              </Text>
            </View>
            <View style={{ width: 32 }} />
          </View>
        </View>

        <View style={styles.bodyWrapper}>
          {/* Section Header: [ Dự án được giao | 0 dự án ] */}
          <View style={styles.templateHeaderRow}>
            <Text style={styles.templateHeaderTitle}>Dự án được giao</Text>
            <View style={styles.templateHeaderPill}>
              <Text style={styles.templateHeaderPillText}>0 dự án</Text>
            </View>
          </View>

          {/* Empty Illustration & Text */}
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="folder-open-outline" size={54} color="#102739" />
            </View>
            <Text style={styles.emptyTitle}>Chưa có dự án nào</Text>
            <Text style={styles.emptySubtitle}>
              Phòng ban chưa được Admin giao dự án.
            </Text>
            <Text style={styles.emptyDesc}>
              {'Khi Admin tạo dự án và các đầu việc,\nnội dung sẽ hiển thị tại đây để bạn\nphân bổ cho nhân sự.'}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#102739" />
      <View style={[styles.topSafeArea, { paddingTop: safeTopInset }]}>
        <View style={styles.topHeader}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Dự án phòng ban</Text>
            <Text style={styles.headerSubtitle}>
              {leaderDeptName || 'DEV (MOVIELEGEND-HÀ NỘI)'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.templateTopSubmitBtn}
            onPress={handleOpenSubmitAdminModal}
            activeOpacity={0.8}
          >
            <Text style={styles.templateTopSubmitBtnText}>Nộp Admin</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.bodyWrapper}>
        {/* Section Header: [ Dự án được giao | X dự án ] */}
        <View style={styles.templateHeaderRow}>
          <Text style={styles.templateHeaderTitle}>Dự án được giao</Text>
          <View style={styles.templateHeaderPill}>
            <Text style={styles.templateHeaderPillText}>
              {displayedProjects.length} dự án
            </Text>
          </View>
        </View>

        {/* Section Tabs: Đang thực hiện vs Hoàn thành (Matching Image 1) */}
        <View style={styles.templateSectionTabsRow}>
          <TouchableOpacity
            style={[styles.templateSectionTabItem, projectSectionTab === 'active' && styles.templateSectionTabItemActive]}
            onPress={() => setProjectSectionTab('active')}
            activeOpacity={0.7}
          >
            <Text style={[styles.templateSectionTabText, projectSectionTab === 'active' && styles.templateSectionTabTextActive]}>
              {'Đang thực hiện (' + activeProjects.length + ')'}
            </Text>
            {projectSectionTab === 'active' && <View style={styles.templateSectionTabUnderline} />}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.templateSectionTabItem, projectSectionTab === 'history' && styles.templateSectionTabItemActive]}
            onPress={() => setProjectSectionTab('history')}
            activeOpacity={0.7}
          >
            <Text style={[styles.templateSectionTabText, projectSectionTab === 'history' && styles.templateSectionTabTextActive]}>
              {'Hoàn thành (' + completedProjects.length + ')'}
            </Text>
            {projectSectionTab === 'history' && <View style={styles.templateSectionTabUnderline} />}
          </TouchableOpacity>
        </View>

        {/* Project Selector Dropdown Button (Matching Image 1) */}
        <TouchableOpacity
          style={styles.templateProjectDropdownBtn}
          onPress={() => setIsProjectDropdownVisible(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.templateProjectDropdownText} numberOfLines={1}>
            {currentProject?.projectName || currentProject?.levelName || 'Chọn dự án'}
          </Text>
          <Ionicons name="chevron-down" size={18} color="#64748B" />
        </TouchableOpacity>

        {projectSectionTab === 'history' && completedProjects.length === 0 ? (
          <View style={styles.emptyHistoryBox}>
            <Ionicons name="ribbon-outline" size={56} color="#94A3B8" />
            <Text style={styles.emptyHistoryTitle}>Chưa có dự án nào hoàn thành</Text>
            <Text style={styles.emptyHistorySubtitle}>
              Khi Leader nộp báo cáo tổng kết và Ban Giám Đốc phê duyệt nghiệm thu, toàn bộ dự án, đầu việc con và minh chứng của nhân sự sẽ được lưu trữ vĩnh viễn tại mục Lịch Sử này.
            </Text>
          </View>
        ) : (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={[styles.templateScrollContent, { paddingBottom: 100 + Math.max(insets.bottom, 24) }]}
            showsVerticalScrollIndicator={false}
          >
            {/* CARD 1: PHẦN THƯỞNG DỰ ÁN (Matching Image 1) */}
            <View style={styles.templateCard}>
              <Text style={styles.templateCardTitle}>Phần thưởng dự án</Text>

              <View style={styles.templateTwoColsRow}>
                {/* Cột 1: Tiền mặt */}
                <View style={styles.templateColItem}>
                  <Text style={styles.templateColLabel}>Tiền mặt</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                    <Text style={styles.templateColAmount}>
                      {totalCashPool > 0 ? totalCashPool.toLocaleString('vi-VN') : '0'}
                    </Text>
                    <Text style={styles.templateColUnit}>VNĐ</Text>
                  </View>
                  <Text style={styles.templateColSub}>Chia theo hệ số Level</Text>
                </View>

                {/* Vertical Divider */}
                <View style={styles.templateColDivider} />

                {/* Cột 2: Hiện vật */}
                <View style={[styles.templateColItem, { paddingLeft: 16 }]}>
                  <Text style={styles.templateColLabel}>Hiện vật</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                    <Text
                      style={[
                        styles.templateColAmount,
                        physicalItemList.length === 0 && { fontSize: 16, color: '#94A3B8', fontWeight: '600' },
                      ]}
                      numberOfLines={1}
                    >
                      {physicalItemList.length > 0 ? physicalItemList.join(' • ') : 'Không có'}
                    </Text>
                    {physicalItemList.length > 0 && (
                      <Text style={styles.templateColUnit}> </Text>
                    )}
                  </View>
                  <Text style={styles.templateColSub}>Dùng chung cho cả team</Text>
                </View>
              </View>

              <View style={styles.templateCardDivider} />
              <Text style={styles.templateFooterNote}>
                Phân bổ theo hệ số Level của thành viên nhận việc.
              </Text>
            </View>

            {/* CARD 2: PHÂN BỔ TIỀN THƯỞNG (Matching Image 1) */}
            <View style={styles.templateCard}>
              <TouchableOpacity
                style={styles.templateCardHeaderRow}
                onPress={() => setShowRewardBreakdown((prev) => !prev)}
                activeOpacity={0.7}
              >
                <Text style={styles.templateCardTitle}>Phân bổ tiền thưởng</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={styles.templateMemberBadge}>
                    <Text style={styles.templateMemberBadgeText}>
                      {participatingMembers.length} nhân sự
                    </Text>
                  </View>
                  <Ionicons
                    name={showRewardBreakdown ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color="#0F172A"
                  />
                </View>
              </TouchableOpacity>

              {showRewardBreakdown && (
                <View style={{ marginTop: 14 }}>
                  {participatingMembers.length === 0 ? (
                    <Text style={styles.templateEmptyNote}>
                      Chưa có nhân sự nào được giao việc con trong dự án này.
                    </Text>
                  ) : (
                    participatingMembers.map((m) => {
                      const initials = m.userName
                        .split(' ')
                        .map((w) => w[0])
                        .slice(-2)
                        .join('')
                        .toUpperCase();
                      const shareAmount =
                        totalTeamWeight > 0 ? Math.round((m.levelWeight / totalTeamWeight) * totalCashPool) : 0;
                      const percentStr =
                        totalSubTasks > 0 ? Math.round((m.taskCount / totalSubTasks) * 100) : 0;

                      return (
                        <View key={m.userId} style={styles.templateMemberRow}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <View style={styles.templateAvatarCircle}>
                              <Text style={styles.templateAvatarText}>{initials || 'NV'}</Text>
                            </View>
                            <View>
                              <Text style={styles.templateMemberName}>{m.userName}</Text>
                              <Text style={styles.templateMemberSubtitle}>
                                Level {m.levelNumber} • Hệ số {m.levelWeight}x
                              </Text>
                            </View>
                          </View>

                          <View style={styles.templateMemberShareBox}>
                            <Text style={styles.templateMemberTaskInfo}>
                              {m.taskCount} việc con • {percentStr}%
                            </Text>
                            <View style={{ alignItems: 'flex-end' }}>
                              <Text style={styles.templateMemberShareAmount}>
                                {shareAmount.toLocaleString('vi-VN')} đ
                              </Text>
                              <Text style={styles.templateMemberShareSub}>Ước tính nhận</Text>
                            </View>
                          </View>
                        </View>
                      );
                    })
                  )}

                  <Text style={styles.templateFormulaText}>
                    {'Công thức: (Hệ số Level cá nhân / Tổng hệ số team) × ' + totalCashPool.toLocaleString('vi-VN') + ' VNĐ.'}
                  </Text>

                  <View style={styles.templateNoticeBox}>
                    <Text style={styles.templateNoticeText}>
                      Hiển thị tại chi tiết Level, không tự động cộng vào ví.
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* CARD 3: CÔNG VIỆC DỰ ÁN (Matching Image 1) */}
            <View style={styles.templateCard}>
              <View style={styles.templateCardHeaderRow}>
                <Text style={styles.templateCardTitle}>Công việc dự án</Text>
                <View style={styles.templateTaskBadge}>
                  <Text style={styles.templateTaskBadgeText}>{totalSubTasks} công việc</Text>
                </View>
              </View>

              {/* Subtask Status Filter Tabs */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.templateSubtaskTabsScroll}
              >
                {(['ALL', 'SUBMITTED', 'ASSIGNED', 'LEADER_APPROVED'] as const).map((tabKey) => {
                  const count =
                    tabKey === 'ALL'
                      ? totalSubTasks
                      : tabKey === 'SUBMITTED'
                      ? countPending
                      : tabKey === 'ASSIGNED'
                      ? countAssigned
                      : countApproved;
                  const label =
                    tabKey === 'ALL'
                      ? 'Tất cả (' + count + ')'
                      : tabKey === 'SUBMITTED'
                      ? 'Chờ duyệt V1 (' + count + ')'
                      : tabKey === 'ASSIGNED'
                      ? 'Đang làm (' + count + ')'
                      : 'Đã duyệt V1 (' + count + ')';
                  const isActive = statusFilter === tabKey;

                  return (
                    <TouchableOpacity
                      key={tabKey}
                      style={[styles.templateSubtaskTabItem, isActive && styles.templateSubtaskTabItemActive]}
                      onPress={() => setStatusFilter(tabKey)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.templateSubtaskTabText, isActive && styles.templateSubtaskTabTextActive]}>
                        {label}
                      </Text>
                      {isActive && <View style={styles.templateSubtaskTabUnderline} />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Subtasks List */}
              <View style={{ marginTop: 12, gap: 10 }}>
                {filteredSubTasks.length === 0 ? (
                  <Text style={styles.templateEmptyNote}>
                    Không có công việc nào trong danh mục này.
                  </Text>
                ) : (
                  filteredSubTasks.map((st) => {
                    const isApproved = st.status === 'LEADER_APPROVED';
                    const isSubmitted = st.status === 'SUBMITTED';
                    const isAssigned = st.status === 'ASSIGNED';
                    const orderPadded = String(st.orderNumber || 1).padStart(2, '0');

                    return (
                      <TouchableOpacity
                        key={st.id}
                        style={styles.templateSubtaskRowCard}
                        onPress={() => handleOpenTaskModal(st)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.templateSubtaskOrderCircle}>
                          <Text style={styles.templateSubtaskOrderText}>{orderPadded}</Text>
                        </View>

                        <View style={{ flex: 1, marginHorizontal: 10 }}>
                          <Text style={styles.templateSubtaskTitle} numberOfLines={2}>
                            {st.title}
                          </Text>
                          <Text style={styles.templateSubtaskAssignee}>
                            {st.assignedToUserName || 'Chưa phân công'}
                          </Text>
                        </View>

                        <View
                          style={[
                            styles.templateStatusPill,
                            isApproved
                              ? styles.tplStatusPillApproved
                              : isSubmitted
                              ? styles.tplStatusPillSubmitted
                              : isAssigned
                              ? styles.tplStatusPillAssigned
                              : styles.tplStatusPillUnassigned,
                          ]}
                        >
                          <Text
                            style={[
                              styles.templateStatusPillText,
                              isApproved
                                ? styles.tplStatusTextApproved
                                : isSubmitted
                                ? styles.tplStatusTextSubmitted
                                : isAssigned
                                ? styles.tplStatusTextAssigned
                                : styles.tplStatusTextUnassigned,
                            ]}
                          >
                            {isApproved
                              ? 'Đã duyệt V1'
                              : isSubmitted
                              ? 'Chờ duyệt V1'
                              : isAssigned
                              ? 'Đang làm'
                              : 'Chưa giao'}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>
            </View>

            {/* NỘP BÁO CÁO NGHIỆM THU LÊN ADMIN BUTTON (Matching Image 1) */}
            {currentProject?.status === 'IN_PROGRESS' && (
              <TouchableOpacity
                style={styles.templateBottomSubmitBtn}
                onPress={handleOpenSubmitAdminModal}
                activeOpacity={0.85}
              >
                <Text style={styles.templateBottomSubmitBtnText}>
                  Nộp báo cáo nghiệm thu lên Admin
                </Text>
              </TouchableOpacity>
            )}

            {currentProject?.status === 'SUBMITTED_TO_ADMIN' && (
              <View style={styles.submittedToAdminBannerBox}>
                <Ionicons name="hourglass-outline" size={20} color="#D97706" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.submittedToAdminBannerTitle}>Đã Gửi Báo Cáo Nghiệm Thu Lên Admin</Text>
                  <Text style={styles.submittedToAdminBannerSub}>
                    Đang chờ Ban Giám Đốc kiểm tra hồ sơ và phê duyệt nghiệm thu hoàn tất.
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>
        )}
      </View>

      {/* PROJECT SELECTOR DROPDOWN MODAL */}
      <Modal visible={isProjectDropdownVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.dropdownModalOverlay}
          activeOpacity={1}
          onPress={() => setIsProjectDropdownVisible(false)}
        >
          <View style={styles.dropdownModalCard}>
            <View style={styles.dropdownModalHeader}>
              <Text style={styles.dropdownModalTitle}>Chọn dự án</Text>
              <TouchableOpacity onPress={() => setIsProjectDropdownVisible(false)}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 300 }}>
              {displayedProjects.map((p) => {
                const isSelected = p.id === currentProject?.id;
                return (
                  <TouchableOpacity
                    key={p.id}
                    style={[styles.dropdownModalItem, isSelected && styles.dropdownModalItemActive]}
                    onPress={() => {
                      setSelectedProjectId(p.id);
                      setIsProjectDropdownVisible(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.dropdownModalItemText,
                        isSelected && styles.dropdownModalItemTextActive,
                      ]}
                    >
                      {p.projectName || p.levelName}
                    </Text>
                    {isSelected && <Ionicons name="checkmark" size={18} color="#0D9488" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* EXPANDABLE FULL PAGE DETAIL & APPROVAL / SUBMISSION MODAL */}
      <Modal visible={activeSubTask !== null} animationType="slide" transparent={false}>
        <View style={styles.container}>
          <View style={[styles.topSafeArea, { paddingTop: safeTopInset }]}>
            <StatusBar barStyle="light-content" backgroundColor="#0F766E" />

            {/* Top Page Header */}
            <View style={styles.fullPageHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fullPageLevelTag}>
                  {currentProject.levelName} - Việc con #{activeSubTask?.orderNumber}
                </Text>
                <Text style={styles.fullPageTitle}>{activeSubTask?.title}</Text>
              </View>
              <TouchableOpacity onPress={() => setActiveSubTask(null)} style={styles.fullPageCloseBtn}>
                <Text style={styles.fullPageCloseBtnText}>Đóng</Text>
              </TouchableOpacity>
            </View>
          </View>

          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >

            <ScrollView
              style={styles.fullPageBody}
              contentContainerStyle={{ paddingBottom: 150 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              automaticallyAdjustKeyboardInsets={true}
              keyboardDismissMode="interactive"
            >


              {/* ========================================================= */}
              {/* CASE 1: ĐẦU VIỆC DO CHÍNH LEADER THỰC HIỆN                */}
              {/* FORM BÁO CÁO ĐỒNG NHẤT 1:1 VỚI FORM NHÂN VIÊN             */}
              {/* ========================================================= */}
              {activeSubTask?.assignedToUserId === currentLeaderId ? (
                <>
                  {/* Approved Status Banner */}
                  {activeSubTask?.status === 'LEADER_APPROVED' && (
                    <View style={styles.approvedBanner}>
                      <Text style={styles.approvedBannerText}>
                        Leader đã duyệt Vòng 1. Kết quả đang chờ Ban Giám Đốc / Admin xét duyệt nâng cấp bậc tại kỳ họp cuối tháng.
                      </Text>
                      {activeSubTask.leaderFeedback ? (
                        <Text style={styles.approvedFeedbackText}>
                          Ghi chú: "{activeSubTask.leaderFeedback}"
                        </Text>
                      ) : null}
                    </View>
                  )}

                  {/* Rework Alert if any */}
                  {activeSubTask?.leaderFeedback && activeSubTask.status !== 'LEADER_APPROVED' && (
                    <View style={styles.reworkAlertBox}>
                      <Text style={styles.reworkAlertTitle}>Yêu cầu bổ sung / sửa lại trước đó:</Text>
                      <Text style={styles.reworkAlertDesc}>{activeSubTask.leaderFeedback}</Text>
                    </View>
                  )}

                  {/* PHẦN 1: BÁO CÁO THỰC HIỆN */}
                  <View style={styles.sectionBlock}>
                    <Text style={styles.sectionBlockTitle}>1. Báo Cáo Thực Hiện</Text>
                    <Text style={styles.sectionBlockSub}>
                      Nhập tóm tắt kết quả, số liệu đạt được và ghi chú gửi cấp trên
                    </Text>

                    <TextInput
                      style={styles.formTextArea}
                      placeholder="Nhập nội dung báo cáo kết quả thực hiện..."
                      placeholderTextColor="#94A3B8"
                      value={leaderSelfReportText}
                      onChangeText={setLeaderSelfReportText}
                      editable={activeSubTask?.status !== 'LEADER_APPROVED'}
                      multiline
                    />
                  </View>

                  {/* PHẦN 2: KẾT QUẢ & MINH CHỨNG ĐÍNH KÈM */}
                  <View style={styles.sectionBlock}>
                    <Text style={styles.sectionBlockTitle}>2. Kết Quả & Minh Chứng Đính Kèm</Text>
                    <Text style={styles.sectionBlockSub}>
                      Đính kèm link file báo cáo và ảnh chụp thực tế
                    </Text>

                    {/* Link Input */}
                    <Text style={styles.inputLabel}>Link tài liệu / Báo cáo (Google Drive / Sheet):</Text>
                    <TextInput
                      style={styles.formTextInput}
                      placeholder="https://drive.google.com/..."
                      placeholderTextColor="#94A3B8"
                      value={leaderSelfEvidenceUrl}
                      onChangeText={setLeaderSelfEvidenceUrl}
                      editable={activeSubTask?.status !== 'LEADER_APPROVED'}
                      autoCapitalize="none"
                    />

                    {/* Photos Attachment */}
                    <View style={styles.photoSectionHeader}>
                      <Text style={styles.inputLabel}>Ảnh chụp minh chứng thực tế ({leaderSelfImages.length}):</Text>
                      {activeSubTask?.status !== 'LEADER_APPROVED' && (
                        <TouchableOpacity style={styles.addPhotoBtn} onPress={handlePickLeaderImage} activeOpacity={0.8}>
                          <Text style={styles.addPhotoBtnText}>+ Thêm ảnh từ thư viện</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    {leaderSelfImages.length > 0 ? (
                      <View style={styles.imageGrid}>
                        {leaderSelfImages.map((imgUri, idx) => (
                          <View key={idx} style={styles.imageItemWrapper}>
                            <TouchableOpacity onPress={() => setPreviewImage(imgUri)} activeOpacity={0.8}>
                              <Image source={{ uri: imgUri }} style={styles.thumbnailImage} />
                            </TouchableOpacity>
                            {activeSubTask?.status !== 'LEADER_APPROVED' && (
                              <TouchableOpacity
                                style={styles.removePhotoBtn}
                                onPress={() => handleRemoveLeaderImage(idx)}
                              >
                                <Text style={styles.removePhotoBtnText}>Xóa</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        ))}
                      </View>
                    ) : (
                      <Text style={styles.noImagesText}>Chưa có ảnh minh chứng nào được thêm.</Text>
                    )}
                  </View>

                  {/* Submit Action Button */}
                  {activeSubTask?.status !== 'LEADER_APPROVED' && (
                    <View style={styles.submitButtonBox}>
                      <TouchableOpacity
                        style={styles.submitMainBtn}
                        onPress={handleLeaderSubmitReport}
                        activeOpacity={0.85}
                      >
                        <Text style={styles.submitMainBtnText}>
                          {activeSubTask?.status === 'SUBMITTED' ? 'CẬP NHẬT BÁO CÁO & MINH CHỨNG' : 'NỘP BÁO CÁO & MINH CHỨNG'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Tùy chọn chuyển giao cho thành viên khác */}
                  {activeSubTask?.status !== 'LEADER_APPROVED' && (
                    <View style={[styles.sectionBlock, { borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 16 }]}>
                      <Text style={[styles.sectionBlockTitle, { fontSize: 13, color: '#64748B' }]}>
                        Chuyển Giao Việc Cho Thành Viên Khác (Tùy chọn)
                      </Text>
                      <TextInput
                        style={styles.searchInput}
                        placeholder="Tìm tên nhân sự để chuyển giao..."
                        placeholderTextColor="#94A3B8"
                        value={searchMemberQuery}
                        onChangeText={setSearchMemberQuery}
                      />
                      <View style={styles.memberList}>
                        {filteredTeamList
                          .filter((m) => !m.isMe)
                          .map((m) => (
                            <TouchableOpacity
                              key={m.id}
                              style={styles.memberItem}
                              onPress={() => handleConfirmAssign(m)}
                              activeOpacity={0.7}
                            >
                              <View style={{ flex: 1 }}>
                                <Text style={styles.memberName}>{m.name}</Text>
                                <Text style={styles.memberRole}>{m.role}</Text>
                              </View>
                              <Text style={styles.tagBlue}>Giao việc</Text>
                            </TouchableOpacity>
                          ))}
                      </View>
                    </View>
                  )}
                </>
              ) : (
                /* ========================================================= */
                /* CASE 2: ĐẦU VIỆC GIAO CHO NHÂN SỰ / CHƯA PHÂN CÔNG        */
                /* ========================================================= */
                <>
                  {/* PHẦN BÁO CÁO THỰC HIỆN CỦA NHÂN SỰ (Nếu nhân sự đã nộp) */}
                  {(activeSubTask?.status === 'SUBMITTED' || activeSubTask?.status === 'LEADER_APPROVED' || activeSubTask?.submissionNote) && (
                    <View style={styles.sectionBlock}>
                      <Text style={styles.sectionBlockTitle}>1. Báo Cáo Thực Hiện Của Nhân Sự</Text>

                      <View style={styles.reportContentBox}>
                        <Text style={styles.reportAuthor}>
                          Người thực hiện: <Text style={{ fontWeight: 'bold', color: '#0F172A' }}>{activeSubTask?.assignedToUserName || 'Chưa phân công'}</Text>
                        </Text>
                        <Text style={styles.reportText}>
                          {activeSubTask?.submissionNote || 'Đã gửi báo cáo hoàn thành.'}
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* PHẦN KẾT QUẢ & MINH CHỨNG ĐÍNH KÈM */}
                  {(Boolean(activeSubTask?.evidenceUrl) || (Boolean(activeSubTask?.evidenceImages) && (activeSubTask?.evidenceImages?.length ?? 0) > 0)) && (
                    <View style={styles.sectionBlock}>
                      <Text style={styles.sectionBlockTitle}>2. Kết Quả & Minh Chứng Đính Kèm</Text>

                      {/* Link file / Drive nếu có */}
                      {Boolean(activeSubTask?.evidenceUrl) && (
                        <View style={styles.evidenceItemCard}>
                          <Text style={styles.evidenceItemLabel}>Tài liệu / Báo cáo chi tiết:</Text>
                          <Text style={styles.evidenceLinkText} selectable>
                            {activeSubTask?.evidenceUrl}
                          </Text>
                        </View>
                      )}

                      {/* Ảnh chụp minh chứng nếu có */}
                      {Boolean(activeSubTask?.evidenceImages && activeSubTask.evidenceImages.length > 0) && (
                        <View style={styles.evidenceItemCard}>
                          <Text style={styles.evidenceItemLabel}>Ảnh chụp minh chứng thực tế:</Text>
                          <View style={styles.imageGrid}>
                            {activeSubTask?.evidenceImages?.map((imgUri, idx) => (
                              <TouchableOpacity
                                key={idx}
                                onPress={() => setPreviewImage(imgUri)}
                                activeOpacity={0.8}
                              >
                                <Image source={{ uri: imgUri }} style={styles.thumbnailImage} />
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>
                      )}
                    </View>
                  )}

                  {/* Leader Feedback Input & Review Actions */}
                  {activeSubTask?.status === 'SUBMITTED' && (
                    <View style={styles.sectionBlock}>
                      <Text style={styles.sectionBlockTitle}>3. Đánh Giá & Nhận Xét Của Leader (Tùy chọn)</Text>
                      <Text style={styles.sectionBlockSub}>
                        Ghi nhận xét lưu vào hồ sơ hoặc nêu rõ điểm cần hoàn thiện nếu yêu cầu sửa lại
                      </Text>
                      <TextInput
                        style={styles.formTextArea}
                        placeholder="Nhập nhận xét đánh giá hoặc hướng dẫn sửa lại..."
                        placeholderTextColor="#94A3B8"
                        value={leaderFeedbackText}
                        onChangeText={setLeaderFeedbackText}
                        multiline
                      />

                      <View style={styles.reviewActionsBox}>
                        <TouchableOpacity
                          style={styles.approveMainBtn}
                          onPress={() => handleApproveSubTask(activeSubTask.id)}
                          activeOpacity={0.85}
                        >
                          <Text style={styles.approveMainBtnText}>XÁC NHẬN DUYỆT VÒNG 1</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.rejectBtn}
                          onPress={() => handleRejectSubTask(activeSubTask.id)}
                          activeOpacity={0.85}
                        >
                          <Text style={styles.rejectBtnText}>YÊU CẦU BỔ SUNG / SỬA LẠI</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {activeSubTask?.status === 'LEADER_APPROVED' && (
                    <View style={styles.approvedNoticeBanner}>
                      <Text style={styles.approvedNoticeText}>
                        Leader đã hoàn tất duyệt Vòng 1. Kết quả được lưu vào hồ sơ để Ban Giám Đốc / Admin xét duyệt nâng cấp bậc chính thức tại kỳ họp cuối tháng.
                      </Text>
                      {activeSubTask.leaderFeedback ? (
                        <Text style={styles.approvedFeedbackText}>
                          Nhận xét của Leader: "{activeSubTask.leaderFeedback}"
                        </Text>
                      ) : null}
                    </View>
                  )}

                  {/* PHẦN PHÂN CÔNG NHÂN SỰ (Nếu chưa nộp hoặc chưa duyệt) */}
                  {activeSubTask?.status !== 'SUBMITTED' && activeSubTask?.status !== 'LEADER_APPROVED' && (
                    <View style={styles.sectionBlock}>
                      <Text style={styles.sectionBlockTitle}>
                        {activeSubTask?.assignedToUserName ? `Đổi Người Thực Hiện (Hiện tại: ${activeSubTask.assignedToUserName}):` : 'Phân Công Người Thực Hiện:'}
                      </Text>

                      {/* Nút Giao Nhanh Cho Chính Leader */}
                      <TouchableOpacity
                        style={[
                          styles.assignSelfCard,
                          activeSubTask?.assignedToUserId === currentLeaderId && styles.assignSelfCardActive,
                        ]}
                        onPress={() => handleConfirmAssign({ id: currentLeaderId, name: currentLeaderName, rawName: currentLeaderName })}
                        activeOpacity={0.8}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.assignSelfTitle, activeSubTask?.assignedToUserId === currentLeaderId && { color: '#0F766E' }]}>
                            Giao việc này cho chính tôi (Leader)
                          </Text>
                          <Text style={styles.assignSelfDesc}>
                            {activeSubTask?.assignedToUserId === currentLeaderId
                              ? 'Bạn đang trực tiếp phụ trách việc con này'
                              : 'Bấm để tự nhận việc và mở form nộp báo cáo'}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.assignSelfBadge,
                            activeSubTask?.assignedToUserId === currentLeaderId && styles.assignSelfBadgeActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.assignSelfBadgeText,
                              activeSubTask?.assignedToUserId === currentLeaderId && styles.assignSelfBadgeTextActive,
                            ]}
                          >
                            {activeSubTask?.assignedToUserId === currentLeaderId ? 'ĐÃ CHỌN' : 'TỰ NHẬN'}
                          </Text>
                        </View>
                      </TouchableOpacity>

                      <Text style={styles.orDividerText}>— HOẶC CHỌN THÀNH VIÊN TRONG TEAM —</Text>

                      {activeSubTask?.leaderFeedback ? (
                        <View style={styles.reworkAlertBox}>
                          <Text style={styles.reworkAlertTitle}>Yêu cầu sửa lại trước đó:</Text>
                          <Text style={styles.reworkAlertDesc}>{activeSubTask.leaderFeedback}</Text>
                        </View>
                      ) : null}

                      <TextInput
                        style={styles.searchInput}
                        placeholder="Tìm tên nhân sự..."
                        placeholderTextColor="#94A3B8"
                        value={searchMemberQuery}
                        onChangeText={setSearchMemberQuery}
                      />

                      <View style={styles.memberList}>
                        {filteredTeamList.map((m) => {
                          const isCurrent = activeSubTask?.assignedToUserId === m.id;
                          return (
                            <TouchableOpacity
                              key={m.id}
                              style={[
                                styles.memberItem,
                                isCurrent && styles.memberItemActive,
                                m.isMe && styles.memberItemSelf,
                              ]}
                              onPress={() => handleConfirmAssign(m)}
                              activeOpacity={0.7}
                            >
                              <View style={{ flex: 1 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                  <Text
                                    style={[
                                      styles.memberName,
                                      isCurrent && { color: '#0F766E', fontWeight: 'bold' },
                                      m.isMe && { fontWeight: 'bold' },
                                    ]}
                                  >
                                    {m.name}
                                  </Text>
                                  {m.isMe && (
                                    <View style={styles.selfTagBadge}>
                                      <Text style={styles.selfTagBadgeText}>Chính tôi</Text>
                                    </View>
                                  )}
                                </View>
                                <Text style={styles.memberRole}>{m.role}</Text>
                              </View>
                              {isCurrent ? (
                                <Text style={styles.selectedAssigneeText}>Đã chọn</Text>
                              ) : null}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  )}
                </>
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* FULL IMAGE PREVIEW MODAL */}
      <Modal visible={previewImage !== null} animationType="fade" transparent>
        <View style={styles.previewOverlay}>
          <TouchableOpacity onPress={() => setPreviewImage(null)} style={styles.previewCloseBtn}>
            <Text style={styles.previewCloseBtnText}>Đóng xem ảnh</Text>
          </TouchableOpacity>
          {previewImage ? (
            <Image source={{ uri: previewImage }} style={styles.fullPreviewImage} resizeMode="contain" />
          ) : null}
        </View>
      </Modal>

      {/* FULL PAGE SUBMIT ADMIN MODAL (MATCHING IMAGE 2 TEMPLATE) */}
      <Modal visible={submitAdminModalVisible} animationType="slide" transparent={false}>
        <View style={styles.container}>
          <StatusBar barStyle="light-content" backgroundColor="#102739" />
          <View style={[styles.topSafeArea, { paddingTop: safeTopInset }]}>
            {/* Header matching Image 2 */}
            <View style={styles.templateModalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.templateModalHeaderSub}>Nghiệm thu toàn diện</Text>
                <Text style={styles.templateModalHeaderTitle}>Báo cáo nghiệm thu lên Admin</Text>
              </View>
              <TouchableOpacity
                onPress={() => setSubmitAdminModalVisible(false)}
                style={styles.templateModalCloseBtn}
                activeOpacity={0.7}
              >
                <Text style={styles.templateModalCloseBtnText}>Đóng</Text>
              </TouchableOpacity>
            </View>
          </View>

          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <ScrollView
              style={{ flex: 1, backgroundColor: '#F8FAFC' }}
              contentContainerStyle={{ padding: 16, paddingBottom: 160 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Card 1: Dự án Summary matching Image 2 */}
              <View style={styles.templateModalCard}>
                <Text style={styles.templateModalFieldLabel}>Dự án</Text>
                <Text style={styles.templateModalProjectName}>
                  {currentProject?.projectName || (leaderDeptName ? `Dự án ${leaderDeptName}` : currentProject?.levelName)}
                </Text>

                <View style={styles.templateModalKpiRow}>
                  {/* Left Col: Đã duyệt vòng 1 */}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.templateModalKpiLabel}>Đã duyệt vòng 1</Text>
                    <Text style={styles.templateModalKpiBigNum}>
                      {approvedSubTasks}/{totalSubTasks}
                    </Text>
                    <Text style={styles.templateModalKpiSub}>
                      {'việc con • ' + progressPercent + '%'}
                    </Text>
                  </View>

                  <View style={styles.templateColDivider} />

                  {/* Right Col: Thưởng thăng cấp dự kiến */}
                  <View style={{ flex: 1, paddingLeft: 16 }}>
                    <Text style={styles.templateModalKpiLabel}>Thưởng thăng cấp dự kiến</Text>
                    <Text style={styles.templateModalKpiRewardAmount}>
                      {totalCashPool > 0
                        ? totalCashPool.toLocaleString('vi-VN') + ' VNĐ'
                        : (currentProject as any)?.promotionBonusAmount > 0
                        ? Number((currentProject as any).promotionBonusAmount).toLocaleString('vi-VN') + ' VNĐ'
                        : physicalItemList.length > 0
                        ? physicalItemList.join(', ')
                        : '1.000.000 VNĐ'}
                    </Text>
                    <Text style={styles.templateModalKpiSub}>Chia theo hệ số Level</Text>
                  </View>
                </View>

                {/* Progress bar */}
                <View style={styles.templateModalProgressRow}>
                  <View style={styles.templateModalProgressTrack}>
                    <View
                      style={[
                        styles.templateModalProgressFill,
                        { width: `${Math.min(100, Math.max(0, progressPercent))}%` as any },
                      ]}
                    />
                  </View>
                  <Text style={styles.templateModalProgressPercentText}>
                    {progressPercent + '%'}
                  </Text>
                </View>
              </View>

              {/* Card 2: Việc con trong dự án matching Image 2 */}
              <View style={styles.templateModalCard}>
                <Text style={styles.templateModalCardTitle}>Việc con trong dự án</Text>
                <View style={{ marginTop: 10, gap: 8 }}>
                  {subTasks.map((st) => {
                    const isApproved = st.status === 'LEADER_APPROVED';
                    const isSubmitted = st.status === 'SUBMITTED';
                    const isAssigned = st.status === 'ASSIGNED';

                    return (
                      <View key={st.id} style={styles.templateModalSubTaskRow}>
                        <View style={styles.templateModalSubTaskBadge}>
                          <Text style={styles.templateModalSubTaskBadgeText}>
                            #{st.orderNumber}
                          </Text>
                        </View>

                        <View style={{ flex: 1, marginHorizontal: 10 }}>
                          <Text style={styles.templateModalSubTaskTitle} numberOfLines={1}>
                            {st.title}
                          </Text>
                          <Text style={styles.templateModalSubTaskAssignee}>
                            {st.assignedToUserName || 'Chưa phân công'}
                          </Text>
                        </View>

                        <View
                          style={[
                            styles.templateStatusPill,
                            isApproved
                              ? styles.tplStatusPillApproved
                              : isSubmitted
                              ? styles.tplStatusPillSubmitted
                              : isAssigned
                              ? styles.tplStatusPillAssigned
                              : styles.tplStatusPillUnassigned,
                          ]}
                        >
                          <Text
                            style={[
                              styles.templateStatusPillText,
                              isApproved
                                ? styles.tplStatusTextApproved
                                : isSubmitted
                                ? styles.tplStatusTextSubmitted
                                : isAssigned
                                ? styles.tplStatusTextAssigned
                                : styles.tplStatusTextUnassigned,
                            ]}
                          >
                            {isApproved
                              ? 'Đã duyệt V1'
                              : isSubmitted
                              ? 'Chờ duyệt V1'
                              : isAssigned
                              ? 'Đang làm'
                              : 'Chưa giao'}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* Card 3: Báo cáo nghiệm thu & đánh giá matching Image 2 */}
              <View style={styles.templateModalCard}>
                <Text style={styles.templateModalCardTitle}>Báo cáo nghiệm thu & đánh giá</Text>
                <Text style={styles.templateModalCardSub}>
                  Nhận xét kết quả, chất lượng thực hiện và đề xuất thăng cấp cho nhân sự.
                </Text>
                <TextInput
                  style={styles.templateModalTextArea}
                  placeholder="Nhập nội dung báo cáo gửi Ban Giám Đốc..."
                  placeholderTextColor="#94A3B8"
                  value={adminReportText}
                  onChangeText={setAdminReportText}
                  multiline
                />
              </View>

              {/* Card 4: Link báo cáo & số liệu tổng hợp matching Image 2 */}
              <View style={styles.templateModalCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={styles.templateModalCardTitle}>Link báo cáo & số liệu tổng hợp</Text>
                  <View style={styles.templateOptionalPill}>
                    <Text style={styles.templateOptionalText}>Tùy chọn</Text>
                  </View>
                </View>
                <Text style={styles.templateModalCardSub}>
                  Đính kèm link Google Drive, Dashboard hoặc file báo cáo.
                </Text>
                <TextInput
                  style={styles.templateModalInput}
                  placeholder="https://drive.google.com/..."
                  placeholderTextColor="#94A3B8"
                  value={adminReportUrl}
                  onChangeText={setAdminReportUrl}
                  autoCapitalize="none"
                />
              </View>

              {/* Bottom Submit Button matching Image Template */}
              <TouchableOpacity
                style={styles.templateModalSubmitBtn}
                onPress={handleSubmitProjectToAdmin}
                activeOpacity={0.85}
              >
                <Text style={styles.templateModalSubmitBtnText}>
                  Xác nhận gửi Ban Giám Đốc
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#102739',
  },
  topSafeArea: {
    backgroundColor: '#102739',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#102739',
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginLeft: -4,
  },
  headerTitleWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#94B5CB',
    marginTop: 2,
  },
  bodyWrapper: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -10,
    paddingTop: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    marginBottom: 16,
  },
  sectionHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#18181B',
  },
  sectionHeaderPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
  },
  sectionHeaderPillText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#18181B',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  emptyIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E7F0F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#18181B',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 13.5,
    color: '#64748B',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 290,
  },
  headerSubmitBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  headerSubmitBtnDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  headerSubmitBtnText: {
    color: '#102739',
    fontSize: 13,
    fontWeight: 'bold',
  },
  headerSubmitBtnTextDisabled: {
    color: '#94A3B8',
  },
  levelSelectorContainer: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  levelSelectorScroll: {
    paddingHorizontal: 18,
    gap: 8,
  },
  levelItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  levelItemActive: {
    backgroundColor: '#0F172A',
  },
  levelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  levelTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  scroll: {
    paddingHorizontal: 18,
    paddingBottom: 36,
  },
  projectSummary: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 10,
  },
  projectName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 8,
    lineHeight: 22,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#059669',
    borderRadius: 3,
  },
  progressLabel: {
    fontSize: 13,
    color: '#059669',
    fontWeight: '600',
  },
  rewardSummaryCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginTop: 12,
  },
  rewardSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  rewardSummaryTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
  },
  rewardCashRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6,
  },
  rewardBadgeMoney: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#059669',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  rewardCashValText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#059669',
  },
  rewardCashSubText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  rewardPhysicalRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6,
  },
  rewardBadgeGift: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#D97706',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  rewardPhysicalValText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  rewardPhysicalSubText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  rewardNoneText: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
  },
  multiplierBox: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 8,
  },
  multiplierToggleBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  multiplierToggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E40AF',
  },
  breakdownTable: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  breakdownGuideText: {
    fontSize: 11,
    color: '#1E40AF',
    backgroundColor: '#EFF6FF',
    padding: 8,
    borderRadius: 6,
    marginBottom: 10,
    lineHeight: 16,
  },
  noParticipantsText: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
    paddingVertical: 6,
  },
  memberShareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  memberShareName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  memberLevelBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  memberLevelBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  memberShareMeta: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  memberShareAmount: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#059669',
  },
  memberShareStatus: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 1,
  },
  breakdownFooterNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  breakdownFooterNoticeText: {
    fontSize: 10.5,
    color: '#059669',
    fontWeight: '500',
  },
  acceptBtn: {
    backgroundColor: '#2563EB',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  acceptBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  listContainer: {
    marginTop: 4,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  taskRowSubmitted: {
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 8,
    borderRadius: 8,
    marginVertical: 1,
    borderBottomWidth: 0,
  },
  indexCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  indexText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  titleCol: {
    flex: 1,
    marginRight: 10,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    lineHeight: 20,
  },
  taskTitleDone: {
    color: '#64748B',
  },
  assigneeText: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
  },
  statusCol: {
    alignItems: 'flex-end',
  },
  tagGreen: {
    fontSize: 13,
    color: '#059669',
    fontWeight: 'bold',
  },
  tagBlue: {
    fontSize: 13,
    color: '#2563EB',
    fontWeight: '600',
  },
  tagGray: {
    fontSize: 13,
    color: '#2563EB',
    fontWeight: 'bold',
  },
  btnAmber: {
    backgroundColor: '#D97706',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  btnAmberText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  fullPageContainer: {
    flex: 1,
    backgroundColor: '#0F766E',
  },
  fullPageHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: '#0F766E',
  },
  fullPageLevelTag: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#99F6E4',
    marginBottom: 2,
  },
  fullPageTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#FFFFFF',
    lineHeight: 23,
  },
  fullPageCloseBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginLeft: 10,
  },
  fullPageCloseBtnText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  fullPageBody: {
    flex: 1,
    padding: 18,
    backgroundColor: '#FFFFFF',
  },
  kpiCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  kpiCardLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  kpiCardValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A',
    marginTop: 2,
  },
  kpiCardDesc: {
    fontSize: 13,
    color: '#475569',
    marginTop: 6,
    lineHeight: 18,
  },
  sectionBlock: {
    marginBottom: 20,
  },
  sectionBlockTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 10,
  },
  reportContentBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  reportAuthor: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 8,
  },
  reportText: {
    fontSize: 14,
    color: '#0F172A',
    lineHeight: 20,
  },
  evidenceItemCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  evidenceItemLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  evidenceLinkText: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '500',
  },
  evidenceEmptyText: {
    fontSize: 13,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  thumbnailImage: {
    width: 90,
    height: 90,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
  },
  actionFooter: {
    marginVertical: 14,
  },
  approveMainBtn: {
    backgroundColor: '#059669',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  approveMainBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  approvedNoticeBanner: {
    backgroundColor: '#ECFDF5',
    padding: 14,
    borderRadius: 10,
    marginVertical: 10,
  },
  approvedNoticeText: {
    fontSize: 14,
    color: '#065F46',
    fontWeight: '600',
    lineHeight: 20,
  },
  searchInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#0F172A',
    marginBottom: 10,
  },
  memberList: {
    borderWidth: 1,
    borderColor: '#F1F5F9',
    borderRadius: 8,
  },
  memberItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  memberItemActive: {
    backgroundColor: '#EFF6FF',
  },
  memberName: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '500',
  },
  memberRole: {
    fontSize: 12,
    color: '#64748B',
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
  sectionBlockSub: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 8,
    lineHeight: 18,
  },
  formTextArea: {
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
  formInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#0F172A',
  },
  summarySubTaskList: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 4,
  },
  summarySubTaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  summarySubTaskNum: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    minWidth: 24,
  },
  summarySubTaskTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  summarySubTaskAssignee: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  summarySubTaskStatus: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
  },
  levelBadge: {
    marginLeft: 6,
    backgroundColor: '#DC2626',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    minWidth: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelBadgeActive: {
    backgroundColor: '#FFFFFF',
  },
  levelBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  levelBadgeTextActive: {
    color: '#0F172A',
  },
  filterSection: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 8,
  },
  filterScroll: {
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  filterChipActive: {
    backgroundColor: '#0F172A',
  },
  filterChipPendingAlert: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  emptyFilterBox: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyFilterText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
  },
  assigneeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  submittedHintText: {
    fontSize: 12,
    color: '#B45309',
    fontWeight: '600',
  },
  evidenceHintTag: {
    fontSize: 11,
    color: '#2563EB',
    fontWeight: '600',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  reviewActionsBox: {
    marginTop: 14,
    gap: 10,
  },
  rejectBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#D97706',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  rejectBtnText: {
    color: '#D97706',
    fontSize: 14,
    fontWeight: 'bold',
  },
  approvedFeedbackText: {
    fontSize: 13,
    color: '#065F46',
    marginTop: 6,
    fontStyle: 'italic',
  },
  reworkAlertBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  reworkAlertTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#B91C1C',
    marginBottom: 2,
  },
  reworkAlertDesc: {
    fontSize: 13,
    color: '#7F1D1D',
  },
  assignSelfCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0FDFA',
    borderWidth: 1.5,
    borderColor: '#99F6E4',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  assignSelfCardActive: {
    backgroundColor: '#CCFBF1',
    borderColor: '#0F766E',
  },
  assignSelfTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#134E4A',
  },
  assignSelfDesc: {
    fontSize: 12,
    color: '#0F766E',
    marginTop: 2,
  },
  assignSelfBadge: {
    backgroundColor: '#0F766E',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    marginLeft: 10,
  },
  assignSelfBadgeActive: {
    backgroundColor: '#042F2E',
  },
  assignSelfBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  assignSelfBadgeTextActive: {
    color: '#99F6E4',
  },
  orDividerText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#94A3B8',
    textAlign: 'center',
    marginVertical: 10,
    letterSpacing: 0.5,
  },
  memberItemSelf: {
    backgroundColor: '#F0FDFA',
    borderColor: '#CCFBF1',
  },
  selfTagBadge: {
    backgroundColor: '#0F766E',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  selfTagBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  selectedAssigneeText: {
    fontSize: 12,
    color: '#0F766E',
    fontWeight: 'bold',
  },
  assigneeTextMe: {
    color: '#0F766E',
    fontWeight: 'bold',
  },
  selfMiniBadge: {
    backgroundColor: '#CCFBF1',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  selfMiniBadgeText: {
    fontSize: 10,
    color: '#0F766E',
    fontWeight: 'bold',
  },

  /* Access Requests Section Styles */
  accessRequestSection: {
    backgroundColor: '#FFFBEB',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 16,
  },
  accessRequestHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  accessRequestIconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accessRequestHeaderTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#92400E',
  },
  accessRequestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 8,
  },
  accessRequestCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  accessRequestUserName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  accessRequestUserMeta: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },
  accessRequestTimeText: {
    fontSize: 10.5,
    color: '#94A3B8',
  },
  accessRequestReasonBox: {
    backgroundColor: '#FEF3C7',
    borderRadius: 6,
    padding: 8,
    marginTop: 8,
  },
  accessRequestReasonLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 1,
  },
  accessRequestReasonText: {
    fontSize: 12,
    color: '#78350F',
    fontStyle: 'italic',
  },
  accessRequestActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 10,
  },
  accessRequestRejectBtn: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  accessRequestRejectBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
  accessRequestApproveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F766E',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  accessRequestApproveBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* Form & Submission Styles matching Employee screen */
  approvedBanner: {
    backgroundColor: '#ECFDF5',
    padding: 14,
    borderRadius: 10,
    marginBottom: 16,
  },
  approvedBannerText: {
    fontSize: 14,
    color: '#065F46',
    fontWeight: '600',
    lineHeight: 20,
  },
  inputLabel: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
    marginBottom: 6,
  },
  formTextInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: '#0F172A',
    marginBottom: 14,
  },
  photoSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addPhotoBtn: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  addPhotoBtnText: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: 'bold',
  },
  imageItemWrapper: {
    position: 'relative',
  },
  removePhotoBtn: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  removePhotoBtnText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  noImagesText: {
    fontSize: 13,
    color: '#94A3B8',
    fontStyle: 'italic',
    marginTop: 4,
  },
  submitButtonBox: {
    marginVertical: 16,
    paddingBottom: 20,
  },
  submitMainBtn: {
    backgroundColor: '#059669',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitMainBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },

  /* Section Tabs Styles */
  sectionTabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  sectionTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    gap: 6,
  },
  sectionTabBtnActive: {
    backgroundColor: '#CCFBF1',
    borderWidth: 1,
    borderColor: '#0D9488',
  },
  sectionTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  sectionTabTextActive: {
    color: '#0F766E',
    fontWeight: '700',
  },
  sectionTabDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#059669',
  },

  /* Empty History Box */
  emptyHistoryBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#F8FAFC',
  },
  emptyHistoryTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 14,
    textAlign: 'center',
  },
  emptyHistorySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },

  /* Admin Approved Celebration Card */
  adminApprovedCard: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 6,
  },
  adminApprovedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  adminApprovedIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminApprovedBadgeTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#065F46',
    letterSpacing: 0.5,
  },
  adminApprovedSubTitle: {
    fontSize: 12,
    color: '#047857',
    marginTop: 2,
  },
  adminApprovedDateText: {
    fontSize: 11,
    color: '#059669',
    marginTop: 3,
    fontWeight: '600',
  },
  adminFeedbackBox: {
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 3,
    borderLeftColor: '#059669',
    padding: 10,
    borderRadius: 6,
    marginTop: 10,
  },
  adminFeedbackLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065F46',
    marginBottom: 3,
  },
  adminFeedbackText: {
    fontSize: 13,
    color: '#1E293B',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  leaderReportNoteBox: {
    backgroundColor: '#F0FDF4',
    borderLeftWidth: 3,
    borderLeftColor: '#10B981',
    padding: 10,
    borderRadius: 6,
    marginTop: 8,
  },
  leaderReportNoteLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047857',
    marginBottom: 3,
  },
  leaderReportNoteText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
  },

  /* Submit to Admin Action Box */
  leaderSubmitAdminActionBox: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#FDE68A',
  },
  allTasksReadyNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 8,
  },
  allTasksReadyText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065F46',
    flex: 1,
  },
  tasksNotReadyNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  tasksNotReadyText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
    flex: 1,
  },
  submitProjectToAdminMainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F766E',
    paddingVertical: 12,
    borderRadius: 10,
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  submitProjectToAdminMainBtnHighlight: {
    backgroundColor: '#059669',
    shadowColor: '#059669',
  },
  submitProjectToAdminMainBtnPending: {
    backgroundColor: '#64748B',
    shadowColor: '#64748B',
  },
  submitProjectToAdminMainBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  modalWarningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  modalWarningText: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '600',
    flex: 1,
    lineHeight: 18,
  },
  approveMainBtnDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0,
    elevation: 0,
  },
  approveMainBtnTextDisabled: {
    color: '#E2E8F0',
  },
  submittedToAdminBannerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 10,
    padding: 12,
    marginTop: 14,
    gap: 10,
  },
  submittedToAdminBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
  },
  submittedToAdminBannerSub: {
    fontSize: 11,
    color: '#B45309',
    marginTop: 2,
    lineHeight: 16,
  },

  /* TEMPLATE MATCHING IMAGE 1 & IMAGE 2 STYLES */
  templateHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  templateHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  templateHeaderPill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  templateHeaderPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E40AF',
  },
  templateSectionTabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 16,
  },
  templateSectionTabItem: {
    paddingVertical: 10,
    marginRight: 24,
    position: 'relative',
  },
  templateSectionTabItemActive: {},
  templateSectionTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  templateSectionTabTextActive: {
    color: '#0F172A',
    fontWeight: '800',
  },
  templateSectionTabUnderline: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#1E40AF',
    borderRadius: 2,
  },
  templateProjectDropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: 14,
  },
  templateProjectDropdownText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  templateScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  templateCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  templateCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  templateCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  templateTwoColsRow: {
    flexDirection: 'row',
    marginTop: 12,
    alignItems: 'flex-start',
  },
  templateColItem: {
    flex: 1,
  },
  templateColDivider: {
    width: 1,
    backgroundColor: '#E2E8F0',
    alignSelf: 'stretch',
    marginHorizontal: 4,
  },
  templateColLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  templateColAmount: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F766E',
  },
  templateColUnit: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F766E',
  },
  templateColSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  templateCardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginTop: 14,
    marginBottom: 10,
  },
  templateFooterNote: {
    fontSize: 12,
    color: '#64748B',
  },
  templateMemberBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  templateMemberBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },
  templateTaskBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  templateTaskBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  templateEmptyNote: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginVertical: 14,
  },
  templateMemberRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingVertical: 10,
  },
  templateAvatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  templateAvatarText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E40AF',
  },
  templateMemberName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  templateMemberSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  templateMemberShareBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  templateMemberTaskInfo: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  templateMemberShareAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F766E',
  },
  templateMemberShareSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  templateFormulaText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 12,
    lineHeight: 18,
  },
  templateNoticeBox: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 10,
  },
  templateNoticeText: {
    fontSize: 12,
    color: '#1E40AF',
    fontWeight: '600',
  },
  templateSubtaskTabsScroll: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    marginTop: 10,
  },
  templateSubtaskTabItem: {
    paddingVertical: 8,
    marginRight: 16,
    position: 'relative',
  },
  templateSubtaskTabItemActive: {},
  templateSubtaskTabText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  templateSubtaskTabTextActive: {
    color: '#0F172A',
    fontWeight: '800',
  },
  templateSubtaskTabUnderline: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    height: 2.5,
    backgroundColor: '#1E40AF',
    borderRadius: 2,
  },
  templateSubtaskRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#FFFFFF',
  },
  templateSubtaskOrderCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  templateSubtaskOrderText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0284C7',
  },
  templateSubtaskTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  templateSubtaskAssignee: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  templateStatusPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  templateStatusPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  tplStatusPillApproved: {
    backgroundColor: '#ECFDF5',
  },
  tplStatusTextApproved: {
    color: '#059669',
  },
  tplStatusPillSubmitted: {
    backgroundColor: '#FEF3C7',
  },
  tplStatusTextSubmitted: {
    color: '#D97706',
  },
  tplStatusPillAssigned: {
    backgroundColor: '#EFF6FF',
  },
  tplStatusTextAssigned: {
    color: '#2563EB',
  },
  tplStatusPillUnassigned: {
    backgroundColor: '#F1F5F9',
  },
  tplStatusTextUnassigned: {
    color: '#64748B',
  },
  templateTopSubmitBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  templateTopSubmitBtnText: {
    color: '#102739',
    fontSize: 13,
    fontWeight: '700',
  },
  templateBottomSubmitBtn: {
    backgroundColor: '#102739',
    height: 50,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 14,
    shadowColor: '#102739',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  templateBottomSubmitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },

  /* MODAL TEMPLATE MATCHING IMAGE 2 */
  templateModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#102739',
  },
  templateModalHeaderSub: {
    fontSize: 12,
    color: '#94B5CB',
  },
  templateModalHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  templateModalCloseBtn: {
    backgroundColor: '#243A4C',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },
  templateModalCloseBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  templateModalCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },
  templateModalFieldLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  templateModalProjectName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
    marginBottom: 14,
  },
  templateModalKpiRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  templateModalKpiLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  templateModalKpiBigNum: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
  },
  templateModalKpiRewardAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  templateModalKpiSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  templateModalProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  templateModalProgressTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  templateModalProgressFill: {
    height: 8,
    backgroundColor: '#2563EB',
    borderRadius: 4,
  },
  templateModalProgressPercentText: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 10,
    fontWeight: '600',
  },
  templateModalCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  templateModalCardSub: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    marginBottom: 12,
  },
  templateModalSubTaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#FFFFFF',
  },
  templateModalSubTaskBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  templateModalSubTaskBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  templateModalSubTaskTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  templateModalSubTaskAssignee: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  templateModalTextArea: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 12,
    minHeight: 110,
    textAlignVertical: 'top',
    fontSize: 14,
    color: '#0F172A',
  },
  templateOptionalPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  templateOptionalText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  templateModalInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 46,
    fontSize: 14,
    color: '#0F172A',
  },
  templateModalSubmitBtn: {
    backgroundColor: '#102739',
    height: 50,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 24,
  },
  templateModalSubmitBtnDisabled: {
    backgroundColor: '#64748B',
    opacity: 0.8,
  },
  templateModalSubmitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  templateModalSubmitBtnTextDisabled: {
    color: '#CBD5E1',
  },

  /* DROPDOWN PICKER MODAL */
  dropdownModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dropdownModalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  dropdownModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 8,
  },
  dropdownModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  dropdownModalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
    borderRadius: 8,
  },
  dropdownModalItemActive: {
    backgroundColor: '#F0FDFA',
  },
  dropdownModalItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    flex: 1,
  },
  dropdownModalItemTextActive: {
    color: '#0D9488',
    fontWeight: '800',
  },
});
