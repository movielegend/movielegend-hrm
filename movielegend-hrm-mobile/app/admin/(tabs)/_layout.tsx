import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../../src/theme/colors';

import { useUnreadNotificationCount } from '../../../src/hooks/useNotifications';
import { MagicTabBar } from '../../../src/components/navigation/MagicTabBar';

export default function AdminTabsLayout() {
  const insets = useSafeAreaInsets();
  const { data: unreadNotifications = 0 } = useUnreadNotificationCount();

  return (
    <Tabs
      tabBar={(props) => <MagicTabBar {...props} />}
      screenOptions={{
        headerShown: false,
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
        name="notifications"
        options={{
          title: 'Thông báo',
          tabBarBadge: unreadNotifications > 0 ? (unreadNotifications > 99 ? '99+' : unreadNotifications) : undefined,
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
