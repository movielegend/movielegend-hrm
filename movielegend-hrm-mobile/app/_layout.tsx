import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Toast from 'react-native-toast-message';
import { AuthProvider } from '../src/providers/AuthProvider';
import { QueryProvider } from '../src/providers/QueryProvider';
import { SocketProvider } from '../src/providers/SocketProvider';

export default function RootLayout() {
  return (
    <QueryProvider>
      <AuthProvider>
        <SocketProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false }} />
          <Toast />
        </SocketProvider>
      </AuthProvider>
    </QueryProvider>
  );
}
