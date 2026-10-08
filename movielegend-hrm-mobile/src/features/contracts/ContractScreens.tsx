import { useRouter, useLocalSearchParams } from "expo-router";
import { useState, useEffect, useMemo, type ReactNode } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Linking,
  Image,
  Modal,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { ContractScannerModal } from "./ContractScannerModal";
import { ContractSignatureModal } from "./ContractSignatureModal";
import { CreateTemplateModal } from "./CreateTemplateModal";
import { PdfViewerModal } from "../../components/PdfViewerModal";
import { EmptyState } from "../../components/EmptyState";
import { PageHeader } from "../../components/PageHeader";
import { PrimaryButton, SecondaryButton } from "../../components/Buttons";
import { Screen } from "../../components/Screen";
import { StatusBadge } from "../../components/StatusBadge";
import { useAuth } from "../../providers/AuthProvider";
import { colors } from "../../theme/colors";
import { spacing } from "../../theme/spacing";
import { resolveFileUrl } from "../../utils/url";
import { normalizeApiError } from "../../utils/api-error";
import { roleBase } from "../../utils/notification-routing";
import { MultiSelectModal } from "../../components/MultiSelectModal";
import { SelectModal, type SelectOption } from "../../components/SelectModal";
import { CustomDatePickerModal } from "../../components/CustomDatePickerModal";
import { useAppAlert } from "../../contexts/AlertContext";
import { useEmployees } from "../../hooks/useEmployees";
import { useDepartments } from "../../hooks/useDepartments";
import { useRegions } from "../../api/regions.api";
import { useBranches } from "../../api/branches.api";
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
  useSignContractCompany,
  useRejectContractSignature,
  useDeleteContract,
  useDeleteContractTemplate,
} from "../../hooks/useContracts";
import {
  CONTRACT_TYPE_LABELS,
  CONTRACT_STATUS_LABELS,
  type ContractStatus,
  type ContractType,
} from "../../types/contract.types";
import { apiUrl } from "../../constants/env";

// ── Helpers ──

