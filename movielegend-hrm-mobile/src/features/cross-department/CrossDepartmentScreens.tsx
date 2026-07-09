import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, View, Pressable, TextInput, Modal } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { FormField } from '../../components/FormField';
import { LoadingState } from '../../components/LoadingState';
import { PageHeader } from '../../components/PageHeader';
import { PrimaryButton, SecondaryButton } from '../../components/Buttons';
import { Screen } from '../../components/Screen';
import { ScreenContainer } from '../../components/ScreenContainer';
import { SectionCard } from '../../components/SectionCard';
import { StatusBadge, toneForStatus } from '../../components/StatusBadge';
import { SelectModal, SelectOption } from '../../components/SelectModal';

import { 
  useCrossDepartmentAction, 
  useCreateCrossDepartmentRequest, 
  useCrossDepartmentRequest, 
  useCrossDepartmentRequests 
} from '../../hooks/useCrossDepartment';
import { useDepartments } from '../../hooks/useDepartments';
import { useAuth } from '../../providers/AuthProvider';

import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import type { CrossDepartmentRequestDto } from '../../types/cross-department.types';
import { normalizeApiError } from '../../utils/api-error';
import { formatDateTime } from '../../utils/date-time';
import { hasAnyPermission } from '../../utils/permissions';

type CrossArea = 'employee' | 'leader' | 'admin';

