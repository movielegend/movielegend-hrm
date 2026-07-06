# API Inventory

All application APIs are served under `/api/v1` except `/health`, `/health/live`, and `/health/ready`. Success responses are wrapped as `{ "success": true, "data": ... }`; errors are wrapped as `{ "success": false, "error": { "code": "...", "message": "..." } }`.

Phase 8 contract-closure additions for Attendance, Leave, Overtime, and Employee Requests are documented in [`contract-closure-attendance-requests.md`](./contract-closure-attendance-requests.md). Legacy report/action routes in this inventory remain supported.

## Auth

| Method | Path | Auth | Permission | Scope | Request DTO | Pagination | Upload | Socket | Main errors |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| POST | `/auth/register` | No | Public | Own registration | `RegisterDto` | No | Face image refs in DTO | No | `DUPLICATE_PHONE`, `DUPLICATE_ID_CARD`, `FACE_POSE_REQUIRED` |
| POST | `/auth/login` | No | Public | Own account | `LoginDto` | No | No | No | `INVALID_CREDENTIALS`, `ACCOUNT_PENDING_APPROVAL`, `ACCOUNT_REJECTED`, `ACCOUNT_SUSPENDED` |
| POST | `/auth/refresh` | No | Public refresh token | Own session | `RefreshDto` | No | No | No | `INVALID_REFRESH_TOKEN`, `REFRESH_SESSION_REVOKED` |
| POST | `/auth/logout` | Yes | Authenticated | Own session | `RefreshDto` | No | No | No | `INVALID_REFRESH_TOKEN` |
| GET | `/auth/me` | Yes | Authenticated | Own account | none | No | No | No | `UNAUTHORIZED` |

## Administration And RBAC

| Method | Path | Auth | Permission | Scope | Request DTO | Pagination | Upload | Socket | Main errors |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GET | `/admin/users` | Yes | `user.read` | Admin/global | `UserQueryDto` | Query-supported | No | No | `FORBIDDEN` |
| GET | `/admin/users/:id` | Yes | `user.read` | Admin/global | none | No | No | No | `USER_NOT_FOUND` |
| PATCH | `/admin/users/:id` | Yes | `user.update` | Admin/global | `UpdateUserDto` | No | No | No | `USER_NOT_FOUND` |
| POST | `/admin/leader-assignments` | Yes | `role.assign` | Admin/global | `LeaderAssignmentDto` | No | No | No | `USER_NOT_FOUND`, `ROLE_NOT_FOUND` |
| DELETE | `/admin/leader-assignments/:id` | Yes | `role.assign` | Admin/global | none | No | No | No | `NOT_FOUND` |
| GET | `/roles` | Yes | `permission.read` | Global | none | No | No | No | `FORBIDDEN` |
| GET | `/permissions` | Yes | `permission.read` | Global | none | No | No | No | `FORBIDDEN` |

## Organization And Employee

