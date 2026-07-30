import { PropsWithChildren } from 'react';
import { StyleSheet, KeyboardAvoidingView, Platform, View, StatusBar as RNStatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';

import { StatusBar } from 'expo-status-bar';

export function Screen({ children }: PropsWithChildren) {
  const insets = useSafeAreaInsets();
  
  // On Android, useSafeAreaInsets can sometimes return 0 due to bugs with translucent status bar.
  // Using RNStatusBar.currentHeight is a bulletproof fallback.
  const topPadding = Platform.OS === 'android' 
    ? (RNStatusBar.currentHeight || insets.top) 
    : insets.top;
  
  return (
    <View style={[styles.container, { paddingTop: topPadding, paddingBottom: 0 }]}>
      <StatusBar style="dark" />
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
    backgroundColor: colors.background,
  },
});
