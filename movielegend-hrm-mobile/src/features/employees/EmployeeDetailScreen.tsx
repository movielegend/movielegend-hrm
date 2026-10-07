import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { useEmployee, useUpdateEmployee, useDeleteEmployee } from '../../hooks/useEmployees';
import { useDepartments } from '../../hooks/useDepartments';
import { useAuth } from '../../providers/AuthProvider';
import { SelectModal, SelectOption } from '../../components/SelectModal';
import { CustomDatePickerModal } from '../../components/CustomDatePickerModal';
import { CustomAlert } from '../../components/CustomAlert';
import { LoadingState } from '../../components/LoadingState';
import { EmptyState } from '../../components/EmptyState';
import { maskPhone } from '../../utils/privacy';
import { formatSeniority } from '../../utils/seniority';
import { normalizeApiError } from '../../utils/api-error';

const editSchema = z.object({
  fullName: z.string().min(2, 'Vui lòng nhập họ và tên'),
  phone: z.string().min(8, 'Số điện thoại chưa hợp lệ'),
  email: z.string().email('Email chưa hợp lệ').optional().or(z.literal('')),
  departmentId: z.string().optional().or(z.literal('')),
  joinDate: z.string().optional().or(z.literal('')),
  accountStatus: z.enum(['ACTIVE', 'SUSPENDED']).default('ACTIVE'),
});

type EditFormValues = z.infer<typeof editSchema>;

function UserInitialAvatar({ name, size = 64 }: { name: string; size?: number }) {
  const initials = useMemo(() => {
    if (!name) return 'NV';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'NV';
    if (parts.length === 1) return (parts[0] || '').slice(0, 2).toUpperCase();
    const first = parts[0]?.[0] || '';
    const last = parts[parts.length - 1]?.[0] || '';
    return (first + last).toUpperCase() || 'NV';
  }, [name]);

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: '#DCFCE7',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Text style={{ color: '#166534', fontSize: 22, fontWeight: '900' }}>{initials}</Text>
    </View>
  );
}

