import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState, useEffect } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, View, Image, TextInput, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { FormField } from '../../components/FormField';
import { FilterChip } from '../../components/FilterChip';
import { LoadingState } from '../../components/LoadingState';
import { PageHeader } from '../../components/PageHeader';
import { PrimaryButton, SecondaryButton } from '../../components/Buttons';
import { Screen } from '../../components/Screen';
import { ScreenContainer } from '../../components/ScreenContainer';
import { SectionCard } from '../../components/SectionCard';
import { StatusBadge } from '../../components/StatusBadge';
import { SelectModal } from '../../components/SelectModal';
import { ConfirmModal } from '../../components/ConfirmModal';
import {
  useAsset,
  useAssets,
  useAssignAsset,
  useConfirmAssetAssignment,
  useCreateAsset,
  useMyAssets,
  useReceiveAssetReturn,
  useRequestAssetReturn,
} from '../../hooks/useAssets';
import { useDepartments } from '../../hooks/useDepartments';
import { useWarehouses } from '../../hooks/useWarehouses';
import { useAuth } from '../../providers/AuthProvider';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import type { AssetConditionStatus } from '../../types/asset.types';
import { formatDateTime } from '../../utils/date-time';
import { hasPermission } from '../../utils/permissions';
import { getScopedEmployees } from '../../api/employees.api';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../constants/queryKeys';
import {
  activeAssignment,
  assetConditionLabels,
  assignmentStatusTone,
  canConfirmAssignment,
  canReceiveReturn,
  canRequestReturn,
  canSeePurchasePrice,
  canStartMaintenance,
  incidentStatusTone,
  isAssignable,
  mapWarehouseAssetError,
} from './asset.logic';
import { AssetCard, AssetConditionBadge, AssetStatusBadge, MyAssetCard } from './AssetComponents';
import { MaintenanceActionsSection } from '../asset-maintenance/MaintenanceScreens';

export type AssetArea = 'employee' | 'leader' | 'warehouse' | 'admin';

const conditionOptions: AssetConditionStatus[] = ['NEW', 'GOOD', 'FAIR', 'POOR', 'DAMAGED'];

function assetBase(area: AssetArea): string {
  return area === 'warehouse' ? '/warehouse-manager/assets' : `/${area}/assets`;
}

