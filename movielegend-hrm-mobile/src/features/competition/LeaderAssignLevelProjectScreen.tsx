import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Modal,
  TextInput,
  StatusBar,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuth } from '../../providers/AuthProvider';
import { useScopedEmployees } from '../../hooks/useEmployees';
import {
  useLevelProjects,
  BulletSubTask,
  LevelDepartmentProject,
} from '../leveling/levelProjectsStore';

export const LeaderAssignLevelProjectScreen: React.FC = () => {
  const { user } = useAuth();
  const currentLeaderId = user?.id || 'leader-me';
  const currentLeaderName = user?.fullName || 'Trưởng nhóm (Tôi)';
  const leaderDeptId = (user as any)?.departmentId || user?.department?.id;
  const leaderDeptName = user?.department?.name || (user as any)?.departmentName;

  const {
    projects,
    getProjectByLevel,
    acceptProject,
    assignSubTask,
    approveSubTask,
    rejectSubTask,
    submitProjectToAdmin,
  } = useLevelProjects(leaderDeptId, leaderDeptName);

  const [selectedLevelNumber, setSelectedLevelNumber] = useState<number>(1);
  const currentProject: LevelDepartmentProject | undefined = getProjectByLevel(selectedLevelNumber);

  // Quick Filter State
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SUBMITTED' | 'ASSIGNED' | 'LEADER_APPROVED' | 'UNASSIGNED'>('ALL');

  // Detail Page / Modal State
  const [activeSubTask, setActiveSubTask] = useState<BulletSubTask | null>(null);
  const [leaderFeedbackText, setLeaderFeedbackText] = useState('');
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

  // Handle Leader accepts project from Admin
  const handleAcceptProject = () => {
    acceptProject(selectedLevelNumber);
    Alert.alert('Thành Công', `Đã tiếp nhận dự án ${currentProject?.levelName}.`);
  };

  // Open modal for a task
  const handleOpenTaskModal = (task: BulletSubTask) => {
    setActiveSubTask(task);
    setLeaderFeedbackText(task.leaderFeedback || '');
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
    Alert.alert('Thành Công', `Đã giao việc cho ${assignName}.`);
  };

  // Handle approving subtask (Vòng 1 - Chưa nâng cấp bậc trực tiếp)
  const handleApproveSubTask = (subTaskId: string) => {
    approveSubTask(selectedLevelNumber, subTaskId, leaderFeedbackText.trim() || undefined);
    setActiveSubTask((prev) =>
      prev ? { ...prev, status: 'LEADER_APPROVED', leaderApprovedAt: new Date().toISOString(), leaderFeedback: leaderFeedbackText.trim() || undefined } : null
    );
    Alert.alert(
      'Duyệt Vòng 1 Thành Công',
      'Đã duyệt Vòng 1 đầu mục công việc. Kết quả được lưu vào hồ sơ để Ban Giám Đốc / Admin xét duyệt nâng cấp bậc tại cuộc họp cuối tháng.'
    );
  };

  // Handle rejecting / requesting rework
  const handleRejectSubTask = (subTaskId: string) => {
    if (!leaderFeedbackText.trim()) {
      Alert.alert('Yêu cầu lý do', 'Vui lòng nhập ghi chú / lý do cần sửa lại để nhân sự biết điểm cần hoàn thiện.');
      return;
    }

    rejectSubTask(selectedLevelNumber, subTaskId, leaderFeedbackText.trim());
    setActiveSubTask((prev) =>
      prev ? { ...prev, status: 'ASSIGNED', leaderFeedback: leaderFeedbackText.trim() } : null
    );
    Alert.alert('Đã gửi phản hồi', 'Đã chuyển trạng thái việc con về Đang làm để nhân sự cập nhật lại báo cáo.');
  };

  // Handle submitting project to Admin
  const handleSubmitProjectToAdmin = () => {
    if (!adminReportText.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tóm tắt báo cáo kết quả nghiệm thu');
      return;
    }

    submitProjectToAdmin(selectedLevelNumber, adminReportText.trim(), adminReportUrl.trim() || undefined);
    setSubmitAdminModalVisible(false);
    Alert.alert('Thành Công', `Đã gửi báo cáo nghiệm thu ${currentProject?.levelName} lên Ban Giám Đốc.`);
  };

  if (!currentProject) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ padding: 20 }}>
          <Text style={{ fontSize: 16, color: '#64748B' }}>Không tìm thấy dự án cấp bậc.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const subTasks = currentProject.subTasks || [];
  const totalSubTasks = subTasks.length;
  const approvedSubTasks = subTasks.filter((t) => t.status === 'LEADER_APPROVED').length;
  const progressPercent = totalSubTasks > 0 ? Math.round((approvedSubTasks / totalSubTasks) * 100) : 0;

  const countPending = subTasks.filter((t) => t.status === 'SUBMITTED').length;
  const countAssigned = subTasks.filter((t) => t.status === 'ASSIGNED').length;
  const countApproved = approvedSubTasks;
  const countUnassigned = subTasks.filter((t) => t.status === 'UNASSIGNED').length;

  const filteredSubTasks = useMemo(() => {
    if (statusFilter === 'ALL') return subTasks;
    return subTasks.filter((t) => t.status === statusFilter);
  }, [subTasks, statusFilter]);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.topSafeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#0F766E" />

        {/* Top Header with Deep Teal Background */}
        <View style={styles.topHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Dự Án Cấp Bậc</Text>
          </View>
          {currentProject.status === 'IN_PROGRESS' && (
            <TouchableOpacity
              style={styles.headerSubmitBtn}
              onPress={() => setSubmitAdminModalVisible(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.headerSubmitBtnText}>Nộp Admin</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>

      <View style={styles.bodyWrapper}>
        {/* Level Selector with Smart Badges */}
        <View style={styles.levelSelectorContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.levelSelectorScroll}>
          {projects.map((proj) => {
            const isSelected = proj.levelNumber === selectedLevelNumber;
            const projPendingCount = proj.subTasks.filter((t) => t.status === 'SUBMITTED').length;

            return (
              <TouchableOpacity
                key={proj.id}
                style={[styles.levelItem, isSelected && styles.levelItemActive]}
                onPress={() => {
                  setSelectedLevelNumber(proj.levelNumber);
                  setStatusFilter('ALL');
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.levelText, isSelected && styles.levelTextActive]}>
                  {proj.levelName}
                </Text>
                {projPendingCount > 0 && (
                  <View style={[styles.levelBadge, isSelected && styles.levelBadgeActive]}>
                    <Text style={[styles.levelBadgeText, isSelected && styles.levelBadgeTextActive]}>
                      {projPendingCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Project Summary & Progress */}
        <View style={styles.projectSummary}>
          <Text style={styles.projectName}>{currentProject.projectName}</Text>
          <View style={styles.progressRow}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
            </View>
            <Text style={styles.progressLabel}>{approvedSubTasks}/10 hoàn thành</Text>
          </View>

          {currentProject.status === 'PENDING_LEADER_ACCEPT' && (
            <TouchableOpacity
              style={styles.acceptBtn}
              onPress={handleAcceptProject}
              activeOpacity={0.8}
            >
              <Text style={styles.acceptBtnText}>Tiếp nhận dự án {currentProject.levelName}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Quick Filter Segmented Control */}
        <View style={styles.filterSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            <TouchableOpacity
              style={[styles.filterChip, statusFilter === 'ALL' && styles.filterChipActive]}
              onPress={() => setStatusFilter('ALL')}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterChipText, statusFilter === 'ALL' && styles.filterChipTextActive]}>
                Tất cả ({totalSubTasks})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterChip,
                statusFilter === 'SUBMITTED' && styles.filterChipActive,
                countPending > 0 && statusFilter !== 'SUBMITTED' && styles.filterChipPendingAlert,
              ]}
              onPress={() => setStatusFilter('SUBMITTED')}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterChipText,
                  statusFilter === 'SUBMITTED' && styles.filterChipTextActive,
                  countPending > 0 && statusFilter !== 'SUBMITTED' && { color: '#B45309', fontWeight: 'bold' },
                ]}
              >
                Chờ duyệt V1 ({countPending})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterChip, statusFilter === 'ASSIGNED' && styles.filterChipActive]}
              onPress={() => setStatusFilter('ASSIGNED')}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterChipText, statusFilter === 'ASSIGNED' && styles.filterChipTextActive]}>
                Đang làm ({countAssigned})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterChip, statusFilter === 'LEADER_APPROVED' && styles.filterChipActive]}
              onPress={() => setStatusFilter('LEADER_APPROVED')}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterChipText, statusFilter === 'LEADER_APPROVED' && styles.filterChipTextActive]}>
                Đã duyệt V1 ({countApproved})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterChip, statusFilter === 'UNASSIGNED' && styles.filterChipActive]}
              onPress={() => setStatusFilter('UNASSIGNED')}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterChipText, statusFilter === 'UNASSIGNED' && styles.filterChipTextActive]}>
                Chưa giao ({countUnassigned})
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Subtask Rows */}
        <View style={styles.listContainer}>
          {filteredSubTasks.length === 0 ? (
            <View style={styles.emptyFilterBox}>
              <Text style={styles.emptyFilterText}>Không có việc con nào ở trạng thái này.</Text>
            </View>
          ) : (
            filteredSubTasks.map((st) => {
              const isApproved = st.status === 'LEADER_APPROVED';
              const isSubmitted = st.status === 'SUBMITTED';
              const isAssigned = st.status === 'ASSIGNED';
              const hasEvidence = Boolean(st.evidenceUrl) || Boolean(st.evidenceImages && st.evidenceImages.length > 0);

              return (
                <TouchableOpacity
                  key={st.id}
                  style={[
                    styles.taskRow,
                    isSubmitted && styles.taskRowSubmitted,
                  ]}
                  onPress={() => handleOpenTaskModal(st)}
                  activeOpacity={0.7}
                >
                  {/* Index / Done indicator */}
                  <View style={[styles.indexCircle, isSubmitted && { backgroundColor: '#FEF3C7' }]}>
                    <Text
                      style={[
                        styles.indexText,
                        isApproved && { color: '#059669', fontWeight: 'bold' },
                        isSubmitted && { color: '#B45309', fontWeight: 'bold' },
                      ]}
                    >
                      {isApproved ? '✓' : st.orderNumber}
                    </Text>
                  </View>

                  {/* Title, Assignee & Submitter info */}
                  <View style={styles.titleCol}>
                    <Text style={[styles.taskTitle, isApproved && styles.taskTitleDone]} numberOfLines={1}>
                      {st.title}
                    </Text>
                    <View style={styles.assigneeRow}>
                      <Text
                        style={[
                          styles.assigneeText,
                          st.assignedToUserId === currentLeaderId && styles.assigneeTextMe,
                        ]}
                      >
                        {st.assignedToUserId === currentLeaderId
                          ? `${st.assignedToUserName || 'Tôi'} (Chính tôi)`
                          : (st.assignedToUserName || 'Chưa giao')}
                      </Text>
                      {st.assignedToUserId === currentLeaderId && (
                        <View style={styles.selfMiniBadge}>
                          <Text style={styles.selfMiniBadgeText}>Leader</Text>
                        </View>
                      )}
                      {isSubmitted && (
                        <Text style={styles.submittedHintText}>• Đã nộp bài</Text>
                      )}
                      {isSubmitted && hasEvidence && (
                        <Text style={styles.evidenceHintTag}>[Có minh chứng]</Text>
                      )}
                    </View>
                  </View>

                  {/* Right Status Button */}
                  <View style={styles.statusCol}>
                    {isApproved ? (
                      <Text style={styles.tagGreen}>Đã duyệt V1</Text>
                    ) : isSubmitted ? (
                      <View style={styles.btnAmber}>
                        <Text style={styles.btnAmberText}>Duyệt V1</Text>
                      </View>
                    ) : isAssigned ? (
                      <Text style={styles.tagBlue}>Đang làm</Text>
                    ) : (
                      <Text style={styles.tagGray}>Giao việc</Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
      </View>

      {/* EXPANDABLE FULL PAGE DETAIL & APPROVAL MODAL */}
      <Modal visible={activeSubTask !== null} animationType="slide" transparent={false}>
        <View style={styles.container}>
          <SafeAreaView style={styles.topSafeArea}>
            <StatusBar barStyle="light-content" backgroundColor="#2563EB" />

            {/* Top Page Header */}
            <View style={styles.fullPageHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fullPageLevelTag}>
                  Việc con #{activeSubTask?.orderNumber} • {currentProject.levelName}
                </Text>
                <Text style={styles.fullPageTitle}>{activeSubTask?.title}</Text>
              </View>
              <TouchableOpacity onPress={() => setActiveSubTask(null)} style={styles.fullPageCloseBtn}>
                <Text style={styles.fullPageCloseBtnText}>Đóng</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>

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
              {/* KPI Requirements Banner */}
              {activeSubTask?.targetKpi ? (
                <View style={styles.kpiCard}>
                  <Text style={styles.kpiCardLabel}>Chỉ tiêu KPI yêu cầu:</Text>
                  <Text style={styles.kpiCardValue}>{activeSubTask.targetKpi}</Text>
                  {activeSubTask.description ? (
                    <Text style={styles.kpiCardDesc}>{activeSubTask.description}</Text>
                  ) : null}
                </View>
              ) : null}

              {/* PHẦN BÁO CÁO THỰC HIỆN: Chỉ hiển thị khi nhân viên đã nộp hoặc đã duyệt */}
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

              {/* PHẦN PHÂN CÔNG NHÂN SỰ */}
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
                          : 'Bấm để tự nhận việc và nộp kết quả nghiệm thu'}
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

      {/* FULL PAGE SUBMIT ADMIN MODAL (KÉO LÊN TRANG MỚI) */}
      <Modal visible={submitAdminModalVisible} animationType="slide" transparent={false}>
        <View style={styles.container}>
          <SafeAreaView style={styles.topSafeArea}>
            <StatusBar barStyle="light-content" backgroundColor="#2563EB" />

            {/* Top Page Header */}
            <View style={styles.fullPageHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fullPageLevelTag}>
                  Nghiệm thu toàn diện • {currentProject.levelName}
                </Text>
                <Text style={styles.fullPageTitle}>Báo Cáo Nghiệm Thu Lên Admin</Text>
              </View>
              <TouchableOpacity onPress={() => setSubmitAdminModalVisible(false)} style={styles.fullPageCloseBtn}>
                <Text style={styles.fullPageCloseBtnText}>Đóng</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>

          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >

            <ScrollView
              style={styles.fullPageBody}
              contentContainerStyle={{ paddingBottom: 160 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              automaticallyAdjustKeyboardInsets={true}
              keyboardDismissMode="interactive"
            >
              {/* Project Overview Card */}
              <View style={styles.kpiCard}>
                <Text style={styles.kpiCardLabel}>{currentProject.projectName}</Text>
                <Text style={styles.kpiCardValue}>
                  {approvedSubTasks}/10 việc con đã duyệt Vòng 1 ({progressPercent}%)
                </Text>
                <Text style={styles.kpiCardDesc}>
                  Phần thưởng thăng cấp dự kiến: {currentProject.rewardItem}
                </Text>
              </View>

              {/* Danh Sách 10 Việc Con Tóm Tắt */}
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionBlockTitle}>Danh Sách Việc Con Trong Dự Án</Text>
                <View style={styles.summarySubTaskList}>
                  {subTasks.map((st) => {
                    const isApproved = st.status === 'LEADER_APPROVED';
                    const isSubmitted = st.status === 'SUBMITTED';
                    const isAssigned = st.status === 'ASSIGNED';

                    return (
                      <View key={st.id} style={styles.summarySubTaskRow}>
                        <Text style={[styles.summarySubTaskNum, isApproved && { color: '#059669', fontWeight: 'bold' }]}>
                          {isApproved ? '✓' : `#${st.orderNumber}`}
                        </Text>
                        <View style={{ flex: 1, marginHorizontal: 8 }}>
                          <Text style={styles.summarySubTaskTitle} numberOfLines={1}>
                            {st.title}
                          </Text>
                          <Text style={styles.summarySubTaskAssignee}>
                            {st.assignedToUserName || 'Chưa phân công'}
                          </Text>
                        </View>
                        <Text
                          style={[
                            styles.summarySubTaskStatus,
                            isApproved && { color: '#059669', fontWeight: 'bold' },
                            isSubmitted && { color: '#B45309', fontWeight: 'bold' },
                            isAssigned && { color: '#2563EB' },
                          ]}
                        >
                          {isApproved ? 'Đã duyệt V1' : isSubmitted ? 'Chờ duyệt V1' : isAssigned ? 'Đang làm' : 'Chưa giao'}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* PHẦN 1: BÁO CÁO NGHIỆM THU */}
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionBlockTitle}>1. Báo Cáo Nghiệm Thu & Đánh Giá</Text>
                <Text style={styles.sectionBlockSub}>
                  Nhập nhận xét về kết quả đạt được, chất lượng thực hiện và đề xuất thăng cấp cho nhân sự
                </Text>
                <TextInput
                  style={styles.formTextArea}
                  placeholder="Nhập nội dung báo cáo nghiệm thu gửi Ban Giám Đốc..."
                  placeholderTextColor="#94A3B8"
                  value={adminReportText}
                  onChangeText={setAdminReportText}
                  multiline
                />
              </View>

              {/* PHẦN 2: LINK TỔNG HỢP (TÙY CHỌN) */}
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionBlockTitle}>2. Link Báo Cáo & Số Liệu Tổng Hợp (Tùy chọn)</Text>
                <Text style={styles.sectionBlockSub}>
                  Đính kèm link Google Drive, Dashboard hoặc file báo cáo số liệu toàn diện
                </Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="https://drive.google.com/..."
                  placeholderTextColor="#94A3B8"
                  value={adminReportUrl}
                  onChangeText={setAdminReportUrl}
                  autoCapitalize="none"
                />
              </View>

              {/* Action Submit Button */}
              <View style={[styles.actionFooter, { marginBottom: 40 }]}>
                <TouchableOpacity
                  style={styles.approveMainBtn}
                  onPress={handleSubmitProjectToAdmin}
                  activeOpacity={0.85}
                >
                  <Text style={styles.approveMainBtnText}>XÁC NHẬN GỬI BAN GIÁM ĐỐC</Text>
                </TouchableOpacity>
              </View>
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
    backgroundColor: '#FFFFFF',
  },
  topSafeArea: {
    backgroundColor: '#0F766E',
  },
  bodyWrapper: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: '#0F766E',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubmitBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  headerSubmitBtnText: {
    color: '#0F766E',
    fontSize: 13,
    fontWeight: 'bold',
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
});
