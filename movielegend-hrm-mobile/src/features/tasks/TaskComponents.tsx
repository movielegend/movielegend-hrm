import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { uploadFile } from '../../api/uploads.api';
import { PrimaryButton, SecondaryButton } from '../../components/Buttons';
import { FormField } from '../../components/FormField';
import { SectionCard } from '../../components/SectionCard';
import { StatusBadge, toneForStatus } from '../../components/StatusBadge';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import type {
  CreateTaskAttachmentPayload,
  TaskAttachmentDto,
  TaskCommentDto,
  TaskDto,
  TaskExtensionRequestDto,
  TaskPriority,
  TaskTimelineItemDto,
} from '../../types/task.types';
import { formatDateTime } from '../../utils/date-time';
import { normalizeApiError } from '../../utils/api-error';
import { isOverdue, priorityTone, taskDeadlineLabel } from './task.logic';
import { useMinuteTicker } from './deadline-clock';

export function TaskCard({ task, onPress }: { task: TaskDto; onPress: () => void }) {
  const now = useMinuteTicker();
  const overdue = isOverdue(task.dueAt, task.status, now);
  const averageProgress = averageAssignmentProgress(task);
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.card}>
      <View style={styles.row}>
        <View style={styles.flex}>
          <Text style={styles.title}>{task.title}</Text>
          <Text style={styles.meta}>{task.taskCode ?? task.type}</Text>
        </View>
        <StatusBadge label={task.priority} tone={priorityTone(task.priority)} />
      </View>
      <View style={styles.rowWrap}>
        <StatusBadge label={task.status} tone={toneForStatus(task.status)} />
        {overdue ? <StatusBadge label="OVERDUE" tone="danger" /> : null}
        {task.status === 'NEW' ? <StatusBadge label="NEW" tone="info" /> : null}
      </View>
      <DeadlineLabel dueAt={task.dueAt} />
      <ProgressBar value={averageProgress} />
      <Text style={styles.meta}>{targetSummary(task)} - {assignmentSummary(task)}</Text>
    </Pressable>
  );
}

export function PriorityBadge({ priority }: { priority?: TaskPriority }) {
  return <StatusBadge label={priority ?? 'NORMAL'} tone={priorityTone(priority)} />;
}

export function TaskStatusBadge({ status }: { status?: string }) {
  return <StatusBadge label={status ?? '-'} tone={toneForStatus(status)} />;
}

export function ProgressBar({ value }: { value: number }) {
  const width = `${Math.max(0, Math.min(100, value))}%` as `${number}%`;
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width }]} />
      <Text style={styles.progressText}>{Math.round(value)}%</Text>
    </View>
  );
}

export function DeadlineLabel({ dueAt }: { dueAt?: string | null | undefined }) {
  const now = useMinuteTicker();
  return <Text style={[styles.meta, isOverdue(dueAt, undefined, now) && styles.dangerText]}>{taskDeadlineLabel(dueAt, now)}</Text>;
}

export function TaskTimeline({ items }: { items?: TaskTimelineItemDto[] | undefined }) {
  if (!items?.length) return <Text style={styles.meta}>Timeline chua duoc backend include trong task detail.</Text>;
  return (
    <View style={styles.stack}>
      {items.map((item) => (
        <View key={item.id} style={styles.timelineItem}>
          <Text style={styles.titleSmall}>{item.type}</Text>
          <Text style={styles.meta}>{formatDateTime(item.createdAt)}</Text>
          {item.data?.note ? <Text style={styles.meta}>{item.data.note}</Text> : null}
          {item.data?.oldStatus || item.data?.newStatus ? <Text style={styles.meta}>{`${item.data?.oldStatus ?? '-'} -> ${item.data?.newStatus ?? '-'}`}</Text> : null}
        </View>
      ))}
    </View>
  );
}

export function CommentComposer({ onSubmit, pending }: { onSubmit: (content: string) => Promise<void>; pending?: boolean }) {
  const [content, setContent] = useState('');
  async function submit() {
    try {
      await onSubmit(content);
      setContent('');
    } catch (error) {
      const normalized = normalizeApiError(error);
      Alert.alert(normalized.code, normalized.message);
    }
  }
  return (
    <View style={styles.stack}>
      <FormField label="Binh luan" value={content} onChangeText={setContent} multiline />
      <PrimaryButton disabled={content.trim().length < 2} loading={pending} onPress={() => void submit()}>Gui binh luan</PrimaryButton>
    </View>
  );
}

