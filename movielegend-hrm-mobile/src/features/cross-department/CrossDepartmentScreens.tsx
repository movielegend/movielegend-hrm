import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View, Pressable, TextInput, Modal, Image, ActivityIndicator, StatusBar, Platform, KeyboardAvoidingView } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { useDepartments, usePublicDepartments } from '../../hooks/useDepartments';
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
  const insets = useSafeAreaInsets();
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
    <View style={crossListStyles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#102739" translucent={false} />

      {/* 1. Header (Dark Navy #102739) */}
      <View style={[crossListStyles.header, { paddingTop: Math.max(insets.top, 16) + 4 }]}>
        <View style={crossListStyles.headerTop}>
          <View style={crossListStyles.headerRow}>
            <Pressable 
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/admin/(tabs)' as any))} 
              style={crossListStyles.backBtn} 
              hitSlop={8}
            >
              <MaterialCommunityIcons name="chevron-left" size={28} color="#FFFFFF" />
            </Pressable>
            <Text style={crossListStyles.headerTitle}>Luân chuyển & phối hợp</Text>
          </View>
          {area !== 'admin' && (
            <Pressable style={crossListStyles.headerAddBtn} onPress={() => router.push(`/${area}/cross-department/create`)}>
              <MaterialCommunityIcons name="plus" size={16} color="#FFFFFF" />
              <Text style={crossListStyles.headerAddText}>Tạo mới</Text>
            </Pressable>
          )}
        </View>
        <Text style={crossListStyles.headerSubtitle}>Quản lý yêu cầu liên phòng ban</Text>
      </View>

      {/* 2. Curved White Body Sheet */}
      <View style={crossListStyles.curvedSheet}>
        {/* Segmented Tabs (Đã gửi | Yêu cầu đến | Tất cả) */}
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

        {/* Status Filter Dropdown Pill */}
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

        {/* Content List or Empty State */}
        {list.isLoading ? (
          <View style={crossListStyles.centerBox}>
            <ActivityIndicator size="large" color="#102739" />
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
              <MaterialCommunityIcons name="inbox-arrow-down-outline" size={38} color="#0284C7" />
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
      </View>

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
                  <MaterialCommunityIcons name="check" size={18} color="#102739" />
                )}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

// ==========================================
// 2. CREATE SCREEN
// ==========================================
export function CreateCrossDepartmentScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const departmentsQuery = usePublicDepartments();
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

  const sourceDepartmentOptions: SelectOption[] = useMemo(() => {
    if (!departmentsQuery.data?.items) return [];
    return departmentsQuery.data.items.map(d => ({
      id: d.id,
      label: d.name,
      subtitle: `Mã: ${d.code}${d.branch?.name ? ` • Cơ sở: ${d.branch.name}` : ''}`,
    }));
  }, [departmentsQuery.data]);

  const targetDepartmentOptions: SelectOption[] = useMemo(() => {
    if (!departmentsQuery.data?.items) return [];
    return departmentsQuery.data.items
      .filter(d => !sourceDepartment || d.id !== sourceDepartment.id)
      .map(d => ({
        id: d.id,
        label: d.name,
        subtitle: `Mã: ${d.code}${d.branch?.name ? ` • Cơ sở: ${d.branch.name}` : ''}`,
      }));
  }, [departmentsQuery.data, sourceDepartment]);

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
  const insets = useSafeAreaInsets();
  const isFormValid = Boolean(sourceDepartment && targetDepartment && title.trim().length >= 3 && content.trim().length >= 3);

  return (
    <View style={createStyles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#102739" translucent={false} />

      {/* 1. Header (Dark Navy #102739) */}
      <View style={[createStyles.header, { paddingTop: Math.max(insets.top, 16) + 4 }]}>
        <View style={createStyles.headerMainRow}>
          <Pressable 
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/admin/(tabs)' as any))} 
            style={createStyles.backBtn} 
            hitSlop={8}
          >
            <MaterialCommunityIcons name="chevron-left" size={28} color="#FFFFFF" />
          </Pressable>
          <Text style={createStyles.headerTitle}>Tạo yêu cầu</Text>
        </View>
        <Text style={createStyles.headerSubtitle}>Luân chuyển hoặc phối hợp liên phòng ban</Text>
      </View>

      {/* 2. Curved White Sheet Form */}
      <View style={createStyles.curvedSheet}>
        <ScrollView contentContainerStyle={createStyles.content} showsVerticalScrollIndicator={false}>
          {/* Phòng ban nguồn */}
          <View style={createStyles.fieldWrap}>
            <Text style={createStyles.fieldLabel}>Phòng ban nguồn *</Text>
            {canSelectSource ? (
              <Pressable style={createStyles.selector} onPress={() => setSourceModalVisible(true)}>
                <Text style={sourceDepartment ? createStyles.selectorText : createStyles.selectorPlaceholder}>
                  {sourceDepartment ? sourceDepartment.label : 'Chọn phòng ban nguồn...'}
                </Text>
                <MaterialCommunityIcons name="chevron-down" size={20} color="#64748B" />
              </Pressable>
            ) : (
              <View style={createStyles.inputDisabled}>
                <Text style={createStyles.inputDisabledText}>{sourceDepartment?.label || 'Chưa xác định'}</Text>
                <MaterialCommunityIcons name="lock" size={18} color="#64748B" />
              </View>
            )}
          </View>

          {/* Phòng ban đích */}
          <View style={createStyles.fieldWrap}>
            <Text style={createStyles.fieldLabel}>Phòng ban đích *</Text>
            <Pressable style={createStyles.selector} onPress={() => setTargetModalVisible(true)}>
              <Text style={targetDepartment ? createStyles.selectorText : createStyles.selectorPlaceholder}>
                {targetDepartment ? targetDepartment.label : 'Chọn phòng ban đích...'}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={20} color="#64748B" />
            </Pressable>
          </View>

          {/* Tiêu đề yêu cầu */}
          <View style={createStyles.fieldWrap}>
            <Text style={createStyles.fieldLabel}>Tiêu đề yêu cầu *</Text>
            <TextInput
              style={createStyles.input}
              placeholder="VD: Xin hỗ trợ nhân sự kho"
              placeholderTextColor="#94A3B8"
              value={title}
              onChangeText={setTitle}
            />
          </View>

          {/* Nội dung / Lý do */}
          <View style={createStyles.fieldWrap}>
            <Text style={createStyles.fieldLabel}>Nội dung / Lý do *</Text>
            <TextInput
              style={[createStyles.input, createStyles.textArea]}
              placeholder="Mô tả chi tiết yêu cầu..."
              placeholderTextColor="#94A3B8"
              value={content}
              onChangeText={setContent}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Mã Task liên quan (Tùy chọn) */}
          <View style={createStyles.fieldWrap}>
            <Text style={createStyles.fieldLabel}>Mã Task liên quan (Tùy chọn)</Text>
            <TextInput
              style={createStyles.input}
              placeholder="Nhập ID công việc nếu có"
              placeholderTextColor="#94A3B8"
              value={taskId}
              onChangeText={setTaskId}
              autoCapitalize="none"
            />
          </View>

          {/* Tài liệu / Ảnh đính kèm (Tùy chọn) */}
          <View style={createStyles.fieldWrap}>
            <Text style={createStyles.fieldLabel}>Tài liệu / Ảnh đính kèm (Tùy chọn)</Text>
            <View style={createStyles.attachmentBtnRow}>
              <Pressable style={createStyles.attachBtn} onPress={() => void pickImage()}>
                <MaterialCommunityIcons name="image-outline" size={18} color="#334155" />
                <Text style={createStyles.attachBtnText}>Chọn ảnh</Text>
              </Pressable>
              <Pressable style={createStyles.attachBtn} onPress={() => void pickDocument()}>
                <MaterialCommunityIcons name="file-document-outline" size={18} color="#334155" />
                <Text style={createStyles.attachBtnText}>Chọn file / PDF</Text>
              </Pressable>
            </View>

            {attachmentUri && (
              <View style={createStyles.attachmentPreview}>
                <MaterialCommunityIcons name="file-check-outline" size={20} color="#102739" />
                <Text style={createStyles.attachmentName} numberOfLines={1}>
                  {attachmentName || 'Tệp đính kèm'}
                </Text>
                <Pressable 
                  onPress={() => {
                    setAttachmentUri(null);
                    setAttachmentName(null);
                    setAttachmentMime(null);
                  }}
                  hitSlop={8}
                >
                  <MaterialCommunityIcons name="close-circle-outline" size={20} color="#EF4444" />
                </Pressable>
              </View>
            )}
          </View>

          {/* Nút Gửi yêu cầu */}
          <Pressable
            style={[
              createStyles.submitBtn,
              isFormValid && createStyles.submitBtnActive,
              (mutation.isPending || isUploading) && { opacity: 0.8 }
            ]}
            disabled={!isFormValid || mutation.isPending || isUploading}
            onPress={() => void submit()}
          >
            {mutation.isPending || isUploading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={createStyles.submitBtnText}>Gửi yêu cầu</Text>
            )}
          </Pressable>
        </ScrollView>
      </View>

      {/* Modals */}
      <SelectModal
        visible={targetModalVisible}
        title="Chọn phòng ban đích"
        options={targetDepartmentOptions}
        selectedValue={targetDepartment?.id}
        onSelect={setTargetDepartment}
        onClose={() => setTargetModalVisible(false)}
      />
      <SelectModal
        visible={sourceModalVisible}
        title="Chọn phòng ban nguồn"
        options={sourceDepartmentOptions}
        selectedValue={sourceDepartment?.id}
        onSelect={(opt) => {
          setSourceDepartment(opt);
          if (targetDepartment?.id === opt.id) {
            setTargetDepartment(null);
          }
        }}
        onClose={() => setSourceModalVisible(false)}
      />
    </View>
  );
}

