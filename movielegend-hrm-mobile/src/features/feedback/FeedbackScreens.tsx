import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useCallback } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View, Pressable, ActivityIndicator, Switch, TextInput, RefreshControl, Image, StatusBar } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { uploadFile } from '../../api/uploads.api';
import { useQueryClient } from '@tanstack/react-query';
import { apiUrl } from '../../constants/env';
import { useAppAlert } from '../../contexts/AlertContext';
import ImageView from '../../components/ImageViewer/ImageViewer';

// --- My Feedback List Screen ---
export function MyFeedbackListScreen({ basePath = '/employee' }: { basePath?: string }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [statusFilter, setStatusFilter] = useState<FeedbackStatus | undefined>(undefined);
  const feedbacksQuery = useMyFeedbacks({ status: statusFilter });

  const filterOptions: { label: string; value: FeedbackStatus | undefined }[] = [
    { label: 'Tất cả', value: undefined },
    { label: 'Đã gửi', value: 'SEND' },
    { label: 'Đang xem xét', value: 'REVIEWED' },
    { label: 'Đã giải quyết', value: 'RESOLVED' },
    { label: 'Từ chối', value: 'REJECTED' },
  ];

  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries();
    setRefreshing(false);
  }, [queryClient]);

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <StatusBar barStyle="light-content" backgroundColor="#1B3B2B" />
      {/* Top Forest Green Header */}
      <View style={{
        backgroundColor: '#1B3B2B',
        paddingTop: Math.max(insets.top, 16),
        paddingBottom: 20,
        paddingHorizontal: 16,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/leader')} style={{ paddingRight: 10, paddingVertical: 4 }}>
            <MaterialCommunityIcons name="chevron-left" size={28} color="#FFFFFF" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.7)', letterSpacing: 0.8, textTransform: 'uppercase' }}>
              MOVIE LEGEND
            </Text>
            <Text style={{ fontSize: 24, fontWeight: '800', color: '#FFFFFF', marginTop: 2 }}>
              Góp ý
            </Text>
            <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 2 }}>
              Lịch sử góp ý và phản hồi của bạn
            </Text>
          </View>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: Math.max(insets.bottom + 80, 90),
        }} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />}
      >
        {/* Action Button: Tạo góp ý mới */}
        <Pressable
          onPress={() => router.push(`${basePath}/feedbacks/create` as any)}
          style={{
            backgroundColor: '#1B3B2B',
            height: 48,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            gap: 8,
            marginBottom: 16,
          }}
        >
          <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
          <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '700' }}>Tạo góp ý mới</Text>
        </Pressable>

        {/* Filter Tabs (Wrapped Pills) */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
          {filterOptions.map((opt, i) => {
            const isActive = statusFilter === opt.value;
            return (
              <Pressable
                key={i}
                onPress={() => setStatusFilter(opt.value)}
                style={{
                  paddingHorizontal: 18,
                  paddingVertical: 8,
                  borderRadius: 20,
                  backgroundColor: isActive ? '#1B3B2B' : '#FFFFFF',
                  borderWidth: 1,
                  borderColor: isActive ? '#1B3B2B' : '#E2E8F0',
                }}
              >
                <Text style={{
                  color: isActive ? '#FFFFFF' : '#334155',
                  fontWeight: '600',
                  fontSize: 13,
                }}>
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* List Content or Empty State */}
        <View style={{ gap: 12 }}>
          {feedbacksQuery.isLoading ? (
            <ActivityIndicator style={{ marginVertical: 30 }} color="#1B3B2B" />
          ) : !feedbacksQuery.data || !feedbacksQuery.data.items || feedbacksQuery.data.items.length === 0 ? (
            <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 40 }}>
              {/* Illustrated mint circle */}
              <View style={{
                width: 140,
                height: 140,
                borderRadius: 70,
                backgroundColor: '#E6F4EA',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <MaterialCommunityIcons name="comment-text-multiple-outline" size={60} color="#166534" />
              </View>

              <Text style={{
                fontSize: 17,
                fontWeight: '700',
                color: '#0F172A',
                marginTop: 24,
                textAlign: 'center',
              }}>
                Chưa có góp ý nào
              </Text>
              <Text style={{
                fontSize: 14,
                color: '#64748B',
                marginTop: 8,
                textAlign: 'center',
              }}>
                Gửi góp ý để chia sẻ ý kiến của bạn.
              </Text>
            </View>
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
    </View>
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
  const insets = useSafeAreaInsets();
  const mutation = useCreateFeedback();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [viewerVisible, setViewerVisible] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<CreateFeedbackForm>({
    resolver: zodResolver(createFeedbackSchema),
    defaultValues: {
      title: '',
      content: '',
      isAnonymous: false,
    }
  });

  const { showAlert } = useAppAlert();

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
        imgUrl = uploaded.fileUrl || (uploaded as any).url;
      }
      setIsUploading(false);

      await mutation.mutateAsync({ ...data, img: imgUrl });
      Toast.show({ type: 'success', text1: 'Đã gửi góp ý thành công' });
      router.back();
    } catch (error) {
      setIsUploading(false);
      const normalized = normalizeApiError(error);
      showAlert('Lỗi', normalized.message);
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
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <StatusBar barStyle="light-content" backgroundColor="#1B3B2B" />
      {/* Top Forest Green Header */}
      <View style={{
        backgroundColor: '#1B3B2B',
        paddingTop: Math.max(insets.top, 16),
        paddingBottom: 20,
        paddingHorizontal: 16,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Pressable onPress={() => router.back()} style={{ paddingRight: 10, paddingVertical: 4 }}>
            <MaterialCommunityIcons name="chevron-left" size={28} color="#FFFFFF" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.7)', letterSpacing: 0.8, textTransform: 'uppercase' }}>
              MOVIE LEGEND
            </Text>
            <Text style={{ fontSize: 24, fontWeight: '800', color: '#FFFFFF', marginTop: 2 }}>
              Gửi góp ý mới
            </Text>
            <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 2 }}>
              Đóng góp ý kiến để xây dựng môi trường tốt hơn
            </Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: Math.max(insets.bottom + 40, 50) }} showsVerticalScrollIndicator={false}>
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
                trackColor={{ false: '#E5E7EB', true: '#1B3B2B' }}
                thumbColor={'#FFFFFF'}
              />
            )}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Ảnh đính kèm (Tùy chọn)</Text>
          {imageUri ? (
            <View style={{ position: 'relative', alignSelf: 'flex-start', marginTop: 8 }}>
              <Pressable onPress={() => setViewerVisible(true)} style={{ borderRadius: 8, overflow: 'hidden' }}>
                <Image source={{ uri: imageUri }} style={{ width: 100, height: 100, borderRadius: 8 }} />
              </Pressable>
              <Pressable
                onPress={() => setImageUri(null)}
                style={{ position: 'absolute', top: -8, right: -8, backgroundColor: '#FFF', borderRadius: 12, padding: 2, zIndex: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2, elevation: 3 }}
              >
                <Ionicons name="close-circle" size={24} color={colors.danger} />
              </Pressable>
            </View>
          ) : (
            <Pressable onPress={pickImage} style={styles.uploadBtn}>
              <Ionicons name="image-outline" size={24} color="#166534" />
              <Text style={{ color: '#166534', fontWeight: '600', marginLeft: 8 }}>Chọn ảnh tải lên</Text>
            </Pressable>
          )}
        </View>

        <View style={{ marginTop: 20 }}>
          <Pressable
            style={{
              height: 48,
              borderRadius: 12,
              backgroundColor: '#1B3B2B',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            disabled={mutation.isPending || isUploading}
            onPress={handleSubmit(onSubmit)}
          >
            {mutation.isPending || isUploading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 15 }}>Gửi đi</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>

      {imageUri ? (
        <ImageView
          images={[{ uri: imageUri }]}
          imageIndex={0}
          visible={viewerVisible}
          onRequestClose={() => setViewerVisible(false)}
        />
      ) : null}
    </View>
  );
}

