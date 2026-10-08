import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { LoadingState } from '../src/components/LoadingState';
import { useAuth } from '../src/providers/AuthProvider';
import { getHomeRouteForUser } from '../src/utils/role-routing';

export default function IndexRoute() {
  const { isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      router.replace(getHomeRouteForUser(user) as any);
    }
  }, [isLoading, user, router]);

  return <LoadingState label="Đang khôi phục phiên đăng nhập" />;
}

