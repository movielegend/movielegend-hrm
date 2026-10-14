import { Tabs } from 'expo-router';
import { Newspaper, MessageSquare, Home, ClipboardCheck } from 'lucide-react-native';
import { TabBarUserAvatar } from '../../../src/components/navigation/TabBarUserAvatar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../../src/theme/colors';

import { useMyTasks } from '../../../src/hooks/useTasks';
import { useUnreadChatCount } from '../../../src/hooks/useNotifications';
import { MagicTabBar } from '../../../src/components/navigation/MagicTabBar';

export default function EmployeeLayout() {
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
            <Newspaper size={23} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Nhóm chat',
          tabBarBadge: unreadChat > 0 ? (unreadChat > 99 ? '99+' : unreadChat) : undefined,
          tabBarIcon: ({ color, focused }) => (
            <MessageSquare size={23} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Trang chủ',
          tabBarIcon: ({ color, focused }) => (
            <Home size={25} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Công việc',
          tabBarBadge: uncompletedTasksCount > 0 ? (uncompletedTasksCount > 99 ? '99+' : uncompletedTasksCount) : undefined,
          tabBarIcon: ({ color, focused }) => (
            <ClipboardCheck size={23} color={color} strokeWidth={focused ? 2.5 : 2} />
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
            <TabBarUserAvatar focused={focused} color={color} size={28} />
          ),
        }}
      />
    </Tabs>
  );
}
