import { Redirect, Stack } from 'expo-router';
import { LoadingState } from '../../src/components/LoadingState';
import { useAuth } from '../../src/providers/AuthProvider';
import { canAccessRoleRoute, getHomeRouteForUser } from '../../src/utils/role-routing';

export default function LeaderLayout() {
  const { isLoading, user } = useAuth();
  if (isLoading) return <LoadingState />;
  if (!canAccessRoleRoute(user, '/leader')) return <Redirect href={getHomeRouteForUser(user)} />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
