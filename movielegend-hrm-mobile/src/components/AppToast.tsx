import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Toast, { ToastConfig } from 'react-native-toast-message';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const toastConfig: ToastConfig = {
  success: (props: any) => (
    <View style={toastStyles.card}>
      <View style={[toastStyles.iconCircle, { backgroundColor: '#ECFDF5' }]}>
        <MaterialCommunityIcons name="check-circle" size={22} color="#10B981" />
      </View>
      <View style={toastStyles.textWrap}>
        <Text style={toastStyles.title} numberOfLines={1}>{props.text1}</Text>
        {props.text2 ? (
          <Text style={toastStyles.message} numberOfLines={2}>{props.text2}</Text>
        ) : null}
      </View>
    </View>
  ),
  error: (props: any) => (
    <View style={toastStyles.card}>
      <View style={[toastStyles.iconCircle, { backgroundColor: '#FEF2F2' }]}>
        <MaterialCommunityIcons name="alert-circle" size={22} color="#EF4444" />
      </View>
      <View style={toastStyles.textWrap}>
        <Text style={toastStyles.title} numberOfLines={1}>{props.text1}</Text>
        {props.text2 ? (
          <Text style={toastStyles.message} numberOfLines={2}>{props.text2}</Text>
        ) : null}
      </View>
    </View>
  ),
  info: (props: any) => (
    <View style={toastStyles.card}>
      <View style={[toastStyles.iconCircle, { backgroundColor: '#EFF6FF' }]}>
        <MaterialCommunityIcons name="information" size={22} color="#3B82F6" />
      </View>
      <View style={toastStyles.textWrap}>
        <Text style={toastStyles.title} numberOfLines={1}>{props.text1}</Text>
        {props.text2 ? (
          <Text style={toastStyles.message} numberOfLines={2}>{props.text2}</Text>
        ) : null}
      </View>
    </View>
  ),
};

export function ToastWrapper({ topOffset }: { topOffset?: number }) {
  const insets = useSafeAreaInsets();
  const offset = topOffset ?? (Math.max(insets.top, Platform.OS === 'ios' ? 44 : 20) + 8);
  return <Toast config={toastConfig} topOffset={offset} />;
}

const toastStyles = StyleSheet.create({
  card: {
    width: '92%',
    maxWidth: 420,
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
  },
  title: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  message: {
    color: '#475569',
    fontSize: 12.5,
    lineHeight: 17,
  },
});
