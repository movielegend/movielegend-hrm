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
import { StatusBar } from 'expo-status-bar';
import { Screen } from '../../components/Screen';
import { ScreenContainer } from '../../components/ScreenContainer';
import {
  useAdminReports,
  useReviewDailyReport,
  useRejectDailyReport,
  useRejectDailyReportTask,
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
  const router = useRouter();

  // Date selection (default today YYYY-MM-DD)
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr || '');
  const [selectedDeptId, setSelectedDeptId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all'); // all | pending | reviewed | draft
  const [isDeptModalVisible, setIsDeptModalVisible] = useState<boolean>(false);

  // Week days calculation matching Screen 2 template
  const weekDays = useMemo(() => {
    const current = new Date(selectedDate);
    const day = current.getDay(); // 0 is Sunday, 1 is Monday...
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(current);
    monday.setDate(current.getDate() + diffToMonday);

    const days = [];
    const dayLabels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const dateNum = String(d.getDate()).padStart(2, '0');
      days.push({
        label: dayLabels[i],
        dateNum,
        dateStr,
        isToday: dateStr === todayStr,
        isSelected: dateStr === selectedDate,
      });
    }
    return days;
  }, [selectedDate, todayStr]);

  const monthLabel = useMemo(() => {
    const d = new Date(selectedDate);
    return `Tháng ${d.getMonth() + 1}, ${d.getFullYear()}`;
  }, [selectedDate]);

  const handlePrevWeek = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 7);
    setSelectedDate(d.toISOString().split('T')[0] || '');
  };

  const handleNextWeek = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 7);
    setSelectedDate(d.toISOString().split('T')[0] || '');
  };

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
  const rejectReportMutation = useRejectDailyReport(activeReport?.id || '');
  const rejectTaskMutation = useRejectDailyReportTask(activeReport?.id || '');

  // Reject Modal State
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectType, setRejectType] = useState<'REPORT' | 'TASK'>('REPORT');
  const [rejectTarget, setRejectTarget] = useState<{ id?: string; title: string; taskId?: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isSubmittingReject, setIsSubmittingReject] = useState(false);

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

  const handleOpenRejectReport = () => {
    if (!activeReport) return;
    if (activeReport.status === 'REJECTED') {
      Alert.alert('Thông báo', 'Báo cáo này đã được từ chối trước đó rồi, không thể từ chối lại.');
      return;
    }
    setRejectType('REPORT');
    setRejectTarget({
      title: 'Báo cáo ngày ' + new Date(activeReport.reportDate).toLocaleDateString('vi-VN'),
    });
    setRejectReason('');
    setRejectModalVisible(true);
  };

  const handleOpenRejectTask = (task: { taskId?: string; title: string; approvalStatus?: string }) => {
    if (task.approvalStatus === 'REJECTED') {
      Alert.alert('Thông báo', `Nhiệm vụ "${task.title}" đã được từ chối trước đó rồi.`);
      return;
    }
    setRejectType('TASK');
    setRejectTarget(task);
    setRejectReason('');
    setRejectModalVisible(true);
  };

  const handleConfirmReject = async () => {
    if (!activeReport || !activeReport.id) return;
    const reason = rejectReason.trim();
    if (!reason) {
      Alert.alert('Thông báo', 'Vui lòng nhập lý do từ chối để nhân sự chỉnh sửa lại.');
      return;
    }

    setIsSubmittingReject(true);
    try {
      if (rejectType === 'REPORT') {
        await rejectReportMutation.mutateAsync(reason);
        setActiveReport((prev) =>
          prev
            ? {
                ...prev,
                status: 'REJECTED',
                adminReview: reason,
              }
            : null
        );
        void reportsQuery.refetch();
        setRejectModalVisible(false);
        Alert.alert('Thành công', 'Đã từ chối báo cáo. Nhân sự sẽ nhận được thông báo để chỉnh sửa lại.');
      } else if (rejectType === 'TASK' && rejectTarget) {
        await rejectTaskMutation.mutateAsync({
          taskId: rejectTarget.taskId,
          taskTitle: rejectTarget.title,
          reason,
        });

        setActiveReport((prev) => {
          if (!prev) return null;
          const markRejected = (list: any[]) => {
            if (!Array.isArray(list)) return list;
            return list.map((item) => {
              const matchId = rejectTarget.taskId && (item.taskId === rejectTarget.taskId || item.id === rejectTarget.taskId);
              const matchTitle = item.title === rejectTarget.title || item.name === rejectTarget.title;
              if (matchId || matchTitle) {
                return {
                  ...item,
                  approvalStatus: 'REJECTED',
                  approvalNote: reason,
                };
              }
              return item;
            });
          };

          return {
            ...prev,
            metrics: markRejected(prev.metrics as any[]),
            completedTasks: markRejected(prev.completedTasks as any[]),
            inProgressTasks: markRejected(prev.inProgressTasks as any[]),
          };
        });

        void reportsQuery.refetch();
        setRejectModalVisible(false);
        Alert.alert('Thành công', 'Đã từ chối nhiệm vụ: ' + rejectTarget.title);
      }
    } catch (err: any) {
      console.error('Reject error:', err);
      Alert.alert('Lỗi', err?.response?.data?.message || err?.message || 'Không thể thực hiện từ chối');
    } finally {
      setIsSubmittingReject(false);
    }
  };

  // -------------------------------------------------------------
  // RENDER DETAIL VIEW
  // -------------------------------------------------------------
  if (activeReport) {
    const memberName = activeReport.user?.profile?.fullName || activeReport.user?.userCode || 'Nhân sự';
    const deptLine = activeReport.department?.code
      ? `${activeReport.department.code} (MOVIELEGEND-HÀ NỘI)`
      : (activeReport.department?.name ? `${activeReport.department.name} (MOVIELEGEND-HÀ NỘI)` : 'DEV (MOVIELEGEND-HÀ NỘI)');
    const roleName = activeReport.roleType === 'LEADER' ? 'Quản lý' : 'Nhân viên';
    const isReviewed = activeReport.status === 'REVIEWED' || !!activeReport.adminRating;
    const isSubmitted = activeReport.status === 'SUBMITTED';
    const canAdminReject = isSubmitted && !isReviewed && activeReport.status !== 'REJECTED';

    const reportDateFormatted = activeReport.reportDate
      ? new Date(activeReport.reportDate).toLocaleDateString('vi-VN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })
      : new Date().toLocaleDateString('vi-VN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });

    const reviewTimeStr = activeReport.reviewedAt
      ? new Date(activeReport.reviewedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      : '09:07';

    const statusMetaLine = isReviewed
      ? `Đã nộp · Đánh giá lúc ${reviewTimeStr}`
      : isSubmitted
      ? 'Đã nộp · Chờ đánh giá'
      : 'Bản nháp';

    const completedTasks = activeReport.metrics?.length
      ? activeReport.metrics.filter((m: any) => m.status === 'DONE')
      : (activeReport.completedTasks || []);

    const inProgressTasks = activeReport.metrics?.length
      ? activeReport.metrics.filter((m: any) => m.status !== 'DONE' && m.status !== 'REJECTED')
      : (activeReport.inProgressTasks || []);

    const completedCount = completedTasks.length;
    const inProgressCount = inProgressTasks.length;
    const planCount = activeReport.tomorrowPlan?.length || 0;

    const quantitativeMetrics = activeReport.metrics || [];
    const unenteredCount = quantitativeMetrics.filter((m: any) => m.value === undefined || m.value === '').length;

    const managerScoreDisplay = activeReport.adminRating || managerScore || 5;
    const assessmentTitle = ASSESSMENT_LABELS[managerScoreDisplay - 1] || 'Vượt kế hoạch';
    const attachmentCount = activeReport.attachments?.length || 0;

    const handlePreviewFirstAttachment = () => {
      const file = activeReport?.attachments?.[0];
      if (!file) return;
      const isImg = file.fileType === 'IMAGE' || file.url.toLowerCase().match(/\.(jpeg|jpg|gif|png|webp)($|\?)/);
      if (isImg) {
        setPreviewImageUri(file.url);
        setPreviewImageTitle(file.fileName || 'Xem ảnh đính kèm');
      } else {
        setPdfPreviewUrl(file.url);
        setPdfPreviewTitle(file.fileName || 'Xem tài liệu');
      }
    };

    return (
      <View style={styles.screenWrapper}>
        <StatusBar style="light" />
        {/* Navy Hero Banner Top */}
        <View style={[styles.greenBannerContainer, { paddingTop: Math.max(insets.top, 10), paddingBottom: 18 }]}>
          <View style={styles.detailBannerTopNav}>
            <Pressable onPress={() => setActiveReport(null)} style={styles.bannerBackTextBtn} hitSlop={10}>
              <Text style={styles.bannerBackBtnText}>Danh sách báo cáo</Text>
            </Pressable>
            <View style={styles.adminRolePill}>
              <Text style={styles.adminRolePillText}>Admin</Text>
            </View>
          </View>

          <View style={[styles.greenBannerTitleSection, { marginTop: 10 }]}>
            <Text style={styles.greenBannerMainTitle}>Chi tiết báo cáo</Text>
            <Text style={styles.greenBannerSubtitle}>Xem kết quả và đánh giá báo cáo cuối ngày.</Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 14,
            paddingBottom: Math.max(insets.bottom + 24, 36),
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Top Member Card */}
          <View style={styles.detailMemberCard}>
            <View style={styles.cardHeaderFlex}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={styles.cardUserName}>{memberName}</Text>
                <Text style={styles.cardDeptCodeText}>{deptLine}</Text>
                <Text style={styles.cardRoleDateText}>{roleName} · {reportDateFormatted}</Text>
                <Text style={styles.cardStatusMetaText}>{statusMetaLine}</Text>
              </View>

              <View
                style={[
                  styles.badgePill,
                  activeReport.status === 'REJECTED'
                    ? styles.badgePillRejected
                    : isReviewed
                    ? styles.badgePillDone
                    : isSubmitted
                    ? styles.badgePillPending
                    : styles.badgePillDraft,
                ]}
              >
                <Text
                  style={[
                    styles.badgePillText,
                    activeReport.status === 'REJECTED'
                      ? styles.badgePillRejectedText
                      : isReviewed
                      ? styles.badgePillDoneText
                      : isSubmitted
                      ? styles.badgePillPendingText
                      : styles.badgePillDraftText,
                  ]}
                >
                  {activeReport.status === 'REJECTED'
                    ? 'Đã từ chối'
                    : isReviewed
                    ? 'Đã đánh giá'
                    : isSubmitted
                    ? 'Chờ duyệt'
                    : 'Bản nháp'}
                </Text>
              </View>
            </View>

            <View style={styles.detailCardDivider} />

            {/* 3 Stats Row */}
            <View style={styles.statsTriColRow}>
              <View style={styles.statsTriCol}>
                <Text style={styles.statsTriColNum}>{completedCount}</Text>
                <Text style={styles.statsTriColLabel}>Hoàn thành</Text>
              </View>
              <View style={styles.statsTriColDivider} />
              <View style={styles.statsTriCol}>
                <Text style={styles.statsTriColNum}>{inProgressCount}</Text>
                <Text style={styles.statsTriColLabel}>Đang làm</Text>
              </View>
              <View style={styles.statsTriColDivider} />
              <View style={styles.statsTriCol}>
                <Text style={styles.statsTriColNum}>{planCount}</Text>
                <Text style={styles.statsTriColLabel}>Kế hoạch mai</Text>
              </View>
            </View>
          </View>

          {/* 3 Segmented Tabs: Kết quả | Kế hoạch | Đánh giá */}
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
              style={[styles.detailTabBtn, detailTab === 'evaluation' && styles.detailTabBtnActive]}
              onPress={() => setDetailTab('evaluation')}
            >
              <Text style={[styles.detailTabBtnText, detailTab === 'evaluation' && styles.detailTabBtnTextActive]}>
                Đánh giá
              </Text>
            </Pressable>
          </View>

          {/* TAB 1: KẾT QUẢ */}
          {detailTab === 'results' && (
            <View style={{ gap: 14 }}>
              {/* Card 1: Kết quả định lượng */}
              <View style={styles.detailContentCard}>
                <View style={styles.cardHeaderFlex}>
                  <Text style={styles.detailSectionTitle}>Kết quả định lượng</Text>
                  <Text style={styles.detailSectionSubtitleRight}>
                    {unenteredCount > 0
                      ? `${unenteredCount} chỉ tiêu chưa nhập số liệu`
                      : `${quantitativeMetrics.length} chỉ tiêu · Đã nhập`}
                  </Text>
                </View>

                <View style={{ marginTop: 10, gap: 10 }}>
                  {quantitativeMetrics.length === 0 ? (
                    <Text style={styles.emptyPromptText}>Chưa có số liệu định lượng</Text>
                  ) : (
                    quantitativeMetrics.map((m: any, idx: number) => {
                      const isRejected = m.approvalStatus === 'REJECTED';
                      return (
                        <View key={idx} style={styles.detailTaskBox}>
                          <View style={{ flex: 1, paddingRight: 8 }}>
                            <Text style={styles.detailTaskBoxTitle}>{m.name || m.title || `Chỉ tiêu ${idx + 1}`}</Text>
                            <Text style={styles.detailTaskBoxSub}>
                              {m.value !== undefined && m.value !== '' ? `${m.value} ${m.unit || ''}` : 'Chưa nhập số liệu'}
                            </Text>
                            {isRejected && (
                              <Text style={styles.taskRejectedTagText}>Đã từ chối chỉ tiêu</Text>
                            )}
                          </View>
                          {canAdminReject && !isRejected && (
                            <TouchableOpacity
                              style={styles.taskRejectRedOutlineBtn}
                              onPress={() => handleOpenRejectTask({ taskId: m.taskId, title: m.name || m.title })}
                            >
                              <Text style={styles.taskRejectRedOutlineBtnText}>Từ chối chỉ tiêu</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      );
                    })
                  )}
                </View>
              </View>

              {/* Card 2: Đã hoàn thành */}
              <View style={styles.detailContentCard}>
                <View style={styles.cardHeaderFlex}>
                  <Text style={styles.detailSectionTitle}>Đã hoàn thành</Text>
                  <Text style={styles.detailSectionSubtitleRight}>{completedCount} việc</Text>
                </View>

                <View style={{ marginTop: 10, gap: 10 }}>
                  {completedCount === 0 ? (
                    <View style={styles.detailEmptyRoundedBox}>
                      <Text style={styles.detailEmptyRoundedText}>Chưa có công việc hoàn thành</Text>
                    </View>
                  ) : (
                    completedTasks.map((t: any, idx: number) => {
                      const isRejected = t.approvalStatus === 'REJECTED';
                      return (
                        <View key={idx} style={styles.detailTaskBox}>
                          <View style={{ flex: 1, paddingRight: 8 }}>
                            <Text style={styles.detailTaskBoxTitle}>{t.name || t.title}</Text>
                            <Text style={styles.detailTaskBoxGreenStatus}>Hoàn thành</Text>
                            {isRejected && (
                              <Text style={styles.taskRejectedTagText}>Đã từ chối công việc</Text>
                            )}
                          </View>
                          {canAdminReject && !isRejected && (
                            <TouchableOpacity
                              style={styles.taskRejectRedOutlineBtn}
                              onPress={() => handleOpenRejectTask({ taskId: t.taskId, title: t.name || t.title })}
                            >
                              <Text style={styles.taskRejectRedOutlineBtnText}>Từ chối công việc</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      );
                    })
                  )}
                </View>
              </View>

              {/* Card 3: Đang thực hiện */}
              <View style={styles.detailContentCard}>
                <View style={styles.cardHeaderFlex}>
                  <Text style={styles.detailSectionTitle}>Đang thực hiện</Text>
                  <Text style={styles.detailSectionSubtitleRight}>{inProgressCount} việc</Text>
                </View>

                <View style={{ marginTop: 10 }}>
                  {inProgressCount === 0 ? (
                    <View style={styles.detailEmptyRoundedBox}>
                      <Text style={styles.detailEmptyRoundedText}>Không có công việc đang thực hiện</Text>
                    </View>
                  ) : (
                    <View style={{ gap: 10 }}>
                      {inProgressTasks.map((t: any, idx: number) => {
                        const isRejected = t.approvalStatus === 'REJECTED';
                        return (
                          <View key={idx} style={styles.detailTaskBox}>
                            <View style={{ flex: 1, paddingRight: 8 }}>
                              <Text style={styles.detailTaskBoxTitle}>{t.name || t.title}</Text>
                              <Text style={styles.detailTaskBoxSub}>
                                Tiến độ · {t.progress ?? 50}%
                              </Text>
                              {isRejected && (
                                <Text style={styles.taskRejectedTagText}>Đã từ chối</Text>
                              )}
                            </View>
                            {canAdminReject && !isRejected && (
                              <TouchableOpacity
                                style={styles.taskRejectRedOutlineBtn}
                                onPress={() => handleOpenRejectTask({ taskId: t.taskId, title: t.name || t.title })}
                              >
                                <Text style={styles.taskRejectRedOutlineBtnText}>Từ chối công việc</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>
              </View>

              {/* Navigation Button: Tiếp tục Kế hoạch */}
              <TouchableOpacity
                style={styles.detailNavPrimaryBtn}
                onPress={() => setDetailTab('plans')}
                activeOpacity={0.85}
              >
                <Text style={styles.detailNavPrimaryBtnText}>Tiếp tục: Kế hoạch</Text>
              </TouchableOpacity>

              {/* Admin Actions Card - chỉ hiển thị khi có quyền từ chối */}
              {canAdminReject && (
                <View style={styles.adminActionCard}>
                  <Text style={styles.adminActionTitle}>Thao tác admin</Text>
                  <TouchableOpacity
                    style={styles.adminRejectAllBtn}
                    onPress={handleOpenRejectReport}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.adminRejectAllBtnText}>Từ chối toàn bộ báo cáo</Text>
                  </TouchableOpacity>
                  <Text style={styles.adminActionSub}>Nhập lý do và xác nhận trước khi từ chối.</Text>
                </View>
              )}
            </View>
          )}

          {/* TAB 2: KẾ HOẠCH */}
          {detailTab === 'plans' && (
            <View style={{ gap: 14 }}>
              {/* Card 1: Khó khăn & hỗ trợ */}
              <View style={styles.detailContentCard}>
                <Text style={styles.detailSectionTitle}>Khó khăn & đề xuất hỗ trợ</Text>
                {activeReport.obstacles && activeReport.obstacles.trim().length > 0 ? (
                  <View style={styles.calloutAmberBox}>
                    <Text style={styles.calloutAmberBoxText}>{activeReport.obstacles}</Text>
                  </View>
                ) : (
                  <View style={styles.detailEmptyRoundedBox}>
                    <Text style={styles.detailEmptyRoundedText}>Nhân viên báo cáo không có khó khăn hay trở ngại.</Text>
                  </View>
                )}
              </View>

              {/* Card 2: Kế hoạch ngày mai */}
              <View style={styles.detailContentCard}>
                <View style={styles.cardHeaderFlex}>
                  <Text style={styles.detailSectionTitle}>Kế hoạch ngày mai</Text>
                  <Text style={styles.detailSectionSubtitleRight}>{planCount} việc</Text>
                </View>

                {planCount === 0 ? (
                  <View style={styles.detailEmptyRoundedBox}>
                    <Text style={styles.detailEmptyRoundedText}>Chưa có kế hoạch được đề xuất.</Text>
                  </View>
                ) : (
                  <View style={{ gap: 8, marginTop: 10 }}>
                    {activeReport.tomorrowPlan.map((p: string, idx: number) => (
                      <View key={idx} style={styles.detailPlanItemRow}>
                        <Text style={styles.detailPlanItemIndex}>{idx + 1}.</Text>
                        <Text style={styles.detailPlanItemText}>{p}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* Navigation Buttons: Tiếp tục Đánh giá & Quay lại Kết quả */}
              <TouchableOpacity
                style={styles.detailNavPrimaryBtn}
                onPress={() => setDetailTab('evaluation')}
                activeOpacity={0.85}
              >
                <Text style={styles.detailNavPrimaryBtnText}>Tiếp tục: Đánh giá</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.detailOutlineBackBtn}
                onPress={() => setDetailTab('results')}
                activeOpacity={0.85}
              >
                <Text style={styles.detailOutlineBackBtnText}>Quay lại: Kết quả</Text>
              </TouchableOpacity>

              {/* Admin Actions Card - chỉ hiển thị khi có quyền từ chối */}
              {canAdminReject && (
                <View style={styles.adminActionCard}>
                  <Text style={styles.adminActionTitle}>Thao tác admin</Text>
                  <TouchableOpacity
                    style={styles.adminRejectAllBtn}
                    onPress={handleOpenRejectReport}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.adminRejectAllBtnText}>Từ chối toàn bộ báo cáo</Text>
                  </TouchableOpacity>
                  <Text style={styles.adminActionSub}>Nhập lý do và xác nhận trước khi từ chối.</Text>
                </View>
              )}
            </View>
          )}

          {/* TAB 3: ĐÁNH GIÁ */}
          {detailTab === 'evaluation' && (
            <View style={{ gap: 14 }}>
              {/* Card 1: Tự đánh giá của nhân viên */}
              <View style={styles.detailContentCard}>
                <Text style={styles.detailSectionTitle}>Tự đánh giá của nhân viên</Text>
                <View style={styles.selfRatingBetweenRow}>
                  <Text style={styles.selfRatingRowLabel}>Mức độ hoàn thành</Text>
                  <Text style={styles.selfRatingScoreBig}>{activeReport.selfRating || 4}/5</Text>
                </View>

                <Text style={styles.selfReviewDetailText}>
                  Nhận xét: {activeReport.selfReview?.trim() || 'Chưa có'}
                </Text>

                <View style={styles.attachmentLinkRow}>
                  <Text style={styles.selfReviewDetailText}>
                    Tệp đính kèm: {attachmentCount > 0 ? `${attachmentCount} tệp` : 'Chưa có'}
                  </Text>
                  {attachmentCount > 0 && (
                    <TouchableOpacity onPress={handlePreviewFirstAttachment}>
                      <Text style={styles.attachmentViewLink}>Xem tệp</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Card 2: Đánh giá của quản lý */}
              <View style={styles.detailContentCard}>
                <View style={styles.cardHeaderFlex}>
                  <Text style={styles.detailSectionTitle}>Đánh giá của quản lý</Text>
                  {(isReviewed || evalPhase === 'saved') && (
                    <View style={styles.savedPill}>
                      <Text style={styles.savedPillText}>Đã lưu</Text>
                    </View>
                  )}
                </View>

                {/* If in form mode (entering / editing) */}
                {evalPhase === 'form' ? (
                  <View style={{ marginTop: 12 }}>
                    <Text style={styles.inputLabelHeader}>Chọn số sao đánh giá (1-5)</Text>
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

                    <TouchableOpacity
                      style={[styles.detailNavPrimaryBtn, managerScore === 0 && { opacity: 0.5 }]}
                      disabled={managerScore === 0 || reviewMutation.isPending}
                      onPress={handleSaveAndLockEvaluation}
                    >
                      {reviewMutation.isPending ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <Text style={styles.detailNavPrimaryBtnText}>Lưu đánh giá</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                ) : (
                  /* Saved View matching Screenshot 2 */
                  <View style={{ marginTop: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10 }}>
                      <Text style={styles.managerScoreNumberBig}>{managerScoreDisplay}/5</Text>
                      <Text style={styles.managerScoreTitleBig}>{assessmentTitle}</Text>
                    </View>

                    <Text style={[styles.inputLabelHeader, { marginTop: 12, marginBottom: 6 }]}>
                      Nhận xét / Góp ý
                    </Text>

                    <View style={styles.managerCommentBox}>
                      <Text style={styles.managerCommentText}>
                        {activeReport.adminReview || managerNote || 'Đạt kế hoạch đề ra, chất lượng tốt.'}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.detailNavPrimaryBtn}
                      onPress={() => setEvalPhase('form')}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.detailNavPrimaryBtnText}>Chỉnh sửa đánh giá</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Admin Actions Card / Nút điều hướng */}
              {canAdminReject ? (
                <View style={styles.adminActionCard}>
                  <Text style={styles.adminActionTitle}>Thao tác admin</Text>
                  <TouchableOpacity
                    style={styles.adminRejectAllBtn}
                    onPress={handleOpenRejectReport}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.adminRejectAllBtnText}>Từ chối toàn bộ báo cáo</Text>
                  </TouchableOpacity>
                  <Text style={styles.adminActionSub}>Nhập lý do và xác nhận trước khi từ chối.</Text>

                  <TouchableOpacity
                    style={[styles.detailOutlineBackBtn, { marginTop: 14 }]}
                    onPress={() => setDetailTab('plans')}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.detailOutlineBackBtnText}>Quay lại: Kế hoạch</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.detailOutlineBackBtn, { marginTop: 14 }]}
                  onPress={() => setDetailTab('plans')}
                  activeOpacity={0.85}
                >
                  <Text style={styles.detailOutlineBackBtnText}>Quay lại: Kế hoạch</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </ScrollView>

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

        {/* Rejection Reason Modal */}
        <Modal
          visible={rejectModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => !isSubmittingReject && setRejectModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.rejectModalCard}>
              <View style={styles.rejectModalHeader}>
                <View style={styles.rejectModalIconCircle}>
                  <MaterialCommunityIcons name="alert-circle-outline" size={24} color="#EF4444" />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.rejectModalTitle}>
                    {rejectType === 'REPORT' ? 'Từ chối báo cáo ngày' : 'Từ chối nhiệm vụ'}
                  </Text>
                  <Text style={styles.rejectModalSub} numberOfLines={2}>
                    {rejectTarget?.title || 'Báo cáo'}
                  </Text>
                </View>
              </View>

              <Text style={styles.rejectModalInputLabel}>Lý do từ chối (bắt buộc gửi cho nhân sự):</Text>
              <TextInput
                style={styles.rejectModalInput}
                multiline
                numberOfLines={4}
                placeholder="Nhập lý do từ chối để nhân sự biết điểm cần sửa và gửi lại..."
                placeholderTextColor="#94A3B8"
                value={rejectReason}
                onChangeText={setRejectReason}
                autoFocus
              />

              <View style={styles.rejectModalActions}>
                <TouchableOpacity
                  style={styles.rejectModalCancelBtn}
                  onPress={() => setRejectModalVisible(false)}
                  disabled={isSubmittingReject}
                >
                  <Text style={styles.rejectModalCancelText}>Hủy</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.rejectModalConfirmBtn,
                    (!rejectReason.trim() || isSubmittingReject) && { opacity: 0.5 },
                  ]}
                  onPress={handleConfirmReject}
                  disabled={!rejectReason.trim() || isSubmittingReject}
                >
                  {isSubmittingReject ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.rejectModalConfirmText}>Xác nhận từ chối</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // -------------------------------------------------------------
  // RENDER LIST VIEW
  // -------------------------------------------------------------
  return (
    <View style={styles.screenWrapper}>
      <StatusBar style="light" />
      {/* ── Solid Navy Hero Banner (Full-Bleed Header) ── */}
      <View style={[styles.greenBannerContainer, { paddingTop: Math.max(insets.top, 10) }]}>
        <View style={styles.greenBannerTopNav}>
          <Pressable onPress={() => router.back()} style={styles.bannerBackTextBtn} hitSlop={10}>
            <Text style={styles.bannerBackBtnText}>Quay lại</Text>
          </Pressable>
          <Text style={styles.greenBannerLogoText}>MOVIE LEGEND</Text>
          <View style={{ width: 60 }} />
        </View>

        <View style={styles.greenBannerTitleSection}>
          <Text style={styles.greenBannerMainTitle}>Báo cáo cuối ngày</Text>
          <Text style={styles.greenBannerSubtitle}>Theo dõi kết quả. Phản hồi kịp thời.</Text>
        </View>

        {/* Month Selector Row */}
        <View style={styles.calendarNavRow}>
          <Pressable onPress={handlePrevWeek} hitSlop={10} style={styles.calendarNavTextBtn}>
            <Text style={styles.calendarNavActionText}>Trước</Text>
          </Pressable>
          <Text style={styles.calendarMonthText}>{monthLabel}</Text>
          <Pressable onPress={handleNextWeek} hitSlop={10} style={styles.calendarNavTextBtn}>
            <Text style={styles.calendarNavActionText}>Sau</Text>
          </Pressable>
        </View>

        {/* 7 Days of the Week */}
        <View style={styles.weekDaysRow}>
          {weekDays.map((dayItem) => {
            const active = dayItem.isSelected;
            return (
              <Pressable
                key={dayItem.dateStr}
                style={[styles.weekDayPill, active && styles.weekDayPillActive]}
                onPress={() => dayItem.dateStr && setSelectedDate(dayItem.dateStr)}
              >
                <Text style={[styles.weekDayLabel, active && styles.weekDayLabelActive]}>
                  {dayItem.label}
                </Text>
                <Text style={[styles.weekDayNum, active && styles.weekDayNumActive]}>
                  {dayItem.dateNum}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <ScreenContainer style={{ paddingTop: 14, paddingBottom: Math.max(insets.bottom + 16, 24) }}>
        {/* Department Select Dropdown Card */}
        <View style={styles.deptCardWrapper}>
          <Pressable
            style={styles.templateDeptSelectCard}
            onPress={() => setIsDeptModalVisible(true)}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.deptLabelTop}>Phòng ban</Text>
              <Text style={styles.deptSelectText} numberOfLines={1}>
                {selectedDeptName}
              </Text>
            </View>
            <Text style={styles.deptChangeLinkText}>Thay đổi</Text>
          </Pressable>
        </View>

        {/* 4 Metric Underline Tabs */}
        <View style={styles.metricUnderlineTabBar}>
          <Pressable
            style={styles.metricUnderlineTab}
            onPress={() => setStatusFilter('all')}
          >
            <Text style={[styles.metricTabCount, statusFilter === 'all' && styles.metricTabCountActive]}>
              {stats.total}
            </Text>
            <Text style={[styles.metricTabLabel, statusFilter === 'all' && styles.metricTabLabelActive]}>
              Tất cả
            </Text>
            {statusFilter === 'all' && <View style={styles.metricTabActiveUnderline} />}
          </Pressable>

          <Pressable
            style={styles.metricUnderlineTab}
            onPress={() => setStatusFilter('pending')}
          >
            <Text style={[styles.metricTabCount, statusFilter === 'pending' && styles.metricTabCountActive]}>
              {stats.pending}
            </Text>
            <Text style={[styles.metricTabLabel, statusFilter === 'pending' && styles.metricTabLabelActive]}>
              Chờ duyệt
            </Text>
            {statusFilter === 'pending' && <View style={styles.metricTabActiveUnderline} />}
          </Pressable>

          <Pressable
            style={styles.metricUnderlineTab}
            onPress={() => setStatusFilter('reviewed')}
          >
            <Text style={[styles.metricTabCount, statusFilter === 'reviewed' && styles.metricTabCountActive]}>
              {stats.reviewed}
            </Text>
            <Text style={[styles.metricTabLabel, statusFilter === 'reviewed' && styles.metricTabLabelActive]}>
              Đã đánh giá
            </Text>
            {statusFilter === 'reviewed' && <View style={styles.metricTabActiveUnderline} />}
          </Pressable>

          <Pressable
            style={styles.metricUnderlineTab}
            onPress={() => setStatusFilter('draft')}
          >
            <Text style={[styles.metricTabCount, statusFilter === 'draft' && styles.metricTabCountActive]}>
              {stats.draft}
            </Text>
            <Text style={[styles.metricTabLabel, statusFilter === 'draft' && styles.metricTabLabelActive]}>
              Bản nháp
            </Text>
            {statusFilter === 'draft' && <View style={styles.metricTabActiveUnderline} />}
          </Pressable>
        </View>

        {/* Reports List Header Title */}
        <View style={styles.listHeaderRow}>
          <Text style={styles.listHeaderTitleText}>Danh sách báo cáo</Text>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.listHeaderCountText}>{reports.length} báo cáo</Text>
            <Text style={styles.listHeaderDateText}>
              {new Date(selectedDate).toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              })}
            </Text>
          </View>
        </View>

        {/* Report Cards List */}
        {reportsQuery.isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#102739" />
            <Text style={styles.loadingPromptText}>Đang tải danh sách báo cáo...</Text>
          </View>
        ) : reports.length === 0 ? (
          <View style={styles.templateEmptyContainer}>
            <View style={styles.templateEmptyIconCircle}>
              <MaterialCommunityIcons name="file-document-outline" size={38} color="#102739" />
              <View style={styles.templateMagnifyIconBadge}>
                <Ionicons name="search" size={14} color="#102739" />
              </View>
            </View>
            <Text style={styles.templateEmptyTitle}>Chưa có báo cáo phù hợp</Text>
            <Text style={styles.templateEmptySubtitle}>
              Thử đổi ngày, phòng ban hoặc trạng thái.
            </Text>
            <Pressable style={styles.templateResetBtn} onPress={handleResetFilters}>
              <Ionicons name="reload" size={16} color="#102739" />
              <Text style={styles.templateResetBtnText}>Đặt lại bộ lọc</Text>
            </Pressable>
          </View>
        ) : (
          <View style={{ gap: 14 }}>
            {reports.map((report) => {
              const isReviewed = report.status === 'REVIEWED';
              const isSubmitted = report.status === 'SUBMITTED';
              const memberName = report.user?.profile?.fullName || report.user?.userCode || 'Nhân sự';
              const deptLine = report.department?.code
                ? `${report.department.code} (MOVIELEGEND-HÀ NỘI)`
                : (report.department?.name ? `${report.department.name} (MOVIELEGEND-HÀ NỘI)` : 'DEV (MOVIELEGEND-HÀ NỘI)');

              const reportDateFormatted = report.reportDate
                ? new Date(report.reportDate).toLocaleDateString('vi-VN', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })
                : new Date(selectedDate).toLocaleDateString('vi-VN', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  });

              const completedTasksCount = report.metrics?.length
                ? report.metrics.filter((m: any) => m.status === 'DONE').length
                : (report.completedTasks?.length || 0);

              const inProgressTasksCount = report.metrics?.length
                ? report.metrics.filter((m: any) => m.status !== 'DONE').length
                : (report.inProgressTasks?.length || 0);

              const plansCount = report.tomorrowPlan?.length || 0;

              return (
                <View
                  key={report.id || Math.random().toString()}
                  style={styles.templateReportCard}
                >
                  {/* Card Header Row */}
                  <View style={styles.cardHeaderFlex}>
                    <View style={{ flex: 1, paddingRight: 10 }}>
                      <Text style={styles.cardUserName}>{memberName}</Text>
                      <Text style={styles.cardDeptCodeText}>{deptLine}</Text>
                      <Text style={styles.cardDateText}>{reportDateFormatted}</Text>
                    </View>

                    <View
                      style={[
                        styles.badgePill,
                        report.status === 'REJECTED'
                          ? styles.badgePillRejected
                          : isReviewed
                          ? styles.badgePillDone
                          : isSubmitted
                          ? styles.badgePillPending
                          : styles.badgePillDraft,
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgePillText,
                          report.status === 'REJECTED'
                            ? styles.badgePillRejectedText
                            : isReviewed
                            ? styles.badgePillDoneText
                            : isSubmitted
                            ? styles.badgePillPendingText
                            : styles.badgePillDraftText,
                        ]}
                      >
                        {report.status === 'REJECTED'
                          ? 'Đã từ chối'
                          : isReviewed
                          ? 'Đã đánh giá'
                          : isSubmitted
                          ? 'Chờ duyệt'
                          : 'Bản nháp'}
                      </Text>
                    </View>
                  </View>

                  {/* 2 Evaluation Boxes Side-by-side */}
                  <View style={styles.evalScoreBoxesRow}>
                    {/* Box 1: Tự đánh giá */}
                    <View style={styles.selfScoreBox}>
                      <Text style={styles.selfScoreBoxLabel}>Tự đánh giá</Text>
                      <Text style={styles.selfScoreBoxValue}>
                        {report.selfRating ? `${report.selfRating}/5` : '4/5'}
                      </Text>
                    </View>

                    {/* Box 2: Quản lý */}
                    <View style={styles.managerScoreBox}>
                      <Text style={styles.managerScoreBoxLabel}>Quản lý</Text>
                      <Text style={styles.managerScoreBoxValue}>
                        {report.adminRating ? `${report.adminRating}/5` : isReviewed ? '5/5' : '-'}
                      </Text>
                    </View>
                  </View>

                  {/* 3 Metrics Stats Row */}
                  <View style={styles.statsTriColRow}>
                    <View style={styles.statsTriCol}>
                      <Text style={styles.statsTriColNum}>{completedTasksCount}</Text>
                      <Text style={styles.statsTriColLabel}>Hoàn thành</Text>
                    </View>
                    <View style={styles.statsTriColDivider} />
                    <View style={styles.statsTriCol}>
                      <Text style={styles.statsTriColNum}>{inProgressTasksCount}</Text>
                      <Text style={styles.statsTriColLabel}>Đang làm</Text>
                    </View>
                    <View style={styles.statsTriColDivider} />
                    <View style={styles.statsTriCol}>
                      <Text style={styles.statsTriColNum}>{plansCount}</Text>
                      <Text style={styles.statsTriColLabel}>Kế hoạch</Text>
                    </View>
                  </View>

                  {/* Solid Button: Xem chi tiết */}
                  <TouchableOpacity
                    style={styles.cardViewDetailBtn}
                    onPress={() => setActiveReport(report)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.cardViewDetailBtnText}>Xem chi tiết</Text>
                  </TouchableOpacity>
                </View>
              );
            })}

            {/* Footer Note */}
            <Text style={styles.listFooterNote}>Đã hiển thị toàn bộ báo cáo</Text>
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
    </View>
  );
}

// -------------------------------------------------------------
// STYLES
// -------------------------------------------------------------
const styles = StyleSheet.create({
  taskRejectedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  taskRejectedTagText: {
    fontSize: 11,
    color: '#EF4444',
    fontWeight: '500',
  },
  taskRejectSmallBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
    marginTop: 4,
  },
  taskRejectSmallBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#DC2626',
  },
  simpleListItemWithAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  reportRejectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FFF1F2',
  },
  reportRejectBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
  },
  reportRejectBtnLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F87171',
    backgroundColor: '#FEF2F2',
  },
  reportRejectBtnLargeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
  },
  badgePillRejected: {
    backgroundColor: '#FEE2E2',
    borderColor: '#F87171',
    borderWidth: 1,
  },
  badgePillRejectedText: {
    color: '#B91C1C',
    fontWeight: '600',
  },
  reportRejectedNoticeCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: 10,
    marginTop: 10,
  },
  reportRejectedNoticeTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B91C1C',
    letterSpacing: 0.5,
  },
  reportRejectedNoticeText: {
    fontSize: 13,
    color: '#991B1B',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  rejectModalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  rejectModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  rejectModalIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  rejectModalSub: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  rejectModalInputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  rejectModalInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
    minHeight: 90,
    textAlignVertical: 'top',
  },
  rejectModalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 16,
  },
  rejectModalCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  rejectModalCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  rejectModalConfirmBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#DC2626',
    minWidth: 130,
    alignItems: 'center',
  },
  rejectModalConfirmText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },

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
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgePillPending: {
    backgroundColor: '#FEF3C7',
  },
  badgePillPendingText: {
    color: '#B45309',
    fontSize: 12,
    fontWeight: '600',
  },
  badgePillDone: {
    backgroundColor: '#DCFCE7',
  },
  badgePillDoneText: {
    color: '#15803D',
    fontSize: 12,
    fontWeight: '600',
  },
  badgePillDraft: {
    backgroundColor: '#F1F5F9',
  },
  badgePillDraftText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
  },
  badgePillText: {
    fontSize: 12,
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

  screenWrapper: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },

  /* Green Hero Banner & Calendar (Screen 2) */
  greenBannerContainer: {
    backgroundColor: '#102739',
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  greenBannerTopNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  greenBannerBackBtn: {
    width: 36,
    height: 36,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  greenBannerLogoText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  greenBannerTitleSection: {
    marginBottom: 10,
  },
  greenBannerMainTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  greenBannerSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  calendarNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  calendarNavTextBtn: {
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  calendarNavActionText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 14,
    fontWeight: '600',
  },
  calendarNavArrow: {
    padding: 4,
  },
  calendarMonthText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bannerBackTextBtn: {
    paddingVertical: 4,
  },
  bannerBackBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  weekDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  weekDayPill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 12,
  },
  weekDayPillActive: {
    backgroundColor: '#FFFFFF',
  },
  weekDayLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.75)',
    marginBottom: 4,
  },
  weekDayLabelActive: {
    color: '#334155',
  },
  weekDayNum: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  weekDayNumActive: {
    color: '#102739',
    fontWeight: '800',
  },

  /* Department Dropdown Card */
  deptCardWrapper: {
    marginBottom: 14,
  },
  templateDeptSelectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  deptLabelTop: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 3,
    fontWeight: '500',
  },
  deptChangeLinkText: {
    fontSize: 13,
    color: '#2563EB',
    fontWeight: '600',
  },
  deptSelectLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginRight: 8,
  },
  deptSelectText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#102739',
  },

  /* Card styling matching mockup */
  templateReportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 12,
  },
  cardDeptCodeText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '600',
  },
  cardDateText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  evalScoreBoxesRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  selfScoreBox: {
    flex: 1,
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selfScoreBoxLabel: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '500',
    marginBottom: 2,
  },
  selfScoreBoxValue: {
    fontSize: 26,
    fontWeight: '800',
    color: '#B45309',
  },
  managerScoreBox: {
    flex: 1,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  managerScoreBoxLabel: {
    fontSize: 12,
    color: '#166534',
    fontWeight: '500',
    marginBottom: 2,
  },
  managerScoreBoxValue: {
    fontSize: 26,
    fontWeight: '800',
    color: '#15803D',
  },
  statsTriColRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  statsTriCol: {
    flex: 1,
    alignItems: 'center',
  },
  statsTriColNum: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  statsTriColLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  statsTriColDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#F1F5F9',
  },
  cardViewDetailBtn: {
    backgroundColor: '#102739',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  cardViewDetailBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  listFooterNote: {
    textAlign: 'center',
    fontSize: 13,
    color: '#64748B',
    marginTop: 16,
    marginBottom: 8,
  },

  /* 4 Metric Underline Tabs */
  metricUnderlineTabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginBottom: 16,
  },
  metricUnderlineTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    position: 'relative',
  },
  metricTabCount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 2,
  },
  metricTabCountActive: {
    color: '#102739',
  },
  metricTabLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  metricTabLabelActive: {
    color: '#102739',
    fontWeight: '700',
  },
  metricTabActiveUnderline: {
    position: 'absolute',
    bottom: -1,
    left: 8,
    right: 8,
    height: 3,
    backgroundColor: '#102739',
    borderRadius: 2,
  },

  listHeaderDateText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },

  /* Empty State matching Screen 2 */
  templateEmptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    paddingHorizontal: 24,
  },
  templateEmptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E7F0F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  templateMagnifyIconBadge: {
    position: 'absolute',
    bottom: 22,
    right: 22,
  },
  templateEmptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#102739',
    marginBottom: 6,
    textAlign: 'center',
  },
  templateEmptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 18,
  },
  templateResetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E7F0F7',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  templateResetBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#102739',
  },

  /* Detail View Styles matching screenshots */
  detailBannerTopNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  adminRolePill: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  adminRolePillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  detailMemberCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 4,
  },
  cardRoleDateText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  cardStatusMetaText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 3,
  },
  detailCardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 14,
  },
  detailTabsBar: {
    flexDirection: 'row',
    backgroundColor: '#EDF2F7',
    borderRadius: 10,
    padding: 4,
    marginVertical: 14,
  },
  detailTabBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 9,
    borderRadius: 8,
  },
  detailTabBtnActive: {
    backgroundColor: '#102739',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  detailTabBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  detailTabBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  detailContentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  detailSectionSubtitleRight: {
    fontSize: 12,
    color: '#64748B',
  },
  detailTaskBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
  },
  detailTaskBoxTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  detailTaskBoxSub: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  detailTaskBoxGreenStatus: {
    fontSize: 13,
    color: '#16A34A',
    fontWeight: '600',
    marginTop: 2,
  },
  taskRejectRedOutlineBtn: {
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  taskRejectRedOutlineBtnText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '600',
  },
  detailEmptyRoundedBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailEmptyRoundedText: {
    fontSize: 13,
    color: '#64748B',
  },
  detailNavPrimaryBtn: {
    backgroundColor: '#102739',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  detailNavPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  detailOutlineBackBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#102739',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  detailOutlineBackBtnText: {
    color: '#102739',
    fontSize: 14,
    fontWeight: '700',
  },
  adminActionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginTop: 14,
  },
  adminActionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 10,
  },
  adminRejectAllBtn: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminRejectAllBtnText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '700',
  },
  adminActionSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 6,
  },
  detailPlanItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 4,
  },
  detailPlanItemIndex: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginRight: 6,
  },
  detailPlanItemText: {
    fontSize: 14,
    color: '#0F172A',
    flex: 1,
    lineHeight: 20,
  },
  selfRatingRowLabel: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '500',
  },
  selfRatingScoreBig: {
    fontSize: 24,
    fontWeight: '800',
    color: '#B45309',
  },
  attachmentLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  attachmentViewLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  savedPill: {
    backgroundColor: '#DCFCE7',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  savedPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#15803D',
  },
  managerScoreNumberBig: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0F172A',
  },
  managerScoreTitleBig: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  managerCommentBox: {
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 12,
    marginTop: 4,
    marginBottom: 4,
  },
  managerCommentText: {
    fontSize: 13,
    color: '#0F172A',
    lineHeight: 19,
  },
});
