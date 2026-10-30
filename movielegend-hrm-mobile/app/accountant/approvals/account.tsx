import { ApprovalListScreen } from '../../../src/features/approvals/ApprovalScreens';

export default function AccountantAccountApprovalsRoute() {
  return (
    <ApprovalListScreen
      title="Duyệt tài khoản phòng Kế toán"
      departmentFilter="ACCOUNTING"
      detailRoute={(id) => `/accountant/approvals/${id}`}
    />
  );
}
