import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect, type ReactNode } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Linking,
  Image,
  Modal,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ContractScannerModal } from './ContractScannerModal';
import { ContractSignatureModal } from './ContractSignatureModal';
import { CreateTemplateModal } from './CreateTemplateModal';
import { PdfViewerModal } from '../../components/PdfViewerModal';
import { EmptyState } from '../../components/EmptyState';
import { PageHeader } from '../../components/PageHeader';
import { PrimaryButton, SecondaryButton } from '../../components/Buttons';
import { Screen } from '../../components/Screen';
import { StatusBadge } from '../../components/StatusBadge';
import { useAuth } from '../../providers/AuthProvider';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { resolveFileUrl } from '../../utils/url';
import { normalizeApiError } from '../../utils/api-error';
import { MultiSelectModal } from '../../components/MultiSelectModal';
import { CustomDatePickerModal } from '../../components/CustomDatePickerModal';
import { useEmployees } from '../../hooks/useEmployees';
import {
  useContractTemplates,
  useContracts,
  useMyContracts,
  useContract,
  useCreateContract,
  useSubmitContractApproval,
  useApproveContract,
  useActivateContract,
  useSignContractEmployee,
  useRejectContractSignature,
  useDeleteContract,
} from '../../hooks/useContracts';
import {
  CONTRACT_TYPE_LABELS,
  CONTRACT_STATUS_LABELS,
  type ContractStatus,
  type ContractType,
} from '../../types/contract.types';
import { apiUrl } from '../../constants/env';

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
  const router = useRouter();
  const templates = useContractTemplates();
  const templateItems = Array.isArray(templates.data) ? templates.data : [];
  const [isCreateModalVisible, setCreateModalVisible] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [pdfViewerVisible, setPdfViewerVisible] = useState(false);
  const [pdfViewerUrl, setPdfViewerUrl] = useState<string | null>(null);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <PageHeader
          title="Mẫu hợp đồng"
          subtitle="Danh sách mẫu hợp đồng công ty"
          right={
            <Pressable onPress={() => setCreateModalVisible(true)} style={styles.headerBtn}>
              <MaterialCommunityIcons name="plus" size={24} color={colors.primary} />
            </Pressable>
          }
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

                <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
                  <Pressable
                    style={({ pressed }) => [{ flex: 1, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, paddingVertical: 10, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 }, pressed && { backgroundColor: '#f9fafb' }]}
                    onPress={() => {
                      const url = resolveFileUrl(tpl.templateFileUrl);
                      if (url) {
                        setPdfViewerVisible(true);
                        setPdfViewerUrl(url);
                      } else {
                        Alert.alert('Lỗi', 'Không tìm thấy tệp đính kèm');
                      }
                    }}
                  >
                    <MaterialCommunityIcons name="file-eye-outline" size={18} color="#374151" />
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151' }}>Xem PDF</Text>
                  </Pressable>

                  <Pressable
                    style={({ pressed }) => [{ flex: 1, backgroundColor: '#111827', borderRadius: 8, paddingVertical: 10, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }, pressed && { backgroundColor: '#1f2937' }]}
                    onPress={() => {
                      router.push({
                        pathname: '/admin/contracts/create',
                        params: { templateId: tpl.id },
                      });
                    }}
                  >
                    <MaterialCommunityIcons name="pencil-box-outline" size={18} color="#ffffff" />
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#ffffff' }}>Tạo HĐ</Text>
                  </Pressable>
                  
                  <Pressable
                    style={({ pressed }) => [{ flex: 1, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, paddingVertical: 10, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 }, pressed && { backgroundColor: '#f9fafb' }]}
                    onPress={() => {
                      const url = resolveFileUrl(tpl.templateFileUrl) || '';
                      router.push({
                        pathname: '/admin/contracts/signature-placement',
                        params: { 
                          templateId: tpl.id,
                          pdfUrl: url,
                          initialConfig: JSON.stringify(tpl.versions?.[0]?.mappingConfig || [])
                        }
                      });
                    }}
                  >
                    <MaterialCommunityIcons name="draw-pen" size={18} color="#374151" />
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151' }}>Tọa độ</Text>
                  </Pressable>
                </View>
              </View>
            ))
          ) : !templates.isLoading ? (
            <EmptyState title="Chưa có mẫu hợp đồng" />
          ) : null}
        </View>
      </ScrollView>

      <CreateTemplateModal 
        visible={isCreateModalVisible}
        onClose={() => setCreateModalVisible(false)}
      />

      <PdfViewerModal
        visible={pdfViewerVisible}
        url={pdfViewerUrl}
        onClose={() => {
          setPdfViewerVisible(false);
          setPdfViewerUrl(null);
        }}
        title="Xem mẫu hợp đồng"
      />
    </Screen>
  );
}

