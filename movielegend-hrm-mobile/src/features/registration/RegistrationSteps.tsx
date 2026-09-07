import { zodResolver } from '@hookform/resolvers/zod';
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
  Modal, 
  ScrollView,
  Keyboard,
  KeyboardAvoidingView
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Ionicons } from '@expo/vector-icons';
import { registerEmployee } from '../../api/registration.api';
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

type AccountStepValues = Pick<RegistrationFormValues, 'fullName' | 'phone' | 'email' | 'password' | 'confirmPassword'>;
type ProfileStepValues = Pick<RegistrationFormValues, 'idCardNumber' | 'dateOfBirth' | 'gender'>;
type DepartmentStepValues = Pick<RegistrationFormValues, 'requestedDepartmentId'>;

export function RegistrationIntroScreen() {
  const router = useRouter();
  return (
    <Screen>
      <View style={{ flex: 1, backgroundColor: '#FAFBFC' }}>

        <View style={{ flex: 1, justifyContent: 'center', padding: 24, zIndex: 1 }}>
          <View style={{ alignItems: 'center', marginBottom: 36 }}>
            <Image 
              source={require('../../../assets/ml-logo-only.png')} 
              style={{ width: 140, height: 70, marginBottom: 8 }} 
              resizeMode="contain" 
            />
            <Text style={{ fontSize: 22, fontWeight: '900', color: '#000000', letterSpacing: 1.5, marginBottom: 12 }}>MOVIE LEGEND</Text>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 4 }}>Đăng ký</Text>
            <Text style={{ fontSize: 14, fontWeight: '500', color: '#6B7280' }}>Tạo tài khoản mới cho ML Group</Text>
          </View>
          
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 16 }}>Quy trình đăng ký</Text>
            <View style={{ gap: 16, marginBottom: 32 }}>
              {['Thông tin tài khoản', 'Hồ sơ cá nhân', 'Chọn phòng ban', 'Kiểm tra và gửi'].map((item, index) => (
                <View key={item} style={{ flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: 'rgba(255, 255, 255, 0.88)', padding: 14, borderRadius: 16, borderWidth: 1, borderColor: '#ECEEF3' }}>
                  <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827' }}>{index + 1}</Text>
                  </View>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151' }}>{item}</Text>
                </View>
              ))}
            </View>
            
            <Pressable onPress={() => router.push('/register/account')} style={{ backgroundColor: '#0F172A', height: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center', shadowColor: '#0F172A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 3 }}>
              <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>BẮT ĐẦU</Text>
            </Pressable>
            <View style={{ flexDirection: 'row', marginTop: 24, justifyContent: 'center' }}>
              <Text style={{ fontSize: 14, fontWeight: '500', color: '#6B7280' }}>Đã có tài khoản? </Text>
              <Pressable onPress={() => router.replace('/login')}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827' }}>Đăng nhập</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Screen>
  );
}

