import { Tabs, Redirect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LoadingState } from '../../../src/components/LoadingState';
import { useAuth } from '../../../src/providers/AuthProvider';
import { canAccessRoleRoute, getHomeRouteForUser } from '../../../src/utils/role-routing';
import { colors } from '../../../src/theme/colors';

export default function LeaderTabsLayout() {
  const insets = useSafeAreaInsets();
  const { isLoading, user } = useAuth();
  if (isLoading) return <LoadingState />;
  if (!canAccessRoleRoute(user, '/leader')) return <Redirect href={getHomeRouteForUser(user)} />;
  
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          borderTopWidth: 0,
          backgroundColor: '#fff',
          height: 65 + insets.bottom,
          paddingBottom: 10 + insets.bottom,
          paddingTop: 10,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: 4,
        }
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Làm việc',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home-variant-outline" size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Giao việc',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="clock-check-outline" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="approvals"
        options={{
          title: 'Duyệt đơn',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="clipboard-check-outline" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Tài khoản',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-outline" size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Thông báo',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="bell-outline" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="elearning"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
