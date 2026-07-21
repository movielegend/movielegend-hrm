import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView, TextInput, Alert, ActivityIndicator, Modal, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Screen } from '../../../src/components/Screen';
import { colors } from '../../../src/theme/colors';
import { spacing } from '../../../src/theme/spacing';
import { shadows } from '../../../src/theme/shadows';
import { PrimaryButton } from '../../../src/components/Buttons';
import { getMySchedule } from '../../../src/api/shifts.api';
import { createShiftSwapRequest, getTargetShift, getAvailableTargets } from '../../../src/api/shift-swaps.api';

export default function CreateShiftSwapScreen() {
  const router = useRouter();
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
  const { data: employees, isLoading: loadingEmployees, error: employeesError } = useQuery({
    queryKey: ['available-targets'],
    queryFn: () => getAvailableTargets(),
  });

  const myFutureShifts = (mySchedule || []).filter(s => new Date(s.workDate).getTime() > Date.now());
  const selectedFromShift = myFutureShifts.find(s => s.id === fromAssignmentId);
  const selectedEmployee = (employees?.items || []).find(e => e.id === targetUserId);

  // Tự động tải ca làm việc của người được chọn trong cùng ngày
  const { data: targetShift, isLoading: loadingTargetShift, error: targetShiftError } = useQuery({
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
      Alert.alert('Thành công', 'Đơn xin đổi ca đã được gửi thành công.', [
        { text: 'OK', onPress: () => {
          queryClient.invalidateQueries({ queryKey: ['shift-swaps-me'] });
          router.back();
        }}
      ]);
    },
    onError: (err: any) => {
      Alert.alert('Lỗi', err?.message || 'Có lỗi xảy ra khi tạo đơn đổi ca');
    }
  });

  const handleSubmit = () => {
    if (!fromAssignmentId || !targetUserId || !toAssignmentId) {
      Alert.alert('Lỗi', 'Vui lòng chọn đầy đủ các thông tin: ca của bạn, người muốn đổi và ca của họ.');
      return;
    }
    mutation.mutate({
      fromShiftAssignmentId: fromAssignmentId,
      targetUserId,
      toShiftAssignmentId: toAssignmentId,
      reason,
    });
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn}>
          <MaterialCommunityIcons name="chevron-left" size={32} color="#111827" />
        </Pressable>
        <Text style={styles.title}>Tạo đơn đổi ca</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionHeader}>Thông tin đổi ca</Text>

        {/* Chọn ca của mình */}
        <Pressable style={[styles.rowInput, shadows.sm]} onPress={() => setShowShiftModal(true)}>
          <View style={[styles.rowIconWrap, { backgroundColor: '#F3F4F6' }]}>
            <MaterialCommunityIcons name="calendar-clock" size={20} color="#000" />
          </View>
          <Text style={[selectedFromShift ? styles.rowTextValue : styles.rowTextPlaceholder]}>
            <Text style={styles.required}>*</Text> {selectedFromShift ? `${selectedFromShift.shift.name} (${new Date(selectedFromShift.workDate).toLocaleDateString('vi-VN')})` : 'Ca của bạn muốn đổi'}
          </Text>
          <MaterialCommunityIcons name="chevron-down" size={20} color="#9CA3AF" />
        </Pressable>

        {/* Chọn nhân viên */}
        <Pressable style={[styles.rowInput, shadows.sm]} onPress={() => setShowEmployeeModal(true)}>
          <View style={[styles.rowIconWrap, { backgroundColor: '#F3F4F6' }]}>
            <MaterialCommunityIcons name="account-switch" size={20} color="#000" />
          </View>
          <Text style={[selectedEmployee ? styles.rowTextValue : styles.rowTextPlaceholder]}>
            <Text style={styles.required}>*</Text> {selectedEmployee ? selectedEmployee.fullName : 'Nhân viên muốn đổi cùng'}
          </Text>
          <MaterialCommunityIcons name="chevron-down" size={20} color="#9CA3AF" />
        </Pressable>

        {/* Ca của người ta */}
        <View style={[styles.rowInput, shadows.sm, { backgroundColor: '#F9FAFB' }]}>
          <View style={[styles.rowIconWrap, { backgroundColor: '#E5E7EB' }]}>
            <MaterialCommunityIcons name="calendar-check" size={20} color="#6B7280" />
          </View>
          {loadingTargetShift ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ flex: 1, alignItems: 'flex-start' }} />
          ) : targetShiftError ? (
            <Text style={[styles.rowTextValue, { color: colors.danger, fontSize: 13 }]}>
              Không tìm thấy ca làm việc.
            </Text>
          ) : targetShift ? (
            <Text style={styles.rowTextValue}>
              {targetShift.shift?.name} ({new Date(targetShift.workDate).toLocaleDateString('vi-VN')})
            </Text>
          ) : (
            <Text style={[styles.rowTextPlaceholder, { fontSize: 13 }]}>
              Ca làm việc của họ sẽ tự động tải
            </Text>
          )}
        </View>

        {/* Lý do */}
        <View style={[styles.rowInput, shadows.sm, { alignItems: 'flex-start', paddingVertical: 16 }]}>
          <View style={[styles.rowIconWrap, { backgroundColor: '#F3F4F6', marginTop: 2 }]}>
            <MaterialCommunityIcons name="message-text-outline" size={20} color="#000" />
          </View>
          <TextInput
            style={[styles.rowTextInput, { minHeight: 80 }]}
            placeholder="Lý do đổi ca chi tiết..."
            placeholderTextColor="#9CA3AF"
            multiline
            value={reason}
            onChangeText={setReason}
            textAlignVertical="top"
          />
        </View>

        <PrimaryButton 
          loading={mutation.isPending} 
          onPress={handleSubmit} 
          style={{ marginTop: spacing.md }}
        >
          Gửi Yêu Cầu
        </PrimaryButton>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modal Chọn Ca Của Mình */}
      <Modal visible={showShiftModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn ca của bạn</Text>
              <Pressable onPress={() => setShowShiftModal(false)} style={{ padding: 4 }}>
                <MaterialCommunityIcons name="close" size={24} color="#000" />
              </Pressable>
            </View>
            {loadingSchedule ? (
              <ActivityIndicator style={{ margin: 20 }} color={colors.primary} />
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
                    <MaterialCommunityIcons name="calendar-clock" size={20} color="#111827" style={{ marginRight: 12 }} />
                    <View>
                      <Text style={styles.modalItemTitle}>{item.shift.name}</Text>
                      <Text style={styles.modalItemSubtitle}>{new Date(item.workDate).toLocaleDateString('vi-VN')} ({item.shift.startTime} - {item.shift.endTime})</Text>
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
              <Pressable onPress={() => setShowEmployeeModal(false)} style={{ padding: 4 }}>
                <MaterialCommunityIcons name="close" size={24} color="#000" />
              </Pressable>
            </View>
            {loadingEmployees ? (
              <ActivityIndicator style={{ margin: 20 }} color={colors.primary} />
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
                      <Text style={{ color: '#fff', fontWeight: 'bold' }}>{item.fullName?.charAt(0) || 'U'}</Text>
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
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: '#fff',
  },
  iconBtn: {
    padding: spacing.xs,
    marginLeft: -spacing.xs,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  content: {
    padding: spacing.lg,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: spacing.lg,
  },
  rowInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  rowIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  rowTextValue: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
  },
  rowTextPlaceholder: {
    flex: 1,
    fontSize: 15,
    color: '#9CA3AF',
  },
  rowTextInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    padding: 0,
    margin: 0,
  },
  required: {
    color: '#EF4444',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    minHeight: '50%',
    maxHeight: '80%',
    padding: spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  modalItemSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  emptyText: {
    textAlign: 'center',
    color: '#6B7280',
    marginTop: spacing.xl,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
