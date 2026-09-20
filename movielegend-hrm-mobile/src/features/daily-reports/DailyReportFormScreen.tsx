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
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Screen } from '../../components/Screen';
import { ScreenContainer } from '../../components/ScreenContainer';
import { PageHeader } from '../../components/PageHeader';
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
import { spacing } from '../../theme/spacing';

export function DailyReportFormScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();

  const todayReportQuery = useMyTodayReport();
  const saveReportMutation = useSaveDailyReport();

  const [isInitializing, setIsInitializing] = useState(true);

  // Form State
  const [metrics, setMetrics] = useState<DailyReportMetricItem[]>([
    { name: 'Khách hàng mới / Đã tư vấn', value: '', note: '' },
    { name: 'Đơn hàng thành công', value: '', note: '' },
    { name: 'Doanh số hôm nay (VNĐ)', value: '', note: '' },
    { name: 'Chăm sóc khách hàng / Hỗ trợ', value: '', note: '' },
  ]);
  const [completedTasks, setCompletedTasks] = useState<DailyReportTaskItem[]>([]);
  const [inProgressTasks, setInProgressTasks] = useState<DailyReportTaskItem[]>([]);
  const [obstacles, setObstacles] = useState('');
  const [tomorrowPlan, setTomorrowPlan] = useState<string[]>(['']);
  const [attachments, setAttachments] = useState<DailyReportAttachmentItem[]>([]);
  const [selfRating, setSelfRating] = useState(5);
  const [selfReview, setSelfReview] = useState('');
  const [isConfirmed, setIsConfirmed] = useState(true);
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  const reportData = todayReportQuery.data;

  // Khởi tạo dữ liệu từ Server (hoặc Auto-pull)
  useEffect(() => {
    if (reportData) {
      if (reportData.metrics && reportData.metrics.length > 0) {
        setMetrics(reportData.metrics);
      }
      if (reportData.completedTasks) {
        setCompletedTasks(reportData.completedTasks);
      }
      if (reportData.inProgressTasks) {
        setInProgressTasks(reportData.inProgressTasks);
      }
      if (reportData.obstacles !== undefined && reportData.obstacles !== null) {
        setObstacles(reportData.obstacles);
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

  // Format ngày
  const displayDate = useMemo(() => {
    const d = new Date();
    const dayName = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'][d.getDay()];
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dayName}, ${dd}/${mm}/${yyyy}`;
  }, []);

  const departmentName = reportData?.department?.name || (user as any)?.department?.name || 'Phòng ban';
  const employeeName = reportData?.user?.profile?.fullName || user?.fullName || user?.userCode || 'Nhân sự';
  const roleName = user?.roles?.some((r: any) => r === 'LEADER' || r.name?.toUpperCase().includes('LEADER') || r.role?.code === 'leader')
    ? 'Trưởng phòng'
    : 'Nhân viên';

  // Thêm / Xóa Chỉ tiêu
  const handleAddMetric = () => {
    setMetrics((prev) => [...prev, { name: '', value: '', note: '' }]);
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

  // Thêm / Xóa Việc đã xong
  const handleAddCompletedTask = () => {
    setCompletedTasks((prev) => [...prev, { title: '', status: 'COMPLETED', isManual: true }]);
  };
  const handleUpdateCompletedTask = (index: number, val: string) => {
    setCompletedTasks((prev) => {
      const next = [...prev];
      const item = next[index] || { title: '' };
      next[index] = { ...item, title: val };
      return next;
    });
  };
  const handleDeleteCompletedTask = (index: number) => {
    setCompletedTasks((prev) => prev.filter((_, i) => i !== index));
  };

  // Thêm / Xóa Việc dở dang
  const handleAddInProgressTask = () => {
    setInProgressTasks((prev) => [...prev, { title: '', status: 'IN_PROGRESS', isManual: true, expectedDate: 'Ngày mai' }]);
  };
  const handleUpdateInProgressTask = (index: number, field: keyof DailyReportTaskItem, val: string) => {
    setInProgressTasks((prev) => {
      const next = [...prev];
      const item = next[index] || { title: '' };
      next[index] = { ...item, [field]: val };
      return next;
    });
  };
  const handleDeleteInProgressTask = (index: number) => {
    setInProgressTasks((prev) => prev.filter((_, i) => i !== index));
  };

  // Thêm / Xóa Kế hoạch ngày mai
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

  // Upload File Ảnh
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
      }
    } catch (e: any) {
      console.error('Pick image error:', e);
      Alert.alert('Lỗi', 'Không thể tải ảnh lên, vui lòng thử lại');
    } finally {
      setIsUploadingFile(false);
    }
  };

  // Upload File Tài liệu (PDF/Excel)
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

  // Xử lý gửi hoặc lưu nháp
  const handleSave = async (isDraft: boolean) => {
    if (!isDraft && !isConfirmed) {
      Alert.alert('Chưa xác nhận', 'Vui lòng tích xác nhận nội dung báo cáo trung thực trước khi nộp.');
      return;
    }

    const cleanMetrics = metrics.filter((m) => m.name.trim().length > 0);
    const cleanCompleted = completedTasks.filter((t) => t.title.trim().length > 0);
    const cleanInProgress = inProgressTasks.filter((t) => t.title.trim().length > 0);
    const cleanPlan = tomorrowPlan.filter((p) => p.trim().length > 0);

    if (!isDraft && cleanCompleted.length === 0 && cleanInProgress.length === 0 && cleanMetrics.length === 0) {
      Alert.alert('Báo cáo trống', 'Vui lòng điền ít nhất một kết quả, công việc hoặc kế hoạch.');
      return;
    }

    try {
      await saveReportMutation.mutateAsync({
        metrics: cleanMetrics,
        completedTasks: cleanCompleted,
        inProgressTasks: cleanInProgress,
        obstacles: obstacles.trim() || undefined,
        tomorrowPlan: cleanPlan,
        attachments,
        selfRating,
        selfReview: selfReview.trim() || undefined,
        isDraft,
      });

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

  if (todayReportQuery.isLoading && isInitializing) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={{ marginTop: 12, color: colors.muted, fontSize: 14 }}>Đang tải dữ liệu báo cáo hôm nay...</Text>
      </View>
    );
  }

  const isAlreadyReviewed = reportData?.status === 'REVIEWED';
  const isAlreadySubmitted = reportData?.status === 'SUBMITTED';

  return (
    <Screen>
      <ScreenContainer style={{ paddingBottom: Math.max(insets.bottom + 20, 24) }}>
        <PageHeader
          title="Báo Cáo Cuối Ngày"
          subtitle="Ghi nhận tiến độ và kế hoạch làm việc hàng ngày"
          showBack={true}
        />

        {/* Trạng thái Báo cáo Banner */}
        {isAlreadyReviewed ? (
          <View style={[styles.statusBanner, styles.bannerReviewed]}>
            <MaterialCommunityIcons name="check-decagram" size={24} color="#15803D" />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.bannerReviewedTitle}>Báo cáo đã được duyệt & chấm điểm</Text>
              <Text style={styles.bannerReviewedDesc}>
                Admin/Leader đã đánh giá {reportData?.adminRating} ⭐
                {reportData?.adminReview ? ` - "${reportData.adminReview}"` : ''}
              </Text>
            </View>
          </View>
        ) : isAlreadySubmitted ? (
          <View style={[styles.statusBanner, styles.bannerSubmitted]}>
            <MaterialCommunityIcons name="clock-check-outline" size={24} color="#B45309" />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.bannerSubmittedTitle}>Đã gửi báo cáo hôm nay</Text>
              <Text style={styles.bannerSubmittedDesc}>Bạn có thể chỉnh sửa lại trước khi Admin đánh giá khóa báo cáo.</Text>
            </View>
          </View>
        ) : null}

        {/* KHỐI 1: THÔNG TIN CHUNG (Auto-fill) */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconCirclePrimary}>
              <MaterialCommunityIcons name="card-account-details-outline" size={20} color="#2563EB" />
            </View>
            <Text style={styles.cardTitle}>1. Thông tin chung</Text>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>HỌ VÀ TÊN</Text>
              <Text style={styles.infoValue}>{employeeName}</Text>
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>BỘ PHẬN</Text>
              <Text style={styles.infoValue}>{departmentName}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>VAI TRÒ</Text>
              <Text style={styles.infoValue}>{roleName}</Text>
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>NGÀY BÁO CÁO</Text>
              <Text style={styles.infoValue}>{displayDate}</Text>
            </View>
          </View>
        </View>

        {/* KHỐI 2: KẾT QUẢ CÔNG VIỆC HÔM NAY (Định lượng) */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconCircleSuccess}>
              <MaterialCommunityIcons name="chart-bar" size={20} color="#059669" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>2. Kết quả công việc định lượng</Text>
              <Text style={styles.cardSubtitle}>Chỉ tiêu, doanh số hoặc số liệu đạt được hôm nay</Text>
            </View>
          </View>

          {metrics.map((metric, idx) => (
            <View key={idx} style={styles.metricItemBox}>
              <View style={styles.metricRowTop}>
                <TextInput
                  style={[styles.input, styles.metricNameInput]}
                  placeholder="Tên chỉ tiêu / Công việc (VD: Doanh số, Khách mới)"
                  placeholderTextColor="#94A3B8"
                  value={metric.name}
                  onChangeText={(val) => handleUpdateMetric(idx, 'name', val)}
                  editable={!isAlreadyReviewed}
                />
                <TextInput
                  style={[styles.input, styles.metricValueInput]}
                  placeholder="Kết quả"
                  placeholderTextColor="#94A3B8"
                  value={String(metric.value ?? '')}
                  onChangeText={(val) => handleUpdateMetric(idx, 'value', val)}
                  editable={!isAlreadyReviewed}
                />
                {!isAlreadyReviewed && (
                  <TouchableOpacity onPress={() => handleDeleteMetric(idx)} style={styles.delBtn}>
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  </TouchableOpacity>
                )}
              </View>
              <TextInput
                style={[styles.input, styles.metricNoteInput]}
                placeholder="Ghi chú chi tiết thêm..."
                placeholderTextColor="#94A3B8"
                value={metric.note || ''}
                onChangeText={(val) => handleUpdateMetric(idx, 'note', val)}
                editable={!isAlreadyReviewed}
              />
            </View>
          ))}

          {!isAlreadyReviewed && (
            <TouchableOpacity style={styles.addBtnOutline} onPress={handleAddMetric}>
              <Ionicons name="add-circle-outline" size={18} color="#2563EB" />
              <Text style={styles.addBtnText}>Thêm chỉ tiêu / kết quả</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* KHỐI 3: CÔNG VIỆC ĐÃ HOÀN THÀNH */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconCircleSuccess}>
              <MaterialCommunityIcons name="check-circle-outline" size={20} color="#059669" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>3. Công việc đã hoàn thành</Text>
              <Text style={styles.cardSubtitle}>Các task đã hoàn tất trong hệ thống & việc ngoài task</Text>
            </View>
          </View>

          {completedTasks.length === 0 ? (
            <Text style={styles.emptyNote}>Chưa có công việc nào hoàn thành hôm nay</Text>
          ) : (
            completedTasks.map((task, idx) => (
              <View key={idx} style={styles.taskItemBox}>
                <MaterialCommunityIcons name="checkbox-marked-circle" size={20} color="#059669" />
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <TextInput
                    style={[styles.input, styles.taskTitleInput]}
                    placeholder="Tên công việc hoàn thành..."
                    placeholderTextColor="#94A3B8"
                    value={task.title}
                    onChangeText={(val) => handleUpdateCompletedTask(idx, val)}
                    editable={!isAlreadyReviewed && (task.isManual ?? true)}
                  />
                  {task.isManual ? (
                    <Text style={styles.taskTagManual}>Tự nhập</Text>
                  ) : (
                    <Text style={styles.taskTagSystem}>Từ hệ thống Task</Text>
                  )}
                </View>
                {!isAlreadyReviewed && (
                  <TouchableOpacity onPress={() => handleDeleteCompletedTask(idx)} style={styles.delBtn}>
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}

          {!isAlreadyReviewed && (
            <TouchableOpacity style={styles.addBtnOutline} onPress={handleAddCompletedTask}>
              <Ionicons name="add-circle-outline" size={18} color="#059669" />
              <Text style={[styles.addBtnText, { color: '#059669' }]}>Thêm việc đã hoàn thành (ngoài task)</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* KHỐI 4: CÔNG VIỆC ĐANG THỰC HIỆN (Dở dang) */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconCircleWarning}>
              <MaterialCommunityIcons name="progress-clock" size={20} color="#D97706" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>4. Công việc đang thực hiện</Text>
              <Text style={styles.cardSubtitle}>Tiến độ dở dang & thời gian dự kiến hoàn thành</Text>
            </View>
          </View>

          {inProgressTasks.length === 0 ? (
            <Text style={styles.emptyNote}>Không có công việc nào đang dở dang</Text>
          ) : (
            inProgressTasks.map((task, idx) => (
              <View key={idx} style={styles.taskItemBox}>
                <MaterialCommunityIcons name="progress-wrench" size={20} color="#D97706" />
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <TextInput
                    style={[styles.input, styles.taskTitleInput]}
                    placeholder="Tên công việc đang làm..."
                    placeholderTextColor="#94A3B8"
                    value={task.title}
                    onChangeText={(val) => handleUpdateInProgressTask(idx, 'title', val)}
                    editable={!isAlreadyReviewed && (task.isManual ?? true)}
                  />
                  <View style={styles.inProgressMetaRow}>
                    <TextInput
                      style={[styles.input, styles.expectedDateInput]}
                      placeholder="Dự kiến hoàn thành (VD: 21/09)"
                      placeholderTextColor="#94A3B8"
                      value={task.expectedDate || ''}
                      onChangeText={(val) => handleUpdateInProgressTask(idx, 'expectedDate', val)}
                      editable={!isAlreadyReviewed}
                    />
                    {task.isManual ? (
                      <Text style={styles.taskTagManual}>Tự nhập</Text>
                    ) : (
                      <Text style={styles.taskTagSystem}>Từ hệ thống Task</Text>
                    )}
                  </View>
                </View>
                {!isAlreadyReviewed && (
                  <TouchableOpacity onPress={() => handleDeleteInProgressTask(idx)} style={styles.delBtn}>
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}

          {!isAlreadyReviewed && (
            <TouchableOpacity style={styles.addBtnOutline} onPress={handleAddInProgressTask}>
              <Ionicons name="add-circle-outline" size={18} color="#D97706" />
              <Text style={[styles.addBtnText, { color: '#D97706' }]}>Thêm việc đang thực hiện</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* KHỐI 5: KHÓ KHĂN / TRỞ NGẠI */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconCircleDanger}>
              <MaterialCommunityIcons name="alert-circle-outline" size={20} color="#DC2626" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>5. Khó khăn / Vướng mắc</Text>
              <Text style={styles.cardSubtitle}>Ghi chú trở ngại cần Leader hoặc phòng ban hỗ trợ</Text>
            </View>
          </View>

          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Nếu có khó khăn hay cần hỗ trợ gì từ Leader/Phòng ban thì ghi vào đây..."
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={3}
            value={obstacles}
            onChangeText={setObstacles}
            editable={!isAlreadyReviewed}
          />
        </View>

        {/* KHỐI 6: KẾ HOẠCH NGÀY MAI */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconCirclePrimary}>
              <MaterialCommunityIcons name="calendar-arrow-right" size={20} color="#2563EB" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>6. Kế hoạch công việc ngày mai</Text>
              <Text style={styles.cardSubtitle}>Leader có thể duyệt nhanh thành Task chính thức ngày mai</Text>
            </View>
          </View>

          {tomorrowPlan.map((plan, idx) => (
            <View key={idx} style={styles.planItemRow}>
              <Text style={styles.planIndex}>{idx + 1}.</Text>
              <TextInput
                style={[styles.input, styles.planInput]}
                placeholder={`Mục tiêu/Đầu việc ngày mai #${idx + 1}...`}
                placeholderTextColor="#94A3B8"
                value={plan}
                onChangeText={(val) => handleUpdateTomorrowPlan(idx, val)}
                editable={!isAlreadyReviewed}
              />
              {!isAlreadyReviewed && tomorrowPlan.length > 1 && (
                <TouchableOpacity onPress={() => handleDeleteTomorrowPlan(idx)} style={styles.delBtn}>
                  <Ionicons name="close-circle-outline" size={20} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>
          ))}

          {!isAlreadyReviewed && (
            <TouchableOpacity style={styles.addBtnOutline} onPress={handleAddTomorrowPlan}>
              <Ionicons name="add-circle-outline" size={18} color="#2563EB" />
              <Text style={styles.addBtnText}>Thêm đầu việc ngày mai</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* KHỐI 7: FILE ĐÍNH KÈM & TỰ ĐÁNH GIÁ (5 SAO) */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconCircleWarning}>
              <MaterialCommunityIcons name="star-face" size={20} color="#D97706" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>7. Tự đánh giá & File đính kèm</Text>
              <Text style={styles.cardSubtitle}>Tự chấm điểm hiệu suất làm việc hôm nay</Text>
            </View>
          </View>

          {/* Rating 5 sao */}
          <View style={styles.ratingBox}>
            <Text style={styles.ratingLabel}>Mức độ hoàn thành công việc hôm nay:</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => !isAlreadyReviewed && setSelfRating(star)}
                  style={styles.starBtn}
                  disabled={isAlreadyReviewed}
                >
                  <MaterialCommunityIcons
                    name={star <= selfRating ? 'star' : 'star-outline'}
                    size={36}
                    color={star <= selfRating ? '#F59E0B' : '#CBD5E1'}
                  />
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.ratingDesc}>
              {selfRating === 5 && '🌟 Tuyệt vời! Hoàn thành vượt mức chỉ tiêu'}
              {selfRating === 4 && '👍 Tốt! Hoàn thành đúng tiến độ'}
              {selfRating === 3 && '👌 Đạt yêu cầu cơ bản'}
              {selfRating === 2 && '⚠️ Còn nhiều việc tồn đọng'}
              {selfRating === 1 && '❌ Hiệu suất chưa đạt'}
            </Text>
          </View>

          {/* Tự nhận xét */}
          <TextInput
            style={[styles.input, styles.textArea, { marginTop: 12 }]}
            placeholder="Tự nhận xét ngắn về ngày làm việc (nếu có)..."
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={2}
            value={selfReview}
            onChangeText={setSelfReview}
            editable={!isAlreadyReviewed}
          />

          {/* Upload Attachments */}
          <View style={styles.attachSection}>
            <Text style={styles.attachTitle}>Tệp đính kèm (Ảnh chụp màn hình, báo cáo file, hóa đơn...):</Text>
            
            {attachments.map((att, idx) => (
              <View key={idx} style={styles.attachItem}>
                <MaterialCommunityIcons
                  name={att.fileType === 'IMAGE' ? 'image-outline' : 'file-document-outline'}
                  size={20}
                  color="#2563EB"
                />
                <Text style={styles.attachName} numberOfLines={1}>
                  {att.fileName || `Tệp đính kèm ${idx + 1}`}
                </Text>
                {!isAlreadyReviewed && (
                  <TouchableOpacity onPress={() => handleDeleteAttachment(idx)}>
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  </TouchableOpacity>
                )}
              </View>
            ))}

            {!isAlreadyReviewed && (
              <View style={styles.attachBtnRow}>
                <TouchableOpacity
                  style={[styles.uploadBtn, isUploadingFile && styles.uploadBtnDisabled]}
                  onPress={handlePickImage}
                  disabled={isUploadingFile}
                >
                  <Ionicons name="image-outline" size={18} color="#2563EB" />
                  <Text style={styles.uploadBtnText}>Đính kèm Ảnh</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.uploadBtn, isUploadingFile && styles.uploadBtnDisabled]}
                  onPress={handlePickDocument}
                  disabled={isUploadingFile}
                >
                  <Ionicons name="document-attach-outline" size={18} color="#2563EB" />
                  <Text style={styles.uploadBtnText}>Tài liệu / PDF</Text>
                </TouchableOpacity>
              </View>
            )}

            {isUploadingFile && (
              <View style={styles.uploadLoadingBox}>
                <ActivityIndicator size="small" color="#2563EB" />
                <Text style={styles.uploadLoadingText}>Đang tải tệp lên...</Text>
              </View>
            )}
          </View>
        </View>

        {/* Cam kết trung thực */}
        {!isAlreadyReviewed && (
          <View style={styles.confirmBox}>
            <Switch
              value={isConfirmed}
              onValueChange={setIsConfirmed}
              trackColor={{ false: '#CBD5E1', true: '#93C5FD' }}
              thumbColor={isConfirmed ? '#2563EB' : '#F8FAFC'}
            />
            <Text style={styles.confirmText}>
              Tôi cam kết các thông tin và số liệu trên báo cáo là chính xác và trung thực.
            </Text>
          </View>
        )}

        {/* NÚT THAO TÁC: LƯU NHÁP & GỬI BÁO CÁO */}
        {!isAlreadyReviewed && (
          <View style={styles.actionButtonGroup}>
            <TouchableOpacity
              style={[styles.draftBtn, saveReportMutation.isPending && styles.btnDisabled]}
              onPress={() => handleSave(true)}
              disabled={saveReportMutation.isPending}
            >
              {saveReportMutation.isPending ? (
                <ActivityIndicator size="small" color="#475569" />
              ) : (
                <>
                  <MaterialCommunityIcons name="content-save-outline" size={20} color="#475569" />
                  <Text style={styles.draftBtnText}>Lưu Bản Nháp</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitBtn, (!isConfirmed || saveReportMutation.isPending) && styles.btnDisabled]}
              onPress={() => handleSave(false)}
              disabled={!isConfirmed || saveReportMutation.isPending}
            >
              {saveReportMutation.isPending ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <MaterialCommunityIcons name="send-check" size={20} color="#FFF" />
                  <Text style={styles.submitBtnText}>Gửi Báo Cáo</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScreenContainer>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  iconCirclePrimary: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleSuccess: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleWarning: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFBEB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleDanger: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 12,
  },
  infoCol: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1E293B',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  metricItemBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  metricRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metricNameInput: {
    flex: 2,
    backgroundColor: '#FFFFFF',
  },
  metricValueInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    fontWeight: '700',
    color: '#2563EB',
  },
  metricNoteInput: {
    backgroundColor: '#FFFFFF',
    fontSize: 12,
    paddingVertical: 6,
  },
  delBtn: {
    padding: 6,
  },
  addBtnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
    marginTop: 4,
  },
  addBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563EB',
  },
  taskItemBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  taskTitleInput: {
    backgroundColor: '#FFFFFF',
    marginBottom: 4,
  },
  taskTagManual: {
    fontSize: 11,
    color: '#64748B',
    fontStyle: 'italic',
  },
  taskTagSystem: {
    fontSize: 11,
    color: '#2563EB',
    fontWeight: '600',
  },
  emptyNote: {
    fontSize: 13,
    color: '#94A3B8',
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 12,
  },
  inProgressMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  expectedDateInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    fontSize: 12,
    paddingVertical: 6,
  },
  planItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  planIndex: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2563EB',
    width: 20,
  },
  planInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  ratingBox: {
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  ratingLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  starBtn: {
    padding: 4,
  },
  ratingDesc: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D97706',
    marginTop: 6,
  },
  attachSection: {
    marginTop: 14,
  },
  attachTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  attachItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    padding: 10,
    borderRadius: 10,
    marginBottom: 6,
    gap: 8,
  },
  attachName: {
    flex: 1,
    fontSize: 13,
    color: '#1E293B',
    fontWeight: '500',
  },
  attachBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  uploadBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  uploadBtnDisabled: {
    opacity: 0.5,
  },
  uploadBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  uploadLoadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
  },
  uploadLoadingText: {
    fontSize: 12,
    color: '#64748B',
  },
  confirmBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    gap: 10,
  },
  confirmText: {
    flex: 1,
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
  },
  actionButtonGroup: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  draftBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  draftBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  submitBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#2563EB',
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  bannerReviewed: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  bannerReviewedTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#15803D',
  },
  bannerReviewedDesc: {
    fontSize: 12,
    color: '#166534',
    marginTop: 2,
  },
  bannerSubmitted: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  bannerSubmittedTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B45309',
  },
  bannerSubmittedDesc: {
    fontSize: 12,
    color: '#92400E',
    marginTop: 2,
  },
});
