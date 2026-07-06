# Reporting

Reports live under `/api/v1/reports` and use query services instead of controller-side business logic.

## Scope

- Admin can read global reports when permissions allow.
- Leader reports are constrained by `DepartmentScopeService`.
- Employee data exports avoid CCCD, bank account, salary, private document numbers, and internal IDs by default.
- Payroll summary and payroll detail are separate permissions.

## Export Security

Exports live under `/api/v1/exports/:report/csv` and `/api/v1/exports/:report/excel`.

Controls:

- permission check before generation;
- scoped report query;
- max row limit of 5,000 rows;
- safe generated filename;
- no raw SQL input;
- CSV includes UTF-8 BOM for Windows Excel Vietnamese compatibility;
- Excel-compatible XML keeps numeric cells numeric.

## Snapshots

`report_snapshots` supports monthly payroll, HR monthly, finalized KPI, and executive summaries. Not every report needs a snapshot.
