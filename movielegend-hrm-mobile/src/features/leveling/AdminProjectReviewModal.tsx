import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Linking,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LevelDepartmentProject, BulletSubTask } from './levelProjectsStore';
import { getAbsoluteImageUrl } from '../../utils/image';
import { CustomAlert } from '../../components/CustomAlert';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface AdminProjectReviewModalProps {
  visible: boolean;
  project: LevelDepartmentProject | null;
  departmentName?: string;
  onClose: () => void;
  onApprove: (
    levelNumber: number,
    adminFeedback?: string,
    subTaskFeedbacks?: Array<{ subTaskId: string; adminNote?: string }>
  ) => Promise<void> | void;
  onReject: (
    levelNumber: number,
    adminFeedback: string,
    subTaskFeedbacks?: Array<{ subTaskId: string; adminNote?: string }>
  ) => Promise<void> | void;
}

export const AdminProjectReviewModal: React.FC<AdminProjectReviewModalProps> = ({
  visible,
  project,
  departmentName,
  onClose,
  onApprove,
  onReject,
}) => {
  const insets = useSafeAreaInsets();
  const [adminFeedback, setAdminFeedback] = useState('');
  const [taskAdminNotes, setTaskAdminNotes] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedZoomImage, setSelectedZoomImage] = useState<string | null>(null);

  React.useEffect(() => {
    if (project?.subTasks) {
      const initialNotes: Record<string, string> = {};
      project.subTasks.forEach((st) => {
        if (st.adminNote) {
          initialNotes[st.id] = st.adminNote;
        }
      });
      setTaskAdminNotes(initialNotes);
    }
  }, [project]);

  if (!project) return null;

  const completedTasksCount = project.subTasks.filter(
    (t) => t.status === 'LEADER_APPROVED' || (t.status as any) === 'ADMIN_APPROVED'
  ).length;
  const totalTasksCount = project.subTasks.length;
  const percent = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;
  const isApproved = project.status === 'ADMIN_APPROVED';
  const isSubmitted = project.status === 'SUBMITTED_TO_ADMIN';

  const cleanDeptName = (departmentName || project.departmentName || 'MEDIA').toUpperCase();
  const branchSubtitle = 'MOVIELEGEND-HÀ NỘI';

  const handleOpenUrl = async (url?: string) => {
    if (!url) return;
    try {
      const target = url.startsWith('http') ? url : `https://${url}`;
      const supported = await Linking.canOpenURL(target);
      if (supported) {
        await Linking.openURL(target);
      } else {
        CustomAlert.alert('Không thể mở liên kết', `Địa chỉ: ${url}`);
      }
    } catch {
      CustomAlert.alert('Lỗi', 'Không thể mở đường dẫn này.');
    }
  };

  const getSubTaskFeedbacks = () => {
    return project.subTasks.map((t) => ({
      subTaskId: t.id,
      adminNote: taskAdminNotes[t.id] !== undefined ? taskAdminNotes[t.id] : (t.adminNote || ''),
    }));
  };

  const handleApprove = () => {
    CustomAlert.alert(
      'Phê Duyệt Nghiệm Thu Dự Án',
      `Xác nhận phê duyệt hoàn tất Dự án Level ${project.levelNumber} (${project.projectName}) cho phòng ${cleanDeptName}? Toàn bộ thành viên tham gia sẽ được ghi nhận hoàn thành dự án thăng cấp.`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác Nhận Duyệt',
          style: 'default',
          onPress: async () => {
            try {
              setIsSubmitting(true);
              const feedbacks = getSubTaskFeedbacks();
              await onApprove(project.levelNumber, adminFeedback.trim(), feedbacks);
              CustomAlert.alert('Thành Công', `Đã phê duyệt nghiệm thu dự án Level ${project.levelNumber}!`);
              onClose();
            } catch (err: any) {
              CustomAlert.alert('Lỗi', err?.message || 'Không thể phê duyệt dự án.');
            } finally {
              setIsSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const handleReject = () => {
    if (!adminFeedback.trim()) {
      CustomAlert.alert(
        'Yêu cầu phản hồi',
        'Vui lòng nhập lý do hoặc nội dung chỉ đạo cần bổ sung/sửa lại để Leader và các thành viên nắm rõ.'
      );
      return;
    }

    CustomAlert.alert(
      'Yêu Cầu Bổ Sung / Sửa Lại',
      `Bạn có chắc chắn muốn trả lại Dự án Level ${project.levelNumber} cho phòng ${cleanDeptName} để bổ sung/sửa lại?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Gửi Yêu Cầu Sửa',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsSubmitting(true);
              const feedbacks = getSubTaskFeedbacks();
              await onReject(project.levelNumber, adminFeedback.trim(), feedbacks);
              CustomAlert.alert('Đã Gửi', 'Đã chuyển trạng thái dự án về yêu cầu chỉnh sửa.');
              onClose();
            } catch (err: any) {
              CustomAlert.alert('Lỗi', err?.message || 'Không thể gửi yêu cầu chỉnh sửa.');
            } finally {
              setIsSubmitting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <>
      <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
        <View style={styles.modalRoot}>
          <StatusBar barStyle="light-content" backgroundColor="#102739" />

          {/* ── Top Navy Header (#102739) matching Screenshot 2 ── */}
          <View style={[styles.modalHeaderWrap, { paddingTop: Math.max(insets.top, 16) + 4 }]}>
            <View style={styles.modalHeaderTopRow}>
              <Text style={styles.modalHeaderSubtitleSmall}>Chi tiết dự án</Text>
              <TouchableOpacity onPress={onClose} hitSlop={12} activeOpacity={0.7}>
                <Text style={styles.modalCloseText}>Đóng</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalMainTitle}>{project.projectName || `Dự án ${cleanDeptName}`}</Text>
            <Text style={styles.modalMainSubtitle}>
              Level {project.levelNumber} · {branchSubtitle}
            </Text>
          </View>

          {/* ── Curved Sheet Body ── */}
          <View style={styles.modalCurvedSheet}>
            <ScrollView
              style={styles.modalScrollView}
              contentContainerStyle={[
                styles.modalScrollContent,
                { paddingBottom: Math.max(insets.bottom, 16) + 32 },
              ]}
              showsVerticalScrollIndicator={false}
            >
              {/* ── Card 1: Tiến độ hoàn thành ── */}
              <View style={styles.cardBox}>
                <View
                  style={[
                    styles.statusPillBadge,
                    isApproved
                      ? styles.statusPillBadgeApproved
                      : isSubmitted
                      ? styles.statusPillBadgeSubmitted
                      : styles.statusPillBadgeInProgress,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusPillBadgeText,
                      isApproved
                        ? styles.statusPillBadgeTextApproved
                        : isSubmitted
                        ? styles.statusPillBadgeTextSubmitted
                        : styles.statusPillBadgeTextInProgress,
                    ]}
                  >
                    {isApproved ? 'Đã nghiệm thu' : isSubmitted ? 'Chờ duyệt' : 'Đang thực hiện'}
                  </Text>
                </View>

                <Text style={styles.progressSubtitleLabel}>Tiến độ hoàn thành</Text>
                <Text style={styles.progressMetricBig}>
                  {completedTasksCount}/{totalTasksCount} đầu việc · {percent}%
                </Text>

                <View style={styles.progressBarTrack}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${percent}%`,
                        backgroundColor: isApproved ? '#059669' : '#102739',
                      },
                    ]}
                  />
                </View>
              </View>

              {/* ── Card 2: Báo cáo nghiệm thu ── */}
              <View style={styles.cardBox}>
                <Text style={styles.cardBoxTitle}>Báo cáo nghiệm thu</Text>
                <Text style={styles.cardBoxSubtitle}>Trưởng bộ phận (Leader)</Text>

                <View style={styles.leaderNoteContainer}>
                  <Text style={styles.leaderNoteTextItalic}>
                    {project.leaderReportNote || 'Leader chưa để lại ghi chú tổng kết.'}
                  </Text>
                </View>

                {project.leaderReportUrl ? (
                  <TouchableOpacity
                    style={styles.linkAttachmentBtn}
                    activeOpacity={0.8}
                    onPress={() => handleOpenUrl(project.leaderReportUrl)}
                  >
                    <Ionicons name="document-text-outline" size={18} color="#2563EB" />
                    <Text style={styles.linkAttachmentText} numberOfLines={1}>
                      {project.leaderReportUrl}
                    </Text>
                    <Ionicons name="open-outline" size={16} color="#2563EB" />
                  </TouchableOpacity>
                ) : null}
              </View>

              {/* ── Card 3: Đầu việc con (N) ── */}
              <View style={styles.cardBox}>
                <Text style={styles.cardBoxTitle}>
                  Đầu việc con ({project.subTasks.length})
                </Text>

                {project.subTasks.length === 0 ? (
                  <Text style={styles.emptySubTaskText}>Chưa có công việc con nào được định cấu hình.</Text>
                ) : (
                  project.subTasks.map((task, idx) => (
                    <SubTaskTemplateItem
                      key={task.id || idx}
                      index={idx + 1}
                      task={task}
                      adminNoteValue={taskAdminNotes[task.id]}
                      onAdminNoteChange={(val) => {
                        setTaskAdminNotes((prev) => ({ ...prev, [task.id]: val }));
                      }}
                      onImagePress={(imgUri) => setSelectedZoomImage(imgUri)}
                      onOpenUrl={handleOpenUrl}
                    />
                  ))
                )}
              </View>

              {/* ── Card 4: Nghiệm thu dự án ── */}
              <View style={styles.cardBox}>
                <Text style={styles.cardBoxTitle}>Nghiệm thu dự án</Text>
                <Text style={styles.cardBoxSubtitle}>Ban Giám đốc</Text>

                <Text style={styles.reviewInputLabel}>
                  Ghi chú chỉ đạo / Nhận xét nghiệm thu (tùy chọn)
                </Text>
                <TextInput
                  style={styles.reviewTextInput}
                  placeholder="Nhập nhận xét, đánh giá kết quả dự án hoặc lưu ý bổ sung..."
                  placeholderTextColor="#94A3B8"
                  value={adminFeedback}
                  onChangeText={setAdminFeedback}
                  multiline
                  numberOfLines={3}
                />

                <TouchableOpacity
                  style={[styles.btnNavyApprove, isSubmitting && styles.btnDisabled]}
                  onPress={handleApprove}
                  disabled={isSubmitting}
                  activeOpacity={0.8}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.btnNavyApproveText}>Phê duyệt nghiệm thu</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.btnRedReject, isSubmitting && styles.btnDisabled]}
                  onPress={handleReject}
                  disabled={isSubmitting}
                  activeOpacity={0.8}
                >
                  <Text style={styles.btnRedRejectText}>Yêu cầu sửa</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Full-Screen Image Zoom Modal */}
      {selectedZoomImage && (
        <Modal
          visible={Boolean(selectedZoomImage)}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedZoomImage(null)}
        >
          <View style={styles.zoomOverlay}>
            <TouchableOpacity
              style={styles.zoomCloseBtn}
              onPress={() => setSelectedZoomImage(null)}
              activeOpacity={0.8}
            >
              <Ionicons name="close-circle" size={36} color="#FFFFFF" />
            </TouchableOpacity>
            <Image
              source={{ uri: selectedZoomImage }}
              style={styles.zoomImage}
              resizeMode="contain"
            />
          </View>
        </Modal>
      )}
    </>
  );
};

