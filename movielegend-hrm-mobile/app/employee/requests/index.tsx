import { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Modal,
  FlatList,
  StatusBar,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getMyEmployeeRequests } from '../../../src/api/employee-requests.api';
import type { EmployeeRequestType, EmployeeRequestStatus, EmployeeRequest } from '../../../src/types/request.types';

const REQUEST_TYPES: {
  type: EmployeeRequestType | 'ALL';
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
  bg?: string;
}[] = [
  { type: 'ALL', label: 'Tất cả loại yêu cầu', icon: 'format-list-bulleted', color: '#102739', bg: '#E7F0F7' },
  { type: 'LEAVE', label: 'Nghỉ phép', icon: 'beach', color: '#10B981', bg: '#ECFDF5' },
  { type: 'ATTENDANCE_ADJUSTMENT', label: 'Giải trình công', icon: 'clock-edit-outline', color: '#F59E0B', bg: '#FEF3C7' },
  { type: 'OVERTIME', label: 'Làm thêm', icon: 'briefcase-clock-outline', color: '#6366F1', bg: '#EEF2FF' },
  { type: 'LATE_ARRIVAL', label: 'Đi muộn', icon: 'run', color: '#EF4444', bg: '#FEE2E2' },
  { type: 'EARLY_LEAVE', label: 'Về sớm', icon: 'door-open', color: '#8B5CF6', bg: '#F3E8FF' },
  { type: 'BUSINESS_TRIP', label: 'Công tác', icon: 'airplane', color: '#3B82F6', bg: '#EFF6FF' },
  { type: 'ADVANCE', label: 'Tạm ứng', icon: 'cash', color: '#0D9488', bg: '#CCFBF1' },
  { type: 'EXPENSE', label: 'Thanh toán', icon: 'receipt', color: '#F97316', bg: '#FFF7ED' },
];

