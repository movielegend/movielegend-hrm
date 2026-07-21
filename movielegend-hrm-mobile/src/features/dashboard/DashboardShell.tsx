import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { Screen } from '../../components/Screen';
import { SecondaryButton } from '../../components/Buttons';

import { useDashboard } from '../../hooks/useDashboard';
import { useAuth } from '../../providers/AuthProvider';

import { colors } from '../../theme/colors';
import { ConfirmModal } from '../../components/ConfirmModal';
import { spacing } from '../../theme/spacing';

import type { DashboardRole } from '../../api/dashboard.api';

import { hasPermission } from '../../utils/permissions';

interface DashboardShellProps {
  role: DashboardRole;
  title: string;
}

interface DashboardMetric {
  key: string;
  label: string;
  value: string;
}

interface DashboardSection {
  key: string;
  label: string;
  metrics: DashboardMetric[];
}

export function DashboardShell({
  role,
  title,
}: DashboardShellProps) {
  const router = useRouter();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const {
    user,
    logout,
  } = useAuth();

  const dashboard = useDashboard(role);

  const sections = useMemo(
    () => toDashboardSections(dashboard.data),
    [dashboard.data],
  );

  if (dashboard.isLoading) {
    return <LoadingState label="Đang tải dashboard" />;
  }

  if (dashboard.isError) {
    return (
      <ErrorState
        error={dashboard.error}
        onRetry={() => void dashboard.refetch()}
      />
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerInfo}>
            <Text style={styles.kicker}>
              {user?.fullName ?? user?.phone ?? 'Người dùng'}
            </Text>

            <Text style={styles.title}>
              {title}
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() => setShowLogoutConfirm(true)}
            style={styles.logoutButton}
          >
            <Text style={styles.logoutText}>
              Đăng xuất
            </Text>
          </Pressable>
        </View>

        {/* SESSION INFO */}
        <View style={styles.identity}>
          <Text style={styles.identityTitle}>
            Thông tin đăng nhập
          </Text>

          <Text style={styles.identityText}>
            Mã NV: {user?.userCode ?? '-'}
          </Text>

          <Text style={styles.identityText}>
            Vai trò: {user?.roles?.join(', ') || '-'}
          </Text>

          <Text style={styles.identityText}>
            Phòng ban: {user?.department?.name ?? 'Chưa gán'}
          </Text>
        </View>

        {/* NAVIGATION */}
        <View style={styles.navigationSection}>
          <Text style={styles.navigationTitle}>
            Chức năng
          </Text>

          <View style={styles.navGrid}>
            {role === 'ADMIN' ? (
              <>
                <SecondaryButton
                  onPress={() => router.push('/admin/employees')}
                >
                  Nhân sự
                </SecondaryButton>

                <SecondaryButton
                  onPress={() => router.push('/admin/approvals')}
                >
                  Duyệt tài khoản
                </SecondaryButton>

                <SecondaryButton
                  onPress={() => router.push('/admin/departments')}
                >
                  Phòng ban
                </SecondaryButton>

                {hasPermission(user, 'shift.read') ? (
                  <SecondaryButton
                    onPress={() => router.push('/admin/shifts')}
                  >
                    Ca làm
                  </SecondaryButton>
                ) : null}

                {hasPermission(user, 'attendance.read') ? (
                  <SecondaryButton
                    onPress={() => router.push('/admin/attendance')}
                  >
                    Chấm công
                  </SecondaryButton>
                ) : null}

                {hasPermission(user, 'attendance.config') ? (
                  <SecondaryButton
                    onPress={() =>
                      router.push('/admin/attendance-locations')
                    }
                  >
                    Điểm chấm công
                  </SecondaryButton>
                ) : null}

                {hasPermission(user, 'role.assign') ? (
                  <SecondaryButton
                    onPress={() => router.push('/admin/leaders')}
                  >
                    Gán Leader
                  </SecondaryButton>
                ) : null}

                {hasPermission(user, 'task.read_all') ? (
                  <SecondaryButton
                    onPress={() => router.push('/admin/tasks')}
                  >
                    Công việc
                  </SecondaryButton>
                ) : null}

                {hasPermission(user, 'task.group.manage_all') ? (
                  <SecondaryButton
                    onPress={() => router.push('/admin/task-groups')}
                  >
                    Nhóm công việc
                  </SecondaryButton>
                ) : null}

                {hasPermission(user, 'cross_department.read_all') ? (
                  <SecondaryButton
                    onPress={() =>
                      router.push('/admin/cross-department')
                    }
                  >
                    Liên phòng ban
                  </SecondaryButton>
                ) : null}

                {hasAnyWarehousePermission(user) ? (
                  <SecondaryButton
                    onPress={() => router.push('/admin/warehouses')}
                  >
                    Warehouse
                  </SecondaryButton>
                ) : null}

                {hasPermission(user, 'material.read') ? (
                  <SecondaryButton
                    onPress={() => router.push('/admin/materials')}
                  >
                    Materials
                  </SecondaryButton>
                ) : null}



                {hasPermission(user, 'stock.read') ? (
                  <SecondaryButton
                    onPress={() => router.push('/admin/stock-receipts')}
                  >
                    Stock receipts
                  </SecondaryButton>
                ) : null}

                {hasPermission(user, 'material_issue.read') ? (
                  <SecondaryButton
                    onPress={() => router.push('/admin/material-issues')}
                  >
                    Material issues
                  </SecondaryButton>
                ) : null}

                {hasPermission(user, 'stock.read') ? (
                  <SecondaryButton
                    onPress={() => router.push('/admin/stock-transfers')}
                  >
                    Stock transfers
                  </SecondaryButton>
                ) : null}

                {hasPermission(user, 'inventory_check.read') ? (
                  <SecondaryButton
                    onPress={() => router.push('/admin/inventory-checks')}
                  >
                    Inventory checks
                  </SecondaryButton>
                ) : null}

                {hasPermission(user, 'asset.incident.read') ? (
                  <SecondaryButton
                    onPress={() => router.push('/admin/asset-incidents')}
                  >
                    Asset incidents
                  </SecondaryButton>
                ) : null}

                {hasPermission(user, 'notification.read') ? (
                  <SecondaryButton
                    onPress={() => router.push('/admin/notifications')}
                  >
                    Thông báo
                  </SecondaryButton>
                ) : null}
              </>
            ) : null}

            {role === 'LEADER' ? (
              <>
                <SecondaryButton
                  onPress={() => router.push('/leader/employees')}
                >
                  Nhân sự phòng
                </SecondaryButton>

                <SecondaryButton
                  onPress={() => router.push('/leader/approvals')}
                >
                  Duyệt tài khoản
                </SecondaryButton>

                {hasPermission(user, 'shift.assign') ? (
                  <SecondaryButton
                    onPress={() =>
                      router.push('/leader/shift-management')
                    }
                  >
                    Phân ca
                  </SecondaryButton>
                ) : null}

                {hasPermission(user, 'attendance.read') ? (
                  <SecondaryButton
                    onPress={() =>
                      router.push('/leader/attendance')
                    }
                  >
                    Chấm công phòng
                  </SecondaryButton>
                ) : null}

                {hasPermission(user, 'leave.approve') ? (
                  <SecondaryButton
                    onPress={() =>
                      router.push('/leader/leave-approvals')
                    }
                  >
                    Duyệt nghỉ phép
                  </SecondaryButton>
                ) : null}

                {hasPermission(user, 'overtime.approve') ? (
                  <SecondaryButton
                    onPress={() =>
                      router.push('/leader/overtime-approvals')
                    }
                  >
                    Duyệt tăng ca
                  </SecondaryButton>
                ) : null}

                {hasPermission(user, 'task.read_department') ? (
                  <SecondaryButton
                    onPress={() => router.push('/leader/tasks')}
                  >
                    Công việc phòng
                  </SecondaryButton>
                ) : null}

                {hasPermission(
                  user,
                  'task.group.manage_department',
                ) ? (
                  <SecondaryButton
                    onPress={() =>
                      router.push('/leader/task-groups')
                    }
                  >
                    Nhóm công việc
                  </SecondaryButton>
                ) : null}

                {hasPermission(
                  user,
                  'cross_department.source_approve',
                ) ||
                  hasPermission(
                    user,
                    'cross_department.target_receive',
                  ) ? (
                  <SecondaryButton
                    onPress={() =>
                      router.push('/leader/cross-department')
                    }
                  >
                    Liên phòng ban
                  </SecondaryButton>
                ) : null}



                {hasPermission(user, 'material_issue.read') ? (
                  <SecondaryButton
                    onPress={() => router.push('/leader/material-issues')}
                  >
                    Material issues
                  </SecondaryButton>
                ) : null}

                {hasPermission(user, 'asset.incident.read') ? (
                  <SecondaryButton
                    onPress={() => router.push('/leader/asset-incidents')}
                  >
                    Asset incidents
                  </SecondaryButton>
                ) : null}

                {hasPermission(user, 'notification.read') ? (
                  <SecondaryButton
                    onPress={() =>
                      router.push('/leader/notifications')
                    }
                  >
                    Thông báo
                  </SecondaryButton>
                ) : null}
              </>
            ) : null}

            {role === 'EMPLOYEE' ? (
              <>
                <SecondaryButton
                  onPress={() => router.push('/employee/profile')}
                >
                  Hồ sơ cá nhân
                </SecondaryButton>

                {hasPermission(user, 'shift.read') ? (
                  <SecondaryButton
                    onPress={() => router.push('/employee/schedule')}
                  >
                    Lịch làm việc
                  </SecondaryButton>
                ) : null}

                {hasPermission(user, 'attendance.checkin') ? (
                  <SecondaryButton
                    onPress={() =>
                      router.push('/employee/attendance')
                    }
                  >
                    Chấm công
                  </SecondaryButton>
                ) : null}

                {hasPermission(user, 'leave.request') ? (
                  <SecondaryButton
                    onPress={() => router.push('/employee/leave')}
                  >
                    Nghỉ phép
                  </SecondaryButton>
                ) : null}

                {hasPermission(user, 'overtime.request') ? (
                  <SecondaryButton
                    onPress={() =>
                      router.push('/employee/overtime')
                    }
                  >
                    Tăng ca
                  </SecondaryButton>
                ) : null}

                {hasPermission(user, 'employee.request') ? (
                  <SecondaryButton
                    onPress={() =>
                      router.push('/employee/requests')
                    }
                  >
                    Yêu cầu
                  </SecondaryButton>
                ) : null}

                {hasPermission(user, 'task.read_own') ? (
                  <SecondaryButton
                    onPress={() => router.push('/employee/tasks')}
                  >
                    Công việc của tôi
                  </SecondaryButton>
                ) : null}

                {hasPermission(
                  user,
                  'cross_department.create',
                ) ? (
                  <SecondaryButton
                    onPress={() =>
                      router.push('/employee/cross-department')
                    }
                  >
                    Liên phòng ban
                  </SecondaryButton>
                ) : null}



                {hasPermission(user, 'notification.read') ? (
                  <SecondaryButton
                    onPress={() =>
                      router.push('/employee/notifications')
                    }
                  >
                    Thông báo
                  </SecondaryButton>
                ) : null}
              </>
            ) : null}
          </View>
        </View>

        {/* DASHBOARD DATA */}
        {sections.length > 0 ? (
          <View style={styles.dashboardSections}>
            {sections.map((section) => (
              <View
                key={section.key}
                style={styles.section}
              >
                <Text style={styles.sectionTitle}>
                  {section.label}
                </Text>

                <View style={styles.grid}>
                  {section.metrics.map((metric) => (
                    <View
                      key={`${section.key}-${metric.key}`}
                      style={styles.card}
                    >
                      <Text style={styles.cardLabel}>
                        {metric.label}
                      </Text>

                      <Text style={styles.cardValue}>
                        {metric.value}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        ) : (
          <EmptyState />
        )}
      </ScrollView>

      <ConfirmModal
        visible={showLogoutConfirm}
        title="Đăng xuất"
        message="Bạn có chắc chắn muốn đăng xuất khỏi ứng dụng?"
        confirmLabel="Đăng xuất"
        onCancel={() => setShowLogoutConfirm(false)}
        onConfirm={() => {
          setShowLogoutConfirm(false);
          void logout();
        }}
      />
    </Screen>
  );
}

function toDashboardSections(
  data: Record<string, unknown> | undefined,
): DashboardSection[] {
  if (!data) {
    return [];
  }

  return Object.entries(data).map(
    ([sectionKey, sectionValue]) => {
      const metrics = toMetrics(
        sectionKey,
        sectionValue,
      );

      return {
        key: sectionKey,
        label: formatSectionLabel(sectionKey),
        metrics,
      };
    },
  );
}

function toMetrics(
  sectionKey: string,
  value: unknown,
): DashboardMetric[] {
  if (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value)
  ) {
    return Object.entries(
      value as Record<string, unknown>,
    ).map(([metricKey, metricValue]) => ({
      key: metricKey,
      label: formatMetricLabel(metricKey),
      value: formatMetricValue(metricValue),
    }));
  }

  return [
    {
      key: sectionKey,
      label: formatSectionLabel(sectionKey),
      value: formatMetricValue(value),
    },
  ];
}

function formatMetricValue(
  value: unknown,
): string {
  if (
    value === null ||
    value === undefined
  ) {
    return '-';
  }

  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return String(value);
  }

  if (Array.isArray(value)) {
    return String(value.length);
  }

  return '-';
}

function formatSectionLabel(
  key: string,
): string {
  const labels: Record<string, string> = {
    employees: 'Nhân sự',
    attendanceToday: 'Chấm công hôm nay',
    tasks: 'Công việc',
    leave: 'Nghỉ phép',
    warehouse: 'Kho vật tư',
    assets: 'Tài sản',
    payroll: 'Bảng lương',
    contracts: 'Hợp đồng',
    kpi: 'KPI',
  };

  return labels[key] ?? formatUnknownLabel(key);
}

function formatMetricLabel(
  key: string,
): string {
  const labels: Record<string, string> = {
    total: 'Tổng số',
    active: 'Đang hoạt động',

    pendingApproval: 'Chờ duyệt',
    suspended: 'Tạm khóa',
    resigned: 'Đã nghỉ việc',
    probation: 'Thử việc',
    official: 'Chính thức',

    scheduled: 'Có lịch làm',
    checkedIn: 'Đã vào ca',
    checkedOut: 'Đã ra ca',
    absent: 'Vắng mặt',
    late: 'Đi muộn',
    earlyLeave: 'Về sớm',
    onApprovedLeave: 'Nghỉ có phép',

    totalActive: 'Đang hoạt động',
    new: 'Công việc mới',
    inProgress: 'Đang thực hiện',
    waitingReview: 'Chờ duyệt',
    completed: 'Hoàn thành',
    overdue: 'Quá hạn',

    pending: 'Chờ xử lý',
    approvedToday: 'Duyệt hôm nay',
    employeesCurrentlyOnLeave:
      'Nhân viên đang nghỉ',

    totalWarehouses: 'Tổng kho',
    lowStockMaterials: 'Vật tư sắp hết',
    pendingMaterialIssues:
      'Phiếu xuất chờ xử lý',
    transfersInTransit:
      'Đang vận chuyển',

    assigned: 'Đã bàn giao',
    inStock: 'Trong kho',
    maintenance: 'Đang bảo trì',
    damaged: 'Hư hỏng',
    lost: 'Thất lạc',

    currentPeriodStatus:
      'Trạng thái kỳ lương',
    countCalculated: 'Đã tính lương',
    countApproved: 'Đã duyệt',
    countLocked: 'Đã khóa',

    expiring30Days:
      'Sắp hết hạn trong 30 ngày',
    waitingSignature: 'Chờ ký hợp đồng',

    activeAssignments:
      'KPI đang hoạt động',
    waitingSelfReview:
      'Chờ tự đánh giá',
    waitingLeaderReview:
      'Chờ Leader đánh giá',
    finalized: 'Đã hoàn tất',
  };

  return labels[key] ?? formatUnknownLabel(key);
}

function formatUnknownLabel(
  key: string,
): string {
  const label = key
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]+/g, ' ')
    .trim();

  if (!label) {
    return key;
  }

  return (
    label.charAt(0).toUpperCase() +
    label.slice(1)
  );
}

function hasAnyWarehousePermission(user: ReturnType<typeof useAuth>['user']): boolean {
  return (
    hasPermission(user, 'warehouse.read') ||
    hasPermission(user, 'warehouse.manage') ||
    hasPermission(user, 'stock.read')
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    backgroundColor: '#F4F6F8', // Modern light background
  },

  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },

  headerInfo: {
    flex: 1,
    gap: spacing.xs,
  },

  kicker: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
  },

  title: {
    color: '#111827',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },

  logoutButton: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  logoutText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },

  identity: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    gap: spacing.sm,
    padding: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 4,
    marginBottom: spacing.sm,
  },

  identityTitle: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },

  identityText: {
    color: '#4B5563',
    fontSize: 15,
    fontWeight: '500',
  },

  navigationSection: {
    gap: spacing.md,
    marginTop: spacing.sm,
  },

  navigationTitle: {
    color: '#111827',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },

  navGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },

  dashboardSections: {
    gap: spacing.xl,
    marginTop: spacing.md,
  },

  section: {
    gap: spacing.md,
  },

  sectionTitle: {
    color: '#111827',
    fontSize: 20,
    fontWeight: '800',
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    flexBasis: '46%',
    flexGrow: 1,
    gap: spacing.md,
    minWidth: 150,
    padding: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 6,
  },

  cardLabel: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
  },

  cardValue: {
    color: colors.primary,
    fontSize: 32,
    fontWeight: '800',
  },
});
