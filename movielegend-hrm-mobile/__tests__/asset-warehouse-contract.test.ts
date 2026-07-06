import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { QueryClient } from '@tanstack/react-query';
import { apiClient } from '../src/api/client';
import { getAsset, getMyAssets } from '../src/api/assets.api';
import { confirmAssetAssignment, receiveAssetReturn, requestAssetReturn } from '../src/api/asset-assignments.api';
import { getWarehouses } from '../src/api/warehouses.api';
import { getMaterials } from '../src/api/materials.api';
import { getWarehouseStocks } from '../src/api/stocks.api';
import { approveStockReceipt, createStockReceipt } from '../src/api/stock-receipts.api';
import { approveMaterialIssue, createMaterialIssue, issueMaterials } from '../src/api/material-issues.api';
import {
  approveStockTransfer,
  createStockTransfer,
  receiveStockTransfer,
  shipStockTransfer,
} from '../src/api/stock-transfers.api';
import {
  approveInventoryCheck,
  createInventoryCheck,
  submitInventoryCheck,
  updateInventoryCheckItems,
} from '../src/api/inventory-checks.api';
import { getAssetIncident, investigateAssetIncident, reportAssetIncident, resolveAssetIncident } from '../src/api/asset-incidents.api';
import { uploadFile } from '../src/api/uploads.api';
import { canConfirmAssignment } from '../src/features/assets/asset.logic';
import { validateIssueDraft } from '../src/features/material-issues/issue.logic';
import { validateTransferDraft } from '../src/features/stock-transfers/transfer.logic';
import {
  invalidateForAssetAssigned,
  invalidateForStockUpdated,
} from '../src/features/warehouses/warehouse-events';
import { notificationRoute } from '../src/features/tasks/task.logic';
import { stockKeys, assetKeys } from '../src/constants/queryKeys';
import { makeUser, apiError } from '../test/test-utils';
import type { NotificationTargetDto } from '../src/types/notification.types';

