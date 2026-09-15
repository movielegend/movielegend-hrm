import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { RetentionVaultWidget } from '../../../src/features/vault/RetentionVaultWidget';
import { PageHeader } from '../../../src/components/PageHeader';

export default function VaultRoute() {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        contentContainerStyle={[styles.scroll, { paddingBottom: 40 + Math.max(insets.bottom, 24) }]} 
        showsVerticalScrollIndicator={false}
      >
        <PageHeader
          title="Ví Thưởng"
          subtitle="Quỹ thưởng đồng hành & tích lũy tài chính"
          showBack={false}
        />
        <RetentionVaultWidget isVaultEnabled={true} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scroll: {
    padding: 16,
  },
});
