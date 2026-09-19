import { TaskDetailScreen, CreateTaskScreen } from '../../../src/features/tasks/TaskScreens';
import { useLocalSearchParams } from 'expo-router';

export default function HRTaskDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  if (id === 'create') {
    return <CreateTaskScreen area="hr" />;
  }
  return <TaskDetailScreen area="hr" />;
}
