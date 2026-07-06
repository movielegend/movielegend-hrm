# Query And Index Audit

## Existing Index Coverage

| Query pattern | Coverage |
| --- | --- |
| user phone/email/code lookup | unique indexes |
| employee profile CCCD | unique index |
| department member user/department | unique department/user index |
| shift assignment user/date | unique user/workDate |
| attendance user/date | unique user/workDate |
| task assignment user/status | indexed |
| task department/status and creator/date | indexed |
| leave/OT department/status | indexed |
| warehouse stock warehouse/material | unique/indexed in stock models |
| asset status/warehouse | indexed on `assetStatus`, `warehouseId` |
| payroll period/user | unique/indexed |
| contract user/status/endDate | indexed |
| KPI user/status/period | indexed |
| performance review user/reviewer/status | indexed |
| notification type/date and targets | indexed by existing notification target lookups |
| audit logs | currently ordered by `createdAt`; add action/date index later if audit volume grows |

## Phase 8 Decision

No blind index was added. Current query patterns are acceptable for staging. Add indexes only after measuring slow queries in production/staging logs.

## Watchlist

- dashboard counts on large tables;
- attendance report over long date ranges;
- payroll report aggregate;
- audit log search by action and date;
- employee report search by name.
