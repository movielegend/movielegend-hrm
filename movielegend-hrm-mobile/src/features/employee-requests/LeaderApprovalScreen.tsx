import React, { useState, useRef } from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView, TextInput, KeyboardAvoidingView, Platform, Image, Alert, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import ImageView from 'react-native-image-viewing';
import { spacing } from '../../theme/spacing';
import { shadows } from '../../theme/shadows';
import { useEmployeeRequestById, useApproveEmployeeRequest, useRejectEmployeeRequest } from '../../hooks/useEmployeeRequests';
import { ActivityIndicator } from 'react-native';

// Mock types
type RequestType = 'LEAVE' | 'ATTENDANCE_ADJUSTMENT' | 'LATE_ARRIVAL' | 'EARLY_LEAVE' | 'OVERTIME' | 'ADVANCE' | 'EXPENSE' | 'PURCHASE';

export function LeaderApprovalScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const { data: request, isLoading, isError } = useEmployeeRequestById(id);
  const approveMutation = useApproveEmployeeRequest();
  const rejectMutation = useRejectEmployeeRequest();

  const [comment, setComment] = useState('');

  // Helper to map type to colors & labels
  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'LEAVE': return { label: 'Nghỉ phép', color: '#10B981', icon: 'beach' };
      case 'ATTENDANCE_ADJUSTMENT': return { label: 'Giải trình công', color: '#3B82F6', icon: 'file-clock-outline' };
      case 'LATE_ARRIVAL': return { label: 'Đi muộn', color: '#F59E0B', icon: 'clock-in' };
      case 'EARLY_LEAVE': return { label: 'Về sớm', color: '#EF4444', icon: 'clock-out' };
      case 'OVERTIME': return { label: 'Làm thêm giờ', color: '#8B5CF6', icon: 'briefcase-clock' };
      case 'ADVANCE': return { label: 'Tạm ứng', color: '#14B8A6', icon: 'cash' };
      case 'EXPENSE': return { label: 'Thanh toán', color: '#F97316', icon: 'receipt' };
      case 'PURCHASE': return { label: 'Mua sắm', color: '#0EA5E9', icon: 'cart-outline' };
      default: return { label: 'Khác', color: '#6B7280', icon: 'file-document' };
    }
  };

  const handleApprove = () => {
    approveMutation.mutate(id, {
      onSuccess: () => {
        Alert.alert('Thành công', 'Đã phê duyệt đơn từ!', [{ text: 'OK', onPress: () => router.back() }]);
      },
      onError: (err: any) => {
        Alert.alert('Lỗi', err.response?.data?.message || 'Có lỗi xảy ra');
      }
    });
  };

  const handleReject = () => {
    // We could pass comment here if API supported it, currently it doesn't
    rejectMutation.mutate(id, {
      onSuccess: () => {
        Alert.alert('Đã từ chối', 'Đơn từ đã bị từ chối.', [{ text: 'OK', onPress: () => router.back() }]);
      },
      onError: (err: any) => {
        Alert.alert('Lỗi', err.response?.data?.message || 'Có lỗi xảy ra');
      }
    });
  };

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
  const avatarUrl = request.user?.profile?.avatarUrl || 'https://i.pravatar.cc/150?img=11';
  const dateStr = request.createdAt ? new Date(request.createdAt).toLocaleString('vi-VN') : '';


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
          <View>
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
            
            {request.attachmentMetadata?.image && (
              <View style={{ marginTop: 16 }}>
                <Text style={{ fontSize: 13, color: '#6B7280', marginBottom: 8, fontWeight: '500' }}>Ảnh minh chứng đính kèm:</Text>
                <TouchableOpacity onPress={() => setSelectedImage(request.attachmentMetadata.image)}>
                  <Image 
                    source={{ uri: request.attachmentMetadata.image }} 
                    style={{ width: '100%', height: 250, borderRadius: 12, borderWidth: 1, borderColor: '#F3F4F6' }} 
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* 3. Action Area */}
      {request.status === 'PENDING' ? (
      <View style={[styles.footerAction, shadows.sm]}>
        <TextInput
          style={styles.commentInput}
          placeholder="Nhập ghi chú / lý do từ chối (nếu có)..."
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
            style={[styles.rejectBtn, (rejectMutation.isPending || approveMutation.isPending) && { opacity: 0.5 }]} 
            onPress={handleReject}
            disabled={rejectMutation.isPending || approveMutation.isPending}
          >
            {rejectMutation.isPending ? <ActivityIndicator color="#EF4444" /> : (
              <>
                <MaterialCommunityIcons name="close-circle-outline" size={20} color="#EF4444" style={{ marginRight: 6 }} />
                <Text style={styles.rejectBtnText}>Từ chối</Text>
              </>
            )}
          </Pressable>
          <Pressable 
            style={[styles.approveBtn, (approveMutation.isPending || rejectMutation.isPending) && { opacity: 0.5 }]} 
            onPress={handleApprove}
            disabled={approveMutation.isPending || rejectMutation.isPending}
          >
            {approveMutation.isPending ? <ActivityIndicator color="#fff" /> : (
              <>
                <MaterialCommunityIcons name="check-circle-outline" size={20} color="#fff" style={{ marginRight: 6 }} />
                <Text style={styles.approveBtnText}>Phê duyệt</Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
      ) : (
        <View style={[styles.footerAction, shadows.sm, { paddingVertical: 24, alignItems: 'center' }]}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: request.status === 'APPROVED' ? '#10B981' : '#EF4444' }}>
            Đơn từ đã được {request.status === 'APPROVED' ? 'Phê duyệt' : 'Từ chối'}
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
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    paddingVertical: 14,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectBtnText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '700',
  },
  approveBtn: {
    flex: 2,
    flexDirection: 'row',
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  approveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
