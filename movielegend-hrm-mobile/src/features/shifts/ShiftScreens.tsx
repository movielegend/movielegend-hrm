import { useRouter, useLocalSearchParams } from 'expo-router';
import { useMemo, useState, useEffect } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { EmptyState } from '../../components/EmptyState';
import { FormField } from '../../components/FormField';
import { PageHeader } from '../../components/PageHeader';
import { PrimaryButton, SecondaryButton } from '../../components/Buttons';
import { Screen } from '../../components/Screen';
import { SectionCard } from '../../components/SectionCard';
import { StatusBadge } from '../../components/StatusBadge';
import { useAuth } from '../../providers/AuthProvider';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { businessDateToday, formatDate, formatShiftRange } from '../../utils/date-time';
import { hasPermission } from '../../utils/permissions';
import { normalizeApiError } from '../../utils/api-error';
import { findTodayShift } from '../attendance/attendance.logic';
import { useAssignShift, useCreateShift, useUpdateShift, useDeleteShift, useCreateShiftRegistration, useCreateShiftSwap, useMySchedule, useShifts } from '../../hooks/useShifts';

export function EmployeeScheduleScreen() {
  const router = useRouter();
  const schedule = useMySchedule();
  const todayShift = useMemo(() => findTodayShift(schedule.data ?? []), [schedule.data]);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <PageHeader title="Lich lam viec" subtitle={`Hom nay: ${businessDateToday()}`} />
        <SectionCard title="Ca hom nay">
          {todayShift?.shift ? (
            <>
              <Text style={styles.title}>{todayShift.shift.name}</Text>
              <Text style={styles.text}>{formatDate(todayShift.workDate)} - {formatShiftRange(todayShift.shift.startTime, todayShift.shift.endTime)}</Text>
              <StatusBadge label={todayShift.shift.isNightShift ? 'Ca dem' : 'Ca ngay'} tone={todayShift.shift.isNightShift ? 'info' : 'neutral'} />
            </>
          ) : (
            <EmptyState title="Chua co ca hom nay" message="Backend chua tra ca lam cho ngay hien tai." />
          )}
        </SectionCard>
        <SectionCard title="Danh sach ca">
          {(schedule.data ?? []).length ? (schedule.data ?? []).map((assignment) => (
            <View key={assignment.id} style={styles.row}>
              <View style={styles.grow}>
                <Text style={styles.title}>{assignment.shift?.name ?? assignment.shiftId}</Text>
                <Text style={styles.text}>{formatDate(assignment.workDate)} - {formatShiftRange(assignment.shift?.startTime, assignment.shift?.endTime)}</Text>
              </View>
              <StatusBadge label={assignment.status} tone="info" />
            </View>
          )) : <EmptyState />}
        </SectionCard>
        <SecondaryButton onPress={() => router.push('/employee/attendance')}>Mo cham cong</SecondaryButton>
        <ShiftRegistrationCard />
        <ShiftSwapCard />
      </ScrollView>
    </Screen>
  );
}