export function MyAssetsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const myAssets = useMyAssets();
  const confirm = useConfirmAssetAssignment();
  const requestReturn = useRequestAssetReturn();
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'ACTIVE'>('ALL');
  
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnReason, setReturnReason] = useState('');
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);

  async function runConfirm(assignmentId: string) {
    try {
      await confirm.mutateAsync(assignmentId);
      Alert.alert('Thành công', 'Đã xác nhận nhận tài sản');
    } catch (error) {
      const mapped = mapWarehouseAssetError(error);
      Alert.alert(mapped.code, mapped.message);
    }
  }

  async function runRequestReturn() {
    if (!selectedAssignmentId) return;
    if (!returnReason.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập lý do trả tài sản.');
      return;
    }
    try {
      await requestReturn.mutateAsync({ assignmentId: selectedAssignmentId, payload: { reason: returnReason.trim() } });
      Alert.alert('Thành công', 'Đã gửi yêu cầu trả tài sản');
      setShowReturnModal(false);
      setReturnReason('');
      setSelectedAssignmentId(null);
    } catch (error) {
      const mapped = mapWarehouseAssetError(error);
      Alert.alert(mapped.code, mapped.message);
    }
  }

  const items = myAssets.data?.items ?? [];
  const activeCount = items.filter((a) => a.status === 'ACTIVE').length;
  const pendingCount = items.filter((a) => a.status === 'PENDING').length;

  const visibleItems = useMemo(() => {
    if (activeTab === 'ACTIVE') return items.filter((a) => a.status === 'ACTIVE');
    if (activeTab === 'PENDING') return items.filter((a) => a.status === 'PENDING');
    return items;
  }, [items, activeTab]);

  return (
    <Screen>
      <ScrollView refreshControl={<RefreshControl refreshing={myAssets.isRefetching} onRefresh={() => void myAssets.refetch()} />} contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>Tài sản của tôi</Text>
          <Text style={styles.heroSubtitle}>Quản lý các thiết bị được công ty cấp phát</Text>
          
          <View style={styles.heroStatsContainer}>
            <View style={styles.heroStatBox}>
              <Text style={styles.heroStatNumber}>{activeCount}</Text>
              <Text style={styles.heroStatLabel}>Đang sử dụng</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStatBox}>
              <Text style={[styles.heroStatNumber, pendingCount > 0 && { color: colors.warning }]}>{pendingCount}</Text>
              <Text style={styles.heroStatLabel}>Chờ xác nhận</Text>
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScrollContent}>
            <Pressable style={[styles.tabButton, activeTab === 'ALL' && styles.tabButtonActive]} onPress={() => setActiveTab('ALL')}>
              <Text style={[styles.tabText, activeTab === 'ALL' && styles.tabTextActive]}>Tất cả</Text>
            </Pressable>
            <Pressable style={[styles.tabButton, activeTab === 'ACTIVE' && styles.tabButtonActive]} onPress={() => setActiveTab('ACTIVE')}>
              <Text style={[styles.tabText, activeTab === 'ACTIVE' && styles.tabTextActive]}>Đang dùng</Text>
            </Pressable>
            <Pressable style={[styles.tabButton, activeTab === 'PENDING' && styles.tabButtonActive]} onPress={() => setActiveTab('PENDING')}>
              <Text style={[styles.tabText, activeTab === 'PENDING' && styles.tabTextActive]}>Chờ xác nhận</Text>
            </Pressable>
          </ScrollView>
        </View>

        <View style={styles.listContainer}>
          {myAssets.isLoading ? <LoadingState /> : null}
          {myAssets.isError ? <ErrorState error={myAssets.error} onRetry={() => void myAssets.refetch()} /> : null}
          
          {visibleItems.map((assignment) => (
            <View key={assignment.id} style={styles.cardWrap}>
              <MyAssetCard assignment={assignment} onPress={() => router.push(`/employee/assets/${assignment.assetId}` as never)} />
              
              <View style={styles.actionRow}>
                {canConfirmAssignment(user, assignment) ? (
                  <PrimaryButton style={{ flex: 1 }} loading={confirm.isPending} onPress={() => void runConfirm(assignment.id)}>
                    Xác nhận
                  </PrimaryButton>
                ) : null}
                
                {canRequestReturn(user, assignment) ? (
                  <SecondaryButton style={{ flex: 1 }} onPress={() => { setSelectedAssignmentId(assignment.id); setShowReturnModal(true); }}>
                    Yêu cầu trả
                  </SecondaryButton>
                ) : null}

                {hasPermission(user, 'asset.incident.create') && assignment.status === 'ACTIVE' ? (
                  assignment.asset?.incidents?.some((i: any) => i.status !== 'RESOLVED' && i.status !== 'REJECTED') ? (
                    <Text style={[styles.meta, { color: colors.warning, flex: 1, textAlign: 'center', alignSelf: 'center' }]}>
                      Tài sản này đã có báo cáo sự cố đang được xử lý.
                    </Text>
                  ) : (
                    <SecondaryButton style={{ flex: 1 }} onPress={() => router.push(`/employee/assets/incidents/create?assetId=${assignment.assetId}` as never)}>
                      Báo lỗi
                    </SecondaryButton>
                  )
                ) : null}
              </View>
            </View>
          ))}
          
          {myAssets.data && !visibleItems.length ? (
            <View style={{ marginTop: spacing.xl }}>
              <EmptyState title={activeTab === 'PENDING' ? "Không có tài sản chờ xác nhận" : "Bạn chưa được cấp phát tài sản"} />
            </View>
          ) : null}
        </View>
      </ScrollView>

      <ConfirmModal
        visible={showReturnModal}
        title="Yêu cầu trả tài sản"
        description="Bạn có chắc chắn muốn yêu cầu trả tài sản này?"
        confirmText="Gửi yêu cầu"
        confirmTone="primary"
        isLoading={requestReturn.isPending}
        onConfirm={() => void runRequestReturn()}
        onCancel={() => { setShowReturnModal(false); setSelectedAssignmentId(null); setReturnReason(''); }}
      >
        <FormField
          label="Lý do trả hàng"
          value={returnReason}
          onChangeText={setReturnReason}
          placeholder="Lý do cần trả..."
        />
      </ConfirmModal>
    </Screen>
  );
}

