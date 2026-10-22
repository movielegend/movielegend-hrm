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
      const roleCodes = (user?.roles || []).map((r: any) =>
        String(typeof r === 'string' ? r : r?.code || r?.name || '').toUpperCase()
      );
      if (roleCodes.some(c => c === 'HR' || c.includes('HR_'))) {
        router.replace('/hr' as any);
      } else if (roleCodes.some(c => c === 'LEADER')) {
        router.replace('/leader' as any);
      } else if (roleCodes.some(c => c === 'ADMIN' || c === 'SUPER_ADMIN')) {
        router.replace('/admin/(tabs)' as any);
      } else {
        router.replace('/employee' as any);
      }
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
      <StatusBar barStyle="light-content" backgroundColor="#102739" />
      <View style={[styles.topSafeArea, { paddingTop: safeTopInset }]}>
        {/* Top Header matching Image 1 */}
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
          contentContainerStyle={[styles.scroll, { paddingBottom: 60 + Math.max(insets.bottom, 24) }]}
          showsVerticalScrollIndicator={false}
        >
          {/* CARD 1: TIẾN ĐỘ THĂNG CẤP (Matching Image 1) */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Tiến độ thăng cấp</Text>
            <View style={styles.summaryBigRow}>
              <Text style={styles.summaryBigNum}>
                {approvedTasks}/{totalTasks}
              </Text>
              <Text style={styles.summaryBigPercent}>
                {' '}hoàn thành • {progressPercent}%
              </Text>
            </View>

            {/* Linear Progress Bar */}
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progressPercent}%` as any }]} />
            </View>

            {/* 3 Metric Pills */}
            <View style={styles.summaryPillRow}>
              <View style={[styles.summaryPill, styles.pillPending]}>
                <View style={[styles.statusDot, { backgroundColor: '#EF4444' }]} />
                <Text style={styles.pillPendingText}>{pendingActionTasks} Chưa nộp</Text>
              </View>

              <View style={[styles.summaryPill, styles.pillWaiting]}>
                <View style={[styles.statusDot, { backgroundColor: '#F59E0B' }]} />
                <Text style={styles.pillWaitingText}>{submittedWaitingTasks} Chờ duyệt</Text>
              </View>

              <View style={[styles.summaryPill, styles.pillDone]}>
                <View style={[styles.statusDot, { backgroundColor: '#10B981' }]} />
                <Text style={styles.pillDoneText}>{approvedTasks} Đã duyệt</Text>
              </View>
            </View>
          </View>

          {/* SECTION: DỰ ÁN CỦA BẠN (Matching Image 1) */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeaderTitle}>Dự án của bạn</Text>
            <View style={styles.sectionHeaderPill}>
              <Text style={styles.sectionHeaderPillText}>{involvedProjects.length}</Text>
            </View>
          </View>

          {/* PROJECT LIST ACCORDION */}
          {involvedProjects.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="folder-outline" size={44} color="#102739" />
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
                (typeof (proj as any).promotionBonusAmount === 'number' && (proj as any).promotionBonusAmount > 0
                  ? (proj as any).promotionBonusAmount
                  : proj.rewardItem
                  ? Number(proj.rewardItem.replace(/\./g, '').match(/(\d+)\s*VNĐ/i)?.[1] || 0)
                  : 1000000);
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
                cashPool > 0 ? Math.round((userMultiplier / totalWeight) * cashPool) : 1000000;

              return (
                <View key={proj.id || proj.levelNumber} style={styles.projectCard}>
                  {/* PROJECT HEADER ACCORDION ROW */}
                  <TouchableOpacity
                    style={styles.projectHeaderTouchable}
                    onPress={() => toggleProjectAccordion(proj.levelNumber)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.projectHeaderTopRow}>
                      <Text style={styles.projectNameText} numberOfLines={1}>
                        {proj.projectName || `Dự án ${proj.departmentName || 'Phòng ban'}`}
                      </Text>

                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <View style={styles.badgeActivePill}>
                          <Text style={styles.badgeActivePillText}>
                            {projPending > 0 ? `${projPending} việc cần nộp` : isAllUserTasksDone ? 'Hoàn thành' : 'Đang làm'}
                          </Text>
                        </View>
                        <Ionicons
                          name={isCollapsed ? 'chevron-down' : 'chevron-up'}
                          size={18}
                          color="#0F172A"
                        />
                      </View>
                    </View>

                    {/* Level Pill Badge */}
                    <View style={styles.levelBadgeMini}>
                      <Text style={styles.levelBadgeMiniText}>Lv.{userLevel} ({userMultiplier}x)</Text>
                    </View>

                    {/* Department Subtitle */}
                    <Text style={styles.projectDeptSub}>
                      {proj.departmentName || 'DEV (MOVIELEGEND-HÀ NỘI)'}
                    </Text>

                    {/* Progress within Project */}
                    <View style={styles.projectProgressSection}>
                      <View style={styles.projectProgressTextRow}>
                        <Text style={styles.projectProgressLabel}>Tiến độ đầu việc</Text>
                        <Text style={styles.projectProgressRatio}>
                          {projApproved}/{projTotal} ({projProgressPercent}%)
                        </Text>
                      </View>
                      <View style={styles.projectProgressTrack}>
                        <View
                          style={[
                            styles.projectProgressFill,
                            { width: `${projProgressPercent}%` as any },
                          ]}
                        />
                      </View>
                    </View>
                  </TouchableOpacity>

                  {/* PROJECT REWARD 2 COLS (QUỸ DỰ ÁN | PHẦN BẠN DỰ KIẾN) */}
                  <View style={styles.projectRewardSection}>
                    <View style={styles.rewardColItem}>
                      <Text style={styles.rewardColLabel}>Quỹ dự án</Text>
                      <Text style={styles.rewardColAmount}>
                        {cashPool > 0
                          ? cashPool.toLocaleString('vi-VN') + ' VNĐ'
                          : physicalItems.length > 0
                          ? physicalItems.join(', ')
                          : '1.000.000 VNĐ'}
                      </Text>
                    </View>

                    <View style={styles.rewardColDivider} />

                    <View style={styles.rewardColItem}>
                      <Text style={styles.rewardColLabel}>Phần bạn dự kiến</Text>
                      <Text style={styles.rewardColAmount}>
                        ~{estimatedCashShare.toLocaleString('vi-VN')} đ
                      </Text>
                    </View>
                  </View>

                  {/* EXPANDABLE SUBTASKS LIST */}
                  {!isCollapsed && (
                    <View style={styles.tasksContainer}>
                      <View style={styles.tasksHeaderRow}>
                        <Text style={styles.tasksHeaderTitle}>
                          Đầu việc thực hiện ({sortedTasks.length})
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
                          const formattedOrder = String(subTask.orderNumber).padStart(2, '0');

                          return (
                            <TouchableOpacity
                              key={subTask.id}
                              style={styles.taskItemRow}
                              onPress={() => handleOpenDetail(item)}
                              activeOpacity={0.7}
                            >
                              {/* Order Badge */}
                              <View style={styles.taskIndexCircle}>
                                <Text style={styles.taskIndexText}>{formattedOrder}</Text>
                              </View>

                              {/* Task Info */}
                              <View style={styles.taskInfoCol}>
                                <Text style={styles.taskItemTitle} numberOfLines={1}>
                                  {subTask.title}
                                </Text>
                                <Text style={styles.taskItemSubText} numberOfLines={1}>
                                  KPI: {subTask.targetKpi || 'Đạt 100% mục tiêu đề ra'}
                                </Text>
                                {hasRework && (
                                  <Text style={styles.reworkHintText} numberOfLines={1}>
                                    Leader yêu cầu sửa: "{subTask.leaderFeedback}"
                                  </Text>
                                )}
                              </View>

                              {/* Right Action / Status */}
                              <View style={styles.taskActionCol}>
                                {isApproved ? (
                                  <View style={styles.chipApproved}>
                                    <Text style={styles.chipApprovedText}>Đã duyệt</Text>
                                  </View>
                                ) : isSubmitted ? (
                                  <View style={styles.chipWaiting}>
                                    <Text style={styles.chipWaitingText}>Chờ duyệt</Text>
                                  </View>
                                ) : hasRework ? (
                                  <View style={styles.btnRework}>
                                    <Text style={styles.btnReworkText}>Sửa & Nộp</Text>
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

      {/* FULL PAGE DETAIL & SUBMISSION MODAL (MATCHING IMAGE 2 TEMPLATE) */}
      <Modal visible={activeItem !== null} animationType="slide" transparent={false}>
        <View style={styles.container}>
          <StatusBar barStyle="light-content" backgroundColor="#102739" />
          <View style={[styles.topSafeArea, { paddingTop: safeTopInset }]}>
            {/* Top Page Header matching Image 2 */}
            <View style={styles.fullPageHeader}>
              <View style={{ width: 32 }} />
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={styles.fullPageHeaderTitle}>Nộp báo cáo</Text>
                <Text style={styles.fullPageHeaderSub}>
                  {activeItem?.project.projectName || `Dự án ${activeItem?.project.departmentName || 'DEV'}`} • Việc con #{activeItem?.subTask.orderNumber}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setActiveItem(null)} style={styles.fullPageCloseBtn}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <ScrollView
              style={styles.fullPageBody}
              contentContainerStyle={{ padding: 16, paddingBottom: 160 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Leader Feedback / Rework Notice if any */}
              {hasReworkRequest && (
                <View style={styles.leaderFeedbackBox}>
                  <View style={styles.leaderFeedbackHeader}>
                    <Ionicons name="alert-circle" size={18} color="#DC2626" />
                    <Text style={styles.leaderFeedbackTitle}>Yêu Cầu Sửa Đổi Từ Leader:</Text>
                  </View>
                  <Text style={styles.leaderFeedbackText}>"{activeItem?.subTask.leaderFeedback}"</Text>
                </View>
              )}

              {/* CARD 1: THÔNG TIN ĐẦU VIỆC & MỤC TIÊU KPI (Matching Image 2) */}
              <View style={styles.templateModalCard}>
                <Text style={styles.modalTaskMainTitle}>
                  {activeItem?.subTask.title}
                </Text>
                <Text style={styles.modalTaskDeptSub}>
                  {activeItem?.project.departmentName || 'DEV (MOVIELEGEND-HÀ NỘI)'}
                </Text>

                {/* Light Blue KPI Box */}
                <View style={styles.modalKpiBox}>
                  <Text style={styles.modalKpiLabel}>MỤC TIÊU NGHIỆM THU (KPI)</Text>
                  <Text style={styles.modalKpiValue}>
                    {activeItem?.subTask.targetKpi || 'Đạt 100% mục tiêu đề ra'}
                  </Text>
                  <Text style={styles.modalKpiDesc}>
                    {activeItem?.subTask.description || 'Chi tiết các hạng mục và tiêu chuẩn nghiệm thu'}
                  </Text>
                </View>
              </View>

              {/* CARD 2: 1. BÁO CÁO THỰC HIỆN (Matching Image 2) */}
              <View style={styles.templateModalCard}>
                <Text style={styles.modalSectionTitle}>1. Báo cáo thực hiện</Text>
                <Text style={styles.modalSectionSub}>
                  Tóm tắt kết quả, số liệu và ghi chú gửi Leader thẩm định.
                </Text>

                <TextInput
                  style={styles.modalTextArea}
                  placeholder="Nhập nội dung báo cáo..."
                  placeholderTextColor="#94A3B8"
                  value={resultText}
                  onChangeText={setResultText}
                  editable={isEditable}
                  multiline
                />
              </View>

              {/* CARD 3: 2. KẾT QUẢ & MINH CHỨNG (Matching Image 2) */}
              <View style={styles.templateModalCard}>
                <Text style={styles.modalSectionTitle}>2. Kết quả & minh chứng</Text>
                <Text style={styles.modalSectionSub}>
                  Đính kèm link tài liệu (Drive, Sheet) và hình ảnh thực tế.
                </Text>

                {/* Link Input */}
                <Text style={styles.modalInputLabel}>Link tài liệu / Báo cáo online</Text>
                <TextInput
                  style={styles.modalTextInput}
                  placeholder="https://drive.google.com/..."
                  placeholderTextColor="#94A3B8"
                  value={evidenceLink}
                  onChangeText={setEvidenceLink}
                  editable={isEditable}
                  autoCapitalize="none"
                />

                {/* Evidence Photos Header Row */}
                <View style={styles.modalPhotoHeaderRow}>
                  <Text style={styles.modalInputLabel}>
                    Ảnh minh chứng ({selectedImages.length})
                  </Text>
                  {isEditable && (
                    <TouchableOpacity
                      style={styles.modalAddPhotoBtn}
                      onPress={handlePickImage}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="image-outline" size={14} color="#2563EB" />
                      <Text style={styles.modalAddPhotoBtnText}>Thêm ảnh</Text>
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

              {/* BOTTOM SUBMIT BUTTON (Matching Image 2) */}
              <TouchableOpacity
                style={styles.modalBottomSubmitBtn}
                onPress={handleConfirmSubmit}
                activeOpacity={0.85}
              >
                <Text style={styles.modalBottomSubmitBtnText}>
                  {hasReworkRequest ? 'Cập nhật & Nộp lại cho Leader' : 'Nộp báo cáo & minh chứng'}
                </Text>
              </TouchableOpacity>
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
    backgroundColor: '#102739',
  },
  topSafeArea: {
    backgroundColor: '#102739',
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
    color: '#102739',
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
    backgroundColor: '#102739',
  },
  fullPageLevelTag: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94B5CB',
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

  /* STYLES MATCHING IMAGE TEMPLATE (NHIỆM VỤ CẤP BẬC & NỘP BÁO CÁO) */
  summaryBigRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 4,
    marginBottom: 12,
  },
  summaryBigNum: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
  },
  summaryBigPercent: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0D9488',
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginRight: 6,
  },
  badgeActivePill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeActivePillText: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '700',
  },
  projectProgressSection: {
    marginTop: 10,
  },
  rewardColItem: {
    flex: 1,
  },
  rewardColLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  rewardColAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 3,
  },
  rewardColDivider: {
    width: 1,
    backgroundColor: '#E2E8F0',
    height: 36,
    marginHorizontal: 14,
  },
  fullPageHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  fullPageHeaderSub: {
    fontSize: 12,
    color: '#94B5CB',
    marginTop: 2,
  },
  templateModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    padding: 16,
    marginBottom: 14,
  },
  modalTaskMainTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalTaskDeptSub: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  modalKpiBox: {
    backgroundColor: '#F0F9FF',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E0F2FE',
  },
  modalKpiLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  modalKpiValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 3,
  },
  modalKpiDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 3,
  },
  modalSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSectionSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 3,
    marginBottom: 10,
  },
  modalTextArea: {
    minHeight: 110,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
    textAlignVertical: 'top',
  },
  modalInputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  modalTextInput: {
    height: 44,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
  },
  modalPhotoHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    marginBottom: 8,
  },
  modalAddPhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  modalAddPhotoBtnText: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '700',
  },
  modalBottomSubmitBtn: {
    backgroundColor: '#102739',
    height: 50,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  modalBottomSubmitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },

});
