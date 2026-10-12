import React, { useState, useMemo } from 'react';
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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../providers/AuthProvider';
import {
  useLevelProjects,
  BulletSubTask,
  LevelDepartmentProject,
} from './levelProjectsStore';
import { LEVEL_COLORS } from '../../components/common/LevelNameBadge';
import { CustomAlert } from '../../components/CustomAlert';

export const EmployeeLevelProjectScreen: React.FC = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const safeTopInset = Math.max((insets.top > 0 ? insets.top : (StatusBar.currentHeight || 20)) - 6, 8);
  const { user } = useAuth();
  const empDeptId = (user as any)?.departmentId || user?.department?.id;
  const empDeptName = user?.department?.name || (user as any)?.departmentName;

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/employee');
    }
  };

  const { getAssignedSubTasksForUser, submitSubTask } = useLevelProjects(empDeptId, empDeptName);

  const currentUserId = user?.id;
  const currentUserName = user?.fullName || user?.userCode || '';

  // Real-time reactive assigned subtasks for this employee
  const assignedItems = getAssignedSubTasksForUser(currentUserId, currentUserName);

  // Accordion state: levelNumber -> boolean (undefined means default expanded)
  const [collapsedProjects, setCollapsedProjects] = useState<Record<number, boolean>>({});

  // Selected item modal for viewing details / submitting result
  const [activeItem, setActiveItem] = useState<{
    project: LevelDepartmentProject;
    subTask: BulletSubTask;
  } | null>(null);

  const [resultText, setResultText] = useState('');
  const [evidenceLink, setEvidenceLink] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const userLevel = (user as any)?.profile?.currentLevelNumber || (user as any)?.currentLevelNumber || 1;
  const userMultiplier =
    userLevel <= 1 ? 1.0 : userLevel === 2 ? 1.5 : userLevel === 3 ? 2.0 : userLevel === 4 ? 2.5 : userLevel === 5 ? 3.0 : userLevel === 6 ? 3.5 : userLevel === 7 ? 4.0 : 5.0;

  // Distinct projects the employee is participating in
  const involvedProjects = useMemo(() => {
    const map = new Map<number, LevelDepartmentProject>();
    assignedItems.forEach((item) => {
      if (!map.has(item.project.levelNumber)) {
        map.set(item.project.levelNumber, item.project);
      }
    });
    return Array.from(map.values()).sort((a, b) => a.levelNumber - b.levelNumber);
  }, [assignedItems]);

  // Overall Statistics
  const totalTasks = assignedItems.length;
  const approvedTasks = assignedItems.filter((i) => i.subTask.status === 'LEADER_APPROVED').length;
  const submittedWaitingTasks = assignedItems.filter(
    (i) => i.subTask.status === 'SUBMITTED' && !i.subTask.leaderFeedback
  ).length;
  const pendingActionTasks = assignedItems.filter(
    (i) =>
      (i.subTask.status !== 'SUBMITTED' && i.subTask.status !== 'LEADER_APPROVED') ||
      Boolean(i.subTask.leaderFeedback && i.subTask.status !== 'LEADER_APPROVED')
  ).length;
  const progressPercent = totalTasks > 0 ? Math.round((approvedTasks / totalTasks) * 100) : 0;

  // Check active item project lock status
  const isActiveProjectFirmApproved = activeItem?.project.status === 'ADMIN_APPROVED';
  const isActiveProjectSubmittedToAdmin = activeItem?.project.status === 'SUBMITTED_TO_ADMIN';
  const isActiveProjectLocked = isActiveProjectFirmApproved || isActiveProjectSubmittedToAdmin;

  const hasReworkRequest =
    Boolean(activeItem?.subTask.leaderFeedback) && activeItem?.subTask.status !== 'LEADER_APPROVED';
  const isLeaderApproved = activeItem?.subTask.status === 'LEADER_APPROVED';
  const isSubmittedWaitingLeader = activeItem?.subTask.status === 'SUBMITTED' && !hasReworkRequest;
  const isEditable = !isActiveProjectLocked && !isLeaderApproved && !isSubmittedWaitingLeader;

  const toggleProjectAccordion = (levelNumber: number) => {
    setCollapsedProjects((prev) => ({
      ...prev,
      [levelNumber]: !prev[levelNumber],
    }));
  };

  const handleToggleAll = (expand: boolean) => {
    const nextState: Record<number, boolean> = {};
    involvedProjects.forEach((p) => {
      nextState[p.levelNumber] = !expand;
    });
    setCollapsedProjects(nextState);
  };

  const handleOpenDetail = (item: {
    project: LevelDepartmentProject;
    subTask: BulletSubTask;
  }) => {
    setActiveItem(item);
    setResultText(item.subTask.submissionNote || '');
    setEvidenceLink(item.subTask.evidenceUrl || '');
    setSelectedImages(item.subTask.evidenceImages || []);
  };

  // Image Picker action
  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets) {
        const newUris = result.assets.map((a) => a.uri);
        setSelectedImages((prev) => [...prev, ...newUris]);
      }
    } catch {
      CustomAlert.alert('Thông báo', 'Không thể mở thư viện ảnh');
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setSelectedImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleConfirmSubmit = () => {
    if (!activeItem) return;
    if (isActiveProjectLocked) {
      CustomAlert.alert('Thông báo', 'Dự án đã đóng băng hoặc đã được Firm nghiệm thu, không thể nộp thêm báo cáo.');
      return;
    }
    if (!resultText.trim()) {
      CustomAlert.alert('Lỗi', 'Vui lòng nhập tóm tắt báo cáo kết quả thực hiện');
      return;
    }

    submitSubTask(
      activeItem.project.levelNumber,
      activeItem.subTask.id,
      resultText.trim(),
      evidenceLink.trim() || undefined,
      selectedImages
    );

    setActiveItem(null);
    CustomAlert.alert('Thành Công', 'Đã nộp báo cáo và minh chứng cho Leader duyệt Vòng 1.');
  };

  // Priority ranking function:
  // 1. Chưa duyệt / Cần nộp (Ưu tiên cao nhất: 0 nếu cần sửa, 1 nếu chưa nộp)
  // 2. Chờ duyệt (Ưu tiên 2)
  // 3. Đã duyệt (Ưu tiên 3 - xếp cuối)
  const getSubTaskPriority = (subTask: BulletSubTask): number => {
    if (subTask.leaderFeedback && subTask.status !== 'LEADER_APPROVED') return 0; // Cần sửa gấp
    if (subTask.status === 'ASSIGNED' || subTask.status === 'UNASSIGNED') return 1; // Chưa nộp bài
    if (subTask.status === 'SUBMITTED') return 2; // Đang chờ duyệt
    if (subTask.status === 'LEADER_APPROVED') return 3; // Đã duyệt
    return 4;
  };

  const areAllCollapsed = involvedProjects.length > 0 && involvedProjects.every((p) => collapsedProjects[p.levelNumber]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#123826" />
      <View style={[styles.topSafeArea, { paddingTop: safeTopInset }]}>
        {/* Top Header */}
        <View style={styles.topHeader}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={handleBack}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Nhiệm vụ cấp bậc</Text>
            <Text style={styles.headerSubtitle}>Quản lý tiến độ thăng hạng</Text>
          </View>
          <View style={{ width: 32 }} />
        </View>
      </View>

      <View style={styles.bodyWrapper}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: 40 + Math.max(insets.bottom, 24) }]}
          showsVerticalScrollIndicator={false}
        >
          {/* TOP SUMMARY CARD */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryTopRow}>
              <View>
                <Text style={styles.summaryLabel}>Tiến độ thăng cấp tổng thể</Text>
                <Text style={styles.summaryNumber}>
                  {approvedTasks}/{totalTasks}{' '}
                  <Text style={styles.summaryNumberSub}>hoàn thành ({progressPercent}%)</Text>
                </Text>
              </View>
              {involvedProjects.length > 1 && (
                <TouchableOpacity
                  style={styles.toggleAllBtn}
                  onPress={() => handleToggleAll(areAllCollapsed)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={areAllCollapsed ? 'chevron-down-circle-outline' : 'chevron-up-circle-outline'}
                    size={14}
                    color="#123826"
                  />
                  <Text style={styles.toggleAllBtnText}>
                    {areAllCollapsed ? 'Mở tất cả' : 'Thu gọn'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Linear Progress Bar */}
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
            </View>

            {/* 3 Metric Pills */}
            <View style={styles.summaryPillRow}>
              <View style={[styles.summaryPill, styles.pillPending]}>
                <MaterialCommunityIcons name="note-edit-outline" size={14} color="#EF4444" />
                <Text style={styles.pillPendingText}>Chưa nộp: {pendingActionTasks}</Text>
              </View>

              <View style={[styles.summaryPill, styles.pillWaiting]}>
                <Ionicons name="time-outline" size={13} color="#F59E0B" />
                <Text style={styles.pillWaitingText}>Chờ duyệt: {submittedWaitingTasks}</Text>
              </View>

              <View style={[styles.summaryPill, styles.pillDone]}>
                <Ionicons name="checkmark-circle-outline" size={13} color="#10B981" />
                <Text style={styles.pillDoneText}>Đã duyệt: {approvedTasks}</Text>
              </View>
            </View>
          </View>

          {/* SECTION TITLE */}
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeaderTitleCol}>
              <View style={styles.sectionHeaderTitleRow}>
                <Text style={styles.sectionHeaderTitle}>Dự án cấp bậc & đầu việc</Text>
                <View style={styles.sectionHeaderPill}>
                  <Text style={styles.sectionHeaderPillText}>{totalTasks}</Text>
                </View>
              </View>
              <Text style={styles.sectionHeaderHelp}>Chạm để đóng/mở danh sách việc</Text>
            </View>
          </View>

          {/* PROJECT LIST ACCORDION */}
          {involvedProjects.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconCircle}>
                <MaterialCommunityIcons name="folder-outline" size={44} color="#123826" />
              </View>
              <Text style={styles.emptyTitle}>Chưa có dự án hoặc đầu việc được giao</Text>
              <Text style={styles.emptySub}>
                Khi Leader phân công việc con cấp bậc cho bạn, danh sách dự án và đầu việc sẽ tự động xuất hiện tại đây.
              </Text>
            </View>
          ) : (
            involvedProjects.map((proj) => {
              const isCollapsed = Boolean(collapsedProjects[proj.levelNumber]);
              const isFirmApproved = proj.status === 'ADMIN_APPROVED';
              const isSubmittedToAdmin = proj.status === 'SUBMITTED_TO_ADMIN';
              const isProjectLocked = isFirmApproved || isSubmittedToAdmin;

              // Filter subtasks of this project assigned to user
              const projectUserItems = assignedItems.filter(
                (item) => item.project.levelNumber === proj.levelNumber
              );

              // Sort strictly by priority: Chưa duyệt -> Chờ duyệt -> Đã duyệt
              const sortedTasks = [...projectUserItems].sort((a, b) => {
                const pA = getSubTaskPriority(a.subTask);
                const pB = getSubTaskPriority(b.subTask);
                if (pA !== pB) return pA - pB;
                return a.subTask.orderNumber - b.subTask.orderNumber;
              });

              const projTotal = projectUserItems.length;
              const projApproved = projectUserItems.filter((i) => i.subTask.status === 'LEADER_APPROVED').length;
              const projPending = projectUserItems.filter(
                (i) => i.subTask.status !== 'SUBMITTED' && i.subTask.status !== 'LEADER_APPROVED'
              ).length;
              const projProgressPercent = projTotal > 0 ? Math.round((projApproved / projTotal) * 100) : 0;
              const isAllUserTasksDone = projTotal > 0 && projApproved === projTotal;

              // Rewards calculation
              const cashPool =
                proj.cashAmount ||
                (proj.rewardItem
                  ? Number(proj.rewardItem.replace(/\./g, '').match(/(\d+)\s*VNĐ/i)?.[1] || 0)
                  : 0);
              const physicalItems =
                proj.physicalItems || (proj.physicalItemName ? [proj.physicalItemName] : []);

              let totalWeight = 0;
              const assignedUserIds = new Set<string>();
              (proj.subTasks || []).forEach((st) => {
                if (st.assignedToUserId && !assignedUserIds.has(st.assignedToUserId)) {
                  assignedUserIds.add(st.assignedToUserId);
                  const uWeight = st.assignedToUserId === currentUserId ? userMultiplier : 1.5;
                  totalWeight += uWeight;
                }
              });
              if (totalWeight === 0) totalWeight = userMultiplier;
              const estimatedCashShare =
                cashPool > 0 ? Math.round((userMultiplier / totalWeight) * cashPool) : 0;

              const userColor = LEVEL_COLORS[userLevel] || '#2563EB';

              return (
                <View
                  key={proj.id || proj.levelNumber}
                  style={[
                    styles.projectCard,
                    isFirmApproved && styles.projectCardFirmApproved,
                    isSubmittedToAdmin && styles.projectCardSubmittedAdmin,
                  ]}
                >
                  {/* DROPDOWN / ACCORDION HEADER (TAPPABLE) */}
                  <TouchableOpacity
                    style={styles.projectHeaderTouchable}
                    onPress={() => toggleProjectAccordion(proj.levelNumber)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.projectHeaderTopRow}>
                      <View style={{ flex: 1, paddingRight: 8 }}>
                        <View style={styles.projectTitleRow}>
                          <Text style={styles.projectNameText} numberOfLines={1}>
                            {proj.projectName || proj.levelName}
                          </Text>
                          <View style={[styles.levelBadgeMini, { backgroundColor: userColor }]}>
                            <Text style={styles.levelBadgeMiniText}>Lv.{userLevel} ({userMultiplier}x)</Text>
                          </View>
                        </View>
                        <Text style={styles.projectDeptSub}>
                          {proj.departmentName} • {proj.targetTierTitle || proj.levelName}
                        </Text>
                      </View>

                      {/* Status badge & chevron */}
                      <View style={styles.projectStatusAndChevron}>
                        {isFirmApproved ? (
                          <View style={styles.badgeFirmApproved}>
                            <Ionicons name="shield-checkmark" size={12} color="#059669" />
                            <Text style={styles.badgeFirmApprovedText}>Firm Đã Duyệt</Text>
                          </View>
                        ) : isSubmittedToAdmin ? (
                          <View style={styles.badgeSubmittedAdmin}>
                            <Ionicons name="lock-closed" size={12} color="#1E293B" />
                            <Text style={styles.badgeSubmittedAdminText}>Chờ Firm Duyệt</Text>
                          </View>
                        ) : isAllUserTasksDone ? (
                          <View style={styles.badgeAllDone}>
                            <Ionicons name="checkmark-done" size={12} color="#059669" />
                            <Text style={styles.badgeAllDoneText}>Hoàn Tất Phần Bạn</Text>
                          </View>
                        ) : (
                          <View style={styles.badgeActive}>
                            <Text style={styles.badgeActiveText}>
                              {projPending > 0 ? `${projPending} việc cần nộp` : 'Đang thực hiện'}
                            </Text>
                          </View>
                        )}

                        <Ionicons
                          name={isCollapsed ? 'chevron-down' : 'chevron-up'}
                          size={18}
                          color="#64748B"
                        />
                      </View>
                    </View>

                    {/* Progress within Project */}
                    <View style={styles.projectProgressRow}>
                      <View style={styles.projectProgressTextRow}>
                        <Text style={styles.projectProgressLabel}>Tiến độ đầu việc của bạn</Text>
                        <Text style={styles.projectProgressRatio}>
                          {projApproved}/{projTotal} ({projProgressPercent}%)
                        </Text>
                      </View>
                      <View style={styles.projectProgressTrack}>
                        <View
                          style={[
                            styles.projectProgressFill,
                            { width: `${projProgressPercent}%` },
                            isFirmApproved && { backgroundColor: '#059669' },
                          ]}
                        />
                      </View>
                    </View>
                  </TouchableOpacity>

                  {/* PROJECT REWARD SUMMARY BAR */}
                  <View style={styles.projectRewardSection}>
                    {cashPool > 0 && (
                      <View style={styles.rewardCashRow}>
                        <View style={styles.rewardCashLeft}>
                          <Ionicons name="wallet-outline" size={14} color="#64748B" />
                          <Text style={styles.rewardCashLabel}>Quỹ dự án:</Text>
                          <Text style={styles.rewardCashTotal}>{cashPool.toLocaleString('vi-VN')} VNĐ</Text>
                        </View>
                        <View style={styles.rewardUserSharePill}>
                          <Ionicons name="cash-outline" size={14} color="#065F46" />
                          <Text style={styles.rewardUserShareLabel}>Phần bạn:</Text>
                          <Text style={styles.rewardUserShareAmount}>
                            ~{estimatedCashShare.toLocaleString('vi-VN')} đ
                          </Text>
                        </View>
                      </View>
                    )}

                    {physicalItems.length > 0 && (
                      <View style={styles.rewardPhysicalRow}>
                        <Ionicons name="cube-outline" size={14} color="#2563EB" />
                        <Text style={styles.rewardPhysicalLabel}>Hiện vật:</Text>
                        <Text style={styles.rewardPhysicalValue}>{physicalItems.join(' • ')}</Text>
                      </View>
                    )}
                  </View>

                  {/* FIRM FINALIZED / LOCKED BANNER (IF APPLICABLE) */}
                  {isFirmApproved && (
                    <View style={styles.firmApprovedNoticeBox}>
                      <View style={styles.firmNoticeHeader}>
                        <Ionicons name="shield-checkmark" size={16} color="#059669" />
                        <Text style={styles.firmNoticeTitle}>
                          Dự Án Đã Nghiệm Thu & Phê Duyệt Cấp Bậc
                        </Text>
                      </View>
                      <Text style={styles.firmNoticeText}>
                        Ban Giám Đốc / Firm đã thẩm định và xác nhận nghiệm thu chính thức dự án này. Toàn bộ
                        đầu việc đã được chốt hoàn tất.
                      </Text>
                      {proj.adminFeedback ? (
                        <Text style={styles.firmFeedbackText}>
                          Nhận xét từ BGĐ: "{proj.adminFeedback}"
                        </Text>
                      ) : null}
                    </View>
                  )}

                  {isSubmittedToAdmin && (
                    <View style={styles.submittedAdminNoticeBox}>
                      <View style={styles.firmNoticeHeader}>
                        <Ionicons name="lock-closed" size={16} color="#1E293B" />
                        <Text style={styles.submittedAdminTitle}>
                          Đang Trong Giai Đoạn Thẩm Định Của Firm
                        </Text>
                      </View>
                      <Text style={styles.submittedAdminText}>
                        Leader đã nghiệm thu Vòng 1 và nộp hồ sơ lên Firm để thẩm định Vòng 2. Toàn bộ đầu việc
                        hiện đang đóng băng, không thể chỉnh sửa hoặc nộp bổ sung.
                      </Text>
                    </View>
                  )}

                  {/* EXPANDABLE SUBTASKS LIST (DROPDOWN BODY) */}
                  {!isCollapsed && (
                    <View style={styles.tasksContainer}>
                      <View style={styles.tasksHeaderRow}>
                        <Text style={styles.tasksHeaderTitle}>
                          ĐẦU VIỆC THỰC HIỆN ({sortedTasks.length})
                        </Text>
                        <Text style={styles.tasksHeaderOrderHint}>
                          Ưu tiên: Chưa nộp → Chờ duyệt → Đã duyệt
                        </Text>
                      </View>

                      {sortedTasks.length === 0 ? (
                        <View style={styles.noTasksBox}>
                          <Text style={styles.noTasksText}>
                            Bạn chưa có đầu việc nào được phân công trong dự án này.
                          </Text>
                        </View>
                      ) : (
                        sortedTasks.map((item) => {
                          const { subTask } = item;
                          const isApproved = subTask.status === 'LEADER_APPROVED';
                          const isSubmitted = subTask.status === 'SUBMITTED';
                          const hasRework =
                            Boolean(subTask.leaderFeedback) && subTask.status !== 'LEADER_APPROVED';

                          return (
                            <TouchableOpacity
                              key={subTask.id}
                              style={[
                                styles.taskItemRow,
                                hasRework && styles.taskItemRework,
                                isSubmitted && styles.taskItemSubmitted,
                                isApproved && styles.taskItemApproved,
                              ]}
                              onPress={() => handleOpenDetail(item)}
                              activeOpacity={0.7}
                            >
                              {/* Order / Status Icon */}
                              <View
                                style={[
                                  styles.taskIndexCircle,
                                  isApproved && styles.taskIndexCircleApproved,
                                  hasRework && styles.taskIndexCircleRework,
                                  isSubmitted && styles.taskIndexCircleSubmitted,
                                ]}
                              >
                                {isApproved ? (
                                  <Ionicons name="checkmark" size={14} color="#059669" />
                                ) : hasRework ? (
                                  <Ionicons name="alert" size={14} color="#DC2626" />
                                ) : isSubmitted ? (
                                  <Ionicons name="time" size={14} color="#D97706" />
                                ) : (
                                  <Text style={styles.taskIndexText}>{subTask.orderNumber}</Text>
                                )}
                              </View>

                              {/* Task Info */}
                              <View style={styles.taskInfoCol}>
                                <View style={styles.taskTitleRow}>
                                  <Text
                                    style={[
                                      styles.taskItemTitle,
                                      isApproved && styles.taskItemTitleApproved,
                                    ]}
                                    numberOfLines={1}
                                  >
                                    {subTask.title}
                                  </Text>
                                </View>
                                <Text style={styles.taskItemSubText} numberOfLines={1}>
                                  KPI: {subTask.targetKpi || 'Nghiệm thu Vòng 1'}
                                </Text>
                                {hasRework && (
                                  <Text style={styles.reworkHintText} numberOfLines={1}>
                                    Leader yêu cầu sửa: "{subTask.leaderFeedback}"
                                  </Text>
                                )}
                              </View>

                              {/* Right Action / Status Chip */}
                              <View style={styles.taskActionCol}>
                                {isApproved ? (
                                  <View style={styles.chipApproved}>
                                    <Ionicons name="checkmark-circle" size={12} color="#059669" />
                                    <Text style={styles.chipApprovedText}>Duyệt V1</Text>
                                  </View>
                                ) : isSubmitted ? (
                                  <View style={styles.chipWaiting}>
                                    <Ionicons name="time" size={12} color="#D97706" />
                                    <Text style={styles.chipWaitingText}>Chờ duyệt</Text>
                                  </View>
                                ) : hasRework ? (
                                  <View style={styles.btnRework}>
                                    <Text style={styles.btnReworkText}>Sửa & Nộp</Text>
                                  </View>
                                ) : isProjectLocked ? (
                                  <View style={styles.chipLocked}>
                                    <Ionicons name="lock-closed" size={11} color="#64748B" />
                                    <Text style={styles.chipLockedText}>Đã khóa</Text>
                                  </View>
                                ) : (
                                  <View style={styles.btnSubmit}>
                                    <Text style={styles.btnSubmitText}>Nộp bài</Text>
                                  </View>
                                )}
                              </View>
                            </TouchableOpacity>
                          );
                        })
                      )}
                    </View>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>
      </View>

      {/* FULL PAGE DETAIL & SUBMISSION MODAL */}
      <Modal visible={activeItem !== null} animationType="slide" transparent={false}>
        <View style={styles.container}>
          <StatusBar barStyle="light-content" backgroundColor="#123826" />
          <View style={[styles.topSafeArea, { paddingTop: safeTopInset }]}>
            {/* Top Page Header */}
            <View style={styles.fullPageHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fullPageLevelTag}>
                  {activeItem?.project.projectName || activeItem?.project.levelName} • Việc con #
                  {activeItem?.subTask.orderNumber}
                </Text>
                <Text style={styles.fullPageTitle} numberOfLines={2}>
                  {activeItem?.subTask.title}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setActiveItem(null)} style={styles.fullPageCloseBtn}>
                <Ionicons name="close" size={20} color="#FFFFFF" />
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
              {/* FIRM LOCKED BANNER */}
              {isActiveProjectFirmApproved && (
                <View style={styles.modalFirmLockBanner}>
                  <Ionicons name="shield-checkmark" size={18} color="#059669" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalFirmLockTitle}>Dự Án Đã Nghiệm Thu Hoàn Tất</Text>
                    <Text style={styles.modalFirmLockText}>
                      Ban Giám Đốc / Firm đã nghiệm thu dự án này. Hồ sơ ở trạng thái lưu trữ (Read-only),
                      không thể chỉnh sửa báo cáo hoặc hình ảnh.
                    </Text>
                  </View>
                </View>
              )}

              {isActiveProjectSubmittedToAdmin && (
                <View style={styles.modalAdminWaitingBanner}>
                  <Ionicons name="lock-closed" size={18} color="#1E293B" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalAdminWaitingTitle}>Đang Chờ Firm Duyệt (Đã Khóa)</Text>
                    <Text style={styles.modalAdminWaitingText}>
                      Dự án đang trong quá trình thẩm định của Ban Giám Đốc. Toàn bộ đầu việc đã đóng băng.
                    </Text>
                  </View>
                </View>
              )}

              {/* Leader Approved Status Banner */}
              {!isActiveProjectLocked && isLeaderApproved && (
                <View style={styles.approvedBanner}>
                  <Ionicons name="checkmark-circle" size={18} color="#065F46" />
                  <Text style={styles.approvedBannerText}>
                    Leader đã duyệt Vòng 1. Đầu việc đã hoàn tất nhiệm vụ nội bộ.
                  </Text>
                </View>
              )}

              {/* Waiting Leader Review Lock Banner */}
              {!isActiveProjectLocked && isSubmittedWaitingLeader && (
                <View style={styles.submittedLockBanner}>
                  <View style={styles.submittedLockHeader}>
                    <Ionicons name="lock-closed" size={16} color="#D97706" />
                    <Text style={styles.submittedLockTitle}>Đang Chờ Leader Duyệt (Đã Khóa Chỉnh Sửa)</Text>
                  </View>
                  <Text style={styles.submittedLockText}>
                    Báo cáo và minh chứng của bạn đã được gửi tới Leader. Trong thời gian chờ Leader thẩm định, bạn
                    không thể chỉnh sửa nội dung hoặc thay đổi ảnh đính kèm.
                  </Text>
                </View>
              )}

              {/* Leader Feedback / Rework Notice */}
              {hasReworkRequest && (
                <View style={styles.leaderFeedbackBox}>
                  <View style={styles.leaderFeedbackHeader}>
                    <Ionicons name="alert-circle" size={18} color="#DC2626" />
                    <Text style={styles.leaderFeedbackTitle}>Yêu Cầu Sửa Đổi Từ Leader:</Text>
                  </View>
                  <Text style={styles.leaderFeedbackText}>"{activeItem?.subTask.leaderFeedback}"</Text>
                  <Text style={styles.leaderFeedbackGuide}>
                    Vui lòng điều chỉnh lại báo cáo, bổ sung minh chứng và bấm "CẬP NHẬT & NỘP LẠI".
                  </Text>
                </View>
              )}

              {/* KPI CARD */}
              <View style={styles.kpiCard}>
                <Text style={styles.kpiCardLabel}>MỤC TIÊU & CHỈ TIÊU NGHIỆM THU (KPI)</Text>
                <Text style={styles.kpiCardValue}>{activeItem?.subTask.targetKpi || 'Nghiệm thu theo quy chuẩn'}</Text>
                {activeItem?.subTask.description ? (
                  <Text style={styles.kpiCardDesc}>{activeItem?.subTask.description}</Text>
                ) : null}
              </View>

              {/* PHẦN 1: BÁO CÁO THỰC HIỆN */}
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionBlockTitle}>1. Báo Cáo Thực Hiện</Text>
                <Text style={styles.sectionBlockSub}>
                  Nhập tóm tắt kết quả, số liệu đạt được và ghi chú gửi Leader thẩm định
                </Text>

                <TextInput
                  style={[styles.formTextArea, !isEditable && styles.formInputDisabled]}
                  placeholder="Nhập nội dung báo cáo kết quả thực hiện..."
                  placeholderTextColor="#94A3B8"
                  value={resultText}
                  onChangeText={setResultText}
                  editable={isEditable}
                  multiline
                />
              </View>

              {/* PHẦN 2: MINH CHỨNG ĐÍNH KÈM */}
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionBlockTitle}>2. Kết Quả & Minh Chứng Đính Kèm</Text>
                <Text style={styles.sectionBlockSub}>
                  Đính kèm link tài liệu (Drive, Sheet) và hình ảnh thực tế
                </Text>

                {/* Link Input */}
                <Text style={styles.inputLabel}>Link tài liệu / Báo cáo online:</Text>
                <TextInput
                  style={[styles.formTextInput, !isEditable && styles.formInputDisabled]}
                  placeholder="https://drive.google.com/..."
                  placeholderTextColor="#94A3B8"
                  value={evidenceLink}
                  onChangeText={setEvidenceLink}
                  editable={isEditable}
                  autoCapitalize="none"
                />

                {/* Photos Attachment */}
                <View style={styles.photoSectionHeader}>
                  <Text style={styles.inputLabel}>Ảnh chụp minh chứng ({selectedImages.length}):</Text>
                  {isEditable && (
                    <TouchableOpacity style={styles.addPhotoBtn} onPress={handlePickImage} activeOpacity={0.8}>
                      <Ionicons name="image-outline" size={14} color="#2563EB" />
                      <Text style={styles.addPhotoBtnText}>Thêm ảnh</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {selectedImages.length > 0 ? (
                  <View style={styles.imageGrid}>
                    {selectedImages.map((imgUri, idx) => (
                      <View key={idx} style={styles.imageItemWrapper}>
                        <TouchableOpacity onPress={() => setPreviewImage(imgUri)} activeOpacity={0.8}>
                          <Image source={{ uri: imgUri }} style={styles.thumbnailImage} />
                        </TouchableOpacity>
                        {isEditable && (
                          <TouchableOpacity
                            style={styles.removePhotoBtn}
                            onPress={() => handleRemoveImage(idx)}
                          >
                            <Ionicons name="trash-outline" size={12} color="#FFFFFF" />
                          </TouchableOpacity>
                        )}
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.noImagesText}>Chưa có ảnh minh chứng nào.</Text>
                )}
              </View>

              {/* Submit Action Button */}
              <View style={styles.submitButtonBox}>
                {isActiveProjectFirmApproved ? (
                  <View style={styles.lockedFinalBtn}>
                    <Ionicons name="shield-checkmark" size={16} color="#065F46" />
                    <Text style={styles.lockedFinalBtnText}>DỰ ÁN ĐÃ ĐƯỢC FIRM NGHIỆM THU (KHÓA)</Text>
                  </View>
                ) : isActiveProjectSubmittedToAdmin ? (
                  <View style={styles.lockedFinalBtn}>
                    <Ionicons name="lock-closed" size={16} color="#475569" />
                    <Text style={styles.lockedFinalBtnText}>DỰ ÁN ĐANG CHỜ FIRM DUYỆT (KHÓA)</Text>
                  </View>
                ) : isEditable ? (
                  <TouchableOpacity
                    style={[styles.submitMainBtn, hasReworkRequest && { backgroundColor: '#DC2626' }]}
                    onPress={handleConfirmSubmit}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="send-outline" size={16} color="#FFFFFF" />
                    <Text style={styles.submitMainBtnText}>
                      {hasReworkRequest ? 'CẬP NHẬT & NỘP LẠI CHO LEADER' : 'NỘP BÁO CÁO & MINH CHỨNG'}
                    </Text>
                  </TouchableOpacity>
                ) : isSubmittedWaitingLeader ? (
                  <View style={styles.lockedStatusBtn}>
                    <Ionicons name="lock-closed" size={16} color="#92400E" />
                    <Text style={styles.lockedStatusBtnText}>ĐÃ NỘP - ĐANG CHỜ LEADER DUYỆT</Text>
                  </View>
                ) : (
                  <View style={styles.approvedStatusBtn}>
                    <Ionicons name="checkmark-circle" size={18} color="#065F46" />
                    <Text style={styles.approvedStatusBtnText}>LEADER ĐÃ DUYỆT VÒNG 1</Text>
                  </View>
                )}
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* FULL IMAGE PREVIEW MODAL */}
      <Modal visible={previewImage !== null} animationType="fade" transparent>
        <View style={styles.previewOverlay}>
          <TouchableOpacity onPress={() => setPreviewImage(null)} style={styles.previewCloseBtn}>
            <Ionicons name="close" size={18} color="#0F172A" />
            <Text style={styles.previewCloseBtnText}>Đóng</Text>
          </TouchableOpacity>
          {previewImage ? (
            <Image source={{ uri: previewImage }} style={styles.fullPreviewImage} resizeMode="contain" />
          ) : null}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#123826',
  },
  topSafeArea: {
    backgroundColor: '#123826',
  },
  bodyWrapper: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -8,
    overflow: 'hidden',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#123826',
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
    color: '#A7D8BE',
    marginTop: 2,
    fontWeight: '500',
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  summaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 12.5,
    color: '#71717A',
    fontWeight: '600',
    marginBottom: 4,
  },
  summaryNumber: {
    fontSize: 17,
    fontWeight: '800',
    color: '#18181B',
  },
  summaryNumberSub: {
    fontSize: 13,
    fontWeight: '600',
    color: '#10B981',
  },
  toggleAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  toggleAllBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#123826',
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 14,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
  summaryPillRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  summaryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5.5,
    borderRadius: 8,
    borderWidth: 1,
  },
  pillPending: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FEE2E2',
  },
  pillPendingText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#EF4444',
  },
  pillWaiting: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FEF3C7',
  },
  pillWaitingText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#F59E0B',
  },
  pillDone: {
    backgroundColor: '#ECFDF5',
    borderColor: '#D1FAE5',
  },
  pillDoneText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#10B981',
  },
  sectionHeaderRow: {
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  sectionHeaderTitleCol: {
    gap: 3,
  },
  sectionHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#18181B',
    letterSpacing: -0.2,
  },
  sectionHeaderPill: {
    backgroundColor: '#F4F4F5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  sectionHeaderPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#71717A',
  },
  sectionHeaderHelp: {
    fontSize: 12,
    color: '#71717A',
    fontWeight: '500',
  },
  projectCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  projectCardFirmApproved: {
    borderColor: '#A7F3D0',
    backgroundColor: '#FCFDFE',
  },
  projectCardSubmittedAdmin: {
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
  },
  projectHeaderTouchable: {
    padding: 14,
  },
  projectHeaderTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  projectTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    marginBottom: 2,
  },
  projectNameText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  levelBadgeMini: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  levelBadgeMiniText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  projectDeptSub: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },
  projectStatusAndChevron: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badgeFirmApproved: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  badgeFirmApprovedText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#059669',
  },
  badgeSubmittedAdmin: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  badgeSubmittedAdminText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#475569',
  },
  badgeAllDone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  badgeAllDoneText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#059669',
  },
  badgeActive: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  badgeActiveText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#2563EB',
  },
  projectProgressRow: {
    marginTop: 2,
  },
  projectProgressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  projectProgressLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  projectProgressRatio: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
  },
  projectProgressTrack: {
    height: 5,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  projectProgressFill: {
    height: '100%',
    backgroundColor: '#2563EB',
    borderRadius: 3,
  },
  projectRewardSection: {
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 6,
  },
  rewardCashRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  rewardCashLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rewardCashLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  rewardCashTotal: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  rewardUserSharePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  rewardUserShareLabel: {
    fontSize: 11,
    color: '#065F46',
    fontWeight: '600',
  },
  rewardUserShareAmount: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#047857',
  },
  rewardPhysicalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  rewardPhysicalLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  rewardPhysicalValue: {
    fontSize: 11.5,
    color: '#1E293B',
    fontWeight: '600',
  },
  firmApprovedNoticeBox: {
    backgroundColor: '#ECFDF5',
    borderBottomWidth: 1,
    borderBottomColor: '#A7F3D0',
    padding: 12,
  },
  submittedAdminNoticeBox: {
    backgroundColor: '#F1F5F9',
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
    padding: 12,
  },
  firmNoticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  firmNoticeTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#065F46',
  },
  firmNoticeText: {
    fontSize: 11.5,
    color: '#047857',
    lineHeight: 16,
  },
  firmFeedbackText: {
    fontSize: 11,
    fontStyle: 'italic',
    color: '#065F46',
    marginTop: 4,
  },
  submittedAdminTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E293B',
  },
  submittedAdminText: {
    fontSize: 11.5,
    color: '#475569',
    lineHeight: 16,
  },
  tasksContainer: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  tasksHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tasksHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  tasksHeaderOrderHint: {
    fontSize: 10,
    color: '#94A3B8',
  },
  noTasksBox: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  noTasksText: {
    fontSize: 12,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  taskItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  taskItemRework: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  taskItemSubmitted: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  taskItemApproved: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  taskIndexCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  taskIndexCircleApproved: {
    backgroundColor: '#ECFDF5',
  },
  taskIndexCircleRework: {
    backgroundColor: '#FEE2E2',
  },
  taskIndexCircleSubmitted: {
    backgroundColor: '#FEF3C7',
  },
  taskIndexText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#64748B',
  },
  taskInfoCol: {
    flex: 1,
    marginRight: 8,
  },
  taskTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  taskItemTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 18,
  },
  taskItemTitleApproved: {
    color: '#64748B',
  },
  taskItemSubText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  reworkHintText: {
    fontSize: 10.5,
    color: '#DC2626',
    marginTop: 2,
    fontStyle: 'italic',
  },
  taskActionCol: {
    alignItems: 'flex-end',
  },
  btnSubmit: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  btnSubmitText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
  },
  btnRework: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  btnReworkText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
  },
  chipApproved: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  chipApprovedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  chipWaiting: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  chipWaitingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
  chipLocked: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipLockedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  emptyCard: {
    paddingVertical: 56,
    paddingHorizontal: 24,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  emptyIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#18181B',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 13,
    color: '#71717A',
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 320,
  },
  fullPageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#123826',
  },
  fullPageLevelTag: {
    fontSize: 11,
    fontWeight: '700',
    color: '#A7D8BE',
    marginBottom: 2,
  },
  fullPageTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 22,
  },
  fullPageCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  fullPageBody: {
    flex: 1,
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  modalFirmLockBanner: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  modalFirmLockTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#065F46',
    marginBottom: 2,
  },
  modalFirmLockText: {
    fontSize: 12,
    color: '#047857',
    lineHeight: 16,
  },
  modalAdminWaitingBanner: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  modalAdminWaitingTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 2,
  },
  modalAdminWaitingText: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 16,
  },
  approvedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ECFDF5',
    padding: 12,
    borderRadius: 10,
    marginBottom: 14,
  },
  approvedBannerText: {
    fontSize: 13,
    color: '#065F46',
    fontWeight: '700',
    lineHeight: 18,
  },
  submittedLockBanner: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  submittedLockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  submittedLockTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B45309',
  },
  submittedLockText: {
    fontSize: 12,
    color: '#92400E',
    lineHeight: 17,
  },
  leaderFeedbackBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  leaderFeedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  leaderFeedbackTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#DC2626',
  },
  leaderFeedbackText: {
    fontSize: 12.5,
    color: '#1E293B',
    fontStyle: 'italic',
    lineHeight: 18,
    marginBottom: 4,
  },
  leaderFeedbackGuide: {
    fontSize: 11,
    color: '#7F1D1D',
    lineHeight: 16,
  },
  kpiCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  kpiCardLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  kpiCardValue: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
  },
  kpiCardDesc: {
    fontSize: 12,
    color: '#475569',
    marginTop: 4,
    lineHeight: 17,
  },
  sectionBlock: {
    marginBottom: 18,
  },
  sectionBlockTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  sectionBlockSub: {
    fontSize: 11.5,
    color: '#64748B',
    marginBottom: 8,
  },
  formTextArea: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    padding: 12,
    fontSize: 13.5,
    color: '#0F172A',
    height: 95,
    textAlignVertical: 'top',
  },
  inputLabel: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '700',
    marginBottom: 4,
  },
  formTextInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    color: '#0F172A',
    marginBottom: 12,
  },
  photoSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  addPhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  addPhotoBtnText: {
    fontSize: 11.5,
    color: '#2563EB',
    fontWeight: '700',
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  imageItemWrapper: {
    position: 'relative',
  },
  thumbnailImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
  },
  removePhotoBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noImagesText: {
    fontSize: 12,
    color: '#94A3B8',
    fontStyle: 'italic',
    marginTop: 4,
  },
  submitButtonBox: {
    marginTop: 10,
    paddingBottom: 20,
  },
  submitMainBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 13,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitMainBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
  },
  lockedFinalBtn: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingVertical: 13,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  lockedFinalBtnText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '800',
  },
  lockedStatusBtn: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingVertical: 13,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  lockedStatusBtnText: {
    color: '#92400E',
    fontSize: 12.5,
    fontWeight: '800',
  },
  approvedStatusBtn: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingVertical: 13,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  approvedStatusBtnText: {
    color: '#065F46',
    fontSize: 12.5,
    fontWeight: '800',
  },
  formInputDisabled: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
    color: '#64748B',
  },
  previewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  previewCloseBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    zIndex: 10,
  },
  previewCloseBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  fullPreviewImage: {
    width: '100%',
    height: '75%',
  },
});
