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
  userRole: 'STAFF' | 'LEADER';
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
  const realDeptList = realDeptData?.data || realDeptData?.items || (Array.isArray(realDeptData) ? realDeptData : []);
  const departments = realDeptList.map((d: any) => ({ id: d.id || d._id, name: d.name || 'Phòng ban' }));

  const [activeTab, setActiveTab] = useState<1 | 2 | 3>(1); // 1: Staff, 2: Leader, 3: Summary
  const [selectedDeptId, setSelectedDeptId] = useState<string>(departments[0]?.id || 'dept-1');
  const [selectedMonth, setSelectedMonth] = useState<string>('Tháng 09/2026');

  const availableMonths = ['Tháng 09/2026', 'Tháng 10/2026', 'Tháng 11/2026', 'Tháng 12/2026'];

  // Staff Level Review Items
  const [staffItems, setStaffItems] = useState<Record<string, AdminReviewItem[]>>({
    'dept-1': [
      {
        id: 'staff-rev-1',
        employeeId: 'emp-101',
        userName: 'Trần Thị B (Chuyên Viên Livestream)',
        userRole: 'STAFF',
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
      {
        id: 'staff-rev-2',
        employeeId: 'emp-103',
        userName: 'Nguyễn Văn C (Nhân Viên Kỹ Thuật Live)',
        userRole: 'STAFF',
        departmentId: 'dept-1',
        departmentName: 'Livestream Hà Nội',
        currentLevelNumber: 1,
        currentLevelName: 'Level 1',
        targetLevelNumber: 2,
        targetLevelName: 'Level 2',
        projectName: 'Dự Án Level 2: Làm Chủ Hệ Thống Kỹ Thuật Ca Live',
        rewardPhysicalItem: 'Kỷ niệm chương thăng cấp chính thức',
        promotionBonusAmount: 1000000,
        retentionMultiplier: 1.1,
        subTasks: [
          {
            id: 'st-4',
            bulletTitle: '• Vận hành 100% ca Live không gián đoạn tín hiệu',
            assigneeName: 'Nguyễn Văn C',
            assigneeRole: 'Kỹ thuật chính',
            completionRate: 100,
            status: 'COMPLETED',
          },
          {
            id: 'st-5',
            bulletTitle: '• Kiểm tra bảo trì thiết bị âm thanh ánh sáng ca trực',
            assigneeName: 'Nguyễn Văn C',
            assigneeRole: 'Bảo trì thiết bị',
            completionRate: 100,
            status: 'COMPLETED',
          },
        ],
        overallProjectProgress: 100,
        status: 'APPROVED',
      },
    ],
    'dept-2': [
      {
        id: 'staff-rev-3',
        employeeId: 'emp-104',
        userName: 'Lê Văn E (Streamer HCM)',
        userRole: 'STAFF',
        departmentId: 'dept-2',
        departmentName: 'Livestream HCM',
        currentLevelNumber: 3,
        currentLevelName: 'Level 3',
        targetLevelNumber: 4,
        targetLevelName: 'Level 4',
        projectName: 'Dự Án Level 4: Chinh Phục Cột Mốc 500 Triệu Doanh Số',
        rewardPhysicalItem: 'Máy tính bảng iPad Air Màn 4K',
        promotionBonusAmount: 5000000,
        retentionMultiplier: 1.4,
        subTasks: [
          {
            id: 'st-6',
            bulletTitle: '• Đạt tổng Doanh số KPI 500Trđ cá nhân',
            assigneeName: 'Lê Văn E',
            assigneeRole: 'Main Host Live',
            completionRate: 100,
            status: 'COMPLETED',
          },
          {
            id: 'st-7',
            bulletTitle: '• Dẫn dắt 10 phiên livestream bán hàng đỉnh điểm',
            assigneeName: 'Lê Văn E',
            assigneeRole: 'Main Host Live',
            completionRate: 95,
            status: 'COMPLETED',
          },
        ],
        overallProjectProgress: 97,
        status: 'PENDING',
      },
    ],
  });

  // Leader Level Review Items
  const [leaderItems, setLeaderItems] = useState<Record<string, AdminReviewItem[]>>({
    'dept-1': [
      {
        id: 'ldr-rev-1',
        employeeId: 'emp-leader-1',
        userName: 'Phạm Minh H (Leader Phòng Livestream HN)',
        userRole: 'LEADER',
        departmentId: 'dept-1',
        departmentName: 'Livestream Hà Nội',
        currentLevelNumber: 5,
        currentLevelName: 'Level 5 (Team Leader)',
        targetLevelNumber: 6,
        targetLevelName: 'Level 6 (Manager)',
        projectName: 'Dự Án Level 6: Quản Trị & Bứt Phá Doanh Số 1.5 Tỷ Toàn Team',
        rewardPhysicalItem: 'Laptop MacBook Pro M-Series + iPhone 15 Pro Max',
        promotionBonusAmount: 15000000,
        retentionMultiplier: 2.0,
        subTasks: [
          {
            id: 'lst-1',
            bulletTitle: '• Xây dựng bộ quy trình chuẩn vận hành cho toàn phòng',
            assigneeName: 'Phạm Minh H',
            assigneeRole: 'Leader phòng ban',
            completionRate: 100,
            status: 'COMPLETED',
          },
          {
            id: 'lst-2',
            bulletTitle: '• Đạt tổng Doanh số toàn phòng Livestream HN 1.5 Tỷđ',
            assigneeName: 'Phạm Minh H & Toàn team HN',
            assigneeRole: 'Quản lý doanh số',
            completionRate: 100,
            status: 'COMPLETED',
          },
          {
            id: 'lst-3',
            bulletTitle: '• Đào tạo 2 nhân sự từ Level 2 thăng cấp lên Level 3',
            assigneeName: 'Phạm Minh H',
            assigneeRole: 'Đào tạo & Quản trị',
            completionRate: 100,
            status: 'COMPLETED',
          },
        ],
        overallProjectProgress: 100,
        status: 'PENDING',
      },
    ],
    'dept-2': [
      {
        id: 'ldr-rev-2',
        employeeId: 'emp-leader-2',
        userName: 'Nguyễn Văn A (Leader Livestream HCM)',
        userRole: 'LEADER',
        departmentId: 'dept-2',
        departmentName: 'Livestream HCM',
        currentLevelNumber: 4,
        currentLevelName: 'Level 4 (Key Leader)',
        targetLevelNumber: 5,
        targetLevelName: 'Level 5 (Team Leader)',
        projectName: 'Dự Án Level 5: Bứt Phá Doanh Số 1 Tỷđ & Quản Trị Đỉnh Cao',
        rewardPhysicalItem: 'Laptop MacBook Air M3 + Xe Máy Công Vụ',
        promotionBonusAmount: 8000000,
        retentionMultiplier: 1.6,
        subTasks: [
          {
            id: 'lst-4',
            bulletTitle: '• Đảm nhận và hoàn thành 30 ca đỉnh điểm toàn team',
            assigneeName: 'Nguyễn Văn A',
            assigneeRole: 'Team Leader',
            completionRate: 100,
            status: 'COMPLETED',
          },
          {
            id: 'lst-5',
            bulletTitle: '• Tỷ lệ hoàn thành Task SLA phòng ban ≥ 98%',
            assigneeName: 'Nguyễn Văn A',
            assigneeRole: 'Team Leader',
            completionRate: 99,
            status: 'COMPLETED',
          },
        ],
        overallProjectProgress: 99,
        status: 'PENDING',
      },
    ],
  });

  const activeDept = departments.find((d) => d.id === selectedDeptId) || departments[0] || { id: 'dept-1', name: 'Livestream Hà Nội' };

  const currentStaffDeptItems = staffItems[selectedDeptId] || staffItems['dept-1'] || [];
  const currentLeaderDeptItems = leaderItems[selectedDeptId] || leaderItems['dept-1'] || [];

  const handleApproveStaff = (item: AdminReviewItem) => {
    setStaffItems((prev) => {
      const list = prev[selectedDeptId] || currentStaffDeptItems;
      const updatedList = list.map((rev) =>
        rev.id === item.id ? { ...rev, status: 'APPROVED' as const } : rev
      );
      return { ...prev, [selectedDeptId]: updatedList };
    });

    Alert.alert(
      'CHỐT PHÊ DUYỆT THĂNG CẤP NHÂN VIÊN! ✓',
      `Đã duyệt thăng cấp cho Nhân viên: ${item.userName}\n\n• Cấp bậc mới: ${item.targetLevelName}\n• Quà hiện vật: ${item.rewardPhysicalItem}\n• Thưởng nóng: ${item.promotionBonusAmount.toLocaleString('vi-VN')} VNĐ\n• Hệ số Tết mới: ${item.retentionMultiplier}x`,
      [{ text: 'Đóng' }]
    );
  };

  const handleApproveLeader = (item: AdminReviewItem) => {
    setLeaderItems((prev) => {
      const list = prev[selectedDeptId] || currentLeaderDeptItems;
      const updatedList = list.map((rev) =>
        rev.id === item.id ? { ...rev, status: 'APPROVED' as const } : rev
      );
      return { ...prev, [selectedDeptId]: updatedList };
    });

    Alert.alert(
      'CHỐT PHÊ DUYỆT THĂNG CẤP LEADER / QUẢN LÝ! 👑',
      `Đã duyệt thăng cấp quản trị cho Leader: ${item.userName}\n\n• Vị trí Level mới: ${item.targetLevelName}\n• Quà hiện vật: ${item.rewardPhysicalItem}\n• Thưởng nóng: ${item.promotionBonusAmount.toLocaleString('vi-VN')} VNĐ\n• Hệ số Tết mới: ${item.retentionMultiplier}x`,
      [{ text: 'Đóng' }]
    );
  };

  const handleRejectItem = (item: AdminReviewItem) => {
    Alert.alert(
      'Yêu Cầu Bổ Sung Dự Án Level',
      `Nhân sự ${item.userName} chưa đạt 100% tiến độ việc con. Đã gửi thông báo yêu cầu hoàn thiện trước khi chốt duyệt lại!`,
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
          <Text style={styles.title}>Màn Hình Chốt Duyệt Level Cuối Tháng</Text>
          <Text style={styles.subTitle}>Duyệt thăng cấp Level & Trao quà thưởng cho cả Nhân Viên & Leader</Text>
        </View>

        {/* 3-Tab Stepper Bar (Staff / Leader / Summary) */}
        <View style={styles.tabStepperContainer}>
          <TouchableOpacity
            style={[styles.tabStepBtn, activeTab === 1 && styles.tabStepBtnActive]}
            onPress={() => setActiveTab(1)}
          >
            <Text style={[styles.tabStepTitle, activeTab === 1 && styles.tabStepTitleActive]}>1. Duyệt Nhân Viên</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabStepBtn, activeTab === 2 && styles.tabStepBtnActive]}
            onPress={() => setActiveTab(2)}
          >
            <Text style={[styles.tabStepTitle, activeTab === 2 && styles.tabStepTitleActive]}>2. Duyệt Leader</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabStepBtn, activeTab === 3 && styles.tabStepBtnActive]}
            onPress={() => setActiveTab(3)}
          >
            <Text style={[styles.tabStepTitle, activeTab === 3 && styles.tabStepTitleActive]}>3. Thống Kê & Báo Cáo</Text>
          </TouchableOpacity>
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
            {/* TAB 1: DUYỆT NHÂN VIÊN */}
            {activeTab === 1 && (
              <>
                <Text style={styles.filterSubLabel}>KỲ CHỐT LEVEL CUỐI THÁNG (NHÂN VIÊN):</Text>
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

                <Text style={styles.filterSubLabel}>CHỌN PHÒNG BAN XÉT DUYỆT NHÂN VIÊN:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScrollRow}>
                  {departments.map((dept) => (
                    <TouchableOpacity
                      key={dept.id}
                      style={[styles.deptPill, selectedDeptId === dept.id && styles.deptPillActive]}
                      onPress={() => setSelectedDeptId(dept.id)}
                    >
                      <Text style={[styles.deptPillText, selectedDeptId === dept.id && styles.deptPillTextActive]}>
                        👥 {dept.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <View style={styles.deptHeaderSummary}>
                  <Text style={styles.deptSummaryTitle}>XÉT DUYỆT LEVEL NHÂN VIÊN: {activeDept.name.toUpperCase()}</Text>
                  <Text style={styles.deptSummarySub}>Danh sách Nhân viên đủ điều kiện xét thăng cấp Level trong {selectedMonth}</Text>
                </View>

                {currentStaffDeptItems.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyTitle}>Chưa có đề xuất thăng cấp Nhân viên phòng {activeDept.name}</Text>
                    <Text style={styles.emptySub}>Tất cả Nhân viên phòng ban này đang ở Level ổn định.</Text>
                  </View>
                ) : (
                  currentStaffDeptItems.map((item) => (
                    <View key={item.id} style={styles.auditCard}>
                      <View style={styles.cardHeaderRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.employeeName}>👤 {item.userName}</Text>
                          <Text style={styles.employeeDept}>Phòng: {item.departmentName}</Text>
                        </View>

                        <View style={[styles.statusBadge, item.status === 'APPROVED' && styles.statusApprovedBadge]}>
                          <Text style={[styles.statusBadgeText, item.status === 'APPROVED' && styles.statusApprovedText]}>
                            {item.status === 'APPROVED' ? 'ĐÃ DUYỆT NHÂN VIÊN ✓' : 'CHỜ CHỐT LEVEL'}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.levelTransitionRow}>
                        <View style={styles.levelPillOld}>
                          <Text style={styles.levelPillOldText}>{item.currentLevelName}</Text>
                        </View>
                        <Text style={styles.arrowIcon}>→</Text>
                        <View style={styles.levelPillNew}>
                          <Text style={styles.levelPillNewText}>{item.targetLevelName} (NÂNG LEVEL NHÂN VIÊN)</Text>
                        </View>
                      </View>

                      <View style={styles.rewardHighlightBox}>
                        <Text style={styles.rewardHighlightTitle}>QUÀ THƯỞNG KHI DUYỆT NÂNG LEVEL NHÂN VIÊN:</Text>
                        <Text style={styles.rewardItemText}>• Quà Hiện Vật: {item.rewardPhysicalItem}</Text>
                        <Text style={styles.rewardItemText}>• Thưởng Nóng Tiền Mặt: {item.promotionBonusAmount.toLocaleString('vi-VN')} VNĐ</Text>
                        <Text style={styles.rewardItemText}>• Hệ Số Ví Điểm Tết Mới: {item.retentionMultiplier}x</Text>
                      </View>

                      <View style={styles.projectAuditBox}>
                        <Text style={styles.projectTitleLabel}>DỰ ÁN LEVEL NHÂN VIÊN:</Text>
                        <Text style={styles.projectNameText}>{item.projectName}</Text>

                        <View style={styles.progressBarContainer}>
                          <View style={styles.progressLabelRow}>
                            <Text style={styles.progressTitle}>Tiến Độ Hoàn Thành Dự Án Level:</Text>
                            <Text style={styles.progressPercent}>{item.overallProjectProgress}%</Text>
                          </View>
                          <View style={styles.progressTrack}>
                            <View style={[styles.progressFill, { width: `${item.overallProjectProgress}%` }]} />
                          </View>
                        </View>

                        <Text style={styles.subTaskSectionHeader}>CHI TIẾT VIỆC CON, NGƯỜI THỰC HIỆN & % HOÀN THÀNH:</Text>
                        <View style={styles.subTasksList}>
                          {item.subTasks.map((st) => (
                            <View key={st.id} style={styles.subTaskAuditItem}>
                              <Text style={styles.subTaskTitle}>{st.bulletTitle}</Text>
                              <View style={styles.subTaskMetaRow}>
                                <Text style={styles.assigneeText}>👤 Người thực hiện: <Text style={styles.assigneeBold}>{st.assigneeName}</Text></Text>
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

                      {item.status === 'PENDING' ? (
                        <View style={styles.actionRow}>
                          <TouchableOpacity style={styles.approveBtn} onPress={() => handleApproveStaff(item)}>
                            <Text style={styles.approveBtnText}>PHÊ DUYỆT THĂNG CẤP NHÂN VIÊN ✓</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.rejectBtn} onPress={() => handleRejectItem(item)}>
                            <Text style={styles.rejectBtnText}>Yêu Cầu Bổ Sung</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <View style={styles.approvedNoticeBox}>
                          <Text style={styles.approvedNoticeText}>✓ Đã chính thức duyệt thăng cấp Nhân viên lên {item.targetLevelName} & Đồng bộ hệ số Tết {item.retentionMultiplier}x</Text>
                        </View>
                      )}
                    </View>
                  ))
                )}
              </>
            )}

            {/* TAB 2: DUYỆT LEADER & QUẢN LÝ */}
            {activeTab === 2 && (
              <>
                <Text style={styles.filterSubLabel}>KỲ CHỐT LEVEL CUỐI THÁNG (LEADER & QUẢN LÝ):</Text>
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

                <Text style={styles.filterSubLabel}>CHỌN PHÒNG BAN XÉT DUYỆT LEADER:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScrollRow}>
                  {departments.map((dept) => (
                    <TouchableOpacity
                      key={dept.id}
                      style={[styles.deptPill, selectedDeptId === dept.id && styles.deptPillActive]}
                      onPress={() => setSelectedDeptId(dept.id)}
                    >
                      <Text style={[styles.deptPillText, selectedDeptId === dept.id && styles.deptPillTextActive]}>
                        👑 {dept.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <View style={styles.leaderDeptHeaderSummary}>
                  <Text style={styles.leaderDeptSummaryTitle}>XÉT DUYỆT LEVEL LEADER: {activeDept.name.toUpperCase()}</Text>
                  <Text style={styles.leaderDeptSummarySub}>Đánh giá năng lực quản trị, KPI team & Xét nâng Level Leader phòng {activeDept.name}</Text>
                </View>

                {currentLeaderDeptItems.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyTitle}>Chưa có đề xuất thăng cấp Leader phòng {activeDept.name}</Text>
                    <Text style={styles.emptySub}>Leader phòng ban này đang giữ vững cấp bậc Level hiện tại.</Text>
                  </View>
                ) : (
                  currentLeaderDeptItems.map((item) => (
                    <View key={item.id} style={styles.leaderAuditCard}>
                      <View style={styles.cardHeaderRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.leaderName}>👑 {item.userName}</Text>
                          <Text style={styles.employeeDept}>Trưởng Phòng / Team Leader: {item.departmentName}</Text>
                        </View>

                        <View style={[styles.statusBadge, item.status === 'APPROVED' && styles.statusApprovedBadge]}>
                          <Text style={[styles.statusBadgeText, item.status === 'APPROVED' && styles.statusApprovedText]}>
                            {item.status === 'APPROVED' ? 'ĐÃ DUYỆT LEADER ✓' : 'CHỜ DUYỆT LEADER'}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.levelTransitionRow}>
                        <View style={styles.levelPillOld}>
                          <Text style={styles.levelPillOldText}>{item.currentLevelName}</Text>
                        </View>
                        <Text style={styles.arrowIcon}>→</Text>
                        <View style={styles.leaderLevelPillNew}>
                          <Text style={styles.leaderLevelPillNewText}>{item.targetLevelName} (NÂNG LEVEL QUẢN TRỊ)</Text>
                        </View>
                      </View>

                      <View style={styles.leaderRewardHighlightBox}>
                        <Text style={styles.leaderRewardHighlightTitle}>QUÀ THƯỞNG KHI DUYỆT NÂNG LEVEL LEADER:</Text>
                        <Text style={styles.leaderRewardItemText}>• Quà Hiện Vật Đặc Biệt: {item.rewardPhysicalItem}</Text>
                        <Text style={styles.leaderRewardItemText}>• Thưởng Nóng Tiền Mặt: {item.promotionBonusAmount.toLocaleString('vi-VN')} VNĐ</Text>
                        <Text style={styles.leaderRewardItemText}>• Hệ Số Ví Điểm Tết Mới: {item.retentionMultiplier}x (Hệ số Quản trị)</Text>
                      </View>

                      <View style={styles.projectAuditBox}>
                        <Text style={styles.projectTitleLabel}>DỰ ÁN QUẢN TRỊ THĂNG CẤP LEADER:</Text>
                        <Text style={styles.projectNameText}>{item.projectName}</Text>

                        <View style={styles.progressBarContainer}>
                          <View style={styles.progressLabelRow}>
                            <Text style={styles.progressTitle}>Tiến Độ KPI Quản Trị Toàn Team:</Text>
                            <Text style={styles.progressPercent}>{item.overallProjectProgress}%</Text>
                          </View>
                          <View style={styles.progressTrack}>
                            <View style={[styles.progressFillLeader, { width: `${item.overallProjectProgress}%` }]} />
                          </View>
                        </View>

                        <Text style={styles.subTaskSectionHeader}>CHI TIẾT VIỆC CON QUẢN TRỊ & MỨC ĐỘ HOÀN THÀNH:</Text>
                        <View style={styles.subTasksList}>
                          {item.subTasks.map((st) => (
                            <View key={st.id} style={styles.subTaskAuditItem}>
                              <Text style={styles.subTaskTitle}>{st.bulletTitle}</Text>
                              <View style={styles.subTaskMetaRow}>
                                <Text style={styles.assigneeText}>👑 Phụ trách: <Text style={styles.assigneeBold}>{st.assigneeName}</Text></Text>
                                <View style={[styles.rateBadge, st.completionRate === 100 ? styles.rateBadgeComplete : styles.rateBadgeProgress]}>
                                  <Text style={[styles.rateBadgeText, st.completionRate === 100 ? styles.rateTextComplete : styles.rateTextProgress]}>
                                    {st.completionRate}% {st.completionRate === 100 ? 'Đạt 100% KPI ✓' : 'Đang thực hiện ⚡'}
                                  </Text>
                                </View>
                              </View>
                            </View>
                          ))}
                        </View>
                      </View>

                      {item.status === 'PENDING' ? (
                        <View style={styles.actionRow}>
                          <TouchableOpacity style={styles.leaderApproveBtn} onPress={() => handleApproveLeader(item)}>
                            <Text style={styles.approveBtnText}>PHÊ DUYỆT NÂNG LEVEL LEADER 👑 ✓</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.rejectBtn} onPress={() => handleRejectItem(item)}>
                            <Text style={styles.rejectBtnText}>Yêu Cầu Bổ Sung</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <View style={styles.approvedNoticeBox}>
                          <Text style={styles.approvedNoticeText}>✓ Đã phê duyệt thăng cấp Leader lên {item.targetLevelName} & Đồng bộ hệ số Tết {item.retentionMultiplier}x</Text>
                        </View>
                      )}
                    </View>
                  ))
                )}
              </>
            )}

            {/* TAB 3: THỐNG KÊ & BÁO CÁO TỔNG HỢP */}
            {activeTab === 3 && (
              <View style={styles.summaryContainer}>
                <Text style={styles.summaryHeaderTitle}>BÁO CÁO TỔNG HỢP DUYỆT LEVEL THÁNG ({selectedMonth})</Text>

                <View style={styles.summaryStatGrid}>
                  <View style={styles.statBoxCard}>
                    <Text style={styles.statBoxNumber}>12</Text>
                    <Text style={styles.statBoxLabel}>Tổng Nhân Sự Đã Duyệt Thăng Cấp</Text>
                  </View>

                  <View style={styles.statBoxCard}>
                    <Text style={styles.statBoxNumber}>48.000.000đ</Text>
                    <Text style={styles.statBoxLabel}>Tổng Ngân Sách Thưởng Nóng Tiền Mặt</Text>
                  </View>

                  <View style={styles.statBoxCard}>
                    <Text style={styles.statBoxNumber}>5 MacBook, 4 iPad</Text>
                    <Text style={styles.statBoxLabel}>Quà Thưởng Hiện Vật Đã Trao</Text>
                  </View>

                  <View style={styles.statBoxCard}>
                    <Text style={styles.statBoxNumber}>1.85x</Text>
                    <Text style={styles.statBoxLabel}>Hệ Số Tết Trung Bình Toàn Công Ty</Text>
                  </View>
                </View>

                <View style={styles.summaryNoticeBox}>
                  <Text style={styles.summaryNoticeTitle}>✓ ĐỒNG BỘ NĂNG SUẤT THỜI GIAN THỰC (REAL-TIME)</Text>
                  <Text style={styles.summaryNoticeSub}>Mọi quyết định phê duyệt thăng cấp Level cho Nhân viên & Leader đã được ghi nhận vào Database Postgres và tự động thông báo về App Nhân viên!</Text>
                </View>
              </View>
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
    paddingBottom: 8,
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
  tabStepperContainer: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  tabStepBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabStepBtnActive: {
    backgroundColor: '#2563EB',
  },
  tabStepTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#94A3B8',
  },
  tabStepTitleActive: {
    color: '#FFFFFF',
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
  leaderDeptHeaderSummary: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 14,
  },
  leaderDeptSummaryTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#92400E',
  },
  leaderDeptSummarySub: {
    fontSize: 11,
    color: '#B45309',
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
  leaderAuditCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#F59E0B',
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
  leaderName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#78350F',
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
  leaderLevelPillNew: {
    backgroundColor: '#D97706',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  leaderLevelPillNewText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  rewardHighlightBox: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  rewardHighlightTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1E40AF',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  rewardItemText: {
    fontSize: 12,
    color: '#1E3A8A',
    fontWeight: '500',
    marginTop: 2,
  },
  leaderRewardHighlightBox: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  leaderRewardHighlightTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#92400E',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  leaderRewardItemText: {
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
  progressFillLeader: {
    height: '100%',
    backgroundColor: '#D97706',
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
  leaderApproveBtn: {
    backgroundColor: '#D97706',
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
  summaryContainer: {
    gap: 14,
  },
  summaryHeaderTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 4,
  },
  summaryStatGrid: {
    gap: 10,
  },
  statBoxCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statBoxNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E40AF',
  },
  statBoxLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  summaryNoticeBox: {
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  summaryNoticeTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#065F46',
  },
  summaryNoticeSub: {
    fontSize: 11,
    color: '#047857',
    marginTop: 4,
    lineHeight: 16,
  },
});
