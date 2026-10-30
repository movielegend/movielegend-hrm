import { useLocalSearchParams } from 'expo-router';
import { NewsfeedDetailScreen } from '../../../src/features/newsfeed/NewsfeedScreens';
import { useAuth } from '../../../src/providers/AuthProvider';
import { isAccountingLeader } from '../../../src/utils/role-routing';

export default function AccountantNewsfeedDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const canModerate = isAccountingLeader(user);
  return <NewsfeedDetailScreen postId={id} canModerate={canModerate} />;
}

