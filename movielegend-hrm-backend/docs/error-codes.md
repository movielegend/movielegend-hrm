# Error Code Catalog

Frontend must branch on `error.code`, not localized `message`.

## Standard HTTP Codes

| Code | HTTP | Default message | When |
| --- | --- | --- | --- |
| `BAD_REQUEST` | 400 | Invalid request | Validation or malformed input without a module-specific code |
| `UNAUTHORIZED` | 401 | Unauthorized | Missing/expired access token |
| `FORBIDDEN` | 403 | Forbidden | Missing permission |
| `NOT_FOUND` | 404 | Not found | Resource missing without a module-specific code |
| `CONFLICT` | 409 | Conflict | Duplicate or state conflict without a module-specific code |
| `RATE_LIMITED` | 429 | Too many requests | Throttler blocked request |
| `INTERNAL_SERVER_ERROR` | 500 | Internal server error | Unhandled server failure |

## AUTH

| Code | HTTP | Message | When |
| --- | --- | --- | --- |
| `INVALID_CREDENTIALS` | 401 | Phone or password is invalid | Login failed |
| `ACCOUNT_PENDING_APPROVAL` | 403 | Account is pending approval | Login before approval |
| `ACCOUNT_REJECTED` | 403 | Account was rejected | Rejected account login |
| `ACCOUNT_SUSPENDED` | 403 | Account is suspended | Suspended account login |
| `INVALID_REFRESH_TOKEN` | 401 | Refresh token invalid | Refresh/logout with bad token |
| `REFRESH_SESSION_REVOKED` | 401 | Refresh session revoked | Reuse revoked session |

## USER / APPROVAL / DEPARTMENT

| Code | HTTP | Message | When |
| --- | --- | --- | --- |
| `DUPLICATE_PHONE` | 409 | Phone already exists | Register duplicate phone |
| `DUPLICATE_ID_CARD` | 409 | ID card already exists | Register duplicate CCCD |
| `USER_NOT_FOUND` | 404 | User not found | User lookup/update |
| `APPROVAL_NOT_FOUND` | 404 | Approval request not found | Approval action missing |
| `FORBIDDEN_DEPARTMENT_SCOPE` | 403 | Department out of scope | Leader accesses other department |
| `DEPARTMENT_MEMBER_NOT_FOUND` | 404 | Active department missing | Scope resolution |
| `USER_NOT_IN_DEPARTMENT` | 403 | User not in department | Assignment/review target invalid |
| `POSITION_NOT_FOUND` | 404 | Position not found | Position lookup |
| `DUPLICATE_POSITION_CODE` | 409 | Position code exists | Position create/update duplicate code |

## UPLOAD

| Code | HTTP | Message | When |
| --- | --- | --- | --- |
| `UPLOAD_FILE_REQUIRED` | 400 | File is required | Missing `file` field or incomplete face upload refs |
| `UPLOAD_PURPOSE_INVALID` | 400 | Upload purpose invalid | Missing or unsupported `purpose` |
| `UPLOAD_FILE_TOO_LARGE` | 400 | File too large | Size exceeds purpose policy |
| `UPLOAD_MIME_NOT_ALLOWED` | 400 | MIME or extension not allowed | File type outside purpose allowlist |
| `UPLOAD_SIGNATURE_INVALID` | 400 | File signature invalid | Content does not match MIME policy |
| `UPLOAD_UNAUTHORIZED` | 403 | Upload unauthorized | Missing token/permission or owner mismatch |
| `UPLOAD_STORAGE_FAILED` | 500 | Storage failed | Storage adapter failed to persist file |
| `UPLOAD_NOT_FOUND` | 404 | Upload not found | File reference is missing/deleted/wrong purpose |
| `UPLOAD_ALREADY_ATTACHED` | 400 | Upload already attached | Temporary file was already consumed |

## SHIFT / ATTENDANCE / LEAVE / OVERTIME

