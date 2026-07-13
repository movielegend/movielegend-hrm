import { Tabs, Redirect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LoadingState } from '../../../src/components/LoadingState';
import { useAuth } from '../../../src/providers/AuthProvider';
import { canAccessRoleRoute, getHomeRouteForUser } from '../../../src/utils/role-routing';
import { colors } from '../../../src/theme/colors';

export default function AdminTabsLayout() {
  const insets = useSafeAreaInsets();
  const { isLoading, user } = useAuth();
  if (isLoading) return <LoadingState />;
  if (!canAccessRoleRoute(user, '/admin')) return <Redirect href={getHomeRouteForUser(user)} />;
  
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#111827', // Dark Navy from mockup
        tabBarInactiveTintColor: '#9CA3AF',
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
          fontWeight: '600',
          marginTop: 4,
        }
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Trang chủ',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons name={focused ? "home" : "home-outline"} size={28} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Duyệt đơn',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="clipboard-check-outline" size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="elearning"
        options={{
          title: 'Chấm công',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="clock-outline" size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Thông báo',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="bell-outline" size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Hồ sơ',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="account-circle-outline" size={26} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
