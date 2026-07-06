import { useQuery } from '@tanstack/react-query';
import { getPositions } from '../api/positions.api';
import { queryKeys } from '../constants/queryKeys';

export function usePositions(departmentId?: string) {
  return useQuery({
    queryKey: queryKeys.positions(departmentId),
    queryFn: () => getPositions({
      ...(departmentId ? { departmentId } : {}),
      isActive: true,
      page: 1,
      limit: 100,
    }),
  });
}