| Code | HTTP | Message | When |
| --- | --- | --- | --- |
| `SHIFT_NOT_FOUND` | 404 | Shift not found | Shift lookup |
| `SHIFT_ASSIGNMENT_NOT_FOUND` | 404 | Shift assignment not found | Check-in without shift |
| `SHIFT_INACTIVE` | 400 | Shift inactive | Check-in inactive shift |
| `TOO_EARLY_TO_CHECK_IN` | 400 | Outside check-in window | Check-in too early/late |
| `OUTSIDE_ATTENDANCE_RADIUS` | 400 | Outside GPS radius | GPS validation fails |
| `INVALID_WIFI` | 400 | WiFi invalid | WiFi validation fails |
| `FACE_VERIFICATION_FAILED` | 400 | Face verification failed | Attendance face mismatch |
| `ALREADY_CHECKED_IN` | 409 | Already checked in | Duplicate daily check-in |
| `NOT_CHECKED_IN` | 400 | Not checked in | Checkout before check-in |
| `ALREADY_CHECKED_OUT` | 409 | Already checked out | Duplicate checkout |
| `ATTENDANCE_NOT_FOUND` | 404 | Attendance not found | Attendance detail or adjustment target missing |
| `ATTENDANCE_FORBIDDEN` | 403 | Attendance forbidden | Attendance detail IDOR or out-of-scope access |
| `NO_CURRENT_ATTENDANCE` | 404 | No current attendance | Reserved for clients that require an open current record |
| `ATTENDANCE_PHOTO_REQUIRED` | 400 | Attendance photo required | Check-in without `photoFileId` or legacy face image |
| `ATTENDANCE_PHOTO_INVALID` | 400/404 | Attendance photo invalid | Missing/deleted/wrong-purpose/non-temporary upload |
| `ATTENDANCE_PHOTO_FORBIDDEN` | 403 | Attendance photo forbidden | Uploaded file belongs to another user |
| `ATTENDANCE_LOCATION_NOT_FOUND` | 404 | Attendance location not found | Reserved for location lookup failures |
| `LEAVE_TYPE_NOT_FOUND` | 404 | Leave type not found | Leave request invalid type |
| `OVERTIME_REQUEST_NOT_FOUND` | 404 | Overtime request not found | Overtime lookup/action target missing |
| `OVERTIME_REQUEST_INVALID_STATE` | 400 | Overtime invalid state | Approve/reject request that is not pending |
| `OVERTIME_REQUEST_FORBIDDEN` | 403 | Overtime forbidden | Reserved for overtime IDOR/scope denial |
| `EMPLOYEE_REQUEST_NOT_FOUND` | 404 | Employee request not found | Employee request lookup/action target missing |
| `EMPLOYEE_REQUEST_FORBIDDEN` | 403 | Employee request forbidden | Reserved for employee request IDOR/scope denial |

## TASK / CROSS_DEPARTMENT

| Code | HTTP | Message | When |
| --- | --- | --- | --- |
| `TASK_TARGET_EMPTY` | 400 | Task has no assignee | Create task with empty target |
| `TASK_NOT_FOUND` | 404 | Task not found | Task lookup |
| `TASK_FORBIDDEN` | 403 | Task forbidden | Task IDOR or missing scope |
| `TASK_ASSIGNMENT_NOT_FOUND` | 404 | Assignment not found | Assignment action |
| `TASK_ASSIGNMENT_MISMATCH` | 400 | Assignment does not belong to task | Extension mismatch |
| `TASK_REVIEW_FORBIDDEN` | 403 | Task review forbidden | Reviewer has no assignment review scope |
| `TASK_GROUP_NOT_FOUND` | 404 | Task group not found | Task group lookup |
| `TASK_GROUP_FORBIDDEN` | 403 | Task group forbidden | Task group outside department scope |
| `TASK_EXTENSION_NOT_FOUND` | 404 | Task extension not found | Extension lookup |
| `TASK_EXTENSION_FORBIDDEN` | 403 | Task extension forbidden | Extension outside review scope |
| `CROSS_DEPARTMENT_REQUEST_NOT_FOUND` | 404 | Cross-department request not found | Cross-department lookup |
| `CROSS_DEPARTMENT_REQUEST_FORBIDDEN` | 403 | Cross-department request forbidden | Unrelated employee or out-of-scope leader |
| `CROSS_REQUEST_STATE_CONFLICT` | 409 | Cross request already changed | Concurrent approval/receive |

