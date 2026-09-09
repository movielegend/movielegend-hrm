import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect, useMemo } from 'react';
import { RefreshControl, StyleSheet, Text, View, Pressable, ActivityIndicator, ScrollView, Switch } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { FormField } from '../../components/FormField';
import { LoadingState } from '../../components/LoadingState';
import { PageHeader } from '../../components/PageHeader';
import { PrimaryButton } from '../../components/Buttons';
import { Screen } from '../../components/Screen';
import { ScreenContainer } from '../../components/ScreenContainer';
import { SearchInput } from '../../components/SearchInput';
import { SectionCard } from '../../components/SectionCard';
import { FilterChip } from '../../components/FilterChip';
import { useBranches, useCreateBranch, useDeleteBranch, useUpdateBranch, useBranch, type Branch } from '../../api/branches.api';
import { useRegions } from '../../api/regions.api';
import { getDepartments } from '../../api/departments.api';
import { useQuery } from '@tanstack/react-query';
import { colors } from '../../theme/colors';
import { normalizeApiError } from '../../utils/api-error';
import { MultiSelectModal } from '../../components/MultiSelectModal';
import { SelectModal, SelectOption } from '../../components/SelectModal';
import { LocationPickerMap, LocationData } from '../../components/LocationPickerMap';

import { useAppAlert } from '../../contexts/AlertContext';
import { useAuth } from '../../providers/AuthProvider';

