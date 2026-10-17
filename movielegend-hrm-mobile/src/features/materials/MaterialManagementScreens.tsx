import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useAppAlert } from '../../contexts/AlertContext';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
  TextInput,
  Image,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import { Picker } from '@react-native-picker/picker';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { SectionCard } from '../../components/SectionCard';
import {
  useAssetDepartments,
  useAssets,
  useAssignAsset,
  useTransferAsset,
  useRequestAssetReturn,
  useRevokeAsset,
} from '../../hooks/useAssets';
import { useDepartments } from '../../hooks/useDepartments';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ConfirmModal } from '../../components/ConfirmModal';
import { SelectModal } from '../../components/SelectModal';
import { FormField } from '../../components/FormField';
import { useEmployees } from '../../hooks/useEmployees';

export function AssetDepartmentListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: departments, isLoading, isError, error, refetch, isRefetching } = useAssetDepartments({ search: searchQuery });

  const filteredDepartments = departments?.items || [];

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#102739" />

      {/* Navy Header */}
      <View style={[styles.navyHeader, { paddingTop: Math.max(insets.top, 16) }]}>
        <View style={styles.headerTitleRow}>
          {router.canGoBack() && (
            <Pressable onPress={() => router.back()} style={styles.headerBackBtn}>
              <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
            </Pressable>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Vật tư</Text>
            <Text style={styles.headerSubtitle}>Chọn phòng ban làm việc</Text>
          </View>
          <Pressable style={styles.headerCircleBtn}>
            <MaterialCommunityIcons name="history" size={20} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>

      {/* Content Sheet with curved top */}
      <View style={styles.sheetContainer}>
        <ScrollView
          contentContainerStyle={styles.sheetScrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} />}
        >
          {/* Section: Tìm phòng ban */}
          <Text style={styles.sectionHeading}>Tìm phòng ban</Text>
          <View style={styles.searchBox}>
            <MaterialCommunityIcons name="magnify" size={22} color="#94A3B8" />
            <TextInput
              style={styles.searchBoxInput}
              placeholder="Nhập tên phòng ban..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Section: Danh sách phòng ban */}
          <View style={styles.deptSectionRow}>
            <Text style={styles.sectionHeading}>Danh sách phòng ban</Text>
            <View style={styles.unitBadge}>
              <MaterialCommunityIcons name="office-building" size={14} color="#0F172A" />
              <Text style={styles.unitBadgeText}>{filteredDepartments.length} đơn vị</Text>
            </View>
          </View>

          {isLoading ? <LoadingState /> : null}
          {isError ? <ErrorState error={error} onRetry={() => void refetch()} /> : null}

          {filteredDepartments.map((dept: any) => {
            const branchName = dept.branch?.name || 'MOVIELEGEND-HÀ NỘI';
            return (
              <Pressable
                key={dept.id}
                onPress={() => router.push(`/admin/materials/department/${dept.id}` as never)}
                style={({ pressed }) => [
                  styles.deptCard,
                  pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] },
                ]}
              >
                {/* Card Top: Icon, Department name, branch, chevron */}
                <View style={styles.deptCardTop}>
                  <View style={styles.deptIconBox}>
                    <MaterialCommunityIcons name="office-building" size={24} color="#102739" />
                  </View>
                  <View style={styles.deptInfoBox}>
                    <Text style={styles.deptNameText}>{dept.name}</Text>
                    <Text style={styles.deptBranchText}>{branchName.toUpperCase()}</Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={22} color="#94A3B8" />
                </View>

                {/* Card Bottom: 3 Stats */}
                <View style={styles.deptStatsContainer}>
                  {/* Stat 1: Vật tư */}
                  <View style={styles.deptStatItem}>
                    <MaterialCommunityIcons name="cube-outline" size={22} color="#334155" />
                    <View style={styles.deptStatTexts}>
                      <Text style={styles.deptStatNumber}>{dept.materialCount || 0}</Text>
                      <Text style={styles.deptStatLabel}>Vật tư</Text>
                    </View>
                  </View>

                  <View style={styles.deptStatDivider} />

                  {/* Stat 2: Yêu cầu */}
                  <View style={styles.deptStatItem}>
                    <MaterialCommunityIcons name="clipboard-text-outline" size={22} color="#334155" />
                    <View style={styles.deptStatTexts}>
                      <Text style={styles.deptStatNumber}>{dept.requestCount || 0}</Text>
                      <Text style={styles.deptStatLabel}>Yêu cầu</Text>
                    </View>
                  </View>

                  <View style={styles.deptStatDivider} />

                  {/* Stat 3: Sắp hết */}
                  <View style={styles.deptStatItem}>
                    <MaterialCommunityIcons name="alert-outline" size={22} color="#334155" />
                    <View style={styles.deptStatTexts}>
                      <Text style={styles.deptStatNumber}>{dept.lowStockCount || 0}</Text>
                      <Text style={styles.deptStatLabel}>Sắp hết</Text>
                    </View>
                  </View>
                </View>
              </Pressable>
            );
          })}

          {filteredDepartments.length === 0 && !isLoading ? (
            <EmptyState title="Không tìm thấy phòng ban nào" />
          ) : null}
        </ScrollView>
      </View>
    </View>
  );
}

