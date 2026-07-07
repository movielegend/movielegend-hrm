import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, View, Pressable, Image } from 'react-native';
import { BottomNavBar } from '../../components/BottomNavBar';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { FormField } from '../../components/FormField';
import { LoadingState } from '../../components/LoadingState';
import { PageHeader } from '../../components/PageHeader';
import { PrimaryButton, SecondaryButton } from '../../components/Buttons';
import { Screen } from '../../components/Screen';
import { ScreenContainer } from '../../components/ScreenContainer';
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
import { canAcceptAssignment, canStartAssignment, canSubmitAssignment, canUpdateProgress, mapTaskError, myAssignment } from './task.logic';

type TaskArea = 'employee' | 'leader' | 'admin';

const priorities: TaskPriority[] = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];

export function TaskListScreen({ area }: { area: TaskArea }) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const filters: TaskListFilters = { page: 1, limit: 20, ...(search ? { search } : {}), ...(status ? { status: status as never } : {}) };
  const tasks = area === 'employee' ? useMyTasks(filters) : useTasks(filters);
  const createRoute = area === 'employee' ? null : `/${area}/tasks/create`;
  const reviewRoute = area === 'employee' ? null : `/${area}/tasks/review`;

  return (
    <Screen>
      <ScreenContainer refreshControl={<RefreshControl refreshing={tasks.isRefetching} onRefresh={() => void tasks.refetch()} />}>
        <PageHeader title={area === 'employee' ? 'My Tasks' : area === 'leader' ? 'Department Tasks' : 'All Tasks'} subtitle="Danh sach task goi endpoint that, khong filter local." />
        <SearchInput value={search} onChangeText={setSearch} placeholder="Search task" />
        <FormField label="Status filter" value={status} onChangeText={setStatus} autoCapitalize="characters" />
        {createRoute ? <PrimaryButton onPress={() => router.push(createRoute)}>Tao task</PrimaryButton> : null}
        {reviewRoute ? <SecondaryButton onPress={() => router.push(reviewRoute)}>Review queue</SecondaryButton> : null}
        {tasks.isLoading ? <LoadingState /> : null}
        {tasks.isError ? <ErrorState error={tasks.error} onRetry={() => void tasks.refetch()} /> : null}
        {!tasks.isLoading && !tasks.data?.items.length ? <EmptyState title="Chua co task" /> : null}
        {tasks.data?.items.map((task) => (
          <TaskCard key={task.id} task={task} onPress={() => router.push(`/${area}/tasks/${task.id}`)} />
        ))}
      </ScreenContainer>
    
        <Pressable 
          style={{ position: 'absolute', bottom: 24, right: 24, width: 64, height: 64, borderRadius: 32, backgroundColor: '#1E88E5', alignItems: 'center', justifyContent: 'center', elevation: 4, shadowColor: '#1E88E5', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4 }}
          onPress={() => router.push(area === 'employee' ? '/employee/tasks/create' : '/admin/tasks/create')}
        >
          <Ionicons name="add" size={32} color="#FFFFFF" />
        </Pressable>
      </Screen>
  );
}

