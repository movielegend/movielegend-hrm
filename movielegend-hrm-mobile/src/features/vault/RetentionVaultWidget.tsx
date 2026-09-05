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
    return null; // Opt-in Feature: Hidden if disabled for current user
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

      {/* Vesting Milestone Timeline */}
      <View style={styles.milestoneContainer}>
        <Text style={styles.milestoneTitle}>Lịch Mở Khóa Thưởng Theo Quý (25%/Quý):</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.milestoneScroll}>
          {milestones.length === 0 ? (
            <Text style={styles.emptySubText}>Chưa có lịch giải ngân mốc quý</Text>
          ) : (
            milestones.map((m) => {
              const unlockDate = new Date(m.unlockDate);
              const isPast = unlockDate <= new Date();
              const formattedDate = `${unlockDate.getDate().toString().padStart(2, '0')}/${(unlockDate.getMonth() + 1).toString().padStart(2, '0')}`;
              const cash = Number(m.cashAmount || m.pointsToUnlock * cashValuePerPoint);

              return (
                <View
                  key={m.id || m.quarter}
                  style={[
                    styles.milestoneItem,
                    m.isWithdrawn
                      ? styles.milestoneWithdrawn
                      : isPast
                      ? styles.milestonePassed
                      : styles.milestoneFuture,
                  ]}
                >
                  <Text style={styles.milestoneQuarter}>
                    Quý {m.quarter} ({formattedDate})
                  </Text>
                  <Ionicons
                    name={
                      m.isWithdrawn
                        ? 'checkmark-done-circle'
                        : isPast
                        ? 'lock-open-outline'
                        : 'time-outline'
                    }
                    size={20}
                    color={m.isWithdrawn ? '#64748B' : isPast ? '#059669' : '#D97706'}
                  />
                  <Text
                    style={[
                      styles.milestoneStatus,
                      { color: m.isWithdrawn ? '#64748B' : isPast ? '#059669' : '#B45309' },
                    ]}
                  >
                    {m.isWithdrawn
                      ? 'Đã rút'
                      : isPast
                      ? `Khả dụng: ${m.pointsToUnlock.toLocaleString('vi-VN')} đ`
                      : `${m.pointsToUnlock.toLocaleString('vi-VN')} đ (~${(cash / 1000000).toFixed(1)}tr)`}
                  </Text>
                </View>
              );
            })
          )}
        </ScrollView>
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
  milestoneContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  milestoneTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
  },
  milestoneScroll: {
    flexDirection: 'row',
  },
  milestoneItem: {
    width: 120,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4,
  },
  milestonePassed: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  milestoneWithdrawn: {
    backgroundColor: '#F1F5F9',
    borderColor: '#CBD5E1',
    opacity: 0.75,
  },
  milestoneFuture: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  milestoneQuarter: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E293B',
  },
  milestoneStatus: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 11,
    color: '#94A3B8',
    fontStyle: 'italic',
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
});
