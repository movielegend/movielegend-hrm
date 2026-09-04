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
  actualResultDescription: string; // Chi tiết những gì nhân sự thực tế đã thực hiện được
  targetMetric?: string;           // Chỉ tiêu giao ban đầu
  achievedMetric?: string;         // Số liệu thực tế đạt được
  proofNotes?: string;             // Minh chứng / đối soát
  verifiedBy?: string;             // Người nghiệm thu xác nhận
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

  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1); // 1: Phòng Ban, 2: Duyệt Nhân Viên, 3: Duyệt Leader
  const [selectedDeptId, setSelectedDeptId] = useState<string>(departments[0]?.id || 'dept-1');
  const [selectedMonth, setSelectedMonth] = useState<string>('Tháng 09/2026');
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  const availableMonths = ['Tháng 09/2026', 'Tháng 10/2026', 'Tháng 11/2026', 'Tháng 12/2026'];

  const toggleExpandCard = (id: string) => {
    setExpandedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

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
            assigneeRole: 'Chủ trì ca chính',
            completionRate: 100,
            status: 'COMPLETED',
            actualResultDescription: 'Đã chủ trì 14 ca livestream thời trang cao điểm, chốt tổng cộng 1.840 đơn hàng thành công, mang về doanh thu thực tế 320.500.000 VNĐ (Vượt 6.8% chỉ tiêu ban đầu).',
            targetMetric: '300.000.000 VNĐ',
            achievedMetric: '320.500.000 VNĐ (106.8%)',
            proofNotes: 'Hệ thống POS & TikTok Shop đối soát doanh thu tự động khớp 100%.',
            verifiedBy: 'Leader Phạm Minh H đã ký nghiệm thu',
          },
          {
            id: 'st-2',
            bulletTitle: '• Hướng dẫn & kèm cặp 1 nhân sự mới Level 1',
            assigneeName: 'Trần Thị B (Kèm cặp Nguyễn Văn D)',
            assigneeRole: 'Người hướng dẫn',
            completionRate: 90,
            status: 'IN_PROGRESS',
            actualResultDescription: 'Đã trực tiếp đứng ca hỗ trợ nhân sự mới Nguyễn Văn D trong 12 ca live thực tế. Hướng dẫn thành thạo kỹ năng tương tác chốt đơn, xử lý bình luận khiếu nại và kỹ thuật điều khiển màn hình live.',
            targetMetric: 'Kèm cặp 1 nhân sự tự chủ đứng ca',
            achievedMetric: 'Nguyễn Văn D đã tự vận hành độc lập 4 ca live đạt đánh giá 4.8/5 sao',
            proofNotes: 'Biên bản đánh giá kèm cặp nội bộ có xác nhận của nhân sự mới.',
            verifiedBy: 'HR & Leader phòng ban xác nhận',
          },
          {
            id: 'st-3',
            bulletTitle: '• Đề xuất 1 kịch bản chốt đơn ngắn đỉnh điểm',
            assigneeName: 'Trần Thị B',
            assigneeRole: 'Sáng tạo nội dung',
            completionRate: 100,
            status: 'COMPLETED',
            actualResultDescription: 'Xây dựng hoàn chỉnh kịch bản Flash Sale 15 phút "Khung Giờ Vàng Chốt Nhanh 100 Đơn", đã được đưa vào ứng dụng thực tế cho 8 phiên live trong tuần của team, tăng 32% tỷ lệ chuyển đổi đơn hàng.',
            targetMetric: '1 Kịch bản được áp dụng thực tế',
            achievedMetric: 'Áp dụng thành công cho 8 ca live, tỷ lệ chốt đơn tăng 32%',
            proofNotes: 'Kịch bản lưu trữ tại thư mục tài liệu SOP chuẩn của team.',
            verifiedBy: 'Leader duyệt áp dụng toàn team',
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
            actualResultDescription: 'Trực kỹ thuật 28 ca livestream studio liên tục, tỷ lệ rớt sóng 0%, đảm bảo đường truyền ổn định full HD và âm thanh rõ nét suốt toàn bộ các ca.',
            targetMetric: '100% ca không gián đoạn',
            achievedMetric: 'Đạt 28/28 ca trực chuẩn kỹ thuật tuyệt đối',
            proofNotes: 'Nhật ký vận hành OBS & Log hệ thống đường truyền không có sự cố.',
            verifiedBy: 'IT Lead & Team Leader nghiệm thu',
          },
          {
            id: 'st-5',
            bulletTitle: '• Kiểm tra bảo trì thiết bị âm thanh ánh sáng ca trực',
            assigneeName: 'Nguyễn Văn C',
            assigneeRole: 'Bảo trì thiết bị',
            completionRate: 100,
            status: 'COMPLETED',
            actualResultDescription: 'Đã hoàn thành bảo dưỡng định kỳ 4 cụm đèn softbox, cân chỉnh 6 micro cài áo không dây và vệ sinh hệ thống tản nhiệt camera cho 2 studio chính.',
            targetMetric: 'Bảo dưỡng 100% thiết bị phòng live',
            achievedMetric: 'Hoàn tất nghiệm thu 10 cụm thiết bị âm thanh - ánh sáng',
            proofNotes: 'Biên bản bàn giao thiết bị phòng thu tháng 09/2026.',
            verifiedBy: 'Quản lý tài sản studio ký duyệt',
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
            actualResultDescription: 'Đạt doanh thu cá nhân 515.000.000 VNĐ qua 16 ca live bán hàng gia dụng thông minh, thu hút 128.000 lượt xem trực tiếp.',
            targetMetric: '500.000.000 VNĐ',
            achievedMetric: '515.000.000 VNĐ (103%)',
            proofNotes: 'Báo cáo doanh số tự động từ TikTok Shop Creator Analytics.',
            verifiedBy: 'Leader Livestream HCM duyệt',
          },
          {
            id: 'st-7',
            bulletTitle: '• Dẫn dắt 10 phiên livestream bán hàng đỉnh điểm',
            assigneeName: 'Lê Văn E',
            assigneeRole: 'Main Host Live',
            completionRate: 95,
            status: 'COMPLETED',
            actualResultDescription: 'Dẫn dắt 10 ca live sự kiện Big Campaign của nhãn hàng, duy trì lượng mắt xem liên tục trên 1.200 người trong suốt 3 giờ phát sóng.',
            targetMetric: '10 Phiên Mega Live',
            achievedMetric: 'Hoàn thành 10/10 phiên Mega Live xuất sắc',
            proofNotes: 'Báo cáo số liệu ca phát sóng của agency.',
            verifiedBy: 'Leader Livestream HCM nghiệm thu',
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
        currentLevelName: 'Level 5',
        targetLevelNumber: 6,
        targetLevelName: 'Level 6',
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
            actualResultDescription: 'Đã hoàn thành ban hành Bộ SOP Vận hành Livestream Chuẩn gồm 5 giai đoạn: Chuẩn bị thiết bị - Set kịch bản - Tương tác ca - Xử lý khủng hoảng - Báo cáo sau ca live. Giảm 85% lỗi phát sinh trong ca trực của team.',
            targetMetric: '1 Bộ quy trình chuẩn SOP áp dụng toàn phòng',
            achievedMetric: 'Đã đào tạo & áp dụng 100% cho 18 nhân sự trong phòng',
            proofNotes: 'Văn bản SOP mã số SOP-LS-2026 đã được BĐH phê duyệt chính thức.',
            verifiedBy: 'Admin / Ban Điều Hành xác nhận',
          },
          {
            id: 'lst-2',
            bulletTitle: '• Đạt tổng Doanh số toàn phòng Livestream HN 1.5 Tỷđ',
            assigneeName: 'Phạm Minh H & Toàn team HN',
            assigneeRole: 'Quản lý doanh số',
            completionRate: 100,
            status: 'COMPLETED',
            actualResultDescription: 'Điều phối lịch trực và tối ưu hóa 6 khung giờ vàng cho 6 phòng studio, đưa tổng doanh thu toàn phòng Livestream Hà Nội đạt 1.580.000.000 VNĐ (Vượt 80 triệu so với chỉ tiêu giao).',
            targetMetric: '1.500.000.000 VNĐ',
            achievedMetric: '1.580.000.000 VNĐ (105.3%)',
            proofNotes: 'Số liệu đối soát doanh thu đã được Kế toán trưởng ký xác nhận.',
            verifiedBy: 'Admin / Giám đốc Vận hành',
          },
          {
            id: 'lst-3',
            bulletTitle: '• Đào tạo 2 nhân sự từ Level 2 thăng cấp lên Level 3',
            assigneeName: 'Phạm Minh H',
            assigneeRole: 'Đào tạo & Quản trị',
            completionRate: 100,
            status: 'COMPLETED',
            actualResultDescription: 'Tổ chức 6 buổi đào tạo nâng cao kỹ năng dẫn dắt và xử lý kịch bản cho 2 nhân sự Trần Thị B và Hoàng Thu H; cả 2 đều đã hoàn thành dự án cá nhân và đủ điều kiện thăng cấp Level 3 trong đợt này.',
            targetMetric: '2 Nhân sự hoàn thành dự án Level 3',
            achievedMetric: '2/2 Nhân sự đạt chỉ tiêu thăng cấp xuất sắc',
            proofNotes: 'Hồ sơ đánh giá năng lực của 2 nhân sự trên hệ thống HRM.',
            verifiedBy: 'Phòng Nhân sự HR nghiệm thu',
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
        currentLevelName: 'Level 4',
        targetLevelNumber: 5,
        targetLevelName: 'Level 5',
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
            actualResultDescription: 'Trực tiếp chỉ đạo và điều phối 30 ca live cao điểm chiến dịch mua sắm cuối tháng, không phát sinh sự cố về giá bán hoặc tồn kho.',
            targetMetric: '30 Ca đỉnh điểm',
            achievedMetric: 'Hoàn thành 30/30 ca đúng tiến độ cam kết',
            proofNotes: 'Bảng theo dõi lịch ca trực và tỷ lệ hoàn thành SLA ca.',
            verifiedBy: 'Ban Giám Đốc xác nhận',
          },
          {
            id: 'lst-5',
            bulletTitle: '• Tỷ lệ hoàn thành Task SLA phòng ban ≥ 98%',
            assigneeName: 'Nguyễn Văn A',
            assigneeRole: 'Team Leader',
            completionRate: 99,
            status: 'COMPLETED',
            actualResultDescription: 'Toàn bộ 240 công việc được giao cho nhân sự trong tháng đều được hoàn thành đúng thời hạn quy định, tỷ lệ đạt 99.2% (vượt mốc cam kết 98%).',
            targetMetric: 'Tỷ lệ SLA ≥ 98%',
            achievedMetric: 'Đạt 99.2% (238/240 task đúng hạn)',
            proofNotes: 'Dữ liệu đo lường tự động từ module Task Management.',
            verifiedBy: 'Hệ thống HRM tự động kiểm chứng',
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
      const updatedList = list.map((rev) => (rev.id === item.id ? { ...rev, status: 'APPROVED' as const } : rev));
      return { ...prev, [selectedDeptId]: updatedList };
    });

    Alert.alert(
      'CHỐT PHÊ DUYỆT THĂNG CẤP NHÂN VIÊN!',
      `Đã duyệt thăng cấp cho Nhân viên: ${item.userName}\n\n• Cấp bậc mới: ${item.targetLevelName}\n• Quà hiện vật: ${item.rewardPhysicalItem}\n• Thưởng nóng: ${item.promotionBonusAmount.toLocaleString('vi-VN')} VNĐ\n• Hệ số Tết mới: ${item.retentionMultiplier}x`,
      [{ text: 'Đóng' }]
    );
  };

  const handleApproveLeader = (item: AdminReviewItem) => {
    setLeaderItems((prev) => {
      const list = prev[selectedDeptId] || currentLeaderDeptItems;
      const updatedList = list.map((rev) => (rev.id === item.id ? { ...rev, status: 'APPROVED' as const } : rev));
      return { ...prev, [selectedDeptId]: updatedList };
    });

    Alert.alert(
      'CHỐT PHÊ DUYỆT THĂNG CẤP LEADER / QUẢN LÝ!',
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
          <Text style={styles.title}>Chốt Duyệt Level Cuối Tháng</Text>
          <Text style={styles.subTitle}>Kiểm tra tiến độ, phê duyệt thăng cấp Level & trao quà thưởng</Text>
        </View>

        {/* 3-Step Progress Stepper Navigation Bar: 1. Phòng Ban —— 2. Duyệt Nhân Viên —— 3. Duyệt Leader */}
        <View style={styles.stepperWrapper}>
          <TouchableOpacity
            style={[styles.stepItemPill, activeStep === 1 && styles.stepItemPillActive]}
            onPress={() => setActiveStep(1)}
            activeOpacity={0.8}
          >
            <View style={[styles.stepCircle, activeStep === 1 ? styles.stepCircleActive : styles.stepCircleInactive]}>
              <Text style={[styles.stepNumberText, activeStep === 1 ? styles.stepNumberTextActive : styles.stepNumberTextInactive]}>1</Text>
            </View>
            <Text style={[styles.stepLabelText, activeStep === 1 ? styles.stepLabelTextActive : styles.stepLabelTextInactive]}>Phòng Ban</Text>
          </TouchableOpacity>

          <View style={styles.stepConnectorLine} />

          <TouchableOpacity
            style={[styles.stepItemPill, activeStep === 2 && styles.stepItemPillActive]}
            onPress={() => setActiveStep(2)}
            activeOpacity={0.8}
          >
            <View style={[styles.stepCircle, activeStep === 2 ? styles.stepCircleActive : styles.stepCircleInactive]}>
              <Text style={[styles.stepNumberText, activeStep === 2 ? styles.stepNumberTextActive : styles.stepNumberTextInactive]}>2</Text>
            </View>
            <Text style={[styles.stepLabelText, activeStep === 2 ? styles.stepLabelTextActive : styles.stepLabelTextInactive]}>Duyệt Nhân Viên</Text>
          </TouchableOpacity>

          <View style={styles.stepConnectorLine} />

          <TouchableOpacity
            style={[styles.stepItemPill, activeStep === 3 && styles.stepItemPillActive]}
            onPress={() => setActiveStep(3)}
            activeOpacity={0.8}
          >
            <View style={[styles.stepCircle, activeStep === 3 ? styles.stepCircleActive : styles.stepCircleInactive]}>
              <Text style={[styles.stepNumberText, activeStep === 3 ? styles.stepNumberTextActive : styles.stepNumberTextInactive]}>3</Text>
            </View>
            <Text style={[styles.stepLabelText, activeStep === 3 ? styles.stepLabelTextActive : styles.stepLabelTextInactive]}>Duyệt Leader</Text>
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
            {/* STEP 1: PHÒNG BAN - CHỌN KỲ CHỐT MONTH & PHÒNG BAN */}
            {activeStep === 1 && (
              <>
                <Text style={styles.filterSubLabel}>CHỌN KỲ CHỐT LEVEL CUỐI THÁNG:</Text>
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

                <View style={styles.deptCardGrid}>
                  {departments.map((dept) => {
                    const staffList = staffItems[dept.id] || [];
                    const leaderList = leaderItems[dept.id] || [];
                    const pendingStaffCount = staffList.filter((s) => s.status === 'PENDING').length;
                    const pendingLeaderCount = leaderList.filter((l) => l.status === 'PENDING').length;

                    return (
                      <TouchableOpacity
                        key={dept.id}
                        style={[styles.deptCardItem, selectedDeptId === dept.id && styles.deptCardItemActive]}
                        onPress={() => {
                          setSelectedDeptId(dept.id);
                          setActiveStep(2);
                        }}
                      >
                        <View style={styles.deptCardHeader}>
                          <Text style={styles.deptCardName}>{dept.name}</Text>
                          <View style={styles.deptBadge}>
                            <Text style={styles.deptBadgeText}>{pendingStaffCount + pendingLeaderCount} CHỜ DUYỆT</Text>
                          </View>
                        </View>

                        <View style={styles.deptCardBody}>
                          <Text style={styles.deptDetailLine}>• Nhân viên đề xuất thăng cấp: <Text style={styles.boldBlue}>{staffList.length} Nhân sự</Text></Text>
                          <Text style={styles.deptDetailLine}>• Leader đề xuất thăng cấp: <Text style={styles.boldAmber}>{leaderList.length} Leader</Text></Text>
                        </View>

                        <View style={styles.deptCardFooter}>
                          <Text style={styles.deptActionText}>Bấm Chọn Xét Duyệt Phòng {dept.name} →</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            {/* STEP 2: DUYỆT LEVEL NHÂN VIÊN */}
            {activeStep === 2 && (
              <>
                <Text style={styles.deptHeaderTitle}>DUYỆT LEVEL NHÂN VIÊN - PHÒNG {activeDept.name.toUpperCase()}</Text>

                {currentStaffDeptItems.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyTitle}>Chưa có đề xuất thăng cấp Nhân viên phòng {activeDept.name}</Text>
                    <Text style={styles.emptySub}>Tất cả Nhân viên phòng ban này đang ở cấp bậc Level ổn định.</Text>
                  </View>
                ) : (
                  currentStaffDeptItems.map((item) => {
                    const isExpanded = !!expandedCards[item.id];

                    return (
                      <View key={item.id} style={[styles.compactAuditCard, styles.cardBorderStaff]}>
                        {/* Header: Candidate Info & Role Tag */}
                        <View style={styles.cardHeaderRow}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.candidateName}>{item.userName}</Text>
                            <Text style={styles.candidateDept}>Phòng ban: {item.departmentName}</Text>
                          </View>

                          <View style={styles.roleBadgeStaff}>
                            <Text style={styles.roleBadgeTextStaff}>NHÂN VIÊN</Text>
                          </View>
                        </View>

                        {/* Level Upgrade Pill Banner */}
                        <View style={styles.levelTransitionRow}>
                          <View style={styles.levelPillOld}>
                            <Text style={styles.levelPillOldText}>{item.currentLevelName}</Text>
                          </View>
                          <Text style={styles.arrowIcon}>➔</Text>
                          <View style={styles.levelPillNewStaff}>
                            <Text style={styles.levelPillNewTextStaff}>{item.targetLevelName}</Text>
                          </View>
                        </View>

                        {/* Progress Bar & KPI % */}
                        <View style={styles.compactProgressBox}>
                          <View style={styles.progressLabelRow}>
                            <Text style={styles.progressTitle}>Tiến độ KPI dự án thăng cấp:</Text>
                            <Text style={styles.progressPercent}>{item.overallProjectProgress}%</Text>
                          </View>
                          <View style={styles.progressTrack}>
                            <View style={[styles.progressFill, { width: `${item.overallProjectProgress}%` }]} />
                          </View>
                        </View>

                        {/* Reward Highlights */}
                        <View style={styles.rewardSummaryRow}>
                          <View style={styles.rewardSummaryChip}>
                            <Text style={styles.rewardChipLabel}>Thưởng Nóng:</Text>
                            <Text style={styles.rewardChipValue}>+{item.promotionBonusAmount.toLocaleString('vi-VN')}đ</Text>
                          </View>
                          <View style={styles.rewardSummaryChip}>
                            <Text style={styles.rewardChipLabel}>Hệ Số Tết:</Text>
                            <Text style={styles.rewardChipValue}>{item.retentionMultiplier}x</Text>
                          </View>
                          <View style={[styles.rewardSummaryChip, { flex: 2 }]}>
                            <Text style={styles.rewardChipLabel}>Quà Hiện Vật:</Text>
                            <Text style={styles.rewardChipValue} numberOfLines={1}>
                              🎁 {item.rewardPhysicalItem}
                            </Text>
                          </View>
                        </View>

                        {/* Subtasks Accordion Toggle Button */}
                        <TouchableOpacity style={styles.accordionToggleBtn} onPress={() => toggleExpandCard(item.id)}>
                          <Text style={styles.accordionToggleText}>
                            {isExpanded
                              ? `▲ Thu gọn chi tiết việc con (${item.subTasks.length})`
                              : `▼ Xem chi tiết ${item.subTasks.length} việc con & kết quả thực hiện`}
                          </Text>
                        </TouchableOpacity>

                        {/* Expanded Subtasks List with Rich Operational Details */}
                        {isExpanded && (
                          <View style={styles.expandedSubTaskBox}>
                            <Text style={styles.projectTitleLabel}>TÊN DỰ ÁN: {item.projectName}</Text>
                            <View style={styles.subTasksList}>
                              {item.subTasks.map((st) => (
                                <View key={st.id} style={styles.subTaskAuditItem}>
                                  {/* Subtask Title & Status Badge */}
                                  <View style={styles.subTaskHeaderRow}>
                                    <Text style={styles.subTaskTitle}>{st.bulletTitle}</Text>
                                    <View style={[styles.rateBadge, st.completionRate === 100 ? styles.rateBadgeComplete : styles.rateBadgeProgress]}>
                                      <Text style={[styles.rateBadgeText, st.completionRate === 100 ? styles.rateTextComplete : styles.rateTextProgress]}>
                                        {st.completionRate}% {st.completionRate === 100 ? 'Đạt 100%' : 'Đang làm'}
                                      </Text>
                                    </View>
                                  </View>

                                  {/* Assignee Meta */}
                                  <Text style={styles.assigneeText}>
                                    Phụ trách: <Text style={styles.assigneeBold}>{st.assigneeName}</Text> ({st.assigneeRole})
                                  </Text>

                                  {/* CHI TIẾT KẾT QUẢ NHÂN VIÊN ĐÃ THỰC HIỆN ĐƯỢC */}
                                  <View style={styles.actualResultContainer}>
                                    <Text style={styles.actualResultLabel}>KẾT QUẢ THỰC TẾ NHÂN VIÊN ĐẠT ĐƯỢC:</Text>
                                    <Text style={styles.actualResultText}>{st.actualResultDescription}</Text>

                                    {/* Metric Comparison Box */}
                                    {(st.targetMetric || st.achievedMetric) && (
                                      <View style={styles.metricComparisonBox}>
                                        <View style={styles.metricItem}>
                                          <Text style={styles.metricLabel}>Chỉ tiêu giao:</Text>
                                          <Text style={styles.metricValueTarget}>{st.targetMetric}</Text>
                                        </View>
                                        <Text style={styles.metricArrow}>➔</Text>
                                        <View style={styles.metricItem}>
                                          <Text style={styles.metricLabel}>Thực tế đạt:</Text>
                                          <Text style={styles.metricValueAchieved}>{st.achievedMetric}</Text>
                                        </View>
                                      </View>
                                    )}

                                    {/* Proof & Verification */}
                                    <View style={styles.verificationRow}>
                                      {st.proofNotes && (
                                        <Text style={styles.proofText}>• Đối soát: {st.proofNotes}</Text>
                                      )}
                                      {st.verifiedBy && (
                                        <Text style={styles.verifiedByText}>✓ {st.verifiedBy}</Text>
                                      )}
                                    </View>
                                  </View>
                                </View>
                              ))}
                            </View>
                          </View>
                        )}

                        {/* Actions or Approved Banner */}
                        {item.status === 'PENDING' ? (
                          <View style={styles.actionRow}>
                            <TouchableOpacity style={styles.approveBtn} onPress={() => handleApproveStaff(item)}>
                              <Text style={styles.approveBtnText}>PHÊ DUYỆT THĂNG CẤP NHÂN VIÊN</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.rejectBtn} onPress={() => handleRejectItem(item)}>
                              <Text style={styles.rejectBtnText}>Yêu Cầu Bổ Sung</Text>
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <View style={styles.approvedNoticeBox}>
                            <Text style={styles.approvedNoticeText}>
                              ✓ Đã duyệt thăng cấp Nhân viên lên {item.targetLevelName} & Đồng bộ hệ số Tết {item.retentionMultiplier}x
                            </Text>
                          </View>
                        )}
                      </View>
                    );
                  })
                )}

                <TouchableOpacity style={styles.nextStepBtn} onPress={() => setActiveStep(3)}>
                  <Text style={styles.nextStepBtnText}>TIẾP THEO: SANG BƯỚC 3 (DUYỆT LEADER & THỐNG KÊ) →</Text>
                </TouchableOpacity>
              </>
            )}

            {/* STEP 3: DUYỆT LEVEL LEADER */}
            {activeStep === 3 && (
              <>
                <Text style={styles.deptHeaderTitle}>DUYỆT LEVEL LEADER - PHÒNG {activeDept.name.toUpperCase()}</Text>

                {currentLeaderDeptItems.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyTitle}>Chưa có đề xuất thăng cấp Leader phòng {activeDept.name}</Text>
                    <Text style={styles.emptySub}>Leader phòng ban này đang giữ vững cấp bậc Level hiện tại.</Text>
                  </View>
                ) : (
                  currentLeaderDeptItems.map((item) => {
                    const isExpanded = !!expandedCards[item.id];

                    return (
                      <View key={item.id} style={[styles.compactAuditCard, styles.cardBorderLeader]}>
                        {/* Header: Candidate Info & Role Tag */}
                        <View style={styles.cardHeaderRow}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.candidateName}>{item.userName}</Text>
                            <Text style={styles.candidateDept}>Trưởng Phòng / Team Leader: {item.departmentName}</Text>
                          </View>

                          <View style={styles.roleBadgeLeader}>
                            <Text style={styles.roleBadgeTextLeader}>LEADER</Text>
                          </View>
                        </View>

                        {/* Level Upgrade Pill Banner */}
                        <View style={styles.levelTransitionRow}>
                          <View style={styles.levelPillOld}>
                            <Text style={styles.levelPillOldText}>{item.currentLevelName}</Text>
                          </View>
                          <Text style={styles.arrowIcon}>➔</Text>
                          <View style={styles.levelPillNewLeader}>
                            <Text style={styles.levelPillNewTextLeader}>{item.targetLevelName}</Text>
                          </View>
                        </View>

                        {/* Progress Bar & KPI % */}
                        <View style={styles.compactProgressBox}>
                          <View style={styles.progressLabelRow}>
                            <Text style={styles.progressTitle}>Tiến độ KPI quản trị toàn team:</Text>
                            <Text style={[styles.progressPercent, { color: '#059669' }]}>{item.overallProjectProgress}%</Text>
                          </View>
                          <View style={styles.progressTrack}>
                            <View style={[styles.progressFillLeader, { width: `${item.overallProjectProgress}%` }]} />
                          </View>
                        </View>

                        {/* Reward Highlights */}
                        <View style={styles.rewardSummaryRow}>
                          <View style={styles.rewardSummaryChip}>
                            <Text style={styles.rewardChipLabel}>Thưởng Nóng:</Text>
                            <Text style={styles.rewardChipValue}>+{item.promotionBonusAmount.toLocaleString('vi-VN')}đ</Text>
                          </View>
                          <View style={styles.rewardSummaryChip}>
                            <Text style={styles.rewardChipLabel}>Hệ Số Tết:</Text>
                            <Text style={styles.rewardChipValue}>{item.retentionMultiplier}x</Text>
                          </View>
                          <View style={[styles.rewardSummaryChip, { flex: 2 }]}>
                            <Text style={styles.rewardChipLabel}>Quà Hiện Vật:</Text>
                            <Text style={styles.rewardChipValue} numberOfLines={1}>
                              🎁 {item.rewardPhysicalItem}
                            </Text>
                          </View>
                        </View>

                        {/* Subtasks Accordion Toggle Button */}
                        <TouchableOpacity style={styles.accordionToggleBtn} onPress={() => toggleExpandCard(item.id)}>
                          <Text style={styles.accordionToggleText}>
                            {isExpanded
                              ? `▲ Thu gọn chi tiết việc con (${item.subTasks.length})`
                              : `▼ Xem chi tiết ${item.subTasks.length} việc con & kết quả quản trị`}
                          </Text>
                        </TouchableOpacity>

                        {/* Expanded Subtasks List with Rich Operational Details */}
                        {isExpanded && (
                          <View style={styles.expandedSubTaskBox}>
                            <Text style={styles.projectTitleLabel}>TÊN DỰ ÁN QUẢN TRỊ: {item.projectName}</Text>
                            <View style={styles.subTasksList}>
                              {item.subTasks.map((st) => (
                                <View key={st.id} style={styles.subTaskAuditItem}>
                                  {/* Subtask Title & Status Badge */}
                                  <View style={styles.subTaskHeaderRow}>
                                    <Text style={styles.subTaskTitle}>{st.bulletTitle}</Text>
                                    <View style={[styles.rateBadge, st.completionRate === 100 ? styles.rateBadgeComplete : styles.rateBadgeProgress]}>
                                      <Text style={[styles.rateBadgeText, st.completionRate === 100 ? styles.rateTextComplete : styles.rateTextProgress]}>
                                        {st.completionRate}% {st.completionRate === 100 ? 'Đạt 100%' : 'Đang làm'}
                                      </Text>
                                    </View>
                                  </View>

                                  {/* Assignee Meta */}
                                  <Text style={styles.assigneeText}>
                                    Phụ trách: <Text style={styles.assigneeBold}>{st.assigneeName}</Text> ({st.assigneeRole})
                                  </Text>

                                  {/* CHI TIẾT KẾT QUẢ LEADER ĐÃ THỰC HIỆN ĐƯỢC */}
                                  <View style={styles.actualResultContainer}>
                                    <Text style={styles.actualResultLabel}>KẾT QUẢ THỰC TẾ LEADER ĐẠT ĐƯỢC:</Text>
                                    <Text style={styles.actualResultText}>{st.actualResultDescription}</Text>

                                    {/* Metric Comparison Box */}
                                    {(st.targetMetric || st.achievedMetric) && (
                                      <View style={styles.metricComparisonBox}>
                                        <View style={styles.metricItem}>
                                          <Text style={styles.metricLabel}>Chỉ tiêu giao:</Text>
                                          <Text style={styles.metricValueTarget}>{st.targetMetric}</Text>
                                        </View>
                                        <Text style={styles.metricArrow}>➔</Text>
                                        <View style={styles.metricItem}>
                                          <Text style={styles.metricLabel}>Thực tế đạt:</Text>
                                          <Text style={styles.metricValueAchieved}>{st.achievedMetric}</Text>
                                        </View>
                                      </View>
                                    )}

                                    {/* Proof & Verification */}
                                    <View style={styles.verificationRow}>
                                      {st.proofNotes && (
                                        <Text style={styles.proofText}>• Đối soát: {st.proofNotes}</Text>
                                      )}
                                      {st.verifiedBy && (
                                        <Text style={styles.verifiedByText}>✓ {st.verifiedBy}</Text>
                                      )}
                                    </View>
                                  </View>
                                </View>
                              ))}
                            </View>
                          </View>
                        )}

                        {/* Actions or Approved Banner */}
                        {item.status === 'PENDING' ? (
                          <View style={styles.actionRow}>
                            <TouchableOpacity style={styles.leaderApproveBtn} onPress={() => handleApproveLeader(item)}>
                              <Text style={styles.approveBtnText}>PHÊ DUYỆT THĂNG CẤP LEADER</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.rejectBtn} onPress={() => handleRejectItem(item)}>
                              <Text style={styles.rejectBtnText}>Yêu Cầu Bổ Sung</Text>
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <View style={styles.approvedNoticeBox}>
                            <Text style={styles.approvedNoticeText}>
                              ✓ Đã phê duyệt thăng cấp Leader lên {item.targetLevelName} & Đồng bộ hệ số Tết {item.retentionMultiplier}x
                            </Text>
                          </View>
                        )}
                      </View>
                    );
                  })
                )}

                {/* EXECUTIVE MONTHLY REWARDS SUMMARY */}
                <View style={styles.summaryContainer}>
                  <Text style={styles.summaryHeaderTitle}>BÁO CÁO TỔNG HỢP DUYỆT LEVEL TOÀN CÔNG TY ({selectedMonth})</Text>

                  <View style={styles.summaryStatGrid}>
                    <View style={styles.statBoxCard}>
                      <Text style={styles.statBoxNumber}>12 Nhân Sự</Text>
                      <Text style={styles.statBoxLabel}>Tổng Đã Phê Duyệt Thăng Cấp</Text>
                    </View>

                    <View style={styles.statBoxCard}>
                      <Text style={styles.statBoxNumber}>48.000.000 VNĐ</Text>
                      <Text style={styles.statBoxLabel}>Tổng Thưởng Nóng Tiền Mặt</Text>
                    </View>

                    <View style={styles.statBoxCard}>
                      <Text style={styles.statBoxNumber}>5 MacBook, 4 iPad</Text>
                      <Text style={styles.statBoxLabel}>Quà Thưởng Hiện Vật Đã Trao</Text>
                    </View>
                  </View>

                  <TouchableOpacity style={styles.finishAllBtn} onPress={() => setActiveStep(1)}>
                    <Text style={styles.finishAllBtnText}>HOÀN TẤT & ĐỒNG BỘ NĂNG SUẤT REAL-TIME</Text>
                  </TouchableOpacity>
                </View>
              </>
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
    paddingTop: 10,
    paddingBottom: 14,
  },
  executiveHeaderCard: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  executiveBadgeTitle: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  subTitle: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  stepperWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    marginTop: 6,
    marginBottom: 4,
  },
  stepItemPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  stepItemPillActive: {
    backgroundColor: '#334155',
  },
  stepCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    backgroundColor: '#2563EB',
  },
  stepCircleInactive: {
    backgroundColor: '#475569',
  },
  stepNumberText: {
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  stepNumberTextActive: {
    color: '#FFFFFF',
  },
  stepNumberTextInactive: {
    color: '#CBD5E1',
  },
  stepLabelText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  stepLabelTextActive: {
    color: '#FFFFFF',
  },
  stepLabelTextInactive: {
    color: '#94A3B8',
  },
  stepConnectorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#475569',
    marginHorizontal: 4,
    minWidth: 8,
  },
  pageBodyContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    color: '#64748B',
    fontSize: 13,
  },
  scroll: {
    padding: 16,
  },
  filterSubLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  deptHeaderTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  filterScrollRow: {
    marginBottom: 16,
  },
  monthPill: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  monthPillActive: {
    backgroundColor: '#1E40AF',
  },
  monthPillText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#475569',
  },
  monthPillTextActive: {
    color: '#FFFFFF',
  },

  /* Dept Card Grid (Step 1) */
  deptCardGrid: {
    gap: 12,
  },
  deptCardItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  deptCardItemActive: {
    borderColor: '#2563EB',
    borderWidth: 2,
  },
  deptCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  deptCardName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  deptBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  deptBadgeText: {
    color: '#D97706',
    fontSize: 10,
    fontWeight: 'bold',
  },
  deptCardBody: {
    gap: 4,
    marginBottom: 12,
  },
  deptDetailLine: {
    fontSize: 12,
    color: '#475569',
  },
  boldBlue: {
    fontWeight: 'bold',
    color: '#2563EB',
  },
  boldAmber: {
    fontWeight: 'bold',
    color: '#059669',
  },
  deptCardFooter: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
    alignItems: 'flex-end',
  },
  deptActionText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2563EB',
  },

  /* Compact Candidate Approval Card */
  compactAuditCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  cardBorderStaff: {
    borderLeftWidth: 4,
    borderLeftColor: '#2563EB',
  },
  cardBorderLeader: {
    borderLeftWidth: 4,
    borderLeftColor: '#059669',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  candidateName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  candidateDept: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  roleBadgeStaff: {
    backgroundColor: '#DBEAFE',
    borderColor: '#93C5FD',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  roleBadgeLeader: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  roleBadgeTextStaff: {
    color: '#1D4ED8',
    fontSize: 10,
    fontWeight: 'bold',
  },
  roleBadgeTextLeader: {
    color: '#15803D',
    fontSize: 10,
    fontWeight: 'bold',
  },

  /* Level Transition Banner */
  levelTransitionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 8,
    marginBottom: 10,
    gap: 8,
  },
  levelPillOld: {
    backgroundColor: '#CBD5E1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  levelPillOldText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  arrowIcon: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: 'bold',
  },
  levelPillNewStaff: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    flex: 1,
  },
  levelPillNewLeader: {
    backgroundColor: '#059669',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    flex: 1,
  },
  levelPillNewTextStaff: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  levelPillNewTextLeader: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  /* Compact Progress Box */
  compactProgressBox: {
    marginBottom: 10,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  progressTitle: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '500',
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2563EB',
  },
  progressTrack: {
    height: 7,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2563EB',
    borderRadius: 4,
  },
  progressFillLeader: {
    height: '100%',
    backgroundColor: '#059669',
    borderRadius: 4,
  },

  /* Reward Summary Row */
  rewardSummaryRow: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: '#FEFCE8',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FEF08A',
    marginBottom: 10,
  },
  rewardSummaryChip: {
    flex: 1,
  },
  rewardChipLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#A16207',
  },
  rewardChipValue: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#854D0E',
    marginTop: 1,
  },

  /* Accordion Toggle Button */
  accordionToggleBtn: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  accordionToggleText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#475569',
  },
  expandedSubTaskBox: {
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  projectTitleLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
  },
  subTasksList: {
    gap: 10,
  },
  subTaskAuditItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  subTaskHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 4,
  },
  subTaskTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0F172A',
    flex: 1,
  },
  assigneeText: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 8,
  },
  assigneeBold: {
    fontWeight: 'bold',
    color: '#1E40AF',
  },
  rateBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  rateBadgeComplete: {
    backgroundColor: '#D1FAE5',
  },
  rateBadgeProgress: {
    backgroundColor: '#FEF3C7',
  },
  rateBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  rateTextComplete: {
    color: '#065F46',
  },
  rateTextProgress: {
    color: '#92400E',
  },

  /* Actual Result Rich Container */
  actualResultContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    padding: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#10B981',
    marginTop: 2,
  },
  actualResultLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#047857',
    marginBottom: 4,
    letterSpacing: 0.4,
  },
  actualResultText: {
    fontSize: 11,
    color: '#1E293B',
    lineHeight: 16,
    marginBottom: 6,
  },
  metricComparisonBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    padding: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 6,
    gap: 6,
  },
  metricItem: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 9,
    color: '#64748B',
    fontWeight: '600',
  },
  metricValueTarget: {
    fontSize: 10,
    color: '#475569',
    fontWeight: 'bold',
    marginTop: 1,
  },
  metricValueAchieved: {
    fontSize: 10,
    color: '#059669',
    fontWeight: 'bold',
    marginTop: 1,
  },
  metricArrow: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: 'bold',
  },
  verificationRow: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 4,
    gap: 2,
  },
  proofText: {
    fontSize: 10,
    color: '#64748B',
    fontStyle: 'italic',
  },
  verifiedByText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#047857',
  },

  /* Action Buttons */
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  approveBtn: {
    flex: 2,
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  leaderApproveBtn: {
    flex: 2,
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  approveBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  rejectBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  rejectBtnText: {
    color: '#475569',
    fontWeight: 'bold',
    fontSize: 11,
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

  /* Step Navigation & Summary */
  emptyCard: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 14,
    alignItems: 'center',
    marginVertical: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
  nextStepBtn: {
    backgroundColor: '#1E293B',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  nextStepBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  summaryContainer: {
    gap: 14,
    marginTop: 10,
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
  finishAllBtn: {
    backgroundColor: '#1E293B',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  finishAllBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
    letterSpacing: 0.8,
  },
});
