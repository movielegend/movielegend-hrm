import React, { useState, useMemo } from 'react';
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
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import Toast from 'react-native-toast-message';

import { SearchInput } from '../../components/SearchInput';
import { LoadingState } from '../../components/LoadingState';
import { EmptyState } from '../../components/EmptyState';
import {
  getVaultWithdrawalRequests,
  adminApproveWithdrawal,
  accountantConfirmWithdrawal,
  rejectWithdrawal,
} from '../../api/employees.api';
import type {
  RewardWithdrawalRequest,
  WithdrawalRequestsResponse,
} from '../../types/employee.types';

type FilterTab = 'ALL' | 'PENDING_ADMIN' | 'PENDING_ACCOUNTANT' | 'PAID' | 'REJECTED';

interface WithdrawalRequestsManagerProps {
  onBadgeCountChange?: (pendingCount: number) => void;
}

function getInitials(name?: string, fallback = 'NV'): string {
  if (!name) return fallback;
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Helper to normalize bank code for VietQR Quick Pay API
function getBankCode(bankName: string): string {
  const normalized = (bankName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (normalized.includes('vietcom') || normalized.includes('vcb')) return 'VCB';
  if (normalized.includes('techcom') || normalized.includes('tcb')) return 'TCB';
  if (normalized.includes('mb') || normalized.includes('quandoi')) return 'MB';
  if (normalized.includes('vp') || normalized.includes('vpbank')) return 'VPB';
  if (normalized.includes('vietin') || normalized.includes('ctg')) return 'CTG';
  if (normalized.includes('bidv')) return 'BIDV';
  if (normalized.includes('acb')) return 'ACB';
  if (normalized.includes('tp') || normalized.includes('tpb')) return 'TPB';
  if (normalized.includes('sacom') || normalized.includes('stb')) return 'STB';
  if (normalized.includes('agri') || normalized.includes('vba')) return 'VBA';
  if (normalized.includes('vib')) return 'VIB';
  if (normalized.includes('msb')) return 'MSB';
  if (normalized.includes('hdbank') || normalized.includes('hdb')) return 'HDB';
  if (normalized.includes('shb')) return 'SHB';
  return (bankName || '').replace(/\s+/g, '');
}

export function WithdrawalRequestsManager({ onBadgeCountChange }: WithdrawalRequestsManagerProps) {
  const [activeTab, setActiveTab] = useState<FilterTab>('PENDING_ADMIN');
  const [search, setSearch] = useState('');

  // Modals state
  const [selectedTicket, setSelectedTicket] = useState<RewardWithdrawalRequest | null>(null);
  const [modalType, setModalType] = useState<'ADMIN_APPROVE' | 'ACCOUNTANT_PAY' | 'REJECT' | 'VIETQR' | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [transactionRef, setTransactionRef] = useState('');
  const [accountantNote, setAccountantNote] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery<WithdrawalRequestsResponse>({
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

  // Copy helper with Toast notification
  const copyToClipboard = async (text: string, label: string) => {
    try {
      await Clipboard.setStringAsync(text);
      Toast.show({
        type: 'success',
        text1: `Đã sao chép ${label}`,
        text2: text,
        visibilityTime: 2000,
      });
    } catch {
      Alert.alert('Sao chép', text);
    }
  };

  // Modals triggers
  const openAdminApproveModal = (ticket: RewardWithdrawalRequest) => {
    setSelectedTicket(ticket);
    setAdminNote('');
    setModalType('ADMIN_APPROVE');
  };

  const handleAdminApproveSubmit = async () => {
    if (!selectedTicket) return;
    try {
      setIsSubmitting(true);
      await adminApproveWithdrawal(selectedTicket.id, {
        note: adminNote.trim() || undefined,
      });

      Toast.show({
        type: 'success',
        text1: 'Phê duyệt thành công! ✅',
        text2: `Đã chuyển tiếp yêu cầu của ${selectedTicket.user?.profile?.fullName || selectedTicket.user?.userCode} cho Kế toán.`,
      });

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

  const openAccountantPayModal = (ticket: RewardWithdrawalRequest) => {
    setSelectedTicket(ticket);
    setTransactionRef('');
    setAccountantNote('');
    setModalType('ACCOUNTANT_PAY');
  };

  const handleAccountantPaySubmit = async () => {
    if (!selectedTicket) return;
    try {
      setIsSubmitting(true);
      await accountantConfirmWithdrawal(selectedTicket.id, {
        transactionReference: transactionRef.trim() || undefined,
        note: accountantNote.trim() || undefined,
      });

      Toast.show({
        type: 'success',
        text1: 'Xác nhận chi tiền thành công! 💸',
        text2: `Đã xác nhận thanh toán ${selectedTicket.cashAmount.toLocaleString('vi-VN')} VNĐ.`,
      });

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

  const openRejectModal = (ticket: RewardWithdrawalRequest) => {
    setSelectedTicket(ticket);
    setRejectReason('');
    setModalType('REJECT');
  };

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

      Toast.show({
        type: 'info',
        text1: 'Đã từ chối yêu cầu ❌',
        text2: `Đã hoàn lại ${selectedTicket.pointsWithdrawn.toLocaleString('vi-VN')} điểm vào ví nhân viên.`,
      });

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

  const openVietQRModal = (ticket: RewardWithdrawalRequest) => {
    setSelectedTicket(ticket);
    setModalType('VIETQR');
  };

  return (
    <View style={styles.container}>
      {/* Modern Filter Pill Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.unifiedTabsWrapper}
      >
        {/* Tab 1: Pending Admin */}
        <Pressable
          style={[
            styles.filterPill,
            activeTab === 'PENDING_ADMIN' && styles.filterPillActive,
          ]}
          onPress={() => setActiveTab('PENDING_ADMIN')}
        >
          <Text style={[styles.filterPillText, activeTab === 'PENDING_ADMIN' && styles.filterPillTextActive]}>
            Chờ Admin duyệt
          </Text>
          <View style={[styles.filterPillBadge, activeTab === 'PENDING_ADMIN' && styles.filterPillBadgeActive]}>
            <Text style={[styles.filterPillBadgeText, activeTab === 'PENDING_ADMIN' && styles.filterPillBadgeTextActive]}>
              {counts.PENDING_ADMIN}
            </Text>
          </View>
        </Pressable>

        {/* Tab 2: Pending Accountant */}
        <Pressable
          style={[
            styles.filterPill,
            activeTab === 'PENDING_ACCOUNTANT' && styles.filterPillActive,
          ]}
          onPress={() => setActiveTab('PENDING_ACCOUNTANT')}
        >
          <Text style={[styles.filterPillText, activeTab === 'PENDING_ACCOUNTANT' && styles.filterPillTextActive]}>
            Chờ Kế toán chi
          </Text>
          <View style={[styles.filterPillBadge, activeTab === 'PENDING_ACCOUNTANT' && styles.filterPillBadgeActive]}>
            <Text style={[styles.filterPillBadgeText, activeTab === 'PENDING_ACCOUNTANT' && styles.filterPillBadgeTextActive]}>
              {counts.PENDING_ACCOUNTANT}
            </Text>
          </View>
        </Pressable>

        {/* Tab 3: Paid */}
        <Pressable
          style={[
            styles.filterPill,
            activeTab === 'PAID' && styles.filterPillActive,
          ]}
          onPress={() => setActiveTab('PAID')}
        >
          <Text style={[styles.filterPillText, activeTab === 'PAID' && styles.filterPillTextActive]}>
            Đã chi tiền
          </Text>
          <View style={[styles.filterPillBadge, activeTab === 'PAID' && styles.filterPillBadgeActive]}>
            <Text style={[styles.filterPillBadgeText, activeTab === 'PAID' && styles.filterPillBadgeTextActive]}>
              {counts.PAID}
            </Text>
          </View>
        </Pressable>

        {/* Tab 4: Rejected */}
        <Pressable
          style={[
            styles.filterPill,
            activeTab === 'REJECTED' && styles.filterPillActive,
          ]}
          onPress={() => setActiveTab('REJECTED')}
        >
          <Text style={[styles.filterPillText, activeTab === 'REJECTED' && styles.filterPillTextActive]}>
            Đã từ chối
          </Text>
          <View style={[styles.filterPillBadge, activeTab === 'REJECTED' && styles.filterPillBadgeActive]}>
            <Text style={[styles.filterPillBadgeText, activeTab === 'REJECTED' && styles.filterPillBadgeTextActive]}>
              {counts.REJECTED}
            </Text>
          </View>
        </Pressable>

        {/* Tab 5: All */}
        <Pressable
          style={[
            styles.filterPill,
            activeTab === 'ALL' && styles.filterPillActive,
          ]}
          onPress={() => setActiveTab('ALL')}
        >
          <Text style={[styles.filterPillText, activeTab === 'ALL' && styles.filterPillTextActive]}>
            Tất cả
          </Text>
          <View style={[styles.filterPillBadge, activeTab === 'ALL' && styles.filterPillBadgeActive]}>
            <Text style={[styles.filterPillBadgeText, activeTab === 'ALL' && styles.filterPillBadgeTextActive]}>
              {counts.TOTAL}
            </Text>
          </View>
        </Pressable>
      </ScrollView>

      {/* Search Input */}
      <View style={{ marginBottom: 14 }}>
        <SearchInput
          value={search}
          onChangeText={setSearch}
          placeholder="Tìm theo tên hoặc mã nhân viên..."
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
          message="Các yêu cầu rút điểm từ Ví Điểm Thưởng sẽ hiển thị tại đây."
        />
      ) : (
        <View style={styles.ticketList}>
          {requests.map((ticket) => {
            const isPendingAdmin = ticket.status === 'PENDING_ADMIN';
            const isPendingAcc = ticket.status === 'PENDING_ACCOUNTANT';
            const isPaid = ticket.status === 'PAID';

            const statusBg = isPaid
              ? '#D1FAE5'
              : isPendingAcc
              ? '#DBEAFE'
              : isPendingAdmin
              ? '#FEF3C7'
              : '#FEE2E2';

            const statusColor = isPaid
              ? '#065F46'
              : isPendingAcc
              ? '#1E40AF'
              : isPendingAdmin
              ? '#92400E'
              : '#991B1B';

            const statusLabel = isPaid
              ? 'Đã chi tiền'
              : isPendingAcc
              ? 'Chờ Kế toán chi'
              : isPendingAdmin
              ? 'Chờ Admin duyệt'
              : 'Đã từ chối';

            const userProfile = ticket.user?.profile;
            const deptName = ticket.user?.departmentLinks?.[0]?.department?.name || 'Phòng ban';
            const posName = ticket.user?.departmentLinks?.[0]?.position?.name || 'Nhân viên';

            return (
              <View key={ticket.id} style={styles.ticketCard}>
                {/* Header: User Info & Status */}
                <View style={styles.ticketTopRow}>
                  <View style={styles.ticketAvatarBox}>
                    {userProfile?.avatarUrl ? (
                      <Image source={{ uri: userProfile.avatarUrl }} style={styles.ticketAvatar} />
                    ) : (
                      <View style={styles.ticketAvatarFallback}>
                        <Text style={styles.ticketAvatarText}>
                          {getInitials(userProfile?.fullName, ticket.user?.userCode || 'NV')}
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

                  <View style={[styles.ticketStatusChip, { backgroundColor: statusBg }]}>
                    <Text style={[styles.ticketStatusChipText, { color: statusColor }]}>
                      {statusLabel}
                    </Text>
                  </View>
                </View>

                {/* Amount Highlight Banner */}
                <View style={styles.amountBanner}>
                  <View>
                    <Text style={styles.amountLabel}>Số tiền quy đổi</Text>
                    <Text style={styles.amountValue}>
                      {Number(ticket.cashAmount).toLocaleString('vi-VN')} <Text style={styles.currencyUnit}>VNĐ</Text>
                    </Text>
                  </View>
                  <View style={styles.pointsBadge}>
                    <MaterialCommunityIcons name="star-shooting-outline" size={14} color="#B45309" />
                    <Text style={styles.pointsBadgeText}>
                      {Number(ticket.pointsWithdrawn).toLocaleString('vi-VN')} điểm
                    </Text>
                  </View>
                </View>

                {/* Note (if any) */}
                {ticket.note ? (
                  <View style={styles.noteBox}>
                    <MaterialCommunityIcons name="comment-text-outline" size={13} color="#64748B" />
                    <Text style={styles.noteText}>
                      <Text style={{ fontWeight: '600', color: '#334155' }}>Ghi chú: </Text>
                      {ticket.note}
                    </Text>
                  </View>
                ) : null}

                {/* Timeline Info */}
                <View style={styles.auditContainer}>
                  <View style={styles.auditStepRow}>
                    <MaterialCommunityIcons name="clock-outline" size={13} color="#94A3B8" />
                    <Text style={styles.auditCreatedText}>
                      Gửi lúc: {new Date(ticket.createdAt).toLocaleString('vi-VN')}
                    </Text>
                  </View>

                  {ticket.adminApprovedAt && (
                    <View style={styles.auditStepRow}>
                      <MaterialCommunityIcons name="check-circle-outline" size={13} color="#059669" />
                      <Text style={styles.auditStepText}>
                        Admin duyệt: {new Date(ticket.adminApprovedAt).toLocaleString('vi-VN')}
                        {ticket.adminNote ? ` • "${ticket.adminNote}"` : ''}
                      </Text>
                    </View>
                  )}

                  {ticket.accountantConfirmedAt && (
                    <View style={styles.auditStepRow}>
                      <MaterialCommunityIcons name="cash-check" size={13} color="#059669" />
                      <Text style={styles.auditStepText}>
                        Kế toán chi: {new Date(ticket.accountantConfirmedAt).toLocaleString('vi-VN')}
                        {ticket.transactionReference ? ` • Mã GD: ${ticket.transactionReference}` : ''}
                      </Text>
                    </View>
                  )}

                  {ticket.rejectedAt && (
                    <View style={styles.auditStepRowReject}>
                      <MaterialCommunityIcons name="alert-circle-outline" size={13} color="#DC2626" />
                      <Text style={styles.auditStepTextReject}>
                        Đã từ chối lúc {new Date(ticket.rejectedAt).toLocaleString('vi-VN')}
                        {ticket.rejectReason ? `: "${ticket.rejectReason}"` : ''}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Action Buttons */}
                {isPendingAdmin && (
                  <View style={styles.actionBtnsRow}>
                    <Pressable style={styles.rejectBtn} onPress={() => openRejectModal(ticket)}>
                      <MaterialCommunityIcons name="close-circle-outline" size={16} color="#DC2626" />
                      <Text style={styles.rejectBtnText}>Từ chối</Text>
                    </Pressable>

                    <Pressable style={styles.adminApproveBtn} onPress={() => openAdminApproveModal(ticket)}>
                      <MaterialCommunityIcons name="shield-check" size={16} color="#FFFFFF" />
                      <Text style={styles.adminApproveBtnText}>Duyệt chuyển Kế toán</Text>
                    </Pressable>
                  </View>
                )}

                {isPendingAcc && (
                  <View style={styles.actionBtnsRow}>
                    <Pressable style={styles.rejectBtn} onPress={() => openRejectModal(ticket)}>
                      <MaterialCommunityIcons name="close-circle-outline" size={16} color="#DC2626" />
                      <Text style={styles.rejectBtnText}>Từ chối</Text>
                    </Pressable>

                    <Pressable style={styles.accountantPayBtn} onPress={() => openAccountantPayModal(ticket)}>
                      <MaterialCommunityIcons name="cash-fast" size={16} color="#FFFFFF" />
                      <Text style={styles.accountantPayBtnText}>Xác nhận đã chi tiền</Text>
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
                    <Text style={styles.modalSubtitle}>Bước 1: Admin / Ban Giám Đốc phê duyệt</Text>
                  </View>
                </View>
                <Pressable onPress={() => setModalType(null)} style={styles.closeBtn}>
                  <MaterialCommunityIcons name="close" size={20} color="#6B7280" />
                </Pressable>
              </View>

              <View style={styles.modalSummaryBox}>
                <Text style={styles.modalSummaryLabel}>Nhân sự yêu cầu:</Text>
                <Text style={styles.modalSummaryValue}>
                  {selectedTicket.user?.profile?.fullName || selectedTicket.user?.userCode} (
                  {selectedTicket.user?.userCode})
                </Text>

                <Text style={styles.modalSummaryLabel}>Số tiền phê duyệt:</Text>
                <Text style={[styles.modalSummaryValue, { color: '#059669', fontSize: 16, fontWeight: '800' }]}>
                  {selectedTicket.cashAmount.toLocaleString('vi-VN')} VNĐ (
                  {selectedTicket.pointsWithdrawn.toLocaleString('vi-VN')} điểm)
                </Text>

                <Text style={styles.modalSummaryLabel}>Tài khoản thụ hưởng:</Text>
                <Text style={styles.modalSummaryValue}>
                  {selectedTicket.bankName} - {selectedTicket.bankAccountNumber} (
                  {selectedTicket.bankAccountName})
                </Text>
              </View>

              <Text style={styles.inputLabel}>Ghi chú phê duyệt (Tùy chọn):</Text>
              <TextInput
                style={styles.modalTextInput}
                value={adminNote}
                onChangeText={setAdminNote}
                placeholder="VD: Đã kiểm tra kết quả quy đổi, chuyển Kế toán chi..."
                multiline
                numberOfLines={2}
              />

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
                    <Text style={styles.modalSubtitle}>Bước 2: Kế toán chuyển khoản ngân hàng thành công</Text>
                  </View>
                </View>
                <Pressable onPress={() => setModalType(null)} style={styles.closeBtn}>
                  <MaterialCommunityIcons name="close" size={20} color="#6B7280" />
                </Pressable>
              </View>

              <View style={styles.modalSummaryBox}>
                <Text style={styles.modalSummaryLabel}>Người nhận:</Text>
                <Text style={styles.modalSummaryValue}>
                  {selectedTicket.user?.profile?.fullName || selectedTicket.user?.userCode}
                </Text>

                <Text style={styles.modalSummaryLabel}>Số tiền đã chuyển:</Text>
                <Text style={[styles.modalSummaryValue, { color: '#2563EB', fontSize: 16, fontWeight: '800' }]}>
                  {selectedTicket.cashAmount.toLocaleString('vi-VN')} VNĐ
                </Text>

                <Text style={styles.modalSummaryLabel}>Thông tin chuyển khoản:</Text>
                <Text style={styles.modalSummaryValue}>
                  {selectedTicket.bankName} • STK:{' '}
                  <Text style={{ fontWeight: '800', color: '#059669' }}>{selectedTicket.bankAccountNumber}</Text> •{' '}
                  {selectedTicket.bankAccountName}
                </Text>
              </View>

              <Text style={styles.inputLabel}>Mã giao dịch / Số UNC (Tùy chọn):</Text>
              <TextInput
                style={styles.modalTextInputSingle}
                value={transactionRef}
                onChangeText={setTransactionRef}
                placeholder="VD: FT260905189283..."
              />

              <Text style={styles.inputLabel}>Ghi chú chi tiền (Tùy chọn):</Text>
              <TextInput
                style={styles.modalTextInput}
                value={accountantNote}
                onChangeText={setAccountantNote}
                placeholder="VD: Đã chuyển thành công qua MBBank..."
                multiline
                numberOfLines={2}
              />

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

              <View style={styles.modalWarningBox}>
                <MaterialCommunityIcons name="information" size={18} color="#991B1B" />
                <Text style={styles.modalWarningText}>
                  Khi từ chối, toàn bộ{' '}
                  <Text style={{ fontWeight: '800' }}>
                    {selectedTicket.pointsWithdrawn.toLocaleString('vi-VN')} điểm
                  </Text>{' '}
                  sẽ được hoàn trả lại ngay lập tức vào ví của nhân viên.
                </Text>
              </View>

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

      {/* ========================================================= */}
      {/* MODAL 4: VIETQR QUICK PAY MODAL                           */}
      {/* ========================================================= */}
      {modalType === 'VIETQR' && selectedTicket && (
        <Modal visible transparent animationType="fade" onRequestClose={() => setModalType(null)}>
          <View style={styles.modalOverlay}>
            <View style={styles.qrModalCard}>
              <View style={styles.modalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={styles.modalIconBadgeSky}>
                    <MaterialCommunityIcons name="qrcode-scan" size={22} color="#0284C7" />
                  </View>
                  <View>
                    <Text style={styles.modalTitle}>Mã VietQR Chuyển Khoản</Text>
                    <Text style={styles.modalSubtitle}>Mở App Ngân hàng quét mã để chi tiền 1s</Text>
                  </View>
                </View>
                <Pressable onPress={() => setModalType(null)} style={styles.closeBtn}>
                  <MaterialCommunityIcons name="close" size={20} color="#6B7280" />
                </Pressable>
              </View>

              {/* VietQR Code Image */}
              <View style={styles.qrImageContainer}>
                <Image
                  source={{
                    uri: `https://img.vietqr.io/image/${getBankCode(
                      selectedTicket.bankName
                    )}-${selectedTicket.bankAccountNumber}-compact2.png?amount=${
                      selectedTicket.cashAmount
                    }&addInfo=${encodeURIComponent(
                      `RUT TIEN ML ${selectedTicket.user?.userCode || ''} ${selectedTicket.id.slice(0, 8)}`
                    )}&accountName=${encodeURIComponent(selectedTicket.bankAccountName)}`,
                  }}
                  style={styles.qrCodeImage}
                  resizeMode="contain"
                />
              </View>

              <View style={styles.qrInfoGrid}>
                <View style={styles.qrInfoRow}>
                  <Text style={styles.qrInfoLabel}>Chủ tài khoản:</Text>
                  <Text style={styles.qrInfoValueBold}>{selectedTicket.bankAccountName}</Text>
                </View>
                <View style={styles.qrInfoRow}>
                  <Text style={styles.qrInfoLabel}>Số tiền:</Text>
                  <Text style={[styles.qrInfoValueBold, { color: '#059669', fontSize: 16 }]}>
                    {selectedTicket.cashAmount.toLocaleString('vi-VN')} VNĐ
                  </Text>
                </View>
              </View>

              <Pressable style={styles.qrCloseButton} onPress={() => setModalType(null)}>
                <Text style={styles.qrCloseButtonText}>Đóng mã QR</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },

  /* Filter Pills */
  unifiedTabsWrapper: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 12,
    alignItems: 'center',
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  filterPillActive: {
    backgroundColor: '#111827',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  filterPillBadge: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 10,
    minWidth: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterPillBadgeActive: {
    backgroundColor: '#374151',
  },
  filterPillBadgeText: {
    color: '#6B7280',
    fontSize: 10,
    fontWeight: '800',
  },
  filterPillBadgeTextActive: {
    color: '#FFFFFF',
  },

  /* Tickets List */
  ticketList: {
    gap: 12,
    paddingBottom: 24,
  },
  ticketCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ECEEF3',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  ticketAvatar: {
    width: '100%',
    height: '100%',
  },
  ticketAvatarFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ticketAvatarText: {
    color: '#4F46E5',
    fontWeight: '700',
    fontSize: 13,
  },
  ticketEmpName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  ticketEmpMeta: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  ticketStatusChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ticketStatusChipText: {
    fontSize: 11,
    fontWeight: '700',
  },

  /* Amount Banner */
  amountBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  amountLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 2,
  },
  amountValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  currencyUnit: {
    fontSize: 13,
    fontWeight: '700',
    color: '#059669',
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  pointsBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
  },

  /* Note Box */
  noteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 8,
    marginBottom: 10,
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 16,
  },

  /* Bank Info Box */
  bankInfoContainer: {
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  bankHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E7FF',
  },
  bankHeaderTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3730A3',
  },
  vietQrQuickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  vietQrQuickBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0369A1',
  },
  bankDetailsGrid: {
    gap: 6,
  },
  bankDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bankFieldLabel: {
    width: 95,
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  bankFieldValueBold: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  stkHighlight: {
    fontSize: 14,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.5,
  },
  copyIconButton: {
    backgroundColor: '#DBEAFE',
    padding: 4,
    borderRadius: 4,
  },
  memoText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4338CA',
    fontStyle: 'italic',
  },
  bankFieldValue: {
    fontSize: 12,
    color: '#334155',
  },

  /* Audit Container */
  auditContainer: {
    backgroundColor: '#FAFAFA',
    padding: 10,
    borderRadius: 10,
    gap: 4,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  auditCreatedText: {
    fontSize: 11,
    color: '#64748B',
  },
  auditStepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  auditStepText: {
    fontSize: 11,
    color: '#047857',
    fontWeight: '600',
  },
  auditStepRowReject: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  auditStepTextReject: {
    fontSize: 11,
    color: '#B91C1C',
  },

  /* Actions Row */
  actionBtnsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
  },
  rejectBtnText: {
    color: '#DC2626',
    fontWeight: '700',
    fontSize: 13,
  },
  adminApproveBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#D97706',
    paddingVertical: 11,
    borderRadius: 12,
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  adminApproveBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  accountantPayBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#059669',
    paddingVertical: 11,
    borderRadius: 12,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  accountantPayBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },

  /* Modals General */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalIconBadgeGreen: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalIconBadgeBlue: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalIconBadgeRed: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalIconBadgeSky: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },

  /* Modal Inner Summary Box */
  modalSummaryBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    gap: 4,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalSummaryLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  modalSummaryValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  modalWarningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  modalWarningText: {
    flex: 1,
    fontSize: 12,
    color: '#991B1B',
    lineHeight: 18,
  },

  /* Inputs */
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  modalTextInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    padding: 10,
    fontSize: 13,
    color: '#0F172A',
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  modalTextInputSingle: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
    marginBottom: 12,
  },

  /* Modal Actions */
  modalActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
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
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubmitBtnBlue: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubmitBtnRed: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubmitBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  /* VietQR Modal */
  qrModalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  qrImageContainer: {
    width: 240,
    height: 240,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrCodeImage: {
    width: '100%',
    height: '100%',
  },
  qrInfoGrid: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    gap: 6,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  qrInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  qrInfoLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  qrInfoValueBold: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  qrCloseButton: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrCloseButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
