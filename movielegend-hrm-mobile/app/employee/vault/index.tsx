import React from 'react';
import { ScrollView, StyleSheet, View, Text, Pressable, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { RetentionVaultWidget } from '../../../src/features/vault/RetentionVaultWidget';

export default function VaultRoute() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#071C33" />

      {/* Top Deep Navy Gradient Header matching template */}
      <LinearGradient
        colors={['#071C33', '#0A2542', '#0C2D50']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: Math.max((insets.top > 0 ? insets.top : (StatusBar.currentHeight || 20)) - 6, 8) }]}
      >
        <View style={styles.headerTopRow}>
          <Pressable 
            onPress={() => router.canGoBack() ? router.back() : router.replace('/employee')} 
            style={styles.backButton}
            hitSlop={10}
          >
            <MaterialCommunityIcons name="chevron-left" size={28} color="#FFFFFF" />
          </Pressable>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Ví thưởng</Text>
            <Text style={styles.headerSubtitle}>Quỹ thưởng đồng hành & tích lũy</Text>
          </View>
          <View style={{ width: 32 }} />
        </View>
      </LinearGradient>

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
    backgroundColor: '#F1F5F9',
  },
  header: {
    paddingBottom: 16,
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
    color: 'rgba(224, 242, 254, 0.85)',
    marginTop: 3,
  },
  contentScroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
});
