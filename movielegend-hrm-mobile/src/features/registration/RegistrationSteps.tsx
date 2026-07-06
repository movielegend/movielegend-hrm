import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
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
      <ScreenContainer>
        <PageHeader title="Dang ky tai khoan" subtitle="Tai khoan moi se duoc gui toi leader hoac admin de phe duyet." />
        <SectionCard title="Quy trinh">
          {['Thong tin tai khoan', 'Ho so ca nhan', 'Chon phong ban', 'Chup khuon mat', 'Kiem tra va gui'].map((item) => (
            <Text key={item} style={styles.rowText}>{item}</Text>
          ))}
        </SectionCard>
        <PrimaryButton onPress={() => router.push('/register/profile')} accessibilityLabel="Bat dau dang ky">
          Bat dau
        </PrimaryButton>
      </ScreenContainer>
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
    router.push('/register/profile');
  });
  return (
    <Screen>
      <ScreenContainer>
        <PageHeader title="Thong tin tai khoan" subtitle="Dung so dien thoai de dang nhap sau khi tai khoan duoc duyet." />
        <Controller control={control} name="fullName" render={({ field }) => <FormField label="Ho ten" value={field.value} onChangeText={field.onChange} error={errors.fullName?.message} />} />
        <Controller control={control} name="phone" render={({ field }) => <FormField keyboardType="phone-pad" label="So dien thoai" value={field.value} onChangeText={field.onChange} error={errors.phone?.message} />} />
        <Controller control={control} name="email" render={({ field }) => <FormField autoCapitalize="none" keyboardType="email-address" label="Email" value={field.value} onChangeText={field.onChange} error={errors.email?.message} />} />
        <Controller control={control} name="password" render={({ field }) => <FormField secureTextEntry label="Mat khau" value={field.value} onChangeText={field.onChange} error={errors.password?.message} />} />
        <Controller control={control} name="confirmPassword" render={({ field }) => <FormField secureTextEntry label="Nhap lai mat khau" value={field.value} onChangeText={field.onChange} error={errors.confirmPassword?.message} />} />
        <PrimaryButton onPress={submit}>Tiep tuc</PrimaryButton>
      </ScreenContainer>
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
      <ScreenContainer>
        <PageHeader title="Ho so ca nhan" subtitle="Thong tin nay phuc vu doi chieu khi duyet tai khoan." />
        <Controller control={control} name="idCardNumber" render={({ field }) => <FormField label="CCCD" value={field.value} onChangeText={field.onChange} error={errors.idCardNumber?.message} />} />
        <Controller control={control} name="dateOfBirth" render={({ field }) => <FormField label="Ngay sinh" placeholder="YYYY-MM-DD" value={field.value} onChangeText={field.onChange} error={errors.dateOfBirth?.message} />} />
        <Controller control={control} name="gender" render={({ field }) => <FormField label="Gioi tinh" placeholder="MALE / FEMALE / OTHER" value={field.value} onChangeText={field.onChange} error={errors.gender?.message} />} />
        <PrimaryButton onPress={submit}>Tiep tuc</PrimaryButton>
      </ScreenContainer>
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
  const activeDepartments = departments.data?.items.filter((department) => department.isActive) ?? [];
  return (
    <Screen>
      <ScreenContainer>
        <PageHeader title="Chon phong ban" subtitle="Danh sach lay truc tiep tu backend." />
        <SearchInput value={search} onChangeText={setSearch} placeholder="Tim phong ban" />
        {departments.isLoading ? <LoadingState /> : null}
        {departments.isError ? <ErrorState error={departments.error} onRetry={() => void departments.refetch()} /> : null}
        {!departments.isLoading && !activeDepartments.length ? <EmptyState title="Khong co phong ban active" /> : null}
        {activeDepartments.map((department) => (
          <DepartmentOption key={department.id} department={department} selected={selectedId === department.id} onPress={() => setValue('requestedDepartmentId', department.id, { shouldValidate: true })} />
        ))}
        {errors.requestedDepartmentId ? <Text style={styles.error}>{errors.requestedDepartmentId.message}</Text> : null}
        <PrimaryButton onPress={submit}>Tiep tuc</PrimaryButton>
      </ScreenContainer>
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
        <ScreenContainer>
          <PageHeader title="Quyen camera" subtitle="Can quyen camera de chup du FRONT, LEFT, RIGHT." />
          <PrimaryButton onPress={() => void requestPermission()}>Cap quyen camera</PrimaryButton>
        </ScreenContainer>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.cameraPage}>
        <CameraView ref={cameraRef} active facing="front" mirror style={StyleSheet.absoluteFill} onMountError={() => setCaptureError('Camera khong kha dung tren thiet bi nay')} />
        <View pointerEvents="box-none" style={styles.cameraOverlay}>
          <PageHeader title={facePoseLabels[activePose]} subtitle="Can khuon mat ro, du sang, khong che mat." />
          <View style={styles.poseRow}>
            {poses.map((pose) => {
              const image = values.faceImages.find((item) => item.pose === pose);
              return <StatusBadge key={pose} label={pose} tone={image?.uploadStatus === 'SUCCESS' ? 'success' : pose === activePose ? 'info' : image?.uploadStatus === 'FAILED' ? 'danger' : 'neutral'} />;
            })}
          </View>
          {currentImage?.previewUri ? <Image source={{ uri: currentImage.previewUri }} style={styles.preview} /> : null}
          {currentImage?.uploadStatus === 'UPLOADING' ? <Text style={styles.rowText}>Upload: {currentImage.uploadProgress ?? 0}%</Text> : null}
          {currentImage?.uploadError ? <Text style={styles.cameraError}>{currentImage.uploadError}</Text> : null}
          {captureError ? <Text style={styles.cameraError}>{captureError}</Text> : null}
          <View style={styles.cameraActions}>
            <SecondaryButton onPress={capture} loading={capturing}>Chup lai</SecondaryButton>
            {currentImage?.uploadStatus === 'UPLOADING' ? <SecondaryButton onPress={() => uploadAbortRef.current?.abort()}>Cancel upload</SecondaryButton> : null}
            {currentImage?.localUri && currentImage.uploadStatus !== 'SUCCESS' && currentImage.uploadStatus !== 'UPLOADING' ? <SecondaryButton onPress={() => void retryUpload(currentImage)} loading={capturing}>Retry pose</SecondaryButton> : null}
            <PrimaryButton onPress={() => setActivePose(nextPose(activePose))} disabled={activePose === 'RIGHT' && !complete}>Pose tiep</PrimaryButton>
          </View>
          <PrimaryButton onPress={() => router.push('/register/review')} disabled={!complete}>Kiem tra thong tin</PrimaryButton>
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
