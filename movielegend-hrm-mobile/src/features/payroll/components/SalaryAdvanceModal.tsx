import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CustomAlert } from '../../../components/CustomAlert';
import { createEmployeeRequest } from '../../../api/employee-requests.api';
import { useAuth } from '../../../providers/AuthProvider';

interface Props {
  visible: boolean;
  onClose: () => void;
  month: number;
  year: number;
  baseSalary: number;
  maxAdvanceLimit: number;
  currentMonthAdvancedAmount: number;
  remainingAdvanceLimit: number;
  onSuccess: () => void;
}

const COMMON_BANKS = [
  'Vietcombank',
  'MBBank',
  'Techcombank',
  'ACB',
  'VPBank',
  'BIDV',
  'VietinBank',
  'TPBank',
  'Sacombank',
  'VIB',
];

export function SalaryAdvanceModal({
  visible,
  onClose,
  month,
  year,
  baseSalary,
  maxAdvanceLimit,
  currentMonthAdvancedAmount,
  remainingAdvanceLimit,
  onSuccess,
}: Props) {
  const { user } = useAuth();

  const [rawAmount, setRawAmount] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [bankName, setBankName] = useState<string>('');
  const [bankAccount, setBankAccount] = useState<string>('');
  const [accountHolder, setAccountHolder] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pre-fill user profile info if available
  useEffect(() => {
    if (visible && user) {
      const userMeta = (user as any)?.profile || user;
      if (userMeta?.fullName) {
        setAccountHolder(userMeta.fullName.toUpperCase());
      }
      if (userMeta?.bankName) {
        setBankName(userMeta.bankName);
      }
      if (userMeta?.bankAccountNumber || userMeta?.bankAccount) {
        setBankAccount(userMeta.bankAccountNumber || userMeta.bankAccount);
      }
    }
  }, [visible, user]);

  const parsedAmount = parseInt(rawAmount.replace(/\D/g, ''), 10) || 0;
  const isOverLimit = parsedAmount > remainingAdvanceLimit;
  const isZeroOrNegative = parsedAmount <= 0;
  const canSubmit = !isZeroOrNegative && !isOverLimit && reason.trim().length > 0 && bankAccount.trim().length > 0;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const handleAmountChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (!cleaned) {
      setRawAmount('');
      return;
    }
    const num = parseInt(cleaned, 10);
    setRawAmount(num.toLocaleString('vi-VN'));
  };

  const handleQuickPick = (amount: number) => {
    const validAmount = Math.min(amount, remainingAdvanceLimit);
    setRawAmount(validAmount.toLocaleString('vi-VN'));
  };

  const handleSubmit = async () => {
    if (parsedAmount <= 0) {
      CustomAlert.alert('Lỗi', 'Vui lòng nhập số tiền muốn tạm ứng');
      return;
    }

    if (parsedAmount > remainingAdvanceLimit) {
      CustomAlert.alert(
        'Vượt quá hạn mức',
        `Số tiền đề xuất (${formatCurrency(parsedAmount)}) vượt quá hạn mức tạm ứng còn lại (${formatCurrency(remainingAdvanceLimit)}). Quy định tối đa 50% lương.`
      );
      return;
    }

    if (!reason.trim()) {
      CustomAlert.alert('Thiếu thông tin', 'Vui lòng nhập lý do tạm ứng lương');
      return;
    }

    if (!bankAccount.trim()) {
      CustomAlert.alert('Thiếu thông tin', 'Vui lòng nhập số tài khoản nhận tiền');
      return;
    }

    setIsSubmitting(true);
    try {
      await createEmployeeRequest({
        type: 'ADVANCE' as any,
        title: `[TẠM ỨNG LƯƠNG] Đề xuất tạm ứng lương tháng ${month}/${year}`,
        content: reason.trim(),
        amount: parsedAmount,
        attachmentMetadata: {
          month,
          year,
          baseSalary,
          maxAdvanceLimit,
          remainingAdvanceLimit,
          bankName: bankName.trim() || 'Ngân hàng',
          bankAccount: bankAccount.trim(),
          accountHolder: accountHolder.trim(),
          requestTypeCategory: 'SALARY_ADVANCE_50_PERCENT',
        },
      });

      CustomAlert.alert(
        'Thành công',
        `Đã gửi đề xuất tạm ứng lương ${formatCurrency(parsedAmount)} thành công! Đơn sẽ được chuyển đến Trưởng bộ phận duyệt trước khi Kế toán trưởng chi lương.`,
        [
          {
            text: 'Đồng ý',
            onPress: () => {
              onClose();
              onSuccess();
            },
          },
        ]
      );
    } catch (err: any) {
      CustomAlert.alert('Lỗi', err.message || 'Không thể tạo đơn tạm ứng lương');
    } finally {
      setIsSubmitting(false);
    }
  };

  const usedPercentage = maxAdvanceLimit > 0
    ? Math.min(100, Math.round((currentMonthAdvancedAmount / maxAdvanceLimit) * 100))
    : 0;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerLeft}>
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons name="cash-fast" size={22} color="#059669" />
              </View>
              <View>
                <Text style={styles.modalTitle}>Tạm Ứng Lương</Text>
                <Text style={styles.modalSubTitle}>Tháng {month} / {year} • Tối đa 50% lương</Text>
              </View>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={10}>
              <MaterialCommunityIcons name="close" size={20} color="#64748B" />
            </Pressable>
          </View>

          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {/* Limit Banner Card */}
            <View style={styles.limitCard}>
              <View style={styles.limitCardHeader}>
                <MaterialCommunityIcons name="shield-check-outline" size={18} color="#059669" />
                <Text style={styles.limitCardTitle}>Hạn mức tạm ứng (Quy định 50% Lương)</Text>
              </View>

              <View style={styles.limitGrid}>
                <View style={styles.limitGridItem}>
                  <Text style={styles.gridItemLabel}>Lương cơ sở</Text>
                  <Text style={styles.gridItemVal}>{formatCurrency(baseSalary)}</Text>
                </View>
                <View style={styles.limitGridItem}>
                  <Text style={styles.gridItemLabel}>Hạn mức 50%</Text>
                  <Text style={[styles.gridItemVal, { color: '#059669' }]}>
                    {formatCurrency(maxAdvanceLimit)}
                  </Text>
                </View>
                <View style={styles.limitGridItem}>
                  <Text style={styles.gridItemLabel}>Đã ứng tháng này</Text>
                  <Text style={[styles.gridItemVal, { color: '#D97706' }]}>
                    {formatCurrency(currentMonthAdvancedAmount)}
                  </Text>
                </View>
                <View style={styles.limitGridItem}>
                  <Text style={styles.gridItemLabel}>Khả dụng còn lại</Text>
                  <Text style={[styles.gridItemVal, { color: '#2563EB', fontWeight: '800' }]}>
                    {formatCurrency(remainingAdvanceLimit)}
                  </Text>
                </View>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressWrap}>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressBar, { width: `${usedPercentage}%` }]} />
                </View>
                <Text style={styles.progressText}>Đã dùng {usedPercentage}% hạn mức tháng này</Text>
              </View>
            </View>

            {/* Workflow 3-Steps Visual */}
            <View style={styles.workflowBox}>
              <Text style={styles.workflowBoxTitle}>Quy trình xét duyệt tạm ứng 3 bước:</Text>
              <View style={styles.stepsRow}>
                <View style={styles.stepCol}>
                  <View style={[styles.stepCircle, styles.stepCircleActive]}>
                    <Text style={styles.stepNum}>1</Text>
                  </View>
                  <Text style={styles.stepName}>Đề xuất</Text>
                  <Text style={styles.stepSub}>Nhân viên (Max 50%)</Text>
                </View>
                <View style={styles.stepLine} />
                <View style={styles.stepCol}>
                  <View style={styles.stepCircle}>
                    <Text style={styles.stepNum}>2</Text>
                  </View>
                  <Text style={styles.stepName}>Duyệt</Text>
                  <Text style={styles.stepSub}>Leader bộ phận</Text>
                </View>
                <View style={styles.stepLine} />
                <View style={styles.stepCol}>
                  <View style={[styles.stepCircle, { backgroundColor: '#ECFDF5', borderColor: '#059669' }]}>
                    <Text style={[styles.stepNum, { color: '#059669' }]}>3</Text>
                  </View>
                  <Text style={styles.stepName}>Đi lương</Text>
                  <Text style={styles.stepSub}>Kế toán trưởng chi</Text>
                </View>
              </View>
            </View>

            {/* Amount Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Số tiền muốn tạm ứng <Text style={styles.reqStar}>*</Text>
              </Text>
              <View style={[styles.amountInputWrap, isOverLimit && styles.amountInputError]}>
                <TextInput
                  style={styles.amountInput}
                  value={rawAmount}
                  onChangeText={handleAmountChange}
                  placeholder="0"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                />
                <Text style={styles.amountUnit}>VNĐ</Text>
              </View>

              {isOverLimit && (
                <View style={styles.errorRow}>
                  <MaterialCommunityIcons name="alert-circle" size={14} color="#DC2626" />
                  <Text style={styles.errorText}>
                    Vượt quá hạn mức còn lại ({formatCurrency(remainingAdvanceLimit)})
                  </Text>
                </View>
              )}

              {/* Quick Pick Chips */}
              <View style={styles.chipsRow}>
                {maxAdvanceLimit > 0 && (
                  <>
                    <Pressable
                      style={styles.chip}
                      onPress={() => handleQuickPick(Math.floor(maxAdvanceLimit * 0.5))}
                    >
                      <Text style={styles.chipText}>25% Lương</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.chip, styles.chipMax]}
                      onPress={() => handleQuickPick(remainingAdvanceLimit)}
                    >
                      <Text style={styles.chipTextMax}>Tối đa (50%)</Text>
                    </Pressable>
                  </>
                )}
                <Pressable style={styles.chip} onPress={() => handleQuickPick(1000000)}>
                  <Text style={styles.chipText}>1.000.000đ</Text>
                </Pressable>
                <Pressable style={styles.chip} onPress={() => handleQuickPick(2000000)}>
                  <Text style={styles.chipText}>2.000.000đ</Text>
                </Pressable>
                <Pressable style={styles.chip} onPress={() => handleQuickPick(5000000)}>
                  <Text style={styles.chipText}>5.000.000đ</Text>
                </Pressable>
              </View>
            </View>

            {/* Reason */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Lý do tạm ứng <Text style={styles.reqStar}>*</Text>
              </Text>
              <TextInput
                style={styles.textArea}
                value={reason}
                onChangeText={setReason}
                placeholder="Ví dụ: Tạm ứng giải quyết việc gia đình, khám sức khỏe..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* Bank Info Header */}
            <View style={styles.sectionHeaderRow}>
              <MaterialCommunityIcons name="bank-transfer" size={20} color="#059669" />
              <Text style={styles.sectionHeaderTitle}>Tài khoản nhận tiền (Kế toán chi lương)</Text>
            </View>

            {/* Bank Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Ngân hàng thụ hưởng</Text>
              <TextInput
                style={styles.textInput}
                value={bankName}
                onChangeText={setBankName}
                placeholder="Ví dụ: Vietcombank, MBBank, Techcombank..."
                placeholderTextColor="#94A3B8"
              />

              {/* Bank quick chips */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bankChipsScroll}>
                {COMMON_BANKS.map((b) => (
                  <Pressable
                    key={b}
                    style={[styles.bankChip, bankName === b && styles.bankChipActive]}
                    onPress={() => setBankName(b)}
                  >
                    <Text style={[styles.bankChipText, bankName === b && styles.bankChipTextActive]}>
                      {b}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            {/* Account Number & Account Holder */}
            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.inputLabel}>
                  Số tài khoản <Text style={styles.reqStar}>*</Text>
                </Text>
                <TextInput
                  style={styles.textInput}
                  value={bankAccount}
                  onChangeText={setBankAccount}
                  placeholder="0123456789"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1.2 }]}>
                <Text style={styles.inputLabel}>Tên chủ tài khoản</Text>
                <TextInput
                  style={styles.textInput}
                  value={accountHolder}
                  onChangeText={(t) => setAccountHolder(t.toUpperCase())}
                  placeholder="NGUYEN VAN A"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="characters"
                />
              </View>
            </View>

            <View style={{ height: 20 }} />
          </ScrollView>

          {/* Footer Action */}
          <View style={styles.modalFooter}>
            <Pressable style={styles.cancelBtn} onPress={onClose} disabled={isSubmitting}>
              <Text style={styles.cancelBtnText}>Hủy</Text>
            </Pressable>
            <Pressable
              style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={!canSubmit || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <MaterialCommunityIcons name="send-check" size={18} color="#fff" />
                  <Text style={styles.submitBtnText}>Gửi đề xuất tạm ứng</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '92%',
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubTitle: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBody: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  limitCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  limitCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  limitCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  limitGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  limitGridItem: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  gridItemLabel: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 4,
  },
  gridItemVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  progressWrap: {
    marginTop: 10,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#059669',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'right',
  },
  workflowBox: {
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    marginBottom: 16,
  },
  workflowBoxTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#166534',
    marginBottom: 8,
  },
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepCol: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#E2E8F0',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  stepCircleActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  stepNum: {
    fontSize: 11,
    fontWeight: '800',
    color: '#fff',
  },
  stepName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E293B',
  },
  stepSub: {
    fontSize: 9,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 1,
  },
  stepLine: {
    width: 20,
    height: 2,
    backgroundColor: '#CBD5E1',
    marginBottom: 14,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  reqStar: {
    color: '#DC2626',
  },
  amountInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    height: 52,
  },
  amountInputError: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  amountInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  amountUnit: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
    marginLeft: 8,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 5,
  },
  errorText: {
    fontSize: 11,
    color: '#DC2626',
    fontWeight: '600',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipMax: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  chipTextMax: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  textArea: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
    minHeight: 70,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    marginBottom: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  sectionHeaderTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    height: 46,
    fontSize: 14,
    color: '#0F172A',
  },
  bankChipsScroll: {
    marginTop: 8,
  },
  bankChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  bankChipActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#059669',
  },
  bankChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  bankChipTextActive: {
    color: '#059669',
    fontWeight: '700',
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  submitBtn: {
    flex: 2,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