// --- Feedback Detail Screen ---

export function FeedbackDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: feedback, isLoading, isError } = useFeedbackDetail(id);
  const [viewerVisible, setViewerVisible] = useState(false);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' }}>
        <ActivityIndicator size="large" color="#1B3B2B" />
      </View>
    );
  }

  if (isError || !feedback) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
        <StatusBar barStyle="light-content" backgroundColor="#1B3B2B" />
        <View style={{
          backgroundColor: '#1B3B2B',
          paddingTop: Math.max(insets.top, 16),
          paddingBottom: 20,
          paddingHorizontal: 16,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Pressable onPress={() => router.back()} style={{ paddingRight: 10, paddingVertical: 4 }}>
              <MaterialCommunityIcons name="chevron-left" size={28} color="#FFFFFF" />
            </Pressable>
            <Text style={{ fontSize: 20, fontWeight: '800', color: '#FFFFFF' }}>Chi tiết góp ý</Text>
          </View>
        </View>
        <EmptyState title="Lỗi" message="Không thể tải dữ liệu góp ý" />
      </View>
    );
  }

  const dateStr = new Date(feedback.createdAt).toLocaleDateString('vi-VN', {
    hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric'
  });

  const fullImageUrl = feedback.img
    ? feedback.img.startsWith('http')
      ? feedback.img
      : `${apiUrl.replace(/\/api\/v1\/?$/, '')}${feedback.img.startsWith('/') ? '' : '/'}${feedback.img}`
    : null;

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <StatusBar barStyle="light-content" backgroundColor="#1B3B2B" />
      {/* Top Forest Green Header */}
      <View style={{
        backgroundColor: '#1B3B2B',
        paddingTop: Math.max(insets.top, 16),
        paddingBottom: 20,
        paddingHorizontal: 16,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Pressable onPress={() => router.back()} style={{ paddingRight: 10, paddingVertical: 4 }}>
            <MaterialCommunityIcons name="chevron-left" size={28} color="#FFFFFF" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.7)', letterSpacing: 0.8, textTransform: 'uppercase' }}>
              MOVIE LEGEND
            </Text>
            <Text style={{ fontSize: 24, fontWeight: '800', color: '#FFFFFF', marginTop: 2 }}>
              Chi tiết góp ý
            </Text>
            <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 2 }}>
              Thông tin và phản hồi từ quản lý
            </Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: Math.max(insets.bottom + 40, 50) }} showsVerticalScrollIndicator={false}>
        <View style={styles.detailCard}>
          <Text style={styles.detailTitle}>{feedback.title}</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 12 }}>
            <Text style={{ fontSize: 13, color: colors.muted }}>{dateStr}</Text>
            <FeedbackStatusBadge status={feedback.status} />
          </View>

          <View style={styles.divider} />

          <Text style={styles.label}>Nội dung:</Text>
          <Text style={styles.detailContent}>{feedback.content}</Text>

          {fullImageUrl && (
            <View style={{ marginTop: 12 }}>
              <Text style={styles.label}>Ảnh đính kèm:</Text>
              <Pressable onPress={() => setViewerVisible(true)} style={{ borderRadius: 12, overflow: 'hidden', marginTop: 6 }}>
                <Image 
                  source={{ uri: fullImageUrl }} 
                  style={{ width: '100%', height: 220, borderRadius: 12, resizeMode: 'cover' }} 
                />
              </Pressable>
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

      {fullImageUrl && (
        <ImageView
          images={[{ uri: fullImageUrl }]}
          imageIndex={0}
          visible={viewerVisible}
          onRequestClose={() => setViewerVisible(false)}
        />
      )}
    </View>
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
