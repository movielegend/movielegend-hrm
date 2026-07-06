import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
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
import { StatusBadge } from '../../components/StatusBadge';
import {
  useApproveInventoryCheck,
  useCreateInventoryCheck,
  useInventoryCheck,
  useInventoryChecks,
  useSubmitInventoryCheck,
  useUpdateInventoryCheckItems,
} from '../../hooks/useInventoryChecks';
import { useWarehouses } from '../../hooks/useWarehouses';
import { useAuth } from '../../providers/AuthProvider';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import type { InventoryCheckItemUpdatePayload } from '../../types/inventory-check.types';
import { hasPermission } from '../../utils/permissions';
import { formatQuantity } from '../../utils/quantity';
import { mapWarehouseAssetError } from '../assets/asset.logic';
import { inventoryStatusTone } from './inventory.logic';

export function InventoryCheckListScreen({ area }: { area: 'warehouse' | 'admin' }) {
  const router = useRouter();
  const { user } = useAuth();
  const checks = useInventoryChecks(hasPermission(user, 'inventory_check.read'));
  const base = area === 'admin' ? '/admin' : '/warehouse-manager';

  return (
    <Screen>
      <ScreenContainer refreshControl={<RefreshControl refreshing={checks.isRefetching} onRefresh={() => void checks.refetch()} />}>
        <PageHeader title="Inventory checks" subtitle="GET /inventory-checks, warehouse scoped by backend." />
        {hasPermission(user, 'inventory_check.create') ? (
          <PrimaryButton onPress={() => router.push(`${base}/inventory-checks/create` as never)}>Create check</PrimaryButton>
        ) : null}
        {checks.isLoading ? <LoadingState /> : null}
        {checks.isError ? <ErrorState error={checks.error} onRetry={() => void checks.refetch()} /> : null}
        {checks.data?.items.map((check) => (
          <SectionCard key={check.id}>
            <View style={styles.headerRow}>
              <Text style={styles.title}>{check.checkCode}</Text>
              <StatusBadge label={check.status} tone={inventoryStatusTone(check.status)} />
            </View>
            <Text style={styles.meta}>Warehouse: {check.warehouseId}</Text>
            <SecondaryButton onPress={() => router.push(`${base}/inventory-checks/${check.id}` as never)}>Open</SecondaryButton>
          </SectionCard>
        ))}
        {checks.data && !checks.data.items.length ? <EmptyState title="No inventory checks" /> : null}
      </ScreenContainer>
    </Screen>
  );
}

export function InventoryCheckCreateScreen() {
  const router = useRouter();
  const create = useCreateInventoryCheck();
  const warehouses = useWarehouses();
  const [warehouseId, setWarehouseId] = useState('');
  const [note, setNote] = useState('');

  async function submit() {
    try {
      await create.mutateAsync({
        warehouseId,
        ...(note.trim() ? { note: note.trim() } : {}),
      });
      Alert.alert('Success', 'Inventory check created from backend snapshot.');
      router.back();
    } catch (error) {
      const mapped = mapWarehouseAssetError(error);
      Alert.alert(mapped.code, mapped.message);
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <PageHeader title="Create inventory check" subtitle="Backend snapshots stock and assets; mobile does not create local stock lines." />
        <SectionCard title="Warehouse">
          <View style={styles.chipRow}>
            {warehouses.data?.items.map((warehouse) => (
              <FilterChip key={warehouse.id} label={`${warehouse.code} ${warehouse.name}`} selected={warehouseId === warehouse.id} onPress={() => setWarehouseId(warehouse.id)} />
            ))}
          </View>
        </SectionCard>
        <FormField label="Note" value={note} onChangeText={setNote} multiline />
        <PrimaryButton loading={create.isPending} disabled={!warehouseId} onPress={() => void submit()}>Create check</PrimaryButton>
      </ScrollView>
    </Screen>
  );
}

export function InventoryCheckDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const check = useInventoryCheck(id);
  const updateItems = useUpdateInventoryCheckItems();
  const submitCheck = useSubmitInventoryCheck();
  const approveCheck = useApproveInventoryCheck();
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  async function saveItems() {
    if (!id || !check.data) return;
    const items: InventoryCheckItemUpdatePayload[] = [];
    for (const item of check.data.items) {
      const raw = drafts[item.id];
      if (!raw?.trim()) continue;
      const actualQuantity = Number(raw);
      if (!Number.isFinite(actualQuantity)) continue;
      items.push({ id: item.id, actualQuantity });
    }
    try {
      await updateItems.mutateAsync({ id, payload: { items } });
      Alert.alert('Success', 'Count lines saved.');
    } catch (error) {
      const mapped = mapWarehouseAssetError(error);
      Alert.alert(mapped.code, mapped.message);
    }
  }

  async function run(action: 'submit' | 'approve') {
    if (!id) return;
    try {
      if (action === 'submit') await submitCheck.mutateAsync(id);
      if (action === 'approve') await approveCheck.mutateAsync(id);
      Alert.alert('Success', `Inventory ${action} completed.`);
    } catch (error) {
      const mapped = mapWarehouseAssetError(error);
      Alert.alert(mapped.code, mapped.message);
    }
  }

  if (check.isLoading) return <LoadingState />;
  if (check.isError) return <ErrorState error={check.error} onRetry={() => void check.refetch()} />;
  if (!check.data) return <EmptyState title="Inventory check not found" />;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <PageHeader title={check.data.checkCode} subtitle={check.data.warehouseId} />
        <SectionCard title="Items">
          {check.data.items.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <Text style={styles.title}>{item.materialId ?? item.assetId ?? item.id}</Text>
              <Text style={styles.meta}>System: {formatQuantity(item.systemQuantity)}</Text>
              <FormField label="Actual quantity" value={drafts[item.id] ?? ''} onChangeText={(value) => setDrafts((current) => ({ ...current, [item.id]: value }))} keyboardType="decimal-pad" />
            </View>
          ))}
        </SectionCard>
        {check.data.status === 'IN_PROGRESS' && hasPermission(user, 'inventory_check.submit') ? (
          <>
            <PrimaryButton loading={updateItems.isPending} onPress={() => void saveItems()}>Save counts</PrimaryButton>
            <SecondaryButton loading={submitCheck.isPending} onPress={() => void run('submit')}>Submit check</SecondaryButton>
          </>
        ) : null}
        {check.data.status === 'SUBMITTED' && hasPermission(user, 'inventory_check.approve') ? (
          <PrimaryButton loading={approveCheck.isPending} onPress={() => void run('approve')}>Approve check</PrimaryButton>
        ) : null}
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
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  itemRow: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    gap: spacing.sm,
    paddingBottom: spacing.md,
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
