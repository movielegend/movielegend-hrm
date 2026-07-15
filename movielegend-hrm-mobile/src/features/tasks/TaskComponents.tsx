import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View, Linking } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { uploadFile } from '../../api/uploads.api';
import { PrimaryButton, SecondaryButton } from '../../components/Buttons';
import { EmptyState } from '../../components/EmptyState';
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
import { isOverdue, priorityTone, taskDeadlineLabel, translatePriority, translateStatus, translateTimelineType } from './task.logic';
import { useMinuteTicker } from './deadline-clock';
import { env } from '../../constants/env';

function resolveFileUrl(uri?: string | null): string | null {
  if (!uri) return null;
  let url = uri;
  if (!url.startsWith('http')) {
    url = `${env.API_URL}${url.startsWith('/') ? '' : '/'}${url}`;
  }
  return url;
}

export function TaskCard({ task, onPress }: { task: TaskDto; onPress: () => void }) {
  const now = useMinuteTicker();
  const overdue = isOverdue(task.dueAt, task.status, now);
  const averageProgress = averageAssignmentProgress(task);
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.card}>
      <View style={styles.row}>
        <View style={styles.flex}>
          <Text style={styles.title}>{task.title}</Text>
          <Text style={[styles.meta, { marginTop: 4 }]}>{task.taskCode ?? task.type}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <StatusBadge label={task.priority} tone={priorityTone(task.priority)} />
          <MaterialCommunityIcons name="dots-vertical" size={20} color={colors.text} />
        </View>
        <StatusBadge label={translatePriority(task.priority)} tone={priorityTone(task.priority)} />
      </View>
      <View style={[styles.rowWrap, { marginTop: 4, marginBottom: 8 }]}>
        <StatusBadge label={translateStatus(task.status)} tone={toneForStatus(task.status)} />
        {overdue ? <StatusBadge label="Quá hạn" tone="danger" /> : null}
        {task.status === 'NEW' ? <StatusBadge label="Mới" tone="info" /> : null}
      </View>
      <DeadlineLabel dueAt={task.dueAt} />
      <View style={{ marginVertical: 8 }}>
        <ProgressBar value={averageProgress} />
      </View>
      <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 8 }} />
      <Text style={[styles.meta, { fontSize: 12 }]}>{targetSummary(task)} • {assignmentSummary(task)}</Text>
    </Pressable>
  );
}

export function PriorityBadge({ priority }: { priority?: TaskPriority }) {
  return <StatusBadge label={translatePriority(priority)} tone={priorityTone(priority)} />;
}

export function TaskStatusBadge({ status }: { status?: string }) {
  return <StatusBadge label={translateStatus(status)} tone={toneForStatus(status)} />;
}

export function ProgressBar({ value }: { value: number }) {
  const width = `${Math.max(0, Math.min(100, value))}%` as `${number}%`;
  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width }]} />
      </View>
      <Text style={styles.progressText}>{Math.round(value)}%</Text>
    </View>
  );
}

export function DeadlineLabel({ dueAt }: { dueAt?: string | null | undefined }) {
  const now = useMinuteTicker();
  return <Text style={[styles.meta, isOverdue(dueAt, undefined, now) && styles.dangerText]}>{taskDeadlineLabel(dueAt, now)}</Text>;
}

