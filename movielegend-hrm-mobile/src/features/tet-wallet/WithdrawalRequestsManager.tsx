import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  RefreshControl,
  Image,
  Alert,
  Modal,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { SearchInput } from '../../components/SearchInput';
import { LoadingState } from '../../components/LoadingState';
import { EmptyState } from '../../components/EmptyState';
import { colors } from '../../theme/colors';
import {
  getVaultWithdrawalRequests,
  adminApproveWithdrawal,
  accountantConfirmWithdrawal,
  rejectWithdrawal,
} from '../../api/employees.api';
import type {
  RewardWithdrawalRequest,
  WithdrawalRequestsResponse,
  WithdrawalRequestStatus,
} from '../../types/employee.types';

type FilterTab = 'ALL' | 'PENDING_ADMIN' | 'PENDING_ACCOUNTANT' | 'PAID' | 'REJECTED';

interface WithdrawalRequestsManagerProps {
  onBadgeCountChange?: (pendingCount: number) => void;
}

export function WithdrawalRequestsManager({ onBadgeCountChange }: WithdrawalRequestsManagerProps) {
  const [activeTab, setActiveTab] = useState<FilterTab>('PENDING_ADMIN');
  const [search, setSearch] = useState('');
  
  // Modals
  const [selectedTicket, setSelectedTicket] = useState<RewardWithdrawalRequest | null>(null);
  const [modalType, setModalType] = useState<'ADMIN_APPROVE' | 'ACCOUNTANT_PAY' | 'REJECT' | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [transactionRef, setTransactionRef] = useState('');
  const [accountantNote, setAccountantNote] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const queryClient = useQueryClient();

  const { data, isLoading, isRefetching, refetch } = useQuery<WithdrawalRequestsResponse>({
    queryKey: ['vault-withdrawals', activeTab, search],
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

  // Open Admin Approve Modal
  const openAdminApproveModal = (ticket: RewardWithdrawalRequest) => {
    setSelectedTicket(ticket);
    setAdminNote('');
    setModalType('ADMIN_APPROVE');
  };

  // Submit Admin Approve
  const handleAdminApproveSubmit = async () => {
    if (!selectedTicket) return;
    try {
      setIsSubmitting(true);
      await adminApproveWithdrawal(selectedTicket.id, {
        note: adminNote.trim() || undefined,
      });

      Alert.alert(
        'Phê duyệt thành công! ✅',
        `Yêu cầu rút ${selectedTicket.cashAmount.toLocaleString('vi-VN')} VNĐ của ${
          selectedTicket.user?.profile?.fullName || selectedTicket.user?.userCode
        } đã được duyệt và chuyển tiếp sang Kế toán để thực hiện chi tiền.`
      );

      await queryClient.invalidateQueries({ queryKey: ['vault-withdrawals'] });
      await queryClient.invalidateQueries({ queryKey: ['my-vault'] });
      setModalType(null);
      setSelectedTicket(null);
    } catch (err: any) {
      Alert.alert('Lỗi phê duyệt', err?.response?.data?.message || err?.message || 'Không thể phê duyệt lúc này.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Accountant Confirm Modal
  const openAccountantPayModal = (ticket: RewardWithdrawalRequest) => {
    setSelectedTicket(ticket);
    setTransactionRef('');
    setAccountantNote('');
    setModalType('ACCOUNTANT_PAY');
  };

  // Submit Accountant Confirm Payment
  const handleAccountantPaySubmit = async () => {
    if (!selectedTicket) return;
    try {
      setIsSubmitting(true);
      await accountantConfirmWithdrawal(selectedTicket.id, {
        transactionReference: transactionRef.trim() || undefined,
        note: accountantNote.trim() || undefined,
      });

      Alert.alert(
        'Xác nhận chi tiền thành công! 💸',
        `Đã xác nhận chuyển ${selectedTicket.cashAmount.toLocaleString('vi-VN')} VNĐ cho ${
          selectedTicket.user?.profile?.fullName || selectedTicket.user?.userCode
        }. Hệ thống đã gửi thông báo đến nhân viên.`
      );

      await queryClient.invalidateQueries({ queryKey: ['vault-withdrawals'] });
      await queryClient.invalidateQueries({ queryKey: ['my-vault'] });
      setModalType(null);
      setSelectedTicket(null);
    } catch (err: any) {
      Alert.alert('Lỗi xác nhận', err?.response?.data?.message || err?.message || 'Không thể xác nhận lúc này.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Reject Modal
  const openRejectModal = (ticket: RewardWithdrawalRequest) => {
    setSelectedTicket(ticket);
    setRejectReason('');
    setModalType('REJECT');
  };

  // Submit Reject
  const handleRejectSubmit = async () => {
    if (!selectedTicket) return;
    if (!rejectReason.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập lý do từ chối để nhân viên nắm rõ.');
      return;
    }

    try {
      setIsSubmitting(true);
      await rejectWithdrawal(selectedTicket.id, {
        reason: rejectReason.trim(),
      });

      Alert.alert(
        'Đã từ chối yêu cầu ❌',
        `Đã từ chối yêu cầu và tự động hoàn trả ${selectedTicket.pointsWithdrawn.toLocaleString(
          'vi-VN'
        )} điểm vào ví cho ${selectedTicket.user?.profile?.fullName || selectedTicket.user?.userCode}.`
      );

      await queryClient.invalidateQueries({ queryKey: ['vault-withdrawals'] });
      await queryClient.invalidateQueries({ queryKey: ['my-vault'] });
      setModalType(null);
      setSelectedTicket(null);
    } catch (err: any) {
      Alert.alert('Lỗi từ chối', err?.response?.data?.message || err?.message || 'Không thể từ chối lúc này.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Sub-Tabs Selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterTabsWrapper}
      >
        <Pressable
          style={[styles.filterTabBtn, activeTab === 'PENDING_ADMIN' && styles.filterTabBtnActiveAdmin]}
          onPress={() => setActiveTab('PENDING_ADMIN')}
        >
          <MaterialCommunityIcons
            name="account-clock-outline"
            size={16}
            color={activeTab === 'PENDING_ADMIN' ? '#D97706' : '#64748B'}
          />
          <Text
            style={[
              styles.filterTabText,
              activeTab === 'PENDING_ADMIN' && styles.filterTabTextActiveAdmin,
            ]}
          >
            Chờ Admin duyệt
          </Text>
          {counts.PENDING_ADMIN > 0 && (
            <View style={styles.badgeOrange}>
              <Text style={styles.badgeTextWhite}>{counts.PENDING_ADMIN}</Text>
            </View>
          )}
        </Pressable>

        <Pressable
          style={[styles.filterTabBtn, activeTab === 'PENDING_ACCOUNTANT' && styles.filterTabBtnActiveAcc]}
          onPress={() => setActiveTab('PENDING_ACCOUNTANT')}
        >
          <MaterialCommunityIcons
            name="bank-transfer-out"
            size={16}
            color={activeTab === 'PENDING_ACCOUNTANT' ? '#2563EB' : '#64748B'}
          />
          <Text
            style={[
              styles.filterTabText,
              activeTab === 'PENDING_ACCOUNTANT' && styles.filterTabTextActiveAcc,
            ]}
          >
            Chờ Kế toán chi
          </Text>
          {counts.PENDING_ACCOUNTANT > 0 && (
            <View style={styles.badgeBlue}>
              <Text style={styles.badgeTextWhite}>{counts.PENDING_ACCOUNTANT}</Text>
            </View>
          )}
        </Pressable>

        <Pressable
          style={[styles.filterTabBtn, activeTab === 'PAID' && styles.filterTabBtnActivePaid]}
          onPress={() => setActiveTab('PAID')}
        >
          <MaterialCommunityIcons
            name="check-circle-outline"
            size={16}
            color={activeTab === 'PAID' ? '#059669' : '#64748B'}
          />
          <Text
            style={[styles.filterTabText, activeTab === 'PAID' && styles.filterTabTextActivePaid]}
          >
            Đã chi tiền ({counts.PAID})
          </Text>
        </Pressable>

        <Pressable
          style={[styles.filterTabBtn, activeTab === 'REJECTED' && styles.filterTabBtnActiveRejected]}
          onPress={() => setActiveTab('REJECTED')}
        >
          <MaterialCommunityIcons
            name="close-circle-outline"
            size={16}
            color={activeTab === 'REJECTED' ? '#DC2626' : '#64748B'}
          />
          <Text
            style={[
              styles.filterTabText,
              activeTab === 'REJECTED' && styles.filterTabTextActiveRejected,
            ]}
          >
            Đã từ chối ({counts.REJECTED})
          </Text>
        </Pressable>

        <Pressable
          style={[styles.filterTabBtn, activeTab === 'ALL' && styles.filterTabBtnActiveAll]}
          onPress={() => setActiveTab('ALL')}
        >
          <Text style={[styles.filterTabText, activeTab === 'ALL' && styles.filterTabTextActiveAll]}>
            Tất cả ({counts.TOTAL})
          </Text>
        </Pressable>
      </ScrollView>

      {/* Search Input */}
      <View style={{ marginBottom: 14 }}>
        <SearchInput
          value={search}
          onChangeText={setSearch}
          placeholder="Tìm theo tên nhân viên, mã NV, STK, ngân hàng..."
        />
      </View>

      {/* Tickets List */}
      {isLoading ? (
        <LoadingState label="Đang tải danh sách yêu cầu rút tiền..." />
      ) : requests.length === 0 ? (
        <EmptyState
          title={
            activeTab === 'PENDING_ADMIN'
              ? 'Không có yêu cầu nào chờ Admin duyệt'
              : activeTab === 'PENDING_ACCOUNTANT'
              ? 'Không có yêu cầu nào chờ Kế toán chi'
              : 'Không tìm thấy yêu cầu rút tiền nào'
          }
          message="Các yêu cầu rút điểm từ Ví Tết & Giữ chân nhân tài sẽ hiển thị tại đây."
        />
      ) : (
        <View style={styles.ticketList}>
          {requests.map((ticket) => {
            const isPendingAdmin = ticket.status === 'PENDING_ADMIN';
            const isPendingAcc = ticket.status === 'PENDING_ACCOUNTANT';
            const isPaid = ticket.status === 'PAID';
            const isRejected = ticket.status === 'REJECTED';

            const statusBg = isPaid
              ? '#ECFDF5'
              : isPendingAcc
              ? '#EFF6FF'
              : isPendingAdmin
              ? '#FFFBEB'
              : '#FEF2F2';

            const statusBorder = isPaid
              ? '#A7F3D0'
              : isPendingAcc
              ? '#BFDBFE'
              : isPendingAdmin
              ? '#FDE68A'
              : '#FECACA';

            const statusColor = isPaid
              ? '#059669'
              : isPendingAcc
              ? '#2563EB'
              : isPendingAdmin
              ? '#D97706'
              : '#DC2626';

            const statusLabel = isPaid
              ? '✅ ĐÃ CHUYỂN TIỀN'
              : isPendingAcc
              ? '💼 CHỜ KẾ TOÁN CHI'
              : isPendingAdmin
              ? '⏳ CHỜ ADMIN DUYỆT'
              : '❌ ĐÃ TỪ CHỐI';

            const userProfile = ticket.user?.profile;
            const deptName =
              ticket.user?.departmentLinks?.[0]?.department?.name || 'Phòng ban';
            const posName = ticket.user?.departmentLinks?.[0]?.position?.name || 'Nhân viên';

            return (
              <View key={ticket.id} style={[styles.ticketCard, { borderColor: statusBorder }]}>
                {/* Top Row: Employee Profile Info */}
                <View style={styles.ticketTopRow}>
                  <View style={styles.ticketAvatarBox}>
                    {userProfile?.avatarUrl ? (
                      <Image source={{ uri: userProfile.avatarUrl }} style={styles.ticketAvatar} />
                    ) : (
                      <View style={styles.ticketAvatarFallback}>
                        <Text style={styles.ticketAvatarText}>
                          {(userProfile?.fullName || ticket.user?.userCode || 'NV')
                            .slice(0, 2)
                            .toUpperCase()}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.ticketEmpName}>
                      {userProfile?.fullName || 'Chưa cập nhật tên'}
                    </Text>
                    <Text style={styles.ticketEmpMeta}>
                      {ticket.user?.userCode} • {posName} • {deptName}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.ticketStatusChip,
                      { backgroundColor: statusBg, borderColor: statusBorder },
                    ]}
                  >
                    <Text style={[styles.ticketStatusChipText, { color: statusColor }]}>
                      {statusLabel}
                    </Text>
                  </View>
                </View>

                {/* Amount Banner */}
                <View style={styles.amountBanner}>
                  <View>
                    <Text style={styles.amountLabel}>Số tiền yêu cầu rút:</Text>
                    <Text style={styles.amountValue}>
                      {ticket.cashAmount.toLocaleString('vi-VN')} VNĐ
                    </Text>
                  </View>
                  <View style={styles.pointsBadge}>
                    <MaterialCommunityIcons name="star-shooting" size={14} color="#D97706" />
                    <Text style={styles.pointsBadgeText}>
                      {ticket.pointsWithdrawn.toLocaleString('vi-VN')} điểm
                    </Text>
                  </View>
                </View>

                {/* Banking Information (Clear & Copyable Display) */}
                <View style={styles.bankInfoContainer}>
                  <View style={styles.bankHeaderRow}>
                    <MaterialCommunityIcons name="bank" size={16} color="#4338CA" />
                    <Text style={styles.bankHeaderTitle}>Thông tin tài khoản thụ hưởng</Text>
                  </View>

                  <View style={styles.bankDetailsGrid}>
                    <View style={styles.bankDetailRow}>
                      <Text style={styles.bankFieldLabel}>Ngân hàng:</Text>
                      <Text style={styles.bankFieldValueBold}>{ticket.bankName}</Text>
                    </View>

                    <View style={styles.bankDetailRow}>
                      <Text style={styles.bankFieldLabel}>Số tài khoản:</Text>
                      <Text style={[styles.bankFieldValueBold, { color: '#059669', fontSize: 14 }]}>
                        {ticket.bankAccountNumber}
                      </Text>
                    </View>

                    <View style={styles.bankDetailRow}>
                      <Text style={styles.bankFieldLabel}>Chủ tài khoản:</Text>
                      <Text style={styles.bankFieldValueBold}>{ticket.bankAccountName}</Text>
                    </View>

                    {ticket.note ? (
                      <View style={styles.bankDetailRow}>
                        <Text style={styles.bankFieldLabel}>Ghi chú rút:</Text>
                        <Text style={styles.bankFieldValue}>{ticket.note}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>

                {/* Audit & Workflow History */}
                <View style={styles.auditContainer}>
                  <Text style={styles.auditCreatedText}>
                    Tạo yêu cầu: {new Date(ticket.createdAt).toLocaleString('vi-VN')}
                  </Text>

                  {ticket.adminApprovedAt && (
                    <View style={styles.auditStepRow}>
                      <MaterialCommunityIcons name="check-bold" size={14} color="#059669" />
                      <Text style={styles.auditStepText}>
                        Admin đã duyệt: {new Date(ticket.adminApprovedAt).toLocaleString('vi-VN')}
                        {ticket.adminNote ? ` • "${ticket.adminNote}"` : ''}
                      </Text>
                    </View>
                  )}

                  {ticket.accountantConfirmedAt && (
                    <View style={styles.auditStepRow}>
                      <MaterialCommunityIcons name="cash-check" size={14} color="#059669" />
                      <Text style={styles.auditStepText}>
                        Kế toán đã chi:{' '}
                        {new Date(ticket.accountantConfirmedAt).toLocaleString('vi-VN')}
                        {ticket.transactionReference ? ` • Mã GD: ${ticket.transactionReference}` : ''}
                        {ticket.accountantNote ? ` • "${ticket.accountantNote}"` : ''}
                      </Text>
                    </View>
                  )}

                  {ticket.rejectedAt && (
                    <View style={styles.auditStepRowReject}>
                      <MaterialCommunityIcons name="alert-circle" size={14} color="#DC2626" />
                      <Text style={styles.auditStepTextReject}>
                        Từ chối lúc {new Date(ticket.rejectedAt).toLocaleString('vi-VN')}
                        {ticket.rejectReason ? `: "${ticket.rejectReason}"` : ''}
                        <Text style={{ fontWeight: '700' }}> (Điểm đã tự động hoàn về ví)</Text>
                      </Text>
                    </View>
                  )}
                </View>

                {/* Workflow Actions */}
                {isPendingAdmin && (
                  <View style={styles.actionBtnsRow}>
                    <Pressable
                      style={styles.rejectBtn}
                      onPress={() => openRejectModal(ticket)}
                    >
                      <MaterialCommunityIcons name="close" size={16} color="#DC2626" />
                      <Text style={styles.rejectBtnText}>Từ chối</Text>
                    </Pressable>

                    <Pressable
                      style={styles.adminApproveBtn}
                      onPress={() => openAdminApproveModal(ticket)}
                    >
                      <MaterialCommunityIcons name="check-decagram" size={16} color="#FFFFFF" />
                      <Text style={styles.adminApproveBtnText}>Duyệt chuyển Kế toán</Text>
                    </Pressable>
                  </View>
                )}

                {isPendingAcc && (
                  <View style={styles.actionBtnsRow}>
                    <Pressable
                      style={styles.rejectBtn}
                      onPress={() => openRejectModal(ticket)}
                    >
                      <MaterialCommunityIcons name="close" size={16} color="#DC2626" />
                      <Text style={styles.rejectBtnText}>Từ chối</Text>
                    </Pressable>

                    <Pressable
                      style={styles.accountantPayBtn}
                      onPress={() => openAccountantPayModal(ticket)}
                    >
                      <MaterialCommunityIcons name="cash-fast" size={16} color="#FFFFFF" />
                      <Text style={styles.accountantPayBtnText}>Xác nhận đã chuyển tiền</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: ADMIN APPROVE MODAL                              */}
      {/* ========================================================= */}
      {modalType === 'ADMIN_APPROVE' && selectedTicket && (
        <Modal visible transparent animationType="fade" onRequestClose={() => setModalType(null)}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalOverlay}
          >
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={styles.modalIconBadgeGreen}>
                    <MaterialCommunityIcons name="shield-check" size={22} color="#059669" />
                  </View>
                  <View>
                    <Text style={styles.modalTitle}>Duyệt Yêu Cầu Rút Tiền</Text>
                    <Text style={styles.modalSubtitle}>Bước 1: Ban Giám Đốc / Admin phê duyệt</Text>
                  </View>
                </View>
                <Pressable onPress={() => setModalType(null)} style={styles.closeBtn}>
                  <MaterialCommunityIcons name="close" size={20} color="#6B7280" />
                </Pressable>
              </View>

              {/* Summary Card */}
              <View style={styles.modalSummaryBox}>
                <Text style={styles.modalSummaryLabel}>Nhân sự:</Text>
                <Text style={styles.modalSummaryValue}>
                  {selectedTicket.user?.profile?.fullName || selectedTicket.user?.userCode} (
                  {selectedTicket.user?.userCode})
                </Text>

                <Text style={styles.modalSummaryLabel}>Số tiền phê duyệt:</Text>
                <Text style={[styles.modalSummaryValue, { color: '#059669', fontSize: 16 }]}>
                  {selectedTicket.cashAmount.toLocaleString('vi-VN')} VNĐ (
                  {selectedTicket.pointsWithdrawn.toLocaleString('vi-VN')} điểm)
                </Text>

                <Text style={styles.modalSummaryLabel}>Tài khoản nhận:</Text>
                <Text style={styles.modalSummaryValue}>
                  {selectedTicket.bankName} - {selectedTicket.bankAccountNumber} (
                  {selectedTicket.bankAccountName})
                </Text>
              </View>

              {/* Admin Note Input */}
              <Text style={styles.inputLabel}>Ghi chú phê duyệt (Tùy chọn):</Text>
              <TextInput
                style={styles.modalTextInput}
                value={adminNote}
                onChangeText={setAdminNote}
                placeholder="VD: Đã duyệt theo kết quả quý, chuyển Kế toán chi tiền..."
                multiline
                numberOfLines={2}
              />

              {/* Actions */}
              <View style={styles.modalActionsRow}>
                <Pressable
                  style={styles.modalCancelBtn}
                  onPress={() => setModalType(null)}
                  disabled={isSubmitting}
                >
                  <Text style={styles.modalCancelBtnText}>Hủy</Text>
                </Pressable>

                <Pressable
                  style={[styles.modalSubmitBtnGreen, isSubmitting && { opacity: 0.7 }]}
                  onPress={handleAdminApproveSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.modalSubmitBtnText}>Xác nhận Duyệt</Text>
                  )}
                </Pressable>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: ACCOUNTANT CONFIRM PAYMENT MODAL                 */}
      {/* ========================================================= */}
      {modalType === 'ACCOUNTANT_PAY' && selectedTicket && (
        <Modal visible transparent animationType="fade" onRequestClose={() => setModalType(null)}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalOverlay}
          >
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={styles.modalIconBadgeBlue}>
                    <MaterialCommunityIcons name="bank-transfer" size={22} color="#2563EB" />
                  </View>
                  <View>
                    <Text style={styles.modalTitle}>Xác Nhận Đã Chi Tiền</Text>
                    <Text style={styles.modalSubtitle}>Bước 2: Kế toán chuyển khoản thành công</Text>
                  </View>
                </View>
                <Pressable onPress={() => setModalType(null)} style={styles.closeBtn}>
                  <MaterialCommunityIcons name="close" size={20} color="#6B7280" />
                </Pressable>
              </View>

              {/* Summary Card */}
              <View style={styles.modalSummaryBox}>
                <Text style={styles.modalSummaryLabel}>Người nhận:</Text>
                <Text style={styles.modalSummaryValue}>
                  {selectedTicket.user?.profile?.fullName || selectedTicket.user?.userCode}
                </Text>

                <Text style={styles.modalSummaryLabel}>Số tiền đã chuyển:</Text>
                <Text style={[styles.modalSummaryValue, { color: '#2563EB', fontSize: 16 }]}>
                  {selectedTicket.cashAmount.toLocaleString('vi-VN')} VNĐ
                </Text>

                <Text style={styles.modalSummaryLabel}>Thông tin ngân hàng:</Text>
                <Text style={styles.modalSummaryValue}>
                  {selectedTicket.bankName} • STK:{' '}
                  <Text style={{ fontWeight: '800' }}>{selectedTicket.bankAccountNumber}</Text> •{' '}
                  {selectedTicket.bankAccountName}
                </Text>
              </View>

              {/* Transaction Ref Input */}
              <Text style={styles.inputLabel}>Mã giao dịch / Số UNC ngân hàng (Tùy chọn):</Text>
              <TextInput
                style={styles.modalTextInputSingle}
                value={transactionRef}
                onChangeText={setTransactionRef}
                placeholder="VD: FT260905189283..."
              />

              {/* Accountant Note Input */}
              <Text style={styles.inputLabel}>Ghi chú chi tiền (Tùy chọn):</Text>
              <TextInput
                style={styles.modalTextInput}
                value={accountantNote}
                onChangeText={setAccountantNote}
                placeholder="VD: Đã chuyển khoản qua Techcombank lúc 15:30..."
                multiline
                numberOfLines={2}
              />

              {/* Actions */}
              <View style={styles.modalActionsRow}>
                <Pressable
                  style={styles.modalCancelBtn}
                  onPress={() => setModalType(null)}
                  disabled={isSubmitting}
                >
                  <Text style={styles.modalCancelBtnText}>Hủy</Text>
                </Pressable>

                <Pressable
                  style={[styles.modalSubmitBtnBlue, isSubmitting && { opacity: 0.7 }]}
                  onPress={handleAccountantPaySubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.modalSubmitBtnText}>Xác nhận Đã Chi Tiền</Text>
                  )}
                </Pressable>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: REJECT MODAL                                     */}
      {/* ========================================================= */}
      {modalType === 'REJECT' && selectedTicket && (
        <Modal visible transparent animationType="fade" onRequestClose={() => setModalType(null)}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalOverlay}
          >
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={styles.modalIconBadgeRed}>
                    <MaterialCommunityIcons name="alert-circle-outline" size={22} color="#DC2626" />
                  </View>
                  <View>
                    <Text style={styles.modalTitle}>Từ Chối Yêu Cầu Rút Tiền</Text>
                    <Text style={styles.modalSubtitle}>Hệ thống sẽ tự động hoàn điểm vào ví</Text>
                  </View>
                </View>
                <Pressable onPress={() => setModalType(null)} style={styles.closeBtn}>
                  <MaterialCommunityIcons name="close" size={20} color="#6B7280" />
                </Pressable>
              </View>

              {/* Warning Notice */}
              <View style={styles.modalWarningBox}>
                <MaterialCommunityIcons name="information" size={18} color="#991B1B" />
                <Text style={styles.modalWarningText}>
                  Khi từ chối, toàn bộ{' '}
                  <Text style={{ fontWeight: '800' }}>
                    {selectedTicket.pointsWithdrawn.toLocaleString('vi-VN')} điểm
                  </Text>{' '}
                  sẽ được hoàn trả ngay lập tức vào các mốc quý của nhân viên.
                </Text>
              </View>

              {/* Reject Reason Input */}
              <Text style={styles.inputLabel}>
                Lý do từ chối <Text style={{ color: '#DC2626' }}>*</Text>:
              </Text>
              <TextInput
                style={[styles.modalTextInput, { borderColor: '#FECACA' }]}
                value={rejectReason}
                onChangeText={setRejectReason}
                placeholder="VD: Sai thông tin số tài khoản ngân hàng, vui lòng cập nhật lại..."
                multiline
                numberOfLines={3}
              />

              {/* Actions */}
              <View style={styles.modalActionsRow}>
                <Pressable
                  style={styles.modalCancelBtn}
                  onPress={() => setModalType(null)}
                  disabled={isSubmitting}
                >
                  <Text style={styles.modalCancelBtnText}>Hủy</Text>
                </Pressable>

                <Pressable
                  style={[styles.modalSubmitBtnRed, isSubmitting && { opacity: 0.7 }]}
                  onPress={handleRejectSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.modalSubmitBtnText}>Từ Chối & Hoàn Điểm</Text>
                  )}
                </Pressable>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterTabsWrapper: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 12,
  },
  filterTabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterTabBtnActiveAdmin: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  filterTabBtnActiveAcc: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  filterTabBtnActivePaid: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  filterTabBtnActiveRejected: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  filterTabBtnActiveAll: {
    backgroundColor: '#F1F5F9',
    borderColor: '#CBD5E1',
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  filterTabTextActiveAdmin: {
    color: '#D97706',
    fontWeight: '700',
  },
  filterTabTextActiveAcc: {
    color: '#2563EB',
    fontWeight: '700',
  },
  filterTabTextActivePaid: {
    color: '#059669',
    fontWeight: '700',
  },
  filterTabTextActiveRejected: {
    color: '#DC2626',
    fontWeight: '700',
  },
  filterTabTextActiveAll: {
    color: '#1E293B',
    fontWeight: '700',
  },
  badgeOrange: {
    backgroundColor: '#D97706',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeBlue: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeTextWhite: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  ticketList: {
    gap: 12,
    paddingBottom: 24,
  },
  ticketCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  ticketTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  ticketAvatarBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    overflow: 'hidden',
  },
  ticketAvatar: {
    width: '100%',
    height: '100%',
  },
  ticketAvatarFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  ticketAvatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4B5563',
  },
  ticketEmpName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  ticketEmpMeta: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  ticketStatusChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  ticketStatusChipText: {
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
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  amountLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 2,
  },
  amountValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  pointsBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
  },
  bankInfoContainer: {
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  bankHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  bankHeaderTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3730A3',
  },
  bankDetailsGrid: {
    gap: 4,
  },
  bankDetailRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  bankFieldLabel: {
    fontSize: 11,
    color: '#475569',
    width: 90,
  },
  bankFieldValueBold: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
  },
  bankFieldValue: {
    fontSize: 11,
    color: '#334155',
    flex: 1,
  },
  auditContainer: {
    paddingTop: 4,
    marginBottom: 10,
    gap: 4,
  },
  auditCreatedText: {
    fontSize: 10,
    color: '#94A3B8',
  },
  auditStepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ECFDF5',
    padding: 6,
    borderRadius: 6,
  },
  auditStepText: {
    fontSize: 11,
    color: '#065F46',
    fontWeight: '600',
    flex: 1,
  },
  auditStepRowReject: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FEF2F2',
    padding: 6,
    borderRadius: 6,
  },
  auditStepTextReject: {
    fontSize: 11,
    color: '#991B1B',
    flex: 1,
  },
  actionBtnsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  rejectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#FEF2F2',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  rejectBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
  adminApproveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#D97706',
    paddingVertical: 10,
    borderRadius: 10,
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  adminApproveBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  accountantPayBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#059669',
    paddingVertical: 10,
    borderRadius: 10,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  accountantPayBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  modalIconBadgeGreen: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  modalIconBadgeBlue: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  modalIconBadgeRed: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSummaryBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  modalSummaryLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
  },
  modalSummaryValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4,
    marginTop: 6,
  },
  modalTextInputSingle: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 13,
    backgroundColor: '#F8FAFC',
    color: '#0F172A',
    marginBottom: 8,
  },
  modalTextInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    padding: 10,
    fontSize: 13,
    backgroundColor: '#F8FAFC',
    color: '#0F172A',
    minHeight: 56,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  modalWarningBox: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#FEF2F2',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginBottom: 10,
  },
  modalWarningText: {
    fontSize: 11,
    color: '#991B1B',
    flex: 1,
    lineHeight: 16,
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  modalSubmitBtnGreen: {
    flex: 2,
    backgroundColor: '#D97706',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubmitBtnBlue: {
    flex: 2,
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubmitBtnRed: {
    flex: 2,
    backgroundColor: '#DC2626',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubmitBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
