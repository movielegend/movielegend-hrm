# Database Migration Notes

Date: 2026-07-04

## Migration History

Current migration directories:

- `20260704000000_init_phase_1`
- `20260704010000_phase_2_attendance_leave`
- `20260704230000_phase_3_task_notification`
- `20260705000000_phase_4_warehouse_asset`
- `20260705010000_phase_5_payroll`
- `20260705020000_phase_6_contract_kpi_performance`
- `20260705030000_phase_7_dashboard_reporting_operations`

## Known Drift History

The development database previously had drift around `refresh_sessions` indexes:

- missing unique index on `tokenHash`
- missing index on `expiresAt`

This was handled without resetting the database. Old applied migration files must not be edited to hide or rewrite this history.

## Phase 3 Apply History

`npx prisma migrate dev --name phase_3_task_notification` was blocked by drift detection. The Phase 3 SQL migration was created from a Prisma diff, encoded as UTF-8 without BOM, and applied with:

```bash
npx prisma migrate deploy
```

The database then reported:

```text
Database schema is up to date!
```

## Phase 4 Apply History

Before Phase 4, `npx prisma migrate status` reported the database was up to date. Phase 4 migration was created as:

```text
20260705000000_phase_4_warehouse_asset
```

It was applied with:

```bash
npx prisma migrate deploy
```

No reset was performed.

## Phase 7 Apply History

Phase 7 migration was created as:

```text
20260705030000_phase_7_dashboard_reporting_operations
```

It adds system settings, notification preferences, report snapshots, job execution logs, and notification deduplication key. It also adds database constraints for report period ordering and non-negative job counters.

It was applied with:

```bash
npx prisma migrate deploy
```

No reset was performed and Phase 1-6 migrations were not edited.

## Phase 5 Apply History

Before Phase 5, `npx prisma migrate status` was checked. Phase 5 migration was created as:

```text
20260705010000_phase_5_payroll
```

It adds salary profiles, salary components, employee salary components, payroll periods, payrolls, payroll items, payroll calculation snapshots, bonuses, deductions, violations, disciplinary actions, and overtime rate rules.

It was applied with:

```bash
npx prisma migrate deploy
```

No reset was performed.

## Phase 6 Apply History

Before Phase 6, `npx prisma migrate status` reported the database was up to date. `npx prisma migrate dev --name phase_6_contract_kpi_performance --create-only` was blocked because the local database recorded modified checksums for previously applied Phase 1 and Phase 3 migrations. No reset was performed and no applied Phase 1-5 SQL was edited.

Phase 6 migration was created from a Prisma diff from the current database to the Phase 6 schema as:

```text
20260705020000_phase_6_contract_kpi_performance
```

It adds document types, extended employee document fields, contract templates/versions/contracts/signatures, KPI templates/criteria/assignments/results, performance review cycles/reviews/reviewer assignments, notification enum values, contract code sequence, integrity/state constraints, and immutable signature/finalized KPI triggers.

It was applied with:

```bash
npx prisma migrate deploy
```

No reset was performed.

## Rules

- Do not edit applied Phase 1, Phase 2, Phase 3, Phase 4, Phase 5, Phase 6, or Phase 7 migration SQL after it has been applied.
- Do not reset the main development database or production database.
- For production and Render deployments, use:

```bash
npx prisma migrate deploy
```

- Use a separate `TEST_DATABASE_URL`, for example `movielegend_hrm_test`, for destructive DB-backed E2E tests.
- If `TEST_DATABASE_URL` is not set, DB-backed E2E tests may skip.
