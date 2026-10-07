import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { useCreateEmployee } from '../../hooks/useEmployees';
import { useDepartments } from '../../hooks/useDepartments';
import { SelectModal, SelectOption } from '../../components/SelectModal';
import { CustomAlert } from '../../components/CustomAlert';
import { normalizeApiError } from '../../utils/api-error';

const createSchema = z.object({
  fullName: z.string().min(2, 'Vui lòng nhập họ và tên'),
  phone: z.string().min(8, 'Số điện thoại chưa hợp lệ'),
  email: z.string().email('Email chưa hợp lệ').optional().or(z.literal('')),
  password: z.string().min(6, 'Mật khẩu phải từ 6 ký tự'),
  departmentId: z.string().optional().or(z.literal('')),
});

type FormValues = z.infer<typeof createSchema>;

export function CreateEmployeeScreen() {
  const router = useRouter();
  const { departmentId: fixedDepartmentId } = useLocalSearchParams<{ departmentId?: string }>();
  const createEmployee = useCreateEmployee();
  const departmentsQuery = useDepartments({ limit: 100 });
  const departments = departmentsQuery.data?.items || [];

  const [deptModalVisible, setDeptModalVisible] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      fullName: '',
      phone: '',
      email: '',
      password: '',
      departmentId: fixedDepartmentId || '',
    },
  });

  const selectedDepartmentId = watch('departmentId');
  const selectedDeptName = departments.find(d => d.id === selectedDepartmentId)?.name;

  const deptOptions: SelectOption[] = departments.map(d => ({
    id: d.id,
    label: d.name,
    subtitle: d.code,
  }));

  const onSubmit = handleSubmit(async data => {
    try {
      const payload = {
        fullName: data.fullName.trim(),
        phone: data.phone.trim(),
        password: data.password,
        ...(data.email?.trim() ? { email: data.email.trim() } : {}),
        ...(data.departmentId ? { departmentId: data.departmentId } : {}),
      };
      await createEmployee.mutateAsync(payload);
      CustomAlert.alert('Thành công', 'Đã thêm nhân viên mới', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      const apiErr = normalizeApiError(err);
      CustomAlert.alert('Lỗi tạo nhân viên', apiErr.message);
    }
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* 1. Header (Brand: movielegend PEOPLE + Title + Subtitle) */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
            <Ionicons name="arrow-back" size={24} color="#0F172A" />
          </Pressable>
          <View style={styles.brandRow}>
            <Text style={styles.brandTitle}>movielegend</Text>
            <Text style={styles.brandSubtitle}>PEOPLE</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>

        <Text style={styles.title}>Thêm nhân viên</Text>
        <Text style={styles.subtitle}>Tạo tài khoản và hồ sơ nhân sự</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* CARD 1: Thông tin tài khoản */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconCircle}>
              <Ionicons name="person" size={16} color="#166534" />
            </View>
            <Text style={styles.cardTitle}>Thông tin tài khoản</Text>
          </View>

          {/* Họ và tên * */}
          <Text style={styles.fieldLabel}>
            Họ và tên <Text style={styles.reqStar}>*</Text>
          </Text>
          <Controller
            control={control}
            name="fullName"
            render={({ field: { value, onChange } }) => (
              <View style={[styles.inputBox, errors.fullName && styles.inputBoxError]}>
                <TextInput
                  placeholder="Nhập họ và tên"
                  placeholderTextColor="#94A3B8"
                  value={value}
                  onChangeText={onChange}
                  style={styles.textInput}
                />
              </View>
            )}
          />
          {errors.fullName && <Text style={styles.errorText}>{errors.fullName.message}</Text>}

          {/* Số điện thoại * */}
          <Text style={styles.fieldLabel}>
            Số điện thoại <Text style={styles.reqStar}>*</Text>
          </Text>
          <Controller
            control={control}
            name="phone"
            render={({ field: { value, onChange } }) => (
              <View style={[styles.inputBox, errors.phone && styles.inputBoxError]}>
                <TextInput
                  placeholder="Nhập số điện thoại"
                  placeholderTextColor="#94A3B8"
                  value={value}
                  onChangeText={onChange}
                  keyboardType="phone-pad"
                  style={styles.textInput}
                />
              </View>
            )}
          />
          {errors.phone && <Text style={styles.errorText}>{errors.phone.message}</Text>}

          {/* Email (Tùy chọn) */}
          <View style={styles.labelWithOptionalRow}>
            <Text style={styles.fieldLabel}>Email</Text>
            <Text style={styles.optionalText}>Tùy chọn</Text>
          </View>
          <Controller
            control={control}
            name="email"
            render={({ field: { value, onChange } }) => (
              <View style={[styles.inputBox, errors.email && styles.inputBoxError]}>
                <TextInput
                  placeholder="Nhập email"
                  placeholderTextColor="#94A3B8"
                  value={value}
                  onChangeText={onChange}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.textInput}
                />
              </View>
            )}
          />
          {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}

          {/* Mật khẩu khởi tạo * */}
          <Text style={styles.fieldLabel}>
            Mật khẩu khởi tạo <Text style={styles.reqStar}>*</Text>
          </Text>
          <Controller
            control={control}
            name="password"
            render={({ field: { value, onChange } }) => (
              <View style={[styles.inputBox, errors.password && styles.inputBoxError]}>
                <TextInput
                  placeholder="Nhập mật khẩu"
                  placeholderTextColor="#94A3B8"
                  value={value}
                  onChangeText={onChange}
                  secureTextEntry={!showPassword}
                  style={[styles.textInput, { flex: 1 }]}
                />
                <Pressable onPress={() => setShowPassword(p => !p)} hitSlop={8}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#64748B"
                  />
                </Pressable>
              </View>
            )}
          />
          {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}
        </View>

        {/* CARD 2: Thông tin công việc */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconCircle}>
              <Ionicons name="business" size={16} color="#166534" />
            </View>
            <Text style={styles.cardTitle}>Thông tin công việc</Text>
          </View>

          {/* Phòng ban */}
          <View style={styles.labelWithOptionalRow}>
            <Text style={styles.fieldLabel}>Phòng ban</Text>
            <Text style={styles.optionalText}>Tùy chọn</Text>
          </View>
          <Pressable
            style={styles.selectPill}
            onPress={() => setDeptModalVisible(true)}
            disabled={!!fixedDepartmentId}
          >
            <View style={styles.selectLeft}>
              <Ionicons name="business-outline" size={18} color="#166534" />
              <Text
                style={[
                  styles.selectText,
                  !selectedDeptName && styles.placeholderText,
                ]}
                numberOfLines={1}
              >
                {selectedDeptName || 'Chọn phòng ban'}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={16} color="#64748B" />
          </Pressable>
          <Text style={styles.fieldNote}>Tìm và chọn phòng ban từ danh sách.</Text>
        </View>

        <Text style={styles.bottomFootnote}>* Thông tin bắt buộc</Text>
      </ScrollView>

      {/* BOTTOM ACTION BUTTONS: [ Hủy ]  [ Tạo nhân viên ] */}
      <View style={styles.bottomBar}>
        <Pressable onPress={() => router.back()} style={styles.cancelBtn}>
          <Text style={styles.cancelBtnText}>Hủy</Text>
        </Pressable>
        <Pressable
          onPress={() => void onSubmit()}
          disabled={createEmployee.isPending}
          style={[styles.createBtn, createEmployee.isPending && { opacity: 0.7 }]}
          android_ripple={{ color: 'rgba(255,255,255,0.1)' }}
        >
          {createEmployee.isPending ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.createBtnText}>Tạo nhân viên</Text>
          )}
        </Pressable>
      </View>

      {/* Select Department Modal */}
      <SelectModal
        visible={deptModalVisible}
        title="Chọn phòng ban"
        options={deptOptions}
        selectedValue={selectedDepartmentId}
        onSelect={opt => setValue('departmentId', opt.id || '', { shouldValidate: true })}
        onClose={() => setDeptModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAF8',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  backBtn: {
    padding: 4,
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
  title: {
    fontSize: 24,
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
    paddingBottom: 100,
    gap: 14,
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
    marginTop: 8,
  },
  reqStar: {
    color: '#DC2626',
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
    flexDirection: 'row',
    alignItems: 'center',
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
    flex: 1,
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
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  selectText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  placeholderText: {
    color: '#94A3B8',
    fontWeight: '400',
  },
  fieldNote: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 6,
  },
  bottomFootnote: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'right',
    marginTop: 2,
    paddingRight: 4,
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
  createBtn: {
    flex: 1.6,
    backgroundColor: '#1B382B', // Deep forest green matching template
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1B382B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  createBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