function getStatusTone(
  status: ContractStatus,
): "success" | "info" | "neutral" | "warning" {
  switch (status) {
    case "ACTIVE":
    case "COMPLETED":
      return "success";
    case "PENDING_INTERNAL_APPROVAL":
    case "WAITING_EMPLOYEE_SIGNATURE":
    case "WAITING_COMPANY_SIGNATURE":
    case "EMPLOYEE_SIGNED":
      return "info";
    case "EXPIRED":
    case "TERMINATED":
    case "CANCELLED":
      return "warning";
    default:
      return "neutral";
  }
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export const STATUS_FILTER_OPTIONS: SelectOption[] = [
  { id: "ALL", label: "Tất cả trạng thái" },
  { id: "WAITING_COMPANY_SIGNATURE", label: "Chờ công ty ký" },
  { id: "WAITING_EMPLOYEE_SIGNATURE", label: "Chờ nhân viên ký" },
  { id: "ACTIVE", label: "Có hiệu lực" },
  { id: "COMPLETED", label: "Hoàn thành" },
  { id: "EMPLOYEE_SIGNED", label: "Nhân viên đã ký" },
  { id: "PENDING_INTERNAL_APPROVAL", label: "Chờ duyệt nội bộ" },
  { id: "DRAFT", label: "Bản nháp" },
  { id: "EXPIRED", label: "Hết hiệu lực" },
  { id: "TERMINATED", label: "Đã chấm dứt" },
  { id: "CANCELLED", label: "Đã hủy" },
];

function ContractStatusBadge({ status }: { status: ContractStatus | string }) {
  let bg = "#F1F5F9";
  let text = "#64748B";
  const label = CONTRACT_STATUS_LABELS[status as ContractStatus] || status;

  switch (status) {
    case "WAITING_COMPANY_SIGNATURE":
    case "WAITING_EMPLOYEE_SIGNATURE":
      bg = "#FEF3C7";
      text = "#D97706";
      break;
    case "ACTIVE":
    case "COMPLETED":
      bg = "#DCFCE7";
      text = "#166534";
      break;
    case "EMPLOYEE_SIGNED":
    case "PENDING_INTERNAL_APPROVAL":
      bg = "#E0F2FE";
      text = "#0284C7";
      break;
    case "EXPIRED":
    case "TERMINATED":
    case "CANCELLED":
      bg = "#FEE2E2";
      text = "#DC2626";
      break;
    case "DRAFT":
    default:
      bg = "#F1F5F9";
      text = "#64748B";
      break;
  }

  return (
    <View style={{ backgroundColor: bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
      <Text style={{ color: text, fontSize: 12, fontWeight: "700" }}>{label}</Text>
    </View>
  );
}

// ── Contract Templates Screen ──

export function ContractTemplatesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const templates = useContractTemplates();
  const deleteTemplate = useDeleteContractTemplate();
  const { showAlert, showConfirm } = useAppAlert();
  const templateItems = Array.isArray(templates.data) ? templates.data : [];
  const [search, setSearch] = useState("");
  const [isCreateModalVisible, setCreateModalVisible] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [pdfViewerVisible, setPdfViewerVisible] = useState(false);
  const [pdfViewerUrl, setPdfViewerUrl] = useState<string | null>(null);

  const filteredTemplates = useMemo(() => {
    if (!search.trim()) return templateItems;
    const query = search.trim().toLowerCase();
    return templateItems.filter((t: any) =>
      (t.name || "").toLowerCase().includes(query) ||
      (t.code || "").toLowerCase().includes(query)
    );
  }, [templateItems, search]);

  const handleLongPressTemplate = (tpl: any) => {
    showConfirm({
      title: "Xác nhận xoá",
      message: `Bạn có chắc chắn muốn xoá mẫu hợp đồng "${tpl.name}" không? Dữ liệu trên cloud cũng sẽ bị xoá.`,
      confirmLabel: "Xoá",
      confirmTone: "danger",
      onConfirm: () => {
        deleteTemplate.mutate(tpl.id, {
          onSuccess: () => showAlert("Thành công", "Đã xoá mẫu hợp đồng"),
          onError: (err: any) => showAlert("Lỗi", err?.message || "Không thể xoá mẫu hợp đồng")
        });
      }
    });
  };

  return (
    <SafeAreaView style={cStyles.safeArea} edges={["top", "left", "right"]}>
      {/* Header: Back Button + Title + Add Button on same line */}
      <View style={cStyles.header}>
        <View style={cStyles.headerRow}>
          <View style={cStyles.headerTitleGroup}>
            <Pressable
              onPress={() => (router.canGoBack() ? router.back() : router.replace(`${roleBase(user)}/(tabs)` as any))}
              style={cStyles.backBtn}
              hitSlop={10}
            >
              <Ionicons name="chevron-back" size={24} color="#0F172A" />
            </Pressable>
            <View>
              <Text style={cStyles.screenTitle}>Mẫu hợp đồng</Text>
              <Text style={cStyles.screenSubtitle}>Danh sách mẫu hợp đồng công ty</Text>
            </View>
          </View>

          <Pressable
            style={[cStyles.templateBtn, { backgroundColor: '#1E3E2F', borderColor: '#1E3E2F' }]}
            onPress={() => setCreateModalVisible(true)}
          >
            <Ionicons name="add" size={18} color="#FFFFFF" />
            <Text style={[cStyles.templateBtnText, { color: '#FFFFFF' }]}>Thêm mẫu</Text>
          </Pressable>
        </View>
      </View>

      {/* Search Bar */}
      <View style={{ paddingHorizontal: 16, marginBottom: 12, marginTop: 4 }}>
        <View style={cStyles.searchBar}>
          <Ionicons name="search" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Tìm theo tên hoặc mã mẫu hợp đồng"
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
            style={cStyles.searchInput}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color="#94A3B8" />
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, gap: 12 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={templates.isRefetching}
            onRefresh={() => void templates.refetch()}
          />
        }
      >
        <View style={styles.list}>
          {filteredTemplates.length > 0 ? (
            filteredTemplates.map((tpl: any) => (
              <Pressable 
                key={tpl.id} 
                style={styles.templateCard}
                onPress={() => {
                  const url = resolveFileUrl(tpl.templateFileUrl);
                  if (url) {
                    setPdfViewerUrl(url);
                    setPdfViewerVisible(true);
                  } else {
                    showAlert("Lỗi", "Không tìm thấy file hợp đồng");
                  }
                }}
                onLongPress={() => handleLongPressTemplate(tpl)}
                delayLongPress={500}
              >
                <View style={styles.templateHeader}>
                  <View style={[styles.templateIcon, { backgroundColor: '#D9E4DD' }]}>
                    <MaterialCommunityIcons
                      name="file-document-outline"
                      size={22}
                      color="#1E3E2F"
                    />
                  </View>
                  <View style={styles.templateInfo}>
                    <Text style={styles.templateName}>{tpl.name}</Text>
                    <Text style={styles.templateCode}>Mã: {tpl.code}</Text>
                  </View>
                  <StatusBadge
                    label={tpl.isActive ? "Hoạt động" : "Đã ẩn"}
                    tone={tpl.isActive ? "success" : "neutral"}
                  />
                </View>

                <View style={styles.templateMeta}>
                  <View style={styles.metaItem}>
                    <MaterialCommunityIcons
                      name="tag-outline"
                      size={14}
                      color="#64748B"
                    />
                    <Text style={styles.metaText}>
                      {CONTRACT_TYPE_LABELS[tpl.contractType as ContractType] ??
                        tpl.contractType}
                    </Text>
                  </View>
                  <View style={styles.metaItem}>
                    <MaterialCommunityIcons
                      name="history"
                      size={14}
                      color="#64748B"
                    />
                    <Text style={styles.metaText}>v{tpl.version}</Text>
                  </View>
                </View>

                {tpl.description ? (
                  <Text style={styles.templateDesc} numberOfLines={2}>
                    {tpl.description}
                  </Text>
                ) : null}

                <View style={{ flexDirection: "row", gap: 8, marginTop: 14 }}>
                  <Pressable
                    style={({ pressed }) => [
                      {
                        flex: 1,
                        backgroundColor: "#FFFFFF",
                        borderWidth: 1,
                        borderColor: "#E2E8F0",
                        borderRadius: 10,
                        paddingVertical: 9,
                        alignItems: "center",
                        justifyContent: "center",
                        flexDirection: "row",
                        gap: 6,
                      },
                      pressed && { opacity: 0.7 },
                    ]}
                    onPress={() => {
                      setSelectedTemplate(tpl);
                      setCreateModalVisible(true);
                    }}
                  >
                    <MaterialCommunityIcons
                      name="pencil-outline"
                      size={16}
                      color="#475569"
                    />
                    <Text
                      style={{
                        color: "#475569",
                        fontSize: 13,
                        fontWeight: "600",
                      }}
                    >
                      Cấu hình
                    </Text>
                  </Pressable>

                  <Pressable
                    style={({ pressed }) => [
                      {
                        flex: 1,
                        backgroundColor: "#1E3E2F",
                        borderRadius: 10,
                        paddingVertical: 9,
                        alignItems: "center",
                        justifyContent: "center",
                        flexDirection: "row",
                        gap: 6,
                      },
                      pressed && { opacity: 0.85 },
                    ]}
                    onPress={() => {
                      router.push({
                        pathname: `${roleBase(user)}/contracts/create` as any,
                        params: { templateId: tpl.id },
                      });
                    }}
                  >
                    <MaterialCommunityIcons
                      name="pencil-box-outline"
                      size={16}
                      color="#FFFFFF"
                    />
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: "700",
                        color: "#FFFFFF",
                      }}
                    >
                      Tạo HĐ
                    </Text>
                  </Pressable>

                  <Pressable
                    style={({ pressed }) => [
                      {
                        flex: 1,
                        backgroundColor: "#FFFFFF",
                        borderWidth: 1,
                        borderColor: "#E2E8F0",
                        borderRadius: 10,
                        paddingVertical: 9,
                        alignItems: "center",
                        justifyContent: "center",
                        flexDirection: "row",
                        gap: 6,
                      },
                      pressed && { backgroundColor: "#F8FAFC" },
                    ]}
                    onPress={() => {
                      const url = resolveFileUrl(tpl.templateFileUrl) || "";
                      router.push({
                        pathname:
                          `${roleBase(user)}/contracts/signature-placement` as any,
                        params: {
                          templateId: tpl.id,
                          pdfUrl: url,
                          initialConfig: JSON.stringify(
                            tpl.versions?.[0]?.mappingConfig || [],
                          ),
                        },
                      });
                    }}
                  >
                    <MaterialCommunityIcons
                      name="draw-pen"
                      size={16}
                      color="#475569"
                    />
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: "600",
                        color: "#475569",
                      }}
                    >
                      Tọa độ
                    </Text>
                  </Pressable>
                </View>
              </Pressable>
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
    </SafeAreaView>
  );
}

// ── Contract List Screen ──

export function ContractListScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const contracts = useContracts();
  const deleteContract = useDeleteContract();
  const { showAlert, showConfirm } = useAppAlert();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [selectedContractMenu, setSelectedContractMenu] = useState<any | null>(null);

  const [pdfViewerVisible, setPdfViewerVisible] = useState(false);
  const [pdfViewerUrl, setPdfViewerUrl] = useState<string | null>(null);

  const rawContractItems = Array.isArray(contracts.data)
    ? contracts.data
    : contracts.data?.items || [];

  const filteredContracts = useMemo(() => {
    return rawContractItems.filter((contract: any) => {
      if (statusFilter !== "ALL" && contract.status !== statusFilter) {
        return false;
      }
      if (search.trim()) {
        const query = search.trim().toLowerCase();
        const empName = (
          contract.user?.profile?.fullName ||
          contract.user?.userCode ||
          contract.employeeName ||
          ""
        ).toLowerCase();
        const code = (contract.contractCode || "").toLowerCase();
        const title = (contract.title || "").toLowerCase();
        if (!empName.includes(query) && !code.includes(query) && !title.includes(query)) {
          return false;
        }
      }
      return true;
    });
  }, [rawContractItems, statusFilter, search]);

  const selectedStatusLabel = useMemo(() => {
    return (
      STATUS_FILTER_OPTIONS.find((opt) => opt.id === statusFilter)?.label ||
      "Tất cả trạng thái"
    );
  }, [statusFilter]);

  const handleDeleteContract = (contract: any) => {
    showConfirm({
      title: "Xác nhận xóa",
      message: `Bạn có chắc chắn muốn xóa hợp đồng "${contract.contractCode || contract.title}" không? Hành động này không thể hoàn tác.`,
      confirmLabel: "Xóa",
      confirmTone: "danger",
      onConfirm: () => {
        deleteContract.mutate(contract.id, {
          onSuccess: () => {
            showAlert("Thành công", "Đã xóa hợp đồng");
            contracts.refetch();
          },
          onError: (err: any) => {
            showAlert("Lỗi", err?.message || "Không thể xóa hợp đồng");
          },
        });
      },
    });
  };

  return (
    <SafeAreaView style={cStyles.safeArea} edges={["top", "left", "right"]}>
      {/* Header: Back button + Title + "Mẫu HĐ" on same line */}
      <View style={cStyles.header}>
        <View style={cStyles.headerRow}>
          <View style={cStyles.headerTitleGroup}>
            <Pressable
              onPress={() => (router.canGoBack() ? router.back() : router.replace(`${roleBase(user)}/(tabs)` as any))}
              style={cStyles.backBtn}
              hitSlop={10}
            >
              <Ionicons name="chevron-back" size={24} color="#0F172A" />
            </Pressable>
            <View>
              <Text style={cStyles.screenTitle}>Hợp đồng</Text>
              <Text style={cStyles.screenSubtitle}>Quản lý hợp đồng lao động</Text>
            </View>
          </View>

          <Pressable
            style={cStyles.templateBtn}
            onPress={() => router.push(`${roleBase(user)}/contracts/templates` as any)}
          >
            <MaterialCommunityIcons name="file-document-outline" size={16} color="#1E3E2F" />
            <Text style={cStyles.templateBtnText}>Mẫu HĐ</Text>
          </Pressable>
        </View>
      </View>

      {/* Search Input & Filter Dropdown */}
      <View style={cStyles.searchFilterContainer}>
        <View style={cStyles.searchBar}>
          <Ionicons name="search" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Tìm tên nhân viên hoặc mã hợp đồng"
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
            style={cStyles.searchInput}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color="#94A3B8" />
            </Pressable>
          )}
        </View>

        <Pressable
          style={cStyles.statusDropdown}
          onPress={() => setStatusModalVisible(true)}
        >
          <Text style={cStyles.statusDropdownText}>{selectedStatusLabel}</Text>
          <Ionicons name="chevron-down" size={18} color="#64748B" />
        </Pressable>
      </View>

      {/* Contract List */}
      <ScrollView
        contentContainerStyle={cStyles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={contracts.isRefetching}
            onRefresh={() => void contracts.refetch()}
          />
        }
      >
        {contracts.isLoading ? (
          <View style={{ paddingVertical: 40, alignItems: "center" }}>
            <ActivityIndicator color="#1E3E2F" size="small" />
            <Text style={{ marginTop: 8, fontSize: 13, color: "#64748B" }}>
              Đang tải danh sách hợp đồng...
            </Text>
          </View>
        ) : filteredContracts.length > 0 ? (
          <>
            {filteredContracts.map((contract: any) => {
              const empName =
                contract.user?.profile?.fullName ??
                contract.user?.userCode ??
                contract.employeeName ??
                "-";
              const initials = getInitials(empName);

              return (
                <View key={contract.id} style={cStyles.contractCard}>
                  {/* Top Row: Avatar + Info + Status */}
                  <View style={cStyles.cardTopRow}>
                    <View style={cStyles.avatarCircle}>
                      <Text style={cStyles.avatarText}>{initials}</Text>
                    </View>
                    <View style={cStyles.cardTopInfo}>
                      <Text style={cStyles.cardEmpName} numberOfLines={1}>
                        {empName}
                      </Text>
                      <Text style={cStyles.cardContractTitle} numberOfLines={1}>
                        {contract.title || "Hợp đồng lao động"}
                      </Text>
                      <Text style={cStyles.cardContractCode}>
                        {contract.contractCode || "-"}
                      </Text>
                    </View>
                    <ContractStatusBadge status={contract.status} />
                  </View>

                  <View style={cStyles.cardDivider} />

                  {/* Bottom Row: Xem chi tiết -> & ... */}
                  <View style={cStyles.cardBottomRow}>
                    <Pressable
                      onPress={() =>
                        router.push(`${roleBase(user)}/contracts/${contract.id}` as any)
                      }
                      style={cStyles.cardDetailLink}
                    >
                      <Text style={cStyles.cardDetailLinkText}>Xem chi tiết →</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setSelectedContractMenu(contract)}
                      style={cStyles.cardMoreBtn}
                      hitSlop={8}
                    >
                      <Ionicons name="ellipsis-horizontal" size={20} color="#0F172A" />
                    </Pressable>
                  </View>
                </View>
              );
            })}

            <Text style={cStyles.counterFooter}>
              Hiển thị {filteredContracts.length} hợp đồng
            </Text>
          </>
        ) : (
          <EmptyState
            title="Không có hợp đồng"
            message={
              search
                ? "Không tìm thấy hợp đồng phù hợp với từ khóa"
                : "Chưa có hợp đồng nào trong hệ thống"
            }
          />
        )}
      </ScrollView>

      {/* Select Status Modal */}
      <SelectModal
        visible={statusModalVisible}
        title="Chọn trạng thái hợp đồng"
        options={STATUS_FILTER_OPTIONS}
        selectedValue={statusFilter}
        onSelect={(opt) => {
          setStatusFilter(opt.id || "ALL");
          setStatusModalVisible(false);
        }}
        onClose={() => setStatusModalVisible(false)}
      />

      {/* Action Sheet Modal */}
      <Modal
        visible={!!selectedContractMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedContractMenu(null)}
      >
        <Pressable
          style={cStyles.actionSheetOverlay}
          onPress={() => setSelectedContractMenu(null)}
        >
          <View style={cStyles.actionSheetContent}>
            <View style={cStyles.actionSheetHeader}>
              <Text style={cStyles.actionSheetTitle}>
                {selectedContractMenu?.user?.profile?.fullName ||
                  selectedContractMenu?.user?.userCode ||
                  "Hợp đồng"}
              </Text>
              <Text style={cStyles.actionSheetSubtitle}>
                {selectedContractMenu?.contractCode} ·{" "}
                {selectedContractMenu?.title || "Hợp đồng lao động"}
              </Text>
            </View>

            {/* Xem chi tiết */}
            <Pressable
              style={cStyles.actionSheetItem}
              onPress={() => {
                const cId = selectedContractMenu.id;
                setSelectedContractMenu(null);
                router.push(`${roleBase(user)}/contracts/${cId}` as any);
              }}
            >
              <Ionicons name="eye-outline" size={20} color="#0F172A" />
              <Text style={cStyles.actionSheetItemText}>Xem chi tiết</Text>
            </Pressable>

            {/* Xem file PDF nếu có */}
            {(() => {
              const fileUrl =
                selectedContractMenu?.signedFileUrl ||
                selectedContractMenu?.draftFileUrl ||
                selectedContractMenu?.contractTemplateVersion?.templateFileUrl ||
                selectedContractMenu?.contractTemplate?.templateFileUrl;
              if (!fileUrl) return null;
              return (
                <Pressable
                  style={cStyles.actionSheetItem}
                  onPress={() => {
                    const url = resolveFileUrl(fileUrl);
                    setSelectedContractMenu(null);
                    if (url) {
                      setPdfViewerUrl(url);
                      setPdfViewerVisible(true);
                    } else {
                      showAlert("Lỗi", "Không tìm thấy file hợp đồng");
                    }
                  }}
                >
                  <Ionicons name="document-text-outline" size={20} color="#0F172A" />
                  <Text style={cStyles.actionSheetItemText}>
                    Xem file hợp đồng (PDF)
                  </Text>
                </Pressable>
              );
            })()}

            {/* Xóa hợp đồng */}
            {(selectedContractMenu?.status === "WAITING_EMPLOYEE_SIGNATURE" ||
              selectedContractMenu?.status === "DRAFT" ||
              selectedContractMenu?.status === "WAITING_COMPANY_SIGNATURE" ||
              user?.roles?.includes("ADMIN")) && (
              <Pressable
                style={cStyles.actionSheetItem}
                onPress={() => {
                  const c = selectedContractMenu;
                  setSelectedContractMenu(null);
                  handleDeleteContract(c);
                }}
              >
                <Ionicons name="trash-outline" size={20} color="#DC2626" />
                <Text style={[cStyles.actionSheetItemText, { color: "#DC2626" }]}>
                  Xóa hợp đồng
                </Text>
              </Pressable>
            )}

            {/* Hủy bỏ */}
            <Pressable
              style={cStyles.actionSheetCancelBtn}
              onPress={() => setSelectedContractMenu(null)}
            >
              <Text style={cStyles.actionSheetCancelText}>Hủy bỏ</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* Pdf Viewer Modal */}
      <PdfViewerModal
        visible={pdfViewerVisible}
        url={pdfViewerUrl}
        onClose={() => {
          setPdfViewerVisible(false);
          setPdfViewerUrl(null);
        }}
        title="Xem hợp đồng"
      />
    </SafeAreaView>
  );
}

