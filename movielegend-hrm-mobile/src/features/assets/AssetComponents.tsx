import { StyleSheet, Text, View, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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

  let iconName: any = 'cube-outline';
  const nameLower = asset.name.toLowerCase();
  if (nameLower.includes('laptop') || nameLower.includes('macbook')) iconName = 'laptop';
  else if (nameLower.includes('màn hình') || nameLower.includes('monitor')) iconName = 'monitor';
  else if (nameLower.includes('chuột') || nameLower.includes('mouse')) iconName = 'mouse';
  else if (nameLower.includes('bàn phím') || nameLower.includes('keyboard')) iconName = 'keyboard';
  else if (nameLower.includes('điện thoại') || nameLower.includes('phone')) iconName = 'cellphone';
  else if (nameLower.includes('ghế')) iconName = 'chair-rolling';
  else if (nameLower.includes('bàn')) iconName = 'desk';
  else if (nameLower.includes('xe')) iconName = 'car';

  return (
    <Pressable style={({ pressed }) => [styles.myAssetCard, pressed && { opacity: 0.9 }]} onPress={onPress}>
      <View style={styles.myAssetHeader}>
        <View style={styles.myAssetIconWrap}>
          <MaterialCommunityIcons name={iconName} size={32} color={colors.primary} />
        </View>
        <View style={styles.myAssetInfo}>
          <Text style={styles.myAssetTitle}>{asset.name}</Text>
          <Text style={styles.myAssetCode}>{asset.assetCode} {(asset as any).brand ? `• ${(asset as any).brand}` : ''}</Text>
        </View>
        <AssetStatusBadge status={asset.assetStatus} />
      </View>

      <View style={styles.myAssetDivider} />

      <View style={styles.myAssetBodyRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.metaLabel}>Trạng thái cấp phát</Text>
          <StatusBadge label={assignment.status} tone={assignmentStatusTone(assignment.status)} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.metaLabel}>Tình trạng thiết bị</Text>
          <AssetConditionBadge condition={asset.conditionStatus} />
        </View>
      </View>

      {openIncidents > 0 ? (
        <View style={styles.myAssetAlert}>
          <MaterialCommunityIcons name="alert-circle" size={16} color={colors.danger} />
          <Text style={styles.myAssetAlertText}>Đang có {openIncidents} sự cố chưa xử lý</Text>
        </View>
      ) : null}

      <View style={styles.myAssetFooter}>
        <Text style={styles.myAssetFooterText}>
          Nhận: {formatDateTime(assignment.assignedAt)}
          {assignment.expectedReturnAt ? `  •  Hạn trả: ${formatDateTime(assignment.expectedReturnAt)}` : ''}
        </Text>
      </View>
    </Pressable>
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
  myAssetCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  myAssetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  myAssetIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  myAssetInfo: {
    flex: 1,
  },
  myAssetTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  myAssetCode: {
    fontSize: 13,
    color: colors.muted,
  },
  myAssetDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  myAssetBodyRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  metaLabel: {
    fontSize: 12,
    color: colors.muted,
    marginBottom: 4,
  },
  myAssetAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: spacing.sm,
    borderRadius: 8,
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  myAssetAlertText: {
    fontSize: 13,
    color: colors.danger,
    fontWeight: '500',
  },
  myAssetFooter: {
    backgroundColor: '#F8FAFC',
    padding: spacing.sm,
    borderRadius: 8,
    alignItems: 'center',
  },
  myAssetFooterText: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: '500',
  },
});
