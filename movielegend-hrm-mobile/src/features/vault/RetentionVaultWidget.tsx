import React, { useState } from 'react';
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
import { getMyVault, withdrawVaultPoints } from '../../api/employees.api';
import type { MyVaultResponse, VestingMilestone, VaultTransaction } from '../../types/employee.types';

export interface RetentionVaultWidgetProps {
  isVaultEnabled?: boolean;
}

export const RetentionVaultWidget: React.FC<RetentionVaultWidgetProps> = () => {
  const queryClient = useQueryClient();
  const { data, isLoading, refetch } = useQuery<MyVaultResponse>({
    queryKey: ['my-vault'],
    queryFn: getMyVault,
  });

  const [modalVisible, setModalVisible] = useState(false);
  const [withdrawPointsInput, setWithdrawPointsInput] = useState('');
  const [bankName, setBankName] = useState('Techcombank');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [withdrawNote, setWithdrawNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        <Text style={styles.disabledTitle}>Ví Thưởng Chưa Được Kích Hoạt</Text>
        <Text style={styles.disabledDescription}>
          Tính năng Ví Thưởng Tết & Giữ Chân Nhân Tài là đặc quyền dành riêng cho nhân sự được phê duyệt. Tài khoản của bạn hiện chưa được mở quyền này.
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

  const vault = data?.vault;
  const stats = data?.stats || {
    totalGrantedPoints: 0,
    instantBonusPoints: 0,
    unlockedQuarterPoints: 0,
    lockedQuarterPoints: 0,
    unlockedPoints: 0,
    maxWithdrawable: 0,
    cashValuePerPoint: 1000,
  };

  const cashValuePerPoint = stats.cashValuePerPoint || 1000;
  const unlockedCash = stats.unlockedPoints * cashValuePerPoint;
  const maxWithdrawableCash = stats.maxWithdrawable * cashValuePerPoint;
  const instantCash = stats.instantBonusPoints * cashValuePerPoint;
  const totalGrantedCash = stats.totalGrantedPoints * cashValuePerPoint;

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
    if (!accountNumber.trim() || !accountName.trim() || !bankName.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ Số tài khoản, Ngân hàng và Tên chủ tài khoản!');
      return;
    }

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
        bankName: bankName.trim(),
        bankAccountNumber: accountNumber.trim(),
        bankAccountName: accountName.trim().toUpperCase(),
        note: withdrawNote.trim() || undefined,
      });

      await queryClient.invalidateQueries({ queryKey: ['my-vault'] });
      setModalVisible(false);

      Alert.alert(
        'Gửi Yêu Cầu Rút Tiền Thành Công! 💸',
        isAdvanceWithdrawal
          ? `Đã gửi yêu cầu rút ${cashToWithdraw.toLocaleString('vi-VN')} VNĐ (${pointsToWithdraw.toLocaleString('vi-VN')} điểm, bao gồm ứng trước ${advancePoints.toLocaleString('vi-VN')} điểm từ các quý tương lai). Kế toán sẽ phê duyệt chuyển khoản cho bạn sớm nhất!`
          : `Đã gửi yêu cầu rút ${cashToWithdraw.toLocaleString('vi-VN')} VNĐ (${pointsToWithdraw.toLocaleString('vi-VN')} điểm). Kế toán sẽ phê duyệt chuyển khoản cho bạn sớm nhất!`
      );
    } catch (err: any) {
      Alert.alert('Lỗi rút tiền', err?.response?.data?.message || err?.message || 'Không thể gửi yêu cầu rút tiền lúc này.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const milestones: VestingMilestone[] = vault?.milestones || [];
  const transactions: VaultTransaction[] = vault?.transactions || [];

  const now = new Date();
  const currentYear = new Date().getFullYear();
  const currentQuarterNum = Math.min(4, Math.floor(now.getMonth() / 3) + 1);

  const qMeta = [
    { q: 1, label: 'Quý 1', dateLabel: '31/03', unlockDate: new Date(currentYear, 2, 31), icon: 'handshake' },
    { q: 2, label: 'Quý 2', dateLabel: '30/06', unlockDate: new Date(currentYear, 5, 30), icon: 'trending-up' },
    { q: 3, label: 'Quý 3', dateLabel: '30/09', unlockDate: new Date(currentYear, 8, 30), icon: 'trophy-award' },
    { q: 4, label: 'Quý 4 (Tết)', dateLabel: '31/12', unlockDate: new Date(currentYear, 11, 31), icon: 'gift' },
  ];

  const quarterSteps = qMeta.map((qm) => {
    const found = milestones.find((m) => m.quarter === qm.q);
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

  const nextUpcomingQuarter = quarterSteps.find((s) => !s.isPastOrToday);
  const nextQuarterLabel = nextUpcomingQuarter
    ? `Dự kiến mở khóa Quý ${nextUpcomingQuarter.quarter}: ${nextUpcomingQuarter.dateLabel}`
    : `Đã hoàn tất mở khóa 4 Quý năm ${currentYear}`;

  const allWithdrawn = quarterSteps.every((s) => s.isWithdrawn);
  const trackerMainStatus = allWithdrawn
    ? 'Đã giải ngân trọn vẹn quỹ thưởng 🎉'
    : currentQuarterNum === 4
    ? 'Đích đến: Mở khóa Thưởng Tết! 🧧'
    : `Đang mở khóa đợt Quý ${currentQuarterNum}...`;

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
              <Text style={styles.vipHeroTitle}>Ví Thưởng Giữ Chân & Tết {currentYear}</Text>
              <Text style={styles.vipHeroSubtitle}>Đặc Quyền Nhân Tài Doanh Nghiệp</Text>
            </View>
          </View>
          <View style={styles.vipBadgeChip}>
            <MaterialCommunityIcons name="crown" size={13} color="#B45309" />
            <Text style={styles.vipBadgeChipText}>VIP</Text>
          </View>
        </View>

        {/* Main Available Balance Centerpiece */}
        <View style={styles.vipBalanceCenterpiece}>
          <Text style={styles.vipBalanceLabel}>SỐ DƯ KHẢ DỤNG TỨC THÌ</Text>
          <View style={styles.vipAmountRow}>
            <Text style={styles.vipAmountNumber}>{unlockedCash.toLocaleString('vi-VN')}</Text>
            <Text style={styles.vipCurrency}>VNĐ</Text>
          </View>
          <View style={styles.vipPillRow}>
            <View style={styles.vipPointPill}>
              <MaterialCommunityIcons name="star-four-points" size={12} color="#059669" />
              <Text style={styles.vipPointPillText}>{stats.unlockedPoints.toLocaleString('vi-VN')} điểm</Text>
            </View>
            {stats.instantBonusPoints > 0 && (
              <View style={styles.vipInstantPill}>
                <MaterialCommunityIcons name="lightning-bolt" size={12} color="#D97706" />
                <Text style={styles.vipInstantPillText}>
                  Đã gồm {stats.instantBonusPoints.toLocaleString('vi-VN')} đ thưởng nóng
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Sub-metrics: 2 Equal Columns */}
        <View style={styles.vipMetricsGrid}>
          <View style={styles.vipMetricCol}>
            <Text style={styles.vipMetricLabel}>Tổng Quỹ Cam Kết Năm</Text>
            <Text style={styles.vipMetricValue}>{totalGrantedCash.toLocaleString('vi-VN')} đ</Text>
            <Text style={styles.vipMetricSub}>{stats.totalGrantedPoints.toLocaleString('vi-VN')} điểm</Text>
          </View>
          <View style={styles.vipMetricDivider} />
          <View style={styles.vipMetricCol}>
            <Text style={styles.vipMetricLabel}>Hạn Mức Tối Đa (Kèm ứng)</Text>
            <Text style={styles.vipMetricValueGold}>{maxWithdrawableCash.toLocaleString('vi-VN')} đ</Text>
            <Text style={styles.vipMetricSubGold}>{stats.maxWithdrawable.toLocaleString('vi-VN')} điểm</Text>
          </View>
        </View>

        {/* Primary CTA Withdraw Button */}
        <TouchableOpacity
          style={styles.vipWithdrawActionBtn}
          onPress={openWithdrawModal}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons name="bank-transfer-out" size={20} color="#FFFFFF" />
          <Text style={styles.vipWithdrawActionText}>RÚT TIỀN VỀ TÀI KHOẢN NGÂN HÀNG</Text>
        </TouchableOpacity>

        {/* Advance Note Footer */}
        <View style={styles.vipFooterNote}>
          <MaterialCommunityIcons name="shield-check-outline" size={14} color="#92400E" />
          <Text style={styles.vipFooterNoteText}>
            Hệ thống hỗ trợ rút ứng trước từ các quý tương lai (ưu tiên khấu trừ từ Quý 4).
          </Text>
        </View>
      </View>

      {/* Shopee-style Vesting Delivery Stepper Tracker */}
      <View style={styles.shopeeTrackerCard}>
        {/* Top Header Row */}
        <View style={styles.shopeeHeaderRow}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text style={styles.shopeeEstTime}>{nextQuarterLabel}</Text>
            <Text style={styles.shopeeMainStatus}>{trackerMainStatus}</Text>
          </View>
          <View style={styles.shopeeAvatarCircle}>
            <MaterialCommunityIcons
              name="wallet-giftcard"
              size={28}
              color="#EE4D2D"
            />
          </View>
        </View>

        {/* Stepper Horizontal Progress Bar */}
        <View style={styles.stepperContainer}>
          {/* Icons & Connecting Lines Row */}
          <View style={styles.stepperIconsRow}>
            {quarterSteps.map((step, idx) => {
              const isPassed = step.isPastOrToday || step.isWithdrawn;
              const isCurrent = step.isCurrentActive;
              const hasNext = idx < quarterSteps.length - 1;

              const nextStep = quarterSteps[idx + 1];
              const lineFilled = nextStep ? nextStep.isPastOrToday || nextStep.isWithdrawn : false;
              const lineHalfFilled = isPassed && nextStep && !nextStep.isPastOrToday;

              return (
                <React.Fragment key={step.quarter}>
                  {/* Milestone Node Icon */}
                  <View style={styles.milestoneNodeCol}>
                    <View
                      style={[
                        styles.milestoneIconWrap,
                        step.isWithdrawn
                          ? styles.milestoneIconWithdrawn
                          : isPassed
                          ? styles.milestoneIconActive
                          : styles.milestoneIconInactive,
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={step.icon as any}
                        size={22}
                        color={
                          step.isWithdrawn
                            ? '#64748B'
                            : isPassed
                            ? '#EE4D2D'
                            : '#94A3B8'
                        }
                      />
                      {step.isWithdrawn && (
                        <View style={styles.checkedBadge}>
                          <MaterialCommunityIcons name="check" size={9} color="#FFFFFF" />
                        </View>
                      )}
                    </View>

                    {/* Active Step Pointer Arrow */}
                    <View style={styles.pointerSlot}>
                      {isCurrent ? (
                        <MaterialCommunityIcons name="chevron-down" size={18} color="#EE4D2D" />
                      ) : null}
                    </View>
                  </View>

                  {/* Connecting Line */}
                  {hasNext && (
                    <View style={styles.stepperLineWrapper}>
                      {lineFilled ? (
                        <View style={[styles.stepperLine, styles.stepperLineFull]} />
                      ) : lineHalfFilled ? (
                        <View style={styles.stepperLineHalfWrapper}>
                          <View style={[styles.stepperLineHalf, { backgroundColor: '#EE4D2D' }]} />
                          <View style={[styles.stepperLineHalf, { backgroundColor: '#E2E8F0' }]} />
                        </View>
                      ) : (
                        <View style={[styles.stepperLine, styles.stepperLineInactive]} />
                      )}
                    </View>
                  )}
                </React.Fragment>
              );
            })}
          </View>

          {/* Stepper Labels & Dates Row */}
          <View style={styles.stepperLabelsRow}>
            {quarterSteps.map((step) => {
              return (
                <View key={step.quarter} style={styles.stepperLabelCol}>
                  <Text
                    style={[
                      styles.stepperQuarterTitle,
                      step.isCurrentActive && styles.stepperQuarterTitleActive,
                    ]}
                    numberOfLines={1}
                  >
                    {step.quarter === 4 ? 'Q4 (Tết)' : `Quý ${step.quarter}`}
                  </Text>
                  <Text style={styles.stepperDateText}>{step.dateLabel}</Text>
                  <View
                    style={[
                      styles.stepperPointBadge,
                      step.isWithdrawn
                        ? styles.badgeWithdrawn
                        : step.isPastOrToday
                        ? styles.badgeUnlocked
                        : styles.badgeLocked,
                    ]}
                  >
                    <Text
                      style={[
                        styles.stepperPointBadgeText,
                        step.isWithdrawn
                          ? styles.badgeTextWithdrawn
                          : step.isPastOrToday
                          ? styles.badgeTextUnlocked
                          : styles.badgeTextLocked,
                      ]}
                      numberOfLines={1}
                    >
                      {step.isWithdrawn
                        ? 'Đã rút'
                        : `${step.points.toLocaleString('vi-VN')} đ`}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Milestone Detail Cards Horizontal Mini Bar */}
        <View style={styles.milestoneMiniSummary}>
          <View style={styles.miniSummaryItem}>
            <Text style={styles.miniSummaryLabel}>Đã mở khóa:</Text>
            <Text style={styles.miniSummaryValUnlocked}>
              {stats.unlockedPoints.toLocaleString('vi-VN')} đ
            </Text>
          </View>
          <View style={styles.miniSummaryDivider} />
          <View style={styles.miniSummaryItem}>
            <Text style={styles.miniSummaryLabel}>Chờ mở các quý sau:</Text>
            <Text style={styles.miniSummaryValLocked}>
              {stats.lockedQuarterPoints.toLocaleString('vi-VN')} đ
            </Text>
          </View>
        </View>
      </View>

      {/* Withdrawal Requests History */}
      {data?.withdrawalRequests && data.withdrawalRequests.length > 0 && (
        <View style={styles.withdrawalHistoryContainer}>
          <View style={styles.withdrawalHistoryHeader}>
            <MaterialCommunityIcons name="clipboard-text-clock-outline" size={18} color="#92400E" />
            <Text style={styles.withdrawalHistoryTitle}>Yêu Cầu Rút Tiền Đang Xử Lý & Gần Đây</Text>
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
              ? '💼 Chờ Kế toán chuyển tiền'
              : isPendingAdmin
              ? '⏳ Chờ Admin duyệt'
              : '❌ Đã từ chối (Đã hoàn điểm)';

            return (
              <View key={req.id} style={[styles.withdrawalReqCard, { borderColor: statusBorder }]}>
                <View style={styles.withdrawalReqTopRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.withdrawalReqAmount}>
                      {req.cashAmount.toLocaleString('vi-VN')} VNĐ
                    </Text>
                    <Text style={styles.withdrawalReqPoints}>
                      ({req.pointsWithdrawn.toLocaleString('vi-VN')} điểm)
                    </Text>
                  </View>
                  <View style={[styles.withdrawalStatusBadge, { backgroundColor: statusBg, borderColor: statusBorder }]}>
                    <Text style={[styles.withdrawalStatusText, { color: statusColor }]}>
                      {statusLabel}
                    </Text>
                  </View>
                </View>

                {/* Bank details summary */}
                <View style={styles.withdrawalBankRow}>
                  <MaterialCommunityIcons name="bank-outline" size={14} color="#64748B" />
                  <Text style={styles.withdrawalBankText}>
                    {req.bankName} • STK: <Text style={{ fontWeight: '700', color: '#1E293B' }}>{req.bankAccountNumber}</Text> ({req.bankAccountName})
                  </Text>
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
                <Text style={styles.modalTitle}>Yêu Cầu Rút Tiền Thưởng</Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 460 }}>
              {/* Point Input */}
              <Text style={styles.inputLabel}>Số điểm muốn rút (Tối đa {stats.maxWithdrawable.toLocaleString('vi-VN')} đ):</Text>
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
                  onPress={() => setWithdrawPointsInput(stats.maxWithdrawable.toString())}
                >
                  <Text style={styles.maxBtnText}>Rút hết</Text>
                </TouchableOpacity>
              </View>

              {/* Conversion Preview */}
              <View style={styles.conversionBox}>
                <Text style={styles.conversionFormula}>Quy đổi thành tiền:</Text>
                <Text style={styles.conversionTotal}>
                  {cashToWithdraw.toLocaleString('vi-VN')} VNĐ
                </Text>
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

              {/* Bank Inputs */}
              <Text style={styles.inputLabel}>Ngân hàng thụ hưởng:</Text>
              <TextInput
                style={styles.input}
                value={bankName}
                onChangeText={setBankName}
                placeholder="VD: Techcombank, Vietcombank, MB Bank..."
              />

              <Text style={styles.inputLabel}>Số tài khoản ngân hàng:</Text>
              <TextInput
                style={styles.input}
                value={accountNumber}
                onChangeText={setAccountNumber}
                placeholder="Nhập số tài khoản ngân hàng..."
                keyboardType="number-pad"
              />

              <Text style={styles.inputLabel}>Tên chủ tài khoản (In hoa không dấu):</Text>
              <TextInput
                style={styles.input}
                value={accountName}
                onChangeText={(v) => setAccountName(v.toUpperCase())}
                placeholder="NGUYEN VAN A"
                autoCapitalize="characters"
              />

              <Text style={styles.inputLabel}>Ghi chú rút tiền (Tùy chọn):</Text>
              <TextInput
                style={styles.input}
                value={withdrawNote}
                onChangeText={setWithdrawNote}
                placeholder="VD: Rút chi tiêu cá nhân, sắm Tết..."
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
                  XÁC NHẬN RÚT {cashToWithdraw.toLocaleString('vi-VN')} VNĐ
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
  vipWithdrawActionText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
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
  conversionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ECFDF5',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginBottom: 8,
  },
  conversionFormula: {
    fontSize: 12,
    fontWeight: '600',
    color: '#065F46',
  },
  conversionTotal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#059669',
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
});
