import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMyTasks } from '../../../src/hooks/useTasks';
import { useUnreadChatCount } from '../../../src/hooks/useNotifications';
import { MagicTabBar } from '../../../src/components/navigation/MagicTabBar';

export default function LeaderTabsLayout() {
  const insets = useSafeAreaInsets();
  const { data: myTasks } = useMyTasks({ limit: 50 });
  const uncompletedTasksCount = myTasks?.items?.filter((t: any) => !['COMPLETED', 'CANCELLED', 'REJECTED'].includes(t.status)).length || 0;
  const { data: unreadChat = 0 } = useUnreadChatCount();

  return (
    <Tabs
      initialRouteName="index"
      tabBar={(props) => <MagicTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
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
          tabBarBadge: unreadChat > 0 ? (unreadChat > 99 ? '99+' : unreadChat) : undefined,
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons name={focused ? "message-text" : "message-text-outline"} size={24} color={color} />
          ),
        }}
      />
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
        name="my-tasks"
        options={{
          title: 'Việc của tôi',
          tabBarBadge: uncompletedTasksCount > 0 ? (uncompletedTasksCount > 99 ? '99+' : uncompletedTasksCount) : undefined,
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons name={focused ? "clipboard-account" : "clipboard-account-outline"} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          href: null,
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
