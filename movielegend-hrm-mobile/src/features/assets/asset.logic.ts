import type { AuthUser } from '../../types/user.types';
import type { AssetConditionStatus, AssetDto, AssetStatus } from '../../types/asset.types';
import type { AssetAssignmentDto, AssetAssignmentStatus } from '../../types/asset-assignment.types';
import type { AssetIncidentStatus, AssetIncidentType } from '../../types/asset-incident.types';
import { hasPermission } from '../../utils/permissions';
import { normalizeApiError } from '../../utils/api-error';

type BadgeTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export const assetStatusLabels: Record<AssetStatus, string> = {
  IN_STOCK: 'Trong kho',
  ASSIGNED: 'Đã cấp phát',
  IN_USE: 'Đang sử dụng',
  MAINTENANCE: 'Bảo trì',
  LOST: 'Thất lạc',
  DAMAGED: 'Hư hỏng',
  DISPOSED: 'Đã thanh lý',
  TRANSFER_PENDING: 'Chờ điều chuyển',
};

export const assetConditionLabels: Record<AssetConditionStatus, string> = {
  NEW: 'Mới',
  GOOD: 'Tốt',
  FAIR: 'Khá',
  POOR: 'Kém',
  DAMAGED: 'Hư hỏng',
};

export const assignmentStatusLabels: Record<string, string> = {
  ACTIVE: 'Đang sử dụng',
  PENDING_CONFIRMATION: 'Chờ xác nhận',
  RETURN_REQUESTED: 'Chờ thu hồi',
  RETURNED: 'Đã thu hồi',
  CANCELLED: 'Đã hủy',
  REJECTED: 'Đã từ chối',
};

export const incidentTypeLabels: Record<AssetIncidentType, string> = {
  DAMAGED: 'Hư hỏng',
  LOST: 'Thất lạc',
  STOLEN: 'Mất cắp',
  MALFUNCTION: 'Trục trặc',
  OTHER: 'Khác',
};

export function assetStatusTone(status: AssetStatus): BadgeTone {
  if (status === 'IN_STOCK') return 'success';
  if (status === 'ASSIGNED' || status === 'TRANSFER_PENDING') return 'info';
  if (status === 'IN_USE') return 'info';
  if (status === 'MAINTENANCE') return 'warning';
  return 'danger';
}

export function assetConditionTone(condition: AssetConditionStatus): BadgeTone {
  if (condition === 'NEW' || condition === 'GOOD') return 'success';
  if (condition === 'FAIR') return 'info';
  if (condition === 'POOR') return 'warning';
  return 'danger';
}

export function assignmentStatusTone(status: AssetAssignmentStatus): BadgeTone {
  if (status === 'ACTIVE') return 'success';
  if (status === 'PENDING_CONFIRMATION') return 'warning';
  if (status === 'RETURN_REQUESTED') return 'info';
  if (status === 'CANCELLED') return 'danger';
  return 'neutral';
}

export function incidentStatusTone(status: AssetIncidentStatus): BadgeTone {
  if (status === 'OPEN') return 'warning';
  if (status === 'INVESTIGATING') return 'info';
  if (status === 'RESOLVED') return 'success';
  return 'danger';
}

/** Chỉ người được cấp phát (assignedToUserId) + permission asset.return mới confirm được — backend enforce ASSET_ASSIGNMENT_OWNER_ONLY. */
export function canConfirmAssignment(user: AuthUser | null, assignment: Pick<AssetAssignmentDto, 'assignedToUserId' | 'status'>): boolean {
  if (!user || !hasPermission(user, 'asset.return')) return false;
  return assignment.assignedToUserId === user.id && assignment.status === 'PENDING_CONFIRMATION';
}

export function canRequestReturn(user: AuthUser | null, assignment: Pick<AssetAssignmentDto, 'assignedToUserId' | 'status'>): boolean {
  if (!user || !hasPermission(user, 'asset.return')) return false;
  return assignment.assignedToUserId === user.id && assignment.status === 'ACTIVE';
}

/** WM/Admin nhận trả — backend chấp nhận RETURN_REQUESTED hoặc ACTIVE. */
export function canReceiveReturn(user: AuthUser | null, assignment: Pick<AssetAssignmentDto, 'status'>): boolean {
  if (!user || !hasPermission(user, 'asset.return')) return false;
  return assignment.status === 'RETURN_REQUESTED' || assignment.status === 'ACTIVE';
}

/** Backend chỉ cho assign asset IN_STOCK (ASSET_NOT_ASSIGNABLE nếu khác). */
export function isAssignable(asset: Pick<AssetDto, 'assetStatus'>): boolean {
  return asset.assetStatus === 'IN_STOCK';
}

/** Backend chỉ cho start maintenance khi IN_STOCK hoặc DAMAGED. */
export function canStartMaintenance(asset: Pick<AssetDto, 'assetStatus'>): boolean {
  return asset.assetStatus === 'IN_STOCK' || asset.assetStatus === 'DAMAGED';
}

