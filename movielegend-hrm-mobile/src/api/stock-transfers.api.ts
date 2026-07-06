import { apiClient, unwrapData } from './client';
import type { ApiResponse } from '../types/api.types';
import { normalizePagination, type PaginatedResult } from '../types/pagination.types';
import type { CreateStockTransferPayload, StockTransferDto } from '../types/stock.types';

// Backend KHÔNG có GET /stock-transfers/:id — detail screen đọc từ cache của list
// (documented blocker B6 trong docs/phase5-warehouse-asset-contract-matrix.md).

export async function getStockTransfers(): Promise<PaginatedResult<StockTransferDto>> {
  const response = await apiClient.get<ApiResponse<StockTransferDto[]>>('/stock-transfers');
  return normalizePagination(unwrapData(response));
}

export async function createStockTransfer(payload: CreateStockTransferPayload): Promise<StockTransferDto> {
  const response = await apiClient.post<ApiResponse<StockTransferDto>>('/stock-transfers', payload);
  return unwrapData(response);
}

export async function approveStockTransfer(id: string): Promise<StockTransferDto> {
  const response = await apiClient.post<ApiResponse<StockTransferDto>>(`/stock-transfers/${id}/approve`);
  return unwrapData(response);
}

export async function shipStockTransfer(id: string): Promise<StockTransferDto> {
  const response = await apiClient.post<ApiResponse<StockTransferDto>>(`/stock-transfers/${id}/ship`);
  return unwrapData(response);
}

export async function receiveStockTransfer(id: string): Promise<StockTransferDto> {
  const response = await apiClient.post<ApiResponse<StockTransferDto>>(`/stock-transfers/${id}/receive`);
  return unwrapData(response);
}

export async function cancelStockTransfer(id: string): Promise<StockTransferDto> {
  const response = await apiClient.post<ApiResponse<StockTransferDto>>(`/stock-transfers/${id}/cancel`);
  return unwrapData(response);
}
