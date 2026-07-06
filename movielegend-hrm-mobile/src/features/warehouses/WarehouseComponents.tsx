import { StyleSheet, Text, View } from 'react-native';
import { SecondaryButton } from '../../components/Buttons';
import { FormField } from '../../components/FormField';
import { SectionCard } from '../../components/SectionCard';
import { StatusBadge } from '../../components/StatusBadge';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import type { MaterialDto } from '../../types/material.types';
import type { WarehouseStockDto } from '../../types/stock.types';
import type { WarehouseDto } from '../../types/warehouse.types';
import { formatQuantity } from '../../utils/quantity';
import { availableQuantity, isLowStock } from './stock.logic';

export function WarehouseCard({ warehouse, onPress }: { warehouse: WarehouseDto; onPress?: () => void }) {
  return (
    <SectionCard>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{warehouse.name}</Text>
        <StatusBadge label={warehouse.isActive ? 'ACTIVE' : 'CLOSED'} tone={warehouse.isActive ? 'success' : 'danger'} />
      </View>
      <Text style={styles.meta}>Mã kho: {warehouse.code}</Text>
      {warehouse.address ? <Text style={styles.meta}>Địa chỉ: {warehouse.address}</Text> : null}
      <Text style={styles.meta}>Manager: {warehouse.managerUserId ?? 'Chưa gán'}</Text>
      {onPress ? <SecondaryButton onPress={onPress}>Chi tiết</SecondaryButton> : null}
    </SectionCard>
  );
}

export function LowStockBadge() {
  return <StatusBadge label="Sắp hết" tone="danger" />;
}

export function StockRow({ stock }: { stock: WarehouseStockDto }) {
  const low = isLowStock(stock);
  return (
    <View style={[styles.stockRow, low && styles.stockRowLow]}>
      <View style={styles.stockInfo}>
        <Text style={styles.stockName}>{stock.material?.name ?? stock.materialId}</Text>
        <Text style={styles.meta}>
          {stock.material?.materialCode ?? ''} {stock.material?.unit ? `· ${stock.material.unit}` : ''}
        </Text>
      </View>
      <View style={styles.stockNumbers}>
        <Text style={styles.stockQty}>Tồn: {formatQuantity(stock.quantityOnHand)}</Text>
        <Text style={styles.meta}>Giữ: {formatQuantity(stock.quantityReserved)}</Text>
        <Text style={styles.meta}>Khả dụng: {formatQuantity(availableQuantity(stock))}</Text>
        {low ? <LowStockBadge /> : null}
      </View>
    </View>
  );
}

export function WarehouseSelector({
  warehouses,
  selectedWarehouseId,
  onSelect,
  label = 'Chọn kho',
}: {
  warehouses: WarehouseDto[];
  selectedWarehouseId: string;
  onSelect: (warehouseId: string) => void;
  label?: string;
}) {
  if (!warehouses.length) return <Text style={styles.meta}>Không có kho nào trong scope của bạn</Text>;
  return (
    <View style={styles.selector}>
      <Text style={styles.selectorLabel}>{label}</Text>
      {warehouses.map((warehouse) => (
        <SecondaryButton
          key={warehouse.id}
          onPress={() => onSelect(warehouse.id)}
          style={selectedWarehouseId === warehouse.id ? styles.selectedOption : undefined}
        >
          {`${warehouse.code} — ${warehouse.name}`}
        </SecondaryButton>
      ))}
    </View>
  );
}

export function MaterialSelector({
  materials,
  selectedMaterialId,
  onSelect,
  label = 'Chọn vật tư',
}: {
  materials: MaterialDto[];
  selectedMaterialId: string;
  onSelect: (materialId: string) => void;
  label?: string;
}) {
  const active = materials.filter((material) => material.isActive);
  if (!active.length) return <Text style={styles.meta}>Chưa có vật tư</Text>;
  return (
    <View style={styles.selector}>
      <Text style={styles.selectorLabel}>{label}</Text>
      {active.map((material) => (
        <SecondaryButton
          key={material.id}
          onPress={() => onSelect(material.id)}
          style={selectedMaterialId === material.id ? styles.selectedOption : undefined}
        >
          {`${material.materialCode} — ${material.name} (${material.unit})`}
        </SecondaryButton>
      ))}
    </View>
  );
}

export function QuantityInput({
  label,
  value,
  onChange,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string | undefined;
}) {
  return <FormField label={label} value={value} onChangeText={onChange} keyboardType="decimal-pad" error={error} placeholder="0" />;
}

const styles = StyleSheet.create({
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
  selectedOption: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  selector: {
    gap: spacing.sm,
  },
  selectorLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  stockInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  stockName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  stockNumbers: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  stockQty: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  stockRow: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  stockRowLow: {
    borderColor: colors.danger,
  },
  title: {
    color: colors.text,
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
  },
});
