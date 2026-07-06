# MovieLegend HRM Backend

Backend HRM for Movie Legend, built with NestJS, TypeScript strict mode, Prisma, and PostgreSQL.

Current scope:

- Phase 1: account registration, approval, authentication, refresh sessions, RBAC, permissions, department scope, audit log.
- Phase 2: shifts, shift assignments, attendance, attendance locations, WiFi config, face-verification abstraction, attendance adjustment, location tracking, leave, overtime, employee requests.
- Phase 3: task management, task groups, task assignments, comments, attachments, activity history, extension requests, cross-department requests, notifications, device tokens, and Socket.IO realtime.
- Phase 4: warehouse, materials, stock receipts/issues/transfers, inventory checks, assets, asset assignments/returns, incidents, and maintenance.
- Phase 5: salary profiles, salary components, payroll periods, payroll calculation snapshots, payroll items, payslips, bonuses, deductions, violations, and disciplinary actions.
- Phase 6: employee documents, document types, contract templates/versions, employee contracts, internal e-signature workflow, contract expiry, KPI templates/criteria/assignments/results, and performance review cycles.
- Phase 7: dashboard summaries, reporting, CSV/Excel exports, system settings, notification preferences, reminder jobs, audit search, health readiness/liveness, request correlation logging, and production config validation.
- Phase 8: backend integration audit, API inventory, error catalog, frontend/mobile contracts, socket contract, upload contract, test DB preparation, demo seed, OpenAPI readiness, and staging documentation.

## Requirements

- Node.js 22 LTS or newer
- npm
- PostgreSQL local or PostgreSQL Docker

## Local Setup

Create database:

```bash
createdb movielegend_hrm
```

Create `.env` from `.env.example` and fill `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `SEED_ADMIN_PHONE`, and `SEED_ADMIN_PASSWORD`. Do not commit `.env`.

Install and run:

```bash
npm install
npx prisma format
npx prisma validate
npx prisma generate
npx prisma migrate dev
npx prisma db seed
npm run start:dev
```

Default API URL: `http://localhost:3001`.

Useful endpoints:

