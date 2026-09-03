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

export interface LevelStageProject {
  projectName: string;
  subTaskBullets: string[];
}

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
  project: LevelStageProject;
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

  // Default Level Configs with Integrated Projects & Bullet Sub-tasks for Each Level
  const createDefaultLevels = (deptName: string): AdminLevelItem[] => [
    {
      id: 'lvl-1',
      levelNumber: 1,
      levelName: 'Level 1',
      colorHex: '#64748B',
      rewardType: 'CASH',
      promotionBonusAmount: 0,
      physicalItemName: 'Voucher Sinh nhật 200k',
      retentionFloorGmv: 0,
      promotionCeilingGmv: 50,
      retentionMultiplier: 1.0,
      project: {
        projectName: `Dự Án Level 1: Hòa Nhập & Chuẩn Hóa (${deptName})`,
        subTaskBullets: [
          '• Hoàn thành khóa đào tạo hội nhập ban đầu',
          '• Nắm rõ quy trình vận hành & nội quy công ty',
          '• Thử nghiệm 5 ca làm việc dưới sự giám sát',
        ],
      },
    },
    {
      id: 'lvl-2',
      levelNumber: 2,
      levelName: 'Level 2',
      colorHex: '#2563EB',
      rewardType: 'HYBRID',
      promotionBonusAmount: 1000000,
      physicalItemName: 'Kỷ niệm chương chính thức',
      retentionFloorGmv: 30,
      promotionCeilingGmv: 150,
      retentionMultiplier: 1.1,
      project: {
        projectName: `Dự Án Level 2: Làm Chủ Quy Trình Độc Lập (${deptName})`,
        subTaskBullets: [
          '• Đạt 100% KPI ca làm việc cá nhân đúng hạn',
          '• Đề xuất 1 giải pháp cải tiến quy trình phòng ban',
        ],
      },
    },
    {
      id: 'lvl-3',
      levelNumber: 3,
      levelName: 'Level 3',
      colorHex: '#0D9488',
      rewardType: 'HYBRID',
      promotionBonusAmount: 3000000,
      physicalItemName: 'Tai nghe Bluetooth Chống ồn cao cấp',
      retentionFloorGmv: 80,
      promotionCeilingGmv: 300,
      retentionMultiplier: 1.25,
      project: {
        projectName: `Dự Án Level 3: Tối Ưu Năng Suất Chuyên Chuyện (${deptName})`,
        subTaskBullets: [
          '• Đạt tổng Doanh số / KPI cá nhân 300Trđ',
          '• Hướng dẫn & kèm cặp 1 nhân sự mới Level 1',
        ],
      },
    },
    {
      id: 'lvl-4',
      levelNumber: 4,
      levelName: 'Level 4',
      colorHex: '#7C3AED',
      rewardType: 'HYBRID',
      promotionBonusAmount: 5000000,
      physicalItemName: 'Máy tính bảng iPad Air / Màn 4K',
      retentionFloorGmv: 150,
      promotionCeilingGmv: 500,
      retentionMultiplier: 1.4,
      project: {
        projectName: `Dự Án Level 4: Chinh Phục Cột Mốc 500 Triệu (${deptName})`,
        subTaskBullets: [
          '• Đạt tổng Doanh số / KPI cá nhân 500Trđ',
          '• Đảm nhận dẫn dắt các phiên nhiệm vụ ưu tiên',
        ],
      },
    },
    {
      id: 'lvl-5',
      levelNumber: 5,
      levelName: 'Level 5',
      colorHex: '#EA580C',
      rewardType: 'HYBRID',
      promotionBonusAmount: 8000000,
      physicalItemName: 'Laptop MacBook Air M3',
      retentionFloorGmv: 250,
      promotionCeilingGmv: 820,
      retentionMultiplier: 1.6,
      project: {
        projectName: `Dự Án Level 5: Bứt Phá Doanh Số 1 Tỷ (${deptName})`,
        subTaskBullets: [
          '• Đảm nhận và hoàn thành 30 ca đỉnh điểm',
          '• Đạt tổng Doanh số / KPI cá nhân 820Trđ - 1 Tỷđ',
          '• Tỷ lệ hoàn thành Task SLA đúng hạn ≥ 98%',
        ],
      },
    },
    {
      id: 'lvl-6',
      levelNumber: 6,
      levelName: 'Level 6',
      colorHex: '#DC2626',
      rewardType: 'HYBRID',
      promotionBonusAmount: 15000000,
      physicalItemName: 'Laptop MacBook Pro M-Series + iPhone',
      retentionFloorGmv: 500,
      promotionCeilingGmv: 1500,
      retentionMultiplier: 2.0,
      project: {
        projectName: `Dự Án Level 6: Quản Trị & Bứt Phá 1.5 Tỷ (${deptName})`,
        subTaskBullets: [
          '• Xây dựng bộ quy trình chuẩn cho phòng ban',
          '• Đạt tổng Doanh số / KPI 1.5 Tỷđ',
        ],
      },
    },
    {
      id: 'lvl-7',
      levelNumber: 7,
      levelName: 'Level 7',
      colorHex: '#D97706',
      rewardType: 'HYBRID',
      promotionBonusAmount: 30000000,
      physicalItemName: 'MacBook Pro Max + 1 Cây Vàng 9999',
      retentionFloorGmv: 1000,
      promotionCeilingGmv: 3000,
      retentionMultiplier: 2.5,
      project: {
        projectName: `Dự Án Level 7: Chinh Phục 3 Tỷ Doanh Số (${deptName})`,
        subTaskBullets: [
          '• Đạt mốc 3 Tỷđ Doanh số toàn diện',
          '• Đào tạo & phát triển 3 nhân sự lên Level 5',
        ],
      },
    },
    {
      id: 'lvl-8',
      levelNumber: 8,
      levelName: 'Level 8',
      colorHex: '#881337',
      rewardType: 'HYBRID',
      promotionBonusAmount: 50000000,
      physicalItemName: 'Xe công vụ + Cổ phần ESOP Doanh nghiệp',
      retentionFloorGmv: 2000,
      promotionCeilingGmv: 5000,
      retentionMultiplier: 3.0,
      project: {
        projectName: `Dự Án Level 8: Tăng Trưởng Quy Mô 5 Tỷ (${deptName})`,
        subTaskBullets: [
          '• Đạt mốc 5 Tỷđ Doanh số',
          '• Hoàn thành chiến lược mở rộng thị phần công ty',
        ],
      },
    },
  ];

  // Map of departmentId to department's custom 8 levels
  const [deptLevelConfigs, setDeptLevelConfigs] = useState<Record<string, AdminLevelItem[]>>({});
  const [editingItem, setEditingItem] = useState<AdminLevelItem | null>(null);
  const [newBulletInputs, setNewBulletInputs] = useState<Record<string, string>>({});

  const activeDept = departments.find((d) => d.id === selectedDeptId) || departments[0];
  const activeLevels = deptLevelConfigs[selectedDeptId] || createDefaultLevels(activeDept.name);

  // Add bullet sub-task directly to a specific Level Card
  const handleAddBulletToLevel = (levelId: string) => {
    const textToAdd = (newBulletInputs[levelId] || '').trim();
    if (!textToAdd) {
      Alert.alert('Thông báo', 'Vui lòng nhập nội dung việc con gạch đầu dòng!');
      return;
    }
    const formattedBullet = textToAdd.startsWith('•') ? textToAdd : `• ${textToAdd}`;

    setDeptLevelConfigs((prev) => {
      const currentList = prev[selectedDeptId] || createDefaultLevels(activeDept.name);
      const updatedList = currentList.map((lvl) => {
        if (lvl.id === levelId) {
          return {
            ...lvl,
            project: {
              ...lvl.project,
              subTaskBullets: [...(lvl.project.subTaskBullets || []), formattedBullet],
            },
          };
        }
        return lvl;
      });
      return { ...prev, [selectedDeptId]: updatedList };
    });

    setNewBulletInputs((prev) => ({ ...prev, [levelId]: '' }));
  };

  // Dynamic Add New Level with Project
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
      project: {
        projectName: `Dự Án Level ${nextLevelNum}: Thử Thách Mới (${activeDept.name})`,
        subTaskBullets: ['• Hoàn thành 100% KPI Level mới'],
      },
    };

    setDeptLevelConfigs((prev) => {
      const currentList = prev[selectedDeptId] || createDefaultLevels(activeDept.name);
      return {
        ...prev,
        [selectedDeptId]: [...currentList, newLevelItem],
      };
    });

    Alert.alert('Thành Công', `Đã khởi tạo thêm Level ${nextLevelNum} mới kèm Dự án cho phòng ban ${activeDept.name}!`);
  };

  const handleSaveItem = () => {
    if (!editingItem) return;
    setDeptLevelConfigs((prev) => {
      const currentList = prev[selectedDeptId] || createDefaultLevels(activeDept.name);
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
          <Text style={styles.title}>Cấu Hình Dự Án & Quà Thưởng Trực Tiếp Cho Từng Level</Text>
          <Text style={styles.sub}>Mỗi Level là 1 Dự Án Chinh Phục nối tiếp nhau — Dễ dàng thiết lập 100%</Text>
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

        {/* Department Specific Level List with Integrated Projects */}
        <View style={styles.levelHeaderRow}>
          <Text style={styles.sectionHeaderTitle}>DANH SÁCH LEVEL & DỰ ÁN CHINH PHỤC PHÒNG {activeDept.name.toUpperCase()}:</Text>
          <TouchableOpacity style={styles.addNewLevelBtn} onPress={handleAddNewLevel}>
            <Text style={styles.addNewLevelBtnText}>+ THÊM LEVEL MỚI</Text>
          </TouchableOpacity>
        </View>

        {activeLevels.map((lvl) => (
          <View key={lvl.id} style={styles.levelCard}>
            
            {/* Header Level Card */}
            <View style={styles.cardHeaderRow}>
              <View style={styles.levelTitleGroup}>
                <View style={[styles.colorBadge, { backgroundColor: lvl.colorHex }]}>
                  <Text style={styles.colorBadgeText}>LEVEL {lvl.levelNumber}</Text>
                </View>
                <Text style={styles.levelName}>{lvl.levelName}</Text>
              </View>

              <TouchableOpacity style={styles.editBtn} onPress={() => setEditingItem({ ...lvl })}>
                <Text style={styles.editBtnText}>Chỉnh sửa quà</Text>
              </TouchableOpacity>
            </View>

            {/* Reward Summary Box */}
            <View style={styles.rewardBox}>
              <Text style={styles.rewardTitle}>
                Quà Thưởng Hiện Vật: <Text style={styles.rewardTitleBold}>{lvl.physicalItemName}</Text>
              </Text>
              <Text style={styles.rewardBonus}>
                Thưởng nóng thăng cấp: {lvl.promotionBonusAmount.toLocaleString('vi-VN')} VNĐ
              </Text>
            </View>

            {/* Level Stage Project Section directly inside Level Card */}
            <View style={styles.levelProjectSection}>
              <Text style={styles.projSectionTitle}>Dự Án Chinh Phục Của Level {lvl.levelNumber}:</Text>
              
              <TextInput
                style={styles.projTitleInput}
                value={lvl.project.projectName}
                onChangeText={(txt) => {
                  setDeptLevelConfigs((prev) => {
                    const currentList = prev[selectedDeptId] || createDefaultLevels(activeDept.name);
                    const updatedList = currentList.map((item) =>
                      item.id === lvl.id ? { ...item, project: { ...item.project, projectName: txt } } : item
                    );
                    return { ...prev, [selectedDeptId]: updatedList };
                  });
                }}
              />

              <Text style={styles.inputSubLabel}>Các việc con gạch đầu dòng cần làm ở Level {lvl.levelNumber}:</Text>
              
              {/* Bullet Sub-tasks List */}
              <View style={styles.bulletsList}>
                {lvl.project.subTaskBullets && lvl.project.subTaskBullets.length > 0 ? (
                  lvl.project.subTaskBullets.map((bullet, idx) => (
                    <View key={idx} style={styles.bulletItemRow}>
                      <Text style={styles.bulletText}>{bullet}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyBulletNotice}>Chưa có việc con nào ở Level này.</Text>
                )}
              </View>

              {/* Add Bullet Input Row directly inside Level Card */}
              <View style={styles.addBulletRow}>
                <TextInput
                  style={[styles.input, { flex: 1, marginBottom: 0 }]}
                  placeholder={`+ Thêm việc con cho Level ${lvl.levelNumber}...`}
                  value={newBulletInputs[lvl.id] || ''}
                  onChangeText={(txt) => setNewBulletInputs((prev) => ({ ...prev, [lvl.id]: txt }))}
                />
                <TouchableOpacity style={styles.addBulletBtn} onPress={() => handleAddBulletToLevel(lvl.id)}>
                  <Text style={styles.addBulletBtnText}>+ Thêm</Text>
                </TouchableOpacity>
              </View>
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
  levelCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  editBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
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
    marginBottom: 12,
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
  levelProjectSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  projSectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1D4ED8',
    marginBottom: 6,
  },
  projTitleInput: {
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    backgroundColor: '#FFFFFF',
    fontWeight: 'bold',
    color: '#1E40AF',
    marginBottom: 8,
  },
  inputSubLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 4,
  },
  bulletsList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    padding: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  bulletItemRow: {
    paddingVertical: 3,
  },
  bulletText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '500',
  },
  emptyBulletNotice: {
    fontSize: 11,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  addBulletRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 12,
    backgroundColor: '#FFFFFF',
    color: '#0F172A',
  },
  addBulletBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addBulletBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 11,
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
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginTop: 8,
    marginBottom: 4,
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
