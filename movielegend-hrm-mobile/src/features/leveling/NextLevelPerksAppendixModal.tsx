import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
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
  const insets = useSafeAreaInsets();
  const safeTopInset = Math.max((insets.top > 0 ? insets.top : (StatusBar.currentHeight || 20)) - 6, 8);
  if (!progress) return null;

  const nextLevel = progress.nextLevel;
  const perksData = progress.nextLevelPerks;
  const targetLevelNum = nextLevel?.levelNumber || 2;
  const colorHex = LEVEL_COLORS[targetLevelNum] || nextLevel?.colorHex || '#2563EB';

  const bonusAmount = perksData?.promotionBonusAmount !== undefined
    ? perksData.promotionBonusAmount
    : 500000;
  const rawItems = perksData?.physicalItems && perksData.physicalItems.length > 0
    ? perksData.physicalItems
    : perksData?.physicalItemName
    ? [perksData.physicalItemName]
    : ['Bộ Giftset thương hiệu MovieLegend'];
  const physicalItems = rawItems.map((s) => String(s || '').trim()).filter(Boolean);

  const perksList = perksData?.perks && perksData.perks.length > 0
    ? perksData.perks
    : [
        'Ký HĐLĐ chính thức',
        'Hưởng đầy đủ phụ cấp chuyên cần & trách nhiệm',
        'Mở khóa nhận việc con trong Dự Án Cấp Bậc',
        'Hệ số thưởng Tết 1.2x',
      ];

  const motivationQuote = perksData?.motivationQuote || 'Nỗ lực hôm nay là nền tảng vững chắc cho sự thăng hoa sự nghiệp ngày mai!';
  const isEligibleToPromote = progress.overallProgressPercent >= 100;

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#123826" />
        <View style={[styles.topSafeArea, { paddingTop: safeTopInset }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerSub}>Thông tin chi tiết cấp bậc</Text>
              <Text style={styles.headerTitle}>
                Mục tiêu {nextLevel.displayName}
              </Text>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.bodyWrapper}>
          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* LEVEL BADGE & TRANSITION HERO CARD */}
            <View style={styles.heroCard}>
              <View style={styles.heroTopRow}>
                <View style={styles.levelCircleBig}>
                  <Text style={styles.levelCircleBigText}>{targetLevelNum}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={styles.heroFromText}>
                    Từ Level {progress.currentLevel.levelNumber} ({progress.currentLevel.displayName}) lên
                  </Text>
                  <Text style={styles.heroTargetName}>
                    {nextLevel.displayName} (Level {targetLevelNum})
                  </Text>
                  <Text style={styles.heroDeptText}>
                    Phòng ban: {progress.departmentName || 'DEV (MOVIELEGEND-HÀ NỘI)'}
                  </Text>
                </View>
              </View>

              {/* Progress status */}
              <View style={styles.heroProgressBox}>
                <View style={styles.heroProgressHeader}>
                  <Text style={styles.heroProgressLabel}>Tiến độ điều kiện hiện tại:</Text>
                  <Text style={styles.heroProgressPercent}>
                    {progress.overallProgressPercent}%
                  </Text>
                </View>
                <View style={styles.heroProgressTrack}>
                  <View
                    style={[
                      styles.heroProgressFill,
                      { width: `${progress.overallProgressPercent}%` },
                    ]}
                  />
                </View>
              </View>
            </View>

          {/* SECTION 1: PHẦN THƯỞNG KHI BỔ NHIỆM */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionIconBg}>
                <Ionicons name="gift-outline" size={18} color="#123826" />
              </View>
              <Text style={styles.sectionTitle}>Phần Thưởng Khi Bổ Nhiệm</Text>
            </View>

            <View style={styles.rewardCardsGrid}>
              {/* Tiền mặt */}
              <View style={styles.rewardCardItem}>
                <View style={styles.rewardIconWrapperCash}>
                  <Ionicons name="cash-outline" size={24} color="#10B981" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rewardCardLabel}>Thưởng nóng khi bổ nhiệm chính thức</Text>
                  <Text style={styles.rewardCardCash}>
                    {(bonusAmount > 0 ? bonusAmount : 500000).toLocaleString('vi-VN')} VNĐ
                  </Text>
                  <Text style={styles.rewardCardSub}>
                    Chi trả trực tiếp vào kỳ lương kế tiếp sau khi có quyết định thăng cấp
                  </Text>
                </View>
              </View>

              {/* Hiện vật */}
              <View style={styles.rewardCardItem}>
                <View style={styles.rewardIconWrapperGift}>
                  <Ionicons name="gift-outline" size={24} color="#F59E0B" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rewardCardLabel}>Quà tặng hiện vật vinh danh</Text>
                  <Text style={styles.rewardCardGift}>
                    {physicalItems.length > 0 ? physicalItems.join(' • ') : 'Bộ Giftset thương hiệu MovieLegend'}
                  </Text>
                  <Text style={styles.rewardCardSub}>
                    Trao tặng tại kỳ họp vinh danh định kỳ của công ty
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* SECTION 2: QUYỀN LỢI & ĐẶC QUYỀN CẤP BẬC */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionIconBg}>
                <Ionicons name="shield-checkmark-outline" size={18} color="#123826" />
              </View>
              <Text style={styles.sectionTitle}>Quyền Lợi & Đặc Quyền Cấp Bậc</Text>
            </View>

            {/* Quick stats row */}
            <View style={styles.perksStatsRow}>
              <View style={styles.perkStatCard}>
                <Ionicons name="trending-up-outline" size={20} color="#10B981" style={{ marginBottom: 4 }} />
                <Text style={styles.perkStatValue}>{perksData?.retentionMultiplier || 1.2}x</Text>
                <Text style={styles.perkStatLabel}>Hệ số Thưởng Tết</Text>
              </View>

              <View style={styles.perkStatCard}>
                <Ionicons name="wallet-outline" size={20} color="#10B981" style={{ marginBottom: 4 }} />
                <Text style={styles.perkStatValue}>
                  +{((perksData?.allowanceAmount && perksData.allowanceAmount > 0 ? perksData.allowanceAmount : 300000) / 1000).toLocaleString('vi-VN')}k
                </Text>
                <Text style={styles.perkStatLabel}>Phụ Cấp / Tháng</Text>
              </View>

              <View style={styles.perkStatCard}>
                <Ionicons name="folder-outline" size={20} color="#10B981" style={{ marginBottom: 4 }} />
                <Text style={styles.perkStatValue}>Dự Án Lv.{targetLevelNum}</Text>
                <Text style={styles.perkStatLabel}>Quyền Nhận Việc</Text>
              </View>
            </View>

            {/* Detailed Perks List */}
            <View style={styles.perksListBox}>
              {perksList.map((perkItem, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.perkRow,
                    idx < perksList.length - 1 && styles.perkRowBorder,
                  ]}
                >
                  <Ionicons name="checkmark-circle" size={18} color="#10B981" style={{ marginTop: 1 }} />
                  <Text style={styles.perkItemText}>{perkItem}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* SECTION 3: TIÊU CHUẨN ĐIỀU KIỆN CẦN ĐẠT */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionIconBg}>
                <Ionicons name="checkmark-done-outline" size={16} color="#2563EB" />
              </View>
              <Text style={styles.sectionTitle}>Tiêu Chuẩn Điều Kiện Cần Đạt</Text>
            </View>

            <View style={styles.criteriaBox}>
              <View style={styles.criteriaItem}>
                <Text style={styles.criteriaLabel}>Thâm niên tối thiểu</Text>
                <View style={styles.criteriaValueRow}>
                  <Text style={styles.criteriaValue}>
                    {progress.metrics.tenure.currentMonths} / {progress.metrics.tenure.targetMonths} tháng
                  </Text>
                  <View style={[styles.criteriaTag, (progress.metrics.tenure.percent || 0) >= 100 ? styles.criteriaTagSuccess : styles.criteriaTagPrimary]}>
                    <Text style={[styles.criteriaTagText, (progress.metrics.tenure.percent || 0) >= 100 ? styles.criteriaTagTextSuccess : styles.criteriaTagTextPrimary]}>
                      {progress.metrics.tenure.percent}%
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.criteriaItem}>
                <Text style={styles.criteriaLabel}>Số ca làm thực tế</Text>
                <View style={styles.criteriaValueRow}>
                  <Text style={styles.criteriaValue}>
                    {progress.metrics.shifts.currentCount} / {progress.metrics.shifts.targetCount} ca
                  </Text>
                  <View style={[styles.criteriaTag, (progress.metrics.shifts.percent || 0) >= 100 ? styles.criteriaTagSuccess : styles.criteriaTagPrimary]}>
                    <Text style={[styles.criteriaTagText, (progress.metrics.shifts.percent || 0) >= 100 ? styles.criteriaTagTextSuccess : styles.criteriaTagTextPrimary]}>
                      {progress.metrics.shifts.percent}%
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.criteriaItem}>
                <Text style={styles.criteriaLabel}>Điểm kỷ luật & chuyên cần</Text>
                <View style={styles.criteriaValueRow}>
                  <Text style={styles.criteriaValue}>
                    {progress.metrics.discipline.score}/100đ
                  </Text>
                  <View style={[styles.criteriaTag, progress.metrics.discipline.lateCount === 0 ? styles.criteriaTagSuccess : styles.criteriaTagWarning]}>
                    <Text style={[styles.criteriaTagText, progress.metrics.discipline.lateCount === 0 ? styles.criteriaTagTextSuccess : styles.criteriaTagTextWarning]}>
                      {progress.metrics.discipline.lateCount === 0 ? '0 lỗi' : `${progress.metrics.discipline.lateCount} lần trễ`}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={[styles.criteriaItem, { borderBottomWidth: 0 }]}>
                <Text style={styles.criteriaLabel}>Dự án cấp bậc</Text>
                <Text style={styles.criteriaValue}>
                  Hoàn thành nhiệm vụ Level {targetLevelNum}
                </Text>
              </View>
            </View>
          </View>

          <View style={{ height: 24 }} />
        </ScrollView>
      </View>

      {/* BOTTOM ACTION BAR */}
        <SafeAreaView edges={['bottom']} style={styles.bottomBar}>
          {isEligibleToPromote ? (
            <TouchableOpacity
              style={styles.fullBottomActionBtn}
              onPress={() => {
                onClose();
                if (onOpenSubmitModal) onOpenSubmitModal();
              }}
              activeOpacity={0.88}
            >
              <Ionicons name="paper-plane-outline" size={16} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.fullBottomActionBtnText}>Nộp Báo Cáo Xét Thăng Cấp</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.fullBottomActionBtn}
              onPress={onClose}
              activeOpacity={0.88}
            >
              <Text style={styles.fullBottomActionBtnText}>Đã Hiểu Lộ Trình</Text>
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
    backgroundColor: '#123826',
  },
  topSafeArea: {
    backgroundColor: '#123826',
  },
  bodyWrapper: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -8,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: '#123826',
  },
  headerSub: {
    fontSize: 12,
    color: '#A7D8BE',
    fontWeight: '500',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  levelCircleBig: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#C8E6C9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelCircleBigText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#123826',
  },
  heroFromText: {
    fontSize: 12,
    color: '#71717A',
    fontWeight: '500',
  },
  heroTargetName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#18181B',
    marginTop: 2,
    letterSpacing: -0.2,
  },
  heroDeptText: {
    fontSize: 11.5,
    color: '#71717A',
    marginTop: 2,
  },
  heroProgressBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingTop: 2,
  },
  heroProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  heroProgressLabel: {
    fontSize: 13,
    color: '#27272A',
    fontWeight: '600',
  },
  heroProgressPercent: {
    fontSize: 14,
    fontWeight: '800',
    color: '#10B981',
  },
  heroProgressTrack: {
    height: 6,
    backgroundColor: '#E4E4E7',
    borderRadius: 3,
    overflow: 'hidden',
  },
  heroProgressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
  sectionContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  sectionIconBg: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#18181B',
    letterSpacing: -0.2,
  },
  rewardCardsGrid: {
    gap: 12,
  },
  rewardCardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F4F4F5',
    gap: 12,
  },
  rewardIconWrapperCash: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardIconWrapperGift: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFFBEB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardCardLabel: {
    fontSize: 12,
    color: '#71717A',
    fontWeight: '500',
  },
  rewardCardCash: {
    fontSize: 17,
    fontWeight: '800',
    color: '#123826',
    marginTop: 2,
  },
  rewardCardGift: {
    fontSize: 15,
    fontWeight: '800',
    color: '#18181B',
    marginTop: 2,
  },
  rewardCardSub: {
    fontSize: 11.5,
    color: '#A1A1AA',
    marginTop: 3,
    lineHeight: 16,
  },
  perksStatsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  perkStatCard: {
    flex: 1,
    backgroundColor: '#F4FBF7',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8F5E9',
  },
  perkStatValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#18181B',
    marginTop: 2,
  },
  perkStatLabel: {
    fontSize: 11,
    color: '#71717A',
    marginTop: 3,
    textAlign: 'center',
    fontWeight: '500',
  },
  perksListBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F4F4F5',
    paddingHorizontal: 12,
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  perkRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F4F4F5',
  },
  perkItemText: {
    fontSize: 13,
    color: '#27272A',
    flex: 1,
    lineHeight: 18,
    fontWeight: '500',
  },
  criteriaBox: {
    backgroundColor: '#FAFAFA',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F4F4F5',
    gap: 6,
  },
  criteriaItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E4E7',
  },
  criteriaLabel: {
    fontSize: 12.5,
    color: '#71717A',
    fontWeight: '500',
  },
  criteriaValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  criteriaValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#18181B',
  },
  criteriaTag: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  criteriaTagSuccess: {
    backgroundColor: '#ECFDF5',
  },
  criteriaTagPrimary: {
    backgroundColor: '#EFF6FF',
  },
  criteriaTagWarning: {
    backgroundColor: '#FEF3C7',
  },
  criteriaTagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  criteriaTagTextSuccess: {
    color: '#059669',
  },
  criteriaTagTextPrimary: {
    color: '#2563EB',
  },
  criteriaTagTextWarning: {
    color: '#D97706',
  },
  bottomBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F4F4F5',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  fullBottomActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#123826',
    borderRadius: 14,
    paddingVertical: 14,
    shadowColor: '#123826',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  fullBottomActionBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
