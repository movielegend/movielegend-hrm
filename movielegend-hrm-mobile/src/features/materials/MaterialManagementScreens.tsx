import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View, Pressable, Image } from 'react-native';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { PageHeader } from '../../components/PageHeader';
import { PrimaryButton, SecondaryButton } from '../../components/Buttons';
import { Screen } from '../../components/Screen';
import { ScreenContainer } from '../../components/ScreenContainer';
import { SectionCard } from '../../components/SectionCard';
import { useDepartments } from '../../hooks/useDepartments';
import { useAssets, useAssignAsset, useTransferAsset, useRequestAssetReturn } from '../../hooks/useAssets';
import { useAuth } from '../../providers/AuthProvider';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { FilterChip } from '../../components/FilterChip';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ConfirmModal } from '../../components/ConfirmModal';

export function AssetDepartmentListScreen() {
  const router = useRouter();
  const { data: departments, isLoading, isError, error, refetch, isRefetching } = useDepartments();

  return (
    <Screen>
      <ScreenContainer refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} />}>
        <PageHeader title="Vật tư" subtitle="Quản lý vật tư theo phòng ban" />
        {isLoading ? <LoadingState /> : null}
        {isError ? <ErrorState error={error} onRetry={() => void refetch()} /> : null}
        
        {departments?.items.map((dept) => (
          <Pressable key={dept.id} onPress={() => router.push(`/admin/materials/department/${dept.id}` as never)}>
            <SectionCard style={styles.deptCard}>
              <View style={styles.deptHeader}>
                <Text style={styles.deptName}>{dept.name}</Text>
                <MaterialCommunityIcons name="chevron-right" size={24} color={colors.muted} />
              </View>
              <Text style={styles.deptDesc}>Quản lý vật tư thuộc bộ phận này</Text>
            </SectionCard>
          </Pressable>
        ))}
        {departments && !departments.items.length ? <EmptyState title="Không có phòng ban nào" /> : null}
      </ScreenContainer>
    </Screen>
  );
}

export function AssetDepartmentScreen() {
  const { id: departmentId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: departments } = useDepartments();
  const department = departments?.items.find((d) => d.id === departmentId);
  const { data: assetsData, isLoading, isError, error, refetch, isRefetching } = useAssets();
  
  const [filter, setFilter] = useState<'ALL' | 'IN_STOCK' | 'ASSIGNED' | 'BROKEN'>('ALL');
  
  const assets = (assetsData?.items || []).filter((a: any) => a.departmentId === departmentId);
  
  const filteredAssets = assets.filter((asset: any) => {
    if (filter === 'ALL') return true;
    if (filter === 'IN_STOCK') return asset.assetStatus === 'IN_STOCK';
    if (filter === 'ASSIGNED') return asset.assetStatus === 'IN_USE' || asset.assetStatus === 'ASSIGNED';
    if (filter === 'BROKEN') return asset.conditionStatus === 'DAMAGED' || asset.assetStatus === 'DAMAGED' || asset.assetStatus === 'LOST';
    return true;
  });

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} />}>
        <PageHeader title={`Vật tư: ${department?.name || ''}`} subtitle="Quản lý danh sách vật tư" />
        
        <PrimaryButton onPress={() => router.push(`/admin/assets/create?departmentId=${departmentId}` as never)} style={{ marginBottom: spacing.md }}>
          Tạo vật tư mới
        </PrimaryButton>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          <FilterChip label="Tất cả" selected={filter === 'ALL'} onPress={() => setFilter('ALL')} />
          <FilterChip label="Đã giao" selected={filter === 'ASSIGNED'} onPress={() => setFilter('ASSIGNED')} />
          <FilterChip label="Còn kho" selected={filter === 'IN_STOCK'} onPress={() => setFilter('IN_STOCK')} />
          <FilterChip label="Hỏng" selected={filter === 'BROKEN'} onPress={() => setFilter('BROKEN')} />
        </ScrollView>

        <View style={styles.list}>
          {filteredAssets.map((asset: any) => (
            <AssetCard key={asset.id} asset={asset} />
          ))}
          {filteredAssets.length === 0 && <EmptyState title="Không có vật tư nào" />}
        </View>
      </ScrollView>
    </Screen>
  );
}

