export const queryKeys = {
  approvals: <T extends object>(filters: T) => ['approvals', filters] as const,
  approval: (id: string) => ['approval', id] as const,
  employees: <T extends object>(filters: T) => ['employees', filters] as const,
  employeeReport: <T extends object>(filters: T) => ['employee-report', filters] as const,
  employee: (id: string) => ['employee', id] as const,
  departments: <T extends object>(filters: T = {} as T) => ['departments', filters] as const,
  department: (id: string) => ['department', id] as const,
  positions: (departmentId?: string) => ['positions', departmentId ?? 'all'] as const,
  dashboard: (role: string) => ['dashboard', role] as const,
  shifts: <T extends object>(filters: T = {} as T) => ['shifts', filters] as const,
  shiftSchedule: <T extends object>(filters: T = {} as T) => ['shift-schedule', filters] as const,
  shiftToday: () => ['shift-schedule', 'today'] as const,
  attendanceCurrent: () => ['attendance', 'current'] as const,
  attendanceHistory: <T extends object>(filters: T = {} as T) => ['attendance', 'history', filters] as const,
  attendanceDetail: (id: string) => ['attendance', 'detail', id] as const,
  leaveBalance: () => ['leave', 'balance'] as const,
  leaveRequests: <T extends object>(filters: T = {} as T) => ['leave', 'requests', filters] as const,
  leaveRequest: (id: string) => ['leave', 'request', id] as const,
  overtimeRequests: <T extends object>(filters: T = {} as T) => ['overtime', 'requests', filters] as const,
  overtimeRequest: (id: string) => ['overtime', 'request', id] as const,
  employeeRequests: <T extends object>(filters: T = {} as T) => ['employee-requests', filters] as const,
  employeeRequest: (id: string) => ['employee-request', id] as const,
  tasks: <T extends object>(filters: T = {} as T) => ['tasks', filters] as const,
  myTasks: <T extends object>(filters: T = {} as T) => ['tasks', 'me', filters] as const,
  task: (id: string) => ['tasks', 'detail', id] as const,
  taskTimeline: (id: string) => ['tasks', 'timeline', id] as const,
  taskReviewQueue: <T extends object>(filters: T = {} as T) => ['task-assignments', 'review-queue', filters] as const,
  taskGroups: <T extends object>(filters: T = {} as T) => ['task-groups', filters] as const,
  taskGroup: (id: string) => ['task-groups', 'detail', id] as const,
  taskExtensions: <T extends object>(filters: T = {} as T) => ['task-extensions', filters] as const,
  taskExtensionPending: <T extends object>(filters: T = {} as T) => ['task-extensions', 'pending', filters] as const,
  crossDepartmentRequests: <T extends object>(filters: T = {} as T) => ['cross-department-requests', filters] as const,
  crossDepartmentRequest: (id: string) => ['cross-department-requests', 'detail', id] as const,
  scopedEmployees: <T extends object>(filters: T = {} as T) => ['employees', 'scoped', filters] as const,
  notifications: () => ['notifications', 'me'] as const,
  notificationUnreadCount: () => ['notifications', 'unread-count'] as const,
};

// Phase 5 warehouse/asset key factories — dùng factory, không rải literal array trong screen/hook.

export const warehouseKeys = {
  all: ['warehouses'] as const,
  list: () => ['warehouses', 'list'] as const,
  detail: (id: string) => ['warehouses', 'detail', id] as const,
};

export const materialKeys = {
  all: ['materials'] as const,
  list: () => ['materials', 'list'] as const,
  detail: (id: string) => ['materials', 'detail', id] as const,
  categories: () => ['material-categories'] as const,
};

export const stockKeys = {
  all: ['warehouse-stocks'] as const,
  byWarehouse: (warehouseId: string) => ['warehouse-stocks', warehouseId] as const,
};

export const receiptKeys = {
  all: ['stock-receipts'] as const,
  list: () => ['stock-receipts', 'list'] as const,
  detail: (id: string) => ['stock-receipts', 'detail', id] as const,
};

export const materialIssueKeys = {
  all: ['material-issues'] as const,
  list: () => ['material-issues', 'list'] as const,
  detail: (id: string) => ['material-issues', 'detail', id] as const,
};

export const transferKeys = {
  all: ['stock-transfers'] as const,
  list: () => ['stock-transfers', 'list'] as const,
};

export const assetKeys = {
  all: ['assets'] as const,
  list: () => ['assets', 'list'] as const,
  my: () => ['assets', 'my'] as const,
  detail: (id: string) => ['assets', 'detail', id] as const,
};

export const assignmentKeys = {
  all: ['asset-assignments'] as const,
};

export const maintenanceKeys = {
  all: ['asset-maintenance'] as const,
  activeByAsset: (assetId: string) => ['asset-maintenance', 'active', assetId] as const,
};

export const inventoryCheckKeys = {
  all: ['inventory-checks'] as const,
  list: () => ['inventory-checks', 'list'] as const,
  detail: (id: string) => ['inventory-checks', 'detail', id] as const,
};

export const newsfeedKeys = {
  all: ['newsfeed'] as const,
  list: (departmentId?: string) => ['newsfeed', 'list', departmentId ?? 'all'] as const,
  detail: (id: string) => ['newsfeed', 'detail', id] as const,
};

export const chatKeys = {
  all: ['chat'] as const,
  groups: () => ['chat', 'groups'] as const,
  allGroups: () => ['chat', 'all-groups'] as const,
  messages: (groupId: string) => ['chat', 'messages', groupId] as const,
};

export const contractTemplateKeys = {
  all: ['contract-templates'] as const,
  list: () => ['contract-templates', 'list'] as const,
  detail: (id: string) => ['contract-templates', 'detail', id] as const,
};

export const contractKeys = {
  all: ['contracts'] as const,
  list: (departmentId?: string) => ['contracts', 'list', departmentId ?? 'all'] as const,
  expiring: (days?: number) => ['contracts', 'expiring', days ?? 30] as const,
  detail: (id: string) => ['contracts', 'detail', id] as const,
};
