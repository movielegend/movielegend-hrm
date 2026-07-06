import { PropsWithChildren } from 'react';
import { ScrollView, ScrollViewProps, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

interface ScreenContainerProps extends PropsWithChildren {
  style?: ViewStyle | undefined;
  refreshControl?: ScrollViewProps['refreshControl'];
}

export function ScreenContainer({ children, style, refreshControl }: ScreenContainerProps) {
  return <ScrollView contentContainerStyle={[styles.content, style]} refreshControl={refreshControl}>{children}</ScrollView>;
}

const styles = StyleSheet.create({
  content: {
    backgroundColor: colors.background,
    gap: spacing.lg,
    padding: spacing.lg,
  },
});
