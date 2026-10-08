import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { Screen } from '../../components/Screen';
import { SelectModal, SelectOption } from '../../components/SelectModal';
import { useDepartments } from '../../hooks/useDepartments';
import { fetchEmployees } from '../../api/employees.api';
import {
  levelingApi,
  LevelPromotionRequestItem,
  DepartmentLevelItem,
} from '../../api/leveling.api';
import { LEVEL_DEFAULT_NAMES, LEVEL_COLORS } from '../../components/common/LevelNameBadge';
import { DirectLevelChangeModal } from '../leveling/DirectLevelChangeModal';
import { AdminProjectReviewModal } from '../leveling/AdminProjectReviewModal';
import { useLevelProjects, LevelDepartmentProject } from '../leveling/levelProjectsStore';
import { getAbsoluteImageUrl } from '../../utils/image';
import { useAppAlert } from '../../contexts/AlertContext';

export function AdminLevelReviewScreen() {
  const router = useRouter();
  const { showAlert } = useAppAlert();

  // Active tab: 'projects' | 'evidence' | 'members'
  const [activeTab, setActiveTab] = useState<'projects' | 'evidence' | 'members'>('evidence');

  // Department selector state
  const { data: deptData, isLoading: isDeptsLoading } = useDepartments({ limit: 100 });
  const departments = useMemo(() => {
    const raw =
      (deptData as any)?.data ||
      (deptData as any)?.items ||
      (Array.isArray(deptData) ? deptData : []);
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
  const activeDeptName = activeDept?.name || 'Phòng ban';
  const activeBranchName = activeDept?.branchName || 'MOVIELEGEND';

  // Level projects store
  const {
    projects: deptLevelProjects,
    adminApproveProject,
    adminRejectProject,
    fetchProjects,
  } = useLevelProjects(selectedDeptId, activeDeptName);

  const submittedDeptProjects = useMemo(() => {
    return deptLevelProjects.filter(
      (p) =>
        p.status === 'SUBMITTED_TO_ADMIN' ||
        p.status === 'ADMIN_APPROVED' ||
        (p.subTasks && p.subTasks.length > 0)
    );
  }, [deptLevelProjects]);

  // Department members & Promotion requests & Level configs
  const [members, setMembers] = useState<any[]>([]);
  const [promotionRequests, setPromotionRequests] = useState<LevelPromotionRequestItem[]>([]);
  const [levelConfigs, setLevelConfigs] = useState<DepartmentLevelItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals state
  const [directChangeUser, setDirectChangeUser] = useState<{
    id: string;
    fullName: string;
    currentLevelNumber: number;
    departmentName?: string;
  } | null>(null);

  const [selectedProjectForReview, setSelectedProjectForReview] =
    useState<LevelDepartmentProject | null>(null);

  // Load data for selected department
  const loadDepartmentData = useCallback(async () => {
    if (!selectedDeptId) return;
    try {
      setIsLoading(true);
      const [membersRes, requestsRes, configsRes] = await Promise.all([
        fetchEmployees({ departmentId: selectedDeptId, limit: 100 }).catch(() => ({ data: [] })),
        levelingApi.getDepartmentPromotionRequests(selectedDeptId).catch(() => []),
        levelingApi.getDepartmentLevelConfigs(selectedDeptId).catch(() => []),
      ]);

      setMembers(Array.isArray((membersRes as any)?.data) ? (membersRes as any).data : []);
      setPromotionRequests(Array.isArray(requestsRes) ? requestsRes : []);
      setLevelConfigs(Array.isArray(configsRes) ? configsRes : []);
      void fetchProjects();
    } catch (err: any) {
      // silently handle
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedDeptId, fetchProjects]);

  useEffect(() => {
    if (selectedDeptId) {
      loadDepartmentData();
    }
  }, [selectedDeptId, loadDepartmentData]);

  // Reload when screen gains focus
  useFocusEffect(
    useCallback(() => {
      if (selectedDeptId) {
        loadDepartmentData();
      }
    }, [selectedDeptId, loadDepartmentData])
  );

  const onRefresh = () => {
    setIsRefreshing(true);
    loadDepartmentData();
  };

  // Helper to get initials
  const getInitials = (name?: string) => {
    if (!name) return 'N';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return parts[parts.length - 1].charAt(0).toUpperCase();
  };

  // Helper to get configured level title for a member
  const getLevelTitle = (levelNumber: number) => {
    const found = levelConfigs.find((c) => c.levelNumber === levelNumber);
    if (found?.customLevelName && found.customLevelName.trim()) {
      return found.customLevelName.trim();
    }
    if (found?.displayName && found.displayName.trim()) {
      return found.displayName.trim();
    }
    return LEVEL_DEFAULT_NAMES[levelNumber] || `Level ${levelNumber}`;
  };

  // Pending count for promotion requests
  const pendingRequestsCount = useMemo(() => {
    return promotionRequests.filter((r) => r.status === 'PENDING').length;
  }, [promotionRequests]);

  // Dept options for SelectModal
  const deptOptions: SelectOption[] = useMemo(() => {
    return departments.map((d: any) => ({
      label: d.name + (d.branchName ? ` (${d.branchName})` : ''),
      value: d.id,
      description: d.branchName,
    }));
  }, [departments]);

  return (
    <Screen>
      {/* ── Top Header: Nút quay lại cùng dòng với tiêu đề ── */}
      <View style={styles.header}>
        <View style={styles.headerTitleGroup}>
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/admin/(tabs)' as any))}
            style={styles.backBtn}
            hitSlop={10}
            accessibilityLabel="Quay lại"
          >
            <Ionicons name="arrow-back" size={22} color="#0F172A" />
          </Pressable>
          <View style={styles.titleTextWrap}>
            <Text style={styles.screenTitle}>Duyệt cấp bậc & nhân sự</Text>
            <Text style={styles.screenSubtitle}>Quản trị duyệt thăng cấp.</Text>
          </View>
        </View>
      </View>

      {/* ── Metrics Summary Card (Image 1) ── */}
      <View style={styles.summaryCardWrapper}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryCol}>
            <MaterialCommunityIcons name="account-group-outline" size={24} color="#64748B" />
            <View style={styles.summaryTextGroup}>
              <Text style={styles.summaryNumber}>{members.length}</Text>
              <Text style={styles.summaryLabel}>Nhân sự</Text>
            </View>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryCol}>
            <MaterialCommunityIcons name="file-document-outline" size={24} color="#64748B" />
            <View style={styles.summaryTextGroup}>
              <Text style={styles.summaryNumber}>{pendingRequestsCount}</Text>
              <Text style={styles.summaryLabel}>Đề xuất chờ duyệt</Text>
            </View>
          </View>
        </View>
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

      {/* ── Segmented 3-Tab Pill Switcher ── */}
      <View style={styles.tabContainer}>
        <Pressable
          style={[styles.tabBtn, activeTab === 'projects' && styles.tabBtnActive]}
          onPress={() => setActiveTab('projects')}
        >
          <MaterialCommunityIcons
            name="briefcase-outline"
            size={16}
            color={activeTab === 'projects' ? '#FFFFFF' : '#64748B'}
          />
          <Text
            style={[styles.tabBtnText, activeTab === 'projects' && styles.tabBtnTextActive]}
            numberOfLines={1}
          >
            Dự án ({submittedDeptProjects.length})
          </Text>
        </Pressable>

        <Pressable
          style={[styles.tabBtn, activeTab === 'evidence' && styles.tabBtnActive]}
          onPress={() => setActiveTab('evidence')}
        >
          <Ionicons
            name="checkmark-circle-outline"
            size={16}
            color={activeTab === 'evidence' ? '#FFFFFF' : '#64748B'}
          />
          <Text
            style={[styles.tabBtnText, activeTab === 'evidence' && styles.tabBtnTextActive]}
            numberOfLines={1}
          >
            Minh chứng ({promotionRequests.length})
          </Text>
        </Pressable>

        <Pressable
          style={[styles.tabBtn, activeTab === 'members' && styles.tabBtnActive]}
          onPress={() => setActiveTab('members')}
        >
          <MaterialCommunityIcons
            name="account-group-outline"
            size={16}
            color={activeTab === 'members' ? '#FFFFFF' : '#64748B'}
          />
          <Text
            style={[styles.tabBtnText, activeTab === 'members' && styles.tabBtnTextActive]}
            numberOfLines={1}
          >
            Nhân sự ({members.length})
          </Text>
        </Pressable>
      </View>

      {/* ── Main Scroll View ── */}
      <ScrollView
        style={styles.scrollBody}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
      >
        {isLoading && !isRefreshing ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color="#0055D4" />
            <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
          </View>
        ) : (
          <>
            {/* ======================================================== */}
            {/* TAB 1: DỰ ÁN                                             */}
            {/* ======================================================== */}
            {activeTab === 'projects' && (
              <View>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>
                    Dự án phòng ban ({submittedDeptProjects.length})
                  </Text>
                </View>

                {submittedDeptProjects.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <Ionicons name="folder-open-outline" size={48} color="#94A3B8" />
                    <Text style={styles.emptyTitle}>Chưa có dự án cần nghiệm thu</Text>
                    <Text style={styles.emptySubtitle}>
                      Phòng {activeDeptName} chưa có dự án nào được gửi lên từ Leader.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.projectsList}>
                    {submittedDeptProjects.map((proj) => {
                      const completedCount = proj.subTasks.filter(
                        (t) =>
                          t.status === 'LEADER_APPROVED' ||
                          (t.status as any) === 'ADMIN_APPROVED'
                      ).length;
                      const totalCount = proj.subTasks.length;
                      const percent =
                        totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
                      const isSubmitted = proj.status === 'SUBMITTED_TO_ADMIN';
                      const isApproved = proj.status === 'ADMIN_APPROVED';
                      const lvlColor = LEVEL_COLORS[proj.levelNumber] || '#0055D4';

                      return (
                        <View key={proj.id || proj.levelNumber} style={styles.projectCard}>
                          {/* Top: Badge Level & Status */}
                          <View style={styles.projectCardHeader}>
                            <View
                              style={[
                                styles.projectLevelBadge,
                                { backgroundColor: `${lvlColor}15`, borderColor: lvlColor },
                              ]}
                            >
                              <Ionicons
                                name="trophy-outline"
                                size={12}
                                color={lvlColor}
                                style={{ marginRight: 4 }}
                              />
                              <Text style={[styles.projectLevelBadgeText, { color: lvlColor }]}>
                                Level {proj.levelNumber} - {proj.levelName}
                              </Text>
                            </View>

                            <View
                              style={[
                                styles.projectStatusBadge,
                                isApproved
                                  ? styles.statusApproved
                                  : isSubmitted
                                  ? styles.statusSubmitted
                                  : styles.statusInProgress,
                              ]}
                            >
                              <Ionicons
                                name={
                                  isApproved
                                    ? 'checkmark-circle'
                                    : isSubmitted
                                    ? 'time'
                                    : 'hourglass-outline'
                                }
                                size={12}
                                color={
                                  isApproved ? '#059669' : isSubmitted ? '#D97706' : '#2563EB'
                                }
                              />
                              <Text
                                style={[
                                  styles.projectStatusText,
                                  {
                                    color: isApproved
                                      ? '#059669'
                                      : isSubmitted
                                      ? '#D97706'
                                      : '#2563EB',
                                  },
                                ]}
                              >
                                {isApproved
                                  ? 'Đã Nghiệm Thu'
                                  : isSubmitted
                                  ? 'Chờ Admin Duyệt'
                                  : 'Đang Thực Hiện'}
                              </Text>
                            </View>
                          </View>

                          {/* Title */}
                          <Text style={styles.projectNameText}>{proj.projectName}</Text>

                          {/* Progress */}
                          <View style={styles.projectProgressWrap}>
                            <View style={styles.projectProgressHeader}>
                              <Text style={styles.projectProgressLabel}>Tiến độ việc con:</Text>
                              <Text style={styles.projectProgressVal}>
                                {completedCount}/{totalCount} ({percent}%)
                              </Text>
                            </View>
                            <View style={styles.projectProgressTrack}>
                              <View
                                style={[
                                  styles.projectProgressFill,
                                  {
                                    width: `${percent}%`,
                                    backgroundColor: isApproved
                                      ? '#059669'
                                      : isSubmitted
                                      ? '#D97706'
                                      : lvlColor,
                                  },
                                ]}
                              />
                            </View>
                          </View>

                          {/* Leader Note */}
                          {proj.leaderReportNote ? (
                            <View style={styles.projectLeaderNoteBox}>
                              <Ionicons name="chatbubble-ellipses-outline" size={13} color="#0055D4" />
                              <Text style={styles.projectLeaderNoteText} numberOfLines={2}>
                                <Text style={{ fontWeight: '700' }}>Báo cáo Leader: </Text>
                                {proj.leaderReportNote}
                              </Text>
                            </View>
                          ) : null}

                          {/* Action Button */}
                          <Pressable
                            style={[
                              styles.projectActionBtn,
                              isSubmitted
                                ? styles.projectActionBtnActive
                                : styles.projectActionBtnNormal,
                            ]}
                            onPress={() => setSelectedProjectForReview(proj)}
                          >
                            <Ionicons
                              name={isSubmitted ? 'shield-checkmark-outline' : 'eye-outline'}
                              size={15}
                              color={isSubmitted ? '#FFFFFF' : '#0055D4'}
                              style={{ marginRight: 6 }}
                            />
                            <Text
                              style={[
                                styles.projectActionBtnText,
                                isSubmitted
                                  ? styles.projectActionBtnTextActive
                                  : styles.projectActionBtnTextNormal,
                              ]}
                            >
                              {isSubmitted
                                ? 'Kiểm Tra Báo Cáo & Nghiệm Thu'
                                : 'Xem Chi Tiết Dự Án'}
                            </Text>
                          </Pressable>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            )}

            {/* ======================================================== */}
            {/* TAB 2: MINH CHỨNG (Image 1)                              */}
            {/* ======================================================== */}
            {activeTab === 'evidence' && (
              <View>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Minh chứng chờ duyệt</Text>
                </View>

                {promotionRequests.length === 0 ? (
                  /* Empty state matching Image 1 exactly */
                  <View style={styles.emptyEvidenceCard}>
                    <View style={styles.emptyCheckCircle}>
                      <Ionicons name="checkmark" size={28} color="#10B981" />
                    </View>
                    <Text style={styles.emptyEvidenceTitle}>Không có đề xuất chờ duyệt</Text>
                    <Text style={styles.emptyEvidenceSubtitle}>
                      Hiện chưa có minh chứng nào cần bạn xử lý.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.requestsList}>
                    {promotionRequests.map((req) => {
                      const reqColor = LEVEL_COLORS[req.toLevelNumber] || '#10B981';
                      const memberName =
                        req.user?.profile?.fullName || req.user?.userCode || 'Nhân sự';
                      const memberCode = req.user?.userCode || '';
                      const isPending = req.status === 'PENDING';

                      return (
                        <View key={req.id} style={styles.requestCard}>
                          <View style={styles.requestCardHeader}>
                            <View style={styles.requestUserGroup}>
                              <View style={styles.avatarCircle}>
                                <Text style={styles.avatarInitialText}>
                                  {getInitials(memberName)}
                                </Text>
                              </View>
                              <View style={{ marginLeft: 10, flex: 1 }}>
                                <Text style={styles.requestUserName}>{memberName}</Text>
                                {memberCode ? (
                                  <Text style={styles.requestUserCode}>Mã: {memberCode}</Text>
                                ) : null}
                              </View>
                            </View>

                            <View
                              style={[
                                styles.statusBadge,
                                req.status === 'APPROVED' && styles.statusBadgeApproved,
                                req.status === 'REJECTED' && styles.statusBadgeRejected,
                                req.status === 'PENDING' && styles.statusBadgePending,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.statusBadgeText,
                                  req.status === 'APPROVED' && styles.statusTextApproved,
                                  req.status === 'REJECTED' && styles.statusTextRejected,
                                  req.status === 'PENDING' && styles.statusTextPending,
                                ]}
                              >
                                {req.status === 'PENDING'
                                  ? 'Chờ Duyệt'
                                  : req.status === 'APPROVED'
                                  ? 'Đã Duyệt'
                                  : 'Từ Chối'}
                              </Text>
                            </View>
                          </View>

                          <View style={styles.requestLevelRow}>
                            <Text style={styles.requestLevelFromText}>
                              Level {req.fromLevelNumber} ({getLevelTitle(req.fromLevelNumber)})
                            </Text>
                            <Ionicons
                              name="arrow-forward"
                              size={14}
                              color="#64748B"
                              style={{ marginHorizontal: 6 }}
                            />
                            <Text style={[styles.requestLevelToText, { color: reqColor }]}>
                              Level {req.toLevelNumber} ({getLevelTitle(req.toLevelNumber)})
                            </Text>
                          </View>

                          {req.submissionNote ? (
                            <View style={styles.requestNoteBox}>
                              <Text style={styles.requestNoteText} numberOfLines={2}>
                                "{req.submissionNote}"
                              </Text>
                            </View>
                          ) : null}

                          <View style={styles.requestCardFooter}>
                            <View style={styles.evidenceCountBadge}>
                              <Ionicons name="images-outline" size={13} color="#0055D4" />
                              <Text style={styles.evidenceCountText}>
                                {req.evidenceImages?.length || 0} ảnh bằng chứng
                              </Text>
                            </View>

                            <Pressable
                              style={styles.reviewBtn}
                              onPress={() => {
                                router.push({
                                  pathname: '/admin/levels/review-promotion' as any,
                                  params: {
                                    requestId: req.id,
                                    fromLevelNumber: String(req.fromLevelNumber),
                                    toLevelNumber: String(req.toLevelNumber),
                                    departmentName: req.department?.name || activeDeptName,
                                  },
                                });
                              }}
                            >
                              <Text style={styles.reviewBtnText}>Xem & Thẩm định</Text>
                              <Ionicons name="chevron-forward" size={14} color="#0055D4" />
                            </Pressable>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            )}

            {/* ======================================================== */}
            {/* TAB 3: NHÂN SỰ (Image 2)                                 */}
            {/* ======================================================== */}
            {activeTab === 'members' && (
              <View>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Nhân sự phòng ban ({members.length})</Text>
                </View>

                {members.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <MaterialCommunityIcons name="account-group-outline" size={48} color="#94A3B8" />
                    <Text style={styles.emptyTitle}>Chưa có nhân sự</Text>
                    <Text style={styles.emptySubtitle}>
                      Phòng {activeDeptName} hiện chưa có nhân sự nào trong hệ thống.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.membersList}>
                    {members.map((m, idx) => {
                      const memberName =
                        m.fullName || m.profile?.fullName || m.userCode || 'Nhân sự';
                      const memberCode = m.userCode || `NV${String(idx + 1).padStart(5, '0')}`;
                      const memberPosition =
                        m.position?.name || m.role?.name || 'Nhân viên';
                      const memberLevel =
                        m.currentLevelNumber || m.profile?.currentLevelNumber || 1;
                      const levelTitle = getLevelTitle(memberLevel);
                      const rawAvatar = m.avatarUrl || m.profile?.avatarUrl;
                      const avatarUri = getAbsoluteImageUrl(rawAvatar);

                      return (
                        <View key={m.id || idx} style={styles.memberCard}>
                          {/* Member Top Row: Avatar + Name + Code */}
                          <View style={styles.memberTopRow}>
                            <View style={styles.memberAvatarCircle}>
                              {avatarUri ? (
                                <Image source={{ uri: avatarUri }} style={styles.memberAvatarImg} />
                              ) : (
                                <Text style={styles.memberAvatarInitial}>
                                  {getInitials(memberName)}
                                </Text>
                              )}
                            </View>
                            <View style={styles.memberTextCol}>
                              <Text style={styles.memberNameText} numberOfLines={1}>
                                {memberName}
                              </Text>
                              <Text style={styles.memberSubText}>
                                Mã: {memberCode} • {memberPosition}
                              </Text>
                            </View>
                          </View>

                          {/* Member Bottom Row: Level Title Badge + Button "⚡ Đổi Level" */}
                          <View style={styles.memberBottomRow}>
                            <View style={styles.memberLevelBadge}>
                              <Text style={styles.memberLevelBadgeText}>{levelTitle}</Text>
                            </View>

                            <Pressable
                              style={styles.changeLevelBtn}
                              onPress={() => {
                                setDirectChangeUser({
                                  id: m.id,
                                  fullName: memberName,
                                  currentLevelNumber: memberLevel,
                                  departmentName: activeDeptName,
                                });
                              }}
                            >
                              <Ionicons name="flash" size={13} color="#FFFFFF" />
                              <Text style={styles.changeLevelBtnText}>Đổi Level</Text>
                            </Pressable>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* ── Modal: Chọn phòng ban ── */}
      <SelectModal
        visible={showDeptModal}
        title="Chọn phòng ban quản trị"
        options={deptOptions}
        selectedValue={selectedDeptId}
        onSelect={(opt: any) => {
          const val = typeof opt === 'string' ? opt : (opt.value ?? opt.id);
          setSelectedDeptId(val);
          setShowDeptModal(false);
        }}
        onClose={() => setShowDeptModal(false)}
      />

      {/* ── Modal: Đổi Level Trực Tiếp ── */}
      <DirectLevelChangeModal
        visible={!!directChangeUser}
        targetUser={directChangeUser}
        isAdmin={true}
        onClose={() => setDirectChangeUser(null)}
        onSuccess={() => {
          loadDepartmentData();
          showAlert('Thành công', 'Đã cập nhật cấp bậc nhân sự.');
        }}
      />

      {/* ── Modal: Duyệt Nghiệm Thu Dự Án ── */}
      <AdminProjectReviewModal
        visible={!!selectedProjectForReview}
        project={selectedProjectForReview}
        departmentName={activeDeptName}
        onClose={() => setSelectedProjectForReview(null)}
        onApprove={async (lvlNum, feedback) => {
          await adminApproveProject(lvlNum, feedback);
          setSelectedProjectForReview(null);
          loadDepartmentData();
          showAlert('Nghiệm thu thành công', 'Đã duyệt dự án cho phòng ban.');
        }}
        onReject={async (lvlNum, feedback) => {
          await adminRejectProject(lvlNum, feedback);
          setSelectedProjectForReview(null);
          loadDepartmentData();
          showAlert('Yêu cầu sửa đổi', 'Đã chuyển phản hồi đến Leader.');
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleTextWrap: {
    flex: 1,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  screenSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  summaryCardWrapper: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  summaryCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  summaryTextGroup: {
    justifyContent: 'center',
  },
  summaryNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 24,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 1,
  },
  summaryDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 12,
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 4,
    gap: 4,
    marginBottom: 14,
  },
  tabBtn: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 4,
  },
  tabBtnActive: {
    backgroundColor: '#0055D4',
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  tabBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  loadingBox: {
    paddingVertical: 50,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
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
  },

  /* Empty Evidence (Image 1) */
  emptyEvidenceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 44,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  emptyCheckCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyEvidenceTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  emptyEvidenceSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
  },

  /* Projects tab */
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
  projectCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  projectLevelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  projectLevelBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  projectStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusApproved: {
    backgroundColor: '#DCFCE7',
  },
  statusSubmitted: {
    backgroundColor: '#FEF3C7',
  },
  statusInProgress: {
    backgroundColor: '#EFF6FF',
  },
  projectStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  projectNameText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  projectProgressWrap: {
    marginBottom: 12,
  },
  projectProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  projectProgressLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  projectProgressVal: {
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '700',
  },
  projectProgressTrack: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  projectProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  projectLeaderNoteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  projectLeaderNoteText: {
    fontSize: 12,
    color: '#334155',
    flex: 1,
  },
  projectActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    borderRadius: 10,
  },
  projectActionBtnActive: {
    backgroundColor: '#0055D4',
  },
  projectActionBtnNormal: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  projectActionBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  projectActionBtnTextActive: {
    color: '#FFFFFF',
  },
  projectActionBtnTextNormal: {
    color: '#0055D4',
  },

  /* Requests tab */
  requestsList: {
    gap: 12,
  },
  requestCard: {
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
  requestCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  requestUserGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitialText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0055D4',
  },
  requestUserName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  requestUserCode: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeApproved: {
    backgroundColor: '#DCFCE7',
  },
  statusBadgeRejected: {
    backgroundColor: '#FEE2E2',
  },
  statusBadgePending: {
    backgroundColor: '#FEF3C7',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusTextApproved: {
    color: '#15803D',
  },
  statusTextRejected: {
    color: '#B91C1C',
  },
  statusTextPending: {
    color: '#B45309',
  },
  requestLevelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  requestLevelFromText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  requestLevelToText: {
    fontSize: 13,
    fontWeight: '700',
  },
  requestNoteBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  requestNoteText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#475569',
  },
  requestCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  evidenceCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  evidenceCountText: {
    fontSize: 12,
    color: '#0055D4',
    fontWeight: '600',
  },
  reviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reviewBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0055D4',
  },

  /* Members tab (Image 2) */
  membersList: {
    gap: 12,
  },
  memberCard: {
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
  memberTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  memberAvatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  memberAvatarImg: {
    width: '100%',
    height: '100%',
  },
  memberAvatarInitial: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0055D4',
  },
  memberTextCol: {
    marginLeft: 12,
    flex: 1,
  },
  memberNameText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  memberSubText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 3,
  },
  memberBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  memberLevelBadge: {
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  memberLevelBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  changeLevelBtn: {
    backgroundColor: '#0055D4',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  changeLevelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
