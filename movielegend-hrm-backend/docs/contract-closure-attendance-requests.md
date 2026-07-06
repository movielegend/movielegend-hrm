# Attendance, Leave, OT, Employee Request Contract Closure

These endpoints close the Mobile Phase 3 blockers while keeping legacy report/action routes intact.

## Attendance

| Method | Path | Auth | Permission | Scope | Notes |
| --- | --- | --- | --- | --- | --- |
| GET | `/attendance/current` | Yes | `attendance.checkin` or `attendance.read` | Own current user | Returns `{ state, attendance }`, state is `NONE`, `CHECKED_IN`, or `CHECKED_OUT`. |
| GET | `/attendance/my` | Yes | `attendance.checkin` or `attendance.read` | Own current user | Query: `fromDate`, `toDate`, `status`, `page`, `limit`; returns standard pagination. |
| GET | `/attendance/:id` | Yes | `attendance.checkin` or `attendance.read` | Own / leader department / admin | Protects IDOR; detail omits internal face score/security debug. |
| GET | `/attendance/locations/active` | Yes | `attendance.checkin` or `attendance.read` | Relevant active locations | Does not expose WiFi secrets. |

`POST /attendance/check-in` now prefers `photoFileId` from `POST /uploads` with purpose `ATTENDANCE`. Legacy `faceImage` is temporarily accepted only when `photoFileId` is absent. `photoFileId` is validated for owner, purpose, `TEMPORARY` status, and non-deleted state, then attached in the same transaction as attendance creation.

## Leave

| Method | Path | Auth | Permission | Scope | Notes |
| --- | --- | --- | --- | --- | --- |
| GET | `/leave/types` | Yes | `leave.request`, `leave.balance.read`, or `leave.approve` | Active metadata | Returns active leave type fields from the real model. |

## Overtime

| Method | Path | Auth | Permission | Scope | Notes |
| --- | --- | --- | --- | --- | --- |
| GET | `/overtime/requests/my` | Yes | `overtime.request` or `overtime.approve` | Own current user | Query: `status`, `fromDate`, `toDate`, `page`, `limit`; standard pagination. |
| GET | `/overtime/requests/pending` | Yes | `overtime.approve` | Leader/Admin department scope | Returns pending requests without mobile-side employee filtering. |
| POST | `/overtime/requests/:id/reject` | Yes | `overtime.approve` | Leader/Admin department scope | Requires `reason`; rejects only `PENDING`; writes audit log and employee notification. |

## Employee Requests

| Method | Path | Auth | Permission | Scope | Notes |
| --- | --- | --- | --- | --- | --- |
| GET | `/employee-requests/my` | Yes | `employee.request` | Own current user | Query: `type`, `status`, `fromDate`, `toDate`, `page`, `limit`; standard pagination. |

`GET /employee-requests` remains the approver list endpoint for existing consumers.
