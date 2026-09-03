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
  onSaveAllAndSync: () => void;
}

export const AdminLevelProjectsPage: React.FC<AdminLevelProjectsPageProps> = ({
  departmentName,
  levels,
  onUpdateLevelProjectName,
  onAddSubTaskToLevel,
  onSaveAllAndSync,
}) => {
  const [selectedLevelNum, setSelectedLevelNum] = useState<number>(1);
  const [newBulletText, setNewBulletText] = useState<string>('');

  const activeFocusedLevel = levels.find((l) => l.levelNumber === selectedLevelNum) || levels[0];

  const handleAddBulletSubmit = () => {
    if (!newBulletText.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập nội dung việc con gạch đầu dòng!');
      return;
    }
    onAddSubTaskToLevel(activeFocusedLevel.levelNumber, newBulletText.trim());
    setNewBulletText('');
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
            onPress={() => setSelectedLevelNum(lvl.levelNumber)}
          >
            <Text
              style={[
                styles.stepPillText,
                selectedLevelNum === lvl.levelNumber && styles.stepPillTextActive,
              ]}
            >
              {lvl.levelName}
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
                  <Text style={styles.bulletText}>{bullet}</Text>
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
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
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
