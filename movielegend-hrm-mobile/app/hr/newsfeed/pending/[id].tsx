import { useLocalSearchParams } from 'expo-router';
import { PendingNewsfeedDetailScreen } from '../../../../src/features/newsfeed/NewsfeedScreens';

export default function HRNewsfeedPendingDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <PendingNewsfeedDetailScreen postId={id} />;
}