export default function RequestsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<EmployeeRequestStatus | 'ALL'>('ALL');
  const [selectedType, setSelectedType] = useState<EmployeeRequestType | 'ALL'>('ALL');
  const [showTypeModal, setShowTypeModal] = useState(false);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['employee-requests', activeTab, selectedType],
    queryFn: () =>
      getMyEmployeeRequests({
        ...(activeTab !== 'ALL' ? { status: activeTab } : {}),
        ...(selectedType !== 'ALL' ? { type: selectedType } : {}),
      }),
  });
  const requests = data?.items || [];

  const getStatusDisplay = (item: any) => {
    const status = item?.status;
    const meta =
      typeof item?.attachmentMetadata === 'object' && item?.attachmentMetadata !== null
        ? item.attachmentMetadata
        : {};
    const stage = meta.stage;

    if (status === 'REJECTED') {
      return { text: 'Từ chối', color: '#DC2626', bg: '#FEE2E2' };
    }
    if (status === 'APPROVED') {
      if (meta.disbursementProofUrl || stage === 'DISBURSED') {
        return { text: 'Đã giải ngân', color: '#0D9488', bg: '#CCFBF1' };
      }
      return { text: 'Chấp thuận', color: '#15803D', bg: '#DCFCE7' };
    }
    if (status === 'PENDING') {
      switch (stage) {
        case 'PENDING_LEADER':
          return { text: 'Chờ Leader duyệt', color: '#B45309', bg: '#FEF3C7' };
        case 'PENDING_HR':
          return { text: 'Chờ HR đối chứng', color: '#1D4ED8', bg: '#DBEAFE' };
        case 'PENDING_ADMIN':
          return { text: 'Chờ BGĐ duyệt', color: '#6D28D9', bg: '#EDE9FE' };
        case 'PENDING_DISBURSEMENT':
        case 'PENDING_ACCOUNTANT':
          return { text: 'Chờ giải ngân', color: '#C2410C', bg: '#FFEDD5' };
        default:
          return { text: 'Chờ duyệt', color: '#B45309', bg: '#FEF3C7' };
      }
    }
    return { text: 'Không rõ', color: '#64748B', bg: '#F1F5F9' };
  };

  const defaultTypeConfig = REQUEST_TYPES[0]!;

  const getTypeConfig = (type: EmployeeRequestType) => {
    return REQUEST_TYPES.find((t) => t.type === type) || defaultTypeConfig;
  };

  const currentTypeConfig = REQUEST_TYPES.find((t) => t.type === selectedType) || defaultTypeConfig;

  const safeTopInset = Math.max((insets.top > 0 ? insets.top : (StatusBar.currentHeight || 20)) - 6, 8);

  const tabs: { key: EmployeeRequestStatus | 'ALL'; label: string }[] = [
    { key: 'ALL', label: 'Tất cả' },
    { key: 'PENDING', label: 'Chờ duyệt' },
    { key: 'APPROVED', label: 'Chấp thuận' },
    { key: 'REJECTED', label: 'Từ chối' },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#102739" translucent={Platform.OS === 'android'} />

      {/* Top Header Banner */}
      <View style={[styles.headerBanner, { paddingTop: safeTopInset }]}>
        <View style={styles.headerTopRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12} accessibilityLabel="Quay lại">
            <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
          </Pressable>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerBrand}>MOVIE LEGEND</Text>
            <Text style={styles.headerTitle}>Đơn từ & Đề xuất</Text>
            <Text style={styles.headerSubtitle}>Theo dõi và quản lý các yêu cầu của bạn</Text>
          </View>
          <View style={styles.headerRightPlaceholder} />
        </View>
      </View>

      {/* Body Container */}
      <View style={styles.bodyContainer}>
        {/* Underline Tabs */}
        <View style={styles.tabsContainer}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <Pressable key={tab.key} style={styles.tabBtn} onPress={() => setActiveTab(tab.key)}>
                <Text style={[styles.tabBtnText, isActive && styles.tabBtnTextActive]}>{tab.label}</Text>
                {isActive && <View style={styles.activeTabIndicator} />}
              </Pressable>
            );
          })}
        </View>

        {/* Dropdown Card: Loại yêu cầu */}
        <Pressable style={styles.filterCard} onPress={() => setShowTypeModal(true)}>
          <View style={[styles.filterIconBox, { backgroundColor: currentTypeConfig.bg || '#E7F0F7' }]}>
            <MaterialCommunityIcons name={currentTypeConfig.icon} size={20} color={currentTypeConfig.color || '#102739'} />
          </View>
          <View style={styles.filterTextWrap}>
            <Text style={styles.filterLabel}>Loại yêu cầu</Text>
            <Text style={styles.filterValue} numberOfLines={1}>
              {currentTypeConfig.label}
            </Text>
          </View>
          <Ionicons name="chevron-down" size={18} color="#64748B" />
        </Pressable>

        {/* Section Header: Gần đây & Count */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Gần đây</Text>
          <Text style={styles.sectionCountText}>{requests.length} yêu cầu</Text>
        </View>

        {/* List of Requests */}
        {isLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#102739" />
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={() => void refetch()}
                colors={['#102739']}
              />
            }
            showsVerticalScrollIndicator={false}
          >
            {requests.length === 0 ? (
              <View style={styles.emptyCard}>
                <View style={styles.emptyIconCircle}>
                  <MaterialCommunityIcons name="file-document-outline" size={42} color="#102739" />
                </View>
                <Text style={styles.emptyTitle}>Chưa có yêu cầu nào</Text>
                <Text style={styles.emptySubtitle}>Các yêu cầu của bạn sẽ xuất hiện tại đây.</Text>
              </View>
            ) : (
              requests.map((item: EmployeeRequest) => {
                const config = getTypeConfig(item.type);
                const dateStr = item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : '';
                const statusObj = getStatusDisplay(item);
                return (
                  <Pressable
                    key={item.id}
                    style={styles.card}
                    onPress={() => router.push(`/employee/requests/${item.id}`)}
                    android_ripple={{ color: 'rgba(0,0,0,0.05)' }}
                  >
                    <View style={styles.cardHeader}>
                      <View style={[styles.cardIconBox, { backgroundColor: config.bg || '#E7F0F7' }]}>
                        <MaterialCommunityIcons name={config.icon} size={22} color={config.color || '#102739'} />
                      </View>
                      <View style={styles.cardHeaderRight}>
                        <Text style={styles.cardTitle} numberOfLines={1}>
                          {item.title}
                        </Text>
                        <Text style={styles.cardSubtitle}>
                          {config.label} • {dateStr}
                        </Text>
                      </View>
                      <View style={styles.cardStatusWrap}>
                        <View style={[styles.statusBadge, { backgroundColor: statusObj.bg }]}>
                          <Text style={[styles.statusBadgeText, { color: statusObj.color }]}>
                            {statusObj.text}
                          </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color="#94A3B8" style={{ marginLeft: 6 }} />
                      </View>
                    </View>

                    {item.content ? (
                      <View style={styles.cardDivider}>
                        <Text style={styles.cardContent} numberOfLines={2}>
                          {item.content}
                        </Text>
                      </View>
                    ) : null}

                    {item.amount != null && (
                      <Text style={styles.cardAmount}>
                        Số tiền: {Number(item.amount).toLocaleString('vi-VN')} VNĐ
                      </Text>
                    )}
                  </Pressable>
                );
              })
            )}
          </ScrollView>
        )}

        {/* Bottom Button */}
        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <Pressable
            style={styles.createBtn}
            onPress={() => router.push('/employee/requests/create')}
            android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
          >
            <Ionicons name="add" size={22} color="#FFFFFF" />
            <Text style={styles.createBtnText}>Tạo yêu cầu</Text>
          </Pressable>
        </View>
      </View>

      {/* Modal Chọn Loại Yêu Cầu */}
      <Modal visible={showTypeModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn loại yêu cầu</Text>
              <Pressable onPress={() => setShowTypeModal(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={22} color="#0F172A" />
              </Pressable>
            </View>
            <FlatList
              data={REQUEST_TYPES}
              keyExtractor={(item) => item.type}
              renderItem={({ item }) => {
                const isSelected = selectedType === item.type;
                return (
                  <Pressable
                    style={[styles.modalItem, isSelected && styles.modalItemSelected]}
                    onPress={() => {
                      setSelectedType(item.type);
                      setShowTypeModal(false);
                    }}
                  >
                    <View style={[styles.modalIconWrap, { backgroundColor: item.bg || '#E7F0F7' }]}>
                      <MaterialCommunityIcons name={item.icon} size={20} color={item.color || '#102739'} />
                    </View>
                    <Text style={[styles.modalItemTitle, isSelected && styles.modalItemTitleSelected]}>
                      {item.label}
                    </Text>
                    {isSelected && <Ionicons name="checkmark" size={20} color="#102739" />}
                  </Pressable>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#102739',
  },
  headerBanner: {
    backgroundColor: '#102739',
    paddingHorizontal: 16,
    paddingBottom: 22,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerTitleWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBrand: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: 'rgba(255, 255, 255, 0.7)',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12.5,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
  },
  headerRightPlaceholder: {
    width: 36,
  },
  bodyContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -10,
    overflow: 'hidden',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 8,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    position: 'relative',
  },
  tabBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  tabBtnTextActive: {
    color: '#102739',
    fontWeight: '800',
  },
  activeTabIndicator: {
    position: 'absolute',
    bottom: 0,
    width: 36,
    height: 3,
    backgroundColor: '#102739',
    borderRadius: 2,
  },
  filterCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginHorizontal: 16,
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  filterIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  filterTextWrap: {
    flex: 1,
  },
  filterLabel: {
    fontSize: 11.5,
    color: '#64748B',
    marginBottom: 2,
  },
  filterValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionCountText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 56,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E7F0F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  cardHeaderRight: {
    flex: 1,
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#64748B',
  },
  cardStatusWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  cardDivider: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  cardContent: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  cardAmount: {
    marginTop: 6,
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0284C7',
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  createBtn: {
    backgroundColor: '#102739',
    height: 50,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#102739',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  createBtnText: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    minHeight: '45%',
    maxHeight: '80%',
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalItemSelected: {
    backgroundColor: '#E7F0F7',
  },
  modalIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  modalItemTitle: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: '600',
    color: '#0F172A',
  },
  modalItemTitleSelected: {
    color: '#102739',
    fontWeight: '800',
  },
});
