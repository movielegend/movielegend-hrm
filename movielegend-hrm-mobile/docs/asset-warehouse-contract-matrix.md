# Asset And Warehouse Contract Matrix

Source checked on 2026-07-06:

- Backend docs: `docs/api-inventory.md`, `docs/error-codes.md`, `docs/socket-events.md`
- Swagger source: Nest Swagger decorators on actual controllers
- Controllers and DTOs:
  - `src/modules/assets/assets.controller.ts`
  - `src/modules/assets/dto/asset.dto.ts`
  - `src/modules/warehouse/warehouses.controller.ts`
  - `src/modules/warehouse/dto/warehouse.dto.ts`
  - `src/modules/materials/materials.controller.ts`
  - `src/modules/materials/dto/material.dto.ts`
  - `src/modules/stock/stock.controller.ts`
  - `src/modules/stock/dto/stock.dto.ts`
  - `src/modules/inventory-checks/inventory-checks.controller.ts`
  - `src/modules/inventory-checks/dto/inventory-check.dto.ts`

## Matrix

| Domain | Mobile API | Backend route | Permission | Scope rule |
| --- | --- | --- | --- | --- |
| My assets | `getMyAssets` | `GET /assets/my` | `asset.read` | Backend returns only current user assignments |
| Asset detail | `getAsset` | `GET /assets/:id` | `asset.read` | Backend owner/department/admin scope |
| Asset assignment | `assignAsset` | `POST /assets/:id/assign` | `asset.assign` | Backend validates assignee and asset state |
| Assignment confirm | `confirmAssetAssignment` | `POST /asset-assignments/:id/confirm` | `asset.return` | Backend owner only |
| Return request | `requestAssetReturn` | `POST /asset-assignments/:id/request-return` | `asset.return` | Backend owner only; no body |
| Return receive | `receiveAssetReturn` | `POST /asset-assignments/:id/receive-return` | `asset.return` | Backend warehouse scope |
| Incident report | `reportAssetIncident` | `POST /assets/:id/incidents` | `asset.incident.create` | Backend checks asset access |
| Incident list/detail | `getAssetIncidents`, `getAssetIncident` | `GET /asset-incidents`, `GET /asset-incidents/:id` | `asset.incident.read` | Current list endpoint is global for permitted actors |
| Incident resolution | `investigateAssetIncident`, `resolveAssetIncident` | `POST /asset-incidents/:id/investigate`, `POST /asset-incidents/:id/resolve` | `asset.incident.resolve` | Backend validates state |
| Maintenance | `startAssetMaintenance`, `completeAssetMaintenance` | `POST /assets/:id/maintenance`, `POST /asset-maintenance/:id/complete` | `asset.maintenance.manage` | Backend validates asset state |
| Warehouses | `getWarehouses`, `getWarehouse` | `GET /warehouses`, `GET /warehouses/:id` | any of `warehouse.read`, `warehouse.manage`, `stock.read` | Backend admin/all or warehouse-manager scope |
| Warehouse stocks | `getWarehouseStocks` | `GET /warehouses/:id/stocks` | `stock.read` | Backend warehouse scope |
| Material categories | `getMaterialCategories` | `GET /material-categories` | `material.read` | Global reference data |
| Materials | `getMaterials`, `getMaterial` | `GET /materials`, `GET /materials/:id` | `material.read` | Global reference data |
| Stock receipt | `createStockReceipt`, `approveStockReceipt` | `POST /stock-receipts`, `POST /stock-receipts/:id/approve` | `stock.import` | Backend warehouse scope |
| Material issue | `createMaterialIssue`, `approveMaterialIssue`, `issueMaterials` | `POST /material-issues`, action routes | create/export/read/approve/issue permissions | Backend warehouse scope and owner/department checks |
| Stock transfer | transfer API module | `POST /stock-transfers`, approve/ship/receive/cancel | `stock.transfer` | Backend source/target warehouse scope |
| Inventory check | inventory API module | `POST /inventory-checks`, items/submit/approve routes | `inventory_check.*` | Backend warehouse scope |

## Backend Limitations Kept Visible In Mobile

- No `GET /asset-categories`; asset create uses manual category id.
- No material return controller; no fake material return UI was added.
- No `GET /stock-transfers/:id`; transfer detail reads from list cache.
- No asset maintenance list/detail endpoint; mobile can complete only a record returned by current session start action.
- `GET /asset-incidents` has no pagination/filter/scope query.
- Upload evidence uses `/uploads` with purpose `ASSET_INCIDENT`, then sends `evidenceUrl` because incident DTO has no `evidenceFileId`.

## Realtime

Socket.IO namespace is `/hrm`. REST remains source of truth. Socket events only invalidate React Query cache:

- `warehouse:stock-updated`
- `material:issue-updated`
- `inventory:updated`
- `asset:assigned`
- `asset:return-updated`
- `asset:incident-updated`

Warehouse screens join rooms with `warehouse:join` only for warehouse ids returned by scoped backend APIs.