// ── Employee Contract List Screen ──

export function EmployeeContractListScreen() {
  const router = useRouter();
  const contracts = useMyContracts();
  const contractItems = Array.isArray(contracts.data) ? contracts.data : [];

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={contracts.isRefetching}
            onRefresh={() => void contracts.refetch()}
          />
        }
      >
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
                  onPress={() =>
                    router.push(`/employee/contracts/${contract.id}`)
                  }
                >
                  <View style={styles.contractHeader}>
                    <View style={styles.contractAvatar}>
                      <Text style={styles.contractAvatarText}>HĐ</Text>
                    </View>
                    <View style={styles.contractMainInfo}>
                      <Text style={styles.contractTitle}>{contract.title}</Text>
                      <Text style={styles.contractEmpName}>
                        {contract.contractCode}
                      </Text>
                    </View>
                    <StatusBadge
                      label={
                        CONTRACT_STATUS_LABELS[
                          contract.status as ContractStatus
                        ] ?? contract.status
                      }
                      tone={getStatusTone(contract.status)}
                    />
                  </View>

                  <View style={styles.contractDetails}>
                    <View style={styles.detailItem}>
                      <MaterialCommunityIcons
                        name="tag-outline"
                        size={14}
                        color={colors.muted}
                      />
                      <Text style={styles.detailText}>
                        {CONTRACT_TYPE_LABELS[
                          contract.contractType as ContractType
                        ] ?? contract.contractType}
                      </Text>
                    </View>
                    <View style={styles.detailItem}>
                      <MaterialCommunityIcons
                        name="calendar-range"
                        size={14}
                        color={colors.muted}
                      />
                      <Text style={styles.detailText}>
                        {formatDate(contract.startDate)} →{" "}
                        {formatDate(contract.endDate)}
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
  const signCompanyContract = useSignContractCompany(contractId);
  const rejectSignature = useRejectContractSignature(contractId);
  const deleteContract = useDeleteContract();
  const { showAlert, showConfirm } = useAppAlert();

  const [pdfViewerVisible, setPdfViewerVisible] = useState(false);
  const [pdfViewerUrl, setPdfViewerUrl] = useState<string | null>(null);

  const [isSignatureVisible, setSignatureVisible] = useState(false);
  const [viewingSignatureUrl, setViewingSignatureUrl] = useState<string | null>(null);
  const [detailMenuVisible, setDetailMenuVisible] = useState(false);

  const data = contract.data;
  if (!data && !contract.isLoading) {
    return (
      <SafeAreaView style={cStyles.safeArea} edges={["top", "left", "right"]}>
        <View style={cStyles.header}>
          <View style={cStyles.headerRow}>
            <View style={cStyles.headerTitleGroup}>
              <Pressable
                onPress={() => (router.canGoBack() ? router.back() : router.replace(`${roleBase(user)}/contracts` as any))}
                style={cStyles.backBtn}
                hitSlop={10}
              >
                <Ionicons name="chevron-back" size={24} color="#0F172A" />
              </Pressable>
              <Text style={cStyles.detailScreenTitle}>Chi tiết hợp đồng</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>
        </View>
        <EmptyState title="Không tìm thấy hợp đồng" />
      </SafeAreaView>
    );
  }
  if (!data) return null;

  const empName = data.user?.profile?.fullName ?? data.user?.userCode ?? (data as any).employeeName ?? "-";
  const initials = getInitials(empName);
  const status = data.status as ContractStatus;
  const contractFileUrl =
    data.signedFileUrl ||
    data.draftFileUrl ||
    data.contractTemplateVersion?.templateFileUrl ||
    (data as any).contractTemplate?.templateFileUrl;

  const hasCompanyAction = Array.isArray(data.contractTemplateVersion?.mappingConfig)
    ? data.contractTemplateVersion.mappingConfig.some((f: any) => f.role === "COMPANY")
    : false;

  const canSignCompany =
    status === "WAITING_COMPANY_SIGNATURE" &&
    (user?.roles?.includes("ADMIN") || (user as any)?.role === "ADMIN");

  const canSignEmployee =
    status === "WAITING_EMPLOYEE_SIGNATURE" &&
    (data?.userId === user?.id || (user as any)?.roles?.includes("ADMIN"));

  const canActivate =
    (status === "COMPLETED" || status === "APPROVED") &&
    (user?.roles?.includes("ADMIN") || (user as any)?.role === "ADMIN");

  const canDelete =
    (status === "WAITING_EMPLOYEE_SIGNATURE" &&
      (user?.roles?.includes("ADMIN") || user?.roles?.includes("HR"))) ||
    (status === "WAITING_COMPANY_SIGNATURE" && user?.roles?.includes("ADMIN")) ||
    status === "DRAFT" ||
    user?.roles?.includes("ADMIN");

  async function handleAction(action: () => Promise<unknown>, label: string) {
    try {
      await action();
      showAlert("Thành công", label);
    } catch (error) {
      const normalized = normalizeApiError(error);
      showAlert("Lỗi", normalized.message);
    }
  }

  const handleDelete = () => {
    showConfirm({
      title: "Xác nhận xóa",
      message:
        "Bạn có chắc chắn muốn xóa hợp đồng này không? Hành động này không thể hoàn tác.",
      confirmLabel: "Xóa",
      confirmTone: "danger",
      onConfirm: () => {
        handleAction(async () => {
          await deleteContract.mutateAsync(contractId);
          router.back();
        }, "Đã xóa hợp đồng thành công");
      },
    });
  };

  return (
    <SafeAreaView style={cStyles.safeArea} edges={["top", "left", "right"]}>
      {/* Header: Back button + Title + 3-dots on same line */}
      <View style={cStyles.header}>
        <View style={cStyles.headerRow}>
          <View style={cStyles.headerTitleGroup}>
            <Pressable
              onPress={() => (router.canGoBack() ? router.back() : router.replace(`${roleBase(user)}/contracts` as any))}
              style={cStyles.backBtn}
              hitSlop={10}
            >
              <Ionicons name="chevron-back" size={24} color="#0F172A" />
            </Pressable>
            <Text style={cStyles.detailScreenTitle}>Chi tiết hợp đồng</Text>
          </View>
          <Pressable
            onPress={() => setDetailMenuVisible(true)}
            style={cStyles.topRightBtn}
            hitSlop={10}
          >
            <Ionicons name="ellipsis-horizontal" size={20} color="#0F172A" />
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={cStyles.detailScrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* Card 1: Employee & Contract Header */}
        <View style={cStyles.detailSectionCard}>
          <View style={cStyles.cardTopRow}>
            <View style={cStyles.avatarCircle}>
              <Text style={cStyles.avatarText}>{initials}</Text>
            </View>
            <View style={cStyles.cardTopInfo}>
              <Text style={cStyles.cardEmpName} numberOfLines={1}>
                {empName}
              </Text>
              <Text style={cStyles.cardContractTitle} numberOfLines={1}>
                {data.title || "Hợp đồng lao động"}
              </Text>
              <Text style={cStyles.cardContractCode}>{data.contractCode || "-"}</Text>
            </View>
            <ContractStatusBadge status={status} />
          </View>
        </View>

        {/* Card 2: Thông tin hợp đồng */}
        <View style={cStyles.detailSectionCard}>
          <Text style={cStyles.sectionTitle}>Thông tin hợp đồng</Text>

          <View style={cStyles.infoRow}>
            <Text style={cStyles.infoRowLabel}>Mã hợp đồng</Text>
            <Text style={cStyles.infoRowValue}>{data.contractCode || "-"}</Text>
          </View>
          <View style={cStyles.rowDivider} />

          <View style={cStyles.infoRow}>
            <Text style={cStyles.infoRowLabel}>Loại hợp đồng</Text>
            <Text style={cStyles.infoRowValue}>
              {CONTRACT_TYPE_LABELS[data.contractType as ContractType] ||
                data.contractType ||
                "Có thời hạn"}
            </Text>
          </View>
          <View style={cStyles.rowDivider} />

          <View style={cStyles.infoRow}>
            <Text style={cStyles.infoRowLabel}>Ngày bắt đầu</Text>
            <Text style={cStyles.infoRowValue}>{formatDate(data.startDate)}</Text>
          </View>
          <View style={cStyles.rowDivider} />

          <View style={cStyles.infoRow}>
            <Text style={cStyles.infoRowLabel}>Ngày kết thúc</Text>
            <Text style={cStyles.infoRowValue}>{formatDate(data.endDate)}</Text>
          </View>
          <View style={cStyles.rowDivider} />

          <View style={cStyles.infoRow}>
            <Text style={cStyles.infoRowLabel}>Nhân viên xác nhận</Text>
            <View
              style={{
                backgroundColor:
                  data.employeeAcknowledgementStatus === "AGREED"
                    ? "#DCFCE7"
                    : data.employeeAcknowledgementStatus === "DISAGREED"
                      ? "#FEE2E2"
                      : "#FEF3C7",
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 12,
              }}
            >
              <Text
                style={{
                  color:
                    data.employeeAcknowledgementStatus === "AGREED"
                      ? "#166534"
                      : data.employeeAcknowledgementStatus === "DISAGREED"
                        ? "#DC2626"
                        : "#D97706",
                  fontSize: 12,
                  fontWeight: "700",
                }}
              >
                {data.employeeAcknowledgementStatus === "AGREED"
                  ? "Đã xác nhận"
                  : data.employeeAcknowledgementStatus === "DISAGREED"
                    ? "Không đồng ý"
                    : "Chờ xác nhận"}
              </Text>
            </View>
          </View>
        </View>

        {/* Card 3: Chữ ký đã ghi nhận */}
        {data.signatures && data.signatures.length > 0 && (
          <View style={cStyles.detailSectionCard}>
            <Text style={cStyles.sectionTitle}>Chữ ký đã ghi nhận</Text>
            {data.signatures.map((sig: any, index: number) => {
              const isEmployee = sig.signerRole === "EMPLOYEE";
              const signerName =
                sig.signer?.profile?.fullName ||
                (isEmployee ? empName : "Đại diện công ty");
              const roleText = isEmployee ? "Nhân viên" : "Công ty";
              const dateText = formatDate(sig.signedAt);

              return (
                <View
                  key={sig.id || index}
                  style={[
                    cStyles.signatureRowItem,
                    index > 0 && {
                      marginTop: 12,
                      paddingTop: 12,
                      borderTopWidth: 1,
                      borderTopColor: "#F1F5F9",
                    },
                  ]}
                >
                  <Ionicons name="checkmark-circle" size={24} color="#16A34A" />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={cStyles.signatureSignerName}>{signerName}</Text>
                    <Text style={cStyles.signatureMetaText}>
                      {roleText} · {dateText}
                    </Text>
                  </View>
                  {sig.signatureImageUrl && (
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <View style={cStyles.signatureDivider} />
                      <Pressable
                        onPress={() => setViewingSignatureUrl(sig.signatureImageUrl)}
                        style={cStyles.viewSigBtn}
                        hitSlop={8}
                      >
                        <Text style={cStyles.viewSigBtnText}>Xem</Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* Card 4: File hợp đồng */}
        <View style={cStyles.detailSectionCard}>
          <View style={cStyles.fileCardRow}>
            <View style={cStyles.pdfBadgeContainer}>
              <Text style={cStyles.pdfBadgeText}>PDF</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={cStyles.fileNameTitle}>File hợp đồng</Text>
              <Text style={cStyles.fileFormatSub}>Định dạng PDF</Text>
            </View>
            <Pressable
              onPress={() => {
                const url = resolveFileUrl(contractFileUrl);
                if (url) {
                  setPdfViewerVisible(true);
                  setPdfViewerUrl(url);
                } else {
                  showAlert("Lỗi", "Không tìm thấy file hợp đồng");
                }
              }}
              style={cStyles.openPdfLink}
              hitSlop={8}
            >
              <Text style={cStyles.openPdfLinkText}>Mở PDF ↗</Text>
            </Pressable>
          </View>
        </View>

        {/* Delete Link */}
        {canDelete && (
          <Pressable style={cStyles.deleteContractRow} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={18} color="#DC2626" />
            <Text style={cStyles.deleteContractText}>Xóa hợp đồng</Text>
          </Pressable>
        )}
      </ScrollView>

      {/* Bottom Sticky Action Bar */}
      {canSignCompany ? (
        <View style={cStyles.bottomStickyBar}>
          <Text style={cStyles.bottomBarHint}>Dành cho đại diện công ty</Text>
          <Pressable
            style={cStyles.companySignBtn}
            onPress={() => {
              if (hasCompanyAction) {
                setSignatureVisible(true);
              } else {
                handleAction(
                  () =>
                    signCompanyContract.mutateAsync({
                      signatureType: "DRAWN",
                    } as any),
                  "Đã xác nhận hoàn thành hợp đồng",
                );
              }
            }}
          >
            <MaterialCommunityIcons
              name="pencil-outline"
              size={18}
              color="#FFFFFF"
              style={{ marginRight: 6 }}
            />
            <Text style={cStyles.companySignBtnText}>Ký điện tử</Text>
          </Pressable>
        </View>
      ) : canSignEmployee ? (
        <View style={cStyles.bottomStickyBar}>
          <Text style={cStyles.bottomBarHint}>Dành cho nhân viên</Text>
          <Pressable
            style={cStyles.companySignBtn}
            onPress={() => setSignatureVisible(true)}
          >
            <MaterialCommunityIcons
              name="pencil-outline"
              size={18}
              color="#FFFFFF"
              style={{ marginRight: 6 }}
            />
            <Text style={cStyles.companySignBtnText}>Ký điện tử</Text>
          </Pressable>
        </View>
      ) : canActivate ? (
        <View style={cStyles.bottomStickyBar}>
          <Pressable
            style={cStyles.companySignBtn}
            onPress={() =>
              handleAction(
                () => activate.mutateAsync(contractId),
                "Đã kích hoạt hợp đồng",
              )
            }
          >
            <Text style={cStyles.companySignBtnText}>Kích hoạt hợp đồng</Text>
          </Pressable>
        </View>
      ) : null}

      {/* Top-Right Menu Modal */}
      <Modal
        visible={detailMenuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDetailMenuVisible(false)}
      >
        <Pressable
          style={cStyles.actionSheetOverlay}
          onPress={() => setDetailMenuVisible(false)}
        >
          <View style={cStyles.actionSheetContent}>
            <View style={cStyles.actionSheetHeader}>
              <Text style={cStyles.actionSheetTitle}>Tùy chọn</Text>
              <Text style={cStyles.actionSheetSubtitle}>{data.contractCode}</Text>
            </View>

            {contractFileUrl && (
              <Pressable
                style={cStyles.actionSheetItem}
                onPress={() => {
                  setDetailMenuVisible(false);
                  const url = resolveFileUrl(contractFileUrl);
                  if (url) {
                    setPdfViewerUrl(url);
                    setPdfViewerVisible(true);
                  }
                }}
              >
                <Ionicons name="document-text-outline" size={20} color="#0F172A" />
                <Text style={cStyles.actionSheetItemText}>Xem file hợp đồng (PDF)</Text>
              </Pressable>
            )}

            {(canSignCompany || canSignEmployee) && (
              <Pressable
                style={cStyles.actionSheetItem}
                onPress={() => {
                  setDetailMenuVisible(false);
                  setSignatureVisible(true);
                }}
              >
                <MaterialCommunityIcons name="pencil-outline" size={20} color="#0F172A" />
                <Text style={cStyles.actionSheetItemText}>Ký điện tử</Text>
              </Pressable>
            )}

            {canDelete && (
              <Pressable
                style={cStyles.actionSheetItem}
                onPress={() => {
                  setDetailMenuVisible(false);
                  handleDelete();
                }}
              >
                <Ionicons name="trash-outline" size={20} color="#DC2626" />
                <Text style={[cStyles.actionSheetItemText, { color: "#DC2626" }]}>
                  Xóa hợp đồng
                </Text>
              </Pressable>
            )}

            <Pressable
              style={cStyles.actionSheetCancelBtn}
              onPress={() => setDetailMenuVisible(false)}
            >
              <Text style={cStyles.actionSheetCancelText}>Hủy bỏ</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* Pdf Viewer Modal */}
      <PdfViewerModal
        visible={pdfViewerVisible}
        url={pdfViewerUrl}
        onClose={() => {
          setPdfViewerVisible(false);
          setPdfViewerUrl(null);
        }}
        title="Xem hợp đồng"
      />

      {/* Contract Signature Modal */}
      <ContractSignatureModal
        visible={isSignatureVisible}
        onClose={() => setSignatureVisible(false)}
        pdfUrl={contractFileUrl}
        fieldsToFill={
          contract?.data?.contractTemplateVersion?.mappingConfig?.filter(
            (f: any) =>
              !f.role ||
              f.role ===
                (contract.data?.status === "WAITING_COMPANY_SIGNATURE"
                  ? "COMPANY"
                  : "EMPLOYEE"),
          ) || []
        }
        contractUser={contract?.data?.user}
        onSave={(signature, filledFields) => {
          setSignatureVisible(false);
          const payload = {
            signatureType: "DRAWN" as const,
            signatureImageUrl: signature,
            filledFields: filledFields,
          };
          if (contract.data?.status === "WAITING_COMPANY_SIGNATURE") {
            handleAction(
              () => signCompanyContract.mutateAsync(payload),
              "Đã ký hợp đồng (Công ty)",
            );
          } else {
            handleAction(
              () => signContract.mutateAsync(payload),
              "Đã ký hợp đồng (Nhân viên)",
            );
          }
        }}
      />

      {/* Viewing Signature Image Modal */}
      <Modal
        visible={!!viewingSignatureUrl}
        transparent
        animationType="fade"
        onRequestClose={() => setViewingSignatureUrl(null)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          }}
          onPress={() => setViewingSignatureUrl(null)}
        >
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 20,
              padding: 24,
              width: "100%",
              maxWidth: 400,
              alignItems: "center",
            }}
          >
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 26,
                backgroundColor: "#D9E4DD",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 12,
              }}
            >
              <MaterialCommunityIcons name="draw-pen" size={26} color="#1E3E2F" />
            </View>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "800",
                marginBottom: 16,
                color: "#0F172A",
              }}
            >
              Chữ ký
            </Text>
            <View
              style={{
                backgroundColor: "#F8FAFC",
                padding: 16,
                borderRadius: 12,
                width: "100%",
                alignItems: "center",
                marginBottom: 20,
                borderWidth: 1,
                borderColor: "#E2E8F0",
              }}
            >
              {viewingSignatureUrl && (
                <Image
                  source={{ uri: resolveFileUrl(viewingSignatureUrl) || "" }}
                  style={{ width: "100%", height: 150 }}
                  resizeMode="contain"
                />
              )}
            </View>
            <Pressable
              onPress={() => setViewingSignatureUrl(null)}
              style={({ pressed }) => [
                {
                  width: "100%",
                  height: 48,
                  borderRadius: 12,
                  backgroundColor: "#1E3E2F",
                  alignItems: "center",
                  justifyContent: "center",
                },
                pressed && { opacity: 0.85 },
              ]}
            >
              <Text style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "700" }}>
                Đóng
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.detailRow}>
      <MaterialCommunityIcons
        name={icon as any}
        size={16}
        color={colors.muted}
      />
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