export function TaskTimeline({ items }: { items?: TaskTimelineItemDto[] | undefined }) {
  if (!items?.length) return <EmptyState small icon="timeline-clock-outline" title="Chưa có lịch sử" message="Không có sự kiện nào được ghi nhận." />;
  return (
    <View style={styles.stack}>
      {items.map((item) => {
        let icon: keyof typeof MaterialCommunityIcons.glyphMap = 'circle-outline';
        let color = colors.muted;
        if (item.type === 'TASK_CREATED') { icon = 'plus-circle'; color = colors.primary; }
        else if (item.type === 'STATUS_CHANGED') { icon = 'swap-horizontal-circle'; color = colors.warning; }
        else if (item.type === 'ASSIGNMENT_CREATED') { icon = 'account-plus'; color = colors.info; }
        
        return (
          <View key={item.id} style={styles.timelineItem}>
            <View style={styles.timelineIconWrapper}>
              <MaterialCommunityIcons name={icon} size={20} color={color} />
            </View>
            <Text style={styles.titleSmall}>{translateTimelineType(item.type)}</Text>
            <Text style={styles.metaSmall}>{formatDateTime(item.createdAt)}</Text>
            {item.data?.note ? <Text style={styles.body}>{item.data.note}</Text> : null}
            {item.data?.oldStatus || item.data?.newStatus ? <Text style={styles.meta}>{`${translateStatus(item.data?.oldStatus)} -> ${translateStatus(item.data?.newStatus)}`}</Text> : null}
          </View>
        );
      })}
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
  if (!comments?.length) return <EmptyState small icon="comment-text-outline" title="Chưa có bình luận" message="Hãy là người đầu tiên bình luận." />;
  return (
    <View style={styles.stack}>
      {comments.map((comment) => (
        <View key={comment.id} style={styles.commentBubble}>
          <View style={styles.row}>
            <View style={styles.avatarMini}>
              <MaterialCommunityIcons name="account" size={16} color={colors.surface} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.titleSmall}>{comment.user?.profile?.fullName ?? comment.user?.userCode ?? comment.userId}</Text>
              <Text style={styles.metaSmall}>{formatDateTime(comment.createdAt)}</Text>
            </View>
          </View>
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
        file: asset.file,
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
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  if (!attachments?.length) return <EmptyState small icon="paperclip" title="Chưa có tệp đính kèm" message="Thêm tài liệu liên quan đến công việc này." />;
  return (
    <View style={styles.stack}>
      {attachments.map((attachment) => (
        <Pressable 
          key={attachment.id} 
          style={[styles.row, styles.attachmentTile, downloadingId === attachment.id && { opacity: 0.6 }]}
          onPress={async () => {
            const url = resolveFileUrl(attachment.fileUrl);
            if (!url) return;
            
            try {
              setDownloadingId(attachment.id);
              // Clean filename to remove invalid characters, default to 'document' if missing
              const cleanFileName = (attachment.fileName || 'document').replace(/[^a-zA-Z0-9.-]/g, '_');
              const localUri = FileSystem.documentDirectory + cleanFileName;
              
              const { uri } = await FileSystem.downloadAsync(url, localUri);
              const canShare = await Sharing.isAvailableAsync();
              if (canShare) {
                await Sharing.shareAsync(uri);
              } else {
                // Fallback to open URL
                Linking.openURL(url).catch((err) => console.error("Couldn't load page", err));
              }
            } catch (err) {
              console.error(err);
              Linking.openURL(url).catch((e) => console.error(e));
            } finally {
              setDownloadingId(null);
            }
          }}
        >
          <MaterialCommunityIcons name="file-document-outline" size={28} color={colors.primary} />
          <View style={styles.flex}>
            <Text style={styles.titleSmall} numberOfLines={1}>
              {downloadingId === attachment.id ? 'Đang mở...' : attachment.fileName}
            </Text>
            <Text style={styles.metaSmall}>{attachment.mimeType ?? attachment.type}</Text>
          </View>
        </Pressable>
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
  if (!extensions?.length) return <EmptyState small icon="calendar-clock" title="Chưa có yêu cầu gia hạn" message="Không có yêu cầu gia hạn nào được ghi nhận." />;
  return (
    <View style={styles.stack}>
      {extensions.map((extension) => (
        <View key={extension.id} style={styles.inlinePanel}>
          <View style={styles.row}>
            <TaskStatusBadge status={extension.status} />
            <Text style={[styles.meta, { marginLeft: 'auto' }]}>{formatDateTime(extension.requestedDueAt)}</Text>
          </View>
          <Text style={[styles.body, { marginTop: spacing.xs }]}>{extension.reason}</Text>
        </View>
      ))}
    </View>
  );
}

export function TargetPreview({ task }: { task: TaskDto }) {
  const targets = task.targets ?? [];
  const assignments = task.assignments ?? [];
  const completed = assignments.filter((a) => a.status === 'COMPLETED').length;

  if (!targets.length) {
    return (
      <SectionCard title="Người thực hiện">
        <EmptyState small icon="account-group" title="Chưa có người nhận việc" message="Hãy giao việc cho ai đó." />
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Người thực hiện">
      <View style={styles.rowWrap}>
        {targets.map((t) => {
          const type = t.targetType ?? t.type;
          let icon: keyof typeof MaterialCommunityIcons.glyphMap = 'account';
          if (type === 'DEPARTMENT') icon = 'domain';
          if (type === 'GROUP') icon = 'account-group';
          return (
            <View key={t.id} style={styles.targetChip}>
              <MaterialCommunityIcons name={icon} size={16} color={colors.primary} />
              <Text style={styles.targetChipText}>{type}</Text>
            </View>
          );
        })}
      </View>
      {assignments.length > 0 && (
        <View style={[styles.row, { marginTop: spacing.xs }]}>
          <MaterialCommunityIcons name="check-all" size={18} color={colors.success} />
          <Text style={styles.meta}>{completed} / {assignments.length} người đã hoàn thành</Text>
        </View>
      )}
    </SectionCard>
  );
}

function averageAssignmentProgress(task: TaskDto): number {
  const assignments = task.assignments ?? [];
  if (!assignments.length) return 0;
  return assignments.reduce((sum, assignment) => sum + assignment.progressPercent, 0) / assignments.length;
}

function targetSummary(task: TaskDto): string {
  const targets = task.targets ?? [];
  if (!targets.length) return 'Chưa giao việc';
  const counts = targets.reduce<Record<string, number>>((memo, target) => {
    let type = target.targetType ?? target.type;
    if (type === 'USER') type = 'Cá nhân';
    else if (type === 'DEPARTMENT') type = 'Phòng ban';
    else if (type === 'GROUP') type = 'Nhóm';
    memo[type] = (memo[type] ?? 0) + 1;
    return memo;
  }, {});
  return Object.entries(counts).map(([type, count]) => `${count} ${type}`).join(', ');
}

function assignmentSummary(task: TaskDto): string {
  const assignments = task.assignments ?? [];
  if (!assignments.length) return '0 người';
  const completed = assignments.filter((assignment) => assignment.status === 'COMPLETED').length;
  return `${completed}/${assignments.length} hoàn thành`;
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
    progressContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    progressTrack: {
      backgroundColor: '#E5E5EA',
      borderRadius: 999,
      height: 14,
      flex: 1,
      overflow: 'hidden',
    },
    progressFill: {
      backgroundColor: '#1C1C1E',
      borderRadius: 999,
      bottom: 0,
      left: 0,
      position: 'absolute',
      top: 0,
    },
    progressText: {
      color: colors.text,
      fontSize: 13,
      fontWeight: '700',
    },
  meta: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
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
    borderLeftColor: colors.border,
    borderLeftWidth: 2,
    marginLeft: spacing.sm,
    paddingLeft: spacing.lg,
    paddingBottom: spacing.md,
    position: 'relative',
    gap: spacing.xs,
  },
  timelineIconWrapper: {
    backgroundColor: colors.surface,
    left: -11,
    position: 'absolute',
    top: -2,
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
  commentBubble: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.xs,
  },
  avatarMini: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    height: 24,
    width: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metaSmall: {
    color: colors.muted,
    fontSize: 12,
  },
  attachmentTile: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    padding: spacing.sm,
  },
  targetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 999,
  },
  targetChipText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
});