describe('asset and warehouse contract adapters', () => {
  const originalAdapter = apiClient.defaults.adapter;

  beforeEach(() => {
    jest.mocked(SecureStore.getItemAsync).mockResolvedValue('access-token');
  });

  afterEach(() => {
    if (originalAdapter) apiClient.defaults.adapter = originalAdapter;
    else delete apiClient.defaults.adapter;
    jest.clearAllMocks();
  });

  it('employee my assets uses GET /assets/my and normalizes array pagination', async () => {
    apiClient.defaults.adapter = makeAdapter((config) => {
      expect(config.method).toBe('get');
      expect(config.url).toBe('/assets/my');
      return dataResponse(config, [assignment()]);
    });

    await expect(getMyAssets()).resolves.toMatchObject({ items: [{ id: 'assignment-1', assetId: 'asset-1' }] });
  });

  it('asset detail uses GET /assets/:id', async () => {
    apiClient.defaults.adapter = makeAdapter((config) => {
      expect(config.url).toBe('/assets/asset-1');
      return dataResponse(config, asset());
    });

    await expect(getAsset('asset-1')).resolves.toMatchObject({ id: 'asset-1', assetCode: 'AST-1' });
  });

  it('confirm own assignment posts to the assignment action endpoint', async () => {
    const user = { ...makeUser(['EMPLOYEE']), permissions: ['asset.return'] };
    expect(canConfirmAssignment(user, { assignedToUserId: 'user-1', status: 'PENDING_CONFIRMATION' })).toBe(true);

    apiClient.defaults.adapter = makeAdapter((config) => {
      expect(config.method).toBe('post');
      expect(config.url).toBe('/asset-assignments/assignment-1/confirm');
      return dataResponse(config, assignment({ status: 'ACTIVE' }));
    });

    await expect(confirmAssetAssignment('assignment-1')).resolves.toMatchObject({ status: 'ACTIVE' });
  });

  it('denies confirm for other assignment in mobile permission UX before backend owner check', () => {
    const user = { ...makeUser(['EMPLOYEE']), permissions: ['asset.return'] };
    expect(canConfirmAssignment(user, { assignedToUserId: 'user-2', status: 'PENDING_CONFIRMATION' })).toBe(false);
  });

  it('request return posts no body because backend DTO has no reason field', async () => {
    apiClient.defaults.adapter = makeAdapter((config) => {
      expect(config.method).toBe('post');
      expect(config.url).toBe('/asset-assignments/assignment-1/request-return');
      expect(config.data).toBeUndefined();
      return dataResponse(config, assignment({ status: 'RETURN_REQUESTED' }));
    });

    await expect(requestAssetReturn('assignment-1')).resolves.toMatchObject({ status: 'RETURN_REQUESTED' });
  });

  it('receive return sends conditionWhenReturned to /receive-return', async () => {
    apiClient.defaults.adapter = makeAdapter((config) => {
      expect(config.url).toBe('/asset-assignments/assignment-1/receive-return');
      expect(JSON.parse(String(config.data))).toEqual({ conditionWhenReturned: 'GOOD', note: 'ok' });
      return dataResponse(config, assignment({ status: 'RETURNED' }));
    });

    await expect(receiveAssetReturn('assignment-1', { conditionWhenReturned: 'GOOD', note: 'ok' })).resolves.toMatchObject({ status: 'RETURNED' });
  });

  it('report incident for own asset sends uploaded evidenceUrl only', async () => {
    apiClient.defaults.adapter = makeAdapter((config) => {
      expect(config.url).toBe('/assets/asset-1/incidents');
      expect(JSON.parse(String(config.data))).toEqual({ incidentType: 'DAMAGED', description: 'screen broken', evidenceUrl: '/uploads/e1.jpg' });
      return dataResponse(config, incident());
    });

    await expect(reportAssetIncident('asset-1', { incidentType: 'DAMAGED', description: 'screen broken', evidenceUrl: '/uploads/e1.jpg' })).resolves.toMatchObject({ assetId: 'asset-1' });
  });

  it('surfaces backend denial for incident on another asset without client fake fallback', async () => {
    apiClient.defaults.adapter = makeAdapter(() => errorResponse('ASSET_FORBIDDEN', 403));
    await expect(reportAssetIncident('asset-other', { incidentType: 'LOST', description: 'lost' })).rejects.toMatchObject({
      response: { data: { error: { code: 'ASSET_FORBIDDEN' } } },
    });
  });

  it('uploads incident evidence using Upload API purpose ASSET_INCIDENT', async () => {
    apiClient.defaults.adapter = makeAdapter((config) => {
      expect(config.url).toBe('/uploads');
      expect(config.method).toBe('post');
      expect(config.data).toBeInstanceOf(FormData);
      return dataResponse(config, { fileId: 'file-1', fileUrl: '/uploads/e1.jpg', mimeType: 'image/jpeg', size: 12, purpose: 'ASSET_INCIDENT' });
    });

    await expect(uploadFile({ uri: 'file://e.jpg', name: 'e.jpg', mimeType: 'image/jpeg', purpose: 'ASSET_INCIDENT' })).resolves.toMatchObject({ fileUrl: '/uploads/e1.jpg' });
  });

  it('incident investigate posts /asset-incidents/:id/investigate', async () => {
    apiClient.defaults.adapter = makeAdapter((config) => {
      expect(config.url).toBe('/asset-incidents/incident-1/investigate');
      return dataResponse(config, incident({ status: 'INVESTIGATING' }));
    });

    await expect(investigateAssetIncident('incident-1')).resolves.toMatchObject({ status: 'INVESTIGATING' });
  });

  it('incident resolve posts resolution payload to /resolve', async () => {
    apiClient.defaults.adapter = makeAdapter((config) => {
      expect(config.url).toBe('/asset-incidents/incident-1/resolve');
      expect(JSON.parse(String(config.data))).toEqual({ assetStatus: 'MAINTENANCE', resolutionNote: 'repair' });
      return dataResponse(config, incident({ status: 'RESOLVED' }));
    });

    await expect(resolveAssetIncident('incident-1', { assetStatus: 'MAINTENANCE', resolutionNote: 'repair' })).resolves.toMatchObject({ status: 'RESOLVED' });
  });

  it('warehouse list uses backend scope endpoint directly', async () => {
    apiClient.defaults.adapter = makeAdapter((config) => {
      expect(config.url).toBe('/warehouses');
      return dataResponse(config, [{ id: 'warehouse-1', companyId: 'company-1', code: 'WH1', name: 'Main', isActive: true }]);
    });

    await expect(getWarehouses()).resolves.toMatchObject({ items: [{ id: 'warehouse-1' }] });
  });

  it('material list uses GET /materials and normalizes legacy arrays', async () => {
    apiClient.defaults.adapter = makeAdapter((config) => {
      expect(config.url).toBe('/materials');
      return dataResponse(config, [{ id: 'material-1', categoryId: 'cat-1', materialCode: 'MAT1', name: 'Cable', unit: 'pcs', minimumStock: '1', isActive: true }]);
    });

    await expect(getMaterials()).resolves.toMatchObject({ items: [{ materialCode: 'MAT1' }] });
  });

  it('stock list uses GET /warehouses/:id/stocks', async () => {
    apiClient.defaults.adapter = makeAdapter((config) => {
      expect(config.url).toBe('/warehouses/warehouse-1/stocks');
      return dataResponse(config, [{ id: 'stock-1', warehouseId: 'warehouse-1', materialId: 'material-1', quantityOnHand: '5', quantityReserved: '0', version: 1, updatedAt: now() }]);
    });

    await expect(getWarehouseStocks('warehouse-1')).resolves.toMatchObject({ items: [{ id: 'stock-1' }] });
  });

  it('create receipt posts backend CreateStockReceiptDto fields', async () => {
    const payload = { warehouseId: 'warehouse-1', supplierName: 'Vendor', items: [{ materialId: 'material-1', quantity: 2, unitCost: 10 }] };
    apiClient.defaults.adapter = makeAdapter((config) => {
      expect(config.url).toBe('/stock-receipts');
      expect(JSON.parse(String(config.data))).toEqual(payload);
      return dataResponse(config, receipt());
    });

    await expect(createStockReceipt(payload)).resolves.toMatchObject({ receiptCode: 'RC-1' });
  });

  it('approve receipt posts approve action and does not update stock locally in API layer', async () => {
    apiClient.defaults.adapter = makeAdapter((config) => {
      expect(config.url).toBe('/stock-receipts/receipt-1/approve');
      return dataResponse(config, receipt({ status: 'APPROVED' }));
    });

    await expect(approveStockReceipt('receipt-1')).resolves.toMatchObject({ status: 'APPROVED' });
  });

  it('material issue flow creates, approves and issues through explicit endpoints', async () => {
    let step = 0;
    apiClient.defaults.adapter = makeAdapter((config) => {
      step += 1;
      if (step === 1) {
        expect(config.url).toBe('/material-issues');
        return dataResponse(config, issue());
      }
      if (step === 2) {
        expect(config.url).toBe('/material-issues/issue-1/approve');
        return dataResponse(config, issue({ status: 'APPROVED' }));
      }
      expect(config.url).toBe('/material-issues/issue-1/issue');
      return dataResponse(config, issue({ status: 'COMPLETED' }));
    });

    await expect(createMaterialIssue({ warehouseId: 'warehouse-1', issueTargetType: 'DEPARTMENT', issuedToDepartmentId: 'department-1', items: [{ materialId: 'material-1', quantity: 1 }] })).resolves.toMatchObject({ id: 'issue-1' });
    await expect(approveMaterialIssue('issue-1')).resolves.toMatchObject({ status: 'APPROVED' });
    await expect(issueMaterials('issue-1')).resolves.toMatchObject({ status: 'COMPLETED' });
  });

  it('insufficient stock error is surfaced from backend issue action', async () => {
    expect(validateIssueDraft({ warehouseId: 'warehouse-1', issueTargetType: 'DEPARTMENT', issuedToDepartmentId: 'department-1', items: [{ materialId: 'material-1', quantity: 2 }] })).toBeNull();
    apiClient.defaults.adapter = makeAdapter(() => errorResponse('INSUFFICIENT_STOCK', 409));
    await expect(issueMaterials('issue-1')).rejects.toMatchObject({ response: { data: { error: { code: 'INSUFFICIENT_STOCK' } } } });
  });

  it('transfer create approve ship receive uses backend state endpoints', async () => {
    expect(validateTransferDraft({ sourceWarehouseId: 'w1', targetWarehouseId: 'w2', items: [{ materialId: 'm1', quantity: 1 }] })).toBeNull();
    let step = 0;
    apiClient.defaults.adapter = makeAdapter((config) => {
      step += 1;
      if (step === 1) {
        expect(config.url).toBe('/stock-transfers');
        return dataResponse(config, transfer());
      }
      if (step === 2) {
        expect(config.url).toBe('/stock-transfers/transfer-1/approve');
        return dataResponse(config, transfer({ status: 'APPROVED' }));
      }
      if (step === 3) {
        expect(config.url).toBe('/stock-transfers/transfer-1/ship');
        return dataResponse(config, transfer({ status: 'IN_TRANSIT' }));
      }
      expect(config.url).toBe('/stock-transfers/transfer-1/receive');
      return dataResponse(config, transfer({ status: 'COMPLETED' }));
    });

    await expect(createStockTransfer({ sourceWarehouseId: 'w1', targetWarehouseId: 'w2', items: [{ materialId: 'm1', quantity: 1 }] })).resolves.toMatchObject({ id: 'transfer-1' });
    await expect(approveStockTransfer('transfer-1')).resolves.toMatchObject({ status: 'APPROVED' });
    await expect(shipStockTransfer('transfer-1')).resolves.toMatchObject({ status: 'IN_TRANSIT' });
    await expect(receiveStockTransfer('transfer-1')).resolves.toMatchObject({ status: 'COMPLETED' });
  });

  it('duplicate receive error surfaces STOCK_TRANSFER_NOT_IN_TRANSIT', async () => {
    apiClient.defaults.adapter = makeAdapter(() => errorResponse('STOCK_TRANSFER_NOT_IN_TRANSIT', 409));
    await expect(receiveStockTransfer('transfer-1')).rejects.toMatchObject({ response: { data: { error: { code: 'STOCK_TRANSFER_NOT_IN_TRANSIT' } } } });
  });

  it('inventory create submit approve flow uses REST source of truth', async () => {
    let step = 0;
    apiClient.defaults.adapter = makeAdapter((config) => {
      step += 1;
      if (step === 1) {
        expect(config.url).toBe('/inventory-checks');
        return dataResponse(config, inventory());
      }
      if (step === 2) {
        expect(config.url).toBe('/inventory-checks/check-1/items');
        return dataResponse(config, inventory());
      }
      if (step === 3) {
        expect(config.url).toBe('/inventory-checks/check-1/submit');
        return dataResponse(config, inventory({ status: 'SUBMITTED' }));
      }
      expect(config.url).toBe('/inventory-checks/check-1/approve');
      return dataResponse(config, inventory({ status: 'APPROVED' }));
    });

    await expect(createInventoryCheck({ warehouseId: 'warehouse-1' })).resolves.toMatchObject({ id: 'check-1' });
    await expect(updateInventoryCheckItems('check-1', { items: [{ id: 'line-1', actualQuantity: 4 }] })).resolves.toMatchObject({ id: 'check-1' });
    await expect(submitInventoryCheck('check-1')).resolves.toMatchObject({ status: 'SUBMITTED' });
    await expect(approveInventoryCheck('check-1')).resolves.toMatchObject({ status: 'APPROVED' });
  });

  it('socket stock invalidation invalidates warehouse stock query only by key', () => {
    const queryClient = new QueryClient();
    const spy = jest.spyOn(queryClient, 'invalidateQueries');
    invalidateForStockUpdated(queryClient, { warehouseId: 'warehouse-1' });
    expect(spy).toHaveBeenCalledWith({ queryKey: stockKeys.byWarehouse('warehouse-1') });
  });

  it('socket asset invalidation invalidates my assets and asset detail', () => {
    const queryClient = new QueryClient();
    const spy = jest.spyOn(queryClient, 'invalidateQueries');
    invalidateForAssetAssigned(queryClient, { assetId: 'asset-1', assignmentId: 'assignment-1' });
    expect(spy).toHaveBeenCalledWith({ queryKey: assetKeys.my() });
    expect(spy).toHaveBeenCalledWith({ queryKey: assetKeys.detail('asset-1') });
  });

  it('notification deep link opens asset detail from ASSET_ASSIGNED metadata', () => {
    expect(notificationRoute(notificationTarget({ type: 'ASSET_ASSIGNED', metadata: { assetId: 'asset-1', assignmentId: 'assignment-1' } }), makeUser(['EMPLOYEE']))).toBe('/employee/assets/asset-1');
    expect(notificationRoute(notificationTarget({ type: 'ASSET_ASSIGNED', metadata: { assetId: 'asset-1' } }), makeUser(['WAREHOUSE_MANAGER']))).toBe('/warehouse-manager/assets/asset-1');
  });

  it('incident detail still uses GET /asset-incidents/:id for resolution views', async () => {
    apiClient.defaults.adapter = makeAdapter((config) => {
      expect(config.url).toBe('/asset-incidents/incident-1');
      return dataResponse(config, incident());
    });

    await expect(getAssetIncident('incident-1')).resolves.toMatchObject({ id: 'incident-1' });
  });
});

