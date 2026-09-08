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
import { useRouter } from 'expo-router';
import { useAuth } from '../../providers/AuthProvider';
import { useDepartments } from '../../hooks/useDepartments';
import {
  levelingApi,
  UserLevelProgressData,
  LevelPromotionRequestItem,
  DepartmentLevelItem,
} from '../../api/leveling.api';
import { LevelNameBadge, LEVEL_COLORS, LEVEL_DEFAULT_NAMES } from '../../components/common/LevelNameBadge';
import { EmployeeLevelProgressCard } from './EmployeeLevelProgressCard';
import { EvidenceSubmissionModal } from './EvidenceSubmissionModal';
import { LeaderPromotionReviewModal } from './LeaderPromotionReviewModal';
import { DirectLevelChangeModal } from './DirectLevelChangeModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const UnifiedLevelingScreen: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();

  const isAdmin = user?.roles?.includes('ADMIN') || user?.roles?.includes('SUPER_ADMIN');
  const isLeaderOrAdmin =
    isAdmin ||
    user?.roles?.includes('LEADER') ||
    user?.roles?.includes('HR');

  const [activeTab, setActiveTab] = useState<'roadmap' | 'members' | 'config'>('roadmap');
  const [leaderSubTab, setLeaderSubTab] = useState<'members_list' | 'pending_requests'>('members_list');

  const [progressData, setProgressData] = useState<UserLevelProgressData | null>(null);
  const [promotionRequests, setPromotionRequests] = useState<LevelPromotionRequestItem[]>([]);
  const [departmentMembers, setDepartmentMembers] = useState<any[]>([]);

  // Department Level Configs
  const [deptLevelConfigs, setDeptLevelConfigs] = useState<DepartmentLevelItem[]>([]);
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // Department picker for Admin / Leader
  const { data: deptData } = useDepartments({ limit: 50 });
  const deptList: Array<{ id: string; name: string }> = (deptData as any)?.data || (Array.isArray(deptData) ? deptData : []);
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals state
  const [isSubmitModalVisible, setIsSubmitModalVisible] = useState(false);
  const [selectedReviewRequest, setSelectedReviewRequest] =
    useState<LevelPromotionRequestItem | null>(null);
  const [directChangeUser, setDirectChangeUser] = useState<{
    id: string;
    fullName: string;
    currentLevelNumber: number;
    departmentName?: string;
  } | null>(null);

  const activeDeptId = selectedDeptId || progressData?.departmentId || deptList[0]?.id || '';
  const activeDeptName =
    deptList.find((d) => d.id === activeDeptId)?.name ||
    progressData?.departmentName ||
    'Phòng ban';

  const loadData = useCallback(async () => {
    try {
      // 1. Load my progress
      const myProgress = await levelingApi.getMyLevelProgress().catch(() => null);
      if (myProgress) {
        setProgressData(myProgress);
        if (!selectedDeptId && myProgress.departmentId) {
          setSelectedDeptId(myProgress.departmentId);
        }
      }

      // 2. Load Department Level Configs
      const queryDeptId = selectedDeptId || myProgress?.departmentId || deptList[0]?.id;
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
      }

      // 3. If Leader/Admin, load pending requests & department members
      if (isLeaderOrAdmin && queryDeptId) {
        const [requests, membersRes] = await Promise.all([
          levelingApi.getDepartmentPromotionRequests(queryDeptId).catch(() => []),
          import('../../api/employees.api')
            .then((m) => m.fetchEmployees({ departmentId: queryDeptId, limit: 100 }))
            .catch(() => ({ data: [] })),
        ]);

        setPromotionRequests(Array.isArray(requests) ? requests : []);
        setDepartmentMembers(Array.isArray((membersRes as any)?.data) ? (membersRes as any).data : []);
      }
    } catch (e) {
      console.error('Failed to load leveling data:', e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [isLeaderOrAdmin, selectedDeptId, deptList]);

  useEffect(() => {
    loadData();
  }, [loadData, selectedDeptId]);

  const onRefresh = () => {
    setIsRefreshing(true);
    loadData();
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
        })),
      );
      Alert.alert('Thành công', `Đã lưu cấu hình danh xưng cấp bậc cho phòng ${activeDeptName}!`);
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
        <Text style={styles.headerTitle}>Hệ Thống Phân Cấp Nhân Sự</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Top Profile Summary */}
      {progressData && (
        <View style={styles.profileSummaryCard}>
          <View style={styles.avatarWrapper}>
            <Image
              source={
                progressData.avatarUrl
                  ? { uri: progressData.avatarUrl }
                  : { uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150' }
              }
              style={[
                styles.avatarImage,
                { borderColor: progressData.currentLevel.colorHex || '#2196F3' },
              ]}
            />
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
      )}

      {/* 3 Main Interactive Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'roadmap' && styles.tabBtnActive]}
          onPress={() => setActiveTab('roadmap')}
        >
          <Ionicons
            name="ribbon-outline"
            size={16}
            color={activeTab === 'roadmap' ? '#2563EB' : '#94A3B8'}
          />
          <Text style={[styles.tabText, activeTab === 'roadmap' && styles.tabTextActive]}>
            Lộ Trình Cấp Bậc
          </Text>
        </TouchableOpacity>

        {isLeaderOrAdmin && (
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'members' && styles.tabBtnActive]}
            onPress={() => setActiveTab('members')}
          >
            <Ionicons
              name="people-outline"
              size={16}
              color={activeTab === 'members' ? '#2563EB' : '#94A3B8'}
            />
            <Text style={[styles.tabText, activeTab === 'members' && styles.tabTextActive]}>
              Nhân Sự & Duyệt
            </Text>
            {pendingCount > 0 && (
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingBadgeText}>{pendingCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}

        {isLeaderOrAdmin && (
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'config' && styles.tabBtnActive]}
            onPress={() => setActiveTab('config')}
          >
            <Ionicons
              name="settings-outline"
              size={16}
              color={activeTab === 'config' ? '#2563EB' : '#94A3B8'}
            />
            <Text style={[styles.tabText, activeTab === 'config' && styles.tabTextActive]}>
              Cấu Hình Tên Level
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Admin / Leader Department Selector Carousel */}
      {isLeaderOrAdmin && deptList.length > 0 && (
        <View style={styles.deptSelectorContainer}>
          <Text style={styles.deptSelectorLabel}>Phòng ban đang chọn:</Text>
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
                  onOpenSubmitModal={() => setIsSubmitModalVisible(true)}
                />
              )}

              {/* Interactive 8 Levels Roadmap */}
              <View style={styles.roadmapCard}>
                <View style={styles.roadmapHeaderRow}>
                  <Text style={styles.roadmapTitle}>Hệ Thống 8 Cấp Bậc ({activeDeptName})</Text>
                  {isLeaderOrAdmin && (
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
                          if (isLeaderOrAdmin) {
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
              {/* Leader Sub-tabs */}
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

              {/* Sub-tab 1: Department Members List */}
              {leaderSubTab === 'members_list' && (
                <View style={styles.membersList}>
                  {departmentMembers.map((m, idx) => {
                    const memberLevel = m.profile?.currentLevelNumber || 1;
                    const memberName = m.profile?.fullName || m.userCode;

                    return (
                      <TouchableOpacity
                        key={m.id || idx}
                        style={styles.memberCard}
                        onPress={() =>
                          setDirectChangeUser({
                            id: m.id,
                            fullName: memberName,
                            currentLevelNumber: memberLevel,
                            departmentName: activeDeptName,
                          })
                        }
                      >
                        <View style={styles.memberInfoRow}>
                          <Image
                            source={
                              m.profile?.avatarUrl
                                ? { uri: m.profile.avatarUrl }
                                : { uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150' }
                            }
                            style={[
                              styles.memberAvatar,
                              { borderColor: LEVEL_COLORS[memberLevel] || '#2196F3' },
                            ]}
                          />
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

                          <View style={styles.directChangeBtn}>
                            <Ionicons name="flash" size={14} color="#FFF" />
                            <Text style={styles.directChangeBtnText}>Đổi Level</Text>
                          </View>
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
                        onPress={() => setSelectedReviewRequest(req)}
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
          {/* TAB 3: DIRECT LEVEL NAME CONFIGURATION                    */}
          {/* ========================================================= */}
          {activeTab === 'config' && isLeaderOrAdmin && (
            <View style={styles.configContainer}>
              <View style={styles.configHeaderCard}>
                <Ionicons name="options-outline" size={24} color="#2563EB" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.configHeaderTitle}>Cấu Hình Tên 8 Level ({activeDeptName})</Text>
                  <Text style={styles.configHeaderSubtitle}>
                    Gõ tên danh xưng riêng cho từng Level của phòng ban này và bấm Lưu.
                  </Text>
                </View>
              </View>

              {deptLevelConfigs.map((lvl) => {
                const color = LEVEL_COLORS[lvl.levelNumber] || '#2196F3';

                return (
                  <View key={lvl.levelNumber} style={styles.configRowCard}>
                    <View style={styles.configRowHeader}>
                      <View style={[styles.configDot, { backgroundColor: color }]} />
                      <Text style={[styles.configLevelTitle, { color }]}>
                        Level {lvl.levelNumber} (Mặc định: {lvl.defaultName})
                      </Text>
                    </View>
                    <TextInput
                      style={styles.configInput}
                      placeholder={`Nhập tên riêng cho Level ${lvl.levelNumber}...`}
                      placeholderTextColor="#94A3B8"
                      value={lvl.customLevelName}
                      onChangeText={(txt) => handleConfigNameChange(lvl.levelNumber, txt)}
                    />
                  </View>
                );
              })}

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

          <View style={{ height: 50 }} />
        </ScrollView>
      )}

      {/* Modals */}
      {progressData && (
        <EvidenceSubmissionModal
          visible={isSubmitModalVisible}
          currentLevelNumber={progressData.currentLevel.levelNumber}
          currentLevelName={progressData.currentLevel.displayName}
          nextLevelNumber={progressData.nextLevel.levelNumber}
          nextLevelName={progressData.nextLevel.displayName}
          departmentId={activeDeptId}
          onClose={() => setIsSubmitModalVisible(false)}
          onSuccess={loadData}
        />
      )}

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
  profileSummaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    padding: 14,
    marginHorizontal: 16,
    borderRadius: 14,
    marginBottom: 10,
    gap: 12,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2.5,
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
    padding: 4,
    marginBottom: 10,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 9,
    gap: 4,
  },
  tabBtnActive: {
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 4,
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
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
  },
  pendingBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFF',
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
});
