import { useRouter } from 'expo-router';
import { useState } from 'react';
import { RefreshControl, StyleSheet, Text, View, Pressable, Alert } from 'react-native';
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
import { useBranches, useCreateBranch, useDeleteBranch } from '../../api/branches.api';
import { getDepartments } from '../../api/departments.api';
import { useQuery } from '@tanstack/react-query';
import { colors } from '../../theme/colors';
import { normalizeApiError } from '../../utils/api-error';
import { MultiSelectModal } from '../../components/MultiSelectModal';

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
              <MaterialCommunityIcons name="plus" size={20} color="#fff" />
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
            <View key={branch.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.iconBox}>
                  <MaterialCommunityIcons name="domain" size={24} color={colors.primary} />
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle}>{branch.name}</Text>
                  <Text style={styles.cardSubtitle}>Mã: {branch.code}</Text>
                  {branch.address ? <Text style={styles.cardDesc}>{branch.address}</Text> : null}
                  {branch.departments && branch.departments.length > 0 ? (
                    <Text style={{ fontSize: 12, color: colors.primary, marginTop: 4 }}>
                      {branch.departments.length} phòng ban
                    </Text>
                  ) : null}
                </View>
                <Pressable
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(branch.id, branch.name)}
                >
                  <MaterialCommunityIcons name="trash-can-outline" size={20} color={colors.danger} />
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      </ScreenContainer>
    </Screen>
  );
}

import { LocationPickerMap, LocationData } from '../../components/LocationPickerMap';

export function BranchCreateScreen() {
  const router = useRouter();
  const mutation = useCreateBranch();
  
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState<number | undefined>();
  const [longitude, setLongitude] = useState<number | undefined>();
  const [departmentIds, setDepartmentIds] = useState<string[]>([]);
  const [mapVisible, setMapVisible] = useState(false);
  const [deptModalVisible, setDeptModalVisible] = useState(false);

  const departments = useQuery({
    queryKey: ['departments'],
    queryFn: () => getDepartments({ limit: 1000 })
  });

  const submit = async () => {
    try {
      const payload: any = { code, name };
      if (address) payload.address = address;
      if (latitude !== undefined) payload.latitude = latitude;
      if (longitude !== undefined) payload.longitude = longitude;
      if (departmentIds.length > 0) payload.departmentIds = departmentIds;

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
            label="Mã chi nhánh *"
            value={code}
            onChangeText={setCode}
            placeholder="Ví dụ: HN01"
            autoCapitalize="characters"
          />
          <FormField
            label="Tên chi nhánh *"
            value={name}
            onChangeText={setName}
            placeholder="Ví dụ: Chi nhánh Hà Nội"
          />
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#0B3B61', marginBottom: 8 }}>Vị trí / Địa chỉ</Text>
            <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: address ? '#333' : '#98A0A8', fontSize: 15 }} numberOfLines={2}>
                  {address || 'Chưa chọn vị trí'}
                </Text>
                {latitude && longitude && (
                  <Text style={{ fontSize: 12, color: '#1E88E5', marginTop: 4 }}>
                    {latitude.toFixed(6)}, {longitude.toFixed(6)}
                  </Text>
                )}
              </View>
              <Pressable 
                onPress={() => setMapVisible(true)}
                style={{
                  backgroundColor: '#E0F2FE',
                  padding: 12,
                  borderRadius: 8,
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <MaterialCommunityIcons name="map-marker-radius" size={24} color="#0284C7" />
              </Pressable>
            </View>
          </View>

          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#0B3B61', marginBottom: 8 }}>Phòng ban thuộc chi nhánh</Text>
            <Pressable
              onPress={() => setDeptModalVisible(true)}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 12,
                padding: 12,
                backgroundColor: colors.surface,
              }}
            >
              <Text style={{ color: departmentIds.length ? colors.text : colors.muted, fontSize: 15 }}>
                {departmentIds.length > 0
                  ? `Đã chọn ${departmentIds.length} phòng ban`
                  : 'Chọn phòng ban'}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={24} color={colors.muted} />
            </Pressable>
          </View>

          <PrimaryButton 
            loading={mutation.isPending} 
            disabled={!code || !name} 
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

      <MultiSelectModal
        visible={deptModalVisible}
        title="Chọn phòng ban"
        options={(departments.data?.items ?? []).map((d: any) => ({ id: d.id, label: d.name, subtitle: d.code }))}
        selectedValues={departmentIds}
        onSelect={setDepartmentIds}
        onClose={() => setDeptModalVisible(false)}
        isLoading={departments.isLoading}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E6EEF3',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F0F8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: { flex: 1 },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0B3B61',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#1E88E5',
    fontWeight: '600',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 13,
    color: '#98A0A8',
  },
  deleteBtn: {
    padding: 8,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
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
