import { apiClient, unwrapData } from './client';
import type { ApiResponse } from '../types/api.types';
import { normalizePagination, type PaginatedResult } from '../types/pagination.types';
import type { CreateStockReceiptPayload, StockReceiptDto } from '../types/stock.types';

export async function getStockReceipts(): Promise<PaginatedResult<StockReceiptDto>> {
  const response = await apiClient.get<ApiResponse<StockReceiptDto[]>>('/stock-receipts');
  return normalizePagination(unwrapData(response));
}

export async function getStockReceipt(id: string): Promise<StockReceiptDto> {
  const response = await apiClient.get<ApiResponse<StockReceiptDto>>(`/stock-receipts/${id}`);
  return unwrapData(response);
}

export async function createStockReceipt(payload: CreateStockReceiptPayload): Promise<StockReceiptDto> {
  const response = await apiClient.post<ApiResponse<StockReceiptDto>>('/stock-receipts', payload);
  return unwrapData(response);
}

export async function approveStockReceipt(id: string): Promise<StockReceiptDto> {
  const response = await apiClient.post<ApiResponse<StockReceiptDto>>(`/stock-receipts/${id}/approve`);
  return unwrapData(response);
}

export async function cancelStockReceipt(id: string): Promise<StockReceiptDto> {
  const response = await apiClient.post<ApiResponse<StockReceiptDto>>(`/stock-receipts/${id}/cancel`);
  return unwrapData(response);
}
