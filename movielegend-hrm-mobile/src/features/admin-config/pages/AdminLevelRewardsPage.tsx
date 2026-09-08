import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import type { AdminLevelItem } from '../AdminLevelConfigScreen';

interface AdminLevelRewardsPageProps {
  departmentName: string;
  levels: AdminLevelItem[];
  selectedYear: number;
  availableYears: number[];
  onSelectYear: (year: number) => void;
  onAddNewYear: () => void;
  onEditLevelReward: (level: AdminLevelItem) => void;
  onDeleteLevel: (levelId: string, levelNumber: number) => void;
  onAddNewLevel: () => void;
  onNextToProjects: () => void;
}

export const AdminLevelRewardsPage: React.FC<AdminLevelRewardsPageProps> = ({
  departmentName,
  levels,
  selectedYear,
  availableYears,
  onSelectYear,
  onAddNewYear,
  onEditLevelReward,
  onDeleteLevel,
  onAddNewLevel,
  onNextToProjects,
}) => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      {/* Year Selector Bar */}
      <Text style={styles.yearSubLabel}>CHỌN NĂM CẤU HÌNH LEVEL (12 THÁNG/NĂM):</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.yearScrollRow}>
        {availableYears.map((yr) => (
          <TouchableOpacity
            key={yr}
            style={[styles.yearPill, selectedYear === yr && styles.yearPillActive]}
            onPress={() => onSelectYear(yr)}
          >
            <Text style={[styles.yearPillText, selectedYear === yr && styles.yearPillTextActive]}>
              NĂM {yr}
            </Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={styles.addYearBtn} onPress={onAddNewYear}>
          <Text style={styles.addYearBtnText}>+ Thêm Năm Mới</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionHeaderTitle}>CẤU HÌNH QUÀ THƯỞNG (NĂM {selectedYear}):</Text>
          <Text style={styles.deptTitle}>{departmentName.toUpperCase()}</Text>
        </View>

        <TouchableOpacity style={styles.addBtn} onPress={onAddNewLevel}>
          <Text style={styles.addBtnText}>+ THÊM LEVEL</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.levelsList}>
        {levels.map((lvl) => {
          const hasCash = lvl.promotionBonusAmount > 0;
          const hasPhysical = Boolean(lvl.physicalItemName?.trim());
          const isHybrid = hasCash && hasPhysical;

          return (
            <View key={lvl.id} style={styles.levelRewardCard}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.badgeGroup}>
                  <View style={[styles.colorBadge, { backgroundColor: lvl.colorHex }]}>
                    <Text style={styles.colorBadgeText}>LEVEL {lvl.levelNumber}</Text>
                  </View>
                  <Text style={styles.levelCardName}>{lvl.levelName}</Text>
                </View>

                <View style={styles.levelCardActions}>
                  <TouchableOpacity style={styles.editPillBtn} onPress={() => onEditLevelReward(lvl)}>
                    <Text style={styles.editPillBtnText}>Sửa</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.deletePillBtn} onPress={() => onDeleteLevel(lvl.id, lvl.levelNumber)}>
                    <Text style={styles.deletePillBtnText}>Xóa</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.rewardContentBox}>
                <View style={styles.rewardTypeHeaderRow}>
                  <View style={styles.rewardTypeBadge}>
                    <Text style={styles.rewardTypeBadgeText}>
                      {isHybrid ? '✨ TIỀN MẶT + HIỆN VẬT' : hasCash ? '💵 TIỀN MẶT' : hasPhysical ? '🎁 HIỆN VẬT' : 'CHƯA CẤU HÌNH'}
                    </Text>
                  </View>
                </View>

                {hasCash && (
                  <View style={styles.rewardRow}>
                    <Text style={styles.rewardIcon}>💵</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rewardCashAmount}>
                        {lvl.promotionBonusAmount.toLocaleString('vi-VN')} VNĐ
                      </Text>
                      <Text style={styles.rewardCashSub}>
                        Chia theo Hệ số Level cho các thành viên tham gia
                      </Text>
                    </View>
                  </View>
                )}

                {hasPhysical && (
                  <View style={styles.rewardRow}>
                    <Text style={styles.rewardIcon}>🎁</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rewardItemTextBold}>{lvl.physicalItemName}</Text>
                      <Text style={styles.rewardItemSub}>Hiện vật để chung cho cả team</Text>
                    </View>
                  </View>
                )}

                {Boolean(lvl.allowanceAmount && lvl.allowanceAmount > 0) && (
                  <View style={styles.rewardRow}>
                    <Text style={styles.rewardIcon}>💼</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rewardItemTextBold}>
                        +{lvl.allowanceAmount.toLocaleString('vi-VN')} VNĐ/tháng
                      </Text>
                      <Text style={styles.rewardItemSub}>Phụ cấp chức danh / chuyên môn</Text>
                    </View>
                  </View>
                )}

                <View style={styles.perksMetaRow}>
                  <Text style={styles.perksMetaText}>
                    Hệ số ví Tết: <Text style={{ fontWeight: 'bold', color: '#1E40AF' }}>{lvl.retentionMultiplier || 1.0}x</Text>
                    {Array.isArray(lvl.perks) && lvl.perks.length > 0 ? ` • ${lvl.perks.length} đặc quyền mở khóa` : ''}
                  </Text>
                </View>

                {!hasCash && !hasPhysical && (
                  <Text style={styles.emptyRewardNotice}>
                    Chưa thiết lập phần thưởng cho Level {lvl.levelNumber}. Bấm "Sửa" để cấu hình.
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </View>

      <TouchableOpacity style={styles.nextStepBtn} onPress={onNextToProjects}>
        <Text style={styles.nextStepBtnText}>TIẾP THEO: THIẾT LẬP DỰ ÁN NĂM {selectedYear} →</Text>
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
  yearSubLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  yearScrollRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  yearPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  yearPillActive: {
    backgroundColor: '#1E40AF',
    borderColor: '#1E40AF',
  },
  yearPillText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#475569',
  },
  yearPillTextActive: {
    color: '#FFFFFF',
  },
  addYearBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#94A3B8',
    borderStyle: 'dashed',
  },
  addYearBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#2563EB',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
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
  addBtn: {
    backgroundColor: '#1E40AF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  levelsList: {
    gap: 12,
    marginBottom: 16,
  },
  levelRewardCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  badgeGroup: {
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
  levelCardActions: {
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
  levelName: {
    fontSize: 14,
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
  levelCardName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  rewardContentBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    borderRadius: 10,
    gap: 8,
  },
  rewardTypeHeaderRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  rewardTypeBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  rewardTypeBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1E40AF',
    letterSpacing: 0.5,
  },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  rewardIcon: {
    fontSize: 16,
    marginTop: 1,
  },
  rewardCashAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#059669',
  },
  rewardCashSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  rewardItemTextBold: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
  },
  rewardItemSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  emptyRewardNotice: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#94A3B8',
  },
  nextStepBtn: {
    backgroundColor: '#059669',
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  nextStepBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
    letterSpacing: 0.5,
  },
});
