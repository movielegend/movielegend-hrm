import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { RefreshControl, StyleSheet, Text, View, Pressable, Alert, ActivityIndicator } from 'react-native';
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
import { useBranches, useCreateBranch, useDeleteBranch, useUpdateBranch, useBranch } from '../../api/branches.api';
import { getDepartments } from '../../api/departments.api';
import { useQuery } from '@tanstack/react-query';
import { colors } from '../../theme/colors';
import { normalizeApiError } from '../../utils/api-error';
import { MultiSelectModal } from '../../components/MultiSelectModal';
import { LocationPickerMap, LocationData } from '../../components/LocationPickerMap';

export function BranchListScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const branches = useBranches();
  const deleteBranch = useDeleteBranch();
  
  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      'Xóa chi nhánh',
      `Bạn có chắc chắn muốn xóa chi nhánh "${name}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteBranch.mutateAsync(id);
              Alert.alert('Thành công', 'Đã xóa chi nhánh');
            } catch (error) {
              const normalized = normalizeApiError(error);
              Alert.alert('Lỗi', normalized.message);
            }
          },
        },
      ]
    );
  };

  const filteredItems = branches.data?.filter(b => 
    b.name.toLowerCase().includes(search.toLowerCase()) || 
    b.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Screen>
      <ScreenContainer refreshControl={<RefreshControl refreshing={branches.isRefetching} onRefresh={() => void branches.refetch()} />}>
        <PageHeader
          title="Chi nhánh"
          subtitle="Quản lý chi nhánh công ty"
          right={
            <Pressable style={styles.addBtn} onPress={() => router.push('./branches/create')}>
              <MaterialCommunityIcons name="plus" size={18} color="#fff" />
              <Text style={styles.addBtnText}>Thêm mới</Text>
            </Pressable>
          }
        />
        <SearchInput value={search} onChangeText={setSearch} placeholder="Tìm chi nhánh..." />
        
        {branches.isLoading ? <LoadingState /> : null}
        {branches.isError ? <ErrorState error={branches.error} onRetry={() => void branches.refetch()} /> : null}
        {!branches.isLoading && !filteredItems?.length ? <EmptyState title="Chưa có chi nhánh" /> : null}
        
        <View style={styles.list}>
          {filteredItems?.map((branch) => (
            <Pressable key={branch.id} style={styles.card} onPress={() => router.push(`/admin/branches/${branch.id}/departments`)}>
              <View style={styles.cardHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 }}>
                  <View style={styles.iconBox}>
                    <MaterialCommunityIcons name="office-building" size={24} color="#111827" />
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle}>{branch.name}</Text>
                    <Text style={styles.cardSubtitle}>Mã: {branch.code}</Text>
                  </View>
                </View>
                <Pressable
                  style={styles.actionBtn}
                  onPress={() => handleDelete(branch.id, branch.name)}
                >
                  <MaterialCommunityIcons name="trash-can-outline" size={20} color="#111827" />
                </Pressable>
              </View>
              {branch.address ? <Text style={styles.cardDesc}>{branch.address}</Text> : null}
              {branch.departments && branch.departments.length > 0 ? (
                <Text style={styles.cardCount}>
                  {branch.departments.length} phòng ban
                </Text>
              ) : null}
            </Pressable>
          ))}
        </View>
      </ScreenContainer>
    </Screen>
  );
}

export function BranchCreateScreen() {
  const router = useRouter();
  const mutation = useCreateBranch();
  
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState<number | undefined>();
  const [longitude, setLongitude] = useState<number | undefined>();
  const [allowedIps, setAllowedIps] = useState('');
  const [mapVisible, setMapVisible] = useState(false);
  const [isFetchingIp, setIsFetchingIp] = useState(false);

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
      Alert.alert('Lỗi', 'Không thể lấy địa chỉ IP mạng hiện tại');
    } finally {
      setIsFetchingIp(false);
    }
  };

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
      };
      
      await mutation.mutateAsync(payload);
      Alert.alert('Thành công', 'Đã tạo chi nhánh mới', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      const normalized = normalizeApiError(error);
      Alert.alert('Lỗi', normalized.message);
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
          <View style={{ marginBottom: 16 }}>
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


    </Screen>
  );
}

export function BranchEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const branchQuery = useBranch(id!);
  const mutation = useUpdateBranch();
  
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState<number | undefined>();
  const [longitude, setLongitude] = useState<number | undefined>();
  const [allowedIps, setAllowedIps] = useState('');
  const [mapVisible, setMapVisible] = useState(false);
  const [isFetchingIp, setIsFetchingIp] = useState(false);

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
      Alert.alert('Lỗi', 'Không thể lấy địa chỉ IP mạng hiện tại');
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
      setLatitude(branchQuery.data.latitude);
      setLongitude(branchQuery.data.longitude);
      setAllowedIps((branchQuery.data as any).allowedIps?.join(', ') || '');
    }
  }, [branchQuery.data]);

  const submit = async () => {
    try {
      const payload: any = { id, code, name };
      if (address) payload.address = address;
      if (latitude !== undefined) payload.latitude = latitude;
      if (longitude !== undefined) payload.longitude = longitude;
      payload.allowedIps = allowedIps ? allowedIps.split(',').map(ip => ip.trim()).filter(Boolean) : [];

      await mutation.mutateAsync(payload);
      Alert.alert('Thành công', 'Đã lưu thay đổi chi nhánh', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      const normalized = normalizeApiError(error);
      Alert.alert('Lỗi', normalized.message);
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
            label="Mã chi nhánh (Cố định) *"
            value={code}
            onChangeText={() => {}}
            placeholder="Ví dụ: HN01"
            autoCapitalize="characters"
            editable={false}
          />
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
          <View style={{ marginBottom: 16 }}>
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
