import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import type { AdminLevelItem } from '../AdminLevelConfigScreen';

interface AdminLevelProjectsPageProps {
  departmentName: string;
  levels: AdminLevelItem[];
  onUpdateLevelProjectName: (levelNumber: number, newProjectName: string) => void;
  onAddSubTaskToLevel: (levelNumber: number, bulletText: string) => void;
  onEditSubTaskInLevel: (levelNumber: number, bulletIndex: number, newBulletText: string) => void;
  onDeleteSubTaskInLevel: (levelNumber: number, bulletIndex: number) => void;
  onSaveAllAndSync: () => void;
}

export const AdminLevelProjectsPage: React.FC<AdminLevelProjectsPageProps> = ({
  departmentName,
  levels,
  onUpdateLevelProjectName,
  onAddSubTaskToLevel,
  onEditSubTaskInLevel,
  onDeleteSubTaskInLevel,
  onSaveAllAndSync,
}) => {
  const [selectedLevelNum, setSelectedLevelNum] = useState<number>(1);
  const [newBulletText, setNewBulletText] = useState<string>('');

  const [editingBulletIndex, setEditingBulletIndex] = useState<number | null>(null);
  const [editingBulletText, setEditingBulletText] = useState<string>('');

  const activeFocusedLevel = levels.find((l) => l.levelNumber === selectedLevelNum) || levels[0];

  const handleAddBulletSubmit = () => {
    if (!newBulletText.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập nội dung việc con gạch đầu dòng!');
      return;
    }
    onAddSubTaskToLevel(activeFocusedLevel.levelNumber, newBulletText.trim());
    setNewBulletText('');
  };

  const handleStartEditBullet = (index: number, currentText: string) => {
    setEditingBulletIndex(index);
    setEditingBulletText(currentText.replace(/^•\s*/, ''));
  };

  const handleSaveEditBullet = (index: number) => {
    if (!editingBulletText.trim()) {
      Alert.alert('Thông báo', 'Nội dung việc con không được để trống!');
      return;
    }
    onEditSubTaskInLevel(activeFocusedLevel.levelNumber, index, editingBulletText.trim());
    setEditingBulletIndex(null);
    setEditingBulletText('');
  };

  const handleDeleteBullet = (index: number) => {
    Alert.alert(
      'Xác nhận xóa',
      'Bạn có chắc chắn muốn xóa đầu mục việc con này không?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => onDeleteSubTaskInLevel(activeFocusedLevel.levelNumber, index),
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionHeaderTitle}>GIAO DỰ ÁN & VIỆC CON CHO PHÒNG BAN:</Text>
          <Text style={styles.deptTitle}>{departmentName.toUpperCase()}</Text>
        </View>
      </View>

      {/* Visual Level Selector Bar */}
      <Text style={styles.inputSubLabel}>CHỌN LEVEL CẦN GIAO DỰ ÁN & VIỆC CON:</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.stepperRow}>
        {levels.map((lvl) => (
          <TouchableOpacity
            key={lvl.levelNumber}
            style={[
              styles.stepPill,
              selectedLevelNum === lvl.levelNumber && styles.stepPillActive,
            ]}
            onPress={() => {
              setSelectedLevelNum(lvl.levelNumber);
              setEditingBulletIndex(null);
            }}
          >
            <Text
              style={[
                styles.stepPillText,
                selectedLevelNum === lvl.levelNumber && styles.stepPillTextActive,
              ]}
            >
              LEVEL {lvl.levelNumber}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Focused Level Project Card */}
      {activeFocusedLevel && (
        <View style={styles.projectCard}>
          <View style={styles.cardHeaderRow}>
            <View style={[styles.colorBadge, { backgroundColor: activeFocusedLevel.colorHex }]}>
              <Text style={styles.colorBadgeText}>LEVEL {activeFocusedLevel.levelNumber}</Text>
            </View>
            <Text style={styles.cardTitle}>Dự Án Chinh Phục</Text>
          </View>

          <Text style={styles.inputLabel}>Tên Dự Án Lớn Thăng Cấp (Level {activeFocusedLevel.levelNumber}):</Text>
          <TextInput
            style={styles.input}
            value={activeFocusedLevel.project.projectName}
            onChangeText={(txt) => onUpdateLevelProjectName(activeFocusedLevel.levelNumber, txt)}
          />

          <Text style={styles.inputSubLabel}>Danh sách các việc con gạch đầu dòng cần làm ở Level {activeFocusedLevel.levelNumber}:</Text>

          <View style={styles.bulletsList}>
            {activeFocusedLevel.project.subTaskBullets && activeFocusedLevel.project.subTaskBullets.length > 0 ? (
              activeFocusedLevel.project.subTaskBullets.map((bullet, idx) => (
                <View key={idx} style={styles.bulletItemRow}>
                  {editingBulletIndex === idx ? (
                    <View style={styles.editBulletRow}>
                      <TextInput
                        style={[styles.input, { flex: 1, marginBottom: 0 }]}
                        value={editingBulletText}
                        onChangeText={setEditingBulletText}
                      />
                      <TouchableOpacity style={styles.saveBulletBtn} onPress={() => handleSaveEditBullet(idx)}>
                        <Text style={styles.saveBulletBtnText}>Lưu</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.cancelBulletBtn} onPress={() => setEditingBulletIndex(null)}>
                        <Text style={styles.cancelBulletBtnText}>Hủy</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.bulletDisplayRow}>
                      <Text style={styles.bulletText}>{bullet}</Text>
                      <View style={styles.bulletActions}>
                        <TouchableOpacity style={styles.editPillBtn} onPress={() => handleStartEditBullet(idx, bullet)}>
                          <Text style={styles.editPillBtnText}>Sửa</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.deletePillBtn} onPress={() => handleDeleteBullet(idx)}>
                          <Text style={styles.deletePillBtnText}>Xóa</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              ))
            ) : (
              <Text style={styles.emptyNotice}>Chưa có việc con nào ở Level này. Hãy nhập bên dưới!</Text>
            )}
          </View>

          <View style={styles.addBulletRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              placeholder={`+ Nhập việc con cho Level ${activeFocusedLevel.levelNumber}...`}
              value={newBulletText}
              onChangeText={setNewBulletText}
            />
            <TouchableOpacity style={styles.addBtn} onPress={handleAddBulletSubmit}>
              <Text style={styles.addBtnText}>+ Thêm việc</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <TouchableOpacity style={styles.saveSyncBtn} onPress={onSaveAllAndSync}>
        <Text style={styles.saveSyncBtnText}>HOÀN TẤT & ĐỒNG BỘ CẤU HÌNH</Text>
      </TouchableOpacity>

      <View style={{ height: 20 }} />
    </ScrollView>
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
  headerRow: {
    marginBottom: 10,
  },
  sectionHeaderTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#64748B',
    letterSpacing: 0.8,
  },
  deptTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E40AF',
  },
  inputSubLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#475569',
    marginTop: 6,
    marginBottom: 6,
  },
  stepperRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  stepPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  stepPillActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  stepPillText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#475569',
  },
  stepPillTextActive: {
    color: '#FFFFFF',
  },
  projectCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginBottom: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
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
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    backgroundColor: '#FFFFFF',
    color: '#0F172A',
    marginBottom: 10,
  },
  bulletsList: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  bulletItemRow: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  bulletDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  bulletText: {
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '500',
    flex: 1,
    lineHeight: 18,
  },
  bulletActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  editPillBtn: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  editPillBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1D4ED8',
  },
  deletePillBtn: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  deletePillBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#B91C1C',
  },
  editBulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  saveBulletBtn: {
    backgroundColor: '#059669',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 6,
  },
  saveBulletBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 11,
  },
  cancelBulletBtn: {
    backgroundColor: '#CBD5E1',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 6,
  },
  cancelBulletBtnText: {
    color: '#334155',
    fontWeight: 'bold',
    fontSize: 11,
  },
  emptyNotice: {
    fontSize: 11,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  addBulletRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  addBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 11,
  },
  saveSyncBtn: {
    backgroundColor: '#1E40AF',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  saveSyncBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});
