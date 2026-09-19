import { TaskDetailScreen, CreateTaskScreen } from '../../../src/features/tasks/TaskScreens';
import { useLocalSearchParams } from 'expo-router';

export default function AdminTaskDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  if (id === 'create') {
    return <CreateTaskScreen area="admin" />;
  }
  return <TaskDetailScreen area="admin" />;
}
