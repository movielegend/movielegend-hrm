import { PropsWithChildren } from 'react';
import { StyleSheet, KeyboardAvoidingView, Platform, View, StatusBar as RNStatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';

import { StatusBar } from 'expo-status-bar';

type ScreenProps = PropsWithChildren & {
  backgroundColor?: string;
  unsafe?: boolean;
};

export function Screen({ children, backgroundColor = colors.background, unsafe = false }: ScreenProps) {
  const insets = useSafeAreaInsets();
  
  // On Android, useSafeAreaInsets can sometimes return 0 due to bugs.
  // Using RNStatusBar.currentHeight is a bulletproof fallback.
  const safeAreaTop = Platform.OS === 'android' 
    ? (RNStatusBar.currentHeight || insets.top) 
    : insets.top;
    
  const topPadding = unsafe ? 0 : safeAreaTop;

  return (
    <View 
      style={[styles.container, { backgroundColor, paddingTop: topPadding, paddingBottom: 0 }]}
    >
      <StatusBar style="dark" backgroundColor={unsafe ? 'transparent' : backgroundColor} />
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 25}
      >
        {children}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
