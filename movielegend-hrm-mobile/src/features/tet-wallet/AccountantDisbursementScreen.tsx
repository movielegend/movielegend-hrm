import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
  Alert,
  Modal,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Screen } from '../../components/Screen';
import { PageHeader } from '../../components/PageHeader';
import { SearchInput } from '../../components/SearchInput';
import { LoadingState } from '../../components/LoadingState';
import { EmptyState } from '../../components/EmptyState';
import {
  getVaultWithdrawalRequests,
  accountantConfirmWithdrawal,
  rejectWithdrawal,
} from '../../api/employees.api';
import type {
  RewardWithdrawalRequest,
  WithdrawalRequestsResponse,
} from '../../types/employee.types';

type FilterTab = 'PENDING_ACCOUNTANT' | 'PAID' | 'ALL';

export function AccountantDisbursementScreen() {
  const [activeTab, setActiveTab] = useState<FilterTab>('PENDING_ACCOUNTANT');
  const [search, setSearch] = useState('');

  // Modals state
  const [selectedTicket, setSelectedTicket] = useState<RewardWithdrawalRequest | null>(null);
  const [modalType, setModalType] = useState<'CONFIRM_PAY' | 'REJECT' | null>(null);
  const [transactionRef, setTransactionRef] = useState('');
  const [accountantNote, setAccountantNote] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const queryClient = useQueryClient();

  const { data, isLoading, isRefetching, refetch } = useQuery<WithdrawalRequestsResponse>({
    queryKey: ['accountant-disbursements', activeTab, search],
    queryFn: () =>
      getVaultWithdrawalRequests({
        status: activeTab === 'ALL' ? undefined : activeTab,
        search: search.trim() || undefined,
      }),
  });

  const counts = data?.counts || {
    PENDING_ADMIN: 0,
    PENDING_ACCOUNTANT: 0,
    PAID: 0,
    REJECTED: 0,
    TOTAL: 0,
  };

  const requests: RewardWithdrawalRequest[] = data?.items || [];

  const openConfirmPayModal = (ticket: RewardWithdrawalRequest) => {
    setSelectedTicket(ticket);
    setTransactionRef('');
    setAccountantNote('');
    setModalType('CONFIRM_PAY');
  };

  const openRejectModal = (ticket: RewardWithdrawalRequest) => {
    setSelectedTicket(ticket);
    setRejectReason('');
    setModalType('REJECT');
  };

  const handleConfirmPaySubmit = async () => {
    if (!selectedTicket) return;
    try {
      setIsSubmitting(true);
      await accountantConfirmWithdrawal(selectedTicket.id, {
        transactionReference: transactionRef.trim() || undefined,
        note: accountantNote.trim() || undefined,
      });

      Alert.alert(
        'Xác nhận chi tiền thành công 🎉',
        `Đã hoàn tất chi trả ${selectedTicket.cashAmount.toLocaleString('vi-VN')} VNĐ cho nhân viên ${selectedTicket.user?.profile?.fullName || selectedTicket.user?.userCode}. Hệ thống đã gửi thông báo đến nhân viên!`
      );

      await queryClient.invalidateQueries({ queryKey: ['accountant-disbursements'] });
      await queryClient.invalidateQueries({ queryKey: ['vault-withdrawals'] });
      setModalType(null);
      setSelectedTicket(null);
    } catch (err: any) {
      Alert.alert('Lỗi xác nhận', err?.response?.data?.message || err?.message || 'Không thể xác nhận lúc này.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectSubmit = async () => {
    if (!selectedTicket) return;
    if (!rejectReason.trim()) {
      Alert.alert('Thiếu lý do', 'Vui lòng nhập lý do từ chối để nhân viên nắm được thông tin.');
      return;
    }
    try {
      setIsSubmitting(true);
      await rejectWithdrawal(selectedTicket.id, {
        reason: rejectReason.trim(),
      });

      Alert.alert('Đã từ chối lệnh chi', 'Số điểm đã được tự động hoàn lại vào Ví Thưởng Tết của nhân viên.');
      await queryClient.invalidateQueries({ queryKey: ['accountant-disbursements'] });
      await queryClient.invalidateQueries({ queryKey: ['vault-withdrawals'] });
      setModalType(null);
      setSelectedTicket(null);
    } catch (err: any) {
      Alert.alert('Lỗi từ chối', err?.response?.data?.message || err?.message || 'Không thể từ chối lúc này.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Screen backgroundColor="#F8FAFC">
      <ScrollView
        style={{ flex: 1, backgroundColor: '#F8FAFC' }}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      >
        <PageHeader
          title="Chi Trả Thưởng Tết"
          subtitle="Đặc quyền Leader Kế Toán • Xác nhận giải ngân"
          showBack={true}
          right={
            <View style={styles.headerIconBox}>
              <MaterialCommunityIcons name="cash-check" size={24} color="#059669" />
            </View>
          }
        />

        {/* Status Tab Filters */}
        <View style={styles.tabBar}>
          <Pressable
            style={[styles.tabBtn, activeTab === 'PENDING_ACCOUNTANT' && styles.tabBtnActive]}
            onPress={() => setActiveTab('PENDING_ACCOUNTANT')}
          >
            <MaterialCommunityIcons
              name="cash-fast"
              size={18}
              color={activeTab === 'PENDING_ACCOUNTANT' ? '#2563EB' : '#64748B'}
            />
            <Text style={[styles.tabBtnText, activeTab === 'PENDING_ACCOUNTANT' && styles.tabBtnTextActive]}>
              Chờ chi tiền
            </Text>
            {counts.PENDING_ACCOUNTANT > 0 && (
              <View style={styles.badgeCount}>
                <Text style={styles.badgeCountText}>{counts.PENDING_ACCOUNTANT}</Text>
              </View>
            )}
          </Pressable>

          <Pressable
            style={[styles.tabBtn, activeTab === 'PAID' && styles.tabBtnActive]}
            onPress={() => setActiveTab('PAID')}
          >
            <MaterialCommunityIcons
              name="check-circle-outline"
              size={18}
              color={activeTab === 'PAID' ? '#059669' : '#64748B'}
            />
            <Text style={[styles.tabBtnText, activeTab === 'PAID' && styles.tabBtnTextActive]}>
              Đã chi trả ({counts.PAID})
            </Text>
          </Pressable>

          <Pressable
            style={[styles.tabBtn, activeTab === 'ALL' && styles.tabBtnActive]}
            onPress={() => setActiveTab('ALL')}
          >
            <MaterialCommunityIcons
              name="format-list-bulleted"
              size={18}
              color={activeTab === 'ALL' ? '#0F172A' : '#64748B'}
            />
            <Text style={[styles.tabBtnText, activeTab === 'ALL' && styles.tabBtnTextActive]}>
              Tất cả
            </Text>
          </Pressable>
        </View>

        {/* Search */}
        <View style={{ marginBottom: 12 }}>
          <SearchInput
            value={search}
            onChangeText={setSearch}
            placeholder="Tìm theo tên nhân viên, mã nhân viên..."
          />
        </View>

        {/* Requests List */}
        {isLoading ? (
          <LoadingState label="Đang tải danh sách chờ chi tiền..." />
        ) : requests.length === 0 ? (
          <EmptyState
            title={
              activeTab === 'PENDING_ACCOUNTANT'
                ? 'Không có yêu cầu nào chờ chi tiền'
                : 'Chưa có dữ liệu chi trả'
            }
            message="Các yêu cầu thưởng Tết đã được Ban Giám Đốc duyệt sẽ xuất hiện tại đây để Kế toán thực hiện chi trả."
          />
        ) : (
          <View style={{ gap: 12 }}>
            {requests.map((ticket) => {
              const isPendingAcc = ticket.status === 'PENDING_ACCOUNTANT';
              const isPaid = ticket.status === 'PAID';
              const userProfile = ticket.user?.profile;
              const deptName = ticket.user?.departmentLinks?.[0]?.department?.name || 'Chưa phân phòng';
              const posName = ticket.user?.departmentLinks?.[0]?.position?.name || 'Nhân viên';

              return (
                <View key={ticket.id} style={styles.ticketCard}>
                  {/* Employee Header */}
                  <View style={styles.ticketHeader}>
                    <View style={styles.avatarBox}>
                      {userProfile?.avatarUrl ? (
                        <Image source={{ uri: userProfile.avatarUrl }} style={styles.avatar} />
                      ) : (
                        <View style={styles.avatarFallback}>
                          <Text style={styles.avatarFallbackText}>
                            {(userProfile?.fullName || 'NV').slice(0, 2).toUpperCase()}
                          </Text>
                        </View>
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.empName}>{userProfile?.fullName || 'Chưa cập nhật tên'}</Text>
                      <Text style={styles.empMeta}>
                        {ticket.user?.userCode} • {posName} • {deptName}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusChip,
                        isPaid ? styles.statusChipPaid : isPendingAcc ? styles.statusChipPending : styles.statusChipReject,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusChipText,
                          isPaid ? { color: '#059669' } : isPendingAcc ? { color: '#2563EB' } : { color: '#DC2626' },
                        ]}
                      >
                        {isPaid ? 'ĐÃ CHI TIỀN' : isPendingAcc ? 'CHỜ KẾ TOÁN CHI' : 'TỪ CHỐI'}
                      </Text>
                    </View>
                  </View>

                  {/* Amount Banner */}
                  <View style={styles.amountBanner}>
                    <View>
                      <Text style={styles.amountLabel}>Số tiền Thưởng Tết:</Text>
                      <Text style={styles.amountNumber}>
                        {ticket.cashAmount.toLocaleString('vi-VN')} <Text style={styles.amountCurrency}>VNĐ</Text>
                      </Text>
                    </View>
                    <View style={styles.pointPill}>
                      <MaterialCommunityIcons name="star-shooting" size={14} color="#D97706" />
                      <Text style={styles.pointPillText}>{ticket.pointsWithdrawn.toLocaleString('vi-VN')} điểm</Text>
                    </View>
                  </View>

                  {/* Audit Info & Note */}
                  <View style={styles.auditBox}>
                    <Text style={styles.auditText}>
                      🕒 Gửi lúc: {new Date(ticket.createdAt).toLocaleString('vi-VN')}
                    </Text>
                    {ticket.adminApprovedAt && (
                      <Text style={[styles.auditText, { color: '#059669' }]}>
                        ✓ Giám Đốc đã duyệt: {new Date(ticket.adminApprovedAt).toLocaleString('vi-VN')}
                        {ticket.adminNote ? ` ("${ticket.adminNote}")` : ''}
                      </Text>
                    )}
                    {ticket.note ? (
                      <Text style={[styles.auditText, { color: '#475569', fontStyle: 'italic' }]}>
                        • Ghi chú NV: {ticket.note}
                      </Text>
                    ) : null}
                    {isPaid && ticket.transactionReference ? (
                      <Text style={[styles.auditText, { color: '#059669', fontWeight: '700' }]}>
                        ✓ Mã giao dịch: {ticket.transactionReference}
                      </Text>
                    ) : null}
                  </View>

                  {/* Action Buttons for Pending */}
                  {isPendingAcc && (
                    <View style={styles.actionRow}>
                      <Pressable style={styles.rejectBtn} onPress={() => openRejectModal(ticket)}>
                        <MaterialCommunityIcons name="close" size={16} color="#DC2626" />
                        <Text style={styles.rejectBtnText}>Từ chối</Text>
                      </Pressable>

                      <Pressable style={styles.confirmBtn} onPress={() => openConfirmPayModal(ticket)}>
                        <MaterialCommunityIcons name="check-decagram" size={18} color="#FFFFFF" />
                        <Text style={styles.confirmBtnText}>XÁC NHẬN ĐÃ CHI TRẢ</Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Modal Confirm Pay */}
      {modalType === 'CONFIRM_PAY' && selectedTicket && (
        <Modal visible transparent animationType="fade" onRequestClose={() => setModalType(null)}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalOverlay}
          >
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <MaterialCommunityIcons name="cash-check" size={24} color="#059669" />
                <Text style={styles.modalTitle}>Xác Nhận Đã Chi Trả</Text>
              </View>

              <Text style={styles.modalDesc}>
                Xác nhận bạn đã chi trả số tiền{' '}
                <Text style={{ fontWeight: '800', color: '#059669' }}>
                  {selectedTicket.cashAmount.toLocaleString('vi-VN')} VNĐ
                </Text>{' '}
                cho nhân viên{' '}
                <Text style={{ fontWeight: '700' }}>
                  {selectedTicket.user?.profile?.fullName || selectedTicket.user?.userCode}
                </Text>
                .
              </Text>

              <Text style={styles.fieldLabel}>Mã giao dịch / Mã phiếu chi (Tùy chọn):</Text>
              <TextInput
                style={styles.input}
                value={transactionRef}
                onChangeText={setTransactionRef}
                placeholder="VD: UNC123456, PC-2026-01..."
              />

              <Text style={styles.fieldLabel}>Ghi chú kế toán (Tùy chọn):</Text>
              <TextInput
                style={styles.input}
                value={accountantNote}
                onChangeText={setAccountantNote}
                placeholder="VD: Đã chi chuyển khoản theo đợt 1..."
              />

              <View style={styles.modalActionRow}>
                <Pressable
                  style={styles.modalCancelBtn}
                  onPress={() => setModalType(null)}
                  disabled={isSubmitting}
                >
                  <Text style={styles.modalCancelText}>Hủy bỏ</Text>
                </Pressable>

                <Pressable
                  style={[styles.modalSubmitBtn, isSubmitting && { opacity: 0.7 }]}
                  onPress={handleConfirmPaySubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.modalSubmitText}>HOÀN TẤT CHI TRẢ</Text>
                  )}
                </Pressable>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      )}

      {/* Modal Reject */}
      {modalType === 'REJECT' && selectedTicket && (
        <Modal visible transparent animationType="fade" onRequestClose={() => setModalType(null)}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalOverlay}
          >
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <MaterialCommunityIcons name="alert-circle-outline" size={24} color="#DC2626" />
                <Text style={[styles.modalTitle, { color: '#DC2626' }]}>Từ Chối Chi Trả</Text>
              </View>

              <Text style={styles.modalDesc}>
                Điểm thưởng sẽ được tự động hoàn trả lại vào Ví Thưởng Tết của nhân viên.
              </Text>

              <Text style={styles.fieldLabel}>Lý do từ chối *:</Text>
              <TextInput
                style={[styles.input, { height: 60 }]}
                value={rejectReason}
                onChangeText={setRejectReason}
                multiline
                placeholder="Nhập lý do từ chối chi tiền..."
              />

              <View style={styles.modalActionRow}>
                <Pressable
                  style={styles.modalCancelBtn}
                  onPress={() => setModalType(null)}
                  disabled={isSubmitting}
                >
                  <Text style={styles.modalCancelText}>Đóng</Text>
                </Pressable>

                <Pressable
                  style={[styles.modalRejectSubmitBtn, isSubmitting && { opacity: 0.7 }]}
                  onPress={handleRejectSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.modalSubmitText}>XÁC NHẬN TỪ CHỐI</Text>
                  )}
                </Pressable>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  headerIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  tabBtnActive: {
    backgroundColor: '#EFF6FF',
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  tabBtnTextActive: {
    color: '#2563EB',
    fontWeight: '700',
  },
  badgeCount: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeCountText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  ticketCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  ticketHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  avatarBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  empName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  empMeta: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  statusChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusChipPending: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  statusChipPaid: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  statusChipReject: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  statusChipText: {
    fontSize: 10,
    fontWeight: '800',
  },
  amountBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  amountLabel: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 2,
  },
  amountNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#059669',
  },
  amountCurrency: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  pointPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pointPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
  auditBox: {
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
    padding: 8,
    gap: 4,
    marginBottom: 10,
  },
  auditText: {
    fontSize: 11,
    color: '#64748B',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  rejectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    gap: 4,
  },
  rejectBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
  confirmBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#059669',
    gap: 6,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  confirmBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalDesc: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  modalSubmitBtn: {
    flex: 1.5,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#059669',
    alignItems: 'center',
  },
  modalRejectSubmitBtn: {
    flex: 1.5,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#DC2626',
    alignItems: 'center',
  },
  modalSubmitText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
