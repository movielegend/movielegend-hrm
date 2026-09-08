import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UserLevelProgressData } from '../../api/leveling.api';
import { LEVEL_COLORS } from '../../components/common/LevelNameBadge';

interface NextLevelPerksAppendixModalProps {
  visible: boolean;
  onClose: () => void;
  progress: UserLevelProgressData | null;
  onOpenSubmitModal?: () => void;
}

export const NextLevelPerksAppendixModal: React.FC<NextLevelPerksAppendixModalProps> = ({
  visible,
  onClose,
  progress,
  onOpenSubmitModal,
}) => {
  if (!progress) return null;

  const nextLevel = progress.nextLevel;
  const perksData = progress.nextLevelPerks;
  const targetLevelNum = nextLevel?.levelNumber || 2;
  const colorHex = LEVEL_COLORS[targetLevelNum] || nextLevel?.colorHex || '#2563EB';

  const bonusAmount = perksData?.promotionBonusAmount || 0;
  const rawItems = perksData?.physicalItems && perksData.physicalItems.length > 0
    ? perksData.physicalItems
    : perksData?.physicalItemName ? [perksData.physicalItemName] : [];
  const physicalItems = rawItems.map((s) => String(s || '').trim()).filter(Boolean);

  const perksList = perksData?.perks && perksData.perks.length > 0
    ? perksData.perks
    : [
        'Ký hợp đồng và bổ nhiệm chức danh mới chính thức',
        'Mở khóa nhận việc con trong Dự Án Cấp Bậc',
        'Hưởng đầy đủ phụ cấp chuyên môn & trách nhiệm',
        'Tăng hệ số tính điểm thưởng Tết',
      ];

  const motivationQuote = perksData?.motivationQuote || 'Nỗ lực hôm nay là nền tảng vững chắc cho sự thăng hoa sự nghiệp ngày mai!';
  const isEligibleToPromote = progress.overallProgressPercent >= 100;

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.container}>
        <SafeAreaView style={styles.topSafeArea}>
          <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <View style={styles.headerTagRow}>
                <View style={styles.headerTag}>
                  <Text style={styles.headerTagText}>PHỤ LỤC THĂNG CẤP</Text>
                </View>
                <Text style={styles.headerSub}>Quyền lợi & Động lực phát triển</Text>
              </View>
              <Text style={styles.headerTitle}>
                Mục Tiêu {nextLevel.displayName}
              </Text>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* LEVEL BADGE & TRANSITION HERO CARD */}
          <View style={[styles.heroCard, { borderColor: `${colorHex}40` }]}>
            <View style={styles.heroTopRow}>
              <View style={[styles.levelCircleBig, { backgroundColor: colorHex }]}>
                <Text style={styles.levelCircleBigText}>{targetLevelNum}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.heroFromText}>
                  Từ Level {progress.currentLevel.levelNumber} ({progress.currentLevel.displayName}) lên
                </Text>
                <Text style={[styles.heroTargetName, { color: colorHex }]}>
                  {nextLevel.displayName} (Level {targetLevelNum})
                </Text>
                <Text style={styles.heroDeptText}>
                  Phòng: {progress.departmentName || 'MovieLegend'}
                </Text>
              </View>
            </View>

            {/* Progress status */}
            <View style={styles.heroProgressBox}>
              <View style={styles.heroProgressHeader}>
                <Text style={styles.heroProgressLabel}>Tiến độ điều kiện hiện tại:</Text>
                <Text style={[styles.heroProgressPercent, { color: colorHex }]}>
                  {progress.overallProgressPercent}%
                </Text>
              </View>
              <View style={styles.heroProgressTrack}>
                <View
                  style={[
                    styles.heroProgressFill,
                    { width: `${progress.overallProgressPercent}%`, backgroundColor: colorHex },
                  ]}
                />
              </View>
            </View>
          </View>

          {/* SECTION 1: PHẦN THƯỞNG THĂNG CẤP NHẬN NGAY */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <View style={[styles.sectionIconBg, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="gift" size={16} color="#D97706" />
              </View>
              <Text style={styles.sectionTitle}>1. Phần Thưởng Thăng Cấp Nhận Ngay</Text>
            </View>

            <View style={styles.rewardCardsGrid}>
              {/* Tiền mặt */}
              {bonusAmount > 0 && (
                <View style={styles.rewardCardItem}>
                  <Text style={styles.rewardCardIcon}>💵</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rewardCardLabel}>Thưởng nóng thăng cấp:</Text>
                    <Text style={styles.rewardCardCash}>
                      {bonusAmount.toLocaleString('vi-VN')} VNĐ
                    </Text>
                    <Text style={styles.rewardCardSub}>
                      Trao tặng ngay khi có quyết định bổ nhiệm chính thức
                    </Text>
                  </View>
                </View>
              )}

              {/* Hiện vật */}
              {physicalItems.length > 0 && (
                <View style={styles.rewardCardItem}>
                  <Text style={styles.rewardCardIcon}>🎁</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rewardCardLabel}>Quà tặng hiện vật vinh danh:</Text>
                    <Text style={styles.rewardCardGift}>
                      {physicalItems.join(' • ')}
                    </Text>
                    <Text style={styles.rewardCardSub}>
                      Hiện vật trao tại lễ vinh danh định kỳ
                    </Text>
                  </View>
                </View>
              )}

              {bonusAmount === 0 && physicalItems.length === 0 && (
                <View style={styles.rewardCardItem}>
                  <Text style={styles.rewardCardIcon}>🏆</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rewardCardLabel}>Vinh danh & Ghi nhận:</Text>
                    <Text style={styles.rewardCardGift}>
                      Huy hiệu {nextLevel.displayName} & Chứng nhận thăng cấp
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* SECTION 2: QUYỀN LỢI & ĐẶC QUYỀN MỞ KHÓA */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <View style={[styles.sectionIconBg, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="diamond" size={16} color="#2563EB" />
              </View>
              <Text style={styles.sectionTitle}>2. Quyền Lợi & Đặc Quyền Mở Khóa</Text>
            </View>

            {/* Quick stats row */}
            <View style={styles.perksStatsRow}>
              <View style={styles.perkStatCard}>
                <Text style={styles.perkStatIcon}>📈</Text>
                <Text style={styles.perkStatValue}>{perksData?.retentionMultiplier || 1.2}x</Text>
                <Text style={styles.perkStatLabel}>Hệ số Thưởng Tết</Text>
              </View>

              {Boolean(perksData?.allowanceAmount && perksData.allowanceAmount > 0) && (
                <View style={styles.perkStatCard}>
                  <Text style={styles.perkStatIcon}>💼</Text>
                  <Text style={styles.perkStatValue}>
                    +{((perksData?.allowanceAmount || 0) / 1000).toLocaleString('vi-VN')}k
                  </Text>
                  <Text style={styles.perkStatLabel}>Phụ Cấp/Tháng</Text>
                </View>
              )}

              <View style={styles.perkStatCard}>
                <Text style={styles.perkStatIcon}>🎯</Text>
                <Text style={styles.perkStatValue}>Dự Án Lv.{targetLevelNum}</Text>
                <Text style={styles.perkStatLabel}>Quyền Nhận Việc</Text>
              </View>
            </View>

            {/* Detailed Perks List */}
            <View style={styles.perksListBox}>
              {perksList.map((perkItem, idx) => (
                <View key={idx} style={styles.perkRow}>
                  <View style={styles.perkCheckCircle}>
                    <Ionicons name="checkmark" size={12} color="#059669" />
                  </View>
                  <Text style={styles.perkItemText}>{perkItem}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* SECTION 3: TIÊU CHUẨN ĐẠT CẤP */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <View style={[styles.sectionIconBg, { backgroundColor: '#ECFDF5' }]}>
                <Ionicons name="checkbox-outline" size={16} color="#059669" />
              </View>
              <Text style={styles.sectionTitle}>3. Tiêu Chuẩn Cần Đạt Để Thăng Cấp</Text>
            </View>

            <View style={styles.criteriaBox}>
              <View style={styles.criteriaItem}>
                <Text style={styles.criteriaLabel}>• Thâm niên tối thiểu:</Text>
                <Text style={styles.criteriaValue}>
                  {progress.metrics.tenure.currentMonths}/{progress.metrics.tenure.targetMonths} tháng ({progress.metrics.tenure.percent}%)
                </Text>
              </View>

              <View style={styles.criteriaItem}>
                <Text style={styles.criteriaLabel}>• Số ca làm thực tế:</Text>
                <Text style={styles.criteriaValue}>
                  {progress.metrics.shifts.currentCount}/{progress.metrics.shifts.targetCount} ca ({progress.metrics.shifts.percent}%)
                </Text>
              </View>

              <View style={styles.criteriaItem}>
                <Text style={styles.criteriaLabel}>• Điểm kỷ luật & chuyên cần:</Text>
                <Text style={styles.criteriaValue}>
                  {progress.metrics.discipline.score}/100 điểm ({progress.metrics.discipline.lateCount === 0 ? 'Không đi trễ' : `${progress.metrics.discipline.lateCount} lần trễ`})
                </Text>
              </View>

              <View style={[styles.criteriaItem, { alignItems: 'flex-start' }]}>
                <Text style={styles.criteriaLabel}>• Dự án thăng cấp:</Text>
                <Text style={[styles.criteriaValue, { flex: 1, textAlign: 'right', marginLeft: 8 }]}>
                  Hoàn thành việc con dự án {nextLevel.displayName}
                </Text>
              </View>
            </View>
          </View>

          {/* SECTION 4: MOTIVATION BANNER */}
          <View style={styles.motivationBanner}>
            <View style={styles.motivationIconBox}>
              <Ionicons name="sparkles" size={18} color="#D97706" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.motivationHeading}>ĐỘNG LỰC PHẤN ĐẤU</Text>
              <Text style={styles.motivationQuoteText}>"{motivationQuote}"</Text>
            </View>
          </View>

          <View style={{ height: 20 }} />
        </ScrollView>

        {/* FULL-WIDTH BOTTOM ACTION BAR */}
        <SafeAreaView style={[styles.bottomBar, { backgroundColor: isEligibleToPromote ? '#059669' : '#0F172A' }]}>
          {isEligibleToPromote ? (
            <TouchableOpacity
              style={styles.fullBottomActionBtn}
              onPress={() => {
                onClose();
                if (onOpenSubmitModal) onOpenSubmitModal();
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.fullBottomActionBtnText}>ĐỦ ĐIỀU KIỆN • NỘP HỒ SƠ XÉT CẤP NGAY</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.fullBottomActionBtn}
              onPress={onClose}
              activeOpacity={0.85}
            >
              <Text style={styles.fullBottomActionBtnText}>TÔI ĐÃ HIỂU • QUYẾT TÂM CHINH PHỤC</Text>
            </TouchableOpacity>
          )}
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topSafeArea: {
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
    backgroundColor: '#0F172A',
  },
  headerTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  headerTag: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  headerTagText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#94A3B8',
    letterSpacing: 0.8,
  },
  headerSub: {
    fontSize: 11,
    color: '#94A3B8',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  levelCircleBig: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelCircleBigText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  heroFromText: {
    fontSize: 11,
    color: '#64748B',
  },
  heroTargetName: {
    fontSize: 17,
    fontWeight: 'bold',
    marginTop: 1,
  },
  heroDeptText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  heroProgressBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  heroProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  heroProgressLabel: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  heroProgressPercent: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  heroProgressTrack: {
    height: 7,
    backgroundColor: '#E2E8F0',
    borderRadius: 3.5,
    overflow: 'hidden',
  },
  heroProgressFill: {
    height: '100%',
    borderRadius: 3.5,
  },
  sectionContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionIconBg: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  rewardCardsGrid: {
    gap: 10,
  },
  rewardCardItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  rewardCardIcon: {
    fontSize: 22,
  },
  rewardCardLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  rewardCardCash: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#059669',
    marginTop: 2,
  },
  rewardCardGift: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#92400E',
    marginTop: 2,
  },
  rewardCardSub: {
    fontSize: 10.5,
    color: '#94A3B8',
    marginTop: 2,
  },
  perksStatsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  perkStatCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  perkStatIcon: {
    fontSize: 16,
    marginBottom: 2,
  },
  perkStatValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  perkStatLabel: {
    fontSize: 9.5,
    color: '#64748B',
    marginTop: 2,
    textAlign: 'center',
  },
  perksListBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  perkCheckCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  perkItemText: {
    fontSize: 12.5,
    color: '#334155',
    flex: 1,
    lineHeight: 18,
  },
  criteriaBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  criteriaItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  criteriaLabel: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  criteriaValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  motivationBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFBEB',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
    gap: 10,
  },
  motivationIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  motivationHeading: {
    fontSize: 10.5,
    fontWeight: 'bold',
    color: '#92400E',
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  motivationQuoteText: {
    fontSize: 12,
    color: '#78350F',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  bottomBar: {
    backgroundColor: '#0F172A',
  },
  fullBottomActionBtn: {
    width: '100%',
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullBottomActionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
});
