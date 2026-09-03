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
import { useEmployees } from '../../hooks/useEmployees';

export interface UserOptInVaultItem {
  id: string;
  name: string;
  department: string;
  isRewardVaultEnabled: boolean;
  grantedPoints: number;
}

export const AdminOptInVaultScreen: React.FC = () => {
  const { data: realEmpData, isLoading } = useEmployees({ limit: 100 });
  const realEmpList = realEmpData?.data || realEmpData?.items || (Array.isArray(realEmpData) ? realEmpData : []);

  const [users, setUsers] = useState<UserOptInVaultItem[]>([]);
  const [grantingUser, setGrantingUser] = useState<UserOptInVaultItem | null>(null);
  const [pointsToGrant, setPointsToGrant] = useState('50000');

  useEffect(() => {
    if (realEmpList.length > 0) {
      setUsers(
        realEmpList.map((emp: any) => ({
          id: emp.id || emp._id,
          name: emp.fullName || emp.userCode || 'Nhân viên',
          department: emp.department?.name || 'Văn phòng',
          isRewardVaultEnabled: Boolean(emp.isRewardVaultEnabled),
          grantedPoints: emp.grantedPoints || 0,
        }))
      );
    }
  }, [realEmpData]);

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
        
        {/* Executive Header Card */}
        <View style={styles.executiveHeaderCard}>
          <Text style={styles.executiveBadgeTitle}>ADMIN CONTROL CENTER</Text>
          <Text style={styles.title}>Quản Lý Cấp Quyền Ví Thưởng Tết</Text>
          <Text style={styles.sub}>Kích hoạt tính năng Opt-in & Cấp Quỹ Thưởng Giữ Chân Nhân Tài</Text>
        </View>

        <Text style={styles.sectionHeaderTitle}>DANH SÁCH NHÂN SỰ CỐT CÁN:</Text>

        {users.map((u) => (
          <View key={u.id} style={styles.userCard}>
            <View style={styles.userHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.userName}>{u.name}</Text>
                <Text style={styles.userDept}>{u.department}</Text>
              </View>

              <View style={styles.toggleGroup}>
                <Text style={styles.toggleLabel}>Quyền Ví Điểm:</Text>
                <Switch
                  value={u.isRewardVaultEnabled}
                  onValueChange={() => handleToggleVault(u.id, u.isRewardVaultEnabled)}
                  trackColor={{ false: '#CBD5E1', true: '#A7F3D0' }}
                  thumbColor={u.isRewardVaultEnabled ? '#059669' : '#64748B'}
                />
              </View>
            </View>

            {u.isRewardVaultEnabled ? (
              <View style={styles.vaultActiveBox}>
                <Text style={styles.vaultActiveText}>
                  Quỹ thưởng năm: <Text style={{ fontWeight: 'bold' }}>{u.grantedPoints.toLocaleString('vi-VN')} điểm</Text> ({(u.grantedPoints * 1000).toLocaleString('vi-VN')} VNĐ)
                </Text>
                <TouchableOpacity style={styles.grantBtn} onPress={() => { setGrantingUser(u); setPointsToGrant(String(u.grantedPoints || 50000)); }}>
                  <Text style={styles.grantBtnText}>Điều chỉnh Quỹ</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.vaultDisabledBox}>
                <Text style={styles.vaultDisabledText}>Chưa bật đặc quyền Ví Điểm Tết</Text>
                <TouchableOpacity style={styles.enableBtn} onPress={() => { setGrantingUser(u); setPointsToGrant('50000'); }}>
                  <Text style={styles.enableBtnText}>Bật & Cấp Quỹ</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Grant Points Modal */}
      <Modal visible={grantingUser !== null} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Cấp Quỹ Thưởng Giữ Chân</Text>
              <TouchableOpacity onPress={() => setGrantingUser(null)}>
                <Text style={{ fontSize: 18, color: '#64748B', fontWeight: 'bold' }}>✕</Text>
              </TouchableOpacity>
            </View>

            {grantingUser && (
              <View>
                <Text style={styles.modalSub}>Nhân sự: <Text style={{ fontWeight: 'bold', color: '#0F172A' }}>{grantingUser.name}</Text></Text>

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
    backgroundColor: '#F8FAFC',
  },
  scroll: {
    padding: 16,
  },
  executiveHeaderCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  executiveBadgeTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#94A3B8',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  sub: {
    fontSize: 12,
    color: '#CBD5E1',
    lineHeight: 16,
  },
  sectionHeaderTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#64748B',
    letterSpacing: 0.8,
    marginTop: 4,
    marginBottom: 10,
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  userHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  userName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  userDept: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  toggleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  toggleLabel: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '500',
  },
  vaultActiveBox: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    padding: 10,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  vaultActiveText: {
    fontSize: 12,
    color: '#047857',
    flex: 1,
  },
  grantBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
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
    backgroundColor: '#F1F5F9',
    padding: 10,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  vaultDisabledText: {
    fontSize: 12,
    color: '#64748B',
    flex: 1,
  },
  enableBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#059669',
  },
  enableBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
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
    color: '#0F172A',
  },
  modalSub: {
    fontSize: 13,
    color: '#475569',
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#334155',
    marginTop: 8,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  cashPreviewText: {
    fontSize: 13,
    color: '#334155',
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
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  submitGrantText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
});
