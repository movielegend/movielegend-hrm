# Production Runbook

## Deploy

1. Build the application image.
2. Run `npx prisma migrate deploy`.
3. Start with `node dist/main.js`.
4. Check `/health/ready`.

## Rollback Application

Deploy the previous image only if the database schema remains compatible. For risky migrations, back up the database before deploy.

## Health And Logs

- Liveness: `/health/live`
- Readiness: `/health/ready`
- Logs include `requestId`, method, path, status code, and duration.
- Logs must not include Authorization headers, passwords, refresh tokens, CCCD values, salary detail, or raw signature data.

## Scheduler

Manual jobs are available under `/api/v1/jobs/:jobName/run` with `job.run_manual`. Disable scheduler behavior operationally by not invoking jobs or by pausing the single scheduler instance.

## Incident Response

1. Check health endpoints and database connectivity.
2. Check recent job logs and audit logs.
3. Rotate secrets if credentials are suspected compromised.
4. Revoke compromised refresh sessions.
5. Restore from tested backup only after confirming the target migration state.

## Render

Use:

```bash
npm ci && npx prisma generate && npm run build
npx prisma migrate deploy && node dist/main.js
```

The app reads `PORT`, binds `0.0.0.0`, validates production env, and exposes readiness checks.
