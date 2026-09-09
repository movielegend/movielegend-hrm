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
  Alert,
  Dimensions,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LevelDepartmentProject, BulletSubTask } from './levelProjectsStore';
import { LEVEL_COLORS, LevelNameBadge } from '../../components/common/LevelNameBadge';
import { getAbsoluteImageUrl } from '../../utils/image';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface AdminProjectReviewModalProps {
  visible: boolean;
  project: LevelDepartmentProject | null;
  departmentName?: string;
  onClose: () => void;
  onApprove: (levelNumber: number, adminFeedback?: string) => Promise<void> | void;
  onReject: (levelNumber: number, adminFeedback: string) => Promise<void> | void;
}

export const AdminProjectReviewModal: React.FC<AdminProjectReviewModalProps> = ({
  visible,
  project,
  departmentName,
  onClose,
  onApprove,
  onReject,
}) => {
  const [adminFeedback, setAdminFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedZoomImage, setSelectedZoomImage] = useState<string | null>(null);

  if (!project) return null;

  const levelColor = LEVEL_COLORS[project.levelNumber] || '#2563EB';
  const completedTasksCount = project.subTasks.filter(
    (t) => t.status === 'LEADER_APPROVED' || (t.status as any) === 'ADMIN_APPROVED',
  ).length;
  const totalTasksCount = project.subTasks.length;
  const isSubmittedToAdmin = project.status === 'SUBMITTED_TO_ADMIN';
  const isAdminApproved = project.status === 'ADMIN_APPROVED';

  const handleOpenUrl = async (url?: string) => {
    if (!url) return;
    try {
      const target = url.startsWith('http') ? url : `https://${url}`;
      const supported = await Linking.canOpenURL(target);
      if (supported) {
        await Linking.openURL(target);
      } else {
        Alert.alert('Không thể mở liên kết', `Địa chỉ: ${url}`);
      }
    } catch {
      Alert.alert('Lỗi', 'Không thể mở đường dẫn này.');
    }
  };

  const handleApprove = () => {
    Alert.alert(
      'Phê Duyệt Nghiệm Thu Dự Án 🏆',
      `Xác nhận phê duyệt hoàn tất Dự án Level ${project.levelNumber} (${project.projectName}) cho phòng ${departmentName || project.departmentName}? Toàn bộ thành viên tham gia sẽ được ghi nhận hoàn thành dự án thăng cấp.`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác Nhận Duyệt',
          style: 'default',
          onPress: async () => {
            try {
              setIsSubmitting(true);
              await onApprove(project.levelNumber, adminFeedback.trim());
              Alert.alert('Thành Công', `Đã phê duyệt nghiệm thu dự án Level ${project.levelNumber}!`);
              onClose();
            } catch (err: any) {
              Alert.alert('Lỗi', err?.message || 'Không thể phê duyệt dự án.');
            } finally {
              setIsSubmitting(false);
            }
          },
        },
      ],
    );
  };

  const handleReject = () => {
    if (!adminFeedback.trim()) {
      Alert.alert(
        'Yêu cầu phản hồi',
        'Vui lòng nhập lý do hoặc nội dung chỉ đạo cần bổ sung/sửa lại để Leader và các thành viên nắm rõ.',
      );
      return;
    }

    Alert.alert(
      'Yêu Cầu Bổ Sung / Sửa Lại ⚠️',
      `Bạn có chắc chắn muốn trả lại Dự án Level ${project.levelNumber} cho phòng ${departmentName || project.departmentName} để bổ sung/sửa lại?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Gửi Yêu Cầu Sửa',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsSubmitting(true);
              await onReject(project.levelNumber, adminFeedback.trim());
              Alert.alert('Đã Gửi', 'Đã chuyển trạng thái dự án về yêu cầu chỉnh sửa.');
              onClose();
            } catch (err: any) {
              Alert.alert('Lỗi', err?.message || 'Không thể gửi yêu cầu chỉnh sửa.');
            } finally {
              setIsSubmitting(false);
            }
          },
        },
      ],
    );
  };

  return (
    <>
      <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
        <View style={styles.overlay}>
          <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <View style={styles.badgeRow}>
                  <View style={[styles.levelTag, { backgroundColor: `${levelColor}20`, borderColor: levelColor }]}>
                    <Ionicons name="trophy" size={13} color={levelColor} style={{ marginRight: 4 }} />
                    <Text style={[styles.levelTagText, { color: levelColor }]}>
                      Level {project.levelNumber} - {project.levelName}
                    </Text>
                  </View>
                  <View style={styles.deptTag}>
                    <Text style={styles.deptTagText} numberOfLines={1}>
                      {departmentName || project.departmentName}
                    </Text>
                  </View>
                </View>
                <Text style={styles.title} numberOfLines={2}>
                  {project.projectName}
                </Text>
              </View>

              <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
              {/* Status Banner */}
              <View
                style={[
                  styles.statusBanner,
                  isAdminApproved
                    ? styles.statusBannerApproved
                    : isSubmittedToAdmin
                    ? styles.statusBannerSubmitted
                    : styles.statusBannerInProgress,
                ]}
              >
                <Ionicons
                  name={
                    isAdminApproved
                      ? 'checkmark-circle'
                      : isSubmittedToAdmin
                      ? 'time-outline'
                      : 'hourglass-outline'
                  }
                  size={20}
                  color={
                    isAdminApproved ? '#10B981' : isSubmittedToAdmin ? '#F59E0B' : '#3B82F6'
                  }
                />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text
                    style={[
                      styles.statusBannerTitle,
                      {
                        color: isAdminApproved
                          ? '#065F46'
                          : isSubmittedToAdmin
                          ? '#92400E'
                          : '#1E40AF',
                      },
                    ]}
                  >
                    {isAdminApproved
                      ? 'Dự án đã được Ban Giám Đốc nghiệm thu hoàn tất'
                      : isSubmittedToAdmin
                      ? 'Leader đã nộp báo cáo — Đang chờ Admin nghiệm thu'
                      : 'Dự án đang trong quá trình thực hiện'}
                  </Text>
                  <Text style={styles.statusBannerSubtitle}>
                    Tiến độ hoàn thành: {completedTasksCount}/{totalTasksCount} đầu việc ({totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0}%)
                  </Text>
                </View>
              </View>

              {/* Reward & Motivation Card */}
              {project.rewardItem ? (
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Ionicons name="gift-outline" size={16} color="#D97706" />
                    <Text style={styles.cardTitle}>Gói Phần Thưởng & Quyền Lợi Level</Text>
                  </View>
                  <Text style={styles.rewardText}>{project.rewardItem}</Text>
                </View>
              ) : null}

              {/* Leader's Overall Report Section */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Ionicons name="newspaper-outline" size={16} color="#2563EB" />
                  <Text style={styles.cardTitle}>Báo Cáo Nghiệm Thu Từ Trưởng Bộ Phận (Leader)</Text>
                </View>

                {project.leaderReportNote ? (
                  <View style={styles.leaderNoteBox}>
                    <Text style={styles.leaderNoteText}>{project.leaderReportNote}</Text>
                  </View>
                ) : (
                  <Text style={styles.emptyText}>Leader chưa để lại ghi chú tổng kết.</Text>
                )}

                {project.leaderReportUrl ? (
                  <TouchableOpacity
                    style={styles.linkCard}
                    activeOpacity={0.8}
                    onPress={() => handleOpenUrl(project.leaderReportUrl)}
                  >
                    <Ionicons name="document-text-outline" size={20} color="#2563EB" />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.linkLabel}>Tài liệu / Link Drive minh chứng tổng hợp:</Text>
                      <Text style={styles.linkUrl} numberOfLines={1}>
                        {project.leaderReportUrl}
                      </Text>
                    </View>
                    <Ionicons name="open-outline" size={18} color="#2563EB" />
                  </TouchableOpacity>
                ) : null}
              </View>

              {/* Sub-Tasks Detailed Breakdown */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Ionicons name="list-outline" size={16} color="#059669" />
                  <Text style={styles.cardTitle}>
                    Chi Tiết Từng Đầu Việc Con ({project.subTasks.length} việc)
                  </Text>
                </View>

                {project.subTasks.length === 0 ? (
                  <Text style={styles.emptyText}>Chưa có công việc con nào được định cấu hình.</Text>
                ) : (
                  project.subTasks.map((task, idx) => (
                    <SubTaskInspectionItem
                      key={task.id || idx}
                      index={idx + 1}
                      task={task}
                      onImagePress={(imgUri) => setSelectedZoomImage(imgUri)}
                      onOpenUrl={handleOpenUrl}
                    />
                  ))
                )}
              </View>

              {/* Previous Admin Feedback if any */}
              {project.adminFeedback ? (
                <View style={[styles.card, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
                  <View style={styles.cardHeader}>
                    <Ionicons name="chatbubble-ellipses-outline" size={16} color="#2563EB" />
                    <Text style={[styles.cardTitle, { color: '#1E40AF' }]}>Ý Kiến Chỉ Đạo Của Admin</Text>
                  </View>
                  <Text style={{ fontSize: 13, color: '#1E3A8A', lineHeight: 19 }}>
                    {project.adminFeedback}
                  </Text>
                </View>
              ) : null}

              {/* If already approved: Read-only Completed Notice Card */}
              {isAdminApproved ? (
                <View style={[styles.card, styles.approvedNoticeCard]}>
                  <View style={styles.cardHeader}>
                    <Ionicons name="checkmark-done-circle" size={22} color="#059669" />
                    <Text style={[styles.cardTitle, { color: '#065F46', fontSize: 15 }]}>
                      Dự Án Đã Nghiệm Thu Hoàn Tất 🏆
                    </Text>
                  </View>
                  <Text style={styles.approvedNoticeSub}>
                    Dự án này đã được Ban Giám Đốc nghiệm thu chính thức và lưu trữ vào lịch sử hoàn thành của phòng ban.
                  </Text>
                  {project.adminApprovedAt && (
                    <View style={styles.approvedDateRow}>
                      <Ionicons name="calendar-outline" size={14} color="#059669" />
                      <Text style={styles.approvedDateText}>
                        Thời gian nghiệm thu: {new Date(project.adminApprovedAt).toLocaleString('vi-VN')}
                      </Text>
                    </View>
                  )}
                  {Boolean(project.adminFeedback) && (
                    <View style={styles.approvedFeedbackBox}>
                      <Text style={styles.approvedFeedbackLabel}>Ý kiến chỉ đạo của Ban Giám Đốc:</Text>
                      <Text style={styles.approvedFeedbackText}>"{project.adminFeedback}"</Text>
                    </View>
                  )}
                  <TouchableOpacity style={styles.btnCloseArchive} onPress={onClose} activeOpacity={0.8}>
                    <Ionicons name="checkmark" size={16} color="#059669" style={{ marginRight: 6 }} />
                    <Text style={styles.btnCloseArchiveText}>Đóng Hồ Sơ Nghiệm Thu</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                /* Admin Decision Section when project is in progress or awaiting review */
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Ionicons name="shield-checkmark-outline" size={16} color="#4F46E5" />
                    <Text style={styles.cardTitle}>Quyết Định Nghiệm Thu Của Ban Giám Đốc</Text>
                  </View>

                  <Text style={styles.inputLabel}>Ghi chú chỉ đạo / Nhận xét nghiệm thu (tùy chọn):</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Nhập nhận xét, đánh giá kết quả dự án hoặc lưu ý bổ sung..."
                    placeholderTextColor="#94A3B8"
                    value={adminFeedback}
                    onChangeText={setAdminFeedback}
                    multiline
                    numberOfLines={3}
                  />

                  <View style={styles.actionButtonsRow}>
                    <TouchableOpacity
                      style={[styles.btnReject, isSubmitting && styles.btnDisabled]}
                      onPress={handleReject}
                      disabled={isSubmitting}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="refresh-outline" size={16} color="#DC2626" style={{ marginRight: 6 }} />
                      <Text style={styles.btnRejectText}>Yêu Cầu Sửa</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.btnApprove, isSubmitting && styles.btnDisabled]}
                      onPress={handleApprove}
                      disabled={isSubmitting}
                      activeOpacity={0.8}
                    >
                      {isSubmitting ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <>
                          <Ionicons name="checkmark-circle-outline" size={17} color="#FFFFFF" style={{ marginRight: 6 }} />
                          <Text style={styles.btnApproveText}>Phê Duyệt Nghiệm Thu</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              <View style={{ height: 40 }} />
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

// Sub-component: SubTask Inspection Item
interface SubTaskInspectionItemProps {
  index: number;
  task: BulletSubTask;
  onImagePress: (imgUri: string) => void;
  onOpenUrl: (url?: string) => void;
}

const SubTaskInspectionItem: React.FC<SubTaskInspectionItemProps> = ({
  index,
  task,
  onImagePress,
  onOpenUrl,
}) => {
  const isLeaderApproved = task.status === 'LEADER_APPROVED' || (task.status as any) === 'ADMIN_APPROVED';
  const isSubmitted = task.status === 'SUBMITTED';

  return (
    <View style={styles.taskItem}>
      {/* Header of Subtask */}
      <View style={styles.taskHeader}>
        <View style={styles.taskIndexBadge}>
          <Text style={styles.taskIndexText}>#{index}</Text>
        </View>
        <Text style={styles.taskTitle} numberOfLines={2}>
          {task.title}
        </Text>
      </View>

      {/* Assignee & Status Row */}
      <View style={styles.taskMetaRow}>
        <View style={styles.assigneeBox}>
          <Ionicons name="person-circle-outline" size={16} color="#64748B" />
          <Text style={styles.assigneeText} numberOfLines={1}>
            {task.assignedToUserName || 'Chưa phân công'}
          </Text>
        </View>

        <View
          style={[
            styles.taskStatusBadge,
            isLeaderApproved
              ? styles.taskStatusLeaderApproved
              : isSubmitted
              ? styles.taskStatusSubmitted
              : styles.taskStatusPending,
          ]}
        >
          <Ionicons
            name={
              isLeaderApproved
                ? 'checkmark-done-circle'
                : isSubmitted
                ? 'checkmark-circle-outline'
                : 'ellipse-outline'
            }
            size={12}
            color={isLeaderApproved ? '#059669' : isSubmitted ? '#2563EB' : '#94A3B8'}
          />
          <Text
            style={[
              styles.taskStatusText,
              {
                color: isLeaderApproved
                  ? '#059669'
                  : isSubmitted
                  ? '#2563EB'
                  : '#64748B',
              },
            ]}
          >
            {isLeaderApproved ? 'Leader Đã Duyệt V1' : isSubmitted ? 'Đã Nộp Báo Cáo' : 'Đang Làm'}
          </Text>
        </View>
      </View>

      {/* Description if any */}
      {task.description ? (
        <Text style={styles.taskDescription}>{task.description}</Text>
      ) : null}

      {/* Submission Details */}
      {task.submissionNote || task.evidenceUrl || (task.evidenceImages && task.evidenceImages.length > 0) ? (
        <View style={styles.submissionBox}>
          <Text style={styles.submissionBoxLabel}>Kết quả nộp từ nhân sự:</Text>
          {task.submissionNote ? (
            <Text style={styles.submissionNoteText}>{task.submissionNote}</Text>
          ) : null}

          {task.evidenceUrl ? (
            <TouchableOpacity
              style={styles.subTaskLinkBtn}
              activeOpacity={0.7}
              onPress={() => onOpenUrl(task.evidenceUrl)}
            >
              <Ionicons name="link-outline" size={14} color="#2563EB" />
              <Text style={styles.subTaskLinkText} numberOfLines={1}>
                {task.evidenceUrl}
              </Text>
              <Ionicons name="open-outline" size={13} color="#2563EB" />
            </TouchableOpacity>
          ) : null}

          {/* Evidence Photos */}
          {Array.isArray(task.evidenceImages) && task.evidenceImages.length > 0 ? (
            <View style={styles.imageGalleryContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {task.evidenceImages.map((img, imgIdx) => {
                  const resolvedImg = getAbsoluteImageUrl(img) || img;
                  return (
                    <TouchableOpacity
                      key={imgIdx}
                      activeOpacity={0.8}
                      onPress={() => onImagePress(resolvedImg)}
                      style={styles.evidenceImageWrapper}
                    >
                      <Image source={{ uri: resolvedImg }} style={styles.evidenceThumbnail} />
                      <View style={styles.imageZoomBadge}>
                        <Ionicons name="expand" size={12} color="#FFFFFF" />
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          ) : null}
        </View>
      ) : null}

      {/* Leader Feedback Note */}
      {task.leaderFeedback ? (
        <View style={styles.leaderFeedbackBox}>
          <Ionicons name="chatbox-ellipses-outline" size={14} color="#D97706" />
          <Text style={styles.leaderFeedbackText}>
            <Text style={{ fontWeight: '700' }}>Leader nhận xét: </Text>
            {task.leaderFeedback}
          </Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    minHeight: '60%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    flexWrap: 'wrap',
    gap: 6,
  },
  levelTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  levelTagText: {
    fontSize: 12,
    fontWeight: '700',
  },
  deptTag: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  deptTagText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 22,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  body: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
  },
  statusBannerApproved: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  statusBannerSubmitted: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  statusBannerInProgress: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  statusBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  statusBannerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 6,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  rewardText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#B45309',
    lineHeight: 19,
  },
  leaderNoteBox: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#2563EB',
    marginBottom: 8,
  },
  leaderNoteText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 20,
  },
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginTop: 6,
  },
  linkLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  linkUrl: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '700',
    marginTop: 1,
  },
  emptyText: {
    fontSize: 12,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  taskItem: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  taskIndexBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 8,
  },
  taskIndexText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  taskTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  taskMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    flexWrap: 'wrap',
    gap: 6,
  },
  assigneeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  assigneeText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  taskStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  taskStatusLeaderApproved: {
    backgroundColor: '#ECFDF5',
  },
  taskStatusSubmitted: {
    backgroundColor: '#EFF6FF',
  },
  taskStatusPending: {
    backgroundColor: '#F1F5F9',
  },
  taskStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  taskDescription: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 6,
    lineHeight: 17,
  },
  submissionBox: {
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 6,
  },
  submissionBoxLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 4,
  },
  submissionNoteText: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 18,
    marginBottom: 6,
  },
  subTaskLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 6,
    marginBottom: 6,
  },
  subTaskLinkText: {
    flex: 1,
    fontSize: 11,
    color: '#0284C7',
    fontWeight: '600',
  },
  imageGalleryContainer: {
    marginTop: 4,
  },
  evidenceImageWrapper: {
    position: 'relative',
    marginRight: 8,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  evidenceThumbnail: {
    width: 68,
    height: 68,
    borderRadius: 7,
  },
  imageZoomBadge: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 4,
    padding: 2,
  },
  leaderFeedbackBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFBEB',
    padding: 8,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
    marginTop: 6,
    gap: 6,
  },
  leaderFeedbackText: {
    fontSize: 12,
    color: '#92400E',
    flex: 1,
    lineHeight: 17,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
    minHeight: 70,
    textAlignVertical: 'top',
    marginBottom: 14,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  btnReject: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  btnRejectText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
  },
  btnApprove: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#059669',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  btnApproveText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  btnDisabled: {
    opacity: 0.6,
  },
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

  /* Approved Read-Only Notice Styles */
  approvedNoticeCard: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1.5,
  },
  approvedNoticeSub: {
    fontSize: 13,
    color: '#065F46',
    lineHeight: 18,
    marginBottom: 10,
  },
  approvedDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  approvedDateText: {
    fontSize: 12,
    color: '#047857',
    fontWeight: '600',
  },
  approvedFeedbackBox: {
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 3,
    borderLeftColor: '#059669',
    padding: 10,
    borderRadius: 8,
    marginVertical: 8,
  },
  approvedFeedbackLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065F46',
    marginBottom: 3,
  },
  approvedFeedbackText: {
    fontSize: 13,
    color: '#1E293B',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  btnCloseArchive: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#059669',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 10,
  },
  btnCloseArchiveText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#059669',
  },
});
