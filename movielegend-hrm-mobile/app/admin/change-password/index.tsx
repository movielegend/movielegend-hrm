import { Stack } from 'expo-router';
import { ChangePasswordScreen } from '../../../src/features/auth/ChangePasswordScreen';

export default function ChangePasswordRoute() {
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <ChangePasswordScreen />
    </>
  );
}
