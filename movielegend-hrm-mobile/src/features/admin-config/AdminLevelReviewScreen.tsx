import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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

  // Active tab: 'projects' | 'evidence' | 'members' (Default to 'members' as in Screen 3)
  const [activeTab, setActiveTab] = useState<'projects' | 'evidence' | 'members'>('members');

  // Search query in 'members' tab
  const [searchQuery, setSearchQuery] = useState('');

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
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
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
    <Screen>
      {/* ── Top Header: Back button and Title on the same row ── */}
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
            <Text style={styles.screenTitle}>Duyệt thăng cấp</Text>
            <Text style={styles.screenSubtitle}>Quản lý cấp bậc & nhân sự</Text>
          </View>
        </View>
      </View>

      {/* ── Dropdown: Phòng ban quản trị ── */}
      <View style={styles.deptSection}>
        <Pressable style={styles.deptSelectCard} onPress={() => setShowDeptModal(true)}>
          <View style={styles.deptCardLeft}>
            <View style={styles.deptIconBox}>
              <MaterialCommunityIcons name="office-building-outline" size={20} color="#0563bb" />
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

      {/* ── Solid Stats Banner Card (#0563bb - Template Match) ── */}
      <View style={styles.statsCardWrapper}>
        <View style={styles.statsCardSolid}>
          <View style={styles.statsCol}>
            <MaterialCommunityIcons name="account-group-outline" size={26} color="#FFFFFF" />
            <View style={styles.statsTextWrap}>
              <Text style={styles.statsNumber}>{members.length}</Text>
              <Text style={styles.statsLabel}>Nhân sự</Text>
            </View>
          </View>

          <View style={styles.statsDivider} />

          <View style={styles.statsCol}>
            <MaterialCommunityIcons name="clipboard-check-outline" size={26} color="#FFFFFF" />
            <View style={styles.statsTextWrap}>
              <Text style={styles.statsNumber}>{pendingRequestsCount}</Text>
              <Text style={styles.statsLabel}>Chờ duyệt</Text>
            </View>
          </View>
        </View>
      </View>

      {/* ── Underline 3-Tab Bar (Template Match) ── */}
      <View style={styles.tabUnderlineBar}>
        <Pressable
          style={styles.tabUnderlineBtn}
          onPress={() => setActiveTab('projects')}
        >
          <Text
            style={[styles.tabUnderlineText, activeTab === 'projects' && styles.tabUnderlineTextActive]}
            numberOfLines={1}
          >
            Dự án ({submittedDeptProjects.length})
          </Text>
          {activeTab === 'projects' && <View style={styles.tabIndicator} />}
        </Pressable>

        <Pressable
          style={styles.tabUnderlineBtn}
          onPress={() => setActiveTab('evidence')}
        >
          <Text
            style={[styles.tabUnderlineText, activeTab === 'evidence' && styles.tabUnderlineTextActive]}
            numberOfLines={1}
          >
            Minh chứng ({promotionRequests.length})
          </Text>
          {activeTab === 'evidence' && <View style={styles.tabIndicator} />}
        </Pressable>

        <Pressable
          style={styles.tabUnderlineBtn}
          onPress={() => setActiveTab('members')}
        >
          <Text
            style={[styles.tabUnderlineText, activeTab === 'members' && styles.tabUnderlineTextActive]}
            numberOfLines={1}
          >
            Nhân sự ({members.length})
          </Text>
          {activeTab === 'members' && <View style={styles.tabIndicator} />}
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
            <ActivityIndicator size="small" color="#0563bb" />
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
                    <View style={styles.emptyIconCircle}>
                      <Ionicons name="folder-open-outline" size={34} color="#0563bb" />
                    </View>
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
                      const lvlColor = LEVEL_COLORS[proj.levelNumber] || '#0563bb';

                      return (
                        <View key={proj.id || proj.levelNumber} style={styles.projectCard}>
                          {/* Header row */}
                          <View style={styles.projectCardHeader}>
                            <View
                              style={[
                                styles.projectLevelBadge,
                                { backgroundColor: 'rgba(5, 99, 187, 0.08)' },
                              ]}
                            >
                              <Ionicons
                                name="trophy-outline"
                                size={12}
                                color="#0563bb"
                                style={{ marginRight: 4 }}
                              />
                              <Text style={[styles.projectLevelBadgeText, { color: '#0563bb' }]}>
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
                                  isApproved ? '#059669' : isSubmitted ? '#D97706' : '#0563bb'
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
                                      : '#0563bb',
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
                                      : '#0563bb',
                                  },
                                ]}
                              />
                            </View>
                          </View>

                          {proj.leaderReportNote ? (
                            <View style={styles.projectLeaderNoteBox}>
                              <Ionicons name="chatbubble-ellipses-outline" size={13} color="#0563bb" />
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
                              color={isSubmitted ? '#FFFFFF' : '#0563bb'}
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
                {promotionRequests.length === 0 ? (
                  /* Empty state matching Screen 4 */
                  <View style={styles.emptyEvidenceCard}>
                    <View style={styles.emptyDocCircle}>
                      <MaterialCommunityIcons
                        name="file-document-check-outline"
                        size={36}
                        color="#0563bb"
                      />
                    </View>
                    <Text style={styles.emptyEvidenceTitle}>Không có đề xuất chờ duyệt</Text>
                    <Text style={styles.emptyEvidenceSubtitle}>
                      Minh chứng thăng cấp của nhân sự sẽ hiển thị tại đây.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.requestsList}>
                    {promotionRequests.map((req) => {
                      const reqColor = LEVEL_COLORS[req.toLevelNumber] || '#0563bb';
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
                              <Ionicons name="images-outline" size={13} color="#0563bb" />
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
                              <Ionicons name="chevron-forward" size={14} color="#0563bb" />
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
            {/* TAB 3: NHÂN SỰ (Screen 3)                                */}
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
                  <Text style={styles.sectionTitle}>
                    Nhân sự phòng ban
                  </Text>
                </View>

                {filteredMembers.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <View style={styles.emptyIconCircle}>
                      <MaterialCommunityIcons name="account-group-outline" size={34} color="#0563bb" />
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
                                  Level {memberLevel} - {levelTitle}
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
                              <Ionicons name="arrow-up" size={14} color="#FFFFFF" />
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
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBrandingBar: {
    alignItems: 'center',
    paddingTop: 4,
    paddingBottom: 2,
  },
  topBrandingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 1.5,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
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

  deptSection: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  deptSelectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 10,
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
    backgroundColor: 'rgba(5, 99, 187, 0.08)',
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
    marginTop: 1,
    letterSpacing: 0.5,
  },

  /* Solid Stats Banner (#0563bb) */
  statsCardWrapper: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  statsCardSolid: {
    backgroundColor: '#0563bb',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
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
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 26,
  },
  statsLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#E2E8F0',
    marginTop: 1,
  },
  statsDivider: {
    width: 1,
    height: 34,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    marginHorizontal: 12,
  },

  /* Underline Tabs */
  tabUnderlineBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    marginHorizontal: 16,
    marginBottom: 14,
  },
  tabUnderlineBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    position: 'relative',
  },
  tabUnderlineText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
  },
  tabUnderlineTextActive: {
    color: '#0563bb',
    fontWeight: '700',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: -1,
    left: '15%',
    right: '15%',
    height: 3,
    backgroundColor: '#0563bb',
    borderRadius: 2,
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
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },

  /* Search Bar (Screen 3) */
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    height: 42,
    marginBottom: 14,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
  },

  /* Member Cards (Screen 3) */
  membersList: {
    gap: 12,
  },
  memberCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
  },
  memberTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  memberAvatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(5, 99, 187, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0563bb',
  },
  memberMetaCol: {
    marginLeft: 12,
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
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(5, 99, 187, 0.08)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 6,
  },
  memberLevelPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0563bb',
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
    backgroundColor: '#0563bb',
    borderRadius: 8,
    paddingHorizontal: 14,
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  changeLevelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* Empty Evidence (Screen 4) */
  emptyEvidenceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 44,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyDocCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(5, 99, 187, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyEvidenceTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  emptyEvidenceSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
  },

  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 36,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(5, 99, 187, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 6,
  },

  /* Projects tab */
  projectsList: {
    gap: 12,
  },
  projectCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
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
  },
  projectLevelBadgeText: {
    fontSize: 11,
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
    backgroundColor: 'rgba(5, 99, 187, 0.08)',
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
    height: 38,
    borderRadius: 8,
  },
  projectActionBtnActive: {
    backgroundColor: '#0563bb',
  },
  projectActionBtnNormal: {
    backgroundColor: 'rgba(5, 99, 187, 0.08)',
  },
  projectActionBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  projectActionBtnTextActive: {
    color: '#FFFFFF',
  },
  projectActionBtnTextNormal: {
    color: '#0563bb',
  },

  /* Requests tab */
  requestsList: {
    gap: 12,
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
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
    backgroundColor: 'rgba(5, 99, 187, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitialText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0563bb',
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
    color: '#0563bb',
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
    color: '#0563bb',
  },
});
