import { apiClient, unwrapData } from './client';
import type { ApiResponse } from '../types/api.types';
import { normalizePagination, type PaginatedResult } from '../types/pagination.types';
import type { Position } from '../types/position.types';

export interface PositionFilters {
  departmentId?: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export async function getPositions(filters: PositionFilters = {}): Promise<PaginatedResult<Position>> {
  const response = await apiClient.get<ApiResponse<PaginatedResult<Position> | { items: Position[] } | Position[]>>('/positions', {
    params: filters,
  });
  return normalizePagination(unwrapData(response), {
    ...(typeof filters.page === 'number' ? { page: filters.page } : {}),
    ...(typeof filters.limit === 'number' ? { limit: filters.limit } : {}),
  });
}
