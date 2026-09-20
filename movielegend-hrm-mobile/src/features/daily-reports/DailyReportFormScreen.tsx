import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Switch,
  Platform,
  Image,
  Modal,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as Linking from 'expo-linking';
import { Screen } from '../../components/Screen';
import { ScreenContainer } from '../../components/ScreenContainer';
import { PageHeader } from '../../components/PageHeader';
import { PdfViewerModal } from '../../components/PdfViewerModal';
import { useAuth } from '../../providers/AuthProvider';
import {
  useMyTodayReport,
  useSaveDailyReport,
  useMyReportHistory,
} from '../../hooks/useDailyReports';
import { uploadFile } from '../../api/uploads.api';
import type {
  DailyReport,
  DailyReportMetricItem,
  DailyReportTaskItem,
  DailyReportAttachmentItem,
} from '../../api/daily-reports.api';
import { colors } from '../../theme/colors';

// 5 mức tự đánh giá theo template
const ASSESSMENT_LEVELS = [
  {
    level: 1,
    title: 'Chưa hoàn thành',
    desc: 'Chưa hoàn tất đầu việc chính đã đặt ra cho hôm nay.',
  },
  {
    level: 2,
    title: 'Hoàn thành một phần',
    desc: 'Đã hoàn tất một phần công việc; còn nhiều đầu việc trong kế hoạch.',
  },
  {
    level: 3,
    title: 'Gần đạt kế hoạch',
    desc: 'Đã hoàn tất phần lớn công việc; còn một số đầu việc cần tiếp tục.',
  },
  {
    level: 4,
    title: 'Đạt kế hoạch',
    desc: 'Đã hoàn tất các đầu việc theo kế hoạch, đáp ứng yêu cầu và thời hạn.',
  },
  {
    level: 5,
    title: 'Vượt kế hoạch',
    desc: 'Đã đạt kế hoạch và có thêm kết quả ngoài mục tiêu đã đặt ra.',
  },
];

export interface DailyReportFormScreenProps {
  headerSlot?: React.ReactNode;
  hideHeaderTitle?: boolean;
}

