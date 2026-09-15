import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LevelPromotionRequestItem, levelingApi } from '../../api/leveling.api';
import { LEVEL_COLORS, LevelNameBadge } from '../../components/common/LevelNameBadge';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface LeaderPromotionReviewModalProps {
  visible: boolean;
  request: LevelPromotionRequestItem | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const LeaderPromotionReviewModal: React.FC<LeaderPromotionReviewModalProps> = ({
  visible,
  request,
  onClose,
  onSuccess,
}) => {
  const [leaderNote, setLeaderNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedZoomImage, setSelectedZoomImage] = useState<string | null>(null);

  if (!request) return null;

  const targetColor = LEVEL_COLORS[request.toLevelNumber] || '#4CAF50';
  const userName = request.user?.profile?.fullName || request.user?.userCode || 'Nhân viên';

  const handleAction = async (status: 'APPROVED' | 'REJECTED' | 'SUPPLEMENT_REQUESTED') => {
    try {
      setIsSubmitting(true);
      await levelingApi.reviewPromotionRequest(request.id, {
        status,
        leaderNote: leaderNote.trim() || undefined,
      });

      const msg =
        status === 'APPROVED'
          ? `Đã phê duyệt thăng cấp Level ${request.toLevelNumber} cho ${userName}!`
          : status === 'SUPPLEMENT_REQUESTED'
          ? 'Đã gửi yêu cầu bổ sung bằng chứng tới nhân viên.'
          : 'Đã từ chối đề xuất thăng cấp.';

      Alert.alert('Thành công', msg);
      setLeaderNote('');
      onSuccess();
      onClose();
    } catch (err: any) {
      Alert.alert('Lỗi xử lý', err?.response?.data?.message || err?.message || 'Có lỗi xảy ra');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
        <View style={styles.overlay}>
          <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={styles.title}>Thẩm Định Đề Xuất Lên Cấp</Text>
                <Text style={styles.subtitle}>
                  Phòng: {request.department?.name || 'Phòng ban'} • Mã: #{request.id.slice(0, 8)}
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
              {/* Employee Info Card */}
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Nhân sự:</Text>
                  <LevelNameBadge
                    name={userName}
                    levelNumber={request.fromLevelNumber}
                    size="md"
                  />
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Mục tiêu xét cấp:</Text>
                  <Text style={[styles.targetLevelText, { color: targetColor }]}>
                    Level {request.fromLevelNumber} ➔ Level {request.toLevelNumber}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Ngày nộp:</Text>
                  <Text style={styles.infoValue}>
                    {new Date(request.createdAt).toLocaleDateString('vi-VN', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              </View>

              {/* Submission Note */}
              <Text style={styles.sectionTitle}>1. Báo cáo thành tích của nhân sự:</Text>
              <View style={styles.contentBox}>
                <Text style={styles.contentText}>
                  {request.submissionNote || 'Không có ghi chú tóm tắt'}
                </Text>
              </View>

              {/* Evidence Images */}
              <Text style={styles.sectionTitle}>
                2. Hình ảnh minh chứng ({request.evidenceImages?.length || 0} ảnh):
              </Text>
              {request.evidenceImages && request.evidenceImages.length > 0 ? (
                <View style={styles.imageGrid}>
                  {request.evidenceImages.map((url, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={styles.imageThumbWrapper}
                      onPress={() => setSelectedZoomImage(url)}
                    >
                      <Image source={{ uri: url }} style={styles.imageThumb} />
                      <View style={styles.zoomBadge}>
                        <Ionicons name="scan-outline" size={14} color="#FFF" />
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View style={styles.noImagesBox}>
                  <Text style={styles.noImagesText}>Nhân viên không đính kèm ảnh minh chứng</Text>
                </View>
              )}

              {/* Leader Note Input */}
              <Text style={styles.sectionTitle}>3. Nhận xét & Góp ý của Leader:</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Nhập lý do duyệt hoặc hướng dẫn bổ sung cho nhân viên..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={3}
                value={leaderNote}
                onChangeText={setLeaderNote}
              />
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.footer}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.rejectBtn]}
                onPress={() => handleAction('REJECTED')}
                disabled={isSubmitting}
              >
                <Ionicons name="close-circle-outline" size={18} color="#EF4444" />
                <Text style={styles.rejectBtnText}>Từ chối</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.supplementBtn]}
                onPress={() => handleAction('SUPPLEMENT_REQUESTED')}
                disabled={isSubmitting}
              >
                <Ionicons name="chatbox-ellipses-outline" size={18} color="#D97706" />
                <Text style={styles.supplementBtnText}>Bổ sung</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.approveBtn]}
                onPress={() => handleAction('APPROVED')}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={18} color="#FFF" />
                    <Text style={styles.approveBtnText}>Phê Duyệt</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Lightbox Fullscreen Zoom Modal */}
      {selectedZoomImage && (
        <Modal
          visible={!!selectedZoomImage}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedZoomImage(null)}
        >
          <View style={styles.lightboxOverlay}>
            <TouchableOpacity
              style={styles.lightboxClose}
              onPress={() => setSelectedZoomImage(null)}
            >
              <Ionicons name="close-circle" size={36} color="#FFF" />
            </TouchableOpacity>
            <Image
              source={{ uri: selectedZoomImage }}
              style={styles.lightboxImage}
              resizeMode="contain"
            />
          </View>
        </Modal>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '92%',
    paddingBottom: Platform.OS === 'ios' ? 30 : 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    padding: 16,
  },
  infoCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '600',
  },
  targetLevelText: {
    fontSize: 14,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
    marginTop: 4,
  },
  contentBox: {
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  contentText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  imageThumbWrapper: {
    width: (SCREEN_WIDTH - 32 - 20) / 3,
    height: 100,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  imageThumb: {
    width: '100%',
    height: '100%',
  },
  zoomBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 4,
    borderRadius: 4,
  },
  noImagesBox: {
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  noImagesText: {
    fontSize: 13,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
    minHeight: 70,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 4,
  },
  rejectBtn: {
    flex: 1,
    backgroundColor: '#FEE2E2',
  },
  rejectBtnText: {
    color: '#DC2626',
    fontWeight: '700',
    fontSize: 13,
  },
  supplementBtn: {
    flex: 1.1,
    backgroundColor: '#FEF3C7',
  },
  supplementBtnText: {
    color: '#D97706',
    fontWeight: '700',
    fontSize: 13,
  },
  approveBtn: {
    flex: 1.4,
    backgroundColor: '#16A34A',
  },
  approveBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
  lightboxOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lightboxClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
  },
  lightboxImage: {
    width: '95%',
    height: '80%',
  },
});