// ── Create Contract Screen ──

export function CreateContractScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const templateId =
    typeof params.templateId === "string" ? params.templateId : undefined;
  const { data: templates } = useContractTemplates();
  const employeesQuery = useEmployees({ limit: 500, page: 1 });
  const employeesData = Array.isArray(employeesQuery.data)
    ? employeesQuery.data
    : employeesQuery.data?.items || employeesQuery.data?.data || [];

  // Region, Branch & Department filter state
  const [selectedRegionId, setSelectedRegionId] = useState<string>("ALL");
  const [selectedBranchId, setSelectedBranchId] = useState<string>("ALL");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("ALL");
  const [isRegionSelectVisible, setRegionSelectVisible] = useState(false);
  const [isBranchSelectVisible, setBranchSelectVisible] = useState(false);
  const [isDeptSelectVisible, setDeptSelectVisible] = useState(false);

  const regionsQuery = useRegions();
  const branchesQuery = useBranches();
  const departmentsQuery = useDepartments({ limit: 1000 });
  const regions = regionsQuery.data || [];
  const branches = branchesQuery.data || [];
  const departmentsData = Array.isArray(departmentsQuery.data)
    ? departmentsQuery.data
    : departmentsQuery.data?.items || departmentsQuery.data?.data || [];

  const regionOptions: SelectOption[] = useMemo(() => {
    return [
      { id: "ALL", label: "Tất cả các Miền" },
      ...regions.map((r: any) => ({ id: r.id, label: r.name })),
    ];
  }, [regions]);

  const availableBranches = useMemo(() => {
    if (selectedRegionId === "ALL") return branches;
    return branches.filter(
      (b: any) => b.regionId === selectedRegionId || b.region?.id === selectedRegionId
    );
  }, [branches, selectedRegionId]);

  const branchOptions: SelectOption[] = useMemo(() => {
    return [
      { id: "ALL", label: "Tất cả Chi nhánh" },
      ...availableBranches.map((b: any) => ({ id: b.id, label: b.name })),
    ];
  }, [availableBranches]);

  const availableDepartments = useMemo(() => {
    return departmentsData.filter((d: any) => {
      const dBranchId = d.branchId || d.branch?.id;
      // If branch selected, must match branch
      if (selectedBranchId !== "ALL") {
        return dBranchId === selectedBranchId;
      }
      // If only region selected, must match any branch in that region
      if (selectedRegionId !== "ALL") {
        const branchIdsInRegion = new Set(availableBranches.map((b: any) => b.id));
        return (dBranchId && branchIdsInRegion.has(dBranchId)) || d.branch?.regionId === selectedRegionId || d.branch?.region?.id === selectedRegionId;
      }
      return true;
    });
  }, [departmentsData, selectedBranchId, selectedRegionId, availableBranches]);

  const departmentOptions: SelectOption[] = useMemo(() => {
    return [
      { id: "ALL", label: "Tất cả Phòng ban" },
      ...availableDepartments.map((d: any) => ({ id: d.id, label: d.name })),
    ];
  }, [availableDepartments]);

  const handleSelectRegion = (rId: string) => {
    setSelectedRegionId(rId);
    if (rId !== "ALL" && selectedBranchId !== "ALL") {
      const branchStillValid = branches.some(
        (b: any) => b.id === selectedBranchId && (b.regionId === rId || b.region?.id === rId)
      );
      if (!branchStillValid) {
        setSelectedBranchId("ALL");
      }
    }
    if (selectedDepartmentId !== "ALL") {
      const dept = departmentsData.find((d: any) => d.id === selectedDepartmentId);
      const dBranchId = dept?.branchId || dept?.branch?.id;
      if (rId !== "ALL" && dBranchId) {
        const dBranch = branches.find((b: any) => b.id === dBranchId);
        const dRegionId = dBranch?.regionId || dBranch?.region?.id || dept?.branch?.regionId;
        if (dRegionId && dRegionId !== rId) {
          setSelectedDepartmentId("ALL");
        }
      }
    }
  };

  const handleSelectBranch = (bId: string) => {
    setSelectedBranchId(bId);
    if (bId !== "ALL" && selectedDepartmentId !== "ALL") {
      const dept = departmentsData.find((d: any) => d.id === selectedDepartmentId);
      const dBranchId = dept?.branchId || dept?.branch?.id;
      if (dBranchId && dBranchId !== bId) {
        setSelectedDepartmentId("ALL");
      }
    }
  };

  // Filter out Admins and filter by selected Region / Branch / Department
  const filteredEmployees = useMemo(() => {
    return employeesData.filter((e: any) => {
      // 1. Bỏ các Admin
      const isRoleAdmin = e.roles?.some((r: any) => 
        r.role?.code === "ADMIN" || r.role?.code === "SUPER_ADMIN"
      );
      const emailIsAdmin = e.email?.toLowerCase().includes("admin");
      const nameIsAdmin = (e.profile?.fullName || e.fullName || "").toLowerCase().includes("admin");
      const codeIsAdmin = (e.userCode || "").toLowerCase().includes("admin");
      if (isRoleAdmin || emailIsAdmin || nameIsAdmin || codeIsAdmin) {
        return false;
      }

      // 2. Lấy thông tin phòng ban, chi nhánh, miền
      const link = e.departmentLinks?.[0];
      const deptBranchId = link?.department?.branchId || link?.department?.branch?.id;
      const matchedBranch = branches.find((b: any) => b.id === deptBranchId);
      const userBranchId = matchedBranch?.id || deptBranchId;
      const userRegionId = matchedBranch?.regionId || matchedBranch?.region?.id || link?.department?.branch?.regionId || link?.department?.branch?.region?.id;

      // 3. Lọc theo Miền nếu chọn
      if (selectedRegionId !== "ALL") {
        if (!userRegionId || userRegionId !== selectedRegionId) {
          return false;
        }
      }

      // 4. Lọc theo Chi nhánh nếu chọn
      if (selectedBranchId !== "ALL") {
        if (!userBranchId || userBranchId !== selectedBranchId) {
          return false;
        }
      }

      // 5. Lọc theo Phòng ban nếu chọn
      if (selectedDepartmentId !== "ALL") {
        const belongsToDept = e.departmentLinks?.some((l: any) => 
          (l.departmentId === selectedDepartmentId || l.department?.id === selectedDepartmentId)
        );
        if (!belongsToDept) {
          return false;
        }
      }

      return true;
    });
  }, [employeesData, branches, selectedRegionId, selectedBranchId, selectedDepartmentId]);

  const employeeOptions = useMemo(() => {
    return filteredEmployees.map((e: any) => {
      const link = e.departmentLinks?.[0];
      const deptName = link?.department?.name;
      const deptBranchId = link?.department?.branchId || link?.department?.branch?.id;
      const matchedBranch = branches.find((b: any) => b.id === deptBranchId);
      const branchName = matchedBranch?.name || link?.department?.branch?.name;
      const matchedRegion = regions.find((r: any) => r.id === (matchedBranch?.regionId || matchedBranch?.region?.id));
      const regionName = matchedRegion?.name || matchedBranch?.region?.name || link?.department?.branch?.region?.name;
      const positionName = link?.position?.name;

      const subParts = [positionName, deptName, branchName, regionName].filter(Boolean);
      const subtitle = subParts.length > 0 ? subParts.join(" · ") : (e.email || e.userCode);

      return {
        id: e.id,
        label: e.profile?.fullName ?? e.userCode ?? e.email,
        subtitle,
      };
    });
  }, [filteredEmployees, branches, regions]);

  const [userIds, setUserIds] = useState<string[]>([]);
  const [successModalInfo, setSuccessModalInfo] = useState<{
    visible: boolean;
    count: number;
  }>({ visible: false, count: 0 });
  const [contractType, setContractType] = useState<ContractType>("FIXED_TERM");
  const [title, setTitle] = useState("");
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
  const [datePickerState, setDatePickerState] = useState<
    "start" | "end" | null
  >(null);

  const createContractMutation = useCreateContract();
  const { showAlert } = useAppAlert();

  async function submit() {
    if (userIds.length === 0 || !templateId || !title.trim() || !startDate) {
      showAlert("Lỗi", "Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }
    if (contractType !== "INDEFINITE_TERM" && !endDate) {
      showAlert("Lỗi", "Vui lòng chọn ngày kết thúc cho loại hợp đồng này");
      return;
    }
    if (
      contractType !== "INDEFINITE_TERM" &&
      endDate &&
      new Date(endDate) < new Date(startDate)
    ) {
      showAlert("Lỗi", "Ngày kết thúc phải sau ngày bắt đầu");
      return;
    }

    try {
      const versionId = templates?.find((t: any) => t.id === templateId)
        ?.versions?.[0]?.id;
      if (!versionId)
        throw new Error("Mẫu hợp đồng này chưa có phiên bản hợp lệ");

      const createdCount = userIds.length;
      await Promise.all(
        userIds.map(async (userId) => {
          return createContractMutation.mutateAsync({
            userId,
            contractTemplateId: templateId,
            contractTemplateVersionId: versionId,
            contractType,
            title: title.trim(),
            startDate,
            endDate: contractType === "INDEFINITE_TERM" ? undefined : endDate,
          });
        }),
      );

      setSuccessModalInfo({ visible: true, count: createdCount });
    } catch (error: any) {
      showAlert("Lỗi", normalizeApiError(error).message);
    }
  }

  return (
    <SafeAreaView style={cStyles.safeArea} edges={["top", "left", "right"]}>
      {/* Header: Back Button + Title on same line */}
      <View style={cStyles.header}>
        <View style={cStyles.headerRow}>
          <View style={cStyles.headerTitleGroup}>
            <Pressable
              onPress={() => (router.canGoBack() ? router.back() : router.replace(`${roleBase(user)}/contracts` as any))}
              style={cStyles.backBtn}
              hitSlop={10}
            >
              <Ionicons name="chevron-back" size={24} color="#0F172A" />
            </Pressable>
            <View>
              <Text style={cStyles.screenTitle}>Tạo hợp đồng</Text>
              <Text style={cStyles.screenSubtitle}>Điền thông tin để tạo hợp đồng mới</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, gap: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Selected Template Info (if applicable) */}
        {templateId && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#FFFFFF",
              borderRadius: 14,
              padding: 14,
              borderWidth: 1,
              borderColor: "#E2E8F0",
              gap: 12,
            }}
          >
            <View
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                backgroundColor: "#D9E4DD",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MaterialCommunityIcons name="file-document-outline" size={22} color="#1E3E2F" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, color: "#64748B", fontWeight: "600", textTransform: "uppercase" }}>
                Mẫu hợp đồng áp dụng
              </Text>
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#0F172A", marginTop: 2 }}>
                {title || "Đang tải mẫu..."}
              </Text>
            </View>
          </View>
        )}

        {/* Section: Phạm vi áp dụng */}
        <View style={styles.formCard}>
          <Text style={{ fontSize: 15, fontWeight: "800", color: "#0F172A", marginBottom: 4 }}>
            Phạm vi áp dụng
          </Text>

          <Field icon="map-marker-radius-outline" label="Khu vực (Miền)">
            <Pressable
              style={styles.input}
              onPress={() => setRegionSelectVisible(true)}
            >
              <Text style={{ fontSize: 14, color: "#0F172A" }}>
                {regionOptions.find((r) => r.id === selectedRegionId)?.label || "Tất cả các Miền"}
              </Text>
            </Pressable>
          </Field>

          <Field icon="office-building-outline" label="Chi nhánh">
            <Pressable
              style={styles.input}
              onPress={() => setBranchSelectVisible(true)}
            >
              <Text style={{ fontSize: 14, color: "#0F172A" }}>
                {branchOptions.find((b) => b.id === selectedBranchId)?.label || "Tất cả Chi nhánh"}
              </Text>
            </Pressable>
          </Field>

          <Field icon="domain" label="Phòng ban">
            <Pressable
              style={styles.input}
              onPress={() => setDeptSelectVisible(true)}
            >
              <Text style={{ fontSize: 14, color: "#0F172A" }}>
                {departmentOptions.find((d) => d.id === selectedDepartmentId)?.label || "Tất cả Phòng ban"}
              </Text>
            </Pressable>
          </Field>

          <Field icon="account-multiple-outline" label="Nhân viên (*)">
            <Pressable
              style={styles.input}
              onPress={() => setEmployeeSelectVisible(true)}
            >
              <Text
                style={{
                  color: userIds.length > 0 ? "#0F172A" : "#94A3B8",
                  fontSize: 14,
                  fontWeight: userIds.length > 0 ? "600" : "400",
                }}
              >
                {userIds.length > 0
                  ? `${userIds.length} nhân viên đã chọn`
                  : "Chọn nhân viên áp dụng"}
              </Text>
            </Pressable>
          </Field>
        </View>

        {/* Section: Thông tin hợp đồng */}
        <View style={styles.formCard}>
          <Text style={{ fontSize: 15, fontWeight: "800", color: "#0F172A", marginBottom: 4 }}>
            Thông tin hợp đồng
          </Text>

          <Field icon="format-title" label="Tiêu đề hợp đồng (*)">
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="VD: Hợp đồng thử việc - Nguyễn Văn A"
              placeholderTextColor="#94A3B8"
            />
          </Field>

          <Field icon="calendar-range" label="Ngày bắt đầu (*)">
            <Pressable
              style={styles.input}
              onPress={() => setDatePickerState("start")}
            >
              <Text style={{ fontSize: 14, color: "#0F172A" }}>{formatDate(startDate)}</Text>
            </Pressable>
          </Field>

          <Field icon="calendar-end" label="Ngày kết thúc">
            {contractType !== "INDEFINITE_TERM" ? (
              <Pressable
                style={styles.input}
                onPress={() => setDatePickerState("end")}
              >
                <Text style={{ color: endDate ? "#0F172A" : "#94A3B8", fontSize: 14 }}>
                  {endDate ? formatDate(endDate) : "Chọn ngày kết thúc"}
                </Text>
              </Pressable>
            ) : (
              <View style={[styles.input, { opacity: 0.6 }]}>
                <Text style={{ color: "#64748B", fontSize: 14 }}>Vô thời hạn (Không có ngày kết thúc)</Text>
              </View>
            )}
          </Field>

          <View style={{ marginTop: 8 }}>
            <Pressable
              onPress={submit}
              disabled={createContractMutation.isPending}
              style={({ pressed }) => [
                {
                  height: 48,
                  borderRadius: 12,
                  backgroundColor: "#1E3E2F",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "row",
                  gap: 8,
                },
                pressed && { opacity: 0.85 },
                createContractMutation.isPending && { opacity: 0.6 },
              ]}
            >
              <MaterialCommunityIcons name="check-circle-outline" size={20} color="#FFFFFF" />
              <Text style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "700" }}>
                {createContractMutation.isPending ? "Đang tạo..." : "Tạo hợp đồng"}
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <SelectModal
        visible={isRegionSelectVisible}
        title="Chọn Miền / Khu vực"
        options={regionOptions}
        selectedValue={selectedRegionId}
        onSelect={(opt) => {
          handleSelectRegion(opt.id || "ALL");
          setRegionSelectVisible(false);
        }}
        onClose={() => setRegionSelectVisible(false)}
      />

      <SelectModal
        visible={isBranchSelectVisible}
        title="Chọn Chi nhánh"
        options={branchOptions}
        selectedValue={selectedBranchId}
        onSelect={(opt) => {
          handleSelectBranch(opt.id || "ALL");
          setBranchSelectVisible(false);
        }}
        onClose={() => setBranchSelectVisible(false)}
      />

      <SelectModal
        visible={isDeptSelectVisible}
        title="Chọn Phòng ban"
        options={departmentOptions}
        selectedValue={selectedDepartmentId}
        onSelect={(opt) => {
          setSelectedDepartmentId(opt.id || "ALL");
          setDeptSelectVisible(false);
        }}
        onClose={() => setDeptSelectVisible(false)}
      />

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
          datePickerState === "start" && startDate
            ? new Date(startDate)
            : datePickerState === "end" && endDate
              ? new Date(endDate)
              : new Date()
        }
        onSelect={(date) => {
          const iso = date.toISOString();
          if (datePickerState === "start") {
            setStartDate(iso);
          } else {
            setEndDate(iso);
          }
          setDatePickerState(null);
        }}
      />

      <Modal
        animationType="fade"
        transparent
        visible={successModalInfo.visible}
        onRequestClose={() => {
          setSuccessModalInfo({ visible: false, count: 0 });
          router.replace(`${roleBase(user)}/contracts` as any);
        }}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.successModalCard}>
            <View style={styles.successIconCircle}>
              <MaterialCommunityIcons name="check-circle" size={44} color="#10B981" />
            </View>
            <Text style={styles.successModalTitle}>Tạo hợp đồng thành công!</Text>
            <Text style={styles.successModalMessage}>
              {`Đã tạo thành công ${successModalInfo.count} hợp đồng cho nhân viên đã chọn.\nBạn có thể kiểm tra danh sách hợp đồng ngay bây giờ.`}
            </Text>

            <View style={styles.successModalActions}>
              <PrimaryButton
                style={{ width: "100%", marginBottom: 10 }}
                onPress={() => {
                  setSuccessModalInfo({ visible: false, count: 0 });
                  router.replace(`${roleBase(user)}/contracts` as any);
                }}
              >
                Xem danh sách hợp đồng
              </PrimaryButton>

              <SecondaryButton
                style={{ width: "100%" }}
                onPress={() => {
                  setSuccessModalInfo({ visible: false, count: 0 });
                  setUserIds([]);
                }}
              >
                Tiếp tục tạo mới
              </SecondaryButton>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Field({
  icon,
  label,
  children,
}: {
  icon: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.fieldGroup}>
      <View style={styles.fieldLabelContainer}>
        <MaterialCommunityIcons
          name={icon as any}
          size={18}
          color={colors.primary}
        />
        <Text style={styles.fieldLabel}>{label}</Text>
      </View>
      {children}
    </View>
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  successModalCard: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  successIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#ECFDF5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  successModalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
    marginBottom: 8,
  },
  successModalMessage: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.muted,
    textAlign: "center",
    marginBottom: 20,
  },
  successModalActions: {
    width: "100%",
  },
  fieldGroup: {
    gap: 8,
    marginBottom: 20,
  },
  fieldLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
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
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111827",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 4,
  },
  addBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  scanBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: "#D1FAE5",
  },
  scanBtnText: {
    color: "#059669",
    fontWeight: "700",
    fontSize: 14,
  },
  templateChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 6,
  },
  templateChipSelected: {
    backgroundColor: "#EEF2FF",
    borderColor: colors.primary,
  },
  templateChipText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: "500",
  },
  templateChipTextSelected: {
    color: colors.primary,
    fontWeight: "700",
  },
  // Template card
  templateCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  templateHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  templateIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  templateCode: {
    fontSize: 13,
    color: colors.muted,
    marginTop: 2,
  },
  templateMeta: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 6,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: colors.muted,
  },
  templateDesc: {
    fontSize: 13,
    color: "#64748B",
    lineHeight: 18,
  },
  templateActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  templateActionBtnSecondary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: "#F0F9FF",
  },
  templateActionTextSecondary: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.primary,
  },
  templateActionBtnPrimary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  templateActionTextPrimary: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
  },

  // Contract card
  contractCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  contractHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 10,
  },
  contractAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
  },
  contractAvatarText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2563EB",
  },
  contractMainInfo: {
    flex: 1,
  },
  contractTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },
  contractEmpName: {
    fontSize: 13,
    color: colors.muted,
    marginTop: 1,
  },
  contractDetails: {
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    padding: 10,
    gap: 6,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    color: "#475569",
    fontWeight: "500",
  },

  // Detail screen
  detailCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  detailCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  detailCardTitle: {
    fontSize: 17,
    fontWeight: "800",
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
    flexDirection: "row",
    alignItems: "center",
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
    fontWeight: "600",
    flex: 1,
  },

  // Signatures
  signaturesCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: spacing.lg,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  signatureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F8FAFC",
  },
  signatureName: {
    fontSize: 14,
    fontWeight: "600",
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
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: spacing.lg,
    gap: spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  input: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  templatePicker: {
    flexDirection: "row",
  },
  templateOption: {
    backgroundColor: "#F8FAFC",
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
    fontWeight: "600",
    color: colors.muted,
  },
  templateOptionTextSelected: {
    color: colors.primary,
  },
});

const cStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F8FAFC',
  },
  backBtn: {
    padding: 4,
    marginLeft: -4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E3E2F',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  topRightBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  topRightPlaceholder: {
    width: 40,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 4,
    marginBottom: 14,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  screenSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  templateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.2,
    borderColor: '#1E3E2F',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: '#FFFFFF',
  },
  templateBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E3E2F',
  },
  searchFilterContainer: {
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    paddingVertical: 0,
  },
  statusDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 46,
  },
  statusDropdownText: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '500',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  contractCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#D9E4DD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E3E2F',
  },
  cardTopInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  cardEmpName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  cardContractTitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 1,
  },
  cardContractCode: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 1,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  cardMeta: {
    gap: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#0F172A',
    marginLeft: 8,
  },
  dateRangeContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  dateSubLabel: {
    fontSize: 11,
    color: '#94A3B8',
  },
  dateMainText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 1,
  },
  dateVerticalDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 24,
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardDetailLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardDetailLinkText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E3E2F',
  },
  cardMoreBtn: {
    padding: 4,
  },
  counterFooter: {
    textAlign: 'center',
    fontSize: 13,
    color: '#94A3B8',
    marginVertical: 16,
  },

  // Detail Screen Styles
  detailScrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  detailScreenTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 4,
    marginBottom: 16,
  },
  detailSectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  infoRowLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  infoRowValue: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '600',
  },
  rowDivider: {
    height: 1,
    backgroundColor: '#F8FAFC',
    marginVertical: 10,
  },
  signatureRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  signatureSignerName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  signatureMetaText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  signatureDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#E2E8F0',
    marginRight: 16,
  },
  viewSigBtn: {
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  viewSigBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E3E2F',
  },
  fileCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pdfBadgeContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  pdfBadgeText: {
    color: '#DC2626',
    fontSize: 11,
    fontWeight: '900',
  },
  fileNameTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  fileFormatSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  openPdfLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  openPdfLinkText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E3E2F',
  },
  deleteContractRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    marginTop: 8,
    marginBottom: 8,
  },
  deleteContractText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
  },
  bottomStickyBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 24,
  },
  bottomBarHint: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 8,
  },
  companySignBtn: {
    backgroundColor: '#1E3E2F',
    borderRadius: 12,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  companySignBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  // Action Sheet Styles
  actionSheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  actionSheetContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 34,
  },
  actionSheetHeader: {
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 8,
  },
  actionSheetTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  actionSheetSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  actionSheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  actionSheetItemText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  actionSheetCancelBtn: {
    marginTop: 14,
    paddingVertical: 14,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionSheetCancelText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#64748B',
  },
});

