import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen } from '../../components/Screen';
import { PageHeader } from '../../components/PageHeader';
import { EmptyState } from '../../components/EmptyState';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

type TabMode = 'ASSIGNEE' | 'ASSIGNER';

export function LeaderTasksScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabMode>('ASSIGNEE');

  return (
    <Screen>
      <PageHeader title="Công việc" subtitle={activeTab === 'ASSIGNEE' ? "Nhiệm vụ bạn cần thực hiện" : "Nhiệm vụ bạn đã giao"} />
      
      {/* Top Tabs */}
      <View style={styles.tabContainer}>
        <Pressable 
          style={[styles.tabButton, activeTab === 'ASSIGNEE' && styles.tabButtonActive]}
          onPress={() => setActiveTab('ASSIGNEE')}
        >
          <MaterialCommunityIcons 
            name="account-hard-hat" 
            size={20} 
            color={activeTab === 'ASSIGNEE' ? colors.primary : colors.muted} 
          />
          <Text style={[styles.tabText, activeTab === 'ASSIGNEE' && styles.tabTextActive]}>
            Việc của tôi
          </Text>
        </Pressable>
        <Pressable 
          style={[styles.tabButton, activeTab === 'ASSIGNER' && styles.tabButtonActive]}
          onPress={() => setActiveTab('ASSIGNER')}
        >
          <MaterialCommunityIcons 
            name="account-group" 
            size={20} 
            color={activeTab === 'ASSIGNER' ? colors.primary : colors.muted} 
          />
          <Text style={[styles.tabText, activeTab === 'ASSIGNER' && styles.tabTextActive]}>
            Việc tôi giao
          </Text>
        </Pressable>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {activeTab === 'ASSIGNEE' ? (
          <AssigneeView />
        ) : (
          <AssignerView />
        )}
      </View>
    </Screen>
  );
}

function AssigneeView() {
  return (
    <ScrollView contentContainerStyle={styles.listContainer}>
      {/* Dummy data for Assignee view */}
      <EmptyState title="Bạn chưa có nhiệm vụ nào" description="Khi cấp trên giao việc, công việc sẽ hiển thị tại đây" />
    </ScrollView>
  );
}

function AssignerView() {
  return (
    <ScrollView contentContainerStyle={styles.listContainer}>
      <View style={styles.actionRow}>
        <Pressable style={styles.createBtn}>
          <MaterialCommunityIcons name="plus" size={20} color="#fff" />
          <Text style={styles.createBtnText}>Giao việc mới</Text>
        </Pressable>
      </View>
      <EmptyState title="Chưa có nhiệm vụ nào được giao" description="Bấm Giao việc mới để bắt đầu phân công cho nhóm" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.muted,
  },
  tabTextActive: {
    color: colors.primary,
  },
  content: {
    flex: 1,
  },
  listContainer: {
    padding: spacing.md,
    flexGrow: 1,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: spacing.md,
  },
  createBtn: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    gap: 4,
  },
  createBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  }
});
