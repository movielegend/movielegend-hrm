export interface AppRegistryItem {
  key: string;
  title: string;
  adminTitle?: string;
  leaderTitle?: string;
  employeeTitle?: string;
  hrTitle?: string;
  category: 'operations' | 'admin_docs' | 'finance' | 'warehouse';
  icon: string; // Lucide icon name
  color: string;
  bgColor: string;
  adminRoute?: string;
  leaderRoute?: string;
  employeeRoute?: string;
  hrRoute?: string;
  isCore?: boolean;
  badgeKey?: 'pendingRequests' | 'dueTasks' | 'pendingVault' | 'pendingFinancial';
}

export const CORE_APP_KEYS = ['attendance', 'requests', 'tasks', 'ai_chat', 'feedbacks'] as const;

export const APP_CATEGORIES = [
  { id: 'operations', label: 'VẬN HÀNH & NHÂN SỰ' },
  { id: 'admin_docs', label: 'HÀNH CHÍNH & TÀI LIỆU' },
  { id: 'finance', label: 'TÀI CHÍNH & ĐÃI NGỘ' },
  { id: 'warehouse', label: 'KHO BÃI & TÀI SẢN' },
] as const;

export const APP_REGISTRY: Record<string, AppRegistryItem> = {
  // 4 Cốt lõi (Core)
  attendance: {
    key: 'attendance',
    title: 'Chấm công',
    category: 'operations',
    icon: 'Clock',
    color: '#0284C7',
    bgColor: '#E0F2FE',
    adminRoute: '/admin/attendance',
    leaderRoute: '/leader/attendance',
    employeeRoute: '/employee/attendance',
    hrRoute: '/hr/attendance-management',
    isCore: true,
  },
  requests: {
    key: 'requests',
    title: 'Đơn từ',
    adminTitle: 'Duyệt đơn từ',
    leaderTitle: 'Duyệt đơn từ',
    employeeTitle: 'Đơn từ',
    hrTitle: 'Duyệt đơn từ',
    category: 'admin_docs',
    icon: 'SquareCheck',
    color: '#0D9488',
    bgColor: '#CCFBF1',
    adminRoute: '/admin/approvals',
    leaderRoute: '/leader/approvals',
    employeeRoute: '/employee/requests',
    hrRoute: '/hr/requests',
    badgeKey: 'pendingRequests',
    isCore: true,
  },
  tasks: {
    key: 'tasks',
    title: 'Giao việc',
    adminTitle: 'Giao việc',
    leaderTitle: 'Giao việc',
    employeeTitle: 'Công việc',
    hrTitle: 'Giao việc',
    category: 'admin_docs',
    icon: 'Briefcase',
    color: '#6366F1',
    bgColor: '#EDE9FE',
    adminRoute: '/admin/tasks',
    leaderRoute: '/leader/tasks',
    employeeRoute: '/employee/tasks',
    hrRoute: '/hr/tasks',
    badgeKey: 'dueTasks',
    isCore: true,
  },
  feedbacks: {
    key: 'feedbacks',
    title: 'Góp ý',
    category: 'admin_docs',
    icon: 'MessageSquare',
    color: '#059669',
    bgColor: '#ECFDF5',
    adminRoute: '/admin/feedbacks',
    leaderRoute: '/leader/feedbacks',
    employeeRoute: '/employee/feedbacks',
    hrRoute: '/hr/feedbacks',
    isCore: true,
  },

  // Vận hành & Nhân sự
  shifts: {
    key: 'shifts',
    title: 'Ca làm',
    employeeTitle: 'Ca làm',
    leaderTitle: 'Phân ca làm',
    adminTitle: 'Phân ca làm',
    hrTitle: 'Phân ca làm',
    category: 'operations',
    icon: 'Calendar',
    color: '#EA580C',
    bgColor: '#FFEDD5',
    adminRoute: '/admin/shifts',
    leaderRoute: '/leader/shift-management',
    employeeRoute: '/employee/schedule',
    hrRoute: '/hr/shift-management',
  },
  shift_swaps: {
    key: 'shift_swaps',
    title: 'Đổi ca',
    category: 'operations',
    icon: 'ArrowRightLeft',
    color: '#9333EA',
    bgColor: '#F3E8FF',
    adminRoute: '/leader/shift-swaps',
    leaderRoute: '/leader/shift-swaps',
    employeeRoute: '/employee/shift-swaps',
    hrRoute: '/hr/shift-swaps',
  },
  timesheet: {
    key: 'timesheet',
    title: 'Bảng công',
    category: 'operations',
    icon: 'CalendarDays',
    color: '#0D9488',
    bgColor: '#CCFBF1',
    adminRoute: '/admin/timesheet',
    leaderRoute: '/leader/timesheet',
    employeeRoute: '/employee/timesheet',
    hrRoute: '/hr/timesheet',
  },
  employees: {
    key: 'employees',
    title: 'Hồ sơ nhân sự',
    category: 'operations',
    icon: 'Users',
    color: '#7C3AED',
    bgColor: '#F3E8FF',
    adminRoute: '/admin/employees',
    leaderRoute: '/leader/employees',
    employeeRoute: '/employee/profile',
    hrRoute: '/hr/employees',
  },
  departments: {
    key: 'departments',
    title: 'Cơ cấu PB',
    category: 'operations',
    icon: 'Building2',
    color: '#475569',
    bgColor: '#F1F5F9',
    adminRoute: '/admin/departments',
  },
  locations: {
    key: 'locations',
    title: 'Điểm chấm công',
    category: 'operations',
    icon: 'MapPin',
    color: '#E11D48',
    bgColor: '#FFE4E6',
    adminRoute: '/admin/attendance-locations',
  },
  ot_live: {
    key: 'ot_live',
    title: 'OT Live',
    employeeTitle: 'OT Live',
    leaderTitle: 'Duyệt OT Live',
    adminTitle: 'Duyệt OT Live',
    hrTitle: 'Duyệt OT Live',
    category: 'operations',
    icon: 'Tv',
    color: '#E11D48',
    bgColor: '#FFE4E6',
    adminRoute: '/leader/ot-report-approvals',
    leaderRoute: '/leader/ot-report-approvals',
    employeeRoute: '/employee/ot-report',
    hrRoute: '/leader/ot-report-approvals',
  },

  // Hành chính & Tài liệu
  contracts: {
    key: 'contracts',
    title: 'Hợp đồng lao động',
    category: 'admin_docs',
    icon: 'FileText',
    color: '#2563EB',
    bgColor: '#EFF6FF',
    adminRoute: '/admin/contracts',
    leaderRoute: '/leader/contracts',
    employeeRoute: '/employee/contracts',
    hrRoute: '/hr/contracts',
  },
  documents: {
    key: 'documents',
    title: 'Tài liệu nội bộ',
    category: 'admin_docs',
    icon: 'FolderOpen',
    color: '#D97706',
    bgColor: '#FEF3C7',
    adminRoute: '/admin/documents',
    leaderRoute: '/leader/documents',
    employeeRoute: '/employee/documents',
    hrRoute: '/hr/documents',
  },
  my_tasks: {
    key: 'my_tasks',
    title: 'Công việc của tôi',
    adminTitle: 'Công việc của tôi',
    leaderTitle: 'Công việc của tôi',
    hrTitle: 'Công việc của tôi',
    category: 'admin_docs',
    icon: 'ClipboardCheck',
    color: '#0284C7',
    bgColor: '#E0F2FE',
    adminRoute: '/admin/tasks',
    leaderRoute: '/leader/my-tasks',
    hrRoute: '/hr/my-tasks',
    badgeKey: 'dueTasks',
  },
  daily_reports: {
    key: 'daily_reports',
    title: 'Báo cáo ngày',
    category: 'admin_docs',
    icon: 'FileSpreadsheet',
    color: '#16A34A',
    bgColor: '#DCFCE7',
    adminRoute: '/admin/daily-reports',
    leaderRoute: '/leader/daily-report',
    employeeRoute: '/employee/daily-report',
    hrRoute: '/hr/daily-report',
  },
  news: {
    key: 'news',
    title: 'Đăng tin tức',
    category: 'admin_docs',
    icon: 'Newspaper',
    color: '#0D9488',
    bgColor: '#CCFBF1',
    adminRoute: '/admin/newsfeed',
    leaderRoute: '/leader/newsfeed',
    employeeRoute: '/employee/newsfeed',
    hrRoute: '/hr/newsfeed',
  },

  // Tài chính & Đãi ngộ
  financial: {
    key: 'financial',
    title: 'Duyệt tài chính',
    employeeTitle: 'Đơn tài chính',
    leaderTitle: 'Duyệt tài chính',
    adminTitle: 'Duyệt tài chính',
    hrTitle: 'Duyệt tài chính',
    category: 'finance',
    icon: 'Receipt',
    color: '#16A34A',
    bgColor: '#DCFCE7',
    adminRoute: '/admin/approvals',
    leaderRoute: '/leader/financial-requests',
    employeeRoute: '/employee/requests',
    hrRoute: '/hr/financial-requests',
    badgeKey: 'pendingFinancial',
  },
  payslip: {
    key: 'payslip',
    title: 'Bảng lương',
    category: 'finance',
    icon: 'CreditCard',
    color: '#2563EB',
    bgColor: '#EFF6FF',
    adminRoute: '/admin/payslip',
    leaderRoute: '/leader/payslip',
    employeeRoute: '/employee/payslip',
    hrRoute: '/hr/payslip',
  },
  vault: {
    key: 'vault',
    title: 'Ví Thưởng Tết',
    category: 'finance',
    icon: 'Coins',
    color: '#F59E0B',
    bgColor: '#FEF3C7',
    adminRoute: '/admin/vault',
    leaderRoute: '/leader/vault',
    employeeRoute: '/employee/vault',
    hrRoute: '/hr/vault',
    badgeKey: 'pendingVault',
  },
  levels: {
    key: 'levels',
    title: 'Level',
    adminTitle: 'Cấu hình Level',
    leaderTitle: 'Level',
    employeeTitle: 'Level',
    hrTitle: 'Level',
    category: 'finance',
    icon: 'Crown',
    color: '#D97706',
    bgColor: '#FEF3C7',
    adminRoute: '/admin/levels',
    leaderRoute: '/leader/leveling',
    employeeRoute: '/employee/leveling',
    hrRoute: '/hr/leveling',
  },
  competition: {
    key: 'competition',
    title: 'Dự án',
    category: 'finance',
    icon: 'Trophy',
    color: '#EAB308',
    bgColor: '#FEF9C3',
    adminRoute: '/admin/competition/review',
    leaderRoute: '/leader/level-projects',
    employeeRoute: '/employee/level-projects',
    hrRoute: '/hr/level-projects',
  },

  // Kho bãi & Tài sản
  assets: {
    key: 'assets',
    title: 'Tài sản',
    category: 'warehouse',
    icon: 'Laptop',
    color: '#475569',
    bgColor: '#F1F5F9',
    adminRoute: '/admin/assets',
    leaderRoute: '/leader/assets',
    employeeRoute: '/employee/assets',
    hrRoute: '/hr/assets',
  },

  warehouses: {
    key: 'warehouses',
    title: 'Kho bãi',
    category: 'warehouse',
    icon: 'Warehouse',
    color: '#B45309',
    bgColor: '#FEF3C7',
    adminRoute: '/admin/warehouses',
  },
  materials: {
    key: 'materials',
    title: 'Vật tư kho',
    category: 'warehouse',
    icon: 'Package',
    color: '#1E40AF',
    bgColor: '#DBEAFE',
    adminRoute: '/admin/materials',
    leaderRoute: '/leader/material-issues',
    hrRoute: '/hr/material-issues',
  },
  stock_receipts: {
    key: 'stock_receipts',
    title: 'Nhập kho',
    category: 'warehouse',
    icon: 'Boxes',
    color: '#0F766E',
    bgColor: '#CCFBF1',
    adminRoute: '/admin/stock-receipts',
  },
  material_issues: {
    key: 'material_issues',
    title: 'Xuất kho',
    category: 'warehouse',
    icon: 'Boxes',
    color: '#C2410C',
    bgColor: '#FFEDD5',
    adminRoute: '/admin/material-issues',
    leaderRoute: '/leader/material-issues',
    hrRoute: '/hr/material-issues',
  },
  inventory_checks: {
    key: 'inventory_checks',
    title: 'Kiểm kê kho',
    category: 'warehouse',
    icon: 'ClipboardCheck',
    color: '#6B21A8',
    bgColor: '#F3E8FF',
    adminRoute: '/admin/inventory-checks',
  },
  ai_chat: {
    key: 'ai_chat',
    title: 'Trợ lý AI',
    category: 'operations',
    icon: 'Sparkles',
    color: '#7C3AED',
    bgColor: '#EDE9FE',
    adminRoute: '/admin/ai-chat',
    leaderRoute: '/leader/ai-chat',
    employeeRoute: '/employee/ai-chat',
    hrRoute: '/hr/ai-chat',
  },
};