export function AssetListScreen({ area }: { area: AssetArea }) {
  const router = useRouter();
  const { user } = useAuth();
  const assets = useAssets();
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const statuses = useMemo(() => {
    const found = new Set((assets.data?.items ?? []).map((asset) => asset.assetStatus));
    return ['ALL', ...found];
  }, [assets.data]);

  const visible = (assets.data?.items ?? []).filter((asset) => statusFilter === 'ALL' || asset.assetStatus === statusFilter);

  return (
    <Screen>
      <ScreenContainer refreshControl={<RefreshControl refreshing={assets.isRefetching} onRefresh={() => void assets.refetch()} />}>
        <PageHeader title="Tài sản" subtitle="Backend scope theo vai trò; filter trạng thái là client-side trên dữ liệu backend trả." />
        {area === 'admin' && hasPermission(user, 'asset.create') ? (
          <PrimaryButton onPress={() => router.push('/admin/assets/create' as never)}>Tạo tài sản</PrimaryButton>
        ) : null}
        <View style={styles.chipRow}>
          {statuses.map((status) => (
            <FilterChip key={status} label={status} selected={statusFilter === status} onPress={() => setStatusFilter(status)} />
          ))}
        </View>
        {assets.isLoading ? <LoadingState /> : null}
        {assets.isError ? <ErrorState error={assets.error} onRetry={() => void assets.refetch()} /> : null}
        {visible.map((asset) => (
          <AssetCard key={asset.id} asset={asset} onPress={() => router.push(`${assetBase(area)}/${asset.id}` as never)} />
        ))}
        {assets.data && !visible.length ? <EmptyState title="Không có tài sản" /> : null}
      </ScreenContainer>
    </Screen>
  );
}

