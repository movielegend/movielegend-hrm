import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { levelingApi, DepartmentLevelItem } from '../../api/leveling.api';
import { LEVEL_COLORS, LEVEL_DEFAULT_NAMES } from '../../components/common/LevelNameBadge';

interface DepartmentLevelConfigModalProps {
  visible: boolean;
  departmentId: string;
  departmentName: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export const DepartmentLevelConfigModal: React.FC<DepartmentLevelConfigModalProps> = ({
  visible,
  departmentId,
  departmentName,
  onClose,
  onSuccess,
}) => {
  const [configs, setConfigs] = useState<
    Array<{ levelNumber: number; customLevelName: string; badgeTitle: string }>
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (visible && departmentId) {
      loadConfigs();
    }
  }, [visible, departmentId]);

  const loadConfigs = async () => {
    try {
      setIsLoading(true);
      const data = await levelingApi.getDepartmentLevelConfigs(departmentId);
      if (Array.isArray(data) && data.length > 0) {
        setConfigs(
          data.map((item) => ({
            levelNumber: item.levelNumber,
            customLevelName: item.customLevelName || item.defaultName,
            badgeTitle: item.badgeTitle || item.defaultName,
          })),
        );
      } else {
        // Default 8 levels
        setConfigs(
          Array.from({ length: 8 }, (_, i) => ({
            levelNumber: i + 1,
            customLevelName: LEVEL_DEFAULT_NAMES[i + 1] || `Level ${i + 1}`,
            badgeTitle: LEVEL_DEFAULT_NAMES[i + 1] || `Level ${i + 1}`,
          })),
        );
      }
    } catch (err: any) {
      Alert.alert('Lỗi tải cấu hình', err?.message || 'Không thể tải cấu hình phòng ban');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNameChange = (levelNumber: number, text: string) => {
    setConfigs((prev) =>
      prev.map((item) =>
        item.levelNumber === levelNumber
          ? { ...item, customLevelName: text, badgeTitle: text }
          : item,
      ),
    );
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await levelingApi.saveDepartmentLevelConfigs(departmentId, configs);
      Alert.alert('Thành công', `Đã lưu cấu hình danh xưng cấp bậc cho phòng ${departmentName}!`);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      Alert.alert('Lỗi lưu cấu hình', err?.response?.data?.message || err?.message || 'Có lỗi xảy ra');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Cấu Hình Cấp Bậc Phòng Ban</Text>
              <Text style={styles.subtitle}>Phòng: {departmentName}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color="#2563EB" />
              <Text style={styles.loadingText}>Đang tải cấu hình cấp bậc...</Text>
            </View>
          ) : (
            <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
              <Text style={styles.guideText}>
                💡 Tùy biến tên gọi chuyên môn cho từng cấp bậc của phòng ban. Tên này sẽ hiển thị
                trên Profile và Badge của nhân sự trực thuộc.
              </Text>

              {configs.map((item) => {
                const colorHex = LEVEL_COLORS[item.levelNumber] || '#2196F3';
                return (
                  <View key={item.levelNumber} style={styles.levelRowCard}>
                    <View style={styles.levelHeader}>
                      <View style={[styles.levelDot, { backgroundColor: colorHex }]} />
                      <Text style={[styles.levelLabel, { color: colorHex }]}>
                        Level {item.levelNumber} (Mặc định: {LEVEL_DEFAULT_NAMES[item.levelNumber]})
                      </Text>
                    </View>
                    <TextInput
                      style={styles.input}
                      placeholder={`VD: ${item.levelNumber === 2 ? 'Host Live chính thức' : 'Video Editor'}`}
                      placeholderTextColor="#94A3B8"
                      value={item.customLevelName}
                      onChangeText={(txt) => handleNameChange(item.levelNumber, txt)}
                    />
                  </View>
                );
              })}
            </ScrollView>
          )}

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={isSaving}>
              <Text style={styles.cancelBtnText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={isSaving || isLoading}>
              {isSaving ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Ionicons name="save" size={18} color="#FFF" style={{ marginRight: 6 }} />
                  <Text style={styles.saveBtnText}>Lưu Cấu Hình</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 30 : 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  loadingBox: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748B',
  },
  body: {
    padding: 16,
  },
  guideText: {
    fontSize: 12,
    color: '#475569',
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
    lineHeight: 18,
  },
  levelRowCard: {
    marginBottom: 14,
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  levelDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  levelLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    color: '#0F172A',
    backgroundColor: '#FAFAFA',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  saveBtn: {
    flex: 2,
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
});
