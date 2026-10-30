import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useRef, useState, useMemo, useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { 
  Image, 
  Pressable, 
  StyleSheet, 
  Text, 
  View, 
  Platform, 
  ScrollView,
  Keyboard,
  KeyboardAvoidingView,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { registerEmployee, checkAccountAvailability } from '../../api/registration.api';
import { uploadFile } from '../../api/uploads.api';
import { PrimaryButton, SecondaryButton } from '../../components/Buttons';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { FormField } from '../../components/FormField';
import { VietnameseDatePickerModal } from '../../components/VietnameseDatePickerModal';
import { LoadingState } from '../../components/LoadingState';
import { PageHeader } from '../../components/PageHeader';
import { Screen } from '../../components/Screen';
import { ScreenContainer } from '../../components/ScreenContainer';
import { SearchInput } from '../../components/SearchInput';
import { SectionCard } from '../../components/SectionCard';
import { StatusBadge } from '../../components/StatusBadge';
import { usePublicDepartments } from '../../hooks/useDepartments';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import type { Department } from '../../types/department.types';
import type { FaceImageInput, FacePose, RegisterPayload, RegistrationFormValues } from '../../types/registration.types';
import { mapLoginError, normalizeApiError } from '../../utils/api-error';
import { accountSchema, departmentSchema, faceSchema, profileSchema } from './registration.schema';
import { facePoseLabels, useRegistration } from './RegistrationProvider';

type AccountStepValues = z.infer<typeof accountSchema>;
type ProfileStepValues = Pick<RegistrationFormValues, 'idCardNumber' | 'dateOfBirth' | 'gender' | 'joinDate'>;
type DepartmentStepValues = Pick<RegistrationFormValues, 'requestedDepartmentId'>;

export function RegistrationIntroScreen() {
  const router = useRouter();

  const steps = [
    {
      num: '01',
      title: 'Thông tin tài khoản',
      desc: 'Thông tin dùng để đăng nhập.',
    },
    {
      num: '02',
      title: 'Hồ sơ cá nhân',
      desc: 'Bổ sung thông tin cá nhân.',
    },
    {
      num: '03',
      title: 'Chọn phòng ban',
      desc: 'Xác định đơn vị làm việc.',
    },
    {
      num: '04',
      title: 'Kiểm tra và gửi',
      desc: 'Rà soát trước khi hoàn tất.',
    },
  ];

  return (
    <Screen backgroundColor="#F8FAFC" withBottomInset={true}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 24,
          paddingTop: 12,
          paddingBottom: 28,
          alignItems: 'center',
        }}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Header Branding */}
        <View style={{ alignItems: 'center', width: '100%', marginBottom: 20 }}>
          <Image
            source={require('../../../assets/ml-logo-only.png')}
            style={{ width: 92, height: 40, marginBottom: 8 }}
            resizeMode="contain"
          />
          <Text style={{ fontSize: 16, fontWeight: '800', color: '#0F172A', letterSpacing: 2, textAlign: 'center' }}>
            MOVIE LEGEND
          </Text>
          <View style={{ width: '100%', height: 1, backgroundColor: '#E2E8F0', marginTop: 22, marginBottom: 8 }} />
        </View>

        {/* Pill Badge */}
        <View style={{ backgroundColor: '#E8EFF5', paddingHorizontal: 16, paddingVertical: 5, borderRadius: 20, marginBottom: 14 }}>
          <Text style={{ fontSize: 13, fontWeight: '500', color: '#25507B' }}>
            Dành cho thành viên mới
          </Text>
        </View>

        {/* Heading */}
        <Text style={{ fontSize: 32, fontWeight: '800', color: '#0F172A', textAlign: 'center', marginBottom: 8 }}>
          Tạo tài khoản
        </Text>
        <Text style={{ fontSize: 14, color: '#64748B', textAlign: 'center', marginBottom: 24, lineHeight: 20 }}>
          Hoàn tất đăng ký qua 4 bước đơn giản.
        </Text>

        {/* Steps Card */}
        <View
          style={{
            width: '100%',
            backgroundColor: '#FFFFFF',
            borderRadius: 12,
            borderWidth: 1,
            borderColor: '#E2E8F0',
            paddingHorizontal: 20,
            paddingVertical: 4,
          }}
        >
          {steps.map((s, idx) => (
            <View key={s.num}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 14 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#0F172A', width: 34, marginTop: 1 }}>
                  {s.num}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: '#0F172A' }}>
                    {s.title}
                  </Text>
                  <Text style={{ fontSize: 13, color: '#64748B', marginTop: 3 }}>
                    {s.desc}
                  </Text>
                </View>
              </View>
              {idx < steps.length - 1 && (
                <View style={{ width: '100%', height: 1, backgroundColor: '#F1F5F9' }} />
              )}
            </View>
          ))}
        </View>

        {/* Primary Button */}
        <Pressable
          onPress={() => router.push('/register/account')}
          style={{
            width: '100%',
            backgroundColor: '#0F2231',
            height: 50,
            borderRadius: 10,
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 24,
          }}
        >
          <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>
            Bắt đầu đăng ký
          </Text>
        </Pressable>

        {/* Has account link */}
        <View style={{ flexDirection: 'row', marginTop: 20, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 14, color: '#64748B', fontWeight: '400' }}>
            Đã có tài khoản?{' '}
          </Text>
          <Pressable onPress={() => router.replace('/login')} hitSlop={8}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#0F2231' }}>
              Đăng nhập.
            </Text>
          </Pressable>
        </View>

        {/* Footer */}
        <Text style={{ marginTop: 36, marginBottom: 16, fontSize: 11, fontWeight: '600', color: '#94A3B8', letterSpacing: 1.5, textAlign: 'center' }}>
          MOVIE LEGEND  ·  ML GROUP
        </Text>
      </ScrollView>
    </Screen>
  );
}

