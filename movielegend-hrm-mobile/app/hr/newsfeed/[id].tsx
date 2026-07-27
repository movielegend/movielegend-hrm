import { useLocalSearchParams } from 'expo-router';
import { NewsfeedDetailScreen } from '../../../src/features/newsfeed/NewsfeedScreens';

export default function HRNewsfeedDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <NewsfeedDetailScreen postId={id} canModerate />;
}
