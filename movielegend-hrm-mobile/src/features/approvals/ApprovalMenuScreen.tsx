import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, StatusBar, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '../../providers/AuthProvider';
import { roleBase } from '../../utils/notification-routing';
import { isUserInLiveDepartment } from '../../constants/app-registry';
import { hasUserRole, isAccountingLeader } from '../../utils/role-routing';
import { getEmployeeRequests } from '../../api/employee-requests.api';
import { useApprovals } from '../../hooks/useApprovals';
import { useCrossDepartmentRequests } from '../../hooks/useCrossDepartment';
import { getPendingOtReports } from '../../api/ot-report.api';

export function ApprovalMenuScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const rawRoles = user?.roles || [];
  const userRoles = Array.isArray(rawRoles) ? rawRoles : [rawRoles];
  const roleCodes = userRoles.map((r: any) => (typeof r === 'string' ? r : r?.code || r?.name || '').toUpperCase());
  const userDeptName = ((user as any)?.departmentLinks?.[0]?.department?.name || user?.department?.name || '').toLowerCase();
  const isAdmin =
    roleCodes.includes('ADMIN') ||
    roleCodes.includes('SUPER_ADMIN') ||
    (user as any)?.role?.code === 'ADMIN';

  const isLiveDepartment = isUserInLiveDepartment(user);

  const isAccountantOrAdmin =
    isAdmin ||
    userDeptName.includes('kế toán') ||
    userDeptName.includes('tài chính') ||
    roleCodes.some((c: string) => c.includes('ACCOUNTANT') || c === 'KT' || c === 'KETOAN') ||
    roleCodes.includes('CHIEF_ACCOUNTANT') ||
    (user as any)?.role?.code === 'ACCOUNTANT';

  const isHr =
    roleCodes.includes('HR') ||
    roleCodes.includes('HUMAN_RESOURCE') ||
    roleCodes.includes('HR_MANAGER') ||
    userDeptName.includes('nhân sự') ||
    userDeptName.includes('hành chính') ||
    (user as any)?.role?.code === 'HR';

  const isLeader =
    hasUserRole(user, 'LEADER') ||
    roleCodes.includes('LEADER') ||
    Boolean((user as any)?.isDepartmentLeader);

  const isChiefAccountant = isAccountingLeader(user);
  const isFinancialReviewer = isAccountantOrAdmin || isHr || isLeader;
  const isAccountantOnly = isAccountantOrAdmin && !isAdmin && !isHr && !isChiefAccountant;

  // 1. Pending Employee Requests
  const { data: pendingRequests = [] } = useQuery({
    queryKey: ['employee-requests-menu-pending'],
    queryFn: async () => {
      try {
        const res = await getEmployeeRequests({ status: 'PENDING' });
        return Array.isArray(res) ? res.filter((r: any) => r.status === 'PENDING') : [];
      } catch {
        return [];
      }
    },
    staleTime: 1000 * 30,
  });

  const pendingFinancialCount = useMemo(() => {
    return pendingRequests.filter((r: any) => {
      const isFin = r.type === 'ADVANCE' || r.type === 'EXPENSE' || r.type === 'PURCHASE';
      const stage = r.attachmentMetadata?.stage;
      return isFin && (!stage || stage === 'PENDING_LEADER' || stage === 'PENDING' || stage === 'PENDING_HR_MANAGER');
    }).length;
  }, [pendingRequests]);

  const pendingGeneralRequestsCount = useMemo(() => {
    let list = pendingRequests.filter((r: any) => !['ADVANCE', 'EXPENSE', 'PURCHASE'].includes(r.type));
    if (isChiefAccountant && !isAdmin && !isHr) {
      const userDeptId = (user as any)?.department?.id;
      list = list.filter((r: any) => {
        const deptName = r.user?.department?.name?.toLowerCase() || (user as any)?.department?.name?.toLowerCase() || '';
        return (
          (userDeptId && (r.departmentId === userDeptId || r.user?.departmentId === userDeptId)) ||
          deptName.includes('kế toán') ||
          deptName.includes('tài chính')
        );
      });
    }
    return list.length;
  }, [pendingRequests, isChiefAccountant, isAdmin, isHr, user]);

  // 2. Pending Account Approvals
  const { data: approvalsData } = useApprovals({
    status: 'PENDING',
    page: 1,
    limit: 100,
  });
  const pendingAccountsCount = useMemo(() => {
    const rawItems = approvalsData?.items ?? [];
    if (isChiefAccountant && !isAdmin && !isHr) {
      const userDeptId = (user as any)?.department?.id;
      return rawItems.filter((item: any) => {
        const deptName = item.requestedDepartment?.name?.toLowerCase() || '';
        return (
          (userDeptId && item.requestedDepartmentId === userDeptId) ||
          deptName.includes('kế toán') ||
          deptName.includes('tài chính')
        );
      }).length;
    }
    return approvalsData?.pagination?.total ?? rawItems.length;
  }, [approvalsData, isChiefAccountant, isAdmin, isHr, user]);

  // 3. Pending Cross Department Requests
  const { data: crossDeptData } = useCrossDepartmentRequests({
    page: 1,
    limit: 100,
  });
  const pendingCrossDeptCount = useMemo(() => {
    if (!crossDeptData?.items) return 0;
    return crossDeptData.items.filter((i: any) =>
      i.status?.includes('PENDING') || i.status === 'SUBMITTED_FOR_REVIEW'
    ).length;
  }, [crossDeptData]);

  // 4. Pending OT Live Reports
  const canReviewOt = Boolean(isLiveDepartment || isAdmin);
  const { data: otReportsData } = useQuery({
    queryKey: ['ot-reports-menu-pending'],
    queryFn: () => getPendingOtReports({ status: 'PENDING', page: 1, limit: 100 }),
    enabled: canReviewOt,
    staleTime: 1000 * 30,
  });
  const pendingOtCount = otReportsData?.items?.length ?? 0;

  // Total
  const totalPendingAll =
    (isAccountantOnly ? 0 : pendingGeneralRequestsCount) +
    (isAccountantOnly ? 0 : pendingAccountsCount) +
    (isAccountantOnly ? 0 : pendingCrossDeptCount) +
    (isFinancialReviewer ? pendingFinancialCount : 0) +
    (canReviewOt ? pendingOtCount : 0);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['employee-requests'] }),
      queryClient.invalidateQueries({ queryKey: ['employee-requests-menu-pending'] }),
      queryClient.invalidateQueries({ queryKey: ['approvals'] }),
      queryClient.invalidateQueries({ queryKey: ['cross-department-requests'] }),
      queryClient.invalidateQueries({ queryKey: ['ot-reports'] }),
      queryClient.invalidateQueries({ queryKey: ['ot-reports-menu-pending'] }),
    ]).catch(() => {});
    setRefreshing(false);
  }, [queryClient]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* 1. Header (Dark Navy #102739 with subtle wave in top-right) */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) + 4 }]}>
        {/* Subtle decorative wave in top right */}
        <View pointerEvents="none" style={styles.waveContainer}>
          <Svg width={200} height={120} viewBox="0 0 200 120">
            <Path
              d="M 50 -30 C 100 30, 140 65, 210 80 L 210 -30 Z"
              fill="rgba(255, 255, 255, 0.035)"
            />
            <Path
              d="M 85 -30 C 120 22, 155 48, 210 58 L 210 -30 Z"
              fill="rgba(255, 255, 255, 0.045)"
            />
            <Path
              d="M 120 -30 C 145 15, 175 30, 210 38 L 210 -30 Z"
              fill="rgba(255, 255, 255, 0.06)"
            />
          </Svg>
        </View>

        <View style={styles.headerRow}>
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace(`${roleBase(user)}/(tabs)` as any))}
            style={styles.backBtn}
            hitSlop={12}
          >
            <Ionicons name="chevron-back" size={26} color="#FFFFFF" />
          </Pressable>
          <View style={styles.headerTextWrap}>
            <Text style={styles.title}>Duyệt đơn từ</Text>
            <Text style={styles.subtitle}>Tập trung các yêu cầu cần xét duyệt</Text>
          </View>
        </View>
      </View>

      {/* 2. Main Curved Sheet Body */}
      <View style={styles.curvedSheet}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, 16) + 40 },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#102739']}
              tintColor="#102739"
            />
          }
        >
          {/* Hero Banner Card */}
          <View style={styles.heroCard}>
            <View style={styles.heroIconBox}>
              <MaterialCommunityIcons
                name="clipboard-text-outline"
                size={28}
                color="#FFFFFF"
              />
            </View>
            <View style={styles.heroContent}>
              <Text style={styles.heroTitle}>Không gian phê duyệt</Text>
              <Text style={styles.heroSubtitle}>
                {totalPendingAll > 0
                  ? `Đang có ${totalPendingAll} yêu cầu cần xét duyệt`
                  : 'Tất cả các yêu cầu đã được xử lý'}
              </Text>
            </View>
            {totalPendingAll > 0 && (
              <View style={styles.heroTotalBadge}>
                <Text style={styles.heroTotalBadgeText}>
                  {totalPendingAll > 99 ? '99+' : totalPendingAll}
                </Text>
              </View>
            )}
          </View>

          {/* Navigation Cards List */}
          <View style={styles.menuList}>
            {/* Item 1: Duyệt yêu cầu */}
            {!isAccountantOnly && (
              <Pressable
                style={styles.menuCard}
                onPress={() => router.push(`${roleBase(user)}/employee-requests` as any)}
                android_ripple={{ color: '#F1F5F9' }}
              >
                <View style={styles.iconCircle}>
                  <MaterialCommunityIcons
                    name="file-document-outline"
                    size={24}
                    color="#102739"
                  />
                </View>
                <View style={styles.menuCardInfo}>
                  <Text style={styles.menuCardTitle}>
                    {isChiefAccountant && !isAdmin && !isHr ? 'Duyệt yêu cầu phòng Kế toán' : 'Duyệt yêu cầu'}
                  </Text>
                  <Text style={styles.menuCardSubtitle}>
                    {isChiefAccountant && !isAdmin && !isHr
                      ? 'Nghỉ phép, giải trình công của nhân sự Kế toán'
                      : 'Nghỉ phép, giải trình công, đi muộn về sớm'}
                  </Text>
                </View>
                <View style={styles.menuCardRight}>
                  {pendingGeneralRequestsCount > 0 && (
                    <View style={styles.countBadge}>
                      <Text style={styles.countBadgeText}>
                        {pendingGeneralRequestsCount > 99 ? '99+' : pendingGeneralRequestsCount}
                      </Text>
                    </View>
                  )}
                  <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
                </View>
              </Pressable>
            )}

            {/* Item 2: Duyệt tài khoản */}
            {!isAccountantOnly && (
              <Pressable
                style={styles.menuCard}
                onPress={() =>
                  router.push(`${roleBase(user)}/approvals/account` as any)
                }
                android_ripple={{ color: '#F1F5F9' }}
              >
                <View style={styles.iconCircle}>
                  <MaterialCommunityIcons
                    name="account-group-outline"
                    size={24}
                    color="#102739"
                  />
                </View>
                <View style={styles.menuCardInfo}>
                  <Text style={styles.menuCardTitle}>
                    {isChiefAccountant && !isAdmin && !isHr ? 'Duyệt tài khoản phòng Kế toán' : 'Duyệt tài khoản'}
                  </Text>
                  <Text style={styles.menuCardSubtitle}>
                    {isChiefAccountant && !isAdmin && !isHr
                      ? 'Xét duyệt tài khoản nhân sự phòng Kế toán'
                      : 'Xét duyệt đăng ký nhân viên mới'}
                  </Text>
                </View>
                <View style={styles.menuCardRight}>
                  {pendingAccountsCount > 0 && (
                    <View style={styles.countBadge}>
                      <Text style={styles.countBadgeText}>
                        {pendingAccountsCount > 99 ? '99+' : pendingAccountsCount}
                      </Text>
                    </View>
                  )}
                  <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
                </View>
              </Pressable>
            )}

            {/* Item 3: Liên phòng ban */}
            {!isAccountantOnly && (
              <Pressable
                style={styles.menuCard}
                onPress={() => router.push(`${roleBase(user)}/cross-department` as any)}
                android_ripple={{ color: '#F1F5F9' }}
              >
                <View style={styles.iconCircle}>
                  <MaterialCommunityIcons
                    name="share-variant-outline"
                    size={24}
                    color="#102739"
                  />
                </View>
                <View style={styles.menuCardInfo}>
                  <Text style={styles.menuCardTitle}>Liên phòng ban</Text>
                  <Text style={styles.menuCardSubtitle}>
                    Theo dõi luân chuyển và phối hợp
                  </Text>
                </View>
                <View style={styles.menuCardRight}>
                  {pendingCrossDeptCount > 0 && (
                    <View style={styles.countBadge}>
                      <Text style={styles.countBadgeText}>
                        {pendingCrossDeptCount > 99 ? '99+' : pendingCrossDeptCount}
                      </Text>
                    </View>
                  )}
                  <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
                </View>
              </Pressable>
            )}

            {/* Item 4: Duyệt tài chính & Mua sắm (Accountant, Admin, HR) */}
            {isFinancialReviewer && (
              <Pressable
                style={styles.menuCard}
                onPress={() => router.push(`${roleBase(user)}/financial-requests` as any)}
                android_ripple={{ color: '#F1F5F9' }}
              >
                <View style={styles.iconCircle}>
                  <MaterialCommunityIcons
                    name="cash-check"
                    size={26}
                    color="#102739"
                  />
                </View>
                <View style={styles.menuCardInfo}>
                  <Text style={styles.menuCardTitle}>
                    {isChiefAccountant
                      ? 'Duyệt tài chính & Mua sắm'
                      : isAccountantOrAdmin
                      ? 'Duyệt tài chính & Xuất Excel'
                      : isHr
                      ? 'Đơn tài chính & Mua sắm'
                      : 'Duyệt tài chính & Mua sắm'}
                  </Text>
                  <Text style={styles.menuCardSubtitle}>
                    {isChiefAccountant
                      ? 'Duyệt đơn thanh toán, mua sắm, tạm ứng của phòng ban'
                      : isAccountantOrAdmin
                      ? 'Thanh toán, mua sắm, tạm ứng & xuất bảng kê 13 cột'
                      : isHr
                      ? 'Đối chứng báo giá, nhận tiền & xác nhận hoàn tất mua hàng'
                      : 'Duyệt đơn thanh toán, mua sắm, tạm ứng của phòng ban'}
                  </Text>
                </View>
                <View style={styles.menuCardRight}>
                  {pendingFinancialCount > 0 && (
                    <View style={styles.countBadge}>
                      <Text style={styles.countBadgeText}>
                        {pendingFinancialCount > 99 ? '99+' : pendingFinancialCount}
                      </Text>
                    </View>
                  )}
                  <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
                </View>
              </Pressable>
            )}

            {/* Item 5: Duyệt OT Live (chỉ Leader phòng Live hoặc Admin mới thấy) */}
            {canReviewOt && (
              <Pressable
                style={styles.menuCard}
                onPress={() => router.push('/leader/ot-report-approvals' as any)}
                android_ripple={{ color: '#F1F5F9' }}
              >
                <View style={styles.iconCircle}>
                  <MaterialCommunityIcons
                    name="clock-check-outline"
                    size={24}
                    color="#102739"
                  />
                </View>
                <View style={styles.menuCardInfo}>
                  <Text style={styles.menuCardTitle}>Duyệt OT Live</Text>
                  <Text style={styles.menuCardSubtitle}>
                    Phê duyệt báo cáo tăng ca phiên Livestream
                  </Text>
                </View>
                <View style={styles.menuCardRight}>
                  {pendingOtCount > 0 && (
                    <View style={styles.countBadge}>
                      <Text style={styles.countBadgeText}>
                        {pendingOtCount > 99 ? '99+' : pendingOtCount}
                      </Text>
                    </View>
                  )}
                  <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
                </View>
              </Pressable>
            )}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#102739',
  },
  header: {
    backgroundColor: '#102739',
    paddingHorizontal: 20,
    paddingBottom: 22,
    position: 'relative',
    overflow: 'hidden',
  },
  waveContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    zIndex: 2,
  },
  backBtn: {
    padding: 4,
    marginLeft: -4,
  },
  headerTextWrap: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.75)',
    fontWeight: '500',
    marginTop: 3,
  },
  curvedSheet: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#102739',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 14,
    gap: 14,
    shadowColor: '#102739',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 4,
  },
  heroIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroContent: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  heroSubtitle: {
    fontSize: 12.5,
    color: 'rgba(255, 255, 255, 0.75)',
    fontWeight: '500',
    marginTop: 2,
  },
  heroTotalBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'center',
    minWidth: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTotalBadgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  menuList: {
    gap: 12,
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
    gap: 14,
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#E7F0F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuCardInfo: {
    flex: 1,
  },
  menuCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 3,
  },
  menuCardSubtitle: {
    fontSize: 12.5,
    color: '#64748B',
    fontWeight: '500',
  },
  menuCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadgeText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '800',
  },
});
