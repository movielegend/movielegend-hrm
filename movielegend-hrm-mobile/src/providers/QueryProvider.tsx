import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PropsWithChildren, useState } from 'react';
import { normalizeApiError } from '../utils/api-error';

export function QueryProvider({ children }: PropsWithChildren) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            gcTime: 1_800_000,
            refetchOnWindowFocus: false,
            retry: (failureCount, error) => {
              const normalized = normalizeApiError(error);
              if (['unauthorized', 'forbidden', 'business', 'validation', 'rate_limited'].includes(normalized.category)) {
                return false;
              }
              return failureCount < 2;
            },
          },
          mutations: {
            retry: false,
          },
        },
      }),
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
