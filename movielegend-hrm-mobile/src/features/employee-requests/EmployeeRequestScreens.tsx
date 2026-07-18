import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View, Pressable, Image, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMyEmployeeRequests, useEmployeeRequestById } from '../../hooks/useEmployeeRequests';
import { shadows } from '../../theme/shadows';
import { spacing } from '../../theme/spacing';

export function EmployeeRequestsHomeScreen() {
  const router = useRouter();

  const { data, isLoading } = useMyEmployeeRequests({ page: 1, limit: 50 });
  const requests = data?.items || [];

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'PENDING': return { text: 'Đang chờ', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)' };
      case 'APPROVED': return { text: 'Đã duyệt', color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)' };
      case 'REJECTED': return { text: 'Từ chối', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)' };
      default: return { text: 'Không rõ', color: '#6B7280', bg: 'rgba(107, 114, 128, 0.1)' };
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F7FAFC' }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
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
            const statusObj = getStatusDisplay(req.status);
            return (
              <Pressable key={req.id} onPress={() => router.push('/employee/requests/' + req.id)} style={{ backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#E6EEF3' }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: '#0B3B61' }}>{req.title || req.type}</Text>
                  <View style={{ backgroundColor: statusObj.bg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>
                    <Text style={{ fontSize: 12, color: statusObj.color, fontWeight: '600' }}>{statusObj.text}</Text>
                  </View>
                </View>
                <Text style={{ fontSize: 14, color: '#98A0A8', marginBottom: 4 }}>
                  {new Date(req.createdAt).toLocaleDateString('vi-VN')}
                </Text>
                <Text style={{ fontSize: 14, color: '#3B4A59' }} numberOfLines={1}>{req.content}</Text>
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
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: request, isLoading, isError } = useEmployeeRequestById(id);

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
        <Text style={{ fontSize: 16, color: '#374151' }}>Không tìm thấy yêu cầu</Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: '#3B82F6', fontWeight: '600' }}>Quay lại</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  // Type mappings
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

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'PENDING': return { text: 'Đang chờ', color: '#F59E0B', bg: '#FEF3C7' };
      case 'APPROVED': return { text: 'Đã duyệt', color: '#10B981', bg: '#D1FAE5' };
      case 'REJECTED': return { text: 'Từ chối', color: '#EF4444', bg: '#FEE2E2' };
      default: return { text: 'Không rõ', color: '#6B7280', bg: '#F3F4F6' };
    }
  };

  const statusObj = getStatusDisplay(request.status);
  const typeConfig = getTypeConfig(request.type);
  const dateStr = request.createdAt ? new Date(request.createdAt).toLocaleString('vi-VN') : '';

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: '#FAFAFA' }} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#fff' }}>
        <View style={[styles.header, shadows.sm]}>
          <Pressable onPress={() => router.back()} style={styles.iconBtn}>
            <MaterialCommunityIcons name="chevron-left" size={32} color="#111827" />
          </Pressable>
          <View style={styles.headerRight}>
            <Text style={styles.headerTitle}>Chi Tiết Yêu Cầu</Text>
            <Pressable style={styles.shareBtn}>
              <MaterialCommunityIcons name="share-variant-outline" size={24} color="#6B7280" />
            </Pressable>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Main Info Card */}
        <View style={[styles.infoCard, shadows.sm]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{request.title}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusObj.bg }]}>
              <Text style={[styles.statusText, { color: statusObj.color }]}>{statusObj.text}</Text>
            </View>
          </View>
          
          <View style={styles.typeRow}>
            <MaterialCommunityIcons name={typeConfig.icon as any} size={16} color={typeConfig.color} />
            <Text style={[styles.typeLabel, { color: typeConfig.color }]}>{typeConfig.label}</Text>
          </View>
          <Text style={styles.dateLabel}>Gửi lúc: {dateStr}</Text>
        </View>

        {/* NỘI DUNG YÊU CẦU */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="file-document-outline" size={20} color="#3B82F6" />
            <Text style={styles.sectionTitle}>NỘI DUNG YÊU CẦU</Text>
          </View>
          <View style={[styles.card, shadows.sm]}>
            
            {request.amount != null && (
              <View style={styles.amountWrap}>
                <Text style={styles.amountLabel}>SỐ TIỀN</Text>
                <Text style={styles.amountValue}>{Number(request.amount).toLocaleString('vi-VN')} <Text style={styles.amountCurrency}>VNĐ</Text></Text>
              </View>
            )}

            <View style={styles.reasonBox}>
              <Text style={styles.reasonLabel}>Nội dung chi tiết:</Text>
              <Text style={styles.reasonText}>"{request.content}"</Text>
            </View>

            {request.attachmentMetadata?.image && (
              <View style={styles.attachmentBox}>
                <Text style={styles.attachmentLabel}>Ảnh minh chứng đính kèm:</Text>
                <Image 
                  source={{ uri: request.attachmentMetadata.image }} 
                  style={styles.evidenceImage} 
                  resizeMode="cover"
                />
              </View>
            )}
          </View>
        </View>

        {/* TIẾN ĐỘ PHÊ DUYỆT */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="clock-outline" size={20} color="#3B82F6" />
            <Text style={styles.sectionTitle}>TIẾN ĐỘ PHÊ DUYỆT</Text>
          </View>
          <View style={[styles.card, shadows.sm, { padding: 20 }]}>

            {/* Step 1: Nộp đơn */}
            <View style={styles.timelineRow}>
              <View style={styles.timelineLine} />
              <View style={[styles.timelineDot, { borderColor: '#10B981' }]}>
                <MaterialCommunityIcons name="check" size={16} color="#10B981" />
              </View>
              <View style={styles.timelineContent}>
                <View style={styles.timelineHeader}>
                  <Text style={styles.timelineTitle}>Gửi yêu cầu</Text>
                  <Text style={styles.timelineTime}>{dateStr}</Text>
                </View>
                <Text style={styles.timelineDesc}>Bạn đã tạo đơn</Text>
              </View>
            </View>

            {/* Step 2: Kết quả */}
            <View style={[styles.timelineRow, { marginBottom: 0 }]}>
              <View style={[
                styles.timelineDot, 
                request.status === 'PENDING' ? { borderColor: '#111827' } : { backgroundColor: statusObj.bg, borderWidth: 0 }
              ]}>
                {request.status === 'PENDING' ? (
                  <MaterialCommunityIcons name="clock-outline" size={16} color="#111827" />
                ) : request.status === 'APPROVED' ? (
                  <MaterialCommunityIcons name="check" size={16} color={statusObj.color} />
                ) : (
                  <MaterialCommunityIcons name="close" size={16} color={statusObj.color} />
                )}
              </View>
              <View style={styles.timelineContent}>
                <View style={styles.timelineHeader}>
                  <Text style={[styles.timelineTitle, { color: request.status === 'PENDING' ? '#111827' : statusObj.color }]}>
                    {request.status === 'PENDING' ? 'Chờ duyệt' : request.status === 'APPROVED' ? 'Đã phê duyệt' : 'Đã từ chối'}
                  </Text>
                  {request.decidedAt && (
                    <Text style={styles.timelineTime}>{new Date(request.decidedAt).toLocaleString('vi-VN')}</Text>
                  )}
                </View>
                <Text style={styles.timelineDesc}>
                  {request.status === 'PENDING' 
                    ? 'Đang chờ Leader xem xét' 
                    : request.status === 'APPROVED' ? 'Yêu cầu của bạn đã được chấp thuận' : 'Yêu cầu đã bị từ chối'}
                </Text>
              </View>
            </View>

          </View>
        </View>
      </ScrollView>
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
  },
  iconBtn: {
    padding: 4,
    marginRight: 8,
  },
  headerRight: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  shareBtn: {
    padding: 4,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  dateLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.5,
    marginLeft: 8,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
  },
  amountCurrency: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  reasonBox: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  reasonLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4B5563',
    marginBottom: 6,
  },
  reasonText: {
    fontSize: 14,
    color: '#111827',
    fontStyle: 'italic',
    lineHeight: 22,
  },
  attachmentBox: {
    marginTop: 8,
  },
  attachmentLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 8,
  },
  evidenceImage: {
    width: '100%',
    height: 220,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  timelineRow: {
    flexDirection: 'row',
    marginBottom: 24,
    position: 'relative',
  },
  timelineLine: {
    position: 'absolute',
    left: 11,
    top: 24,
    bottom: -24,
    width: 2,
    backgroundColor: '#E5E7EB',
  },
  timelineDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    zIndex: 1,
  },
  timelineContent: {
    flex: 1,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  timelineTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  timelineTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  timelineDesc: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
});