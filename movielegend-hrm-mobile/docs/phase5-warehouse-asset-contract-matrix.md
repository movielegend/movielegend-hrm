# Phase 5 Warehouse/Asset Contract Matrix

Source of truth: actual backend controllers/DTOs/services in `movielegend-hrm-backend/src/modules/{warehouse,materials,stock,assets,inventory-checks}` (đọc ngày 2026-07-06). Docs (`api-inventory.md`) khớp với code.

Base path: `/api/v1`. Response envelope: `{ success, data }`. Mọi list endpoint của domain này trả **array thuần, không pagination, không query filter** — mobile normalize qua `normalizePagination`.

Lưu ý serialize: các field Prisma `Decimal` (`quantityOnHand`, `quantity`, `unitCost`, `minimumStock`, …) trả về dưới dạng **string** trong JSON. Mobile dùng helper `toQuantity()` để hiển thị/tính toán, backend vẫn là source of truth cho validation.

## Endpoints

### Warehouses
| Method | Path | Permission | Scope thật (service) |
|---|---|---|---|
| POST | `/warehouses` | `warehouse.create` | — |
| GET | `/warehouses` | any: `warehouse.read`, `warehouse.manage`, `stock.read` | ADMIN: all; khác: chỉ warehouse có scope WAREHOUSE_MANAGER |
| GET | `/warehouses/:id` | như trên | `assertWarehouseAccess` (ADMIN hoặc WM scope) |
| PATCH | `/warehouses/:id` | `warehouse.update` | WM scope |
| DELETE | `/warehouses/:id` (close/soft-delete) | `warehouse.manage` | WM scope |
| GET | `/warehouses/:id/stocks` | `stock.read` | WM scope; include `material.category` |

### Materials
| Method | Path | Permission |
|---|---|---|
| POST | `/material-categories` | `material.create` |
| GET | `/material-categories` | `material.read` |
| POST | `/materials` | `material.create` (materialCode optional — backend tự sinh `MAT-…`) |
| GET | `/materials` | `material.read` (include category) |
| GET | `/materials/:id` | `material.read` |
| PATCH | `/materials/:id` | `material.update` |

### Stock receipts (`StockReceiptStatus`: DRAFT/PENDING/APPROVED/CANCELLED; default PENDING)
| Method | Path | Permission | Ghi chú |
|---|---|---|---|
| POST | `/stock-receipts` | `stock.import` | 1 call gồm items[]; warehouse scope enforced |
| GET | `/stock-receipts` | `stock.read` | scoped theo warehouse; include items + warehouse |
| GET | `/stock-receipts/:id` | `stock.read` | include items |
| POST | `/stock-receipts/:id/approve` | `stock.import` | PENDING → APPROVED, cộng stock, emit `warehouse:stock-updated` |
| POST | `/stock-receipts/:id/cancel` | `stock.import` | PENDING → CANCELLED |

### Material issues (`MaterialIssueStatus`: DRAFT/PENDING/APPROVED/REJECTED/ISSUING/COMPLETED/CANCELLED; default PENDING)
| Method | Path | Permission | Ghi chú |
|---|---|---|---|
| POST | `/material-issues` | any: `material_issue.create`, `stock.export` | **service vẫn assertWarehouseAccess** → thực tế chỉ ADMIN/WM tạo được (xem Blockers) |
| GET | `/material-issues` | `material_issue.read` | scoped theo warehouse của actor (employee/leader nhận mảng rỗng) |
| GET | `/material-issues/:id` | `material_issue.read` | cho phép owner (`issuedToUserId`) hoặc department scope |
| POST | `/material-issues/:id/approve` | `material_issue.approve` | PENDING → APPROVED |
| POST | `/material-issues/:id/reject` | `material_issue.approve` | body `{ reason? }` |
| POST | `/material-issues/:id/issue` | `material_issue.issue` | APPROVED → ISSUING → COMPLETED (một call), trừ stock, emit `material:issue-updated` |
| POST | `/material-issues/:id/cancel` | any: `material_issue.create`, `material_issue.approve` | PENDING/APPROVED → CANCELLED |

