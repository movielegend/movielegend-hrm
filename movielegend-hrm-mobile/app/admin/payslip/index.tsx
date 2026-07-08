import { Stack, useRouter } from 'expo-router';
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PayslipScreen } from '../../../src/features/payroll/PayslipScreen';

export default function PayslipRoute() {
  const router = useRouter();
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Phiếu lương',
          headerTitleAlign: 'center',
          headerLeft: () => (
            <Pressable onPress={() => router.back()} style={{ marginLeft: 16, padding: 8 }}>
              <Ionicons name="arrow-back" size={24} color="#1E293B" />
            </Pressable>
          ),
        }}
      />
      <PayslipScreen />
    </>
  );
}
