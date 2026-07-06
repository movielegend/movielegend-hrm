# Socket.IO Contract

Namespace: `/hrm`

Auth: pass JWT access token in `handshake.auth.token` or `Authorization` header.

Rooms joined automatically:

- `user:{userId}`
- `department:{departmentId}` for scoped roles

Warehouse room:

- client emits `warehouse:join` with `{ "warehouseId": "..." }`
- allowed for `ADMIN` or scoped `WAREHOUSE_MANAGER`

## Events

| Event | Room | Payload |
| --- | --- | --- |
| `notification.created` | user | Notification metadata |
| `document:updated` | user | `{ id, status }` |
| `contract:updated` | user | `{ id, status }` |
| `contract:signature-required` | user | `{ id, status }` |
| `kpi:assigned` | user | `{ id, status }` |
| `kpi:updated` | user | `{ id, status }` |
| `performance-review:updated` | user | `{ id?, cycleId?, status }` |
| `task:assigned` | user/department policy | `{ taskId, assignmentId?, status }` |
| `task:updated` | user/department policy | `{ taskId, status }` |
| `task:commented` | user/department policy | `{ taskId, commentId }` |
| `task:submitted` | reviewer/department | `{ taskId, assignmentId }` |
| `task:reviewed` | user | `{ taskId, assignmentId, status }` |
| `cross-department:updated` | department | `{ requestId, status }` |
| `warehouse:stock-updated` | warehouse | `{ warehouseId, materialId? }` |
| `material:issue-updated` | user/warehouse | `{ issueId, status }` |
| `asset:assigned` | user | `{ assignmentId, assetId }` |
| `asset:return-updated` | user/warehouse | `{ assignmentId, status }` |
| `asset:incident-updated` | user/warehouse | `{ incidentId, status }` |
| `payroll:period-updated` | admin/accounting | `{ periodId, status }` |
| `payroll:payslip-available` | user | `{ payrollId, periodId }` |

No event should include raw file content, salary detail, full document number, refresh token, or signature raw data.