export const ALL_APPS_LIST: AppRegistryItem[] = Object.values(APP_REGISTRY).filter(
  (item) => !['stock_receipts', 'material_issues', 'inventory_checks'].includes(item.key),
);

export function isUserInLiveDepartment(user?: any): boolean {
  if (!user) return false;
  const deptName = (user.department?.name || '').toLowerCase();
  const deptCode = (user.department?.code || '').toLowerCase();
  if (deptName.includes('live') || deptCode.includes('live')) return true;
  if (Array.isArray(user.departmentLinks)) {
    return user.departmentLinks.some((l: any) => {
      const name = (l?.department?.name || l?.name || '').toLowerCase();
      const code = (l?.department?.code || l?.code || '').toLowerCase();
      return name.includes('live') || code.includes('live');
    });
  }
  return false;
}

export function isAppAllowedForRole(
  item: AppRegistryItem,
  role: 'ADMIN' | 'LEADER' | 'EMPLOYEE' | 'HR',
  user?: any,
): boolean {
  // Ẩn 3 dịch vụ kho: Nhập kho, Xuất kho, Kiểm kê kho với mọi role
  if (
    item.key === 'stock_receipts' ||
    item.key === 'material_issues' ||
    item.key === 'inventory_checks'
  ) {
    return false;
  }

  if (role === 'ADMIN') return true;

  // Duyệt OT Live / Báo cáo OT Live: chỉ dành cho nhân sự thuộc phòng LIVE (hoặc ADMIN)
  if (item.key === 'ot_live') {
    if (!isUserInLiveDepartment(user)) {
      return false;
    }
  }

  if (role === 'HR') return Boolean(item.hrRoute);
  if (role === 'LEADER') return Boolean(item.leaderRoute);
  if (role === 'EMPLOYEE') return Boolean(item.employeeRoute);
  return false;
}

export function getAppRoute(item: AppRegistryItem, role: 'ADMIN' | 'LEADER' | 'EMPLOYEE' | 'HR' = 'ADMIN'): string | null {
  if (role === 'HR') return item.hrRoute || (item.employeeRoute ? item.employeeRoute : null);
  if (role === 'LEADER') return item.leaderRoute || (item.employeeRoute ? item.employeeRoute : null);
  if (role === 'EMPLOYEE') return item.employeeRoute || null;
  return item.adminRoute || item.leaderRoute || item.hrRoute || item.employeeRoute || '/admin/(tabs)';
}

export function getAppTitle(item: AppRegistryItem, role: 'ADMIN' | 'LEADER' | 'EMPLOYEE' | 'HR' = 'ADMIN'): string {
  if (role === 'ADMIN' && item.adminTitle) return item.adminTitle;
  if (role === 'LEADER' && item.leaderTitle) return item.leaderTitle;
  if (role === 'EMPLOYEE' && item.employeeTitle) return item.employeeTitle;
  if (role === 'HR' && item.hrTitle) return item.hrTitle;
  return item.title;
}


