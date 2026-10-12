import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { UserLevelProgressData } from '../../api/leveling.api';
import { NextLevelPerksAppendixModal } from './NextLevelPerksAppendixModal';
import { getAbsoluteImageUrl } from '../../utils/image';

interface EmployeeLevelProgressCardProps {
  progress: UserLevelProgressData | null;
  onOpenSubmitModal: () => void;
  onOpenLadder: () => void;
}

export const EmployeeLevelProgressCard: React.FC<EmployeeLevelProgressCardProps> = ({
  progress,
  onOpenSubmitModal,
  onOpenLadder,
}) => {
  if (!progress) return null;

  const [showAppendixModal, setShowAppendixModal] = useState(false);
  const percent = progress.overallProgressPercent || 0;
  const isPending = !!progress.pendingRequest;

  const tenurePercent = Math.min(100, progress.metrics?.tenure?.percent || 0);
  const shiftsPercent = Math.min(100, progress.metrics?.shifts?.percent || 0);
  const gmvPercent = Math.min(100, progress.metrics?.gmv?.percent || 0);
  const disciplineScore = progress.metrics?.discipline?.score ?? 100;
  const isDisciplinePassed = (progress.metrics?.discipline?.lateCount || 0) === 0;

  // Initials for avatar fallback
  const getInitials = (name?: string) => {
    if (!name) return 'ML';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      const first = parts[0]?.[0] || '';
      const last = parts[parts.length - 1]?.[0] || '';
      return (first + last).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Circular progress calculations for Hero Card
  const ringSize = 78;
  const strokeWidth = 6;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * Math.min(100, Math.max(0, percent))) / 100;

  const currentLevelFormatted = String(progress.currentLevel.levelNumber).padStart(2, '0');
  const avatarUri = getAbsoluteImageUrl(progress.avatarUrl);

  const isTenureCompleted = tenurePercent >= 100;
  const isShiftsCompleted = shiftsPercent >= 100;
  const isGmvCompleted = gmvPercent >= 100;

  return (
    <View style={styles.container}>
      {/* 1. Profile Info Row */}
      <View style={styles.profileRow}>
        <View style={styles.avatarContainer}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarText}>{getInitials(progress.fullName)}</Text>
            </View>
          )}
        </View>

        <View style={styles.profileInfo}>
          <Text style={styles.profileName} numberOfLines={1}>
            {progress.fullName || 'Đinh Văn Học'}
          </Text>
          <Text style={styles.profileDept} numberOfLines={1}>
            {progress.departmentName || 'DEV (MOVIELEGEND-HÀ NỘI)'}
          </Text>
          <Text style={styles.profileTenure}>
            Thâm niên: {progress.metrics?.tenure?.currentMonths ?? 14.8} tháng
          </Text>
        </View>
      </View>

      {/* 2. Hero Dark Green Card (#123826) */}
      <View style={styles.heroCard}>
        <View style={styles.heroLeft}>
          <Text style={styles.heroSubHeader}>CẤP HIỆN TẠI</Text>
          <Text style={styles.heroLevelNumber}>{currentLevelFormatted}</Text>
          <Text style={styles.heroLevelName}>{progress.currentLevel.displayName}</Text>
          <Text style={styles.heroNextLevel}>
            Tiếp theo: {progress.nextLevel.displayName} · Cấp {progress.nextLevel.levelNumber}
          </Text>
        </View>

        <View style={styles.heroRight}>
          <View style={styles.ringWrapper}>
            <Svg width={ringSize} height={ringSize} style={styles.ringSvg}>
              {/* Background Ring */}
              <Circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={radius}
                stroke="rgba(255, 255, 255, 0.18)"
                strokeWidth={strokeWidth}
                fill="none"
              />
              {/* Progress Ring with Gold/Cream Accent */}
              <Circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={radius}
                stroke="#F5DDA9"
                strokeWidth={strokeWidth}
                strokeDasharray={`${circumference} ${circumference}`}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
              />
            </Svg>
            <View style={styles.ringCenterTextContainer}>
              <Text style={styles.ringPercentText}>{percent}%</Text>
            </View>
          </View>
          <Text style={styles.ringLabel}>Tiến độ thăng cấp</Text>
        </View>
      </View>

      {/* 3. Section: Điều kiện thăng cấp */}
      <View style={styles.sectionHeaderBox}>
        <Text style={styles.sectionTitle}>Điều kiện thăng cấp</Text>
        <Text style={styles.sectionSubtitle}>
          {percent >= 100
            ? '🎉 Bạn đã hoàn thành 100% điều kiện để lên cấp!'
            : `Bạn còn thiếu ${100 - percent}% nữa để hoàn thành mục tiêu lên ${progress.nextLevel.displayName}.`}
        </Text>
      </View>

      {/* 4 Criteria Rows matching template exactly */}
      <View style={styles.criteriaList}>
        {/* Row 1: Thâm niên */}
        <View style={styles.criteriaCard}>
          {/* Status Check on far left */}
          <View style={[styles.statusCircle, isTenureCompleted && styles.statusCircleCompleted]}>
            {isTenureCompleted && <Ionicons name="checkmark" size={13} color="#FFFFFF" />}
          </View>

          {/* Icon Box */}
          <View style={styles.iconBox}>
            <Ionicons name="time-outline" size={18} color="#18181B" />
          </View>

          {/* Title & Values */}
          <View style={styles.criteriaContent}>
            <Text style={styles.criteriaTitle}>Thâm niên</Text>
            <Text style={styles.criteriaValue}>
              {progress.metrics?.tenure?.currentMonths ?? 14.8} / {progress.metrics?.tenure?.targetMonths ?? 6} tháng
            </Text>
            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${tenurePercent}%`, backgroundColor: '#10B981' },
                ]}
              />
            </View>
          </View>

          {/* Percentage on far right */}
          <Text style={[styles.criteriaPercentText, isTenureCompleted && styles.criteriaPercentSuccess]}>
            {tenurePercent}%
          </Text>
        </View>

        {/* Row 2: Số ca làm */}
        <View style={styles.criteriaCard}>
          {/* Status Check on far left */}
          <View style={[styles.statusCircle, isShiftsCompleted && styles.statusCircleCompleted]}>
            {isShiftsCompleted && <Ionicons name="checkmark" size={13} color="#FFFFFF" />}
          </View>

          {/* Icon Box */}
          <View style={styles.iconBox}>
            <Ionicons name="briefcase-outline" size={18} color="#18181B" />
          </View>

          {/* Title & Values */}
          <View style={styles.criteriaContent}>
            <Text style={styles.criteriaTitle}>Số ca làm</Text>
            <Text style={styles.criteriaValue}>
              {progress.metrics?.shifts?.currentCount ?? 1} / {progress.metrics?.shifts?.targetCount ?? 150} ca
            </Text>
            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${Math.max(shiftsPercent, 2)}%`, backgroundColor: '#10B981' },
                ]}
              />
            </View>
          </View>

          {/* Percentage on far right */}
          <Text style={[styles.criteriaPercentText, isShiftsCompleted && styles.criteriaPercentSuccess]}>
            {shiftsPercent}%
          </Text>
        </View>

        {/* Row 3: Kỷ luật */}
        <View style={styles.criteriaCard}>
          {/* Status Check on far left */}
          <View style={[styles.statusCircle, isDisciplinePassed && styles.statusCircleCompleted]}>
            {isDisciplinePassed && <Ionicons name="checkmark" size={13} color="#FFFFFF" />}
          </View>

          {/* Icon Box */}
          <View style={styles.iconBox}>
            <Ionicons name="shield-outline" size={18} color="#18181B" />
          </View>

          {/* Title & Values */}
          <View style={styles.criteriaContent}>
            <Text style={styles.criteriaTitle}>Kỷ luật</Text>
            <Text style={styles.criteriaValue}>
              {(progress.metrics?.discipline?.lateCount ?? 0) === 0
                ? '0 lỗi đi trễ'
                : `${progress.metrics?.discipline?.lateCount} lỗi đi trễ`}
            </Text>
            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${disciplineScore}%`, backgroundColor: '#10B981' },
                ]}
              />
            </View>
          </View>

          {/* Percentage on far right */}
          <Text style={[styles.criteriaPercentText, isDisciplinePassed && styles.criteriaPercentSuccess]}>
            {disciplineScore}%
          </Text>
        </View>

        {/* Row 4: Doanh số */}
        <View style={styles.criteriaCard}>
          {/* Status Check on far left */}
          <View style={[styles.statusCircle, isGmvCompleted && styles.statusCircleCompleted]}>
            {isGmvCompleted && <Ionicons name="checkmark" size={13} color="#FFFFFF" />}
          </View>

          {/* Icon Box */}
          <View style={styles.iconBox}>
            <Ionicons name="trending-up-outline" size={18} color="#18181B" />
          </View>

          {/* Title & Values */}
          <View style={styles.criteriaContent}>
            <Text style={styles.criteriaTitle}>Doanh số</Text>
            <Text style={styles.criteriaValue}>
              {progress.metrics?.gmv?.currentGmv || '0'} / {progress.metrics?.gmv?.targetGmv || '400'} {progress.metrics?.gmv?.unit || 'triệu VNĐ'}
            </Text>
            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${gmvPercent}%`, backgroundColor: '#10B981' },
                ]}
              />
            </View>
          </View>

          {/* Percentage on far right */}
          <Text style={[styles.criteriaPercentText, isGmvCompleted && styles.criteriaPercentSuccess]}>
            {gmvPercent}%
          </Text>
        </View>
      </View>

      {/* 4. Two Navigation Cards (Row of 2) */}
      <View style={styles.navCardsRow}>
        {/* Card 1: Quyền lợi cấp tiếp theo */}
        <TouchableOpacity
          style={styles.navCard}
          onPress={() => setShowAppendixModal(true)}
          activeOpacity={0.75}
        >
          <Ionicons name="gift-outline" size={20} color="#9A6B2F" style={{ marginRight: 8 }} />
          <View style={styles.navCardContent}>
            <Text style={styles.navCardTitle} numberOfLines={1}>
              Quyền lợi cấp {progress.nextLevel.levelNumber}
            </Text>
            <Text style={styles.navCardSubtitle} numberOfLines={1}>
              Thưởng, quà tặng & đặc quyền
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={14} color="#A1A1AA" />
        </TouchableOpacity>

        {/* Card 2: Xem 8 cấp bậc */}
        <TouchableOpacity
          style={styles.navCard}
          onPress={onOpenLadder}
          activeOpacity={0.75}
        >
          <Ionicons name="bar-chart-outline" size={20} color="#9A6B2F" style={{ marginRight: 8 }} />
          <View style={styles.navCardContent}>
            <Text style={styles.navCardTitle} numberOfLines={1}>
              Xem 8 cấp bậc
            </Text>
            <Text style={styles.navCardSubtitle} numberOfLines={1}>
              Lộ trình phát triển
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={14} color="#A1A1AA" />
        </TouchableOpacity>
      </View>

      {/* 5. Pending Status Banner (if any) */}
      {isPending && (
        <View style={styles.pendingBanner}>
          <Ionicons name="hourglass-outline" size={18} color="#92400E" />
          <View style={{ flex: 1 }}>
            <Text style={styles.pendingTitle}>
              Đề xuất lên Level {progress.pendingRequest?.toLevelNumber} đang chờ duyệt
            </Text>
            <Text style={styles.pendingNote}>
              {progress.pendingRequest?.status === 'SUPPLEMENT_REQUESTED'
                ? `💬 Leader yêu cầu bổ sung: "${progress.pendingRequest.leaderNote}"`
                : 'Leader phòng ban đang thẩm định hồ sơ và minh chứng của bạn.'}
            </Text>
          </View>
        </View>
      )}

      {/* 6. Sticky Bottom Action Button (#123826) */}
      <TouchableOpacity
        style={[
          styles.submitBtn,
          isPending && { backgroundColor: '#D97706' },
        ]}
        onPress={onOpenSubmitModal}
        activeOpacity={0.88}
      >
        <View style={styles.submitBtnLeft}>
          <Ionicons
            name={isPending ? 'create-outline' : 'paper-plane'}
            size={18}
            color="#FFF"
            style={{ marginRight: 10 }}
          />
          <Text style={styles.submitBtnText}>
            {isPending ? 'Cập Nhật / Bổ Sung Báo Cáo' : 'Nộp báo cáo thành tích lên cấp'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={17} color="#A7D8BE" />
      </TouchableOpacity>

      {/* Perks Appendix Modal */}
      <NextLevelPerksAppendixModal
        visible={showAppendixModal}
        onClose={() => setShowAppendixModal(false)}
        progress={progress}
        onOpenSubmitModal={onOpenSubmitModal}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 24,
  },
  /* Profile Row */
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
  },
  avatarContainer: {
    marginRight: 14,
  },
  avatarImage: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1.5,
    borderColor: '#E4E4E7',
  },
  avatarFallback: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#1E3A8A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#18181B',
    marginBottom: 2,
  },
  profileDept: {
    fontSize: 13,
    fontWeight: '500',
    color: '#71717A',
    marginBottom: 2,
  },
  profileTenure: {
    fontSize: 12,
    color: '#71717A',
  },

  /* Hero Card (#123826) */
  heroCard: {
    backgroundColor: '#123826',
    borderRadius: 20,
    marginHorizontal: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
    shadowColor: '#123826',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  heroLeft: {
    flex: 1,
  },
  heroSubHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#A7D8BE',
    letterSpacing: 1,
    marginBottom: 2,
  },
  heroLevelNumber: {
    fontSize: 52,
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: 56,
  },
  heroLevelName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  heroNextLevel: {
    fontSize: 13,
    color: '#A7D8BE',
    marginTop: 5,
    fontWeight: '500',
  },
  heroRight: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 16,
  },
  ringWrapper: {
    width: 78,
    height: 78,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringSvg: {
    transform: [{ rotate: '-90deg' }],
  },
  ringCenterTextContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringPercentText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  ringLabel: {
    fontSize: 11.5,
    color: '#FFFFFF',
    fontWeight: '500',
    marginTop: 6,
  },

  /* Section Header */
  sectionHeaderBox: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#18181B',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#71717A',
    marginTop: 3,
    lineHeight: 18,
  },

  /* Criteria List */
  criteriaList: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  criteriaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  statusCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#D4D4D8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    backgroundColor: 'transparent',
  },
  statusCircleCompleted: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    backgroundColor: '#FAFAFA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  criteriaContent: {
    flex: 1,
  },
  criteriaTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#18181B',
    marginBottom: 2,
  },
  criteriaValue: {
    fontSize: 12,
    color: '#71717A',
    fontWeight: '500',
  },
  progressBarBg: {
    height: 3,
    backgroundColor: '#F4F4F5',
    borderRadius: 2,
    marginTop: 5,
    overflow: 'hidden',
    width: '95%',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  criteriaPercentText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#71717A',
    marginLeft: 8,
  },
  criteriaPercentSuccess: {
    color: '#059669',
  },

  /* Navigation Cards Row */
  navCardsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginTop: 6,
    marginBottom: 16,
  },
  navCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  navCardContent: {
    flex: 1,
  },
  navCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#18181B',
    marginBottom: 2,
  },
  navCardSubtitle: {
    fontSize: 10.5,
    color: '#71717A',
  },

  /* Pending Banner */
  pendingBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 14,
    gap: 10,
  },
  pendingTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 2,
  },
  pendingNote: {
    fontSize: 11.5,
    color: '#B45309',
    lineHeight: 16,
  },

  /* Submit Button (#123826) */
  submitBtn: {
    backgroundColor: '#123826',
    borderRadius: 14,
    height: 50,
    marginHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    shadowColor: '#123826',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  submitBtnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  submitBtnText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
