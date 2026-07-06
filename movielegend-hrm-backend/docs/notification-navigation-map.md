# Notification Navigation Map

Endpoints:

- `GET /api/v1/notifications/me`
- `GET /api/v1/notifications/unread-count`
- `PATCH /api/v1/notifications/:id/read`
- `PATCH /api/v1/notifications/read-all`
- `POST /api/v1/notifications/device-tokens`
- `DELETE /api/v1/notifications/device-tokens/:id`

Raw device tokens are hashed before storage.

## Type To Screen

| Notification type | Suggested screen | Metadata |
| --- | --- | --- |
| `TASK_ASSIGNED`, `TASK_UPDATED`, `TASK_COMMENTED`, `TASK_REVIEW_REQUESTED`, `TASK_EXTENSION_REQUESTED` | Task detail | `taskId`, `assignmentId` |
| `CROSS_DEPARTMENT_REQUESTED`, `CROSS_DEPARTMENT_UPDATED` | Cross department request detail | `requestId` |
| `MATERIAL_ISSUE_*`, `STOCK_TRANSFER_*` | Warehouse/stock detail | `issueId`, `transferId`, `warehouseId` |
| `ASSET_*` | Asset detail or asset assignment | `assetId`, `assignmentId`, `incidentId` |
| `PAYROLL_*`, `PAYSLIP_AVAILABLE` | Payslip/payroll period | `payrollId`, `periodId` |
| `BONUS_APPROVED`, `DEDUCTION_APPROVED`, `VIOLATION_CONFIRMED`, `DISCIPLINARY_ACTION_APPROVED` | Compensation/violation detail | related entity metadata |
| `DOCUMENT_*` | Employee document detail | `documentId` |
| `CONTRACT_*` | Employee contract detail | `contractId` |
| `KPI_*` | KPI assignment detail | `assignmentId` |
| `PERFORMANCE_REVIEW_*` | Performance review detail | `reviewId`, `cycleId` |
| `SYSTEM` | Notifications center | metadata-dependent |

Frontend should mark read after successful navigation or explicit user action.
