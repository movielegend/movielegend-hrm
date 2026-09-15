import { PropsWithChildren } from 'react';
import { StyleSheet, KeyboardAvoidingView, Platform, View } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';

import { StatusBar } from 'expo-status-bar';

interface ScreenProps extends PropsWithChildren {
  backgroundColor?: string;
  unsafe?: boolean;
  edges?: Edge[];
  withBottomInset?: boolean;
}

export function Screen({
  children,
  backgroundColor = colors.background,
  unsafe = false,
  edges,
  withBottomInset = false,
}: ScreenProps) {
  if (unsafe) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <StatusBar style="dark" />
        <KeyboardAvoidingView 
          style={styles.keyboardView} 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {children}
        </KeyboardAvoidingView>
      </View>
    );
  }

  const effectiveEdges: Edge[] = edges 
    ? edges 
    : withBottomInset 
      ? ['top', 'bottom', 'left', 'right'] 
      : ['top', 'left', 'right'];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={effectiveEdges}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView 
        style={styles.keyboardView} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
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
  keyboardView: {
    flex: 1,
  },
});
