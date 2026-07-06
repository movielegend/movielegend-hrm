# Frontend Screen Matrix

## ADMIN

| Screen | APIs | Permission | Socket | Main errors |
| --- | --- | --- | --- | --- |
| Dashboard | `/dashboard/admin` | `dashboard.admin.read` | notification | `FORBIDDEN` |
| Employees | `/admin/users`, `/employees/:id` | `user.read`, `employee.read` | notification | `USER_NOT_FOUND` |
| Approvals | `/approvals/accounts` | approval permissions | notification | `FORBIDDEN_DEPARTMENT_SCOPE` |
| Departments | `/departments` | department permissions | none | `DEPARTMENT_NOT_FOUND` |
| Shifts/Attendance | `/shifts`, `/shift-assignments`, `/attendance` | shift/attendance permissions | none | attendance errors |
| Tasks | `/tasks` | task permissions | task events | task errors |
| Warehouse/Assets | warehouse, stock, asset APIs | warehouse/asset permissions | warehouse/asset events | stock/asset errors |
| Payroll | payroll APIs | payroll permissions | payroll events | payroll errors |
| Contracts/KPI | contract/KPI APIs | contract/KPI permissions | contract/KPI events | state conflicts |
| Reports/Settings | `/reports`, `/exports`, `/system-settings`, `/audit-logs`, `/jobs` | report/export/setting/audit/job | notification | export/job errors |

## LEADER

| Screen | APIs | Permission | Socket | Main errors |
| --- | --- | --- | --- | --- |
| Dashboard | `/dashboard/leader` | `dashboard.department.read` | department notifications | `FORBIDDEN_DEPARTMENT_SCOPE` |
| Department Employees | `/reports/employees`, `/employees/:id` | `employee.read`, report permissions | none | `USER_NOT_IN_DEPARTMENT` |
| Approvals | `/approvals/accounts` | approval permissions | notification | approval errors |
| Shift Assignment | `/shift-assignments` | `shift.assign` | none | scope errors |
| Attendance | `/attendance`, reports | `attendance.read` | none | attendance errors |
| Tasks | `/tasks`, `/task-assignments` | task department permissions | task events | task errors |
| Leave/OT Approval | `/leave-requests`, `/overtime-requests` | approval permissions | notification | scope errors |
| Assets Department | asset APIs/reports | asset/report permissions | asset events | asset errors |
| KPI Review | `/kpi-assignments/department/:departmentId` | `kpi.leader_review` | KPI events | `KPI_IDOR_DENIED` |

## EMPLOYEE

| Screen | APIs | Permission | Socket | Main errors |
| --- | --- | --- | --- | --- |
| Home | `/dashboard/me` | `dashboard.own.read` | notification | `UNAUTHORIZED` |
| Attendance | `/attendance/check-in`, `/attendance/check-out` | `attendance.checkin` | notification | attendance errors |
| Schedule | `/shift-assignments/me` | authenticated | none | `UNAUTHORIZED` |
| Tasks | `/tasks/me`, task assignment actions | own task permissions | task events | task errors |
| Requests | leave/OT/employee request APIs | own request permissions | notification | validation errors |
| Payslip | `/payrolls/my` | `payroll.read_own` | payroll events | payroll visibility errors |
| Assets | `/assets/my`, assignment actions | asset own permissions | asset events | asset errors |
| Contracts | `/employee-contracts/my`, sign employee | `contract.read_own` | contract events | contract errors |
| KPI | `/kpi-assignments/my` | `kpi.read_own`, `kpi.self_review` | KPI events | KPI errors |
| Notifications/Profile | notification APIs, auth/me | notification/profile permissions | notification | token errors |
