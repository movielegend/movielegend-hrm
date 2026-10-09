import { useRouter } from 'expo-router';
import { useState, useCallback } from 'react';
import { useAppAlert } from '../../contexts/AlertContext';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  RefreshControl,
  Image,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import ImageView from '../../components/ImageViewer/ImageViewer';
import { EmptyState } from '../../components/EmptyState';
import { FormField } from '../../components/FormField';
import { PageHeader } from '../../components/PageHeader';
import { PrimaryButton, SecondaryButton } from '../../components/Buttons';
import { Screen } from '../../components/Screen';
import { SectionCard } from '../../components/SectionCard';
import { StatusBadge, toneForStatus } from '../../components/StatusBadge';
import { CustomDatePickerModal } from '../../components/CustomDatePickerModal';
import { CustomTimePickerModal } from '../../components/CustomTimePickerModal';
import {
  useMyOtReports,
  usePendingOtReports,
  useCreateOtReport,
  useApproveOtReport,
  useRejectOtReport,
} from '../../hooks/useOtReport';
import { uploadFile } from '../../api/uploads.api';
import { resolveFileUrl } from '../../utils/url';
import { requestMediaLibraryPermissionWithFallback, requestCameraPermissionWithFallback } from '../../utils/mediaPermissions';
import { useQueryClient } from '@tanstack/react-query';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import type { OtReport } from '../../types/ot-report.types';
import { businessDateToday, formatDate, formatDateTime } from '../../utils/date-time';
import { normalizeApiError } from '../../utils/api-error';

export function OtReportHomeScreen() {
  const router = useRouter();
  const reports = useMyOtReports({ page: 1, limit: 20 });
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['ot-reports'] });
    setRefreshing(false);
  }, [queryClient]);

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />}
      >
        <PageHeader
          title="Báo cáo OT - Phòng Live"
          subtitle="Tích lũy đủ 5 giờ thực tế mới đủ điều kiện tính OT."
        />
        <PrimaryButton onPress={() => router.push('/employee/ot-report/create' as any)}>
          + Tạo báo cáo OT mới
        </PrimaryButton>
        <SectionCard title="Báo cáo OT của tôi">
          {(reports.data?.items ?? []).map((report) => (
            <OtReportCard key={report.id} report={report} />
          ))}
          {!reports.data?.items?.length ? <EmptyState title="Chưa có báo cáo OT nào" /> : null}
        </SectionCard>
      </ScrollView>
    </Screen>
  );
}

interface UploadedPhoto {
  id: string;
  localUri: string;
  fileId?: string;
  url?: string;
  isUploading?: boolean;
  error?: string;
}

