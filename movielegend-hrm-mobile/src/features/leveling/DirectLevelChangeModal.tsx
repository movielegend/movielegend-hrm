import React, { useState } from 'react';
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
import { levelingApi } from '../../api/leveling.api';
import { LEVEL_COLORS, LEVEL_DEFAULT_NAMES, LevelNameBadge } from '../../components/common/LevelNameBadge';

interface DirectLevelChangeModalProps {
  visible: boolean;
  targetUser: {
    id: string;
    fullName: string;
    currentLevelNumber: number;
    departmentName?: string;
  } | null;
  isAdmin?: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const DirectLevelChangeModal: React.FC<DirectLevelChangeModalProps> = ({
  visible,
  targetUser,
  isAdmin = false,
  onClose,
  onSuccess,
}) => {
  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (targetUser) {
      setSelectedLevel(targetUser.currentLevelNumber || 1);
      setNote('');
    }
  }, [targetUser]);

  if (!targetUser) return null;

  const maxAllowedLevel = isAdmin ? 8 : 4;
  const availableLevels = Array.from({ length: maxAllowedLevel }, (_, i) => i + 1);

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      await levelingApi.setDirectUserLevel(
        targetUser.id,
        selectedLevel,
        note.trim() || 'Leader đổi cấp trực tiếp',
      );

      Alert.alert(
        'Thành công',
        `Đã cập nhật cấp bậc của ${targetUser.fullName} thành Level ${selectedLevel} - ${LEVEL_DEFAULT_NAMES[selectedLevel]}!`,
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      Alert.alert('Lỗi cập nhật', err?.response?.data?.message || err?.message || 'Có lỗi xảy ra');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Đổi Cấp Bậc Nhân Viên</Text>
              <Text style={styles.subtitle}>
                Nhân sự: <Text style={{ fontWeight: '700' }}>{targetUser.fullName}</Text>
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionLabel}>Chọn Cấp Bậc Mới:</Text>
            <View style={styles.levelOptionsContainer}>
              {availableLevels.map((lvl) => {
                const isSelected = selectedLevel === lvl;
                const colorHex = LEVEL_COLORS[lvl] || '#2196F3';
                const levelName = LEVEL_DEFAULT_NAMES[lvl] || `Level ${lvl}`;

                return (
                  <TouchableOpacity
                    key={lvl}
                    style={[
                      styles.levelOptionCard,
                      isSelected && { borderColor: colorHex, backgroundColor: `${colorHex}10` },
                    ]}
                    onPress={() => setSelectedLevel(lvl)}
                  >
                    <View style={styles.levelOptionLeft}>
                      <View
                        style={[
                          styles.radioCircle,
                          isSelected && { borderColor: colorHex },
                        ]}
                      >
                        {isSelected && (
                          <View style={[styles.radioDot, { backgroundColor: colorHex }]} />
                        )}
                      </View>
                      <View>
                        <Text style={[styles.levelOptionNumber, { color: colorHex }]}>
                          Level {lvl}
                        </Text>
                        <Text style={styles.levelOptionName}>{levelName}</Text>
                      </View>
                    </View>

                    <View
                      style={[
                        styles.badgeTag,
                        { backgroundColor: `${colorHex}20`, borderColor: `${colorHex}40` },
                      ]}
                    >
                      <Text style={[styles.badgeTagText, { color: colorHex }]}>
                        {levelName}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {!isAdmin && (
              <View style={styles.limitNotice}>
                <Ionicons name="information-circle-outline" size={16} color="#64748B" />
                <Text style={styles.limitNoticeText}>
                  Leader có quyền set từ Level 1 đến Level 4. Cấp Level 5+ cần do Ban Giám Đốc phê duyệt.
                </Text>
              </View>
            )}

            {/* Note Input */}
            <Text style={styles.sectionLabel}>Lý do / Ghi chú thay đổi:</Text>
            <TextInput
              style={styles.textArea}
              placeholder="VD: Đã ký hợp đồng chính thức / Đạt thành tích xuất sắc quý..."
              placeholderTextColor="#94A3B8"
              value={note}
              onChangeText={setNote}
            />
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={isSubmitting}>
              <Text style={styles.cancelBtnText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.confirmBtn,
                { backgroundColor: LEVEL_COLORS[selectedLevel] || '#2196F3' },
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.confirmBtnText}>Xác Nhận Đổi Level</Text>
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
    maxHeight: '88%',
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
  body: {
    padding: 16,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 10,
  },
  levelOptionsContainer: {
    gap: 8,
    marginBottom: 14,
  },
  levelOptionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FAFAFA',
  },
  levelOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  levelOptionNumber: {
    fontSize: 15,
    fontWeight: '700',
  },
  levelOptionName: {
    fontSize: 13,
    color: '#475569',
    marginTop: 1,
  },
  badgeTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeTagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  limitNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    padding: 10,
    borderRadius: 8,
    marginBottom: 14,
    gap: 6,
  },
  limitNoticeText: {
    fontSize: 12,
    color: '#64748B',
    flex: 1,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
    marginBottom: 16,
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
  confirmBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
});