| Method | Path | Auth | Permission | Scope | Request DTO | Pagination | Upload | Socket | Main errors |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| POST | `/departments` | Yes | `department.create` | Admin/global | `CreateDepartmentDto` | No | No | No | `DUPLICATE_DEPARTMENT` |
| GET | `/departments` | Yes | `department.read` | Role scope | none | No | No | No | `FORBIDDEN` |
| GET | `/departments/:id` | Yes | `department.read` | Role scope | none | No | No | No | `DEPARTMENT_NOT_FOUND` |
| PATCH | `/departments/:id` | Yes | `department.update` | Admin/global | `UpdateDepartmentDto` | No | No | No | `DEPARTMENT_NOT_FOUND` |
| DELETE | `/departments/:id` | Yes | `department.delete` | Admin/global | none | No | No | No | `DEPARTMENT_NOT_FOUND` |
| GET | `/positions` | Yes | `position.read` | Admin/HR all, Leader department, Employee own/global metadata | `departmentId`, `isActive`, `search`, `page`, `limit` | Yes | No | No | `FORBIDDEN_DEPARTMENT_SCOPE` |
| GET | `/positions/:id` | Yes | `position.read` | Same as list | none | No | No | No | `POSITION_NOT_FOUND`, `FORBIDDEN_DEPARTMENT_SCOPE` |
| POST | `/positions` | Yes | `position.create` | Admin/HR global management | `CreatePositionDto` | No | No | No | `DUPLICATE_POSITION_CODE`, `DEPARTMENT_NOT_FOUND` |
| PATCH | `/positions/:id` | Yes | `position.update` | Admin/HR global management | `UpdatePositionDto` | No | No | No | `POSITION_NOT_FOUND`, `DUPLICATE_POSITION_CODE` |
| DELETE | `/positions/:id` | Yes | `position.delete` | Admin/global | none | No | No | No | `POSITION_NOT_FOUND`; in-use positions are deactivated |
| GET | `/employees/:id` | Yes | `employee.read` | Admin/department/own policy | none | No | No | No | `EMPLOYEE_NOT_FOUND` |
| GET | `/approvals/accounts` | Yes | `approval.read` | Admin or leader department | `ApprovalQueryDto` | Query-supported | No | No | `FORBIDDEN_DEPARTMENT_SCOPE` |
| POST | `/approvals/accounts/:id/approve` | Yes | `approval.approve` | Admin or leader department | none | No | No | No | `APPROVAL_NOT_FOUND`, `FORBIDDEN_DEPARTMENT_SCOPE` |
| POST | `/approvals/accounts/:id/reject` | Yes | `approval.reject` | Admin or leader department | `RejectDto` | No | No | No | `APPROVAL_NOT_FOUND` |

## Attendance, Shift, Leave, Requests

