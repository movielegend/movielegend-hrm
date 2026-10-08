import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState, useEffect } from 'react';
import { useAppAlert } from '../../contexts/AlertContext';
import {RefreshControl, ScrollView, StyleSheet, Text, View, Pressable, TextInput, Image, Switch, Platform, ActivityIndicator, StatusBar} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { requestCameraPermissionWithFallback, requestMediaLibraryPermissionWithFallback } from '../../utils/mediaPermissions';
import { uploadFile } from '../../api/uploads.api';
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
import type { AssetConditionStatus, AssetStatus } from '../../types/asset.types';
import { formatDateTime } from '../../utils/date-time';
import { hasPermission } from '../../utils/permissions';
import { getScopedEmployees } from '../../api/employees.api';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../constants/queryKeys';
import {
  activeAssignment,
  assetConditionLabels,
  assetStatusLabels,
  assignmentStatusTone,
  canConfirmAssignment,
  canReceiveReturn,
  canRequestReturn,
  canSeePurchasePrice,
  canStartMaintenance,
  incidentStatusTone,
  incidentStatusLabels,
  incidentTypeLabels,
  isAssignable,
  mapWarehouseAssetError,
  assignmentStatusLabels,
} from './asset.logic';
import { AssetCard, AssetConditionBadge, AssetStatusBadge, MyAssetCard } from './AssetComponents';
import { MaintenanceActionsSection } from '../asset-maintenance/MaintenanceScreens';
import { CustomAlert } from '../../components/CustomAlert';

export type AssetArea = 'employee' | 'leader' | 'warehouse' | 'admin';

const conditionOptions: AssetConditionStatus[] = ['NEW', 'GOOD', 'FAIR', 'POOR', 'DAMAGED'];

function assetBase(area: AssetArea): string {
  return area === 'warehouse' ? '/warehouse-manager/assets' : `/${area}/assets`;
}

