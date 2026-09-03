import React from 'react';
import { View, StatusBar } from 'react-native';
import { AdminLevelConfigScreen } from '../../../src/features/admin-config/AdminLevelConfigScreen';

export default function AdminLevelsRoute() {
  return (
    <View style={{ flex: 1, backgroundColor: '#1E293B' }}>
      <StatusBar barStyle="light-content" backgroundColor="#1E293B" />
      <AdminLevelConfigScreen />
    </View>
  );
}
