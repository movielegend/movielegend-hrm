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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface RetentionVaultWidgetProps {
  isVaultEnabled: boolean;
  totalGrantedPoints?: number;
  unlockedPoints?: number;
  lockedPoints?: number;
  cashValuePerPoint?: number;
  onRequestWithdrawal?: (amount: number, bankName: string, bankAccount: string, accountName: string) => void;
}

export const RetentionVaultWidget: React.FC<RetentionVaultWidgetProps> = ({
  isVaultEnabled,
  totalGrantedPoints = 50000,
  unlockedPoints = 12500,
  lockedPoints = 37500,
  cashValuePerPoint = 1000,
  onRequestWithdrawal,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [bankName, setBankName] = useState('Techcombank');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');

  if (!isVaultEnabled) {
    return null; // Opt-in Feature: Hidden if disabled for current user
  }

  const unlockedCash = unlockedPoints * cashValuePerPoint;
  const lockedCash = lockedPoints * cashValuePerPoint;

  const handleWithdrawSubmit = () => {
    if (!accountNumber.trim() || !accountName.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ Số tài khoản và Tên chủ tài khoản!');
      return;
    }
    if (onRequestWithdrawal) {
      onRequestWithdrawal(unlockedCash, bankName, accountNumber, accountName);
    }
    Alert.alert(
      'Gửi Yêu Cầu Rút Tiền Thành Công!',
      `Yêu cầu rút ${unlockedCash.toLocaleString('vi-VN')} VNĐ đã được gửi cho Kế toán phê duyệt.`,
      [{ text: 'Đóng', onPress: () => setModalVisible(false) }]
    );
  };

  return (
    <View style={styles.cardContainer}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerTitleGroup}>
          <Ionicons name="gift-sharp" size={24} color="#D97706" />
          <Text style={styles.cardTitle}>Ví Thưởng Giữ Chân Nhân Tài</Text>
        </View>
        <View style={styles.badgeOptIn}>
          <Text style={styles.badgeOptInText}>Đặc Quyền Cốt Cán</Text>
        </View>
      </View>

      <Text style={styles.subSubtitle}>
        Tổng Quỹ Thưởng Năm: <Text style={styles.boldText}>{totalGrantedPoints.toLocaleString('vi-VN')} điểm</Text> ({(totalGrantedPoints * cashValuePerPoint).toLocaleString('vi-VN')} VNĐ)
      </Text>

      {/* Balance Summary */}
      <View style={styles.balanceGrid}>
        {/* Unlocked */}
        <View style={[styles.balanceBox, styles.unlockedBox]}>
          <View style={styles.boxHeaderRow}>
            <Ionicons name="lock-open-outline" size={18} color="#059669" />
            <Text style={styles.boxLabelUnlocked}>Đã Mở Khóa (Khả Dụng)</Text>
          </View>
          <Text style={styles.unlockedAmountText}>
            {unlockedCash.toLocaleString('vi-VN')} <Text style={styles.currencyUnit}>VNĐ</Text>
          </Text>
          <Text style={styles.unlockedPointSub}>{unlockedPoints.toLocaleString('vi-VN')} điểm</Text>
          
          <TouchableOpacity
            style={styles.withdrawBtn}
            onPress={() => setModalVisible(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="cash-outline" size={16} color="#FFFFFF" />
            <Text style={styles.withdrawBtnText}>Rút Tiền Về Ngân Hàng</Text>
          </TouchableOpacity>
        </View>

        {/* Locked */}
        <View style={[styles.balanceBox, styles.lockedBox]}>
          <View style={styles.boxHeaderRow}>
            <Ionicons name="lock-closed-outline" size={18} color="#D97706" />
            <Text style={styles.boxLabelLocked}>Đang Khóa (Vesting)</Text>
          </View>
          <Text style={styles.lockedAmountText}>
            {lockedCash.toLocaleString('vi-VN')} <Text style={styles.currencyUnit}>VNĐ</Text>
          </Text>
          <Text style={styles.lockedPointSub}>{lockedPoints.toLocaleString('vi-VN')} điểm</Text>
          <Text style={styles.vestingNote}>Mở khóa 25%/Quý vào cuối Q2, Q3, Q4</Text>
        </View>
      </View>

      {/* Vesting Milestone Timeline */}
      <View style={styles.milestoneContainer}>
        <Text style={styles.milestoneTitle}>Lịch Mở Khóa Thưởng Theo Quý (25%/Quý):</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.milestoneScroll}>
          <View style={[styles.milestoneItem, styles.milestonePassed]}>
            <Text style={styles.milestoneQuarter}>Quý 1 (31/03)</Text>
            <Ionicons name="checkmark-circle" size={20} color="#059669" />
            <Text style={styles.milestoneStatus}>Đã mở khóa 25%</Text>
          </View>
          <View style={styles.milestoneItem}>
            <Text style={styles.milestoneQuarter}>Quý 2 (30/06)</Text>
            <Ionicons name="time-outline" size={20} color="#D97706" />
            <Text style={styles.milestoneStatus}>Chờ mở 12.5tr</Text>
          </View>
          <View style={styles.milestoneItem}>
            <Text style={styles.milestoneQuarter}>Quý 3 (30/09)</Text>
            <Ionicons name="time-outline" size={20} color="#D97706" />
            <Text style={styles.milestoneStatus}>Chờ mở 12.5tr</Text>
          </View>
          <View style={styles.milestoneItem}>
            <Text style={styles.milestoneQuarter}>Quý 4 (31/12)</Text>
            <Ionicons name="time-outline" size={20} color="#D97706" />
            <Text style={styles.milestoneStatus}>Chờ mở 12.5tr</Text>
          </View>
        </ScrollView>
      </View>

      {/* Modal Withdrawal Form */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Yêu Cầu Rút Tiền Thưởng</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSub}>
              Số tiền khả dụng rút: <Text style={{ color: '#059669', fontWeight: 'bold' }}>{unlockedCash.toLocaleString('vi-VN')} VNĐ</Text>
            </Text>

            <Text style={styles.inputLabel}>Ngân hàng thụ hưởng:</Text>
            <TextInput
              style={styles.input}
              value={bankName}
              onChangeText={setBankName}
              placeholder="Nhập tên ngân hàng (TCB, VCB...)"
            />

            <Text style={styles.inputLabel}>Số tài khoản ngân hàng:</Text>
            <TextInput
              style={styles.input}
              value={accountNumber}
              onChangeText={setAccountNumber}
              placeholder="Nhập số tài khoản..."
              keyboardType="number-pad"
            />

            <Text style={styles.inputLabel}>Tên chủ tài khoản (In hoa):</Text>
            <TextInput
              style={styles.input}
              value={accountName}
              onChangeText={setAccountName}
              placeholder="NGUYEN VAN A"
              autoCapitalize="characters"
            />

            <TouchableOpacity style={styles.submitWithdrawBtn} onPress={handleWithdrawSubmit}>
              <Text style={styles.submitWithdrawText}>XÁC NHẬN RÚT {unlockedCash.toLocaleString('vi-VN')} VNĐ</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#FEF3C7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#92400E',
  },
  badgeOptIn: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeOptInText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#B45309',
  },
  subSubtitle: {
    fontSize: 12,
    color: '#4B5563',
    marginTop: 6,
    marginBottom: 12,
  },
  boldText: {
    fontWeight: 'bold',
    color: '#1F2937',
  },
  balanceGrid: {
    gap: 10,
  },
  balanceBox: {
    padding: 12,
    borderRadius: 8,
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
  },
  boxLabelUnlocked: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#047857',
  },
  boxLabelLocked: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#B45309',
  },
  unlockedAmountText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#059669',
    marginTop: 4,
  },
  lockedAmountText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#D97706',
    marginTop: 4,
  },
  currencyUnit: {
    fontSize: 14,
    fontWeight: 'normal',
  },
  unlockedPointSub: {
    fontSize: 12,
    color: '#059669',
    marginTop: 2,
  },
  lockedPointSub: {
    fontSize: 12,
    color: '#D97706',
    marginTop: 2,
  },
  withdrawBtn: {
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 6,
    marginTop: 10,
  },
  withdrawBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  vestingNote: {
    fontSize: 11,
    color: '#92400E',
    fontStyle: 'italic',
    marginTop: 6,
  },
  milestoneContainer: {
    marginTop: 14,
  },
  milestoneTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
  },
  milestoneScroll: {
    flexDirection: 'row',
  },
  milestoneItem: {
    backgroundColor: '#F3F4F6',
    padding: 10,
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
    minWidth: 110,
  },
  milestonePassed: {
    backgroundColor: '#D1FAE5',
  },
  milestoneQuarter: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  milestoneStatus: {
    fontSize: 10,
    color: '#4B5563',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  modalSub: {
    fontSize: 13,
    color: '#4B5563',
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 8,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  submitWithdrawBtn: {
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  submitWithdrawText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