### Material returns
**KHÔNG có controller/route nào ở backend** (chỉ có model `MaterialReturn` trong Prisma). → Không build UI, xem Blockers.

### Stock transfers (`StockTransferStatus`: DRAFT/PENDING/APPROVED/SHIPPED/IN_TRANSIT/COMPLETED/CANCELLED; default PENDING; backend dùng PENDING→APPROVED→IN_TRANSIT→COMPLETED)
| Method | Path | Permission | Ghi chú |
|---|---|---|---|
| POST | `/stock-transfers` | `stock.transfer` | validate source != target (`TRANSFER_SAME_WAREHOUSE`); source scope |
| GET | `/stock-transfers` | `stock.read` | scoped: source hoặc target trong scope |
| POST | `/stock-transfers/:id/approve` | `stock.transfer` | source scope |
| POST | `/stock-transfers/:id/ship` | `stock.transfer` | APPROVED → IN_TRANSIT, trừ stock nguồn |
| POST | `/stock-transfers/:id/receive` | `stock.transfer` | IN_TRANSIT → COMPLETED, cộng stock đích (duplicate receive → `STOCK_TRANSFER_NOT_IN_TRANSIT` 409) |
| POST | `/stock-transfers/:id/cancel` | `stock.transfer` | PENDING/APPROVED → CANCELLED |

**Không có GET `/stock-transfers/:id`** → mobile detail đọc từ cache của list query (documented limitation).

### Assets
| Method | Path | Permission | Ghi chú |
|---|---|---|---|
| POST | `/asset-categories` | `asset.create` | **không có GET** (xem Blockers) |
| POST | `/assets` | `asset.create` | assetCode optional (tự sinh `AST-…`); DTO chỉ nhận: categoryId, warehouseId?, assetCode?, name, brand?, model?, serialNumber? — **không nhận purchaseDate/purchasePrice/warrantyEndDate/condition/description** dù model có (xem Blockers) |
| GET | `/assets` | `asset.read` | ADMIN: all; khác: asset đang assign cho mình hoặc department mình thấy; include assignments |
| GET | `/assets/my` | `asset.read` | trả `AssetAssignment[]` (ACTIVE/PENDING_CONFIRMATION/RETURN_REQUESTED) + `asset{assetCode,name,serialNumber,conditionStatus,assetStatus,incidents(OPEN/INVESTIGATING)}` |
| GET | `/assets/:id` | `asset.read` | owner/department/ADMIN; include assignments + incidents |
| PATCH | `/assets/:id` | `asset.create` | name/conditionStatus/assetStatus |
| POST | `/assets/:id/assign` | `asset.assign` | target USER **hoặc** DEPARTMENT (đúng 1); asset phải IN_STOCK; notify + emit `asset:assigned` |
| POST | `/assets/:id/incidents` | `asset.incident.create` | body: incidentType, description, evidenceUrl?; DAMAGED → asset DAMAGED; LOST/STOLEN → asset LOST |
| POST | `/assets/:id/maintenance` | `asset.maintenance.manage` | asset IN_STOCK/DAMAGED → MAINTENANCE; trả maintenance record |

### Asset assignments
| Method | Path | Permission | Ghi chú |
|---|---|---|---|
| POST | `/asset-assignments/:id/confirm` | `asset.return` | chỉ `assignedToUserId` === actor; PENDING_CONFIRMATION → ACTIVE, asset → IN_USE |
| POST | `/asset-assignments/:id/request-return` | `asset.return` | owner only; ACTIVE → RETURN_REQUESTED; **không nhận body/reason** |
| POST | `/asset-assignments/:id/receive-return` | `asset.return` | warehouse scope (asset.warehouseId); body `{ conditionWhenReturned, note? }`; DAMAGED → asset MAINTENANCE, còn lại IN_STOCK |