function makeAdapter(handler: (config: InternalAxiosRequestConfig) => AxiosResponse): AxiosAdapter {
  return async (config) => handler(config);
}

function dataResponse<T>(config: InternalAxiosRequestConfig, data: T): AxiosResponse {
  return { config, data: { success: true, data }, headers: {}, status: 200, statusText: 'OK' };
}

function errorResponse(code: string, status: number): AxiosResponse {
  throw apiError(code, status);
}

function now() {
  return '2026-07-06T00:00:00.000Z';
}

function asset(input: Record<string, unknown> = {}) {
  return {
    id: 'asset-1',
    assetCode: 'AST-1',
    categoryId: 'cat-1',
    warehouseId: 'warehouse-1',
    name: 'Camera',
    conditionStatus: 'GOOD',
    assetStatus: 'IN_STOCK',
    createdAt: now(),
    updatedAt: now(),
    assignments: [],
    incidents: [],
    ...input,
  };
}

function assignment(input: Record<string, unknown> = {}) {
  return {
    id: 'assignment-1',
    assetId: 'asset-1',
    assignedToUserId: 'user-1',
    assignedToDepartmentId: null,
    status: 'PENDING_CONFIRMATION',
    assignedAt: now(),
    expectedReturnAt: null,
    returnedAt: null,
    conditionWhenAssigned: 'GOOD',
    conditionWhenReturned: null,
    note: null,
    asset: asset(),
    ...input,
  };
}

