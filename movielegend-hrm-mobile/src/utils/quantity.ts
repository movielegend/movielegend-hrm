import type { DecimalString } from '../types/material.types';

/** Prisma Decimal serialize thành string trong JSON — normalize để hiển thị. */
export function toQuantity(value: DecimalString | null | undefined): number {
  if (value === null || typeof value === 'undefined') return 0;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatQuantity(value: DecimalString | null | undefined): string {
  const quantity = toQuantity(value);
  return Number.isInteger(quantity) ? String(quantity) : quantity.toFixed(3).replace(/\.?0+$/, '');
}
