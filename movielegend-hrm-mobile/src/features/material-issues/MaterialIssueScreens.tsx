import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Circle, Path } from 'react-native-svg';

import { useAuth } from '../../providers/AuthProvider';
import { useAppAlert } from '../../contexts/AlertContext';
import {
  useMaterialIssues,
  useMaterialIssue,
  useCreateMaterialIssue,
  useMaterialIssueAction,
} from '../../hooks/useStockOperations';
import { useWarehouses } from '../../hooks/useWarehouses';
import { useMaterials } from '../../hooks/useMaterials';
import { useDepartments } from '../../hooks/useDepartments';
import { useEmployees } from '../../hooks/useEmployees';
import { SelectModal, SelectOption } from '../../components/SelectModal';
import { StatusBadge } from '../../components/StatusBadge';
import { formatDateTime } from '../../utils/date-time';
import { formatQuantity } from '../../utils/quantity';
import { hasPermission, hasAnyPermission } from '../../utils/permissions';
import { mapWarehouseAssetError } from '../assets/asset.logic';
import { availableIssueActions, issueStatusTone } from './issue.logic';
import type { MaterialIssueTargetType } from '../../types/stock.types';

export type OperationArea = 'employee' | 'leader' | 'warehouse' | 'admin';

function baseFor(area: OperationArea): string {
  if (area === 'warehouse') return '/warehouse-manager';
  return `/${area}`;
}

function translateStatus(status: string) {
  if (status === 'PENDING') return 'Chờ duyệt';
  if (status === 'APPROVED') return 'Đã duyệt';
  if (status === 'ISSUED') return 'Đã xuất';
  if (status === 'REJECTED') return 'Từ chối';
  if (status === 'CANCELLED') return 'Đã hủy';
  return status;
}

function translateTarget(type: string) {
  if (type === 'DEPARTMENT') return 'Phòng ban';
  if (type === 'USER') return 'Cá nhân';
  return type;
}

