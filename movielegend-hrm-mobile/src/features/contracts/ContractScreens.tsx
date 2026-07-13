import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, type ReactNode } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { EmptyState } from '../../components/EmptyState';
import { PageHeader } from '../../components/PageHeader';
import { PrimaryButton, SecondaryButton } from '../../components/Buttons';
import { Screen } from '../../components/Screen';
import { StatusBadge } from '../../components/StatusBadge';
import { useAuth } from '../../providers/AuthProvider';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { normalizeApiError } from '../../utils/api-error';
import {
  useContractTemplates,
  useContracts,
  useMyContracts,
  useContract,
  useCreateContract,
  useSubmitContractApproval,
  useApproveContract,
  useActivateContract,
} from '../../hooks/useContracts';
import {
  CONTRACT_TYPE_LABELS,
  CONTRACT_STATUS_LABELS,
  type ContractStatus,
  type ContractType,
} from '../../types/contract.types';

// ── Helpers ──

function getStatusTone(status: ContractStatus): 'success' | 'info' | 'neutral' | 'warning' {
  switch (status) {
    case 'ACTIVE':
    case 'COMPLETED':
      return 'success';
    case 'PENDING_INTERNAL_APPROVAL':
    case 'WAITING_EMPLOYEE_SIGNATURE':
    case 'WAITING_COMPANY_SIGNATURE':
    case 'EMPLOYEE_SIGNED':
      return 'info';
    case 'EXPIRED':
    case 'TERMINATED':
    case 'CANCELLED':
      return 'warning';
    default:
      return 'neutral';
  }
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
}

function getInitials(name: string): string {
  return name.split(' ').filter(Boolean).slice(-2).map(w => w[0]).join('').toUpperCase();
}

// ── Contract Templates Screen ──

export function ContractTemplatesScreen() {
  const templates = useContractTemplates();
  const templateItems = Array.isArray(templates.data) ? templates.data : [];

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <PageHeader
          title="Mẫu hợp đồng"
          subtitle="Danh sách mẫu hợp đồng công ty"
        />

        <View style={styles.list}>
          {templateItems.length > 0 ? (
            templateItems.map((tpl: any) => (
              <View key={tpl.id} style={styles.templateCard}>
                <View style={styles.templateHeader}>
                  <View style={styles.templateIcon}>
                    <MaterialCommunityIcons name="file-document-outline" size={24} color={colors.primary} />
                  </View>
                  <View style={styles.templateInfo}>
                    <Text style={styles.templateName}>{tpl.name}</Text>
                    <Text style={styles.templateCode}>Mã: {tpl.code}</Text>
                  </View>
                  <StatusBadge
                    label={tpl.isActive ? 'Hoạt động' : 'Đã ẩn'}
                    tone={tpl.isActive ? 'success' : 'neutral'}
                  />
                </View>

                <View style={styles.templateMeta}>
                  <View style={styles.metaItem}>
                    <MaterialCommunityIcons name="tag-outline" size={14} color={colors.muted} />
                    <Text style={styles.metaText}>{CONTRACT_TYPE_LABELS[tpl.contractType as ContractType] ?? tpl.contractType}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <MaterialCommunityIcons name="history" size={14} color={colors.muted} />
                    <Text style={styles.metaText}>v{tpl.version}</Text>
                  </View>
                </View>

                {tpl.description ? (
                  <Text style={styles.templateDesc} numberOfLines={2}>{tpl.description}</Text>
                ) : null}
              </View>
            ))
          ) : !templates.isLoading ? (
            <EmptyState title="Chưa có mẫu hợp đồng" />
          ) : null}
        </View>
      </ScrollView>
    </Screen>
  );
}

// ── Contract List Screen ──

