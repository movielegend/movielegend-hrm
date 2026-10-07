import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Avatar } from '../../components/Avatar';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { FormField } from '../../components/FormField';
import { LoadingState } from '../../components/LoadingState';
import { PageHeader } from '../../components/PageHeader';
import { PrimaryButton, SecondaryButton } from '../../components/Buttons';
import { Screen } from '../../components/Screen';
import { ScreenContainer } from '../../components/ScreenContainer';
import { SectionCard } from '../../components/SectionCard';
import { StatusBadge, toneForStatus } from '../../components/StatusBadge';
import { SelectModal } from '../../components/SelectModal';
import { ConfirmModal } from '../../components/ConfirmModal';
import { useAppAlert } from '../../contexts/AlertContext';
import {
  useDepartment,
  useDepartments,
  useUpdateDepartment,
} from '../../hooks/useDepartments';
import { useEmployees } from '../../hooks/useEmployees';
import {
  useAssets,
  useRevokeAsset,
  useAssignAsset,
  useTransferAsset,
} from '../../hooks/useAssets';
import { useAuth } from '../../providers/AuthProvider';
import { colors } from '../../theme/colors';
import type { AssetDto } from '../../types/asset.types';
import { hasPermission } from '../../utils/permissions';
import { normalizeApiError } from '../../utils/api-error';

const schema = z.object({
  branchId: z.string().min(1, 'Vui lòng chọn chi nhánh'),
  code: z.string().optional(),
  name: z.string().min(2, 'Tên phòng ban không được để trống'),
  description: z.string().optional(),
  parentId: z.string().optional().or(z.literal('')),
});

type FormValues = z.infer<typeof schema>;