export function AssetDepartmentScreen() {
  const { id: departmentId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: departments } = useDepartments();
  const department = departments?.items.find((d) => d.id === departmentId);
  const { data: assetsData, isLoading, isError, error, refetch, isRefetching } = useAssets();
  const { showAlert } = useAppAlert();

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

  const branchName = (department as any)?.branch?.name || 'MOVIELEGEND-HÀ NỘI';
  const subtitleDept = `${department?.name || 'DEV'} (${branchName})`.toUpperCase();

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#102739" />

      {/* Navy Header */}
      <View style={[styles.navyHeader, { paddingTop: Math.max(insets.top, 16) }]}>
        <View style={styles.headerTitleRow}>
          <Pressable onPress={() => router.back()} style={styles.headerBackBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Danh sách vật tư</Text>
            <Text style={styles.headerSubtitle}>{subtitleDept}</Text>
          </View>
        </View>
      </View>

      {/* Content Sheet with curved top */}
      <View style={styles.sheetContainer}>
        <ScrollView
          contentContainerStyle={styles.sheetScrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} />}
        >
          {/* Top Actions: [+ Tạo vật tư mới] & [Bộ lọc] */}
          <View style={styles.actionButtonsRow}>
            <Pressable
              style={styles.createBtnNavy}
              onPress={() => router.push(`/admin/assets/create?departmentId=${departmentId}` as never)}
            >
              <MaterialCommunityIcons name="plus" size={22} color="#FFFFFF" />
              <Text style={styles.createBtnNavyText}>Tạo vật tư mới</Text>
            </Pressable>

            <Pressable
              style={styles.filterBtnOutline}
              onPress={() => setFilterModalVisible(true)}
            >
              <MaterialCommunityIcons name="filter-variant" size={20} color="#0F172A" />
              <Text style={styles.filterBtnOutlineText}>Bộ lọc</Text>
            </Pressable>
          </View>

          {/* List count header */}
          <Text style={styles.listCountHeader}>Danh sách ({filteredAssets.length} vật tư)</Text>

          {isLoading ? <LoadingState /> : null}
          {isError ? <ErrorState error={error} onRetry={() => void refetch()} /> : null}

          {/* List or Custom Empty State */}
          {!isLoading && filteredAssets.length > 0 ? (
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
            </View>
          ) : !isLoading && filteredAssets.length === 0 ? (
            <View style={styles.customEmptyContainer}>
              <View style={styles.customEmptyIllustration}>
                <Svg width={180} height={140} viewBox="0 0 180 140" fill="none">
                  {/* Soft circular aura */}
                  <Circle cx="90" cy="70" r="54" fill="#EBF3FA" />
                  <Circle cx="146" cy="52" r="3.5" fill="#BFDBFE" />
                  <Circle cx="34" cy="78" r="2.5" fill="#BFDBFE" />
                  <Circle cx="152" cy="84" r="2" fill="#CBD5E1" />
                  <Path d="M46 64H52" stroke="#93C5FD" strokeWidth="2" strokeLinecap="round" />
                  <Path d="M132 76H138" stroke="#93C5FD" strokeWidth="2" strokeLinecap="round" />

                  {/* Cardboard Box Body */}
                  <Path
                    d="M55 60 L90 76 L125 60 L125 96 L90 114 L55 96 Z"
                    fill="#FFFFFF"
                    stroke="#102739"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                  {/* Box Center seam */}
                  <Path
                    d="M90 76 L90 114"
                    stroke="#102739"
                    strokeWidth="2"
                  />
                  {/* Left flap */}
                  <Path
                    d="M55 60 L45 52 L78 40 L90 48 Z"
                    fill="#FFFFFF"
                    stroke="#102739"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                  {/* Right flap */}
                  <Path
                    d="M90 48 L102 40 L135 52 L125 60 Z"
                    fill="#FFFFFF"
                    stroke="#102739"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                  {/* Back flap */}
                  <Path
                    d="M78 40 L90 32 L102 40 L90 48 Z"
                    fill="#F8FAFC"
                    stroke="#102739"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />

                  {/* Magnifying Glass */}
                  <Path
                    d="M120 80 L142 102"
                    stroke="#102739"
                    strokeWidth="5"
                    strokeLinecap="round"
                  />
                  <Circle
                    cx="110"
                    cy="70"
                    r="17"
                    fill="#EFF6FF"
                    stroke="#102739"
                    strokeWidth="3"
                  />
                  {/* Glass subtle highlight curve */}
                  <Path
                    d="M102 65 C104 61 109 59 114 60"
                    stroke="#60A5FA"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </Svg>
              </View>
              <Text style={styles.customEmptyTitle}>Không có vật tư nào khớp với bộ lọc</Text>
              <Text style={styles.customEmptySubtitle}>Thử điều chỉnh bộ lọc để tìm kiếm lại.</Text>
            </View>
          ) : null}
        </ScrollView>
      </View>

      {/* Modals */}
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
            showAlert('Thành công', 'Đã thu hồi tài sản');
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
              await revokeMutation.mutateAsync({
                assetId: selectedAssetForDamaged.id,
                payload: {
                  note: damagedNote,
                  targetAssetStatus: damagedAction,
                  vendorName: damagedAction === 'MAINTENANCE' ? damagedVendorName : undefined,
                  startedAt: damagedAction === 'MAINTENANCE' && damagedStartedAt ? new Date(damagedStartedAt).toISOString() : undefined,
                },
              });
              showAlert('Thành công', 'Đã xử lý tài sản hỏng');
              setDamagedModalVisible(false);
            } catch (e: any) {
              showAlert('Lỗi', e.response?.data?.message || 'Không thể xử lý');
            }
          }
        }}
        onCancel={() => setDamagedModalVisible(false)}
      >
        <View style={{ marginBottom: 16 }}>
          <Pressable style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }} onPress={() => setDamagedAction('DAMAGED')}>
            <MaterialCommunityIcons name={damagedAction === 'DAMAGED' ? 'radiobox-marked' : 'radiobox-blank'} size={24} color={damagedAction === 'DAMAGED' ? '#102739' : '#98A0A8'} />
            <Text style={{ marginLeft: 8, fontSize: 16 }}>Thu hồi về kho</Text>
          </Pressable>
          <Pressable style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }} onPress={() => setDamagedAction('MAINTENANCE')}>
            <MaterialCommunityIcons name={damagedAction === 'MAINTENANCE' ? 'radiobox-marked' : 'radiobox-blank'} size={24} color={damagedAction === 'MAINTENANCE' ? '#102739' : '#98A0A8'} />
            <Text style={{ marginLeft: 8, fontSize: 16 }}>Chuyển đi sửa chữa</Text>
          </Pressable>
          <Pressable style={{ flexDirection: 'row', alignItems: 'center' }} onPress={() => setDamagedAction('DISPOSED')}>
            <MaterialCommunityIcons name={damagedAction === 'DISPOSED' ? 'radiobox-marked' : 'radiobox-blank'} size={24} color={damagedAction === 'DISPOSED' ? '#102739' : '#98A0A8'} />
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
              showAlert('Thành công', 'Đã giao tài sản');
              setAssignModalVisible(false);
            } catch (e: any) {
              showAlert('Lỗi', e.response?.data?.message || 'Không thể giao');
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
              showAlert('Thành công', 'Đã điều chuyển tài sản');
              setTransferModalVisible(false);
            } catch (e: any) {
              showAlert('Lỗi', e.response?.data?.message || 'Không thể điều chuyển');
            }
          }
        }}
        onClose={() => setTransferModalVisible(false)}
      />
    </View>
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
            <MaterialCommunityIcons name="pencil-outline" size={18} color="#102739" />
            <Text style={styles.actionBtnTealText}>Sửa</Text>
          </Pressable>
          {asset.assetStatus === 'IN_STOCK' ? (
            <>
              <Pressable style={styles.actionBtnTeal} onPress={onAssign}>
                <MaterialCommunityIcons name="rocket-launch-outline" size={18} color="#102739" />
                <Text style={styles.actionBtnTealText}>Giao</Text>
              </Pressable>
              <Pressable style={styles.actionBtnTeal} onPress={onTransfer}>
                <MaterialCommunityIcons name="swap-horizontal" size={18} color="#102739" />
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
  mainContainer: {
    flex: 1,
    backgroundColor: '#102739',
  },
  navyHeader: {
    backgroundColor: '#102739',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBackBtn: {
    marginRight: 14,
    padding: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 3,
  },
  headerCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  sheetScrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 20,
  },
  searchBoxInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#0F172A',
  },
  deptSectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  unitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    gap: 6,
  },
  unitBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  deptCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  deptCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deptIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#E7F0F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  deptInfoBox: {
    flex: 1,
  },
  deptNameText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  deptBranchText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 3,
    letterSpacing: 0.3,
  },
  deptStatsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginTop: 14,
  },
  deptStatItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deptStatTexts: {
    marginLeft: 8,
  },
  deptStatNumber: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  deptStatLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  deptStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  createBtnNavy: {
    flex: 1,
    height: 48,
    backgroundColor: '#102739',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  createBtnNavyText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  filterBtnOutline: {
    height: 48,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  filterBtnOutlineText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  listCountHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 12,
  },
  customEmptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 50,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  customEmptyIllustration: {
    marginBottom: 24,
  },
  customEmptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
  },
  customEmptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
  list: {
    gap: spacing.md,
  },
  assetCard: {
    padding: spacing.md,
  },
  assetContentRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  assetThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
    backgroundColor: '#F3F4F6',
  },
  assetThumbnailPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  assetInfo: {
    flex: 1,
  },
  assetTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  assetName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  statusBadgeOutline: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
  },
  statusTextOutline: {
    fontSize: 10,
    fontWeight: '600',
  },
  assetCode: {
    fontSize: 13,
    color: colors.muted,
  },
  assetDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  assetDetailText: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 4,
  },
  assetActionsTeal: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  actionBtnTeal: {
    flex: 1,
    minWidth: '25%',
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#102739',
    borderRadius: 8,
  },
  actionBtnTealText: {
    color: '#102739',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  pickerContainer: {
    marginHorizontal: spacing.md,
  },
});
