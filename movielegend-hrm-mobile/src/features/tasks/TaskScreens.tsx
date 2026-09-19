import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCompleteTask } from '../../hooks/useTasks';
import { useMemo, useState, useEffect } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View, Pressable, Modal, Platform, Switch } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import { createTaskAttachment } from '../../api/tasks.api';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { FormField } from '../../components/FormField';
import { LoadingState } from '../../components/LoadingState';
import { PageHeader } from '../../components/PageHeader';
import { PrimaryButton, SecondaryButton } from '../../components/Buttons';
import { Screen } from '../../components/Screen';
import { ScreenContainer } from '../../components/ScreenContainer';
import { MultiSelectModal } from '../../components/MultiSelectModal';
import { SelectModal, SelectOption } from '../../components/SelectModal';
import { SearchInput } from '../../components/SearchInput';
import { SectionCard } from '../../components/SectionCard';
import { useDepartments } from '../../hooks/useDepartments';
import { useEmployees, useScopedEmployees } from '../../hooks/useEmployees';
import { useRegions } from '../../api/regions.api';
import { useBranches } from '../../api/branches.api';
import { useTaskGroups } from '../../hooks/useTaskGroups';
import { useAppAlert } from '../../contexts/AlertContext';
import {
  useAcceptTaskAssignment,
  useCreateTask,
  useCreateTaskAttachment,
  useCreateTaskComment,
  useDeleteTaskAttachment,
  useCreateTaskExtension,
  useMyTasks,
  usePendingTaskExtensions,
  useReviewTaskAssignment,
  useReviewTaskExtension,
  useStartTaskAssignment,
  useSubmitTaskAssignment,
  useTask,
  useTaskReviewQueue,
  useTaskTimeline,
  useTasks,
  useUpdateTaskProgress,
  useCancelTask,
} from '../../hooks/useTasks';
import { useAuth } from '../../providers/AuthProvider';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import type { CreateTaskPayload, CreateTaskTargetPayload, TaskDto, TaskListFilters, TaskPriority, TaskTargetType } from '../../types/task.types';
import { normalizeApiError } from '../../utils/api-error';
import { formatDateTime } from '../../utils/date-time';
import { hasAnyPermission, hasPermission } from '../../utils/permissions';
import {
  AttachmentList,
  AttachmentPicker,
  TaskStepper,
  CommentComposer,
  CommentList,
  ExtensionList,
  ExtensionRequestModal,
  PriorityBadge,
  ProgressBar,
  ReviewActionSheet,
  SubtaskCardItem,
  TargetPreview,
  TaskCard,
  TaskStatusBadge,
  TaskTimeline,
} from './TaskComponents';
import { canAcceptAssignment, canStartAssignment, canSubmitAssignment, canUpdateProgress, mapTaskError, myAssignment, canCancelTask, isReadOnlyStatus } from './task.logic';

type TaskArea = 'employee' | 'leader' | 'admin' | 'hr';

const priorities: TaskPriority[] = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  URGENT: 'Khẩn cấp',
  HIGH: 'Cao',
  NORMAL: 'Bình thường',
  LOW: 'Thấp',
};

const TASK_STATUS_TABS = [
  { label: 'Tất cả', value: '' },
  { label: 'Chờ nhận', value: 'NEW' },
  { label: 'Đang làm', value: 'IN_PROGRESS' },
  { label: 'Chờ duyệt', value: 'WAITING_REVIEW' },
  { label: 'Quá hạn', value: 'OVERDUE' },
  { label: 'Hoàn thành', value: 'COMPLETED' },
  { label: 'Làm lại', value: 'REJECTED' },
  { label: 'Đã hủy', value: 'CANCELLED' },
];

