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
        
        <PageHeader 
          title="Vật tư" 
          subtitle="Chọn phòng ban làm việc" 
          onBack={() => router.back()}
          right={
            <Pressable style={styles.historyBtn}>
              <MaterialCommunityIcons name="history" size={22} color="#111827" />
            </Pressable>
          }
        />

        <View style={styles.bannerCard}>
          <View style={styles.bannerIconBox}>
            <MaterialCommunityIcons name="lightning-bolt" size={28} color="#FFF" />
          </View>
          <View style={styles.bannerTextContainer}>
            <Text style={styles.bannerTitle}>Quản lý vật tư</Text>
            <Text style={styles.bannerSubtitle}>Xem và quản lý vật tư theo phòng ban.</Text>
          </View>
          <MaterialCommunityIcons name="package-variant-closed" size={60} color="#E2E8F0" style={styles.bannerImage} />
        </View>

        <Text style={styles.sectionLabelHeader}>Tìm phòng ban</Text>
        
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
            <MaterialCommunityIcons name="office-building" size={14} color="#111827" />
            <Text style={styles.countBadgeText}>{filteredDepartments?.length || 0} Đơn vị</Text>
          </View>
        </View>
        
        {isLoading ? <LoadingState /> : null}
        {isError ? <ErrorState error={error} onRetry={() => void refetch()} /> : null}

        {filteredDepartments?.map((dept) => (
          <Pressable key={dept.id} onPress={() => router.push(`/admin/materials/department/${dept.id}` as never)}>
            <View style={styles.popularDeptCard}>
              <View style={styles.deptCardTop}>
                <View style={styles.popularDeptIcon}>
                  <MaterialCommunityIcons name="office-building" size={24} color="#111827" />
                </View>
                <View style={styles.popularDeptInfo}>
                  <Text style={styles.popularDeptName}>{dept.name}</Text>
                  <Text style={styles.popularDeptDesc}>Quản lý vật tư thuộc bộ phận {dept.name.toLowerCase()}</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color="#9CA3AF" />
              </View>
              
              <View style={styles.deptStatsRow}>
                <View style={styles.deptStatItem}>
                  <MaterialCommunityIcons name="cube-outline" size={20} color="#4B5563" />
                  <View style={styles.deptStatTextCol}>
                    <Text style={styles.deptStatValue}>0</Text>
                    <Text style={styles.deptStatLabel}>Vật tư</Text>
                  </View>
                </View>
                <View style={styles.deptStatDivider} />
                <View style={styles.deptStatItem}>
                  <MaterialCommunityIcons name="clipboard-text-outline" size={20} color="#4B5563" />
                  <View style={styles.deptStatTextCol}>
                    <Text style={styles.deptStatValue}>0</Text>
                    <Text style={styles.deptStatLabel}>Yêu cầu</Text>
                  </View>
                </View>
                <View style={styles.deptStatDivider} />
                <View style={styles.deptStatItem}>
                  <MaterialCommunityIcons name="alert-outline" size={20} color="#4B5563" />
                  <View style={styles.deptStatTextCol}>
                    <Text style={styles.deptStatValue}>0</Text>
                    <Text style={styles.deptStatLabel}>Sắp hết</Text>
                  </View>
                </View>
              </View>
            </View>
          </Pressable>
        ))}

        {filteredDepartments && filteredDepartments.length === 0 && !isLoading ? (
          <EmptyState title="Không tìm thấy phòng ban nào" />
        ) : null}

        <View style={styles.tipCard}>
          <MaterialCommunityIcons name="lightbulb-outline" size={20} color="#4B5563" />
          <View style={styles.tipTextContainer}>
             <Text style={styles.tipTitle}>Mẹo</Text>
             <Text style={styles.tipDesc}>Chọn phòng ban để xem chi tiết vật tư và các yêu cầu liên quan.</Text>
          </View>
          <MaterialCommunityIcons name="close" size={16} color="#9CA3AF" />
        </View>

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
  
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filters, setFilters] = useState({
    keyword: '',
    assigneeId: '',
    assetStatus: '',
    assignmentStatus: '',
  });
  
  const [revokeModalVisible, setRevokeModalVisible] = useState(false);
  const [selectedAssetForRevoke, setSelectedAssetForRevoke] = useState<any | null>(null);
  const [revokeNote, setRevokeNote] = useState('');
  const revokeMutation = useRevokeAsset();

  const [damagedModalVisible, setDamagedModalVisible] = useState(false);
  const [selectedAssetForDamaged, setSelectedAssetForDamaged] = useState<any | null>(null);
  const [damagedAction, setDamagedAction] = useState<'DAMAGED' | 'MAINTENANCE' | 'DISPOSED'>('DAMAGED');
  const [damagedNote, setDamagedNote] = useState('');
  const [damagedVendorName, setDamagedVendorName] = useState('');
  const [damagedStartedAt, setDamagedStartedAt] = useState('');

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
    if (filters.keyword && !asset.name?.toLowerCase().includes(filters.keyword.toLowerCase()) && !asset.assetCode?.toLowerCase().includes(filters.keyword.toLowerCase())) return false;
    if (filters.assetStatus && asset.assetStatus !== filters.assetStatus) return false;
    
    const activeAssign = asset.assignments?.find((a: any) => ['ACTIVE', 'PENDING_CONFIRMATION', 'RETURN_REQUESTED'].includes(a.status));
    if (filters.assigneeId && activeAssign?.assignedToUserId !== filters.assigneeId) return false;
    if (filters.assignmentStatus && (!activeAssign || activeAssign.status !== filters.assignmentStatus)) return false;

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

        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
          <Pressable 
            style={[styles.createAssetButton, { flex: 1, marginBottom: 0 }]} 
            onPress={() => router.push(`/admin/assets/create?departmentId=${departmentId}` as never)}
          >
            <MaterialCommunityIcons name="plus" size={20} color="#FFF" />
            <Text style={styles.createAssetButtonText}>Tạo vật tư mới</Text>
          </Pressable>
          <Pressable 
            style={[styles.createAssetButton, { flex: 0, paddingHorizontal: 16, backgroundColor: '#334155', marginBottom: 0 }]} 
            onPress={() => setFilterModalVisible(true)}
          >
            <MaterialCommunityIcons name="filter-variant" size={20} color="#FFF" />
            <Text style={styles.createAssetButtonText}>Bộ lọc</Text>
          </Pressable>
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
              onReportDamaged={() => { setSelectedAssetForDamaged(asset); setDamagedNote(''); setDamagedVendorName(''); setDamagedStartedAt(new Date().toISOString().split('T')[0]); setDamagedAction('DAMAGED'); setDamagedModalVisible(true); }}
              onAssign={() => { setSelectedAssetForAssign(asset); setAssignedUserId(null); setAssignModalVisible(true); }}
              onTransfer={() => { setSelectedAssetForTransfer(asset); setTargetDepartmentId(null); setTransferModalVisible(true); }}
            />
          ))}
          {filteredAssets.length === 0 && <EmptyState title="Không có vật tư nào khớp với bộ lọc" />}
        </View>
      </ScrollView>

      <ConfirmModal
        visible={filterModalVisible}
        title="Lọc vật tư"
        description="Điều chỉnh các tiêu chí bên dưới để tìm vật tư."
        confirmText="Áp dụng"
        confirmTone="primary"
        isLoading={false}
        onConfirm={() => setFilterModalVisible(false)}
        onCancel={() => {
          setFilters({ keyword: '', assigneeId: '', assetStatus: '', assignmentStatus: '' });
          setFilterModalVisible(false);
        }}
      >
        <FormField label="Từ khóa (Tên, Mã)" value={filters.keyword} onChangeText={(t) => setFilters(prev => ({ ...prev, keyword: t }))} />
        
        <Text style={{ marginBottom: 4, fontWeight: '600' }}>Trạng thái tài sản</Text>
        <View style={[styles.pickerContainer, { marginBottom: 16 }]}>
          <Picker selectedValue={filters.assetStatus} onValueChange={(v) => setFilters(prev => ({ ...prev, assetStatus: v }))}>
            <Picker.Item label="Tất cả" value="" />
            <Picker.Item label="Còn kho (IN_STOCK)" value="IN_STOCK" />
            <Picker.Item label="Đã giao (ASSIGNED)" value="ASSIGNED" />
            <Picker.Item label="Đang sử dụng (IN_USE)" value="IN_USE" />
            <Picker.Item label="Bảo trì (MAINTENANCE)" value="MAINTENANCE" />
            <Picker.Item label="Mất (LOST)" value="LOST" />
            <Picker.Item label="Hỏng (DAMAGED)" value="DAMAGED" />
            <Picker.Item label="Đã thanh lý (DISPOSED)" value="DISPOSED" />
            <Picker.Item label="Chờ điều chuyển (TRANSFER_PENDING)" value="TRANSFER_PENDING" />
          </Picker>
        </View>

        <Text style={{ marginBottom: 4, fontWeight: '600' }}>Trạng thái cấp phát</Text>
        <View style={[styles.pickerContainer, { marginBottom: 16 }]}>
          <Picker selectedValue={filters.assignmentStatus} onValueChange={(v) => setFilters(prev => ({ ...prev, assignmentStatus: v }))}>
            <Picker.Item label="Tất cả" value="" />
            <Picker.Item label="Chờ xác nhận (PENDING_CONFIRMATION)" value="PENDING_CONFIRMATION" />
            <Picker.Item label="Đang hoạt động (ACTIVE)" value="ACTIVE" />
            <Picker.Item label="Đã yêu cầu trả (RETURN_REQUESTED)" value="RETURN_REQUESTED" />
          </Picker>
        </View>
      </ConfirmModal>

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
            Alert.alert('Thành công', 'Đã thu hồi tài sản');
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

      <ConfirmModal
        visible={damagedModalVisible}
        title="Xử lý tài sản hỏng"
        description={`Chọn hành động xử lý cho tài sản ${selectedAssetForDamaged?.name}`}
        confirmText="Xác nhận"
        confirmTone="primary"
        isLoading={revokeMutation.isPending}
        onConfirm={async () => {
          if (selectedAssetForDamaged) {
            try {
              await revokeMutation.mutateAsync({ assetId: selectedAssetForDamaged.id, payload: { note: damagedNote, targetAssetStatus: damagedAction, vendorName: damagedAction === 'MAINTENANCE' ? damagedVendorName : undefined, startedAt: damagedAction === 'MAINTENANCE' && damagedStartedAt ? new Date(damagedStartedAt).toISOString() : undefined } });
              Alert.alert('Thành công', 'Đã xử lý tài sản hỏng');
              setDamagedModalVisible(false);
            } catch (e: any) {
              Alert.alert('Lỗi', e.response?.data?.message || 'Không thể xử lý');
            }
          }
        }}
        onCancel={() => setDamagedModalVisible(false)}
      >
        <View style={{ marginBottom: 16 }}>
          <Pressable style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }} onPress={() => setDamagedAction('DAMAGED')}>
            <MaterialCommunityIcons name={damagedAction === 'DAMAGED' ? 'radiobox-marked' : 'radiobox-blank'} size={24} color={damagedAction === 'DAMAGED' ? '#111827' : '#98A0A8'} />
            <Text style={{ marginLeft: 8, fontSize: 16 }}>Thu hồi về kho</Text>
          </Pressable>
          <Pressable style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }} onPress={() => setDamagedAction('MAINTENANCE')}>
            <MaterialCommunityIcons name={damagedAction === 'MAINTENANCE' ? 'radiobox-marked' : 'radiobox-blank'} size={24} color={damagedAction === 'MAINTENANCE' ? '#111827' : '#98A0A8'} />
            <Text style={{ marginLeft: 8, fontSize: 16 }}>Chuyển đi sửa chữa</Text>
          </Pressable>
          <Pressable style={{ flexDirection: 'row', alignItems: 'center' }} onPress={() => setDamagedAction('DISPOSED')}>
            <MaterialCommunityIcons name={damagedAction === 'DISPOSED' ? 'radiobox-marked' : 'radiobox-blank'} size={24} color={damagedAction === 'DISPOSED' ? '#111827' : '#98A0A8'} />
            <Text style={{ marginLeft: 8, fontSize: 16 }}>Thanh lý</Text>
          </Pressable>
        </View>

        {damagedAction === 'MAINTENANCE' ? (
          <>
            <FormField
              label="Đơn vị sửa chữa"
              value={damagedVendorName}
              onChangeText={setDamagedVendorName}
              placeholder="Tên đơn vị, nơi sửa chữa..."
            />
            <FormField
              label="Ngày chuyển đi (YYYY-MM-DD)"
              value={damagedStartedAt}
              onChangeText={setDamagedStartedAt}
              placeholder="2023-12-01"
            />
            <FormField
              label="Ghi chú sửa chữa"
              value={damagedNote}
              onChangeText={setDamagedNote}
              placeholder="Chi tiết tình trạng hỏng..."
            />
          </>
        ) : damagedAction === 'DISPOSED' ? (
          <FormField
            label="Lý do thanh lý"
            value={damagedNote}
            onChangeText={setDamagedNote}
            placeholder="Nhập lý do thanh lý..."
          />
        ) : (
          <FormField
            label="Lý do thu hồi"
            value={damagedNote}
            onChangeText={setDamagedNote}
            placeholder="Nhập lý do thu hồi..."
          />
        )}
      </ConfirmModal>

      <SelectModal
        visible={assignModalVisible}
        title="Chọn nhân viên để giao"
        options={(employees?.items ?? []).map((emp) => ({
          id: emp.id,
          label: emp.profile?.fullName ?? emp.phone,
          subtitle: emp.userCode,
        }))}
        selectedValue={assignedUserId ?? ''}
        onSelect={async (option) => {
          setAssignedUserId(option.id);
          if (selectedAssetForAssign) {
            try {
              await assignMutation.mutateAsync({
                assetId: selectedAssetForAssign.id,
                payload: {
                  assignedToUserId: option.id,
                  conditionWhenAssigned: selectedAssetForAssign.conditionStatus,
                },
              });
              Alert.alert('Thành công', 'Đã giao tài sản');
              setAssignModalVisible(false);
            } catch (e: any) {
              Alert.alert('Lỗi', e.response?.data?.message || 'Không thể giao');
            }
          }
        }}
        onClose={() => setAssignModalVisible(false)}
      />

      <SelectModal
        visible={transferModalVisible}
        title="Chọn phòng ban điều chuyển"
        options={(allDepartments?.data?.items ?? []).filter(d => d.id !== departmentId).map(d => ({ id: d.id, label: d.name, subtitle: d.code }))}
        selectedValue={targetDepartmentId ?? ''}
        onSelect={async (option) => {
          setTargetDepartmentId(option.id);
          if (selectedAssetForTransfer) {
            try {
              await transferMutation.mutateAsync({ assetId: selectedAssetForTransfer.id, payload: { targetDepartmentId: option.id } });
              Alert.alert('Thành công', 'Đã điều chuyển tài sản');
              setTransferModalVisible(false);
            } catch (e: any) {
              Alert.alert('Lỗi', e.response?.data?.message || 'Không thể điều chuyển');
            }
          }
        }}
        onClose={() => setTransferModalVisible(false)}
      />
    </Screen>
  );
}

