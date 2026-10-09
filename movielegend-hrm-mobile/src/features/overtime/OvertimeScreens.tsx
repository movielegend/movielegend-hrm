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
  ActivityIndicator,
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
  useApproveOvertimeRequest,
  useCreateOvertimeRequest,
  useMyOvertimeRequests,
  usePendingOvertimeRequests,
  useRejectOvertimeRequest,
} from '../../hooks/useOvertime';
import { uploadFile } from '../../api/uploads.api';
import { resolveFileUrl } from '../../utils/url';
import {
  requestMediaLibraryPermissionWithFallback,
  requestCameraPermissionWithFallback,
} from '../../utils/mediaPermissions';
import { useQueryClient } from '@tanstack/react-query';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import type { OvertimeRequest } from '../../types/overtime.types';
import { businessDateToday, formatDate, formatDateTime } from '../../utils/date-time';
import { normalizeApiError } from '../../utils/api-error';

export function OvertimeHomeScreen() {
  const router = useRouter();
  const overtime = useMyOvertimeRequests({ page: 1, limit: 20 });
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries();
    setRefreshing(false);
  }, [queryClient]);

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />}
      >
        <PageHeader
          title="Đơn tăng ca (OT)"
          subtitle="Danh sách đơn xin tăng ca của tôi và trạng thái phê duyệt."
        />
        <PrimaryButton onPress={() => router.push('/employee/overtime/create' as any)}>
          + Tạo đơn tăng ca mới
        </PrimaryButton>
        <SectionCard title="Lịch sử tăng ca">
          {(overtime.data?.items ?? []).map((request) => (
            <OvertimeCard key={request.id} request={request} />
          ))}
          {!overtime.data?.items?.length ? <EmptyState title="Chưa có đơn tăng ca nào" /> : null}
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

