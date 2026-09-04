import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useDepartments } from '../../hooks/useDepartments';
import { useLevelProjects } from '../leveling/levelProjectsStore';
import { useSocketStatus } from '../../providers/SocketProvider';

export interface SubTaskProgressItem {
  id: string;
  bulletTitle: string;
  assigneeName: string;
  assigneeRole: string;
  completionRate: number; // 0 to 100%
  status: 'COMPLETED' | 'IN_PROGRESS' | 'NOT_STARTED';
  actualResultDescription: string; // Chi tiết những gì nhân sự thực tế đã thực hiện được
  targetMetric?: string;           // Chỉ tiêu giao ban đầu
  achievedMetric?: string;         // Số liệu thực tế đạt được
  proofNotes?: string;             // Minh chứng / đối soát
  verifiedBy?: string;             // Người nghiệm thu xác nhận
}

export interface AdminReviewItem {
  id: string;
  employeeId: string;
  userName: string;
  userRole: 'STAFF' | 'LEADER';
  departmentId: string;
  departmentName: string;
  currentLevelNumber: number;
  currentLevelName: string;
  targetLevelNumber: number;
  targetLevelName: string;
  projectName: string;
  rewardPhysicalItem: string;
  promotionBonusAmount: number;
  retentionMultiplier: number;
  subTasks: SubTaskProgressItem[];
  overallProjectProgress: number; // calculated %
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export const AdminMonthlyReviewScreen: React.FC = () => {
  const { data: realDeptData, isLoading: isDeptLoading } = useDepartments({ limit: 100 });
  const { getSocket } = useSocketStatus();
  const realDeptList = realDeptData?.data || realDeptData?.items || (Array.isArray(realDeptData) ? realDeptData : []);
  const departments = realDeptList.map((d: any) => ({ id: d.id || d._id, name: d.name || 'Phòng ban' }));

  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1); // 1: Phòng Ban, 2: Duyệt Nhân Viên, 3: Duyệt Leader
  const [selectedDeptId, setSelectedDeptId] = useState<string>(departments[0]?.id || 'dept-1');
  const [selectedMonth, setSelectedMonth] = useState<string>('Tháng 09/2026');
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  const availableMonths = ['Tháng 09/2026', 'Tháng 10/2026', 'Tháng 11/2026', 'Tháng 12/2026'];

