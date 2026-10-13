import { ApprovalListScreen } from '../../../src/features/approvals/ApprovalScreens';

export default function AdminAccountApprovalsRoute() {
  return <ApprovalListScreen title="Duyệt tài khoản" detailRoute={(id) => `/admin/approvals/${id}`} />;
}
