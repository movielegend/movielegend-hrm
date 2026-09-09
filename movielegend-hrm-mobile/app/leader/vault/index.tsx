import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';
import { RetentionVaultWidget } from '../../../src/features/vault/RetentionVaultWidget';
import { PageHeader } from '../../../src/components/PageHeader';

export default function LeaderVaultRoute() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
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