| Method | Path | Auth | Permission | Scope | Request DTO | Pagination | Upload | Socket | Main errors |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| POST | `/shifts` | Yes | `shift.create` | Admin/global | `CreateShiftDto` | No | No | No | `DUPLICATE_SHIFT` |
| GET | `/shifts` | Yes | `shift.read` | Authenticated | none | No | No | No | `FORBIDDEN` |
| PATCH | `/shifts/:id` | Yes | `shift.update` | Admin/global | `UpdateShiftDto` | No | No | No | `SHIFT_NOT_FOUND` |
| POST | `/shift-assignments` | Yes | `shift.assign` | Admin/leader department | `CreateShiftAssignmentDto` | No | No | No | `FORBIDDEN_DEPARTMENT_SCOPE` |
| GET | `/shift-assignments/me` | Yes | Authenticated | Own | none | No | No | No | `UNAUTHORIZED` |
| POST | `/shift-assignments/registrations` | Yes | `shift.register` | Own | `CreateShiftRegistrationDto` | No | No | No | `SHIFT_NOT_FOUND` |
| POST | `/shift-assignments/swaps` | Yes | `shift.swap` | Own | `CreateShiftSwapDto` | No | No | No | `SHIFT_ASSIGNMENT_NOT_FOUND` |
| POST | `/attendance/check-in` | Yes | `attendance.checkin` | Own | `CheckInDto` | No | Face image ref | No | `SHIFT_ASSIGNMENT_NOT_FOUND`, `TOO_EARLY_TO_CHECK_IN`, `OUTSIDE_ATTENDANCE_RADIUS`, `INVALID_WIFI`, `FACE_VERIFICATION_FAILED`, `ALREADY_CHECKED_IN` |
| POST | `/attendance/check-out` | Yes | `attendance.checkin` | Own | `CheckOutDto` | No | No | No | `NOT_CHECKED_IN`, `ALREADY_CHECKED_OUT` |
| GET | `/attendance` | Yes | `attendance.read` | Admin/leader department/own | query params | Query-supported | No | No | `FORBIDDEN_DEPARTMENT_SCOPE` |
| POST | `/attendance/adjustments` | Yes | `attendance.adjust` | Own | `CreateAttendanceAdjustmentDto` | No | No | No | `ATTENDANCE_NOT_FOUND` |
| POST | `/attendance/adjustments/:id/approve` | Yes | `attendance.adjust` | Leader/Admin department | none | No | No | No | `FORBIDDEN_DEPARTMENT_SCOPE` |
| POST | `/attendance/locations` | Yes | `attendance.location.manage` | Admin/global | `CreateAttendanceLocationDto` | No | No | No | `FORBIDDEN` |
| POST | `/attendance/wifi-configs` | Yes | `attendance.location.manage` | Admin/global | `CreateWifiConfigDto` | No | No | No | `FORBIDDEN` |
| POST | `/attendance/location-tracking` | Yes | Authenticated | Own | `TrackLocationDto` | No | No | No | `UNAUTHORIZED` |
| POST | `/leave-types` | Yes | `leave.type.manage` | Admin/HR | `CreateLeaveTypeDto` | No | No | No | `DUPLICATE_LEAVE_TYPE` |
| POST | `/leave-requests` | Yes | `leave.request` | Own | `CreateLeaveRequestDto` | No | No | No | `LEAVE_TYPE_NOT_FOUND` |
| GET | `/leave-requests` | Yes | `leave.balance.read` or approval permission | Own/department/all | query params | Query-supported | No | No | `FORBIDDEN` |
| POST | `/leave-requests/:id/approve` | Yes | `leave.approve` | Leader/Admin department | none | No | No | No | `FORBIDDEN_DEPARTMENT_SCOPE` |
| POST | `/leave-requests/:id/reject` | Yes | `leave.approve` | Leader/Admin department | `RejectDto` | No | No | No | `FORBIDDEN_DEPARTMENT_SCOPE` |
| POST | `/overtime-requests` | Yes | `overtime.request` | Own | `CreateOvertimeRequestDto` | No | No | No | `INVALID_OVERTIME_TIME` |
| POST | `/overtime-requests/:id/approve` | Yes | `overtime.approve` | Leader/Admin department | none | No | No | No | `FORBIDDEN_DEPARTMENT_SCOPE` |
| POST | `/employee-requests` | Yes | `employee.request` | Own | `CreateEmployeeRequestDto` | No | Metadata only | No | `BAD_REQUEST` |
| GET | `/employee-requests` | Yes | `employee.request` or approve | Own/department/all | query params | Query-supported | No | No | `FORBIDDEN` |
| POST | `/employee-requests/:id/approve` | Yes | `employee.request.approve` | Leader/Admin department | none | No | No | No | `FORBIDDEN_DEPARTMENT_SCOPE` |

## Task, Cross Department, Notification

## Uploads

| Method | Path | Auth | Permission | Scope | Request DTO | Pagination | Upload | Socket | Main errors |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| POST | `/uploads` | Optional JWT; public only for `FACE_REGISTRATION` | `upload.create` for non-face purposes | Purpose policy | `multipart/form-data` with `purpose` and `file` | No | Single file | No | `UPLOAD_FILE_REQUIRED`, `UPLOAD_PURPOSE_INVALID`, `UPLOAD_FILE_TOO_LARGE`, `UPLOAD_MIME_NOT_ALLOWED`, `UPLOAD_SIGNATURE_INVALID`, `UPLOAD_UNAUTHORIZED`, `UPLOAD_STORAGE_FAILED` |

