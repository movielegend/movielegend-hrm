import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View, Pressable, ActivityIndicator, Switch, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Toast from 'react-native-toast-message';

import { EmptyState } from '../../components/EmptyState';
import { PageHeader } from '../../components/PageHeader';
import { PrimaryButton } from '../../components/Buttons';
import { Screen } from '../../components/Screen';
import { colors } from '../../theme/colors';
import { useMyFeedbacks, useCreateFeedback, useFeedbackDetail } from '../../hooks/useFeedback';
import { FeedbackCard } from './components/FeedbackCard';
import { FeedbackStatusBadge } from './components/FeedbackStatusBadge';
import { normalizeApiError } from '../../utils/api-error';
import type { FeedbackStatus } from '../../types/feedback.types';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'react-native';
import { uploadFile } from '../../api/uploads.api';

// --- My Feedback List Screen ---
export function MyFeedbackListScreen({ basePath = '/employee' }: { basePath?: string }) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<FeedbackStatus | undefined>(undefined);
  const feedbacksQuery = useMyFeedbacks({ status: statusFilter });

  const filterOptions: { label: string; value: FeedbackStatus | undefined }[] = [
    { label: 'Tất cả', value: undefined },
    { label: 'Đã gửi', value: 'SEND' },
    { label: 'Đang xem xét', value: 'REVIEWED' },
    { label: 'Đã giải quyết', value: 'RESOLVED' },
    { label: 'Từ chối', value: 'REJECTED' },
  ];

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <PageHeader title="Góp ý" subtitle="Lịch sử các góp ý và phản hồi của bạn" />

        <View style={{ marginBottom: 24 }}>
          <Pressable
            onPress={() => router.push(`${basePath}/feedbacks/create` as any)}
            style={{ backgroundColor: '#000', padding: 16, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
          >
            <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
            <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>Tạo góp ý mới</Text>
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {filterOptions.map((opt, i) => {
              const isActive = statusFilter === opt.value;
              return (
                <Pressable
                  key={i}
                  onPress={() => setStatusFilter(opt.value)}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 20,
                    backgroundColor: isActive ? '#000' : '#FFF',
                    borderWidth: 1,
                    borderColor: isActive ? '#000' : '#E5E7EB',
                  }}
                >
                  <Text style={{ color: isActive ? '#FFF' : '#111827', fontWeight: '600' }}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        <View style={{ gap: 12 }}>
          {feedbacksQuery.isLoading ? (
            <ActivityIndicator style={{ marginVertical: 20 }} color="#000" />
          ) : !feedbacksQuery.data || !feedbacksQuery.data.items || feedbacksQuery.data.items.length === 0 ? (
            <EmptyState title="Trống" message="Chưa có góp ý nào." />
          ) : (
            feedbacksQuery.data.items?.map((fb) => (
              <FeedbackCard
                key={fb.id}
                feedback={fb}
                onPress={() => router.push(`${basePath}/feedbacks/${fb.id}` as any)}
              />
            ))
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

// --- Create Feedback Screen ---

const createFeedbackSchema = z.object({
  title: z.string().min(1, 'Vui lòng nhập tiêu đề').max(100, 'Tiêu đề quá dài'),
  content: z.string().min(1, 'Vui lòng nhập nội dung').max(2000, 'Nội dung quá dài'),
  isAnonymous: z.boolean().default(false),
  img: z.string().optional(),
});
type CreateFeedbackForm = z.infer<typeof createFeedbackSchema>;

export function CreateFeedbackScreen() {
  const router = useRouter();
  const mutation = useCreateFeedback();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<CreateFeedbackForm>({
    resolver: zodResolver(createFeedbackSchema),
    defaultValues: {
      title: '',
      content: '',
      isAnonymous: false,
    }
  });

  const onSubmit = async (data: CreateFeedbackForm) => {
    try {
      setIsUploading(true);
      let imgUrl = data.img;
      if (imageUri) {
        const uploaded = await uploadFile({
          uri: imageUri,
          name: imageUri.split('/').pop() || 'feedback-img.jpg',
          mimeType: 'image/jpeg',
          purpose: 'ASSET_INCIDENT',
        });
        imgUrl = uploaded.url;
      }
      setIsUploading(false);

      await mutation.mutateAsync({ ...data, img: imgUrl });
      Toast.show({ type: 'success', text1: 'Đã gửi góp ý thành công' });
      router.back();
    } catch (error) {
      setIsUploading(false);
      const normalized = normalizeApiError(error);
      Alert.alert('Lỗi', normalized.message);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <PageHeader title="Gửi góp ý mới" subtitle="Đóng góp ý kiến để xây dựng môi trường làm việc tốt hơn" />

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Tiêu đề <Text style={{ color: colors.danger }}>*</Text></Text>
          <Controller
            control={control}
            name="title"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, errors.title && styles.inputError]}
                placeholder="Nhập tiêu đề góp ý"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />
          {errors.title && <Text style={styles.errorText}>{errors.title.message}</Text>}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nội dung <Text style={{ color: colors.danger }}>*</Text></Text>
          <Controller
            control={control}
            name="content"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, styles.textArea, errors.content && styles.inputError]}
                placeholder="Trình bày nội dung chi tiết..."
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            )}
          />
          {errors.content && <Text style={styles.errorText}>{errors.content.message}</Text>}
        </View>

        <View style={styles.switchGroup}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '500', color: '#111827', fontSize: 15 }}>Gửi ẩn danh</Text>
          </View>
          <Controller
            control={control}
            name="isAnonymous"
            render={({ field }) => (
              <Switch
                value={field.value}
                onValueChange={field.onChange}
                trackColor={{ false: '#E5E7EB', true: '#000' }}
                thumbColor={'#FFFFFF'}
              />
            )}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Ảnh đính kèm (Tùy chọn)</Text>
          {imageUri ? (
            <View style={{ position: 'relative', alignSelf: 'flex-start', marginTop: 8 }}>
              <Image source={{ uri: imageUri }} style={{ width: 100, height: 100, borderRadius: 8 }} />
              <Pressable
                onPress={() => setImageUri(null)}
                style={{ position: 'absolute', top: -8, right: -8, backgroundColor: '#FFF', borderRadius: 12, padding: 2 }}
              >
                <Ionicons name="close-circle" size={24} color={colors.danger} />
              </Pressable>
            </View>
          ) : (
            <Pressable onPress={pickImage} style={styles.uploadBtn}>
              <Ionicons name="image-outline" size={24} color={colors.primary} />
              <Text style={{ color: colors.primary, fontWeight: '500', marginLeft: 8 }}>Chọn ảnh tải lên</Text>
            </Pressable>
          )}
        </View>

        <View style={{ marginTop: 24, }}>
          <PrimaryButton 
            onPress={handleSubmit(onSubmit)} 
            loading={mutation.isPending || isUploading} 
          >
            Gửi đi
          </PrimaryButton>
        </View>
      </ScrollView>
    </Screen>
  );
}