export function EmployeeDetailScreen() {
  const router = useRouter();
  const { id, edit } = useLocalSearchParams<{ id: string; edit?: string }>();
  const { user } = useAuth();

  const employeeQuery = useEmployee(id);
  const updateEmployee = useUpdateEmployee(id);
  const deleteEmployee = useDeleteEmployee();
  const departmentsQuery = useDepartments({ limit: 100 });
  const departments = departmentsQuery.data?.items || [];

  const [isEditing, setIsEditing] = useState(edit === '1');
  const [deptModalVisible, setDeptModalVisible] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const emp = employeeQuery.data;

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    values: {
      fullName: emp?.profile?.fullName || '',
      phone: emp?.phone || '',
      email: emp?.email || '',
      departmentId:
        emp?.departmentLinks?.find(link => link.isPrimary)?.departmentId ||
        (emp as any)?.department?.id ||
        '',
      joinDate: emp?.profile?.joinDate
        ? new Date(emp.profile.joinDate).toISOString().split('T')[0]
        : '',
      accountStatus: (emp?.accountStatus === 'SUSPENDED' ? 'SUSPENDED' : 'ACTIVE') as any,
    },
  });

  const selectedDeptId = watch('departmentId');
  const selectedJoinDate = watch('joinDate');
  const selectedAccountStatus = watch('accountStatus');

  const deptOptions: SelectOption[] = departments.map(d => ({
    id: d.id,
    label: d.name,
    subtitle: d.code,
  }));

  const selectedDeptName = departments.find(d => d.id === selectedDeptId)?.name;
  const selectedDeptCode = departments.find(d => d.id === selectedDeptId)?.code;

  if (employeeQuery.isLoading) return <LoadingState />;
  if (!emp) return <EmptyState title="Không tìm thấy nhân viên" />;

  const name = emp.profile?.fullName || emp.userCode || 'Nhân viên';
  const userCode = emp.userCode || 'NV00000';
  const roleName = emp.roles?.some(r => r.role?.code === 'LEADER')
    ? 'Leader'
    : emp.profile?.position?.name || 'Nhân viên';
  const isActive = emp.accountStatus === 'ACTIVE';
  const deptName =
    emp.departmentLinks?.map(l => l.department?.name).filter(Boolean).join(', ') ||
    (emp as any).department?.name ||
    'Chưa xếp phòng';
  const branchName =
    emp.departmentLinks?.[0]?.department?.branch?.name ||
    (emp as any).department?.branch?.name ||
    'Hà Nội';
  const joinDateDisplay = emp.profile?.joinDate
    ? new Date(emp.profile.joinDate).toLocaleDateString('vi-VN')
    : '--/--/----';
  const seniorityStr = formatSeniority(emp.profile?.joinDate || emp.createdAt);
  const faceDataStr = emp.profile?.avatarUrl ? 'Đã có dữ liệu' : 'Chưa cập nhật';
  const cccdMasked = (emp as any).profile?.idCard ? `********${(emp as any).profile.idCard.slice(-4)}` : '********0136';

  const onSave = handleSubmit(async data => {
    try {
      await updateEmployee.mutateAsync({
        fullName: data.fullName.trim(),
        phone: data.phone.trim(),
        email: data.email?.trim() || undefined,
        departmentId: data.departmentId || undefined,
        accountStatus: data.accountStatus,
        joinDate: data.joinDate || undefined,
      });
      CustomAlert.alert('Thành công', 'Đã lưu thay đổi hồ sơ nhân viên');
      setIsEditing(false);
      void employeeQuery.refetch();
    } catch (err: any) {
      const apiErr = normalizeApiError(err);
      CustomAlert.alert('Lỗi cập nhật', apiErr.message);
    }
  });

  const handleDelete = () => {
    CustomAlert.alert('Xác nhận xóa', `Bạn có chắc chắn muốn xóa nhân viên ${name}?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa ngay',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteEmployee.mutateAsync(id);
            CustomAlert.alert('Thành công', 'Đã xóa nhân viên');
            router.back();
          } catch (e: any) {
            CustomAlert.alert('Lỗi', normalizeApiError(e).message);
          }
        },
      },
    ]);
  };

  // ================= VIEW MODE (Hồ sơ nhân viên) =================
  if (!isEditing) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* Brand Header */}
        <View style={styles.brandHeader}>
          <View style={styles.brandRow}>
            <Text style={styles.brandTitle}>movielegend</Text>
            <Text style={styles.brandSubtitle}>PEOPLE</Text>
          </View>
        </View>

        {/* Header Bar */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
            <Ionicons name="chevron-back" size={24} color="#0F172A" />
          </Pressable>
          <Text style={styles.title}>Hồ sơ nhân viên</Text>
          <Pressable onPress={() => setIsEditing(true)} hitSlop={8}>
            <Ionicons name="ellipsis-horizontal" size={22} color="#0F172A" />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Card 1: Avatar + Name + UserCode + Status Badge */}
          <View style={styles.profileHeroCard}>
            <UserInitialAvatar name={name} size={64} />
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={styles.heroName}>{name}</Text>
              <Text style={styles.heroCode}>{userCode}</Text>
              <View style={styles.heroActiveBadge}>
                <View style={[styles.dot, isActive ? styles.dotActive : styles.dotInactive]} />
                <Text style={styles.heroActiveText}>
                  {isActive ? 'Đang hoạt động' : 'Tạm khóa'}
                </Text>
              </View>
            </View>
          </View>

          {/* Card 2: Thông tin liên hệ */}
          <View style={styles.card}>
            <Text style={styles.cardSectionHeading}>Thông tin liên hệ</Text>

            {/* Phone */}
            <View style={styles.infoRow}>
              <View style={styles.infoIconWrap}>
                <Ionicons name="call-outline" size={18} color="#166534" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.infoLabel}>Số điện thoại</Text>
                <Text style={styles.infoValue}>{emp.phone ? maskPhone(emp.phone) : 'Chưa cập nhật'}</Text>
              </View>
            </View>

            <View style={styles.rowDivider} />

            {/* Email */}
            <View style={styles.infoRow}>
              <View style={styles.infoIconWrap}>
                <Ionicons name="mail-outline" size={18} color="#166534" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{emp.email || 'Chưa cập nhật'}</Text>
              </View>
            </View>

            <View style={styles.rowDivider} />

            {/* CCCD */}
            <View style={styles.infoRow}>
              <View style={styles.infoIconWrap}>
                <Ionicons name="card-outline" size={18} color="#166534" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.infoLabel}>CCCD</Text>
                <Text style={styles.infoValue}>{cccdMasked}</Text>
              </View>
            </View>
          </View>

          {/* Card 3: Công việc & vai trò */}
          <View style={styles.card}>
            <Text style={styles.cardSectionHeading}>Công việc & vai trò</Text>

            {/* Phòng ban */}
            <View style={styles.tableRow}>
              <View style={styles.tableLeft}>
                <View style={styles.infoIconWrap}>
                  <Ionicons name="business-outline" size={16} color="#166534" />
                </View>
                <Text style={styles.tableLabel}>Phòng ban</Text>
              </View>
              <Text style={styles.tableValue}>{deptName} • {branchName}</Text>
            </View>

            {/* Vị trí */}
            <View style={styles.tableRow}>
              <View style={styles.tableLeft}>
                <View style={styles.infoIconWrap}>
                  <Ionicons name="person-outline" size={16} color="#166534" />
                </View>
                <Text style={styles.tableLabel}>Vị trí</Text>
              </View>
              <Text style={styles.tableValue}>{emp.profile?.position?.name || 'Chưa cập nhật'}</Text>
            </View>

            {/* Phân quyền */}
            <View style={styles.tableRow}>
              <View style={styles.tableLeft}>
                <View style={styles.infoIconWrap}>
                  <Ionicons name="shield-checkmark-outline" size={16} color="#166534" />
                </View>
                <Text style={styles.tableLabel}>Phân quyền</Text>
              </View>
              <Text style={styles.tableValue}>{roleName}</Text>
            </View>

            {/* Ngày vào làm */}
            <View style={styles.tableRow}>
              <View style={styles.tableLeft}>
                <View style={styles.infoIconWrap}>
                  <Ionicons name="calendar-outline" size={16} color="#166534" />
                </View>
                <Text style={styles.tableLabel}>Ngày vào làm</Text>
              </View>
              <Text style={styles.tableValue}>{joinDateDisplay}</Text>
            </View>

            {/* Thâm niên */}
            <View style={styles.tableRow}>
              <View style={styles.tableLeft}>
                <View style={styles.infoIconWrap}>
                  <Ionicons name="time-outline" size={16} color="#166534" />
                </View>
                <Text style={styles.tableLabel}>Thâm niên</Text>
              </View>
              <Text style={[styles.tableValue, { color: '#166534', fontWeight: '800' }]}>
                {seniorityStr}
              </Text>
            </View>

            {/* Dữ liệu khuôn mặt */}
            <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
              <View style={styles.tableLeft}>
                <View style={styles.infoIconWrap}>
                  <Ionicons name="scan-outline" size={16} color="#166534" />
                </View>
                <Text style={styles.tableLabel}>Dữ liệu khuôn mặt</Text>
              </View>
              <Text style={styles.tableValue}>{faceDataStr}</Text>
            </View>
          </View>

          {/* Nút Xóa nhân sự text link */}
          <Pressable onPress={handleDelete} style={styles.deleteLinkRow} hitSlop={8}>
            <Ionicons name="trash-outline" size={16} color="#DC2626" />
            <Text style={styles.deleteLinkText}>Xóa nhân sự</Text>
          </Pressable>
        </ScrollView>

        {/* BOTTOM STICKY BUTTON: [ Chỉnh sửa hồ sơ ] */}
        <View style={styles.bottomBar}>
          <Pressable
            onPress={() => setIsEditing(true)}
            style={styles.ctaPrimaryBtn}
            android_ripple={{ color: 'rgba(255,255,255,0.1)' }}
          >
            <Ionicons name="pencil-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.ctaPrimaryBtnText}>Chỉnh sửa hồ sơ</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ================= EDIT MODE (Chỉnh sửa hồ sơ) =================
  const formattedJoinDateShort = selectedJoinDate
    ? (() => {
        const parts = selectedJoinDate.split('-');
        return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : selectedJoinDate;
      })()
    : 'Chọn ngày';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Brand Header */}
      <View style={styles.brandHeader}>
        <View style={styles.brandRow}>
          <Text style={styles.brandTitle}>movielegend</Text>
          <Text style={styles.brandSubtitle}>PEOPLE</Text>
        </View>
      </View>

      {/* Header Bar */}
      <View style={styles.header}>
        <Pressable onPress={() => setIsEditing(false)} style={styles.backBtn} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color="#0F172A" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Chỉnh sửa hồ sơ</Text>
          <Text style={styles.subtitle}>{name} • {userCode}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* CARD 1: Thông tin cơ bản */}
        <View style={styles.card}>
          <Text style={styles.cardSectionHeading}>Thông tin cơ bản</Text>

          {/* Họ và tên */}
          <Text style={styles.fieldLabel}>Họ và tên</Text>
          <Controller
            control={control}
            name="fullName"
            render={({ field: { value, onChange } }) => (
              <View style={[styles.inputBox, errors.fullName && styles.inputBoxError]}>
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  placeholder="Nhập họ và tên"
                  placeholderTextColor="#94A3B8"
                  style={styles.textInput}
                />
              </View>
            )}
          />
          {errors.fullName && <Text style={styles.errorText}>{errors.fullName.message}</Text>}

          {/* Số điện thoại */}
          <Text style={styles.fieldLabel}>Số điện thoại</Text>
          <Controller
            control={control}
            name="phone"
            render={({ field: { value, onChange } }) => (
              <View style={[styles.inputBox, errors.phone && styles.inputBoxError]}>
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  placeholder="Nhập số điện thoại"
                  placeholderTextColor="#94A3B8"
                  keyboardType="phone-pad"
                  style={styles.textInput}
                />
              </View>
            )}
          />
          {errors.phone && <Text style={styles.errorText}>{errors.phone.message}</Text>}

          {/* Email */}
          <Text style={styles.fieldLabel}>Email</Text>
          <Controller
            control={control}
            name="email"
            render={({ field: { value, onChange } }) => (
              <View style={[styles.inputBox, errors.email && styles.inputBoxError]}>
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  placeholder="Nhập email"
                  placeholderTextColor="#94A3B8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.textInput}
                />
              </View>
            )}
          />
          {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}
        </View>

        {/* CARD 2: Thông tin công việc */}
        <View style={styles.card}>
          <Text style={styles.cardSectionHeading}>Thông tin công việc</Text>

          {/* Phòng ban */}
          <View style={styles.labelWithOptionalRow}>
            <Text style={styles.fieldLabel}>Phòng ban</Text>
            <Text style={styles.optionalText}>Tùy chọn</Text>
          </View>
          <Pressable style={styles.selectPill} onPress={() => setDeptModalVisible(true)}>
            <View style={styles.selectLeft}>
              <View style={styles.infoIconWrap}>
                <Ionicons name="business-outline" size={18} color="#166534" />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.selectText}>{selectedDeptName || 'Chưa xếp phòng'}</Text>
                {selectedDeptCode && <Text style={styles.selectSubText}>{selectedDeptCode}</Text>}
              </View>
            </View>
            <Ionicons name="chevron-down" size={16} color="#64748B" />
          </Pressable>

          {/* Ngày bắt đầu làm việc */}
          <View style={styles.labelWithOptionalRow}>
            <Text style={styles.fieldLabel}>Ngày bắt đầu làm việc</Text>
            {selectedJoinDate ? (
              <Pressable onPress={() => setValue('joinDate', '', { shouldValidate: true })}>
                <Text style={styles.deleteLinkTextSmall}>Xóa ngày</Text>
              </Pressable>
            ) : null}
          </View>
          <Pressable style={styles.selectPill} onPress={() => setShowDatePicker(true)}>
            <View style={styles.selectLeft}>
              <Ionicons name="calendar-outline" size={18} color="#166534" />
              <Text style={[styles.selectText, { marginLeft: 10 }]}>{formattedJoinDateShort}</Text>
            </View>
            <Ionicons name="chevron-down" size={16} color="#64748B" />
          </Pressable>
          <Text style={styles.fieldNote}>
            {selectedJoinDate ? `Thâm niên: ${formatSeniority(selectedJoinDate)}` : 'Nếu để trống, tính theo ngày tạo tài khoản.'}
          </Text>
        </View>

        {/* CARD 3: Trạng thái tài khoản */}
        <View style={styles.card}>
          <Text style={styles.cardSectionHeading}>Trạng thái tài khoản</Text>
          <View style={styles.statusToggleRow}>
            <Pressable
              onPress={() => setValue('accountStatus', 'ACTIVE', { shouldValidate: true })}
              style={[
                styles.statusToggleBtn,
                selectedAccountStatus === 'ACTIVE' && styles.statusToggleBtnActive,
              ]}
            >
              <Ionicons
                name="checkmark-circle"
                size={18}
                color={selectedAccountStatus === 'ACTIVE' ? '#166534' : '#94A3B8'}
              />
              <Text
                style={[
                  styles.statusToggleText,
                  selectedAccountStatus === 'ACTIVE' && styles.statusToggleTextActive,
                ]}
              >
                Hoạt động
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setValue('accountStatus', 'SUSPENDED', { shouldValidate: true })}
              style={[
                styles.statusToggleBtn,
                selectedAccountStatus === 'SUSPENDED' && styles.statusToggleBtnSuspended,
              ]}
            >
              <Ionicons
                name="pause-circle-outline"
                size={18}
                color={selectedAccountStatus === 'SUSPENDED' ? '#DC2626' : '#94A3B8'}
              />
              <Text
                style={[
                  styles.statusToggleText,
                  selectedAccountStatus === 'SUSPENDED' && styles.statusToggleTextSuspended,
                ]}
              >
                Tạm khóa
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* BOTTOM ACTION BUTTONS: [ Hủy ]  [ Lưu thay đổi ] */}
      <View style={styles.bottomBar}>
        <Pressable onPress={() => setIsEditing(false)} style={styles.cancelBtn}>
          <Text style={styles.cancelBtnText}>Hủy</Text>
        </Pressable>
        <Pressable
          onPress={() => void onSave()}
          disabled={updateEmployee.isPending}
          style={[styles.ctaPrimaryBtn, updateEmployee.isPending && { opacity: 0.7 }]}
          android_ripple={{ color: 'rgba(255,255,255,0.1)' }}
        >
          {updateEmployee.isPending ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.ctaPrimaryBtnText}>Lưu thay đổi</Text>
          )}
        </Pressable>
      </View>

      {/* Select Department Modal */}
      <SelectModal
        visible={deptModalVisible}
        title="Chọn phòng ban"
        options={deptOptions}
        selectedValue={selectedDeptId}
        onSelect={opt => setValue('departmentId', opt.id || '', { shouldValidate: true })}
        onClose={() => setDeptModalVisible(false)}
      />

      {/* Date Picker Modal */}
      {showDatePicker && (
        <CustomDatePickerModal
          visible={true}
          initialDate={selectedJoinDate ? new Date(selectedJoinDate) : new Date()}
          onClose={() => setShowDatePicker(false)}
          onSelect={d => {
            setShowDatePicker(false);
            const isoStr = d.toISOString().split('T')[0];
            setValue('joinDate', isoStr, { shouldValidate: true });
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAF8',
  },
  brandHeader: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#132E22',
    letterSpacing: -0.3,
  },
  brandSubtitle: {
    fontSize: 9,
    fontWeight: '800',
    color: '#16A34A',
    letterSpacing: 1.5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  backBtn: {
    padding: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 110,
    gap: 14,
  },
  profileHeroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  heroName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  heroCode: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 6,
  },
  heroActiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: '#22C55E',
  },
  dotInactive: {
    backgroundColor: '#EF4444',
  },
  heroActiveText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#166534',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  cardSectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  infoIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  rowDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 8,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  tableLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tableLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  tableValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'right',
  },
  deleteLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  deleteLinkText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
  },
  deleteLinkTextSmall: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    flexDirection: 'row',
    gap: 12,
  },
  ctaPrimaryBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#1B382B', // Dark forest green
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1B382B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  ctaPrimaryBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#475569',
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
    marginTop: 8,
  },
  labelWithOptionalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 6,
  },
  optionalText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  inputBox: {
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  inputBoxError: {
    borderColor: '#EF4444',
  },
  textInput: {
    fontSize: 14,
    color: '#0F172A',
    padding: 0,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
    marginLeft: 2,
  },
  selectPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  selectLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  selectText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  selectSubText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  fieldNote: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 6,
  },
  statusToggleRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  statusToggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statusToggleBtnActive: {
    backgroundColor: '#DCFCE7',
    borderColor: '#166534',
  },
  statusToggleBtnSuspended: {
    backgroundColor: '#FEE2E2',
    borderColor: '#DC2626',
  },
  statusToggleText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  statusToggleTextActive: {
    color: '#166534',
  },
  statusToggleTextSuspended: {
    color: '#DC2626',
  },
});
