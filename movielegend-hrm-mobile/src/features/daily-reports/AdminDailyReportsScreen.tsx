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
import { colors } from '../../theme/colors';
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

const ASSESSMENT_LEVELS = [
  { level: 1, title: 'Chưa hoàn thành', desc: 'Chưa hoàn thành phần lớn khối lượng công việc được giao.' },
  { level: 2, title: 'Hoàn thành một phần', desc: 'Đã thực hiện nhưng còn nhiều mục tiêu chưa đạt yêu cầu.' },
  { level: 3, title: 'Gần đạt kế hoạch', desc: 'Cơ bản bám sát kế hoạch, còn một vài điểm cần cải thiện.' },
  { level: 4, title: 'Đạt kế hoạch', desc: 'Hoàn thành đầy đủ các mục tiêu và chất lượng theo yêu cầu.' },
  { level: 5, title: 'Vượt kế hoạch', desc: 'Đã đạt kế hoạch và có thêm kết quả xuất sắc ngoài mục tiêu.' },
];

export function AdminDailyReportsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  // Date selection (default today YYYY-MM-DD)
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr || '');
  const [selectedDeptId, setSelectedDeptId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all'); // all | pending | reviewed | draft
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Active report for Detail View (if non-null, shows Detail View; if null, shows List View)
  const [activeReport, setActiveReport] = useState<DailyReport | null>(null);

  // Detail View Tab: 'results' | 'plans' | 'evaluation'
  const [detailTab, setDetailTab] = useState<'results' | 'plans' | 'evaluation'>('results');
  const [expandedCompleted, setExpandedCompleted] = useState<boolean>(false);

  // Manager evaluation state in Detail View
  const [managerScore, setManagerScore] = useState<number>(5);
  const [managerNote, setManagerNote] = useState<string>('');
  const [isConfirmingEval, setIsConfirmingEval] = useState<boolean>(false);

  // Preview modals state
  const [previewImageUri, setPreviewImageUri] = useState<string | null>(null);
  const [previewImageTitle, setPreviewImageTitle] = useState<string>('Xem ảnh đính kèm');
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [pdfPreviewTitle, setPdfPreviewTitle] = useState<string>('Xem tài liệu');

  // Departments for filtering
  const departmentsQuery = useDepartments();
  const departmentsList = useMemo(() => departmentsQuery.data?.items ?? [], [departmentsQuery.data]);

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
    search: searchQuery || undefined,
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
      setManagerScore(activeReport.adminRating || 5);
      setManagerNote(activeReport.adminReview || '');
      setIsConfirmingEval(false);
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
    setSearchQuery('');
  };

  const handleSaveEvaluation = async () => {
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
      setActiveReport((prev) =>
        prev
          ? {
              ...prev,
              adminRating: managerScore,
              adminReview: managerNote.trim() || null,
              status: 'REVIEWED',
              reviewedById: user?.id || null,
              reviewedAt: new Date().toISOString(),
            }
          : null
      );

      setIsConfirmingEval(false);
      void reportsQuery.refetch();

      Alert.alert('Thành công', 'Đã lưu và khóa đánh giá báo cáo thành công!');
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

    const selfAssessmentInfo = ASSESSMENT_LEVELS.find((a) => a.level === activeReport.selfRating) || {
      level: activeReport.selfRating || 5,
      title: activeReport.selfRating ? `${activeReport.selfRating}/5 sao` : 'Chưa đánh giá',
      desc: '',
    };

    return (
      <Screen backgroundColor="#F6F7FB">
        <ScreenContainer style={{ paddingTop: 0, paddingBottom: Math.max(insets.bottom + 16, 24) }}>
          {/* Top Bar / Back Button */}
          <View style={styles.detailHeader}>
            <Pressable style={styles.backBtn} onPress={() => setActiveReport(null)}>
              <MaterialCommunityIcons name="arrow-left" size={18} color="#345FDF" />
              <Text style={styles.backBtnText}>Danh sách báo cáo</Text>
            </Pressable>

            <View style={styles.detailTitleRow}>
              <Text style={styles.detailUserName}>{memberName}</Text>
              <View
                style={[
                  styles.badge,
                  isReviewed ? styles.badgeDone : isSubmitted ? styles.badgePending : styles.badgeDraft,
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    isReviewed ? styles.badgeDoneText : isSubmitted ? styles.badgePendingText : styles.badgeDraftText,
                  ]}
                >
                  {isReviewed ? 'Đã đánh giá' : isSubmitted ? 'Chờ duyệt' : 'Bản nháp'}
                </Text>
              </View>
            </View>

            <Text style={styles.detailSubtitle}>
              {deptName} · {roleName} ·{' '}
              {new Date(activeReport.reportDate).toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              })}
            </Text>

            <Text style={styles.detailSubNotice}>
              {activeReport.status === 'SUBMITTED'
                ? 'Đã nộp · Chờ quản lý đánh giá'
                : isReviewed
                ? `Đã đánh giá lúc ${new Date(activeReport.reviewedAt || Date.now()).toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}`
                : 'Bản mẫu / Nháp'}
            </Text>

            {/* 3 Summary Counters */}
            <View style={styles.detailSummaryRow}>
              <View style={styles.summaryCol}>
                <Text style={styles.summaryColValue}>{completedCount}</Text>
                <Text style={styles.summaryColLabel}>Hoàn thành</Text>
              </View>
              <View style={styles.summaryColDivider} />
              <View style={styles.summaryCol}>
                <Text style={styles.summaryColValue}>{inProgressCount}</Text>
                <Text style={styles.summaryColLabel}>Đang thực hiện</Text>
              </View>
              <View style={styles.summaryColDivider} />
              <View style={styles.summaryCol}>
                <Text style={styles.summaryColValue}>{planCount}</Text>
                <Text style={styles.summaryColLabel}>Kế hoạch mai</Text>
              </View>
            </View>
          </View>

          {/* 3 TABS: Kết quả | Kế hoạch | Đánh giá */}
          <View style={styles.tabsContainer}>
            <Pressable
              style={[styles.tabBtn, detailTab === 'results' && styles.tabBtnActive]}
              onPress={() => setDetailTab('results')}
            >
              <Text style={[styles.tabBtnText, detailTab === 'results' && styles.tabBtnTextActive]}>
                01 · Kết quả
              </Text>
            </Pressable>

            <Pressable
              style={[styles.tabBtn, detailTab === 'plans' && styles.tabBtnActive]}
              onPress={() => setDetailTab('plans')}
            >
              <Text style={[styles.tabBtnText, detailTab === 'plans' && styles.tabBtnTextActive]}>
                02 · Kế hoạch
              </Text>
            </Pressable>

            <Pressable
              style={[styles.tabBtn, detailTab === 'evaluation' && styles.tabBtnActive]}
              onPress={() => setDetailTab('evaluation')}
            >
              <Text style={[styles.tabBtnText, detailTab === 'evaluation' && styles.tabBtnTextActive]}>
                03 · Đánh giá
              </Text>
            </Pressable>
          </View>

          {/* TAB 1: KẾT QUẢ */}
          {detailTab === 'results' && (
            <View style={styles.tabContent}>
              {/* Quantitative Metrics */}
              <View style={styles.panel}>
                <Text style={styles.panelTitle}>Kết quả công việc định lượng</Text>
                <Text style={styles.panelSubtitle}>
                  {activeReport.metrics && activeReport.metrics.length > 0
                    ? `${activeReport.metrics.length} chỉ tiêu báo cáo`
                    : 'Chưa có chỉ tiêu'}
                </Text>

                {(!activeReport.metrics || activeReport.metrics.length === 0) ? (
                  <Text style={styles.emptyText}>Chưa có số liệu định lượng</Text>
                ) : (
                  activeReport.metrics.map((m, idx) => (
                    <View key={idx} style={styles.metricItemRow}>
                      <View style={{ flex: 1, paddingRight: 8 }}>
                        <Text style={styles.metricName}>{m.name}</Text>
                        {!!m.note && <Text style={styles.metricNote}>{m.note}</Text>}
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.metricValue}>
                          {m.value !== undefined && m.value !== '' ? String(m.value) : 'Chưa nhập'}
                        </Text>
                        {!!m.unit && <Text style={styles.metricUnit}>{m.unit}</Text>}
                      </View>
                    </View>
                  ))
                )}
              </View>

              {/* Completed Tasks */}
              <View style={styles.panel}>
                <View style={styles.panelHeaderRow}>
                  <Text style={styles.panelTitle}>Đã hoàn thành</Text>
                  <View style={styles.countBadge}>
                    <Text style={styles.countBadgeText}>{completedCount} việc</Text>
                  </View>
                </View>

                {completedCount === 0 ? (
                  <Text style={styles.emptyText}>Chưa có công việc hoàn thành</Text>
                ) : (
                  <>
                    {visibleCompleted.map((t, idx) => (
                      <View key={idx} style={styles.taskItemRow}>
                        <MaterialCommunityIcons name="check-circle" size={18} color="#117D60" style={{ marginTop: 2 }} />
                        <View style={{ flex: 1, marginLeft: 10 }}>
                          <Text style={styles.taskTitle}>{t.title}</Text>
                          {!!t.note && <Text style={styles.taskNote}>{t.note}</Text>}
                        </View>
                      </View>
                    ))}

                    {completedCount > 3 && (
                      <Pressable
                        style={styles.expandBtn}
                        onPress={() => setExpandedCompleted(!expandedCompleted)}
                      >
                        <Text style={styles.expandBtnText}>
                          {expandedCompleted
                            ? 'Thu gọn danh sách ▲'
                            : `Xem thêm ${hiddenCompletedCount} công việc ▼`}
                        </Text>
                      </Pressable>
                    )}
                  </>
                )}
              </View>

              {/* In Progress Tasks */}
              <View style={styles.panel}>
                <View style={styles.panelHeaderRow}>
                  <Text style={styles.panelTitle}>Đang thực hiện</Text>
                  <View style={[styles.countBadge, { backgroundColor: '#EEF3FF' }]}>
                    <Text style={[styles.countBadgeText, { color: '#345FDF' }]}>{inProgressCount} việc</Text>
                  </View>
                </View>

                {inProgressCount === 0 ? (
                  <Text style={styles.emptyText}>Không có công việc đang thực hiện</Text>
                ) : (
                  activeReport.inProgressTasks.map((t, idx) => (
                    <View key={idx} style={styles.taskItemRow}>
                      <MaterialCommunityIcons name="progress-clock" size={18} color="#345FDF" style={{ marginTop: 2 }} />
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.taskTitle}>{t.title}</Text>
                        <View style={styles.progressRow}>
                          <Text style={styles.progressText}>
                            Dự kiến: {t.expectedDate || 'Ngày mai'}
                          </Text>
                          {t.progress !== undefined && (
                            <Text style={styles.progressPercent}>{t.progress}%</Text>
                          )}
                        </View>
                      </View>
                    </View>
                  ))
                )}
              </View>
            </View>
          )}

          {/* TAB 2: KẾ HOẠCH & ĐÍNH KÈM */}
          {detailTab === 'plans' && (
            <View style={styles.tabContent}>
              {/* Obstacles & Support */}
              <View style={styles.panel}>
                <Text style={styles.panelTitle}>Khó khăn & đề xuất hỗ trợ</Text>
                {activeReport.obstacles && activeReport.obstacles.trim().length > 0 ? (
                  <View style={styles.calloutAmber}>
                    <MaterialCommunityIcons name="alert-circle-outline" size={20} color="#9F650B" />
                    <Text style={styles.calloutAmberText}>{activeReport.obstacles}</Text>
                  </View>
                ) : (
                  <View style={styles.calloutSoft}>
                    <Text style={styles.calloutSoftText}>
                      Nhân viên báo cáo không có khó khăn hay trở ngại cần hỗ trợ.
                    </Text>
                  </View>
                )}
              </View>

              {/* Tomorrow Plans */}
              <View style={styles.panel}>
                <View style={styles.panelHeaderRow}>
                  <Text style={styles.panelTitle}>Kế hoạch ngày mai</Text>
                  <View style={[styles.countBadge, { backgroundColor: '#F6F7FB' }]}>
                    <Text style={[styles.countBadgeText, { color: '#707C8D' }]}>{planCount} việc</Text>
                  </View>
                </View>

                {planCount === 0 ? (
                  <Text style={styles.emptyText}>Chưa có kế hoạch được đề xuất.</Text>
                ) : (
                  activeReport.tomorrowPlan.map((p, idx) => (
                    <View key={idx} style={styles.planItemRow}>
                      <Text style={styles.planNumberBadge}>{String(idx + 1).padStart(2, '0')}</Text>
                      <Text style={styles.planItemText}>{p}</Text>
                    </View>
                  ))
                )}
              </View>

              {/* Attachments & Photos */}
              <View style={styles.panel}>
                <Text style={styles.panelTitle}>Tệp đính kèm & Hình ảnh</Text>
                {(!activeReport.attachments || activeReport.attachments.length === 0) ? (
                  <Text style={styles.emptyText}>Không có tệp hay hình ảnh đính kèm</Text>
                ) : (
                  <View style={{ marginTop: 8, gap: 10 }}>
                    {activeReport.attachments.map((file, idx) => {
                      const isImg =
                        file.fileType === 'IMAGE' ||
                        file.url.toLowerCase().match(/\.(jpeg|jpg|gif|png|webp)($|\?)/);

                      return (
                        <Pressable
                          key={idx}
                          style={styles.attachmentCard}
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
                            <View style={styles.attachmentDocIcon}>
                              <MaterialCommunityIcons name="file-pdf-box" size={24} color="#EF4444" />
                            </View>
                          )}

                          <View style={{ flex: 1, marginLeft: 10 }}>
                            <Text style={styles.attachmentFileName} numberOfLines={1}>
                              {file.fileName || (isImg ? 'Ảnh đính kèm' : 'Tài liệu đính kèm')}
                            </Text>
                            <Text style={styles.attachmentFileSize}>
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
            <View style={styles.tabContent}>
              {/* Self Assessment Card */}
              <View style={styles.panel}>
                <Text style={styles.panelTitle}>Tự đánh giá của nhân viên</Text>
                <View style={styles.selfRatingHeaderRow}>
                  <Text style={styles.selfRatingLabel}>Mức độ hoàn thành:</Text>
                  <Text style={styles.goldStarText}>
                    ★ {activeReport.selfRating || 5}/5 · {selfAssessmentInfo.title}
                  </Text>
                </View>

                <Text style={styles.selfReviewText}>
                  {activeReport.selfReview?.trim()
                    ? `Nhận xét: "${activeReport.selfReview}"`
                    : 'Nhân viên không để lại nhận xét thêm.'}
                </Text>
              </View>

              {/* Manager Evaluation Form / Saved State */}
              {isReviewed && !isConfirmingEval ? (
                /* Already Evaluated & Locked */
                <View style={styles.panel}>
                  <View style={styles.panelHeaderRow}>
                    <Text style={styles.panelTitle}>Đã đánh giá & Khóa</Text>
                    <View style={[styles.badge, styles.badgeDone]}>
                      <Text style={[styles.badgeText, styles.badgeDoneText]}>Đã hoàn tất</Text>
                    </View>
                  </View>

                  <View style={styles.savedScoreRow}>
                    <Text style={styles.goldStarBigText}>
                      ★ {activeReport.adminRating || managerScore}/5
                    </Text>
                    <Text style={styles.savedScoreLabel}>
                      {ASSESSMENT_LABELS[(activeReport.adminRating || managerScore) - 1]}
                    </Text>
                  </View>

                  <View style={styles.savedNoteBox}>
                    <Text style={styles.savedNoteTitle}>Nhận xét của Quản lý / Admin:</Text>
                    <Text style={styles.savedNoteContent}>
                      {activeReport.adminReview || 'Đạt yêu cầu.'}
                    </Text>
                  </View>

                  <View style={styles.reviewerInfoRow}>
                    <MaterialCommunityIcons name="shield-check" size={16} color="#117D60" />
                    <Text style={styles.reviewerInfoText}>
                      Đánh giá bởi {activeReport.reviewedBy?.profile?.fullName || activeReport.reviewedBy?.userCode || 'Admin'}
                      {activeReport.reviewedAt
                        ? ` lúc ${new Date(activeReport.reviewedAt).toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })} - ${new Date(activeReport.reviewedAt).toLocaleDateString('vi-VN')}`
                        : ''}
                    </Text>
                  </View>

                  <Pressable
                    style={styles.reEditBtn}
                    onPress={() => setIsConfirmingEval(true)}
                  >
                    <MaterialCommunityIcons name="pencil-outline" size={16} color="#345FDF" />
                    <Text style={styles.reEditBtnText}>Chỉnh sửa lại đánh giá</Text>
                  </Pressable>
                </View>
              ) : (
                /* Edit Evaluation Form */
                <View style={styles.panel}>
                  <Text style={styles.panelTitle}>Đánh giá của quản lý</Text>
                  <Text style={styles.panelSubtitle}>
                    Chấm điểm dựa trên kết quả và chất lượng báo cáo hôm nay.
                  </Text>

                  {/* 5 Stars Picker */}
                  <View style={styles.starsRow}>
                    {[1, 2, 3, 4, 5].map((s) => {
                      const isFilled = s <= managerScore;
                      return (
                        <Pressable
                          key={s}
                          style={[styles.starBtn, isFilled && styles.starBtnFilled]}
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

                  <Text style={styles.scoreActiveLabel}>
                    {managerScore}/5 sao · {ASSESSMENT_LABELS[managerScore - 1]}
                  </Text>

                  <Text style={styles.inputSectionLabel}>Nhận xét / Góp ý</Text>
                  <TextInput
                    style={styles.textArea}
                    multiline
                    numberOfLines={4}
                    placeholder="Kết quả nổi bật, điểm cần cải thiện hoặc chỉ đạo tiếp theo..."
                    placeholderTextColor="#94A3B8"
                    value={managerNote}
                    onChangeText={setManagerNote}
                  />

                  <Pressable
                    style={styles.submitEvalBtn}
                    onPress={handleSaveEvaluation}
                    disabled={reviewMutation.isPending}
                  >
                    {reviewMutation.isPending ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <>
                        <MaterialCommunityIcons name="check-all" size={20} color="#FFFFFF" />
                        <Text style={styles.submitEvalBtnText}>Lưu & Khóa đánh giá</Text>
                      </>
                    )}
                  </Pressable>

                  {isReviewed && (
                    <Pressable
                      style={styles.cancelEditBtn}
                      onPress={() => setIsConfirmingEval(false)}
                    >
                      <Text style={styles.cancelEditBtnText}>Hủy chỉnh sửa</Text>
                    </Pressable>
                  )}
                </View>
              )}
            </View>
          )}

          {/* Footer Step Navigation */}
          <View style={styles.footerStepBox}>
            <Pressable
              style={styles.footerNextBtn}
              onPress={() => {
                if (detailTab === 'results') setDetailTab('plans');
                else if (detailTab === 'plans') setDetailTab('evaluation');
                else setActiveReport(null);
              }}
            >
              <Text style={styles.footerNextBtnText}>
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
        <View style={styles.listHeaderBox}>
          <View style={styles.listHeaderTopRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.listHeaderTitle}>Báo cáo cuối ngày</Text>
              <Text style={styles.listHeaderSubtitle}>Theo dõi kết quả. Phản hồi kịp thời.</Text>
            </View>
            <View style={styles.adminBadge}>
              <Text style={styles.adminBadgeText}>Quản trị</Text>
            </View>
          </View>
        </View>

        {/* Date Selector Bar */}
        <View style={styles.dateBar}>
          <Pressable style={styles.dateNavBtn} onPress={handlePrevDay}>
            <MaterialCommunityIcons name="chevron-left" size={24} color="#192232" />
          </Pressable>

          <View style={styles.dateDisplay}>
            <MaterialCommunityIcons name="calendar-month" size={18} color="#345FDF" />
            <Text style={styles.dateDisplayText}>
              {new Date(selectedDate).toLocaleDateString('vi-VN', {
                weekday: 'short',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              })}
            </Text>
            {selectedDate !== todayStr && (
              <Pressable style={styles.todayPill} onPress={() => todayStr && setSelectedDate(todayStr)}>
                <Text style={styles.todayPillText}>Hôm nay</Text>
              </Pressable>
            )}
          </View>

          <Pressable style={styles.dateNavBtn} onPress={handleNextDay}>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#192232" />
          </Pressable>
        </View>

        {/* Department Picker Scroll */}
        <View style={styles.deptSection}>
          <Text style={styles.sectionLabel}>Phòng ban</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.deptScroll}>
            <Pressable
              style={[styles.deptPill, selectedDeptId === 'all' && styles.deptPillActive]}
              onPress={() => setSelectedDeptId('all')}
            >
              <Text style={[styles.deptPillText, selectedDeptId === 'all' && styles.deptPillTextActive]}>
                Tất cả phòng ban
              </Text>
            </Pressable>

            {departmentsList.map((dept: any) => {
              const isActive = selectedDeptId === dept.id;
              return (
                <Pressable
                  key={dept.id}
                  style={[styles.deptPill, isActive && styles.deptPillActive]}
                  onPress={() => setSelectedDeptId(dept.id)}
                >
                  <Text style={[styles.deptPillText, isActive && styles.deptPillTextActive]}>
                    {dept.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* 2x2 Status Filters Grid */}
        <View style={styles.filtersGrid}>
          <Pressable
            style={[styles.filterGridBtn, statusFilter === 'all' && styles.filterGridBtnActive]}
            onPress={() => setStatusFilter('all')}
          >
            <Text style={[styles.filterGridLabel, statusFilter === 'all' && styles.filterGridLabelActive]}>
              Tất cả
            </Text>
            <Text style={[styles.filterGridCount, statusFilter === 'all' && styles.filterGridCountActive]}>
              {stats.total}
            </Text>
          </Pressable>

          <Pressable
            style={[styles.filterGridBtn, statusFilter === 'pending' && styles.filterGridBtnActive]}
            onPress={() => setStatusFilter('pending')}
          >
            <Text style={[styles.filterGridLabel, statusFilter === 'pending' && styles.filterGridLabelActive]}>
              Chờ duyệt
            </Text>
            <Text style={[styles.filterGridCount, statusFilter === 'pending' && styles.filterGridCountActive]}>
              {stats.pending}
            </Text>
          </Pressable>

          <Pressable
            style={[styles.filterGridBtn, statusFilter === 'reviewed' && styles.filterGridBtnActive]}
            onPress={() => setStatusFilter('reviewed')}
          >
            <Text style={[styles.filterGridLabel, statusFilter === 'reviewed' && styles.filterGridLabelActive]}>
              Đã đánh giá
            </Text>
            <Text style={[styles.filterGridCount, statusFilter === 'reviewed' && styles.filterGridCountActive]}>
              {stats.reviewed}
            </Text>
          </Pressable>

          <Pressable
            style={[styles.filterGridBtn, statusFilter === 'draft' && styles.filterGridBtnActive]}
            onPress={() => setStatusFilter('draft')}
          >
            <Text style={[styles.filterGridLabel, statusFilter === 'draft' && styles.filterGridLabelActive]}>
              Bản nháp
            </Text>
            <Text style={[styles.filterGridCount, statusFilter === 'draft' && styles.filterGridCountActive]}>
              {stats.draft}
            </Text>
          </Pressable>
        </View>

        {/* Reports List Title */}
        <View style={styles.listCountRow}>
          <Text style={styles.listCountTitle}>Danh sách báo cáo</Text>
          <Text style={styles.listCountNumber}>{reports.length} báo cáo</Text>
        </View>

        {/* Report Cards */}
        {reportsQuery.isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color="#345FDF" />
            <Text style={styles.loadingText}>Đang tải danh sách báo cáo...</Text>
          </View>
        ) : reports.length === 0 ? (
          <View style={styles.emptyBox}>
            <MaterialCommunityIcons name="file-document-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>Không có báo cáo phù hợp</Text>
            <Text style={styles.emptySub}>
              Thử chọn ngày, phòng ban hoặc trạng thái khác.
            </Text>
            <Pressable style={styles.resetBtn} onPress={handleResetFilters}>
              <Text style={styles.resetBtnText}>Đặt lại bộ lọc</Text>
            </Pressable>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {reports.map((report) => {
              const isReviewed = report.status === 'REVIEWED';
              const isSubmitted = report.status === 'SUBMITTED';
              const memberName = report.user?.profile?.fullName || report.user?.userCode || 'Nhân sự';
              const deptName = report.department?.name || 'Phòng ban';

              // Avatar Initials
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
                  style={styles.reportCard}
                  onPress={() => setActiveReport(report)}
                >
                  {/* Card Header: Avatar, Name & Date, Badge */}
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.cardAvatar}>
                      <Text style={styles.cardAvatarText}>{initials || 'NV'}</Text>
                    </View>

                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.cardMemberName}>{memberName}</Text>
                      <Text style={styles.cardDeptDate}>
                        {deptName} · {new Date(report.reportDate).toLocaleDateString('vi-VN')}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.badge,
                        isReviewed ? styles.badgeDone : isSubmitted ? styles.badgePending : styles.badgeDraft,
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          isReviewed ? styles.badgeDoneText : isSubmitted ? styles.badgePendingText : styles.badgeDraftText,
                        ]}
                      >
                        {isReviewed ? 'Đã đánh giá' : isSubmitted ? 'Chờ duyệt' : 'Bản nháp'}
                      </Text>
                    </View>
                  </View>

                  {/* Ratings Line */}
                  <View style={styles.cardRatingRow}>
                    <Text style={styles.cardRatingSelf}>
                      Tự đánh giá <Text style={styles.goldStarInline}>★ {report.selfRating || 5}/5</Text>
                    </Text>
                    <Text style={styles.cardRatingManager}>
                      {report.adminRating ? (
                        <Text style={{ color: '#117D60', fontWeight: '600' }}>
                          Quản lý: ★ {report.adminRating}/5
                        </Text>
                      ) : (
                        <Text style={{ color: '#707C8D' }}>Quản lý: Chưa đánh giá</Text>
                      )}
                    </Text>
                  </View>

                  {/* Summary Counts Bar */}
                  <View style={styles.cardCountsBar}>
                    <Text style={styles.cardCountItem}>
                      <Text style={styles.cardCountNum}>{completedTasksCount}</Text> hoàn thành
                    </Text>
                    <Text style={styles.cardCountDot}>•</Text>
                    <Text style={styles.cardCountItem}>
                      <Text style={styles.cardCountNum}>{inProgressTasksCount}</Text> đang làm
                    </Text>
                    <Text style={styles.cardCountDot}>•</Text>
                    <Text style={styles.cardCountItem}>
                      <Text style={styles.cardCountNum}>{plansCount}</Text> kế hoạch
                    </Text>
                  </View>

                  {/* Detail Link */}
                  <View style={styles.cardFooterLink}>
                    <Text style={styles.cardFooterLinkText}>Xem chi tiết →</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScreenContainer>
    </Screen>
  );
}

// -------------------------------------------------------------
// STYLES
// -------------------------------------------------------------
const styles = StyleSheet.create({
  // MAIN LIST HEADER
  listHeaderBox: {
    paddingHorizontal: 4,
    paddingTop: 4,
    paddingBottom: 10,
  },
  listHeaderTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  listHeaderTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#192232',
    letterSpacing: -0.6,
  },
  listHeaderSubtitle: {
    fontSize: 13,
    color: '#707C8D',
    marginTop: 2,
  },
  adminBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E9EDF3',
    marginTop: 2,
  },
  adminBadgeText: {
    fontSize: 11,
    color: '#707C8D',
    fontWeight: '600',
  },

  // DATE BAR
  dateBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E9EDF3',
    marginBottom: 12,
  },
  dateNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F6F7FB',
  },
  dateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateDisplayText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#192232',
  },
  todayPill: {
    backgroundColor: '#EDF2FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  todayPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#345FDF',
  },

  // DEPT FILTER
  deptSection: {
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#707C8D',
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  deptScroll: {
    gap: 8,
    paddingHorizontal: 2,
  },
  deptPill: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E9EDF3',
  },
  deptPillActive: {
    backgroundColor: '#192232',
    borderColor: '#192232',
  },
  deptPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#707C8D',
  },
  deptPillTextActive: {
    color: '#FFFFFF',
  },

  // 2x2 FILTERS GRID
  filtersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  filterGridBtn: {
    width: '48.5%',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E9EDF3',
  },
  filterGridBtnActive: {
    backgroundColor: '#192232',
    borderColor: '#192232',
  },
  filterGridLabel: {
    fontSize: 12,
    color: '#707C8D',
    fontWeight: '500',
  },
  filterGridLabelActive: {
    color: '#FFFFFF',
  },
  filterGridCount: {
    fontSize: 20,
    fontWeight: '800',
    color: '#192232',
    marginTop: 4,
  },
  filterGridCountActive: {
    color: '#FFFFFF',
  },

  // LIST COUNT ROW
  listCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  listCountTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#192232',
  },
  listCountNumber: {
    fontSize: 12,
    color: '#707C8D',
    fontWeight: '600',
  },

  // REPORT CARD
  reportCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E9EDF3',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardAvatar: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#EDF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardAvatarText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#345FDF',
  },
  cardMemberName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#192232',
  },
  cardDeptDate: {
    fontSize: 12,
    color: '#707C8D',
    marginTop: 2,
  },
  cardRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardRatingSelf: {
    fontSize: 12,
    color: '#707C8D',
  },
  goldStarInline: {
    color: '#EF8E0B',
    fontWeight: '700',
  },
  cardRatingManager: {
    fontSize: 12,
  },
  cardCountsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardCountItem: {
    fontSize: 12,
    color: '#707C8D',
  },
  cardCountNum: {
    fontWeight: '700',
    color: '#192232',
  },
  cardCountDot: {
    color: '#CBD5E1',
    fontSize: 12,
  },
  cardFooterLink: {
    marginTop: 12,
    alignItems: 'flex-start',
  },
  cardFooterLinkText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#345FDF',
  },

  // BADGES
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgePending: {
    backgroundColor: '#FFF5DF',
  },
  badgePendingText: {
    color: '#9F650B',
    fontSize: 11,
    fontWeight: '700',
  },
  badgeDone: {
    backgroundColor: '#EDF2FF',
  },
  badgeDoneText: {
    color: '#117D60',
    fontSize: 11,
    fontWeight: '700',
  },
  badgeDraft: {
    backgroundColor: '#F1F5F9',
  },
  badgeDraftText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // DETAIL VIEW HEADER
  detailHeader: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E9EDF3',
    marginBottom: 12,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#345FDF',
  },
  detailTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailUserName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#192232',
    letterSpacing: -0.5,
  },
  detailSubtitle: {
    fontSize: 13,
    color: '#707C8D',
    marginTop: 4,
  },
  detailSubNotice: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  detailSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderColor: '#E9EDF3',
  },
  summaryCol: {
    alignItems: 'center',
    flex: 1,
  },
  summaryColDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E9EDF3',
  },
  summaryColValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#192232',
  },
  summaryColLabel: {
    fontSize: 11,
    color: '#707C8D',
    marginTop: 2,
  },

  // TABS
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#E9EDF3',
    borderRadius: 14,
    padding: 4,
    marginBottom: 12,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#707C8D',
  },
  tabBtnTextActive: {
    color: '#192232',
    fontWeight: '700',
  },

  // PANELS
  tabContent: {
    gap: 12,
  },
  panel: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E9EDF3',
  },
  panelHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  panelTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#192232',
  },
  panelSubtitle: {
    fontSize: 12,
    color: '#707C8D',
    marginTop: 2,
    marginBottom: 10,
  },
  countBadge: {
    backgroundColor: '#EDF2FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#117D60',
  },
  emptyText: {
    fontSize: 13,
    color: '#94A3B8',
    fontStyle: 'italic',
    marginVertical: 6,
  },

  // QUANTITATIVE METRICS
  metricItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  metricName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#192232',
  },
  metricNote: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#345FDF',
  },
  metricUnit: {
    fontSize: 11,
    color: '#707C8D',
    marginTop: 1,
  },

  // TASKS
  taskItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  taskTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#192232',
    lineHeight: 18,
  },
  taskNote: {
    fontSize: 12,
    color: '#707C8D',
    marginTop: 2,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  progressText: {
    fontSize: 11,
    color: '#707C8D',
  },
  progressPercent: {
    fontSize: 11,
    fontWeight: '700',
    color: '#345FDF',
  },
  expandBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  expandBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#345FDF',
  },

  // PLANS & OBSTACLES
  calloutAmber: {
    backgroundColor: '#FFF5DF',
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 6,
  },
  calloutAmberText: {
    flex: 1,
    fontSize: 13,
    color: '#9F650B',
    lineHeight: 18,
  },
  calloutSoft: {
    backgroundColor: '#EDF2FF',
    padding: 12,
    borderRadius: 12,
    marginTop: 6,
  },
  calloutSoftText: {
    fontSize: 13,
    color: '#192232',
    lineHeight: 18,
  },
  planItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
    gap: 10,
  },
  planNumberBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#707C8D',
    backgroundColor: '#F6F7FB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  planItemText: {
    flex: 1,
    fontSize: 13,
    color: '#192232',
    fontWeight: '500',
    lineHeight: 18,
  },

  // ATTACHMENTS
  attachmentCard: {
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
  attachmentDocIcon: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachmentFileName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#192232',
  },
  attachmentFileSize: {
    fontSize: 11,
    color: '#707C8D',
    marginTop: 2,
  },

  // EVALUATION & RATINGS
  selfRatingHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  selfRatingLabel: {
    fontSize: 13,
    color: '#707C8D',
  },
  goldStarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EF8E0B',
  },
  selfReviewText: {
    fontSize: 13,
    color: '#192232',
    marginTop: 8,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 12,
    paddingHorizontal: 8,
  },
  starBtn: {
    padding: 6,
    borderRadius: 10,
  },
  starBtnFilled: {
    backgroundColor: '#FFF5DF',
  },
  scoreActiveLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EF8E0B',
    textAlign: 'center',
    marginBottom: 14,
  },
  inputSectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#192232',
    marginBottom: 6,
  },
  textArea: {
    backgroundColor: '#F6F7FB',
    borderWidth: 1,
    borderColor: '#E9EDF3',
    borderRadius: 14,
    padding: 12,
    fontSize: 14,
    color: '#192232',
    minHeight: 90,
    textAlignVertical: 'top',
    marginBottom: 14,
  },
  submitEvalBtn: {
    backgroundColor: '#192232',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  submitEvalBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  cancelEditBtn: {
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 6,
  },
  cancelEditBtnText: {
    fontSize: 13,
    color: '#707C8D',
    fontWeight: '600',
  },

  // SAVED EVALUATION
  savedScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 10,
  },
  goldStarBigText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#EF8E0B',
  },
  savedScoreLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#192232',
  },
  savedNoteBox: {
    backgroundColor: '#F6F7FB',
    padding: 12,
    borderRadius: 12,
    marginVertical: 8,
  },
  savedNoteTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#707C8D',
    marginBottom: 4,
  },
  savedNoteContent: {
    fontSize: 13,
    color: '#192232',
    lineHeight: 18,
  },
  reviewerInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  reviewerInfoText: {
    fontSize: 11,
    color: '#707C8D',
  },
  reEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E9EDF3',
    borderRadius: 12,
  },
  reEditBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#345FDF',
  },

  // FOOTER STEP
  footerStepBox: {
    marginTop: 8,
  },
  footerNextBtn: {
    backgroundColor: '#192232',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  footerNextBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  // EMPTY & LOADING
  loadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    color: '#707C8D',
  },
  emptyBox: {
    padding: 30,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E9EDF3',
    marginVertical: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#192232',
    marginTop: 10,
  },
  emptySub: {
    fontSize: 12,
    color: '#707C8D',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 14,
  },
  resetBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#EDF2FF',
  },
  resetBtnText: {
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
