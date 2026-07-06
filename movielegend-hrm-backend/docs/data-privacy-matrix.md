# Data Privacy Matrix

| Data | Classification | Default access | Notes |
| --- | --- | --- | --- |
| `userCode`, full name, department, position | Company internal | Admin, HR, leader department, self | Safe for employee lists |
| Phone, email | Company restricted | Admin, HR, leader department if policy allows, self | Avoid broad exports unless needed |
| CCCD / `idCardNumber` | HR sensitive | Admin, HR, self where policy allows | Do not export by default |
| Bank accounts | Accounting sensitive | Admin, accountant, self where policy allows | Do not include in employee report |
| Salary profile/payroll amounts | Accounting sensitive | Admin, accountant, self payslip | Dashboard should not expose amount |
| Contract salary snapshot | HR/accounting sensitive | Admin, HR, contract owner | Avoid department broadcast |
| Employee document number/file URL | HR sensitive | Admin/HR/sensitive permission, self | Leader gets metadata only by default |
| `storageKey` | Internal | Backend/admin only | Frontend normally needs `fileUrl`, not internal key |
| Signature raw data/image URL | HR sensitive | Contract workflow participants | Do not log raw signature data |
| Refresh token/token hash/device token hash | Security secret | Backend only | Never return to list APIs |
| Audit metadata | Admin/security | `audit.read` only | Avoid raw sensitive values in metadata |
| Location tracking | Personal sensitive | Admin/HR/leader department by policy, self history | Retention policy required |
| Stock transactions and asset history | Business history | Admin/warehouse manager | Do not hard delete |

## Endpoint Audit Highlights

- Employee report returns `userCode`, name, department, position, join date, employment/account status only.
- Payroll dashboard returns counts/status, not amounts.
- Employee document serialization masks `documentNumber` unless actor has sensitive permission or owns the document.
- Socket events added in Phase 6/7 emit metadata-only payloads.
- Export service has max row limit and safe filenames.
