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
import { TaskFilterModal } from '../../components/TaskFilterModal';
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

function getWeekDates(date: Date) {
  const day = date.getDay();
  const sunday = new Date(date);
  sunday.setDate(date.getDate() - day);
  const week = [];
  for (let i = 0; i < 7; i++) {
    const nextDay = new Date(sunday);
    nextDay.setDate(sunday.getDate() + i);
    week.push(nextDay);
  }
  return week;
}

const formatDateOnly = (dateStr?: string | null) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${day} Thg ${month}, ${year}`;
};

function ModernTaskRow({ task, groupType, onPress }: { task: TaskDto; groupType: 'attention' | 'inProgress' | 'completed'; onPress: () => void }) {
  const isCompleted = groupType === 'completed' || task.status === 'COMPLETED';
  const isAttention = groupType === 'attention';
  
  const borderColor = isAttention ? '#EF4444' : (isCompleted ? '#CBD5E1' : '#3B82F6');
  
  const statusInfo = (() => {
    const isLate = task.dueAt && new Date(task.dueAt).getTime() < new Date().setHours(0,0,0,0);
    if (task.status === 'COMPLETED') return { label: 'XONG', color: '#64748B', icon: 'checkmark-circle-outline' as const };
    if (task.status === 'CANCELED') return { label: 'ĐÃ HỦY', color: '#64748B', icon: 'close-circle-outline' as const };
    if (isLate) return { label: 'TRỄ HẠN', color: '#EF4444', icon: 'alert-circle-outline' as const };
    if (task.status === 'NEW') return { label: 'MỚI GIAO', color: '#3B82F6', icon: 'star-outline' as const };
    return { label: 'ĐANG CHẠY', color: '#3B82F6', icon: 'time-outline' as const };
  })();

  const priorityInfo = (() => {
    switch (task.priority) {
      case 'HIGH': return { label: 'Cao', color: '#EF4444', border: '#FECACA' };
      case 'URGENT': return { label: 'Khẩn cấp', color: '#EF4444', border: '#FECACA' };
      case 'LOW': return { label: 'Thấp', color: '#64748B', border: '#E2E8F0' };
      default: return { label: 'Trung bình', color: '#64748B', border: '#E2E8F0' };
    }
  })();
  
  return (
    <Pressable onPress={onPress} style={{ backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#F1F5F9', borderLeftWidth: 3, borderLeftColor: borderColor, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2, marginBottom: 12 }}>
      
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <View style={{ width: 18, height: 18, borderRadius: 4, borderWidth: 1.5, borderColor: isCompleted ? '#94A3B8' : '#CBD5E1', marginRight: 12, alignItems: 'center', justifyContent: 'center', marginTop: 2 }}>
          {isCompleted && <Ionicons name="checkmark" size={12} color="#94A3B8" />}
        </View>

        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: isCompleted ? '#64748B' : '#1E293B', flex: 1, marginRight: 8, lineHeight: 20 }}>{task.title}</Text>
            <Ionicons name="ellipsis-vertical" size={16} color="#94A3B8" />
          </View>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', marginRight: 8 }}>
              <Image source={{ uri: 'https://avatar.iran.liara.run/public' }} style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: '#FFF' }} />
              <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#F1F5F9', borderWidth: 1.5, borderColor: '#FFF', marginLeft: -8, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 10, color: '#64748B', fontWeight: '600' }}>+{Math.max(0, (task.assignments?.length || 1) - 1)}</Text>
              </View>
            </View>
            <Text style={{ fontSize: 11, color: '#64748B' }}>{task.assignments?.length || 1} người thực hiện</Text>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="calendar-outline" size={14} color="#64748B" />
              <Text style={{ fontSize: 12, color: '#64748B' }}>{formatDateOnly(task.dueAt)}</Text>
            </View>
            
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, borderWidth: 1, borderColor: priorityInfo.border }}>
                <Text style={{ fontSize: 10, fontWeight: '600', color: priorityInfo.color }}>{priorityInfo.label}</Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name={statusInfo.icon} size={14} color={statusInfo.color} />
                <Text style={{ fontSize: 10, fontWeight: '700', color: statusInfo.color, textTransform: 'uppercase' }}>
                  {statusInfo.label}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function TaskGroupHeader({ title, dotColor, badgeText, badgeColor, badgeBg }: any) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 12, paddingHorizontal: 4 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {dotColor && <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: dotColor, marginRight: 8 }} />}
        <Text style={{ fontSize: 12, fontWeight: '700', color: dotColor ? '#334155' : '#94A3B8', letterSpacing: 0.5, textTransform: 'uppercase' }}>{title}</Text>
      </View>
      {badgeText ? (
        <View style={{ backgroundColor: badgeBg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 }}>
          <Text style={{ fontSize: 10, fontWeight: '700', color: badgeColor }}>{badgeText}</Text>
        </View>
      ) : null}
    </View>
  );
}

function TaskGroup({ title, type, tasks, defaultOpen = true, onPressTask }: any) {
  const [open, setOpen] = useState(defaultOpen);
  if (tasks.length === 0) return null;

  const isAttention = type === 'attention';
  const isInProgress = type === 'inProgress';

  let dotColor, badgeText, badgeColor, badgeBg;
  if (isAttention) {
    dotColor = '#EF4444';
    badgeText = `${tasks.length} task trễ`;
    badgeColor = '#EF4444';
    badgeBg = '#FEE2E2';
  } else if (isInProgress) {
    dotColor = '#3B82F6';
    badgeText = `${tasks.length} tasks`;
    badgeColor = '#3B82F6';
    badgeBg = '#DBEAFE';
  }

  return (
    <View style={{ marginBottom: 8 }}>
      <Pressable onPress={() => setOpen(!open)}>
        <TaskGroupHeader title={title} dotColor={dotColor} badgeText={badgeText} badgeColor={badgeColor} badgeBg={badgeBg} />
      </Pressable>
      {open && (
        <View style={{ paddingTop: 8 }}>
          {tasks.map((t: any) => (
            <ModernTaskRow key={t.id} task={t} groupType={type} onPress={() => onPressTask(t.id)} />
          ))}
        </View>
      )}
    </View>
  );
}

export function TaskListScreen({ area }: { area: TaskArea }) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  const [showFilter, setShowFilter] = useState(false);
  const [activeFilters, setActiveFilters] = useState<any>({});
  
  const filters: TaskListFilters = { 
    page: 1, limit: 100, 
    ...(search ? { search } : {}),
    ...(activeFilters.departmentId ? { departmentId: activeFilters.departmentId } : {}),
    ...(activeFilters.assignedUserId ? { assignedUserId: activeFilters.assignedUserId } : {}),
    ...(activeFilters.createdById ? { createdById: activeFilters.createdById } : {})
  };
  const tasks = area === 'employee' ? useMyTasks(filters) : useTasks(filters);
  const createRoute = area === 'employee' ? '/employee/tasks/create' : '/admin/tasks/create';

  const groups = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const attentionTasks: TaskDto[] = [];
    const inProgressTasks: TaskDto[] = [];
    const completedTasks: TaskDto[] = [];
    
    (tasks.data?.items || []).forEach(t => {
      if (t.status === 'COMPLETED' || t.status === 'CANCELED') {
        completedTasks.push(t);
        return;
      }
      const isLate = t.dueAt && new Date(t.dueAt).getTime() < today.getTime();
      const isUrgent = t.priority === 'HIGH' || t.priority === 'URGENT';
      if (isLate || isUrgent) {
         attentionTasks.push(t);
      } else {
         inProgressTasks.push(t);
      }
    });
    return { attentionTasks, inProgressTasks, completedTasks };
  }, [tasks.data]);

  const calendarTasks = useMemo(() => {
    return (tasks.data?.items || []).filter(t => {
      if (!t.dueAt) return false;
      const d = new Date(t.dueAt);
      return d.getDate() === selectedDate.getDate() && d.getMonth() === selectedDate.getMonth() && d.getFullYear() === selectedDate.getFullYear();
    });
  }, [tasks.data, selectedDate]);

  const weekDates = useMemo(() => getWeekDates(selectedDate), [selectedDate]);
  const daysOfWeek = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <View style={{ paddingTop: 48, paddingHorizontal: 16, paddingBottom: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#A5B4FC', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFF' }}>PB</Text>
            </View>
            <View>
              <Text style={{ fontSize: 22, fontWeight: '800', color: '#0B3B61' }}>Giao việc</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 14, color: '#98A0A8', marginRight: 4 }}>Việc của tôi</Text>
                <Ionicons name="chevron-down" size={14} color="#98A0A8" />
              </View>
            </View>
          </View>
          <Pressable onPress={() => tasks.refetch()}>
            <Ionicons name="refresh" size={24} color="#0B3B61" />
          </Pressable>
        </View>

        <View style={{ flexDirection: 'row', marginTop: 16, alignItems: 'center', gap: 12 }}>
          <Pressable onPress={() => setViewMode('list')}>
            <Ionicons name="list" size={24} color={viewMode === 'list' ? '#1E88E5' : '#98A0A8'} />
          </Pressable>
          <Pressable onPress={() => setViewMode('calendar')}>
            <Ionicons name="calendar-outline" size={24} color={viewMode === 'calendar' ? '#1E88E5' : '#98A0A8'} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <SearchInput value={search} onChangeText={setSearch} placeholder="Tên công việc..." />
          </View>
          <Pressable onPress={() => setShowFilter(true)} style={{ width: 44, height: 44, backgroundColor: '#E3F2FD', borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="options" size={20} color="#0B3B61" />
            {Object.keys(activeFilters).some(k => activeFilters[k]) && <View style={{ position: 'absolute', bottom: 10, right: 10, width: 6, height: 6, borderRadius: 3, backgroundColor: '#EF4444' }} />}
          </Pressable>
        </View>
      </View>

      {viewMode === 'calendar' && (
        <View style={{ paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F0F4F8' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            {daysOfWeek.map(d => (
              <Text key={d} style={{ width: '14.2%', textAlign: 'center', fontSize: 12, fontWeight: '600', color: '#98A0A8' }}>{d}</Text>
            ))}
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            {weekDates.map((date, idx) => {
              const isSelected = date.getDate() === selectedDate.getDate() && date.getMonth() === selectedDate.getMonth();
              return (
                <Pressable key={idx} onPress={() => setSelectedDate(date)} style={{ width: '14.2%', alignItems: 'center' }}>
                  <Text style={{ fontSize: 16, fontWeight: isSelected ? '700' : '500', color: isSelected ? '#0B3B61' : '#3B4A59', marginBottom: 4 }}>{date.getDate()}</Text>
                  {isSelected && <View style={{ width: 24, height: 4, borderRadius: 2, backgroundColor: '#F0F4F8' }} />}
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }} refreshControl={<RefreshControl refreshing={tasks.isRefetching} onRefresh={() => tasks.refetch()} />}>
        {tasks.isLoading ? <LoadingState /> : null}
        
        {viewMode === 'list' && !tasks.isLoading && (
          <>
            <TaskGroup title="CÔNG VIỆC CẦN CHÚ Ý" type="attention" tasks={groups.attentionTasks} onPressTask={(id: string) => router.push(`/${area}/tasks/${id}`)} />
            <TaskGroup title="ĐANG THỰC HIỆN" type="inProgress" tasks={groups.inProgressTasks} onPressTask={(id: string) => router.push(`/${area}/tasks/${id}`)} />
            <TaskGroup title="HOÀN THÀNH" type="completed" tasks={groups.completedTasks} defaultOpen={false} onPressTask={(id: string) => router.push(`/${area}/tasks/${id}`)} />
            {groups.attentionTasks.length === 0 && groups.inProgressTasks.length === 0 && groups.completedTasks.length === 0 && (
              <EmptyState title="Không có công việc nào" />
            )}
          </>
        )}

        {viewMode === 'calendar' && !tasks.isLoading && (
          <View>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#0B3B61', marginBottom: 12 }}>
              {daysOfWeek[selectedDate.getDay()]}, {String(selectedDate.getDate()).padStart(2, '0')}-Th.{selectedDate.getMonth() + 1}
            </Text>
            {calendarTasks.length === 0 ? (
              <Text style={{ color: '#98A0A8', fontStyle: 'italic' }}>Không có công việc</Text>
            ) : (
              calendarTasks.map(t => (
                <ModernTaskRow key={t.id} task={t} groupType={t.status === 'COMPLETED' || t.status === 'CANCELED' ? 'completed' : (t.dueAt && new Date(t.dueAt).getTime() < new Date().setHours(0,0,0,0) ? 'attention' : 'inProgress')} onPress={() => router.push(`/${area}/tasks/${t.id}`)} />
              ))
            )}
          </View>
        )}
      </ScrollView>
    
      <Pressable 
        style={{ position: 'absolute', bottom: 90, right: 24, width: 64, height: 64, borderRadius: 32, backgroundColor: '#1E88E5', alignItems: 'center', justifyContent: 'center', elevation: 4, shadowColor: '#1E88E5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 }}
        onPress={() => router.push(createRoute)}
      >
        <Ionicons name="add" size={32} color="#FFFFFF" />
      </Pressable>
      
      <BottomNavBar activeTab="tasks" />
      <TaskFilterModal visible={showFilter} onClose={() => setShowFilter(false)} onApply={setActiveFilters} currentFilters={activeFilters} />
    </View>
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
  const extension = useCreateTaskExtension(id ?? '');
  const review = useReviewTaskAssignment(id);
  const extensionReview = useReviewTaskExtension(id);
  const canReview = hasAnyPermission(user, ['task.review_all', 'task.review_department']);
  const canReviewExtension = hasAnyPermission(user, ['task.extension_review_all', 'task.extension_review_department']);

  if (task.isLoading) return <LoadingState label="Đang tải task..." />;
  if (task.isError) return <ErrorState error={task.error} onRetry={() => void task.refetch()} />;
  if (!task.data) return <EmptyState title="Không tìm thấy task" />;
  
  const item = task.data;
  const reviewAssignments = item.assignments?.filter((entry) => entry.status === 'WAITING_REVIEW') ?? [];
  const pendingExtensions = item.extensionRequests?.filter((entry) => entry.status === 'PENDING') ?? [];

  async function run(action: () => Promise<unknown>, success: string) {
    try {
      await action();
      Alert.alert('Thành công', success);
    } catch (error) {
      const normalized = normalizeApiError(error);
      Alert.alert(normalized.code, mapTaskError(normalized.code, normalized.message));
    }
  }

  return (
    <Screen>
      <View style={detailStyles.header}>
        <Pressable onPress={() => router.back()} style={detailStyles.iconBtn}>
          <Ionicons name="chevron-back" size={24} color="#1E88E5" />
        </Pressable>
        <Text style={detailStyles.headerTitle}>Chi Tiết Công Việc</Text>
        <Pressable style={detailStyles.iconBtn}>
          <Ionicons name="ellipsis-vertical" size={24} color="#98A0A8" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={detailStyles.content} showsVerticalScrollIndicator={false}>
        <View style={detailStyles.titleCard}>
          <Text style={detailStyles.taskTitle}>{item.title}</Text>
          <Text style={detailStyles.taskCode}>{item.taskCode ?? item.type}</Text>
          
          <View style={detailStyles.badgeRow}>
            <TaskStatusBadge status={item.status} />
            <PriorityBadge priority={item.priority} />
          </View>
        </View>

        <View style={detailStyles.section}>
          <View style={detailStyles.sectionHeader}>
            <Ionicons name="document-text" size={20} color="#1E88E5" />
            <Text style={detailStyles.sectionTitle}>MÔ TẢ CÔNG VIỆC</Text>
          </View>
          <View style={detailStyles.detailBox}>
            <Text style={detailStyles.detailReasonText}>{item.description ?? 'Không có mô tả'}</Text>
            
            <View style={detailStyles.detailDivider} />
            
            <View style={detailStyles.detailRow}>
              <View style={detailStyles.detailCol}>
                <Text style={detailStyles.detailLabel}>Thời gian bắt đầu</Text>
                <View style={detailStyles.dateWrap}>
                  <Ionicons name="time-outline" size={16} color="#1E88E5" />
                  <Text style={detailStyles.detailValue}>{formatDateTime(item.startAt)}</Text>
                </View>
              </View>
              <View style={detailStyles.detailCol}>
                <Text style={detailStyles.detailLabel}>Thời hạn (Deadline)</Text>
                <View style={detailStyles.dateWrap}>
                  <Ionicons name="calendar-outline" size={16} color="#EF4444" />
                  <Text style={[detailStyles.detailValue, { color: '#EF4444' }]}>{formatDateTime(item.dueAt)}</Text>
                </View>
              </View>
            </View>

            <View style={detailStyles.detailDivider} />
            <Text style={detailStyles.detailLabel}>Tiến độ tổng thể</Text>
            <View style={{ marginTop: 8 }}><ProgressBar value={assignment?.progressPercent ?? averageProgress(item)} /></View>
            {assignment?.reviewNote ? <Text style={styles.warning}>Lưu ý từ quản lý: {assignment.reviewNote}</Text> : null}
          </View>
        </View>

        <TargetPreview task={item} />

        {item.type === 'DEPARTMENT' && (
          <View style={detailStyles.section}>
            <View style={detailStyles.sectionHeader}>
              <Ionicons name="git-network-outline" size={20} color="#1E88E5" />
              <Text style={detailStyles.sectionTitle}>CHIA NHỎ CÔNG VIỆC (Dành cho Leader)</Text>
            </View>
            <View style={detailStyles.detailBox}>
              <View style={{ marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F0F4F8' }}>
                 <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                   <Text style={{ fontSize: 13, color: '#3B4A59', fontWeight: '500' }}>Tiến độ gộp từ các task con</Text>
                   <Text style={{ fontSize: 13, color: '#1E88E5', fontWeight: '700' }}>0%</Text>
                 </View>
                 <ProgressBar value={0} />
              </View>
              
              <View style={{ marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F7FAFC', padding: 12, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: '#E6EEF3' }}>
                   <View style={{ flex: 1 }}>
                     <Text style={{ fontSize: 14, fontWeight: '600', color: '#0B3B61' }}>Thiết kế concept</Text>
                     <Text style={{ fontSize: 12, color: '#98A0A8', marginTop: 4 }}>Người làm: Phùng Thanh Bình</Text>
                   </View>
                   <View style={{ alignItems: 'flex-end' }}>
                     <View style={{ backgroundColor: '#DBEAFE', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginBottom: 4 }}>
                        <Text style={{ fontSize: 10, fontWeight: '700', color: '#1E88E5' }}>ĐANG CHẠY</Text>
                     </View>
                     <Text style={{ fontSize: 12, fontWeight: '700', color: '#1E88E5' }}>50%</Text>
                   </View>
                </View>
                
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F7FAFC', padding: 12, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: '#E6EEF3' }}>
                   <View style={{ flex: 1 }}>
                     <Text style={{ fontSize: 14, fontWeight: '600', color: '#0B3B61' }}>Lên màu chi tiết</Text>
                     <Text style={{ fontSize: 12, color: '#98A0A8', marginTop: 4 }}>Người làm: Nguyễn Minh Tú</Text>
                   </View>
                   <View style={{ alignItems: 'flex-end' }}>
                     <View style={{ backgroundColor: '#F1F5F9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginBottom: 4 }}>
                        <Text style={{ fontSize: 10, fontWeight: '700', color: '#64748B' }}>XONG</Text>
                     </View>
                     <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748B' }}>100%</Text>
                   </View>
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <SecondaryButton onPress={() => Alert.alert('Tính năng', 'Sẽ chuyển đến form giao việc với parentTaskId = ' + item.id)}>
                     + Thêm việc nhỏ
                  </SecondaryButton>
                </View>
                <View style={{ flex: 1 }}>
                  <PrimaryButton onPress={() => run(async () => {}, 'Đã cập nhật trạng thái cha')}>
                     Bắt đầu thực hiện
                  </PrimaryButton>
                </View>
              </View>
            </View>
          </View>
        )}

        {area === 'employee' && assignment ? (
          <View style={detailStyles.section}>
            <View style={detailStyles.sectionHeader}>
              <Ionicons name="person-outline" size={20} color="#1E88E5" />
              <Text style={detailStyles.sectionTitle}>CÔNG VIỆC CỦA TÔI</Text>
            </View>
            <View style={detailStyles.detailBox}>
              <View style={{ marginBottom: 16, alignSelf: 'flex-start' }}><TaskStatusBadge status={assignment.status} /></View>
              
              {canAcceptAssignment(assignment.status) ? <PrimaryButton loading={accept.isPending} onPress={() => void run(() => accept.mutateAsync(assignment.id), 'Đã nhận task')}>Nhận việc</PrimaryButton> : null}
              {canStartAssignment(assignment.status) ? <PrimaryButton loading={start.isPending} onPress={() => void run(() => start.mutateAsync(assignment.id), 'Đã bắt đầu task')}>Bắt đầu làm</PrimaryButton> : null}
              
              {canUpdateProgress(assignment.status) ? (
                <View style={{ marginTop: 12, gap: 12 }}>
                  <FormField label="Cập nhật phần trăm (0-100)" value={progress} onChangeText={setProgress} keyboardType="number-pad" />
                  <SecondaryButton loading={updateProgress.isPending} onPress={() => void run(() => updateProgress.mutateAsync({ assignmentId: assignment.id, payload: { progressPercent: Number(progress) } }), 'Đã cập nhật tiến độ')}>
                    Lưu tiến độ
                  </SecondaryButton>
                </View>
              ) : null}

              {canSubmitAssignment(assignment.status) ? (
                <View style={{ marginTop: 16, gap: 12, borderTopWidth: 1, borderTopColor: '#F0F4F8', paddingTop: 16 }}>
                  <FormField label="Ghi chú hoàn thành" value={completionNote} onChangeText={setCompletionNote} multiline />
                  <PrimaryButton loading={submit.isPending} onPress={() => void run(() => submit.mutateAsync({ assignmentId: assignment.id, payload: { completionNote } }), 'Đã gửi yêu cầu xét duyệt')}>
                    Hoàn thành & Gửi duyệt
                  </PrimaryButton>
                </View>
              ) : null}

              <View style={{ marginTop: 16 }}>
                <ExtensionRequestModal currentDueAt={assignment.assignmentDueAt ?? item.dueAt} pending={extension.isPending} onSubmit={(requestedDueAt, reason) => run(() => extension.mutateAsync({ assignmentId: assignment.id, requestedDueAt, reason }), 'Đã gửi yêu cầu gia hạn')} />
              </View>
            </View>
          </View>
        ) : null}

        {canReview ? (
          <View style={detailStyles.section}>
            <View style={detailStyles.sectionHeader}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#1E88E5" />
              <Text style={detailStyles.sectionTitle}>XÉT DUYỆT (Review)</Text>
            </View>
            {!reviewAssignments.length ? <Text style={detailStyles.emptyText}>Không có task nào chờ duyệt.</Text> : null}
            {reviewAssignments.map((entry) => (
              <View key={entry.id} style={detailStyles.reviewCard}>
                <Text style={detailStyles.reviewName}>{entry.user?.profile?.fullName ?? entry.user?.userCode ?? entry.userId}</Text>
                <ProgressBar value={entry.progressPercent} />
                <View style={{ marginTop: 12 }}>
                  <ReviewActionSheet pending={review.isPending} onApprove={(note) => run(() => review.mutateAsync({ assignmentId: entry.id, action: 'approve', payload: note ? { note } : {} }), 'Đã duyệt task')} onReject={(note) => run(() => review.mutateAsync({ assignmentId: entry.id, action: 'reject', payload: { note } }), 'Đã từ chối task')} />
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {canReviewExtension ? (
           <View style={detailStyles.section}>
            <View style={detailStyles.sectionHeader}>
              <Ionicons name="calendar-outline" size={20} color="#1E88E5" />
              <Text style={detailStyles.sectionTitle}>DUYỆT GIA HẠN</Text>
            </View>
            {!pendingExtensions.length ? <Text style={detailStyles.emptyText}>Không có yêu cầu gia hạn.</Text> : null}
            {pendingExtensions.map((entry) => (
              <View key={entry.id} style={detailStyles.reviewCard}>
                <Text style={detailStyles.reviewName}>Gia hạn tới: {formatDateTime(entry.requestedDueAt)}</Text>
                <Text style={detailStyles.detailReasonText}>{entry.reason}</Text>
                <View style={{ marginTop: 12 }}>
                  <ReviewActionSheet pending={extensionReview.isPending} onApprove={() => run(() => extensionReview.mutateAsync({ id: entry.id, action: 'approve' }), 'Đã duyệt gia hạn')} onReject={(note) => run(() => extensionReview.mutateAsync({ id: entry.id, action: 'reject', payload: { note } }), 'Đã từ chối gia hạn')} />
                </View>
              </View>
            ))}
          </View>
        ) : null}

        <View style={detailStyles.section}>
          <View style={detailStyles.sectionHeader}>
            <Ionicons name="chatbubbles-outline" size={20} color="#1E88E5" />
            <Text style={detailStyles.sectionTitle}>BÌNH LUẬN</Text>
          </View>
          <View style={detailStyles.detailBox}>
            <CommentList comments={item.comments} />
            <CommentComposer pending={comment.isPending} onSubmit={(content) => comment.mutateAsync({ content }).then(() => undefined)} />
          </View>
        </View>

        <View style={detailStyles.section}>
          <View style={detailStyles.sectionHeader}>
            <Ionicons name="attach-outline" size={20} color="#1E88E5" />
            <Text style={detailStyles.sectionTitle}>TỆP ĐÍNH KÈM</Text>
          </View>
          <View style={detailStyles.detailBox}>
            <AttachmentList attachments={item.attachments} />
            <AttachmentPicker pending={attachment.isPending} onAttach={(payload) => attachment.mutateAsync(payload).then(() => undefined)} />
          </View>
        </View>

        <View style={detailStyles.section}>
          <View style={detailStyles.sectionHeader}>
            <Ionicons name="time-outline" size={20} color="#1E88E5" />
            <Text style={detailStyles.sectionTitle}>LỊCH SỬ</Text>
          </View>
          <View style={detailStyles.detailBox}>
            {timeline.isLoading ? <LoadingState label="Đang tải lịch sử..." /> : null}
            {timeline.isError ? <ErrorState error={timeline.error} onRetry={() => void timeline.refetch()} /> : null}
            <TaskTimeline items={timeline.data?.items ?? item.histories} />
          </View>
        </View>

      </ScrollView>
    </Screen>
  );
}

const detailStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F8',
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F7FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0B3B61',
  },
  content: {
    padding: 16,
    paddingBottom: 80,
  },
  titleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E6EEF3',
  },
  taskTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0B3B61',
    marginBottom: 8,
  },
  taskCode: {
    fontSize: 14,
    color: '#98A0A8',
    marginBottom: 16,
    fontWeight: '500',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#98A0A8',
  },
  detailBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6EEF3',
    borderRadius: 16,
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
  },
  detailCol: {
    flex: 1,
    gap: 6,
  },
  detailLabel: {
    fontSize: 12,
    color: '#98A0A8',
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 15,
    color: '#0B3B61',
    fontWeight: '700',
  },
  dateWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailDivider: {
    height: 1,
    backgroundColor: '#F0F4F8',
    marginVertical: 16,
  },
  detailReasonText: {
    fontSize: 14,
    color: '#3B4A59',
    lineHeight: 22,
  },
  emptyText: {
    fontSize: 14,
    color: '#98A0A8',
    fontStyle: 'italic',
    paddingHorizontal: 8,
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6EEF3',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  reviewName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0B3B61',
    marginBottom: 12,
  },
});

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
  const [targetType, setTargetType] = useState<'USER'|'DEPARTMENT'>('USER');
  
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
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#3B4A59', marginBottom: 8 }}>Giao việc cho</Text>
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
               <Pressable onPress={() => setTargetType('USER')} style={{ flex: 1, height: 40, borderRadius: 8, borderWidth: 1, borderColor: targetType === 'USER' ? '#1E88E5' : '#E6EEF3', backgroundColor: targetType === 'USER' ? '#EFF6FF' : '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
                 <Text style={{ fontSize: 14, color: targetType === 'USER' ? '#1E88E5' : '#64748B', fontWeight: targetType === 'USER' ? '600' : '500' }}>Cá nhân</Text>
               </Pressable>
               <Pressable onPress={() => setTargetType('DEPARTMENT')} style={{ flex: 1, height: 40, borderRadius: 8, borderWidth: 1, borderColor: targetType === 'DEPARTMENT' ? '#1E88E5' : '#E6EEF3', backgroundColor: targetType === 'DEPARTMENT' ? '#EFF6FF' : '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
                 <Text style={{ fontSize: 14, color: targetType === 'DEPARTMENT' ? '#1E88E5' : '#64748B', fontWeight: targetType === 'DEPARTMENT' ? '600' : '500' }}>Phòng ban</Text>
               </Pressable>
            </View>
            
            <View style={{ flexDirection: 'row', alignItems: 'center', height: 48, borderWidth: 1, borderColor: '#E6EEF3', borderRadius: 8, paddingHorizontal: 12, backgroundColor: '#FFFFFF', marginBottom: 12 }}>
               <Ionicons name="search" size={20} color="#98A0A8" />
               <Text style={{ flex: 1, fontSize: 14, color: '#98A0A8', marginLeft: 8 }}>
                 {targetType === 'USER' ? 'Tìm tên nhân viên...' : 'Tìm phòng ban...'}
               </Text>
               <Ionicons name="chevron-down" size={20} color="#98A0A8" />
            </View>
            
            {/* Selected Assignees (Chips) */}
            {targetType === 'USER' ? (
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                 <View style={{ flexDirection: 'row', alignItems: 'center', height: 32, backgroundColor: 'rgba(30,136,229,0.08)', borderRadius: 16, paddingHorizontal: 12, gap: 6 }}>
                    <Image source={{ uri: 'https://avatar.iran.liara.run/public' }} style={{ width: 20, height: 20, borderRadius: 10 }} />
                    <Text style={{ fontSize: 13, color: '#0B3B61', fontWeight: '500' }}>Phùng Thanh Bình</Text>
                    <Ionicons name="close" size={14} color="#0B3B61" />
                 </View>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                 <View style={{ flexDirection: 'row', alignItems: 'center', height: 32, backgroundColor: 'rgba(16,185,129,0.08)', borderRadius: 16, paddingHorizontal: 12, gap: 6 }}>
                    <Ionicons name="business" size={14} color="#047857" />
                    <Text style={{ fontSize: 13, color: '#047857', fontWeight: '500' }}>Phòng Kỹ thuật (Leader chịu trách nhiệm)</Text>
                    <Ionicons name="close" size={14} color="#047857" />
                 </View>
              </View>
            )}

            {/* Quick-assign buttons */}
            {targetType === 'USER' && (
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
            )}
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