export function AdminShiftsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const shifts = useShifts();
  const deleteShift = useDeleteShift();

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      'Xóa ca làm việc',
      `Bạn có chắc chắn muốn xóa ca "${name}"?\nDữ liệu đã xếp ca cho nhân viên sẽ không bị ảnh hưởng (Xóa mềm).`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteShift.mutateAsync(id);
              Alert.alert('Thành công', 'Đã xóa ca làm việc');
            } catch (error) {
              const normalized = normalizeApiError(error);
              Alert.alert('Lỗi', normalized.message);
            }
          },
        },
      ]
    );
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <PageHeader
          title="Quản lý Ca làm việc"
          subtitle="Tất cả ca làm việc trong hệ thống"
          right={
            hasPermission(user, 'shift.create') ? (
              <Pressable
                style={styles.addBtn}
                onPress={() => router.push('/admin/shifts/create')}
              >
                <MaterialCommunityIcons name="plus" size={20} color="#fff" />
                <Text style={styles.addBtnText}>Thêm mới</Text>
              </Pressable>
            ) : null
          }
        />
        
        {hasPermission(user, 'shift.assign') ? (
          <SecondaryButton onPress={() => router.push('/admin/shifts/assign')}>
            Phân ca nhân viên
          </SecondaryButton>
        ) : null}

        <View style={styles.shiftList}>
          {(shifts.data ?? []).map((shift) => (
            <View key={shift.id} style={styles.shiftCard}>
              <View style={styles.shiftHeader}>
                <View style={styles.shiftIconBox}>
                  <MaterialCommunityIcons name="clock-outline" size={24} color={colors.primary} />
                </View>
                <View style={styles.shiftInfo}>
                  <Text style={styles.shiftName}>{shift.name}</Text>
                  <Text style={styles.shiftCode}>Mã: {shift.code}</Text>
                </View>
                <StatusBadge
                  label={shift.isActive ? 'Đang hoạt động' : 'Đã ẩn'}
                  tone={shift.isActive ? 'success' : 'neutral'}
                />
              </View>
              
              <View style={styles.shiftTimeBox}>
                <MaterialCommunityIcons name="timer-outline" size={16} color={colors.muted} />
                <Text style={styles.shiftTimeText}>
                  {formatShiftRange(shift.startTime, shift.endTime)}
                </Text>
              </View>

              {shift.assignments && shift.assignments.length > 0 && (
                <View style={styles.assignmentSection}>
                  <View style={styles.assignmentHeader}>
                    <MaterialCommunityIcons name="account-group-outline" size={16} color={colors.primary} />
                    <Text style={styles.assignmentLabel}>Leaders đã phân ca</Text>
                    <View style={styles.assignmentCount}>
                      <Text style={styles.assignmentCountText}>{shift.assignments.length}</Text>
                    </View>
                  </View>
                  <View style={styles.assignmentList}>
                    {shift.assignments.map(a => {
                      const name = a.user?.profile?.fullName ?? a.user?.userCode ?? '?';
                      const initials = name.split(' ').filter(Boolean).slice(-2).map(w => w[0]).join('').toUpperCase();
                      return (
                        <View key={a.id} style={styles.assignmentChip}>
                          <View style={styles.assignmentAvatar}>
                            <Text style={styles.assignmentAvatarText}>{initials}</Text>
                          </View>
                          <Text style={styles.assignmentName}>{name}</Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}

              <View style={styles.shiftActions}>
                <Pressable
                  style={[styles.actionBtn, { backgroundColor: '#FFF7ED' }]}
                  onPress={() => router.push(`/admin/shifts/edit/${shift.id}`)}
                >
                  <MaterialCommunityIcons name="pencil" size={18} color="#EA580C" />
                  <Text style={[styles.actionText, { color: '#EA580C' }]}>Sửa</Text>
                </Pressable>

                <Pressable
                  style={[styles.actionBtn, { backgroundColor: '#FEF2F2' }]}
                  onPress={() => handleDelete(shift.id, shift.name)}
                >
                  <MaterialCommunityIcons name="delete-outline" size={18} color="#DC2626" />
                  <Text style={[styles.actionText, { color: '#DC2626' }]}>Xóa</Text>
                </Pressable>
              </View>
            </View>
          ))}
          {!shifts.data?.length && !shifts.isLoading && (
            <EmptyState title="Chưa có ca làm việc" message="Nhấn Thêm mới để tạo ca làm việc đầu tiên" />
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

export function CreateShiftScreen() {
  const router = useRouter();
  const createShift = useCreateShift();
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('17:00');

  async function submit() {
    try {
      await createShift.mutateAsync({ code, name, startTime, endTime });
      Alert.alert('Thành công', 'Đã tạo ca làm việc mới');
      router.back();
    } catch (error) {
      const normalized = normalizeApiError(error);
      Alert.alert('Lỗi', normalized.message);
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <PageHeader title="Tạo Ca làm việc" subtitle="Nhập thông tin ca làm mới" />
        <SectionCard>
          <FormField label="Mã ca (VD: CA1)" value={code} onChangeText={setCode} autoCapitalize="characters" />
          <FormField label="Tên ca (VD: Ca Sáng)" value={name} onChangeText={setName} />
          <FormField label="Giờ bắt đầu (HH:mm)" value={startTime} onChangeText={setStartTime} />
          <FormField label="Giờ kết thúc (HH:mm)" value={endTime} onChangeText={setEndTime} />
          <View style={{ marginTop: spacing.md }}>
            <PrimaryButton loading={createShift.isPending} disabled={!code || !name} onPress={() => void submit()}>
              Tạo Ca Mới
            </PrimaryButton>
          </View>
        </SectionCard>
      </ScrollView>
    </Screen>
  );
}

export function EditShiftScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const shifts = useShifts();
  const updateShift = useUpdateShift(id as string);
  
  const shift = useMemo(() => (shifts.data ?? []).find(s => s.id === id), [shifts.data, id]);

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  useEffect(() => {
    if (shift) {
      setCode(shift.code);
      setName(shift.name);
      setStartTime(shift.startTime);
      setEndTime(shift.endTime);
    }
  }, [shift]);

  async function submit() {
    try {
      await updateShift.mutateAsync({ code, name, startTime, endTime });
      Alert.alert('Thành công', 'Đã cập nhật ca làm việc');
      router.back();
    } catch (error) {
      const normalized = normalizeApiError(error);
      Alert.alert('Lỗi', normalized.message);
    }
  }

  if (!shift) {
    return (
      <Screen>
        <EmptyState title="Không tìm thấy ca làm việc" message="Ca làm việc không tồn tại hoặc đã bị xóa." />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <PageHeader title="Cập nhật Ca làm việc" subtitle={`Đang sửa: ${shift.name}`} />
        <SectionCard>
          <FormField label="Mã ca" value={code} onChangeText={setCode} autoCapitalize="characters" />
          <FormField label="Tên ca" value={name} onChangeText={setName} />
          <FormField label="Giờ bắt đầu (HH:mm)" value={startTime} onChangeText={setStartTime} />
          <FormField label="Giờ kết thúc (HH:mm)" value={endTime} onChangeText={setEndTime} />
          <View style={{ marginTop: spacing.md }}>
            <PrimaryButton loading={updateShift.isPending} disabled={!code || !name} onPress={() => void submit()}>
              Lưu Thay Đổi
            </PrimaryButton>
          </View>
        </SectionCard>
      </ScrollView>
    </Screen>
  );
}

export function LeaderShiftManagementScreen() {
  const assign = useAssignShift();
  const shifts = useShifts();
  const [userId, setUserId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [shiftId, setShiftId] = useState('');
  const [workDate, setWorkDate] = useState(businessDateToday());

  async function submit() {
    try {
      await assign.mutateAsync({ userId, departmentId, shiftId, workDate });
      Alert.alert('Thanh cong', 'Da phan ca');
    } catch (error) {
      const normalized = normalizeApiError(error);
      Alert.alert(normalized.code, normalized.message);
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <PageHeader title="Phan ca" subtitle="Backend se validate department scope cua Leader/Admin." />
        <SectionCard title="Ca co san">
          {(shifts.data ?? []).map((shift) => <Text key={shift.id} style={styles.text}>{shift.name}: {shift.id}</Text>)}
          {!shifts.data?.length ? <EmptyState /> : null}
        </SectionCard>
        <SectionCard title="Thong tin phan ca">
          <FormField label="User ID" value={userId} onChangeText={setUserId} autoCapitalize="none" />
          <FormField label="Department ID" value={departmentId} onChangeText={setDepartmentId} autoCapitalize="none" />
          <FormField label="Shift ID" value={shiftId} onChangeText={setShiftId} autoCapitalize="none" />
          <FormField label="Work date YYYY-MM-DD" value={workDate} onChangeText={setWorkDate} />
          <PrimaryButton loading={assign.isPending} disabled={!userId || !departmentId || !shiftId || !workDate} onPress={() => void submit()}>Phan ca</PrimaryButton>
        </SectionCard>
      </ScrollView>
    </Screen>
  );
}

function ShiftSwapCard() {
  const mutation = useCreateShiftSwap();
  const [targetUserId, setTargetUserId] = useState('');
  const [fromShiftId, setFromShiftId] = useState('');
  const [toShiftId, setToShiftId] = useState('');
  const [fromDate, setFromDate] = useState(businessDateToday());
  const [toDate, setToDate] = useState(businessDateToday());
  const [reason, setReason] = useState('');

  async function submit() {
    try {
      await mutation.mutateAsync({ targetUserId, fromShiftId, toShiftId, fromDate, toDate, reason });
      Alert.alert('Thanh cong', 'Da tao yeu cau doi ca');
    } catch (error) {
      const normalized = normalizeApiError(error);
      Alert.alert(normalized.code, normalized.message);
    }
  }

  return (
    <SectionCard title="Yeu cau doi ca">
      <Text style={styles.muted}>Backend DTO hien dung targetUserId/fromShiftId/toShiftId/fromDate/toDate/reason.</Text>
      <FormField label="Target user ID" value={targetUserId} onChangeText={setTargetUserId} autoCapitalize="none" />
      <FormField label="From shift ID" value={fromShiftId} onChangeText={setFromShiftId} autoCapitalize="none" />
      <FormField label="To shift ID" value={toShiftId} onChangeText={setToShiftId} autoCapitalize="none" />
      <FormField label="From date" value={fromDate} onChangeText={setFromDate} />
      <FormField label="To date" value={toDate} onChangeText={setToDate} />
      <FormField label="Ly do" value={reason} onChangeText={setReason} multiline />
      <PrimaryButton loading={mutation.isPending} disabled={!targetUserId || !fromShiftId || !toShiftId || reason.length < 3} onPress={() => void submit()}>Gui doi ca</PrimaryButton>
    </SectionCard>
  );
}

function ShiftRegistrationCard() {
  const mutation = useCreateShiftRegistration();
  const shifts = useShifts();
  const [shiftId, setShiftId] = useState('');
  const [workDate, setWorkDate] = useState(businessDateToday());
  const [reason, setReason] = useState('');

  async function submit() {
    try {
      await mutation.mutateAsync({ shiftId, workDate, reason });
      Alert.alert('Thanh cong', 'Da gui yeu cau dang ky ca');
    } catch (error) {
      const normalized = normalizeApiError(error);
      Alert.alert(normalized.code, normalized.message);
    }
  }

  return (
    <SectionCard title="Dang ky ca">
      <Text style={styles.muted}>Chon shiftId that tu backend /shifts.</Text>
      {(shifts.data ?? []).slice(0, 5).map((shift) => <Text key={shift.id} style={styles.text}>{shift.name}: {shift.id}</Text>)}
      <FormField label="Shift ID" value={shiftId} onChangeText={setShiftId} autoCapitalize="none" />
      <FormField label="Work date" value={workDate} onChangeText={setWorkDate} />
      <FormField label="Ly do" value={reason} onChangeText={setReason} multiline />
      <PrimaryButton loading={mutation.isPending} disabled={!shiftId || reason.length < 3} onPress={() => void submit()}>Gui dang ky ca</PrimaryButton>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  grow: {
    flex: 1,
  },
  muted: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  row: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.sm,
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
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 4,
  },
  addBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  shiftList: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
  shiftCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  shiftHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  shiftIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  shiftInfo: {
    flex: 1,
  },
  shiftName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  shiftCode: {
    fontSize: 13,
    color: colors.muted,
    marginTop: 2,
  },
  shiftTimeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: spacing.sm,
    borderRadius: 8,
    marginBottom: spacing.md,
    gap: 6,
  },
  shiftTimeText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  shiftActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  actionText: {
    fontWeight: '600',
    fontSize: 14,
  },
  assignmentSection: {
    marginTop: 12,
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  assignmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 6,
  },
  assignmentLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    flex: 1,
  },
  assignmentCount: {
    backgroundColor: colors.primarySoft,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  assignmentCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  assignmentList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  assignmentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingRight: 12,
    paddingLeft: 4,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    gap: 8,
  },
  assignmentAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assignmentAvatarText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  assignmentName: {
    fontSize: 13,
    color: '#166534',
    fontWeight: '600',
  },
});
