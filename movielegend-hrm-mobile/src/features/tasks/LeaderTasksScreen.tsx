import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen } from '../../components/Screen';
import { PageHeader } from '../../components/PageHeader';
import { EmptyState } from '../../components/EmptyState';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { useMyTasks, useTasks } from '../../hooks/useTasks';
import { TaskCard } from './TaskComponents';
import { useAuth } from '../../providers/AuthProvider';
import { RefreshControl } from 'react-native';

type TabMode = 'ASSIGNEE' | 'ASSIGNER';

export function LeaderTasksScreen() {
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
            color={activeTab === 'ASSIGNEE' ? '#111827' : colors.muted} 
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
            color={activeTab === 'ASSIGNER' ? '#111827' : colors.muted} 
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
  const router = useRouter();
  const { data: myTasks, isLoading, refetch } = useMyTasks();
  const tasks = myTasks?.items || [];

  return (
    <ScrollView 
      contentContainerStyle={styles.listContainer}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => void refetch()} />}
    >
      {tasks.length > 0 ? (
        tasks.map(task => (
          <TaskCard 
            key={task.id} 
            task={task as any} 
            onPress={() => router.push(`/leader/tasks/${task.id}`)} 
          />
        ))
      ) : (
        <EmptyState title="Bạn chưa có nhiệm vụ nào" message="Khi cấp trên giao việc, công việc sẽ hiển thị tại đây" />
      )}
    </ScrollView>
  );
}

function AssignerView() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: assignedTasks, isLoading, refetch } = useTasks({ createdById: user?.id });
  const tasks = assignedTasks?.items || [];

  return (
    <ScrollView 
      contentContainerStyle={styles.listContainer}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => void refetch()} />}
    >
      <View style={styles.actionRow}>
        <Pressable 
          style={styles.createBtn}
          onPress={() => router.push('/leader/tasks/create')}
        >
          <MaterialCommunityIcons name="plus" size={20} color="#fff" />
          <Text style={styles.createBtnText}>Giao việc mới</Text>
        </Pressable>
      </View>

      {tasks.length > 0 ? (
        tasks.map(task => (
          <TaskCard 
            key={task.id} 
            task={task as any} 
            onPress={() => router.push(`/leader/tasks/${task.id}`)} 
          />
        ))
      ) : (
        <EmptyState title="Chưa có nhiệm vụ nào được giao" message="Bấm Giao việc mới để bắt đầu phân công cho nhóm" />
      )}
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
    borderBottomColor: '#111827',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.muted,
  },
  tabTextActive: {
    color: '#111827',
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
    backgroundColor: '#111827',
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
