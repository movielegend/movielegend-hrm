# Mobile Task Flow

## Endpoints

- `GET /api/v1/tasks/me`
- `GET /api/v1/tasks/:id`
- `PATCH /api/v1/task-assignments/:id/accept`
- `PATCH /api/v1/task-assignments/:id/start`
- `PATCH /api/v1/task-assignments/:id/progress`
- `POST /api/v1/tasks/:id/comments`
- `POST /api/v1/tasks/:id/attachments`
- `PATCH /api/v1/task-assignments/:id/submit`
- `POST /api/v1/tasks/:id/extensions`

Leader review:

- `PATCH /api/v1/task-assignments/:id/approve`
- `PATCH /api/v1/task-assignments/:id/reject`
- `PATCH /api/v1/task-extensions/:id/approve`
- `PATCH /api/v1/task-extensions/:id/reject`

## Socket Events

Payloads are metadata-only and should include resource IDs and status.

- `task:assigned`
- `task:updated`
- `task:commented`
- `task:submitted`
- `task:reviewed`
- `notification.created`

## State Flow

`NEW -> ACCEPTED -> IN_PROGRESS -> WAITING_REVIEW -> COMPLETED`

Rejected assignments can be corrected and resubmitted according to service policy.

## Main Errors

- `TASK_NOT_FOUND`
- `TASK_ASSIGNMENT_NOT_FOUND`
- `TASK_ASSIGNMENT_MISMATCH`
- `FORBIDDEN_DEPARTMENT_SCOPE`
- `FORBIDDEN`
