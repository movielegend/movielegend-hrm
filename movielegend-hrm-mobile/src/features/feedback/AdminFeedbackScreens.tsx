import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View, Pressable, ActivityIndicator, TextInput, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

import { EmptyState } from '../../components/EmptyState';
import { PageHeader } from '../../components/PageHeader';
import { PrimaryButton, SecondaryButton } from '../../components/Buttons';
import { Screen } from '../../components/Screen';
import { colors } from '../../theme/colors';
import { useFeedbacksForManagement, useFeedbackDetail, useUpdateFeedbackStatus, useFeedbackStats } from '../../hooks/useFeedback';
import { FeedbackCard } from './components/FeedbackCard';
import { FeedbackStatusBadge } from './components/FeedbackStatusBadge';
import { normalizeApiError } from '../../utils/api-error';
import type { FeedbackStatus } from '../../types/feedback.types';

export function AdminFeedbackListScreen() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<FeedbackStatus | undefined>(undefined);
  const feedbacksQuery = useFeedbacksForManagement({ status: statusFilter });
  const statsQuery = useFeedbackStats();

  const filterOptions: { label: string; value: FeedbackStatus | undefined }[] = [
    { label: 'Tất cả', value: undefined },
    { label: 'Chờ duyệt', value: 'SEND' },
    { label: 'Đang xem xét', value: 'REVIEWED' },
    { label: 'Đã giải quyết', value: 'RESOLVED' },
    { label: 'Từ chối', value: 'REJECTED' },
  ];

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <PageHeader title="Quản lý góp ý" subtitle="Xem và phản hồi ý kiến từ nhân viên" />
        
        {statsQuery.data && (
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{statsQuery.data.total}</Text>
              <Text style={styles.statLabel}>Tổng cộng</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statNumber, { color: colors.info }]}>{statsQuery.data.byStatus.SEND || 0}</Text>
              <Text style={styles.statLabel}>Chờ duyệt</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statNumber, { color: colors.warning }]}>{statsQuery.data.byStatus.REVIEWED || 0}</Text>
              <Text style={styles.statLabel}>Đang xem</Text>
            </View>
          </View>
        )}

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
                    backgroundColor: isActive ? colors.primary : colors.surface,
                    borderWidth: 1,
                    borderColor: isActive ? colors.primary : colors.border,
                  }}
                >
                  <Text style={{ color: isActive ? '#FFF' : colors.text, fontWeight: '600' }}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        <View style={{ gap: 12 }}>
          {feedbacksQuery.isLoading ? (
            <ActivityIndicator style={{ marginVertical: 20 }} color={colors.primary} />
          ) : feedbacksQuery.data?.data.length === 0 ? (
            <EmptyState title="Trống" message="Chưa có góp ý nào." />
          ) : (
            feedbacksQuery.data?.data.map((fb) => (
              <FeedbackCard 
                key={fb.id} 
                feedback={fb} 
                isAdmin
                onPress={() => router.push(`/admin/feedbacks/${fb.id}` as any)} 
              />
            ))
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

export function AdminFeedbackDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: feedback, isLoading, isError } = useFeedbackDetail(id);
  const updateMutation = useUpdateFeedbackStatus();
  
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<FeedbackStatus>('REVIEWED');
  const [reason, setReason] = useState('');

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

  const handleUpdate = async () => {
    try {
      await updateMutation.mutateAsync({ id, data: { status: selectedStatus, reason } });
      Toast.show({ type: 'success', text1: 'Đã cập nhật trạng thái' });
      setModalVisible(false);
    } catch (error) {
      Alert.alert('Lỗi', normalizeApiError(error).message);
    }
  };

  const openModal = (status: FeedbackStatus) => {
    setSelectedStatus(status);
    setReason(feedback.reason || '');
    setModalVisible(true);
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <View style={styles.detailCard}>
          <Text style={styles.detailTitle}>{feedback.title}</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 12 }}>
            <Text style={{ fontSize: 13, color: colors.muted }}>{dateStr}</Text>
            <FeedbackStatusBadge status={feedback.status} />
          </View>

          <View style={styles.divider} />

          <Text style={styles.label}>Người gửi:</Text>
          <Text style={{ fontSize: 15, fontWeight: '500', color: colors.primaryDark, marginBottom: 12 }}>
            {feedback.isAnonymous ? 'Thư ẩn danh (Không xác định)' : (feedback.senderDisplayName || 'Không rõ')}
          </Text>

          <Text style={styles.label}>Nội dung:</Text>
          <Text style={styles.detailContent}>{feedback.content}</Text>
          
          {feedback.img && (
            <View style={{ marginTop: 12 }}>
              <Text style={styles.label}>Ảnh đính kèm:</Text>
              <Image source={{ uri: feedback.img }} style={{ width: '100%', height: 200, borderRadius: 8, marginTop: 4, resizeMode: 'cover' }} />
            </View>
          )}

          {feedback.reason && (
            <View style={styles.reasonBox}>
              <Text style={{ fontWeight: '700', color: colors.primaryDark, marginBottom: 4 }}>Phản hồi hiện tại:</Text>
              <Text style={{ color: colors.text, lineHeight: 20 }}>{feedback.reason}</Text>
            </View>
          )}
        </View>
        
        <View style={{ marginTop: 24, gap: 12 }}>
          <Text style={styles.label}>Cập nhật trạng thái:</Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Pressable style={[styles.actionBtn, { backgroundColor: colors.info }]} onPress={() => openModal('REVIEWED')}>
              <Text style={styles.actionBtnText}>Đang xem xét</Text>
            </Pressable>
            <Pressable style={[styles.actionBtn, { backgroundColor: colors.success }]} onPress={() => openModal('RESOLVED')}>
              <Text style={styles.actionBtnText}>Đã giải quyết</Text>
            </Pressable>
            <Pressable style={[styles.actionBtn, { backgroundColor: colors.danger }]} onPress={() => openModal('REJECTED')}>
              <Text style={styles.actionBtnText}>Từ chối</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Phản hồi ({selectedStatus})</Text>
            
            <Text style={styles.label}>Ghi chú / Lý do phản hồi:</Text>
            <TextInput
              style={[styles.input, { height: 100 }]}
              placeholder="Nhập phản hồi cho người dùng..."
              multiline
              textAlignVertical="top"
              value={reason}
              onChangeText={setReason}
            />
            
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
              <View style={{ flex: 1 }}>
                <SecondaryButton onPress={() => setModalVisible(false)}>Hủy</SecondaryButton>
              </View>
              <View style={{ flex: 1 }}>
                <PrimaryButton onPress={handleUpdate} loading={updateMutation.isPending}>
                  Xác nhận
                </PrimaryButton>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 4,
  },
  detailCard: {
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
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
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  detailContent: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 24,
    marginBottom: 16,
  },
  reasonBox: {
    marginTop: 12,
    backgroundColor: colors.primarySoft,
    padding: 16,
    borderRadius: 12,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.surface,
    padding: 24,
    borderRadius: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
  }
});