/** Assignment đang hiệu lực (để tìm assignment hiện tại của asset). */
export function activeAssignment(assignments: AssetAssignmentDto[] | undefined): AssetAssignmentDto | null {
  if (!assignments?.length) return null;
  return (
    assignments.find((item) => item.status === 'PENDING_CONFIRMATION' || item.status === 'ACTIVE' || item.status === 'RETURN_REQUESTED') ?? null
  );
}

export function canSeePurchasePrice(user: AuthUser | null): boolean {
  return hasPermission(user, 'asset.create') || hasPermission(user, 'asset.maintenance.manage');
}

const warehouseAssetErrorMessages: Record<string, string> = {
  WAREHOUSE_NOT_FOUND: 'Không tìm thấy kho',
  FORBIDDEN_WAREHOUSE_SCOPE: 'Bạn không có quyền trên kho này',
  MATERIAL_NOT_FOUND: 'Không tìm thấy vật tư',
  MATERIAL_CODE_DUPLICATED: 'Mã vật tư đã tồn tại',
  INSUFFICIENT_STOCK: 'Tồn kho không đủ',
  INVALID_STOCK_QUANTITY: 'Số lượng không hợp lệ',
  STOCK_RECEIPT_NOT_FOUND: 'Không tìm thấy phiếu nhập',
  STOCK_RECEIPT_ALREADY_PROCESSED: 'Phiếu nhập đã được xử lý',
  MATERIAL_ISSUE_NOT_FOUND: 'Không tìm thấy phiếu xuất',
  MATERIAL_ISSUE_ALREADY_PROCESSED: 'Phiếu xuất đã được xử lý',
  MATERIAL_ISSUE_NOT_APPROVED: 'Phiếu xuất chưa được duyệt',
  MATERIAL_ISSUE_FORBIDDEN: 'Bạn không có quyền xem phiếu xuất này',
  ISSUE_TARGET_REQUIRED: 'Thiếu người/phòng ban nhận vật tư',
  TRANSFER_SAME_WAREHOUSE: 'Kho nguồn và kho đích phải khác nhau',
  STOCK_TRANSFER_NOT_FOUND: 'Không tìm thấy phiếu điều chuyển',
  STOCK_TRANSFER_ALREADY_PROCESSED: 'Phiếu điều chuyển đã được xử lý',
  STOCK_TRANSFER_NOT_APPROVED: 'Phiếu điều chuyển chưa được duyệt',
  STOCK_TRANSFER_NOT_IN_TRANSIT: 'Phiếu điều chuyển không ở trạng thái vận chuyển',
  ASSET_NOT_FOUND: 'Không tìm thấy tài sản',
  ASSET_FORBIDDEN: 'Bạn không có quyền xem tài sản này',
  ASSET_NOT_ASSIGNABLE: 'Tài sản không ở trạng thái trong kho',
  ASSET_ALREADY_ASSIGNED: 'Tài sản đang có cấp phát hiệu lực',
  ASSET_ASSIGNMENT_NOT_FOUND: 'Không tìm thấy cấp phát tài sản',
  ASSET_ASSIGNMENT_OWNER_ONLY: 'Chỉ người được cấp phát mới thao tác được',
  ASSET_ASSIGNMENT_ALREADY_PROCESSED: 'Cấp phát đã được xử lý',
  ASSET_ASSIGNMENT_NOT_ACTIVE: 'Cấp phát không còn hiệu lực',
  ASSET_RETURN_NOT_ALLOWED: 'Chưa thể nhận trả tài sản lúc này',
  ASSET_ASSIGNMENT_TARGET_REQUIRED: 'Thiếu người/phòng ban nhận tài sản',
  ASSET_ASSIGNMENT_TARGET_INVALID: 'Chỉ chọn một đích cấp phát',
  ASSET_INCIDENT_NOT_FOUND: 'Không tìm thấy sự cố',
  ASSET_MAINTENANCE_NOT_ALLOWED: 'Tài sản không thể vào bảo trì lúc này',
  ASSET_MAINTENANCE_NOT_FOUND: 'Không tìm thấy phiếu bảo trì',
  INVENTORY_CHECK_NOT_FOUND: 'Không tìm thấy phiếu kiểm kê',
  INVENTORY_CHECK_NOT_EDITABLE: 'Phiếu kiểm kê không còn chỉnh sửa được',
  INVENTORY_CHECK_NOT_SUBMITTABLE: 'Phiếu kiểm kê không thể submit',
  INVENTORY_CHECK_NOT_SUBMITTED: 'Phiếu kiểm kê chưa được submit',
  INVENTORY_CHECK_ITEM_NOT_FOUND: 'Không tìm thấy dòng kiểm kê',
};

export function mapWarehouseAssetError(error: unknown): { code: string; message: string } {
  const normalized = normalizeApiError(error);
  return { code: normalized.code, message: warehouseAssetErrorMessages[normalized.code] ?? normalized.message };
}
