import { useState } from 'react';
import { ActionDatePicker } from './TaskScreens';
import { useAppAlert } from '../../contexts/AlertContext';
import { Modal, Pressable, SafeAreaView, StyleSheet, Text, View, Linking, Platform, Image, ScrollView } from 'react-native';
import { WebView } from 'react-native-webview';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as WebBrowser from 'expo-web-browser';
import * as ImagePicker from 'expo-image-picker';
import { requestMediaLibraryPermissionWithFallback } from '../../utils/mediaPermissions';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { uploadFile } from '../../api/uploads.api';
import { PrimaryButton, SecondaryButton } from '../../components/Buttons';
import { ConfirmModal } from '../../components/ConfirmModal';
import { EmptyState } from '../../components/EmptyState';
import { FormField } from '../../components/FormField';
import { PdfViewerModal } from '../../components/PdfViewerModal';
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
import { apiUrl } from '../../constants/env';

function resolveFileUrl(uri?: string | null): string | null {
  if (!uri) return null;
  let url = uri;
  if (!url.startsWith('http')) {
    if (url.startsWith('/uploads')) {
      const baseUrl = apiUrl.replace(/\/api\/v1\/?$/, '');
      url = `${baseUrl}${url}`;
    } else {
      url = `${apiUrl}${url.startsWith('/') ? '' : '/'}${url}`;
    }
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
          <StatusBadge label={translatePriority(task.priority)} tone={priorityTone(task.priority)} />
          <MaterialCommunityIcons name="dots-vertical" size={20} color={colors.text} />
        </View>
      </View>
      <View style={[styles.rowWrap, { marginTop: 2, marginBottom: 4 }]}>
        <StatusBadge label={translateStatus(task.status)} tone={toneForStatus(task.status)} />
        {overdue ? <StatusBadge label="Quá hạn" tone="danger" /> : null}
        {task.status === 'NEW' ? <StatusBadge label="Mới" tone="info" /> : null}
      </View>
      <DeadlineLabel dueAt={task.dueAt} />
      <View style={{ marginVertical: 6 }}>
        <ProgressBar value={averageProgress} />
      </View>
      <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 6 }} />
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
  const { showAlert } = useAppAlert();
  async function submit() {
    try {
      await onSubmit(content);
      setContent('');
    } catch (error) {
      const normalized = normalizeApiError(error);
      showAlert(normalized.code, normalized.message);
    }
  }
  return (
    <View style={styles.stack}>
      <FormField label="Bình luận" value={content} onChangeText={setContent} multiline />
      <PrimaryButton disabled={content.trim().length < 2} loading={pending} onPress={() => void submit()}>Gửi bình luận</PrimaryButton>
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
  const [staged, setStaged] = useState<CreateTaskAttachmentPayload[]>([]);
  const [uploadingType, setUploadingType] = useState<'FILE' | 'IMAGE' | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const { showAlert } = useAppAlert();

  async function pickAndUpload() {
    const picked = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
    if (picked.canceled || !picked.assets?.[0]) return;
    const asset = picked.assets[0];
    setUploadingType('FILE');
    try {
      const upload = await uploadFile({
        uri: asset.uri,
        name: asset.name,
        mimeType: asset.mimeType ?? 'application/octet-stream',
        purpose: 'TASK_ATTACHMENT',
        file: asset.file,
      });
      setStaged(prev => [...prev, {
        fileName: asset.name,
        fileUrl: upload.fileUrl,
        mimeType: upload.mimeType,
        sizeBytes: upload.size,
        type: upload.mimeType.startsWith('image/') ? 'IMAGE' : 'FILE',
      }]);
    } catch (error) {
      const normalized = normalizeApiError(error);
      showAlert(normalized.code, normalized.message);
    } finally {
      setUploadingType(null);
    }
  }

  async function pickImageAndUpload() {
    const hasPermission = await requestMediaLibraryPermissionWithFallback();
    if (!hasPermission) return;
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (picked.canceled || !picked.assets?.length) return;
    
    setUploadingType('IMAGE');
    try {
      const uploadedAssets = await Promise.all(picked.assets.map(async (asset) => {
        const fileName = asset.fileName ?? asset.uri.split('/').pop() ?? 'image.jpg';
        const upload = await uploadFile({
          uri: asset.uri,
          name: fileName,
          mimeType: asset.mimeType ?? 'image/jpeg',
          purpose: 'TASK_ATTACHMENT',
        });
        return {
          fileName: fileName,
          fileUrl: upload.fileUrl,
          mimeType: upload.mimeType,
          sizeBytes: upload.size,
          type: 'IMAGE' as const,
        };
      }));
      setStaged(prev => [...prev, ...uploadedAssets]);
    } catch (error) {
      const normalized = normalizeApiError(error);
      showAlert(normalized.code, normalized.message);
    } finally {
      setUploadingType(null);
    }
  }

  async function attach() {
    if (staged.length === 0) return;
    try {
      for (const item of staged) {
        await onAttach(item);
      }
      setStaged([]);
    } catch (error) {
      const normalized = normalizeApiError(error);
      showAlert(normalized.code, normalized.message);
    }
  }

  return (
    <View style={styles.stack}>
      <Modal visible={!!previewImage} transparent={true} animationType="fade" onRequestClose={() => setPreviewImage(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' }}>
          <Pressable style={{ position: 'absolute', top: 40, right: 20, zIndex: 10, padding: 8 }} onPress={() => setPreviewImage(null)}>
            <MaterialCommunityIcons name="close" size={32} color="white" />
          </Pressable>
          {previewImage && (
            <Image source={{ uri: previewImage }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
          )}
        </View>
      </Modal>
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <View style={{ flex: 1 }}>
          <SecondaryButton loading={uploadingType === 'FILE'} onPress={() => void pickAndUpload()}>Chọn file</SecondaryButton>
        </View>
        <View style={{ flex: 1 }}>
          <SecondaryButton loading={uploadingType === 'IMAGE'} onPress={() => void pickImageAndUpload()}>Chọn ảnh</SecondaryButton>
        </View>
      </View>
      {staged.length > 0 ? (
        <View style={styles.inlinePanel}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 8 }}>
            {staged.map((item, index) => (
              <View key={index} style={{ width: '30%', aspectRatio: 1, position: 'relative' }}>
                {item.type === 'IMAGE' ? (
                  <Pressable style={{ flex: 1 }} onPress={() => setPreviewImage(item.fileUrl)}>
                    <Image source={{ uri: item.fileUrl }} style={{ width: '100%', height: '100%', borderRadius: 8 }} resizeMode="cover" />
                  </Pressable>
                ) : (
                  <View style={{ flex: 1, borderRadius: 8, backgroundColor: colors.surfaceHover, justifyContent: 'center', alignItems: 'center', padding: 8 }}>
                    <MaterialCommunityIcons name="file-document-outline" size={32} color={colors.textSecondary} />
                    <Text style={[styles.titleSmall, { textAlign: 'center', marginTop: 4 }]} numberOfLines={2}>{item.fileName}</Text>
                  </View>
                )}
                <Pressable
                  style={{ position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: 12 }}
                  onPress={() => setStaged(prev => prev.filter((_, i) => i !== index))}
                >
                  <MaterialCommunityIcons name="close-circle" size={24} color={colors.danger} />
                </Pressable>
              </View>
            ))}
          </View>
          <Text style={styles.meta}>Tải lên thành công {staged.length} file, sẵn sàng đính kèm. Nếu đính kèm thất bại, ứng dụng sẽ giữ lại file để thử lại.</Text>
          <PrimaryButton loading={pending} onPress={() => void attach()}>Đính kèm file</PrimaryButton>
        </View>
      ) : null}
    </View>
  );
}

export function AttachmentList({ 
  attachments,
  canDelete,
  onDeleteAttachment,
  isUnaccepted = false,
}: { 
  attachments?: TaskAttachmentDto[] | undefined;
  canDelete?: (attachmentId: string) => boolean;
  onDeleteAttachment?: (id: string) => Promise<void>;
  isUnaccepted?: boolean;
}) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [imagePreviewUri, setImagePreviewUri] = useState<string | null>(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState<string>('Xem tệp');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { showAlert } = useAppAlert();

  if (!attachments?.length) return <EmptyState small icon="paperclip" title="Chưa có tệp đính kèm" message="Thêm tài liệu liên quan đến công việc này." />;
  return (
    <>
    <ConfirmModal
      visible={!!deletingId}
      title="Xoá tài liệu"
      message="Bạn có chắc chắn muốn xoá tài liệu này?"
      confirmLabel="Xoá"
      onCancel={() => setDeletingId(null)}
      onConfirm={() => {
        if (deletingId && onDeleteAttachment) {
          onDeleteAttachment(deletingId);
        }
        setDeletingId(null);
      }}
    />

    {/* Modal xem PDF offline trực tiếp trong App */}
    <PdfViewerModal
      visible={!!pdfPreviewUrl}
      url={pdfPreviewUrl}
      title={previewTitle}
      onClose={() => setPdfPreviewUrl(null)}
    />

    {/* Modal xem Ảnh trực tiếp trong App */}
    <Modal visible={!!imagePreviewUri} animationType="slide" onRequestClose={() => setImagePreviewUri(null)}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#1a1a1a' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#1a1a1a', gap: 8 }}>
          <Pressable
            onPress={() => setImagePreviewUri(null)}
            style={{ paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#333', borderRadius: 8 }}
          >
            <Text style={{ color: '#fff', fontWeight: '600' }}>✕ Đóng</Text>
          </Pressable>
          <Text style={{ color: '#fff', flex: 1, fontWeight: '600', fontSize: 15 }} numberOfLines={1}>{previewTitle}</Text>
          {imagePreviewUri && (
            <Pressable
              onPress={() => Sharing.shareAsync(imagePreviewUri).catch(console.error)}
              style={{ paddingHorizontal: 12, paddingVertical: 6, backgroundColor: colors.primary, borderRadius: 8 }}
            >
              <Text style={{ color: '#fff', fontWeight: '600' }}>Chia sẻ</Text>
            </Pressable>
          )}
        </View>
        {imagePreviewUri ? (
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }} maximumZoomScale={3} minimumZoomScale={1}>
            <Image source={{ uri: imagePreviewUri }} style={{ width: '100%', height: '100%', resizeMode: 'contain' }} />
          </ScrollView>
        ) : null}
      </SafeAreaView>
    </Modal>

    <View style={styles.stack}>
      {attachments.map((attachment) => (
        <Pressable 
          key={attachment.id} 
          style={[styles.row, styles.attachmentTile, downloadingId === attachment.id && { opacity: 0.6 }]}
          onPress={async () => {
            if (isUnaccepted) {
              showAlert('Yêu cầu nhận việc', 'Vui lòng nhấn "Nhận việc" trước khi xem tài liệu đính kèm.');
              return;
            }
            const url = resolveFileUrl(attachment.fileUrl);
            if (!url) return;
            
            try {
              setDownloadingId(attachment.id);
              const fileName = attachment.fileName || 'file';
              const ext = (fileName.split('.').pop() || '').toLowerCase();
              const mime = (attachment.mimeType || '').toLowerCase();

              const isImg = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic'].includes(ext) || mime.startsWith('image/');
              const isPdf = ext === 'pdf' || mime.includes('pdf');

              setPreviewTitle(fileName);

              if (isImg) {
                let cleanFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
                const localUri = FileSystem.documentDirectory + cleanFileName;
                const info = await FileSystem.getInfoAsync(localUri);
                let fileUri = localUri;
                if (!info.exists) {
                  const { uri } = await FileSystem.downloadAsync(url, localUri, {
                    headers: { 'ngrok-skip-browser-warning': 'true' }
                  });
                  fileUri = uri;
                }
                setImagePreviewUri(fileUri);
                return;
              }

              if (isPdf) {
                setPdfPreviewUrl(url);
                return;
              }

              // Các loại file khác: Tải về và mở menu chia sẻ/xem của OS
              let cleanFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
              const localUri = FileSystem.documentDirectory + cleanFileName;
              const { uri } = await FileSystem.downloadAsync(url, localUri);
              await Sharing.shareAsync(uri, { UTI: mime || undefined, mimeType: mime || undefined });
            } catch (err) {
              console.error(err);
              if (url) {
                setPreviewTitle(attachment.fileName || 'Xem tệp');
                setPdfPreviewUrl(url);
              }
            } finally {
              setDownloadingId(null);
            }
          }}
        >
          {(() => {
            const fn = attachment.fileName || '';
            const ext = fn.split('.').pop()?.toLowerCase() || '';
            const mime = (attachment.mimeType || '').toLowerCase();
            const isImg = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic'].includes(ext) || mime.startsWith('image/');
            return isImg ? (
              <MaterialCommunityIcons name="file-image-outline" size={28} color="#2563EB" />
            ) : (
              <MaterialCommunityIcons name="file-document-outline" size={28} color={colors.primary} />
            );
          })()}
          <View style={styles.flex}>
            <Text style={styles.titleSmall} numberOfLines={1}>
              {downloadingId === attachment.id ? 'Đang mở...' : attachment.fileName}
            </Text>
            <Text style={styles.metaSmall}>{attachment.mimeType ?? attachment.type}</Text>
          </View>
          {onDeleteAttachment && (!canDelete || canDelete(attachment.id)) && (
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                setDeletingId(attachment.id);
              }}
              style={{ padding: 8 }}
              hitSlop={10}
            >
              <MaterialCommunityIcons name="trash-can-outline" size={22} color={colors.error} />
            </Pressable>
          )}
        </Pressable>
      ))}
    </View>
    </>
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
  const { showAlert } = useAppAlert();
  return (
    <View style={styles.stack}>
      <FormField label="Ghi chú duyệt" value={note} onChangeText={setNote} multiline />
      <View style={styles.actions}>
        <PrimaryButton loading={pending} onPress={() => void onApprove(note || undefined)}>Duyệt</PrimaryButton>
        <SecondaryButton 
          loading={pending} 
          onPress={() => {
            if (note.trim().length < 3) {
              showAlert('Thiếu thông tin', 'Vui lòng nhập ghi chú duyệt để từ chối (ít nhất 3 ký tự)');
              return;
            }
            void onReject(note);
          }}
        >
          Từ chối
        </SecondaryButton>
      </View>
    </View>
  );
}

