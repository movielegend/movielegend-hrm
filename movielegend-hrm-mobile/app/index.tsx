import { Redirect } from 'expo-router';
import { LoadingState } from '../src/components/LoadingState';
import { useAuth } from '../src/providers/AuthProvider';
import { getHomeRouteForUser } from '../src/utils/role-routing';

export default function IndexRoute() {
  const { isLoading, user } = useAuth();
  if (isLoading) return <LoadingState label="Đang khôi phục phiên đăng nhập" />;
  return <Redirect href={getHomeRouteForUser(user)} />;
}
