import { PropsWithChildren } from 'react';
import { StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';

import { StatusBar } from 'expo-status-bar';

type ScreenProps = PropsWithChildren & {
  backgroundColor?: string;
  unsafe?: boolean;
};

export function Screen({ children, backgroundColor = colors.background, unsafe = false }: ScreenProps) {
  return (
    <SafeAreaView 
      style={[styles.container, { backgroundColor }]}
      edges={unsafe ? ['right', 'bottom', 'left'] : undefined}
    >
      <StatusBar style="dark" backgroundColor={unsafe ? 'transparent' : backgroundColor} translucent={true} />
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 25}
      >
        {children}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
