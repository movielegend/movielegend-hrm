import { NewsfeedListScreen } from '../../../src/features/newsfeed/NewsfeedScreens';
import { useAuth } from '../../../src/providers/AuthProvider';
import { isAccountingLeader } from '../../../src/utils/role-routing';

export default function AccountantNewsTab() {
  const { user } = useAuth();
  const canModerate = isAccountingLeader(user);
  return <NewsfeedListScreen canModerate={canModerate} />;
}

