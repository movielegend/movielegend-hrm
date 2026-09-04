import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Modal,
  TextInput,
  StatusBar,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../providers/AuthProvider';
import {
  useLevelProjects,
  BulletSubTask,
  LevelDepartmentProject,
} from './levelProjectsStore';

export const EmployeeLevelProjectScreen: React.FC = () => {
  const { user } = useAuth();
  const empDeptId = (user as any)?.departmentId || user?.department?.id;
  const empDeptName = user?.department?.name || (user as any)?.departmentName;

  const { getAssignedSubTasksForUser, submitSubTask } = useLevelProjects(empDeptId, empDeptName);

  const currentUserId = user?.id;
  const currentUserName = user?.fullName || user?.userCode || '';

  // Real-time reactive assigned subtasks for this employee
  const assignedItems = getAssignedSubTasksForUser(currentUserId, currentUserName);

  // Selected item modal for viewing details / submitting result
  const [activeItem, setActiveItem] = useState<{
    project: LevelDepartmentProject;
    subTask: BulletSubTask;
  } | null>(null);

  const [resultText, setResultText] = useState('');
  const [evidenceLink, setEvidenceLink] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const handleOpenDetail = (item: {
    project: LevelDepartmentProject;
    subTask: BulletSubTask;
  }) => {
    setActiveItem(item);
    setResultText(item.subTask.submissionNote || '');
    setEvidenceLink(item.subTask.evidenceUrl || '');
    setSelectedImages(item.subTask.evidenceImages || []);
  };

  // Image Picker action
  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets) {
        const newUris = result.assets.map((a) => a.uri);
        setSelectedImages((prev) => [...prev, ...newUris]);
      }
    } catch {
      Alert.alert('Thông báo', 'Không thể mở thư viện ảnh');
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setSelectedImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleConfirmSubmit = () => {
    if (!activeItem) return;
    if (!resultText.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tóm tắt báo cáo kết quả thực hiện');
      return;
    }

    submitSubTask(
      activeItem.project.levelNumber,
      activeItem.subTask.id,
      resultText.trim(),
      evidenceLink.trim() || undefined,
      selectedImages
    );

    setActiveItem(null);
    Alert.alert('Thành Công', 'Đã nộp báo cáo và minh chứng cho Leader duyệt Vòng 1.');
  };

  const totalTasks = assignedItems.length;
  const approvedTasks = assignedItems.filter((i) => i.subTask.status === 'LEADER_APPROVED').length;
  const progressPercent = totalTasks > 0 ? Math.round((approvedTasks / totalTasks) * 100) : 0;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.topSafeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#0F766E" />

        {/* Top Header with Deep Teal Background */}
        <View style={styles.topHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Nhiệm Vụ Cấp Bậc</Text>
          </View>
        </View>
      </SafeAreaView>

      <View style={styles.bodyWrapper}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Simple Progress Header */}
        <View style={styles.summaryBox}>
          <View style={styles.summaryTopRow}>
            <Text style={styles.summaryLabel}>Tiến độ thăng cấp</Text>
            <Text style={styles.summaryPercent}>{approvedTasks}/{totalTasks} hoàn thành</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
          </View>
        </View>

        {/* Assigned Subtasks List */}
        <View style={styles.listContainer}>
          {assignedItems.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Chưa có việc nào được giao</Text>
              <Text style={styles.emptySub}>
                Khi Leader phân công việc con cho bạn, danh sách sẽ tự động xuất hiện tại đây.
              </Text>
            </View>
          ) : (
            assignedItems.map((item) => {
              const { project, subTask } = item;
              const isApproved = subTask.status === 'LEADER_APPROVED';
              const isSubmitted = subTask.status === 'SUBMITTED';

              return (
                <TouchableOpacity
                  key={subTask.id}
                  style={[
                    styles.taskRow,
                    isSubmitted && styles.taskRowSubmitted,
                  ]}
                  onPress={() => handleOpenDetail(item)}
                  activeOpacity={0.7}
                >
                  {/* Index / Done indicator */}
                  <View style={styles.indexCircle}>
                    <Text
                      style={[
                        styles.indexText,
                        isApproved && { color: '#059669', fontWeight: 'bold' },
                        isSubmitted && { color: '#B45309', fontWeight: 'bold' },
                      ]}
                    >
                      {isApproved ? '✓' : subTask.orderNumber}
                    </Text>
                  </View>

                  {/* Title & Level */}
                  <View style={styles.titleCol}>
                    <Text style={[styles.taskTitle, isApproved && styles.taskTitleDone]} numberOfLines={1}>
                      {subTask.title}
                    </Text>
                    <Text style={styles.levelSubText}>
                      {project.levelName} - {subTask.targetKpi || 'Nghiệm thu Vòng 1'}
                    </Text>
                  </View>

                  {/* Right Status */}
                  <View style={styles.statusCol}>
                    {isApproved ? (
                      <Text style={styles.tagGreen}>Duyệt V1</Text>
                    ) : isSubmitted ? (
                      <Text style={styles.tagAmber}>Chờ duyệt V1</Text>
                    ) : (
                      <View style={styles.btnGreen}>
                        <Text style={styles.btnGreenText}>Nộp bài</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
      </View>

      {/* EXPANDABLE FULL PAGE DETAIL & SUBMISSION MODAL */}
      <Modal visible={activeItem !== null} animationType="slide" transparent={false}>
        <View style={styles.container}>
          <SafeAreaView style={styles.topSafeArea}>
            <StatusBar barStyle="light-content" backgroundColor="#0F766E" />

            {/* Top Page Header */}
            <View style={styles.fullPageHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fullPageLevelTag}>
                  {activeItem?.project.levelName} - Việc con #{activeItem?.subTask.orderNumber}
                </Text>
                <Text style={styles.fullPageTitle}>{activeItem?.subTask.title}</Text>
              </View>
              <TouchableOpacity onPress={() => setActiveItem(null)} style={styles.fullPageCloseBtn}>
                <Text style={styles.fullPageCloseBtnText}>Đóng</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>

          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >

            <ScrollView
              style={styles.fullPageBody}
              contentContainerStyle={{ paddingBottom: 150 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              automaticallyAdjustKeyboardInsets={true}
              keyboardDismissMode="interactive"
            >
              {/* KPI Requirements Card */}
              {activeItem?.subTask.targetKpi ? (
                <View style={styles.kpiCard}>
                  <Text style={styles.kpiCardLabel}>Chỉ tiêu KPI yêu cầu:</Text>
                  <Text style={styles.kpiCardValue}>{activeItem.subTask.targetKpi}</Text>
                  {activeItem.subTask.description ? (
                    <Text style={styles.kpiCardDesc}>{activeItem.subTask.description}</Text>
                  ) : null}
                </View>
              ) : null}

              {/* Approved Status Banner */}
              {activeItem?.subTask.status === 'LEADER_APPROVED' && (
                <View style={styles.approvedBanner}>
                  <Text style={styles.approvedBannerText}>
                    Leader đã duyệt Vòng 1. Kết quả đang chờ Ban Giám Đốc / Admin xét duyệt nâng cấp bậc tại kỳ họp cuối tháng.
                  </Text>
                </View>
              )}

              {/* PHẦN 1: BÁO CÁO THỰC HIỆN */}
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionBlockTitle}>1. Báo Cáo Thực Hiện</Text>
                <Text style={styles.sectionBlockSub}>
                  Nhập tóm tắt kết quả, số liệu đạt được và ghi chú gửi Leader
                </Text>

                <TextInput
                  style={styles.formTextArea}
                  placeholder="Nhập nội dung báo cáo kết quả thực hiện..."
                  placeholderTextColor="#94A3B8"
                  value={resultText}
                  onChangeText={setResultText}
                  editable={activeItem?.subTask.status !== 'LEADER_APPROVED'}
                  multiline
                />
              </View>

              {/* PHẦN 2: KẾT QUẢ & MINH CHỨNG ĐÍNH KÈM */}
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionBlockTitle}>2. Kết Quả & Minh Chứng Đính Kèm</Text>
                <Text style={styles.sectionBlockSub}>
                  Đính kèm link file báo cáo và ảnh chụp thực tế
                </Text>

                {/* Link Input */}
                <Text style={styles.inputLabel}>Link tài liệu / Báo cáo (Google Drive / Sheet):</Text>
                <TextInput
                  style={styles.formTextInput}
                  placeholder="https://drive.google.com/..."
                  placeholderTextColor="#94A3B8"
                  value={evidenceLink}
                  onChangeText={setEvidenceLink}
                  editable={activeItem?.subTask.status !== 'LEADER_APPROVED'}
                  autoCapitalize="none"
                />

                {/* Photos Attachment */}
                <View style={styles.photoSectionHeader}>
                  <Text style={styles.inputLabel}>Ảnh chụp minh chứng thực tế ({selectedImages.length}):</Text>
                  {activeItem?.subTask.status !== 'LEADER_APPROVED' && (
                    <TouchableOpacity style={styles.addPhotoBtn} onPress={handlePickImage} activeOpacity={0.8}>
                      <Text style={styles.addPhotoBtnText}>+ Thêm ảnh từ thư viện</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {selectedImages.length > 0 ? (
                  <View style={styles.imageGrid}>
                    {selectedImages.map((imgUri, idx) => (
                      <View key={idx} style={styles.imageItemWrapper}>
                        <TouchableOpacity onPress={() => setPreviewImage(imgUri)} activeOpacity={0.8}>
                          <Image source={{ uri: imgUri }} style={styles.thumbnailImage} />
                        </TouchableOpacity>
                        {activeItem?.subTask.status !== 'LEADER_APPROVED' && (
                          <TouchableOpacity
                            style={styles.removePhotoBtn}
                            onPress={() => handleRemoveImage(idx)}
                          >
                            <Text style={styles.removePhotoBtnText}>Xóa</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.noImagesText}>Chưa có ảnh minh chứng nào được thêm.</Text>
                )}
              </View>

              {/* Submit Action Button */}
              {activeItem?.subTask.status !== 'LEADER_APPROVED' && (
                <View style={styles.submitButtonBox}>
                  <TouchableOpacity
                    style={styles.submitMainBtn}
                    onPress={handleConfirmSubmit}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.submitMainBtnText}>
                      {activeItem?.subTask.status === 'SUBMITTED' ? 'CẬP NHẬT BÁO CÁO & MINH CHỨNG' : 'NỘP BÁO CÁO & MINH CHỨNG'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* FULL IMAGE PREVIEW MODAL */}
      <Modal visible={previewImage !== null} animationType="fade" transparent>
        <View style={styles.previewOverlay}>
          <TouchableOpacity onPress={() => setPreviewImage(null)} style={styles.previewCloseBtn}>
            <Text style={styles.previewCloseBtnText}>Đóng xem ảnh</Text>
          </TouchableOpacity>
          {previewImage ? (
            <Image source={{ uri: previewImage }} style={styles.fullPreviewImage} resizeMode="contain" />
          ) : null}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topSafeArea: {
    backgroundColor: '#0F766E',
  },
  bodyWrapper: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: '#0F766E',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  scroll: {
    paddingHorizontal: 18,
    paddingBottom: 36,
  },
  summaryBox: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 10,
  },
  summaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '600',
  },
  summaryPercent: {
    fontSize: 13,
    color: '#059669',
    fontWeight: 'bold',
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#059669',
    borderRadius: 3,
  },
  listContainer: {
    marginTop: 4,
  },
  emptyCard: {
    padding: 32,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    marginTop: 12,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  taskRowSubmitted: {
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 8,
    borderRadius: 8,
    marginVertical: 1,
    borderBottomWidth: 0,
  },
  indexCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  indexText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  titleCol: {
    flex: 1,
    marginRight: 10,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    lineHeight: 20,
  },
  taskTitleDone: {
    color: '#64748B',
  },
  levelSubText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  statusCol: {
    alignItems: 'flex-end',
  },
  tagGreen: {
    fontSize: 13,
    color: '#059669',
    fontWeight: 'bold',
  },
  tagAmber: {
    fontSize: 13,
    color: '#B45309',
    fontWeight: '600',
  },
  btnGreen: {
    backgroundColor: '#059669',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  btnGreenText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  fullPageContainer: {
    flex: 1,
    backgroundColor: '#0F766E',
  },
  fullPageHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: '#0F766E',
  },
  fullPageLevelTag: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#99F6E4',
    marginBottom: 2,
  },
  fullPageTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#FFFFFF',
    lineHeight: 23,
  },
  fullPageCloseBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginLeft: 10,
  },
  fullPageCloseBtnText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  fullPageBody: {
    flex: 1,
    padding: 18,
    backgroundColor: '#FFFFFF',
  },
  kpiCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  kpiCardLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  kpiCardValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A',
    marginTop: 2,
  },
  kpiCardDesc: {
    fontSize: 13,
    color: '#475569',
    marginTop: 6,
    lineHeight: 18,
  },
  approvedBanner: {
    backgroundColor: '#ECFDF5',
    padding: 14,
    borderRadius: 10,
    marginBottom: 16,
  },
  approvedBannerText: {
    fontSize: 14,
    color: '#065F46',
    fontWeight: '600',
    lineHeight: 20,
  },
  sectionBlock: {
    marginBottom: 20,
  },
  sectionBlockTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 4,
  },
  sectionBlockSub: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 10,
  },
  formTextArea: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#0F172A',
    height: 100,
    textAlignVertical: 'top',
  },
  inputLabel: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
    marginBottom: 6,
  },
  formTextInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: '#0F172A',
    marginBottom: 14,
  },
  photoSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addPhotoBtn: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  addPhotoBtnText: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: 'bold',
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  imageItemWrapper: {
    position: 'relative',
  },
  thumbnailImage: {
    width: 90,
    height: 90,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
  },
  removePhotoBtn: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  removePhotoBtnText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  noImagesText: {
    fontSize: 13,
    color: '#94A3B8',
    fontStyle: 'italic',
    marginTop: 4,
  },
  submitButtonBox: {
    marginVertical: 16,
    paddingBottom: 20,
  },
  submitMainBtn: {
    backgroundColor: '#059669',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitMainBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  previewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  previewCloseBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    zIndex: 10,
  },
  previewCloseBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  fullPreviewImage: {
    width: '100%',
    height: '75%',
  },
});
