import React, { useState, useRef, useCallback } from 'react';
import { useAppAlert } from '../../contexts/AlertContext';
import { StyleSheet, Text, View, Pressable, ScrollView, TextInput, KeyboardAvoidingView, Platform, Image, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
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
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
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

  const config = getTypeConfig(request.type);
  const userName = request.user?.profile?.fullName || request.user?.email || 'Unknown';
  const userDept = request.department?.name || 'Không rõ phòng ban';
  const userPos = request.user?.profile?.position?.name || 'Nhân viên';
  const dateStr = request.createdAt ? new Date(request.createdAt).toLocaleString('vi-VN') : '';
  const isFinancial = request.type === 'ADVANCE' || request.type === 'EXPENSE' || request.type === 'PURCHASE';
  const amount = Number(request.amount || 0);

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
      approveSubtext = 'Trưởng BP đồng ý, chuyển HR đối chứng';
    }
  }

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: '#F0F4F8' }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 25}
    >
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#fff' }}>
        <View style={[styles.header, shadows.sm]}>
          <Pressable onPress={() => router.back()} style={styles.iconBtn}>
            <MaterialCommunityIcons name="chevron-left" size={32} color="#111827" />
          </Pressable>
          <View style={{ paddingVertical: 4 }}>
            <Text style={styles.headerTitle}>Phê duyệt Đơn từ</Text>
            <Text style={styles.headerSubtitle}>Xem xét và quyết định</Text>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView 
        ref={scrollViewRef}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />}
      >
        {/* 1. Header Card: Thông tin người nộp */}
        <View style={[styles.userCard, shadows.sm]}>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{userName}</Text>
            <Text style={styles.userRole}>{userPos}</Text>
            <Text style={styles.userDept}>{userDept}</Text>
          </View>
        </View>

        {/* 2. Thân Đơn: Chi tiết nội dung */}
        <View style={styles.detailCard}>
          <View style={styles.detailHeader}>
            <View style={[styles.typeBadge, { backgroundColor: `${config.color}15` }]}>
              <MaterialCommunityIcons name={config.icon as any} size={16} color={config.color} />
              <Text style={[styles.typeBadgeText, { color: config.color }]}>{config.label}</Text>
            </View>
            <Text style={styles.submitTime}>{dateStr}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.dynamicContent}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Tiêu đề:</Text>
              <Text style={styles.detailValueBold}>{request.title}</Text>
            </View>
            
            {request.amount != null && (
              <View style={styles.amountWrap}>
                <Text style={styles.amountLabel}>SỐ TIỀN</Text>
                <Text style={styles.amountValue}>{Number(request.amount).toLocaleString('vi-VN')} <Text style={styles.amountCurrency}>VNĐ</Text></Text>
              </View>
            )}

            <View style={styles.reasonBox}>
              <Text style={styles.reasonLabel}>Nội dung chi tiết:</Text>
              <Text style={styles.reasonText}>{request.content}</Text>
            </View>

            {/* Thông tin tài khoản ngân hàng */}
            {meta.bankInfo && (
              <View style={{ backgroundColor: '#F0F9FF', padding: 12, borderRadius: 10, marginBottom: 16, borderWidth: 1, borderColor: '#BAE6FD' }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#0369A1', marginBottom: 6 }}>
                  THÔNG TIN TÀI KHOẢN NHẬN TIỀN CỦA NHÂN VIÊN
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
            
            {meta.image && (
              <View style={{ marginTop: 12 }}>
                <Text style={{ fontSize: 13, color: '#6B7280', marginBottom: 8, fontWeight: '600' }}>Ảnh chứng từ / hóa đơn kèm theo:</Text>
                <TouchableOpacity onPress={() => setSelectedImage(meta.image)}>
                  <Image 
                    source={{ uri: meta.image }} 
                    style={{ width: '100%', height: 220, borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB' }} 
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              </View>
            )}

            {meta.disbursementProofUrl && (
              <View style={{ marginTop: 12, backgroundColor: '#F0FDF4', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#BBF7D0' }}>
                <Text style={{ fontSize: 13, color: '#15803D', marginBottom: 8, fontWeight: '700' }}>Biên lai giải ngân đã đính kèm:</Text>
                <TouchableOpacity onPress={() => setSelectedImage(meta.disbursementProofUrl)}>
                  <Image 
                    source={{ uri: meta.disbursementProofUrl }} 
                    style={{ width: '100%', height: 220, borderRadius: 10, borderWidth: 1, borderColor: '#BBF7D0' }} 
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* 3. Tiến độ phê duyệt qua các cấp */}
        {approvalSteps.length > 0 && (
          <View style={[styles.detailCard, { marginTop: 16 }]}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#4B5563', marginBottom: 12 }}>
              LỊCH SỬ DUYỆT CỦA CÁC BỘ PHẬN
            </Text>
            {approvalSteps.map((step: any, idx: number) => {
              const isRejected = step.action === 'REJECTED';
              const isDisbursed = step.action === 'DISBURSED';
              return (
                <View key={idx} style={{ flexDirection: 'row', marginBottom: 12, alignItems: 'flex-start' }}>
                  <MaterialCommunityIcons 
                    name={isRejected ? "close-circle" : "check-circle"} 
                    size={20} 
                    color={isRejected ? "#EF4444" : "#10B981"} 
                    style={{ marginRight: 8, marginTop: 2 }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827' }}>
                      {step.actorName || 'Cấp duyệt'} ({step.stage})
                    </Text>
                    <Text style={{ fontSize: 12, color: '#6B7280' }}>
                      {step.at ? new Date(step.at).toLocaleString('vi-VN') : ''}
                    </Text>
                    {step.note ? <Text style={{ fontSize: 13, color: '#374151', marginTop: 2 }}>Ghi chú: {step.note}</Text> : null}
                    {step.reason ? <Text style={{ fontSize: 13, color: '#EF4444', marginTop: 2 }}>Lý do từ chối: {step.reason}</Text> : null}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* 4. Action Area */}
      {request.status === 'PENDING' ? (
        canActOnCurrentStage ? (
          <View style={[styles.footerAction, shadows.sm]}>
            {/* Cho phép kế toán tải lên ủy nhiệm chi khi giải ngân */}
            {stage === 'PENDING_DISBURSEMENT' && (
              <View style={{ marginBottom: 12 }}>
                <Pressable 
                  onPress={handlePickDisbursementProof}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#EFF6FF',
                    borderWidth: 1,
                    borderColor: '#93C5FD',
                    borderRadius: 8,
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                  }}
                >
                  <MaterialCommunityIcons name="file-upload-outline" size={20} color="#2563EB" />
                  <Text style={{ marginLeft: 6, color: '#2563EB', fontWeight: '600', fontSize: 13 }}>
                    {disbursementProofUri ? 'Đã chọn ảnh ủy nhiệm chi (Bấm để đổi)' : 'Tải lên ảnh Ủy nhiệm chi / Biên lai giải ngân'}
                  </Text>
                </Pressable>
                {disbursementProofUri && (
                  <View style={{ marginTop: 8, alignItems: 'center' }}>
                    <Image source={{ uri: disbursementProofUri }} style={{ width: 120, height: 80, borderRadius: 6 }} />
                  </View>
                )}
              </View>
            )}

            <TextInput
              style={styles.commentInput}
              placeholder="Nhập ghi chú / ý kiến / lý do (nếu có)..."
              placeholderTextColor="#9CA3AF"
              multiline
              value={comment}
              onChangeText={setComment}
              textAlignVertical="top"
              onFocus={() => {
                setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
              }}
            />
            <View style={styles.actionRow}>
              <Pressable 
                style={[styles.rejectBtn, (rejectMutation.isPending || approveMutation.isPending || isUploadingProof) && { opacity: 0.5 }]} 
                onPress={handleReject}
                disabled={rejectMutation.isPending || approveMutation.isPending || isUploadingProof}
              >
                {rejectMutation.isPending ? <ActivityIndicator color="#111827" /> : (
                  <Text style={styles.rejectBtnText}>Từ chối</Text>
                )}
              </Pressable>
              <Pressable 
                style={[styles.approveBtn, (approveMutation.isPending || rejectMutation.isPending || isUploadingProof) && { opacity: 0.5 }]} 
                onPress={handleApprove}
                disabled={approveMutation.isPending || rejectMutation.isPending || isUploadingProof}
              >
                {approveMutation.isPending || isUploadingProof ? <ActivityIndicator color="#fff" /> : (
                  <View style={{ alignItems: 'center' }}>
                    <Text style={styles.approveBtnText}>{approveButtonLabel}</Text>
                    {approveSubtext ? (
                      <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.85)', marginTop: 2 }}>
                        {approveSubtext}
                      </Text>
                    ) : null}
                  </View>
                )}
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={[styles.footerAction, shadows.sm, { paddingVertical: 18, paddingHorizontal: 20, alignItems: 'center', backgroundColor: '#F0F9FF', borderTopWidth: 1, borderTopColor: '#BAE6FD' }]}>
            <MaterialCommunityIcons name="clock-time-four-outline" size={24} color="#0284C7" style={{ marginBottom: 6 }} />
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#0369A1', textAlign: 'center', marginBottom: 4 }}>
              {waitingStageDescription || 'Đang chờ cấp có thẩm quyền xử lý'}
            </Text>
            <Text style={{ fontSize: 12, color: '#64748B', textAlign: 'center' }}>
              Bạn không cần thực hiện thao tác ở giai đoạn này.
            </Text>
          </View>
        )
      ) : (
        <View style={[styles.footerAction, shadows.sm, { paddingVertical: 24, alignItems: 'center' }]}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: request.status === 'APPROVED' ? '#10B981' : '#EF4444' }}>
            Đơn từ đã được {request.status === 'APPROVED' ? (meta.disbursementProofUrl || stage === 'DISBURSED' ? 'Giải ngân thành công' : 'Phê duyệt') : 'Từ chối'}
          </Text>
        </View>
      )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: '#fff',
    zIndex: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  iconBtn: {
    padding: 4,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  devTools: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  content: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: spacing.lg,
    padding: spacing.md,
    borderRadius: 16,
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  userInfo: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  userRole: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
    marginTop: 2,
  },
  userDept: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  detailCard: {
    backgroundColor: '#fff',
    marginHorizontal: spacing.lg,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  typeBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 6,
  },
  submitTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 12,
  },
  dynamicContent: {
    paddingTop: 4,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#111827',
    flex: 2,
    textAlign: 'right',
  },
  detailValueBold: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    flex: 2,
    textAlign: 'right',
  },
  reasonBox: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  reasonLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4B5563',
    marginBottom: 4,
  },
  reasonText: {
    fontSize: 14,
    color: '#111827',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  attachmentBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  attachmentText: {
    flex: 1,
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
    marginLeft: 8,
  },
  amountWrap: {
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  amountLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F97316',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
  },
  amountCurrency: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  imageEvidence: {
    height: 120,
    width: 120,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  evidenceImg: {
    width: '100%',
    height: '100%',
  },
  evidenceOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerAction: {
    backgroundColor: '#fff',
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  commentInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 14,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectBtnText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '700',
  },
  approveBtn: {
    flex: 2,
    flexDirection: 'row',
    backgroundColor: '#111827',
    paddingVertical: 14,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  approveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
