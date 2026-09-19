import { TaskDetailScreen, CreateTaskScreen } from '../../../src/features/tasks/TaskScreens';
import { useLocalSearchParams } from 'expo-router';

export default function LeaderTaskDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  if (id === 'create') {
    return <CreateTaskScreen area="leader" />;
  }
  return <TaskDetailScreen area="leader" />;
}
