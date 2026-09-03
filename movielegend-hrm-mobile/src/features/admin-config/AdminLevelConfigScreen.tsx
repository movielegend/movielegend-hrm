import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  SafeAreaView,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDepartments } from '../../hooks/useDepartments';

export interface AdminLevelItem {
  id: string;
  levelNumber: number;
  levelName: string;
  colorHex: string;
  rewardType: 'CASH' | 'PHYSICAL_ITEM' | 'HYBRID';
  promotionBonusAmount: number;
  physicalItemName: string;
  retentionFloorGmv: number;
  promotionCeilingGmv: number;
  retentionMultiplier: number;
}

export interface DepartmentProjectConfig {
  departmentId: string;
  departmentName: string;
  projectName: string;
  subTaskBullets: string[];
}

export const AdminLevelConfigScreen: React.FC = () => {
  const { data: realDeptData } = useDepartments({ limit: 100 });
  const realDeptList = realDeptData?.data || realDeptData?.items || [];

  const departments = realDeptList.length > 0
    ? realDeptList.map((d: any) => ({ id: d.id, name: d.name }))
    : [
        { id: 'dept-1', name: 'Livestream Hà Nội' },
        { id: 'dept-2', name: 'Livestream HCM' },
        { id: 'dept-3', name: 'HR Nhân sự' },
        { id: 'dept-4', name: 'Kho & Tài sản' },
        { id: 'dept-5', name: 'Chăm sóc Khách hàng CSKH' },
        { id: 'dept-6', name: 'Marketing' },
      ];

  const [selectedDeptId, setSelectedDeptId] = useState(departments[0]?.id || 'dept-1');

  const [deptProjects, setDeptProjects] = useState<Record<string, DepartmentProjectConfig>>({
    'dept-1': {
      departmentId: 'dept-1',
      departmentName: 'Livestream Hà Nội',
      projectName: 'Chiến Dịch Nâng Level Q3 - Bứt Phá Doanh Số 1 Tỷ',
      subTaskBullets: [
        '• Đảm nhận và dẫn chính 15 ca Livestream đỉnh điểm',
        '• Tối ưu Setup ánh sáng & kỹ thuật cho 20 phiên Live',
        '• Kịch bản chốt đơn tăng tỷ lệ chuyển đổi 25%',
      ],
    },
  });

  const [levels, setLevels] = useState<AdminLevelItem[]>([
    { id: 'lvl-1', levelNumber: 1, levelName: 'Thực tập / Thử việc', colorHex: '#9CA3AF', rewardType: 'CASH', promotionBonusAmount: 0, physicalItemName: 'Voucher Sinh nhật 200k', retentionFloorGmv: 0, promotionCeilingGmv: 50, retentionMultiplier: 1.0 },
    { id: 'lvl-2', levelNumber: 2, levelName: 'Chính thức', colorHex: '#2563EB', rewardType: 'HYBRID', promotionBonusAmount: 1000000, physicalItemName: 'Kỷ niệm chương chính thức', retentionFloorGmv: 30, promotionCeilingGmv: 150, retentionMultiplier: 1.1 },
    { id: 'lvl-3', levelNumber: 3, levelName: 'Senior Specialist', colorHex: '#0D9488', rewardType: 'HYBRID', promotionBonusAmount: 3000000, physicalItemName: 'Tai nghe Bluetooth Chống ồn', retentionFloorGmv: 80, promotionCeilingGmv: 300, retentionMultiplier: 1.25 },
    { id: 'lvl-4', levelNumber: 4, levelName: 'Key Member', colorHex: '#9333EA', rewardType: 'HYBRID', promotionBonusAmount: 5000000, physicalItemName: 'Máy tính bảng iPad Air / Màn 4K', retentionFloorGmv: 150, promotionCeilingGmv: 500, retentionMultiplier: 1.4 },
    { id: 'lvl-5', levelNumber: 5, levelName: 'Team Leader', colorHex: '#EA580C', rewardType: 'HYBRID', promotionBonusAmount: 8000000, physicalItemName: '💻 LAPTOP MACBOOK AIR M3', retentionFloorGmv: 250, promotionCeilingGmv: 820, retentionMultiplier: 1.6 },
    { id: 'lvl-6', levelNumber: 6, levelName: 'Manager Bộ Phận', colorHex: '#DC2626', rewardType: 'HYBRID', promotionBonusAmount: 15000000, physicalItemName: '💻 LAPTOP MACBOOK PRO M-SERIES + iPhone', retentionFloorGmv: 500, promotionCeilingGmv: 1500, retentionMultiplier: 2.0 },
    { id: 'lvl-7', levelNumber: 7, levelName: 'Director Giám Đốc', colorHex: '#D97706', rewardType: 'HYBRID', promotionBonusAmount: 30000000, physicalItemName: '💻 MACBOOK PRO MAX + 1 CÂY VÀNG 9999', retentionFloorGmv: 1000, promotionCeilingGmv: 3000, retentionMultiplier: 2.5 },
    { id: 'lvl-8', levelNumber: 8, levelName: 'Executive Ban Điều Hành', colorHex: '#7C2D12', rewardType: 'HYBRID', promotionBonusAmount: 50000000, physicalItemName: '🚗 XE CÔNG VỤ + CỔ PHẦN ESOP DOANH NGHIỆP', retentionFloorGmv: 2000, promotionCeilingGmv: 5000, retentionMultiplier: 3.0 },
  ]);

  const [editingItem, setEditingItem] = useState<AdminLevelItem | null>(null);

  // New Bullet-point sub-task modal state
  const [newBulletText, setNewBulletText] = useState('');
  const [currentProjectNameInput, setCurrentProjectNameInput] = useState('');

  const activeDept = departments.find((d) => d.id === selectedDeptId) || departments[0];
  const activeProj = deptProjects[selectedDeptId] || {
    departmentId: selectedDeptId,
    departmentName: activeDept.name,
    projectName: `Dự Án Nâng Level - ${activeDept.name}`,
    subTaskBullets: [],
  };

  const handleAddBullet = () => {
    if (!newBulletText.trim()) return;
    const bulletToAdd = newBulletText.trim().startsWith('•') ? newBulletText.trim() : `• ${newBulletText.trim()}`;
    setDeptProjects((prev) => ({
      ...prev,
      [selectedDeptId]: {
        ...activeProj,
        subTaskBullets: [...(activeProj.subTaskBullets || []), bulletToAdd],
      },
    }));
    setNewBulletText('');
  };

  const handleSaveProjectToDept = () => {
    Alert.alert(
      'Giao Dự Án Nâng Level Thành Công!',
      `Đã giao Dự Án Lớn kèm các Việc con gạch đầu dòng tới Leader phòng ban ${activeDept.name}!`
    );
  };

  const handleSaveItem = () => {
    if (!editingItem) return;
    setLevels((prev) => prev.map((item) => (item.id === editingItem.id ? editingItem : item)));
    Alert.alert('Thành Công', `Đã lưu cấu hình cho ${editingItem.levelName}!`);
    setEditingItem(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Ionicons name="settings-sharp" size={26} color="#D97706" />
          <View>
            <Text style={styles.title}>Admin Cấu Hình Level & Giao Dự Án Lớn</Text>
            <Text style={styles.sub}>Thiết lập điều kiện thăng cấp riêng cho từng phòng ban</Text>
          </View>
        </View>

        {/* Department Selector Tabs */}
        <Text style={styles.sectionHeaderTitle}>1. Chọn Phòng Ban Cần Cấu Hình:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.deptTabsRow}>
          {departments.map((d) => (
            <TouchableOpacity
              key={d.id}
              style={[styles.deptTabPill, selectedDeptId === d.id && styles.deptTabPillActive]}
              onPress={() => setSelectedDeptId(d.id)}
            >
              <Text style={[styles.deptTabText, selectedDeptId === d.id && styles.deptTabTextActive]}>
                {d.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Strategic Project & Bullet Sub-tasks Creator Section */}
        <View style={styles.projectCreatorCard}>
          <View style={styles.projCardHeader}>
            <Ionicons name="rocket" size={20} color="#2563EB" />
            <Text style={styles.projCardTitle}>Dự Án Lớn Thăng Cấp: {activeDept.name}</Text>
          </View>

          <Text style={styles.inputLabel}>Tên Dự Án Lớn Thăng Cấp (Admin Giao):</Text>
          <TextInput
            style={styles.input}
            value={activeProj.projectName}
            onChangeText={(txt) =>
              setDeptProjects((prev) => ({
                ...prev,
                [selectedDeptId]: { ...activeProj, projectName: txt },
              }))
            }
          />

          <Text style={styles.inputLabel}>Thêm Việc Con Gạch Đầu Dòng (Sub-tasks):</Text>
          <View style={styles.addBulletRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              placeholder="Nhập việc con gạch đầu dòng..."
              value={newBulletText}
              onChangeText={setNewBulletText}
            />
            <TouchableOpacity style={styles.addBulletBtn} onPress={handleAddBullet}>
              <Ionicons name="add" size={20} color="#FFFFFF" />
              <Text style={styles.addBulletBtnText}>Thêm</Text>
            </TouchableOpacity>
          </View>

          {/* List of Bullet Sub-tasks */}
          <View style={styles.bulletsList}>
            {activeProj.subTaskBullets && activeProj.subTaskBullets.length > 0 ? (
              activeProj.subTaskBullets.map((bullet, idx) => (
                <View key={idx} style={styles.bulletItemRow}>
                  <Text style={styles.bulletText}>{bullet}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyBulletNotice}>Chưa có việc con nào. Hãy nhập gạch đầu dòng ở trên!</Text>
            )}
          </View>

          <TouchableOpacity style={styles.saveProjBtn} onPress={handleSaveProjectToDept}>
            <Ionicons name="send" size={16} color="#FFFFFF" />
            <Text style={styles.saveProjBtnText}>GIAO DỰ ÁN CHO LEADER {activeDept.name.toUpperCase()}</Text>
          </TouchableOpacity>
        </View>

        {/* Level List */}
        <Text style={styles.sectionHeaderTitle}>2. Danh Mục 8 Cấp Bậc & Quà Thưởng Hiện Vật:</Text>
        {levels.map((lvl) => (
          <View key={lvl.id} style={styles.levelCard}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.levelTitleGroup}>
                <View style={[styles.colorBadge, { backgroundColor: lvl.colorHex }]}>
                  <Text style={styles.colorBadgeText}>L{lvl.levelNumber}</Text>
                </View>
                <Text style={styles.levelName}>{lvl.levelName}</Text>
              </View>

              <TouchableOpacity style={styles.editBtn} onPress={() => setEditingItem({ ...lvl })}>
                <Ionicons name="create-outline" size={18} color="#2563EB" />
                <Text style={styles.editBtnText}>Chỉnh sửa</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.rewardBox}>
              <Ionicons name="gift" size={18} color="#D97706" />
              <View style={{ flex: 1 }}>
                <Text style={styles.rewardTitle}>Quà Hiện Vật: <Text style={{ color: '#B45309', fontWeight: 'bold' }}>{lvl.physicalItemName}</Text></Text>
                <Text style={styles.rewardBonus}>Thưởng nóng: {lvl.promotionBonusAmount.toLocaleString('vi-VN')} VNĐ</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Edit Level Modal */}
      <Modal visible={editingItem !== null} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chỉnh Sửa Level {editingItem?.levelNumber}</Text>
              <TouchableOpacity onPress={() => setEditingItem(null)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {editingItem && (
              <ScrollView style={{ maxHeight: 400 }}>
                <Text style={styles.inputLabel}>Tên Cấp Bậc:</Text>
                <TextInput
                  style={styles.input}
                  value={editingItem.levelName}
                  onChangeText={(text) => setEditingItem({ ...editingItem, levelName: text })}
                />

                <Text style={styles.inputLabel}>Quà Hiện Vật (MacBook, iPad, Vàng...):</Text>
                <TextInput
                  style={styles.input}
                  value={editingItem.physicalItemName}
                  onChangeText={(text) => setEditingItem({ ...editingItem, physicalItemName: text })}
                />

                <Text style={styles.inputLabel}>Thưởng Tiền Mặt (VNĐ):</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="number-pad"
                  value={String(editingItem.promotionBonusAmount)}
                  onChangeText={(text) => setEditingItem({ ...editingItem, promotionBonusAmount: Number(text) || 0 })}
                />
              </ScrollView>
            )}

            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveItem}>
              <Text style={styles.saveBtnText}>LƯU CẤU HÌNH LEVEL</Text>
            </TouchableOpacity>
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
    color: '#D97706',
    fontWeight: '600',
  },
  sectionHeaderTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 8,
    marginBottom: 10,
  },
  deptTabsRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  deptTabPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    marginRight: 8,
  },
  deptTabPillActive: {
    backgroundColor: '#2563EB',
  },
  deptTabText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4B5563',
  },
  deptTabTextActive: {
    color: '#FFFFFF',
  },
  projectCreatorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#93C5FD',
    marginBottom: 16,
  },
  projCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  projCardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1D4ED8',
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
    fontSize: 13,
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  addBulletRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  addBulletBtn: {
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 6,
  },
  addBulletBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  bulletsList: {
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  bulletItemRow: {
    paddingVertical: 4,
  },
  bulletText: {
    fontSize: 13,
    color: '#1E293B',
    fontWeight: '500',
  },
  emptyBulletNotice: {
    fontSize: 12,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  saveProjBtn: {
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 8,
  },
  saveProjBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  levelCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  levelTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  colorBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  colorBadgeText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  levelName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#111827',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#EFF6FF',
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2563EB',
  },
  rewardBox: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 10,
    borderRadius: 8,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  rewardTitle: {
    fontSize: 12,
    color: '#92400E',
  },
  rewardBonus: {
    fontSize: 11,
    color: '#B45309',
    marginTop: 2,
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
  saveBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
});
