import { apiClient, unwrapData } from './client';
import type { ApiResponse } from '../types/api.types';
import { normalizePagination, type PaginatedResult } from '../types/pagination.types';
import type { WarehouseStockDto } from '../types/stock.types';

export async function getWarehouseStocks(warehouseId: string): Promise<PaginatedResult<WarehouseStockDto>> {
  const response = await apiClient.get<ApiResponse<WarehouseStockDto[]>>(`/warehouses/${warehouseId}/stocks`);
  return normalizePagination(unwrapData(response));
}