// ── Leader Contract List Screen ──

export function LeaderContractListScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const departmentId = user?.department?.id;
  const { data: contracts, refetch, isRefetching } = useContracts(departmentId);
  const [activeTab, setActiveTab] = useState<"MY_CONTRACTS" | "TEAM_CONTRACTS">(
    "MY_CONTRACTS",
  );
  const [filter, setFilter] = useState<"ALL" | "ACTIVE" | "EXPIRING">("ALL");

  const filteredContracts =
    contracts?.filter((c) => {
      // 1. Filter by Tab
      if (activeTab === "MY_CONTRACTS" && c.userId !== user?.id) return false;
      if (activeTab === "TEAM_CONTRACTS" && c.userId === user?.id) return false;

      // 2. Filter by Status
      if (filter === "ACTIVE" && c.status !== "ACTIVE") return false;
      if (filter === "EXPIRING") {
        if (!c.endDate || c.status !== "ACTIVE") return false;
        const d = new Date(c.endDate);
        const diff = Math.ceil(
          (d.getTime() - new Date().getTime()) / (1000 * 3600 * 24),
        );
        if (diff < 0 || diff > 30) return false;
      }
      return true;
    }) || [];

  return (
    <Screen>
      <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.xs }}>
        <PageHeader title="Quản lý hợp đồng" />
      </View>

      <View
        style={{
          flexDirection: "row",
          backgroundColor: "#F1F5F9",
          marginHorizontal: spacing.md,
          marginTop: spacing.sm,
          borderRadius: 8,
          padding: 4,
        }}
      >
        <Pressable
          style={[
            {
              flex: 1,
              paddingVertical: 8,
              alignItems: "center",
              borderRadius: 6,
            },
            activeTab === "MY_CONTRACTS" && {
              backgroundColor: colors.surface,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
              elevation: 2,
            },
          ]}
          onPress={() => setActiveTab("MY_CONTRACTS")}
        >
          <Text
            style={[
              { fontSize: 14, fontWeight: "500", color: colors.muted },
              activeTab === "MY_CONTRACTS" && {
                color: colors.text,
                fontWeight: "600",
              },
            ]}
          >
            Của tôi
          </Text>
        </Pressable>
        <Pressable
          style={[
            {
              flex: 1,
              paddingVertical: 8,
              alignItems: "center",
              borderRadius: 6,
            },
            activeTab === "TEAM_CONTRACTS" && {
              backgroundColor: colors.surface,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
              elevation: 2,
            },
          ]}
          onPress={() => setActiveTab("TEAM_CONTRACTS")}
        >
          <Text
            style={[
              { fontSize: 14, fontWeight: "500", color: colors.muted },
              activeTab === "TEAM_CONTRACTS" && {
                color: colors.text,
                fontWeight: "600",
              },
            ]}
          >
            Nhân sự
          </Text>
        </Pressable>
      </View>

      <View style={{ marginTop: spacing.md, marginBottom: spacing.sm }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: spacing.md,
            gap: spacing.sm,
          }}
        >
          <Pressable
            style={[
              {
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: "#F1F5F9",
                borderWidth: 1,
                borderColor: "#E2E8F0",
              },
              filter === "ALL" && {
                backgroundColor: "#EFF6FF",
                borderColor: colors.primary,
              },
            ]}
            onPress={() => setFilter("ALL")}
          >
            <Text
              style={[
                { fontSize: 13, color: colors.muted, fontWeight: "500" },
                filter === "ALL" && {
                  color: colors.primary,
                  fontWeight: "600",
                },
              ]}
            >
              Tất cả
            </Text>
          </Pressable>
          <Pressable
            style={[
              {
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: "#F1F5F9",
                borderWidth: 1,
                borderColor: "#E2E8F0",
              },
              filter === "ACTIVE" && {
                backgroundColor: "#EFF6FF",
                borderColor: colors.primary,
              },
            ]}
            onPress={() => setFilter("ACTIVE")}
          >
            <Text
              style={[
                { fontSize: 13, color: colors.muted, fontWeight: "500" },
                filter === "ACTIVE" && {
                  color: colors.primary,
                  fontWeight: "600",
                },
              ]}
            >
              Đang hiệu lực
            </Text>
          </Pressable>
          <Pressable
            style={[
              {
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: "#F1F5F9",
                borderWidth: 1,
                borderColor: "#E2E8F0",
              },
              filter === "EXPIRING" && {
                backgroundColor: "#EFF6FF",
                borderColor: colors.primary,
              },
            ]}
            onPress={() => setFilter("EXPIRING")}
          >
            <Text
              style={[
                { fontSize: 13, color: colors.muted, fontWeight: "500" },
                filter === "EXPIRING" && {
                  color: colors.primary,
                  fontWeight: "600",
                },
              ]}
            >
              Sắp hết hạn
            </Text>
          </Pressable>
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => void refetch()}
          />
        }
      >
        {filteredContracts.length === 0 ? (
          <EmptyState title="Không có hợp đồng nào" />
        ) : (
          filteredContracts.map((contract: any) => {
            const empName =
              contract.user?.profile?.fullName ??
              contract.user?.userCode ??
              "-";
            const initials = getInitials(empName);

            let statusLabel =
              CONTRACT_STATUS_LABELS[contract.status as ContractStatus] ??
              contract.status;
            let statusTone = getStatusTone(contract.status as ContractStatus);

            if (contract.status === "ACTIVE" && contract.endDate) {
              const d = new Date(contract.endDate);
              const diff = Math.ceil(
                (d.getTime() - new Date().getTime()) / (1000 * 3600 * 24),
              );
              if (diff >= 0 && diff <= 30) {
                statusLabel = "Sắp hết hạn";
                statusTone = "warning";
              }
            }

            return (
              <Pressable
                key={contract.id}
                style={styles.contractCard}
                onPress={() => router.push(`/leader/contracts/${contract.id}`)}
              >
                <View style={styles.contractHeader}>
                  {activeTab === "TEAM_CONTRACTS" ? (
                    <View style={styles.contractAvatar}>
                      <Text style={styles.contractAvatarText}>{initials}</Text>
                    </View>
                  ) : (
                    <View style={styles.templateIcon}>
                      <MaterialCommunityIcons
                        name="file-document-outline"
                        size={24}
                        color={colors.primary}
                      />
                    </View>
                  )}
                  <View style={styles.contractMainInfo}>
                    <Text style={styles.contractTitle}>{contract.title}</Text>
                    {activeTab === "TEAM_CONTRACTS" && (
                      <Text style={styles.contractEmpName}>{empName}</Text>
                    )}
                  </View>
                  <StatusBadge label={statusLabel} tone={statusTone} />
                </View>

                <View style={styles.contractDetails}>
                  <View style={styles.detailItem}>
                    <MaterialCommunityIcons
                      name="identifier"
                      size={14}
                      color={colors.muted}
                    />
                    <Text style={styles.detailText}>
                      {contract.contractCode}
                    </Text>
                  </View>
                  <View style={styles.detailItem}>
                    <MaterialCommunityIcons
                      name="tag-outline"
                      size={14}
                      color={colors.muted}
                    />
                    <Text style={styles.detailText}>
                      {CONTRACT_TYPE_LABELS[
                        contract.contractType as ContractType
                      ] ?? contract.contractType}
                    </Text>
                  </View>
                  <View style={styles.detailItem}>
                    <MaterialCommunityIcons
                      name="calendar-range"
                      size={14}
                      color={colors.muted}
                    />
                    <Text style={styles.detailText}>
                      {formatDate(contract.startDate)} →{" "}
                      {formatDate(contract.endDate)}
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

// ── HR Contract List Screen (Combined) ──

export function HRContractListScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<
    "MY_CONTRACTS" | "MANAGED_CONTRACTS"
  >("MY_CONTRACTS");

  const [filterType, setFilterType] = useState<string>("ALL");
  const myContracts = useMyContracts();
  const managedContracts = useContracts({ page: 1, limit: 50 });
  const deleteContract = useDeleteContract();
  const { showAlert, showConfirm } = useAppAlert();

  const myContractItems = Array.isArray(myContracts.data)
    ? myContracts.data
    : [];
  const managedContractItems = Array.isArray(managedContracts.data)
    ? managedContracts.data
    : [];

  return (
    <Screen>
      <View style={{ flex: 1 }}>
        <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
          <PageHeader
            title="Hợp đồng"
            subtitle="Quản lý và cá nhân"
            right={
              <View style={styles.headerActions}>
                <Pressable
                  style={styles.headerBtn}
                  onPress={() =>
                    router.push(`${roleBase(user)}/contracts/templates` as any)
                  }
                >
                  <MaterialCommunityIcons
                    name="file-cog-outline"
                    size={18}
                    color="#111827"
                  />
                  <Text style={styles.headerBtnText}>Mẫu HĐ</Text>
                </Pressable>
              </View>
            }
          />

          <View
            style={{
              flexDirection: "row",
              backgroundColor: "#F3F4F6",
              padding: 4,
              borderRadius: 12,
              marginHorizontal: 0,
              marginBottom: 16,
            }}
          >
            <Pressable
              onPress={() => setActiveTab("MY_CONTRACTS")}
              style={[
                {
                  flex: 1,
                  paddingVertical: 10,
                  alignItems: "center",
                  borderRadius: 8,
                },
                activeTab === "MY_CONTRACTS" && {
                  backgroundColor: "#FFFFFF",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 2,
                  elevation: 2,
                },
              ]}
            >
              <Text
                style={[
                  { fontSize: 14, fontWeight: "600", color: "#6B7280" },
                  activeTab === "MY_CONTRACTS" && { color: "#111827" },
                ]}
              >
                Của tôi
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setActiveTab("MANAGED_CONTRACTS")}
              style={[
                {
                  flex: 1,
                  paddingVertical: 10,
                  alignItems: "center",
                  borderRadius: 8,
                },
                activeTab === "MANAGED_CONTRACTS" && {
                  backgroundColor: "#FFFFFF",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 2,
                  elevation: 2,
                },
              ]}
            >
              <Text
                style={[
                  { fontSize: 14, fontWeight: "600", color: "#6B7280" },
                  activeTab === "MANAGED_CONTRACTS" && { color: "#111827" },
                ]}
              >
                Tôi giao
              </Text>
            </Pressable>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl
              refreshing={
                activeTab === "MY_CONTRACTS"
                  ? myContracts.isRefetching
                  : managedContracts.isRefetching
              }
              onRefresh={() =>
                activeTab === "MY_CONTRACTS"
                  ? myContracts.refetch()
                  : managedContracts.refetch()
              }
            />
          }
        >
          <View style={{ gap: 16 }}>
            {activeTab === "MY_CONTRACTS" ? (
              myContractItems.length > 0 ? (
                myContractItems.map((contract: any) => {
                  return (
                    <Pressable
                      key={contract.id}
                      style={styles.contractCard}
                      onPress={() =>
                        router.push(
                          `${roleBase(user)}/contracts/${contract.id}` as any,
                        )
                      }
                    >
                      <View style={styles.contractHeader}>
                        <View style={styles.contractAvatar}>
                          <Text style={styles.contractAvatarText}>HĐ</Text>
                        </View>
                        <View style={styles.contractMainInfo}>
                          <Text style={styles.contractTitle}>
                            {contract.title}
                          </Text>
                          <Text style={styles.contractEmpName}>
                            {contract.contractCode}
                          </Text>
                        </View>
                        <StatusBadge
                          label={
                            CONTRACT_STATUS_LABELS[
                              contract.status as ContractStatus
                            ] ?? contract.status
                          }
                          tone={getStatusTone(contract.status)}
                        />
                      </View>

                      <View style={styles.contractDetails}>
                        <View style={styles.detailItem}>
                          <MaterialCommunityIcons
                            name="tag-outline"
                            size={14}
                            color={colors.muted}
                          />
                          <Text style={styles.detailText}>
                            {CONTRACT_TYPE_LABELS[
                              contract.contractType as ContractType
                            ] ?? contract.contractType}
                          </Text>
                        </View>
                        <View style={styles.detailItem}>
                          <MaterialCommunityIcons
                            name="calendar-range"
                            size={14}
                            color={colors.muted}
                          />
                          <Text style={styles.detailText}>
                            {formatDate(contract.startDate)} →{" "}
                            {formatDate(contract.endDate)}
                          </Text>
                        </View>
                      </View>
                    </Pressable>
                  );
                })
              ) : !myContracts.isLoading ? (
                <EmptyState
                  title="Chưa có hợp đồng"
                  message="Bạn hiện chưa có hợp đồng lao động nào."
                />
              ) : null
            ) : managedContractItems.length > 0 ? (
              managedContractItems.map((contract: any) => {
                const empName =
                  contract.user?.profile?.fullName ??
                  contract.user?.userCode ??
                  "-";
                const initials = getInitials(empName);

                return (
                  <Pressable
                    key={contract.id}
                    style={styles.contractCard}
                    onPress={() =>
                      router.push(
                        `${roleBase(user)}/contracts/${contract.id}` as any,
                      )
                    }
                  >
                    <View style={styles.contractHeader}>
                      <View style={styles.contractAvatar}>
                        <Text style={styles.contractAvatarText}>
                          {initials}
                        </Text>
                      </View>
                      <View style={styles.contractMainInfo}>
                        <Text style={styles.contractTitle}>
                          {contract.title}
                        </Text>
                        <Text style={styles.contractEmpName}>{empName}</Text>
                      </View>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <StatusBadge
                          label={
                            CONTRACT_STATUS_LABELS[
                              contract.status as ContractStatus
                            ] ?? contract.status
                          }
                          tone={getStatusTone(contract.status)}
                        />
                        {(contract.status === "WAITING_EMPLOYEE_SIGNATURE" ||
                          contract.status === "DRAFT" ||
                          (contract.status === "WAITING_COMPANY_SIGNATURE" && user?.roles?.includes("ADMIN"))) && (
                          <Pressable
                            onPress={(e) => {
                              e.stopPropagation();
                              showConfirm({
                                title: "Xác nhận xóa",
                                message: "Bạn có chắc chắn muốn xóa hợp đồng này không?",
                                confirmLabel: "Xóa",
                                confirmTone: "danger",
                                onConfirm: () => {
                                  deleteContract.mutate(contract.id, {
                                    onSuccess: () => {
                                      showAlert(
                                        "Thành công",
                                        "Đã xóa hợp đồng",
                                      );
                                      managedContracts.refetch();
                                    },
                                  });
                                },
                              });
                            }}
                            style={{ padding: 4 }}
                          >
                            <MaterialCommunityIcons
                              name="trash-can-outline"
                              size={20}
                              color="#ef4444"
                            />
                          </Pressable>
                        )}
                      </View>
                    </View>

                    <View style={styles.contractDetails}>
                      <View style={styles.detailItem}>
                        <MaterialCommunityIcons
                          name="tag-outline"
                          size={14}
                          color={colors.muted}
                        />
                        <Text style={styles.detailText}>
                          {CONTRACT_TYPE_LABELS[
                            contract.contractType as ContractType
                          ] ?? contract.contractType}
                        </Text>
                      </View>
                      <View style={styles.detailItem}>
                        <MaterialCommunityIcons
                          name="calendar-range"
                          size={14}
                          color={colors.muted}
                        />
                        <Text style={styles.detailText}>
                          {formatDate(contract.startDate)} →{" "}
                          {formatDate(contract.endDate)}
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                );
              })
            ) : !managedContracts.isLoading ? (
              <EmptyState title="Chưa có hợp đồng nào" />
            ) : null}
          </View>
        </ScrollView>
      </View>
    </Screen>
  );
}
