import { Image, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
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
import { useAssignShift, useCreateShift, useCreateShiftRegistration, useCreateShiftSwap, useMySchedule, useShifts } from '../../hooks/useShifts';

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

  const [currentDate, setCurrentDate] = useState(new Date(2023, 10, 1)); // Tháng 11 năm 2023
  const [selectedDate, setSelectedDate] = useState(new Date(2023, 10, 7));

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getDayOfWeek = (year, month, day) => {
    const d = new Date(year, month, day).getDay();
    if (d === 0) return 'CN';
    return `T${d + 1}`;
  };

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);

  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);


  return (
    <Screen>
      <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Pressable onPress={() => router.back()} style={{ padding: 4 }}>
              <Ionicons name="chevron-back" size={24} color="#1E293B" />
            </Pressable>
            <Text style={{ fontSize: 20, fontWeight: '700', color: '#1E293B' }}>Xếp ca làm việc</Text>
          </View>
          <Pressable onPress={() => router.push('/admin/shifts/create')}>
            <Ionicons name="add" size={24} color="#64748B" />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
          {/* Calendar Strip */}
          <View style={{ padding: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                <Pressable onPress={() => {
                  const newDate = new Date(currentDate);
                  newDate.setMonth(newDate.getMonth() - 1);
                  setCurrentDate(newDate);
                }} style={{ padding: 4 }}>
                  <Ionicons name="chevron-back" size={20} color="#3B82F6" />
                </Pressable>
                
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="calendar-outline" size={20} color="#3B82F6" />
                  <Text style={{ fontSize: 16, fontWeight: '700', color: '#1E293B' }}>
                    Tháng {currentMonth + 1}, {currentYear}
                  </Text>
                </View>

                <Pressable onPress={() => {
                  const newDate = new Date(currentDate);
                  newDate.setMonth(newDate.getMonth() + 1);
                  setCurrentDate(newDate);
                }} style={{ padding: 4 }}>
                  <Ionicons name="chevron-forward" size={20} color="#3B82F6" />
                </Pressable>
              </View>
              <Text style={{ fontSize: 13, color: '#3B82F6', fontWeight: '500' }}>Xem lịch tháng</Text>
            </View>

            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 16 }}>
              {daysArray.map((day) => {
                const isSelected = selectedDate.getDate() === day && selectedDate.getMonth() === currentMonth;
                const dayStr = day < 10 ? `0${day}` : day;
                const dow = getDayOfWeek(currentYear, currentMonth, day);

                return (
                  <Pressable 
                    key={day}
                    onPress={() => setSelectedDate(new Date(currentYear, currentMonth, day))}
                    style={{ 
                      width: 56, 
                      height: 72, 
                      borderRadius: 16, 
                      borderWidth: isSelected ? 0 : 1, 
                      borderColor: '#E2E8F0', 
                      backgroundColor: isSelected ? '#3B82F6' : '#FFFFFF',
                      alignItems: 'center', 
                      justifyContent: 'center' 
                    }}
                  >
                    <Text style={{ fontSize: 12, color: isSelected ? '#FFFFFF' : '#64748B', fontWeight: '500', marginBottom: 4 }}>{dow}</Text>
                    <Text style={{ fontSize: 16, color: isSelected ? '#FFFFFF' : '#1E293B', fontWeight: '700' }}>{dayStr}</Text>
                    {isSelected && <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#FFFFFF', marginTop: 4 }} />}
                  </Pressable>
                );
              })}
            </ScrollView>
    </View>

          <View style={{ height: 1, backgroundColor: '#E2E8F0', marginVertical: 8 }} />

          {/* Today Shifts */}
          <View style={{ padding: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#1E293B' }}>Ca trực hôm nay</Text>
              <View style={{ backgroundColor: '#EFF6FF', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 }}>
                <Text style={{ fontSize: 12, color: '#3B82F6', fontWeight: '700' }}>3</Text>
              </View>
            </View>

            {/* Shift Card 1 */}
            <Pressable onPress={() => router.push('/admin/shifts/detail-1')} style={{ backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 16, overflow: 'hidden' }}>
              <View style={{ height: 4, backgroundColor: '#22C55E' }} />
              <View style={{ padding: 16 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="time-outline" size={20} color="#16A34A" />
                    </View>
                    <View>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748B', marginBottom: 2 }}>CA 1 - HÀNH CHÍNH</Text>
                      <Text style={{ fontSize: 16, fontWeight: '800', color: '#1E293B' }}>08:00 - 17:00</Text>
                    </View>
                  </View>
                  <View style={{ borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 }}>
                    <Text style={{ fontSize: 11, fontWeight: '600', color: '#64748B' }}>15 NV</Text>
                  </View>
                </View>
                
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Ionicons name="location-outline" size={16} color="#94A3B8" />
                  <Text style={{ fontSize: 13, color: '#64748B' }}>Phòng Kế toán, Khối VP</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <Ionicons name="people-outline" size={16} color="#94A3B8" />
                  <Text style={{ fontSize: 13, color: '#64748B' }}>Đã setup cứng (Lặp lại hàng tuần)</Text>
                </View>

                <Pressable style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: '#E0F2FE', borderRadius: 12, paddingVertical: 10 }}>
                  <Ionicons name="create-outline" size={16} color="#3B82F6" />
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#3B82F6' }}>Quản lý nhân sự</Text>
                </Pressable>
              </View>
            </Pressable>
            {/* Shift Card 2 */}
            <Pressable onPress={() => router.push('/admin/shifts/detail-2')} style={{ backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 16, overflow: 'hidden' }}>
              <View style={{ height: 4, backgroundColor: '#3B82F6' }} />
              <View style={{ padding: 16 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="time-outline" size={20} color="#3B82F6" />
                    </View>
                    <View>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748B', marginBottom: 2 }}>CA 2 - LINH HOẠT</Text>
                      <Text style={{ fontSize: 16, fontWeight: '800', color: '#1E293B' }}>09:00 - 18:30</Text>
                    </View>
                  </View>
                  <View style={{ backgroundColor: '#F3F4F6', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 }}>
                    <Text style={{ fontSize: 11, fontWeight: '600', color: '#475569' }}>8 NV</Text>
                  </View>
                </View>
                
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Ionicons name="location-outline" size={16} color="#94A3B8" />
                  <Text style={{ fontSize: 13, color: '#64748B' }}>Phòng IT, Khối Kỹ Thuật</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <Ionicons name="people-outline" size={16} color="#94A3B8" />
                  <Text style={{ fontSize: 13, color: '#64748B' }}>Đã setup cứng (Lặp lại hàng tuần)</Text>
                </View>

                <Pressable style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: '#E0F2FE', borderRadius: 12, paddingVertical: 10 }}>
                  <Ionicons name="create-outline" size={16} color="#3B82F6" />
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#3B82F6' }}>Quản lý nhân sự</Text>
                </Pressable>
              </View>
            </Pressable>
            {/* Shift Card 3 */}
            <Pressable onPress={() => router.push('/admin/shifts/detail-3')} style={{ backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 16, overflow: 'hidden' }}>
              <View style={{ height: 4, backgroundColor: '#8B5CF6' }} />
              <View style={{ padding: 16 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#F5F3FF', alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="moon-outline" size={20} color="#8B5CF6" />
                    </View>
                    <View>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748B', marginBottom: 2 }}>CA 3 - CA TỐI</Text>
                      <Text style={{ fontSize: 16, fontWeight: '800', color: '#1E293B' }}>17:00 - 23:00</Text>
                    </View>
                  </View>
                  <View style={{ backgroundColor: '#F3F4F6', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 }}>
                    <Text style={{ fontSize: 11, fontWeight: '600', color: '#475569' }}>5 NV</Text>
                  </View>
                </View>
                
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Ionicons name="location-outline" size={16} color="#94A3B8" />
                  <Text style={{ fontSize: 13, color: '#64748B' }}>Bảo vệ, Khối Dịch vụ</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <Ionicons name="people-outline" size={16} color="#94A3B8" />
                  <Text style={{ fontSize: 13, color: '#64748B' }}>Đã setup cứng (Lặp lại hàng tuần)</Text>
                </View>

                <Pressable style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: '#EDE9FE', borderRadius: 12, paddingVertical: 10 }}>
                  <Ionicons name="create-outline" size={16} color="#8B5CF6" />
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#8B5CF6' }}>Quản lý nhân sự</Text>
                </Pressable>
              </View>
            </Pressable>
          </View>

          {/* Swap Requests */}
          <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#1E293B' }}>Yêu cầu đổi ca</Text>
                <View style={{ backgroundColor: '#EF4444', borderRadius: 10, width: 20, height: 20, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 11, color: '#FFFFFF', fontWeight: '700' }}>1</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
            </View>

            <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View>
                    <Image source={{ uri: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=150&q=80' }} style={{ width: 40, height: 40, borderRadius: 20 }} />
                    <View style={{ position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: 5, backgroundColor: '#22C55E', borderWidth: 1.5, borderColor: '#FFFFFF' }} />
                  </View>
                  <View>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#1E293B', marginBottom: 2 }}>Nguyễn Văn An</Text>
                    <Text style={{ fontSize: 11, color: '#64748B' }}>IT - Khối Kỹ Thuật • Hôm nay</Text>
                  </View>
                </View>
                <Text style={{ fontSize: 11, fontWeight: '600', color: '#1E293B' }}>Chờ duyệt</Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 12, padding: 12, marginBottom: 16 }}>
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: '#64748B', marginBottom: 4 }}>HIỆN TẠI</Text>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#1E293B' }}>08:00 - 17:00</Text>
                </View>
                <Ionicons name="swap-horizontal" size={16} color="#3B82F6" />
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: '#64748B', marginBottom: 4 }}>MUỐN ĐỔI</Text>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#3B82F6' }}>09:00 - 18:30</Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <Pressable style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 12 }}>
                  <Ionicons name="close-circle-outline" size={18} color="#EF4444" />
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#EF4444' }}>Từ chối</Text>
                </Pressable>
                <Pressable style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#3B82F6', paddingVertical: 12, borderRadius: 12 }}>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#FFFFFF' }}>Phê duyệt</Text>
                </Pressable>
              </View>
            </View>
          </View>

          {/* Notes */}
          <View style={{ paddingHorizontal: 16, paddingBottom: 24 }}>
            <View style={{ backgroundColor: '#F7FEE7', borderRadius: 12, padding: 16, flexDirection: 'row', gap: 12 }}>
              <Ionicons name="information-circle-outline" size={24} color="#65A30D" />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#1E293B', marginBottom: 4 }}>Ghi chú lịch tuần tới</Text>
                <Text style={{ fontSize: 12, color: '#475569', lineHeight: 18 }}>Lịch trực tuần sau sẽ được phê duyệt vào Thứ 6. Hệ thống sẽ tự động fill danh sách nhân sự (hard-setup) cho mỗi ca làm việc. Vui lòng cập nhật thay đổi trước 17:00.</Text>
              </View>
            </View>
          </View>

          {/* Management Tools */}
          <View style={{ paddingHorizontal: 16, paddingBottom: 32 }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#94A3B8', marginBottom: 12 }}>CÔNG CỤ QUẢN LÝ</Text>
            <View style={{ flexDirection: 'row', gap: 16 }}>
              <Pressable style={{ flex: 1, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingVertical: 16, backgroundColor: '#FFFFFF' }} onPress={() => router.push('/admin/shifts/create')}>
                <Ionicons name="add" size={24} color="#3B82F6" style={{ marginBottom: 8 }} />
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#1E293B' }}>Tạo ca trực</Text>
              </Pressable>
              
              <Pressable style={{ flex: 1, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingVertical: 16, backgroundColor: '#FFFFFF' }}>
                <Ionicons name="bar-chart-outline" size={24} color="#3B82F6" style={{ marginBottom: 8 }} />
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#1E293B' }}>Thống kê ca</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </View>
    </Screen>
  );
}

