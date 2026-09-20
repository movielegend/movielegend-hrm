import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  Linking,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Screen } from '../../components/Screen';
import { ScreenContainer } from '../../components/ScreenContainer';
import { PageHeader } from '../../components/PageHeader';
import { colors } from '../../theme/colors';
import {
  useAdminReports,
  useReviewDailyReport,
} from '../../hooks/useDailyReports';
import { useDepartments } from '../../hooks/useDepartments';
import { useAuth } from '../../providers/AuthProvider';
import type { DailyReport, DailyReportMetricItem, DailyReportTaskItem, DailyReportAttachmentItem } from '../../api/daily-reports.api';

const STATUS_OPTIONS = [
  { label: 'Tất cả', value: '' },
  { label: 'Chờ duyệt', value: 'SUBMITTED' },
  { label: 'Đã đánh giá', value: 'REVIEWED' },
  { label: 'Bản nháp', value: 'DRAFT' },
];

export function AdminDailyReportsScreen() {
  const router = useRouter();
  const { user } = useAuth();

  // Date selection (default today YYYY-MM-DD)
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr || '');
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected report for detail/review modal
  const [activeReport, setActiveReport] = useState<DailyReport | null>(null);

  // Departments for filtering
  const departmentsQuery = useDepartments();
  const departmentsList = useMemo(() => departmentsQuery.data?.items ?? [], [departmentsQuery.data]);

  // Query reports
  const reportsQuery = useAdminReports({
    date: selectedDate,
    departmentId: selectedDeptId || undefined,
    status: statusFilter || undefined,
    search: searchQuery || undefined,
  });

  const reports = reportsQuery.data?.items ?? [];

  // Summary statistics
  const stats = useMemo(() => {
    let total = reports.length;
    let submitted = 0;
    let reviewed = 0;
    let draft = 0;

    reports.forEach((r) => {
      if (r.status === 'SUBMITTED') submitted++;
      else if (r.status === 'REVIEWED') reviewed++;
      else if (r.status === 'DRAFT') draft++;
    });

    return { total, submitted, reviewed, draft };
  }, [reports]);

  // Date navigation handlers
  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    const nextStr = d.toISOString().split('T')[0];
    if (nextStr) setSelectedDate(nextStr);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    const nextStr = d.toISOString().split('T')[0];
    if (nextStr) setSelectedDate(nextStr);
  };

  const handleToday = () => {
    if (todayStr) setSelectedDate(todayStr);
  };

  return (
    <Screen>
      <ScreenContainer refreshControl={undefined}>
        <PageHeader
          title="Báo cáo cuối ngày"
          subtitle="Quản lý và đánh giá báo cáo công việc toàn công ty"
          showBack={true}
          onBack={() => router.back()}
        />

        {/* Date Selector Bar */}
        <View style={styles.dateBar}>
          <Pressable style={styles.dateNavBtn} onPress={handlePrevDay}>
            <MaterialCommunityIcons name="chevron-left" size={24} color={colors.text} />
          </Pressable>
          <View style={styles.dateDisplay}>
            <MaterialCommunityIcons name="calendar-month" size={18} color="#2563EB" />
            <Text style={styles.dateDisplayText}>
              {new Date(selectedDate).toLocaleDateString('vi-VN', {
                weekday: 'short',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              })}
            </Text>
            {selectedDate !== todayStr && (
              <Pressable style={styles.todayBadge} onPress={handleToday}>
                <Text style={styles.todayBadgeText}>Hôm nay</Text>
              </Pressable>
            )}
          </View>
          <Pressable style={styles.dateNavBtn} onPress={handleNextDay}>
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.text} />
          </Pressable>
        </View>

        {/* Summary Stats Cards */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { borderLeftColor: '#2563EB' }]}>
            <Text style={styles.statLabel}>Tổng số</Text>
            <Text style={[styles.statValue, { color: '#2563EB' }]}>{stats.total}</Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: '#F59E0B' }]}>
            <Text style={styles.statLabel}>Chờ duyệt</Text>
            <Text style={[styles.statValue, { color: '#F59E0B' }]}>{stats.submitted}</Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: '#10B981' }]}>
            <Text style={styles.statLabel}>Đã đánh giá</Text>
            <Text style={[styles.statValue, { color: '#10B981' }]}>{stats.reviewed}</Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: '#94A3B8' }]}>
            <Text style={styles.statLabel}>Bản nháp</Text>
            <Text style={[styles.statValue, { color: '#64748B' }]}>{stats.draft}</Text>
          </View>
        </View>

        {/* Filter Section: Department & Status */}
        <View style={styles.filtersSection}>
          <Text style={styles.filterSectionTitle}>Phòng ban:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterPillsScroll}>
            <Pressable
              style={[styles.deptPill, selectedDeptId === '' && styles.deptPillActive]}
              onPress={() => setSelectedDeptId('')}
            >
              <Text style={[styles.deptPillText, selectedDeptId === '' && styles.deptPillTextActive]}>
                Tất cả phòng ban
              </Text>
            </Pressable>
            {departmentsList.map((dept: any) => {
              const isActive = selectedDeptId === dept.id;
              return (
                <Pressable
                  key={dept.id}
                  style={[styles.deptPill, isActive && styles.deptPillActive]}
                  onPress={() => setSelectedDeptId(dept.id)}
                >
                  <Text style={[styles.deptPillText, isActive && styles.deptPillTextActive]}>
                    {dept.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Text style={[styles.filterSectionTitle, { marginTop: 10 }]}>Trạng thái:</Text>
          <View style={styles.statusPillsRow}>
            {STATUS_OPTIONS.map((st) => {
              const isActive = statusFilter === st.value;
              return (
                <Pressable
                  key={st.value}
                  style={[styles.statusPill, isActive && styles.statusPillActive]}
                  onPress={() => setStatusFilter(st.value)}
                >
                  <Text style={[styles.statusPillText, isActive && styles.statusPillTextActive]}>
                    {st.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Reports List */}
        <View style={styles.listContainer}>
          <Text style={styles.listHeaderTitle}>
            Danh sách báo cáo ({reports.length})
          </Text>

          {reportsQuery.isLoading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color="#2563EB" />
              <Text style={styles.loadingText}>Đang tải danh sách báo cáo...</Text>
            </View>
          ) : reports.length === 0 ? (
            <View style={styles.emptyBox}>
              <MaterialCommunityIcons name="file-document-outline" size={48} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>Chưa có báo cáo nào</Text>
              <Text style={styles.emptySub}>
                Không tìm thấy báo cáo nào trong ngày và bộ lọc đã chọn.
              </Text>
            </View>
          ) : (
            reports.map((report) => {
              const isReviewed = report.status === 'REVIEWED';
              const isSubmitted = report.status === 'SUBMITTED';
              const memberName = report.user?.profile?.fullName || report.user?.userCode || 'Nhân viên';

              return (
                <Pressable
                  key={report.id || Math.random().toString()}
                  style={styles.reportCard}
                  onPress={() => setActiveReport(report)}
                >
                  <View style={styles.reportCardHeader}>
                    <View style={styles.userMeta}>
                      <View style={styles.avatarCircle}>
                        <Text style={styles.avatarInitials}>
                          {memberName.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View>
                        <Text style={styles.userName}>{memberName}</Text>
                        <Text style={styles.userDept}>
                          {report.department?.name || 'Phòng ban'}
                        </Text>
                      </View>
                    </View>

                    {/* Status Badge */}
                    <View
                      style={[
                        styles.statusBadge,
                        isReviewed
                          ? styles.statusReviewed
                          : isSubmitted
                          ? styles.statusSubmitted
                          : styles.statusDraft,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          isReviewed
                            ? styles.statusReviewedText
                            : isSubmitted
                            ? styles.statusSubmittedText
                            : styles.statusDraftText,
                        ]}
                      >
                        {isReviewed ? 'Đã đánh giá' : isSubmitted ? 'Chờ duyệt' : 'Bản nháp'}
                      </Text>
                    </View>
                  </View>

                  {/* Rating Info */}
                  <View style={styles.ratingInfoRow}>
                    <View style={styles.ratingCol}>
                      <Text style={styles.ratingColLabel}>Tự đánh giá:</Text>
                      <View style={styles.starsInline}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <MaterialCommunityIcons
                            key={s}
                            name={s <= (report.selfRating || 0) ? 'star' : 'star-outline'}
                            size={16}
                            color="#F59E0B"
                          />
                        ))}
                      </View>
                    </View>

                    {report.adminRating ? (
                      <View style={styles.ratingCol}>
                        <Text style={styles.ratingColLabel}>Admin đánh giá:</Text>
                        <View style={styles.starsInline}>
                          {[1, 2, 3, 4, 5].map((s) => (
                            <MaterialCommunityIcons
                              key={s}
                              name={s <= (report.adminRating || 0) ? 'star' : 'star-outline'}
                              size={16}
                              color="#10B981"
                            />
                          ))}
                        </View>
                      </View>
                    ) : (
                      <View style={styles.ratingCol}>
                        <Text style={styles.ratingPendingText}>Chưa có Admin đánh giá</Text>
                      </View>
                    )}
                  </View>

                  {/* Summary Snippet */}
                  <View style={styles.snippetRow}>
                    <View style={styles.snippetItem}>
                      <MaterialCommunityIcons name="check-circle" size={14} color="#10B981" />
                      <Text style={styles.snippetItemText}>
                        {report.completedTasks?.length || 0} việc hoàn thành
                      </Text>
                    </View>
                    <View style={styles.snippetItem}>
                      <MaterialCommunityIcons name="progress-clock" size={14} color="#3B82F6" />
                      <Text style={styles.snippetItemText}>
                        {report.inProgressTasks?.length || 0} đang làm
                      </Text>
                    </View>
                    <View style={styles.snippetItem}>
                      <MaterialCommunityIcons name="calendar-arrow-right" size={14} color="#8B5CF6" />
                      <Text style={styles.snippetItemText}>
                        {report.tomorrowPlan?.length || 0} kế hoạch mai
                      </Text>
                    </View>
                  </View>

                  {/* Reviewer Lock Info */}
                  {report.reviewedBy && (
                    <View style={styles.reviewerFooter}>
                      <MaterialCommunityIcons name="shield-check" size={14} color="#10B981" />
                      <Text style={styles.reviewerText}>
                        Đã đánh giá bởi {report.reviewedBy.profile?.fullName || report.reviewedBy.userCode || 'Admin'} •{' '}
                        {report.reviewedAt
                          ? new Date(report.reviewedAt).toLocaleTimeString('vi-VN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : ''}
                      </Text>
                    </View>
                  )}
                </Pressable>
              );
            })
          )}
        </View>

        {/* Modal: Report Detail & Admin Rating */}
        {activeReport && (
          <ReportDetailModal
            visible={!!activeReport}
            report={activeReport}
            currentUserId={user?.id}
            onClose={() => {
              setActiveReport(null);
              void reportsQuery.refetch();
            }}
          />
        )}
      </ScreenContainer>
    </Screen>
  );
}

function ReportDetailModal({
  visible,
  report,
  currentUserId,
  onClose,
}: {
  visible: boolean;
  report: DailyReport;
  currentUserId?: string;
  onClose: () => void;
}) {
  const [adminRating, setAdminRating] = useState<number>(report.adminRating || 5);
  const [adminReview, setAdminReview] = useState<string>(report.adminReview || '');

  const reviewMutation = useReviewDailyReport(report.id || '');

  const isReviewed = report.status === 'REVIEWED';
  const isReviewedByOther =
    isReviewed && report.reviewedById && currentUserId && report.reviewedById !== currentUserId;

  const handleSubmitReview = async () => {
    if (adminRating < 1 || adminRating > 5) {
      Alert.alert('Thông báo', 'Vui lòng chọn số sao đánh giá từ 1 đến 5');
      return;
    }

    try {
      await reviewMutation.mutateAsync({
        adminRating,
        adminReview,
      });
      Alert.alert('Thành công', 'Đã lưu đánh giá báo cáo thành công!', [
        { text: 'Đóng', onPress: onClose },
      ]);
    } catch (err: any) {
      Alert.alert('Lỗi', err?.message || 'Không thể lưu đánh giá báo cáo');
    }
  };

  const memberName = report.user?.profile?.fullName || report.user?.userCode || 'Nhân sự';

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.modalFullContainer}>
        {/* Header */}
        <View style={styles.modalHeader}>
          <Pressable style={styles.modalCloseBtn} onPress={onClose}>
            <MaterialCommunityIcons name="close" size={24} color="#1E293B" />
          </Pressable>
          <View style={styles.modalHeaderCenter}>
            <Text style={styles.modalTitle}>Chi tiết báo cáo</Text>
            <Text style={styles.modalSubtitle}>
              {memberName} • {report.department?.name}
            </Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent}>
          {/* Section 1: General Info */}
          <View style={styles.sectionBox}>
            <Text style={styles.sectionHeaderTitle}>1. Thông tin chung</Text>
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={styles.infoItemLabel}>Họ và tên</Text>
                <Text style={styles.infoItemValue}>{memberName}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoItemLabel}>Bộ phận</Text>
                <Text style={styles.infoItemValue}>{report.department?.name || '-'}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoItemLabel}>Ngày báo cáo</Text>
                <Text style={styles.infoItemValue}>
                  {new Date(report.reportDate).toLocaleDateString('vi-VN')}
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoItemLabel}>Thời gian nộp</Text>
                <Text style={styles.infoItemValue}>
                  {report.reviewedAt || (report.status === 'SUBMITTED' ? 'Đã nộp' : 'Bản nháp')}
                </Text>
              </View>
            </View>
          </View>

          {/* Section 2: Metrics */}
          <View style={styles.sectionBox}>
            <Text style={styles.sectionHeaderTitle}>2. Kết quả công việc định lượng</Text>
            {(!report.metrics || report.metrics.length === 0) ? (
              <Text style={styles.emptySectionText}>Không có chỉ tiêu nào</Text>
            ) : (
              <View style={styles.metricsTable}>
                {report.metrics.map((m: DailyReportMetricItem, idx: number) => (
                  <View key={idx} style={styles.metricRow}>
                    <View style={styles.metricMain}>
                      <Text style={styles.metricName}>{m.name || '-'}</Text>
                      {m.note ? <Text style={styles.metricNote}>{m.note}</Text> : null}
                    </View>
                    <View style={styles.metricValBadge}>
                      <Text style={styles.metricValText}>{String(m.value || '-')}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Section 3: Completed Tasks */}
          <View style={styles.sectionBox}>
            <Text style={styles.sectionHeaderTitle}>3. Công việc đã hoàn thành trong ngày</Text>
            {(!report.completedTasks || report.completedTasks.length === 0) ? (
              <Text style={styles.emptySectionText}>Không có công việc nào</Text>
            ) : (
              report.completedTasks.map((t: DailyReportTaskItem, idx: number) => (
                <View key={idx} style={styles.taskItemRow}>
                  <MaterialCommunityIcons name="check-circle" size={18} color="#10B981" />
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={styles.taskItemTitle}>{t.title}</Text>
                    {t.note ? <Text style={styles.taskItemNote}>{t.note}</Text> : null}
                  </View>
                  {t.isManual && <View style={styles.manualTag}><Text style={styles.manualTagText}>Tự nhập</Text></View>}
                </View>
              ))
            )}
          </View>

          {/* Section 4: In-Progress Tasks */}
          <View style={styles.sectionBox}>
            <Text style={styles.sectionHeaderTitle}>4. Công việc đang thực hiện</Text>
            {(!report.inProgressTasks || report.inProgressTasks.length === 0) ? (
              <Text style={styles.emptySectionText}>Không có công việc nào</Text>
            ) : (
              report.inProgressTasks.map((t: DailyReportTaskItem, idx: number) => (
                <View key={idx} style={styles.taskItemRow}>
                  <MaterialCommunityIcons name="progress-clock" size={18} color="#3B82F6" />
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={styles.taskItemTitle}>{t.title}</Text>
                    {t.expectedDate ? (
                      <Text style={styles.taskItemExpected}>
                        Dự kiến hoàn thành: {t.expectedDate}
                      </Text>
                    ) : null}
                    {t.note ? <Text style={styles.taskItemNote}>{t.note}</Text> : null}
                  </View>
                  {t.isManual && <View style={styles.manualTag}><Text style={styles.manualTagText}>Tự nhập</Text></View>}
                </View>
              ))
            )}
          </View>

          {/* Section 5: Obstacles */}
          <View style={styles.sectionBox}>
            <Text style={styles.sectionHeaderTitle}>5. Khó khăn / Đề xuất hỗ trợ</Text>
            <Text style={styles.textContentBox}>
              {report.obstacles?.trim() || 'Không có khó khăn hay trở ngại nào'}
            </Text>
          </View>

          {/* Section 6: Tomorrow's Plan */}
          <View style={styles.sectionBox}>
            <Text style={styles.sectionHeaderTitle}>6. Kế hoạch công việc ngày mai</Text>
            {(!report.tomorrowPlan || report.tomorrowPlan.length === 0) ? (
              <Text style={styles.emptySectionText}>Chưa có kế hoạch ngày mai</Text>
            ) : (
              report.tomorrowPlan.map((planTitle: string, idx: number) => (
                <View key={idx} style={styles.planItemRow}>
                  <MaterialCommunityIcons name="calendar-clock" size={18} color="#8B5CF6" />
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={styles.planItemTitle}>{planTitle}</Text>
                  </View>
                </View>
              ))
            )}
          </View>

          {/* Section 7: Attachments & Employee Self-Evaluation */}
          <View style={styles.sectionBox}>
            <Text style={styles.sectionHeaderTitle}>7. Đính kèm & Tự nhận xét</Text>
            
            {/* Self Rating */}
            <View style={styles.selfRatingCard}>
              <Text style={styles.selfRatingLabel}>Tự chấm điểm hiệu suất:</Text>
              <View style={styles.starsInline}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <MaterialCommunityIcons
                    key={s}
                    name={s <= (report.selfRating || 0) ? 'star' : 'star-outline'}
                    size={22}
                    color="#F59E0B"
                  />
                ))}
              </View>
            </View>

            {report.selfReview ? (
              <View style={{ marginTop: 10 }}>
                <Text style={styles.selfReviewNoteLabel}>Lời tự nhận xét:</Text>
                <Text style={styles.textContentBox}>{report.selfReview}</Text>
              </View>
            ) : null}

            {/* Attachments */}
            {report.attachments && report.attachments.length > 0 ? (
              <View style={{ marginTop: 12 }}>
                <Text style={styles.selfReviewNoteLabel}>Tệp đính kèm ({report.attachments.length}):</Text>
                {report.attachments.map((file: DailyReportAttachmentItem, idx: number) => (
                  <Pressable
                    key={idx}
                    style={styles.attachmentChip}
                    onPress={() => {
                      if (file.url) {
                        void Linking.openURL(file.url);
                      }
                    }}
                  >
                    <MaterialCommunityIcons name="file-document-outline" size={18} color="#2563EB" />
                    <Text style={styles.attachmentName} numberOfLines={1}>
                      {file.fileName || `Tệp ${idx + 1}`}
                    </Text>
                    <MaterialCommunityIcons name="open-in-new" size={16} color="#64748B" />
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>

          {/* Section 8: Admin Review & Rating (Single-Review Lock UI) */}
          <View style={[styles.sectionBox, styles.adminReviewSection]}>
            <View style={styles.adminReviewHeader}>
              <MaterialCommunityIcons name="shield-star" size={22} color="#D97706" />
              <Text style={styles.adminReviewTitle}>Đánh giá của Ban Giám Đốc / Admin</Text>
            </View>

            {isReviewedByOther && (
              <View style={styles.lockWarningCard}>
                <MaterialCommunityIcons name="lock" size={20} color="#DC2626" />
                <Text style={styles.lockWarningText}>
                  Báo cáo này đã được Admin {report.reviewedBy?.profile?.fullName || report.reviewedBy?.userCode || 'khác'} đánh giá.
                </Text>
              </View>
            )}

            {/* Star Rating Picker */}
            <Text style={styles.adminRatingLabel}>Chấm điểm hiệu suất (1 - 5 sao):</Text>
            <View style={styles.starPickerRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Pressable
                  key={star}
                  style={styles.starBtn}
                  onPress={() => setAdminRating(star)}
                >
                  <MaterialCommunityIcons
                    name={star <= adminRating ? 'star' : 'star-outline'}
                    size={36}
                    color="#F59E0B"
                  />
                </Pressable>
              ))}
            </View>

            {/* Admin Notes Input */}
            <Text style={styles.adminRatingLabel}>Nhận xét / Góp ý của Admin:</Text>
            <TextInput
              style={styles.adminNotesInput}
              multiline
              numberOfLines={4}
              placeholder="Nhập nhận xét, đánh giá hoặc chỉ đạo cho nhân sự..."
              value={adminReview}
              onChangeText={setAdminReview}
            />

            {/* Save Button */}
            <Pressable
              style={[
                styles.saveReviewBtn,
                reviewMutation.isPending && styles.saveReviewBtnDisabled,
              ]}
              onPress={handleSubmitReview}
              disabled={reviewMutation.isPending}
            >
              {reviewMutation.isPending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <MaterialCommunityIcons name="check-decagram" size={20} color="#fff" />
                  <Text style={styles.saveReviewBtnText}>
                    {isReviewed ? 'Cập nhật đánh giá' : 'Lưu & Khóa đánh giá'}
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  dateBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dateNavBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  dateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateDisplayText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  todayBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  todayBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2563EB',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  filtersSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  filterPillsScroll: {
    flexDirection: 'row',
    gap: 8,
  },
  deptPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  deptPillActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  deptPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  deptPillTextActive: {
    color: '#FFFFFF',
  },
  statusPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statusPillActive: {
    backgroundColor: '#1E293B',
    borderColor: '#1E293B',
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  statusPillTextActive: {
    color: '#FFFFFF',
  },
  listContainer: {
    marginBottom: 40,
  },
  listHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 10,
  },
  loadingBox: {
    padding: 30,
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
  },
  emptyBox: {
    padding: 36,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  emptySub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
  },
  reportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  reportCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  userName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  userDept: {
    fontSize: 12,
    color: '#64748B',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusReviewed: {
    backgroundColor: '#ECFDF5',
  },
  statusReviewedText: {
    color: '#059669',
  },
  statusSubmitted: {
    backgroundColor: '#FEF3C7',
  },
  statusSubmittedText: {
    color: '#D97706',
  },
  statusDraft: {
    backgroundColor: '#F1F5F9',
  },
  statusDraftText: {
    color: '#64748B',
  },
  ratingInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 10,
  },
  ratingCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingColLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  starsInline: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingPendingText: {
    fontSize: 12,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  snippetRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  snippetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  snippetItemText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  reviewerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: '#F1F5F9',
  },
  reviewerText: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
  },
  modalFullContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalCloseBtn: {
    padding: 6,
  },
  modalHeaderCenter: {
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
  },
  modalScroll: {
    flex: 1,
  },
  modalScrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 10,
  },
  infoItem: {
    width: '50%',
  },
  infoItemLabel: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 2,
  },
  infoItemValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  emptySectionText: {
    fontSize: 13,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  metricsTable: {
    gap: 8,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
  },
  metricMain: {
    flex: 1,
  },
  metricName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  metricNote: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  metricValBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  metricValText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB',
  },
  taskItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  taskItemTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  taskItemExpected: {
    fontSize: 11,
    color: '#3B82F6',
    marginTop: 2,
  },
  taskItemNote: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  manualTag: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  manualTagText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  planItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  planItemTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  textContentBox: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 20,
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 8,
  },
  selfRatingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFBEB',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  selfRatingLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#92400E',
  },
  selfReviewNoteLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 4,
  },
  attachmentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    padding: 8,
    borderRadius: 8,
    marginTop: 6,
    gap: 8,
  },
  attachmentName: {
    flex: 1,
    fontSize: 12,
    color: '#1E293B',
    fontWeight: '500',
  },
  adminReviewSection: {
    borderColor: '#F59E0B',
    borderWidth: 1.5,
    backgroundColor: '#FFFDF5',
  },
  adminReviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  adminReviewTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#92400E',
  },
  lockWarningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginBottom: 12,
  },
  lockWarningText: {
    flex: 1,
    fontSize: 12,
    color: '#991B1B',
    fontWeight: '500',
  },
  adminRatingLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
  },
  starPickerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginVertical: 10,
  },
  starBtn: {
    padding: 4,
  },
  adminNotesInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    color: '#1E293B',
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  saveReviewBtn: {
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  saveReviewBtnDisabled: {
    opacity: 0.6,
  },
  saveReviewBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
