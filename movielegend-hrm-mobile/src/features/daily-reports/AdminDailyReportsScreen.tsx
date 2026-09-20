import React, { useState, useMemo, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
  TextInput,
  Alert,
  Modal,
  Image,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '../../components/Screen';
import { ScreenContainer } from '../../components/ScreenContainer';
import {
  useAdminReports,
  useReviewDailyReport,
} from '../../hooks/useDailyReports';
import { useDepartments } from '../../hooks/useDepartments';
import { useAuth } from '../../providers/AuthProvider';
import { PdfViewerModal } from '../../components/PdfViewerModal';
import type {
  DailyReport,
  DailyReportMetricItem,
  DailyReportTaskItem,
  DailyReportAttachmentItem,
} from '../../api/daily-reports.api';

const ASSESSMENT_LABELS = [
  'Chưa hoàn thành',
  'Hoàn thành một phần',
  'Gần đạt kế hoạch',
  'Đạt kế hoạch',
  'Vượt kế hoạch',
];

export function AdminDailyReportsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  // Date selection (default today YYYY-MM-DD)
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr || '');
  const [selectedDeptId, setSelectedDeptId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all'); // all | pending | reviewed | draft
  const [isDeptModalVisible, setIsDeptModalVisible] = useState<boolean>(false);

  // Active report for Detail View (if non-null, shows Detail View; if null, shows List View)
  const [activeReport, setActiveReport] = useState<DailyReport | null>(null);

  // Detail View Tab: 'results' | 'plans' | 'evaluation'
  const [detailTab, setDetailTab] = useState<'results' | 'plans' | 'evaluation'>('results');
  const [expandedCompleted, setExpandedCompleted] = useState<boolean>(false);

  // Manager evaluation state in Detail View
  // Flow: 'form' -> 'confirm' -> 'saved'
  const [managerScore, setManagerScore] = useState<number>(0);
  const [managerNote, setManagerNote] = useState<string>('');
  const [evalPhase, setEvalPhase] = useState<'form' | 'confirm' | 'saved'>('form');

  // Preview modals state
  const [previewImageUri, setPreviewImageUri] = useState<string | null>(null);
  const [previewImageTitle, setPreviewImageTitle] = useState<string>('Xem ảnh đính kèm');
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [pdfPreviewTitle, setPdfPreviewTitle] = useState<string>('Xem tài liệu');

  // Departments for filtering
  const departmentsQuery = useDepartments();
  const departmentsList = useMemo(() => departmentsQuery.data?.items ?? [], [departmentsQuery.data]);

  // Find selected department name
  const selectedDeptName = useMemo(() => {
    if (selectedDeptId === 'all') return 'Tất cả phòng ban';
    const found = departmentsList.find((d: any) => d.id === selectedDeptId);
    return found ? found.name : 'Tất cả phòng ban';
  }, [selectedDeptId, departmentsList]);

  // Query reports
  const apiStatus = useMemo(() => {
    if (statusFilter === 'pending') return 'SUBMITTED';
    if (statusFilter === 'reviewed') return 'REVIEWED';
    if (statusFilter === 'draft') return 'DRAFT';
    return undefined;
  }, [statusFilter]);

  const reportsQuery = useAdminReports({
    date: selectedDate,
    departmentId: selectedDeptId === 'all' ? undefined : selectedDeptId,
    status: apiStatus,
  });

  const reports = reportsQuery.data?.items ?? [];

  // Summary statistics for 2x2 filter
  const stats = useMemo(() => {
    let total = reports.length;
    let pending = 0;
    let reviewed = 0;
    let draft = 0;

    reports.forEach((r) => {
      if (r.status === 'SUBMITTED') pending++;
      else if (r.status === 'REVIEWED') reviewed++;
      else if (r.status === 'DRAFT') draft++;
    });

    return { total, pending, reviewed, draft };
  }, [reports]);

  // Review mutation
  const reviewMutation = useReviewDailyReport(activeReport?.id || '');

  // Reset review form when activeReport changes
  useEffect(() => {
    if (activeReport) {
      const score = activeReport.adminRating || 0;
      setManagerScore(score);
      setManagerNote(activeReport.adminReview || '');
      setEvalPhase(activeReport.status === 'REVIEWED' ? 'saved' : 'form');
      setDetailTab('results');
      setExpandedCompleted(false);
    }
  }, [activeReport]);

  // Date navigation handlers
  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    const nextStr = d.toISOString().split('T')[0];
    if (nextStr) setSelectedDate(nextStr);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    const nextStr = d.toISOString().split('T')[0];
    if (nextStr) setSelectedDate(nextStr);
  };

  const handleResetFilters = () => {
    if (todayStr) setSelectedDate(todayStr);
    setSelectedDeptId('all');
    setStatusFilter('all');
  };

  const handleSaveAndLockEvaluation = async () => {
    if (!activeReport || !activeReport.id) return;
    if (managerScore < 1 || managerScore > 5) {
      Alert.alert('Thông báo', 'Vui lòng chọn số sao đánh giá từ 1 đến 5');
      return;
    }

    try {
      await reviewMutation.mutateAsync({
        adminRating: managerScore,
        adminReview: managerNote.trim() || undefined,
      });

      // Update active report in state
      const nowIso = new Date().toISOString();
      setActiveReport((prev) =>
        prev
          ? {
              ...prev,
              adminRating: managerScore,
              adminReview: managerNote.trim() || null,
              status: 'REVIEWED',
              reviewedById: user?.id || null,
              reviewedAt: nowIso,
            }
          : null
      );

      setEvalPhase('saved');
      void reportsQuery.refetch();

      Alert.alert('Thành công', 'Đã lưu & khóa đánh giá báo cáo thành công!');
    } catch (err: any) {
      console.error('Submit review error:', err);
      Alert.alert('Lỗi', err?.response?.data?.message || err?.message || 'Không thể lưu đánh giá báo cáo');
    }
  };

  // -------------------------------------------------------------
  // RENDER DETAIL VIEW
  // -------------------------------------------------------------
  if (activeReport) {
    const memberName = activeReport.user?.profile?.fullName || activeReport.user?.userCode || 'Nhân sự';
    const deptName = activeReport.department?.name || 'Phòng ban';
    const roleName = activeReport.roleType === 'LEADER' ? 'Quản lý' : 'Nhân viên';
    const isReviewed = activeReport.status === 'REVIEWED';
    const isSubmitted = activeReport.status === 'SUBMITTED';

    const completedCount = activeReport.completedTasks?.length || 0;
    const inProgressCount = activeReport.inProgressTasks?.length || 0;
    const planCount = activeReport.tomorrowPlan?.length || 0;

    const visibleCompleted = expandedCompleted
      ? activeReport.completedTasks || []
      : (activeReport.completedTasks || []).slice(0, 3);
    const hiddenCompletedCount = Math.max(0, completedCount - 3);

    return (
      <Screen backgroundColor="#F6F7FB">
        <ScreenContainer style={{ paddingTop: 0, paddingBottom: Math.max(insets.bottom + 16, 24) }}>
          {/* DETAIL HEADER */}
          <View style={styles.detailHeaderCard}>
            <Pressable style={styles.backLinkBtn} onPress={() => setActiveReport(null)}>
              <Text style={styles.backLinkText}>← Danh sách báo cáo</Text>
            </Pressable>

            <View style={styles.detailTitleRow}>
              <Text style={styles.detailNameText}>{memberName}</Text>
              <View
                style={[
                  styles.badgePill,
                  isReviewed ? styles.badgePillDone : isSubmitted ? styles.badgePillPending : styles.badgePillDraft,
                ]}
              >
                <Text
                  style={[
                    styles.badgePillText,
                    isReviewed ? styles.badgePillDoneText : isSubmitted ? styles.badgePillPendingText : styles.badgePillDraftText,
                  ]}
                >
                  {isReviewed ? 'Đã đánh giá' : isSubmitted ? 'Chờ duyệt' : 'Bản nháp'}
                </Text>
              </View>
            </View>

            <Text style={styles.detailRoleDateText}>
              {deptName} · {roleName} ·{' '}
              {new Date(activeReport.reportDate).toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              })}
            </Text>

            <Text style={styles.detailSubmitTimeText}>
              {isSubmitted
                ? 'Đã nộp · Chờ quản lý đánh giá'
                : isReviewed
                ? `Đã nộp · Đã đánh giá lúc ${new Date(activeReport.reviewedAt || Date.now()).toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}`
                : 'Bản nháp'}
            </Text>

            {/* 3 Summary KPI Boxes */}
            <View style={styles.summaryKPIContainer}>
              <View style={styles.summaryKPICell}>
                <Text style={styles.summaryKPIValue}>{completedCount}</Text>
                <Text style={styles.summaryKPILabel}>Hoàn thành</Text>
              </View>
              <View style={styles.summaryKPICell}>
                <Text style={styles.summaryKPIValue}>{inProgressCount}</Text>
                <Text style={styles.summaryKPILabel}>Đang thực hiện</Text>
              </View>
              <View style={styles.summaryKPICell}>
                <Text style={styles.summaryKPIValue}>{planCount}</Text>
                <Text style={styles.summaryKPILabel}>Kế hoạch ngày mai</Text>
              </View>
            </View>
          </View>

          {/* 3 TABS: Kết quả | Kế hoạch | Đánh giá */}
          <View style={styles.tabsBar}>
            <Pressable
              style={[styles.tabButton, detailTab === 'results' && styles.tabButtonActive]}
              onPress={() => setDetailTab('results')}
            >
              <Text style={[styles.tabButtonText, detailTab === 'results' && styles.tabButtonTextActive]}>
                Kết quả
              </Text>
            </Pressable>

            <Pressable
              style={[styles.tabButton, detailTab === 'plans' && styles.tabButtonActive]}
              onPress={() => setDetailTab('plans')}
            >
              <Text style={[styles.tabButtonText, detailTab === 'plans' && styles.tabButtonTextActive]}>
                Kế hoạch
              </Text>
            </Pressable>

            <Pressable
              style={[styles.tabButton, detailTab === 'evaluation' && styles.tabButtonActive]}
              onPress={() => setDetailTab('evaluation')}
            >
              <Text style={[styles.tabButtonText, detailTab === 'evaluation' && styles.tabButtonTextActive]}>
                Đánh giá
              </Text>
            </Pressable>
          </View>

          {/* TAB 1: KẾT QUẢ */}
          {detailTab === 'results' && (
            <View style={styles.tabContentContainer}>
              {/* Quantitative Results */}
              <View style={styles.panelCard}>
                <Text style={styles.panelCardTitle}>Kết quả công việc định lượng</Text>
                <Text style={styles.panelCardSubtitle}>
                  {activeReport.metrics && activeReport.metrics.length > 0
                    ? `${activeReport.metrics.length} chỉ tiêu · Đã nhập số liệu`
                    : '4 chỉ tiêu · Chưa có số liệu'}
                </Text>

                {(!activeReport.metrics || activeReport.metrics.length === 0) ? (
                  <Text style={styles.emptyPromptText}>Chưa có số liệu định lượng</Text>
                ) : (
                  activeReport.metrics.map((m, idx) => (
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
                  <Text style={styles.panelHeaderCountText}>{completedCount} việc</Text>
                </View>

                {completedCount === 0 ? (
                  <Text style={styles.emptyPromptText}>Chưa có công việc hoàn thành</Text>
                ) : (
                  <>
                    {visibleCompleted.map((t, idx) => (
                      <View key={idx} style={styles.simpleListItem}>
                        <Text style={styles.simpleListItemText}>{t.title}</Text>
                        {!!t.note && <Text style={styles.simpleListItemSub}>{t.note}</Text>}
                      </View>
                    ))}

                    {completedCount > 3 && (
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
                  <Text style={styles.panelHeaderCountText}>{inProgressCount} việc</Text>
                </View>

                {inProgressCount === 0 ? (
                  <Text style={styles.emptyPromptText}>Không có công việc đang thực hiện</Text>
                ) : (
                  activeReport.inProgressTasks.map((t, idx) => (
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
                <Text style={styles.panelCardTitle}>Khó khăn & đề xuất hỗ trợ</Text>
                {activeReport.obstacles && activeReport.obstacles.trim().length > 0 ? (
                  <View style={styles.calloutAmberBox}>
                    <Text style={styles.calloutAmberBoxText}>{activeReport.obstacles}</Text>
                  </View>
                ) : (
                  <View style={styles.calloutSoftBox}>
                    <Text style={styles.calloutSoftBoxText}>
                      Nhân viên báo cáo không có khó khăn hay trở ngại.
                    </Text>
                  </View>
                )}
              </View>

              {/* Tomorrow Plans */}
              <View style={styles.panelCard}>
                <Text style={styles.panelCardTitle}>Kế hoạch ngày mai</Text>
                {planCount === 0 ? (
                  <View style={{ marginTop: 6 }}>
                    <Text style={styles.emptyPlanText}>Chưa có kế hoạch được đề xuất.</Text>
                    <Text style={styles.emptyPlanSub}>Bạn có thể góp ý bổ sung trong phần đánh giá.</Text>
                  </View>
                ) : (
                  <View style={{ marginTop: 6 }}>
                    {activeReport.tomorrowPlan.map((p, idx) => (
                      <View key={idx} style={styles.simpleListItem}>
                        <Text style={styles.simpleListItemText}>
                          {idx + 1}. {p}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* Attachments & Files */}
              <View style={styles.panelCard}>
                <Text style={styles.panelCardTitle}>Tệp đính kèm & Hình ảnh</Text>
                {(!activeReport.attachments || activeReport.attachments.length === 0) ? (
                  <Text style={styles.emptyPromptText}>Không có tệp hay hình ảnh đính kèm</Text>
                ) : (
                  <View style={{ marginTop: 8, gap: 10 }}>
                    {activeReport.attachments.map((file, idx) => {
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
                          <MaterialCommunityIcons name="eye-outline" size={20} color="#345FDF" />
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </View>
            </View>
          )}

          {/* TAB 3: ĐÁNH GIÁ */}
          {detailTab === 'evaluation' && (
            <View style={styles.tabContentContainer}>
              {/* Section: Employee Self Assessment */}
              <View style={styles.panelCard}>
                <Text style={styles.panelCardTitle}>Tự đánh giá của nhân viên</Text>
                <View style={styles.selfRatingBetweenRow}>
                  <Text style={styles.selfRatingTitle}>Mức độ hoàn thành</Text>
                  <Text style={styles.goldStarRating}>
                    ★ {activeReport.selfRating || 5}/5
                  </Text>
                </View>

                <Text style={styles.selfReviewDetailText}>
                  Nhận xét: {activeReport.selfReview?.trim() || 'Chưa có'}
                </Text>
                <Text style={styles.selfReviewDetailText}>
                  Tệp đính kèm: {activeReport.attachments?.length ? `${activeReport.attachments.length} tệp đính kèm` : 'Chưa có'}
                </Text>
              </View>

              {/* Phase 1: Edit Evaluation */}
              {evalPhase === 'form' && (
                <View style={styles.panelCard}>
                  <Text style={styles.panelCardTitle}>Đánh giá của quản lý</Text>
                  <Text style={styles.panelCardSubtitle}>Chấm điểm dựa trên kết quả báo cáo.</Text>

                  {/* 5 Stars */}
                  <View style={styles.interactiveStarsRow}>
                    {[1, 2, 3, 4, 5].map((s) => {
                      const isFilled = s <= managerScore;
                      return (
                        <Pressable
                          key={s}
                          style={[styles.interactiveStarBtn, isFilled && styles.interactiveStarBtnFilled]}
                          onPress={() => setManagerScore(s)}
                        >
                          <MaterialCommunityIcons
                            name={isFilled ? 'star' : 'star-outline'}
                            size={32}
                            color={isFilled ? '#EF8E0B' : '#ABB7C9'}
                          />
                        </Pressable>
                      );
                    })}
                  </View>

                  <Text style={styles.scoreLevelDescriptionText}>
                    {managerScore > 0
                      ? `${managerScore}/5 sao · ${ASSESSMENT_LABELS[managerScore - 1]}`
                      : 'Chọn số sao để đánh giá'}
                  </Text>

                  <Text style={styles.inputLabelHeader}>Nhận xét / Góp ý</Text>
                  <TextInput
                    style={styles.managerNoteInput}
                    multiline
                    numberOfLines={4}
                    placeholder="Kết quả nổi bật, điểm cần cải thiện hoặc chỉ đạo tiếp theo…"
                    placeholderTextColor="#94A3B8"
                    value={managerNote}
                    onChangeText={setManagerNote}
                  />

                  <Pressable
                    style={[styles.primaryActionBtn, managerScore === 0 && { opacity: 0.4 }]}
                    disabled={managerScore === 0}
                    onPress={() => setEvalPhase('confirm')}
                  >
                    <Text style={styles.primaryActionBtnText}>Xem lại đánh giá →</Text>
                  </Pressable>
                </View>
              )}

              {/* Phase 2: Confirm Evaluation */}
              {evalPhase === 'confirm' && (
                <View style={styles.panelCard}>
                  <Text style={styles.panelCardTitle}>Xác nhận đánh giá</Text>
                  
                  <View style={styles.confirmScoreBox}>
                    <Text style={styles.goldStarRating}>
                      ★ {managerScore}/5 · {ASSESSMENT_LABELS[managerScore - 1]}
                    </Text>
                  </View>

                  <Text style={styles.confirmNoteText}>
                    {managerNote.trim() || 'Không có nhận xét bổ sung.'}
                  </Text>

                  <Text style={styles.confirmNoteSubWarning}>
                    Sau khi lưu, đánh giá sẽ được ghi nhận và khóa chỉnh sửa trong hệ thống.
                  </Text>

                  <Pressable
                    style={[styles.primaryActionBtn, { marginTop: 14 }]}
                    onPress={handleSaveAndLockEvaluation}
                    disabled={reviewMutation.isPending}
                  >
                    {reviewMutation.isPending ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Text style={styles.primaryActionBtnText}>Lưu & khóa đánh giá</Text>
                    )}
                  </Pressable>

                  <Pressable
                    style={styles.secondaryLinkBtn}
                    onPress={() => setEvalPhase('form')}
                  >
                    <Text style={styles.secondaryLinkBtnText}>Quay lại chỉnh sửa</Text>
                  </Pressable>
                </View>
              )}

              {/* Phase 3: Saved & Locked Evaluation */}
              {evalPhase === 'saved' && (
                <View style={styles.panelCard}>
                  <View style={styles.panelHeaderRow}>
                    <Text style={styles.panelCardTitle}>Đã đánh giá & khóa</Text>
                    <View style={[styles.badgePill, styles.badgePillDone]}>
                      <Text style={[styles.badgePillText, styles.badgePillDoneText]}>Đã hoàn tất</Text>
                    </View>
                  </View>

                  <View style={styles.confirmScoreBox}>
                    <Text style={styles.goldStarRating}>
                      ★ {activeReport.adminRating || managerScore}/5 · {ASSESSMENT_LABELS[(activeReport.adminRating || managerScore) - 1]}
                    </Text>
                  </View>

                  <Text style={styles.savedManagerNoteText}>
                    {activeReport.adminReview || managerNote || 'Đạt yêu cầu.'}
                  </Text>

                  <Text style={styles.savedManagerMetaText}>
                    Người đánh giá: {activeReport.reviewedBy?.profile?.fullName || activeReport.reviewedBy?.userCode || 'Quản lý'}
                  </Text>

                  {activeReport.reviewedAt && (
                    <Text style={styles.savedManagerMetaText}>
                      Lưu lúc {new Date(activeReport.reviewedAt).toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })} - {new Date(activeReport.reviewedAt).toLocaleDateString('vi-VN')}
                    </Text>
                  )}

                  <Pressable
                    style={styles.reEditLinkBtn}
                    onPress={() => setEvalPhase('form')}
                  >
                    <MaterialCommunityIcons name="pencil-outline" size={16} color="#345FDF" />
                    <Text style={styles.reEditLinkBtnText}>Chỉnh sửa lại đánh giá</Text>
                  </Pressable>
                </View>
              )}
            </View>
          )}

          {/* FOOTER STEP NAVIGATION */}
          <View style={styles.footerStepContainer}>
            <Pressable
              style={styles.footerPrimaryBtn}
              onPress={() => {
                if (detailTab === 'results') setDetailTab('plans');
                else if (detailTab === 'plans') setDetailTab('evaluation');
                else setActiveReport(null);
              }}
            >
              <Text style={styles.footerPrimaryBtnText}>
                {detailTab === 'results'
                  ? 'Tiếp tục: Kế hoạch →'
                  : detailTab === 'plans'
                  ? 'Tiếp tục: Đánh giá →'
                  : 'Về danh sách báo cáo'}
              </Text>
            </Pressable>
          </View>
        </ScreenContainer>

        {/* Modal: Fullscreen Image Preview */}
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

        {/* Modal: PDF Viewer */}
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
  // RENDER LIST VIEW
  // -------------------------------------------------------------
  return (
    <Screen backgroundColor="#F6F7FB">
      <ScreenContainer style={{ paddingTop: 0, paddingBottom: Math.max(insets.bottom + 16, 24) }}>
        {/* Main Header */}
        <View style={styles.listHeaderContainer}>
          <View style={styles.headerTopRow}>
            <Text style={styles.headerEyebrow}>WORKSPACE / QUẢN LÝ</Text>
            <Text style={styles.headerSubBadge}>Quản trị</Text>
          </View>
          <Text style={styles.headerMainTitle}>Báo cáo cuối ngày</Text>
          <Text style={styles.headerMainSubtitle}>Theo dõi kết quả. Phản hồi kịp thời.</Text>
        </View>

        {/* Date Selector Bar */}
        <View style={styles.dateBarContainer}>
          <Pressable style={styles.dateBarNavBtn} onPress={handlePrevDay}>
            <MaterialCommunityIcons name="chevron-left" size={22} color="#192232" />
          </Pressable>

          <View style={styles.dateBarCenter}>
            <Text style={styles.dateBarCenterText}>
              {new Date(selectedDate).toLocaleDateString('vi-VN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
              })}
            </Text>
            {selectedDate !== todayStr && (
              <Pressable style={styles.dateBarTodayBadge} onPress={() => todayStr && setSelectedDate(todayStr)}>
                <Text style={styles.dateBarTodayBadgeText}>Hôm nay</Text>
              </Pressable>
            )}
          </View>

          <Pressable style={styles.dateBarNavBtn} onPress={handleNextDay}>
            <MaterialCommunityIcons name="chevron-right" size={22} color="#192232" />
          </Pressable>
        </View>

        {/* Department Select Dropdown Card (Matches <label>Phòng ban<select>) */}
        <View style={styles.deptDropdownContainer}>
          <Text style={styles.deptDropdownLabel}>Phòng ban</Text>
          <Pressable
            style={styles.deptSelectCard}
            onPress={() => setIsDeptModalVisible(true)}
          >
            <Text style={styles.deptSelectCardText} numberOfLines={1}>
              {selectedDeptName}
            </Text>
            <MaterialCommunityIcons name="chevron-down" size={20} color="#707C8D" />
          </Pressable>
        </View>

        {/* 2x2 Status Filters Grid (Matches .filters) */}
        <View style={styles.statusFiltersGrid}>
          <Pressable
            style={[styles.filterBtn, statusFilter === 'all' && styles.filterBtnActive]}
            onPress={() => setStatusFilter('all')}
          >
            <Text style={[styles.filterBtnLabel, statusFilter === 'all' && styles.filterBtnLabelActive]}>
              Tất cả
            </Text>
            <Text style={[styles.filterBtnCount, statusFilter === 'all' && styles.filterBtnCountActive]}>
              {stats.total}
            </Text>
          </Pressable>

          <Pressable
            style={[styles.filterBtn, statusFilter === 'pending' && styles.filterBtnActive]}
            onPress={() => setStatusFilter('pending')}
          >
            <Text style={[styles.filterBtnLabel, statusFilter === 'pending' && styles.filterBtnLabelActive]}>
              Chờ duyệt
            </Text>
            <Text style={[styles.filterBtnCount, statusFilter === 'pending' && styles.filterBtnCountActive]}>
              {stats.pending}
            </Text>
          </Pressable>

          <Pressable
            style={[styles.filterBtn, statusFilter === 'reviewed' && styles.filterBtnActive]}
            onPress={() => setStatusFilter('reviewed')}
          >
            <Text style={[styles.filterBtnLabel, statusFilter === 'reviewed' && styles.filterBtnLabelActive]}>
              Đã đánh giá
            </Text>
            <Text style={[styles.filterBtnCount, statusFilter === 'reviewed' && styles.filterBtnCountActive]}>
              {stats.reviewed}
            </Text>
          </Pressable>

          <Pressable
            style={[styles.filterBtn, statusFilter === 'draft' && styles.filterBtnActive]}
            onPress={() => setStatusFilter('draft')}
          >
            <Text style={[styles.filterBtnLabel, statusFilter === 'draft' && styles.filterBtnLabelActive]}>
              Bản nháp
            </Text>
            <Text style={[styles.filterBtnCount, statusFilter === 'draft' && styles.filterBtnCountActive]}>
              {stats.draft}
            </Text>
          </Pressable>
        </View>

        {/* Reports List Header Title */}
        <View style={styles.listHeaderRow}>
          <Text style={styles.listHeaderTitleText}>Danh sách báo cáo</Text>
          <Text style={styles.listHeaderCountText}>{reports.length} báo cáo</Text>
        </View>

        {/* Report Cards List */}
        {reportsQuery.isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#345FDF" />
            <Text style={styles.loadingPromptText}>Đang tải danh sách báo cáo...</Text>
          </View>
        ) : reports.length === 0 ? (
          <View style={styles.emptyCard}>
            <MaterialCommunityIcons name="file-document-outline" size={44} color="#CBD5E1" />
            <Text style={styles.emptyCardTitle}>Không có báo cáo phù hợp</Text>
            <Text style={styles.emptyCardSub}>
              Thử chọn ngày, phòng ban hoặc trạng thái khác.
            </Text>
            <Pressable style={styles.resetFilterBtn} onPress={handleResetFilters}>
              <Text style={styles.resetFilterBtnText}>Đặt lại bộ lọc</Text>
            </Pressable>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {reports.map((report) => {
              const isReviewed = report.status === 'REVIEWED';
              const isSubmitted = report.status === 'SUBMITTED';
              const memberName = report.user?.profile?.fullName || report.user?.userCode || 'Nhân sự';
              const deptName = report.department?.name || 'Phòng ban';

              // Avatar Initials (e.g. Đoàn Nam Dương -> ND)
              const initials = memberName
                .split(' ')
                .filter(Boolean)
                .slice(-2)
                .map((n) => (n && n[0] ? n[0].toUpperCase() : ''))
                .join('');

              const completedTasksCount = report.completedTasks?.length || 0;
              const inProgressTasksCount = report.inProgressTasks?.length || 0;
              const plansCount = report.tomorrowPlan?.length || 0;

              return (
                <Pressable
                  key={report.id || Math.random().toString()}
                  style={styles.reportItemCard}
                  onPress={() => setActiveReport(report)}
                >
                  {/* Card Header Row */}
                  <View style={styles.cardHeaderFlex}>
                    <View style={styles.cardUserFlex}>
                      <View style={styles.cardAvatarCircle}>
                        <Text style={styles.cardAvatarText}>{initials || 'NV'}</Text>
                      </View>
                      <View style={{ marginLeft: 10 }}>
                        <Text style={styles.cardUserName}>{memberName}</Text>
                        <Text style={styles.cardDeptDateText}>
                          {deptName} · {new Date(report.reportDate).toLocaleDateString('vi-VN')}
                        </Text>
                      </View>
                    </View>

                    <View
                      style={[
                        styles.badgePill,
                        isReviewed ? styles.badgePillDone : isSubmitted ? styles.badgePillPending : styles.badgePillDraft,
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgePillText,
                          isReviewed ? styles.badgePillDoneText : isSubmitted ? styles.badgePillPendingText : styles.badgePillDraftText,
                        ]}
                      >
                        {isReviewed ? 'Đã đánh giá' : isSubmitted ? 'Chờ duyệt' : 'Bản nháp'}
                      </Text>
                    </View>
                  </View>

                  {/* Rating Comparison Row */}
                  <View style={styles.cardRatingsFlex}>
                    <Text style={styles.cardSelfRatingText}>
                      Tự đánh giá <Text style={styles.goldStarRating}>★ {report.selfRating || 5}/5</Text>
                    </Text>
                    <Text style={styles.cardManagerRatingText}>
                      {report.adminRating ? (
                        <Text style={{ color: '#117D60', fontWeight: '600' }}>
                          Quản lý: ★ {report.adminRating}/5
                        </Text>
                      ) : (
                        'Quản lý: Chưa đánh giá'
                      )}
                    </Text>
                  </View>

                  {/* Counts Row */}
                  <View style={styles.cardCountsFlex}>
                    <Text style={styles.cardCountSpan}>
                      <Text style={styles.cardCountBold}>{completedTasksCount}</Text> hoàn thành
                    </Text>
                    <Text style={styles.cardCountSpan}>
                      <Text style={styles.cardCountBold}>{inProgressTasksCount}</Text> đang làm
                    </Text>
                    <Text style={styles.cardCountSpan}>
                      <Text style={styles.cardCountBold}>{plansCount}</Text> kế hoạch
                    </Text>
                  </View>

                  {/* Link text */}
                  <Text style={styles.cardViewDetailLink}>Xem chi tiết →</Text>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* MODAL: DEPARTMENT SELECTOR */}
        <Modal
          visible={isDeptModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setIsDeptModalVisible(false)}
        >
          <Pressable
            style={styles.deptModalOverlay}
            onPress={() => setIsDeptModalVisible(false)}
          >
            <View style={styles.deptModalCard}>
              <View style={styles.deptModalHeader}>
                <Text style={styles.deptModalTitle}>Chọn phòng ban</Text>
                <Pressable onPress={() => setIsDeptModalVisible(false)}>
                  <MaterialCommunityIcons name="close" size={22} color="#707C8D" />
                </Pressable>
              </View>

              <ScrollView style={{ maxHeight: 360 }}>
                {/* Option: All */}
                <Pressable
                  style={[styles.deptOptionRow, selectedDeptId === 'all' && styles.deptOptionRowActive]}
                  onPress={() => {
                    setSelectedDeptId('all');
                    setIsDeptModalVisible(false);
                  }}
                >
                  <Text style={[styles.deptOptionText, selectedDeptId === 'all' && styles.deptOptionTextActive]}>
                    Tất cả phòng ban
                  </Text>
                  {selectedDeptId === 'all' && (
                    <MaterialCommunityIcons name="check" size={20} color="#345FDF" />
                  )}
                </Pressable>

                {/* Option: List of Departments */}
                {departmentsList.map((dept: any) => {
                  const isSelected = selectedDeptId === dept.id;
                  return (
                    <Pressable
                      key={dept.id}
                      style={[styles.deptOptionRow, isSelected && styles.deptOptionRowActive]}
                      onPress={() => {
                        setSelectedDeptId(dept.id);
                        setIsDeptModalVisible(false);
                      }}
                    >
                      <Text style={[styles.deptOptionText, isSelected && styles.deptOptionTextActive]}>
                        {dept.name}
                      </Text>
                      {isSelected && (
                        <MaterialCommunityIcons name="check" size={20} color="#345FDF" />
                      )}
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          </Pressable>
        </Modal>
      </ScreenContainer>
    </Screen>
  );
}

// -------------------------------------------------------------
// STYLES
// -------------------------------------------------------------
const styles = StyleSheet.create({
  // LIST HEADER
  listHeaderContainer: {
    paddingHorizontal: 4,
    paddingTop: 4,
    paddingBottom: 12,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  headerEyebrow: {
    fontSize: 11,
    letterSpacing: 1.4,
    color: '#707C8D',
    fontWeight: '600',
  },
  headerSubBadge: {
    fontSize: 12,
    color: '#707C8D',
  },
  headerMainTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#192232',
    letterSpacing: -0.8,
    marginTop: 4,
  },
  headerMainSubtitle: {
    fontSize: 13,
    color: '#707C8D',
    marginTop: 4,
  },

  // DATEBAR
  dateBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 6,
    borderRadius: 15,
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
    color: '#345FDF',
  },

  // DEPARTMENT DROPDOWN CARD
  deptDropdownContainer: {
    marginBottom: 14,
  },
  deptDropdownLabel: {
    fontSize: 12,
    color: '#707C8D',
    marginBottom: 6,
    paddingHorizontal: 2,
  },
  deptSelectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E9EDF3',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  deptSelectCardText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#192232',
    flex: 1,
    marginRight: 8,
  },

  // STATUS FILTERS 2X2 GRID
  statusFiltersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginBottom: 20,
  },
  filterBtn: {
    width: '48.8%',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterBtnActive: {
    backgroundColor: '#192232',
  },
  filterBtnLabel: {
    fontSize: 12,
    color: '#707C8D',
    fontWeight: '500',
  },
  filterBtnLabelActive: {
    color: '#FFFFFF',
  },
  filterBtnCount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#192232',
    marginTop: 3,
  },
  filterBtnCountActive: {
    color: '#FFFFFF',
  },

  // LIST HEADER ROW
  listHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  listHeaderTitleText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#192232',
  },
  listHeaderCountText: {
    fontSize: 12,
    color: '#707C8D',
  },

  // REPORT ITEM CARD
  reportItemCard: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E9EDF3',
  },
  cardHeaderFlex: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardUserFlex: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardAvatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#EDF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardAvatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#345FDF',
  },
  cardUserName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#192232',
  },
  cardDeptDateText: {
    fontSize: 12,
    color: '#707C8D',
    marginTop: 2,
  },
  cardRatingsFlex: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  cardSelfRatingText: {
    fontSize: 12,
    color: '#707C8D',
  },
  cardManagerRatingText: {
    fontSize: 12,
    color: '#707C8D',
  },
  cardCountsFlex: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flexWrap: 'wrap',
    borderTopWidth: 1,
    borderColor: '#E9EDF3',
    marginTop: 14,
    paddingTop: 12,
  },
  cardCountSpan: {
    fontSize: 12,
    color: '#707C8D',
  },
  cardCountBold: {
    fontWeight: '700',
    color: '#192232',
  },
  cardViewDetailLink: {
    fontSize: 13,
    fontWeight: '600',
    color: '#345FDF',
    marginTop: 10,
  },

  // BADGE PILLS
  badgePill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 7,
  },
  badgePillPending: {
    backgroundColor: '#FFF5DF',
  },
  badgePillPendingText: {
    color: '#9F650B',
    fontSize: 11,
    fontWeight: '600',
  },
  badgePillDone: {
    backgroundColor: '#EDF2FF',
  },
  badgePillDoneText: {
    color: '#117D60',
    fontSize: 11,
    fontWeight: '600',
  },
  badgePillDraft: {
    backgroundColor: '#F1F5F9',
  },
  badgePillDraftText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
  },
  badgePillText: {
    fontSize: 11,
    fontWeight: '600',
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
    color: '#345FDF',
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
    color: '#707C8D',
    marginTop: 4,
  },
  detailSubmitTimeText: {
    fontSize: 12,
    color: '#707C8D',
    marginTop: 4,
  },
  summaryKPIContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderColor: '#E9EDF3',
  },
  summaryKPICell: {
    flex: 1,
  },
  summaryKPIValue: {
    fontSize: 23,
    fontWeight: '700',
    color: '#192232',
  },
  summaryKPILabel: {
    fontSize: 11,
    color: '#707C8D',
    marginTop: 2,
  },

  // TABS BAR
  tabsBar: {
    flexDirection: 'row',
    gap: 5,
    backgroundColor: '#E9EDF3',
    borderRadius: 13,
    padding: 4,
    marginBottom: 14,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 9,
    borderRadius: 10,
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#707C8D',
  },
  tabButtonTextActive: {
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
    color: '#707C8D',
    marginTop: 4,
    marginBottom: 8,
  },
  panelHeaderCountText: {
    fontSize: 12,
    color: '#707C8D',
  },
  emptyPromptText: {
    fontSize: 13,
    color: '#94A3B8',
    fontStyle: 'italic',
    marginVertical: 6,
  },

  // METRICS ITEM ROW
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
    color: '#707C8D',
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
    color: '#707C8D',
    marginTop: 3,
  },
  expandCollapseBtn: {
    paddingVertical: 10,
    alignItems: 'flex-start',
  },
  expandCollapseBtnText: {
    fontSize: 13,
    color: '#345FDF',
    fontWeight: '600',
  },

  // PLANS & OBSTACLES CALLOUTS
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
  calloutSoftBox: {
    backgroundColor: '#EDF2FF',
    padding: 12,
    borderRadius: 12,
    marginTop: 6,
  },
  calloutSoftBoxText: {
    fontSize: 13,
    color: '#192232',
    lineHeight: 18,
  },
  emptyPlanText: {
    fontSize: 13,
    color: '#192232',
  },
  emptyPlanSub: {
    fontSize: 12,
    color: '#707C8D',
    marginTop: 2,
  },

  // ATTACHMENTS
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
    color: '#707C8D',
    marginTop: 2,
  },

  // EVALUATION STYLES
  selfRatingBetweenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#E9EDF3',
    marginBottom: 6,
  },
  selfRatingTitle: {
    fontSize: 13,
    color: '#192232',
  },
  goldStarRating: {
    fontSize: 14,
    fontWeight: '700',
    color: '#9F650B',
  },
  selfReviewDetailText: {
    fontSize: 12,
    color: '#707C8D',
    marginTop: 4,
  },
  interactiveStarsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 14,
    paddingHorizontal: 6,
  },
  interactiveStarBtn: {
    padding: 6,
    borderRadius: 10,
  },
  interactiveStarBtnFilled: {
    backgroundColor: '#FFF5DF',
  },
  scoreLevelDescriptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#192232',
    textAlign: 'center',
    marginBottom: 14,
  },
  inputLabelHeader: {
    fontSize: 12,
    color: '#707C8D',
    marginBottom: 6,
  },
  managerNoteInput: {
    backgroundColor: '#F6F7FB',
    borderWidth: 1,
    borderColor: '#E9EDF3',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#192232',
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 14,
  },
  primaryActionBtn: {
    backgroundColor: '#192232',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  confirmScoreBox: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#E9EDF3',
    marginBottom: 8,
  },
  confirmNoteText: {
    fontSize: 14,
    color: '#192232',
    lineHeight: 20,
    marginVertical: 8,
  },
  confirmNoteSubWarning: {
    fontSize: 12,
    color: '#707C8D',
    marginTop: 4,
  },
  secondaryLinkBtn: {
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 6,
  },
  secondaryLinkBtnText: {
    fontSize: 13,
    color: '#345FDF',
    fontWeight: '600',
  },
  savedManagerNoteText: {
    fontSize: 14,
    color: '#192232',
    lineHeight: 20,
    marginVertical: 8,
  },
  savedManagerMetaText: {
    fontSize: 12,
    color: '#707C8D',
    marginTop: 2,
  },
  reEditLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E9EDF3',
    borderRadius: 12,
  },
  reEditLinkBtnText: {
    fontSize: 13,
    color: '#345FDF',
    fontWeight: '600',
  },

  // FOOTER STEP
  footerStepContainer: {
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E9EDF3',
    paddingHorizontal: 16,
    marginTop: 6,
  },
  footerPrimaryBtn: {
    backgroundColor: '#192232',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  footerPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  // DEPARTMENT MODAL
  deptModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    padding: 20,
  },
  deptModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E9EDF3',
  },
  deptModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: '#E9EDF3',
    marginBottom: 8,
  },
  deptModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#192232',
  },
  deptOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  deptOptionRowActive: {
    backgroundColor: '#EDF2FF',
  },
  deptOptionText: {
    fontSize: 14,
    color: '#192232',
    fontWeight: '500',
  },
  deptOptionTextActive: {
    color: '#345FDF',
    fontWeight: '700',
  },

  // EMPTY & LOADING
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 10,
  },
  loadingPromptText: {
    fontSize: 13,
    color: '#707C8D',
  },
  emptyCard: {
    padding: 30,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E9EDF3',
    marginVertical: 10,
  },
  emptyCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#192232',
    marginTop: 10,
  },
  emptyCardSub: {
    fontSize: 12,
    color: '#707C8D',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 14,
  },
  resetFilterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#EDF2FF',
  },
  resetFilterBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#345FDF',
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
