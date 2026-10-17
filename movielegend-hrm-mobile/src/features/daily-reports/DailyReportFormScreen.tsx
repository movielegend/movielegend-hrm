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
  StatusBar,
  KeyboardAvoidingView,
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
import { CustomDatePickerModal } from '../../components/CustomDatePickerModal';
import { useAuth } from '../../providers/AuthProvider';
import {
  useMyTodayReport,
  useSaveDailyReport,
  useMyReportHistory,
} from '../../hooks/useDailyReports';
import { uploadFile } from '../../api/uploads.api';
import { fetchMyWorkTasks, updateWorkTaskProgress } from '../../api/work-reports.api';
import type {
  DailyReport,
  DailyReportMetricItem,
  DailyReportTaskItem,
  DailyReportAttachmentItem,
} from '../../api/daily-reports.api';
import { colors } from '../../theme/colors';

// Danh mục & Phân loại đồng bộ theo Web
export const TASK_CATEGORIES = [
  'Vận hành',
  'Báo cáo',
  'Kế hoạch',
  'Kỹ thuật',
  'Họp nội bộ',
  'Đào tạo',
  'Khác',
];

export const TASK_TYPES: { value: string; label: string; color: string; bg: string }[] = [
  { value: 'THEO_KE_HOACH', label: 'Theo kế hoạch', color: '#334155', bg: '#F1F5F9' },
  { value: 'PHAT_SINH', label: 'Phát sinh', color: '#92400E', bg: '#FEF3C7' },
  { value: 'PHOI_HOP', label: 'Phối hợp', color: '#065F46', bg: '#D1FAE5' },
  { value: 'THUONG_XUYEN', label: 'Thường xuyên', color: '#075985', bg: '#E0F2FE' },
  { value: 'XU_LY_VAN_DE', label: 'Xử lý vấn đề', color: '#991B1B', bg: '#FEE2E2' },
];

export const TASK_PRIORITIES: { value: string; label: string; color: string; bg: string }[] = [
  { value: 'HIGH', label: 'Cao', color: '#B91C1C', bg: '#FEE2E2' },
  { value: 'MEDIUM', label: 'Trung bình', color: '#D97706', bg: '#FEF3C7' },
  { value: 'LOW', label: 'Thấp', color: '#047857', bg: '#D1FAE5' },
];

export const TASK_STATUSES: { value: string; label: string; color: string; bg: string; border: string; icon: any }[] = [
  { value: 'DONE', label: 'Hoàn thành', color: '#15803D', bg: '#DCFCE7', border: '#86EFAC', icon: 'checkmark-circle' },
  { value: 'IN_PROGRESS', label: 'Đang thực hiện', color: '#2563EB', bg: '#DBEAFE', border: '#93C5FD', icon: 'time-outline' },
  { value: 'NOT_STARTED', label: 'Chưa thực hiện', color: '#64748B', bg: '#F1F5F9', border: '#CBD5E1', icon: 'hourglass-outline' },
  { value: 'WAITING', label: 'Chờ phối hợp', color: '#D97706', bg: '#FEF3C7', border: '#FDE68A', icon: 'alert-circle-outline' },
];

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
  headerSlot?: React.ReactNode | ((props: { currentStep: number }) => React.ReactNode);
  hideHeaderTitle?: boolean;
  topContentSlot?: React.ReactNode;
}

