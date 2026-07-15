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
import { getHomeRouteForUser } from '../../utils/role-routing';
import { findTodayShift } from '../attendance/attendance.logic';
import { useAssignShift, useCreateShift, useUpdateShift, useDeleteShift, useCreateShiftRegistration, useCreateShiftSwap, useMySchedule, useShifts } from '../../hooks/useShifts';

export function EmployeeScheduleScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const schedule = useMySchedule();
  const todayShift = useMemo(() => findTodayShift(schedule.data ?? []), [schedule.data]);
  
  const rolePrefix = useMemo(() => getHomeRouteForUser(user), [user]);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <PageHeader 
          title="Lịch làm việc cá nhân" 
          subtitle={`Hôm nay: ${businessDateToday()}`} 
        />
        
        <SectionCard title="Ca làm việc hôm nay">
          {todayShift?.shift ? (
            <Pressable 
              style={styles.todayShiftCard}
              onPress={() => router.push(`${rolePrefix}/attendance/check-in` as any)}
            >
              <View style={styles.shiftIconBox}>
                <MaterialCommunityIcons name="briefcase-clock-outline" size={28} color={colors.primary} />
              </View>
              <View style={styles.grow}>
                <Text style={styles.shiftTitleText}>{todayShift.shift.name}</Text>
                <View style={styles.timeRow}>
                  <MaterialCommunityIcons name="clock-outline" size={16} color={colors.muted} />
                  <Text style={styles.timeText}>{formatDate(todayShift.workDate)} • {formatShiftRange(todayShift.shift.startTime, todayShift.shift.endTime)}</Text>
                </View>
                <View style={{ alignSelf: 'flex-start', marginTop: 8 }}>
                  <StatusBadge label={todayShift.shift.isNightShift ? 'Ca đêm' : 'Ca ngày'} tone={todayShift.shift.isNightShift ? 'warning' : 'success'} />
                </View>
              </View>
              <View style={styles.attendanceActionBox}>
                <MaterialCommunityIcons name="fingerprint" size={24} color={colors.primary} />
                <Text style={styles.attendanceActionText}>Chấm công</Text>
              </View>
            </Pressable>
          ) : (
            <EmptyState 
              title="Không có lịch làm việc" 
              message="Hôm nay bạn không có ca làm việc nào được xếp." 
              icon="calendar-blank-outline"
            />
          )}
        </SectionCard>
        
        <SectionCard title="Tiện ích ca làm việc">
          <View style={styles.utilitiesGrid}>
            <Pressable style={styles.utilityBtn} onPress={() => Alert.alert('Thông báo', 'Tính năng Đăng ký ca làm việc đang được nâng cấp.')}>
              <View style={[styles.utilityIconBox, { backgroundColor: '#ECFDF5' }]}>
                <MaterialCommunityIcons name="calendar-plus" size={24} color="#10B981" />
              </View>
              <Text style={styles.utilityText}>Đăng ký ca</Text>
            </Pressable>
            
            <Pressable style={styles.utilityBtn} onPress={() => Alert.alert('Thông báo', 'Tính năng Đề xuất đổi ca đang được nâng cấp.')}>
              <View style={[styles.utilityIconBox, { backgroundColor: '#FFFBEB' }]}>
                <MaterialCommunityIcons name="calendar-sync" size={24} color="#F59E0B" />
              </View>
              <Text style={styles.utilityText}>Đổi ca</Text>
            </Pressable>

            <Pressable style={styles.utilityBtn} onPress={() => router.push(`${rolePrefix}/attendance/check-in` as any)}>
              <View style={[styles.utilityIconBox, { backgroundColor: '#EFF6FF' }]}>
                <MaterialCommunityIcons name="fingerprint" size={24} color="#3B82F6" />
              </View>
              <Text style={styles.utilityText}>Chấm công</Text>
            </Pressable>
          </View>
        </SectionCard>

        <SectionCard title="Danh sách ca sắp tới">
          {(schedule.data ?? []).length ? (schedule.data ?? []).map((assignment) => (
            <View key={assignment.id} style={styles.upcomingShiftRow}>
              <View style={styles.dateBox}>
                <Text style={styles.dateDayText}>{new Date(assignment.workDate).getDate()}</Text>
                <Text style={styles.dateMonthText}>Thg {new Date(assignment.workDate).getMonth() + 1}</Text>
              </View>
              <View style={styles.upcomingShiftInfo}>
                <Text style={styles.upcomingShiftTitle}>{assignment.shift?.name ?? assignment.shiftId}</Text>
                <View style={styles.timeRow}>
                  <MaterialCommunityIcons name="timer-outline" size={14} color={colors.muted} />
                  <Text style={styles.timeText}>{formatShiftRange(assignment.shift?.startTime, assignment.shift?.endTime)}</Text>
                </View>
              </View>
              <View style={styles.statusBox}>
                <StatusBadge 
                  label={assignment.status === 'ACTIVE' ? 'Đã xếp ca' : assignment.status} 
                  tone={assignment.status === 'ACTIVE' ? 'info' : 'neutral'} 
                />
              </View>
            </View>
          )) : <EmptyState title="Trống" message="Chưa có ca làm việc nào trong thời gian tới." />}
        </SectionCard>
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
                  <MaterialCommunityIcons name="clock-outline" size={24} color="#111827" />
                </View>
                <View style={styles.shiftInfo}>
                  <Text style={styles.shiftName}>{shift.name}</Text>
                  <Text style={styles.shiftCode}>Mã: {shift.code}</Text>
                </View>
                <View style={styles.statusBadge}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusText}>{shift.isActive ? 'Đang hoạt động' : 'Đã ẩn'}</Text>
                </View>
              </View>
              
              <View style={styles.shiftTimeBox}>
                <MaterialCommunityIcons name="timer-outline" size={16} color={colors.muted} />
                <Text style={styles.shiftTimeText}>
                  {formatShiftRange(shift.startTime, shift.endTime)}
                </Text>
              </View>

              {shift.assignments && shift.assignments.length > 0 && (() => {
                const uniqueAssignments = shift.assignments.filter(
                  (a, index, self) => index === self.findIndex((t) => t.userId === a.userId)
                );
                return (
                  <View style={styles.assignmentSection}>
                    <View style={styles.assignmentHeader}>
                      <MaterialCommunityIcons name="account-group-outline" size={16} color="#111827" />
                      <Text style={styles.assignmentLabel}>Leaders đã phân ca</Text>
                      <View style={styles.assignmentCount}>
                        <Text style={styles.assignmentCountText}>{uniqueAssignments.length}</Text>
                      </View>
                    </View>
                    <View style={styles.assignmentList}>
                      {uniqueAssignments.map(a => {
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
                );
              })()}

              <View style={styles.shiftActions}>
                <Pressable
                  style={[styles.actionBtn, { backgroundColor: '#F3F4F6' }]}
                  onPress={() => router.push(`/admin/shifts/edit/${shift.id}`)}
                >
                  <MaterialCommunityIcons name="pencil" size={18} color="#111827" />
                  <Text style={[styles.actionText, { color: '#111827' }]}>Sửa</Text>
                </Pressable>

                <Pressable
                  style={[styles.actionBtn, { backgroundColor: '#F3F4F6' }]}
                  onPress={() => handleDelete(shift.id, shift.name)}
                >
                  <MaterialCommunityIcons name="delete-outline" size={18} color="#111827" />
                  <Text style={[styles.actionText, { color: '#111827' }]}>Xóa</Text>
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
    backgroundColor: '#111827',
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
    backgroundColor: '#F3F4F6',
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
    backgroundColor: '#F3F4F6',
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
    color: '#111827',
  },
  assignmentList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  assignmentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingRight: 12,
    paddingLeft: 4,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  assignmentAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  assignmentAvatarText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#111827',
  },
  assignmentName: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#111827',
  },
  statusText: {
    color: '#4B5563',
    fontSize: 13,
    fontWeight: '600',
  },
  todayShiftCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  shiftTitleText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 14,
    color: colors.muted,
  },
  attendanceActionBox: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    marginLeft: spacing.sm,
  },
  attendanceActionText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 4,
  },
  upcomingShiftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dateBox: {
    width: 50,
    height: 50,
    backgroundColor: '#F0F9FF',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  dateDayText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0284C7',
  },
  dateMonthText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#0284C7',
  },
  upcomingShiftInfo: {
    flex: 1,
  },
  upcomingShiftTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  statusBox: {
    marginLeft: spacing.sm,
  },
  utilitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  utilityBtn: {
    width: '30%',
    alignItems: 'center',
    paddingVertical: spacing.md,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  utilityIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  utilityText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text,
  },
});
