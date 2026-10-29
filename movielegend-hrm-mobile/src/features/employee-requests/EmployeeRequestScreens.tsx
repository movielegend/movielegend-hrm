import React, { useState, useCallback } from 'react';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View, Pressable, Image, ActivityIndicator, KeyboardAvoidingView, Platform, TouchableOpacity, RefreshControl, TextInput, Modal, StatusBar } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import ImageView from '../../components/ImageViewer/ImageViewer';
import { useMyEmployeeRequests, useEmployeeRequestById, useRequestCancelCompensatory } from '../../hooks/useEmployeeRequests';
import { useAuth } from '../../providers/AuthProvider';
import { useAppAlert } from '../../contexts/AlertContext';
import { uploadFile } from '../../api/uploads.api';
import { createExpenseFromPurchase } from '../../api/employee-requests.api';
import { resolveFileUrl } from '../../utils/url';
import { shadows } from '../../theme/shadows';
import { spacing } from '../../theme/spacing';

export function EmployeeRequestsHomeScreen() {
  const router = useRouter();

  const { data, isLoading } = useMyEmployeeRequests({ page: 1, limit: 50 });
  const requests = data?.items || [];

  const getStatusDisplay = (req: any) => {
    const status = req?.status;
    const meta = (typeof req?.attachmentMetadata === 'object' && req?.attachmentMetadata !== null) ? req.attachmentMetadata : {};
    const stage = meta.stage;

    if (status === 'CANCELLED') {
      return { text: 'Đã hủy ca', color: '#6B7280', bg: 'rgba(107, 114, 128, 0.1)' };
    }
    if (status === 'REJECTED') {
      return { text: 'Từ chối', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)' };
    }
    if (status === 'APPROVED') {
      if (meta.cancellationRequested) {
        return { text: 'Chờ duyệt hủy', color: '#D97706', bg: 'rgba(217, 119, 6, 0.1)' };
      }
      if (stage === 'PURCHASE_FULFILLED') {
        return { text: 'Đã hoàn tất mua sắm', color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)' };
      }
      if (meta.disbursementProofUrl || stage === 'DISBURSED') {
        return { text: 'Đã giải ngân', color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)' };
      }
      return { text: 'Đã duyệt', color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)' };
    }
    if (status === 'PENDING') {
      switch (stage) {
        case 'PENDING_LEADER':
          return { text: 'Chờ Leader duyệt', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)' };
        case 'PENDING_HR':
          return { text: 'Chờ HR đối chứng', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.1)' };
        case 'PENDING_ADMIN':
          return { text: 'Chờ Ban Giám Đốc duyệt', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.1)' };
        case 'PENDING_ACCOUNTANT':
        case 'PENDING_DISBURSEMENT':
          return { text: 'Chờ Kế toán giải ngân', color: '#F97316', bg: 'rgba(249, 115, 22, 0.1)' };
        case 'PENDING_HR_PURCHASE':
          return { text: 'HR đang mua hàng', color: '#0284C7', bg: 'rgba(2, 132, 199, 0.1)' };
        case 'REJECTED_TO_HR':
          return { text: 'HR đang điều chỉnh', color: '#EA580C', bg: 'rgba(234, 88, 12, 0.1)' };
        default:
          return { text: 'Đang chờ duyệt', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)' };
      }
    }
    return { text: 'Không rõ', color: '#6B7280', bg: 'rgba(107, 114, 128, 0.1)' };
  };

  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries();
    setRefreshing(false);
  }, [queryClient]);

  return (
    <View style={{ flex: 1, backgroundColor: '#F7FAFC' }}>
      <ScrollView 
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24, paddingTop: 12 }}>
          <Pressable onPress={() => router.back()} style={{ padding: 4, marginRight: 12 }}>
            <Ionicons name="arrow-back" size={24} color="#0B3B61" />
          </Pressable>
          <Text style={{ fontSize: 20, fontWeight: '700', color: '#0B3B61' }}>Yêu cầu của tôi</Text>
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" color="#0B3B61" style={{ marginTop: 20 }} />
        ) : requests.length === 0 ? (
          <Text style={{ textAlign: 'center', marginTop: 20, color: '#98A0A8' }}>Chưa có yêu cầu nào.</Text>
        ) : (
          requests.map(req => {
            const statusObj = getStatusDisplay(req);
            return (
              <Pressable key={req.id} onPress={() => router.push('/employee/requests/' + req.id)} style={{ backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#E6EEF3' }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' }}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: '#0B3B61', flex: 1, marginRight: 8 }} numberOfLines={1}>
                    {req.title || req.type}
                  </Text>
                  <View style={{ backgroundColor: statusObj.bg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>
                    <Text style={{ fontSize: 12, color: statusObj.color, fontWeight: '600' }}>{statusObj.text}</Text>
                  </View>
                </View>
                {req.amount != null && (
                  <Text style={{ fontSize: 15, fontWeight: '700', color: '#F97316', marginBottom: 4 }}>
                    {Number(req.amount).toLocaleString('vi-VN')} VNĐ
                  </Text>
                )}
                <Text style={{ fontSize: 13, color: '#98A0A8', marginBottom: 4 }}>
                  {req.createdAt ? new Date(req.createdAt).toLocaleDateString('vi-VN') : ''}
                </Text>
                <Text style={{ fontSize: 14, color: '#3B4A59' }} numberOfLines={2}>{req.content}</Text>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

export function CreateEmployeeRequestScreen() {
  return <View />;
}

export function EmployeeRequestDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const { showAlert } = useAppAlert();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const { data: request, isLoading, isError } = useEmployeeRequestById(id);

  // HR Purchase Fulfillment Modal State
  const [isHrPurchaseModalOpen, setIsHrPurchaseModalOpen] = useState(false);
  const [hrAmount, setHrAmount] = useState('');
  const [hrHasVat, setHrHasVat] = useState(false);
  const [hrBillProofUri, setHrBillProofUri] = useState<string | null>(null);
  const [hrNote, setHrNote] = useState('');
  const [hrBankAccount, setHrBankAccount] = useState('');
  const [hrBankName, setHrBankName] = useState('');
  const [hrAccountHolder, setHrAccountHolder] = useState('');
  const [isSubmittingHrExpense, setIsSubmittingHrExpense] = useState(false);

  // Compensatory Work Cancellation State
  const [isCancelCompModalOpen, setIsCancelCompModalOpen] = useState(false);
  const [cancelCompReason, setCancelCompReason] = useState('');
  const [cancelCompError, setCancelCompError] = useState('');
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);
  const cancelCompMutation = useRequestCancelCompensatory();

  const handleRequestCancel = async () => {
    if (!cancelCompReason.trim()) {
      setCancelCompError('Vui lòng nhập lý do xin hủy ca làm bù.');
      return;
    }
    setCancelCompError('');
    setIsSubmittingCancel(true);
    try {
      await cancelCompMutation.mutateAsync({ id, reason: cancelCompReason.trim() });
      setIsCancelCompModalOpen(false);
      setCancelCompReason('');
      setCancelCompError('');
      setTimeout(() => {
        showAlert('Thành công', 'Đã gửi yêu cầu xin hủy ca làm bù đến Leader phê duyệt.');
      }, 350);
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || 'Không thể gửi yêu cầu hủy ca làm bù.';
      setCancelCompError(errMsg);
    } finally {
      setIsSubmittingCancel(false);
    }
  };

  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries();
    setRefreshing(false);
  }, [queryClient]);

  const handlePickHrBill = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets.length > 0 && result.assets[0]?.uri) {
      setHrBillProofUri(result.assets[0].uri);
    }
  };

  const handleTakeHrBill = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      showAlert('Quyền truy cập', 'Vui lòng cấp quyền truy cập máy ảnh để chụp ảnh hóa đơn mua hàng.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled && result.assets && result.assets.length > 0 && result.assets[0]?.uri) {
      setHrBillProofUri(result.assets[0].uri);
    }
  };

  const handleConfirmHrExpense = async () => {
    if (!hrAmount.trim() || Number(hrAmount) <= 0) {
      showAlert('Lỗi', 'Vui lòng nhập Số tiền mua hàng thực tế hợp lệ.');
      return;
    }

    setIsSubmittingHrExpense(true);
    try {
      let billProofUrl = undefined;
      if (hrBillProofUri) {
        const res = await uploadFile({
          uri: hrBillProofUri,
          name: `purchase_bill_${Date.now()}.jpg`,
          mimeType: 'image/jpeg',
          purpose: 'EMPLOYEE_DOCUMENT',
        });
        billProofUrl = res.fileUrl;
      }

      await createExpenseFromPurchase(id, {
        amount: Number(hrAmount),
        hasVat: hrHasVat,
        disbursementProofUrl: billProofUrl,
        images: billProofUrl ? [billProofUrl] : undefined,
        note: hrNote.trim() || undefined,
        bankAccount: hrBankAccount.trim() || undefined,
        bankName: hrBankName.trim() || undefined,
        accountHolder: hrAccountHolder.trim() || undefined,
      });

      showAlert('Thành công', 'HR đã tạo yêu cầu thanh toán hoàn tiền thành công! Chuyển Kế toán giải ngân.');
      setIsHrPurchaseModalOpen(false);
      await queryClient.invalidateQueries();
    } catch (err: any) {
      console.log('Error creating expense from purchase:', err);
      showAlert('Lỗi', err.response?.data?.message || err.message || 'Không thể tạo đơn thanh toán.');
    } finally {
      setIsSubmittingHrExpense(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#102739" />
      </SafeAreaView>
    );
  }

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/employee/requests');
    }
  };

  if (!request) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 16, color: '#374151' }}>Không tìm thấy yêu cầu</Text>
        <Pressable onPress={handleGoBack} style={{ marginTop: 16, padding: 8 }}>
          <Text style={{ color: '#3B82F6', fontWeight: '600' }}>Quay lại</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  // Type mappings
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
      case 'COMPENSATORY_WORK': return { label: 'Làm bù', color: '#0284C7', icon: 'calendar-sync-outline' };
      default: return { label: 'Khác', color: '#6B7280', icon: 'file-document' };
    }
  };

  const getStatusDisplay = (req: any) => {
    const status = req?.status;
    const meta = (typeof req?.attachmentMetadata === 'object' && req?.attachmentMetadata !== null) ? req.attachmentMetadata : {};
    const stage = meta.stage;

    if (status === 'CANCELLED') {
      return { text: 'Đã hủy ca', color: '#6B7280', bg: '#F3F4F6' };
    }
    if (status === 'REJECTED') {
      return { text: 'Từ chối', color: '#EF4444', bg: '#FEE2E2' };
    }
    if (stage === 'PENDING_HR_PURCHASE') {
      return { text: 'Chờ HR mua hàng', color: '#0284C7', bg: '#E0F2FE' };
    }
    if (stage === 'PURCHASE_FULFILLED') {
      return { text: 'HR đã mua hàng', color: '#10B981', bg: '#D1FAE5' };
    }
    if (status === 'APPROVED') {
      if (meta.cancellationRequested) {
        return { text: 'Chờ duyệt hủy', color: '#D97706', bg: '#FEF3C7' };
      }
      if (meta.disbursementProofUrl || stage === 'DISBURSED') {
        return { text: 'Đã giải ngân', color: '#10B981', bg: '#D1FAE5' };
      }
      return { text: 'Đã duyệt', color: '#10B981', bg: '#D1FAE5' };
    }
    if (status === 'PENDING') {
      switch (stage) {
        case 'PENDING_LEADER':
          return { text: 'Chờ Leader duyệt', color: '#F59E0B', bg: '#FEF3C7' };
        case 'PENDING_HR':
          return { text: 'Chờ HR đối chứng', color: '#3B82F6', bg: '#DBEAFE' };
        case 'PENDING_ADMIN':
          return { text: 'Chờ Ban Giám Đốc duyệt', color: '#8B5CF6', bg: '#EDE9FE' };
        case 'PENDING_ACCOUNTANT':
        case 'PENDING_DISBURSEMENT':
          return { text: 'Chờ Kế toán giải ngân', color: '#F97316', bg: '#FFEDD5' };
        default:
          return { text: 'Đang chờ duyệt', color: '#F59E0B', bg: '#FEF3C7' };
      }
    }
    return { text: 'Không rõ', color: '#6B7280', bg: '#F3F4F6' };
  };

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

  let meta: Record<string, any> = {};
  if (typeof request.attachmentMetadata === 'object' && request.attachmentMetadata !== null) {
    meta = request.attachmentMetadata as Record<string, any>;
  } else if (typeof request.attachmentMetadata === 'string') {
    try {
      meta = JSON.parse(request.attachmentMetadata);
    } catch {
      meta = {};
    }
  }

  const attachmentImages: string[] = (() => {
    const list: string[] = [];
    const addImg = (val: any) => {
      if (!val) return;
      if (typeof val === 'string' && val.trim()) {
        list.push(val.trim());
      } else if (typeof val === 'object') {
        const url = val.fileUrl || val.url || val.uri || val.file?.fileUrl || val.file?.url;
        if (typeof url === 'string' && url.trim()) {
          list.push(url.trim());
        }
      }
    };

    if (Array.isArray(meta.images)) meta.images.forEach(addImg);
    if (Array.isArray(meta.photos)) meta.photos.forEach(addImg);
    if (Array.isArray(meta.photoUrls)) meta.photoUrls.forEach(addImg);
    if (Array.isArray(meta.attachments)) meta.attachments.forEach(addImg);
    addImg(meta.image);
    addImg(meta.photo);
    addImg(meta.proofUrl);
    addImg(meta.proofImage);
    if (Array.isArray((request as any)?.photos)) (request as any).photos.forEach(addImg);
    if (Array.isArray((request as any)?.attachments)) (request as any).attachments.forEach(addImg);

    return Array.from(new Set(list));
  })();
  const statusObj = getStatusDisplay(request);
  const isCompensatory = request.type === 'COMPENSATORY_WORK' || request.title?.includes('[LÀM BÙ]') || meta.requestType === 'COMPENSATORY_WORK';
  const typeConfig = isCompensatory ? { label: 'Làm bù', color: '#0284C7', icon: 'calendar-sync-outline' } : getTypeConfig(request.type);
  const dateStr = request.createdAt ? new Date(request.createdAt).toLocaleString('vi-VN') : '';
  const isFinancial = request.type === 'ADVANCE' || request.type === 'EXPENSE' || request.type === 'PURCHASE';
  const approvalSteps = Array.isArray(meta.approvalSteps) ? meta.approvalSteps : [];

  const rawRoles = currentUser?.roles || [];
  const userRoles = Array.isArray(rawRoles) ? rawRoles : [rawRoles];
  const roleCodes = userRoles.map((r: any) => (typeof r === 'string' ? r : r?.code || r?.name || '').toUpperCase());
  const isHrUser = roleCodes.includes('HR') ||
    roleCodes.includes('ADMIN') ||
    roleCodes.includes('SUPER_ADMIN') ||
    currentUser?.department?.name?.toLowerCase().includes('nhân sự') ||
    currentUser?.department?.code?.toUpperCase() === 'HR';

  const canHrFulfillPurchase = request.type === 'PURCHASE' && meta.stage === 'PENDING_HR_PURCHASE' && isHrUser;

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
          <Text style={styles.headerTitle}>Chi tiết yêu cầu</Text>
          <TouchableOpacity style={styles.shareBtn} hitSlop={10}>
            <Ionicons name="share-social-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.bodyWrapper}>
        <ScrollView 
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 60 + Math.max(insets.bottom, 24) }]} 
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />}
        >
          {/* Main Info Card */}
          <View style={styles.mainInfoCard}>
            <View style={styles.mainInfoTopRow}>
              <View style={styles.typeBadgeGroup}>
                <View style={styles.typeIconBox}>
                  <MaterialCommunityIcons name={typeConfig.icon as any} size={20} color="#10B981" />
                </View>
                <Text style={styles.typeLabelText}>{typeConfig.label}</Text>
              </View>

              <View style={[styles.statusBadge, { backgroundColor: statusObj.bg }]}>
                <Text style={[styles.statusText, { color: statusObj.color }]}>{statusObj.text}</Text>
              </View>
            </View>

            <Text style={styles.mainRequestTitle}>{request.title}</Text>
            <Text style={styles.mainRequestDate}>Gửi lúc: {dateStr}</Text>
          </View>

        {/* NỘI DUNG YÊU CẦU */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="file-document-outline" size={22} color="#102739" />
            <Text style={styles.sectionTitle}>Nội dung yêu cầu</Text>
          </View>
          <View style={styles.contentCard}>
            
            {request.amount != null && (
              <View style={styles.amountWrap}>
                <Text style={styles.amountLabel}>SỐ TIỀN</Text>
                <Text style={styles.amountValue}>{Number(request.amount).toLocaleString('vi-VN')} <Text style={styles.amountCurrency}>VNĐ</Text></Text>
              </View>
            )}

            <View style={styles.reasonBox}>
              <Text style={styles.reasonLabel}>Nội dung chi tiết</Text>
              <Text style={styles.reasonText}>"{request.content || 'Không có nội dung'}"</Text>
            </View>

            {/* Chi tiết thông tin Đơn Thanh toán (EXPENSE) */}
            {request.type === 'EXPENSE' && (
              <View style={styles.metaCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                  <MaterialCommunityIcons name="receipt" size={18} color="#F97316" style={{ marginRight: 6 }} />
                  <Text style={[styles.metaCardTitle, { color: '#C2410C', marginBottom: 0 }]}>
                    THÔNG TIN THANH TOÁN & HÓA ĐƠN
                  </Text>
                </View>

                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Phân loại VAT:</Text>
                  <Text style={[styles.metaValueBold, { color: meta.hasVat ? '#059669' : '#D97706' }]}>
                    {meta.hasVat ? 'Có hóa đơn VAT (Kế toán chi)' : 'Không VAT (Dưới 2tr: Kế toán chi | Trên 2tr: Ban Giám Đốc)'}
                  </Text>
                </View>

                {meta.fromDate ? (
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Ngày phát sinh:</Text>
                    <Text style={styles.metaValueBold}>{formatDateStr(meta.fromDate)}</Text>
                  </View>
                ) : null}

                {(meta.beneficiaryBank || meta.beneficiaryAccount || meta.beneficiaryName) ? (
                  <View style={[styles.metaRow, { borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 8, marginTop: 4 }]}>
                    <Text style={styles.metaLabel}>Tài khoản nhận:</Text>
                    <Text style={[styles.metaValueBold, { color: '#0F172A' }]}>
                      {meta.beneficiaryBank} - {meta.beneficiaryAccount} ({meta.beneficiaryName})
                    </Text>
                  </View>
                ) : null}
              </View>
            )}

            {/* 1. Chi tiết thông tin Đơn Nghỉ Phép (LEAVE) */}
            {request.type === 'LEAVE' && (
              <View style={styles.metaCard}>
                <View style={styles.metaCardHeader}>
                  <MaterialCommunityIcons name="calendar-clock" size={20} color="#102739" style={{ marginRight: 8 }} />
                  <Text style={styles.metaCardTitle}>
                    Thông tin nghỉ phép
                  </Text>
                </View>

                {meta.leaveType ? (
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Loại nghỉ:</Text>
                    <Text style={styles.metaValueBold}>{meta.leaveType}</Text>
                  </View>
                ) : null}

                {meta.leaveDurationType ? (
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Hình thức:</Text>
                    <Text style={styles.metaValueBold}>{meta.leaveDurationType}</Text>
                  </View>
                ) : null}

                {/* Thời gian nghỉ */}
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Thời gian nghỉ:</Text>
                  <Text style={[styles.metaValueBold, { color: '#10B981' }]}>
                    {meta.leaveDurationType === 'Nhiều ngày' && meta.toDate
                      ? `Từ ${formatDateStr(meta.fromDate)} đến ${formatDateStr(meta.toDate)}`
                      : formatDateStr(meta.fromDate)}
                    {meta.startTime && meta.endTime
                      ? ` (${formatTimeStr(meta.startTime)} - ${formatTimeStr(meta.endTime)})`
                      : ''}
                  </Text>
                </View>

                {meta.handoverEmployee ? (
                  <View style={[styles.metaRow, { borderTopWidth: 1, borderTopColor: '#F4F4F5', paddingTop: 8, marginTop: 4 }]}>
                    <Text style={styles.metaLabel}>Người bàn giao:</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <MaterialCommunityIcons name="account-check-outline" size={16} color="#10B981" style={{ marginRight: 4 }} />
                      <Text style={[styles.metaValueBold, { color: '#10B981' }]}>
                        {meta.handoverEmployee}
                      </Text>
                    </View>
                  </View>
                ) : null}
              </View>
            )}

            {/* Chi tiết thông tin Đơn Làm Bù (COMPENSATORY_WORK) */}
            {isCompensatory && (
              <View style={styles.metaCard}>
                <View style={styles.metaCardHeader}>
                  <MaterialCommunityIcons name="calendar-sync-outline" size={20} color="#0284C7" style={{ marginRight: 8 }} />
                  <Text style={[styles.metaCardTitle, { color: '#0369A1' }]}>
                    THÔNG TIN LÀM BÙ
                  </Text>
                </View>

                {meta.targetLeaveDate ? (
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Làm bù cho ngày:</Text>
                    <Text style={[styles.metaValueBold, { color: '#EF4444' }]}>{formatDateStr(meta.targetLeaveDate)}</Text>
                  </View>
                ) : null}

                {Array.isArray(meta.compensationShifts) && meta.compensationShifts.length > 0 ? (
                  meta.compensationShifts.map((s: any, idx: number) => (
                    <View key={idx} style={[styles.metaRow, { alignItems: 'flex-start' }]}>
                      <Text style={styles.metaLabel}>Ca làm bù {meta.compensationShifts.length > 1 ? `${idx + 1}` : ''}:</Text>
                      <View style={{ flex: 1, alignItems: 'flex-end' }}>
                        <Text style={[styles.metaValueBold, { color: '#0284C7' }]}>
                          {formatDateStr(s.date)} · {s.shiftName || 'Ca làm'}
                        </Text>
                        <Text style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                          +{s.rate || 1.0} công {s.hours ? `(${s.hours}h)` : ''}
                        </Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <>
                    {meta.compensatoryDate ? (
                      <View style={styles.metaRow}>
                        <Text style={styles.metaLabel}>Ngày làm bù:</Text>
                        <Text style={[styles.metaValueBold, { color: '#0284C7' }]}>{formatDateStr(meta.compensatoryDate)}</Text>
                      </View>
                    ) : null}

                    {meta.compensatoryShiftName ? (
                      <View style={styles.metaRow}>
                        <Text style={styles.metaLabel}>Ca làm bù:</Text>
                        <Text style={styles.metaValueBold}>{meta.compensatoryShiftName}</Text>
                      </View>
                    ) : null}

                    {meta.compensatoryType ? (
                      <View style={styles.metaRow}>
                        <Text style={styles.metaLabel}>Hình thức:</Text>
                        <Text style={styles.metaValueBold}>
                          {meta.compensatoryType} {meta.missedHours ? `(${meta.missedHours} giờ)` : ''}
                        </Text>
                      </View>
                    ) : null}
                  </>
                )}
              </View>
            )}

            {/* Trạng thái xin hủy ca làm bù */}
            {isCompensatory && meta.cancellationRequested && request.status === 'APPROVED' && (
              <View style={{ backgroundColor: '#FFFBEB', borderColor: '#F59E0B', borderWidth: 1, borderRadius: 10, padding: 14, marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                  <MaterialCommunityIcons name="clock-alert-outline" size={20} color="#D97706" style={{ marginRight: 6 }} />
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#B45309' }}>
                    Đang chờ Leader duyệt hủy ca làm bù
                  </Text>
                </View>
                <Text style={{ fontSize: 13, color: '#78350F', marginBottom: 4 }}>
                  Lý do xin hủy: "{meta.cancellationReason}"
                </Text>
                {meta.cancellationRequestedAt ? (
                  <Text style={{ fontSize: 11, color: '#94A3B8' }}>
                    Gửi lúc: {new Date(meta.cancellationRequestedAt).toLocaleString('vi-VN')}
                  </Text>
                ) : null}
              </View>
            )}

            {/* Thông báo nếu đã bị từ chối hủy */}
            {isCompensatory && meta.cancellationRejected && request.status === 'APPROVED' && (
              <View style={{ backgroundColor: '#FEF2F2', borderColor: '#FCA5A5', borderWidth: 1, borderRadius: 10, padding: 14, marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                  <MaterialCommunityIcons name="close-circle-outline" size={20} color="#DC2626" style={{ marginRight: 6 }} />
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#991B1B' }}>
                    Leader không đồng ý hủy ca làm bù
                  </Text>
                </View>
                <Text style={{ fontSize: 13, color: '#7F1D1D' }}>
                  Lý do: "{meta.cancellationRejectReason || 'Không chấp thuận'}"
                </Text>
                <Text style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
                  Ca làm bù của bạn vẫn giữ nguyên theo lịch phân công.
                </Text>
              </View>
            )}

            {/* Thông báo nếu đơn đã hủy thành công */}
            {isCompensatory && request.status === 'CANCELLED' && (
              <View style={{ backgroundColor: '#F8FAFC', borderColor: '#CBD5E1', borderWidth: 1, borderRadius: 10, padding: 14, marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                  <MaterialCommunityIcons name="check-circle-outline" size={20} color="#64748B" style={{ marginRight: 6 }} />
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#475569' }}>
                    Đơn làm bù đã được duyệt hủy
                  </Text>
                </View>
                {meta.cancellationReason ? (
                  <Text style={{ fontSize: 13, color: '#64748B', marginBottom: 4 }}>
                    Lý do xin hủy: "{meta.cancellationReason}"
                  </Text>
                ) : null}
                {meta.cancellationLeaderNote ? (
                  <Text style={{ fontSize: 13, color: '#0F172A', fontWeight: '600', marginBottom: 4 }}>
                    Ghi chú của Leader: "{meta.cancellationLeaderNote}"
                  </Text>
                ) : null}
                <Text style={{ fontSize: 12, color: '#059669', marginTop: 4 }}>
                  Ca làm việc đã được gỡ bỏ khỏi lịch. Bạn có thể chọn ngày khác để tạo đơn làm bù mới.
                </Text>
              </View>
            )}

            {/* Nút xin hủy ca làm bù cho nhân viên khi đơn APPROVED và chưa xin hủy */}
            {isCompensatory && request.status === 'APPROVED' && !meta.cancellationRequested && (
              <View style={{ marginBottom: 16 }}>
                <TouchableOpacity
                  onPress={() => {
                    setCancelCompError('');
                    setIsCancelCompModalOpen(true);
                  }}
                  style={{
                    borderWidth: 1.5,
                    borderColor: '#EA580C',
                    backgroundColor: '#FFF7ED',
                    borderRadius: 10,
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'row',
                  }}
                >
                  <MaterialCommunityIcons name="calendar-remove" size={18} color="#EA580C" style={{ marginRight: 6 }} />
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#EA580C' }}>
                    Xin hủy ca làm bù
                  </Text>
                </TouchableOpacity>
                <Text style={{ fontSize: 11, color: '#94A3B8', textAlign: 'center', marginTop: 4 }}>
                  (Nếu có việc đột xuất, bạn có thể xin hủy ca làm bù để Leader xét duyệt)
                </Text>
              </View>
            )}

            {/* 2. Chi tiết thông tin Giải trình công (ATTENDANCE_ADJUSTMENT) */}
            {request.type === 'ATTENDANCE_ADJUSTMENT' && (
              <View style={styles.metaCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                  <MaterialCommunityIcons name="clock-edit-outline" size={18} color="#3B82F6" style={{ marginRight: 6 }} />
                  <Text style={[styles.metaCardTitle, { color: '#1D4ED8', marginBottom: 0 }]}>
                    THÔNG TIN GIẢI TRÌNH CÔNG
                  </Text>
                </View>

                {meta.explanationType ? (
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Loại giải trình:</Text>
                    <Text style={styles.metaValueBold}>{meta.explanationType}</Text>
                  </View>
                ) : null}

                {meta.fromDate ? (
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Ngày cần giải trình:</Text>
                    <Text style={[styles.metaValueBold, { color: '#2563EB' }]}>{formatDateStr(meta.fromDate)}</Text>
                  </View>
                ) : null}

                {meta.shiftName ? (
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Ca làm việc:</Text>
                    <Text style={styles.metaValueBold}>{meta.shiftName}</Text>
                  </View>
                ) : null}

                {(meta.startTime || meta.endTime) ? (
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Giờ thực tế:</Text>
                    <Text style={[styles.metaValueBold, { color: '#1D4ED8' }]}>
                      {meta.startTime ? `Vào: ${formatTimeStr(meta.startTime)}` : ''}
                      {meta.startTime && meta.endTime ? ' | ' : ''}
                      {meta.endTime ? `Ra: ${formatTimeStr(meta.endTime)}` : ''}
                    </Text>
                  </View>
                ) : null}
              </View>
            )}

            {/* 3. Chi tiết Đi muộn / Về sớm */}
            {(request.type === 'LATE_ARRIVAL' || request.type === 'EARLY_LEAVE') && (
              <View style={styles.metaCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                  <MaterialCommunityIcons 
                    name={request.type === 'LATE_ARRIVAL' ? 'clock-in' : 'clock-out'} 
                    size={18} 
                    color={request.type === 'LATE_ARRIVAL' ? '#F59E0B' : '#EF4444'} 
                    style={{ marginRight: 6 }} 
                  />
                  <Text style={[styles.metaCardTitle, { color: request.type === 'LATE_ARRIVAL' ? '#B45309' : '#B91C1C', marginBottom: 0 }]}>
                    {request.type === 'LATE_ARRIVAL' ? 'THÔNG TIN ĐI MUỘN' : 'THÔNG TIN VỀ SỚM'}
                  </Text>
                </View>

                {meta.fromDate ? (
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Ngày áp dụng:</Text>
                    <Text style={[styles.metaValueBold, { color: '#2563EB' }]}>{formatDateStr(meta.fromDate)}</Text>
                  </View>
                ) : null}

                {meta.shiftName ? (
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Ca làm việc:</Text>
                    <Text style={styles.metaValueBold}>{meta.shiftName}</Text>
                  </View>
                ) : null}

                {request.type === 'LATE_ARRIVAL' && meta.startTime ? (
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Giờ đến thực tế:</Text>
                    <Text style={[styles.metaValueBold, { color: '#F59E0B' }]}>{formatTimeStr(meta.startTime)}</Text>
                  </View>
                ) : null}

                {request.type === 'EARLY_LEAVE' && meta.endTime ? (
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Giờ về thực tế:</Text>
                    <Text style={[styles.metaValueBold, { color: '#EF4444' }]}>{formatTimeStr(meta.endTime)}</Text>
                  </View>
                ) : null}
              </View>
            )}

            {/* 4. Chi tiết Làm thêm giờ (OVERTIME) */}
            {request.type === 'OVERTIME' && (
              <View style={styles.metaCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                  <MaterialCommunityIcons name="briefcase-clock" size={18} color="#8B5CF6" style={{ marginRight: 6 }} />
                  <Text style={[styles.metaCardTitle, { color: '#6D28D9', marginBottom: 0 }]}>
                    THÔNG TIN LÀM THÊM GIỜ (OT)
                  </Text>
                </View>

                {(meta.fromDate || meta.otDate || meta.workDate) ? (
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Ngày làm thêm:</Text>
                    <Text style={[styles.metaValueBold, { color: '#2563EB' }]}>
                      {formatDateStr(meta.fromDate || meta.otDate || meta.workDate)}
                    </Text>
                  </View>
                ) : null}

                {meta.shiftName ? (
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Ca làm việc:</Text>
                    <Text style={styles.metaValueBold}>{meta.shiftName}</Text>
                  </View>
                ) : null}

                {(meta.proposedPercent || meta.percent) ? (
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Mức công đề xuất:</Text>
                    <Text style={[styles.metaValueBold, { color: '#8B5CF6' }]}>
                      {meta.proposedPercent || meta.percent}%
                    </Text>
                  </View>
                ) : null}

                {meta.validOtMinutes ? (
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Thời gian hợp lệ:</Text>
                    <Text style={[styles.metaValueBold, { color: '#059669' }]}>
                      {Math.floor(meta.validOtMinutes / 60)}h {meta.validOtMinutes % 60}p
                    </Text>
                  </View>
                ) : null}

                {(meta.startTime || meta.endTime) ? (
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Khung giờ OT:</Text>
                    <Text style={[styles.metaValueBold, { color: '#8B5CF6' }]}>
                      {formatTimeStr(meta.startTime)} - {formatTimeStr(meta.endTime)}
                    </Text>
                  </View>
                ) : null}
              </View>
            )}

            {/* 5. Chi tiết Đi công tác (BUSINESS_TRIP) */}
            {request.type === 'BUSINESS_TRIP' && (
              <View style={styles.metaCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                  <MaterialCommunityIcons name="airplane" size={18} color="#0284C7" style={{ marginRight: 6 }} />
                  <Text style={[styles.metaCardTitle, { color: '#0369A1', marginBottom: 0 }]}>
                    THÔNG TIN ĐI CÔNG TÁC
                  </Text>
                </View>

                {meta.location ? (
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Địa điểm / Vị trí:</Text>
                    <Text style={[styles.metaValueBold, { color: '#0F172A' }]}>{meta.location}</Text>
                  </View>
                ) : null}

                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Thời gian công tác:</Text>
                  <Text style={[styles.metaValueBold, { color: '#0284C7' }]}>
                    {meta.toDate && meta.toDate !== meta.fromDate
                      ? `Từ ${formatDateStr(meta.fromDate)} đến ${formatDateStr(meta.toDate)}`
                      : formatDateStr(meta.fromDate)}
                    {meta.startTime && meta.endTime
                      ? ` (${formatTimeStr(meta.startTime)} - ${formatTimeStr(meta.endTime)})`
                      : ''}
                  </Text>
                </View>

                <View style={[styles.metaRow, { borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 8, marginTop: 4 }]}>
                  <Text style={styles.metaLabel}>Quyền lợi:</Text>
                  <Text style={[styles.metaValueBold, { color: '#059669' }]}>
                    +1 công/ngày khi được duyệt
                  </Text>
                </View>
              </View>
            )}

            {/* 6. Chi tiết Đề xuất mua sắm (PURCHASE) */}
            {request.type === 'PURCHASE' && (
              <View style={styles.metaCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                  <MaterialCommunityIcons name="cart-outline" size={18} color="#0EA5E9" style={{ marginRight: 6 }} />
                  <Text style={[styles.metaCardTitle, { color: '#0369A1', marginBottom: 0 }]}>
                    THÔNG TIN ĐỀ XUẤT MUA SẮM
                  </Text>
                </View>

                {meta.itemName ? (
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Sản phẩm / Vật tư:</Text>
                    <Text style={[styles.metaValueBold, { color: '#0F172A' }]}>{meta.itemName}</Text>
                  </View>
                ) : null}

                {meta.quantity ? (
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Số lượng:</Text>
                    <Text style={[styles.metaValueBold, { color: '#0EA5E9' }]}>{meta.quantity}</Text>
                  </View>
                ) : null}

                {(meta.neededDate || meta.fromDate) ? (
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Ngày cần có:</Text>
                    <Text style={[styles.metaValueBold, { color: '#2563EB' }]}>
                      {formatDateStr(meta.neededDate || meta.fromDate)}
                    </Text>
                  </View>
                ) : null}

                {meta.purchasedByHrName ? (
                  <View style={[styles.metaRow, { borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 8, marginTop: 4 }]}>
                    <Text style={styles.metaLabel}>Nhân sự mua hàng:</Text>
                    <Text style={[styles.metaValueBold, { color: '#059669' }]}>
                      {meta.purchasedByHrName} (Đã mua xong)
                    </Text>
                  </View>
                ) : null}
              </View>
            )}

            {meta.hrBank && (
              <View style={{ backgroundColor: '#F0F9FF', padding: 12, borderRadius: 8, marginBottom: 16, borderWidth: 1, borderColor: '#BAE6FD' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                  <MaterialCommunityIcons name="bank" size={16} color="#0369A1" style={{ marginRight: 6 }} />
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#0369A1' }}>
                    TÀI KHOẢN HR NHẬN TIỀN MUA HÀNG
                  </Text>
                </View>
                {meta.hrBank.bankName ? (
                  <Text style={{ fontSize: 13, color: '#334155', marginBottom: 2 }}>
                    Ngân hàng: <Text style={{ fontWeight: '600' }}>{meta.hrBank.bankName}</Text>
                  </Text>
                ) : null}
                {meta.hrBank.bankAccount ? (
                  <Text style={{ fontSize: 13, color: '#334155', marginBottom: 2 }}>
                    Số tài khoản: <Text style={{ fontWeight: '700', color: '#0F172A' }}>{meta.hrBank.bankAccount}</Text>
                  </Text>
                ) : null}
                {meta.hrBank.accountHolder ? (
                  <Text style={{ fontSize: 13, color: '#334155' }}>
                    Chủ tài khoản: <Text style={{ fontWeight: '600' }}>{meta.hrBank.accountHolder}</Text>
                  </Text>
                ) : null}
              </View>
            )}

            {meta.fulfillment && (
              <View style={{ backgroundColor: '#F0FDF4', padding: 14, borderRadius: 10, marginBottom: 16, borderWidth: 1, borderColor: '#86EFAC' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <MaterialCommunityIcons name="check-decagram" size={20} color="#15803D" style={{ marginRight: 6 }} />
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#15803D' }}>
                    KẾT QUẢ MUA SẮM & BÀN GIAO
                  </Text>
                </View>
                {meta.fulfillment.actualAmount != null && (
                  <Text style={{ fontSize: 13, color: '#166534', marginBottom: 4 }}>
                    Số tiền thực tế: <Text style={{ fontWeight: '700' }}>{Number(meta.fulfillment.actualAmount).toLocaleString('vi-VN')} VNĐ</Text>
                  </Text>
                )}
                {meta.fulfillment.note ? (
                  <Text style={{ fontSize: 13, color: '#374151', marginBottom: 8 }}>
                    Ghi chú HR: {meta.fulfillment.note}
                  </Text>
                ) : null}

                {Array.isArray(meta.fulfillment.receiptUrls) && meta.fulfillment.receiptUrls.length > 0 && (
                  <View style={{ marginTop: 6 }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: '#15803D', marginBottom: 4 }}>Hóa đơn / Biên lai mua sắm:</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                      {meta.fulfillment.receiptUrls.map((rUrl: string, rIdx: number) => {
                        const resolved = resolveFileUrl(rUrl) || rUrl;
                        return (
                          <TouchableOpacity key={rIdx} onPress={() => setSelectedImage(resolved)} style={{ width: 80, height: 80, borderRadius: 6, overflow: 'hidden', borderWidth: 1, borderColor: '#86EFAC' }}>
                            <Image source={{ uri: resolved }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}

                {Array.isArray(meta.fulfillment.deliveryProofUrls) && meta.fulfillment.deliveryProofUrls.length > 0 && (
                  <View style={{ marginTop: 10 }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: '#15803D', marginBottom: 4 }}>Ảnh bàn giao / Nghiệm thu:</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                      {meta.fulfillment.deliveryProofUrls.map((dUrl: string, dIdx: number) => {
                        const resolved = resolveFileUrl(dUrl) || dUrl;
                        return (
                          <TouchableOpacity key={dIdx} onPress={() => setSelectedImage(resolved)} style={{ width: 80, height: 80, borderRadius: 6, overflow: 'hidden', borderWidth: 1, borderColor: '#86EFAC' }}>
                            <Image source={{ uri: resolved }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}
              </View>
            )}

            {meta.bankInfo && (
              <View style={{ backgroundColor: '#F0F9FF', padding: 12, borderRadius: 8, marginBottom: 16, borderWidth: 1, borderColor: '#BAE6FD' }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#0369A1', marginBottom: 6 }}>
                  THÔNG TIN TÀI KHOẢN NHẬN TIỀN
                </Text>
                {meta.bankInfo.bankName ? (
                  <Text style={{ fontSize: 13, color: '#334155', marginBottom: 2 }}>
                    Ngân hàng: <Text style={{ fontWeight: '600' }}>{meta.bankInfo.bankName}</Text>
                  </Text>
                ) : null}
                {meta.bankInfo.accountNumber ? (
                  <Text style={{ fontSize: 13, color: '#334155', marginBottom: 2 }}>
                    Số tài khoản: <Text style={{ fontWeight: '700', color: '#0F172A' }}>{meta.bankInfo.accountNumber}</Text>
                  </Text>
                ) : null}
                {meta.bankInfo.accountHolder ? (
                  <Text style={{ fontSize: 13, color: '#334155' }}>
                    Chủ tài khoản: <Text style={{ fontWeight: '600' }}>{meta.bankInfo.accountHolder}</Text>
                  </Text>
                ) : null}
              </View>
            )}

            {attachmentImages.length > 0 && (
              <View style={styles.attachmentBox}>
                <Text style={styles.attachmentLabel}>
                  {attachmentImages.length > 1
                    ? `Hình ảnh minh họa (${attachmentImages.length} ảnh):`
                    : 'Ảnh chứng từ / minh chứng đính kèm:'}
                </Text>
                {attachmentImages.length > 1 ? (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                    {attachmentImages.map((imgUrl: string, idx: number) => {
                      const resolvedUrl = resolveFileUrl(imgUrl) || imgUrl;
                      return (
                        <TouchableOpacity 
                          key={idx} 
                          onPress={() => setSelectedImage(resolvedUrl)}
                          style={{ width: 90, height: 90, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#F1F5F9' }}
                        >
                          <Image 
                            source={{ uri: resolvedUrl }} 
                            style={{ width: '100%', height: '100%', resizeMode: 'cover' }} 
                          />
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : (
                  <TouchableOpacity onPress={() => setSelectedImage(resolveFileUrl(attachmentImages[0]) || attachmentImages[0])}>
                    <Image 
                      source={{ uri: resolveFileUrl(attachmentImages[0]) || attachmentImages[0] }} 
                      style={styles.evidenceImage} 
                      resizeMode="contain"
                    />
                  </TouchableOpacity>
                )}
              </View>
            )}

            {(() => {
              const disburseStep = Array.isArray(meta.approvalSteps) ? meta.approvalSteps.find((s: any) => s.action === 'DISBURSED' || s.action === 'DISBURSED_TO_HR') : undefined;
              const proofUrl = meta.disbursementProofUrl || disburseStep?.disbursementProofUrl;
              const bankRef = meta.bankRefCode || disburseStep?.bankRefCode;
              if (!proofUrl && !bankRef) return null;
              return (
                <View style={[styles.attachmentBox, { marginTop: 16, backgroundColor: '#F0FDF4', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#BBF7D0' }]}>
                  <Text style={[styles.attachmentLabel, { color: '#15803D' }]}>Biên lai / Chứng từ giải ngân:</Text>
                  {bankRef ? (
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#166534', marginBottom: 6 }}>
                      Mã giao dịch ngân hàng / UNC: {bankRef}
                    </Text>
                  ) : null}
                  {proofUrl ? (
                    <TouchableOpacity onPress={() => setSelectedImage(resolveFileUrl(proofUrl) || proofUrl)}>
                      <Image 
                        source={{ uri: resolveFileUrl(proofUrl) || proofUrl }} 
                        style={styles.evidenceImage} 
                        resizeMode="contain"
                      />
                    </TouchableOpacity>
                  ) : null}
                </View>
              );
            })()}
          </View>
        </View>

        {/* TIẾN ĐỘ PHÊ DUYỆT */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="clock-outline" size={22} color="#102739" />
            <Text style={styles.sectionTitle}>Tiến độ phê duyệt</Text>
          </View>
          <View style={styles.timelineCard}>
            {/* Step 1: Nộp đơn */}
            <View style={styles.timelineRow}>
              <View style={styles.timelineLine} />
              <View style={[styles.timelineDotSolid, styles.timelineDotSolidGreen]}>
                <MaterialCommunityIcons name="check" size={16} color="#FFFFFF" />
              </View>
              <View style={styles.timelineContent}>
                <View style={styles.timelineHeader}>
                  <Text style={styles.timelineTitle}>Gửi yêu cầu</Text>
                </View>
                <Text style={styles.timelineDesc}>Bạn đã tạo và nộp đơn</Text>
                <Text style={styles.timelineDateText}>{dateStr}</Text>
              </View>
            </View>

            {/* Recorded Multi-step Approval History */}
            {approvalSteps.map((step: any, idx: number) => {
              const isLast = idx === approvalSteps.length - 1 && request.status !== 'PENDING';
              const isRejected = step.action === 'REJECTED' || step.action === 'REJECTED_TO_HR';
              const isDisbursed = step.action === 'DISBURSED' || step.action === 'DISBURSED_TO_HR';

              let stepTitle = 'Phê duyệt';
              if (step.action === 'RESUBMITTED_BY_HR') stepTitle = 'HR điều chỉnh & trình lại';
              else if (step.action === 'PURCHASE_FULFILLED') stepTitle = 'HR hoàn tất mua sắm & bàn giao';
              else if (step.action === 'REJECTED_TO_HR') stepTitle = 'Trả về HR điều chỉnh';
              else if (step.action === 'DISBURSED_TO_HR') stepTitle = 'Kế toán/BGĐ giải ngân cho HR';
              else if (step.action === 'FORWARD_ADMIN') stepTitle = 'Kế toán chuyển Ban Giám Đốc';
              else if (step.stage === 'PENDING_LEADER' || step.action === 'LEADER_APPROVED') stepTitle = 'Trưởng bộ phận duyệt';
              else if (step.stage === 'PENDING_HR' || step.action === 'HR_VERIFIED' || step.action === 'HR_APPROVED') stepTitle = 'HR đối chứng & duyệt';
              else if (step.stage === 'PENDING_ADMIN' || step.action === 'ADMIN_APPROVED') stepTitle = 'Ban Giám Đốc duyệt';
              else if (step.stage === 'PENDING_ACCOUNTANT' || step.stage === 'PENDING_DISBURSEMENT' || isDisbursed) stepTitle = 'Kế toán giải ngân';

              return (
                <View key={idx} style={[styles.timelineRow, isLast && { marginBottom: 0 }]}>
                  {!isLast && <View style={styles.timelineLine} />}
                  <View style={[
                    styles.timelineDotSolid,
                    isRejected ? styles.timelineDotSolidRed : styles.timelineDotSolidGreen
                  ]}>
                    <MaterialCommunityIcons 
                      name={isRejected ? "close" : "check"} 
                      size={16} 
                      color="#FFFFFF" 
                    />
                  </View>
                  <View style={styles.timelineContent}>
                    <View style={styles.timelineHeader}>
                      <Text style={[styles.timelineTitle, isRejected && { color: '#EF4444' }]}>
                        {stepTitle}
                      </Text>
                    </View>
                    <Text style={styles.timelineDesc}>
                      {step.actorName ? `${step.actorName} - ` : ''}
                      {step.action === 'REJECTED_TO_HR' ? `Yêu cầu HR điều chỉnh: ${step.reason || 'Xem xét lại báo giá'}` :
                       isRejected ? `Từ chối: ${step.reason || 'Không hợp lệ'}` :
                       step.action === 'PURCHASE_FULFILLED' ? 'HR đã mua hàng và bàn giao xong' :
                       step.action === 'DISBURSED_TO_HR' ? 'Đã chuyển tiền mua hàng vào tài khoản HR' :
                       isDisbursed ? 'Đã thực hiện giải ngân thành công' :
                       step.note ? `Ghi chú: ${step.note}` : 'Đã chấp thuận'}
                    </Text>
                    {step.at && (
                      <Text style={styles.timelineDateText}>{new Date(step.at).toLocaleString('vi-VN')}</Text>
                    )}
                  </View>
                </View>
              );
            })}

            {/* Current Pending Step if PENDING */}
            {request.status === 'PENDING' && (
              <View style={[styles.timelineRow, { marginBottom: 0 }]}>
                <View style={[styles.timelineDot, { borderColor: '#F59E0B', backgroundColor: '#FEF3C7' }]}>
                  <MaterialCommunityIcons name="clock-outline" size={16} color="#F59E0B" />
                </View>
                <View style={styles.timelineContent}>
                  <View style={styles.timelineHeader}>
                    <Text style={[styles.timelineTitle, { color: '#D97706' }]}>
                      {meta.stage === 'PENDING_LEADER' ? 'Chờ Leader duyệt' :
                       meta.stage === 'PENDING_HR' ? 'Chờ HR đối chứng & cấp STK' :
                       meta.stage === 'PENDING_ADMIN' ? 'Chờ Ban Giám Đốc duyệt' :
                       meta.stage === 'PENDING_ACCOUNTANT' || meta.stage === 'PENDING_DISBURSEMENT' ? 'Chờ Kế toán giải ngân' :
                       meta.stage === 'PENDING_HR_PURCHASE' ? 'HR đang tiến hành mua hàng' :
                       meta.stage === 'REJECTED_TO_HR' ? 'HR đang xem xét điều chỉnh' :
                       'Đang chờ xem xét'}
                    </Text>
                  </View>
                  <Text style={styles.timelineDesc}>
                    {meta.stage === 'PENDING_LEADER' ? 'Đang chờ Trưởng bộ phận xem xét và phê duyệt' :
                     meta.stage === 'PENDING_HR' ? 'HR đang đối chứng báo giá và chuẩn bị STK nhận tiền mua sắm' :
                     meta.stage === 'PENDING_ADMIN' ? 'Đơn đang chờ Ban Giám Đốc phê duyệt' :
                     meta.stage === 'PENDING_ACCOUNTANT' || meta.stage === 'PENDING_DISBURSEMENT' ? 'Kế toán đang tiến hành giải ngân chi tiền' :
                     meta.stage === 'PENDING_HR_PURCHASE' ? 'Kinh phí đã được cấp. HR đang tiến hành mua sắm và chuẩn bị bàn giao' :
                     meta.stage === 'REJECTED_TO_HR' ? 'Kế toán/BGĐ yêu cầu điều chỉnh. HR đang cập nhật lại thông tin/báo giá' :
                     'Đơn đang được xử lý theo quy trình'}
                  </Text>
                </View>
              </View>
            )}

            {/* If simple non-financial request completed without approvalSteps array */}
            {approvalSteps.length === 0 && request.status !== 'PENDING' && (
              <View style={[styles.timelineRow, { marginBottom: 0 }]}>
                <View style={[
                  styles.timelineDotSolid,
                  request.status === 'APPROVED' ? styles.timelineDotSolidGreen : styles.timelineDotSolidRed
                ]}>
                  {request.status === 'APPROVED' ? (
                    <MaterialCommunityIcons name="check" size={16} color="#FFFFFF" />
                  ) : (
                    <MaterialCommunityIcons name="close" size={16} color="#FFFFFF" />
                  )}
                </View>
                <View style={styles.timelineContent}>
                  <View style={styles.timelineHeader}>
                    <Text style={[styles.timelineTitle, request.status === 'REJECTED' && { color: '#EF4444' }]}>
                      {request.status === 'APPROVED' ? 'Đã phê duyệt' : 'Đã từ chối'}
                    </Text>
                  </View>
                  <Text style={styles.timelineDesc}>
                    {request.status === 'APPROVED' ? 'Yêu cầu của bạn đã được chấp thuận' : 'Yêu cầu đã bị từ chối'}
                  </Text>
                  {request.decidedAt && (
                    <Text style={styles.timelineDateText}>{new Date(request.decidedAt).toLocaleString('vi-VN')}</Text>
                  )}
                </View>
              </View>
            )}

          </View>
        </View>

        {/* NÚT THAO TÁC CHO HR KHI ĐÃ ĐƯỢC DUYỆT MUA HÀNG */}
        {canHrFulfillPurchase && (
          <View style={[styles.contentCard, { backgroundColor: '#F0F9FF', borderColor: '#0284C7', marginBottom: 24 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <MaterialCommunityIcons name="cart-check" size={24} color="#0284C7" style={{ marginRight: 8 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#0369A1' }}>HR Đã Mua Hàng Xong?</Text>
                <Text style={{ fontSize: 12, color: '#475569' }}>
                  Bấm để tạo đơn thanh toán hoàn tiền cho {(request as any)?.user?.profile?.fullName || 'nhân viên đề xuất'}.
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => setIsHrPurchaseModalOpen(true)}
              style={{
                backgroundColor: '#0284C7',
                paddingVertical: 12,
                borderRadius: 10,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                marginTop: 8,
              }}
            >
              <MaterialCommunityIcons name="credit-card-plus-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>
                Tạo yêu cầu thanh toán (Đã mua hàng)
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>

      {/* HR Purchase Fulfillment Modal */}
      <Modal
        visible={isHrPurchaseModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => !isSubmittingHrExpense && setIsHrPurchaseModalOpen(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 16 }}
        >
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 20, width: '100%', maxWidth: 440, maxHeight: '90%' }}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#E0F2FE', justifyContent: 'center', alignItems: 'center', marginRight: 10 }}>
                    <MaterialCommunityIcons name="cart-check" size={20} color="#0284C7" />
                  </View>
                  <Text style={{ fontSize: 17, fontWeight: '800', color: '#0F172A' }}>Tạo yêu cầu thanh toán</Text>
                </View>
                <TouchableOpacity 
                  onPress={() => setIsHrPurchaseModalOpen(false)}
                  disabled={isSubmittingHrExpense}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <MaterialCommunityIcons name="close" size={22} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              <View style={{ backgroundColor: '#F8FAFC', padding: 12, borderRadius: 10, marginBottom: 14, borderWidth: 1, borderColor: '#E2E8F0' }}>
                <Text style={{ fontSize: 12, color: '#64748B', marginBottom: 2 }}>Đơn mua sắm cho nhân viên:</Text>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#0F172A' }}>
                  {(request as any)?.user?.profile?.fullName || 'Nhân viên'} · {meta.itemName || request.title} (SL: {meta.quantity || '1'})
                </Text>
                <Text style={{ fontSize: 12, color: '#059669', marginTop: 4 }}>
                  (Người yêu cầu: {(request as any)?.user?.profile?.fullName || 'Nhân viên'} · Người tạo thanh toán: HR)
                </Text>
              </View>

              {/* Số tiền thực tế */}
              <View style={{ marginBottom: 12 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#334155', marginBottom: 6 }}>
                  Số tiền mua thực tế (VNĐ) <Text style={{ color: '#DC2626' }}>*</Text>
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, paddingHorizontal: 12, height: 46 }}>
                  <TextInput
                    style={{ flex: 1, fontSize: 15, fontWeight: '700', color: '#0F172A' }}
                    placeholder="Nhập số tiền..."
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                    value={hrAmount ? parseInt(hrAmount, 10).toLocaleString('vi-VN') : ''}
                    onChangeText={(text) => setHrAmount(text.replace(/[^0-9]/g, ''))}
                  />
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#475569' }}>VNĐ</Text>
                </View>
              </View>

              {/* Hóa đơn VAT */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 14 }}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#334155' }}>Hóa đơn VAT</Text>
                  <Text style={{ fontSize: 11, color: '#64748B' }}>
                    {hrHasVat ? 'Đơn có VAT (chuyển Kế toán thanh toán)' : 'Đơn không có VAT'}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setHrHasVat(!hrHasVat)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 16,
                    backgroundColor: hrHasVat ? '#10B981' : '#E2E8F0'
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '700', color: hrHasVat ? '#FFFFFF' : '#475569' }}>
                    {hrHasVat ? 'CÓ VAT' : 'K° VAT'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Upload ảnh hóa đơn mua hàng */}
              <View style={{ marginBottom: 14 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#334155', marginBottom: 6 }}>
                  Ảnh Hóa đơn / Bill mua hàng (Tùy chọn)
                </Text>
                {hrBillProofUri ? (
                  <View style={{ borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#CBD5E1', marginBottom: 8 }}>
                    <Image source={{ uri: hrBillProofUri }} style={{ width: '100%', height: 160 }} resizeMode="cover" />
                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', padding: 8, backgroundColor: '#F8FAFC' }}>
                      <TouchableOpacity onPress={handlePickHrBill} style={{ marginRight: 12 }}>
                        <Text style={{ fontSize: 13, fontWeight: '600', color: '#0284C7' }}>Đổi ảnh</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => setHrBillProofUri(null)}>
                        <Text style={{ fontSize: 13, fontWeight: '600', color: '#DC2626' }}>Xóa</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity 
                      onPress={handlePickHrBill}
                      style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 42, backgroundColor: '#F1F5F9', borderRadius: 8, borderWidth: 1, borderColor: '#CBD5E1' }}
                    >
                      <MaterialCommunityIcons name="image-plus" size={18} color="#475569" style={{ marginRight: 4 }} />
                      <Text style={{ fontSize: 13, fontWeight: '600', color: '#475569' }}>Chọn ảnh</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={handleTakeHrBill}
                      style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 42, backgroundColor: '#F1F5F9', borderRadius: 8, borderWidth: 1, borderColor: '#CBD5E1' }}
                    >
                      <MaterialCommunityIcons name="camera-outline" size={18} color="#475569" style={{ marginRight: 4 }} />
                      <Text style={{ fontSize: 13, fontWeight: '600', color: '#475569' }}>Chụp ảnh</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Ghi chú */}
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#334155', marginBottom: 6 }}>
                  Ghi chú của HR (Tùy chọn)
                </Text>
                <TextInput
                  style={{ backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, padding: 10, height: 70, fontSize: 14, color: '#0F172A', textAlignVertical: 'top' }}
                  placeholder="Ghi chú thêm về việc mua hàng..."
                  placeholderTextColor="#94A3B8"
                  multiline
                  value={hrNote}
                  onChangeText={setHrNote}
                />
              </View>

              {/* Nút hành động */}
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  onPress={() => setIsHrPurchaseModalOpen(false)}
                  disabled={isSubmittingHrExpense}
                  style={{ flex: 1, height: 46, borderRadius: 10, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#475569' }}>Hủy</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleConfirmHrExpense}
                  disabled={isSubmittingHrExpense}
                  style={{ flex: 2, height: 46, borderRadius: 10, backgroundColor: '#0284C7', alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }}
                >
                  {isSubmittingHrExpense ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <MaterialCommunityIcons name="check" size={18} color="#fff" style={{ marginRight: 4 }} />
                      <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>Gửi yêu cầu thanh toán</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal Xin Hủy Ca Làm Bù */}
      <Modal
        visible={isCancelCompModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => !isSubmittingCancel && setIsCancelCompModalOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 16 }}
        >
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 20, width: '100%', maxWidth: 440 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFEDD5', justifyContent: 'center', alignItems: 'center', marginRight: 10 }}>
                  <MaterialCommunityIcons name="calendar-remove" size={20} color="#EA580C" />
                </View>
                <Text style={{ fontSize: 17, fontWeight: '800', color: '#0F172A' }}>Xin hủy ca làm bù</Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setIsCancelCompModalOpen(false);
                  setCancelCompError('');
                }}
                disabled={isSubmittingCancel}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialCommunityIcons name="close" size={22} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <View style={{ backgroundColor: '#F8FAFC', padding: 12, borderRadius: 10, marginBottom: 14, borderWidth: 1, borderColor: '#E2E8F0' }}>
              <Text style={{ fontSize: 13, color: '#64748B', marginBottom: 2 }}>Ca làm bù hiện tại:</Text>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#0F172A' }}>
                {Array.isArray(meta.compensationShifts) && meta.compensationShifts.length > 0
                  ? meta.compensationShifts.map((s: any) => `${formatDateStr(s.date)} (${s.shiftName || 'Ca làm'})`).join(' · ')
                  : `${meta.compensatoryDate ? formatDateStr(meta.compensatoryDate) : ''} · ${meta.compensatoryShiftName || 'Ca làm việc'}`}
              </Text>
              <Text style={{ fontSize: 12, color: '#D97706', marginTop: 4 }}>
                Khi được Leader duyệt hủy, ca làm việc sẽ được gỡ khỏi lịch và bạn có thể tạo lại đơn làm bù cho ngày khác.
              </Text>
            </View>

            {cancelCompError ? (
              <View style={{ backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#FCA5A5', borderRadius: 8, padding: 10, marginBottom: 12 }}>
                <Text style={{ color: '#B91C1C', fontSize: 13, fontWeight: '600' }}>{cancelCompError}</Text>
              </View>
            ) : null}

            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#334155', marginBottom: 6 }}>
                Lý do xin hủy ca làm bù <Text style={{ color: '#DC2626' }}>*</Text>
              </Text>
              <TextInput
                style={{
                  backgroundColor: '#F8FAFC',
                  borderWidth: 1,
                  borderColor: cancelCompError ? '#EF4444' : '#CBD5E1',
                  borderRadius: 10,
                  padding: 12,
                  fontSize: 14,
                  color: '#0F172A',
                  minHeight: 80,
                  textAlignVertical: 'top',
                }}
                placeholder="Ví dụ: Em có việc gia đình đột xuất không thể đi làm bù ca này..."
                placeholderTextColor="#94A3B8"
                multiline
                value={cancelCompReason}
                onChangeText={(text) => {
                  setCancelCompReason(text);
                  if (cancelCompError) setCancelCompError('');
                }}
              />
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                onPress={() => {
                  setIsCancelCompModalOpen(false);
                  setCancelCompError('');
                }}
                disabled={isSubmittingCancel}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: '#CBD5E1',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#64748B' }}>Đóng</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleRequestCancel}
                disabled={isSubmittingCancel}
                style={{
                  flex: 1.5,
                  paddingVertical: 12,
                  borderRadius: 10,
                  backgroundColor: '#EA580C',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: isSubmittingCancel ? 0.6 : 1,
                }}
              >
                {isSubmittingCancel ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>Gửi yêu cầu hủy</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Full-screen Image Viewer with Zoom */}
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
  shareBtn: {
    width: 32,
    height: 32,
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginRight: -4,
  },
  bodyWrapper: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -8,
    overflow: 'hidden',
  },
  scrollContent: {
    padding: 16,
    paddingTop: 16,
  },
  mainInfoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  mainInfoTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeBadgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#E7F0F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeLabelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10B981',
  },
  mainRequestTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#18181B',
    lineHeight: 26,
    marginBottom: 8,
  },
  mainRequestDate: {
    fontSize: 12.5,
    color: '#71717A',
    fontWeight: '500',
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#102739',
    letterSpacing: -0.2,
  },
  contentCard: {
    backgroundColor: '#FFFFFF',
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
  amountWrap: {
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  amountLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#166534',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#102739',
  },
  amountCurrency: {
    fontSize: 14,
    fontWeight: '600',
    color: '#71717A',
  },
  reasonBox: {
    marginBottom: 14,
  },
  reasonLabel: {
    fontSize: 13,
    color: '#71717A',
    fontWeight: '500',
    marginBottom: 6,
  },
  reasonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#18181B',
    fontStyle: 'italic',
    lineHeight: 24,
  },
  metaCard: {
    borderTopWidth: 1,
    borderTopColor: '#F4F4F5',
    paddingTop: 16,
    marginTop: 4,
  },
  metaCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  metaCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#102739',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  metaLabel: {
    fontSize: 13.5,
    color: '#71717A',
    fontWeight: '500',
  },
  metaValueBold: {
    fontSize: 14,
    fontWeight: '700',
    color: '#18181B',
    flexShrink: 1,
    textAlign: 'right',
  },
  timelineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  timelineRow: {
    flexDirection: 'row',
    marginBottom: 20,
    position: 'relative',
  },
  timelineLine: {
    position: 'absolute',
    left: 14,
    top: 28,
    bottom: -22,
    width: 2,
    backgroundColor: '#E4E4E7',
  },
  timelineDotSolid: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    zIndex: 1,
  },
  timelineDotSolidGreen: {
    backgroundColor: '#10B981',
  },
  timelineDotSolidRed: {
    backgroundColor: '#EF4444',
  },
  timelineDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    borderWidth: 2,
    zIndex: 1,
  },
  timelineContent: {
    flex: 1,
    justifyContent: 'center',
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  timelineTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#18181B',
  },
  timelineDesc: {
    fontSize: 13,
    color: '#71717A',
    fontWeight: '500',
  },
  timelineDateText: {
    fontSize: 12,
    color: '#A1A1AA',
    marginTop: 2,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  statusText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  attachmentBox: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F4F4F5',
    paddingTop: 12,
  },
  attachmentLabel: {
    fontSize: 13,
    color: '#71717A',
    fontWeight: '600',
    marginBottom: 8,
  },
  evidenceImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E4E4E7',
  },
});