| Method | Path | Auth | Permission | Scope | Request DTO | Pagination | Upload | Socket | Main errors |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| POST | `/tasks` | Yes | `task.assign_any` or `task.assign_department` | Admin/leader department | `CreateTaskDto` | No | No | `task:assigned`, `notification.created` | `TASK_TARGET_EMPTY`, `FORBIDDEN_DEPARTMENT_SCOPE` |
| GET | `/tasks` | Yes | task read permissions | Own/department/all | `search`, `status`, `priority`, `departmentId`, `assignedUserId`, `createdById`, `fromDate`, `toDate`, `overdue`, `page`, `limit` | Standard | No | No | `FORBIDDEN`, `FORBIDDEN_DEPARTMENT_SCOPE` |
| GET | `/tasks/me` | Yes | `task.read_own` | Own | same task filters | Standard | No | No | `FORBIDDEN` |
| GET | `/tasks/:id` | Yes | task read permissions | Own/department/all detail | none | No | No | No | `TASK_NOT_FOUND`, `TASK_IDOR_DENIED` |
| GET | `/tasks/:id/timeline` | Yes | task read permissions | Same as detail | `page`, `limit` | Standard | No | No | `TASK_NOT_FOUND`, `TASK_FORBIDDEN` |
| PATCH | `/tasks/:id` | Yes | task assign permissions | Department/all | `UpdateTaskDto` | No | No | `task:updated` | `TASK_NOT_FOUND` |
| PATCH | `/tasks/:id/cancel` | Yes | task assign permissions | Department/all | none | No | No | `task:updated` | `TASK_NOT_FOUND` |
| POST | `/tasks/:id/comments` | Yes | task comment/read permissions | Participant/department/all | `CreateTaskCommentDto` | No | No | `task:commented` | `TASK_NOT_FOUND` |
| POST | `/tasks/:id/attachments` | Yes | task comment/read permissions | Participant/department/all | `CreateTaskAttachmentDto` | No | File URL metadata | `task:updated` | `TASK_NOT_FOUND` |
| POST | `/tasks/:id/extensions` | Yes | `task.extension_request_own` | Own assignment | `CreateTaskExtensionRequestDto` | No | No | `task:updated` | `TASK_ASSIGNMENT_MISMATCH` |
| PATCH | `/task-assignments/:id/accept/start/progress/submit` | Yes | own task permissions | Own assignment | task DTOs | No | Optional evidence URL | `task:updated` | `TASK_ASSIGNMENT_NOT_FOUND` |
| PATCH | `/task-assignments/:id/approve/reject` | Yes | task review permissions | Department/all | `ReviewTaskDto` | No | No | `task:reviewed` | `FORBIDDEN_DEPARTMENT_SCOPE` |
| GET | `/task-assignments/review-queue` | Yes | task review permissions | Department/all | `departmentId`, `priority`, `fromDate`, `toDate`, `page`, `limit` | Standard | No | No | `TASK_REVIEW_FORBIDDEN`, `FORBIDDEN_DEPARTMENT_SCOPE` |
| GET | `/task-extensions/pending` | Yes | task extension review permissions | Department/all | `departmentId`, `page`, `limit` | Standard | No | No | `TASK_EXTENSION_FORBIDDEN`, `FORBIDDEN_DEPARTMENT_SCOPE` |
| PATCH | `/task-extensions/:id/approve/reject` | Yes | task extension review permissions | Department/all | `ReviewTaskDto` | No | No | `task:updated` | `FORBIDDEN_DEPARTMENT_SCOPE` |
| POST | `/task-groups` | Yes | task group permissions | Department/all | `CreateTaskGroupDto` | No | No | No | `FORBIDDEN_DEPARTMENT_SCOPE` |
| GET | `/task-groups` | Yes | task group permissions | Department/all | `search`, `departmentId`, `isActive`, `page`, `limit` | Standard | No | No | `FORBIDDEN_DEPARTMENT_SCOPE` |
| GET | `/task-groups/:id` | Yes | task group permissions | Department/all | none | No | No | No | `TASK_GROUP_NOT_FOUND`, `TASK_GROUP_FORBIDDEN` |
| POST/DELETE | `/task-groups/:id/members` | Yes | task group permissions | Department/all | DTO/path | No | No | No | `TASK_GROUP_NOT_FOUND` |
| GET | `/employees/scoped` | Yes | employee read or task assign permissions | Department/all | `search`, `departmentId`, `isActive`, `page`, `limit` | Standard | No | No | `FORBIDDEN_DEPARTMENT_SCOPE` |
| POST | `/cross-department-requests` | Yes | `cross_department.create` | Source department | `CreateCrossDepartmentRequestDto` | No | No | `cross-department:updated` | `FORBIDDEN_DEPARTMENT_SCOPE` |
| GET | `/cross-department-requests` | Yes | cross department permissions | Source/target/all | query | No | No | No | `FORBIDDEN` |
| GET | `/cross-department-requests/:id` | Yes | cross department permissions | Requester/source/target/all | none | No | No | No | `CROSS_DEPARTMENT_REQUEST_NOT_FOUND`, `CROSS_DEPARTMENT_REQUEST_FORBIDDEN` |
| PATCH | `/cross-department-requests/:id/source-approve/source-reject/target-accept/target-reject` | Yes | cross department permissions | Source/target department | DTO optional | No | No | `cross-department:updated` | `CROSS_REQUEST_STATE_CONFLICT` |
| GET | `/notifications/me` | Yes | `notification.read` | Own | none | No | No | No | `FORBIDDEN` |
| GET | `/notifications/unread-count` | Yes | `notification.read` | Own | none | No | No | No | `FORBIDDEN` |
| PATCH | `/notifications/:id/read` | Yes | `notification.read` | Own target | none | No | No | `notification.created` | `NOTIFICATION_NOT_FOUND` |
| PATCH | `/notifications/read-all` | Yes | `notification.read` | Own | none | No | No | No | `FORBIDDEN` |
| POST/DELETE | `/notifications/device-tokens` | Yes | `device_token.manage_own` | Own | `RegisterDeviceTokenDto` | No | No | Push/device | `BAD_REQUEST` |

