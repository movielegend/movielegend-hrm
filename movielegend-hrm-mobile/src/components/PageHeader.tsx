import { StyleSheet, Text, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  showBack?: boolean;
}

export function PageHeader({ title, subtitle, right, showBack }: PageHeaderProps) {
  const router = useRouter();

  return (
    <View style={styles.wrap}>
      {showBack && (
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
      )}
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  copy: {
    flex: 1,
    gap: spacing.xs,
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
    gap: spacing.md,
    justifyContent: 'flex-start',
  },
  backBtn: {
    marginRight: 4,
    padding: 4,
  },
});
