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
  onEditLevelReward: (level: AdminLevelItem) => void;
  onAddNewLevel: () => void;
  onNextToProjects: () => void;
}

export const AdminLevelRewardsPage: React.FC<AdminLevelRewardsPageProps> = ({
  departmentName,
  levels,
  onEditLevelReward,
  onAddNewLevel,
  onNextToProjects,
}) => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionHeaderTitle}>CẤU HÌNH QUÀ THƯỞNG CHO PHÒNG BAN:</Text>
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

              <TouchableOpacity style={styles.editBtn} onPress={() => onEditLevelReward(lvl)}>
                <Text style={styles.editBtnText}>Chỉnh sửa quà</Text>
              </TouchableOpacity>
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
        <Text style={styles.nextStepBtnText}>TIẾP THEO: THIẾT LẬP DỰ ÁN & VIỆC CON →</Text>
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
