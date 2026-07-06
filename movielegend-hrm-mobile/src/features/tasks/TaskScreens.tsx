import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
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

export function CreateTaskScreen({ area }: { area: Exclude<TaskArea, 'employee'> }) {
  const router = useRouter();
  const { user } = useAuth();
  const mutation = useCreateTask();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('NORMAL');
  const [startAt, setStartAt] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [departmentContextId, setDepartmentContextId] = useState(user?.department?.id ?? '');
  const [targets, setTargets] = useState<CreateTaskTargetPayload[]>([]);

  async function submit() {
    const payload: CreateTaskPayload = {
      title,
      description,
      priority,
      ...(departmentContextId ? { departmentContextId } : {}),
      ...(startAt ? { startAt } : {}),
      ...(dueAt ? { dueAt } : {}),
      targets,
    };
    try {
      await mutation.mutateAsync(payload);
      Alert.alert('Thanh cong', 'Da tao task');
      router.back();
    } catch (error) {
      const normalized = normalizeApiError(error);
      Alert.alert(normalized.code, mapTaskError(normalized.code, normalized.message));
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <PageHeader title={area === 'admin' ? 'Admin Task Create' : 'Leader Task Create'} subtitle="Gui mot task voi targets theo backend DTO." />
        <SectionCard>
          <FormField label="Title" value={title} onChangeText={setTitle} />
          <FormField label="Description" value={description} onChangeText={setDescription} multiline />
          <FormField label="Department context ID" value={departmentContextId} onChangeText={setDepartmentContextId} autoCapitalize="none" />
          <FormField label="Start at ISO optional" value={startAt} onChangeText={setStartAt} autoCapitalize="none" />
          <FormField label="Due at ISO optional" value={dueAt} onChangeText={setDueAt} autoCapitalize="none" />
          <View style={styles.rowWrap}>
            {priorities.map((item) => (
              <SecondaryButton key={item} disabled={priority === item} onPress={() => setPriority(item)}>{item}</SecondaryButton>
            ))}
          </View>
        </SectionCard>
        <TaskTargetSelector area={area} targets={targets} onChange={setTargets} />
        <PrimaryButton loading={mutation.isPending} disabled={title.trim().length < 3 || !targets.length} onPress={() => void submit()}>Tao task</PrimaryButton>
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
