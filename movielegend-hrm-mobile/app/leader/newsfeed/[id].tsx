import { useLocalSearchParams } from 'expo-router';
import { NewsfeedDetailScreen } from '../../../src/features/newsfeed/NewsfeedScreens';

export default function LeaderPostDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <NewsfeedDetailScreen postId={id} />;
}