export function MyAssetsScreen({ area = 'employee' }: { area?: AssetArea }) {
  const router = useRouter();
  const { user } = useAuth();
  const myAssets = useMyAssets();
  const confirm = useConfirmAssetAssignment();
  const requestReturn = useRequestAssetReturn();
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'ACTIVE'>('ALL');

  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnReason, setReturnReason] = useState('');
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const { showAlert } = useAppAlert();

  async function runConfirm(assignmentId: string) {
    try {
      await confirm.mutateAsync(assignmentId);
      showAlert('Thành công', 'Đã xác nhận nhận tài sản');
    } catch (error) {
      const mapped = mapWarehouseAssetError(error);
      showAlert(mapped.code, mapped.message);
    }
  }

  async function runRequestReturn() {
    if (!selectedAssignmentId) return;
    if (!returnReason.trim()) {
      showAlert('Lỗi', 'Vui lòng nhập lý do trả tài sản.');
      return;
    }
    try {
      await requestReturn.mutateAsync({ assignmentId: selectedAssignmentId, payload: { reason: returnReason.trim() } });
      showAlert('Thành công', 'Đã gửi yêu cầu trả tài sản');
      setShowReturnModal(false);
      setReturnReason('');
      setSelectedAssignmentId(null);
    } catch (error) {
      const mapped = mapWarehouseAssetError(error);
      showAlert(mapped.code, mapped.message);
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
              <MyAssetCard assignment={assignment} onPress={() => router.push(`/${area}/assets/${assignment.assetId}` as never)} />

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
                    <SecondaryButton style={{ flex: 1 }} onPress={() => router.push(`/${area}/assets/incidents/create?assetId=${assignment.assetId}` as never)}>
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
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const assets = useAssets();
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [showFilterModal, setShowFilterModal] = useState<boolean>(false);

  const filterOptions = useMemo(() => [
    { id: 'ALL', label: 'Tất cả' },
    { id: 'AVAILABLE', label: 'Sẵn sàng / Trong kho' },
    { id: 'IN_USE', label: 'Đang sử dụng' },
    { id: 'MAINTENANCE', label: 'Bảo trì / Sửa chữa' },
    { id: 'BROKEN', label: 'Hỏng hóc' },
    { id: 'DISPOSED', label: 'Đã thanh lý' },
  ], []);

  const currentFilterLabel = useMemo(() => {
    return filterOptions.find(f => f.id === statusFilter)?.label || 'Tất cả';
  }, [filterOptions, statusFilter]);

  const items = assets.data?.items ?? [];
  const visible = items.filter((asset) => statusFilter === 'ALL' || asset.assetStatus === statusFilter);

  return (
    <View style={adminAssetStyles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#1B3B2B" translucent={false} />
      
      {/* Header Container */}
      <View style={[adminAssetStyles.headerWrap, { paddingTop: Math.max(insets.top, 16) + 4 }]}>
        <Text style={adminAssetStyles.title}>Quản lý tài sản</Text>
        <Text style={adminAssetStyles.subtitle}>Theo dõi tài sản & thiết bị.</Text>
      </View>

      {/* Main White Curved Sheet */}
      <View style={adminAssetStyles.curvedCard}>
        {/* Card Header */}
        <View style={adminAssetStyles.listCardHeader}>
          <Text style={adminAssetStyles.listCardTitle}>Danh sách tài sản</Text>
          <Text style={adminAssetStyles.listCardCount}>{visible.length} tài sản</Text>
        </View>

        {/* Filter Pill */}
        <View style={adminAssetStyles.filterPillRow}>
          <Pressable 
            style={adminAssetStyles.filterPill} 
            onPress={() => setShowFilterModal(true)}
          >
            <MaterialCommunityIcons name="menu" size={16} color="#475569" />
            <Text style={adminAssetStyles.filterPillText}>{currentFilterLabel}</Text>
          </Pressable>
        </View>

        {/* Scrollable Content */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingBottom: 24 }}
          refreshControl={
            <RefreshControl 
              refreshing={assets.isRefetching} 
              onRefresh={() => void assets.refetch()} 
              tintColor="#1B3B2B" 
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {assets.isLoading ? <LoadingState label="Đang tải danh sách tài sản..." /> : null}
          {assets.isError ? <ErrorState error={assets.error} onRetry={() => void assets.refetch()} /> : null}

          {!assets.isLoading && !assets.isError && visible.length === 0 ? (
            <View style={adminAssetStyles.emptyCenterContainer}>
              <View style={adminAssetStyles.emptyCircle}>
                <MaterialCommunityIcons name="laptop" size={76} color="#1E3E2B" />
                <View style={adminAssetStyles.emptyBoxBadge}>
                  <MaterialCommunityIcons name="package-variant-closed" size={40} color="#2D5A40" />
                </View>
              </View>
              <Text style={adminAssetStyles.emptyTitle}>Chưa có tài sản</Text>
              <Text style={adminAssetStyles.emptySubtitle}>
                Thêm thiết bị đầu tiên để bắt đầu quản lý.
              </Text>
            </View>
          ) : null}

          {!assets.isLoading && !assets.isError && visible.length > 0 ? (
            visible.map((asset) => (
              <Pressable
                key={asset.id}
                style={adminAssetStyles.assetItemCard}
                onPress={() => router.push(`${assetBase(area)}/${asset.id}` as never)}
              >
                <View style={adminAssetStyles.assetItemIconBox}>
                  <MaterialCommunityIcons 
                    name={
                      asset.name?.toLowerCase().includes('laptop') || asset.name?.toLowerCase().includes('macbook')
                        ? 'laptop'
                        : asset.name?.toLowerCase().includes('màn hình') || asset.name?.toLowerCase().includes('monitor')
                        ? 'monitor'
                        : 'devices'
                    } 
                    size={24} 
                    color="#1B3B2B" 
                  />
                </View>
                <View style={adminAssetStyles.assetItemInfo}>
                  <Text style={adminAssetStyles.assetItemName} numberOfLines={1}>{asset.name}</Text>
                  <Text style={adminAssetStyles.assetItemSub}>
                    Mã: {asset.assetCode} {asset.brand ? `• ${asset.brand}` : ''} {asset.model ? `• ${asset.model}` : ''}
                  </Text>
                </View>
                <AssetStatusBadge status={asset.assetStatus} />
                <MaterialCommunityIcons name="chevron-right" size={20} color="#94A3B8" />
              </Pressable>
            ))
          ) : null}
        </ScrollView>

        {/* Bottom Fixed Action Bar */}
        {(area === 'admin' || hasPermission(user, 'asset.create')) ? (
          <View style={[adminAssetStyles.bottomBarFixed, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <Pressable 
              style={adminAssetStyles.primaryCreateBtn} 
              onPress={() => router.push(`${assetBase(area)}/create` as never)}
            >
              <MaterialCommunityIcons name="plus" size={22} color="#FFFFFF" />
              <Text style={adminAssetStyles.primaryCreateBtnText}>Tạo tài sản</Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      <SelectModal
        visible={showFilterModal}
        title="Lọc theo trạng thái"
        options={filterOptions}
        selectedValue={statusFilter}
        onSelect={(opt) => {
          setStatusFilter(opt.id);
          setShowFilterModal(false);
        }}
        onClose={() => setShowFilterModal(false)}
      />
    </View>
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
  const { showAlert } = useAppAlert();

  const conditionOptions: AssetConditionStatus[] = ['NEW', 'GOOD', 'FAIR', 'POOR', 'DAMAGED'];

  useEffect(() => {
    if (asset.isError) {
      const err = asset.error as any;
      if (err?.response?.data?.code === 'ASSET_FORBIDDEN' || err?.response?.status === 403 || err?.message?.includes('403')) {
        CustomAlert.alert('Không có quyền', 'Vật tư bị thu hồi', [
          { text: 'OK', onPress: () => router.replace(`/${area}/assets` as never) }
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
      showAlert('Thành công', successMessage);
    } catch (error) {
      const mapped = mapWarehouseAssetError(error);
      showAlert(mapped.code, mapped.message);
    }
  }

  async function runRequestReturn() {
    if (!assignment) return;
    if (!returnReason.trim()) {
      showAlert('Lỗi', 'Vui lòng nhập lý do trả tài sản.');
      return;
    }
    try {
      await requestReturn.mutateAsync({ assignmentId: assignment.id, payload: { reason: returnReason.trim() } });
      showAlert('Thành công', 'Đã gửi yêu cầu trả tài sản');
      setShowReturnModal(false);
      setReturnReason('');
    } catch (error) {
      const mapped = mapWarehouseAssetError(error);
      showAlert(mapped.code, mapped.message);
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
            <Text style={styles.meta}>Tên thiết bị: <Text style={{ fontWeight: '600', color: '#1E293B' }}>{item.name}</Text></Text>
            {item.brand ? <Text style={styles.meta}>Hãng: <Text style={{ fontWeight: '600', color: '#1E293B' }}>{item.brand}</Text></Text> : null}
            {item.model ? <Text style={styles.meta}>Dòng máy: <Text style={{ fontWeight: '600', color: '#1E293B' }}>{item.model}</Text></Text> : null}
            {item.serialNumber ? <Text style={styles.meta}>Serial: <Text style={{ fontWeight: '600', color: '#1E293B' }}>{item.serialNumber}</Text></Text> : null}
            {item.conditionNote ? <Text style={styles.meta}>Ghi chú tình trạng: <Text style={{ color: '#1E293B' }}>{item.conditionNote}</Text></Text> : null}
            {item.description ? <Text style={styles.body}>{item.description}</Text> : null}

            {canSeePurchasePrice(user) && item.purchasePrice !== null && typeof item.purchasePrice !== 'undefined' ? (
              <Text style={styles.meta}>Giá mua: <Text style={{ color: '#1E293B' }}>{String(item.purchasePrice)}</Text></Text>
            ) : null}
            {canSeePurchasePrice(user) && item.warrantyEndDate ? (
              <Text style={styles.meta}>Hết bảo hành: <Text style={{ color: '#1E293B' }}>{formatDateTime(item.warrantyEndDate)}</Text></Text>
            ) : null}
            {item.createdAt ? <Text style={styles.meta}>Ngày tạo: <Text style={{ color: '#1E293B' }}>{formatDateTime(item.createdAt)}</Text></Text> : null}
          </View>
        </SectionCard>

        {assignment ? (
          <SectionCard title="Cấp phát hiện tại">
            <StatusBadge label={assignmentStatusLabels[assignment.status] ?? assignment.status} tone={assignmentStatusTone(assignment.status)} />
            <Text style={styles.meta}>Cấp lúc: {formatDateTime(assignment.assignedAt)}</Text>
            {assignment.expectedReturnAt ? <Text style={styles.meta}>Hạn trả: {formatDateTime(assignment.expectedReturnAt)}</Text> : null}
            <Text style={styles.meta}>Tình trạng khi cấp: {assetConditionLabels[assignment.conditionWhenAssigned]}</Text>
            {assignment.note ? <Text style={styles.meta}>Ghi chú: {assignment.note}</Text> : null}

            {isOwner && canConfirmAssignment(user, assignment) ? (
              <PrimaryButton
                loading={confirm.isPending}
                onPress={() => void runAction(() => confirm.mutateAsync(assignment.id), 'Đã xác nhận nhận tài sản')}
                style={{ marginTop: 8 }}
              >
                Xác nhận nhận tài sản
              </PrimaryButton>
            ) : null}

            {(isOwner && canRequestReturn(user, assignment)) || (hasPermission(user, 'asset.incident.create') && area !== 'admin') ? (
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                {isOwner && canRequestReturn(user, assignment) ? (
                  <SecondaryButton
                    style={{ flex: 1 }}
                    onPress={() => setShowReturnModal(true)}
                  >
                    Yêu cầu trả
                  </SecondaryButton>
                ) : null}

                {hasPermission(user, 'asset.incident.create') && area !== 'admin' ? (
                  <SecondaryButton
                    style={{ flex: 1 }}
                    onPress={() => router.push(`/${area}/assets/incidents/create?assetId=${item.id}` as never)}
                    disabled={item.incidents?.some((i: any) => i.status !== 'RESOLVED' && i.status !== 'REJECTED')}
                  >
                    Báo sự cố
                  </SecondaryButton>
                ) : null}
              </View>
            ) : null}

            {item.incidents?.some((i: any) => i.status !== 'RESOLVED' && i.status !== 'REJECTED') && hasPermission(user, 'asset.incident.create') && area !== 'admin' ? (
              <Text style={[styles.meta, { color: colors.warning, marginTop: 8 }]}>
                Tài sản này đã có báo cáo sự cố đang được xử lý.
              </Text>
            ) : null}

            {canReceive ? (
              <View style={styles.receiveBox}>
                <FormField label="Ghi chú thu hồi" value={returnNote} onChangeText={setReturnNote} multiline />
                <PrimaryButton
                  loading={receiveReturn.isPending}
                  onPress={() =>
                    void runAction(
                      () =>
                        receiveReturn.mutateAsync({
                          assignmentId: assignment.id,
                          payload: { conditionWhenReturned: returnCondition, ...(returnNote.trim() ? { note: returnNote.trim() } : {}) },
                        }),
                      'Đã thu hồi tài sản',
                    )
                  }
                >
                  Thu hồi
                </PrimaryButton>
              </View>
            ) : null}
          </SectionCard>
        ) : null}

        {item.incidents?.length ? (
          <SectionCard title="Lịch sử sự cố">
            {item.incidents.map((incident) => (
              <View key={incident.id} style={styles.incidentRow}>
                <StatusBadge label={incidentStatusLabels[incident.status] ?? incident.status} tone={incidentStatusTone(incident.status)} />
                <Text style={styles.meta}>
                  {incidentTypeLabels[incident.incidentType] ?? incident.incidentType} — {formatDateTime(incident.createdAt)}
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
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [showBrandSelect, setShowBrandSelect] = useState(false);
  const [showModelSelect, setShowModelSelect] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { showAlert } = useAppAlert();

  const uploadSelectedImage = async (sourceUri: string) => {
    try {
      setIsUploading(true);
      const uploaded = await uploadFile({
        uri: sourceUri,
        name: `asset-${Date.now()}.jpg`,
        mimeType: 'image/jpeg',
        purpose: 'ASSET_INCIDENT',
      });
      setIsUploading(false);

      const cdnUrl = uploaded.fileUrl || (uploaded as any).url;
      if (cdnUrl) {
        setImageUrls(prev => [...prev, cdnUrl]);
      }
    } catch (error: any) {
      setIsUploading(false);
      showAlert('Lỗi tải ảnh', error.message || 'Không thể tải ảnh lên');
    }
  };

  const pickImage = async () => {
    try {
      const hasPermission = await requestMediaLibraryPermissionWithFallback();
      if (!hasPermission) return;
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        await uploadSelectedImage(result.assets[0].uri);
      }
    } catch (error: any) {
      showAlert('Lỗi', 'Không thể mở thư viện ảnh');
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
        await uploadSelectedImage(result.assets[0].uri);
      }
    } catch (error: any) {
      showAlert('Lỗi', 'Không thể mở Camera');
    }
  };

  const handleSelectImage = () => {
    CustomAlert.alert(
      'Ảnh thiết bị',
      'Bạn muốn chọn ảnh từ đâu?',
      [
        { text: 'Chụp ảnh mới', onPress: takePhoto },
        { text: 'Chọn từ thư viện', onPress: pickImage },
        { text: 'Hủy', style: 'cancel' }
      ]
    );
  };

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
        ...(imageUrls.length > 0 ? { imageUrl: imageUrls.join(',') } : {}),
      });
      showAlert('Thành công', `Đã tạo tài sản ${asset.assetCode}`);
      router.back();
    } catch (error) {
      const mapped = mapWarehouseAssetError(error);
      showAlert(mapped.code, mapped.message);
    }
  }

  const insets = useSafeAreaInsets();

  return (
    <View style={adminAssetStyles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#1B3B2B" translucent={false} />

      {/* Header Container */}
      <View style={[adminAssetStyles.headerWrap, { paddingTop: Math.max(insets.top, 16) + 4 }]}>
        <View style={adminAssetStyles.headerRow}>
          <Pressable style={adminAssetStyles.backBtn} onPress={() => router.back()} hitSlop={10}>
            <MaterialCommunityIcons name="chevron-left" size={28} color="#FFFFFF" />
          </Pressable>
          <View style={adminAssetStyles.headerTextWrap}>
            <Text style={adminAssetStyles.title}>Thêm thiết bị</Text>
            <Text style={adminAssetStyles.subtitle}>Tạo mới vật tư, thiết bị cho phòng ban.</Text>
          </View>
        </View>
      </View>

      {/* Main Curved White Form Sheet */}
      <View style={adminAssetStyles.curvedCard}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={adminAssetStyles.formContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={adminAssetStyles.formSectionTitle}>Thông tin thiết bị</Text>

          {/* Tên thiết bị */}
          <View style={adminAssetStyles.formField}>
            <Text style={adminAssetStyles.fieldLabel}>Tên thiết bị</Text>
            <TextInput
              style={adminAssetStyles.fieldInput}
              placeholder="Ví dụ: Laptop làm việc 01"
              placeholderTextColor="#94A3B8"
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* Hãng / Thương hiệu */}
          <View style={adminAssetStyles.formField}>
            <Text style={adminAssetStyles.fieldLabel}>Hãng / Thương hiệu</Text>
            <Pressable
              style={adminAssetStyles.fieldDropdown}
              onPress={() => setShowBrandSelect(true)}
            >
              <Text style={adminAssetStyles.fieldDropdownText}>{brand || 'Chọn hãng sản xuất'}</Text>
              <MaterialCommunityIcons name="chevron-down" size={20} color="#64748B" />
            </Pressable>
          </View>
          {brand === 'Khác' && (
            <View style={adminAssetStyles.formField}>
              <Text style={adminAssetStyles.fieldLabel}>Nhập tên hãng</Text>
              <TextInput
                style={adminAssetStyles.fieldInput}
                placeholder="Nhập tên hãng sản xuất"
                placeholderTextColor="#94A3B8"
                value={customBrand}
                onChangeText={setCustomBrand}
              />
            </View>
          )}

          {/* Dòng máy / Loại */}
          <View style={adminAssetStyles.formField}>
            <Text style={adminAssetStyles.fieldLabel}>Dòng máy / Loại</Text>
            <Pressable
              style={adminAssetStyles.fieldDropdown}
              onPress={() => setShowModelSelect(true)}
            >
              <Text style={adminAssetStyles.fieldDropdownText}>{model || 'Chọn dòng máy'}</Text>
              <MaterialCommunityIcons name="chevron-down" size={20} color="#64748B" />
            </Pressable>
          </View>
          {model === 'Khác' && (
            <View style={adminAssetStyles.formField}>
              <Text style={adminAssetStyles.fieldLabel}>Nhập dòng máy</Text>
              <TextInput
                style={adminAssetStyles.fieldInput}
                placeholder="Nhập dòng máy"
                placeholderTextColor="#94A3B8"
                value={customModel}
                onChangeText={setCustomModel}
              />
            </View>
          )}

          {/* Ghi chú tình trạng */}
          <View style={adminAssetStyles.formField}>
            <Text style={adminAssetStyles.fieldLabel}>Ghi chú tình trạng</Text>
            <TextInput
              style={adminAssetStyles.fieldTextarea}
              placeholder="Nhập tình trạng hoặc ghi chú..."
              placeholderTextColor="#94A3B8"
              value={conditionNote}
              onChangeText={setConditionNote}
              multiline
            />
          </View>

          {/* Ảnh thiết bị */}
          <View style={adminAssetStyles.formField}>
            <View style={adminAssetStyles.imageSectionHeader}>
              <Text style={adminAssetStyles.fieldLabel}>Ảnh thiết bị</Text>
              <Text style={adminAssetStyles.imageSectionCount}>{imageUrls.length}/5 ảnh</Text>
            </View>

            {imageUrls.length === 0 ? (
              <Pressable
                style={[adminAssetStyles.uploadDashedBox, isUploading && { opacity: 0.6 }]}
                onPress={handleSelectImage}
                disabled={isUploading}
              >
                {isUploading ? (
                  <ActivityIndicator size="small" color="#1B3B2B" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="camera-plus-outline" size={32} color="#475569" />
                    <Text style={adminAssetStyles.uploadTitle}>Thêm ảnh</Text>
                    <Text style={adminAssetStyles.uploadSubtitle}>Tối đa 5 ảnh</Text>
                  </>
                )}
              </Pressable>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingVertical: 4 }}>
                {imageUrls.map((uri, index) => (
                  <View key={index} style={{ position: 'relative', width: 100, height: 100 }}>
                    <Image source={{ uri }} style={{ width: 100, height: 100, borderRadius: 12 }} />
                    <Pressable
                      style={{
                        position: 'absolute',
                        top: -6,
                        right: -6,
                        backgroundColor: '#EF4444',
                        borderRadius: 12,
                        width: 22,
                        height: 22,
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 10,
                      }}
                      onPress={() => setImageUrls(prev => prev.filter((_, i) => i !== index))}
                    >
                      <MaterialCommunityIcons name="close" size={14} color="#FFF" />
                    </Pressable>
                  </View>
                ))}
                {imageUrls.length < 5 && (
                  <Pressable
                    style={[
                      {
                        width: 100,
                        height: 100,
                        borderRadius: 12,
                        borderWidth: 1.5,
                        borderColor: '#CBD5E1',
                        borderStyle: 'dashed',
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: '#F8FAF8',
                      },
                      isUploading && { opacity: 0.6 },
                    ]}
                    onPress={handleSelectImage}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <ActivityIndicator size="small" color="#1B3B2B" />
                    ) : (
                      <>
                        <MaterialCommunityIcons name="camera-plus-outline" size={26} color="#64748B" />
                        <Text style={{ fontSize: 11, color: '#64748B', marginTop: 4, fontWeight: '600' }}>Thêm ảnh</Text>
                      </>
                    )}
                  </Pressable>
                )}
              </ScrollView>
            )}
          </View>
        </ScrollView>

        {/* Bottom Actions Bar */}
        <View style={[adminAssetStyles.createActionsWrap, { paddingBottom: Math.max(insets.bottom, 14) }]}>
          <View style={adminAssetStyles.createButtonsRow}>
            <Pressable style={adminAssetStyles.cancelButton} onPress={() => router.back()}>
              <Text style={adminAssetStyles.cancelButtonText}>Hủy</Text>
            </Pressable>
            <Pressable
              style={[
                adminAssetStyles.submitButton,
                (!name.trim() || create.isPending) && adminAssetStyles.submitButtonDisabled,
              ]}
              onPress={submit}
              disabled={!name.trim() || create.isPending}
            >
              <Text style={adminAssetStyles.submitButtonText}>
                {create.isPending ? 'Đang tạo...' : 'Tạo thiết bị'}
              </Text>
            </Pressable>
          </View>
          {!name.trim() && (
            <Text style={adminAssetStyles.submitHelperText}>Nhập tên thiết bị để tiếp tục.</Text>
          )}
        </View>
      </View>

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
    </View>
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
  const { showAlert } = useAppAlert();

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
      showAlert('Thành công', 'Đã tạo cấp phát, chờ nhân viên xác nhận');
      router.back();
    } catch (error) {
      const mapped = mapWarehouseAssetError(error);
      showAlert(mapped.code, mapped.message);
    }
  }

  if (asset.isLoading) return <LoadingState />;
  if (asset.isError) return <ErrorState error={asset.error} onRetry={() => void asset.refetch()} />;
  if (!asset.data) return <EmptyState title="Không tìm thấy tài sản" />;
  if (!isAssignable(asset.data)) {
    return <EmptyState title="Tài sản không ở trong kho" message="Chỉ có thể cấp phát tài sản khi ở trạng thái Trong kho." />;
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
          <FormField label="Hạn trả dự kiến (YYYY-MM-DD, tùy chọn)" value={expectedReturnAt} onChangeText={setExpectedReturnAt} placeholder="VD: 2026-12-31" autoCapitalize="none" />
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

const adminAssetStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#1B3B2B',
  },
  headerWrap: {
    backgroundColor: '#1B3B2B',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  brandText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
    color: 'rgba(255, 255, 255, 0.7)',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTextWrap: {
    flex: 1,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  backBtn: {
    padding: 4,
    marginLeft: -6,
  },
  curvedCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  listCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 14,
  },
  listCardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  listCardCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  filterPillRow: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    gap: 6,
  },
  filterPillText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  emptyCenterContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyCircle: {
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: '#E8F3EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  emptyBoxBadge: {
    position: 'absolute',
    bottom: 24,
    right: 28,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  bottomBarFixed: {
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  primaryCreateBtn: {
    backgroundColor: '#1B3B2B',
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  primaryCreateBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  assetItemCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  assetItemIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#EBF5EE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  assetItemInfo: {
    flex: 1,
  },
  assetItemName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  assetItemSub: {
    fontSize: 13,
    color: '#64748B',
  },
  formSectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    paddingTop: 22,
    paddingBottom: 16,
  },
  formContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 16,
  },
  formField: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  fieldInput: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
  },
  fieldDropdown: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  fieldDropdownText: {
    fontSize: 15,
    color: '#0F172A',
  },
  fieldTextarea: {
    height: 90,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingTop: 12,
    fontSize: 15,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
    textAlignVertical: 'top',
  },
  imageSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  imageSectionCount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  uploadDashedBox: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    borderRadius: 14,
    backgroundColor: '#F8FAF8',
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginTop: 6,
  },
  uploadSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  createActionsWrap: {
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  createButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  cancelButton: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#EDF2EE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  submitButton: {
    flex: 2,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#1B3B2B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#93BEA7',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  submitHelperText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
  },
});
