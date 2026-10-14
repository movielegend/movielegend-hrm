import React, { useState, useRef, useCallback } from 'react';
import { useAppAlert } from '../../contexts/AlertContext';
import { StyleSheet, Text, View, Pressable, ScrollView, TextInput, KeyboardAvoidingView, Platform, Image, TouchableOpacity, RefreshControl, Modal, StatusBar } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import ImageView from '../../components/ImageViewer/ImageViewer';
import { resolveFileUrl } from '../../utils/url';
import { spacing } from '../../theme/spacing';
import { shadows } from '../../theme/shadows';
import {
  useEmployeeRequestById,
  useApproveEmployeeRequest,
  useRejectEmployeeRequest,
  useResubmitPurchaseByHr,
  useFulfillPurchaseByHr,
  useApproveCancelCompensatory,
  useRejectCancelCompensatory,
} from '../../hooks/useEmployeeRequests';
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
  const resubmitPurchaseMutation = useResubmitPurchaseByHr();
  const fulfillPurchaseMutation = useFulfillPurchaseByHr();
  const approveCancelMutation = useApproveCancelCompensatory();
  const rejectCancelMutation = useRejectCancelCompensatory();

  const [comment, setComment] = useState('');
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [permanentReject, setPermanentReject] = useState(false);

  // Disbursement modal state
  const [isDisburseModalOpen, setIsDisburseModalOpen] = useState(false);
  const [disburseNote, setDisburseNote] = useState('');
  const [disburseBankRefCode, setDisburseBankRefCode] = useState('');

  // Purchase HR approval state
  const [isHrApprovalModalOpen, setIsHrApprovalModalOpen] = useState(false);
  const [hrBankAcc, setHrBankAcc] = useState('');
  const [hrBankName, setHrBankName] = useState('');
  const [hrAccHolder, setHrAccHolder] = useState('');
  const [hrAdjustedAmount, setHrAdjustedAmount] = useState('');
  const [hrApprovalNote, setHrApprovalNote] = useState('');

  // Purchase HR resubmit state
  const [isHrResubmitModalOpen, setIsHrResubmitModalOpen] = useState(false);
  const [resubmitAmount, setResubmitAmount] = useState('');
  const [resubmitBankAcc, setResubmitBankAcc] = useState('');
  const [resubmitBankName, setResubmitBankName] = useState('');
  const [resubmitAccHolder, setResubmitAccHolder] = useState('');
  const [resubmitExplanation, setResubmitExplanation] = useState('');

  // Purchase HR fulfillment state
  const [isHrFulfillModalOpen, setIsHrFulfillModalOpen] = useState(false);
  const [fulfillActualAmount, setFulfillActualAmount] = useState('');
  const [fulfillNote, setFulfillNote] = useState('');
  const [fulfillReceiptUri, setFulfillReceiptUri] = useState<string | null>(null);
  const [fulfillDeliveryUri, setFulfillDeliveryUri] = useState<string | null>(null);
  const [isFulfilling, setIsFulfilling] = useState(false);

  // Helper to map type to colors & labels
  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'LEAVE': return { label: 'Nghỉ phép', color: '#10B981', icon: 'beach' };
      case 'ATTENDANCE_ADJUSTMENT': return { label: 'Giải trình công', color: '#3B82F6', icon: 'clock-edit-outline' };
      case 'LATE_ARRIVAL': return { label: 'Đi muộn', color: '#F59E0B', icon: 'clock-in' };
      case 'EARLY_LEAVE': return { label: 'Về sớm', color: '#EF4444', icon: 'clock-out' };
      case 'OVERTIME': return { label: 'Làm thêm giờ', color: '#8B5CF6', icon: 'briefcase-clock' };
      case 'BUSINESS_TRIP': return { label: 'Đi công tác', color: '#0284C7', icon: 'airplane' };
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
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets.length > 0 && result.assets[0]?.uri) {
      setDisbursementProofUri(result.assets[0].uri);
    }
  };

  const handleTakePhotoDisbursementProof = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      showAlert('Quyền truy cập', 'Vui lòng cấp quyền truy cập máy ảnh để chụp ảnh bill.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets.length > 0 && result.assets[0]?.uri) {
      setDisbursementProofUri(result.assets[0].uri);
    }
  };

  const handleApprove = async () => {
    approveMutation.mutate({
      id,
      payload: {
        note: comment.trim() || undefined,
        bankRefCode: isFinancial ? (comment.trim() || undefined) : undefined,
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

  const handleApproveForwardAdmin = async () => {
    approveMutation.mutate({
      id,
      payload: {
        note: comment.trim() || 'Duyệt chờ thanh toán, chuyển Ban Giám Đốc phê duyệt',
        forwardToAdmin: true,
      }
    }, {
      onSuccess: () => {
        showAlert('Thành công', 'Đã duyệt và chuyển Ban Giám Đốc phê duyệt!');
        router.back();
      },
      onError: (err: any) => {
        showAlert('Lỗi', err.response?.data?.message || err.message || 'Có lỗi xảy ra');
      }
    });
  };

  const handleConfirmDisburse = async () => {
    if (!disbursementProofUri && !isAdmin) {
      showAlert('Yêu cầu ảnh bill', 'Vui lòng tải lên hoặc chụp ảnh bill chuyển khoản / ủy nhiệm chi để hoàn tất giải ngân.');
      return;
    }

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
        note: disburseNote.trim() || undefined,
        bankRefCode: disburseBankRefCode.trim() || undefined,
        disbursementProofUrl: proofUrl,
      }
    }, {
      onSuccess: () => {
        setIsDisburseModalOpen(false);
        setDisbursementProofUri(null);
        showAlert('Thành công', 'Đã duyệt và giải ngân thành công!');
        router.back();
      },
      onError: (err: any) => {
        showAlert('Lỗi', err.response?.data?.message || err.message || 'Có lỗi xảy ra');
      }
    });
  };

  const handleConfirmReject = () => {
    if (!rejectReason.trim()) {
      showAlert('Yêu cầu lý do', 'Vui lòng nhập lý do từ chối cụ thể (bắt buộc).');
      return;
    }
    rejectMutation.mutate({
      id,
      payload: {
        reason: rejectReason.trim(),
        permanentReject: request?.type === 'PURCHASE' ? permanentReject : undefined,
      }
    }, {
      onSuccess: () => {
        setIsRejectModalOpen(false);
        setRejectReason('');
        if (request?.type === 'PURCHASE' && !permanentReject) {
          showAlert('Đã trả về HR', 'Đơn đề xuất mua sắm đã được trả về cho HR điều chỉnh.');
        } else {
          showAlert('Đã từ chối', 'Đơn từ đã được cập nhật từ chối.');
        }
        router.back();
      },
      onError: (err: any) => {
        showAlert('Lỗi', err.response?.data?.message || err.message || 'Có lỗi xảy ra');
      }
    });
  };

  const openHrApprovalModal = () => {
    setHrAdjustedAmount(request?.amount ? String(request.amount) : '');
    const m = (typeof request?.attachmentMetadata === 'object' && request?.attachmentMetadata !== null) ? (request.attachmentMetadata as any) : {};
    setHrBankAcc(m.hrBank?.bankAccount || (currentUser as any)?.bankAccount || '');
    setHrBankName(m.hrBank?.bankName || (currentUser as any)?.bankName || '');
    setHrAccHolder(m.hrBank?.accountHolder || (currentUser as any)?.profile?.fullName || (currentUser as any)?.name || '');
    setHrApprovalNote(comment.trim());
    setIsHrApprovalModalOpen(true);
  };

  const openHrResubmitModal = () => {
    setResubmitAmount(request?.amount ? String(request.amount) : '');
    const m = (typeof request?.attachmentMetadata === 'object' && request?.attachmentMetadata !== null) ? (request.attachmentMetadata as any) : {};
    setResubmitBankAcc(m.hrBank?.bankAccount || (currentUser as any)?.bankAccount || '');
    setResubmitBankName(m.hrBank?.bankName || (currentUser as any)?.bankName || '');
    setResubmitAccHolder(m.hrBank?.accountHolder || (currentUser as any)?.profile?.fullName || (currentUser as any)?.name || '');
    setResubmitExplanation('');
    setIsHrResubmitModalOpen(true);
  };

  const openHrFulfillModal = () => {
    setFulfillActualAmount(request?.amount ? String(request.amount) : '');
    setFulfillNote('');
    setFulfillReceiptUri(null);
    setFulfillDeliveryUri(null);
    setIsHrFulfillModalOpen(true);
  };

  const handlePickFulfillReceipt = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets.length > 0 && result.assets[0]?.uri) {
      setFulfillReceiptUri(result.assets[0].uri);
    }
  };

  const handleTakeFulfillReceipt = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      showAlert('Quyền truy cập', 'Vui lòng cấp quyền truy cập máy ảnh để chụp ảnh hóa đơn.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled && result.assets && result.assets.length > 0 && result.assets[0]?.uri) {
      setFulfillReceiptUri(result.assets[0].uri);
    }
  };

  const handlePickFulfillDelivery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets.length > 0 && result.assets[0]?.uri) {
      setFulfillDeliveryUri(result.assets[0].uri);
    }
  };

  const handleTakeFulfillDelivery = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      showAlert('Quyền truy cập', 'Vui lòng cấp quyền truy cập máy ảnh để chụp ảnh bàn giao.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled && result.assets && result.assets.length > 0 && result.assets[0]?.uri) {
      setFulfillDeliveryUri(result.assets[0].uri);
    }
  };

  const handleConfirmHrPurchaseApproval = () => {
    if (!hrBankAcc.trim() || !hrBankName.trim()) {
      showAlert('Thiếu thông tin', 'Vui lòng nhập Số tài khoản và Tên ngân hàng nhận tiền của HR.');
      return;
    }
    approveMutation.mutate({
      id,
      payload: {
        bankAccount: hrBankAcc.trim(),
        bankName: hrBankName.trim(),
        accountHolder: hrAccHolder.trim() || undefined,
        adjustedAmount: hrAdjustedAmount ? Number(hrAdjustedAmount) : undefined,
        note: hrApprovalNote.trim() || undefined,
      }
    }, {
      onSuccess: () => {
        setIsHrApprovalModalOpen(false);
        showAlert('Thành công', 'Đã duyệt đề xuất mua sắm và cung cấp STK chuyển Kế toán!');
        router.back();
      },
      onError: (err: any) => {
        showAlert('Lỗi', err.response?.data?.message || err.message || 'Có lỗi xảy ra');
      }
    });
  };

  const handleConfirmHrResubmit = () => {
    if (!resubmitExplanation.trim()) {
      showAlert('Yêu cầu giải trình', 'Vui lòng nhập nội dung giải trình hoặc cập nhật báo giá.');
      return;
    }
    if (!resubmitBankAcc.trim() || !resubmitBankName.trim()) {
      showAlert('Thiếu thông tin', 'Vui lòng nhập Số tài khoản và Tên ngân hàng nhận tiền.');
      return;
    }
    resubmitPurchaseMutation.mutate({
      id,
      payload: {
        amount: resubmitAmount ? Number(resubmitAmount) : undefined,
        bankAccount: resubmitBankAcc.trim(),
        bankName: resubmitBankName.trim(),
        accountHolder: resubmitAccHolder.trim() || undefined,
        explanation: resubmitExplanation.trim(),
      }
    }, {
      onSuccess: () => {
        setIsHrResubmitModalOpen(false);
        showAlert('Thành công', 'Đã điều chỉnh và trình lại Kế toán thành công!');
        router.back();
      },
      onError: (err: any) => {
        showAlert('Lỗi', err.response?.data?.message || err.message || 'Có lỗi xảy ra');
      }
    });
  };

  const handleConfirmHrFulfill = async () => {
    setIsFulfilling(true);
    try {
      let receiptUrl: string | undefined = undefined;
      let deliveryUrl: string | undefined = undefined;

      if (fulfillReceiptUri) {
        const res = await uploadFile({
          uri: fulfillReceiptUri,
          name: `receipt_${Date.now()}.jpg`,
          mimeType: 'image/jpeg',
          purpose: 'EMPLOYEE_DOCUMENT',
        });
        receiptUrl = res.fileUrl;
      }

      if (fulfillDeliveryUri) {
        const res2 = await uploadFile({
          uri: fulfillDeliveryUri,
          name: `delivery_${Date.now()}.jpg`,
          mimeType: 'image/jpeg',
          purpose: 'EMPLOYEE_DOCUMENT',
        });
        deliveryUrl = res2.fileUrl;
      }

      await fulfillPurchaseMutation.mutateAsync({
        id,
        payload: {
          actualAmount: fulfillActualAmount ? Number(fulfillActualAmount) : undefined,
          note: fulfillNote.trim() || undefined,
          receiptUrls: receiptUrl ? [receiptUrl] : [],
          deliveryProofUrls: deliveryUrl ? [deliveryUrl] : [],
        }
      });

      setIsHrFulfillModalOpen(false);
      showAlert('Thành công', 'Đã hoàn tất mua sắm và bàn giao hàng hóa thành công!');
      router.back();
    } catch (err: any) {
      showAlert('Lỗi', err.response?.data?.message || err.message || 'Có lỗi xảy ra khi hoàn tất mua sắm');
    } finally {
      setIsFulfilling(false);
    }
  };

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/leader/employee-requests');
    }
  };

  const handleApproveCancelComp = async () => {
    try {
      await approveCancelMutation.mutateAsync({ id, note: comment.trim() || undefined });
      showAlert('Thành công', 'Đã duyệt hủy ca làm bù thành công. Ca làm việc đã được gỡ bỏ khỏi lịch.');
      handleGoBack();
    } catch (err: any) {
      showAlert('Lỗi', err.response?.data?.message || err.message || 'Không thể duyệt hủy ca làm bù.');
    }
  };

  const handleRejectCancelComp = async () => {
    try {
      await rejectCancelMutation.mutateAsync({ id, note: comment.trim() || undefined });
      showAlert('Thông báo', 'Đã từ chối yêu cầu hủy ca làm bù. Ca làm việc vẫn được giữ nguyên.');
      handleGoBack();
    } catch (err: any) {
      showAlert('Lỗi', err.response?.data?.message || err.message || 'Không thể từ chối hủy ca làm bù.');
    }
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
        <ActivityIndicator size="large" color="#102739" />
      </SafeAreaView>
    );
  }

  if (!request) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' }}>
        <Text>Không tìm thấy yêu cầu</Text>
        <Pressable onPress={handleGoBack} style={{ marginTop: 20, padding: 8 }}>
          <Text style={{ color: '#3B82F6', fontWeight: '600' }}>Quay lại</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const getStageLabelVi = (stageStr?: string, action?: string) => {
    if (action === 'PURCHASE_FULFILLED' || stageStr === 'PURCHASE_FULFILLED') return 'HR đã hoàn tất mua sắm';
    if (action === 'REJECTED_TO_HR' || stageStr === 'REJECTED_TO_HR') return 'Trả về HR điều chỉnh';
    if (stageStr === 'PENDING_HR_PURCHASE') return 'HR đang mua hàng';
    if (action === 'DISBURSED_TO_HR') return 'Kế toán/BGĐ giải ngân cho HR';
    if (action === 'DISBURSED' || stageStr === 'DISBURSED') return 'Kế toán giải ngân';
    if (action === 'REJECTED' || stageStr === 'REJECTED') return 'Từ chối';
    switch (stageStr) {
      case 'PENDING_LEADER':
      case 'LEADER':
        return 'Trưởng bộ phận duyệt';
      case 'PENDING_HR':
      case 'HR':
        return request.type === 'PURCHASE' ? 'HR đối chứng & cấp STK' : 'HR đối chứng & duyệt';
      case 'PENDING_ADMIN':
      case 'ADMIN':
        return 'Ban Giám Đốc duyệt';
      case 'PENDING_ACCOUNTANT':
      case 'PENDING_DISBURSEMENT':
      case 'ACCOUNTANT':
        return request.type === 'PURCHASE' ? 'Kế toán chuyển tiền mua hàng' : 'Kế toán giải ngân';
      case 'PENDING_HR_PURCHASE':
        return 'HR tiến hành mua hàng';
      case 'REJECTED_TO_HR':
        return 'HR điều chỉnh & báo giá lại';
      default:
        return 'Cấp duyệt';
    }
  };

  const config = getTypeConfig(request.type);
  const reqUser = (request as any)?.user;
  const reqDept = (request as any)?.department;
  const userName = reqUser?.profile?.fullName || reqUser?.email || 'Nhân viên';
  const userDept = reqDept?.name || 'Không rõ phòng ban';
  const userPos = reqUser?.profile?.position?.name || 'Nhân viên';
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
  const isNonVatOver2M = isFinancial && request.type === 'EXPENSE' && !meta.hasVat && amount > 2000000;
  const isCompensatory = (request.type as string) === 'COMPENSATORY_WORK' ||
    Boolean(request.title?.includes('[LÀM BÙ]')) ||
    meta?.requestType === 'COMPENSATORY_WORK';
  const isCancellationRequested = isCompensatory && Boolean(meta?.cancellationRequested);

  const rawRoles = currentUser?.roles || [];
  const userRoles = Array.isArray(rawRoles) ? rawRoles : [rawRoles];
  const roleCodes = userRoles.map((r: any) => (typeof r === 'string' ? r : r?.code || r?.name || '').toUpperCase());

  const isAdmin = roleCodes.includes('ADMIN') || roleCodes.includes('SUPER_ADMIN');
  const isHr = roleCodes.includes('HR') ||
    currentUser?.department?.name?.toLowerCase().includes('nhân sự') ||
    currentUser?.department?.code?.toUpperCase() === 'HR';
  const isAccountant = roleCodes.includes('ACCOUNTANT') ||
    roleCodes.includes('ACCOUNTANT_LEAD') ||
    roleCodes.includes('ACCOUNTANT_PAYROLL') ||
    roleCodes.includes('ACCOUNTANT_TAX') ||
    roleCodes.includes('ACCOUNTANT_GENERAL') ||
    currentUser?.department?.name?.toLowerCase().includes('kế toán') ||
    currentUser?.department?.name?.toLowerCase().includes('tài chính') ||
    ['KT', 'TC', 'ACC', 'ACCOUNTING'].includes(currentUser?.department?.code?.toUpperCase() || '');
  const isAccountantLead = roleCodes.includes('ACCOUNTANT_LEAD') ||
    (roleCodes.includes('LEADER') && (
      currentUser?.department?.name?.toLowerCase().includes('kế toán') ||
      currentUser?.department?.code?.toUpperCase() === 'KT' ||
      currentUser?.department?.code?.toUpperCase() === 'ACCOUNTING'
    )) ||
    isAdmin ||
    roleCodes.includes('DIRECTOR');
  const isDeptLeader = reqDept?.leaderUserId === currentUser?.id ||
    (roleCodes.includes('LEADER') && (currentUser?.department?.id === request.departmentId || currentUser?.department?.id === reqDept?.id));

  // Determine if current user can perform an approval/reject action at the current stage
  let canActOnCurrentStage = false;
  let waitingStageDescription = '';

  if (isCancellationRequested) {
    if (isAdmin || isHr || isDeptLeader) {
      canActOnCurrentStage = true;
    } else {
      waitingStageDescription = 'Đang chờ Trưởng bộ phận hoặc Quản trị viên phê duyệt hủy ca làm bù.';
    }
  } else if (request.status !== 'PENDING') {
    canActOnCurrentStage = false;
  } else if (!isFinancial) {
    if (isAdmin || isHr || isDeptLeader) {
      canActOnCurrentStage = true;
    } else {
      waitingStageDescription = 'Đang chờ Trưởng bộ phận hoặc Quản trị viên phê duyệt.';
    }
  } else {
    // Financial workflow
    const isPurchase = request.type === 'PURCHASE';

    if (stage === 'PENDING_LEADER' || stage === 'PENDING') {
      if (isDeptLeader || isAdmin) {
        canActOnCurrentStage = true;
      } else {
        waitingStageDescription = `Đang chờ Trưởng bộ phận (${userDept}) duyệt sơ bộ.`;
      }
    } else if (stage === 'PENDING_HR') {
      if (isHr || isAdmin) {
        canActOnCurrentStage = true;
      } else {
        waitingStageDescription = isPurchase
          ? 'Trưởng bộ phận đã duyệt. Đang chờ HR đối chứng báo giá & cung cấp STK nhận tiền.'
          : 'Trưởng bộ phận đã duyệt. Đang chờ HR đối chứng hồ sơ.';
      }
    } else if (stage === 'PENDING_ADMIN') {
      if (isAdmin) {
        canActOnCurrentStage = true;
      } else {
        waitingStageDescription = isPurchase
          ? 'Đề xuất mua sắm đang chờ Ban Giám Đốc phê duyệt cấp kinh phí.'
          : 'Đơn không VAT trên 2 triệu. Đang chờ Ban Giám Đốc phê duyệt.';
      }
    } else if (stage === 'PENDING_ACCOUNTANT' || stage === 'PENDING_DISBURSEMENT') {
      if (isAccountantLead) {
        canActOnCurrentStage = true;
      } else if (isAccountant) {
        canActOnCurrentStage = false;
        waitingStageDescription = isPurchase
          ? 'Đang chờ Kế toán trưởng phê duyệt và chuyển tiền mua hàng cho HR.'
          : 'Đơn đã duyệt các bước trước. Đang chờ Kế toán trưởng phê duyệt và giải ngân.';
      } else {
        waitingStageDescription = isPurchase
          ? 'Đang chờ Kế toán trưởng chuyển tiền mua hàng cho HR.'
          : 'Đơn đã được duyệt. Đang chờ Kế toán trưởng thực hiện giải ngân.';
      }
    } else if (stage === 'REJECTED_TO_HR') {
      if (isHr || isAdmin) {
        canActOnCurrentStage = true;
      } else {
        waitingStageDescription = 'Đề xuất mua hàng bị trả về. Đang chờ HR xem xét, điều chỉnh báo giá hoặc STK.';
      }
    } else if (stage === 'PENDING_HR_PURCHASE') {
      if (isHr || isAdmin) {
        canActOnCurrentStage = true;
      } else {
        waitingStageDescription = 'Tiền mua hàng đã được giải ngân cho HR. Đang chờ HR tiến hành mua sắm và bàn giao.';
      }
    }
  }

  // Determine role-based action text
  let approveButtonLabel = 'Phê duyệt';
  let approveSubtext = '';
  if (isFinancial) {
    const isPurchase = request.type === 'PURCHASE';
    if (stage === 'REJECTED_TO_HR') {
      approveButtonLabel = 'Chỉnh sửa & Trình lại';
      approveSubtext = 'HR điều chỉnh báo giá/STK và gửi lại Kế toán';
    } else if (stage === 'PENDING_HR_PURCHASE') {
      approveButtonLabel = 'Xác nhận đã mua & Bàn giao';
      approveSubtext = 'HR đã nhận tiền, mua hàng xong và bàn giao cho người đề xuất';
    } else if (stage === 'PENDING_HR') {
      if (isPurchase) {
        approveButtonLabel = 'Duyệt & Cấp STK chuyển Kế toán';
        approveSubtext = 'HR đối chứng hồ sơ & cung cấp STK nhận tiền chuyển Kế toán';
      } else {
        approveButtonLabel = 'Duyệt hồ sơ';
        approveSubtext = 'HR đối chứng hồ sơ hợp lệ';
      }
    } else if (stage === 'PENDING_ADMIN') {
      if (isPurchase) {
        approveButtonLabel = 'Duyệt & Chuyển tiền cho HR';
        approveSubtext = 'Ban Giám Đốc duyệt chi tiền mua hàng cho HR';
      } else {
        approveButtonLabel = 'Duyệt & Giải ngân';
        approveSubtext = 'Ban Giám Đốc duyệt chi & hoàn tất giải ngân';
      }
    } else if (stage === 'PENDING_ACCOUNTANT' || stage === 'PENDING_DISBURSEMENT') {
      if (isPurchase) {
        approveButtonLabel = 'Duyệt & Chuyển tiền cho HR';
        approveSubtext = 'Kế toán trưởng duyệt chi tiền mua sắm cho HR';
      } else {
        approveButtonLabel = 'Duyệt & Giải ngân';
        approveSubtext = 'Kế toán trưởng phê duyệt chi & hoàn tất';
      }
    } else if (stage === 'PENDING_LEADER' || stage === 'PENDING') {
      if (isPurchase) {
        approveButtonLabel = 'Duyệt chuyển HR';
        approveSubtext = 'Leader duyệt sơ bộ - Chuyển HR đối chứng & cấp STK';
      } else if (request.type === 'EXPENSE' || request.type === 'ADVANCE') {
        approveButtonLabel = 'Duyệt chuyển Kế toán';
        approveSubtext = 'Trưởng bộ phận duyệt sơ bộ - Chuyển Kế toán xem xét';
      } else {
        approveButtonLabel = 'Duyệt chuyển tiếp';
        approveSubtext = 'Trưởng bộ phận phê duyệt';
      }
    }
  }

  // Formatting helpers matching mockup media_1791363426977.jpg
  const getUserInitials = (name: string) => {
    if (!name) return 'ML';
    const parts = name.trim().split(/\s+/);
    const pFirst = parts[0];
    const pLast = parts[parts.length - 1];
    if (parts.length === 1 && pFirst) return pFirst.slice(0, 2).toUpperCase();
    if (pFirst && pLast && pFirst.length > 0 && pLast.length > 0) {
      const fChar = pFirst.charAt(0);
      const lChar = pLast.charAt(0);
      return (fChar + lChar).toUpperCase();
    }
    return 'ML';
  };
  const userInitials = getUserInitials(userName);

  // Subtitle e.g. "Nhân viên · Kế toán · Hà Nội"
  const branchName = reqDept?.branch?.name || (currentUser as any)?.branch?.name || 'Hà Nội';
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
    if (request.status === 'CANCELLED') {
      return {
        label: 'Đã hủy ca',
        bg: '#F3F4F6',
        color: '#6B7280',
        icon: 'close-circle' as const,
      };
    }
    if (request.status === 'REJECTED') {
      return {
        label: 'Đã từ chối',
        bg: '#FEE2E2',
        color: '#DC2626',
        icon: 'close-circle' as const,
      };
    }
    if (request.status === 'APPROVED') {
      if (isCancellationRequested) {
        return {
          label: 'Xin hủy làm bù',
          bg: '#FEF3C7',
          color: '#D97706',
          icon: 'alert-circle' as const,
        };
      }
      if (stage === 'PURCHASE_FULFILLED') {
        return {
          label: 'Đã hoàn tất mua sắm',
          bg: '#DCFCE7',
          color: '#166534',
          icon: 'check-circle' as const,
        };
      }
      return {
        label: 'Đã duyệt',
        bg: '#DCFCE7',
        color: '#166534',
        icon: 'check-circle' as const,
      };
    }
    // PENDING
    if (stage === 'PENDING_HR_PURCHASE') {
      return {
        label: 'HR đang mua hàng',
        bg: '#E0F2FE',
        color: '#0284C7',
        icon: 'cart-outline' as const,
      };
    }
    if (stage === 'REJECTED_TO_HR') {
      return {
        label: 'HR đang điều chỉnh',
        bg: '#FFEDD5',
        color: '#EA580C',
        icon: 'alert-circle-outline' as const,
      };
    }
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
        label: 'Chờ Ban Giám Đốc duyệt',
        bg: '#FEF3C7',
        color: '#B45309',
        icon: 'clock-outline' as const,
      };
    }
    if (stage === 'PENDING_ACCOUNTANT' || stage === 'PENDING_DISBURSEMENT') {
      return {
        label: 'Chờ Kế toán xử lý',
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
        case 'BUSINESS_TRIP': return 'Duyệt đi công tác';
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
      case 'BUSINESS_TRIP': return 'Chi tiết đi công tác';
      default: return 'Chi tiết đơn từ';
    }
  };

  const screenTitle = getScreenTitle();
  const safeTopInset = Math.max((insets.top > 0 ? insets.top : (StatusBar.currentHeight || 20)) - 6, 8);

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: '#102739' }} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor="#102739" />
      <View style={[styles.topSafeArea, { paddingTop: safeTopInset }]}>
        <View style={styles.topHeader}>
          <TouchableOpacity 
            onPress={handleGoBack} 
            style={styles.backBtn} 
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{screenTitle}</Text>
          <View style={{ width: 40 }} />
        </View>
      </View>

      <View style={styles.bodyWrapper}>
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
        {/* COMPENSATORY_WORK CARD */}
        {isCompensatory && (
          <View style={[styles.card, shadows.sm]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <MaterialCommunityIcons name="calendar-sync-outline" size={20} color="#0284C7" style={{ marginRight: 6 }} />
              <Text style={[styles.metaSectionTitle, { color: '#0369A1', marginBottom: 0 }]}>
                Thông tin làm bù
              </Text>
            </View>

            {meta.targetLeaveDate ? (
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Làm bù cho ngày</Text>
                <Text style={[styles.metaValue, { color: '#EF4444', fontWeight: '700' }]}>
                  {formatDateStr(meta.targetLeaveDate)}
                </Text>
              </View>
            ) : null}

            {meta.compensatoryDate ? (
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Ngày làm bù</Text>
                <Text style={[styles.metaValue, { color: '#0284C7', fontWeight: '700' }]}>
                  {formatDateStr(meta.compensatoryDate)}
                </Text>
              </View>
            ) : null}

            {meta.compensatoryShiftName ? (
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Ca làm bù</Text>
                <Text style={[styles.metaValue, { fontWeight: '700' }]}>{meta.compensatoryShiftName}</Text>
              </View>
            ) : null}

            {meta.compensatoryType ? (
              <View style={[styles.metaRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
                <Text style={styles.metaLabel}>Hình thức</Text>
                <Text style={styles.metaValue}>
                  {meta.compensatoryType} {meta.missedHours ? `(${meta.missedHours} giờ)` : ''}
                </Text>
              </View>
            ) : null}
          </View>
        )}

        {/* CANCELLATION REQUESTED BANNER */}
        {isCancellationRequested && (
          <View style={[styles.card, { backgroundColor: '#FFFBEB', borderColor: '#F59E0B', borderWidth: 1.5 }, shadows.sm]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <MaterialCommunityIcons name="alert-circle" size={22} color="#D97706" style={{ marginRight: 8 }} />
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#B45309' }}>
                Yêu cầu hủy ca làm bù từ nhân viên
              </Text>
            </View>
            <View style={{ backgroundColor: '#FEF3C7', padding: 12, borderRadius: 8, marginBottom: 8 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#92400E', marginBottom: 2 }}>
                Lý do xin hủy:
              </Text>
              <Text style={{ fontSize: 14, color: '#78350F' }}>
                "{meta.cancellationReason || 'Nhân viên có việc đột xuất không thể làm bù'}"
              </Text>
            </View>
            {meta.cancellationRequestedAt ? (
              <Text style={{ fontSize: 12, color: '#94A3B8' }}>
                Thời gian gửi: {new Date(meta.cancellationRequestedAt).toLocaleString('vi-VN')}
              </Text>
            ) : null}
          </View>
        )}

        {/* CANCELLATION STATUS (ALREADY CANCELLED) */}
        {request.status === 'CANCELLED' && (
          <View style={[styles.card, { backgroundColor: '#F8FAFC', borderColor: '#CBD5E1', borderWidth: 1 }, shadows.sm]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <MaterialCommunityIcons name="close-circle" size={20} color="#64748B" style={{ marginRight: 6 }} />
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#475569' }}>
                Ca làm bù này đã được duyệt hủy
              </Text>
            </View>
            {meta.cancellationReason ? (
              <Text style={{ fontSize: 13, color: '#64748B', marginBottom: 4 }}>
                Lý do nhân viên xin hủy: {meta.cancellationReason}
              </Text>
            ) : null}
            {meta.cancellationLeaderNote ? (
              <Text style={{ fontSize: 13, color: '#0F172A', fontWeight: '600' }}>
                Ghi chú phê duyệt hủy: {meta.cancellationLeaderNote}
              </Text>
            ) : null}
          </View>
        )}

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

        {/* BUSINESS_TRIP */}
        {request.type === 'BUSINESS_TRIP' && (
          <View style={[styles.card, shadows.sm]}>
            <Text style={styles.metaSectionTitle}>Thông tin đi công tác</Text>

            {meta.location ? (
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Địa điểm / Vị trí</Text>
                <Text style={[styles.metaValue, { color: '#0F172A', fontWeight: '700' }]}>{meta.location}</Text>
              </View>
            ) : null}

            {meta.fromDate ? (
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Lịch trình công tác</Text>
                <Text style={[styles.metaValue, { color: '#0284C7', fontWeight: '700' }]}>
                  {meta.toDate && meta.toDate !== meta.fromDate
                    ? `${formatDateStr(meta.fromDate)} - ${formatDateStr(meta.toDate)}`
                    : formatDateStr(meta.fromDate)}
                  {meta.startTime && meta.endTime
                    ? ` (${formatTimeStr(meta.startTime)} - ${formatTimeStr(meta.endTime)})`
                    : ''}
                </Text>
              </View>
            ) : null}

            <View style={[styles.approvalWorkflowBanner, { backgroundColor: '#F0F9FF', borderColor: '#BAE6FD', marginTop: 12, marginBottom: 0 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                <MaterialCommunityIcons name="information" size={16} color="#0284C7" />
                <Text style={[styles.approvalWorkflowTitle, { color: '#0369A1', marginLeft: 4 }]}>
                  Quy chế chấm công
                </Text>
              </View>
              <Text style={[styles.approvalWorkflowSubtitle, { color: '#0C4A6E' }]}>
                Khi phê duyệt, nhân sự sẽ được tự động ghi nhận 1 công/ngày cho các ngày trong lịch trình công tác.
              </Text>
            </View>
          </View>
        )}

        {/* EXPENSE - VAT & Beneficiary */}
        {request.type === 'EXPENSE' && (
          <View style={[styles.card, shadows.sm]}>
            <Text style={styles.metaSectionTitle}>Thông tin thanh toán & Hóa đơn</Text>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Phân loại VAT</Text>
              <Text style={[styles.metaValue, { color: meta.hasVat ? '#059669' : '#D97706', fontWeight: '700' }]}>
                {meta.hasVat ? 'Có hóa đơn VAT (Kế toán chi)' : 'Không VAT (Dưới 2tr: Kế toán chi | Trên 2tr: Ban Giám Đốc)'}
              </Text>
            </View>
            {(meta.beneficiaryBank || meta.beneficiaryAccount || meta.beneficiaryName) ? (
              <>
                {meta.beneficiaryBank && (
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Ngân hàng nhận</Text>
                    <Text style={styles.metaValue}>{meta.beneficiaryBank}</Text>
                  </View>
                )}
                {meta.beneficiaryAccount && (
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Số tài khoản</Text>
                    <Text style={[styles.metaValue, { fontWeight: '700' }]}>{meta.beneficiaryAccount}</Text>
                  </View>
                )}
                {meta.beneficiaryName && (
                  <View style={[styles.metaRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
                    <Text style={styles.metaLabel}>Chủ tài khoản</Text>
                    <Text style={styles.metaValue}>{meta.beneficiaryName}</Text>
                  </View>
                )}
              </>
            ) : null}
          </View>
        )}

        {/* ADVANCE - Salary Advance Details */}
        {request.type === 'ADVANCE' && (
          <View style={[styles.card, shadows.sm]}>
            <Text style={styles.metaSectionTitle}>Thông tin tạm ứng lương (Tối đa 50%)</Text>
            
            {meta.baseSalary ? (
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Lương cơ sở</Text>
                <Text style={styles.metaValue}>{Number(meta.baseSalary).toLocaleString('vi-VN')} VNĐ</Text>
              </View>
            ) : null}

            {meta.maxAdvanceLimit ? (
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Hạn mức tối đa (50%)</Text>
                <Text style={[styles.metaValue, { color: '#059669', fontWeight: '700' }]}>
                  {Number(meta.maxAdvanceLimit).toLocaleString('vi-VN')} VNĐ
                </Text>
              </View>
            ) : null}

            {(meta.bankName || meta.bankAccount || meta.accountHolder) && (
              <>
                {meta.bankName && (
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Ngân hàng thụ hưởng</Text>
                    <Text style={styles.metaValue}>{meta.bankName}</Text>
                  </View>
                )}
                {meta.bankAccount && (
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Số tài khoản</Text>
                    <Text style={[styles.metaValue, { fontWeight: '700', color: '#0F172A' }]}>{meta.bankAccount}</Text>
                  </View>
                )}
                {meta.accountHolder && (
                  <View style={[styles.metaRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
                    <Text style={styles.metaLabel}>Chủ tài khoản</Text>
                    <Text style={styles.metaValue}>{meta.accountHolder}</Text>
                  </View>
                )}
              </>
            )}

            <View style={[styles.approvalWorkflowBanner, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0', marginTop: 12, marginBottom: 0 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                <MaterialCommunityIcons name="cash-fast" size={16} color="#059669" />
                <Text style={[styles.approvalWorkflowTitle, { color: '#065F46', marginLeft: 4 }]}>
                  Quy trình duyệt Tạm ứng Lương
                </Text>
              </View>
              <Text style={[styles.approvalWorkflowSubtitle, { color: '#065F46' }]}>
                1. Nhân viên đề xuất (Tối đa 50% lương) ➔ 2. Leader duyệt ➔ 3. Kế toán trưởng duyệt & Đi lương (Giải ngân).
              </Text>
            </View>
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

        {/* PURCHASE - HR Bank Account Card */}
        {request.type === 'PURCHASE' && meta.hrBank && (
          <View style={[styles.card, shadows.sm]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <MaterialCommunityIcons name="bank" size={18} color="#2563EB" style={{ marginRight: 6 }} />
              <Text style={[styles.metaSectionTitle, { marginBottom: 0 }]}>Tài khoản HR nhận tiền mua sắm</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Ngân hàng</Text>
              <Text style={styles.metaValue}>{meta.hrBank.bankName}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Số tài khoản</Text>
              <Text style={[styles.metaValue, { fontWeight: '700', color: '#0F172A' }]}>{meta.hrBank.bankAccount}</Text>
            </View>
            <View style={[styles.metaRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
              <Text style={styles.metaLabel}>Chủ tài khoản</Text>
              <Text style={styles.metaValue}>{meta.hrBank.accountHolder || 'HR tiếp nhận'}</Text>
            </View>
            {meta.adjustedAmount ? (
              <View style={[styles.metaRow, { borderTopWidth: 1, borderColor: '#F1F5F9', marginTop: 8, paddingTop: 8 }]}>
                <Text style={styles.metaLabel}>Số tiền HR duyệt</Text>
                <Text style={[styles.metaValue, { fontWeight: '700', color: '#059669' }]}>
                  {Number(meta.adjustedAmount).toLocaleString('vi-VN')} VNĐ
                </Text>
              </View>
            ) : null}
          </View>
        )}

        {/* PURCHASE - Fulfillment Result Card */}
        {request.type === 'PURCHASE' && meta.fulfillment && (
          <View style={[styles.card, shadows.sm]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <MaterialCommunityIcons name="check-decagram" size={18} color="#166534" style={{ marginRight: 6 }} />
              <Text style={[styles.metaSectionTitle, { marginBottom: 0 }]}>Kết quả mua sắm & Bàn giao</Text>
            </View>
            {meta.fulfillment.actualAmount ? (
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Số tiền thực tế</Text>
                <Text style={[styles.metaValue, { fontWeight: '700', color: '#166534' }]}>
                  {Number(meta.fulfillment.actualAmount).toLocaleString('vi-VN')} VNĐ
                </Text>
              </View>
            ) : null}
            {meta.fulfillment.note ? (
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Ghi chú bàn giao</Text>
                <Text style={styles.metaValue}>{meta.fulfillment.note}</Text>
              </View>
            ) : null}
            <View style={[styles.metaRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
              <Text style={styles.metaLabel}>Thời gian hoàn tất</Text>
              <Text style={styles.metaValue}>
                {meta.fulfillment.fulfilledAt ? new Date(meta.fulfillment.fulfilledAt).toLocaleString('vi-VN') : ''}
              </Text>
            </View>

            {/* Fulfillment photos */}
            {((Array.isArray(meta.fulfillment.receiptUrls) && meta.fulfillment.receiptUrls.length > 0) ||
              (Array.isArray(meta.fulfillment.deliveryProofUrls) && meta.fulfillment.deliveryProofUrls.length > 0)) && (
              <View style={{ marginTop: 12 }}>
                <Text style={[styles.metaLabel, { marginBottom: 6, fontWeight: '700' }]}>Chứng từ hóa đơn & Bàn giao:</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {[...(meta.fulfillment.receiptUrls || []), ...(meta.fulfillment.deliveryProofUrls || [])].map((imgUrl: string, idx: number) => {
                    const resolved = resolveFileUrl(imgUrl) || imgUrl;
                    return (
                      <TouchableOpacity
                        key={idx}
                        activeOpacity={0.9}
                        onPress={() => setSelectedImage(resolved)}
                        style={{ width: '48%', height: 100, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC' }}
                      >
                        <Image source={{ uri: resolved }} style={{ width: '100%', height: '100%', resizeMode: 'cover' }} />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
          </View>
        )}

        {/* 4. Attachments Card */}
        {((Array.isArray(meta.images) && meta.images.length > 0) || meta.image) && (
          <View style={[styles.card, shadows.sm]}>
            <View style={styles.cardHeaderWithCount}>
              <Text style={styles.metaSectionTitle}>Hình ảnh / Chứng từ đính kèm</Text>
              <Text style={styles.attachmentCountBadge}>
                {Array.isArray(meta.images) && meta.images.length > 0
                  ? `${meta.images.length} ảnh đính kèm`
                  : '1 ảnh đính kèm'}
              </Text>
            </View>

            {Array.isArray(meta.images) && meta.images.length > 0 ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 }}>
                {meta.images.map((imgUrl: string, idx: number) => {
                  const resolvedUrl = resolveFileUrl(imgUrl) || imgUrl;
                  return (
                    <TouchableOpacity
                      key={idx}
                      activeOpacity={0.9}
                      onPress={() => setSelectedImage(resolvedUrl)}
                      style={{ width: '48%', height: 130, borderRadius: 10, overflow: 'hidden', position: 'relative', borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 6, backgroundColor: '#F1F5F9' }}
                    >
                      <Image
                        source={{ uri: resolvedUrl }}
                        style={{ width: '100%', height: '100%', resizeMode: 'cover' }}
                      />
                      <View style={styles.imageCardOverlay}>
                        <View style={[styles.imageCardBadge, { paddingHorizontal: 6, paddingVertical: 2 }]}>
                          <MaterialCommunityIcons name="magnify-plus-outline" size={12} color="#FFFFFF" style={{ marginRight: 2 }} />
                          <Text style={[styles.imageCardBadgeText, { fontSize: 10 }]}>Xem</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : meta.image ? (
              <TouchableOpacity 
                activeOpacity={0.9}
                onPress={() => setSelectedImage(resolveFileUrl(meta.image) || meta.image)}
                style={styles.imageCardContainer}
              >
                <Image 
                  source={{ uri: resolveFileUrl(meta.image) || meta.image }} 
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
            ) : null}
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
    </View>

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

            {/* Comment / Transaction ref box */}
            <View style={styles.commentBoxWrap}>
              <Text style={styles.commentBoxLabel}>
                {isFinancial ? 'Ghi chú / Ý kiến duyệt' : 'Ghi chú / Ý kiến'}
              </Text>
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
            {isCancellationRequested ? (
              <View style={styles.actionButtonsRow}>
                <Pressable 
                  style={[
                    styles.rejectBtnModern,
                    { flex: 1, borderColor: '#EA580C', backgroundColor: '#FFF7ED' },
                    (rejectCancelMutation.isPending || approveCancelMutation.isPending) && { opacity: 0.5 },
                  ]} 
                  onPress={handleRejectCancelComp}
                  disabled={rejectCancelMutation.isPending || approveCancelMutation.isPending}
                >
                  {rejectCancelMutation.isPending ? (
                    <ActivityIndicator color="#EA580C" />
                  ) : (
                    <Text style={[styles.rejectBtnModernText, { color: '#EA580C' }]}>Từ chối hủy ca</Text>
                  )}
                </Pressable>

                <Pressable 
                  style={[
                    styles.approveBtnModern,
                    { flex: 1.2, backgroundColor: '#DC2626' },
                    (approveCancelMutation.isPending || rejectCancelMutation.isPending) && { opacity: 0.5 },
                  ]} 
                  onPress={handleApproveCancelComp}
                  disabled={approveCancelMutation.isPending || rejectCancelMutation.isPending}
                >
                  {approveCancelMutation.isPending ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                      <MaterialCommunityIcons name="calendar-remove" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.approveBtnModernText}>Đồng ý hủy ca</Text>
                    </View>
                  )}
                </Pressable>
              </View>
            ) : request.type === 'PURCHASE' ? (
              stage === 'PENDING_HR_PURCHASE' ? (
                <View style={styles.actionButtonsRow}>
                  <Pressable 
                    style={[styles.approveBtnModern, { flex: 1, backgroundColor: '#059669' }, (isFulfilling || fulfillPurchaseMutation.isPending) && { opacity: 0.5 }]} 
                    onPress={openHrFulfillModal}
                    disabled={isFulfilling || fulfillPurchaseMutation.isPending}
                  >
                    {isFulfilling || fulfillPurchaseMutation.isPending ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                        <MaterialCommunityIcons name="cart-check" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                        <Text style={styles.approveBtnModernText}>Xác nhận đã mua & Bàn giao</Text>
                      </View>
                    )}
                  </Pressable>
                </View>
              ) : stage === 'REJECTED_TO_HR' ? (
                <View style={styles.actionButtonsRow}>
                  <Pressable 
                    style={[styles.rejectBtnModern, (rejectMutation.isPending || resubmitPurchaseMutation.isPending) && { opacity: 0.5 }]} 
                    onPress={() => setIsRejectModalOpen(true)}
                    disabled={rejectMutation.isPending || resubmitPurchaseMutation.isPending}
                  >
                    <Text style={styles.rejectBtnModernText}>Hủy đơn</Text>
                  </Pressable>

                  <Pressable 
                    style={[styles.approveBtnModern, { flex: 2, backgroundColor: '#EA580C' }, resubmitPurchaseMutation.isPending && { opacity: 0.5 }]} 
                    onPress={openHrResubmitModal}
                    disabled={resubmitPurchaseMutation.isPending}
                  >
                    {resubmitPurchaseMutation.isPending ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                        <MaterialCommunityIcons name="file-document-edit-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                        <Text style={styles.approveBtnModernText}>Sửa & Trình lại Kế toán</Text>
                      </View>
                    )}
                  </Pressable>
                </View>
              ) : stage === 'PENDING_ACCOUNTANT' ? (
                <View style={{ gap: 8 }}>
                  <View style={styles.actionButtonsRow}>
                    <Pressable 
                      style={[styles.rejectBtnModern, { flex: 1 }, (rejectMutation.isPending || approveMutation.isPending || isUploadingProof) && { opacity: 0.5 }]} 
                      onPress={() => setIsRejectModalOpen(true)}
                      disabled={rejectMutation.isPending || approveMutation.isPending || isUploadingProof}
                    >
                      <Text style={styles.rejectBtnModernText}>Từ chối</Text>
                    </Pressable>

                    <Pressable 
                      style={[{
                        flex: 1.2,
                        height: 48,
                        backgroundColor: '#2563EB',
                        borderRadius: 12,
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingHorizontal: 4,
                      }, (approveMutation.isPending || rejectMutation.isPending || isUploadingProof) && { opacity: 0.5 }]} 
                      onPress={handleApproveForwardAdmin}
                      disabled={approveMutation.isPending || rejectMutation.isPending || isUploadingProof}
                    >
                      <Text style={{ fontSize: 13, fontWeight: '700', color: '#FFFFFF', textAlign: 'center' }}>
                        Duyệt chờ TT
                      </Text>
                    </Pressable>

                    <Pressable 
                      style={[{
                        flex: 1.4,
                        height: 48,
                        backgroundColor: '#16A34A',
                        borderRadius: 12,
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingHorizontal: 4,
                      }, (approveMutation.isPending || rejectMutation.isPending || isUploadingProof) && { opacity: 0.5 }]} 
                      onPress={() => setIsDisburseModalOpen(true)}
                      disabled={approveMutation.isPending || rejectMutation.isPending || isUploadingProof}
                    >
                      <Text style={{ fontSize: 13, fontWeight: '700', color: '#FFFFFF', textAlign: 'center' }}>
                        Duyệt & Chi HR
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ) : stage === 'PENDING_ADMIN' ? (
                <View style={styles.actionButtonsRow}>
                  <Pressable 
                    style={[styles.rejectBtnModern, (rejectMutation.isPending || approveMutation.isPending || isUploadingProof) && { opacity: 0.5 }]} 
                    onPress={() => setIsRejectModalOpen(true)}
                    disabled={rejectMutation.isPending || approveMutation.isPending || isUploadingProof}
                  >
                    <Text style={styles.rejectBtnModernText}>Từ chối</Text>
                  </Pressable>

                  <Pressable 
                    style={[styles.approveBtnModern, { backgroundColor: '#16A34A' }, (approveMutation.isPending || rejectMutation.isPending || isUploadingProof) && { opacity: 0.5 }]} 
                    onPress={() => setIsDisburseModalOpen(true)}
                    disabled={approveMutation.isPending || rejectMutation.isPending || isUploadingProof}
                  >
                    {approveMutation.isPending || isUploadingProof ? <ActivityIndicator color="#fff" /> : (
                      <Text style={styles.approveBtnModernText}>Duyệt & Chi HR</Text>
                    )}
                  </Pressable>
                </View>
              ) : stage === 'PENDING_HR' ? (
                <View style={styles.actionButtonsRow}>
                  <Pressable 
                    style={[styles.rejectBtnModern, (rejectMutation.isPending || approveMutation.isPending) && { opacity: 0.5 }]} 
                    onPress={() => setIsRejectModalOpen(true)}
                    disabled={rejectMutation.isPending || approveMutation.isPending}
                  >
                    <Text style={styles.rejectBtnModernText}>Từ chối</Text>
                  </Pressable>

                  <Pressable 
                    style={[styles.approveBtnModern, { backgroundColor: '#2563EB' }, (approveMutation.isPending || rejectMutation.isPending) && { opacity: 0.5 }]} 
                    onPress={openHrApprovalModal}
                    disabled={approveMutation.isPending || rejectMutation.isPending}
                  >
                    {approveMutation.isPending ? <ActivityIndicator color="#fff" /> : (
                      <Text style={styles.approveBtnModernText}>Duyệt & Cấp STK</Text>
                    )}
                  </Pressable>
                </View>
              ) : (
                <View style={styles.actionButtonsRow}>
                  <Pressable 
                    style={[styles.rejectBtnModern, (rejectMutation.isPending || approveMutation.isPending) && { opacity: 0.5 }]} 
                    onPress={() => setIsRejectModalOpen(true)}
                    disabled={rejectMutation.isPending || approveMutation.isPending}
                  >
                    <Text style={styles.rejectBtnModernText}>Từ chối</Text>
                  </Pressable>

                  <Pressable 
                    style={[styles.approveBtnModern, (approveMutation.isPending || rejectMutation.isPending) && { opacity: 0.5 }]} 
                    onPress={handleApprove}
                    disabled={approveMutation.isPending || rejectMutation.isPending}
                  >
                    {approveMutation.isPending ? <ActivityIndicator color="#fff" /> : (
                      <Text style={styles.approveBtnModernText}>{approveButtonLabel}</Text>
                    )}
                  </Pressable>
                </View>
              )
            ) : !isAdmin && isNonVatOver2M && (stage === 'PENDING_ACCOUNTANT' || stage === 'PENDING_DISBURSEMENT') ? (
              <View style={{ gap: 8 }}>
                <View style={styles.actionButtonsRow}>
                  <Pressable 
                    style={[styles.rejectBtnModern, { flex: 1 }, (rejectMutation.isPending || approveMutation.isPending || isUploadingProof) && { opacity: 0.5 }]} 
                    onPress={() => setIsRejectModalOpen(true)}
                    disabled={rejectMutation.isPending || approveMutation.isPending || isUploadingProof}
                  >
                    <Text style={styles.rejectBtnModernText}>Từ chối</Text>
                  </Pressable>

                  <Pressable 
                    style={[{
                      flex: 1.3,
                      height: 48,
                      backgroundColor: '#2563EB',
                      borderRadius: 12,
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingHorizontal: 8,
                    }, (approveMutation.isPending || rejectMutation.isPending || isUploadingProof) && { opacity: 0.5 }]} 
                    onPress={handleApproveForwardAdmin}
                    disabled={approveMutation.isPending || rejectMutation.isPending || isUploadingProof}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#FFFFFF', textAlign: 'center' }}>
                      Duyệt chờ TT
                    </Text>
                  </Pressable>

                  <Pressable 
                    style={[{
                      flex: 1.4,
                      height: 48,
                      backgroundColor: '#16A34A',
                      borderRadius: 12,
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingHorizontal: 8,
                    }, (approveMutation.isPending || rejectMutation.isPending || isUploadingProof) && { opacity: 0.5 }]} 
                    onPress={() => setIsDisburseModalOpen(true)}
                    disabled={approveMutation.isPending || rejectMutation.isPending || isUploadingProof}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#FFFFFF', textAlign: 'center' }}>
                      Duyệt & Giải ngân
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <View style={styles.actionButtonsRow}>
                <Pressable 
                  style={[styles.rejectBtnModern, (rejectMutation.isPending || approveMutation.isPending || isUploadingProof) && { opacity: 0.5 }]} 
                  onPress={() => setIsRejectModalOpen(true)}
                  disabled={rejectMutation.isPending || approveMutation.isPending || isUploadingProof}
                >
                  <Text style={styles.rejectBtnModernText}>Từ chối</Text>
                </Pressable>

                <Pressable 
                  style={[styles.approveBtnModern, (approveMutation.isPending || rejectMutation.isPending || isUploadingProof) && { opacity: 0.5 }]} 
                  onPress={() => {
                    if (request.type === 'PURCHASE') {
                      handleApprove();
                    } else if (isFinancial && (stage === 'PENDING_ACCOUNTANT' || stage === 'PENDING_DISBURSEMENT' || stage === 'PENDING_ADMIN' || isAdmin)) {
                      setIsDisburseModalOpen(true);
                    } else {
                      handleApprove();
                    }
                  }}
                  disabled={approveMutation.isPending || rejectMutation.isPending || isUploadingProof}
                >
                  {approveMutation.isPending || isUploadingProof ? <ActivityIndicator color="#fff" /> : (
                    <Text style={styles.approveBtnModernText}>{approveButtonLabel}</Text>
                  )}
                </Pressable>
              </View>
            )}
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

      {/* Disbursement & Upload Bill Modal */}
      <Modal
        visible={isDisburseModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => !isUploadingProof && !approveMutation.isPending && setIsDisburseModalOpen(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalBackdrop}
        >
          <View style={[styles.modalCard, shadows.lg, { maxHeight: '90%' }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={[styles.modalHeaderIconWrap, { backgroundColor: '#DCFCE7' }]}>
                    <MaterialCommunityIcons name="cash-check" size={22} color="#166534" />
                  </View>
                  <Text style={styles.modalTitle}>Duyệt & Giải ngân</Text>
                </View>
                <TouchableOpacity 
                  onPress={() => setIsDisburseModalOpen(false)}
                  disabled={isUploadingProof || approveMutation.isPending}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <MaterialCommunityIcons name="close" size={20} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              {/* Amount & Beneficiary Banner */}
              <View style={styles.disburseInfoCard}>
                <Text style={styles.disburseInfoLabel}>SỐ TIỀN CẦN GIẢI NGÂN</Text>
                <Text style={styles.disburseInfoAmount}>
                  {(request.type === 'PURCHASE' && meta.adjustedAmount ? Number(meta.adjustedAmount) : amount).toLocaleString('vi-VN')} VNĐ
                </Text>
                
                {request.type === 'PURCHASE' && meta.hrBank ? (
                  <View style={styles.disburseRecipientWrap}>
                    <Text style={styles.disburseRecipientName}>Người nhận (HR mua sắm): {meta.hrBank.accountHolder || 'HR tiếp nhận'}</Text>
                    <Text style={styles.disburseRecipientBank}>
                      STK: {meta.hrBank.bankAccount} · Ngân hàng: {meta.hrBank.bankName}
                    </Text>
                  </View>
                ) : (meta.beneficiaryName || meta.beneficiaryAccount || meta.beneficiaryBank) ? (
                  <View style={styles.disburseRecipientWrap}>
                    {meta.beneficiaryName ? (
                      <Text style={styles.disburseRecipientName}>Chủ TK: {meta.beneficiaryName}</Text>
                    ) : null}
                    <Text style={styles.disburseRecipientBank}>
                      {meta.beneficiaryAccount ? `STK: ${meta.beneficiaryAccount}` : ''}
                      {meta.beneficiaryBank ? ` · Ngân hàng: ${meta.beneficiaryBank}` : ''}
                    </Text>
                  </View>
                ) : null}
              </View>

              {/* Bill Upload Section */}
              <View style={{ marginTop: 14 }}>
                <Text style={styles.modalInputLabel}>
                  Ảnh Bill chuyển khoản / Ủy nhiệm chi <Text style={{ color: '#DC2626' }}>*</Text>
                </Text>

                {disbursementProofUri ? (
                  <View style={styles.billPreviewContainer}>
                    <Image source={{ uri: disbursementProofUri }} style={styles.billPreviewImage} resizeMode="cover" />
                    <View style={styles.billPreviewActions}>
                      <TouchableOpacity 
                        style={styles.billChangeBtn}
                        onPress={handlePickDisbursementProof}
                      >
                        <MaterialCommunityIcons name="image-edit-outline" size={16} color="#1E3E2F" />
                        <Text style={styles.billChangeBtnText}>Đổi ảnh</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.billRemoveBtn}
                        onPress={() => setDisbursementProofUri(null)}
                      >
                        <MaterialCommunityIcons name="delete-outline" size={16} color="#DC2626" />
                        <Text style={styles.billRemoveBtnText}>Xóa</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View style={styles.billPickerRow}>
                    <TouchableOpacity 
                      style={styles.billPickerBtn}
                      onPress={handlePickDisbursementProof}
                    >
                      <MaterialCommunityIcons name="image-plus" size={24} color="#1E3E2F" />
                      <Text style={styles.billPickerBtnText}>Chọn ảnh từ thư viện</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={styles.billPickerBtn}
                      onPress={handleTakePhotoDisbursementProof}
                    >
                      <MaterialCommunityIcons name="camera-plus-outline" size={24} color="#1E3E2F" />
                      <Text style={styles.billPickerBtnText}>Chụp ảnh bill</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Transaction Ref Input */}
              <View style={{ marginTop: 14 }}>
                <Text style={styles.modalInputLabel}>Mã giao dịch ngân hàng (Nếu có)</Text>
                <TextInput
                  style={styles.modalTextInput}
                  placeholder="VD: FT260109923..."
                  placeholderTextColor="#94A3B8"
                  value={disburseBankRefCode}
                  onChangeText={setDisburseBankRefCode}
                />
              </View>

              {/* Note Input */}
              <View style={{ marginTop: 12 }}>
                <Text style={styles.modalInputLabel}>Ghi chú giải ngân (Tùy chọn)</Text>
                <TextInput
                  style={[styles.modalTextInput, { minHeight: 50 }]}
                  placeholder="Nhập ghi chú thêm nếu có..."
                  placeholderTextColor="#94A3B8"
                  multiline
                  value={disburseNote}
                  onChangeText={setDisburseNote}
                  textAlignVertical="top"
                />
              </View>

              {/* Action Buttons */}
              <View style={styles.modalActionsRow}>
                <TouchableOpacity 
                  style={styles.modalCancelBtn}
                  onPress={() => {
                    setIsDisburseModalOpen(false);
                  }}
                  disabled={isUploadingProof || approveMutation.isPending}
                >
                  <Text style={styles.modalCancelBtnText}>Hủy</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.modalConfirmDisburseBtn, (isUploadingProof || approveMutation.isPending) && { opacity: 0.7 }]}
                  onPress={handleConfirmDisburse}
                  disabled={isUploadingProof || approveMutation.isPending}
                >
                  {isUploadingProof || approveMutation.isPending ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <MaterialCommunityIcons name="check-bold" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
                      <Text style={styles.modalConfirmDisburseBtnText}>Xác nhận Giải ngân</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Rejection Modal with dedicated reason input */}
      <Modal
        visible={isRejectModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsRejectModalOpen(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalBackdrop}
        >
          <View style={[styles.modalCard, shadows.lg]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={styles.modalHeaderIconWrap}>
                  <MaterialCommunityIcons name="close-circle-outline" size={22} color="#DC2626" />
                </View>
                <Text style={styles.modalTitle}>Từ chối yêu cầu</Text>
              </View>
              <TouchableOpacity 
                onPress={() => {
                  setIsRejectModalOpen(false);
                  setRejectReason('');
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialCommunityIcons name="close" size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              {request?.type === 'PURCHASE' && (stage === 'PENDING_ACCOUNTANT' || stage === 'PENDING_ADMIN')
                ? 'Đơn sẽ được trả về cho bộ phận HR để xem xét điều chỉnh báo giá hoặc STK. Nếu muốn hủy hẳn đơn, hãy tích chọn bên dưới.'
                : 'Vui lòng nhập lý do từ chối để nhân sự được thông báo rõ ràng về quyết định này.'}
            </Text>

            <View style={{ marginTop: 14 }}>
              <Text style={styles.modalInputLabel}>
                Lý do từ chối <Text style={{ color: '#DC2626' }}>*</Text>
              </Text>
              <TextInput
                style={styles.modalReasonInput}
                placeholder="Nhập lý do từ chối cụ thể (bắt buộc)..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={4}
                value={rejectReason}
                onChangeText={setRejectReason}
                textAlignVertical="top"
                autoFocus
              />
            </View>

            {request?.type === 'PURCHASE' && (stage === 'PENDING_ACCOUNTANT' || stage === 'PENDING_ADMIN') && (
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, padding: 10, backgroundColor: '#FEF2F2', borderRadius: 8, borderWidth: 1, borderColor: '#FECACA' }}
                activeOpacity={0.8}
                onPress={() => setPermanentReject(!permanentReject)}
              >
                <MaterialCommunityIcons
                  name={permanentReject ? 'checkbox-marked' : 'checkbox-blank-outline'}
                  size={20}
                  color={permanentReject ? '#DC2626' : '#64748B'}
                  style={{ marginRight: 8 }}
                />
                <Text style={{ fontSize: 13, color: '#991B1B', flex: 1, fontWeight: '600' }}>
                  Từ chối vĩnh viễn (Hủy đơn ngay, không trả về cho HR điều chỉnh)
                </Text>
              </TouchableOpacity>
            )}

            <View style={styles.modalActionsRow}>
              <TouchableOpacity 
                style={styles.modalCancelBtn}
                onPress={() => {
                  setIsRejectModalOpen(false);
                  setRejectReason('');
                  setPermanentReject(false);
                }}
                disabled={rejectMutation.isPending}
              >
                <Text style={styles.modalCancelBtnText}>Hủy</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.modalConfirmRejectBtn, rejectMutation.isPending && { opacity: 0.6 }]}
                onPress={handleConfirmReject}
                disabled={rejectMutation.isPending}
              >
                {rejectMutation.isPending ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalConfirmRejectBtnText}>
                    {request?.type === 'PURCHASE' && (stage === 'PENDING_ACCOUNTANT' || stage === 'PENDING_ADMIN')
                      ? (permanentReject ? 'Xác nhận hủy đơn' : 'Trả về HR điều chỉnh')
                      : 'Xác nhận từ chối'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* HR Approval & Bank Account Modal */}
      <Modal
        visible={isHrApprovalModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => !approveMutation.isPending && setIsHrApprovalModalOpen(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalBackdrop}
        >
          <View style={[styles.modalCard, shadows.lg, { maxHeight: '90%' }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={[styles.modalHeaderIconWrap, { backgroundColor: '#DBEAFE' }]}>
                    <MaterialCommunityIcons name="shield-check" size={22} color="#1D4ED8" />
                  </View>
                  <Text style={styles.modalTitle}>HR Duyệt & Cấp STK</Text>
                </View>
                <TouchableOpacity 
                  onPress={() => setIsHrApprovalModalOpen(false)}
                  disabled={approveMutation.isPending}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <MaterialCommunityIcons name="close" size={20} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalSubtitle}>
                Kiểm tra báo giá, điều chỉnh số tiền duyệt (nếu có) và nhập tài khoản ngân hàng của HR để Kế toán chuyển tiền mua hàng.
              </Text>

              <View style={{ marginTop: 12 }}>
                <Text style={styles.modalInputLabel}>Số tiền duyệt chi (VNĐ)</Text>
                <TextInput
                  style={styles.modalTextInput}
                  placeholder="Nhập số tiền duyệt..."
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  value={hrAdjustedAmount}
                  onChangeText={setHrAdjustedAmount}
                />
              </View>

              <View style={{ marginTop: 12 }}>
                <Text style={styles.modalInputLabel}>
                  Số tài khoản nhận tiền <Text style={{ color: '#DC2626' }}>*</Text>
                </Text>
                <TextInput
                  style={styles.modalTextInput}
                  placeholder="VD: 19036789101..."
                  placeholderTextColor="#94A3B8"
                  value={hrBankAcc}
                  onChangeText={setHrBankAcc}
                />
              </View>

              <View style={{ marginTop: 12 }}>
                <Text style={styles.modalInputLabel}>
                  Tên ngân hàng <Text style={{ color: '#DC2626' }}>*</Text>
                </Text>
                <TextInput
                  style={styles.modalTextInput}
                  placeholder="VD: Techcombank, MB Bank, Vietcombank..."
                  placeholderTextColor="#94A3B8"
                  value={hrBankName}
                  onChangeText={setHrBankName}
                />
              </View>

              <View style={{ marginTop: 12 }}>
                <Text style={styles.modalInputLabel}>Chủ tài khoản (Tên HR nhận tiền)</Text>
                <TextInput
                  style={styles.modalTextInput}
                  placeholder="VD: NGUYEN VAN A"
                  placeholderTextColor="#94A3B8"
                  value={hrAccHolder}
                  onChangeText={setHrAccHolder}
                />
              </View>

              <View style={{ marginTop: 12 }}>
                <Text style={styles.modalInputLabel}>Ghi chú cho Kế toán (Tùy chọn)</Text>
                <TextInput
                  style={[styles.modalTextInput, { minHeight: 60 }]}
                  placeholder="Nhập ghi chú hoặc lý do điều chỉnh giá..."
                  placeholderTextColor="#94A3B8"
                  multiline
                  value={hrApprovalNote}
                  onChangeText={setHrApprovalNote}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.modalActionsRow}>
                <TouchableOpacity 
                  style={styles.modalCancelBtn}
                  onPress={() => setIsHrApprovalModalOpen(false)}
                  disabled={approveMutation.isPending}
                >
                  <Text style={styles.modalCancelBtnText}>Hủy</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.modalConfirmDisburseBtn, { backgroundColor: '#2563EB' }, approveMutation.isPending && { opacity: 0.7 }]}
                  onPress={handleConfirmHrPurchaseApproval}
                  disabled={approveMutation.isPending}
                >
                  {approveMutation.isPending ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <MaterialCommunityIcons name="send" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
                      <Text style={styles.modalConfirmDisburseBtnText}>Duyệt & Trình Kế toán</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* HR Resubmit Modal */}
      <Modal
        visible={isHrResubmitModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => !resubmitPurchaseMutation.isPending && setIsHrResubmitModalOpen(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalBackdrop}
        >
          <View style={[styles.modalCard, shadows.lg, { maxHeight: '90%' }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={[styles.modalHeaderIconWrap, { backgroundColor: '#FFEDD5' }]}>
                    <MaterialCommunityIcons name="file-document-edit" size={22} color="#EA580C" />
                  </View>
                  <Text style={styles.modalTitle}>HR Điều chỉnh & Trình lại</Text>
                </View>
                <TouchableOpacity 
                  onPress={() => setIsHrResubmitModalOpen(false)}
                  disabled={resubmitPurchaseMutation.isPending}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <MaterialCommunityIcons name="close" size={20} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalSubtitle}>
                Nhập nội dung giải trình / điều chỉnh báo giá và cập nhật STK nhận tiền để Kế toán xem xét lại đơn mua sắm.
              </Text>

              <View style={{ marginTop: 12 }}>
                <Text style={styles.modalInputLabel}>
                  Giải trình / Cập nhật báo giá <Text style={{ color: '#DC2626' }}>*</Text>
                </Text>
                <TextInput
                  style={[styles.modalReasonInput, { minHeight: 70 }]}
                  placeholder="Nhập lý do giải trình hoặc chi tiết giá mới..."
                  placeholderTextColor="#94A3B8"
                  multiline
                  value={resubmitExplanation}
                  onChangeText={setResubmitExplanation}
                  textAlignVertical="top"
                />
              </View>

              <View style={{ marginTop: 12 }}>
                <Text style={styles.modalInputLabel}>Số tiền sau điều chỉnh (VNĐ)</Text>
                <TextInput
                  style={styles.modalTextInput}
                  placeholder="Nhập số tiền..."
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  value={resubmitAmount}
                  onChangeText={setResubmitAmount}
                />
              </View>

              <View style={{ marginTop: 12 }}>
                <Text style={styles.modalInputLabel}>
                  Số tài khoản nhận tiền <Text style={{ color: '#DC2626' }}>*</Text>
                </Text>
                <TextInput
                  style={styles.modalTextInput}
                  placeholder="VD: 19036789101..."
                  placeholderTextColor="#94A3B8"
                  value={resubmitBankAcc}
                  onChangeText={setResubmitBankAcc}
                />
              </View>

              <View style={{ marginTop: 12 }}>
                <Text style={styles.modalInputLabel}>
                  Tên ngân hàng <Text style={{ color: '#DC2626' }}>*</Text>
                </Text>
                <TextInput
                  style={styles.modalTextInput}
                  placeholder="VD: Techcombank, MB Bank, Vietcombank..."
                  placeholderTextColor="#94A3B8"
                  value={resubmitBankName}
                  onChangeText={setResubmitBankName}
                />
              </View>

              <View style={{ marginTop: 12 }}>
                <Text style={styles.modalInputLabel}>Chủ tài khoản</Text>
                <TextInput
                  style={styles.modalTextInput}
                  placeholder="VD: NGUYEN VAN A"
                  placeholderTextColor="#94A3B8"
                  value={resubmitAccHolder}
                  onChangeText={setResubmitAccHolder}
                />
              </View>

              <View style={styles.modalActionsRow}>
                <TouchableOpacity 
                  style={styles.modalCancelBtn}
                  onPress={() => setIsHrResubmitModalOpen(false)}
                  disabled={resubmitPurchaseMutation.isPending}
                >
                  <Text style={styles.modalCancelBtnText}>Hủy</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.modalConfirmDisburseBtn, { backgroundColor: '#EA580C' }, resubmitPurchaseMutation.isPending && { opacity: 0.7 }]}
                  onPress={handleConfirmHrResubmit}
                  disabled={resubmitPurchaseMutation.isPending}
                >
                  {resubmitPurchaseMutation.isPending ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <MaterialCommunityIcons name="send" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
                      <Text style={styles.modalConfirmDisburseBtnText}>Trình lại Kế toán</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* HR Fulfill Purchase Modal */}
      <Modal
        visible={isHrFulfillModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => !isFulfilling && setIsHrFulfillModalOpen(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalBackdrop}
        >
          <View style={[styles.modalCard, shadows.lg, { maxHeight: '90%' }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={[styles.modalHeaderIconWrap, { backgroundColor: '#DCFCE7' }]}>
                    <MaterialCommunityIcons name="cart-check" size={22} color="#166534" />
                  </View>
                  <Text style={styles.modalTitle}>Xác nhận đã mua & Bàn giao</Text>
                </View>
                <TouchableOpacity 
                  onPress={() => setIsHrFulfillModalOpen(false)}
                  disabled={isFulfilling}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <MaterialCommunityIcons name="close" size={20} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalSubtitle}>
                Cập nhật số tiền mua thực tế, tải ảnh hóa đơn mua sắm và ảnh bàn giao cho người đề xuất để hoàn tất đơn.
              </Text>

              <View style={{ marginTop: 12 }}>
                <Text style={styles.modalInputLabel}>Số tiền mua thực tế (VNĐ)</Text>
                <TextInput
                  style={styles.modalTextInput}
                  placeholder="Nhập số tiền thực tế..."
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  value={fulfillActualAmount}
                  onChangeText={setFulfillActualAmount}
                />
              </View>

              <View style={{ marginTop: 12 }}>
                <Text style={styles.modalInputLabel}>Ghi chú bàn giao (Tùy chọn)</Text>
                <TextInput
                  style={[styles.modalTextInput, { minHeight: 60 }]}
                  placeholder="VD: Đã bàn giao đủ chuột, bàn phím và phụ kiện cho người đề xuất..."
                  placeholderTextColor="#94A3B8"
                  multiline
                  value={fulfillNote}
                  onChangeText={setFulfillNote}
                  textAlignVertical="top"
                />
              </View>

              {/* Receipt photo section */}
              <View style={{ marginTop: 14 }}>
                <Text style={styles.modalInputLabel}>Ảnh Hóa đơn / Biên lai mua hàng</Text>
                {fulfillReceiptUri ? (
                  <View style={styles.billPreviewContainer}>
                    <Image source={{ uri: fulfillReceiptUri }} style={styles.billPreviewImage} resizeMode="cover" />
                    <View style={styles.billPreviewActions}>
                      <TouchableOpacity style={styles.billChangeBtn} onPress={handlePickFulfillReceipt}>
                        <MaterialCommunityIcons name="image-edit-outline" size={16} color="#1E3E2F" />
                        <Text style={styles.billChangeBtnText}>Đổi ảnh</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.billRemoveBtn} onPress={() => setFulfillReceiptUri(null)}>
                        <MaterialCommunityIcons name="delete-outline" size={16} color="#DC2626" />
                        <Text style={styles.billRemoveBtnText}>Xóa</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View style={styles.billPickerRow}>
                    <TouchableOpacity style={styles.billPickerBtn} onPress={handlePickFulfillReceipt}>
                      <MaterialCommunityIcons name="image-plus" size={22} color="#1E3E2F" />
                      <Text style={styles.billPickerBtnText}>Thư viện ảnh</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.billPickerBtn} onPress={handleTakeFulfillReceipt}>
                      <MaterialCommunityIcons name="camera-plus-outline" size={22} color="#1E3E2F" />
                      <Text style={styles.billPickerBtnText}>Chụp ảnh bill</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Delivery photo section */}
              <View style={{ marginTop: 14 }}>
                <Text style={styles.modalInputLabel}>Ảnh Bàn giao / Nghiệm thu tài sản</Text>
                {fulfillDeliveryUri ? (
                  <View style={styles.billPreviewContainer}>
                    <Image source={{ uri: fulfillDeliveryUri }} style={styles.billPreviewImage} resizeMode="cover" />
                    <View style={styles.billPreviewActions}>
                      <TouchableOpacity style={styles.billChangeBtn} onPress={handlePickFulfillDelivery}>
                        <MaterialCommunityIcons name="image-edit-outline" size={16} color="#1E3E2F" />
                        <Text style={styles.billChangeBtnText}>Đổi ảnh</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.billRemoveBtn} onPress={() => setFulfillDeliveryUri(null)}>
                        <MaterialCommunityIcons name="delete-outline" size={16} color="#DC2626" />
                        <Text style={styles.billRemoveBtnText}>Xóa</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View style={styles.billPickerRow}>
                    <TouchableOpacity style={styles.billPickerBtn} onPress={handlePickFulfillDelivery}>
                      <MaterialCommunityIcons name="image-plus" size={22} color="#1E3E2F" />
                      <Text style={styles.billPickerBtnText}>Thư viện ảnh</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.billPickerBtn} onPress={handleTakeFulfillDelivery}>
                      <MaterialCommunityIcons name="camera-plus-outline" size={22} color="#1E3E2F" />
                      <Text style={styles.billPickerBtnText}>Chụp bàn giao</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <View style={styles.modalActionsRow}>
                <TouchableOpacity 
                  style={styles.modalCancelBtn}
                  onPress={() => setIsHrFulfillModalOpen(false)}
                  disabled={isFulfilling}
                >
                  <Text style={styles.modalCancelBtnText}>Hủy</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.modalConfirmDisburseBtn, { backgroundColor: '#059669' }, isFulfilling && { opacity: 0.7 }]}
                  onPress={handleConfirmHrFulfill}
                  disabled={isFulfilling}
                >
                  {isFulfilling ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <MaterialCommunityIcons name="check-bold" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
                      <Text style={styles.modalConfirmDisburseBtnText}>Hoàn tất mua sắm</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

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
  topSafeArea: {
    backgroundColor: '#102739',
    zIndex: 10,
    elevation: 10,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#102739',
    zIndex: 10,
    elevation: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  bodyWrapper: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -8,
    overflow: 'hidden',
  },
  content: {
    paddingTop: 16,
    paddingHorizontal: 16,
    gap: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E7F0F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 15,
    fontWeight: '800',
    color: '#102739',
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
  approvalWorkflowBanner: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  approvalWorkflowTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 6,
  },
  approvalWorkflowSubtitle: {
    fontSize: 12,
    color: '#374151',
    lineHeight: 18,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalHeaderIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  modalInputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  modalReasonInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
    minHeight: 88,
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  modalConfirmRejectBtn: {
    flex: 1.6,
    backgroundColor: '#DC2626',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmRejectBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  disburseInfoCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
  },
  disburseInfoLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#166534',
    letterSpacing: 0.5,
  },
  disburseInfoAmount: {
    fontSize: 22,
    fontWeight: '800',
    color: '#14532D',
    marginTop: 2,
    marginBottom: 6,
  },
  disburseRecipientWrap: {
    borderTopWidth: 1,
    borderTopColor: '#DCFCE7',
    paddingTop: 8,
    marginTop: 4,
  },
  disburseRecipientName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#166534',
  },
  disburseRecipientBank: {
    fontSize: 12,
    color: '#15803D',
    marginTop: 2,
  },
  billPickerRow: {
    flexDirection: 'row',
    gap: 10,
  },
  billPickerBtn: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#94A3B8',
    borderRadius: 10,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  billPickerBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginTop: 6,
  },
  billPreviewContainer: {
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F1F5F9',
  },
  billPreviewImage: {
    width: '100%',
    height: 180,
  },
  billPreviewActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  billChangeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  billChangeBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E3E2F',
    marginLeft: 4,
  },
  billRemoveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  billRemoveBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
    marginLeft: 4,
  },
  modalTextInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
  },
  modalConfirmDisburseBtn: {
    flex: 1.6,
    backgroundColor: '#1E3E2F',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmDisburseBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
