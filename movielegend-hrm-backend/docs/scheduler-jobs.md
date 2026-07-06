# Scheduler Jobs

Phase 7 adds scheduler architecture and manual job execution endpoints. A cron runner can call the same job service later.

## Jobs

- `task-due-soon`
- `task-overdue`
- `contract-expiry`
- `document-expiry`
- `payroll-payslip`
- `kpi-deadline`
- `asset-return`

## Deduplication

Notification reminders use `notifications.dedupKey`. Examples:

- `contract-expiry:{contractId}:{yyyy-mm-dd}`
- `document-expiry:{documentId}:{yyyy-mm-dd}`

This prevents hourly cron execution from sending duplicate reminders on the same day.

## Job Logs And Locks

`job_execution_logs.executionKey` is unique. Manual runs use `{jobName}:{yyyy-mm-dd}` to prevent duplicate concurrent runs for the same day.

## Render Assumption

Until a distributed scheduler is introduced, run the scheduler from a single instance. If multiple instances are required, add database advisory locks or a dedicated job lock table before enabling cron on all instances.
