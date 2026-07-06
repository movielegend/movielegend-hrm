import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  approveStockReceipt,
  cancelStockReceipt,
  createStockReceipt,
  getStockReceipt,
  getStockReceipts,
} from '../api/stock-receipts.api';
import {
  approveMaterialIssue,
  cancelMaterialIssue,
  createMaterialIssue,
  getMaterialIssue,
  getMaterialIssues,
  issueMaterials,
  rejectMaterialIssue,
} from '../api/material-issues.api';
import {
  approveStockTransfer,
  cancelStockTransfer,
  createStockTransfer,
  getStockTransfers,
  receiveStockTransfer,
  shipStockTransfer,
} from '../api/stock-transfers.api';
import { materialIssueKeys, receiptKeys, stockKeys, transferKeys } from '../constants/queryKeys';
import type {
  CreateMaterialIssuePayload,
  CreateStockReceiptPayload,
  CreateStockTransferPayload,
  RejectPayload,
  StockTransferDto,
} from '../types/stock.types';

// ===== Stock receipts =====

export function useStockReceipts(enabled = true) {
  return useQuery({ queryKey: receiptKeys.list(), queryFn: getStockReceipts, enabled });
}

export function useStockReceipt(id?: string) {
  return useQuery({
    queryKey: receiptKeys.detail(id ?? 'missing'),
    queryFn: () => getStockReceipt(id ?? ''),
    enabled: Boolean(id),
  });
}

export function useCreateStockReceipt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateStockReceiptPayload) => createStockReceipt(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: receiptKeys.all });
    },
  });
}

/** Approve receipt: invalidate stock của warehouse + receipt list/detail (backend đã cộng stock). */
export function useApproveStockReceipt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => approveStockReceipt(id),
    onSuccess: (receipt) => {
      void queryClient.invalidateQueries({ queryKey: receiptKeys.all });
      void queryClient.invalidateQueries({ queryKey: receiptKeys.detail(receipt.id) });
      void queryClient.invalidateQueries({ queryKey: stockKeys.byWarehouse(receipt.warehouseId) });
    },
  });
}

export function useCancelStockReceipt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cancelStockReceipt(id),
    onSuccess: (receipt) => {
      void queryClient.invalidateQueries({ queryKey: receiptKeys.all });
      void queryClient.invalidateQueries({ queryKey: receiptKeys.detail(receipt.id) });
    },
  });
}

// ===== Material issues =====

export function useMaterialIssues(enabled = true) {
  return useQuery({ queryKey: materialIssueKeys.list(), queryFn: getMaterialIssues, enabled });
}

export function useMaterialIssue(id?: string) {
  return useQuery({
    queryKey: materialIssueKeys.detail(id ?? 'missing'),
    queryFn: () => getMaterialIssue(id ?? ''),
    enabled: Boolean(id),
  });
}

export function useCreateMaterialIssue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateMaterialIssuePayload) => createMaterialIssue(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: materialIssueKeys.all });
    },
  });
}

export function useMaterialIssueAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action, payload }: { id: string; action: 'approve' | 'reject' | 'issue' | 'cancel'; payload?: RejectPayload }) => {
      if (action === 'approve') return approveMaterialIssue(id);
      if (action === 'reject') return rejectMaterialIssue(id, payload ?? {});
      if (action === 'issue') return issueMaterials(id);
      return cancelMaterialIssue(id);
    },
    onSuccess: (issue, variables) => {
      void queryClient.invalidateQueries({ queryKey: materialIssueKeys.all });
      void queryClient.invalidateQueries({ queryKey: materialIssueKeys.detail(issue.id) });
      // Issue complete mới trừ stock — invalidate stock warehouse tương ứng.
      if (variables.action === 'issue') {
        void queryClient.invalidateQueries({ queryKey: stockKeys.byWarehouse(issue.warehouseId) });
      }
    },
  });
}

// ===== Stock transfers =====

export function useStockTransfers(enabled = true) {
  return useQuery({ queryKey: transferKeys.list(), queryFn: getStockTransfers, enabled });
}

/** Không có GET /stock-transfers/:id (blocker B6) — detail đọc từ cache list. */
export function useStockTransferFromList(id?: string) {
  const list = useStockTransfers();
  const transfer: StockTransferDto | undefined = list.data?.items.find((item) => item.id === id);
  return { ...list, transfer: transfer ?? null };
}

export function useCreateStockTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateStockTransferPayload) => createStockTransfer(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: transferKeys.all });
    },
  });
}

export function useStockTransferAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'approve' | 'ship' | 'receive' | 'cancel' }) => {
      if (action === 'approve') return approveStockTransfer(id);
      if (action === 'ship') return shipStockTransfer(id);
      if (action === 'receive') return receiveStockTransfer(id);
      return cancelStockTransfer(id);
    },
    onSuccess: (transfer, variables) => {
      void queryClient.invalidateQueries({ queryKey: transferKeys.all });
      // Ship trừ stock nguồn; receive cộng stock đích.
      if (variables.action === 'ship') {
        void queryClient.invalidateQueries({ queryKey: stockKeys.byWarehouse(transfer.sourceWarehouseId) });
      }
      if (variables.action === 'receive') {
        void queryClient.invalidateQueries({ queryKey: stockKeys.byWarehouse(transfer.targetWarehouseId) });
      }
    },
  });
}
