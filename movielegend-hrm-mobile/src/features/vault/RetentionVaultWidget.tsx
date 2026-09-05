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
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerTitleGroup}>
          <Ionicons name="gift-sharp" size={24} color="#D97706" />
          <Text style={styles.cardTitle}>Ví Thưởng Giữ Chân & Tết {new Date().getFullYear()}</Text>
        </View>
        <View style={styles.badgeOptIn}>
          <Text style={styles.badgeOptInText}>Đặc Quyền Nhân Tài</Text>
        </View>
      </View>

      <Text style={styles.subSubtitle}>
        Tổng Quỹ Cam Kết Năm: <Text style={styles.boldText}>{stats.totalGrantedPoints.toLocaleString('vi-VN')} điểm</Text> ({totalGrantedCash.toLocaleString('vi-VN')} VNĐ)
      </Text>

      {/* Balance Summary Grid */}
      <View style={styles.balanceGrid}>
        {/* 1. Unlocked & Ready to Withdraw */}
        <View style={[styles.balanceBox, styles.unlockedBox]}>
          <View style={styles.boxHeaderRow}>
            <Ionicons name="lock-open-outline" size={18} color="#059669" />
            <Text style={styles.boxLabelUnlocked}>Khả Dụng Tức Thì</Text>
          </View>
          <Text style={styles.unlockedAmountText}>
            {unlockedCash.toLocaleString('vi-VN')} <Text style={styles.currencyUnit}>VNĐ</Text>
          </Text>
          <Text style={styles.unlockedPointSub}>{stats.unlockedPoints.toLocaleString('vi-VN')} điểm</Text>

          {stats.instantBonusPoints > 0 && (
            <View style={styles.instantTagBadge}>
              <MaterialCommunityIcons name="lightning-bolt" size={12} color="#059669" />
              <Text style={styles.instantTagText}>
                Gồm {stats.instantBonusPoints.toLocaleString('vi-VN')} đ thưởng nóng
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.withdrawBtn}
            onPress={openWithdrawModal}
            activeOpacity={0.8}
          >
            <Ionicons name="cash-outline" size={16} color="#FFFFFF" />
            <Text style={styles.withdrawBtnText}>Rút Tiền Ngay</Text>
          </TouchableOpacity>
        </View>

        {/* 2. Locked & Max Advance Limit */}
        <View style={[styles.balanceBox, styles.lockedBox]}>
          <View style={styles.boxHeaderRow}>
            <Ionicons name="shield-outline" size={18} color="#D97706" />
            <Text style={styles.boxLabelLocked}>Hạn Mức Tối Đa (Kèm ứng)</Text>
          </View>
          <Text style={styles.lockedAmountText}>
            {maxWithdrawableCash.toLocaleString('vi-VN')} <Text style={styles.currencyUnit}>VNĐ</Text>
          </Text>
          <Text style={styles.lockedPointSub}>{stats.maxWithdrawable.toLocaleString('vi-VN')} điểm</Text>
          <Text style={styles.vestingNote}>
            Cho phép ứng trước hạn mức từ các quý tương lai (ưu tiên trừ từ Q4).
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
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#FEF3C7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#92400E',
    flexShrink: 1,
  },
  badgeOptIn: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  badgeOptInText: {
    color: '#B45309',
    fontSize: 10,
    fontWeight: '700',
  },
  subSubtitle: {
    fontSize: 13,
    color: '#475569',
    marginBottom: 14,
  },
  boldText: {
    fontWeight: '700',
    color: '#0F172A',
  },
  balanceGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  balanceBox: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
  },
  unlockedBox: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  lockedBox: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  boxHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  boxLabelUnlocked: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065F46',
  },
  boxLabelLocked: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
  },
  unlockedAmountText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#059669',
  },
  lockedAmountText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#D97706',
  },
  currencyUnit: {
    fontSize: 10,
    fontWeight: '500',
  },
  unlockedPointSub: {
    fontSize: 11,
    color: '#047857',
    marginTop: 1,
    marginBottom: 6,
  },
  lockedPointSub: {
    fontSize: 11,
    color: '#B45309',
    marginTop: 1,
  },
  instantTagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 8,
  },
  instantTagText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#065F46',
  },
  withdrawBtn: {
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 7,
    borderRadius: 8,
    marginTop: 4,
  },
  withdrawBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  vestingNote: {
    fontSize: 10,
    color: '#92400E',
    marginTop: 4,
    lineHeight: 14,
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
