import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../providers/AuthProvider';

export interface LevelPerkItem {
  id: string;
  iconName: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  title: string;
}

export interface LevelTierConfig {
  levelNumber: number;
  levelName: string;
  titleName: string;
  badgeColor: string;
  isUnlocked: boolean;
  perks: LevelPerkItem[];
  retentionFloorGmv: number;
  promotionCeilingGmv: number;
  currentGmv: number;
}

export const TikTokStyleLevelingScreen: React.FC = () => {
  const { user } = useAuth();
  const [selectedLevel, setSelectedLevel] = useState<number>(5);

  const levels: LevelTierConfig[] = [
    {
      levelNumber: 1,
      levelName: 'Level 1',
      titleName: 'Cấp Bậc Level 1',
      badgeColor: '#64748B',
      isUnlocked: true,
      perks: [
        { id: 'p1', iconName: 'ticket', iconColor: '#EF4444', title: 'Voucher Sinh nhật 200k' },
        { id: 'p2', iconName: 'car', iconColor: '#3B82F6', title: 'Phụ cấp gửi xe 100%' },
      ],
      retentionFloorGmv: 0,
      promotionCeilingGmv: 50,
      currentGmv: 50,
    },
    {
      levelNumber: 2,
      levelName: 'Level 2',
      titleName: 'Cấp Bậc Level 2',
      badgeColor: '#2563EB',
      isUnlocked: true,
      perks: [
        { id: 'p3', iconName: 'cash', iconColor: '#10B981', title: 'Thưởng 1.000.000đ tiền mặt' },
        { id: 'p4', iconName: 'shield-checkmark', iconColor: '#6366F1', title: 'Bảo hiểm Y tế / Tai nạn' },
      ],
      retentionFloorGmv: 30,
      promotionCeilingGmv: 150,
      currentGmv: 150,
    },
    {
      levelNumber: 3,
      levelName: 'Level 3',
      titleName: 'Cấp Bậc Level 3',
      badgeColor: '#0D9488',
      isUnlocked: true,
      perks: [
        { id: 'p5', iconName: 'headset', iconColor: '#EC4899', title: 'Tai nghe Bluetooth Chống ồn' },
        { id: 'p6', iconName: 'school', iconColor: '#8B5CF6', title: 'Ngân sách Đào tạo 2tr/năm' },
      ],
      retentionFloorGmv: 80,
      promotionCeilingGmv: 300,
      currentGmv: 300,
    },
    {
      levelNumber: 4,
      levelName: 'Level 4',
      titleName: 'Cấp Bậc Level 4',
      badgeColor: '#7C3AED',
      isUnlocked: true,
      perks: [
        { id: 'p7', iconName: 'tablet-landscape', iconColor: '#3B82F6', title: 'Thưởng Máy tính bảng iPad' },
        { id: 'p8', iconName: 'heart', iconColor: '#EF4444', title: 'BH Sức khỏe Cá nhân cao cấp' },
      ],
      retentionFloorGmv: 150,
      promotionCeilingGmv: 500,
      currentGmv: 500,
    },
    {
      levelNumber: 5,
      levelName: 'Level 5',
      titleName: 'Cấp Bậc Level 5',
      badgeColor: '#EA580C',
      isUnlocked: true,
      perks: [
        { id: 'p9', iconName: 'laptop', iconColor: '#F59E0B', title: 'THƯỞNG LAPTOP MACBOOK AIR M3' },
        { id: 'p10', iconName: 'briefcase', iconColor: '#10B981', title: 'Thưởng tiền mặt 8.000.000đ' },
        { id: 'p11', iconName: 'people', iconColor: '#8B5CF6', title: 'Phụ cấp cấp độ 2.000.000đ/tháng' },
        { id: 'p12', iconName: 'gift', iconColor: '#EC4899', title: 'Hệ số Ví Điểm Thưởng Tết 1.6x' },
      ],
      retentionFloorGmv: 250,
      promotionCeilingGmv: 820,
      currentGmv: 520,
    },
    {
      levelNumber: 6,
      levelName: 'Level 6',
      titleName: 'Cấp Bậc Level 6',
      badgeColor: '#DC2626',
      isUnlocked: false,
      perks: [
        { id: 'p13', iconName: 'laptop-outline', iconColor: '#DC2626', title: 'THƯỞNG MACBOOK PRO M-SERIES + iPhone' },
        { id: 'p14', iconName: 'ribbon', iconColor: '#D97706', title: 'Phụ cấp cấp độ 5.000.000đ/tháng' },
      ],
      retentionFloorGmv: 500,
      promotionCeilingGmv: 1500,
      currentGmv: 0,
    },
    {
      levelNumber: 7,
      levelName: 'Level 7',
      titleName: 'Cấp Bậc Level 7',
      badgeColor: '#D97706',
      isUnlocked: false,
      perks: [
        { id: 'p15', iconName: 'diamond', iconColor: '#D97706', title: 'THƯỞNG MACBOOK PRO MAX + 1 CÂY VÀNG 9999' },
        { id: 'p16', iconName: 'airplane', iconColor: '#2563EB', title: 'Du lịch 5 sao + Cổ phần ESOP' },
      ],
      retentionFloorGmv: 1000,
      promotionCeilingGmv: 3000,
      currentGmv: 0,
    },
    {
      levelNumber: 8,
      levelName: 'Level 8',
      titleName: 'Cấp Bậc Level 8',
      badgeColor: '#7C2D12',
      isUnlocked: false,
      perks: [
        { id: 'p17', iconName: 'car-sport', iconColor: '#7C2D12', title: 'XE CÔNG VỤ + GÓI CỔ PHẦN ESOP DOANH NGHIỆP' },
      ],
      retentionFloorGmv: 2000,
      promotionCeilingGmv: 5000,
      currentGmv: 0,
    },
  ];

  const currentTier = levels.find((l) => l.levelNumber === selectedLevel) || levels[4];
  const progressPercent = Math.min(
    100,
    Math.max(0, (currentTier.currentGmv / currentTier.promotionCeilingGmv) * 100)
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#111827" />

      {/* Header Level Navigation Carousel (TikTok Style Header) */}
      <View style={styles.darkHeader}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.closeBtn}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.topTitle}>Cấp Của Bạn</Text>
          <TouchableOpacity style={styles.helpBtn}>
            <Ionicons name="help-circle-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Level Selector Carousel Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.levelCarousel}>
          {levels.map((lvl) => (
            <TouchableOpacity
              key={lvl.levelNumber}
              style={[
                styles.levelPill,
                selectedLevel === lvl.levelNumber && styles.levelPillActive,
              ]}
              onPress={() => setSelectedLevel(lvl.levelNumber)}
            >
              <Text
                style={[
                  styles.levelPillText,
                  selectedLevel === lvl.levelNumber && styles.levelPillTextActive,
                ]}
              >
                {!lvl.isUnlocked ? `🔒 Level ${lvl.levelNumber}` : `Level ${lvl.levelNumber}`}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* 3D Rank Badge & Title Header */}
        <View style={styles.badgeSection}>
          <View style={styles.badgeTextGroup}>
            <View style={styles.rankBadgeTag}>
              <Ionicons name="sparkles" size={12} color="#F59E0B" />
              <Text style={styles.rankBadgeTagText}>{currentTier.titleName}</Text>
            </View>
            <Text style={styles.levelBigTitle}>{currentTier.levelName}</Text>
          </View>

          {/* 3D Crown Icon */}
          <View style={[styles.crownIconContainer, { backgroundColor: currentTier.badgeColor + '33' }]}>
            <Ionicons name="trophy" size={56} color={currentTier.badgeColor} />
          </View>
        </View>

        {/* Perks Grid in Current Level */}
        <View style={styles.perksSection}>
          <Text style={styles.perksTitle}>Lợi ích ở cấp này &rsaquo;</Text>
          <View style={styles.perksGrid}>
            {currentTier.perks.map((perk) => (
              <View key={perk.id} style={styles.perkItem}>
                <View style={styles.perkIconBox}>
                  <Ionicons name={perk.iconName} size={24} color={perk.iconColor} />
                </View>
                <Text style={styles.perkText} numberOfLines={2}>
                  {perk.title}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* White Body Content Section */}
      <ScrollView style={styles.whiteBody} showsVerticalScrollIndicator={false}>
        {/* Monthly Challenge Banner */}
        <View style={styles.challengeCardHeader}>
          <View style={styles.challengeHeaderRow}>
            <View style={styles.challengeTitleGroup}>
              <Ionicons name="gift-sharp" size={18} color="#FFFFFF" />
              <Text style={styles.challengeTitle}>Thử thách Tháng 9</Text>
            </View>
            <View style={styles.timerTag}>
              <Ionicons name="time-outline" size={14} color="#FFFFFF" />
              <Text style={styles.timerText}>Còn 28 ngày</Text>
            </View>
          </View>

          <Text style={styles.challengeSubTitle}>Hoàn thành tất cả nhiệm vụ để lên cấp!</Text>
        </View>

        {/* Quest 1: Dual Threshold GMV / KPI Progress Bar */}
        <View style={styles.questCard}>
          <View style={styles.questHeaderRow}>
            <Text style={styles.questBadgeTitle}>Nhiệm vụ 1</Text>
            <Ionicons name="information-circle-outline" size={18} color="#9CA3AF" />
          </View>

          <Text style={styles.questMainGoal}>
            Kiếm được <Text style={styles.boldGoalText}>{currentTier.promotionCeilingGmv}Tr VNĐ</Text> Doanh số / KPI
          </Text>

          {/* Dual Threshold Progress Bar (Safety Floor vs Target Ceiling) */}
          <View style={styles.progressBarWrapper}>
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
            </View>

            {/* Retention Safety Floor Marker */}
            <View
              style={[
                styles.retentionFloorMarker,
                { left: `${(currentTier.retentionFloorGmv / currentTier.promotionCeilingGmv) * 100}%` },
              ]}
            >
              <Ionicons name="flame" size={12} color="#DC2626" />
              <Text style={styles.retentionFloorText}>
                Tối thiểu <Text style={{ color: '#DC2626', fontWeight: 'bold' }}>{currentTier.retentionFloorGmv}Trđ</Text> để duy trì cấp
              </Text>
            </View>
          </View>

          <View style={styles.progressScoreRow}>
            <Text style={styles.currentScoreText}>{currentTier.currentGmv}Tr VNĐ</Text>
            <Text style={styles.targetScoreText}>/ {currentTier.promotionCeilingGmv}Tr VNĐ</Text>
          </View>

          {/* Action Recommendations */}
          <Text style={styles.recommendSectionTitle}>Cách tăng GMV & KPI trong tháng:</Text>
          <View style={styles.recommendGrid}>
            <TouchableOpacity style={styles.recommendCard}>
              <Ionicons name="rocket-outline" size={24} color="#2563EB" />
              <View style={styles.recommendInfo}>
                <Text style={styles.recommendTitle}>Nhận thêm Task Ưu Tiên</Text>
                <Text style={styles.recommendSub}>Cộng thêm 50-150 điểm thưởng Task</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.recommendCard}>
              <Ionicons name="ribbon-outline" size={24} color="#D97706" />
              <View style={styles.recommendInfo}>
                <Text style={styles.recommendTitle}>Quy Trình Xét Nâng Level</Text>
                <Text style={styles.recommendSub}>Xem tiêu chuẩn duyệt cuối tháng</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Quest 2 & 3: SLA Task & Discipline Check-in */}
        <View style={styles.questCard}>
          <Text style={styles.questBadgeTitle}>Nhiệm vụ 2 & 3</Text>

          <View style={styles.subQuestRow}>
            <Ionicons name="checkmark-circle" size={20} color="#059669" />
            <View style={styles.subQuestInfo}>
              <Text style={styles.subQuestTitle}>Tỷ lệ hoàn thành Task đúng hạn &ge; 90%</Text>
              <Text style={styles.subQuestCurrent}>Hiện tại: 96% (Đạt yêu cầu ✅)</Text>
            </View>
          </View>

          <View style={styles.subQuestRow}>
            <Ionicons name="checkmark-circle" size={20} color="#059669" />
            <View style={styles.subQuestInfo}>
              <Text style={styles.subQuestTitle}>Điểm Chăm chỉ / Check-in đúng giờ &ge; 90đ</Text>
              <Text style={styles.subQuestCurrent}>Hiện tại: 95đ (Đạt yêu cầu ✅)</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  darkHeader: {
    backgroundColor: '#111827',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  closeBtn: {
    padding: 4,
  },
  topTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  helpBtn: {
    padding: 4,
  },
  levelCarousel: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  levelPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#1F2937',
    marginRight: 8,
  },
  levelPillActive: {
    backgroundColor: '#FFFFFF',
  },
  levelPillText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#9CA3AF',
  },
  levelPillTextActive: {
    color: '#111827',
  },
  badgeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  badgeTextGroup: {
    flex: 1,
  },
  rankBadgeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#374151',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  rankBadgeTagText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#F59E0B',
  },
  levelBigTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  crownIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  perksSection: {
    marginTop: 4,
  },
  perksTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#D1D5DB',
    marginBottom: 10,
  },
  perksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  perkItem: {
    alignItems: 'center',
    width: '22%',
  },
  perkIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1F2937',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  perkText: {
    fontSize: 10,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 13,
  },
  whiteBody: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
  },
  challengeCardHeader: {
    backgroundColor: '#3730A3',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  challengeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  challengeTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  challengeTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  timerTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  timerText: {
    fontSize: 11,
    color: '#FFFFFF',
  },
  challengeSubTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  questCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  questHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  questBadgeTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#DC2626',
  },
  questMainGoal: {
    fontSize: 15,
    color: '#1F2937',
    marginBottom: 14,
  },
  boldGoalText: {
    fontWeight: 'bold',
    color: '#111827',
  },
  progressBarWrapper: {
    position: 'relative',
    marginVertical: 12,
  },
  progressBarTrack: {
    height: 10,
    backgroundColor: '#E5E7EB',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#059669',
  },
  retentionFloorMarker: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  retentionFloorText: {
    fontSize: 11,
    color: '#6B7280',
  },
  progressScoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'flex-end',
    marginBottom: 14,
  },
  currentScoreText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  targetScoreText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  recommendSectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
  },
  recommendGrid: {
    gap: 8,
  },
  recommendCard: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  recommendInfo: {
    flex: 1,
  },
  recommendTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  recommendSub: {
    fontSize: 11,
    color: '#6B7280',
  },
  subQuestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },
  subQuestInfo: {
    flex: 1,
  },
  subQuestTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  subQuestCurrent: {
    fontSize: 11,
    color: '#059669',
    marginTop: 2,
  },
});
