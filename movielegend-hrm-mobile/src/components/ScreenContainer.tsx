import { PropsWithChildren, useState, useCallback } from 'react';
import { ScrollView, ScrollViewProps, StyleSheet, ViewStyle, RefreshControl } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

interface ScreenContainerProps extends PropsWithChildren {
  style?: ViewStyle | undefined;
  refreshControl?: ScrollViewProps['refreshControl'];
  disableGlobalRefresh?: boolean;
}

export function ScreenContainer({ children, style, refreshControl, disableGlobalRefresh }: ScreenContainerProps) {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries();
    setRefreshing(false);
  }, [queryClient]);

  const defaultRefreshControl = <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />;

  return (
    <ScrollView 
      contentContainerStyle={[styles.content, style]} 
      refreshControl={disableGlobalRefresh ? undefined : (refreshControl || defaultRefreshControl)}
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    backgroundColor: colors.background,
    gap: spacing.lg,
    padding: spacing.lg,
  },
});
