import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, View, Pressable, TextInput, Image } from 'react-native';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { PageHeader } from '../../components/PageHeader';
import { PrimaryButton, SecondaryButton } from '../../components/Buttons';
import { Screen } from '../../components/Screen';
import { ScreenContainer } from '../../components/ScreenContainer';
import { SectionCard } from '../../components/SectionCard';
import { useDepartments } from '../../hooks/useDepartments';
import { useAssets, useAssignAsset, useTransferAsset, useRequestAssetReturn, useRevokeAsset } from '../../hooks/useAssets';
import { useAuth } from '../../providers/AuthProvider';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { FilterChip } from '../../components/FilterChip';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ConfirmModal } from '../../components/ConfirmModal';
import { SelectModal } from '../../components/SelectModal';
import { FormField } from '../../components/FormField';
import { useEmployees } from '../../hooks/useEmployees';

export function AssetDepartmentListScreen() {
  const router = useRouter();
  const { data: departments, isLoading, isError, error, refetch, isRefetching } = useDepartments();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDepartments = departments?.items.filter(d => 
    d.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Screen>
      <ScreenContainer style={styles.container} refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} />}>
        
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <MaterialCommunityIcons name="lightning-bolt" size={24} color="#36C59E" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Vật tư</Text>
            <Text style={styles.headerSubtitle}>Chọn phòng ban làm việc</Text>
          </View>
        </View>

        <Text style={styles.sectionLabelGray}>TÌM PHÒNG BAN</Text>
        
        <View style={styles.searchBarContainerDept}>
           <MaterialCommunityIcons name="magnify" size={20} color="#98A0A8" />
           <TextInput 
             style={styles.searchInputDept} 
             placeholder="Nhập tên phòng ban..." 
             placeholderTextColor="#98A0A8"
             value={searchQuery}
             onChangeText={setSearchQuery}
           />
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionLabelHeader}>Danh sách phòng ban</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{filteredDepartments?.length || 0} Đơn vị</Text>
          </View>
        </View>
        
        {isLoading ? <LoadingState /> : null}
        {isError ? <ErrorState error={error} onRetry={() => void refetch()} /> : null}

        {filteredDepartments?.map((dept) => (
          <Pressable key={dept.id} onPress={() => router.push(`/admin/materials/department/${dept.id}` as never)}>
            <View style={styles.popularDeptCard}>
              <View style={styles.popularDeptIcon}>
                <MaterialCommunityIcons name="office-building" size={24} color="#5C6AC4" />
              </View>
              <View style={styles.popularDeptInfo}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                   <Text style={styles.popularDeptName}>{dept.name}</Text>
                   {dept.name.toLowerCase().includes('kho thành phẩm') && (
                     <View style={styles.newBadge}><Text style={styles.newBadgeText}>Mới</Text></View>
                   )}
                </View>
                <Text style={styles.popularDeptDesc}>Quản lý vật tư thuộc bộ phận {dept.name.toLowerCase()}</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color="#CBD5E1" />
            </View>
          </Pressable>
        ))}

        {filteredDepartments && filteredDepartments.length === 0 && !isLoading ? (
          <EmptyState title="Không tìm thấy phòng ban nào" />
        ) : null}

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
  
  const [filter, setFilter] = useState<'ALL' | 'IN_STOCK' | 'PENDING' | 'ASSIGNED' | 'BROKEN'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [revokeModalVisible, setRevokeModalVisible] = useState(false);
  const [selectedAssetForRevoke, setSelectedAssetForRevoke] = useState<any | null>(null);
  const [revokeNote, setRevokeNote] = useState('');
  const revokeMutation = useRevokeAsset();

  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [selectedAssetForAssign, setSelectedAssetForAssign] = useState<any | null>(null);
  const [assignedUserId, setAssignedUserId] = useState<string | null>(null);
  const assignMutation = useAssignAsset();

  const [transferModalVisible, setTransferModalVisible] = useState(false);
  const [selectedAssetForTransfer, setSelectedAssetForTransfer] = useState<any | null>(null);
  const [targetDepartmentId, setTargetDepartmentId] = useState<string | null>(null);
  const transferMutation = useTransferAsset();

  // For Modals
  const { data: employees } = useEmployees({ departmentId: departmentId, page: 1, limit: 100 });
  const allDepartments = useDepartments({ limit: 1000 });
  
  const assets = (assetsData?.items || []).filter((a: any) => a.departmentId === departmentId);
  
  const filteredAssets = assets.filter((asset: any) => {
    if (filter === 'ALL') return true;
    if (filter === 'IN_STOCK') return asset.assetStatus === 'IN_STOCK';
    
    const hasPending = asset.assignments?.some((a: any) => a.status === 'PENDING_CONFIRMATION');
    if (filter === 'PENDING') return hasPending;
    if (filter === 'ASSIGNED') return (asset.assetStatus === 'IN_USE' || asset.assetStatus === 'ASSIGNED') && !hasPending;
    
    if (filter === 'BROKEN') return asset.conditionStatus === 'DAMAGED' || asset.assetStatus === 'DAMAGED' || asset.assetStatus === 'LOST';
    if (searchQuery && !asset.name?.toLowerCase().includes(searchQuery.toLowerCase()) && !asset.assetCode?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} />}>
        <PageHeader 
          title="Danh sách Vật tư" 
          subtitle={department?.name || 'Kho thiết bị tổng'} 
          onBack={() => router.back()} 
        />

        <Pressable 
          style={styles.createAssetButton} 
          onPress={() => router.push(`/admin/assets/create?departmentId=${departmentId}` as never)}
        >
          <MaterialCommunityIcons name="plus" size={20} color="#FFF" />
          <Text style={styles.createAssetButtonText}>Tạo vật tư mới</Text>
        </Pressable>

        <View style={styles.searchBarContainer}>
           <MaterialCommunityIcons name="magnify" size={20} color="#98A0A8" />
           <TextInput 
             style={styles.searchInput} 
             placeholder="Tìm kiếm theo tên hoặc mã..." 
             placeholderTextColor="#98A0A8"
             value={searchQuery}
             onChangeText={setSearchQuery}
           />
        </View>

        <Text style={styles.listHeader}>Danh sách ({filteredAssets.length} vật tư)</Text>
        
        <View style={styles.list}>
          {filteredAssets.map((asset: any) => (
            <AssetCard 
              key={asset.id} 
              asset={asset}
              employees={employees?.items || []}
              onPress={() => router.push(`/admin/assets/${asset.id}` as never)}
              onRevoke={() => { setSelectedAssetForRevoke(asset); setRevokeNote(''); setRevokeModalVisible(true); }}
              onAssign={() => { setSelectedAssetForAssign(asset); setAssignedUserId(null); setAssignModalVisible(true); }}
              onTransfer={() => { setSelectedAssetForTransfer(asset); setTargetDepartmentId(null); setTransferModalVisible(true); }}
            />
          ))}
          {filteredAssets.length === 0 && <EmptyState title="Không có vật tư nào" />}
        </View>
      </ScrollView>

      <ConfirmModal
        visible={revokeModalVisible}
        title="Thu hồi tài sản"
        description={`Bạn có chắc muốn thu hồi tài sản ${selectedAssetForRevoke?.name}?`}
        confirmText="Thu hồi"
        confirmTone="danger"
        isLoading={revokeMutation.isPending}
        onConfirm={async () => {
          if (selectedAssetForRevoke) {
            await revokeMutation.mutateAsync({ assetId: selectedAssetForRevoke.id, payload: { note: revokeNote } });
            setRevokeModalVisible(false);
          }
        }}
        onCancel={() => setRevokeModalVisible(false)}
      >
        <FormField
          label="Ghi chú thu hồi"
          value={revokeNote}
          onChangeText={setRevokeNote}
          placeholder="Lý do, tình trạng khi thu hồi..."
        />
      </ConfirmModal>

      <SelectModal
        visible={assignModalVisible}
        title="Chọn nhân viên để giao"
        options={(employees?.items ?? []).map(e => ({ id: e.id, label: e.profile?.fullName ?? e.phone, subtitle: e.userCode }))}
        selectedValue={assignedUserId}
        onSelect={async (option) => {
          setAssignedUserId(option.id);
          if (selectedAssetForAssign) {
            try {
              await assignMutation.mutateAsync({ assetId: selectedAssetForAssign.id, payload: { assignedToUserId: option.id, conditionWhenAssigned: selectedAssetForAssign.conditionStatus } });
              setAssignModalVisible(false);
            } catch (e: any) {}
          }
        }}
        onClose={() => setAssignModalVisible(false)}
        isLoading={!employees}
      />

      <SelectModal
        visible={transferModalVisible}
        title="Chọn phòng ban điều chuyển"
        options={(allDepartments.data?.items ?? []).filter(d => d.id !== departmentId).map(d => ({ id: d.id, label: d.name, subtitle: d.code }))}
        selectedValue={targetDepartmentId}
        onSelect={async (option) => {
          setTargetDepartmentId(option.id);
          if (selectedAssetForTransfer) {
            try {
              await transferMutation.mutateAsync({ assetId: selectedAssetForTransfer.id, payload: { targetDepartmentId: option.id } });
              setTransferModalVisible(false);
            } catch (e: any) {}
          }
        }}
        onClose={() => setTransferModalVisible(false)}
        isLoading={allDepartments.isLoading}
      />
    </Screen>
  );
}

