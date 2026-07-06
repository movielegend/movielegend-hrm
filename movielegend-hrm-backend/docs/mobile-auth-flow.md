# Mobile Auth Flow

## Endpoints

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`

## Token Storage

Expo frontend should store access and refresh tokens in secure storage. Do not store tokens in plain AsyncStorage for production.

## App Launch

1. Read tokens from secure storage.
2. Call `/auth/me` with access token.
3. If access token is valid, enter app.
4. If access token expired, call `/auth/refresh`.
5. Retry the failed request once.
6. If refresh fails, clear local tokens and show login.

## Single-Flight Refresh

When multiple requests fail with 401 at the same time, the frontend should run exactly one refresh request and queue other retry attempts behind it.

## Logout

Call `/auth/logout` with the refresh token, then clear local tokens. Logout revokes the refresh session server-side.

## Error Codes

- `INVALID_CREDENTIALS`
- `ACCOUNT_PENDING_APPROVAL`
- `ACCOUNT_REJECTED`
- `ACCOUNT_SUSPENDED`
- `INVALID_REFRESH_TOKEN`
- `REFRESH_SESSION_REVOKED`
- `UNAUTHORIZED`
