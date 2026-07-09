import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, View, Image } from 'react-native';
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

  async function runConfirm(assignmentId: string) {
    try {
      await confirm.mutateAsync(assignmentId);
      Alert.alert('Thành công', 'Đã xác nhận nhận tài sản');
    } catch (error) {
      const mapped = mapWarehouseAssetError(error);
      Alert.alert(mapped.code, mapped.message);
    }
  }

  async function runRequestReturn(assignmentId: string) {
    try {
      await requestReturn.mutateAsync(assignmentId);
      Alert.alert('Thành công', 'Đã gửi yêu cầu trả tài sản');
    } catch (error) {
      const mapped = mapWarehouseAssetError(error);
      Alert.alert(mapped.code, mapped.message);
    }
  }

  return (
    <Screen>
      <ScreenContainer refreshControl={<RefreshControl refreshing={myAssets.isRefetching} onRefresh={() => void myAssets.refetch()} />}>
        <PageHeader title="Tài sản của tôi" subtitle="Nguồn: GET /assets/my — chỉ tài sản cấp phát cho bạn." />
        {myAssets.isLoading ? <LoadingState /> : null}
        {myAssets.isError ? <ErrorState error={myAssets.error} onRetry={() => void myAssets.refetch()} /> : null}
        {myAssets.data?.items.map((assignment) => (
          <View key={assignment.id} style={styles.cardWrap}>
            <MyAssetCard assignment={assignment} onPress={() => router.push(`/employee/assets/${assignment.assetId}` as never)} />
            {canConfirmAssignment(user, assignment) ? (
              <PrimaryButton loading={confirm.isPending} onPress={() => void runConfirm(assignment.id)}>
                Xác nhận nhận tài sản
              </PrimaryButton>
            ) : null}
            {canRequestReturn(user, assignment) ? (
              <SecondaryButton loading={requestReturn.isPending} onPress={() => void runRequestReturn(assignment.id)}>
                Yêu cầu trả tài sản
              </SecondaryButton>
            ) : null}
            {hasPermission(user, 'asset.incident.create') ? (
              <SecondaryButton onPress={() => router.push(`/employee/assets/incidents/create?assetId=${assignment.assetId}` as never)}>
                Báo sự cố
              </SecondaryButton>
            ) : null}
          </View>
        ))}
        {myAssets.data && !myAssets.data.items.length ? <EmptyState title="Bạn chưa được cấp phát tài sản" /> : null}
      </ScreenContainer>
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

  if (asset.isLoading) return <LoadingState />;
  if (asset.isError) return <ErrorState error={asset.error} onRetry={() => void asset.refetch()} />;
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

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <PageHeader title={item.name} subtitle={item.assetCode} />
        <SectionCard title="Thông tin">
          <View style={styles.badgeRow}>
            <AssetStatusBadge status={item.assetStatus} />
            <AssetConditionBadge condition={item.conditionStatus} />
          </View>
          {item.brand ? <Text style={styles.meta}>Hãng: {item.brand}</Text> : null}
          {item.model ? <Text style={styles.meta}>Model: {item.model}</Text> : null}
          {item.serialNumber ? <Text style={styles.meta}>Serial: {item.serialNumber}</Text> : null}
          {item.description ? <Text style={styles.body}>{item.description}</Text> : null}
          {canSeePurchasePrice(user) && item.purchasePrice !== null && typeof item.purchasePrice !== 'undefined' ? (
            <Text style={styles.meta}>Giá mua: {String(item.purchasePrice)}</Text>
          ) : null}
          {canSeePurchasePrice(user) && item.warrantyEndDate ? (
            <Text style={styles.meta}>Hết bảo hành: {formatDateTime(item.warrantyEndDate)}</Text>
          ) : null}
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
                loading={requestReturn.isPending}
                onPress={() => void runAction(() => requestReturn.mutateAsync(assignment.id), 'Đã gửi yêu cầu trả')}
              >
                Yêu cầu trả tài sản
              </SecondaryButton>
            ) : null}

            {canReceive ? (
              <View style={styles.receiveBox}>
                <Text style={styles.sectionLabel}>Nhận trả tài sản (tình trạng do backend quyết định trạng thái cuối)</Text>
                <View style={styles.chipRow}>
                  {conditionOptions.map((condition) => (
                    <FilterChip
                      key={condition}
                      label={assetConditionLabels[condition]}
                      selected={returnCondition === condition}
                      onPress={() => setReturnCondition(condition)}
                    />
                  ))}
                </View>
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

        {hasPermission(user, 'asset.assign') && isAssignable(item) && (area === 'admin' || area === 'warehouse') ? (
          <SectionCard title="Cấp phát">
            <PrimaryButton onPress={() => router.push(`${assetBase(area)}/${item.id}/assign` as never)}>Cấp phát tài sản</PrimaryButton>
          </SectionCard>
        ) : null}

        {hasPermission(user, 'asset.maintenance.manage') && (canStartMaintenance(item) || item.assetStatus === 'MAINTENANCE') ? (
          <MaintenanceActionsSection asset={item} />
        ) : null}

        {hasPermission(user, 'asset.incident.create') && (isOwner || area !== 'employee') ? (
          <SectionCard title="Sự cố">
            <SecondaryButton
              onPress={() =>
                router.push(
                  area === 'employee'
                    ? (`/employee/assets/incidents/create?assetId=${item.id}` as never)
                    : (`${assetBase(area)}/${item.id}` as never),
                )
              }
            >
              {area === 'employee' ? 'Báo sự cố tài sản này' : 'Sự cố ghi nhận bên dưới'}
            </SecondaryButton>
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

  const brandOptions = ['Dell', 'HP', 'Apple', 'Lenovo', 'Asus', 'Acer', 'Khác'];
  const modelOptions = ['XPS', 'ThinkPad', 'MacBook Pro', 'MacBook Air', 'EliteBook', 'Khác'];

  // Lấy departmentId từ route query params
  const { departmentId = '' } = useLocalSearchParams<{ departmentId?: string }>();

  async function submit() {
    try {
      const asset = await create.mutateAsync({
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
      <ScrollView contentContainerStyle={styles.content}>
        <PageHeader
          title="Thêm thiết bị"
          subtitle="Tạo mới vật tư/thiết bị cho phòng ban."
        />
        <SectionCard>
          <FormField label="Tên thiết bị" value={name} onChangeText={setName} />
          
          <Text style={styles.sectionLabel}>Hãng / Thương hiệu</Text>
          <View style={styles.chipRow}>
            {brandOptions.map(opt => (
              <FilterChip key={opt} label={opt} selected={brand === opt} onPress={() => setBrand(opt)} />
            ))}
          </View>
          {brand === 'Khác' && (
            <FormField label="Nhập tên hãng" value={customBrand} onChangeText={setCustomBrand} />
          )}

          <Text style={styles.sectionLabel}>Dòng máy / Loại</Text>
          <View style={styles.chipRow}>
            {modelOptions.map(opt => (
              <FilterChip key={opt} label={opt} selected={model === opt} onPress={() => setModel(opt)} />
            ))}
          </View>
          {model === 'Khác' && (
            <FormField label="Nhập dòng máy" value={customModel} onChangeText={setCustomModel} />
          )}

          <FormField label="Ghi chú thủ công (Tình trạng)" value={conditionNote} onChangeText={setConditionNote} multiline />
          
          <Text style={styles.sectionLabel}>Ảnh thiết bị</Text>
          <FormField label="URL ảnh (VD: https://picsum.photos/200)" value={imageUrl} onChangeText={setImageUrl} autoCapitalize="none" />
          
          {imageUrl ? (
            <View style={{ marginBottom: 16 }}>
              <Image 
                source={{ uri: imageUrl }} 
                style={{ width: '100%', height: 150, borderRadius: 8, backgroundColor: '#f3f4f6' }} 
                resizeMode="cover"
              />
            </View>
          ) : null}

          <PrimaryButton loading={create.isPending} disabled={!name.trim()} onPress={() => void submit()}>
            Lưu
          </PrimaryButton>
        </SectionCard>
      </ScrollView>
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
            <View style={styles.selectorBox}>
              <FormField label="Tìm nhân viên" value={search} onChangeText={setSearch} autoCapitalize="none" />
              {employees.isLoading ? <LoadingState /> : null}
              {employees.data?.items.map((employee) => (
                <FilterChip
                  key={employee.id}
                  label={`${employee.userCode} ${employee.fullName ?? ''}`}
                  selected={assignedToUserId === employee.id}
                  onPress={() => setAssignedToUserId(employee.id)}
                />
              ))}
            </View>
          ) : (
            <View style={styles.selectorBox}>
              {departments.data?.items.map((department) => (
                <FilterChip
                  key={department.id}
                  label={department.name}
                  selected={assignedToDepartmentId === department.id}
                  onPress={() => setAssignedToDepartmentId(department.id)}
                />
              ))}
            </View>
          )}
        </SectionCard>
        <SectionCard title="Thông tin cấp phát">
          <FormField label="Hạn trả dự kiến (ISO, tùy chọn)" value={expectedReturnAt} onChangeText={setExpectedReturnAt} placeholder="2026-08-01" autoCapitalize="none" />
          <Text style={styles.sectionLabel}>Tình trạng khi cấp (mặc định theo tài sản)</Text>
          <View style={styles.chipRow}>
            {conditionOptions.map((option) => (
              <FilterChip
                key={option}
                label={assetConditionLabels[option]}
                selected={condition === option}
                onPress={() => setCondition(condition === option ? '' : option)}
              />
            ))}
          </View>
          <FormField label="Ghi chú" value={note} onChangeText={setNote} multiline />
          <PrimaryButton loading={assign.isPending} disabled={!targetChosen} onPress={() => void submit()}>
            Cấp phát
          </PrimaryButton>
        </SectionCard>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
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
});