### Asset incidents (`AssetIncidentStatus`: OPEN/INVESTIGATING/RESOLVED/REJECTED)
| Method | Path | Permission | Ghi chú |
|---|---|---|---|
| GET | `/asset-incidents` | `asset.incident.read` | **global, không filter, không scope** |
| GET | `/asset-incidents/:id` | `asset.incident.read` | include asset |
| POST | `/asset-incidents/:id/investigate` | `asset.incident.resolve` | → INVESTIGATING |
| POST | `/asset-incidents/:id/resolve` | `asset.incident.resolve` | body `{ assetStatus?, resolutionNote? }`; default: DAMAGED→MAINTENANCE, khác→LOST |
| POST | `/asset-incidents/:id/reject` | `asset.incident.resolve` | → REJECTED |

### Asset maintenance
| Method | Path | Permission |
|---|---|---|
| POST | `/asset-maintenance/:id/complete` | `asset.maintenance.manage` — body `{ conditionWhenReturned, note? }`; DAMAGED → asset DISPOSED, khác → IN_STOCK |

**Không có GET list/detail cho maintenance records** (xem Blockers).

### Inventory checks (`InventoryCheckStatus`: DRAFT/IN_PROGRESS/SUBMITTED/APPROVED/CANCELLED; default IN_PROGRESS)
| Method | Path | Permission | Ghi chú |
|---|---|---|---|
| POST | `/inventory-checks` | `inventory_check.create` | snapshot toàn bộ stock + assets của warehouse thành items |
| GET | `/inventory-checks` | `inventory_check.read` | warehouse scoped |
| GET | `/inventory-checks/:id` | `inventory_check.read` | include items |
| PATCH | `/inventory-checks/:id/items` | `inventory_check.submit` | body `{ items: [{ id, actualQuantity?, actualAssetStatus?, note? }] }`; chỉ khi IN_PROGRESS; backend tự tính difference |
| POST | `/inventory-checks/:id/submit` | `inventory_check.submit` | IN_PROGRESS → SUBMITTED (không đụng stock) |
| POST | `/inventory-checks/:id/approve` | `inventory_check.approve` | SUBMITTED → APPROVED; apply ADJUSTMENT_INCREASE/DECREASE + asset status; emit `inventory:updated` |

## Enums (Prisma — actual)
- `AssetStatus`: IN_STOCK, ASSIGNED, IN_USE, MAINTENANCE, LOST, DAMAGED, DISPOSED, TRANSFER_PENDING
- `AssetConditionStatus`: NEW, GOOD, FAIR, POOR, DAMAGED
- `AssetAssignmentStatus`: PENDING_CONFIRMATION, ACTIVE, RETURN_REQUESTED, RETURNED, CANCELLED
- `AssetIncidentType`: DAMAGED, LOST, STOLEN, MALFUNCTION, OTHER
- `AssetIncidentStatus`: OPEN, INVESTIGATING, RESOLVED, REJECTED
- `AssetMaintenanceStatus`: PLANNED, IN_PROGRESS, COMPLETED, CANCELLED
- `MaterialIssueTargetType`: USER, DEPARTMENT
- Stock/receipt/issue/transfer/inventory statuses như bảng trên.

