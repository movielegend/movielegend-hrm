import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, RefreshControl, StyleSheet, Text, View } from 'react-native';
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
import {
  useActiveMaintenanceRecord,
  useAssets,
  useCompleteAssetMaintenance,
  useStartAssetMaintenance,
} from '../../hooks/useAssets';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import type { AssetConditionStatus, AssetDto } from '../../types/asset.types';
import { assetConditionLabels, canStartMaintenance, mapWarehouseAssetError } from '../assets/asset.logic';
import { AssetCard } from '../assets/AssetComponents';

const conditionOptions: AssetConditionStatus[] = ['NEW', 'GOOD', 'FAIR', 'POOR', 'DAMAGED'];

/**
 * Backend không có GET /asset-maintenance (blocker B2):
 * - list hiển thị asset đang MAINTENANCE lấy từ GET /assets;
 * - complete chỉ khả dụng khi record được start trong session (cache từ response start).
 */
export function MaintenanceListScreen({ area }: { area: 'warehouse' | 'admin' }) {
  const router = useRouter();
  const assets = useAssets();
  const inMaintenance = (assets.data?.items ?? []).filter((asset) => asset.assetStatus === 'MAINTENANCE');

  return (
    <Screen>
      <ScreenContainer refreshControl={<RefreshControl refreshing={assets.isRefetching} onRefresh={() => void assets.refetch()} />}>
        <PageHeader
          title="Bảo trì tài sản"
          subtitle="Backend chưa có GET danh sách phiếu bảo trì (blocker B2) — hiển thị tài sản đang MAINTENANCE từ GET /assets."
        />
        {assets.isLoading ? <LoadingState /> : null}
        {assets.isError ? <ErrorState error={assets.error} onRetry={() => void assets.refetch()} /> : null}
        {inMaintenance.map((asset) => (
          <AssetCard key={asset.id} asset={asset} onPress={() => router.push(`/${area}/assets/${asset.id}` as never)} />
        ))}
        {assets.data && !inMaintenance.length ? <EmptyState title="Không có tài sản đang bảo trì" /> : null}
      </ScreenContainer>
    </Screen>
  );
}

/** Section gắn vào Asset Detail: start khi IN_STOCK/DAMAGED, complete khi MAINTENANCE (record cache trong session). */
export function MaintenanceActionsSection({ asset }: { asset: AssetDto }) {
  const start = useStartAssetMaintenance();
  const complete = useCompleteAssetMaintenance();
  const activeRecord = useActiveMaintenanceRecord(asset.id);
  const [maintenanceType, setMaintenanceType] = useState('');
  const [description, setDescription] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [condition, setCondition] = useState<AssetConditionStatus>('GOOD');

  async function runStart() {
    try {
      await start.mutateAsync({
        assetId: asset.id,
        payload: {
          maintenanceType: maintenanceType.trim(),
          description: description.trim(),
          ...(vendorName.trim() ? { vendorName: vendorName.trim() } : {}),
        },
      });
      Alert.alert('Thành công', 'Đã đưa tài sản vào bảo trì');
      setMaintenanceType('');
      setDescription('');
      setVendorName('');
    } catch (error) {
      const mapped = mapWarehouseAssetError(error);
      Alert.alert(mapped.code, mapped.message);
    }
  }

  async function runComplete() {
    if (!activeRecord) return;
    try {
      await complete.mutateAsync({ recordId: activeRecord.id, payload: { conditionWhenReturned: condition } });
      Alert.alert('Thành công', 'Đã hoàn tất bảo trì — trạng thái cuối do backend quyết định');
    } catch (error) {
      const mapped = mapWarehouseAssetError(error);
      Alert.alert(mapped.code, mapped.message);
    }
  }

  if (asset.assetStatus === 'MAINTENANCE') {
    return (
      <SectionCard title="Hoàn tất bảo trì">
        {activeRecord ? (
          <View style={styles.box}>
            <Text style={styles.meta}>Phiếu: {activeRecord.maintenanceType} — {activeRecord.description}</Text>
            <Text style={styles.label}>Đánh giá lại tình trạng</Text>
            <View style={styles.chipRow}>
              {conditionOptions.map((option) => (
                <FilterChip
                  key={option}
                  label={assetConditionLabels[option]}
                  selected={condition === option}
                  onPress={() => setCondition(option)}
                />
              ))}
            </View>
            <PrimaryButton loading={complete.isPending} onPress={() => void runComplete()}>Hoàn tất bảo trì</PrimaryButton>
          </View>
        ) : (
          <Text style={styles.meta}>
            Không có mã phiếu bảo trì trong session này. Backend chưa có GET /asset-maintenance để tra cứu (blocker B2) — không thể complete từ mobile.
          </Text>
        )}
      </SectionCard>
    );
  }

  if (!canStartMaintenance(asset)) return null;

  return (
    <SectionCard title="Bảo trì tài sản">
      <FormField label="Loại bảo trì" value={maintenanceType} onChangeText={setMaintenanceType} />
      <FormField label="Mô tả" value={description} onChangeText={setDescription} multiline />
      <FormField label="Nhà cung cấp (tùy chọn)" value={vendorName} onChangeText={setVendorName} />
      <SecondaryButton
        loading={start.isPending}
        disabled={!maintenanceType.trim() || !description.trim()}
        onPress={() => void runStart()}
      >
        Bắt đầu bảo trì
      </SecondaryButton>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  box: {
    gap: spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
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
