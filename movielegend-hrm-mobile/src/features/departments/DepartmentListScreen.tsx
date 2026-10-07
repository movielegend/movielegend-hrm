import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  TextInput,
  RefreshControl,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { useDepartments, useDeleteDepartment } from '../../hooks/useDepartments';
import { useBranches } from '../../api/branches.api';
import { useAuth } from '../../providers/AuthProvider';
import { CustomAlert } from '../../components/CustomAlert';
import { normalizeApiError } from '../../utils/api-error';
import { EmptyState } from '../../components/EmptyState';
import { LoadingState } from '../../components/LoadingState';
import { SelectModal, SelectOption } from '../../components/SelectModal';
import { hasPermission } from '../../utils/permissions';
import type { DepartmentDto } from '../../types/department.types';

export function DepartmentListScreen() {
  const router = useRouter();
  const { branchId: paramBranchId } = useLocalSearchParams<{ branchId?: string }>();
  const { user } = useAuth();
  const canCreate = hasPermission(user, 'department.create');
  const canUpdate = hasPermission(user, 'department.update');
  const canDelete = hasPermission(user, 'department.delete');

  const [search, setSearch] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState<string>(paramBranchId || 'ALL');
  const [branchModalVisible, setBranchModalVisible] = useState(false);
  const [actionDept, setActionDept] = useState<DepartmentDto | null>(null);

  const departmentsQuery = useDepartments({ search });
  const branchesQuery = useBranches();
  const deleteDeptMutation = useDeleteDepartment();

  const branches = branchesQuery.data || [];
  const allDepartments = departmentsQuery.data?.items || [];

  const branchOptions: SelectOption[] = useMemo(() => {
    return [
      { id: 'ALL', label: 'Tất cả chi nhánh' },
      ...branches.map((b) => ({ id: b.id, label: b.name })),
    ];
  }, [branches]);

  const selectedBranchLabel = useMemo(() => {
    if (selectedBranchId === 'ALL') return 'Tất cả chi nhánh';
    const b = branches.find((item) => item.id === selectedBranchId);
    return b ? b.name : 'Tất cả chi nhánh';
  }, [selectedBranchId, branches]);

  const filteredDepartments = useMemo(() => {
    let list = allDepartments;
    if (selectedBranchId !== 'ALL') {
      list = list.filter((dept) => dept.branchId === selectedBranchId);
    }
    return list;
  }, [allDepartments, selectedBranchId]);

  const handleDelete = (dept: DepartmentDto) => {
    setActionDept(null);
    CustomAlert.alert(
      'Xóa phòng ban',
      `Bạn có chắc chắn muốn xóa phòng ban "${dept.name}" vĩnh viễn khỏi hệ thống?\n(Chỉ có thể xóa nếu phòng ban không còn nhân viên)`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa vĩnh viễn',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDeptMutation.mutateAsync(dept.id);
              CustomAlert.alert('Thành công', 'Đã xóa phòng ban');
            } catch (error) {
              const normalized = normalizeApiError(error);
              CustomAlert.alert('Lỗi', normalized.message);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* 1. Header (Back button + Title + Subtitle + "+ Thêm" button) */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerTitleGroup}>
            <Pressable
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/admin/branches' as any))}
              style={styles.backBtn}
              hitSlop={8}
            >
              <Ionicons name="chevron-back" size={24} color="#0F172A" />
            </Pressable>
            <Text style={styles.title}>Phòng ban</Text>
          </View>

          {canCreate && (
            <Pressable
              onPress={() =>
                router.push(
                  selectedBranchId !== 'ALL'
                    ? `/admin/branches/${selectedBranchId}/departments/create`
                    : '/admin/departments/create'
                )
              }
              style={styles.addBtn}
              android_ripple={{ color: 'rgba(255,255,255,0.1)' }}
            >
              <Ionicons name="add" size={18} color="#FFFFFF" />
              <Text style={styles.addBtnText}>Thêm</Text>
            </Pressable>
          )}
        </View>

        <Text style={styles.subtitle}>Quản lý cơ cấu tổ chức</Text>
      </View>

      {/* 2. Search Box */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm tên hoặc mã phòng ban"
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color="#94A3B8" />
            </Pressable>
          )}
        </View>
      </View>

      {/* 3. Branch Dropdown Selector Pill */}
      <View style={styles.branchSelectWrapper}>
        <Pressable
          style={styles.branchSelectPill}
          onPress={() => setBranchModalVisible(true)}
          android_ripple={{ color: '#F1F5F9' }}
        >
          <View style={styles.branchSelectLeft}>
            <MaterialCommunityIcons name="office-building" size={18} color="#166534" />
            <Text style={styles.branchSelectText} numberOfLines={1}>
              {selectedBranchLabel}
            </Text>
          </View>
          <Ionicons name="chevron-down" size={18} color="#64748B" />
        </Pressable>
      </View>

      {/* 4. Departments List */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={departmentsQuery.isRefetching}
            onRefresh={() => void departmentsQuery.refetch()}
          />
        }
      >
        {departmentsQuery.isLoading ? <LoadingState label="Đang tải danh sách phòng ban..." /> : null}

        {!departmentsQuery.isLoading && filteredDepartments.length === 0 ? (
          <EmptyState
            title="Không có phòng ban nào"
            description="Hãy thử chọn chi nhánh khác hoặc tạo phòng ban mới."
          />
        ) : null}

        <View style={styles.cardList}>
          {filteredDepartments.map((dept) => {
            const leaderName =
              dept.leader?.profile?.fullName || dept.leaderUserId;
            const branchName =
              dept.branch?.name ||
              branches.find((b) => b.id === dept.branchId)?.name ||
              'Chưa gắn chi nhánh';

            return (
              <View key={dept.id} style={styles.card}>
                {/* Top Section */}
                <View style={styles.cardTopRow}>
                  {/* Org icon box */}
                  <View style={styles.iconBox}>
                    <MaterialCommunityIcons
                      name="sitemap"
                      size={22}
                      color="#166534"
                    />
                  </View>

                  {/* Middle Info */}
                  <View style={styles.cardInfo}>
                    <Text style={styles.deptName}>{dept.name}</Text>
                    <Text style={styles.deptCode}>Mã: {dept.code || '---'}</Text>
                    <View style={styles.locationRow}>
                      <Ionicons name="location-outline" size={13} color="#64748B" />
                      <Text style={styles.locationText} numberOfLines={1}>
                        {branchName}
                      </Text>
                    </View>
                  </View>

                  {/* Status badge */}
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusBadgeText}>
                      ● {dept.isActive ? 'Hoạt động' : 'Tạm ẩn'}
                    </Text>
                  </View>
                </View>

                {/* Manager Box */}
                <View style={styles.managerBox}>
                  <Ionicons name="person-outline" size={15} color="#64748B" />
                  <Text style={styles.managerText} numberOfLines={1}>
                    Quản lý: {leaderName ? leaderName : 'Chưa bổ nhiệm'}
                  </Text>
                </View>

                {/* Bottom Action Row */}
                <View style={styles.actionRow}>
                  <Pressable
                    style={styles.detailLink}
                    onPress={() =>
                      router.push(
                        `/admin/branches/${dept.branchId || paramBranchId}/departments/${dept.id}/employees` as any
                      )
                    }
                  >
                    <Text style={styles.detailLinkText}>Xem chi tiết →</Text>
                  </Pressable>

                  <View style={styles.actionButtonsRight}>
                    {canUpdate && (
                      <Pressable
                        style={styles.iconActionBtn}
                        onPress={() =>
                          router.push(
                            dept.branchId
                              ? `/admin/branches/${dept.branchId}/departments/${dept.id}/edit`
                              : `/admin/departments/edit/${dept.id}`
                          )
                        }
                        hitSlop={8}
                      >
                        <Ionicons name="pencil" size={17} color="#0F172A" />
                      </Pressable>
                    )}

                    <Pressable
                      style={styles.iconActionBtn}
                      onPress={() => setActionDept(dept)}
                      hitSlop={8}
                    >
                      <Ionicons
                        name="ellipsis-horizontal"
                        size={18}
                        color="#64748B"
                      />
                    </Pressable>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* 5. Branch Select Modal */}
      <SelectModal
        visible={branchModalVisible}
        title="Chọn chi nhánh"
        options={branchOptions}
        selectedValue={selectedBranchId}
        onSelect={(opt) => {
          setSelectedBranchId(opt.id);
          setBranchModalVisible(false);
        }}
        onClose={() => setBranchModalVisible(false)}
      />

      {/* 6. Action Bottom Sheet Modal */}
      <Modal
        visible={!!actionDept}
        transparent
        animationType="fade"
        onRequestClose={() => setActionDept(null)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setActionDept(null)}
        >
          <View style={styles.sheetContainer} onStartShouldSetResponder={() => true}>
            <View style={styles.sheetHandle} />

            <View style={styles.sheetHeader}>
              <View style={styles.sheetIconBox}>
                <MaterialCommunityIcons
                  name="sitemap"
                  size={20}
                  color="#166534"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sheetTitle} numberOfLines={1}>
                  {actionDept?.name}
                </Text>
                <Text style={styles.sheetSubtitle}>
                  Mã: {actionDept?.code || '---'}
                </Text>
              </View>
              <Pressable
                onPress={() => setActionDept(null)}
                style={styles.sheetCloseBtn}
                hitSlop={8}
              >
                <Ionicons name="close" size={20} color="#64748B" />
              </Pressable>
            </View>

            <View style={styles.sheetOptions}>
              <Pressable
                style={styles.sheetOptionRow}
                onPress={() => {
                  const d = actionDept;
                  setActionDept(null);
                  if (d) {
                    router.push(
                      `/admin/branches/${d.branchId || paramBranchId}/departments/${d.id}/employees` as any
                    );
                  }
                }}
              >
                <View style={[styles.sheetOptionIcon, { backgroundColor: '#EFF6FF' }]}>
                  <Ionicons name="people" size={18} color="#2563EB" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sheetOptionText}>Danh sách nhân sự</Text>
                  <Text style={styles.sheetOptionSub}>
                    Xem và quản lý nhân viên trực thuộc
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
              </Pressable>

              {canUpdate && (
                <Pressable
                  style={styles.sheetOptionRow}
                  onPress={() => {
                    const d = actionDept;
                    setActionDept(null);
                    if (d) {
                      router.push(
                        d.branchId
                          ? `/admin/branches/${d.branchId}/departments/${d.id}/edit`
                          : `/admin/departments/edit/${d.id}`
                      );
                    }
                  }}
                >
                  <View style={[styles.sheetOptionIcon, { backgroundColor: '#F0FDF4' }]}>
                    <Ionicons name="pencil" size={16} color="#166534" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sheetOptionText}>Chỉnh sửa phòng ban</Text>
                    <Text style={styles.sheetOptionSub}>
                      Đổi tên, chi nhánh, phòng ban quản lý
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
                </Pressable>
              )}

              {canDelete && (
                <Pressable
                  style={[styles.sheetOptionRow, { borderBottomWidth: 0 }]}
                  onPress={() => {
                    if (actionDept) handleDelete(actionDept);
                  }}
                >
                  <View style={[styles.sheetOptionIcon, { backgroundColor: '#FEF2F2' }]}>
                    <Ionicons name="trash-outline" size={18} color="#DC2626" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.sheetOptionText, { color: '#DC2626' }]}>
                      Xóa phòng ban
                    </Text>
                    <Text style={styles.sheetOptionSub}>
                      Xóa phòng ban khỏi hệ thống
                    </Text>
                  </View>
                </Pressable>
              )}
            </View>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAF8',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backBtn: {
    padding: 4,
    marginLeft: -4,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1B382B', // Deep forest green
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
    marginLeft: 32,
  },
  searchWrapper: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    paddingVertical: 0,
  },
  branchSelectWrapper: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  branchSelectPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    height: 44,
  },
  branchSelectLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  branchSelectText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  cardList: {
    gap: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EAF5EE', // soft mint
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
  },
  deptName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  deptCode: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 3,
  },
  locationText: {
    fontSize: 12,
    color: '#64748B',
  },
  statusBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#166534',
  },
  managerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 10,
  },
  managerText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    flex: 1,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
    paddingTop: 10,
    marginTop: 10,
  },
  detailLink: {
    paddingVertical: 4,
  },
  detailLinkText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  actionButtonsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconActionBtn: {
    padding: 4,
  },
  // Bottom Sheet Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  sheetIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#EAF5EE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  sheetSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  sheetCloseBtn: {
    padding: 4,
  },
  sheetOptions: {
    gap: 6,
  },
  sheetOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  sheetOptionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetOptionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  sheetOptionSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
});