export function RegistrationAccountScreen() {
  const router = useRouter();
  const { values, update } = useRegistration();
  const {
    control,
    handleSubmit,
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
  const submit = handleSubmit((data) => {
    Keyboard.dismiss();
    update(data);
    router.push('/register/personal');
  });
  return (
    <Screen>
      <View style={{ flex: 1, backgroundColor: 'transparent' }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
        >
          <ScrollView
            contentContainerStyle={{ padding: 24, paddingBottom: 60 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={{ marginBottom: 24, paddingTop: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <Pressable onPress={() => router.back()} style={{ padding: 4, marginRight: 12 }}>
                  <Ionicons name="arrow-back" size={24} color="#111827" />
                </Pressable>
                <Text style={{ fontSize: 20, fontWeight: '700', color: '#111827' }}>Thông tin tài khoản</Text>
              </View>
              <StepBar currentStep={1} />
            </View>

            <View style={{ gap: 20 }}>
              <Controller control={control} name="fullName" render={({ field }) => <FormField label="Họ tên" value={field.value} onChangeText={field.onChange} error={errors.fullName?.message} />} />
              <Controller control={control} name="phone" render={({ field }) => <FormField keyboardType="phone-pad" maxLength={10} label="Số điện thoại" value={field.value} onChangeText={(val) => field.onChange(val.replace(/\D/g, '').slice(0, 10))} error={errors.phone?.message} />} />
              <Controller control={control} name="email" render={({ field }) => <FormField autoCapitalize="none" keyboardType="email-address" label="Email" value={field.value} onChangeText={field.onChange} error={errors.email?.message} />} />
              <Controller control={control} name="password" render={({ field }) => <FormField isPassword label="Mật khẩu" value={field.value} onChangeText={field.onChange} error={errors.password?.message} />} />
              <Controller control={control} name="confirmPassword" render={({ field }) => <FormField isPassword label="Nhập lại mật khẩu" value={field.value} onChangeText={field.onChange} error={errors.confirmPassword?.message} />} />
              
              <Pressable onPress={submit} style={{ backgroundColor: '#0F172A', height: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 16, shadowColor: '#0F172A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 3 }}>
                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>TIẾP TỤC</Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Screen>
  );
}

export function RegistrationPersonalScreen() {
  const router = useRouter();
  const { values, update } = useRegistration();
  const { control, handleSubmit, formState: { errors }, watch, setValue } = useForm<ProfileStepValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      idCardNumber: values.idCardNumber,
      dateOfBirth: values.dateOfBirth,
      gender: values.gender,
    },
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const dob = watch('dateOfBirth');
  const gender = watch('gender');

  const submit = handleSubmit((data) => {
    Keyboard.dismiss();
    update(data);
    router.push('/register/department');
  });

  return (
    <Screen>
      <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
        >
          <ScrollView
            contentContainerStyle={{ padding: 24, paddingBottom: 60 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={{ marginBottom: 24, paddingTop: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <Pressable onPress={() => router.back()} style={{ padding: 4, marginRight: 12 }}>
                  <Ionicons name="arrow-back" size={24} color="#111827" />
                </Pressable>
                <Text style={{ fontSize: 20, fontWeight: '700', color: '#111827' }}>Hồ sơ cá nhân</Text>
              </View>
              <StepBar currentStep={2} />
            </View>

            <View style={{ gap: 20 }}>
              <Controller control={control} name="idCardNumber" render={({ field }) => <FormField label="Số CCCD" maxLength={12} value={field.value} onChangeText={(val) => field.onChange(val.replace(/\D/g, '').slice(0, 12))} error={errors.idCardNumber?.message} keyboardType="numeric" />} />
              
              <View>
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#6B7280', marginBottom: 4, marginLeft: 4 }}>Ngày sinh</Text>
                <Pressable 
                  onPress={() => setShowDatePicker(true)}
                  style={{ 
                    height: 56, 
                    borderWidth: 1, 
                    borderColor: errors.dateOfBirth ? '#EF4444' : '#ECEEF3', 
                    borderRadius: 12, 
                    paddingHorizontal: 16, 
                    flexDirection: 'row',
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    backgroundColor: '#FFFFFF' 
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Ionicons name="calendar-outline" size={20} color={dob ? '#111827' : '#9CA3AF'} />
                    <Text style={{ color: dob ? '#111827' : '#9CA3AF', fontSize: 15, fontWeight: dob ? '600' : '400' }}>
                      {dob ? (() => {
                        const parts = dob.split('-');
                        return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : dob;
                      })() : 'Chọn ngày sinh'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-down" size={18} color="#9CA3AF" />
                </Pressable>
                {errors.dateOfBirth ? <Text style={{ color: '#EF4444', fontSize: 12, marginTop: 4, marginLeft: 16 }}>{errors.dateOfBirth.message}</Text> : null}
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

              <View>
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#6B7280', marginBottom: 4, marginLeft: 4 }}>Giới tính</Text>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  {[
                    { id: 'MALE', label: 'Nam', icon: 'male-outline' },
                    { id: 'FEMALE', label: 'Nữ', icon: 'female-outline' },
                    { id: 'OTHER', label: 'Khác', icon: 'male-female-outline' }
                  ].map((item) => {
                    const isSelected = gender === item.id;
                    return (
                      <Pressable
                        key={item.id}
                        onPress={() => setValue('gender', item.id as any)}
                        style={{ 
                          flex: 1, 
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          height: 56, 
                          borderWidth: 1, 
                          borderColor: isSelected ? '#111827' : '#ECEEF3', 
                          borderRadius: 12, 
                          backgroundColor: isSelected ? '#F9FAFB' : '#FFFFFF' 
                        }}
                      >
                        <Ionicons name={item.icon as any} size={18} color={isSelected ? '#111827' : '#6B7280'} />
                        <Text style={{ color: isSelected ? '#111827' : '#6B7280', fontSize: 15, fontWeight: isSelected ? '600' : '500' }}>
                          {item.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                {errors.gender ? <Text style={{ color: '#EF4444', fontSize: 12, marginTop: 4, marginLeft: 16 }}>{errors.gender.message}</Text> : null}
              </View>
              
              <Pressable onPress={submit} style={{ backgroundColor: '#111827', height: 60, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 16 }}>
                <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: '700' }}>TIẾP TỤC</Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Screen>
  );
}

export function RegistrationDepartmentScreen() {
  const router = useRouter();
  const { values, update } = useRegistration();
  const [search, setSearch] = useState('');
  const departments = usePublicDepartments({ search });
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
  return (
    <Screen>
      <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        <ScrollView
          contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ marginBottom: 24, paddingTop: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <Pressable onPress={() => router.back()} style={{ padding: 4, marginRight: 12 }}>
                <Ionicons name="arrow-back" size={24} color="#111827" />
              </Pressable>
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#111827' }}>Chọn phòng ban</Text>
            </View>
            <StepBar currentStep={3} />
          </View>

          <SearchInput value={search} onChangeText={setSearch} placeholder="Tìm phòng ban..." />
          <View style={{ height: 16 }} />

          {departments.isLoading ? <LoadingState /> : null}
          {departments.isError ? <ErrorState error={departments.error} onRetry={() => void departments.refetch()} /> : null}
          {!departments.isLoading && !activeDepartments.length ? <EmptyState title="Không có phòng ban khả dụng" /> : null}
          
          <View style={{ gap: 12 }}>
            {activeDepartments.map((department) => (
              <DepartmentOption key={department.id} department={department} selected={selectedId === department.id} onPress={() => setValue('requestedDepartmentId', department.id, { shouldValidate: true })} />
            ))}
          </View>
          
          {errors.requestedDepartmentId ? <Text style={{ color: '#EF4444', fontSize: 13, marginTop: 12 }}>{errors.requestedDepartmentId.message}</Text> : null}
        </ScrollView>
        
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFFFFF', padding: 24, borderTopWidth: 1, borderTopColor: '#ECEEF3' }}>
           <Pressable onPress={submit} style={{ backgroundColor: '#111827', height: 60, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: '700' }}>TIẾP TỤC</Text>
            </Pressable>
        </View>
      </View>
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
                <Ionicons name="camera-outline" size={40} color="#111827" />
              </View>
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 12, textAlign: 'center' }}>Quyền Camera</Text>
              <Text style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 22, marginBottom: 32 }}>
                Ứng dụng cần quyền truy cập camera để chụp ảnh khuôn mặt (Góc thẳng, trái, phải) phục vụ quá trình định danh bảo mật.
              </Text>
              <Pressable onPress={() => void requestPermission()} style={{ width: '100%', backgroundColor: '#111827', height: 56, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}>
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
                    <Ionicons name={isSuccess ? "checkmark" : "person"} size={16} color={isActive && !isSuccess ? "#111827" : "#FFFFFF"} />
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
                <Text style={{ color: (activePose === 'RIGHT' && !complete) ? '#9CA3AF' : '#111827', fontSize: 16, fontWeight: '600' }}>{activePose === 'RIGHT' ? 'HOÀN THÀNH' : 'CHỤP GÓC TIẾP THEO'}</Text>
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
      requestedDepartmentId: values.requestedDepartmentId,
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
    <Screen>
      <View style={{ flex: 1, backgroundColor: '#FAFBFC' }}>
        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={{ marginBottom: 24, paddingTop: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <Pressable onPress={() => router.back()} style={{ padding: 4, marginRight: 12 }}>
                <Ionicons name="arrow-back" size={24} color="#111827" />
              </Pressable>
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#111827' }}>Kiểm tra & Gửi</Text>
            </View>
            <StepBar currentStep={4} />
          </View>

          <View style={{ borderWidth: 1, borderColor: '#ECEEF3', borderRadius: 12, padding: 20, marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Ionicons name="person-outline" size={20} color="#111827" />
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>Tài khoản</Text>
            </View>
            <Text style={{ fontSize: 14, color: '#374151', marginBottom: 8 }}><Text style={{ fontWeight: '600' }}>Họ tên:</Text> {values.fullName}</Text>
            <Text style={{ fontSize: 14, color: '#374151', marginBottom: 8 }}><Text style={{ fontWeight: '600' }}>SĐT:</Text> {values.phone}</Text>
            <Text style={{ fontSize: 14, color: '#374151' }}><Text style={{ fontWeight: '600' }}>Email:</Text> {values.email || 'Không có email'}</Text>
          </View>
          
          <View style={{ borderWidth: 1, borderColor: '#ECEEF3', borderRadius: 12, padding: 20, marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Ionicons name="document-text-outline" size={20} color="#111827" />
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>Hồ sơ</Text>
            </View>
            <Text style={{ fontSize: 14, color: '#374151', marginBottom: 8 }}><Text style={{ fontWeight: '600' }}>CCCD:</Text> ********{values.idCardNumber.slice(-4)}</Text>
            {values.dateOfBirth ? (
              <Text style={{ fontSize: 14, color: '#374151', marginBottom: 8 }}>
                <Text style={{ fontWeight: '600' }}>Ngày sinh:</Text> {(() => {
                  const parts = values.dateOfBirth.split('-');
                  return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : values.dateOfBirth;
                })()}
              </Text>
            ) : null}
            {values.gender ? (
              <Text style={{ fontSize: 14, color: '#374151', marginBottom: 8 }}>
                <Text style={{ fontWeight: '600' }}>Giới tính:</Text> {values.gender === 'MALE' ? 'Nam' : values.gender === 'FEMALE' ? 'Nữ' : 'Khác'}
              </Text>
            ) : null}
            <Text style={{ fontSize: 14, color: '#374151' }}><Text style={{ fontWeight: '600' }}>Phòng ban ứng tuyển:</Text> {selectedDept?.name || values.requestedDepartmentId || 'Chưa chọn'}</Text>
          </View>
          
          {mutation.error ? (
             <View style={{ backgroundColor: '#FEF2F2', padding: 12, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="alert-circle" size={20} color="#EF4444" />
                <Text style={{ color: '#EF4444', fontSize: 13, flex: 1 }}>{registrationErrorMessage(mutation.error)}</Text>
              </View>
          ) : null}
        </ScrollView>
        
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFFFFF', padding: 24, borderTopWidth: 1, borderTopColor: '#ECEEF3' }}>
           <Pressable disabled={!canSubmit || mutation.isPending} onPress={() => void submit()} style={{ backgroundColor: (!canSubmit || mutation.isPending) ? '#9CA3AF' : '#111827', height: 60, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: '700' }}>{mutation.isPending ? 'ĐANG GỬI...' : 'GỬI ĐĂNG KÝ'}</Text>
            </Pressable>
        </View>
      </View>
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
            <Text style={{ fontSize: 24, fontWeight: '700', color: '#111827', textAlign: 'center', marginBottom: 8 }}>Đăng ký thành công!</Text>
            <Text style={{ fontSize: 15, color: '#6B7280', textAlign: 'center', lineHeight: 24, paddingHorizontal: 16 }}>Tài khoản của bạn đang chờ phê duyệt từ Ban quản lý. Vui lòng chờ thông báo.</Text>
          </View>
          
          <Pressable onPress={() => router.replace('/login')} style={{ backgroundColor: '#111827', height: 60, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: '700' }}>QUAY VỀ ĐĂNG NHẬP</Text>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}

export { RegistrationAccountScreen as RegistrationProfileScreen };

function DepartmentOption({ department, selected, onPress }: { department: Department; selected: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={{ backgroundColor: selected ? '#F9FAFB' : '#FFFFFF', borderColor: selected ? '#111827' : '#ECEEF3', borderRadius: 12, borderWidth: selected ? 2 : 1, padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <View style={{ flex: 1 }}>
        <Text style={{ color: '#111827', fontSize: 16, fontWeight: '700', marginBottom: 4 }}>{department.name}</Text>
        <Text style={{ color: '#6B7280', fontSize: 13 }}>{department.description ?? department.code}</Text>
      </View>
      {selected ? <Ionicons name="checkmark-circle" size={24} color="#111827" /> : <Ionicons name="ellipse-outline" size={24} color="#CBD5E1" />}
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
    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 6, width: '100%' }}>
      {Array.from({ length: totalSteps }).map((_, index) => {
        const step = index + 1;
        const isActive = step === currentStep;
        const isCompleted = step < currentStep;
        return (
          <View 
            key={step} 
            style={{ 
              flex: 1, 
              height: 4, 
              borderRadius: 2, 
              backgroundColor: isActive || isCompleted ? '#111827' : '#E5E7EB' 
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