export function CommentList({ comments }: { comments?: TaskCommentDto[] | undefined }) {
  if (!comments?.length) return <Text style={styles.meta}>Chua co binh luan</Text>;
  return (
    <View style={styles.stack}>
      {comments.map((comment) => (
        <View key={comment.id} style={styles.inlinePanel}>
          <Text style={styles.meta}>{formatDateTime(comment.createdAt)}</Text>
          <Text style={styles.body}>{comment.content}</Text>
        </View>
      ))}
    </View>
  );
}

export function AttachmentPicker({
  onAttach,
  pending,
}: {
  onAttach: (payload: CreateTaskAttachmentPayload) => Promise<void>;
  pending?: boolean;
}) {
  const [staged, setStaged] = useState<CreateTaskAttachmentPayload | null>(null);
  const [uploading, setUploading] = useState(false);

  async function pickAndUpload() {
    const picked = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
    if (picked.canceled || !picked.assets?.[0]) return;
    const asset = picked.assets[0];
    setUploading(true);
    try {
      const upload = await uploadFile({
        uri: asset.uri,
        name: asset.name,
        mimeType: asset.mimeType ?? 'application/octet-stream',
        purpose: 'TASK_ATTACHMENT',
      });
      setStaged({
        fileName: asset.name,
        fileUrl: upload.fileUrl,
        mimeType: upload.mimeType,
        sizeBytes: upload.size,
        type: upload.mimeType.startsWith('image/') ? 'IMAGE' : 'FILE',
      });
    } catch (error) {
      const normalized = normalizeApiError(error);
      Alert.alert(normalized.code, normalized.message);
    } finally {
      setUploading(false);
    }
  }

  async function attach() {
    if (!staged) return;
    try {
      await onAttach(staged);
      setStaged(null);
    } catch (error) {
      const normalized = normalizeApiError(error);
      Alert.alert(normalized.code, normalized.message);
    }
  }

  return (
    <View style={styles.stack}>
      <SecondaryButton loading={uploading} onPress={() => void pickAndUpload()}>Chon file</SecondaryButton>
      {staged ? (
        <View style={styles.inlinePanel}>
          <Text style={styles.titleSmall}>{staged.fileName}</Text>
          <Text style={styles.meta}>Upload thanh cong, san sang attach. Neu attach fail, app giu lai file de retry.</Text>
          <PrimaryButton loading={pending} onPress={() => void attach()}>Attach file</PrimaryButton>
        </View>
      ) : null}
    </View>
  );
}

export function AttachmentList({ attachments }: { attachments?: TaskAttachmentDto[] | undefined }) {
  if (!attachments?.length) return <Text style={styles.meta}>Chua co attachment</Text>;
  return (
    <View style={styles.stack}>
      {attachments.map((attachment) => (
        <View key={attachment.id} style={styles.inlinePanel}>
          <Text style={styles.titleSmall}>{attachment.fileName}</Text>
          <Text style={styles.meta}>{attachment.mimeType ?? attachment.type}</Text>
        </View>
      ))}
    </View>
  );
}

export function ReviewActionSheet({
  onApprove,
  onReject,
  pending,
}: {
  onApprove: (note?: string) => Promise<void>;
  onReject: (note: string) => Promise<void>;
  pending?: boolean;
}) {
  const [note, setNote] = useState('');
  return (
    <View style={styles.stack}>
      <FormField label="Review note" value={note} onChangeText={setNote} multiline />
      <View style={styles.actions}>
        <PrimaryButton loading={pending} onPress={() => void onApprove(note || undefined)}>Duyet</PrimaryButton>
        <SecondaryButton disabled={note.trim().length < 3} loading={pending} onPress={() => void onReject(note)}>Tu choi</SecondaryButton>
      </View>
    </View>
  );
}

