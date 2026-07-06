import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FilterChip } from '../../components/FilterChip';
import { PrimaryButton, SecondaryButton } from '../../components/Buttons';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import type { MaterialDto } from '../../types/material.types';
import type { StockLinePayload } from '../../types/stock.types';
import { QuantityInput } from '../warehouses/WarehouseComponents';

export interface StockLineDraft extends StockLinePayload {
  materialName: string;
}

/** Builder dòng vật tư dùng chung cho receipt/issue/transfer — gửi 1 API call kèm items[], không call per-item. */
export function StockLineBuilder({
  materials,
  lines,
  onChange,
  withUnitCost = false,
}: {
  materials: MaterialDto[];
  lines: StockLineDraft[];
  onChange: (lines: StockLineDraft[]) => void;
  withUnitCost?: boolean;
}) {
  const [materialId, setMaterialId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unitCost, setUnitCost] = useState('');

  const active = materials.filter((material) => material.isActive);

  function addLine() {
    const material = active.find((item) => item.id === materialId);
    const parsedQuantity = Number(quantity);
    const parsedCost = Number(unitCost);
    if (!material || !Number.isFinite(parsedQuantity) || parsedQuantity <= 0) return;
    onChange([
      ...lines.filter((line) => line.materialId !== material.id),
      {
        materialId: material.id,
        materialName: `${material.materialCode} — ${material.name}`,
        quantity: parsedQuantity,
        ...(withUnitCost && unitCost.trim() && Number.isFinite(parsedCost) && parsedCost >= 0 ? { unitCost: parsedCost } : {}),
      },
    ]);
    setMaterialId('');
    setQuantity('');
    setUnitCost('');
  }

  function removeLine(id: string) {
    onChange(lines.filter((line) => line.materialId !== id));
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Chọn vật tư</Text>
      <View style={styles.chipRow}>
        {active.map((material) => (
          <FilterChip
            key={material.id}
            label={`${material.materialCode} ${material.name}`}
            selected={materialId === material.id}
            onPress={() => setMaterialId(material.id)}
          />
        ))}
      </View>
      <QuantityInput label="Số lượng" value={quantity} onChange={setQuantity} />
      {withUnitCost ? <QuantityInput label="Đơn giá (tùy chọn)" value={unitCost} onChange={setUnitCost} /> : null}
      <PrimaryButton disabled={!materialId || !quantity.trim() || Number(quantity) <= 0} onPress={addLine}>
        Thêm dòng
      </PrimaryButton>
      {lines.map((line) => (
        <View key={line.materialId} style={styles.lineRow}>
          <View style={styles.lineInfo}>
            <Text style={styles.lineName}>{line.materialName}</Text>
            <Text style={styles.meta}>
              SL: {line.quantity}
              {typeof line.unitCost === 'number' ? ` · Đơn giá: ${line.unitCost}` : ''}
            </Text>
          </View>
          <SecondaryButton onPress={() => removeLine(line.materialId)}>Xóa</SecondaryButton>
        </View>
      ))}
      {!lines.length ? <Text style={styles.meta}>Chưa có dòng vật tư nào</Text> : null}
    </View>
  );
}

export function toStockLinePayloads(lines: StockLineDraft[]): StockLinePayload[] {
  return lines.map(({ materialName: _materialName, ...payload }) => payload);
}

const styles = StyleSheet.create({
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  container: {
    gap: spacing.sm,
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  lineInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  lineName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  lineRow: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  meta: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
});
