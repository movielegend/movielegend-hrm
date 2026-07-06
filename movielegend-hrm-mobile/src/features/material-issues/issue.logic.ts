import type { AuthUser } from '../../types/user.types';
import type { MaterialIssueDto, MaterialIssueStatus, StockReceiptStatus } from '../../types/stock.types';
import { hasAnyPermission, hasPermission } from '../../utils/permissions';

type BadgeTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

/** Flow backend thật: PENDING → APPROVED → (issue: ISSUING → COMPLETED trong 1 call). */
export const issueStatusLabels: Record<MaterialIssueStatus, string> = {
  DRAFT: 'Nháp',
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
  ISSUING: 'Đang xuất',
  COMPLETED: 'Đã xuất',
  CANCELLED: 'Đã hủy',
};

export function issueStatusTone(status: MaterialIssueStatus): BadgeTone {
  if (status === 'COMPLETED') return 'success';
  if (status === 'PENDING') return 'warning';
  if (status === 'APPROVED' || status === 'ISSUING') return 'info';
  if (status === 'REJECTED' || status === 'CANCELLED') return 'danger';
  return 'neutral';
}

export const receiptStatusLabels: Record<StockReceiptStatus, string> = {
  DRAFT: 'Nháp',
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã nhập kho',
  CANCELLED: 'Đã hủy',
};

export function receiptStatusTone(status: StockReceiptStatus): BadgeTone {
  if (status === 'APPROVED') return 'success';
  if (status === 'PENDING') return 'warning';
  if (status === 'CANCELLED') return 'danger';
  return 'neutral';
}

export type IssueAction = 'approve' | 'reject' | 'issue' | 'cancel';

export function availableIssueActions(user: AuthUser | null, issue: Pick<MaterialIssueDto, 'status'>): IssueAction[] {
  const actions: IssueAction[] = [];
  if (issue.status === 'PENDING' && hasPermission(user, 'material_issue.approve')) actions.push('approve', 'reject');
  if (issue.status === 'APPROVED' && hasPermission(user, 'material_issue.issue')) actions.push('issue');
  if (
    (issue.status === 'PENDING' || issue.status === 'APPROVED') &&
    hasAnyPermission(user, ['material_issue.create', 'material_issue.approve'])
  ) {
    actions.push('cancel');
  }
  return actions;
}

export function validateIssueDraft(input: {
  warehouseId: string;
  issueTargetType: 'USER' | 'DEPARTMENT';
  issuedToUserId?: string;
  issuedToDepartmentId?: string;
  items: Array<{ materialId: string; quantity: number }>;
}): string | null {
  if (!input.warehouseId) return 'Chọn kho xuất';
  if (input.issueTargetType === 'USER' && !input.issuedToUserId) return 'Chọn nhân viên nhận';
  if (input.issueTargetType === 'DEPARTMENT' && !input.issuedToDepartmentId) return 'Chọn phòng ban nhận';
  if (!input.items.length) return 'Thêm ít nhất một vật tư';
  if (input.items.some((item) => !item.materialId || item.quantity <= 0)) return 'Số lượng từng dòng phải lớn hơn 0';
  return null;
}
