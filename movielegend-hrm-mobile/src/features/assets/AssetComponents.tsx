import { StyleSheet, Text, View } from 'react-native';
import { SecondaryButton } from '../../components/Buttons';
import { SectionCard } from '../../components/SectionCard';
import { StatusBadge } from '../../components/StatusBadge';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import type { AssetConditionStatus, AssetDto, AssetMaintenanceDto, AssetStatus } from '../../types/asset.types';
import type { MyAssetAssignmentDto } from '../../types/asset-assignment.types';
import type { AssetIncidentDto } from '../../types/asset-incident.types';
import { formatDateTime } from '../../utils/date-time';
import {
  assetConditionLabels,
  assetConditionTone,
  assetStatusLabels,
  assetStatusTone,
  assignmentStatusTone,
  incidentStatusTone,
  incidentTypeLabels,
} from './asset.logic';

export function AssetStatusBadge({ status }: { status: AssetStatus }) {
  return <StatusBadge label={assetStatusLabels[status] ?? status} tone={assetStatusTone(status)} />;
}

export function AssetConditionBadge({ condition }: { condition: AssetConditionStatus }) {
  return <StatusBadge label={assetConditionLabels[condition] ?? condition} tone={assetConditionTone(condition)} />;
}

export function AssetCard({ asset, onPress }: { asset: AssetDto; onPress?: () => void }) {
  return (
    <SectionCard>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{asset.name}</Text>
        <AssetStatusBadge status={asset.assetStatus} />
      </View>
      <Text style={styles.meta}>Mã: {asset.assetCode}</Text>
      {asset.brand || asset.model ? <Text style={styles.meta}>{[asset.brand, asset.model].filter(Boolean).join(' / ')}</Text> : null}
      {asset.serialNumber ? <Text style={styles.meta}>Serial: {asset.serialNumber}</Text> : null}
      <AssetConditionBadge condition={asset.conditionStatus} />
      {onPress ? <SecondaryButton onPress={onPress}>Chi tiết</SecondaryButton> : null}
    </SectionCard>
  );
}

export function MyAssetCard({ assignment, onPress }: { assignment: MyAssetAssignmentDto; onPress?: () => void }) {
  const asset = assignment.asset;
  const openIncidents = asset.incidents?.length ?? 0;
  return (
    <SectionCard>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{asset.name}</Text>
        <AssetStatusBadge status={asset.assetStatus} />
      </View>
      <Text style={styles.meta}>Mã: {asset.assetCode}</Text>
      {asset.serialNumber ? <Text style={styles.meta}>Serial: {asset.serialNumber}</Text> : null}
      <View style={styles.badgeRow}>
        <StatusBadge label={assignment.status} tone={assignmentStatusTone(assignment.status)} />
        <AssetConditionBadge condition={asset.conditionStatus} />
        {openIncidents > 0 ? <StatusBadge label={`Sự cố mở: ${openIncidents}`} tone="danger" /> : null}
      </View>
      <Text style={styles.meta}>Cấp phát: {formatDateTime(assignment.assignedAt)}</Text>
      {assignment.expectedReturnAt ? <Text style={styles.meta}>Hạn trả: {formatDateTime(assignment.expectedReturnAt)}</Text> : null}
      {onPress ? <SecondaryButton onPress={onPress}>Chi tiết</SecondaryButton> : null}
    </SectionCard>
  );
}

export function IncidentCard({ incident, onPress }: { incident: AssetIncidentDto; onPress?: () => void }) {
  return (
    <SectionCard>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{incident.asset?.name ?? incident.assetId}</Text>
        <StatusBadge label={incident.status} tone={incidentStatusTone(incident.status)} />
      </View>
      <Text style={styles.meta}>Loại: {incidentTypeLabels[incident.incidentType] ?? incident.incidentType}</Text>
      <Text style={styles.body} numberOfLines={2}>{incident.description}</Text>
      <Text style={styles.meta}>{formatDateTime(incident.createdAt)}</Text>
      {onPress ? <SecondaryButton onPress={onPress}>Chi tiết</SecondaryButton> : null}
    </SectionCard>
  );
}

export function MaintenanceCard({ record, costVisible }: { record: AssetMaintenanceDto; costVisible: boolean }) {
  return (
    <SectionCard>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{record.maintenanceType}</Text>
        <StatusBadge label={record.status} tone={record.status === 'COMPLETED' ? 'success' : 'warning'} />
      </View>
      {record.vendorName ? <Text style={styles.meta}>Nhà cung cấp: {record.vendorName}</Text> : null}
      <Text style={styles.body}>{record.description}</Text>
      <Text style={styles.meta}>Bắt đầu: {formatDateTime(record.startedAt)}</Text>
      {record.completedAt ? <Text style={styles.meta}>Hoàn tất: {formatDateTime(record.completedAt)}</Text> : null}
      {costVisible && record.cost !== null && typeof record.cost !== 'undefined' ? (
        <Text style={styles.meta}>Chi phí: {String(record.cost)}</Text>
      ) : null}
    </SectionCard>
  );
}

/** Selector asset IN_STOCK cho flow cấp phát — backend từ chối asset khác trạng thái. */
export function AssetSelector({
  assets,
  selectedAssetId,
  onSelect,
}: {
  assets: AssetDto[];
  selectedAssetId: string;
  onSelect: (assetId: string) => void;
}) {
  const assignable = assets.filter((asset) => asset.assetStatus === 'IN_STOCK');
  if (!assignable.length) return <Text style={styles.meta}>Không có tài sản IN_STOCK để cấp phát</Text>;
  return (
    <View style={styles.selector}>
      {assignable.map((asset) => (
        <SecondaryButton
          key={asset.id}
          onPress={() => onSelect(asset.id)}
          style={selectedAssetId === asset.id ? styles.selectedOption : undefined}
        >
          {`${asset.assetCode} — ${asset.name}`}
        </SecondaryButton>
      ))}
    </View>
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
  title: {
    color: colors.text,
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
  },
});