function incident(input: Record<string, unknown> = {}) {
  return {
    id: 'incident-1',
    assetId: 'asset-1',
    reportedById: 'user-1',
    incidentType: 'DAMAGED',
    status: 'OPEN',
    description: 'screen broken',
    evidenceUrl: null,
    resolvedById: null,
    resolvedAt: null,
    resolutionNote: null,
    createdAt: now(),
    updatedAt: now(),
    asset: asset(),
    ...input,
  };
}

function receipt(input: Record<string, unknown> = {}) {
  return {
    id: 'receipt-1',
    receiptCode: 'RC-1',
    warehouseId: 'warehouse-1',
    receiptDate: now(),
    status: 'PENDING',
    createdById: 'user-1',
    approvedById: null,
    approvedAt: null,
    createdAt: now(),
    updatedAt: now(),
    items: [{ id: 'ri-1', receiptId: 'receipt-1', materialId: 'material-1', quantity: '2', unitCost: '10', note: null }],
    ...input,
  };
}

function issue(input: Record<string, unknown> = {}) {
  return {
    id: 'issue-1',
    issueCode: 'MI-1',
    warehouseId: 'warehouse-1',
    issueTargetType: 'DEPARTMENT',
    issuedToUserId: null,
    issuedToDepartmentId: 'department-1',
    status: 'PENDING',
    requestedById: 'user-1',
    approvedById: null,
    issuedById: null,
    issueDate: null,
    note: null,
    createdAt: now(),
    updatedAt: now(),
    items: [{ id: 'ii-1', materialIssueId: 'issue-1', materialId: 'material-1', quantityRequested: '1', quantityApproved: '1', quantityIssued: '0' }],
    ...input,
  };
}