- Health: `GET /health`
- Swagger: `GET /api/docs`
- Auth: `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `GET /api/v1/auth/me`
- Departments: `GET /api/v1/departments`
- Approvals: `GET /api/v1/approvals/accounts`
- Tasks: `POST /api/v1/tasks`, `GET /api/v1/tasks`, `GET /api/v1/tasks/me`
- Task Assignments: `PATCH /api/v1/task-assignments/:id/accept`, `PATCH /api/v1/task-assignments/:id/progress`, `PATCH /api/v1/task-assignments/:id/submit`, `PATCH /api/v1/task-assignments/:id/approve`
- Task Groups: `POST /api/v1/task-groups`, `POST /api/v1/task-groups/:id/members`
- Cross Department: `POST /api/v1/cross-department-requests`, source approval, target accept/reject endpoints
- Notifications: `GET /api/v1/notifications/me`, `GET /api/v1/notifications/unread-count`
- Device Tokens: `POST /api/v1/notifications/device-tokens`; raw push tokens are hashed before storage
- Warehouses: `POST /api/v1/warehouses`, `GET /api/v1/warehouses`, `GET /api/v1/warehouses/:id/stocks`
- Materials: `POST /api/v1/material-categories`, `POST /api/v1/materials`, `GET /api/v1/materials`
- Receipts: `POST /api/v1/stock-receipts`, `POST /api/v1/stock-receipts/:id/approve`
- Material Issues: `POST /api/v1/material-issues`, approve/reject/issue/cancel endpoints
- Stock Transfers: `POST /api/v1/stock-transfers`, approve/ship/receive/cancel endpoints
- Assets: `POST /api/v1/assets`, `GET /api/v1/assets/my`, `POST /api/v1/assets/:id/assign`
- Asset Assignments: confirm/request-return/receive-return endpoints
- Asset Incidents: `POST /api/v1/assets/:id/incidents`, investigate/resolve/reject endpoints
- Inventory Checks: `POST /api/v1/inventory-checks`, update items, submit, approve
- Salary Profiles: `POST /api/v1/salary-profiles`, `GET /api/v1/salary-profiles/user/:userId`, `POST /api/v1/salary-profiles/:id/end`
- Salary Components: `POST /api/v1/salary-components`, `POST /api/v1/employee-salary-components`
- Payroll Periods: `POST /api/v1/payroll-periods`, calculate/recalculate/submit-review/approve/lock endpoints
- Payrolls: `GET /api/v1/payrolls/my`, `GET /api/v1/payrolls/my/:id`, admin payroll lookup endpoints
- Bonuses and Deductions: create/list/approve/reject/cancel endpoints
- Violations: create/list/confirm/reject and disciplinary action endpoints
- Document Types: `POST /api/v1/document-types`, `GET /api/v1/document-types`
- Employee Documents: `POST /api/v1/employee-documents`, `GET /api/v1/employee-documents/my`, verify and expiry endpoints
- Contract Templates: `POST /api/v1/contract-templates`, version-preserving update endpoints
- Employee Contracts: create, submit approval, approve/reject, request signature, employee/company sign, activate, terminate, expiry endpoints
- KPI Templates: create/read/update and `POST /api/v1/kpi-templates/:id/criteria`
- KPI Assignments: assign, read own/department, update results, self-submit, leader-review, finalize
- Review Cycles: create/open/advance/close and reviewer assignment endpoints
- Performance Reviews: read own/department, self-submit, leader-submit, finalize
- Dashboard: `GET /api/v1/dashboard/admin`, `GET /api/v1/dashboard/leader`, `GET /api/v1/dashboard/me`
- Reports: employee, attendance, task, payroll, warehouse, asset, and KPI reports under `/api/v1/reports`
- Exports: `GET /api/v1/exports/:report/csv`, `GET /api/v1/exports/:report/excel`
- System Settings: `GET /api/v1/system-settings`, `POST /api/v1/system-settings`
- Notification Preferences: `GET /api/v1/notification-preferences/me`, `PATCH /api/v1/notification-preferences/me`
- Jobs: list/log/manual run endpoints under `/api/v1/jobs`
- Audit Logs: `GET /api/v1/audit-logs`
- Health: `GET /health`, `GET /health/live`, `GET /health/ready`

## Phase 3 Permissions

- Admin uses the existing `ADMIN` role and receives all seeded permissions.
- Leader uses the existing department-scoped role and can assign/review/manage task groups only inside allowed departments.
- Employee can read own tasks, accept/start/update progress/submit, comment, request extension, create cross-department requests, read notifications, and manage own device tokens.
- Socket.IO namespace: `/hrm`. Authenticated clients join `user:{userId}` and scoped `department:{departmentId}` rooms only.
- Overdue tasks are derived from `dueAt` or `assignmentDueAt`; no background job mutates task status to overdue.

## PostgreSQL Docker

```bash
docker compose up -d postgres
```

Then use the same Prisma commands above.

## Test

```bash
npm run test
npm run test:e2e
```

Tests cover AuthService login, ApprovalService approve, scope permission, Phase 2 flow documentation, and Phase 3 task state-policy/business-case documentation.

DB-backed E2E tests must use a separate database. Create it separately:

```bash
createdb movielegend_hrm_test
```

Then set:

```bash
TEST_DATABASE_URL=postgresql://<user>:<password>@localhost:5432/movielegend_hrm_test
```

Apply migrations to the test DB with:

```bash
DATABASE_URL=$TEST_DATABASE_URL npx prisma migrate deploy
```

If `TEST_DATABASE_URL` is not set, destructive DB-backed E2E tests may skip. Never run `migrate reset` against the development database.

Prepare a test database safely with:

```bash
TEST_DATABASE_URL=postgresql://<user>:<password>@localhost:5432/movielegend_hrm_test npm run test:db:prepare
```

This command maps `TEST_DATABASE_URL` to Prisma only for the child process and refuses to run without it.

Demo seed is optional:

```bash
DEMO_DEFAULT_PASSWORD=<demo password> npm run prisma:seed:demo
```

If `DEMO_DEFAULT_PASSWORD` is missing, demo seed exits without creating demo users.

## Security And Migration Notes

- Security audit report: `docs/security-audit.md`
- Database migration notes: `docs/database-migration-notes.md`
- Reporting notes: `docs/reporting.md`
- Scheduler jobs notes: `docs/scheduler-jobs.md`
- Backup and restore: `docs/backup-and-restore.md`
- Production runbook: `docs/production-runbook.md`
- API inventory: `docs/api-inventory.md`
- Error codes: `docs/error-codes.md`
- Role matrix: `docs/role-permission-matrix.md`
- Integration audit: `docs/integration-audit.md`
- OpenAPI readiness: `docs/openapi-readiness.md`
- Mobile auth/attendance/task/face flows: `docs/mobile-auth-flow.md`, `docs/mobile-attendance-flow.md`, `docs/mobile-task-flow.md`, `docs/face-flow.md`
- Upload contract: `docs/upload-contract.md`
- Socket events: `docs/socket-events.md`
- Notification navigation: `docs/notification-navigation-map.md`
- Frontend screen/API client docs: `docs/frontend-screen-matrix.md`, `docs/frontend-api-client.md`
- Render staging: `docs/render-staging-deploy.md`
- Privacy and query/index audits: `docs/data-privacy-matrix.md`, `docs/query-index-audit.md`

## Payroll Privacy

Payroll GET endpoints read calculated snapshots and stored payroll items; they do not calculate salary on demand. Employees can only access `APPROVED` or `LOCKED` own payslips. Payroll Socket.IO events do not broadcast salary amounts to department rooms.

## Phase 6 Privacy And Signatures

Employee documents and contracts are sensitive. Leader document access is metadata-only unless `employee_document.read_sensitive` is explicitly granted. Socket.IO events emit metadata only and never broadcast file URLs, raw signature data, salary snapshots, CCCD, or passport numbers.

The contract signature workflow stores internal signature records and SHA-256 hashes for technical integrity. It is not represented as certified legal digital signing unless a real external provider is integrated later.

## Production Build

```bash
npm run build
npm run start:prod
```

## Docker Production

```bash
docker build -t movielegend-hrm-backend .
docker run --env-file .env -p 3001:3001 movielegend-hrm-backend
```

The container runs `prisma migrate deploy` before starting NestJS.

## Render Deploy

1. Create PostgreSQL on Render.
2. Create a Web Service from the backend repo.
3. Build command:

```bash
npm ci && npx prisma generate && npm run build
```

4. Start command:

```bash
npx prisma migrate deploy && node dist/main.js
```

5. Configure environment variables:

```bash
NODE_ENV=production
PORT=3001
DATABASE_URL=<Render PostgreSQL internal URL>
JWT_ACCESS_SECRET=<strong secret>
JWT_REFRESH_SECRET=<strong secret>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d
CORS_ORIGINS=<Expo/web app origin>
SEED_ADMIN_EMAIL=<admin email>
SEED_ADMIN_PHONE=<admin phone>
SEED_ADMIN_PASSWORD=<admin password>
```

The app listens on `0.0.0.0` and uses `process.env.PORT`, which is Render-ready.