export function AssetDetailScreen({ area }: { area: AssetArea }) {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const asset = useAsset(id);
  const confirm = useConfirmAssetAssignment();
  const requestReturn = useRequestAssetReturn();
  const receiveReturn = useReceiveAssetReturn();
  const [returnCondition, setReturnCondition] = useState<AssetConditionStatus>('GOOD');
  const [returnNote, setReturnNote] = useState('');
  const [showConditionSelect, setShowConditionSelect] = useState(false);

  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnReason, setReturnReason] = useState('');

  const conditionOptions: AssetConditionStatus[] = ['NEW', 'GOOD', 'FAIR', 'POOR', 'DAMAGED'];

  useEffect(() => {
    if (asset.isError) {
      const err = asset.error as any;
      if (err?.response?.data?.code === 'ASSET_FORBIDDEN' || err?.response?.status === 403 || err?.message?.includes('403')) {
        Alert.alert('Không có quyền', 'Vật tư bị thu hồi', [
          { text: 'OK', onPress: () => router.replace('/employee/assets') }
        ]);
      }
    }
  }, [asset.isError, asset.error, router]);

  if (asset.isLoading) return <LoadingState />;
  if (asset.isError) {
    const err = asset.error as any;
    if (err?.response?.data?.code === 'ASSET_FORBIDDEN' || err?.response?.status === 403 || err?.message?.includes('403')) {
      return <View style={{ flex: 1, backgroundColor: '#f8fafc' }} />;
    }
    return <ErrorState error={asset.error} onRetry={() => void asset.refetch()} />;
  }
  if (!asset.data) return <EmptyState title="Không tìm thấy tài sản" />;

  const item = asset.data;
  const assignment = activeAssignment(item.assignments);
  const isOwner = assignment?.assignedToUserId === user?.id;
  // Backend enforce warehouse scope cho receive-return; UI gate bằng permission WM/Admin thật (asset.assign).
  const canReceive = assignment ? hasPermission(user, 'asset.assign') && canReceiveReturn(user, assignment) : false;

  async function runAction(action: () => Promise<unknown>, successMessage: string) {
    try {
      await action();
      Alert.alert('Thành công', successMessage);
    } catch (error) {
      const mapped = mapWarehouseAssetError(error);
      Alert.alert(mapped.code, mapped.message);
    }
  }

  async function runRequestReturn() {
    if (!assignment) return;
    if (!returnReason.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập lý do trả tài sản.');
      return;
    }
    try {
      await requestReturn.mutateAsync({ assignmentId: assignment.id, payload: { reason: returnReason.trim() } });
      Alert.alert('Thành công', 'Đã gửi yêu cầu trả tài sản');
      setShowReturnModal(false);
      setReturnReason('');
    } catch (error) {
      const mapped = mapWarehouseAssetError(error);
      Alert.alert(mapped.code, mapped.message);
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <PageHeader title={item.name} subtitle={`Mã: ${item.assetCode}`} />
        
        {item.imageUrl ? (
          <View style={{ marginHorizontal: spacing.lg, marginBottom: spacing.md }}>
            <Image source={{ uri: item.imageUrl }} style={{ width: '100%', height: 200, borderRadius: 12, backgroundColor: '#f3f4f6' }} resizeMode="cover" />
          </View>
        ) : null}

        <SectionCard title="Thông tin chi tiết">
          <View style={styles.badgeRow}>
            <AssetStatusBadge status={item.assetStatus} />
            <AssetConditionBadge condition={item.conditionStatus} />
          </View>
          <View style={{ marginTop: spacing.md, gap: 8 }}>
            <Text style={styles.meta}>Tên thiết bị: <Text style={{fontWeight: '600', color: '#1E293B'}}>{item.name}</Text></Text>
            {item.brand ? <Text style={styles.meta}>Hãng: <Text style={{fontWeight: '600', color: '#1E293B'}}>{item.brand}</Text></Text> : null}
            {item.model ? <Text style={styles.meta}>Dòng máy: <Text style={{fontWeight: '600', color: '#1E293B'}}>{item.model}</Text></Text> : null}
            {item.serialNumber ? <Text style={styles.meta}>Serial: <Text style={{fontWeight: '600', color: '#1E293B'}}>{item.serialNumber}</Text></Text> : null}
            {item.conditionNote ? <Text style={styles.meta}>Ghi chú tình trạng: <Text style={{color: '#1E293B'}}>{item.conditionNote}</Text></Text> : null}
            {item.description ? <Text style={styles.body}>{item.description}</Text> : null}
            
            {canSeePurchasePrice(user) && item.purchasePrice !== null && typeof item.purchasePrice !== 'undefined' ? (
              <Text style={styles.meta}>Giá mua: <Text style={{color: '#1E293B'}}>{String(item.purchasePrice)}</Text></Text>
            ) : null}
            {canSeePurchasePrice(user) && item.warrantyEndDate ? (
              <Text style={styles.meta}>Hết bảo hành: <Text style={{color: '#1E293B'}}>{formatDateTime(item.warrantyEndDate)}</Text></Text>
            ) : null}
            {item.createdAt ? <Text style={styles.meta}>Ngày tạo: <Text style={{color: '#1E293B'}}>{formatDateTime(item.createdAt)}</Text></Text> : null}
          </View>
        </SectionCard>

        {assignment ? (
          <SectionCard title="Cấp phát hiện tại">
            <StatusBadge label={assignment.status} tone={assignmentStatusTone(assignment.status)} />
            <Text style={styles.meta}>Cấp lúc: {formatDateTime(assignment.assignedAt)}</Text>
            {assignment.expectedReturnAt ? <Text style={styles.meta}>Hạn trả: {formatDateTime(assignment.expectedReturnAt)}</Text> : null}
            <Text style={styles.meta}>Tình trạng khi cấp: {assetConditionLabels[assignment.conditionWhenAssigned]}</Text>
            {assignment.note ? <Text style={styles.meta}>Ghi chú: {assignment.note}</Text> : null}

            {isOwner && canConfirmAssignment(user, assignment) ? (
              <PrimaryButton
                loading={confirm.isPending}
                onPress={() => void runAction(() => confirm.mutateAsync(assignment.id), 'Đã xác nhận nhận tài sản')}
              >
                Xác nhận nhận tài sản
              </PrimaryButton>
            ) : null}
            {isOwner && canRequestReturn(user, assignment) ? (
              <SecondaryButton
                onPress={() => setShowReturnModal(true)}
              >
                Yêu cầu trả tài sản
              </SecondaryButton>
            ) : null}

            {canReceive ? (
              <View style={styles.receiveBox}>
                <Text style={styles.sectionLabel}>Nhận trả tài sản (tình trạng do backend quyết định trạng thái cuối)</Text>
                <Pressable style={[styles.pickerContainer, { marginBottom: spacing.sm }]} onPress={() => setShowConditionSelect(true)}>
                  <Text style={styles.pickerText}>{assetConditionLabels[returnCondition]}</Text>
                  <MaterialCommunityIcons name="chevron-down" size={20} color="#64748B" />
                </Pressable>
                <FormField label="Ghi chú nhận trả" value={returnNote} onChangeText={setReturnNote} multiline />
                <PrimaryButton
                  loading={receiveReturn.isPending}
                  onPress={() =>
                    void runAction(
                      () =>
                        receiveReturn.mutateAsync({
                          assignmentId: assignment.id,
                          payload: { conditionWhenReturned: returnCondition, ...(returnNote.trim() ? { note: returnNote.trim() } : {}) },
                        }),
                      'Đã nhận trả tài sản',
                    )
                  }
                >
                  Nhận trả
                </PrimaryButton>
              </View>
            ) : null}
          </SectionCard>
        ) : null}

        {hasPermission(user, 'asset.incident.create') && area !== 'admin' ? (
          <SectionCard title="Sự cố">
            {item.incidents?.some((i: any) => i.status !== 'RESOLVED' && i.status !== 'REJECTED') ? (
              <Text style={[styles.meta, { color: colors.warning }]}>
                Tài sản này đã có báo cáo sự cố đang được xử lý.
              </Text>
            ) : (
              <SecondaryButton
                onPress={() =>
                  router.push(`/employee/assets/incidents/create?assetId=${item.id}` as never)
                }
              >
                Báo sự cố tài sản này
              </SecondaryButton>
            )}
          </SectionCard>
        ) : null}

        {item.incidents?.length ? (
          <SectionCard title="Lịch sử sự cố">
            {item.incidents.map((incident) => (
              <View key={incident.id} style={styles.incidentRow}>
                <StatusBadge label={incident.status} tone={incidentStatusTone(incident.status)} />
                <Text style={styles.meta}>
                  {incident.incidentType} — {formatDateTime(incident.createdAt)}
                </Text>
                <Text style={styles.body} numberOfLines={2}>{incident.description}</Text>
              </View>
            ))}
          </SectionCard>
        ) : null}
      </ScrollView>
      <ConfirmModal
        visible={showReturnModal}
        title="Yêu cầu trả tài sản"
        description="Bạn có chắc chắn muốn yêu cầu trả tài sản này? Quá trình này sẽ cần admin xác nhận."
        confirmText="Gửi yêu cầu"
        confirmTone="primary"
        isLoading={requestReturn.isPending}
        onConfirm={() => void runRequestReturn()}
        onCancel={() => setShowReturnModal(false)}
      >
        <FormField
          label="Lý do trả hàng"
          value={returnReason}
          onChangeText={setReturnReason}
          placeholder="Lý do cần trả..."
        />
      </ConfirmModal>

      <SelectModal
        visible={showConditionSelect}
        title="Tình trạng nhận"
        options={conditionOptions.map((c) => ({ id: c, label: assetConditionLabels[c] }))}
        onSelect={(id) => {
          setReturnCondition(id as AssetConditionStatus);
          setShowConditionSelect(false);
        }}
        onClose={() => setShowConditionSelect(false)}
      />
    </Screen>
  );
}

