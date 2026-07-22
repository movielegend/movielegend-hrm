import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
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
import { useDepartments } from '../../hooks/useDepartments';
import { useCreateWarehouse, useUpdateWarehouse, useWarehouse, useWarehouses, useWarehouseStocks } from '../../hooks/useWarehouses';
import { useMaterialIssues, useStockTransfers } from '../../hooks/useStockOperations';
import { useInventoryChecks } from '../../hooks/useInventoryChecks';
import { useAuth } from '../../providers/AuthProvider';
import { useSocketStatus } from '../../providers/SocketProvider';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { hasPermission } from '../../utils/permissions';
import { mapWarehouseAssetError } from '../assets/asset.logic';
import { lowStockCount } from './stock.logic';
import { WarehouseCard } from './WarehouseComponents';

export type WarehouseArea = 'warehouse' | 'admin';

export function WarehouseListScreen({ area }: { area: WarehouseArea }) {
  const router = useRouter();
  const { user } = useAuth();
  const { joinWarehouseRoom } = useSocketStatus();
  const warehouses = useWarehouses();
  const base = area === 'admin' ? '/admin/warehouses' : '/warehouse-manager/warehouses';

  useEffect(() => {
    warehouses.data?.items.forEach((warehouse) => joinWarehouseRoom(warehouse.id));
  }, [joinWarehouseRoom, warehouses.data]);

  return (
    <Screen>
      <ScreenContainer refreshControl={<RefreshControl refreshing={warehouses.isRefetching} onRefresh={() => void warehouses.refetch()} />}>
        <PageHeader title="Kho" subtitle="Admin: toàn bộ; Warehouse Manager: theo scope — backend enforce." />
        {area === 'admin' && hasPermission(user, 'warehouse.create') ? (
          <PrimaryButton onPress={() => router.push('/admin/warehouses/create' as never)}>Tạo kho</PrimaryButton>
        ) : null}
        {warehouses.isLoading ? <LoadingState /> : null}
        {warehouses.isError ? <ErrorState error={warehouses.error} onRetry={() => void warehouses.refetch()} /> : null}
        {warehouses.data?.items?.map((warehouse) => (
          <WarehouseCard key={warehouse.id} warehouse={warehouse} onPress={() => router.push(`${base}/${warehouse.id}` as never)} />
        ))}
        {warehouses.data && !warehouses.data.items?.length ? <EmptyState title="Không có kho trong scope của bạn" /> : null}
      </ScreenContainer>
    </Screen>
  );
}

/**
 * Warehouse detail: backend không có endpoint summary tổng hợp —
 * compose từ các list query sẵn có (stocks + issues + transfers + inventory checks),
 * mỗi loại 1 query (không N+1 per-item). Documented limitation trong contract matrix.
 */
export function WarehouseDetailScreen({ area }: { area: WarehouseArea }) {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { joinWarehouseRoom } = useSocketStatus();
  const warehouse = useWarehouse(id);
  const stocks = useWarehouseStocks(hasPermission(user, 'stock.read') ? id : undefined);
  const issues = useMaterialIssues(hasPermission(user, 'material_issue.read'));
  const transfers = useStockTransfers(hasPermission(user, 'stock.read'));
  const checks = useInventoryChecks(hasPermission(user, 'inventory_check.read'));

  useEffect(() => {
    if (warehouse.data?.id) joinWarehouseRoom(warehouse.data.id);
  }, [joinWarehouseRoom, warehouse.data?.id]);

  if (warehouse.isLoading) return <LoadingState />;
  if (warehouse.isError) return <ErrorState error={warehouse.error} onRetry={() => void warehouse.refetch()} />;
  if (!warehouse.data) return <EmptyState title="Không tìm thấy kho" />;

  const item = warehouse.data;
  const stockItems = stocks.data?.items ?? [];
  const pendingIssues = (issues.data?.items ?? []).filter((issue) => issue.warehouseId === id && issue.status === 'PENDING');
  const relatedTransfers = (transfers.data?.items ?? []).filter(
    (transfer) => transfer.sourceWarehouseId === id || transfer.targetWarehouseId === id,
  );
  const inTransit = relatedTransfers.filter((transfer) => transfer.status === 'IN_TRANSIT');
  const pendingChecks = (checks.data?.items ?? []).filter((check) => check.warehouseId === id && check.status !== 'APPROVED' && check.status !== 'CANCELLED');

  const stocksBase = area === 'admin' ? `/admin/warehouses/${id}/stocks` : `/warehouse-manager/warehouses/${id}/stocks`;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <PageHeader title={item.name} subtitle={`${item.code}${item.address ? ` · ${item.address}` : ''}`} />
        <View style={styles.grid}>
          <SummaryTile label="Mặt hàng tồn" value={stocks.isLoading ? '…' : String(stockItems.length)} />
          <SummaryTile label="Sắp hết" value={stocks.isLoading ? '…' : String(lowStockCount(stockItems))} danger={lowStockCount(stockItems) > 0} />
          <SummaryTile label="Phiếu xuất chờ duyệt" value={issues.isLoading ? '…' : String(pendingIssues.length)} />
          <SummaryTile label="Điều chuyển đang đi" value={transfers.isLoading ? '…' : String(inTransit.length)} />
          <SummaryTile label="Kiểm kê đang mở" value={checks.isLoading ? '…' : String(pendingChecks.length)} />
        </View>
        <SectionCard title="Điều hướng">
          {hasPermission(user, 'stock.read') ? (
            <SecondaryButton onPress={() => router.push(stocksBase as never)}>Tồn kho</SecondaryButton>
          ) : null}
        </SectionCard>
        {area === 'admin' && hasPermission(user, 'warehouse.update') ? <WarehouseEditSection warehouseId={item.id} /> : null}
      </ScrollView>
    </Screen>
  );
}

