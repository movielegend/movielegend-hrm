import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UserLevelProgressData } from '../../api/leveling.api';

interface EmployeeLevelProgressCardProps {
  progress: UserLevelProgressData | null;
  onOpenSubmitModal: () => void;
}

export const EmployeeLevelProgressCard: React.FC<EmployeeLevelProgressCardProps> = ({
  progress,
  onOpenSubmitModal,
}) => {
  if (!progress) return null;

  const currentColor = progress.currentLevel.colorHex || '#FF9800';
  const nextColor = progress.nextLevel.colorHex || '#E91E63';
  const percent = progress.overallProgressPercent || 0;
  const isPending = !!progress.pendingRequest;

  const tenurePercent = Math.min(100, progress.metrics.tenure.percent || 0);
  const shiftsPercent = Math.min(100, progress.metrics.shifts.percent || 0);
  const gmvPercent = Math.min(100, progress.metrics.gmv.percent || 0);
  const disciplineScore = progress.metrics.discipline.score ?? 100;

  return (
    <View style={styles.card}>
      {/* 1. Header Level Transition */}
      <View style={styles.headerContainer}>
        {/* Current Level */}
        <View style={styles.levelBadgeBox}>
          <View style={[styles.levelCircle, { borderColor: currentColor, backgroundColor: `${currentColor}18` }]}>
            <Text style={[styles.levelCircleText, { color: currentColor }]}>
              {progress.currentLevel.levelNumber}
            </Text>
          </View>
          <View style={styles.levelTextBox}>
            <Text style={styles.levelSub}>Cấp hiện tại</Text>
            <Text style={[styles.levelTitle, { color: currentColor }]} numberOfLines={1}>
              {progress.currentLevel.displayName}
            </Text>
          </View>
        </View>

        {/* Transition Arrow */}
        <View style={styles.arrowWrapper}>
          <Ionicons name="arrow-forward" size={16} color="#94A3B8" />
        </View>

        {/* Target Level */}
        <View style={[styles.levelBadgeBox, { alignItems: 'flex-end' }]}>
          <View style={[styles.levelCircle, { borderColor: nextColor, backgroundColor: `${nextColor}18` }]}>
            <Text style={[styles.levelCircleText, { color: nextColor }]}>
              {progress.nextLevel.levelNumber}
            </Text>
          </View>
          <View style={[styles.levelTextBox, { alignItems: 'flex-end' }]}>
            <Text style={styles.levelSub}>Mục tiêu</Text>
            <Text style={[styles.levelTitle, { color: nextColor }]} numberOfLines={1}>
              {progress.nextLevel.displayName}
            </Text>
          </View>
        </View>
      </View>

      {/* 2. Overall Progress Bar */}
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

      {/* 3. 2x2 Symmetrical Metrics Grid */}
      <View style={styles.metricsGrid}>
        {/* Row 1 */}
        <View style={styles.metricsRow}>
          {/* Metric 1: Thâm niên */}
          <View style={styles.metricCard}>
            <View style={styles.metricTopRow}>
              <View style={[styles.metricIconBg, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="time" size={14} color="#2563EB" />
              </View>
              <Text style={styles.metricTitle}>Thâm niên</Text>
              <Text style={[styles.metricBadge, { color: tenurePercent >= 100 ? '#16A34A' : '#2563EB' }]}>
                {tenurePercent}%
              </Text>
            </View>
            <Text style={styles.metricValue}>
              {progress.metrics.tenure.currentMonths} <Text style={styles.metricUnit}>/ {progress.metrics.tenure.targetMonths} th</Text>
            </Text>
            <View style={styles.miniBarBg}>
              <View style={[styles.miniBarFill, { width: `${tenurePercent}%`, backgroundColor: '#2563EB' }]} />
            </View>
          </View>

          {/* Metric 2: Số ca làm */}
          <View style={styles.metricCard}>
            <View style={styles.metricTopRow}>
              <View style={[styles.metricIconBg, { backgroundColor: '#ECFDF5' }]}>
                <Ionicons name="briefcase" size={14} color="#059669" />
              </View>
              <Text style={styles.metricTitle}>Số ca làm</Text>
              <Text style={[styles.metricBadge, { color: shiftsPercent >= 100 ? '#16A34A' : '#059669' }]}>
                {shiftsPercent}%
              </Text>
            </View>
            <Text style={styles.metricValue}>
              {progress.metrics.shifts.currentCount} <Text style={styles.metricUnit}>/ {progress.metrics.shifts.targetCount} ca</Text>
            </Text>
            <View style={styles.miniBarBg}>
              <View style={[styles.miniBarFill, { width: `${shiftsPercent}%`, backgroundColor: '#059669' }]} />
            </View>
          </View>
        </View>

        {/* Row 2 */}
        <View style={styles.metricsRow}>
          {/* Metric 3: Kỷ luật */}
          <View style={styles.metricCard}>
            <View style={styles.metricTopRow}>
              <View style={[styles.metricIconBg, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="shield-checkmark" size={14} color="#D97706" />
              </View>
              <Text style={styles.metricTitle}>Kỷ luật</Text>
              <Text style={[styles.metricBadge, { color: '#16A34A' }]}>
                {disciplineScore}/100đ
              </Text>
            </View>
            <Text style={styles.metricValue}>
              {progress.metrics.discipline.lateCount === 0 ? '0 lỗi' : `${progress.metrics.discipline.lateCount} lần`} <Text style={styles.metricUnit}>đi trễ</Text>
            </Text>
            <View style={styles.miniBarBg}>
              <View style={[styles.miniBarFill, { width: `${disciplineScore}%`, backgroundColor: '#D97706' }]} />
            </View>
          </View>

          {/* Metric 4: Doanh số */}
          <View style={styles.metricCard}>
            <View style={styles.metricTopRow}>
              <View style={[styles.metricIconBg, { backgroundColor: '#F3E8FF' }]}>
                <Ionicons name="trending-up" size={14} color="#7C3AED" />
              </View>
              <Text style={styles.metricTitle}>Doanh số</Text>
              <Text style={[styles.metricBadge, { color: gmvPercent >= 100 ? '#16A34A' : '#7C3AED' }]}>
                {gmvPercent}%
              </Text>
            </View>
            <Text style={styles.metricValue}>
              {progress.metrics.gmv.currentGmv} <Text style={styles.metricUnit}>/ {progress.metrics.gmv.targetGmv} {progress.metrics.gmv.unit}</Text>
            </Text>
            <View style={styles.miniBarBg}>
              <View style={[styles.miniBarFill, { width: `${gmvPercent}%`, backgroundColor: '#7C3AED' }]} />
            </View>
          </View>
        </View>
      </View>

      {/* 4. Pending status banner if any */}
      {isPending && (
        <View style={styles.pendingBanner}>
          <Ionicons name="hourglass-outline" size={18} color="#D97706" />
          <View style={{ flex: 1 }}>
            <Text style={styles.pendingTitle}>
              Đề xuất lên Level {progress.pendingRequest?.toLevelNumber} đang chờ duyệt
            </Text>
            <Text style={styles.pendingNote}>
              {progress.pendingRequest?.status === 'SUPPLEMENT_REQUESTED'
                ? `💬 Leader yêu cầu bổ sung: "${progress.pendingRequest.leaderNote}"`
                : 'Leader phòng ban đang thẩm định hình ảnh bằng chứng của bạn.'}
            </Text>
          </View>
        </View>
      )}

      {/* 5. Action Button */}
      <TouchableOpacity
        style={[
          styles.actionBtn,
          { backgroundColor: isPending ? '#D97706' : nextColor },
        ]}
        onPress={onOpenSubmitModal}
        activeOpacity={0.85}
      >
        <Ionicons
          name={isPending ? 'create-outline' : 'paper-plane'}
          size={16}
          color="#FFF"
          style={{ marginRight: 8 }}
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
    borderRadius: 20,
    padding: 18,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOpacity: 0.07,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
  levelCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelCircleText: {
    fontSize: 18,
    fontWeight: '900',
  },
  levelSub: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  levelTitle: {
    fontSize: 14,
    fontWeight: '800',
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
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 0.2,
  },
});

