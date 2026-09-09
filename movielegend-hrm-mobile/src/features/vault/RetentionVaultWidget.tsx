import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ScrollView,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../providers/AuthProvider';
import { getMyVault, withdrawVaultPoints } from '../../api/employees.api';
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

  const openWithdrawModal = () => {
    // Default withdraw amount to unlocked points if > 0, otherwise max withdrawable
    const defaultPts = stats.unlockedPoints > 0 ? stats.unlockedPoints : stats.maxWithdrawable;
    setWithdrawPointsInput(defaultPts.toString());
    setWithdrawNote('');
    setModalVisible(true);
  };

  const pointsToWithdraw = parseInt(withdrawPointsInput, 10) || 0;
  const cashToWithdraw = pointsToWithdraw * cashValuePerPoint;
  const isAdvanceWithdrawal = pointsToWithdraw > stats.unlockedPoints;
  const advancePoints = Math.max(0, pointsToWithdraw - stats.unlockedPoints);
  const advanceCash = advancePoints * cashValuePerPoint;

  const handleWithdrawSubmit = async () => {
    if (pointsToWithdraw <= 0) {
      Alert.alert('Lỗi', 'Vui lòng nhập số điểm muốn rút lớn hơn 0!');
      return;
    }

    if (pointsToWithdraw > stats.maxWithdrawable) {
      Alert.alert(
        'Vượt quá hạn mức',
        `Số điểm rút (${pointsToWithdraw.toLocaleString('vi-VN')} đ) vượt quá tổng hạn mức có thể rút (${stats.maxWithdrawable.toLocaleString('vi-VN')} đ).`
      );
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

      Alert.alert(
        'Gửi Yêu Cầu Rút Điểm Thành Công! 💸',
        isAdvanceWithdrawal
          ? `Đã gửi yêu cầu rút ${cashToWithdraw.toLocaleString('vi-VN')} VNĐ (${pointsToWithdraw.toLocaleString('vi-VN')} điểm, bao gồm ứng trước ${advancePoints.toLocaleString('vi-VN')} điểm từ các đợt tương lai). Admin & Kế toán sẽ phê duyệt và quy đổi thanh toán cho bạn sớm nhất!`
          : `Đã gửi yêu cầu rút ${cashToWithdraw.toLocaleString('vi-VN')} VNĐ (${pointsToWithdraw.toLocaleString('vi-VN')} điểm). Admin & Kế toán sẽ phê duyệt và quy đổi thanh toán cho bạn sớm nhất!`
      );
    } catch (err: any) {
      Alert.alert('Lỗi rút tiền', err?.response?.data?.message || err?.message || 'Không thể gửi yêu cầu rút tiền lúc này.');
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
              <MaterialCommunityIcons name="wallet-giftcard" size={20} color="#D97706" />
            </View>
            <View>
              <Text style={styles.vipHeroTitle}>Ví Thưởng Tích Lũy {currentYear}</Text>
              <Text style={styles.vipHeroSubtitle}>Quỹ Thưởng Đồng Hành & Cống Hiến {currentYear}</Text>
            </View>
          </View>
          <View style={styles.vipBadgeChip}>
            <MaterialCommunityIcons name="crown" size={13} color="#B45309" />
            <Text style={styles.vipBadgeChipText}>VIP {currentYear}</Text>
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
              <MaterialCommunityIcons name="cash-multiple" size={13} color="#065F46" />
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

        {/* Primary CTA Withdraw Button: Chỉ mở khi đã đến kỳ hạn mở khóa */}
        {maxWithdrawable > 0 ? (
          <TouchableOpacity
            style={styles.vipWithdrawActionBtn}
            onPress={openWithdrawModal}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="wallet-giftcard" size={20} color="#FFFFFF" />
            <Text style={styles.vipWithdrawActionText}>YÊU CẦU QUY ĐỔI / RÚT ĐIỂM</Text>
          </TouchableOpacity>
        ) : (
          <View style={[styles.vipWithdrawActionBtn, styles.vipWithdrawActionBtnDisabled]}>
            <MaterialCommunityIcons name="lock-outline" size={18} color="#94A3B8" />
            <Text style={styles.vipWithdrawActionTextDisabled}>
              CHƯA ĐẾN HẠN RÚT ĐIỂM
            </Text>
          </View>
        )}

        {/* Advance Note Footer */}
        <View style={styles.vipFooterNote}>
          <MaterialCommunityIcons name="shield-check-outline" size={14} color="#92400E" />
          <Text style={styles.vipFooterNoteText}>
            Hệ thống khấu trừ theo thứ tự (FIFO): Dự án mở trước rút trước, hỗ trợ rút ứng trước từ các đợt sau.
          </Text>
        </View>
      </View>

      {/* Vạch Thời Gian & Đếm Ngược Đến Hạn Mở Rút */}
      {nextMilestoneInfo ? (
        <View style={styles.countdownCard}>
          {/* Header Row */}
          <View style={styles.countdownHeaderRow}>
            <View style={styles.countdownHeaderLeft}>
              <View style={styles.countdownIconCircle}>
                <MaterialCommunityIcons name="timer-sand" size={20} color="#D97706" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.countdownCardTitle}>Đếm Ngược Đến Đợt Rút Tiếp Theo</Text>
                <Text style={styles.countdownCardSubtitle} numberOfLines={1}>
                  {nextMilestoneInfo.packageTitle ? `${nextMilestoneInfo.packageTitle} • ` : ''}{nextMilestoneInfo.title}
                </Text>
              </View>
            </View>
            <View style={styles.countdownTargetPill}>
              <MaterialCommunityIcons name="calendar-clock" size={13} color="#B45309" />
              <Text style={styles.countdownTargetPillText}>{nextMilestoneInfo.unlockDateFormatted}</Text>
            </View>
          </View>

          {/* Realtime Countdown Ticker Boxes */}
          <View style={styles.countdownBoxesRow}>
            <View style={styles.countdownBox}>
              <Text style={styles.countdownBoxNum}>{String(nextMilestoneInfo.days).padStart(2, '0')}</Text>
              <Text style={styles.countdownBoxLabel}>NGÀY</Text>
            </View>
            <Text style={styles.countdownColon}>:</Text>
            <View style={styles.countdownBox}>
              <Text style={styles.countdownBoxNum}>{String(nextMilestoneInfo.hours).padStart(2, '0')}</Text>
              <Text style={styles.countdownBoxLabel}>GIỜ</Text>
            </View>
            <Text style={styles.countdownColon}>:</Text>
            <View style={styles.countdownBox}>
              <Text style={styles.countdownBoxNum}>{String(nextMilestoneInfo.minutes).padStart(2, '0')}</Text>
              <Text style={styles.countdownBoxLabel}>PHÚT</Text>
            </View>
            <Text style={styles.countdownColon}>:</Text>
            <View style={styles.countdownBox}>
              <Text style={styles.countdownBoxNum}>{String(nextMilestoneInfo.seconds).padStart(2, '0')}</Text>
              <Text style={styles.countdownBoxLabel}>GIÂY</Text>
            </View>
          </View>

          {/* Vạch Thời Gian Tiến Trình Chu Kỳ (Timeline Progress Bar) */}
          <View style={styles.timelineProgressSection}>
            <View style={styles.timelineDateHeaderRow}>
              <View style={styles.timelineDateCol}>
                <Text style={styles.timelineDateLabel}>Bắt đầu chu kỳ</Text>
                <Text style={styles.timelineDateValue}>{nextMilestoneInfo.startDateFormatted}</Text>
              </View>
              <View style={styles.timelinePercentBadge}>
                <Text style={styles.timelinePercentText}>Tiến độ: {Math.round(nextMilestoneInfo.progressPercent)}%</Text>
              </View>
              <View style={[styles.timelineDateCol, { alignItems: 'flex-end' }]}>
                <Text style={styles.timelineDateLabel}>Hạn mở khóa</Text>
                <Text style={styles.timelineDateValueGold}>{nextMilestoneInfo.unlockDateFormatted}</Text>
              </View>
            </View>

            {/* Vạch thời gian */}
            <View style={styles.timelineTrack}>
              <View
                style={[
                  styles.timelineFill,
                  { width: `${Math.min(100, Math.max(3, nextMilestoneInfo.progressPercent))}%` },
                ]}
              />
              <View
                style={[
                  styles.timelinePointerPin,
                  { left: `${Math.min(96, Math.max(2, nextMilestoneInfo.progressPercent))}%` },
                ]}
              >
                <View style={styles.timelinePointerDot} />
              </View>
            </View>

            <View style={styles.timelineFooterRow}>
              <Text style={styles.timelineFooterLeft}>
                <MaterialCommunityIcons name="lightning-bolt" size={13} color="#059669" />
                {' '}Dự kiến mở khóa: <Text style={styles.timelineFooterBold}>+{nextMilestoneInfo.cashAmount.toLocaleString('vi-VN')} VNĐ</Text> ({nextMilestoneInfo.points.toLocaleString('vi-VN')} điểm)
              </Text>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.countdownAllUnlockedCard}>
          <View style={styles.allUnlockedLeft}>
            <View style={styles.allUnlockedIconCircle}>
              <MaterialCommunityIcons name="check-decagram" size={24} color="#059669" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.allUnlockedTitle}>Đã Đến Hạn Tất Cả Các Đợt Rút</Text>
              <Text style={styles.allUnlockedSubtitle}>
                Toàn bộ quỹ thưởng đã hoàn tất mở khóa theo chu kỳ. Bạn có thể gửi yêu cầu tất toán bất kỳ lúc nào!
              </Text>
            </View>
          </View>
          <View style={styles.allUnlockedTrack}>
            <View style={styles.allUnlockedFill} />
          </View>
        </View>
      )}

      {/* Render Separate Cards for Each ProjectGrantPackage */}
      {packages.length > 0 && (
        <View style={styles.packageListContainer}>
          <View style={styles.packageListHeader}>
            <MaterialCommunityIcons name="briefcase-outline" size={18} color="#92400E" />
            <Text style={styles.packageListTitle}>Các Gói Thưởng Dự Án Đang Tham Gia ({packages.length}):</Text>
          </View>

          {packages.map((pkg, pIdx) => {
            const milestones = pkg.milestones || [];
            const pkgTotalCash = pkg.totalPoints * cashValuePerPoint;
            const pkgWithdrawnPoints = milestones.reduce((s, m) => s + (m.withdrawnPoints || 0), 0);
            const pkgWithdrawnCash = pkgWithdrawnPoints * cashValuePerPoint;

            let pkgUnlockedPoints = 0;
            let pkgLockedPoints = 0;
            milestones.forEach((m) => {
              const remaining = Math.max(0, m.pointsToUnlock - m.withdrawnPoints);
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

            return (
              <View key={pkg.id || pIdx} style={styles.packageCard}>
                {/* Package Card Header */}
                <View style={styles.packageCardHeader}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <View style={styles.pkgIconBadge}>
                        <MaterialCommunityIcons name="gift" size={16} color="#B45309" />
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
                </View>

                {/* --- HORIZONTAL TRACKER (EXACT DESIGN MATCH) --- */}
                <View style={styles.horizontalTrackerCard}>
                  {/* Top Icons & Connecting Progress Lines Track */}
                  <View style={styles.horizontalTrackRow}>
                    {milestones.map((m, mIdx) => {
                      const unlockDate = new Date(m.unlockDate);
                      const isPassed = unlockDate <= now;
                      const remaining = Math.max(0, m.pointsToUnlock - (m.withdrawnPoints || 0));
                      const isFullyWithdrawn = m.isWithdrawn || (m.withdrawnPoints >= m.pointsToUnlock && m.pointsToUnlock > 0);
                      const isUnlockedAvailable = isPassed && remaining > 0;
                      const isCurrentUpcoming = mIdx === firstLockedIdx;

                      // Icon selection
                      const iconName = defaultIcons[mIdx % defaultIcons.length] as any;

                      // Colors
                      const iconColor = isFullyWithdrawn
                        ? '#DC2626' // Red
                        : isUnlockedAvailable
                        ? '#EE4D2D' // Shopee Active Orange
                        : isCurrentUpcoming
                        ? '#EE4D2D' // Current upcoming in orange
                        : '#CBD5E1'; // Muted Grey

                      const showCaret = isFullyWithdrawn || isUnlockedAvailable || isCurrentUpcoming;
                      const caretColor = isFullyWithdrawn ? '#DC2626' : '#EE4D2D';

                      // Connecting line to the next node
                      let lineType: 'full' | 'half' | 'none' = 'none';
                      const nextM = milestones[mIdx + 1];
                      if (nextM) {
                        const nextUnlockDate = new Date(nextM.unlockDate);
                        const nextPassed = nextUnlockDate <= now;
                        const nextFullyWithdrawn = Boolean(nextM.isWithdrawn) || ((nextM.withdrawnPoints || 0) >= nextM.pointsToUnlock && nextM.pointsToUnlock > 0);

                        if (nextPassed || nextFullyWithdrawn) {
                          lineType = 'full';
                        } else if (isPassed || isFullyWithdrawn) {
                          lineType = 'half';
                        } else {
                          lineType = 'none';
                        }
                      }

                      return (
                        <React.Fragment key={m.id || mIdx}>
                          {/* Node Icon + Caret Indicator */}
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

                          {/* Connecting Bar */}
                          {mIdx < milestones.length - 1 && (
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

                  {/* Node Labels Row */}
                  <View style={styles.trackLabelsRow}>
                    {milestones.map((m, mIdx) => {
                      const unlockDate = new Date(m.unlockDate);
                      const isPassed = unlockDate <= now;
                      const remaining = Math.max(0, m.pointsToUnlock - (m.withdrawnPoints || 0));
                      const isFullyWithdrawn = m.isWithdrawn || (m.withdrawnPoints >= m.pointsToUnlock && m.pointsToUnlock > 0);
                      const isUnlockedAvailable = isPassed && remaining > 0;
                      const isPartiallyWithdrawn = (m.withdrawnPoints || 0) > 0 && remaining > 0;

                      const dateFormatted = `${unlockDate.getDate().toString().padStart(2, '0')}/${(unlockDate.getMonth() + 1).toString().padStart(2, '0')}`;

                      return (
                        <View key={m.id || mIdx} style={styles.trackLabelCol}>
                          <Text
                            style={[
                              styles.trackNodeTitle,
                              isFullyWithdrawn && { color: '#DC2626', fontWeight: '800' },
                              isUnlockedAvailable && { color: '#EE4D2D', fontWeight: '800' },
                            ]}
                            numberOfLines={1}
                          >
                            {m.title || `Đợt ${mIdx + 1}`}
                          </Text>
                          <Text style={styles.trackNodeDate}>{dateFormatted}</Text>

                          {/* Status Tag Pill */}
                          <View
                            style={[
                              styles.trackNodePill,
                              isFullyWithdrawn && styles.trackPillWithdrawn,
                              isUnlockedAvailable && styles.trackPillUnlocked,
                              !isFullyWithdrawn && !isUnlockedAvailable && mIdx === firstLockedIdx && styles.trackPillUpcoming,
                              !isFullyWithdrawn && !isUnlockedAvailable && mIdx !== firstLockedIdx && styles.trackPillLocked,
                            ]}
                          >
                            <Text
                              style={[
                                styles.trackNodePillText,
                                isFullyWithdrawn && styles.trackPillTextWithdrawn,
                                isUnlockedAvailable && styles.trackPillTextUnlocked,
                                !isFullyWithdrawn && !isUnlockedAvailable && mIdx === firstLockedIdx && styles.trackPillTextUpcoming,
                                !isFullyWithdrawn && !isUnlockedAvailable && mIdx !== firstLockedIdx && styles.trackPillTextLocked,
                              ]}
                              numberOfLines={1}
                            >
                              {isFullyWithdrawn
                                ? `Đã rút (-${(m.withdrawnPoints || 0).toLocaleString('vi-VN')} đ)`
                                : isPartiallyWithdrawn
                                ? `Còn ${remaining.toLocaleString('vi-VN')} đ`
                                : isUnlockedAvailable
                                ? `Mở khóa (${m.pointsToUnlock.toLocaleString('vi-VN')} đ)`
                                : mIdx === firstLockedIdx
                                ? `⏳ Đếm (${m.pointsToUnlock.toLocaleString('vi-VN')} đ)`
                                : `${m.pointsToUnlock.toLocaleString('vi-VN')} đ`}
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
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
              ? '✅ Đã chuyển tiền thành công'
              : isPendingAcc
              ? '💼 Chờ Kế toán chi tiền'
              : isPendingAdmin
              ? '⏳ Chờ Admin duyệt quy đổi'
              : '❌ Đã từ chối (Hoàn điểm)';

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
                      <MaterialCommunityIcons
                        name="file-document-edit"
                        size={22}
                        color={isRejected ? '#DC2626' : '#EE4D2D'}
                      />
                      <View style={styles.trackCaretSlot}>
                        <MaterialCommunityIcons
                          name="chevron-down"
                          size={13}
                          color={isRejected ? '#DC2626' : '#EE4D2D'}
                        />
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
                      <MaterialCommunityIcons
                        name="account-check"
                        size={22}
                        color={
                          isRejected
                            ? '#DC2626'
                            : isPaid || isPendingAcc
                            ? '#EE4D2D'
                            : isPendingAdmin
                            ? '#EE4D2D'
                            : '#CBD5E1'
                        }
                      />
                      <View style={styles.trackCaretSlot}>
                        {(isPaid || isPendingAcc || isPendingAdmin || isRejected) && (
                          <MaterialCommunityIcons
                            name="chevron-down"
                            size={13}
                            color={isRejected ? '#DC2626' : '#EE4D2D'}
                          />
                        )}
                      </View>
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
                      <MaterialCommunityIcons
                        name="bank-transfer"
                        size={22}
                        color={isPaid ? '#EE4D2D' : isPendingAcc ? '#EE4D2D' : '#CBD5E1'}
                      />
                      <View style={styles.trackCaretSlot}>
                        {(isPaid || isPendingAcc) && (
                          <MaterialCommunityIcons
                            name="chevron-down"
                            size={13}
                            color="#EE4D2D"
                          />
                        )}
                      </View>
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
                      <MaterialCommunityIcons
                        name="check-decagram"
                        size={22}
                        color={isPaid ? '#059669' : '#CBD5E1'}
                      />
                      <View style={styles.trackCaretSlot}>
                        {isPaid && (
                          <MaterialCommunityIcons
                            name="chevron-down"
                            size={13}
                            color="#059669"
                          />
                        )}
                      </View>
                    </View>
                  </View>

                  {/* Step Labels */}
                  <View style={styles.trackLabelsRow}>
                    <View style={styles.trackLabelCol}>
                      <Text style={[styles.trackNodeTitle, { fontSize: 9.5 }]}>Gửi đơn</Text>
                    </View>
                    <View style={styles.trackLabelCol}>
                      <Text style={[styles.trackNodeTitle, (isPendingAdmin || isPendingAcc || isPaid) && { color: '#EE4D2D' }, { fontSize: 9.5 }]}>Duyệt</Text>
                    </View>
                    <View style={styles.trackLabelCol}>
                      <Text style={[styles.trackNodeTitle, (isPendingAcc || isPaid) && { color: '#EE4D2D' }, { fontSize: 9.5 }]}>Chi tiền</Text>
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

      {/* Recent Transactions Ledger */}
      {transactions.length > 0 && (
        <View style={styles.txContainer}>
          <Text style={styles.txTitle}>Lịch sử biến động điểm gần đây:</Text>
          {transactions.slice(0, 5).map((tx) => {
            const isPositive = tx.points > 0;
            return (
              <View key={tx.id} style={styles.txRow}>
                <View
                  style={[
                    styles.txIconBadge,
                    { backgroundColor: isPositive ? '#ECFDF5' : '#FEF2F2' },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={
                      tx.type === 'GRANT_PROJECT_INSTANT'
                        ? 'lightning-bolt'
                        : tx.type === 'WITHDRAW_ADVANCE'
                        ? 'arrow-up-bold-box-outline'
                        : tx.type === 'REFUND_WITHDRAWAL'
                        ? 'cash-refund'
                        : isPositive
                        ? 'plus'
                        : 'minus'
                    }
                    size={16}
                    color={isPositive ? '#059669' : '#DC2626'}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.txNote} numberOfLines={1}>
                    {tx.note || (isPositive ? 'Thưởng điểm' : 'Rút tiền thưởng')}
                  </Text>
                  <Text style={styles.txDate}>
                    {new Date(tx.createdAt).toLocaleDateString('vi-VN')} •{' '}
                    {tx.type === 'WITHDRAW_ADVANCE'
                      ? 'Rút ứng trước'
                      : tx.type === 'GRANT_PROJECT_INSTANT'
                      ? 'Thưởng nóng'
                      : tx.type === 'GRANT_PROJECT_VESTING'
                      ? 'Thưởng tích lũy'
                      : tx.type === 'REFUND_WITHDRAWAL'
                      ? 'Hoàn điểm'
                      : 'Thưởng năm'}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.txPoints,
                    { color: isPositive ? '#059669' : '#DC2626' },
                  ]}
                >
                  {isPositive ? '+' : ''}
                  {tx.points.toLocaleString('vi-VN')} đ
                </Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Modal Withdrawal Form */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={styles.modalHeaderBadge}>
                  <Ionicons name="cash-outline" size={20} color="#D97706" />
                </View>
                <Text style={styles.modalTitle}>Yêu Cầu Quy Đổi & Rút Điểm</Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 460 }}>
              {/* Point Input */}
              <Text style={styles.inputLabel}>Số điểm muốn quy đổi (Tối đa {maxWithdrawable.toLocaleString('vi-VN')} điểm):</Text>
              <View style={styles.pointsInputRow}>
                <TextInput
                  style={styles.pointsTextInput}
                  value={withdrawPointsInput}
                  onChangeText={(v) => setWithdrawPointsInput(v.replace(/[^0-9]/g, ''))}
                  placeholder="Nhập số điểm..."
                  keyboardType="numeric"
                />
                <TouchableOpacity
                  style={styles.maxBtn}
                  onPress={() => setWithdrawPointsInput(maxWithdrawable.toString())}
                >
                  <Text style={styles.maxBtnText}>Tất cả</Text>
                </TouchableOpacity>
              </View>

              {/* Quick Percentage Buttons */}
              <View style={styles.quickPercentRow}>
                {[25, 50, 75, 100].map((pct) => {
                  const calculatedPoints = Math.floor((maxWithdrawable * pct) / 100);
                  const isSelected = pointsToWithdraw === calculatedPoints && calculatedPoints > 0;
                  return (
                    <TouchableOpacity
                      key={pct}
                      style={[styles.quickPercentBtn, isSelected && styles.quickPercentBtnActive]}
                      onPress={() => setWithdrawPointsInput(calculatedPoints.toString())}
                    >
                      <Text style={[styles.quickPercentText, isSelected && styles.quickPercentTextActive]}>
                        {pct === 100 ? '100% (Tối đa)' : `${pct}%`}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
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

              {/* Reverse Waterfall Advance Warning */}
              {isAdvanceWithdrawal && (
                <View style={styles.advanceWarningBox}>
                  <MaterialCommunityIcons name="alert-circle-outline" size={20} color="#B45309" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.advanceWarningTitle}>Ứng trước từ Quý tương lai</Text>
                    <Text style={styles.advanceWarningDesc}>
                      Bạn đang rút vượt mức khả dụng {advancePoints.toLocaleString('vi-VN')} điểm (~{advanceCash.toLocaleString('vi-VN')} VNĐ). Hệ thống sẽ tự động khấu trừ ưu tiên từ Quý 4 (31/12) về trước.
                    </Text>
                  </View>
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
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
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
    backgroundColor: '#FFFBEB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  vipHeroTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#92400E',
  },
  vipHeroSubtitle: {
    fontSize: 11,
    color: '#78350F',
    marginTop: 1,
  },
  vipBadgeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  vipBadgeChipText: {
    color: '#B45309',
    fontSize: 10,
    fontWeight: '800',
  },
  vipBalanceCenterpiece: {
    backgroundColor: '#ECFDF5',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  vipBalanceLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#065F46',
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
    color: '#047857',
    letterSpacing: -0.5,
  },
  vipCurrency: {
    fontSize: 14,
    fontWeight: '700',
    color: '#065F46',
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
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  vipPointPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065F46',
  },
  vipInstantPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  vipInstantPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
  },
  vipMetricsGrid: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
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
    color: '#1E293B',
  },
  vipMetricSub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  vipMetricValueOrange: {
    fontSize: 14,
    fontWeight: '800',
    color: '#EA580C',
  },
  vipMetricSubOrange: {
    fontSize: 10,
    color: '#C2410C',
    marginTop: 1,
  },
  vipMetricValueGold: {
    fontSize: 14,
    fontWeight: '800',
    color: '#D97706',
  },
  vipMetricSubGold: {
    fontSize: 10,
    color: '#B45309',
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
    backgroundColor: '#059669',
    paddingVertical: 13,
    borderRadius: 12,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  vipWithdrawActionBtnDisabled: {
    backgroundColor: '#F1F5F9',
    borderColor: '#CBD5E1',
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
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  vipFooterNoteText: {
    fontSize: 11,
    color: '#92400E',
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
    backgroundColor: '#FFFBEB',
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
    color: '#B45309',
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
    color: '#D97706',
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
    borderColor: '#FDE68A',
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
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
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
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
    backgroundColor: '#FEF3C7',
    borderColor: '#D97706',
  },
  quickPercentText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  quickPercentTextActive: {
    color: '#B45309',
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
    backgroundColor: '#FFFBEB',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 8,
  },
  advanceWarningTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 2,
  },
  advanceWarningDesc: {
    fontSize: 10,
    color: '#B45309',
    lineHeight: 14,
  },
  directPayoutNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFBEB',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginVertical: 10,
  },
  directPayoutTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 2,
  },
  directPayoutDesc: {
    fontSize: 11,
    color: '#B45309',
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
    borderColor: '#FEF3C7',
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
    backgroundColor: '#FFFBEB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  disabledTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#92400E',
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
    color: '#B45309',
    textAlign: 'center',
    backgroundColor: '#FFFBEB',
    padding: 10,
    borderRadius: 8,
    lineHeight: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  refreshBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#92400E',
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
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  packageCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#FEF3C7',
    marginBottom: 10,
    gap: 8,
  },
  pkgIconBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
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
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  packageTotalPoints: {
    fontSize: 13,
    fontWeight: '800',
    color: '#B45309',
  },
  packageTotalCash: {
    fontSize: 10,
    fontWeight: '600',
    color: '#78350F',
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
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
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
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
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
    color: '#92400E',
  },
  packageBottomSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#FEF3C7',
    backgroundColor: '#FFFDF5',
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
    color: '#D97706',
  },
  pkgSummaryDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#FDE68A',
  },
  horizontalTrackerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 8,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
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
    backgroundColor: '#EE4D2D',
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
    backgroundColor: '#EE4D2D',
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
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 2,
    textAlign: 'center',
  },
  trackNodeDate: {
    fontSize: 10,
    color: '#94A3B8',
    marginBottom: 4,
  },
  trackNodePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackPillWithdrawn: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  trackPillUnlocked: {
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  trackPillLocked: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  trackPillUpcoming: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  trackNodePillText: {
    fontSize: 9,
    fontWeight: '700',
    textAlign: 'center',
  },
  trackPillTextWithdrawn: {
    color: '#DC2626',
  },
  trackPillTextUnlocked: {
    color: '#EE4D2D',
  },
  trackPillTextUpcoming: {
    color: '#B45309',
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
    borderColor: '#FEF3C7',
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
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
    borderRadius: 19,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  countdownCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  countdownCardSubtitle: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 1,
  },
  countdownTargetPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  countdownTargetPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#92400E',
  },
  countdownBoxesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFBEB',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  countdownBox: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    minWidth: 54,
    borderWidth: 1,
    borderColor: '#FDE68A',
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  countdownBoxNum: {
    fontSize: 18,
    fontWeight: '900',
    color: '#B45309',
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
    color: '#D97706',
    marginTop: -8,
  },
  timelineProgressSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
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
    color: '#D97706',
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
    backgroundColor: '#D97706',
    borderRadius: 4,
  },
  timelinePointerPin: {
    position: 'absolute',
    top: -3,
    marginLeft: -7,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FEF3C7',
    borderWidth: 2,
    borderColor: '#D97706',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelinePointerDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D97706',
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
    color: '#334155',
    fontWeight: '500',
  },
  timelineFooterBold: {
    fontWeight: '800',
    color: '#059669',
  },
  countdownAllUnlockedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#D1FAE5',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
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
    borderRadius: 21,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  allUnlockedTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#065F46',
  },
  allUnlockedSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 16,
  },
  allUnlockedTrack: {
    height: 6,
    backgroundColor: '#A7F3D0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  allUnlockedFill: {
    width: '100%',
    height: '100%',
    backgroundColor: '#059669',
  },
});
