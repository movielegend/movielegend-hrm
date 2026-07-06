# Render Staging Deploy

## Steps

1. Create a Render PostgreSQL instance.
2. Create a backend Web Service from the backend repository.
3. Configure environment variables.
4. Build command:

```bash
npm ci && npx prisma generate && npm run build
```

5. Start command:

```bash
npx prisma migrate deploy && node dist/main.js
```

6. Health check path: `/health/ready`.
7. Seed first admin with `npm run prisma:seed` after setting admin env variables.
8. Verify Swagger at `/api/docs`.
9. Verify Socket.IO namespace `/hrm` using a valid access token.
10. Verify upload metadata flows with storage URLs, not local absolute paths.
11. Roll back application image only after checking migration compatibility.

## Required Environment

```bash
NODE_ENV=production
PORT=3001
DATABASE_URL=<render internal postgres url>
JWT_ACCESS_SECRET=<strong secret>
JWT_REFRESH_SECRET=<strong secret>
CORS_ORIGINS=<staging frontend origin>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d
```

Production validation rejects missing JWT secrets and wildcard CORS.

## Do Not Use In Production

```bash
npx prisma migrate dev
npx prisma migrate reset
```
