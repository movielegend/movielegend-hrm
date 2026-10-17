import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Modal,
  FlatList,
  StatusBar,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../../src/theme/colors';
import { getMySchedule } from '../../../src/api/shifts.api';
import { createShiftSwapRequest, getTargetShift, getAvailableTargets } from '../../../src/api/shift-swaps.api';
import { CustomAlert } from '../../../src/components/CustomAlert';

export default function CreateShiftSwapScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const [fromAssignmentId, setFromAssignmentId] = useState('');
  const [targetUserId, setTargetUserId] = useState('');
  const [toAssignmentId, setToAssignmentId] = useState('');
  const [reason, setReason] = useState('');

  const [showShiftModal, setShowShiftModal] = useState(false);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);

  // Lấy lịch của mình
  const { data: mySchedule, isLoading: loadingSchedule } = useQuery({
    queryKey: ['my-schedule'],
    queryFn: () => getMySchedule(),
  });

  // Lấy danh sách nhân viên cùng phòng ban
  const { data: employees, isLoading: loadingEmployees } = useQuery({
    queryKey: ['available-targets'],
    queryFn: () => getAvailableTargets(),
  });

  const myFutureShifts = (mySchedule || []).filter(
    (s) => new Date(s.workDate).getTime() > Date.now()
  );
  const selectedFromShift = myFutureShifts.find((s) => s.id === fromAssignmentId);
  const selectedEmployee = (employees?.items || []).find((e) => e.id === targetUserId);

  // Tự động tải ca làm việc của người được chọn trong cùng ngày
  const {
    data: targetShift,
    isLoading: loadingTargetShift,
    error: targetShiftError,
  } = useQuery({
    queryKey: ['target-shift', targetUserId, selectedFromShift?.workDate],
    queryFn: () => getTargetShift(targetUserId, selectedFromShift!.workDate.toString()),
    enabled: !!targetUserId && !!selectedFromShift,
  });

  useEffect(() => {
    if (targetShift?.id) {
      setToAssignmentId(targetShift.id);
    } else {
      setToAssignmentId('');
    }
  }, [targetShift]);

  const mutation = useMutation({
    mutationFn: createShiftSwapRequest,
    onSuccess: () => {
      CustomAlert.alert('Thành công', 'Đơn xin đổi ca đã được gửi thành công.', [
        {
          text: 'OK',
          onPress: () => {
            queryClient.invalidateQueries({ queryKey: ['shift-swaps-me'] });
            router.back();
          },
        },
      ]);
    },
    onError: (err: any) => {
      CustomAlert.alert('Lỗi', err?.message || 'Có lỗi xảy ra khi tạo đơn đổi ca');
    },
  });

  const handleSubmit = () => {
    if (!fromAssignmentId || !targetUserId || !toAssignmentId) {
      CustomAlert.alert('Lỗi', 'Vui lòng chọn đầy đủ các thông tin: ca của bạn, người muốn đổi và ca của họ.');
      return;
    }
    mutation.mutate({
      fromShiftAssignmentId: fromAssignmentId,
      targetUserId,
      toShiftAssignmentId: toAssignmentId,
      reason,
    });
  };

  const safeTopInset = Math.max((insets.top > 0 ? insets.top : (StatusBar.currentHeight || 20)) - 6, 8);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#102739" translucent={Platform.OS === 'android'} />

      {/* Top Header */}
      <View style={[styles.headerBanner, { paddingTop: safeTopInset }]}>
        <View style={styles.headerTopRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12} accessibilityLabel="Quay lại">
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </Pressable>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Tạo đơn đổi ca</Text>
          </View>
          <View style={styles.headerRightPlaceholder} />
        </View>
      </View>

      {/* Body Container */}
      <View style={styles.bodyContainer}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionHeader}>Thông tin đổi ca</Text>

          {/* Chọn ca của mình */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>
              Ca của bạn muốn đổi <Text style={styles.required}>*</Text>
            </Text>
            <Pressable style={styles.rowInput} onPress={() => setShowShiftModal(true)}>
              <View style={styles.rowIconWrap}>
                <Ionicons name="calendar-outline" size={20} color="#18181B" />
              </View>
              <Text style={selectedFromShift ? styles.rowTextValue : styles.rowTextPlaceholder} numberOfLines={1}>
                {selectedFromShift
                  ? `${selectedFromShift.shift?.name || 'Ca làm việc'} (${new Date(selectedFromShift.workDate).toLocaleDateString('vi-VN')})`
                  : 'Chọn ca làm việc'}
              </Text>
              <Ionicons name="chevron-down" size={18} color="#71717A" />
            </Pressable>
          </View>

          {/* Chọn nhân viên */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>
              Nhân viên muốn đổi cùng <Text style={styles.required}>*</Text>
            </Text>
            <Pressable style={styles.rowInput} onPress={() => setShowEmployeeModal(true)}>
              <View style={styles.rowIconWrap}>
                <Ionicons name="people-outline" size={20} color="#18181B" />
              </View>
              <Text style={selectedEmployee ? styles.rowTextValue : styles.rowTextPlaceholder} numberOfLines={1}>
                {selectedEmployee ? selectedEmployee.fullName : 'Chọn nhân viên'}
              </Text>
              <Ionicons name="chevron-down" size={18} color="#71717A" />
            </Pressable>
          </View>

          {/* Ca của người ta */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Ca làm việc của nhân viên</Text>
            <View style={[styles.rowInput, styles.rowInputDisabled]}>
              <View style={[styles.rowIconWrap, { backgroundColor: '#E4E4E7' }]}>
                <Ionicons name="calendar-outline" size={20} color="#71717A" />
              </View>
              {loadingTargetShift ? (
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                  <ActivityIndicator size="small" color="#102739" style={{ marginRight: 8 }} />
                  <Text style={[styles.rowTextPlaceholder, { color: '#71717A' }]}>Đang tải ca của nhân viên...</Text>
                </View>
              ) : targetShiftError ? (
                <Text style={[styles.rowTextValue, { color: '#DC2626', fontSize: 13.5 }]} numberOfLines={1}>
                  Không tìm thấy ca làm việc.
                </Text>
              ) : targetShift ? (
                <Text style={styles.rowTextValue} numberOfLines={1}>
                  {targetShift.shift?.name} ({new Date(targetShift.workDate).toLocaleDateString('vi-VN')})
                </Text>
              ) : (
                <Text style={styles.rowTextPlaceholder} numberOfLines={1}>
                  Ca làm việc của họ sẽ tự động tải
                </Text>
              )}
            </View>
          </View>

          {/* Lý do */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Lý do đổi ca</Text>
            <View style={styles.textAreaBox}>
              <View style={styles.rowIconWrap}>
                <Ionicons name="chatbox-ellipses-outline" size={20} color="#18181B" />
              </View>
              <TextInput
                style={styles.textInput}
                placeholder="Nhập lý do đổi ca chi tiết..."
                placeholderTextColor="#9CA3AF"
                multiline
                value={reason}
                onChangeText={setReason}
                textAlignVertical="top"
              />
            </View>
          </View>
        </ScrollView>

        {/* Bottom Button */}
        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <Pressable
            style={[styles.submitBtn, mutation.isPending && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={mutation.isPending}
            android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
          >
            {mutation.isPending ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitBtnText}>Gửi yêu cầu</Text>
            )}
          </Pressable>
        </View>
      </View>

      {/* Modal Chọn Ca Của Mình */}
      <Modal visible={showShiftModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn ca của bạn</Text>
              <Pressable onPress={() => setShowShiftModal(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={22} color="#18181B" />
              </Pressable>
            </View>
            {loadingSchedule ? (
              <ActivityIndicator style={{ margin: 24 }} color="#102739" />
            ) : myFutureShifts.length === 0 ? (
              <Text style={styles.emptyText}>Không có ca làm việc nào trong tương lai</Text>
            ) : (
              <FlatList
                data={myFutureShifts}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <Pressable
                    style={styles.modalItem}
                    onPress={() => {
                      setFromAssignmentId(item.id);
                      setShowShiftModal(false);
                    }}
                  >
                    <View style={styles.modalIconWrap}>
                      <Ionicons name="calendar-outline" size={20} color="#102739" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.modalItemTitle}>{item.shift?.name || 'Ca làm việc'}</Text>
                      <Text style={styles.modalItemSubtitle}>
                        {new Date(item.workDate).toLocaleDateString('vi-VN')} ({item.shift?.startTime || '--'} - {item.shift?.endTime || '--'})
                      </Text>
                    </View>
                  </Pressable>
                )}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Modal Chọn Nhân Viên */}
      <Modal visible={showEmployeeModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn nhân viên muốn đổi</Text>
              <Pressable onPress={() => setShowEmployeeModal(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={22} color="#18181B" />
              </Pressable>
            </View>
            {loadingEmployees ? (
              <ActivityIndicator style={{ margin: 24 }} color="#102739" />
            ) : (employees?.items || []).length === 0 ? (
              <Text style={styles.emptyText}>Không có nhân viên nào</Text>
            ) : (
              <FlatList
                data={employees?.items || []}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <Pressable
                    style={styles.modalItem}
                    onPress={() => {
                      setTargetUserId(item.id);
                      setShowEmployeeModal(false);
                    }}
                  >
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarText}>{item.fullName?.charAt(0) || 'U'}</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.modalItemTitle}>{item.fullName}</Text>
                      <Text style={styles.modalItemSubtitle}>{item.email}</Text>
                    </View>
                  </Pressable>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#102739',
  },
  headerBanner: {
    backgroundColor: '#102739',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginLeft: -4,
  },
  headerTitleWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  headerRightPlaceholder: {
    width: 32,
  },
  bodyContainer: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -8,
    overflow: 'hidden',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  sectionHeader: {
    fontSize: 17,
    fontWeight: '800',
    color: '#18181B',
    marginBottom: 16,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#18181B',
    marginBottom: 8,
  },
  required: {
    color: '#EF4444',
  },
  rowInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    height: 52,
    paddingHorizontal: 12,
  },
  rowInputDisabled: {
    backgroundColor: '#F4F4F5',
  },
  rowIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F4F4F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  rowTextValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#18181B',
  },
  rowTextPlaceholder: {
    flex: 1,
    fontSize: 14,
    color: '#9CA3AF',
  },
  textAreaBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    padding: 12,
    minHeight: 110,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#18181B',
    padding: 0,
    marginTop: 4,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: '#FAFAFA',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  submitBtn: {
    backgroundColor: '#102739',
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    minHeight: '45%',
    maxHeight: '80%',
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F4F4F5',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#18181B',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F4F4F5',
  },
  modalIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  modalItemTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#18181B',
  },
  modalItemSubtitle: {
    fontSize: 12.5,
    color: '#71717A',
    marginTop: 2,
  },
  emptyText: {
    textAlign: 'center',
    color: '#71717A',
    marginTop: 24,
    fontSize: 14,
  },
  avatarPlaceholder: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#102739',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
