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
  TextInput,
  Alert,
  StatusBar,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '../../components/Screen';
import { ScreenContainer } from '../../components/ScreenContainer';
import * as Clipboard from 'expo-clipboard';
import {
  useDepartmentReports,
  useRejectDailyReport,
  useRejectDailyReportTask,
  useRequestReportRevision,
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
  const rejectReportMutation = useRejectDailyReport(selectedReport?.id || '');
  const rejectTaskMutation = useRejectDailyReportTask(selectedReport?.id || '');

  // Reject & Revision State
  const requestRevisionMutation = useRequestReportRevision();
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectType, setRejectType] = useState<'REPORT' | 'TASK'>('REPORT');
  const [rejectTarget, setRejectTarget] = useState<{ id?: string; title: string; taskId?: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isSubmittingReject, setIsSubmittingReject] = useState(false);

  const [revisionModalVisible, setRevisionModalVisible] = useState(false);
  const [revisionReason, setRevisionReason] = useState('');
  const [isSubmittingRevision, setIsSubmittingRevision] = useState(false);

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

  const handleCopySinglePlan = async (planText: string) => {
    try {
      await Clipboard.setStringAsync(planText);
      Alert.alert(
        'Đã sao chép',
        `Đã sao chép đầu việc:\n"${planText}"\n\nBạn có thể dán nội dung này vào trang Tạo Task để giao việc cho nhân sự.`,
        [
          { text: 'Đóng', style: 'cancel' },
          {
            text: 'Tạo Task ngay',
            onPress: () => {
              const baseRoute = user?.roles?.some((r: any) => r === 'ADMIN' || r?.code === 'admin')
                ? '/admin/tasks/create'
                : '/leader/tasks/create';
              router.push(baseRoute as any);
            },
          },
        ]
      );
    } catch (e) {
      console.warn('Lỗi copy clipboard:', e);
    }
  };

  const handleCopySelectedPlanToTasks = async () => {
    if (selectedPlanItems.length === 0) {
      Alert.alert('Thông báo', 'Vui lòng chọn ít nhất 1 đầu việc kế hoạch để sao chép.');
      return;
    }

    try {
      const textToCopy = selectedPlanItems.join('\n');
      await Clipboard.setStringAsync(textToCopy);
      Alert.alert(
        'Đã sao chép kế hoạch',
        `Đã sao chép ${selectedPlanItems.length} đầu việc vào bộ nhớ tạm.\n\nBạn có thể dán nội dung này vào trang Tạo Task để giao việc cho nhân sự.`,
        [
          { text: 'Đóng', style: 'cancel' },
          {
            text: 'Đi đến Tạo Task',
            onPress: () => {
              const baseRoute = user?.roles?.some((r: any) => r === 'ADMIN' || r?.code === 'admin')
                ? '/admin/tasks/create'
                : '/leader/tasks/create';
              router.push(baseRoute as any);
            },
          },
        ]
      );
    } catch (e) {
      console.warn('Lỗi copy clipboard:', e);
      Alert.alert('Lỗi', 'Không thể sao chép vào bộ nhớ tạm, vui lòng thử lại.');
    }
  };

  const handleOpenRequestRevision = () => {
    if (!selectedReport) return;
    if (selectedReport.status === 'REVIEWED') {
      Alert.alert('Thông báo', 'Báo cáo này đã được Admin / Ban Giám Đốc phê duyệt, không thể yêu cầu làm lại.');
      return;
    }
    setRevisionReason('');
    setRevisionModalVisible(true);
  };

  const handleConfirmRevision = async () => {
    if (!selectedReport) return;
    const reason = revisionReason.trim();
    if (!reason) {
      Alert.alert('Thông báo', 'Vui lòng nhập lý do / lời dặn để nhân sự biết nội dung cần bổ sung.');
      return;
    }
    const targetUserId = selectedReport.userId || selectedUser?.id;
    if (!targetUserId) {
      Alert.alert('Lỗi', 'Không tìm thấy thông tin nhân sự của báo cáo này.');
      return;
    }
    const rawDate = selectedReport.reportDate || dateStr;
    const reportDate = rawDate.split('T')[0] || dateStr;

    setIsSubmittingRevision(true);
    try {
      await requestRevisionMutation.mutateAsync({
        userId: targetUserId,
        reportDate,
        reason,
      });

      setSelectedReport((prev) =>
        prev
          ? {
              ...prev,
              status: 'DRAFT' as any,
              adminReview: `[Yêu cầu làm lại]: ${reason}`,
            }
          : null
      );
      void deptReportsQuery.refetch();
      setRevisionModalVisible(false);
      Alert.alert('Thành công', 'Đã gửi yêu cầu làm lại báo cáo đến nhân sự thành công!');
    } catch (e: any) {
      console.error('Request revision error:', e);
      Alert.alert('Lỗi', e?.response?.data?.message || e?.message || 'Không thể gửi yêu cầu làm lại, vui lòng thử lại.');
    } finally {
      setIsSubmittingRevision(false);
    }
  };

  const renderTaskApprovalBadge = (status?: string) => {
    const norm = (status || 'PENDING').toUpperCase();
    if (norm === 'APPROVED') {
      return (
        <View style={styles.approvalBadgeApproved}>
          <Ionicons name="checkmark-circle" size={11} color="#15803D" />
          <Text style={styles.approvalBadgeApprovedText}>Đã duyệt</Text>
        </View>
      );
    }
    if (norm === 'NEED_MORE_INFO') {
      return (
        <View style={styles.approvalBadgeNeedInfo}>
          <MaterialCommunityIcons name="alert-circle-outline" size={12} color="#B45309" />
          <Text style={styles.approvalBadgeNeedInfoText}>Cần bổ sung</Text>
        </View>
      );
    }
    if (norm === 'REJECTED') {
      return (
        <View style={styles.approvalBadgeRejected}>
          <MaterialCommunityIcons name="close-circle-outline" size={12} color="#DC2626" />
          <Text style={styles.approvalBadgeRejectedText}>Từ chối</Text>
        </View>
      );
    }
    return (
      <View style={styles.approvalBadgePending}>
        <MaterialCommunityIcons name="clock-outline" size={11} color="#B45309" />
        <Text style={styles.approvalBadgePendingText}>Chờ duyệt</Text>
      </View>
    );
  };

  const handleOpenRejectReport = () => {
    if (!selectedReport) return;
    if (selectedReport.status === 'REVIEWED') {
      Alert.alert('Thông báo', 'Báo cáo này đã được Admin / Ban Giám Đốc phê duyệt, không thể từ chối.');
      return;
    }
    if (selectedReport.status === 'REJECTED') {
      Alert.alert('Thông báo', 'Báo cáo này đã được từ chối trước đó rồi, không thể từ chối lại.');
      return;
    }
    setRejectType('REPORT');
    setRejectTarget({
      title: 'Báo cáo ngày ' + new Date(selectedReport.reportDate).toLocaleDateString('vi-VN'),
    });
    setRejectReason('');
    setRejectModalVisible(true);
  };

  const handleOpenRejectTask = (task: { taskId?: string; title: string; approvalStatus?: string }) => {
    if (selectedReport?.status === 'REVIEWED') {
      Alert.alert('Thông báo', 'Báo cáo này đã được Admin / Ban Giám Đốc phê duyệt, không thể từ chối nhiệm vụ con.');
      return;
    }
    if (task.approvalStatus === 'APPROVED') {
      Alert.alert('Thông báo', `Nhiệm vụ "${task.title}" đã được phê duyệt thành công, không thể từ chối.`);
      return;
    }
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
    if (!selectedReport || !selectedReport.id) return;
    const reason = rejectReason.trim();
    if (!reason) {
      Alert.alert('Thông báo', 'Vui lòng nhập lý do từ chối để nhân sự chỉnh sửa lại.');
      return;
    }

    setIsSubmittingReject(true);
    try {
      if (rejectType === 'REPORT') {
        await rejectReportMutation.mutateAsync(reason);
        setSelectedReport((prev) =>
          prev
            ? {
                ...prev,
                status: 'REJECTED',
                adminReview: reason,
              }
            : null
        );
        void deptReportsQuery.refetch();
        setRejectModalVisible(false);
        Alert.alert('Thành công', 'Đã từ chối báo cáo. Nhân sự sẽ nhận được thông báo để chỉnh sửa lại.');
      } else if (rejectType === 'TASK' && rejectTarget) {
        await rejectTaskMutation.mutateAsync({
          taskId: rejectTarget.taskId,
          taskTitle: rejectTarget.title,
          reason,
        });

        setSelectedReport((prev) => {
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

        void deptReportsQuery.refetch();
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
  // DETAIL VIEW: EMPLOYEE REPORT DETAIL (#employee-detail)
  // -------------------------------------------------------------
  if (selectedReport) {
    const memberName = selectedUser?.profile?.fullName || selectedUser?.userCode || 'Phung Binh';
    const userCode = selectedUser?.userCode || 'NV000027';
    const completedTasksCount = selectedReport.completedTasks?.length || 0;
    const inProgressTasksCount = selectedReport.inProgressTasks?.length || 0;
    const plansCount = selectedReport.tomorrowPlan?.length || 0;

    const avatarInitials = (memberName || 'PB')
      .trim()
      .split(/\s+/)
      .map((w: string) => w[0]?.toUpperCase())
      .filter(Boolean)
      .slice(-2)
      .join('') || 'PB';

    const roleName =
      (selectedUser as any)?.profile?.position ||
      (selectedUser as any)?.profile?.jobTitle ||
      (selectedUser as any)?.jobTitle ||
      (selectedUser as any)?.role ||
      'DEV';

    const deptName =
      (selectedUser as any)?.department?.name ||
      (selectedReport as any)?.department?.name ||
      'MOVIELEGEND–HÀ NỘI';

    const rawReportDate = selectedReport.reportDate || dateStr;
    const reportDateObj = new Date(rawReportDate);
    const reportDateFormatted = !isNaN(reportDateObj.getTime())
      ? reportDateObj.toLocaleDateString('vi-VN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })
      : rawReportDate;

    const isRevisionRequested =
      selectedReport.adminReview?.includes('[Yêu cầu làm lại]') ||
      selectedReport.status === 'DRAFT';

    return (
      <View style={{ flex: 1, backgroundColor: '#0F2434' }}>
        <StatusBar barStyle="light-content" backgroundColor="#0F2434" />

        {/* 1. Dark Navy Top Header matching template image */}
        <View style={[styles.darkHeaderWrapper, { paddingTop: Math.max(insets.top, 12) }]}>
          <TouchableOpacity
            style={styles.headerBackBtn}
            onPress={() => setSelectedReport(null)}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="arrow-left" size={20} color="#FFFFFF" />
            <Text style={styles.headerBackText}>Phòng ban</Text>
          </TouchableOpacity>

          <View style={styles.headerProfileRow}>
            <View style={styles.headerAvatarCircle}>
              <Text style={styles.headerAvatarText}>{avatarInitials}</Text>
            </View>
            <View style={styles.headerProfileInfo}>
              <Text style={styles.headerSubCaption}>BÁO CÁO CÔNG VIỆC</Text>
              <Text style={styles.headerMemberName}>{memberName}</Text>
              <Text style={styles.headerMetaLine1}>
                {userCode ? `${userCode} · ` : ''}{roleName}
              </Text>
              <Text style={styles.headerMetaLine2}>
                {deptName} · {reportDateFormatted}
              </Text>
            </View>
          </View>
        </View>

        {/* 2. Scrollable Body */}
        <ScrollView
          style={{ flex: 1, backgroundColor: '#F8FAFC' }}
          contentContainerStyle={{ paddingBottom: Math.max(insets.bottom + 24, 36) }}
          showsVerticalScrollIndicator={false}
        >
          {/* Yellow Warning Card if revision requested */}
          {isRevisionRequested && (
            <View style={styles.revisionWarningCard}>
              <View style={styles.revisionWarningLeft}>
                <View style={styles.revisionWarningIconCircle}>
                  <MaterialCommunityIcons name="exclamation" size={16} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.revisionWarningTitle}>Cần chỉnh sửa báo cáo</Text>
                  <Text style={styles.revisionWarningQuote}>
                    "{selectedReport.adminReview?.replace(/^\[Yêu cầu làm lại\]:?\s*/, '') || 'Bổ sung thêm nhé'}"
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.revisionWarningLinkBtn}
                onPress={handleOpenRequestRevision}
                activeOpacity={0.7}
              >
                <Text style={styles.revisionWarningLinkText}>Chỉnh sửa báo cáo →</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Normal Action Button if report not yet reviewed and not revision requested */}
          {!isRevisionRequested && selectedReport.status !== 'REVIEWED' && selectedReport.status !== 'REJECTED' && (
            <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
              <TouchableOpacity
                style={styles.normalRevisionActionBtn}
                onPress={handleOpenRequestRevision}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="pencil-box-outline" size={16} color="#D97706" />
                <Text style={styles.normalRevisionActionBtnText}>Yêu cầu nhân sự làm lại báo cáo</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* 3-Column Summary Stats Box */}
          <View style={styles.summaryStatsCard}>
            <View style={styles.summaryStatCol}>
              <Text style={styles.summaryStatNum}>{completedTasksCount}</Text>
              <Text style={styles.summaryStatLabel}>Hoàn thành</Text>
            </View>
            <View style={styles.summaryStatDivider} />
            <View style={styles.summaryStatCol}>
              <Text style={styles.summaryStatNum}>{inProgressTasksCount}</Text>
              <Text style={styles.summaryStatLabel}>Đang làm</Text>
            </View>
            <View style={styles.summaryStatDivider} />
            <View style={styles.summaryStatCol}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.summaryStatNum}>{selectedReport.selfRating || 5}/5</Text>
                <MaterialCommunityIcons name="star" size={20} color="#F59E0B" style={{ marginLeft: 3 }} />
              </View>
              <Text style={styles.summaryStatLabel}>Tự đánh giá</Text>
            </View>
          </View>

          {/* 3 Detail Tabs (Segmented control) */}
          <View style={styles.segmentedTabsContainer}>
            <Pressable
              style={[styles.segmentedTabBtn, detailTab === 'results' && styles.segmentedTabBtnActive]}
              onPress={() => setDetailTab('results')}
            >
              <Text style={[styles.segmentedTabBtnText, detailTab === 'results' && styles.segmentedTabBtnTextActive]}>
                Kết quả
              </Text>
            </Pressable>

            <Pressable
              style={[styles.segmentedTabBtn, detailTab === 'plans' && styles.segmentedTabBtnActive]}
              onPress={() => setDetailTab('plans')}
            >
              <Text style={[styles.segmentedTabBtnText, detailTab === 'plans' && styles.segmentedTabBtnTextActive]}>
                Kế hoạch
              </Text>
            </Pressable>

            <Pressable
              style={[styles.segmentedTabBtn, detailTab === 'notes' && styles.segmentedTabBtnActive]}
              onPress={() => setDetailTab('notes')}
            >
              <Text style={[styles.segmentedTabBtnText, detailTab === 'notes' && styles.segmentedTabBtnTextActive]}>
                Nhận xét & tệp
              </Text>
            </Pressable>
          </View>

          {/* TAB 1: KẾT QUẢ */}
          {detailTab === 'results' && (
            <View>
              {/* Section 1: Kết quả định lượng */}
              <View style={styles.templateCard}>
                <Text style={styles.templateCardTitle}>Kết quả định lượng</Text>
                <Text style={styles.templateCardSubtitle}>
                  {selectedReport.metrics && selectedReport.metrics.length > 0
                    ? `${selectedReport.metrics.length} chỉ tiêu · Đã ghi nhận`
                    : '3 chỉ tiêu · Đã ghi nhận'}
                </Text>

                {(!selectedReport.metrics || selectedReport.metrics.length === 0) ? (
                  <Text style={styles.emptyPromptText}>Chưa có số liệu định lượng</Text>
                ) : (
                  selectedReport.metrics.map((m: any, idx: number) => {
                    const isFirst = idx === 0;
                    return (
                      <View key={idx} style={[styles.metricRowItem, !isFirst && styles.rowDivider]}>
                        <View style={{ flex: 1, paddingRight: 8 }}>
                          <Text style={styles.metricItemTitle}>
                            {m.name || m.title || 'Chỉ tiêu công việc'}
                          </Text>
                          <View style={{ marginTop: 4, alignSelf: 'flex-start' }}>
                            {renderTaskApprovalBadge(m.approvalStatus)}
                          </View>
                          {m.approvalStatus === 'NEED_MORE_INFO' && !!m.approvalNote && (
                            <View style={styles.taskNeedInfoTag}>
                              <MaterialCommunityIcons name="alert-circle-outline" size={13} color="#B45309" />
                              <Text style={styles.taskNeedInfoTagText}>Cần bổ sung: {m.approvalNote}</Text>
                            </View>
                          )}
                        </View>
                        <View style={{ justifyContent: 'center' }}>
                          <Text style={styles.metricValueText}>
                            {m.value !== undefined && m.value !== '' ? `${m.value}${m.unit ? ` ${m.unit}` : ''}` : 'Chưa nhập'}
                          </Text>
                        </View>
                      </View>
                    );
                  })
                )}
              </View>

              {/* Section 2: Đang thực hiện (Above Đã hoàn thành) */}
              <View style={styles.templateCard}>
                <View style={styles.templateCardHeaderRow}>
                  <Text style={styles.templateCardTitle}>Đang thực hiện</Text>
                  <Text style={styles.templateCardCountText}>{inProgressTasksCount} việc</Text>
                </View>

                {inProgressTasksCount === 0 ? (
                  <Text style={styles.emptyPromptText}>Không có công việc đang thực hiện</Text>
                ) : (
                  selectedReport.inProgressTasks.map((t: any, idx: number) => {
                    const isFirst = idx === 0;
                    const progressNum =
                      typeof t.progress === 'number'
                        ? t.progress
                        : parseInt(t.progress, 10) || 0;
                    const dueDateStr = t.expectedDate
                      ? new Date(t.expectedDate).toLocaleDateString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })
                      : reportDateFormatted;

                    return (
                      <View key={idx} style={[styles.taskItemBox, !isFirst && styles.boxDivider]}>
                        <Text style={styles.taskItemTitle}>{t.title}</Text>
                        <View style={styles.taskMetaRow}>
                          {renderTaskApprovalBadge(t.approvalStatus)}
                          <View style={styles.taskDueDateRow}>
                            <MaterialCommunityIcons name="calendar-blank-outline" size={13} color="#64748B" />
                            <Text style={styles.taskDueDateText}>Hạn: {dueDateStr}</Text>
                          </View>
                        </View>

                        {t.approvalStatus === 'NEED_MORE_INFO' && !!t.approvalNote && (
                          <View style={styles.taskNeedInfoTag}>
                            <MaterialCommunityIcons name="alert-circle-outline" size={13} color="#B45309" />
                            <Text style={styles.taskNeedInfoTagText}>Cần bổ sung: {t.approvalNote}</Text>
                          </View>
                        )}

                        {/* Progress Bar */}
                        <View style={styles.progressBarRow}>
                          <View style={styles.progressTrack}>
                            <View
                              style={[
                                styles.progressFill,
                                { width: `${Math.min(Math.max(progressNum, 0), 100)}%` },
                              ]}
                            />
                          </View>
                          <Text style={styles.progressPercentText}>{progressNum}%</Text>
                        </View>
                      </View>
                    );
                  })
                )}
              </View>

              {/* Section 3: Đã hoàn thành (Accordion below Đang thực hiện) */}
              <View style={styles.templateCard}>
                <TouchableOpacity
                  style={styles.completedAccordionHeader}
                  onPress={() => setExpandedCompleted(!expandedCompleted)}
                  activeOpacity={0.7}
                >
                  <View style={styles.completedIconCircle}>
                    <MaterialCommunityIcons name="check" size={18} color="#475569" />
                  </View>

                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.completedAccordionTitle}>Đã hoàn thành</Text>
                    <Text style={styles.completedAccordionSub}>
                      {completedTasksCount === 0
                        ? 'Chưa có công việc hoàn thành'
                        : `${completedTasksCount} công việc đã hoàn thành`}
                    </Text>
                  </View>

                  <View style={styles.completedAccordionRight}>
                    <Text style={styles.templateCardCountText}>{completedTasksCount} việc</Text>
                    <MaterialCommunityIcons
                      name={expandedCompleted ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      color="#64748B"
                      style={{ marginLeft: 4 }}
                    />
                  </View>
                </TouchableOpacity>

                {/* Expanded completed tasks list */}
                {expandedCompleted && completedTasksCount > 0 && (
                  <View style={styles.completedTasksList}>
                    {selectedReport.completedTasks.map((t: any, idx: number) => {
                      return (
                        <View key={idx} style={[styles.taskItemBox, styles.boxDivider]}>
                          <Text style={styles.taskItemTitle}>{t.title}</Text>
                          <View style={styles.taskMetaRow}>
                            {renderTaskApprovalBadge(t.approvalStatus || 'APPROVED')}
                            {!!t.note && (
                              <Text style={styles.completedTaskNoteText} numberOfLines={2}>
                                {t.note}
                              </Text>
                            )}
                          </View>
                        </View>
                      );
                    })}
                  </View>
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
                      Không có đầu việc để sao chép.
                    </Text>
                  </View>
                ) : (
                  <>
                    <Text style={[styles.panelCardSubtitle, { marginBottom: 10 }]}>
                      Chọn đầu việc để sao chép tạo Task giao việc:
                    </Text>
                    {selectedReport.tomorrowPlan.map((p, idx) => {
                      const isSelected = selectedPlanItems.includes(p);
                      return (
                        <View key={idx} style={styles.planCheckItem}>
                          <Pressable
                            style={styles.planCheckItemLeft}
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

                          <TouchableOpacity
                            style={styles.quickCopyBtn}
                            onPress={() => handleCopySinglePlan(p)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <MaterialCommunityIcons name="content-copy" size={16} color="#475569" />
                          </TouchableOpacity>
                        </View>
                      );
                    })}

                    <Pressable
                      style={[
                        styles.convertTaskBtn,
                        selectedPlanItems.length === 0 && { opacity: 0.5 },
                      ]}
                      onPress={handleCopySelectedPlanToTasks}
                      disabled={selectedPlanItems.length === 0}
                    >
                      <MaterialCommunityIcons name="content-copy" size={18} color="#FFFFFF" />
                      <Text style={styles.convertTaskBtnText}>
                        Sao chép {selectedPlanItems.length} đầu việc để tạo Task
                      </Text>
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
        </ScrollView>

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

        {/* Revision Request Modal */}
        <Modal
          visible={revisionModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => !isSubmittingRevision && setRevisionModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.revisionModalCard}>
              <View style={styles.revisionModalHeader}>
                <View style={styles.revisionModalIconCircle}>
                  <MaterialCommunityIcons name="pencil-box-outline" size={24} color="#D97706" />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.revisionModalTitle}>Yêu cầu làm lại báo cáo</Text>
                  <Text style={styles.revisionModalSub} numberOfLines={1}>
                    Nhân sự: {selectedUser?.profile?.fullName || selectedUser?.userCode || 'Nhân viên'}
                  </Text>
                </View>
              </View>

              <Text style={styles.revisionModalInputLabel}>Lời dặn / Nội dung cần bổ sung:</Text>
              <TextInput
                style={styles.revisionModalInput}
                multiline
                numberOfLines={4}
                placeholder="Ví dụ: Báo cáo còn thiếu số liệu công việc và hình ảnh minh chứng, vui lòng bổ sung đầy đủ nhé..."
                placeholderTextColor="#94A3B8"
                value={revisionReason}
                onChangeText={setRevisionReason}
                autoFocus
              />

              <View style={styles.revisionModalActions}>
                <TouchableOpacity
                  style={styles.rejectModalCancelBtn}
                  onPress={() => setRevisionModalVisible(false)}
                  disabled={isSubmittingRevision}
                >
                  <Text style={styles.rejectModalCancelText}>Hủy</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.revisionModalConfirmBtn,
                    (!revisionReason.trim() || isSubmittingRevision) && { opacity: 0.5 },
                  ]}
                  onPress={handleConfirmRevision}
                  disabled={!revisionReason.trim() || isSubmittingRevision}
                >
                  {isSubmittingRevision ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.revisionModalConfirmText}>Gửi yêu cầu</Text>
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
          <View style={{
            backgroundColor: '#102739',
            paddingTop: Math.max(insets.top, 16),
            paddingBottom: 20,
            paddingHorizontal: 16,
          }}>
            <StatusBar barStyle="light-content" backgroundColor="#102739" />
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Pressable
                onPress={() => {
                  if (router.canGoBack()) {
                    router.back();
                  } else {
                    setScope('team');
                  }
                }}
                style={{ padding: 4, marginLeft: -4 }}
                hitSlop={10}
              >
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

            <Text style={{ fontSize: 24, fontWeight: '800', color: '#FFFFFF', marginTop: 12 }}>
              {currentStep === 2 ? 'Xem lại báo cáo' : 'Báo cáo cuối ngày'}
            </Text>
            <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 2 }}>
              {currentStep === 2 ? 'Kiểm tra toàn bộ nội dung trước khi nộp.' : 'Báo cáo cá nhân của trưởng phòng.'}
            </Text>
          </View>
        )}
        topContentSlot={
          /* Scope Switcher: [ Phòng ban | Của tôi ] */
          <View style={{
            flexDirection: 'row',
            backgroundColor: '#E2E8F0',
            borderRadius: 14,
            padding: 4,
            marginBottom: 16,
          }}>
            <Pressable
              style={{
                flex: 1,
                alignItems: 'center',
                paddingVertical: 9,
                borderRadius: 10,
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
                paddingVertical: 9,
                borderRadius: 10,
                backgroundColor: '#FFFFFF',
                shadowColor: '#0F172A',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 3,
                elevation: 2,
              }}
              onPress={() => setScope('mine')}
            >
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#0F172A' }}>
                Của tôi
              </Text>
            </Pressable>
          </View>
        }
      />
    );
  }

  // -------------------------------------------------------------
  // SCOPE: 'team' (Tiến độ báo cáo phòng ban - Screen 2)
  // -------------------------------------------------------------
  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <StatusBar barStyle="light-content" backgroundColor="#102739" />

      {/* Screen 2: Deep Navy Banner */}
      <View style={{
        backgroundColor: '#102739',
        paddingTop: Math.max(insets.top, 16),
        paddingBottom: 18,
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
          backgroundColor: '#E2E8F0',
          borderRadius: 14,
          padding: 4,
          marginHorizontal: 16,
          marginTop: 14,
          marginBottom: 12,
        }}>
          <Pressable
            style={{
              flex: 1,
              alignItems: 'center',
              paddingVertical: 9,
              borderRadius: 10,
              backgroundColor: '#FFFFFF',
              shadowColor: '#0F172A',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 3,
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
              paddingVertical: 9,
              borderRadius: 10,
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
                  backgroundColor: '#EFF6FF',
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 6,
                }}
                onPress={handleToday}
              >
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#1D4ED8' }}>Hôm nay</Text>
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
              backgroundColor: activeFilter === 'all' ? '#EFF6FF' : '#FFFFFF',
              borderRadius: 12,
              borderWidth: activeFilter === 'all' ? 2 : 1,
              borderColor: activeFilter === 'all' ? '#102739' : '#E2E8F0',
              paddingVertical: 12,
              paddingHorizontal: 8,
              alignItems: 'center',
            }}
            onPress={() => setActiveFilter('all')}
          >
            <Text style={{ fontSize: 22, fontWeight: '800', color: activeFilter === 'all' ? '#102739' : '#0F172A', marginBottom: 2 }}>
              {stats.total}
            </Text>
            <Text style={{ fontSize: 12, fontWeight: '700', color: activeFilter === 'all' ? '#102739' : '#64748B' }}>
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
            <ActivityIndicator size="small" color="#102739" />
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
                    backgroundColor: '#DBEAFE',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: '#102739' }}>
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
                      color: item.report?.status === 'REJECTED'
                        ? '#DC2626'
                        : item.report?.status === 'REVIEWED'
                        ? '#2563EB'
                        : item.isSubmitted
                        ? '#16A34A'
                        : '#EA580C',
                      marginTop: 2,
                    }}>
                      {item.report?.status === 'REJECTED'
                        ? 'Đã từ chối'
                        : item.report?.status === 'REVIEWED'
                        ? 'Đã duyệt'
                        : item.isSubmitted
                        ? 'Đã nộp'
                        : 'Chưa nộp báo cáo'}
                    </Text>
                  </View>

                  {/* Action link */}
                  {item.isSubmitted ? (
                    <Pressable
                      style={{ paddingVertical: 6, paddingHorizontal: 4 }}
                      onPress={() => handleOpenDetail(item)}
                    >
                      <Text style={{ fontSize: 13, fontWeight: '700', color: '#102739' }}>
                        Xem báo cáo →
                      </Text>
                    </Pressable>
                  ) : isCurrentUser ? (
                    <Pressable
                      style={{ paddingVertical: 6, paddingHorizontal: 4 }}
                      onPress={() => setScope('mine')}
                    >
                      <Text style={{ fontSize: 13, fontWeight: '700', color: '#102739' }}>
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
            backgroundColor: '#102739',
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
  reportRevisionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    backgroundColor: '#FEF3C7',
  },
  reportRevisionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D97706',
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
  badgePillRevision: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FCD34D',
    borderWidth: 1,
  },
  badgePillRevisionText: {
    color: '#B45309',
    fontWeight: '600',
  },
  reportRevisionNoticeCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 10,
    marginTop: 10,
  },
  reportRevisionNoticeTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
    letterSpacing: 0.5,
  },
  reportRevisionNoticeText: {
    fontSize: 13,
    color: '#78350F',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  approvalBadgeApproved: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#DCFCE7',
    borderWidth: 0.5,
    borderColor: '#86EFAC',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  approvalBadgeApprovedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
  approvalBadgeNeedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFE4E6',
    borderWidth: 0.5,
    borderColor: '#FECDD3',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  approvalBadgeNeedInfoText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#BE123C',
  },
  approvalBadgeRejected: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEE2E2',
    borderWidth: 0.5,
    borderColor: '#FCA5A5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  approvalBadgeRejectedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#DC2626',
  },
  approvalBadgePending: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF3C7',
    borderWidth: 0.5,
    borderColor: '#FDE68A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  approvalBadgePendingText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
  },
  taskNeedInfoTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    backgroundColor: '#FFFBEB',
    borderWidth: 0.5,
    borderColor: '#FDE68A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  taskNeedInfoTagText: {
    fontSize: 11,
    color: '#92400E',
    fontWeight: '500',
  },
  revisionModalCard: {
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
  revisionModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  revisionModalIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  revisionModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  revisionModalSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  revisionModalInputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  revisionModalInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    fontSize: 13,
    color: '#0F172A',
    minHeight: 90,
    textAlignVertical: 'top',
  },
  revisionModalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 18,
  },
  revisionModalConfirmBtn: {
    backgroundColor: '#D97706',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
  },
  revisionModalConfirmText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
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
  badgePillPending: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  badgePillPendingText: {
    color: '#92400E',
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#E9EDF3',
  },
  planCheckItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
    paddingRight: 10,
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
  quickCopyBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  convertTaskBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#102739',
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
  darkHeaderWrapper: {
    backgroundColor: '#0F2434',
    paddingTop: 12,
    paddingBottom: 22,
    paddingHorizontal: 16,
  },
  headerBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerBackText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  headerProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatarCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  headerAvatarText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F2434',
  },
  headerProfileInfo: {
    flex: 1,
  },
  headerSubCaption: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.8,
  },
  headerMemberName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  headerMetaLine1: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
    fontWeight: '500',
  },
  headerMetaLine2: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  revisionWarningCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    padding: 14,
    marginHorizontal: 16,
    marginTop: 12,
  },
  revisionWarningLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  revisionWarningIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#D97706',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  revisionWarningTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#78350F',
  },
  revisionWarningQuote: {
    fontSize: 13,
    color: '#92400E',
    fontStyle: 'italic',
    marginTop: 2,
  },
  revisionWarningLinkBtn: {
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  revisionWarningLinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#B45309',
  },
  normalRevisionActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingVertical: 10,
  },
  normalRevisionActionBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#D97706',
  },
  summaryStatsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  summaryStatCol: {
    flex: 1,
    alignItems: 'center',
  },
  summaryStatDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#F1F5F9',
  },
  summaryStatNum: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  summaryStatLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  segmentedTabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#EDF2F7',
    borderRadius: 10,
    padding: 3,
    marginHorizontal: 16,
    marginTop: 14,
  },
  segmentedTabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  segmentedTabBtnActive: {
    backgroundColor: '#102A3D',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentedTabBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  segmentedTabBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  templateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  templateCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  templateCardSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 8,
  },
  templateCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  templateCardCountText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  metricRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  rowDivider: {
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  metricItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  metricValueText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  taskItemBox: {
    paddingVertical: 12,
  },
  boxDivider: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  taskItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  taskMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  taskDueDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  taskDueDateText: {
    fontSize: 12,
    color: '#64748B',
  },
  progressBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#102A3D',
    borderRadius: 3,
  },
  progressPercentText: {
    fontSize: 12,
    color: '#64748B',
    width: 36,
    textAlign: 'right',
  },
  completedAccordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  completedIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedAccordionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  completedAccordionSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  completedAccordionRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  completedTasksList: {
    marginTop: 8,
  },
  completedTaskNoteText: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
  },
});
