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

  // Pure Level Naming Default (Strictly Level 1 - Level 8 without position titles)
  const defaultLevels: AdminLevelItem[] = [
    { id: 'lvl-1', levelNumber: 1, levelName: 'Level 1', colorHex: '#64748B', rewardType: 'CASH', promotionBonusAmount: 0, physicalItemName: 'Voucher Sinh nhật 200k', retentionFloorGmv: 0, promotionCeilingGmv: 50, retentionMultiplier: 1.0 },
    { id: 'lvl-2', levelNumber: 2, levelName: 'Level 2', colorHex: '#2563EB', rewardType: 'HYBRID', promotionBonusAmount: 1000000, physicalItemName: 'Kỷ niệm chương chính thức', retentionFloorGmv: 30, promotionCeilingGmv: 150, retentionMultiplier: 1.1 },
    { id: 'lvl-3', levelNumber: 3, levelName: 'Level 3', colorHex: '#0D9488', rewardType: 'HYBRID', promotionBonusAmount: 3000000, physicalItemName: 'Tai nghe Bluetooth Chống ồn cao cấp', retentionFloorGmv: 80, promotionCeilingGmv: 300, retentionMultiplier: 1.25 },
    { id: 'lvl-4', levelNumber: 4, levelName: 'Level 4', colorHex: '#7C3AED', rewardType: 'HYBRID', promotionBonusAmount: 5000000, physicalItemName: 'Máy tính bảng iPad Air / Màn 4K', retentionFloorGmv: 150, promotionCeilingGmv: 500, retentionMultiplier: 1.4 },
    { id: 'lvl-5', levelNumber: 5, levelName: 'Level 5', colorHex: '#EA580C', rewardType: 'HYBRID', promotionBonusAmount: 8000000, physicalItemName: 'Laptop MacBook Air M3', retentionFloorGmv: 250, promotionCeilingGmv: 820, retentionMultiplier: 1.6 },
    { id: 'lvl-6', levelNumber: 6, levelName: 'Level 6', colorHex: '#DC2626', rewardType: 'HYBRID', promotionBonusAmount: 15000000, physicalItemName: 'Laptop MacBook Pro M-Series + iPhone', retentionFloorGmv: 500, promotionCeilingGmv: 1500, retentionMultiplier: 2.0 },
    { id: 'lvl-7', levelNumber: 7, levelName: 'Level 7', colorHex: '#D97706', rewardType: 'HYBRID', promotionBonusAmount: 30000000, physicalItemName: 'MacBook Pro Max + 1 Cây Vàng 9999', retentionFloorGmv: 1000, promotionCeilingGmv: 3000, retentionMultiplier: 2.5 },
    { id: 'lvl-8', levelNumber: 8, levelName: 'Level 8', colorHex: '#881337', rewardType: 'HYBRID', promotionBonusAmount: 50000000, physicalItemName: 'Xe công vụ + Cổ phần ESOP Doanh nghiệp', retentionFloorGmv: 2000, promotionCeilingGmv: 5000, retentionMultiplier: 3.0 },
  ];

  const [deptLevelConfigs, setDeptLevelConfigs] = useState<Record<string, AdminLevelItem[]>>({});
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

  const [editingItem, setEditingItem] = useState<AdminLevelItem | null>(null);
  const [newBulletText, setNewBulletText] = useState('');

  const activeDept = departments.find((d) => d.id === selectedDeptId) || departments[0];
  const activeLevels = deptLevelConfigs[selectedDeptId] || defaultLevels;

  const activeProj = deptProjects[selectedDeptId] || {
    departmentId: selectedDeptId,
    departmentName: activeDept.name,
    projectName: `Dự Án Nâng Level - ${activeDept.name}`,
    subTaskBullets: [],
  };

  const handleAddBullet = () => {
    if (!newBulletText.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập nội dung việc con gạch đầu dòng!');
      return;
    }
    const bulletToAdd = newBulletText.trim().startsWith('•') ? newBulletText.trim() : `• ${newBulletText.trim()}`;
    
    setDeptProjects((prev) => {
      const currentDeptProj = prev[selectedDeptId] || {
        departmentId: selectedDeptId,
        departmentName: activeDept.name,
        projectName: `Dự Án Nâng Level - ${activeDept.name}`,
        subTaskBullets: [],
      };
      return {
        ...prev,
        [selectedDeptId]: {
          ...currentDeptProj,
          subTaskBullets: [...(currentDeptProj.subTaskBullets || []), bulletToAdd],
        },
      };
    });
    setNewBulletText('');
  };

  // Dynamic Add New Level
  const handleAddNewLevel = () => {
    const nextLevelNum = activeLevels.length + 1;
    const newLevelItem: AdminLevelItem = {
      id: `lvl-${Date.now()}`,
      levelNumber: nextLevelNum,
      levelName: `Level ${nextLevelNum}`,
      colorHex: '#0F172A',
      rewardType: 'HYBRID',
      promotionBonusAmount: 60000000,
      physicalItemName: `Quà Thưởng Hiện Vật Cao Cấp Level ${nextLevelNum}`,
      retentionFloorGmv: 3000,
      promotionCeilingGmv: 8000,
      retentionMultiplier: 3.5,
    };

    setDeptLevelConfigs((prev) => {
      const currentList = prev[selectedDeptId] || defaultLevels;
      return {
        ...prev,
        [selectedDeptId]: [...currentList, newLevelItem],
      };
    });

    Alert.alert('Thành Công', `Đã khởi tạo thêm Level ${nextLevelNum} mới cho phòng ban ${activeDept.name}!`);
  };

  const handleSaveProjectToDept = () => {
    Alert.alert(
      'Giao Dự Án Nâng Level Thành Công!',
      `Đã giao Dự Án Lớn kèm các Việc con gạch đầu dòng tới Leader phòng ban ${activeDept.name}!`
    );
  };

  const handleSaveItem = () => {
    if (!editingItem) return;
    setDeptLevelConfigs((prev) => {
      const currentList = prev[selectedDeptId] || defaultLevels;
      const updatedList = currentList.map((item) => (item.id === editingItem.id ? editingItem : item));
      return { ...prev, [selectedDeptId]: updatedList };
    });
    Alert.alert('Thành Công', `Đã lưu cấu hình cho ${editingItem.levelName} - Phòng ${activeDept.name}!`);
    setEditingItem(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        
        {/* Executive Header Banner */}
        <View style={styles.executiveHeaderCard}>
          <Text style={styles.executiveBadgeTitle}>ADMIN CONTROL CENTER</Text>
          <Text style={styles.title}>Cấu Hình Level Động Theo Phòng Ban</Text>
          <Text style={styles.sub}>Thưởng thuần túy theo Level 1 - N (Bỏ hẳn tên chức vụ & Thêm Level động)</Text>
        </View>

        {/* Department Selector Tabs */}
        <Text style={styles.sectionHeaderTitle}>CHỌN PHÒNG BAN THIẾT LẬP (CẤU HÌNH BẢN QUYỀN RIÊNG):</Text>
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
          <View style={styles.projHeaderPill}>
            <Text style={styles.projHeaderPillText}>1. DỰ ÁN THĂNG CẤP: {activeDept.name.toUpperCase()}</Text>
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

          <Text style={styles.inputLabel}>Thêm Việc Con Gạch Đầu Dòng (Bullet-Point Sub-tasks):</Text>
          <View style={styles.addBulletRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              placeholder="Nhập nội dung việc con gạch đầu dòng..."
              value={newBulletText}
              onChangeText={setNewBulletText}
            />
            <TouchableOpacity style={styles.addBulletBtn} onPress={handleAddBullet}>
              <Text style={styles.addBulletBtnText}>+ Thêm việc</Text>
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
              <Text style={styles.emptyBulletNotice}>Chưa có việc con nào. Nhập gạch đầu dòng ở trên và bấm [+ Thêm việc].</Text>
            )}
          </View>

          <TouchableOpacity style={styles.saveProjBtn} onPress={handleSaveProjectToDept}>
            <Text style={styles.saveProjBtnText}>XÁC NHẬN GIAO DỰ ÁN CHO LEADER {activeDept.name.toUpperCase()}</Text>
          </TouchableOpacity>
        </View>

        {/* Department Specific Level List */}
        <View style={styles.levelHeaderRow}>
          <Text style={styles.sectionHeaderTitle}>2. DANH MỤC CẤP BẬC PHÒNG {activeDept.name.toUpperCase()}:</Text>
          <TouchableOpacity style={styles.addNewLevelBtn} onPress={handleAddNewLevel}>
            <Text style={styles.addNewLevelBtnText}>+ THÊM LEVEL MỚI</Text>
          </TouchableOpacity>
        </View>

        {activeLevels.map((lvl) => (
          <View key={lvl.id} style={styles.levelCard}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.levelTitleGroup}>
                <View style={[styles.colorBadge, { backgroundColor: lvl.colorHex }]}>
                  <Text style={styles.colorBadgeText}>LEVEL {lvl.levelNumber}</Text>
                </View>
                <Text style={styles.levelName}>{lvl.levelName}</Text>
              </View>

              <TouchableOpacity style={styles.editBtn} onPress={() => setEditingItem({ ...lvl })}>
                <Text style={styles.editBtnText}>Chỉnh sửa</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.rewardBox}>
              <Text style={styles.rewardTitle}>
                Quà Hiện Vật: <Text style={styles.rewardTitleBold}>{lvl.physicalItemName}</Text>
              </Text>
              <Text style={styles.rewardBonus}>
                Thưởng nóng thăng cấp: {lvl.promotionBonusAmount.toLocaleString('vi-VN')} VNĐ
              </Text>
            </View>
          </View>
        ))}

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Edit Level Modal */}
      <Modal visible={editingItem !== null} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chỉnh Sửa {editingItem?.levelName} - Phòng {activeDept.name}</Text>
              <TouchableOpacity onPress={() => setEditingItem(null)}>
                <Text style={{ fontSize: 18, color: '#6B7280', fontWeight: 'bold' }}>✕</Text>
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

                <Text style={styles.inputLabel}>Quà Hiện Vật (MacBook, iPad, Xe máy...):</Text>
                <TextInput
                  style={styles.input}
                  value={editingItem.physicalItemName}
                  onChangeText={(text) => setEditingItem({ ...editingItem, physicalItemName: text })}
                />

                <Text style={styles.inputLabel}>Thưởng Tiền Mặt Thăng Cấp (VNĐ):</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="number-pad"
                  value={String(editingItem.promotionBonusAmount)}
                  onChangeText={(text) => setEditingItem({ ...editingItem, promotionBonusAmount: Number(text) || 0 })}
                />
              </ScrollView>
            )}

            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveItem}>
              <Text style={styles.saveBtnText}>LƯU QUÀ THƯỞNG PHÒNG {activeDept.name.toUpperCase()}</Text>
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
    flex: 1,
  },
  levelHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 10,
  },
  addNewLevelBtn: {
    backgroundColor: '#1E40AF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addNewLevelBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  deptTabsRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  deptTabPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  deptTabPillActive: {
    backgroundColor: '#1E40AF',
    borderColor: '#1E40AF',
  },
  deptTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  deptTabTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  projectCreatorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  projHeaderPill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  projHeaderPillText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1D4ED8',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
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
    fontSize: 13,
    backgroundColor: '#FFFFFF',
    color: '#0F172A',
    marginBottom: 8,
  },
  addBulletRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  addBulletBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 8,
  },
  addBulletBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  bulletsList: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    marginBottom: 14,
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
    lineHeight: 18,
  },
  emptyBulletNotice: {
    fontSize: 12,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  saveProjBtn: {
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 10,
  },
  saveProjBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  levelCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    fontSize: 11,
  },
  levelName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  editBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  editBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#334155',
  },
  rewardBox: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 10,
    borderRadius: 8,
  },
  rewardTitle: {
    fontSize: 12,
    color: '#78350F',
  },
  rewardTitleBold: {
    fontWeight: 'bold',
    color: '#92400E',
  },
  rewardBonus: {
    fontSize: 11,
    color: '#B45309',
    marginTop: 2,
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
  saveBtn: {
    backgroundColor: '#1E40AF',
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 16,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
});
