import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View, Image, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EmptyState } from '../../components/EmptyState';
import { FormField } from '../../components/FormField';
import { PageHeader } from '../../components/PageHeader';
import { PrimaryButton, SecondaryButton } from '../../components/Buttons';
import { Screen } from '../../components/Screen';
import { SectionCard } from '../../components/SectionCard';
import { StatusBadge, toneForStatus } from '../../components/StatusBadge';
import { useDashboard } from '../../hooks/useDashboard';
import { useApproveLeaveRequest, useCreateLeaveRequest, useLeaveRequests, useLeaveTypes, useRejectLeaveRequest } from '../../hooks/useLeave';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import type { LeaveBalance, LeaveRequest } from '../../types/leave.types';
import { businessDateToday, formatDate } from '../../utils/date-time';
import { normalizeApiError } from '../../utils/api-error';

export function LeaveHomeScreen() {
  const router = useRouter();
  const dashboard = useDashboard('EMPLOYEE');
  const requests = useLeaveRequests();
  const balances = ((dashboard.data?.leave as { leaveBalances?: LeaveBalance[] } | undefined)?.leaveBalances ?? []);
  
  return (
    <View style={{ flex: 1, backgroundColor: '#F7FAFC' }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <PageHeader title="Nghỉ phép" subtitle="Quản lý ngày phép và lịch sử xin nghỉ của bạn" />
        
        <View style={{ marginBottom: 24 }}>
          <Pressable 
            onPress={() => router.push('/employee/leave/create')}
            style={{ backgroundColor: '#1E88E5', padding: 16, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
          >
            <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
            <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>Tạo đơn nghỉ phép</Text>
          </Pressable>
        </View>

        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 16, fontWeight: '800', color: '#0B3B61', marginBottom: 12 }}>Số dư phép</Text>
          {balances.length > 0 ? (
            <View style={{ gap: 12 }}>
              {balances.map((balance) => (
                <View key={balance.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E6EEF3' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={{ backgroundColor: '#EAF4FE', padding: 8, borderRadius: 8 }}>
                      <Ionicons name="calendar" size={16} color="#1E88E5" />
                    </View>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: '#0B3B61' }}>{balance.leaveType?.name ?? balance.leaveTypeId}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 18, fontWeight: '800', color: '#10B981' }}>{Number(balance.balanceDays) - Number(balance.usedDays)}</Text>
                    <Text style={{ fontSize: 11, color: '#98A0A8' }}>Ngày còn lại</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <EmptyState title="Chưa có dữ liệu" message="Không có thông tin về số dư phép của bạn." />
          )}
        </View>

        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: '800', color: '#0B3B61', marginBottom: 12 }}>Lịch sử đơn nghỉ</Text>
          {requests.isLoading ? <ActivityIndicator style={{ marginVertical: 20 }} /> : (
            <View style={{ gap: 12 }}>
              {(requests.data ?? []).map((request) => (
                <View key={request.id} style={{ backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E6EEF3' }}>
                  <LeaveRequestCard request={request} />
                </View>
              ))}
              {!requests.data?.length ? <EmptyState title="Trống" message="Bạn chưa tạo đơn nghỉ phép nào" /> : null}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

export function CreateLeaveRequestScreen() {
  const mutation = useCreateLeaveRequest();
  const leaveTypes = useLeaveTypes();
  const [leaveTypeId, setLeaveTypeId] = useState('');
  const [startDate, setStartDate] = useState(businessDateToday());
  const [endDate, setEndDate] = useState(businessDateToday());
  const [reason, setReason] = useState('');

  async function submit() {
    try {
      await mutation.mutateAsync({ leaveTypeId, startDate, endDate, reason });
      Alert.alert('Thành công', 'Đã gửi đơn xin nghỉ phép');
    } catch (error) {
      const normalized = normalizeApiError(error);
      Alert.alert(normalized.code, normalized.message);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F7FAFC' }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <PageHeader title="Tạo đơn nghỉ phép" subtitle="Vui lòng điền đầy đủ thông tin để xin nghỉ" />
        
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 16, fontWeight: '800', color: '#0B3B61', marginBottom: 12 }}>Loại nghỉ phép</Text>
          {leaveTypes.isLoading ? <ActivityIndicator /> : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {(leaveTypes.data ?? []).map((leaveType) => {
                const isSelected = leaveTypeId === leaveType.id;
                return (
                  <Pressable 
                    key={leaveType.id} 
                    onPress={() => setLeaveTypeId(leaveType.id)}
                    style={{ 
                      backgroundColor: isSelected ? '#1E88E5' : '#FFFFFF', 
                      paddingHorizontal: 16, 
                      paddingVertical: 12, 
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: isSelected ? '#1E88E5' : '#E6EEF3'
                    }}
                  >
                    <Text style={{ 
                      color: isSelected ? '#FFFFFF' : '#4B5563', 
                      fontSize: 14, 
                      fontWeight: isSelected ? '700' : '500' 
                    }}>
                      {leaveType.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
          {!leaveTypes.isLoading && !leaveTypes.data?.length ? <EmptyState title="Trống" message="Chưa có loại nghỉ phép nào" /> : null}
        </View>

        <View style={{ backgroundColor: '#FFFFFF', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#E6EEF3', gap: 16 }}>
          <FormField label="Ngày bắt đầu (YYYY-MM-DD)" value={startDate} onChangeText={setStartDate} />
          <FormField label="Ngày kết thúc (YYYY-MM-DD)" value={endDate} onChangeText={setEndDate} />
          <FormField label="Lý do nghỉ" value={reason} onChangeText={setReason} multiline />
          
          <Pressable 
            disabled={!leaveTypeId || reason.length < 3 || mutation.isPending} 
            onPress={() => void submit()}
            style={{ 
              backgroundColor: (!leaveTypeId || reason.length < 3) ? '#C4C8CC' : '#1E88E5', 
              paddingVertical: 16, 
              borderRadius: 12, 
              alignItems: 'center', 
              marginTop: 8,
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 8
            }}
          >
            {mutation.isPending ? <ActivityIndicator color="#FFFFFF" /> : <Ionicons name="paper-plane-outline" size={20} color="#FFFFFF" />}
            <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>Gửi đơn nghỉ phép</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

export function LeaveDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const requests = useLeaveRequests();
  const request = requests.data?.find((item) => item.id === id);
  return (
    <View style={{ flex: 1, backgroundColor: '#F7FAFC' }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <PageHeader title="Chi tiết đơn nghỉ" subtitle={`Mã đơn: ${id}`} />
        {request ? (
          <View style={{ backgroundColor: '#FFFFFF', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#E6EEF3' }}>
            <LeaveRequestCard request={request} />
          </View>
        ) : (
          <EmptyState title="Không tìm thấy đơn" message="Đơn nghỉ phép này không tồn tại hoặc đã bị xóa." />
        )}
      </ScrollView>
    </View>
  );
}

export function AdminLeaveApprovalScreen() {
  const router = useRouter();
  const { data } = useLeaveRequests({ status: 'PENDING' });
  const pending = data ?? [];
  const approve = useApproveLeaveRequest();
  const reject = useRejectLeaveRequest();

  async function approveRequest(id: string) {
    Alert.alert('Xác nhận', 'Bạn có chắc chắn muốn duyệt đơn nghỉ phép này?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Duyệt', style: 'default', onPress: async () => {
          try {
            await approve.mutateAsync(id);
            Alert.alert('Thành công', 'Đã duyệt đơn nghỉ phép');
          } catch (error) {
            const normalized = normalizeApiError(error);
            Alert.alert(normalized.code, normalized.message);
          }
      }}
    ]);
  }

  async function rejectRequest(id: string) {
    Alert.alert('Xác nhận', 'Bạn có chắc chắn muốn từ chối đơn nghỉ phép này?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Từ chối', style: 'destructive', onPress: async () => {
          try {
            await reject.mutateAsync({ id, payload: { reason: 'Từ chối từ ứng dụng quản lý' } });
            Alert.alert('Thành công', 'Đã từ chối đơn nghỉ phép');
          } catch (error) {
            const normalized = normalizeApiError(error);
            Alert.alert(normalized.code, normalized.message);
          }
      }}
    ]);
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F7FAFC' }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingTop: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Pressable onPress={() => router.back()} style={{ padding: 4 }}>
              <Ionicons name="chevron-back" size={24} color="#0B3B61" />
            </Pressable>
            <Text style={{ fontSize: 20, fontWeight: '800', color: '#0B3B61' }}>Duyệt nghỉ phép</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Text style={{ fontSize: 14, fontWeight: '800', color: '#0B3B61' }}>Danh sách chờ duyệt ({pending.length})</Text>
        </View>

        {pending.length === 0 ? (
          <EmptyState title="Không có đơn nào chờ duyệt" message="Tất cả các đơn nghỉ phép đã được xử lý" />
        ) : (
          <View style={{ gap: 16 }}>
            {pending.map((request) => (
              <View key={request.id} style={{ backgroundColor: '#FFFFFF', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#E6EEF3' }}>
                <LeaveRequestCard request={request} />
                
                <View style={{ flexDirection: 'row', gap: 12, marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#F0F4F8' }}>
                  <Pressable 
                    onPress={() => rejectRequest(request.id)}
                    style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#FEF2F2', alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
                    disabled={reject.isPending}
                  >
                    {reject.isPending ? <ActivityIndicator size="small" color="#EF4444" /> : <Ionicons name="close-circle-outline" size={18} color="#EF4444" />}
                    <Text style={{ color: '#EF4444', fontSize: 14, fontWeight: '700' }}>Từ chối</Text>
                  </Pressable>
                  
                  <Pressable 
                    onPress={() => approveRequest(request.id)}
                    style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#1E88E5', alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
                    disabled={approve.isPending}
                  >
                    {approve.isPending ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />}
                    <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '700' }}>Phê duyệt</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function LeaveRequestCard({ request }: { request: LeaveRequest }) {
  const user = (request as any).user;
  const name = user?.profile?.fullName || user?.userCode || 'Nhân viên';
  const avatar = user?.profile?.avatarUrl || 'https://via.placeholder.com/150';

  return (
    <View style={{ gap: 12 }}>
      {user && (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
          <Image source={{ uri: avatar }} style={{ width: 40, height: 40, borderRadius: 20 }} />
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#0B3B61' }}>{name}</Text>
            <Text style={{ fontSize: 12, color: '#98A0A8', marginTop: 2 }}>{user?.userCode}</Text>
          </View>
          <StatusBadge label={request.status} tone={toneForStatus(request.status)} />
        </View>
      )}
      
      {!user && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 16, fontWeight: '800', color: '#0B3B61' }}>{request.leaveType?.name ?? request.leaveTypeId}</Text>
          <StatusBadge label={request.status} tone={toneForStatus(request.status)} />
        </View>
      )}

      <View style={{ backgroundColor: '#F7FAFC', padding: 12, borderRadius: 12, gap: 8 }}>
        {user && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="document-text-outline" size={16} color="#1E88E5" />
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#0B3B61' }}>{request.leaveType?.name ?? request.leaveTypeId}</Text>
          </View>
        )}
        
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons name="calendar-outline" size={16} color="#6B7280" />
          <Text style={{ fontSize: 13, color: '#4B5563', fontWeight: '500' }}>
            {formatDate(request.startDate)}  →  {formatDate(request.endDate)}
          </Text>
        </View>
        
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons name="time-outline" size={16} color="#6B7280" />
          <Text style={{ fontSize: 13, color: '#4B5563' }}>Số ngày nghỉ: <Text style={{ fontWeight: '700', color: '#0B3B61' }}>{request.totalDays}</Text></Text>
        </View>

        {request.reason ? (
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 4 }}>
            <Ionicons name="chatbox-outline" size={16} color="#98A0A8" style={{ marginTop: 2 }} />
            <Text style={{ fontSize: 13, color: '#6B7280', flex: 1, lineHeight: 18 }}>{request.reason}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: spacing.sm,
  },
  cardInner: {
    gap: spacing.sm,
  },
  content: {
    gap: spacing.lg,
    padding: spacing.lg,
  },
  muted: {
    color: colors.muted,
    fontSize: 13,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  text: {
    color: colors.text,
    fontSize: 14,
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
});