export function TaskDetailScreen({ area }: { area: TaskArea }) {
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
  const extension = useCreateTaskExtension(id ?? '');
  const review = useReviewTaskAssignment(id);
  const extensionReview = useReviewTaskExtension(id);
  const canReview = hasAnyPermission(user, ['task.review_all', 'task.review_department']);
  const canReviewExtension = hasAnyPermission(user, ['task.extension_review_all', 'task.extension_review_department']);

  if (task.isLoading) return <LoadingState label="Dang tai task" />;
  if (task.isError) return <ErrorState error={task.error} onRetry={() => void task.refetch()} />;
  if (!task.data) return <EmptyState title="Khong tim thay task" />;
  const item = task.data;
  const reviewAssignments = item.assignments?.filter((entry) => entry.status === 'WAITING_REVIEW') ?? [];
  const pendingExtensions = item.extensionRequests?.filter((entry) => entry.status === 'PENDING') ?? [];

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
        <PageHeader title={item.title} subtitle={item.taskCode ?? item.type} />
        <SectionCard>
          <View style={styles.rowWrap}>
            <TaskStatusBadge status={item.status} />
            <PriorityBadge priority={item.priority} />
          </View>
          <Text style={styles.body}>{item.description ?? 'Khong co mo ta'}</Text>
          <Text style={styles.meta}>Start: {formatDateTime(item.startAt)}</Text>
          <Text style={styles.meta}>Due: {formatDateTime(item.dueAt)}</Text>
          <ProgressBar value={assignment?.progressPercent ?? averageProgress(item)} />
          {assignment?.reviewNote ? <Text style={styles.warning}>Review note: {assignment.reviewNote}</Text> : null}
        </SectionCard>

        <TargetPreview task={item} />

        {area === 'employee' && assignment ? (
          <SectionCard title="My Assignment">
            <TaskStatusBadge status={assignment.status} />
            {canAcceptAssignment(assignment.status) ? <PrimaryButton loading={accept.isPending} onPress={() => void run(() => accept.mutateAsync(assignment.id), 'Da accept task')}>Accept</PrimaryButton> : null}
            {canStartAssignment(assignment.status) ? <PrimaryButton loading={start.isPending} onPress={() => void run(() => start.mutateAsync(assignment.id), 'Da start task')}>Start</PrimaryButton> : null}
            {canUpdateProgress(assignment.status) ? (
              <>
                <FormField label="Progress 0-100" value={progress} onChangeText={setProgress} keyboardType="number-pad" />
                <SecondaryButton
                  loading={updateProgress.isPending}
                  onPress={() => void run(() => updateProgress.mutateAsync({ assignmentId: assignment.id, payload: { progressPercent: Number(progress) } }), 'Da cap nhat tien do')}
                >
                  Update progress
                </SecondaryButton>
              </>
            ) : null}
            {canSubmitAssignment(assignment.status) ? (
              <>
                <FormField label="Completion note" value={completionNote} onChangeText={setCompletionNote} multiline />
                <PrimaryButton
                  loading={submit.isPending}
                  onPress={() => void run(() => submit.mutateAsync({ assignmentId: assignment.id, payload: { completionNote } }), 'Da submit review')}
                >
                  Submit task
                </PrimaryButton>
              </>
            ) : null}
            <ExtensionRequestModal
              currentDueAt={assignment.assignmentDueAt ?? item.dueAt}
              pending={extension.isPending}
              onSubmit={(requestedDueAt, reason) => run(() => extension.mutateAsync({ assignmentId: assignment.id, requestedDueAt, reason }), 'Da gui yeu cau gia han')}
            />
          </SectionCard>
        ) : null}

        {canReview ? (
          <SectionCard title="Review Assignments">
            {!reviewAssignments.length ? <Text style={styles.meta}>Khong co assignment WAITING_REVIEW trong detail hien tai.</Text> : null}
            {reviewAssignments.map((entry) => (
              <View key={entry.id} style={styles.inlinePanel}>
                <Text style={styles.titleText}>{entry.user?.profile?.fullName ?? entry.user?.userCode ?? entry.userId}</Text>
                <ProgressBar value={entry.progressPercent} />
                <ReviewActionSheet
                  pending={review.isPending}
                  onApprove={(note) => run(() => review.mutateAsync({ assignmentId: entry.id, action: 'approve', payload: note ? { note } : {} }), 'Da duyet task')}
                  onReject={(note) => run(() => review.mutateAsync({ assignmentId: entry.id, action: 'reject', payload: { note } }), 'Da tu choi task')}
                />
              </View>
            ))}
          </SectionCard>
        ) : null}

        {canReviewExtension ? (
          <SectionCard title="Extension Review">
            {!pendingExtensions.length ? <Text style={styles.meta}>Backend hien chua co endpoint list extension pending rieng hoac chua include trong task detail.</Text> : null}
            {pendingExtensions.map((entry) => (
              <View key={entry.id} style={styles.inlinePanel}>
                <Text style={styles.titleText}>{formatDateTime(entry.requestedDueAt)}</Text>
                <Text style={styles.body}>{entry.reason}</Text>
                <ReviewActionSheet
                  pending={extensionReview.isPending}
                  onApprove={() => run(() => extensionReview.mutateAsync({ id: entry.id, action: 'approve' }), 'Da duyet gia han')}
                  onReject={(note) => run(() => extensionReview.mutateAsync({ id: entry.id, action: 'reject', payload: { note } }), 'Da tu choi gia han')}
                />
              </View>
            ))}
          </SectionCard>
        ) : null}

        <SectionCard title="Comments">
          <CommentList comments={item.comments} />
          <CommentComposer pending={comment.isPending} onSubmit={(content) => comment.mutateAsync({ content }).then(() => undefined)} />
        </SectionCard>

        <SectionCard title="Attachments">
          <AttachmentList attachments={item.attachments} />
          <AttachmentPicker pending={attachment.isPending} onAttach={(payload) => attachment.mutateAsync(payload).then(() => undefined)} />
        </SectionCard>

        <SectionCard title="Timeline">
          {timeline.isLoading ? <LoadingState label="Dang tai timeline" /> : null}
          {timeline.isError ? <ErrorState error={timeline.error} onRetry={() => void timeline.refetch()} /> : null}
          <TaskTimeline items={timeline.data?.items ?? item.histories} />
        </SectionCard>

        <SectionCard title="Extensions">
          <ExtensionList extensions={item.extensionRequests} />
        </SectionCard>
      </ScrollView>
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
        {queue.data?.items.map((item) => (
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
        {!queue.data?.items.length ? <EmptyState title="Khong co task review" /> : null}
        <SectionCard title="Extension Pending">
          {extensions.isLoading ? <LoadingState /> : null}
          {extensions.isError ? <ErrorState error={extensions.error} onRetry={() => void extensions.refetch()} /> : null}
          {extensions.data?.items.map((item) => (
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
          {!extensions.data?.items.length ? <Text style={styles.meta}>Khong co extension pending</Text> : null}
        </SectionCard>
      </ScreenContainer>
    </Screen>
  );
}

function TaskTargetSelector({
  area,
  targets,
  onChange,
}: {
  area: Exclude<TaskArea, 'employee'>;
  targets: CreateTaskTargetPayload[];
  onChange: (targets: CreateTaskTargetPayload[]) => void;
}) {
  const { user } = useAuth();
  const departments = useDepartments({ page: 1, limit: 50 });
  const groups = useTaskGroups({ page: 1, limit: 50 });
  const departmentId = departmentIdFromUser(user);
  const users = useScopedEmployees({ page: 1, limit: 30, ...(departmentId ? { departmentId } : {}) }, hasAnyPermission(user, ['employee.read', 'task.assign_any', 'task.assign_department']));

  function add(targetType: TaskTargetType, targetId: string) {
    if (targets.some((item) => item.targetType === targetType && item.targetId === targetId)) return;
    onChange([...targets, { targetType, targetId }]);
  }

  function remove(target: CreateTaskTargetPayload) {
    onChange(targets.filter((item) => item.targetType !== target.targetType || item.targetId !== target.targetId));
  }

  return (
    <SectionCard title="Task Targets">
      <Text style={styles.meta}>Selected targets preview</Text>
      {targets.map((target) => (
        <View key={`${target.targetType}-${target.targetId}`} style={styles.targetRow}>
          <Text style={styles.body}>{target.targetType}: {target.targetId}</Text>
          <SecondaryButton onPress={() => remove(target)}>Remove</SecondaryButton>
        </View>
      ))}
      {!targets.length ? <Text style={styles.meta}>Chua chon target</Text> : null}

      <Text style={styles.titleText}>Departments</Text>
      {departments.data?.items.map((department) => (
        <SecondaryButton key={department.id} onPress={() => add('DEPARTMENT', department.id)}>{department.name}</SecondaryButton>
      ))}

      <Text style={styles.titleText}>Groups</Text>
      {groups.data?.items.map((group) => (
        <SecondaryButton key={group.id} onPress={() => add('GROUP', group.id)}>{group.name}</SecondaryButton>
      ))}

      <Text style={styles.titleText}>Users</Text>
      {users.data?.items.map((employee) => (
        <SecondaryButton key={employee.id} onPress={() => add('USER', employee.id)}>{employee.fullName ?? employee.userCode}</SecondaryButton>
      ))}
    </SectionCard>
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
});


export function CreateTaskScreen({ area }: { area: TaskArea }) {
  const router = useRouter();
  
  return (
    <Screen>
      <View style={{ flex: 1, backgroundColor: '#F7FAFC' }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 56, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E6EEF3' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Pressable onPress={() => router.back()} style={{ padding: 4 }}>
              <Ionicons name="arrow-back" size={24} color="#0B3B61" />
            </Pressable>
            <Text style={{ fontSize: 20, fontWeight: '700', color: '#0B3B61' }}>Giao việc</Text>
          </View>
          <Pressable style={{ padding: 4 }}>
            <Ionicons name="help-circle-outline" size={24} color="#98A0A8" />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
          
          {/* Tiêu đề công việc */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#3B4A59', marginBottom: 8 }}>Tiêu đề</Text>
            <View style={{ height: 48, borderWidth: 1, borderColor: '#E6EEF3', borderRadius: 8, paddingHorizontal: 12, backgroundColor: '#FFFFFF', justifyContent: 'center' }}>
               <Text style={{ fontSize: 14, color: '#98A0A8' }}>Nhập tiêu đề công việc</Text>
            </View>
          </View>

          {/* Mô tả / Ghi chú */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#3B4A59', marginBottom: 8 }}>Mô tả</Text>
            <View style={{ minHeight: 120, borderWidth: 1, borderColor: '#E6EEF3', borderRadius: 8, padding: 12, backgroundColor: '#FFFFFF' }}>
               <Text style={{ fontSize: 14, color: '#98A0A8' }}>Mô tả chi tiết, yêu cầu, kết quả mong đợi</Text>
            </View>
          </View>

          {/* Người được giao */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#3B4A59', marginBottom: 8 }}>Người được giao</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', height: 48, borderWidth: 1, borderColor: '#E6EEF3', borderRadius: 8, paddingHorizontal: 12, backgroundColor: '#FFFFFF', marginBottom: 12 }}>
               <Ionicons name="search" size={20} color="#98A0A8" />
               <Text style={{ flex: 1, fontSize: 14, color: '#98A0A8', marginLeft: 8 }}>Chọn người/nhóm</Text>
               <Ionicons name="chevron-down" size={20} color="#98A0A8" />
            </View>
            
            {/* Selected Assignees (Chips) */}
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
               <View style={{ flexDirection: 'row', alignItems: 'center', height: 32, backgroundColor: 'rgba(30,136,229,0.08)', borderRadius: 16, paddingHorizontal: 12, gap: 6 }}>
                  <Image source={{ uri: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=150&q=80' }} style={{ width: 20, height: 20, borderRadius: 10 }} />
                  <Text style={{ fontSize: 13, color: '#0B3B61', fontWeight: '500' }}>Phùng Thanh Bình</Text>
                  <Ionicons name="close" size={14} color="#0B3B61" />
               </View>
               <View style={{ flexDirection: 'row', alignItems: 'center', height: 32, backgroundColor: 'rgba(30,136,229,0.08)', borderRadius: 16, paddingHorizontal: 12, gap: 6 }}>
                  <Image source={{ uri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80' }} style={{ width: 20, height: 20, borderRadius: 10 }} />
                  <Text style={{ fontSize: 13, color: '#0B3B61', fontWeight: '500' }}>Nguyễn Minh Tú</Text>
                  <Ionicons name="close" size={14} color="#0B3B61" />
               </View>
            </View>

            {/* Quick-assign buttons */}
            <View style={{ flexDirection: 'row', gap: 8 }}>
               <Pressable style={{ flexDirection: 'row', alignItems: 'center', height: 36, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, borderColor: '#E6EEF3', backgroundColor: '#FFFFFF', gap: 6 }}>
                  <Ionicons name="people" size={16} color="#3B4A59" />
                  <Text style={{ fontSize: 13, color: '#3B4A59', fontWeight: '500' }}>Cả phòng</Text>
               </Pressable>
               <Pressable style={{ flexDirection: 'row', alignItems: 'center', height: 36, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, borderColor: '#E6EEF3', backgroundColor: '#FFFFFF', gap: 6 }}>
                  <Ionicons name="time" size={16} color="#3B4A59" />
                  <Text style={{ fontSize: 13, color: '#3B4A59', fontWeight: '500' }}>Người cùng ca</Text>
               </Pressable>
            </View>
          </View>

          {/* Ngày hạn / Due date */}
          <View style={{ marginBottom: 16 }}>
             <Text style={{ fontSize: 14, fontWeight: '600', color: '#3B4A59', marginBottom: 8 }}>Ngày hạn</Text>
             <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 48, borderWidth: 1, borderColor: '#E6EEF3', borderRadius: 8, paddingHorizontal: 12, backgroundColor: '#FFFFFF', marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                   <Ionicons name="calendar-outline" size={20} color="#98A0A8" />
                   <Text style={{ fontSize: 14, fontWeight: '600', color: '#3B4A59' }}>15/10/2023</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#98A0A8" />
             </View>
             
             {/* Quick presets */}
             <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={{ height: 32, borderRadius: 16, paddingHorizontal: 12, justifyContent: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E6EEF3' }}>
                   <Text style={{ fontSize: 13, color: '#3B4A59' }}>Hôm sau</Text>
                </View>
                <View style={{ height: 32, borderRadius: 16, paddingHorizontal: 12, justifyContent: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E6EEF3' }}>
                   <Text style={{ fontSize: 13, color: '#3B4A59' }}>Tuần sau</Text>
                </View>
                <View style={{ height: 32, borderRadius: 16, paddingHorizontal: 12, justifyContent: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E6EEF3' }}>
                   <Text style={{ fontSize: 13, color: '#3B4A59' }}>Không hạn</Text>
                </View>
             </View>
          </View>

          {/* Độ ưu tiên */}
          <View style={{ marginBottom: 16 }}>
             <Text style={{ fontSize: 14, fontWeight: '600', color: '#3B4A59', marginBottom: 8 }}>Độ ưu tiên</Text>
             <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={{ flex: 1, height: 40, borderRadius: 8, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E6EEF3', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 8 }}>
                   <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444' }} />
                   <Text style={{ fontSize: 14, color: '#3B4A59', fontWeight: '500' }}>Cao</Text>
                </View>
                <View style={{ flex: 1, height: 40, borderRadius: 8, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E6EEF3', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 8 }}>
                   <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#F59E0B' }} />
                   <Text style={{ fontSize: 14, color: '#3B4A59', fontWeight: '500' }}>Vừa</Text>
                </View>
                <View style={{ flex: 1, height: 40, borderRadius: 8, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E6EEF3', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 8 }}>
                   <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#16A34A' }} />
                   <Text style={{ fontSize: 14, color: '#3B4A59', fontWeight: '500' }}>Thấp</Text>
                </View>
             </View>
          </View>

          {/* Đính kèm */}
          <View style={{ marginBottom: 16 }}>
             <Text style={{ fontSize: 14, fontWeight: '600', color: '#3B4A59', marginBottom: 8 }}>Đính kèm</Text>
             <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ width: 64, height: 64, borderRadius: 8, borderWidth: 1, borderColor: '#E6EEF3', backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
                   <Ionicons name="document-text" size={24} color="#1E88E5" />
                </View>
                <View style={{ width: 64, height: 64, borderRadius: 8, borderWidth: 1, borderColor: '#E6EEF3', borderStyle: 'dashed', backgroundColor: '#F7FAFC', alignItems: 'center', justifyContent: 'center' }}>
                   <Ionicons name="add" size={24} color="#98A0A8" />
                </View>
             </View>
          </View>

          {/* Tùy chọn lặp */}
          <View style={{ marginBottom: 24 }}>
             <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 48, backgroundColor: '#FFFFFF', paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: '#E6EEF3' }}>
                <Text style={{ fontSize: 14, color: '#3B4A59', fontWeight: '500' }}>Lặp lại / Nhắc nhở</Text>
                <View style={{ width: 44, height: 24, borderRadius: 12, backgroundColor: '#1E88E5', padding: 2, alignItems: 'flex-end' }}>
                   <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFFFFF' }} />
                </View>
             </View>
          </View>

          {/* Preview thẻ */}
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
             <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#0B3B61', flex: 1, marginRight: 12 }}>Thiết kế Poster Phim 'Hành Trình'</Text>
                <View style={{ backgroundColor: '#EF4444', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 }}>
                   <Text style={{ fontSize: 11, fontWeight: '600', color: '#FFFFFF' }}>Cao</Text>
                </View>
             </View>
             <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: -8 }}>
                   <Image source={{ uri: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=150&q=80' }} style={{ width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: '#FFFFFF' }} />
                   <Image source={{ uri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80' }} style={{ width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: '#FFFFFF' }} />
                </View>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                   <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="document-attach-outline" size={16} color="#98A0A8" />
                      <Text style={{ fontSize: 12, color: '#98A0A8' }}>1</Text>
                   </View>
                   <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="calendar-outline" size={16} color="#98A0A8" />
                      <Text style={{ fontSize: 12, color: '#98A0A8' }}>15/10</Text>
                   </View>
                </View>
             </View>
          </View>

        </ScrollView>
        
        {/* Bottom Actions */}
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFFFFF', padding: 16, borderTopWidth: 1, borderTopColor: '#E6EEF3', flexDirection: 'row', gap: 12 }}>
           <Pressable style={{ flex: 1, height: 52, borderRadius: 12, borderWidth: 1.5, borderColor: '#1E88E5', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#1E88E5' }}>Lưu nháp</Text>
           </Pressable>
           <Pressable style={{ flex: 1, height: 52, borderRadius: 12, backgroundColor: '#1E88E5', alignItems: 'center', justifyContent: 'center', shadowColor: '#1E88E5', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 2 }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#FFFFFF' }}>Giao</Text>
           </Pressable>
        </View>

      </View>
    </Screen>
  );
}