## Error codes (actual, dùng cho error map mobile)
`WAREHOUSE_NOT_FOUND`, `FORBIDDEN_WAREHOUSE_SCOPE`, `MATERIAL_NOT_FOUND`, `MATERIAL_CODE_DUPLICATED`, `INSUFFICIENT_STOCK`, `INVALID_STOCK_QUANTITY`, `STOCK_RECEIPT_NOT_FOUND`, `STOCK_RECEIPT_ALREADY_PROCESSED`, `MATERIAL_ISSUE_NOT_FOUND`, `MATERIAL_ISSUE_ALREADY_PROCESSED`, `MATERIAL_ISSUE_NOT_APPROVED`, `MATERIAL_ISSUE_FORBIDDEN`, `ISSUE_TARGET_REQUIRED`, `TRANSFER_SAME_WAREHOUSE`, `STOCK_TRANSFER_NOT_FOUND`, `STOCK_TRANSFER_ALREADY_PROCESSED`, `STOCK_TRANSFER_NOT_APPROVED`, `STOCK_TRANSFER_NOT_IN_TRANSIT`, `ASSET_NOT_FOUND`, `ASSET_FORBIDDEN`, `ASSET_NOT_ASSIGNABLE`, `ASSET_ALREADY_ASSIGNED`, `ASSET_ASSIGNMENT_NOT_FOUND`, `ASSET_ASSIGNMENT_OWNER_ONLY`, `ASSET_ASSIGNMENT_ALREADY_PROCESSED`, `ASSET_ASSIGNMENT_NOT_ACTIVE`, `ASSET_RETURN_NOT_ALLOWED`, `ASSET_ASSIGNMENT_TARGET_REQUIRED`, `ASSET_ASSIGNMENT_TARGET_INVALID`, `ASSET_INCIDENT_NOT_FOUND`, `ASSET_MAINTENANCE_NOT_ALLOWED`, `ASSET_MAINTENANCE_NOT_FOUND`, `INVENTORY_CHECK_NOT_FOUND`, `INVENTORY_CHECK_NOT_EDITABLE`, `INVENTORY_CHECK_NOT_SUBMITTABLE`, `INVENTORY_CHECK_NOT_SUBMITTED`, `INVENTORY_CHECK_ITEM_NOT_FOUND`.

(Ghi chú: các code trong đề bài như `WAREHOUSE_FORBIDDEN`, `STOCK_OPERATION_INVALID`, `MATERIAL_ISSUE_INVALID_STATE`, `ASSET_NOT_AVAILABLE`, `ASSET_ASSIGNMENT_FORBIDDEN`, `ASSET_INCIDENT_FORBIDDEN`, `INVENTORY_CHECK_INVALID_STATE` **không tồn tại** trong backend — dùng code actual ở trên.)

## Socket events (actual emit từ backend)
- `asset:assigned` → room `user:{assignedToUserId}` (assign + confirm)
- `asset:return-updated`, `asset:incident-updated` → emit qua `emitToRoom` với room = tên event (backend đặt room như vậy — client không join các room này nên thực tế không nhận được; documented)
- `warehouse:stock-updated`, `material:issue-updated`, `inventory:updated` → room `warehouse:{id}` (client phải emit `warehouse:join`)

## Notifications thật sự được backend tạo
- `ASSET_ASSIGNED` (metadata: assetId, assignmentId)
- `MATERIAL_ISSUE_REQUESTED` / `MATERIAL_ISSUE_APPROVED` / `MATERIAL_ISSUED` (metadata: issueId)
- Các type `ASSET_RETURN_*`, `ASSET_INCIDENT_*`, `STOCK_TRANSFER_*` tồn tại trong enum nhưng service hiện **không** tạo notification cho chúng.

## Role → permission (seed thật)
- EMPLOYEE: `material.read`, `material_issue.create`, `material_issue.read`, `asset.read`, `asset.return`, `asset.incident.create`
- LEADER: EMPLOYEE-ish + `stock.read`, `inventory_check.read` (KHÔNG có `asset.return`, KHÔNG có `asset.incident.read`)
- WAREHOUSE_MANAGER (scope WAREHOUSE): `warehouse.read/update/manage`, `material.read`, `stock.*`, `material_issue.read/approve/issue`, `asset.read/assign/return`, `asset.incident.read/resolve`, `asset.maintenance.manage`, `inventory_check.*`
- ADMIN: tất cả.

## BACKEND BLOCKERS / LIMITATIONS (không tự sửa backend, không fake workaround)