export function DepartmentDetailScreen() {
  const router = useRouter();
  const { id, departmentId } = useLocalSearchParams<{
    id?: string;
    departmentId?: string;
  }>();
  const actualId = (id || departmentId) as string;
  const { user } = useAuth();
  const { showAlert } = useAppAlert();
  const department = useDepartment(actualId);
  const employees = useEmployees({ departmentId: actualId, page: 1, limit: 100 });
  const update = useUpdateDepartment(actualId);
  const [editing, setEditing] = useState(false);
  const canEdit = hasPermission(user, 'department.update');

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: {
      branchId: department.data?.branchId ?? '',
      code: department.data?.code ?? '',
      name: department.data?.name ?? '',
      description: department.data?.description ?? '',
      parentId: department.data?.parentId ?? '',
    },
  });

  const { data: assetsData, isLoading: assetsLoading } = useAssets();
  const departmentAssets =
    assetsData?.items?.filter((a) => a.departmentId === actualId) || [];
  const allDepartments = useDepartments({ limit: 1000 });

  const [revokeModalVisible, setRevokeModalVisible] = useState(false);
  const [selectedAssetForRevoke, setSelectedAssetForRevoke] =
    useState<AssetDto | null>(null);
  const [revokeNote, setRevokeNote] = useState('');
  const revokeMutation = useRevokeAsset();

  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [selectedAssetForAssign, setSelectedAssetForAssign] =
    useState<AssetDto | null>(null);
  const [selectedEmployees, setSelectedEmployees] = useState<string | null>(null);
  const assignMutation = useAssignAsset();

  const [transferModalVisible, setTransferModalVisible] = useState(false);
  const [selectedAssetForTransfer, setSelectedAssetForTransfer] =
    useState<AssetDto | null>(null);
  const [selectedDepartments, setSelectedDepartments] = useState<string | null>(
    null
  );
  const transferMutation = useTransferAsset();

  if (department.isLoading) return <LoadingState />;
  if (department.isError)
    return (
      <ErrorState
        error={department.error}
        onRetry={() => void department.refetch()}
      />
    );
  if (!department.data)
    return <EmptyState title="Không tìm thấy phòng ban" />;

  const submit = handleSubmit(async (payload) => {
    try {
      await update.mutateAsync({
        branchId: payload.branchId,
        code: payload.code,
        name: payload.name,
        description: payload.description || undefined,
        parentId: payload.parentId || undefined,
      } as any);
      setEditing(false);
      showAlert('Thành công', 'Đã lưu thay đổi');
    } catch (error) {
      const normalized = normalizeApiError(error);
      showAlert('Lỗi', normalized.message);
    }
  });

  return (
    <Screen>
      <ScreenContainer style={{ paddingBottom: 100 }}>
        <PageHeader
          title={department.data.name}
          subtitle={department.data.description || 'Không có mô tả'}
        />

        <SectionCard title="Thông tin chung">
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginBottom: 12,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 14, color: '#98A0A8' }}>Trạng thái</Text>
            <StatusBadge
              label={
                department.data.isActive ? 'ĐANG HOẠT ĐỘNG' : 'NGỪNG HOẠT ĐỘNG'
              }
              tone={department.data.isActive ? 'success' : 'danger'}
            />
          </View>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginBottom: 12,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 14, color: '#98A0A8' }}>Mã phòng ban</Text>
            <Text
              style={{ fontSize: 15, color: '#0F172A', fontWeight: '700' }}
            >
              {department.data.code}
            </Text>
          </View>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginBottom: 12,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 14, color: '#98A0A8' }}>Trưởng phòng</Text>
            <Text
              style={{ fontSize: 15, color: '#0F172A', fontWeight: '600' }}
            >
              {department.data.leaderUserId ? 'Đã phân công' : 'Chưa có'}
            </Text>
          </View>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 14, color: '#98A0A8' }}>ID Công ty</Text>
            <Text
              style={{
                fontSize: 13,
                color: '#0F172A',
                fontWeight: '500',
                maxWidth: 200,
                textAlign: 'right',
              }}
              numberOfLines={1}
              ellipsizeMode="middle"
            >
              {department.data.companyId ?? undefined}
            </Text>
          </View>
        </SectionCard>

        <SectionCard title="Danh sách nhân viên">
          {employees.isLoading ? (
            <LoadingState label="Đang tải nhân viên..." />
          ) : null}
          {employees.isError ? (
            <ErrorState
              error={employees.error}
              onRetry={() => void employees.refetch()}
            />
          ) : null}

          <View style={{ gap: 8 }}>
            {employees.data?.items?.map((emp) => (
              <View
                key={emp.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 12,
                  backgroundColor: '#F8FAFC',
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                }}
              >
                <Avatar
                  name={emp.profile?.fullName}
                  uri={emp.profile?.avatarUrl}
                  size={40}
                />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text
                    style={{ fontSize: 15, fontWeight: '700', color: '#0F172A' }}
                  >
                    {emp.profile?.fullName ?? emp.phone}
                  </Text>
                  <Text style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>
                    {emp.userCode} -{' '}
                    {emp.roles?.some((r) => r.role.code === 'LEADER')
                      ? 'Quản lý'
                      : emp.profile?.position?.name || 'Nhân viên'}
                  </Text>
                </View>
                <StatusBadge
                  label={emp.accountStatus}
                  tone={toneForStatus(emp.accountStatus)}
                />
              </View>
            ))}
          </View>

          {!employees.isLoading && !employees.data?.items?.length ? (
            <Text
              style={{
                color: '#94A3B8',
                fontStyle: 'italic',
                textAlign: 'center',
                marginVertical: 12,
              }}
            >
              Chưa có nhân viên nào thuộc phòng ban này.
            </Text>
          ) : null}
        </SectionCard>

        <SectionCard title="Tài sản phòng ban">
          {assetsLoading ? <LoadingState label="Đang tải tài sản..." /> : null}
          <View style={{ gap: 12 }}>
            {departmentAssets.map((asset) => (
              <Pressable
                key={asset.id}
                style={{
                  padding: 12,
                  backgroundColor: '#F8FAFC',
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                }}
                onPress={() => router.push(`/admin/assets/${asset.id}` as never)}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    marginBottom: 8,
                  }}
                >
                  <Text
                    style={{ fontSize: 15, fontWeight: '700', color: '#0F172A' }}
                  >
                    {asset.name}
                  </Text>
                  <StatusBadge
                    label={asset.assetStatus}
                    tone={toneForStatus(asset.assetStatus)}
                  />
                </View>
                <Text
                  style={{ fontSize: 13, color: '#64748B', marginBottom: 8 }}
                >
                  Mã: {asset.assetCode} - Tình trạng: {asset.conditionStatus}
                </Text>

                <View style={styles.assetBody}>
                  <Text style={styles.detailLabel}>Loại:</Text>
                  <Text style={styles.detailValue}>
                    {asset.category?.name || 'Vật tư'}
                  </Text>
                </View>
                <View style={styles.assetBody}>
                  <Text style={styles.detailLabel}>Đang giao:</Text>
                  <Text style={styles.detailValue}>
                    {(() => {
                      const activeAssignment = asset.assignments?.find(
                        (a: any) =>
                          a.status === 'ACTIVE' ||
                          a.status === 'PENDING_CONFIRMATION'
                      );
                      if (!activeAssignment) return 'Chưa giao';
                      if (activeAssignment.assignedToUserId) {
                        const assignee = employees.data?.items?.find(
                          (e: any) => e.id === activeAssignment.assignedToUserId
                        );
                        return assignee
                          ? assignee.profile?.fullName ?? assignee.phone
                          : 'Nhân viên';
                      }
                      return 'Phòng ban';
                    })()}
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                  {asset.assetStatus === 'IN_STOCK' && (
                    <PrimaryButton
                      style={{ flex: 1, paddingVertical: 8 }}
                      onPress={() => {
                        setSelectedAssetForAssign(asset);
                        setSelectedEmployees(null);
                        setAssignModalVisible(true);
                      }}
                    >
                      Giao
                    </PrimaryButton>
                  )}
                  {(asset.assetStatus === 'ASSIGNED' ||
                    asset.assetStatus === 'IN_USE') && (
                    <SecondaryButton
                      style={{
                        flex: 1,
                        paddingVertical: 8,
                        borderColor: colors.danger,
                      }}
                      textStyle={{ color: colors.danger }}
                      onPress={() => {
                        setSelectedAssetForRevoke(asset);
                        setRevokeNote('');
                        setRevokeModalVisible(true);
                      }}
                    >
                      Thu hồi
                    </SecondaryButton>
                  )}
                  {asset.assetStatus === 'IN_STOCK' && (
                    <SecondaryButton
                      style={{ flex: 1, paddingVertical: 8 }}
                      onPress={() => {
                        setSelectedAssetForTransfer(asset);
                        setSelectedDepartments(null);
                        setTransferModalVisible(true);
                      }}
                    >
                      Điều chuyển
                    </SecondaryButton>
                  )}
                </View>
              </Pressable>
            ))}
            {!assetsLoading && departmentAssets.length === 0 && (
              <Text
                style={{
                  color: '#94A3B8',
                  fontStyle: 'italic',
                  textAlign: 'center',
                  marginVertical: 12,
                }}
              >
                Phòng ban chưa có tài sản nào.
              </Text>
            )}
          </View>
        </SectionCard>

        {canEdit ? (
          <SecondaryButton
            onPress={() => setEditing((current) => !current)}
            style={{ marginBottom: 16 }}
          >
            {editing ? 'Đóng chỉnh sửa' : 'Chỉnh sửa thông tin'}
          </SecondaryButton>
        ) : null}

        {editing ? (
          <SectionCard title="Cập nhật thông tin">
            <Controller
              control={control}
              name="name"
              render={({ field }) => (
                <FormField
                  label="Tên phòng ban"
                  value={field.value}
                  onChangeText={field.onChange}
                  error={errors.name?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="description"
              render={({ field }) => (
                <FormField
                  label="Mô tả"
                  value={field.value}
                  onChangeText={field.onChange}
                  error={errors.description?.message}
                />
              )}
            />
            {update.error ? (
              <Text style={styles.error}>
                {normalizeApiError(update.error).message}
              </Text>
            ) : null}
            <PrimaryButton
              onPress={() => void submit()}
              loading={update.isPending}
              style={{ marginTop: 16 }}
            >
              Lưu thay đổi
            </PrimaryButton>
          </SectionCard>
        ) : null}

        <ConfirmModal
          visible={revokeModalVisible}
          title="Thu hồi tài sản"
          description={`Bạn có chắc muốn thu hồi tài sản ${selectedAssetForRevoke?.name}?`}
          confirmText="Thu hồi"
          confirmTone="danger"
          isLoading={revokeMutation.isPending}
          onConfirm={async () => {
            if (selectedAssetForRevoke) {
              await revokeMutation.mutateAsync({
                assetId: selectedAssetForRevoke.id,
                payload: { note: revokeNote },
              });
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

        <SelectModal
          visible={assignModalVisible}
          title="Chọn nhân viên để giao"
          options={(employees.data?.items ?? []).map((emp) => ({
            id: emp.id,
            label: emp.profile?.fullName ?? emp.phone,
            subtitle: emp.userCode,
          }))}
          selectedValue={selectedEmployees}
          onSelect={async (option) => {
            setSelectedEmployees(option.id);
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
          isLoading={employees.isLoading}
        />

        <SelectModal
          visible={transferModalVisible}
          title="Chọn phòng ban điều chuyển"
          options={(allDepartments.data?.items ?? [])
            .filter((d) => d.id !== actualId)
            .map((d) => ({ id: d.id, label: d.name, subtitle: d.code }))}
          selectedValue={selectedDepartments}
          onSelect={async (option) => {
            setSelectedDepartments(option.id);
            if (selectedAssetForTransfer) {
              try {
                await transferMutation.mutateAsync({
                  assetId: selectedAssetForTransfer.id,
                  payload: { targetDepartmentId: option.id },
                });
                showAlert('Thành công', 'Đã điều chuyển tài sản');
                setTransferModalVisible(false);
              } catch (e: any) {
                showAlert(
                  'Lỗi',
                  e.response?.data?.error?.message ||
                    e.response?.data?.message ||
                    'Không thể điều chuyển'
                );
              }
            }
          }}
          onClose={() => setTransferModalVisible(false)}
        />
      </ScreenContainer>
    </Screen>
  );
}

const styles = StyleSheet.create({
  error: { color: colors.danger, marginTop: 8 },
  assetBody: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 13,
    color: '#64748B',
    width: 80,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
});