// ==========================================
// 3. DETAIL SCREEN
// ==========================================
export function CrossDepartmentDetailScreen({ area }: { area: CrossArea }) {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const request = useCrossDepartmentRequest(id);
  const action = useCrossDepartmentAction();

  // Fetch employees for target department only when user has permission to assign
  const targetDepartmentId = request.data?.targetDepartmentId;
  const canAssignEmployee = Boolean(
    targetDepartmentId && (user?.roles.includes('ADMIN') || user?.roles.includes('HR') || user?.roles.includes('LEADER'))
  );
  const employeesQuery = useEmployees({ departmentId: targetDepartmentId, page: 1, limit: 100 }, canAssignEmployee);
  
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

  const isSourceLeader = item.sourceDepartment?.leaderUserId === user?.id;
  const isTargetLeader = item.targetDepartment?.leaderUserId === user?.id;
  const isRequester = item.createdByUserId === user?.id;

  const isSourceSide = isRequester || 
    isSourceLeader ||
    (Boolean(user?.department?.id) && user?.department?.id === item.sourceDepartmentId) ||
    Boolean(user?.scopes?.some(s => s.role === 'LEADER' && s.scopeId === item.sourceDepartmentId));

  const isTargetSide = isTargetLeader ||
    (Boolean(user?.department?.id) && user?.department?.id === item.targetDepartmentId) ||
    Boolean(user?.scopes?.some(s => s.role === 'LEADER' && s.scopeId === item.targetDepartmentId));

  // Source side actions (Source approve / Duyệt cho yêu cầu chuyển đi)
  const canSource = isAdmin || isSourceLeader || (isHR && isSourceSide) || (isSourceSide && hasAnyPermission(user, ['cross_department.source_approve', 'cross_department.read_all']));

  // Target side actions (Target accept / Assign target employee / Xử lý việc)
  const canTarget = isAdmin || isTargetLeader || isTargetSide || (
    !isSourceSide && hasAnyPermission(user, ['cross_department.target_receive', 'cross_department.read_all'])
  );

  // Nghiệm thu & Đánh giá (Người đưa yêu cầu HOẶC Trưởng phòng nguồn HOẶC Admin/HR)
  const canComplete = isRequester || isSourceLeader || isAdmin || isHR;

  // Thực hiện & Nộp kết quả (Nhân sự được phân công HOẶC Trưởng phòng đích HOẶC Admin)
  const canSubmitTarget = item.assignedToUserId === user?.id || canTarget || isAdmin;

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
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 24) + 80 }]}>
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

          {/* Phía bên nhận (Nhân viên được giao hoặc Trưởng phòng đích): Bắt đầu làm */}
          {canSubmitTarget && (item.status === 'TARGET_ASSIGNED' || item.status === 'TARGET_ACCEPTED') && (item.progress ?? 0) === 0 && (
            <PrimaryButton loading={action.isPending} onPress={() => {
              void action.mutateAsync({ id: item.id, action: 'update-progress', payload: { progress: 10 } });
            }}>
              Xác nhận tiếp nhận & Bắt đầu làm
            </PrimaryButton>
          )}

          {/* Phía bên nhận (Nhân viên được giao hoặc Trưởng phòng đích): Cập nhật tiến độ & Nộp kết quả */}
          {canSubmitTarget && ['TARGET_ACCEPTED', 'TARGET_ASSIGNED', 'IN_PROGRESS'].includes(item.status) && (
            <>
              <PrimaryButton loading={action.isPending} onPress={() => openInputModal('update-progress')}>
                Cập nhật Tiến độ ({item.progress ?? 0}%)
              </PrimaryButton>
              <PrimaryButton 
                loading={action.isPending} 
                onPress={() => openInputModal('submit')}
                style={{ backgroundColor: '#059669' }}
              >
                Xác nhận hoàn thành & Nộp kết quả
              </PrimaryButton>
            </>
          )}

          {/* Người đưa yêu cầu HOẶC Trưởng phòng nguồn: Nghiệm thu & Đánh giá */}
          {canComplete && item.status === 'SUBMITTED_FOR_REVIEW' && (
            <PrimaryButton 
              loading={action.isPending} 
              onPress={() => openInputModal('complete')}
              style={{ backgroundColor: '#2563EB' }}
            >
              Nghiệm thu & Đánh giá kết quả
            </PrimaryButton>
          )}

          {/* Trạng thái đã hoàn tất */}
          {item.status === 'COMPLETED' && (
            <View style={{ backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#A7F3D0', borderRadius: 12, padding: 14, marginTop: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MaterialCommunityIcons name="check-decagram" size={24} color="#059669" />
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#065F46' }}>Yêu cầu đã được nghiệm thu hoàn tất</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 }}>
                <Text style={{ fontSize: 14, color: '#047857', fontWeight: '600' }}>Đánh giá chất lượng:</Text>
                {Array.from({ length: 5 }).map((_, idx) => (
                  <MaterialCommunityIcons
                    key={idx}
                    name={idx < (item.rating ?? 5) ? 'star' : 'star-outline'}
                    size={20}
                    color="#F59E0B"
                  />
                ))}
                <Text style={{ fontSize: 13, color: '#059669', marginLeft: 4, fontWeight: '700' }}>
                  ({item.rating ?? 5}/5 sao)
                </Text>
              </View>
            </View>
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
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { maxHeight: '90%' }]}>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
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
                    <View style={{ marginTop: spacing.sm }}>
                      {Boolean(
                        selectedMimeType?.startsWith('image/') ||
                        /\.(jpg|jpeg|png|gif|webp|heic)$/i.test(selectedFileName || '') ||
                        selectedAttachmentUri.startsWith('data:image') ||
                        !selectedMimeType?.includes('pdf')
                      ) ? (
                        <View style={{
                          position: 'relative',
                          borderRadius: 12,
                          overflow: 'hidden',
                          borderWidth: 1,
                          borderColor: colors.border,
                          backgroundColor: '#F8FAFC',
                          marginTop: 4,
                        }}>
                          <Image
                            source={{ uri: selectedAttachmentUri }}
                            style={{ width: '100%', height: 160, borderRadius: 12, resizeMode: 'cover' }}
                          />
                          <View style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            backgroundColor: 'rgba(0,0,0,0.65)',
                            paddingVertical: 6,
                            paddingHorizontal: 10,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, marginRight: 8 }}>
                              <MaterialCommunityIcons name="image" size={16} color="#FFFFFF" />
                              <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '600' }} numberOfLines={1}>
                                {selectedFileName || 'Ảnh minh chứng'}
                              </Text>
                            </View>
                            <Pressable
                              onPress={() => {
                                setSelectedAttachmentUri(null);
                                setSelectedFileName(null);
                                setSelectedMimeType(null);
                              }}
                              hitSlop={8}
                            >
                              <MaterialCommunityIcons name="close-circle" size={22} color="#EF4444" />
                            </Pressable>
                          </View>
                        </View>
                      ) : (
                        <View style={{ marginTop: 4, padding: spacing.sm, backgroundColor: colors.surface, borderRadius: 8, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <MaterialCommunityIcons name="file-document-outline" size={22} color={colors.primary} />
                          <Text style={{ flex: 1, fontSize: 13, fontWeight: '600', color: colors.text }} numberOfLines={1}>
                            {selectedFileName || 'Tệp tài liệu'}
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
                </View>
              )}
              
              <View style={[styles.modalActions, { marginTop: spacing.sm }]}>
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
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
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
    
    // When request is COMPLETED, all steps including the final step are completed ('past')
    if (request.status === 'COMPLETED') return 'past';
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
  container: {
    flex: 1,
    backgroundColor: '#102739',
  },
  header: {
    backgroundColor: '#102739',
    paddingHorizontal: 16,
    paddingBottom: 16,
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
    marginRight: 8,
    padding: 2,
    marginLeft: -4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12.5,
    color: 'rgba(255, 255, 255, 0.72)',
    marginTop: 2,
    marginLeft: 32,
    fontWeight: '500',
  },
  headerAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  headerAddText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  curvedSheet: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    marginHorizontal: 16,
    marginTop: 16,
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
    backgroundColor: '#102739',
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
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 7,
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
    paddingTop: 40,
    paddingBottom: 40,
  },
  emptyIconBg: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16.5,
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
    borderColor: '#102739',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 22,
  },
  resetFilterText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#102739',
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
    backgroundColor: '#E7F0F7',
  },
  modalOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#334155',
  },
  modalOptionTextActive: {
    fontWeight: '700',
    color: '#102739',
  },
});

const createStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#102739',
  },
  header: {
    backgroundColor: '#102739',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    marginRight: 8,
    padding: 2,
    marginLeft: -4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12.5,
    color: 'rgba(255, 255, 255, 0.72)',
    marginTop: 2,
    marginLeft: 32,
    fontWeight: '500',
  },
  curvedSheet: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  fieldWrap: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#0F172A',
  },
  textArea: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  inputDisabled: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputDisabledText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  selector: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectorText: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '500',
  },
  selectorPlaceholder: {
    fontSize: 14,
    color: '#94A3B8',
  },
  attachmentBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  attachBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  attachBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  attachmentPreview: {
    marginTop: 8,
    padding: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  attachmentName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  submitBtn: {
    backgroundColor: '#64748B',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitBtnActive: {
    backgroundColor: '#102739',
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
