# Task, Cross Department, Notification Contract Matrix

Source of truth checked on 2026-07-06:

- Backend docs: `docs/api-inventory.md`, `docs/error-codes.md`, `docs/mobile-task-flow.md`, `docs/socket-events.md`, `docs/notification-navigation-map.md`
- Backend source: task, task assignment, task extension, task group, cross-department, notification controllers/DTOs, realtime gateway

## Implemented Mobile Routes

- `GET /tasks`, `GET /tasks/me`, `GET /tasks/:id`
- `POST /tasks`, `PATCH /tasks/:id`, `PATCH /tasks/:id/cancel`
- `PATCH /task-assignments/:id/accept|start|progress|submit|approve|reject`
- `POST /tasks/:id/comments`
- `POST /tasks/:id/attachments`
- `POST /tasks/:id/extensions`
- `PATCH /task-extensions/:id/approve|reject`
- `GET/POST /task-groups`
- `POST /task-groups/:id/members`
- `DELETE /task-groups/:id/members/:userId`
- `GET/POST /cross-department-requests`
- `PATCH /cross-department-requests/:id/source-approve|source-reject|target-accept|target-reject`
- `GET /notifications/me`
- `GET /notifications/unread-count`
- `PATCH /notifications/:id/read`
- `PATCH /notifications/read-all`
- `POST /notifications/device-tokens`
- `DELETE /notifications/device-tokens/:id`

## Closure Status

Resolved by backend contract closure:

- Task list filters and standard pagination on `/tasks` and `/tasks/me`.
- Dedicated `/task-assignments/review-queue`.
- Dedicated `/tasks/:id/timeline`.
- Dedicated `/task-extensions/pending`.
- Dedicated `/task-groups/:id`.
- Dedicated `/cross-department-requests/:id`.
- Lightweight scoped employee selector at `/employees/scoped`.
- Task detail includes safe creator, assignments, comments, attachments, histories, extension summary and target display names.

Known intentional contract note:

- Task attachment attach still uses backend's current metadata DTO (`fileName`, `fileUrl`, `storageKey`, `mimeType`, `sizeBytes`) after upload. There is still no task attachment `fileId` field in backend schema.
- Socket event source of truth remains `notification.created`, not `notification:new`.
