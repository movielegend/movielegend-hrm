import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

interface LoadingStateProps {
  label?: string;
}

export function LoadingState({ label = 'Đang tải dữ liệu' }: LoadingStateProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator color="#4B5563" size="large" />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  label: {
    color: colors.muted,
    fontSize: 15,
  },
});
