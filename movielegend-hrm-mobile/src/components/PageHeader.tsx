import { StyleSheet, Text, View, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}

export function PageHeader({ title, subtitle, right, showBack }: PageHeaderProps & { showBack?: boolean }) {
  const router = useRouter();
  const shouldShowBack = showBack !== undefined ? showBack : router.canGoBack();

  return (
    <View style={{ marginBottom: 16 }}>
      {shouldShowBack && (
        <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="Quay lại">
          <MaterialCommunityIcons name="arrow-left" size={24} color="#111827" />
        </Pressable>
      )}
      <View style={styles.wrap}>
        <View style={styles.copy}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{title}</Text>
          </View>
        </View>
        {right}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  copy: {
    flex: 1,
    gap: spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    marginBottom: 16,
    padding: 4,
    alignSelf: 'flex-start',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
  },
  wrap: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
