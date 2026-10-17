import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
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
import { useDepartments } from '../../hooks/useDepartments';
import { useMaterials } from '../../hooks/useMaterials';
import {
  useApproveStockReceipt,
  useCreateMaterialIssue,
  useCreateStockReceipt,
  useCreateStockTransfer,
  useMaterialIssue,
  useMaterialIssueAction,
  useMaterialIssues,
  useStockReceipt,
  useStockReceipts,
  useStockTransferAction,
  useStockTransferFromList,
  useStockTransfers,
} from '../../hooks/useStockOperations';
import { useWarehouses } from '../../hooks/useWarehouses';
import { useAuth } from '../../providers/AuthProvider';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { useAppAlert } from '../../contexts/AlertContext';
import type { MaterialIssueTargetType, StockLinePayload } from '../../types/stock.types';
import { formatDateTime } from '../../utils/date-time';
import { hasAnyPermission, hasPermission } from '../../utils/permissions';
import { formatQuantity } from '../../utils/quantity';
import { mapWarehouseAssetError } from '../assets/asset.logic';
import { availableIssueActions, issueStatusTone, receiptStatusTone, validateIssueDraft } from '../material-issues/issue.logic';
import { availableTransferActions, transferStatusTone, validateTransferDraft } from '../stock-transfers/transfer.logic';
import { StockLineBuilder, type StockLineDraft, toStockLinePayloads } from '../warehouse-stocks/StockLineBuilder';

export type OperationArea = 'employee' | 'leader' | 'warehouse' | 'admin';

function baseFor(area: OperationArea): string {
  if (area === 'warehouse') return '/warehouse-manager';
  return `/${area}`;
}

export function StockReceiptListScreen({ area }: { area: Extract<OperationArea, 'warehouse' | 'admin'> }) {
  const router = useRouter();
  const { user } = useAuth();
  const receipts = useStockReceipts(hasPermission(user, 'stock.read'));
  const base = baseFor(area);

  return (
    <Screen>
      <ScreenContainer refreshControl={<RefreshControl refreshing={receipts.isRefetching} onRefresh={() => void receipts.refetch()} />}>
        <PageHeader title="Stock receipts" subtitle="GET /stock-receipts, scoped by backend warehouse access." />
        {hasPermission(user, 'stock.import') ? <PrimaryButton onPress={() => router.push(`${base}/stock-receipts/create` as never)}>Create receipt</PrimaryButton> : null}
        {receipts.isLoading ? <LoadingState /> : null}
        {receipts.isError ? <ErrorState error={receipts.error} onRetry={() => void receipts.refetch()} /> : null}
        {receipts.data?.items?.map((receipt) => (
          <SectionCard key={receipt.id}>
            <View style={styles.headerRow}>
              <Text style={styles.title}>{receipt.receiptCode}</Text>
              <StatusBadge label={receipt.status} tone={receiptStatusTone(receipt.status)} />
            </View>
            <Text style={styles.meta}>{receipt.warehouse?.name ?? receipt.warehouseId}</Text>
            <Text style={styles.meta}>{formatDateTime(receipt.receiptDate)}</Text>
            <SecondaryButton onPress={() => router.push(`${base}/stock-receipts/${receipt.id}` as never)}>Open</SecondaryButton>
          </SectionCard>
        ))}
        {receipts.data && !receipts.data.items?.length ? <EmptyState title="No receipts" /> : null}
      </ScreenContainer>
    </Screen>
  );
}

