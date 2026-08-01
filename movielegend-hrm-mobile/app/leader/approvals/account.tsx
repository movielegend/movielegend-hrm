import { ApprovalListScreen } from '../../../src/features/approvals/ApprovalScreens';

export default function LeaderAccountApprovalsRoute() {
  return <ApprovalListScreen title="Duyệt tài khoản phòng" detailRoute={(id) => `/leader/approvals/${id}`} />;
}
