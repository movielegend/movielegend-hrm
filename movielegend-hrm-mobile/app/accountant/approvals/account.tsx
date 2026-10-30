import { ApprovalListScreen } from '../../../src/features/approvals/ApprovalScreens';

export default function AccountantAccountApprovalsRoute() {
  return <ApprovalListScreen title="Duyệt tài khoản phòng" detailRoute={(id) => `/accountant/approvals/${id}`} />;
}