export function ExtensionRequestModal({
  currentDueAt,
  onSubmit,
  pending,
}: {
  currentDueAt?: string | null | undefined;
  onSubmit: (requestedDueAt: string, reason: string) => Promise<void>;
  pending?: boolean;
}) {
  const [requestedDueAt, setRequestedDueAt] = useState(currentDueAt ?? '');
  const [reason, setReason] = useState('');
  const invalidDate = Boolean(currentDueAt && requestedDueAt && new Date(requestedDueAt) <= new Date(currentDueAt));
  return (
    <View style={styles.stack}>
      <FormField label="Requested dueAt ISO" value={requestedDueAt} onChangeText={setRequestedDueAt} autoCapitalize="none" />
      <FormField label="Ly do" value={reason} onChangeText={setReason} multiline />
      {invalidDate ? <Text style={styles.dangerText}>Ngay moi phai sau deadline hien tai.</Text> : null}
      <SecondaryButton
        disabled={!requestedDueAt || reason.trim().length < 3 || invalidDate}
        loading={pending}
        onPress={() => void onSubmit(requestedDueAt, reason)}
      >
        Gui gia han
      </SecondaryButton>
    </View>
  );
}

export function ExtensionList({ extensions }: { extensions?: TaskExtensionRequestDto[] | undefined }) {
  if (!extensions?.length) return <Text style={styles.meta}>Backend hien chua include extensionRequests trong task detail.</Text>;
  return (
    <View style={styles.stack}>
      {extensions.map((extension) => (
        <View key={extension.id} style={styles.inlinePanel}>
          <TaskStatusBadge status={extension.status} />
          <Text style={styles.meta}>Requested: {formatDateTime(extension.requestedDueAt)}</Text>
          <Text style={styles.body}>{extension.reason}</Text>
        </View>
      ))}
    </View>
  );
}

export function TargetPreview({ task }: { task: TaskDto }) {
  const isDepartment = task.type === 'DEPARTMENT';
  return (
    <View style={{ backgroundColor: '#FFFFFF', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F0F4F8' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <Ionicons name="people-outline" size={20} color="#1E88E5" />
        <Text style={{ fontSize: 13, fontWeight: '700', color: '#1E88E5', marginLeft: 8 }}>ĐỐI TƯỢNG ĐƯỢC GIAO</Text>
      </View>
      
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isDepartment ? '#F0FDF4' : '#F8FAFC', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: isDepartment ? '#BBF7D0' : '#E2E8F0' }}>
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: isDepartment ? '#22C55E' : '#3B82F6', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name={isDepartment ? "business" : "person"} size={20} color="#FFFFFF" />
        </View>
        <View style={{ marginLeft: 12, flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#0F172A' }}>
            {isDepartment ? 'Phòng ban' : 'Cá nhân'}
          </Text>
          <Text style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
            Chịu trách nhiệm: {isDepartment ? 'Leader (Trưởng phòng)' : 'Thành viên được giao'}
          </Text>
        </View>
      </View>
    </View>
  );
}

function averageAssignmentProgress(task: TaskDto): number {
  const assignments = task.assignments ?? [];
  if (!assignments.length) return 0;
  return assignments.reduce((sum, assignment) => sum + assignment.progressPercent, 0) / assignments.length;
}

function targetSummary(task: TaskDto): string {
  const targets = task.targets ?? [];
  if (!targets.length) return 'No target metadata';
  const counts = targets.reduce<Record<string, number>>((memo, target) => {
    const type = target.targetType ?? target.type;
    memo[type] = (memo[type] ?? 0) + 1;
    return memo;
  }, {});
  return Object.entries(counts).map(([type, count]) => `${count} ${type}`).join(', ');
}

function assignmentSummary(task: TaskDto): string {
  const assignments = task.assignments ?? [];
  if (!assignments.length) return '0 assignments';
  const completed = assignments.filter((assignment) => assignment.status === 'COMPLETED').length;
  return `${completed}/${assignments.length} completed`;
}

const styles = StyleSheet.create({
  actions: {
    gap: spacing.sm,
  },
  body: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  dangerText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '700',
  },
  flex: {
    flex: 1,
  },
  inlinePanel: {
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
  meta: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  progressFill: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    bottom: 0,
    left: 0,
    position: 'absolute',
    top: 0,
  },
  progressText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  progressTrack: {
    backgroundColor: colors.primarySoft,
    borderRadius: 999,
    height: 20,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  stack: {
    gap: spacing.md,
  },
  timelineItem: {
    borderLeftColor: colors.primary,
    borderLeftWidth: 3,
    gap: spacing.xs,
    paddingLeft: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  titleSmall: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
});
