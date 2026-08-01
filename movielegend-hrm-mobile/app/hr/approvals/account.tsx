import { ApprovalListScreen } from '../../../src/features/approvals/ApprovalScreens';

export default function HRAccountApprovalsRoute() {
  return <ApprovalListScreen title="Duyệt tài khoản mới" detailRoute={(id) => `/hr/approvals/${id}`} />;
}