export function StockReceiptDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const receipt = useStockReceipt(id);
  const approve = useApproveStockReceipt();
  const { showAlert } = useAppAlert();

  async function runApprove() {
    if (!id) return;
    try {
      await approve.mutateAsync(id);
      showAlert('Success', 'Receipt approved. Stock will be refreshed from REST.');
    } catch (error) {
      const mapped = mapWarehouseAssetError(error);
      showAlert(mapped.code, mapped.message);
    }
  }

  if (receipt.isLoading) return <LoadingState />;
  if (receipt.isError) return <ErrorState error={receipt.error} onRetry={() => void receipt.refetch()} />;
  if (!receipt.data) return <EmptyState title="Receipt not found" />;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <PageHeader title={receipt.data.receiptCode} subtitle={receipt.data.warehouse?.name ?? receipt.data.warehouseId} />
        <SectionCard title="Items">
          {receipt.data.items?.map((item) => (
            <Text key={item.id} style={styles.meta}>
              {item.material?.name ?? item.materialId}: {formatQuantity(item.quantity)}
            </Text>
          ))}
        </SectionCard>
        {receipt.data.status === 'PENDING' && hasPermission(user, 'stock.import') ? (
          <PrimaryButton loading={approve.isPending} onPress={() => void runApprove()}>Approve receipt</PrimaryButton>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

export function StockReceiptCreateScreen() {
  const router = useRouter();
  const create = useCreateStockReceipt();
  const warehouses = useWarehouses();
  const materials = useMaterials();
  const { showAlert } = useAppAlert();
  const [warehouseId, setWarehouseId] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [lines, setLines] = useState<StockLineDraft[]>([]);

  async function submit() {
    try {
      await create.mutateAsync({
        warehouseId,
        ...(supplierName.trim() ? { supplierName: supplierName.trim() } : {}),
        ...(referenceNumber.trim() ? { referenceNumber: referenceNumber.trim() } : {}),
        items: toStockLinePayloads(lines),
      });
      showAlert('Success', 'Receipt created.', () => router.back());
    } catch (error) {
      const mapped = mapWarehouseAssetError(error);
      showAlert(mapped.code, mapped.message);
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <PageHeader title="Create receipt" subtitle="POST /stock-receipts with one items[] payload." />
        <WarehousePicker value={warehouseId} onChange={setWarehouseId} warehouses={warehouses.data?.items ?? []} />
        <FormField label="Supplier" value={supplierName} onChangeText={setSupplierName} />
        <FormField label="Reference" value={referenceNumber} onChangeText={setReferenceNumber} />
        <SectionCard title="Items">
          <StockLineBuilder materials={materials.data?.items ?? []} lines={lines} onChange={setLines} withUnitCost />
        </SectionCard>
        <PrimaryButton loading={create.isPending} disabled={!warehouseId || !lines.length} onPress={() => void submit()}>Create receipt</PrimaryButton>
      </ScrollView>
    </Screen>
  );
}

export {
  MaterialIssueListScreen,
  MaterialIssueDetailScreen,
  MaterialIssueCreateScreen,
} from '../material-issues/MaterialIssueScreens';

export function StockTransferListScreen({ area }: { area: Extract<OperationArea, 'warehouse' | 'admin'> }) {
  const router = useRouter();
  const { user } = useAuth();
  const transfers = useStockTransfers(hasPermission(user, 'stock.read'));
  const base = baseFor(area);

  return (
    <Screen>
      <ScreenContainer refreshControl={<RefreshControl refreshing={transfers.isRefetching} onRefresh={() => void transfers.refetch()} />}>
        <PageHeader title="Stock transfers" subtitle="GET /stock-transfers. Detail route reads from list cache because backend has no GET :id." />
        {hasPermission(user, 'stock.transfer') ? <PrimaryButton onPress={() => router.push(`${base}/stock-transfers/create` as never)}>Create transfer</PrimaryButton> : null}
        {transfers.isLoading ? <LoadingState /> : null}
        {transfers.isError ? <ErrorState error={transfers.error} onRetry={() => void transfers.refetch()} /> : null}
        {transfers.data?.items?.map((transfer) => (
          <SectionCard key={transfer.id}>
            <View style={styles.headerRow}>
              <Text style={styles.title}>{transfer.transferCode}</Text>
              <StatusBadge label={transfer.status} tone={transferStatusTone(transfer.status)} />
            </View>
            <Text style={styles.meta}>{transfer.sourceWarehouseId} to {transfer.targetWarehouseId}</Text>
            <SecondaryButton onPress={() => router.push(`${base}/stock-transfers/${transfer.id}` as never)}>Open</SecondaryButton>
          </SectionCard>
        ))}
        {transfers.data && !transfers.data.items?.length ? <EmptyState title="No transfers" /> : null}
      </ScreenContainer>
    </Screen>
  );
}

export function StockTransferDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string; }>();
  const router = useRouter();
  const { user } = useAuth();
  const transfer = useStockTransferFromList(id);
  const action = useStockTransferAction();
  const { showAlert } = useAppAlert();

  async function run(kind: 'approve' | 'ship' | 'receive' | 'cancel') {
    if (!id) return;
    try {
      await action.mutateAsync({ id, action: kind });
      showAlert('Success', `Transfer ${kind} completed.`, () => router.back());
    } catch (error) {
      const mapped = mapWarehouseAssetError(error);
      showAlert(mapped.code, mapped.message);
    }
  }

  if (transfer.isLoading) return <LoadingState />;
  if (transfer.isError) return <ErrorState error={transfer.error} onRetry={() => void transfer.refetch()} />;
  if (!transfer.transfer) return <EmptyState title="Transfer not found in list cache" message="Backend has no GET /stock-transfers/:id." />;

  const actions = availableTransferActions(user, transfer.transfer);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <PageHeader title={transfer.transfer.transferCode} subtitle={`${transfer.transfer.sourceWarehouseId} to ${transfer.transfer.targetWarehouseId}`} />
        <SectionCard title="Items">
          {transfer.transfer.items?.map((item) => (
            <Text key={item.id} style={styles.meta}>{item.material?.name ?? item.materialId}: {formatQuantity(item.quantity)}</Text>
          ))}
        </SectionCard>
        {actions.map((kind) => (
          <SecondaryButton key={kind} loading={action.isPending} onPress={() => void run(kind)}>{kind.toUpperCase()}</SecondaryButton>
        ))}
      </ScrollView>
    </Screen>
  );
}

