# Role Permission Matrix

Seed source: `prisma/seed.ts`. The `ADMIN` role receives all seeded permissions.

## ADMIN

Scope: global.

Modules: all modules, all dashboards, reports, settings, jobs, audit logs, exports.

## HR

Scope: global unless assigned otherwise.

Permissions:

- employee documents: read own/department/all/sensitive, create, verify;
- contracts: templates, create, read own/department/all, approve, company sign, terminate;
- KPI: template management, assign, read, self/leader/finalize;
- performance reviews: review cycle manage, read own/department/all, self/leader/finalize;
- dashboard/report/export: admin/department/own dashboard; employee, attendance, task, KPI reports; CSV/Excel export;
- system settings, audit, jobs, notifications.

Payroll/salary permissions are intentionally not granted to HR in seed.

## ACCOUNTANT

Scope: global/company policy.

Permissions:

- salary profiles/components;
- payroll periods and payroll workflow;
- bonuses, deductions, violation read, disciplinary action approval;
- payroll summary/detail reports;
- CSV/Excel export;
- notifications.

## WAREHOUSE_MANAGER

Scope: warehouse.

Permissions:

- warehouse read/update/manage;
- materials and stock operations;
- material issues approve/issue;
- assets assign/return/incident/maintenance;
- inventory checks;
- department dashboard for operational visibility;
- warehouse and asset reports/export;
- notifications/device tokens.

## LEADER

Scope: department.

Permissions:

- employee read and approval for own department;
- department read;
- face read;
- shift read/assign;
- attendance read;
- leave/overtime/employee request approval;
- task assign/read/review/extension/group in department;
- cross department source/target flow;
- material issue create/read;
- asset read and incident create;
- KPI read department and leader review;
- performance review read department and leader submit;
- department dashboard;
- employee/attendance/task/asset/KPI reports and CSV export;
- notifications/device tokens.

## EMPLOYEE

Scope: own.

Permissions:

- employee/department/face read;
- shift read/register/swap;
- attendance check-in/read/adjust;
- leave/overtime/employee requests;
- own tasks, comments, progress, submit, extension request;
- cross department create;
- asset read/return/incident create;
- own payroll read;
- own documents create/read;
- own contracts read/sign employee side;
- own KPI read/self review;
- own performance review read/self submit;
- own dashboard;
- notification preferences and device tokens.

## Audit Notes

- Role checks alone are insufficient. Resource detail APIs must also enforce owner, department, warehouse, or global scope in service logic.
- Seed creates `HR`, `ACCOUNTANT`, `WAREHOUSE_MANAGER`, `LEADER`, and `EMPLOYEE`; additional deployment-specific users should receive scoped `UserRole` rows.
