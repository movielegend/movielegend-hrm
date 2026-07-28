import { Tabs, Redirect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LoadingState } from '../../../src/components/LoadingState';
import { useAuth } from '../../../src/providers/AuthProvider';
import { canAccessRoleRoute, getHomeRouteForUser } from '../../../src/utils/role-routing';
import { useUnreadNotificationCount } from '../../../src/hooks/useNotifications';

export default function HRTabsLayout() {
  const insets = useSafeAreaInsets();
  const { isLoading, user } = useAuth();
  const { data: unreadCount = 0 } = useUnreadNotificationCount();

  if (isLoading) return <LoadingState />;
  if (!canAccessRoleRoute(user, '/hr')) return <Redirect href={getHomeRouteForUser(user)} />;
  
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#111827',
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
          title: 'Công việc',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="clipboard-check-outline" size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="attendance"
        options={{
          href: null,
          title: 'Chấm công',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="clock-outline" size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="newsfeed"
        options={{
          title: 'Bảng tin',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="newspaper-variant-outline" size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Thông báo',
          tabBarIcon: ({ color }) => (
            <View>
              <MaterialCommunityIcons name="bell-outline" size={26} color={color} />
              {unreadCount > 0 && (
                <View style={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  backgroundColor: '#EF4444',
                  borderRadius: 10,
                  minWidth: 16,
                  height: 16,
                  justifyContent: 'center',
                  alignItems: 'center',
                  paddingHorizontal: 4,
                  borderWidth: 1.5,
                  borderColor: '#fff'
                }}>
                  <Text style={{ color: '#fff', fontSize: 9, fontWeight: 'bold' }}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </View>
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
      <Tabs.Screen
        name="elearning"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="attendance-management"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