export function DailyReportFormScreen({ headerSlot, hideHeaderTitle, topContentSlot }: DailyReportFormScreenProps = {}) {
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

  // STEP 1: HÔM NAY (Danh sách công việc & nhiệm vụ hợp nhất)
  const [metrics, setMetrics] = useState<DailyReportMetricItem[]>([
    {
      name: '',
      description: '',
      value: '',
      unit: '',
      note: '',
      notes: '',
      category: 'Vận hành',
      taskType: 'THEO_KE_HOACH',
      priority: 'MEDIUM',
      deadline: '',
      status: 'IN_PROGRESS',
      progress: 50,
      obstacles: '',
      supportRequest: '',
      isCarriedOver: false,
    },
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
  const [isSyncingFromWeb, setIsSyncingFromWeb] = useState(false);
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});

  const toggleTaskExpand = (key: string) => {
    setExpandedTasks((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Date Picker state cho chọn ngày Hạn chót
  const [activeDatePicker, setActiveDatePicker] = useState<{
    type: 'metric' | 'completed' | 'inProgress';
    index: number;
    initialDate?: Date;
  } | null>(null);

  const handleOpenDatePicker = (type: 'metric' | 'completed' | 'inProgress', index: number, currentValue?: string) => {
    if (isSubmittedToday) return;
    let parsedDate: Date | undefined;
    if (currentValue) {
      const d = new Date(currentValue);
      if (!isNaN(d.getTime())) {
        parsedDate = d;
      } else {
        const parts = currentValue.split(/[-/]/);
        if (parts.length === 3) {
          if (parts[0] && parts[0].length === 4) {
            const d2 = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
            if (!isNaN(d2.getTime())) parsedDate = d2;
          } else if (parts[2] && parts[2].length === 4) {
            const d2 = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
            if (!isNaN(d2.getTime())) parsedDate = d2;
          }
        }
      }
    }
    setActiveDatePicker({
      type,
      index,
      initialDate: parsedDate || new Date(),
    });
  };

  const handleSelectDate = (date: Date) => {
    if (!activeDatePicker) return;
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;

    const { type, index } = activeDatePicker;
    if (type === 'metric') {
      handleUpdateMetric(index, 'deadline', dateStr);
    } else if (type === 'completed') {
      handleUpdateCompletedTaskField(index, 'deadline', dateStr);
    } else if (type === 'inProgress') {
      handleUpdateInProgressTask(index, 'expectedDate', dateStr);
      handleUpdateInProgressTask(index, 'deadline', dateStr);
    }
    setActiveDatePicker(null);
  };

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

  // Đồng bộ danh sách công việc từ module Báo cáo công việc (bảng Excel Web)
  const handleSyncFromWeb = async (silent = false) => {
    if (isSubmittedToday) return;
    try {
      setIsSyncingFromWeb(true);
      const webTasks = await fetchMyWorkTasks();
      if (!webTasks || webTasks.length === 0) {
        if (!silent) {
          Alert.alert('Đồng bộ từ Web', 'Chưa có công việc nào của bạn được ghi nhận trên Web cho ngày hôm nay.');
        }
        return;
      }

      const webMetrics: DailyReportMetricItem[] = webTasks.map((t) => {
        const isDone = t.workStatus === 'DONE';
        const displayTitle = t.title;
        return {
          taskId: t.id,
          taskCode: t.taskCode,
          name: displayTitle,
          description: t.description || t.title,
          category: t.category || 'Vận hành',
          taskType: t.taskType || 'THEO_KE_HOACH',
          priority: (t.priority as any) || 'MEDIUM',
          status: t.workStatus || (isDone ? 'DONE' : 'IN_PROGRESS'),
          progress: t.latestUpdate?.progress ?? (isDone ? 100 : t.workStatus === 'NOT_STARTED' ? 0 : 50),
          deadline: t.deadline || '',
          note: t.latestUpdate?.notes || '',
          notes: t.latestUpdate?.notes || '',
          obstacles: t.latestUpdate?.obstacles || '',
          supportRequest: t.latestUpdate?.supportRequest || '',
          isCarriedOver: Boolean(t.isCarriedOver),
        };
      });

      setMetrics((prev) => {
        const currentClean = prev.filter((m) => (m.name || '').trim() || (m.description || '').trim());
        const webTaskIds = new Set(webMetrics.map((m) => m.taskId).filter(Boolean));
        const manualItems = currentClean.filter((m) => !m.taskId || !webTaskIds.has(m.taskId));
        return [...webMetrics, ...manualItems];
      });

      if (!silent) {
        Alert.alert(
          'Đồng bộ thành công',
          `Đã đồng bộ ${webTasks.length} công việc đầy đủ hạng mục, loại việc, tiến độ & trạng thái từ bảng Web.`
        );
      }
    } catch (err: any) {
      console.warn('Lỗi đồng bộ từ Web:', err);
      if (!silent) {
        Alert.alert('Lỗi', 'Không thể đồng bộ công việc từ Web, vui lòng kiểm tra kết nối mạng.');
      }
    } finally {
      setIsSyncingFromWeb(false);
    }
  };

  // Khởi tạo từ Server / Auto-pull
  useEffect(() => {
    if (reportData) {
      if (reportData.metrics && reportData.metrics.length > 0) {
        const validMetrics = reportData.metrics
          .filter(
            (m: any) => m && ((m.name && m.name.trim()) || (m.title && m.title.trim()) || m.description || m.notes)
          )
          .map((m: any) => ({
            taskId: m.taskId,
            taskCode: m.taskCode,
            name: m.name || m.title || '',
            description: m.description || '',
            value: m.value || '',
            unit: m.unit || '',
            note: m.note || m.notes || '',
            notes: m.notes || m.note || '',
            category: m.category || 'Vận hành',
            taskType: m.taskType || 'THEO_KE_HOACH',
            priority: m.priority || 'MEDIUM',
            deadline: m.deadline || '',
            status: m.status || (Number(m.progress) === 100 ? 'DONE' : 'IN_PROGRESS'),
            progress: m.status === 'DONE' ? 100 : (m.progress ?? (m.status === 'NOT_STARTED' ? 0 : 50)),
            obstacles: m.obstacles || '',
            supportRequest: m.supportRequest || '',
            isCarriedOver: Boolean(m.isCarriedOver),
          }));

        if (validMetrics.length > 0) {
          setMetrics(validMetrics);
        } else if (!isSubmittedToday) {
          setMetrics([
            {
              name: '',
              description: '',
              value: '',
              unit: '',
              note: '',
              notes: '',
              category: 'Vận hành',
              taskType: 'THEO_KE_HOACH',
              priority: 'MEDIUM',
              deadline: '',
              status: 'IN_PROGRESS',
              progress: 50,
              obstacles: '',
              supportRequest: '',
              isCarriedOver: false,
            },
          ]);
        }
      } else {
        // Fallback tương thích nếu báo cáo cũ có completedTasks/inProgressTasks
        const fallbackTasks: DailyReportMetricItem[] = [];
        if (reportData.completedTasks && reportData.completedTasks.length > 0) {
          reportData.completedTasks.forEach((t: any) => {
            if (t && (t.title || t.name)) {
              fallbackTasks.push({
                taskId: t.taskId,
                taskCode: t.taskCode,
                name: t.title || t.name,
                description: t.description || '',
                category: t.category || 'Vận hành',
                taskType: t.taskType || 'THEO_KE_HOACH',
                priority: t.priority || 'MEDIUM',
                deadline: t.deadline || '',
                status: 'DONE',
                progress: 100,
                notes: t.notes || t.note || '',
                obstacles: t.obstacles || '',
                supportRequest: t.supportRequest || '',
              });
            }
          });
        }
        if (reportData.inProgressTasks && reportData.inProgressTasks.length > 0) {
          reportData.inProgressTasks.forEach((t: any) => {
            if (t && (t.title || t.name)) {
              fallbackTasks.push({
                taskId: t.taskId,
                taskCode: t.taskCode,
                name: t.title || t.name,
                description: t.description || '',
                category: t.category || 'Vận hành',
                taskType: t.taskType || 'THEO_KE_HOACH',
                priority: t.priority || 'MEDIUM',
                deadline: t.deadline || t.expectedDate || '',
                status: 'IN_PROGRESS',
                progress: t.progress ?? 50,
                notes: t.notes || t.note || '',
                obstacles: t.obstacles || '',
                supportRequest: t.supportRequest || '',
              });
            }
          });
        }
        if (fallbackTasks.length > 0) {
          setMetrics(fallbackTasks);
        }
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

      // Nếu chưa có báo cáo hôm nay và danh sách rỗng -> tự động kéo từ Web
      if (reportData.status !== 'SUBMITTED' && reportData.status !== 'REVIEWED') {
        const hasTasks = reportData.metrics?.some((m: any) => (m.name || '').trim().length > 0);
        if (!hasTasks) {
          handleSyncFromWeb(true);
        }
      }
    } else if (!todayReportQuery.isLoading) {
      setIsInitializing(false);
      handleSyncFromWeb(true);
    }
  }, [reportData, todayReportQuery.isLoading]);

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
    setMetrics((prev) => [
      ...prev,
      {
        name: '',
        description: '',
        value: '',
        unit: '',
        note: '',
        notes: '',
        category: 'Vận hành',
        taskType: 'THEO_KE_HOACH',
        priority: 'MEDIUM',
        deadline: '',
        obstacles: '',
        supportRequest: '',
      },
    ]);
  };
  const handleUpdateMetric = (index: number, field: keyof DailyReportMetricItem, val: any) => {
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
      {
        title: '',
        description: '',
        category: 'Vận hành',
        taskType: 'THEO_KE_HOACH',
        priority: 'MEDIUM',
        status: 'COMPLETED',
        progress: 100,
        deadline: '',
        isManual: true,
        isSelected: true,
        notes: '',
        obstacles: '',
        supportRequest: '',
      },
    ]);
  };
  const handleUpdateCompletedTaskField = (index: number, field: keyof DailyReportTaskItem, val: any) => {
    if (isSubmittedToday) return;
    setCompletedTasks((prev) => {
      const next = [...prev];
      if (next[index]) {
        next[index] = { ...next[index], [field]: val };
      }
      return next;
    });
  };
  const handleUpdateCompletedTask = (index: number, val: string) => {
    handleUpdateCompletedTaskField(index, 'title', val);
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
      {
        title: '',
        description: '',
        category: 'Vận hành',
        taskType: 'THEO_KE_HOACH',
        priority: 'MEDIUM',
        status: 'IN_PROGRESS',
        progress: 50,
        deadline: '',
        expectedDate: 'Ngày mai',
        isManual: true,
        notes: '',
        obstacles: '',
        supportRequest: '',
      },
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
      const uploaded: any = await uploadFile({
        uri: asset.uri,
        name: asset.fileName || `anh_${Date.now()}.jpg`,
        mimeType: asset.mimeType || 'image/jpeg',
        purpose: 'TASK_ATTACHMENT' as any,
      });
      setAttachments((prev) => [
        ...prev,
        {
          url: uploaded.fileUrl || uploaded.url,
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
      const uploaded: any = await uploadFile({
        uri: asset.uri,
        name: asset.name,
        mimeType: asset.mimeType || 'application/octet-stream',
        purpose: 'TASK_ATTACHMENT' as any,
      });
      setAttachments((prev) => [
        ...prev,
        {
          url: uploaded.fileUrl || uploaded.url,
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

    const cleanTasks = metrics
      .filter(
        (m) =>
          (m.name && m.name.trim().length > 0) ||
          (m.description && m.description.trim().length > 0) ||
          (m.notes && m.notes.trim().length > 0)
      )
      .map((m) => {
        const isDone = m.status === 'DONE';
        const progress = isDone ? 100 : (typeof m.progress === 'number' ? m.progress : (m.status === 'NOT_STARTED' ? 0 : 50));
        return {
          ...m,
          name: m.name ? m.name.trim() : (m.description ? m.description.trim() : 'Nhiệm vụ'),
          status: m.status || (progress === 100 ? 'DONE' : 'IN_PROGRESS'),
          progress,
          value: typeof m.value === 'string' ? m.value.trim() : m.value,
        };
      });

    const cleanPlan = tomorrowPlan.filter((p) => p.trim().length > 0);

    if (!isDraft) {
      if (cleanTasks.length === 0) {
        Alert.alert('Chưa đủ thông tin', 'Vui lòng nhập ít nhất 1 công việc / nhiệm vụ cho ngày hôm nay.');
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
      // Phục vụ tương thích ngược với các phiên bản cũ
      const derivedCompleted = cleanTasks
        .filter((t) => t.status === 'DONE')
        .map((t) => ({
          taskId: t.taskId,
          taskCode: t.taskCode,
          title: t.name,
          description: t.description,
          category: t.category,
          taskType: t.taskType,
          priority: t.priority,
          deadline: t.deadline,
          status: 'COMPLETED',
          progress: 100,
          isSelected: true,
          notes: t.notes || t.note,
          obstacles: t.obstacles,
          supportRequest: t.supportRequest,
        }));

      const derivedInProgress = cleanTasks
        .filter((t) => t.status !== 'DONE')
        .map((t) => ({
          taskId: t.taskId,
          taskCode: t.taskCode,
          title: t.name,
          description: t.description,
          category: t.category,
          taskType: t.taskType,
          priority: t.priority,
          deadline: t.deadline,
          status: t.status,
          progress: t.progress,
          expectedDate: t.deadline,
          notes: t.notes || t.note,
          obstacles: t.obstacles,
          supportRequest: t.supportRequest,
        }));

      await saveReportMutation.mutateAsync({
        metrics: cleanTasks,
        completedTasks: derivedCompleted,
        inProgressTasks: derivedInProgress,
        obstacles: formattedObstacles || undefined,
        tomorrowPlan: cleanPlan,
        attachments,
        selfRating,
        selfReview: selfReview.trim() || undefined,
        isDraft,
      });

      // Đồng bộ trực tiếp ngược lại bảng Excel trên Web
      try {
        const todayStr = new Date().toISOString().split('T')[0];
        const syncPromises: Promise<any>[] = [];

        cleanTasks.forEach((t) => {
          if (t.taskId) {
            const isDone = t.status === 'DONE';
            syncPromises.push(
              updateWorkTaskProgress(t.taskId, {
                workStatus: (t.status as any) || (isDone ? 'DONE' : 'IN_PROGRESS'),
                progress: t.progress ?? (isDone ? 100 : 50),
                reportDate: todayStr,
                notes: t.notes || t.note || undefined,
                obstacles: t.obstacles || undefined,
                supportRequest: t.supportRequest || undefined,
                isTestBypass: true,
              })
            );
          }
        });

        if (syncPromises.length > 0) {
          await Promise.allSettled(syncPromises);
        }
      } catch (syncErr) {
        console.warn('Lỗi đồng bộ ngược về Web (non-fatal):', syncErr);
      }

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
    return metrics.filter((m) => m.status === 'DONE' && ((m.name || '').trim() || (m.title || '').trim())).length;
  }, [metrics]);

  const handleSetMetricStatus = (index: number, newStatus: string) => {
    if (isSubmittedToday) return;
    setMetrics((prev) => {
      const next = [...prev];
      const cur = next[index] || { name: '' };
      let newProgress = cur.progress;
      if (newStatus === 'DONE') {
        newProgress = 100;
      } else if (newStatus === 'NOT_STARTED') {
        newProgress = 0;
      } else if (newStatus === 'IN_PROGRESS') {
        if (!newProgress || newProgress === 0 || newProgress === 100) {
          newProgress = 50;
        }
      }
      next[index] = {
        ...cur,
        status: newStatus,
        progress: newProgress,
      };
      return next;
    });
  };

  const handleSetMetricProgress = (index: number, progressVal: number) => {
    if (isSubmittedToday) return;
    setMetrics((prev) => {
      const next = [...prev];
      const cur = next[index] || { name: '' };
      const clamped = Math.max(0, Math.min(100, progressVal));
      let newStatus = cur.status;
      if (clamped === 100) {
        newStatus = 'DONE';
      } else if (clamped === 0) {
        newStatus = 'NOT_STARTED';
      } else if (!newStatus || newStatus === 'DONE' || newStatus === 'NOT_STARTED') {
        newStatus = 'IN_PROGRESS';
      }
      next[index] = {
        ...cur,
        progress: clamped,
        status: newStatus,
      };
      return next;
    });
  };

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
        <ActivityIndicator size="large" color="#102739" />
        <Text style={{ marginTop: 12, color: colors.muted, fontSize: 14 }}>Đang tải dữ liệu báo cáo hôm nay...</Text>
      </View>
    );
  }

  return (
    <View style={styles.rootContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#102739" />

      {/* Leader / Custom Header Slot */}
      {typeof headerSlot === 'function' ? headerSlot({ currentStep }) : headerSlot}

      {/* Default Modern Deep Navy Banner when no custom headerSlot is provided */}
      {!headerSlot && !hideHeaderTitle && (
        <View style={[styles.headerBanner, { paddingTop: Math.max(insets.top, 16) }]}>
          <View style={styles.headerTopBar}>
            <Pressable
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/employee');
                }
              }}
              style={styles.headerBackBtn}
              hitSlop={12}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </Pressable>

            <Text style={styles.headerBrandText}>MOVIE LEGEND</Text>

            <View style={styles.headerStatusBadge}>
              <Text style={styles.headerStatusBadgeText}>
                {reportData?.status === 'REVIEWED'
                  ? 'Đã duyệt'
                  : reportData?.status === 'SUBMITTED'
                  ? 'Đã gửi'
                  : 'Bản mẫu'}
              </Text>
            </View>
          </View>

          <Text style={styles.headerMainTitle}>
            {currentStep === 2 ? 'Xem lại báo cáo' : 'Báo cáo cuối ngày'}
          </Text>
          <Text style={styles.headerDateSubtitle}>
            {currentStep === 2 ? 'Kiểm tra toàn bộ nội dung trước khi nộp.' : displayDate}
          </Text>
        </View>
      )}

      {/* Curved Sheet with Light Slate Background extending to bottom */}
      <View style={styles.bodySheet}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
        >
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: Math.max(insets.bottom + 28, 48) },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Optional top content slot (e.g. Scope Switcher for leader) */}
            {topContentSlot}

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
              color={activeTab === 'write' ? '#0F172A' : '#64748B'}
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
              color={activeTab === 'approved' ? '#0F172A' : '#64748B'}
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
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="calendar-outline" size={15} color="#64748B" />
                  <Text style={styles.personCardDate}>{displayDate}</Text>
                </View>
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

            {/* STEP INDICATOR (01 Hôm nay ── 02 Ngày mai ── 03 Xem lại) */}
            <View style={styles.stepIndicatorRow}>
              {/* Step 0 */}
              <Pressable
                style={styles.stepItemPressable}
                onPress={() => setCurrentStep(0)}
              >
                <View style={[
                  styles.stepCircle,
                  currentStep === 0 && styles.stepCircleActive,
                  currentStep > 0 && styles.stepCircleDone,
                ]}>
                  {currentStep > 0 ? (
                    <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                  ) : (
                    <Text style={[styles.stepCircleText, currentStep === 0 && styles.stepCircleTextActive]}>1</Text>
                  )}
                </View>
                <Text style={[styles.stepLabelText, currentStep === 0 && styles.stepLabelTextActive]}>
                  Hôm nay
                </Text>
              </Pressable>

              <View style={[styles.stepConnectorLine, currentStep >= 1 && styles.stepConnectorLineActive]} />

              {/* Step 1 */}
              <Pressable
                style={styles.stepItemPressable}
                onPress={() => setCurrentStep(1)}
              >
                <View style={[
                  styles.stepCircle,
                  currentStep === 1 && styles.stepCircleActive,
                  currentStep > 1 && styles.stepCircleDone,
                ]}>
                  {currentStep > 1 ? (
                    <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                  ) : (
                    <Text style={[styles.stepCircleText, currentStep === 1 && styles.stepCircleTextActive]}>2</Text>
                  )}
                </View>
                <Text style={[styles.stepLabelText, currentStep === 1 && styles.stepLabelTextActive]}>
                  Ngày mai
                </Text>
              </Pressable>

              <View style={[styles.stepConnectorLine, currentStep >= 2 && styles.stepConnectorLineActive]} />

              {/* Step 2 */}
              <Pressable
                style={styles.stepItemPressable}
                onPress={() => setCurrentStep(2)}
              >
                <View style={[
                  styles.stepCircle,
                  currentStep === 2 && styles.stepCircleActive,
                ]}>
                  <Text style={[styles.stepCircleText, currentStep === 2 && styles.stepCircleTextActive]}>3</Text>
                </View>
                <Text style={[styles.stepLabelText, currentStep === 2 && styles.stepLabelTextActive]}>
                  Xem lại
                </Text>
              </Pressable>
            </View>

            {/* PANEL 0: HÔM NAY */}
            {currentStep === 0 && (
              <View style={styles.panelContainer}>
                {/* BANNER ĐỒNG BỘ VỚI BẢNG EXCEL WEB */}
                <View style={styles.syncBanner}>
                  <View style={styles.syncBannerLeft}>
                    <View style={styles.syncIconBox}>
                      <Ionicons name="cloud-done-outline" size={20} color="#0284C7" />
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.syncBannerTitle}>Đồng bộ từ bảng Web</Text>
                        <View style={styles.syncStatusLiveBadge}>
                          <Text style={styles.syncStatusLiveText}>1:1 Web</Text>
                        </View>
                      </View>
                      <Text style={styles.syncBannerSubtitle}>
                        Đầy đủ hạng mục, loại việc, độ ưu tiên & tiến độ từ Web
                      </Text>
                    </View>
                  </View>
                  {!isSubmittedToday && (
                    <TouchableOpacity
                      style={styles.syncRefreshBtn}
                      onPress={() => handleSyncFromWeb(false)}
                      disabled={isSyncingFromWeb}
                      activeOpacity={0.7}
                    >
                      {isSyncingFromWeb ? (
                        <ActivityIndicator size="small" color="#0284C7" />
                      ) : (
                        <Ionicons name="sync-outline" size={16} color="#0284C7" />
                      )}
                      <Text style={styles.syncRefreshBtnText}>
                        {isSyncingFromWeb ? 'Đang kéo…' : 'Đồng bộ'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* KHỐI CÔNG VIỆC & NHIỆM VỤ HÔM NAY (HỢP NHẤT) */}
                <View style={styles.sectionCard}>
                  <View style={styles.sectionCardHeaderRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.sectionCardTitle}>Công việc & Nhiệm vụ hôm nay</Text>
                      <Text style={styles.sectionCardSubtitle}>
                        {isSubmittedToday
                          ? 'Danh sách công việc và trạng thái đã ghi nhận hôm nay.'
                          : 'Ghi nhận tiến độ công việc trong ngày. Việc chưa hoàn thành sẽ tự động chuyển sang ngày mai.'}
                      </Text>
                    </View>
                    <View style={styles.countBadge}>
                      <Text style={styles.countBadgeText}>
                        {metrics.filter((m) => (m.name || '').trim().length > 0).length} việc
                      </Text>
                    </View>
                  </View>

                  {metrics.length === 0 ? (
                    <View style={styles.emptyContainerDashed}>
                      <Ionicons name="document-text-outline" size={32} color="#94A3B8" />
                      <Text style={styles.emptyPromptText}>Chưa có công việc nào. Nhấn "+ Thêm nhiệm vụ" để bắt đầu.</Text>
                    </View>
                  ) : (
                    metrics.map((m, idx) => {
                      const metricKey = `m_${idx}`;
                      const isExpanded = !!expandedTasks[metricKey];
                      const typeObj = TASK_TYPES.find((tt) => tt.value === m.taskType) || TASK_TYPES[0];
                      const prioObj = TASK_PRIORITIES.find((tp) => tp.value === m.priority) || TASK_PRIORITIES[1];
                      const currentStatus = m.status || (Number(m.progress) === 100 ? 'DONE' : 'IN_PROGRESS');

                      return (
                        <View key={idx} style={styles.quantItemBox}>
                          {/* Item Header */}
                          <View style={styles.quantItemHeader}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', flex: 1 }}>
                              <Text style={styles.quantNumberText}>NHIỆM VỤ {String(idx + 1).padStart(2, '0')}</Text>

                              {m.isCarriedOver && (
                                <View style={styles.carriedOverBadge}>
                                  <Ionicons name="refresh-outline" size={11} color="#B45309" />
                                  <Text style={styles.carriedOverBadgeText}>Dở dang hôm qua</Text>
                                </View>
                              )}

                              {m.taskId ? (
                                <View style={styles.webBadge}>
                                  <Ionicons name="globe-outline" size={10} color="#0284C7" />
                                  <Text style={styles.webBadgeText}>Web{m.taskCode ? ` · ${m.taskCode}` : ''}</Text>
                                </View>
                              ) : null}
                            </View>

                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <TouchableOpacity
                                style={styles.expandToggleBtn}
                                onPress={() => toggleTaskExpand(metricKey)}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                              >
                                <Ionicons
                                  name={isExpanded ? 'chevron-up-circle' : 'chevron-down-circle-outline'}
                                  size={20}
                                  color={isExpanded ? '#166534' : '#64748B'}
                                />
                              </TouchableOpacity>

                              {!isSubmittedToday && metrics.length > 1 && (
                                <TouchableOpacity
                                  onPress={() => handleDeleteMetric(idx)}
                                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                  style={{ marginLeft: 4 }}
                                >
                                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                                </TouchableOpacity>
                              )}
                            </View>
                          </View>

                          {/* Tên công việc / nhiệm vụ */}
                          <Text style={styles.inputLabel}>Tên công việc / Nhiệm vụ</Text>
                          <TextInput
                            style={[styles.textInput, isSubmittedToday && styles.readOnlyInput]}
                            placeholder="Ví dụ: Gọi điện khách hàng, hoàn thiện báo giá, fix bug..."
                            placeholderTextColor="#94A3B8"
                            value={m.name || m.title || ''}
                            onChangeText={(v) => {
                              handleUpdateMetric(idx, 'name', v);
                              handleUpdateMetric(idx, 'title', v);
                            }}
                            editable={!isSubmittedToday}
                          />

                          {/* Bộ chọn trạng thái 4 nút */}
                          <Text style={[styles.inputLabel, { marginTop: 8 }]}>Trạng thái công việc</Text>
                          <View style={styles.statusRowContainer}>
                            {TASK_STATUSES.map((st) => {
                              const isActive = currentStatus === st.value;
                              return (
                                <TouchableOpacity
                                  key={st.value}
                                  style={[
                                    styles.statusPillItem,
                                    isActive && {
                                      backgroundColor: st.bg,
                                      borderColor: st.border,
                                      borderWidth: 1.5,
                                    },
                                  ]}
                                  onPress={() => handleSetMetricStatus(idx, st.value)}
                                  disabled={isSubmittedToday}
                                  activeOpacity={0.7}
                                >
                                  <Ionicons
                                    name={st.icon}
                                    size={14}
                                    color={isActive ? st.color : '#64748B'}
                                  />
                                  <Text
                                    style={[
                                      styles.statusPillText,
                                      isActive && { color: st.color, fontWeight: '700' },
                                    ]}
                                    numberOfLines={1}
                                  >
                                    {st.label}
                                  </Text>
                                </TouchableOpacity>
                              );
                            })}
                          </View>

                          {/* Thanh tiến độ (%) */}
                          <View style={styles.progressRow}>
                            <Text style={[styles.inputLabel, { marginTop: 0, marginBottom: 0 }]}>
                              Tiến độ:
                            </Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 }}>
                              {[25, 50, 75, 100].map((pct) => {
                                const isPctActive = Number(m.progress) === pct;
                                return (
                                  <TouchableOpacity
                                    key={pct}
                                    style={[
                                      styles.progressPill,
                                      isPctActive && styles.progressPillActive,
                                    ]}
                                    onPress={() => handleSetMetricProgress(idx, pct)}
                                    disabled={isSubmittedToday}
                                  >
                                    <Text
                                      style={[
                                        styles.progressPillText,
                                        isPctActive && styles.progressPillTextActive,
                                      ]}
                                    >
                                      {pct}%
                                    </Text>
                                  </TouchableOpacity>
                                );
                              })}
                            </View>
                            <View style={{ width: 64 }}>
                              <TextInput
                                style={[
                                  styles.textInput,
                                  isSubmittedToday && styles.readOnlyInput,
                                  { paddingVertical: 4, paddingHorizontal: 6, textAlign: 'center', fontSize: 12 },
                                ]}
                                placeholder="%"
                                placeholderTextColor="#94A3B8"
                                keyboardType="numeric"
                                value={m.progress !== undefined && m.progress !== null ? String(m.progress) : ''}
                                onChangeText={(v) => {
                                  const num = parseInt(v, 10);
                                  handleSetMetricProgress(idx, isNaN(num) ? 0 : num);
                                }}
                                editable={!isSubmittedToday}
                              />
                            </View>
                          </View>

                          {/* Chi tiết công việc & Hạn chót */}
                          <Text style={[styles.inputLabel, { marginTop: 6 }]}>Chi tiết công việc</Text>
                          <TextInput
                            style={[styles.textAreaInput, isSubmittedToday && styles.readOnlyInput, { minHeight: 48, marginBottom: 4 }]}
                            placeholder="Mô tả cụ thể nội dung công việc thực hiện…"
                            placeholderTextColor="#94A3B8"
                            multiline
                            numberOfLines={2}
                            value={m.description || ''}
                            onChangeText={(v) => handleUpdateMetric(idx, 'description', v)}
                            editable={!isSubmittedToday}
                          />

                          <View style={styles.quantPairRow}>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.inputLabel}>Kết quả (nếu có số liệu)</Text>
                              <TextInput
                                style={[styles.textInput, isSubmittedToday && styles.readOnlyInput]}
                                placeholder="Ví dụ: 10, 500k…"
                                placeholderTextColor="#94A3B8"
                                value={String(m.value ?? '')}
                                onChangeText={(v) => handleUpdateMetric(idx, 'value', v)}
                                editable={!isSubmittedToday}
                              />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.inputLabel}>Đơn vị tính</Text>
                              <TextInput
                                style={[styles.textInput, isSubmittedToday && styles.readOnlyInput]}
                                placeholder="Khách, Đơn, Lỗi…"
                                placeholderTextColor="#94A3B8"
                                value={m.unit || ''}
                                onChangeText={(v) => handleUpdateMetric(idx, 'unit', v)}
                                editable={!isSubmittedToday}
                              />
                            </View>
                          </View>

                          <Text style={[styles.inputLabel, { marginTop: 6 }]}>Hạn chót (Deadline)</Text>
                          <View style={styles.dateInputWrapper}>
                            <TextInput
                              style={[styles.textInput, styles.dateInputWithBtn, isSubmittedToday && styles.readOnlyInput]}
                              placeholder="Ví dụ: 2026-10-17, 17:30, Hôm nay…"
                              placeholderTextColor="#94A3B8"
                              value={m.deadline || ''}
                              onChangeText={(v) => handleUpdateMetric(idx, 'deadline', v)}
                              editable={!isSubmittedToday}
                            />
                            {!isSubmittedToday && (
                              <TouchableOpacity
                                style={styles.datePickerBtn}
                                onPress={() => handleOpenDatePicker('metric', idx, m.deadline)}
                                activeOpacity={0.7}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                              >
                                <Ionicons name="calendar-outline" size={18} color="#166534" />
                              </TouchableOpacity>
                            )}
                          </View>

                          {/* Badges / Chips hàng ngang tóm tắt */}
                          <View style={[styles.taskMetaRow, { marginTop: 8 }]}>
                            <View style={[styles.metaChip, { backgroundColor: '#F1F5F9' }]}>
                              <Text style={styles.metaChipText}>{m.category || 'Vận hành'}</Text>
                            </View>
                            <View style={[styles.metaChip, { backgroundColor: typeObj?.bg || '#F1F5F9' }]}>
                              <Text style={[styles.metaChipText, { color: typeObj?.color || '#334155' }]}>
                                {typeObj?.label || 'Kế hoạch'}
                              </Text>
                            </View>
                            <View style={[styles.metaChip, { backgroundColor: prioObj?.bg || '#FEF3C7' }]}>
                              <Text style={[styles.metaChipText, { color: prioObj?.color || '#D97706' }]}>
                                {prioObj?.label || 'Trung bình'}
                              </Text>
                            </View>
                          </View>

                          {/* Chi tiết mở rộng (Drawer) */}
                          {isExpanded && (
                            <View style={styles.expandedDetailsDrawer}>
                              {/* 1. Hạng mục */}
                              <Text style={styles.drawerFieldLabel}>Hạng mục công việc (Nhập tên hoặc chọn gợi ý)</Text>
                              <TextInput
                                style={[styles.drawerInput, isSubmittedToday && styles.readOnlyInput, { marginBottom: 6 }]}
                                placeholder="Nhập tên hạng mục tự do…"
                                placeholderTextColor="#94A3B8"
                                value={m.category || ''}
                                onChangeText={(v) => handleUpdateMetric(idx, 'category', v)}
                                editable={!isSubmittedToday}
                              />
                              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScrollView}>
                                <View style={styles.chipScrollInner}>
                                  {TASK_CATEGORIES.map((cat) => {
                                    const isCatActive = (m.category || '') === cat;
                                    return (
                                      <TouchableOpacity
                                        key={cat}
                                        style={[styles.drawerPill, isCatActive && styles.drawerPillActive]}
                                        onPress={() => handleUpdateMetric(idx, 'category', cat)}
                                        disabled={isSubmittedToday}
                                      >
                                        <Text style={[styles.drawerPillText, isCatActive && styles.drawerPillTextActive]}>
                                          {cat}
                                        </Text>
                                      </TouchableOpacity>
                                    );
                                  })}
                                </View>
                              </ScrollView>

                              {/* 2. Loại việc */}
                              <Text style={styles.drawerFieldLabel}>Loại việc</Text>
                              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScrollView}>
                                <View style={styles.chipScrollInner}>
                                  {TASK_TYPES.map((tt) => {
                                    const isTypeActive = (m.taskType || 'THEO_KE_HOACH') === tt.value;
                                    return (
                                      <TouchableOpacity
                                        key={tt.value}
                                        style={[styles.drawerPill, isTypeActive && { backgroundColor: tt.bg, borderColor: tt.color }]}
                                        onPress={() => handleUpdateMetric(idx, 'taskType', tt.value)}
                                        disabled={isSubmittedToday}
                                      >
                                        <Text style={[styles.drawerPillText, isTypeActive && { color: tt.color, fontWeight: '700' }]}>
                                          {tt.label}
                                        </Text>
                                      </TouchableOpacity>
                                    );
                                  })}
                                </View>
                              </ScrollView>

                              {/* 3. Mức độ ưu tiên */}
                              <Text style={styles.drawerFieldLabel}>Mức độ ưu tiên</Text>
                              <View style={styles.priorityRowContainer}>
                                {TASK_PRIORITIES.map((tp) => {
                                  const isPrioActive = (m.priority || 'MEDIUM') === tp.value;
                                  return (
                                    <TouchableOpacity
                                      key={tp.value}
                                      style={[
                                        styles.priorityPillItem,
                                        isPrioActive && { backgroundColor: tp.bg, borderColor: tp.color, borderWidth: 1.5 },
                                      ]}
                                      onPress={() => handleUpdateMetric(idx, 'priority', tp.value)}
                                      disabled={isSubmittedToday}
                                    >
                                      <Text style={[styles.priorityPillText, isPrioActive && { color: tp.color, fontWeight: '700' }]}>
                                        {tp.label}
                                      </Text>
                                    </TouchableOpacity>
                                  );
                                })}
                              </View>

                              {/* 4. Khó khăn / Vướng mắc */}
                              <Text style={styles.drawerFieldLabel}>Khó khăn / Vướng mắc (nếu có)</Text>
                              <TextInput
                                style={[styles.drawerInput, isSubmittedToday && styles.readOnlyInput]}
                                placeholder="Khó khăn khi thực hiện nhiệm vụ này…"
                                placeholderTextColor="#94A3B8"
                                value={m.obstacles || ''}
                                onChangeText={(v) => handleUpdateMetric(idx, 'obstacles', v)}
                                editable={!isSubmittedToday}
                              />

                              {/* 5. Đề xuất hỗ trợ */}
                              <Text style={[styles.drawerFieldLabel, { marginTop: 6 }]}>Đề xuất hỗ trợ (nếu có)</Text>
                              <TextInput
                                style={[styles.drawerInput, isSubmittedToday && styles.readOnlyInput]}
                                placeholder="Cần Leader hoặc bộ phận khác hỗ trợ gì…"
                                placeholderTextColor="#94A3B8"
                                value={m.supportRequest || ''}
                                onChangeText={(v) => handleUpdateMetric(idx, 'supportRequest', v)}
                                editable={!isSubmittedToday}
                              />

                              {/* 6. Ghi chú thêm */}
                              <Text style={[styles.drawerFieldLabel, { marginTop: 6 }]}>Ghi chú thêm</Text>
                              <TextInput
                                style={[styles.drawerInput, isSubmittedToday && styles.readOnlyInput]}
                                placeholder="Ghi chú chi tiết thêm…"
                                placeholderTextColor="#94A3B8"
                                value={m.notes || m.note || ''}
                                onChangeText={(v) => {
                                  handleUpdateMetric(idx, 'note', v);
                                  handleUpdateMetric(idx, 'notes', v);
                                }}
                                editable={!isSubmittedToday}
                              />
                            </View>
                          )}
                        </View>
                      );
                    })
                  )}

                  {!isSubmittedToday && (
                    <TouchableOpacity style={styles.dashedAddBtn} onPress={handleAddMetric} activeOpacity={0.7}>
                      <Ionicons name="add" size={18} color="#166534" />
                      <Text style={styles.dashedAddBtnText}>Thêm nhiệm vụ</Text>
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
                    <TouchableOpacity style={styles.dashedAddBtn} onPress={handleAddPlanItem} activeOpacity={0.7}>
                      <Ionicons name="add" size={18} color="#166534" />
                      <Text style={styles.dashedAddBtnText}>Thêm đầu việc ngày mai</Text>
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
                      onValueChange={(val: boolean) => {
                        if (!isSubmittedToday) setHasObstacles(val);
                      }}
                      trackColor={{ false: '#CBD5E1', true: '#86EFAC' }}
                      thumbColor={hasObstacles ? '#166534' : '#FFFFFF'}
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
                            size={34}
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

                  {!isSubmittedToday && (
                    <View style={styles.attachBtnRow}>
                      <TouchableOpacity
                        style={styles.attachBtn}
                        onPress={handlePickImage}
                        disabled={isUploadingFile}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="image-outline" size={18} color="#166534" />
                        <Text style={styles.attachBtnText}>Thêm ảnh</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.attachBtn}
                        onPress={handlePickDocument}
                        disabled={isUploadingFile}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="document-text-outline" size={18} color="#166534" />
                        <Text style={styles.attachBtnText}>Thêm tài liệu</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Attachments List */}
                  {attachments.length > 0 ? (
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
                              color="#166534"
                            />
                            <View style={{ flex: 1, marginLeft: 10 }}>
                              <Text style={styles.attachmentFileName} numberOfLines={1}>
                                {a.fileName || `Tệp ${idx + 1}`}
                              </Text>
                              <Text style={styles.attachmentFileType}>
                                {a.fileType === 'IMAGE' ? 'Hình ảnh · Nhấn để xem' : 'Tài liệu · Nhấn để xem'}
                              </Text>
                            </View>
                            <Ionicons name="eye-outline" size={18} color="#166534" />
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
                  ) : (
                    <View style={styles.emptyContainerDashed}>
                      <Ionicons name="cloud-upload-outline" size={32} color="#94A3B8" />
                      <Text style={styles.emptyPromptText}>Chưa có tệp đính kèm. Nhấn nút bên trên để thêm ảnh hoặc tài liệu.</Text>
                    </View>
                  )}

                  {isUploadingFile && (
                    <View style={styles.uploadingBox}>
                      <ActivityIndicator size="small" color="#166534" />
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
                    {/* CÔNG VIỆC & NHIỆM VỤ HÔM NAY */}
                    <View style={styles.summaryBoxItem}>
                      <View style={styles.summaryBoxHeaderRow}>
                        <Text style={styles.summaryBoxTitle}>CÔNG VIỆC & NHIỆM VỤ HÔM NAY</Text>
                        <View style={styles.summaryBoxCountBadge}>
                          <Text style={styles.summaryBoxCountText}>
                            {metrics.filter((m) => (m.name || '').trim().length > 0).length}
                          </Text>
                        </View>
                      </View>
                      {metrics.filter((m) => (m.name || '').trim().length > 0).length === 0 ? (
                        <Text style={styles.summaryBoxEmptyText}>Chưa có công việc nào</Text>
                      ) : (
                        metrics
                          .filter((m) => (m.name || '').trim().length > 0)
                          .map((m, idx) => {
                            const isDone = m.status === 'DONE';
                            const statusObj = TASK_STATUSES.find((s) => s.value === m.status) || TASK_STATUSES[1]!;
                            return (
                              <View key={idx} style={{ marginBottom: 6 }}>
                                <Text style={styles.summaryBoxContentText}>
                                  {isDone ? '✓' : '🕒'} <Text style={{ fontWeight: '700' }}>{m.name || m.title}</Text>
                                  {m.value ? ` · Số liệu: ${m.value} ${m.unit || ''}` : ''}
                                </Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2, flexWrap: 'wrap' }}>
                                  <View style={[styles.metaChip, { backgroundColor: statusObj.bg }]}>
                                    <Text style={[styles.metaChipText, { color: statusObj.color, fontWeight: '700' }]}>
                                      {statusObj.label} ({m.progress ?? (isDone ? 100 : 50)}%)
                                    </Text>
                                  </View>
                                  {m.isCarriedOver && (
                                    <View style={styles.carriedOverBadge}>
                                      <Text style={styles.carriedOverBadgeText}>Dở dang hôm qua</Text>
                                    </View>
                                  )}
                                  {m.deadline ? (
                                    <Text style={{ fontSize: 11, color: '#64748B' }}>
                                      Hạn chót: {m.deadline}
                                    </Text>
                                  ) : null}
                                </View>
                              </View>
                            );
                          })
                      )}
                    </View>

                    {/* 4. Ngày mai */}
                    <View style={styles.summaryBoxItem}>
                      <View style={styles.summaryBoxHeaderRow}>
                        <Text style={styles.summaryBoxTitle}>KẾ HOẠCH NGÀY MAI</Text>
                        <View style={styles.summaryBoxCountBadge}>
                          <Text style={styles.summaryBoxCountText}>
                            {tomorrowPlan.filter((p) => p.trim()).length}
                          </Text>
                        </View>
                      </View>
                      {tomorrowPlan.filter((p) => p.trim()).length === 0 ? (
                        <Text style={styles.summaryBoxEmptyText}>Chưa thêm kế hoạch ngày mai</Text>
                      ) : (
                        tomorrowPlan
                          .filter((p) => p.trim())
                          .map((p, idx) => (
                            <Text key={idx} style={styles.summaryBoxContentText}>
                              {idx + 1}. {p}
                            </Text>
                          ))
                      )}
                    </View>

                    {/* 5. Hỗ trợ */}
                    <View style={styles.summaryBoxItem}>
                      <View style={styles.summaryBoxHeaderRow}>
                        <Text style={styles.summaryBoxTitle}>VƯỚNG MẮC & HỖ TRỢ</Text>
                      </View>
                      {hasObstacles ? (
                        <View style={{ gap: 2 }}>
                          <Text style={styles.summaryBoxContentText}>
                            • <Text style={{ fontWeight: '700' }}>Vướng mắc:</Text> {obstacleText.trim() || 'Có vướng mắc'}
                          </Text>
                          {supportWish.trim() ? (
                            <Text style={styles.summaryBoxContentText}>
                              • <Text style={{ fontWeight: '700' }}>Đề xuất hỗ trợ:</Text> {supportWish.trim()}
                            </Text>
                          ) : null}
                        </View>
                      ) : (
                        <Text style={styles.summaryBoxEmptyText}>Không có vướng mắc ghi nhận</Text>
                      )}
                    </View>

                    {/* 6. Tự đánh giá */}
                    <View style={styles.summaryBoxItem}>
                      <View style={styles.summaryBoxHeaderRow}>
                        <Text style={styles.summaryBoxTitle}>TỰ ĐÁNH GIÁ</Text>
                      </View>
                      <Text style={styles.summaryBoxContentText}>
                        ★ <Text style={{ fontWeight: '700' }}>{selfRating}/5 sao</Text> · {currentAssessment.title}
                      </Text>
                      {selfReview.trim() ? (
                        <Text style={[styles.summaryBoxContentText, { marginTop: 4, fontStyle: 'italic', color: '#475569' }]}>
                          "{selfReview.trim()}"
                        </Text>
                      ) : null}
                    </View>

                    {/* 7. Đính kèm */}
                    <View style={styles.summaryBoxItem}>
                      <View style={styles.summaryBoxHeaderRow}>
                        <Text style={styles.summaryBoxTitle}>ĐÍNH KÈM</Text>
                        <View style={styles.summaryBoxCountBadge}>
                          <Text style={styles.summaryBoxCountText}>{attachments.length}</Text>
                        </View>
                      </View>
                      {attachments.length === 0 ? (
                        <Text style={styles.summaryBoxEmptyText}>Không có tệp đính kèm</Text>
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
                                color="#166534"
                              />
                              <Text style={styles.reviewAttachChipText} numberOfLines={1}>
                                {a.fileName || `Tệp ${idx + 1}`}
                              </Text>
                              <Ionicons name="eye-outline" size={14} color="#166534" />
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
                    <View style={[styles.confirmCheckBox, isConfirmed && styles.confirmCheckBoxActive]}>
                      {isConfirmed && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
                    </View>
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
                      <View key={idx} style={[styles.historyDetailMetricRow, { flexDirection: 'column', alignItems: 'flex-start', gap: 4, paddingVertical: 8 }]}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                          <Text style={styles.historyDetailMetricName}>{m.name}</Text>
                          <Text style={styles.historyDetailMetricValue}>
                            {m.value || '0'} {m.unit || ''}
                          </Text>
                        </View>
                        {m.description ? (
                          <Text style={{ fontSize: 12, color: '#475569' }}>Chi tiết: {m.description}</Text>
                        ) : null}
                        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 2 }}>
                          {m.category ? (
                            <View style={[styles.metaChip, { backgroundColor: '#F1F5F9' }]}>
                              <Text style={styles.metaChipText}>{m.category}</Text>
                            </View>
                          ) : null}
                          {m.deadline ? (
                            <View style={[styles.metaChip, { backgroundColor: '#FEF3C7' }]}>
                              <Text style={[styles.metaChipText, { color: '#D97706' }]}>Hạn: {m.deadline}</Text>
                            </View>
                          ) : null}
                        </View>
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
                    <View style={styles.emptyApprovedHalo}>
                      <View style={styles.emptyApprovedIconInner}>
                        <MaterialCommunityIcons name="shield-check" size={32} color="#15803D" />
                      </View>
                    </View>
                    <Text style={styles.emptyApprovedTitle}>Chưa có báo cáo nào được duyệt</Text>
                    <Text style={styles.emptyApprovedSub}>
                      Báo cáo sau khi được Quản lý hoặc Admin đánh giá và cho điểm sẽ được lưu trữ đầy đủ tại đây.
                    </Text>

                    <TouchableOpacity
                      style={styles.emptyApprovedActionBtn}
                      onPress={() => {
                        setActiveTab('write');
                        setSelectedApprovedReport(null);
                      }}
                      activeOpacity={0.8}
                    >
                      <MaterialCommunityIcons name="pencil-outline" size={16} color="#FFFFFF" />
                      <Text style={styles.emptyApprovedActionBtnText}>
                        {isSubmittedToday ? 'Xem báo cáo hôm nay' : 'Viết báo cáo hôm nay'}
                      </Text>
                    </TouchableOpacity>

                    <View style={styles.emptyApprovedTipBox}>
                      <MaterialCommunityIcons name="lightbulb-on-outline" size={16} color="#B45309" />
                      <Text style={styles.emptyApprovedTipText}>
                        Nộp báo cáo trước 18:00 hàng ngày để quản lý xem và duyệt kịp thời.
                      </Text>
                    </View>
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
          </ScrollView>
        </KeyboardAvoidingView>
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

      {/* ========================================================================= */}
      {/* DATE PICKER MODAL (CHỌN LỊCH HẠN CHÓT)                                    */}
      {/* ========================================================================= */}
      <CustomDatePickerModal
        visible={!!activeDatePicker}
        onClose={() => setActiveDatePicker(null)}
        onSelect={handleSelectDate}
        initialDate={activeDatePicker?.initialDate}
      />
    </View>
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

  // ROOT & SHEETS
  rootContainer: {
    flex: 1,
    backgroundColor: '#102739',
  },
  headerBanner: {
    backgroundColor: '#102739',
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  headerTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBackBtn: {
    padding: 4,
    marginLeft: -4,
  },
  headerBrandText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
  },
  headerStatusBadge: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  headerStatusBadgeText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  headerMainTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 12,
    letterSpacing: -0.3,
  },
  headerDateSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  bodySheet: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  // HEADER (Legacy fallback)
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
    backgroundColor: '#E2E8F0',
    padding: 4,
    borderRadius: 14,
    marginBottom: 16,
    gap: 4,
  },
  mainSegmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
    backgroundColor: 'transparent',
  },
  mainSegmentBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  mainSegmentBtnText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#64748B',
  },
  mainSegmentBtnTextActive: {
    color: '#0F172A',
    fontWeight: '700',
  },
  mainSegmentCountBadge: {
    backgroundColor: '#CBD5E1',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  mainSegmentCountBadgeActive: {
    backgroundColor: '#DCFCE7',
  },
  mainSegmentCountText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#475569',
  },
  mainSegmentCountTextActive: {
    color: '#15803D',
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
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitialsText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#102739',
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
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FDBA74',
  },
  statusBadgeSubmitted: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
  },
  statusBadgeReviewed: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EA580C',
  },
  statusBadgeTextSubmitted: {
    color: '#16A34A',
  },
  statusBadgeTextReviewed: {
    color: '#16A34A',
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

  // STEP INDICATOR
  stepIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E9EDF2',
  },
  stepItemPressable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    backgroundColor: '#102739',
  },
  stepCircleDone: {
    backgroundColor: '#1D4ED8',
  },
  stepCircleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  stepCircleTextActive: {
    color: '#FFFFFF',
  },
  stepLabelText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
  },
  stepLabelTextActive: {
    fontWeight: '700',
    color: '#102739',
  },
  stepConnectorLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 8,
    borderRadius: 1,
  },
  stepConnectorLineActive: {
    backgroundColor: '#1D4ED8',
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
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
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
  dateInputWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  dateInputWithBtn: {
    paddingRight: 42,
  },
  datePickerBtn: {
    position: 'absolute',
    right: 8,
    top: 6,
    width: 30,
    height: 30,
    borderRadius: 7,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  quantPairRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dashedAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#166534',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 8,
    gap: 6,
  },
  dashedAddBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#166534',
  },
  emptyContainerDashed: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    marginVertical: 8,
    gap: 8,
  },

  // SYNC BANNER
  syncBanner: {
    backgroundColor: '#F0F9FF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  syncBannerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  syncIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0369A1',
  },
  syncStatusLiveBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  syncStatusLiveText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#0284C7',
  },
  syncBannerSubtitle: {
    fontSize: 11,
    color: '#0284C7',
    marginTop: 2,
  },
  syncRefreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 4,
  },
  syncRefreshBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
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
  taskCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
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
  taskMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 6,
    alignItems: 'center',
  },
  webBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  webBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0284C7',
  },
  manualBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  manualBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  metaChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  metaChipText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#334155',
  },
  taskRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 6,
    marginTop: 2,
  },
  expandToggleBtn: {
    padding: 2,
  },
  expandedDetailsDrawer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
  },
  drawerFieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginTop: 6,
    marginBottom: 4,
  },
  chipScrollView: {
    marginBottom: 4,
  },
  chipScrollInner: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 2,
  },
  drawerPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  drawerPillActive: {
    backgroundColor: '#DCFCE7',
    borderColor: '#166534',
  },
  drawerPillText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  drawerPillTextActive: {
    color: '#166534',
    fontWeight: '700',
  },
  priorityRowContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  priorityPillItem: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  priorityPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  drawerInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    color: '#1E293B',
    marginBottom: 4,
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
    color: '#166534',
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
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#DCFCE7',
    color: '#166534',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 24,
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
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  assessmentLevelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  assessmentLevelBadge: {
    backgroundColor: '#FDE68A',
    color: '#92400E',
    fontSize: 10,
    fontWeight: '800',
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
    color: '#78350F',
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
    marginBottom: 10,
  },
  attachBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 6,
  },
  attachBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#166534',
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
    color: '#166534',
  },

  // SUMMARY REVIEW
  statusRowContainer: {
    flexDirection: 'row',
    gap: 6,
    marginVertical: 6,
  },
  statusPillItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    paddingHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    gap: 4,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    marginBottom: 4,
  },
  progressPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  progressPillActive: {
    backgroundColor: '#DBEAFE',
    borderColor: '#3B82F6',
  },
  progressPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  progressPillTextActive: {
    color: '#1D4ED8',
    fontWeight: '700',
  },
  carriedOverBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  carriedOverBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
  },
  summaryTable: {
    gap: 10,
  },
  summaryBoxItem: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  summaryBoxHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryBoxTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  summaryBoxCountBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  summaryBoxCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  summaryBoxContentText: {
    fontSize: 13,
    color: '#1E293B',
    lineHeight: 20,
  },
  summaryBoxEmptyText: {
    fontSize: 13,
    color: '#94A3B8',
    fontStyle: 'italic',
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
    gap: 12,
    marginTop: 10,
  },
  confirmCheckBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  confirmCheckBoxActive: {
    backgroundColor: '#166534',
    borderColor: '#166534',
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
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerSecondaryBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  footerPrimaryBtn: {
    flex: 1.5,
    backgroundColor: '#102739',
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 12,
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
    borderRadius: 20,
    paddingVertical: 36,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 4,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  emptyApprovedHalo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyApprovedIconInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyApprovedTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyApprovedSub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 300,
  },
  emptyApprovedActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#102739',
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 12,
    marginTop: 20,
    shadowColor: '#102739',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyApprovedActionBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13.5,
  },
  emptyApprovedTipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FEF3C7',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 20,
    width: '100%',
  },
  emptyApprovedTipText: {
    fontSize: 12,
    color: '#92400E',
    lineHeight: 17,
    flex: 1,
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
