import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SecondaryButton } from '../../components/Buttons';
import { Screen } from '../../components/Screen';
import { useAuth } from '../../providers/AuthProvider';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { hasAnyPermission, hasPermission } from '../../utils/permissions';

export function WarehouseManagerHomeScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerInfo}>
            <Text style={styles.kicker}>{user?.fullName ?? user?.phone ?? 'Warehouse manager'}</Text>
            <Text style={styles.title}>Warehouse Manager</Text>
            <Text style={styles.meta}>Actions are shown from backend permissions only.</Text>
          </View>
          <SecondaryButton onPress={() => void logout()}>Logout</SecondaryButton>
        </View>

        <View style={styles.grid}>
          {hasAnyPermission(user, ['warehouse.read', 'warehouse.manage', 'stock.read']) ? (
            <SecondaryButton onPress={() => router.push('/warehouse-manager/warehouses' as never)}>Warehouses</SecondaryButton>
          ) : null}
          {hasPermission(user, 'material.read') ? (
            <SecondaryButton onPress={() => router.push('/warehouse-manager/materials' as never)}>Materials</SecondaryButton>
          ) : null}
          {hasPermission(user, 'material.read') ? (
            <SecondaryButton onPress={() => router.push('/warehouse-manager/material-categories' as never)}>Material categories</SecondaryButton>
          ) : null}
          {hasPermission(user, 'stock.read') ? (
            <SecondaryButton onPress={() => router.push('/warehouse-manager/stock-receipts' as never)}>Stock receipts</SecondaryButton>
          ) : null}
          {hasPermission(user, 'material_issue.read') ? (
            <SecondaryButton onPress={() => router.push('/warehouse-manager/material-issues' as never)}>Material issues</SecondaryButton>
          ) : null}
          {hasPermission(user, 'stock.read') ? (
            <SecondaryButton onPress={() => router.push('/warehouse-manager/stock-transfers' as never)}>Stock transfers</SecondaryButton>
          ) : null}
          {hasPermission(user, 'inventory_check.read') ? (
            <SecondaryButton onPress={() => router.push('/warehouse-manager/inventory-checks' as never)}>Inventory checks</SecondaryButton>
          ) : null}
          {hasPermission(user, 'asset.read') ? (
            <SecondaryButton onPress={() => router.push('/warehouse-manager/assets' as never)}>Assets</SecondaryButton>
          ) : null}
          {hasPermission(user, 'asset.incident.read') ? (
            <SecondaryButton onPress={() => router.push('/warehouse-manager/asset-incidents' as never)}>Asset incidents</SecondaryButton>
          ) : null}
          {hasPermission(user, 'notification.read') ? (
            <SecondaryButton onPress={() => router.push('/warehouse-manager/notifications' as never)}>Notifications</SecondaryButton>
          ) : null}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    padding: spacing.lg,
  },
  grid: {
    gap: spacing.md,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  headerInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  kicker: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
  },
  meta: {
    color: colors.muted,
    fontSize: 13,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
  },
});
