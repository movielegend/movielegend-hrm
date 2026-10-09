import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { levelingApi, DepartmentLevelItem } from '../../api/leveling.api';
import { LEVEL_DEFAULT_NAMES } from '../../components/common/LevelNameBadge';
import { CustomAlert } from '../../components/CustomAlert';

export interface DirectLevelChangeModalProps {
  visible: boolean;
  targetUser: {
    id: string;
    fullName: string;
    currentLevelNumber: number;
    departmentName?: string;
  } | null;
  isAdmin?: boolean;
  levelConfigs?: DepartmentLevelItem[];
  onClose: () => void;
  onSuccess: () => void;
}

export const DirectLevelChangeModal: React.FC<DirectLevelChangeModalProps> = ({
  visible,
  targetUser,
  isAdmin = false,
  levelConfigs = [],
  onClose,
  onSuccess,
}) => {
  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (targetUser) {
      setSelectedLevel(targetUser.currentLevelNumber || 1);
    }
  }, [targetUser]);

  if (!targetUser) return null;

  const maxAllowedLevel = isAdmin ? 8 : 4;
  const availableLevels = Array.from({ length: maxAllowedLevel }, (_, i) => i + 1);

  const getInitials = (name?: string) => {
    if (!name) return 'NV';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'NV';
    if (parts.length === 1) return parts[0] ? parts[0].substring(0, 2).toUpperCase() : 'NV';
    const first = parts[0]?.charAt(0) || '';
    const last = parts[parts.length - 1]?.charAt(0) || '';
    return (first + last).toUpperCase() || 'NV';
  };

  const getLevelTitle = (levelNumber: number) => {
    const found = levelConfigs.find((c) => c.levelNumber === levelNumber);
    if (found?.customLevelName && found.customLevelName.trim()) {
      return found.customLevelName.trim();
    }
    if (found?.displayName && found.displayName.trim()) {
      return found.displayName.trim();
    }
    return LEVEL_DEFAULT_NAMES[levelNumber] || `Level ${levelNumber}`;
  };

  const isSameLevel = selectedLevel === targetUser.currentLevelNumber;

  const handleSubmit = async () => {
    if (isSameLevel) return;

    try {
      setIsSubmitting(true);
      await levelingApi.setDirectUserLevel(
        targetUser.id,
        selectedLevel,
        isAdmin ? 'Admin đổi cấp trực tiếp' : 'Leader đổi cấp trực tiếp',
      );

      CustomAlert.alert(
        'Thành công',
        `Đã cập nhật cấp bậc của ${targetUser.fullName} thành Level ${selectedLevel} · ${getLevelTitle(selectedLevel)}!`,
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      CustomAlert.alert(
        'Lỗi cập nhật',
        err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi đổi cấp bậc',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Drag handle */}
          <View style={styles.dragHandle} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Đổi cấp bậc</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={8}>
              <Ionicons name="close" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* User Info Card */}
          <View style={styles.userCard}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{getInitials(targetUser.fullName)}</Text>
            </View>
            <View style={styles.userMetaCol}>
              <Text style={styles.userName}>{targetUser.fullName}</Text>
              <Text style={styles.userCurrentLevel}>
                Hiện tại: Level {targetUser.currentLevelNumber} · {getLevelTitle(targetUser.currentLevelNumber)}
              </Text>
            </View>
          </View>

          {/* Section: Chọn cấp bậc mới */}
          <Text style={styles.sectionLabel}>Chọn cấp bậc mới</Text>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            <View style={styles.levelOptionsContainer}>
              {availableLevels.map((lvl) => {
                const isSelected = selectedLevel === lvl;
                const isCurrent = targetUser.currentLevelNumber === lvl;
                const formattedNum = String(lvl).padStart(2, '0');
                const levelTitle = getLevelTitle(lvl);

                return (
                  <TouchableOpacity
                    key={lvl}
                    style={[
                      styles.levelOptionRow,
                      isSelected && styles.levelOptionRowSelected,
                    ]}
                    onPress={() => setSelectedLevel(lvl)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.levelOptionLeft}>
                      <View style={[styles.numBadge, (isSelected || isCurrent) && styles.numBadgeHighlight]}>
                        <Text style={[styles.numBadgeText, (isSelected || isCurrent) && styles.numBadgeTextHighlight]}>
                          {formattedNum}
                        </Text>
                      </View>
                      <Text style={styles.levelNameText}>{levelTitle}</Text>
                      {isCurrent && (
                        <View style={styles.currentBadge}>
                          <Text style={styles.currentBadgeText}>Hiện tại</Text>
                        </View>
                      )}
                    </View>

                    {/* Radio Button */}
                    <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                      {isSelected && <View style={styles.radioDot} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.hintText}>Chọn cấp bậc khác để xác nhận.</Text>
          </ScrollView>

          {/* Footer Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={isSubmitting}>
              <Text style={styles.cancelBtnText}>Hủy</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.confirmBtn,
                !isSameLevel && styles.confirmBtnActive,
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting || isSameLevel}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text
                  style={[
                    styles.confirmBtnText,
                    !isSameLevel && styles.confirmBtnTextActive,
                  ]}
                >
                  Xác nhận đổi cấp
                </Text>
              )}
            </TouchableOpacity>
          </View>
          <SafeAreaView edges={['bottom']} />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: '90%',
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  closeBtn: {
    padding: 4,
  },

  /* User Info Card */
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 16,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1B3B2B',
  },
  userMetaCol: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  userCurrentLevel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },

  /* Section */
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 10,
  },
  body: {
    maxHeight: 380,
  },
  levelOptionsContainer: {
    gap: 8,
  },
  levelOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  levelOptionRowSelected: {
    borderColor: '#1B3B2B',
    backgroundColor: '#F0FDF4',
  },
  levelOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  numBadge: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  numBadgeHighlight: {
    backgroundColor: '#E8F5E9',
  },
  numBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  numBadgeTextHighlight: {
    color: '#1B3B2B',
  },
  levelNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  currentBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  currentBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1B3B2B',
  },

  /* Radio Button */
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: '#1B3B2B',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#1B3B2B',
  },

  hintText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 10,
    marginBottom: 8,
    fontStyle: 'italic',
  },

  /* Footer */
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    marginTop: 8,
    marginBottom: 12,
  },
  cancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  confirmBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnActive: {
    backgroundColor: '#1B3B2B',
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#94A3B8',
  },
  confirmBtnTextActive: {
    color: '#FFFFFF',
  },
});
