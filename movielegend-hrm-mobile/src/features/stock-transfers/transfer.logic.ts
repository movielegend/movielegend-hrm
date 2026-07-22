import type { AuthUser } from '../../types/user.types';
import type { StockTransferDto, StockTransferStatus } from '../../types/stock.types';
import { hasPermission } from '../../utils/permissions';

type BadgeTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

/** Flow backend thật: PENDING → APPROVED → IN_TRANSIT (ship) → COMPLETED (receive). */
export const transferTimelineSteps: StockTransferStatus[] = ['PENDING', 'APPROVED', 'IN_TRANSIT', 'COMPLETED'];

export const transferStatusLabels: Record<StockTransferStatus, string> = {
  DRAFT: 'Nháp',
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  SHIPPED: 'Đã gửi',
  IN_TRANSIT: 'Đang vận chuyển',
  COMPLETED: 'Hoàn tất',
  CANCELLED: 'Đã hủy',
};

export function transferStatusTone(status: StockTransferStatus): BadgeTone {
  if (status === 'COMPLETED') return 'success';
  if (status === 'PENDING') return 'warning';
  if (status === 'APPROVED' || status === 'SHIPPED' || status === 'IN_TRANSIT') return 'info';
  if (status === 'CANCELLED') return 'danger';
  return 'neutral';
}

export type TransferAction = 'approve' | 'ship' | 'receive' | 'cancel';

/** Action khả dụng theo state machine backend; permission stock.transfer cho mọi action. */
export function availableTransferActions(user: AuthUser | null, transfer: Pick<StockTransferDto, 'status'>): TransferAction[] {
  if (!hasPermission(user, 'stock.transfer')) return [];
  if (transfer.status === 'PENDING') return ['approve', 'cancel'];
  if (transfer.status === 'APPROVED') return ['ship', 'cancel'];
  if (transfer.status === 'IN_TRANSIT') return ['receive'];
  return [];
}

/** Validate UX trước khi gọi backend — backend vẫn check TRANSFER_SAME_WAREHOUSE. */
export function validateTransferDraft(input: {
  sourceWarehouseId: string;
  targetWarehouseId: string;
  items: Array<{ materialId: string; quantity: number }>;
}): string | null {
  if (!input.sourceWarehouseId) return 'Chọn kho nguồn';
  if (!input.targetWarehouseId) return 'Chọn kho đích';
  if (input.sourceWarehouseId === input.targetWarehouseId) return 'Kho nguồn và kho đích phải khác nhau';
  if (!input.items?.length) return 'Thêm ít nhất một vật tư';
  if (input.items.some((item) => !item.materialId || item.quantity <= 0)) return 'Số lượng từng dòng phải lớn hơn 0';
  return null;
}
