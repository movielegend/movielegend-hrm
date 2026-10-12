import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Modal,
  Image,
  TouchableOpacity,
  Alert,
  StatusBar,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '../../components/Screen';
import { ScreenContainer } from '../../components/ScreenContainer';
import {
  useDepartmentReports,
  useConvertPlanToTasks,
} from '../../hooks/useDailyReports';
import { useAuth } from '../../providers/AuthProvider';
import { DailyReportFormScreen } from './DailyReportFormScreen';
import { PdfViewerModal } from '../../components/PdfViewerModal';
import type { DepartmentReportItem, DailyReport } from '../../api/daily-reports.api';

function formatDateISO(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function LeaderDepartmentReportsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();

  // Scope: 'team' (Phòng ban) | 'mine' (Của tôi)
  const [scope, setScope] = useState<'team' | 'mine'>('team');

  // Date selection
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const dateStr = formatDateISO(currentDate);
  const todayStr = useMemo(() => formatDateISO(new Date()), []);
  const isToday = dateStr === todayStr;

  // Filter within team: 'all' | 'sent' | 'missing'
  const [activeFilter, setActiveFilter] = useState<'all' | 'sent' | 'missing'>('all');

  // Selected employee report for detail view (if non-null, shows #employee-detail)
  const [selectedReport, setSelectedReport] = useState<DailyReport | null>(null);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [detailTab, setDetailTab] = useState<'results' | 'plans' | 'notes'>('results');
  const [expandedCompleted, setExpandedCompleted] = useState<boolean>(false);
  const [selectedPlanItems, setSelectedPlanItems] = useState<string[]>([]);

  // Preview modals
  const [previewImageUri, setPreviewImageUri] = useState<string | null>(null);
  const [previewImageTitle, setPreviewImageTitle] = useState<string>('Xem ảnh đính kèm');
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [pdfPreviewTitle, setPdfPreviewTitle] = useState<string>('Xem tài liệu');

  // Queries & Mutations
  const deptReportsQuery = useDepartmentReports(undefined, dateStr);
  const convertTasksMutation = useConvertPlanToTasks(selectedReport?.id || '');

  const data = deptReportsQuery.data;
  const memberReports = data?.memberReports || [];
  const deptName = user?.department?.name || 'Phòng ban';

  // Stats
  const stats = useMemo(() => {
    const total = memberReports.length;
    let sent = 0;
    let missing = 0;
    memberReports.forEach((item) => {
      if (item.isSubmitted) sent++;
      else missing++;
    });
    return { total, sent, missing };
  }, [memberReports]);

  // Filtered members list
  const filteredMembers = useMemo(() => {
    return memberReports.filter((item) => {
      if (activeFilter === 'sent') return item.isSubmitted;
      if (activeFilter === 'missing') return !item.isSubmitted;
      return true;
    });
  }, [memberReports, activeFilter]);

  // Date handlers
  const handlePrevDate = () => {
    setCurrentDate((prev) => new Date(prev.getTime() - 24 * 60 * 60 * 1000));
  };
  const handleNextDate = () => {
    setCurrentDate((prev) => new Date(prev.getTime() + 24 * 60 * 60 * 1000));
  };
  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleOpenDetail = (item: DepartmentReportItem) => {
    if (!item.report) {
      Alert.alert('Chưa nộp báo cáo', `Nhân sự ${item.user.profile?.fullName || item.user.userCode} chưa gửi báo cáo ngày này.`);
      return;
    }
    setSelectedReport(item.report);
    setSelectedUser(item.user);
    setSelectedPlanItems(item.report.tomorrowPlan || []);
    setDetailTab('results');
    setExpandedCompleted(false);
  };

  const togglePlanSelection = (plan: string) => {
    setSelectedPlanItems((prev) =>
      prev.includes(plan) ? prev.filter((p) => p !== plan) : [...prev, plan]
    );
  };

  const handleConvertSelectedPlanToTasks = async () => {
    if (!selectedReport || !selectedReport.id) return;
    if (selectedPlanItems.length === 0) {
      Alert.alert('Thông báo', 'Vui lòng chọn ít nhất 1 đầu mục kế hoạch để duyệt thành Task');
      return;
    }

    try {
      await convertTasksMutation.mutateAsync({
        planItems: selectedPlanItems,
      });
      Alert.alert(
        'Thành công',
        `Đã tạo ${selectedPlanItems.length} nhiệm vụ cho ${selectedUser?.profile?.fullName || 'nhân sự'} vào ngày mai!`
      );
    } catch (e: any) {
      console.error('Convert task error:', e);
      Alert.alert('Lỗi', e?.response?.data?.message || 'Không thể tạo task, vui lòng thử lại');
    }
  };

  // -------------------------------------------------------------
  // DETAIL VIEW: EMPLOYEE REPORT DETAIL (#employee-detail)
  // -------------------------------------------------------------
  if (selectedReport) {
    const memberName = selectedUser?.profile?.fullName || selectedUser?.userCode || 'Nhân sự';
    const userCode = selectedUser?.userCode || '';
    const completedTasksCount = selectedReport.completedTasks?.length || 0;
    const inProgressTasksCount = selectedReport.inProgressTasks?.length || 0;
    const plansCount = selectedReport.tomorrowPlan?.length || 0;

    const visibleCompleted = expandedCompleted
      ? selectedReport.completedTasks || []
      : (selectedReport.completedTasks || []).slice(0, 3);
    const hiddenCompletedCount = Math.max(0, completedTasksCount - 3);

    return (
      <Screen backgroundColor="#F6F7FB">
        <ScreenContainer style={{ paddingTop: 0, paddingBottom: Math.max(insets.bottom + 16, 24) }}>
          {/* Header Card */}
          <View style={styles.detailHeaderCard}>
            <Pressable style={styles.backLinkBtn} onPress={() => setSelectedReport(null)}>
              <Text style={styles.backLinkText}>← Phòng ban</Text>
            </Pressable>

            <View style={styles.detailTitleRow}>
              <Text style={styles.detailNameText}>{memberName}</Text>
              <View style={[styles.badgePill, styles.badgePillDone]}>
                <Text style={[styles.badgePillText, styles.badgePillDoneText]}>Đã nộp</Text>
              </View>
            </View>

            <Text style={styles.detailRoleDateText}>
              {userCode ? `${userCode} · ` : ''}{deptName} ·{' '}
              {new Date(selectedReport.reportDate).toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              })}
            </Text>

            {/* Callout summary */}
            <View style={styles.calloutSummaryBox}>
              <Text style={styles.calloutSummaryText}>
                {completedTasksCount} việc hoàn thành · {inProgressTasksCount} đang làm
              </Text>
              <Text style={styles.calloutSummaryText}>
                Tự đánh giá: <Text style={styles.goldStarRating}>★ {selectedReport.selfRating || 5}/5 sao</Text>
              </Text>
            </View>

            {/* Admin Review Feedback Banner */}
            {selectedReport.status === 'REVIEWED' && (
              <View style={styles.adminReviewBannerCard}>
                <View style={styles.adminReviewBannerHeader}>
                  <MaterialCommunityIcons name="star-circle" size={20} color="#EAB308" />
                  <Text style={styles.adminReviewBannerTitle}>ĐÁNH GIÁ TỪ ADMIN / BAN GIÁM ĐỐC</Text>
                  <Text style={styles.adminReviewBannerStars}>
                    {'★'.repeat(selectedReport.adminRating || 5)}{'☆'.repeat(5 - (selectedReport.adminRating || 5))} ({selectedReport.adminRating || 5}/5)
                  </Text>
                </View>
                {selectedReport.adminReview ? (
                  <View style={styles.adminReviewBannerComment}>
                    <Text style={styles.adminReviewBannerCommentText}>"{selectedReport.adminReview}"</Text>
                  </View>
                ) : null}
                <View style={styles.adminReviewBannerMeta}>
                  <Text style={styles.adminReviewBannerMetaText}>
                    Người duyệt: {selectedReport.reviewedBy?.profile?.fullName || selectedReport.reviewedBy?.userCode || 'Admin'}
                  </Text>
                  {selectedReport.reviewedAt && (
                    <Text style={styles.adminReviewBannerMetaText}>
                      {new Date(selectedReport.reviewedAt).toLocaleDateString('vi-VN')}
                    </Text>
                  )}
                </View>
              </View>
            )}
          </View>

          {/* 3 Detail Tabs */}
          <View style={styles.detailTabsBar}>
            <Pressable
              style={[styles.detailTabBtn, detailTab === 'results' && styles.detailTabBtnActive]}
              onPress={() => setDetailTab('results')}
            >
              <Text style={[styles.detailTabBtnText, detailTab === 'results' && styles.detailTabBtnTextActive]}>
                Kết quả
              </Text>
            </Pressable>

            <Pressable
              style={[styles.detailTabBtn, detailTab === 'plans' && styles.detailTabBtnActive]}
              onPress={() => setDetailTab('plans')}
            >
              <Text style={[styles.detailTabBtnText, detailTab === 'plans' && styles.detailTabBtnTextActive]}>
                Kế hoạch
              </Text>
            </Pressable>

            <Pressable
              style={[styles.detailTabBtn, detailTab === 'notes' && styles.detailTabBtnActive]}
              onPress={() => setDetailTab('notes')}
            >
              <Text style={[styles.detailTabBtnText, detailTab === 'notes' && styles.detailTabBtnTextActive]}>
                Nhận xét & tệp
              </Text>
            </Pressable>
          </View>

          {/* TAB 1: KẾT QUẢ */}
          {detailTab === 'results' && (
            <View style={styles.tabContentContainer}>
              {/* Quantitative Metrics */}
              <View style={styles.panelCard}>
                <Text style={styles.panelCardTitle}>Kết quả công việc định lượng</Text>
                <Text style={styles.panelCardSubtitle}>
                  {selectedReport.metrics && selectedReport.metrics.length > 0
                    ? `${selectedReport.metrics.length} chỉ tiêu · Đã ghi nhận`
                    : '4 chỉ tiêu · Chưa có số liệu'}
                </Text>

                {(!selectedReport.metrics || selectedReport.metrics.length === 0) ? (
                  <Text style={styles.emptyPromptText}>Chưa có số liệu định lượng</Text>
                ) : (
                  selectedReport.metrics.map((m, idx) => (
                    <View key={idx} style={styles.metricItemRow}>
                      <View style={{ flex: 1, paddingRight: 8 }}>
                        <Text style={styles.metricItemName}>{m.name}</Text>
                        {!!m.note && <Text style={styles.metricItemNote}>{m.note}</Text>}
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.metricItemValue}>
                          {m.value !== undefined && m.value !== '' ? String(m.value) : 'Chưa nhập'}
                          {!!m.unit && m.value !== undefined && m.value !== '' ? ` ${m.unit}` : ''}
                        </Text>
                      </View>
                    </View>
                  ))
                )}
              </View>

              {/* Completed Tasks */}
              <View style={styles.panelCard}>
                <View style={styles.panelHeaderRow}>
                  <Text style={styles.panelCardTitle}>Đã hoàn thành</Text>
                  <Text style={styles.panelHeaderCountText}>{completedTasksCount} việc</Text>
                </View>

                {completedTasksCount === 0 ? (
                  <Text style={styles.emptyPromptText}>Chưa có công việc hoàn thành</Text>
                ) : (
                  <>
                    {visibleCompleted.map((t, idx) => (
                      <View key={idx} style={styles.simpleListItem}>
                        <Text style={styles.simpleListItemText}>{t.title}</Text>
                        {!!t.note && <Text style={styles.simpleListItemSub}>{t.note}</Text>}
                      </View>
                    ))}

                    {completedTasksCount > 3 && (
                      <Pressable
                        style={styles.expandCollapseBtn}
                        onPress={() => setExpandedCompleted(!expandedCompleted)}
                      >
                        <Text style={styles.expandCollapseBtnText}>
                          {expandedCompleted
                            ? 'Thu gọn danh sách công việc ▲'
                            : `Xem thêm ${hiddenCompletedCount} công việc ▼`}
                        </Text>
                      </Pressable>
                    )}
                  </>
                )}
              </View>

              {/* In Progress Tasks */}
              <View style={styles.panelCard}>
                <View style={styles.panelHeaderRow}>
                  <Text style={styles.panelCardTitle}>Đang thực hiện</Text>
                  <Text style={styles.panelHeaderCountText}>{inProgressTasksCount} việc</Text>
                </View>

                {inProgressTasksCount === 0 ? (
                  <Text style={styles.emptyPromptText}>Không có công việc đang thực hiện</Text>
                ) : (
                  selectedReport.inProgressTasks.map((t, idx) => (
                    <View key={idx} style={styles.simpleListItem}>
                      <Text style={styles.simpleListItemText}>{t.title}</Text>
                      <Text style={styles.simpleListItemSub}>
                        Dự kiến hoàn thành · {t.expectedDate || '20/09/2026'}
                        {t.progress !== undefined ? ` (${t.progress}%)` : ''}
                      </Text>
                    </View>
                  ))
                )}
              </View>
            </View>
          )}

          {/* TAB 2: KẾ HOẠCH */}
          {detailTab === 'plans' && (
            <View style={styles.tabContentContainer}>
              {/* Obstacles & Support */}
              <View style={styles.panelCard}>
                <Text style={styles.panelCardTitle}>Khó khăn & hỗ trợ</Text>
                {selectedReport.obstacles && selectedReport.obstacles.trim().length > 0 ? (
                  <View style={styles.calloutAmberBox}>
                    <Text style={styles.calloutAmberBoxText}>{selectedReport.obstacles}</Text>
                  </View>
                ) : (
                  <Text style={[styles.emptyPromptText, { marginVertical: 4 }]}>
                    Nhân viên báo cáo không có khó khăn hay trở ngại.
                  </Text>
                )}
              </View>

              {/* Tomorrow Plans & Convert to Tasks */}
              <View style={styles.panelCard}>
                <View style={styles.panelHeaderRow}>
                  <Text style={styles.panelCardTitle}>Kế hoạch ngày mai</Text>
                  <Text style={styles.panelHeaderCountText}>{plansCount} việc</Text>
                </View>

                {plansCount === 0 ? (
                  <View style={{ marginTop: 4 }}>
                    <Text style={styles.emptyPromptText}>Chưa có kế hoạch được đề xuất.</Text>
                    <Text style={[styles.emptyPromptText, { marginTop: 2 }]}>
                      Không có đầu việc để duyệt thành Task.
                    </Text>
                  </View>
                ) : (
                  <>
                    <Text style={[styles.panelCardSubtitle, { marginBottom: 10 }]}>
                      Chọn đầu việc để tạo Task giao việc cho nhân viên:
                    </Text>
                    {selectedReport.tomorrowPlan.map((p, idx) => {
                      const isSelected = selectedPlanItems.includes(p);
                      return (
                        <Pressable
                          key={idx}
                          style={styles.planCheckItem}
                          onPress={() => togglePlanSelection(p)}
                        >
                          <MaterialCommunityIcons
                            name={isSelected ? 'checkbox-marked' : 'checkbox-blank-outline'}
                            size={22}
                            color={isSelected ? '#315DE5' : '#ABB7C9'}
                          />
                          <Text style={[styles.planCheckItemText, isSelected && styles.planCheckItemTextActive]}>
                            {p}
                          </Text>
                        </Pressable>
                      );
                    })}

                    <Pressable
                      style={[
                        styles.convertTaskBtn,
                        selectedPlanItems.length === 0 && { opacity: 0.5 },
                      ]}
                      onPress={handleConvertSelectedPlanToTasks}
                      disabled={selectedPlanItems.length === 0 || convertTasksMutation.isPending}
                    >
                      {convertTasksMutation.isPending ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <>
                          <MaterialCommunityIcons name="checkbox-marked-circle-outline" size={18} color="#FFFFFF" />
                          <Text style={styles.convertTaskBtnText}>
                            Duyệt {selectedPlanItems.length} đầu việc thành Task
                          </Text>
                        </>
                      )}
                    </Pressable>
                  </>
                )}
              </View>
            </View>
          )}

          {/* TAB 3: NHẬN XÉT & TỆP */}
          {detailTab === 'notes' && (
            <View style={styles.tabContentContainer}>
              {/* Self Assessment */}
              <View style={styles.panelCard}>
                <Text style={styles.panelCardTitle}>Tự đánh giá của nhân viên</Text>
                <View style={styles.selfRatingBetweenRow}>
                  <Text style={styles.goldStarRating}>
                    ★ {selectedReport.selfRating || 5}/5 sao
                  </Text>
                </View>
                <Text style={styles.selfReviewDetailText}>
                  {selectedReport.selfReview?.trim()
                    ? selectedReport.selfReview
                    : 'Chưa có nhận xét bổ sung.'}
                </Text>
              </View>

              {/* Attachments */}
              <View style={styles.panelCard}>
                <Text style={styles.panelCardTitle}>Tệp đính kèm</Text>
                {(!selectedReport.attachments || selectedReport.attachments.length === 0) ? (
                  <Text style={styles.emptyPromptText}>Chưa có tệp đính kèm.</Text>
                ) : (
                  <View style={{ marginTop: 8, gap: 10 }}>
                    {selectedReport.attachments.map((file, idx) => {
                      const isImg =
                        file.fileType === 'IMAGE' ||
                        file.url.toLowerCase().match(/\.(jpeg|jpg|gif|png|webp)($|\?)/);

                      return (
                        <Pressable
                          key={idx}
                          style={styles.attachmentItemCard}
                          onPress={() => {
                            if (isImg) {
                              setPreviewImageUri(file.url);
                              setPreviewImageTitle(file.fileName || `Ảnh ${idx + 1}`);
                            } else {
                              setPdfPreviewUrl(file.url);
                              setPdfPreviewTitle(file.fileName || 'Xem tài liệu đính kèm');
                            }
                          }}
                        >
                          {isImg ? (
                            <Image source={{ uri: file.url }} style={styles.attachmentThumb} />
                          ) : (
                            <View style={styles.attachmentDocBadge}>
                              <MaterialCommunityIcons name="file-pdf-box" size={24} color="#EF4444" />
                            </View>
                          )}

                          <View style={{ flex: 1, marginLeft: 10 }}>
                            <Text style={styles.attachmentItemName} numberOfLines={1}>
                              {file.fileName || (isImg ? 'Ảnh đính kèm' : 'Tài liệu đính kèm')}
                            </Text>
                            <Text style={styles.attachmentItemSub}>
                              {file.size ? `${(file.size / 1024).toFixed(0)} KB` : isImg ? 'Hình ảnh' : 'Tài liệu'} · Chạm để xem
                            </Text>
                          </View>
                          <MaterialCommunityIcons name="eye-outline" size={20} color="#315DE5" />
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </View>
            </View>
          )}
        </ScreenContainer>

        {/* Fullscreen Image Preview Modal */}
        <Modal
          visible={!!previewImageUri}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setPreviewImageUri(null)}
        >
          <View style={styles.fullscreenModalOverlay}>
            <View style={styles.fullscreenModalHeader}>
              <Text style={styles.fullscreenModalTitle} numberOfLines={1}>
                {previewImageTitle}
              </Text>
              <TouchableOpacity
                style={styles.fullscreenModalCloseBtn}
                onPress={() => setPreviewImageUri(null)}
              >
                <Ionicons name="close" size={26} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <View style={styles.fullscreenImageContainer}>
              {previewImageUri && (
                <Image
                  source={{ uri: previewImageUri }}
                  style={styles.fullscreenImage}
                  resizeMode="contain"
                />
              )}
            </View>
          </View>
        </Modal>

        {/* PDF Viewer Modal */}
        <PdfViewerModal
          visible={!!pdfPreviewUrl}
          url={pdfPreviewUrl}
          title={pdfPreviewTitle}
          onClose={() => setPdfPreviewUrl(null)}
        />
      </Screen>
    );
  }

  // -------------------------------------------------------------
  // SCOPE: 'mine' (Báo cáo cá nhân của Trưởng phòng)
  // -------------------------------------------------------------
  // -------------------------------------------------------------
  // SCOPE: 'mine' (Báo cáo cá nhân của Trưởng phòng)
  // -------------------------------------------------------------
  if (scope === 'mine') {
    return (
      <DailyReportFormScreen
        hideHeaderTitle
        headerSlot={({ currentStep }: { currentStep: number }) => (
          <View>
            <StatusBar barStyle="light-content" backgroundColor="#1B3B2B" />
            {/* Dark Forest Green Banner */}
            <View style={{
              backgroundColor: '#1B3B2B',
              paddingTop: Math.max(insets.top, 16),
              paddingBottom: 16,
              paddingHorizontal: 16,
              marginHorizontal: -16,
              marginTop: -8,
              marginBottom: 14,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Pressable onPress={() => router.back()} style={{ padding: 4, marginLeft: -4 }} hitSlop={10}>
                  <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                </Pressable>
                <Text style={{
                  fontSize: 11,
                  fontWeight: '700',
                  letterSpacing: 1.5,
                  color: 'rgba(255,255,255,0.7)',
                  textTransform: 'uppercase',
                }}>
                  MOVIE LEGEND
                </Text>
                <View style={{ width: 28 }} />
              </View>

              <Text style={{ fontSize: 24, fontWeight: '800', color: '#FFFFFF', marginTop: 10 }}>
                {currentStep === 2 ? 'Xem lại báo cáo' : 'Báo cáo cuối ngày'}
              </Text>
              <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 2 }}>
                {currentStep === 2 ? 'Kiểm tra toàn bộ nội dung trước khi nộp.' : 'Báo cáo cá nhân của trưởng phòng.'}
              </Text>
            </View>

            {/* Scope Switcher: [ Phòng ban | Của tôi ] */}
            <View style={{
              flexDirection: 'row',
              backgroundColor: '#F1F5F9',
              borderRadius: 24,
              padding: 4,
              marginBottom: 14,
            }}>
              <Pressable
                style={{
                  flex: 1,
                  alignItems: 'center',
                  paddingVertical: 8,
                  borderRadius: 20,
                  backgroundColor: 'transparent',
                }}
                onPress={() => setScope('team')}
              >
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#64748B' }}>
                  Phòng ban
                </Text>
              </Pressable>

              <Pressable
                style={{
                  flex: 1,
                  alignItems: 'center',
                  paddingVertical: 8,
                  borderRadius: 20,
                  backgroundColor: '#FFFFFF',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.08,
                  shadowRadius: 2,
                  elevation: 2,
                }}
                onPress={() => setScope('mine')}
              >
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#0F172A' }}>
                  Của tôi
                </Text>
              </Pressable>
            </View>
          </View>
        )}
      />
    );
  }

  // -------------------------------------------------------------
  // SCOPE: 'team' (Tiến độ báo cáo phòng ban - Screen 2)
  // -------------------------------------------------------------
  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <StatusBar barStyle="light-content" backgroundColor="#1B3B2B" />

      {/* Screen 2: Dark Forest Green Banner */}
      <View style={{
        backgroundColor: '#1B3B2B',
        paddingTop: Math.max(insets.top, 16),
        paddingBottom: 16,
        paddingHorizontal: 16,
      }}>
        {/* Top row: Back button & brand */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Pressable onPress={() => router.back()} style={{ padding: 4, marginLeft: -4 }} hitSlop={10}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </Pressable>
          <Text style={{
            fontSize: 11,
            fontWeight: '700',
            letterSpacing: 1.5,
            color: 'rgba(255,255,255,0.7)',
            textTransform: 'uppercase',
          }}>
            MOVIE LEGEND
          </Text>
          <View style={{ width: 28 }} />
        </View>

        {/* Title & Subtitle */}
        <Text style={{ fontSize: 24, fontWeight: '800', color: '#FFFFFF', marginTop: 10 }}>
          Báo cáo cuối ngày
        </Text>
        <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 2 }}>
          Nắm tiến độ báo cáo của phòng ban.
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom + 80, 96) }}
        showsVerticalScrollIndicator={false}
      >
        {/* Scope Switcher: [ Phòng ban | Của tôi ] */}
        <View style={{
          flexDirection: 'row',
          backgroundColor: '#F1F5F9',
          borderRadius: 24,
          padding: 4,
          marginHorizontal: 16,
          marginTop: 14,
          marginBottom: 12,
        }}>
          <Pressable
            style={{
              flex: 1,
              alignItems: 'center',
              paddingVertical: 8,
              borderRadius: 20,
              backgroundColor: '#FFFFFF',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.08,
              shadowRadius: 2,
              elevation: 2,
            }}
            onPress={() => setScope('team')}
          >
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#0F172A' }}>
              Phòng ban
            </Text>
          </Pressable>

          <Pressable
            style={{
              flex: 1,
              alignItems: 'center',
              paddingVertical: 8,
              borderRadius: 20,
              backgroundColor: 'transparent',
            }}
            onPress={() => setScope('mine')}
          >
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#64748B' }}>
              Của tôi
            </Text>
          </Pressable>
        </View>

        {/* Date Selector Bar */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#FFFFFF',
          borderRadius: 12,
          borderWidth: 1,
          borderColor: '#E2E8F0',
          paddingHorizontal: 14,
          paddingVertical: 10,
          marginHorizontal: 16,
          marginBottom: 12,
        }}>
          <Pressable onPress={handlePrevDate} style={{ padding: 4 }}>
            <MaterialCommunityIcons name="chevron-left" size={24} color="#0F172A" />
          </Pressable>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#0F172A' }}>
              {currentDate.toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              })}
            </Text>
            {!isToday && (
              <Pressable
                style={{
                  backgroundColor: '#DCFCE7',
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 6,
                }}
                onPress={handleToday}
              >
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#166534' }}>Hôm nay</Text>
              </Pressable>
            )}
          </View>

          <Pressable onPress={handleNextDate} style={{ padding: 4 }}>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#0F172A" />
          </Pressable>
        </View>

        {/* 3 Stats Filter Summary Cards */}
        <View style={{ flexDirection: 'row', gap: 10, marginHorizontal: 16, marginBottom: 14 }}>
          {/* Card 1: Nhân sự */}
          <Pressable
            style={{
              flex: 1,
              backgroundColor: '#DCFCE7',
              borderRadius: 12,
              borderWidth: activeFilter === 'all' ? 2 : 1,
              borderColor: activeFilter === 'all' ? '#166534' : '#86EFAC',
              paddingVertical: 12,
              paddingHorizontal: 8,
              alignItems: 'center',
            }}
            onPress={() => setActiveFilter('all')}
          >
            <Text style={{ fontSize: 22, fontWeight: '800', color: '#166534', marginBottom: 2 }}>
              {stats.total}
            </Text>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#166534' }}>
              Nhân sự
            </Text>
          </Pressable>

          {/* Card 2: Đã nộp */}
          <Pressable
            style={{
              flex: 1,
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
              borderWidth: activeFilter === 'sent' ? 2 : 1,
              borderColor: activeFilter === 'sent' ? '#0F172A' : '#E2E8F0',
              paddingVertical: 12,
              paddingHorizontal: 8,
              alignItems: 'center',
            }}
            onPress={() => setActiveFilter('sent')}
          >
            <Text style={{ fontSize: 22, fontWeight: '800', color: '#0F172A', marginBottom: 2 }}>
              {stats.sent}
            </Text>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#475569' }}>
              Đã nộp
            </Text>
          </Pressable>

          {/* Card 3: Chưa nộp */}
          <Pressable
            style={{
              flex: 1,
              backgroundColor: '#FFEDD5',
              borderRadius: 12,
              borderWidth: activeFilter === 'missing' ? 2 : 1,
              borderColor: activeFilter === 'missing' ? '#EA580C' : '#FDBA74',
              paddingVertical: 12,
              paddingHorizontal: 8,
              alignItems: 'center',
            }}
            onPress={() => setActiveFilter('missing')}
          >
            <Text style={{ fontSize: 22, fontWeight: '800', color: '#EA580C', marginBottom: 2 }}>
              {stats.missing}
            </Text>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#EA580C' }}>
              Chưa nộp
            </Text>
          </Pressable>
        </View>

        {/* Section Title */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginHorizontal: 16,
          marginBottom: 10,
        }}>
          <Text style={{ fontSize: 14, fontWeight: '800', color: '#0F172A' }}>
            Nhân sự phòng {deptName}
          </Text>
          <Text style={{ fontSize: 13, color: '#64748B', fontWeight: '500' }}>
            {filteredMembers.length} người
          </Text>
        </View>

        {/* Department Member List */}
        {deptReportsQuery.isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#166534" />
            <Text style={styles.loadingPromptText}>Đang tải danh sách phòng ban...</Text>
          </View>
        ) : filteredMembers.length === 0 ? (
          <View style={styles.emptyPanel}>
            <Text style={styles.emptyPanelTitle}>Không có nhân sự phù hợp</Text>
            <Text style={styles.emptyPanelSub}>
              Chọn nhóm nhân sự khác hoặc đổi ngày để xem.
            </Text>
            <Pressable style={styles.restoreDateBtn} onPress={() => setActiveFilter('all')}>
              <Text style={styles.restoreDateBtnText}>Xem tất cả nhân sự</Text>
            </Pressable>
          </View>
        ) : (
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 12,
            borderWidth: 1,
            borderColor: '#E2E8F0',
            marginHorizontal: 16,
            overflow: 'hidden',
          }}>
            {filteredMembers.map((item, idx) => {
              const memberName = item.user.profile?.fullName || item.user.userCode || 'Nhân sự';
              const userCode = item.user.userCode || '';
              const isCurrentUser = item.user.id === user?.id;

              const initials = memberName
                .split(' ')
                .filter(Boolean)
                .slice(-2)
                .map((n) => (n && n[0] ? n[0].toUpperCase() : ''))
                .join('');

              const isLast = idx === filteredMembers.length - 1;

              return (
                <View
                  key={item.user.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 12,
                    paddingHorizontal: 14,
                    borderBottomWidth: isLast ? 0 : 1,
                    borderBottomColor: '#F1F5F9',
                  }}
                >
                  {/* Initials circle avatar */}
                  <View style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: '#DCFCE7',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: '#166534' }}>
                      {initials || 'NV'}
                    </Text>
                  </View>

                  {/* Body */}
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#0F172A' }}>
                      {memberName}{isCurrentUser ? ' • Bạn' : ''}
                    </Text>
                    <Text style={{ fontSize: 12, color: '#64748B', marginTop: 1 }}>
                      {userCode}
                    </Text>
                    <Text style={{
                      fontSize: 12,
                      fontWeight: '600',
                      color: item.isSubmitted ? '#16A34A' : '#EA580C',
                      marginTop: 2,
                    }}>
                      {item.isSubmitted ? 'Đã nộp' : 'Chưa nộp báo cáo'}
                    </Text>
                  </View>

                  {/* Action link */}
                  {item.isSubmitted ? (
                    <Pressable
                      style={{ paddingVertical: 6, paddingHorizontal: 4 }}
                      onPress={() => handleOpenDetail(item)}
                    >
                      <Text style={{ fontSize: 13, fontWeight: '700', color: '#166534' }}>
                        Xem báo cáo →
                      </Text>
                    </Pressable>
                  ) : isCurrentUser ? (
                    <Pressable
                      style={{ paddingVertical: 6, paddingHorizontal: 4 }}
                      onPress={() => setScope('mine')}
                    >
                      <Text style={{ fontSize: 13, fontWeight: '700', color: '#166534' }}>
                        Viết báo cáo →
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Bottom Sticky Action Button: Viết báo cáo của tôi */}
      <View style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: Math.max(insets.bottom + 8, 14),
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
      }}>
        <Pressable
          style={{
            backgroundColor: '#1B3B2B',
            height: 48,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onPress={() => setScope('mine')}
        >
          <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '700' }}>
            Viết báo cáo của tôi
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