function transfer(input: Record<string, unknown> = {}) {
  return {
    id: 'transfer-1',
    transferCode: 'TR-1',
    sourceWarehouseId: 'w1',
    targetWarehouseId: 'w2',
    status: 'PENDING',
    requestedById: 'user-1',
    createdAt: now(),
    updatedAt: now(),
    items: [{ id: 'ti-1', transferId: 'transfer-1', materialId: 'm1', quantity: '1' }],
    ...input,
  };
}

function inventory(input: Record<string, unknown> = {}) {
  return {
    id: 'check-1',
    warehouseId: 'warehouse-1',
    checkCode: 'IC-1',
    status: 'IN_PROGRESS',
    startedAt: now(),
    createdById: 'user-1',
    approvedById: null,
    createdAt: now(),
    updatedAt: now(),
    items: [{ id: 'line-1', inventoryCheckId: 'check-1', materialId: 'material-1', systemQuantity: '5', actualQuantity: null, differenceQuantity: null }],
    ...input,
  };
}

function notificationTarget(input: { type: NotificationTargetDto['notification']['type']; metadata?: Record<string, unknown> }): NotificationTargetDto {
  return {
    id: 'target-1',
    notificationId: 'notification-1',
    userId: 'user-1',
    readAt: null,
    createdAt: now(),
    notification: {
      id: 'notification-1',
      type: input.type,
      title: 'Asset',
      body: 'Asset assigned',
      metadata: input.metadata ?? null,
      createdAt: now(),
    },
  };
}
