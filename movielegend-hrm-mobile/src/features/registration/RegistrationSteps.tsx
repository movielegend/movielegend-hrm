import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Image, Pressable, StyleSheet, Text, View, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { registerEmployee } from '../../api/registration.api';
import { uploadFile } from '../../api/uploads.api';
import { PrimaryButton, SecondaryButton } from '../../components/Buttons';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { FormField } from '../../components/FormField';
import { LoadingState } from '../../components/LoadingState';
import { PageHeader } from '../../components/PageHeader';
import { Screen } from '../../components/Screen';
import { ScreenContainer } from '../../components/ScreenContainer';
import { SearchInput } from '../../components/SearchInput';
import { SectionCard } from '../../components/SectionCard';
import { StatusBadge } from '../../components/StatusBadge';
import { useDepartments } from '../../hooks/useDepartments';
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
      <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        <View style={{ padding: 24, paddingTop: 40, alignItems: 'center' }}>
          <View style={{ width: 64, height: 64, backgroundColor: 'rgba(30,136,229,0.1)', borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <Ionicons name="person-add" size={32} color="#1E88E5" />
          </View>
          <Text style={{ fontSize: 24, fontWeight: '800', color: '#0B3B61', marginBottom: 8 }}>Đăng ký tài khoản</Text>
          <Text style={{ fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 22 }}>Tài khoản mới sẽ được gửi tới leader hoặc admin để phê duyệt. Vui lòng hoàn thành các bước dưới đây.</Text>
        </View>

        <View style={{ paddingHorizontal: 32, flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#0B3B61', marginBottom: 20 }}>Quy trình 4 bước</Text>
          
          <View style={{ gap: 24 }}>
            {[
              { title: 'Thông tin tài khoản', icon: 'call', desc: 'Số điện thoại & mật khẩu' },
              { title: 'Hồ sơ cá nhân', icon: 'id-card', desc: 'Họ tên, CCCD, Ngày sinh' },
              { title: 'Chọn phòng ban', icon: 'business', desc: 'Nơi bạn đang công tác' },
              { title: 'Nhận diện khuôn mặt', icon: 'scan', desc: 'Dùng để chấm công' }
            ].map((item, idx) => (
              <View key={item.title} style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                 <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#F0F4F8', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name={item.icon as any} size={20} color="#1E88E5" />
                 </View>
                 <View style={{ flex: 1 }}>
                   <Text style={{ fontSize: 15, fontWeight: '700', color: '#1E293B', marginBottom: 2 }}>Bước {idx + 1}: {item.title}</Text>
                   <Text style={{ fontSize: 13, color: '#64748B' }}>{item.desc}</Text>
                 </View>
              </View>
            ))}
          </View>
        </View>

        <View style={{ padding: 24, paddingBottom: 40, borderTopWidth: 1, borderTopColor: '#F0F4F8' }}>
          <Pressable onPress={() => router.push('/register/profile')} style={{ backgroundColor: '#1E88E5', height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', shadowColor: '#1E88E5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 }}>
            <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>Bắt đầu ngay</Text>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}

export function RegistrationProfileScreen() {
  const router = useRouter();
  const { values, update } = useRegistration();
  const { control, handleSubmit, formState: { errors } } = useForm<AccountStepValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: values,
  });
  const submit = handleSubmit((data) => {
    update(data);
    router.push('/register/personal');
  });
  return (
    <Screen>
      <View style={{ flex: 1, backgroundColor: '#F0F4F8' }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 56, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E6EEF3' }}>
          <Pressable onPress={() => router.back()} style={{ padding: 4, marginRight: 12 }}>
            <Ionicons name="chevron-back" size={24} color="#0B3B61" />
          </Pressable>
          <View>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#0B3B61' }}>Thông tin tài khoản</Text>
            <Text style={{ fontSize: 12, color: '#64748B' }}>Bước 1/4</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, gap: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 }}>
            
            <View>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#3B4A59', marginBottom: 8 }}>Họ và tên</Text>
              <Controller control={control} name="fullName" render={({ field }) => (
                <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: errors.fullName ? '#EF4444' : '#E2E8F0', borderRadius: 12, paddingHorizontal: 12, height: 48, backgroundColor: '#F8FAFC' }}>
                  <Ionicons name="person-outline" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
                  <TextInput style={{ flex: 1, fontSize: 14, color: '#1E293B' }} placeholder="Nhập họ và tên" value={field.value} onChangeText={field.onChange} />
                </View>
              )} />
              {errors.fullName ? <Text style={{ color: '#EF4444', fontSize: 12, marginTop: 4 }}>{errors.fullName.message}</Text> : null}
            </View>

            <View>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#3B4A59', marginBottom: 8 }}>Số điện thoại</Text>
              <Controller control={control} name="phone" render={({ field }) => (
                <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: errors.phone ? '#EF4444' : '#E2E8F0', borderRadius: 12, paddingHorizontal: 12, height: 48, backgroundColor: '#F8FAFC' }}>
                  <Ionicons name="call-outline" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
                  <TextInput style={{ flex: 1, fontSize: 14, color: '#1E293B' }} keyboardType="phone-pad" placeholder="Dùng để đăng nhập" value={field.value} onChangeText={field.onChange} />
                </View>
              )} />
              {errors.phone ? <Text style={{ color: '#EF4444', fontSize: 12, marginTop: 4 }}>{errors.phone.message}</Text> : null}
            </View>

            <View>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#3B4A59', marginBottom: 8 }}>Email</Text>
              <Controller control={control} name="email" render={({ field }) => (
                <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: errors.email ? '#EF4444' : '#E2E8F0', borderRadius: 12, paddingHorizontal: 12, height: 48, backgroundColor: '#F8FAFC' }}>
                  <Ionicons name="mail-outline" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
                  <TextInput style={{ flex: 1, fontSize: 14, color: '#1E293B' }} autoCapitalize="none" keyboardType="email-address" placeholder="Nhập email" value={field.value} onChangeText={field.onChange} />
                </View>
              )} />
              {errors.email ? <Text style={{ color: '#EF4444', fontSize: 12, marginTop: 4 }}>{errors.email.message}</Text> : null}
            </View>

            <View>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#3B4A59', marginBottom: 8 }}>Mật khẩu</Text>
              <Controller control={control} name="password" render={({ field }) => (
                <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: errors.password ? '#EF4444' : '#E2E8F0', borderRadius: 12, paddingHorizontal: 12, height: 48, backgroundColor: '#F8FAFC' }}>
                  <Ionicons name="lock-closed-outline" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
                  <TextInput style={{ flex: 1, fontSize: 14, color: '#1E293B' }} secureTextEntry placeholder="Tối thiểu 6 ký tự" value={field.value} onChangeText={field.onChange} />
                </View>
              )} />
              {errors.password ? <Text style={{ color: '#EF4444', fontSize: 12, marginTop: 4 }}>{errors.password.message}</Text> : null}
            </View>

            <View>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#3B4A59', marginBottom: 8 }}>Nhập lại mật khẩu</Text>
              <Controller control={control} name="confirmPassword" render={({ field }) => (
                <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: errors.confirmPassword ? '#EF4444' : '#E2E8F0', borderRadius: 12, paddingHorizontal: 12, height: 48, backgroundColor: '#F8FAFC' }}>
                  <Ionicons name="lock-closed-outline" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
                  <TextInput style={{ flex: 1, fontSize: 14, color: '#1E293B' }} secureTextEntry placeholder="Xác nhận mật khẩu" value={field.value} onChangeText={field.onChange} />
                </View>
              )} />
              {errors.confirmPassword ? <Text style={{ color: '#EF4444', fontSize: 12, marginTop: 4 }}>{errors.confirmPassword.message}</Text> : null}
            </View>

          </View>
        </ScrollView>
        <View style={{ padding: 24, paddingBottom: 40, borderTopWidth: 1, borderTopColor: '#E2E8F0', backgroundColor: '#FFFFFF' }}>
          <Pressable onPress={submit} style={{ backgroundColor: '#1E88E5', height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>Tiếp tục (2/4)</Text>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}

export function RegistrationPersonalScreen() {
  const router = useRouter();
  const { values, update } = useRegistration();
  const { control, handleSubmit, formState: { errors } } = useForm<ProfileStepValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: values,
  });
  const submit = handleSubmit((data) => {
    update(data);
    router.push('/register/department');
  });
  return (
    <Screen>
      <View style={{ flex: 1, backgroundColor: '#F0F4F8' }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 56, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E6EEF3' }}>
          <Pressable onPress={() => router.back()} style={{ padding: 4, marginRight: 12 }}>
            <Ionicons name="chevron-back" size={24} color="#0B3B61" />
          </Pressable>
          <View>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#0B3B61' }}>Hồ sơ cá nhân</Text>
            <Text style={{ fontSize: 12, color: '#64748B' }}>Bước 2/4</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, gap: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 }}>
            
            <View>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#3B4A59', marginBottom: 8 }}>Số CCCD / CMND</Text>
              <Controller control={control} name="idCardNumber" render={({ field }) => (
                <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: errors.idCardNumber ? '#EF4444' : '#E2E8F0', borderRadius: 12, paddingHorizontal: 12, height: 48, backgroundColor: '#F8FAFC' }}>
                  <Ionicons name="id-card-outline" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
                  <TextInput style={{ flex: 1, fontSize: 14, color: '#1E293B' }} keyboardType="number-pad" placeholder="Nhập dãy số CCCD" value={field.value} onChangeText={field.onChange} />
                </View>
              )} />
              {errors.idCardNumber ? <Text style={{ color: '#EF4444', fontSize: 12, marginTop: 4 }}>{errors.idCardNumber.message}</Text> : null}
            </View>

            <View>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#3B4A59', marginBottom: 8 }}>Ngày sinh</Text>
              <Controller control={control} name="dateOfBirth" render={({ field }) => (
                <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: errors.dateOfBirth ? '#EF4444' : '#E2E8F0', borderRadius: 12, paddingHorizontal: 12, height: 48, backgroundColor: '#F8FAFC' }}>
                  <Ionicons name="calendar-outline" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
                  <TextInput style={{ flex: 1, fontSize: 14, color: '#1E293B' }} placeholder="YYYY-MM-DD" value={field.value} onChangeText={field.onChange} />
                </View>
              )} />
              {errors.dateOfBirth ? <Text style={{ color: '#EF4444', fontSize: 12, marginTop: 4 }}>{errors.dateOfBirth.message}</Text> : null}
            </View>

            <View>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#3B4A59', marginBottom: 8 }}>Giới tính</Text>
              <Controller control={control} name="gender" render={({ field }) => (
                <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: errors.gender ? '#EF4444' : '#E2E8F0', borderRadius: 12, paddingHorizontal: 12, height: 48, backgroundColor: '#F8FAFC' }}>
                  <Ionicons name="male-female-outline" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
                  <TextInput style={{ flex: 1, fontSize: 14, color: '#1E293B' }} placeholder="MALE / FEMALE" autoCapitalize="characters" value={field.value} onChangeText={field.onChange} />
                </View>
              )} />
              {errors.gender ? <Text style={{ color: '#EF4444', fontSize: 12, marginTop: 4 }}>{errors.gender.message}</Text> : null}
            </View>

          </View>
        </ScrollView>
        <View style={{ padding: 24, paddingBottom: 40, borderTopWidth: 1, borderTopColor: '#E2E8F0', backgroundColor: '#FFFFFF' }}>
          <Pressable onPress={submit} style={{ backgroundColor: '#1E88E5', height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>Tiếp tục (3/4)</Text>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}

export function RegistrationDepartmentScreen() {
  const router = useRouter();
  const { values, update } = useRegistration();
  const [search, setSearch] = useState('');
  const departments = useDepartments({ search });
  const { handleSubmit, setValue, watch, formState: { errors } } = useForm<DepartmentStepValues>({
    resolver: zodResolver(departmentSchema),
    defaultValues: { requestedDepartmentId: values.requestedDepartmentId },
  });
  const selectedId = watch('requestedDepartmentId');
  const submit = handleSubmit((data) => {
    update(data);
    router.push('/register/face');
  });
  const activeDepartments = departments.data?.items.filter((department: any) => department.isActive) ?? [];
  return (
    <Screen>
      <View style={{ flex: 1, backgroundColor: '#F0F4F8' }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 56, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E6EEF3' }}>
          <Pressable onPress={() => router.back()} style={{ padding: 4, marginRight: 12 }}>
            <Ionicons name="chevron-back" size={24} color="#0B3B61" />
          </Pressable>
          <View>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#0B3B61' }}>Chọn phòng ban</Text>
            <Text style={{ fontSize: 12, color: '#64748B' }}>Bước 3/4</Text>
          </View>
        </View>

        <View style={{ padding: 16 }}>
           <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, paddingHorizontal: 12, height: 48, borderWidth: 1, borderColor: '#E2E8F0' }}>
              <Ionicons name="search" size={20} color="#94A3B8" />
              <TextInput style={{ flex: 1, marginLeft: 8, fontSize: 14 }} placeholder="Tìm kiếm phòng ban..." value={search} onChangeText={setSearch} />
           </View>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
          {departments.isLoading ? <ActivityIndicator style={{ marginTop: 40 }} color="#1E88E5" /> : null}
          {!departments.isLoading && !activeDepartments.length ? <Text style={{ textAlign: 'center', marginTop: 40, color: '#64748B' }}>Không tìm thấy phòng ban</Text> : null}
          
          <View style={{ gap: 12 }}>
            {activeDepartments.map((department: any) => (
              <Pressable key={department.id} onPress={() => setValue('requestedDepartmentId', department.id, { shouldValidate: true })} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: selectedId === department.id ? '#EFF6FF' : '#FFFFFF', borderWidth: 1, borderColor: selectedId === department.id ? '#3B82F6' : '#E2E8F0', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                   <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: selectedId === department.id ? '#3B82F6' : '#F1F5F9', alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="business" size={20} color={selectedId === department.id ? '#FFFFFF' : '#64748B'} />
                   </View>
                   <View>
                     <Text style={{ fontSize: 15, fontWeight: '700', color: selectedId === department.id ? '#1E3A8A' : '#1E293B' }}>{department.name}</Text>
                     <Text style={{ fontSize: 13, color: '#64748B' }}>{department.code}</Text>
                   </View>
                </View>
                <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: selectedId === department.id ? '#3B82F6' : '#CBD5E1', alignItems: 'center', justifyContent: 'center' }}>
                   {selectedId === department.id && <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#3B82F6' }} />}
                </View>
              </Pressable>
            ))}
          </View>
          {errors.requestedDepartmentId ? <Text style={{ color: '#EF4444', textAlign: 'center', marginTop: 16 }}>{errors.requestedDepartmentId.message}</Text> : null}
        </ScrollView>

        <View style={{ padding: 24, paddingBottom: 40, borderTopWidth: 1, borderTopColor: '#E2E8F0', backgroundColor: '#FFFFFF' }}>
          <Pressable onPress={submit} style={{ backgroundColor: '#1E88E5', height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>Tiếp tục (4/4)</Text>
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
  const cameraRef = useRef<CameraView | null>(null);
  const uploadAbortRef = useRef<AbortController | null>(null);
  const [activePose, setActivePose] = useState<FacePose>('FRONT');
  const [captureError, setCaptureError] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  const poses: FacePose[] = ['FRONT', 'LEFT', 'RIGHT'];
  const currentImage = values.faceImages.find((image: any) => image.pose === activePose);
  const complete = faceSchema.safeParse({ faceImages: values.faceImages }).success;

  async function capture() {
    setCaptureError(null);
    setCapturing(true);
    try {
      const picture = await cameraRef.current?.takePictureAsync({ quality: 0.8, exif: false });
      if (!picture) throw new Error('CAMERA_UNAVAILABLE');
      await uploadPose(activePose, picture.uri);
    } catch {
      setCaptureError('Không thể chụp hoặc tải lên, vui lòng thử lại');
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
      setCaptureError('Tải lên thất bại, vui lòng thử lại góc này');
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
        onProgress: (progress: any) => {
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
      setFaceImage({ pose, localUri: uri, previewUri: uri, imageUrl: '', uploadStatus: cancelled ? 'IDLE' : 'FAILED', uploadProgress: 0 });
      if (!cancelled) throw error;
    }
  }

  if (!permission) return <Screen><ActivityIndicator style={{ marginTop: 40 }} color="#1E88E5" /></Screen>;
  if (!permission.granted) {
    return (
      <Screen>
        <View style={{ flex: 1, backgroundColor: '#F0F4F8', justifyContent: 'center', padding: 24, alignItems: 'center' }}>
          <Ionicons name="camera-outline" size={64} color="#1E88E5" style={{ marginBottom: 16 }} />
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#0B3B61', marginBottom: 8 }}>Cấp quyền Camera</Text>
          <Text style={{ fontSize: 14, color: '#64748B', textAlign: 'center', marginBottom: 24 }}>Movie Legend cần truy cập camera để chụp ảnh khuôn mặt dùng cho tính năng chấm công AI.</Text>
          <Pressable onPress={requestPermission} style={{ backgroundColor: '#1E88E5', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}>
            <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Cấp quyền ngay</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={{ flex: 1, backgroundColor: '#0F172A' }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 56, backgroundColor: '#0F172A' }}>
          <Pressable onPress={() => router.back()} style={{ padding: 4, marginRight: 12 }}>
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </Pressable>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF' }}>Lấy dữ liệu khuôn mặt</Text>
        </View>

        <View style={{ padding: 24, paddingBottom: 12, alignItems: 'center' }}>
           <Text style={{ fontSize: 18, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 }}>
             {activePose === 'FRONT' ? 'Nhìn thẳng vào Camera' : activePose === 'LEFT' ? 'Quay mặt sang trái' : 'Quay mặt sang phải'}
           </Text>
           <Text style={{ fontSize: 14, color: '#94A3B8' }}>Đảm bảo khuôn mặt nằm trọn trong khung hình</Text>
        </View>

        <View style={{ flex: 1, paddingHorizontal: 24, justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ width: 280, height: 380, borderRadius: 140, overflow: 'hidden', borderWidth: 4, borderColor: currentImage?.uploadStatus === 'SUCCESS' ? '#10B981' : '#3B82F6' }}>
            {currentImage?.localUri ? (
               <Image source={{ uri: currentImage.localUri }} style={{ width: '100%', height: '100%' }} />
            ) : (
               <CameraView ref={cameraRef} facing="front" style={{ width: '100%', height: '100%' }} />
            )}
            
            {/* Overlay Grid/Guide */}
            {!currentImage && (
              <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ width: 140, height: 180, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', borderStyle: 'dashed', borderRadius: 70 }} />
              </View>
            )}

            {currentImage?.uploadStatus === 'UPLOADING' && (
              <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,23,42,0.6)', alignItems: 'center', justifyContent: 'center' }}>
                 <ActivityIndicator size="large" color="#3B82F6" />
                 <Text style={{ color: '#FFFFFF', marginTop: 12, fontWeight: '600' }}>{currentImage.uploadProgress}%</Text>
              </View>
            )}
          </View>
        </View>

        {captureError && <Text style={{ color: '#EF4444', textAlign: 'center', marginTop: 16 }}>{captureError}</Text>}

        {/* Pose Selectors */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 24, marginBottom: 40 }}>
           {poses.map(pose => {
             const img = values.faceImages.find((i: any) => i.pose === pose);
             return (
               <Pressable key={pose} onPress={() => setActivePose(pose)} style={{ alignItems: 'center' }}>
                 <View style={{ width: 64, height: 64, borderRadius: 32, borderWidth: 2, borderColor: activePose === pose ? '#3B82F6' : '#334155', backgroundColor: '#1E293B', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 8 }}>
                    {img?.localUri ? <Image source={{ uri: img.localUri }} style={{ width: '100%', height: '100%' }} /> : <Ionicons name="person" size={24} color="#64748B" />}
                    {img?.uploadStatus === 'SUCCESS' && <View style={{ position: 'absolute', bottom: 4, right: 4, width: 16, height: 16, borderRadius: 8, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center' }}><Ionicons name="checkmark" size={10} color="#FFFFFF" /></View>}
                 </View>
                 <Text style={{ fontSize: 12, color: activePose === pose ? '#FFFFFF' : '#94A3B8', fontWeight: activePose === pose ? '700' : '500' }}>{facePoseLabels[pose]}</Text>
               </Pressable>
             );
           })}
        </View>

        <View style={{ padding: 24, paddingBottom: 40, borderTopWidth: 1, borderTopColor: '#1E293B' }}>
          {!currentImage ? (
            <Pressable onPress={capture} disabled={capturing} style={{ backgroundColor: '#3B82F6', height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>CHỤP ẢNH</Text>
            </Pressable>
          ) : currentImage.uploadStatus === 'FAILED' ? (
            <Pressable onPress={() => retryUpload(currentImage)} disabled={capturing} style={{ backgroundColor: '#EF4444', height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>THỬ LẠI</Text>
            </Pressable>
          ) : (
            <Pressable onPress={() => { if (complete) router.push('/register/review'); else { const next = poses.find(p => !values.faceImages.find((i: any) => i.pose === p)); if (next) setActivePose(next); } }} style={{ backgroundColor: complete ? '#10B981' : '#3B82F6', height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>{complete ? 'HOÀN THÀNH' : 'BƯỚC TIẾP THEO'}</Text>
            </Pressable>
          )}
        </View>

      </View>
    </Screen>
  );
}

export function RegistrationReviewScreen() {
  const router = useRouter();
  const { values, reset } = useRegistration();
  const mutation = useMutation({ mutationFn: registerEmployee });
  const faceOk = faceSchema.safeParse({ faceImages: values.faceImages }).success;
  const canSubmit = accountSchema.safeParse(values).success && profileSchema.safeParse(values).success && departmentSchema.safeParse(values).success && faceOk;
  async function submit() {
    const payload: RegisterPayload = {
      fullName: values.fullName,
      phone: values.phone,
      ...(values.email ? { email: values.email } : {}),
      password: values.password,
      idCardNumber: values.idCardNumber,
      ...(values.dateOfBirth ? { dateOfBirth: values.dateOfBirth } : {}),
      ...(values.gender ? { gender: values.gender } : {}),
      requestedDepartmentId: values.requestedDepartmentId,
      faceImages: values.faceImages.map(({ pose, imageUrl, uploadedFileId }) => ({ pose, imageUrl, fileId: uploadedFileId })),
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
      <ScreenContainer>
        <PageHeader title="Kiem tra dang ky" subtitle="API chi duoc goi khi bam gui o buoc cuoi." />
        <SectionCard title="Tai khoan">
          <Text style={styles.rowText}>{values.fullName}</Text>
          <Text style={styles.rowText}>{values.phone}</Text>
          <Text style={styles.rowText}>{values.email || 'Khong co email'}</Text>
        </SectionCard>
        <SectionCard title="Ho so">
          <Text style={styles.rowText}>CCCD: ********{values.idCardNumber.slice(-4)}</Text>
          <Text style={styles.rowText}>Phong ban: {values.requestedDepartmentId || 'Chua chon'}</Text>
          <Text style={styles.rowText}>Anh khuon mat uploaded: {values.faceImages.filter((image) => image.uploadStatus === 'SUCCESS').length}/3</Text>
        </SectionCard>
        {mutation.error ? <Text style={styles.error}>{registrationErrorMessage(mutation.error)}</Text> : null}
        <PrimaryButton onPress={() => void submit()} disabled={!canSubmit} loading={mutation.isPending}>Gui dang ky</PrimaryButton>
      </ScreenContainer>
    </Screen>
  );
}

export function RegistrationSuccessScreen() {
  const router = useRouter();
  return (
    <Screen>
      <ScreenContainer>
        <PageHeader title="Dang ky thanh cong" subtitle="Tai khoan dang cho phe duyet. Ban chua the dang nhap cho toi khi duoc duyet." />
        <PrimaryButton onPress={() => router.replace('/login')}>Quay ve dang nhap</PrimaryButton>
      </ScreenContainer>
    </Screen>
  );
}

function DepartmentOption({ department, selected, onPress }: { department: Department; selected: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[styles.option, selected && styles.optionSelected]}>
      <Text style={styles.optionTitle}>{department.name}</Text>
      <Text style={styles.optionSubtitle}>{department.description ?? department.code}</Text>
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
    DUPLICATE_PHONE: 'So dien thoai da ton tai',
    DUPLICATE_ID_CARD: 'CCCD da ton tai',
    INVALID_FACE_IMAGES: 'Can du anh FRONT, LEFT, RIGHT',
    UPLOAD_FILE_REQUIRED: 'Can upload du 3 anh khuon mat',
    UPLOAD_ALREADY_ATTACHED: 'Anh upload da duoc su dung',
    UPLOAD_NOT_FOUND: 'Khong tim thay file upload',
  };
  return map[normalized.code] ?? mapLoginError(error);
}

function uploadErrorMessage(error: unknown): string {
  const normalized = normalizeApiError(error);
  const map: Record<string, string> = {
    UPLOAD_FILE_TOO_LARGE: 'File qua lon',
    UPLOAD_MIME_NOT_ALLOWED: 'Dinh dang file khong duoc ho tro',
    UPLOAD_SIGNATURE_INVALID: 'Noi dung file khong hop le',
    UPLOAD_STORAGE_FAILED: 'Luu file that bai',
  };
  return map[normalized.code] ?? 'Upload failed';
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
