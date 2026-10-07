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
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { EmptyState } from '../../components/EmptyState';
import { FormField } from '../../components/FormField';
import { PageHeader } from '../../components/PageHeader';
import { PrimaryButton, SecondaryButton } from '../../components/Buttons';
import { Screen } from '../../components/Screen';
import { SectionCard } from '../../components/SectionCard';
import { StatusBadge } from '../../components/StatusBadge';
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
  fileId: string;
  url: string;
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
  const [uploading, setUploading] = useState(false);

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
        setUploading(true);
        const uploadedList: UploadedPhoto[] = [];

        for (const asset of result.assets) {
          try {
            const uploaded = await uploadFile({
              uri: asset.uri,
              mimeType: asset.mimeType || 'image/jpeg',
              name: asset.fileName || `ot_proof_${Date.now()}.jpg`,
              purpose: 'OT_REPORT_ATTACHMENT' as any,
            });
            if (uploaded && uploaded.id) {
              uploadedList.push({
                fileId: uploaded.id,
                url: resolveFileUrl(uploaded.fileUrl) || asset.uri,
              });
            }
          } catch (e) {
            console.error('Lỗi upload ảnh:', e);
          }
        }

        setPhotos((prev) => [...prev, ...uploadedList]);
        setUploading(false);
      }
    } catch (err) {
      setUploading(false);
      showAlert('Lỗi', 'Không thể chọn ảnh, vui lòng thử lại.');
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
        setUploading(true);
        const asset = result.assets[0];
        const uploaded = await uploadFile({
          uri: asset.uri,
          mimeType: asset.mimeType || 'image/jpeg',
          name: asset.fileName || `ot_cam_${Date.now()}.jpg`,
          purpose: 'OT_REPORT_ATTACHMENT' as any,
        });

        if (uploaded && uploaded.id) {
          setPhotos((prev) => [
            ...prev,
            {
              fileId: uploaded.id,
              url: resolveFileUrl(uploaded.fileUrl) || asset.uri,
            },
          ]);
        }
        setUploading(false);
      }
    } catch (err) {
      setUploading(false);
      showAlert('Lỗi', 'Không thể chụp ảnh, vui lòng thử lại.');
    }
  };

  const handleRemovePhoto = (fileId: string) => {
    setPhotos((prev) => prev.filter((p) => p.fileId !== fileId));
  };

  async function submit() {
    if (!photos.length) {
      showAlert('Thiếu ảnh bằng chứng', 'Bắt buộc đính kèm ít nhất 1 ảnh làm việc ca live.');
      return;
    }

    const startIso = `${otDateStr}T${String(startHour).padStart(2, '0')}:${String(startMinute).padStart(2, '0')}:00.000Z`;
    // Xử lý nếu kết thúc sang ngày hôm sau (giờ kết thúc nhỏ hơn giờ bắt đầu)
    let endIso = `${otDateStr}T${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}:00.000Z`;
    if (endHour < startHour || (endHour === startHour && endMinute <= startMinute)) {
      const nextDate = new Date(selectedDate);
      nextDate.setDate(nextDate.getDate() + 1);
      const ny = nextDate.getFullYear();
      const nm = String(nextDate.getMonth() + 1).padStart(2, '0');
      const nd = String(nextDate.getDate()).padStart(2, '0');
      endIso = `${ny}-${nm}-${nd}T${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}:00.000Z`;
    }

    try {
      await mutation.mutateAsync({
        otDate: otDateStr,
        startTime: startIso,
        endTime: endIso,
        proposedPercent: Number(proposedPercent) || 100,
        reason,
        photoFileIds: photos.map((p) => p.fileId),
      });
      showAlert('Thành công', 'Đã gửi báo cáo OT, chờ Leader duyệt.');
      router.back();
    } catch (error) {
      const normalized = normalizeApiError(error);
      showAlert(normalized.code, normalized.message);
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <PageHeader
          title="Tạo báo cáo OT"
          subtitle="Chỉ dành cho phòng Live trong 3 ngày gần nhất có check-in."
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
                <View key={p.fileId} style={styles.photoThumbnail}>
                  <Image source={{ uri: p.url }} style={styles.thumbnailImage} />
                  <Pressable
                    style={styles.removePhotoButton}
                    onPress={() => handleRemovePhoto(p.fileId)}
                  >
                    <MaterialCommunityIcons name="close" size={14} color="#FFFFFF" />
                  </Pressable>
                </View>
              ))}

              {uploading && (
                <View style={[styles.photoThumbnail, styles.photoUploading]}>
                  <ActivityIndicator size="small" color="#2563EB" />
                  <Text style={styles.uploadingText}>Đang tải...</Text>
                </View>
              )}
            </View>

            {/* Các nút bấm chọn ảnh / chụp ảnh */}
            <View style={styles.photoActionRow}>
              <Pressable style={styles.photoActionButton} onPress={handlePickImage} disabled={uploading}>
                <MaterialCommunityIcons name="image-multiple" size={20} color="#2563EB" />
                <Text style={styles.photoActionText}>Chọn từ thư viện</Text>
              </Pressable>
              <Pressable style={styles.photoActionButton} onPress={handleTakePhoto} disabled={uploading}>
                <MaterialCommunityIcons name="camera" size={20} color="#059669" />
                <Text style={styles.photoActionText}>Chụp ảnh mới</Text>
              </Pressable>
            </View>
          </View>

          <PrimaryButton onPress={submit} disabled={mutation.isPending || uploading}>
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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['ot-reports'] });
    setRefreshing(false);
  }, [queryClient]);

  async function handleApprove(report: OtReport) {
    try {
      await approveMutation.mutateAsync({
        id: report.id,
        payload: { approvedPercent: report.proposedPercent || 100 },
      });
      showAlert('Thành công', `Đã duyệt báo cáo OT mức ${report.proposedPercent || 100}%`);
    } catch (error) {
      const normalized = normalizeApiError(error);
      showAlert(normalized.code, normalized.message);
    }
  }

  async function handleReject(report: OtReport) {
    try {
      await rejectMutation.mutateAsync({
        id: report.id,
        payload: { rejectionReason: 'Không khớp nội dung ca live' },
      });
      showAlert('Từ chối', 'Đã ghi nhận không công nhận báo cáo OT');
    } catch (error) {
      const normalized = normalizeApiError(error);
      showAlert(normalized.code, normalized.message);
    }
  }

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
                <Text style={styles.employeeName}>
                  {report.user?.profile?.fullName || report.user?.userCode || 'Nhân viên'}
                </Text>
                <StatusBadge status={report.status} />
              </View>
              <Text style={styles.cardText}>Ngày OT: {formatDate(report.otDate)}</Text>
              <Text style={styles.cardText}>
                Thời gian: {formatDateTime(report.startTime)} - {formatDateTime(report.endTime)}
              </Text>
              <Text style={styles.cardText}>% Đề xuất: {report.proposedPercent}%</Text>
              <Text style={styles.cardTextBold}>
                Giờ OT hợp lệ (sau mốc 5h): {Math.floor(report.validOtMinutes / 60)}h{' '}
                {report.validOtMinutes % 60}p
              </Text>
              {report.reason ? <Text style={styles.cardText}>Nội dung: {report.reason}</Text> : null}

              {/* Ảnh đính kèm */}
              {report.photos && report.photos.length > 0 ? (
                <View style={styles.reviewPhotoRow}>
                  {report.photos.map((p) => {
                    const imgUrl = resolveFileUrl(p.file?.fileUrl);
                    if (!imgUrl) return null;
                    return (
                      <Image key={p.id} source={{ uri: imgUrl }} style={styles.reviewThumbnail} />
                    );
                  })}
                </View>
              ) : null}

              <View style={styles.buttonRow}>
                <PrimaryButton onPress={() => void handleApprove(report)}>Duyệt</PrimaryButton>
                <SecondaryButton onPress={() => void handleReject(report)}>Từ chối</SecondaryButton>
              </View>
            </View>
          ))}
          {!pending.data?.items?.length ? <EmptyState title="Không có báo cáo chờ duyệt" /> : null}
        </SectionCard>
      </ScrollView>
    </Screen>
  );
}

function OtReportCard({ report }: { report: OtReport }) {
  const otHours = Math.floor(report.validOtMinutes / 60);
  const otMinutes = report.validOtMinutes % 60;

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.cardTitle}>{formatDate(report.otDate)}</Text>
        <StatusBadge status={report.status} />
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
      {report.reason ? <Text style={styles.cardText}>Lý do: {report.reason}</Text> : null}

      {/* Ảnh đính kèm */}
      {report.photos && report.photos.length > 0 ? (
        <View style={styles.reviewPhotoRow}>
          {report.photos.map((p) => {
            const imgUrl = resolveFileUrl(p.file?.fileUrl);
            if (!imgUrl) return null;
            return (
              <Image key={p.id} source={{ uri: imgUrl }} style={styles.reviewThumbnail} />
            );
          })}
        </View>
      ) : null}

      {report.rejectionReason ? (
        <Text style={[styles.cardText, { color: colors.danger }]}>
          Lý do từ chối: {report.rejectionReason}
        </Text>
      ) : null}
    </View>
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
    color: colors.textSecondary,
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
  reviewThumbnail: {
    width: 64,
    height: 64,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
});
