import * as DocumentPicker from 'expo-document-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { uploadFile } from '../../api/uploads.api';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { FilterChip } from '../../components/FilterChip';
import { FormField } from '../../components/FormField';
import { LoadingState } from '../../components/LoadingState';
import { PageHeader } from '../../components/PageHeader';
import { PrimaryButton, SecondaryButton } from '../../components/Buttons';
import { Screen } from '../../components/Screen';
import { ScreenContainer } from '../../components/ScreenContainer';
import { SectionCard } from '../../components/SectionCard';
import { StatusBadge } from '../../components/StatusBadge';
import { useAssetIncident, useAssetIncidentAction, useAssetIncidents, useReportAssetIncident } from '../../hooks/useAssetIncidents';
import { useMyAssets } from '../../hooks/useAssets';
import { useAuth } from '../../providers/AuthProvider';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import type { AssetStatus } from '../../types/asset.types';
import type { AssetIncidentType } from '../../types/asset-incident.types';
import type { UploadedFileDto } from '../../types/upload.types';
import { formatDateTime } from '../../utils/date-time';
import { hasPermission } from '../../utils/permissions';
import { incidentStatusTone, incidentTypeLabels, mapWarehouseAssetError } from '../assets/asset.logic';
import { IncidentCard } from '../assets/AssetComponents';

export type IncidentArea = 'employee' | 'leader' | 'warehouse' | 'admin';

const incidentTypes: AssetIncidentType[] = ['DAMAGED', 'LOST', 'STOLEN', 'MALFUNCTION', 'OTHER'];
const resolveAssetStatuses: AssetStatus[] = ['IN_STOCK', 'MAINTENANCE', 'LOST', 'DAMAGED', 'DISPOSED'];

function incidentDetailRoute(area: IncidentArea, id: string): string {
  if (area === 'employee') return `/employee/assets/incidents/${id}`;
  if (area === 'leader') return `/leader/incidents/${id}`;
  if (area === 'warehouse') return `/warehouse-manager/asset-incidents/${id}`;
  return `/admin/asset-incidents/${id}`;
}

export function IncidentReportScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ assetId?: string }>();
  const myAssets = useMyAssets();
  const report = useReportAssetIncident();
  const [assetId, setAssetId] = useState(params.assetId ?? '');
  const [incidentType, setIncidentType] = useState<AssetIncidentType>('DAMAGED');
  const [description, setDescription] = useState('');
  // Giữ file đã upload để retry nếu API incident fail — không upload lại, không fake URL.
  const [evidence, setEvidence] = useState<UploadedFileDto | null>(null);
  const [uploading, setUploading] = useState(false);

  async function pickEvidence() {
    const picked = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
    if (picked.canceled || !picked.assets?.[0]) return;
    const file = picked.assets[0];
    setUploading(true);
    try {
      const uploaded = await uploadFile({
        uri: file.uri,
        name: file.name,
        mimeType: file.mimeType ?? 'application/octet-stream',
        purpose: 'ASSET_INCIDENT',
      });
      setEvidence(uploaded);
    } catch (error) {
      const mapped = mapWarehouseAssetError(error);
      Alert.alert(mapped.code, mapped.message);
    } finally {
      setUploading(false);
    }
  }

  async function submit() {
    try {
      await report.mutateAsync({
        assetId,
        payload: {
          incidentType,
          description: description.trim(),
          ...(evidence ? { evidenceUrl: evidence.fileUrl } : {}),
        },
      });
      Alert.alert('Thành công', 'Đã ghi nhận sự cố');
      router.back();
    } catch (error) {
      // evidence giữ nguyên trong state → user bấm gửi lại không cần upload lại (retry giữ fileId).
      const mapped = mapWarehouseAssetError(error);
      Alert.alert(mapped.code, mapped.message);
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <PageHeader title="Báo sự cố tài sản" subtitle="Chỉ báo được tài sản đang cấp phát cho bạn — backend enforce." />
        <SectionCard title="Tài sản">
          {myAssets.isLoading ? <LoadingState /> : null}
          {myAssets.data?.items.map((assignment) => (
            <FilterChip
              key={assignment.assetId}
              label={`${assignment.asset.assetCode} ${assignment.asset.name}`}
              selected={assetId === assignment.assetId}
              onPress={() => setAssetId(assignment.assetId)}
            />
          ))}
          {myAssets.data && !myAssets.data.items.length ? <EmptyState title="Bạn chưa được cấp phát tài sản" /> : null}
        </SectionCard>
        <SectionCard title="Sự cố">
          <View style={styles.chipRow}>
            {incidentTypes.map((type) => (
              <FilterChip key={type} label={incidentTypeLabels[type]} selected={incidentType === type} onPress={() => setIncidentType(type)} />
            ))}
          </View>
          <FormField label="Mô tả" value={description} onChangeText={setDescription} multiline />
          <SecondaryButton loading={uploading} onPress={() => void pickEvidence()}>
            {evidence ? 'Đổi minh chứng' : 'Đính kèm minh chứng (tùy chọn)'}
          </SecondaryButton>
          {evidence ? <Text style={styles.meta}>Đã upload: {evidence.fileUrl}</Text> : null}
          <PrimaryButton
            loading={report.isPending}
            disabled={!assetId || description.trim().length < 3}
            onPress={() => void submit()}
          >
            Gửi báo cáo
          </PrimaryButton>
        </SectionCard>
      </ScrollView>
    </Screen>
  );
}

