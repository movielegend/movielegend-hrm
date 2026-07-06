import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
export declare class ApprovalPolicyService {
    canApproveDepartment(user: AuthenticatedUser, departmentId: string): boolean;
    visibleDepartmentIds(user: AuthenticatedUser): string[] | null;
}
