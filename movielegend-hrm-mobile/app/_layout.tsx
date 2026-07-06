import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
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
        </SocketProvider>
      </AuthProvider>
    </QueryProvider>
  );
}