## Warehouse, Stock, Asset

| Method | Path | Auth | Permission | Scope | Request DTO | Pagination | Upload | Socket | Main errors |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/warehouses*` | Yes | warehouse permissions | Admin/warehouse manager | warehouse DTOs | No | No | `warehouse:*` | `WAREHOUSE_NOT_FOUND`, `FORBIDDEN_WAREHOUSE_SCOPE` |
| `/material-categories`, `/materials*` | Yes | material permissions | Warehouse/global | material DTOs | No | No | No | `MATERIAL_NOT_FOUND` |
| `/stock-receipts*` | Yes | stock permissions | Warehouse/global | stock DTOs | No | No | `warehouse:stock-updated` | `STOCK_RECEIPT_STATE_CONFLICT` |
| `/material-issues*` | Yes | material issue permissions | Department/warehouse/global | stock DTOs | No | No | `material:issue-updated` | `INSUFFICIENT_STOCK`, `MATERIAL_ISSUE_STATE_CONFLICT` |
| `/stock-transfers*` | Yes | stock transfer permissions | Warehouse/global | transfer DTOs | No | No | `warehouse:stock-updated` | `STOCK_TRANSFER_STATE_CONFLICT` |
| `/assets*`, `/asset-assignments*`, `/asset-incidents*`, `/asset-maintenance*` | Yes | asset permissions | Own/department/warehouse/global | asset DTOs | No | Evidence URL metadata | `asset:*` | `ASSET_NOT_FOUND`, `ASSET_ASSIGNMENT_NOT_FOUND` |
| `/inventory-checks*` | Yes | inventory check permissions | Warehouse/global | inventory DTOs | No | No | `warehouse:stock-updated` | `INVENTORY_CHECK_STATE_CONFLICT` |

## Payroll, Contract, KPI, Performance

| Method | Path | Auth | Permission | Scope | Request DTO | Pagination | Upload | Socket | Main errors |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/salary-profiles*`, `/salary-components*`, `/employee-salary-components` | Yes | salary permissions | HR/accounting/admin | salary DTOs | No | No | No | `SALARY_PROFILE_OVERLAP` |
| `/payroll-periods*`, `/payrolls*` | Yes | payroll permissions | Own/accounting/admin | payroll DTOs | No | No | `payroll:*` | `PAYROLL_STATE_CONFLICT`, `PAYROLL_LOCKED` |
| `/bonuses*`, `/deductions*`, `/violations*` | Yes | compensation/violation permissions | HR/accounting/admin | DTOs | No | Evidence URL metadata | notification | `NOT_FOUND`, `STATE_CONFLICT` |
| `/document-types*`, `/employee-documents*` | Yes | employee document permissions | Own/department metadata/all/sensitive | document DTOs | No | File URL metadata | `document:updated` | `EMPLOYEE_DOCUMENT_IDOR_DENIED`, `DOCUMENT_NUMBER_REQUIRED` |
| `/contract-templates*`, `/employee-contracts*` | Yes | contract permissions | Own/department/all | contract DTOs | No | File URL metadata/signature metadata | `contract:updated`, `contract:signature-required` | `CONTRACT_STATE_CONFLICT`, `CONTRACT_STATE_SKIP_DENIED`, `EMPLOYEE_CONTRACT_IDOR_DENIED` |
| `/kpi-templates*`, `/kpi-assignments*` | Yes | KPI permissions | Own/department/all | KPI DTOs | No | Evidence URL metadata | `kpi:assigned`, `kpi:updated` | `KPI_WEIGHT_TOTAL_INVALID`, `KPI_IDOR_DENIED` |
| `/review-cycles*`, `/performance-reviews*` | Yes | review permissions | Own/department/all | review DTOs | No | No | `performance-review:updated` | `PERFORMANCE_REVIEW_IDOR_DENIED`, `REVIEW_CYCLE_STATE_CONFLICT` |

