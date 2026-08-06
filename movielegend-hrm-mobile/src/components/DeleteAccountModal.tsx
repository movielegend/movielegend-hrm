import React, { useState, useEffect } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  View,
  Pressable,
  TextInput,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCreateEmployeeRequest } from '../hooks/useEmployeeRequests';
import { useAuth } from '../providers/AuthProvider';
import { useAppAlert } from '../contexts/AlertContext';
import { getEmployees } from '../api/employees.api';
import { apiClient } from '../api/client';
import type { EmployeeUser } from '../types/employee.types';

interface DeleteAccountModalProps {
  visible: boolean;
  onClose: () => void;
}

export function DeleteAccountModal({ visible, onClose }: DeleteAccountModalProps) {
  const { user, logout } = useAuth();
  const { showAlert } = useAppAlert();
  const createRequestMutation = useCreateEmployeeRequest();

  const isAdmin = user?.roles?.includes('ADMIN');

  const [reason, setReason] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // States for Admin Transfer
  const [employees, setEmployees] = useState<EmployeeUser[]>([]);
  const [selectedSuccessorId, setSelectedSuccessorId] = useState<string | null>(null);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (visible && isAdmin) {
      void fetchEmployeesForTransfer();
    }
  }, [visible, isAdmin]);

  const fetchEmployeesForTransfer = async () => {
    setIsLoadingEmployees(true);
    try {
      const res = await getEmployees({ limit: 100, page: 1 });
      const candidateList = (res.items || []).filter((emp) => emp.id !== user?.id);
      setEmployees(candidateList);
    } catch {
      // Ignore error
    } finally {
      setIsLoadingEmployees(false);
    }
  };

  const selectedEmployee = employees.find((e) => e.id === selectedSuccessorId);
  const filteredEmployees = employees.filter((e) => {
    const name = e.profile?.fullName || e.userCode;
    const phone = e.phone || '';
    const query = searchQuery.toLowerCase();
    return name.toLowerCase().includes(query) || phone.includes(query);
  });

  const handleSubmit = async () => {
    if (!password.trim()) {
      showAlert('Thông báo', 'Vui lòng nhập mật khẩu xác nhận!');
      return;
    }

    if (isAdmin && !selectedSuccessorId && employees.length > 0) {
      showAlert('Thông báo', 'Vui lòng chọn 1 nhân sự tiếp nhận quyền Admin & Dữ liệu!');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isAdmin) {
        // Direct Admin self-delete API (No approval required)
        await apiClient.post('/auth/admin-self-delete', {
          targetSuccessorUserId: selectedSuccessorId,
          password: password.trim(),
        });

        showAlert(
          'Thành công',
          'Đã chuyển nhượng quyền Quản trị viên và đăng ký hủy tài khoản. Hệ thống sẽ tự động đăng xuất.',
          () => {
            onClose();
            void logout();
          }
        );
      } else {
        const successorInfo = selectedEmployee
          ? ` [Kế nhiệm: ${selectedEmployee.profile?.fullName || selectedEmployee.userCode}]`
          : '';

        await createRequestMutation.mutateAsync({
          type: 'ACCOUNT_DELETION' as any,
          title: `Yêu cầu hủy tài khoản - ${user?.fullName || user?.userCode}${successorInfo}`,
          content: reason.trim()
            ? `Lý do xóa: ${reason.trim()}${successorInfo ? ` | Bàn giao cho: ${selectedEmployee?.profile?.fullName}` : ''}`
            : `Lý do: Muốn dừng sử dụng tài khoản.${successorInfo ? ` Bàn giao cho: ${selectedEmployee?.profile?.fullName}` : ''}`,
        });

        showAlert(
          'Yêu cầu thành công',
          'Yêu cầu hủy tài khoản & chuyển nhượng quyền đã được gửi tới hệ thống. Bạn sẽ được tự động đăng xuất.',
          () => {
            onClose();
            void logout();
          }
        );
      }
    } catch (error: any) {
      showAlert('Lỗi', error?.response?.data?.message || 'Không thể gửi yêu cầu hủy tài khoản. Vui lòng thử lại sau.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdropPress} onPress={onClose} />
        
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardContainer}
        >
          <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.warningIconBg}>
                <MaterialCommunityIcons name="account-remove-outline" size={26} color="#DC2626" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>Yêu cầu hủy tài khoản</Text>
                <Text style={styles.subtitle}>
                  {isAdmin ? 'Chuyển nhượng quyền Admin & Bàn giao dữ liệu' : 'Quy trình ngưng sử dụng dịch vụ HRM'}
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <MaterialCommunityIcons name="close" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {/* Content Scroll */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 10 }}
            >
              {/* Warning Box */}
              <View style={styles.warningBox}>
                <MaterialCommunityIcons name="shield-alert-outline" size={18} color="#B91C1C" />
                <Text style={styles.warningText}>
                  {isAdmin
                    ? 'Quản trị viên cần chỉ định 1 Nhân sự tiếp nhận toàn bộ Dữ liệu & Quyền Admin trước khi thực hiện xóa.'
                    : 'Sau khi được phê duyệt, tài khoản sẽ được cho phép khôi phục trong 30 ngày trước khi bị hủy vĩnh viễn.'}
                </Text>
              </View>

              {/* Admin Successor Picker Dropdown */}
              {isAdmin && (
                <View style={styles.formGroup}>
                  <Text style={styles.inputLabel}>
                    Chọn Nhân sự tiếp nhận quyền Admin & Dữ liệu <Text style={styles.requiredStar}>*</Text>
                  </Text>

                  {/* Dropdown Selector Box */}
                  <TouchableOpacity
                    style={[styles.dropdownSelector, selectedEmployee && styles.dropdownSelectedActive]}
                    onPress={() => setShowEmployeeDropdown(!showEmployeeDropdown)}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons
                      name="account-cog-outline"
                      size={20}
                      color={selectedEmployee ? '#2563EB' : '#9CA3AF'}
                    />
                    <View style={{ flex: 1, marginHorizontal: 8 }}>
                      {selectedEmployee ? (
                        <>
                          <Text style={styles.selectedName}>{selectedEmployee.profile?.fullName || selectedEmployee.userCode}</Text>
                          <Text style={styles.selectedSub}>{selectedEmployee.phone} • {selectedEmployee.departmentLinks?.[0]?.department?.name || 'Phòng ban'}</Text>
                        </>
                      ) : (
                        <Text style={styles.dropdownPlaceholder}>-- Bấm chọn nhân sự tiếp quản --</Text>
                      )}
                    </View>
                    <MaterialCommunityIcons
                      name={showEmployeeDropdown ? 'chevron-up' : 'chevron-down'}
                      size={22}
                      color="#6B7280"
                    />
                  </TouchableOpacity>

                  {/* Expanded Dropdown Picker Menu */}
                  {showEmployeeDropdown && (
                    <View style={styles.dropdownMenu}>
                      {/* Search Bar in Dropdown */}
                      <View style={styles.searchBar}>
                        <MaterialCommunityIcons name="magnify" size={18} color="#9CA3AF" />
                        <TextInput
                          style={styles.searchInput}
                          placeholder="Tìm tên hoặc SĐT nhân sự..."
                          placeholderTextColor="#9CA3AF"
                          value={searchQuery}
                          onChangeText={setSearchQuery}
                        />
                      </View>

                      {isLoadingEmployees ? (
                        <ActivityIndicator color="#2563EB" style={{ padding: 14 }} />
                      ) : filteredEmployees.length === 0 ? (
                        <Text style={styles.emptyText}>Không tìm thấy nhân sự phù hợp</Text>
                      ) : (
                        <ScrollView style={{ maxHeight: 160 }} keyboardShouldPersistTaps="handled">
                          {filteredEmployees.map((emp) => {
                            const isPicked = selectedSuccessorId === emp.id;
                            return (
                              <TouchableOpacity
                                key={emp.id}
                                style={[styles.menuItem, isPicked && styles.menuItemActive]}
                                onPress={() => {
                                  setSelectedSuccessorId(emp.id);
                                  setShowEmployeeDropdown(false);
                                }}
                              >
                                <MaterialCommunityIcons
                                  name={isPicked ? 'check-circle' : 'account-outline'}
                                  size={18}
                                  color={isPicked ? '#2563EB' : '#6B7280'}
                                />
                                <View style={{ flex: 1, marginLeft: 8 }}>
                                  <Text style={[styles.menuItemName, isPicked && { color: '#2563EB', fontWeight: '700' }]}>
                                    {emp.profile?.fullName || emp.userCode}
                                  </Text>
                                  <Text style={styles.menuItemSub}>{emp.phone}</Text>
                                </View>
                              </TouchableOpacity>
                            );
                          })}
                        </ScrollView>
                      )}
                    </View>
                  )}
                </View>
              )}

              {/* Form Input: Reason */}
              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Lý do xin hủy tài khoản (Không bắt buộc)</Text>
                <TextInput
                  style={styles.textArea}
                  placeholder="Nhập lý do bàn giao / nghỉ việc..."
                  placeholderTextColor="#9CA3AF"
                  value={reason}
                  onChangeText={setReason}
                  multiline
                  numberOfLines={2}
                />
              </View>

              {/* Form Input: Password */}
              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>
                  Mật khẩu xác nhận chính chủ <Text style={styles.requiredStar}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nhập mật khẩu hiện tại để xác nhận"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>
            </ScrollView>

            {/* Actions Bottom Bar */}
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={isSubmitting}>
                <Text style={styles.cancelBtnText}>Hủy bỏ</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.confirmBtn,
                  (!password.trim() || (isAdmin && !selectedSuccessorId && employees.length > 0)) && styles.disabledBtn,
                ]}
                onPress={handleSubmit}
                disabled={!password.trim() || (isAdmin && !selectedSuccessorId && employees.length > 0) || isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.confirmBtnText}>Xác nhận bàn giao & Hủy</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  backdropPress: {
    ...StyleSheet.absoluteFillObject,
  },
  keyboardContainer: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '90%',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  warningIconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
  },
  subtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  closeBtn: {
    padding: 4,
  },
  warningBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  warningText: {
    fontSize: 12,
    color: '#991B1B',
    lineHeight: 17,
    flex: 1,
  },
  formGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  requiredStar: {
    color: '#DC2626',
    fontWeight: '700',
  },
  dropdownSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 48,
  },
  dropdownSelectedActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  dropdownPlaceholder: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  selectedName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  selectedSub: {
    fontSize: 11,
    color: '#4B5563',
  },
  dropdownMenu: {
    marginTop: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 36,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: '#111827',
    marginLeft: 6,
    paddingVertical: 0,
  },
  emptyText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  menuItemActive: {
    backgroundColor: '#EFF6FF',
  },
  menuItemName: {
    fontSize: 13,
    color: '#374151',
  },
  menuItemSub: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  textArea: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 10,
    fontSize: 13,
    color: '#111827',
    textAlignVertical: 'top',
    height: 60,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 13,
    color: '#111827',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4B5563',
  },
  confirmBtn: {
    backgroundColor: '#DC2626',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
  },
  disabledBtn: {
    backgroundColor: '#FCA5A5',
  },
  confirmBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
