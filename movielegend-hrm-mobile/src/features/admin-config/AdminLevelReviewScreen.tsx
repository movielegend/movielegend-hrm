import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
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
import { useAppAlert } from '../../contexts/AlertContext';

export function AdminLevelReviewScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showAlert } = useAppAlert();

  // Active tab: 'projects' | 'evidence' | 'members' (Default to 'members' matching Screen 1)
  const [activeTab, setActiveTab] = useState<'projects' | 'evidence' | 'members'>('members');

  // Search query in 'members' tab
  const [searchQuery, setSearchQuery] = useState('');

  // Department selector state
  const { data: deptData } = useDepartments({ limit: 100 });
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
  const activeDeptName = activeDept?.name || 'Kinh doanh';
  const activeBranchName = activeDept?.branchName || 'MOVIELEGEND · HÀ NỘI';

  // Level projects store
  const {
    projects: deptLevelProjects,
    adminApproveProject,
    adminRejectProject,
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
  const loadDepartmentData = useCallback(
    async (isSilent = false) => {
      if (!selectedDeptId) return;
      try {
        if (!isSilent) setIsLoading(true);
        const [membersRes, requestsRes, configsRes] = await Promise.all([
          fetchEmployees({ departmentId: selectedDeptId, limit: 100 }).catch(() => ({ data: [] })),
          levelingApi.getDepartmentPromotionRequests(selectedDeptId).catch(() => []),
          levelingApi.getDepartmentLevelConfigs(selectedDeptId).catch(() => []),
        ]);

        setMembers(Array.isArray((membersRes as any)?.data) ? (membersRes as any).data : []);
        setPromotionRequests(Array.isArray(requestsRes) ? requestsRes : []);
        setLevelConfigs(Array.isArray(configsRes) ? configsRes : []);
      } catch {
        // silently handle
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [selectedDeptId]
  );

  useEffect(() => {
    if (selectedDeptId) {
      void loadDepartmentData();
    }
  }, [selectedDeptId, loadDepartmentData]);

  // Reload when screen gains focus
  const isInitialMount = React.useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (isInitialMount.current) {
        isInitialMount.current = false;
        return;
      }
      if (selectedDeptId) {
        void loadDepartmentData(true);
      }
    }, [selectedDeptId, loadDepartmentData])
  );

  const onRefresh = () => {
    setIsRefreshing(true);
    void loadDepartmentData(true);
  };

  // Helper to get initials
  const getInitials = (name?: string) => {
    if (!name) return 'VT';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'VT';
    if (parts.length === 1) return parts[0] ? parts[0].substring(0, 2).toUpperCase() : 'VT';
    const first = parts[0]?.charAt(0) || '';
    const last = parts[parts.length - 1]?.charAt(0) || '';
    return (first + last).toUpperCase() || 'VT';
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

  // Filtered members by search
  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return members;
    const q = searchQuery.toLowerCase().trim();
    return members.filter((m: any) => {
      const name = (m.fullName || m.profile?.fullName || '').toLowerCase();
      const code = (m.userCode || '').toLowerCase();
      return name.includes(q) || code.includes(q);
    });
  }, [members, searchQuery]);

  // Dept options for SelectModal
  const deptOptions: SelectOption[] = useMemo(() => {
    return departments.map((d: any) => ({
      label: d.name + (d.branchName ? ` (${d.branchName})` : ''),
      value: d.id,
      description: d.branchName,
    }));
  }, [departments]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1B3B2B" translucent={false} />

      {/* ── Top Header: Back button and Title on the same row (#1B3B2B) ── */}
      <View style={[styles.headerWrap, { paddingTop: Math.max(insets.top, 16) + 4 }]}>
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
            <Text style={styles.headerTitle}>Duyệt thăng cấp</Text>
            <Text style={styles.headerSubtitle}>Quản lý cấp bậc & nhân sự</Text>
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

        {/* ── Dark Stats Card (Screen 1 Template Match) ── */}
        <View style={styles.statsCardDark}>
          <View style={styles.statsCol}>
            <MaterialCommunityIcons name="account-group-outline" size={24} color="#FFFFFF" />
            <View style={styles.statsTextWrap}>
              <Text style={styles.statsNumber}>{members.length}</Text>
              <Text style={styles.statsLabel}>Nhân sự</Text>
            </View>
          </View>

          <View style={styles.statsDivider} />

          <View style={styles.statsCol}>
            <MaterialCommunityIcons name="clipboard-check-outline" size={24} color="#FFFFFF" />
            <View style={styles.statsTextWrap}>
              <Text style={styles.statsNumber}>{pendingRequestsCount}</Text>
              <Text style={styles.statsLabel}>Chờ duyệt</Text>
            </View>
          </View>
        </View>
      </View>

      {/* ── Main Curved Sheet ── */}
      <View style={styles.curvedSheet}>
        {/* ── 3-Tab Pill Row (Template Match) ── */}
        <View style={styles.tabBarRow}>
          <Pressable
            style={[styles.tabPillBtn, activeTab === 'projects' && styles.tabPillBtnActive]}
            onPress={() => setActiveTab('projects')}
          >
            <Text
              style={[styles.tabPillText, activeTab === 'projects' && styles.tabPillTextActive]}
              numberOfLines={1}
            >
              Dự án ({submittedDeptProjects.length})
            </Text>
            {activeTab === 'projects' && <View style={styles.tabIndicator} />}
          </Pressable>

          <Pressable
            style={[styles.tabPillBtn, activeTab === 'evidence' && styles.tabPillBtnActive]}
            onPress={() => setActiveTab('evidence')}
          >
            <Text
              style={[styles.tabPillText, activeTab === 'evidence' && styles.tabPillTextActive]}
              numberOfLines={1}
            >
              Minh chứng ({promotionRequests.length})
            </Text>
            {activeTab === 'evidence' && <View style={styles.tabIndicator} />}
          </Pressable>

          <Pressable
            style={[styles.tabPillBtn, activeTab === 'members' && styles.tabPillBtnActive]}
            onPress={() => setActiveTab('members')}
          >
            <Text
              style={[styles.tabPillText, activeTab === 'members' && styles.tabPillTextActive]}
              numberOfLines={1}
            >
              Nhân sự ({members.length})
            </Text>
            {activeTab === 'members' && <View style={styles.tabIndicator} />}
          </Pressable>
        </View>

        {/* ── Scrollable Body ── */}
        <ScrollView
          style={styles.scrollBody}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, 16) + 24 },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
        >
          {isLoading && !isRefreshing ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color="#1B3B2B" />
              <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
            </View>
          ) : (
            <>
              {/* ======================================================== */}
              {/* TAB 1: DỰ ÁN (Screen 3)                                  */}
              {/* ======================================================== */}
              {activeTab === 'projects' && (
                <View>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Dự án phòng ban</Text>
                  </View>

                  {submittedDeptProjects.length === 0 ? (
                    <View style={styles.emptyCard}>
                      <View style={styles.emptyIconCircle}>
                        <Ionicons name="folder-outline" size={36} color="#1B3B2B" />
                      </View>
                      <Text style={styles.emptyTitle}>Chưa có dự án cần nghiệm thu</Text>
                      <Text style={styles.emptySubtitle}>
                        Dự án do Leader gửi lên sẽ hiển thị tại đây.
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

                        return (
                          <View key={proj.id || proj.levelNumber} style={styles.projectCard}>
                            <View style={styles.projectCardHeader}>
                              <View style={styles.projectLevelBadge}>
                                <Ionicons
                                  name="trophy-outline"
                                  size={12}
                                  color="#1B3B2B"
                                  style={{ marginRight: 4 }}
                                />
                                <Text style={styles.projectLevelBadgeText}>
                                  Level {proj.levelNumber} · {proj.levelName}
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
                                    isApproved ? '#059669' : isSubmitted ? '#D97706' : '#1B3B2B'
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
                                        : '#1B3B2B',
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
                                        : '#1B3B2B',
                                    },
                                  ]}
                                />
                              </View>
                            </View>

                            {proj.leaderReportNote ? (
                              <View style={styles.projectLeaderNoteBox}>
                                <Ionicons name="chatbubble-ellipses-outline" size={13} color="#1B3B2B" />
                                <Text style={styles.projectLeaderNoteText} numberOfLines={2}>
                                  <Text style={{ fontWeight: '700' }}>Báo cáo Leader: </Text>
                                  {proj.leaderReportNote}
                                </Text>
                              </View>
                            ) : null}

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
                                color={isSubmitted ? '#FFFFFF' : '#1B3B2B'}
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
              {/* TAB 2: MINH CHỨNG (Screen 4)                             */}
              {/* ======================================================== */}
              {activeTab === 'evidence' && (
                <View>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Minh chứng thăng cấp</Text>
                  </View>

                  {promotionRequests.length === 0 ? (
                    <View style={styles.emptyCard}>
                      <View style={styles.emptyIconCircle}>
                        <MaterialCommunityIcons
                          name="file-document-check-outline"
                          size={36}
                          color="#1B3B2B"
                        />
                      </View>
                      <Text style={styles.emptyTitle}>Không có đề xuất chờ duyệt</Text>
                      <Text style={styles.emptySubtitle}>
                        Minh chứng thăng cấp của nhân sự sẽ hiển thị tại đây.
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.requestsList}>
                      {promotionRequests.map((req) => {
                        const reqColor = LEVEL_COLORS[req.toLevelNumber] || '#1B3B2B';
                        const memberName =
                          req.user?.profile?.fullName || req.user?.userCode || 'Nhân sự';
                        const memberCode = req.user?.userCode || '';

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
                                <Ionicons name="images-outline" size={13} color="#1B3B2B" />
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
                                <Ionicons name="chevron-forward" size={14} color="#1B3B2B" />
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
              {/* TAB 3: NHÂN SỰ (Screen 1)                                */}
              {/* ======================================================== */}
              {activeTab === 'members' && (
                <View>
                  {/* Search Bar */}
                  <View style={styles.searchBar}>
                    <Ionicons name="search-outline" size={18} color="#94A3B8" />
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Tìm nhân sự"
                      placeholderTextColor="#94A3B8"
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                    />
                    {searchQuery ? (
                      <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                        <Ionicons name="close-circle" size={18} color="#94A3B8" />
                      </Pressable>
                    ) : null}
                  </View>

                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Nhân sự phòng ban</Text>
                  </View>

                  {filteredMembers.length === 0 ? (
                    <View style={styles.emptyCard}>
                      <View style={styles.emptyIconCircle}>
                        <MaterialCommunityIcons
                          name="account-group-outline"
                          size={36}
                          color="#1B3B2B"
                        />
                      </View>
                      <Text style={styles.emptyTitle}>Chưa có nhân sự</Text>
                      <Text style={styles.emptySubtitle}>
                        {searchQuery
                          ? 'Không tìm thấy nhân sự nào phù hợp với từ khóa.'
                          : `Phòng ${activeDeptName} hiện chưa có nhân sự nào trong hệ thống.`}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.membersList}>
                      {filteredMembers.map((m, idx) => {
                        const memberName =
                          m.fullName || m.profile?.fullName || m.userCode || 'Nhân sự';
                        const memberCode = m.userCode || `NV${String(idx + 1).padStart(5, '0')}`;
                        const memberPosition =
                          m.position?.name || m.role?.name || 'Nhân viên';
                        const memberLevel =
                          m.currentLevelNumber || m.profile?.currentLevelNumber || 1;
                        const levelTitle = getLevelTitle(memberLevel);

                        return (
                          <View key={m.id || idx} style={styles.memberCard}>
                            {/* Top Row: Avatar + Name + Code + Level Pill */}
                            <View style={styles.memberTopRow}>
                              <View style={styles.memberAvatarCircle}>
                                <Text style={styles.memberAvatarText}>
                                  {getInitials(memberName)}
                                </Text>
                              </View>
                              <View style={styles.memberMetaCol}>
                                <Text style={styles.memberName} numberOfLines={1}>
                                  {memberName}
                                </Text>
                                <Text style={styles.memberCodeSub}>
                                  {memberCode} · {memberPosition}
                                </Text>
                                <View style={styles.memberLevelPill}>
                                  <Text style={styles.memberLevelPillText}>
                                    Level {memberLevel} · {levelTitle}
                                  </Text>
                                </View>
                              </View>
                            </View>

                            <View style={styles.memberDivider} />

                            {/* Bottom Row: Cấp bậc hiện tại + Nút "↑ Đổi cấp bậc" */}
                            <View style={styles.memberBottomRow}>
                              <Text style={styles.currentLevelLabel}>Cấp bậc hiện tại</Text>

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
                                <Ionicons name="arrow-up" size={14} color="#1B3B2B" />
                                <Text style={styles.changeLevelBtnText}>Đổi cấp bậc</Text>
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
      </View>

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

      {/* ── Modal: Đổi Level Trực Tiếp (Screen 2) ── */}
      <DirectLevelChangeModal
        visible={!!directChangeUser}
        targetUser={directChangeUser}
        isAdmin={true}
        levelConfigs={levelConfigs}
        onClose={() => setDirectChangeUser(null)}
        onSuccess={() => {
          loadDepartmentData(true);
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
          loadDepartmentData(true);
          showAlert('Nghiệm thu thành công', 'Đã duyệt dự án cho phòng ban.');
        }}
        onReject={async (lvlNum, feedback) => {
          await adminRejectProject(lvlNum, feedback);
          setSelectedProjectForReview(null);
          loadDepartmentData(true);
          showAlert('Yêu cầu sửa đổi', 'Đã chuyển phản hồi đến Leader.');
        }}
      />
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
    marginBottom: 10,
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

  /* ── Dark Stats Card ── */
  statsCardDark: {
    backgroundColor: '#142E21',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  statsCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statsTextWrap: {
    justifyContent: 'center',
  },
  statsNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 22,
  },
  statsLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
    marginTop: 1,
  },
  statsDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginHorizontal: 12,
  },

  /* ── Curved Sheet ── */
  curvedSheet: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },

  /* ── 3-Tab Bar Row (Template Match) ── */
  tabBarRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    gap: 8,
  },
  tabPillBtn: {
    flex: 1,
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  tabPillBtnActive: {
    backgroundColor: '#E8F5E9',
  },
  tabPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  tabPillTextActive: {
    color: '#1B3B2B',
    fontWeight: '700',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: -4,
    left: '20%',
    right: '20%',
    height: 3,
    backgroundColor: '#1B3B2B',
    borderRadius: 2,
  },

  /* ── Content Scroll ── */
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  sectionHeader: {
    marginTop: 10,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
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

  /* ── Search Bar ── */
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
    marginTop: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },

  /* ── Empty Card (Screens 3 & 4) ── */
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    paddingVertical: 44,
    paddingHorizontal: 20,
    marginTop: 6,
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },

  /* ── Members List (Screen 1) ── */
  membersList: {
    gap: 12,
  },
  memberCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
  },
  memberTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  memberAvatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1B3B2B',
  },
  memberMetaCol: {
    flex: 1,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  memberCodeSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  memberLevelPill: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 5,
  },
  memberLevelPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1B3B2B',
  },
  memberDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  memberBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  currentLevelLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  changeLevelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#1B3B2B',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
  },
  changeLevelBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1B3B2B',
  },

  /* ── Projects List (Screen 3) ── */
  projectsList: {
    gap: 12,
  },
  projectCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
  },
  projectCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  projectLevelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  projectLevelBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1B3B2B',
  },
  projectStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusApproved: {
    backgroundColor: '#ECFDF5',
  },
  statusSubmitted: {
    backgroundColor: '#FEF3C7',
  },
  statusInProgress: {
    backgroundColor: '#E8F5E9',
  },
  projectStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  projectNameText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 10,
  },
  projectProgressWrap: {
    marginBottom: 10,
  },
  projectProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  projectProgressLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  projectProgressVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
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
    gap: 6,
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 8,
    marginBottom: 10,
  },
  projectLeaderNoteText: {
    fontSize: 12,
    color: '#475569',
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
    backgroundColor: '#1B3B2B',
  },
  projectActionBtnNormal: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  projectActionBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  projectActionBtnTextActive: {
    color: '#FFFFFF',
  },
  projectActionBtnTextNormal: {
    color: '#1B3B2B',
  },

  /* ── Requests List (Screen 4) ── */
  requestsList: {
    gap: 12,
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
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
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitialText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1B3B2B',
  },
  requestUserName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  requestUserCode: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgePending: {
    backgroundColor: '#FEF3C7',
  },
  statusBadgeApproved: {
    backgroundColor: '#ECFDF5',
  },
  statusBadgeRejected: {
    backgroundColor: '#FEE2E2',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusTextPending: {
    color: '#D97706',
  },
  statusTextApproved: {
    color: '#059669',
  },
  statusTextRejected: {
    color: '#DC2626',
  },
  requestLevelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  requestLevelFromText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  requestLevelToText: {
    fontSize: 12,
    fontWeight: '700',
  },
  requestNoteBox: {
    marginBottom: 8,
  },
  requestNoteText: {
    fontSize: 12,
    color: '#475569',
    fontStyle: 'italic',
  },
  requestCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
    marginTop: 4,
  },
  evidenceCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  evidenceCountText: {
    fontSize: 12,
    color: '#64748B',
  },
  reviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reviewBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1B3B2B',
  },
});