function AssetCard({ asset, employees, onPress, onRevoke, onAssign, onTransfer, onReportDamaged }: { asset: any, employees: any[], onPress: () => void, onRevoke: () => void, onAssign: () => void, onTransfer: () => void, onReportDamaged?: () => void }) {
  const router = useRouter();
  const requestReturn = useRequestAssetReturn();
  const [confirmAction, setConfirmAction] = useState<string | null>(null);

  const activeAssignment = asset.assetStatus === 'IN_STOCK'
    ? null
    : asset.assignments?.find((a: any) => 
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
              <Text style={styles.assetDetailText}>Người giữ: {activeAssignment ? assigneeName : 'Chưa giao (Trống)'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.assetActionsTeal}>
          <Pressable style={styles.actionBtnTeal} onPress={() => router.push(`/admin/assets/${asset.id}/edit` as never)}>
            <MaterialCommunityIcons name="pencil-outline" size={18} color="#111827" />
            <Text style={styles.actionBtnTealText}>Sửa</Text>
          </Pressable>
          {asset.assetStatus === 'IN_STOCK' ? (
            <>
              <Pressable style={styles.actionBtnTeal} onPress={onAssign}>
                <MaterialCommunityIcons name="rocket-launch-outline" size={18} color="#111827" />
                <Text style={styles.actionBtnTealText}>Giao</Text>
              </Pressable>
              <Pressable style={styles.actionBtnTeal} onPress={onTransfer}>
                <MaterialCommunityIcons name="swap-horizontal" size={18} color="#111827" />
                <Text style={styles.actionBtnTealText}>Chuyển</Text>
              </Pressable>
            </>
          ) : activeAssignment ? (
            <>
              <Pressable style={[styles.actionBtnTeal, { borderColor: colors.danger }]} onPress={onRevoke}>
                <MaterialCommunityIcons name="account-arrow-left-outline" size={18} color={colors.danger} />
                <Text style={[styles.actionBtnTealText, { color: colors.danger }]}>Thu hồi</Text>
              </Pressable>
              {onReportDamaged && (
                <Pressable style={[styles.actionBtnTeal, { borderColor: colors.warning }]} onPress={onReportDamaged}>
                  <MaterialCommunityIcons name="alert-outline" size={18} color={colors.warning} />
                  <Text style={[styles.actionBtnTealText, { color: colors.warning }]}>Hỏng</Text>
                </Pressable>
              )}
            </>
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
  sectionLabelHeader: { fontSize: 16, fontWeight: '700', color: colors.text, marginHorizontal: spacing.md, marginTop: spacing.md, marginBottom: spacing.sm },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: spacing.md, marginTop: spacing.lg, marginBottom: spacing.md },
  countBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, gap: 4 },
  countBadgeText: { color: '#111827', fontSize: 13, fontWeight: '600' },
  pickerContainer: { marginHorizontal: spacing.md },
  searchDropdown: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFF' },
  searchDropdownText: { fontSize: 14 },
  popularDeptCard: { backgroundColor: '#FFF', padding: 16, marginHorizontal: spacing.md, marginBottom: 12, borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  deptCardTop: { flexDirection: 'row', alignItems: 'center' },
  popularDeptCardSelected: { borderColor: '#111827', backgroundColor: '#F9FAFB' },
  popularDeptIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginRight: spacing.md },
  popularDeptInfo: { flex: 1 },
  popularDeptName: { fontSize: 16, fontWeight: '700', color: '#111827' },
  popularDeptDesc: { fontSize: 13, color: '#64748B', marginTop: 2 },
  deptStatsRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 12, padding: 12, marginTop: 16, gap: 12 },
  deptStatItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  deptStatTextCol: {},
  deptStatValue: { fontSize: 14, fontWeight: '700', color: '#111827' },
  deptStatLabel: { fontSize: 11, color: '#64748B' },
  deptStatDivider: { width: 1, height: 24, backgroundColor: '#E2E8F0' },
  historyBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  bannerCard: { flexDirection: 'row', backgroundColor: '#FFF', marginHorizontal: spacing.md, marginTop: 8, marginBottom: spacing.lg, borderRadius: 16, padding: 20, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3 },
  bannerIconBox: { width: 56, height: 56, borderRadius: 16, backgroundColor: '#111827', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  bannerTextContainer: { flex: 1, zIndex: 1 },
  bannerTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 4 },
  bannerSubtitle: { fontSize: 13, color: '#64748B', lineHeight: 18 },
  bannerImage: { position: 'absolute', right: -10, top: 10, opacity: 0.5 },
  tipCard: { flexDirection: 'row', backgroundColor: '#F9FAFB', marginHorizontal: spacing.md, marginTop: spacing.md, marginBottom: spacing.xl, padding: 16, borderRadius: 12, alignItems: 'flex-start' },
  tipTextContainer: { flex: 1, marginHorizontal: 12 },
  tipTitle: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 2 },
  tipDesc: { fontSize: 13, color: '#64748B', lineHeight: 18 },
  bottomBar: { padding: spacing.lg, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  continueButton: { backgroundColor: '#111827', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  continueButtonDisabled: { backgroundColor: '#D1D5DB' },
  continueButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  createAssetButton: { backgroundColor: '#111827', borderRadius: 12, paddingVertical: 16, marginHorizontal: spacing.lg, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: spacing.md },
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
  actionBtnTeal: { flex: 1, minWidth: '25%', paddingVertical: 8, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#111827', borderRadius: 8 },
  actionBtnTealText: { color: '#111827', fontSize: 14, fontWeight: '600', marginLeft: 4 },
  searchBarContainerDept: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 12, marginHorizontal: spacing.md, backgroundColor: '#F8FAFC', marginBottom: spacing.md },
  searchInputDept: { flex: 1, marginLeft: 12, fontSize: 15, color: '#334155' },
});
