import { useState } from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Screen } from '../../../src/components/Screen';
import { colors } from '../../../src/theme/colors';
import { spacing } from '../../../src/theme/spacing';
import { shadows } from '../../../src/theme/shadows';
import { getMyEmployeeRequests } from '../../../src/api/employee-requests.api';
import type { EmployeeRequestType, EmployeeRequestStatus, EmployeeRequest } from '../../../src/types/request.types';

const REQUEST_TYPES: { type: EmployeeRequestType | 'ALL', label: string, icon: keyof typeof MaterialCommunityIcons.glyphMap, color: string }[] = [
  { type: 'ALL', label: 'Tất cả', icon: 'format-list-bulleted', color: colors.muted },
  { type: 'LEAVE', label: 'Nghỉ phép', icon: 'beach', color: '#10B981' },
  { type: 'ATTENDANCE_ADJUSTMENT', label: 'Giải trình công', icon: 'clock-edit-outline', color: '#F59E0B' },
  { type: 'OVERTIME', label: 'Làm thêm', icon: 'briefcase-clock-outline', color: '#6366F1' },
  { type: 'LATE_ARRIVAL', label: 'Đi muộn', icon: 'run', color: '#F43F5E' },
  { type: 'EARLY_LEAVE', label: 'Về sớm', icon: 'door-open', color: '#8B5CF6' },
  { type: 'BUSINESS_TRIP', label: 'Công tác', icon: 'airplane', color: '#3B82F6' },
  { type: 'ADVANCE', label: 'Tạm ứng', icon: 'cash', color: '#14B8A6' },
  { type: 'EXPENSE', label: 'Thanh toán', icon: 'receipt', color: '#F97316' },
];

export default function RequestsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<EmployeeRequestStatus | 'ALL'>('ALL');
  const [selectedType, setSelectedType] = useState<EmployeeRequestType | 'ALL'>('ALL');

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['employee-requests', activeTab, selectedType],
    queryFn: () => getMyEmployeeRequests({
      ...(activeTab !== 'ALL' ? { status: activeTab } : {}),
      ...(selectedType !== 'ALL' ? { type: selectedType } : {})
    })
  });
  const requests = data?.items || [];

  const getStatusColor = (status: EmployeeRequestStatus) => {
    switch (status) {
      case 'PENDING': return colors.warning;
      case 'APPROVED': return colors.success;
      case 'REJECTED': return colors.danger;
      default: return colors.muted;
    }
  };

  const getTypeConfig = (type: EmployeeRequestType) => {
    return REQUEST_TYPES.find(t => t.type === type) || REQUEST_TYPES[0];
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#FAFAFA' }}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#fff' }}>
        <View style={[styles.header, shadows.sm]}>
          <View style={styles.headerLeft}>
            <Pressable onPress={() => router.back()} style={styles.iconBtn}>
              <MaterialCommunityIcons name="chevron-left" size={32} color="#111827" />
            </Pressable>
            <View>
              <Text style={styles.title}>Quản lý yêu cầu</Text>
              <Text style={styles.dateText}>Gần đây</Text>
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <Pressable 
            style={[styles.tab, activeTab === 'ALL' && styles.tabActive]} 
            onPress={() => setActiveTab('ALL')}
          >
            <Text style={[styles.tabText, activeTab === 'ALL' && styles.tabTextActive]}>Tất cả</Text>
          </Pressable>
          <Pressable 
            style={[styles.tab, activeTab === 'PENDING' && styles.tabActive]} 
            onPress={() => setActiveTab('PENDING')}
          >
            <Text style={[styles.tabText, activeTab === 'PENDING' && styles.tabTextActive]}>Chờ duyệt</Text>
          </Pressable>
          <Pressable 
            style={[styles.tab, activeTab === 'APPROVED' && styles.tabActive]} 
            onPress={() => setActiveTab('APPROVED')}
          >
            <Text style={[styles.tabText, activeTab === 'APPROVED' && styles.tabTextActive]}>Chấp thuận</Text>
          </Pressable>
          <Pressable 
            style={[styles.tab, activeTab === 'REJECTED' && styles.tabActive]} 
            onPress={() => setActiveTab('REJECTED')}
          >
            <Text style={[styles.tabText, activeTab === 'REJECTED' && styles.tabTextActive]}>Từ chối</Text>
          </Pressable>
        </View>
      </SafeAreaView>

      {/* Categories Filter */}
      <View style={{ backgroundColor: '#FAFAFA', paddingTop: spacing.md, paddingBottom: spacing.sm }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContainer}>
          {REQUEST_TYPES.map((t) => (
            <Pressable 
              key={t.type} 
              style={[styles.filterPill, selectedType === t.type && styles.filterPillActive]}
              onPress={() => setSelectedType(t.type)}
            >
              <MaterialCommunityIcons 
                name={t.icon} 
                size={18} 
                color={selectedType === t.type ? '#fff' : t.color} 
                style={styles.filterPillIcon} 
              />
              <Text style={[styles.filterPillText, selectedType === t.type && styles.filterPillTextActive]}>
                {t.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* List */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : requests.length === 0 ? (
        <ScrollView 
          contentContainerStyle={styles.emptyContainer}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        >
          <View style={styles.emptyIconBg}>
            <MaterialCommunityIcons name="file-document-edit-outline" size={64} color="#9CA3AF" />
          </View>
          <Text style={styles.emptyText}>Chưa có yêu cầu nào</Text>
        </ScrollView>
      ) : (
        <ScrollView 
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        >
          {requests.map((item: EmployeeRequest) => {
            const config = getTypeConfig(item.type);
            const dateStr = item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : '';
            return (
              <Pressable 
                key={item.id} 
                style={styles.card}
                onPress={() => router.push(`/employee/requests/${item.id}`)}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.cardIconBox}>
                    <MaterialCommunityIcons name={config.icon} size={24} color={config.color} />
                  </View>
                  <View style={styles.cardHeaderRight}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.cardSubtitle}>{config.label} • {dateStr}</Text>
                  </View>
                  <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
                </View>
                <Text style={styles.cardContent} numberOfLines={2}>{item.content}</Text>
                {item.amount != null && (
                  <Text style={styles.cardAmount}>
                    Số tiền: {Number(item.amount).toLocaleString('vi-VN')} đ
                  </Text>
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {/* FAB */}
      <Pressable style={styles.fab} onPress={() => router.push('/employee/requests/create')}>
        <MaterialCommunityIcons name="plus" size={32} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: '#fff',
    zIndex: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    padding: 4,
    marginRight: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  dateText: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  tab: {
    marginRight: spacing.xl,
    paddingVertical: spacing.sm,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#111827',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  tabTextActive: {
    color: '#111827',
    fontWeight: '700',
  },
  filterContainer: {
    paddingHorizontal: spacing.lg,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  filterPillActive: {
    backgroundColor: '#111827',
  },
  filterPillIcon: {
    marginRight: 6,
  },
  filterPillText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  filterPillTextActive: {
    color: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  emptyIconBg: {
    marginBottom: spacing.lg,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#6B7280',
  },
  listContainer: {
    padding: spacing.md,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  cardIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  cardHeaderRight: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 13,
    color: colors.muted,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: spacing.sm,
  },
  cardContent: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  cardAmount: {
    marginTop: spacing.sm,
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.xxl,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  }
});
