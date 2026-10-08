import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {RefreshControl, ScrollView, StyleSheet, Text, View, Pressable, TextInput, Modal, Image, ActivityIndicator} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { uploadFile } from '../../api/uploads.api';

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

import { AttachmentList } from '../tasks/TaskComponents';
import { 
  useCrossDepartmentAction, 
  useCreateCrossDepartmentRequest, 
  useCrossDepartmentRequest, 
  useCrossDepartmentRequests 
} from '../../hooks/useCrossDepartment';
import { useDepartments } from '../../hooks/useDepartments';
import { useEmployees } from '../../hooks/useEmployees';
import { useAuth } from '../../providers/AuthProvider';

import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import type { CrossDepartmentRequestDto } from '../../types/cross-department.types';
import { normalizeApiError } from '../../utils/api-error';
import { formatDateTime } from '../../utils/date-time';
import { hasAnyPermission } from '../../utils/permissions';
import { CustomAlert } from '../../components/CustomAlert';

type CrossArea = 'employee' | 'leader' | 'admin' | 'hr';

// ==========================================
// 1. LIST SCREEN
// ==========================================
export function CrossDepartmentListScreen({ area, mode = 'all' }: { area: CrossArea; mode?: 'all' | 'incoming' }) {
  const router = useRouter();
  const [directionTab, setDirectionTab] = useState<'outgoing' | 'incoming' | 'all'>(mode === 'incoming' ? 'incoming' : 'outgoing');
  const [activeTab, setActiveTab] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL'>('ALL');
  const [statusFilterModalVisible, setStatusFilterModalVisible] = useState(false);

  const list = useCrossDepartmentRequests({ 
    page: 1, 
    limit: 100, 
    type: directionTab !== 'all' ? directionTab : undefined 
  });

  const filteredItems = useMemo(() => {
    if (!list.data?.items) return [];
    const items = list.data.items;
    if (activeTab === 'ALL') return items;
    if (activeTab === 'PENDING') return items.filter(i => i.status.includes('PENDING'));
    if (activeTab === 'APPROVED') return items.filter(i => i.status.includes('ACCEPTED') || i.status === 'SOURCE_APPROVED' || i.status === 'COMPLETED');
    if (activeTab === 'REJECTED') return items.filter(i => i.status.includes('REJECTED'));
    return items;
  }, [list.data, activeTab]);

  const activeStatusLabel = useMemo(() => {
    if (activeTab === 'PENDING') return 'Chờ duyệt';
    if (activeTab === 'APPROVED') return 'Đã duyệt';
    if (activeTab === 'REJECTED') return 'Từ chối';
    return 'Tất cả trạng thái';
  }, [activeTab]);

  return (
    <Screen>
      {/* 1. Header (Back button + Title on same row) */}
      <View style={crossListStyles.header}>
        <View style={crossListStyles.headerTop}>
          <View style={crossListStyles.headerRow}>
            <Pressable 
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/admin/(tabs)' as any))} 
              style={crossListStyles.backBtn} 
              hitSlop={8}
            >
              <MaterialCommunityIcons name="chevron-left" size={26} color="#0F172A" />
            </Pressable>
            <Text style={crossListStyles.headerTitle}>Luân chuyển & phối hợp</Text>
          </View>
          {area !== 'admin' && (
            <Pressable style={crossListStyles.headerAddBtn} onPress={() => router.push(`/${area}/cross-department/create`)}>
              <MaterialCommunityIcons name="plus" size={16} color="#fff" />
              <Text style={crossListStyles.headerAddText}>Tạo mới</Text>
            </Pressable>
          )}
        </View>
        <Text style={crossListStyles.headerSubtitle}>Quản lý yêu cầu liên phòng ban</Text>
      </View>

      {/* 2. Segmented Tabs (Đã gửi | Yêu cầu đến | Tất cả) */}
      <View style={crossListStyles.segmentedContainer}>
        <Pressable
          style={[crossListStyles.segmentBtn, directionTab === 'outgoing' && crossListStyles.segmentBtnActive]}
          onPress={() => setDirectionTab('outgoing')}
        >
          <Text style={[crossListStyles.segmentText, directionTab === 'outgoing' && crossListStyles.segmentTextActive]}>
            Đã gửi
          </Text>
        </Pressable>

        <Pressable
          style={[crossListStyles.segmentBtn, directionTab === 'incoming' && crossListStyles.segmentBtnActive]}
          onPress={() => setDirectionTab('incoming')}
        >
          <Text style={[crossListStyles.segmentText, directionTab === 'incoming' && crossListStyles.segmentTextActive]}>
            Yêu cầu đến
          </Text>
        </Pressable>

        <Pressable
          style={[crossListStyles.segmentBtn, directionTab === 'all' && crossListStyles.segmentBtnActive]}
          onPress={() => setDirectionTab('all')}
        >
          <Text style={[crossListStyles.segmentText, directionTab === 'all' && crossListStyles.segmentTextActive]}>
            Tất cả
          </Text>
        </Pressable>
      </View>

      {/* 3. Status Filter Dropdown Pill */}
      <View style={crossListStyles.filterPillRow}>
        <Pressable 
          style={crossListStyles.statusDropdownPill}
          onPress={() => setStatusFilterModalVisible(true)}
        >
          <MaterialCommunityIcons name="filter-variant" size={16} color="#475569" />
          <Text style={crossListStyles.statusDropdownText}>
            Trạng thái: {activeStatusLabel}
          </Text>
          <MaterialCommunityIcons name="chevron-down" size={16} color="#475569" />
        </Pressable>
      </View>

      {/* 4. Content List or Empty State */}
      {list.isLoading ? (
        <View style={crossListStyles.centerBox}>
          <ActivityIndicator size="large" color="#1B382B" />
        </View>
      ) : list.isError ? (
        <View style={crossListStyles.centerBox}>
          <Text style={{ color: '#EF4444', marginBottom: 12 }}>Có lỗi xảy ra khi tải dữ liệu</Text>
          <Pressable style={crossListStyles.resetFilterBtn} onPress={() => void list.refetch()}>
            <Text style={crossListStyles.resetFilterText}>Thử lại</Text>
          </Pressable>
        </View>
      ) : filteredItems.length === 0 ? (
        <ScrollView
          contentContainerStyle={crossListStyles.emptyContainer}
          refreshControl={<RefreshControl refreshing={list.isRefetching} onRefresh={() => void list.refetch()} />}
        >
          <View style={crossListStyles.emptyIconBg}>
            <MaterialCommunityIcons name="inbox-arrow-down-outline" size={38} color="#166534" />
          </View>
          <Text style={crossListStyles.emptyTitle}>Không có yêu cầu phù hợp</Text>
          <Text style={crossListStyles.emptySubtitle}>
            Không tìm thấy yêu cầu nào theo bộ lọc hiện tại. Thử chọn trạng thái hoặc tab khác.
          </Text>
          <Pressable 
            style={crossListStyles.resetFilterBtn}
            onPress={() => {
              setActiveTab('ALL');
              setDirectionTab('all');
            }}
          >
            <Text style={crossListStyles.resetFilterText}>Đặt lại bộ lọc</Text>
          </Pressable>
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={crossListStyles.listContent}
          refreshControl={<RefreshControl refreshing={list.isRefetching} onRefresh={() => void list.refetch()} />}
          showsVerticalScrollIndicator={false}
        >
          {filteredItems.map((request) => (
            <CrossDepartmentCard 
              key={request.id} 
              request={request} 
              onPress={() => router.push(`/${area}/cross-department/${request.id}`)} 
            />
          ))}
        </ScrollView>
      )}

      {/* Status Filter Modal */}
      <Modal visible={statusFilterModalVisible} transparent animationType="fade">
        <Pressable 
          style={crossListStyles.modalBackdrop} 
          onPress={() => setStatusFilterModalVisible(false)}
        >
          <View style={crossListStyles.modalCard}>
            <Text style={crossListStyles.modalTitle}>Chọn trạng thái</Text>
            {[
              { key: 'ALL', label: 'Tất cả trạng thái' },
              { key: 'PENDING', label: 'Chờ duyệt' },
              { key: 'APPROVED', label: 'Đã duyệt / Tiến độ' },
              { key: 'REJECTED', label: 'Từ chối' },
            ].map((opt) => (
              <Pressable
                key={opt.key}
                style={[
                  crossListStyles.modalOption,
                  activeTab === opt.key && crossListStyles.modalOptionActive,
                ]}
                onPress={() => {
                  setActiveTab(opt.key as any);
                  setStatusFilterModalVisible(false);
                }}
              >
                <Text
                  style={[
                    crossListStyles.modalOptionText,
                    activeTab === opt.key && crossListStyles.modalOptionTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
                {activeTab === opt.key && (
                  <MaterialCommunityIcons name="check" size={18} color="#166534" />
                )}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
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

  const isPowerUser = user?.roles.includes('ADMIN') || user?.roles.includes('HR');

  // Auto-set source department if available
  useEffect(() => {
    if (user?.department && !sourceDepartment) {
      setSourceDepartment({
        id: user.department.id,
        label: user.department.name
      });
    }
  }, [user?.department]);

  const departmentOptions: SelectOption[] = useMemo(() => {
    if (!departmentsQuery.data?.items) return [];
    return departmentsQuery.data.items?.map(d => ({
      id: d.id,
      label: d.name,
      subtitle: `Mã: ${d.code}${d.branch?.name ? ` • Cơ sở: ${d.branch.name}` : ''}`,
    }));
  }, [departmentsQuery.data]);

  const [attachmentUri, setAttachmentUri] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [attachmentName, setAttachmentName] = useState<string | null>(null);
  const [attachmentMime, setAttachmentMime] = useState<string | null>(null);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setAttachmentUri(result.assets[0].uri);
      setAttachmentName(result.assets[0].fileName || 'image.jpg');
      setAttachmentMime(result.assets[0].mimeType || 'image/jpeg');
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setAttachmentUri(result.assets[0].uri);
        setAttachmentName(result.assets[0].name || 'document');
        setAttachmentMime(result.assets[0].mimeType || 'application/octet-stream');
      }
    } catch (err) {
      console.error(err);
    }
  };

  async function submit() {
    if (!sourceDepartment) {
      CustomAlert.alert('Thông báo', 'Vui lòng chọn Phòng ban nguồn.');
      return;
    }
    if (!targetDepartment) {
      CustomAlert.alert('Thông báo', 'Vui lòng chọn Phòng ban đích.');
      return;
    }
    if (sourceDepartment.id === targetDepartment.id) {
      CustomAlert.alert('Thông báo', 'Phòng ban nguồn và phòng ban đích không được trùng nhau.');
      return;
    }
    if (!title.trim() || title.trim().length < 3) {
      CustomAlert.alert('Thông báo', 'Tiêu đề yêu cầu phải có ít nhất 3 ký tự.');
      return;
    }
    if (!content.trim() || content.trim().length < 3) {
      CustomAlert.alert('Thông báo', 'Nội dung yêu cầu phải có ít nhất 3 ký tự.');
      return;
    }

    try {
      setIsUploading(true);
      let finalContent = content.trim();
      if (attachmentUri) {
        const uploaded = await uploadFile({
          uri: attachmentUri,
          name: attachmentName || attachmentUri.split('/').pop() || 'request-attachment',
          mimeType: attachmentMime || 'application/octet-stream',
          purpose: 'TASK_ATTACHMENT',
        });
        const fileUrl = uploaded.fileUrl || (uploaded as any).url;
        if (fileUrl) {
          finalContent += `\n\n[File đính kèm]: ${fileUrl}`;
        }
      }
      setIsUploading(false);

      await mutation.mutateAsync({
        sourceDepartmentId: sourceDepartment.id,
        targetDepartmentId: targetDepartment.id,
        ...(taskId ? { taskId } : {}),
        title: title.trim(),
        content: finalContent,
      });
      CustomAlert.alert('Thành công', 'Đã tạo yêu cầu liên phòng ban!');
      router.back();
    } catch (error) {
      setIsUploading(false);
      const normalized = normalizeApiError(error);
      CustomAlert.alert('Lỗi', normalized.message);
    }
  }

  const canSelectSource = isPowerUser || !user?.department;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <PageHeader title="Tạo Yêu Cầu" subtitle="Luân chuyển hoặc phối hợp liên phòng ban" />
        
        <SectionCard>
          {canSelectSource ? (
            <>
              <Text style={styles.fieldLabel}>Phòng ban Nguồn *</Text>
              <Pressable style={styles.selector} onPress={() => setSourceModalVisible(true)}>
                <Text style={sourceDepartment ? styles.selectorText : styles.selectorPlaceholder}>
                  {sourceDepartment ? sourceDepartment.label : 'Chọn phòng ban nguồn...'}
                </Text>
                <MaterialCommunityIcons name="chevron-down" size={24} color={colors.muted} />
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.fieldLabel}>Phòng ban Nguồn *</Text>
              <View style={[styles.selector, { backgroundColor: colors.background }]}>
                <Text style={styles.selectorText}>{sourceDepartment?.label || 'Chưa xác định'}</Text>
                <MaterialCommunityIcons name="lock" size={20} color={colors.muted} />
              </View>
            </>
          )}

          <Text style={styles.fieldLabel}>Phòng ban Đích *</Text>
          <Pressable style={styles.selector} onPress={() => setTargetModalVisible(true)}>
            <Text style={targetDepartment ? styles.selectorText : styles.selectorPlaceholder}>
              {targetDepartment ? targetDepartment.label : 'Chọn phòng ban đích...'}
            </Text>
            <MaterialCommunityIcons name="chevron-down" size={24} color={colors.muted} />
          </Pressable>

          <FormField label="Tiêu đề yêu cầu *" value={title} onChangeText={setTitle} placeholder="VD: Xin hỗ trợ nhân sự kho" />
          <FormField label="Nội dung / Lý do *" value={content} onChangeText={setContent} multiline placeholder="Mô tả chi tiết yêu cầu..." />
          <FormField label="Mã Task liên quan (Tùy chọn)" value={taskId} onChangeText={setTaskId} autoCapitalize="none" placeholder="Nhập ID công việc nếu có" />

          {/* Attachment Selection */}
          <Text style={styles.fieldLabel}>Tài liệu / Ảnh đính kèm (Tùy chọn)</Text>
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md }}>
            <Pressable 
              style={{ 
                flex: 1,
                flexDirection: 'row', 
                alignItems: 'center', 
                justifyContent: 'center',
                gap: 6, 
                padding: 10, 
                borderWidth: 1, 
                borderColor: colors.primary, 
                borderRadius: 10, 
                backgroundColor: colors.primarySoft 
              }}
              onPress={() => void pickImage()}
            >
              <MaterialCommunityIcons name="image-outline" size={18} color={colors.primary} />
              <Text style={{ fontSize: 13, fontWeight: '700', color: colors.primary }}>Chọn ảnh</Text>
            </Pressable>

            <Pressable 
              style={{ 
                flex: 1,
                flexDirection: 'row', 
                alignItems: 'center', 
                justifyContent: 'center',
                gap: 6, 
                padding: 10, 
                borderWidth: 1, 
                borderColor: colors.primary, 
                borderRadius: 10, 
                backgroundColor: colors.primarySoft 
              }}
              onPress={() => void pickDocument()}
            >
              <MaterialCommunityIcons name="file-document-outline" size={18} color={colors.primary} />
              <Text style={{ fontSize: 13, fontWeight: '700', color: colors.primary }}>Chọn file / PDF</Text>
            </Pressable>
          </View>

          {attachmentUri && (
            <View style={{ marginBottom: spacing.md, padding: spacing.xs, backgroundColor: colors.surface, borderRadius: 8, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <MaterialCommunityIcons name="file-check-outline" size={20} color={colors.primary} />
              <Text style={{ flex: 1, fontSize: 13, fontWeight: '600', color: colors.text }} numberOfLines={1}>
                {attachmentName || 'Tệp đính kèm'}
              </Text>
              <Pressable 
                onPress={() => {
                  setAttachmentUri(null);
                  setAttachmentName(null);
                  setAttachmentMime(null);
                }}
              >
                <MaterialCommunityIcons name="close-circle-outline" size={20} color={colors.error} />
              </Pressable>
            </View>
          )}

          <PrimaryButton
            loading={mutation.isPending || isUploading}
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

  // Fetch employees for target department (Called unconditionally at top level)
  const targetDepartmentId = request.data?.targetDepartmentId;
  const employeesQuery = useEmployees({ departmentId: targetDepartmentId, page: 1, limit: 100 }, Boolean(targetDepartmentId));
  
  const [rejectReason, setRejectReason] = useState('');
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [pendingActionType, setPendingActionType] = useState<'source-reject' | 'target-reject' | null>(null);

  // Employee Selection Modal State
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  
  // Custom Input Modal State
  const [inputModalVisible, setInputModalVisible] = useState(false);
  const [inputModalTitle, setInputModalTitle] = useState('');
  const [inputModalDesc, setInputModalDesc] = useState('');
  const [inputModalPlaceholder, setInputModalPlaceholder] = useState('');
  const [inputModalValue, setInputModalValue] = useState('');
  const [inputActionType, setInputActionType] = useState<'update-progress' | 'submit' | 'complete' | null>(null);

  // File/Image Attachment State
  const [selectedAttachmentUri, setSelectedAttachmentUri] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [selectedMimeType, setSelectedMimeType] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setSelectedAttachmentUri(result.assets[0].uri);
      setSelectedFileName(result.assets[0].fileName || 'image.jpg');
      setSelectedMimeType(result.assets[0].mimeType || 'image/jpeg');
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedAttachmentUri(result.assets[0].uri);
        setSelectedFileName(result.assets[0].name || 'file');
        setSelectedMimeType(result.assets[0].mimeType || 'application/octet-stream');
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (request.isLoading) return <LoadingState />;
  if (request.isError) return <ErrorState error={request.error} onRetry={() => void request.refetch()} />;
  if (!request.data) return <EmptyState title="Không tìm thấy yêu cầu" />;
  const item = request.data;

  // Target department employee options
  const employeeOptions: SelectOption[] = (employeesQuery.data?.items ?? []).map(emp => ({
    id: emp.id,
    label: emp.profile?.fullName || emp.userCode || 'Nhân viên',
    subtitle: `Mã NV: ${emp.userCode}`
  }));

  const isAdmin = user?.roles.includes('ADMIN');
  const isHR = user?.roles.includes('HR');

  const isSourceSide = item.createdByUserId === user?.id || (Boolean(user?.department?.id) && user?.department?.id === item.sourceDepartmentId);
  const isTargetSide = Boolean(user?.department?.id) && user?.department?.id === item.targetDepartmentId;

  // Source side actions (Source approve / Complete & Rate)
  const canSource = isAdmin || (isHR && isSourceSide) || (isSourceSide && hasAnyPermission(user, ['cross_department.source_approve', 'cross_department.read_all']));

  // Target side actions (Target accept / Assign target employee)
  const canTarget = isAdmin || isTargetSide || (
    !isSourceSide && hasAnyPermission(user, ['cross_department.target_receive', 'cross_department.read_all'])
  );

  async function runAction(next: 'source-approve' | 'source-reject' | 'target-accept' | 'target-reject', reason?: string) {
    try {
      await action.mutateAsync({ id: id ?? '', action: next, payload: { reason: reason ?? '' } });
      CustomAlert.alert('Thành công', 'Đã cập nhật trạng thái yêu cầu');
      setActionModalVisible(false);
      setRejectReason('');
    } catch (error) {
      const normalized = normalizeApiError(error);
      CustomAlert.alert('Lỗi', normalized.message);
    }
  }

  function openInputModal(type: 'update-progress' | 'submit' | 'complete') {
    setInputActionType(type);
    setInputModalValue('');
    setSelectedAttachmentUri(null);
    setSelectedFileName(null);
    setSelectedMimeType(null);
    if (type === 'update-progress') {
      setInputModalTitle('Cập nhật tiến độ');
      setInputModalDesc('Nhập % hoàn thành công việc (từ 0 đến 100):');
      setInputModalPlaceholder('Ví dụ: 50');
    } else if (type === 'submit') {
      setInputModalTitle('Nộp kết quả');
      setInputModalDesc('Nhập tóm tắt kết quả công việc & đính kèm minh chứng:');
      setInputModalPlaceholder('Mô tả kết quả công việc...');
    } else if (type === 'complete') {
      setInputModalTitle('Nghiệm thu & Đánh giá');
      setInputModalDesc('Nhập điểm đánh giá chất lượng (từ 1 đến 5 sao):');
      setInputModalPlaceholder('Nhập 5');
    }
    setInputModalVisible(true);
  }

  async function handleInputModalSubmit() {
    if (!inputActionType) return;
    try {
      setIsUploading(true);
      let attachmentUrl = '';
      if (selectedAttachmentUri) {
        const uploaded = await uploadFile({
          uri: selectedAttachmentUri,
          name: selectedFileName || selectedAttachmentUri.split('/').pop() || 'result-attachment',
          mimeType: selectedMimeType || 'application/octet-stream',
          purpose: 'TASK_ATTACHMENT',
        });
        attachmentUrl = uploaded.fileUrl || (uploaded as any).url;
      }

      if (inputActionType === 'update-progress') {
        const progress = parseInt(inputModalValue || '0', 10);
        await action.mutateAsync({ id: item.id, action: 'update-progress', payload: { progress } });
      } else if (inputActionType === 'submit') {
        let finalSummary = inputModalValue.trim();
        if (attachmentUrl) {
          finalSummary += (finalSummary ? '\n\n' : '') + `[File đính kèm]: ${attachmentUrl}`;
        }
        await action.mutateAsync({ id: item.id, action: 'submit', payload: { resultSummary: finalSummary } });
      } else if (inputActionType === 'complete') {
        const rating = parseInt(inputModalValue || '5', 10);
        await action.mutateAsync({ id: item.id, action: 'complete', payload: { rating } });
      }
      setIsUploading(false);
      CustomAlert.alert('Thành công', 'Cập nhật trạng thái thành công!');
      setInputModalVisible(false);
      setSelectedAttachmentUri(null);
      setSelectedFileName(null);
      setSelectedMimeType(null);
    } catch (error) {
      setIsUploading(false);
      const normalized = normalizeApiError(error);
      CustomAlert.alert('Lỗi', normalized.message);
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <PageHeader title={item.title} subtitle={item.requestCode ?? item.id} />
        
        <SectionCard>
          <View style={styles.statusWrap}>
            <StatusBadge label={statusToVietnamese(item.status)} tone={toneForStatus(item.status)} />
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
          <Text style={styles.bodyText}>{item.content.replace(/\[File đính kèm\]:\s*\S+/g, '').trim()}</Text>
          {item.content.includes('[File đính kèm]:') && (
            <View style={{ marginBottom: spacing.md, width: '100%' }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 6 }}>Tài liệu / Minh chứng đính kèm ban đầu:</Text>
              {(() => {
                const url = item.content.split('[File đính kèm]:')[1].trim();
                const fileName = url.split('/').pop() || 'tai_lieu_dinh_kem';
                const isImage = /\.(jpg|jpeg|png|gif|webp|heic)$/i.test(fileName);
                return (
                  <AttachmentList 
                    attachments={[{
                      id: 'initial_attachment',
                      taskId: item.id,
                      uploadedByUserId: item.createdByUserId,
                      type: isImage ? 'FILE' : 'FILE',
                      fileName: fileName,
                      fileUrl: url,
                      mimeType: isImage ? 'image/jpeg' : 'application/pdf',
                      createdAt: item.createdAt
                    }]} 
                  />
                );
              })()}
            </View>
          )}
          <Text style={styles.metaText}>Người tạo: {item.createdBy?.profile?.fullName ?? item.createdBy?.userCode ?? 'N/A'}</Text>
          {item.assignedTo && (
            <Text style={[styles.metaText, { marginTop: 4 }]}>
              Nhân viên phụ trách: {item.assignedTo.profile?.fullName ?? item.assignedTo.userCode}
            </Text>
          )}
          {item.resultSummary && (
            <View style={[styles.rejectBox, { backgroundColor: colors.primarySoft, marginTop: spacing.md, flexDirection: 'column', alignItems: 'flex-start' }]}>
              <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
                <MaterialCommunityIcons name="check-circle-outline" size={20} color={colors.primary} />
                <Text style={[styles.rejectText, { color: colors.primaryDark, fontWeight: '700' }]}>Báo cáo kết quả:</Text>
              </View>
              <Text style={{ fontSize: 14, color: colors.text, marginTop: 4, lineHeight: 20 }}>
                {item.resultSummary.replace(/\[File đính kèm\]:\s*\S+/g, '').trim()}
              </Text>
              {item.resultSummary.includes('[File đính kèm]:') && (
                <View style={{ marginTop: spacing.sm, width: '100%' }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 4 }}>Minh chứng kết quả đính kèm:</Text>
                  {(() => {
                    const url = item.resultSummary.split('[File đính kèm]:')[1].trim();
                    const fileName = url.split('/').pop() || 'ket_qua_dinh_kem';
                    const isImage = /\.(jpg|jpeg|png|gif|webp|heic)$/i.test(fileName);
                    return (
                      <AttachmentList 
                        attachments={[{
                          id: 'result_attachment',
                          taskId: item.id,
                          uploadedByUserId: item.assignedToUserId || '',
                          type: 'FILE',
                          fileName: fileName,
                          fileUrl: url,
                          mimeType: isImage ? 'image/jpeg' : 'application/pdf',
                          createdAt: item.createdAt
                        }]} 
                      />
                    );
                  })()}
                </View>
              )}
            </View>
          )}
          
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
          
          {canTarget && (item.status === 'TARGET_ACCEPTED' || item.status === 'SOURCE_APPROVED') && !item.assignedToUserId && (
            <PrimaryButton loading={action.isPending} onPress={() => setAssignModalVisible(true)}>
              Giao việc cho nhân viên
            </PrimaryButton>
          )}

          {/* Assigned Employee Actions */}
          {item.assignedToUserId === user?.id && item.status === 'TARGET_ASSIGNED' && (
            <PrimaryButton loading={action.isPending} onPress={() => {
              void action.mutateAsync({ id: item.id, action: 'update-progress', payload: { progress: 10 } });
            }}>
              Xác nhận tiếp nhận & Bắt đầu làm
            </PrimaryButton>
          )}

          {item.assignedToUserId === user?.id && ['TARGET_ASSIGNED', 'IN_PROGRESS'].includes(item.status) && (
            <>
              <PrimaryButton loading={action.isPending} onPress={() => openInputModal('update-progress')}>
                Cập nhật Tiến độ ({item.progress ?? 0}%)
              </PrimaryButton>
              <PrimaryButton loading={action.isPending} onPress={() => openInputModal('submit')}>
                Nộp kết quả
              </PrimaryButton>
            </>
          )}

          {canSource && item.status === 'SUBMITTED_FOR_REVIEW' && (
            <PrimaryButton loading={action.isPending} onPress={() => openInputModal('complete')}>
              Nghiệm thu & Đánh giá
            </PrimaryButton>
          )}
        </View>
      </ScrollView>

      {/* Select Employee Modal */}
      <SelectModal
        visible={assignModalVisible}
        title="Chọn nhân viên phụ trách"
        options={employeeOptions}
        isLoading={employeesQuery.isLoading}
        onSelect={(opt) => {
          setAssignModalVisible(false);
          void action.mutateAsync({ id: item.id, action: 'assign-target', payload: { assignedToUserId: opt.id } });
        }}
        onClose={() => setAssignModalVisible(false)}
      />

      {/* Custom Cross-Platform Input Modal */}
      <Modal visible={inputModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{inputModalTitle}</Text>
            <Text style={styles.modalDesc}>{inputModalDesc}</Text>
            
            <TextInput
              style={styles.reasonInput}
              placeholder={inputModalPlaceholder}
              value={inputModalValue}
              onChangeText={setInputModalValue}
              multiline={inputActionType === 'submit'}
              keyboardType={inputActionType === 'submit' ? 'default' : 'numeric'}
            />

            {inputActionType === 'submit' && (
              <View style={{ marginBottom: spacing.md }}>
                <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                  <Pressable 
                    style={{ 
                      flex: 1,
                      flexDirection: 'row', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      gap: 6, 
                      padding: 10, 
                      borderWidth: 1, 
                      borderColor: colors.primary, 
                      borderRadius: 10, 
                      backgroundColor: colors.primarySoft 
                    }}
                    onPress={() => void pickImage()}
                  >
                    <MaterialCommunityIcons name="image-outline" size={18} color={colors.primary} />
                    <Text style={{ fontSize: 13, fontWeight: '700', color: colors.primary }}>Chọn ảnh</Text>
                  </Pressable>

                  <Pressable 
                    style={{ 
                      flex: 1,
                      flexDirection: 'row', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      gap: 6, 
                      padding: 10, 
                      borderWidth: 1, 
                      borderColor: colors.primary, 
                      borderRadius: 10, 
                      backgroundColor: colors.primarySoft 
                    }}
                    onPress={() => void pickDocument()}
                  >
                    <MaterialCommunityIcons name="file-document-outline" size={18} color={colors.primary} />
                    <Text style={{ fontSize: 13, fontWeight: '700', color: colors.primary }}>Chọn file / PDF</Text>
                  </Pressable>
                </View>

                {selectedAttachmentUri && (
                  <View style={{ marginTop: spacing.sm, padding: spacing.xs, backgroundColor: colors.surface, borderRadius: 8, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <MaterialCommunityIcons name="file-check-outline" size={20} color={colors.primary} />
                    <Text style={{ flex: 1, fontSize: 13, fontWeight: '600', color: colors.text }} numberOfLines={1}>
                      {selectedFileName || 'Tệp đính kèm'}
                    </Text>
                    <Pressable 
                      onPress={() => {
                        setSelectedAttachmentUri(null);
                        setSelectedFileName(null);
                        setSelectedMimeType(null);
                      }}
                    >
                      <MaterialCommunityIcons name="close-circle-outline" size={20} color={colors.error} />
                    </Pressable>
                  </View>
                )}
              </View>
            )}
            
            <View style={styles.modalActions}>
              <Pressable style={styles.modalBtnCancel} onPress={() => setInputModalVisible(false)} disabled={isUploading}>
                <Text style={styles.modalBtnCancelText}>Hủy</Text>
              </Pressable>
              <Pressable 
                style={[styles.modalBtnConfirm, isUploading && { opacity: 0.6 }]}
                onPress={() => void handleInputModalSubmit()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalBtnConfirmText}>Xác nhận</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

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
    { key: 'TARGET_ACCEPTED', label: 'Đã tiếp nhận' },
    { key: 'TARGET_ASSIGNED', label: 'Đã giao việc' },
    { key: 'IN_PROGRESS', label: 'Đang thực hiện' },
    { key: 'SUBMITTED_FOR_REVIEW', label: 'Chờ nghiệm thu' },
    { key: 'COMPLETED', label: 'Hoàn tất' }
  ];

  // Helper to determine if a step is past, current, or future
  const getStepStatus = (stepKey: string) => {
    if (request.status.includes('REJECTED') || request.status === 'CANCELLED') {
      if (request.status === 'SOURCE_REJECTED' && stepKey === 'PENDING_SOURCE_APPROVAL') return 'rejected';
      if (request.status === 'TARGET_REJECTED' && stepKey === 'SOURCE_APPROVED') return 'rejected';
      return 'past'; // If rejected later, previous steps are past
    }
    
    // Specifically handle COMPLETED as past for all previous steps
    if (request.status === 'COMPLETED' && stepKey !== 'COMPLETED') return 'past';
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

export function statusToVietnamese(status?: string): string {
  if (!status) return 'Không xác định';
  switch (status) {
    case 'PENDING_SOURCE_APPROVAL': return 'Chờ Nguồn Duyệt';
    case 'SOURCE_APPROVED': return 'Chờ Đích Nhận';
    case 'SOURCE_REJECTED': return 'PB Nguồn Từ Chối';
    case 'TARGET_ACCEPTED': return 'Đã Tiếp Nhận';
    case 'TARGET_REJECTED': return 'PB Đích Từ Chối';
    case 'TARGET_ASSIGNED': return 'Đã Giao Việc';
    case 'IN_PROGRESS': return 'Đang Thực Hiện';
    case 'SUBMITTED_FOR_REVIEW': return 'Chờ Nghiệm Thu';
    case 'COMPLETED': return 'Hoàn Thành';
    case 'CANCELLED': return 'Đã Hủy';
    default: return status;
  }
}

function CrossDepartmentCard({ request, onPress }: { request: CrossDepartmentRequestDto; onPress: () => void }) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.cardHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <MaterialCommunityIcons name="file-document-outline" size={16} color={colors.primary} />
          <Text style={styles.cardCode}>{request.requestCode ?? 'REQ-XXX'}</Text>
        </View>
        <StatusBadge label={statusToVietnamese(request.status)} tone={toneForStatus(request.status)} />
      </View>
      
      <Text style={styles.cardTitle} numberOfLines={2}>{request.title}</Text>
      
      <View style={styles.cardDepts}>
        <View style={styles.deptBadge}>
          <Text style={styles.deptBadgeText} numberOfLines={1}>{request.sourceDepartment?.name ?? 'PB Nguồn'}</Text>
        </View>
        <MaterialCommunityIcons name="arrow-right-thin" size={18} color={colors.muted} />
        <View style={[styles.deptBadge, { backgroundColor: colors.primarySoft }]}>
          <Text style={[styles.deptBadgeText, { color: colors.primaryDark }]} numberOfLines={1}>{request.targetDepartment?.name ?? 'PB Đích'}</Text>
        </View>
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
  
  // Modern Segmented Control
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 4,
    marginBottom: spacing.xs,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 10,
    gap: 6,
  },
  segmentBtnActive: {
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.muted,
  },
  segmentTextActive: {
    color: colors.text,
    fontWeight: '700',
  },

  // Status Filter Chips
  chipsWrap: {
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xs,
  },
  chipsScroll: {
    gap: spacing.xs,
    paddingVertical: 4,
  },
  chipBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  chipBtnActive: {
    backgroundColor: colors.primarySoft,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.muted,
  },
  chipTextActive: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  
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
  cardDepts: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  cardDeptName: { fontSize: 13, fontWeight: '600', color: colors.text, flex: 1 },
  deptBadge: {
    backgroundColor: colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    maxWidth: '45%',
  },
  deptBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.muted,
  },
  
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

const crossListStyles = StyleSheet.create({
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    marginRight: 6,
    padding: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
    marginLeft: 34,
  },
  headerAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1B382B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  headerAddText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 4,
    borderRadius: 10,
    gap: 4,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  segmentBtnActive: {
    backgroundColor: '#1B382B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  segmentTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  filterPillRow: {
    paddingHorizontal: 16,
    marginTop: 12,
    flexDirection: 'row',
  },
  statusDropdownPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statusDropdownText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingTop: 60,
  },
  emptyIconBg: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  resetFilterBtn: {
    borderWidth: 1.5,
    borderColor: '#1B382B',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  resetFilterText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1B382B',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
    gap: 12,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  modalOptionActive: {
    backgroundColor: '#F0FDF4',
  },
  modalOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#334155',
  },
  modalOptionTextActive: {
    fontWeight: '700',
    color: '#166534',
  },
});