export function CreateOvertimeRequestScreen() {
  const router = useRouter();
  const mutation = useCreateOvertimeRequest();
  const today = businessDateToday();

  // Date selection state
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [workDate, setWorkDate] = useState(today);
  const [dateModalVisible, setDateModalVisible] = useState(false);

  // Time selection state
  const [startHour, setStartHour] = useState(18);
  const [startMinute, setStartMinute] = useState(0);
  const [startTimeModalVisible, setStartTimeModalVisible] = useState(false);

  const [endHour, setEndHour] = useState(20);
  const [endMinute, setEndMinute] = useState(0);
  const [endTimeModalVisible, setEndTimeModalVisible] = useState(false);

  const [reason, setReason] = useState('');
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);

  // Image Viewer state for uploaded photos
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);

  const { showAlert } = useAppAlert();

  const handleSelectDate = (date: Date) => {
    setSelectedDate(date);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    setWorkDate(`${y}-${m}-${d}`);
    setDateModalVisible(false);
  };

  const uploadSinglePhoto = async (
    photoId: string,
    uri: string,
    rawFileName?: string | null,
    rawMimeType?: string | null
  ) => {
    try {
      const fileName = rawFileName || `ot_proof_${Date.now()}.jpg`;
      const mimeType = rawMimeType || 'image/jpeg';
      const uploaded = await uploadFile({
        uri,
        mimeType,
        name: fileName,
        purpose: 'OVERTIME_REQUEST_ATTACHMENT' as any,
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
          item.id === photoId ? { ...item, isUploading: false, error: errMsg } : item
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

  const handleRemovePhoto = (photoId: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
  };

  const handleOpenPreview = (index: number) => {
    setPreviewIndex(index);
    setPreviewVisible(true);
  };

  async function submit() {
    if (reason.trim().length < 3) {
      showAlert('Thiếu lý do', 'Vui lòng nhập lý do tăng ca cụ thể (tối thiểu 3 ký tự).');
      return;
    }

    const isStillUploading = photos.some((p) => p.isUploading);
    if (isStillUploading) {
      showAlert('Đang xử lý ảnh', 'Hình ảnh minh chứng đang được tải lên, vui lòng chờ trong giây lát.');
      return;
    }

    const photoFileIds = photos.map((p) => p.fileId).filter(Boolean) as string[];

    const parts = workDate.split('-');
    const y = Number(parts[0]) || new Date().getFullYear();
    const m = Number(parts[1]) || new Date().getMonth() + 1;
    const d = Number(parts[2]) || new Date().getDate();
    const startDateObj = new Date(y, m - 1, d, startHour, startMinute, 0, 0);
    const endDateObj = new Date(y, m - 1, d, endHour, endMinute, 0, 0);

    if (endDateObj <= startDateObj) {
      showAlert('Thời gian không hợp lệ', 'Giờ kết thúc tăng ca phải sau giờ bắt đầu.');
      return;
    }

    try {
      await mutation.mutateAsync({
        workDate,
        startAt: startDateObj.toISOString(),
        endAt: endDateObj.toISOString(),
        reason: reason.trim(),
        photoFileIds: photoFileIds.length > 0 ? photoFileIds : undefined,
      });
      showAlert('Thành công', 'Đã gửi đơn xin tăng ca thành công.');
      router.back();
    } catch (error) {
      const normalized = normalizeApiError(error);
      showAlert(normalized.code, normalized.message);
    }
  }

  const formatHourMin = (h: number, min: number) => {
    return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <PageHeader
          title="Tạo đơn tăng ca"
          subtitle="Nhập thông tin thời gian, lý do và đính kèm ảnh minh chứng tăng ca."
        />
        <SectionCard>
          {/* Chọn ngày tăng ca */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Ngày làm tăng ca</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setDateModalVisible(true)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="calendar-month-outline" size={20} color={colors.primary} />
              <Text style={styles.pickerButtonText}>{formatDate(workDate)}</Text>
            </TouchableOpacity>
          </View>

          {/* Chọn giờ bắt đầu & kết thúc */}
          <View style={styles.timeRow}>
            <View style={[styles.formGroup, styles.flex]}>
              <Text style={styles.label}>Giờ bắt đầu</Text>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setStartTimeModalVisible(true)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="clock-time-four-outline" size={20} color={colors.primary} />
                <Text style={styles.pickerButtonText}>{formatHourMin(startHour, startMinute)}</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.formGroup, styles.flex]}>
              <Text style={styles.label}>Giờ kết thúc</Text>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setEndTimeModalVisible(true)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="clock-time-eight-outline" size={20} color={colors.primary} />
                <Text style={styles.pickerButtonText}>{formatHourMin(endHour, endMinute)}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Lý do */}
          <FormField
            label="Lý do tăng ca *"
            placeholder="Mô tả công việc tăng ca..."
            value={reason}
            onChangeText={setReason}
            multiline
          />

          {/* Phần đính kèm hình ảnh minh chứng */}
          <View style={styles.photoSection}>
            <Text style={styles.label}>Hình ảnh minh chứng ({photos.length} ảnh)</Text>
            <Text style={styles.photoSubHint}>
              Đính kèm hình ảnh công việc thực tế, màn hình làm việc hoặc minh chứng tăng ca.
            </Text>

            <View style={styles.mediaButtonRow}>
              <TouchableOpacity
                style={[styles.mediaBtn, styles.mediaBtnPrimary]}
                onPress={() => void handlePickImage()}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="image-multiple-outline" size={18} color="#FFFFFF" />
                <Text style={styles.mediaBtnTextPrimary}>Chọn từ thư viện</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.mediaBtn, styles.mediaBtnSecondary]}
                onPress={() => void handleTakePhoto()}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="camera-outline" size={18} color={colors.primary} />
                <Text style={styles.mediaBtnTextSecondary}>Chụp ảnh</Text>
              </TouchableOpacity>
            </View>

            {/* Danh sách ảnh đã chọn */}
            {photos.length > 0 && (
              <View style={styles.photoGrid}>
                {photos.map((item, idx) => (
                  <View key={item.id} style={styles.photoCard}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => handleOpenPreview(idx)}
                      style={styles.photoThumbContainer}
                    >
                      <Image source={{ uri: item.url || item.localUri }} style={styles.photoThumb} />
                      {item.isUploading && (
                        <View style={styles.uploadingOverlay}>
                          <ActivityIndicator color="#FFFFFF" size="small" />
                          <Text style={styles.uploadingText}>Đang tải...</Text>
                        </View>
                      )}
                      {item.error ? (
                        <View style={styles.errorOverlay}>
                          <MaterialCommunityIcons name="alert-circle-outline" size={20} color="#EF4444" />
                          <Text style={styles.errorText}>Lỗi</Text>
                        </View>
                      ) : null}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.removePhotoBtn}
                      onPress={() => handleRemovePhoto(item.id)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <MaterialCommunityIcons name="close-circle" size={22} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          <PrimaryButton
            loading={mutation.isPending}
            disabled={reason.trim().length < 3 || photos.some((p) => p.isUploading)}
            onPress={() => void submit()}
          >
            Gửi đơn tăng ca
          </PrimaryButton>
        </SectionCard>
      </ScrollView>

      {/* Date Picker Modal */}
      <CustomDatePickerModal
        visible={dateModalVisible}
        initialDate={selectedDate}
        onSelect={handleSelectDate}
        onClose={() => setDateModalVisible(false)}
      />

      {/* Time Picker Modals */}
      <CustomTimePickerModal
        visible={startTimeModalVisible}
        title="Chọn giờ bắt đầu tăng ca"
        initialHours={startHour}
        initialMinutes={startMinute}
        onSelect={(h: number, m: number) => {
          setStartHour(h);
          setStartMinute(m);
        }}
        onClose={() => setStartTimeModalVisible(false)}
      />

      <CustomTimePickerModal
        visible={endTimeModalVisible}
        title="Chọn giờ kết thúc tăng ca"
        initialHours={endHour}
        initialMinutes={endMinute}
        onSelect={(h: number, m: number) => {
          setEndHour(h);
          setEndMinute(m);
        }}
        onClose={() => setEndTimeModalVisible(false)}
      />

      {/* Image Viewer */}
      {previewVisible && (
        <ImageView
          images={photos.map((p) => ({ uri: p.url || p.localUri }))}
          imageIndex={previewIndex}
          visible={previewVisible}
          onRequestClose={() => setPreviewVisible(false)}
        />
      )}
    </Screen>
  );
}

export function LeaderOvertimeApprovalsScreen() {
  const pending = usePendingOvertimeRequests({ page: 1, limit: 20, status: 'PENDING' });
  const approve = useApproveOvertimeRequest();
  const reject = useRejectOvertimeRequest();
  const [rejectReason, setRejectReason] = useState('');
  const { showAlert } = useAppAlert();

  async function approveRequest(id: string) {
    try {
      await approve.mutateAsync(id);
      showAlert('Thành công', 'Đã duyệt đơn tăng ca');
    } catch (error) {
      const normalized = normalizeApiError(error);
      showAlert(normalized.code, normalized.message);
    }
  }

  async function rejectRequest(id: string) {
    if (rejectReason.trim().length < 3) {
      showAlert('Thiếu lý do', 'Vui lòng nhập lý do từ chối đơn tăng ca (tối thiểu 3 ký tự).');
      return;
    }
    try {
      await reject.mutateAsync({ id, payload: { reason: rejectReason.trim() } });
      showAlert('Thành công', 'Đã từ chối đơn tăng ca');
      setRejectReason('');
    } catch (error) {
      const normalized = normalizeApiError(error);
      showAlert(normalized.code, normalized.message);
    }
  }

  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries();
    setRefreshing(false);
  }, [queryClient]);

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />}
      >
        <PageHeader
          title="Duyệt đơn tăng ca"
          subtitle="Danh sách đơn tăng ca đang chờ trưởng bộ phận / quản lý phê duyệt."
        />
        <FormField
          label="Lý do từ chối (khi bấm Từ chối)"
          placeholder="Nhập lý do từ chối..."
          value={rejectReason}
          onChangeText={setRejectReason}
        />
        {(pending.data?.items ?? []).map((request) => (
          <SectionCard key={request.id}>
            <OvertimeCard request={request} isLeaderView />
            <View style={styles.actionRow}>
              <View style={styles.flex}>
                <PrimaryButton
                  loading={approve.isPending}
                  onPress={() => void approveRequest(request.id)}
                >
                  Phê duyệt
                </PrimaryButton>
              </View>
              <View style={styles.flex}>
                <SecondaryButton
                  loading={reject.isPending}
                  onPress={() => void rejectRequest(request.id)}
                >
                  Từ chối
                </SecondaryButton>
              </View>
            </View>
          </SectionCard>
        ))}
        {!pending.data?.items?.length ? <EmptyState title="Không có đơn tăng ca nào chờ duyệt" /> : null}
      </ScrollView>
    </Screen>
  );
}

