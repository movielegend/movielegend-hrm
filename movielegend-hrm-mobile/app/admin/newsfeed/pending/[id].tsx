import { useLocalSearchParams } from 'expo-router';
import { PendingNewsfeedDetailScreen } from '../../../../src/features/newsfeed/NewsfeedScreens';

export default function AdminPendingNewsfeedDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <PendingNewsfeedDetailScreen postId={id} />;
}