export function AssetCreateScreen() {
  const router = useRouter();
  const create = useCreateAsset();
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('Dell');
  const [customBrand, setCustomBrand] = useState('');
  const [model, setModel] = useState('XPS');
  const [customModel, setCustomModel] = useState('');
  const [conditionNote, setConditionNote] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  
  const [showBrandSelect, setShowBrandSelect] = useState(false);
  const [showModelSelect, setShowModelSelect] = useState(false);

  const brandOptions = ['Dell', 'HP', 'Apple', 'Lenovo', 'Asus', 'Acer', 'Khác'];
  const modelOptions = ['XPS', 'ThinkPad', 'MacBook Pro', 'MacBook Air', 'EliteBook', 'Khác'];

  // Lấy departmentId từ route query params
  const { departmentId = '' } = useLocalSearchParams<{ departmentId?: string }>();

  function generateAssetCode(assetName: string) {
    const prefix = assetName
      .split(' ')
      .filter(Boolean)
      .map(w => w[0]?.toUpperCase() || '')
      .join('')
      .substring(0, 3);
    
    const now = new Date();
    const d = now.getDate().toString().padStart(2, '0');
    const m = (now.getMonth() + 1).toString().padStart(2, '0');
    const y = now.getFullYear().toString().slice(-2);
    const h = now.getHours().toString().padStart(2, '0');
    const min = now.getMinutes().toString().padStart(2, '0');
    
    return `${prefix || 'AST'}-${d}${m}${y}${h}${min}`;
  }

  async function submit() {
    try {
      const generatedCode = generateAssetCode(name.trim());
      const asset = await create.mutateAsync({
        assetCode: generatedCode,
        name: name.trim(),
        ...(brand === 'Khác' ? (customBrand.trim() ? { brand: customBrand.trim() } : {}) : { brand }),
        ...(model === 'Khác' ? (customModel.trim() ? { model: customModel.trim() } : {}) : { model }),
        ...(departmentId ? { departmentId } : {}),
        ...(conditionNote.trim() ? { conditionNote: conditionNote.trim() } : {}),
        ...(imageUrl.trim() ? { imageUrl: imageUrl.trim() } : {}),
      });
      Alert.alert('Thành công', `Đã tạo tài sản ${asset.assetCode}`);
      router.back();
    } catch (error) {
      const mapped = mapWarehouseAssetError(error);
      Alert.alert(mapped.code, mapped.message);
    }
  }

  return (
    <Screen>
      <ScreenContainer style={styles.content} disableGlobalRefresh={true}>
        <PageHeader
          title="Thêm thiết bị"
          subtitle="Tạo mới vật tư/thiết bị cho phòng ban."
          onBack={() => router.back()}
        />
        <SectionCard>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Tên thiết bị</Text>
            <TextInput
              style={styles.inputRounded}
              placeholder="Ví dụ: Laptop làm việc 01"
              placeholderTextColor="#98A0A8"
              value={name}
              onChangeText={setName}
            />
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Hãng / Thương hiệu</Text>
            <Pressable style={styles.pickerContainer} onPress={() => setShowBrandSelect(true)}>
              <Text style={[styles.pickerText, !brand && styles.pickerPlaceholder]}>{brand || 'Chọn hãng sản xuất'}</Text>
              <MaterialCommunityIcons name="chevron-down" size={20} color="#64748B" />
            </Pressable>
          </View>
          {brand === 'Khác' && (
            <FormField label="Nhập tên hãng" value={customBrand} onChangeText={setCustomBrand} />
          )}

          <View style={styles.formGroup}>
            <Text style={styles.label}>Dòng máy / Loại</Text>
            <Pressable style={styles.pickerContainer} onPress={() => setShowModelSelect(true)}>
              <Text style={[styles.pickerText, !model && styles.pickerPlaceholder]}>{model || 'Chọn dòng máy'}</Text>
              <MaterialCommunityIcons name="chevron-down" size={20} color="#64748B" />
            </Pressable>
          </View>
          {model === 'Khác' && (
            <FormField label="Nhập dòng máy" value={customModel} onChangeText={setCustomModel} />
          )}

          <View style={styles.formGroup}>
            <Text style={styles.label}>Ghi chú thủ công (Tình trạng)</Text>
            <TextInput
              style={[styles.inputRounded, { height: 80, textAlignVertical: 'top' }]}
              placeholder="Nhập ghi chú thêm về thiết bị (nếu có)..."
              placeholderTextColor="#98A0A8"
              value={conditionNote}
              onChangeText={setConditionNote}
              multiline
            />
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Ảnh thiết bị</Text>
            <View style={styles.imageUploaderRow}>
              {imageUrl ? (
                <Image source={{ uri: imageUrl }} style={styles.imagePreview} />
              ) : (
                <View style={styles.imageUploaderBox}>
                  <MaterialCommunityIcons name="plus" size={24} color="#98A0A8" />
                </View>
              )}
              <View style={styles.imageUploaderTexts}>
                {/* <Text style={styles.imageUploaderError}>Ảnh quá lớn {'>'}5MB</Text> */}
                <TextInput
                  style={styles.inputRoundedUrl}
                  placeholder="URL ảnh (VD: https://picsum.photos/200)"
                  placeholderTextColor="#98A0A8"
                  value={imageUrl}
                  onChangeText={setImageUrl}
                  autoCapitalize="none"
                />
              </View>
            </View>
          </View>

          <View style={styles.bottomButtonsRow}>
            <Pressable style={styles.cancelBtn} onPress={() => router.back()}>
              <Text style={styles.cancelBtnText}>Hủy</Text>
            </Pressable>
            <Pressable style={[styles.submitBtn, !name.trim() && { opacity: 0.5 }]} onPress={submit} disabled={!name.trim() || create.isPending}>
              <Text style={styles.submitBtnText}>{create.isPending ? 'Đang tạo...' : 'Tạo thiết bị'}</Text>
            </Pressable>
          </View>


        </SectionCard>
      </ScreenContainer>

      <SelectModal
        visible={showBrandSelect}
        title="Chọn hãng sản xuất"
        options={brandOptions.map(b => ({ id: b, label: b }))}
        selectedValue={brand}
        onSelect={(opt) => { setBrand(opt.id); setShowBrandSelect(false); }}
        onClose={() => setShowBrandSelect(false)}
      />
      
      <SelectModal
        visible={showModelSelect}
        title="Chọn dòng máy"
        options={modelOptions.map(m => ({ id: m, label: m }))}
        selectedValue={model}
        onSelect={(opt) => { setModel(opt.id); setShowModelSelect(false); }}
        onClose={() => setShowModelSelect(false)}
      />
    </Screen>
  );
}