export function RegistrationAccountScreen() {
  const router = useRouter();
  const { values, update } = useRegistration();
  const [checking, setChecking] = useState(false);
  const [duplicateError, setDuplicateError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<AccountStepValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      fullName: values.fullName,
      phone: values.phone,
      email: values.email,
      password: values.password,
      confirmPassword: values.confirmPassword,
    },
  });

  const submit = handleSubmit(async (data) => {
    Keyboard.dismiss();
    setDuplicateError(null);
    setChecking(true);

    try {
      const checkRes = await checkAccountAvailability({
        phone: data.phone,
        email: data.email,
      });

      if (!checkRes.isAvailable) {
        if (checkRes.phoneDuplicate) {
          setError('phone', {
            type: 'manual',
            message: 'Số điện thoại này đã được đăng ký trên hệ thống. Vui lòng nhập số khác.',
          });
        }
        if (checkRes.emailDuplicate) {
          setError('email', {
            type: 'manual',
            message: 'Email này đã được đăng ký trên hệ thống. Vui lòng nhập email khác.',
          });
        }
        setDuplicateError(
          checkRes.message || 'Thông tin đã tồn tại trên hệ thống. Vui lòng kiểm tra và nhập lại!'
        );
        return;
      }

      // Thông tin hợp lệ -> chuyển sang bước 2
      update(data);
      router.push('/register/personal');
    } catch (err: any) {
      // Nếu có lỗi mạng bất ngờ, vẫn cho qua bước tiếp theo
      update(data);
      router.push('/register/personal');
    } finally {
      setChecking(false);
    }
  });

  const handleCheckPhoneBlur = async (phoneVal?: string) => {
    if (!phoneVal || phoneVal.length < 10) return;
    try {
      const res = await checkAccountAvailability({ phone: phoneVal });
      if (res.phoneDuplicate) {
        setError('phone', {
          type: 'manual',
          message: 'Số điện thoại này đã được đăng ký trên hệ thống. Vui lòng nhập số khác.',
        });
        setDuplicateError('Số điện thoại này đã được đăng ký trên hệ thống. Vui lòng kiểm tra lại!');
      }
    } catch (_) {}
  };

  const handleCheckEmailBlur = async (emailVal?: string) => {
    if (!emailVal || !emailVal.includes('@')) return;
    try {
      const res = await checkAccountAvailability({ email: emailVal });
      if (res.emailDuplicate) {
        setError('email', {
          type: 'manual',
          message: 'Email này đã được đăng ký trên hệ thống. Vui lòng nhập email khác.',
        });
        setDuplicateError('Email này đã được đăng ký trên hệ thống. Vui lòng nhập email khác!');
      }
    } catch (_) {}
  };

  const [securePass, setSecurePass] = useState(true);
  const [secureConfirmPass, setSecureConfirmPass] = useState(true);

  return (
    <Screen backgroundColor="#F8FAFC" withBottomInset={true}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 24,
          paddingTop: 12,
          paddingBottom: 28,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header Branding */}
        <View style={{ alignItems: 'center', width: '100%', marginBottom: 12 }}>
          <Image
            source={require('../../../assets/ml-logo-only.png')}
            style={{ width: 92, height: 40, marginBottom: 8 }}
            resizeMode="contain"
          />
          <Text style={{ fontSize: 16, fontWeight: '800', color: '#0F172A', letterSpacing: 2, textAlign: 'center' }}>
            MOVIE LEGEND
          </Text>
          <View style={{ width: '100%', height: 1, backgroundColor: '#E2E8F0', marginTop: 22 }} />
        </View>

        {/* Back button */}
        <Pressable onPress={() => router.back()} hitSlop={10} style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, marginVertical: 12 }}>
          <Ionicons name="arrow-back" size={18} color="#0F172A" />
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#0F172A' }}>Quay lại</Text>
        </Pressable>

        {/* Title & Step */}
        <Text style={{ fontSize: 28, fontWeight: '800', color: '#0F172A', textAlign: 'center', marginTop: 4 }}>
          Thông tin tài khoản
        </Text>
        <Text style={{ fontSize: 14, color: '#64748B', textAlign: 'center', marginTop: 4, marginBottom: 4 }}>
          Bước 1 / 4
        </Text>

        <StepBar currentStep={1} />

        {duplicateError ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              backgroundColor: '#FEF2F2',
              borderWidth: 1,
              borderColor: '#FCA5A5',
              borderRadius: 10,
              padding: 12,
              marginBottom: 14,
            }}
          >
            <Ionicons name="alert-circle" size={20} color="#DC2626" />
            <Text style={{ flex: 1, fontSize: 13, fontWeight: '500', color: '#B91C1C' }}>
              {duplicateError}
            </Text>
          </View>
        ) : null}

        {/* Form Fields */}
        <View style={{ gap: 14 }}>
          {/* Họ và tên */}
          <View>
            <Controller
              control={control}
              name="fullName"
              render={({ field }) => (
                <View style={{ height: 50, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: errors.fullName ? '#EF4444' : '#E2E8F0', borderRadius: 10, paddingHorizontal: 16, justifyContent: 'center' }}>
                  <TextInput
                    placeholder="Nhập họ và tên"
                    placeholderTextColor="#64748B"
                    value={field.value}
                    onChangeText={field.onChange}
                    style={{ fontSize: 15, color: '#0F172A', paddingVertical: 0 }}
                  />
                </View>
              )}
            />
            {errors.fullName ? <Text style={{ color: '#EF4444', fontSize: 12, marginTop: 4, marginLeft: 4 }}>{errors.fullName.message}</Text> : null}
          </View>

          {/* Số điện thoại */}
          <View>
            <Controller
              control={control}
              name="phone"
              render={({ field }) => (
                <View style={{ height: 50, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: errors.phone ? '#EF4444' : '#E2E8F0', borderRadius: 10, paddingHorizontal: 16, justifyContent: 'center' }}>
                  <TextInput
                    keyboardType="phone-pad"
                    maxLength={10}
                    placeholder="Nhập số điện thoại"
                    placeholderTextColor="#64748B"
                    value={field.value}
                    onChangeText={(val) => {
                      if (duplicateError) setDuplicateError(null);
                      clearErrors('phone');
                      field.onChange(val.replace(/\D/g, '').slice(0, 10));
                    }}
                    onBlur={() => handleCheckPhoneBlur(field.value || '')}
                    style={{ fontSize: 15, color: '#0F172A', paddingVertical: 0 }}
                  />
                </View>
              )}
            />
            {errors.phone ? <Text style={{ color: '#EF4444', fontSize: 12, marginTop: 4, marginLeft: 4 }}>{errors.phone.message}</Text> : null}
          </View>

          {/* Email */}
          <View>
            <Controller
              control={control}
              name="email"
              render={({ field }) => (
                <View style={{ height: 50, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: errors.email ? '#EF4444' : '#E2E8F0', borderRadius: 10, paddingHorizontal: 16, justifyContent: 'center' }}>
                  <TextInput
                    autoCapitalize="none"
                    keyboardType="email-address"
                    placeholder="Nhập email"
                    placeholderTextColor="#64748B"
                    value={field.value}
                    onChangeText={(val) => {
                      if (duplicateError) setDuplicateError(null);
                      clearErrors('email');
                      field.onChange(val);
                    }}
                    onBlur={() => handleCheckEmailBlur(field.value || '')}
                    style={{ fontSize: 15, color: '#0F172A', paddingVertical: 0 }}
                  />
                </View>
              )}
            />
            {errors.email ? <Text style={{ color: '#EF4444', fontSize: 12, marginTop: 4, marginLeft: 4 }}>{errors.email.message}</Text> : null}
          </View>

          {/* Mật khẩu */}
          <View>
            <Controller
              control={control}
              name="password"
              render={({ field }) => (
                <View style={{ height: 50, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: errors.password ? '#EF4444' : '#E2E8F0', borderRadius: 10, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' }}>
                  <TextInput
                    autoCapitalize="none"
                    secureTextEntry={securePass}
                    placeholder="Nhập mật khẩu"
                    placeholderTextColor="#64748B"
                    value={field.value}
                    onChangeText={field.onChange}
                    style={{ flex: 1, fontSize: 15, color: '#0F172A', paddingVertical: 0 }}
                  />
                  <Pressable onPress={() => setSecurePass(!securePass)} hitSlop={10} style={{ paddingLeft: 10, paddingVertical: 4 }}>
                    <Text style={{ fontSize: 14, fontWeight: '500', color: '#0284C7' }}>{securePass ? 'Hiện' : 'Ẩn'}</Text>
                  </Pressable>
                </View>
              )}
            />
            {errors.password ? <Text style={{ color: '#EF4444', fontSize: 12, marginTop: 4, marginLeft: 4 }}>{errors.password.message}</Text> : null}
          </View>

          {/* Xác nhận mật khẩu */}
          <View>
            <Controller
              control={control}
              name="confirmPassword"
              render={({ field }) => (
                <View style={{ height: 50, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: errors.confirmPassword ? '#EF4444' : '#E2E8F0', borderRadius: 10, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' }}>
                  <TextInput
                    autoCapitalize="none"
                    secureTextEntry={secureConfirmPass}
                    placeholder="Xác nhận mật khẩu"
                    placeholderTextColor="#64748B"
                    value={field.value}
                    onChangeText={field.onChange}
                    style={{ flex: 1, fontSize: 15, color: '#0F172A', paddingVertical: 0 }}
                  />
                  <Pressable onPress={() => setSecureConfirmPass(!secureConfirmPass)} hitSlop={10} style={{ paddingLeft: 10, paddingVertical: 4 }}>
                    <Text style={{ fontSize: 14, fontWeight: '500', color: '#0284C7' }}>{secureConfirmPass ? 'Hiện' : 'Ẩn'}</Text>
                  </Pressable>
                </View>
              )}
            />
            {errors.confirmPassword ? <Text style={{ color: '#EF4444', fontSize: 12, marginTop: 4, marginLeft: 4 }}>{errors.confirmPassword.message}</Text> : null}
          </View>

          {/* Tiếp tục Button */}
          <Pressable
            onPress={() => void submit()}
            disabled={checking}
            style={{
              backgroundColor: checking ? '#475569' : '#0F2231',
              height: 50,
              borderRadius: 10,
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 10,
            }}
          >
            {checking ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>Tiếp tục</Text>
            )}
          </Pressable>
        </View>

        {/* Footer */}
        <Text style={{ marginTop: 36, marginBottom: 16, fontSize: 11, fontWeight: '600', color: '#94A3B8', letterSpacing: 1.5, textAlign: 'center' }}>
          MOVIE LEGEND  ·  ML GROUP
        </Text>
      </ScrollView>
    </Screen>
  );
}

export function RegistrationPersonalScreen() {
  const router = useRouter();
  const { values, update } = useRegistration();
  const [checking, setChecking] = useState(false);
  const [duplicateError, setDuplicateError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors },
    watch,
    setValue,
  } = useForm<ProfileStepValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      idCardNumber: values.idCardNumber,
      dateOfBirth: values.dateOfBirth,
      gender: values.gender,
      joinDate: values.joinDate || '',
    },
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showJoinDatePicker, setShowJoinDatePicker] = useState(false);
  const dob = watch('dateOfBirth');
  const gender = watch('gender');
  const joinDate = watch('joinDate');

  const submit = handleSubmit(async (data) => {
    Keyboard.dismiss();
    setDuplicateError(null);
    setChecking(true);

    try {
      if (data.idCardNumber) {
        const checkRes = await checkAccountAvailability({
          idCardNumber: data.idCardNumber,
        });

        if (checkRes.idCardDuplicate) {
          setError('idCardNumber', {
            type: 'manual',
            message: 'Số CCCD/CMND này đã được đăng ký trên hệ thống. Vui lòng kiểm tra lại.',
          });
          setDuplicateError('Số CCCD/CMND này đã tồn tại trên hệ thống. Vui lòng kiểm tra và nhập lại!');
          return;
        }
      }

      update(data);
      router.push('/register/department');
    } catch (err: any) {
      update(data);
      router.push('/register/department');
    } finally {
      setChecking(false);
    }
  });

  const handleCheckIdCardBlur = async (idCardVal?: string) => {
    if (!idCardVal || idCardVal.length < 9) return;
    try {
      const res = await checkAccountAvailability({ idCardNumber: idCardVal });
      if (res.idCardDuplicate) {
        setError('idCardNumber', {
          type: 'manual',
          message: 'Số CCCD/CMND này đã được đăng ký trên hệ thống. Vui lòng kiểm tra lại.',
        });
        setDuplicateError('Số CCCD/CMND này đã tồn tại trên hệ thống. Vui lòng kiểm tra và nhập lại!');
      }
    } catch (_) {}
  };

  return (
    <Screen backgroundColor="#F8FAFC" withBottomInset={true}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 24,
          paddingTop: 12,
          paddingBottom: 28,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header Branding */}
        <View style={{ alignItems: 'center', width: '100%', marginBottom: 12 }}>
          <Image
            source={require('../../../assets/ml-logo-only.png')}
            style={{ width: 92, height: 40, marginBottom: 8 }}
            resizeMode="contain"
          />
          <Text style={{ fontSize: 16, fontWeight: '800', color: '#0F172A', letterSpacing: 2, textAlign: 'center' }}>
            MOVIE LEGEND
          </Text>
          <View style={{ width: '100%', height: 1, backgroundColor: '#E2E8F0', marginTop: 22 }} />
        </View>

        {/* Back button */}
        <Pressable onPress={() => router.back()} hitSlop={10} style={{ alignSelf: 'flex-start', marginVertical: 12 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#0F172A' }}>Quay lại</Text>
        </Pressable>

        {/* Title & Step */}
        <Text style={{ fontSize: 28, fontWeight: '800', color: '#0F172A', marginTop: 4 }}>
          Hồ sơ cá nhân
        </Text>
        <Text style={{ fontSize: 14, color: '#64748B', marginTop: 4, marginBottom: 4 }}>
          Bước 2 / 4
        </Text>

        <StepBar currentStep={2} />

        {duplicateError ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              backgroundColor: '#FEF2F2',
              borderWidth: 1,
              borderColor: '#FCA5A5',
              borderRadius: 10,
              padding: 12,
              marginBottom: 14,
            }}
          >
            <Ionicons name="alert-circle" size={20} color="#DC2626" />
            <Text style={{ flex: 1, fontSize: 13, fontWeight: '500', color: '#B91C1C' }}>
              {duplicateError}
            </Text>
          </View>
        ) : null}

        {/* Form Fields */}
        <View style={{ gap: 16 }}>
          {/* Số CCCD */}
          <View>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#0F172A', marginBottom: 8 }}>Số CCCD</Text>
            <Controller
              control={control}
              name="idCardNumber"
              render={({ field }) => (
                <View style={{ height: 50, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: errors.idCardNumber ? '#EF4444' : '#E2E8F0', borderRadius: 10, paddingHorizontal: 16, justifyContent: 'center' }}>
                  <TextInput
                    keyboardType="numeric"
                    maxLength={12}
                    placeholder="Nhập số CCCD"
                    placeholderTextColor="#64748B"
                    value={field.value}
                    onChangeText={(val) => {
                      if (duplicateError) setDuplicateError(null);
                      clearErrors('idCardNumber');
                      field.onChange(val.replace(/\D/g, '').slice(0, 12));
                    }}
                    onBlur={() => handleCheckIdCardBlur(field.value)}
                    style={{ fontSize: 15, color: '#0F172A', paddingVertical: 0 }}
                  />
                </View>
              )}
            />
            {errors.idCardNumber ? <Text style={{ color: '#EF4444', fontSize: 12, marginTop: 4, marginLeft: 4 }}>{errors.idCardNumber.message}</Text> : null}
          </View>

          {/* Ngày sinh */}
          <View>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#0F172A', marginBottom: 8 }}>Ngày sinh</Text>
            <Pressable
              onPress={() => setShowDatePicker(true)}
              style={{
                height: 50,
                backgroundColor: '#FFFFFF',
                borderWidth: 1,
                borderColor: errors.dateOfBirth ? '#EF4444' : '#E2E8F0',
                borderRadius: 10,
                paddingHorizontal: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Text style={{ fontSize: 15, color: dob ? '#0F172A' : '#64748B' }}>
                {dob ? (() => {
                  const parts = dob.split('-');
                  return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : dob;
                })() : 'Ngày / Tháng / Năm'}
              </Text>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#0F172A' }}>Chọn</Text>
            </Pressable>
            {errors.dateOfBirth ? <Text style={{ color: '#EF4444', fontSize: 12, marginTop: 4, marginLeft: 4 }}>{errors.dateOfBirth.message}</Text> : null}
          </View>

          <VietnameseDatePickerModal
            visible={showDatePicker}
            onClose={() => setShowDatePicker(false)}
            initialDate={dob}
            title="Chọn ngày sinh"
            onSelect={(selectedDateStr) => {
              setValue('dateOfBirth', selectedDateStr);
            }}
          />

          {/* Giới tính */}
          <View>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#0F172A', marginBottom: 8 }}>Giới tính</Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {[
                { id: 'MALE', label: 'Nam' },
                { id: 'FEMALE', label: 'Nữ' },
                { id: 'OTHER', label: 'Khác' },
              ].map((item) => {
                const isSelected = gender === item.id;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => setValue('gender', item.id as any)}
                    style={{
                      flex: 1,
                      height: 50,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: isSelected ? '#0F2231' : '#E2E8F0',
                      backgroundColor: isSelected ? '#F1F5F9' : '#FFFFFF',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 14, fontWeight: isSelected ? '700' : '500', color: '#0F172A' }}>
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {errors.gender ? <Text style={{ color: '#EF4444', fontSize: 12, marginTop: 4, marginLeft: 4 }}>{errors.gender.message}</Text> : null}
          </View>

          {/* Ngày bắt đầu làm việc (Tùy chọn) */}
          <View>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#0F172A', marginBottom: 8 }}>Ngày bắt đầu làm việc (Tùy chọn)</Text>
            <Pressable
              onPress={() => setShowJoinDatePicker(true)}
              style={{
                height: 50,
                backgroundColor: '#FFFFFF',
                borderWidth: 1,
                borderColor: errors.joinDate ? '#EF4444' : '#E2E8F0',
                borderRadius: 10,
                paddingHorizontal: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Text style={{ fontSize: 15, color: joinDate ? '#0F172A' : '#64748B' }}>
                {joinDate ? (() => {
                  const parts = joinDate.split('-');
                  return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : joinDate;
                })() : 'Ngày / Tháng / Năm'}
              </Text>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#0F172A' }}>Chọn</Text>
            </Pressable>
            {errors.joinDate ? <Text style={{ color: '#EF4444', fontSize: 12, marginTop: 4, marginLeft: 4 }}>{errors.joinDate.message}</Text> : null}
          </View>

          <VietnameseDatePickerModal
            visible={showJoinDatePicker}
            onClose={() => setShowJoinDatePicker(false)}
            initialDate={joinDate}
            title="Chọn ngày bắt đầu làm việc"
            onSelect={(selectedDateStr) => {
              setValue('joinDate', selectedDateStr);
            }}
          />

          {/* Tiếp tục Button */}
          <Pressable
            onPress={() => void submit()}
            disabled={checking}
            style={{
              backgroundColor: checking ? '#475569' : '#0F2231',
              height: 50,
              borderRadius: 10,
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 16,
            }}
          >
            {checking ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>Tiếp tục</Text>
            )}
          </Pressable>
        </View>

        {/* Footer */}
        <Text style={{ marginTop: 36, marginBottom: 16, fontSize: 11, fontWeight: '600', color: '#94A3B8', letterSpacing: 1.5, textAlign: 'center' }}>
          MOVIE LEGEND  ·  ML GROUP
        </Text>
      </ScrollView>
    </Screen>
  );
}

export const RegistrationProfileScreen = RegistrationPersonalScreen;

export function RegistrationDepartmentScreen() {
  const router = useRouter();
  const { values, update } = useRegistration();
  const [search, setSearch] = useState('');
  const departments = usePublicDepartments({ search: '' });
  
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  
  const { handleSubmit, setValue, watch, formState: { errors } } = useForm<DepartmentStepValues>({
    resolver: zodResolver(departmentSchema),
    defaultValues: { requestedDepartmentId: values.requestedDepartmentId },
  });
  const selectedId = watch('requestedDepartmentId');
  
  const submit = handleSubmit((data) => {
    Keyboard.dismiss();
    update(data);
    router.push('/register/review');
  });
  
  const activeDepartments = departments.data?.items.filter((department) => department.isActive) ?? [];
  
  const regionsMap = new Map();
  activeDepartments.forEach(dept => {
    if (dept.branch?.region) {
      regionsMap.set(dept.branch.region.id, dept.branch.region);
    }
  });
  const regions = Array.from(regionsMap.values());

  const branchesMap = new Map();
  if (selectedRegionId) {
    activeDepartments.forEach(dept => {
      if (dept.branch && dept.branch.region?.id === selectedRegionId) {
        branchesMap.set(dept.branch.id, dept.branch);
      }
    });
  }
  const branches = Array.from(branchesMap.values());

  const filteredDepartments = selectedBranchId 
    ? activeDepartments.filter(dept => dept.branch?.id === selectedBranchId)
    : [];

  const selectedRegion = regions.find(r => r.id === selectedRegionId);
  const selectedBranch = branches.find(b => b.id === selectedBranchId);

  const filteredRegionsBySearch = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return regions;
    return regions.filter(r => (r.name || '').toLowerCase().includes(q));
  }, [regions, search]);

  const filteredBranchesBySearch = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return branches;
    return branches.filter(b => (b.name || '').toLowerCase().includes(q));
  }, [branches, search]);

  const filteredDeptsBySearch = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return filteredDepartments;
    return filteredDepartments.filter(d => (d.name || '').toLowerCase().includes(q));
  }, [filteredDepartments, search]);

  const handleBack = () => {
    if (selectedBranchId) {
      setSelectedBranchId(null);
      setValue('requestedDepartmentId', '', { shouldValidate: true });
      setSearch('');
    } else if (selectedRegionId) {
      setSelectedRegionId(null);
      setSearch('');
    } else {
      router.back();
    }
  };

  return (
    <Screen backgroundColor="#F8FAFC" withBottomInset={true}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 24,
          paddingTop: 12,
          paddingBottom: 28,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header Branding */}
        <View style={{ alignItems: 'center', width: '100%', marginBottom: 12 }}>
          <Image
            source={require('../../../assets/ml-logo-only.png')}
            style={{ width: 92, height: 40, marginBottom: 8 }}
            resizeMode="contain"
          />
          <Text style={{ fontSize: 16, fontWeight: '800', color: '#0F172A', letterSpacing: 2, textAlign: 'center' }}>
            MOVIE LEGEND
          </Text>
          <View style={{ width: '100%', height: 1, backgroundColor: '#E2E8F0', marginTop: 22 }} />
        </View>

        {/* Back button */}
        <Pressable onPress={handleBack} hitSlop={10} style={{ alignSelf: 'flex-start', marginVertical: 12 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#0F172A' }}>Quay lại</Text>
        </Pressable>

        {/* SUB-STAGE 1: CHỌN MIỀN */}
        {!selectedRegionId && (
          <View>
            <View style={{ alignSelf: 'center', backgroundColor: '#E8EFF5', paddingHorizontal: 16, paddingVertical: 4, borderRadius: 20, marginBottom: 8 }}>
              <Text style={{ fontSize: 13, fontWeight: '500', color: '#25507B' }}>Bước 3 / 4</Text>
            </View>
            <Text style={{ fontSize: 28, fontWeight: '800', color: '#0F172A', textAlign: 'center' }}>
              Chọn miền
            </Text>
            <Text style={{ fontSize: 14, color: '#64748B', textAlign: 'center', marginTop: 4, marginBottom: 4 }}>
              Chọn khu vực làm việc của bạn.
            </Text>

            <StepBar currentStep={3} />

            <View style={{ height: 48, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, paddingHorizontal: 16, justifyContent: 'center', marginBottom: 14 }}>
              <TextInput
                placeholder="Tìm miền..."
                placeholderTextColor="#94A3B8"
                value={search}
                onChangeText={setSearch}
                style={{ fontSize: 14, color: '#0F172A', paddingVertical: 0 }}
              />
            </View>

            <View style={{ gap: 10 }}>
              {filteredRegionsBySearch.map((region) => (
                <Pressable
                  key={region.id}
                  onPress={() => {
                    setSelectedRegionId(region.id);
                    setSearch('');
                  }}
                  style={{
                    height: 54,
                    backgroundColor: '#FFFFFF',
                    borderWidth: 1,
                    borderColor: '#E2E8F0',
                    borderRadius: 10,
                    paddingHorizontal: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Text style={{ fontSize: 15, fontWeight: '700', color: '#0F172A' }}>{region.name}</Text>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#0284C7' }}>Chọn</Text>
                </Pressable>
              ))}
            </View>

            <View style={{ marginTop: 24 }}>
              <Pressable
                disabled={true}
                style={{
                  backgroundColor: '#9BA7B6',
                  height: 50,
                  borderRadius: 10,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>Tiếp tục</Text>
              </Pressable>
              <Text style={{ fontSize: 13, color: '#64748B', textAlign: 'center', marginTop: 8 }}>
                Chọn miền để tiếp tục.
              </Text>
            </View>
          </View>
        )}

        {/* SUB-STAGE 2: CHỌN CHI NHÁNH */}
        {selectedRegionId && !selectedBranchId && (
          <View>
            <Text style={{ fontSize: 14, color: '#64748B', textAlign: 'center', marginBottom: 4 }}>
              Bước 3 / 4
            </Text>
            <Text style={{ fontSize: 28, fontWeight: '800', color: '#0F172A', textAlign: 'center' }}>
              Chọn chi nhánh
            </Text>

            <View style={{ alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#E8EFF5', paddingHorizontal: 14, paddingVertical: 4, borderRadius: 20, marginTop: 8, marginBottom: 6 }}>
              <Text style={{ fontSize: 13, fontWeight: '500', color: '#25507B' }}>{selectedRegion?.name}</Text>
              <Pressable onPress={() => { setSelectedRegionId(null); setSearch(''); }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#0284C7' }}>Đổi</Text>
              </Pressable>
            </View>

            <Text style={{ fontSize: 14, color: '#64748B', textAlign: 'center', marginBottom: 4 }}>
              Chọn chi nhánh làm việc của bạn.
            </Text>

            <StepBar currentStep={3} />

            <View style={{ height: 48, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, paddingHorizontal: 16, justifyContent: 'center', marginBottom: 14 }}>
              <TextInput
                placeholder="Tìm chi nhánh..."
                placeholderTextColor="#94A3B8"
                value={search}
                onChangeText={setSearch}
                style={{ fontSize: 14, color: '#0F172A', paddingVertical: 0 }}
              />
            </View>

            <View style={{ gap: 10 }}>
              {filteredBranchesBySearch.map((branch) => (
                <Pressable
                  key={branch.id}
                  onPress={() => {
                    setSelectedBranchId(branch.id);
                    setSearch('');
                  }}
                  style={{
                    padding: 14,
                    backgroundColor: '#FFFFFF',
                    borderWidth: 1,
                    borderColor: '#E2E8F0',
                    borderRadius: 10,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <View>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: '#0F172A' }}>{branch.name}</Text>
                    <Text style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>{selectedRegion?.name}</Text>
                  </View>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#0284C7' }}>Chọn</Text>
                </Pressable>
              ))}
            </View>

            <View style={{ marginTop: 24 }}>
              <Pressable
                disabled={true}
                style={{
                  backgroundColor: '#9BA7B6',
                  height: 50,
                  borderRadius: 10,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>Tiếp tục</Text>
              </Pressable>
              <Text style={{ fontSize: 13, color: '#64748B', textAlign: 'center', marginTop: 8 }}>
                Chọn chi nhánh để tiếp tục.
              </Text>
            </View>
          </View>
        )}

        {/* SUB-STAGE 3: CHỌN PHÒNG BAN */}
        {selectedBranchId && (
          <View>
            <StepBar currentStep={3} />

            <Text style={{ fontSize: 14, color: '#64748B', textAlign: 'center', marginTop: 4 }}>
              Bước 3 / 4
            </Text>
            <Text style={{ fontSize: 28, fontWeight: '800', color: '#0F172A', textAlign: 'center', marginTop: 4, marginBottom: 14 }}>
              Chọn phòng ban
            </Text>

            {/* Selected Summary Card */}
            <View style={{ borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF', padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <View>
                <Text style={{ fontSize: 12, color: '#64748B' }}>{selectedRegion?.name}</Text>
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#0F172A', marginTop: 2 }}>{selectedBranch?.name}</Text>
              </View>
              <Pressable onPress={() => { setSelectedBranchId(null); setSearch(''); }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#0284C7' }}>Đổi</Text>
              </Pressable>
            </View>

            {/* Search */}
            <View style={{ height: 48, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, paddingHorizontal: 16, justifyContent: 'center', marginBottom: 14 }}>
              <TextInput
                placeholder="Tìm phòng ban..."
                placeholderTextColor="#94A3B8"
                value={search}
                onChangeText={setSearch}
                style={{ fontSize: 14, color: '#0F172A', paddingVertical: 0 }}
              />
            </View>

            {/* Departments Card List */}
            <View style={{ borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF', overflow: 'hidden' }}>
              {filteredDeptsBySearch.map((dept, idx) => {
                const isSelected = selectedId === dept.id;
                return (
                  <View key={dept.id}>
                    <Pressable
                      onPress={() => setValue('requestedDepartmentId', dept.id, { shouldValidate: true })}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingHorizontal: 16,
                        paddingVertical: 14,
                        backgroundColor: isSelected ? '#F8FAFC' : '#FFFFFF',
                      }}
                    >
                      <View style={{ flex: 1, marginRight: 12 }}>
                        <Text style={{ fontSize: 15, fontWeight: '700', color: '#0F172A' }}>{dept.name}</Text>
                        <Text style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>{dept.description || dept.name}</Text>
                      </View>
                      <Text style={{ fontSize: 14, fontWeight: isSelected ? '700' : '600', color: isSelected ? '#0F2231' : '#0284C7' }}>
                        {isSelected ? 'Đã chọn' : 'Chọn'}
                      </Text>
                    </Pressable>
                    {idx < filteredDeptsBySearch.length - 1 && (
                      <View style={{ width: '100%', height: 1, backgroundColor: '#F1F5F9' }} />
                    )}
                  </View>
                );
              })}
            </View>

            {errors.requestedDepartmentId ? (
              <Text style={{ color: '#EF4444', fontSize: 12, marginTop: 6, marginLeft: 4 }}>
                {errors.requestedDepartmentId.message}
              </Text>
            ) : null}

            {/* Button */}
            <View style={{ marginTop: 24 }}>
              <Pressable
                disabled={!selectedId}
                onPress={() => void submit()}
                style={{
                  backgroundColor: selectedId ? '#0F2231' : '#9BA7B6',
                  height: 50,
                  borderRadius: 10,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>Tiếp tục</Text>
              </Pressable>
              <Text style={{ fontSize: 13, color: '#64748B', textAlign: 'center', marginTop: 8 }}>
                Chọn phòng ban để tiếp tục.
              </Text>
            </View>
          </View>
        )}

        {/* Footer */}
        <Text style={{ marginTop: 36, marginBottom: 16, fontSize: 11, fontWeight: '600', color: '#94A3B8', letterSpacing: 1.5, textAlign: 'center' }}>
          MOVIE LEGEND  ·  ML GROUP
        </Text>
      </ScrollView>
    </Screen>
  );
}

export function RegistrationFaceScreen() {
  const router = useRouter();
  const { values, setFaceImage } = useRegistration();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const uploadAbortRef = useRef<AbortController | null>(null);
  const [activePose, setActivePose] = useState<FacePose>('FRONT');
  const [captureError, setCaptureError] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  const poses: FacePose[] = ['FRONT', 'LEFT', 'RIGHT'];
  const currentImage = values.faceImages.find((image) => image.pose === activePose);
  const complete = faceSchema.safeParse({ faceImages: values.faceImages }).success;

  async function capture() {
    setCaptureError(null);
    setCapturing(true);
    try {
      const picture = await cameraRef.current?.takePictureAsync({ quality: 0.8, exif: false });
      if (!picture) throw new Error('CAMERA_UNAVAILABLE');
      await uploadPose(activePose, picture.uri);
    } catch {
      setCaptureError('Khong the chup hoac upload anh, vui long thu lai');
    } finally {
      setCapturing(false);
    }
  }

  async function retryUpload(image: FaceImageInput) {
    setCaptureError(null);
    setCapturing(true);
    try {
      await uploadPose(image.pose, image.localUri);
    } catch {
      setCaptureError('Upload failed, please retry this pose');
    } finally {
      setCapturing(false);
    }
  }

  async function uploadPose(pose: FacePose, uri: string) {
    const controller = new AbortController();
    uploadAbortRef.current = controller;
    setFaceImage({ pose, localUri: uri, previewUri: uri, imageUrl: '', uploadStatus: 'UPLOADING', uploadProgress: 0 });
    try {
      const uploaded = await uploadFile({
        uri,
        name: `${pose.toLowerCase()}-face.jpg`,
        mimeType: 'image/jpeg',
        purpose: 'FACE_REGISTRATION',
        signal: controller.signal,
        onProgress: (progress) => {
          setFaceImage({ pose, localUri: uri, previewUri: uri, imageUrl: '', uploadStatus: 'UPLOADING', uploadProgress: progress.percent });
        },
      });
      setFaceImage({
        pose,
        localUri: uri,
        previewUri: uri,
        imageUrl: uploaded.fileUrl,
        uploadedFileId: uploaded.fileId,
        uploadStatus: 'SUCCESS',
        uploadProgress: 100,
      });
    } catch (error) {
      const cancelled = controller.signal.aborted;
      setFaceImage({
        pose,
        localUri: uri,
        previewUri: uri,
        imageUrl: '',
        uploadStatus: cancelled ? 'CANCELLED' : 'FAILED',
        uploadError: cancelled ? 'Upload cancelled' : uploadErrorMessage(error),
      });
      throw error;
    } finally {
      if (uploadAbortRef.current === controller) uploadAbortRef.current = null;
    }
  }

  if (!permission) return <LoadingState label="Dang kiem tra camera" />;
  if (!permission.granted) {
    return (
      <Screen>
        <View style={{ flex: 1, backgroundColor: '#FAFBFC' }}>
          <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
            <View style={{ backgroundColor: '#FFFFFF', borderRadius: 24, padding: 32, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 5 }}>
              <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginBottom: 24 }}>
                <Ionicons name="camera-outline" size={40} color="#102739" />
              </View>
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#102739', marginBottom: 12, textAlign: 'center' }}>Quyền Camera</Text>
              <Text style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 22, marginBottom: 32 }}>
                Ứng dụng cần quyền truy cập camera để chụp ảnh khuôn mặt (Góc thẳng, trái, phải) phục vụ quá trình định danh bảo mật.
              </Text>
              <Pressable onPress={() => void requestPermission()} style={{ width: '100%', backgroundColor: '#102739', height: 56, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>CẤP QUYỀN CAMERA</Text>
              </Pressable>
              <Pressable onPress={() => router.back()} style={{ width: '100%', height: 56, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginTop: 12, borderWidth: 1, borderColor: '#ECEEF3' }}>
                <Text style={{ color: '#6B7280', fontSize: 16, fontWeight: '600' }}>QUAY LẠI</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={{ flex: 1, backgroundColor: '#000000' }}>
        <CameraView ref={cameraRef} active facing="front" mirror style={StyleSheet.absoluteFill} onMountError={() => setCaptureError('Camera khong kha dung tren thiet bi nay')} />
        
        {/* Top Header Layer */}
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, paddingTop: 60, paddingHorizontal: 24, zIndex: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
            <Pressable onPress={() => router.back()} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', marginRight: 16 }}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </Pressable>
            <View>
              <Text style={{ fontSize: 20, fontWeight: '800', color: '#FFFFFF', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 }}>Xác thực khuôn mặt</Text>
              <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 }}>Bước 4/5</Text>
            </View>
          </View>
          
          <View style={{ backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 16, padding: 16, flexDirection: 'row', justifyContent: 'space-between' }}>
            {poses.map((pose) => {
              const image = values.faceImages.find((item) => item.pose === pose);
              const isSuccess = image?.uploadStatus === 'SUCCESS';
              const isActive = pose === activePose;
              return (
                <View key={pose} style={{ alignItems: 'center', flex: 1 }}>
                  <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: isSuccess ? '#10B981' : isActive ? '#FFFFFF' : 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 8, borderWidth: isActive ? 2 : 0, borderColor: '#FFFFFF' }}>
                    <Ionicons name={isSuccess ? "checkmark" : "person"} size={16} color={isActive && !isSuccess ? "#102739" : "#FFFFFF"} />
                  </View>
                  <Text style={{ color: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '700' }}>{pose}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Center Guide Box */}
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ width: 250, height: 300, borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)', borderRadius: 20, borderStyle: 'dashed' }} />
          <Text style={{ position: 'absolute', bottom: '25%', color: '#FFFFFF', fontSize: 16, fontWeight: '600', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, overflow: 'hidden' }}>
            {facePoseLabels[activePose]}
          </Text>
        </View>

        {/* Bottom Action Layer */}
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24, paddingBottom: 40, backgroundColor: 'rgba(0,0,0,0.8)', borderTopLeftRadius: 32, borderTopRightRadius: 32 }}>
          
          {currentImage?.previewUri ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24, backgroundColor: 'rgba(255,255,255,0.1)', padding: 12, borderRadius: 16 }}>
              <Image source={{ uri: currentImage.previewUri }} style={{ width: 64, height: 64, borderRadius: 8, marginRight: 16 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600', marginBottom: 4 }}>Trạng thái ảnh</Text>
                {currentImage.uploadStatus === 'UPLOADING' ? <Text style={{ color: '#60A5FA', fontSize: 13 }}>Đang tải lên: {currentImage.uploadProgress ?? 0}%</Text> : null}
                {currentImage.uploadStatus === 'SUCCESS' ? <Text style={{ color: '#10B981', fontSize: 13 }}>Tải lên thành công</Text> : null}
                {currentImage.uploadStatus === 'FAILED' ? <Text style={{ color: '#EF4444', fontSize: 13 }}>Tải lên thất bại</Text> : null}
              </View>
            </View>
          ) : null}
          
          {captureError ? <Text style={{ color: '#EF4444', backgroundColor: 'rgba(239,68,68,0.2)', padding: 12, borderRadius: 8, marginBottom: 16, textAlign: 'center' }}>{captureError}</Text> : null}

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            {currentImage?.uploadStatus === 'SUCCESS' ? (
              <Pressable disabled={activePose === 'RIGHT' && !complete} onPress={() => setActivePose(nextPose(activePose))} style={{ flex: 1, backgroundColor: (activePose === 'RIGHT' && !complete) ? '#475569' : '#FFFFFF', height: 56, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: (activePose === 'RIGHT' && !complete) ? '#9CA3AF' : '#102739', fontSize: 16, fontWeight: '600' }}>{activePose === 'RIGHT' ? 'HOÀN THÀNH' : 'CHỤP GÓC TIẾP THEO'}</Text>
              </Pressable>
            ) : (
              <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24 }}>
                {/* Spacer for centering */}
                <View style={{ width: 48, height: 48 }} />
                
                <Pressable onPress={capture} disabled={capturing} style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFFFFF' }}>
                  <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#FFFFFF' }} />
                </Pressable>
                
                <View style={{ width: 48, height: 48 }}>
                  {currentImage?.uploadStatus === 'FAILED' ? (
                    <Pressable onPress={() => void retryUpload(currentImage)} style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' }}>
                       <Ionicons name="refresh" size={24} color="#FFFFFF" />
                    </Pressable>
                  ) : null}
                </View>
              </View>
            )}
          </View>

          {complete ? (
             <Pressable onPress={() => router.push('/register/review')} style={{ backgroundColor: '#10B981', height: 56, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginTop: 16 }}>
                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>ĐI TỚI KIỂM TRA</Text>
              </Pressable>
          ) : null}
          
        </View>
      </View>
    </Screen>
  );
}

export function RegistrationReviewScreen() {
  const router = useRouter();
  const { values, reset } = useRegistration();
  const mutation = useMutation({ mutationFn: registerEmployee });
  const { data: deptData } = usePublicDepartments();
  const selectedDept = deptData?.items?.find((d) => d.id === values.requestedDepartmentId);

  const canSubmit = accountSchema.safeParse(values).success && profileSchema.safeParse(values).success && departmentSchema.safeParse(values).success;
  async function submit() {
    Keyboard.dismiss();
    const payload: RegisterPayload = {
      fullName: values.fullName,
      phone: values.phone,
      ...(values.email ? { email: values.email } : {}),
      password: values.password,
      idCardNumber: values.idCardNumber,
      ...(values.dateOfBirth ? { dateOfBirth: values.dateOfBirth } : {}),
      ...(values.gender ? { gender: values.gender } : {}),
      ...(values.joinDate ? { joinDate: values.joinDate } : {}),
      requestedDepartmentId: values.requestedDepartmentId,
      ...(values.faceImages?.length ? {
        faceImages: values.faceImages.map((img) => ({
          pose: img.pose,
          imageUrl: img.imageUrl,
          fileId: img.uploadedFileId,
        }))
      } : {}),
    };
    try {
      await mutation.mutateAsync(payload);
      reset();
      router.replace('/register/success');
    } catch {
      // Mutation state renders the normalized error.
    }
  }
  return (
    <Screen backgroundColor="#F8FAFC" withBottomInset={true}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 24,
          paddingTop: 12,
          paddingBottom: 28,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header Branding */}
        <View style={{ alignItems: 'center', width: '100%', marginBottom: 12 }}>
          <Image
            source={require('../../../assets/ml-logo-only.png')}
            style={{ width: 92, height: 40, marginBottom: 8 }}
            resizeMode="contain"
          />
          <Text style={{ fontSize: 16, fontWeight: '800', color: '#0F172A', letterSpacing: 2, textAlign: 'center' }}>
            MOVIE LEGEND
          </Text>
          <View style={{ width: '100%', height: 1, backgroundColor: '#E2E8F0', marginTop: 22 }} />
        </View>

        {/* Back button */}
        <Pressable onPress={() => router.back()} hitSlop={10} style={{ alignSelf: 'flex-start', marginVertical: 12 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#0F172A' }}>Quay lại</Text>
        </Pressable>

        {/* Title & Step */}
        <Text style={{ fontSize: 28, fontWeight: '800', color: '#0F172A', textAlign: 'center', marginTop: 4 }}>
          Kiểm tra và gửi
        </Text>
        <Text style={{ fontSize: 14, color: '#64748B', textAlign: 'center', marginTop: 4, marginBottom: 4 }}>
          Bước 4 / 4
        </Text>

        <StepBar currentStep={4} />

        {/* Info Cards */}
        <View style={{ gap: 14 }}>
          <View style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, padding: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Ionicons name="person-outline" size={18} color="#0F172A" />
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#0F172A' }}>Tài khoản</Text>
            </View>
            <Text style={{ fontSize: 14, color: '#475569', marginBottom: 6 }}><Text style={{ fontWeight: '600', color: '#0F172A' }}>Họ tên:</Text> {values.fullName}</Text>
            <Text style={{ fontSize: 14, color: '#475569', marginBottom: 6 }}><Text style={{ fontWeight: '600', color: '#0F172A' }}>SĐT:</Text> {values.phone}</Text>
            <Text style={{ fontSize: 14, color: '#475569' }}><Text style={{ fontWeight: '600', color: '#0F172A' }}>Email:</Text> {values.email || 'Không có email'}</Text>
          </View>

          <View style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, padding: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Ionicons name="document-text-outline" size={18} color="#0F172A" />
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#0F172A' }}>Hồ sơ</Text>
            </View>
            <Text style={{ fontSize: 14, color: '#475569', marginBottom: 6 }}><Text style={{ fontWeight: '600', color: '#0F172A' }}>CCCD:</Text> ********{values.idCardNumber.slice(-4)}</Text>
            {values.dateOfBirth ? (
              <Text style={{ fontSize: 14, color: '#475569', marginBottom: 6 }}>
                <Text style={{ fontWeight: '600', color: '#0F172A' }}>Ngày sinh:</Text> {(() => {
                  const parts = values.dateOfBirth.split('-');
                  return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : values.dateOfBirth;
                })()}
              </Text>
            ) : null}
            {values.gender ? (
              <Text style={{ fontSize: 14, color: '#475569', marginBottom: 6 }}>
                <Text style={{ fontWeight: '600', color: '#0F172A' }}>Giới tính:</Text> {values.gender === 'MALE' ? 'Nam' : values.gender === 'FEMALE' ? 'Nữ' : 'Khác'}
              </Text>
            ) : null}
            <Text style={{ fontSize: 14, color: '#475569', marginBottom: 6 }}>
              <Text style={{ fontWeight: '600', color: '#0F172A' }}>Ngày vào làm:</Text>{' '}
              {values.joinDate ? (() => {
                const parts = values.joinDate.split('-');
                return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : values.joinDate;
              })() : 'Tự động tính từ ngày duyệt tài khoản'}
            </Text>
            <Text style={{ fontSize: 14, color: '#475569' }}>
              <Text style={{ fontWeight: '600', color: '#0F172A' }}>Phòng ban:</Text> {selectedDept?.name || values.requestedDepartmentId || 'Chưa chọn'}
            </Text>
          </View>

          {mutation.error ? (
            <View style={{ backgroundColor: '#FEF2F2', padding: 12, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#FEE2E2' }}>
              <Ionicons name="alert-circle" size={18} color="#EF4444" />
              <Text style={{ color: '#EF4444', fontSize: 13, flex: 1, fontWeight: '500' }}>
                {registrationErrorMessage(mutation.error)}
              </Text>
            </View>
          ) : null}

          {/* Button */}
          <Pressable
            disabled={!canSubmit || mutation.isPending}
            onPress={() => void submit()}
            style={{
              backgroundColor: (!canSubmit || mutation.isPending) ? '#9BA7B6' : '#0F2231',
              height: 50,
              borderRadius: 10,
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 10,
            }}
          >
            {mutation.isPending ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>Gửi đăng ký</Text>
            )}
          </Pressable>
        </View>

        {/* Footer */}
        <Text style={{ marginTop: 36, marginBottom: 16, fontSize: 11, fontWeight: '600', color: '#94A3B8', letterSpacing: 1.5, textAlign: 'center' }}>
          MOVIE LEGEND  ·  ML GROUP
        </Text>
      </ScrollView>
    </Screen>
  );
}

export function RegistrationSuccessScreen() {
  const router = useRouter();
  return (
    <Screen>
      <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
          <View style={{ alignItems: 'center', marginBottom: 40 }}>
            <View style={{ width: 80, height: 80, backgroundColor: '#10B981', borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
              <Ionicons name="checkmark-sharp" size={48} color="#FFFFFF" />
            </View>
            <Text style={{ fontSize: 24, fontWeight: '700', color: '#102739', textAlign: 'center', marginBottom: 8 }}>Đăng ký thành công!</Text>
            <Text style={{ fontSize: 15, color: '#6B7280', textAlign: 'center', lineHeight: 24, paddingHorizontal: 16 }}>Tài khoản của bạn đang chờ phê duyệt từ Ban quản lý. Vui lòng chờ thông báo.</Text>
          </View>
          
          <Pressable onPress={() => router.replace('/login')} style={{ backgroundColor: '#102739', height: 60, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: '700' }}>QUAY VỀ ĐĂNG NHẬP</Text>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}


function DepartmentOption({ department, selected, onPress }: { department: Department; selected: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={{ backgroundColor: selected ? '#F9FAFB' : '#FFFFFF', borderColor: selected ? '#102739' : '#ECEEF3', borderRadius: 12, borderWidth: selected ? 2 : 1, padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <View style={{ flex: 1 }}>
        <Text style={{ color: '#102739', fontSize: 16, fontWeight: '700', marginBottom: 4 }}>{department.name}</Text>
        <Text style={{ color: '#6B7280', fontSize: 13 }}>{department.description ?? department.code}</Text>
      </View>
      {selected ? <Ionicons name="checkmark-circle" size={24} color="#102739" /> : <Ionicons name="ellipse-outline" size={24} color="#CBD5E1" />}
    </Pressable>
  );
}

function nextPose(pose: FacePose): FacePose {
  if (pose === 'FRONT') return 'LEFT';
  if (pose === 'LEFT') return 'RIGHT';
  return 'RIGHT';
}

function registrationErrorMessage(error: unknown): string {
  const normalized = normalizeApiError(error);
  const map: Record<string, string> = {
    DUPLICATE_PHONE: 'Số điện thoại này đã được đăng ký',
    DUPLICATE_ID_CARD: 'Số CCCD này đã tồn tại trên hệ thống',
    DUPLICATE_EMAIL: 'Email này đã được sử dụng',
    DEPARTMENT_NOT_FOUND: 'Phòng ban được chọn không tồn tại hoặc đã ngừng hoạt động',
    INVALID_FACE_IMAGES: 'Cần đủ ảnh các góc khuôn mặt',
    UPLOAD_FILE_REQUIRED: 'Cần tải đủ ảnh khuôn mặt',
    UPLOAD_ALREADY_ATTACHED: 'Ảnh tải lên đã được sử dụng',
    UPLOAD_NOT_FOUND: 'Không tìm thấy tệp tải lên',
  };
  return map[normalized.code] ?? normalized.message ?? mapLoginError(error);
}

function uploadErrorMessage(error: unknown): string {
  const normalized = normalizeApiError(error);
  const map: Record<string, string> = {
    UPLOAD_FILE_TOO_LARGE: 'Kích thước tệp quá lớn',
    UPLOAD_MIME_NOT_ALLOWED: 'Định dạng tệp không được hỗ trợ',
    UPLOAD_SIGNATURE_INVALID: 'Nội dung tệp không hợp lệ',
    UPLOAD_STORAGE_FAILED: 'Lưu tệp thất bại',
  };
  return map[normalized.code] ?? 'Tải lên thất bại';
}

function StepBar({ currentStep, totalSteps = 4 }: { currentStep: number; totalSteps?: number }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 14, gap: 8, width: '100%' }}>
      {Array.from({ length: totalSteps }).map((_, index) => {
        const step = index + 1;
        const isActive = step <= currentStep;
        return (
          <View 
            key={step} 
            style={{ 
              flex: 1, 
              height: 4, 
              borderRadius: 2, 
              backgroundColor: isActive ? '#0F2231' : '#E2E8F0' 
            }} 
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  cameraActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  cameraError: {
    backgroundColor: colors.dangerSoft,
    borderRadius: 8,
    color: colors.danger,
    padding: spacing.md,
  },
  cameraOverlay: {
    flex: 1,
    gap: spacing.md,
    justifyContent: 'flex-end',
    padding: spacing.lg,
  },
  cameraPage: {
    flex: 1,
    position: 'relative',
  },
  error: {
    color: colors.danger,
    fontSize: 14,
  },
  option: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.lg,
  },
  optionSelected: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  optionSubtitle: {
    color: colors.muted,
    fontSize: 13,
  },
  optionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  poseRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  preview: {
    alignSelf: 'center',
    borderRadius: 8,
    height: 120,
    width: 120,
  },
  rowText: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
  },
});
