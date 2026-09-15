import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  StatusBar} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const insets = useSafeAreaInsets();
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
        <SafeAreaView style={styles.topSafeArea} edges={['top']}>
          <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerSub}>Thông tin chi tiết cấp bậc</Text>
              <Text style={styles.headerTitle}>
                Mục Tiêu {nextLevel.displayName}
              </Text>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>

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
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.heroFromText}>
                  Từ Level {progress.currentLevel.levelNumber} ({progress.currentLevel.displayName}) lên
                </Text>
                <Text style={styles.heroTargetName}>
                  {nextLevel.displayName} (Level {targetLevelNum})
                </Text>
                <Text style={styles.heroDeptText}>
                  Phòng ban: {progress.departmentName || 'MovieLegend'}
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
                <Ionicons name="gift-outline" size={16} color="#2563EB" />
              </View>
              <Text style={styles.sectionTitle}>Phần Thưởng Khi Bổ Nhiệm</Text>
            </View>

            <View style={styles.rewardCardsGrid}>
              {/* Tiền mặt */}
              {bonusAmount > 0 && (
                <View style={styles.rewardCardItem}>
                  <View style={styles.rewardIconWrapper}>
                    <Ionicons name="cash-outline" size={20} color="#059669" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rewardCardLabel}>Thưởng nóng khi bổ nhiệm chính thức</Text>
                    <Text style={styles.rewardCardCash}>
                      {bonusAmount.toLocaleString('vi-VN')} VNĐ
                    </Text>
                    <Text style={styles.rewardCardSub}>
                      Chi trả trực tiếp vào kỳ lương kế tiếp sau khi có quyết định thăng cấp
                    </Text>
                  </View>
                </View>
              )}

              {/* Hiện vật */}
              {physicalItems.length > 0 && (
                <View style={styles.rewardCardItem}>
                  <View style={styles.rewardIconWrapper}>
                    <Ionicons name="cube-outline" size={20} color="#2563EB" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rewardCardLabel}>Quà tặng hiện vật vinh danh</Text>
                    <Text style={styles.rewardCardGift}>
                      {physicalItems.join(' • ')}
                    </Text>
                    <Text style={styles.rewardCardSub}>
                      Trao tặng tại kỳ họp vinh danh định kỳ của công ty
                    </Text>
                  </View>
                </View>
              )}

              {bonusAmount === 0 && physicalItems.length === 0 && (
                <View style={styles.rewardCardItem}>
                  <View style={styles.rewardIconWrapper}>
                    <Ionicons name="ribbon-outline" size={20} color="#2563EB" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rewardCardLabel}>Vinh danh & Ghi nhận</Text>
                    <Text style={styles.rewardCardGift}>
                      Huy hiệu {nextLevel.displayName} & Chứng nhận thăng cấp
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* SECTION 2: QUYỀN LỢI & ĐẶC QUYỀN CẤP BẬC */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionIconBg}>
                <Ionicons name="shield-checkmark-outline" size={16} color="#2563EB" />
              </View>
              <Text style={styles.sectionTitle}>Quyền Lợi & Đặc Quyền Cấp Bậc</Text>
            </View>

            {/* Quick stats row */}
            <View style={styles.perksStatsRow}>
              <View style={styles.perkStatCard}>
                <Ionicons name="trending-up-outline" size={16} color="#2563EB" style={{ marginBottom: 4 }} />
                <Text style={styles.perkStatValue}>{perksData?.retentionMultiplier || 1.5}x</Text>
                <Text style={styles.perkStatLabel}>Hệ số Thưởng Tết</Text>
              </View>

              {Boolean(perksData?.allowanceAmount && perksData.allowanceAmount > 0) && (
                <View style={styles.perkStatCard}>
                  <Ionicons name="wallet-outline" size={16} color="#2563EB" style={{ marginBottom: 4 }} />
                  <Text style={styles.perkStatValue}>
                    +{((perksData?.allowanceAmount || 0) / 1000).toLocaleString('vi-VN')}k
                  </Text>
                  <Text style={styles.perkStatLabel}>Phụ Cấp / Tháng</Text>
                </View>
              )}

              <View style={styles.perkStatCard}>
                <Ionicons name="folder-open-outline" size={16} color="#2563EB" style={{ marginBottom: 4 }} />
                <Text style={styles.perkStatValue}>Dự Án Lv.{targetLevelNum}</Text>
                <Text style={styles.perkStatLabel}>Quyền Nhận Việc</Text>
              </View>
            </View>

            {/* Detailed Perks List */}
            <View style={styles.perksListBox}>
              {perksList.map((perkItem, idx) => (
                <View key={idx} style={styles.perkRow}>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" style={{ marginTop: 2 }} />
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
  headerSub: {
    fontSize: 11.5,
    color: '#94A3B8',
    fontWeight: '500',
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  levelCircleBig: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelCircleBigText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2563EB',
  },
  heroFromText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  heroTargetName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 1,
  },
  heroDeptText: {
    fontSize: 11,
    color: '#64748B',
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
    fontWeight: '800',
    color: '#2563EB',
  },
  heroProgressTrack: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  heroProgressFill: {
    height: '100%',
    backgroundColor: '#2563EB',
    borderRadius: 3,
  },
  sectionContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
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
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 13.5,
    fontWeight: '800',
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
  rewardIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardCardLabel: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '600',
  },
  rewardCardCash: {
    fontSize: 17,
    fontWeight: '800',
    color: '#059669',
    marginTop: 2,
  },
  rewardCardGift: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
  },
  rewardCardSub: {
    fontSize: 11,
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
  perkStatValue: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  perkStatLabel: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
    textAlign: 'center',
    fontWeight: '500',
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
  perkItemText: {
    fontSize: 12.5,
    color: '#334155',
    flex: 1,
    lineHeight: 18,
    fontWeight: '500',
  },
  criteriaBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  criteriaItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  criteriaLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  criteriaValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  criteriaValue: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F172A',
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
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  fullBottomActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 13,
    shadowColor: '#2563EB',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  fullBottomActionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
