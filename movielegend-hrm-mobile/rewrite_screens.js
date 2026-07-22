
const fs = require("fs");
const file = "src/features/asset-incidents/IncidentScreens.tsx";
const content = `import { useState } from "react";
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { EmptyState } from "../../components/EmptyState";
import { ErrorState } from "../../components/ErrorState";
import { FilterChip } from "../../components/FilterChip";
import { LoadingState } from "../../components/LoadingState";
import { PageHeader } from "../../components/PageHeader";
import { PrimaryButton, SecondaryButton } from "../../components/Buttons";
import { Screen } from "../../components/Screen";
import { ScreenContainer } from "../../components/ScreenContainer";
import { SectionCard } from "../../components/SectionCard";
import { StatusBadge } from "../../components/StatusBadge";
import { useAssets, useUpdateIncidentStatus } from "../../hooks/useAssets";
import { useAuth } from "../../providers/AuthProvider";
import { colors } from "../../theme/colors";
import { spacing } from "../../theme/spacing";
import { formatDateTime } from "../../utils/date-time";
import { hasPermission } from "../../utils/permissions";

export type IncidentArea = "employee" | "leader" | "warehouse" | "admin";

export function IncidentListScreen({ area }: { area: IncidentArea }) {
  const { user } = useAuth();
  const canRead = hasPermission(user, "asset.incident.read");
  const [tab, setTab] = useState<"PENDING" | "APPROVE">("PENDING");
  
  const assetsQuery = useAssets(canRead, tab);
  const updateStatus = useUpdateIncidentStatus();

  if (!canRead) {
    return (
      <Screen>
        <ScreenContainer>
          <PageHeader title="S? c? tài s?n" />
          <EmptyState title="Không có quy?n truy c?p" />
        </ScreenContainer>
      </Screen>
    );
  }

  const items = assetsQuery.data?.items ?? [];

  return (
    <Screen>
      <ScreenContainer refreshControl={<RefreshControl refreshing={assetsQuery.isRefetching} onRefresh={() => void assetsQuery.refetch()} />}>
        <PageHeader title="S? c? tài s?n" subtitle="Qu?n l? tài s?n c?n duy?t tr?ng thái" />
        
        <View style={styles.chipRow}>
          <FilterChip label="PD (Pending)" selected={tab === "PENDING"} onPress={() => setTab("PENDING")} />
          <FilterChip label="Approve (Ð? x? l?)" selected={tab === "APPROVE"} onPress={() => setTab("APPROVE")} />
        </View>

        {assetsQuery.isLoading ? <LoadingState /> : null}
        {assetsQuery.isError ? <ErrorState error={assetsQuery.error} onRetry={() => void assetsQuery.refetch()} /> : null}
        
        {items.map((asset) => (
          <SectionCard key={asset.id} title={asset.name}>
            <Text style={styles.meta}>M?: {asset.assetCode}</Text>
            <Text style={styles.meta}>Ngày gi? c?p nh?t: {formatDateTime(asset.updatedAt)}</Text>
            {asset.conditionNote ? <Text style={styles.body}>Ghi chú: {asset.conditionNote}</Text> : null}
            <StatusBadge label={asset.conditionStatus} tone={asset.conditionStatus === "BROKEN" ? "danger" : asset.conditionStatus === "OK" ? "success" : "warning"} />
            
            {tab === "PENDING" && (
              <View style={[styles.chipRow, { marginTop: 12 }]}>
                <SecondaryButton 
                  loading={updateStatus.isPending} 
                  onPress={() => updateStatus.mutate({ id: asset.id, status: "OK" })}
                >
                  Chýa h?ng (OK)
                </SecondaryButton>
                <PrimaryButton 
                  loading={updateStatus.isPending} 
                  onPress={() => updateStatus.mutate({ id: asset.id, status: "BROKEN" })}
                >
                  H?ng (BROKEN)
                </PrimaryButton>
              </View>
            )}
          </SectionCard>
        ))}
        {assetsQuery.data && !items.length ? <EmptyState title="Tr?ng" message="Không có tài s?n nào" /> : null}
      </ScreenContainer>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { color: colors.text, fontSize: 14, lineHeight: 20 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.md },
  meta: { color: colors.muted, fontSize: 13, lineHeight: 18 },
});
`;
fs.writeFileSync(file, content, "utf8");
console.log("Rewrote IncidentScreens.tsx");