export function ExtensionRequestModal({
  currentDueAt,
  onSubmit,
  pending,
  extensionCount = 0,
}: {
  currentDueAt?: string | null | undefined;
  onSubmit: (requestedDueAt: string, reason: string) => Promise<void>;
  pending?: boolean;
  extensionCount?: number;
}) {
  const [requestedDueAt, setRequestedDueAt] = useState(currentDueAt ?? '');
  const [reason, setReason] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  
  const selectedDate = requestedDueAt ? new Date(requestedDueAt) : new Date();
  const invalidDate = Boolean(currentDueAt && requestedDueAt && new Date(requestedDueAt) <= new Date(currentDueAt));
  const isLimitReached = extensionCount >= 2;

  if (isLimitReached) {
    return (
      <View style={[styles.inlinePanel, { backgroundColor: colors.warningSoft, borderColor: colors.warning }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
          <MaterialCommunityIcons name="alert-circle-outline" size={20} color={colors.warning} />
          <Text style={{ fontSize: 13, fontWeight: '700', color: colors.warning }}>
            Đã đạt giới hạn gia hạn (2/2 lần)
          </Text>
        </View>
        <Text style={[styles.metaSmall, { marginTop: 4, color: colors.textSecondary }]}>
          Bạn đã sử dụng hết 2 lượt xin gia hạn cho công việc này.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.stack}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={styles.meta}>Hạn chót đề xuất</Text>
        <Text style={[styles.metaSmall, { color: colors.primary, fontWeight: '600' }]}>Đã xin: {extensionCount}/2 lần</Text>
      </View>
      <Pressable
        style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: spacing.md, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        onPress={() => setShowPicker(true)}
      >
        <Text style={{ color: requestedDueAt ? colors.text : colors.muted, fontWeight: '500' }}>
          {requestedDueAt ? formatDateTime(requestedDueAt) : 'Chọn ngày & giờ'}
        </Text>
        <MaterialCommunityIcons name="calendar-clock" size={20} color={colors.primary} />
      </Pressable>
      
      <ActionDatePicker
        visible={showPicker}
        title="Chọn hạn chót đề xuất"
        value={selectedDate}
        onChange={(d) => setRequestedDueAt(d.toISOString())}
        onClose={() => setShowPicker(false)}
      />

      <FormField label="Lý do gia hạn" value={reason} onChangeText={setReason} multiline />
      {invalidDate ? <Text style={styles.dangerText}>Ngày mới phải sau hạn chót hiện tại.</Text> : null}
      <SecondaryButton
        disabled={!requestedDueAt || reason.trim().length < 3 || invalidDate}
        loading={pending}
        onPress={() => {
          const due = requestedDueAt;
          const r = reason;
          setRequestedDueAt('');
          setReason('');
          void onSubmit(due, r);
        }}
      >
        Gửi gia hạn ({extensionCount + 1}/2)
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
          <Text style={[styles.body, { marginTop: spacing.xs }]}>
            <Text style={{ fontWeight: '600' }}>Lý do xin gia hạn:</Text> {extension.reason}
          </Text>
          {Boolean(extension.rejectionReason || (extension as any).decisionNote || (extension as any).note) ? (
            <View style={{ marginTop: spacing.xs, backgroundColor: extension.status === 'APPROVED' ? colors.successSoft : colors.dangerSoft, padding: spacing.xs, borderRadius: 6 }}>
              <Text style={{ fontSize: 13, color: extension.status === 'APPROVED' ? colors.successDark : colors.dangerDark, fontWeight: '600' }}>
                Ghi chú duyệt: {extension.rejectionReason || (extension as any).decisionNote || (extension as any).note}
              </Text>
            </View>
          ) : null}
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
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
        <MaterialCommunityIcons name="account-group" size={16} color={colors.muted} />
        <Text style={styles.metaSmall}>Chưa có người nhận việc</Text>
      </View>
    );
  }

  return (
    <View style={{ gap: spacing.xs }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexWrap: 'wrap' }}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginRight: 2 }}>Người thực hiện:</Text>
        {targets.map((t) => {
          const type = t.targetType ?? t.type;
          let icon: keyof typeof MaterialCommunityIcons.glyphMap = 'account';
          let label = type === 'USER' ? 'Cá nhân' : type === 'DEPARTMENT' ? 'Phòng ban' : 'Nhóm';
          if (type === 'DEPARTMENT') icon = 'domain';
          if (type === 'GROUP') icon = 'account-group';
          
          if (type === 'USER') {
            const assignment = assignments.find((a: any) => (a.userId === t.targetId) || (a.user?.id === t.targetId));
            if (assignment?.user?.profile?.fullName) {
              label = assignment.user.profile.fullName;
            } else if (assignment?.user?.fullName) {
              label = assignment.user.fullName;
            } else if (assignment?.user?.userCode) {
              label = assignment.user.userCode;
            }
          }

          return (
            <View key={t.id} style={styles.targetChip}>
              <MaterialCommunityIcons name={icon} size={14} color={colors.primary} />
              <Text style={styles.targetChipText}>{label}</Text>
            </View>
          );
        })}
      </View>
      {assignments.length > 0 && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: 2 }}>
          <MaterialCommunityIcons name="check-all" size={16} color={colors.success} />
          <Text style={[styles.metaSmall, { color: colors.success }]}>{completed} / {assignments.length} người đã hoàn thành</Text>
        </View>
      )}
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
  if (!targets.length) return 'Chưa giao việc';
  const counts = targets.reduce<Record<string, number>>((memo, target) => {
    let type: string = target.targetType ?? target.type ?? '';
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
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
    padding: spacing.md,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
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

  /* Subtask Styles */
  subtaskCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  subtaskCardCompleted: {
    borderColor: '#DCFCE7',
    backgroundColor: '#F0FDF4',
  },
  subtaskHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  subtaskTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  subtaskCode: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 2,
    fontWeight: '600',
  },
  subtaskAssigneeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  subtaskAssigneeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  subtaskAssigneeText: {
    fontSize: 12,
    color: colors.primaryDark,
    fontWeight: '600',
  },
  subtaskDateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  subtaskDateText: {
    fontSize: 11,
    color: colors.muted,
  },
  subtaskProgressWrap: {
    marginTop: spacing.xs,
  },
  subtaskReviewNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    marginTop: spacing.sm,
  },
  subtaskReviewNoticeText: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '600',
  },
  subtaskReviewBtn: {
    backgroundColor: '#D97706',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  subtaskReviewBtnText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

export function SubtaskCardItem({
  subtask,
  onPress,
  onReview,
}: {
  subtask: any;
  onPress: () => void;
  onReview?: () => void;
}) {
  const primaryAssignee = subtask.assignments?.[0]?.user;
  const assigneeName = primaryAssignee?.profile?.fullName ?? primaryAssignee?.userCode ?? 'Chưa gán';
  const assigneeProgress = subtask.assignments?.[0]?.progressPercent ?? 0;
  const isWaitingReview = subtask.status === 'WAITING_REVIEW';
  const isCompleted = subtask.status === 'COMPLETED';

  return (
    <Pressable
      style={({ pressed }) => [
        styles.subtaskCard,
        pressed && { opacity: 0.8 },
        isCompleted && styles.subtaskCardCompleted,
      ]}
      onPress={onPress}
    >
      <View style={styles.subtaskHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.subtaskTitle} numberOfLines={2}>{subtask.title}</Text>
          <Text style={styles.subtaskCode}>{subtask.taskCode ?? 'Việc con'}</Text>
        </View>
        <TaskStatusBadge status={subtask.status} />
      </View>

      <View style={styles.subtaskAssigneeRow}>
        <View style={styles.subtaskAssigneeBadge}>
          <MaterialCommunityIcons name="account-circle-outline" size={16} color={colors.primary} />
          <Text style={styles.subtaskAssigneeText} numberOfLines={1}>{assigneeName}</Text>
        </View>
        {subtask.dueAt ? (
          <View style={styles.subtaskDateBadge}>
            <MaterialCommunityIcons name="clock-outline" size={14} color={colors.muted} />
            <Text style={styles.subtaskDateText}>{formatDateTime(subtask.dueAt)}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.subtaskProgressWrap}>
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.max(0, Math.min(100, assigneeProgress))}%`, backgroundColor: isCompleted ? colors.success : colors.primary },
              ]}
            />
          </View>
          <Text style={styles.progressText}>{assigneeProgress}%</Text>
        </View>
      </View>

      {isWaitingReview && onReview ? (
        <View style={styles.subtaskReviewNotice}>
          <Text style={styles.subtaskReviewNoticeText}>Nhân viên đã nộp kết quả</Text>
          <Pressable style={styles.subtaskReviewBtn} onPress={onReview}>
            <Text style={styles.subtaskReviewBtnText}>Duyệt ngay</Text>
          </Pressable>
        </View>
      ) : null}
    </Pressable>
  );
}

export function TaskStepper({ currentStatus }: { currentStatus: string }) {
  const steps = [
    { key: 'NEW', label: 'Mới giao' },
    { key: 'IN_PROGRESS', label: 'Đang làm' },
    { key: 'WAITING_REVIEW', label: 'Chờ duyệt' },
    { key: 'COMPLETED', label: 'Hoàn thành' },
  ];
  
  const currentIndex = steps.findIndex(s => s.key === currentStatus) || 0;
  
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md, paddingHorizontal: spacing.sm }}>
      {steps.map((step, index) => {
        const isActive = index <= currentIndex;
        const isCurrent = index === currentIndex;
        return (
          <View key={step.key} style={{ alignItems: 'center', flex: 1 }}>
            <View style={{ 
              width: 24, 
              height: 24, 
              borderRadius: 12, 
              backgroundColor: isActive ? colors.primary : colors.border,
              justifyContent: 'center', 
              alignItems: 'center',
              borderWidth: isCurrent ? 2 : 0,
              borderColor: colors.primarySoft
            }}>
              {isActive && <MaterialCommunityIcons name="check" size={14} color="#fff" />}
            </View>
            <Text style={{ fontSize: 10, marginTop: 4, color: isActive ? colors.primary : colors.muted, fontWeight: isCurrent ? '700' : '400', textAlign: 'center' }}>
              {step.label}
            </Text>
            {index < steps.length - 1 && (
              <View style={{ position: 'absolute', right: '-50%', top: 11, width: '100%', height: 2, backgroundColor: isActive ? colors.primary : colors.border, zIndex: -1 }} />
            )}
          </View>
        );
      })}
    </View>
  );
}
