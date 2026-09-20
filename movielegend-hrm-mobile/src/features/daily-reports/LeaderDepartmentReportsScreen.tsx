import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Avatar } from '../../components/Avatar';
import { useAppAlert } from '../../contexts/AlertContext';
import {
  useDepartmentReports,
  useConvertPlanToTasks,
} from '../../hooks/useDailyReports';
import type { DepartmentReportItem, DailyReport } from '../../api/daily-reports.api';
import { colors } from '../../theme/colors';

function formatDateISO(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function LeaderDepartmentReportsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showAlert } = useAppAlert();

  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const dateStr = formatDateISO(currentDate);

  const deptReportsQuery = useDepartmentReports(undefined, dateStr);
  const convertTasksMutation = useConvertPlanToTasks('');

  // Selected report for modal detail view
  const [selectedReport, setSelectedReport] = useState<DailyReport | null>(null);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [selectedPlanItems, setSelectedPlanItems] = useState<string[]>([]);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);

  const handlePrevDate = () => {
    setCurrentDate((prev) => new Date(prev.getTime() - 24 * 60 * 60 * 1000));
  };
  const handleNextDate = () => {
    setCurrentDate((prev) => new Date(prev.getTime() + 24 * 60 * 60 * 1000));
  };
  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleOpenDetail = (item: DepartmentReportItem) => {
    if (!item.report) {
      showAlert('Chưa nộp báo cáo', `Nhân sự ${item.user.profile?.fullName || item.user.userCode} chưa gửi báo cáo ngày này.`);
      return;
    }
    setSelectedReport(item.report);
    setSelectedUser(item.user);
    setSelectedPlanItems(item.report.tomorrowPlan || []);
    setIsDetailModalVisible(true);
  };

  const togglePlanItemSelection = (plan: string) => {
    setSelectedPlanItems((prev) =>
      prev.includes(plan) ? prev.filter((p) => p !== plan) : [...prev, plan]
    );
  };

  const handleConvertSelectedPlanToTasks = async () => {
    if (!selectedReport || !selectedReport.id) return;
    if (selectedPlanItems.length === 0) {
      showAlert('Thông báo', 'Vui lòng chọn ít nhất 1 đầu mục kế hoạch để tạo Task');
      return;
    }

    try {
      await convertTasksMutation.mutateAsync({
        planItems: selectedPlanItems,
      });
      showAlert('Thành công', `Đã tạo ${selectedPlanItems.length} nhiệm vụ cho ${selectedUser?.profile?.fullName || 'nhân sự'} vào ngày mai!`);
      setIsDetailModalVisible(false);
    } catch (e: any) {
      console.error('Convert task error:', e);
      showAlert('Lỗi', e?.response?.data?.message || 'Không thể tạo task, vui lòng thử lại');
    }
  };

  const data = deptReportsQuery.data;
  const isToday = dateStr === formatDateISO(new Date());

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Báo Cáo Phòng Ban</Text>
          <Text style={styles.headerSubtitle}>Theo dõi & Duyệt kế hoạch nhân sự</Text>
        </View>
        <TouchableOpacity
          style={styles.myReportBtn}
          onPress={() => router.push('/leader/daily-report-form' as any)}
        >
          <Ionicons name="create-outline" size={16} color="#FFFFFF" />
          <Text style={styles.myReportBtnText}>Viết báo cáo</Text>
        </TouchableOpacity>
      </View>

      {/* Date Switcher */}
      <View style={styles.dateBar}>
        <TouchableOpacity onPress={handlePrevDate} style={styles.dateArrowBtn}>
          <Ionicons name="chevron-back" size={20} color="#2563EB" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleToday} style={styles.dateCenterBtn}>
          <Ionicons name="calendar-outline" size={16} color="#2563EB" />
          <Text style={styles.dateText}>
            {isToday ? 'Hôm nay: ' : ''}{dateStr}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleNextDate} style={styles.dateArrowBtn}>
          <Ionicons name="chevron-forward" size={20} color="#2563EB" />
        </TouchableOpacity>
      </View>

      {/* Summary Card */}
      {data && (
        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{data.totalMembers}</Text>
            <Text style={styles.summaryLabel}>Tổng nhân sự</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: '#16A34A' }]}>{data.submittedCount}</Text>
            <Text style={styles.summaryLabel}>Đã nộp</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: '#EF4444' }]}>
              {Math.max(0, data.totalMembers - data.submittedCount)}
            </Text>
            <Text style={styles.summaryLabel}>Chưa nộp</Text>
          </View>
        </View>
      )}

      {/* Members Report List */}
      {deptReportsQuery.isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={{ marginTop: 12, color: colors.muted, fontSize: 13 }}>Đang tải danh sách báo cáo...</Text>
        </View>
      ) : (
        <FlatList
          data={data?.memberReports || []}
          keyExtractor={(item) => item.user.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="clipboard-text-outline" size={48} color="#94A3B8" />
              <Text style={styles.emptyText}>Chưa có thành viên nào trong phòng ban</Text>
            </View>
          }
          renderItem={({ item }) => {
            const fullName = item.user.profile?.fullName || item.user.userCode || 'Nhân sự';
            const rep = item.report;
            const isSubmitted = item.isSubmitted;
            const hasObstacles = Boolean(rep?.obstacles && rep.obstacles.trim());

            return (
              <TouchableOpacity
                style={styles.memberCard}
                activeOpacity={0.8}
                onPress={() => handleOpenDetail(item)}
              >
                <View style={styles.memberAvatarWrapper}>
                  <Avatar
                    name={fullName}
                    uri={item.user.profile?.avatarUrl}
                    size={46}
                  />
                  {isSubmitted && (
                    <View style={styles.submittedCheckBadge}>
                      <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                    </View>
                  )}
                </View>

                <View style={styles.memberInfo}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={styles.memberName} numberOfLines={1}>{fullName}</Text>
                    {isSubmitted ? (
                      <View style={styles.statusBadgeGreen}>
                        <Text style={styles.statusTextGreen}>Đã nộp</Text>
                      </View>
                    ) : (
                      <View style={styles.statusBadgeRed}>
                        <Text style={styles.statusTextRed}>Chưa nộp</Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.memberCode}>Mã: {item.user.userCode}</Text>

                  {isSubmitted && rep ? (
                    <View style={styles.reportSnippetRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                        <Ionicons name="star" size={13} color="#F59E0B" />
                        <Text style={styles.snippetRating}>{rep.selfRating || 5}/5</Text>
                      </View>
                      {hasObstacles && (
                        <View style={styles.obstaclePill}>
                          <Ionicons name="warning" size={11} color="#DC2626" />
                          <Text style={styles.obstaclePillText}>Có vướng mắc</Text>
                        </View>
                      )}
                      {rep.tomorrowPlan && rep.tomorrowPlan.length > 0 && (
                        <Text style={styles.planCountText}>
                          📋 {rep.tomorrowPlan.length} kế hoạch
                        </Text>
                      )}
                    </View>
                  ) : (
                    <Text style={styles.pendingHintText}>Chưa gửi báo cáo trong ngày</Text>
                  )}
                </View>

                <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* ── DETAIL MODAL ── */}
      <Modal
        visible={isDetailModalVisible}
        animationType="slide"
        onRequestClose={() => setIsDetailModalVisible(false)}
      >
        <View style={[styles.modalScreen, { paddingTop: insets.top }]}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setIsDetailModalVisible(false)} style={{ padding: 4 }}>
              <Ionicons name="close" size={24} color="#0F172A" />
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.modalTitle} numberOfLines={1}>
                Báo cáo: {selectedUser?.profile?.fullName || selectedUser?.userCode}
              </Text>
              <Text style={styles.modalSubtitle}>Ngày: {selectedReport?.reportDate}</Text>
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.modalScrollContent}>
            {/* Self Rating Snippet */}
            <View style={styles.modalCard}>
              <Text style={styles.sectionHeading}>⭐ ĐÁNH GIÁ CỦA NHÂN VIÊN</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginVertical: 6 }}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Ionicons
                    key={s}
                    name={s <= (selectedReport?.selfRating || 5) ? 'star' : 'star-outline'}
                    size={20}
                    color="#F59E0B"
                  />
                ))}
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#B45309', marginLeft: 6 }}>
                  {selectedReport?.selfRating || 5}/5 sao
                </Text>
              </View>
              {selectedReport?.selfReview && (
                <Text style={{ fontSize: 13, fontStyle: 'italic', color: '#475569' }}>
                  “{selectedReport.selfReview}”
                </Text>
              )}
            </View>

            {/* Metrics */}
            {selectedReport?.metrics && selectedReport.metrics.length > 0 && (
              <View style={styles.modalCard}>
                <Text style={styles.sectionHeading}>📊 KẾT QUẢ ĐỊNH LƯỢNG</Text>
                {selectedReport.metrics.map((m, idx) => (
                  <View key={idx} style={styles.metricItemRow}>
                    <Text style={styles.metricItemName}>{m.name}:</Text>
                    <Text style={styles.metricItemValue}>{String(m.value || '-')}</Text>
                    {m.note && <Text style={styles.metricItemNote}>({m.note})</Text>}
                  </View>
                ))}
              </View>
            )}

            {/* Completed Tasks */}
            {selectedReport?.completedTasks && selectedReport.completedTasks.length > 0 && (
              <View style={styles.modalCard}>
                <Text style={[styles.sectionHeading, { color: '#16A34A' }]}>✅ CÔNG VIỆC ĐÃ HOÀN THÀNH</Text>
                {selectedReport.completedTasks.map((t, idx) => (
                  <View key={idx} style={styles.bulletItemRow}>
                    <Ionicons name="checkmark-circle" size={16} color="#16A34A" />
                    <Text style={styles.bulletItemText}>{t.title}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* In Progress Tasks */}
            {selectedReport?.inProgressTasks && selectedReport.inProgressTasks.length > 0 && (
              <View style={styles.modalCard}>
                <Text style={[styles.sectionHeading, { color: '#2563EB' }]}>⏳ CÔNG VIỆC DỞ DANG</Text>
                {selectedReport.inProgressTasks.map((t, idx) => (
                  <View key={idx} style={styles.inProgressDetailItem}>
                    <Text style={styles.inProgressDetailTitle}>• {t.title}</Text>
                    {t.expectedDate && (
                      <Text style={styles.inProgressDetailSub}>Hạn dự kiến: {t.expectedDate}</Text>
                    )}
                    {t.note && (
                      <Text style={styles.inProgressDetailSub}>Lý do: {t.note}</Text>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* Obstacles */}
            {selectedReport?.obstacles && (
              <View style={[styles.modalCard, { backgroundColor: '#FFF1F2', borderColor: '#FECDD3' }]}>
                <Text style={[styles.sectionHeading, { color: '#DC2626' }]}>⚠️ KHÓ KHĂN / VƯỚNG MẮC</Text>
                <Text style={{ fontSize: 13, color: '#991B1B', lineHeight: 20 }}>
                  {selectedReport.obstacles}
                </Text>
              </View>
            )}

            {/* Tomorrow Plan & Task Conversion */}
            {selectedReport?.tomorrowPlan && selectedReport.tomorrowPlan.length > 0 && (
              <View style={[styles.modalCard, { backgroundColor: '#FAF5FF', borderColor: '#E9D5FF' }]}>
                <Text style={[styles.sectionHeading, { color: '#9333EA' }]}>📋 KẾ HOẠCH NGÀY MAI</Text>
                <Text style={{ fontSize: 12, color: '#7E22CE', marginBottom: 10, fontStyle: 'italic' }}>
                  Tích chọn các đầu mục để chuyển thành Task chính thức giao cho nhân sự ngày mai:
                </Text>

                {selectedReport.tomorrowPlan.map((plan, idx) => {
                  const isChecked = selectedPlanItems.includes(plan);
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={styles.planCheckRow}
                      onPress={() => togglePlanItemSelection(plan)}
                    >
                      <Ionicons
                        name={isChecked ? 'checkbox' : 'square-outline'}
                        size={20}
                        color={isChecked ? '#9333EA' : '#94A3B8'}
                      />
                      <Text style={[styles.planCheckText, isChecked && { fontWeight: '700', color: '#581C87' }]}>
                        {plan}
                      </Text>
                    </TouchableOpacity>
                  );
                })}

                <TouchableOpacity
                  style={styles.convertTaskBtn}
                  onPress={handleConvertSelectedPlanToTasks}
                  disabled={convertTasksMutation.isPending || selectedPlanItems.length === 0}
                >
                  {convertTasksMutation.isPending ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="flash" size={16} color="#FFFFFF" />
                      <Text style={styles.convertTaskBtnText}>
                        Chuyển {selectedPlanItems.length} mục thành Task ngày mai
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 10,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  myReportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  myReportBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  dateBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  dateArrowBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  dateCenterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
  },
  dateText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E40AF',
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginBottom: 8,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  summaryLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 10,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  memberAvatarWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  submittedCheckBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#16A34A',
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  memberCode: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  statusBadgeGreen: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusTextGreen: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16A34A',
  },
  statusBadgeRed: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusTextRed: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  reportSnippetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  snippetRating: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
  },
  obstaclePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  obstaclePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#DC2626',
  },
  planCountText: {
    fontSize: 11,
    color: '#6B21A8',
  },
  pendingHintText: {
    fontSize: 12,
    color: '#94A3B8',
    fontStyle: 'italic',
    marginTop: 4,
  },
  modalScreen: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  modalScrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  metricItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  metricItemName: {
    fontSize: 13,
    color: '#475569',
  },
  metricItemValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  metricItemNote: {
    fontSize: 12,
    color: '#94A3B8',
  },
  bulletItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  bulletItemText: {
    fontSize: 13,
    color: '#0F172A',
    flex: 1,
  },
  inProgressDetailItem: {
    marginBottom: 8,
  },
  inProgressDetailTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  inProgressDetailSub: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 12,
    marginTop: 2,
  },
  planCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F3E8FF',
  },
  planCheckText: {
    fontSize: 13,
    color: '#334155',
    flex: 1,
  },
  convertTaskBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#9333EA',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 14,
  },
  convertTaskBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
