import React from 'react';
import { ScrollView, StyleSheet, View, Text, Pressable, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { RetentionVaultWidget } from '../../../src/features/vault/RetentionVaultWidget';

export default function WarehouseManagerVaultRoute() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#102739" />

      {/* Top Navy Header (#102739) */}
      <View style={[styles.header, { paddingTop: Math.max((insets.top > 0 ? insets.top : (StatusBar.currentHeight || 20)) - 6, 8) }]}>
        <View style={styles.headerTopRow}>
          <Pressable 
            onPress={() => router.canGoBack() ? router.back() : router.replace('/warehouse-manager')} 
            style={styles.backButton}
            hitSlop={10}
            accessibilityLabel="Quay lại"
          >
            <MaterialCommunityIcons name="chevron-left" size={28} color="#FFFFFF" />
          </Pressable>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Ví thưởng</Text>
            <Text style={styles.headerSubtitle}>Quỹ thưởng đồng hành & tích lũy</Text>
          </View>
          <View style={{ width: 32 }} />
        </View>
      </View>

      <ScrollView 
        style={styles.contentScroll}
        contentContainerStyle={[
          styles.scrollContent, 
          { paddingBottom: 40 + Math.max(insets.bottom, 24) }
        ]} 
        showsVerticalScrollIndicator={false}
      >
        <RetentionVaultWidget isVaultEnabled={true} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#102739',
    paddingBottom: 14,
    paddingHorizontal: 16,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 4,
    marginLeft: -4,
    width: 32,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 12.5,
    color: '#94A3B8',
    marginTop: 2,
  },
  contentScroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
});
