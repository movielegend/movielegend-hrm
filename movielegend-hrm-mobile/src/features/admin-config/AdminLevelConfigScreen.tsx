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

export interface AdminLevelItem {
  id: string;
  levelNumber: number;
  levelName: string;
  colorHex: string;
  rewardType: 'CASH' | 'PHYSICAL_ITEM' | 'HYBRID';
  promotionBonusAmount: number; // e.g. 8000000 (VNĐ)
  physicalItemName: string; // e.g. "Laptop MacBook Air M3"
  retentionFloorGmv: number; // e.g. 250 (tr)
  promotionCeilingGmv: number; // e.g. 820 (tr)
  retentionMultiplier: number; // e.g. 1.6
}

export const AdminLevelConfigScreen: React.FC = () => {
  const [levels, setLevels] = useState<AdminLevelItem[]>([
    {
      id: 'lvl-1',
      levelNumber: 1,
      levelName: 'Thực tập / Thử việc',
      colorHex: '#9CA3AF',
      rewardType: 'CASH',
      promotionBonusAmount: 0,
      physicalItemName: 'Voucher Sinh nhật 200k',
      retentionFloorGmv: 0,
      promotionCeilingGmv: 50,
      retentionMultiplier: 1.0,
    },
    {
      id: 'lvl-2',
      levelNumber: 2,
      levelName: 'Chính thức',
      colorHex: '#2563EB',
      rewardType: 'HYBRID',
      promotionBonusAmount: 1000000,
      physicalItemName: 'Kỷ niệm chương chính thức',
      retentionFloorGmv: 30,
      promotionCeilingGmv: 150,
      retentionMultiplier: 1.1,
    },
    {
      id: 'lvl-3',
      levelNumber: 3,
      levelName: 'Senior Specialist',
      colorHex: '#0D9488',
      rewardType: 'HYBRID',
      promotionBonusAmount: 3000000,
      physicalItemName: 'Tai nghe Bluetooth Chống ồn',
      retentionFloorGmv: 80,
      promotionCeilingGmv: 300,
      retentionMultiplier: 1.25,
    },
    {
      id: 'lvl-4',
      levelNumber: 4,
      levelName: 'Key Member',
      colorHex: '#9333EA',
      rewardType: 'HYBRID',
      promotionBonusAmount: 5000000,
      physicalItemName: 'Máy tính bảng iPad Air / Màn 4K',
      retentionFloorGmv: 150,
      promotionCeilingGmv: 500,
      retentionMultiplier: 1.4,
    },
    {
      id: 'lvl-5',
      levelNumber: 5,
      levelName: 'Team Leader',
      colorHex: '#EA580C',
      rewardType: 'HYBRID',
      promotionBonusAmount: 8000000,
      physicalItemName: '💻 LAPTOP MACBOOK AIR M3',
      retentionFloorGmv: 250,
      promotionCeilingGmv: 820,
      retentionMultiplier: 1.6,
    },
    {
      id: 'lvl-6',
      levelNumber: 6,
      levelName: 'Manager Bộ Phận',
      colorHex: '#DC2626',
      rewardType: 'HYBRID',
      promotionBonusAmount: 15000000,
      physicalItemName: '💻 LAPTOP MACBOOK PRO M-SERIES + iPhone',
      retentionFloorGmv: 500,
      promotionCeilingGmv: 1500,
      retentionMultiplier: 2.0,
    },
    {
      id: 'lvl-7',
      levelNumber: 7,
      levelName: 'Director Giám Đốc',
      colorHex: '#D97706',
      rewardType: 'HYBRID',
      promotionBonusAmount: 30000000,
      physicalItemName: '💻 MACBOOK PRO MAX + 1 CÂY VÀNG 9999',
      retentionFloorGmv: 1000,
      promotionCeilingGmv: 3000,
      retentionMultiplier: 2.5,
    },
    {
      id: 'lvl-8',
      levelNumber: 8,
      levelName: 'Executive Ban Điều Hành',
      colorHex: '#7C2D12',
      rewardType: 'HYBRID',
      promotionBonusAmount: 50000000,
      physicalItemName: '🚗 XE CÔNG VỤ + CỔ PHẦN ESOP DOANH NGHIỆP',
      retentionFloorGmv: 2000,
      promotionCeilingGmv: 5000,
      retentionMultiplier: 3.0,
    },
  ]);

  const [editingItem, setEditingItem] = useState<AdminLevelItem | null>(null);

  const handleSaveItem = () => {
    if (!editingItem) return;
    setLevels((prev) =>
      prev.map((item) => (item.id === editingItem.id ? editingItem : item))
    );
    Alert.alert('Thành Công', `Đã lưu cấu hình cho ${editingItem.levelName}!`);
    setEditingItem(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Ionicons name="settings-sharp" size={26} color="#D97706" />
          <View>
            <Text style={styles.title}>Cấu Hình Cấp Bậc & Thưởng Hiện Vật</Text>
            <Text style={styles.sub}>Quản lý danh mục 8 Level, MacBook/iPad & 2 Ngưỡng</Text>
          </View>
        </View>

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

            {/* Reward Box */}
            <View style={styles.rewardBox}>
              <Ionicons name="gift" size={18} color="#D97706" />
              <View style={{ flex: 1 }}>
                <Text style={styles.rewardTitle}>Quà Hiện Vật: <Text style={{ color: '#B45309', fontWeight: 'bold' }}>{lvl.physicalItemName}</Text></Text>
                <Text style={styles.rewardBonus}>Thưởng nóng: {lvl.promotionBonusAmount.toLocaleString('vi-VN')} VNĐ</Text>
              </View>
            </View>

            {/* 2 Thresholds */}
            <View style={styles.thresholdGrid}>
              <View style={[styles.thresholdItem, styles.floorBox]}>
                <Text style={styles.floorLabel}>🔻 Mốc Duy Trì Cấp (Đỏ)</Text>
                <Text style={styles.floorValue}>{lvl.retentionFloorGmv} Tr VNĐ</Text>
              </View>

              <View style={[styles.thresholdItem, styles.ceilingBox]}>
                <Text style={styles.ceilingLabel}>🚀 Mốc Nâng Cấp (Xanh)</Text>
                <Text style={styles.ceilingValue}>{lvl.promotionCeilingGmv} Tr VNĐ</Text>
              </View>
            </View>

            <Text style={styles.multiplierText}>
              • Hệ số tích điểm Ví Tết: <Text style={{ fontWeight: 'bold', color: '#111827' }}>{lvl.retentionMultiplier}x</Text>
            </Text>
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

                <Text style={styles.inputLabel}>🔻 Mốc Duy Trì Cấp (Tr VNĐ):</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="number-pad"
                  value={String(editingItem.retentionFloorGmv)}
                  onChangeText={(text) => setEditingItem({ ...editingItem, retentionFloorGmv: Number(text) || 0 })}
                />

                <Text style={styles.inputLabel}>🚀 Mốc Nâng Cấp Mới (Tr VNĐ):</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="number-pad"
                  value={String(editingItem.promotionCeilingGmv)}
                  onChangeText={(text) => setEditingItem({ ...editingItem, promotionCeilingGmv: Number(text) || 0 })}
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
    marginBottom: 10,
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
  thresholdGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  thresholdItem: {
    flex: 1,
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  floorBox: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  ceilingBox: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  floorLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#DC2626',
  },
  floorValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#991B1B',
    marginTop: 2,
  },
  ceilingLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#059669',
  },
  ceilingValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#065F46',
    marginTop: 2,
  },
  multiplierText: {
    fontSize: 11,
    color: '#6B7280',
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
