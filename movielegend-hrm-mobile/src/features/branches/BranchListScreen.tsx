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
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { useBranches, useDeleteBranch, type Branch } from '../../api/branches.api';
import { useRegions } from '../../api/regions.api';
import { useAuth } from '../../providers/AuthProvider';
import { CustomAlert } from '../../components/CustomAlert';
import { normalizeApiError } from '../../utils/api-error';
import { EmptyState } from '../../components/EmptyState';
import { LoadingState } from '../../components/LoadingState';

export function BranchListScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const isGlobalAdmin =
    user?.roles?.includes('ADMIN') &&
    user?.scopes?.some((s) => s.role === 'ADMIN' && s.scopeType === 'GLOBAL');

  const [search, setSearch] = useState('');
  const [selectedRegionId, setSelectedRegionId] = useState<string>('ALL');
  const [actionBranch, setActionBranch] = useState<Branch | null>(null);

  const branchesQuery = useBranches();
  const regionsQuery = useRegions();
  const deleteBranchMutation = useDeleteBranch();

  const allBranches = branchesQuery.data || [];
  const allRegions = regionsQuery.data || [];

  // Filter chips options
  const filterChips = useMemo(() => {
    const countMap: Record<string, number> = {};
    allBranches.forEach((b) => {
      const rId = b.isHeadquarters ? 'HQ' : b.region?.id || b.regionId || 'UNASSIGNED';
      countMap[rId] = (countMap[rId] || 0) + 1;
    });

    const list: { id: string; label: string; count: number }[] = [
      { id: 'ALL', label: 'Tất cả', count: allBranches.length },
    ];

    if (countMap['HQ']) {
      list.push({ id: 'HQ', label: 'Trụ sở chính', count: countMap['HQ'] });
    }

    allRegions.forEach((r) => {
      list.push({ id: r.id, label: r.name, count: countMap[r.id] || 0 });
    });

    if (countMap['UNASSIGNED']) {
      list.push({ id: 'UNASSIGNED', label: 'Chưa phân miền', count: countMap['UNASSIGNED'] });
    }

    return list;
  }, [allBranches, allRegions]);

  // Group branches by region
  const groupedSections = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = allBranches.filter((b) => {
      if (!query) return true;
      return (
        b.name.toLowerCase().includes(query) ||
        b.code.toLowerCase().includes(query) ||
        (b.region?.name ? b.region.name.toLowerCase().includes(query) : false) ||
        (b.address ? b.address.toLowerCase().includes(query) : false)
      );
    });

    const groupMap: Record<
      string,
      { regionId: string; regionName: string; branches: Branch[] }
    > = {};

    allRegions.forEach((r) => {
      groupMap[r.id] = { regionId: r.id, regionName: r.name, branches: [] };
    });

    const unassignedList: Branch[] = [];
    const hqList: Branch[] = [];

    filtered.forEach((b) => {
      if (b.isHeadquarters) {
        hqList.push(b);
        return;
      }
      const rId = b.region?.id || b.regionId;
      if (rId && groupMap[rId]) {
        groupMap[rId].branches.push(b);
      } else if (rId) {
        if (!groupMap[rId]) {
          groupMap[rId] = {
            regionId: rId,
            regionName: b.region?.name || 'Miền khác',
            branches: [b],
          };
        } else {
          groupMap[rId].branches.push(b);
        }
      } else {
        unassignedList.push(b);
      }
    });

    let sections = Object.values(groupMap);
    if (unassignedList.length > 0) {
      sections.push({
        regionId: 'UNASSIGNED',
        regionName: 'Chưa phân miền',
        branches: unassignedList,
      });
    }
    if (hqList.length > 0) {
      sections.unshift({
        regionId: 'HQ',
        regionName: 'Trụ sở chính',
        branches: hqList,
      });
    }

    if (selectedRegionId !== 'ALL') {
      sections = sections.filter((s) => s.regionId === selectedRegionId);
    } else {
      // Filter out empty regions when searching or viewing ALL to keep list clean
      sections = sections.filter((s) => s.branches.length > 0);
    }

    return sections;
  }, [allBranches, allRegions, search, selectedRegionId]);

  const handleDelete = (branch: Branch) => {
    setActionBranch(null);
    CustomAlert.alert(
      'Xóa chi nhánh',
      `Bạn có chắc chắn muốn xóa chi nhánh "${branch.name}"? Hành động này không thể hoàn tác.`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteBranchMutation.mutateAsync(branch.id);
              CustomAlert.alert('Thành công', 'Đã xóa chi nhánh');
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
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/admin/(tabs)' as any))}
              style={styles.backBtn}
              hitSlop={8}
            >
              <Ionicons name="chevron-back" size={24} color="#0F172A" />
            </Pressable>
            <Text style={styles.title}>Chi nhánh</Text>
          </View>

          <Pressable
            onPress={() => router.push('/admin/branches/create' as any)}
            style={styles.addBtn}
            android_ripple={{ color: 'rgba(255,255,255,0.1)' }}
          >
            <Ionicons name="add" size={18} color="#FFFFFF" />
            <Text style={styles.addBtnText}>Thêm</Text>
          </Pressable>
        </View>

        <Text style={styles.subtitle}>Quản lý hệ thống chi nhánh</Text>
      </View>

      {/* 2. Search Box */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm tên hoặc địa chỉ chi nhánh"
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

      {/* 3. Filter Pills */}
      <View style={styles.filterSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {filterChips.map((chip) => {
            const isSelected = selectedRegionId === chip.id;
            return (
              <Pressable
                key={chip.id}
                onPress={() => setSelectedRegionId(chip.id)}
                style={[
                  styles.filterPill,
                  isSelected && styles.filterPillActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    isSelected && styles.filterPillTextActive,
                  ]}
                >
                  {chip.label} • {chip.count}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* 4. Branch Groups */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={branchesQuery.isRefetching}
            onRefresh={() => void branchesQuery.refetch()}
          />
        }
      >
        {branchesQuery.isLoading ? <LoadingState label="Đang tải danh sách chi nhánh..." /> : null}

        {!branchesQuery.isLoading && groupedSections.length === 0 ? (
          <EmptyState
            title="Không tìm thấy chi nhánh"
            description="Hãy thử từ khóa tìm kiếm hoặc bộ lọc khác."
          />
        ) : null}

        {groupedSections.map((section) => (
          <View key={section.regionId} style={styles.sectionGroup}>
            {/* Section Header */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionRegionTitle}>{section.regionName}</Text>
              <Text style={styles.sectionCountText}>
                {section.branches.length} chi nhánh
              </Text>
            </View>

            {/* Branch Cards */}
            <View style={styles.cardsList}>
              {section.branches.map((branch) => (
                <Pressable
                  key={branch.id}
                  style={styles.card}
                  onPress={() =>
                    router.push(
                      `/admin/branches/${branch.id}/departments` as any
                    )
                  }
                  android_ripple={{ color: '#F1F5F9' }}
                >
                  {/* Left Icon */}
                  <View style={styles.iconBox}>
                    <MaterialCommunityIcons
                      name="office-building"
                      size={22}
                      color="#166534"
                    />
                  </View>

                  {/* Middle Info */}
                  <View style={styles.cardInfo}>
                    <Text style={styles.companyTag}>MOVIE LEGEND</Text>
                    <View style={styles.branchNameRow}>
                      <Text style={styles.branchName} numberOfLines={1}>
                        {branch.name}
                      </Text>
                      {branch.isHeadquarters && (
                        <View style={styles.hqBadge}>
                          <Text style={styles.hqBadgeText}>Trụ sở</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.branchAddress} numberOfLines={2}>
                      {branch.address || 'Chưa cập nhật địa chỉ'}
                    </Text>
                  </View>

                  {/* Right Actions */}
                  <Pressable
                    style={styles.moreBtn}
                    onPress={() => setActionBranch(branch)}
                    hitSlop={12}
                  >
                    <Ionicons
                      name="ellipsis-horizontal"
                      size={18}
                      color="#64748B"
                    />
                  </Pressable>
                </Pressable>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* 5. Action Bottom Sheet Modal */}
      <Modal
        visible={!!actionBranch}
        transparent
        animationType="fade"
        onRequestClose={() => setActionBranch(null)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setActionBranch(null)}
        >
          <View style={styles.sheetContainer} onStartShouldSetResponder={() => true}>
            <View style={styles.sheetHandle} />

            <View style={styles.sheetHeader}>
              <View style={styles.sheetIconBox}>
                <MaterialCommunityIcons
                  name="office-building"
                  size={20}
                  color="#166534"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sheetTitle} numberOfLines={1}>
                  {actionBranch?.name}
                </Text>
                <Text style={styles.sheetSubtitle}>Tùy chọn quản lý chi nhánh</Text>
              </View>
              <Pressable
                onPress={() => setActionBranch(null)}
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
                  const b = actionBranch;
                  setActionBranch(null);
                  if (b) router.push(`/admin/branches/${b.id}/departments` as any);
                }}
              >
                <View style={[styles.sheetOptionIcon, { backgroundColor: '#EFF6FF' }]}>
                  <MaterialCommunityIcons name="domain" size={18} color="#2563EB" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sheetOptionText}>Quản lý phòng ban</Text>
                  <Text style={styles.sheetOptionSub}>
                    Xem và phân bổ phòng ban trong chi nhánh
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
              </Pressable>

              <Pressable
                style={styles.sheetOptionRow}
                onPress={() => {
                  const b = actionBranch;
                  setActionBranch(null);
                  if (b) router.push(`/admin/branches/${b.id}/edit` as any);
                }}
              >
                <View style={[styles.sheetOptionIcon, { backgroundColor: '#F0FDF4' }]}>
                  <Ionicons name="pencil" size={16} color="#166534" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sheetOptionText}>Chỉnh sửa chi nhánh</Text>
                  <Text style={styles.sheetOptionSub}>Sửa tên, vùng miền, Wi-Fi và tọa độ</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
              </Pressable>

              {(!actionBranch?.isHeadquarters || isGlobalAdmin) && (
                <Pressable
                  style={[styles.sheetOptionRow, { borderBottomWidth: 0 }]}
                  onPress={() => {
                    if (actionBranch) handleDelete(actionBranch);
                  }}
                >
                  <View style={[styles.sheetOptionIcon, { backgroundColor: '#FEF2F2' }]}>
                    <Ionicons name="trash-outline" size={18} color="#DC2626" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.sheetOptionText, { color: '#DC2626' }]}>
                      Xóa chi nhánh
                    </Text>
                    <Text style={styles.sheetOptionSub}>
                      Xóa chi nhánh khỏi danh sách hệ thống
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
    marginBottom: 12,
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
  filterSection: {
    marginBottom: 12,
  },
  filterScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterPillActive: {
    backgroundColor: '#1B382B',
    borderColor: '#1B382B',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  sectionGroup: {
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionRegionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionCountText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  cardsList: {
    gap: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
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
    paddingHorizontal: 12,
  },
  companyTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  branchNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 6,
  },
  branchName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    flexShrink: 1,
  },
  hqBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  hqBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
  },
  branchAddress: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 3,
    lineHeight: 16,
  },
  moreBtn: {
    padding: 6,
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
