import * as DocumentPicker from 'expo-document-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { useAppAlert } from '../../contexts/AlertContext';
import { Image, Linking, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View, TextInput, ActivityIndicator, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { requestCameraPermissionWithFallback, requestMediaLibraryPermissionWithFallback } from '../../utils/mediaPermissions';
import ImageView from '../../components/ImageViewer/ImageViewer';
import { Video, ResizeMode } from 'expo-av';
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

export type IncidentArea = 'employee' | 'leader' | 'warehouse' | 'admin' | 'hr';

const incidentTypes: AssetIncidentType[] = ['DAMAGED', 'LOST', 'STOLEN', 'MALFUNCTION', 'OTHER'];
const resolveAssetStatuses: AssetStatus[] = ['IN_STOCK', 'MAINTENANCE', 'LOST', 'DAMAGED', 'DISPOSED'];

function incidentDetailRoute(area: IncidentArea, id: string): string {
  if (area === 'employee') return `/employee/assets/incidents/${id}`;
  if (area === 'leader') return `/leader/incidents/${id}`;
  if (area === 'warehouse') return `/warehouse-manager/asset-incidents/${id}`;
  if (area === 'hr') return `/hr/asset-incidents/${id}`;
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
  const [evidence, setEvidence] = useState<UploadedFileDto | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showAssetSelect, setShowAssetSelect] = useState(false);
  const [showTypeSelect, setShowTypeSelect] = useState(false);
  const { showAlert } = useAppAlert();

  const uploadSelectedFile = async (sourceUri: string, mimeType: string) => {
    try {
      setUploading(true);
      const ext = mimeType === 'video/mp4' ? '.mp4' : '.jpg';
      const uploaded = await uploadFile({
        uri: sourceUri,
        name: `incident-${Date.now()}${ext}`,
        mimeType: mimeType,
        purpose: 'ASSET_INCIDENT',
      });
      setUploading(false);
      setEvidence(uploaded);
    } catch (error: any) {
      setUploading(false);
      showAlert('Lỗi tải file', error.message || 'Không thể tải file lên');
    }
  };

  const pickFile = async () => {
    try {
      const hasPermission = await requestMediaLibraryPermissionWithFallback();
      if (!hasPermission) return;
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: false,
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        await uploadSelectedFile(file.uri, file.type === 'video' ? 'video/mp4' : 'image/jpeg');
      }
    } catch (error: any) {
      showAlert('Lỗi', 'Không thể mở thư viện');
    }
  };

  const takePhoto = async () => {
    try {
      const hasPermission = await requestCameraPermissionWithFallback();
      if (!hasPermission) return;
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        await uploadSelectedFile(file.uri, 'image/jpeg');
      }
    } catch (error: any) {
      showAlert('Lỗi', 'Không thể mở Camera');
    }
  };

  const handleSelectEvidence = () => {
    Alert.alert(
      'Minh chứng sự cố',
      'Bạn muốn cung cấp hình ảnh/video từ đâu?',
      [
        { text: 'Chụp ảnh mới', onPress: takePhoto },
        { text: 'Chọn từ thư viện', onPress: pickFile },
        { text: 'Hủy', style: 'cancel' }
      ]
    );
  };

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
      showAlert('Thành công', 'Đã ghi nhận sự cố');
      router.back();
    } catch (error) {
      const mapped = mapWarehouseAssetError(error);
      showAlert(mapped.code, mapped.message);
    }
  }

  const selectedAsset = myAssets.data?.items.find(a => a.assetId === assetId);

  return (
    <Screen>
      <ScreenContainer style={styles.content} disableGlobalRefresh={true}>
        <PageHeader title="Báo sự cố tài sản" subtitle="Ghi nhận lỗi hỏng hóc hoặc mất mát tài sản." onBack={() => router.back()} />
        <SectionCard>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Tài sản gặp sự cố</Text>
            {myAssets.isLoading ? <LoadingState /> : null}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 8 }}>
              {myAssets.data?.items.map((assignment) => (
                <FilterChip
                  key={assignment.assetId}
                  label={`${assignment.asset.assetCode} - ${assignment.asset.name}`}
                  selected={assetId === assignment.assetId}
                  onPress={() => setAssetId(assignment.assetId)}
                />
              ))}
            </ScrollView>
            {myAssets.data && !myAssets.data.items.length ? <EmptyState title="Bạn chưa được cấp phát tài sản" /> : null}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Loại sự cố</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 8 }}>
              {incidentTypes.map((type) => (
                <FilterChip key={type} label={incidentTypeLabels[type]} selected={incidentType === type} onPress={() => setIncidentType(type)} />
              ))}
            </ScrollView>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Mô tả chi tiết</Text>
            <TextInput
              style={[styles.inputRounded, { height: 100, textAlignVertical: 'top' }]}
              placeholder="Nhập chi tiết về tình trạng hư hỏng hoặc nguyên nhân..."
              placeholderTextColor="#98A0A8"
              value={description}
              onChangeText={setDescription}
              multiline
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { marginBottom: 8 }]}>Minh chứng (Tối đa 1 ảnh/video)</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              {evidence ? (
                <View style={{ position: 'relative', width: 120, height: 120 }}>
                  {evidence.fileUrl.match(/\.(mp4|mov|webm)$/i) ? (
                    <View style={{ width: 120, height: 120, borderRadius: 12, backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center' }}>
                      <MaterialCommunityIcons name="video" size={32} color="#64748B" />
                    </View>
                  ) : (
                    <Image source={{ uri: evidence.fileUrl }} style={{ width: 120, height: 120, borderRadius: 12 }} />
                  )}
                  <Pressable
                    style={{ position: 'absolute', top: -6, right: -6, backgroundColor: '#EF4444', borderRadius: 12, width: 24, height: 24, justifyContent: 'center', alignItems: 'center', zIndex: 10 }}
                    onPress={() => setEvidence(null)}
                  >
                    <MaterialCommunityIcons name="close" size={16} color="#FFF" />
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  style={[
                    { width: 120, height: 120, borderRadius: 12, borderWidth: 1.5, borderColor: '#E2E8F0', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
                    uploading && { opacity: 0.5 },
                  ]}
                  onPress={handleSelectEvidence}
                  disabled={uploading}
                >
                  {uploading ? (
                    <ActivityIndicator size="small" color="#36C59E" />
                  ) : (
                    <View style={{ alignItems: 'center', gap: 4 }}>
                      <MaterialCommunityIcons name="camera-plus" size={32} color="#98A0A8" />
                      <Text style={{ fontSize: 12, color: '#98A0A8', textAlign: 'center' }}>Thêm ảnh{'\n'}hoặc video</Text>
                    </View>
                  )}
                </Pressable>
              )}
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
            <Pressable style={{ flex: 1, backgroundColor: '#F1F5F9', borderRadius: 12, paddingVertical: 14, alignItems: 'center' }} onPress={() => router.back()}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#64748B' }}>Hủy</Text>
            </Pressable>
            <Pressable 
              style={[{ flex: 1, backgroundColor: '#111827', borderRadius: 12, paddingVertical: 14, alignItems: 'center' }, (!assetId || description.trim().length < 3) && { opacity: 0.5 }]} 
              onPress={submit} 
              disabled={!assetId || description.trim().length < 3 || report.isPending}
            >
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#FFFFFF' }}>{report.isPending ? 'Đang gửi...' : 'Gửi báo cáo'}</Text>
            </Pressable>
          </View>
        </SectionCard>
      </ScreenContainer>
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
  const [viewerVisible, setViewerVisible] = useState(false);
  const { showAlert } = useAppAlert();

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
      showAlert('Thành công', 'Đã cập nhật trạng thái sự cố.');
    } catch (error) {
      const mapped = mapWarehouseAssetError(error);
      showAlert(mapped.code, mapped.message);
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
      showAlert('Thành công', 'Đã từ chối sự cố.');
    } catch (error) {
      const mapped = mapWarehouseAssetError(error);
      showAlert(mapped.code, mapped.message);
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
          <Text style={styles.label}>Nhãn hiệu: <Text style={styles.body}>{item.asset?.brand ?? 'N/A'}</Text></Text>
          <Text style={styles.label}>Model: <Text style={styles.body}>{item.asset?.model ?? 'N/A'}</Text></Text>
          <Text style={styles.label}>Ngày cập nhật: <Text style={styles.body}>{formatDateTime(item.createdAt)}</Text></Text>
          <Text style={styles.label}>Ghi chú: <Text style={styles.body}>{item.description}</Text></Text>
          <StatusBadge label={incidentTypeLabels[item.incidentType] ?? item.incidentType} tone={incidentStatusTone(item.status)} />
          {item.evidenceUrl ? (
            <View style={{ marginTop: spacing.md }}>
              <Text style={styles.label}>Minh chứng sự cố:</Text>
              {item.evidenceUrl.match(/\.(mp4|mov|webm)$/i) ? (
                <Video
                  source={{ uri: item.evidenceUrl }}
                  style={{ width: '100%', height: 250, borderRadius: 8, marginTop: spacing.sm, backgroundColor: colors.surface }}
                  useNativeControls
                  resizeMode={ResizeMode.CONTAIN}
                />
              ) : (
                <Pressable onPress={() => setViewerVisible(true)}>
                  <Image
                    source={{ uri: item.evidenceUrl }}
                    style={{ width: '100%', height: 200, borderRadius: 8, marginTop: spacing.sm, backgroundColor: colors.surface }}
                    resizeMode="cover"
                  />
                </Pressable>
              )}
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
      <ImageView
        images={item?.evidenceUrl && !item.evidenceUrl.match(/\.(mp4|mov|webm)$/i) ? [{ uri: item.evidenceUrl }] : []}
        imageIndex={0}
        visible={viewerVisible}
        onRequestClose={() => setViewerVisible(false)}
        animationType="fade"
        swipeToCloseEnabled={false}
      />
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
  formGroup: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#09090B',
    marginBottom: spacing.xs,
  },
  inputRounded: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 15,
    color: '#09090B',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
});