function SummaryTile({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <View style={[styles.tile, danger && styles.tileDanger]}>
      <Text style={styles.tileLabel}>{label}</Text>
      <Text style={[styles.tileValue, danger && styles.tileValueDanger]}>{value}</Text>
    </View>
  );
}

function WarehouseEditSection({ warehouseId }: { warehouseId: string }) {
  const update = useUpdateWarehouse();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');

  async function submit() {
    try {
      await update.mutateAsync({
        id: warehouseId,
        payload: {
          ...(name.trim() ? { name: name.trim() } : {}),
          ...(address.trim() ? { address: address.trim() } : {}),
        },
      });
      Alert.alert('Thành công', 'Đã cập nhật kho');
      setName('');
      setAddress('');
    } catch (error) {
      const mapped = mapWarehouseAssetError(error);
      Alert.alert(mapped.code, mapped.message);
    }
  }

  return (
    <SectionCard title="Cập nhật kho">
      <FormField label="Tên mới (bỏ trống nếu giữ nguyên)" value={name} onChangeText={setName} />
      <FormField label="Địa chỉ mới (bỏ trống nếu giữ nguyên)" value={address} onChangeText={setAddress} />
      <PrimaryButton loading={update.isPending} disabled={!name.trim() && !address.trim()} onPress={() => void submit()}>
        Lưu
      </PrimaryButton>
    </SectionCard>
  );
}

export function WarehouseCreateScreen() {
  const router = useRouter();
  const create = useCreateWarehouse();
  const departments = useDepartments({ page: 1, limit: 50 });
  const [companyId, setCompanyId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');

  // Backend không có GET /companies — lấy companyId từ phòng ban thật (department.companyId).
  function pickDepartment(id: string, deptCompanyId: string) {
    setDepartmentId(departmentId === id ? '' : id);
    if (deptCompanyId) setCompanyId(deptCompanyId);
  }

  async function submit() {
    try {
      const warehouse = await create.mutateAsync({
        companyId: companyId.trim(),
        ...(departmentId ? { departmentId } : {}),
        name: name.trim(),
        ...(address.trim() ? { address: address.trim() } : {}),
      });
      Alert.alert('Thành công', `Đã tạo kho ${warehouse.code}`);
      router.back();
    } catch (error) {
      const mapped = mapWarehouseAssetError(error);
      Alert.alert(mapped.code, mapped.message);
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <PageHeader title="Tạo kho" subtitle="Mã kho backend tự sinh nếu bỏ trống. companyId lấy từ phòng ban đã chọn." />
        <SectionCard>
          <Text style={styles.label}>Phòng ban gắn kho (đồng thời lấy companyId)</Text>
          <View style={styles.chipRow}>
            {departments.data?.items?.map((department) => (
              <FilterChip
                key={department.id}
                label={department.name}
                selected={departmentId === department.id}
                onPress={() => pickDepartment(department.id, department.companyId)}
              />
            ))}
          </View>
          <FormField label="Company ID" value={companyId} onChangeText={setCompanyId} autoCapitalize="none" />
          <FormField label="Tên kho" value={name} onChangeText={setName} />
          <FormField label="Địa chỉ (tùy chọn)" value={address} onChangeText={setAddress} />
          <PrimaryButton loading={create.isPending} disabled={!companyId.trim() || !name.trim()} onPress={() => void submit()}>
            Tạo kho
          </PrimaryButton>
        </SectionCard>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  content: {
    gap: spacing.lg,
    padding: spacing.lg,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  tile: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexGrow: 1,
    gap: spacing.xs,
    minWidth: '45%',
    padding: spacing.md,
  },
  tileDanger: {
    borderColor: colors.danger,
  },
  tileLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  tileValue: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  tileValueDanger: {
    color: colors.danger,
  },
});