export function DailyReportFormScreen({ headerSlot, hideHeaderTitle }: DailyReportFormScreenProps = {}) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();

  const todayReportQuery = useMyTodayReport();
  const saveReportMutation = useSaveDailyReport();
  const historyQuery = useMyReportHistory(1, 50);

  // Top mode: 'write' (Viết báo cáo hôm nay) | 'approved' (Báo cáo đã duyệt)
  const [activeTab, setActiveTab] = useState<'write' | 'approved'>('write');

  // Active step in write mode: 0 = Hôm nay, 1 = Ngày mai, 2 = Xem lại
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isInitializing, setIsInitializing] = useState(true);
  const [noticeText, setNoticeText] = useState<string>('Dữ liệu sẵn sàng');

  // Preview modals state
  const [previewImageUri, setPreviewImageUri] = useState<string | null>(null);
  const [previewImageTitle, setPreviewImageTitle] = useState<string>('Xem ảnh đính kèm');
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [pdfPreviewTitle, setPdfPreviewTitle] = useState<string>('Xem tài liệu');

  // Detailed view of an approved report
  const [selectedApprovedReport, setSelectedApprovedReport] = useState<DailyReport | null>(null);

  // STEP 1: HÔM NAY
  const [metrics, setMetrics] = useState<DailyReportMetricItem[]>([
    { name: 'Khách hàng mới / Tư vấn', value: '', unit: 'Khách', note: '' },
    { name: 'Đơn hàng thành công', value: '', unit: 'Đơn', note: '' },
    { name: 'Doanh số hôm nay', value: '', unit: 'VND', note: '' },
  ]);
  const [completedTasks, setCompletedTasks] = useState<DailyReportTaskItem[]>([]);
  const [inProgressTasks, setInProgressTasks] = useState<DailyReportTaskItem[]>([]);

  // STEP 2: NGÀY MAI & ĐÁNH GIÁ
  const [tomorrowPlan, setTomorrowPlan] = useState<string[]>(['']);
  const [hasObstacles, setHasObstacles] = useState<boolean>(false);
  const [obstacleText, setObstacleText] = useState<string>('');
  const [supportWish, setSupportWish] = useState<string>('');
  const [selfRating, setSelfRating] = useState<number>(5);
  const [selfReview, setSelfReview] = useState<string>('');
  const [attachments, setAttachments] = useState<DailyReportAttachmentItem[]>([]);
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  // STEP 3: XÁC NHẬN
  const [isConfirmed, setIsConfirmed] = useState<boolean>(false);

  const reportData = todayReportQuery.data;
  const isSubmittedToday = reportData?.status === 'SUBMITTED' || reportData?.status === 'REVIEWED';
  const isReviewedToday = reportData?.status === 'REVIEWED';

  // Lấy danh sách các báo cáo đã duyệt
  const approvedReports = useMemo(() => {
    const all = historyQuery.data?.items || [];
    return all.filter((r) => r.status === 'REVIEWED');
  }, [historyQuery.data]);

  // Khởi tạo từ Server / Auto-pull
  useEffect(() => {
    if (reportData) {
      if (reportData.metrics && reportData.metrics.length > 0) {
        setMetrics(reportData.metrics);
      }
      if (reportData.completedTasks && reportData.completedTasks.length > 0) {
        setCompletedTasks(
          reportData.completedTasks.map((t) => ({
            ...t,
            isSelected: t.isSelected ?? true,
          }))
        );
      }
      if (reportData.inProgressTasks && reportData.inProgressTasks.length > 0) {
        setInProgressTasks(
          reportData.inProgressTasks.map((t) => ({
            ...t,
            progress: t.progress ?? 60,
            expectedDate: t.expectedDate || 'Ngày mai',
          }))
        );
      }
      if (reportData.obstacles) {
        setHasObstacles(true);
        setObstacleText(reportData.obstacles);
      }
      if (reportData.tomorrowPlan && reportData.tomorrowPlan.length > 0) {
        setTomorrowPlan(reportData.tomorrowPlan);
      }
      if (reportData.attachments) {
        setAttachments(reportData.attachments);
      }
      if (reportData.selfRating) {
        setSelfRating(reportData.selfRating);
      }
      if (reportData.selfReview) {
        setSelfReview(reportData.selfReview);
      }
      setIsInitializing(false);
    }
  }, [reportData]);

  // Format ngày tiếng Việt
  const displayDate = useMemo(() => {
    const d = new Date();
    const dayNames = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
    const dayName = dayNames[d.getDay()];
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dayName}, ${dd}/${mm}/${yyyy}`;
  }, []);

  const employeeName = reportData?.user?.profile?.fullName || user?.fullName || user?.userCode || 'Nhân sự';
  const departmentName = reportData?.department?.name || (user as any)?.department?.name || 'Phòng ban';
  const roleName = user?.roles?.some((r: any) => r === 'LEADER' || r.name?.toUpperCase().includes('LEADER') || r.role?.code === 'leader')
    ? 'Trưởng phòng'
    : 'Nhân viên';

  // Initials for Avatar
  const avatarInitials = useMemo(() => {
    const parts = employeeName.trim().split(' ').filter(Boolean);
    if (parts.length >= 2) {
      const first = parts[0] || '';
      const last = parts[parts.length - 1] || '';
      return `${first[0] || ''}${last[0] || ''}`.toUpperCase();
    }
    return employeeName.substring(0, 2).toUpperCase();
  }, [employeeName]);

  // --- ACTIONS CHO CHỈ TIÊU ĐỊNH LƯỢNG ---
  const handleAddMetric = () => {
    if (isSubmittedToday) return;
    setMetrics((prev) => [...prev, { name: '', value: '', unit: '', note: '' }]);
  };
  const handleUpdateMetric = (index: number, field: keyof DailyReportMetricItem, val: string) => {
    if (isSubmittedToday) return;
    setMetrics((prev) => {
      const next = [...prev];
      const item = next[index] || { name: '' };
      next[index] = { ...item, [field]: val };
      return next;
    });
  };
  const handleDeleteMetric = (index: number) => {
    if (isSubmittedToday) return;
    setMetrics((prev) => prev.filter((_, i) => i !== index));
  };

  // --- ACTIONS CHO VIỆC HOÀN THÀNH ---
  const handleToggleTask = (index: number) => {
    if (isSubmittedToday) return;
    setCompletedTasks((prev) => {
      const next = [...prev];
      if (next[index]) {
        next[index] = { ...next[index], isSelected: !(next[index].isSelected ?? true) };
      }
      return next;
    });
  };
  const handleAddManualCompletedTask = () => {
    if (isSubmittedToday) return;
    setCompletedTasks((prev) => [
      ...prev,
      { title: '', status: 'COMPLETED', isManual: true, isSelected: true },
    ]);
  };
  const handleUpdateCompletedTask = (index: number, val: string) => {
    if (isSubmittedToday) return;
    setCompletedTasks((prev) => {
      const next = [...prev];
      if (next[index]) {
        next[index] = { ...next[index], title: val };
      }
      return next;
    });
  };
  const handleDeleteCompletedTask = (index: number) => {
    if (isSubmittedToday) return;
    setCompletedTasks((prev) => prev.filter((_, i) => i !== index));
  };

  // --- ACTIONS CHO VIỆC ĐANG LÀM ---
  const handleAddInProgressTask = () => {
    if (isSubmittedToday) return;
    setInProgressTasks((prev) => [
      ...prev,
      { title: '', status: 'IN_PROGRESS', isManual: true, progress: 50, expectedDate: 'Ngày mai' },
    ]);
  };
  const handleUpdateInProgressTask = (index: number, field: keyof DailyReportTaskItem, val: any) => {
    if (isSubmittedToday) return;
    setInProgressTasks((prev) => {
      const next = [...prev];
      if (next[index]) {
        next[index] = { ...next[index], [field]: val };
      }
      return next;
    });
  };
  const handleDeleteInProgressTask = (index: number) => {
    if (isSubmittedToday) return;
    setInProgressTasks((prev) => prev.filter((_, i) => i !== index));
  };

  // --- ACTIONS CHO KẾ HOẠCH NGÀY MAI ---
  const handleAddPlanItem = () => {
    if (isSubmittedToday) return;
    setTomorrowPlan((prev) => [...prev, '']);
  };
  const handleUpdatePlanItem = (index: number, val: string) => {
    if (isSubmittedToday) return;
    setTomorrowPlan((prev) => {
      const next = [...prev];
      next[index] = val;
      return next;
    });
  };
  const handleDeletePlanItem = (index: number) => {
    if (isSubmittedToday) return;
    setTomorrowPlan((prev) => prev.filter((_, i) => i !== index));
  };

  // --- UPLOAD ĐÍNH KÈM ---
  const handlePickImage = async () => {
    if (isSubmittedToday) return;
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Quyền truy cập', 'Cần cấp quyền truy cập thư viện ảnh để đính kèm');
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });
      if (res.canceled || !res.assets || res.assets.length === 0) return;
      const asset = res.assets[0];
      if (!asset) return;
      setIsUploadingFile(true);
      const uploaded = await uploadFile({
        uri: asset.uri,
        name: asset.fileName || `anh_${Date.now()}.jpg`,
        type: asset.mimeType || 'image/jpeg',
      });
      setAttachments((prev) => [
        ...prev,
        {
          url: uploaded.url,
          fileName: uploaded.originalName || asset.fileName || 'Ảnh đính kèm',
          size: uploaded.size || asset.fileSize,
          fileType: 'IMAGE',
        },
      ]);
      Alert.alert('Thành công', 'Đã tải ảnh lên đính kèm báo cáo');
    } catch (e: any) {
      console.error('Pick image error:', e);
      Alert.alert('Lỗi', e?.message || 'Không thể tải ảnh lên');
    } finally {
      setIsUploadingFile(false);
    }
  };

  const handlePickDocument = async () => {
    if (isSubmittedToday) return;
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
        copyToCacheDirectory: true,
      });
      if (res.canceled || !res.assets || res.assets.length === 0) return;
      const asset = res.assets[0];
      if (!asset) return;
      setIsUploadingFile(true);
      const uploaded = await uploadFile({
        uri: asset.uri,
        name: asset.name,
        type: asset.mimeType || 'application/octet-stream',
      });
      setAttachments((prev) => [
        ...prev,
        {
          url: uploaded.url,
          fileName: uploaded.originalName || asset.name,
          size: uploaded.size || asset.size,
          fileType: asset.mimeType?.includes('pdf') ? 'PDF' : 'DOCUMENT',
        },
      ]);
      Alert.alert('Thành công', 'Đã tải tài liệu lên đính kèm');
    } catch (e: any) {
      console.error('Pick doc error:', e);
      Alert.alert('Lỗi', e?.message || 'Không thể tải tài liệu lên');
    } finally {
      setIsUploadingFile(false);
    }
  };

  const handlePreviewAttachment = (item: DailyReportAttachmentItem) => {
    const isImage =
      item.fileType === 'IMAGE' ||
      item.url.toLowerCase().match(/\.(jpeg|jpg|gif|png|webp)($|\?)/);

    if (isImage) {
      setPreviewImageUri(item.url);
      setPreviewImageTitle(item.fileName || 'Xem ảnh đính kèm');
    } else {
      setPdfPreviewUrl(item.url);
      setPdfPreviewTitle(item.fileName || 'Xem tài liệu');
    }
  };

  // --- LƯU BÁO CÁO (DRAFT / SUBMIT) ---
  const handleSave = async (isDraft = false) => {
    if (isSubmittedToday) {
      Alert.alert('Thông báo', 'Bạn đã nộp báo cáo cho ngày hôm nay rồi. Mỗi ngày chỉ được gửi báo cáo 1 lần.');
      return;
    }

    const cleanMetrics = metrics
      .filter((m) => m.name.trim().length > 0)
      .map((m) => ({
        ...m,
        value: typeof m.value === 'string' ? m.value.trim() : m.value,
      }));

    const selectedCompleted = completedTasks.filter((t) => (t.isSelected ?? true) && t.title.trim().length > 0);
    const cleanInProgress = inProgressTasks.filter((t) => t.title.trim().length > 0);
    const cleanPlan = tomorrowPlan.filter((p) => p.trim().length > 0);

    if (!isDraft) {
      if (selectedCompleted.length === 0 && cleanMetrics.length === 0) {
        Alert.alert('Chưa đủ thông tin', 'Vui lòng ghi nhận ít nhất 1 kết quả định lượng hoặc chọn 1 công việc hoàn thành.');
        setCurrentStep(0);
        return;
      }
      if (cleanPlan.length === 0) {
        Alert.alert('Chưa có kế hoạch', 'Vui lòng nhập ít nhất 1 kế hoạch công việc cho ngày mai.');
        setCurrentStep(1);
        return;
      }
      if (!isConfirmed && currentStep === 2) {
        Alert.alert('Xác nhận', 'Vui lòng tích chọn xác nhận thông tin báo cáo là chính xác.');
        return;
      }
    }

    let formattedObstacles = '';
    if (hasObstacles) {
      formattedObstacles = obstacleText.trim();
      if (supportWish.trim()) {
        formattedObstacles += `\n[Hỗ trợ mong muốn: ${supportWish.trim()}]`;
      }
    }

    try {
      await saveReportMutation.mutateAsync({
        metrics: cleanMetrics,
        completedTasks: selectedCompleted,
        inProgressTasks: cleanInProgress,
        obstacles: formattedObstacles || undefined,
        tomorrowPlan: cleanPlan,
        attachments,
        selfRating,
        selfReview: selfReview.trim() || undefined,
        isDraft,
      });

      setNoticeText(isDraft ? '✓ Đã lưu nháp báo cáo thành công' : '✓ Đã gửi báo cáo cuối ngày thành công');

      Alert.alert(
        'Thành công',
        isDraft ? 'Đã lưu nháp báo cáo thành công' : 'Đã gửi báo cáo cuối ngày thành công!',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (err: any) {
      console.error('Submit report error:', err);
      Alert.alert('Lỗi', err?.response?.data?.message || 'Không thể lưu báo cáo, vui lòng thử lại');
    }
  };

  // Đếm số việc hoàn thành được chọn
  const activeCompletedCount = useMemo(() => {
    return completedTasks.filter((t) => (t.isSelected ?? true) && t.title.trim().length > 0).length;
  }, [completedTasks]);

  // Current assessment obj
  const currentAssessment = useMemo(() => {
    const found = ASSESSMENT_LEVELS.find((a) => a.level === selfRating);
    return found || {
      level: 5,
      title: 'Vượt kế hoạch',
      desc: 'Đã đạt kế hoạch và có thêm kết quả ngoài mục tiêu đã đặt ra.',
    };
  }, [selfRating]);

  if (todayReportQuery.isLoading && isInitializing) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#315DE5" />
        <Text style={{ marginTop: 12, color: colors.muted, fontSize: 14 }}>Đang tải dữ liệu báo cáo hôm nay...</Text>
      </View>
    );
  }

  return (
    <Screen backgroundColor="#F5F6FA">
      <ScreenContainer style={{ paddingTop: 0, paddingBottom: Math.max(insets.bottom + 16, 20) }}>
        {/* Leader / Custom Header Slot */}
        {headerSlot}

        {/* Standalone Title Header (only if not hideHeaderTitle) */}
        {!hideHeaderTitle && (
          <View style={styles.headerBox}>
            <View style={styles.headerTopRow}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={styles.headerTitle}>Báo cáo cuối ngày</Text>
                <Text style={styles.headerDate}>{displayDate}</Text>
              </View>
              <View style={styles.badgePill}>
                <Text style={styles.badgePillText}>
                  {reportData?.status === 'REVIEWED'
                    ? 'Đã duyệt'
                    : reportData?.status === 'SUBMITTED'
                    ? 'Đã gửi'
                    : 'Bản mẫu'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* ========================================================================= */}
        {/* MAIN SEGMENT SWITCHER: [ VIẾT BÁO CÁO | BÁO CÁO ĐÃ DUYỆT ]                */}
        {/* ========================================================================= */}
        <View style={styles.mainSegmentBar}>
          <Pressable
            style={[styles.mainSegmentBtn, activeTab === 'write' && styles.mainSegmentBtnActive]}
            onPress={() => {
              setActiveTab('write');
              setSelectedApprovedReport(null);
            }}
          >
            <MaterialCommunityIcons
              name="pencil-outline"
              size={16}
              color={activeTab === 'write' ? '#315DE5' : '#64748B'}
            />
            <Text style={[styles.mainSegmentBtnText, activeTab === 'write' && styles.mainSegmentBtnTextActive]}>
              Viết báo cáo
            </Text>
          </Pressable>

          <Pressable
            style={[styles.mainSegmentBtn, activeTab === 'approved' && styles.mainSegmentBtnActive]}
            onPress={() => setActiveTab('approved')}
          >
            <MaterialCommunityIcons
              name="check-decagram-outline"
              size={16}
              color={activeTab === 'approved' ? '#315DE5' : '#64748B'}
            />
            <Text style={[styles.mainSegmentBtnText, activeTab === 'approved' && styles.mainSegmentBtnTextActive]}>
              Đã duyệt
            </Text>
            {approvedReports.length > 0 && (
              <View style={[styles.mainSegmentCountBadge, activeTab === 'approved' && styles.mainSegmentCountBadgeActive]}>
                <Text style={[styles.mainSegmentCountText, activeTab === 'approved' && styles.mainSegmentCountTextActive]}>
                  {approvedReports.length}
                </Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* ========================================================================= */}
        {/* TAB 1: VIẾT BÁO CÁO (FORM SOẠN THẢO BÁO CÁO HÔM NAY)                      */}
        {/* ========================================================================= */}
        {activeTab === 'write' && (
          <View>
            {/* Person Card with Avatar, Info, Date & Status */}
            <View style={styles.personCard}>
              <View style={styles.personCardTop}>
                <View style={styles.personAvatar}>
                  <Text style={styles.avatarInitialsText}>{avatarInitials}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.personName}>{employeeName}</Text>
                  <Text style={styles.personRole}>{departmentName} · {roleName}</Text>
                </View>
              </View>
              <View style={styles.personCardDivider} />
              <View style={styles.personCardBottom}>
                <Text style={styles.personCardDate}>{displayDate}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    reportData?.status === 'REVIEWED' && styles.statusBadgeReviewed,
                    reportData?.status === 'SUBMITTED' && styles.statusBadgeSubmitted,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      reportData?.status === 'REVIEWED' && styles.statusBadgeTextReviewed,
                      reportData?.status === 'SUBMITTED' && styles.statusBadgeTextSubmitted,
                    ]}
                  >
                    {reportData?.status === 'REVIEWED'
                      ? 'Đã duyệt'
                      : reportData?.status === 'SUBMITTED'
                      ? 'Đã nộp'
                      : 'Chưa nộp'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Thông báo nếu hôm nay đã nộp */}
            {isSubmittedToday && (
              <View style={[styles.submittedTodayCallout, isReviewedToday && styles.submittedTodayCalloutReviewed]}>
                <MaterialCommunityIcons
                  name={isReviewedToday ? 'star-check' : 'clock-check-outline'}
                  size={20}
                  color={isReviewedToday ? '#15803D' : '#2563EB'}
                />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={[styles.submittedTodayTitle, isReviewedToday && styles.submittedTodayTitleReviewed]}>
                    {isReviewedToday
                      ? 'Báo cáo hôm nay đã được Admin đánh giá'
                      : 'Bạn đã nộp báo cáo cho ngày hôm nay'}
                  </Text>
                  <Text style={styles.submittedTodaySub}>
                    {isReviewedToday
                      ? 'Bạn có thể xem điểm và nhận xét bên tab "Đã duyệt" hoặc xem lại chi tiết bên dưới.'
                      : 'Báo cáo đang chờ Quản lý/Admin đánh giá. Mỗi ngày chỉ được gửi báo cáo 1 lần.'}
                  </Text>
                </View>
              </View>
            )}

            {/* STEP TABS (01 Hôm nay | 02 Ngày mai | 03 Xem lại) */}
            <View style={styles.stepTabsRow}>
              {[
                { id: 0, label: '01 · Hôm nay' },
                { id: 1, label: '02 · Ngày mai' },
                { id: 2, label: '03 · Xem lại' },
              ].map((tab) => {
                const isActive = currentStep === tab.id;
                return (
                  <TouchableOpacity
                    key={tab.id}
                    style={[styles.stepTabBtn, isActive && styles.stepTabBtnActive]}
                    onPress={() => setCurrentStep(tab.id)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.stepIndicatorLine, isActive && styles.stepIndicatorLineActive]} />
                    <Text style={[styles.stepTabLabel, isActive && styles.stepTabLabelActive]}>
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* PANEL 0: HÔM NAY */}
            {currentStep === 0 && (
              <View style={styles.panelContainer}>
                {/* 1. KẾT QUẢ CÔNG VIỆC ĐỊNH LƯỢNG */}
                <View style={styles.sectionCard}>
                  <Text style={styles.sectionCardTitle}>Kết quả công việc định lượng</Text>
                  <Text style={styles.sectionCardSubtitle}>
                    {isSubmittedToday
                      ? 'Số liệu định lượng đã ghi nhận hôm nay.'
                      : 'Ghi nhận số liệu đạt được hôm nay. Có thể đổi tên chỉ tiêu theo công việc của bạn.'}
                  </Text>

                  {metrics.length === 0 ? (
                    <Text style={styles.emptyPromptText}>Chưa có chỉ tiêu. Thêm chỉ tiêu khi có kết quả cần ghi nhận.</Text>
                  ) : (
                    metrics.map((m, idx) => (
                      <View key={idx} style={styles.quantItemBox}>
                        <View style={styles.quantItemHeader}>
                          <Text style={styles.quantNumberText}>CHỈ TIÊU {String(idx + 1).padStart(2, '0')}</Text>
                          {!isSubmittedToday && (
                            <TouchableOpacity onPress={() => handleDeleteMetric(idx)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                              <Text style={styles.removeText}>Xóa</Text>
                            </TouchableOpacity>
                          )}
                        </View>

                        <Text style={styles.inputLabel}>Tên chỉ tiêu</Text>
                        <TextInput
                          style={[styles.textInput, isSubmittedToday && styles.readOnlyInput]}
                          placeholder="Ví dụ: Khách hàng mới, doanh số…"
                          placeholderTextColor="#94A3B8"
                          value={m.name}
                          onChangeText={(v) => handleUpdateMetric(idx, 'name', v)}
                          editable={!isSubmittedToday}
                        />

                        <View style={styles.quantPairRow}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.inputLabel}>Kết quả</Text>
                            <TextInput
                              style={[styles.textInput, isSubmittedToday && styles.readOnlyInput]}
                              placeholder="Nhập số"
                              placeholderTextColor="#94A3B8"
                              keyboardType="numeric"
                              value={String(m.value ?? '')}
                              onChangeText={(v) => handleUpdateMetric(idx, 'value', v)}
                              editable={!isSubmittedToday}
                            />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.inputLabel}>Đơn vị</Text>
                            <TextInput
                              style={[styles.textInput, isSubmittedToday && styles.readOnlyInput]}
                              placeholder="Lỗi, khách, VND…"
                              placeholderTextColor="#94A3B8"
                              value={m.unit || ''}
                              onChangeText={(v) => handleUpdateMetric(idx, 'unit', v)}
                              editable={!isSubmittedToday}
                            />
                          </View>
                        </View>

                        <Text style={styles.inputLabel}>
                          Ghi chú <Text style={styles.optionalText}>· Tùy chọn</Text>
                        </Text>
                        <TextInput
                          style={[styles.textInput, isSubmittedToday && styles.readOnlyInput]}
                          placeholder="Ghi chú thêm nếu cần…"
                          placeholderTextColor="#94A3B8"
                          value={m.note || ''}
                          onChangeText={(v) => handleUpdateMetric(idx, 'note', v)}
                          editable={!isSubmittedToday}
                        />
                      </View>
                    ))
                  )}

                  {!isSubmittedToday && (
                    <TouchableOpacity style={styles.outlineAddBtn} onPress={handleAddMetric} activeOpacity={0.7}>
                      <Ionicons name="add" size={18} color="#315DE5" />
                      <Text style={styles.outlineAddBtnText}>Thêm chỉ tiêu</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* 2. CÔNG VIỆC HOÀN THÀNH */}
                <View style={styles.sectionCard}>
                  <View style={styles.sectionCardHeaderRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.sectionCardTitle}>Công việc hoàn thành</Text>
                      <Text style={styles.sectionCardSubtitle}>
                        {isSubmittedToday ? 'Các việc đã hoàn thành hôm nay' : 'Chọn việc đã hoàn thành hoặc thêm trực tiếp.'}
                      </Text>
                    </View>
                    <View style={styles.countBadge}>
                      <Text style={styles.countBadgeText}>{activeCompletedCount} việc</Text>
                    </View>
                  </View>

                  {completedTasks.length === 0 ? (
                    <Text style={styles.emptyPromptText}>Chưa có công việc nào trong danh sách hoàn thành.</Text>
                  ) : (
                    completedTasks.map((t, idx) => {
                      const isSelected = t.isSelected ?? true;
                      return (
                        <View key={idx} style={[styles.taskItemCard, isSelected && styles.taskItemCardActive]}>
                          <TouchableOpacity
                            style={styles.checkboxRow}
                            onPress={() => handleToggleTask(idx)}
                            disabled={isSubmittedToday}
                            activeOpacity={0.7}
                          >
                            <MaterialCommunityIcons
                              name={isSelected ? 'checkbox-marked' : 'checkbox-blank-outline'}
                              size={22}
                              color={isSelected ? '#315DE5' : '#94A3B8'}
                            />
                            <View style={{ flex: 1, marginLeft: 8 }}>
                              {t.isManual && !isSubmittedToday ? (
                                <TextInput
                                  style={styles.taskInlineInput}
                                  placeholder="Nhập tên việc đã hoàn thành…"
                                  placeholderTextColor="#94A3B8"
                                  value={t.title}
                                  onChangeText={(v) => handleUpdateCompletedTask(idx, v)}
                                  editable={!isSubmittedToday}
                                />
                              ) : (
                                <Text style={[styles.taskTitleText, isSelected && styles.taskTitleTextActive]}>
                                  {t.title}
                                </Text>
                              )}
                              <Text style={styles.taskSubText}>
                                {t.isManual ? 'Thêm thủ công' : 'Từ danh sách nhiệm vụ được giao'}
                              </Text>
                            </View>

                            {t.isManual && !isSubmittedToday && (
                              <TouchableOpacity onPress={() => handleDeleteCompletedTask(idx)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                                <Ionicons name="trash-outline" size={18} color="#EF4444" />
                              </TouchableOpacity>
                            )}
                          </TouchableOpacity>
                        </View>
                      );
                    })
                  )}

                  {!isSubmittedToday && (
                    <TouchableOpacity style={styles.outlineAddBtn} onPress={handleAddManualCompletedTask} activeOpacity={0.7}>
                      <Ionicons name="add" size={18} color="#315DE5" />
                      <Text style={styles.outlineAddBtnText}>Thêm việc hoàn thành</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* 3. CÔNG VIỆC ĐANG THỰC HIỆN / DỞ DANG */}
                <View style={styles.sectionCard}>
                  <View style={styles.sectionCardHeaderRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.sectionCardTitle}>Công việc đang thực hiện</Text>
                      <Text style={styles.sectionCardSubtitle}>
                        {isSubmittedToday ? 'Tiến độ các việc đang làm' : 'Ghi nhận tiến độ và ngày dự kiến hoàn thành.'}
                      </Text>
                    </View>
                    <View style={styles.countBadge}>
                      <Text style={styles.countBadgeText}>{inProgressTasks.length} việc</Text>
                    </View>
                  </View>

                  {inProgressTasks.length === 0 ? (
                    <Text style={styles.emptyPromptText}>Không có việc dở dang. Thêm nếu có việc cần làm tiếp ngày mai.</Text>
                  ) : (
                    inProgressTasks.map((t, idx) => (
                      <View key={idx} style={styles.inProgressCard}>
                        <View style={styles.quantItemHeader}>
                          <Text style={styles.inProgressNumberText}>CÔNG VIỆC {String(idx + 1).padStart(2, '0')}</Text>
                          {!isSubmittedToday && (
                            <TouchableOpacity onPress={() => handleDeleteInProgressTask(idx)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                              <Text style={styles.removeText}>Xóa</Text>
                            </TouchableOpacity>
                          )}
                        </View>

                        <Text style={styles.inputLabel}>Tên công việc</Text>
                        <TextInput
                          style={[styles.textInput, isSubmittedToday && styles.readOnlyInput]}
                          placeholder="Tên công việc đang làm…"
                          placeholderTextColor="#94A3B8"
                          value={t.title}
                          onChangeText={(v) => handleUpdateInProgressTask(idx, 'title', v)}
                          editable={!isSubmittedToday}
                        />

                        <View style={styles.quantPairRow}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.inputLabel}>Tiến độ (%)</Text>
                            <TextInput
                              style={[styles.textInput, isSubmittedToday && styles.readOnlyInput]}
                              placeholder="Ví dụ: 60"
                              placeholderTextColor="#94A3B8"
                              keyboardType="numeric"
                              value={String(t.progress ?? '')}
                              onChangeText={(v) => handleUpdateInProgressTask(idx, 'progress', Number(v) || 0)}
                              editable={!isSubmittedToday}
                            />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.inputLabel}>Dự kiến xong</Text>
                            <TextInput
                              style={[styles.textInput, isSubmittedToday && styles.readOnlyInput]}
                              placeholder="Ví dụ: Ngày mai, 22/09…"
                              placeholderTextColor="#94A3B8"
                              value={t.expectedDate || ''}
                              onChangeText={(v) => handleUpdateInProgressTask(idx, 'expectedDate', v)}
                              editable={!isSubmittedToday}
                            />
                          </View>
                        </View>
                      </View>
                    ))
                  )}

                  {!isSubmittedToday && (
                    <TouchableOpacity style={styles.outlineAddBtn} onPress={handleAddInProgressTask} activeOpacity={0.7}>
                      <Ionicons name="add" size={18} color="#315DE5" />
                      <Text style={styles.outlineAddBtnText}>Thêm việc đang làm</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            {/* PANEL 1: NGÀY MAI & ĐÁNH GIÁ */}
            {currentStep === 1 && (
              <View style={styles.panelContainer}>
                {/* 1. KẾ HOẠCH NGÀY MAI */}
                <View style={styles.sectionCard}>
                  <Text style={styles.sectionCardTitle}>Kế hoạch ngày mai</Text>
                  <Text style={styles.sectionCardSubtitle}>
                    {isSubmittedToday
                      ? 'Kế hoạch các đầu việc cho ngày làm việc tiếp theo.'
                      : 'Ghi các đầu việc dự kiến thực hiện trong ngày làm việc tiếp theo. Leader có thể duyệt thành Task.'}
                  </Text>

                  {tomorrowPlan.map((plan, idx) => (
                    <View key={idx} style={styles.planItemRow}>
                      <Text style={styles.planIndexBadge}>{idx + 1}</Text>
                      <TextInput
                        style={[styles.planInput, isSubmittedToday && styles.readOnlyInput]}
                        placeholder={`Đầu việc ${idx + 1}…`}
                        placeholderTextColor="#94A3B8"
                        value={plan}
                        onChangeText={(v) => handleUpdatePlanItem(idx, v)}
                        editable={!isSubmittedToday}
                      />
                      {!isSubmittedToday && tomorrowPlan.length > 1 && (
                        <TouchableOpacity onPress={() => handleDeletePlanItem(idx)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                          <Ionicons name="trash-outline" size={18} color="#EF4444" />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}

                  {!isSubmittedToday && (
                    <TouchableOpacity style={styles.outlineAddBtn} onPress={handleAddPlanItem} activeOpacity={0.7}>
                      <Ionicons name="add" size={18} color="#315DE5" />
                      <Text style={styles.outlineAddBtnText}>Thêm đầu việc ngày mai</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* 2. KHÓ KHĂN & ĐỀ XUẤT HỖ TRỢ */}
                <View style={styles.sectionCard}>
                  <View style={styles.switchRow}>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text style={styles.sectionCardTitle}>Khó khăn & vướng mắc</Text>
                      <Text style={styles.sectionCardSubtitle}>
                        Bật nếu hôm nay gặp trở ngại cần Leader hoặc phòng ban khác hỗ trợ.
                      </Text>
                    </View>
                    <Switch
                      value={hasObstacles}
                      onValueChange={(val) => !isSubmittedToday && setHasObstacles(val)}
                      trackColor={{ false: '#E2E8F0', true: '#BFDBFE' }}
                      thumbColor={hasObstacles ? '#315DE5' : '#94A3B8'}
                      disabled={isSubmittedToday}
                    />
                  </View>

                  {hasObstacles && (
                    <View style={{ marginTop: 12 }}>
                      <Text style={styles.inputLabel}>Mô tả vướng mắc</Text>
                      <TextInput
                        style={[styles.textAreaInput, isSubmittedToday && styles.readOnlyInput]}
                        placeholder="Mô tả cụ thể khó khăn phát sinh trong công việc hôm nay…"
                        placeholderTextColor="#94A3B8"
                        multiline
                        numberOfLines={3}
                        value={obstacleText}
                        onChangeText={setObstacleText}
                        editable={!isSubmittedToday}
                      />

                      <Text style={[styles.inputLabel, { marginTop: 10 }]}>
                        Mong muốn hỗ trợ <Text style={styles.optionalText}>· Tùy chọn</Text>
                      </Text>
                      <TextInput
                        style={[styles.textInput, isSubmittedToday && styles.readOnlyInput]}
                        placeholder="Ví dụ: Cần họp nhanh 15p với bên Media…"
                        placeholderTextColor="#94A3B8"
                        value={supportWish}
                        onChangeText={setSupportWish}
                        editable={!isSubmittedToday}
                      />
                    </View>
                  )}
                </View>

                {/* 3. TỰ ĐÁNH GIÁ NGÀY LÀM VIỆC */}
                <View style={styles.sectionCard}>
                  <Text style={styles.sectionCardTitle}>Tự đánh giá ngày làm việc</Text>
                  <Text style={styles.sectionCardSubtitle}>
                    Chọn mức độ tự đánh giá kết quả hoàn thành hôm nay.
                  </Text>

                  {/* Star buttons */}
                  <View style={styles.starRatingRow}>
                    {[1, 2, 3, 4, 5].map((lvl) => {
                      const isSelected = lvl <= selfRating;
                      return (
                        <TouchableOpacity
                          key={lvl}
                          style={styles.starBtn}
                          onPress={() => !isSubmittedToday && setSelfRating(lvl)}
                          activeOpacity={0.7}
                          disabled={isSubmittedToday}
                        >
                          <Ionicons
                            name={isSelected ? 'star' : 'star-outline'}
                            size={32}
                            color={isSelected ? '#F59E0B' : '#CBD5E1'}
                          />
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Active level card */}
                  <View style={styles.assessmentLevelBox}>
                    <View style={styles.assessmentLevelHeader}>
                      <Text style={styles.assessmentLevelBadge}>MỨC {selfRating}/5</Text>
                      <Text style={styles.assessmentLevelTitle}>{currentAssessment.title}</Text>
                    </View>
                    <Text style={styles.assessmentLevelDesc}>{currentAssessment.desc}</Text>
                  </View>

                  <Text style={[styles.inputLabel, { marginTop: 14 }]}>
                    Tự nhận xét bổ sung <Text style={styles.optionalText}>· Tùy chọn</Text>
                  </Text>
                  <TextInput
                    style={[styles.textAreaInput, isSubmittedToday && styles.readOnlyInput]}
                    placeholder="Nhận xét ngắn về hiệu quả công việc cá nhân hôm nay…"
                    placeholderTextColor="#94A3B8"
                    multiline
                    numberOfLines={3}
                    value={selfReview}
                    onChangeText={setSelfReview}
                    editable={!isSubmittedToday}
                  />
                </View>

                {/* 4. TỆP ĐÍNH KÈM */}
                <View style={styles.sectionCard}>
                  <Text style={styles.sectionCardTitle}>Tệp đính kèm & hình ảnh</Text>
                  <Text style={styles.sectionCardSubtitle}>
                    Đính kèm hình ảnh kết quả, tài liệu, biên bản báo cáo (ảnh hoặc PDF).
                  </Text>

                  {/* Attachments List */}
                  {attachments.length > 0 && (
                    <View style={styles.attachmentList}>
                      {attachments.map((a, idx) => (
                        <View key={idx} style={styles.attachmentItemRow}>
                          <TouchableOpacity
                            style={styles.attachmentClickArea}
                            onPress={() => handlePreviewAttachment(a)}
                            activeOpacity={0.7}
                          >
                            <MaterialCommunityIcons
                              name={a.fileType === 'IMAGE' ? 'image-outline' : 'file-document-outline'}
                              size={22}
                              color="#315DE5"
                            />
                            <View style={{ flex: 1, marginLeft: 10 }}>
                              <Text style={styles.attachmentFileName} numberOfLines={1}>
                                {a.fileName || `Tệp ${idx + 1}`}
                              </Text>
                              <Text style={styles.attachmentFileType}>
                                {a.fileType === 'IMAGE' ? 'Hình ảnh · Nhấn để xem' : 'Tài liệu · Nhấn để xem'}
                              </Text>
                            </View>
                            <Ionicons name="eye-outline" size={18} color="#315DE5" />
                          </TouchableOpacity>

                          {!isSubmittedToday && (
                            <TouchableOpacity
                              style={styles.attachmentRemoveBtn}
                              onPress={() => setAttachments((prev) => prev.filter((_, i) => i !== idx))}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                              <Ionicons name="close-circle" size={20} color="#EF4444" />
                            </TouchableOpacity>
                          )}
                        </View>
                      ))}
                    </View>
                  )}

                  {!isSubmittedToday && (
                    <View style={styles.attachBtnRow}>
                      <TouchableOpacity
                        style={styles.attachBtn}
                        onPress={handlePickImage}
                        disabled={isUploadingFile}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="image-outline" size={18} color="#315DE5" />
                        <Text style={styles.attachBtnText}>Thêm ảnh</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.attachBtn}
                        onPress={handlePickDocument}
                        disabled={isUploadingFile}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="document-text-outline" size={18} color="#315DE5" />
                        <Text style={styles.attachBtnText}>Thêm tài liệu</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {isUploadingFile && (
                    <View style={styles.uploadingBox}>
                      <ActivityIndicator size="small" color="#315DE5" />
                      <Text style={styles.uploadingText}>Đang tải tệp lên…</Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* PANEL 2: XEM LẠI */}
            {currentStep === 2 && (
              <View style={styles.panelContainer}>
                {/* TÓM TẮT BÁO CÁO */}
                <View style={styles.sectionCard}>
                  <Text style={styles.sectionCardTitle}>Tóm tắt báo cáo cuối ngày</Text>
                  <Text style={styles.sectionCardSubtitle}>
                    Kiểm tra lại toàn bộ nội dung trước khi nộp chính thức.
                  </Text>

                  <View style={styles.summaryTable}>
                    {/* 1. Định lượng */}
                    <View style={styles.summaryLine}>
                      <Text style={styles.summaryLineKey}>Định lượng</Text>
                      <Text style={styles.summaryLineVal}>
                        {metrics.filter((m) => m.name.trim() && m.value !== '').length === 0
                          ? 'Chưa nhập số liệu'
                          : metrics
                              .filter((m) => m.name.trim() && m.value !== '')
                              .map((m) => `${m.name}: ${m.value}${m.unit ? ` ${m.unit}` : ''}`)
                              .join('\n')}
                      </Text>
                    </View>

                    {/* 2. Đã hoàn thành */}
                    <View style={styles.summaryLine}>
                      <Text style={styles.summaryLineKey}>Đã hoàn thành</Text>
                      <Text style={styles.summaryLineVal}>
                        {activeCompletedCount === 0
                          ? '0 việc'
                          : completedTasks
                              .filter((t) => (t.isSelected ?? true) && t.title.trim())
                              .map((t) => `• ${t.title}`)
                              .join('\n')}
                      </Text>
                    </View>

                    {/* 3. Đang thực hiện */}
                    <View style={styles.summaryLine}>
                      <Text style={styles.summaryLineKey}>Đang thực hiện</Text>
                      <Text style={styles.summaryLineVal}>
                        {inProgressTasks.filter((t) => t.title.trim()).length === 0
                          ? '0 việc'
                          : inProgressTasks
                              .filter((t) => t.title.trim())
                              .map((t) => `${t.title} · ${t.progress ?? 60}% · ${t.expectedDate || '21/09'}`)
                              .join('\n')}
                      </Text>
                    </View>

                    {/* 4. Ngày mai */}
                    <View style={styles.summaryLine}>
                      <Text style={styles.summaryLineKey}>Ngày mai</Text>
                      <Text style={styles.summaryLineVal}>
                        {tomorrowPlan.filter((p) => p.trim()).length === 0
                          ? 'Chưa thêm kế hoạch'
                          : tomorrowPlan.filter((p) => p.trim()).join(' · ')}
                      </Text>
                    </View>

                    {/* 5. Hỗ trợ */}
                    <View style={styles.summaryLine}>
                      <Text style={styles.summaryLineKey}>Hỗ trợ</Text>
                      <Text style={styles.summaryLineVal}>
                        {hasObstacles
                          ? `${obstacleText.trim() || 'Có vướng mắc'}${supportWish.trim() ? ` (Mong muốn: ${supportWish.trim()})` : ''}`
                          : 'Không có vướng mắc'}
                      </Text>
                    </View>

                    {/* 6. Tự đánh giá */}
                    <View style={styles.summaryLine}>
                      <Text style={styles.summaryLineKey}>Tự đánh giá</Text>
                      <Text style={styles.summaryLineVal}>
                        {selfRating}/5 sao · {currentAssessment.title}
                      </Text>
                    </View>

                    {/* 7. Nhận xét */}
                    {selfReview.trim() ? (
                      <View style={styles.summaryLine}>
                        <Text style={styles.summaryLineKey}>Nhận xét</Text>
                        <Text style={styles.summaryLineVal}>{selfReview.trim()}</Text>
                      </View>
                    ) : null}

                    {/* 8. Đính kèm */}
                    <View style={styles.summaryLine}>
                      <Text style={styles.summaryLineKey}>Đính kèm ({attachments.length} tệp)</Text>
                      {attachments.length === 0 ? (
                        <Text style={styles.summaryLineVal}>0 tệp</Text>
                      ) : (
                        <View style={{ gap: 6, marginTop: 4 }}>
                          {attachments.map((a, idx) => (
                            <TouchableOpacity
                              key={idx}
                              style={styles.reviewAttachChip}
                              onPress={() => handlePreviewAttachment(a)}
                              activeOpacity={0.7}
                            >
                              <MaterialCommunityIcons
                                name={a.fileType === 'IMAGE' ? 'image-outline' : 'file-document-outline'}
                                size={16}
                                color="#315DE5"
                              />
                              <Text style={styles.reviewAttachChipText} numberOfLines={1}>
                                {a.fileName || `Tệp ${idx + 1}`}
                              </Text>
                              <Ionicons name="eye-outline" size={14} color="#315DE5" />
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </View>
                  </View>
                </View>

                {/* Checkbox Xác nhận (chỉ khi chưa nộp) */}
                {!isSubmittedToday && (
                  <TouchableOpacity
                    style={styles.confirmCheckRow}
                    onPress={() => setIsConfirmed(!isConfirmed)}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons
                      name={isConfirmed ? 'checkbox-marked' : 'checkbox-blank-outline'}
                      size={22}
                      color={isConfirmed ? '#315DE5' : '#94A3B8'}
                    />
                    <Text style={styles.confirmCheckLabel}>
                      Tôi xác nhận thông tin trong báo cáo là chính xác.
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* FOOTER ACTIONS */}
            <View style={styles.footerContainer}>
              {isSubmittedToday ? (
                <View style={{ gap: 10 }}>
                  <View style={styles.footerBtnRow}>
                    {currentStep > 0 && (
                      <TouchableOpacity
                        style={styles.footerSecondaryBtn}
                        onPress={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
                      >
                        <Text style={styles.footerSecondaryBtnText}>Quay lại</Text>
                      </TouchableOpacity>
                    )}

                    {currentStep < 2 && (
                      <TouchableOpacity
                        style={styles.footerPrimaryBtn}
                        onPress={() => setCurrentStep((prev) => Math.min(2, prev + 1))}
                      >
                        <Text style={styles.footerPrimaryBtnText}>
                          {currentStep === 1 ? 'Xem lại báo cáo →' : 'Tiếp tục →'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <View style={[styles.lockedDayBtn, isReviewedToday && styles.lockedDayBtnReviewed]}>
                    <MaterialCommunityIcons
                      name={isReviewedToday ? 'check-decagram' : 'check-circle-outline'}
                      size={20}
                      color={isReviewedToday ? '#15803D' : '#315DE5'}
                    />
                    <Text style={[styles.lockedDayBtnText, isReviewedToday && styles.lockedDayBtnTextReviewed]}>
                      {isReviewedToday ? 'Báo cáo hôm nay đã được Admin duyệt' : 'Đã nộp báo cáo hôm nay (1 lần / ngày)'}
                    </Text>
                  </View>
                  <Text style={styles.footerNoticeText}>
                    {isReviewedToday
                      ? 'Bạn có thể xem điểm số và đánh giá tại tab "Đã duyệt" ở trên.'
                      : 'Bạn đã hoàn tất nộp báo cáo cho ngày hôm nay.'}
                  </Text>
                </View>
              ) : (
                <View>
                  <View style={styles.footerBtnRow}>
                    {currentStep > 0 && (
                      <TouchableOpacity
                        style={styles.footerSecondaryBtn}
                        onPress={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
                      >
                        <Text style={styles.footerSecondaryBtnText}>Quay lại</Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      style={styles.footerSecondaryBtn}
                      onPress={() => handleSave(true)}
                      disabled={saveReportMutation.isPending}
                    >
                      {saveReportMutation.isPending ? (
                        <ActivityIndicator size="small" color="#697586" />
                      ) : (
                        <Text style={styles.footerSecondaryBtnText}>Lưu nháp</Text>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.footerPrimaryBtn,
                        currentStep === 2 && !isConfirmed && styles.footerPrimaryBtnDisabled,
                        saveReportMutation.isPending && styles.footerPrimaryBtnDisabled,
                      ]}
                      onPress={() => {
                        if (currentStep < 2) {
                          setCurrentStep((prev) => prev + 1);
                        } else {
                          handleSave(false);
                        }
                      }}
                      disabled={(currentStep === 2 && !isConfirmed) || saveReportMutation.isPending}
                    >
                      {saveReportMutation.isPending ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.footerPrimaryBtnText}>
                          {currentStep === 2 ? 'Gửi báo cáo' : currentStep === 1 ? 'Xem lại báo cáo →' : 'Tiếp tục →'}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.footerNoticeText}>{noticeText}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: BÁO CÁO ĐÃ DUYỆT (DANH SÁCH BÁO CÁO ĐÃ ĐƯỢC ADMIN ĐÁNH GIÁ)        */}
        {/* ========================================================================= */}
        {activeTab === 'approved' && (
          <View style={{ marginTop: 4 }}>
            {selectedApprovedReport ? (
              /* VIEW CHI TIẾT 1 BÁO CÁO ĐÃ DUYỆT */
              <View>
                <TouchableOpacity
                  style={styles.backToApprovedListBtn}
                  onPress={() => setSelectedApprovedReport(null)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="arrow-back" size={18} color="#315DE5" />
                  <Text style={styles.backToApprovedListBtnText}>Quay lại danh sách đã duyệt</Text>
                </TouchableOpacity>

                {/* Thẻ Đánh giá Admin nổi bật */}
                <View style={styles.adminFeedbackCard}>
                  <View style={styles.adminFeedbackHeader}>
                    <View style={styles.adminFeedbackIconBox}>
                      <MaterialCommunityIcons name="star-circle" size={24} color="#EAB308" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.adminFeedbackKicker}>KẾT QUẢ ĐÁNH GIÁ TỪ QUẢN LÝ / ADMIN</Text>
                      <View style={styles.adminRatingStarsRow}>
                        <Text style={styles.adminRatingStarsText}>
                          {'★'.repeat(selectedApprovedReport.adminRating || 5)}{'☆'.repeat(5 - (selectedApprovedReport.adminRating || 5))}
                        </Text>
                        <Text style={styles.adminRatingScoreText}>
                          {selectedApprovedReport.adminRating || 5}/5 sao
                        </Text>
                      </View>
                    </View>
                  </View>

                  {selectedApprovedReport.adminReview ? (
                    <View style={styles.adminFeedbackCommentBox}>
                      <Text style={styles.adminFeedbackCommentText}>
                        "{selectedApprovedReport.adminReview}"
                      </Text>
                    </View>
                  ) : null}

                  <View style={styles.adminFeedbackMetaRow}>
                    <Text style={styles.adminFeedbackMetaText}>
                      Người duyệt: {selectedApprovedReport.reviewedBy?.profile?.fullName || selectedApprovedReport.reviewedBy?.userCode || 'Admin'}
                    </Text>
                    {selectedApprovedReport.reviewedAt && (
                      <Text style={styles.adminFeedbackMetaText}>
                        {new Date(selectedApprovedReport.reviewedAt).toLocaleDateString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                      </Text>
                    )}
                  </View>
                </View>

                {/* Chi tiết nội dung báo cáo ngày đó */}
                <View style={styles.sectionCard}>
                  <Text style={styles.sectionCardTitle}>Kết quả định lượng</Text>
                  {(!selectedApprovedReport.metrics || selectedApprovedReport.metrics.length === 0) ? (
                    <Text style={styles.emptyPromptText}>Không có chỉ tiêu định lượng.</Text>
                  ) : (
                    selectedApprovedReport.metrics.map((m: any, idx: number) => (
                      <View key={idx} style={styles.historyDetailMetricRow}>
                        <Text style={styles.historyDetailMetricName}>{m.name}</Text>
                        <Text style={styles.historyDetailMetricValue}>
                          {m.value || '0'} {m.unit || ''}
                        </Text>
                      </View>
                    ))
                  )}
                </View>

                <View style={styles.sectionCard}>
                  <Text style={styles.sectionCardTitle}>Công việc hoàn thành</Text>
                  {(!selectedApprovedReport.completedTasks || selectedApprovedReport.completedTasks.length === 0) ? (
                    <Text style={styles.emptyPromptText}>Không có việc hoàn thành.</Text>
                  ) : (
                    selectedApprovedReport.completedTasks.map((t: any, idx: number) => (
                      <View key={idx} style={styles.historyDetailTaskRow}>
                        <Ionicons name="checkmark-circle" size={18} color="#15803D" />
                        <Text style={styles.historyDetailTaskText}>{t.title}</Text>
                      </View>
                    ))
                  )}
                </View>

                <View style={styles.sectionCard}>
                  <Text style={styles.sectionCardTitle}>Công việc đang thực hiện</Text>
                  {(!selectedApprovedReport.inProgressTasks || selectedApprovedReport.inProgressTasks.length === 0) ? (
                    <Text style={styles.emptyPromptText}>Không có việc đang làm.</Text>
                  ) : (
                    selectedApprovedReport.inProgressTasks.map((t: any, idx: number) => (
                      <View key={idx} style={styles.historyDetailTaskRow}>
                        <Ionicons name="time-outline" size={18} color="#315DE5" />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.historyDetailTaskText}>{t.title}</Text>
                          <Text style={styles.taskSubText}>Tiến độ: {t.progress ?? 50}% · Xong: {t.expectedDate || 'Ngày mai'}</Text>
                        </View>
                      </View>
                    ))
                  )}
                </View>

                <View style={styles.sectionCard}>
                  <Text style={styles.sectionCardTitle}>Kế hoạch ngày mai</Text>
                  {(!selectedApprovedReport.tomorrowPlan || selectedApprovedReport.tomorrowPlan.length === 0) ? (
                    <Text style={styles.emptyPromptText}>Chưa có kế hoạch.</Text>
                  ) : (
                    selectedApprovedReport.tomorrowPlan.map((p: string, idx: number) => (
                      <View key={idx} style={styles.historyDetailTaskRow}>
                        <Text style={styles.planIndexBadge}>{idx + 1}</Text>
                        <Text style={styles.historyDetailTaskText}>{p}</Text>
                      </View>
                    ))
                  )}
                </View>

                <View style={styles.sectionCard}>
                  <Text style={styles.sectionCardTitle}>Khó khăn & vướng mắc</Text>
                  <Text style={styles.historyDetailText}>
                    {selectedApprovedReport.obstacles || 'Không có khó khăn hay vướng mắc.'}
                  </Text>
                </View>

                <View style={styles.sectionCard}>
                  <Text style={styles.sectionCardTitle}>Tự đánh giá của bạn</Text>
                  <Text style={styles.historyDetailText}>
                    ★ {selectedApprovedReport.selfRating || 5}/5 sao
                  </Text>
                  {selectedApprovedReport.selfReview ? (
                    <Text style={[styles.historyDetailText, { marginTop: 6, fontStyle: 'italic' }]}>
                      "{selectedApprovedReport.selfReview}"
                    </Text>
                  ) : null}
                </View>

                {selectedApprovedReport.attachments && selectedApprovedReport.attachments.length > 0 && (
                  <View style={styles.sectionCard}>
                    <Text style={styles.sectionCardTitle}>Tệp đính kèm ({selectedApprovedReport.attachments.length})</Text>
                    <View style={{ gap: 8, marginTop: 8 }}>
                      {selectedApprovedReport.attachments.map((a: any, idx: number) => (
                        <TouchableOpacity
                          key={idx}
                          style={styles.attachmentItemRow}
                          onPress={() => handlePreviewAttachment(a)}
                          activeOpacity={0.7}
                        >
                          <MaterialCommunityIcons
                            name={a.fileType === 'IMAGE' ? 'image-outline' : 'file-document-outline'}
                            size={22}
                            color="#315DE5"
                          />
                          <View style={{ flex: 1, marginLeft: 10 }}>
                            <Text style={styles.attachmentFileName} numberOfLines={1}>
                              {a.fileName || `Tệp ${idx + 1}`}
                            </Text>
                            <Text style={styles.attachmentFileType}>Nhấn để xem tệp</Text>
                          </View>
                          <Ionicons name="eye-outline" size={18} color="#315DE5" />
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            ) : (
              /* DANH SÁCH CÁC BÁO CÁO ĐÃ DUYỆT */
              <View>
                {historyQuery.isLoading ? (
                  <View style={{ padding: 40, alignItems: 'center' }}>
                    <ActivityIndicator size="large" color="#315DE5" />
                    <Text style={{ marginTop: 12, color: '#697586', fontSize: 13 }}>Đang tải danh sách báo cáo đã duyệt...</Text>
                  </View>
                ) : approvedReports.length === 0 ? (
                  <View style={styles.emptyApprovedBox}>
                    <MaterialCommunityIcons name="check-decagram-outline" size={56} color="#CBD5E1" />
                    <Text style={styles.emptyApprovedTitle}>Chưa có báo cáo nào được duyệt</Text>
                    <Text style={styles.emptyApprovedSub}>
                      Khi bạn nộp báo cáo và được Admin / Ban giám đốc đánh giá và cho điểm, báo cáo sẽ xuất hiện tại mục này để bạn dễ dàng xem lại.
                    </Text>
                  </View>
                ) : (
                  <View style={{ gap: 12 }}>
                    <View style={styles.approvedHeaderSummaryRow}>
                      <Text style={styles.approvedHeaderSummaryText}>
                        Tổng số {approvedReports.length} báo cáo đã được phê duyệt
                      </Text>
                    </View>

                    {approvedReports.map((item: DailyReport) => (
                      <TouchableOpacity
                        key={item.id || item.reportDate}
                        style={styles.approvedReportCard}
                        onPress={() => setSelectedApprovedReport(item)}
                        activeOpacity={0.7}
                      >
                        {/* Header của thẻ */}
                        <View style={styles.approvedReportCardHeader}>
                          <View>
                            <Text style={styles.approvedReportCardDate}>Ngày {item.reportDate}</Text>
                            <Text style={styles.approvedReportCardDept}>
                              {item.department?.name || 'Phòng ban'} · {item.roleType === 'LEADER' ? 'Trưởng phòng' : 'Nhân viên'}
                            </Text>
                          </View>
                          <View style={styles.approvedRatingBadge}>
                            <Ionicons name="star" size={14} color="#F59E0B" />
                            <Text style={styles.approvedRatingBadgeText}>{item.adminRating || 5}/5</Text>
                          </View>
                        </View>

                        {/* Khung nhận xét của Admin */}
                        {item.adminReview ? (
                          <View style={styles.approvedReviewQuoteBox}>
                            <Text style={styles.approvedReviewQuoteText} numberOfLines={2}>
                              "{item.adminReview}"
                            </Text>
                          </View>
                        ) : (
                          <View style={styles.approvedReviewQuoteBox}>
                            <Text style={[styles.approvedReviewQuoteText, { color: '#64748B', fontStyle: 'normal' }]}>
                              ✓ Đã duyệt và chấm điểm đạt yêu cầu
                            </Text>
                          </View>
                        )}

                        {/* Footer của thẻ */}
                        <View style={styles.approvedReportCardFooter}>
                          <Text style={styles.approvedReviewerText}>
                            Người duyệt: <Text style={{ fontWeight: '700', color: '#192232' }}>{item.reviewedBy?.profile?.fullName || 'Admin'}</Text>
                          </Text>
                          <Text style={styles.approvedViewDetailLink}>Xem báo cáo →</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {/* ========================================================================= */}
        {/* FULLSCREEN IMAGE PREVIEW MODAL                                            */}
        {/* ========================================================================= */}
        <Modal
          visible={!!previewImageUri}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setPreviewImageUri(null)}
        >
          <View style={styles.imageModalOverlay}>
            <View style={[styles.imageModalHeader, { paddingTop: Math.max(insets.top + 8, 36) }]}>
              <TouchableOpacity
                style={styles.imageModalCloseBtn}
                onPress={() => setPreviewImageUri(null)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.imageModalTitle} numberOfLines={1}>
                {previewImageTitle}
              </Text>
              <View style={{ width: 36 }} />
            </View>

            <View style={styles.imageModalBody}>
              {previewImageUri ? (
                <Image
                  source={{ uri: previewImageUri }}
                  style={styles.imageModalFullImage}
                  resizeMode="contain"
                />
              ) : null}
            </View>
          </View>
        </Modal>

        {/* ========================================================================= */}
        {/* PDF / DOCUMENT VIEWER MODAL                                               */}
        {/* ========================================================================= */}
        <PdfViewerModal
          visible={!!pdfPreviewUrl}
          url={pdfPreviewUrl}
          title={pdfPreviewTitle}
          onClose={() => setPdfPreviewUrl(null)}
        />
      </ScreenContainer>
    </Screen>
  );
}

// -------------------------------------------------------------
// STYLES
// -------------------------------------------------------------
const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F6FA',
  },

  // HEADER
  headerBox: {
    paddingHorizontal: 4,
    paddingTop: 2,
    paddingBottom: 10,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  badgePill: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E9EDF2',
    marginTop: 2,
  },
  badgePillText: {
    fontSize: 11,
    color: '#697586',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#192232',
    letterSpacing: -0.6,
  },
  headerDate: {
    fontSize: 13,
    color: '#697586',
    marginTop: 2,
  },

  // MAIN SEGMENT SWITCHER
  mainSegmentBar: {
    flexDirection: 'row',
    backgroundColor: '#EAEFF8',
    padding: 4,
    borderRadius: 14,
    marginBottom: 14,
    gap: 4,
  },
  mainSegmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 11,
    gap: 6,
  },
  mainSegmentBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  mainSegmentBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  mainSegmentBtnTextActive: {
    color: '#315DE5',
    fontWeight: '700',
  },
  mainSegmentCountBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  mainSegmentCountBadgeActive: {
    backgroundColor: '#EEF3FF',
  },
  mainSegmentCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  mainSegmentCountTextActive: {
    color: '#315DE5',
  },

  // Person Card
  personCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginTop: 2,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E9EDF2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  personCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  personAvatar: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#EEF3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitialsText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#315DE5',
  },
  personName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#192232',
  },
  personRole: {
    fontSize: 12,
    color: '#697586',
    marginTop: 2,
    fontWeight: '500',
  },
  personCardDivider: {
    height: 1,
    backgroundColor: '#F1F4F9',
    marginVertical: 10,
  },
  personCardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  personCardDate: {
    fontSize: 12,
    color: '#697586',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#FFF7EB',
    borderWidth: 1,
    borderColor: '#FDE3B7',
  },
  statusBadgeSubmitted: {
    backgroundColor: '#EFF4FE',
    borderColor: '#C8D9FC',
  },
  statusBadgeReviewed: {
    backgroundColor: '#E7F9EE',
    borderColor: '#B8EBC9',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#B45309',
  },
  statusBadgeTextSubmitted: {
    color: '#315DE5',
  },
  statusBadgeTextReviewed: {
    color: '#15803D',
  },

  // SUBMITTED TODAY CALLOUT
  submittedTodayCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  submittedTodayCalloutReviewed: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  submittedTodayTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E40AF',
  },
  submittedTodayTitleReviewed: {
    color: '#15803D',
  },
  submittedTodaySub: {
    fontSize: 11,
    color: '#4B5563',
    marginTop: 3,
    lineHeight: 16,
  },

  // STEP TABS
  stepTabsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 6,
    marginBottom: 16,
  },
  stepTabBtn: {
    flex: 1,
  },
  stepTabBtnActive: {},
  stepIndicatorLine: {
    height: 3,
    backgroundColor: '#E9EDF2',
    borderRadius: 3,
    marginBottom: 8,
  },
  stepIndicatorLineActive: {
    backgroundColor: '#315DE5',
  },
  stepTabLabel: {
    fontSize: 11,
    color: '#697586',
    fontWeight: '500',
  },
  stepTabLabelActive: {
    color: '#315DE5',
    fontWeight: '700',
  },

  // PANEL
  panelContainer: {
    gap: 14,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E9EDF2',
    marginBottom: 12,
  },
  sectionCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sectionCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#192232',
  },
  sectionCardSubtitle: {
    fontSize: 12,
    color: '#697586',
    marginTop: 2,
    marginBottom: 12,
  },
  emptyPromptText: {
    fontSize: 13,
    color: '#94A3B8',
    fontStyle: 'italic',
    marginVertical: 6,
  },
  countBadge: {
    backgroundColor: '#EEF3FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#315DE5',
  },

  // QUANT ITEM
  quantItemBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EDF2F7',
  },
  quantItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  quantNumberText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  removeText: {
    fontSize: 11,
    color: '#EF4444',
    fontWeight: '600',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 4,
    marginTop: 6,
  },
  optionalText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '400',
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: '#1E293B',
  },
  readOnlyInput: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    color: '#334155',
  },
  quantPairRow: {
    flexDirection: 'row',
    gap: 10,
  },
  outlineAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#315DE5',
    borderStyle: 'dashed',
    borderRadius: 10,
    paddingVertical: 10,
    marginTop: 6,
    gap: 6,
  },
  outlineAddBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#315DE5',
  },

  // TASKS
  taskItemCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#EDF2F7',
  },
  taskItemCardActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#BFDBFE',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskInlineInput: {
    fontSize: 13,
    color: '#1E293B',
    paddingVertical: 2,
  },
  taskTitleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  taskTitleTextActive: {
    color: '#192232',
    fontWeight: '700',
  },
  taskSubText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  inProgressCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EDF2F7',
  },
  inProgressNumberText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#315DE5',
    letterSpacing: 0.5,
  },

  // PLAN
  planItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  planIndexBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#EEF3FF',
    color: '#315DE5',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 22,
  },
  planInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#1E293B',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textAreaInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#1E293B',
    minHeight: 70,
    textAlignVertical: 'top',
  },

  // STAR RATING
  starRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginVertical: 10,
  },
  starBtn: {
    padding: 4,
  },
  assessmentLevelBox: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  assessmentLevelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  assessmentLevelBadge: {
    backgroundColor: '#F59E0B',
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  assessmentLevelTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
  },
  assessmentLevelDesc: {
    fontSize: 12,
    color: '#B45309',
    lineHeight: 16,
  },

  // ATTACHMENTS
  attachmentList: {
    gap: 8,
    marginBottom: 10,
  },
  attachmentItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  attachmentClickArea: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  attachmentFileName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  attachmentFileType: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  attachmentRemoveBtn: {
    padding: 4,
    marginLeft: 6,
  },
  attachBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  attachBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingVertical: 10,
    gap: 6,
  },
  attachBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#315DE5',
  },
  uploadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  uploadingText: {
    fontSize: 12,
    color: '#315DE5',
  },

  // SUMMARY REVIEW
  summaryTable: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  summaryLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F7',
    paddingBottom: 8,
  },
  summaryLineKey: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  summaryLineVal: {
    fontSize: 13,
    color: '#192232',
    lineHeight: 18,
  },
  reviewAttachChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    gap: 6,
  },
  reviewAttachChipText: {
    flex: 1,
    fontSize: 12,
    color: '#1E293B',
  },
  confirmCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
    marginTop: 10,
  },
  confirmCheckLabel: {
    fontSize: 13,
    color: '#1E293B',
    fontWeight: '600',
    flex: 1,
  },

  // FOOTER
  footerContainer: {
    marginTop: 18,
    gap: 10,
  },
  footerBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  footerSecondaryBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerSecondaryBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  footerPrimaryBtn: {
    flex: 1,
    backgroundColor: '#315DE5',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerPrimaryBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
  footerPrimaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  lockedDayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: 8,
  },
  lockedDayBtnReviewed: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  lockedDayBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E40AF',
  },
  lockedDayBtnTextReviewed: {
    color: '#15803D',
  },
  footerNoticeText: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
  },

  // APPROVED TAB STYLES
  approvedHeaderSummaryRow: {
    marginBottom: 4,
    paddingHorizontal: 2,
  },
  approvedHeaderSummaryText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  emptyApprovedBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E9EDF2',
    marginTop: 10,
  },
  emptyApprovedTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 12,
  },
  emptyApprovedSub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  approvedReportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E9EDF2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  approvedReportCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  approvedReportCardDate: {
    fontSize: 15,
    fontWeight: '800',
    color: '#192232',
  },
  approvedReportCardDept: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  approvedRatingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  approvedRatingBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#92400E',
  },
  approvedReviewQuoteBox: {
    backgroundColor: '#FFFDF5',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  approvedReviewQuoteText: {
    fontSize: 13,
    color: '#1E293B',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  approvedReportCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  approvedReviewerText: {
    fontSize: 11,
    color: '#64748B',
  },
  approvedViewDetailLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#315DE5',
  },
  backToApprovedListBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 6,
    marginBottom: 8,
  },
  backToApprovedListBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#315DE5',
  },

  // ADMIN FEEDBACK CARD
  adminFeedbackCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    backgroundColor: '#FFFDF5',
  },
  adminFeedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  adminFeedbackIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminFeedbackKicker: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
    letterSpacing: 0.5,
  },
  adminRatingStarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  adminRatingStarsText: {
    fontSize: 16,
    color: '#F59E0B',
    fontWeight: '700',
  },
  adminRatingScoreText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
  },
  adminFeedbackCommentBox: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  adminFeedbackCommentText: {
    fontSize: 13,
    color: '#1E293B',
    lineHeight: 19,
    fontStyle: 'italic',
  },
  adminFeedbackMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#FEF3C7',
  },
  adminFeedbackMetaText: {
    fontSize: 11,
    color: '#78716C',
  },

  // DETAIL MODAL STYLES
  historyDetailMetricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  historyDetailMetricName: {
    fontSize: 13,
    color: '#334155',
  },
  historyDetailMetricValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#192232',
  },
  historyDetailTaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  historyDetailTaskText: {
    fontSize: 13,
    color: '#1E293B',
    flex: 1,
  },
  historyDetailText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
  },

  // IMAGE MODAL
  imageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  imageModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  imageModalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageModalTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginHorizontal: 8,
  },
  imageModalBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  imageModalFullImage: {
    width: '100%',
    height: '100%',
  },
});
