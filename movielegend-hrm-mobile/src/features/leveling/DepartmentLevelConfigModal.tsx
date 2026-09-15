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
  const [configs, setConfigs] = useState<DepartmentLevelItem[]>([]);
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
        setConfigs(data);
      } else {
        // Default 8 levels
        setConfigs(
          Array.from({ length: 8 }, (_, i) => ({
            levelNumber: i + 1,
            levelName: `Level ${i + 1}`,
            defaultName: LEVEL_DEFAULT_NAMES[i + 1] || `Level ${i + 1}`,
            customLevelName: LEVEL_DEFAULT_NAMES[i + 1] || `Level ${i + 1}`,
            displayName: LEVEL_DEFAULT_NAMES[i + 1] || `Level ${i + 1}`,
            badgeTitle: LEVEL_DEFAULT_NAMES[i + 1] || `Level ${i + 1}`,
            colorHex: LEVEL_COLORS[i + 1] || '#2196F3',
            minTenureMonths: (i + 1) * 3,
            targetShiftsCount: (i + 1) * 30,
            rewardType: 'HYBRID',
            promotionBonusAmount: i >= 1 ? i * 500000 : 0,
            physicalItemName: i === 1 ? 'Huy hiệu nhân viên chính thức + Áo đồng phục' : '',
            allowanceAmount: i >= 1 ? i * 300000 : 0,
            retentionMultiplier: 1.0 + i * 0.2,
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
          ? { ...item, customLevelName: text, displayName: text, badgeTitle: text }
          : item,
      ),
    );
  };

  const handleRewardTypeChange = (levelNumber: number, rewardType: 'CASH' | 'PHYSICAL_ITEM' | 'HYBRID') => {
    setConfigs((prev) =>
      prev.map((item) => (item.levelNumber === levelNumber ? { ...item, rewardType } : item)),
    );
  };

  const handleBonusAmountChange = (levelNumber: number, amount: number) => {
    setConfigs((prev) =>
      prev.map((item) => (item.levelNumber === levelNumber ? { ...item, promotionBonusAmount: amount } : item)),
    );
  };

  const handlePhysicalItemChange = (levelNumber: number, physicalItemName: string) => {
    setConfigs((prev) =>
      prev.map((item) => (item.levelNumber === levelNumber ? { ...item, physicalItemName } : item)),
    );
  };

  const handleAllowanceChange = (levelNumber: number, allowanceAmount: number) => {
    setConfigs((prev) =>
      prev.map((item) => (item.levelNumber === levelNumber ? { ...item, allowanceAmount } : item)),
    );
  };

  const handleMultiplierChange = (levelNumber: number, multiplier: number) => {
    setConfigs((prev) =>
      prev.map((item) => (item.levelNumber === levelNumber ? { ...item, retentionMultiplier: multiplier } : item)),
    );
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await levelingApi.saveDepartmentLevelConfigs(
        departmentId,
        configs.map((c) => ({
          levelNumber: c.levelNumber,
          customLevelName: c.customLevelName || c.defaultName,
          badgeTitle: c.badgeTitle || c.defaultName,
          rewardType: c.rewardType || 'HYBRID',
          promotionBonusAmount: c.promotionBonusAmount || 0,
          physicalItemName: c.physicalItemName || '',
          allowanceAmount: c.allowanceAmount || 0,
          retentionMultiplier: c.retentionMultiplier || 1.0,
          perks: c.perks || [],
          motivationQuote: c.motivationQuote || '',
        })),
      );
      Alert.alert('Thành công', `Đã lưu cấu hình danh xưng & phần thưởng cấp bậc cho phòng ${departmentName}!`);
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
              <Text style={styles.title}>Cấu Hình Danh Xưng & Phần Thưởng</Text>
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
                💡 Tùy biến tên gọi chuyên môn & phần thưởng thăng cấp (tiền mặt / hiện vật) từ Level 2 trở lên. Dữ liệu sẽ tự động đồng bộ vào Phụ Lục Quyền Lợi của nhân sự.
              </Text>

              {configs.map((item) => {
                const colorHex = LEVEL_COLORS[item.levelNumber] || '#2196F3';
                const isLevelOne = item.levelNumber === 1;

                return (
                  <View key={item.levelNumber} style={styles.levelRowCard}>
                    <View style={styles.levelHeader}>
                      <View style={[styles.levelDot, { backgroundColor: colorHex }]} />
                      <Text style={[styles.levelLabel, { color: colorHex }]}>
                        Level {item.levelNumber} (Mặc định: {LEVEL_DEFAULT_NAMES[item.levelNumber] || `Level ${item.levelNumber}`})
                      </Text>
                    </View>

                    <Text style={styles.subInputLabel}>Tên Danh Xưng Cấp Bậc:</Text>
                    <TextInput
                      style={styles.input}
                      placeholder={`VD: ${item.levelNumber === 2 ? 'Host Live chính thức' : 'Video Editor'}`}
                      placeholderTextColor="#94A3B8"
                      value={item.customLevelName}
                      onChangeText={(txt) => handleNameChange(item.levelNumber, txt)}
                    />

                    {isLevelOne ? (
                      <Text style={styles.levelOneHint}>
                        🌱 Cấp bậc khởi đầu (Thực tập) - Không áp dụng phần thưởng thăng cấp.
                      </Text>
                    ) : (
                      <View style={styles.rewardConfigSubBox}>
                        <Text style={styles.rewardSubTitle}>
                          🎁 PHẦN THƯỞNG ĐẠT LEVEL {item.levelNumber}
                        </Text>

                        {/* Reward Type Picker */}
                        <View style={styles.rewardTypeRow}>
                          <TouchableOpacity
                            style={[
                              styles.rewardTypePill,
                              item.rewardType === 'CASH' && styles.rewardTypePillActive,
                            ]}
                            onPress={() => handleRewardTypeChange(item.levelNumber, 'CASH')}
                          >
                            <Text
                              style={[
                                styles.rewardTypePillText,
                                item.rewardType === 'CASH' && styles.rewardTypePillTextActive,
                              ]}
                            >
                              💵 Tiền mặt
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[
                              styles.rewardTypePill,
                              item.rewardType === 'PHYSICAL_ITEM' && styles.rewardTypePillActive,
                            ]}
                            onPress={() => handleRewardTypeChange(item.levelNumber, 'PHYSICAL_ITEM')}
                          >
                            <Text
                              style={[
                                styles.rewardTypePillText,
                                item.rewardType === 'PHYSICAL_ITEM' && styles.rewardTypePillTextActive,
                              ]}
                            >
                              🎁 Hiện vật
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[
                              styles.rewardTypePill,
                              (item.rewardType === 'HYBRID' || !item.rewardType) && styles.rewardTypePillActive,
                            ]}
                            onPress={() => handleRewardTypeChange(item.levelNumber, 'HYBRID')}
                          >
                            <Text
                              style={[
                                styles.rewardTypePillText,
                                (item.rewardType === 'HYBRID' || !item.rewardType) && styles.rewardTypePillTextActive,
                              ]}
                            >
                              ✨ Kết hợp
                            </Text>
                          </TouchableOpacity>
                        </View>

                        {/* Cash Amount */}
                        {(item.rewardType === 'CASH' || item.rewardType === 'HYBRID' || !item.rewardType) && (
                          <View style={{ marginTop: 8 }}>
                            <Text style={styles.subInputLabel}>Tiền Thưởng Thăng Cấp (VNĐ):</Text>
                            <TextInput
                              style={styles.subInput}
                              keyboardType="number-pad"
                              placeholder="VD: 1000000"
                              placeholderTextColor="#94A3B8"
                              value={item.promotionBonusAmount ? String(item.promotionBonusAmount) : ''}
                              onChangeText={(txt) =>
                                handleBonusAmountChange(item.levelNumber, Number(txt.replace(/[^0-9]/g, '')) || 0)
                              }
                            />
                            {Boolean(item.promotionBonusAmount && item.promotionBonusAmount > 0) && (
                              <Text style={styles.previewCashText}>
                                💰 Thưởng: {item.promotionBonusAmount?.toLocaleString('vi-VN')} VNĐ
                              </Text>
                            )}
                          </View>
                        )}

                        {/* Physical Gift */}
                        {(item.rewardType === 'PHYSICAL_ITEM' || item.rewardType === 'HYBRID' || !item.rewardType) && (
                          <View style={{ marginTop: 8 }}>
                            <Text style={styles.subInputLabel}>Quà Tặng Hiện Vật:</Text>
                            <TextInput
                              style={styles.subInput}
                              placeholder="VD: Kỷ niệm chương, Balo, Áo đồng phục VIP..."
                              placeholderTextColor="#94A3B8"
                              value={item.physicalItemName || ''}
                              onChangeText={(txt) => handlePhysicalItemChange(item.levelNumber, txt)}
                            />
                          </View>
                        )}

                        {/* Allowance */}
                        <View style={{ marginTop: 8 }}>
                          <Text style={styles.subInputLabel}>Phụ Cấp Chức Danh (VNĐ/tháng):</Text>
                          <TextInput
                            style={styles.subInput}
                            keyboardType="number-pad"
                            placeholder="VD: 500000"
                            placeholderTextColor="#94A3B8"
                            value={item.allowanceAmount ? String(item.allowanceAmount) : ''}
                            onChangeText={(txt) =>
                              handleAllowanceChange(item.levelNumber, Number(txt.replace(/[^0-9]/g, '')) || 0)
                            }
                          />
                        </View>
                      </View>
                    )}
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
  subInputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 4,
    marginTop: 4,
  },
  subInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 13,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
  },
  levelOneHint: {
    fontSize: 11,
    color: '#059669',
    fontStyle: 'italic',
    marginTop: 6,
    backgroundColor: '#ECFDF5',
    padding: 8,
    borderRadius: 6,
  },
  rewardConfigSubBox: {
    marginTop: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 10,
  },
  rewardSubTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E40AF',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  rewardTypeRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 4,
  },
  rewardTypePill: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardTypePillActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  rewardTypePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  rewardTypePillTextActive: {
    color: '#1D4ED8',
    fontWeight: '700',
  },
  previewCashText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
    marginTop: 3,
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
