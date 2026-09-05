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
      {/* Unified Stat & Filter Tab Cards */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.unifiedTabsWrapper}
      >
        {/* Tab 1: Pending Admin */}
        <Pressable
          style={[
            styles.statTabCard,
            activeTab === 'PENDING_ADMIN' && styles.statTabCardActiveAdmin,
          ]}
          onPress={() => setActiveTab('PENDING_ADMIN')}
        >
          <View style={styles.statTabTopRow}>
            <MaterialCommunityIcons
              name="account-clock-outline"
              size={18}
              color={activeTab === 'PENDING_ADMIN' ? '#D97706' : '#64748B'}
            />
            <View style={[styles.statTabBadge, activeTab === 'PENDING_ADMIN' ? styles.badgeOrange : styles.badgeSlate]}>
              <Text style={styles.statTabBadgeText}>{counts.PENDING_ADMIN}</Text>
            </View>
          </View>
          <Text style={[styles.statTabLabel, activeTab === 'PENDING_ADMIN' && styles.statTabLabelActiveAdmin]}>
            Chờ Admin duyệt
          </Text>
        </Pressable>

        {/* Tab 2: Pending Accountant */}
        <Pressable
          style={[
            styles.statTabCard,
            activeTab === 'PENDING_ACCOUNTANT' && styles.statTabCardActiveAcc,
          ]}
          onPress={() => setActiveTab('PENDING_ACCOUNTANT')}
        >
          <View style={styles.statTabTopRow}>
            <MaterialCommunityIcons
              name="bank-transfer-out"
              size={18}
              color={activeTab === 'PENDING_ACCOUNTANT' ? '#2563EB' : '#64748B'}
            />
            <View style={[styles.statTabBadge, activeTab === 'PENDING_ACCOUNTANT' ? styles.badgeBlue : styles.badgeSlate]}>
              <Text style={styles.statTabBadgeText}>{counts.PENDING_ACCOUNTANT}</Text>
            </View>
          </View>
          <Text style={[styles.statTabLabel, activeTab === 'PENDING_ACCOUNTANT' && styles.statTabLabelActiveAcc]}>
            Chờ Kế toán chi
          </Text>
        </Pressable>

        {/* Tab 3: Paid */}
        <Pressable
          style={[
            styles.statTabCard,
            activeTab === 'PAID' && styles.statTabCardActivePaid,
          ]}
          onPress={() => setActiveTab('PAID')}
        >
          <View style={styles.statTabTopRow}>
            <MaterialCommunityIcons
              name="check-circle-outline"
              size={18}
              color={activeTab === 'PAID' ? '#059669' : '#64748B'}
            />
            <View style={[styles.statTabBadge, activeTab === 'PAID' ? styles.badgeGreen : styles.badgeSlate]}>
              <Text style={styles.statTabBadgeText}>{counts.PAID}</Text>
            </View>
          </View>
          <Text style={[styles.statTabLabel, activeTab === 'PAID' && styles.statTabLabelActivePaid]}>
            Đã chi tiền
          </Text>
        </Pressable>

        {/* Tab 4: Rejected */}
        <Pressable
          style={[
            styles.statTabCard,
            activeTab === 'REJECTED' && styles.statTabCardActiveRejected,
          ]}
          onPress={() => setActiveTab('REJECTED')}
        >
          <View style={styles.statTabTopRow}>
            <MaterialCommunityIcons
              name="close-circle-outline"
              size={18}
              color={activeTab === 'REJECTED' ? '#DC2626' : '#64748B'}
            />
            <View style={[styles.statTabBadge, activeTab === 'REJECTED' ? styles.badgeRed : styles.badgeSlate]}>
              <Text style={styles.statTabBadgeText}>{counts.REJECTED}</Text>
            </View>
          </View>
          <Text style={[styles.statTabLabel, activeTab === 'REJECTED' && styles.statTabLabelActiveRejected]}>
            Đã từ chối
          </Text>
        </Pressable>

        {/* Tab 5: All */}
        <Pressable
          style={[
            styles.statTabCard,
            activeTab === 'ALL' && styles.statTabCardActiveAll,
          ]}
          onPress={() => setActiveTab('ALL')}
        >
          <View style={styles.statTabTopRow}>
            <MaterialCommunityIcons
              name="format-list-bulleted"
              size={18}
              color={activeTab === 'ALL' ? '#1E293B' : '#64748B'}
            />
            <View style={[styles.statTabBadge, activeTab === 'ALL' ? styles.badgeDark : styles.badgeSlate]}>
              <Text style={styles.statTabBadgeText}>{counts.TOTAL}</Text>
            </View>
          </View>
          <Text style={[styles.statTabLabel, activeTab === 'ALL' && styles.statTabLabelActiveAll]}>
            Tất cả yêu cầu
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
              ? 'ĐÃ ĐẢO CHI'
              : isPendingAcc
              ? 'CHỜ KẾ TOÁN CHI'
              : isPendingAdmin
              ? 'CHỜ ADMIN DUYỆT'
              : 'ĐÃ TỪ CHỐI';

            const userProfile = ticket.user?.profile;
            const deptName = ticket.user?.departmentLinks?.[0]?.department?.name || 'Phòng ban';
            const posName = ticket.user?.departmentLinks?.[0]?.position?.name || 'Nhân viên';
            const transferMemo = `RUT TIEN ML ${ticket.user?.userCode || ''} ${ticket.id.slice(0, 8)}`;

            return (
              <View key={ticket.id} style={[styles.ticketCard, { borderColor: statusBorder }]}>
                {/* Employee Profile Top Header */}
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

                  <View style={[styles.ticketStatusChip, { backgroundColor: statusBg, borderColor: statusBorder }]}>
                    <Text style={[styles.ticketStatusChipText, { color: statusColor }]}>
                      {statusLabel}
                    </Text>
                  </View>
                </View>

                {/* Amount Banner */}
                <View style={styles.amountBanner}>
                  <View>
                    <Text style={styles.amountLabel}>Số tiền rút quy đổi:</Text>
                    <Text style={styles.amountValue}>
                      {ticket.cashAmount.toLocaleString('vi-VN')} <Text style={styles.currencyUnit}>VNĐ</Text>
                    </Text>
                  </View>
                  <View style={styles.pointsBadge}>
                    <MaterialCommunityIcons name="star-shooting-outline" size={14} color="#D97706" />
                    <Text style={styles.pointsBadgeText}>
                      {ticket.pointsWithdrawn.toLocaleString('vi-VN')} điểm
                    </Text>
                  </View>
                </View>

                {/* Banking Information Card with One-Tap Copy & VietQR */}
                <View style={styles.bankInfoContainer}>
                  <View style={styles.bankHeaderRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <MaterialCommunityIcons name="bank" size={18} color="#4338CA" />
                      <Text style={styles.bankHeaderTitle}>Tài khoản nhận tiền</Text>
                    </View>

                    {/* Quick VietQR Modal Trigger */}
                    <Pressable
                      style={styles.vietQrQuickBtn}
                      onPress={() => openVietQRModal(ticket)}
                    >
                      <MaterialCommunityIcons name="qrcode-scan" size={14} color="#0284C7" />
                      <Text style={styles.vietQrQuickBtnText}>Quét VietQR</Text>
                    </Pressable>
                  </View>

                  <View style={styles.bankDetailsGrid}>
                    <View style={styles.bankDetailRow}>
                      <Text style={styles.bankFieldLabel}>Ngân hàng:</Text>
                      <Text style={styles.bankFieldValueBold}>{ticket.bankName}</Text>
                    </View>

                    <View style={styles.bankDetailRow}>
                      <Text style={styles.bankFieldLabel}>Số tài khoản:</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={styles.stkHighlight}>{ticket.bankAccountNumber}</Text>
                        <Pressable
                          hitSlop={8}
                          onPress={() => copyToClipboard(ticket.bankAccountNumber, 'Số tài khoản')}
                          style={styles.copyIconButton}
                        >
                          <MaterialCommunityIcons name="content-copy" size={14} color="#2563EB" />
                        </Pressable>
                      </View>
                    </View>

                    <View style={styles.bankDetailRow}>
                      <Text style={styles.bankFieldLabel}>Chủ tài khoản:</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={styles.bankFieldValueBold}>{ticket.bankAccountName}</Text>
                        <Pressable
                          hitSlop={8}
                          onPress={() => copyToClipboard(ticket.bankAccountName, 'Tên chủ tài khoản')}
                          style={styles.copyIconButton}
                        >
                          <MaterialCommunityIcons name="content-copy" size={14} color="#2563EB" />
                        </Pressable>
                      </View>
                    </View>

                    <View style={styles.bankDetailRow}>
                      <Text style={styles.bankFieldLabel}>Nội dung CK:</Text>
                      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                        <Text style={styles.memoText} numberOfLines={1}>
                          {transferMemo}
                        </Text>
                        <Pressable
                          hitSlop={8}
                          onPress={() => copyToClipboard(transferMemo, 'Nội dung chuyển khoản')}
                          style={styles.copyIconButton}
                        >
                          <MaterialCommunityIcons name="content-copy" size={14} color="#2563EB" />
                        </Pressable>
                      </View>
                    </View>

                    {ticket.note ? (
                      <View style={styles.bankDetailRow}>
                        <Text style={styles.bankFieldLabel}>Ghi chú rút:</Text>
                        <Text style={styles.bankFieldValue}>{ticket.note}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>

                {/* Audit & Workflow History Timeline */}
                <View style={styles.auditContainer}>
                  <Text style={styles.auditCreatedText}>
                    🕒 Thời gian gửi: {new Date(ticket.createdAt).toLocaleString('vi-VN')}
                  </Text>

                  {ticket.adminApprovedAt && (
                    <View style={styles.auditStepRow}>
                      <MaterialCommunityIcons name="check-decagram" size={14} color="#059669" />
                      <Text style={styles.auditStepText}>
                        Admin duyệt: {new Date(ticket.adminApprovedAt).toLocaleString('vi-VN')}
                        {ticket.adminNote ? ` • "${ticket.adminNote}"` : ''}
                      </Text>
                    </View>
                  )}

                  {ticket.accountantConfirmedAt && (
                    <View style={styles.auditStepRow}>
                      <MaterialCommunityIcons name="cash-check" size={14} color="#059669" />
                      <Text style={styles.auditStepText}>
                        Kế toán chi:{' '}
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
                        Đã từ chối lúc {new Date(ticket.rejectedAt).toLocaleString('vi-VN')}
                        {ticket.rejectReason ? `: "${ticket.rejectReason}"` : ''}
                        <Text style={{ fontWeight: '700' }}> (Đã hoàn lại điểm vào ví)</Text>
                      </Text>
                    </View>
                  )}
                </View>

                {/* Action Buttons Row */}
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
    flex: 1,
  },

  /* Unified Stat & Filter Tab Cards */
  unifiedTabsWrapper: {
    flexDirection: 'row',
    gap: 10,
    paddingBottom: 14,
    alignItems: 'flex-start',
  },
  statTabCard: {
    width: 125,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  statTabTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statTabBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statTabBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  statTabLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },

  /* Active Card Variants */
  statTabCardActiveAdmin: {
    backgroundColor: '#FFFBEB',
    borderColor: '#F59E0B',
  },
  statTabLabelActiveAdmin: {
    color: '#B45309',
  },
  statTabCardActiveAcc: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  statTabLabelActiveAcc: {
    color: '#1D4ED8',
  },
  statTabCardActivePaid: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
  },
  statTabLabelActivePaid: {
    color: '#047857',
  },
  statTabCardActiveRejected: {
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
  },
  statTabLabelActiveRejected: {
    color: '#B91C1C',
  },
  statTabCardActiveAll: {
    backgroundColor: '#F8FAFC',
    borderColor: '#475569',
  },
  statTabLabelActiveAll: {
    color: '#0F172A',
  },

  /* Badge Color Variants */
  badgeOrange: { backgroundColor: '#D97706' },
  badgeBlue: { backgroundColor: '#2563EB' },
  badgeGreen: { backgroundColor: '#059669' },
  badgeRed: { backgroundColor: '#DC2626' },
  badgeDark: { backgroundColor: '#334155' },
  badgeSlate: { backgroundColor: '#94A3B8' },

  /* Tickets List */
  ticketList: {
    gap: 14,
    paddingBottom: 24,
  },
  ticketCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  ticketTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  ticketAvatarBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  ticketAvatar: {
    width: '100%',
    height: '100%',
  },
  ticketAvatarFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ticketAvatarText: {
    color: '#475569',
    fontWeight: '700',
    fontSize: 14,
  },
  ticketEmpName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  ticketEmpMeta: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
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
    letterSpacing: 0.3,
  },

  /* Amount Banner */
  amountBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  amountLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  amountValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#059669',
    marginTop: 2,
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
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  pointsBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
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
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 8,
    gap: 4,
    marginBottom: 12,
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
    marginTop: 2,
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
    marginTop: 2,
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
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
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
    paddingVertical: 10,
    borderRadius: 10,
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
    backgroundColor: '#2563EB',
    paddingVertical: 10,
    borderRadius: 10,
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