export function ContractListScreen() {
  const router = useRouter();
  const contracts = useContracts();
  const contractItems = Array.isArray(contracts.data) ? contracts.data : [];

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <PageHeader
          title="Hợp đồng nhân viên"
          subtitle="Quản lý hợp đồng lao động"
          right={
            <View style={styles.headerActions}>
              <Pressable
                style={styles.headerBtn}
                onPress={() => router.push('/admin/contracts/templates')}
              >
                <MaterialCommunityIcons name="file-cog-outline" size={18} color={colors.primary} />
                <Text style={styles.headerBtnText}>Mẫu HĐ</Text>
              </Pressable>
              <Pressable
                style={styles.addBtn}
                onPress={() => router.push('/admin/contracts/create')}
              >
                <MaterialCommunityIcons name="plus" size={20} color="#fff" />
                <Text style={styles.addBtnText}>Tạo HĐ</Text>
              </Pressable>
            </View>
          }
        />

        <View style={styles.list}>
          {contractItems.length > 0 ? (
            contractItems.map((contract: any) => {
              const empName = contract.user?.profile?.fullName ?? contract.user?.userCode ?? '-';
              const initials = getInitials(empName);

              return (
                <Pressable
                  key={contract.id}
                  style={styles.contractCard}
                  onPress={() => router.push(`/admin/contracts/${contract.id}`)}
                >
                  <View style={styles.contractHeader}>
                    <View style={styles.contractAvatar}>
                      <Text style={styles.contractAvatarText}>{initials}</Text>
                    </View>
                    <View style={styles.contractMainInfo}>
                      <Text style={styles.contractTitle}>{contract.title}</Text>
                      <Text style={styles.contractEmpName}>{empName}</Text>
                    </View>
                    <StatusBadge
                      label={CONTRACT_STATUS_LABELS[contract.status as ContractStatus] ?? contract.status}
                      tone={getStatusTone(contract.status)}
                    />
                  </View>

                  <View style={styles.contractDetails}>
                    <View style={styles.detailItem}>
                      <MaterialCommunityIcons name="identifier" size={14} color={colors.muted} />
                      <Text style={styles.detailText}>{contract.contractCode}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <MaterialCommunityIcons name="tag-outline" size={14} color={colors.muted} />
                      <Text style={styles.detailText}>
                        {CONTRACT_TYPE_LABELS[contract.contractType as ContractType] ?? contract.contractType}
                      </Text>
                    </View>
                    <View style={styles.detailItem}>
                      <MaterialCommunityIcons name="calendar-range" size={14} color={colors.muted} />
                      <Text style={styles.detailText}>
                        {formatDate(contract.startDate)} → {formatDate(contract.endDate)}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              );
            })
          ) : !contracts.isLoading ? (
            <EmptyState
              title="Chưa có hợp đồng"
              message="Nhấn Tạo HĐ để tạo hợp đồng mới"
            />
          ) : null}
        </View>
      </ScrollView>
    </Screen>
  );
}

// ── Employee Contract List Screen ──

export function EmployeeContractListScreen() {
  const router = useRouter();
  const contracts = useMyContracts();
  const contractItems = Array.isArray(contracts.data) ? contracts.data : [];

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <PageHeader
          title="Hợp đồng của tôi"
          subtitle="Danh sách hợp đồng lao động"
        />

        <View style={styles.list}>
          {contractItems.length > 0 ? (
            contractItems.map((contract: any) => {
              return (
                <Pressable
                  key={contract.id}
                  style={styles.contractCard}
                  onPress={() => router.push(`/employee/contracts/${contract.id}`)}
                >
                  <View style={styles.contractHeader}>
                    <View style={styles.contractAvatar}>
                      <Text style={styles.contractAvatarText}>HĐ</Text>
                    </View>
                    <View style={styles.contractMainInfo}>
                      <Text style={styles.contractTitle}>{contract.title}</Text>
                      <Text style={styles.contractEmpName}>{contract.contractCode}</Text>
                    </View>
                    <StatusBadge
                      label={CONTRACT_STATUS_LABELS[contract.status as ContractStatus] ?? contract.status}
                      tone={getStatusTone(contract.status)}
                    />
                  </View>

                  <View style={styles.contractDetails}>
                    <View style={styles.detailItem}>
                      <MaterialCommunityIcons name="tag-outline" size={14} color={colors.muted} />
                      <Text style={styles.detailText}>
                        {CONTRACT_TYPE_LABELS[contract.contractType as ContractType] ?? contract.contractType}
                      </Text>
                    </View>
                    <View style={styles.detailItem}>
                      <MaterialCommunityIcons name="calendar-range" size={14} color={colors.muted} />
                      <Text style={styles.detailText}>
                        {formatDate(contract.startDate)} → {formatDate(contract.endDate)}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              );
            })
          ) : !contracts.isLoading ? (
            <EmptyState
              title="Chưa có hợp đồng"
              message="Bạn hiện chưa có hợp đồng lao động nào."
            />
          ) : null}
        </View>
      </ScrollView>
    </Screen>
  );
}

