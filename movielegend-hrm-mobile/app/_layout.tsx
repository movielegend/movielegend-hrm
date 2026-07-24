import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Toast from 'react-native-toast-message';
import { AuthProvider } from '../src/providers/AuthProvider';
import { QueryProvider } from '../src/providers/QueryProvider';
import { SocketProvider } from '../src/providers/SocketProvider';
import { OnboardingProvider } from '../src/components/Onboarding/OnboardingProvider';
import { LogBox, View, Text } from 'react-native';
import { usePushNotificationSetup } from '../src/hooks/useNotifications';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

LogBox.ignoreLogs(['expo-notifications: Android Push notifications']);

// ── Custom Toast Config ──
const toastConfig = {
  success: (props: any) => (
    <View style={{
      width: '100%',
      backgroundColor: '#111827',
      paddingHorizontal: 20,
      paddingVertical: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 8,
    }}>
      <MaterialCommunityIcons name="check-circle" size={24} color="#10B981" />
      <View style={{ flex: 1 }}>
        <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700', marginBottom: 2 }}>
          {props.text1}
        </Text>
        {props.text2 ? (
          <Text style={{ color: '#9CA3AF', fontSize: 13 }}>
            {props.text2}
          </Text>
        ) : null}
      </View>
    </View>
  ),
  error: (props: any) => (
    <View style={{
      width: '100%',
      backgroundColor: '#111827',
      paddingHorizontal: 20,
      paddingVertical: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 8,
    }}>
      <MaterialCommunityIcons name="alert-circle" size={24} color="#EF4444" />
      <View style={{ flex: 1 }}>
        <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700', marginBottom: 2 }}>
          {props.text1}
        </Text>
        {props.text2 ? (
          <Text style={{ color: '#9CA3AF', fontSize: 13 }}>
            {props.text2}
          </Text>
        ) : null}
      </View>
    </View>
  ),
  info: (props: any) => (
    <View style={{
      width: '100%',
      backgroundColor: '#111827',
      paddingHorizontal: 20,
      paddingVertical: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 8,
    }}>
      <MaterialCommunityIcons name="information" size={24} color="#3B82F6" />
      <View style={{ flex: 1 }}>
        <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700', marginBottom: 2 }}>
          {props.text1}
        </Text>
        {props.text2 ? (
          <Text style={{ color: '#9CA3AF', fontSize: 13 }}>
            {props.text2}
          </Text>
        ) : null}
      </View>
    </View>
  )
};

function ToastWrapper() {
  const insets = useSafeAreaInsets();
  return <Toast config={toastConfig} topOffset={insets.top} />;
}

function PushNotificationWrapper({ children }: { children: React.ReactNode }) {
  usePushNotificationSetup();
  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <QueryProvider>
      <AuthProvider>
        <SocketProvider>
          <OnboardingProvider>
            <PushNotificationWrapper>
              <StatusBar style="dark" />
              <Stack screenOptions={{ headerShown: false }} />
              <ToastWrapper />
            </PushNotificationWrapper>
          </OnboardingProvider>
        </SocketProvider>
      </AuthProvider>
    </QueryProvider>
  );
}
