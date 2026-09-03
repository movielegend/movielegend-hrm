import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Alert,
  SafeAreaView,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface UserOptInVaultItem {
  id: string;
  name: string;
  department: string;
  isRewardVaultEnabled: boolean;
  grantedPoints: number;
}

export const AdminOptInVaultScreen: React.FC = () => {
  const [users, setUsers] = useState<UserOptInVaultItem[]>([
    { id: 'usr-1', name: 'Nguyễn Văn A', department: 'Livestream HCM', isRewardVaultEnabled: true, grantedPoints: 50000 },
    { id: 'usr-2', name: 'Trần Thị B', department: 'Livestream Hà Nội', isRewardVaultEnabled: true, grantedPoints: 30000 },
    { id: 'usr-3', name: 'Lê Văn C', department: 'Kho & Tài sản', isRewardVaultEnabled: false, grantedPoints: 0 },
    { id: 'usr-4', name: 'Phạm Thị D', department: 'Nhân sự HR', isRewardVaultEnabled: false, grantedPoints: 0 },
  ]);

  const [grantingUser, setGrantingUser] = useState<UserOptInVaultItem | null>(null);
  const [pointsToGrant, setPointsToGrant] = useState('50000');

  const handleToggleVault = (id: string, currentValue: boolean) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, isRewardVaultEnabled: !currentValue } : u))
    );
    Alert.alert(
      'Cập Nhật Cấp Quyền Ví Điểm',
      `Đã ${!currentValue ? 'BẬT đặc quyền Ví Điểm Thưởng Tết' : 'TẮT Ví Điểm Thưởng'} cho nhân sự!`
    );
  };

  const handleGrantPointsSubmit = () => {
    if (!grantingUser) return;
    const pts = Number(pointsToGrant) || 0;
    setUsers((prev) =>
      prev.map((u) => (u.id === grantingUser.id ? { ...u, grantedPoints: pts, isRewardVaultEnabled: true } : u))
    );
    Alert.alert(
      'Cấp Quỹ Thưởng Thành Công!',
      `Đã cấp Quỹ Thưởng Giữ Chân ${pts.toLocaleString('vi-VN')} điểm (${(pts * 1000).toLocaleString('vi-VN')} VNĐ) mở khóa 25%/Quý cho ${grantingUser.name}.`,
      [{ text: 'Đóng', onPress: () => setGrantingUser(null) }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Ionicons name="gift-sharp" size={26} color="#059669" />
          <View>
            <Text style={styles.title}>Bật/Tắt Ví Thưởng Tết Cá Nhân</Text>
            <Text style={styles.sub}>Đặc quyền Opt-in dành riêng cho Nhân sự Cốt cán</Text>
          </View>
        </View>

        {users.map((u) => (
          <View key={u.id} style={styles.userCard}>
            <View style={styles.userHeaderRow}>
              <View>
                <Text style={styles.userName}>{u.name}</Text>
                <Text style={styles.userDept}>{u.department}</Text>
              </View>

              <View style={styles.toggleGroup}>
                <Text style={styles.toggleLabel}>Quyền Ví Điểm:</Text>
                <Switch
                  value={u.isRewardVaultEnabled}
                  onValueChange={() => handleToggleVault(u.id, u.isRewardVaultEnabled)}
                  trackColor={{ false: '#D1D5DB', true: '#A7F3D0' }}
                  thumbColor={u.isRewardVaultEnabled ? '#059669' : '#9CA3AF'}
                />
              </View>
            </View>

            {u.isRewardVaultEnabled ? (
              <View style={styles.vaultActiveBox}>
                <Ionicons name="checkmark-circle" size={16} color="#059669" />
                <Text style={styles.vaultActiveText}>
                  Quỹ thưởng năm: <Text style={{ fontWeight: 'bold' }}>{u.grantedPoints.toLocaleString('vi-VN')} điểm</Text> ({(u.grantedPoints * 1000).toLocaleString('vi-VN')} VNĐ)
                </Text>
                <TouchableOpacity style={styles.grantBtn} onPress={() => { setGrantingUser(u); setPointsToGrant(String(u.grantedPoints || 50000)); }}>
                  <Ionicons name="add-circle-outline" size={14} color="#059669" />
                  <Text style={styles.grantBtnText}>Điều chỉnh Quỹ</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.vaultDisabledBox}>
                <Ionicons name="lock-closed" size={14} color="#6B7280" />
                <Text style={styles.vaultDisabledText}>Chưa bật đặc quyền Ví Điểm Tết</Text>
                <TouchableOpacity style={styles.enableBtn} onPress={() => { setGrantingUser(u); setPointsToGrant('50000'); }}>
                  <Text style={styles.enableBtnText}>Bật & Cấp Quỹ</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Grant Points Modal */}
      <Modal visible={grantingUser !== null} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Cấp Quỹ Thưởng Giữ Chân</Text>
              <TouchableOpacity onPress={() => setGrantingUser(null)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {grantingUser && (
              <View>
                <Text style={styles.modalSub}>Nhân sự: <Text style={{ fontWeight: 'bold', color: '#111827' }}>{grantingUser.name}</Text></Text>

                <Text style={styles.inputLabel}>Số điểm thưởng năm được cấp:</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="number-pad"
                  value={pointsToGrant}
                  onChangeText={setPointsToGrant}
                  placeholder="50000"
                />

                <Text style={styles.cashPreviewText}>
                  Tương đương: <Text style={{ color: '#059669', fontWeight: 'bold' }}>{((Number(pointsToGrant) || 0) * 1000).toLocaleString('vi-VN')} VNĐ</Text>
                </Text>
                <Text style={styles.vestingNotice}>• Số tiền được khóa & mở khóa dần 25%/Quý (Cuối Q1, Q2, Q3, Q4)</Text>

                <TouchableOpacity style={styles.submitGrantBtn} onPress={handleGrantPointsSubmit}>
                  <Text style={styles.submitGrantText}>XÁC NHẬN CẤP QUỸ THƯỞNG</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scroll: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  sub: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  userHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#111827',
  },
  userDept: {
    fontSize: 12,
    color: '#6B7280',
  },
  toggleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  toggleLabel: {
    fontSize: 11,
    color: '#4B5563',
  },
  vaultActiveBox: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    padding: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  vaultActiveText: {
    fontSize: 12,
    color: '#047857',
    flex: 1,
  },
  grantBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#059669',
  },
  grantBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#059669',
  },
  vaultDisabledBox: {
    backgroundColor: '#F3F4F6',
    padding: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  vaultDisabledText: {
    fontSize: 12,
    color: '#6B7280',
    flex: 1,
  },
  enableBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#059669',
  },
  enableBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFFFFF',
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
    marginBottom: 12,
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
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
  },
  cashPreviewText: {
    fontSize: 13,
    color: '#374151',
    marginTop: 8,
  },
  vestingNotice: {
    fontSize: 11,
    color: '#B45309',
    fontStyle: 'italic',
    marginTop: 4,
  },
  submitGrantBtn: {
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  submitGrantText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
});
