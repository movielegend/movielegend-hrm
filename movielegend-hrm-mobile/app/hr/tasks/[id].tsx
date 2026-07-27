import { useLocalSearchParams } from 'expo-router';
import { TaskDetailScreen } from '../../../src/features/tasks/TaskScreens';

export default function HRTaskDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <TaskDetailScreen taskId={id} />;
}