function AssetCard({ asset }: { asset: any }) {
  const router = useRouter();
  const requestReturn = useRequestAssetReturn();
  const [confirmAction, setConfirmAction] = useState<string | null>(null);

  const activeAssignment = asset.assignments?.find((a: any) => 
    a.status === 'ACTIVE' || a.status === 'PENDING_CONFIRMATION'
  );

  const handleRevoke = async () => {
    if (!activeAssignment) return;
    await requestReturn.mutateAsync(activeAssignment.id);
    setConfirmAction(null);
  };

  return (
    <SectionCard style={styles.assetCard}>
      <View style={styles.assetHeader}>
        <View style={styles.assetTitleRow}>
          <Text style={styles.assetName}>{asset.name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(asset.assetStatus) }]}>
            <Text style={styles.statusText}>{getStatusText(asset.assetStatus)}</Text>
          </View>
        </View>
        <Text style={styles.assetCode}>{asset.assetCode} · {asset.category?.name || 'Vật tư'}</Text>
      </View>

      {asset.imageUrl ? (
        <Image 
          source={{ uri: asset.imageUrl }} 
          style={{ width: '100%', height: 150, borderRadius: 8, marginBottom: 12, backgroundColor: '#f3f4f6' }} 
          resizeMode="cover"
        />
      ) : null}

      <View style={styles.assetBody}>
        {activeAssignment && (
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="account-outline" size={16} color={colors.muted} />
            <Text style={styles.infoText}>Đang giao: {activeAssignment.assignedToUser?.fullName || 'Nhân viên'}</Text>
          </View>
        )}
        {asset.conditionNote && (
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="note-text-outline" size={16} color={colors.muted} />
            <Text style={styles.infoText}>Tình trạng: {asset.conditionNote}</Text>
          </View>
        )}
      </View>

      <View style={styles.assetActions}>
        <SecondaryButton style={styles.actionBtn} onPress={() => router.push(`/admin/assets/${asset.id}/edit` as never)}>
          <MaterialCommunityIcons name="pencil-outline" size={18} color={colors.primary} style={{ marginRight: 4 }} />
          Sửa
        </SecondaryButton>
        {asset.assetStatus === 'IN_STOCK' ? (
          <>
            <SecondaryButton style={styles.actionBtn} onPress={() => router.push(`/admin/assets/${asset.id}/assign` as never)}>
              <MaterialCommunityIcons name="account-arrow-right-outline" size={18} color={colors.primary} style={{ marginRight: 4 }} />
              Giao
            </SecondaryButton>
            <SecondaryButton style={styles.actionBtn} onPress={() => router.push(`/admin/assets/${asset.id}/transfer` as never)}>
              <MaterialCommunityIcons name="swap-horizontal" size={18} color={colors.primary} style={{ marginRight: 4 }} />
              Chuyển
            </SecondaryButton>
          </>
        ) : activeAssignment ? (
          <SecondaryButton style={styles.actionBtn} onPress={() => setConfirmAction('revoke')}>
            <MaterialCommunityIcons name="account-arrow-left-outline" size={18} color={colors.primary} style={{ marginRight: 4 }} />
            Thu hồi
          </SecondaryButton>
        ) : null}
      </View>

      {/* Mock modal cho việc thu hồi */}
    </SectionCard>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case 'IN_USE':
    case 'ASSIGNED': return '#D1FAE5'; // Green
    case 'IN_STOCK': return '#E0F2FE'; // Blue
    case 'MAINTENANCE':
    case 'DAMAGED': return '#FEE2E2'; // Red
    case 'LOST':
    case 'DISPOSED': return '#F3F4F6'; // Gray
    default: return '#F3F4F6';
  }
}

function getStatusText(status: string) {
  switch (status) {
    case 'IN_USE': return 'Đang sử dụng';
    case 'ASSIGNED': return 'Đã giao';
    case 'IN_STOCK': return 'Còn kho';
    case 'MAINTENANCE': return 'Bảo trì';
    case 'DAMAGED': return 'Hỏng';
    case 'LOST': return 'Mất';
    case 'DISPOSED': return 'Đã thanh lý';
    default: return status;
  }
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  deptCard: { marginBottom: spacing.sm, padding: spacing.md },
  deptHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  deptName: { fontSize: 16, fontWeight: '600', color: colors.text },
  deptDesc: { fontSize: 14, color: colors.muted, marginTop: 4 },
  filters: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  list: { gap: spacing.md },
  assetCard: { padding: spacing.md },
  assetHeader: { marginBottom: spacing.sm },
  assetTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  assetName: { fontSize: 16, fontWeight: '700', color: colors.text, flex: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: '600', color: colors.text },
  assetCode: { fontSize: 13, color: colors.muted },
  assetBody: { marginBottom: spacing.md, gap: 6 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoText: { fontSize: 14, color: colors.text },
  assetActions: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  actionBtn: { flex: 1, minWidth: '25%', paddingVertical: 8, flexDirection: 'row', justifyContent: 'center' },
});