function AssetCard({ asset, employees, onPress, onRevoke, onAssign, onTransfer }: { asset: any, employees: any[], onPress: () => void, onRevoke: () => void, onAssign: () => void, onTransfer: () => void }) {
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

  const assignee = employees.find((e: any) => e.id === activeAssignment?.assignedToUserId);
  const assigneeName = assignee ? (assignee.profile?.fullName ?? assignee.phone) : (activeAssignment?.user?.profile?.fullName ?? activeAssignment?.user?.phone ?? 'Nhân viên');

  return (
    <Pressable onPress={onPress}>
      <SectionCard style={styles.assetCard}>
        <View style={styles.assetContentRow}>
          {asset.imageUrl ? (
            <Image source={{ uri: asset.imageUrl }} style={styles.assetThumbnail} resizeMode="cover" />
          ) : (
            <View style={styles.assetThumbnailPlaceholder}>
              <MaterialCommunityIcons name="laptop" size={30} color="#98A0A8" />
            </View>
          )}

          <View style={styles.assetInfo}>
            <View style={styles.assetTitleRow}>
              <Text style={styles.assetName} numberOfLines={1}>{asset.name}</Text>
              <View style={[styles.statusBadgeOutline, { borderColor: activeAssignment?.status === 'PENDING_CONFIRMATION' ? '#F59E0B' : getStatusColorBorder(asset.assetStatus) }]}>
                <Text style={[styles.statusTextOutline, { color: activeAssignment?.status === 'PENDING_CONFIRMATION' ? '#F59E0B' : getStatusColorBorder(asset.assetStatus) }]}>
                  {activeAssignment?.status === 'PENDING_CONFIRMATION' ? 'Đang giao' : getStatusText(asset.assetStatus)}
                </Text>
              </View>
            </View>
            <Text style={styles.assetCode}>{asset.assetCode} • {asset.category?.name || 'Vật tư'}</Text>
            
            <View style={styles.assetDetailRow}>
              <MaterialCommunityIcons name="information-outline" size={14} color="#64748B" />
              <Text style={styles.assetDetailText}>Tình trạng: {asset.conditionNote || 'Bình thường'}</Text>
            </View>
            
            <View style={styles.assetDetailRow}>
              <MaterialCommunityIcons name="office-building" size={14} color="#64748B" />
              <Text style={styles.assetDetailText}>Phòng: {activeAssignment ? assigneeName : 'Chưa giao'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.assetActionsTeal}>
          <Pressable style={styles.actionBtnTeal} onPress={() => router.push(`/admin/assets/${asset.id}/edit` as never)}>
            <MaterialCommunityIcons name="pencil-outline" size={18} color="#36C59E" />
            <Text style={styles.actionBtnTealText}>Sửa</Text>
          </Pressable>
          {asset.assetStatus === 'IN_STOCK' ? (
            <>
              <Pressable style={styles.actionBtnTeal} onPress={onAssign}>
                <MaterialCommunityIcons name="rocket-launch-outline" size={18} color="#36C59E" />
                <Text style={styles.actionBtnTealText}>Giao</Text>
              </Pressable>
              <Pressable style={styles.actionBtnTeal} onPress={onTransfer}>
                <MaterialCommunityIcons name="swap-horizontal" size={18} color="#36C59E" />
                <Text style={styles.actionBtnTealText}>Chuyển</Text>
              </Pressable>
            </>
          ) : activeAssignment ? (
            <Pressable style={[styles.actionBtnTeal, { borderColor: colors.danger }]} onPress={onRevoke}>
              <MaterialCommunityIcons name="account-arrow-left-outline" size={18} color={colors.danger} />
              <Text style={[styles.actionBtnTealText, { color: colors.danger }]}>Thu hồi</Text>
            </Pressable>
          ) : null}
        </View>
      </SectionCard>
    </Pressable>
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

function getStatusColorBorder(status: string) {
  switch (status) {
    case 'IN_USE':
    case 'ASSIGNED': return '#10B981'; // Green
    case 'IN_STOCK': return '#98A0A8'; // Gray
    case 'MAINTENANCE':
    case 'DAMAGED': return '#EF4444'; // Red
    case 'LOST':
    case 'DISPOSED': return '#6B7280'; // Gray
    default: return '#6B7280';
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
  container: { backgroundColor: '#F8FAFC', flex: 1 },
  header: { padding: spacing.lg, paddingBottom: 0, flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  headerIcon: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', marginRight: spacing.md },
  headerTitle: { fontSize: 24, fontWeight: '800', color: colors.text },
  headerSubtitle: { fontSize: 14, color: colors.muted },
  sectionLabel: { fontSize: 16, fontWeight: '700', color: colors.text, marginHorizontal: spacing.md, marginTop: spacing.lg, marginBottom: spacing.sm },
  sectionLabelGray: { fontSize: 12, fontWeight: '700', color: '#98A0A8', marginHorizontal: spacing.md, marginTop: spacing.lg, marginBottom: spacing.sm },
  sectionLabelHeader: { fontSize: 18, fontWeight: '700', color: colors.text },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: spacing.md, marginTop: spacing.xl, marginBottom: spacing.md },
  countBadge: { backgroundColor: '#EEF2FF', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  countBadgeText: { color: '#5C6AC4', fontSize: 12, fontWeight: '600' },
  pickerContainer: { marginHorizontal: spacing.md },
  searchDropdown: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFF' },
  searchDropdownText: { fontSize: 14 },
  popularDeptCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 16, marginHorizontal: spacing.md, marginBottom: 12, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  popularDeptCardSelected: { borderColor: '#36C59E', backgroundColor: '#F0FDF4' },
  popularDeptIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center', marginRight: spacing.md },
  popularDeptInfo: { flex: 1 },
  popularDeptName: { fontSize: 16, fontWeight: '600', color: '#1E293B' },
  popularDeptDesc: { fontSize: 12, color: '#64748B', marginTop: 2 },
  newBadge: { backgroundColor: '#5C6AC4', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, marginLeft: 8 },
  newBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
  bottomBar: { padding: spacing.lg, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  continueButton: { backgroundColor: '#36C59E', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  continueButtonDisabled: { backgroundColor: '#A7F3D0' },
  continueButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  createAssetButton: { backgroundColor: '#36C59E', borderRadius: 12, paddingVertical: 16, marginHorizontal: spacing.lg, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: spacing.md },
  createAssetButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700', marginLeft: 8 },
  filterDropdownRow: { flexDirection: 'row', gap: spacing.sm, marginHorizontal: spacing.lg, marginBottom: spacing.md },
  miniDropdown: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#FFF' },
  miniDropdownText: { fontSize: 12, color: '#334155' },
  searchBarContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, marginHorizontal: spacing.lg, backgroundColor: '#FFF', marginBottom: spacing.md },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, color: '#334155' },
  listHeader: { fontSize: 14, fontWeight: '600', color: '#64748B', marginHorizontal: spacing.lg, marginBottom: spacing.sm },
  assetContentRow: { flexDirection: 'row', marginBottom: spacing.md },
  assetThumbnail: { width: 60, height: 60, borderRadius: 30, marginRight: 12, backgroundColor: '#f3f4f6' },
  assetThumbnailPlaceholder: { width: 60, height: 60, borderRadius: 30, marginRight: 12, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  assetInfo: { flex: 1 },
  statusBadgeOutline: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, borderWidth: 1, backgroundColor: '#FFF' },
  statusTextOutline: { fontSize: 10, fontWeight: '600' },
  assetDetailRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  assetDetailText: { fontSize: 12, color: '#64748B', marginLeft: 4 },
  assetActionsTeal: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  actionBtnTeal: { flex: 1, minWidth: '25%', paddingVertical: 8, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#36C59E', borderRadius: 8 },
  actionBtnTealText: { color: '#36C59E', fontSize: 14, fontWeight: '600', marginLeft: 4 },
  searchBarContainerDept: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 12, marginHorizontal: spacing.md, backgroundColor: '#F8FAFC', marginBottom: spacing.md },
  searchInputDept: { flex: 1, marginLeft: 12, fontSize: 15, color: '#334155' },
});