// -------------------------------------------------------------
// STYLES
// -------------------------------------------------------------
const styles = StyleSheet.create({
  // HEADER
  leaderHeader: {
    paddingHorizontal: 4,
    paddingTop: 4,
    paddingBottom: 14,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  headerKicker: {
    fontSize: 11,
    letterSpacing: 1.4,
    color: '#6C788A',
    fontWeight: '600',
  },
  headerDeptTag: {
    fontSize: 12,
    color: '#6C788A',
    fontWeight: '600',
  },
  headerMainTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#192232',
    letterSpacing: -0.8,
    marginTop: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6C788A',
    marginTop: 4,
  },

  // SCOPE SWITCHER
  switcherBar: {
    flexDirection: 'row',
    backgroundColor: '#E9EDF3',
    padding: 4,
    borderRadius: 14,
    marginTop: 16,
    gap: 4,
  },
  switcherBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 11,
  },
  switcherBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  switcherBtnText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6C788A',
  },
  switcherBtnTextActive: {
    color: '#192232',
    fontWeight: '700',
  },

  // DATEBAR
  dateBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E9EDF3',
    marginBottom: 14,
  },
  dateBarNavBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateBarCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  dateBarCenterText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#192232',
    textAlign: 'center',
  },
  dateBarTodayBadge: {
    backgroundColor: '#EDF2FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  dateBarTodayBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#315DE5',
  },

  // 3 STATS FILTER BUTTONS
  statsGrid: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 16,
  },
  statBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'flex-start',
  },
  statBtnActive: {
    borderColor: '#315DE5',
    backgroundColor: '#EDF2FF',
  },
  statBtnCount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#192232',
    marginBottom: 2,
  },
  statBtnCountActive: {
    color: '#315DE5',
  },
  statBtnLabel: {
    fontSize: 11,
    color: '#6C788A',
    fontWeight: '500',
  },
  statBtnLabelActive: {
    color: '#315DE5',
    fontWeight: '700',
  },

  // SECTION HEADER
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  sectionTitleText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#192232',
  },
  sectionCountText: {
    fontSize: 12,
    color: '#6C788A',
  },

  // PEOPLE LIST PANEL
  peoplePanelCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E9EDF3',
    marginBottom: 16,
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: '#E9EDF3',
  },
  personInitialsBox: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#EDF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  personInitialsText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#315DE5',
  },
  personBody: {
    flex: 1,
    marginLeft: 12,
  },
  personNameText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#192232',
  },
  personCodeText: {
    fontSize: 11,
    color: '#6C788A',
    marginTop: 1,
  },
  personStateText: {
    fontSize: 11,
    color: '#6C788A',
    marginTop: 2,
  },
  personStateTextSent: {
    color: '#137D60',
    fontWeight: '600',
  },
  personActionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  personActionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#315DE5',
  },

  // WRITE OWN REPORT BTN
  writeOwnReportBtn: {
    backgroundColor: '#192232',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  writeOwnReportBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  // DETAIL VIEW HEADER CARD
  detailHeaderCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E9EDF3',
    marginBottom: 12,
  },
  backLinkBtn: {
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  backLinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#315DE5',
  },
  detailTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailNameText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#192232',
    letterSpacing: -0.6,
  },
  detailRoleDateText: {
    fontSize: 13,
    color: '#6C788A',
    marginTop: 4,
  },
  calloutSummaryBox: {
    backgroundColor: '#EDF2FF',
    padding: 12,
    borderRadius: 12,
    marginTop: 14,
    gap: 4,
  },
  calloutSummaryText: {
    fontSize: 13,
    color: '#192232',
    lineHeight: 18,
  },
  goldStarRating: {
    color: '#9F650B',
    fontWeight: '700',
  },
  adminReviewBannerCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 14,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  adminReviewBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  adminReviewBannerTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
    letterSpacing: 0.5,
  },
  adminReviewBannerStars: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F59E0B',
    marginLeft: 'auto',
  },
  adminReviewBannerComment: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  adminReviewBannerCommentText: {
    fontSize: 12,
    color: '#1E293B',
    fontStyle: 'italic',
    lineHeight: 16,
  },
  adminReviewBannerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#FEF3C7',
  },
  adminReviewBannerMetaText: {
    fontSize: 10,
    color: '#78716C',
  },

  // DETAIL TABS
  detailTabsBar: {
    flexDirection: 'row',
    gap: 4,
    backgroundColor: '#E9EDF3',
    padding: 4,
    borderRadius: 12,
    marginBottom: 14,
  },
  detailTabBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 9,
    borderRadius: 10,
  },
  detailTabBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  detailTabBtnText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6C788A',
  },
  detailTabBtnTextActive: {
    color: '#192232',
    fontWeight: '700',
  },

  // TAB CONTENT PANELS
  tabContentContainer: {
    gap: 12,
  },
  panelCard: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E9EDF3',
  },
  panelHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  panelCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#192232',
  },
  panelCardSubtitle: {
    fontSize: 12,
    color: '#6C788A',
    marginTop: 4,
    marginBottom: 8,
  },
  panelHeaderCountText: {
    fontSize: 12,
    color: '#6C788A',
  },
  emptyPromptText: {
    fontSize: 13,
    color: '#94A3B8',
    fontStyle: 'italic',
    marginVertical: 4,
  },

  // METRICS
  metricItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#E9EDF3',
  },
  metricItemName: {
    fontSize: 13,
    color: '#192232',
    fontWeight: '500',
  },
  metricItemNote: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  metricItemValue: {
    fontSize: 13,
    color: '#6C788A',
    textAlign: 'right',
  },

  // SIMPLE LIST ITEM
  simpleListItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#E9EDF3',
  },
  simpleListItemText: {
    fontSize: 13,
    color: '#192232',
    lineHeight: 19,
  },
  simpleListItemSub: {
    fontSize: 12,
    color: '#6C788A',
    marginTop: 3,
  },
  expandCollapseBtn: {
    paddingVertical: 10,
    alignItems: 'flex-start',
  },
  expandCollapseBtnText: {
    fontSize: 13,
    color: '#315DE5',
    fontWeight: '600',
  },

  // CALLOUTS
  calloutAmberBox: {
    backgroundColor: '#FFF5DF',
    padding: 12,
    borderRadius: 12,
    marginTop: 6,
  },
  calloutAmberBoxText: {
    fontSize: 13,
    color: '#9F650B',
    lineHeight: 18,
  },

  // PLAN CONVERT ITEM
  planCheckItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#E9EDF3',
  },
  planCheckItemText: {
    flex: 1,
    fontSize: 13,
    color: '#192232',
    lineHeight: 19,
  },
  planCheckItemTextActive: {
    fontWeight: '600',
    color: '#315DE5',
  },
  convertTaskBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#315DE5',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 14,
  },
  convertTaskBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  // EVALUATION & ATTACHMENTS
  selfRatingBetweenRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#E9EDF3',
    marginBottom: 6,
  },
  selfReviewDetailText: {
    fontSize: 13,
    color: '#6C788A',
    lineHeight: 18,
    marginTop: 4,
  },
  attachmentItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F6F7FB',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E9EDF3',
  },
  attachmentThumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
  },
  attachmentDocBadge: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachmentItemName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#192232',
  },
  attachmentItemSub: {
    fontSize: 11,
    color: '#6C788A',
    marginTop: 2,
  },

  // BADGE PILLS
  badgePill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 7,
  },
  badgePillDone: {
    backgroundColor: '#EDF2FF',
  },
  badgePillDoneText: {
    color: '#137D60',
    fontSize: 11,
    fontWeight: '600',
  },
  badgePillText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // EMPTY & LOADING
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 10,
  },
  loadingPromptText: {
    fontSize: 13,
    color: '#6C788A',
  },
  emptyPanel: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E9EDF3',
    marginVertical: 10,
  },
  emptyPanelTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#192232',
  },
  emptyPanelSub: {
    fontSize: 12,
    color: '#6C788A',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 12,
  },
  restoreDateBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#EDF2FF',
  },
  restoreDateBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#315DE5',
  },

  // FULLSCREEN IMAGE PREVIEW
  fullscreenModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'space-between',
  },
  fullscreenModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
  },
  fullscreenModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
    marginRight: 16,
  },
  fullscreenModalCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullscreenImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  fullscreenImage: {
    width: '100%',
    height: '100%',
  },
});
