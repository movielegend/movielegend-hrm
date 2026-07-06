import { Redirect } from 'expo-router';
import { LoadingState } from '../src/components/LoadingState';
import { LoginScreen } from '../src/features/auth/LoginScreen';
import { useAuth } from '../src/providers/AuthProvider';
import { getHomeRouteForUser } from '../src/utils/role-routing';

export default function LoginRoute() {
  const { isLoading, user } = useAuth();
  if (isLoading) return <LoadingState label="Đang kiểm tra phiên đăng nhập" />;
  if (user) return <Redirect href={getHomeRouteForUser(user)} />;
  return <LoginScreen />;
}