export function TaskListScreen({ area }: { area: TaskArea }) {
  const router = useRouter();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const isAdmin = Boolean(
    user?.roles?.includes('ADMIN') ||
    user?.roles?.some((r: any) => r.name?.toUpperCase().includes('ADMIN') || r.role?.code === 'admin')
  );
  const isGlobalAdmin = Boolean(
    isAdmin &&
    user?.scopes?.some((s: any) => (s.role === 'ADMIN' || s.role?.code === 'ADMIN') && (s.scopeType === 'GLOBAL' || !s.scopeType))
  ) || Boolean(user?.roles?.includes('SUPER_ADMIN'));

  const adminRegionScope = user?.scopes?.find(
    (s: any) => (s.role === 'ADMIN' || s.role?.code === 'ADMIN') && s.scopeType === 'REGION'
  );
  const isRegionAdmin = Boolean(adminRegionScope && adminRegionScope.scopeId);
  const isLeaderArea = area === 'leader' || area === 'hr';
  const isAdminArea = area === 'admin';
  const isDelegatedArea = area !== 'employee';

  const filters: TaskListFilters = useMemo(() => ({
    page: 1,
    limit: 20,
    ...(search ? { search } : {}),
    ...(status === 'OVERDUE' ? { overdue: true } : status ? { status: status as never } : {}),
    ...(isDelegatedArea && user?.id ? { createdById: user.id } : {})
  }), [search, status, isDelegatedArea, user?.id]);

  const tasks = area === 'employee' ? useMyTasks(filters) : useTasks(filters);
  const createRoute = area === 'employee' ? null : `/${area}/tasks/create`;
  const reviewRoute = area === 'employee' ? null : `/${area}/tasks/review`;

  const title = area === 'employee'
    ? 'Công việc của tôi'
    : 'Công việc đã giao';
  const insets = useSafeAreaInsets();

  const displayTasks = useMemo(() => {
    const rawItems = tasks.data?.items ?? [];
    if (isDelegatedArea && user?.id) {
      return rawItems.filter(
        (task) => (task.createdByUserId === user.id || task.createdBy?.id === user.id)
      );
    }
    return rawItems;
  }, [tasks.data?.items, isDelegatedArea, user?.id]);

  const handleTaskPress = (taskId: string) => {
    if (area === 'employee') {
      const isLeader = user?.roles?.includes('LEADER');
      const isHR = user?.roles?.includes('HR');
      if (isLeader) {
        router.push(`/leader/my-tasks/${taskId}` as any);
        return;
      }
      if (isHR) {
        router.push(`/hr/my-tasks/${taskId}` as any);
        return;
      }
      router.push(`/employee/tasks/${taskId}` as any);
      return;
    }
    router.push(`/${area}/tasks/${taskId}` as any);
  };

  return (
    <Screen>
      <ScreenContainer style={{ paddingBottom: Math.max(insets.bottom + 16, 16) }} refreshControl={<RefreshControl refreshing={tasks.isRefetching} onRefresh={() => void tasks.refetch()} />}>
        <PageHeader title={title} subtitle="Quản lý và theo dõi tiến độ công việc" showBack={false} />
        
        <SearchInput value={search} onChangeText={setSearch} placeholder="Tìm kiếm công việc..." />
        
        {(createRoute || reviewRoute) ? (
          <View style={styles.actionRow}>
            {createRoute ? (
              <Pressable style={styles.actionBtnPrimary} onPress={() => router.push(createRoute)}>
                <MaterialCommunityIcons name="plus" size={20} color="#fff" />
                <Text style={styles.actionBtnTextPrimary}>Thêm công việc</Text>
              </Pressable>
            ) : null}
            {reviewRoute ? (
              <Pressable style={styles.actionBtnSecondary} onPress={() => router.push(reviewRoute)}>
                <MaterialCommunityIcons name="clipboard-check-outline" size={20} color={colors.text} />
                <Text style={styles.actionBtnTextSecondary}>Hàng đợi duyệt</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        <View style={styles.tabsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
            {TASK_STATUS_TABS.map(tab => {
              const isActive = status === tab.value;
              return (
                <Pressable
                  key={tab.value}
                  style={[styles.tabPill, isActive && styles.tabPillActive]}
                  onPress={() => setStatus(tab.value)}
                >
                  <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{tab.label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {tasks.isLoading ? <LoadingState /> : null}
        {tasks.isError ? <ErrorState error={tasks.error} onRetry={() => void tasks.refetch()} /> : null}
        {!tasks.isLoading && !displayTasks.length ? <EmptyState title="Chưa có công việc nào" /> : null}
        {displayTasks.map((task) => (
          <TaskCard key={task.id} task={task} onPress={() => handleTaskPress(task.id)} />
        ))}
      </ScreenContainer>
    </Screen>
  );
}

export function TaskDetailScreen({ area }: { area: TaskArea }) {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const task = useTask(id);
  const timeline = useTaskTimeline(id);
  const [progress, setProgress] = useState('0');
  const [completionNote, setCompletionNote] = useState('');
  const assignment = useMemo(() => (task.data ? myAssignment(task.data, user?.id) : undefined), [task.data, user?.id]);
  const accept = useAcceptTaskAssignment(id ?? '');
  const start = useStartTaskAssignment(id ?? '');
  const updateProgress = useUpdateTaskProgress(id ?? '');
  const submit = useSubmitTaskAssignment(id ?? '');
  const comment = useCreateTaskComment(id ?? '');
  const attachment = useCreateTaskAttachment(id ?? '');
  const deleteAttachment = useDeleteTaskAttachment(id ?? '');
  const extension = useCreateTaskExtension(id ?? '');
  const review = useReviewTaskAssignment(id);
  const extensionReview = useReviewTaskExtension(id);
  const completeTask = useCompleteTask(id ?? '');
  const cancel = useCancelTask(id ?? '');
  const { showAlert, showConfirm } = useAppAlert();
  const canReview = hasAnyPermission(user, ['task.review_all', 'task.review_department']);
  const canReviewExtension = hasAnyPermission(user, ['task.extension_review_all', 'task.extension_review_department']);

  const initialAttachments = useMemo(() => {
    return task.data?.attachments?.filter(att => att.uploadedByUserId === task.data?.createdByUserId) ?? [];
  }, [task.data?.attachments, task.data?.createdByUserId]);

  const submissionAttachments = useMemo(() => {
    return task.data?.attachments?.filter(att => att.uploadedByUserId !== task.data?.createdByUserId) ?? [];
  }, [task.data?.attachments, task.data?.createdByUserId]);

  if (task.isLoading) return <LoadingState label="Đang tải task" />;
  if (task.isError) return <ErrorState error={task.error} onRetry={() => void task.refetch()} />;
  if (!task.data) return <EmptyState title="Không tìm thấy task" />;
  const item = task.data;
  
  const isUnacceptedAssignee = assignment?.status === 'NEW' && item.createdByUserId !== user?.id;
  
  const isSelfAssigned = (entry: any) => entry.userId !== user?.id || entry.assignedByUserId === user?.id;
  
  const reviewAssignments = item.assignments?.filter((entry) => entry.status === 'WAITING_REVIEW' && isSelfAssigned(entry)) ?? [];
  const pendingExtensions = item.extensionRequests?.filter((entry) => {
    if (entry.status !== 'PENDING') return false;
    const relatedAssignment = item.assignments?.find(a => a.id === entry.assignmentId);
    return relatedAssignment ? isSelfAssigned(relatedAssignment) : true;
  }) ?? [];

  const childTasks = item.childTasks ?? [];
  const completedChildCount = childTasks.filter((c: any) => c.status === 'COMPLETED').length;
  const totalChildCount = childTasks.length;
  const subtasksProgressPercent = totalChildCount > 0 ? Math.round((completedChildCount / totalChildCount) * 100) : 0;

  const isDepartmentTask = item.type === 'DEPARTMENT' || (item.targets?.some(t => t.targetType === 'DEPARTMENT') ?? false);
  const isGroupTask = item.type === 'GROUP';
  const isProjectTask = isDepartmentTask || isGroupTask || item.type === 'CROSS_DEPARTMENT';
  const isDepartmentLeader = hasAnyPermission(user, ['task.assign_department']) || Boolean(user?.roles?.includes('LEADER'));
  const isGroupLeader = item.groupLeaderId === user?.id;
  const isCreator = item.createdByUserId === user?.id;
  const isAdmin = hasAnyPermission(user, ['task.assign_any']) || Boolean(user?.roles?.includes('ADMIN'));

  const isAssignee = item.assignments?.some((a: any) => a.userId === user?.id);
  const isEmployeeOnly = !isAdmin && !isDepartmentLeader && !isGroupLeader;
  const isParentOrProjectTask = isProjectTask || totalChildCount > 0;
  const canManageSubtasks = !isEmployeeOnly && isParentOrProjectTask && (isAdmin || (isDepartmentTask && isDepartmentLeader) || (isGroupTask && isGroupLeader) || (isCreator && isDepartmentLeader)) && item.status !== 'COMPLETED' && item.status !== 'CANCELLED';

  async function run(action: () => Promise<unknown>, success: string) {
    try {
      await action();
      showAlert('Thành công', success);
    } catch (error) {
      const normalized = normalizeApiError(error);
      showAlert(normalized.code, mapTaskError(normalized.code, normalized.message));
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroTitle}>{item.title}</Text>
              <Text style={styles.heroCode}>{item.taskCode ?? item.type}</Text>
            </View>
            {item.chatGroup?.id && (
              <Pressable style={styles.chatButton} onPress={() => router.push(`/employee/chat/${item.chatGroup!.id}?taskId=${item.id}`)}>
                <MaterialCommunityIcons name="chat-processing-outline" size={20} color={colors.primary} />
                <Text style={styles.chatButtonText}>Chat</Text>
              </Pressable>
            )}
          </View>
          <View style={[styles.rowWrap, { marginTop: spacing.md }]}>
            <TaskStatusBadge status={item.status} />
            <PriorityBadge priority={item.priority} />
            {isDepartmentTask ? (
              <View style={styles.departmentBadgePill}>
                <MaterialCommunityIcons name="domain" size={14} color={colors.primaryDark} />
                <Text style={styles.departmentBadgePillText}>Dự án Phòng Ban</Text>
              </View>
            ) : null}
          </View>
          {item.description ? <Text style={[styles.body, { marginTop: spacing.md }]}>{item.description}</Text> : null}
          <View style={styles.heroDates}>
            <View style={styles.dateItem}>
              <MaterialCommunityIcons name="calendar-start" size={16} color={colors.muted} />
              <Text style={styles.metaSmall}>{formatDateTime(item.startAt)}</Text>
            </View>
            <View style={styles.dateItem}>
              <MaterialCommunityIcons name="calendar-clock" size={16} color={colors.muted} />
              <Text style={styles.metaSmall}>{formatDateTime(item.dueAt)}</Text>
            </View>
          </View>
          <View style={{ marginTop: spacing.md }}>
            <ProgressBar value={assignment?.progressPercent ?? averageProgress(item)} />
          </View>
          {assignment?.reviewNote ? (
            <View style={[styles.rowWrap, { marginTop: spacing.md, backgroundColor: colors.warningSoft, padding: spacing.sm, borderRadius: 8 }]}>
              <MaterialCommunityIcons name="alert-circle-outline" size={18} color={colors.warning} />
              <Text style={styles.warning}>Review note: {assignment.reviewNote}</Text>
            </View>
          ) : null}
          {canCancelTask(item, user?.id) || hasAnyPermission(user, ['task.assign_any']) ? (
            <View style={{ marginTop: spacing.md }}>
              <SecondaryButton
                loading={cancel.isPending}
                onPress={() => {
                  showConfirm({
                    title: 'Xác nhận hủy',
                    message: 'Bạn có chắc chắn muốn hủy công việc này?',
                    confirmLabel: 'Có, Hủy',
                    onConfirm: () => run(() => cancel.mutateAsync(), 'Đã hủy công việc')
                  });
                }}
              >
                Hủy công việc
              </SecondaryButton>
            </View>
          ) : null}
          <View style={{ marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border }}>
            <TargetPreview task={item} />
          </View>

          {initialAttachments.length > 0 ? (
            <View style={{ marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: spacing.xs }}>Tài liệu đính kèm:</Text>
              <AttachmentList 
                attachments={initialAttachments} 
                isUnaccepted={isUnacceptedAssignee}
                canDelete={(attachmentId) => {
                  const att = item.attachments?.find(a => a.id === attachmentId);
                  return hasAnyPermission(user, ['task.assign_any']) || item.groupLeaderId === user?.id || att?.uploadedByUserId === user?.id;
                }}
                onDeleteAttachment={(attachmentId) => run(() => deleteAttachment.mutateAsync(attachmentId), 'Đã xoá tài liệu')}
              />
            </View>
          ) : null}
        </View>

        {assignment ? (
          <SectionCard title={isDepartmentTask ? "Tiếp nhận & Thực hiện Dự án" : "Nhiệm vụ của tôi"}>
            <TaskStepper currentStatus={assignment.status} />
            {!isReadOnlyStatus(item.status) ? (
              <>
                {canAcceptAssignment(assignment.status) ? (
                  <View style={styles.receptionCardBox}>
                    <MaterialCommunityIcons name="briefcase-check-outline" size={28} color={colors.primary} />
                    <Text style={styles.receptionCardTitle}>
                      {isDepartmentTask ? 'Dự án phân công cho Bộ phận của bạn' : 'Công việc mới được phân công'}
                    </Text>
                    <Text style={styles.receptionCardDesc}>
                      {isDepartmentTask
                        ? 'Dự án này đã được Admin chỉ định cho bộ phận. Hãy bấm Tiếp nhận dự án để bắt đầu phân rã công việc con cho các nhân viên.'
                        : 'Bạn vừa được phân công công việc này. Hãy xác nhận để bắt đầu làm ngay!'}
                    </Text>
                    <PrimaryButton loading={start.isPending} onPress={() => void run(() => start.mutateAsync(assignment.id), isDepartmentTask ? 'Đã tiếp nhận dự án thành công' : 'Đã nhận việc và bắt đầu làm')}>
                      {isDepartmentTask ? 'Tiếp nhận Dự án & Triển khai' : 'Nhận việc & Làm ngay'}
                    </PrimaryButton>
                  </View>
                ) : null}
                {(canUpdateProgress(assignment.status) || canSubmitAssignment(assignment.status)) ? (
                  <View style={{ padding: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: 8, marginTop: spacing.md }}>
                    <Text style={{ fontWeight: '700', marginBottom: spacing.md, color: colors.text, fontSize: 16 }}>Không gian làm việc</Text>
                    
                    {canUpdateProgress(assignment.status) ? (
                      <View style={{ marginBottom: spacing.lg }}>
                        <Text style={{ marginBottom: spacing.sm, fontWeight: '700', color: colors.text }}>Tiến độ: {progress}%</Text>
                        <Slider
                          style={{ width: '100%', height: 40 }}
                          minimumValue={0}
                          maximumValue={100}
                          step={5}
                          value={Number(progress)}
                          onValueChange={(val) => setProgress(val.toString())}
                          minimumTrackTintColor={colors.primary}
                          maximumTrackTintColor={colors.border}
                          thumbTintColor={colors.primary}
                        />
                        <SecondaryButton
                          loading={updateProgress.isPending}
                          onPress={() => void run(() => updateProgress.mutateAsync({ assignmentId: assignment.id, payload: { progressPercent: Number(progress) } }), 'Đã cập nhật tiến độ')}
                        >
                          Lưu tiến độ
                        </SecondaryButton>
                      </View>
                    ) : null}
                    
                    {canSubmitAssignment(assignment.status) ? (
                      <View style={{ borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md }}>
                        <FormField label="Ghi chú hoàn thành" value={completionNote} onChangeText={setCompletionNote} multiline />
                        <View style={{ marginVertical: spacing.sm }}>
                          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: spacing.xs }}>Đính kèm kết quả / báo cáo</Text>
                          {submissionAttachments.length > 0 ? (
                            <View style={{ marginBottom: spacing.xs }}>
                              <AttachmentList
                                attachments={submissionAttachments}
                                canDelete={(attachmentId) => {
                                  const att = item.attachments?.find(a => a.id === attachmentId);
                                  return att?.uploadedByUserId === user?.id;
                                }}
                                onDeleteAttachment={(attachmentId) => run(() => deleteAttachment.mutateAsync(attachmentId), 'Đã xoá tài liệu báo cáo')}
                              />
                            </View>
                          ) : null}
                          <AttachmentPicker pending={attachment.isPending} onAttach={(payload) => attachment.mutateAsync(payload).then(() => undefined)} />
                        </View>
                        <PrimaryButton
                          loading={submit.isPending}
                          onPress={() => void run(() => submit.mutateAsync({ assignmentId: assignment.id, payload: { completionNote } }), 'Đã nộp công việc')}
                        >
                          Nộp kết quả
                        </PrimaryButton>
                      </View>
                    ) : null}
                  </View>
                ) : null}
                <ExtensionRequestModal
                  currentDueAt={assignment.assignmentDueAt ?? item.dueAt}
                  extensionCount={item.extensionRequests?.filter(e => e.assignmentId === assignment.id && e.status !== 'REJECTED').length ?? 0}
                  pending={extension.isPending}
                  onSubmit={(requestedDueAt, reason) => run(() => extension.mutateAsync({ assignmentId: assignment.id, requestedDueAt, reason }), 'Đã gửi yêu cầu gia hạn')}
                />
                {item.extensionRequests?.some(e => e.assignmentId === assignment.id) ? (
                  <View style={{ marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: spacing.xs }}>Lịch sử xin gia hạn:</Text>
                    <ExtensionList extensions={item.extensionRequests.filter(e => e.assignmentId === assignment.id)} />
                  </View>
                ) : null}
              </>
            ) : null}
          </SectionCard>
        ) : null}

        {/* ===================================================================== */}
        {/* SUBTASKS MANAGEMENT SECTION (DÀNH CHO LEADER / ADMIN & XEM TIẾN ĐỘ)    */}
        {/* ===================================================================== */}
        {(totalChildCount > 0 || canManageSubtasks) ? (
          <SectionCard title={`Công việc con (Subtasks)${totalChildCount > 0 ? ` • ${completedChildCount}/${totalChildCount}` : ''}`}>
            {totalChildCount > 0 ? (
              <View style={styles.subtasksProgressHeader}>
                <View style={styles.subtasksProgressTitleRow}>
                  <Text style={styles.subtasksProgressLabel}>Tiến độ hoàn thành việc con</Text>
                  <Text style={styles.subtasksProgressValue}>
                    {completedChildCount}/{totalChildCount} việc ({subtasksProgressPercent}%)
                  </Text>
                </View>
                <ProgressBar value={subtasksProgressPercent} />
              </View>
            ) : (
              <View style={styles.emptySubtasksBox}>
                <MaterialCommunityIcons name="format-list-checks" size={28} color={colors.primary} />
                <Text style={styles.emptySubtasksTitle}>Chưa có công việc con nào</Text>
                <Text style={styles.emptySubtasksDesc}>
                  Hãy chia nhỏ dự án này thành các đầu việc cụ thể và phân công cho từng nhân viên trong bộ phận để bắt đầu triển khai.
                </Text>
              </View>
            )}

            {childTasks.map((child: any) => (
              <SubtaskCardItem
                key={child.id}
                subtask={child}
                onPress={() => router.push(`/${area}/tasks/${child.id}`)}
              />
            ))}

            {canManageSubtasks ? (
              <View style={styles.subtaskActionGroup}>
                <SecondaryButton onPress={() => router.push(`/${area}/tasks/create?parentTaskId=${item.id}`)}>
                  + Chia nhỏ việc con cho nhân sự
                </SecondaryButton>

                {item.status !== 'COMPLETED' ? (
                  <PrimaryButton
                    loading={completeTask.isPending}
                    onPress={() => {
                      showConfirm({
                        title: 'Nghiệm thu & Hoàn thành Dự án',
                        message: totalChildCount > 0 && completedChildCount < totalChildCount
                          ? `Hiện tại có ${totalChildCount - completedChildCount} việc con chưa hoàn thành. Bạn có chắc chắn muốn báo cáo nghiệm thu và hoàn tất dự án này?`
                          : 'Xác nhận hoàn thành toàn bộ dự án và gửi báo cáo nghiệm thu lên cấp trên?',
                        confirmLabel: 'Xác nhận hoàn thành',
                        onConfirm: () => void run(() => completeTask.mutateAsync(), 'Đã hoàn thành và nghiệm thu dự án thành công'),
                      });
                    }}
                  >
                    Báo cáo nghiệm thu & Hoàn thành Dự án
                  </PrimaryButton>
                ) : null}
              </View>
            ) : null}
          </SectionCard>
        ) : null}

        {canReview && reviewAssignments.length > 0 ? (
          <SectionCard title="Xét duyệt công việc">
            {reviewAssignments.map((entry) => {
              const entryAttachments = item.attachments?.filter(att => att.uploadedByUserId === entry.userId) ?? [];
              return (
                <View key={entry.id} style={styles.inlinePanel}>
                  <Text style={styles.titleText}>{entry.user?.profile?.fullName ?? entry.user?.userCode ?? entry.userId}</Text>
                  <ProgressBar value={entry.progressPercent} />
                  {entry.completionNote ? (
                    <Text style={[styles.body, { marginTop: spacing.xs, fontStyle: 'italic' }]}>
                      Ghi chú: {entry.completionNote}
                    </Text>
                  ) : null}
                  {entryAttachments.length > 0 ? (
                    <View style={{ marginTop: spacing.xs, marginBottom: spacing.xs }}>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 4 }}>Báo cáo / Tệp đính kèm nộp:</Text>
                      <AttachmentList attachments={entryAttachments} />
                    </View>
                  ) : null}
                  <ReviewActionSheet
                    pending={review.isPending}
                    onApprove={(note) => run(() => review.mutateAsync({ assignmentId: entry.id, action: 'approve', payload: note ? { note } : {} }), 'Đã duyệt')}
                    onReject={(note) => run(() => review.mutateAsync({ assignmentId: entry.id, action: 'reject', payload: { note } }), 'Đã từ chối')}
                  />
                </View>
              );
            })}
          </SectionCard>
        ) : null}

        {canReviewExtension && pendingExtensions.length > 0 ? (
          <SectionCard title="Xét duyệt gia hạn">
            {pendingExtensions.map((entry) => (
              <View key={entry.id} style={styles.inlinePanel}>
                <Text style={styles.titleText}>{formatDateTime(entry.requestedDueAt)}</Text>
                <Text style={styles.body}>{entry.reason}</Text>
                <ReviewActionSheet
                  pending={extensionReview.isPending}
                  onApprove={(note) => run(() => extensionReview.mutateAsync({ id: entry.id, action: 'approve', payload: note ? { note } : {} }), 'Đã duyệt gia hạn')}
                  onReject={(note) => run(() => extensionReview.mutateAsync({ id: entry.id, action: 'reject', payload: { note } }), 'Đã từ chối gia hạn')}
                />
              </View>
            ))}
          </SectionCard>
        ) : null}

        <SectionCard title="Bình luận">
          <CommentList comments={item.comments} />
          <CommentComposer pending={comment.isPending} onSubmit={(content) => comment.mutateAsync({ content }).then(() => undefined)} />
        </SectionCard>



        <SectionCard title="Lịch sử hoạt động">
          {timeline.isLoading ? <LoadingState label="Đang tải lịch sử" /> : null}
          {timeline.isError ? <ErrorState error={timeline.error} onRetry={() => void timeline.refetch()} /> : null}
          <TaskTimeline items={timeline.data?.items ?? item.histories} />
        </SectionCard>

        {(!assignment && (item.createdByUserId === user?.id || canReviewExtension)) && (item.extensionRequests ?? []).length > 0 ? (
          <SectionCard title="Danh sách yêu cầu gia hạn">
            <ExtensionList extensions={item.extensionRequests} />
          </SectionCard>
        ) : null}

      </ScrollView>
    </Screen>
  );
}

export function ActionDatePicker({ 
  visible, 
  value, 
  onChange, 
  onClose,
  title
}: { 
  visible: boolean; 
  value: Date | null; 
  onChange: (d: Date) => void; 
  onClose: () => void;
  title: string;
}) {
  const [tempDate, setTempDate] = useState(value || new Date());
  const [androidMode, setAndroidMode] = useState<'date' | 'time'>('date');

  useEffect(() => {
    if (visible) {
      setTempDate(value || new Date());
      setAndroidMode('date');
    }
  }, [visible, value]);

  if (!visible) return null;

  if (Platform.OS === 'android') {
    return (
      <DateTimePicker
        value={tempDate}
        mode={androidMode}
        display="default"
        locale="vi-VN"
        onChange={(e, d) => {
          if (e.type === 'dismissed') {
            onClose();
            return;
          }
          if (e.type === 'set' && d) {
            if (androidMode === 'date') {
              setTempDate(d);
              setAndroidMode('time');
            } else {
              const newDate = new Date(tempDate);
              newDate.setHours(d.getHours());
              newDate.setMinutes(d.getMinutes());
              onChange(newDate);
              onClose();
            }
          }
        }}
      />
    );
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.pickerModalOverlay}>
        <Pressable style={{flex: 1}} onPress={onClose} />
        <View style={styles.pickerModalContent}>
          <View style={styles.pickerModalHeader}>
            <Text style={styles.pickerModalTitle}>{title}</Text>
            <Pressable onPress={() => {
              onChange(tempDate);
              onClose();
            }}>
              <Text style={styles.pickerModalDone}>Xong</Text>
            </Pressable>
          </View>
          <DateTimePicker
            value={tempDate}
            mode="datetime"
            display="spinner"
            locale="vi-VN"
            onChange={(e, d) => {
              if (d) setTempDate(d);
            }}
            style={{ height: 216 }}
          />
        </View>
      </View>
    </Modal>
  );
}

export function CreateTaskScreen({ area }: { area: Exclude<TaskArea, 'employee'> }) {
  const router = useRouter();
  const { parentTaskId } = useLocalSearchParams<{ parentTaskId?: string }>();
  const parentTaskQuery = useTask(parentTaskId);
  const { user } = useAuth();
  const { showAlert } = useAppAlert();
  const mutation = useCreateTask();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('NORMAL');
  
  const [startAt, setStartAt] = useState<Date | null>(null);
  const [dueAt, setDueAt] = useState<Date | null>(null);
  
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);
  


  const departmentsQuery = useDepartments({ limit: 100 });
  const branchesQuery = useBranches();
  const regionsQuery = useRegions();

  const [selectedBranchId, setSelectedBranchId] = useState<string>('');

  const isGlobalAdmin = Boolean(
    user?.roles?.includes('ADMIN') ||
    user?.roles?.includes('SUPER_ADMIN') ||
    user?.roles?.includes('HR')
  );

  const adminRegionScope = user?.scopes?.find?.((s: any) => (s.role === 'ADMIN' || s.role?.code === 'ADMIN') && s.scopeType === 'REGION');
  const userRegionId = adminRegionScope?.scopeId;
  const isRegionAdmin = Boolean(!isGlobalAdmin && userRegionId);

  const availableBranches = useMemo(() => {
    const raw = branchesQuery.data;
    const branches = Array.isArray(raw) ? raw : (raw as any)?.items ?? [];
    if (isRegionAdmin && userRegionId) {
      return branches.filter((b: any) => b.regionId === userRegionId || b.region?.id === userRegionId);
    }
    return branches;
  }, [branchesQuery.data, isRegionAdmin, userRegionId]);

  const isLeaderArea = area === 'leader' || area === 'hr';

  const [departmentContextId, setDepartmentContextId] = useState<string>(
    isLeaderArea ? (departmentIdFromUser(user) ?? '') : ''
  );

  useEffect(() => {
    if (isLeaderArea && user?.department?.id && !departmentContextId) {
      setDepartmentContextId(user.department.id);
    }
  }, [isLeaderArea, user?.department?.id]);

  useEffect(() => {
    if (parentTaskQuery.data?.departmentContextId) {
      setDepartmentContextId(parentTaskQuery.data.departmentContextId);
    }
  }, [parentTaskQuery.data?.departmentContextId, departmentsQuery.data?.items]);

  useEffect(() => {
    if (departmentContextId && !selectedBranchId) {
      const currentDept = departmentsQuery.data?.items?.find((d) => d.id === departmentContextId);
      if (currentDept?.branchId) {
        setSelectedBranchId(currentDept.branchId);
      }
    }
  }, [departmentContextId, departmentsQuery.data?.items]);

  const availableDepartments = useMemo(() => {
    const allDepts = departmentsQuery.data?.items ?? [];
    let filtered = allDepts;

    if (isRegionAdmin && userRegionId) {
      filtered = filtered.filter(
        (d) => d.branch?.region?.id === userRegionId || availableBranches.some((b: any) => b.id === d.branchId)
      );
    }

    if (selectedBranchId) {
      filtered = filtered.filter((d) => d.branchId === selectedBranchId || d.branch?.id === selectedBranchId);
    }

    return filtered;
  }, [departmentsQuery.data?.items, isRegionAdmin, userRegionId, availableBranches, selectedBranchId]);

  const branchOptions: SelectOption[] = useMemo(() => {
    return availableBranches.map((b: any) => ({
      id: b.id,
      label: b.name,
      subtitle: b.address || undefined,
    }));
  }, [availableBranches]);

  const deptOptions: SelectOption[] = useMemo(() => {
    return availableDepartments.map((d) => ({
      id: d.id,
      label: d.name,
      subtitle: d.branch?.name ? `Cơ sở: ${d.branch.name}` : undefined,
    }));
  }, [availableDepartments]);

  const selectedBranch = useMemo(
    () => availableBranches.find((b: any) => b.id === selectedBranchId),
    [availableBranches, selectedBranchId]
  );

  const selectedDept = useMemo(
    () => (departmentsQuery.data?.items ?? []).find((d) => d.id === departmentContextId),
    [departmentsQuery.data?.items, departmentContextId]
  );

  const handleSelectBranch = (opt: SelectOption) => {
    const bId = String(opt.id || '');
    setSelectedBranchId(bId);
    const deptsInBranch = (departmentsQuery.data?.items ?? []).filter(
      (d) => d.branchId === bId || d.branch?.id === bId
    );
    if (deptsInBranch.length > 0 && deptsInBranch[0]?.id) {
      if (!deptsInBranch.some((d) => d.id === departmentContextId)) {
        setDepartmentContextId(deptsInBranch[0].id);
      }
    } else {
      setDepartmentContextId('');
    }
    setTargets([]);
  };

  const handleSelectDept = (opt: SelectOption) => {
    const dId = String(opt.id || '');
    setDepartmentContextId(dId);
    const foundDept = departmentsQuery.data?.items?.find((d) => d.id === dId);
    if (foundDept?.branchId && foundDept.branchId !== selectedBranchId) {
      setSelectedBranchId(foundDept.branchId);
    }
    setTargets([]);
  };

  const [attachments, setAttachments] = useState<import('../../types/task.types').CreateTaskAttachmentPayload[]>([]);
  const [targets, setTargets] = useState<CreateTaskTargetPayload[]>([]);
  const [targetModalVisible, setTargetModalVisible] = useState(false);
  const [targetModalFilter, setTargetModalFilter] = useState<'ALL' | 'DEPARTMENT' | 'USER'>('ALL');
  
  type AssigneeMode = 'DEPARTMENT' | 'USER' | 'GROUP';
  const [assigneeMode, setAssigneeMode] = useState<AssigneeMode>(
    parentTaskId || isLeaderArea ? 'USER' : 'DEPARTMENT'
  );

  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [leaderId, setLeaderId] = useState<string>('');
  const [memberModalVisible, setMemberModalVisible] = useState(false);
  
  const departmentId = isLeaderArea ? (departmentContextId || departmentIdFromUser(user)) : undefined;
  const usersQuery = useScopedEmployees(
    { page: 1, limit: 100, ...(departmentId ? { departmentId } : {}) },
    hasAnyPermission(user, ['employee.read', 'task.assign_any', 'task.assign_department'])
  );
  
  const employeeOptions = useMemo(() => {
    return (usersQuery.data?.items ?? []).map(u => ({
      id: u.id,
      label: u.fullName ?? u.userCode,
      subtitle: u.department?.name,
    }));
  }, [usersQuery.data?.items]);

  async function submit() {
    const isGroup = assigneeMode === 'GROUP';
    const isDept = assigneeMode === 'DEPARTMENT';

    const effectiveTargets = isGroup
      ? []
      : isDept
      ? targets.filter(t => t.targetType === 'DEPARTMENT').map(t => ({ targetType: t.targetType, targetId: t.targetId }))
      : targets.filter(t => t.targetType === 'USER').map(t => ({ targetType: t.targetType, targetId: t.targetId }));

    const payload: CreateTaskPayload = {
      title,
      description,
      priority,
      ...(departmentContextId ? { departmentContextId } : {}),
      ...(startAt ? { startAt: startAt.toISOString() } : {}),
      ...(dueAt ? { dueAt: dueAt.toISOString() } : {}),
      ...(parentTaskId ? { parentTaskId } : {}),
      isAdhocGroup: isGroup,
      ...(isGroup ? { memberIds, leaderId } : { targets: effectiveTargets }),
    };
    try {
      const task = await mutation.mutateAsync(payload);
      
      for (const attachment of attachments) {
        try {
          await createTaskAttachment(task.id, attachment);
        } catch (e) {
          console.error('Failed to attach file:', e);
        }
      }
      
      showAlert('Thành công', parentTaskId ? 'Đã tạo công việc con và phân công thành công!' : 'Đã giao việc thành công!', () => router.back());
    } catch (error) {
      const normalized = normalizeApiError(error);
      showAlert(normalized.code, mapTaskError(normalized.code, normalized.message));
    }
  }

  const removeTarget = (target: CreateTaskTargetPayload) => {
    setTargets(targets.filter(t => t.targetId !== target.targetId || t.targetType !== target.targetType));
  };

  const getPriorityColor = (p: TaskPriority) => {
    if (p === 'URGENT') return colors.danger;
    if (p === 'HIGH') return colors.warning;
    if (p === 'NORMAL') return colors.primary;
    return colors.success;
  };

  const selectedMembers = useMemo(() => {
    return employeeOptions.filter(o => memberIds.includes(o.id));
  }, [employeeOptions, memberIds]);

  const selectedDeptTargets = useMemo(() => {
    return targets.filter(t => t.targetType === 'DEPARTMENT');
  }, [targets]);

  const selectedUserTargets = useMemo(() => {
    return targets.filter(t => t.targetType === 'USER');
  }, [targets]);

  const isSubmitDisabled = () => {
    if (title.trim().length < 3) return true;
    if (assigneeMode === 'GROUP') {
      return memberIds.length === 0 || !leaderId;
    }
    if (assigneeMode === 'DEPARTMENT') {
      return selectedDeptTargets.length === 0;
    }
    return selectedUserTargets.length === 0;
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <PageHeader 
          title={parentTaskId ? 'Chia nhỏ việc con (Subtask)' : area === 'admin' ? 'Giao việc (Admin)' : 'Giao việc cho nhân sự'} 
          subtitle={parentTaskId && parentTaskQuery.data ? `Thuộc dự án: ${parentTaskQuery.data.title}` : isLeaderArea ? `Phòng ban: ${user?.department?.name || 'Của bạn'}` : 'Tạo và phân công công việc mới'} 
        />

        {parentTaskId && parentTaskQuery.data ? (
          <View style={styles.parentTaskBanner}>
            <View style={styles.parentTaskTagRow}>
              <MaterialCommunityIcons name="layers-outline" size={16} color={colors.primary} />
              <Text style={styles.parentTaskTagText}>DỰ ÁN TRỰC THUỘC</Text>
            </View>
            <Text style={styles.parentTaskTitle}>{parentTaskQuery.data.title}</Text>
            <Text style={styles.parentTaskSubInfo}>
              Mã dự án: {parentTaskQuery.data.taskCode ?? 'Dự án'}
              {parentTaskQuery.data.dueAt ? ` • Hạn chót dự án cha: ${formatDateTime(parentTaskQuery.data.dueAt)}` : ''}
            </Text>
          </View>
        ) : null}
        
        <SectionCard title={parentTaskId ? "Thông tin công việc con" : "Thông tin công việc"}>
          <FormField label="Tên công việc" value={title} onChangeText={setTitle} placeholder="Nhập tên công việc..." />
          <FormField label="Mô tả chi tiết" value={description} onChangeText={setDescription} multiline placeholder="Mô tả các yêu cầu cần làm..." />
          
          <View style={{ marginTop: spacing.md }}>
            <Text style={styles.fieldLabel}>Tệp đính kèm</Text>
            {attachments.length > 0 && (
              <View style={{ marginBottom: spacing.sm, gap: spacing.xs }}>
                {attachments.map((att, i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, padding: spacing.sm, borderRadius: 8 }}>
                    <MaterialCommunityIcons name="paperclip" size={20} color={colors.primary} />
                    <Text style={{ flex: 1, marginLeft: spacing.sm, color: colors.text }} numberOfLines={1}>{att.fileName}</Text>
                    <Pressable onPress={() => setAttachments(attachments.filter((_, idx) => idx !== i))}>
                      <MaterialCommunityIcons name="close" size={20} color={colors.danger} />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
            <AttachmentPicker onAttach={async (payload) => {
              setAttachments(prev => [...prev, payload]);
            }} pending={mutation.isPending} />
          </View>
        </SectionCard>

        <SectionCard title="Phân loại & Thời hạn">
          <Text style={styles.fieldLabel}>Mức độ ưu tiên</Text>
          <View style={styles.priorityWrap}>
            {priorities.map((item) => {
              const isActive = priority === item;
              return (
                <Pressable
                  key={item}
                  style={[styles.priorityPill, isActive && styles.priorityPillActive]}
                  onPress={() => setPriority(item)}
                >
                  <Text style={[styles.priorityText, isActive && styles.priorityTextActive]} >{PRIORITY_LABELS[item]}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Thời gian bắt đầu</Text>
            <View style={styles.splitDateRow}>
              <Pressable style={styles.splitDatePickerBtn} onPress={() => { setShowDueDatePicker(false); setShowStartDatePicker(true); }}>
                <MaterialCommunityIcons name="calendar-month-outline" size={20} color={colors.text} />
                <Text style={startAt ? styles.dateText : styles.datePlaceholder}>
                  {startAt ? startAt.toLocaleDateString('vi-VN') : 'Chọn thời gian'}
                </Text>
              </Pressable>
              <Pressable style={styles.splitDatePickerBtn} onPress={() => { setShowDueDatePicker(false); setShowStartDatePicker(true); }}>
                <MaterialCommunityIcons name="clock-outline" size={20} color={colors.text} />
                <Text style={startAt ? styles.dateText : styles.datePlaceholder}>
                  {startAt ? startAt.toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'}) : 'Chọn thời gian'}
                </Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Thời gian hết hạn</Text>
            <View style={styles.splitDateRow}>
              <Pressable style={styles.splitDatePickerBtn} onPress={() => { setShowStartDatePicker(false); setShowDueDatePicker(true); }}>
                <MaterialCommunityIcons name="calendar-month-outline" size={20} color={colors.text} />
                <Text style={dueAt ? styles.dateText : styles.datePlaceholder}>
                  {dueAt ? dueAt.toLocaleDateString('vi-VN') : 'Chọn thời gian'}
                </Text>
              </Pressable>
              <Pressable style={styles.splitDatePickerBtn} onPress={() => { setShowStartDatePicker(false); setShowDueDatePicker(true); }}>
                <MaterialCommunityIcons name="clock-outline" size={20} color={colors.text} />
                <Text style={dueAt ? styles.dateText : styles.datePlaceholder}>
                  {dueAt ? dueAt.toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'}) : 'Chọn thời gian'}
                </Text>
              </Pressable>
            </View>
          </View>
          
          <ActionDatePicker
            visible={showStartDatePicker}
            value={startAt}
            title="Chọn thời gian bắt đầu"
            onChange={(d) => setStartAt(d)}
            onClose={() => setShowStartDatePicker(false)}
          />
          <ActionDatePicker
            visible={showDueDatePicker}
            value={dueAt}
            title="Chọn thời gian kết thúc"
            onChange={(d) => setDueAt(d)}
            onClose={() => setShowDueDatePicker(false)}
          />
        </SectionCard>

        <SectionCard title="Đối tượng nhận việc & Phân công">
          {!parentTaskId && area === 'admin' ? (
            <View style={styles.modeSegmentContainer}>
              <Pressable
                style={[styles.modeSegmentBtn, assigneeMode === 'DEPARTMENT' && styles.modeSegmentBtnActive]}
                onPress={() => setAssigneeMode('DEPARTMENT')}
              >
                <MaterialCommunityIcons
                  name="domain"
                  size={16}
                  color={assigneeMode === 'DEPARTMENT' ? colors.primary : '#64748B'}
                />
                <Text style={[styles.modeSegmentText, assigneeMode === 'DEPARTMENT' && styles.modeSegmentTextActive]}>
                  Phòng ban
                </Text>
              </Pressable>

              <Pressable
                style={[styles.modeSegmentBtn, assigneeMode === 'USER' && styles.modeSegmentBtnActive]}
                onPress={() => setAssigneeMode('USER')}
              >
                <MaterialCommunityIcons
                  name="account-outline"
                  size={16}
                  color={assigneeMode === 'USER' ? colors.primary : '#64748B'}
                />
                <Text style={[styles.modeSegmentText, assigneeMode === 'USER' && styles.modeSegmentTextActive]}>
                  Cá nhân
                </Text>
              </Pressable>

              <Pressable
                style={[styles.modeSegmentBtn, assigneeMode === 'GROUP' && styles.modeSegmentBtnActive]}
                onPress={() => setAssigneeMode('GROUP')}
              >
                <MaterialCommunityIcons
                  name="account-group-outline"
                  size={16}
                  color={assigneeMode === 'GROUP' ? colors.primary : '#64748B'}
                />
                <Text style={[styles.modeSegmentText, assigneeMode === 'GROUP' && styles.modeSegmentTextActive]}>
                  Nhóm đặc nhiệm
                </Text>
              </Pressable>
            </View>
          ) : null}

          {/* Mode 1: Giao cho Phòng ban */}
          {assigneeMode === 'DEPARTMENT' ? (
            <View>
              <View style={[styles.modeInfoCard, styles.modeInfoCardDept]}>
                <View style={styles.modeInfoTitleRow}>
                  <MaterialCommunityIcons name="domain" size={18} color="#2563EB" />
                  <Text style={[styles.modeInfoTitle, { color: '#1E40AF' }]}>Quy trình bàn giao Phòng ban</Text>
                </View>
                <Text style={styles.modeInfoDesc}>
                  Dự án được phân công trực tiếp cho Trưởng phòng (Leader). Leader tiếp nhận, chia các việc con cho nhân sự thực hiện, duyệt kết quả con và báo cáo hoàn thành dự án lên Admin.
                </Text>
              </View>

              <Text style={styles.fieldLabel}>Phòng ban nhận việc</Text>
              <View style={styles.targetTagsWrap}>
                {selectedDeptTargets.map((target: any) => (
                  <View key={target.targetId} style={[styles.targetTag, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
                    <MaterialCommunityIcons name="domain" size={16} color="#2563EB" />
                    <Text style={[styles.targetTagText, { color: '#1E40AF' }]}>
                      {target.targetName ?? `Phòng ban: ${target.targetId.substring(0, 6)}...`}
                    </Text>
                    <Pressable onPress={() => removeTarget(target)}>
                      <MaterialCommunityIcons name="close-circle" size={16} color="#3B82F6" />
                    </Pressable>
                  </View>
                ))}
                <Pressable
                  style={styles.addTargetBtn}
                  onPress={() => {
                    setTargetModalFilter('DEPARTMENT');
                    setTargetModalVisible(true);
                  }}
                >
                  <MaterialCommunityIcons name="plus" size={20} color={colors.primary} />
                  <Text style={styles.addTargetBtnText}>Chọn phòng ban</Text>
                </Pressable>
              </View>
              {!selectedDeptTargets.length && (
                <Text style={styles.meta}>Vui lòng chọn ít nhất 1 phòng ban nhận nhiệm vụ.</Text>
              )}
            </View>
          ) : null}

          {/* Mode 2: Giao cho Cá nhân */}
          {assigneeMode === 'USER' ? (
            <View>
              {!parentTaskId && (
                <View style={[styles.modeInfoCard, styles.modeInfoCardUser]}>
                  <View style={styles.modeInfoTitleRow}>
                    <MaterialCommunityIcons name="account-outline" size={18} color="#059669" />
                    <Text style={[styles.modeInfoTitle, { color: '#065F46' }]}>Giao việc trực tiếp cho Cá nhân</Text>
                  </View>
                  <Text style={styles.modeInfoDesc}>
                    Giao việc cho từng nhân sự / trưởng phòng cụ thể. Người nhận sẽ trực tiếp cập nhật tiến độ, hoàn thành và nộp báo cáo.
                  </Text>
                </View>
              )}

              <Text style={styles.fieldLabel}>Nhân sự nhận việc</Text>
              <View style={styles.targetTagsWrap}>
                {selectedUserTargets.map((target: any) => (
                  <View key={target.targetId} style={styles.targetTag}>
                    <MaterialCommunityIcons
                      name={target.targetName?.includes('Admin') ? 'shield-account' : 'account'}
                      size={16}
                      color={colors.primaryDark}
                    />
                    <Text style={styles.targetTagText}>
                      {target.targetName ?? `NV: ${target.targetId.substring(0, 6)}...`}
                    </Text>
                    <Pressable onPress={() => removeTarget(target)}>
                      <MaterialCommunityIcons name="close-circle" size={16} color={colors.muted} />
                    </Pressable>
                  </View>
                ))}
                <Pressable
                  style={styles.addTargetBtn}
                  onPress={() => {
                    setTargetModalFilter('USER');
                    setTargetModalVisible(true);
                  }}
                >
                  <MaterialCommunityIcons name="plus" size={20} color={colors.primary} />
                  <Text style={styles.addTargetBtnText}>Thêm người nhận</Text>
                </Pressable>
              </View>
              {!selectedUserTargets.length && (
                <Text style={styles.meta}>Chưa có nhân sự nào được chọn.</Text>
              )}
            </View>
          ) : null}

          {/* Mode 3: Nhóm đặc nhiệm */}
          {assigneeMode === 'GROUP' ? (
            <View>
              <View style={[styles.modeInfoCard, styles.modeInfoCardGroup]}>
                <View style={styles.modeInfoTitleRow}>
                  <MaterialCommunityIcons name="account-group" size={18} color="#7C3AED" />
                  <Text style={[styles.modeInfoTitle, { color: '#5B21B6' }]}>Nhóm liên phòng ban / Đặc nhiệm</Text>
                </View>
                <Text style={styles.modeInfoDesc}>
                  Tập hợp nhân sự từ nhiều phòng ban cùng làm việc. Hệ thống tự động tạo Nhóm Chat trao đổi. Trưởng nhóm (Leader) được chỉ định là người chịu trách nhiệm nộp báo cáo hoàn thành lên Admin.
                </Text>
              </View>

              <Text style={styles.fieldLabel}>Thành viên nhóm ({memberIds.length})</Text>
              <View style={styles.targetTagsWrap}>
                {selectedMembers.map(m => (
                  <View key={m.id} style={[styles.targetTag, leaderId === m.id && styles.groupLeaderTag]}>
                    <MaterialCommunityIcons
                      name={leaderId === m.id ? 'crown' : 'account'}
                      size={16}
                      color={leaderId === m.id ? '#7C3AED' : colors.primaryDark}
                    />
                    <Text style={[styles.targetTagText, leaderId === m.id && { color: '#6D28D9', fontWeight: '800' }]}>
                      {m.label} {leaderId === m.id ? '(Trưởng nhóm)' : ''}
                    </Text>
                    <Pressable onPress={() => {
                      setMemberIds(prev => prev.filter(id => id !== m.id));
                      if (leaderId === m.id) setLeaderId('');
                    }}>
                      <MaterialCommunityIcons name="close-circle" size={16} color={colors.muted} />
                    </Pressable>
                  </View>
                ))}
                <Pressable style={styles.addTargetBtn} onPress={() => setMemberModalVisible(true)}>
                  <MaterialCommunityIcons name="plus" size={20} color={colors.primary} />
                  <Text style={styles.addTargetBtnText}>Thêm thành viên</Text>
                </Pressable>
              </View>

              {memberIds.length > 0 ? (
                <View style={{ marginTop: spacing.md }}>
                  <Text style={styles.fieldLabel}>Chỉ định Trưởng nhóm (Leader nộp báo cáo)</Text>
                  <View style={styles.targetTagsWrap}>
                    {selectedMembers.map(m => {
                      const isLeader = leaderId === m.id;
                      return (
                        <Pressable 
                          key={m.id} 
                          style={[styles.targetTag, isLeader && { backgroundColor: '#7C3AED', borderColor: '#7C3AED' }]}
                          onPress={() => setLeaderId(m.id)}
                        >
                          <MaterialCommunityIcons name={isLeader ? 'crown' : 'account-outline'} size={16} color={isLeader ? '#FFF' : colors.text} />
                          <Text style={[styles.targetTagText, isLeader && { color: '#FFF', fontWeight: '700' }]}>
                            {m.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                  {!leaderId && (
                    <Text style={[styles.meta, { color: colors.danger, marginTop: 4 }]}>
                      Vui lòng chọn 1 thành viên làm Trưởng nhóm để chịu trách nhiệm nộp báo cáo.
                    </Text>
                  )}
                </View>
              ) : (
                <Text style={styles.meta}>Chưa có thành viên nào trong nhóm.</Text>
              )}

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: spacing.md, backgroundColor: '#F3E8FF', padding: spacing.sm, borderRadius: 8 }}>
                <MaterialCommunityIcons name="forum-outline" size={20} color="#7C3AED" />
                <Text style={{ flex: 1, fontSize: 12, color: '#6B21A8' }}>
                  Nhóm chat nội bộ sẽ tự động được khởi tạo cho tất cả thành viên khi giao việc.
                </Text>
              </View>
            </View>
          ) : null}
        </SectionCard>

        <PrimaryButton 
          loading={mutation.isPending} 
          disabled={isSubmitDisabled()} 
          onPress={() => void submit()}
        >
          {parentTaskId ? 'Tạo việc con' : 'Giao việc ngay'}
        </PrimaryButton>
      </ScrollView>
      
      <AssigneeSelectorModal
        area={area}
        visible={targetModalVisible}
        onClose={() => setTargetModalVisible(false)}
        targets={targets}
        onChange={setTargets}
        targetTypeFilter={targetModalFilter}
        filterDepartmentId={isLeaderArea ? departmentContextId : undefined}
      />

      <MultiSelectModal
        visible={memberModalVisible}
        title="Chọn thành viên nhóm"
        options={employeeOptions}
        selectedValues={memberIds}
        onSelect={setMemberIds}
        onClose={() => setMemberModalVisible(false)}
        isLoading={usersQuery.isLoading}
      />
    </Screen>
  );
}

export function TaskReviewQueueScreen({ area }: { area: Exclude<TaskArea, 'employee'> }) {
  const router = useRouter();
  const { showAlert } = useAppAlert();
  const queue = useTaskReviewQueue({ page: 1, limit: 20 });
  const extensions = usePendingTaskExtensions({ page: 1, limit: 20 });
  const review = useReviewTaskAssignment();
  const extensionReview = useReviewTaskExtension();
  async function run(action: () => Promise<unknown>, success: string) {
    try {
      await action();
      showAlert('Thành công', success);
    } catch (error) {
      const normalized = normalizeApiError(error);
      showAlert(normalized.code, mapTaskError(normalized.code, normalized.message));
    }
  }
  return (
    <Screen>
      <ScreenContainer refreshControl={<RefreshControl refreshing={queue.isRefetching || extensions.isRefetching} onRefresh={() => { void queue.refetch(); void extensions.refetch(); }} />}>
        <PageHeader title="Duyệt công việc" subtitle="Danh sách các công việc và yêu cầu gia hạn đang chờ duyệt." />
        {queue.isLoading ? <LoadingState /> : null}
        {queue.isError ? <ErrorState error={queue.error} onRetry={() => void queue.refetch()} /> : null}
        {queue.data?.items?.map((item) => (
          <SectionCard key={item.assignmentId}>
            <Text style={styles.titleText}>{item.taskTitle}</Text>
            <Text style={styles.meta}>{item.taskCode} - {item.employee.fullName ?? item.employee.userCode}</Text>
            <ProgressBar value={item.progressPercent} />
            <Text style={styles.meta}>{item.completionNote ?? 'Không có ghi chú hoàn thành'}</Text>
            <ReviewActionSheet
              pending={review.isPending}
              onApprove={(note) => run(() => review.mutateAsync({ assignmentId: item.assignmentId, action: 'approve', payload: note ? { note } : {} }), 'Đã duyệt công việc')}
              onReject={(note) => run(() => review.mutateAsync({ assignmentId: item.assignmentId, action: 'reject', payload: { note } }), 'Đã từ chối công việc')}
            />
            <SecondaryButton onPress={() => router.push(`/${area}/tasks/${item.taskId}`)}>Mở công việc</SecondaryButton>
          </SectionCard>
        ))}
        {!queue.data?.items?.length ? <EmptyState title="Không có công việc cần duyệt" /> : null}
        <SectionCard title="Gia hạn đang chờ duyệt">
          {extensions.isLoading ? <LoadingState /> : null}
          {extensions.isError ? <ErrorState error={extensions.error} onRetry={() => void extensions.refetch()} /> : null}
          {extensions.data?.items?.map((item) => (
            <View key={item.id} style={styles.inlinePanel}>
              <Text style={styles.titleText}>{item.taskTitle}</Text>
              <Text style={styles.meta}>{item.employee.fullName ?? item.employee.userCode}</Text>
              <Text style={styles.meta}>Đã yêu cầu: {formatDateTime(item.requestedDueAt)}</Text>
              <Text style={styles.body}>{item.reason}</Text>
              <ReviewActionSheet
                pending={extensionReview.isPending}
                onApprove={(note) => run(() => extensionReview.mutateAsync({ id: item.id, action: 'approve', payload: note ? { note } : {} }), 'Đã duyệt gia hạn')}
                onReject={(note) => run(() => extensionReview.mutateAsync({ id: item.id, action: 'reject', payload: { note } }), 'Đã từ chối gia hạn')}
              />
            </View>
          ))}
          {!extensions.data?.items?.length ? <Text style={styles.meta}>Không có gia hạn nào đang chờ</Text> : null}
        </SectionCard>
      </ScreenContainer>
    </Screen>
  );
}

function AssigneeSelectorModal({
  area,
  visible,
  onClose,
  targets,
  onChange,
  filterDepartmentId,
  filterBranchId,
  targetTypeFilter = 'ALL',
}: {
  area: Exclude<TaskArea, 'employee'>;
  visible: boolean;
  onClose: () => void;
  targets: CreateTaskTargetPayload[];
  onChange: (targets: CreateTaskTargetPayload[]) => void;
  filterDepartmentId?: string;
  filterBranchId?: string;
  targetTypeFilter?: 'ALL' | 'DEPARTMENT' | 'USER';
}) {
  const { user } = useAuth();

  const isDeptOnly = targetTypeFilter === 'DEPARTMENT';
  const isUserOnly = targetTypeFilter === 'USER';

  const adminRegionScope = user?.scopes?.find(
    (s: any) => (s.role === 'ADMIN' || s.role?.code === 'ADMIN') && s.scopeType === 'REGION' && s.scopeId
  );
  const userRegionId = adminRegionScope?.scopeId;
  const isRegionAdmin = Boolean(adminRegionScope && userRegionId);

  const isSuperAdmin = Boolean(
    user?.roles?.includes('ADMIN') && !isRegionAdmin
  );

  // Only Super Admin can assign tasks to Region Admins!
  const canSelectRegionAdmin = isSuperAdmin && !isDeptOnly;

  const [selectedRegion, setSelectedRegion] = useState<{ id: string; name: string } | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<{ id: string; name: string } | null>(null);
  const [selectedDept, setSelectedDept] = useState<{ id: string; name: string } | null>(null);
  const [deptUserSearch, setDeptUserSearch] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');

  const departments = useDepartments({ page: 1, limit: 1000 });
  const regionsQuery = useRegions();
  const branchesQuery = useBranches();
  const adminUsersQuery = useEmployees({ role: 'ADMIN', limit: 100 }, canSelectRegionAdmin && visible);

  const branchRegionMap = useMemo(() => {
    const map = new Map<string, string>();
    (branchesQuery.data ?? []).forEach((b) => {
      if (b.regionId) map.set(b.id, b.regionId);
    });
    return map;
  }, [branchesQuery.data]);

  const regionMap = useMemo(() => {
    const map = new Map<string, string>();
    (regionsQuery.data ?? []).forEach((r) => {
      map.set(r.id, r.name);
    });
    return map;
  }, [regionsQuery.data]);

  const departmentTree = useMemo<Array<{
    id: string;
    name: string;
    code?: string;
    branches: Array<{
      id: string;
      name: string;
      address?: string;
      departments: Array<{ id: string; name: string }>;
    }>;
  }>>(() => {
    const rawRegions = regionsQuery.data ?? [];
    const rawBranches = branchesQuery.data ?? [];
    let rawDepts = departments.data?.items ?? [];

    if (filterBranchId) {
      rawDepts = rawDepts.filter((d) => d.branchId === filterBranchId || d.branch?.id === filterBranchId);
    }

    // Build branch map
    const branchMap = new Map<string, {
      id: string;
      name: string;
      address?: string;
      departments: Array<{ id: string; name: string }>;
    }>();

    rawBranches.forEach((b) => {
      branchMap.set(b.id, {
        id: b.id,
        name: b.name,
        address: b.address,
        departments: [],
      });
    });

    rawDepts.forEach((d) => {
      const bId = d.branchId || d.branch?.id;
      if (bId && branchMap.has(bId)) {
        branchMap.get(bId)!.departments.push({
          id: d.id,
          name: d.name,
        });
      } else if (bId) {
        branchMap.set(bId, {
          id: bId,
          name: d.branch?.name || 'Cơ sở khác',
          departments: [{ id: d.id, name: d.name }],
        });
      } else {
        const unknownBId = 'UNKNOWN_BRANCH';
        if (!branchMap.has(unknownBId)) {
          branchMap.set(unknownBId, {
            id: unknownBId,
            name: 'Chưa phân cơ sở',
            departments: [],
          });
        }
        branchMap.get(unknownBId)!.departments.push({ id: d.id, name: d.name });
      }
    });

    // Build region map
    const regionMapObj = new Map<string, {
      id: string;
      name: string;
      code?: string;
      branches: Array<{
        id: string;
        name: string;
        address?: string;
        departments: Array<{ id: string; name: string }>;
      }>;
    }>();

    rawRegions.forEach((r) => {
      regionMapObj.set(r.id, {
        id: r.id,
        name: r.name,
        code: r.code,
        branches: [],
      });
    });

    const fallbackRegionId = 'OTHER_REGION';
    const fallbackRegion = {
      id: fallbackRegionId,
      name: 'Trụ sở / Cơ sở khác',
      code: 'OTHER',
      branches: [] as Array<{
        id: string;
        name: string;
        address?: string;
        departments: Array<{ id: string; name: string }>;
      }>,
    };

    branchMap.forEach((branchItem, bId) => {
      const rawB = rawBranches.find((b) => b.id === bId);
      const rId = rawB?.regionId || rawB?.region?.id;
      if (rId && regionMapObj.has(rId)) {
        regionMapObj.get(rId)!.branches.push(branchItem);
      } else {
        fallbackRegion.branches.push(branchItem);
      }
    });

    let tree = Array.from(regionMapObj.values());
    if (fallbackRegion.branches.length > 0) {
      tree.push(fallbackRegion);
    }

    // Filter by Region Admin scope if applicable
    if (isRegionAdmin && userRegionId) {
      tree = tree.filter((r) => r.id === userRegionId);
    }

    // Sort regions so Miền Bắc, Miền Nam appear consistently
    tree.sort((a, b) => a.name.localeCompare(b.name, 'vi'));

    return tree;
  }, [regionsQuery.data, branchesQuery.data, departments.data?.items, filterBranchId, isRegionAdmin, userRegionId]);

  const isLeaderMode = area === 'leader' || area === 'hr';

  useEffect(() => {
    if (visible) {
      setSearchKeyword('');
      setDeptUserSearch('');
      if (isLeaderMode) {
        const targetDeptId = filterDepartmentId || departmentIdFromUser(user) || '__MY_DEPT__';
        const deptName = user?.department?.name || 'Phòng ban của bạn';
        setSelectedDept({ id: targetDeptId, name: deptName });
        setSelectedRegion(null);
        setSelectedBranch(null);
      } else {
        setSelectedBranch(null);
        setSelectedDept(null);
        if (departmentTree.length === 1 && departmentTree[0]) {
          const firstRegion = departmentTree[0];
          setSelectedRegion({ id: firstRegion.id, name: firstRegion.name });
        } else {
          setSelectedRegion(null);
        }
      }
    }
  }, [visible, departmentTree, isLeaderMode, filterDepartmentId, user]);

  const departmentId = filterDepartmentId || departmentIdFromUser(user);
  const users = useScopedEmployees(
    { page: 1, limit: 200, ...(departmentId ? { departmentId } : {}) },
    hasAnyPermission(user, ['employee.read', 'task.assign_any', 'task.assign_department'])
  );

  const usersByDeptId = useMemo(() => {
    const map = new Map<string, any[]>();
    (users.data?.items ?? []).forEach((u: any) => {
      const deptIds = new Set<string>();
      if (u.department?.id) deptIds.add(u.department.id);
      if (u.departmentId) deptIds.add(u.departmentId);
      if (Array.isArray(u.departmentLinks)) {
        u.departmentLinks.forEach((link: any) => {
          const dId = link.departmentId || link.department?.id;
          if (dId) deptIds.add(dId);
        });
      }
      if (deptIds.size === 0) {
        deptIds.add('__UNASSIGNED__');
      }
      deptIds.forEach((dId) => {
        if (!map.has(dId)) {
          map.set(dId, []);
        }
        map.get(dId)!.push(u);
      });
    });
    return map;
  }, [users.data?.items]);

  const regionAdmins = useMemo(() => {
    if (!adminUsersQuery.data?.items || isDeptOnly) return [];
    const list: Array<{
      id: string;
      fullName: string;
      userCode: string;
      phone?: string;
      regionId: string;
      regionName: string;
      label: string;
    }> = [];

    adminUsersQuery.data.items.forEach((u) => {
      const regionScope = u.roles?.find(
        (r) => (r.role?.code === 'ADMIN' || (r as any).role === 'ADMIN') && r.scopeType === 'REGION' && r.scopeId
      );
      if (regionScope?.scopeId) {
        const rName = regionMap.get(regionScope.scopeId) || 'Miền';
        const fullName = u.profile?.fullName || (u as any).fullName || u.userCode;
        list.push({
          id: u.id,
          fullName,
          userCode: u.userCode,
          phone: u.phone,
          regionId: regionScope.scopeId,
          regionName: rName,
          label: `${fullName} (Admin ${rName})`,
        });
      }
    });

    return list;
  }, [adminUsersQuery.data?.items, regionMap, isDeptOnly]);

  const filteredRegionAdmins = useMemo(() => {
    if (!searchKeyword.trim() || isDeptOnly) return regionAdmins;
    const kw = searchKeyword.trim().toLowerCase();
    return regionAdmins.filter(
      (ra) =>
        ra.fullName.toLowerCase().includes(kw) ||
        ra.userCode.toLowerCase().includes(kw) ||
        ra.regionName.toLowerCase().includes(kw)
    );
  }, [regionAdmins, searchKeyword, isDeptOnly]);

  const filteredUsers = useMemo(() => {
    if (!users.data?.items || isDeptOnly) return [];
    let items = users.data.items;
    if (isLeaderMode) {
      items = items.filter((u) => u.id !== user?.id);
    }
    if (isRegionAdmin && userRegionId) {
      items = items.filter((u: any) => {
        const links = u.departmentLinks || [];
        if (links.length > 0) {
          return links.some((l: any) => {
            const rId =
              l.department?.branch?.region?.id ||
              l.department?.branch?.regionId ||
              branchRegionMap.get(l.department?.branchId);
            return rId === userRegionId;
          });
        }
        const dept = u.department;
        if (dept) {
          const rId = dept.branch?.region?.id || dept.branch?.regionId || branchRegionMap.get(dept.branchId);
          return rId === userRegionId;
        }
        return true;
      });
    }
    if (searchKeyword.trim()) {
      const kw = searchKeyword.trim().toLowerCase();
      items = items.filter((u: any) => {
        const name = (u.profile?.fullName || u.fullName || u.userCode || '').toLowerCase();
        const code = (u.userCode || '').toLowerCase();
        const deptName = (u.department?.name || '').toLowerCase();
        return name.includes(kw) || code.includes(kw) || deptName.includes(kw);
      });
    }
    return items;
  }, [users.data?.items, isLeaderMode, user?.id, isRegionAdmin, userRegionId, branchRegionMap, searchKeyword, isDeptOnly]);

  const filteredDepartments = useMemo(() => {
    if (!departments.data?.items || isUserOnly) return [];
    let items = departments.data.items;
    if (isRegionAdmin && userRegionId) {
      items = items.filter((d: any) => {
        const rId = d.branch?.region?.id || d.branch?.regionId || branchRegionMap.get(d.branchId);
        return rId === userRegionId;
      });
    }
    if (searchKeyword.trim()) {
      const kw = searchKeyword.trim().toLowerCase();
      items = items.filter((d: any) => {
        const name = (d.name || '').toLowerCase();
        const code = (d.code || '').toLowerCase();
        const bName = (d.branch?.name || '').toLowerCase();
        return name.includes(kw) || code.includes(kw) || bName.includes(kw);
      });
    }
    return items;
  }, [departments.data?.items, isRegionAdmin, userRegionId, branchRegionMap, searchKeyword, isUserOnly]);

  const deptUsers = useMemo(() => {
    if (!selectedDept) return [];
    let list = usersByDeptId.get(selectedDept.id) || [];
    if (list.length === 0 && isLeaderMode) {
      list = users.data?.items ?? [];
    }
    if (isLeaderMode) {
      list = list.filter((u) => u.id !== user?.id);
    }
    return list;
  }, [selectedDept, usersByDeptId, isLeaderMode, user?.id, users.data?.items]);

  const filteredDeptUsers = useMemo(() => {
    if (!deptUserSearch.trim()) return deptUsers;
    const kw = deptUserSearch.trim().toLowerCase();
    return deptUsers.filter((u: any) => {
      const name = (u.profile?.fullName || u.fullName || u.userCode || '').toLowerCase();
      const code = (u.userCode || '').toLowerCase();
      const pos = (u.position?.name || '').toLowerCase();
      return name.includes(kw) || code.includes(kw) || pos.includes(kw);
    });
  }, [deptUsers, deptUserSearch]);

  const isSelected = (type: TaskTargetType, id: string) => {
    return targets.some((t) => t.targetType === type && t.targetId === id);
  };

  const toggleTarget = (type: TaskTargetType, id: string, name?: string) => {
    if (isSelected(type, id)) {
      onChange(targets.filter((t) => t.targetType !== type || t.targetId !== id));
    } else {
      onChange([...targets, { targetType: type, targetId: id, targetName: name } as any]);
    }
  };

  const getSelectedCountInDept = (deptId: string) => {
    const isEntire = isSelected('DEPARTMENT', deptId);
    const usersInDept = usersByDeptId.get(deptId) || [];
    const selectedUsers = usersInDept.filter((u) => isSelected('USER', u.id)).length;
    return { isEntire, selectedUsers, total: isEntire ? selectedUsers + 1 : selectedUsers };
  };

  const getSelectedCountInBranch = (b: { departments: Array<{ id: string }> }) => {
    let count = 0;
    b.departments.forEach((d) => {
      count += getSelectedCountInDept(d.id).total;
    });
    return count;
  };

  const getSelectedCountInRegion = (r: { id: string; branches: Array<{ departments: Array<{ id: string }> }> }) => {
    let count = 0;
    const rAdmins = regionAdmins.filter((ra) => ra.regionId === r.id);
    rAdmins.forEach((ra) => {
      if (isSelected('USER', ra.id)) count++;
    });
    r.branches.forEach((b) => {
      count += getSelectedCountInBranch(b);
    });
    return count;
  };

  // Find active region and branch objects from tree
  const currentRegionObj = useMemo(() => {
    if (!selectedRegion) return null;
    return departmentTree.find((r) => r.id === selectedRegion.id) || null;
  }, [selectedRegion, departmentTree]);

  const currentBranchObj = useMemo(() => {
    if (!currentRegionObj || !selectedBranch) return null;
    return currentRegionObj.branches.find((b) => b.id === selectedBranch.id) || null;
  }, [currentRegionObj, selectedBranch]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.assigneeModalContent}>
          {searchKeyword.trim() ? (
            /* --- SEARCH RESULTS VIEW --- */
            <>
              <View style={styles.stepNavHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stepTitle}>Kết quả tìm kiếm</Text>
                  <Text style={styles.stepSubtitle}>Từ khoá: "{searchKeyword.trim()}"</Text>
                </View>
                <Pressable onPress={onClose}>
                  <MaterialCommunityIcons name="close" size={24} color={colors.text} />
                </Pressable>
              </View>

              <SearchInput
                value={searchKeyword}
                onChangeText={setSearchKeyword}
                placeholder={isDeptOnly ? 'Tìm kiếm phòng ban...' : 'Tìm kiếm phòng ban hoặc tên NV...'}
              />

              <ScrollView style={[styles.assigneeList, { marginTop: spacing.md }]}>
                {/* Matching Departments */}
                {!isUserOnly && filteredDepartments.length > 0 && (
                  <View style={{ marginBottom: spacing.md }}>
                    <Text style={[styles.deptUsersSectionTitle, { marginBottom: spacing.xs }]}>
                      Phòng ban tìm thấy ({filteredDepartments.length})
                    </Text>
                    {filteredDepartments.map((d: any) => {
                      const selected = isSelected('DEPARTMENT', d.id);
                      const bName = d.branch?.name;
                      return (
                        <Pressable
                          key={d.id}
                          style={[styles.assigneeRow, selected && styles.assigneeRowSelected]}
                          onPress={() => toggleTarget('DEPARTMENT', d.id, d.name)}
                        >
                          <View style={styles.assigneeInfo}>
                            <View style={[styles.assigneeAvatar, selected && { backgroundColor: '#DCFCE7' }]}>
                              <MaterialCommunityIcons
                                name="domain"
                                size={20}
                                color={selected ? '#16A34A' : colors.muted}
                              />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={[styles.assigneeName, selected && { color: '#15803D', fontWeight: '700' }]}>
                                {d.name}
                              </Text>
                              {bName ? <Text style={styles.assigneeSubtext}>Cơ sở: {bName}</Text> : null}
                            </View>
                          </View>
                          <MaterialCommunityIcons
                            name={selected ? 'check-circle' : 'circle-outline'}
                            size={24}
                            color={selected ? '#16A34A' : colors.border}
                          />
                        </Pressable>
                      );
                    })}
                  </View>
                )}

                {/* Matching Users */}
                {!isDeptOnly && filteredUsers.length > 0 && (
                  <View style={{ marginBottom: spacing.md }}>
                    <Text style={[styles.deptUsersSectionTitle, { marginBottom: spacing.xs }]}>
                      Nhân sự tìm thấy ({filteredUsers.length})
                    </Text>
                    {filteredUsers.map((u) => {
                      const selected = isSelected('USER', u.id);
                      const matchingRegionAdmin = regionAdmins.find((ra) => ra.id === u.id);
                      const displayName = matchingRegionAdmin ? matchingRegionAdmin.label : (u.fullName ?? u.userCode);
                      const dept = (u as any).departmentLinks?.[0]?.department || (u as any).department;
                      const branchName = dept?.branch?.name;
                      return (
                        <Pressable
                          key={u.id}
                          style={[styles.assigneeRow, selected && styles.assigneeRowSelected]}
                          onPress={() => toggleTarget('USER', u.id, displayName)}
                        >
                          <View style={styles.assigneeInfo}>
                            <View style={[styles.assigneeAvatar, matchingRegionAdmin && { backgroundColor: colors.primarySoft }]}>
                              <MaterialCommunityIcons
                                name={matchingRegionAdmin ? 'shield-account' : 'account'}
                                size={20}
                                color={matchingRegionAdmin ? colors.primary : colors.muted}
                              />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={[styles.assigneeName, selected && { color: colors.primaryDark, fontWeight: '700' }]}>
                                {u.fullName ?? u.userCode}
                              </Text>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2, flexWrap: 'wrap' }}>
                                {matchingRegionAdmin && (
                                  <View style={styles.regionBadge}>
                                    <Text style={styles.regionBadgeText}>Admin {matchingRegionAdmin.regionName}</Text>
                                  </View>
                                )}
                                {u.userCode ? <Text style={styles.assigneeSubtext}>{u.userCode}</Text> : null}
                                {dept?.name ? <Text style={styles.assigneeSubtext}>• {dept.name}</Text> : null}
                                {branchName ? <Text style={styles.assigneeSubtext}>({branchName})</Text> : null}
                              </View>
                            </View>
                          </View>
                          <MaterialCommunityIcons
                            name={selected ? 'check-circle' : 'circle-outline'}
                            size={24}
                            color={selected ? colors.primary : colors.border}
                          />
                        </Pressable>
                      );
                    })}
                  </View>
                )}

                {/* Matching Region Admins */}
                {canSelectRegionAdmin && filteredRegionAdmins.length > 0 && (
                  <View style={{ marginBottom: spacing.md }}>
                    <Text style={[styles.deptUsersSectionTitle, { marginBottom: spacing.xs }]}>
                      Admin miền ({filteredRegionAdmins.length})
                    </Text>
                    {filteredRegionAdmins.map((item) => {
                      const selected = isSelected('USER', item.id);
                      return (
                        <Pressable
                          key={item.id}
                          style={[styles.treeAdminRow, selected && styles.treeAdminRowSelected]}
                          onPress={() => toggleTarget('USER', item.id, item.label)}
                        >
                          <View style={styles.treeAdminLeft}>
                            <View style={styles.treeAdminIcon}>
                              <MaterialCommunityIcons name="shield-account" size={18} color="#D97706" />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.treeAdminName}>{item.fullName}</Text>
                              <Text style={styles.treeAdminSubtext}>Admin {item.regionName} • {item.userCode}</Text>
                            </View>
                          </View>
                          <MaterialCommunityIcons
                            name={selected ? 'check-circle' : 'circle-outline'}
                            size={22}
                            color={selected ? colors.primary : colors.border}
                          />
                        </Pressable>
                      );
                    })}
                  </View>
                )}

                {filteredUsers.length === 0 && filteredRegionAdmins.length === 0 && filteredDepartments.length === 0 && (
                  <View style={{ padding: spacing.xl, alignItems: 'center' }}>
                    <MaterialCommunityIcons name="account-search-outline" size={44} color={colors.muted} />
                    <Text style={[styles.meta, { textAlign: 'center', marginTop: spacing.sm }]}>
                      Không tìm thấy kết quả nào phù hợp với từ khóa này.
                    </Text>
                  </View>
                )}
              </ScrollView>
            </>
          ) : selectedDept ? (
            /* --- STEP 4: USER LIST OF SELECTED DEPARTMENT --- */
            <>
              <View style={styles.stepNavHeader}>
                {!isLeaderMode ? (
                  <Pressable
                    style={styles.stepBackBtn}
                    onPress={() => {
                      setSelectedDept(null);
                      setDeptUserSearch('');
                    }}
                  >
                    <MaterialCommunityIcons name="arrow-left" size={20} color="#334155" />
                    <Text style={styles.stepBackBtnText}>
                      {selectedBranch ? selectedBranch.name : 'Danh mục'}
                    </Text>
                  </Pressable>
                ) : (
                  <View style={{ flex: 1 }}>
                    <Text style={styles.stepTitle}>Giao việc cho nhân sự</Text>
                    <Text style={styles.stepSubtitle}>{user?.department?.name || selectedDept.name}</Text>
                  </View>
                )}
                <Pressable onPress={onClose}>
                  <MaterialCommunityIcons name="close" size={24} color={colors.text} />
                </Pressable>
              </View>

              {!isLeaderMode && (
                <View style={styles.stepTitleBox}>
                  <Text style={styles.stepTitle}>{selectedDept.name}</Text>
                  <Text style={styles.stepSubtitle}>
                    {selectedBranch ? `${selectedBranch.name} • ` : ''}
                    {selectedRegion ? selectedRegion.name : ''}
                  </Text>
                </View>
              )}

              <SearchInput
                value={deptUserSearch}
                onChangeText={setDeptUserSearch}
                placeholder="Tìm kiếm nhân viên trong phòng..."
              />

              {/* Option to select entire department */}
              {selectedDept.id !== '__UNASSIGNED__' && !isUserOnly && (
                <Pressable
                  style={[
                    styles.deptSelectAllCard,
                    isSelected('DEPARTMENT', selectedDept.id) && styles.deptSelectAllCardActive,
                  ]}
                  onPress={() => toggleTarget('DEPARTMENT', selectedDept.id, selectedDept.name)}
                >
                  <View style={styles.deptSelectAllLeft}>
                    <View
                      style={[
                        styles.deptSelectAllIcon,
                        isSelected('DEPARTMENT', selectedDept.id) && { backgroundColor: '#DCFCE7' },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name="domain"
                        size={20}
                        color={isSelected('DEPARTMENT', selectedDept.id) ? '#16A34A' : colors.primary}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.deptSelectAllTitle}>
                        {isLeaderMode
                          ? `Giao cho toàn bộ nhân sự trong phòng`
                          : `Giao cho toàn bộ ${selectedDept.name}`}
                      </Text>
                      <Text style={styles.deptSelectAllSubtitle}>
                        {isLeaderMode ? 'Giao việc cho tất cả thành viên trong phòng ban của bạn' : 'Giao đồng thời cho cả tập thể phòng ban'}
                      </Text>
                    </View>
                  </View>
                  <MaterialCommunityIcons
                    name={isSelected('DEPARTMENT', selectedDept.id) ? 'check-circle' : 'circle-outline'}
                    size={24}
                    color={isSelected('DEPARTMENT', selectedDept.id) ? '#16A34A' : colors.border}
                  />
                </Pressable>
              )}

              <View style={styles.deptUsersSectionHeader}>
                <Text style={styles.deptUsersSectionTitle}>
                  Danh sách nhân sự ({filteredDeptUsers.length})
                </Text>
                {filteredDeptUsers.length > 0 && (
                  <Pressable
                    onPress={() => {
                      const allSelected = filteredDeptUsers.every((u) => isSelected('USER', u.id));
                      if (allSelected) {
                        const unselectedIds = new Set(filteredDeptUsers.map((u) => u.id));
                        onChange(targets.filter((t) => t.targetType !== 'USER' || !unselectedIds.has(t.targetId)));
                      } else {
                        const newTargets = [...targets];
                        filteredDeptUsers.forEach((u) => {
                          if (!newTargets.some((t) => t.targetType === 'USER' && t.targetId === u.id)) {
                            const name = u.profile?.fullName || u.fullName || u.userCode;
                            newTargets.push({ targetType: 'USER', targetId: u.id, targetName: name } as any);
                          }
                        });
                        onChange(newTargets);
                      }
                    }}
                  >
                    <Text style={styles.deptSelectAllActionText}>
                      {filteredDeptUsers.every((u) => isSelected('USER', u.id)) ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                    </Text>
                  </Pressable>
                )}
              </View>

              <ScrollView style={styles.assigneeList}>
                {filteredDeptUsers.length === 0 ? (
                  <View style={{ padding: spacing.xl, alignItems: 'center' }}>
                    <MaterialCommunityIcons name="account-search-outline" size={44} color={colors.muted} />
                    <Text style={[styles.meta, { textAlign: 'center', marginTop: spacing.sm }]}>
                      {deptUserSearch ? 'Không tìm thấy nhân sự phù hợp' : 'Chưa có nhân sự nào trong phòng ban này.'}
                    </Text>
                  </View>
                ) : (
                  filteredDeptUsers.map((u) => {
                    const selected = isSelected('USER', u.id);
                    const fullName = u.profile?.fullName || u.fullName || u.userCode;
                    const positionName = u.position?.name || 'Nhân viên';
                    return (
                      <Pressable
                        key={u.id}
                        style={[styles.assigneeRow, selected && styles.assigneeRowSelected]}
                        onPress={() => toggleTarget('USER', u.id, fullName)}
                      >
                        <View style={styles.assigneeInfo}>
                          <View style={[styles.assigneeAvatar, selected && { backgroundColor: colors.primarySoft }]}>
                            <MaterialCommunityIcons
                              name="account"
                              size={20}
                              color={selected ? colors.primary : colors.muted}
                            />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text
                              style={[
                                styles.assigneeName,
                                selected && { color: colors.primaryDark, fontWeight: '700' },
                              ]}
                            >
                              {fullName}
                            </Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                              <Text style={styles.assigneeSubtext}>{u.userCode}</Text>
                              <Text style={styles.assigneeSubtext}>• {positionName}</Text>
                            </View>
                          </View>
                        </View>
                        <MaterialCommunityIcons
                          name={selected ? 'check-circle' : 'circle-outline'}
                          size={24}
                          color={selected ? colors.primary : colors.border}
                        />
                      </Pressable>
                    );
                  })
                )}
              </ScrollView>
            </>
          ) : selectedBranch ? (
            /* --- STEP 3: DEPARTMENTS OF SELECTED BRANCH --- */
            <>
              <View style={styles.stepNavHeader}>
                <Pressable
                  style={styles.stepBackBtn}
                  onPress={() => setSelectedBranch(null)}
                >
                  <MaterialCommunityIcons name="arrow-left" size={20} color="#334155" />
                  <Text style={styles.stepBackBtnText}>
                    {selectedRegion ? selectedRegion.name : 'Chi nhánh'}
                  </Text>
                </Pressable>
                <Pressable onPress={onClose}>
                  <MaterialCommunityIcons name="close" size={24} color={colors.text} />
                </Pressable>
              </View>

              <View style={styles.stepTitleBox}>
                <Text style={styles.stepTitle}>{selectedBranch.name}</Text>
                <Text style={styles.stepSubtitle}>
                  {isDeptOnly ? 'Chọn phòng ban nhận việc' : 'Chọn phòng ban hoặc mở xem nhân sự'} • {selectedRegion?.name || ''}
                </Text>
              </View>

              {/* Header Action: Select All / Deselect All Departments */}
              {(currentBranchObj?.departments ?? []).length > 0 && !isUserOnly && (
                <View style={styles.deptUsersSectionHeader}>
                  <Text style={styles.deptUsersSectionTitle}>
                    Phòng ban ({currentBranchObj?.departments.length ?? 0})
                  </Text>
                  <Pressable
                    onPress={() => {
                      const depts = currentBranchObj?.departments ?? [];
                      const allSelected = depts.every((d) => isSelected('DEPARTMENT', d.id));
                      if (allSelected) {
                        const deptIds = new Set(depts.map((d) => d.id));
                        onChange(targets.filter((t) => t.targetType !== 'DEPARTMENT' || !deptIds.has(t.targetId)));
                      } else {
                        const newTargets = [...targets];
                        depts.forEach((d) => {
                          if (!newTargets.some((t) => t.targetType === 'DEPARTMENT' && t.targetId === d.id)) {
                            newTargets.push({ targetType: 'DEPARTMENT', targetId: d.id, targetName: d.name } as any);
                          }
                        });
                        onChange(newTargets);
                      }
                    }}
                  >
                    <Text style={styles.deptSelectAllActionText}>
                      {(currentBranchObj?.departments ?? []).every((d) => isSelected('DEPARTMENT', d.id))
                        ? 'Bỏ chọn tất cả'
                        : 'Tích chọn tất cả'}
                    </Text>
                  </Pressable>
                </View>
              )}

              <ScrollView style={styles.assigneeList}>
                {(currentBranchObj?.departments ?? []).length === 0 ? (
                  <View style={{ padding: spacing.xl, alignItems: 'center' }}>
                    <MaterialCommunityIcons name="domain-off" size={44} color={colors.muted} />
                    <Text style={[styles.meta, { textAlign: 'center', marginTop: spacing.sm }]}>
                      Chưa có phòng ban nào thuộc chi nhánh này.
                    </Text>
                  </View>
                ) : (
                  (currentBranchObj?.departments ?? []).map((d) => {
                    const { isEntire, selectedUsers, total } = getSelectedCountInDept(d.id);
                    const userCount = usersByDeptId.get(d.id)?.length ?? 0;

                    if (isDeptOnly) {
                      return (
                        <Pressable
                          key={d.id}
                          style={[styles.stepCard, isEntire && styles.stepCardSelected]}
                          onPress={() => toggleTarget('DEPARTMENT', d.id, d.name)}
                        >
                          <View style={styles.stepCardLeft}>
                            <View style={[styles.stepCardIcon, { backgroundColor: isEntire ? '#DCFCE7' : '#EFF6FF' }]}>
                              <MaterialCommunityIcons
                                name="domain"
                                size={22}
                                color={isEntire ? '#16A34A' : '#2563EB'}
                              />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={[styles.stepCardTitle, isEntire && { color: '#15803D', fontWeight: '800' }]}>
                                {d.name}
                              </Text>
                              <Text style={styles.stepCardSubtitle}>
                                {userCount} nhân sự trực thuộc
                              </Text>
                            </View>
                          </View>
                          <MaterialCommunityIcons
                            name={isEntire ? 'checkbox-marked' : 'checkbox-blank-outline'}
                            size={24}
                            color={isEntire ? '#16A34A' : colors.muted}
                          />
                        </Pressable>
                      );
                    }

                    return (
                      <View
                        key={d.id}
                        style={[styles.stepCard, (isEntire || total > 0) && styles.stepCardSelected]}
                      >
                        {!isUserOnly && (
                          <Pressable
                            style={styles.deptCheckboxTouch}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            onPress={() => toggleTarget('DEPARTMENT', d.id, d.name)}
                          >
                            <MaterialCommunityIcons
                              name={isEntire ? 'checkbox-marked' : 'checkbox-blank-outline'}
                              size={24}
                              color={isEntire ? '#16A34A' : colors.muted}
                            />
                          </Pressable>
                        )}

                        <Pressable
                          style={styles.stepCardContentPressable}
                          onPress={() => {
                            setSelectedDept({ id: d.id, name: d.name });
                            setDeptUserSearch('');
                          }}
                        >
                          <View style={[styles.stepCardIcon, { backgroundColor: isEntire ? '#DCFCE7' : '#F1F5F9' }]}>
                            <MaterialCommunityIcons
                              name={area === 'leader' ? 'account-tie' : 'domain'}
                              size={22}
                              color={isEntire ? '#16A34A' : total > 0 ? colors.primary : colors.muted}
                            />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.stepCardTitle, isEntire && { color: '#15803D', fontWeight: '800' }]}>
                              {d.name}
                            </Text>
                            <Text style={styles.stepCardSubtitle}>
                              {userCount} nhân sự {isEntire ? '• Cả phòng được giao' : ''}
                            </Text>
                          </View>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            {isEntire ? (
                              <View style={[styles.treeCountBadge, { backgroundColor: '#DCFCE7' }]}>
                                <Text style={[styles.treeCountBadgeText, { color: '#15803D' }]}>Cả phòng</Text>
                              </View>
                            ) : selectedUsers > 0 ? (
                              <View style={styles.treeCountBadge}>
                                <Text style={styles.treeCountBadgeText}>{selectedUsers} NV</Text>
                              </View>
                            ) : null}
                            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.muted} />
                          </View>
                        </Pressable>
                      </View>
                    );
                  })
                )}
              </ScrollView>
            </>
          ) : selectedRegion ? (
            /* --- STEP 2: BRANCHES OF SELECTED REGION --- */
            <>
              <View style={styles.stepNavHeader}>
                {departmentTree.length > 1 ? (
                  <Pressable
                    style={styles.stepBackBtn}
                    onPress={() => setSelectedRegion(null)}
                  >
                    <MaterialCommunityIcons name="arrow-left" size={20} color="#334155" />
                    <Text style={styles.stepBackBtnText}>Tất cả miền</Text>
                  </Pressable>
                ) : (
                  <View />
                )}
                <Pressable onPress={onClose}>
                  <MaterialCommunityIcons name="close" size={24} color={colors.text} />
                </Pressable>
              </View>

              <View style={styles.stepTitleBox}>
                <Text style={styles.stepTitle}>{selectedRegion.name}</Text>
                <Text style={styles.stepSubtitle}>Chọn cơ sở / chi nhánh nhận việc</Text>
              </View>

              <ScrollView style={styles.assigneeList}>
                {/* Admin Miền Golden Card */}
                {canSelectRegionAdmin && (
                  <>
                    {regionAdmins
                      .filter((ra) => ra.regionId === selectedRegion.id)
                      .map((ra) => {
                        const selected = isSelected('USER', ra.id);
                        return (
                          <Pressable
                            key={ra.id}
                            style={[styles.treeAdminRow, selected && styles.treeAdminRowSelected, { marginBottom: spacing.md }]}
                            onPress={() => toggleTarget('USER', ra.id, ra.label)}
                          >
                            <View style={styles.treeAdminLeft}>
                              <View style={styles.treeAdminIcon}>
                                <MaterialCommunityIcons name="shield-account" size={20} color="#D97706" />
                              </View>
                              <View style={{ flex: 1 }}>
                                <Text style={styles.treeAdminName}>Giao cho Admin {ra.regionName}</Text>
                                <Text style={styles.treeAdminSubtext}>{ra.fullName} • {ra.userCode}</Text>
                              </View>
                            </View>
                            <MaterialCommunityIcons
                              name={selected ? 'check-circle' : 'circle-outline'}
                              size={24}
                              color={selected ? colors.primary : colors.border}
                            />
                          </Pressable>
                        );
                      })}
                  </>
                )}

                {/* Branches List */}
                {(currentRegionObj?.branches ?? []).length === 0 ? (
                  <View style={{ padding: spacing.xl, alignItems: 'center' }}>
                    <MaterialCommunityIcons name="office-building-outline" size={44} color={colors.muted} />
                    <Text style={[styles.meta, { textAlign: 'center', marginTop: spacing.sm }]}>
                      Chưa có chi nhánh nào trực thuộc {selectedRegion.name}.
                    </Text>
                  </View>
                ) : (
                  (currentRegionObj?.branches ?? []).map((b) => {
                    const selectedCountInBranch = getSelectedCountInBranch(b);

                    return (
                      <Pressable
                        key={b.id}
                        style={[styles.stepCard, selectedCountInBranch > 0 && styles.stepCardSelected]}
                        onPress={() => setSelectedBranch({ id: b.id, name: b.name })}
                      >
                        <View style={styles.stepCardLeft}>
                          <View style={[styles.stepCardIcon, { backgroundColor: '#F0F9FF' }]}>
                            <MaterialCommunityIcons name="office-building-outline" size={22} color="#0284C7" />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.stepCardTitle, selectedCountInBranch > 0 && { color: colors.primaryDark }]}>
                              {b.name}
                            </Text>
                            <Text style={styles.stepCardSubtitle}>{b.departments.length} phòng ban</Text>
                          </View>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          {selectedCountInBranch > 0 && (
                            <View style={styles.treeCountBadge}>
                              <Text style={styles.treeCountBadgeText}>{selectedCountInBranch} đã chọn</Text>
                            </View>
                          )}
                          <MaterialCommunityIcons name="chevron-right" size={24} color={colors.muted} />
                        </View>
                      </Pressable>
                    );
                  })
                )}
              </ScrollView>
            </>
          ) : (
            /* --- STEP 1: REGIONS BUTTONS --- */
            <>
              <View style={styles.stepNavHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stepTitle}>Chọn người nhận việc</Text>
                  <Text style={styles.stepSubtitle}>Chọn vùng miền nhận việc</Text>
                </View>
                <Pressable onPress={onClose}>
                  <MaterialCommunityIcons name="close" size={24} color={colors.text} />
                </Pressable>
              </View>

              <SearchInput
                value={searchKeyword}
                onChangeText={setSearchKeyword}
                placeholder="Tìm kiếm miền, cơ sở, phòng ban hoặc tên NV..."
              />

              <ScrollView style={[styles.assigneeList, { marginTop: spacing.md }]}>
                {departmentTree.map((r) => {
                  const selectedCountInRegion = getSelectedCountInRegion(r);
                  const totalDeptsInRegion = r.branches.reduce((sum, b) => sum + b.departments.length, 0);

                  return (
                    <Pressable
                      key={r.id}
                      style={[styles.stepCard, selectedCountInRegion > 0 && styles.stepCardSelected]}
                      onPress={() => setSelectedRegion({ id: r.id, name: r.name })}
                    >
                      <View style={styles.stepCardLeft}>
                        <View style={[styles.stepCardIcon, { backgroundColor: '#EFF6FF' }]}>
                          <MaterialCommunityIcons name="earth" size={24} color="#2563EB" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.stepCardTitle, selectedCountInRegion > 0 && { color: colors.primaryDark }]}>
                            {r.name}
                          </Text>
                          <Text style={styles.stepCardSubtitle}>
                            {r.branches.length > 0
                              ? `${r.branches.length} chi nhánh • ${totalDeptsInRegion} phòng ban`
                              : 'Chưa có chi nhánh'}
                          </Text>
                        </View>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        {selectedCountInRegion > 0 && (
                          <View style={styles.treeCountBadge}>
                            <Text style={styles.treeCountBadgeText}>{selectedCountInRegion} đã chọn</Text>
                          </View>
                        )}
                        <MaterialCommunityIcons name="chevron-right" size={24} color={colors.muted} />
                      </View>
                    </Pressable>
                  );
                })}

                {/* Unassigned users card */}
                {usersByDeptId.has('__UNASSIGNED__') && (usersByDeptId.get('__UNASSIGNED__')?.length ?? 0) > 0 && (
                  <Pressable
                    style={styles.stepCard}
                    onPress={() => {
                      setSelectedDept({ id: '__UNASSIGNED__', name: 'Nhân sự chưa phân phòng ban' });
                      setDeptUserSearch('');
                    }}
                  >
                    <View style={styles.stepCardLeft}>
                      <View style={[styles.stepCardIcon, { backgroundColor: '#F1F5F9' }]}>
                        <MaterialCommunityIcons name="account-group-outline" size={22} color="#475569" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.stepCardTitle}>Nhân sự chưa phân phòng ban</Text>
                        <Text style={styles.stepCardSubtitle}>
                          {usersByDeptId.get('__UNASSIGNED__')?.length ?? 0} nhân sự độc lập
                        </Text>
                      </View>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={24} color={colors.muted} />
                  </Pressable>
                )}
              </ScrollView>
            </>
          )}

          {/* Fixed Footer */}
          <View style={styles.assigneeFooter}>
            <PrimaryButton onPress={onClose}>
              Hoàn tất ({targets.length})
            </PrimaryButton>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function departmentIdFromUser(user: ReturnType<typeof useAuth>['user']): string | undefined {
  if (user?.roles?.includes('ADMIN') || user?.roles?.includes('HR')) return undefined;
  return user?.department?.id;
}

function averageProgress(task: TaskDto): number {
  const assignments = task.assignments ?? [];
  if (!assignments.length) return 0;
  return assignments.reduce((sum, assignment) => sum + assignment.progressPercent, 0) / assignments.length;
}

const styles = StyleSheet.create({
  body: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  content: {
    gap: spacing.lg,
    padding: spacing.lg,
  },
  inlinePanel: {
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md,
  },
  meta: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  targetRow: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  titleText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  warning: {
    color: colors.warning,
    fontSize: 13,
    fontWeight: '700',
  },
  fieldLabel: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: spacing.xs, marginTop: spacing.sm },
  fieldGroup: { marginBottom: spacing.md },
  priorityWrap: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap', marginBottom: spacing.md },
  priorityPill: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: '#fff' },
  priorityPillActive: { backgroundColor: '#1C1C1E', borderColor: '#1C1C1E' },
  priorityText: { fontSize: 13, fontWeight: '500', color: colors.text },
  priorityTextActive: { color: '#fff', fontWeight: '700' },
  splitDateRow: { flexDirection: 'row', gap: spacing.sm, marginTop: 4 },
  splitDatePickerBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: 12, paddingVertical: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 8, backgroundColor: '#fff' },
  dateRow: { flexDirection: 'row', gap: spacing.md },
  dateCol: { flex: 1 },
  datePickerBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: 8, backgroundColor: colors.background },
  dateText: { fontSize: 14, color: colors.text },
  datePlaceholder: { fontSize: 14, color: colors.muted },
  
  targetTagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  targetTag: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.primarySoft, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  targetTagText: { fontSize: 13, fontWeight: '600', color: colors.primaryDark },
  addTargetBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: colors.primary, borderStyle: 'dashed' },
  addTargetBtnText: { fontSize: 13, fontWeight: '600', color: colors.primary },

  selectorField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginTop: 4,
  },
  selectorFieldContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectorFieldText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  selectorFieldPlaceholder: {
    fontSize: 14,
    color: colors.muted,
  },
  selectorFieldSub: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  assigneeModalContent: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '85%', padding: spacing.lg },
  assigneeModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  assigneeModalTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  assigneeTabs: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  assigneeTab: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  assigneeTabActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  assigneeTabText: { fontSize: 14, fontWeight: '600', color: colors.muted },
  assigneeTabTextActive: { color: colors.primaryDark },
  assigneeList: { flex: 1 },
  assigneeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  assigneeRowSelected: { backgroundColor: '#F0FDF4' },
  assigneeInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  assigneeAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  assigneeName: { fontSize: 15, fontWeight: '600', color: colors.text },
  assigneeSubtext: { fontSize: 12, color: colors.muted },
  regionBadge: { backgroundColor: colors.primarySoft, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  regionBadgeText: { fontSize: 11, fontWeight: '700', color: colors.primaryDark },
  assigneeFooter: { paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },

  /* Department User Detail View Styles */
  deptDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  deptDetailBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
  },
  deptDetailBackText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  deptDetailTitleBox: {
    marginBottom: spacing.sm,
    marginTop: 4,
  },
  deptDetailTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  deptDetailSubtitle: {
    fontSize: 13,
    color: colors.muted,
    marginTop: 2,
  },
  deptSelectAllCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  deptSelectAllCardActive: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
  },
  deptSelectAllLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  deptSelectAllIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deptSelectAllTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  deptSelectAllSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  deptUsersSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
    marginTop: spacing.xs,
    paddingHorizontal: 4,
  },
  deptUsersSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  deptSelectAllActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },

  /* Admin Miền in tree */
  treeAdminRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginTop: 6,
    marginBottom: 4,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  treeAdminRowSelected: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  treeAdminLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  treeAdminIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  treeAdminName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
  },
  treeAdminSubtext: {
    fontSize: 11,
    color: '#B45309',
    marginTop: 1,
  },

  /* Step Drilldown Navigation Styles */
  stepNavHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  stepBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
  },
  stepBackBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  stepTitleBox: {
    marginBottom: spacing.sm,
    marginTop: 4,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  stepSubtitle: {
    fontSize: 13,
    color: colors.muted,
    marginTop: 2,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: spacing.sm,
  },
  stepCardSelected: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
  },
  deptCheckboxTouch: {
    paddingRight: 8,
    paddingVertical: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCardContentPressable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  stepCardIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  stepCardSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },

  /* Tree Hierarchy Styles */
  treeRegionBlock: {
    marginBottom: spacing.sm,
  },
  treeRegionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  treeRegionHeaderExpanded: {
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    borderColor: '#CBD5E1',
  },
  treeRegionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  treeRegionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  treeRegionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  treeRegionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  treeBranchContainer: {
    marginLeft: 12,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: '#E2E8F0',
    paddingTop: 4,
  },
  treeBranchBlock: {
    marginTop: 4,
  },
  treeBranchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#EDF2F7',
  },
  treeBranchHeaderExpanded: {
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    borderColor: '#CBD5E1',
  },
  treeBranchLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  treeBranchIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  treeBranchTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  treeBranchSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  treeDeptContainer: {
    marginLeft: 12,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: '#CBD5E1',
    paddingVertical: 2,
  },
  treeDeptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginTop: 4,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  treeDeptRowSelected: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
  },
  treeDeptLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  treeDeptIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  treeDeptName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  treeDeptSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  treeCountBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  treeCountBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },
  
  // Date Picker Modal
  pickerModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  pickerModalContent: { backgroundColor: colors.background, borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingBottom: 24 },
  pickerModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  pickerModalTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  pickerModalDone: { fontSize: 16, fontWeight: '600', color: colors.primary },
  
  // Scope Selector
  scopeContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
    marginBottom: spacing.sm,
    gap: 4,
  },
  scopeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 9,
    borderRadius: 9,
    backgroundColor: 'transparent',
  },
  scopeBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  scopeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  scopeTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  scopeCountBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
  },
  scopeCountBadgeActive: {
    backgroundColor: colors.primarySoft,
  },
  scopeCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  scopeCountTextActive: {
    color: colors.primary,
  },
  
  // List UI
  actionRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.sm, marginTop: spacing.xs },
  actionBtnPrimary: { flex: 1, backgroundColor: '#1C1C1E', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 8, gap: 8 },
  actionBtnTextPrimary: { color: '#fff', fontSize: 14, fontWeight: '700' },
  actionBtnSecondary: { flex: 1, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 8, gap: 8, borderWidth: 1, borderColor: colors.border },
  actionBtnTextSecondary: { color: colors.text, fontSize: 14, fontWeight: '700' },
  tabsContainer: { marginHorizontal: -spacing.lg, marginBottom: spacing.md, marginTop: spacing.xs },
  tabsScroll: { paddingHorizontal: spacing.lg, gap: spacing.xs },
  tabPill: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 18, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border },
  tabPillActive: { backgroundColor: '#1C1C1E', borderColor: '#1C1C1E' },
  tabText: { fontSize: 13, fontWeight: '600', color: colors.muted },
  tabTextActive: { color: '#fff' },
  
  heroCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    padding: spacing.lg,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  heroCode: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '600',
  },
  heroDates: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  dateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaSmall: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '500',
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
  },
  chatButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },

  /* Department Badge Pill */
  departmentBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  departmentBadgePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E40AF',
  },

  /* Reception Card Box */
  receptionCardBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: 8,
  },
  receptionCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E3A8A',
    textAlign: 'center',
  },
  receptionCardDesc: {
    fontSize: 12,
    color: '#3B82F6',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.xs,
  },

  /* Subtasks Progress Header & Empty Box */
  subtasksProgressHeader: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  subtasksProgressTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  subtasksProgressLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  subtasksProgressValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  emptySubtasksBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: spacing.md,
    gap: 6,
  },
  emptySubtasksTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginTop: 4,
  },
  emptySubtasksDesc: {
    fontSize: 12,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 18,
  },
  subtaskActionGroup: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },

  /* Parent Task Banner in CreateTaskScreen */
  parentTaskBanner: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  parentTaskTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  parentTaskTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  parentTaskTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 20,
  },
  parentTaskSubInfo: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 4,
  },

  /* Assignment Mode Segments & Cards */
  modeSegmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
    marginBottom: spacing.md,
    gap: 4,
  },
  modeSegmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 9,
    borderRadius: 9,
    backgroundColor: 'transparent',
  },
  modeSegmentBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  modeSegmentText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  modeSegmentTextActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  modeInfoCard: {
    borderRadius: 10,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderLeftWidth: 4,
  },
  modeInfoCardDept: {
    borderLeftColor: '#2563EB',
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  modeInfoCardUser: {
    borderLeftColor: '#059669',
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  modeInfoCardGroup: {
    borderLeftColor: '#7C3AED',
    backgroundColor: '#F5F3FF',
    borderColor: '#DDD6FE',
  },
  modeInfoTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  modeInfoTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  modeInfoDesc: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
  },
  groupLeaderTag: {
    backgroundColor: '#EDE9FE',
    borderColor: '#C4B5FD',
  },
});

