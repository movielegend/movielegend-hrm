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
        {levels.map((lvl) => (
          <View key={lvl.id} style={styles.levelRewardCard}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.badgeGroup}>
                <View style={[styles.colorBadge, { backgroundColor: lvl.colorHex }]}>
                  <Text style={styles.colorBadgeText}>LEVEL {lvl.levelNumber}</Text>
                </View>
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
              <Text style={styles.rewardTitle}>
                Quà Hiện Vật: <Text style={styles.rewardTitleBold}>{lvl.physicalItemName}</Text>
              </Text>
              <Text style={styles.rewardBonus}>
                Thưởng nóng thăng cấp: {lvl.promotionBonusAmount.toLocaleString('vi-VN')} VNĐ
              </Text>
              <Text style={styles.rewardBonus}>
                Hệ số Ví Điểm Tết: {lvl.retentionMultiplier}x
              </Text>
            </View>
          </View>
        ))}
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
  rewardContentBox: {
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