// ── Contract Detail Screen ──

export function ContractDetailScreen({ contractId }: { contractId: string }) {
  const contract = useContract(contractId);
  const submitApproval = useSubmitContractApproval();
  const approve = useApproveContract();
  const activate = useActivateContract();

  const data = contract.data;
  if (!data && !contract.isLoading) {
    return <Screen><EmptyState title="Không tìm thấy hợp đồng" /></Screen>;
  }
  if (!data) return null;

  const empName = data.user?.profile?.fullName ?? data.user?.userCode ?? '-';
  const status = data.status as ContractStatus;

  async function handleAction(action: () => Promise<unknown>, label: string) {
    try {
      await action();
      Alert.alert('Thành công', label);
    } catch (error) {
      const normalized = normalizeApiError(error);
      Alert.alert('Lỗi', normalized.message);
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <PageHeader title="Chi tiết hợp đồng" />

        {/* Main info card */}
        <View style={styles.detailCard}>
          <View style={styles.detailCardHeader}>
            <View style={styles.contractAvatar}>
              <Text style={styles.contractAvatarText}>{getInitials(empName)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.detailCardTitle}>{data.title}</Text>
              <Text style={styles.detailCardSub}>{empName}</Text>
            </View>
            <StatusBadge
              label={CONTRACT_STATUS_LABELS[status] ?? status}
              tone={getStatusTone(status)}
            />
          </View>

          <View style={styles.detailGrid}>
            <DetailRow icon="identifier" label="Mã HĐ" value={data.contractCode} />
            <DetailRow icon="tag-outline" label="Loại" value={CONTRACT_TYPE_LABELS[data.contractType as ContractType] ?? data.contractType} />
            <DetailRow icon="calendar-start" label="Bắt đầu" value={formatDate(data.startDate)} />
            <DetailRow icon="calendar-end" label="Kết thúc" value={formatDate(data.endDate)} />
            {data.effectiveAt && <DetailRow icon="check-circle-outline" label="Có hiệu lực" value={formatDate(data.effectiveAt)} />}
            {data.terminatedAt && <DetailRow icon="close-circle-outline" label="Chấm dứt" value={formatDate(data.terminatedAt)} />}
            {data.terminationReason && <DetailRow icon="text-box-outline" label="Lý do" value={data.terminationReason} />}
            <DetailRow icon="account-check-outline" label="NV xác nhận" value={
              data.employeeAcknowledgementStatus === 'AGREED' ? '✅ Đã đồng ý' :
              data.employeeAcknowledgementStatus === 'DISAGREED' ? '❌ Không đồng ý' : '⏳ Chờ xác nhận'
            } />
          </View>
        </View>

        {/* Signatures */}
        {data.signatures && data.signatures.length > 0 && (
          <View style={styles.signaturesCard}>
            <Text style={styles.sectionTitle}>Chữ ký</Text>
            {data.signatures.map((sig: any) => (
              <View key={sig.id} style={styles.signatureRow}>
                <MaterialCommunityIcons
                  name="draw-pen"
                  size={16}
                  color={colors.primary}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.signatureName}>
                    {sig.signer?.profile?.fullName ?? sig.signerRole}
                  </Text>
                  <Text style={styles.signatureDate}>
                    {sig.signerRole === 'EMPLOYEE' ? 'Nhân viên' : 'Công ty'} — {formatDate(sig.signedAt)}
                  </Text>
                </View>
                <MaterialCommunityIcons name="check-circle" size={18} color={colors.success} />
              </View>
            ))}
          </View>
        )}

        {/* Actions */}
        <View style={styles.actionButtons}>
          {status === 'DRAFT' && (
            <PrimaryButton
              onPress={() => handleAction(() => submitApproval.mutateAsync(contractId), 'Đã gửi duyệt')}
              loading={submitApproval.isPending}
            >
              Gửi duyệt
            </PrimaryButton>
          )}
          {status === 'PENDING_INTERNAL_APPROVAL' && (
            <PrimaryButton
              onPress={() => handleAction(() => approve.mutateAsync(contractId), 'Đã duyệt hợp đồng')}
              loading={approve.isPending}
            >
              Phê duyệt
            </PrimaryButton>
          )}
          {(status === 'COMPLETED' || status === 'APPROVED') && (
            <PrimaryButton
              onPress={() => handleAction(() => activate.mutateAsync(contractId), 'Đã kích hoạt hợp đồng')}
              loading={activate.isPending}
            >
              Kích hoạt
            </PrimaryButton>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

function DetailRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <MaterialCommunityIcons name={icon as any} size={16} color={colors.muted} />
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

// ── Create Contract Screen ──

export function CreateContractScreen() {
  const router = useRouter();
  const templates = useContractTemplates();
  const createContract = useCreateContract();
  const [userId, setUserId] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [title, setTitle] = useState('');
  const [contractType, setContractType] = useState<ContractType>('FIXED_TERM');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const templateItems = Array.isArray(templates.data) ? templates.data : [];

  async function submit() {
    if (!userId.trim() || !templateId || !title.trim() || !startDate) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin');
      return;
    }
    try {
      await createContract.mutateAsync({
        userId: userId.trim(),
        contractTemplateId: templateId,
        contractType,
        title: title.trim(),
        startDate,
        endDate: endDate || undefined,
      });
      Alert.alert('Thành công', 'Đã tạo hợp đồng mới');
      router.back();
    } catch (error) {
      const normalized = normalizeApiError(error);
      Alert.alert('Lỗi', normalized.message);
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <PageHeader title="Tạo hợp đồng mới" />

        <View style={styles.formCard}>
          <Field label="ID Nhân viên">
            <TextInput
              style={styles.input}
              placeholder="Nhập User ID"
              placeholderTextColor={colors.muted}
              value={userId}
              onChangeText={setUserId}
            />
          </Field>

          <Field label="Mẫu hợp đồng">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.templatePicker}>
              {templateItems.map((tpl: any) => (
                <Pressable
                  key={tpl.id}
                  style={[styles.templateOption, templateId === tpl.id && styles.templateOptionSelected]}
                  onPress={() => {
                    setTemplateId(tpl.id);
                    setContractType(tpl.contractType);
                    if (!title) setTitle(tpl.name);
                  }}
                >
                  <Text style={[styles.templateOptionText, templateId === tpl.id && styles.templateOptionTextSelected]}>
                    {tpl.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </Field>

          <Field label="Tiêu đề hợp đồng">
            <TextInput
              style={styles.input}
              placeholder="VD: Hợp đồng thử việc - Nguyễn Văn A"
              placeholderTextColor={colors.muted}
              value={title}
              onChangeText={setTitle}
            />
          </Field>

          <Field label="Ngày bắt đầu (YYYY-MM-DD)">
            <TextInput
              style={styles.input}
              placeholder="2025-01-01"
              placeholderTextColor={colors.muted}
              value={startDate}
              onChangeText={setStartDate}
            />
          </Field>

          <Field label="Ngày kết thúc (YYYY-MM-DD) — không bắt buộc">
            <TextInput
              style={styles.input}
              placeholder="2026-01-01"
              placeholderTextColor={colors.muted}
              value={endDate}
              onChangeText={setEndDate}
            />
          </Field>

          <PrimaryButton onPress={submit} loading={createContract.isPending}>
            Tạo hợp đồng
          </PrimaryButton>
        </View>
      </ScrollView>
    </Screen>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  content: {
    gap: spacing.md,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  list: {
    gap: spacing.md,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 4,
  },
  addBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 4,
  },
  headerBtnText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 13,
  },

  // Template card
  templateCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  templateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  templateIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  templateCode: {
    fontSize: 13,
    color: colors.muted,
    marginTop: 2,
  },
  templateMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 6,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: colors.muted,
  },
  templateDesc: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },

  // Contract card
  contractCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  contractHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  contractAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contractAvatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2563EB',
  },
  contractMainInfo: {
    flex: 1,
  },
  contractTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  contractEmpName: {
    fontSize: 13,
    color: colors.muted,
    marginTop: 1,
  },
  contractDetails: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    gap: 6,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },

  // Detail screen
  detailCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  detailCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  detailCardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
  },
  detailCardSub: {
    fontSize: 14,
    color: colors.muted,
    marginTop: 2,
  },
  detailGrid: {
    gap: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.muted,
    width: 90,
  },
  detailValue: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
    flex: 1,
  },

  // Signatures
  signaturesCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: spacing.lg,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  signatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  signatureName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  signatureDate: {
    fontSize: 12,
    color: colors.muted,
  },

  actionButtons: {
    gap: spacing.sm,
  },

  // Form
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: spacing.lg,
    gap: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  templatePicker: {
    flexDirection: 'row',
  },
  templateOption: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  templateOptionSelected: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  templateOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.muted,
  },
  templateOptionTextSelected: {
    color: colors.primary,
  },
});

