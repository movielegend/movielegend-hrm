import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { FilterChip } from '../../components/FilterChip';
import { FormField } from '../../components/FormField';
import { LoadingState } from '../../components/LoadingState';
import { PageHeader } from '../../components/PageHeader';
import { PrimaryButton, SecondaryButton } from '../../components/Buttons';
import { Screen } from '../../components/Screen';
import { ScreenContainer } from '../../components/ScreenContainer';
import { SearchInput } from '../../components/SearchInput';
import { SectionCard } from '../../components/SectionCard';
import { StatusBadge } from '../../components/StatusBadge';
import {
  useCreateMaterial,
  useCreateMaterialCategory,
  useMaterial,
  useMaterialCategories,
  useMaterials,
  useUpdateMaterial,
} from '../../hooks/useMaterials';
import { useAuth } from '../../providers/AuthProvider';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { formatQuantity } from '../../utils/quantity';
import { hasPermission } from '../../utils/permissions';
import { mapWarehouseAssetError } from '../assets/asset.logic';

export function MaterialListScreen({ area }: { area: 'warehouse' | 'admin' }) {
  const router = useRouter();
  const { user } = useAuth();
  const materials = useMaterials();
  const categories = useMaterialCategories();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  const visible = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return (materials.data?.items ?? []).filter((material) => {
      if (keyword && !material.name.toLowerCase().includes(keyword) && !material.materialCode.toLowerCase().includes(keyword)) return false;
      if (categoryFilter !== 'ALL' && material.categoryId !== categoryFilter) return false;
      if (activeFilter === 'ACTIVE' && !material.isActive) return false;
      if (activeFilter === 'INACTIVE' && material.isActive) return false;
      return true;
    });
  }, [materials.data, search, categoryFilter, activeFilter]);

  const base = area === 'admin' ? '/admin/materials' : '/warehouse/materials';

  return (
    <Screen>
      <ScreenContainer refreshControl={<RefreshControl refreshing={materials.isRefetching} onRefresh={() => void materials.refetch()} />}>
        <PageHeader title="Vật tư" subtitle="Backend trả toàn bộ danh sách — tìm kiếm/lọc client-side (blocker B10)." />
        {hasPermission(user, 'material.create') ? (
          <PrimaryButton onPress={() => router.push(`${base}/create` as never)}>Tạo vật tư</PrimaryButton>
        ) : null}
        <SearchInput value={search} onChangeText={setSearch} placeholder="Tìm theo tên/mã" />
        <View style={styles.chipRow}>
          <FilterChip label="Tất cả nhóm" selected={categoryFilter === 'ALL'} onPress={() => setCategoryFilter('ALL')} />
          {categories.data?.items.map((category) => (
            <FilterChip
              key={category.id}
              label={category.name}
              selected={categoryFilter === category.id}
              onPress={() => setCategoryFilter(categoryFilter === category.id ? 'ALL' : category.id)}
            />
          ))}
        </View>
        <View style={styles.chipRow}>
          {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((option) => (
            <FilterChip key={option} label={option} selected={activeFilter === option} onPress={() => setActiveFilter(option)} />
          ))}
        </View>
        {materials.isLoading ? <LoadingState /> : null}
        {materials.isError ? <ErrorState error={materials.error} onRetry={() => void materials.refetch()} /> : null}
        {visible.map((material) => (
          <SectionCard key={material.id}>
            <View style={styles.headerRow}>
              <Text style={styles.title}>{material.name}</Text>
              <StatusBadge label={material.isActive ? 'ACTIVE' : 'INACTIVE'} tone={material.isActive ? 'success' : 'danger'} />
            </View>
            <Text style={styles.meta}>Mã: {material.materialCode} · Đơn vị: {material.unit}</Text>
            <Text style={styles.meta}>Nhóm: {material.category?.name ?? material.categoryId}</Text>
            <Text style={styles.meta}>
              Tồn tối thiểu: {formatQuantity(material.minimumStock)}
              {material.maximumStock !== null && typeof material.maximumStock !== 'undefined'
                ? ` · Tối đa: ${formatQuantity(material.maximumStock)}`
                : ''}
            </Text>
            {hasPermission(user, 'material.update') ? (
              <SecondaryButton onPress={() => router.push(`${base}/${material.id}` as never)}>Sửa</SecondaryButton>
            ) : null}
          </SectionCard>
        ))}
        {materials.data && !visible.length ? <EmptyState title="Không có vật tư" /> : null}
      </ScreenContainer>
    </Screen>
  );
}

