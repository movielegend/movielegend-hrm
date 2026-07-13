import { useState } from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Screen } from '../../../src/components/Screen';
import { colors } from '../../../src/theme/colors';
import { spacing } from '../../../src/theme/spacing';
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
  const [activeTab, setActiveTab] = useState<EmployeeRequestStatus>('PENDING');
  const [selectedType, setSelectedType] = useState<EmployeeRequestType | 'ALL'>('ALL');

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['employee-requests', activeTab, selectedType],
    queryFn: () => getMyEmployeeRequests({
      status: activeTab,
      ...(selectedType !== 'ALL' ? { type: selectedType } : {})
    })
  });

  const requests = data?.data || [];

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
    <Screen>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable onPress={() => router.back()} style={styles.iconBtn}>
            <MaterialCommunityIcons name="chevron-left" size={28} color={colors.text} />
          </Pressable>
          <View>
            <Text style={styles.title}>Quản lý yêu cầu</Text>
            <View style={styles.dateSelector}>
              <Text style={styles.dateText}>Gần đây</Text>
            </View>
          </View>
        </View>
        <View style={styles.headerRight}>
          <Pressable style={styles.iconBtn}>
            <MaterialCommunityIcons name="tune-vertical" size={24} color={colors.text} />
          </Pressable>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
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

      {/* Categories Filter */}
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContainer}>
          {REQUEST_TYPES.map((t) => (
            <Pressable 
              key={t.type} 
              style={[styles.filterPill, selectedType === t.type && styles.filterPillActive]}
              onPress={() => setSelectedType(t.type)}
            >
              <MaterialCommunityIcons 
                name={t.icon} 
                size={16} 
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
            <MaterialCommunityIcons name="file-document-edit-outline" size={64} color={colors.primary} />
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
              <Pressable key={item.id} style={styles.card}>
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
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: spacing.md,
    backgroundColor: '#fff',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconBtn: {
    padding: spacing.xs,
    marginRight: spacing.sm,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  dateText: {
    fontSize: 14,
    color: colors.muted,
  },
  headerRight: {
    flexDirection: 'row',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginRight: spacing.lg,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.muted,
    marginRight: 6,
  },
  tabTextActive: {
    color: colors.primary,
  },
  filterContainer: {
    padding: spacing.md,
    paddingRight: spacing.xl,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterPillIcon: {
    marginRight: 4,
  },
  filterPillText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
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
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.muted,
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
    bottom: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  }
});
