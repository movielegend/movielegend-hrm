import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UserLevelProgressData } from '../../api/leveling.api';
import { LEVEL_COLORS } from '../../components/common/LevelNameBadge';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface EmployeeLevelProgressCardProps {
  progress: UserLevelProgressData | null;
  onOpenSubmitModal: () => void;
}

export const EmployeeLevelProgressCard: React.FC<EmployeeLevelProgressCardProps> = ({
  progress,
  onOpenSubmitModal,
}) => {
  if (!progress) return null;

  const currentColor = progress.currentLevel.colorHex || '#2196F3';
  const nextColor = progress.nextLevel.colorHex || '#4CAF50';
  const percent = progress.overallProgressPercent || 0;

  const isPending = !!progress.pendingRequest;

  return (
    <View style={styles.card}>
      {/* Header Level Transition */}
      <View style={styles.headerRow}>
        <View style={styles.levelBadgeBox}>
          <View style={[styles.levelCircle, { borderColor: currentColor }]}>
            <Text style={[styles.levelCircleText, { color: currentColor }]}>
              {progress.currentLevel.levelNumber}
            </Text>
          </View>
          <View>
            <Text style={styles.levelSub}>Cấp hiện tại</Text>
            <Text style={[styles.levelTitle, { color: currentColor }]}>
              {progress.currentLevel.displayName}
            </Text>
          </View>
        </View>

        <Ionicons name="arrow-forward-circle" size={24} color="#94A3B8" />

        <View style={styles.levelBadgeBox}>
          <View style={[styles.levelCircle, { borderColor: nextColor, backgroundColor: `${nextColor}15` }]}>
            <Text style={[styles.levelCircleText, { color: nextColor }]}>
              {progress.nextLevel.levelNumber}
            </Text>
          </View>
          <View>
            <Text style={styles.levelSub}>Mục tiêu</Text>
            <Text style={[styles.levelTitle, { color: nextColor }]}>
              {progress.nextLevel.displayName}
            </Text>
          </View>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressLabelRow}>
          <Text style={styles.progressLabel}>Tiến độ thăng cấp tổng thể</Text>
          <Text style={[styles.progressPercent, { color: nextColor }]}>{percent}%</Text>
        </View>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${percent}%`, backgroundColor: nextColor }]} />
        </View>
        <Text style={styles.progressHint}>
          {percent >= 100
            ? '🎉 Chúc mừng! Bạn đã đủ điều kiện nộp hồ sơ xét thăng cấp!'
            : `Bạn còn thiếu ${100 - percent}% nữa để hoàn thành mục tiêu lên ${progress.nextLevel.displayName}.`}
        </Text>
      </View>

      {/* 4 Quantitative Breakdown Metrics */}
      <View style={styles.metricsGrid}>
        {/* Metric 1: Thâm niên */}
        <View style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <Ionicons name="time-outline" size={16} color="#2563EB" />
            <Text style={styles.metricTitle}>Thâm niên</Text>
          </View>
          <Text style={styles.metricValue}>
            {progress.metrics.tenure.currentMonths} / {progress.metrics.tenure.targetMonths} th
          </Text>
          <Text style={[styles.metricPercent, { color: progress.metrics.tenure.percent >= 100 ? '#16A34A' : '#64748B' }]}>
            {progress.metrics.tenure.percent}% {progress.metrics.tenure.percent >= 100 ? '✅' : ''}
          </Text>
        </View>

        {/* Metric 2: Ca làm / Ngày công */}
        <View style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <Ionicons name="briefcase-outline" size={16} color="#059669" />
            <Text style={styles.metricTitle}>Số ca làm</Text>
          </View>
          <Text style={styles.metricValue}>
            {progress.metrics.shifts.currentCount} / {progress.metrics.shifts.targetCount} ca
          </Text>
          <Text style={[styles.metricPercent, { color: progress.metrics.shifts.percent >= 100 ? '#16A34A' : '#64748B' }]}>
            {progress.metrics.shifts.percent}% {progress.metrics.shifts.percent >= 100 ? '✅' : ''}
          </Text>
        </View>

        {/* Metric 3: Kỷ luật */}
        <View style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <Ionicons name="shield-checkmark-outline" size={16} color="#D97706" />
            <Text style={styles.metricTitle}>Kỷ luật</Text>
          </View>
          <Text style={styles.metricValue}>
            {progress.metrics.discipline.lateCount === 0 ? '0 lỗi đi trễ' : `${progress.metrics.discipline.lateCount} lần trễ`}
          </Text>
          <Text style={[styles.metricPercent, { color: '#16A34A' }]}>
            {progress.metrics.discipline.score}/100 đ ✅
          </Text>
        </View>

        {/* Metric 4: Doanh số / Nhiệm vụ */}
        <View style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <Ionicons name="trending-up-outline" size={16} color="#7C3AED" />
            <Text style={styles.metricTitle}>Doanh số</Text>
          </View>
          <Text style={styles.metricValue}>
            {progress.metrics.gmv.currentGmv}/{progress.metrics.gmv.targetGmv} {progress.metrics.gmv.unit}
          </Text>
          <Text style={[styles.metricPercent, { color: progress.metrics.gmv.percent >= 100 ? '#16A34A' : '#64748B' }]}>
            {progress.metrics.gmv.percent}%
          </Text>
        </View>
      </View>

      {/* Pending status banner if any */}
      {isPending && (
        <View style={styles.pendingBanner}>
          <Ionicons name="hourglass-outline" size={18} color="#D97706" />
          <View style={{ flex: 1 }}>
            <Text style={styles.pendingTitle}>Đề xuất lên Level {progress.pendingRequest?.toLevelNumber} đang chờ duyệt</Text>
            <Text style={styles.pendingNote}>
              {progress.pendingRequest?.status === 'SUPPLEMENT_REQUESTED'
                ? `💬 Leader yêu cầu bổ sung: "${progress.pendingRequest.leaderNote}"`
                : 'Leader phòng ban đang thẩm định hình ảnh bằng chứng của bạn.'}
            </Text>
          </View>
        </View>
      )}

      {/* Action Button */}
      <TouchableOpacity
        style={[
          styles.actionBtn,
          { backgroundColor: isPending ? '#D97706' : nextColor },
        ]}
        onPress={onOpenSubmitModal}
      >
        <Ionicons
          name={isPending ? 'create-outline' : 'paper-plane-outline'}
          size={18}
          color="#FFF"
          style={{ marginRight: 6 }}
        />
        <Text style={styles.actionBtnText}>
          {isPending ? 'Cập Nhật / Bổ Sung Báo Cáo' : 'Nộp Báo Cáo Thành Tích Lên Cấp'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  levelBadgeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  levelCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelCircleText: {
    fontSize: 16,
    fontWeight: '800',
  },
  levelSub: {
    fontSize: 11,
    color: '#94A3B8',
  },
  levelTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  progressPercent: {
    fontSize: 15,
    fontWeight: '800',
  },
  progressBarBg: {
    height: 10,
    backgroundColor: '#E2E8F0',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  progressHint: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  metricCard: {
    width: (SCREEN_WIDTH - 64 - 8) / 2,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  metricTitle: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  metricPercent: {
    fontSize: 11,
    fontWeight: '600',
  },
  pendingBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF3C7',
    padding: 10,
    borderRadius: 10,
    marginBottom: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  pendingTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
  },
  pendingNote: {
    fontSize: 11,
    color: '#B45309',
    marginTop: 2,
    lineHeight: 15,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
});
