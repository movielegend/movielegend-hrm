import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Screen } from '../../components/Screen';
import { PageHeader } from '../../components/PageHeader';
import { EmptyState } from '../../components/EmptyState';
import { colors } from '../../theme/colors';
import { getAssets, updateIncidentStatus } from '../../api/assets.api';
import type { AssetDto } from '../../types/asset.types';
import { normalizeApiError } from '../../utils/api-error';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';

export function AdminAssetConditionScreen() {
  const [tab, setTab] = useState<'PENDING' | 'APPROVE'>('PENDING');
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['adminAssetsCondition', tab],
    queryFn: () => getAssets(tab),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'BROKEN' | 'OK' }) => updateIncidentStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAssetsCondition'] });
      Toast.show({ type: 'success', text1: 'Đã cập nhật trạng thái' });
    },
    onError: (error) => {
      Alert.alert('Lỗi', normalizeApiError(error).message);
    }
  });

  const handleUpdate = (assetId: string, status: 'BROKEN' | 'OK') => {
    Alert.alert(
      'Xác nhận',
      `Bạn có chắc chắn đánh dấu vật tư này là ${status === 'BROKEN' ? 'Hỏng' : 'Chưa hỏng'}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Đồng ý', onPress: () => updateStatus.mutate({ id: assetId, status }) }
      ]
    );
  };

  const renderAsset = (asset: AssetDto) => {
    const dateStr = asset.updatedAt ? new Date(asset.updatedAt).toLocaleDateString('vi-VN') : '';
    
    return (
      <View key={asset.id} style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.assetName}>{asset.name}</Text>
          {asset.conditionStatus === 'PENDING' && (
            <View style={styles.badgePending}>
              <Text style={styles.badgeTextPending}>Đang chờ</Text>
            </View>
          )}
          {asset.conditionStatus === 'BROKEN' && (
            <View style={styles.badgeBroken}>
              <Text style={styles.badgeTextBroken}>Hỏng</Text>
            </View>
          )}
          {asset.conditionStatus === 'OK' && (
            <View style={styles.badgeOk}>
              <Text style={styles.badgeTextOk}>Tốt</Text>
            </View>
          )}
        </View>

        <Text style={styles.notes}>Ghi chú: {asset.conditionNote || 'Không có ghi chú'}</Text>
        <Text style={styles.date}>Ngày giờ cập nhật: {dateStr}</Text>

        {tab === 'PENDING' && (
          <View style={styles.actions}>
            <Pressable
              style={[styles.btn, styles.btnBroken]}
              onPress={() => handleUpdate(asset.id, 'BROKEN')}
            >
              <Ionicons name="close-circle-outline" size={20} color="#EF4444" />
              <Text style={styles.btnTextBroken}>Hỏng</Text>
            </Pressable>
            <Pressable
              style={[styles.btn, styles.btnOk]}
              onPress={() => handleUpdate(asset.id, 'OK')}
            >
              <Ionicons name="checkmark-circle-outline" size={20} color="#10B981" />
              <Text style={styles.btnTextOk}>Chưa hỏng</Text>
            </Pressable>
          </View>
        )}
      </View>
    );
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <PageHeader title="Sự cố tài sản" subtitle="Quản lý tình trạng hỏng hóc" />

        <View style={styles.tabs}>
          <Pressable
            style={[styles.tab, tab === 'PENDING' && styles.tabActive]}
            onPress={() => setTab('PENDING')}
          >
            <Text style={[styles.tabText, tab === 'PENDING' && styles.tabTextActive]}>PENDING</Text>
          </Pressable>
          <Pressable
            style={[styles.tab, tab === 'APPROVE' && styles.tabActive]}
            onPress={() => setTab('APPROVE')}
          >
            <Text style={[styles.tabText, tab === 'APPROVE' && styles.tabTextActive]}>APPROVE</Text>
          </Pressable>
        </View>

        <View style={{ marginTop: 16 }}>
          {query.isLoading ? (
            <ActivityIndicator style={{ marginVertical: 32 }} color="#000" />
          ) : !query.data || query.data.items.length === 0 ? (
            <EmptyState title="Trống" message="Không có tài sản nào trong mục này." />
          ) : (
            query.data.items.map(renderAsset)
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 4,
    marginBottom: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  tabActive: {
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
  },
  tabText: {
    fontWeight: '600',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#000',
  },
  card: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  assetName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
  },
  notes: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 4,
  },
  date: {
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  btnBroken: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  btnOk: {
    backgroundColor: '#ECFDF5',
    borderColor: '#6EE7B7',
  },
  btnTextBroken: {
    color: '#EF4444',
    fontWeight: '600',
  },
  btnTextOk: {
    color: '#10B981',
    fontWeight: '600',
  },
  badgePending: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeTextPending: {
    color: '#D97706',
    fontSize: 12,
    fontWeight: '600',
  },
  badgeBroken: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeTextBroken: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '600',
  },
  badgeOk: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeTextOk: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '600',
  }
});
