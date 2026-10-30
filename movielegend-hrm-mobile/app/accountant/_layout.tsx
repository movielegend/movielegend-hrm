import { Stack, Redirect } from 'expo-router';
import { useAuth } from '../../src/providers/AuthProvider';
import { LoadingState } from '../../src/components/LoadingState';
import { canAccessRoleRoute, getHomeRouteForUser } from '../../src/utils/role-routing';

export default function AccountantRootLayout() {
  const { isLoading, user } = useAuth();
  if (isLoading) return <LoadingState />;
  if (!canAccessRoleRoute(user, '/accountant')) return <Redirect href={getHomeRouteForUser(user)} />;
  
  return <Stack screenOptions={{ headerShown: false }} />;
}
