import type { DashboardRole } from '../api/dashboard.api';

export interface OnboardingSlide {
  id: string;
  title: string;
  description: string;
  lottieUrl?: string; // We can use require() or a URL. For now we use emoji or local animation if available.
  iconName?: any; // MaterialCommunityIcons fallback
}

export const ONBOARDING_DATA: Record<DashboardRole, OnboardingSlide[]> = {
  EMPLOYEE: [
    {
      id: 'emp-1',
      title: 'Chấm công tiện lợi',
      description: 'Chấm công vào/ra ca chỉ với một chạm ngay tại màn hình chính.',
      iconName: 'clock-check-outline',
    },
    {
      id: 'emp-2',
      title: 'Theo dõi ca làm',
      description: 'Nắm bắt lịch làm việc tuần/tháng một cách trực quan, giúp bạn dễ dàng sắp xếp thời gian.',
      iconName: 'calendar-month-outline',
    },
    {
      id: 'emp-3',
      title: 'Đơn từ nhanh chóng',
      description: 'Tạo đơn xin nghỉ, làm thêm, hoặc đi trễ về sớm trực tiếp trên điện thoại mọi lúc mọi nơi.',
      iconName: 'file-document-edit-outline',
    },
  ],
  LEADER: [
    {
      id: 'lead-1',
      title: 'Ưu tiên Phê duyệt',
      description: 'Mọi yêu cầu của nhân viên đều nằm ở hàng đợi đầu tiên, giúp bạn không bỏ lỡ bất kỳ đơn từ nào.',
      iconName: 'check-decagram-outline',
    },
    {
      id: 'lead-2',
      title: 'Thống kê tức thời',
      description: 'Báo cáo quân số đi làm, vắng mặt, đi trễ được cập nhật realtime mỗi ngày.',
      iconName: 'chart-pie',
    },
    {
      id: 'lead-3',
      title: 'Quản lý Đội nhóm',
      description: 'Giao việc, nhắc nhở và đánh giá hiệu suất của từng cá nhân trong team một cách dễ dàng.',
      iconName: 'account-group-outline',
    },
  ],
  ADMIN: [
    {
      id: 'admin-1',
      title: 'Quản trị Hồ sơ',
      description: 'Dễ dàng duyệt tạo tài khoản mới và cấp quyền cho từng cá nhân.',
      iconName: 'shield-account-outline',
    },
    {
      id: 'admin-2',
      title: 'Cơ cấu Tổ chức',
      description: 'Thiết lập và quản lý các Chi nhánh, Phòng ban một cách linh hoạt.',
      iconName: 'sitemap',
    },
    {
      id: 'admin-3',
      title: 'Báo cáo Toàn cảnh',
      description: 'Theo dõi các biểu đồ chuyên sâu về hiệu suất và tình hình nhân sự của toàn công ty.',
      iconName: 'chart-bar-stacked',
    },
  ],
};