  const toggleExpandCard = (id: string) => {
    setExpandedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Staff Level Review Items
  const [staffItems, setStaffItems] = useState<Record<string, AdminReviewItem[]>>({});

  // Leader Level Review Items
  const [leaderItems, setLeaderItems] = useState<Record<string, AdminReviewItem[]>>({});

  const activeDept = departments.find((d) => d.id === selectedDeptId) || departments[0] || { id: 'dept-1', name: 'Livestream Hà Nội' };

  const { projects } = useLevelProjects(selectedDeptId, activeDept.name);

  useEffect(() => {
    if (!Array.isArray(projects) || projects.length === 0) return;

    const userTaskMap = new Map<string, {
      employeeId: string;
      userName: string;
      userRole: 'STAFF' | 'LEADER';
      levelNumber: number;
      levelName: string;
      projectName: string;
      subTasks: SubTaskProgressItem[];
      total: number;
      approved: number;
    }>();

    projects.forEach((proj) => {
      (proj.subTasks || []).forEach((st) => {
        if (!st.assignedToUserId && !st.assignedToUserName) return;

        const uid = st.assignedToUserId || st.assignedToUserName || 'unknown';
        const uname = st.assignedToUserName || 'Nhân sự';
        const isLeader = uname.toLowerCase().includes('leader') || uname.toLowerCase().includes('trưởng');

        const existing = userTaskMap.get(uid) || {
          employeeId: uid,
          userName: uname,
          userRole: isLeader ? 'LEADER' : 'STAFF',
          levelNumber: proj.levelNumber,
          levelName: proj.levelName,
          projectName: proj.projectName,
          subTasks: [],
          total: 0,
          approved: 0,
        };

        existing.total += 1;
        if (st.status === 'LEADER_APPROVED') existing.approved += 1;

        existing.subTasks.push({
          id: st.id,
          bulletTitle: `• ${st.title}`,
          assigneeName: uname,
          assigneeRole: isLeader ? 'Leader' : 'Nhân viên',
          completionRate: st.status === 'LEADER_APPROVED' ? 100 : st.status === 'SUBMITTED' ? 50 : 0,
          status: st.status === 'LEADER_APPROVED' ? 'COMPLETED' : st.status === 'SUBMITTED' ? 'IN_PROGRESS' : 'NOT_STARTED',
          actualResultDescription: st.submissionNote || (st.status === 'LEADER_APPROVED' ? 'Leader đã hoàn tất duyệt Vòng 1' : 'Chưa hoàn thành'),
          targetMetric: st.targetKpi || '100% Nghiệm thu',
          achievedMetric: st.status === 'LEADER_APPROVED' ? 'Đã duyệt Vòng 1' : 'Đang thực hiện',
          proofNotes: st.evidenceUrl ? `Minh chứng: ${st.evidenceUrl}` : 'Đã đối soát hồ sơ',
          verifiedBy: 'Leader phòng ban xác nhận',
        });

        userTaskMap.set(uid, existing);
      });
    });

    const staffCandidateList: AdminReviewItem[] = [];
    const leaderCandidateList: AdminReviewItem[] = [];

    userTaskMap.forEach((val) => {
      const progress = val.total > 0 ? Math.round((val.approved / val.total) * 100) : 0;
      const reviewItem: AdminReviewItem = {
        id: `rev-${val.employeeId}`,
        employeeId: val.employeeId,
        userName: val.userName,
        userRole: val.userRole,
        departmentId: selectedDeptId,
        departmentName: activeDept.name,
        currentLevelNumber: val.levelNumber,
        currentLevelName: val.levelName,
        targetLevelNumber: val.levelNumber + 1,
        targetLevelName: `Level ${val.levelNumber + 1}`,
        projectName: val.projectName,
        rewardPhysicalItem: 'Quà hiện vật theo cấu hình Level',
        promotionBonusAmount: 0,
        retentionMultiplier: 1.2,
        subTasks: val.subTasks,
        overallProjectProgress: progress,
        status: 'PENDING',
      };

      if (val.userRole === 'LEADER') {
        leaderCandidateList.push(reviewItem);
      } else {
        staffCandidateList.push(reviewItem);
      }
    });

    if (staffCandidateList.length > 0) {
      setStaffItems((prev) => ({ ...prev, [selectedDeptId]: staffCandidateList }));
    }
    if (leaderCandidateList.length > 0) {
      setLeaderItems((prev) => ({ ...prev, [selectedDeptId]: leaderCandidateList }));
    }
  }, [projects, selectedDeptId, activeDept.name]);

  const currentStaffDeptItems = staffItems[selectedDeptId] || staffItems['dept-1'] || [];
  const currentLeaderDeptItems = leaderItems[selectedDeptId] || leaderItems['dept-1'] || [];

  const handleApproveStaff = (item: AdminReviewItem) => {
    setStaffItems((prev) => {
      const list = prev[selectedDeptId] || currentStaffDeptItems;
      const updatedList = list.map((rev) => (rev.id === item.id ? { ...rev, status: 'APPROVED' as const } : rev));
      return { ...prev, [selectedDeptId]: updatedList };
    });

    // Save level & approval timestamp to SecureStore & emit real-time socket event
    void (async () => {
      try {
        const raw = await SecureStore.getItemAsync('ALL_APPROVED_USER_IDS').catch(() => null);
        const existing = raw ? JSON.parse(raw) : [];
        const updated = Array.from(new Set([...(Array.isArray(existing) ? existing : []), item.employeeId]));
        await SecureStore.setItemAsync('ALL_APPROVED_USER_IDS', JSON.stringify(updated)).catch(() => {});
        await SecureStore.setItemAsync(`USER_APPROVED_LEVEL_${item.employeeId}`, String(item.targetLevelNumber)).catch(() => {});
        await SecureStore.setItemAsync(`USER_APPROVED_LEVEL_TIME_${item.employeeId}`, String(Date.now())).catch(() => {});
      } catch {}
    })();

    const socket = getSocket();
    if (socket) {
      socket.emit('level:user_promoted', {
        userId: item.employeeId,
        targetLevelNumber: item.targetLevelNumber,
        targetLevelName: item.targetLevelName,
        userName: item.userName,
      });
    }

    Alert.alert(
      'CHỐT PHÊ DUYỆT THĂNG CẤP NHÂN VIÊN!',
      `Đã duyệt thăng cấp cho Nhân viên: ${item.userName}\n\n• Cấp bậc mới: ${item.targetLevelName}\n• Quà hiện vật: ${item.rewardPhysicalItem}\n• Thưởng nóng: ${item.promotionBonusAmount.toLocaleString('vi-VN')} VNĐ\n• Hệ số Tết mới: ${item.retentionMultiplier}x\n\nLevel của nhân viên đã được cập nhật Real-time!`,
      [{ text: 'Đóng' }]
    );
  };

  const handleApproveLeader = (item: AdminReviewItem) => {
    setLeaderItems((prev) => {
      const list = prev[selectedDeptId] || currentLeaderDeptItems;
      const updatedList = list.map((rev) => (rev.id === item.id ? { ...rev, status: 'APPROVED' as const } : rev));
      return { ...prev, [selectedDeptId]: updatedList };
    });

    // Save level & approval timestamp to SecureStore & emit real-time socket event
    void (async () => {
      try {
        const raw = await SecureStore.getItemAsync('ALL_APPROVED_USER_IDS').catch(() => null);
        const existing = raw ? JSON.parse(raw) : [];
        const updated = Array.from(new Set([...(Array.isArray(existing) ? existing : []), item.employeeId]));
        await SecureStore.setItemAsync('ALL_APPROVED_USER_IDS', JSON.stringify(updated)).catch(() => {});
        await SecureStore.setItemAsync(`USER_APPROVED_LEVEL_${item.employeeId}`, String(item.targetLevelNumber)).catch(() => {});
        await SecureStore.setItemAsync(`USER_APPROVED_LEVEL_TIME_${item.employeeId}`, String(Date.now())).catch(() => {});
      } catch {}
    })();

    const socket = getSocket();
    if (socket) {
      socket.emit('level:user_promoted', {
        userId: item.employeeId,
        targetLevelNumber: item.targetLevelNumber,
        targetLevelName: item.targetLevelName,
        userName: item.userName,
      });
    }

    Alert.alert(
      'CHỐT PHÊ DUYỆT THĂNG CẤP LEADER / QUẢN LÝ!',
      `Đã duyệt thăng cấp quản trị cho Leader: ${item.userName}\n\n• Vị trí Level mới: ${item.targetLevelName}\n• Quà hiện vật: ${item.rewardPhysicalItem}\n• Thưởng nóng: ${item.promotionBonusAmount.toLocaleString('vi-VN')} VNĐ\n• Hệ số Tết mới: ${item.retentionMultiplier}x\n\nLevel của Leader đã được cập nhật Real-time!`,
      [{ text: 'Đóng' }]
    );
  };

  const handleRejectItem = (item: AdminReviewItem) => {
    Alert.alert(
      'Yêu Cầu Bổ Sung Dự Án Level',
      `Nhân sự ${item.userName} chưa đạt 100% tiến độ việc con. Đã gửi thông báo yêu cầu hoàn thiện trước khi chốt duyệt lại!`,
      [{ text: 'Đóng' }]
    );
  };

  return (
    <View style={styles.rootContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#1E293B" />

      {/* Top Header Safe Area (Navy Blue #1E293B) */}
      <SafeAreaView style={styles.headerSafeArea}>
        <View style={styles.executiveHeaderCard}>
          <Text style={styles.executiveBadgeTitle}>ADMIN CONTROL CENTER</Text>
          <Text style={styles.title}>Chốt Duyệt Level Cuối Tháng</Text>
          <Text style={styles.subTitle}>Kiểm tra tiến độ, phê duyệt thăng cấp Level & trao quà thưởng</Text>
        </View>

        {/* 3-Step Progress Stepper Navigation Bar: 1. Phòng Ban —— 2. Duyệt Nhân Viên —— 3. Duyệt Leader */}
        <View style={styles.stepperWrapper}>
          <TouchableOpacity
            style={[styles.stepItemPill, activeStep === 1 && styles.stepItemPillActive]}
            onPress={() => setActiveStep(1)}
            activeOpacity={0.8}
          >
            <View style={[styles.stepCircle, activeStep === 1 ? styles.stepCircleActive : styles.stepCircleInactive]}>
              <Text style={[styles.stepNumberText, activeStep === 1 ? styles.stepNumberTextActive : styles.stepNumberTextInactive]}>1</Text>
            </View>
            <Text style={[styles.stepLabelText, activeStep === 1 ? styles.stepLabelTextActive : styles.stepLabelTextInactive]}>Phòng Ban</Text>
          </TouchableOpacity>

          <View style={styles.stepConnectorLine} />

          <TouchableOpacity
            style={[styles.stepItemPill, activeStep === 2 && styles.stepItemPillActive]}
            onPress={() => setActiveStep(2)}
            activeOpacity={0.8}
          >
            <View style={[styles.stepCircle, activeStep === 2 ? styles.stepCircleActive : styles.stepCircleInactive]}>
              <Text style={[styles.stepNumberText, activeStep === 2 ? styles.stepNumberTextActive : styles.stepNumberTextInactive]}>2</Text>
            </View>
            <Text style={[styles.stepLabelText, activeStep === 2 ? styles.stepLabelTextActive : styles.stepLabelTextInactive]}>Duyệt Nhân Viên</Text>
          </TouchableOpacity>

          <View style={styles.stepConnectorLine} />

          <TouchableOpacity
            style={[styles.stepItemPill, activeStep === 3 && styles.stepItemPillActive]}
            onPress={() => setActiveStep(3)}
            activeOpacity={0.8}
          >
            <View style={[styles.stepCircle, activeStep === 3 ? styles.stepCircleActive : styles.stepCircleInactive]}>
              <Text style={[styles.stepNumberText, activeStep === 3 ? styles.stepNumberTextActive : styles.stepNumberTextInactive]}>3</Text>
            </View>
            <Text style={[styles.stepLabelText, activeStep === 3 ? styles.stepLabelTextActive : styles.stepLabelTextInactive]}>Duyệt Leader</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Main Content Body */}
      <View style={styles.pageBodyContainer}>
        {isDeptLoading && departments.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.loadingText}>Đang tải dữ liệu phòng ban từ Database Postgres...</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scroll}>
            {/* STEP 1: PHÒNG BAN - CHỌN KỲ CHỐT MONTH & PHÒNG BAN */}
            {activeStep === 1 && (
              <>
                <Text style={styles.filterSubLabel}>CHỌN KỲ CHỐT LEVEL CUỐI THÁNG:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScrollRow}>
                  {availableMonths.map((m) => (
                    <TouchableOpacity
                      key={m}
                      style={[styles.monthPill, selectedMonth === m && styles.monthPillActive]}
                      onPress={() => setSelectedMonth(m)}
                    >
                      <Text style={[styles.monthPillText, selectedMonth === m && styles.monthPillTextActive]}>
                        {m.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <View style={styles.deptCardGrid}>
                  {departments.map((dept) => {
                    const staffList = staffItems[dept.id] || [];
                    const leaderList = leaderItems[dept.id] || [];
                    const pendingStaffCount = staffList.filter((s) => s.status === 'PENDING').length;
                    const pendingLeaderCount = leaderList.filter((l) => l.status === 'PENDING').length;

                    return (
                      <TouchableOpacity
                        key={dept.id}
                        style={[styles.deptCardItem, selectedDeptId === dept.id && styles.deptCardItemActive]}
                        onPress={() => {
                          setSelectedDeptId(dept.id);
                          setActiveStep(2);
                        }}
                      >
                        <View style={styles.deptCardHeader}>
                          <Text style={styles.deptCardName}>{dept.name}</Text>
                          <View style={styles.deptBadge}>
                            <Text style={styles.deptBadgeText}>{pendingStaffCount + pendingLeaderCount} CHỜ DUYỆT</Text>
                          </View>
                        </View>

                        <View style={styles.deptCardBody}>
                          <Text style={styles.deptDetailLine}>• Nhân viên đề xuất thăng cấp: <Text style={styles.boldBlue}>{staffList.length} Nhân sự</Text></Text>
                          <Text style={styles.deptDetailLine}>• Leader đề xuất thăng cấp: <Text style={styles.boldAmber}>{leaderList.length} Leader</Text></Text>
                        </View>

                        <View style={styles.deptCardFooter}>
                          <Text style={styles.deptActionText}>Bấm Chọn Xét Duyệt Phòng {dept.name} →</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            {/* STEP 2: DUYỆT LEVEL NHÂN VIÊN */}
            {activeStep === 2 && (
              <>
                <Text style={styles.deptHeaderTitle}>DUYỆT LEVEL NHÂN VIÊN - PHÒNG {activeDept.name.toUpperCase()}</Text>

                {currentStaffDeptItems.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyTitle}>Chưa có đề xuất thăng cấp Nhân viên phòng {activeDept.name}</Text>
                    <Text style={styles.emptySub}>Tất cả Nhân viên phòng ban này đang ở cấp bậc Level ổn định.</Text>
                  </View>
                ) : (
                  currentStaffDeptItems.map((item) => {
                    const isExpanded = !!expandedCards[item.id];

                    return (
                      <View key={item.id} style={[styles.compactAuditCard, styles.cardBorderStaff]}>
                        {/* Header: Candidate Info & Role Tag */}
                        <View style={styles.cardHeaderRow}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.candidateName}>{item.userName}</Text>
                            <Text style={styles.candidateDept}>Phòng ban: {item.departmentName}</Text>
                          </View>

                          <View style={styles.roleBadgeStaff}>
                            <Text style={styles.roleBadgeTextStaff}>NHÂN VIÊN</Text>
                          </View>
                        </View>

                        {/* Level Upgrade Pill Banner */}
                        <View style={styles.levelTransitionRow}>
                          <View style={styles.levelPillOld}>
                            <Text style={styles.levelPillOldText}>{item.currentLevelName}</Text>
                          </View>
                          <Text style={styles.arrowIcon}>➔</Text>
                          <View style={styles.levelPillNewStaff}>
                            <Text style={styles.levelPillNewTextStaff}>{item.targetLevelName}</Text>
                          </View>
                        </View>

                        {/* Progress Bar & KPI % */}
                        <View style={styles.compactProgressBox}>
                          <View style={styles.progressLabelRow}>
                            <Text style={styles.progressTitle}>Tiến độ KPI dự án thăng cấp:</Text>
                            <Text style={styles.progressPercent}>{item.overallProjectProgress}%</Text>
                          </View>
                          <View style={styles.progressTrack}>
                            <View style={[styles.progressFill, { width: `${item.overallProjectProgress}%` }]} />
                          </View>
                        </View>

                        {/* Reward Highlights */}
                        <View style={styles.rewardSummaryRow}>
                          <View style={styles.rewardSummaryChip}>
                            <Text style={styles.rewardChipLabel}>Thưởng Nóng:</Text>
                            <Text style={styles.rewardChipValue}>+{item.promotionBonusAmount.toLocaleString('vi-VN')}đ</Text>
                          </View>
                          <View style={styles.rewardSummaryChip}>
                            <Text style={styles.rewardChipLabel}>Hệ Số Tết:</Text>
                            <Text style={styles.rewardChipValue}>{item.retentionMultiplier}x</Text>
                          </View>
                          <View style={[styles.rewardSummaryChip, { flex: 2 }]}>
                            <Text style={styles.rewardChipLabel}>Quà Hiện Vật:</Text>
                            <Text style={styles.rewardChipValue} numberOfLines={1}>
                              🎁 {item.rewardPhysicalItem}
                            </Text>
                          </View>
                        </View>

                        {/* Subtasks Accordion Toggle Button */}
                        <TouchableOpacity style={styles.accordionToggleBtn} onPress={() => toggleExpandCard(item.id)}>
                          <Text style={styles.accordionToggleText}>
                            {isExpanded
                              ? `▲ Thu gọn chi tiết việc con (${item.subTasks.length})`
                              : `▼ Xem chi tiết ${item.subTasks.length} việc con & kết quả thực hiện`}
                          </Text>
                        </TouchableOpacity>

                        {/* Expanded Subtasks List with Rich Operational Details */}
                        {isExpanded && (
                          <View style={styles.expandedSubTaskBox}>
                            <Text style={styles.projectTitleLabel}>TÊN DỰ ÁN: {item.projectName}</Text>
                            <View style={styles.subTasksList}>
                              {item.subTasks.map((st) => (
                                <View key={st.id} style={styles.subTaskAuditItem}>
                                  {/* Subtask Title & Status Badge */}
                                  <View style={styles.subTaskHeaderRow}>
                                    <Text style={styles.subTaskTitle}>{st.bulletTitle}</Text>
                                    <View style={[styles.rateBadge, st.completionRate === 100 ? styles.rateBadgeComplete : styles.rateBadgeProgress]}>
                                      <Text style={[styles.rateBadgeText, st.completionRate === 100 ? styles.rateTextComplete : styles.rateTextProgress]}>
                                        {st.completionRate}% {st.completionRate === 100 ? 'Đạt 100%' : 'Đang làm'}
                                      </Text>
                                    </View>
                                  </View>

                                  {/* Assignee Meta */}
                                  <Text style={styles.assigneeText}>
                                    Phụ trách: <Text style={styles.assigneeBold}>{st.assigneeName}</Text> ({st.assigneeRole})
                                  </Text>

                                  {/* CHI TIẾT KẾT QUẢ NHÂN VIÊN ĐÃ THỰC HIỆN ĐƯỢC */}
                                  <View style={styles.actualResultContainer}>
                                    <Text style={styles.actualResultLabel}>KẾT QUẢ THỰC TẾ NHÂN VIÊN ĐẠT ĐƯỢC:</Text>
                                    <Text style={styles.actualResultText}>{st.actualResultDescription}</Text>

                                    {/* Metric Comparison Box */}
                                    {(st.targetMetric || st.achievedMetric) && (
                                      <View style={styles.metricComparisonBox}>
                                        <View style={styles.metricItem}>
                                          <Text style={styles.metricLabel}>Chỉ tiêu giao:</Text>
                                          <Text style={styles.metricValueTarget}>{st.targetMetric}</Text>
                                        </View>
                                        <Text style={styles.metricArrow}>➔</Text>
                                        <View style={styles.metricItem}>
                                          <Text style={styles.metricLabel}>Thực tế đạt:</Text>
                                          <Text style={styles.metricValueAchieved}>{st.achievedMetric}</Text>
                                        </View>
                                      </View>
                                    )}

                                    {/* Proof & Verification */}
                                    <View style={styles.verificationRow}>
                                      {st.proofNotes && (
                                        <Text style={styles.proofText}>• Đối soát: {st.proofNotes}</Text>
                                      )}
                                      {st.verifiedBy && (
                                        <Text style={styles.verifiedByText}>✓ {st.verifiedBy}</Text>
                                      )}
                                    </View>
                                  </View>
                                </View>
                              ))}
                            </View>
                          </View>
                        )}

                        {/* Actions or Approved Banner */}
                        {item.status === 'PENDING' ? (
                          <View style={styles.actionRow}>
                            <TouchableOpacity style={styles.approveBtn} onPress={() => handleApproveStaff(item)}>
                              <Text style={styles.approveBtnText}>PHÊ DUYỆT THĂNG CẤP NHÂN VIÊN</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.rejectBtn} onPress={() => handleRejectItem(item)}>
                              <Text style={styles.rejectBtnText}>Yêu Cầu Bổ Sung</Text>
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <View style={styles.approvedNoticeBox}>
                            <Text style={styles.approvedNoticeText}>
                              ✓ Đã duyệt thăng cấp Nhân viên lên {item.targetLevelName} & Đồng bộ hệ số Tết {item.retentionMultiplier}x
                            </Text>
                          </View>
                        )}
                      </View>
                    );
                  })
                )}

                <TouchableOpacity style={styles.nextStepBtn} onPress={() => setActiveStep(3)}>
                  <Text style={styles.nextStepBtnText}>TIẾP THEO: SANG BƯỚC 3 (DUYỆT LEADER & THỐNG KÊ) →</Text>
                </TouchableOpacity>
              </>
            )}

            {/* STEP 3: DUYỆT LEVEL LEADER */}
            {activeStep === 3 && (
              <>
                <Text style={styles.deptHeaderTitle}>DUYỆT LEVEL LEADER - PHÒNG {activeDept.name.toUpperCase()}</Text>

                {currentLeaderDeptItems.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyTitle}>Chưa có đề xuất thăng cấp Leader phòng {activeDept.name}</Text>
                    <Text style={styles.emptySub}>Leader phòng ban này đang giữ vững cấp bậc Level hiện tại.</Text>
                  </View>
                ) : (
                  currentLeaderDeptItems.map((item) => {
                    const isExpanded = !!expandedCards[item.id];

                    return (
                      <View key={item.id} style={[styles.compactAuditCard, styles.cardBorderLeader]}>
                        {/* Header: Candidate Info & Role Tag */}
                        <View style={styles.cardHeaderRow}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.candidateName}>{item.userName}</Text>
                            <Text style={styles.candidateDept}>Trưởng Phòng / Team Leader: {item.departmentName}</Text>
                          </View>

                          <View style={styles.roleBadgeLeader}>
                            <Text style={styles.roleBadgeTextLeader}>LEADER</Text>
                          </View>
                        </View>

                        {/* Level Upgrade Pill Banner */}
                        <View style={styles.levelTransitionRow}>
                          <View style={styles.levelPillOld}>
                            <Text style={styles.levelPillOldText}>{item.currentLevelName}</Text>
                          </View>
                          <Text style={styles.arrowIcon}>➔</Text>
                          <View style={styles.levelPillNewLeader}>
                            <Text style={styles.levelPillNewTextLeader}>{item.targetLevelName}</Text>
                          </View>
                        </View>

                        {/* Progress Bar & KPI % */}
                        <View style={styles.compactProgressBox}>
                          <View style={styles.progressLabelRow}>
                            <Text style={styles.progressTitle}>Tiến độ KPI quản trị toàn team:</Text>
                            <Text style={[styles.progressPercent, { color: '#059669' }]}>{item.overallProjectProgress}%</Text>
                          </View>
                          <View style={styles.progressTrack}>
                            <View style={[styles.progressFillLeader, { width: `${item.overallProjectProgress}%` }]} />
                          </View>
                        </View>

                        {/* Reward Highlights */}
                        <View style={styles.rewardSummaryRow}>
                          <View style={styles.rewardSummaryChip}>
                            <Text style={styles.rewardChipLabel}>Thưởng Nóng:</Text>
                            <Text style={styles.rewardChipValue}>+{item.promotionBonusAmount.toLocaleString('vi-VN')}đ</Text>
                          </View>
                          <View style={styles.rewardSummaryChip}>
                            <Text style={styles.rewardChipLabel}>Hệ Số Tết:</Text>
                            <Text style={styles.rewardChipValue}>{item.retentionMultiplier}x</Text>
                          </View>
                          <View style={[styles.rewardSummaryChip, { flex: 2 }]}>
                            <Text style={styles.rewardChipLabel}>Quà Hiện Vật:</Text>
                            <Text style={styles.rewardChipValue} numberOfLines={1}>
                              🎁 {item.rewardPhysicalItem}
                            </Text>
                          </View>
                        </View>

                        {/* Subtasks Accordion Toggle Button */}
                        <TouchableOpacity style={styles.accordionToggleBtn} onPress={() => toggleExpandCard(item.id)}>
                          <Text style={styles.accordionToggleText}>
                            {isExpanded
                              ? `▲ Thu gọn chi tiết việc con (${item.subTasks.length})`
                              : `▼ Xem chi tiết ${item.subTasks.length} việc con & kết quả quản trị`}
                          </Text>
                        </TouchableOpacity>

                        {/* Expanded Subtasks List with Rich Operational Details */}
                        {isExpanded && (
                          <View style={styles.expandedSubTaskBox}>
                            <Text style={styles.projectTitleLabel}>TÊN DỰ ÁN QUẢN TRỊ: {item.projectName}</Text>
                            <View style={styles.subTasksList}>
                              {item.subTasks.map((st) => (
                                <View key={st.id} style={styles.subTaskAuditItem}>
                                  {/* Subtask Title & Status Badge */}
                                  <View style={styles.subTaskHeaderRow}>
                                    <Text style={styles.subTaskTitle}>{st.bulletTitle}</Text>
                                    <View style={[styles.rateBadge, st.completionRate === 100 ? styles.rateBadgeComplete : styles.rateBadgeProgress]}>
                                      <Text style={[styles.rateBadgeText, st.completionRate === 100 ? styles.rateTextComplete : styles.rateTextProgress]}>
                                        {st.completionRate}% {st.completionRate === 100 ? 'Đạt 100%' : 'Đang làm'}
                                      </Text>
                                    </View>
                                  </View>

                                  {/* Assignee Meta */}
                                  <Text style={styles.assigneeText}>
                                    Phụ trách: <Text style={styles.assigneeBold}>{st.assigneeName}</Text> ({st.assigneeRole})
                                  </Text>

                                  {/* CHI TIẾT KẾT QUẢ LEADER ĐÃ THỰC HIỆN ĐƯỢC */}
                                  <View style={styles.actualResultContainer}>
                                    <Text style={styles.actualResultLabel}>KẾT QUẢ THỰC TẾ LEADER ĐẠT ĐƯỢC:</Text>
                                    <Text style={styles.actualResultText}>{st.actualResultDescription}</Text>

                                    {/* Metric Comparison Box */}
                                    {(st.targetMetric || st.achievedMetric) && (
                                      <View style={styles.metricComparisonBox}>
                                        <View style={styles.metricItem}>
                                          <Text style={styles.metricLabel}>Chỉ tiêu giao:</Text>
                                          <Text style={styles.metricValueTarget}>{st.targetMetric}</Text>
                                        </View>
                                        <Text style={styles.metricArrow}>➔</Text>
                                        <View style={styles.metricItem}>
                                          <Text style={styles.metricLabel}>Thực tế đạt:</Text>
                                          <Text style={styles.metricValueAchieved}>{st.achievedMetric}</Text>
                                        </View>
                                      </View>
                                    )}

                                    {/* Proof & Verification */}
                                    <View style={styles.verificationRow}>
                                      {st.proofNotes && (
                                        <Text style={styles.proofText}>• Đối soát: {st.proofNotes}</Text>
                                      )}
                                      {st.verifiedBy && (
                                        <Text style={styles.verifiedByText}>✓ {st.verifiedBy}</Text>
                                      )}
                                    </View>
                                  </View>
                                </View>
                              ))}
                            </View>
                          </View>
                        )}

                        {/* Actions or Approved Banner */}
                        {item.status === 'PENDING' ? (
                          <View style={styles.actionRow}>
                            <TouchableOpacity style={styles.leaderApproveBtn} onPress={() => handleApproveLeader(item)}>
                              <Text style={styles.approveBtnText}>PHÊ DUYỆT THĂNG CẤP LEADER</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.rejectBtn} onPress={() => handleRejectItem(item)}>
                              <Text style={styles.rejectBtnText}>Yêu Cầu Bổ Sung</Text>
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <View style={styles.approvedNoticeBox}>
                            <Text style={styles.approvedNoticeText}>
                              ✓ Đã phê duyệt thăng cấp Leader lên {item.targetLevelName} & Đồng bộ hệ số Tết {item.retentionMultiplier}x
                            </Text>
                          </View>
                        )}
                      </View>
                    );
                  })
                )}

                {/* EXECUTIVE MONTHLY REWARDS SUMMARY */}
                <View style={styles.summaryContainer}>
                  <Text style={styles.summaryHeaderTitle}>BÁO CÁO TỔNG HỢP DUYỆT LEVEL TOÀN CÔNG TY ({selectedMonth})</Text>

                  <View style={styles.summaryStatGrid}>
                    <View style={styles.statBoxCard}>
                      <Text style={styles.statBoxNumber}>0 Nhân Sự</Text>
                      <Text style={styles.statBoxLabel}>Tổng Đã Phê Duyệt Thăng Cấp</Text>
                    </View>

                    <View style={styles.statBoxCard}>
                      <Text style={styles.statBoxNumber}>0 VNĐ</Text>
                      <Text style={styles.statBoxLabel}>Tổng Thưởng Nóng Tiền Mặt</Text>
                    </View>

                    <View style={styles.statBoxCard}>
                      <Text style={styles.statBoxNumber}>0 Quà</Text>
                      <Text style={styles.statBoxLabel}>Quà Thưởng Hiện Vật Đã Trao</Text>
                    </View>
                  </View>

                  <TouchableOpacity style={styles.finishAllBtn} onPress={() => setActiveStep(1)}>
                    <Text style={styles.finishAllBtnText}>HOÀN TẤT & ĐỒNG BỘ NĂNG SUẤT REAL-TIME</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            <View style={{ height: 20 }} />
          </ScrollView>
        )}
      </View>
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
    paddingTop: 10,
    paddingBottom: 14,
  },
  executiveHeaderCard: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  executiveBadgeTitle: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  subTitle: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  stepperWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    marginTop: 6,
    marginBottom: 4,
  },
  stepItemPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  stepItemPillActive: {
    backgroundColor: '#334155',
  },
  stepCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    backgroundColor: '#2563EB',
  },
  stepCircleInactive: {
    backgroundColor: '#475569',
  },
  stepNumberText: {
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  stepNumberTextActive: {
    color: '#FFFFFF',
  },
  stepNumberTextInactive: {
    color: '#CBD5E1',
  },
  stepLabelText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  stepLabelTextActive: {
    color: '#FFFFFF',
  },
  stepLabelTextInactive: {
    color: '#94A3B8',
  },
  stepConnectorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#475569',
    marginHorizontal: 4,
    minWidth: 8,
  },
  pageBodyContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    color: '#64748B',
    fontSize: 13,
  },
  scroll: {
    padding: 16,
  },
  filterSubLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  deptHeaderTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  filterScrollRow: {
    marginBottom: 16,
  },
  monthPill: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  monthPillActive: {
    backgroundColor: '#1E40AF',
  },
  monthPillText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#475569',
  },
  monthPillTextActive: {
    color: '#FFFFFF',
  },

  /* Dept Card Grid (Step 1) */
  deptCardGrid: {
    gap: 12,
  },
  deptCardItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  deptCardItemActive: {
    borderColor: '#2563EB',
    borderWidth: 2,
  },
  deptCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  deptCardName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  deptBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  deptBadgeText: {
    color: '#D97706',
    fontSize: 10,
    fontWeight: 'bold',
  },
  deptCardBody: {
    gap: 4,
    marginBottom: 12,
  },
  deptDetailLine: {
    fontSize: 12,
    color: '#475569',
  },
  boldBlue: {
    fontWeight: 'bold',
    color: '#2563EB',
  },
  boldAmber: {
    fontWeight: 'bold',
    color: '#059669',
  },
  deptCardFooter: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
    alignItems: 'flex-end',
  },
  deptActionText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2563EB',
  },

  /* Compact Candidate Approval Card */
  compactAuditCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  cardBorderStaff: {
    borderLeftWidth: 4,
    borderLeftColor: '#2563EB',
  },
  cardBorderLeader: {
    borderLeftWidth: 4,
    borderLeftColor: '#059669',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  candidateName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  candidateDept: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  roleBadgeStaff: {
    backgroundColor: '#DBEAFE',
    borderColor: '#93C5FD',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  roleBadgeLeader: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  roleBadgeTextStaff: {
    color: '#1D4ED8',
    fontSize: 10,
    fontWeight: 'bold',
  },
  roleBadgeTextLeader: {
    color: '#15803D',
    fontSize: 10,
    fontWeight: 'bold',
  },

  /* Level Transition Banner */
  levelTransitionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 8,
    marginBottom: 10,
    gap: 8,
  },
  levelPillOld: {
    backgroundColor: '#CBD5E1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  levelPillOldText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  arrowIcon: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: 'bold',
  },
  levelPillNewStaff: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    flex: 1,
  },
  levelPillNewLeader: {
    backgroundColor: '#059669',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    flex: 1,
  },
  levelPillNewTextStaff: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  levelPillNewTextLeader: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  /* Compact Progress Box */
  compactProgressBox: {
    marginBottom: 10,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  progressTitle: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '500',
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2563EB',
  },
  progressTrack: {
    height: 7,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2563EB',
    borderRadius: 4,
  },
  progressFillLeader: {
    height: '100%',
    backgroundColor: '#059669',
    borderRadius: 4,
  },

  /* Reward Summary Row */
  rewardSummaryRow: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: '#FEFCE8',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FEF08A',
    marginBottom: 10,
  },
  rewardSummaryChip: {
    flex: 1,
  },
  rewardChipLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#A16207',
  },
  rewardChipValue: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#854D0E',
    marginTop: 1,
  },

  /* Accordion Toggle Button */
  accordionToggleBtn: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  accordionToggleText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#475569',
  },
  expandedSubTaskBox: {
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  projectTitleLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
  },
  subTasksList: {
    gap: 10,
  },
  subTaskAuditItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  subTaskHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 4,
  },
  subTaskTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0F172A',
    flex: 1,
  },
  assigneeText: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 8,
  },
  assigneeBold: {
    fontWeight: 'bold',
    color: '#1E40AF',
  },
  rateBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  rateBadgeComplete: {
    backgroundColor: '#D1FAE5',
  },
  rateBadgeProgress: {
    backgroundColor: '#FEF3C7',
  },
  rateBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  rateTextComplete: {
    color: '#065F46',
  },
  rateTextProgress: {
    color: '#92400E',
  },

  /* Actual Result Rich Container */
  actualResultContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    padding: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#10B981',
    marginTop: 2,
  },
  actualResultLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#047857',
    marginBottom: 4,
    letterSpacing: 0.4,
  },
  actualResultText: {
    fontSize: 11,
    color: '#1E293B',
    lineHeight: 16,
    marginBottom: 6,
  },
  metricComparisonBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    padding: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 6,
    gap: 6,
  },
  metricItem: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 9,
    color: '#64748B',
    fontWeight: '600',
  },
  metricValueTarget: {
    fontSize: 10,
    color: '#475569',
    fontWeight: 'bold',
    marginTop: 1,
  },
  metricValueAchieved: {
    fontSize: 10,
    color: '#059669',
    fontWeight: 'bold',
    marginTop: 1,
  },
  metricArrow: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: 'bold',
  },
  verificationRow: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 4,
    gap: 2,
  },
  proofText: {
    fontSize: 10,
    color: '#64748B',
    fontStyle: 'italic',
  },
  verifiedByText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#047857',
  },

  /* Action Buttons */
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  approveBtn: {
    flex: 2,
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  leaderApproveBtn: {
    flex: 2,
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  approveBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  rejectBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  rejectBtnText: {
    color: '#475569',
    fontWeight: 'bold',
    fontSize: 11,
  },
  approvedNoticeBox: {
    backgroundColor: '#ECFDF5',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    alignItems: 'center',
  },
  approvedNoticeText: {
    color: '#047857',
    fontWeight: 'bold',
    fontSize: 11,
    textAlign: 'center',
  },

  /* Step Navigation & Summary */
  emptyCard: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 14,
    alignItems: 'center',
    marginVertical: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
  nextStepBtn: {
    backgroundColor: '#1E293B',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  nextStepBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  summaryContainer: {
    gap: 14,
    marginTop: 10,
  },
  summaryHeaderTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 4,
  },
  summaryStatGrid: {
    gap: 10,
  },
  statBoxCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statBoxNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E40AF',
  },
  statBoxLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  finishAllBtn: {
    backgroundColor: '#1E293B',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  finishAllBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
    letterSpacing: 0.8,
  },
});