// --- Feedback Detail Screen ---

export function FeedbackDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: feedback, isLoading, isError } = useFeedbackDetail(id);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (isError || !feedback) {
    return (
      <Screen>
        <EmptyState title="Lỗi" message="Không thể tải dữ liệu góp ý" />
      </Screen>
    );
  }

  const dateStr = new Date(feedback.createdAt).toLocaleDateString('vi-VN', {
    hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric'
  });

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={styles.detailCard}>
          <Text style={styles.detailTitle}>{feedback.title}</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 12 }}>
            <Text style={{ fontSize: 13, color: colors.muted }}>{dateStr}</Text>
            <FeedbackStatusBadge status={feedback.status} />
          </View>

          <View style={styles.divider} />

          <Text style={styles.label}>Nội dung:</Text>
          <Text style={styles.detailContent}>{feedback.content}</Text>

          {feedback.img && (
            <View style={{ marginTop: 12 }}>
              <Text style={styles.label}>Ảnh đính kèm:</Text>
              <Image source={{ uri: feedback.img }} style={{ width: '100%', height: 200, borderRadius: 8, marginTop: 4, resizeMode: 'cover' }} />
            </View>
          )}

          <View style={{ marginTop: 12 }}>
            <Text style={styles.label}>Chế độ:</Text>
            <Text style={{ fontSize: 14, color: feedback.isAnonymous ? colors.warning : colors.text }}>
              {feedback.isAnonymous ? 'Gửi ẩn danh' : 'Hiển thị danh tính'}
            </Text>
          </View>

          {feedback.reason && (
            <View style={styles.reasonBox}>
              <Text style={{ fontWeight: '700', color: colors.primaryDark, marginBottom: 4 }}>Phản hồi từ quản lý:</Text>
              <Text style={{ color: colors.text, lineHeight: 20 }}>{feedback.reason}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  inputGroup: {
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
  },
  inputError: {
    borderColor: colors.danger,
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
    marginTop: 4,
  },
  textArea: {
    height: 120,
  },
  switchGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    marginTop: 8,
  },
  detailCard: {
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    lineHeight: 28,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 16,
  },
  detailContent: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 24,
    marginTop: 4,
  },
  reasonBox: {
    marginTop: 20,
    backgroundColor: colors.primarySoft,
    padding: 16,
    borderRadius: 12,
  }
});
