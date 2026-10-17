import { useRouter } from 'expo-router';
import { useState, useCallback, useEffect } from 'react';
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
  useEligibleOtCheckins,
} from '../../hooks/useOtReport';
import { uploadFile } from '../../api/uploads.api';
import { resolveFileUrl } from '../../utils/url';
import { requestMediaLibraryPermissionWithFallback, requestCameraPermissionWithFallback } from '../../utils/mediaPermissions';
import { useQueryClient } from '@tanstack/react-query';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { shadows } from '../../theme/shadows';
import type { OtReport, OtReportStatus, EligibleCheckinDay } from '../../types/ot-report.types';
import { businessDateToday, formatDate, formatTime, formatDateTime } from '../../utils/date-time';
import { normalizeApiError } from '../../utils/api-error';
import { useAuth } from '../../providers/AuthProvider';
import { isUserInLiveDepartment } from '../../constants/app-registry';

export function OtReportHomeScreen() {
  const router = useRouter();
  const [selectedStatus, setSelectedStatus] = useState<OtReportStatus | 'ALL'>('ALL');
  const reports = useMyOtReports({ status: selectedStatus, page: 1, limit: 50 });
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

        {/* Tab bộ lọc trạng thái */}
        <View style={[styles.tabContainer, { marginTop: spacing.md }]}>
          <TouchableOpacity
            style={[styles.tabButton, selectedStatus === 'ALL' && styles.tabButtonActiveAll]}
            onPress={() => setSelectedStatus('ALL')}
          >
            <MaterialCommunityIcons
              name="format-list-bulleted"
              size={15}
              color={selectedStatus === 'ALL' ? '#4338CA' : '#6B7280'}
            />
            <Text style={[styles.tabText, selectedStatus === 'ALL' && styles.tabTextActiveAll]}>
              Tất cả
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, selectedStatus === 'PENDING' && styles.tabButtonActivePending]}
            onPress={() => setSelectedStatus('PENDING')}
          >
            <MaterialCommunityIcons
              name="clock-outline"
              size={15}
              color={selectedStatus === 'PENDING' ? '#B45309' : '#6B7280'}
            />
            <Text style={[styles.tabText, selectedStatus === 'PENDING' && styles.tabTextActivePending]}>
              Chờ duyệt
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, selectedStatus === 'APPROVED' && styles.tabButtonActiveApproved]}
            onPress={() => setSelectedStatus('APPROVED')}
          >
            <MaterialCommunityIcons
              name="check-circle-outline"
              size={15}
              color={selectedStatus === 'APPROVED' ? '#047857' : '#6B7280'}
            />
            <Text style={[styles.tabText, selectedStatus === 'APPROVED' && styles.tabTextActiveApproved]}>
              Đã duyệt
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, selectedStatus === 'REJECTED' && styles.tabButtonActiveRejected]}
            onPress={() => setSelectedStatus('REJECTED')}
          >
            <MaterialCommunityIcons
              name="close-circle-outline"
              size={15}
              color={selectedStatus === 'REJECTED' ? '#B91C1C' : '#6B7280'}
            />
            <Text style={[styles.tabText, selectedStatus === 'REJECTED' && styles.tabTextActiveRejected]}>
              Từ chối
            </Text>
          </TouchableOpacity>
        </View>

        <SectionCard title={
          selectedStatus === 'PENDING' ? 'Báo cáo chờ duyệt'
          : selectedStatus === 'APPROVED' ? 'Báo cáo đã duyệt'
          : selectedStatus === 'REJECTED' ? 'Báo cáo bị từ chối'
          : 'Báo cáo OT của tôi'
        }>
          {(reports.data?.items ?? []).map((report) => (
            <OtReportCard key={report.id} report={report} />
          ))}
          {!reports.data?.items?.length ? (
            <EmptyState
              title={
                selectedStatus === 'PENDING' ? 'Không có báo cáo chờ duyệt'
                : selectedStatus === 'APPROVED' ? 'Chưa có báo cáo nào được duyệt'
                : selectedStatus === 'REJECTED' ? 'Không có báo cáo bị từ chối'
                : 'Chưa có báo cáo OT nào'
              }
            />
          ) : null}
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

function formatWorkDateLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const year = y ?? new Date().getFullYear();
  const date = new Date(year, (m || 1) - 1, d || 1);
  const today = businessDateToday();
  const dayPad = String(d || 1).padStart(2, '0');
  const monthPad = String(m || 1).padStart(2, '0');
  if (dateStr === today) {
    return `Hôm nay (${dayPad}/${monthPad})`;
  }
  const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const dayOfWeek = dayNames[date.getDay()] ?? '';
  return `${dayOfWeek}, ${dayPad}/${monthPad}/${year}`;
}

export function CreateOtReportScreen() {
  const mutation = useCreateOtReport();
  const eligibleQuery = useEligibleOtCheckins();
  const eligibleDays = eligibleQuery.data ?? [];
  const today = businessDateToday();

  // Selected checkin day
  const [selectedDay, setSelectedDay] = useState<EligibleCheckinDay | null>(null);
  const [otDateStr, setOtDateStr] = useState(today);

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

  const handleSelectDay = (day: EligibleCheckinDay) => {
    setSelectedDay(day);
    setOtDateStr(day.workDate);

    // Điền trước giờ kết thúc/bắt đầu dựa trên lượt làm thực tế nếu có
    if (day.lastCheckOutAt) {
      const out = new Date(day.lastCheckOutAt);
      const eh = out.getHours();
      const em = out.getMinutes();
      setEndHour(eh);
      setEndMinute(em);
      setStartHour(Math.max(0, eh - 3));
      setStartMinute(em);
    }
  };

  // Tự động chọn ca làm việc đầu tiên có thể làm báo cáo
  useEffect(() => {
    if (eligibleDays.length > 0 && !selectedDay) {
      const firstAvailable = eligibleDays.find((d) => d.canReport) || eligibleDays[0];
      if (firstAvailable) {
        handleSelectDay(firstAvailable);
      }
    }
  }, [eligibleDays]);

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

        setPhotos((prev) => [...prev, ...newItems.map((n) => n.photo)]);

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
    if (!selectedDay) {
      showAlert('Chưa chọn ca làm việc', 'Vui lòng chọn một ca làm việc đã check-in trong 7 ngày gần nhất.');
      return;
    }

    if (!selectedDay.canReport) {
      const statusText = selectedDay.existingReport?.status === 'APPROVED' ? 'Đã duyệt' : 'Đang chờ duyệt';
      showAlert('Đã có báo cáo', `Ngày ${formatWorkDateLabel(selectedDay.workDate)} đã có báo cáo (${statusText}).`);
      return;
    }

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
          title="Tạo báo cáo OT - Đội Live"
          subtitle="Chỉ dành cho các ca làm việc có check-in trong 7 ngày gần nhất."
        />

        {/* 1. Danh sách ca làm có check-in trong 7 ngày */}
        <SectionCard title="1. Chọn ca làm việc đã check-in (7 ngày)">
          <Text style={[styles.cardSubText, { marginBottom: 10 }]}>
            Cứ có check-in trong 7 ngày gần nhất sẽ được liệt kê dưới đây để chọn làm báo cáo OT.
          </Text>
          {eligibleQuery.isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#2563EB" />
              <Text style={styles.loadingText}>Đang tải danh sách ca check-in trong tuần...</Text>
            </View>
          ) : eligibleQuery.isError ? (
            <View style={styles.errorBox}>
              <MaterialCommunityIcons name="alert-circle-outline" size={24} color="#DC2626" />
              <Text style={styles.errorBoxText}>
                {normalizeApiError(eligibleQuery.error).message || 'Không thể tải danh sách ca check-in'}
              </Text>
              <SecondaryButton onPress={() => eligibleQuery.refetch()}>Thử lại</SecondaryButton>
            </View>
          ) : eligibleDays.length === 0 ? (
            <View style={styles.emptyCheckinBox}>
              <View style={styles.emptyCheckinIconCircle}>
                <MaterialCommunityIcons name="clock-alert-outline" size={32} color="#D97706" />
              </View>
              <Text style={styles.emptyCheckinTitle}>Không có lượt check-in nào trong 7 ngày</Text>
              <Text style={styles.emptyCheckinDesc}>
                Quy định phòng Live: Bắt buộc phải có lượt check-in thực tế trên hệ thống trong vòng 7 ngày gần nhất thì mới được làm báo cáo OT.
              </Text>
            </View>
          ) : (
            <View style={styles.checkinDayList}>
              {eligibleDays.map((day) => {
                const isSelected = selectedDay?.workDate === day.workDate;
                const dateLabel = formatWorkDateLabel(day.workDate);
                const firstIn = day.firstCheckInAt ? formatTime(day.firstCheckInAt) : '--:--';
                const lastOut = day.lastCheckOutAt ? formatTime(day.lastCheckOutAt) : 'Chưa check-out';
                const workedHours = Math.floor(day.totalWorkedMinutes / 60);
                const workedMins = day.totalWorkedMinutes % 60;

                return (
                  <TouchableOpacity
                    key={day.workDate}
                    style={[
                      styles.checkinDayCard,
                      isSelected && styles.checkinDayCardSelected,
                      !day.canReport && styles.checkinDayCardDisabled,
                    ]}
                    activeOpacity={0.7}
                    onPress={() => {
                      if (!day.canReport) {
                        const statusLabel =
                          day.existingReport?.status === 'APPROVED' ? 'Đã duyệt' : 'Đang chờ duyệt';
                        showAlert(
                          'Đã có báo cáo',
                          `Ngày ${dateLabel} đã có báo cáo OT (${statusLabel}). Không thể gửi thêm báo cáo mới cho ngày này.`
                        );
                        return;
                      }
                      handleSelectDay(day);
                    }}
                  >
                    <View style={styles.checkinDayCardHeader}>
                      <View style={styles.checkinDayCardTitleRow}>
                        <MaterialCommunityIcons
                          name={isSelected ? 'radiobox-marked' : 'radiobox-blank'}
                          size={20}
                          color={isSelected ? '#2563EB' : !day.canReport ? '#CBD5E1' : '#94A3B8'}
                        />
                        <Text
                          style={[
                            styles.checkinDayDateText,
                            isSelected && styles.checkinDayDateTextSelected,
                          ]}
                        >
                          {dateLabel}
                        </Text>
                      </View>

                      {day.existingReport?.status === 'APPROVED' ? (
                        <StatusBadge label="Đã duyệt" tone="success" />
                      ) : day.existingReport?.status === 'PENDING' ? (
                        <StatusBadge label="Chờ duyệt" tone="warning" />
                      ) : day.existingReport?.status === 'REJECTED' ? (
                        <StatusBadge label="Bị từ chối (Nộp lại)" tone="danger" />
                      ) : (
                        <StatusBadge label="Hợp lệ để báo cáo" tone="info" />
                      )}
                    </View>

                    <View style={styles.checkinDayCardDetails}>
                      <View style={styles.checkinDetailItem}>
                        <MaterialCommunityIcons name="login" size={14} color="#059669" />
                        <Text style={styles.checkinDetailText}>Vào: {firstIn}</Text>
                      </View>
                      <View style={styles.checkinDetailItem}>
                        <MaterialCommunityIcons name="logout" size={14} color="#DC2626" />
                        <Text style={styles.checkinDetailText}>Ra: {lastOut}</Text>
                      </View>
                      {day.totalWorkedMinutes > 0 && (
                        <View style={styles.checkinDetailItem}>
                          <MaterialCommunityIcons name="timer-outline" size={14} color="#6366F1" />
                          <Text style={styles.checkinDetailText}>
                            Tổng: {workedHours > 0 ? `${workedHours}h ` : ''}{workedMins}m
                          </Text>
                        </View>
                      )}
                    </View>

                    {day.sessions.length > 1 && (
                      <Text style={styles.checkinSessionCountText}>
                        • Có {day.sessions.length} ca/lượt check-in trong ngày
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </SectionCard>

        {/* 2. Khai báo giờ OT */}
        {selectedDay && selectedDay.canReport && (
          <SectionCard
            title={`2. Khai báo giờ OT (${formatWorkDateLabel(selectedDay.workDate)})`}
          >
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
        )}
      </ScrollView>

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

type OtFilterStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL';


const getInitials = (name?: string) => {
  if (!name) return 'NV';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'NV';
  const first = parts[0] || '';
  if (parts.length === 1) return first.slice(0, 2).toUpperCase();
  const last = parts[parts.length - 1] || '';
  return ((first[0] || '') + (last[0] || '')).toUpperCase() || 'NV';
};

export function LeaderOtReviewScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const rawRoles = user?.roles || [];
  const userRoles = Array.isArray(rawRoles) ? rawRoles : [rawRoles];
  const roleCodes = userRoles.map((r: any) => (typeof r === 'string' ? r : r?.code || r?.name || '').toUpperCase());
  const isAdmin =
    roleCodes.includes('ADMIN') ||
    roleCodes.includes('SUPER_ADMIN');
  const isLive = isUserInLiveDepartment(user);

  const [selectedStatus, setSelectedStatus] = useState<OtFilterStatus>('PENDING');
  const reportsQuery = usePendingOtReports({ status: selectedStatus, page: 1, limit: 50 });
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

  const getSectionTitle = () => {
    switch (selectedStatus) {
      case 'PENDING': return 'Danh sách chờ duyệt';
      case 'APPROVED': return 'Danh sách đã duyệt';
      case 'REJECTED': return 'Danh sách từ chối';
      case 'ALL': return 'Tất cả báo cáo OT';
    }
  };

  const getEmptyStateTitle = () => {
    switch (selectedStatus) {
      case 'PENDING': return 'Không có báo cáo nào đang chờ duyệt';
      case 'APPROVED': return 'Chưa có báo cáo nào được duyệt';
      case 'REJECTED': return 'Không có báo cáo nào bị từ chối';
      case 'ALL': return 'Chưa có báo cáo OT nào';
    }
  };

  if (!isLive && !isAdmin) {
    return (
      <Screen>
        <PageHeader title="Duyệt OT Live" subtitle="Xét duyệt báo cáo tăng ca" />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, marginTop: 40 }}>
          <MaterialCommunityIcons name="shield-lock-outline" size={64} color="#94A3B8" />
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#0F172A', marginTop: 16, textAlign: 'center' }}>
            Quyền truy cập hạn chế
          </Text>
          <Text style={{ fontSize: 14, color: '#64748B', marginTop: 8, textAlign: 'center', lineHeight: 20 }}>
            Chức năng Duyệt OT Live chỉ dành riêng cho Quản lý phòng Live và Quản trị viên hệ thống.
          </Text>
          <View style={{ marginTop: 24, width: '100%', maxWidth: 200 }}>
            <PrimaryButton onPress={() => (router.canGoBack() ? router.back() : router.replace('/leader/(tabs)' as any))}>
              Quay lại
            </PrimaryButton>
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen backgroundColor="#102739" statusBarStyle="light">
      {/* 1. Header with Navy #102739 */}
      <View style={otReviewStyles.header}>
        <View style={otReviewStyles.headerTop}>
          <TouchableOpacity
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/leader/(tabs)' as any))}
            style={otReviewStyles.backBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={otReviewStyles.headerTitleWrap}>
            <Text style={otReviewStyles.headerTitle}>Duyệt báo cáo OT</Text>
            <Text style={otReviewStyles.headerSubtitle}>Quản lý báo cáo OT • Phòng Live</Text>
          </View>
        </View>
      </View>

      {/* 2. Curved White Body Sheet */}
      <View style={otReviewStyles.sheetContainer}>
        {/* Status Underline Tabs */}
        <View style={otReviewStyles.tabsContainer}>
          {[
            { key: 'PENDING', label: 'Chờ duyệt', icon: 'clock-outline' },
            { key: 'APPROVED', label: 'Đã duyệt', icon: 'check-circle-outline' },
            { key: 'REJECTED', label: 'Từ chối', icon: 'close-circle-outline' },
            { key: 'ALL', label: 'Tất cả', icon: 'format-list-bulleted' },
          ].map((tab) => {
            const isActive = selectedStatus === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={otReviewStyles.tabButton}
                onPress={() => setSelectedStatus(tab.key as any)}
                activeOpacity={0.7}
              >
                <View style={otReviewStyles.tabContentRow}>
                  <MaterialCommunityIcons
                    name={tab.icon as any}
                    size={16}
                    color={isActive ? '#102739' : '#64748B'}
                    style={{ marginRight: 4 }}
                  />
                  <Text style={[otReviewStyles.tabText, isActive && otReviewStyles.tabTextActive]}>
                    {tab.label}
                  </Text>
                </View>
                {isActive && <View style={otReviewStyles.tabIndicator} />}
              </TouchableOpacity>
            );
          })}
        </View>

        <ScrollView
          contentContainerStyle={otReviewStyles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />}
        >
          {/* Section Heading */}
          <View style={otReviewStyles.sectionHeader}>
            <Text style={otReviewStyles.sectionTitle}>{getSectionTitle()}</Text>
          </View>

          {/* Cards List */}
          {(reportsQuery.data?.items ?? []).map((report) => {
            const userName = report.user?.profile?.fullName || report.user?.userCode || 'Nhân viên';
            const initials = getInitials(userName);
            const deptName = (report.department?.name || 'LIVESTREAM (MOVIELEGEND-HÀ NỘI)').toUpperCase();
            const otDateStr = formatDate(report.otDate);
            const startStr = `${formatTime(report.startTime)} • ${formatDate(report.startTime)}`;
            const endStr = `${formatTime(report.endTime)} • ${formatDate(report.endTime)}`;
            const validHours = Math.floor(report.validOtMinutes / 60);
            const validMins = report.validOtMinutes % 60;
            const approverName = report.decidedBy?.profile?.fullName || report.decidedBy?.userCode;
            const decidedStr = report.decidedAt ? `${formatDate(report.decidedAt)} • ${formatTime(report.decidedAt)}` : '';
            const photos = report.photos || [];

            return (
              <View key={report.id} style={otReviewStyles.card}>
                {/* 1. Header: Avatar + Name/Dept & Status Badge */}
                <View style={otReviewStyles.cardHeader}>
                  <View style={otReviewStyles.userRowLeft}>
                    <View style={otReviewStyles.avatarCircle}>
                      <Text style={otReviewStyles.avatarText}>{initials}</Text>
                    </View>
                    <View style={otReviewStyles.userTextCol}>
                      <Text style={otReviewStyles.userName} numberOfLines={1}>{userName}</Text>
                      <Text style={otReviewStyles.deptText} numberOfLines={1}>{deptName}</Text>
                    </View>
                  </View>

                  {report.status === 'APPROVED' ? (
                    <View style={otReviewStyles.badgeApproved}>
                      <MaterialCommunityIcons name="check-circle" size={14} color="#059669" />
                      <Text style={otReviewStyles.badgeApprovedText}>Đã duyệt</Text>
                    </View>
                  ) : report.status === 'REJECTED' ? (
                    <View style={otReviewStyles.badgeRejected}>
                      <MaterialCommunityIcons name="close-circle" size={14} color="#DC2626" />
                      <Text style={otReviewStyles.badgeRejectedText}>Từ chối</Text>
                    </View>
                  ) : (
                    <View style={otReviewStyles.badgePending}>
                      <MaterialCommunityIcons name="clock-outline" size={14} color="#B45309" />
                      <Text style={otReviewStyles.badgePendingText}>Chờ duyệt</Text>
                    </View>
                  )}
                </View>

                {/* 2. Date */}
                <View style={otReviewStyles.dateRow}>
                  <MaterialCommunityIcons name="calendar-month-outline" size={16} color="#64748B" />
                  <Text style={otReviewStyles.dateRowLabel}>Ngày OT • </Text>
                  <Text style={otReviewStyles.dateRowValue}>{otDateStr}</Text>
                </View>

                {/* 3. Start -> End Time Range Box */}
                <View style={otReviewStyles.timeRangeBox}>
                  <View style={otReviewStyles.timeCol}>
                    <Text style={otReviewStyles.timeLabel}>Bắt đầu</Text>
                    <Text style={otReviewStyles.timeValue}>{startStr}</Text>
                  </View>
                  <MaterialCommunityIcons name="arrow-right" size={18} color="#94A3B8" />
                  <View style={[otReviewStyles.timeCol, { alignItems: 'flex-end' }]}>
                    <Text style={otReviewStyles.timeLabel}>Kết thúc</Text>
                    <Text style={otReviewStyles.timeValue}>{endStr}</Text>
                  </View>
                </View>

                {/* 4. 3-column Metrics Box */}
                <View style={otReviewStyles.metricsBox}>
                  {/* Col 1: Valid OT */}
                  <View style={otReviewStyles.metricColValid}>
                    <View style={otReviewStyles.metricHeader}>
                      <MaterialCommunityIcons name="clock-outline" size={14} color="#0284C7" />
                      <Text style={otReviewStyles.metricLabel}>OT hợp lệ</Text>
                    </View>
                    <Text style={otReviewStyles.metricValueLarge}>{validHours}h {validMins}p</Text>
                    <Text style={otReviewStyles.metricSub}>Sau mốc 5 giờ</Text>
                  </View>

                  <View style={otReviewStyles.metricDivider} />

                  {/* Col 2: Proposed % */}
                  <View style={otReviewStyles.metricCol}>
                    <View style={otReviewStyles.metricHeader}>
                      <MaterialCommunityIcons name="percent-outline" size={14} color="#0284C7" />
                      <Text style={otReviewStyles.metricLabel}>Đề xuất</Text>
                    </View>
                    <Text style={[otReviewStyles.metricValueLarge, { color: '#059669' }]}>
                      {report.proposedPercent}%
                    </Text>
                  </View>

                  <View style={otReviewStyles.metricDivider} />

                  {/* Col 3: Approved % */}
                  <View style={otReviewStyles.metricCol}>
                    <View style={otReviewStyles.metricHeader}>
                      <MaterialCommunityIcons name="check-circle-outline" size={14} color="#0284C7" />
                      <Text style={otReviewStyles.metricLabel}>Được duyệt</Text>
                    </View>
                    <Text style={[otReviewStyles.metricValueLarge, { color: report.approvedPercent ? '#059669' : '#64748B' }]}>
                      {report.approvedPercent ? `${report.approvedPercent}%` : '--'}
                    </Text>
                  </View>
                </View>

                {/* 5. Decided Info */}
                {report.status === 'APPROVED' && (approverName || decidedStr) && (
                  <View style={otReviewStyles.decidedRow}>
                    <MaterialCommunityIcons name="check-circle" size={16} color="#059669" />
                    <View style={{ flex: 1 }}>
                      <Text style={otReviewStyles.decidedText}>
                        <Text style={{ fontWeight: '700', color: '#059669' }}>{approverName || 'Leader'}</Text> đã duyệt
                      </Text>
                      {decidedStr ? <Text style={otReviewStyles.decidedTime}>{decidedStr}</Text> : null}
                    </View>
                  </View>
                )}

                {report.status === 'REJECTED' && (
                  <View style={otReviewStyles.decidedRow}>
                    <MaterialCommunityIcons name="close-circle" size={16} color="#DC2626" />
                    <View style={{ flex: 1 }}>
                      <Text style={otReviewStyles.decidedText}>
                        <Text style={{ fontWeight: '700', color: '#DC2626' }}>{approverName || 'Leader'}</Text> từ chối
                      </Text>
                      {report.rejectionReason ? (
                        <Text style={otReviewStyles.rejectReasonText}>Lý do: {report.rejectionReason}</Text>
                      ) : null}
                      {decidedStr ? <Text style={otReviewStyles.decidedTime}>{decidedStr}</Text> : null}
                    </View>
                  </View>
                )}

                {/* 6. Reason / Content */}
                {report.reason ? (
                  <View style={otReviewStyles.contentRow}>
                    <MaterialCommunityIcons name="file-document-outline" size={16} color="#64748B" />
                    <Text style={otReviewStyles.contentText} numberOfLines={2}>
                      Nội dung: {report.reason}
                    </Text>
                  </View>
                ) : null}

                {/* 7. Attachments Photos */}
                {photos.length > 0 && (
                  <View style={otReviewStyles.photosSection}>
                    <View style={otReviewStyles.photosHeaderRow}>
                      <MaterialCommunityIcons name="paperclip" size={16} color="#64748B" />
                      <Text style={otReviewStyles.photosHeaderText}>Minh chứng • {photos.length} ảnh</Text>
                    </View>
                    <View style={otReviewStyles.photosThumbRow}>
                      {photos.map((p, pIdx) => {
                        const imgUrl = resolveFileUrl(p.file?.fileUrl);
                        if (!imgUrl) return null;
                        return (
                          <TouchableOpacity
                            key={p.id}
                            activeOpacity={0.85}
                            onPress={() => handleOpenImageViewer(photos, pIdx)}
                            style={otReviewStyles.thumbWrapper}
                          >
                            <Image source={{ uri: imgUrl }} style={otReviewStyles.thumbImage} />
                            <View style={otReviewStyles.thumbZoomIcon}>
                              <MaterialCommunityIcons name="magnify-plus-outline" size={12} color="#FFFFFF" />
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}

                {/* Card Action Buttons */}
                <View style={otReviewStyles.cardActionsRow}>
                  {report.status === 'PENDING' ? (
                    <View style={otReviewStyles.pendingActionBtns}>
                      <TouchableOpacity
                        style={otReviewStyles.quickRejectBtn}
                        onPress={() => handleOpenReject(report)}
                      >
                        <Text style={otReviewStyles.quickRejectText}>Từ chối</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={otReviewStyles.quickApproveBtn}
                        onPress={() => handleOpenApprove(report)}
                      >
                        <Text style={otReviewStyles.quickApproveText}>Duyệt</Text>
                      </TouchableOpacity>
                    </View>
                  ) : null}

                  <TouchableOpacity
                    style={otReviewStyles.viewDetailBtn}
                    onPress={() => setDetailReport(report)}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons name="eye-outline" size={16} color="#0F172A" />
                    <Text style={otReviewStyles.viewDetailText}>Xem chi tiết</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}

          {!reportsQuery.data?.items?.length ? (
            <EmptyState title={getEmptyStateTitle()} />
          ) : null}
        </ScrollView>
      </View>

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
              Nhân viên: <Text style={{ fontWeight: '700', color: '#102739' }}>{approvingReport?.user?.profile?.fullName || approvingReport?.user?.userCode}</Text>
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
              Nhân viên: <Text style={{ fontWeight: '700', color: '#102739' }}>{rejectingReport?.user?.profile?.fullName || rejectingReport?.user?.userCode}</Text>
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

            {/* Thông tin duyệt / từ chối trong modal */}
            {report.status === 'APPROVED' ? (
              <View style={styles.detailApprovedBox}>
                <MaterialCommunityIcons name="check-decagram" size={20} color="#059669" />
                <View style={styles.flex}>
                  <Text style={styles.detailApprovedTitle}>Thông tin duyệt OT:</Text>
                  <Text style={styles.detailApprovedDesc}>
                    Mức công OT được duyệt: <Text style={{ fontWeight: '800' }}>{report.approvedPercent}%</Text>
                  </Text>
                  {report.decidedBy ? (
                    <Text style={styles.detailDeciderText}>
                      Người duyệt: {report.decidedBy.profile?.fullName || report.decidedBy.userCode}
                    </Text>
                  ) : null}
                  {report.decidedAt ? (
                    <Text style={styles.detailDeciderText}>
                      Thời gian: {formatDateTime(report.decidedAt)}
                    </Text>
                  ) : null}
                </View>
              </View>
            ) : null}

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
                {report.decidedBy ? (
                  <Text style={[styles.detailDeciderText, { color: '#991B1B', marginTop: 4 }]}>
                    Người xử lý: {report.decidedBy.profile?.fullName || report.decidedBy.userCode}
                  </Text>
                ) : null}
                {report.decidedAt ? (
                  <Text style={[styles.detailDeciderText, { color: '#991B1B' }]}>
                    Thời gian: {formatDateTime(report.decidedAt)}
                  </Text>
                ) : null}
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
    color: '#102739',
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
    color: '#102739',
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
    color: '#102739',
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
    color: '#102739',
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
    color: '#102739',
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
    color: '#102739',
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
    marginBottom: spacing.md,
    gap: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: 4,
    borderRadius: 8,
    gap: 4,
  },
  tabButtonActivePending: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    ...shadows.sm,
  },
  tabButtonActiveApproved: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    ...shadows.sm,
  },
  tabButtonActiveRejected: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    ...shadows.sm,
  },
  tabButtonActiveAll: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    ...shadows.sm,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabTextActivePending: {
    color: '#B45309',
    fontWeight: '700',
  },
  tabTextActiveApproved: {
    color: '#047857',
    fontWeight: '700',
  },
  tabTextActiveRejected: {
    color: '#B91C1C',
    fontWeight: '700',
  },
  tabTextActiveAll: {
    color: '#4338CA',
    fontWeight: '700',
  },
  approvedInfoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#ECFDF5',
    padding: 10,
    borderRadius: 8,
    marginTop: 6,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  approvedInfoText: {
    fontSize: 13,
    color: '#065F46',
    lineHeight: 18,
  },
  rejectedInfoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FEF2F2',
    padding: 10,
    borderRadius: 8,
    marginTop: 6,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  rejectedInfoText: {
    fontSize: 13,
    color: '#991B1B',
    lineHeight: 18,
  },
  detailApprovedBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#ECFDF5',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  detailApprovedTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#065F46',
  },
  detailApprovedDesc: {
    fontSize: 14,
    color: '#047857',
    marginTop: 2,
  },
  detailDeciderText: {
    fontSize: 12,
    color: '#059669',
    marginTop: 3,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 24,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  errorBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  errorBoxText: {
    fontSize: 13,
    color: '#B91C1C',
    textAlign: 'center',
  },
  emptyCheckinBox: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  emptyCheckinIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  emptyCheckinTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#92400E',
    textAlign: 'center',
    marginBottom: 4,
  },
  emptyCheckinDesc: {
    fontSize: 13,
    color: '#B45309',
    textAlign: 'center',
    lineHeight: 18,
  },
  checkinDayList: {
    gap: 10,
    marginTop: 4,
  },
  checkinDayCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: 12,
    gap: 8,
  },
  checkinDayCardSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
    ...shadows.sm,
  },
  checkinDayCardDisabled: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
    opacity: 0.85,
  },
  checkinDayCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  checkinDayCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  checkinDayDateText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  checkinDayDateTextSelected: {
    color: '#1D4ED8',
  },
  checkinDayCardDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  checkinDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  checkinDetailText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  checkinSessionCountText: {
    fontSize: 11,
    color: '#64748B',
    fontStyle: 'italic',
  },
});



const otReviewStyles = StyleSheet.create({
  header: {
    backgroundColor: '#102739',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 22,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    marginRight: 14,
    padding: 4,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.75)',
    marginTop: 3,
  },
  sheetContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  tabContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#102739',
    fontWeight: '800',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: -1,
    left: 4,
    right: 4,
    height: 3,
    backgroundColor: '#102739',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 40,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  userRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0284C7',
  },
  userTextCol: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  deptText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  badgeApproved: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeApprovedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#166534',
  },
  badgeRejected: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeRejectedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  badgePending: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgePendingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 4,
  },
  dateRowLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  dateRowValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  timeRangeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  timeCol: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 3,
  },
  timeValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  metricsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  metricColValid: {
    flex: 1.2,
  },
  metricCol: {
    flex: 1,
    alignItems: 'center',
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  metricValueLarge: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  metricSub: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 1,
  },
  metricDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#E0F2FE',
    marginHorizontal: 6,
  },
  decidedRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 4,
    marginBottom: 6,
  },
  decidedText: {
    fontSize: 13,
    color: '#334155',
  },
  decidedTime: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  rejectReasonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
    marginTop: 2,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 4,
    marginBottom: 6,
  },
  contentText: {
    flex: 1,
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
  },
  photosSection: {
    marginTop: 6,
    marginBottom: 6,
  },
  photosHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  photosHeaderText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  photosThumbRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  thumbWrapper: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#F1F5F9',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  thumbZoomIcon: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
    paddingTop: 8,
  },
  pendingActionBtns: {
    flexDirection: 'row',
    gap: 8,
    flex: 1,
  },
  quickRejectBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  quickRejectText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
  quickApproveBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#102739',
  },
  quickApproveText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  viewDetailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: '#FFFFFF',
  },
  viewDetailText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
});
