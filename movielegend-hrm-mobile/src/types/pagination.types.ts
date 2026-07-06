export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: PaginationMeta;
}

export function normalizePagination<T>(
  payload: T[] | { items: T[]; pagination?: PaginationMeta },
  fallback: { page?: number; limit?: number } = {},
): PaginatedResult<T> {
  if (Array.isArray(payload)) {
    return {
      items: payload,
      pagination: {
        page: fallback.page ?? 1,
        limit: fallback.limit ?? payload.length,
        total: payload.length,
        totalPages: 1,
      },
    };
  }
  return {
    items: payload.items,
    pagination:
      payload.pagination ??
      {
        page: fallback.page ?? 1,
        limit: fallback.limit ?? payload.items.length,
        total: payload.items.length,
        totalPages: 1,
      },
  };
}
