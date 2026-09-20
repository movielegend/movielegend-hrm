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
} from '../../hooks/useDailyReports';
import { uploadFile } from '../../api/uploads.api';
import type {
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

  // Active step: 0 = Hôm nay, 1 = Ngày mai, 2 = Xem lại
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isInitializing, setIsInitializing] = useState(true);
  const [noticeText, setNoticeText] = useState<string>('Dữ liệu sẵn sàng');

  // Preview modals state
  const [previewImageUri, setPreviewImageUri] = useState<string | null>(null);
  const [previewImageTitle, setPreviewImageTitle] = useState<string>('Xem ảnh đính kèm');
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [pdfPreviewTitle, setPdfPreviewTitle] = useState<string>('Xem tài liệu');

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
    setMetrics((prev) => [...prev, { name: '', value: '', unit: '', note: '' }]);
  };
  const handleUpdateMetric = (index: number, field: keyof DailyReportMetricItem, val: string) => {
    setMetrics((prev) => {
      const next = [...prev];
      const item = next[index] || { name: '' };
      next[index] = { ...item, [field]: val };
      return next;
    });
  };
  const handleDeleteMetric = (index: number) => {
    setMetrics((prev) => prev.filter((_, i) => i !== index));
  };

  // --- ACTIONS CHO VIỆC HOÀN THÀNH ---
  const handleToggleTask = (index: number) => {
    setCompletedTasks((prev) => {
      const next = [...prev];
      if (next[index]) {
        next[index] = { ...next[index], isSelected: !(next[index].isSelected ?? true) };
      }
      return next;
    });
  };
  const handleAddManualCompletedTask = () => {
    setCompletedTasks((prev) => [
      ...prev,
      { title: '', status: 'COMPLETED', isManual: true, isSelected: true },
    ]);
  };
  const handleUpdateCompletedTask = (index: number, val: string) => {
    setCompletedTasks((prev) => {
      const next = [...prev];
      if (next[index]) {
        next[index] = { ...next[index], title: val };
      }
      return next;
    });
  };
  const handleDeleteCompletedTask = (index: number) => {
    setCompletedTasks((prev) => prev.filter((_, i) => i !== index));
  };

  // --- ACTIONS CHO VIỆC ĐANG LÀM ---
  const handleAddInProgressTask = () => {
    setInProgressTasks((prev) => [
      ...prev,
      { title: '', status: 'IN_PROGRESS', isManual: true, progress: 50, expectedDate: 'Ngày mai' },
    ]);
  };
  const handleUpdateInProgressTask = (index: number, field: keyof DailyReportTaskItem, val: any) => {
    setInProgressTasks((prev) => {
      const next = [...prev];
      if (next[index]) {
        next[index] = { ...next[index], [field]: val };
      }
      return next;
    });
  };
  const handleDeleteInProgressTask = (index: number) => {
    setInProgressTasks((prev) => prev.filter((_, i) => i !== index));
  };

  // --- ACTIONS CHO KẾ HOẠCH NGÀY MAI ---
  const handleAddTomorrowPlan = () => {
    setTomorrowPlan((prev) => [...prev, '']);
  };
  const handleUpdateTomorrowPlan = (index: number, val: string) => {
    setTomorrowPlan((prev) => {
      const next = [...prev];
      next[index] = val;
      return next;
    });
  };
  const handleDeleteTomorrowPlan = (index: number) => {
    setTomorrowPlan((prev) => prev.filter((_, i) => i !== index));
  };

  // --- UPLOAD FILES ---
  const handlePickImage = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });
      if (res.canceled || !res.assets || res.assets.length === 0) return;

      setIsUploadingFile(true);
      const asset = res.assets[0];
      if (!asset) return;

      const uploaded = await uploadFile({
        uri: asset.uri,
        name: asset.fileName || 'report_image.jpg',
        mimeType: asset.mimeType || 'image/jpeg',
        purpose: 'EMPLOYEE_DOCUMENT' as any,
      });

      if (uploaded?.fileUrl) {
        setAttachments((prev) => [
          ...prev,
          {
            url: uploaded.fileUrl,
            fileName: asset.fileName || 'Ảnh đính kèm',
            fileType: 'IMAGE',
            size: asset.fileSize,
          },
        ]);
        setNoticeText('✓ Đã đính kèm ảnh');
      }
    } catch (e: any) {
      console.error('Pick image error:', e);
      Alert.alert('Lỗi', 'Không thể tải ảnh lên, vui lòng thử lại');
    } finally {
      setIsUploadingFile(false);
    }
  };

  const handlePickDocument = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'image/*'],
        copyToCacheDirectory: true,
      });
      if (res.canceled || !res.assets || res.assets.length === 0) return;

      setIsUploadingFile(true);
      const asset = res.assets[0];
      if (!asset) return;

      const uploaded = await uploadFile({
        uri: asset.uri,
        name: asset.name,
        mimeType: asset.mimeType || 'application/octet-stream',
        purpose: 'EMPLOYEE_DOCUMENT' as any,
      });

      if (uploaded?.fileUrl) {
        setAttachments((prev) => [
          ...prev,
          {
            url: uploaded.fileUrl,
            fileName: asset.name,
            fileType: asset.mimeType?.includes('pdf') ? 'PDF' : 'DOCUMENT',
            size: asset.size,
          },
        ]);
        setNoticeText('✓ Đã đính kèm tài liệu');
      }
    } catch (e: any) {
      console.error('Pick document error:', e);
      Alert.alert('Lỗi', 'Không thể tải tài liệu lên, vui lòng thử lại');
    } finally {
      setIsUploadingFile(false);
    }
  };

  const handleDeleteAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // --- PREVIEW ATTACHMENT HANDLER ---
  const handlePreviewAttachment = (att: DailyReportAttachmentItem) => {
    if (!att.url) return;

    const isImg =
      att.fileType === 'IMAGE' ||
      /\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(att.url);

    if (isImg) {
      setPreviewImageTitle(att.fileName || 'Xem ảnh đính kèm');
      setPreviewImageUri(att.url);
    } else {
      setPdfPreviewTitle(att.fileName || 'Xem tài liệu');
      setPdfPreviewUrl(att.url);
    }
  };

  // --- SAVE DRAFT & SUBMIT ---
  const handleSave = async (isDraft: boolean) => {
    if (!isDraft && !isConfirmed) {
      Alert.alert('Chưa xác nhận', 'Vui lòng tích xác nhận thông tin trong báo cáo là chính xác.');
      return;
    }

    const cleanMetrics = metrics.filter((m) => m.name.trim().length > 0);
    const selectedCompleted = completedTasks
      .filter((t) => (t.isSelected ?? true) && t.title.trim().length > 0);
    const cleanInProgress = inProgressTasks.filter((t) => t.title.trim().length > 0);
    const cleanPlan = tomorrowPlan.filter((p) => p.trim().length > 0);

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

  const isAlreadyReviewed = reportData?.status === 'REVIEWED';

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

        {/* ========================================================================= */}
        {/* PANEL 0: HÔM NAY                                                          */}
        {/* ========================================================================= */}
        {currentStep === 0 && (
          <View style={styles.panelContainer}>
            {/* 1. KẾT QUẢ CÔNG VIỆC ĐỊNH LƯỢNG */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionCardTitle}>Kết quả công việc định lượng</Text>
              <Text style={styles.sectionCardSubtitle}>
                Ghi nhận số liệu đạt được hôm nay. Có thể đổi tên chỉ tiêu theo công việc của bạn.
              </Text>

              {metrics.length === 0 ? (
                <Text style={styles.emptyPromptText}>Chưa có chỉ tiêu. Thêm chỉ tiêu khi có kết quả cần ghi nhận.</Text>
              ) : (
                metrics.map((m, idx) => (
                  <View key={idx} style={styles.quantItemBox}>
                    <View style={styles.quantItemHeader}>
                      <Text style={styles.quantNumberText}>CHỈ TIÊU {String(idx + 1).padStart(2, '0')}</Text>
                      {!isAlreadyReviewed && (
                        <TouchableOpacity onPress={() => handleDeleteMetric(idx)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                          <Text style={styles.removeText}>Xóa</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    <Text style={styles.inputLabel}>Tên chỉ tiêu</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Ví dụ: Khách hàng mới, doanh số…"
                      placeholderTextColor="#94A3B8"
                      value={m.name}
                      onChangeText={(v) => handleUpdateMetric(idx, 'name', v)}
                      editable={!isAlreadyReviewed}
                    />

                    <View style={styles.quantPairRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.inputLabel}>Kết quả</Text>
                        <TextInput
                          style={styles.textInput}
                          placeholder="Nhập số"
                          placeholderTextColor="#94A3B8"
                          keyboardType="numeric"
                          value={String(m.value ?? '')}
                          onChangeText={(v) => handleUpdateMetric(idx, 'value', v)}
                          editable={!isAlreadyReviewed}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.inputLabel}>Đơn vị</Text>
                        <TextInput
                          style={styles.textInput}
                          placeholder="Lỗi, khách, VND…"
                          placeholderTextColor="#94A3B8"
                          value={m.unit || ''}
                          onChangeText={(v) => handleUpdateMetric(idx, 'unit', v)}
                          editable={!isAlreadyReviewed}
                        />
                      </View>
                    </View>

                    <Text style={styles.inputLabel}>
                      Ghi chú <Text style={styles.optionalText}>· Tùy chọn</Text>
                    </Text>
                    <TextInput
                      style={[styles.textInput, styles.textAreaMini]}
                      placeholder="Bổ sung chi tiết về kết quả…"
                      placeholderTextColor="#94A3B8"
                      multiline
                      numberOfLines={2}
                      value={m.note || ''}
                      onChangeText={(v) => handleUpdateMetric(idx, 'note', v)}
                      editable={!isAlreadyReviewed}
                    />
                  </View>
                ))
              )}

              {!isAlreadyReviewed && (
                <TouchableOpacity style={styles.linkAddBtn} onPress={handleAddMetric}>
                  <Text style={styles.linkAddBtnText}>+ Thêm chỉ tiêu / kết quả</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* 2. VIỆC ĐÃ HOÀN THÀNH */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionCardTitle}>Việc đã hoàn thành</Text>
                <View style={styles.badgeCount}>
                  <Text style={styles.badgeCountText}>{activeCompletedCount} việc</Text>
                </View>
              </View>
              <Text style={styles.sectionCardSubtitle}>
                Đã lấy từ Task trong ngày. Bỏ chọn để ẩn khỏi báo cáo.
              </Text>

              {completedTasks.length === 0 ? (
                <Text style={styles.emptyPromptText}>Chưa có công việc nào hoàn thành hôm nay</Text>
              ) : (
                completedTasks.map((task, idx) => {
                  const isChecked = task.isSelected ?? true;
                  return (
                    <View key={idx} style={styles.taskCheckRow}>
                      <TouchableOpacity
                        style={styles.checkboxTouch}
                        onPress={() => handleToggleTask(idx)}
                        disabled={isAlreadyReviewed}
                      >
                        <MaterialCommunityIcons
                          name={isChecked ? 'checkbox-marked' : 'checkbox-blank-outline'}
                          size={22}
                          color={isChecked ? '#147D64' : '#94A3B8'}
                        />
                      </TouchableOpacity>

                      <View style={{ flex: 1 }}>
                        {task.isManual ? (
                          <TextInput
                            style={[styles.textInput, { minHeight: 38, paddingVertical: 6 }]}
                            placeholder="Tên việc đã hoàn thành..."
                            placeholderTextColor="#94A3B8"
                            value={task.title}
                            onChangeText={(v) => handleUpdateCompletedTask(idx, v)}
                            editable={!isAlreadyReviewed}
                          />
                        ) : (
                          <Text style={[styles.taskTitleText, !isChecked && styles.taskTitleDisabled]}>
                            {task.title}
                          </Text>
                        )}
                        <Text style={styles.taskSubTag}>
                          {task.isManual ? 'Hoàn thành · Tự nhập' : 'Hoàn thành · Từ Task'}
                        </Text>
                      </View>

                      {task.isManual && !isAlreadyReviewed && (
                        <TouchableOpacity onPress={() => handleDeleteCompletedTask(idx)} style={{ padding: 4 }}>
                          <Ionicons name="trash-outline" size={18} color="#EF4444" />
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })
              )}

              {!isAlreadyReviewed && (
                <TouchableOpacity style={styles.linkAddBtn} onPress={handleAddManualCompletedTask}>
                  <Text style={styles.linkAddBtnText}>+ Thêm việc ngoài Task</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* 3. ĐANG THỰC HIỆN */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionCardTitle}>Đang thực hiện</Text>

              {inProgressTasks.length === 0 ? (
                <Text style={styles.emptyPromptText}>Không có công việc nào đang thực hiện</Text>
              ) : (
                inProgressTasks.map((task, idx) => (
                  <View key={idx} style={styles.inProgressItemBox}>
                    <View style={styles.inProgressHeaderRow}>
                      <View style={{ flex: 1 }}>
                        {task.isManual ? (
                          <TextInput
                            style={[styles.textInput, { minHeight: 38, paddingVertical: 6, marginBottom: 4 }]}
                            placeholder="Tên việc đang thực hiện..."
                            placeholderTextColor="#94A3B8"
                            value={task.title}
                            onChangeText={(v) => handleUpdateInProgressTask(idx, 'title', v)}
                            editable={!isAlreadyReviewed}
                          />
                        ) : (
                          <Text style={styles.taskTitleText}>{task.title}</Text>
                        )}
                        <Text style={styles.smallSubText}>
                          Dự kiến hoàn thành · {task.expectedDate || '21/09'}
                        </Text>
                      </View>
                      <View style={styles.progressPercentBadge}>
                        <Text style={styles.progressPercentText}>{task.progress ?? 60}%</Text>
                      </View>
                    </View>

                    {/* Expandable Progress Inputs */}
                    <View style={styles.progressEditArea}>
                      <View style={styles.quantPairRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.inputLabel}>Tiến độ (%)</Text>
                          <TextInput
                            style={styles.textInput}
                            placeholder="60"
                            placeholderTextColor="#94A3B8"
                            keyboardType="numeric"
                            value={String(task.progress ?? 60)}
                            onChangeText={(v) => handleUpdateInProgressTask(idx, 'progress', Number(v) || 0)}
                            editable={!isAlreadyReviewed}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.inputLabel}>Ngày dự kiến</Text>
                          <TextInput
                            style={styles.textInput}
                            placeholder="2026-09-21"
                            placeholderTextColor="#94A3B8"
                            value={task.expectedDate || ''}
                            onChangeText={(v) => handleUpdateInProgressTask(idx, 'expectedDate', v)}
                            editable={!isAlreadyReviewed}
                          />
                        </View>
                      </View>
                    </View>

                    {task.isManual && !isAlreadyReviewed && (
                      <TouchableOpacity onPress={() => handleDeleteInProgressTask(idx)} style={{ alignSelf: 'flex-end', marginTop: 4 }}>
                        <Text style={styles.removeText}>Xóa việc này</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))
              )}

              {!isAlreadyReviewed && (
                <TouchableOpacity style={styles.linkAddBtn} onPress={handleAddInProgressTask}>
                  <Text style={styles.linkAddBtnText}>+ Thêm việc đang thực hiện</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* ========================================================================= */}
        {/* PANEL 1: NGÀY MAI & ĐÁNH GIÁ                                               */}
        {/* ========================================================================= */}
        {currentStep === 1 && (
          <View style={styles.panelContainer}>
            {/* 4. ƯU TIÊN NGÀY MAI */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionCardTitle}>Ưu tiên ngày mai</Text>
              <Text style={styles.sectionCardSubtitle}>Đầu việc rõ ràng giúp quản lý duyệt nhanh.</Text>

              {tomorrowPlan.map((plan, idx) => (
                <View key={idx} style={{ marginBottom: 10 }}>
                  <Text style={styles.inputLabel}>Công việc {String(idx + 1).padStart(2, '0')}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <TextInput
                      style={[styles.textInput, styles.textAreaMini, { flex: 1 }]}
                      placeholder="Ví dụ: Hoàn tất kiểm thử luồng tạo báo cáo"
                      placeholderTextColor="#94A3B8"
                      multiline
                      value={plan}
                      onChangeText={(v) => handleUpdateTomorrowPlan(idx, v)}
                      editable={!isAlreadyReviewed}
                    />
                    {!isAlreadyReviewed && tomorrowPlan.length > 1 && (
                      <TouchableOpacity onPress={() => handleDeleteTomorrowPlan(idx)} style={{ padding: 4 }}>
                        <Ionicons name="close-circle-outline" size={22} color="#94A3B8" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}

              {!isAlreadyReviewed && (
                <TouchableOpacity style={styles.linkAddBtn} onPress={handleAddTomorrowPlan}>
                  <Text style={styles.linkAddBtnText}>+ Thêm công việc</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* 5. BẠN CẦN HỖ TRỢ GÌ? (VƯỚNG MẮC) */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionCardTitle}>Bạn cần hỗ trợ gì?</Text>
              <Text style={styles.sectionCardSubtitle}>Chọn khi có vướng mắc cần được giải quyết.</Text>

              <TouchableOpacity
                style={styles.checkRowBtn}
                onPress={() => !isAlreadyReviewed && setHasObstacles(!hasObstacles)}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons
                  name={hasObstacles ? 'checkbox-marked' : 'checkbox-blank-outline'}
                  size={22}
                  color={hasObstacles ? '#315DE5' : '#94A3B8'}
                />
                <Text style={styles.checkRowLabel}>Có vướng mắc cần hỗ trợ</Text>
              </TouchableOpacity>

              {hasObstacles && (
                <View style={styles.helpFieldsBox}>
                  <Text style={styles.inputLabel}>Vướng mắc</Text>
                  <TextInput
                    style={[styles.textInput, styles.textAreaMini]}
                    placeholder="Vấn đề đang chặn công việc của bạn…"
                    placeholderTextColor="#94A3B8"
                    multiline
                    value={obstacleText}
                    onChangeText={setObstacleText}
                    editable={!isAlreadyReviewed}
                  />

                  <Text style={styles.inputLabel}>Hỗ trợ mong muốn</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Ví dụ: Cần xác nhận yêu cầu từ quản lý"
                    placeholderTextColor="#94A3B8"
                    value={supportWish}
                    onChangeText={setSupportWish}
                    editable={!isAlreadyReviewed}
                  />
                </View>
              )}
            </View>

            {/* 6. TỰ ĐÁNH GIÁ HÔM NAY (ASSESSMENT) */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionCardTitle}>Tự đánh giá hôm nay</Text>
              <Text style={styles.sectionCardSubtitle}>Mức độ hoàn thành so với kế hoạch.</Text>

              {/* 5-Star Row */}
              <View style={styles.starScaleRow}>
                {[1, 2, 3, 4, 5].map((star) => {
                  const isFilled = star <= selfRating;
                  const isSelected = star === selfRating;
                  return (
                    <TouchableOpacity
                      key={star}
                      style={[styles.starScaleBtn, isSelected && styles.starScaleBtnSelected]}
                      onPress={() => !isAlreadyReviewed && setSelfRating(star)}
                      disabled={isAlreadyReviewed}
                    >
                      <MaterialCommunityIcons
                        name={isFilled ? 'star' : 'star-outline'}
                        size={30}
                        color={isFilled ? '#F5BD50' : '#CBD5E1'}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.starScaleEndsRow}>
                <Text style={styles.scaleEndText}>Chưa hoàn thành</Text>
                <Text style={styles.scaleEndText}>Vượt kế hoạch</Text>
              </View>

              {/* Selected Assessment Feedback Box */}
              <View style={styles.selectedAssessmentBox}>
                <View style={styles.selectedAssessmentTitleRow}>
                  <MaterialCommunityIcons name="tune" size={16} color="#315DE5" />
                  <Text style={styles.selectedAssessmentTitleText}>
                    {selfRating}/5 sao · {currentAssessment.title}
                  </Text>
                </View>
                <Text style={styles.selectedAssessmentDescText}>
                  {currentAssessment.desc}
                </Text>
              </View>

              {/* Nhận xét thêm */}
              <Text style={styles.inputLabel}>
                Nhận xét thêm <Text style={styles.optionalText}>· Tùy chọn</Text>
              </Text>
              <TextInput
                style={[styles.textInput, styles.textAreaMini]}
                placeholder="Điều bạn làm tốt hoặc muốn cải thiện…"
                placeholderTextColor="#94A3B8"
                multiline
                value={selfReview}
                onChangeText={setSelfReview}
                editable={!isAlreadyReviewed}
              />

              {/* Attachments Section with Rich Preview */}
              <Text style={[styles.inputLabel, { marginTop: 14 }]}>
                Tệp đính kèm <Text style={styles.optionalText}>· Chạm để xem lại ảnh/tài liệu</Text>
              </Text>

              {attachments.length > 0 && (
                <View style={styles.attachmentsListBox}>
                  {attachments.map((att, idx) => {
                    const isImg =
                      att.fileType === 'IMAGE' ||
                      /\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(att.url);

                    return (
                      <View key={idx} style={styles.attachmentCardRow}>
                        <TouchableOpacity
                          style={styles.attachmentMainTouch}
                          onPress={() => handlePreviewAttachment(att)}
                          activeOpacity={0.7}
                        >
                          {isImg ? (
                            <Image
                              source={{ uri: att.url }}
                              style={styles.attachmentThumbImg}
                              resizeMode="cover"
                            />
                          ) : (
                            <View style={styles.attachmentDocIconBox}>
                              <MaterialCommunityIcons
                                name="file-document-outline"
                                size={22}
                                color="#315DE5"
                              />
                            </View>
                          )}

                          <View style={{ flex: 1 }}>
                            <Text style={styles.attachmentCardName} numberOfLines={1}>
                              {att.fileName || `Tệp ${idx + 1}`}
                            </Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                              <Text style={styles.attachmentTapHint}>Chạm để xem</Text>
                              <Ionicons name="eye-outline" size={13} color="#315DE5" />
                            </View>
                          </View>
                        </TouchableOpacity>

                        {!isAlreadyReviewed && (
                          <TouchableOpacity
                            onPress={() => handleDeleteAttachment(idx)}
                            style={styles.attachmentDeleteBtn}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Ionicons name="trash-outline" size={18} color="#EF4444" />
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  })}
                </View>
              )}

              {!isAlreadyReviewed && (
                <View style={styles.attachBtnGroup}>
                  <TouchableOpacity
                    style={styles.attachBtnOutline}
                    onPress={handlePickImage}
                    disabled={isUploadingFile}
                  >
                    <Ionicons name="image-outline" size={16} color="#315DE5" />
                    <Text style={styles.attachBtnText}>Đính kèm Ảnh</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.attachBtnOutline}
                    onPress={handlePickDocument}
                    disabled={isUploadingFile}
                  >
                    <Ionicons name="document-attach-outline" size={16} color="#315DE5" />
                    <Text style={styles.attachBtnText}>Tài liệu / PDF</Text>
                  </TouchableOpacity>
                </View>
              )}

              {isUploadingFile && (
                <View style={styles.uploadLoadingRow}>
                  <ActivityIndicator size="small" color="#315DE5" />
                  <Text style={styles.uploadLoadingText}>Đang tải tệp lên hệ thống...</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* ========================================================================= */}
        {/* PANEL 2: XEM LẠI                                                          */}
        {/* ========================================================================= */}
        {currentStep === 2 && (
          <View style={styles.panelContainer}>
            <View style={styles.sectionCard}>
              <Text style={styles.sectionCardTitle}>Xem lại báo cáo</Text>
              <Text style={styles.sectionCardSubtitle}>
                {new Date().toLocaleDateString('vi-VN')} · {employeeName}
              </Text>

              {/* Summary Lines */}
              <View style={styles.reviewLinesList}>
                {/* 1. Định lượng */}
                <View style={styles.summaryLine}>
                  <Text style={styles.summaryLineKey}>Kết quả công việc định lượng</Text>
                  <Text style={styles.summaryLineVal}>
                    {metrics.filter((m) => m.name.trim()).length === 0
                      ? 'Chưa nhập kết quả định lượng'
                      : metrics
                          .filter((m) => m.name.trim())
                          .map(
                            (m) =>
                              `${m.name}: ${m.value || '0'} ${m.unit || ''}${m.note ? ` — ${m.note}` : ''}`
                          )
                          .join('\n')}
                  </Text>
                </View>

                {/* 2. Hoàn thành */}
                <View style={styles.summaryLine}>
                  <Text style={styles.summaryLineKey}>Hoàn thành</Text>
                  <Text style={styles.summaryLineVal}>
                    {completedTasks.filter((t) => (t.isSelected ?? true) && t.title.trim()).length === 0
                      ? 'Chưa có công việc'
                      : completedTasks
                          .filter((t) => (t.isSelected ?? true) && t.title.trim())
                          .map((t) => t.title)
                          .join(' · ')}
                  </Text>
                </View>

                {/* 3. Đang thực hiện */}
                <View style={styles.summaryLine}>
                  <Text style={styles.summaryLineKey}>Đang thực hiện</Text>
                  <Text style={styles.summaryLineVal}>
                    {inProgressTasks.filter((t) => t.title.trim()).length === 0
                      ? 'Không có công việc'
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

                {/* 8. Đính kèm (Previewable chips) */}
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

            {/* Checkbox Xác nhận */}
            <TouchableOpacity
              style={styles.confirmCheckRow}
              onPress={() => !isAlreadyReviewed && setIsConfirmed(!isConfirmed)}
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
          </View>
        )}

        {/* ========================================================================= */}
        {/* FOOTER ACTIONS (QUAY LẠI | LƯU NHÁP | TIẾP TỤC / GỬI)                    */}
        {/* ========================================================================= */}
        <View style={styles.footerContainer}>
          <View style={styles.footerBtnRow}>
            {currentStep > 0 && (
              <TouchableOpacity
                style={styles.footerSecondaryBtn}
                onPress={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
              >
                <Text style={styles.footerSecondaryBtnText}>Quay lại</Text>
              </TouchableOpacity>
            )}

            {!isAlreadyReviewed && (
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
            )}

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

  // Person Card
  personCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginTop: 4,
    marginBottom: 14,
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

  // PANELS
  panelContainer: {
    gap: 12,
  },

  // SECTION CARD
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E9EDF2',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionCardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#192232',
    letterSpacing: -0.3,
  },
  sectionCardSubtitle: {
    fontSize: 13,
    color: '#697586',
    lineHeight: 18,
    marginTop: 4,
    marginBottom: 14,
  },
  badgeCount: {
    backgroundColor: '#EEF3FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeCountText: {
    fontSize: 11,
    color: '#315DE5',
    fontWeight: '700',
  },
  emptyPromptText: {
    fontSize: 13,
    color: '#94A3B8',
    fontStyle: 'italic',
    marginVertical: 8,
  },

  // QUANTITATIVE ITEM
  quantItemBox: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#E9EDF2',
    gap: 6,
  },
  quantItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  quantNumberText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#697586',
    letterSpacing: 0.8,
  },
  removeText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '600',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#192232',
    marginTop: 6,
    marginBottom: 4,
  },
  optionalText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '400',
  },
  quantPairRow: {
    flexDirection: 'row',
    gap: 12,
  },
  textInput: {
    backgroundColor: '#F5F6FA',
    borderWidth: 1,
    borderColor: '#E9EDF2',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#192232',
  },
  textAreaMini: {
    minHeight: 64,
    textAlignVertical: 'top',
  },
  linkAddBtn: {
    paddingVertical: 12,
    marginTop: 4,
  },
  linkAddBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#315DE5',
  },

  // TASKS LIST
  taskCheckRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#E9EDF2',
    gap: 10,
  },
  checkboxTouch: {
    marginTop: 2,
  },
  taskTitleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#192232',
    lineHeight: 20,
  },
  taskTitleDisabled: {
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  taskSubTag: {
    fontSize: 11,
    color: '#147D64',
    marginTop: 3,
    fontWeight: '500',
  },

  // IN-PROGRESS
  inProgressItemBox: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#E9EDF2',
  },
  inProgressHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  smallSubText: {
    fontSize: 12,
    color: '#697586',
    marginTop: 2,
  },
  progressPercentBadge: {
    backgroundColor: '#F5F6FA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  progressPercentText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#192232',
  },
  progressEditArea: {
    marginTop: 8,
  },

  // OBSTACLES CHECK
  checkRowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
  },
  checkRowLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#192232',
  },
  helpFieldsBox: {
    marginTop: 6,
    gap: 6,
  },

  // ASSESSMENT STAR SCALE
  starScaleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 12,
    paddingHorizontal: 6,
  },
  starScaleBtn: {
    padding: 6,
    borderRadius: 14,
  },
  starScaleBtnSelected: {
    backgroundColor: '#FFF5DF',
  },
  starScaleEndsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  scaleEndText: {
    fontSize: 11,
    color: '#697586',
  },
  selectedAssessmentBox: {
    backgroundColor: '#EEF3FF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  selectedAssessmentTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  selectedAssessmentTitleText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#315DE5',
  },
  selectedAssessmentDescText: {
    fontSize: 13,
    color: '#192232',
    lineHeight: 18,
  },

  // ATTACHMENTS (CARD ROW WITH THUMBNAIL)
  attachmentsListBox: {
    gap: 8,
    marginBottom: 10,
  },
  attachmentCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F6FA',
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E9EDF2',
    gap: 8,
  },
  attachmentMainTouch: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  attachmentThumbImg: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
  },
  attachmentDocIconBox: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#EEF3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachmentCardName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#192232',
  },
  attachmentTapHint: {
    fontSize: 11,
    color: '#315DE5',
    fontWeight: '500',
  },
  attachmentDeleteBtn: {
    padding: 8,
  },
  attachBtnGroup: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  attachBtnOutline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: '#F5F6FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E9EDF2',
  },
  attachBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#315DE5',
  },
  uploadLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  uploadLoadingText: {
    fontSize: 12,
    color: '#697586',
  },

  // REVIEW PANEL
  reviewLinesList: {
    gap: 12,
    marginTop: 8,
  },
  summaryLine: {
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderColor: '#E9EDF2',
    gap: 4,
  },
  summaryLineKey: {
    fontSize: 12,
    color: '#697586',
    fontWeight: '500',
  },
  summaryLineVal: {
    fontSize: 14,
    color: '#192232',
    fontWeight: '600',
    lineHeight: 20,
  },
  reviewAttachChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F6FA',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E9EDF2',
  },
  reviewAttachChipText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#192232',
  },
  confirmCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E9EDF2',
    gap: 10,
  },
  confirmCheckLabel: {
    flex: 1,
    fontSize: 13,
    color: '#192232',
    lineHeight: 18,
    fontWeight: '500',
  },

  // FOOTER
  footerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#E9EDF2',
  },
  footerBtnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  footerSecondaryBtn: {
    backgroundColor: '#F5F6FA',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerSecondaryBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#192232',
  },
  footerPrimaryBtn: {
    flex: 1,
    backgroundColor: '#192232',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerPrimaryBtnDisabled: {
    opacity: 0.45,
  },
  footerPrimaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  footerNoticeText: {
    fontSize: 12,
    color: '#147D64',
    textAlign: 'center',
    marginTop: 10,
    fontWeight: '500',
  },

  // FULLSCREEN IMAGE MODAL
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
    backgroundColor: 'rgba(20, 20, 20, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  imageModalCloseBtn: {
    padding: 6,
  },
  imageModalTitle: {
    flex: 1,
    textAlign: 'center',
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    paddingHorizontal: 8,
  },
  imageModalBody: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalFullImage: {
    width: '100%',
    height: '100%',
  },
});