export function MaterialCategoriesScreen() {
  const { user } = useAuth();
  const categories = useMaterialCategories();
  const create = useCreateMaterialCategory();
  const [code, setCode] = useState('');
  const [name, setName] = useState('');

  async function submit() {
    try {
      await create.mutateAsync({ code: code.trim(), name: name.trim() });
      Alert.alert('Thành công', 'Đã tạo nhóm vật tư');
      setCode('');
      setName('');
    } catch (error) {
      const mapped = mapWarehouseAssetError(error);
      Alert.alert(mapped.code, mapped.message);
    }
  }

  return (
    <Screen>
      <ScreenContainer refreshControl={<RefreshControl refreshing={categories.isRefetching} onRefresh={() => void categories.refetch()} />}>
        <PageHeader title="Nhóm vật tư" />
        {hasPermission(user, 'material.create') ? (
          <SectionCard title="Tạo nhóm">
            <FormField label="Mã nhóm" value={code} onChangeText={setCode} autoCapitalize="characters" />
            <FormField label="Tên nhóm" value={name} onChangeText={setName} />
            <PrimaryButton loading={create.isPending} disabled={!code.trim() || !name.trim()} onPress={() => void submit()}>
              Tạo nhóm
            </PrimaryButton>
          </SectionCard>
        ) : null}
        {categories.isLoading ? <LoadingState /> : null}
        {categories.isError ? <ErrorState error={categories.error} onRetry={() => void categories.refetch()} /> : null}
        {categories.data?.items.map((category) => (
          <SectionCard key={category.id}>
            <Text style={styles.title}>{category.name}</Text>
            <Text style={styles.meta}>Mã: {category.code}</Text>
            {category.description ? <Text style={styles.meta}>{category.description}</Text> : null}
          </SectionCard>
        ))}
        {categories.data && !categories.data.items.length ? <EmptyState title="Chưa có nhóm vật tư" /> : null}
      </ScreenContainer>
    </Screen>
  );
}

export function MaterialCreateScreen() {
  const router = useRouter();
  const categories = useMaterialCategories();
  const create = useCreateMaterial();
  const [categoryId, setCategoryId] = useState('');
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const [minimumStock, setMinimumStock] = useState('');
  const [maximumStock, setMaximumStock] = useState('');

  async function submit() {
    const minimum = Number(minimumStock);
    const maximum = Number(maximumStock);
    try {
      const material = await create.mutateAsync({
        categoryId,
        name: name.trim(),
        unit: unit.trim(),
        ...(minimumStock.trim() && Number.isFinite(minimum) ? { minimumStock: minimum } : {}),
        ...(maximumStock.trim() && Number.isFinite(maximum) ? { maximumStock: maximum } : {}),
      });
      Alert.alert('Thành công', `Đã tạo vật tư ${material.materialCode}`);
      router.back();
    } catch (error) {
      const mapped = mapWarehouseAssetError(error);
      Alert.alert(mapped.code, mapped.message);
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <PageHeader title="Tạo vật tư" subtitle="Mã vật tư backend tự sinh nếu bỏ trống." />
        <SectionCard>
          <Text style={styles.label}>Nhóm vật tư</Text>
          <View style={styles.chipRow}>
            {categories.data?.items.map((category) => (
              <FilterChip
                key={category.id}
                label={category.name}
                selected={categoryId === category.id}
                onPress={() => setCategoryId(category.id)}
              />
            ))}
          </View>
          <FormField label="Tên vật tư" value={name} onChangeText={setName} />
          <FormField label="Đơn vị" value={unit} onChangeText={setUnit} placeholder="cái, kg, thùng…" />
          <FormField label="Tồn tối thiểu (tùy chọn)" value={minimumStock} onChangeText={setMinimumStock} keyboardType="decimal-pad" />
          <FormField label="Tồn tối đa (tùy chọn)" value={maximumStock} onChangeText={setMaximumStock} keyboardType="decimal-pad" />
          <PrimaryButton
            loading={create.isPending}
            disabled={!categoryId || !name.trim() || !unit.trim()}
            onPress={() => void submit()}
          >
            Tạo vật tư
          </PrimaryButton>
        </SectionCard>
      </ScrollView>
    </Screen>
  );
}

export function MaterialEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const material = useMaterial(id);
  const update = useUpdateMaterial();
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const [minimumStock, setMinimumStock] = useState('');

  async function submit() {
    if (!id) return;
    const minimum = Number(minimumStock);
    try {
      await update.mutateAsync({
        id,
        payload: {
          ...(name.trim() ? { name: name.trim() } : {}),
          ...(unit.trim() ? { unit: unit.trim() } : {}),
          ...(minimumStock.trim() && Number.isFinite(minimum) ? { minimumStock: minimum } : {}),
        },
      });
      Alert.alert('Thành công', 'Đã cập nhật vật tư');
      router.back();
    } catch (error) {
      const mapped = mapWarehouseAssetError(error);
      Alert.alert(mapped.code, mapped.message);
    }
  }

  if (material.isLoading) return <LoadingState />;
  if (material.isError) return <ErrorState error={material.error} onRetry={() => void material.refetch()} />;
  if (!material.data) return <EmptyState title="Không tìm thấy vật tư" />;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <PageHeader title={`Sửa: ${material.data.name}`} subtitle={material.data.materialCode} />
        <SectionCard>
          <FormField label={`Tên (hiện tại: ${material.data.name})`} value={name} onChangeText={setName} />
          <FormField label={`Đơn vị (hiện tại: ${material.data.unit})`} value={unit} onChangeText={setUnit} />
          <FormField
            label={`Tồn tối thiểu (hiện tại: ${formatQuantity(material.data.minimumStock)})`}
            value={minimumStock}
            onChangeText={setMinimumStock}
            keyboardType="decimal-pad"
          />
          <PrimaryButton
            loading={update.isPending}
            disabled={!name.trim() && !unit.trim() && !minimumStock.trim()}
            onPress={() => void submit()}
          >
            Lưu
          </PrimaryButton>
        </SectionCard>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  content: {
    gap: spacing.lg,
    padding: spacing.lg,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  meta: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  title: {
    color: colors.text,
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
  },
});