export function IncidentListScreen({ area }: { area: IncidentArea }) {
  const router = useRouter();
  const { user } = useAuth();
  const canRead = hasPermission(user, 'asset.incident.read');
  const incidents = useAssetIncidents(canRead);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const visible = useMemo(() => {
    return (incidents.data?.items ?? []).filter(
      (incident) =>
        (statusFilter === 'ALL' || incident.status === statusFilter) &&
        (typeFilter === 'ALL' || incident.incidentType === typeFilter),
    );
  }, [incidents.data, statusFilter, typeFilter]);

  if (!canRead) {
    return (
      <Screen>
        <ScreenContainer>
          <PageHeader title="Sự cố tài sản" />
          <EmptyState
            title="Không có quyền asset.incident.read"
            message="Backend hiện chỉ cấp quyền này cho Warehouse Manager/Admin và chưa hỗ trợ scope own/department (blocker B7)."
          />
        </ScreenContainer>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenContainer refreshControl={<RefreshControl refreshing={incidents.isRefetching} onRefresh={() => void incidents.refetch()} />}>
        <PageHeader
          title="Sự cố tài sản"
          subtitle="Backend trả toàn bộ list (không filter server-side — blocker B7); filter dưới đây là client-side."
        />
        <View style={styles.chipRow}>
          {['ALL', 'OPEN', 'INVESTIGATING', 'RESOLVED', 'REJECTED'].map((status) => (
            <FilterChip key={status} label={status} selected={statusFilter === status} onPress={() => setStatusFilter(status)} />
          ))}
        </View>
        <View style={styles.chipRow}>
          {['ALL', ...incidentTypes].map((type) => (
            <FilterChip key={type} label={type} selected={typeFilter === type} onPress={() => setTypeFilter(type)} />
          ))}
        </View>
        {incidents.isLoading ? <LoadingState /> : null}
        {incidents.isError ? <ErrorState error={incidents.error} onRetry={() => void incidents.refetch()} /> : null}
        {visible.map((incident) => (
          <IncidentCard key={incident.id} incident={incident} onPress={() => router.push(incidentDetailRoute(area, incident.id) as never)} />
        ))}
        {incidents.data && !visible.length ? <EmptyState title="Không có sự cố" /> : null}
      </ScreenContainer>
    </Screen>
  );
}

export function IncidentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const incident = useAssetIncident(id);
  const action = useAssetIncidentAction();
  const [resolutionNote, setResolutionNote] = useState('');
  const [assetStatus, setAssetStatus] = useState<AssetStatus | ''>('');

  async function run(kind: 'investigate' | 'resolve' | 'reject') {
    if (!id) return;

    try {
      if (kind === 'resolve') {
        await action.mutateAsync({
          id,
          action: kind,
          payload: {
            ...(assetStatus ? { assetStatus } : {}),
            ...(resolutionNote.trim()
              ? { resolutionNote: resolutionNote.trim() }
              : {}),
          },
        });
      } else {
        await action.mutateAsync({
          id,
          action: kind,
        });
      }

      Alert.alert(
        'Thành công',
        'Đã cập nhật sự cố — trạng thái tài sản do backend quyết định',
      );
    } catch (error) {
      const mapped = mapWarehouseAssetError(error);
      Alert.alert(mapped.code, mapped.message);
    }
  }

  if (incident.isLoading) return <LoadingState />;
  if (incident.isError) return <ErrorState error={incident.error} onRetry={() => void incident.refetch()} />;
  if (!incident.data) return <EmptyState title="Không tìm thấy sự cố" />;

  const item = incident.data;
  const canResolve = hasPermission(user, 'asset.incident.resolve');
  const isOpenState = item.status === 'OPEN' || item.status === 'INVESTIGATING';

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <PageHeader title={item.asset?.name ?? 'Sự cố tài sản'} subtitle={item.asset?.assetCode ?? item.assetId} />
        <SectionCard title="Thông tin sự cố">
          <StatusBadge label={item.status} tone={incidentStatusTone(item.status)} />
          <Text style={styles.meta}>Loại: {incidentTypeLabels[item.incidentType] ?? item.incidentType}</Text>
          <Text style={styles.meta}>Người báo: {item.reportedById}</Text>
          <Text style={styles.meta}>Lúc: {formatDateTime(item.createdAt)}</Text>
          <Text style={styles.body}>{item.description}</Text>
          {item.evidenceUrl ? <Text style={styles.meta}>Minh chứng: {item.evidenceUrl}</Text> : null}
        </SectionCard>
        {item.resolvedAt ? (
          <SectionCard title="Kết quả xử lý">
            <Text style={styles.meta}>Xử lý bởi: {item.resolvedById}</Text>
            <Text style={styles.meta}>Lúc: {formatDateTime(item.resolvedAt)}</Text>
            {item.resolutionNote ? <Text style={styles.body}>{item.resolutionNote}</Text> : null}
          </SectionCard>
        ) : null}
        {canResolve && isOpenState ? (
          <SectionCard title="Xử lý">
            {item.status === 'OPEN' ? (
              <SecondaryButton loading={action.isPending} onPress={() => void run('investigate')}>Bắt đầu điều tra</SecondaryButton>
            ) : null}
            <FormField label="Ghi chú xử lý" value={resolutionNote} onChangeText={setResolutionNote} multiline />
            <Text style={styles.label}>Trạng thái tài sản sau xử lý (tùy chọn — bỏ trống để backend tự quyết)</Text>
            <View style={styles.chipRow}>
              {resolveAssetStatuses.map((status) => (
                <FilterChip
                  key={status}
                  label={status}
                  selected={assetStatus === status}
                  onPress={() => setAssetStatus(assetStatus === status ? '' : status)}
                />
              ))}
            </View>
            <PrimaryButton loading={action.isPending} onPress={() => void run('resolve')}>Resolve</PrimaryButton>
            <SecondaryButton loading={action.isPending} onPress={() => void run('reject')}>Reject</SecondaryButton>
          </SectionCard>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  content: {
    gap: spacing.lg,
    padding: spacing.lg,
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  meta: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
});
