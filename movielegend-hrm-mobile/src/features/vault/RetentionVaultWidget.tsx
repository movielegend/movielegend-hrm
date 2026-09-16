import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../providers/AuthProvider';
import { getMyVault, withdrawVaultPoints } from '../../api/employees.api';
import { CustomAlert } from '../../components/CustomAlert';
import type {
  MyVaultResponse,
  VestingMilestone,
  ProjectGrantPackage,
  GrantMilestone,
  VaultTransaction,
} from '../../types/employee.types';

export interface RetentionVaultWidgetProps {
  isVaultEnabled?: boolean;
}

export const RetentionVaultWidget: React.FC<RetentionVaultWidgetProps> = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data, isLoading, refetch } = useQuery<MyVaultResponse>({
    queryKey: ['my-vault', user?.id],
    queryFn: getMyVault,
    enabled: Boolean(user?.id),
  });

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<ProjectGrantPackage | null>(null);
  const [packageDetailModalVisible, setPackageDetailModalVisible] = useState(false);
  const [withdrawPointsInput, setWithdrawPointsInput] = useState('');
  const [bankName, setBankName] = useState('Techcombank');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [withdrawNote, setWithdrawNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [currentTime, setCurrentTime] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const vault = data?.vault;
  const stats = data?.stats || {
    totalGrantedPoints: 0,
    totalGrantedCash: 0,
    instantBonusPoints: 0,
    unlockedQuarterPoints: 0,
    lockedQuarterPoints: 0,
    unlockedPoints: 0,
    unlockedCash: 0,
    totalWithdrawnPoints: 0,
    totalWithdrawnCash: 0,
    remainingPoints: 0,
    remainingCash: 0,
    maxWithdrawable: 0,
    maxWithdrawableCash: 0,
    cashValuePerPoint: 1000,
  };

  const cashValuePerPoint = stats.cashValuePerPoint || 1000;
  const totalGrantedPoints = stats.totalGrantedPoints || 0;
  const totalGrantedCash = stats.totalGrantedCash ?? (totalGrantedPoints * cashValuePerPoint);
  const instantBonusPoints = stats.instantBonusPoints || 0;
  const instantCash = instantBonusPoints * cashValuePerPoint;
  const unlockedPoints = stats.unlockedPoints || 0;
  const unlockedCash = stats.unlockedCash ?? (unlockedPoints * cashValuePerPoint);
  const totalWithdrawnPoints = stats.totalWithdrawnPoints ?? 0;
  const totalWithdrawnCash = stats.totalWithdrawnCash ?? (totalWithdrawnPoints * cashValuePerPoint);
  const remainingPoints = stats.remainingPoints ?? Math.max(0, totalGrantedPoints - totalWithdrawnPoints);
  const remainingCash = stats.remainingCash ?? (remainingPoints * cashValuePerPoint);
  const maxWithdrawable = stats.maxWithdrawable || 0;
  const maxWithdrawableCash = stats.maxWithdrawableCash ?? (maxWithdrawable * cashValuePerPoint);

  const packages: ProjectGrantPackage[] = vault?.packages || [];
  const legacyMilestones: VestingMilestone[] = vault?.milestones || [];
  const transactions: VaultTransaction[] = vault?.transactions || [];

  // Helper to filter and sort transactions of a specific project grant package (newest to oldest)
  const getPackageTransactions = (pkg: ProjectGrantPackage, allTransactions: VaultTransaction[]): VaultTransaction[] => {
    if (!allTransactions || allTransactions.length === 0) return [];
    const pkgTitle = pkg.title.trim().toLowerCase();
    const filtered = allTransactions.filter((tx) => {
      const qTarget = (tx.quarterTarget || '').toLowerCase();
      const note = (tx.note || '').toLowerCase();
      // 1. Direct quarterTarget match
      if (qTarget.includes(pkgTitle)) {
        if (tx.type === 'GRANT_PROJECT_VESTING' || tx.type === 'GRANT_PROJECT_INSTANT') {
          return tx.points === pkg.totalPoints;
        }
        return true;
      }
      // 2. Note contains package title
      if (note.includes(`"${pkgTitle}"`) || note.includes(pkgTitle)) {
        if (tx.type === 'GRANT_PROJECT_VESTING' || tx.type === 'GRANT_PROJECT_INSTANT') {
          return tx.points === pkg.totalPoints;
        }
        return true;
      }
      return false;
    });
    // Sắp xếp theo mới nhất rồi cũ dần (newest to oldest)
    return [...filtered].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  const now = currentTime;
  const currentYear = currentTime.getFullYear();
  const currentQuarterNum = Math.min(4, Math.floor(currentTime.getMonth() / 3) + 1);

  const qMeta = [
    { q: 1, label: 'Quý 1', dateLabel: '31/03', unlockDate: new Date(currentYear, 2, 31), icon: 'handshake' },
    { q: 2, label: 'Quý 2', dateLabel: '30/06', unlockDate: new Date(currentYear, 5, 30), icon: 'trending-up' },
    { q: 3, label: 'Quý 3', dateLabel: '30/09', unlockDate: new Date(currentYear, 8, 30), icon: 'trophy-award' },
    { q: 4, label: 'Quý 4 (Tết)', dateLabel: '31/12', unlockDate: new Date(currentYear, 11, 31), icon: 'gift' },
  ];

  const legacyQuarterSteps = useMemo(() => {
    return qMeta.map((qm) => {
      const found = legacyMilestones.find((m) => m.quarter === qm.q);
      const unlockDate = found ? new Date(found.unlockDate) : qm.unlockDate;
      const isPastOrToday = unlockDate <= now;
      const points = found ? found.pointsToUnlock : Math.floor(stats.totalGrantedPoints / 4);
      const cash = Number(found?.cashAmount || points * cashValuePerPoint);
      const isWithdrawn = found ? Boolean(found.isWithdrawn) : false;
      const isCurrentActive = qm.q === currentQuarterNum;

      return {
        quarter: qm.q,
        label: qm.label,
        dateLabel: qm.dateLabel,
        unlockDate,
        points,
        cash,
        isWithdrawn,
        isUnlocked: isPastOrToday && !isWithdrawn && points > 0,
        isLocked: !isPastOrToday && !isWithdrawn,
        isPastOrToday,
        isCurrentActive,
        icon: qm.icon,
      };
    });
  }, [legacyMilestones, now, stats.totalGrantedPoints, cashValuePerPoint, currentQuarterNum, currentYear]);

  // Compute next upcoming locked milestone for the countdown timeline
  const nextMilestoneInfo = useMemo(() => {
    interface UpcomingItem {
      packageTitle?: string;
      title: string;
      points: number;
      cashAmount: number;
      unlockDate: Date;
      cycleStartDate: Date;
    }

    const upcomingList: UpcomingItem[] = [];

    if (packages.length > 0) {
      packages.forEach((pkg) => {
        const milestones = pkg.milestones || [];
        milestones.forEach((m, mIdx) => {
          const unlockDate = new Date(m.unlockDate);
          const remaining = Math.max(0, m.pointsToUnlock - (m.withdrawnPoints || 0));
          if (unlockDate > now && remaining > 0) {
            let cycleStartDate: Date;
            const prevMilestone = mIdx > 0 ? milestones[mIdx - 1] : undefined;
            if (prevMilestone) {
              cycleStartDate = new Date(prevMilestone.unlockDate);
            } else if (pkg.startDate) {
              cycleStartDate = new Date(pkg.startDate);
            } else {
              cycleStartDate = new Date(unlockDate.getTime() - (pkg.intervalMonths || 3) * 30 * 24 * 3600 * 1000);
            }

            upcomingList.push({
              packageTitle: pkg.title,
              title: m.title || `Đợt ${mIdx + 1}`,
              points: remaining,
              cashAmount: remaining * cashValuePerPoint,
              unlockDate,
              cycleStartDate,
            });
          }
        });
      });
    } else if (legacyMilestones.length > 0 || stats.totalGrantedPoints > 0) {
      legacyQuarterSteps.forEach((step) => {
        if (step.unlockDate > now && !step.isWithdrawn) {
          const qStartMonth = (step.quarter - 1) * 3;
          const cycleStartDate = new Date(currentYear, qStartMonth, 1);
          upcomingList.push({
            packageTitle: `Quỹ Thưởng Năm ${currentYear}`,
            title: step.label,
            points: step.points,
            cashAmount: step.cash,
            unlockDate: step.unlockDate,
            cycleStartDate,
          });
        }
      });
    }

    if (upcomingList.length === 0) {
      return null;
    }

    // Sort by earliest unlockDate
    upcomingList.sort((a, b) => a.unlockDate.getTime() - b.unlockDate.getTime());
    const nearest = upcomingList[0];
    if (!nearest) {
      return null;
    }

    const diffMs = Math.max(0, nearest.unlockDate.getTime() - now.getTime());
    const totalDurationMs = Math.max(1000, nearest.unlockDate.getTime() - nearest.cycleStartDate.getTime());
    const elapsedMs = Math.max(0, now.getTime() - nearest.cycleStartDate.getTime());
    const progressPercent = Math.min(100, Math.max(0, (elapsedMs / totalDurationMs) * 100));

    const totalSec = Math.floor(diffMs / 1000);
    const days = Math.floor(totalSec / 86400);
    const hours = Math.floor((totalSec % 86400) / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;

    const pad = (n: number) => n.toString().padStart(2, '0');
    const startD = nearest.cycleStartDate;
    const endD = nearest.unlockDate;

    return {
      packageTitle: nearest.packageTitle,
      title: nearest.title,
      points: nearest.points,
      cashAmount: nearest.cashAmount,
      unlockDate: nearest.unlockDate,
      cycleStartDate: nearest.cycleStartDate,
      days,
      hours,
      minutes,
      seconds,
      progressPercent,
      startDateFormatted: `${pad(startD.getDate())}/${pad(startD.getMonth() + 1)}/${startD.getFullYear()}`,
      unlockDateFormatted: `${pad(endD.getDate())}/${pad(endD.getMonth() + 1)}/${endD.getFullYear()}`,
    };
  }, [packages, legacyMilestones, legacyQuarterSteps, now, stats.totalGrantedPoints, cashValuePerPoint, currentYear]);

  // Check reached milestones count to determine if user is in Phase 1 (Đợt 1) or Phase 2+ (Từ đợt 2 trở đi)
  const isFirstPhase = useMemo(() => {
    let maxReached = 0;
    if (packages && packages.length > 0) {
      for (const pkg of packages) {
        const reached = (pkg.milestones || []).filter((m: any) => new Date(m.unlockDate) <= now);
        if (reached.length > maxReached) maxReached = reached.length;
      }
    }
    if (legacyMilestones && legacyMilestones.length > 0) {
      const reachedLegacy = legacyMilestones.filter((m: any) => new Date(m.unlockDate) <= now && m.pointsToUnlock > 0);
      if (reachedLegacy.length > maxReached) maxReached = reachedLegacy.length;
    }
    return maxReached <= 1;
  }, [packages, legacyMilestones, now]);

  const openWithdrawModal = () => {
    setWithdrawPointsInput(stats.maxWithdrawable.toString());
    setWithdrawNote('');
    setModalVisible(true);
  };

  const pointsToWithdraw = stats.maxWithdrawable;
  const cashToWithdraw = pointsToWithdraw * cashValuePerPoint;

  const handleWithdrawSubmit = async () => {
    if (pointsToWithdraw <= 0) {
      CustomAlert.alert('Chưa đến hạn', 'Hiện tại chưa có đợt thưởng nào đến hạn mở khóa để rút!');
      return;
    }

    try {
      setIsSubmitting(true);
      await withdrawVaultPoints({
        points: pointsToWithdraw,
        note: withdrawNote.trim() || undefined,
      });

      await queryClient.invalidateQueries({ queryKey: ['my-vault'] });
      setModalVisible(false);

      CustomAlert.alert(
        'Gửi Yêu Cầu Rút Điểm Thành Công! 💸',
        `Đã gửi yêu cầu rút toàn bộ ${cashToWithdraw.toLocaleString('vi-VN')} VNĐ (${pointsToWithdraw.toLocaleString('vi-VN')} điểm). Admin & Kế toán sẽ phê duyệt và quy đổi thanh toán cho bạn sớm nhất!`
      );
    } catch (err: any) {
      CustomAlert.alert('Lỗi rút tiền', err?.response?.data?.message || err?.message || 'Không thể gửi yêu cầu rút tiền lúc này.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#D97706" />
        <Text style={styles.loadingText}>Đang tải dữ liệu Ví Thưởng...</Text>
      </View>
    );
  }

  if (!data?.isVaultEnabled) {
    return (
      <View style={styles.disabledCard}>
        <View style={styles.disabledIconContainer}>
          <MaterialCommunityIcons name="lock-alert-outline" size={48} color="#D97706" />
        </View>
        <Text style={styles.disabledTitle}>Ví Điểm Thưởng Chưa Được Kích Hoạt</Text>
        <Text style={styles.disabledDescription}>
          Tính năng Ví Điểm Thưởng là đặc quyền dành riêng cho nhân sự được phê duyệt. Tài khoản của bạn hiện chưa được mở quyền này.
        </Text>
        <Text style={styles.disabledHint}>
          Vui lòng liên hệ Quản trị viên / Ban Giám Đốc để được kích hoạt và phân bổ quỹ thưởng.
        </Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={() => refetch()} activeOpacity={0.8}>
          <Ionicons name="reload" size={16} color="#B45309" />
          <Text style={styles.refreshBtnText}>Kiểm tra lại trạng thái</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.cardContainer}>
      {/* VIP Premium Fintech Hero Card */}
      <View style={styles.vipHeroCard}>
        {/* Card Header */}
        <View style={styles.vipHeroHeader}>
          <View style={styles.vipHeroTitleGroup}>
            <View style={styles.vipHeroIconBadge}>
              <Ionicons name="wallet-outline" size={18} color="#2563EB" />
            </View>
            <View>
              <Text style={styles.vipHeroTitle}>Ví Thưởng Tích Lũy {currentYear}</Text>
              <Text style={styles.vipHeroSubtitle}>Quỹ Thưởng Đồng Hành & Cống Hiến {currentYear}</Text>
            </View>
          </View>
          <View style={styles.vipBadgeChip}>
            <Ionicons name="shield-checkmark-outline" size={12} color="#0F172A" />
            <Text style={styles.vipBadgeChipText}>QUỸ TÍCH LŨY {currentYear}</Text>
          </View>
        </View>

        {/* Main Available Balance Centerpiece: SỐ ĐIỂM CÒN LẠI TRONG VÍ */}
        <View style={styles.vipBalanceCenterpiece}>
          <Text style={styles.vipBalanceLabel}>SỐ ĐIỂM CÒN LẠI TRONG VÍ</Text>
          <View style={styles.vipAmountRow}>
            <Text style={styles.vipAmountNumber}>{remainingPoints.toLocaleString('vi-VN')}</Text>
            <Text style={styles.vipCurrency}>điểm</Text>
          </View>
          <View style={styles.vipPillRow}>
            <View style={styles.vipPointPill}>
              <Ionicons name="cash-outline" size={13} color="#059669" />
              <Text style={styles.vipPointPillText}>
                Tương đương: {remainingCash.toLocaleString('vi-VN')} VNĐ
              </Text>
            </View>
            {instantBonusPoints > 0 && (
              <View style={styles.vipInstantPill}>
                <MaterialCommunityIcons name="lightning-bolt" size={12} color="#D97706" />
                <Text style={styles.vipInstantPillText}>
                  Gồm {instantBonusPoints.toLocaleString('vi-VN')} đ thưởng nóng
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Sub-metrics: 3 Equal Columns */}
        <View style={styles.vipMetricsGrid}>
          <View style={styles.vipMetricCol}>
            <Text style={styles.vipMetricLabel}>Tổng Tích Lũy</Text>
            <Text style={styles.vipMetricValue}>{totalGrantedPoints.toLocaleString('vi-VN')} đ</Text>
            <Text style={styles.vipMetricSub}>~{totalGrantedCash.toLocaleString('vi-VN')} đ</Text>
          </View>
          <View style={styles.vipMetricDivider} />
          <View style={styles.vipMetricCol}>
            <Text style={styles.vipMetricLabel}>Đã Rút / Quy Đổi</Text>
            <Text style={styles.vipMetricValueOrange}>{totalWithdrawnPoints.toLocaleString('vi-VN')} đ</Text>
            <Text style={styles.vipMetricSubOrange}>~{totalWithdrawnCash.toLocaleString('vi-VN')} đ</Text>
          </View>
          <View style={styles.vipMetricDivider} />
          <View style={styles.vipMetricCol}>
            <Text style={styles.vipMetricLabel}>Khả Dụng Rút</Text>
            <Text style={styles.vipMetricValueGold}>{unlockedPoints.toLocaleString('vi-VN')} đ</Text>
            <Text style={styles.vipMetricSubGold}>~{unlockedCash.toLocaleString('vi-VN')} đ</Text>
          </View>
        </View>

        {/* Primary CTA Withdraw Button */}
        {maxWithdrawable > 0 ? (
          <TouchableOpacity
            style={styles.vipWithdrawActionBtn}
            onPress={openWithdrawModal}
            activeOpacity={0.85}
          >
            <Ionicons name="arrow-up-circle-outline" size={18} color="#FFFFFF" />
            <Text style={styles.vipWithdrawActionText}>YÊU CẦU QUY ĐỔI / RÚT ĐIỂM</Text>
          </TouchableOpacity>
        ) : (
          <View style={[styles.vipWithdrawActionBtn, styles.vipWithdrawActionBtnDisabled]}>
            <Ionicons name="lock-closed-outline" size={16} color="#94A3B8" />
            <Text style={styles.vipWithdrawActionTextDisabled}>
              CHƯA ĐẾN HẠN RÚT ĐIỂM
            </Text>
          </View>
        )}

        {/* Advance Note Footer */}
        <View style={styles.vipFooterNote}>
          <Ionicons name="information-circle-outline" size={15} color="#64748B" />
          <Text style={styles.vipFooterNoteText}>
            Quy định: Đợt nào mở rút đợt đó. Thời hạn rút trong vòng 15 ngày kể từ ngày mở; nếu sau 15 ngày không rút, số điểm sẽ tự động được dồn chia đều cho các đợt còn lại.
          </Text>
        </View>
      </View>

      {/* Render Separate Cards for Each ProjectGrantPackage */}
      {packages.length > 0 && (
        <View style={styles.packageListContainer}>
          <View style={styles.packageListHeader}>
            <Ionicons name="briefcase-outline" size={16} color="#0F172A" />
            <Text style={styles.packageListTitle}>Danh Sách Các Gói Thưởng Đang Tham Gia ({packages.length})</Text>
          </View>

          {packages.map((pkg, pIdx) => {
            const milestones = pkg.milestones || [];
            const pkgTotalCash = pkg.totalPoints * cashValuePerPoint;
            const pkgWithdrawnPoints = milestones.reduce((s, m) => s + (m.withdrawnPoints || 0), 0);
            const pkgWithdrawnCash = pkgWithdrawnPoints * cashValuePerPoint;

            let pkgUnlockedPoints = 0;
            let pkgLockedPoints = 0;
            milestones.forEach((m) => {
              const remaining = Math.max(0, m.pointsToUnlock - (m.withdrawnPoints || 0));
              if (remaining > 0) {
                if (new Date(m.unlockDate) <= now) {
                  pkgUnlockedPoints += remaining;
                } else {
                  pkgLockedPoints += remaining;
                }
              }
            });

            // Milestone default reward growth icons
            const defaultIcons = [
              'handshake',
              'trending-up',
              'star-circle',
              'trophy-award',
              'crown',
              'gift-open',
            ];

            // Determine active/unlocked milestone indices
            const firstLockedIdx = milestones.findIndex((m) => new Date(m.unlockDate) > now && (m.pointsToUnlock - (m.withdrawnPoints || 0)) > 0);

            // Compute dedicated countdown data for this specific package
            const pkgNextLockedMilestone = milestones.find(
              (m) => new Date(m.unlockDate) > now && Math.max(0, m.pointsToUnlock - (m.withdrawnPoints || 0)) > 0
            );

            let pkgCountdownData: {
              title: string;
              targetDateFormatted: string;
              days: number;
              hours: number;
              minutes: number;
              seconds: number;
              points: number;
              cashAmount: number;
            } | null = null;

            if (pkgNextLockedMilestone) {
              const pkgTargetDate = new Date(pkgNextLockedMilestone.unlockDate);
              const pkgDiffMs = Math.max(0, pkgTargetDate.getTime() - now.getTime());
              const pkgDays = Math.floor(pkgDiffMs / (1000 * 60 * 60 * 24));
              const pkgHours = Math.floor((pkgDiffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
              const pkgMinutes = Math.floor((pkgDiffMs % (1000 * 60 * 60)) / (1000 * 60));
              const pkgSeconds = Math.floor((pkgDiffMs % (1000 * 60)) / 1000);
              const pkgRemainingPoints = Math.max(0, pkgNextLockedMilestone.pointsToUnlock - (pkgNextLockedMilestone.withdrawnPoints || 0));
              const pkgRemainingCash = pkgRemainingPoints * cashValuePerPoint;
              const pkgTargetDateFormatted = `${pkgTargetDate.getDate().toString().padStart(2, '0')}/${(pkgTargetDate.getMonth() + 1).toString().padStart(2, '0')}/${pkgTargetDate.getFullYear()}`;

              pkgCountdownData = {
                title: pkgNextLockedMilestone.title || `Đợt ${milestones.indexOf(pkgNextLockedMilestone) + 1}`,
                targetDateFormatted: pkgTargetDateFormatted,
                days: pkgDays,
                hours: pkgHours,
                minutes: pkgMinutes,
                seconds: pkgSeconds,
                points: pkgRemainingPoints,
                cashAmount: pkgRemainingCash,
              };
            }

            // Format compact points helper
            const formatCompactPoints = (pts: number) => {
              if (!pts || pts <= 0) return '0 đ';
              if (pts >= 1_000_000) {
                const val = (pts / 1_000_000).toFixed(pts % 1_000_000 === 0 ? 0 : 1);
                return `${val}M đ`;
              }
              if (pts >= 1_000) {
                const val = (pts / 1_000).toFixed(pts % 1_000 === 0 ? 0 : 0);
                return `${val}k đ`;
              }
              return `${pts.toLocaleString('vi-VN')} đ`;
            };

            const isScrollable = milestones.length > 4;
            const nodeWidth = 96;

            return (
              <View key={pkg.id || pIdx} style={styles.packageCard}>
                {/* Package Card Header */}
                <TouchableOpacity
                  style={styles.packageCardHeader}
                  onPress={() => {
                    setSelectedPackage(pkg);
                    setPackageDetailModalVisible(true);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <View style={styles.pkgIconBadge}>
                        <Ionicons name="gift-outline" size={15} color="#2563EB" />
                      </View>
                      <Text style={styles.packageCardTitle} numberOfLines={1}>
                        {pkg.title}
                      </Text>
                    </View>
                    <Text style={styles.packageCardMeta}>
                      Thời hạn: {pkg.durationMonths} tháng • Chu kỳ: {pkg.intervalMonths} tháng/đợt ({milestones.length} đợt)
                    </Text>
                  </View>
                  <View style={styles.packageTotalBadge}>
                    <Text style={styles.packageTotalPoints}>
                      {pkg.totalPoints.toLocaleString('vi-VN')} đ
                    </Text>
                    <Text style={styles.packageTotalCash}>
                      ~{pkgTotalCash.toLocaleString('vi-VN')} VNĐ
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* --- HORIZONTAL TRACKER (EXACT DESIGN MATCH) --- */}
                <View style={styles.horizontalTrackerCard}>
                  {isScrollable && (
                    <View style={styles.scrollHintRow}>
                      <Text style={styles.scrollHintText}>Lộ trình {milestones.length} đợt</Text>
                      <View style={styles.scrollHintBadge}>
                        <Ionicons name="swap-horizontal-outline" size={13} color="#64748B" />
                        <Text style={styles.scrollHintBadgeText}>Vuốt ngang</Text>
                      </View>
                    </View>
                  )}

                  {isScrollable ? (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.horizontalTrackerScrollContent}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                        {milestones.map((m, mIdx) => {
                          const unlockDate = new Date(m.unlockDate);
                          const isPassed = unlockDate <= now;
                          const remaining = Math.max(0, m.pointsToUnlock - (m.withdrawnPoints || 0));
                          const isFullyWithdrawn = m.isWithdrawn || (m.withdrawnPoints >= m.pointsToUnlock && m.pointsToUnlock > 0);
                          const isUnlockedAvailable = isPassed && remaining > 0;
                          const isPartiallyWithdrawn = (m.withdrawnPoints || 0) > 0 && remaining > 0;
                          const isCurrentUpcoming = mIdx === firstLockedIdx;

                          const isLeftActive = isPassed || isFullyWithdrawn || isCurrentUpcoming;
                          const isRightActive = isPassed || isFullyWithdrawn;

                          const dateFormatted = `${unlockDate.getDate().toString().padStart(2, '0')}/${(unlockDate.getMonth() + 1).toString().padStart(2, '0')}`;

                          return (
                            <View key={m.id || mIdx} style={{ width: 84, alignItems: 'center' }}>
                              {/* Step Node with continuous connector line */}
                              <View style={{ width: '100%', height: 32, justifyContent: 'center', alignItems: 'center' }}>
                                {mIdx > 0 && (
                                  <View
                                    style={{
                                      position: 'absolute',
                                      left: 0,
                                      right: '50%',
                                      top: '50%',
                                      marginTop: -1.5,
                                      height: 3,
                                      backgroundColor: isLeftActive ? '#2563EB' : '#E2E8F0',
                                    }}
                                  />
                                )}
                                {mIdx < milestones.length - 1 && (
                                  <View
                                    style={{
                                      position: 'absolute',
                                      left: '50%',
                                      right: 0,
                                      top: '50%',
                                      marginTop: -1.5,
                                      height: 3,
                                      backgroundColor: isRightActive ? '#2563EB' : '#E2E8F0',
                                    }}
                                  />
                                )}
                                <View
                                  style={[
                                    styles.stepperDotNode,
                                    isFullyWithdrawn && styles.stepperDotWithdrawn,
                                    isUnlockedAvailable && styles.stepperDotUnlocked,
                                    isCurrentUpcoming && styles.stepperDotUpcoming,
                                    !isFullyWithdrawn && !isUnlockedAvailable && !isCurrentUpcoming && styles.stepperDotLocked,
                                  ]}
                                >
                                  {isFullyWithdrawn ? (
                                    <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                                  ) : isUnlockedAvailable ? (
                                    <Text style={{ fontSize: 11, fontWeight: '800', color: '#FFFFFF' }}>
                                      {mIdx + 1}
                                    </Text>
                                  ) : (
                                    <Text
                                      style={[
                                        styles.stepperDotNum,
                                        isCurrentUpcoming && styles.stepperDotNumUpcoming,
                                      ]}
                                    >
                                      {mIdx + 1}
                                    </Text>
                                  )}
                                </View>
                              </View>

                              {/* Date */}
                              <Text style={styles.trackNodeDate}>{dateFormatted}</Text>

                              {/* Status Pill */}
                              <View
                                style={[
                                  styles.trackNodePill,
                                  isFullyWithdrawn && styles.trackPillWithdrawn,
                                  isUnlockedAvailable && styles.trackPillUnlocked,
                                  !isFullyWithdrawn && !isUnlockedAvailable && isCurrentUpcoming && styles.trackPillUpcoming,
                                  !isFullyWithdrawn && !isUnlockedAvailable && !isCurrentUpcoming && styles.trackPillLocked,
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.trackNodePillText,
                                    isFullyWithdrawn && styles.trackPillTextWithdrawn,
                                    isUnlockedAvailable && styles.trackPillTextUnlocked,
                                    !isFullyWithdrawn && !isUnlockedAvailable && isCurrentUpcoming && styles.trackPillTextUpcoming,
                                    !isFullyWithdrawn && !isUnlockedAvailable && !isCurrentUpcoming && styles.trackPillTextLocked,
                                  ]}
                                  numberOfLines={1}
                                >
                                  {isFullyWithdrawn
                                    ? (m.withdrawnPoints > 0 ? 'Đã rút' : 'Đã dồn')
                                    : isPartiallyWithdrawn
                                    ? `Còn ${formatCompactPoints(remaining)}`
                                    : isUnlockedAvailable
                                    ? `+${formatCompactPoints(m.pointsToUnlock)}`
                                    : `${formatCompactPoints(m.pointsToUnlock)}`}
                                </Text>
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    </ScrollView>
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 4 }}>
                      {milestones.map((m, mIdx) => {
                        const unlockDate = new Date(m.unlockDate);
                        const isPassed = unlockDate <= now;
                        const remaining = Math.max(0, m.pointsToUnlock - (m.withdrawnPoints || 0));
                        const isFullyWithdrawn = m.isWithdrawn || (m.withdrawnPoints >= m.pointsToUnlock && m.pointsToUnlock > 0);
                        const isUnlockedAvailable = isPassed && remaining > 0;
                        const isPartiallyWithdrawn = (m.withdrawnPoints || 0) > 0 && remaining > 0;
                        const isCurrentUpcoming = mIdx === firstLockedIdx;

                        const isLeftActive = isPassed || isFullyWithdrawn || isCurrentUpcoming;
                        const isRightActive = isPassed || isFullyWithdrawn;

                        const dateFormatted = `${unlockDate.getDate().toString().padStart(2, '0')}/${(unlockDate.getMonth() + 1).toString().padStart(2, '0')}`;

                        return (
                          <View key={m.id || mIdx} style={{ flex: 1, alignItems: 'center' }}>
                            {/* Step Node with continuous connector line */}
                            <View style={{ width: '100%', height: 32, justifyContent: 'center', alignItems: 'center' }}>
                              {mIdx > 0 && (
                                <View
                                  style={{
                                    position: 'absolute',
                                    left: 0,
                                    right: '50%',
                                    top: '50%',
                                    marginTop: -1.5,
                                    height: 3,
                                    backgroundColor: isLeftActive ? '#2563EB' : '#E2E8F0',
                                  }}
                                />
                              )}
                              {mIdx < milestones.length - 1 && (
                                <View
                                  style={{
                                    position: 'absolute',
                                    left: '50%',
                                    right: 0,
                                    top: '50%',
                                    marginTop: -1.5,
                                    height: 3,
                                    backgroundColor: isRightActive ? '#2563EB' : '#E2E8F0',
                                  }}
                                />
                              )}
                              <View
                                style={[
                                  styles.stepperDotNode,
                                  isFullyWithdrawn && styles.stepperDotWithdrawn,
                                  isUnlockedAvailable && styles.stepperDotUnlocked,
                                  isCurrentUpcoming && styles.stepperDotUpcoming,
                                  !isFullyWithdrawn && !isUnlockedAvailable && !isCurrentUpcoming && styles.stepperDotLocked,
                                ]}
                              >
                                {isFullyWithdrawn ? (
                                  <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                                ) : isUnlockedAvailable ? (
                                  <Text style={{ fontSize: 11, fontWeight: '800', color: '#FFFFFF' }}>
                                    {mIdx + 1}
                                  </Text>
                                ) : (
                                  <Text
                                    style={[
                                      styles.stepperDotNum,
                                      isCurrentUpcoming && styles.stepperDotNumUpcoming,
                                    ]}
                                  >
                                    {mIdx + 1}
                                  </Text>
                                )}
                              </View>
                            </View>

                            {/* Date */}
                            <Text style={styles.trackNodeDate}>{dateFormatted}</Text>

                            {/* Status Pill */}
                            <View
                              style={[
                                styles.trackNodePill,
                                isFullyWithdrawn && styles.trackPillWithdrawn,
                                isUnlockedAvailable && styles.trackPillUnlocked,
                                !isFullyWithdrawn && !isUnlockedAvailable && isCurrentUpcoming && styles.trackPillUpcoming,
                                !isFullyWithdrawn && !isUnlockedAvailable && !isCurrentUpcoming && styles.trackPillLocked,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.trackNodePillText,
                                  isFullyWithdrawn && styles.trackPillTextWithdrawn,
                                  isUnlockedAvailable && styles.trackPillTextUnlocked,
                                  !isFullyWithdrawn && !isUnlockedAvailable && isCurrentUpcoming && styles.trackPillTextUpcoming,
                                  !isFullyWithdrawn && !isUnlockedAvailable && !isCurrentUpcoming && styles.trackPillTextLocked,
                                ]}
                                numberOfLines={1}
                              >
                                {isFullyWithdrawn
                                  ? (m.withdrawnPoints > 0 ? 'Đã rút' : 'Đã dồn')
                                  : isPartiallyWithdrawn
                                  ? `Còn ${formatCompactPoints(remaining)}`
                                  : isUnlockedAvailable
                                  ? `+${formatCompactPoints(m.pointsToUnlock)}`
                                  : `${formatCompactPoints(m.pointsToUnlock)}`}
                              </Text>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>

                {/* Package Bottom Summary */}
                <View style={styles.packageBottomSummary}>
                  <View style={styles.pkgSummaryItem}>
                    <Text style={styles.pkgSummaryLabel}>Đã rút:</Text>
                    <Text style={styles.pkgSummaryValWithdrawn}>
                      {pkgWithdrawnPoints.toLocaleString('vi-VN')} đ
                    </Text>
                  </View>
                  <View style={styles.pkgSummaryDivider} />
                  <View style={styles.pkgSummaryItem}>
                    <Text style={styles.pkgSummaryLabel}>Khả dụng:</Text>
                    <Text style={styles.pkgSummaryValUnlocked}>
                      {pkgUnlockedPoints.toLocaleString('vi-VN')} đ
                    </Text>
                  </View>
                  <View style={styles.pkgSummaryDivider} />
                  <View style={styles.pkgSummaryItem}>
                    <Text style={styles.pkgSummaryLabel}>Đang khóa:</Text>
                    <Text style={styles.pkgSummaryValLocked}>
                      {pkgLockedPoints.toLocaleString('vi-VN')} đ
                    </Text>
                  </View>
                </View>

                {/* Package Status & Action Footer (Replaces redundant chunky countdown ticker) */}
                <View style={styles.pkgActionFooter}>
                  {pkgCountdownData ? (
                    <View style={styles.pkgNextMilestoneRow}>
                      <Ionicons name="time-outline" size={14} color="#2563EB" />
                      <Text style={styles.pkgNextMilestoneText} numberOfLines={1}>
                        Đợt tới: <Text style={{ fontWeight: '700', color: '#0F172A' }}>{pkgCountdownData.title}</Text> ({pkgCountdownData.targetDateFormatted}) • <Text style={{ color: '#2563EB', fontWeight: '700' }}>+{pkgCountdownData.points.toLocaleString('vi-VN')} đ</Text>
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.pkgNextMilestoneRow}>
                      <Ionicons name="checkmark-circle" size={14} color="#059669" />
                      <Text style={[styles.pkgNextMilestoneText, { color: '#059669', fontWeight: '600' }]}>
                        Đã hoàn tất mở khóa tất cả các đợt
                      </Text>
                    </View>
                  )}

                  <TouchableOpacity
                    style={styles.pkgDetailBtn}
                    onPress={() => {
                      setSelectedPackage(pkg);
                      setPackageDetailModalVisible(true);
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="receipt-outline" size={14} color="#2563EB" />
                    <Text style={styles.pkgDetailBtnText}>Chi Tiết & Lịch Sử GD</Text>
                    <Ionicons name="chevron-forward" size={13} color="#2563EB" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Graceful Fallback: Legacy Vesting Stepper if no Project Packages */}
      {packages.length === 0 && legacyMilestones.length > 0 && (
        <View style={styles.shopeeTrackerCard}>
          <View style={styles.shopeeHeaderRow}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={styles.shopeeEstTime}>Lộ trình Ví Điểm Thưởng Năm {currentYear}</Text>
              <Text style={styles.shopeeMainStatus}>Phân bổ 4 Quý Theo Chu Kỳ</Text>
            </View>
            <View style={styles.shopeeAvatarCircle}>
              <MaterialCommunityIcons name="wallet-giftcard" size={28} color="#EE4D2D" />
            </View>
          </View>

          {/* Stepper Horizontal Progress Bar */}
          <View style={styles.horizontalTrackRow}>
            {legacyQuarterSteps.map((step, sIdx) => {
              const defaultIcons = ['handshake', 'trending-up', 'star-circle', 'crown'];
              const iconName = (step.icon || defaultIcons[sIdx % defaultIcons.length]) as any;

              const isWithdrawn = step.isWithdrawn;
              const isUnlocked = step.isUnlocked || step.isPastOrToday;
              const isCurrent = step.isCurrentActive;

              const iconColor = isWithdrawn
                ? '#DC2626'
                : isUnlocked || isCurrent
                ? '#EE4D2D'
                : '#CBD5E1';

              const showCaret = isWithdrawn || isUnlocked || isCurrent;
              const caretColor = isWithdrawn ? '#DC2626' : '#EE4D2D';

              let lineType: 'full' | 'half' | 'none' = 'none';
              if (sIdx < legacyQuarterSteps.length - 1 && legacyQuarterSteps[sIdx + 1]) {
                const nextStep = legacyQuarterSteps[sIdx + 1];
                if (nextStep?.isPastOrToday || nextStep?.isWithdrawn) {
                  lineType = 'full';
                } else if (step.isPastOrToday || step.isWithdrawn) {
                  lineType = 'half';
                } else {
                  lineType = 'none';
                }
              }

              return (
                <React.Fragment key={step.quarter}>
                  <View style={styles.trackNodeWrapper}>
                    <MaterialCommunityIcons
                      name={iconName}
                      size={26}
                      color={iconColor}
                    />
                    <View style={styles.trackCaretSlot}>
                      {showCaret && (
                        <MaterialCommunityIcons
                          name="chevron-down"
                          size={15}
                          color={caretColor}
                        />
                      )}
                    </View>
                  </View>

                  {sIdx < legacyQuarterSteps.length - 1 && (
                    <View style={styles.trackLineWrapper}>
                      {lineType === 'full' ? (
                        <View style={[styles.trackLine, styles.trackLineFull]} />
                      ) : lineType === 'half' ? (
                        <View style={styles.trackLineHalfContainer}>
                          <View style={[styles.trackLineHalf, styles.trackLineHalfActive]} />
                          <View style={[styles.trackLineHalf, styles.trackLineHalfInactive]} />
                        </View>
                      ) : (
                        <View style={[styles.trackLine, styles.trackLineInactive]} />
                      )}
                    </View>
                  )}
                </React.Fragment>
              );
            })}
          </View>

          {/* Stepper Labels */}
          <View style={styles.trackLabelsRow}>
            {legacyQuarterSteps.map((step) => (
              <View key={step.quarter} style={styles.trackLabelCol}>
                <Text
                  style={[
                    styles.trackNodeTitle,
                    step.isWithdrawn && { color: '#DC2626', fontWeight: '800' },
                    step.isPastOrToday && { color: '#EE4D2D', fontWeight: '800' },
                  ]}
                >
                  {step.label}
                </Text>
                <Text style={styles.trackNodeDate}>{step.dateLabel}</Text>
                <View
                  style={[
                    styles.trackNodePill,
                    step.isWithdrawn && styles.trackPillWithdrawn,
                    step.isUnlocked && styles.trackPillUnlocked,
                    step.isLocked && styles.trackPillLocked,
                  ]}
                >
                  <Text
                    style={[
                      styles.trackNodePillText,
                      step.isWithdrawn && styles.trackPillTextWithdrawn,
                      step.isUnlocked && styles.trackPillTextUnlocked,
                      step.isLocked && styles.trackPillTextLocked,
                    ]}
                  >
                    {step.isWithdrawn
                      ? 'Đã rút'
                      : step.isUnlocked
                      ? `${step.points.toLocaleString('vi-VN')} đ`
                      : 'Chưa mở'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Withdrawal Requests History */}
      {data?.withdrawalRequests && data.withdrawalRequests.length > 0 && (
        <View style={styles.withdrawalHistoryContainer}>
          <View style={styles.withdrawalHistoryHeader}>
            <MaterialCommunityIcons name="clipboard-text-clock-outline" size={18} color="#92400E" />
            <Text style={styles.withdrawalHistoryTitle}>Lịch Sử Rút & Quy Đổi Điểm Thưởng</Text>
          </View>
          {data.withdrawalRequests.map((req) => {
            const isPendingAdmin = req.status === 'PENDING_ADMIN';
            const isPendingAcc = req.status === 'PENDING_ACCOUNTANT';
            const isPaid = req.status === 'PAID';
            const isRejected = req.status === 'REJECTED';

            const statusBg = isPaid
              ? '#ECFDF5'
              : isPendingAcc
              ? '#EFF6FF'
              : isPendingAdmin
              ? '#FFFBEB'
              : '#FEF2F2';

            const statusBorder = isPaid
              ? '#A7F3D0'
              : isPendingAcc
              ? '#BFDBFE'
              : isPendingAdmin
              ? '#FDE68A'
              : '#FECACA';

            const statusColor = isPaid
              ? '#059669'
              : isPendingAcc
              ? '#2563EB'
              : isPendingAdmin
              ? '#D97706'
              : '#DC2626';

            const statusLabel = isPaid
              ? 'Đã chuyển tiền thành công'
              : isPendingAcc
              ? 'Chờ Kế toán chi tiền'
              : isPendingAdmin
              ? 'Chờ Admin duyệt quy đổi'
              : 'Đã từ chối (Hoàn điểm)';

            return (
              <View key={req.id} style={[styles.withdrawalReqCard, { borderColor: statusBorder }]}>
                <View style={styles.withdrawalReqTopRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.withdrawalReqAmount}>
                      {req.cashAmount.toLocaleString('vi-VN')} VNĐ
                    </Text>
                    <Text style={styles.withdrawalReqPoints}>
                      Quy đổi: {req.pointsWithdrawn.toLocaleString('vi-VN')} điểm
                    </Text>
                  </View>
                  <View style={[styles.withdrawalStatusBadge, { backgroundColor: statusBg, borderColor: statusBorder }]}>
                    <Text style={[styles.withdrawalStatusText, { color: statusColor }]}>
                      {statusLabel}
                    </Text>
                  </View>
                </View>

                {/* 4-Step Withdrawal Approval & Payout Pipeline Tracker */}
                <View style={styles.reqDeliveryTrackerWrapper}>
                  <View style={styles.horizontalTrackRow}>
                    {/* Step 1: Created */}
                    <View style={styles.trackNodeWrapper}>
                      <View style={[styles.stepperDotNode, styles.stepperDotWithdrawn, { width: 22, height: 22, borderRadius: 11 }]}>
                        <Ionicons name="checkmark" size={13} color="#FFFFFF" />
                      </View>
                    </View>

                    {/* Line 1 -> 2 */}
                    <View style={styles.trackLineWrapper}>
                      {isPaid || isPendingAcc ? (
                        <View style={[styles.trackLine, styles.trackLineFull]} />
                      ) : isPendingAdmin ? (
                        <View style={styles.trackLineHalfContainer}>
                          <View style={[styles.trackLineHalf, styles.trackLineHalfActive]} />
                          <View style={[styles.trackLineHalf, styles.trackLineHalfInactive]} />
                        </View>
                      ) : isRejected ? (
                        <View style={[styles.trackLine, { backgroundColor: '#FECDD3' }]} />
                      ) : (
                        <View style={[styles.trackLine, styles.trackLineInactive]} />
                      )}
                    </View>

                    {/* Step 2: Admin Approval */}
                    <View style={styles.trackNodeWrapper}>
                      {isRejected ? (
                        <View style={[styles.stepperDotNode, { width: 22, height: 22, borderRadius: 11, backgroundColor: '#FEE2E2', borderColor: '#DC2626' }]}>
                          <Ionicons name="close" size={13} color="#DC2626" />
                        </View>
                      ) : isPaid || isPendingAcc ? (
                        <View style={[styles.stepperDotNode, styles.stepperDotWithdrawn, { width: 22, height: 22, borderRadius: 11 }]}>
                          <Ionicons name="checkmark" size={13} color="#FFFFFF" />
                        </View>
                      ) : isPendingAdmin ? (
                        <View style={[styles.stepperDotNode, styles.stepperDotUpcoming, { width: 22, height: 22, borderRadius: 11 }]}>
                          <Text style={[styles.stepperDotNum, styles.stepperDotNumUpcoming, { fontSize: 10 }]}>2</Text>
                        </View>
                      ) : (
                        <View style={[styles.stepperDotNode, styles.stepperDotLocked, { width: 22, height: 22, borderRadius: 11 }]}>
                          <Text style={[styles.stepperDotNum, { fontSize: 10 }]}>2</Text>
                        </View>
                      )}
                    </View>

                    {/* Line 2 -> 3 */}
                    <View style={styles.trackLineWrapper}>
                      {isPaid ? (
                        <View style={[styles.trackLine, styles.trackLineFull]} />
                      ) : isPendingAcc ? (
                        <View style={styles.trackLineHalfContainer}>
                          <View style={[styles.trackLineHalf, styles.trackLineHalfActive]} />
                          <View style={[styles.trackLineHalf, styles.trackLineHalfInactive]} />
                        </View>
                      ) : (
                        <View style={[styles.trackLine, styles.trackLineInactive]} />
                      )}
                    </View>

                    {/* Step 3: Accountant Payout */}
                    <View style={styles.trackNodeWrapper}>
                      {isPaid ? (
                        <View style={[styles.stepperDotNode, styles.stepperDotWithdrawn, { width: 22, height: 22, borderRadius: 11 }]}>
                          <Ionicons name="checkmark" size={13} color="#FFFFFF" />
                        </View>
                      ) : isPendingAcc ? (
                        <View style={[styles.stepperDotNode, styles.stepperDotUpcoming, { width: 22, height: 22, borderRadius: 11 }]}>
                          <Text style={[styles.stepperDotNum, styles.stepperDotNumUpcoming, { fontSize: 10 }]}>3</Text>
                        </View>
                      ) : (
                        <View style={[styles.stepperDotNode, styles.stepperDotLocked, { width: 22, height: 22, borderRadius: 11 }]}>
                          <Text style={[styles.stepperDotNum, { fontSize: 10 }]}>3</Text>
                        </View>
                      )}
                    </View>

                    {/* Line 3 -> 4 */}
                    <View style={styles.trackLineWrapper}>
                      {isPaid ? (
                        <View style={[styles.trackLine, styles.trackLineFull]} />
                      ) : (
                        <View style={[styles.trackLine, styles.trackLineInactive]} />
                      )}
                    </View>

                    {/* Step 4: Finished */}
                    <View style={styles.trackNodeWrapper}>
                      {isPaid ? (
                        <View style={[styles.stepperDotNode, styles.stepperDotWithdrawn, { width: 22, height: 22, borderRadius: 11 }]}>
                          <Ionicons name="checkmark" size={13} color="#FFFFFF" />
                        </View>
                      ) : (
                        <View style={[styles.stepperDotNode, styles.stepperDotLocked, { width: 22, height: 22, borderRadius: 11 }]}>
                          <Text style={[styles.stepperDotNum, { fontSize: 10 }]}>4</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Step Labels */}
                  <View style={styles.trackLabelsRow}>
                    <View style={styles.trackLabelCol}>
                      <Text style={[styles.trackNodeTitle, { fontSize: 9.5 }]}>Gửi đơn</Text>
                    </View>
                    <View style={styles.trackLabelCol}>
                      <Text style={[styles.trackNodeTitle, (isPendingAdmin || isPendingAcc || isPaid) && { color: '#2563EB' }, { fontSize: 9.5 }]}>Duyệt</Text>
                    </View>
                    <View style={styles.trackLabelCol}>
                      <Text style={[styles.trackNodeTitle, (isPendingAcc || isPaid) && { color: '#2563EB' }, { fontSize: 9.5 }]}>Chi tiền</Text>
                    </View>
                    <View style={styles.trackLabelCol}>
                      <Text style={[styles.trackNodeTitle, isPaid && { color: '#059669' }, { fontSize: 9.5 }]}>Đã nhận</Text>
                    </View>
                  </View>
                </View>

                {/* Timestamp & Notes */}
                <View style={styles.withdrawalFooterRow}>
                  <Text style={styles.withdrawalDateText}>
                    {new Date(req.createdAt).toLocaleDateString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })}
                  </Text>
                  {req.note ? (
                    <Text style={styles.withdrawalNoteText} numberOfLines={1}>
                      • {req.note}
                    </Text>
                  ) : null}
                </View>

                {/* Additional audit notes for Paid or Rejected */}
                {isPaid && req.transactionReference && (
                  <View style={styles.withdrawalAuditBoxSuccess}>
                    <MaterialCommunityIcons name="check-decagram" size={14} color="#059669" />
                    <Text style={styles.withdrawalAuditTextSuccess}>
                      Mã GD / UNC: <Text style={{ fontWeight: '700' }}>{req.transactionReference}</Text>
                      {req.accountantNote ? ` (${req.accountantNote})` : ''}
                    </Text>
                  </View>
                )}

                {isRejected && req.rejectReason && (
                  <View style={styles.withdrawalAuditBoxReject}>
                    <MaterialCommunityIcons name="alert-circle" size={14} color="#DC2626" />
                    <Text style={styles.withdrawalAuditTextReject}>
                      Lý do: <Text style={{ fontWeight: '600' }}>{req.rejectReason}</Text>
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}

      {/* Modal Chi Tiết Gói Thưởng & Lịch Sử Giao Dịch Của Riêng Dự Án */}
      {selectedPackage && (
        <Modal
          visible={packageDetailModalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setPackageDetailModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.pkgDetailModalContent}>
              <View style={styles.bottomSheetHandle} />
              {/* Modal Header */}
              <View style={styles.pkgDetailModalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                  <View style={styles.pkgDetailHeaderBadge}>
                    <Ionicons name="gift-outline" size={20} color="#2563EB" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalTitle} numberOfLines={1}>
                      {selectedPackage.title}
                    </Text>
                    <Text style={styles.modalSubtitle}>Chi tiết lộ trình & Lịch sử giao dịch</Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => setPackageDetailModalVisible(false)}
                  style={styles.modalCloseBtn}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close" size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={styles.pkgDetailScroll}>
                {(() => {
                  const milestones = selectedPackage.milestones || [];
                  const pkgTotalCash = selectedPackage.totalPoints * cashValuePerPoint;
                  const pkgWithdrawnPoints = milestones.reduce((s, m) => s + (m.withdrawnPoints || 0), 0);
                  const pkgWithdrawnCash = pkgWithdrawnPoints * cashValuePerPoint;

                  let pkgUnlockedPoints = 0;
                  let pkgLockedPoints = 0;
                  milestones.forEach((m) => {
                    const remaining = Math.max(0, m.pointsToUnlock - (m.withdrawnPoints || 0));
                    if (remaining > 0) {
                      if (new Date(m.unlockDate) <= now) {
                        pkgUnlockedPoints += remaining;
                      } else {
                        pkgLockedPoints += remaining;
                      }
                    }
                  });

                  const pkgTransactions = getPackageTransactions(selectedPackage, transactions);

                  const startD = selectedPackage.startDate ? new Date(selectedPackage.startDate) : null;
                  const startFormatted = startD
                    ? `${startD.getDate().toString().padStart(2, '0')}/${(startD.getMonth() + 1).toString().padStart(2, '0')}/${startD.getFullYear()}`
                    : 'Theo quy định';

                  return (
                    <View style={{ gap: 12 }}>
                      {/* Package Overview Card */}
                      <View style={styles.pkgModalHeroCard}>
                        <View style={styles.pkgModalHeroTop}>
                          <View>
                            <Text style={styles.pkgModalHeroLabel}>TỔNG ĐIỂM GÓI THƯỞNG</Text>
                            <Text style={styles.pkgModalHeroAmount}>
                              {selectedPackage.totalPoints.toLocaleString('vi-VN')}{' '}
                              <Text style={{ fontSize: 15, fontWeight: '700', color: '#64748B' }}>điểm</Text>
                            </Text>
                            <Text style={styles.pkgModalHeroCash}>
                              ~{pkgTotalCash.toLocaleString('vi-VN')} VNĐ
                            </Text>
                          </View>
                          <View style={styles.pkgModalHeroBadge}>
                            <Text style={styles.pkgModalHeroBadgeText}>
                              {selectedPackage.durationMonths} tháng • {milestones.length} đợt
                            </Text>
                          </View>
                        </View>

                        <View style={styles.pkgModalHeroDivider} />

                        {/* 3 Metric Columns */}
                        <View style={styles.pkgModalMetricsRow}>
                          <View style={styles.pkgModalMetricItem}>
                            <Text style={styles.pkgModalMetricLabel}>Đã rút</Text>
                            <Text style={styles.pkgModalMetricValueSlate}>
                              {pkgWithdrawnPoints.toLocaleString('vi-VN')} đ
                            </Text>
                            <Text style={styles.pkgModalMetricSub}>
                              ~{pkgWithdrawnCash.toLocaleString('vi-VN')} đ
                            </Text>
                          </View>

                          <View style={styles.pkgModalMetricDivider} />

                          <View style={styles.pkgModalMetricItem}>
                            <Text style={styles.pkgModalMetricLabel}>Khả dụng</Text>
                            <Text style={styles.pkgModalMetricValueBlue}>
                              {pkgUnlockedPoints.toLocaleString('vi-VN')} đ
                            </Text>
                            <Text style={styles.pkgModalMetricSub}>
                              ~{(pkgUnlockedPoints * cashValuePerPoint).toLocaleString('vi-VN')} đ
                            </Text>
                          </View>

                          <View style={styles.pkgModalMetricDivider} />

                          <View style={styles.pkgModalMetricItem}>
                            <Text style={styles.pkgModalMetricLabel}>Đang khóa</Text>
                            <Text style={styles.pkgModalMetricValueMuted}>
                              {pkgLockedPoints.toLocaleString('vi-VN')} đ
                            </Text>
                            <Text style={styles.pkgModalMetricSub}>
                              ~{(pkgLockedPoints * cashValuePerPoint).toLocaleString('vi-VN')} đ
                            </Text>
                          </View>
                        </View>

                        <View style={styles.pkgModalHeroFooter}>
                          <Text style={styles.pkgModalHeroFooterText}>
                            Bắt đầu: {startFormatted} • Chu kỳ: {selectedPackage.intervalMonths} tháng/đợt
                          </Text>
                        </View>
                      </View>

                      {/* Milestones Schedule */}
                      <View style={styles.pkgDetailSection}>
                        <View style={styles.pkgDetailSectionHeader}>
                          <Ionicons name="git-commit-outline" size={16} color="#2563EB" />
                          <Text style={styles.pkgDetailSectionTitle}>
                            Lộ Trình Các Đợt Mở Khóa ({milestones.length} đợt)
                          </Text>
                        </View>

                        <View style={styles.pkgMilestonesContainer}>
                          {milestones.map((m, mIdx) => {
                            const unlockDate = new Date(m.unlockDate);
                            const isPassed = unlockDate <= now;
                            const remaining = Math.max(0, m.pointsToUnlock - (m.withdrawnPoints || 0));
                            const isFullyWithdrawn = m.isWithdrawn || (m.withdrawnPoints >= m.pointsToUnlock && m.pointsToUnlock > 0);
                            const isUnlockedAvailable = isPassed && remaining > 0;
                            const isExpiredDồn = isPassed && m.withdrawnPoints === 0 && !isUnlockedAvailable;

                            const dateFormatted = `${unlockDate.getDate().toString().padStart(2, '0')}/${(unlockDate.getMonth() + 1).toString().padStart(2, '0')}/${unlockDate.getFullYear()}`;

                            return (
                              <View
                                key={m.id || mIdx}
                                style={[
                                  styles.pkgMilestoneCardRow,
                                  isUnlockedAvailable && styles.pkgMilestoneCardUnlocked,
                                ]}
                              >
                                <View
                                  style={[
                                    styles.pkgMilestoneIndexCircle,
                                    isUnlockedAvailable && { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' },
                                    isFullyWithdrawn && { backgroundColor: '#F1F5F9', borderColor: '#CBD5E1' },
                                  ]}
                                >
                                  <Text
                                    style={[
                                      styles.pkgMilestoneIndexText,
                                      isUnlockedAvailable && { color: '#2563EB' },
                                      isFullyWithdrawn && { color: '#64748B' },
                                    ]}
                                  >
                                    {mIdx + 1}
                                  </Text>
                                </View>

                                <View style={{ flex: 1 }}>
                                  <Text style={styles.pkgMilestoneRowTitle} numberOfLines={1}>
                                    {m.title || `Đợt ${mIdx + 1}`}
                                  </Text>
                                  <Text style={styles.pkgMilestoneRowDate}>Mở khóa: {dateFormatted}</Text>
                                </View>

                                <View style={{ alignItems: 'flex-end', gap: 3 }}>
                                  <Text
                                    style={[
                                      styles.pkgMilestoneRowPoints,
                                      isUnlockedAvailable && { color: '#2563EB' },
                                      isFullyWithdrawn && { color: '#64748B' },
                                    ]}
                                  >
                                    +{m.pointsToUnlock.toLocaleString('vi-VN')} đ
                                  </Text>

                                  <View
                                    style={[
                                      styles.pkgMilestoneBadge,
                                      isFullyWithdrawn
                                        ? styles.pkgBadgeWithdrawn
                                        : isUnlockedAvailable
                                        ? styles.pkgBadgeUnlocked
                                        : isExpiredDồn
                                        ? styles.pkgBadgeExpired
                                        : styles.pkgBadgeLocked,
                                    ]}
                                  >
                                    <Text
                                      style={[
                                        styles.pkgMilestoneBadgeText,
                                        isFullyWithdrawn
                                          ? styles.pkgBadgeTextWithdrawn
                                          : isUnlockedAvailable
                                          ? styles.pkgBadgeTextUnlocked
                                          : isExpiredDồn
                                          ? styles.pkgBadgeTextExpired
                                          : styles.pkgBadgeTextLocked,
                                      ]}
                                    >
                                      {isFullyWithdrawn
                                        ? 'Đã rút'
                                        : isUnlockedAvailable
                                        ? 'Khả dụng'
                                        : isExpiredDồn
                                        ? 'Hết hạn 15 ngày • Đã dồn'
                                        : 'Chưa mở'}
                                    </Text>
                                  </View>
                                </View>
                              </View>
                            );
                          })}
                        </View>
                      </View>

                      {/* Package-Specific Transaction History (Sorted newest to oldest) */}
                      <View style={styles.pkgDetailSection}>
                        <View style={styles.pkgDetailSectionHeader}>
                          <Ionicons name="time-outline" size={16} color="#2563EB" />
                          <Text style={styles.pkgDetailSectionTitle}>
                            Lịch Sử Biến Động Điểm Của Dự Án ({pkgTransactions.length})
                          </Text>
                        </View>

                        {pkgTransactions.length > 0 ? (
                          <View style={styles.pkgTxListContainer}>
                            {pkgTransactions.map((tx) => {
                              const isPositive = tx.points > 0;
                              const txDate = new Date(tx.createdAt);
                              const dateFormatted = `${txDate.getDate().toString().padStart(2, '0')}/${(txDate.getMonth() + 1).toString().padStart(2, '0')}/${txDate.getFullYear()} ${txDate.getHours().toString().padStart(2, '0')}:${txDate.getMinutes().toString().padStart(2, '0')}`;

                              return (
                                <View key={tx.id} style={styles.pkgTxRow}>
                                  <View
                                    style={[
                                      styles.pkgTxIconCircle,
                                      { backgroundColor: isPositive ? '#EFF6FF' : '#FEF2F2' },
                                    ]}
                                  >
                                    <Ionicons
                                      name={
                                        tx.type === 'GRANT_PROJECT_INSTANT'
                                          ? 'flash-outline'
                                          : tx.type === 'WITHDRAW_ADVANCE'
                                          ? 'arrow-up-outline'
                                          : tx.type === 'REFUND_WITHDRAWAL'
                                          ? 'refresh-outline'
                                          : isPositive
                                          ? 'add'
                                          : 'remove'
                                      }
                                      size={15}
                                      color={isPositive ? '#2563EB' : '#EF4444'}
                                    />
                                  </View>

                                  <View style={{ flex: 1, paddingRight: 6 }}>
                                    <Text style={styles.pkgTxNote} numberOfLines={2}>
                                      {tx.note || (isPositive ? 'Thưởng tích lũy' : 'Rút điểm')}
                                    </Text>
                                    <Text style={styles.pkgTxDate}>{dateFormatted}</Text>
                                  </View>

                                  <Text
                                    style={[
                                      styles.pkgTxPoints,
                                      { color: isPositive ? '#059669' : '#EF4444' },
                                    ]}
                                  >
                                    {isPositive ? '+' : ''}
                                    {tx.points.toLocaleString('vi-VN')} đ
                                  </Text>
                                </View>
                              );
                            })}
                          </View>
                        ) : (
                          <View style={styles.pkgTxEmptyBox}>
                            <Ionicons name="document-text-outline" size={24} color="#94A3B8" />
                            <Text style={styles.pkgTxEmptyText}>
                              Chưa có biến động điểm nào được ghi nhận cho dự án này.
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })()}
              </ScrollView>

              {/* Close Footer */}
              <View style={styles.pkgModalFooter}>
                <TouchableOpacity
                  style={styles.pkgModalCloseBtn}
                  onPress={() => setPackageDetailModalVisible(false)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.pkgModalCloseBtnText}>Đóng</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Modal Withdrawal Form */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.bottomSheetHandle} />
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={styles.modalHeaderBadge}>
                  <Ionicons name="wallet-outline" size={20} color="#2563EB" />
                </View>
                <View>
                  <Text style={styles.modalTitle}>Yêu Cầu Quy Đổi & Rút Điểm</Text>
                  <Text style={styles.modalSubtitle}>Tất toán đợt thưởng đã mở khóa</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCloseBtn} activeOpacity={0.7}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 480 }}>
              <View style={{ marginBottom: 16 }}>
                {/* Fixed Notice Banner */}
                <View style={{ backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#DBEAFE', borderRadius: 12, padding: 12, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Ionicons name="information-circle" size={22} color="#2563EB" />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#1E40AF' }}>Quy định rút điểm: Đợt nào rút đợt đó</Text>
                    <Text style={{ fontSize: 12, color: '#3B82F6', marginTop: 2, lineHeight: 17 }}>
                      Hệ thống tự động quy đổi toàn bộ 100% hạn mức của các đợt đã đến hạn mở khóa ({maxWithdrawable.toLocaleString('vi-VN')} điểm).
                    </Text>
                  </View>
                </View>

                {/* Fixed Amount Display Card */}
                <View style={{ backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View>
                    <Text style={{ fontSize: 12, color: '#64748B', fontWeight: '600' }}>Tổng điểm rút đợt này (100%):</Text>
                    <Text style={{ fontSize: 22, fontWeight: '900', color: '#2563EB', marginTop: 2 }}>
                      {maxWithdrawable.toLocaleString('vi-VN')} điểm
                    </Text>
                  </View>
                  <View style={{ backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: '#BFDBFE' }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#1D4ED8' }}>Rút toàn bộ</Text>
                  </View>
                </View>
              </View>

              {/* Conversion Preview Box */}
              <View style={styles.conversionBox}>
                <View style={styles.conversionRow}>
                  <Text style={styles.conversionLabel}>Tỷ giá quy đổi:</Text>
                  <Text style={styles.conversionRateText}>1 điểm = 1.000 VNĐ</Text>
                </View>
                <View style={styles.conversionDivider} />
                <View style={styles.conversionRow}>
                  <Text style={styles.conversionFormula}>Thành tiền thực nhận:</Text>
                  <Text style={styles.conversionTotal}>
                    +{cashToWithdraw.toLocaleString('vi-VN')} VNĐ
                  </Text>
                </View>
                <View style={styles.conversionDivider} />
                <View style={styles.conversionRow}>
                  <Text style={styles.conversionRemainingLabel}>Điểm còn lại sau rút:</Text>
                  <Text style={styles.conversionRemainingValue}>
                    {Math.max(0, remainingPoints - pointsToWithdraw).toLocaleString('vi-VN')} điểm (~{Math.max(0, (remainingPoints - pointsToWithdraw) * cashValuePerPoint).toLocaleString('vi-VN')} đ)
                  </Text>
                </View>
              </View>

              {/* Multi-Package Breakdown if 2+ packages */}
              {packages.length > 1 && (
                <View style={{ backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 12, marginTop: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <MaterialCommunityIcons name="format-list-checks" size={16} color="#475569" />
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#334155' }}>Nguồn khả dụng theo từng gói ({packages.length} gói):</Text>
                  </View>
                  {packages.map((pkg, idx) => {
                    const milestones = pkg.milestones || [];
                    let pkgWithdrawable = 0;
                    milestones.forEach((m) => {
                      if (new Date(m.unlockDate) <= now && !m.isWithdrawn) {
                        pkgWithdrawable += Math.max(0, (m.pointsToUnlock || 0) - (m.withdrawnPoints || 0));
                      }
                    });
                    return (
                      <View key={pkg.id || idx} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4, borderTopWidth: idx > 0 ? 1 : 0, borderTopColor: '#F1F5F9' }}>
                        <Text style={{ fontSize: 12, color: '#475569', flex: 1, marginRight: 8 }} numberOfLines={1}>• {pkg.title}</Text>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#D97706' }}>
                          {pkgWithdrawable.toLocaleString('vi-VN')} đ
                        </Text>
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Direct Internal Payout Notice */}
              <View style={styles.directPayoutNoticeBox}>
                <MaterialCommunityIcons name="shield-check-outline" size={22} color="#059669" />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.directPayoutTitle, { color: '#065F46' }]}>Quy trình phê duyệt & chi trả:</Text>
                  <Text style={styles.directPayoutDesc}>
                    Sau khi bạn gửi yêu cầu, Admin sẽ phê duyệt xác nhận quy đổi. Tiếp theo bộ phận Kế toán sẽ thực hiện chi trả tiền mặt/chuyển khoản cho bạn.
                  </Text>
                </View>
              </View>

              <Text style={styles.inputLabel}>Ghi chú (Tùy chọn):</Text>
              <TextInput
                style={styles.input}
                value={withdrawNote}
                onChangeText={setWithdrawNote}
                placeholder="VD: Đề xuất nhận thưởng tích lũy..."
              />
            </ScrollView>

            <TouchableOpacity
              style={[styles.submitWithdrawBtn, isSubmitting && { opacity: 0.7 }]}
              onPress={handleWithdrawSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitWithdrawText}>
                  XÁC NHẬN GỬI YÊU CẦU ({cashToWithdraw.toLocaleString('vi-VN')} VNĐ)
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
  },
  cardContainer: {
    marginVertical: 4,
  },
  vipHeroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  vipHeroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  vipHeroTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  vipHeroIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  vipHeroTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  vipHeroSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  vipBadgeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  vipBadgeChipText: {
    color: '#334155',
    fontSize: 10,
    fontWeight: '800',
  },
  vipBalanceCenterpiece: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  vipBalanceLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  vipAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: 8,
  },
  vipAmountNumber: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  vipCurrency: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  vipPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  vipPointPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  vipPointPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  vipInstantPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  vipInstantPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },
  vipMetricsGrid: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  vipMetricCol: {
    flex: 1,
    alignItems: 'center',
  },
  vipMetricLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  vipMetricValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  vipMetricSub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  vipMetricValueOrange: {
    fontSize: 14,
    fontWeight: '800',
    color: '#475569',
  },
  vipMetricSubOrange: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 1,
  },
  vipMetricValueGold: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2563EB',
  },
  vipMetricSubGold: {
    fontSize: 10,
    color: '#1D4ED8',
    marginTop: 1,
  },
  vipMetricDivider: {
    width: 1,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 8,
  },
  vipWithdrawActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2563EB',
    paddingVertical: 13,
    borderRadius: 12,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  vipWithdrawActionBtnDisabled: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    shadowOpacity: 0,
    elevation: 0,
  },
  vipWithdrawActionText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  vipWithdrawActionTextDisabled: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.2,
  },
  vipFooterNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  vipFooterNoteText: {
    fontSize: 11,
    color: '#64748B',
    flex: 1,
    lineHeight: 16,
  },
  shopeeTrackerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    shadowColor: '#EE4D2D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  shopeeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  shopeeEstTime: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '500',
    marginBottom: 2,
  },
  shopeeMainStatus: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
  },
  shopeeAvatarCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFF1F2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FECDD3',
  },
  stepperContainer: {
    marginBottom: 8,
  },
  stepperIconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  milestoneNodeCol: {
    alignItems: 'center',
    width: 38,
  },
  milestoneIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  milestoneIconActive: {
    backgroundColor: '#FFF1F2',
    borderWidth: 1.5,
    borderColor: '#FDA4AF',
  },
  milestoneIconWithdrawn: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  milestoneIconInactive: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  checkedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointerSlot: {
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperLineWrapper: {
    flex: 1,
    height: 3.5,
    marginBottom: 18,
    marginHorizontal: 2,
  },
  stepperLine: {
    height: 3.5,
    borderRadius: 2,
  },
  stepperLineFull: {
    backgroundColor: '#EE4D2D',
  },
  stepperLineInactive: {
    backgroundColor: '#E2E8F0',
  },
  stepperLineHalfWrapper: {
    flexDirection: 'row',
    height: 3.5,
    borderRadius: 2,
    overflow: 'hidden',
  },
  stepperLineHalf: {
    flex: 1,
    height: 3.5,
  },
  stepperLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stepperLabelCol: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  stepperQuarterTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4B5563',
    marginBottom: 2,
  },
  stepperQuarterTitleActive: {
    color: '#EE4D2D',
  },
  stepperDateText: {
    fontSize: 10,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  stepperPointBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeUnlocked: {
    backgroundColor: '#ECFDF5',
  },
  badgeWithdrawn: {
    backgroundColor: '#F1F5F9',
  },
  badgeLocked: {
    backgroundColor: '#F1F5F9',
  },
  stepperPointBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  badgeTextUnlocked: {
    color: '#059669',
  },
  badgeTextWithdrawn: {
    color: '#64748B',
  },
  badgeTextLocked: {
    color: '#64748B',
  },
  milestoneMiniSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  miniSummaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  miniSummaryLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  miniSummaryValUnlocked: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  miniSummaryValLocked: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  miniSummaryDivider: {
    width: 1,
    height: 14,
    backgroundColor: '#E2E8F0',
  },
  withdrawalHistoryContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  withdrawalHistoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  withdrawalHistoryTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#92400E',
    letterSpacing: 0.2,
  },
  withdrawalReqCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  withdrawalReqTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  withdrawalReqAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  withdrawalReqPoints: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  withdrawalStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  withdrawalStatusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  withdrawalBankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
  },
  withdrawalBankText: {
    fontSize: 11,
    color: '#475569',
    flex: 1,
  },
  withdrawalFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  withdrawalDateText: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '500',
  },
  withdrawalNoteText: {
    fontSize: 10,
    color: '#64748B',
    fontStyle: 'italic',
    flex: 1,
  },
  withdrawalAuditBoxSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    padding: 6,
    borderRadius: 6,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  withdrawalAuditTextSuccess: {
    fontSize: 10,
    color: '#065F46',
    flex: 1,
  },
  withdrawalAuditBoxReject: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    padding: 6,
    borderRadius: 6,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  withdrawalAuditTextReject: {
    fontSize: 10,
    color: '#991B1B',
    flex: 1,
  },
  txContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  txTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  txIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txNote: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
  },
  txDate: {
    fontSize: 10,
    color: '#64748B',
  },
  txPoints: {
    fontSize: 12,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
    padding: 0,
    margin: 0,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    maxHeight: '92%',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 12,
  },
  bottomSheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalHeaderBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 4,
    marginTop: 8,
  },
  pointsInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 10,
    backgroundColor: '#F8FAFC',
    marginBottom: 6,
  },
  pointsTextInput: {
    flex: 1,
    height: 42,
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  maxBtn: {
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  maxBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4338CA',
  },
  quickPercentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  quickPercentBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quickPercentBtnActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  quickPercentText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  quickPercentTextActive: {
    color: '#2563EB',
    fontWeight: '800',
  },
  conversionBox: {
    backgroundColor: '#ECFDF5',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginBottom: 10,
  },
  conversionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  conversionDivider: {
    height: 1,
    backgroundColor: '#A7F3D0',
    marginVertical: 6,
    opacity: 0.6,
  },
  conversionLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#065F46',
  },
  conversionRateText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#047857',
  },
  conversionFormula: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#065F46',
  },
  conversionTotal: {
    fontSize: 15,
    fontWeight: '900',
    color: '#059669',
  },
  conversionRemainingLabel: {
    fontSize: 11,
    color: '#047857',
    fontWeight: '500',
  },
  conversionRemainingValue: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065F46',
  },
  advanceWarningBox: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#EFF6FF',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    marginBottom: 8,
  },
  advanceWarningTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E40AF',
    marginBottom: 2,
  },
  advanceWarningDesc: {
    fontSize: 10,
    color: '#3B82F6',
    lineHeight: 14,
  },
  directPayoutNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    marginVertical: 10,
  },
  directPayoutTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E40AF',
    marginBottom: 2,
  },
  directPayoutDesc: {
    fontSize: 11,
    color: '#3B82F6',
    lineHeight: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    fontSize: 13,
    backgroundColor: '#F8FAFC',
    marginBottom: 4,
    color: '#0F172A',
  },
  submitWithdrawBtn: {
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  submitWithdrawText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  disabledCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  disabledIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  disabledTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  disabledDescription: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 10,
  },
  disabledHint: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 8,
    lineHeight: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  refreshBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563EB',
  },
  packageListContainer: {
    marginTop: 10,
    marginBottom: 16,
    gap: 12,
  },
  packageListHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  packageListTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
  },
  packageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  packageCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 10,
    gap: 8,
  },
  pkgIconBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  packageCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  packageCardMeta: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  packageTotalBadge: {
    alignItems: 'flex-end',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  packageTotalPoints: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  packageTotalCash: {
    fontSize: 10,
    fontWeight: '600',
    color: '#2563EB',
  },
  pkgMilestoneList: {
    gap: 6,
    marginBottom: 10,
  },
  pkgMilestoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 8,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pkgMilestoneRowWithdrawn: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECDD3',
    borderWidth: 1.5,
  },
  pkgMilestoneRowUnlocked: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
    borderWidth: 1.5,
  },
  pkgMilestoneRowLocked: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1,
  },
  milestoneLeftInfo: {
    flex: 1,
    gap: 2,
  },
  milestoneRightInfo: {
    alignItems: 'flex-end',
    gap: 3,
  },
  pkgMilestoneTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  pkgMilestoneDate: {
    fontSize: 10,
    color: '#64748B',
    marginLeft: 23,
  },
  pkgMilestonePoints: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  pkgMilestonePointsWithdrawn: {
    fontSize: 12,
    fontWeight: '800',
    color: '#DC2626',
  },
  pkgMilestonePointsUnlocked: {
    fontSize: 12,
    fontWeight: '800',
    color: '#16A34A',
  },
  pkgMilestonePointsDeducted: {
    fontSize: 10,
    fontWeight: '700',
    color: '#DC2626',
  },
  milestoneStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pillWithdrawn: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  pillUnlocked: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  pillLocked: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  milestoneStatusPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  pillTextWithdrawn: {
    color: '#DC2626',
  },
  pillTextUnlocked: {
    color: '#15803D',
  },
  pillTextLocked: {
    color: '#64748B',
  },
  packageBottomSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingVertical: 6,
  },
  pkgSummaryItem: {
    alignItems: 'center',
  },
  pkgSummaryLabel: {
    fontSize: 10,
    color: '#64748B',
  },
  pkgSummaryValWithdrawn: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  pkgSummaryValUnlocked: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  pkgSummaryValLocked: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  pkgSummaryDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#E2E8F0',
  },
  scrollHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  scrollHintText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },
  scrollHintBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  scrollHintBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#2563EB',
  },
  horizontalTrackerCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  horizontalTrackerScrollContent: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  horizontalTrackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginBottom: 4,
  },
  trackNodeWrapper: {
    alignItems: 'center',
    width: 32,
  },
  stepperDotNode: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    zIndex: 2,
  },
  stepperDotWithdrawn: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  stepperDotUnlocked: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  stepperDotUpcoming: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  stepperDotLocked: {
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
    borderWidth: 1.5,
  },
  stepperDotNum: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
  },
  stepperDotNumUpcoming: {
    color: '#2563EB',
  },
  trackCaretSlot: {
    height: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackLineWrapper: {
    flex: 1,
    height: 4.5,
    marginBottom: 14,
    marginHorizontal: 4,
  },
  trackLine: {
    height: 4.5,
    borderRadius: 2.5,
  },
  trackLineFull: {
    backgroundColor: '#2563EB',
  },
  trackLineInactive: {
    backgroundColor: '#E2E8F0',
  },
  trackLineHalfContainer: {
    flexDirection: 'row',
    height: 4.5,
    borderRadius: 2.5,
    overflow: 'hidden',
  },
  trackLineHalf: {
    flex: 1,
    height: 4.5,
  },
  trackLineHalfActive: {
    backgroundColor: '#2563EB',
  },
  trackLineHalfInactive: {
    backgroundColor: '#E2E8F0',
  },
  trackLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  trackLabelCol: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  trackNodeTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
    textAlign: 'center',
  },
  trackNodeDate: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
    marginTop: 6,
    marginBottom: 4,
    textAlign: 'center',
  },
  trackNodePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 58,
  },
  trackPillWithdrawn: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  trackPillUnlocked: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  trackPillLocked: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  trackPillUpcoming: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  trackNodePillText: {
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
  trackPillTextWithdrawn: {
    color: '#64748B',
  },
  trackPillTextUnlocked: {
    color: '#1D4ED8',
  },
  trackPillTextUpcoming: {
    color: '#2563EB',
  },
  trackPillTextLocked: {
    color: '#64748B',
  },
  reqDeliveryTrackerWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 4,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  countdownCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  countdownHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  countdownHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  countdownIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  countdownCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  countdownCardSubtitle: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 1,
  },
  countdownTargetPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  countdownTargetPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  countdownBoxesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  countdownBox: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    minWidth: 54,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  countdownBoxNum: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    fontVariant: ['tabular-nums'],
  },
  countdownBoxLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  countdownColon: {
    fontSize: 18,
    fontWeight: '900',
    color: '#94A3B8',
    marginTop: -8,
  },
  timelineProgressSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  timelineDateHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  timelineDateCol: {
    flex: 1,
  },
  timelineDateLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
    marginBottom: 2,
  },
  timelineDateValue: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  timelineDateValueGold: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2563EB',
  },
  timelinePercentBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  timelinePercentText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2563EB',
  },
  timelineTrack: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'visible',
    position: 'relative',
    marginVertical: 6,
  },
  timelineFill: {
    height: '100%',
    backgroundColor: '#2563EB',
    borderRadius: 4,
  },
  timelinePointerPin: {
    position: 'absolute',
    top: -3,
    marginLeft: -7,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#EFF6FF',
    borderWidth: 2,
    borderColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelinePointerDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#2563EB',
  },
  timelineFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  timelineFooterLeft: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '500',
  },
  timelineFooterBold: {
    fontWeight: '800',
    color: '#0F172A',
  },
  countdownAllUnlockedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  allUnlockedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  allUnlockedIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  allUnlockedTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  allUnlockedSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 16,
  },
  allUnlockedTrack: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  allUnlockedFill: {
    width: '100%',
    height: '100%',
    backgroundColor: '#2563EB',
  },
  // Package Card Action & Status
  pkgActionFooter: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  pkgNextMilestoneRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  pkgNextMilestoneText: {
    fontSize: 11,
    color: '#64748B',
    flex: 1,
  },
  pkgDetailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  pkgDetailBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },
  // Package Detail Modal
  pkgDetailModalContent: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    maxHeight: '92%',
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 12,
  },
  pkgDetailModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  pkgDetailHeaderBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  modalSubtitle: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 1,
  },
  pkgDetailScroll: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 16,
  },
  pkgModalHeroCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pkgModalHeroTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  pkgModalHeroLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  pkgModalHeroAmount: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
  },
  pkgModalHeroCash: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#2563EB',
    marginTop: 1,
  },
  pkgModalHeroBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  pkgModalHeroBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  pkgModalHeroDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 10,
  },
  pkgModalMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pkgModalMetricItem: {
    flex: 1,
    alignItems: 'center',
  },
  pkgModalMetricLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 2,
  },
  pkgModalMetricValueSlate: {
    fontSize: 13,
    fontWeight: '800',
    color: '#475569',
  },
  pkgModalMetricValueBlue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2563EB',
  },
  pkgModalMetricValueMuted: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748B',
  },
  pkgModalMetricSub: {
    fontSize: 9.5,
    color: '#94A3B8',
    marginTop: 1,
  },
  pkgModalMetricDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },
  pkgModalHeroFooter: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    alignItems: 'center',
  },
  pkgModalHeroFooterText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  pkgDetailSection: {
    marginTop: 14,
  },
  pkgDetailSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  pkgDetailSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  pkgMilestonesContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  pkgMilestoneCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 10,
  },
  pkgMilestoneCardUnlocked: {
    backgroundColor: '#F8FAFC',
  },
  pkgMilestoneIndexCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pkgMilestoneIndexText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#64748B',
  },
  pkgMilestoneRowTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  pkgMilestoneRowDate: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 1,
  },
  pkgMilestoneRowPoints: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  pkgMilestoneBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pkgMilestoneBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  pkgBadgeWithdrawn: {
    backgroundColor: '#F1F5F9',
  },
  pkgBadgeTextWithdrawn: {
    color: '#64748B',
  },
  pkgBadgeUnlocked: {
    backgroundColor: '#EFF6FF',
  },
  pkgBadgeTextUnlocked: {
    color: '#2563EB',
  },
  pkgBadgeExpired: {
    backgroundColor: '#FEF2F2',
  },
  pkgBadgeTextExpired: {
    color: '#EF4444',
  },
  pkgBadgeLocked: {
    backgroundColor: '#F8FAFC',
  },
  pkgBadgeTextLocked: {
    color: '#94A3B8',
  },
  pkgTxListContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  pkgTxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 10,
  },
  pkgTxIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pkgTxNote: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#0F172A',
  },
  pkgTxDate: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 1,
  },
  pkgTxPoints: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  pkgTxEmptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  pkgTxEmptyText: {
    fontSize: 11.5,
    color: '#64748B',
    textAlign: 'center',
  },
  pkgModalFooter: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  pkgModalCloseBtn: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pkgModalCloseBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#475569',
  },
});