export function BranchListScreen() {
  const router = useRouter();
  const { showAlert, showConfirm } = useAppAlert();
  const { user } = useAuth();
  const isGlobalAdmin = user?.roles?.includes('ADMIN') && user?.scopes?.some(s => s.role === 'ADMIN' && s.scopeType === 'GLOBAL');
  const [search, setSearch] = useState('');
  const [selectedRegionId, setSelectedRegionId] = useState<string>('ALL');
  
  const branches = useBranches();
  const regions = useRegions();
  const deleteBranch = useDeleteBranch();
  
  const handleDelete = (id: string, name: string) => {
    showConfirm({
      title: 'Xóa chi nhánh',
      message: `Bạn có chắc chắn muốn xóa chi nhánh "${name}"?`,
      confirmLabel: 'Xóa',
      onConfirm: async () => {
        try {
          await deleteBranch.mutateAsync(id);
          showAlert('Thành công', 'Đã xóa chi nhánh');
        } catch (error) {
          const normalized = normalizeApiError(error);
          showAlert('Lỗi', normalized.message);
        }
      },
    });
  };

  const totalBranchesCount = branches.data?.length || 0;

  const filterOptions = useMemo(() => {
    if (!branches.data) return [];
    const countMap: Record<string, number> = {};
    branches.data.forEach((b) => {
      const rId = b.isHeadquarters ? 'HQ' : (b.region?.id || b.regionId || 'UNASSIGNED');
      countMap[rId] = (countMap[rId] || 0) + 1;
    });
    const list: { id: string; name: string; count: number }[] = [];
    if (countMap['HQ']) {
      list.push({ id: 'HQ', name: 'Trụ sở chính', count: countMap['HQ'] });
    }
    regions.data?.forEach((r) => {
      list.push({ id: r.id, name: r.name, count: countMap[r.id] || 0 });
    });
    if (countMap['UNASSIGNED']) {
      list.push({ id: 'UNASSIGNED', name: 'Chưa phân miền', count: countMap['UNASSIGNED'] });
    }
    return list;
  }, [branches.data, regions.data]);

  const groupedSections = useMemo(() => {
    if (!branches.data) return [];
    const query = search.trim().toLowerCase();
    const searchedBranches = branches.data.filter((b) => {
      return b.name.toLowerCase().includes(query) || b.code.toLowerCase().includes(query) ||
        (b.region?.name ? b.region.name.toLowerCase().includes(query) : false) ||
        (b.address ? b.address.toLowerCase().includes(query) : false);
    });
    const groupMap: Record<string, { regionId: string; regionName: string; regionCode?: string; branches: Branch[] }> = {};
    regions.data?.forEach((r) => {
      groupMap[r.id] = { regionId: r.id, regionName: r.name, regionCode: r.code, branches: [] };
    });
    const unassignedList: Branch[] = [];
    const hqList: Branch[] = [];
    searchedBranches.forEach((b) => {
      if (b.isHeadquarters) { hqList.push(b); return; }
      const rId = b.region?.id || b.regionId;
      if (rId && groupMap[rId]) { groupMap[rId].branches.push(b); }
      else if (rId) {
        if (!groupMap[rId]) { groupMap[rId] = { regionId: rId, regionName: b.region?.name || 'Miền khác', regionCode: b.region?.code, branches: [b] }; }
        else { groupMap[rId].branches.push(b); }
      } else { unassignedList.push(b); }
    });
    let sections = Object.values(groupMap);
    if (unassignedList.length > 0) {
      sections.push({ regionId: 'UNASSIGNED', regionName: 'Chưa phân miền', branches: unassignedList });
    }
    if (hqList.length > 0) {
      sections.unshift({ regionId: 'HQ', regionName: 'Trụ sở chính', branches: hqList });
    }
    if (selectedRegionId !== 'ALL') {
      sections = sections.filter((s) => s.regionId === selectedRegionId);
    }
    return sections;
  }, [branches.data, regions.data, search, selectedRegionId]);

  return (
    <Screen>
      <ScreenContainer refreshControl={<RefreshControl refreshing={branches.isRefetching} onRefresh={() => void branches.refetch()} />}>
        <PageHeader
          title="Chi nhánh"
          subtitle="Quản lý chi nhánh công ty"
          showBack={false}
          right={
            <Pressable style={styles.addBtn} onPress={() => router.push('./branches/create')}>
              <MaterialCommunityIcons name="plus" size={18} color="#fff" />
              <Text style={styles.addBtnText}>Thêm mới</Text>
            </Pressable>
          }
        />
        <View style={{ marginBottom: 16 }}>
          <SearchInput value={search} onChangeText={setSearch} placeholder="Tìm chi nhánh..." />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 4 }}>
            <FilterChip label={`Tất cả (${totalBranchesCount})`} isActive={selectedRegionId === 'ALL'} onPress={() => setSelectedRegionId('ALL')} />
            {filterOptions.map((opt) => (
              <FilterChip key={opt.id} label={`${opt.name} (${opt.count})`} isActive={selectedRegionId === opt.id} onPress={() => setSelectedRegionId(opt.id)} />
            ))}
          </View>
        </ScrollView>
        {branches.isLoading ? <LoadingState /> : null}
        {branches.isError ? <ErrorState error={branches.error} onRetry={() => void branches.refetch()} /> : null}
        {!branches.isLoading && !branches.data?.length ? <EmptyState title="Chưa có chi nhánh" /> : null}
        <View style={styles.list}>
          {groupedSections.map((section) => (
            <View key={section.regionId} style={{ marginBottom: 24 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 }}>
                <MaterialCommunityIcons name={section.regionId === 'HQ' ? 'star' : 'earth'} size={20} color={section.regionId === 'HQ' ? '#D97706' : '#3B82F6'} />
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>{section.regionName}</Text>
                <Text style={{ fontSize: 13, color: '#6B7280', marginLeft: 'auto' }}>
                  {section.regionId === 'HQ' ? '' : 'Khu vực điều hành • '}{section.branches.length} chi nhánh
                </Text>
              </View>
              {section.branches.length === 0 ? (
                <View style={{ padding: 24, backgroundColor: '#F9FAFB', borderRadius: 12, alignItems: 'center' }}>
                  <Text style={{ color: '#6B7280' }}>Không có chi nhánh nào phù hợp</Text>
                </View>
              ) : (
                <View style={{ gap: 12 }}>
                  {section.branches.map((branch) => (
                    <Pressable key={branch.id} style={styles.card} onPress={() => router.push(`/admin/branches/${branch.id}/departments`)}>
                      <View style={styles.cardHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 }}>
                          <View style={styles.iconBox}>
                            <MaterialCommunityIcons name="office-building" size={24} color="#111827" />
                          </View>
                          <View style={styles.cardInfo}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                              <Text style={styles.cardTitle}>{branch.name}</Text>
                              {branch.isHeadquarters && (
                                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3C7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, gap: 4 }}>
                                  <MaterialCommunityIcons name="star" size={12} color="#D97706" />
                                  <Text style={{ fontSize: 10, fontWeight: '600', color: '#D97706' }}>Trụ sở</Text>
                                </View>
                              )}
                            </View>
                          </View>
                        </View>
                        {(!branch.isHeadquarters || isGlobalAdmin) && (
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                          <Pressable style={styles.actionBtn} onPress={() => router.push(`/admin/branches/${branch.id}/edit` as any)}>
                            <MaterialCommunityIcons name="pencil-outline" size={20} color="#111827" />
                          </Pressable>
                          <Pressable style={styles.actionBtn} onPress={() => handleDelete(branch.id, branch.name)}>
                            <MaterialCommunityIcons name="trash-can-outline" size={20} color="#111827" />
                          </Pressable>
                        </View>
                        )}
                      </View>
                      {branch.address ? <Text style={styles.cardDesc}>{branch.address}</Text> : null}
                      {branch.departments && branch.departments.length > 0 ? (
                        <Text style={styles.cardCount}>{branch.departments.length} phòng ban</Text>
                      ) : null}
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>
      </ScreenContainer>
    </Screen>
  );
}

import NetInfo from '@react-native-community/netinfo';
import * as Location from 'expo-location';

export function BranchCreateScreen() {
  const router = useRouter();
  const { showAlert, showConfirm } = useAppAlert();
  const { user } = useAuth();
  const isSuperAdmin = user?.roles?.includes('ADMIN') && user?.scopes?.some(s => s.role === 'ADMIN' && s.scopeType === 'GLOBAL');
  const mutation = useCreateBranch();
  
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [isHeadquarters, setIsHeadquarters] = useState(false);
  const [latitude, setLatitude] = useState<number | undefined>();
  const [longitude, setLongitude] = useState<number | undefined>();
  const [allowedIps, setAllowedIps] = useState('');
  const [networkName, setNetworkName] = useState('');
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const [regionModalVisible, setRegionModalVisible] = useState(false);
  const [mapVisible, setMapVisible] = useState(false);
  const [isFetchingIp, setIsFetchingIp] = useState(false);

  const regionsQuery = useRegions();

  const selectedRegionName = useMemo(() => {
    if (!selectedRegionId) return '';
    const r = regionsQuery.data?.find((item) => item.id === selectedRegionId);
    return r ? r.name : '';
  }, [selectedRegionId, regionsQuery.data]);

  const regionOptions: SelectOption[] = useMemo(() => {
    return (regionsQuery.data || []).map((r) => ({
      id: r.id,
      label: r.name,
    }));
  }, [regionsQuery.data]);

  const fetchCurrentIp = async (currentValue: string) => {
    try {
      setIsFetchingIp(true);
      
      // Xin quyền Location trên Android để đọc được tên mạng Wi-Fi
      let ssid = '';
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const netInfo = await NetInfo.fetch();
        if (netInfo.type === 'wifi' && netInfo.details && 'ssid' in netInfo.details && netInfo.details.ssid) {
          ssid = netInfo.details.ssid;
        }
      }

      // Vẫn lấy Public IP để lưu DB
      const res = await fetch('https://api.ipify.org?format=json');
      const data = await res.json();
      const currentIp = data.ip;

      if (ssid) {
        setNetworkName(ssid); // Lưu SSID để hiển thị lên màn hình
      }

      if (currentValue && !currentValue.includes(currentIp)) {
        setAllowedIps(currentValue.trim() ? `${currentValue}, ${currentIp}` : currentIp);
      } else if (!currentValue) {
        setAllowedIps(currentIp);
      }
    } catch (err) {
      console.warn('Lỗi lấy mạng:', err);
    } finally {
      setIsFetchingIp(false);
    }
  };

  useEffect(() => {
    // Tự động lấy Wi-Fi khi vừa mở màn hình
    void fetchCurrentIp(allowedIps);
  }, []);

  const submit = async () => {
    try {
      // Auto-generate code from name
      const initials = name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .replace(/[^A-Z]/g, '');
      const timestamp = new Date().getTime().toString().slice(-4);
      const generatedCode = `${initials}-${timestamp}`;
      
      const payload: any = {
        code: generatedCode,
        name,
        address: address || undefined,
        latitude: latitude,
        longitude: longitude,
        allowedIps: allowedIps ? allowedIps.split(',').map(ip => ip.trim()).filter(Boolean) : [],
        isHeadquarters,
        regionId: selectedRegionId || undefined,
      };
      
      await mutation.mutateAsync(payload);
      showAlert('Thành công', 'Đã tạo chi nhánh mới', () => router.back());
    } catch (error) {
      const normalized = normalizeApiError(error);
      showAlert('Lỗi', normalized.message);
    }
  };

  const handleLocationSelect = (loc: LocationData) => {
    setLatitude(loc.latitude);
    setLongitude(loc.longitude);
    if (loc.address) setAddress(loc.address);
    setMapVisible(false);
  };

  return (
    <Screen>
      <ScreenContainer>
        <PageHeader title="Thêm Chi nhánh" subtitle="Tạo chi nhánh mới cho công ty" />
        <SectionCard>

          <FormField
            label="Tên chi nhánh *"
            value={name}
            onChangeText={setName}
            placeholder="Ví dụ: Chi nhánh Hà Nội"
          />
          <FormField
            label="Tên mạng Wi-Fi (SSID)"
            value={networkName || allowedIps}
            onChangeText={(text) => {
              setNetworkName(''); // Xóa tên mạng nếu người dùng tự sửa bằng tay
              setAllowedIps(text);
            }}
            placeholder="Ví dụ: Tầng 1 - WiFi"
            autoCapitalize="none"
            rightLabelElement={
              <Pressable 
                onPress={() => void fetchCurrentIp(allowedIps)}
                style={{ flexDirection: 'row', alignItems: 'center', padding: 4, backgroundColor: '#EFF6FF', borderRadius: 4 }}
                disabled={isFetchingIp}
              >
                {isFetchingIp ? (
                  <ActivityIndicator size="small" color="#3B82F6" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="wifi" size={14} color="#3B82F6" style={{ marginRight: 4 }} />
                    <Text style={{ fontSize: 12, color: '#3B82F6', fontWeight: '600' }}>Làm mới mạng</Text>
                  </>
                )}
              </Pressable>
            }
          />
          {isSuperAdmin && (
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 8 }}>Vùng / Miền quản lý</Text>
              <Pressable 
                onPress={() => setRegionModalVisible(true)}
                style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  borderWidth: 1, 
                  borderColor: '#E5E7EB', 
                  borderRadius: 12, 
                  paddingHorizontal: 16,
                  minHeight: 48,
                  backgroundColor: '#FFFFFF'
                }}
              >
                <MaterialCommunityIcons name="earth" size={20} color="#3B82F6" style={{ marginRight: 10 }} />
                <Text style={{ flex: 1, color: selectedRegionName ? '#111827' : '#9CA3AF', fontSize: 15 }}>
                  {selectedRegionName || 'Chọn Vùng / Miền (Ví dụ: Miền Bắc...)'}
                </Text>
                <MaterialCommunityIcons name="chevron-down" size={20} color="#9CA3AF" />
              </Pressable>
            </View>
          )}
          <View style={{ marginBottom: 16 }}>
            {isSuperAdmin && (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827' }}>Là trụ sở chính?</Text>
              <Switch value={isHeadquarters} onValueChange={setIsHeadquarters} trackColor={{ false: '#D1D5DB', true: '#3B82F6' }} />
            </View>
            )}
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 8 }}>Vị trí / Địa chỉ</Text>
            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              borderWidth: 1, 
              borderColor: '#E5E7EB', 
              borderRadius: 12, 
              paddingLeft: 16, 
              paddingRight: 8,
              minHeight: 48 
            }}>
              <Text style={{ flex: 1, color: address ? '#111827' : '#9CA3AF', fontSize: 15 }} numberOfLines={1}>
                {address || 'Chưa chọn vị trí'}
              </Text>
              <Pressable 
                onPress={() => setMapVisible(true)}
                style={{
                  backgroundColor: '#F3F4F6',
                  padding: 8,
                  borderRadius: 8,
                }}
              >
                <MaterialCommunityIcons name="map-marker-outline" size={20} color="#3B82F6" />
              </Pressable>
            </View>
          </View>



          <PrimaryButton 
            loading={mutation.isPending} 
            disabled={!name} 
            onPress={() => void submit()}
          >
            Tạo Chi nhánh
          </PrimaryButton>
        </SectionCard>
      </ScreenContainer>

      <LocationPickerMap
        visible={mapVisible}
        onClose={() => setMapVisible(false)}
        onSelect={handleLocationSelect}
        initialLocation={(latitude !== undefined && longitude !== undefined) ? { latitude, longitude } : undefined}
      />

      <SelectModal
        visible={regionModalVisible}
        title="Chọn Vùng / Miền"
        options={regionOptions}
        selectedValue={selectedRegionId}
        onSelect={(opt) => {
          setSelectedRegionId(opt.id);
          setRegionModalVisible(false);
        }}
        onClose={() => setRegionModalVisible(false)}
      />


    </Screen>
  );
}