// ── Leader Contract List Screen ──

export function LeaderContractListScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  const departmentId = user?.department?.id;
  const { data: contracts } = useContracts(departmentId);
  const [activeTab, setActiveTab] = useState<'MY_CONTRACTS' | 'TEAM_CONTRACTS'>('MY_CONTRACTS');
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'EXPIRING'>('ALL');

  const filteredContracts = contracts?.filter(c => {
    // 1. Filter by Tab
    if (activeTab === 'MY_CONTRACTS' && c.userId !== user?.id) return false;
    if (activeTab === 'TEAM_CONTRACTS' && c.userId === user?.id) return false;

    // 2. Filter by Status
    if (filter === 'ACTIVE' && c.status !== 'ACTIVE') return false;
    if (filter === 'EXPIRING') {
      if (!c.endDate || c.status !== 'ACTIVE') return false;
      const d = new Date(c.endDate);
      const diff = Math.ceil((d.getTime() - new Date().getTime()) / (1000 * 3600 * 24));
      if (diff < 0 || diff > 30) return false;
    }
    return true;
  }) || [];

  return (
    <Screen>
      <PageHeader title="Quản lý hợp đồng" />
      
      <View style={{ flexDirection: 'row', backgroundColor: '#F1F5F9', marginHorizontal: spacing.md, marginTop: spacing.sm, borderRadius: 8, padding: 4 }}>
        <Pressable 
          style={[{ flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6 }, activeTab === 'MY_CONTRACTS' && { backgroundColor: colors.surface, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 }]}
          onPress={() => setActiveTab('MY_CONTRACTS')}
        >
          <Text style={[{ fontSize: 14, fontWeight: '500', color: colors.muted }, activeTab === 'MY_CONTRACTS' && { color: colors.text, fontWeight: '600' }]}>
            Của tôi
          </Text>
        </Pressable>
        <Pressable 
          style={[{ flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6 }, activeTab === 'TEAM_CONTRACTS' && { backgroundColor: colors.surface, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 }]}
          onPress={() => setActiveTab('TEAM_CONTRACTS')}
        >
          <Text style={[{ fontSize: 14, fontWeight: '500', color: colors.muted }, activeTab === 'TEAM_CONTRACTS' && { color: colors.text, fontWeight: '600' }]}>
            Nhân sự
          </Text>
        </Pressable>
      </View>

      <View style={{ marginTop: spacing.md, marginBottom: spacing.sm }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.md, gap: spacing.sm }}>
          <Pressable 
            style={[{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' }, filter === 'ALL' && { backgroundColor: '#EFF6FF', borderColor: colors.primary }]}
            onPress={() => setFilter('ALL')}
          >
            <Text style={[{ fontSize: 13, color: colors.muted, fontWeight: '500' }, filter === 'ALL' && { color: colors.primary, fontWeight: '600' }]}>Tất cả</Text>
          </Pressable>
          <Pressable 
            style={[{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' }, filter === 'ACTIVE' && { backgroundColor: '#EFF6FF', borderColor: colors.primary }]}
            onPress={() => setFilter('ACTIVE')}
          >
            <Text style={[{ fontSize: 13, color: colors.muted, fontWeight: '500' }, filter === 'ACTIVE' && { color: colors.primary, fontWeight: '600' }]}>Đang hiệu lực</Text>
          </Pressable>
          <Pressable 
            style={[{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' }, filter === 'EXPIRING' && { backgroundColor: '#EFF6FF', borderColor: colors.primary }]}
            onPress={() => setFilter('EXPIRING')}
          >
            <Text style={[{ fontSize: 13, color: colors.muted, fontWeight: '500' }, filter === 'EXPIRING' && { color: colors.primary, fontWeight: '600' }]}>Sắp hết hạn</Text>
          </Pressable>
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {filteredContracts.length === 0 ? (
          <EmptyState title="Không có hợp đồng nào" />
        ) : (
          filteredContracts.map((contract: any) => {
            const empName = contract.user?.profile?.fullName ?? contract.user?.userCode ?? '-';
            const initials = getInitials(empName);
            
            let statusLabel = CONTRACT_STATUS_LABELS[contract.status as ContractStatus] ?? contract.status;
            let statusTone = getStatusTone(contract.status as ContractStatus);
            
            if (contract.status === 'ACTIVE' && contract.endDate) {
              const d = new Date(contract.endDate);
              const diff = Math.ceil((d.getTime() - new Date().getTime()) / (1000 * 3600 * 24));
              if (diff >= 0 && diff <= 30) {
                statusLabel = 'Sắp hết hạn';
                statusTone = 'warning';
              }
            }

            return (
              <Pressable
                key={contract.id}
                style={styles.contractCard}
                onPress={() => router.push(`/leader/contracts/${contract.id}`)}
              >
                <View style={styles.contractHeader}>
                  {activeTab === 'TEAM_CONTRACTS' ? (
                    <View style={styles.contractAvatar}>
                      <Text style={styles.contractAvatarText}>{initials}</Text>
                    </View>
                  ) : (
                    <View style={styles.templateIcon}>
                      <MaterialCommunityIcons name="file-document-outline" size={24} color={colors.primary} />
                    </View>
                  )}
                  <View style={styles.contractMainInfo}>
                    <Text style={styles.contractTitle}>{contract.title}</Text>
                    {activeTab === 'TEAM_CONTRACTS' && (
                      <Text style={styles.contractEmpName}>{empName}</Text>
                    )}
                  </View>
                  <StatusBadge label={statusLabel} tone={statusTone} />
                </View>

                <View style={styles.contractDetails}>
                  <View style={styles.detailItem}>
                    <MaterialCommunityIcons name="identifier" size={14} color={colors.muted} />
                    <Text style={styles.detailText}>{contract.contractCode}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <MaterialCommunityIcons name="tag-outline" size={14} color={colors.muted} />
                    <Text style={styles.detailText}>
                      {CONTRACT_TYPE_LABELS[contract.contractType as ContractType] ?? contract.contractType}
                    </Text>
                  </View>
                  <View style={styles.detailItem}>
                    <MaterialCommunityIcons name="calendar-range" size={14} color={colors.muted} />
                    <Text style={styles.detailText}>
                      {formatDate(contract.startDate)} → {formatDate(contract.endDate)}
                    </Text>
                  </View>
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </Screen>
  );
}

