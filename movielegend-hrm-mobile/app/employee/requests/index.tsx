import { useState } from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen } from '../../../src/components/Screen';
import { colors } from '../../../src/theme/colors';
import { spacing } from '../../../src/theme/spacing';

export default function RequestsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable onPress={() => router.back()} style={styles.iconBtn}>
            <MaterialCommunityIcons name="chevron-left" size={28} color={colors.text} />
          </Pressable>
          <View>
            <Text style={styles.title}>Quản lý yêu cầu</Text>
            <View style={styles.dateSelector}>
              <Text style={styles.dateText}>08.06 - 08.07</Text>
              <MaterialCommunityIcons name="menu-down" size={20} color={colors.muted} />
            </View>
          </View>
        </View>
        <View style={styles.headerRight}>
          <Pressable style={styles.iconBtn}>
            <MaterialCommunityIcons name="tune-vertical" size={24} color={colors.text} />
          </Pressable>
          <Pressable style={styles.iconBtn}>
            <MaterialCommunityIcons name="format-list-bulleted" size={24} color={colors.text} />
          </Pressable>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <Pressable 
          style={[styles.tab, activeTab === 'pending' && styles.tabActive]} 
          onPress={() => setActiveTab('pending')}
        >
          <Text style={[styles.tabText, activeTab === 'pending' && styles.tabTextActive]}>Yêu cầu</Text>
          <View style={[styles.badge, activeTab === 'pending' && styles.badgeActive]}>
            <Text style={[styles.badgeText, activeTab === 'pending' && styles.badgeTextActive]}>0</Text>
          </View>
        </Pressable>
        <Pressable 
          style={[styles.tab, activeTab === 'approved' && styles.tabActive]} 
          onPress={() => setActiveTab('approved')}
        >
          <Text style={[styles.tabText, activeTab === 'approved' && styles.tabTextActive]}>Chấp thuận</Text>
          <View style={[styles.badge, activeTab === 'approved' && styles.badgeActive]}>
            <Text style={[styles.badgeText, activeTab === 'approved' && styles.badgeTextActive]}>0</Text>
          </View>
        </Pressable>
        <Pressable 
          style={[styles.tab, activeTab === 'rejected' && styles.tabActive]} 
          onPress={() => setActiveTab('rejected')}
        >
          <Text style={[styles.tabText, activeTab === 'rejected' && styles.tabTextActive]}>Từ chối</Text>
          <View style={styles.badgeDanger}>
            <Text style={styles.badgeTextDanger}>0</Text>
          </View>
        </Pressable>
      </View>

      {/* Empty State */}
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconBg}>
          <MaterialCommunityIcons name="file-document-edit-outline" size={64} color={colors.primary} />
        </View>
        <Text style={styles.emptyText}>Chưa có yêu cầu nào</Text>
      </View>

      {/* FAB */}
      <Pressable style={styles.fab} onPress={() => {}}>
        <MaterialCommunityIcons name="plus" size={32} color="#fff" />
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: spacing.md,
    backgroundColor: '#fff',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconBtn: {
    padding: spacing.xs,
    marginRight: spacing.sm,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  dateText: {
    fontSize: 14,
    color: colors.muted,
  },
  headerRight: {
    flexDirection: 'row',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginRight: spacing.lg,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.muted,
    marginRight: 6,
  },
  tabTextActive: {
    color: colors.primary,
  },
  badge: {
    backgroundColor: colors.background,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeActive: {
    backgroundColor: colors.primarySoft,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.muted,
  },
  badgeTextActive: {
    color: colors.primaryDark,
  },
  badgeDanger: {
    backgroundColor: colors.dangerSoft,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeTextDanger: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.danger,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0FDF4', // Very light green tint like the screenshot background
  },
  emptyIconBg: {
    marginBottom: spacing.lg,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#10B981', // Emerald 500
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  }
});