// ── Contract List Screen ──

export function ContractListScreen() {
  const router = useRouter();
  const contracts = useContracts();
  const deleteContract = useDeleteContract();
  const contractItems = Array.isArray(contracts.data) ? contracts.data : [];

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <PageHeader
          title="Hợp đồng"
          subtitle="Quản lý hợp đồng lao động"
          right={
            <View style={styles.headerActions}>
              <Pressable
                style={styles.headerBtn}
                onPress={() => router.push('/admin/contracts/templates')}
              >
                <MaterialCommunityIcons name="file-cog-outline" size={18} color="#111827" />
                <Text style={styles.headerBtnText}>Mẫu HĐ</Text>
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
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <StatusBadge
                        label={CONTRACT_STATUS_LABELS[contract.status as ContractStatus] ?? contract.status}
                        tone={getStatusTone(contract.status)}
                      />
                      {(contract.status === 'WAITING_EMPLOYEE_SIGNATURE' || contract.status === 'DRAFT') && (
                        <Pressable 
                          onPress={(e) => {
                            e.stopPropagation();
                            Alert.alert('Xác nhận xóa', 'Bạn có chắc chắn muốn xóa hợp đồng này không?', [
                              { text: 'Hủy', style: 'cancel' },
                              { 
                                text: 'Xóa', 
                                style: 'destructive',
                                onPress: () => {
                                  deleteContract.mutate(contract.id, {
                                    onSuccess: () => {
                                      Alert.alert('Thành công', 'Đã xóa hợp đồng');
                                      contracts.refetch();
                                    }
                                  });
                                }
                              }
                            ]);
                          }}
                          style={{ padding: 4 }}
                        >
                          <MaterialCommunityIcons name="delete-outline" size={20} color="#ef4444" />
                        </Pressable>
                      )}
                    </View>
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
  const router = useRouter();
  const { user } = useAuth();
  
  const contract = useContract(contractId);
  const submitApproval = useSubmitContractApproval();
  const approve = useApproveContract();
  const activate = useActivateContract();
  const signContract = useSignContractEmployee(contractId);
  const rejectSignature = useRejectContractSignature(contractId);
  const deleteContract = useDeleteContract();
  
  const [pdfViewerVisible, setPdfViewerVisible] = useState(false);
  const [pdfViewerUrl, setPdfViewerUrl] = useState<string | null>(null);

  const [isSignatureVisible, setSignatureVisible] = useState(false);
  const [viewingSignatureUrl, setViewingSignatureUrl] = useState<string | null>(null);

  const data = contract.data;
  if (!data && !contract.isLoading) {
    return <Screen><EmptyState title="Không tìm thấy hợp đồng" /></Screen>;
  }
  if (!data) return null;

  const empName = data.user?.profile?.fullName ?? data.user?.userCode ?? '-';
  const status = data.status as ContractStatus;
  const contractFileUrl =
    data.signedFileUrl ||
    data.draftFileUrl ||
    data.contractTemplateVersion?.templateFileUrl ||
    (data as any).contractTemplate?.templateFileUrl;

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
              <Pressable
                key={sig.id}
                style={[styles.signatureRow, sig.signatureImageUrl && { opacity: 0.8 }]}
                onPress={() => {
                  if (sig.signatureImageUrl) {
                    setViewingSignatureUrl(sig.signatureImageUrl);
                  }
                }}
              >
                <MaterialCommunityIcons
                  name="draw-pen"
                  size={16}
                  color={colors.primary}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.signatureName}>
                    {sig.signer?.profile?.fullName ?? (sig.signerRole === 'EMPLOYEE' ? empName : sig.signerRole)}
                  </Text>
                  <Text style={styles.signatureDate}>
                    {sig.signerRole === 'EMPLOYEE' ? 'Nhân viên' : 'Công ty'} — {formatDate(sig.signedAt)}
                  </Text>
                </View>
                {sig.signatureImageUrl && (
                  <Text style={{ fontSize: 12, color: colors.primary, marginRight: 8, fontStyle: 'italic' }}>
                    Xem
                  </Text>
                )}
                <MaterialCommunityIcons name="check-circle" size={18} color={colors.success} />
              </Pressable>
            ))}
          </View>
        )}

          {/* Actions */}
        <View style={styles.actionButtons}>
          {contractFileUrl ? (
            <SecondaryButton
              onPress={() => {
                const url = resolveFileUrl(contractFileUrl);
                if (url) {
                  setPdfViewerVisible(true);
                  setPdfViewerUrl(url);
                } else {
                  Alert.alert('Lỗi', 'Không tìm thấy file hợp đồng');
                }
              }}
              style={{ marginBottom: 8 }}
            >
              📄 Xem file hợp đồng (PDF)
            </SecondaryButton>
          ) : null}
          {(status === 'COMPLETED' || status === 'APPROVED') && (
            <PrimaryButton
              onPress={() => handleAction(() => activate.mutateAsync(contractId), 'Đã kích hoạt hợp đồng')}
              loading={activate.isPending}
            >
              Kích hoạt
            </PrimaryButton>
          )}
          {status === 'WAITING_EMPLOYEE_SIGNATURE' && data?.userId === user?.id && (
            <SecondaryButton
              onPress={() => setSignatureVisible(true)}
              style={{ marginTop: 8 }}
            >
              ✍️ Ký điện tử
            </SecondaryButton>
          )}
          {status === 'WAITING_EMPLOYEE_SIGNATURE' && (user?.roles?.includes('ADMIN') || user?.roles?.includes('HR')) && (
            <Pressable
              style={{
                backgroundColor: '#fee2e2',
                paddingVertical: 12,
                borderRadius: 8,
                alignItems: 'center',
                marginTop: 8,
              }}
              onPress={() => {
                Alert.alert(
                  'Xác nhận xóa',
                  'Bạn có chắc chắn muốn xóa hợp đồng này không? Hành động này không thể hoàn tác.',
                  [
                    { text: 'Hủy', style: 'cancel' },
                    { 
                      text: 'Xóa', 
                      style: 'destructive',
                      onPress: () => {
                        handleAction(async () => {
                          await deleteContract.mutateAsync(contractId);
                          router.back();
                        }, 'Đã xóa hợp đồng thành công');
                      }
                    }
                  ]
                );
              }}
            >
              <Text style={{ color: '#ef4444', fontWeight: '600' }}>🗑️ Xóa hợp đồng</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>

      <PdfViewerModal
        visible={pdfViewerVisible}
        url={pdfViewerUrl}
        onClose={() => {
          setPdfViewerVisible(false);
          setPdfViewerUrl(null);
        }}
        title="Xem hợp đồng"
      />

      <ContractSignatureModal
        visible={isSignatureVisible}
        onClose={() => setSignatureVisible(false)}
        pdfUrl={contractFileUrl}
        onSave={(signature) => {
          setSignatureVisible(false);
          handleAction(() => signContract.mutateAsync({ signatureType: 'DRAWN', signatureImageUrl: signature }), 'Đã ký hợp đồng');
        }}
      />

      <Modal visible={!!viewingSignatureUrl} transparent animationType="fade" onRequestClose={() => setViewingSignatureUrl(null)}>
        <Pressable 
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }} 
          onPress={() => setViewingSignatureUrl(null)}
        >
          <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 24, width: '100%', maxWidth: 400, alignItems: 'center' }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: '#111827' }}>Chữ ký</Text>
            <View style={{ backgroundColor: '#f9fafb', padding: 16, borderRadius: 8, width: '100%', alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: '#e5e7eb' }}>
              {viewingSignatureUrl && (
                <Image
                  source={{ uri: resolveFileUrl(viewingSignatureUrl) || '' }}
                  style={{ width: '100%', height: 150 }}
                  resizeMode="contain"
                />
              )}
            </View>
            <PrimaryButton onPress={() => setViewingSignatureUrl(null)} style={{ width: '100%' }}>
              Đóng
            </PrimaryButton>
          </View>
        </Pressable>
      </Modal>
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
  const params = useLocalSearchParams();
  const templateId = typeof params.templateId === 'string' ? params.templateId : undefined;
  const { data: templates } = useContractTemplates();
  const employeesQuery = useEmployees({});
  const employeesData = Array.isArray(employeesQuery.data) 
    ? employeesQuery.data 
    : (employeesQuery.data?.items || employeesQuery.data?.data || []);
  const employeeOptions = employeesData.map((e: any) => ({
    id: e.id,
    label: e.profile?.fullName ?? e.userCode ?? e.email,
    subtitle: e.email
  }));

  const [userIds, setUserIds] = useState<string[]>([]);
  const [contractType, setContractType] = useState<ContractType>('FIXED_TERM');
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString());
  const [endDate, setEndDate] = useState<string | null>(null);

  useEffect(() => {
    if (templateId && templates) {
      const tpl = templates.find((t: any) => t.id === templateId);
      if (tpl) {
        setTitle(tpl.name);
        setContractType(tpl.contractType as ContractType);
      }
    }
  }, [templateId, templates]);

  const [isEmployeeSelectVisible, setEmployeeSelectVisible] = useState(false);
  const [datePickerState, setDatePickerState] = useState<'start' | 'end' | null>(null);

  const createContractMutation = useCreateContract();
  
  async function submit() {
    if (userIds.length === 0 || !templateId || !title.trim() || !startDate) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }
    if (contractType !== 'INDEFINITE_TERM' && !endDate) {
      Alert.alert('Lỗi', 'Vui lòng chọn ngày kết thúc cho loại hợp đồng này');
      return;
    }
    if (contractType !== 'INDEFINITE_TERM' && endDate && new Date(endDate) < new Date(startDate)) {
      Alert.alert('Lỗi', 'Ngày kết thúc phải sau ngày bắt đầu');
      return;
    }

    try {
      const versionId = templates?.find((t: any) => t.id === templateId)?.versions?.[0]?.id;
      if (!versionId) throw new Error('Mẫu hợp đồng này chưa có phiên bản hợp lệ');

      await Promise.all(userIds.map(async (userId) => {
        return createContractMutation.mutateAsync({
          userId,
          contractTemplateId: templateId,
          contractTemplateVersionId: versionId,
          contractType,
          title: title.trim(),
          startDate,
          endDate: contractType === 'INDEFINITE_TERM' ? undefined : endDate,
        });
      }));

      if (window && typeof window.alert === 'function') {
        window.alert('Đã tạo hợp đồng thành công');
      } else {
        Alert.alert('Thành công', 'Đã tạo hợp đồng');
      }
      router.replace('/admin/contracts');
    } catch (error: any) {
      Alert.alert('Lỗi', normalizeApiError(error).message);
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <PageHeader title="Tạo Hợp đồng" subtitle="Tạo hợp đồng mới từ mẫu" />

        <View style={styles.formCard}>
          <Field icon="account-multiple-outline" label="Nhân viên">
            <Pressable
              style={styles.input}
              onPress={() => setEmployeeSelectVisible(true)}
            >
              <Text style={{ color: userIds.length > 0 ? colors.text : colors.muted, fontSize: 15 }}>
                {userIds.length > 0 ? `${userIds.length} nhân viên đã chọn` : 'Chọn nhân viên'}
              </Text>
            </Pressable>
          </Field>

          <Field icon="format-title" label="Tiêu đề hợp đồng">
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
            />
          </Field>

          <Field icon="calendar-range" label="Ngày bắt đầu">
            <Pressable style={styles.input} onPress={() => setDatePickerState('start')}>
              <Text>{formatDate(startDate)}</Text>
            </Pressable>
          </Field>

          {contractType !== 'INDEFINITE_TERM' && (
            <Field icon="calendar-end" label="Ngày kết thúc">
              <Pressable style={styles.input} onPress={() => setDatePickerState('end')}>
                <Text style={{ color: endDate ? colors.text : colors.muted }}>
                  {endDate ? formatDate(endDate) : 'Chọn ngày'}
                </Text>
              </Pressable>
            </Field>
          )}

          <View style={{ marginTop: 12 }}>
            <PrimaryButton onPress={submit} loading={createContractMutation.isPending}>
              Tạo hợp đồng
            </PrimaryButton>
          </View>
        </View>
      </ScrollView>

      <MultiSelectModal
        visible={isEmployeeSelectVisible}
        title="Chọn nhân viên"
        options={employeeOptions}
        selectedValues={userIds}
        isLoading={employeesQuery.isLoading}
        onClose={() => setEmployeeSelectVisible(false)}
        onSelect={(selectedIds) => {
          setUserIds(selectedIds);
          setEmployeeSelectVisible(false);
        }}
      />
      <CustomDatePickerModal
        visible={datePickerState !== null}
        onClose={() => setDatePickerState(null)}
        initialDate={
          datePickerState === 'start' && startDate
            ? new Date(startDate)
            : datePickerState === 'end' && endDate
            ? new Date(endDate)
            : new Date()
        }
        onSelect={(date) => {
          const iso = date.toISOString();
          if (datePickerState === 'start') {
            setStartDate(iso);
          } else {
            setEndDate(iso);
          }
          setDatePickerState(null);
        }}
      />
    </Screen>
  );
}

function Field({ icon, label, children }: { icon: string; label: string; children: ReactNode }) {
  return (
    <View style={styles.fieldGroup}>
      <View style={styles.fieldLabelContainer}>
        <MaterialCommunityIcons name={icon as any} size={18} color={colors.primary} />
        <Text style={styles.fieldLabel}>{label}</Text>
      </View>
      {children}
    </View>
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  fieldGroup: {
    gap: 8,
    marginBottom: 20,
  },
  fieldLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
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
    backgroundColor: '#111827',
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
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  scanBtnText: {
    color: '#059669',
    fontWeight: '700',
    fontSize: 14,
  },
  templateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  templateChipSelected: {
    backgroundColor: '#EEF2FF',
    borderColor: colors.primary,
  },
  templateChipText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  templateChipTextSelected: {
    color: colors.primary,
    fontWeight: '700',
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
  templateActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  templateActionBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: '#F0F9FF',
  },
  templateActionTextSecondary: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  templateActionBtnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  templateActionTextPrimary: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
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