export function CreateShiftScreen() {
  const router = useRouter();

  return (
    <Screen>
      <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Pressable onPress={() => router.back()} style={{ padding: 4 }}>
              <Ionicons name="chevron-back" size={24} color="#1E293B" />
            </Pressable>
            <Text style={{ fontSize: 20, fontWeight: '700', color: '#1E293B' }}>Tạo ca trực mới</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
          
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 20 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#1E293B', marginBottom: 16 }}>THÔNG TIN CHUNG</Text>
            
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#64748B', marginBottom: 8 }}>Tên ca trực <Text style={{ color: '#EF4444' }}>*</Text></Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, backgroundColor: '#F8FAFC' }}>
                <Ionicons name="pricetag-outline" size={20} color="#94A3B8" style={{ marginRight: 8 }} />
                <Text style={{ fontSize: 15, color: '#94A3B8' }}>Nhập tên ca (VD: Ca Sáng)</Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 16 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#64748B', marginBottom: 8 }}>Giờ bắt đầu <Text style={{ color: '#EF4444' }}>*</Text></Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12 }}>
                  <Text style={{ fontSize: 15, color: '#1E293B', fontWeight: '500' }}>08:00</Text>
                  <Ionicons name="time-outline" size={20} color="#3B82F6" />
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#64748B', marginBottom: 8 }}>Giờ kết thúc <Text style={{ color: '#EF4444' }}>*</Text></Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12 }}>
                  <Text style={{ fontSize: 15, color: '#1E293B', fontWeight: '500' }}>17:00</Text>
                  <Ionicons name="time-outline" size={20} color="#3B82F6" />
                </View>
              </View>
            </View>
          </View>

          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 20 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#1E293B', marginBottom: 16 }}>SETUP NHÂN SỰ CỐ ĐỊNH (HÀNG TUẦN)</Text>
            
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#64748B', marginBottom: 8 }}>Phòng ban áp dụng</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="business-outline" size={20} color="#94A3B8" style={{ marginRight: 8 }} />
                  <Text style={{ fontSize: 15, color: '#1E293B' }}>Chọn phòng ban...</Text>
                </View>
                <Ionicons name="chevron-down" size={20} color="#64748B" />
              </View>
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#64748B', marginBottom: 8 }}>Thêm nhân viên</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="people-outline" size={20} color="#94A3B8" style={{ marginRight: 8 }} />
                  <Text style={{ fontSize: 15, color: '#1E293B' }}>Chọn nhân viên cụ thể...</Text>
                </View>
                <Ionicons name="chevron-down" size={20} color="#64748B" />
              </View>
            </View>

            <View style={{ backgroundColor: '#EFF6FF', borderRadius: 12, padding: 12, flexDirection: 'row', gap: 8 }}>
               <Ionicons name="information-circle" size={20} color="#3B82F6" />
               <Text style={{ fontSize: 12, color: '#1E293B', flex: 1, lineHeight: 18 }}>
                 Danh sách nhân sự này sẽ được **tự động phân công (fill data)** vào ca trực này mỗi tuần. Nếu có thay đổi đột xuất (vắng mặt, đổi ca), Admin sẽ chỉnh sửa riêng cho từng ngày.
               </Text>
            </View>
          </View>
          
          <Pressable style={{ backgroundColor: '#3B82F6', borderRadius: 14, paddingVertical: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
             <Ionicons name="save-outline" size={20} color="#FFFFFF" />
             <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF' }}>Lưu cấu hình ca trực</Text>
          </Pressable>
        </ScrollView>
      </View>
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
});

export function ShiftDetailScreen() {
  const router = useRouter();

  return (
    <Screen>
      <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Pressable onPress={() => router.back()} style={{ padding: 4 }}>
              <Ionicons name="chevron-back" size={24} color="#1E293B" />
            </Pressable>
            <View>
               <Text style={{ fontSize: 20, fontWeight: '700', color: '#1E293B' }}>Chi tiết ca trực</Text>
               <Text style={{ fontSize: 13, color: '#64748B' }}>CA 1 - HÀNH CHÍNH (08:00 - 17:00)</Text>
            </View>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
             <Text style={{ fontSize: 14, fontWeight: '700', color: '#1E293B' }}>DANH SÁCH NHÂN SỰ (15)</Text>
             <Pressable style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 }}>
               <Ionicons name="add" size={16} color="#3B82F6" />
               <Text style={{ fontSize: 13, fontWeight: '600', color: '#3B82F6' }}>Thêm</Text>
             </Pressable>
          </View>

          {/* Employee Item 1 */}
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 12 }}>
             <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Image source={{ uri: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=150&q=80' }} style={{ width: 44, height: 44, borderRadius: 22 }} />
                  <View>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: '#1E293B', marginBottom: 2 }}>Trần Hoàng Nam</Text>
                    <Text style={{ fontSize: 12, color: '#64748B' }}>Kế toán viên</Text>
                  </View>
                </View>
             </View>
             
             <View style={{ flexDirection: 'row', gap: 12 }}>
                <Pressable style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#FEE2E2', backgroundColor: '#FEF2F2' }}>
                  <Ionicons name="trash-outline" size={16} color="#EF4444" />
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#EF4444' }}>Xóa khỏi ca</Text>
                </Pressable>
                <Pressable style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#E0F2FE', backgroundColor: '#EFF6FF' }}>
                  <Ionicons name="swap-horizontal" size={16} color="#3B82F6" />
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#3B82F6' }}>Đổi ca khác</Text>
                </Pressable>
             </View>
          </View>
          
          {/* Employee Item 2 */}
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 12 }}>
             <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Image source={{ uri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80' }} style={{ width: 44, height: 44, borderRadius: 22 }} />
                  <View>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: '#1E293B', marginBottom: 2 }}>Lê Thị Mai</Text>
                    <Text style={{ fontSize: 12, color: '#64748B' }}>Kế toán trưởng</Text>
                  </View>
                </View>
             </View>
             
             <View style={{ flexDirection: 'row', gap: 12 }}>
                <Pressable style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#FEE2E2', backgroundColor: '#FEF2F2' }}>
                  <Ionicons name="trash-outline" size={16} color="#EF4444" />
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#EF4444' }}>Xóa khỏi ca</Text>
                </Pressable>
                <Pressable style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#E0F2FE', backgroundColor: '#EFF6FF' }}>
                  <Ionicons name="swap-horizontal" size={16} color="#3B82F6" />
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#3B82F6' }}>Đổi ca khác</Text>
                </Pressable>
             </View>
          </View>
        </ScrollView>
      </View>
    </Screen>
  );
}
