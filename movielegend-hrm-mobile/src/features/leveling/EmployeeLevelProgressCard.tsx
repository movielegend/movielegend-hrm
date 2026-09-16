import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UserLevelProgressData } from '../../api/leveling.api';
import { NextLevelPerksAppendixModal } from './NextLevelPerksAppendixModal';

interface EmployeeLevelProgressCardProps {
  progress: UserLevelProgressData | null;
  onOpenSubmitModal: () => void;
}

export const EmployeeLevelProgressCard: React.FC<EmployeeLevelProgressCardProps> = ({
  progress,
  onOpenSubmitModal,
}) => {
  if (!progress) return null;

  const [showAppendixModal, setShowAppendixModal] = useState(false);
  const percent = progress.overallProgressPercent || 0;
  const isPending = !!progress.pendingRequest;

  const tenurePercent = Math.min(100, progress.metrics.tenure.percent || 0);
  const shiftsPercent = Math.min(100, progress.metrics.shifts.percent || 0);
  const gmvPercent = Math.min(100, progress.metrics.gmv.percent || 0);
  const disciplineScore = progress.metrics.discipline.score ?? 100;
  const isDisciplinePassed = (progress.metrics.discipline.lateCount || 0) === 0;

  return (
    <View style={styles.card}>
      {/* 1. Header Level Transition */}
      <View style={styles.headerContainer}>
        {/* Current Level */}
        <View style={styles.levelBadgeBox}>
          <View style={styles.currentLevelCircle}>
            <Text style={styles.currentLevelCircleText}>
              {progress.currentLevel.levelNumber}
            </Text>
          </View>
          <View style={styles.levelTextBox}>
            <Text style={styles.levelSub}>Cấp hiện tại</Text>
            <Text style={styles.currentLevelTitle} numberOfLines={1}>
              {progress.currentLevel.displayName}
            </Text>
          </View>
        </View>

        {/* Transition Arrow */}
        <View style={styles.arrowWrapper}>
          <Ionicons name="arrow-forward" size={15} color="#64748B" />
        </View>

        {/* Target Level */}
        <TouchableOpacity
          style={[styles.levelBadgeBox, { alignItems: 'flex-end' }]}
          onPress={() => setShowAppendixModal(true)}
          activeOpacity={0.7}
        >
          <View style={styles.nextLevelCircle}>
            <Text style={styles.nextLevelCircleText}>
              {progress.nextLevel.levelNumber}
            </Text>
          </View>
          <View style={[styles.levelTextBox, { alignItems: 'flex-end' }]}>
            <Text style={styles.nextLevelSub}>Mục tiêu (Xem phụ lục)</Text>
            <Text style={styles.nextLevelTitle} numberOfLines={1}>
              {progress.nextLevel.displayName}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* 2. Overall Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressLabelRow}>
          <Text style={styles.progressLabel}>Tiến độ thăng cấp tổng thể</Text>
          <Text style={styles.progressPercent}>{percent}%</Text>
        </View>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${percent}%` }]} />
        </View>
        <Text style={styles.progressHint}>
          {percent >= 100
            ? '🎉 Chúc mừng! Bạn đã đủ điều kiện nộp hồ sơ xét thăng cấp!'
            : `Bạn còn thiếu ${100 - percent}% nữa để hoàn thành mục tiêu lên ${progress.nextLevel.displayName}.`}
        </Text>
      </View>

      {/* 2.1 Next Level Perks & Motivation Appendix Banner */}
      <TouchableOpacity
        style={styles.appendixBanner}
        onPress={() => setShowAppendixModal(true)}
        activeOpacity={0.8}
      >
        <View style={styles.appendixBannerLeft}>
          <View style={styles.appendixIconBox}>
            <Ionicons name="gift-outline" size={17} color="#2563EB" />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.appendixBannerTitle}>Phụ Lục Quyền Lợi & Động Lực</Text>
              <View style={styles.appendixTag}>
                <Text style={styles.appendixTagText}>Level {progress.nextLevel.levelNumber}</Text>
              </View>
            </View>
            <Text style={styles.appendixBannerSub} numberOfLines={1}>
              Xem thưởng nóng, quà tặng hiện vật & đặc quyền mở khóa
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
      </TouchableOpacity>

      {/* 3. 2x2 Symmetrical Metrics Grid */}
      <View style={styles.metricsGrid}>
        {/* Row 1 */}
        <View style={styles.metricsRow}>
          {/* Metric 1: Thâm niên */}
          <View style={styles.metricCard}>
            <View style={styles.metricTopRow}>
              <View style={styles.metricIconBg}>
                <Ionicons name="time-outline" size={14} color="#334155" />
              </View>
              <Text style={styles.metricTitle}>Thâm niên</Text>
              <Text style={[styles.metricBadge, tenurePercent >= 100 && styles.metricBadgeSuccess]}>
                {tenurePercent}%
              </Text>
            </View>
            <Text style={styles.metricValue}>
              {progress.metrics.tenure.currentMonths} <Text style={styles.metricUnit}>/ {progress.metrics.tenure.targetMonths} th</Text>
            </Text>
            <View style={styles.miniBarBg}>
              <View
                style={[
                  styles.miniBarFill,
                  {
                    width: `${tenurePercent}%`,
                    backgroundColor: tenurePercent >= 100 ? '#10B981' : '#2563EB',
                  },
                ]}
              />
            </View>
          </View>

          {/* Metric 2: Số ca làm */}
          <View style={styles.metricCard}>
            <View style={styles.metricTopRow}>
              <View style={styles.metricIconBg}>
                <Ionicons name="briefcase-outline" size={14} color="#334155" />
              </View>
              <Text style={styles.metricTitle}>Số ca làm</Text>
              <Text style={[styles.metricBadge, shiftsPercent >= 100 && styles.metricBadgeSuccess]}>
                {shiftsPercent}%
              </Text>
            </View>
            <Text style={styles.metricValue}>
              {progress.metrics.shifts.currentCount} <Text style={styles.metricUnit}>/ {progress.metrics.shifts.targetCount} ca</Text>
            </Text>
            <View style={styles.miniBarBg}>
              <View
                style={[
                  styles.miniBarFill,
                  {
                    width: `${shiftsPercent}%`,
                    backgroundColor: shiftsPercent >= 100 ? '#10B981' : '#2563EB',
                  },
                ]}
              />
            </View>
          </View>
        </View>

        {/* Row 2 */}
        <View style={styles.metricsRow}>
          {/* Metric 3: Kỷ luật */}
          <View style={styles.metricCard}>
            <View style={styles.metricTopRow}>
              <View style={styles.metricIconBg}>
                <Ionicons name="shield-checkmark-outline" size={14} color="#334155" />
              </View>
              <Text style={styles.metricTitle}>Kỷ luật</Text>
              <Text style={[styles.metricBadge, isDisciplinePassed && styles.metricBadgeSuccess]}>
                {disciplineScore}/100đ
              </Text>
            </View>
            <Text style={styles.metricValue}>
              {progress.metrics.discipline.lateCount === 0 ? '0 lỗi' : `${progress.metrics.discipline.lateCount} lần`} <Text style={styles.metricUnit}>đi trễ</Text>
            </Text>
            <View style={styles.miniBarBg}>
              <View
                style={[
                  styles.miniBarFill,
                  {
                    width: `${disciplineScore}%`,
                    backgroundColor: isDisciplinePassed ? '#10B981' : '#F59E0B',
                  },
                ]}
              />
            </View>
          </View>

          {/* Metric 4: Doanh số */}
          <View style={styles.metricCard}>
            <View style={styles.metricTopRow}>
              <View style={styles.metricIconBg}>
                <Ionicons name="trending-up-outline" size={14} color="#334155" />
              </View>
              <Text style={styles.metricTitle}>Doanh số</Text>
              <Text style={[styles.metricBadge, gmvPercent >= 100 && styles.metricBadgeSuccess]}>
                {gmvPercent}%
              </Text>
            </View>
            <Text style={styles.metricValue}>
              {progress.metrics.gmv.currentGmv} <Text style={styles.metricUnit}>/ {progress.metrics.gmv.targetGmv} {progress.metrics.gmv.unit}</Text>
            </Text>
            <View style={styles.miniBarBg}>
              <View
                style={[
                  styles.miniBarFill,
                  {
                    width: `${gmvPercent}%`,
                    backgroundColor: gmvPercent >= 100 ? '#10B981' : '#2563EB',
                  },
                ]}
              />
            </View>
          </View>
        </View>
      </View>

      {/* 4. Pending status banner if any */}
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

      {/* 5. Action Button */}
      <TouchableOpacity
        style={[
          styles.actionBtn,
          isPending && { backgroundColor: '#D97706' },
        ]}
        onPress={onOpenSubmitModal}
        activeOpacity={0.88}
      >
        <Ionicons
          name={isPending ? 'create-outline' : 'paper-plane-outline'}
          size={16}
          color="#FFF"
          style={{ marginRight: 8 }}
        />
        <Text style={styles.actionBtnText}>
          {isPending ? 'Cập Nhật / Bổ Sung Báo Cáo' : 'Nộp Báo Cáo Thành Tích Lên Cấp'}
        </Text>
      </TouchableOpacity>

      {/* NEXT LEVEL PERKS APPENDIX MODAL */}
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
  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 18,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  appendixBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
    marginTop: 10,
    marginBottom: 14,
  },
  appendixBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  appendixIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appendixBannerTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  appendixTag: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    backgroundColor: '#2563EB',
  },
  appendixTagText: {
    fontSize: 9.5,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  appendixBannerSub: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  levelBadgeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  levelTextBox: {
    flex: 1,
    justifyContent: 'center',
  },
  currentLevelCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#334155',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentLevelCircleText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1E293B',
  },
  currentLevelTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  nextLevelCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextLevelCircleText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#2563EB',
  },
  nextLevelSub: {
    fontSize: 11,
    color: '#2563EB',
    fontWeight: '700',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  nextLevelTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E40AF',
  },
  levelSub: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  arrowWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 6,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  progressPercent: {
    fontSize: 16,
    fontWeight: '900',
    color: '#2563EB',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#2563EB',
    borderRadius: 4,
  },
  progressHint: {
    fontSize: 11.5,
    color: '#64748B',
    lineHeight: 16,
  },
  metricsGrid: {
    gap: 10,
    marginBottom: 16,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  metricTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  metricIconBg: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricTitle: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '600',
    flex: 1,
  },
  metricBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },
  metricBadgeSuccess: {
    color: '#10B981',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  metricUnit: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#64748B',
  },
  miniBarBg: {
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  miniBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  pendingBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  pendingTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#92400E',
  },
  pendingNote: {
    fontSize: 11.5,
    color: '#B45309',
    marginTop: 2,
    lineHeight: 16,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: '#2563EB',
    shadowColor: '#2563EB',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 0.2,
  },
});

