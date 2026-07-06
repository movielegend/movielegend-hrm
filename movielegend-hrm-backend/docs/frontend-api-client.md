# Frontend API Client Strategy

Recommended Expo stack:

- `fetch` wrapper or Axios;
- TanStack Query for caching/server state;
- secure token storage;
- one generated TypeScript client from OpenAPI when response DTOs are complete enough.

## Layers

- `apiClient`: base URL, timeout, token injection, error normalization.
- `authApi`: login, refresh, logout, auth/me.
- `employeeApi`: employee, department, approval.
- `attendanceApi`: shift, schedule, check-in/out.
- `taskApi`: tasks and assignment actions.
- `notificationApi`: notifications, preferences, device tokens.
- domain APIs: warehouse, assets, payroll, contracts, KPI, reports.

## Request Interceptor

Add `Authorization: Bearer <accessToken>` when available. Never log Authorization, refresh token, password, signature raw data, salary detail, or CCCD.

## Refresh Strategy

Use single-flight refresh:

1. First 401 starts refresh.
2. Other failed requests await the same refresh promise.
3. Retry each request once.
4. If refresh fails, clear tokens and route to login.

## Error Normalization

Normalize to:

```ts
type ApiError = {
  code: string;
  message: string;
  status?: number;
  category: 'business' | 'unauthorized' | 'forbidden' | 'validation' | 'rate_limited' | 'server' | 'network';
};
```

Do not show every failure as "Network Error". Business errors come from `error.code`.

## Timeout And Retry

- Normal API timeout: 15-30 seconds.
- Upload metadata requests: 30 seconds.
- Do not retry non-idempotent POSTs automatically unless protected by idempotency/dedup key.
