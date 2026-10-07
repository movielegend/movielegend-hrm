import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Toast from 'react-native-toast-message';
import { LogBox, View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Provider as PaperProvider } from 'react-native-paper';

import { AuthProvider } from '../src/providers/AuthProvider';
import { QueryProvider } from '../src/providers/QueryProvider';
import { SocketProvider } from '../src/providers/SocketProvider';
import { usePushNotificationSetup } from '../src/hooks/useNotifications';
import { VoiceCallProvider } from '../src/features/voice-call/VoiceCallProvider';
import { UserGuideManager } from '../src/components/UserGuideManager';
import { AlertProvider } from '../src/contexts/AlertContext';
import { ActiveChatProvider } from '../src/contexts/ActiveChatContext';
import { InAppChatNotificationBanner } from '../src/components/InAppChatNotificationBanner';
import { CustomAlert, CustomAlertProvider } from '../src/components/CustomAlert';

LogBox.ignoreLogs([
  'expo-notifications: Android Push notifications',
  'viewIsDescendantOf() noop',
  'Cannot find view with reactTag',
  "The action 'GO_BACK' was not handled by any navigator",
]);

if (typeof globalThis !== 'undefined') {
  (globalThis as any).CustomAlert = CustomAlert;
}

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

export function ErrorBoundary({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <MaterialCommunityIcons name="alert-circle-outline" size={56} color="#EF4444" />
        <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827', marginTop: 16, marginBottom: 8 }}>
          Đã xảy ra lỗi
        </Text>
        <Text style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 24 }}>
          {error?.message || 'Không thể khởi động ứng dụng.'}
        </Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Text
            onPress={retry}
            style={{ backgroundColor: '#111827', color: '#FFFFFF', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, fontWeight: '600', fontSize: 15 }}
          >
            Thử lại
          </Text>
        </View>
      </View>
    </SafeAreaProvider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <PaperProvider>
        <QueryProvider>
          <AlertProvider>
            <AuthProvider>
              <ActiveChatProvider>
                <SocketProvider>
                  <VoiceCallProvider>
                    <UserGuideManager>
                      <PushNotificationWrapper>
                        <StatusBar style="dark" />
                        <Stack screenOptions={{ headerShown: false }} />
                        <ToastWrapper />
                        <InAppChatNotificationBanner />
                        <CustomAlertProvider />
                      </PushNotificationWrapper>
                    </UserGuideManager>
                  </VoiceCallProvider>
                </SocketProvider>
              </ActiveChatProvider>
            </AuthProvider>
          </AlertProvider>
        </QueryProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
