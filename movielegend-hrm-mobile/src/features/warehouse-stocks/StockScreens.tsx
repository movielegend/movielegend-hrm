import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { RefreshControl } from 'react-native';

import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { PageHeader } from '../../components/PageHeader';
import { Screen } from '../../components/Screen';
import { ScreenContainer } from '../../components/ScreenContainer';
import { SearchInput } from '../../components/SearchInput';

import {
  useWarehouse,
  useWarehouseStocks,
} from '../../hooks/useWarehouses';

import { StockRow } from '../warehouses/WarehouseComponents';

/**
 * Tồn kho một warehouse.
 *
 * API:
 * GET /warehouses/:id/stocks
 *
 * Available = onHand - reserved.
 * Backend vẫn là nơi validate tồn kho cuối cùng khi xuất vật tư.
 */
export function WarehouseStockScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const warehouse = useWarehouse(id);
  const stocks = useWarehouseStocks(id);

  const [search, setSearch] = useState('');

  const visible = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    const items = stocks.data?.items ?? [];

    if (!keyword) {
      return items;
    }

    return items.filter((stock) => {
      const materialName =
        stock.material?.name?.toLowerCase() ?? '';

      const materialCode =
        stock.material?.materialCode?.toLowerCase() ?? '';

      return (
        materialName.includes(keyword) ||
        materialCode.includes(keyword)
      );
    });
  }, [stocks.data, search]);

  return (
    <Screen>
      <ScreenContainer
        refreshControl={
          <RefreshControl
            refreshing={stocks.isRefetching}
            onRefresh={() => void stocks.refetch()}
          />
        }
      >
        {warehouse.data ? (
          <PageHeader
            title="Tồn kho"
            subtitle={`${warehouse.data.code} — ${warehouse.data.name}`}
          />
        ) : (
          <PageHeader title="Tồn kho" />
        )}

        <SearchInput
          value={search}
          onChangeText={setSearch}
          placeholder="Tìm vật tư"
        />

        {warehouse.isLoading || stocks.isLoading ? (
          <LoadingState />
        ) : null}

        {warehouse.isError ? (
          <ErrorState
            error={warehouse.error}
            onRetry={() => void warehouse.refetch()}
          />
        ) : null}

        {stocks.isError ? (
          <ErrorState
            error={stocks.error}
            onRetry={() => void stocks.refetch()}
          />
        ) : null}

        {!stocks.isLoading && !stocks.isError
          ? visible.map((stock) => (
              <StockRow
                key={stock.id}
                stock={stock}
              />
            ))
          : null}

        {stocks.data &&
        !stocks.isLoading &&
        !stocks.isError &&
        visible.length === 0 ? (
          <EmptyState title="Không có tồn kho" />
        ) : null}
      </ScreenContainer>
    </Screen>
  );
}