// ==========================================
// 1. LIST SCREEN
// ==========================================
export function CrossDepartmentListScreen({ area, mode = 'all' }: { area: CrossArea; mode?: 'all' | 'incoming' }) {
  const router = useRouter();
  const list = useCrossDepartmentRequests({ page: 1, limit: 100 });
  
  // Custom Tab State
  const [activeTab, setActiveTab] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL'>('ALL');

  const filteredItems = useMemo(() => {
    if (!list.data?.items) return [];
    const items = list.data.items;
    if (activeTab === 'ALL') return items;
    if (activeTab === 'PENDING') return items.filter(i => i.status.includes('PENDING'));
    if (activeTab === 'APPROVED') return items.filter(i => i.status.includes('ACCEPTED') || i.status === 'SOURCE_APPROVED' || i.status === 'COMPLETED');
    if (activeTab === 'REJECTED') return items.filter(i => i.status.includes('REJECTED'));
    return items;
  }, [list.data, activeTab]);

  return (
    <Screen>
      <ScreenContainer refreshControl={<RefreshControl refreshing={list.isRefetching} onRefresh={() => void list.refetch()} />}>
        <PageHeader 
          title="Luân chuyển & Phối hợp" 
          subtitle="Quản lý các yêu cầu liên phòng ban" 
          right={
            area !== 'admin' ? (
              <Pressable style={styles.addBtn} onPress={() => router.push(`/${area}/cross-department/create`)}>
                <MaterialCommunityIcons name="plus" size={20} color="#fff" />
                <Text style={styles.addBtnText}>Tạo mới</Text>
              </Pressable>
            ) : null
          }
        />

        {/* Custom Tabs */}
        <View style={styles.tabsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
            {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((tab) => {
              const isActive = activeTab === tab;
              const labels: any = { ALL: 'Tất cả', PENDING: 'Chờ duyệt', APPROVED: 'Đã duyệt', REJECTED: 'Từ chối' };
              return (
                <Pressable
                  key={tab}
                  style={[styles.tabBtn, isActive && styles.tabBtnActive]}
                  onPress={() => setActiveTab(tab as any)}
                >
                  <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{labels[tab]}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {list.isLoading && <LoadingState />}
        {list.isError && <ErrorState error={list.error} onRetry={() => void list.refetch()} />}

        <View style={styles.listWrap}>
          {filteredItems.map((request) => (
            <CrossDepartmentCard 
              key={request.id} 
              request={request} 
              onPress={() => router.push(`/${area}/cross-department/${request.id}`)} 
            />
          ))}
          {!list.isLoading && filteredItems.length === 0 ? (
            <EmptyState title="Không có yêu cầu nào" message="Không tìm thấy yêu cầu khớp với bộ lọc." />
          ) : null}
        </View>
      </ScreenContainer>
    </Screen>
  );
}

// ==========================================
// 2. CREATE SCREEN
// ==========================================
export function CreateCrossDepartmentScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const departmentsQuery = useDepartments({ page: 1, limit: 100 });
  const mutation = useCreateCrossDepartmentRequest();
  
  const [targetDepartment, setTargetDepartment] = useState<SelectOption | null>(null);
  const [sourceDepartment, setSourceDepartment] = useState<SelectOption | null>(null);
  
  const [taskId, setTaskId] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const [targetModalVisible, setTargetModalVisible] = useState(false);
  const [sourceModalVisible, setSourceModalVisible] = useState(false);

  const isAdmin = user?.roles.includes('ADMIN');

  // Auto-set source for non-admins
  useMemo(() => {
    if (!isAdmin && user?.department) {
      setSourceDepartment({
        id: user.department.id,
        label: user.department.name
      });
    }
  }, [isAdmin, user]);

  const departmentOptions: SelectOption[] = useMemo(() => {
    if (!departmentsQuery.data?.items) return [];
    return departmentsQuery.data.items.map(d => ({
      id: d.id,
      label: d.name,
      subtitle: `Mã: ${d.code}`
    }));
  }, [departmentsQuery.data]);

  async function submit() {
    if (!sourceDepartment || !targetDepartment) return;
    try {
      await mutation.mutateAsync({
        sourceDepartmentId: sourceDepartment.id,
        targetDepartmentId: targetDepartment.id,
        ...(taskId ? { taskId } : {}),
        title,
        content,
      });
      Alert.alert('Thành công', 'Đã tạo yêu cầu liên phòng ban!');
      router.back();
    } catch (error) {
      const normalized = normalizeApiError(error);
      Alert.alert('Lỗi', normalized.message);
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <PageHeader title="Tạo Yêu Cầu" subtitle="Luân chuyển hoặc phối hợp liên phòng ban" />
        
        <SectionCard>
          {isAdmin ? (
            <>
              <Text style={styles.fieldLabel}>Phòng ban Nguồn</Text>
              <Pressable style={styles.selector} onPress={() => setSourceModalVisible(true)}>
                <Text style={sourceDepartment ? styles.selectorText : styles.selectorPlaceholder}>
                  {sourceDepartment ? sourceDepartment.label : 'Chọn phòng ban...'}
                </Text>
                <MaterialCommunityIcons name="chevron-down" size={24} color={colors.muted} />
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.fieldLabel}>Phòng ban Nguồn</Text>
              <View style={[styles.selector, { backgroundColor: colors.background }]}>
                <Text style={styles.selectorText}>{sourceDepartment?.label}</Text>
                <MaterialCommunityIcons name="lock" size={20} color={colors.muted} />
              </View>
            </>
          )}

          <Text style={styles.fieldLabel}>Phòng ban Đích</Text>
          <Pressable style={styles.selector} onPress={() => setTargetModalVisible(true)}>
            <Text style={targetDepartment ? styles.selectorText : styles.selectorPlaceholder}>
              {targetDepartment ? targetDepartment.label : 'Chọn phòng ban...'}
            </Text>
            <MaterialCommunityIcons name="chevron-down" size={24} color={colors.muted} />
          </Pressable>

          <FormField label="Tiêu đề yêu cầu" value={title} onChangeText={setTitle} placeholder="VD: Xin hỗ trợ nhân sự kho" />
          <FormField label="Nội dung / Lý do" value={content} onChangeText={setContent} multiline placeholder="Mô tả chi tiết yêu cầu..." />
          <FormField label="Mã Task liên quan (Tùy chọn)" value={taskId} onChangeText={setTaskId} autoCapitalize="none" placeholder="Nhập ID công việc nếu có" />

          <PrimaryButton
            loading={mutation.isPending}
            disabled={!sourceDepartment || !targetDepartment || title.trim().length < 3 || content.trim().length < 3}
            onPress={() => void submit()}
          >
            Gửi yêu cầu
          </PrimaryButton>
        </SectionCard>
      </ScrollView>

      {/* Modals */}
      <SelectModal
        visible={targetModalVisible}
        title="Chọn phòng ban đích"
        options={departmentOptions}
        selectedValue={targetDepartment?.id}
        onSelect={setTargetDepartment}
        onClose={() => setTargetModalVisible(false)}
      />
      <SelectModal
        visible={sourceModalVisible}
        title="Chọn phòng ban nguồn"
        options={departmentOptions}
        selectedValue={sourceDepartment?.id}
        onSelect={setSourceDepartment}
        onClose={() => setSourceModalVisible(false)}
      />
    </Screen>
  );
}

// ==========================================
// 3. DETAIL SCREEN
// ==========================================
export function CrossDepartmentDetailScreen({ area }: { area: CrossArea }) {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const request = useCrossDepartmentRequest(id);
  const action = useCrossDepartmentAction();
  
  const [rejectReason, setRejectReason] = useState('');
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [pendingActionType, setPendingActionType] = useState<'source-reject' | 'target-reject' | null>(null);

  const canSource = hasAnyPermission(user, ['cross_department.source_approve', 'cross_department.read_all']);
  const canTarget = hasAnyPermission(user, ['cross_department.target_receive', 'cross_department.read_all']);

  async function runAction(next: 'source-approve' | 'source-reject' | 'target-accept' | 'target-reject', reason?: string) {
    try {
      await action.mutateAsync({ id: id ?? '', action: next, payload: { reason: reason ?? '' } });
      Alert.alert('Thành công', 'Đã cập nhật trạng thái yêu cầu');
      setActionModalVisible(false);
      setRejectReason('');
    } catch (error) {
      const normalized = normalizeApiError(error);
      Alert.alert('Lỗi', normalized.message);
    }
  }

  if (request.isLoading) return <LoadingState />;
  if (request.isError) return <ErrorState error={request.error} onRetry={() => void request.refetch()} />;
  if (!request.data) return <EmptyState title="Không tìm thấy yêu cầu" />;
  const item = request.data;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <PageHeader title={item.title} subtitle={item.requestCode ?? item.id} />
        
        <SectionCard>
          <View style={styles.statusWrap}>
            <StatusBadge label={item.status} tone={toneForStatus(item.status)} />
            <Text style={styles.dateText}>{formatDateTime(item.createdAt)}</Text>
          </View>
          
          {/* Department Transfer UI */}
          <View style={styles.transferWrap}>
            <View style={styles.deptBox}>
              <MaterialCommunityIcons name="storefront-outline" size={24} color={colors.primary} />
              <Text style={styles.deptName}>{item.sourceDepartment?.name ?? 'Nguồn'}</Text>
            </View>
            <View style={styles.transferArrow}>
              <MaterialCommunityIcons name="arrow-right-thick" size={20} color={colors.muted} />
            </View>
            <View style={styles.deptBox}>
              <MaterialCommunityIcons name="office-building-outline" size={24} color={colors.primary} />
              <Text style={styles.deptName}>{item.targetDepartment?.name ?? 'Đích'}</Text>
            </View>
          </View>

          <View style={styles.divider} />
          
          <Text style={styles.sectionTitle}>Nội dung yêu cầu</Text>
          <Text style={styles.bodyText}>{item.content}</Text>
          <Text style={styles.metaText}>Người tạo: {item.createdBy?.profile?.fullName ?? item.createdBy?.userCode ?? 'N/A'}</Text>
          
          {item.rejectionReason && (
            <View style={styles.rejectBox}>
              <MaterialCommunityIcons name="alert-circle-outline" size={20} color={colors.warning} />
              <Text style={styles.rejectText}>Lý do từ chối: {item.rejectionReason}</Text>
            </View>
          )}
        </SectionCard>

        {/* Visual Timeline */}
        <CrossDepartmentTimeline request={item} />

        {/* Action Buttons */}
        {area !== 'employee' && (
          <View style={styles.actionSection}>
            {canSource && item.status === 'PENDING_SOURCE_APPROVAL' && (
              <>
                <PrimaryButton loading={action.isPending} onPress={() => void runAction('source-approve')}>Trưởng phòng Nguồn Duyệt</PrimaryButton>
                <SecondaryButton 
                  onPress={() => { setPendingActionType('source-reject'); setActionModalVisible(true); }}
                >
                  Từ chối
                </SecondaryButton>
              </>
            )}
            
            {canTarget && item.status === 'SOURCE_APPROVED' && (
              <>
                <PrimaryButton loading={action.isPending} onPress={() => void runAction('target-accept')}>Trưởng phòng Đích Nhận</PrimaryButton>
                <SecondaryButton 
                  onPress={() => { setPendingActionType('target-reject'); setActionModalVisible(true); }}
                >
                  Từ chối nhận
                </SecondaryButton>
              </>
            )}
          </View>
        )}
      </ScrollView>

      {/* Reject Modal */}
      <Modal visible={actionModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Từ chối yêu cầu</Text>
            <Text style={styles.modalDesc}>Vui lòng nhập lý do từ chối để thông báo cho người gửi.</Text>
            
            <TextInput
              style={styles.reasonInput}
              placeholder="Nhập lý do..."
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline
            />
            
            <View style={styles.modalActions}>
              <Pressable style={styles.modalBtnCancel} onPress={() => setActionModalVisible(false)}>
                <Text style={styles.modalBtnCancelText}>Hủy</Text>
              </Pressable>
              <Pressable 
                style={[styles.modalBtnConfirm, (!rejectReason.trim()) && { opacity: 0.5 }]} 
                disabled={!rejectReason.trim()}
                onPress={() => {
                  if (pendingActionType) {
                    void runAction(pendingActionType, rejectReason);
                  }
                }}
              >
                <Text style={styles.modalBtnConfirmText}>Xác nhận từ chối</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

// ==========================================
// 4. COMPONENTS
// ==========================================
export function CrossDepartmentTimeline({ request }: { request: CrossDepartmentRequestDto }) {
  const steps = [
    { key: 'PENDING_SOURCE_APPROVAL', label: 'Chờ PB Nguồn duyệt' },
    { key: 'SOURCE_APPROVED', label: 'Chờ PB Đích nhận' },
    { key: 'TARGET_ACCEPTED', label: 'Đã hoàn tất' }
  ];

  // Helper to determine if a step is past, current, or future
  const getStepStatus = (stepKey: string) => {
    if (request.status.includes('REJECTED')) {
      if (request.status === 'SOURCE_REJECTED' && stepKey === 'PENDING_SOURCE_APPROVAL') return 'rejected';
      if (request.status === 'TARGET_REJECTED' && stepKey === 'SOURCE_APPROVED') return 'rejected';
      return 'past'; // If rejected later, previous steps are past
    }
    if (request.status === 'TARGET_ACCEPTED' || request.status === 'COMPLETED') return 'past';
    if (request.status === stepKey) return 'current';
    
    const currentIndex = steps.findIndex(s => s.key === request.status);
    const thisIndex = steps.findIndex(s => s.key === stepKey);
    return thisIndex < currentIndex ? 'past' : 'future';
  };

  return (
    <SectionCard title="Tiến trình duyệt">
      {steps.map((step, idx) => {
        const status = getStepStatus(step.key);
        const isLast = idx === steps.length - 1;
        
        let color = colors.border;
        let icon = 'circle-outline';
        
        if (status === 'past') { color = colors.primary; icon = 'check-circle'; }
        if (status === 'current') { color = colors.warning; icon = 'clock-outline'; }
        if (status === 'rejected') { color = colors.danger; icon = 'close-circle'; }

        return (
          <View key={step.key} style={styles.timelineRow}>
            <View style={styles.timelineIconWrap}>
              <MaterialCommunityIcons name={icon as any} size={24} color={color} />
              {!isLast && <View style={[styles.timelineLine, { backgroundColor: status === 'past' ? colors.primary : colors.border }]} />}
            </View>
            <View style={styles.timelineTextWrap}>
              <Text style={[styles.timelineLabel, { color: status === 'future' ? colors.muted : colors.text }]}>{step.label}</Text>
            </View>
          </View>
        );
      })}
    </SectionCard>
  );
}

function CrossDepartmentCard({ request, onPress }: { request: CrossDepartmentRequestDto; onPress: () => void }) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardCode}>{request.requestCode ?? 'REQ-XXX'}</Text>
        <StatusBadge label={request.status} tone={toneForStatus(request.status)} />
      </View>
      
      <Text style={styles.cardTitle} numberOfLines={2}>{request.title}</Text>
      
      <View style={styles.cardDepts}>
        <Text style={styles.cardDeptName} numberOfLines={1}>{request.sourceDepartment?.name ?? 'PB Nguồn'}</Text>
        <MaterialCommunityIcons name="arrow-right" size={16} color={colors.muted} style={{ marginHorizontal: 4 }} />
        <Text style={styles.cardDeptName} numberOfLines={1}>{request.targetDepartment?.name ?? 'PB Đích'}</Text>
      </View>
    </Pressable>
  );
}

// ==========================================
// STYLES
// ==========================================
const styles = StyleSheet.create({
  content: { gap: spacing.lg, padding: spacing.lg },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addBtnText: { color: '#fff', fontSize: 13, fontWeight: '700', marginLeft: 4 },
  
  // Tabs
  tabsContainer: {
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  tabsScroll: { gap: spacing.sm },
  tabBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabBtnActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  tabText: { fontSize: 14, fontWeight: '600', color: colors.muted },
  tabTextActive: { color: colors.primaryDark },
  
  listWrap: { gap: spacing.md },
  
  // Card
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  cardCode: { fontSize: 12, fontWeight: '700', color: colors.muted },
  cardTitle: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: spacing.sm },
  cardDepts: { flexDirection: 'row', alignItems: 'center' },
  cardDeptName: { fontSize: 13, fontWeight: '600', color: colors.text, flex: 1 },
  
  // Form fields
  fieldLabel: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: spacing.xs, marginTop: spacing.md },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md,
    backgroundColor: colors.background,
  },
  selectorText: { fontSize: 15, color: colors.text },
  selectorPlaceholder: { fontSize: 15, color: colors.muted },
  
  // Detail
  statusWrap: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  dateText: { fontSize: 13, color: colors.muted },
  transferWrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.background, borderRadius: 12, padding: spacing.md },
  deptBox: { flex: 1, alignItems: 'center', gap: 4 },
  deptName: { fontSize: 14, fontWeight: '700', color: colors.text, textAlign: 'center' },
  transferArrow: { paddingHorizontal: spacing.sm },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.lg },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: colors.text, marginBottom: spacing.sm },
  bodyText: { fontSize: 15, lineHeight: 22, color: colors.text, marginBottom: spacing.md },
  metaText: { fontSize: 13, color: colors.muted, fontStyle: 'italic' },
  rejectBox: { marginTop: spacing.md, padding: spacing.md, backgroundColor: colors.dangerSoft, borderRadius: 8, flexDirection: 'row', gap: spacing.sm },
  rejectText: { fontSize: 14, color: colors.danger, flex: 1, fontWeight: '500' },
  actionSection: { gap: spacing.md, marginTop: spacing.lg },
  
  // Timeline
  timelineRow: { flexDirection: 'row', minHeight: 60 },
  timelineIconWrap: { width: 30, alignItems: 'center' },
  timelineLine: { width: 2, flex: 1, marginVertical: 4 },
  timelineTextWrap: { flex: 1, paddingLeft: spacing.md, paddingTop: 2 },
  timelineLabel: { fontSize: 15, fontWeight: '600' },
  
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: spacing.xl },
  modalContent: { backgroundColor: colors.surface, borderRadius: 24, padding: spacing.xl },
  modalTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: spacing.xs },
  modalDesc: { fontSize: 14, color: colors.muted, marginBottom: spacing.lg },
  reasonInput: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: spacing.md, height: 100, textAlignVertical: 'top', fontSize: 15, marginBottom: spacing.xl },
  modalActions: { flexDirection: 'row', gap: spacing.md },
  modalBtnCancel: { flex: 1, padding: spacing.md, alignItems: 'center', borderRadius: 12, backgroundColor: colors.background },
  modalBtnCancelText: { fontSize: 15, fontWeight: '700', color: colors.muted },
  modalBtnConfirm: { flex: 1, padding: spacing.md, alignItems: 'center', borderRadius: 12, backgroundColor: colors.danger },
  modalBtnConfirmText: { fontSize: 15, fontWeight: '700', color: colors.surface },
});