export function AssetAssignScreen({ area }: { area: AssetArea }) {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const asset = useAsset(id);
  const assign = useAssignAsset();
  const departments = useDepartments({ page: 1, limit: 50 });
  const [targetType, setTargetType] = useState<'USER' | 'DEPARTMENT'>('USER');
  const [search, setSearch] = useState('');
  const [assignedToUserId, setAssignedToUserId] = useState('');
  const [assignedToDepartmentId, setAssignedToDepartmentId] = useState('');
  const [expectedReturnAt, setExpectedReturnAt] = useState('');
  const [condition, setCondition] = useState<AssetConditionStatus | ''>('');
  const [note, setNote] = useState('');
  const [showEmployeeSelect, setShowEmployeeSelect] = useState(false);
  const [showDepartmentSelect, setShowDepartmentSelect] = useState(false);
  const [showConditionSelect, setShowConditionSelect] = useState(false);

  // Reuse GET /employees/scoped — backend tự giới hạn scope theo actor.
  const employees = useQuery({
    queryKey: queryKeys.scopedEmployees({ search, page: 1, limit: 20 }),
    queryFn: () => getScopedEmployees({ ...(search.trim() ? { search: search.trim() } : {}), page: 1, limit: 20 }),
    enabled: targetType === 'USER',
  });

  async function submit() {
    if (!id) return;
    try {
      await assign.mutateAsync({
        assetId: id,
        payload: {
          ...(targetType === 'USER' ? { assignedToUserId } : { assignedToDepartmentId }),
          ...(expectedReturnAt.trim() ? { expectedReturnAt: expectedReturnAt.trim() } : {}),
          ...(condition ? { conditionWhenAssigned: condition } : {}),
          ...(note.trim() ? { note: note.trim() } : {}),
        },
      });
      Alert.alert('Thành công', 'Đã tạo cấp phát, chờ nhân viên xác nhận');
      router.back();
    } catch (error) {
      const mapped = mapWarehouseAssetError(error);
      Alert.alert(mapped.code, mapped.message);
    }
  }

  if (asset.isLoading) return <LoadingState />;
  if (asset.isError) return <ErrorState error={asset.error} onRetry={() => void asset.refetch()} />;
  if (!asset.data) return <EmptyState title="Không tìm thấy tài sản" />;
  if (!isAssignable(asset.data)) {
    return <EmptyState title="Tài sản không ở trạng thái IN_STOCK" message="Backend chỉ cho cấp phát tài sản trong kho." />;
  }

  const targetChosen = targetType === 'USER' ? Boolean(assignedToUserId) : Boolean(assignedToDepartmentId);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <PageHeader title={`Cấp phát: ${asset.data.name}`} subtitle={asset.data.assetCode} />
        <SectionCard title="Đích cấp phát">
          <View style={styles.chipRow}>
            <FilterChip label="Nhân viên" selected={targetType === 'USER'} onPress={() => setTargetType('USER')} />
            <FilterChip label="Phòng ban" selected={targetType === 'DEPARTMENT'} onPress={() => setTargetType('DEPARTMENT')} />
          </View>
          {targetType === 'USER' ? (
            <View style={{ marginTop: spacing.md }}>
              <Pressable style={styles.pickerContainer} onPress={() => setShowEmployeeSelect(true)}>
                <Text style={assignedToUserId ? styles.pickerText : styles.pickerPlaceholder}>
                  {assignedToUserId 
                    ? (employees.data?.items.find(e => e.id === assignedToUserId)?.fullName || employees.data?.items.find(e => e.id === assignedToUserId)?.userCode || 'Đã chọn nhân viên') 
                    : 'Nhấn để chọn nhân viên...'}
                </Text>
                <MaterialCommunityIcons name="chevron-down" size={20} color="#64748B" />
              </Pressable>
            </View>
          ) : (
            <View style={{ marginTop: spacing.md }}>
              <Pressable style={styles.pickerContainer} onPress={() => setShowDepartmentSelect(true)}>
                <Text style={assignedToDepartmentId ? styles.pickerText : styles.pickerPlaceholder}>
                  {assignedToDepartmentId 
                    ? (departments.data?.items.find(d => d.id === assignedToDepartmentId)?.name || 'Đã chọn phòng ban') 
                    : 'Nhấn để chọn phòng ban...'}
                </Text>
                <MaterialCommunityIcons name="chevron-down" size={20} color="#64748B" />
              </Pressable>
            </View>
          )}
        </SectionCard>
        <SectionCard title="Thông tin cấp phát">
          <FormField label="Hạn trả dự kiến (ISO, tùy chọn)" value={expectedReturnAt} onChangeText={setExpectedReturnAt} placeholder="2026-08-01" autoCapitalize="none" />
          <Text style={styles.sectionLabel}>Tình trạng khi cấp (mặc định theo tài sản)</Text>
          <View style={{ marginBottom: spacing.md }}>
            <Pressable style={styles.pickerContainer} onPress={() => setShowConditionSelect(true)}>
              <Text style={condition ? styles.pickerText : styles.pickerPlaceholder}>
                {condition ? assetConditionLabels[condition] : 'Mặc định (Không đổi)'}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={20} color="#64748B" />
            </Pressable>
          </View>
          <FormField label="Ghi chú" value={note} onChangeText={setNote} multiline />
          <PrimaryButton loading={assign.isPending} disabled={!targetChosen} onPress={() => void submit()}>
            Cấp phát
          </PrimaryButton>
        </SectionCard>
      </ScrollView>

      <SelectModal
        visible={showEmployeeSelect}
        title="Chọn nhân viên"
        options={(employees.data?.items || []).map(e => ({ id: e.id, label: e.fullName || e.userCode, subtitle: e.userCode }))}
        selectedValue={assignedToUserId}
        onSelect={(opt) => { setAssignedToUserId(opt.id); setShowEmployeeSelect(false); }}
        onClose={() => setShowEmployeeSelect(false)}
        isLoading={employees.isLoading}
      />
      
      <SelectModal
        visible={showDepartmentSelect}
        title="Chọn phòng ban"
        options={(departments.data?.items || []).map(d => ({ id: d.id, label: d.name }))}
        selectedValue={assignedToDepartmentId}
        onSelect={(opt) => { setAssignedToDepartmentId(opt.id); setShowDepartmentSelect(false); }}
        onClose={() => setShowDepartmentSelect(false)}
        isLoading={departments.isLoading}
      />

      <SelectModal
        visible={showConditionSelect}
        title="Tình trạng khi cấp"
        options={[{ id: '', label: 'Mặc định' }, ...conditionOptions.map(c => ({ id: c, label: assetConditionLabels[c] }))]}
        selectedValue={condition}
        onSelect={(opt) => { setCondition(opt.id as any); setShowConditionSelect(false); }}
        onClose={() => setShowConditionSelect(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 44,
    backgroundColor: '#F8FAFC',
  },
  pickerText: {
    fontSize: 14,
    color: '#0F172A',
  },
  pickerPlaceholder: {
    color: '#94A3B8',
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  body: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  cardWrap: {
    gap: spacing.sm,
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
  incidentRow: {
    borderLeftColor: colors.primary,
    borderLeftWidth: 3,
    gap: spacing.xs,
    paddingLeft: spacing.md,
  },
  meta: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  receiveBox: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    gap: spacing.sm,
    paddingTop: spacing.md,
  },
  sectionLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  selectorBox: {
    gap: spacing.sm,
  },
  formGroup: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  inputRounded: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#334155',
    backgroundColor: '#FFF',
  },
  inputRoundedUrl: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    color: '#334155',
    backgroundColor: '#FFF',
    marginTop: 8,
  },
  pill: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFF',
  },
  pillSelected: {
    borderColor: '#36C59E',
    backgroundColor: '#F0FDF4',
  },
  pillText: {
    fontSize: 14,
    color: '#64748B',
  },
  pillTextSelected: {
    color: '#36C59E',
    fontWeight: '600',
  },
  imageUploaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageUploaderBox: {
    width: 60,
    height: 60,
    borderWidth: 1,
    borderColor: '#98A0A8',
    borderStyle: 'dashed',
    borderRadius: 8,
    justifyContent: 'flex-end',
  },
  heroSection: {
    backgroundColor: '#FAFAFA',
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    borderBottomWidth: 1,
    borderColor: '#E4E4E7',
    marginBottom: spacing.md,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#09090B',
    marginBottom: spacing.xs,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#71717A',
    marginBottom: spacing.lg,
  },
  heroStatsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  heroStatBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroStatDivider: {
    width: 1,
    backgroundColor: '#E4E4E7',
    marginHorizontal: spacing.md,
  },
  heroStatNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#09090B',
    marginBottom: 4,
  },
  heroStatLabel: {
    fontSize: 13,
    color: '#71717A',
    fontWeight: '500',
  },
  tabContainer: {
    marginBottom: spacing.md,
  },
  tabScrollContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F4F4F5',
    borderWidth: 1,
    borderColor: '#E4E4E7',
  },
  tabButtonActive: {
    backgroundColor: '#09090B',
    borderColor: '#09090B',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#71717A',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  listContainer: {
    paddingHorizontal: spacing.lg,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: -spacing.md,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  imagePreview: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  imageUploaderTexts: {
    flex: 1,
  },
  imageUploaderError: {
    color: '#EF4444',
    fontSize: 12,
  },
  bottomButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  cancelBtnText: {
    color: '#64748B',
    fontSize: 16,
    fontWeight: '600',
  },
  submitBtn: {
    backgroundColor: '#36C59E',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    flex: 1,
    marginLeft: 16,
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