// =================================================================
// 1. ILLUSTRATION EMPTY STATE (Clipboard + 3D Package Box)
// =================================================================
function EmptyVttbIllustration() {
  return (
    <View style={styles.illustrationWrap}>
      <Svg width={180} height={150} viewBox="0 0 180 150" fill="none">
        {/* Soft pastel blue circle glow */}
        <Circle cx={85} cy={75} r={58} fill="#E0F2FE" opacity={0.65} />

        {/* Clipboard board */}
        <Path
          d="M48 30C48 25.58 51.58 22 56 22H114C118.42 22 122 25.58 122 30V118C122 122.42 118.42 126 114 126H56C51.58 126 48 122.42 48 118V30Z"
          fill="#FFFFFF"
          stroke="#93C5FD"
          strokeWidth={3}
        />
        {/* Clipboard top clip */}
        <Path
          d="M72 18C72 15 74.5 13 78 13H92C95.5 13 98 15 98 18V24H72V18Z"
          fill="#3B82F6"
        />
        <Circle cx={85} cy={18} r={2.5} fill="#FFFFFF" />

        {/* Paper lines on clipboard */}
        <Path d="M60 42H110" stroke="#93C5FD" strokeWidth={3.5} strokeLinecap="round" />
        <Path d="M60 54H110" stroke="#93C5FD" strokeWidth={3.5} strokeLinecap="round" />
        <Path d="M60 66H96" stroke="#93C5FD" strokeWidth={3.5} strokeLinecap="round" />
        <Path d="M60 78H82" stroke="#93C5FD" strokeWidth={3.5} strokeLinecap="round" />

        {/* Decorative sparkles */}
        <Path d="M136 44L140 38" stroke="#93C5FD" strokeWidth={2.5} strokeLinecap="round" />
        <Path d="M144 52L150 50" stroke="#93C5FD" strokeWidth={2.5} strokeLinecap="round" />

        {/* 3D Isometric Cardboard Box in front */}
        {/* Box Top */}
        <Path
          d="M125 72L158 88L125 102L94 88L125 72Z"
          fill="#BFDBFE"
          stroke="#3B82F6"
          strokeWidth={2.5}
          strokeLinejoin="round"
        />
        {/* Box Left */}
        <Path
          d="M94 88L125 102V136L94 122V88Z"
          fill="#93C5FD"
          stroke="#3B82F6"
          strokeWidth={2.5}
          strokeLinejoin="round"
        />
        {/* Box Right */}
        <Path
          d="M125 102L158 88V122L125 136V102Z"
          fill="#60A5FA"
          stroke="#3B82F6"
          strokeWidth={2.5}
          strokeLinejoin="round"
        />
        {/* Box Tape line */}
        <Path
          d="M110 80L141 95"
          stroke="#FFFFFF"
          strokeWidth={3}
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}

// =================================================================
// 2. SCREEN 1: DANH SÁCH YÊU CẦU VTTB (Matching Template Left)
// =================================================================
export function MaterialIssueListScreen({ area }: { area: OperationArea }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const canRead = hasPermission(user, 'material_issue.read');
  const issues = useMaterialIssues(canRead);
  const warehouses = useWarehouses();
  const departments = useDepartments({ page: 1, limit: 100 });
  const base = baseFor(area);

  const issueItems = issues.data?.items ?? [];
  const count = issueItems.length;
  const warehouseItems = warehouses.data?.items ?? [];
  const departmentItems = departments.data?.items ?? [];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#102739" />

      {/* Header Dark Navy #102739 */}
      <View style={[styles.navyHeader, { paddingTop: Math.max(insets.top, 16) + 4 }]}>
        <View style={styles.headerRow}>
          {router.canGoBack() && (
            <Pressable
              onPress={() => router.back()}
              style={styles.backButton}
              hitSlop={10}
              accessibilityLabel="Quay lại"
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </Pressable>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Danh sách yêu cầu VTTB</Text>
            <Text style={styles.headerSubtitle}>Quản lý cấp phát tài sản, vật tư</Text>
          </View>
        </View>
      </View>

      {/* Curved Sheet */}
      <ScrollView
        style={styles.sheetContainer}
        contentContainerStyle={[
          styles.sheetScrollContent,
          { paddingBottom: Math.max(insets.bottom, 24) + 40 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={issues.isRefetching}
            onRefresh={() => void issues.refetch()}
            tintColor="#0284C7"
          />
        }
      >
        {/* Main Card: Danh sách yêu cầu */}
        <View style={styles.mainCard}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardHeaderTitle}>Danh sách yêu cầu</Text>
            <View style={styles.badgePill}>
              <Text style={styles.badgePillText}>{count}</Text>
            </View>
          </View>

          {issues.isLoading ? (
            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
              <ActivityIndicator size="small" color="#0284C7" />
              <Text style={{ fontSize: 13, color: '#94A3B8', marginTop: 10 }}>
                Đang tải danh sách yêu cầu...
              </Text>
            </View>
          ) : count === 0 ? (
            /* Empty State matching Template */
            <View style={styles.emptyContainer}>
              <EmptyVttbIllustration />
              <Text style={styles.emptyTitle}>Chưa có yêu cầu VTTB nào</Text>
              <Text style={styles.emptySubtitle}>
                Tạo yêu cầu để đề xuất cấp phát tài sản, vật tư.
              </Text>

              {hasAnyPermission(user, ['material_issue.create', 'stock.export']) ? (
                <Pressable
                  onPress={() => router.push(`${base}/material-issues/create` as never)}
                  style={({ pressed }) => [
                    styles.primaryDarkBtn,
                    pressed && { opacity: 0.9, transform: [{ scale: 0.985 }] },
                  ]}
                >
                  <Text style={styles.primaryDarkBtnText}>+ Tạo yêu cầu mới</Text>
                </Pressable>
              ) : null}
            </View>
          ) : (
            /* Items List */
            <View style={{ marginTop: 14, gap: 12 }}>
              {hasAnyPermission(user, ['material_issue.create', 'stock.export']) ? (
                <Pressable
                  onPress={() => router.push(`${base}/material-issues/create` as never)}
                  style={({ pressed }) => [
                    styles.primaryDarkBtn,
                    { marginBottom: 8 },
                    pressed && { opacity: 0.9, transform: [{ scale: 0.985 }] },
                  ]}
                >
                  <Text style={styles.primaryDarkBtnText}>+ Tạo yêu cầu mới</Text>
                </Pressable>
              ) : null}

              {issueItems.map((issue) => (
                <Pressable
                  key={issue.id}
                  onPress={() => router.push(`${base}/material-issues/${issue.id}` as never)}
                  style={({ pressed }) => [
                    styles.issueItemCard,
                    pressed && { backgroundColor: '#F8FAFC' },
                  ]}
                >
                  <View style={styles.issueItemTop}>
                    <Text style={styles.issueItemCode}>
                      Mã YC: {issue.issueCode}
                    </Text>
                    <StatusBadge
                      label={translateStatus(issue.status)}
                      tone={issueStatusTone(issue.status)}
                    />
                  </View>

                  <View style={styles.issueItemMetaRow}>
                    <MaterialCommunityIcons name="storefront-outline" size={16} color="#64748B" />
                    <Text style={styles.issueItemMetaText} numberOfLines={1}>
                      Kho xuất: {warehouseItems.find((w) => w.id === issue.warehouseId)?.name ?? issue.warehouseId}
                    </Text>
                  </View>

                  <View style={styles.issueItemMetaRow}>
                    <Ionicons
                      name={issue.issueTargetType === 'DEPARTMENT' ? 'people-outline' : 'person-outline'}
                      size={16}
                      color="#64748B"
                    />
                    <Text style={styles.issueItemMetaText} numberOfLines={1}>
                      Cấp phát cho: {translateTarget(issue.issueTargetType)}
                      {issue.issuedToDepartmentId
                        ? ` (${departmentItems.find((d) => d.id === issue.issuedToDepartmentId)?.name || 'Phòng ban'})`
                        : ''}
                    </Text>
                  </View>

                  {issue.createdAt ? (
                    <View style={styles.issueItemMetaRow}>
                      <Ionicons name="calendar-outline" size={16} color="#64748B" />
                      <Text style={styles.issueItemMetaText}>
                        {formatDateTime(issue.createdAt)}
                      </Text>
                    </View>
                  ) : null}

                  <View style={styles.issueItemActionRow}>
                    <Text style={styles.viewDetailText}>Xem chi tiết</Text>
                    <Ionicons name="chevron-forward" size={14} color="#0284C7" />
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// =================================================================
// 3. SCREEN 2: TẠO YÊU CẦU VTTB (Matching Template Right)
// =================================================================
export function MaterialIssueCreateScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { showAlert } = useAppAlert();

  const create = useCreateMaterialIssue();
  const warehouses = useWarehouses();
  const materials = useMaterials();
  const departments = useDepartments({ page: 1, limit: 100 });
  const employees = useEmployees({ limit: 100 });

  // Form States
  const [warehouseId, setWarehouseId] = useState('');
  const [issueTargetType, setIssueTargetType] = useState<MaterialIssueTargetType>('DEPARTMENT');
  const [issuedToDepartmentId, setIssuedToDepartmentId] = useState(() => user?.department?.id || '');
  const [issuedToUserId, setIssuedToUserId] = useState(() => user?.id || '');
  const [note, setNote] = useState('');

  // Selected Material & Quantity
  const [selectedMaterialId, setSelectedMaterialId] = useState('');
  const [quantityStr, setQuantityStr] = useState('0');

  // Modals for Selection
  const [showWarehouseModal, setShowWarehouseModal] = useState(false);
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [showMaterialModal, setShowMaterialModal] = useState(false);

  // Picked entities
  const warehouseItems = warehouses.data?.items ?? [];
  const materialItems = materials.data?.items ?? [];
  const deptItems = departments.data?.items ?? [];
  const employeeItems = employees.data?.items ?? [];

  const selectedWarehouse = useMemo(
    () => warehouseItems.find((w) => w.id === warehouseId),
    [warehouseItems, warehouseId]
  );

  const selectedDept = useMemo(
    () => deptItems.find((d) => d.id === issuedToDepartmentId),
    [deptItems, issuedToDepartmentId]
  );

  const selectedEmployee = useMemo(
    () => employeeItems.find((e) => e.id === issuedToUserId),
    [employeeItems, issuedToUserId]
  );

  const selectedMaterial = useMemo(
    () => materialItems.find((m) => m.id === selectedMaterialId),
    [materialItems, selectedMaterialId]
  );

  // Target select label
  const targetLabel = useMemo(() => {
    if (issueTargetType === 'DEPARTMENT') {
      if (selectedDept) {
        return `${selectedDept.name} (${selectedDept.branch?.name || 'MOVIELEGEND-HÀ NỘI'})`;
      }
      if (user?.department?.name) {
        return `${user.department.name} (${user.department.branch?.name || 'MOVIELEGEND-HÀ NỘI'})`;
      }
      return 'Chọn phòng ban';
    } else {
      if (selectedEmployee) {
        const empName = selectedEmployee.profile?.fullName || selectedEmployee.userCode || 'Nhân viên';
        return `${empName} (${selectedEmployee.userCode || 'NV'})`;
      }
      if (user?.fullName) {
        return `${user.fullName} (${user.userCode || 'NV'})`;
      }
      return 'Chọn cá nhân nhận';
    }
  }, [issueTargetType, selectedDept, selectedEmployee, user]);

  // Options for SelectModal
  const warehouseOptions: SelectOption[] = useMemo(
    () =>
      warehouseItems.map((w) => ({
        id: w.id,
        value: w.id,
        label: w.name,
        subtitle: `Mã kho: ${w.code}`,
      })),
    [warehouseItems]
  );

  const departmentOptions: SelectOption[] = useMemo(
    () =>
      deptItems.map((d) => ({
        id: d.id,
        value: d.id,
        label: d.name,
        subtitle: d.branch?.name ? `Chi nhánh: ${d.branch.name}` : undefined,
      })),
    [deptItems]
  );

  const employeeOptions: SelectOption[] = useMemo(
    () =>
      employeeItems.map((e) => {
        const name = e.profile?.fullName || e.userCode || 'Nhân viên';
        const dept = e.departmentLinks?.[0]?.department?.name || 'Phòng ban';
        return {
          id: e.id,
          value: e.id,
          label: name,
          subtitle: `Mã NV: ${e.userCode || 'NV'} • ${dept}`,
        };
      }),
    [employeeItems]
  );

  const materialOptions: SelectOption[] = useMemo(
    () =>
      materialItems.map((m) => ({
        id: m.id,
        value: m.id,
        label: m.name,
        subtitle: `Mã VT: ${m.materialCode || ''} • ĐVT: ${m.unit || 'cái'}`,
      })),
    [materialItems]
  );

  // Submit Handler
  async function submit() {
    if (!warehouseId) {
      showAlert('Thiếu thông tin', 'Vui lòng chọn kho xuất.');
      return;
    }
    if (issueTargetType === 'DEPARTMENT' && !issuedToDepartmentId) {
      showAlert('Thiếu thông tin', 'Vui lòng chọn phòng ban nhận.');
      return;
    }
    if (issueTargetType === 'USER' && !issuedToUserId) {
      showAlert('Thiếu thông tin', 'Vui lòng chọn cá nhân nhận.');
      return;
    }
    if (!selectedMaterialId) {
      showAlert('Thiếu thông tin', 'Vui lòng chọn vật tư cần cấp phát.');
      return;
    }
    const qty = parseFloat(quantityStr);
    if (isNaN(qty) || qty <= 0) {
      showAlert('Số lượng không hợp lệ', 'Số lượng vật tư phải lớn hơn 0.');
      return;
    }

    try {
      await create.mutateAsync({
        warehouseId,
        issueTargetType,
        ...(issueTargetType === 'DEPARTMENT' ? { issuedToDepartmentId } : { issuedToUserId }),
        ...(note.trim() ? { note: note.trim() } : {}),
        items: [{ materialId: selectedMaterialId, quantity: qty }],
      });
      showAlert('Thành công', 'Đã tạo yêu cầu VTTB thành công.', () => router.back());
    } catch (error) {
      const mapped = mapWarehouseAssetError(error);
      showAlert(mapped.code, mapped.message);
    }
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#102739" />

      {/* Header Dark Navy #102739 */}
      <View style={[styles.navyHeader, { paddingTop: Math.max(insets.top, 16) + 4 }]}>
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={10}
            accessibilityLabel="Quay lại"
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </Pressable>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.headerTitle}>Tạo yêu cầu VTTB</Text>
            <Text style={styles.headerSubtitle}>Chọn kho xuất và vật tư cần cấp phát</Text>
          </View>
        </View>
      </View>

      {/* Curved Sheet Scroll */}
      <ScrollView
        style={styles.sheetContainer}
        contentContainerStyle={[
          styles.sheetScrollContent,
          { paddingBottom: Math.max(insets.bottom, 24) + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Card 1: Kho xuất */}
        <View style={styles.formCard}>
          <Text style={styles.formCardTitle}>Kho xuất</Text>
          <Pressable
            onPress={() => setShowWarehouseModal(true)}
            style={styles.selectDropdownBtn}
          >
            <MaterialCommunityIcons name="storefront-outline" size={20} color="#0F172A" />
            <Text
              style={[
                styles.selectDropdownText,
                !selectedWarehouse && { color: '#94A3B8' },
              ]}
              numberOfLines={1}
            >
              {selectedWarehouse?.name || 'Chọn kho xuất'}
            </Text>
            <Ionicons name="chevron-down" size={18} color="#64748B" />
          </Pressable>
        </View>

        {/* Card 2: Cấp phát cho */}
        <View style={styles.formCard}>
          <Text style={styles.formCardTitle}>Cấp phát cho</Text>

          {/* Segmented Buttons */}
          <View style={styles.segmentedRow}>
            <Pressable
              onPress={() => setIssueTargetType('DEPARTMENT')}
              style={[
                styles.segmentBtn,
                issueTargetType === 'DEPARTMENT' && styles.segmentBtnActive,
              ]}
            >
              <Text
                style={[
                  styles.segmentBtnText,
                  issueTargetType === 'DEPARTMENT' && styles.segmentBtnTextActive,
                ]}
              >
                Phòng ban
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setIssueTargetType('USER')}
              style={[
                styles.segmentBtn,
                issueTargetType === 'USER' && styles.segmentBtnActive,
              ]}
            >
              <Text
                style={[
                  styles.segmentBtnText,
                  issueTargetType === 'USER' && styles.segmentBtnTextActive,
                ]}
              >
                Cá nhân
              </Text>
            </Pressable>
          </View>

          {/* Department / User Select Box */}
          <Pressable
            onPress={() => setShowTargetModal(true)}
            style={styles.selectDropdownBtn}
          >
            <Ionicons
              name={issueTargetType === 'DEPARTMENT' ? 'people-outline' : 'person-outline'}
              size={20}
              color="#0F172A"
            />
            <Text
              style={[
                styles.selectDropdownText,
                !selectedDept && !selectedEmployee && !user?.department?.name && { color: '#94A3B8' },
              ]}
              numberOfLines={1}
            >
              {targetLabel}
            </Text>
            <Ionicons name="chevron-down" size={18} color="#64748B" />
          </Pressable>
        </View>

        {/* Card 3: Thông tin thêm */}
        <View style={styles.formCard}>
          <Text style={styles.formCardTitle}>Thông tin thêm</Text>
          <Text style={styles.inputFieldLabel}>Ghi chú / Lý do</Text>
          <TextInput
            style={styles.multilineTextInput}
            placeholder="Nhập ghi chú hoặc lý do..."
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={4}
            value={note}
            onChangeText={setNote}
          />
        </View>

        {/* Card 4: Danh sách vật tư cần xin */}
        <View style={styles.formCard}>
          <Text style={styles.formCardTitle}>Danh sách vật tư cần xin</Text>

          <Text style={styles.inputFieldLabel}>Chọn vật tư</Text>
          <Pressable
            onPress={() => setShowMaterialModal(true)}
            style={[styles.selectDropdownBtn, { marginBottom: 14 }]}
          >
            <MaterialCommunityIcons name="cube-outline" size={20} color="#0F172A" />
            <Text
              style={[
                styles.selectDropdownText,
                !selectedMaterial && { color: '#94A3B8' },
              ]}
              numberOfLines={1}
            >
              {selectedMaterial ? `${selectedMaterial.name} (${selectedMaterial.unit || 'cái'})` : 'Chọn vật tư'}
            </Text>
            <Ionicons name="chevron-down" size={18} color="#64748B" />
          </Pressable>

          <Text style={styles.inputFieldLabel}>Số lượng</Text>
          <View style={styles.singleLineInputWrap}>
            <TextInput
              style={styles.singleLineTextInput}
              value={quantityStr}
              onChangeText={setQuantityStr}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor="#94A3B8"
            />
          </View>
        </View>

        {/* Submit Button: Full-width Dark Navy */}
        <Pressable
          onPress={() => void submit()}
          disabled={create.isPending}
          style={({ pressed }) => [
            styles.submitFullBtn,
            pressed && { opacity: 0.9, transform: [{ scale: 0.985 }] },
          ]}
        >
          {create.isPending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.submitFullBtnText}>Gửi yêu cầu VTTB</Text>
          )}
        </Pressable>
      </ScrollView>

      {/* Select Modals */}
      <SelectModal
        visible={showWarehouseModal}
        title="Chọn kho xuất"
        options={warehouseOptions}
        selectedValue={warehouseId}
        onSelect={(opt) => {
          setWarehouseId(String(opt.value || opt.id));
          setShowWarehouseModal(false);
        }}
        onClose={() => setShowWarehouseModal(false)}
      />

      <SelectModal
        visible={showTargetModal}
        title={issueTargetType === 'DEPARTMENT' ? 'Chọn phòng ban nhận' : 'Chọn cá nhân nhận'}
        options={issueTargetType === 'DEPARTMENT' ? departmentOptions : employeeOptions}
        selectedValue={issueTargetType === 'DEPARTMENT' ? issuedToDepartmentId : issuedToUserId}
        onSelect={(opt) => {
          const val = String(opt.value || opt.id);
          if (issueTargetType === 'DEPARTMENT') {
            setIssuedToDepartmentId(val);
          } else {
            setIssuedToUserId(val);
          }
          setShowTargetModal(false);
        }}
        onClose={() => setShowTargetModal(false)}
      />

      <SelectModal
        visible={showMaterialModal}
        title="Chọn vật tư cần xin"
        options={materialOptions}
        selectedValue={selectedMaterialId}
        onSelect={(opt) => {
          setSelectedMaterialId(String(opt.value || opt.id));
          setShowMaterialModal(false);
        }}
        onClose={() => setShowMaterialModal(false)}
      />
    </View>
  );
}

// =================================================================
// 4. SCREEN 3: CHI TIẾT YÊU CẦU VTTB (Matching Theme)
// =================================================================
export function MaterialIssueDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const issue = useMaterialIssue(id);
  const warehouses = useWarehouses();
  const departments = useDepartments({ page: 1, limit: 100 });
  const action = useMaterialIssueAction();
  const { showAlert } = useAppAlert();
  const warehouseItems = warehouses.data?.items ?? [];
  const departmentItems = departments.data?.items ?? [];

  function translateAction(kind: string) {
    if (kind === 'approve') return 'Phê duyệt';
    if (kind === 'reject') return 'Từ chối';
    if (kind === 'issue') return 'Thực xuất';
    if (kind === 'cancel') return 'Hủy yêu cầu';
    return kind.toUpperCase();
  }

  async function run(kind: 'approve' | 'reject' | 'issue' | 'cancel') {
    if (!id) return;
    try {
      await action.mutateAsync({ id, action: kind });
      showAlert('Thành công', `Đã ${translateAction(kind).toLowerCase()} yêu cầu.`, () => router.back());
    } catch (error) {
      const mapped = mapWarehouseAssetError(error);
      showAlert(mapped.code, mapped.message);
    }
  }

  const issueData = issue.data;
  const actions = issueData ? availableIssueActions(user, issueData) : [];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#102739" />

      {/* Header Dark Navy #102739 */}
      <View style={[styles.navyHeader, { paddingTop: Math.max(insets.top, 16) + 4 }]}>
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={10}
            accessibilityLabel="Quay lại"
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </Pressable>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.headerTitle}>Chi tiết yêu cầu VTTB</Text>
            <Text style={styles.headerSubtitle}>
              {issueData ? `Mã: ${issueData.issueCode}` : 'Chi tiết cấp phát'}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.sheetContainer}
        contentContainerStyle={[
          styles.sheetScrollContent,
          { paddingBottom: Math.max(insets.bottom, 24) + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {issue.isLoading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator size="small" color="#0284C7" />
          </View>
        ) : !issueData ? (
          <View style={[styles.mainCard, { alignItems: 'center', paddingVertical: 30 }]}>
            <Ionicons name="alert-circle-outline" size={32} color="#94A3B8" />
            <Text style={{ fontSize: 15, color: '#475569', marginTop: 10 }}>
              Không tìm thấy thông tin yêu cầu.
            </Text>
          </View>
        ) : (
          <>
            {/* Card: Thông tin yêu cầu */}
            <View style={styles.formCard}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.formCardTitle}>Thông tin yêu cầu</Text>
                <StatusBadge
                  label={translateStatus(issueData.status)}
                  tone={issueStatusTone(issueData.status)}
                />
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Mã phiếu:</Text>
                <Text style={styles.detailValue}>{issueData.issueCode}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Kho xuất:</Text>
                <Text style={styles.detailValue}>
                  {warehouseItems.find((w) => w.id === issueData.warehouseId)?.name ?? issueData.warehouseId}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Cấp phát cho:</Text>
                <Text style={styles.detailValue}>
                  {translateTarget(issueData.issueTargetType)}
                  {issueData.issuedToDepartmentId
                    ? ` - ${departmentItems.find((d) => d.id === issueData.issuedToDepartmentId)?.name || 'Phòng ban'}`
                    : ''}
                </Text>
              </View>

              {issueData.note ? (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Ghi chú:</Text>
                  <Text style={[styles.detailValue, { flex: 1 }]}>{issueData.note}</Text>
                </View>
              ) : null}

              {issueData.createdAt ? (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Thời gian tạo:</Text>
                  <Text style={styles.detailValue}>{formatDateTime(issueData.createdAt)}</Text>
                </View>
              ) : null}
            </View>

            {/* Card: Danh sách vật tư */}
            <View style={styles.formCard}>
              <Text style={styles.formCardTitle}>Danh sách vật tư</Text>
              <View style={{ marginTop: 10, gap: 10 }}>
                {issueData.items?.map((item) => (
                  <View key={item.id} style={styles.materialItemRow}>
                    <View style={styles.materialIconCircle}>
                      <MaterialCommunityIcons name="cube-outline" size={18} color="#0284C7" />
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.materialItemName}>
                        {item.material?.name ?? item.materialId}
                      </Text>
                      {item.material?.materialCode ? (
                        <Text style={styles.materialItemCode}>
                          Mã: {item.material.materialCode}
                        </Text>
                      ) : null}
                    </View>
                    <View style={styles.quantityBadge}>
                      <Text style={styles.quantityBadgeText}>
                        x{formatQuantity(item.quantityRequested)} {item.material?.unit || 'cái'}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Card: Thao tác duyệt */}
            {actions.length > 0 ? (
              <View style={styles.formCard}>
                <Text style={styles.formCardTitle}>Thao tác xét duyệt</Text>
                <View style={{ marginTop: 12, gap: 10 }}>
                  {actions.map((kind) => {
                    const isDanger = kind === 'reject' || kind === 'cancel';
                    return (
                      <Pressable
                        key={kind}
                        onPress={() => void run(kind)}
                        disabled={action.isPending}
                        style={[
                          styles.actionBtn,
                          isDanger ? styles.actionDangerBtn : styles.actionPrimaryBtn,
                        ]}
                      >
                        <Text
                          style={[
                            styles.actionBtnText,
                            isDanger ? styles.actionDangerBtnText : styles.actionPrimaryBtnText,
                          ]}
                        >
                          {translateAction(kind)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}

// =================================================================
// STYLES
// =================================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#102739',
  },
  navyHeader: {
    backgroundColor: '#102739',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 4,
    marginRight: 6,
    marginLeft: -6,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 3,
  },
  sheetContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  sheetScrollContent: {
    padding: 16,
  },
  mainCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  badgePill: {
    backgroundColor: '#E0F2FE',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
  },
  illustrationWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginTop: 14,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 19,
    paddingHorizontal: 16,
  },
  primaryDarkBtn: {
    backgroundColor: '#102739',
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
    width: '100%',
  },
  primaryDarkBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Issue Item Cards in list
  issueItemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  issueItemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  issueItemCode: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  issueItemMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  issueItemMetaText: {
    fontSize: 13,
    color: '#64748B',
    flex: 1,
  },
  issueItemActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  viewDetailText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0284C7',
    marginRight: 4,
  },

  // Form Cards
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  formCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
  },
  selectDropdownBtn: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  selectDropdownText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0F172A',
    flex: 1,
    marginLeft: 10,
  },
  segmentedRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  segmentBtn: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  segmentBtnActive: {
    backgroundColor: '#102739',
    borderColor: '#102739',
  },
  segmentBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  segmentBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  inputFieldLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#475569',
    marginBottom: 6,
  },
  multilineTextInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    minHeight: 90,
    textAlignVertical: 'top',
    fontSize: 14,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
  },
  singleLineInputWrap: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 14,
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  singleLineTextInput: {
    fontSize: 14,
    color: '#0F172A',
    padding: 0,
  },
  submitFullBtn: {
    backgroundColor: '#102739',
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 30,
  },
  submitFullBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Detail Screen Styles
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  detailLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  detailValue: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  materialItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  materialIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  materialItemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  materialItemCode: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },
  quantityBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  quantityBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0284C7',
  },
  actionBtn: {
    height: 46,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionPrimaryBtn: {
    backgroundColor: '#102739',
  },
  actionDangerBtn: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  actionPrimaryBtnText: {
    color: '#FFFFFF',
  },
  actionDangerBtnText: {
    color: '#DC2626',
  },
});