function OvertimeCard({
  request,
  isLeaderView = false,
}: {
  request: OvertimeRequest;
  isLeaderView?: boolean;
}) {
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);

  const photoUrls = (request.photos ?? [])
    .map((p) => resolveFileUrl(p.file?.fileUrl))
    .filter(Boolean) as string[];

  const handleOpenPhoto = (idx: number) => {
    setPreviewIndex(idx);
    setPreviewVisible(true);
  };

  return (
    <View style={styles.cardContainer}>
      <View style={styles.headerRow}>
        <View style={styles.flex}>
          {isLeaderView && (
            <Text style={styles.employeeName}>
              {request.user?.profile?.fullName || request.user?.userCode || 'Nhân viên'}
              {request.department?.name ? ` • ${request.department.name}` : ''}
            </Text>
          )}
          <Text style={styles.title}>{formatDate(request.workDate)}</Text>
        </View>
        <StatusBadge label={request.status} tone={toneForStatus(request.status)} />
      </View>

      <View style={styles.infoRow}>
        <MaterialCommunityIcons name="clock-outline" size={16} color={colors.muted} />
        <Text style={styles.muted}>
          {formatDateTime(request.startAt)} - {formatDateTime(request.endAt)}
        </Text>
      </View>

      <View style={styles.reasonBox}>
        <Text style={styles.reasonLabel}>Lý do:</Text>
        <Text style={styles.reasonText}>{request.reason}</Text>
      </View>

      {request.rejectionReason && (
        <View style={styles.rejectBox}>
          <Text style={styles.rejectLabel}>Lý do từ chối:</Text>
          <Text style={styles.rejectText}>{request.rejectionReason}</Text>
        </View>
      )}

      {/* Hiển thị ảnh minh chứng nếu có */}
      {photoUrls.length > 0 && (
        <View style={styles.attachedPhotosContainer}>
          <Text style={styles.attachedPhotosTitle}>
            <MaterialCommunityIcons name="image-multiple-outline" size={14} color="#6B7280" /> Ảnh minh chứng ({photoUrls.length} ảnh - bấm để phóng to)
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.attachedPhotosScroll}>
            {photoUrls.map((url, idx) => (
              <TouchableOpacity
                key={idx}
                activeOpacity={0.8}
                onPress={() => handleOpenPhoto(idx)}
                style={styles.attachedPhotoThumbWrapper}
              >
                <Image source={{ uri: url }} style={styles.attachedPhotoThumb} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Image Viewer modal */}
      {previewVisible && (
        <ImageView
          images={photoUrls.map((uri) => ({ uri }))}
          imageIndex={previewIndex}
          visible={previewVisible}
          onRequestClose={() => setPreviewVisible(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    padding: spacing.lg,
  },
  cardContainer: {
    gap: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  flex: {
    flex: 1,
  },
  employeeName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 2,
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  muted: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  reasonBox: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: spacing.sm,
    marginTop: 2,
  },
  reasonLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.muted,
  },
  reasonText: {
    fontSize: 13,
    color: colors.text,
    marginTop: 2,
  },
  rejectBox: {
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    padding: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: '#EF4444',
  },
  rejectLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
  rejectText: {
    fontSize: 13,
    color: '#991B1B',
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  formGroup: {
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  timeRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  pickerButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  photoSection: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  photoSubHint: {
    fontSize: 12,
    color: colors.muted,
    marginBottom: spacing.sm,
  },
  mediaButtonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  mediaBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  mediaBtnPrimary: {
    backgroundColor: colors.primary,
  },
  mediaBtnSecondary: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  mediaBtnTextPrimary: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  mediaBtnTextSecondary: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  photoCard: {
    position: 'relative',
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
  },
  photoThumbContainer: {
    width: '100%',
    height: '100%',
  },
  photoThumb: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  uploadingText: {
    color: '#FFFFFF',
    fontSize: 10,
    marginTop: 2,
    fontWeight: '600',
  },
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(254, 226, 226, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 10,
    marginTop: 2,
    fontWeight: '700',
  },
  removePhotoBtn: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  attachedPhotosContainer: {
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  attachedPhotosTitle: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 6,
  },
  attachedPhotosScroll: {
    gap: 8,
  },
  attachedPhotoThumbWrapper: {
    width: 64,
    height: 64,
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  attachedPhotoThumb: {
    width: '100%',
    height: '100%',
  },
});