| # | Endpoint/behavior | Expected (spec) | Actual | Impact | Recommended backend change |
|---|---|---|---|---|---|
| B1 | `GET /asset-categories` | Cần cho selector khi Admin tạo asset | Chỉ có POST | Admin Create Asset không có danh sách category để chọn; form yêu cầu nhập categoryId (UUID) thủ công | Thêm `GET /asset-categories` (permission `asset.read`) |
| B2 | `GET /asset-maintenance` (list/detail) | Maintenance list screen (asset, type, vendor, dates, status, cost) | Không có GET nào | Mobile chỉ hiển thị asset đang MAINTENANCE (từ `GET /assets`) và chỉ complete được record vừa start trong session (id cache từ response start) | Thêm `GET /asset-maintenance?assetId=&status=` |
| B3 | `POST /material-issues` service `assertWarehouseAccess` | Employee/Leader request vật tư | Employee/Leader bị 403 `FORBIDDEN_WAREHOUSE_SCOPE` dù seed cấp `material_issue.create` | Employee/Leader không thể tạo material issue request; flow "leader request vật tư" chết | Bỏ warehouse-scope check ở create (requester scope), giữ approve/issue theo warehouse |
| B4 | `GET /material-issues` scope | Employee thấy own issues, Leader thấy department issues | Chỉ scope theo warehouse của actor → employee/leader nhận `[]` (dù GET :id cho phép owner/department xem) | List "own/department issues" luôn rỗng | Mở rộng where: `OR: [{warehouse scope}, {issuedToUserId: actor}, {issuedToDepartmentId in visibleDepartments}]` |
| B5 | Material returns | Flow create → receive | Không có route nào | Không build Material Return UI (rule: không đoán endpoint) | Thêm controller `/material-returns` (create/receive/list) |
| B6 | `GET /stock-transfers/:id` | Transfer detail | Không có | Detail screen đọc từ cache list; deep-link trực tiếp vào transfer không refetch được riêng lẻ | Thêm GET :id |
| B7 | `GET /asset-incidents` | Filter status/type/assetId/departmentId + phân trang + scope | Global list, không filter, không scope; employee/leader không có `asset.incident.read` | Employee không xem được "own incident history"; Leader không xem được department incidents; filter chỉ làm client-side trên dữ liệu backend trả về (WM/Admin) | Thêm query filters + scope own/department; cấp quyền đọc giới hạn |
| B8 | `CreateAssetDto` thiếu field | Form create: purchaseDate, purchasePrice, warrantyEndDate, condition, description | DTO chỉ nhận categoryId/warehouseId/assetCode/name/brand/model/serialNumber | Không gửi được các field kia (whitelist ValidationPipe sẽ 400 `forbidNonWhitelisted`) → form mobile chỉ có field DTO thật | Mở rộng CreateAssetDto |
| B9 | Upload evidence `ASSET_INCIDENT` | fileId gắn vào incident | Incident DTO chỉ nhận `evidenceUrl` string; backend không attach file (file ở status TEMPORARY vĩnh viễn → job cleanup có thể xóa) | Evidence có nguy cơ bị cleanup job xóa | Nhận `evidenceFileId` và attach như flow FACE_REGISTRATION |
| B10 | List pagination/filters | `page`, `limit`, search cho list lớn | Tất cả list endpoints domain này trả full array | Mobile normalize array→PaginatedResult; filter client-side trên dữ liệu đầy đủ backend trả (không phải fake scope) | Thêm pagination params dần |
| B11 | Rooms `asset:return-updated` / `asset:incident-updated` | Realtime cho WM/Admin | Backend `emitToRoom(room = event-name)` nhưng gateway không cho client join room đó | Client không nhận 2 event này; mobile invalidate qua REST refetch/foreground; `asset:assigned` (user room) và `warehouse:*` (join warehouse) hoạt động | Emit về room `warehouse:{id}` hoặc user room |

## Quyết định UI theo permission (không hard-code role, trừ top-level shell)
- Employee: My Assets (`/assets/my`), asset detail, confirm/request-return (`asset.return`), incident report (`asset.incident.create`), material-issues list (B4 → thường rỗng) + detail.
- Leader: assets list (`GET /assets` — backend tự scope), detail; material issues list/detail (B4); incidents ẩn (không có `asset.incident.read`).
- WM: shell `/warehouse` (role WAREHOUSE_MANAGER), mọi action theo permission + warehouse scope backend.
- Admin: `/admin/*` screens, global.
- `purchasePrice`/`cost` chỉ hiển thị khi có `asset.create` hoặc `asset.maintenance.manage`.
