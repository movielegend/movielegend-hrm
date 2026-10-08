import React, { useState, useRef, useCallback } from 'react';
import { useAppAlert } from '../../contexts/AlertContext';
import { StyleSheet, Text, View, Pressable, ScrollView, TextInput, KeyboardAvoidingView, Platform, Image, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import ImageView from '../../components/ImageViewer/ImageViewer';
import { spacing } from '../../theme/spacing';
import { shadows } from '../../theme/shadows';
import { useEmployeeRequestById, useApproveEmployeeRequest, useRejectEmployeeRequest } from '../../hooks/useEmployeeRequests';
import { useAuth } from '../../providers/AuthProvider';
import { useQueryClient } from '@tanstack/react-query';
import { ActivityIndicator } from 'react-native';
import { uploadFile } from '../../api/uploads.api';

// Mock types
type RequestType = 'LEAVE' | 'ATTENDANCE_ADJUSTMENT' | 'LATE_ARRIVAL' | 'EARLY_LEAVE' | 'OVERTIME' | 'ADVANCE' | 'EXPENSE' | 'PURCHASE';

export function LeaderApprovalScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [disbursementProofUri, setDisbursementProofUri] = useState<string | null>(null);
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const { data: request, isLoading, isError } = useEmployeeRequestById(id);
  const approveMutation = useApproveEmployeeRequest();
  const rejectMutation = useRejectEmployeeRequest();

  const [comment, setComment] = useState('');

  // Helper to map type to colors & labels
  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'LEAVE': return { label: 'Nghỉ phép', color: '#10B981', icon: 'beach' };
      case 'ATTENDANCE_ADJUSTMENT': return { label: 'Giải trình công', color: '#3B82F6', icon: 'clock-edit-outline' };
      case 'LATE_ARRIVAL': return { label: 'Đi muộn', color: '#F59E0B', icon: 'clock-in' };
      case 'EARLY_LEAVE': return { label: 'Về sớm', color: '#EF4444', icon: 'clock-out' };
      case 'OVERTIME': return { label: 'Làm thêm giờ', color: '#8B5CF6', icon: 'briefcase-clock' };
      case 'ADVANCE': return { label: 'Tạm ứng', color: '#14B8A6', icon: 'cash' };
      case 'EXPENSE': return { label: 'Thanh toán', color: '#F97316', icon: 'receipt' };
      case 'PURCHASE': return { label: 'Mua sắm', color: '#0EA5E9', icon: 'cart-outline' };
      case 'ACCOUNT_DELETION': return { label: 'Hủy tài khoản', color: '#DC2626', icon: 'account-remove-outline' };
      default: return { label: 'Khác', color: '#6B7280', icon: 'file-document' };
    }
  };

  const { showAlert } = useAppAlert();

  const handlePickDisbursementProof = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setDisbursementProofUri(result.assets[0].uri);
    }
  };

  const handleApprove = async () => {
    let proofUrl = undefined;
    if (disbursementProofUri) {
      try {
        setIsUploadingProof(true);
        const res = await uploadFile({
          uri: disbursementProofUri,
          name: `disbursement_${Date.now()}.jpg`,
          mimeType: 'image/jpeg',
          purpose: 'EMPLOYEE_DOCUMENT'
        });
        proofUrl = res.fileUrl;
      } catch (err) {
        console.log('Proof upload error', err);
        showAlert('Lỗi', 'Không thể tải ảnh chứng từ giải ngân lên.');
        setIsUploadingProof(false);
        return;
      } finally {
        setIsUploadingProof(false);
      }
    }

    approveMutation.mutate({
      id,
      payload: {
        note: comment.trim() || undefined,
        disbursementProofUrl: proofUrl,
      }
    }, {
      onSuccess: () => {
        showAlert('Thành công', 'Đã xử lý phê duyệt đơn từ thành công!');
        router.back();
      },
      onError: (err: any) => {
        showAlert('Lỗi', err.response?.data?.message || err.message || 'Có lỗi xảy ra');
      }
    });
  };

  const handleReject = () => {
    rejectMutation.mutate({
      id,
      payload: {
        reason: comment.trim() || 'Không đáp ứng điều kiện duyệt',
      }
    }, {
      onSuccess: () => {
        showAlert('Đã từ chối', 'Đơn từ đã được cập nhật từ chối.');
        router.back();
      },
      onError: (err: any) => {
        showAlert('Lỗi', err.response?.data?.message || err.message || 'Có lỗi xảy ra');
      }
    });
  };

  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries();
    setRefreshing(false);
  }, [queryClient]);

  if (isLoading) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#111827" />
      </SafeAreaView>
    );
  }

  if (!request) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' }}>
        <Text>Không tìm thấy yêu cầu</Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 20 }}><Text style={{ color: '#3B82F6' }}>Quay lại</Text></Pressable>
      </SafeAreaView>
    );
  }

  const getStageLabelVi = (stageStr?: string, action?: string) => {
    if (action === 'DISBURSED' || stageStr === 'DISBURSED') return 'Kế toán giải ngân';
    if (action === 'REJECTED' || stageStr === 'REJECTED') return 'Từ chối';
    switch (stageStr) {
      case 'PENDING_LEADER':
      case 'LEADER':
        return 'Trưởng bộ phận duyệt';
      case 'PENDING_HR':
      case 'HR':
        return 'HR đối chứng & duyệt';
      case 'PENDING_ADMIN':
      case 'ADMIN':
        return 'Ban Giám Đốc duyệt';
      case 'PENDING_DISBURSEMENT':
      case 'ACCOUNTANT':
        return 'Kế toán giải ngân';
      default:
        return 'Cấp duyệt';
    }
  };

  const config = getTypeConfig(request.type);
  const userName = request.user?.profile?.fullName || request.user?.email || 'Nhân viên';
  const userDept = request.department?.name || 'Không rõ phòng ban';
  const userPos = request.user?.profile?.position?.name || 'Nhân viên';
  const dateStr = request.createdAt ? new Date(request.createdAt).toLocaleString('vi-VN') : '';
  const isFinancial = request.type === 'ADVANCE' || request.type === 'EXPENSE' || request.type === 'PURCHASE';
  const amount = Number(request.amount || 0);

  const formatDateStr = (dateVal?: string | Date | null) => {
    if (!dateVal) return '';
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatTimeStr = (dateVal?: string | Date | null) => {
    if (!dateVal) return '';
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  const meta = (typeof request.attachmentMetadata === 'object' && request.attachmentMetadata !== null)
    ? (request.attachmentMetadata as Record<string, any>)
    : {};
  const stage = meta.stage || 'PENDING';
  const approvalSteps = Array.isArray(meta.approvalSteps) ? meta.approvalSteps : [];

  const isAdmin = currentUser?.roles?.includes('ADMIN');
  const isHr = currentUser?.roles?.includes('HR') ||
    currentUser?.department?.name?.toLowerCase().includes('nhân sự') ||
    currentUser?.department?.code?.toUpperCase() === 'HR';
  const isAccountant = currentUser?.roles?.includes('ACCOUNTANT') ||
    currentUser?.department?.name?.toLowerCase().includes('kế toán') ||
    currentUser?.department?.name?.toLowerCase().includes('tài chính') ||
    ['KT', 'TC', 'ACC', 'ACCOUNTING'].includes(currentUser?.department?.code?.toUpperCase() || '');
  const isDeptLeader = request.department?.leaderUserId === currentUser?.id ||
    (currentUser?.roles?.includes('LEADER') && (currentUser?.department?.id === request.departmentId || currentUser?.department?.id === request.department?.id));

  // Determine if current user can perform an approval/reject action at the current stage
  let canActOnCurrentStage = false;
  let waitingStageDescription = '';

  if (request.status !== 'PENDING') {
    canActOnCurrentStage = false;
  } else if (!isFinancial) {
    if (isAdmin || isHr || isDeptLeader) {
      canActOnCurrentStage = true;
    } else {
      waitingStageDescription = 'Đang chờ Trưởng bộ phận hoặc Quản trị viên phê duyệt.';
    }
  } else {
    // Financial workflow
    if (stage === 'PENDING_LEADER' || stage === 'PENDING') {
      if (isDeptLeader || isAdmin || isHr) {
        canActOnCurrentStage = true;
      } else {
        waitingStageDescription = `Đang chờ Trưởng bộ phận (${userDept}) duyệt sơ bộ.`;
      }
    } else if (stage === 'PENDING_HR') {
      if (isHr || isAdmin) {
        canActOnCurrentStage = true;
      } else {
        waitingStageDescription = 'Trưởng bộ phận đã duyệt. Đang chờ HR đối chứng hồ sơ.';
      }
    } else if (stage === 'PENDING_ADMIN') {
      if (isAdmin) {
        canActOnCurrentStage = true;
      } else {
        waitingStageDescription = 'HR đã đối chứng hồ sơ. Đang chờ Ban Giám Đốc phê duyệt hạn mức.';
      }
    } else if (stage === 'PENDING_DISBURSEMENT') {
      if (isAccountant || isAdmin) {
        canActOnCurrentStage = true;
      } else {
        waitingStageDescription = 'Đơn đã được duyệt. Đang chờ Kế toán thực hiện giải ngân.';
      }
    }
  }

  // Determine role-based action text
  let approveButtonLabel = 'Phê duyệt';
  let approveSubtext = '';
  if (isFinancial) {
    if (stage === 'PENDING_DISBURSEMENT') {
      approveButtonLabel = 'Xác nhận Giải ngân';
      approveSubtext = 'Kế toán giải ngân & đóng đơn';
    } else if (stage === 'PENDING_ADMIN') {
      approveButtonLabel = 'Duyệt chuyển Kế toán';
      approveSubtext = 'Ban Giám Đốc duyệt hạn mức > 5M';
    } else if (stage === 'PENDING_HR') {
      if (amount > 5000000) {
        approveButtonLabel = 'Đối chứng & Chuyển Admin';
        approveSubtext = 'Xác nhận đủ điều kiện, chuyển Ban Giám Đốc';
      } else {
        approveButtonLabel = 'Duyệt chuyển Kế toán';
        approveSubtext = 'Leader HR duyệt hạn mức ≤ 5M';
      }
    } else if (stage === 'PENDING_LEADER' || stage === 'PENDING') {
      approveButtonLabel = 'Duyệt chuyển HR';
      approveSubtext = 'Trưởng bộ phận đồng ý, chuyển HR đối chứng';
    }
  }

  // Formatting helpers matching mockup media_1791363426977.jpg
  const getUserInitials = (name: string) => {
    if (!name) return 'ML';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };
  const userInitials = getUserInitials(userName);

  // Subtitle e.g. "Nhân viên · Kế toán · Hà Nội"
  const branchName = request.department?.branch?.name || (currentUser?.branch as any)?.name || 'Hà Nội';
  const userSubtitle = `${userPos} · ${userDept} · ${branchName}`;

  // Format submission time e.g. "Gửi lúc 15:21:51 · 06/10/2026"
  const formatSubmissionTime = (dateVal?: string | Date | null) => {
    if (!dateVal) return '';
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const date = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    return `Gửi lúc ${time} · ${date}`;
  };

  // Status badge logic
  const getStatusBadgeInfo = () => {
    if (request.status === 'REJECTED') {
      return {
        label: 'Đã từ chối',
        bg: '#FEE2E2',
        color: '#DC2626',
        icon: 'close-circle' as const,
      };
    }
    if (request.status === 'APPROVED') {
      return {
        label: 'Đã duyệt',
        bg: '#DCFCE7',
        color: '#166534',
        icon: 'check-circle' as const,
      };
    }
    // PENDING
    if (stage === 'PENDING_HR') {
      return {
        label: 'Chờ HR đối chứng',
        bg: '#FEF3C7',
        color: '#B45309',
        icon: 'clock-outline' as const,
      };
    }
    if (stage === 'PENDING_ADMIN') {
      return {
        label: 'Chờ Admin duyệt',
        bg: '#FEF3C7',
        color: '#B45309',
        icon: 'clock-outline' as const,
      };
    }
    if (stage === 'PENDING_DISBURSEMENT') {
      return {
        label: 'Chờ giải ngân',
        bg: '#FEF3C7',
        color: '#B45309',
        icon: 'clock-outline' as const,
      };
    }
    return {
      label: 'Chờ Leader duyệt',
      bg: '#FEF3C7',
      color: '#B45309',
      icon: 'clock-outline' as const,
    };
  };

  const statusBadge = getStatusBadgeInfo();

  // Screen Title based on status and type
  const getScreenTitle = () => {
    if (request.status === 'PENDING') {
      switch (request.type) {
        case 'EXPENSE': return 'Duyệt thanh toán';
        case 'ADVANCE': return 'Duyệt tạm ứng';
        case 'PURCHASE': return 'Duyệt mua sắm';
        case 'LEAVE': return 'Duyệt nghỉ phép';
        case 'ATTENDANCE_ADJUSTMENT': return 'Duyệt giải trình';
        case 'LATE_ARRIVAL': return 'Duyệt đi muộn';
        case 'EARLY_LEAVE': return 'Duyệt về sớm';
        case 'OVERTIME': return 'Duyệt làm thêm giờ';
        default: return 'Phê duyệt đơn từ';
      }
    }
    // In approved or rejected mode
    switch (request.type) {
      case 'EXPENSE': return 'Chi tiết đơn thanh toán';
      case 'ADVANCE': return 'Chi tiết đơn tạm ứng';
      case 'PURCHASE': return 'Chi tiết đơn mua sắm';
      case 'LEAVE': return 'Chi tiết đơn nghỉ';
      case 'ATTENDANCE_ADJUSTMENT': return 'Chi tiết giải trình';
      case 'LATE_ARRIVAL': return 'Chi tiết đi muộn';
      case 'EARLY_LEAVE': return 'Chi tiết về sớm';
      case 'OVERTIME': return 'Chi tiết làm thêm giờ';
      default: return 'Chi tiết đơn từ';
    }
  };

  const screenTitle = getScreenTitle();

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: '#F8FAFC' }} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 25}
    >
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#fff' }}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Pressable onPress={() => router.back()} hitSlop={12} style={styles.iconBtn}>
              <MaterialCommunityIcons name="chevron-left" size={32} color="#0F172A" />
            </Pressable>
            <Text style={styles.screenTitleText}>{screenTitle}</Text>
            <View style={{ width: 32 }} />
          </View>
        </View>
      </SafeAreaView>

      <ScrollView 
        ref={scrollViewRef}
        contentContainerStyle={[styles.content, { paddingBottom: 110 + Math.max(insets.bottom, 24) }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />}
      >
        {/* 1. Profile / Submitter Card */}
        <View style={[styles.card, shadows.sm]}>
          <View style={styles.profileRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitials}>{userInitials}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{userName}</Text>
              <Text style={styles.profileSubtitle}>{userSubtitle}</Text>
            </View>
            <View style={[styles.statusPill, { backgroundColor: statusBadge.bg }]}>
              <MaterialCommunityIcons name={statusBadge.icon as any} size={13} color={statusBadge.color} style={{ marginRight: 4 }} />
              <Text style={[styles.statusPillText, { color: statusBadge.color }]}>{statusBadge.label}</Text>
            </View>
          </View>

          <View style={styles.cardDivider} />

          <View style={styles.submissionTimeRow}>
            <Text style={styles.submissionTimeText}>{formatSubmissionTime(request.createdAt)}</Text>
          </View>
        </View>

        {/* 2. Main Content Card */}
        <View style={[styles.card, shadows.sm]}>
          {isFinancial ? (
            <>
              {/* Financial Title */}
              <View style={{ marginBottom: 12 }}>
                <Text style={styles.contentTitleLarge}>{request.title || 'Đề nghị thanh toán'}</Text>
              </View>

              {/* Green Amount Banner */}
              <View style={styles.amountBanner}>
                <Text style={styles.amountBannerLabel}>SỐ TIỀN ĐỀ NGHỊ</Text>
                <Text style={styles.amountBannerValue}>
                  {Number(request.amount || 0).toLocaleString('vi-VN')} VNĐ
                </Text>
              </View>

              {/* Description */}
              <View style={styles.detailSection}>
                <Text style={styles.sectionHeaderLabel}>Nội dung chi tiết</Text>
                <Text style={styles.detailBodyText}>{request.content || 'Không có mô tả chi tiết'}</Text>
              </View>
            </>
          ) : (
            <>
              <View style={{ marginBottom: 6 }}>
                <Text style={styles.sectionHeaderLabel}>Nội dung đơn</Text>
              </View>
              <Text style={styles.contentTitleLarge}>{request.title}</Text>
              <Text style={styles.detailBodyText}>{request.content || 'Không có mô tả chi tiết'}</Text>
              <Text style={styles.subtextMeta}>Nội dung theo đơn gốc</Text>
            </>
          )}
        </View>

        {/* 3. Meta Details Card */}
        {/* LEAVE */}
        {request.type === 'LEAVE' && (
          <View style={[styles.card, shadows.sm]}>
            <Text style={styles.metaSectionTitle}>Thông tin nghỉ phép</Text>
            
            {meta.leaveType ? (
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Loại nghỉ</Text>
                <Text style={styles.metaValue}>{meta.leaveType}</Text>
              </View>
            ) : null}

            {meta.leaveDurationType ? (
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Hình thức</Text>
                <Text style={styles.metaValue}>{meta.leaveDurationType}</Text>
              </View>
            ) : null}

            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Thời gian nghỉ</Text>
              <Text style={[styles.metaValue, { color: '#047857', fontWeight: '700' }]}>
                {meta.leaveDurationType === 'Nhiều ngày' && meta.toDate
                  ? `${formatDateStr(meta.fromDate)} - ${formatDateStr(meta.toDate)}`
                  : formatDateStr(meta.fromDate)}
                {meta.startTime && meta.endTime
                  ? ` (${formatTimeStr(meta.startTime)} - ${formatTimeStr(meta.endTime)})`
                  : ''}
              </Text>
            </View>

            {meta.handoverEmployee ? (
              <View style={[styles.metaRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
                <Text style={styles.metaLabel}>Người bàn giao</Text>
                <Text style={styles.metaValue}>{meta.handoverEmployee}</Text>
              </View>
            ) : null}
          </View>
        )}

        {/* ATTENDANCE_ADJUSTMENT */}
        {request.type === 'ATTENDANCE_ADJUSTMENT' && (
          <View style={[styles.card, shadows.sm]}>
            <Text style={styles.metaSectionTitle}>Thông tin giải trình công</Text>

            {meta.explanationType ? (
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Loại giải trình</Text>
                <Text style={styles.metaValue}>{meta.explanationType}</Text>
              </View>
            ) : null}

            {meta.fromDate ? (
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Ngày cần giải trình</Text>
                <Text style={[styles.metaValue, { color: '#047857', fontWeight: '700' }]}>{formatDateStr(meta.fromDate)}</Text>
              </View>
            ) : null}

            {meta.shiftName ? (
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Ca làm việc</Text>
                <Text style={styles.metaValue}>{meta.shiftName}</Text>
              </View>
            ) : null}

            {(meta.startTime || meta.endTime) ? (
              <View style={[styles.metaRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
                <Text style={styles.metaLabel}>Giờ thực tế</Text>
                <Text style={styles.metaValue}>
                  {meta.startTime ? `Vào: ${formatTimeStr(meta.startTime)}` : ''}
                  {meta.startTime && meta.endTime ? ' | ' : ''}
                  {meta.endTime ? `Ra: ${formatTimeStr(meta.endTime)}` : ''}
                </Text>
              </View>
            ) : null}
          </View>
        )}

        {/* LATE / EARLY */}
        {(request.type === 'LATE_ARRIVAL' || request.type === 'EARLY_LEAVE') && (
          <View style={[styles.card, shadows.sm]}>
            <Text style={styles.metaSectionTitle}>
              {request.type === 'LATE_ARRIVAL' ? 'Thông tin đi muộn' : 'Thông tin về sớm'}
            </Text>

            {meta.fromDate ? (
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Ngày vi phạm</Text>
                <Text style={[styles.metaValue, { color: '#047857', fontWeight: '700' }]}>{formatDateStr(meta.fromDate)}</Text>
              </View>
            ) : null}

            {meta.shiftName ? (
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Ca làm việc</Text>
                <Text style={styles.metaValue}>{meta.shiftName}</Text>
              </View>
            ) : null}

            {request.type === 'LATE_ARRIVAL' && meta.startTime ? (
              <View style={[styles.metaRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
                <Text style={styles.metaLabel}>Giờ đến thực tế</Text>
                <Text style={styles.metaValue}>{formatTimeStr(meta.startTime)}</Text>
              </View>
            ) : null}

            {request.type === 'EARLY_LEAVE' && meta.endTime ? (
              <View style={[styles.metaRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
                <Text style={styles.metaLabel}>Giờ về thực tế</Text>
                <Text style={styles.metaValue}>{formatTimeStr(meta.endTime)}</Text>
              </View>
            ) : null}
          </View>
        )}

        {/* OVERTIME */}
        {request.type === 'OVERTIME' && (
          <View style={[styles.card, shadows.sm]}>
            <Text style={styles.metaSectionTitle}>Thông tin làm thêm giờ (OT)</Text>

            {meta.fromDate ? (
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Ngày làm thêm</Text>
                <Text style={[styles.metaValue, { color: '#047857', fontWeight: '700' }]}>{formatDateStr(meta.fromDate)}</Text>
              </View>
            ) : null}

            {meta.shiftName ? (
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Ca làm việc</Text>
                <Text style={styles.metaValue}>{meta.shiftName}</Text>
              </View>
            ) : null}

            {(meta.startTime || meta.endTime) ? (
              <View style={[styles.metaRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
                <Text style={styles.metaLabel}>Khung giờ OT</Text>
                <Text style={styles.metaValue}>
                  {formatTimeStr(meta.startTime)} - {formatTimeStr(meta.endTime)}
                </Text>
              </View>
            ) : null}
          </View>
        )}

        {/* Bank info */}
        {meta.bankInfo && (
          <View style={[styles.card, shadows.sm]}>
            <Text style={styles.metaSectionTitle}>Tài khoản nhận tiền</Text>
            {meta.bankInfo.bankName ? (
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Ngân hàng</Text>
                <Text style={styles.metaValue}>{meta.bankInfo.bankName}</Text>
              </View>
            ) : null}
            {meta.bankInfo.accountNumber ? (
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Số tài khoản</Text>
                <Text style={[styles.metaValue, { fontWeight: '700', color: '#0F172A' }]}>{meta.bankInfo.accountNumber}</Text>
              </View>
            ) : null}
            {meta.bankInfo.accountHolder ? (
              <View style={[styles.metaRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
                <Text style={styles.metaLabel}>Chủ tài khoản</Text>
                <Text style={styles.metaValue}>{meta.bankInfo.accountHolder}</Text>
              </View>
            ) : null}
          </View>
        )}

        {/* 4. Attachments Card */}
        {meta.image && (
          <View style={[styles.card, shadows.sm]}>
            <View style={styles.cardHeaderWithCount}>
              <Text style={styles.metaSectionTitle}>Chứng từ đính kèm</Text>
              <Text style={styles.attachmentCountBadge}>1 ảnh đính kèm</Text>
            </View>

            <TouchableOpacity 
              activeOpacity={0.9}
              onPress={() => setSelectedImage(meta.image)}
              style={styles.imageCardContainer}
            >
              <Image 
                source={{ uri: meta.image }} 
                style={styles.imageCardDisplay} 
                resizeMode="cover"
              />
              <View style={styles.imageCardOverlay}>
                <View style={styles.imageCardBadge}>
                  <MaterialCommunityIcons name="magnify-plus-outline" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                  <Text style={styles.imageCardBadgeText}>Chạm để xem chi tiết</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Disbursement receipt if any */}
        {meta.disbursementProofUrl && (
          <View style={[styles.card, shadows.sm]}>
            <View style={styles.cardHeaderWithCount}>
              <Text style={styles.metaSectionTitle}>Biên lai giải ngân</Text>
              <Text style={styles.attachmentCountBadge}>1 ảnh</Text>
            </View>

            <TouchableOpacity 
              activeOpacity={0.9}
              onPress={() => setSelectedImage(meta.disbursementProofUrl)}
              style={styles.imageCardContainer}
            >
              <Image 
                source={{ uri: meta.disbursementProofUrl }} 
                style={styles.imageCardDisplay} 
                resizeMode="cover"
              />
              <View style={styles.imageCardOverlay}>
                <View style={styles.imageCardBadge}>
                  <MaterialCommunityIcons name="magnify-plus-outline" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                  <Text style={styles.imageCardBadgeText}>Chạm để xem chi tiết</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* 5. Approval History Card */}
        {approvalSteps.length > 0 && (
          <View style={[styles.card, shadows.sm]}>
            <Text style={styles.metaSectionTitle}>Lịch sử phê duyệt</Text>

            {approvalSteps.map((step: any, idx: number) => {
              const isRejected = step.action === 'REJECTED';
              const isDisbursed = step.action === 'DISBURSED';
              return (
                <View key={idx} style={{ marginTop: idx === 0 ? 4 : 12 }}>
                  <View style={styles.historyStepRow}>
                    <View style={[styles.historyStepIcon, { backgroundColor: isRejected ? '#FEE2E2' : '#DCFCE7' }]}>
                      <MaterialCommunityIcons 
                        name={isRejected ? "close" : "check"} 
                        size={16} 
                        color={isRejected ? "#DC2626" : "#166534"} 
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={styles.historyActorName}>{step.actorName || 'Cấp duyệt'}</Text>
                        <Text style={[styles.historyStatusText, { color: isRejected ? '#DC2626' : '#166534' }]}>
                          {isRejected ? 'Từ chối' : isDisbursed ? 'Đã giải ngân' : 'Đã duyệt'}
                        </Text>
                      </View>
                      <Text style={styles.historyTimeText}>
                        {step.at ? new Date(step.at).toLocaleString('vi-VN') : ''}
                      </Text>
                    </View>
                  </View>

                  {/* Rejection / Note box */}
                  {step.reason ? (
                    <View style={styles.rejectionBox}>
                      <Text style={styles.rejectionBoxLabel}>Lý do từ chối:</Text>
                      <Text style={styles.rejectionBoxContent}>{step.reason}</Text>
                    </View>
                  ) : null}

                  {step.note ? (
                    <View style={styles.noteBox}>
                      <Text style={styles.noteBoxLabel}>Ghi chú:</Text>
                      <Text style={styles.noteBoxContent}>{step.note}</Text>
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* 6. Bottom Sticky Action Area */}
      {request.status === 'PENDING' ? (
        canActOnCurrentStage ? (
          <View style={[styles.bottomActionBar, shadows.lg, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            {/* Upload proof if accountant disbursement */}
            {stage === 'PENDING_DISBURSEMENT' && (
              <View style={{ marginBottom: 10 }}>
                <Pressable 
                  onPress={handlePickDisbursementProof}
                  style={styles.uploadProofBtn}
                >
                  <MaterialCommunityIcons name="file-upload-outline" size={18} color="#1E3E2F" />
                  <Text style={styles.uploadProofText}>
                    {disbursementProofUri ? 'Đã chọn ảnh ủy nhiệm chi (Bấm đổi)' : 'Tải lên ảnh Ủy nhiệm chi'}
                  </Text>
                </Pressable>
                {disbursementProofUri && (
                  <View style={{ marginTop: 6, alignItems: 'center' }}>
                    <Image source={{ uri: disbursementProofUri }} style={{ width: 100, height: 60, borderRadius: 6 }} />
                  </View>
                )}
              </View>
            )}

            {/* Comment box */}
            <View style={styles.commentBoxWrap}>
              <Text style={styles.commentBoxLabel}>Ghi chú / Ý kiến</Text>
              <TextInput
                style={styles.commentInputModern}
                placeholder="Nhập ghi chú nếu có..."
                placeholderTextColor="#94A3B8"
                multiline
                value={comment}
                onChangeText={setComment}
                textAlignVertical="top"
                onFocus={() => {
                  setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
                }}
              />
            </View>

            {approveSubtext ? (
              <View style={styles.stageHelperRow}>
                <MaterialCommunityIcons name="information-outline" size={14} color="#64748B" style={{ marginRight: 4 }} />
                <Text style={styles.stageHelperText}>{approveSubtext}</Text>
              </View>
            ) : null}

            {/* Button Row */}
            <View style={styles.actionButtonsRow}>
              <Pressable 
                style={[styles.rejectBtnModern, (rejectMutation.isPending || approveMutation.isPending || isUploadingProof) && { opacity: 0.5 }]} 
                onPress={handleReject}
                disabled={rejectMutation.isPending || approveMutation.isPending || isUploadingProof}
              >
                {rejectMutation.isPending ? <ActivityIndicator color="#DC2626" /> : (
                  <Text style={styles.rejectBtnModernText}>Từ chối</Text>
                )}
              </Pressable>

              <Pressable 
                style={[styles.approveBtnModern, (approveMutation.isPending || rejectMutation.isPending || isUploadingProof) && { opacity: 0.5 }]} 
                onPress={handleApprove}
                disabled={approveMutation.isPending || rejectMutation.isPending || isUploadingProof}
              >
                {approveMutation.isPending || isUploadingProof ? <ActivityIndicator color="#fff" /> : (
                  <Text style={styles.approveBtnModernText}>{approveButtonLabel}</Text>
                )}
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={[styles.bottomActionBar, shadows.lg, { paddingBottom: Math.max(insets.bottom, 16), alignItems: 'center' }]}>
            <View style={styles.waitingBanner}>
              <MaterialCommunityIcons name="clock-outline" size={18} color="#B45309" style={{ marginRight: 6 }} />
              <Text style={styles.waitingBannerText}>
                {waitingStageDescription || 'Đang chờ cấp có thẩm quyền xử lý'}
              </Text>
            </View>
          </View>
        )
      ) : (
        <View style={[styles.bottomActionBar, shadows.lg, { paddingBottom: Math.max(insets.bottom, 16), alignItems: 'center' }]}>
          <View style={[styles.finalStatusBanner, { backgroundColor: request.status === 'APPROVED' ? '#DCFCE7' : '#FEE2E2' }]}>
            <MaterialCommunityIcons 
              name={request.status === 'APPROVED' ? 'check-circle' : 'close-circle'} 
              size={18} 
              color={request.status === 'APPROVED' ? '#166534' : '#DC2626'} 
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.finalStatusBannerText, { color: request.status === 'APPROVED' ? '#166534' : '#DC2626' }]}>
              {request.status === 'APPROVED' ? 'Đơn đã được phê duyệt' : 'Đơn đã bị từ chối'}
            </Text>
          </View>
        </View>
      )}

      {/* Full-screen Image Viewer */}
      <ImageView
        images={[{ uri: selectedImage || '' }]}
        imageIndex={0}
        visible={!!selectedImage}
        onRequestClose={() => setSelectedImage(null)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconBtn: {
    padding: 4,
    marginLeft: -4,
  },
  screenTitleText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
  },
  content: {
    paddingTop: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#D9E4DD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1B382B',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 12,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  profileSubtitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginTop: 14,
    marginBottom: 10,
  },
  submissionTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  submissionTimeText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  contentTitleLarge: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 22,
  },
  amountBanner: {
    backgroundColor: '#1E3E2F',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  amountBannerLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#A7F3D0',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  amountBannerValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  detailSection: {
    paddingTop: 2,
  },
  sectionHeaderLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  detailBodyText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 21,
  },
  subtextMeta: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 8,
    fontStyle: 'italic',
  },
  metaSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  metaLabel: {
    fontSize: 13,
    color: '#64748B',
    flex: 1,
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
    flex: 2,
    textAlign: 'right',
  },
  cardHeaderWithCount: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  attachmentCountBadge: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  imageCardContainer: {
    width: '100%',
    height: 190,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative',
  },
  imageCardDisplay: {
    width: '100%',
    height: '100%',
  },
  imageCardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  imageCardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  imageCardBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  historyStepRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyStepIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  historyActorName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  historyStatusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  historyTimeText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  rejectionBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
    marginLeft: 36,
  },
  rejectionBoxLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
    marginBottom: 2,
  },
  rejectionBoxContent: {
    fontSize: 12,
    color: '#991B1B',
    lineHeight: 17,
  },
  noteBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
    marginLeft: 36,
  },
  noteBoxLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 2,
  },
  noteBoxContent: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 17,
  },
  bottomActionBar: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  commentBoxWrap: {
    marginBottom: 10,
  },
  commentBoxLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
  },
  commentInputModern: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
    minHeight: 56,
  },
  uploadProofBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: 8,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  uploadProofText: {
    marginLeft: 6,
    color: '#166534',
    fontWeight: '700',
    fontSize: 13,
  },
  stageHelperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  stageHelperText: {
    fontSize: 11,
    color: '#64748B',
    fontStyle: 'italic',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  rejectBtnModern: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectBtnModernText: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '700',
  },
  approveBtnModern: {
    flex: 2,
    backgroundColor: '#1E3E2F',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveBtnModernText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  waitingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    width: '100%',
    justifyContent: 'center',
  },
  waitingBannerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B45309',
    textAlign: 'center',
  },
  finalStatusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    width: '100%',
  },
  finalStatusBannerText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
