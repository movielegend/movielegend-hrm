import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCompleteTask } from '../../hooks/useTasks';
import { useMemo, useState, useEffect } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, View, Pressable, Modal, Platform, Switch } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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
import { SearchInput } from '../../components/SearchInput';
import { SectionCard } from '../../components/SectionCard';
import { useDepartments } from '../../hooks/useDepartments';
import { useScopedEmployees } from '../../hooks/useEmployees';
import { useTaskGroups } from '../../hooks/useTaskGroups';
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
  CommentComposer,
  CommentList,
  ExtensionList,
  ExtensionRequestModal,
  PriorityBadge,
  ProgressBar,
  ReviewActionSheet,
  TargetPreview,
  TaskCard,
  TaskStatusBadge,
  TaskTimeline,
} from './TaskComponents';
import { canAcceptAssignment, canStartAssignment, canSubmitAssignment, canUpdateProgress, mapTaskError, myAssignment, canCancelTask, isReadOnlyStatus } from './task.logic';

type TaskArea = 'employee' | 'leader' | 'admin';

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
  { label: 'Hoàn thành', value: 'COMPLETED' },
  { label: 'Làm lại', value: 'REJECTED' },
  { label: 'Đã hủy', value: 'CANCELLED' },
];

export function TaskListScreen({ area }: { area: TaskArea }) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const filters: TaskListFilters = { page: 1, limit: 20, ...(search ? { search } : {}), ...(status ? { status: status as never } : {}) };
  const tasks = area === 'employee' ? useMyTasks(filters) : useTasks(filters);
  const createRoute = area === 'employee' ? null : `/${area}/tasks/create`;
  const reviewRoute = area === 'employee' ? null : `/${area}/tasks/review`;

  const title = area === 'employee' ? 'Công việc của tôi' : area === 'leader' ? 'Công việc phòng ban' : 'Tất cả Công việc';

  return (
    <Screen>
      <ScreenContainer refreshControl={<RefreshControl refreshing={tasks.isRefetching} onRefresh={() => void tasks.refetch()} />}>
        <PageHeader title={title} subtitle="Quản lý và theo dõi tiến độ công việc" />
        
        <SearchInput value={search} onChangeText={setSearch} placeholder="Tìm kiếm công việc..." />
        
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
        {!tasks.isLoading && !tasks.data?.items?.length ? <EmptyState title="Chưa có công việc nào" /> : null}
        {tasks.data?.items?.map((task) => (
          <TaskCard key={task.id} task={task} onPress={() => router.push(`/${area}/tasks/${task.id}`)} />
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
  const canReview = hasAnyPermission(user, ['task.review_all', 'task.review_department']);
  const canReviewExtension = hasAnyPermission(user, ['task.extension_review_all', 'task.extension_review_department']);

  if (task.isLoading) return <LoadingState label="Dang tai task" />;
  if (task.isError) return <ErrorState error={task.error} onRetry={() => void task.refetch()} />;
  if (!task.data) return <EmptyState title="Khong tim thay task" />;
  const item = task.data;
  
  const isSelfAssigned = (entry: any) => entry.userId !== user?.id || entry.assignedByUserId === user?.id;
  
  const reviewAssignments = item.assignments?.filter((entry) => entry.status === 'WAITING_REVIEW' && isSelfAssigned(entry)) ?? [];
  const pendingExtensions = item.extensionRequests?.filter((entry) => {
    if (entry.status !== 'PENDING') return false;
    const relatedAssignment = item.assignments?.find(a => a.id === entry.assignmentId);
    return relatedAssignment ? isSelfAssigned(relatedAssignment) : true;
  }) ?? [];

  async function run(action: () => Promise<unknown>, success: string) {
    try {
      await action();
      Alert.alert('Thanh cong', success);
    } catch (error) {
      const normalized = normalizeApiError(error);
      Alert.alert(normalized.code, mapTaskError(normalized.code, normalized.message));
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
                  Alert.alert('Xác nhận hủy', 'Bạn có chắc chắn muốn hủy công việc này?', [
                    { text: 'Không', style: 'cancel' },
                    { text: 'Có, Hủy', onPress: () => run(() => cancel.mutateAsync(), 'Đã hủy công việc'), style: 'destructive' },
                  ]);
                }}
              >
                Hủy công việc
              </SecondaryButton>
            </View>
          ) : null}
        </View>

        <TargetPreview task={item} />

        {assignment ? (
          <SectionCard title="Nhiệm vụ của tôi">
            <TaskStatusBadge status={assignment.status} />
            {!isReadOnlyStatus(item.status) ? (
              <>
                {canAcceptAssignment(assignment.status) ? <PrimaryButton loading={accept.isPending} onPress={() => void run(() => accept.mutateAsync(assignment.id), 'Đã nhận việc')}>Nhận việc</PrimaryButton> : null}
                {canStartAssignment(assignment.status) ? <PrimaryButton loading={start.isPending} onPress={() => void run(() => start.mutateAsync(assignment.id), 'Đã bắt đầu làm')}>Bắt đầu làm</PrimaryButton> : null}
                {canUpdateProgress(assignment.status) ? (
                  <>
                    <FormField label="Tiến độ (0-100%)" value={progress} onChangeText={setProgress} keyboardType="number-pad" />
                    <SecondaryButton
                      loading={updateProgress.isPending}
                      onPress={() => void run(() => updateProgress.mutateAsync({ assignmentId: assignment.id, payload: { progressPercent: Number(progress) } }), 'Đã cập nhật tiến độ')}
                    >
                      Cập nhật tiến độ
                    </SecondaryButton>
                  </>
                ) : null}
                {canSubmitAssignment(assignment.status) ? (
                  <>
                    <FormField label="Ghi chú hoàn thành" value={completionNote} onChangeText={setCompletionNote} multiline />
                    <PrimaryButton
                      loading={submit.isPending}
                      onPress={() => void run(() => submit.mutateAsync({ assignmentId: assignment.id, payload: { completionNote } }), 'Đã nộp công việc')}
                    >
                      Nộp công việc
                    </PrimaryButton>
                  </>
                ) : null}
                <ExtensionRequestModal
                  currentDueAt={assignment.assignmentDueAt ?? item.dueAt}
                  pending={extension.isPending}
                  onSubmit={(requestedDueAt, reason) => run(() => extension.mutateAsync({ assignmentId: assignment.id, requestedDueAt, reason }), 'Đã gửi yêu cầu gia hạn')}
                />
              </>
            ) : null}
          </SectionCard>
        ) : null}

        {(item.childTasks ?? []).length > 0 ? (
          <SectionCard title="Công việc con (Subtasks)">
            {(item.childTasks ?? []).map((child: any) => (
              <Pressable key={child.id} style={[styles.inlinePanel, { flexDirection: 'column', alignItems: 'flex-start' }]} onPress={() => router.push(`/${area}/tasks/${child.id}`)}>
                <View style={{ flexDirection: 'row', width: '100%', alignItems: 'center' }}>
                  <Text style={[styles.titleText, { flex: 1 }]}>{child.title}</Text>
                  <TaskStatusBadge status={child.status} />
                </View>
                <Text style={styles.metaSmall}>{child.taskCode}</Text>
              </Pressable>
            ))}
          </SectionCard>
        ) : null}

        {item.groupLeaderId === user?.id && item.status !== 'COMPLETED' ? (
          <SectionCard title="Quản lý Nhóm (Leader)">
            <SecondaryButton onPress={() => router.push(`/${area}/tasks/create?parentTaskId=${item.id}`)}>
              + Thêm công việc con
            </SecondaryButton>
            <View style={{ marginTop: spacing.md }}>
              <PrimaryButton 
                loading={completeTask.isPending}
                onPress={() => void run(() => completeTask.mutateAsync(), 'Đã hoàn thành công việc nhóm')}
              >
                Hoàn thành Task Nhóm
              </PrimaryButton>
            </View>
          </SectionCard>
        ) : null}

        {canReview ? (
          <SectionCard title="Xét duyệt công việc">
            {!reviewAssignments.length ? (
              <EmptyState small icon="check-all" title="Không có yêu cầu" message="Không có công việc nào đang chờ duyệt." />
            ) : null}
            {reviewAssignments.map((entry) => (
              <View key={entry.id} style={styles.inlinePanel}>
                <Text style={styles.titleText}>{entry.user?.profile?.fullName ?? entry.user?.userCode ?? entry.userId}</Text>
                <ProgressBar value={entry.progressPercent} />
                <ReviewActionSheet
                  pending={review.isPending}
                  onApprove={(note) => run(() => review.mutateAsync({ assignmentId: entry.id, action: 'approve', payload: note ? { note } : {} }), 'Đã duyệt')}
                  onReject={(note) => run(() => review.mutateAsync({ assignmentId: entry.id, action: 'reject', payload: { note } }), 'Đã từ chối')}
                />
              </View>
            ))}
          </SectionCard>
        ) : null}

        {canReviewExtension ? (
          <SectionCard title="Xét duyệt gia hạn">
            {!pendingExtensions.length ? (
              <EmptyState small icon="calendar-check-outline" title="Không có yêu cầu" message="Không có yêu cầu gia hạn nào đang chờ duyệt." />
            ) : null}
            {pendingExtensions.map((entry) => (
              <View key={entry.id} style={styles.inlinePanel}>
                <Text style={styles.titleText}>{formatDateTime(entry.requestedDueAt)}</Text>
                <Text style={styles.body}>{entry.reason}</Text>
                <ReviewActionSheet
                  pending={extensionReview.isPending}
                  onApprove={() => run(() => extensionReview.mutateAsync({ id: entry.id, action: 'approve' }), 'Đã duyệt gia hạn')}
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

        <SectionCard title="Tệp đính kèm">
          <AttachmentList 
            attachments={item.attachments} 
            canDelete={(attachmentId) => {
              const att = item.attachments?.find(a => a.id === attachmentId);
              return hasAnyPermission(user, ['task.assign_any']) || item.groupLeaderId === user?.id || att?.uploadedByUserId === user?.id;
            }}
            onDeleteAttachment={(attachmentId) => run(() => deleteAttachment.mutateAsync(attachmentId), 'Đã xoá tài liệu')}
          />
          <AttachmentPicker pending={attachment.isPending} onAttach={(payload) => attachment.mutateAsync(payload).then(() => undefined)} />
        </SectionCard>

        <SectionCard title="Lịch sử hoạt động">
          {timeline.isLoading ? <LoadingState label="Đang tải lịch sử" /> : null}
          {timeline.isError ? <ErrorState error={timeline.error} onRetry={() => void timeline.refetch()} /> : null}
          <TaskTimeline items={timeline.data?.items ?? item.histories} />
        </SectionCard>

        <SectionCard title="Danh sách yêu cầu gia hạn">
          <ExtensionList extensions={item.extensionRequests} />
        </SectionCard>
      </ScrollView>
    </Screen>
  );
}

function ActionDatePicker({ 
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
  const { user } = useAuth();
  const mutation = useCreateTask();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('NORMAL');
  
  const [startAt, setStartAt] = useState<Date | null>(null);
  const [dueAt, setDueAt] = useState<Date | null>(null);
  
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);
  
  const [departmentContextId, setDepartmentContextId] = useState(user?.department?.id ?? '');
  const [attachments, setAttachments] = useState<import('../../types/task.types').CreateTaskAttachmentPayload[]>([]);
  const [targets, setTargets] = useState<CreateTaskTargetPayload[]>([]);
  const [targetModalVisible, setTargetModalVisible] = useState(false);
  
  const [isAdhocGroup, setIsAdhocGroup] = useState(false);
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [leaderId, setLeaderId] = useState<string>('');
  const [memberModalVisible, setMemberModalVisible] = useState(false);
  
  const departmentId = departmentContextId || user?.department?.id;
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
    const payload: CreateTaskPayload = {
      title,
      description,
      priority,
      ...(departmentContextId ? { departmentContextId } : {}),
      ...(startAt ? { startAt: startAt.toISOString() } : {}),
      ...(dueAt ? { dueAt: dueAt.toISOString() } : {}),
      ...(parentTaskId ? { parentTaskId } : {}),
      isAdhocGroup,
      ...(isAdhocGroup ? { memberIds, leaderId } : { targets: targets.map(t => ({ targetType: t.targetType, targetId: t.targetId })) }),
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
      
      Alert.alert('Thành công', 'Đã giao việc thành công!');
      router.back();
    } catch (error) {
      const normalized = normalizeApiError(error);
      Alert.alert(normalized.code, mapTaskError(normalized.code, normalized.message));
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

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <PageHeader title={area === 'admin' ? 'Giao việc (Admin)' : 'Giao việc (Leader)'} subtitle="Tạo và phân công công việc mới" />
        
        <SectionCard title="Thông tin công việc">
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

        <SectionCard title="Người nhận việc (Assignees)">
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md }}>
            <Text style={[styles.fieldLabel, { flex: 1, marginBottom: 0 }]}>Tạo nhóm tùy chỉnh (Ad-hoc Group)</Text>
            <Switch value={isAdhocGroup} onValueChange={setIsAdhocGroup} trackColor={{ true: colors.primary }} />
          </View>

          {isAdhocGroup ? (
            <View>
              <Text style={styles.fieldLabel}>Thành viên nhóm</Text>
              <View style={styles.targetTagsWrap}>
                {selectedMembers.map(m => (
                  <View key={m.id} style={styles.targetTag}>
                    <MaterialCommunityIcons name="account" size={16} color={colors.primaryDark} />
                    <Text style={styles.targetTagText}>{m.label}</Text>
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

              {memberIds.length > 0 && (
                <View style={{ marginTop: spacing.md }}>
                  <Text style={styles.fieldLabel}>Chọn nhóm trưởng (Leader)</Text>
                  <View style={styles.targetTagsWrap}>
                    {selectedMembers.map(m => (
                      <Pressable 
                        key={m.id} 
                        style={[styles.targetTag, leaderId === m.id && { backgroundColor: colors.primary }]}
                        onPress={() => setLeaderId(m.id)}
                      >
                        <Text style={[styles.targetTagText, leaderId === m.id && { color: '#fff' }]}>
                          {m.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}
            </View>
          ) : (
            <View>
              <View style={styles.targetTagsWrap}>
                {targets.map((target: any) => (
                  <View key={target.targetId} style={styles.targetTag}>
                    <MaterialCommunityIcons 
                      name={target.targetType === 'USER' ? 'account' : target.targetType === 'DEPARTMENT' ? 'domain' : 'account-group'} 
                      size={16} color={colors.primaryDark} 
                    />
                    <Text style={styles.targetTagText}>{target.targetName ?? `${target.targetType}: ${target.targetId.substring(0,6)}...`}</Text>
                    <Pressable onPress={() => removeTarget(target)}>
                      <MaterialCommunityIcons name="close-circle" size={16} color={colors.muted} />
                    </Pressable>
                  </View>
                ))}
                <Pressable style={styles.addTargetBtn} onPress={() => setTargetModalVisible(true)}>
                  <MaterialCommunityIcons name="plus" size={20} color={colors.primary} />
                  <Text style={styles.addTargetBtnText}>Thêm người nhận</Text>
                </Pressable>
              </View>
              {!targets.length && <Text style={styles.meta}>Chưa có ai được giao việc.</Text>}
            </View>
          )}
        </SectionCard>

        <PrimaryButton 
          loading={mutation.isPending} 
          disabled={title.trim().length < 3 || (isAdhocGroup ? (memberIds.length === 0 || !leaderId) : targets.length === 0)} 
          onPress={() => void submit()}
        >
          Giao việc ngay
        </PrimaryButton>
      </ScrollView>
      
      <AssigneeSelectorModal
        area={area}
        visible={targetModalVisible}
        onClose={() => setTargetModalVisible(false)}
        targets={targets}
        onChange={setTargets}
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

export function TaskReviewQueueScreen({ area }: { area: 'leader' | 'admin' }) {
  const router = useRouter();
  const queue = useTaskReviewQueue({ page: 1, limit: 20 });
  const extensions = usePendingTaskExtensions({ page: 1, limit: 20 });
  const review = useReviewTaskAssignment();
  const extensionReview = useReviewTaskExtension();
  async function run(action: () => Promise<unknown>, success: string) {
    try {
      await action();
      Alert.alert('Thanh cong', success);
    } catch (error) {
      const normalized = normalizeApiError(error);
      Alert.alert(normalized.code, mapTaskError(normalized.code, normalized.message));
    }
  }
  return (
    <Screen>
      <ScreenContainer refreshControl={<RefreshControl refreshing={queue.isRefetching || extensions.isRefetching} onRefresh={() => { void queue.refetch(); void extensions.refetch(); }} />}>
        <PageHeader title="Task Review" subtitle="Queue dung /task-assignments/review-queue va /task-extensions/pending." />
        {queue.isLoading ? <LoadingState /> : null}
        {queue.isError ? <ErrorState error={queue.error} onRetry={() => void queue.refetch()} /> : null}
        {queue.data?.items?.map((item) => (
          <SectionCard key={item.assignmentId}>
            <Text style={styles.titleText}>{item.taskTitle}</Text>
            <Text style={styles.meta}>{item.taskCode} - {item.employee.fullName ?? item.employee.userCode}</Text>
            <ProgressBar value={item.progressPercent} />
            <Text style={styles.meta}>{item.completionNote ?? 'No completion note'}</Text>
            <ReviewActionSheet
              pending={review.isPending}
              onApprove={(note) => run(() => review.mutateAsync({ assignmentId: item.assignmentId, action: 'approve', payload: note ? { note } : {} }), 'Da duyet task')}
              onReject={(note) => run(() => review.mutateAsync({ assignmentId: item.assignmentId, action: 'reject', payload: { note } }), 'Da tu choi task')}
            />
            <SecondaryButton onPress={() => router.push(`/${area}/tasks/${item.taskId}`)}>Mo task</SecondaryButton>
          </SectionCard>
        ))}
        {!queue.data?.items?.length ? <EmptyState title="Khong co task review" /> : null}
        <SectionCard title="Extension Pending">
          {extensions.isLoading ? <LoadingState /> : null}
          {extensions.isError ? <ErrorState error={extensions.error} onRetry={() => void extensions.refetch()} /> : null}
          {extensions.data?.items?.map((item) => (
            <View key={item.id} style={styles.inlinePanel}>
              <Text style={styles.titleText}>{item.taskTitle}</Text>
              <Text style={styles.meta}>{item.employee.fullName ?? item.employee.userCode}</Text>
              <Text style={styles.meta}>Requested: {formatDateTime(item.requestedDueAt)}</Text>
              <Text style={styles.body}>{item.reason}</Text>
              <ReviewActionSheet
                pending={extensionReview.isPending}
                onApprove={() => run(() => extensionReview.mutateAsync({ id: item.id, action: 'approve' }), 'Da duyet gia han')}
                onReject={(note) => run(() => extensionReview.mutateAsync({ id: item.id, action: 'reject', payload: { note } }), 'Da tu choi gia han')}
              />
            </View>
          ))}
          {!extensions.data?.items?.length ? <Text style={styles.meta}>Khong co extension pending</Text> : null}
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
}: {
  area: Exclude<TaskArea, 'employee'>;
  visible: boolean;
  onClose: () => void;
  targets: CreateTaskTargetPayload[];
  onChange: (targets: CreateTaskTargetPayload[]) => void;
}) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'USER' | 'DEPARTMENT' | 'GROUP'>('USER');
  
  const departments = useDepartments({ page: 1, limit: 100 });
  const groups = useTaskGroups({ page: 1, limit: 100 });
  const departmentId = departmentIdFromUser(user);
  const users = useScopedEmployees({ page: 1, limit: 100, ...(departmentId ? { departmentId } : {}) }, hasAnyPermission(user, ['employee.read', 'task.assign_any', 'task.assign_department']));

  const isSelected = (type: TaskTargetType, id: string) => {
    return targets.some(t => t.targetType === type && t.targetId === id);
  };

  const toggleTarget = (type: TaskTargetType, id: string, name?: string) => {
    if (isSelected(type, id)) {
      onChange(targets.filter(t => t.targetType !== type || t.targetId !== id));
    } else {
      onChange([...targets, { targetType: type, targetId: id, targetName: name } as any]);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.assigneeModalContent}>
          <View style={styles.assigneeModalHeader}>
            <Text style={styles.assigneeModalTitle}>Chọn người nhận việc</Text>
            <Pressable onPress={onClose}>
              <MaterialCommunityIcons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>

          <View style={styles.assigneeTabs}>
            {(['USER', 'DEPARTMENT'] as const).map(tab => {
              const isActive = activeTab === tab;
              const labels = { USER: 'Cá nhân', DEPARTMENT: area === 'leader' ? 'Leader phòng ban' : 'Phòng ban' };
              return (
                <Pressable 
                  key={tab} 
                  style={[styles.assigneeTab, isActive && styles.assigneeTabActive]}
                  onPress={() => setActiveTab(tab)}
                >
                  <Text style={[styles.assigneeTabText, isActive && styles.assigneeTabTextActive]}>
                    {labels[tab]}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <ScrollView style={styles.assigneeList}>
            {activeTab === 'USER' && users.data?.items?.map(u => (
              <Pressable key={u.id} style={styles.assigneeRow} onPress={() => toggleTarget('USER', u.id, u.fullName ?? u.userCode)}>
                <View style={styles.assigneeInfo}>
                  <View style={styles.assigneeAvatar}><MaterialCommunityIcons name="account" size={20} color={colors.muted} /></View>
                  <Text style={styles.assigneeName}>{u.fullName ?? u.userCode}</Text>
                </View>
                <MaterialCommunityIcons 
                  name={isSelected('USER', u.id) ? 'check-circle' : 'circle-outline'} 
                  size={24} 
                  color={isSelected('USER', u.id) ? colors.primary : colors.border} 
                />
              </Pressable>
            ))}

            {activeTab === 'DEPARTMENT' && departments.data?.items?.map(d => (
              <Pressable key={d.id} style={styles.assigneeRow} onPress={() => toggleTarget('DEPARTMENT', d.id, d.name)}>
                <View style={styles.assigneeInfo}>
                  <View style={styles.assigneeAvatar}>
                    <MaterialCommunityIcons name={area === 'leader' ? "account-tie" : "domain"} size={20} color={colors.muted} />
                  </View>
                  <Text style={styles.assigneeName}>
                    {area === 'leader' ? `Leader ${d.name}` : d.name}
                  </Text>
                </View>
                <MaterialCommunityIcons 
                  name={isSelected('DEPARTMENT', d.id) ? 'check-circle' : 'circle-outline'} 
                  size={24} 
                  color={isSelected('DEPARTMENT', d.id) ? colors.primary : colors.border} 
                />
              </Pressable>
            ))}


          </ScrollView>
          
          <View style={styles.assigneeFooter}>
            <PrimaryButton onPress={onClose}>Hoàn tất ({targets.length})</PrimaryButton>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function departmentIdFromUser(user: ReturnType<typeof useAuth>['user']): string | undefined {
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

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  assigneeModalContent: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '80%', padding: spacing.lg },
  assigneeModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  assigneeModalTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  assigneeTabs: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  assigneeTab: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  assigneeTabActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  assigneeTabText: { fontSize: 14, fontWeight: '600', color: colors.muted },
  assigneeTabTextActive: { color: colors.primaryDark },
  assigneeList: { flex: 1 },
  assigneeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  assigneeInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  assigneeAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  assigneeName: { fontSize: 15, fontWeight: '600', color: colors.text },
  assigneeFooter: { paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  
  // Date Picker Modal
  pickerModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  pickerModalContent: { backgroundColor: colors.background, borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingBottom: 24 },
  pickerModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  pickerModalTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  pickerModalDone: { fontSize: 16, fontWeight: '600', color: colors.primary },
  
  // List UI
  actionRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md, marginTop: spacing.sm },
  actionBtnPrimary: { flex: 1, backgroundColor: '#1C1C1E', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 8, gap: 8 },
  actionBtnTextPrimary: { color: '#fff', fontSize: 15, fontWeight: '700' },
  actionBtnSecondary: { flex: 1, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 8, gap: 8, borderWidth: 1, borderColor: colors.border },
  actionBtnTextSecondary: { color: colors.text, fontSize: 15, fontWeight: '700' },
  tabsContainer: { marginHorizontal: -spacing.lg, marginBottom: spacing.lg },
  tabsScroll: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  tabPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border },
  tabPillActive: { backgroundColor: '#1C1C1E', borderColor: '#1C1C1E' },
  tabText: { fontSize: 14, fontWeight: '600', color: colors.muted },
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
    gap: spacing.lg,
    marginTop: spacing.md,
    backgroundColor: colors.background,
    padding: spacing.sm,
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
  }
});
