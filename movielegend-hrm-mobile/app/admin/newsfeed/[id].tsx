import { useLocalSearchParams } from 'expo-router';
import { NewsfeedDetailScreen } from '../../../src/features/newsfeed/NewsfeedScreens';

export default function AdminNewsfeedDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <NewsfeedDetailScreen postId={id} canModerate />;
}
