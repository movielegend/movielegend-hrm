# Integration Audit

## Response Format

Pass: `ResponseInterceptor` wraps successful responses as:

```json
{ "success": true, "data": {} }
```

Pass: `AllExceptionsFilter` wraps errors as:

```json
{ "success": false, "error": { "code": "ERROR_CODE", "message": "Message" } }
```

Risk: manual `@Res()` endpoints would bypass the wrapper. Current route audit did not find a custom streaming response path.

## Pagination

Target:

```json
{
  "items": [],
  "pagination": { "page": 1, "limit": 20, "total": 100, "totalPages": 5 }
}
```

Current status:

- Audit logs use `{ items, pagination }`.
- Some reports and existing list endpoints return arrays for simplicity.
- Frontend should treat old list endpoints as array responses until those modules are refactored.

## Scope / IDOR

Strong coverage:

- task detail checks participant/department/all permissions;
- employee document detail masks sensitive data and checks own/department/all;
- employee contract detail checks own/department/all;
- KPI assignment detail checks own/department/all;
- performance review detail checks own/department/all;
- payroll own endpoints restrict employee payslip access.

Audit watchlist:

- generic asset/report list endpoints should continue to apply warehouse/department scope before more frontend screens are added;
- admin endpoints intentionally global and must stay behind admin permissions.

## Upload Flow

Current route audit: no binary multipart endpoint was added. Upload-like flows accept metadata URLs or face payload fields. This reduces practical exposure to the `multer` audit chain.

## Rate Limit

Global throttler: 120 requests/minute. Watchlist for future per-route limits:

- login;
- refresh;
- exports;
- heavy reports;
- manual jobs;
- future multipart uploads.

## Query / N+1

Dashboard and reports use aggregate/count queries where practical. Existing detailed list endpoints should add pagination before large production datasets.
