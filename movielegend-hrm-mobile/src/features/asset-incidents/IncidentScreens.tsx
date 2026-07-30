import * as DocumentPicker from 'expo-document-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Image, Linking, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { uploadFile } from '../../api/uploads.api';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { FilterChip } from '../../components/FilterChip';
import { SearchInput } from '../../components/SearchInput';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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
  const [statusFilter, setStatusFilter] = useState('OPEN');
  const [search, setSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  const visible = useMemo(() => {
    return (incidents.data?.items ?? []).filter((incident) => {
      const matchStatus = statusFilter === 'ALL' || incident.status === statusFilter;
      const matchSearch = search.trim() === '' || 
        incident.asset?.name?.toLowerCase().includes(search.toLowerCase()) ||
        incident.asset?.assetCode?.toLowerCase().includes(search.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [incidents.data, statusFilter, search]);

  if (!canRead) {
    return (
      <Screen>
        <ScreenContainer>
          <PageHeader title="Sự cố tài sản" />
          <EmptyState
            title="Không có quyền"
            message="Bạn không có quyền xem sự cố tài sản."
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
          subtitle="Quản lý tài sản cần duyệt trạng thái"
        />
        
        <View style={[styles.headerRow, { zIndex: 10, elevation: 10 }]}>
          <View style={{ flex: 1 }}>
            <SearchInput value={search} onChangeText={setSearch} placeholder="Tìm kiếm tài sản..." />
          </View>
          <View style={{ zIndex: 10, elevation: 10 }}>
            <Pressable style={styles.filterButton} onPress={() => setModalVisible(!modalVisible)}>
              <MaterialCommunityIcons name="filter-variant" size={20} color={colors.primary} />
              <Text style={styles.filterText}>{statusFilter === 'OPEN' ? 'Chờ xử lý' : statusFilter === 'RESOLVED' ? 'Đã xử lý' : 'Tất cả'}</Text>
            </Pressable>
            {modalVisible && (
              <View style={styles.dropdown}>
                <Pressable style={styles.dropdownItem} onPress={() => { setStatusFilter('OPEN'); setModalVisible(false); }}>
                  <Text style={[styles.dropdownText, statusFilter === 'OPEN' && styles.dropdownTextActive]}>Chờ xử lý</Text>
                </Pressable>
                <Pressable style={styles.dropdownItem} onPress={() => { setStatusFilter('RESOLVED'); setModalVisible(false); }}>
                  <Text style={[styles.dropdownText, statusFilter === 'RESOLVED' && styles.dropdownTextActive]}>Đã xử lý</Text>
                </Pressable>
              </View>
            )}
          </View>
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

  async function runResolve(status: AssetStatus) {
    if (!id) return;
    try {
      await action.mutateAsync({
        id,
        action: 'resolve',
        payload: {
          assetStatus: status,
          ...(resolutionNote.trim() ? { resolutionNote: resolutionNote.trim() } : {}),
        },
      });
      Alert.alert('Thành công', 'Đã cập nhật trạng thái sự cố.');
    } catch (error) {
      const mapped = mapWarehouseAssetError(error);
      Alert.alert(mapped.code, mapped.message);
    }
  }

  async function runReject() {
    if (!id) return;
    try {
      await action.mutateAsync({
        id,
        action: 'reject',
        payload: {
          ...(resolutionNote.trim() ? { resolutionNote: resolutionNote.trim() } : {}),
        },
      });
      Alert.alert('Thành công', 'Đã từ chối sự cố.');
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
        <PageHeader title="Chi tiết sự cố" subtitle="Thông tin tài sản và xử lý" />
        
        <SectionCard title="Thông tin vật tư">
          <Text style={styles.label}>Tên tài sản: <Text style={styles.body}>{item.asset?.name}</Text></Text>
          <Text style={styles.label}>Mã: <Text style={styles.body}>{item.asset?.assetCode}</Text></Text>
          <Text style={styles.label}>Nhãn hiệu: <Text style={styles.body}>{item.asset?.metadata?.brand ?? 'N/A'}</Text></Text>
          <Text style={styles.label}>Model: <Text style={styles.body}>{item.asset?.metadata?.model ?? 'N/A'}</Text></Text>
          <Text style={styles.label}>Ngày cập nhật: <Text style={styles.body}>{formatDateTime(item.createdAt)}</Text></Text>
          <Text style={styles.label}>Ghi chú: <Text style={styles.body}>{item.description}</Text></Text>
          <StatusBadge label={incidentTypeLabels[item.incidentType] ?? item.incidentType} tone={incidentStatusTone(item.status)} />
          {item.evidenceUrl ? (
            <View style={{ marginTop: spacing.md }}>
              <Text style={styles.label}>Minh chứng sự cố:</Text>
              <Pressable onPress={() => { if (item.evidenceUrl) void Linking.openURL(item.evidenceUrl); }}>
                <Image
                  source={{ uri: item.evidenceUrl }}
                  style={{ width: '100%', height: 200, borderRadius: 8, marginTop: spacing.sm, backgroundColor: colors.surface }}
                  resizeMode="cover"
                />
              </Pressable>
            </View>
          ) : (
            <Text style={[styles.label, { marginTop: spacing.md }]}>Minh chứng sự cố: <Text style={styles.body}>Không có</Text></Text>
          )}
        </SectionCard>

        {item.resolvedAt ? (
          <SectionCard title="Kết quả xử lý">
            <Text style={styles.meta}>Xử lý bởi: {item.resolvedById}</Text>
            <Text style={styles.meta}>Lúc: {formatDateTime(item.resolvedAt)}</Text>
            <Text style={styles.label}>Ghi chú xử lý: <Text style={styles.body}>{item.resolutionNote ?? 'Không có'}</Text></Text>
          </SectionCard>
        ) : null}

        {canResolve && isOpenState ? (
          <SectionCard title="Xử lý sự cố">
            <FormField label="Ghi chú xử lý" value={resolutionNote} onChangeText={setResolutionNote} multiline placeholder="Nhập ghi chú xử lý (tùy chọn)..." />
            <View style={styles.buttonRow}>
              <View style={{ flex: 1 }}>
                <SecondaryButton loading={action.isPending} onPress={() => void runReject()}>Chưa hỏng</SecondaryButton>
              </View>
              <View style={{ flex: 1 }}>
                <PrimaryButton loading={action.isPending} onPress={() => void runResolve('DAMAGED')}>Hỏng</PrimaryButton>
              </View>
            </View>
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
  headerRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
    alignItems: 'center',
    zIndex: 10,
    elevation: 10
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    gap: spacing.xs,
  },
  filterText: { color: colors.primary, fontSize: 14, fontWeight: '500' },
  dropdown: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: 4,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    minWidth: 120,
    zIndex: 100,
  },
  dropdownItem: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dropdownText: { fontSize: 14, color: colors.text },
  dropdownTextActive: { color: colors.primary, fontWeight: 'bold' },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
});
