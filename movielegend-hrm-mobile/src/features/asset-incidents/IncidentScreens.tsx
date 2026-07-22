import { useState } from "react";
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { EmptyState } from "../../components/EmptyState";
import { ErrorState } from "../../components/ErrorState";
import { FilterChip } from "../../components/FilterChip";
import { LoadingState } from "../../components/LoadingState";
import { PageHeader } from "../../components/PageHeader";
import { PrimaryButton, SecondaryButton } from "../../components/Buttons";
import { Screen } from "../../components/Screen";
import { ScreenContainer } from "../../components/ScreenContainer";
import { SearchInput } from "../../components/SearchInput";
import { SelectModal } from "../../components/SelectModal";
import { SectionCard } from "../../components/SectionCard";
import { StatusBadge } from "../../components/StatusBadge";
import { useAssets, useUpdateIncidentStatus } from "../../hooks/useAssets";
import { useAuth } from "../../providers/AuthProvider";
import { colors } from "../../theme/colors";
import { spacing } from "../../theme/spacing";
import { formatDateTime } from "../../utils/date-time";
import { hasPermission } from "../../utils/permissions";

export type IncidentArea = "employee" | "leader" | "warehouse" | "admin";

const translateStatus = (status: string) => {
  switch (status) {
    case 'PENDING': return 'Chờ xử lý';
    case 'OK': return 'Tốt';
    case 'BROKEN': return 'Hỏng';
    case 'DAMAGED': return 'Đang hỏng';
    default: return status;
  }
};

export function IncidentListScreen({ area }: { area: IncidentArea }) {
  const { user } = useAuth();
  const canRead = hasPermission(user, "asset.incident.read");
  const [tab, setTab] = useState<"PENDING" | "APPROVE">("PENDING");
  const [search, setSearch] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  
  const assetsQuery = useAssets(canRead, tab);
  const updateStatus = useUpdateIncidentStatus();
  const router = useRouter();

  if (!canRead) {
    return (
      <Screen>
        <ScreenContainer>
          <PageHeader title="Sự cố tài sản" />
          <EmptyState title="Không có quyền truy cập" />
        </ScreenContainer>
      </Screen>
    );
  }

  const allItems = assetsQuery.data?.items ?? [];
  const items = allItems.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase()) || 
    item.assetCode.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Screen>
      <ScreenContainer refreshControl={<RefreshControl refreshing={assetsQuery.isRefetching} onRefresh={() => void assetsQuery.refetch()} />}>
        <PageHeader title="Sự cố tài sản" subtitle="Quản lý tài sản cần duyệt trạng thái" />
        
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <SearchInput value={search} onChangeText={setSearch} placeholder="Tìm kiếm tài sản..." />
          </View>
          <View style={{ zIndex: 10 }}>
            <Pressable style={styles.filterButton} onPress={() => setModalVisible(!modalVisible)}>
              <MaterialCommunityIcons name="filter-variant" size={24} color={colors.primary} />
              <Text style={styles.filterText} numberOfLines={1}>{tab === "PENDING" ? "Chờ xử lý" : "Đã xử lý"}</Text>
            </Pressable>
            {modalVisible && (
              <View style={styles.dropdown}>
                <Pressable style={[styles.dropdownItem, tab === "PENDING" && styles.dropdownItemActive]} onPress={() => { setTab("PENDING"); setModalVisible(false); }}>
                  <Text style={[styles.dropdownText, tab === "PENDING" && styles.dropdownTextActive]}>Chờ xử lý</Text>
                </Pressable>
                <Pressable style={[styles.dropdownItem, tab === "APPROVE" && styles.dropdownItemActive]} onPress={() => { setTab("APPROVE"); setModalVisible(false); }}>
                  <Text style={[styles.dropdownText, tab === "APPROVE" && styles.dropdownTextActive]}>Đã xử lý</Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>

        {assetsQuery.isLoading ? <LoadingState /> : null}
        {assetsQuery.isError ? <ErrorState error={assetsQuery.error} onRetry={() => void assetsQuery.refetch()} /> : null}
        
        {items.map((asset) => (
          <Pressable key={asset.id} onPress={() => router.push(`/${area}/asset-incidents/${asset.id}?tab=${tab}`)}>
            <SectionCard title={asset.name}>
              <Text style={styles.meta}>Mã: {asset.assetCode}</Text>
              <Text style={styles.meta}>Ngày giờ cập nhật: {formatDateTime(asset.updatedAt)}</Text>
              {asset.conditionNote ? <Text style={styles.body}>Ghi chú: {asset.conditionNote}</Text> : null}
              <StatusBadge label={translateStatus(asset.conditionStatus)} tone={asset.conditionStatus === "BROKEN" ? "danger" : asset.conditionStatus === "OK" ? "success" : "warning"} />
            </SectionCard>
          </Pressable>
        ))}
        {assetsQuery.data && !items.length ? <EmptyState title="Trống" message="Không có tài sản nào" /> : null}
      </ScreenContainer>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { color: colors.text, fontSize: 14, lineHeight: 20 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.md },
  headerRow: { 
    flexDirection: "row", 
    gap: spacing.sm, 
    marginBottom: spacing.md, 
    alignItems: "center",
    zIndex: 10,
    elevation: 10
  },
  filterButton: { 
    flexDirection: "row", 
    alignItems: "center", 
    backgroundColor: colors.surface, 
    borderWidth: 1, 
    borderColor: colors.border, 
    borderRadius: 8, 
    paddingHorizontal: spacing.sm, 
    height: 48,
    gap: 4,
    maxWidth: 120 
  },
  filterText: { color: colors.primary, fontSize: 14, fontWeight: "500", flexShrink: 1 },
  dropdown: {
    position: "absolute",
    top: 52,
    right: 0,
    width: 140,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 999,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dropdownItemActive: {
    backgroundColor: colors.primarySoft,
  },
  dropdownText: {
    fontSize: 14,
    color: colors.text,
  },
  dropdownTextActive: {
    color: colors.primary,
    fontWeight: "600",
  },
  meta: { color: colors.muted, fontSize: 13, lineHeight: 18 },
});