// ── Sub-component: SubTask Inspection Item matching Screenshot 2 ──
interface SubTaskTemplateItemProps {
  index: number;
  task: BulletSubTask;
  adminNoteValue?: string;
  onAdminNoteChange?: (text: string) => void;
  onImagePress: (imgUri: string) => void;
  onOpenUrl: (url?: string) => void;
}

const SubTaskTemplateItem: React.FC<SubTaskTemplateItemProps> = ({
  index,
  task,
  adminNoteValue,
  onAdminNoteChange,
  onImagePress,
  onOpenUrl,
}) => {
  const isApproved = task.status === 'LEADER_APPROVED' || (task.status as any) === 'ADMIN_APPROVED';
  const isSubmitted = task.status === 'SUBMITTED';

  const padNum = index < 10 ? `0${index}` : `${index}`;

  return (
    <View style={styles.subTaskBox}>
      {/* Top row */}
      <View style={styles.subTaskTopRow}>
        <View style={styles.subTaskLeftGroup}>
          <View style={styles.subTaskNumberBadge}>
            <Text style={styles.subTaskNumberBadgeText}>{padNum}</Text>
          </View>

          <View style={styles.subTaskTitleCol}>
            <Text style={styles.subTaskTitleText} numberOfLines={2}>
              {task.title}
            </Text>
            <Text style={styles.subTaskAssigneeText}>
              Phụ trách: <Text style={styles.subTaskAssigneeBold}>{task.assignedToUserName || 'Chưa phân công'}</Text>
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.subTaskStatusPill,
            isApproved
              ? styles.subTaskStatusApproved
              : isSubmitted
              ? styles.subTaskStatusSubmitted
              : styles.subTaskStatusInProgress,
          ]}
        >
          <Text
            style={[
              styles.subTaskStatusPillText,
              isApproved
                ? styles.subTaskStatusApprovedText
                : isSubmitted
                ? styles.subTaskStatusSubmittedText
                : styles.subTaskStatusInProgressText,
            ]}
          >
            {isApproved ? 'Hoàn thành' : isSubmitted ? 'Chờ duyệt' : 'Đang làm'}
          </Text>
        </View>
      </View>

      {/* Description */}
      {task.description ? (
        <Text style={styles.subTaskDescriptionText}>{task.description}</Text>
      ) : null}

      {/* Proof / submission note if any */}
      {task.submissionNote ? (
        <View style={styles.subTaskProofBox}>
          <Text style={styles.subTaskProofLabel}>Báo cáo nộp: </Text>
          <Text style={styles.subTaskProofText}>{task.submissionNote}</Text>
        </View>
      ) : null}

      {task.evidenceUrl ? (
        <TouchableOpacity
          style={styles.subTaskLinkRow}
          activeOpacity={0.7}
          onPress={() => onOpenUrl(task.evidenceUrl)}
        >
          <Ionicons name="link-outline" size={13} color="#2563EB" />
          <Text style={styles.subTaskLinkText} numberOfLines={1}>
            {task.evidenceUrl}
          </Text>
        </TouchableOpacity>
      ) : null}

      {Array.isArray(task.evidenceImages) && task.evidenceImages.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
          {task.evidenceImages.map((img, i) => {
            const resolvedImg = getAbsoluteImageUrl(img) || img;
            return (
              <TouchableOpacity
                key={i}
                onPress={() => onImagePress(resolvedImg)}
                style={styles.subTaskImgThumb}
              >
                <Image source={{ uri: resolvedImg }} style={styles.subTaskImg} />
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      ) : null}

      {/* Review Note for this subtask */}
      <Text style={styles.subTaskReviewLabel}>
        Nhận xét riêng cho đầu việc {task.orderNumber || index}
      </Text>
      <TextInput
        style={styles.subTaskReviewInput}
        placeholder="Nhập nhận xét / đánh giá riêng cho nhân sự..."
        placeholderTextColor="#94A3B8"
        value={adminNoteValue !== undefined ? adminNoteValue : (task.adminNote || '')}
        onChangeText={onAdminNoteChange}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    backgroundColor: '#102739',
  },

  /* ── Header (#102739) ── */
  modalHeaderWrap: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    backgroundColor: '#102739',
  },
  modalHeaderTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalHeaderSubtitleSmall: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500',
  },
  modalCloseText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalMainTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  modalMainSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
    fontWeight: '500',
  },

  /* ── Curved Sheet Body ── */
  modalCurvedSheet: {
    flex: 1,
    backgroundColor: '#F4F6F9',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  modalScrollView: {
    flex: 1,
  },
  modalScrollContent: {
    padding: 16,
  },

  /* ── Card Box ── */
  cardBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardBoxTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  cardBoxSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 12,
  },

  /* ── Status Pill Badge ── */
  statusPillBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  statusPillBadgeApproved: {
    backgroundColor: '#DCFCE7',
  },
  statusPillBadgeSubmitted: {
    backgroundColor: '#EFF6FF',
  },
  statusPillBadgeInProgress: {
    backgroundColor: '#FEF3C7',
  },
  statusPillBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusPillBadgeTextApproved: {
    color: '#15803D',
  },
  statusPillBadgeTextSubmitted: {
    color: '#2563EB',
  },
  statusPillBadgeTextInProgress: {
    color: '#B45309',
  },

  /* ── Progress Card Metrics ── */
  progressSubtitleLabel: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 2,
  },
  progressMetricBig: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 6,
    borderRadius: 3,
  },

  /* ── Leader Note Box ── */
  leaderNoteContainer: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 14,
    backgroundColor: '#F8FAFC',
  },
  leaderNoteTextItalic: {
    fontStyle: 'italic',
    color: '#64748B',
    fontSize: 13,
    lineHeight: 20,
  },
  linkAttachmentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 10,
  },
  linkAttachmentText: {
    flex: 1,
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '600',
  },

  /* ── SubTask Inspection Item ── */
  emptySubTaskText: {
    fontSize: 13,
    color: '#94A3B8',
    fontStyle: 'italic',
    paddingVertical: 8,
  },
  subTaskBox: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  subTaskTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  subTaskLeftGroup: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    marginRight: 8,
  },
  subTaskNumberBadge: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  subTaskNumberBadgeText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
  },
  subTaskTitleCol: {
    flex: 1,
  },
  subTaskTitleText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 19,
  },
  subTaskAssigneeText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  subTaskAssigneeBold: {
    color: '#0F172A',
    fontWeight: '700',
  },
  subTaskStatusPill: {
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  subTaskStatusApproved: {
    backgroundColor: '#DCFCE7',
  },
  subTaskStatusSubmitted: {
    backgroundColor: '#EFF6FF',
  },
  subTaskStatusInProgress: {
    backgroundColor: '#FEF3C7',
  },
  subTaskStatusPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  subTaskStatusApprovedText: {
    color: '#15803D',
  },
  subTaskStatusSubmittedText: {
    color: '#2563EB',
  },
  subTaskStatusInProgressText: {
    color: '#B45309',
  },
  subTaskDescriptionText: {
    fontSize: 13,
    color: '#64748B',
    fontStyle: 'italic',
    marginTop: 8,
    lineHeight: 18,
  },
  subTaskProofBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    padding: 8,
    marginTop: 8,
  },
  subTaskProofLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  subTaskProofText: {
    fontSize: 12,
    color: '#1E293B',
    marginTop: 2,
  },
  subTaskLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  subTaskLinkText: {
    fontSize: 12,
    color: '#2563EB',
    textDecorationLine: 'underline',
  },
  subTaskImgThumb: {
    width: 60,
    height: 60,
    borderRadius: 6,
    overflow: 'hidden',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  subTaskImg: {
    width: '100%',
    height: '100%',
  },
  subTaskReviewLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 12,
    marginBottom: 6,
  },
  subTaskReviewInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
    minHeight: 44,
  },

  /* ── Card 4 Inputs & Action Buttons ── */
  reviewInputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  reviewTextInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
    minHeight: 74,
    textAlignVertical: 'top',
  },
  btnNavyApprove: {
    backgroundColor: '#102739',
    borderRadius: 8,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 14,
  },
  btnNavyApproveText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  btnRedReject: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 8,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  btnRedRejectText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#DC2626',
  },
  btnDisabled: {
    opacity: 0.6,
  },

  /* ── Zoom Overlay ── */
  zoomOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomCloseBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
  },
  zoomImage: {
    width: SCREEN_WIDTH - 20,
    height: '80%',
  },
});
