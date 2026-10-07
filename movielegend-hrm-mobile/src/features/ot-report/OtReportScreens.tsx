import { useRouter } from 'expo-router';
import { useState, useCallback } from 'react';
import { useAppAlert } from '../../contexts/AlertContext';
import { ScrollView, StyleSheet, Text, View, RefreshControl, Image, TouchableOpacity } from 'react-native';
import { EmptyState } from '../../components/EmptyState';
import { FormField } from '../../components/FormField';
import { PageHeader } from '../../components/PageHeader';
import { PrimaryButton, SecondaryButton } from '../../components/Buttons';
import { Screen } from '../../components/Screen';
import { SectionCard } from '../../components/SectionCard';
import { StatusBadge } from '../../components/StatusBadge';
import {
  useMyOtReports,
  usePendingOtReports,
  useCreateOtReport,
  useApproveOtReport,
  useRejectOtReport,
} from '../../hooks/useOtReport';
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
          Tạo báo cáo OT mới
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

export function CreateOtReportScreen() {
  const mutation = useCreateOtReport();
  const today = businessDateToday();
  const [otDate, setOtDate] = useState(today);
  const [startTime, setStartTime] = useState(`${today}T21:00:00.000Z`);
  const [endTime, setEndTime] = useState(`${today}T23:00:00.000Z`);
  const [proposedPercent, setProposedPercent] = useState('100');
  const [reason, setReason] = useState('');
  const [photoFileIds, setPhotoFileIds] = useState<string[]>([]);
  const { showAlert } = useAppAlert();
  const router = useRouter();

  async function submit() {
    if (!photoFileIds.length) {
      showAlert('Thiếu ảnh', 'Bắt buộc đính kèm ít nhất 1 ảnh làm việc để xác nhận OT.');
      return;
    }
    try {
      await mutation.mutateAsync({
        otDate,
        startTime,
        endTime,
        proposedPercent: Number(proposedPercent) || 100,
        reason,
        photoFileIds,
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
          <FormField
            label="Ngày OT (YYYY-MM-DD)"
            value={otDate}
            onChangeText={setOtDate}
            placeholder="2026-10-06"
          />
          <FormField
            label="Bắt đầu (ISO DateTime)"
            value={startTime}
            onChangeText={setStartTime}
          />
          <FormField
            label="Kết thúc (ISO DateTime)"
            value={endTime}
            onChangeText={setEndTime}
          />
          <FormField
            label="% Lương đề xuất (100, 150, 200)"
            value={proposedPercent}
            onChangeText={setProposedPercent}
          />
          <FormField
            label="Mô tả công việc"
            value={reason}
            onChangeText={setReason}
            placeholder="Nội dung ca live, setup phòng..."
          />
          <PrimaryButton onPress={submit} disabled={mutation.isPending}>
            {mutation.isPending ? 'Đang gửi...' : 'Gửi báo cáo OT'}
          </PrimaryButton>
        </SectionCard>
      </ScrollView>
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
              <Text style={styles.cardText}>% Đề xuất: {report.proposedPercent}%</Text>
              <Text style={styles.cardText}>
                Giờ OT hợp lệ: {Math.floor(report.validOtMinutes / 60)}h {report.validOtMinutes % 60}p
              </Text>
              {report.reason ? <Text style={styles.cardText}>Lý do: {report.reason}</Text> : null}
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
    borderRadius: 8,
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
    fontWeight: '600',
    color: colors.primary,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
});
