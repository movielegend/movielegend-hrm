import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useDepartments } from '../../hooks/useDepartments';
import { useEmployees } from '../../hooks/useEmployees';

export interface SubTaskProgressItem {
  id: string;
  bulletTitle: string;
  assigneeName: string;
  assigneeRole: string;
  completionRate: number; // 0 to 100%
  status: 'COMPLETED' | 'IN_PROGRESS' | 'NOT_STARTED';
}

export interface AdminReviewItem {
  id: string;
  employeeId: string;
  userName: string;
  departmentId: string;
  departmentName: string;
  currentLevelNumber: number;
  currentLevelName: string;
  targetLevelNumber: number;
  targetLevelName: string;
  projectName: string;
  rewardPhysicalItem: string;
  promotionBonusAmount: number;
  retentionMultiplier: number;
  subTasks: SubTaskProgressItem[];
  overallProjectProgress: number; // calculated %
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export const AdminMonthlyReviewScreen: React.FC = () => {
  const { data: realDeptData, isLoading: isDeptLoading } = useDepartments({ limit: 100 });
  const { data: realEmpData } = useEmployees({ limit: 100 });

  const realDeptList = realDeptData?.data || realDeptData?.items || (Array.isArray(realDeptData) ? realDeptData : []);
  const realEmpList = realEmpData?.data || realEmpData?.items || (Array.isArray(realEmpData) ? realEmpData : []);

  const departments = realDeptList.map((d: any) => ({ id: d.id || d._id, name: d.name || 'Phòng ban' }));

  const [selectedDeptId, setSelectedDeptId] = useState<string>(departments[0]?.id || 'dept-1');
  const [selectedMonth, setSelectedMonth] = useState<string>('Tháng 09/2026');

  const availableMonths = ['Tháng 09/2026', 'Tháng 10/2026', 'Tháng 11/2026', 'Tháng 12/2026'];

  // Default Review Items grouped by department with sub-task assignees and completion rates
  const [reviewItems, setReviewItems] = useState<Record<string, AdminReviewItem[]>>({
    'dept-1': [
      {
        id: 'rev-1',
        employeeId: 'emp-101',
        userName: 'Trần Thị B (Trưởng Ca Live)',
        departmentId: 'dept-1',
        departmentName: 'Livestream Hà Nội',
        currentLevelNumber: 2,
        currentLevelName: 'Level 2',
        targetLevelNumber: 3,
        targetLevelName: 'Level 3',
        projectName: 'Dự Án Level 3: Tối Ưu Năng Suất Chuyên Sâu Ca Live',
        rewardPhysicalItem: 'Tai nghe Bluetooth Chống ồn cao cấp',
        promotionBonusAmount: 3000000,
        retentionMultiplier: 1.25,
        subTasks: [
          {
            id: 'st-1',
            bulletTitle: '• Đạt tổng Doanh số KPI cá nhân 300 Trđ',
            assigneeName: 'Trần Thị B',
            assigneeRole: 'Chủ trì chính',
            completionRate: 100,
            status: 'COMPLETED',
          },
          {
            id: 'st-2',
            bulletTitle: '• Hướng dẫn & kèm cặp 1 nhân sự mới Level 1',
            assigneeName: 'Trần Thị B (Kèm cặp Nguyễn Văn D)',
            assigneeRole: 'Người hướng dẫn',
            completionRate: 90,
            status: 'IN_PROGRESS',
          },
          {
            id: 'st-3',
            bulletTitle: '• Đề xuất 1 kịch bản chốt đơn ngắn đỉnh điểm',
            assigneeName: 'Trần Thị B',
            assigneeRole: 'Sáng tạo nội dung',
            completionRate: 100,
            status: 'COMPLETED',
          },
        ],
        overallProjectProgress: 96,
        status: 'PENDING',
      },
    ],
    'dept-2': [
      {
        id: 'rev-2',
        employeeId: 'emp-102',
        userName: 'Nguyễn Văn A (Senior Streamer)',
        departmentId: 'dept-2',
        departmentName: 'Livestream HCM',
        currentLevelNumber: 4,
        currentLevelName: 'Level 4',
        targetLevelNumber: 5,
        targetLevelName: 'Level 5',
        projectName: 'Dự Án Level 5: Bứt Phá Doanh Số 1 Tỷđ & Quản Trị Đỉnh Cao',
        rewardPhysicalItem: 'Laptop MacBook Air M3 + 1 Cây Vàng 9999',
        promotionBonusAmount: 8000000,
        retentionMultiplier: 1.6,
        subTasks: [
          {
            id: 'st-4',
            bulletTitle: '• Đảm nhận và hoàn thành 30 ca đỉnh điểm',
            assigneeName: 'Nguyễn Văn A',
            assigneeRole: 'Main Host',
            completionRate: 100,
            status: 'COMPLETED',
          },
          {
            id: 'st-5',
            bulletTitle: '• Đạt tổng Doanh số cá nhân 820Trđ - 1 Tỷđ',
            assigneeName: 'Nguyễn Văn A',
            assigneeRole: 'Main Host',
            completionRate: 100,
            status: 'COMPLETED',
          },
          {
            id: 'st-6',
            bulletTitle: '• Tỷ lệ hoàn thành Task SLA đúng hạn ≥ 98%',
            assigneeName: 'Nguyễn Văn A & Hỗ trợ kỹ thuật HCM',
            assigneeRole: 'Đồng phụ trách',
            completionRate: 98,
            status: 'COMPLETED',
          },
        ],
        overallProjectProgress: 99,
        status: 'PENDING',
      },
    ],
  });

  const activeDept = departments.find((d) => d.id === selectedDeptId) || departments[0] || { id: 'dept-1', name: 'Livestream Hà Nội' };
  const currentDeptItems = reviewItems[selectedDeptId] || reviewItems['dept-1'] || [];

  const handleApproveLevel = (item: AdminReviewItem) => {
    setReviewItems((prev) => {
      const list = prev[selectedDeptId] || currentDeptItems;
      const updatedList = list.map((rev) =>
        rev.id === item.id ? { ...rev, status: 'APPROVED' as const } : rev
      );
      return { ...prev, [selectedDeptId]: updatedList };
    });

    Alert.alert(
      'CHỐT PHÊ DUYỆT THĂNG CẤP THÀNH CÔNG! ✓',
      `Đã duyệt thăng cấp chính thức cho nhân sự: ${item.userName}\n\n• Cấp bậc mới: ${item.targetLevelName}\n• Quà hiện vật: ${item.rewardPhysicalItem}\n• Thưởng nóng: ${item.promotionBonusAmount.toLocaleString('vi-VN')} VNĐ\n• Hệ số Tết mới: ${item.retentionMultiplier}x`,
      [{ text: 'Đóng' }]
    );
  };

  const handleRejectLevel = (item: AdminReviewItem) => {
    Alert.alert(
      'Yêu Cầu Bổ Sung Hợp Đồng Dự Án',
      `Nhân sự ${item.userName} chưa đạt 100% tiến độ việc con. Đã gửi thông báo yêu cầu hoàn thiện dự án Level trước khi xét duyệt lại!`,
      [{ text: 'Đóng' }]
    );
  };

  return (
    <View style={styles.rootContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#1E293B" />

      {/* Top Header Safe Area (Navy Blue #1E293B) */}
      <SafeAreaView style={styles.headerSafeArea}>
        <View style={styles.executiveHeaderCard}>
          <Text style={styles.executiveBadgeTitle}>ADMIN CONTROL CENTER</Text>
          <Text style={styles.title}>Chốt Level & Phê Duyệt Thăng Cấp Cuối Tháng</Text>
          <Text style={styles.subTitle}>Kiểm tra chi tiết việc con, người thực hiện & % hoàn thành dự án Level</Text>
        </View>
      </SafeAreaView>

      {/* Main Content Body */}
      <View style={styles.pageBodyContainer}>
        {isDeptLoading && departments.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.loadingText}>Đang tải dữ liệu phòng ban từ Database Postgres...</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scroll}>
            {/* Filter 1: Month/Year Switcher Bar */}
            <Text style={styles.filterSubLabel}>KỲ CHỐT LEVEL CUỐI THÁNG:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScrollRow}>
              {availableMonths.map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[styles.monthPill, selectedMonth === m && styles.monthPillActive]}
                  onPress={() => setSelectedMonth(m)}
                >
                  <Text style={[styles.monthPillText, selectedMonth === m && styles.monthPillTextActive]}>
                    {m.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Filter 2: Department Switcher Bar */}
            <Text style={styles.filterSubLabel}>CHỌN PHÒNG BAN CẦN XÉT DUYỆT CHỐT LEVEL:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScrollRow}>
              {departments.map((dept) => (
                <TouchableOpacity
                  key={dept.id}
                  style={[styles.deptPill, selectedDeptId === dept.id && styles.deptPillActive]}
                  onPress={() => setSelectedDeptId(dept.id)}
                >
                  <Text style={[styles.deptPillText, selectedDeptId === dept.id && styles.deptPillTextActive]}>
                    {dept.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.deptHeaderSummary}>
              <Text style={styles.deptSummaryTitle}>PHÒNG BAN: {activeDept.name.toUpperCase()}</Text>
              <Text style={styles.deptSummarySub}>Danh sách nhân sự đủ điều kiện xét nâng Level trong {selectedMonth}</Text>
            </View>

            {currentDeptItems.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>Chưa có đề xuất thăng cấp cho phòng {activeDept.name}</Text>
                <Text style={styles.emptySub}>Tất cả nhân sự phòng ban này đang ở Level ổn định hoặc chưa hết kỳ xét duyệt.</Text>
              </View>
            ) : (
              currentDeptItems.map((item) => (
                <View key={item.id} style={styles.auditCard}>
                  {/* Card Header */}
                  <View style={styles.cardHeaderRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.employeeName}>{item.userName}</Text>
                      <Text style={styles.employeeDept}>{item.departmentName}</Text>
                    </View>

                    <View style={[styles.statusBadge, item.status === 'APPROVED' && styles.statusApprovedBadge]}>
                      <Text style={[styles.statusBadgeText, item.status === 'APPROVED' && styles.statusApprovedText]}>
                        {item.status === 'APPROVED' ? 'ĐÃ PHÊ DUYỆT ✓' : 'CHỜ CHỐT LEVEL'}
                      </Text>
                    </View>
                  </View>

                  {/* Level Transition Pill */}
                  <View style={styles.levelTransitionRow}>
                    <View style={styles.levelPillOld}>
                      <Text style={styles.levelPillOldText}>{item.currentLevelName}</Text>
                    </View>
                    <Text style={styles.arrowIcon}>→</Text>
                    <View style={styles.levelPillNew}>
                      <Text style={styles.levelPillNewText}>{item.targetLevelName} (XÉT NÂNG)</Text>
                    </View>
                  </View>

                  {/* Physical Reward & Cash Bonus Highlight */}
                  <View style={styles.rewardHighlightBox}>
                    <Text style={styles.rewardHighlightTitle}>QUÀ THƯỞNG KHI CHỐT DUYỆT THĂNG CẤP:</Text>
                    <Text style={styles.rewardItemText}>• Quà Hiện Vật: {item.rewardPhysicalItem}</Text>
                    <Text style={styles.rewardItemText}>• Thưởng Nóng Tiền Mặt: {item.promotionBonusAmount.toLocaleString('vi-VN')} VNĐ</Text>
                    <Text style={styles.rewardItemText}>• Hệ Số Ví Điểm Tết Mới: {item.retentionMultiplier}x</Text>
                  </View>

                  {/* Detailed Level Stage Project & Sub-task Breakdown */}
                  <View style={styles.projectAuditBox}>
                    <Text style={styles.projectTitleLabel}>DỰ ÁN CHINH PHỤC CỦA LEVEL:</Text>
                    <Text style={styles.projectNameText}>{item.projectName}</Text>

                    {/* Overall Project Progress Bar */}
                    <View style={styles.progressBarContainer}>
                      <View style={styles.progressLabelRow}>
                        <Text style={styles.progressTitle}>Tiến Độ Hoàn Thành Dự Án Level:</Text>
                        <Text style={styles.progressPercent}>{item.overallProjectProgress}%</Text>
                      </View>
                      <View style={styles.progressTrack}>
                        <View style={[styles.progressFill, { width: `${item.overallProjectProgress}%` }]} />
                      </View>
                    </View>

                    {/* Sub-tasks Execution Breakdown */}
                    <Text style={styles.subTaskSectionHeader}>CHI TIẾT VIỆC CON, NGƯỜI ĐẢM NHẬN & % HOÀN THÀNH:</Text>
                    <View style={styles.subTasksList}>
                      {item.subTasks.map((st) => (
                        <View key={st.id} style={styles.subTaskAuditItem}>
                          <Text style={styles.subTaskTitle}>{st.bulletTitle}</Text>
                          
                          <View style={styles.subTaskMetaRow}>
                            <Text style={styles.assigneeText}>👤 Người thực hiện: <Text style={styles.assigneeBold}>{st.assigneeName}</Text> ({st.assigneeRole})</Text>
                            
                            <View style={[styles.rateBadge, st.completionRate === 100 ? styles.rateBadgeComplete : styles.rateBadgeProgress]}>
                              <Text style={[styles.rateBadgeText, st.completionRate === 100 ? styles.rateTextComplete : styles.rateTextProgress]}>
                                {st.completionRate}% {st.completionRate === 100 ? 'Hoàn thành ✓' : 'Đang làm ⚡'}
                              </Text>
                            </View>
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* Admin Action Buttons */}
                  {item.status === 'PENDING' ? (
                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={styles.approveBtn}
                        onPress={() => handleApproveLevel(item)}
                      >
                        <Text style={styles.approveBtnText}>PHÊ DUYỆT THĂNG CẤP & TRAO QUÀ ✓</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.rejectBtn}
                        onPress={() => handleRejectLevel(item)}
                      >
                        <Text style={styles.rejectBtnText}>Yêu Cầu Bổ Sung</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.approvedNoticeBox}>
                      <Text style={styles.approvedNoticeText}>✓ Đã chính thức thăng cấp lên {item.targetLevelName} & Đồng bộ hệ số Tết {item.retentionMultiplier}x</Text>
                    </View>
                  )}
                </View>
              ))
            )}

            <View style={{ height: 20 }} />
          </ScrollView>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerSafeArea: {
    backgroundColor: '#1E293B',
  },
  executiveHeaderCard: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  executiveBadgeTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#94A3B8',
    letterSpacing: 1.2,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 2,
  },
  subTitle: {
    fontSize: 11,
    color: '#CBD5E1',
    marginTop: 2,
  },
  pageBodyContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 12,
  },
  scroll: {
    padding: 16,
  },
  filterSubLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#64748B',
    letterSpacing: 0.8,
    marginTop: 4,
    marginBottom: 6,
  },
  filterScrollRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  monthPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  monthPillActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  monthPillText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#475569',
  },
  monthPillTextActive: {
    color: '#FFFFFF',
  },
  deptPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  deptPillActive: {
    backgroundColor: '#1E40AF',
    borderColor: '#1E40AF',
  },
  deptPillText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#475569',
  },
  deptPillTextActive: {
    color: '#FFFFFF',
  },
  deptHeaderSummary: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 14,
  },
  deptSummaryTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1E40AF',
  },
  deptSummarySub: {
    fontSize: 11,
    color: '#3B82F6',
    marginTop: 2,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#334155',
  },
  emptySub: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
    textAlign: 'center',
  },
  auditCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginBottom: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  employeeName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  employeeDept: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  statusBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#92400E',
  },
  statusApprovedBadge: {
    backgroundColor: '#D1FAE5',
  },
  statusApprovedText: {
    color: '#065F46',
  },
  levelTransitionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  levelPillOld: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  levelPillOldText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#475569',
  },
  arrowIcon: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#64748B',
  },
  levelPillNew: {
    backgroundColor: '#1E40AF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  levelPillNewText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  rewardHighlightBox: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  rewardHighlightTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#92400E',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  rewardItemText: {
    fontSize: 12,
    color: '#78350F',
    fontWeight: '500',
    marginTop: 2,
  },
  projectAuditBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  projectTitleLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  projectNameText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0F172A',
    marginTop: 2,
    marginBottom: 10,
  },
  progressBarContainer: {
    marginBottom: 12,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  progressTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#475569',
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#059669',
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#059669',
    borderRadius: 4,
  },
  subTaskSectionHeader: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#475569',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  subTasksList: {
    gap: 8,
  },
  subTaskAuditItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  subTaskTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 4,
  },
  subTaskMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  assigneeText: {
    fontSize: 11,
    color: '#475569',
    flex: 1,
  },
  assigneeBold: {
    fontWeight: 'bold',
    color: '#1E40AF',
  },
  rateBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  rateBadgeComplete: {
    backgroundColor: '#D1FAE5',
  },
  rateBadgeProgress: {
    backgroundColor: '#FEF3C7',
  },
  rateBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  rateTextComplete: {
    color: '#065F46',
  },
  rateTextProgress: {
    color: '#92400E',
  },
  actionRow: {
    gap: 8,
  },
  approveBtn: {
    backgroundColor: '#059669',
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
  },
  approveBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  rejectBtn: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  rejectBtnText: {
    color: '#475569',
    fontWeight: 'bold',
    fontSize: 12,
  },
  approvedNoticeBox: {
    backgroundColor: '#ECFDF5',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    alignItems: 'center',
  },
  approvedNoticeText: {
    color: '#047857',
    fontWeight: 'bold',
    fontSize: 11,
    textAlign: 'center',
  },
});