export function StockTransferCreateScreen() {
  const router = useRouter();
  const create = useCreateStockTransfer();
  const warehouses = useWarehouses();
  const materials = useMaterials();
  const { showAlert } = useAppAlert();
  const [sourceWarehouseId, setSourceWarehouseId] = useState('');
  const [targetWarehouseId, setTargetWarehouseId] = useState('');
  const [note, setNote] = useState('');
  const [lines, setLines] = useState<StockLineDraft[]>([]);

  const validation = validateTransferDraft({ sourceWarehouseId, targetWarehouseId, items: lines });

  async function submit() {
    if (validation) {
      showAlert('INVALID_FORM', validation);
      return;
    }
    try {
      await create.mutateAsync({
        sourceWarehouseId,
        targetWarehouseId,
        ...(note.trim() ? { note: note.trim() } : {}),
        items: toStockLinePayloads(lines),
      });
      showAlert('Success', 'Transfer created.', () => router.back());
    } catch (error) {
      const mapped = mapWarehouseAssetError(error);
      showAlert(mapped.code, mapped.message);
    }
  }

  const warehouseItems = warehouses.data?.items ?? [];

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <PageHeader title="Create transfer" subtitle="POST /stock-transfers; backend validates source and stock availability." />
        <WarehousePicker label="Source warehouse" value={sourceWarehouseId} onChange={setSourceWarehouseId} warehouses={warehouseItems} />
        <WarehousePicker label="Target warehouse" value={targetWarehouseId} onChange={setTargetWarehouseId} warehouses={warehouseItems} />
        <FormField label="Note" value={note} onChangeText={setNote} multiline />
        <SectionCard title="Items">
          <StockLineBuilder materials={materials.data?.items ?? []} lines={lines} onChange={setLines} />
        </SectionCard>
        <PrimaryButton loading={create.isPending} disabled={Boolean(validation)} onPress={() => void submit()}>Create transfer</PrimaryButton>
      </ScrollView>
    </Screen>
  );
}

function WarehousePicker({
  value,
  onChange,
  warehouses,
  label = 'Warehouse',
}: {
  value: string;
  onChange: (warehouseId: string) => void;
  warehouses: Array<{ id: string; code: string; name: string }>;
  label?: string;
}) {
  const selected = useMemo(() => warehouses.find((warehouse) => warehouse.id === value), [value, warehouses]);
  return (
    <SectionCard title={label}>
      <View style={styles.chipRow}>
        {warehouses.map((warehouse) => (
          <FilterChip key={warehouse.id} label={`${warehouse.code} ${warehouse.name}`} selected={value === warehouse.id} onPress={() => onChange(warehouse.id)} />
        ))}
      </View>
      <Text style={styles.meta}>Selected: {selected?.name ?? 'none'}</Text>
    </SectionCard>
  );
}

export function compactLines(lines: StockLinePayload[]): StockLinePayload[] {
  return lines.filter((line) => line.materialId && line.quantity > 0);
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
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  meta: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  title: {
    color: colors.text,
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
  },
});
