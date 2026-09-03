import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet } from 'react-native';
import { RetentionVaultWidget } from '../../../src/features/vault/RetentionVaultWidget';

export default function VaultRoute() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
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
