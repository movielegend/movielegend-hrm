import { useMemo } from 'react';
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
            onPress={() => void logout()}
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

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },

  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },

  headerInfo: {
    flex: 1,
    gap: spacing.xs,
  },

  kicker: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
  },

  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
  },

  logoutButton: {
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: spacing.md,
  },

  logoutText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '800',
  },

  identity: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.lg,
  },

  identityTitle: {
    color: colors.primaryDark,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },

  identityText: {
    color: colors.text,
    fontSize: 14,
  },

  navigationSection: {
    gap: spacing.md,
  },

  navigationTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },

  navGrid: {
    gap: spacing.md,
  },

  dashboardSections: {
    gap: spacing.xl,
  },

  section: {
    gap: spacing.md,
  },

  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },

  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    flexBasis: 160,
    flexGrow: 1,
    gap: spacing.sm,
    minWidth: 150,
    padding: spacing.lg,
  },

  cardLabel: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
  },

  cardValue: {
    color: colors.primaryDark,
    fontSize: 28,
    fontWeight: '800',
  },
});