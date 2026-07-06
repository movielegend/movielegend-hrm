import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { normalizeApiError } from '../utils/api-error';
import { RetryButton } from './RetryButton';

interface ErrorStateProps {
  error: unknown;
  onRetry?: () => void;
}

export function ErrorState({ error, onRetry }: ErrorStateProps) {
  const normalized = normalizeApiError(error);
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{titleByCategory[normalized.category]}</Text>
      <Text style={styles.message}>{normalized.message}</Text>
      {onRetry ? <RetryButton onPress={onRetry} /> : null}
    </View>
  );
}

const titleByCategory: Record<ReturnType<typeof normalizeApiError>['category'], string> = {
  business: 'Không thể xử lý',
  forbidden: 'Không có quyền',
  network: 'Lỗi kết nối',
  offline: 'Không có kết nối',
  rate_limited: 'Thao tác quá nhanh',
  server: 'Lỗi máy chủ',
  timeout: 'Kết nối quá hạn',
  unauthorized: 'Phiên đăng nhập hết hạn',
  unknown: 'Có lỗi xảy ra',
  validation: 'Dữ liệu chưa hợp lệ',
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  message: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
});