## Phase 7 Operations

| Method | Path | Auth | Permission | Scope | Request DTO | Pagination | Upload | Socket | Main errors |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GET | `/dashboard/admin` | Yes | `dashboard.admin.read` | Global | none | No | No | No | `FORBIDDEN` |
| GET | `/dashboard/leader` | Yes | `dashboard.department.read` | Department scope | none | No | No | No | `FORBIDDEN_DEPARTMENT_SCOPE` |
| GET | `/dashboard/me` | Yes | `dashboard.own.read` | Own | none | No | No | No | `FORBIDDEN` |
| GET | `/reports/employees/attendance/tasks/payroll/warehouse/assets/kpi` | Yes | report permissions | Own/department/all | report query DTOs | Standard on large detail reports | No | No | `PAYROLL_REPORT_FORBIDDEN`, `FORBIDDEN_DEPARTMENT_SCOPE` |
| GET | `/exports/:report/csv` | Yes | `report.export.csv` | Same as report | report query DTOs | Max 5000 rows | Generated payload | No | `EXPORT_LIMIT_EXCEEDED` |
| GET | `/exports/:report/excel` | Yes | `report.export.excel` | Same as report | report query DTOs | Max 5000 rows | Generated payload | No | `EXPORT_LIMIT_EXCEEDED` |
| GET/POST | `/system-settings` | Yes | `system_setting.read/update` | Admin/HR policy | `UpsertSystemSettingDto` | No | No | No | `SECRET_SETTING_NOT_ALLOWED` |
| GET/PATCH | `/notification-preferences/me` | Yes | notification preference permissions | Own | `UpdateNotificationPreferenceDto` | No | No | No | `MANDATORY_NOTIFICATION_CANNOT_DISABLE` |
| GET/POST | `/jobs`, `/jobs/:jobName/run` | Yes | `job.read`, `job.run_manual` | Admin | none | No | No | notification reminders | `JOB_NOT_WHITELISTED`, `JOB_ALREADY_RAN` |
| GET | `/audit-logs` | Yes | `audit.read` | Admin/security | `AuditLogQueryDto` | Standard | No | No | `FORBIDDEN` |
| GET | `/health`, `/health/live`, `/health/ready` | No | Public | Process/database | none | No | No | No | `INTERNAL_SERVER_ERROR` |