export function CreateOtReportScreen() {
  const mutation = useCreateOtReport();
  const today = businessDateToday();

  // Date selection state
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [otDateStr, setOtDateStr] = useState(today);
  const [dateModalVisible, setDateModalVisible] = useState(false);

  // Time selection state
  const [startHour, setStartHour] = useState(21);
  const [startMinute, setStartMinute] = useState(0);
  const [startTimeModalVisible, setStartTimeModalVisible] = useState(false);

  const [endHour, setEndHour] = useState(23);
  const [endMinute, setEndMinute] = useState(0);
  const [endTimeModalVisible, setEndTimeModalVisible] = useState(false);

  const [proposedPercent, setProposedPercent] = useState('100');
  const [reason, setReason] = useState('');
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);

  const { showAlert } = useAppAlert();
  const router = useRouter();

  const handleSelectDate = (date: Date) => {
    setSelectedDate(date);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    setOtDateStr(`${y}-${m}-${d}`);
    setDateModalVisible(false);
  };

  const uploadSinglePhoto = async (photoId: string, uri: string, rawFileName?: string | null, rawMimeType?: string | null) => {
    try {
      const fileName = rawFileName || `ot_proof_${Date.now()}.jpg`;
      const mimeType = rawMimeType || 'image/jpeg';
      const uploaded = await uploadFile({
        uri,
        mimeType,
        name: fileName,
        purpose: 'OT_REPORT_ATTACHMENT' as any,
      });

      const fileId = uploaded?.fileId || (uploaded as any)?.id;
      if (!fileId) {
        throw new Error('Máy chủ không trả về mã file hợp lệ');
      }

      setPhotos((prev) =>
        prev.map((item) =>
          item.id === photoId
            ? {
                ...item,
                fileId,
                url: resolveFileUrl(uploaded.fileUrl) || uri,
                isUploading: false,
                error: undefined,
              }
            : item
        )
      );
    } catch (e: any) {
      console.error('[Upload Photo Error]:', e?.stack || e);
      const errMsg = e?.message || 'Không thể tải ảnh lên máy chủ.';
      setPhotos((prev) =>
        prev.map((item) =>
          item.id === photoId
            ? { ...item, isUploading: false, error: errMsg }
            : item
        )
      );
      showAlert('Lỗi tải ảnh', errMsg);
    }
  };

  const handlePickImage = async () => {
    const hasPerm = await requestMediaLibraryPermissionWithFallback();
    if (!hasPerm) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newItems: { photo: UploadedPhoto; asset: (typeof result.assets)[0] }[] = result.assets.map(
          (asset, idx) => ({
            photo: {
              id: `local_${Date.now()}_${idx}_${Math.random().toString(36).substring(7)}`,
              localUri: asset.uri,
              isUploading: true,
            },
            asset,
          })
        );

        // Hiển thị ngay lập tức lên giao diện để người dùng thấy ảnh
        setPhotos((prev) => [...prev, ...newItems.map((n) => n.photo)]);

        // Chạy upload song song từng ảnh
        for (const item of newItems) {
          void uploadSinglePhoto(item.photo.id, item.asset.uri, item.asset.fileName, item.asset.mimeType);
        }
      }
    } catch (err: any) {
      showAlert('Lỗi', err?.message || 'Không thể chọn ảnh, vui lòng thử lại.');
    }
  };

  const handleTakePhoto = async () => {
    const hasPerm = await requestCameraPermissionWithFallback();
    if (!hasPerm) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (!asset) return;
        const newPhoto: UploadedPhoto = {
          id: `cam_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          localUri: asset.uri,
          isUploading: true,
        };

        // Hiển thị ngay lập tức ảnh chụp lên giao diện
        setPhotos((prev) => [...prev, newPhoto]);

        void uploadSinglePhoto(newPhoto.id, asset.uri, asset.fileName, asset.mimeType);
      }
    } catch (err: any) {
      showAlert('Lỗi', err?.message || 'Không thể chụp ảnh, vui lòng thử lại.');
    }
  };

  const handleRemovePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  const handleRetryPhoto = (photo: UploadedPhoto) => {
    setPhotos((prev) =>
      prev.map((item) => (item.id === photo.id ? { ...item, isUploading: true, error: undefined } : item))
    );
    void uploadSinglePhoto(photo.id, photo.localUri);
  };

  async function submit() {
    const isAnyUploading = photos.some((p) => p.isUploading);
    if (isAnyUploading) {
      showAlert('Đang tải ảnh', 'Có ảnh vẫn đang được tải lên máy chủ, vui lòng chờ trong giây lát.');
      return;
    }

    const failedCount = photos.filter((p) => p.error).length;
    if (failedCount > 0) {
      showAlert('Ảnh bị lỗi', 'Có ảnh bị lỗi tải lên. Vui lòng bấm vào ảnh để thử lại hoặc xóa ảnh lỗi.');
      return;
    }

    const validFileIds = photos.map((p) => p.fileId).filter(Boolean) as string[];
    if (!validFileIds.length) {
      showAlert('Thiếu ảnh bằng chứng', 'Bắt buộc đính kèm ít nhất 1 ảnh làm việc ca live.');
      return;
    }

    const [y, m, d] = otDateStr.split('-').map(Number);
    const year = y || new Date().getFullYear();
    const month = (m || 1) - 1;
    const day = d || 1;
    const startDateObj = new Date(year, month, day, startHour, startMinute, 0, 0);
    let endDateObj = new Date(year, month, day, endHour, endMinute, 0, 0);
    if (endDateObj <= startDateObj) {
      endDateObj = new Date(year, month, day + 1, endHour, endMinute, 0, 0);
    }
    const startIso = startDateObj.toISOString();
    const endIso = endDateObj.toISOString();

    try {
      await mutation.mutateAsync({
        otDate: otDateStr,
        startTime: startIso,
        endTime: endIso,
        proposedPercent: Number(proposedPercent) || 100,
        reason,
        photoFileIds: validFileIds,
      });
      showAlert('Thành công', 'Đã gửi báo cáo OT, chờ Leader duyệt.');
      router.back();
    } catch (error) {
      const normalized = normalizeApiError(error);
      showAlert('Lỗi gửi báo cáo', normalized.message);
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <PageHeader
          title="Tạo báo cáo OT"
          subtitle="Chỉ dành cho phòng Live trong 3 ngày gần nhất."
        />
        <SectionCard>
          {/* Chọn ngày bằng Modal */}
          <Text style={styles.inputLabel}>Ngày làm việc OT *</Text>
          <Pressable style={styles.modalPickerButton} onPress={() => setDateModalVisible(true)}>
            <MaterialCommunityIcons name="calendar-month" size={20} color="#2563EB" />
            <Text style={styles.modalPickerText}>{otDateStr}</Text>
            <MaterialCommunityIcons name="chevron-down" size={20} color="#6B7280" />
          </Pressable>

          {/* Chọn giờ bắt đầu & kết thúc bằng Modal */}
          <View style={styles.rowTwoCols}>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>Giờ bắt đầu OT *</Text>
              <Pressable
                style={styles.modalPickerButton}
                onPress={() => setStartTimeModalVisible(true)}
              >
                <MaterialCommunityIcons name="clock-outline" size={20} color="#059669" />
                <Text style={styles.modalPickerText}>
                  {String(startHour).padStart(2, '0')}:{String(startMinute).padStart(2, '0')}
                </Text>
                <MaterialCommunityIcons name="chevron-down" size={18} color="#6B7280" />
              </Pressable>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>Giờ kết thúc OT *</Text>
              <Pressable
                style={styles.modalPickerButton}
                onPress={() => setEndTimeModalVisible(true)}
              >
                <MaterialCommunityIcons name="clock-check-outline" size={20} color="#DC2626" />
                <Text style={styles.modalPickerText}>
                  {String(endHour).padStart(2, '0')}:{String(endMinute).padStart(2, '0')}
                </Text>
                <MaterialCommunityIcons name="chevron-down" size={18} color="#6B7280" />
              </Pressable>
            </View>
          </View>

          {/* Chọn % Lương đề xuất */}
          <Text style={styles.inputLabel}>% Lương đề xuất *</Text>
          <View style={styles.percentRow}>
            {['100', '150', '200'].map((pct) => (
              <Pressable
                key={pct}
                style={[styles.percentChip, proposedPercent === pct && styles.percentChipActive]}
                onPress={() => setProposedPercent(pct)}
              >
                <Text
                  style={[
                    styles.percentChipText,
                    proposedPercent === pct && styles.percentChipTextActive,
                  ]}
                >
                  {pct}%
                </Text>
              </Pressable>
            ))}
          </View>

          <FormField
            label="Mô tả ca làm việc & Nhiệm vụ"
            value={reason}
            onChangeText={setReason}
            placeholder="Nội dung ca live, hỗ trợ setup, chốt đơn..."
          />

          {/* Khu vực ảnh bằng chứng */}
          <View style={styles.photoSection}>
            <View style={styles.photoHeader}>
              <Text style={styles.inputLabel}>Ảnh bằng chứng ca làm ({photos.length} ảnh) *</Text>
              <Text style={styles.photoSubLabel}>Tối thiểu 1 ảnh</Text>
            </View>

            {/* Danh sách ảnh đã chọn */}
            <View style={styles.photoGrid}>
              {photos.map((p) => (
                <View key={p.id} style={[styles.photoThumbnail, p.error && styles.photoThumbnailError]}>
                  <Image source={{ uri: p.url || p.localUri }} style={styles.thumbnailImage} />
                  {p.isUploading && (
                    <View style={styles.uploadingOverlay}>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text style={styles.uploadingOverlayText}>Đang tải...</Text>
                    </View>
                  )}
                  {p.error && (
                    <Pressable style={styles.errorOverlay} onPress={() => handleRetryPhoto(p)}>
                      <MaterialCommunityIcons name="reload" size={12} color="#DC2626" />
                      <Text style={styles.errorOverlayText}>Thử lại</Text>
                    </Pressable>
                  )}
                  <Pressable
                    style={styles.removePhotoButton}
                    onPress={() => handleRemovePhoto(p.id)}
                  >
                    <MaterialCommunityIcons name="close" size={14} color="#FFFFFF" />
                  </Pressable>
                </View>
              ))}
            </View>

            {/* Các nút bấm chọn ảnh / chụp ảnh */}
            <View style={styles.photoActionRow}>
              <Pressable style={styles.photoActionButton} onPress={handlePickImage}>
                <MaterialCommunityIcons name="image-multiple" size={20} color="#2563EB" />
                <Text style={styles.photoActionText}>Chọn từ thư viện</Text>
              </Pressable>
              <Pressable style={styles.photoActionButton} onPress={handleTakePhoto}>
                <MaterialCommunityIcons name="camera" size={20} color="#059669" />
                <Text style={styles.photoActionText}>Chụp ảnh mới</Text>
              </Pressable>
            </View>
          </View>

          <PrimaryButton onPress={submit} disabled={mutation.isPending}>
            {mutation.isPending ? 'Đang gửi...' : 'Gửi báo cáo OT'}
          </PrimaryButton>
        </SectionCard>
      </ScrollView>

      {/* Date Picker Modal */}
      <CustomDatePickerModal
        visible={dateModalVisible}
        initialDate={selectedDate}
        onClose={() => setDateModalVisible(false)}
        onSelect={handleSelectDate}
      />

      {/* Start Time Picker Modal */}
      <CustomTimePickerModal
        visible={startTimeModalVisible}
        title="Chọn giờ bắt đầu OT"
        initialHours={startHour}
        initialMinutes={startMinute}
        onClose={() => setStartTimeModalVisible(false)}
        onSelect={(h, m) => {
          setStartHour(h);
          setStartMinute(m);
        }}
      />

      {/* End Time Picker Modal */}
      <CustomTimePickerModal
        visible={endTimeModalVisible}
        title="Chọn giờ kết thúc OT"
        initialHours={endHour}
        initialMinutes={endMinute}
        onClose={() => setEndTimeModalVisible(false)}
        onSelect={(h, m) => {
          setEndHour(h);
          setEndMinute(m);
        }}
      />
    </Screen>
  );
}

export function LeaderOtReviewScreen() {
  const pending = usePendingOtReports({ page: 1, limit: 20 });
  const approveMutation = useApproveOtReport();
  const rejectMutation = useRejectOtReport();
  const { showAlert } = useAppAlert();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  // Image viewer state
  const [viewerImages, setViewerImages] = useState<{ uri: string }[]>([]);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [isViewerVisible, setIsViewerVisible] = useState(false);

  // Detail modal state
  const [detailReport, setDetailReport] = useState<OtReport | null>(null);

  // Approve / Reject modal state
  const [approvingReport, setApprovingReport] = useState<OtReport | null>(null);
  const [selectedPercent, setSelectedPercent] = useState<string>('100');

  const [rejectingReport, setRejectingReport] = useState<OtReport | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['ot-reports'] });
    setRefreshing(false);
  }, [queryClient]);

  const handleOpenImageViewer = (photos: { file?: { fileUrl?: string } }[], initialIdx: number = 0) => {
    const urls = photos
      .map((p) => resolveFileUrl(p.file?.fileUrl))
      .filter(Boolean)
      .map((uri) => ({ uri: uri as string }));
    if (urls.length > 0) {
      setViewerImages(urls);
      setViewerIndex(initialIdx);
      setIsViewerVisible(true);
    }
  };

  const handleOpenApprove = (report: OtReport) => {
    setApprovingReport(report);
    setSelectedPercent(String(report.proposedPercent || 100));
  };

  const handleConfirmApprove = async () => {
    if (!approvingReport) return;
    try {
      const pct = Number(selectedPercent) || 100;
      await approveMutation.mutateAsync({
        id: approvingReport.id,
        payload: { approvedPercent: pct },
      });
      showAlert('Thành công', `Đã duyệt báo cáo OT mức ${pct}%`);
      setApprovingReport(null);
      setDetailReport(null);
    } catch (error) {
      const normalized = normalizeApiError(error);
      showAlert('Lỗi duyệt báo cáo', normalized.message);
    }
  };

  const handleOpenReject = (report: OtReport) => {
    setRejectingReport(report);
    setRejectionReason('Không khớp nội dung ca live');
  };

  const handleConfirmReject = async () => {
    if (!rejectingReport) return;
    if (!rejectionReason.trim()) {
      showAlert('Lỗi', 'Vui lòng nhập lý do từ chối báo cáo OT');
      return;
    }
    try {
      await rejectMutation.mutateAsync({
        id: rejectingReport.id,
        payload: { rejectionReason: rejectionReason.trim() },
      });
      showAlert('Đã từ chối', 'Đã ghi nhận không công nhận báo cáo OT');
      setRejectingReport(null);
      setDetailReport(null);
    } catch (error) {
      const normalized = normalizeApiError(error);
      showAlert('Lỗi từ chối báo cáo', normalized.message);
    }
  };

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />}
      >
        <PageHeader
          title="Duyệt báo cáo OT"
          subtitle="Danh sách báo cáo OT chờ duyệt từ nhân viên phòng Live."
        />
        <SectionCard title="Chờ duyệt">
          {(pending.data?.items ?? []).map((report) => (
            <View key={report.id} style={styles.card}>
              <View style={styles.row}>
                <View style={styles.flex}>
                  <Text style={styles.employeeName}>
                    {report.user?.profile?.fullName || report.user?.userCode || 'Nhân viên'}
                  </Text>
                  {report.department?.name ? (
                    <Text style={styles.cardSubText}>{report.department.name}</Text>
                  ) : null}
                </View>
                <StatusBadge
                  label={report.status === 'APPROVED' ? 'Đã duyệt' : report.status === 'REJECTED' ? 'Từ chối' : 'Chờ duyệt'}
                  tone={toneForStatus(report.status)}
                />
              </View>

              <Text style={styles.cardText}>Ngày OT: <Text style={styles.cardTextHighlight}>{formatDate(report.otDate)}</Text></Text>
              <Text style={styles.cardText}>
                Thời gian: {formatDateTime(report.startTime)} - {formatDateTime(report.endTime)}
              </Text>
              <Text style={styles.cardText}>% Đề xuất: <Text style={styles.cardTextHighlight}>{report.proposedPercent}%</Text></Text>
              
              <View style={styles.validOtBox}>
                <MaterialCommunityIcons name="clock-check-outline" size={18} color="#2563EB" />
                <Text style={styles.cardTextBold}>
                  Giờ OT hợp lệ (sau mốc 5h): {Math.floor(report.validOtMinutes / 60)}h {report.validOtMinutes % 60}p
                </Text>
              </View>

              {report.reason ? (
                <Text style={styles.cardText} numberOfLines={2}>
                  Nội dung: {report.reason}
                </Text>
              ) : null}

              {/* Ảnh đính kèm (Có thể bấm để phóng to/zoom) */}
              {report.photos && report.photos.length > 0 ? (
                <View style={styles.photoThumbWrapper}>
                  <Text style={styles.photoHintText}>
                    <MaterialCommunityIcons name="magnify-plus-outline" size={13} color="#6B7280" /> Bấm vào ảnh để phóng to/zoom ({report.photos.length} ảnh)
                  </Text>
                  <View style={styles.reviewPhotoRow}>
                    {report.photos.map((p, pIdx) => {
                      const imgUrl = resolveFileUrl(p.file?.fileUrl);
                      if (!imgUrl) return null;
                      return (
                        <TouchableOpacity
                          key={p.id}
                          activeOpacity={0.8}
                          onPress={() => handleOpenImageViewer(report.photos || [], pIdx)}
                          style={styles.reviewThumbnailContainer}
                        >
                          <Image source={{ uri: imgUrl }} style={styles.reviewThumbnail} />
                          <View style={styles.zoomBadge}>
                            <MaterialCommunityIcons name="arrow-expand" size={12} color="#FFFFFF" />
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ) : null}

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.detailButton}
                  onPress={() => setDetailReport(report)}
                >
                  <MaterialCommunityIcons name="eye-outline" size={16} color="#4B5563" />
                  <Text style={styles.detailButtonText}>Chi tiết</Text>
                </TouchableOpacity>
                <View style={styles.flexRowGap}>
                  <PrimaryButton onPress={() => handleOpenApprove(report)}>Duyệt</PrimaryButton>
                  <SecondaryButton onPress={() => handleOpenReject(report)}>Từ chối</SecondaryButton>
                </View>
              </View>
            </View>
          ))}
          {!pending.data?.items?.length ? <EmptyState title="Không có báo cáo chờ duyệt" /> : null}
        </SectionCard>
      </ScrollView>

      {/* Full-screen Image Viewer with Pinch-to-Zoom */}
      <ImageView
        images={viewerImages}
        imageIndex={viewerIndex}
        visible={isViewerVisible}
        onRequestClose={() => setIsViewerVisible(false)}
      />

      {/* Chi tiết báo cáo OT Modal */}
      {detailReport ? (
        <OtReportDetailModal
          report={detailReport}
          onClose={() => setDetailReport(null)}
          onApprove={() => handleOpenApprove(detailReport)}
          onReject={() => handleOpenReject(detailReport)}
          onOpenPhoto={(photos, idx) => handleOpenImageViewer(photos, idx)}
        />
      ) : null}

      {/* Modal Duyệt chọn mức % */}
      <Modal visible={!!approvingReport} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <MaterialCommunityIcons name="check-decagram" size={24} color="#059669" />
              <Text style={styles.modalCardTitle}>Duyệt báo cáo OT</Text>
            </View>

            <Text style={styles.modalCardSubtitle}>
              Nhân viên: <Text style={{ fontWeight: '700', color: '#111827' }}>{approvingReport?.user?.profile?.fullName || approvingReport?.user?.userCode}</Text>
            </Text>
            <Text style={styles.modalCardSubtitle}>
              Giờ OT hợp lệ: <Text style={{ fontWeight: '700', color: '#2563EB' }}>{Math.floor((approvingReport?.validOtMinutes || 0) / 60)}h {(approvingReport?.validOtMinutes || 0) % 60}p</Text>
            </Text>

            <Text style={[styles.inputLabel, { marginTop: 14 }]}>Chọn mức % công OT được duyệt:</Text>
            <View style={styles.percentRow}>
              {['100', '150', '200'].map((pct) => (
                <TouchableOpacity
                  key={pct}
                  style={[styles.percentChip, selectedPercent === pct && styles.percentChipActive]}
                  onPress={() => setSelectedPercent(pct)}
                >
                  <Text style={[styles.percentChipText, selectedPercent === pct && styles.percentChipTextActive]}>
                    {pct}%
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <SecondaryButton onPress={() => setApprovingReport(null)}>Hủy</SecondaryButton>
              <PrimaryButton onPress={() => void handleConfirmApprove()}>Xác nhận duyệt ({selectedPercent}%)</PrimaryButton>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Từ chối nhập lý do */}
      <Modal visible={!!rejectingReport} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <MaterialCommunityIcons name="alert-circle-outline" size={24} color="#DC2626" />
              <Text style={[styles.modalCardTitle, { color: '#DC2626' }]}>Không công nhận OT</Text>
            </View>

            <Text style={styles.modalCardSubtitle}>
              Nhân viên: <Text style={{ fontWeight: '700', color: '#111827' }}>{rejectingReport?.user?.profile?.fullName || rejectingReport?.user?.userCode}</Text>
            </Text>

            <Text style={[styles.inputLabel, { marginTop: 14 }]}>Lý do không công nhận (gửi cho nhân viên):</Text>
            <TextInput
              style={styles.reasonInput}
              placeholder="Nhập lý do không công nhận..."
              multiline
              numberOfLines={3}
              value={rejectionReason}
              onChangeText={setRejectionReason}
            />

            <View style={styles.modalActions}>
              <SecondaryButton onPress={() => setRejectingReport(null)}>Hủy</SecondaryButton>
              <TouchableOpacity
                style={styles.dangerButton}
                onPress={() => void handleConfirmReject()}
              >
                <Text style={styles.dangerButtonText}>Xác nhận từ chối</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

function OtReportDetailModal({
  report,
  onClose,
  onApprove,
  onReject,
  onOpenPhoto,
}: {
  report: OtReport;
  onClose: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  onOpenPhoto: (photos: any[], idx: number) => void;
}) {
  const router = useRouter();
  const otHours = Math.floor(report.validOtMinutes / 60);
  const otMinutes = report.validOtMinutes % 60;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.detailModalOverlay}>
        <View style={styles.detailModalContainer}>
          <View style={styles.detailModalHeader}>
            <View>
              <Text style={styles.detailModalTitle}>Chi tiết báo cáo OT</Text>
              <Text style={styles.detailModalSub}>{report.user?.profile?.fullName || report.user?.userCode} - {report.department?.name || 'Phòng Live'}</Text>
            </View>
            <TouchableOpacity style={styles.closeIconBtn} onPress={onClose}>
              <MaterialCommunityIcons name="close" size={22} color="#4B5563" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.detailModalBody} showsVerticalScrollIndicator={false}>
            <View style={styles.statusRow}>
              <Text style={styles.detailSectionLabel}>Trạng thái xử lý:</Text>
              <StatusBadge
                label={report.status === 'APPROVED' ? 'Đã duyệt' : report.status === 'REJECTED' ? 'Từ chối' : 'Chờ duyệt'}
                tone={toneForStatus(report.status)}
              />
            </View>

            <View style={styles.detailInfoGrid}>
              <View style={styles.detailInfoItem}>
                <Text style={styles.detailItemLabel}>Ngày OT</Text>
                <Text style={styles.detailItemVal}>{formatDate(report.otDate)}</Text>
              </View>
              <View style={styles.detailInfoItem}>
                <Text style={styles.detailItemLabel}>Mức % đề xuất</Text>
                <Text style={styles.detailItemVal}>{report.proposedPercent}%</Text>
              </View>
            </View>

            <View style={styles.detailTimeBox}>
              <MaterialCommunityIcons name="calendar-clock" size={20} color="#2563EB" />
              <View style={styles.flex}>
                <Text style={styles.detailTimeTitle}>Khoảng thời gian đề xuất OT:</Text>
                <Text style={styles.detailTimeDesc}>
                  {formatDateTime(report.startTime)} - {formatDateTime(report.endTime)}
                </Text>
              </View>
            </View>

            <View style={styles.detailValidBox}>
              <MaterialCommunityIcons name="shield-check" size={20} color="#059669" />
              <View style={styles.flex}>
                <Text style={styles.detailValidTitle}>Giờ OT hợp lệ (hệ thống tính sau mốc 5h):</Text>
                <Text style={styles.detailValidDesc}>
                  {otHours} giờ {otMinutes} phút
                </Text>
              </View>
            </View>

            {report.reason ? (
              <View style={styles.detailReasonBox}>
                <Text style={styles.detailReasonLabel}>Nội dung công việc:</Text>
                <Text style={styles.detailReasonText}>{report.reason}</Text>
              </View>
            ) : null}

            {report.rejectionReason ? (
              <View style={styles.detailRejectBox}>
                <Text style={styles.detailRejectLabel}>Lý do từ chối:</Text>
                <Text style={styles.detailRejectText}>{report.rejectionReason}</Text>
              </View>
            ) : null}

            {/* Ảnh bằng chứng với zoom */}
            <View style={styles.detailPhotosSection}>
              <View style={styles.photoHeader}>
                <Text style={styles.detailSectionLabel}>Ảnh bằng chứng ca làm ({report.photos?.length || 0} ảnh):</Text>
                <Text style={styles.photoHintText}>Chạm vào ảnh để zoom</Text>
              </View>

              <View style={styles.detailPhotoGrid}>
                {(report.photos || []).map((p, idx) => {
                  const imgUrl = resolveFileUrl(p.file?.fileUrl);
                  if (!imgUrl) return null;
                  return (
                    <TouchableOpacity
                      key={p.id}
                      activeOpacity={0.8}
                      onPress={() => onOpenPhoto(report.photos || [], idx)}
                      style={styles.detailPhotoThumb}
                    >
                      <Image source={{ uri: imgUrl }} style={styles.detailPhotoImg} />
                      <View style={styles.detailZoomOverlay}>
                        <MaterialCommunityIcons name="magnify-plus" size={16} color="#FFFFFF" />
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          {report.status === 'PENDING' && onApprove && onReject ? (
            <View style={styles.detailModalFooter}>
              <SecondaryButton onPress={onReject}>Từ chối</SecondaryButton>
              <PrimaryButton onPress={onApprove}>Duyệt OT</PrimaryButton>
            </View>
          ) : report.status === 'REJECTED' ? (
            <View style={styles.detailModalFooter}>
              <SecondaryButton onPress={onClose}>Đóng</SecondaryButton>
              <PrimaryButton
                onPress={() => {
                  onClose();
                  router.push('/employee/ot-report/create' as any);
                }}
              >
                Nộp lại báo cáo
              </PrimaryButton>
            </View>
          ) : (
            <View style={styles.detailModalFooter}>
              <PrimaryButton onPress={onClose}>Đóng</PrimaryButton>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

function OtReportCard({ report }: { report: OtReport }) {
  const router = useRouter();
  const otHours = Math.floor(report.validOtMinutes / 60);
  const otMinutes = report.validOtMinutes % 60;

  // Image viewer state for individual card
  const [viewerImages, setViewerImages] = useState<{ uri: string }[]>([]);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [isViewerVisible, setIsViewerVisible] = useState(false);
  const [isDetailVisible, setIsDetailVisible] = useState(false);

  const handleOpenPhoto = (photos: any[], idx: number = 0) => {
    const urls = photos
      .map((p) => resolveFileUrl(p.file?.fileUrl))
      .filter(Boolean)
      .map((uri) => ({ uri: uri as string }));
    if (urls.length > 0) {
      setViewerImages(urls);
      setViewerIndex(idx);
      setIsViewerVisible(true);
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => setIsDetailVisible(true)}
      style={styles.card}
    >
      <View style={styles.row}>
        <Text style={styles.cardTitle}>{formatDate(report.otDate)}</Text>
        <StatusBadge
          label={report.status === 'APPROVED' ? 'Đã duyệt' : report.status === 'REJECTED' ? 'Từ chối' : 'Chờ duyệt'}
          tone={toneForStatus(report.status)}
        />
      </View>
      <Text style={styles.cardText}>
        Thời gian: {formatDateTime(report.startTime)} - {formatDateTime(report.endTime)}
      </Text>
      <Text style={styles.cardText}>
        % Đề xuất: {report.proposedPercent}%{' '}
        {report.approvedPercent ? `(Đã duyệt: ${report.approvedPercent}%)` : ''}
      </Text>
      <Text style={styles.cardTextBold}>
        OT hợp lệ sau mốc 5h: {otHours}h {otMinutes > 0 ? `${otMinutes}p` : ''}
      </Text>
      {report.reason ? <Text style={styles.cardText} numberOfLines={2}>Lý do: {report.reason}</Text> : null}

      {/* Ảnh đính kèm */}
      {report.photos && report.photos.length > 0 ? (
        <View style={styles.photoThumbWrapper}>
          <Text style={styles.photoHintText}>
            <MaterialCommunityIcons name="magnify-plus-outline" size={13} color="#6B7280" /> Bấm để phóng to/zoom ảnh
          </Text>
          <View style={styles.reviewPhotoRow}>
            {report.photos.map((p, idx) => {
              const imgUrl = resolveFileUrl(p.file?.fileUrl);
              if (!imgUrl) return null;
              return (
                <TouchableOpacity
                  key={p.id}
                  activeOpacity={0.8}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleOpenPhoto(report.photos || [], idx);
                  }}
                  style={styles.reviewThumbnailContainer}
                >
                  <Image source={{ uri: imgUrl }} style={styles.reviewThumbnail} />
                  <View style={styles.zoomBadge}>
                    <MaterialCommunityIcons name="arrow-expand" size={12} color="#FFFFFF" />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ) : null}

      {report.rejectionReason ? (
        <Text style={[styles.cardText, { color: colors.danger, marginTop: spacing.xs }]}>
          Lý do từ chối: {report.rejectionReason}
        </Text>
      ) : null}

      {report.status === 'REJECTED' ? (
        <View style={{ marginTop: spacing.sm }}>
          <PrimaryButton
            onPress={() => {
              router.push('/employee/ot-report/create' as any);
            }}
          >
            + Nộp lại báo cáo cho ngày này
          </PrimaryButton>
        </View>
      ) : null}

      <ImageView
        images={viewerImages}
        imageIndex={viewerIndex}
        visible={isViewerVisible}
        onRequestClose={() => setIsViewerVisible(false)}
      />

      {isDetailVisible ? (
        <OtReportDetailModal
          report={report}
          onClose={() => setIsDetailVisible(false)}
          onOpenPhoto={(photos, idx) => handleOpenPhoto(photos, idx)}
        />
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.md,
    gap: spacing.md,
  },
  card: {
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  employeeName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  cardText: {
    fontSize: 13,
    color: colors.muted,
  },
  cardTextBold: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 6,
    marginTop: 8,
  },
  modalPickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 8,
  },
  modalPickerText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  rowTwoCols: {
    flexDirection: 'row',
    gap: 12,
  },
  percentRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  percentChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
  },
  percentChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  percentChipText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4B5563',
  },
  percentChipTextActive: {
    color: '#FFFFFF',
  },
  photoSection: {
    marginTop: 10,
    marginBottom: 16,
  },
  photoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  photoSubLabel: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '600',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginVertical: 10,
  },
  photoThumbnail: {
    width: 76,
    height: 76,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#F3F4F6',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  removePhotoButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  photoThumbnailError: {
    borderColor: '#DC2626',
    borderWidth: 2,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  uploadingOverlayText: {
    color: '#FFFFFF',
    fontSize: 9,
    marginTop: 2,
    fontWeight: '600',
  },
  errorOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FEE2E2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 3,
  },
  errorOverlayText: {
    color: '#DC2626',
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 3,
  },
  photoUploading: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#93C5FD',
  },
  uploadingText: {
    fontSize: 10,
    color: '#2563EB',
    marginTop: 4,
  },
  photoActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  photoActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F3F4F6',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  photoActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  reviewPhotoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
    marginBottom: 4,
  },
  reviewThumbnailContainer: {
    width: 68,
    height: 68,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  reviewThumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  zoomBadge: {
    position: 'absolute',
    bottom: 3,
    right: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderRadius: 4,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: {
    flex: 1,
  },
  cardSubText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 1,
  },
  cardTextHighlight: {
    fontWeight: '700',
    color: '#111827',
  },
  validOtBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 4,
    marginBottom: 2,
  },
  photoThumbWrapper: {
    marginTop: 4,
    marginBottom: 6,
  },
  photoHintText: {
    fontSize: 11,
    color: '#6B7280',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  detailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
  },
  detailButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  flexRowGap: {
    flexDirection: 'row',
    gap: 8,
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  modalCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  modalCardSubtitle: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 4,
  },
  reasonInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#111827',
    textAlignVertical: 'top',
    minHeight: 80,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 12,
  },
  dangerButton: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  detailModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  detailModalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    minHeight: '60%',
    paddingBottom: 24,
  },
  detailModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  detailModalSub: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  closeIconBtn: {
    padding: 4,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  detailModalBody: {
    padding: 18,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  detailSectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
  },
  detailInfoGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  detailInfoItem: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  detailItemLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  detailItemVal: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  detailTimeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  detailTimeTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E40AF',
  },
  detailTimeDesc: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E3A8A',
    marginTop: 2,
  },
  detailValidBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#ECFDF5',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  detailValidTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#065F46',
  },
  detailValidDesc: {
    fontSize: 15,
    fontWeight: '800',
    color: '#047857',
    marginTop: 2,
  },
  detailReasonBox: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  detailReasonLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  detailReasonText: {
    fontSize: 14,
    color: '#1F2937',
    lineHeight: 20,
  },
  detailRejectBox: {
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginBottom: 12,
  },
  detailRejectLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
    marginBottom: 4,
  },
  detailRejectText: {
    fontSize: 14,
    color: '#991B1B',
  },
  detailPhotosSection: {
    marginTop: 4,
    marginBottom: 20,
  },
  detailPhotoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  detailPhotoThumb: {
    width: 90,
    height: 90,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  detailPhotoImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  detailZoomOverlay: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderRadius: 6,
    padding: 3,
  },
  detailModalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    paddingHorizontal: 18,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
});