export function BranchEditScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const isSuperAdmin = user?.roles?.includes('ADMIN') && user?.scopes?.some(s => s.role === 'ADMIN' && s.scopeType === 'GLOBAL');
  const { id } = useLocalSearchParams<{ id: string }>();
  const { showAlert, showConfirm } = useAppAlert();
  const branchQuery = useBranch(id!);
  const mutation = useUpdateBranch();
  
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [isHeadquarters, setIsHeadquarters] = useState(false);
  const [latitude, setLatitude] = useState<number | undefined>();
  const [longitude, setLongitude] = useState<number | undefined>();
  const [allowedIps, setAllowedIps] = useState('');
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const [regionModalVisible, setRegionModalVisible] = useState(false);
  const [mapVisible, setMapVisible] = useState(false);
  const [isFetchingIp, setIsFetchingIp] = useState(false);

  const regionsQuery = useRegions();

  const selectedRegionName = useMemo(() => {
    if (!selectedRegionId) return '';
    const r = regionsQuery.data?.find((item) => item.id === selectedRegionId);
    return r ? r.name : '';
  }, [selectedRegionId, regionsQuery.data]);

  const regionOptions: SelectOption[] = useMemo(() => {
    const list: SelectOption[] = (regionsQuery.data || []).map((r) => ({
      id: r.id,
      label: r.name,
    }));
    return [{ id: '', label: 'Không gắn miền (Chưa phân miền)' }, ...list];
  }, [regionsQuery.data]);

  const fetchCurrentIp = async (setter: (val: string) => void, currentValue: string) => {
    try {
      setIsFetchingIp(true);
      const res = await fetch('https://api.ipify.org?format=json');
      const data = await res.json();
      const currentIp = data.ip;
      if (currentValue && !currentValue.includes(currentIp)) {
        setter(currentValue.trim() ? `${currentValue}, ${currentIp}` : currentIp);
      } else if (!currentValue) {
        setter(currentIp);
      }
    } catch (err) {
      showAlert('Lỗi', 'Không thể lấy địa chỉ IP mạng hiện tại');
    } finally {
      setIsFetchingIp(false);
    }
  };

  // Populate form with existing data when fetched
  useEffect(() => {
    if (branchQuery.data) {
      setCode(branchQuery.data.code);
      setName(branchQuery.data.name);
      setAddress(branchQuery.data.address || '');
      setIsHeadquarters(branchQuery.data.isHeadquarters || false);
      setLatitude(branchQuery.data.latitude);
      setLongitude(branchQuery.data.longitude);
      setAllowedIps((branchQuery.data as any).allowedIps?.join(', ') || '');
      setSelectedRegionId(branchQuery.data.regionId || branchQuery.data.region?.id || null);
    }
  }, [branchQuery.data]);

  const submit = async () => {
    try {
      const payload: any = { id, code, name };
      if (address) payload.address = address;
      if (latitude !== undefined) payload.latitude = latitude;
      if (longitude !== undefined) payload.longitude = longitude;
      payload.allowedIps = allowedIps ? allowedIps.split(',').map(ip => ip.trim()).filter(Boolean) : [];
      payload.isHeadquarters = isHeadquarters;
      if (isSuperAdmin) {
        payload.regionId = selectedRegionId || null;
      }

      await mutation.mutateAsync(payload);
      showAlert('Thành công', 'Đã lưu thay đổi chi nhánh', () => router.back());
    } catch (error) {
      const normalized = normalizeApiError(error);
      showAlert('Lỗi', normalized.message);
    }
  };

  const handleLocationSelect = (loc: LocationData) => {
    setLatitude(loc.latitude);
    setLongitude(loc.longitude);
    if (loc.address) setAddress(loc.address);
    setMapVisible(false);
  };

  if (branchQuery.isLoading) {
    return <Screen><ScreenContainer><LoadingState /></ScreenContainer></Screen>;
  }

  if (branchQuery.isError) {
    return <Screen><ScreenContainer><ErrorState error={branchQuery.error} onRetry={() => void branchQuery.refetch()} /></ScreenContainer></Screen>;
  }

  return (
    <Screen>
      <ScreenContainer>
        <PageHeader title="Sửa Chi nhánh" subtitle="Cập nhật thông tin chi nhánh" />
        <SectionCard>
          <FormField
            label="Tên chi nhánh *"
            value={name}
            onChangeText={setName}
            placeholder="Ví dụ: Chi nhánh Hà Nội"
          />
          <FormField
            label="ID mạng Wi-Fi (IP công ty)"
            value={allowedIps}
            onChangeText={setAllowedIps}
            placeholder="Ví dụ: 11.22.33.44 (Cách nhau dấu phẩy)"
            autoCapitalize="none"
            rightLabelElement={
              <Pressable 
                onPress={() => void fetchCurrentIp(setAllowedIps, allowedIps)}
                style={{ flexDirection: 'row', alignItems: 'center', padding: 4, backgroundColor: '#EFF6FF', borderRadius: 4 }}
                disabled={isFetchingIp}
              >
                {isFetchingIp ? (
                  <ActivityIndicator size="small" color="#3B82F6" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="wifi" size={14} color="#3B82F6" style={{ marginRight: 4 }} />
                    <Text style={{ fontSize: 12, color: '#3B82F6', fontWeight: '600' }}>Tự động điền mạng này</Text>
                  </>
                )}
              </Pressable>
            }
          />
          {isSuperAdmin && (
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 8 }}>Vùng / Miền quản lý</Text>
              <Pressable 
                onPress={() => setRegionModalVisible(true)}
                style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  borderWidth: 1, 
                  borderColor: '#E5E7EB', 
                  borderRadius: 12, 
                  paddingHorizontal: 16,
                  minHeight: 48,
                  backgroundColor: '#FFFFFF'
                }}
              >
                <MaterialCommunityIcons name="earth" size={20} color="#3B82F6" style={{ marginRight: 10 }} />
                <Text style={{ flex: 1, color: selectedRegionName ? '#111827' : '#9CA3AF', fontSize: 15 }}>
                  {selectedRegionName || 'Không gắn miền (Chưa phân miền)'}
                </Text>
                <MaterialCommunityIcons name="chevron-down" size={20} color="#9CA3AF" />
              </Pressable>
            </View>
          )}
          <View style={{ marginBottom: 16 }}>
            {isSuperAdmin && (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827' }}>Là trụ sở chính?</Text>
              <Switch value={isHeadquarters} onValueChange={setIsHeadquarters} trackColor={{ false: '#D1D5DB', true: '#3B82F6' }} />
            </View>
            )}
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 8 }}>Vị trí / Địa chỉ</Text>
            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              borderWidth: 1, 
              borderColor: '#E5E7EB', 
              borderRadius: 12, 
              paddingLeft: 16, 
              paddingRight: 8,
              minHeight: 48 
            }}>
              <Text style={{ flex: 1, color: address ? '#111827' : '#9CA3AF', fontSize: 15 }} numberOfLines={1}>
                {address || 'Chưa chọn vị trí'}
              </Text>
              <Pressable 
                onPress={() => setMapVisible(true)}
                style={{
                  backgroundColor: '#F3F4F6',
                  padding: 8,
                  borderRadius: 8,
                }}
              >
                <MaterialCommunityIcons name="map-marker-outline" size={20} color="#3B82F6" />
              </Pressable>
            </View>
          </View>



          <PrimaryButton 
            loading={mutation.isPending} 
            disabled={!name} 
            onPress={() => void submit()}
          >
            Lưu Thay đổi
          </PrimaryButton>
        </SectionCard>
      </ScreenContainer>

      <LocationPickerMap
        visible={mapVisible}
        onClose={() => setMapVisible(false)}
        onSelect={handleLocationSelect}
        initialLocation={(latitude !== undefined && longitude !== undefined) ? { latitude, longitude } : undefined}
      />

      <SelectModal
        visible={regionModalVisible}
        title="Chuyển / Chọn Vùng Miền"
        options={regionOptions}
        selectedValue={selectedRegionId || ''}
        onSelect={(opt) => {
          setSelectedRegionId(opt.id ? opt.id : null);
          setRegionModalVisible(false);
        }}
        onClose={() => setRegionModalVisible(false)}
      />


    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: 16, marginTop: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: { flex: 1 },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '500',
    marginTop: 2,
  },
  cardDesc: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  cardCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  actionBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  addBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
