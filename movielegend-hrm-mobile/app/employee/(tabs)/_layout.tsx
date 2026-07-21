import { Tabs, Redirect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LoadingState } from '../../../src/components/LoadingState';
import { useAuth } from '../../../src/providers/AuthProvider';
import { canAccessRoleRoute, getHomeRouteForUser } from '../../../src/utils/role-routing';
import { colors } from '../../../src/theme/colors';

import { useUnreadNotificationCount } from '../../../src/hooks/useNotifications';

export default function EmployeeLayout() {
  const insets = useSafeAreaInsets();
  const { isLoading, user } = useAuth();
  const { data: unreadCount = 0 } = useUnreadNotificationCount();

  if (isLoading) return <LoadingState />;
  if (!canAccessRoleRoute(user, '/employee')) return <Redirect href={getHomeRouteForUser(user)} />;
  
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#111827',
        tabBarInactiveTintColor: '#6B7280',
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
          title: 'Trang chủ',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons name={focused ? "home" : "home-outline"} size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="news"
        options={{
          title: 'Bảng tin',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons name={focused ? "newspaper-variant" : "newspaper-variant-outline"} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Nhóm chat',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons name={focused ? "message-text" : "message-text-outline"} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Thông báo',
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons name={focused ? "bell" : "bell-outline"} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Hồ sơ',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons name={focused ? "account" : "account-outline"} size={26} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
