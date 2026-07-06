import type { WarehouseStockDto } from '../../types/stock.types';
import { toQuantity } from '../../utils/quantity';

/**
 * Available = onHand - reserved, chỉ để hiển thị.
 * Backend vẫn là source of truth khi validate issue/transfer (INSUFFICIENT_STOCK).
 */
export function availableQuantity(stock: Pick<WarehouseStockDto, 'quantityOnHand' | 'quantityReserved'>): number {
  return toQuantity(stock.quantityOnHand) - toQuantity(stock.quantityReserved);
}

export function isLowStock(stock: Pick<WarehouseStockDto, 'quantityOnHand' | 'material'>): boolean {
  const minimum = toQuantity(stock.material?.minimumStock);
  if (minimum <= 0) return false;
  return toQuantity(stock.quantityOnHand) <= minimum;
}

export function lowStockCount(stocks: Array<Pick<WarehouseStockDto, 'quantityOnHand' | 'material'>>): number {
  return stocks.filter((stock) => isLowStock(stock)).length;
}
