import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { PrimaryButton, SecondaryButton } from "../../components/Buttons";
import { ErrorState } from "../../components/ErrorState";
import { LoadingState } from "../../components/LoadingState";
import { PageHeader } from "../../components/PageHeader";
import { Screen } from "../../components/Screen";
import { ScreenContainer } from "../../components/ScreenContainer";
import { SectionCard } from "../../components/SectionCard";
import { StatusBadge } from "../../components/StatusBadge";
import { useAsset, useUpdateIncidentStatus } from "../../hooks/useAssets";
import { colors } from "../../theme/colors";
import { spacing } from "../../theme/spacing";
import { formatDateTime } from "../../utils/date-time";

const translateStatus = (status: string) => {
  switch (status) {
    case 'PENDING': return 'Chờ xử lý';
    case 'OK': return 'Tốt';
    case 'BROKEN': return 'Hỏng';
    case 'DAMAGED': return 'Đang hỏng';
    default: return status;
  }
};

export function IncidentDetailScreen({ id, area }: { id: string; area: string }) {
  const router = useRouter();
  const assetQuery = useAsset(id);
  const updateStatus = useUpdateIncidentStatus();
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const [note, setNote] = useState("");

  // Determine if it's pending either by the tab they came from (PENDING) 
  // or by the status if tab is missing.
  const isPending = tab === 'PENDING' || (!tab && (assetQuery.data?.conditionStatus === "PENDING" || assetQuery.data?.conditionStatus === "DAMAGED"));

  if (assetQuery.isLoading) {
    return (
      <Screen>
        <ScreenContainer>
          <PageHeader title="Chi tiết sự cố" onBack={() => router.back()} />
          <LoadingState />
        </ScreenContainer>
      </Screen>
    );
  }

  if (assetQuery.isError || !assetQuery.data) {
    return (
      <Screen>
        <ScreenContainer>
          <PageHeader title="Chi tiết sự cố" onBack={() => router.back()} />
          <ErrorState error={assetQuery.error} onRetry={() => void assetQuery.refetch()} />
        </ScreenContainer>
      </Screen>
    );
  }

  const asset = assetQuery.data;

  const handleUpdate = (status: 'OK' | 'BROKEN') => {
    updateStatus.mutate(
      { id, status, note: note.trim() || undefined },
      {
        onSuccess: () => {
          Alert.alert("Thành công", "Đã cập nhật trạng thái sự cố!");
          router.back();
        }
      }
    );
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <ScreenContainer>
          <PageHeader title="Chi tiết sự cố" onBack={() => router.back()} />
          
          <SectionCard title="Thông tin vật tư">
            <Text style={styles.meta}>Tên tài sản: {asset.name}</Text>
            <Text style={styles.meta}>Mã: {asset.assetCode}</Text>
            <Text style={styles.meta}>Nhãn hiệu: {asset.brand || 'Không có'}</Text>
            <Text style={styles.meta}>Model: {asset.model || 'Không có'}</Text>
            <Text style={styles.meta}>Ngày cập nhật: {formatDateTime(asset.updatedAt)}</Text>
            {asset.conditionNote ? <Text style={styles.body}>Ghi chú xử lý: {asset.conditionNote}</Text> : null}
            <View style={{ marginTop: 8, alignSelf: 'flex-start' }}>
              <StatusBadge label={translateStatus(asset.conditionStatus)} tone={asset.conditionStatus === "BROKEN" ? "danger" : asset.conditionStatus === "OK" ? "success" : "warning"} />
            </View>
          </SectionCard>

          {isPending && (
            <SectionCard title="Xử lý sự cố">
              <Text style={styles.label}>Ghi chú xử lý:</Text>
              <TextInput
                style={styles.input}
                multiline
                numberOfLines={4}
                placeholder="Nhập ghi chú xử lý (tùy chọn)..."
                value={note}
                onChangeText={setNote}
                textAlignVertical="top"
              />
            </SectionCard>
          )}

        </ScreenContainer>
      </ScrollView>

      {isPending && (
        <View style={styles.bottomBar}>
          <View style={styles.buttonContainer}>
            <SecondaryButton 
              loading={updateStatus.isPending} 
              onPress={() => handleUpdate("OK")}
            >
              Chưa hỏng
            </SecondaryButton>
          </View>
          <View style={styles.buttonContainer}>
            <PrimaryButton 
              loading={updateStatus.isPending} 
              onPress={() => handleUpdate("BROKEN")}
            >
              Hỏng
            </PrimaryButton>
          </View>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { color: colors.text, fontSize: 14, lineHeight: 20 },
  meta: { color: colors.muted, fontSize: 14, lineHeight: 22 },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 8, color: colors.text },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: "#fff",
    minHeight: 100,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    padding: spacing.md,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.md,
  },
  buttonContainer: {
    flex: 1,
  }
});