## WAREHOUSE / STOCK / ASSET

| Code | HTTP | Message | When |
| --- | --- | --- | --- |
| `WAREHOUSE_NOT_FOUND` | 404 | Warehouse not found | Warehouse lookup |
| `FORBIDDEN_WAREHOUSE_SCOPE` | 403 | Warehouse out of scope | Warehouse manager wrong warehouse |
| `MATERIAL_NOT_FOUND` | 404 | Material not found | Material lookup |
| `INSUFFICIENT_STOCK` | 409 | Insufficient stock | Stock issue/transfer |
| `STOCK_RECEIPT_STATE_CONFLICT` | 409 | Receipt state changed | Double approval/cancel |
| `MATERIAL_ISSUE_STATE_CONFLICT` | 409 | Issue state changed | Double issue/approval |
| `STOCK_TRANSFER_STATE_CONFLICT` | 409 | Transfer state changed | Double ship/receive |
| `ASSET_NOT_FOUND` | 404 | Asset not found | Asset lookup |
| `ASSET_ASSIGNMENT_NOT_FOUND` | 404 | Assignment not found | Asset assignment action |
| `INVENTORY_CHECK_STATE_CONFLICT` | 409 | Inventory state changed | Double submit/approve |

## PAYROLL / CONTRACT / KPI

| Code | HTTP | Message | When |
| --- | --- | --- | --- |
| `SALARY_PROFILE_OVERLAP` | 409 | Salary profile overlap | Duplicate effective profile |
| `PAYROLL_STATE_CONFLICT` | 409 | Payroll state changed | Concurrent payroll action |
| `PAYROLL_LOCKED` | 409 | Payroll locked | Mutating locked payroll |
| `EMPLOYEE_DOCUMENT_IDOR_DENIED` | 403 | Cannot read this document | Document IDOR attempt |
| `DOCUMENT_NUMBER_REQUIRED` | 400 | Document number required | Type requires number |
| `DOCUMENT_EXPIRY_REQUIRED` | 400 | Expiry required | Type requires expiry |
| `CONTRACT_STATE_CONFLICT` | 409 | Contract state changed | Double approve/sign/activate |
| `CONTRACT_STATE_SKIP_DENIED` | 400 | Invalid state transition | Skipping contract workflow |
| `EMPLOYEE_CONTRACT_IDOR_DENIED` | 403 | Cannot read this contract | Contract IDOR attempt |
| `KPI_WEIGHT_TOTAL_INVALID` | 400 | Criteria weights must equal 100 | Assign KPI invalid template |
| `KPI_IDOR_DENIED` | 403 | Cannot read this KPI | KPI IDOR attempt |
| `KPI_FINALIZED_IMMUTABLE` | 400 | Finalized KPI cannot change | Mutating finalized KPI |

## REPORT / EXPORT / SETTING / JOB

| Code | HTTP | Message | When |
| --- | --- | --- | --- |
| `PAYROLL_REPORT_FORBIDDEN` | 403 | Cannot access payroll report | Missing payroll report permission |
| `EXPORT_LIMIT_EXCEEDED` | 400 | Export too large | More than max rows |
| `SECRET_SETTING_NOT_ALLOWED` | 403 | Secret must stay in env | Setting key resembles secret |
| `MANDATORY_NOTIFICATION_CANNOT_DISABLE` | 400 | Mandatory notification cannot be disabled | User disables mandatory in-app notification |
| `JOB_NOT_WHITELISTED` | 400 | Job is not allowed | Manual job name not whitelisted |
| `JOB_ALREADY_RAN` | 409 | Job already ran | Duplicate execution key |
