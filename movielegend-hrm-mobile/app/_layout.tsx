import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Toast from 'react-native-toast-message';
import { AuthProvider } from '../src/providers/AuthProvider';
import { QueryProvider } from '../src/providers/QueryProvider';
import { SocketProvider } from '../src/providers/SocketProvider';
import { LogBox } from 'react-native';
import { usePushNotificationSetup } from '../src/hooks/useNotifications';

LogBox.ignoreLogs(['expo-notifications: Android Push notifications']);

function PushNotificationWrapper({ children }: { children: React.ReactNode }) {
  usePushNotificationSetup();
  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <QueryProvider>
      <AuthProvider>
        <SocketProvider>
          <PushNotificationWrapper>
            <StatusBar style="dark" />
            <Stack screenOptions={{ headerShown: false }} />
            <Toast />
          </PushNotificationWrapper>
        </SocketProvider>
      </AuthProvider>
    </QueryProvider>
  );
}
